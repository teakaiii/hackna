// MySQL Database Service - XAMPP MySQL Integration
const mysql = require('mysql2/promise');

class MySQLDatabaseService {
    constructor() {
        this.connection = null;
        this.dbName = process.env.DB_NAME || 'concerntracker';
        this.dbHost = process.env.DB_HOST || 'localhost';
        this.dbPort = process.env.DB_PORT || 3306;
        this.dbUser = process.env.DB_USER || 'root';
        this.dbPassword = process.env.DB_PASSWORD || '';
    }

    // Initialize database connection
    async initialize() {
        try {
            // First connect without database to drop and recreate database
            const tempConnection = await mysql.createConnection({
                host: this.dbHost,
                port: this.dbPort,
                user: this.dbUser,
                password: this.dbPassword
            });

            console.log('Connected to MySQL server');

            // Drop and recreate database to remove foreign key constraints
            await tempConnection.execute(`DROP DATABASE IF EXISTS \`${this.dbName}\``);
            await tempConnection.execute(`CREATE DATABASE \`${this.dbName}\``);
            console.log(`Database '${this.dbName}' recreated successfully`);
            
            // Close temporary connection
            await tempConnection.end();

            // Connect directly to the database
            this.connection = await mysql.createConnection({
                host: this.dbHost,
                port: this.dbPort,
                user: this.dbUser,
                password: this.dbPassword,
                database: this.dbName
            });

            console.log(`Connected to database: ${this.dbName}`);

            // Create tables
            await this.createTables();
            
            console.log('MySQL database service initialized successfully');
        } catch (error) {
            console.error('Error initializing MySQL database:', error);
            throw error;
        }
    }

    // Create database tables
    async createTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'student',
                student_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // Concerns table
            `CREATE TABLE IF NOT EXISTS concerns (
                id VARCHAR(255) PRIMARY KEY,
                tracking_id VARCHAR(255) UNIQUE NOT NULL,
                student_id VARCHAR(255) NOT NULL,
                student_email VARCHAR(255) NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                status VARCHAR(50) NOT NULL DEFAULT 'submitted',
                is_anonymous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                admin_response TEXT NULL,
                responded_by VARCHAR(255) NULL,
                responded_at TIMESTAMP NULL,
                ai_category VARCHAR(100) NULL,
                ai_priority VARCHAR(20) NULL,
                ai_confidence DECIMAL(3,2) NULL,
                nlp_category VARCHAR(100) NULL,
                nlp_priority VARCHAR(20) NULL,
                nlp_sentiment DECIMAL(4,2) NULL,
                nlp_urgency VARCHAR(20) NULL,
                nlp_keywords JSON NULL,
                nlp_summary TEXT NULL,
                nlp_complexity VARCHAR(20) NULL,
                nlp_resolution_time VARCHAR(50) NULL,
                nlp_suggested_actions JSON NULL,
                INDEX idx_tracking_id (tracking_id),
                INDEX idx_student_email (student_email),
                INDEX idx_status (status),
                INDEX idx_category (category),
                INDEX idx_priority (priority),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // Status logs table
            `CREATE TABLE IF NOT EXISTS status_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                concern_id VARCHAR(255) NOT NULL,
                old_status VARCHAR(50) NULL,
                new_status VARCHAR(50) NOT NULL,
                changed_by VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                comment TEXT NULL,
                INDEX idx_concern_id (concern_id),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // Email notifications table
            `CREATE TABLE IF NOT EXISTS email_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                concern_id VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                recipient_email VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                body TEXT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                sent_at TIMESTAMP NULL,
                error TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_concern_id (concern_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // Notification schedules table
            `CREATE TABLE IF NOT EXISTS notification_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                concern_id VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                scheduled_for TIMESTAMP NOT NULL,
                processed BOOLEAN DEFAULT FALSE,
                processed_at TIMESTAMP NULL,
                error TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_concern_id (concern_id),
                INDEX idx_scheduled_for (scheduled_for),
                INDEX idx_processed (processed)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        ];

        for (const table of tables) {
            try {
                await this.connection.execute(table);
                console.log('Table created successfully');
            } catch (error) {
                console.error('Error creating table:', error);
                throw error;
            }
        }
        
        console.log('MySQL tables created successfully');
    }

    // Execute a query
    async execute(sql, params = []) {
        try {
            const [rows] = await this.connection.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    // User operations
    async createUser(user) {
        const sql = `INSERT INTO users (id, email, password, name, role, student_id) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            user.id, 
            user.email, 
            user.password, 
            user.name, 
            user.role, 
            user.studentId || null
        ];
        return this.execute(sql, params);
    }

    async getUserByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await this.execute(sql, [email]);
        return results[0] || null;
    }

    async getUserById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const results = await this.execute(sql, [id]);
        return results[0] || null;
    }

    // Concern operations
    async createConcern(concern) {
        const sql = `INSERT INTO concerns (
            id, tracking_id, student_id, student_email, title, description, 
            category, priority, status, is_anonymous, ai_category, ai_priority, 
            ai_confidence, nlp_category, nlp_priority, nlp_sentiment, nlp_urgency,
            nlp_keywords, nlp_summary, nlp_complexity, nlp_resolution_time, nlp_suggested_actions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            concern.id, concern.trackingId, concern.studentId, concern.studentEmail,
            concern.title, concern.description, concern.category, concern.priority,
            concern.status, concern.isAnonymous, concern.aiCategory, concern.aiPriority,
            concern.aiConfidence, concern.nlpCategory, concern.nlpPriority, concern.nlpSentiment,
            concern.nlpUrgency, JSON.stringify(concern.nlpKeywords), concern.nlpSummary,
            concern.nlpComplexity, concern.nlpResolutionTime, JSON.stringify(concern.nlpSuggestedActions)
        ];
        
        return this.execute(sql, params);
    }

    async getConcernById(id) {
        const sql = 'SELECT * FROM concerns WHERE id = ?';
        const results = await this.execute(sql, [id]);
        if (results[0]) {
            const concern = results[0];
            // Ensure field names match what the notification service expects
            return {
                ...concern,
                studentEmail: concern.student_email,
                trackingId: concern.tracking_id,
                studentId: concern.student_id,
                isAnonymous: concern.is_anonymous,
                createdAt: concern.created_at,
                updatedAt: concern.updated_at,
                aiCategory: concern.ai_category,
                aiPriority: concern.ai_priority,
                aiConfidence: concern.ai_confidence,
                nlpCategory: concern.nlp_category,
                nlpPriority: concern.nlp_priority,
                nlpSentiment: concern.nlp_sentiment,
                nlpUrgency: concern.nlp_urgency,
                nlpKeywords: concern.nlp_keywords ? JSON.parse(concern.nlp_keywords) : null,
                nlpSummary: concern.nlp_summary,
                nlpComplexity: concern.nlp_complexity,
                nlpResolutionTime: concern.nlp_resolution_time,
                nlpSuggestedActions: concern.nlp_suggested_actions ? JSON.parse(concern.nlp_suggested_actions) : null
            };
        }
        return null;
    }

    async getConcernByTrackingId(trackingId) {
        const sql = 'SELECT * FROM concerns WHERE tracking_id = ?';
        const results = await this.execute(sql, [trackingId]);
        return results[0] || null;
    }

    async getAllConcerns() {
        const sql = 'SELECT * FROM concerns ORDER BY created_at DESC';
        return this.execute(sql);
    }

    async updateConcernStatus(id, status, changedBy, comment = null) {
        const sql = `UPDATE concerns SET status = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`;
        await this.execute(sql, [status, id]);
        
        // Log status change
        const logSql = `INSERT INTO status_logs (concern_id, old_status, new_status, changed_by, comment)
                        SELECT ?, status, ?, ?, ? FROM concerns WHERE id = ?`;
        return this.execute(logSql, [id, status, changedBy, comment, id]);
    }

    async updateConcernResponse(id, adminResponse, respondedBy) {
        const sql = `UPDATE concerns SET admin_response = ?, responded_by = ?, responded_at = CURRENT_TIMESTAMP
                    WHERE id = ?`;
        return this.execute(sql, [adminResponse, respondedBy, id]);
    }

    // Status log operations
    async getStatusLogs(concernId) {
        const sql = 'SELECT * FROM status_logs WHERE concern_id = ? ORDER BY timestamp DESC';
        return this.execute(sql, [concernId]);
    }

    // Email notification operations
    async createEmailNotification(concernId, type, recipientEmail, subject, body) {
        const sql = `INSERT INTO email_notifications (concern_id, type, recipient_email, subject, body)
                    VALUES (?, ?, ?, ?, ?)`;
        return this.execute(sql, [concernId, type, recipientEmail, subject, body]);
    }

    async getPendingEmailNotifications() {
        const sql = 'SELECT * FROM email_notifications WHERE status = "pending" ORDER BY created_at';
        return this.execute(sql);
    }

    async markEmailNotificationSent(id) {
        const sql = 'UPDATE email_notifications SET status = "sent", sent_at = CURRENT_TIMESTAMP WHERE id = ?';
        return this.execute(sql, [id]);
    }

    async markEmailNotificationFailed(id, error) {
        const sql = 'UPDATE email_notifications SET status = "failed", error = ? WHERE id = ?';
        return this.execute(sql, [error, id]);
    }

    // Notification schedule operations
    async scheduleNotification(concernId, type, scheduledFor) {
        const sql = `INSERT INTO notification_schedules (concern_id, type, scheduled_for)
                    VALUES (?, ?, ?)`;
        return this.execute(sql, [concernId, type, scheduledFor]);
    }

    async getPendingScheduledNotifications() {
        const sql = `SELECT * FROM notification_schedules 
                    WHERE processed = FALSE AND scheduled_for <= CURRENT_TIMESTAMP 
                    ORDER BY scheduled_for`;
        return this.execute(sql);
    }

    async markScheduleProcessed(id) {
        const sql = 'UPDATE notification_schedules SET processed = TRUE, processed_at = CURRENT_TIMESTAMP WHERE id = ?';
        return this.execute(sql, [id]);
    }

    async markScheduleFailed(id, error) {
        const sql = 'UPDATE notification_schedules SET processed = TRUE, error = ? WHERE id = ?';
        return this.execute(sql, [error, id]);
    }

    // Database statistics
    async getStats() {
        const stats = {};
        
        const totalConcerns = await this.execute('SELECT COUNT(*) as count FROM concerns');
        stats.totalConcerns = totalConcerns[0].count;
        
        const byStatus = await this.execute('SELECT status, COUNT(*) as count FROM concerns GROUP BY status');
        stats.byStatus = byStatus;
        
        const byPriority = await this.execute('SELECT priority, COUNT(*) as count FROM concerns GROUP BY priority');
        stats.byPriority = byPriority;
        
        const pendingNotifications = await this.execute('SELECT COUNT(*) as count FROM email_notifications WHERE status = "pending"');
        stats.pendingNotifications = pendingNotifications[0].count;
        
        return stats;
    }

    // Close database connection
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('MySQL connection closed');
        }
    }
}

const mySQLDatabaseService = new MySQLDatabaseService();

module.exports = {
    mySQLDatabaseService,
    MySQLDatabaseService
};
