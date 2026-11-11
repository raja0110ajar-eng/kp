import { ChevronDown } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Faq() {
  if (siteConfig.faq.length === 0) return null;

  return (
    <section id="faq" className="bg-soft py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Pertanyaan yang sering muncul
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {siteConfig.faq.map((entry) => (
            <details key={entry.question} className="group py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
                {entry.question}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="pb-4 leading-relaxed text-muted">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}