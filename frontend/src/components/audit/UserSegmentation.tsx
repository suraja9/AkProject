import { ArrowRight, ArrowLeft, Briefcase, DollarSign, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSegmentationData } from "@/types/audit";

interface UserSegmentationProps {
  data: UserSegmentationData;
  onUpdate: (data: UserSegmentationData) => void;
  onNext: () => void;
  onBack: () => void;
}

const FOUNDER_ROLES = [
  { value: "solo-founder", label: "Solo Founder" },
  { value: "co-founder", label: "Co-Founder" },
  { value: "ceo", label: "CEO" },
];

const REVENUE_RANGES = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "0-100k", label: "$0 - $100K" },
  { value: "100k-500k", label: "$100K - $500K" },
  { value: "500k-1m", label: "$500K - $1M" },
  { value: "1m-5m", label: "$1M - $5M" },
  { value: "5m-10m", label: "$5M - $10M" },
  { value: "10m+", label: "$10M+" },
];

const TEAM_SIZES = [
  { value: "1-5", label: "1 - 5" },
  { value: "6-10", label: "6 - 10" },
  { value: "11-25", label: "11 - 25" },
  { value: "26-50", label: "26 - 50" },
  { value: "51-100", label: "51 - 100" },
  { value: "100+", label: "100+" },
];

const INDUSTRY_VERTICALS = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "fintech", label: "Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "marketplace", label: "Marketplace" },
  { value: "consumer", label: "Consumer" },
  { value: "enterprise", label: "Enterprise" },
  { value: "media", label: "Media / Content" },
  { value: "hardware", label: "Hardware" },
  { value: "other", label: "Other" },
];

export function UserSegmentation({ data, onUpdate, onNext, onBack }: UserSegmentationProps) {
  const handleChange = (field: keyof UserSegmentationData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const isValid =
    data.founderRole &&
    data.revenueRange &&
    data.teamSize &&
    data.industryVertical;

  const handleSubmit = () => {
    if (isValid) onNext();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto animate-fade-up">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tell Us About Your Company
          </h2>
          <p className="text-muted-foreground">
            Help us personalize your audit experience with a few quick details.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                Founder Role
              </label>
              <Select
                value={data.founderRole}
                onValueChange={(v) => handleChange("founderRole", v)}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {FOUNDER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                Revenue Range
              </label>
              <Select
                value={data.revenueRange}
                onValueChange={(v) => handleChange("revenueRange", v)}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Team Size
              </label>
              <Select
                value={data.teamSize}
                onValueChange={(v) => handleChange("teamSize", v)}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                Industry Vertical
              </label>
              <Select
                value={data.industryVertical}
                onValueChange={(v) => handleChange("industryVertical", v)}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_VERTICALS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6"
          >
            Continue
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
