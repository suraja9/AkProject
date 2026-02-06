const mongoose = require('mongoose');

const auditSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    lastStep: { type: String, required: true },
    status: { type: String, enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditSession', auditSessionSchema);
