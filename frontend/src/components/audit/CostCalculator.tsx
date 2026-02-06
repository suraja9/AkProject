import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, DollarSign, Clock, Calculator, AlertCircle } from "lucide-react";
import { DelayTaxItem } from "@/types/audit";

interface CostCalculatorProps {
  totalDecisions: number;
  totalCouldDelegate: number;
  totalNotSure: number;
  annualCompensation: number;
  averageMinutes: number;
  delayTax: DelayTaxItem[];
  onUpdate: (comp: number, minutes: number) => void;
  onUpdateDelayTax: (delayTax: DelayTaxItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CostCalculator({
  totalDecisions,
  totalCouldDelegate,
  totalNotSure,
  annualCompensation,
  averageMinutes,
  delayTax,
  onUpdate,
  onUpdateDelayTax,
  onNext,
  onBack,
}: CostCalculatorProps) {
  const [animatedCost, setAnimatedCost] = useState(0);

  // Calculate decisions for hours lost: use couldDelegate + notSure if they exist, else use totalDecisions
  const decisionsForHoursLost = useMemo(() => {
    const delegatableDecisions = totalCouldDelegate + totalNotSure;
    return delegatableDecisions > 0 ? delegatableDecisions : totalDecisions;
  }, [totalCouldDelegate, totalNotSure, totalDecisions]);

  const hourlyRate = annualCompensation / 2000;
  const minutesPerWeek = decisionsForHoursLost * averageMinutes;
  const hoursPerWeek = minutesPerWeek / 60;
  const hoursPerYear = hoursPerWeek * 50;
  const sectionACost = hoursPerYear * hourlyRate;

  // Section B: Delay Tax calculations
  const totalDelayTax30Days = useMemo(() => 
    delayTax.reduce((sum, item) => sum + item.amount, 0), 
    [delayTax]
  );
  const delayTaxAnnual = totalDelayTax30Days * 12;

  // Total Bottleneck Cost
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

  const handleDelayTaxChange = (id: string, amount: number) => {
    onUpdateDelayTax(
      delayTax.map((item) =>
        item.id === id ? { ...item, amount: Math.max(0, amount) } : item
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-4">
          Section 3 of 4
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          The Hidden Cost Calculator
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Let's translate your bottleneck into dollars. This is the part most founders skip, and it's why they don't prioritize fixing it.
        </p>
      </div>

      {/* Section A */}
      <div className="mb-8">
        <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">A</span>
          Your Time Cost
        </h3>

        <div className="space-y-6">
          {/* Step 1: Hourly Rate */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-display text-lg font-semibold">Step 1: Calculate your effective hourly rate</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Your annual compensation (salary + equity value)
                </label>
                <p className="text-xs text-muted-foreground/70 mb-2 italic">
                  (Using 50 weeks to account for time off. Your actual number may be higher)
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={annualCompensation || ""}
                    onChange={(e) => onUpdate(parseInt(e.target.value) || 0, averageMinutes)}
                    className="pl-8 input-field text-lg"
                    placeholder="400000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <span className="text-muted-foreground">Divided by 2,000 hours (50 weeks × 40 hrs)</span>
                <span className="font-semibold text-lg">{formatCurrency(hourlyRate)}/hr</span>
              </div>
            </div>
          </div>

          {/* Step 2: Hours Lost */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-display text-lg font-semibold">Step 2: Calculate hours lost to low-leverage decisions</h4>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div>
                  <span className="text-muted-foreground">Delegatable decisions per week</span>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {totalCouldDelegate + totalNotSure > 0 
                      ? "(Could Delegate + Not Sure)" 
                      : "(Using #Decisions since no delegation data entered)"}
                  </p>
                </div>
                <span className="font-semibold text-lg">{decisionsForHoursLost} decisions</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-muted-foreground">
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
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">Minutes / Week</p>
                  <p className="text-2xl font-bold">{minutesPerWeek}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">Hours / Week</p>
                  <p className="text-2xl font-bold">{hoursPerWeek.toFixed(1)}</p>
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-xl text-center border border-accent/20">
                <p className="text-sm text-muted-foreground mb-1">Section A: Annual Time Cost</p>
                <p className="text-3xl font-display font-bold text-accent">
                  {formatCurrency(sectionACost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hoursPerWeek.toFixed(1)} hrs/week × 50 weeks × {formatCurrency(hourlyRate)}/hr
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: The Delay Tax */}
      <div className="mb-8">
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center text-sm font-bold">B</span>
          The Delay Tax
        </h3>
        <p className="text-muted-foreground mb-6">
          Your time cost is just part of the picture. When decisions wait on you, revenue gets delayed or lost entirely. Estimate the impact over the last 30 days:
        </p>

        <div className="glass-card rounded-2xl p-6">
          <div className="space-y-4">
            {delayTax.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-secondary/30 rounded-xl">
                <span className="text-sm text-muted-foreground">{item.name}</span>
                <div className="relative w-full sm:w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => handleDelayTaxChange(item.id, parseInt(e.target.value) || 0)}
                    className="pl-7 input-field text-right"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}

            <div className="border-t border-border pt-4 mt-4">
              <div className="flex justify-between items-center p-3 bg-warning/10 rounded-xl mb-3">
                <span className="font-medium">Total Delay Tax (last 30 days)</span>
                <span className="font-bold text-lg">{formatCurrency(totalDelayTax30Days)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-warning/20 rounded-xl">
                <span className="font-medium">Multiply by 12 for annual impact</span>
                <span className="font-bold text-xl text-warning">{formatCurrency(delayTaxAnnual)}/year</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Bottleneck Cost */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-danger/10 text-danger">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="font-display text-xl font-semibold">Total Annual Bottleneck Cost</h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground">Section A: Time Cost</span>
            <span className="font-semibold">{formatCurrency(sectionACost)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground">Section B: Delay Tax</span>
            <span className="font-semibold">{formatCurrency(delayTaxAnnual)}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-8 text-center bg-gradient-to-br from-danger/20 via-warning/10 to-danger/20 border border-danger/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--danger)/0.1)_0%,_transparent_70%)]" />
          <p className="text-sm text-muted-foreground mb-2 relative">Annual Bottleneck Cost</p>
          <p className="text-5xl sm:text-6xl font-display font-bold text-danger relative animate-count-up">
            {formatCurrency(animatedCost)}
          </p>
          <p className="text-sm text-muted-foreground mt-4 relative">
            That's not just money. That's strategic time you'll never get back.
          </p>
        </div>
      </div>

      {/* Hidden Costs Callout */}
      <div className="rounded-2xl p-6 mb-8 bg-muted/50 border border-border">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-3">Hidden Costs Not Included:</h4>
            <p className="text-sm text-muted-foreground mb-3">This calculation doesn't include:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
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
          className="text-muted-foreground hover:text-foreground"
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
