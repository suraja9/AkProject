import { DecisionCategory, OPERATIONAL_CATEGORY_IDS } from "@/types/audit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, AlertTriangle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface DecisionAuditProps {
  timeframe: 'Week' | 'Month';
  onTimeframeUpdate: (timeframe: 'Week' | 'Month') => void;
  categories: DecisionCategory[];
  onUpdate: (categories: DecisionCategory[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DecisionAudit({ timeframe, onTimeframeUpdate, categories, onUpdate, onNext, onBack }: DecisionAuditProps) {
  const totals = useMemo(() => {
    const totalDecisions = categories.reduce((sum, cat) => sum + cat.decisions, 0);
    const totalCouldDelegate = categories.reduce((sum, cat) => sum + cat.couldDelegate, 0);
    const totalNotSure = 0; // Removing Not Sure from calculations

    const operationalDecisions = categories
      .filter((cat) => OPERATIONAL_CATEGORY_IDS.includes(cat.id))
      .reduce((sum, cat) => sum + cat.decisions, 0);

    const operationalPercent = totalDecisions > 0
      ? Math.round((operationalDecisions / totalDecisions) * 100)
      : 0;

    return {
      totalDecisions,
      totalCouldDelegate,
      totalNotSure,
      operationalDecisions,
      operationalPercent,
    };
  }, [categories]);

  const handleFieldChange = (id: string, field: keyof DecisionCategory, value: number | boolean) => {
    onUpdate(
      categories.map((cat) =>
        cat.id === id ? { ...cat, [field]: typeof value === 'number' ? Math.max(0, value) : value } : cat
      )
    );
  };

  const getScoreLevel = (total: number) => {
    if (total <= 15) return { level: "Healthy", color: "text-success", bg: "bg-success/10" };
    if (total <= 30) return { level: "Elevated", color: "text-warning", bg: "bg-warning/10" };
    if (total <= 50) return { level: "Critical", color: "text-danger", bg: "bg-danger/10" };
    return { level: "Danger Zone", color: "text-danger", bg: "bg-danger/20" };
  };

  const scoreInfo = getScoreLevel(totals.totalDecisions);
  const isOperationalHigh = totals.operationalPercent > 30;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-up">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-4">
          Section 2 of 4
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          The Decision Audit
        </h2>
        <p className="text-mg max-w-2xl mx-auto mb-6">
          Think about a typical timeframe. For each category, estimate how many decisions you personally made that someone on your team could have made with the right framework or authority.
        </p>
        <div className="flex justify-center items-center gap-4">
          <span className="text-mg font-medium">I am estimating decisions per:</span>
          <div className="flex bg-secondary/30 p-1 rounded-xl">
            <button
              onClick={() => onTimeframeUpdate('Week')}
              className={cn(
                "px-5 py-2 rounded-lg font-medium transition-colors text-sm",
                timeframe === 'Week' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-secondary/50 text-foreground/80"
              )}
            >
              1 to 4 Weeks
            </button>
            <button
              onClick={() => onTimeframeUpdate('Month')}
              className={cn(
                "px-5 py-2 rounded-lg font-medium transition-colors text-sm",
                timeframe === 'Month' ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-secondary/50 text-foreground/80"
              )}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Decision Table */}
      <div className="glass-card rounded-2xl overflow-hidden mb-8">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 p-4 bg-secondary/30 border-b border-border text-sm font-medium text-foreground/80">
          <div className="col-span-4 text-xl">Category</div>
          <div className="col-span-4 text-mg text-left"># of decisions</div>
          <div className="col-span-4 text-mg text-left">Could delegate</div>
        </div>

        {/* Rows */}
        {categories.map((category) => (
          <div
            key={category.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-border/50 last:border-0 items-center hover:bg-secondary/20 transition-colors"
          >
            <div className="col-span-1 md:col-span-4 text-mg font-medium flex items-center gap-2">
              <span>{category.name}</span>
              {category.description && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] sm:max-w-sm text-xs md:text-sm p-3 whitespace-pre-line leading-relaxed">
                      <p>{category.description.split(' · ').join('\n• ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="col-span-1 md:col-span-8 grid grid-cols-2 gap-4 items-center">
              <div className="flex flex-col items-center gap-2 md:hidden">
                <span className="text-xs text-foreground/75"># of decisions</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={category.decisions || ""}
                  onChange={(e) => handleFieldChange(category.id, 'decisions', parseInt(e.target.value) || 0)}
                  className="w-full text-center input-field"
                  placeholder="0"
                />
              </div>
              <div className="hidden md:block px-4">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={category.decisions || ""}
                  onChange={(e) => handleFieldChange(category.id, 'decisions', parseInt(e.target.value) || 0)}
                  className="w-full text-center input-field"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col items-center gap-2 md:hidden">
                <span className="text-xs text-foreground/75">Could delegate</span>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={category.couldDelegate || ""}
                  onChange={(e) => handleFieldChange(category.id, 'couldDelegate', parseInt(e.target.value) || 0)}
                  className="w-full text-center input-field"
                  placeholder="0"
                />
              </div>
              <div className="hidden md:block px-4">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={category.couldDelegate || ""}
                  onChange={(e) => handleFieldChange(category.id, 'couldDelegate', parseInt(e.target.value) || 0)}
                  className="w-full text-center input-field"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

        ))}
      </div>

      {/* Mini Calculation Section */}

      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-display text-2xl font-semibold mb-4">Decision Metrics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-mg text-foreground/80">Total decisions (all categories)</span>
            <span className="font-semibold text-lg">{totals.totalDecisions}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-mg text-foreground/80">Operational decisions</span>
            <span className="font-semibold text-lg">{totals.operationalDecisions}</span>
          </div>
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg",
            isOperationalHigh ? "bg-danger/10" : "bg-secondary/30"
          )}>
            <span className="text-mg text-foreground/80">Operational %</span>
            <span className={cn(
              "font-semibold text-lg",
              isOperationalHigh ? "text-danger" : "text-foreground"
            )}>
              {totals.operationalPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Insight Box */}
      <div className={cn(
        "rounded-2xl p-5 mb-8 border",
        isOperationalHigh
          ? "bg-danger/5 border-danger/20"
          : "bg-warning/5 border-warning/20"
      )}>
        <div className="flex gap-3">
          <AlertTriangle className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5",
            isOperationalHigh ? "text-danger" : "text-warning"
          )} />
          <div>
            <p className="font-semibold text-2xl mb-1">Watch this number:</p>
            <p className="text-lg text-foreground/80">
              If more than 30% of your total decisions are operational (day-to-day running of the business vs. strategic), scaling will be extremely difficult.
            </p>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-2xl text-foreground/75 mb-1">Total Decisions / {timeframe}</p>
            <p className="text-4xl font-display font-bold">{totals.totalDecisions}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-mg text-foreground/75">
              <span>Could Delegate: <strong className="text-success">{totals.totalCouldDelegate}</strong></span>
            </div>
          </div>
          <div className={cn("px-6 py-3 rounded-xl", scoreInfo.bg)}>
            <p className="text-mg text-foreground/75 mb-0.5">Your Decision Load</p>
            <p className={cn("text-xl font-bold", scoreInfo.color)}>{scoreInfo.level}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <p className="font-semibold text-lg text-success">0–15</p>
            <p className="text-lg">Healthy</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 text-center">
            <p className="font-semibold text-lg text-warning">16–30</p>
            <p className="text-lg">Elevated</p>
          </div>
          <div className="p-3 rounded-lg bg-danger/10 text-center">
            <p className="font-semibold text-lg text-danger">31–50</p>
            <p className="text-lg">Critical</p>
          </div>
          <div className="p-3 rounded-lg bg-danger/20 text-center">
            <p className="font-semibold text-lg text-danger">50+</p>
            <p className="text-lg">Danger Zone</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-lg hover:text-foreground"
        >
          <ArrowLeft className="mr-2 w-4 h-4 " />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-accent text-lg hover:bg-accent/90 text-accent-foreground font-semibold px-6"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
