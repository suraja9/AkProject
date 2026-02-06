import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users, Activity, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { calculateSessionAnalytics } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Session {
    sessionId: string;
    startTime: string;
    endTime?: string;
    lastStep: string;
    status: string;
}

const AdminUsageAnalytics = () => {
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
                description: "Failed to load usage analytics.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sessionAnalytics = useMemo(() => calculateSessionAnalytics(sessions), [sessions]);
    const totalAuditsCompleted = audits.length;

    const formatStepName = (step: string) => {
        const labels: Record<string, string> = {
            intro: 'Intro',
            email: 'Email',
            decisions: 'Decisions',
            cost: 'Cost',
            patterns: 'Patterns',
            completed: 'Completed',
            unknown: 'Unknown'
        };
        return labels[step] || step;
    };

    const dropOffDataFormatted = useMemo(() => {
        if (!sessionAnalytics?.dropOffData) return [];
        return sessionAnalytics.dropOffData.map(d => ({
            ...d,
            name: formatStepName(d.name)
        }));
    }, [sessionAnalytics?.dropOffData]);

    return (
        <AdminPageLayout
            title="Usage Analytics"
            description="Audits completed, completion rate, average time, and drop-off analysis."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    {!loading && sessionAnalytics ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="glass-card border-t-4 border-t-primary">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
                                        <Users className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totalAuditsCompleted}</div>
                                        <p className="text-xs text-muted-foreground">Audits Completed</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-success">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                                        <Users className="h-4 w-4 text-success" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-success">{sessionAnalytics.completionRate}%</div>
                                        <p className="text-xs text-muted-foreground">Started vs Completed</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-warning">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                                        <Activity className="h-4 w-4 text-warning" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{sessionAnalytics.avgCompletionTime}</div>
                                        <p className="text-xs text-muted-foreground">To complete audit</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-destructive">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Major Drop-off</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold capitalize truncate text-destructive">
                                            {formatStepName(sessionAnalytics.dropOffData[0]?.name || 'None')}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {sessionAnalytics.dropOffData[0]?.value || 0} users exited here
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="glass-card col-span-1 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Funnel Drop-off Analysis</CardTitle>
                                    <CardDescription>Where users abandon the audit flow</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dropOffDataFormatted} layout="vertical" margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                                            <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Drop-offs" barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="flex h-[50vh] w-full items-center justify-center">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                                <div className="text-muted-foreground">No usage analytics available.</div>
                            )}
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminUsageAnalytics;
