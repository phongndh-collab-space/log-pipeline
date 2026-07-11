"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  PiggyBank,
  WalletCards,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useBudgetStore } from "@/src/stores/budget-store";

const summaryByMode = {
  monthly: {
    income: "$5,840",
    spending: "$3,126",
    saved: "$1,420",
    runway: "18 days",
  },
  weekly: {
    income: "$1,460",
    spending: "$734",
    saved: "$355",
    runway: "5 days",
  },
};

const categories = [
  { name: "Home", amount: "$1,180", width: "72%" },
  { name: "Food", amount: "$642", width: "45%" },
  { name: "Travel", amount: "$318", width: "28%" },
];

export function BudgetHeroDemo() {
  const { mode, setMode } = useBudgetStore();
  const summary = summaryByMode[mode];

  return (
    <section
      className="relative mx-auto grid w-full max-w-5xl gap-4 rounded-2xl border border-[#222222] bg-black p-4 md:grid-cols-2 md:p-6"
      aria-label="Budget dashboard preview"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(31,77,54,0.38),transparent_58%)]" />
      <div className="relative rounded-xl border border-[#242424] bg-[#181818] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
              Net balance
            </p>
            <h2 className="mt-2 text-4xl font-medium text-white">
              {summary.saved}
            </h2>
          </div>
          <div className="flex rounded-lg bg-[#101010] p-1">
            {(["monthly", "weekly"] as const).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={mode === item ? "default" : "ghost"}
                className={cn(
                  "h-8 px-3 capitalize",
                  mode !== item && "text-[#888888]",
                )}
                onClick={() => setMode(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric
            icon={<ArrowUpRight className="h-4 w-4" />}
            label="Income"
            value={summary.income}
          />
          <Metric
            icon={<ArrowDownRight className="h-4 w-4" />}
            label="Spending"
            value={summary.spending}
          />
        </div>
      </div>

      <div className="relative rounded-xl border border-[#242424] bg-[#181818] p-5">
        <div className="flex items-center gap-3 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#222222]">
            <BarChart3 className="h-5 w-5 text-[#6EB38B]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Budget health</p>
            <p className="text-sm text-[#a8a8a8]">Stable and improving</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <div key={category.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#d8d8d8]">{category.name}</span>
                <span className="font-mono text-[#a8a8a8]">
                  {category.amount}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#242424]">
                <div
                  className="h-full rounded-full bg-[#1F4D36]"
                  style={{ width: category.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <MiniPanel
        icon={<PiggyBank className="h-5 w-5" />}
        label="Goal forecast"
        value="Vacation fund hits 100% in 9 weeks"
      />
      <MiniPanel
        icon={<CalendarDays className="h-5 w-5" />}
        label="Upcoming"
        value={`${summary.runway} until next bill cluster`}
      />
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#242424] bg-[#111111] p-4">
      <div className="mb-3 flex items-center gap-2 text-[#6EB38B]">{icon}</div>
      <p className="text-sm text-[#888888]">{label}</p>
      <p className="mt-1 font-mono text-lg text-white">{value}</p>
    </div>
  );
}

function MiniPanel({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="relative rounded-xl border border-[#242424] bg-[#181818] p-5">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#222222] text-[#6EB38B]">
        {icon}
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-[#888888]">
        {label}
      </p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
      <WalletCards className="absolute right-5 top-5 h-5 w-5 text-[#444444]" />
    </div>
  );
}
