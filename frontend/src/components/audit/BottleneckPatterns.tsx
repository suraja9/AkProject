import { BottleneckPattern } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottleneckPatternsProps {
  patterns: BottleneckPattern[];
  onUpdate: (patterns: BottleneckPattern[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BottleneckPatterns({ patterns, onUpdate, onNext, onBack }: BottleneckPatternsProps) {
  const checkedCount = patterns.filter((p) => p.checked).length;

  const handleToggle = (id: string) => {
    onUpdate(
      patterns.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p))
    );
  };

  const getStatusInfo = (count: number) => {
    if (count <= 1) return { status: "Manageable", color: "text-success", bg: "bg-success/10" };
    if (count <= 3) return { status: "System Needed", color: "text-warning", bg: "bg-warning/10" };
    return { status: "Urgent Overhaul", color: "text-danger", bg: "bg-danger/10" };
  };

  const statusInfo = getStatusInfo(checkedCount);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-4">
          Section 4 of 4
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          The 5 Bottleneck Patterns
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Check all that apply to you. The more you check, the more urgent your need for a decision system.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => handleToggle(pattern.id)}
            className={cn(
              "w-full text-left glass-card rounded-2xl p-6 transition-all duration-300 border-2 group",
              pattern.checked
                ? "border-accent bg-accent/5"
                : "border-transparent hover:border-accent/30"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                  pattern.checked
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-muted-foreground/30 group-hover:border-accent/50"
                )}
              >
                {pattern.checked && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "font-display text-lg font-semibold mb-2 transition-colors",
                  pattern.checked ? "text-accent" : "text-foreground"
                )}>
                  {pattern.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {pattern.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Status Display */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Patterns Checked</p>
            <p className="text-4xl font-display font-bold">{checkedCount} out of 5</p>
          </div>
          <div className={cn("px-6 py-3 rounded-xl", statusInfo.bg)}>
            <p className="text-sm text-muted-foreground mb-0.5">Your Status</p>
            <p className={cn("text-xl font-bold", statusInfo.color)}>{statusInfo.status}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <p className="font-semibold text-success">0–1</p>
            <p className="text-muted-foreground">Manageable</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 text-center">
            <p className="font-semibold text-warning">2–3</p>
            <p className="text-muted-foreground">System Needed</p>
          </div>
          <div className="p-3 rounded-lg bg-danger/10 text-center">
            <p className="font-semibold text-danger">4–5</p>
            <p className="text-muted-foreground">Urgent Overhaul</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6"
        >
          See My Results
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
