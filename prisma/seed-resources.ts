import { PrismaClient } from "@prisma/client";
import resources from "../src/lib/lessons/resources.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding study resources...");

  const sources = resources.sources as Record<
    string,
    { topic: string; resources: Array<{ title: string; url: string; source: string; category?: string }> }
  >;

  let count = 0;

  for (const [lessonId, data] of Object.entries(sources)) {
    const topics = lessonId
      .split("-")
      .map((t) => t.toLowerCase())
      .join(",");
    const lessonTopics = `${topics},sde,system-design,interview-prep`;

    for (const resource of data.resources) {
      const existing = await prisma.studyResource.findFirst({
        where: { url: resource.url },
      });

      if (!existing) {
        await prisma.studyResource.create({
          data: {
            title: resource.title,
            url: resource.url,
            source: resource.source,
            topics: lessonTopics,
            difficulty: "INTERMEDIATE",
            description: `Learn more about ${data.topic} from ${resource.source}`,
            resourceType: mapCategoryToType(resource.category || "Documentation"),
          },
        });
        count++;
        console.log(`  Created: ${resource.title}`);
      } else {
        console.log(`  Skipped (exists): ${resource.title}`);
      }
    }
  }

  console.log(`\nSeeded ${count} new resources.`);
}

function mapCategoryToType(category: string): string {
  const mapping: Record<string, string> = {
    Documentation: "DOCUMENTATION",
    Tutorial: "ARTICLE",
    Guide: "ARTICLE",
    Blog: "ARTICLE",
    Course: "VIDEO",
    "Research Paper": "ARTICLE",
  };
  return mapping[category] || "ARTICLE";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
