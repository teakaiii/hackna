require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const { categorizeConcern, detectPriority, generateResponse } = require('./ai-service');
const { nlpService } = require('./nlp-service');
const { mySQLDatabaseService } = require('./mysql-database-service');
const { databaseNotificationService } = require('./database-notification-service');

const app = express();
const PORT = process.env.PORT || 3000;

let trackingCounter = 1000;

function generateTrackingId() {
    const year = new Date().getFullYear();
    const counter = String(trackingCounter++).padStart(4, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CTR-${year}-${counter}-${random}`;
}

async function findConcern(idOrTracking) {
    try {
        const concern = await mySQLDatabaseService.getConcernById(idOrTracking);
        if (!concern) {
            return null;
        }
        return concern;
    } catch (error) {
        console.error('Error finding concern:', error);
        return null;
    }
}

async function initializeSampleData() {
    try {
        // Check if users already exist
        const existingStudent = await mySQLDatabaseService.getUserByEmail('student@demo.com');
        const existingAdmin = await mySQLDatabaseService.getUserByEmail('admin@demo.com');
        
        if (!existingStudent) {
            await mySQLDatabaseService.createUser({
                id: '1',
                email: 'student@demo.com',
                password: 'password123',
                name: 'Jane Smith',
                role: 'student',
                studentId: '2024001'
            });
            console.log('Student user created');
        }
        
        if (!existingAdmin) {
            await mySQLDatabaseService.createUser({
                id: '2',
                email: 'admin@demo.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin',
                studentId: null
            });
            console.log('Admin user created');
        }
        
        // Check if sample concern already exists
        const existingConcern = await mySQLDatabaseService.getConcernByTrackingId('CTR-2024-1001');
        if (!existingConcern) {
            const sampleId = 'CTR-2024-1001';
            await mySQLDatabaseService.createConcern({
                id: '1',
                trackingId: sampleId,
                studentId: '1',
                studentEmail: 'student@demo.com',
                title: 'WiFi Connection Issues in Library',
                description: 'The WiFi connection in the main library area keeps disconnecting every few minutes. This is affecting my ability to study and complete online assignments. The issue has been ongoing for about a week now.',
                category: 'IT Support',
                priority: 'high',
                status: 'in_progress',
                isAnonymous: false,
                aiCategory: 'IT Support',
                aiPriority: 'high',
                aiConfidence: 0.85,
                nlpCategory: 'IT Support',
                nlpPriority: 'high',
                nlpSentiment: -2.1,
                nlpUrgency: 'high',
                nlpKeywords: [{word: 'wifi', frequency: 2}, {word: 'connection', frequency: 2}, {word: 'library', frequency: 1}],
                nlpSummary: 'WiFi connection issues in library affecting studies.',
                nlpComplexity: 'moderate',
                nlpResolutionTime: '1-2 days',
                nlpSuggestedActions: ['Contact IT Help Desk', 'Check network connection', 'Try alternative device']
            });
            console.log('Sample concern created');
        }
        
        console.log('Sample data initialization completed');
    } catch (error) {
        console.log('Sample data initialization error:', error.message);
    }
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'concerntrack-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));


app.get('/track/:trackingId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'track-concern.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

initializeSampleData();

// --- Auth ---
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name } = req.body;
        const safeEmail = (email || '').trim().toLowerCase();
        if (!safeEmail || !safeEmail.includes('@')) {
            return res.status(400).json({ error: 'Valid Google email is required' });
        }

        const displayName = (name || safeEmail.split('@')[0] || 'Student').trim();
        let user = await mySQLDatabaseService.getUserByEmail(safeEmail);
        if (!user) {
            user = {
                id: 'google_' + Math.random().toString(36).substr(2, 9),
                email: safeEmail,
                password: 'google_oauth_' + Math.random().toString(36), // Generate dummy password for Google users
                name: displayName,
                role: 'student',
                studentId: null,
                provider: 'google',
                createdAt: new Date()
            };
            await mySQLDatabaseService.createUser(user);
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.post('/api/auth/guest', (req, res) => {
    try {
        const { email, isAnonymous } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const guestUser = {
            id: 'guest_' + Math.random().toString(36).substr(2, 9),
            email,
            name: isAnonymous ? 'Anonymous User' : 'Guest User',
            role: 'guest',
            isAnonymous: isAnonymous || false,
            createdAt: new Date()
        };

        res.json({
            success: true,
            user: guestUser
        });
    } catch (error) {
        res.status(500).json({ error: 'Guest access failed' });
    }
});

// --- Concerns ---
app.post('/api/concerns', async (req, res) => {
    try {
        const { title, description, email, isAnonymous, category, priority } = req.body;

        if (!title || !description || !email) {
            return res.status(400).json({ error: 'Title, description, and email are required' });
        }

        const aiAnalysis = await categorizeConcern(title + ' ' + description);
        const priorityAnalysis = await detectPriority(title + ' ' + description);
        const nlpAnalysis = await nlpService.analyzeConcern(title, description);

        const tid = generateTrackingId();
        const concern = {
            id: tid,
            trackingId: tid,
            studentId: 'guest_' + Math.random().toString(36).substr(2, 9), // Generate guest student ID
            studentEmail: String(email).trim(),
            email: String(email).trim(),
            title,
            description,
            category: category || aiAnalysis.category,
            priority: (priority || priorityAnalysis.priority || 'medium').toLowerCase(),
            status: 'submitted',
            isAnonymous: isAnonymous || false,
            createdAt: new Date(),
            updatedAt: new Date(),
            aiCategory: aiAnalysis.category,
            aiPriority: priorityAnalysis.priority,
            aiConfidence: Math.max(aiAnalysis.confidence, priorityAnalysis.confidence),
            nlpCategory: nlpAnalysis.category.category,
            nlpPriority: nlpAnalysis.priority.priority,
            nlpSentiment: nlpAnalysis.sentiment.score,
            nlpUrgency: nlpAnalysis.urgency.level,
            nlpKeywords: nlpAnalysis.keywords,
            nlpSummary: nlpAnalysis.summary,
            nlpComplexity: nlpAnalysis.complexity.level,
            nlpResolutionTime: nlpAnalysis.estimatedResolutionTime.estimated,
            nlpSuggestedActions: nlpAnalysis.suggestedActions,
            adminResponse: null,
            respondedAt: null,
            respondedBy: null
        };

        // Save concern to database
        await mySQLDatabaseService.createConcern(concern);

        // Send email notification directly
        try {
            const { realEmailService } = require('./real-email-service');
            const htmlContent = realEmailService.generateEmailTemplate(concern, 'concernSubmitted');
            const emailResult = await realEmailService.sendEmail(
                concern.studentEmail,
                `ConcernTracker: Concern Submitted - ${concern.trackingId}`,
                htmlContent
            );
            if (emailResult.success) {
                console.log(`Email sent to ${concern.studentEmail}`);
            } else {
                console.error('Email send failed:', emailResult.error);
            }
        } catch (e) {
            console.error('Email notification error:', e.message);
        }

        // Also trigger database notification for tracking
        try {
            await databaseNotificationService.triggerConcernCreatedNotification(concern);
        } catch (e) {
            console.error('Notification trigger error:', e.message);
        }
        res.json({
            success: true,
            concern,
            message: `Concern submitted successfully! Tracking ID: ${concern.trackingId}`
        });
    } catch (error) {
        console.error('Error submitting concern:', error);
        res.status(500).json({ error: 'Failed to submit concern' });
    }
});

app.get('/api/track/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const concern = await findConcern(identifier);
        if (!concern) {
            return res.status(404).json({ error: 'Concern not found' });
        }

        if (concern.isAnonymous) {
            const response = { ...concern };
            delete response.email;
            delete response.studentId;
            return res.json(response);
        }

        res.json(concern);
    } catch (error) {
        res.status(500).json({ error: 'Failed to track concern' });
    }
});

app.get('/api/concerns/:id', async (req, res) => {
    try {
        const concern = await mySQLDatabaseService.getConcernById(req.params.id);
        if (!concern) {
            return res.status(404).json({ success: false, error: 'Concern not found' });
        }
        
        const logs = await mySQLDatabaseService.getStatusLogs(concern.id);
        
        res.json({ success: true, concern, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch concern' });
    }
});

app.put('/api/concerns/:id', async (req, res) => {
    try {
        const concern = await findConcern(req.params.id);
        if (!concern) {
            return res.status(404).json({ success: false, error: 'Concern not found' });
        }
        const { title, description, category, priority, status } = req.body;
        if (title != null) concern.title = title;
        if (description != null) concern.description = description;
        if (category != null) concern.category = category;
        if (priority != null) concern.priority = String(priority).toLowerCase();
        if (status != null) {
            const oldStatus = concern.status;
            concern.status = status;
            concern.updatedAt = new Date();
            if (status === 'resolved') {
                concern.resolvedAt = new Date();
            }
            await mySQLDatabaseService.updateConcernStatus(concern.id, status, 'admin', req.body.comment || 'Updated via admin');
            try {
                if (status === 'resolved') {
                    await databaseNotificationService.triggerConcernResolvedNotification(concern);
                } else {
                    await databaseNotificationService.triggerStatusUpdateNotification(concern, oldStatus, status, 'admin', req.body.comment || '');
                }
            } catch (e) {
                console.error('Notification trigger error:', e.message);
            }
        } else {
            concern.updatedAt = new Date();
        }

        const updatedConcern = await mySQLDatabaseService.getConcernById(concern.id);
        res.json({ success: true, concern: updatedConcern });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update concern status' });
    }
});

app.put('/api/concerns/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment, adminId } = req.body;

        const concern = await mySQLDatabaseService.getConcernById(id);
        if (!concern) {
            return res.status(404).json({ error: 'Concern not found' });
        }

        const oldStatus = concern.status;
        concern.status = status;
        concern.updatedAt = new Date();
        if (status === 'resolved') {
            concern.resolvedAt = new Date();
        }

        await mySQLDatabaseService.updateConcernStatus(concern.id, status, adminId || 'admin', comment || `Status changed to ${status}`);

        try {
            if (status === 'resolved') {
                await databaseNotificationService.triggerConcernResolvedNotification(concern);
            } else {
                await databaseNotificationService.triggerStatusUpdateNotification(concern, oldStatus, status, adminId || 'admin', comment || '');
            }
        } catch (e) {
            console.error('Notification trigger error:', e.message);
        }

        const updatedConcern = await mySQLDatabaseService.getConcernById(concern.id);
        res.json({
            success: true,
            concern: updatedConcern,
            message: 'Status updated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

app.post('/api/concerns/:id/respond', async (req, res) => {
    try {
        const concern = await findConcern(req.params.id);
        if (!concern) {
            return res.status(404).json({ success: false, error: 'Concern not found' });
        }
        const { adminResponse, respondedBy } = req.body;
        if (!adminResponse || !respondedBy) {
            return res.status(400).json({ success: false, error: 'Response and responder are required' });
        }
        
        const previousStatus = concern.status;
        
        // Update concern with admin response
        await mySQLDatabaseService.updateConcernResponse(concern.id, adminResponse, respondedBy);
        await mySQLDatabaseService.updateConcernStatus(concern.id, 'responded', respondedBy, adminResponse);
        
        try {
            await databaseNotificationService.triggerAdminResponseNotification(concern, adminResponse, respondedBy);
        } catch (e) {
            console.error('Notification trigger error:', e.message);
        }
        
        const updatedConcern = await mySQLDatabaseService.getConcernById(concern.id);
        res.json({ success: true, concern: updatedConcern, message: 'Response recorded and notification sent' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send response' });
    }
});

app.delete('/api/concerns/:id', async (req, res) => {
    try {
        const concern = await mySQLDatabaseService.getConcernById(req.params.id);
        if (!concern) {
            return res.status(404).json({ success: false, error: 'Concern not found' });
        }
        // Note: Actual deletion would require a delete method in database service
        res.json({ success: true, message: 'Concern deletion request received' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete concern' });
    }
});

// --- Admin ---
app.get('/api/admin/concerns', async (req, res) => {
    try {
        const concerns = await mySQLDatabaseService.getAllConcerns();
        const sorted = concerns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json({ success: true, data: { concerns: sorted } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch concerns' });
    }
});

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = await mySQLDatabaseService.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const concerns = await mySQLDatabaseService.getAllConcerns();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const submittedToday = concerns.filter(c => new Date(c.created_at) >= startOfDay).length;
        const resolved = concerns.filter(c => c.status === 'resolved').length;
        const highPriority = concerns.filter(c => c.priority === 'high').length;

        const categories = {};
        concerns.forEach(c => {
            categories[c.category] = (categories[c.category] || 0) + 1;
        });
        let busiestCategory = '—';
        let maxC = 0;
        Object.entries(categories).forEach(([cat, n]) => {
            if (n > maxC) {
                maxC = n;
                busiestCategory = cat;
            }
        });

        const total = concerns.length;
        const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

        const recent = [...concerns]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                totalConcerns: total,
                submittedToday,
                resolved,
                highPriority,
                recent,
                trends: {
                    avgResolutionTime: '24',
                    resolutionRate,
                    busiestCategory,
                    daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    weekly: [2, 3, 4, 3, 5, 4, 6]
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
});

// --- AI ---
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        const response = await generateResponse(message, context);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ error: 'AI service unavailable' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await mySQLDatabaseService.getUserByEmail(email);

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, async () => {
    const base = process.env.PUBLIC_URL || process.env.BASE_URL || `http://localhost:${PORT}`;
    console.log(`ConcernTracker PRO - ${base}`);
    
    try {
        // Initialize database and notification service
        await mySQLDatabaseService.initialize();
        try {
            await databaseNotificationService.initialize();
        } catch (notifError) {
            console.warn('Notification service initialization failed:', notifError.message);
        }
        await initializeSampleData();
        
        console.log('Database and notification system initialized');
        console.log('Scheduled jobs running for automatic notifications');
    } catch (error) {
        console.error('Error initializing services:', error);
    }
});

module.exports = app;
