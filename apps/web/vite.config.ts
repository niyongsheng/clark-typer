import { listContentFiles, listReleaseFiles, readBundle, readTextFile, writeTextFile } from "@clark-typer/content/node";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

// 本文件位于 <repo>/apps/web/vite.config.ts，向上两级即仓库根目录。
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function json(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 5_000_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse, url: string): Promise<void> {
  const u = new URL(url, "http://localhost");
  try {
    if (req.method === "GET" && u.pathname === "/api/content") {
      json(res, 200, readBundle(root));
      return;
    }
    if (req.method === "GET" && u.pathname === "/api/files") {
      json(res, 200, listContentFiles(root));
      return;
    }
    if (req.method === "GET" && u.pathname === "/api/releases") {
      json(res, 200, listReleaseFiles(root));
      return;
    }
    if (req.method === "GET" && u.pathname === "/api/file") {
      const p = u.searchParams.get("path") ?? "";
      if (!p) {
        json(res, 400, { error: "missing path" });
        return;
      }
      json(res, 200, { path: p, content: readTextFile(root, p) });
      return;
    }
    if (req.method === "PUT" && u.pathname === "/api/file") {
      const body = (await readBody(req)) as { path?: string; content?: string };
      if (!body.path || typeof body.content !== "string") {
        json(res, 400, { error: "invalid body" });
        return;
      }
      writeTextFile(root, body.path, body.content);
      json(res, 200, { ok: true });
      return;
    }
    json(res, 404, { error: "not found" });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

function apiPlugin(): Plugin {
  return {
    name: "clark-typer-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "/";
        if (!url.startsWith("/api")) {
          next();
          return;
        }
        void handle(req, res, url);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  // GitHub Pages 部署在子路径（/clark-typer/），Vercel 为根路径；CI 通过环境变量注入。
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    fs: { allow: [root] },
  },
});