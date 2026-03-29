import type { LessonContentBlock } from "@/lib/lessons";

export function parseLessonContent(content: string): LessonContentBlock[] {
  const lines = content.trim().split("\n");
  const result: LessonContentBlock[] = [];
  let i = 0;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      result.push({ type: "list", items: [...listItems] });
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      result.push({ type: "table", headers: tableHeaders, rows: tableRows });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        result.push({ type: "code", content: codeLines.join("\n"), language: codeLanguage });
        codeLines = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || "text";
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      flushTable();
      result.push({ type: "h2", content: line.slice(3) });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      flushTable();
      result.push({ type: "h3", content: line.slice(4) });
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      flushList();
      if (!inTable) inTable = true;
      const cells = line.split("|").filter((_c, idx) => idx !== 0 && idx !== line.split("|").length - 1).map(c => c.trim());
      if (cells.every(c => c.match(/^-+$/))) {
        i++;
        continue;
      }
      if (tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      i++;
      continue;
    }

    if (line.match(/^\d+\.\s/) || line.match(/^[*-]\s/)) {
      flushTable();
      inList = true;
      const match = line.match(/^[*-]\s(.+)$/);
      if (match) {
        listItems.push(match[1]);
      } else {
        const numMatch = line.match(/^\d+\.\s(.+)$/);
        if (numMatch) listItems.push(numMatch[1]);
      }
      i++;
      continue;
    }

    if (inList) flushList();
    if (inTable) flushTable();

    if (line.trim()) {
      result.push({ type: "p", content: line });
    }
    i++;
  }

  flushList();
  flushTable();

  return result;
}

export function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class=\"px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono\">$1</code>");
}
