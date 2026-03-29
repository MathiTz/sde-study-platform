import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { SignInButton } from "@/components/sign-in-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SDE Interview Prep",
  description:
    "Practice system design interviews with AI-powered feedback and an interactive drawing board.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-border">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold">
              SDE Prep
            </Link>
            <div className="flex items-center gap-4">
              {session?.user ? (
                <>
                  <Link
                    href="/sessions"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    History
                  </Link>
                  <Link
                    href="/resources"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Resources
                  </Link>
                  <Link
                    href="/knowledge"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Knowledge
                  </Link>
                  <Link
                    href="/study-plan"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Study Plan
                  </Link>
                  <Link
                    href="/lessons"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Lessons
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {session.user.name || session.user.email}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                    }}
                  >
                    <button className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github");
                  }}
                >
                  <SignInButton />
                </form>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
