import { Counter } from "@/components/motion/Counter";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { seedStats } from "@/data/seed";

/**
 * רצועת מספרים — שטוחה, בלי כרטיסים, כמו ברפרנס: מספר גדול ותווית
 * מתחתיו, מופרדים בקו דק. רקע כהה בכוונה, שובר את רצף הסקציות הבהירות.
 */
export function StatsBand() {
  return (
    <section className="bg-brand-950 py-10 sm:py-12">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <RevealStagger className="grid grid-cols-2 divide-y divide-white/10 lg:grid-cols-4 lg:divide-y-0 lg:divide-x lg:divide-x-reverse">
          {seedStats.map((stat) => (
            <RevealItem key={stat.id}>
              <div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
                <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-white/55">{stat.label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
