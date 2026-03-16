require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(require('cors')());

// Import Model
const Audit = require('./models/Audit');
const Admin = require('./models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// Decision Debt pattern analytics
app.get('/api/analytics/decision-debt', async (req, res) => {
  try {
    const audits = await Audit.find();

    const PATTERN_IDS = [
      'reactive-decision-making',
      'fragmentation',
      'overcommitment-dependency',
      'reversal-inconsistency',
      'speed-mismatch',
    ];

    // 1. Pattern frequency
    const patternFrequency = {};
    PATTERN_IDS.forEach(id => { patternFrequency[id] = { id, name: '', count: 0 }; });

    // 2. Severity distribution per audit (# of checked patterns)
    const severityBuckets = { Moderate: 0, High: 0, Critical: 0 };
    const totalAudits = audits.length;

    // 3. Co-occurrence matrix
    const coOccurrence = {};
    PATTERN_IDS.forEach(a => {
      coOccurrence[a] = {};
      PATTERN_IDS.forEach(b => { coOccurrence[a][b] = 0; });
    });

    // 4. Pattern by revenue range
    const REVENUE_RANGES = ['pre-revenue', '0-100k', '100k-500k', '500k-1m', '1m-5m', '5m-10m', '10m+'];
    const patternByRevenue = {};
    REVENUE_RANGES.forEach(r => {
      patternByRevenue[r] = {};
      PATTERN_IDS.forEach(id => { patternByRevenue[r][id] = 0; });
    });
    const revenueAuditCount = {};
    REVENUE_RANGES.forEach(r => { revenueAuditCount[r] = 0; });

    audits.forEach(audit => {
      const checkedPatterns = (audit.auditData?.patterns || []).filter(p => p.checked);
      const checkedIds = checkedPatterns.map(p => p.id);
      const checkedCount = checkedIds.length;
      const revenueRange = audit.segmentation?.revenueRange || '';

      // Pattern frequency
      checkedPatterns.forEach(p => {
        if (patternFrequency[p.id]) {
          patternFrequency[p.id].name = p.name;
          patternFrequency[p.id].count += 1;
        }
      });

      // Severity
      if (checkedCount === 0 || checkedCount === 1) severityBuckets.Moderate += 1;
      else if (checkedCount <= 3) severityBuckets.High += 1;
      else severityBuckets.Critical += 1;

      // Co-occurrence
      checkedIds.forEach(a => {
        checkedIds.forEach(b => {
          if (a !== b && coOccurrence[a] && coOccurrence[a][b] !== undefined) {
            coOccurrence[a][b] += 1;
          }
        });
      });

      // Pattern by revenue
      if (REVENUE_RANGES.includes(revenueRange)) {
        revenueAuditCount[revenueRange] += 1;
        checkedIds.forEach(id => {
          if (patternByRevenue[revenueRange] && patternByRevenue[revenueRange][id] !== undefined) {
            patternByRevenue[revenueRange][id] += 1;
          }
        });
      }
    });

    // Flatten co-occurrence into top pairs
    const coOccurrencePairs = [];
    PATTERN_IDS.forEach((a, i) => {
      PATTERN_IDS.forEach((b, j) => {
        if (j > i && coOccurrence[a][b] > 0) {
          const nameA = patternFrequency[a]?.name || a;
          const nameB = patternFrequency[b]?.name || b;
          coOccurrencePairs.push({ patternA: nameA, patternB: nameB, count: coOccurrence[a][b] });
        }
      });
    });
    coOccurrencePairs.sort((x, y) => y.count - x.count);

    // Pattern by revenue: express as % of audits in that range
    const patternByRevenueFormatted = REVENUE_RANGES.map(range => {
      const total = revenueAuditCount[range] || 0;
      const entry = { range, total };
      PATTERN_IDS.forEach(id => {
        const name = patternFrequency[id]?.name || id;
        entry[name] = total > 0 ? Math.round((patternByRevenue[range][id] / total) * 100) : 0;
      });
      return entry;
    }).filter(r => r.total > 0);

    // Severity percentages
    const severityDistribution = Object.entries(severityBuckets).map(([label, count]) => ({
      label,
      count,
      pct: totalAudits > 0 ? Math.round((count / totalAudits) * 100) : 0
    }));

    res.json({
      patternFrequency: Object.values(patternFrequency).sort((a, b) => b.count - a.count),
      severityDistribution,
      coOccurrencePairs: coOccurrencePairs.slice(0, 10),
      patternByRevenue: patternByRevenueFormatted,
      patternNames: Object.values(patternFrequency).map(p => p.name).filter(Boolean),
      totalAudits
    });
  } catch (error) {
    console.error('❌ Error fetching decision-debt analytics:', error);
    res.status(500).json({ error: 'Failed to fetch decision-debt analytics' });
  }
});

// Qualitative insights: Q13/14/15 responses
app.get('/api/analytics/qualitative', async (req, res) => {
  try {
    const audits = await Audit.find(
      { $or: [
        { 'openEndedResponses.desiredOutcome': { $ne: '' } },
        { 'openEndedResponses.obstacle': { $ne: '' } },
        { 'openEndedResponses.anythingElse': { $ne: '' } }
      ]},
      {
        userName: 1, userEmail: 1, createdAt: 1,
        'segmentation.revenueRange': 1,
        'segmentation.industryVertical': 1,
        'results.overallStatus': 1,
        'openEndedResponses': 1
      }
    ).sort({ createdAt: -1 });

    res.json(audits);
  } catch (error) {
    console.error('❌ Error fetching qualitative insights:', error);
    res.status(500).json({ error: 'Failed to fetch qualitative insights' });
  }
});

// --- Admin Auth Routes ---

// Optional: Register Admin (First time setup, can be commented out later)
app.post('/api/admin/register', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      name,
      email,
      role: role || 'Admin',
      password: hashedPassword
    });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('❌ Error registering admin:', error);
    res.status(500).json({ error: 'Failed to register admin' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const token = jwt.sign({ adminId: admin._id }, jwtSecret, { expiresIn: '1d' });

    res.json({ token, email: admin.email });
  } catch (error) {
    console.error('❌ Error logging in admin:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Middleware to protect admin routes (Optional, but good practice for other admin routes)
const verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const verified = jwt.verify(token, jwtSecret);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all admins
app.get('/api/admins', verifyAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Update audit follow up status
app.put('/api/audits/:id/followup', verifyAdmin, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updateData = {
      'followUp.status': status,
      'followUp.remarks': remarks,
      'followUp.updatedAt': new Date()
    };
    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.json(audit);
  } catch (error) {
    console.error('❌ Error updating audit follow-up:', error);
    res.status(500).json({ error: 'Failed to update follow-up details' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});