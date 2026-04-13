// Database-Driven Notification Service with Scheduled Jobs
const cron = require('node-cron');
const { mySQLDatabaseService } = require('./mysql-database-service');
const { realEmailService } = require('./real-email-service');

class DatabaseNotificationService {
    constructor() {
        this.isRunning = false;
        this.jobs = new Map();
        this.baseUrl = process.env.PUBLIC_URL || process.env.BASE_URL || `http://localhost:3000`;
    }

    // Initialize the notification service
    async initialize() {
        try {
            await mySQLDatabaseService.initialize();
            try {
                await realEmailService.initialize();
            } catch (emailError) {
                console.warn('Email service initialization failed:', emailError.message);
                console.warn('Email notifications will be logged but not sent');
            }
            console.log('Database notification service initialized');
            
            // Start scheduled jobs
            this.startScheduledJobs();
            
            this.isRunning = true;
            console.log('Database notification service started');
        } catch (error) {
            console.error('Error initializing notification service:', error);
            throw error;
        }
    }

    // Start scheduled jobs
    startScheduledJobs() {
        // Check for pending notifications every minute
        const notificationJob = cron.schedule('* * * * *', async () => {
            await this.processPendingNotifications();
        }, {
            scheduled: false
        });
        
        notificationJob.start();
        this.jobs.set('notifications', notificationJob);
        
        // Schedule deadline reminders every hour
        const deadlineJob = cron.schedule('0 * * * *', async () => {
            await this.scheduleDeadlineReminders();
        }, {
            scheduled: false
        });
        
        deadlineJob.start();
        this.jobs.set('deadlines', deadlineJob);
        
        // Clean up old records daily at midnight
        const cleanupJob = cron.schedule('0 0 * * *', async () => {
            await this.cleanupOldRecords();
        }, {
            scheduled: false
        });
        
        cleanupJob.start();
        this.jobs.set('cleanup', cleanupJob);
        
        console.log('Scheduled jobs started');
    }

    // Process pending email notifications
    async processPendingNotifications() {
        try {
            const notifications = await mySQLDatabaseService.getPendingEmailNotifications();
            
            for (const notification of notifications) {
                await this.sendEmailNotification(notification);
            }
        } catch (error) {
            console.error('Error processing pending notifications:', error);
        }
    }

    // Send email notification
    async sendEmailNotification(notification) {
        try {
            // Use real email service - handle both camelCase and snake_case field names
            const recipientEmail = notification.recipientEmail || notification.recipient_email;
            const subject = notification.subject;
            const body = notification.body;
            
            if (!recipientEmail) {
                console.error('No recipient email found for notification:', notification.id);
                await mySQLDatabaseService.markEmailNotificationFailed(notification.id, 'No recipient email');
                return;
            }
            
            const result = await realEmailService.sendEmail(
                recipientEmail,
                subject,
                body
            );
            
            if (result.success) {
                await mySQLDatabaseService.markEmailNotificationSent(notification.id);
                console.log(`Email notification sent: ${notification.id}`);
                
                if (result.previewUrl) {
                    console.log(`Preview URL: ${result.previewUrl}`);
                }
            } else {
                await mySQLDatabaseService.markEmailNotificationFailed(notification.id, result.error);
                console.error(`Email notification failed: ${notification.id} - ${result.error}`);
            }
        } catch (error) {
            await mySQLDatabaseService.markEmailNotificationFailed(notification.id, error.message);
            console.error(`Error sending email notification ${notification.id}:`, error);
        }
    }

    // Trigger notification when concern is created
    async triggerConcernCreatedNotification(concern) {
        const subject = `ConcernTracker: Concern Submitted - ${concern.trackingId}`;
        const body = this.generateConcernSubmittedEmail(concern);
        
        await mySQLDatabaseService.createEmailNotification(
            concern.id,
            'concern_submitted',
            concern.studentEmail,
            subject,
            body
        );
        
        // Schedule deadline reminders
        await this.scheduleConcernDeadlineReminders(concern);
        
        console.log(`Concern created notification triggered: ${concern.trackingId}`);
    }

    // Trigger notification when concern status is updated
    async triggerStatusUpdateNotification(concern, oldStatus, newStatus, changedBy, comment = null) {
        const subject = `ConcernTracker: Status Update - ${concern.trackingId}`;
        const body = this.generateStatusUpdateEmail(concern, oldStatus, newStatus, changedBy, comment);
        
        await mySQLDatabaseService.createEmailNotification(
            concern.id,
            'status_updated',
            concern.studentEmail,
            subject,
            body
        );
        
        console.log(`Status update notification triggered: ${concern.trackingId}`);
    }

    // Trigger notification when admin responds
    async triggerAdminResponseNotification(concern, adminResponse, respondedBy) {
        const subject = `ConcernTracker: Admin Response - ${concern.trackingId}`;
        const body = this.generateAdminResponseEmail(concern, adminResponse, respondedBy);
        
        await mySQLDatabaseService.createEmailNotification(
            concern.id,
            'admin_response',
            concern.studentEmail,
            subject,
            body
        );
        
        console.log(`Admin response notification triggered: ${concern.trackingId}`);
    }

    // Trigger notification when concern is resolved
    async triggerConcernResolvedNotification(concern) {
        const subject = `ConcernTracker: Concern Resolved - ${concern.trackingId}`;
        const body = this.generateConcernResolvedEmail(concern);
        
        await mySQLDatabaseService.createEmailNotification(
            concern.id,
            'concern_resolved',
            concern.studentEmail,
            subject,
            body
        );
        
        console.log(`Concern resolved notification triggered: ${concern.trackingId}`);
    }

    // Schedule deadline reminders for a concern
    async scheduleConcernDeadlineReminders(concern) {
        const createdAt = new Date(concern.createdAt);
        
        // Schedule reminders at 3 days, 7 days, and 14 days
        const reminderDays = [3, 7, 14];
        
        for (const days of reminderDays) {
            const reminderDate = new Date(createdAt);
            reminderDate.setDate(reminderDate.getDate() + days);
            
            await mySQLDatabaseService.scheduleNotification(
                concern.id,
                'deadline_reminder',
                reminderDate.toISOString()
            );
        }
    }

    // Schedule deadline reminders for all concerns
    async scheduleDeadlineReminders() {
        try {
            const scheduledNotifications = await mySQLDatabaseService.getPendingScheduledNotifications();
            
            for (const notification of scheduledNotifications) {
                await this.processScheduledNotification(notification);
            }
        } catch (error) {
            console.error('Error scheduling deadline reminders:', error);
        }
    }

    // Process scheduled notification
    async processScheduledNotification(notification) {
        try {
            const concern = await mySQLDatabaseService.getConcernById(notification.concernId);
            
            if (!concern || concern.status === 'resolved') {
                // Skip if concern doesn't exist or is resolved
                await mySQLDatabaseService.markScheduleProcessed(notification.id);
                return;
            }
            
            const subject = `ConcernTracker: Deadline Reminder - ${concern.trackingId}`;
            const body = this.generateDeadlineReminderEmail(concern, notification.type);
            
            await mySQLDatabaseService.createEmailNotification(
                concern.id,
                'deadline_reminder',
                concern.studentEmail,
                subject,
                body
            );
            
            await mySQLDatabaseService.markScheduleProcessed(notification.id);
            console.log(`Deadline reminder processed: ${concern.trackingId}`);
            
        } catch (error) {
            await mySQLDatabaseService.markScheduleFailed(notification.id, error.message);
            console.error(`Error processing scheduled notification ${notification.id}:`, error);
        }
    }

    // Generate email content
    generateConcernSubmittedEmail(concern) {
        return `Dear Student,

Your concern has been successfully submitted to the ConcernTracker system.

TRACKING DETAILS:
================
Tracking ID: ${concern.trackingId}
Title: ${concern.title}
Category: ${concern.category}
Priority: ${concern.priority}
Status: ${concern.status}
Submitted: ${new Date(concern.createdAt).toLocaleDateString()}

DESCRIPTION:
===========
${concern.description}

WHAT HAPPENS NEXT:
==================
1. Your concern will be reviewed by our admin team
2. You will receive updates as the status changes
3. You can track your concern using the Tracking ID above

TRACK YOUR CONCERN:
==================
Visit: ${this.baseUrl}
Enter Tracking ID: ${concern.trackingId}

This is an automated message from ConcernTracker PRO.
Please keep this email for your records.

Best regards,
ConcernTracker Team`;
    }

    generateStatusUpdateEmail(concern, oldStatus, newStatus, changedBy, comment) {
        return `Dear Student,

Your concern status has been updated.

TRACKING DETAILS:
================
Tracking ID: ${concern.trackingId}
Title: ${concern.title}
Category: ${concern.category}

STATUS CHANGE:
=============
Previous Status: ${oldStatus}
New Status: ${newStatus}
Updated: ${new Date().toLocaleDateString()}
${comment ? `Comment: ${comment}` : ''}

ORIGINAL CONCERN:
================
${concern.description}

TRACK YOUR CONCERN:
==================
Visit: ${this.baseUrl}
Enter Tracking ID: ${concern.trackingId}

This is an automated message from ConcernTracker PRO.

Best regards,
ConcernTracker Team`;
    }

    generateAdminResponseEmail(concern, adminResponse, respondedBy) {
        return `Dear Student,

An administrator has responded to your concern.

TRACKING DETAILS:
================
Tracking ID: ${concern.trackingId}
Title: ${concern.title}
Category: ${concern.category}

ADMIN RESPONSE:
===============
${adminResponse}
Responded by: ${respondedBy}
Response Date: ${new Date().toLocaleDateString()}

ORIGINAL CONCERN:
================
${concern.description}

TRACK YOUR CONCERN:
==================
Visit: ${this.baseUrl}
Enter Tracking ID: ${concern.trackingId}

This is an automated message from ConcernTracker PRO.

Best regards,
ConcernTracker Team`;
    }

    generateConcernResolvedEmail(concern) {
        return `Dear Student,

Great news! Your concern has been resolved.

TRACKING DETAILS:
================
Tracking ID: ${concern.trackingId}
Title: ${concern.title}
Category: ${concern.category}
Priority: ${concern.priority}
Status: Resolved
Submitted: ${new Date(concern.createdAt).toLocaleDateString()}
Resolved: ${new Date().toLocaleDateString()}

ORIGINAL CONCERN:
================
${concern.description}

RESOLUTION SUMMARY:
==================
Your concern has been successfully addressed by our team.

FEEDBACK:
========
We value your feedback! Please let us know how we handled your concern.

TRACK YOUR CONCERN:
==================
Visit: ${this.baseUrl}
Enter Tracking ID: ${concern.trackingId}

This is an automated message from ConcernTracker PRO.

Best regards,
ConcernTracker Team`;
    }

    generateDeadlineReminderEmail(concern, type) {
        const daysRemaining = this.calculateDaysRemaining(concern);
        
        return `Dear Student,

This is a friendly reminder about your concern.

TRACKING DETAILS:
================
Tracking ID: ${concern.trackingId}
Title: ${concern.title}
Category: ${concern.category}
Priority: ${concern.priority}
Status: ${concern.status}

DEADLINE INFORMATION:
====================
Days Since Submission: ${daysRemaining.daysSinceCreation}
Current Status: ${concern.status}

ORIGINAL CONCERN:
================
${concern.description}

Please check for any updates on your concern.

TRACK YOUR CONCERN:
==================
Visit: ${this.baseUrl}
Enter Tracking ID: ${concern.trackingId}

This is an automated message from ConcernTracker PRO.

Best regards,
ConcernTracker Team`;
    }

    calculateDaysRemaining(concern) {
        const createdAt = new Date(concern.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        
        return {
            daysSinceCreation,
            daysRemaining: Math.max(0, 21 - daysSinceCreation) // 3 weeks total
        };
    }

    // Clean up old records
    async cleanupOldRecords() {
        try {
            // Clean up notifications older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            await databaseService.runQuery(
                'DELETE FROM email_notifications WHERE createdAt < ?',
                [thirtyDaysAgo.toISOString()]
            );
            
            await databaseService.runQuery(
                'DELETE FROM notification_schedules WHERE createdAt < ?',
                [thirtyDaysAgo.toISOString()]
            );
            
            console.log('Old records cleaned up');
        } catch (error) {
            console.error('Error cleaning up old records:', error);
        }
    }

    // Get notification statistics
    async getNotificationStats() {
        try {
            const stats = await databaseService.getStats();
            return {
                ...stats,
                isRunning: this.isRunning,
                activeJobs: this.jobs.size
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return { error: error.message };
        }
    }

    // Stop the notification service
    stop() {
        // Stop all scheduled jobs
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });
        
        this.jobs.clear();
        this.isRunning = false;
        
        console.log('Database notification service stopped');
    }
}

const databaseNotificationService = new DatabaseNotificationService();

module.exports = {
    databaseNotificationService,
    DatabaseNotificationService
};
