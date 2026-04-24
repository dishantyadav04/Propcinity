'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { Search, Mail, Phone, Calendar, Download, ExternalLink } from "lucide-react";

export default function AdminLeadsPage() {
  return (
    <SectionContainer wide className="py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Leads Management
          </h1>
          <p className="text-[var(--text-secondary)]">Review and export customer inquiries across all projects.</p>
        </div>
        <button className="px-5 py-2.5 bg-white border border-[var(--border)] font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              placeholder="Search leads..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Project Inquiry</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="hover:bg-[var(--surface-raised)]/20 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm">Customer Name {i}</p>
                    <p className="text-xs text-[var(--text-muted)]">Interested in 3 BHK</p>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Mail className="w-3 h-3" /> user{i}@example.com
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Phone className="w-3 h-3" /> +91 98765 43210
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-[var(--primary)]">Godrej Woodsville</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">New Inquiry</span>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-[var(--text-secondary)]">24 Apr 2026</p>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[var(--border)]">
                      <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)] font-medium">Showing 5 of 1,284 leads</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-[var(--surface-raised)] rounded text-xs font-bold text-[var(--text-muted)] cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 bg-white border border-[var(--border)] rounded text-xs font-bold text-[var(--text-primary)] hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
