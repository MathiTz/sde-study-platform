"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Step, COMPLETED_STEP, getNextStep, parseReferenceData, SessionStatus } from "@/lib/types";
import { getAIProvider, buildEvaluationPrompt, prepareUserInput } from "@/lib/ai";
import { safeParseEvaluation } from "@/lib/utils/json";

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
  return prisma.problem.findUnique({ where: { slug } });
}

export async function startSession(problemId: string) {
  const user = await getAuthUser();

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
  const user = await getAuthUser();

  return prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      problem: true,
      steps: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getUserSessions() {
  const user = await getAuthUser();

  return prisma.session.findMany({
    where: { userId: user.id },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function submitStep(
  sessionId: string,
  step: Step,
  userInput: string
) {
  const user = await getAuthUser();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { problem: true },
  });

  if (!session) throw new Error("Session not found");
  if (session.currentStep !== step) throw new Error("Invalid step");

  const refData = parseReferenceData(session.problem.referenceData);
  const systemPrompt = await buildEvaluationPrompt(step, session.problem.title, refData);
  const processedInput = prepareUserInput(step, userInput);

  const provider = getAIProvider();
  const evaluation = await provider.evaluate(systemPrompt, processedInput);

  return prisma.stepAttempt.create({
    data: {
      sessionId,
      step,
      userInput,
      aiEvaluation: JSON.stringify(evaluation),
      passed: evaluation.passed,
    },
  });
}

export async function advanceStep(sessionId: string) {
  const user = await getAuthUser();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) throw new Error("Session not found");

  const next = getNextStep(session.currentStep as Step);

  if (next === COMPLETED_STEP) {
    const steps = await prisma.stepAttempt.findMany({ where: { sessionId } });

    const scores = steps.map((s) => safeParseEvaluation(s.aiEvaluation)?.score ?? 0);
    const overallScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        currentStep: COMPLETED_STEP,
        status: "COMPLETED" satisfies SessionStatus,
        timerElapsed: 0,
        completedAt: new Date(),
        overallScore,
      },
    });
  } else {
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentStep: next, status: "ACTIVE" satisfies SessionStatus, timerElapsed: 0 },
    });
  }
}

export async function pauseSession(sessionId: string, elapsedSeconds: number) {
  const user = await getAuthUser();

  await prisma.session.updateMany({
    where: { id: sessionId, userId: user.id },
    data: { status: "PAUSED" satisfies SessionStatus, timerElapsed: elapsedSeconds },
  });
}

export async function resumeSession(sessionId: string) {
  const user = await getAuthUser();

  await prisma.session.updateMany({
    where: { id: sessionId, userId: user.id },
    data: { status: "ACTIVE" satisfies SessionStatus },
  });
}
