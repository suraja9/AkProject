import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-md mx-auto">
        <p className="text-[7rem] sm:text-[8rem] font-display font-bold leading-none tracking-tighter bg-gradient-to-b from-foreground/90 to-foreground/40 bg-clip-text text-transparent select-none">
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-foreground mt-2 mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-8">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 rounded-xl shadow-lg">
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-xl"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
