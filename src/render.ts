import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import type { Block, DocModel } from "./types.js";

const C = { primary: "#1f4e79", text: "#222222", codeBg: "#f3f4f6", noteBg: "#fff7e0", line: "#bbbbbb" };
const M = 50;

export function render(model: DocModel): Promise<void> {
  const doc = new PDFDocument({ size: "A4", margin: M, bufferPages: true });
  mkdirSync(path.dirname(model.file), { recursive: true });
  const out = createWriteStream(model.file);
  doc.pipe(out);

  const width = doc.page.width - M * 2;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const ensure = (h: number) => {
    if (doc.y + h > bottom()) doc.addPage();
  };
  const body = () => doc.font("Helvetica").fontSize(10.5).fillColor(C.text);

  function box(text: string, font: string, size: number, bg: string) {
    doc.font(font).fontSize(size);
    const h = doc.heightOfString(text, { width: width - 16 }) + 14;
    ensure(h);
    const y = doc.y;
    doc.rect(M, y, width, h).fill(bg);
    doc.fillColor(C.text).text(text, M + 8, y + 7, { width: width - 16 });
    doc.x = M;
    doc.y = y + h;
  }

  function drawTable(headers: string[], rows: string[][], widths?: number[]) {
    const ws = widths ?? headers.map(() => 1);
    const sum = ws.reduce((a, b) => a + b, 0);
    const colW = ws.map((w) => (w / sum) * width);
    const pad = 4;
    const drawRow = (cells: string[], header: boolean) => {
      doc.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(9.5);
      const h = Math.max(...cells.map((c, i) => doc.heightOfString(c, { width: colW[i] - pad * 2 }))) + pad * 2;
      if (doc.y + h > bottom()) {
        doc.addPage();
        if (!header) drawRow(headers, true);
      }
      const y = doc.y;
      let x = M;
      cells.forEach((c, i) => {
        doc.rect(x, y, colW[i], h).fillAndStroke(header ? C.primary : "#ffffff", C.line);
        doc.fillColor(header ? "#ffffff" : C.text)
          .font(header ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9.5)
          .text(c, x + pad, y + pad, { width: colW[i] - pad * 2 });
        x += colW[i];
      });
      doc.x = M;
      doc.y = y + h;
    };
    ensure(60);
    drawRow(headers, true);
    rows.forEach((r) => drawRow(r, false));
  }

  function block(b: Block) {
    body();
    switch (b.type) {
      case "p":
        doc.text(b.text, { align: "left" });
        break;
      case "bullets":
        doc.list(b.items, { bulletRadius: 2 });
        break;
      case "numbered":
        doc.list(b.items, { listType: "numbered" });
        break;
      case "code":
        box(b.code, "Courier", 9, C.codeBg);
        break;
      case "note":
        box(b.text, "Helvetica-Oblique", 10, C.noteBg);
        break;
      case "h3":
        ensure(70);
        doc.font("Helvetica-Bold").fontSize(12.5).fillColor(C.primary).text(b.text);
        break;
      case "h4":
        ensure(60);
        doc.font("Helvetica-Bold").fontSize(11).fillColor(C.text).text(b.text);
        break;
      case "table":
        drawTable(b.headers, b.rows, b.widths);
        break;
    }
    doc.moveDown(0.6);
  }

  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.primary).text(model.title, { align: "left" });
  doc.moveDown(0.6);
  drawTable(["Field", "Value"], model.meta.map(([k, v]) => [k, v]), [1, 5]);
  doc.moveDown(1);

  for (const s of model.sections) {
    ensure(90);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(C.primary).text(s.title);
    doc.moveTo(M, doc.y + 2).lineTo(M + width, doc.y + 2).strokeColor(C.primary).lineWidth(1).stroke();
    doc.moveDown(0.8);
    s.blocks.forEach(block);
    doc.moveDown(0.6);
  }

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.font("Helvetica").fontSize(8.5).fillColor("#888888")
      .text(`${model.title}  |  Page ${i + 1}/${range.count}`, M, doc.page.height - 32, {
        width,
        align: "center",
        lineBreak: false,
      });
  }
  doc.end();
  return new Promise((resolve) => out.on("finish", () => resolve()));
}
