export type Block =
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; code: string }
  | { type: "note"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "table"; headers: string[]; rows: string[][]; widths?: number[] };

export interface Section {
  title: string;
  blocks: Block[];
}

export interface DocModel {
  file: string;
  title: string;
  meta: [string, string][];
  metaHeaders?: [string, string];
  pageLabel?: string;
  sections: Section[];
}

export const p = (text: string): Block => ({ type: "p", text });
export const ul = (...items: string[]): Block => ({ type: "bullets", items });
export const ol = (...items: string[]): Block => ({ type: "numbered", items });
export const code = (src: string): Block => ({ type: "code", code: src.replace(/^\n|\n$/g, "") });
export const note = (text: string): Block => ({ type: "note", text });
export const h3 = (text: string): Block => ({ type: "h3", text });
export const h4 = (text: string): Block => ({ type: "h4", text });
export const table = (headers: string[], rows: string[][], widths?: number[]): Block => ({
  type: "table",
  headers,
  rows,
  widths,
});
