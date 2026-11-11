"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSiteContentAction, saveTestimonialAction, deleteTestimonialAction, uploadAssetAction } from "@/app/actions/admin";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = ["Brand & hero", "About", "Contact", "Testimonials", "FAQ", "Instagram"] as const;
type Tab = (typeof TABS)[number];

export function ContentManager({
  settings,
  categories,
  testimonials,
}: {
  settings: SiteSettings;
  categories: { id: string; name: string; cover_image: string }[];
  testimonials: {
    id: string;
    name: string;
    role: string;
    quote: string;
    rating: number;
    published: number;
  }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Brand & hero");
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faqDraft, setFaqDraft] = useState(settings.faqs);
  const [testimonialDraft, setTestimonialDraft] = useState({
    id: "",
    name: "",
    role: "",
    quote: "",
    rating: 5,
    published: true,
  });

  const persist = async (patch: Partial<SiteSettings>, note = "Saved.") => {
    setBusy(true);
    setError(null);
    const result = await saveSiteContentAction(patch);
    setBusy(false);
    if (result.ok) {
      setMessage(note);
      setTimeout(() => setMessage(null), 2500);
      router.refresh();
    } else setError(result.error);
  };

  const upload = async (file: File | undefined, key: keyof SiteSettings) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAssetAction(formData);
    if (result.ok) {
      setDraft((prev) => ({ ...prev, [key]: result.url }) as SiteSettings);
      await saveSiteContentAction({ [key]: result.url } as Partial<SiteSettings>);
      router.refresh();
      setMessage("Image uploaded and published.");
    } else setError(result.error);
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      {message ? <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}

      <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-ink/10 pb-3">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "shrink-0 border px-3 py-2 text-[9px] uppercase tracking-[0.16em] transition-colors",
              tab === value ? "border-ink bg-ink text-cream" : "border-ink/15 text-smoke hover:border-ink/40 hover:text-ink",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "Brand & hero" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Brand</p>
            <div>
              <label className="label">Brand name</label>
              <input className="field" value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input className="field" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
            </div>
            <div>
              <label className="label">Logo (optional — replaces the wordmark)</label>
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "logoImage")} className="text-xs" />
              {draft.logoImage ? <img src={draft.logoImage} alt="Logo" className="mt-3 h-10 w-auto" /> : null}
            </div>
            <button type="button" disabled={busy} onClick={() => persist({ brandName: draft.brandName, tagline: draft.tagline, logoImage: draft.logoImage }, "Brand saved.")} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
              Save brand
            </button>
          </section>

          <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Homepage hero</p>
            <div>
              <label className="label">Eyebrow</label>
              <input className="field" value={draft.heroEyebrow} onChange={(e) => setDraft({ ...draft, heroEyebrow: e.target.value })} />
            </div>
            <div>
              <label className="label">Headline</label>
              <input className="field" value={draft.heroTitle} onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })} />
            </div>
            <div>
              <label className="label">Sub-headline</label>
              <textarea rows={3} className="field resize-none" value={draft.heroSubtitle} onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })} />
            </div>
            <div>
              <label className="label">Hero image</label>
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "heroImage")} className="text-xs" />
              <img src={draft.heroImage} alt="" className="mt-3 h-28 w-full object-cover" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Secondary image (about banner)</label>
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "heroImage2")} className="text-xs" />
              </div>
              <div>
                <label className="label">Third image</label>
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "heroImage3")} className="text-xs" />
              </div>
            </div>
            <div>
              <label className="label">Announcement bar</label>
              <input className="field" value={draft.announcement} onChange={(e) => setDraft({ ...draft, announcement: e.target.value })} />
              <label className="mt-2 flex items-center gap-2 text-xs text-smoke">
                <input type="checkbox" checked={draft.announcementActive} onChange={(e) => setDraft({ ...draft, announcementActive: e.target.checked })} />
                Show announcement on the homepage
              </label>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                persist(
                  {
                    heroEyebrow: draft.heroEyebrow,
                    heroTitle: draft.heroTitle,
                    heroSubtitle: draft.heroSubtitle,
                    heroImage: draft.heroImage,
                    heroImage2: draft.heroImage2,
                    heroImage3: draft.heroImage3,
                    announcement: draft.announcement,
                    announcementActive: draft.announcementActive,
                  },
                  "Homepage hero saved.",
                )
              }
              className="btn-dark py-2.5 text-[9px] disabled:opacity-60"
            >
              Save hero
            </button>
          </section>
        </div>
      ) : null}

      {tab === "About" ? (
        <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">About section</p>
          <div>
            <label className="label">Heading</label>
            <input className="field" value={draft.aboutTitle} onChange={(e) => setDraft({ ...draft, aboutTitle: e.target.value })} />
          </div>
          <div>
            <label className="label">Story (blank line between paragraphs)</label>
            <textarea rows={8} className="field resize-none" value={draft.aboutBody} onChange={(e) => setDraft({ ...draft, aboutBody: e.target.value })} />
          </div>
          <div>
            <label className="label">Studio portrait</label>
            <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "aboutImage")} className="text-xs" />
            <img src={draft.aboutImage} alt="" className="mt-3 h-32 w-28 object-cover" />
          </div>
          <div>
            <label className="label">Statistics (value / label per line, separated by a pipe)</label>
            <textarea
              rows={4}
              className="field resize-none"
              value={draft.aboutStats.map((s) => `${s.value} | ${s.label}`).join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  aboutStats: e.target.value
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line) => {
                      const [value, ...rest] = line.split("|");
                      return { value: value.trim(), label: rest.join("|").trim() };
                    }),
                })
              }
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              persist(
                { aboutTitle: draft.aboutTitle, aboutBody: draft.aboutBody, aboutImage: draft.aboutImage, aboutStats: draft.aboutStats },
                "About section saved.",
              )
            }
            className="btn-dark py-2.5 text-[9px] disabled:opacity-60"
          >
            Save about section
          </button>
        </section>
      ) : null}

      {tab === "Contact" ? (
        <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Contact details & socials</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input className="field" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="field" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">WhatsApp number (digits only, with country code)</label>
              <input className="field" value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} />
            </div>
            <div>
              <label className="label">Instagram URL</label>
              <input className="field" value={draft.instagram} onChange={(e) => setDraft({ ...draft, instagram: e.target.value })} />
            </div>
            <div>
              <label className="label">Facebook URL</label>
              <input className="field" value={draft.facebook} onChange={(e) => setDraft({ ...draft, facebook: e.target.value })} />
            </div>
            <div>
              <label className="label">Pinterest URL</label>
              <input className="field" value={draft.pinterest} onChange={(e) => setDraft({ ...draft, pinterest: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Studio address</label>
            <textarea rows={2} className="field resize-none" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              persist(
                {
                  email: draft.email,
                  phone: draft.phone,
                  whatsapp: draft.whatsapp,
                  instagram: draft.instagram,
                  facebook: draft.facebook,
                  pinterest: draft.pinterest,
                  address: draft.address,
                },
                "Contact details saved.",
              )
            }
            className="btn-dark py-2.5 text-[9px] disabled:opacity-60"
          >
            Save contact details
          </button>
        </section>
      ) : null}

      {tab === "Testimonials" ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Published testimonials</p>
            {testimonials.map((item) => (
              <div key={item.id} className="border border-ink/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">{item.role}</p>
                  </div>
                  <span className={cn("text-[9px] uppercase tracking-[0.12em]", item.published ? "text-emerald-700" : "text-smoke")}>
                    {item.published ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-smoke">“{item.quote}”</p>
                <div className="mt-3 flex gap-3 text-[9px] uppercase tracking-[0.14em] text-smoke">
                  <button
                    type="button"
                    onClick={() => setTestimonialDraft({ ...item, published: Boolean(item.published) })}
                    className="hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveTestimonialAction({ ...item, published: !item.published });
                      router.refresh();
                    }}
                    className="hover:text-ink"
                  >
                    {item.published ? "Hide" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteTestimonialAction(item.id);
                      router.refresh();
                    }}
                    className="hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
              {testimonialDraft.id ? "Edit testimonial" : "Add a testimonial"}
            </p>
            <div>
              <label className="label">Client name</label>
              <input className="field" value={testimonialDraft.name} onChange={(e) => setTestimonialDraft({ ...testimonialDraft, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Role / session</label>
              <input className="field" value={testimonialDraft.role} onChange={(e) => setTestimonialDraft({ ...testimonialDraft, role: e.target.value })} />
            </div>
            <div>
              <label className="label">Quote</label>
              <textarea rows={4} className="field resize-none" value={testimonialDraft.quote} onChange={(e) => setTestimonialDraft({ ...testimonialDraft, quote: e.target.value })} />
            </div>
            <div>
              <label className="label">Rating</label>
              <select className="field" value={testimonialDraft.rating} onChange={(e) => setTestimonialDraft({ ...testimonialDraft, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} stars</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const result = await saveTestimonialAction({
                    id: testimonialDraft.id || undefined,
                    name: testimonialDraft.name,
                    role: testimonialDraft.role,
                    quote: testimonialDraft.quote,
                    rating: testimonialDraft.rating,
                    published: testimonialDraft.published,
                  });
                  setBusy(false);
                  if (result.ok) {
                    setTestimonialDraft({ id: "", name: "", role: "", quote: "", rating: 5, published: true });
                    setMessage("Testimonial saved.");
                    router.refresh();
                  } else setError(result.error);
                }}
                className="btn-dark py-2.5 text-[9px] disabled:opacity-60"
              >
                {testimonialDraft.id ? "Update" : "Add testimonial"}
              </button>
              {testimonialDraft.id ? (
                <button type="button" onClick={() => setTestimonialDraft({ id: "", name: "", role: "", quote: "", rating: 5, published: true })} className="text-[9px] uppercase tracking-[0.14em] text-smoke">
                  Cancel
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "FAQ" ? (
        <section className="space-y-4 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Frequently asked questions</p>
          {faqDraft.map((faq, index) => (
            <div key={index} className="space-y-2 border border-ink/10 p-4">
              <input
                className="field"
                value={faq.question}
                placeholder="Question"
                onChange={(e) => {
                  const next = [...faqDraft];
                  next[index] = { ...faq, question: e.target.value };
                  setFaqDraft(next);
                }}
              />
              <textarea
                rows={2}
                className="field resize-none"
                value={faq.answer}
                placeholder="Answer"
                onChange={(e) => {
                  const next = [...faqDraft];
                  next[index] = { ...faq, answer: e.target.value };
                  setFaqDraft(next);
                }}
              />
              <button type="button" onClick={() => setFaqDraft(faqDraft.filter((_, i) => i !== index))} className="text-[9px] uppercase tracking-[0.14em] text-rose-700">
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            <button type="button" onClick={() => setFaqDraft([...faqDraft, { question: "", answer: "" }])} className="btn-outline py-2.5 text-[9px]">
              + Add question
            </button>
            <button type="button" disabled={busy} onClick={() => persist({ faqs: faqDraft }, "FAQ saved.")} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
              Save FAQ
            </button>
          </div>
        </section>
      ) : null}

      {tab === "Instagram" ? (
        <div className="space-y-5">
          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Instagram strip images</p>
            <p className="mt-1 text-[11px] text-smoke/70">Six square images shown above the footer.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {draft.instagramImages.map((image, index) => (
                <div key={index}>
                  <img src={image} alt="" className="h-28 w-full object-cover" />
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 w-full text-[10px]"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      const result = await uploadAssetAction(formData);
                      if (result.ok) {
                        const next = [...draft.instagramImages];
                        next[index] = result.url;
                        setDraft({ ...draft, instagramImages: next });
                        await saveSiteContentAction({ instagramImages: next });
                        router.refresh();
                      } else setError(result.error);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Featured collections on the homepage</p>
            <p className="mt-1 text-[11px] text-smoke/70">
              Leave everything unchecked to show your first six published collections in order.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const checked = draft.featuredCategories.includes(category.id);
                return (
                  <label key={category.id} className="flex items-center gap-2 text-xs text-smoke">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...draft.featuredCategories, category.id]
                          : draft.featuredCategories.filter((id) => id !== category.id);
                        setDraft({ ...draft, featuredCategories: next });
                      }}
                    />
                    {category.name}
                  </label>
                );
              })}
            </div>
            <button type="button" disabled={busy} onClick={() => persist({ featuredCategories: draft.featuredCategories }, "Featured collections saved.")} className="btn-dark mt-4 py-2.5 text-[9px] disabled:opacity-60">
              Save selection
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
