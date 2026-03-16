import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertTriangle, BarChart2, Network, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  Moderate: 'hsl(var(--success))',
  High: 'hsl(var(--warning))',
  Critical: 'hsl(var(--destructive))',
};

const PATTERN_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--success))',
];

interface DecisionDebtData {
  patternFrequency: { id: string; name: string; count: number }[];
  severityDistribution: { label: string; count: number; pct: number }[];
  coOccurrencePairs: { patternA: string; patternB: string; count: number }[];
  patternByRevenue: Record<string, any>[];
  patternNames: string[];
  totalAudits: number;
}

const REVENUE_LABELS: Record<string, string> = {
  'pre-revenue': 'Pre-Rev',
  '0-100k': '$0–100K',
  '100k-500k': '$100–500K',
  '500k-1m': '$500K–1M',
  '1m-5m': '$1M–5M',
  '5m-10m': '$5M–10M',
  '10m+': '$10M+',
};

const AdminDecisionDebt = () => {
  const [data, setData] = useState<DecisionDebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/decision-debt`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load Decision Debt analytics.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatPct = (val: number) => `${val}%`;

  const patternByRevenueFormatted = (data?.patternByRevenue || []).map(row => ({
    ...row,
    range: REVENUE_LABELS[row.range] || row.range,
  }));

  return (
    <AdminPageLayout
      title="Decision Debt Metrics"
      description="Pattern frequency, severity distribution, co-occurrence, and revenue-range breakdowns."
      actions={
        <Button onClick={fetchData} variant="secondary" size="sm" className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : !data || data.totalAudits === 0 ? (
        <div className="flex h-[50vh] w-full items-center justify-center text-muted-foreground">
          No audit data available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* KPI row */}
          <Card className="glass-card border-t-4 border-t-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Total Audits Analysed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalAudits}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-t-4 border-t-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Top Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate" title={data.patternFrequency[0]?.name}>
                {data.patternFrequency[0]?.name || '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.patternFrequency[0]?.count || 0} occurrences across audits
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-t-4 border-t-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Network className="h-4 w-4" /> Top Co-occurrence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.coOccurrencePairs[0] ? (
                <>
                  <div className="text-sm font-semibold leading-snug">
                    {data.coOccurrencePairs[0].patternA}
                  </div>
                  <div className="text-xs text-muted-foreground my-0.5">+ {data.coOccurrencePairs[0].patternB}</div>
                  <Badge variant="secondary">{data.coOccurrencePairs[0].count} audits</Badge>
                </>
              ) : <span className="text-muted-foreground text-sm">No co-occurrences yet</span>}
            </CardContent>
          </Card>

          {/* Pattern Frequency Bar Chart */}
          <Card className="glass-card col-span-1 lg:col-span-2 min-h-[360px]">
            <CardHeader>
              <CardTitle>Pattern Frequency</CardTitle>
              <CardDescription>How often each Decision Debt pattern appears across all audits</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.patternFrequency} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={190}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(val: number) => [`${val} audits`, 'Count']}
                  />
                  <Bar dataKey="count" name="Occurrences" radius={[0, 4, 4, 0]} barSize={26}>
                    {data.patternFrequency.map((_, idx) => (
                      <Cell key={idx} fill={PATTERN_COLORS[idx % PATTERN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Distribution Pie */}
          <Card className="glass-card col-span-1 min-h-[360px]">
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
              <CardDescription>% of founders in each severity band (patterns checked)</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(val: number, name: string, props: any) => [`${props.payload.pct}% (${val})`, name]}
                  />
                  <Legend />
                  <Pie
                    data={data.severityDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={({ label, pct }) => `${label}: ${pct}%`}
                    labelLine={false}
                  >
                    {data.severityDistribution.map((entry) => (
                      <Cell key={entry.label} fill={SEVERITY_COLORS[entry.label] || 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Legend card */}
          <Card className="glass-card col-span-1">
            <CardHeader>
              <CardTitle>Severity Breakdown</CardTitle>
              <CardDescription>Patterns checked → Severity band</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <div>
                    <p className="font-semibold text-success">Moderate</p>
                    <p className="text-xs text-muted-foreground">0–1 patterns checked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{data.severityDistribution.find(s => s.label === 'Moderate')?.pct ?? 0}%</p>
                    <p className="text-xs text-muted-foreground">{data.severityDistribution.find(s => s.label === 'Moderate')?.count ?? 0} founders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                  <div>
                    <p className="font-semibold text-warning">High</p>
                    <p className="text-xs text-muted-foreground">2–3 patterns checked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{data.severityDistribution.find(s => s.label === 'High')?.pct ?? 0}%</p>
                    <p className="text-xs text-muted-foreground">{data.severityDistribution.find(s => s.label === 'High')?.count ?? 0} founders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <div>
                    <p className="font-semibold text-destructive">Critical</p>
                    <p className="text-xs text-muted-foreground">4–5 patterns checked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{data.severityDistribution.find(s => s.label === 'Critical')?.pct ?? 0}%</p>
                    <p className="text-xs text-muted-foreground">{data.severityDistribution.find(s => s.label === 'Critical')?.count ?? 0} founders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Co-occurrence table */}
          <Card className="glass-card col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Pattern Co-occurrence</CardTitle>
              <CardDescription>Which patterns appear together most frequently in the same audit</CardDescription>
            </CardHeader>
            <CardContent>
              {data.coOccurrencePairs.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">Not enough data to compute co-occurrences.</p>
              ) : (
                <div className="space-y-2">
                  {data.coOccurrencePairs.slice(0, 8).map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs font-medium">{pair.patternA}</Badge>
                          <span className="text-muted-foreground text-xs self-center">+</span>
                          <Badge variant="outline" className="text-xs font-medium">{pair.patternB}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-2 rounded-full bg-primary/30 overflow-hidden" style={{ width: 80 }}>
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (pair.count / (data.coOccurrencePairs[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono font-bold w-10 text-right">{pair.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pattern by Revenue Range */}
          {patternByRevenueFormatted.length > 0 && data.patternNames.length > 0 && (
            <Card className="glass-card col-span-1 lg:col-span-3 min-h-[420px]">
              <CardHeader>
                <CardTitle>Pattern Prevalence by Revenue Range</CardTitle>
                <CardDescription>% of founders in each revenue band who exhibit each pattern</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patternByRevenueFormatted} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatPct} tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      formatter={(val: number, name: string) => [`${val}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {data.patternNames.map((name, idx) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        name={name}
                        fill={PATTERN_COLORS[idx % PATTERN_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminDecisionDebt;
