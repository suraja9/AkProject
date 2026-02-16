import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { Clock, PlayCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Session {
    sessionId: string;
    startTime: string;
    endTime?: string;
    lastStep: string;
    status: string;
}

const AdminLive = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://akproject-l7pz.onrender.com/api/sessions');
            if (!response.ok) throw new Error('Failed to fetch sessions');
            const data = await response.json();
            // Filter for live/recent sessions only or show all with status?
            // "Live" usually implies in-progress.
            setSessions(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load session data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        // Optional: Set up polling
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    const activeSessions = sessions.filter(s => s.status === 'in-progress');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    const getDuration = (start: string) => {
        const diff = new Date().getTime() - new Date(start).getTime();
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min active`;
    };

    return (
        <AdminPageLayout
            title={
                <span className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    Live Activity
                </span>
            }
            description="Monitor ongoing audit sessions in real-time."
            actions={
                <Button onClick={fetchSessions} variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
                    <div className="space-y-6">
                        
                        {/* Recent History (could be truncated) */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                Recent Completions
                            </h2>
                            <Card className="glass-card">
                                <CardContent className="p-0">
                                    <div className="rounded-md border-0">
                                        {/* Simple list or table for recent logs */}
                                        <div className="divide-y divide-border">
                                            {completedSessions.slice(0, 5).map(session => (
                                                <div key={session.sessionId} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono text-xs text-muted-foreground">ID: {session.sessionId}</span>
                                                        <span className="font-medium text-sm">Completed Audit</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(session.endTime || session.startTime).toLocaleTimeString()}
                                                        </div>
                                                        <Badge variant="secondary" className="mt-1 text-[10px]">
                                                            Completed
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            {completedSessions.length === 0 && (
                                                <div className="p-8 text-center text-muted-foreground">No recently completed sessions.</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
        </AdminPageLayout>
    );
};

export default AdminLive;
