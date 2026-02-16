const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    sessionId: { type: String },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    segmentation: {
        founderRole: { type: String },
        revenueRange: { type: String },
        teamSize: { type: String },
        industryVertical: { type: String }
    },
    auditData: {
        decisionCategories: [{
            id: String,
            name: String,
            decisions: Number,
            couldDelegate: Number,
            notSure: Boolean
        }],
        annualCompensation: Number,
        averageMinutesPerDecision: Number,
        delayTax: [{
            id: String,
            name: String,
            amount: Number
        }],
        patterns: [{
            id: String,
            name: String,
            description: String,
            checked: Boolean
        }]
    },
    results: {
        totalDecisions: Number,
        decisionLoadLevel: String,
        hourlyRate: Number,
        hoursPerWeek: Number,
        annualCost: Number,
        delayTaxAnnual: Number,
        totalBottleneckCost: Number,
        patternsChecked: Number,
        overallStatus: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Audit', auditSchema);
