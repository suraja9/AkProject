
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TrendingUp, DollarSign, Activity, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { calculateAnalytics, formatSegmentationValue } from "@/lib/analytics";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Pie,
    Cell,
    AreaChart,
    Area,
    Legend
} from 'recharts';

interface Audit {
    _id: string;
    userName: string;
    userEmail: string;
    auditData: any;
    results: any;
    createdAt: string;
}

const AdminAnalytics = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/audits');
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setAudits(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load analytics data.",
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

    // Custom data processing for specialized charts
    const costDistribution = useMemo(() => {
        if (!audits.length) return [];
        return audits.map((audit, index) => ({
            name: `Audit ${index + 1}`,
            bottleneck: audit.results.totalBottleneckCost,
            delay: audit.results.delayTaxAnnual || 0,
            operations: audit.results.annualCost
        })).slice(0, 10); // Limit to top 10 for readability
    }, [audits]);

    const decisionQualityTrend = useMemo(() => {
        // Group by date (simplified)
        // For now, sorting by created date and taking a moving average or just plotting raw
        return audits
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(audit => ({
                date: new Date(audit.createdAt).toLocaleDateString(),
                score: audit.results.decisionLoadLevel === 'Healthy' ? 100 :
                    audit.results.decisionLoadLevel === 'Elevated' ? 70 : 40,
                volume: audit.results.totalDecisions
            }));
    }, [audits]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(amount);
    };

    const COLORS = {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        muted: 'hsl(var(--muted))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--destructive))'
    };

    return (
        <AdminPageLayout
            title="Deep Analytics"
            description="Advanced insights into decision patterns and organizational costs."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
            {!loading && analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* KPI Cards */}
                    <Card className="glass-card md:col-span-1 border-t-4 border-t-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" /> Total Estimated Waste
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {formatCurrency(costDistribution.reduce((acc, curr) => acc + curr.bottleneck + curr.delay, 0))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Combined Bottleneck & Delay Costs
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card md:col-span-1 border-t-4 border-t-accent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Avg Decision Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {Math.round(analytics.overview.avgDecisionLoad)} <span className="text-sm font-normal text-muted-foreground">/ week</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Decisions per Executive
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card md:col-span-1 border-t-4 border-t-warning">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Top Pattern
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tracking-tight truncate" title={analytics.patterns[0]?.name}>
                                {analytics.patterns[0]?.name || "None"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Most common dysfunction ({analytics.patterns[0]?.count || 0} occurrences)
                            </p>
                        </CardContent>
                    </Card>

                    {/* Operational vs Strategic */}
                    {analytics.operationalVsStrategic && (
                        <Card className="glass-card md:col-span-1 border-t-4 border-t-secondary">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <PieChart className="h-4 w-4" /> Operational vs Strategic
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-primary">{analytics.operationalVsStrategic.operationalPct}%</div>
                                        <p className="text-xs text-muted-foreground">Operational</p>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-accent">{analytics.operationalVsStrategic.strategicPct}%</div>
                                        <p className="text-xs text-muted-foreground">Strategic</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Avg % of operational vs strategic decisions per founder
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cost Structure Analysis */}
                    <Card className="glass-card col-span-1 lg:col-span-2 min-h-[400px]">
                        <CardHeader>
                            <CardTitle>Cost Structure Analysis</CardTitle>
                            <CardDescription>Breakdown of organizational costs across recent audits</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={costDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={formatCurrency} width={60} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="bottleneck" name="Bottleneck Cost" stackId="a" fill="hsl(var(--destructive))" />
                                    <Bar dataKey="delay" name="Delay Tax" stackId="a" fill="hsl(var(--warning))" />
                                    <Bar dataKey="operations" name="Base Cost" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Decision Volume Trend */}
                    <Card className="glass-card col-span-1 lg:col-span-1 min-h-[400px]">
                        <CardHeader>
                            <CardTitle>Decision Velocity</CardTitle>
                            <CardDescription>Volume trend over time</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={decisionQualityTrend}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Area type="monotone" dataKey="volume" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorVolume)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* User Segmentation */}
                    {analytics.segmentation && (analytics.segmentation.founderRole.length > 0 || analytics.segmentation.industryVertical.length > 0) && (
                        <Card className="glass-card col-span-1 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>User Segmentation</CardTitle>
                                <CardDescription>Distribution of founders by role, revenue, team size, and industry</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Founder Role</h4>
                                        <div className="space-y-2">
                                            {analytics.segmentation.founderRole.slice(0, 5).map((d, i) => (
                                                <div key={d.name} className="flex justify-between text-sm">
                                                    <span>{formatSegmentationValue("founderRole", d.name)}</span>
                                                    <span className="font-mono font-medium">{d.count}</span>
                                                </div>
                                            ))}
                                            {analytics.segmentation.founderRole.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No data yet</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue Range</h4>
                                        <div className="space-y-2">
                                            {analytics.segmentation.revenueRange.slice(0, 5).map((d, i) => (
                                                <div key={d.name} className="flex justify-between text-sm">
                                                    <span>{formatSegmentationValue("revenueRange", d.name)}</span>
                                                    <span className="font-mono font-medium">{d.count}</span>
                                                </div>
                                            ))}
                                            {analytics.segmentation.revenueRange.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No data yet</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Team Size</h4>
                                        <div className="space-y-2">
                                            {analytics.segmentation.teamSize.slice(0, 5).map((d, i) => (
                                                <div key={d.name} className="flex justify-between text-sm">
                                                    <span>{formatSegmentationValue("teamSize", d.name)}</span>
                                                    <span className="font-mono font-medium">{d.count}</span>
                                                </div>
                                            ))}
                                            {analytics.segmentation.teamSize.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No data yet</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Industry Vertical</h4>
                                        <div className="space-y-2">
                                            {analytics.segmentation.industryVertical.slice(0, 5).map((d, i) => (
                                                <div key={d.name} className="flex justify-between text-sm">
                                                    <span>{formatSegmentationValue("industryVertical", d.name)}</span>
                                                    <span className="font-mono font-medium">{d.count}</span>
                                                </div>
                                            ))}
                                            {analytics.segmentation.industryVertical.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No data yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Detailed Pattern Analysis */}
                    <Card className="glass-card col-span-1 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Dysfunction Pattern Heatmap</CardTitle>
                            <CardDescription>Prevalence of specific anti-patterns across the organization</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.patterns} layout="vertical" margin={{ left: 100, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24}>
                                        {analytics.patterns.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                </div>
            ) : (
                <div className="flex h-[50vh] w-full items-center justify-center">
                    {loading ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : (
                        <div className="text-muted-foreground">No analytics data available.</div>
                    )}
                </div>
            )}
        </AdminPageLayout>
    );
};

export default AdminAnalytics;
