"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AddFoodModal } from "./add-food-modal";
import type { MealSlot } from "@snt/shared";

const MEAL_META: Record<string, { icon: string; gradient: string; accent: string }> = {
  breakfast: { icon: "🌅", gradient: "from-amber-400 to-orange-500", accent: "#f59e0b" },
  lunch:     { icon: "☀️", gradient: "from-emerald-400 to-emerald-600", accent: "#059669" },
  dinner:    { icon: "🌙", gradient: "from-blue-400 to-indigo-500", accent: "#3b82f6" },
  snack:     { icon: "⚡", gradient: "from-rose-400 to-pink-500",    accent: "#f43f5e" },
};

export function Dashboard() {
  const queryClient = useQueryClient();
  const [addingSlot, setAddingSlot] = useState<MealSlot | null>(null);

  const { data: log, isLoading } = useQuery({
    queryKey: ["daily-log", "today"],
    queryFn: () => api.get("/logs/today"),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile"),
  });

  function handleFoodAdded() {
    queryClient.invalidateQueries({ queryKey: ["daily-log"] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Loading your day...</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.profile?.displayName?.split(" ")[0] || "";
  const greeting = getGreeting();

  return (
    <div className="min-h-screen pb-8">
      {/* ── Gradient Header ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white px-6 pt-8 pb-16 rounded-b-3xl shadow-xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-300 text-sm font-medium">{greeting}</p>
              <h1 className="text-2xl font-bold mt-0.5">
                {firstName ? `${firstName}'s Dashboard` : "Dashboard"}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-emerald-400/60 text-xs">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                })}
              </p>
              <p className="text-emerald-200 text-sm font-medium">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Calorie Ring - sits in the header */}
          <CalorieRing
            consumed={log?.totals?.calories ?? 0}
            goal={Number(profile?.targets?.calories) || 2000}
          />
        </div>
      </div>

      {/* ── Content Area ─────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-4">

        {/* Macro Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-emerald-100/60">
          <h3 className="text-xs font-semibold text-emerald-700/60 uppercase tracking-wider mb-4">Macros</h3>
          <div className="grid grid-cols-3 gap-4">
            <MacroBar
              label="Protein"
              consumed={log?.totals?.proteinG ?? 0}
              target={Number(profile?.targets?.proteinG) || 150}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <MacroBar
              label="Carbs"
              consumed={log?.totals?.carbsG ?? 0}
              target={Number(profile?.targets?.carbsG) || 200}
              color="#f59e0b"
              bgColor="#fffbeb"
            />
            <MacroBar
              label="Fat"
              consumed={log?.totals?.fatG ?? 0}
              target={Number(profile?.targets?.fatG) || 65}
              color="#ef4444"
              bgColor="#fef2f2"
            />
          </div>
        </div>

        {/* Meal Slots */}
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((slot) => (
          <MealSlotCard
            key={slot}
            slot={slot}
            items={log?.meals?.[slot] ?? []}
            onAdd={() => setAddingSlot(slot)}
          />
        ))}
      </div>

      {/* Add Food Modal */}
      <AddFoodModal
        slot={addingSlot ?? "breakfast"}
        isOpen={addingSlot !== null}
        onClose={() => setAddingSlot(null)}
        onAdded={handleFoodAdded}
      />
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Calorie Ring ────────────────────────────────────────────── */

function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - consumed);
  const over = consumed > goal;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
          />
          {/* Glow effect */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={over ? "#f43f5e" : "#34d399"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-white">
            {Math.round(consumed)}
          </p>
          <p className="text-xs text-slate-400">
            of {Math.round(goal)} cal
          </p>
        </div>
      </div>
      <p className="text-sm mt-2">
        {over ? (
          <span className="text-rose-300 font-medium">
            {Math.round(consumed - goal)} cal over goal
          </span>
        ) : (
          <span className="text-slate-300">
            <span className="font-semibold text-emerald-300">{Math.round(remaining)}</span> remaining
            {" · "}
            <span className="font-semibold text-white">{Math.round(pct)}%</span>
          </span>
        )}
      </p>
    </div>
  );
}

/* ── Macro Bar ───────────────────────────────────────────────── */

function MacroBar({
  label,
  consumed,
  target,
  color,
  bgColor,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
  bgColor: string;
}) {
  const pct = Math.min(100, target > 0 ? (consumed / target) * 100 : 0);

  return (
    <div className="text-center">
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs font-medium text-neutral-700">{label}</p>
      <p className="text-xs text-neutral-400">
        {Math.round(consumed)}g / {Math.round(target)}g
      </p>
    </div>
  );
}

/* ── Meal Slot Card ──────────────────────────────────────────── */

function MealSlotCard({
  slot,
  items,
  onAdd,
}: {
  slot: string;
  items: any[];
  onAdd: () => void;
}) {
  const label = slot.charAt(0).toUpperCase() + slot.slice(1);
  const meta = MEAL_META[slot] || MEAL_META.snack;
  const slotCals = items.reduce((sum, i) => sum + Number(i.calories || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
      {/* Card header with colored accent */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-base shadow-sm`}
          >
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-neutral-800">{label}</h3>
            <p className="text-xs text-neutral-400">
              {items.length === 0
                ? "Nothing logged"
                : `${items.length} item${items.length > 1 ? "s" : ""} · ${Math.round(slotCals)} cal`}
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: meta.accent, backgroundColor: `${meta.accent}14` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <ul className="border-t border-neutral-50">
          {items.map((item: any, idx: number) => (
            <li
              key={item.id}
              className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                idx < items.length - 1 ? "border-b border-neutral-50" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta.accent }}
                />
                <span className="text-neutral-700 truncate">{item.foodName}</span>
              </div>
              <span className="text-neutral-400 text-xs font-medium whitespace-nowrap ml-3">
                {Math.round(Number(item.calories))} cal
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
