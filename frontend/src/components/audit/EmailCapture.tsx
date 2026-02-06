import { useState } from "react";
import { ArrowRight, ArrowLeft, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  name: string;
  email: string;
  onUpdate: (name: string, email: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EmailCapture({ name, email, onUpdate, onNext, onBack }: EmailCaptureProps) {
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your name";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Please enter your email";
    } else if (!validateEmail(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    } else if (email.trim().length > 255) {
      newErrors.email = "Email must be less than 255 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto animate-fade-up">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Let's Get Started
          </h2>
          <p className="text-muted-foreground">
            Enter your details below so we can send you a personalized report of your audit results.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Your Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  onUpdate(e.target.value, email);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="John Smith"
                className="input-field"
                maxLength={100}
              />
              {errors.name && (
                <p className="text-danger text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  onUpdate(name, e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="john@company.com"
                className="input-field"
                maxLength={255}
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            We'll send your audit results to this email. No spam, ever.
          </p>
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
