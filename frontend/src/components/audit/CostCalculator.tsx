import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, DollarSign, Clock, Calculator, AlertCircle, Info, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DelayTaxItem, DelayTaxValues } from "@/types/audit";
import { cn } from "@/lib/utils";

// --- Custom Components for Delay Tax ---

const RateTooltip = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-72 sm:w-80 glass-card border border-border rounded-xl p-5 z-50 shadow-xl text-left animate-fade-up" style={{ animationDuration: '0.2s' }}>
      <div className="text-xs font-bold text-accent mb-4 uppercase tracking-wider">
        How to find your rate
      </div>
      {[
        { num: "1", title: "Pipeline method", desc: "Look at deals waiting on a feature. How many didn't close or churned? That ratio is your rate." },
        { num: "2", title: "Past launch method", desc: "Pick a late feature. Compare month-1 revenue vs projection. Gap ÷ projected = monthly loss rate ÷ 4 = weekly." },
        { num: "3", title: "Competitive pressure", desc: "High competition → 30–40%   Moderate → 20–25%   Low / unique → 10–15%" },
      ].map((item) => (
        <div key={item.num} className="flex gap-4 mb-4 last:mb-0 items-start">
          <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold mt-0.5">
            {item.num}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground mb-1">{item.title}</div>
            <div className="text-sm text-foreground/75 leading-relaxed">{item.desc}</div>
          </div>
        </div>
      ))}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-r border-b border-border rotate-45 pointer-events-none" />
    </div>
  );
};

const fmt = (n: number) =>
  n === 0 ? "$0" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function InputCol({ label, prefix, val, onChange }: { label: string, prefix: string, val: string, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm text-foreground/80 font-medium">{label}</span>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">{prefix}</span>
        <Input
          type="number" min="0" placeholder="0"
          value={val}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 input-field h-11 text-base font-semibold"
        />
      </div>
    </div>
  );
}

// --- End Custom Components ---

interface CostCalculatorProps {
  timeframe: 'Week' | 'Month';
  totalDecisions: number;
  totalCouldDelegate: number;
  totalNotSure: number;
  annualCompensation: number;
  averageMinutes: number;
  delayTax: DelayTaxItem[];
  delayTaxValues: DelayTaxValues;
  onUpdate: (comp: number, minutes: number) => void;
  onUpdateDelayTax: (delayTax: DelayTaxItem[], delayTaxValues: DelayTaxValues) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CostCalculator({
  timeframe,
  totalDecisions,
  totalCouldDelegate,
  totalNotSure,
  annualCompensation,
  averageMinutes,
  delayTax,
  delayTaxValues,
  onUpdate,
  onUpdateDelayTax,
  onNext,
  onBack,
}: CostCalculatorProps) {
  const [animatedCost, setAnimatedCost] = useState(0);

  // Calculate decisions for hours lost: use couldDelegate if available, else use totalDecisions
  const decisionsForHoursLost = useMemo(() => {
    return totalCouldDelegate > 0 ? totalCouldDelegate : totalDecisions;
  }, [totalCouldDelegate, totalDecisions]);

  const hourlyRate = annualCompensation / 2000;
  const weeklyDecisions = timeframe === 'Month' ? decisionsForHoursLost / 4 : decisionsForHoursLost;
  const minutesPerWeek = weeklyDecisions * averageMinutes;
  const hoursPerWeek = minutesPerWeek / 60;
  const hoursPerYear = hoursPerWeek * 50;
  const sectionACost = hoursPerYear * hourlyRate;

  // Delay Tax computations matching delay-tax.jsx
  const productVal = (parseFloat(delayTaxValues.product.arr) || 0) * (parseFloat(delayTaxValues.product.months) || 0) / 12;
  const featureRate = delayTaxValues.feature.rate || "25";
  const featureVal = (parseFloat(delayTaxValues.feature.mrr) || 0) * (parseFloat(delayTaxValues.feature.weeks) || 0) * (parseFloat(featureRate) / 100);
  const dealsVal = (parseFloat(delayTaxValues.deals.count) || 0) * (parseFloat(delayTaxValues.deals.value) || 0) * ((parseFloat(delayTaxValues.deals.rate) || 0) / 100);
  const churnVal = (parseFloat(delayTaxValues.churn.customers) || 0) * (parseFloat(delayTaxValues.churn.mrr) || 0) * 12;

  const totalDelayTaxPeriod = productVal + featureVal + dealsVal + churnVal;
  const delayTaxAnnual = totalDelayTaxPeriod * 12;

  const totalBottleneckCost = sectionACost + delayTaxAnnual;

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = totalBottleneckCost / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setAnimatedCost(totalBottleneckCost);
        clearInterval(timer);
      } else {
        setAnimatedCost(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalBottleneckCost]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Section B Logic
  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowRateTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const setDelayTaxVal = (section: keyof DelayTaxValues, key: string, val: string) => {
    const newValues: DelayTaxValues = {
      ...delayTaxValues,
      [section]: { ...delayTaxValues[section], [key]: val }
    } as any;

    // Auto-update amounts based on the new val calculations to sync with delayTaxItem array upstream (for compatibility)
    const pVal = (parseFloat(newValues.product.arr) || 0) * (parseFloat(newValues.product.months) || 0) / 12;
    const fRate = newValues.feature.rate || "25";
    const fVal = (parseFloat(newValues.feature.mrr) || 0) * (parseFloat(newValues.feature.weeks) || 0) * (parseFloat(fRate) / 100);
    const dVal = (parseFloat(newValues.deals.count) || 0) * (parseFloat(newValues.deals.value) || 0) * ((parseFloat(newValues.deals.rate) || 0) / 100);
    const cVal = (parseFloat(newValues.churn.customers) || 0) * (parseFloat(newValues.churn.mrr) || 0) * 12;

    const newItems: DelayTaxItem[] = [
      { id: 'product', name: 'Product launches that shipped late', amount: pVal },
      { id: 'feature', name: 'Feature launches that shipped late', amount: fVal },
      { id: 'deals', name: 'Deals that stalled waiting for your approval', amount: dVal },
      { id: 'churn', name: 'Customers who churned while waiting for resolution', amount: cVal },
    ];

    onUpdateDelayTax(newItems, newValues);
  };

  const rows = [
    {
      id: "product",
      label: "Product launches that shipped late",
      formula: "Expected Year 1 ARR × months delayed ÷ 12",
      hint: "Use this for entirely new products entering the market. Delay here means a competitor can take that ground instead of you.",
      exampleLine: "e.g. $200,000 ARR × 3 months ÷ 12 = $50,000",
      value: productVal,
      inputs: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
          <InputCol label="Expected Year 1 ARR" prefix="$" val={delayTaxValues.product.arr} onChange={(v) => setDelayTaxVal("product", "arr", v)} />
          <InputCol label="Months delayed" prefix="#" val={delayTaxValues.product.months} onChange={(v) => setDelayTaxVal("product", "months", v)} />
        </div>
      ),
    },
    {
      id: "feature",
      label: "Feature launches that shipped late",
      formula: `Expected MRR uplift × weeks delayed × ${parseFloat(featureRate) || 25}%`,
      hint: "Use this for features that drive upsell, reduce churn, or unlock new usage within your existing customer base.",
      exampleLine: `e.g. $5,000 MRR uplift × 3 weeks × ${parseFloat(featureRate) || 25}% = ${fmt((5000 * 3 * (parseFloat(featureRate) || 25)) / 100)}`,
      value: featureVal,
      inputs: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4 items-end">
          <InputCol label="Expected MRR uplift" prefix="$" val={delayTaxValues.feature.mrr} onChange={(v) => setDelayTaxVal("feature", "mrr", v)} />
          <InputCol label="Weeks delayed" prefix="#" val={delayTaxValues.feature.weeks} onChange={(v) => setDelayTaxVal("feature", "weeks", v)} />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/80 font-medium tracking-tight">
                Weekly delay rate
              </span>
              <div ref={tooltipRef} className="relative leading-none">
                <button
                  onClick={() => setShowRateTooltip((v) => !v)}
                  className="bg-transparent border-none cursor-pointer p-0 flex items-center text-accent hover:text-accent/80 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                <RateTooltip visible={showRateTooltip} />
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">%</span>
              <Input
                type="number" min="1" max="100"
                value={featureRate}
                onChange={(e) => setDelayTaxVal("feature", "rate", e.target.value)}
                className="pl-8 input-field h-11 text-base font-semibold"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "deals",
      label: "Deals that stalled waiting for your approval",
      formula: "No. of deals × avg deal value × close rate %",
      hint: "Your close rate is the % of qualified deals you typically win. Default to 50% if unsure.",
      exampleLine: "e.g. 3 deals × $10,000 × 60% = $18,000",
      value: dealsVal,
      inputs: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">
          <InputCol label="No. of stalled deals" prefix="#" val={delayTaxValues.deals.count} onChange={(v) => setDelayTaxVal("deals", "count", v)} />
          <InputCol label="Average deal value" prefix="$" val={delayTaxValues.deals.value} onChange={(v) => setDelayTaxVal("deals", "value", v)} />
          <InputCol label="Close rate" prefix="%" val={delayTaxValues.deals.rate} onChange={(v) => setDelayTaxVal("deals", "rate", v)} />
        </div>
      ),
    },
    {
      id: "churn",
      label: "Customers who churned while waiting for resolution",
      formula: "No. of churned customers × avg MRR per customer × 12",
      hint: "Multiplying by 12 converts monthly churn into annual revenue loss — the real cost of slow resolution.",
      exampleLine: "e.g. 2 customers × $800 × 12 = $19,200",
      value: churnVal,
      inputs: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
          <InputCol label="No. of churned customers" prefix="#" val={delayTaxValues.churn.customers} onChange={(v) => setDelayTaxVal("churn", "customers", v)} />
          <InputCol label="Avg MRR per customer" prefix="$" val={delayTaxValues.churn.mrr} onChange={(v) => setDelayTaxVal("churn", "mrr", v)} />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-4">
          Section 3 of 4
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          The Hidden Cost Calculator
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-foreground/80">
          Let's translate your bottleneck into dollars. This is the part most founders skip, and it's why they don't prioritize fixing it.
        </p>
      </div>

      {/* Section A */}
      <div className="mb-8">
        <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">A</span>
          Your Time Cost
        </h3>

        <div className="space-y-6">
          {/* Step 1: Hourly Rate */}
          <div className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-display text-2xl font-semibold">Step 1: Calculate your effective hourly rate</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-base text-foreground/80 mb-1 block">
                  Your annual compensation (salary + equity value)
                </label>
                <p className="text-sm text-foreground/60 mb-3 italic">
                  (Using 50 weeks to account for time off. Your actual number may be higher)
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/80">$</span>
                  <Input
                    type="number"
                    value={annualCompensation || ""}
                    onChange={(e) => onUpdate(parseInt(e.target.value) || 0, averageMinutes)}
                    className="pl-8 input-field text-lg font-mono bg-background"
                    placeholder="400000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                <span className="text-foreground/80 text-sm sm:text-base">Divided by 2,000 hours (50 wks × 40 hrs)</span>
                <span className="font-semibold text-lg font-mono">{formatCurrency(hourlyRate)}/hr</span>
              </div>
            </div>
          </div>

          {/* Step 2: Hours Lost */}
          <div className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-display text-2xl font-semibold">Step 2: Calculate hours lost to low-leverage decisions</h4>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div>
                  <span className="text-foreground/80 text-sm sm:text-base">Delegatable decisions per {timeframe.toLowerCase()}</span>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    {totalCouldDelegate > 0
                      ? "(Could Delegate)"
                      : "(Using # of decisions since no delegation data entered)"}
                  </p>
                </div>
                <span className="font-semibold text-lg">{decisionsForHoursLost} decisions</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-foreground/80">
                    Average time per decision (usually 15–30 min)
                  </label>
                  <span className="font-semibold text-accent">{averageMinutes} min</span>
                </div>
                <Slider
                  value={[averageMinutes]}
                  onValueChange={(value) => onUpdate(annualCompensation, value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-foreground/60 mt-2">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl text-center border border-border/50">
                  <p className="text-sm text-foreground/75 mb-1">Minutes / Week</p>
                  <p className="text-2xl font-bold">{minutesPerWeek}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl text-center border border-border/50">
                  <p className="text-sm text-foreground/75 mb-1">Hours / Week</p>
                  <p className="text-2xl font-bold">{hoursPerWeek.toFixed(1)}</p>
                </div>
              </div>

              <div className="p-5 bg-accent/10 rounded-xl text-center border border-accent/20">
                <p className="text-base text-foreground/75 mb-1">Section A: Annual Time Cost</p>
                <p className="text-4xl font-display font-bold text-accent font-mono py-1">
                  {formatCurrency(sectionACost)}
                </p>
                <p className="text-sm text-foreground/65 mt-1">
                  {hoursPerWeek.toFixed(1)} hrs/week × 50 weeks × {formatCurrency(hourlyRate)}/hr
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: The Delay Tax */}
      <div className="mb-12">
        <h3 className="font-display text-3xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center text-lg font-bold">B</span>
          The Delay Tax
        </h3>
        <p className="text-foreground/80 text-lg mb-6">
          Your time cost is just part of the picture. When decisions wait on you, revenue gets delayed or lost entirely. Estimate the impact over the {timeframe === 'Week' ? 'last 1 to 4 Weeks' : 'last Month'}:
        </p>

        <div className="glass-card rounded-2xl p-6 border border-border">
          {rows.map((row) => (
            <div key={row.id} className="bg-secondary/20 border border-border/60 rounded-xl p-5 sm:p-6 mb-6 hover:shadow-sm hover:border-accent/30 transition-all group">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="font-display text-xl font-semibold text-foreground">{row.label}</div>
                <div className={cn(
                  "shrink-0 text-right min-w-[100px]",
                  row.value > 0 ? "text-accent font-bold" : "text-muted-foreground/60 font-semibold"
                )}>
                  {row.value > 0 ? <span className="text-2xl">{fmt(row.value)}</span> : <span className="text-lg">—</span>}
                </div>
              </div>

              {row.inputs}

              <button
                className="flex items-center gap-1.5 mt-5 text-sm text-foreground/60 hover:text-foreground transition-colors font-medium"
                onClick={() => toggle(row.id)}
              >
                <Info className="w-4 h-4 text-accent/70" />
                How this is calculated
                <ChevronDown className={cn("w-4 h-4 transition-transform", expanded[row.id] && "rotate-180")} />
              </button>

              {expanded[row.id] && (
                <div className="mt-4 bg-background rounded-xl p-5 text-left border border-border/50 border-l-4 border-l-accent animate-fade-up shadow-sm" style={{ animationDuration: '0.2s' }}>
                  <div className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-accent" />
                    Formula
                  </div>
                  <div className="text-accent text-sm font-semibold p-3 bg-accent/5 rounded-lg mb-4">{row.formula}</div>
                  <div className="text-sm font-medium text-foreground mb-1">Example:</div>
                  <div className="text-foreground/70 text-sm mb-4 italic">{row.exampleLine}</div>
                  <div className="text-foreground/80 text-sm leading-relaxed max-w-2xl">{row.hint}</div>
                </div>
              )}
            </div>
          ))}

          <div className="h-px bg-border my-6" />

          <div className="flex justify-between items-center p-4 bg-warning/10 rounded-xl mb-4 border border-warning/20">
            <span className="text-foreground font-semibold text-base sm:text-lg">Total Delay Tax ({timeframe === 'Week' ? 'estimated weekly' : 'last month'})</span>
            <span className="text-foreground text-2xl font-bold">{fmt(totalDelayTaxPeriod)}</span>
          </div>
          <div className="flex justify-between items-center p-5 bg-warning/20 border border-warning/30 rounded-xl">
            <span className="font-semibold text-base sm:text-lg">Multiply by {timeframe === 'Month' ? '12' : '50'} for annual impact</span>
            <span className="text-warning text-3xl font-bold">{fmt(delayTaxAnnual)}/yr</span>
          </div>
        </div>
      </div>

      {/* Total Bottleneck Cost */}
      <div className="glass-card rounded-2xl p-6 mb-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-danger/10 text-danger">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="font-display text-2xl font-semibold">Total Annual Bottleneck Cost</h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg border border-border/50">
            <span className="text-foreground/80 text-sm sm:text-base">Section A: Time Cost</span>
            <span className="font-semibold font-mono">{formatCurrency(sectionACost)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg border border-border/50">
            <span className="text-foreground/80 text-sm sm:text-base">Section B: Delay Tax</span>
            <span className="font-semibold font-mono">{formatCurrency(delayTaxAnnual)}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-8 text-center bg-danger/10 border border-danger/20">
          <p className="text-base sm:text-lg text-foreground/80 mb-2 relative">Annual Bottleneck Cost</p>
          <p className="text-5xl sm:text-6xl font-display font-bold text-danger relative animate-count-up font-mono">
            {formatCurrency(animatedCost)}
          </p>
          <p className="text-sm sm:text-base text-foreground/75 mt-4 relative max-w-lg mx-auto">
            That's not just money. That's strategic time you'll never get back.
          </p>
        </div>
      </div>

      {/* Hidden Costs Callout */}
      <div className="rounded-2xl p-6 mb-8 bg-muted/50 border border-border">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Hidden Costs Not Included:</h4>
            <p className="text-sm text-foreground/80 mb-3">This calculation doesn't include:</p>
            <ul className="text-sm text-foreground/75 space-y-1.5 list-disc list-inside">
              <li>Hours your team wastes waiting for your decisions</li>
              <li>Partnerships or opportunities that went cold</li>
              <li>Marketing campaigns launched late</li>
              <li>Pricing or strategic changes you kept delaying</li>
              <li>Strategic initiatives you never start because you're stuck in operations</li>
              <li>Burnout and poor decisions from decision fatigue</li>
              <li>Team members who leave because they feel micromanaged</li>
            </ul>
            <p className="text-sm font-medium text-foreground mt-4">
              Your true bottleneck cost is likely 2-3× higher than the number above.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
