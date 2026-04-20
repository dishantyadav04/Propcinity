'use client';

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { calculateEMI, calculateTotalInterest, calculateDownPayment, formatINR } from "@/lib/finance-calculations";
import { trackEMICalculated } from "@/lib/posthog-events";

interface EMICalculatorProps {
  projectPrice: number;
}

export default function EMICalculator({ projectPrice }: EMICalculatorProps) {
  const [loanAmount, setLoanAmount] = useState(projectPrice * 0.8);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) {
      trackEMICalculated({ projectId: 'current' }); // Simplified for now
    }
  }, [hasInteracted]);

  const emi = calculateEMI(loanAmount, rate, tenure * 12);
  const totalInterest = calculateTotalInterest(loanAmount, rate, tenure * 12);
  const totalPayment = loanAmount + totalInterest;
  const downPayment = projectPrice - loanAmount;
  const downPaymentPercent = (downPayment / projectPrice) * 100;

  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-1">
        <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest">Monthly EMI</p>
        <h2 className="text-4xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          {formatINR(emi)}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Loan Amount</span>
              <span className="text-[var(--text-primary)] font-bold">{formatINR(loanAmount)}</span>
            </div>
            <input 
              type="range" 
              min={1000000} 
              max={50000000} 
              step={100000}
              value={loanAmount}
              onChange={(e) => { setLoanAmount(Number(e.target.value)); setHasInteracted(true); }}
              className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Interest Rate</span>
              <span className="text-[var(--text-primary)] font-bold">{rate}%</span>
            </div>
            <input 
              type="range" 
              min={6.5} 
              max={14} 
              step={0.25}
              value={rate}
              onChange={(e) => { setRate(Number(e.target.value)); setHasInteracted(true); }}
              className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Tenure</span>
              <span className="text-[var(--text-primary)] font-bold">{tenure} Years</span>
            </div>
            <input 
              type="range" 
              min={5} 
              max={30} 
              step={1}
              value={tenure}
              onChange={(e) => { setTenure(Number(e.target.value)); setHasInteracted(true); }}
              className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer"
            />
          </div>
        </div>

        {/* Visual Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-[var(--surface-raised)] rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[var(--primary)]" 
              style={{ width: `${(loanAmount / totalPayment) * 100}%` }} 
            />
            <div 
              className="h-full bg-[var(--primary-glow)]" 
              style={{ width: `${(totalInterest / totalPayment) * 100}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[var(--primary)] rounded-full" />
              <span>Principal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[var(--primary-glow)] rounded-full" />
              <span>Interest</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--surface-raised)] p-3 rounded-xl border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Interest</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{formatINR(totalInterest)}</p>
          </div>
          <div className="bg-[var(--surface-raised)] p-3 rounded-xl border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Payment</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{formatINR(totalPayment)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-[var(--surface-raised)] rounded-xl border border-[var(--border)]">
          <div className="space-y-0.5">
            <p className="text-xs text-[var(--text-secondary)]">Down Payment Required</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{formatINR(downPayment)}</p>
          </div>
          <div className={cn(
            "px-2 py-1 rounded text-[10px] font-bold uppercase",
            downPaymentPercent <= 20 ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--warning)]/10 text-[var(--warning)]"
          )}>
            {downPaymentPercent.toFixed(0)}% of Price
          </div>
        </div>

        <p className="text-[10px] text-[var(--text-muted)] text-center italic">
          * Estimate only. Actual bank terms may vary based on your eligibility.
        </p>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
