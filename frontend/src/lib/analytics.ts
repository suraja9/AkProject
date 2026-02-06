
import { Audit } from "@/types/audit";
import { OPERATIONAL_CATEGORY_IDS } from "@/types/audit";

// Segmentation label helpers for display
export const SEGMENTATION_LABELS = {
    founderRole: { "solo-founder": "Solo Founder", "co-founder": "Co-Founder", "ceo": "CEO" } as Record<string, string>,
    revenueRange: { "pre-revenue": "Pre-revenue", "0-100k": "$0 - $100K", "100k-500k": "$100K - $500K", "500k-1m": "$500K - $1M", "1m-5m": "$1M - $5M", "5m-10m": "$5M - $10M", "10m+": "$10M+" } as Record<string, string>,
    teamSize: { "1-5": "1 - 5", "6-10": "6 - 10", "11-25": "11 - 25", "26-50": "26 - 50", "51-100": "51 - 100", "100+": "100+" } as Record<string, string>,
    industryVertical: { "saas": "SaaS", "ecommerce": "E-commerce", "fintech": "Fintech", "healthcare": "Healthcare", "marketplace": "Marketplace", "consumer": "Consumer", "enterprise": "Enterprise", "media": "Media / Content", "hardware": "Hardware", "other": "Other" } as Record<string, string>,
};

export const formatSegmentationValue = (field: keyof typeof SEGMENTATION_LABELS, value: string) =>
    SEGMENTATION_LABELS[field]?.[value] || value || "-";

// Reuse the interface from AdminDashboard for now, I will assume it's passed in.
export const calculateAnalytics = (audits: any[]) => {
    if (!audits.length) return null;

    const totalAudits = audits.length;

    // 1. Bottleneck Cost Stats
    const totalBottleneckCost = audits.reduce((acc, curr) => acc + (curr.results?.totalBottleneckCost || 0), 0);
    const avgBottleneckCost = totalBottleneckCost / totalAudits;

    // 2. Decision Load Stats
    const totalDecisions = audits.reduce((acc, curr) => acc + (curr.results?.totalDecisions || 0), 0);
    const avgDecisionLoad = totalDecisions / totalAudits;

    // 3. Pattern frequency
    const patternCounts: Record<string, number> = {};
    audits.forEach(audit => {
        audit.auditData?.patterns?.forEach((p: any) => {
            if (p.checked) {
                patternCounts[p.name] = (patternCounts[p.name] || 0) + 1;
            }
        });
    });
    const topPatterns = Object.entries(patternCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 4. Decision Breakdown (Aggregate)
    const categoryAggregates: Record<string, { total: number, delegate: number, onlyYou: number, notSure: number }> = {};

    audits.forEach(audit => {
        audit.auditData?.decisionCategories?.forEach((cat: any) => {
            if (!categoryAggregates[cat.name]) {
                categoryAggregates[cat.name] = { total: 0, delegate: 0, onlyYou: 0, notSure: 0 };
            }
            categoryAggregates[cat.name].total += cat.decisions || 0;
            categoryAggregates[cat.name].delegate += cat.couldDelegate || 0;
            categoryAggregates[cat.name].onlyYou += cat.onlyYou || 0;
            categoryAggregates[cat.name].notSure += cat.notSure || 0;
        });
    });

    const categoryBreakdown = Object.entries(categoryAggregates).map(([name, stats]) => ({
        name,
        ...stats
    }));

    // 5. Avg Compensation (for context)
    const avgCompensation = audits.reduce((acc, curr) => acc + (curr.auditData?.annualCompensation || 0), 0) / totalAudits;

    // 6. Delay Tax Breakdown
    const delayTaxAggregates: Record<string, number> = {};
    audits.forEach(audit => {
        audit.auditData?.delayTax?.forEach((dt: any) => {
            delayTaxAggregates[dt.name] = (delayTaxAggregates[dt.name] || 0) + dt.amount;
        });
    });
    const delayTaxBreakdown = Object.entries(delayTaxAggregates)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 7. Operational vs Strategic %
    let totalOperational = 0;
    let totalStrategic = 0;
    audits.forEach(audit => {
        audit.auditData?.decisionCategories?.forEach((cat: any) => {
            const decisions = cat.decisions || 0;
            if (OPERATIONAL_CATEGORY_IDS.includes(cat.id)) {
                totalOperational += decisions;
            } else {
                totalStrategic += decisions;
            }
        });
    });
    const totalDecisionsForSplit = totalOperational + totalStrategic;
    const operationalPct = totalDecisionsForSplit > 0 ? Math.round((totalOperational / totalDecisionsForSplit) * 100) : 0;
    const strategicPct = totalDecisionsForSplit > 0 ? Math.round((totalStrategic / totalDecisionsForSplit) * 100) : 0;

    // 8. Segmentation breakdowns
    const founderRoleCounts: Record<string, number> = {};
    const revenueRangeCounts: Record<string, number> = {};
    const teamSizeCounts: Record<string, number> = {};
    const industryVerticalCounts: Record<string, number> = {};

    audits.forEach(audit => {
        const seg = audit.segmentation;
        if (seg?.founderRole) founderRoleCounts[seg.founderRole] = (founderRoleCounts[seg.founderRole] || 0) + 1;
        if (seg?.revenueRange) revenueRangeCounts[seg.revenueRange] = (revenueRangeCounts[seg.revenueRange] || 0) + 1;
        if (seg?.teamSize) teamSizeCounts[seg.teamSize] = (teamSizeCounts[seg.teamSize] || 0) + 1;
        if (seg?.industryVertical) industryVerticalCounts[seg.industryVertical] = (industryVerticalCounts[seg.industryVertical] || 0) + 1;
    });

    const segmentation = {
        founderRole: Object.entries(founderRoleCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        revenueRange: Object.entries(revenueRangeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        teamSize: Object.entries(teamSizeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        industryVertical: Object.entries(industryVerticalCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };

    return {
        overview: {
            totalAudits,
            avgBottleneckCost,
            avgDecisionLoad,
            avgCompensation
        },
        patterns: topPatterns,
        categories: categoryBreakdown,
        delayTax: delayTaxBreakdown,
        operationalVsStrategic: {
            operationalPct,
            strategicPct,
            totalOperational,
            totalStrategic
        },
        segmentation
    };
};

export const calculateSessionAnalytics = (sessions: any[]) => {
    if (!sessions.length) return null;

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const completionRate = Math.round((completedSessions.length / totalSessions) * 100);

    // Avg completion time
    const completionTimes = completedSessions.map(s => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        return end - start;
    });

    const avgTimeMs = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    // Format minutes and seconds
    const minutes = Math.floor(avgTimeMs / 60000);
    const seconds = Math.floor((avgTimeMs % 60000) / 1000);
    const avgCompletionTime = `${minutes}m ${seconds}s`;

    // Drop-off points (filtered for non-completed)
    const dropOffCounts: Record<string, number> = {};
    sessions
        .filter(s => s.status !== 'completed' && s.lastStep !== 'completed')
        .forEach(s => {
            const step = s.lastStep || 'unknown';
            dropOffCounts[step] = (dropOffCounts[step] || 0) + 1;
        });

    const dropOffData = Object.entries(dropOffCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        completionRate,
        avgCompletionTime,
        dropOffData,
        totalSessions
    };
};

export const calculateFunnelAnalytics = (sessions: any[], audits: any[]) => {
    const startCount = sessions.length;
    const reachedEmailCount = sessions.filter(s => !['intro'].includes(s.lastStep || '')).length;
    const completedCount = audits.length;
    const emailCaptureRate = reachedEmailCount ? Math.round((completedCount / reachedEmailCount) * 100) : 0;
    const startToCompleteRate = startCount ? Math.round((completedCount / startCount) * 100) : 0;

    const steps = [
        { name: 'Start Audit', count: startCount, conversion: 100 },
        { name: 'Reached Email', count: reachedEmailCount, conversion: startCount ? Math.round((reachedEmailCount / startCount) * 100) : 0 },
        { name: 'Completed', count: completedCount, conversion: startToCompleteRate },
    ];

    let largestDropStep = '';
    let largestDrop = 0;
    if (steps.length >= 2) {
        for (let i = 0; i < steps.length - 1; i++) {
            const drop = steps[i].count - steps[i + 1].count;
            if (drop > largestDrop) {
                largestDrop = drop;
                largestDropStep = steps[i].name;
            }
        }
    }

    return {
        steps,
        startCount,
        reachedEmailCount,
        completedCount,
        emailCaptureRate,
        startToCompleteRate,
        largestDropStep,
        largestDrop
    };
};
