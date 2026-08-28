import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact 3Dkit — Asset Requests & Studio Enquiries" },
      {
        name: "description",
        content:
          "Contact the 3Dkit studio about model requests, custom furniture assets, licensing questions or team subscriptions.",
      },
      { property: "og:title", content: "Contact 3Dkit" },
      {
        property: "og:description",
        content: "Model requests, custom assets, licensing and team subscription enquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-5 py-14">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          Contact us
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Model requests, custom furniture commissions, licensing questions or team plans — write to
          us and a modeller from the studio will reply.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {sent ? (
            <div className="rounded-2xl bg-secondary p-8">
              <p className="font-display text-xl font-extrabold uppercase tracking-tight text-foreground">
                Message sent
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks — we have your message and will get back to you within one business day.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 rounded-full border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    required
                    className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="you@studio.com"
                    className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-subject"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Subject
                </label>
                <select
                  id="contact-subject"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
                >
                  <option>Model request</option>
                  <option>Custom furniture commission</option>
                  <option>Licensing question</option>
                  <option>Subscription or billing</option>
                  <option>Something else</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-brand px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
              >
                Send message
              </button>
            </form>
          )}

          <aside className="h-fit rounded-2xl bg-secondary p-6">
            {[
              { icon: Mail, t: "Email", d: "hello@3dkit.studio" },
              { icon: MessageSquare, t: "Asset requests", d: "Tell us the piece you need — we add requested models every week." },
              { icon: Clock, t: "Response time", d: "Within one business day, Monday to Friday." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3 py-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
