import type { ContentBundle, FileNode } from "@clark-typer/content";

export const IS_DEV = import.meta.env.DEV;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// dev 模式经中间件直读仓库目录；生产构建读 content:sync 静态快照。
export function fetchContent(): Promise<ContentBundle> {
  if (IS_DEV) return request<ContentBundle>("/api/content");
  return fetch(`${import.meta.env.BASE_URL}content.json`).then((r) => {
    if (!r.ok) throw new Error(`content.json ${r.status}`);
    return r.json();
  });
}

export function fetchFiles(): Promise<FileNode[]> {
  return request<FileNode[]>("/api/files");
}

export function fetchReleases(): Promise<FileNode[]> {
  return request<FileNode[]>("/api/releases");
}

export function fetchFile(path: string): Promise<{ path: string; content: string }> {
  return request(`/api/file?path=${encodeURIComponent(path)}`);
}

export function saveFile(path: string, content: string): Promise<{ ok: boolean }> {
  return request("/api/file", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
}