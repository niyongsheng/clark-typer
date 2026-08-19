// 正文格式：首行 `第X章 标题`，空一行后接正文，末尾保留单个换行
export function serializeChapter(no: number, title: string, body: string): string {
  return `第${no}章 ${title}\n\n${body.trimEnd()}\n`;
}