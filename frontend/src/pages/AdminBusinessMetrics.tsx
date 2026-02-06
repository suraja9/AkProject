import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Mail, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface BusinessMetricsData {
    emailCaptureRate: number;
    returnVisitorCount: number;
    returnVisitorEmails: string[];
    performanceImprovement: {
        email: string;
        firstAudit: { totalDecisions?: number; totalBottleneckCost?: number };
        secondAudit: { totalDecisions?: number; totalBottleneckCost?: number };
        delta: { totalDecisions: number; totalBottleneckCost: number };
    }[];
}

const AdminBusinessMetrics = () => {
    const [data, setData] = useState<BusinessMetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/analytics/business');
            if (!response.ok) throw new Error('Failed to fetch data');
            const json = await response.json();
            setData(json);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load business metrics.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AdminPageLayout
            title="Business Metrics"
            description="Email capture rate, return visitors, and performance improvement (1st vs 2nd audit)."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    {!loading && data ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="glass-card border-t-4 border-t-primary">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> Email Capture Rate
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.emailCaptureRate}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            Of users who reached email step and completed
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-accent">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Return Visitors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{data.returnVisitorCount}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Founders who retook the audit
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-t-4 border-t-warning">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> Clarity Call Conversion
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                                        <p className="text-xs text-muted-foreground">
                                            Requires Calendly/webhook integration
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {data.returnVisitorEmails.length > 0 && (
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle>Return Visitor Emails</CardTitle>
                                        <CardDescription>Founders who have taken the audit more than once</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {data.returnVisitorEmails.map(email => (
                                                <span key={email} className="text-sm px-2 py-1 rounded-md bg-muted">
                                                    {email}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {data.performanceImprovement.length > 0 && (
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" /> Performance Improvement
                                        </CardTitle>
                                        <CardDescription>1st audit vs audit after implementing program for each user</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>1st Decisions</TableHead>
                                                    <TableHead>2nd Decisions</TableHead>
                                                    <TableHead>Delta</TableHead>
                                                    <TableHead>1st Cost</TableHead>
                                                    <TableHead>2nd Cost</TableHead>
                                                    <TableHead>Delta</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.performanceImprovement.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium truncate max-w-[180px]" title={item.email}>
                                                            {item.email}
                                                        </TableCell>
                                                        <TableCell>{item.firstAudit.totalDecisions ?? '-'}</TableCell>
                                                        <TableCell>{item.secondAudit.totalDecisions ?? '-'}</TableCell>
                                                        <TableCell className={item.delta.totalDecisions < 0 ? 'text-success' : item.delta.totalDecisions > 0 ? 'text-destructive' : ''}>
                                                            {item.delta.totalDecisions > 0 ? '+' : ''}{item.delta.totalDecisions}
                                                        </TableCell>
                                                        <TableCell>{item.firstAudit.totalBottleneckCost != null ? formatCurrency(item.firstAudit.totalBottleneckCost) : '-'}</TableCell>
                                                        <TableCell>{item.secondAudit.totalBottleneckCost != null ? formatCurrency(item.secondAudit.totalBottleneckCost) : '-'}</TableCell>
                                                        <TableCell className={item.delta.totalBottleneckCost < 0 ? 'text-success' : item.delta.totalBottleneckCost > 0 ? 'text-destructive' : ''}>
                                                            {item.delta.totalBottleneckCost > 0 ? '+' : ''}{formatCurrency(item.delta.totalBottleneckCost)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="flex h-[50vh] w-full items-center justify-center">
                            {loading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                                <div className="text-muted-foreground">No business metrics available.</div>
                            )}
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminBusinessMetrics;
