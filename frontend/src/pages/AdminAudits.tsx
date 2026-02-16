import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { formatSegmentationValue } from "@/lib/analytics";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Audit {
    _id: string;
    userName: string;
    userEmail: string;
    auditData: {
        decisionCategories: {
            id: string;
            name: string;
            decisions: number;
            couldDelegate: number;
            notSure: boolean;
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

const AdminAudits = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchAudits = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://akproject-l7pz.onrender.com/api/audits');
            if (!response.ok) {
                throw new Error('Failed to fetch audits');
            }
            const data = await response.json();
            setAudits(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load audit data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    const generatePDF = async () => {
        const element = document.getElementById('audit-content-export');
        if (!element) return;

        try {
            toast({
                title: "Generating PDF...",
                description: "Please wait while we prepare your report.",
            });

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`audit-report-${selectedAudit?._id || 'export'}.pdf`);

            toast({
                title: "Success",
                description: "PDF report downloaded successfully.",
                variant: 'default',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate PDF.",
                variant: "destructive",
            });
        }
    };

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

    return (
        <AdminPageLayout
            title="Audit Submissions"
            description="Review and manage all submitted decision audits."
            actions={
                <Button onClick={fetchAudits} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
            <Card className="glass-card overflow-hidden">
                <CardHeader>
                    <CardTitle>All Submissions</CardTitle>
                    <CardDescription>Detailed log of user audits</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : audits.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            No audits found.
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Founder</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Revenue</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Decisions/Wk</TableHead>
                                        <TableHead className="text-right">Bottleneck Cost</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {audits.map((audit) => (
                                        <TableRow key={audit._id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium text-muted-foreground text-xs whitespace-nowrap">
                                                {formatDate(audit.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{audit.userName}</span>
                                                    <span className="text-xs text-muted-foreground">{audit.userEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {audit.segmentation?.founderRole ? formatSegmentationValue("founderRole", audit.segmentation.founderRole) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {audit.segmentation?.revenueRange ? formatSegmentationValue("revenueRange", audit.segmentation.revenueRange) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {audit.segmentation?.teamSize ? formatSegmentationValue("teamSize", audit.segmentation.teamSize) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {audit.segmentation?.industryVertical ? formatSegmentationValue("industryVertical", audit.segmentation.industryVertical) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getStatusColor(audit.results?.overallStatus)} border text-xs`}>
                                                    {audit.results?.overallStatus || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {audit.results?.totalDecisions}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm text-accent">
                                                {formatCurrency(audit.results?.totalBottleneckCost)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setSelectedAudit(audit)}
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audit Detail Dialog */}
            <Dialog open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 bg-background border-border overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 border-b bg-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-display">Audit Details</DialogTitle>
                                <DialogDescription>
                                    Submitted on {selectedAudit && formatDate(selectedAudit.createdAt)}
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${selectedAudit ? getStatusColor(selectedAudit.results.overallStatus) : ''} mr-2`}>
                                    {selectedAudit?.results.overallStatus}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={generatePDF} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 overflow-y-auto">
                        <div id="audit-content-export" className="bg-background pt-4">
                            {selectedAudit && (
                                <div className="p-6 space-y-8">
                                    {/* Founder Info */}
                                    <section className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-primary">Founder Profile</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-muted-foreground">Name:</div>
                                                <div className="font-medium">{selectedAudit.userName}</div>
                                                <div className="text-muted-foreground">Email:</div>
                                                <div className="font-medium">{selectedAudit.userEmail}</div>
                                                {selectedAudit.segmentation && (
                                                    <>
                                                        <div className="text-muted-foreground">Founder Role:</div>
                                                        <div className="font-medium">{formatSegmentationValue("founderRole", selectedAudit.segmentation.founderRole)}</div>
                                                        <div className="text-muted-foreground">Revenue Range:</div>
                                                        <div className="font-medium">{formatSegmentationValue("revenueRange", selectedAudit.segmentation.revenueRange)}</div>
                                                        <div className="text-muted-foreground">Team Size:</div>
                                                        <div className="font-medium">{formatSegmentationValue("teamSize", selectedAudit.segmentation.teamSize)}</div>
                                                        <div className="text-muted-foreground">Industry:</div>
                                                        <div className="font-medium">{formatSegmentationValue("industryVertical", selectedAudit.segmentation.industryVertical)}</div>
                                                    </>
                                                )}
                                                <div className="text-muted-foreground">Annual Comp:</div>
                                                <div className="font-medium">{formatCurrency(selectedAudit.auditData.annualCompensation)}</div>
                                                <div className="text-muted-foreground">Avg. Decision Time:</div>
                                                <div className="font-medium">{selectedAudit.auditData.averageMinutesPerDecision} mins</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-primary">Key Metrics</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-muted-foreground">Decision Load:</div>
                                                <div className="font-medium">{selectedAudit.results.decisionLoadLevel}</div>
                                                <div className="text-muted-foreground">Total Decisions:</div>
                                                <div className="font-medium">{selectedAudit.results.totalDecisions}/week</div>
                                                <div className="text-muted-foreground">Est. Annual Cost:</div>
                                                <div className="font-medium">{formatCurrency(selectedAudit.results.annualCost)}</div>
                                                <div className="text-muted-foreground text-accent">Bottleneck Cost:</div>
                                                <div className="font-medium text-accent">{formatCurrency(selectedAudit.results.totalBottleneckCost)}</div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Decision Breakdown */}
                                    <section>
                                        <h3 className="text-lg font-semibold text-primary mb-4">Decision Breakdown</h3>
                                        <div className="rounded-md border overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow>
                                                        <TableHead>Category</TableHead>
                                                        <TableHead className="text-right">Total</TableHead>
                                                        <TableHead className="text-right">Delegate</TableHead>
                                                        <TableHead className="text-right">Not Sure</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedAudit.auditData.decisionCategories.map((cat) => (
                                                        <TableRow key={cat.id}>
                                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                                            <TableCell className="text-right">{cat.decisions}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground">{cat.couldDelegate}</TableCell>
                                                            <TableCell className="text-right text-muted-foreground">{cat.notSure ? 'Yes' : '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </section>

                                    {/* Delay Tax */}
                                    {selectedAudit.auditData.delayTax && selectedAudit.auditData.delayTax.length > 0 && (
                                        <section>
                                            <h3 className="text-lg font-semibold text-primary mb-4">Delay Tax Analysis</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {selectedAudit.auditData.delayTax.map((delay) => (
                                                    <div key={delay.id} className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 flex justify-between items-center">
                                                        <span className="text-sm font-medium">{delay.name}</span>
                                                        <span className="font-mono text-red-500">{formatCurrency(delay.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Patterns */}
                                    {selectedAudit.auditData.patterns && (
                                        <section>
                                            <h3 className="text-lg font-semibold text-primary mb-4">Identified Patterns</h3>
                                            <div className="grid gap-3">
                                                {selectedAudit.auditData.patterns
                                                    .filter(p => p.checked)
                                                    .map((pattern) => (
                                                        <div key={pattern.id} className="flex gap-3 p-3 rounded-md bg-accent/5 border border-accent/10">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                                                            <div>
                                                                <div className="font-medium text-sm">{pattern.name}</div>
                                                                <div className="text-xs text-muted-foreground mt-1">{pattern.description}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                {selectedAudit.auditData.patterns.filter(p => p.checked).length === 0 && (
                                                    <div className="text-sm text-muted-foreground italic">No specific bottleneck patterns identified.</div>
                                                )}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </AdminPageLayout>
    );
};

export default AdminAudits;
