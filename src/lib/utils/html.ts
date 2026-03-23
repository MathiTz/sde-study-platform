/**
 * Strip HTML to plain text for display contexts (e.g. Excalidraw pre-population).
 * Preserves structural whitespace and decodes HTML entities.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strip HTML to compact plain text for AI evaluation (minimises tokens).
 * Preserves code block markers so the LLM can recognise code samples.
 */
export function htmlToAIText(html: string): string {
  return html
    .replace(/<pre><code[^>]*>/g, "\n```\n")
    .replace(/<\/code><\/pre>/g, "\n```\n")
    .replace(/<code[^>]*>/g, "`")
    .replace(/<\/code>/g, "`")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<li[^>]*>/g, "- ")
    .replace(/<\/li>/g, "\n")
    .replace(/<\/h[1-6]>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
