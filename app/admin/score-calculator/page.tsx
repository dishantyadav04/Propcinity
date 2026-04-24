'use client';

import { useState, useMemo } from "react";
import SectionContainer from "@/components/layout/SectionContainer";
import { Shield, Info, AlertTriangle, CheckCircle2, TrendingUp, BarChart } from "lucide-react";
import { motion } from "framer-motion";

export default function ScoreCalculatorPage() {
  const [params, setParams] = useState({
    rera: 100,
    builderHistory: 80,
    constructionProgress: 50,
    pricingRationality: 90,
    locationPotential: 75,
    amenityDelivery: 85
  });

  const score = useMemo(() => {
    const weights = {
      rera: 0.3,
      builderHistory: 0.2,
      constructionProgress: 0.15,
      pricingRationality: 0.15,
      locationPotential: 0.1,
      amenityDelivery: 0.1
    };
    
    return Math.round(
      params.rera * weights.rera +
      params.builderHistory * weights.builderHistory +
      params.constructionProgress * weights.constructionProgress +
      params.pricingRationality * weights.pricingRationality +
      params.locationPotential * weights.locationPotential +
      params.amenityDelivery * weights.amenityDelivery
    );
  }, [params]);

  const riskLabel = useMemo(() => {
    if (score >= 85) return { label: 'Low Risk', color: 'text-[var(--success)]', bg: 'bg-[var(--success-light)]', icon: <CheckCircle2 className="w-4 h-4" /> };
    if (score >= 65) return { label: 'Medium Risk', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-light)]', icon: <Info className="w-4 h-4" /> };
    return { label: 'High Risk', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger-light)]', icon: <AlertTriangle className="w-4 h-4" /> };
  }, [score]);

  return (
    <SectionContainer wide className="py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Trust Score Calculator
        </h1>
        <p className="text-[var(--text-secondary)]">Simulate project quality and risk metrics for internal auditing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <span className="text-sm font-black text-[var(--primary)]">{value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => setParams(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[var(--border)]">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <BarChart className="w-4 h-4 text-[var(--primary)]" /> Scoring Logic
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-[var(--surface-raised)] rounded-xl">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">RERA Priority</p>
                <p className="text-sm font-bold">30% Weight</p>
              </div>
              <div className="p-3 bg-[var(--surface-raised)] rounded-xl">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Builder Trust</p>
                <p className="text-sm font-bold">20% Weight</p>
              </div>
              <div className="p-3 bg-[var(--surface-raised)] rounded-xl">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Execution</p>
                <p className="text-sm font-bold">15% Weight</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--surface-dark)] text-white p-8 rounded-[var(--radius-lg)] flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <p className="text-xs font-bold text-white/60 uppercase tracking-[0.2em]">Project Trust Score</p>
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * score) / 100} className="text-[var(--primary)] transition-all duration-500" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black">{score}</span>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold ${riskLabel.bg} ${riskLabel.color}`}>
              {riskLabel.icon}
              {riskLabel.label}
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] p-6 rounded-[var(--radius-lg)] space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" /> Analysis Insights
            </h3>
            <ul className="space-y-3">
              {score > 80 ? (
                <li className="text-xs text-[var(--text-secondary)] flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mt-1 shrink-0" />
                  This project qualifies for "Premium Verified" status.
                </li>
              ) : (
                <li className="text-xs text-[var(--text-secondary)] flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] mt-1 shrink-0" />
                  Below 80: Requires manual double-check on RERA timeline.
                </li>
              )}
              <li className="text-xs text-[var(--text-secondary)] flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1 shrink-0" />
                Score directly impacts its ranking in the "Top Matches" dashboard.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
