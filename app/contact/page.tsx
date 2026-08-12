'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please fill in your name and message.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
      toast.success('Message sent! We\'ll get back to you soon.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          Message Received
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
          Thanks for reaching out, {form.name.split(' ')[0]}. We usually respond within 24 hours.
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-28 space-y-10">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)]
            text-[var(--primary)] text-xs font-bold rounded-full">
            <Mail className="w-3 h-3" /> We&apos;d love to hear from you
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Contact Us
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Have a question, feedback, or partnership inquiry? Drop us a message and we&apos;ll respond within 24 hours.
          </p>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: 'Email', value: 'hello@propcinity.in' },
            { icon: MapPin, label: 'Location', value: 'Pune, Maharashtra' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}
              className="flex items-start gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)]">
              <div className="w-8 h-8 bg-[var(--primary-light)] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Send a Message
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Full Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                  rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                  rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              type="email"
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Subject
            </label>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]
                transition-colors appearance-none"
            >
              <option value="">Select a topic...</option>
              <option value="property_inquiry">Property Inquiry</option>
              <option value="partnership">Builder / Partnership</option>
              <option value="feedback">Feedback</option>
              <option value="support">Technical Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Message <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3
              bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)]
              hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)]
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Message</>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Propcinity. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/privacy-policy" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>

      </main>
    </div>
  )
}
