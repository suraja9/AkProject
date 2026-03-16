import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, MessageSquareText, Target, XCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { formatSegmentationValue } from "@/lib/analytics";

interface QualitativeEntry {
  _id: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  segmentation?: {
    revenueRange?: string;
    industryVertical?: string;
  };
  results?: {
    overallStatus?: string;
  };
  openEndedResponses?: {
    desiredOutcome?: string;
    obstacle?: string;
    anythingElse?: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  optimized: 'bg-success/15 text-success border-success/30',
  'scaling-risk': 'bg-warning/15 text-warning border-warning/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
};

const AdminQualitativeInsights = () => {
  const [entries, setEntries] = useState<QualitativeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRevenue, setFilterRevenue] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/qualitative`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setEntries(json);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load qualitative insights.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const q = search.toLowerCase();
      const matchesSearch = !q || [
        e.userName, e.userEmail,
        e.openEndedResponses?.desiredOutcome,
        e.openEndedResponses?.obstacle,
        e.openEndedResponses?.anythingElse,
      ].some(f => f?.toLowerCase().includes(q));
      const matchesRevenue = filterRevenue === 'all' || e.segmentation?.revenueRange === filterRevenue;
      const matchesStatus = filterStatus === 'all' || e.results?.overallStatus === filterStatus;
      return matchesSearch && matchesRevenue && matchesStatus;
    });
  }, [entries, search, filterRevenue, filterStatus]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const hasResponse = (e: QualitativeEntry) =>
    e.openEndedResponses?.desiredOutcome ||
    e.openEndedResponses?.obstacle ||
    e.openEndedResponses?.anythingElse;

  return (
    <AdminPageLayout
      title="Qualitative Insights"
      description="Open-ended responses from Questions 13, 14 & 15 — goals, obstacles, and extra context from founders."
      actions={
        <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {/* Summary KPIs */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Card className="glass-card border-t-4 border-t-primary">
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Responses Collected</p>
              <p className="text-3xl font-bold mt-1">{entries.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-t-4 border-t-accent">
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">With Q13 (Desired Outcome)</p>
              <p className="text-3xl font-bold mt-1">
                {entries.filter(e => e.openEndedResponses?.desiredOutcome).length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-t-4 border-t-warning">
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">With Q14 (Obstacle)</p>
              <p className="text-3xl font-bold mt-1">
                {entries.filter(e => e.openEndedResponses?.obstacle).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="qualitative-search"
            placeholder="Search name, email, or response…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRevenue} onValueChange={setFilterRevenue}>
          <SelectTrigger id="filter-revenue" className="w-[170px]">
            <SelectValue placeholder="Revenue Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Revenues</SelectItem>
            {['pre-revenue', '0-100k', '100k-500k', '500k-1m', '1m-5m', '5m-10m', '10m+'].map(r => (
              <SelectItem key={r} value={r}>{formatSegmentationValue('revenueRange', r)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger id="filter-status" className="w-[170px]">
            <SelectValue placeholder="Overall Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="optimized">Optimized</SelectItem>
            <SelectItem value="scaling-risk">Scaling Risk</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterRevenue !== 'all' || filterStatus !== 'all') && (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setSearch(''); setFilterRevenue('all'); setFilterStatus('all'); }}>
            <XCircle className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-[30vh] items-center justify-center text-muted-foreground text-sm">
          No responses match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(entry => (
            <Card key={entry._id} className="glass-card hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{entry.userName || '—'}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{entry.userEmail} · {formatDate(entry.createdAt)}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.segmentation?.revenueRange && (
                      <Badge variant="outline" className="text-xs">
                        {formatSegmentationValue('revenueRange', entry.segmentation.revenueRange)}
                      </Badge>
                    )}
                    {entry.segmentation?.industryVertical && (
                      <Badge variant="outline" className="text-xs">
                        {formatSegmentationValue('industryVertical', entry.segmentation.industryVertical)}
                      </Badge>
                    )}
                    {entry.results?.overallStatus && (
                      <Badge
                        className={`text-xs border ${STATUS_BADGE[entry.results.overallStatus] || 'bg-secondary/50'}`}
                        variant="outline"
                      >
                        {entry.results.overallStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {entry.openEndedResponses?.desiredOutcome && (
                  <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Q13 — Desired Outcome (90 days)</p>
                      <p className="text-sm leading-relaxed">{entry.openEndedResponses.desiredOutcome}</p>
                    </div>
                  </div>
                )}
                {entry.openEndedResponses?.obstacle && (
                  <div className="flex gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                    <XCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">Q14 — Obstacle / What Hasn't Worked</p>
                      <p className="text-sm leading-relaxed">{entry.openEndedResponses.obstacle}</p>
                    </div>
                  </div>
                )}
                {entry.openEndedResponses?.anythingElse && (
                  <div className="flex gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <HelpCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Q15 — Anything Else</p>
                      <p className="text-sm leading-relaxed">{entry.openEndedResponses.anythingElse}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminQualitativeInsights;
