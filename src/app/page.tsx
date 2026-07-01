import Link from "next/link";
import { FileText, Printer, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Submit a Brief",
    description:
      "Describe your brand and requirements in plain English",
  },
  {
    icon: Sparkles,
    title: "AI Generates Designs",
    description: "Get 3 professional concepts in under 2 minutes",
  },
  {
    icon: Printer,
    title: "Approve & Print",
    description:
      "Client reviews, annotates, and approves print-ready PDF",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            PrintAI
          </Link>
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
              From Brief to Print-Ready in Minutes
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              AI generates professional brochure designs instantly. Share with
              clients, collect feedback, and send to print — all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-11 px-6" asChild>
                <Link href="/projects/new">Start a New Project</Link>
              </Button>
              <Button variant="link" size="lg" className="h-11" asChild>
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-border/60 bg-muted/30"
        >
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full bg-background">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <feature.icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            PrintAI © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
