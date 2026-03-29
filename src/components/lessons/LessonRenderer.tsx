"use client";

import { useMemo } from "react";
import { parseLessonContent, renderInline } from "@/lib/lessons/parser";
import type { LessonContentBlock } from "@/lib/lessons";
import { createLowlight, common } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(common);

function CodeBlock({ content, language }: { content: string; language: string }) {
  const highlighted = useMemo(() => {
    const lang = language.toLowerCase();
    try {
      if (lowlight.listLanguages().includes(lang)) {
        const result = lowlight.highlight(lang, content);
        return toHtml(result);
      }
      return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } catch {
      return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [content, language]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-4">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {language}
        </span>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

interface LessonRendererProps {
  content: string;
}

function ContentBlock({ block, index }: { block: LessonContentBlock; index: number }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={index}
          className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700"
          dangerouslySetInnerHTML={{ __html: renderInline(block.content || "") }}
        />
      );
    case "h3":
      return (
        <h3
          key={index}
          className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3"
          dangerouslySetInnerHTML={{ __html: renderInline(block.content || "") }}
        />
      );
    case "p":
      return (
        <p
          key={index}
          className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: renderInline(block.content || "") }}
        />
      );
    case "code":
      return (
        <CodeBlock key={index} content={block.content || ""} language={block.language || "text"} />
      );
    case "list":
      return (
        <ul key={index} className="list-disc list-outside ml-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
          {block.items?.map((item, i) => (
            <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>
      );
    case "table":
      return (
        <div key={index} className="overflow-x-auto my-6">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {block.headers?.map((header, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800"
                    dangerouslySetInnerHTML={{ __html: renderInline(header) }}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {block.rows?.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: renderInline(cell) }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function LessonRenderer({ content }: LessonRendererProps) {
  const parsed = useMemo(() => parseLessonContent(content), [content]);

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {parsed.map((block, idx) => (
        <ContentBlock key={idx} block={block} index={idx} />
      ))}
    </div>
  );
}
