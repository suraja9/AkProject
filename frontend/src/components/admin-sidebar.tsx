import {
    Inbox,
    ShieldCheck,
    Users,
    LayoutDashboard,
    LogOut,
    Activity,
    FileText,
    BarChart3,
    Filter,
    TrendingUp,
    Target,
    Sparkles,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarSeparator,
    SidebarRail,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const overviewItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Live Activity", url: "/admin/live", icon: Activity },
    { title: "Audits", url: "/admin/audits", icon: Inbox },
    { title: "Founders", url: "/admin/founders", icon: Users },
    { title: "Reports", url: "/admin/reports", icon: FileText },
];

const analyticsItems = [
    { title: "Deep Analytics", url: "/admin/analytics", icon: Sparkles },
    { title: "Usage Analytics", url: "/admin/analytics/usage", icon: BarChart3 },
    { title: "Funnel", url: "/admin/analytics/funnel", icon: Filter },
    { title: "Business Metrics", url: "/admin/analytics/business", icon: Target },
    { title: "Time Trends", url: "/admin/analytics/trends", icon: TrendingUp },
];

export function AdminSidebar() {
    const location = useLocation();

    const NavItem = ({ item, isActive }: { item: typeof overviewItems[0]; isActive: boolean }) => (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={`h-10 rounded-lg transition-all duration-200 group/button relative ${
                    isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-[3px] border-l-sidebar-primary pl-3"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:border-l-[3px] hover:border-l-sidebar-primary/50 border-l-[3px] border-l-transparent pl-3"
                }`}
            >
                <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover/button:text-sidebar-primary"}`} />
                    <span className="text-sm truncate">{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-sm shadow-[2px_0_24px_-8px_hsl(var(--sidebar-border))]">
            <SidebarHeader className="p-4 pb-3">
                <div className="flex items-center gap-3 px-1 py-1.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-amber-600 text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25 ring-1 ring-white/10">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div className="grid flex-1 min-w-0 text-left leading-tight">
                        <span className="font-display font-bold text-lg tracking-tight text-sidebar-foreground truncate">
                            Admin<span className="text-sidebar-primary">Panel</span>
                        </span>
                        <span className="text-xs text-muted-foreground font-medium truncate">Control Center</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarSeparator className="mx-3 my-1 opacity-60" />

            <SidebarContent className="flex-1 overflow-hidden flex flex-col px-2">
                <ScrollArea className="flex-1 -mx-1 px-1">
                    <div className="pb-2">
                        <SidebarGroup className="py-1">
                            <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-semibold tracking-wider uppercase px-3 mb-1.5">
                                Overview
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {overviewItems.map((item) => (
                                        <NavItem key={item.title} item={item} isActive={location.pathname === item.url} />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup className="py-1">
                            <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-semibold tracking-wider uppercase px-3 mb-1.5 flex items-center gap-2">
                                <BarChart3 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                Analytics
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="space-y-0.5">
                                    {analyticsItems.map((item) => (
                                        <NavItem key={item.title} item={item} isActive={location.pathname === item.url} />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </div>
                </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="p-3 pt-2 border-t border-sidebar-border/50">
                <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3 ring-1 ring-sidebar-border/40 hover:bg-sidebar-accent/70 transition-all duration-200 group/user">
                    <Avatar className="h-9 w-9 shrink-0 border-2 border-sidebar-border/50 shadow-sm group-hover/user:border-sidebar-primary/50 transition-colors">
                        <AvatarImage src="/avatars/admin.png" alt="Admin" />
                        <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-amber-600 text-white font-bold text-sm">AD</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-sidebar-foreground group-hover/user:text-sidebar-primary transition-colors">Administrator</span>
                        <span className="truncate text-xs text-muted-foreground">admin@system.com</span>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="shrink-0 text-muted-foreground hover:text-sidebar-destructive hover:bg-sidebar-destructive/15 p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
                                aria-label="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Sign out</TooltipContent>
                    </Tooltip>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
