
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AuditData,
  AuditResults,
  INITIAL_CATEGORIES,
  INITIAL_PATTERNS,
  INITIAL_DELAY_TAX
} from "@/types/audit";
import { IntroSection } from "./audit/IntroSection";
import { EmailCapture } from "./audit/EmailCapture";
import { UserSegmentation } from "./audit/UserSegmentation";
import { DecisionAudit } from "./audit/DecisionAudit";
import { CostCalculator } from "./audit/CostCalculator";
import { BottleneckPatterns } from "./audit/BottleneckPatterns";
import { ResultsSection } from "./audit/ResultsSection";
import { ProgressIndicator } from "./audit/ProgressIndicator";
import { ModeToggle } from "./mode-toggle";
import { tracker } from "@/lib/tracker";

type Step = "intro" | "email" | "segmentation" | "decisions" | "cost" | "patterns" | "results";

const STEP_LABELS = ["Segmentation", "Decisions", "Cost", "Patterns"];

export function FounderAudit() {
  const [step, setStep] = useState<Step>("intro");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [segmentation, setSegmentation] = useState({
    founderRole: "",
    revenueRange: "",
    teamSize: "",
    industryVertical: "",
  });
  const [auditData, setAuditData] = useState<AuditData>({
    decisionCategories: INITIAL_CATEGORIES,
    annualCompensation: 400000,
    averageMinutesPerDecision: 20,
    delayTax: INITIAL_DELAY_TAX,
    patterns: INITIAL_PATTERNS,
  });

  const totals = useMemo(() => {
    const totalDecisions = auditData.decisionCategories.reduce((sum, cat) => sum + cat.decisions, 0);
    const totalCouldDelegate = auditData.decisionCategories.reduce((sum, cat) => sum + cat.couldDelegate, 0);
    const totalNotSure = auditData.decisionCategories.filter((cat) => cat.notSure).length;
    return { totalDecisions, totalCouldDelegate, totalNotSure };
  }, [auditData.decisionCategories]);

  const results: AuditResults = useMemo(() => {
    const hourlyRate = auditData.annualCompensation / 2000;

    // Use couldDelegate if available, else totalDecisions
    const delegatableDecisions = totals.totalCouldDelegate;
    const decisionsForCalc = delegatableDecisions > 0 ? delegatableDecisions : totals.totalDecisions;

    const hoursPerWeek = (decisionsForCalc * auditData.averageMinutesPerDecision) / 60;
    const sectionACost = hoursPerWeek * 50 * hourlyRate;

    const delayTaxAnnual = auditData.delayTax.reduce((sum, item) => sum + item.amount, 0) * 12;
    const totalBottleneckCost = sectionACost + delayTaxAnnual;

    const patternsChecked = auditData.patterns.filter((p) => p.checked).length;

    let decisionLoadLevel: AuditResults["decisionLoadLevel"];
    if (totals.totalDecisions <= 15) decisionLoadLevel = "healthy";
    else if (totals.totalDecisions <= 30) decisionLoadLevel = "elevated";
    else if (totals.totalDecisions <= 50) decisionLoadLevel = "critical";
    else decisionLoadLevel = "danger";

    let overallStatus: AuditResults["overallStatus"];
    if (totals.totalDecisions < 20 && patternsChecked <= 1) overallStatus = "optimized";
    else if (totals.totalDecisions >= 35 || patternsChecked >= 4) overallStatus = "critical";
    else overallStatus = "scaling-risk";

    return {
      totalDecisions: totals.totalDecisions,
      decisionLoadLevel,
      hourlyRate,
      hoursPerWeek,
      annualCost: sectionACost,
      delayTaxAnnual,
      totalBottleneckCost,
      patternsChecked,
      overallStatus,
    };
  }, [auditData, totals]);

  const getCurrentStepNumber = () => {
    switch (step) {
      case "segmentation": return 1;
      case "decisions": return 2;
      case "cost": return 3;
      case "patterns": return 4;
      default: return 0;
    }
  };

  const handleRestart = () => {
    setAuditData({
      decisionCategories: INITIAL_CATEGORIES.map(c => ({
        ...c,
        decisions: 0,
        couldDelegate: 0,
        notSure: false
      })),
      annualCompensation: 400000,
      averageMinutesPerDecision: 20,
      delayTax: INITIAL_DELAY_TAX.map(d => ({ ...d, amount: 0 })),
      patterns: INITIAL_PATTERNS.map(p => ({ ...p, checked: false })),
    });
    setUserName("");
    setUserEmail("");
    setSegmentation({
      founderRole: "",
      revenueRange: "",
      teamSize: "",
      industryVertical: "",
    });
    setStep("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToStep = (newStep: Step) => {
    setStep(newStep);
    scrollToTop();
    if (newStep !== 'intro') {
      tracker.trackStep(newStep);
    }
  };

  const { toast } = useToast();

  const handleSaveResults = async () => {
    try {
      const sessionId = tracker.getSessionId();
      console.log("Saving audit results...");
      const response = await fetch("https://akproject-l7pz.onrender.com/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userName,
          userEmail,
          segmentation,
          auditData,
          results,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save results");
      }

      const data = await response.json();
      console.log("Saved successfully:", data);

      tracker.completeSession();

      toast({
        title: "Audit Saved",
        description: "Your founder audit has been securely saved.",
      });

      navigateToStep("results");
    } catch (error) {
      console.error("Error saving audit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your audit. Please try again.",
      });
      navigateToStep("results");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {step !== "intro" && step !== "results" && (
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/80 shadow-sm">
          <div className="relative max-w-4xl mx-auto px-4 py-4 sm:py-5">
            <ProgressIndicator
              currentStep={getCurrentStepNumber()}
              totalSteps={4}
              labels={STEP_LABELS}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ModeToggle />
            </div>
          </div>
        </div>
      )}

      {step === "intro" && (
        <IntroSection onStart={() => {
          tracker.startSession();
          navigateToStep("email");
        }} />
      )}

      {step === "email" && (
        <EmailCapture
          name={userName}
          email={userEmail}
          onUpdate={(name, email) => {
            setUserName(name);
            setUserEmail(email);
          }}
          onNext={() => navigateToStep("segmentation")}
          onBack={() => navigateToStep("intro")}
        />
      )}

      {step === "segmentation" && (
        <UserSegmentation
          data={segmentation}
          onUpdate={setSegmentation}
          onNext={() => navigateToStep("decisions")}
          onBack={() => navigateToStep("email")}
        />
      )}

      {step === "decisions" && (
        <DecisionAudit
          categories={auditData.decisionCategories}
          onUpdate={(categories) =>
            setAuditData((prev) => ({ ...prev, decisionCategories: categories }))
          }
          onNext={() => navigateToStep("cost")}
          onBack={() => navigateToStep("segmentation")}
        />
      )}

      {step === "cost" && (
        <CostCalculator
          totalDecisions={totals.totalDecisions}
          totalCouldDelegate={totals.totalCouldDelegate}
          totalNotSure={totals.totalNotSure}
          annualCompensation={auditData.annualCompensation}
          averageMinutes={auditData.averageMinutesPerDecision}
          delayTax={auditData.delayTax}
          onUpdate={(comp, minutes) =>
            setAuditData((prev) => ({
              ...prev,
              annualCompensation: comp,
              averageMinutesPerDecision: minutes,
            }))
          }
          onUpdateDelayTax={(delayTax) =>
            setAuditData((prev) => ({ ...prev, delayTax }))
          }
          onNext={() => navigateToStep("patterns")}
          onBack={() => navigateToStep("decisions")}
        />
      )}

      {step === "patterns" && (
        <BottleneckPatterns
          patterns={auditData.patterns}
          onUpdate={(patterns) => setAuditData((prev) => ({ ...prev, patterns }))}
          onNext={handleSaveResults}
          onBack={() => navigateToStep("cost")}
        />
      )}

      {step === "results" && (
        <ResultsSection
          results={results}
          onBack={() => navigateToStep("patterns")}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}