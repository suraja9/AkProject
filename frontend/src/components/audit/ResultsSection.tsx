import { AuditResults } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ExternalLink, TrendingUp, DollarSign, Target, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { ModeToggle } from "@/components/mode-toggle";

interface ResultsSectionProps {
  results: AuditResults;
  onBack: () => void;
  onRestart: () => void;
}

export function ResultsSection({ results, onBack, onRestart }: ResultsSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getOverallMessage = () => {
    switch (results.overallStatus) {
      case "optimized":
        return {
          title: "You're Optimized",
          subtitle: "You've built good systems. Focus on maintaining them.",
          color: "text-success",
          bgClass: "score-healthy",
        };
      case "scaling-risk":
        return {
          title: "Scaling Risk Detected",
          subtitle: "You need decision frameworks. This is fixable in 60-90 days.",
          color: "text-warning",
          bgClass: "score-elevated",
        };
      case "critical":
        return {
          title: "Critical Intervention Needed",
          subtitle: "Urgent action required. Your growth ceiling is YOU.",
          color: "text-danger",
          bgClass: "score-critical",
        };
    }
  };

  const message = getOverallMessage();

  const getDecisionLoadLabel = () => {
    switch (results.decisionLoadLevel) {
      case "healthy": return "Healthy";
      case "elevated": return "Elevated";
      case "critical": return "Critical";
      case "danger": return "Danger Zone";
    }
  };

  const getDecisionLoadColor = () => {
    switch (results.decisionLoadLevel) {
      case "healthy": return "text-success";
      case "elevated": return "text-warning";
      case "critical": return "text-danger";
      case "danger": return "text-danger";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <div className="absolute top-8 right-4 z-50">
        <ModeToggle />
      </div>
      <div className="text-center mb-10 animate-fade-up">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-4">
          Your Results
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          Your Total Bottleneck Score
        </h2>
      </div>

      {/* Main Score Card */}
      <div className={cn(
        "rounded-3xl p-8 sm:p-12 text-center mb-8 animate-scale-in",
        message.bgClass
      )}>
        <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
          {message.title}
        </h3>
        <p className="text-white/80 text-lg max-w-md mx-auto">
          {message.subtitle}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-3 gap-4 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="p-3 rounded-xl bg-accent/10 text-accent w-fit mx-auto mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Decision Load</p>
          <p className="text-3xl font-display font-bold">{results.totalDecisions}</p>
          <p className="text-xs text-muted-foreground">decisions/week</p>
          <p className={cn("text-sm font-medium mt-2", getDecisionLoadColor())}>
            {getDecisionLoadLabel()}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="p-3 rounded-xl bg-danger/10 text-danger w-fit mx-auto mb-3">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Bottleneck Cost</p>
          <p className="text-3xl font-display font-bold">{formatCurrency(results.totalBottleneckCost)}</p>
          <p className="text-xs text-muted-foreground">/year</p>
          <p className="text-sm text-muted-foreground mt-2">
            Time: {formatCurrency(results.annualCost)} + Delay Tax: {formatCurrency(results.delayTaxAnnual)}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="p-3 rounded-xl bg-warning/10 text-warning w-fit mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Patterns</p>
          <p className="text-3xl font-display font-bold">{results.patternsChecked}</p>
          <p className="text-xs text-muted-foreground">out of 5</p>
          <p className={cn("text-sm font-medium mt-2",
            results.patternsChecked <= 1 ? "text-success" :
              results.patternsChecked <= 3 ? "text-warning" : "text-danger"
          )}>
            {results.patternsChecked <= 1 ? "Manageable" :
              results.patternsChecked <= 3 ? "System Needed" : "Urgent Overhaul"}
          </p>
        </div>
      </div>

      {/* The Uncomfortable Truth */}
      {results.overallStatus !== "optimized" && (
        <div className="glass-card rounded-2xl p-6 mb-8 border border-danger/20 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-danger/10 text-danger flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display text-lg font-semibold mb-2">The Uncomfortable Truth</h4>
              <p className="text-muted-foreground">
                Your company's growth ceiling isn't your market, your product, or your team.
                <span className="text-foreground font-medium"> It's your calendar.</span> Every week you delay fixing this costs you thousands of dollars and weeks of strategic momentum.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="glass-card rounded-2xl p-8 text-center mb-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="font-display text-2xl font-bold mb-3">Ready to Fix Your Bottleneck?</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Book a free 30-minute Bottleneck Clarity Call. We'll review your audit results together, identify your biggest bottleneck pattern, and map out a 90-day plan to fix it.
        </p>
        <Button
          size="lg"
          asChild
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-glow"
        >
          <a href="https://www.anilkarakkattuu.com/clarity" target="_blank" rel="noopener noreferrer">
            <Calendar className="mr-2 w-5 h-5" />
            Book Your Clarity Call
            <ExternalLink className="ml-2 w-4 h-4" />
          </a>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Free • No obligations • Actionable insights whether you work with me or not
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mb-8">
        <p className="font-display text-lg font-semibold text-foreground mb-1">Anil Karakkattuu</p>
        <p>Founder Operating Systems for Growth-Stage SaaS</p>
        <a
          href="https://www.anilkarakkattuu.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline mt-2 inline-block"
        >
          www.anilkarakkattuu.com
        </a>
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
          variant="outline"
          onClick={onRestart}
          className="border-accent/30 text-accent hover:bg-accent/10"
        >
          <RefreshCw className="mr-2 w-4 h-4" />
          Retake Audit
        </Button>
      </div>
    </div>
  );
}
