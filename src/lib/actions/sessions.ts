"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Step, getNextStep, parseReferenceData } from "@/lib/types";
import { getAIProvider, buildEvaluationPrompt, prepareUserInput } from "@/lib/ai";

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function getProblems() {
  return prisma.problem.findMany({
    orderBy: [{ difficulty: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      description: true,
    },
  });
}

export async function getProblem(slug: string) {
  return prisma.problem.findUnique({
    where: { slug },
  });
}

export async function startSession(problemId: string) {
  const user = await getUser();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      problemId,
      currentStep: "REQUIREMENTS",
    },
  });

  redirect(`/session/${session.id}`);
}

export async function getSession(sessionId: string) {
  const user = await getUser();

  return prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      problem: true,
      steps: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getUserSessions() {
  const user = await getUser();

  return prisma.session.findMany({
    where: { userId: user.id },
    include: {
      problem: {
        select: { title: true, slug: true, difficulty: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function submitStep(
  sessionId: string,
  step: Step,
  userInput: string
) {
  const user = await getUser();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { problem: true },
  });

  if (!session) throw new Error("Session not found");
  if (session.currentStep !== step) throw new Error("Invalid step");

  // Build evaluation prompt from reference data
  const refData = parseReferenceData(session.problem.referenceData);
  const systemPrompt = await buildEvaluationPrompt(step, session.problem.title, refData);
  const processedInput = prepareUserInput(step, userInput);

  // Call AI provider for evaluation
  const provider = getAIProvider();
  const evaluation = await provider.evaluate(systemPrompt, processedInput);

  const attempt = await prisma.stepAttempt.create({
    data: {
      sessionId,
      step,
      userInput,
      aiEvaluation: JSON.stringify(evaluation),
      passed: evaluation.passed,
    },
  });

  return attempt;
}

export async function advanceStep(sessionId: string) {
  const user = await getUser();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) throw new Error("Session not found");

  const next = getNextStep(session.currentStep as Step);

  if (next === "COMPLETED") {
    // Calculate overall score from all step attempts
    const steps = await prisma.stepAttempt.findMany({
      where: { sessionId },
    });

    const scores = steps
      .map((s) => {
        const eval_ = JSON.parse(s.aiEvaluation || "{}");
        return eval_.score || 0;
      });

    const overallScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        currentStep: "COMPLETED",
        completedAt: new Date(),
        overallScore,
      },
    });
  } else {
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentStep: next },
    });
  }
}
