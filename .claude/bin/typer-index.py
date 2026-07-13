#!/usr/bin/env python3
"""
typer-index: CLI for clark-typer's sqlite-vec index layer.

Usage:
    python .claude/bin/typer-index.py init
    python .claude/bin/typer-index.py chapter index --ch <N>
    python .claude/bin/typer-index.py chapter rebuild-all
    python .claude/bin/typer-index.py search --query "..." [--scope chapter|research|fragment] [--limit N]
    python .claude/bin/typer-index.py character stats --name "..."
    python .claude/bin/typer-index.py character relations --name "..."
    python .claude/bin/typer-index.py character activity
    python .claude/bin/typer-index.py research index --file <path>
    python .claude/bin/typer-index.py fragment index --file <path>
    python .claude/bin/typer-index.py prescan --concept "..."
    python .claude/bin/typer-index.py prescan --character "..." [--trait "..."]
    python .claude/bin/typer-index.py stats
"""

import argparse
import hashlib
import json
import os
import re
import sqlite3
import struct
import sys
from pathlib import Path
from typing import Optional

# ── Project paths (overridable via env for testing) ────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_DIR = Path(os.environ.get("CLARK_DB_DIR", str(PROJECT_ROOT / ".clark")))
DB_PATH = Path(os.environ.get("CLARK_DB_PATH", str(DB_DIR / "clark.db")))
CHAPTERS_DIR = Path(os.environ.get("CLARK_CHAPTERS_DIR", str(PROJECT_ROOT / "7-正文")))
CHARACTER_FILE = Path(os.environ.get("CLARK_CHARACTER_FILE", str(PROJECT_ROOT / "0-角色档案" / "核心人物.md")))
RESEARCH_DIR = Path(os.environ.get("CLARK_RESEARCH_DIR", str(PROJECT_ROOT / "8-参考资料")))


def _safe_relative_path(path: Path, base: Path) -> str:
    """Return path relative to base if possible, otherwise absolute."""
    try:
        return str(path.relative_to(base))
    except ValueError:
        return str(path)


# ── Embedding model (lazy-loaded) ─────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ── DB helpers ────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    """Open DB with sqlite-vec extension loaded."""
    if not DB_DIR.exists():
        print(f"Error: {DB_DIR} does not exist. Run `init` first to create the database.", file=sys.stderr)
        sys.exit(1)
    import sqlite_vec
    db = sqlite3.connect(str(DB_PATH))
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=5000")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    return db


def embed(text: str) -> bytes:
    """Return raw float32 bytes for a text embedding."""
    vec = get_model().encode(text, normalize_embeddings=True)
    return struct.pack(f"{len(vec)}f", *vec)


def embed_many(texts: list[str]) -> list[bytes]:
    """Batch embed multiple texts."""
    vecs = get_model().encode(texts, normalize_embeddings=True)
    return [struct.pack(f"{len(v)}f", *v) for v in vecs]


# ── Init ──────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volume INTEGER NOT NULL DEFAULT 0,
    chapter_number INTEGER NOT NULL,
    title TEXT DEFAULT '',
    path TEXT NOT NULL,
    state TEXT DEFAULT 'written',
    summary TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(volume, chapter_number)
);

CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    bio TEXT DEFAULT '',
    current_state TEXT DEFAULT '',
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS chapter_characters (
    chapter_id INTEGER NOT NULL,
    character_id INTEGER NOT NULL,
    role_type TEXT DEFAULT 'cameo',
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    UNIQUE(chapter_id, character_id)
);

CREATE TABLE IF NOT EXISTS character_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_a_id INTEGER NOT NULL,
    character_b_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT '',
    description TEXT DEFAULT '',
    FOREIGN KEY (character_a_id) REFERENCES characters(id),
    FOREIGN KEY (character_b_id) REFERENCES characters(id)
);

CREATE TABLE IF NOT EXISTS research (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT DEFAULT '',
    content TEXT NOT NULL,
    source_path TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fragments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    embedding BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_chapters USING vec0(
    embedding float[384]
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_research USING vec0(
    embedding float[384]
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_fragments USING vec0(
    embedding float[384]
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_characters USING vec0(
    embedding float[384]
);

CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapter_chars_char ON chapter_characters(character_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON embeddings(entity_type, entity_id);
"""


def cmd_init():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    db = get_db()
    db.executescript(SCHEMA_SQL)
    db.commit()
    db.close()
    print(f"[init] Database created at {DB_PATH}")


# ── Chapter Indexing ──────────────────────────────────────────

def _parse_chapter_file(path: Path) -> dict:
    """Extract chapter_number, title, content from a chapter file."""
    text = path.read_text(encoding="utf-8")
    chapter_number = 0
    title = ""

    # Try to extract chapter number from filename or first line
    m = re.search(r"第(\d+)章", path.stem)
    if m:
        chapter_number = int(m.group(1))

    # Try to extract title from first line
    lines = text.strip().split("\n")
    if lines:
        first = lines[0].strip()
        if first.startswith("#"):
            title = first.lstrip("#").strip()
        elif "章" in first:
            title = first
        # If title is just "第X章", try next non-empty line
        if re.match(r"^第\d+章$", title):
            title = ""
            for line in lines[1:]:
                if line.strip():
                    title = line.strip()[:80]
                    break

    summary = text[:300].replace("\n", " ") if len(text) > 300 else text.replace("\n", " ")

    return {
        "chapter_number": chapter_number,
        "title": title,
        "content": text,
        "summary": summary,
        "word_count": len(text),
    }


def _extract_characters(text: str, known_names: set[str]) -> list[str]:
    """Simple character extraction — find known character names in text."""
    found = set()
    for name in known_names:
        if name in text:
            found.add(name)
    return sorted(found)


def _load_known_character_names(db) -> set[str]:
    """Load all known character names from DB or character file."""
    names = set()
    try:
        rows = db.execute("SELECT name FROM characters").fetchall()
        names.update(r["name"] for r in rows)
    except sqlite3.OperationalError:
        pass  # DB not yet populated — this is normal on first run
    # Also scan the character file
    if CHARACTER_FILE.exists():
        text = CHARACTER_FILE.read_text(encoding="utf-8")
        for m in re.finditer(r"^##\s+(.+)", text, re.MULTILINE):
            names.add(m.group(1).strip())
        for m in re.finditer(r"\*\*姓名\*\*：(.+)", text):
            names.add(m.group(1).strip())
    return names


def cmd_chapter_index(chapter_number: int):
    """Index a single chapter by its chapter number."""
    # Find the chapter file — try specific match first
    chapter_paths = list(CHAPTERS_DIR.glob(f"第{chapter_number}章.*"))
    if not chapter_paths:
        # Fallback: substring match
        chapter_paths = list(CHAPTERS_DIR.glob(f"*{chapter_number}*"))
    if not chapter_paths:
        print(f"[error] Chapter {chapter_number} not found in {CHAPTERS_DIR}")
        sys.exit(1)

    path = chapter_paths[0]
    data = _parse_chapter_file(path)
    db = get_db()

    # Upsert chapter record
    volume = 0  # default; multi-volume support can pass volume explicitly
    db.execute(
        """INSERT INTO chapters (volume, chapter_number, title, path, summary, word_count, state)
           VALUES (?, ?, ?, ?, ?, ?, 'written')
           ON CONFLICT(volume, chapter_number) DO UPDATE SET
               title=excluded.title, path=excluded.path,
               summary=excluded.summary, word_count=excluded.word_count""",
        (volume, data["chapter_number"], data["title"],
         str(_safe_relative_path(path, PROJECT_ROOT)),
         data["summary"], data["word_count"]),
    )
    chapter_id = db.execute(
        "SELECT id FROM chapters WHERE volume=? AND chapter_number=?", (volume, data["chapter_number"])
    ).fetchone()["id"]

    # Extract and link characters
    known = _load_known_character_names(db)
    found = _extract_characters(data["content"], known)
    for cname in found:
        c = db.execute("SELECT id FROM characters WHERE name=?", (cname,)).fetchone()
        if c:
            db.execute(
                "INSERT OR IGNORE INTO chapter_characters (chapter_id, character_id, role_type) VALUES (?, ?, 'cameo')",
                (chapter_id, c["id"]),
            )

    # Generate and store embedding
    embed_text = f"{data['title']} {data['summary']} {data['content'][:2000]}"
    try:
        vec = embed(embed_text)
    except Exception as e:
        print(f"[error] Embedding failed for chapter {chapter_number}: {e}", file=sys.stderr)
        print("[warning] Chapter record saved without vector — run `typer-index.py chapter index` again when model is available", file=sys.stderr)
        db.commit()
        db.close()
        return
    db.execute(
        "INSERT OR REPLACE INTO embeddings (entity_type, entity_id, embedding) VALUES ('chapter', ?, ?)",
        (chapter_id, vec),
    )
    # sqlite-vec virtual table — delete old then insert
    db.execute("DELETE FROM vec_chapters WHERE rowid=?", (chapter_id,))
    db.execute("INSERT INTO vec_chapters (rowid, embedding) VALUES (?, ?)", (chapter_id, vec))

    db.commit()
    db.close()
    print(f"[index] Chapter {chapter_number} «{data['title']}» indexed ({data['word_count']} chars, {len(found)} characters)")


def cmd_chapter_rebuild_all():
    """Re-index all chapters from scratch."""
    paths = sorted(CHAPTERS_DIR.glob("第*章.*")) or sorted(CHAPTERS_DIR.glob("第*章*"))
    if not paths:
        print("[error] No chapter files found")
        sys.exit(1)

    for p in paths:
        m = re.search(r"(\d+)", p.stem)
        if m:
            cmd_chapter_index(int(m.group(1)))
    print(f"[rebuild] All chapters re-indexed")


# ── Search ────────────────────────────────────────────────────

def cmd_search(query: str, scope: str = "chapter", limit: int = 5):
    """Semantic search across indexed content."""
    vec = embed(query)
    db = get_db()

    table_map = {
        "chapter": ("vec_chapters", "chapters", "chapter_number", "title"),
        "research": ("vec_research", "research", "id", "title"),
        "fragment": ("vec_fragments", "fragments", "id", "content"),
    }
    if scope not in table_map:
        print(f"[error] Unknown scope: {scope}. Choose from: {', '.join(table_map)}")
        sys.exit(1)

    vtable, table, id_col, title_col = table_map[scope]

    results = db.execute(
        f"""
        SELECT v.rowid, v.distance, t.{id_col} as entity_id,
               CASE WHEN '{title_col}' = 'title' THEN t.title
                    WHEN '{title_col}' = 'content' THEN substr(t.content, 1, 200)
                    WHEN '{title_col}' = 'chapter_number' THEN '第' || t.chapter_number || '章 ' || t.title
               END as label
        FROM {vtable} v
        JOIN {table} t ON v.rowid = t.id
        WHERE v.embedding MATCH ?
        ORDER BY v.distance
        LIMIT ?
        """,
        (vec, limit),
    ).fetchall()

    if not results:
        print("(no results)")
        return

    for r in results:
        score = 1 - r["distance"]  # cosine similarity
        print(f"  [{score:.2f}] {r['label']}")
    db.close()


# ── Character ─────────────────────────────────────────────────

def cmd_character_stats(name: str):
    """Show character appearance statistics."""
    db = get_db()
    c = db.execute("SELECT * FROM characters WHERE name=?", (name,)).fetchone()
    if not c:
        print(f"[error] Character '{name}' not found")
        db.close()
        sys.exit(1)

    chapters = db.execute(
        """SELECT c.chapter_number, c.title, cc.role_type
           FROM chapter_characters cc
           JOIN chapters c ON cc.chapter_id = c.id
           WHERE cc.character_id = ?
           ORDER BY c.chapter_number""",
        (c["id"],),
    ).fetchall()

    relations = db.execute(
        """SELECT c2.name, cr.relation_type, cr.description
           FROM character_relations cr
           JOIN characters c1 ON cr.character_a_id = c1.id
           JOIN characters c2 ON cr.character_b_id = c2.id
           WHERE c1.id = ?
           UNION
           SELECT c1.name, cr.relation_type, cr.description
           FROM character_relations cr
           JOIN characters c2 ON cr.character_a_id = c2.id
           JOIN characters c1 ON cr.character_b_id = c1.id
           WHERE c2.id = ?""",
        (c["id"], c["id"]),
    ).fetchall()

    print(f"  {name} ({c['status']})")
    print(f"  Bio: {c['bio'][:200]}" if c["bio"] else "  Bio: —")
    print(f"  Current state: {c['current_state'][:200]}" if c["current_state"] else "  Current state: —")
    print(f"  Appears in {len(chapters)} chapters:")
    for ch in chapters[-10:]:  # last 10 appearances
        print(f"    - 第{ch['chapter_number']}章 {ch['title']} ({ch['role_type']})")
    if relations:
        print(f"  Relationships ({len(relations)}):")
        for r in relations:
            print(f"    - {r[0]} ({r[1]}) {r[2]}")
    db.close()


def cmd_character_relations(name: str):
    """Show character's relationship network."""
    cmd_character_stats(name)  # relations included in stats


def cmd_character_activity():
    """Show all characters and their activity (last appearance, frequency)."""
    db = get_db()
    chars = db.execute(
        """SELECT c.name, c.status,
                  COUNT(cc.chapter_id) as appear_count,
                  MAX(ch.chapter_number) as last_chapter
           FROM characters c
           LEFT JOIN chapter_characters cc ON c.id = cc.character_id
           LEFT JOIN chapters ch ON cc.chapter_id = ch.id
           GROUP BY c.id
           ORDER BY last_chapter DESC NULLS LAST"""
    ).fetchall()

    print(f"{'Character':<20} {'Status':<10} {'Appearances':<12} {'Last Chapter'}")
    print("-" * 60)
    for c in chars:
        last = f"第{c['last_chapter']}章" if c["last_chapter"] else "—"
        print(f"{c['name']:<20} {c['status']:<10} {c['appear_count']:<12} {last}")
    db.close()


# ── Research/Fragment Index ───────────────────────────────────

def cmd_research_index(file_path: str):
    """Index a research document."""
    path = Path(file_path)
    if not path.exists():
        print(f"[error] File not found: {file_path}")
        sys.exit(1)

    content = path.read_text(encoding="utf-8")
    title = path.stem
    category = path.parent.name if path.parent.name != "8-参考资料" else "general"

    db = get_db()
    db.execute(
        "INSERT INTO research (title, category, content, source_path) VALUES (?, ?, ?, ?)",
        (title, category, content, _safe_relative_path(path, PROJECT_ROOT)),
    )
    rid = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    vec = embed(content[:2000])
    db.execute(
        "INSERT OR REPLACE INTO embeddings (entity_type, entity_id, embedding) VALUES ('research', ?, ?)",
        (rid, vec),
    )
    db.execute("DELETE FROM vec_research WHERE rowid=?", (rid,))
    db.execute("INSERT INTO vec_research (rowid, embedding) VALUES (?, ?)", (rid, vec))

    db.commit()
    db.close()
    print(f"[index] Research '{title}' indexed (id={rid})")


def cmd_fragment_index(file_path: str):
    """Index fragments from a file (each ## section as one fragment)."""
    path = Path(file_path)
    if not path.exists():
        print(f"[error] File not found: {file_path}")
        sys.exit(1)

    content = path.read_text(encoding="utf-8")
    fragments = re.split(r"^##\s+", content, flags=re.MULTILINE)

    db = get_db()
    count = 0
    for frag in fragments:
        frag = frag.strip()
        if len(frag) < 50:
            continue
        # First line is the title/header
        lines = frag.split("\n")
        header = lines[0].strip()
        body = "\n".join(lines[1:]).strip()

        db.execute(
            "INSERT INTO fragments (content, source, tags) VALUES (?, ?, ?)",
            (f"{header}: {body[:500]}", _safe_relative_path(path, PROJECT_ROOT), header),
        )
        fid = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        vec = embed(f"{header} {body[:2000]}")
        db.execute(
            "INSERT OR REPLACE INTO embeddings (entity_type, entity_id, embedding) VALUES ('fragment', ?, ?)",
            (fid, vec),
        )
        db.execute("DELETE FROM vec_fragments WHERE rowid=?", (fid,))
        db.execute("INSERT INTO vec_fragments (rowid, embedding) VALUES (?, ?)", (fid, vec))
        count += 1

    db.commit()
    db.close()
    print(f"[index] {count} fragments indexed from {file_path}")


# ── Prescan ───────────────────────────────────────────────────

def cmd_prescan_concept(concept: str):
    """Find all chapters semantically related to a concept."""
    print(f"[prescan] Scanning for concept: {concept}")
    vec = embed(concept)
    db = get_db()

    results = db.execute(
        """SELECT v.rowid, v.distance, ch.chapter_number, ch.title
           FROM vec_chapters v
           JOIN chapters ch ON v.rowid = ch.id
           WHERE v.embedding MATCH ?
           ORDER BY v.distance
           LIMIT 15""",
        (vec,),
    ).fetchall()

    print(f"  Top {len(results)} semantically related chapters:")
    for r in results:
        score = 1 - r["distance"]
        bar = "█" * int(score * 20)
        print(f"  [{score:.2f}] {bar} 第{r['chapter_number']}章 {r['title']}")

    if not results:
        print("  (no results — no chapters indexed yet)")
    db.close()


def cmd_prescan_character(name: str, trait: Optional[str] = None):
    """Scan character arc for potential inconsistencies."""
    db = get_db()
    c = db.execute("SELECT * FROM characters WHERE name=?", (name,)).fetchone()
    if not c:
        print(f"[error] Character '{name}' not found in index (check case or index first)")
        db.close()
        sys.exit(1)

    chapters = db.execute(
        """SELECT ch.chapter_number, ch.title
           FROM chapter_characters cc
           JOIN chapters ch ON cc.chapter_id = ch.id
           WHERE cc.character_id = ?
           ORDER BY ch.chapter_number""",
        (c["id"]),
    ).fetchall()

    print(f"[prescan] Character: {name} ({len(chapters)} appearances)")
    print(f"  Chapter arc: ", end="")
    if chapters:
        arc = " → ".join([f"第{ch['chapter_number']}章" for ch in chapters[:8]])
        if len(chapters) > 8:
            arc += f" … → 第{chapters[-1]['chapter_number']}章"
        print(arc)
    else:
        print("(no indexed appearances)")

    if trait:
        print(f"[prescan] Scanning for trait: {trait}")
        vec = embed(f"{name} {trait}")
        results = db.execute(
            """SELECT v.rowid, v.distance, ch.chapter_number, ch.title
               FROM vec_chapters v
               JOIN chapters ch ON v.rowid = ch.id
               JOIN chapter_characters cc ON cc.chapter_id = ch.id AND cc.character_id = ?
               WHERE v.embedding MATCH ?
               ORDER BY v.distance
               LIMIT 10""",
            (c["id"], vec),
        ).fetchall()
        for r in results:
            score = 1 - r["distance"]
            print(f"  [{score:.2f}] 第{r['chapter_number']}章 {r['title']}")

    db.close()


# ── Stats ─────────────────────────────────────────────────────

def cmd_stats():
    """Show database overview."""
    db = get_db()
    info = {
        "chapters": db.execute("SELECT COUNT(*) FROM chapters").fetchone()[0],
        "characters": db.execute("SELECT COUNT(*) FROM characters").fetchone()[0],
        "research": db.execute("SELECT COUNT(*) FROM research").fetchone()[0],
        "fragments": db.execute("SELECT COUNT(*) FROM fragments").fetchone()[0],
        "chapter_vectors": db.execute("SELECT COUNT(*) FROM vec_chapters").fetchone()[0],
        "relations": db.execute("SELECT COUNT(*) FROM character_relations").fetchone()[0],
        "total_chars": db.execute("SELECT COALESCE(SUM(word_count), 0) FROM chapters").fetchone()[0],
    }

    db_path = Path(DB_PATH)
    info["db_size_mb"] = db_path.stat().st_size / 1024 / 1024 if db_path.exists() else 0

    print(f"Database: {DB_PATH}")
    print(f"Size:     {info['db_size_mb']:.1f} MB")
    print(f"Chapters: {info['chapters']} ({info['total_chars']:,} chars)")
    print(f"Vectors:  {info['chapter_vectors']}")
    print(f"Characters: {info['characters']}")
    print(f"Relations: {info['relations']}")
    print(f"Research: {info['research']}")
    print(f"Fragments: {info['fragments']}")

    if info["chapters"] > 0:
        print("\n--- Chapter Index Status ---")
        rows = db.execute(
            "SELECT chapter_number, title, word_count, state FROM chapters ORDER BY chapter_number"
        ).fetchall()
        for r in rows:
            marker = "✓" if r["state"] == "written" else "○"
            print(f"  {r['chapter_number']:>4} {marker} {r['title'][:40]:<40} {r['word_count']:>6}")

    db.close()


# ── Main ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="typer-index: semantic index for clark-typer")
    sub = parser.add_subparsers(dest="command")

    # init
    sub.add_parser("init", help="Initialize database")

    # chapter
    ch = sub.add_parser("chapter", help="Chapter index operations")
    ch_sub = ch.add_subparsers(dest="action")
    ch_index = ch_sub.add_parser("index", help="Index a single chapter")
    ch_index.add_argument("--ch", type=int, required=True)
    ch_sub.add_parser("rebuild-all", help="Re-index all chapters")

    # search
    s = sub.add_parser("search", help="Semantic search")
    s.add_argument("--query", required=True)
    s.add_argument("--scope", default="chapter", choices=["chapter", "research", "fragment"])
    s.add_argument("--limit", type=int, default=5)

    # character
    char = sub.add_parser("character", help="Character queries")
    char_sub = char.add_subparsers(dest="action")
    cs = char_sub.add_parser("stats", help="Character stats")
    cs.add_argument("--name", required=True)
    cr = char_sub.add_parser("relations", help="Character relations")
    cr.add_argument("--name", required=True)
    char_sub.add_parser("activity", help="All character activity")

    # research
    r = sub.add_parser("research", help="Research indexing")
    r_sub = r.add_subparsers(dest="action")
    ri = r_sub.add_parser("index", help="Index research file")
    ri.add_argument("--file", required=True)

    # fragment
    f = sub.add_parser("fragment", help="Fragment indexing")
    f_sub = f.add_subparsers(dest="action")
    fi = f_sub.add_parser("index", help="Index fragment file")
    fi.add_argument("--file", required=True)

    # prescan
    p = sub.add_parser("prescan", help="Consistency prescan")
    p.add_argument("--concept")
    p.add_argument("--character")
    p.add_argument("--trait")

    # stats
    sub.add_parser("stats", help="Database overview")

    args = parser.parse_args()

    if args.command == "init":
        cmd_init()
    elif args.command == "chapter":
        if args.action == "index":
            cmd_chapter_index(args.ch)
        elif args.action == "rebuild-all":
            cmd_chapter_rebuild_all()
        else:
            parser.print_help()
    elif args.command == "search":
        cmd_search(args.query, args.scope, args.limit)
    elif args.command == "character":
        if args.action == "stats":
            cmd_character_stats(args.name)
        elif args.action == "relations":
            cmd_character_relations(args.name)
        elif args.action == "activity":
            cmd_character_activity()
        else:
            parser.print_help()
    elif args.command == "research":
        if args.action == "index":
            cmd_research_index(args.file)
        else:
            parser.print_help()
    elif args.command == "fragment":
        if args.action == "index":
            cmd_fragment_index(args.file)
        else:
            parser.print_help()
    elif args.command == "prescan":
        if args.concept:
            cmd_prescan_concept(args.concept)
        elif args.character:
            cmd_prescan_character(args.character, args.trait)
        else:
            print("Usage: prescan --concept <concept> OR --character <name> [--trait <trait>]")
    elif args.command == "stats":
        cmd_stats()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
