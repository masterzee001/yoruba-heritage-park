import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SectionHead({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 font-serif text-3xl leading-[1.1] text-forest-deep md:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-forest-deep text-ivory">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="size-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/60 via-forest-deep/40 to-forest-deep/85" />
        </div>
      )}
      <div className="container-y relative py-24 md:py-32">
        {eyebrow && <p className="eyebrow text-ivory/65">{eyebrow}</p>}
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] md:text-6xl">{title}</h1>
        {intro && (
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory/80 md:text-lg">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
