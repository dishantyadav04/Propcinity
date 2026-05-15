'use client';

import { useState } from "react";
import { Drawer } from "vaul";
import { X, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { Project, UnitConfig } from "@/types/project";
import { toast } from "sonner";

interface LeadQualificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  unitConfig?: UnitConfig;
}

export default function LeadQualificationSheet({ isOpen, onClose, project, unitConfig }: LeadQualificationSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulating API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      toast.success("Consultation scheduled successfully!");
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-[20px] bg-[var(--surface)] border-t border-[var(--border)] max-h-[96vh] focus:outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--border)]" />
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Talk to Advisor</h2>
                <p className="text-sm text-[var(--text-muted)]">Get expert guidance for {project.name}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-[var(--surface-raised)] rounded-full">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <CheckCircle2 className="w-16 h-16 text-[var(--success)]" />
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Request Received!</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Our property advisor will contact you shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Full Name</label>
                  <input required type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Phone Number</label>
                  <input required type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Preferred Time</label>
                  <select className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]">
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="evening">Evening (4PM - 7PM)</option>
                  </select>
                </div>
                
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-bold py-4 rounded-xl mt-6 disabled:opacity-70">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarDays className="w-5 h-5" />}
                  <span>{isLoading ? 'Submitting...' : 'Request Call Back'}</span>
                </button>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
