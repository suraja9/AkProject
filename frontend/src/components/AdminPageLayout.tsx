import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AdminPageLayoutProps {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageLayout({ title, description, actions, children }: AdminPageLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="admin-page-bg">
        <div className="admin-page-content">
          <header className="admin-page-header">
            <div className="admin-page-header-left">
              <SidebarTrigger className="rounded-lg border border-border bg-card/80 shadow-sm hover:bg-card" />
              <div>
                <h1 className="admin-page-title">{title}</h1>
                {description && (
                  <p className="admin-page-description">{description}</p>
                )}
              </div>
            </div>
            <div className="admin-page-header-actions">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Site
                </Button>
              </Link>
              {actions}
              <ModeToggle />
            </div>
          </header>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
