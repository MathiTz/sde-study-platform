import { htmlToPlainText } from "./html";

function makeTextElement(
  id: string,
  x: number,
  y: number,
  text: string,
  fontSize: number,
  color: string
) {
  return {
    type: "text",
    id,
    x,
    y,
    width: 680,
    height: text.split("\n").length * fontSize * 1.4,
    angle: 0,
    strokeColor: color,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 100_000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100_000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    originalText: text,
    fontSize,
    fontFamily: 1,
    textAlign: "left" as const,
    verticalAlign: "top" as const,
    containerId: null,
    autoResize: true,
    lineHeight: 1.4,
  };
}

/**
 * Build a JSON-serialised array of Excalidraw text elements
 * pre-populated with Core Entities and API Design content.
 * Used so the HLD step starts with context instead of a blank canvas.
 */
export function buildInitialHLDScene(
  coreEntitiesHtml: string,
  apiDesignHtml: string
): string {
  const elements = [];
  let y = 60;
  const x = 60;

  const coreText = htmlToPlainText(coreEntitiesHtml);
  const apiText = htmlToPlainText(apiDesignHtml);

  if (coreText) {
    elements.push(makeTextElement("ce-header", x, y, "Core Entities", 20, "#1e1e1e"));
    y += 32;
    elements.push(makeTextElement("ce-content", x, y, coreText, 14, "#444444"));
    y += coreText.split("\n").length * 14 * 1.4 + 48;
  }

  if (apiText) {
    elements.push(makeTextElement("api-header", x, y, "API Design", 20, "#1e1e1e"));
    y += 32;
    elements.push(makeTextElement("api-content", x, y, apiText, 14, "#444444"));
  }

  return JSON.stringify(elements);
}
