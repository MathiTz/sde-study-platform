import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LessonsClient } from "./LessonsClient";

export default async function LessonsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const resources = await prisma.studyResource.findMany({
    orderBy: { source: "asc" },
  });

  return <LessonsClient resources={resources} />;
}
