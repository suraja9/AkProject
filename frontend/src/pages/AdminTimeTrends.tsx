import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface TrendPoint {
    period: string;
    sessions: number;
    completed: number;
    completionRate: number;
    audits: number;
    avgBottleneckCost: number;
}

const AdminTimeTrends = () => {
    const [data, setData] = useState<{ trends: TrendPoint[]; period: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/analytics/trends?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const json = await response.json();
            setData(json);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load time trends.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(amount);
    };

    const formatPeriod = (p: string) => {
        if (period === 'month') {
            const [y, m] = p.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return new Date(p).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const chartData = data?.trends?.map(t => ({
        ...t,
        periodLabel: formatPeriod(t.period),
    })) ?? [];

    return (
        <AdminPageLayout
            title="Time-Based Trends"
            description="Weekly/monthly trends for audits, sessions, completion rate, and avg bottleneck cost."
            actions={
                <>
                    <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as 'week' | 'month')} className="bg-muted/50 rounded-lg p-0.5">
                        <ToggleGroupItem value="week" aria-label="Weekly" className="rounded-md text-xs">Weekly</ToggleGroupItem>
                        <ToggleGroupItem value="month" aria-label="Monthly" className="rounded-md text-xs">Monthly</ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </>
            }
        >
                    {!loading && data && chartData.length > 0 ? (
                        <>
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Audits & Sessions Over Time</CardTitle>
                                    <CardDescription>Are you getting more audits over time?</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number) => [value, '']}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="audits"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                name="Audits"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="sessions"
                                                stroke="hsl(var(--accent))"
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                name="Sessions"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Completion Rate Over Time</CardTitle>
                                    <CardDescription>Is your conversion rate improving?</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                                            />
                                            <Line type="monotone" dataKey="completionRate" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} name="Completion %" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Avg Bottleneck Cost Over Time</CardTitle>
                                    <CardDescription>Average bottleneck cost per period</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                                            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number) => [formatCurrency(value), 'Avg Cost']}
                                            />
                                            <Line type="monotone" dataKey="avgBottleneckCost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} name="Avg Bottleneck Cost" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="flex h-[50vh] w-full items-center justify-center">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                                <div className="text-muted-foreground">No time trends data available.</div>
                            )}
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminTimeTrends;
