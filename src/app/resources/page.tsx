import Link from "next/link";
import { getAllResources, getAllTopics } from "@/lib/actions/resources";
import { ResourceBrowser } from "./ResourceBrowser";

export default async function ResourcesPage() {
  const [resources, topics] = await Promise.all([
    getAllResources(),
    getAllTopics(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Study Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated articles, book chapters, and documentation to strengthen your
          system design knowledge. Resources are recommended based on your
          session performance.
        </p>
      </div>

      <ResourceBrowser resources={resources} topics={topics} />
    </div>
  );
}
