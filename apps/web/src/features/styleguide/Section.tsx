import type { ReactNode } from 'react';

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="wrap border-t border-line py-16">
      <h2 className="font-display text-[34px] leading-none font-bold lowercase [font-stretch:75%]">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
