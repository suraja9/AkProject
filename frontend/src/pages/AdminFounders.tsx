
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSegmentationValue } from "@/lib/analytics";
import { Loader2, Mail, RefreshCw, Search, ShieldAlert, User, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPageLayout } from "@/components/AdminPageLayout";

interface Audit {
    _id: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    results: {
        overallStatus: string;
        annualCost: number;
    };
    segmentation?: {
        founderRole: string;
        revenueRange: string;
        teamSize: string;
        industryVertical: string;
    };
}

interface FounderProfile {
    email: string;
    name: string;
    totalAudits: number;
    lastActive: string;
    latestStatus: string;
    totalEstimatedRisk: number;
    segmentation?: {
        founderRole: string;
        revenueRange: string;
        teamSize: string;
        industryVertical: string;
    };
}

const AdminFounders = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/audits');
            if (!response.ok) throw new Error('Failed to fetch audits');
            const data = await response.json();
            setAudits(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load founder data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const founders = useMemo(() => {
        const uniqueFounders: Record<string, FounderProfile> = {};

        audits.forEach(audit => {
            if (!uniqueFounders[audit.userEmail]) {
                uniqueFounders[audit.userEmail] = {
                    email: audit.userEmail,
                    name: audit.userName,
                    totalAudits: 0,
                    lastActive: audit.createdAt,
                    latestStatus: audit.results?.overallStatus || 'Unknown',
                    totalEstimatedRisk: 0,
                    segmentation: audit.segmentation
                };
            }

            const profile = uniqueFounders[audit.userEmail];
            profile.totalAudits += 1;

            // Keep track of the most recent activity and segmentation
            if (new Date(audit.createdAt) > new Date(profile.lastActive)) {
                profile.lastActive = audit.createdAt;
                profile.latestStatus = audit.results?.overallStatus || 'Unknown';
                profile.segmentation = audit.segmentation;
            }
        });

        return Object.values(uniqueFounders).sort((a, b) =>
            new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );
    }, [audits]);

    const filteredFounders = founders.filter(founder =>
        founder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        founder.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return 'success';
            case 'elevated': return 'warning';
            case 'critical': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <AdminPageLayout
            title="Founder Directory"
            description="Manage and review detailed profiles of all active founders."
            actions={
                <>
                    <div className="relative w-48 sm:w-56">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search founders..."
                            className="pl-9 h-9 bg-background/50 border-border"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchData} variant="secondary" size="icon" className="h-9 w-9">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 hidden md:flex"
                        onClick={() => {
                                    if (!filteredFounders.length) return;
                                    const headers = ["Name", "Email", "Founder Role", "Revenue Range", "Team Size", "Industry", "Total Audits", "Last Active", "Latest Status"];
                                    const csvContent = [
                                        headers.join(","),
                                        ...filteredFounders.map(f =>
                                            [
                                                f.name,
                                                f.email,
                                                f.segmentation?.founderRole ? formatSegmentationValue("founderRole", f.segmentation.founderRole) : "",
                                                f.segmentation?.revenueRange ? formatSegmentationValue("revenueRange", f.segmentation.revenueRange) : "",
                                                f.segmentation?.teamSize ? formatSegmentationValue("teamSize", f.segmentation.teamSize) : "",
                                                f.segmentation?.industryVertical ? formatSegmentationValue("industryVertical", f.segmentation.industryVertical) : "",
                                                f.totalAudits,
                                                new Date(f.lastActive).toLocaleDateString(),
                                                f.latestStatus
                                            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")
                                        )
                                    ].join("\n");

                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    if (link.download !== undefined) {
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", "founders_export.csv");
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }
                                }}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </>
            }
        >
                    <Card className="glass-card">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="w-[300px]">Founder</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Revenue</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Audits Run</TableHead>
                                        <TableHead className="text-right">Last Active</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredFounders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No founders found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredFounders.map((founder) => (
                                            <TableRow key={founder.email} className="group hover:bg-muted/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border">
                                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                {founder.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="grid gap-0.5">
                                                            <span className="font-semibold text-sm">{founder.name}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" /> {founder.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {founder.segmentation?.founderRole ? formatSegmentationValue("founderRole", founder.segmentation.founderRole) : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {founder.segmentation?.revenueRange ? formatSegmentationValue("revenueRange", founder.segmentation.revenueRange) : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {founder.segmentation?.teamSize ? formatSegmentationValue("teamSize", founder.segmentation.teamSize) : "-"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {founder.segmentation?.industryVertical ? formatSegmentationValue("industryVertical", founder.segmentation.industryVertical) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(founder.latestStatus) as any} className="capitalize shadow-none">
                                                        {founder.latestStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono font-medium">{founder.totalAudits}</span>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-sm">
                                                    {new Date(founder.lastActive).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                        View Profile
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
        </AdminPageLayout>
    );
};

export default AdminFounders;
