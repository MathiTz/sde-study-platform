import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { lessonId } = body;

  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  }

  const progress = await prisma.userLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    create: {
      userId: session.user.id,
      lessonId,
    },
    update: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, progress });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.userLessonProgress.findMany({
    where: { userId: session.user.id },
    select: { lessonId: true, readAt: true },
  });

  return NextResponse.json({ progress });
}
