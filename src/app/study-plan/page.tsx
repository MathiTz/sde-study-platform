import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudyPlanClient } from "@/components/study-plan/StudyPlanClient";
import type { StudyPlan, QuestionType } from "@/lib/types";

export default async function StudyPlanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { isActive: true },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          questions: {
            select: {
              id: true,
              questionType: true,
              topic: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  const userProgress = await prisma.weekProgress.findMany({
    where: { userId: session.user.id },
    select: {
      weekId: true,
      score: true,
      completedAt: true,
      attemptsCount: true,
    },
  });

  const lessonProgress = await prisma.userLessonProgress.findMany({
    where: { userId: session.user.id },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No study plan available.</p>
      </div>
    );
  }

  const progressMap = new Map(userProgress.map((p) => [p.weekId, p]));

  const studyPlan: StudyPlan = {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    duration: plan.duration,
    isActive: plan.isActive,
    weeks: plan.weeks.map((week) => {
      const progress = progressMap.get(week.id);
      const lessonCompleted = week.lessonId ? completedLessonIds.has(week.lessonId) : true;
      const previousWeek = plan.weeks.find((pw) => pw.weekNumber === week.weekNumber - 1);
      const previousWeekProgress = previousWeek ? progressMap.get(previousWeek.id) : null;
      const previousWeekCompleted = previousWeekProgress?.completedAt != null;
      
      const isLocked = week.weekNumber === 1
        ? !lessonCompleted
        : !lessonCompleted || !previousWeekCompleted;

      return {
        id: week.id,
        weekNumber: week.weekNumber,
        title: week.title,
        description: week.description,
        topics: week.topics,
        lessonId: week.lessonId,
        isCompleted: week.isCompleted || progress?.completedAt != null,
        isLocked,
        questions: week.questions.map((q) => ({
          id: q.id,
          questionType: q.questionType as QuestionType,
          question: "",
          options: null,
          hint: null,
          explanation: null,
          topic: q.topic,
          difficulty: q.difficulty,
          attempts: [],
        })),
        progress: progress
          ? {
              id: week.id,
              startedAt: new Date().toISOString(),
              completedAt: progress.completedAt?.toISOString() ?? null,
              score: progress.score,
              attemptsCount: progress.attemptsCount,
            }
          : null,
      };
    }),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <StudyPlanClient initialPlan={studyPlan} userProgress={userProgress} />
    </div>
  );
}
