import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { BudgetHeroDemo } from "@/src/components/features/budget-hero-demo";
import { Button } from "@/src/components/ui/button";

const features = [
  {
    icon: ReceiptText,
    title: "Track every transaction",
    text: "Capture daily spending, subscriptions, and transfers in one calm ledger.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Know what changed",
    text: "Spot category shifts and cash-flow pressure before they become surprises.",
  },
  {
    icon: BellRing,
    title: "Plan around bills",
    text: "See bill clusters, payment windows, and safe-to-spend money at a glance.",
  },
];

const toolkit = [
  ["Bank sync", Landmark],
  ["Cards", CreditCard],
  ["Goals", Sparkles],
  ["Security", ShieldCheck],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-[#0f0f0f]/90 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <a href="#" className="text-base font-semibold text-white">
            Personal Budget Tracker
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#a8a8a8] md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#insights" className="hover:text-white">
              Insights
            </a>
            <a href="#security" className="hover:text-white">
              Security
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <a href="/login">Sign in</a>
            </Button>
            <Button asChild>
              <a href="/register">Start free</a>
            </Button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 py-20 md:py-24">
        <div className="absolute inset-x-0 top-20 mx-auto h-[520px] max-w-4xl bg-[radial-gradient(circle,rgba(31,77,54,0.36),transparent_62%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto inline-flex rounded-full bg-[#222222] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#d8d8d8]">
              Budgeting without spreadsheet anxiety
            </p>
            <h1 className="mt-7 text-5xl font-medium leading-[1.05] tracking-normal text-white md:text-7xl">
              Personal finance that feels clear before it feels urgent.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#a8a8a8] md:text-lg">
              Personal Budget Tracker turns income, bills, savings goals, and
              everyday purchases into a single readable control room for your
              money.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <a href="/register">
                  Create budget
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="/login">Sign in</a>
              </Button>
            </div>
          </div>
          <div className="mt-14">
            <BudgetHeroDemo />
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[#1a1a1a] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
              Daily money system
            </p>
            <h2 className="mt-4 text-3xl font-medium leading-tight md:text-5xl">
              Built for the decisions you make every week.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-[#222222] bg-[#181818] p-7"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#222222] text-[#6EB38B]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#a8a8a8]">
                    {feature.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="insights" className="px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
              Smart insights
            </p>
            <h2 className="mt-4 text-3xl font-medium leading-tight md:text-5xl">
              Forecast your month before your balance tells the story.
            </h2>
            <p className="mt-5 leading-7 text-[#a8a8a8]">
              The tracker keeps your monthly plan, recurring expenses, and goal
              progress in sync so every spending choice has context.
            </p>
          </div>
          <div className="rounded-2xl border border-[#222222] bg-black p-4">
            <div className="rounded-xl bg-[#181818] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#888888]">Projected savings</p>
                  <p className="mt-2 font-mono text-4xl text-white">$2,840</p>
                </div>
                <TrendingUp className="h-9 w-9 text-[#6EB38B]" />
              </div>
              <div className="mt-8 grid h-44 grid-cols-7 items-end gap-3">
                {[46, 58, 52, 71, 66, 83, 92].map((height, index) => (
                  <div
                    key={height}
                    className="rounded-t-md bg-[#1F4D36]"
                    style={{ height: `${height}%`, opacity: 0.45 + index / 14 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="border-y border-[#1a1a1a] px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
          {toolkit.map(([label, Icon]) => (
            <div
              key={label}
              className="rounded-xl border border-[#222222] bg-[#181818] p-5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#222222] text-[#6EB38B]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 font-semibold text-white">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[#a8a8a8]">
                Connected, organized, and readable from the first week.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,77,54,0.32),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-3xl font-medium leading-tight md:text-5xl">
            Give every dollar a job before the month gets noisy.
          </h2>
          <div className="mt-8">
            <Button size="lg" asChild>
              <a href="/register">
                Build my budget
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1a1a1a] px-5 py-10 text-sm text-[#888888]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>Personal Budget Tracker</p>
          <p>Plan clearly. Spend intentionally. Save steadily.</p>
        </div>
      </footer>
    </main>
  );
}
