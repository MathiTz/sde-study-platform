import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getAIProvider } from "@/lib/ai/gemini";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { questionId, userAnswer, type } = body;

  if (!questionId || !userAnswer || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const question = await prisma.studyQuestion.findUnique({
    where: { id: questionId },
    include: { week: true },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  let isCorrect: boolean | null = null;
  let score: number | null = null;
  let aiFeedback: string | null = null;

  if (type === "SINGLE" || type === "MULTIPLE") {
    const correctOptions = JSON.parse(question.options || "[]")
      .filter((o: { isCorrect: boolean }) => o.isCorrect)
      .map((o: { text: string }) => o.text);

    const selectedOptions = JSON.parse(userAnswer);
    const correctSet = new Set(correctOptions);
    const selectedSet = new Set(selectedOptions);

    isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every((o) => selectedSet.has(o));

    score = isCorrect ? 100 : 0;
  } else {
    const systemPrompt = `You are evaluating a System Design interview study question response. 
Evaluate the quality of the response based on:
1. Understanding of core concepts
2. Technical accuracy
3. Completeness
4. Clear communication

Provide a score from 0-100 and structured feedback with:
- strengths: What was done well
- weaknesses: What could be improved
- suggestions: Specific recommendations

Passing threshold is 60%.`;

    const userPrompt =
      type === "ABSTRACT"
        ? `Question: ${question.question}\n\nTopic: ${question.topic}\n\nUser's Answer:\n${userAnswer}`
        : `Question: ${question.question}\n\nTopic: ${question.topic}\n\nUser's Diagram/Explanation:\n${userAnswer}`;

    try {
      const aiProvider = getAIProvider();
      const evaluation = await aiProvider.evaluate(systemPrompt, userPrompt);

      score = evaluation.score;
      isCorrect = evaluation.score >= 60;
      aiFeedback = JSON.stringify(evaluation.feedback);
    } catch (error) {
      console.error("AI evaluation failed:", error);
      return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
    }
  }

  const attempt = await prisma.questionAttempt.create({
    data: {
      questionId,
      userId: session.user.id,
      userAnswer,
      isCorrect,
      score,
      aiFeedback,
    },
  });

  const weekProgress = await prisma.weekProgress.upsert({
    where: {
      weekId_userId: {
        weekId: question.weekId,
        userId: session.user.id,
      },
    },
    create: {
      weekId: question.weekId,
      userId: session.user.id,
      attemptsCount: 1,
    },
    update: {
      attemptsCount: { increment: 1 },
    },
  });

  const questionIds = (
    await prisma.studyQuestion.findMany({
      where: { weekId: question.weekId },
      select: { id: true },
    })
  ).map((q) => q.id);

  const allAttempts = await prisma.questionAttempt.findMany({
    where: {
      questionId: { in: questionIds },
      userId: session.user.id,
      score: { not: null },
    },
  });

  if (allAttempts.length === questionIds.length) {
    const avgScore =
      allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length;
    await prisma.weekProgress.update({
      where: { id: weekProgress.id },
      data: {
        completedAt: new Date(),
        score: avgScore,
      },
    });

    await prisma.studyWeek.update({
      where: { id: question.weekId },
      data: { isCompleted: avgScore >= 75 },
    });
  }

  const correctCount = allAttempts.filter((a) => a.isCorrect).length;
  const weekScore =
    allAttempts.length > 0
      ? allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length
      : null;

  return NextResponse.json({
    attempt: {
      ...attempt,
      isCorrect,
      score,
      aiFeedback: aiFeedback ? JSON.parse(aiFeedback) : null,
    },
    explanation: question.explanation,
    correctCount,
    totalQuestions: questionIds.length,
    weekScore,
  });
}
