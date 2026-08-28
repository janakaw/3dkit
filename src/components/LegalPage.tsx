import type { ReactNode } from "react";

type Section = { heading: string; body: string };

export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections?: Section[];
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{intro}</p>
      {sections?.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
            {s.heading}
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
        </section>
      ))}
      {children}
    </main>
  );
}
