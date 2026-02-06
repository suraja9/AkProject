require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(require('cors')());

// Import Model
const Audit = require('./models/Audit');

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URL:', process.env.MONGO_URL ? 'URL loaded from .env ✅' : 'URL not found ❌');

    await mongoose.connect(process.env.MONGO_URL);

    console.log('✅ MongoDB connected successfully!');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});


app.post('/api/audit', async (req, res) => {
  try {
    console.log('📥 Received audit data:', req.body.email);
    const audit = new Audit(req.body);
    const savedAudit = await audit.save();
    console.log('✅ Audit saved successfully:', savedAudit._id);
    res.status(201).json(savedAudit);
  } catch (error) {
    console.error('❌ Error saving audit:', error);
    res.status(500).json({ error: 'Failed to save audit data' });
  }
});

const AuditSession = require('./models/AuditSession');

// ... (existing audit routes)

app.get('/api/audits', async (req, res) => {
  try {
    console.log('📥 Fetching all audits...');
    const audits = await Audit.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${audits.length} audits`);
    res.json(audits);
  } catch (error) {
    console.error('❌ Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// --- Session Tracking Routes ---

// Start a new session
app.post('/api/session/start', async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('🏁 Starting session:', sessionId);

    const session = new AuditSession({
      sessionId,
      lastStep: 'intro',
      status: 'in-progress'
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('❌ Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Update session progress (last step)
app.post('/api/session/update', async (req, res) => {
  try {
    const { sessionId, step } = req.body;
    // console.log(`🔄 Updating session ${sessionId} to step: ${step}`);

    await AuditSession.findOneAndUpdate(
      { sessionId },
      { lastStep: step },
      { new: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Complete session
app.post('/api/session/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('🏁 Completing session:', sessionId);

    await AuditSession.findOneAndUpdate(
      { sessionId },
      {
        status: 'completed',
        endTime: new Date(),
        lastStep: 'completed'
      },
      { new: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Get all sessions for analytics
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await AuditSession.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// --- Analytics API Routes ---

// Funnel analytics
app.get('/api/analytics/funnel', async (req, res) => {
  try {
    const [sessions, audits] = await Promise.all([
      AuditSession.find(),
      Audit.find()
    ]);
    const startCount = sessions.length;
    const reachedEmailCount = sessions.filter(s => !['intro'].includes(s.lastStep || '')).length;
    const completedCount = audits.length;
    const steps = [
      { name: 'Start Audit', count: startCount, conversion: 100 },
      { name: 'Reached Email', count: reachedEmailCount, conversion: startCount ? Math.round((reachedEmailCount / startCount) * 100) : 0 },
      { name: 'Completed', count: completedCount, conversion: startCount ? Math.round((completedCount / startCount) * 100) : 0 },
    ];
    let largestDropStep = '';
    let largestDrop = 0;
    for (let i = 0; i < steps.length - 1; i++) {
      const drop = steps[i].count - steps[i + 1].count;
      if (drop > largestDrop) {
        largestDrop = drop;
        largestDropStep = steps[i].name;
      }
    }
    res.json({
      steps,
      startCount,
      reachedEmailCount,
      completedCount,
      emailCaptureRate: reachedEmailCount ? Math.round((completedCount / reachedEmailCount) * 100) : 0,
      startToCompleteRate: startCount ? Math.round((completedCount / startCount) * 100) : 0,
      largestDropStep,
      largestDrop
    });
  } catch (error) {
    console.error('❌ Error fetching funnel analytics:', error);
    res.status(500).json({ error: 'Failed to fetch funnel analytics' });
  }
});

// Business metrics
app.get('/api/analytics/business', async (req, res) => {
  try {
    const [sessions, audits] = await Promise.all([
      AuditSession.find(),
      Audit.find()
    ]);
    const reachedEmailCount = sessions.filter(s => !['intro'].includes(s.lastStep || '')).length;
    const completedCount = audits.length;
    const emailCaptureRate = reachedEmailCount ? Math.round((completedCount / reachedEmailCount) * 100) : 0;

    // Return visitors (emails with >1 audit)
    const emailCounts = {};
    audits.forEach(a => {
      const email = (a.userEmail || '').toLowerCase().trim();
      if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
    });
    const returnVisitorEmails = Object.entries(emailCounts).filter(([, count]) => count > 1).map(([email]) => email);
    const returnVisitorCount = returnVisitorEmails.length;

    // Performance improvement (1st vs 2nd audit per email)
    const auditsByEmail = {};
    audits.forEach(a => {
      const email = (a.userEmail || '').toLowerCase().trim();
      if (!email) return;
      if (!auditsByEmail[email]) auditsByEmail[email] = [];
      auditsByEmail[email].push(a);
    });
    const performanceImprovement = [];
    Object.entries(auditsByEmail).forEach(([email, userAudits]) => {
      if (userAudits.length < 2) return;
      const sorted = userAudits.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const first = sorted[0];
      const second = sorted[1];
      const delta = {
        totalDecisions: (second.results?.totalDecisions || 0) - (first.results?.totalDecisions || 0),
        totalBottleneckCost: (second.results?.totalBottleneckCost || 0) - (first.results?.totalBottleneckCost || 0),
      };
      performanceImprovement.push({
        email,
        firstAudit: { totalDecisions: first.results?.totalDecisions, totalBottleneckCost: first.results?.totalBottleneckCost },
        secondAudit: { totalDecisions: second.results?.totalDecisions, totalBottleneckCost: second.results?.totalBottleneckCost },
        delta
      });
    });

    res.json({
      emailCaptureRate,
      returnVisitorCount,
      returnVisitorEmails,
      performanceImprovement
    });
  } catch (error) {
    console.error('❌ Error fetching business analytics:', error);
    res.status(500).json({ error: 'Failed to fetch business analytics' });
  }
});

// Time-based trends
app.get('/api/analytics/trends', async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const [sessions, audits] = await Promise.all([
      AuditSession.find().sort({ startTime: 1 }),
      Audit.find().sort({ createdAt: 1 })
    ]);

    const getPeriodKey = (date) => {
      const d = new Date(date);
      if (period === 'month') {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().slice(0, 10);
    };

    const sessionByPeriod = {};
    sessions.forEach(s => {
      const key = getPeriodKey(s.startTime || s.createdAt);
      if (!sessionByPeriod[key]) sessionByPeriod[key] = { sessions: 0, completed: 0 };
      sessionByPeriod[key].sessions++;
      if (s.status === 'completed') sessionByPeriod[key].completed++;
    });

    const auditByPeriod = {};
    audits.forEach(a => {
      const key = getPeriodKey(a.createdAt);
      if (!auditByPeriod[key]) auditByPeriod[key] = { count: 0, totalBottleneckCost: 0 };
      auditByPeriod[key].count++;
      auditByPeriod[key].totalBottleneckCost += a.results?.totalBottleneckCost || 0;
    });

    const allKeys = [...new Set([...Object.keys(sessionByPeriod), ...Object.keys(auditByPeriod)])].sort();
    const trends = allKeys.map(key => ({
      period: key,
      sessions: sessionByPeriod[key]?.sessions || 0,
      completed: sessionByPeriod[key]?.completed || 0,
      completionRate: sessionByPeriod[key]?.sessions
        ? Math.round((sessionByPeriod[key].completed / sessionByPeriod[key].sessions) * 100)
        : 0,
      audits: auditByPeriod[key]?.count || 0,
      avgBottleneckCost: auditByPeriod[key]?.count
        ? Math.round(auditByPeriod[key].totalBottleneckCost / auditByPeriod[key].count)
        : 0
    }));

    res.json({ trends, period });
  } catch (error) {
    console.error('❌ Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});