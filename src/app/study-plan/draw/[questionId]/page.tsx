import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DrawWorkspace } from "./DrawWorkspace";

interface DrawPageProps {
  searchParams: Promise<{ returnTo?: string }>;
  params: Promise<{ questionId: string }>;
}

export default async function DrawPage({ searchParams, params }: DrawPageProps) {
  const session = await auth();
  const { questionId } = await params;
  const { returnTo } = await searchParams;

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const question = await prisma.studyQuestion.findUnique({
    where: { id: questionId },
    include: {
      week: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!question || question.questionType !== "DRAWING") {
    notFound();
  }

  const lastAttempt = await prisma.questionAttempt.findFirst({
    where: {
      questionId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  const existingDrawing = lastAttempt?.userAnswer || "";

  return (
    <DrawWorkspace
      questionId={questionId}
      question={question.question}
      hint={question.hint || undefined}
      existingDrawing={existingDrawing}
      returnTo={returnTo || "/study-plan"}
    />
  );
}
