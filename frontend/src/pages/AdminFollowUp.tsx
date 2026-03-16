import { useState, useEffect } from "react";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditFollowUp {
    status: string;
    remarks: string;
    updatedAt?: string;
}

interface AuditData {
    _id: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    results?: {
        totalBottleneckCost: number;
    };
    followUp?: AuditFollowUp;
}

export default function AdminFollowUp() {
    const [audits, setAudits] = useState<AuditData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [localFollowUp, setLocalFollowUp] = useState<{ [key: string]: AuditFollowUp }>({});
    const { toast } = useToast();

    const fetchAudits = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            // Changed to use deployed API base URL instead of hardcoded localhost
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/audits`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAudits(data);

                // Initialize local state mapping for editing without immediately saving on keystrokes
                const initialLocalState: { [key: string]: AuditFollowUp } = {};
                data.forEach((audit: AuditData) => {
                    initialLocalState[audit._id] = {
                        status: audit.followUp?.status || "Pending",
                        remarks: audit.followUp?.remarks || ""
                    };
                });
                setLocalFollowUp(initialLocalState);
            }
        } catch (error) {
            console.error("Failed to fetch audits:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load submissions." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    const handleSaveFollowUp = async (id: string) => {
        setUpdatingId(id);
        try {
            const token = localStorage.getItem("adminToken");
            const followUpData = localFollowUp[id];

            // Changed to use deployed API base URL instead of hardcoded localhost
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/audits/${id}/followup`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(followUpData),
            });

            if (response.ok) {
                toast({ title: "Updated", description: "Follow-up details saved successfully." });
                // Optionally update the main audits array to flash the new timestamp
                setAudits(audits.map(a => a._id === id ? { ...a, followUp: { ...followUpData, updatedAt: new Date().toISOString() } } : a));
            } else {
                toast({ variant: "destructive", title: "Failed", description: "Could not save follow-up." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred." });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusChange = (id: string, newStatus: string) => {
        setLocalFollowUp(prev => ({
            ...prev,
            [id]: { ...prev[id], status: newStatus }
        }));
    };

    const handleRemarksChange = (id: string, newRemarks: string) => {
        setLocalFollowUp(prev => ({
            ...prev,
            [id]: { ...prev[id], remarks: newRemarks }
        }));
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return "$0";
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Converted': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Contacted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'In Progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Ignored': return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
            case 'Pending':
            default: return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
    };

    return (
        <AdminPageLayout title="Follow Up Management" description="Track interactions and add remarks for founder submissions.">
            <Card className="mt-6 border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Submission Follow-Ups</CardTitle>
                    <CardDescription>View all audits and update their contact status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[200px]">Founder Details</TableHead>
                                    <TableHead className="w-[120px]">Cost</TableHead>
                                    <TableHead className="w-[150px]">Status</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead className="w-[100px] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            Loading submissions...
                                        </TableCell>
                                    </TableRow>
                                ) : audits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No audits found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.map((audit) => (
                                        <TableRow key={audit._id}>
                                            <TableCell>
                                                <div className="font-medium">{audit.userName}</div>
                                                <div className="text-xs text-muted-foreground">{audit.userEmail}</div>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(audit.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-destructive">
                                                {formatCurrency(audit.results?.totalBottleneckCost)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <Select
                                                        value={localFollowUp[audit._id]?.status || "Pending"}
                                                        onValueChange={(val) => handleStatusChange(audit._id, val)}
                                                    >
                                                        <SelectTrigger className={`h-8 text-xs ${getStatusColor(localFollowUp[audit._id]?.status || "Pending")}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Contacted">Contacted</SelectItem>
                                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                                            <SelectItem value="Converted">Converted</SelectItem>
                                                            <SelectItem value="Ignored">Ignored</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {audit.followUp?.updatedAt && (
                                                        <span className="text-[10px] text-muted-foreground text-center">
                                                            Upd: {new Date(audit.followUp.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Textarea
                                                    placeholder="Add follow up remarks..."
                                                    className="min-h-[60px] resize-y text-sm bg-background"
                                                    value={localFollowUp[audit._id]?.remarks || ""}
                                                    onChange={(e) => handleRemarksChange(audit._id, e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveFollowUp(audit._id)}
                                                    disabled={updatingId === audit._id}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                                >
                                                    {updatingId === audit._id ? "Saving..." : "Save"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
