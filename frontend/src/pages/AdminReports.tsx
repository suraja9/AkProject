import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { formatSegmentationValue } from "@/lib/analytics";

interface Audit {
    _id: string;
    userName: string;
    userEmail: string;
    auditData: any;
    results: any;
    segmentation?: {
        founderRole: string;
        revenueRange: string;
        teamSize: string;
        industryVertical: string;
    };
    createdAt: string;
}

const AdminReports = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://akproject-l7pz.onrender.com/api/audits');
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setAudits(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load reports data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToCSV = () => {
        if (!audits.length) {
            toast({
                title: "No data",
                description: "No audits to export.",
                variant: "destructive",
            });
            return;
        }
        const headers = [
            'Name', 'Email', 'Founder Role', 'Revenue Range', 'Team Size', 'Industry Vertical',
            'Total Decisions', 'Decision Load', 'Annual Cost', 'Delay Tax', 'Bottleneck Cost',
            'Patterns Checked', 'Overall Status', 'Created At'
        ];
        const rows = audits.map(a => [
            a.userName || '',
            a.userEmail || '',
            a.segmentation?.founderRole ? formatSegmentationValue("founderRole", a.segmentation.founderRole) : '',
            a.segmentation?.revenueRange ? formatSegmentationValue("revenueRange", a.segmentation.revenueRange) : '',
            a.segmentation?.teamSize ? formatSegmentationValue("teamSize", a.segmentation.teamSize) : '',
            a.segmentation?.industryVertical ? formatSegmentationValue("industryVertical", a.segmentation.industryVertical) : '',
            a.results?.totalDecisions ?? '',
            a.results?.decisionLoadLevel ?? '',
            a.results?.annualCost ?? '',
            a.results?.delayTaxAnnual ?? '',
            a.results?.totalBottleneckCost ?? '',
            a.results?.patternsChecked ?? '',
            a.results?.overallStatus ?? '',
            new Date(a.createdAt).toISOString()
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audits-export-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({
            title: "Export complete",
            description: `Exported ${audits.length} audits to CSV.`,
        });
    };

    return (
        <AdminPageLayout
            title="Reports"
            description="Export audits and key metrics."
            actions={
                <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    {!loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5" /> Audits Export
                                    </CardTitle>
                                    <CardDescription>
                                        Export all audit data to CSV for external analysis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {audits.length} audit(s) available for export.
                                    </p>
                                    <Button onClick={exportToCSV} className="gap-2" disabled={!audits.length}>
                                        <Download className="h-4 w-4" />
                                        Export to CSV
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Key Metrics Summary</CardTitle>
                                    <CardDescription>
                                        Quick overview of your audit data.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li><span className="text-muted-foreground">Total Audits:</span> {audits.length}</li>
                                        <li>
                                            <span className="text-muted-foreground">With Segmentation Data:</span>{' '}
                                            {audits.filter(a => a.segmentation?.founderRole).length}
                                        </li>
                                        <li>
                                            <span className="text-muted-foreground">Avg Bottleneck Cost:</span>{' '}
                                            {audits.length
                                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                                                    .format(audits.reduce((acc, a) => acc + (a.results?.totalBottleneckCost || 0), 0) / audits.length)
                                                : '-'}
                                        </li>
                                        <li>
                                            <span className="text-muted-foreground">Avg Decisions/Week:</span>{' '}
                                            {audits.length
                                                ? Math.round(audits.reduce((acc, a) => acc + (a.results?.totalDecisions || 0), 0) / audits.length)
                                                : '-'}
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex h-[40vh] w-full items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    )}
        </AdminPageLayout>
    );
};

export default AdminReports;
