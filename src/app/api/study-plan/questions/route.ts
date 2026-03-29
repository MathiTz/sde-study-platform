import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await auth();

  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get("weekId");

  if (!weekId) {
    return NextResponse.json({ error: "Week ID required" }, { status: 400 });
  }

  const questions = await prisma.studyQuestion.findMany({
    where: { weekId },
    orderBy: { id: "asc" },
  });

  let attempts: { questionId: string; userId: string; userAnswer: string; isCorrect: boolean | null; score: number | null; aiFeedback: string | null; createdAt: Date }[] = [];

  if (session?.user?.id) {
    attempts = await prisma.questionAttempt.findMany({
      where: {
        questionId: { in: questions.map((q) => q.id) },
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const attemptsByQuestion = attempts.reduce(
    (acc, a) => {
      if (!acc[a.questionId]) acc[a.questionId] = [];
      acc[a.questionId].push({
        id: "",
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        score: a.score,
        aiFeedback: a.aiFeedback ? JSON.parse(a.aiFeedback) : null,
        createdAt: a.createdAt.toISOString(),
      });
      return acc;
    },
    {} as Record<string, { id: string; userAnswer: string; isCorrect: boolean | null; score: number | null; aiFeedback: { strengths: string[]; weaknesses: string[]; suggestions: string[] } | null; createdAt: string }[]>
  );

  const parsedQuestions = questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
    attempts: attemptsByQuestion[q.id] || [],
  }));

  let correctCount = 0;
  let totalScore = 0;
  let scoredCount = 0;

  if (session?.user?.id) {
    const scoredAttempts = attempts.filter((a) => a.score !== null);
    correctCount = scoredAttempts.filter((a) => a.isCorrect).length;
    scoredCount = scoredAttempts.length;
    totalScore = scoredAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  }

  return NextResponse.json({
    questions: parsedQuestions,
    correctCount: scoredCount > 0 ? correctCount : undefined,
    totalQuestions: questions.length,
    weekScore: scoredCount > 0 ? totalScore / scoredCount : undefined,
  });
}
