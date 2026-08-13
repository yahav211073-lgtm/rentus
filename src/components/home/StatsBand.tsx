import { Counter } from "@/components/motion/Counter";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { seedStats } from "@/data/seed";

/**
 * רצועת מספרים.
 *
 * רקע כהה בכוונה — היא שוברת את רצף הסקציות הבהירות בערך באמצע
 * העמוד ונותנת לעין מקום לנוח. בלי השבירה הזו עמוד ארוך מתחיל
 * להרגיש כמו סקרול אינסופי של אותו דבר.
 */
export function StatsBand() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900 py-16 sm:py-20">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 70% at 20% 0%, rgba(74,135,214,0.35), transparent 60%)," +
              "radial-gradient(45% 60% at 85% 100%, rgba(255,193,7,0.14), transparent 65%)",
          }}
        />
        <div className="bg-grid absolute inset-0 opacity-40" />
      </div>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            המספרים מאחורי Rentus
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-md text-white/60">
            כל מספר כאן נספר מחדש בכל לילה. אנחנו לא מעגלים כלפי מעלה.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {seedStats.map((stat) => (
            <RevealItem key={stat.id}>
              <div className="group relative h-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent-400/35 hover:bg-white/[0.1] sm:p-8">
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-sm bg-accent-400/12 text-accent-400 transition-transform duration-300 group-hover:scale-110">
                  <CategoryIcon name={stat.icon} className="h-5.5 w-5.5" strokeWidth={2.1} />
                </span>
                <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-white/55">{stat.label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
