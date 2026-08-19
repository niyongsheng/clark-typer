import type { BookMeta } from "../types.js";

function pick(re: RegExp, raw: string): string {
  const m = raw.match(re);
  return m ? m[1].trim() : "";
}

// clark 的 1-思想实验/选题.md 无强制字段，采用宽松正则尽力提取，缺失时返回空字符串。
// 标题优先匹配 `# 选题：《沉寂的回声》（Echoes of Silence）` 形态。
export function parseBookMeta(
  topicRaw: string,
  intentRaw: string,
  styleRaw: string,
): BookMeta {
  return {
    title:
      pick(/选题[：:]\s*《([^》]+)》/, topicRaw) ||
      pick(/(?:书名|标题|作品名)[：:]\s*《?([^《》\n]+)》?/, topicRaw),
    englishTitle:
      pick(/《[^》]+》[（(]([^）)]+)[）)]/, topicRaw) || pick(/英文名[：:]\s*([^\n]+)/, topicRaw),
    author: pick(/作者[：:]\s*([^\n]+)/, topicRaw),
    genre: pick(/(?:类型|题材)[：:]\s*([^\n]+)/, topicRaw),
    tags: [],
    topicRaw,
    intentRaw,
    styleRaw,
  };
}