import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LESSON_MAPPING: Record<number, string> = {
  1: "client-server",
  2: "caching",
  3: "databases",
  4: "messaging-queues",
  5: "real-time",
  6: "cap-theorem",
  7: "file-upload",
  8: "load-balancing",
};

async function main() {
  console.log("Linking study weeks to lessons...");

  for (const [weekNumber, lessonId] of Object.entries(LESSON_MAPPING)) {
    const result = await prisma.studyWeek.updateMany({
      where: { weekNumber: parseInt(weekNumber) },
      data: { lessonId },
    });
    console.log(`Week ${weekNumber} -> ${lessonId} (${result.count} updated)`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
