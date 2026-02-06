import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { calculateAnalytics, calculateSessionAnalytics, formatSegmentationValue } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface Audit {
    // ... same as before, needed for calculation
    _id: string;
    userName: string;
    userEmail: string;
    auditData: {
        decisionCategories: {
            id: string;
            name: string;
            decisions: number;
            couldDelegate: number;
            onlyYou: number;
            notSure: number;
        }[];
        annualCompensation: number;
        averageMinutesPerDecision: number;
        delayTax: {
            id: string;
            name: string;
            amount: number;
        }[];
        patterns: {
            id: string;
            name: string;
            description: string;
            checked: boolean;
        }[];
    };
    results: {
        totalDecisions: number;
        decisionLoadLevel: string;
        hourlyRate: number;
        hoursPerWeek: number;
        annualCost: number;
        delayTaxAnnual: number;
        totalBottleneckCost: number;
        patternsChecked: number;
        overallStatus: string;
    };
    segmentation?: {
        founderRole: string;
        revenueRange: string;
        teamSize: string;
        industryVertical: string;
    };
    createdAt: string;
}

// Minimal Session Interface
interface Session {
    sessionId: string;
    startTime: string;
    endTime?: string;
    lastStep: string;
    status: string;
}

const AdminDashboard = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    // Removed selectedAudit state
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [auditsRes, sessionsRes] = await Promise.all([
                fetch('http://localhost:5000/api/audits'),
                fetch('http://localhost:5000/api/sessions')
            ]);

            if (!auditsRes.ok || !sessionsRes.ok) throw new Error('Failed to fetch data');

            const auditsData = await auditsRes.json();
            const sessionsData = await sessionsRes.json();

            setAudits(auditsData);
            setSessions(sessionsData);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const analytics = useMemo(() => calculateAnalytics(audits), [audits]);
    const sessionAnalytics = useMemo(() => calculateSessionAnalytics(sessions), [sessions]);



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'healthy':
                return 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20';
            case 'elevated':
                return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20';
            case 'critical':
                return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20';
        }
    };

    const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#8884D8'];

    const totalPatternCount = analytics?.patterns?.reduce((sum: number, p: any) => sum + (p.count || 0), 0) || 0;

    return (
        <AdminPageLayout
            title="Executive Dashboard"
            description="Real-time insights and decision audit analytics."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="stat-card border-l-4 border-l-primary overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Audits</CardTitle>
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">{analytics?.overview.totalAudits || 0}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">Audits completed</p>
                            </CardContent>
                        </Card>
                        <Card className="stat-card border-l-4 border-l-green-500 overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">{sessionAnalytics?.completionRate || 0}%</div>
                                <p className="text-xs text-muted-foreground mt-0.5">Started vs completed</p>
                            </CardContent>
                        </Card>
                        <Card className="stat-card border-l-4 border-l-amber-500 overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time</CardTitle>
                                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">{sessionAnalytics?.avgCompletionTime || '0m 0s'}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">To complete audit</p>
                            </CardContent>
                        </Card>
                        <Card className="stat-card border-l-4 border-l-destructive overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Major Drop-off</CardTitle>
                                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold capitalize truncate text-destructive">
                                    {sessionAnalytics?.dropOffData[0]?.name || "None"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {sessionAnalytics?.dropOffData[0]?.value || 0} users exited here
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Analytics Section */}
                    {analytics && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Drop-off Analysis */}
                            <Card className="glass-card col-span-1 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Funnel Drop-off Analysis</CardTitle>
                                    <CardDescription>Where users abandon the audit flow</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sessionAnalytics?.dropOffData} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                            <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Drop-offs" barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Bottleneck Patterns Chart */}
                            <Card className="glass-card col-span-1">
                                <CardHeader>
                                    <CardTitle>Top Bottleneck Patterns</CardTitle>
                                    <CardDescription>Share of identified dysfunction patterns (percentage)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 10, right: 80, bottom: 10, left: 80 }}>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(_, name, props: any) => {
                                                    const value = props?.payload?.count || 0;
                                                    const percent = totalPatternCount ? ((value / totalPatternCount) * 100).toFixed(1) : '0.0';
                                                    return [`${percent}%`, name as string];
                                                }}
                                            />
                                            <Legend />
                                            <Pie
                                                data={analytics.patterns}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={95}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {analytics.patterns.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Delay Tax Breakdown */}
                            <Card className="glass-card col-span-1">
                                <CardHeader>
                                    <CardTitle>Delay Tax Analysis</CardTitle>
                                    <CardDescription>Aggregate cost by delay category</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.delayTax} margin={{ top: 10, right: 20, bottom: 100, left: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11 }}
                                                interval={0}
                                                angle={-25}
                                                textAnchor="end"
                                                height={90}
                                            />
                                            <YAxis width={55} tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number) => formatCurrency(value)}
                                            />
                                            <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* User Segmentation Charts */}
                            {analytics.segmentation && (analytics.segmentation.founderRole.length > 0 || analytics.segmentation.industryVertical.length > 0) && (
                                <>
                                    <Card className="glass-card col-span-1">
                                        <CardHeader>
                                            <CardTitle>Founder Roles</CardTitle>
                                            <CardDescription>Distribution by founder type</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.segmentation.founderRole.map(d => ({ ...d, name: formatSegmentationValue("founderRole", d.name) }))} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={18} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card col-span-1">
                                        <CardHeader>
                                            <CardTitle>Revenue Ranges</CardTitle>
                                            <CardDescription>Distribution by revenue</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={analytics.segmentation.revenueRange.map(d => ({ ...d, name: formatSegmentationValue("revenueRange", d.name) }))}
                                                    margin={{ left: 0, right: 0, bottom: 40 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 10 }}
                                                        interval={0}
                                                        angle={-20}
                                                        textAnchor="end"
                                                        height={60}
                                                    />
                                                    <YAxis />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                                    <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} barSize={18} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card col-span-1">
                                        <CardHeader>
                                            <CardTitle>Team Sizes</CardTitle>
                                            <CardDescription>Distribution by team size</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={analytics.segmentation.teamSize.map(d => ({ ...d, name: formatSegmentationValue("teamSize", d.name) }))}
                                                    margin={{ left: 0, right: 0, bottom: 40 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 11 }}
                                                        interval={0}
                                                        angle={-20}
                                                        textAnchor="end"
                                                        height={50}
                                                    />
                                                    <YAxis />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                                    <Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} barSize={18} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card col-span-1">
                                        <CardHeader>
                                            <CardTitle>Industry Verticals</CardTitle>
                                            <CardDescription>Distribution by industry</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={analytics.segmentation.industryVertical.map(d => ({ ...d, name: formatSegmentationValue("industryVertical", d.name) }))}
                                                    margin={{ left: 0, right: 0, bottom: 40 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 10 }}
                                                        interval={0}
                                                        angle={-20}
                                                        textAnchor="end"
                                                        height={60}
                                                    />
                                                    <YAxis />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={18} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* Decision Categories Pie */}
                            <Card className="glass-card col-span-1 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Decision Breakdown</CardTitle>
                                    <CardDescription>Aggregate distribution of decision types across all audits</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.categories}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="delegate" stackId="a" fill="hsl(var(--success))" name="Delegate" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="onlyYou" stackId="a" fill="hsl(var(--warning))" name="Only You" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="notSure" stackId="a" fill="hsl(var(--muted-foreground))" name="Not Sure" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminDashboard;
