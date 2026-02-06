import { ArrowRight, Clock, DollarSign, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

interface IntroSectionProps {
  onStart: () => void;
}

const features = [
  { icon: Clock, text: "How many hours you're losing to decisions someone else could make" },
  { icon: Target, text: 'Your "Bottleneck Score" and what it means for your growth' },
  { icon: DollarSign, text: "The hidden cost of being in every loop" },
  { icon: AlertTriangle, text: "Whether you need a system overhaul or just a few tweaks" },
];

export function IntroSection({ onStart }: IntroSectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20 relative">
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-50">
        <ModeToggle />
      </div>

      <div className="max-w-3xl mx-auto text-center animate-fade-up w-full">
        <span className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20 mb-6">
          For SaaS Founders at $1M–$20M ARR
        </span>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
          The Founder{" "}
          <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent">
            Bottleneck Audit
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
          Find out if you're the reason your SaaS can't scale
        </p>

        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-10 text-left border border-border/80 shadow-lg shadow-primary/5">
          <p className="text-base sm:text-lg font-medium mb-5 text-foreground/90">
            This 10-minute self-assessment will reveal:
          </p>
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent flex-shrink-0 ring-1 ring-accent/10">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-foreground/85 text-sm sm:text-base pt-0.5">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          size="lg"
          onClick={onStart}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-base sm:text-lg rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 group"
        >
          Start Your Audit
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <p className="mt-5 text-sm text-muted-foreground">
          Takes about 10 minutes
        </p>
      </div>
    </div>
  );
}
