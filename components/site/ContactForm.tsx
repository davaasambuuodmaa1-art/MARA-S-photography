"use client";

import { useState } from "react";
import { createInquiryAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export function ContactForm({ subjects }: { subjects: string[] }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: subjects[0] ?? "General enquiry",
    message: "",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError(null);
    const result = await createInquiryAction(form);
    if (result.ok) {
      setState("sent");
      setForm({ name: "", email: "", phone: "", subject: subjects[0] ?? "General enquiry", message: "" });
    } else {
      setState("idle");
      setError(result.error);
    }
  };

  if (state === "sent") {
    return (
      <div className="border border-ink/12 bg-white/70 p-10 text-center">
        <p className="eyebrow">Thank you</p>
        <p className="display mt-4 text-3xl">Your message is with Mara.</p>
        <p className="mt-4 text-sm leading-relaxed text-smoke">
          We answer every enquiry personally, usually within one business day. If it is urgent,
          WhatsApp is the fastest way to reach us.
        </p>
        <button type="button" onClick={() => setState("idle")} className="btn-outline mt-8">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">Your name</label>
          <input
            id="contact-name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
            placeholder="Alya Putri"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="field"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-phone">Phone / WhatsApp</label>
          <input
            id="contact-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="field"
            placeholder="+62 …"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-subject">What is this about?</label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="field"
          >
            {subjects.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="contact-message">Tell us about your plans</label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="field resize-none"
          placeholder="Dates, location, how many people, anything you already have in mind…"
        />
      </div>
      {error ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xs text-[11px] leading-relaxed text-smoke/70">
          Your details stay with Mara. We never share client information.
        </p>
        <button type="submit" disabled={state === "sending"} className={cn("btn-dark", state === "sending" && "opacity-60")}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
