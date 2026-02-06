import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { calculateFunnelAnalytics } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Session {
    sessionId: string;
    startTime: string;
    endTime?: string;
    lastStep: string;
    status: string;
}

const AdminFunnel = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [audits, setAudits] = useState<{ _id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, auditsRes] = await Promise.all([
                fetch('http://localhost:5000/api/sessions'),
                fetch('http://localhost:5000/api/audits')
            ]);

            if (!sessionsRes.ok || !auditsRes.ok) throw new Error('Failed to fetch data');

            const sessionsData = await sessionsRes.json();
            const auditsData = await auditsRes.json();

            setSessions(sessionsData);
            setAudits(auditsData);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load funnel data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const funnelAnalytics = useMemo(
        () => calculateFunnelAnalytics(sessions, audits),
        [sessions, audits]
    );

    const funnelChartData = useMemo(() => {
        if (!funnelAnalytics?.steps) return [];
        return funnelAnalytics.steps.map((step, i) => ({
            name: step.name,
            count: step.count,
            conversion: step.conversion,
            fill: i === 0 ? 'hsl(var(--primary))' : i === 1 ? 'hsl(var(--accent))' : 'hsl(var(--success))'
        }));
    }, [funnelAnalytics?.steps]);

    return (
        <AdminPageLayout
            title="Funnel Visualization"
            description="Visit → Start Audit → Complete → Email Captured. Conversion % at each step."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    {!loading && funnelAnalytics ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="glass-card border-t-4 border-t-primary">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Start Audit</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{funnelAnalytics.startCount}</div>
                                        <p className="text-xs text-muted-foreground">100% baseline</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-accent">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Reached Email</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{funnelAnalytics.reachedEmailCount}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {funnelAnalytics.startCount
                                                ? Math.round((funnelAnalytics.reachedEmailCount / funnelAnalytics.startCount) * 100)
                                                : 0}% of started
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-success">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{funnelAnalytics.completedCount}</div>
                                        <p className="text-xs text-muted-foreground">{funnelAnalytics.startToCompleteRate}% conversion</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {funnelAnalytics.largestDropStep && (
                                <Card className="glass-card border border-warning/30">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-warning">
                                            <AlertTriangle className="h-5 w-5" />
                                            Where You're Losing the Most People
                                        </CardTitle>
                                        <CardDescription>
                                            {funnelAnalytics.largestDropStep} → {funnelAnalytics.largestDrop} users dropped
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Funnel Conversion</CardTitle>
                                    <CardDescription>Conversion % at each step</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={funnelChartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number, _name: string, props: { payload?: { conversion?: number } }) => [
                                                    `${value} (${props.payload?.conversion ?? 0}% conversion)`,
                                                    'Count'
                                                ]}
                                            />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                                                {funnelChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <p className="text-xs text-muted-foreground">
                                Note: Visit and Call Booked are not tracked. Visit requires landing page analytics; Call Booked requires Calendly/webhook integration.
                            </p>
                        </>
                    ) : (
                        <div className="flex h-[50vh] w-full items-center justify-center">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                                <div className="text-muted-foreground">No funnel data available.</div>
                            )}
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminFunnel;
