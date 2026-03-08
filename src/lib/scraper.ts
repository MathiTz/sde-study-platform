"use server";

import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ScrapedKnowledge {
  title: string;
  content: string; // JSON stringified structured chunks
  tags: string; // comma-separated
}

/**
 * Fetch a URL and extract the main text content using cheerio.
 * Strips navigation, ads, footers, scripts, styles.
 */
async function extractPageContent(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SDEPrepBot/1.0)" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, iframe, noscript, .ad, .sidebar, .menu, .nav").remove();

  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    new URL(url).hostname;

  // Prefer article/main content areas
  let text = "";
  const mainSelectors = ["article", "main", '[role="main"]', ".post-content", ".article-content", ".content"];

  for (const sel of mainSelectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) {
      text = el.text().trim();
      break;
    }
  }

  // Fallback to body
  if (!text) {
    text = $("body").text().trim();
  }

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").slice(0, 15_000); // Cap to avoid huge token usage

  return { title, text };
}

/**
 * Use Gemini to summarise raw page text into structured knowledge chunks.
 */
async function summariseWithAI(title: string, text: string): Promise<{ summary: string; tags: string[] }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });

  const prompt = `You are a knowledge extraction assistant for system design interview preparation.

Given the following web page content, extract the most useful system design knowledge.

## Page Title: ${title}

## Content:
${text}

Respond with a JSON object:
{
  "summary": "<structured markdown summary of the key concepts, patterns, trade-offs, and best practices — keep under 2000 chars>",
  "tags": ["<topic tag>", ...] // e.g. ["caching", "load-balancing", "database-sharding", "url-shortener"]
}

Focus on:
- Architecture patterns and when to use them
- Scaling strategies
- Trade-offs (consistency vs availability, etc.)
- Specific system design problem insights`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  try {
    const parsed = JSON.parse(raw);
    return {
      summary: String(parsed.summary || ""),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    };
  } catch {
    return { summary: text.slice(0, 2000), tags: [] };
  }
}

/**
 * Full scrape pipeline: fetch → extract → summarise → return structured data.
 */
export async function scrapeUrl(url: string): Promise<ScrapedKnowledge> {
  const { title, text } = await extractPageContent(url);
  const { summary, tags } = await summariseWithAI(title, text);

  return {
    title,
    content: JSON.stringify({ summary, rawLength: text.length }),
    tags: tags.join(","),
  };
}
