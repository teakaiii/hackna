// Real Email Service - Actually sends emails to Gmail
// Uses Ethereal for testing and can be configured for real delivery

const nodemailer = require('nodemailer');

class RealEmailService {
    constructor() {
        this.baseUrl = process.env.PUBLIC_URL || process.env.BASE_URL || `http://localhost:3000`;
        
        // Check if we should use Ethereal (testing) or real email
        this.useEthereal = false; // Force Gmail only
        this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
        
        this.transporter = null;
        this.testAccount = null;
    }

    // Initialize the email service
    async initialize() {
        try {
            if (this.useEthereal) {
                // Use Ethereal for testing (shows emails in browser)
                this.testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: this.testAccount.user,
                        pass: this.testAccount.pass
                    }
                });
                console.log(`Ethereal email test account: ${this.testAccount.user}`);
                console.log(`Preview URL: https://ethereal.email/messages`);
            } else {
                // Use real email service (Gmail, etc.)
                if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                    console.warn('Email credentials not configured. Email notifications will be logged but not sent.');
                    this.isConfigured = false;
                    return;
                }
                
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                console.log(`Real email service configured for: ${process.env.EMAIL_USER}`);
            }
            
            console.log('Email service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            throw error;
        }
    }

    // Generate professional HTML email template
    generateEmailTemplate(concern, type, additionalData = {}) {
        const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConcernTracker - ${type}</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .tracking-id { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
        .priority { padding: 5px 10px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
        .priority.high { background: #ef4444; }
        .priority.medium { background: #f59e0b; }
        .priority.low { background: #10b981; }
        .status { padding: 5px 10px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; }
        .status.submitted { background: #3b82f6; }
        .status.under_review { background: #8b5cf6; }
        .status.in_progress { background: #f59e0b; }
        .status.resolved { background: #10b981; }
        .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        .real-email-badge { background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ConcernTracker PRO</h1>
            <p>${this.getEmailTitle(type)} <span class="real-email-badge">Real Email</span></p>
        </div>
        <div class="content">
            ${this.getEmailContent(concern, type, additionalData)}
            <div class="footer">
                <p>This is an automated message from ConcernTracker PRO</p>
                <p>Questions? Contact our support team</p>
            </div>
        </div>
    </div>
</body>
</html>`;
        
        return baseTemplate;
    }

    getEmailTitle(type) {
        const titles = {
            concernSubmitted: 'Concern Submitted Successfully!',
            statusUpdated: 'Concern Status Updated',
            concernResolved: 'Concern Resolved',
            adminReply: 'Admin Response to Your Concern',
            deadlineReminder: 'Deadline Reminder'
        };
        return titles[type] || 'ConcernTracker Notification';
    }

    getEmailContent(concern, type, additionalData) {
        switch(type) {
            case 'concernSubmitted':
                return `
                    <div class="tracking-id">
                        <strong>Tracking ID:</strong> ${concern.trackingId}
                    </div>
                    <div class="details">
                        <h3>Concern Details:</h3>
                        <p><strong>Title:</strong> ${concern.title}</p>
                        <p><strong>Category:</strong> ${concern.category}</p>
                        <p><strong>Priority:</strong> <span class="priority ${concern.priority}">${concern.priority}</span></p>
                        <p><strong>Status:</strong> <span class="status ${concern.status}">${concern.status}</span></p>
                        <p><strong>Submitted:</strong> ${new Date(concern.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="details">
                        <h3>Description:</h3>
                        <p>${concern.description}</p>
                    </div>
                    <p>You will receive notifications as your concern progresses through our system.</p>
                    <a href="${this.baseUrl}" class="btn">Track Your Concern</a>`;
                
            case 'statusUpdated':
                return `
                    <div class="tracking-id">
                        <strong>Tracking ID:</strong> ${concern.trackingId}
                    </div>
                    <div class="details">
                        <h3>Status Update:</h3>
                        <p><strong>Previous Status:</strong> ${additionalData.oldStatus}</p>
                        <p><strong>New Status:</strong> <span class="status ${concern.status}">${concern.status}</span></p>
                        <p><strong>Updated:</strong> ${new Date(additionalData.timestamp).toLocaleDateString()}</p>
                        ${additionalData.comment ? `<p><strong>Comment:</strong> ${additionalData.comment}</p>` : ''}
                    </div>
                    <div class="details">
                        <h3>Concern Details:</h3>
                        <p><strong>Title:</strong> ${concern.title}</p>
                        <p><strong>Category:</strong> ${concern.category}</p>
                    </div>
                    <a href="${this.baseUrl}" class="btn">Track Your Concern</a>`;
                
            case 'concernResolved':
                return `
                    <div class="tracking-id">
                        <strong>Tracking ID:</strong> ${concern.trackingId}
                    </div>
                    <div class="details">
                        <h3>Resolution Details:</h3>
                        <p><strong>Status:</strong> <span class="status resolved">Resolved</span></p>
                        <p><strong>Resolved:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Submitted:</strong> ${new Date(concern.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="details">
                        <h3>Concern Details:</h3>
                        <p><strong>Title:</strong> ${concern.title}</p>
                        <p><strong>Category:</strong> ${concern.category}</p>
                        <p><strong>Priority:</strong> <span class="priority ${concern.priority}">${concern.priority}</span></p>
                    </div>
                    <p>Great news! Your concern has been successfully resolved by our team.</p>
                    <p>We value your feedback! Please let us know how we handled your concern.</p>
                    <a href="${this.baseUrl}" class="btn">View Your Concern</a>`;
                
            case 'adminReply':
                return `
                    <div class="tracking-id">
                        <strong>Tracking ID:</strong> ${concern.trackingId}
                    </div>
                    <div class="details">
                        <h3>Admin Response:</h3>
                        <p>${additionalData.message}</p>
                        <p><strong>Responded by:</strong> ${additionalData.adminEmail}</p>
                        <p><strong>Response Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="details">
                        <h3>Your Concern:</h3>
                        <p><strong>Title:</strong> ${concern.title}</p>
                        <p><strong>Category:</strong> ${concern.category}</p>
                    </div>
                    <a href="${this.baseUrl}" class="btn">View Your Concern</a>`;
                
            case 'deadlineReminder':
                return `
                    <div class="tracking-id">
                        <strong>Tracking ID:</strong> ${concern.trackingId}
                    </div>
                    <div class="details">
                        <h3>Deadline Reminder:</h3>
                        <p><strong>Days Remaining:</strong> ${additionalData.daysRemaining}</p>
                        <p><strong>Expected Resolution:</strong> ${additionalData.deadline}</p>
                        <p><strong>Current Status:</strong> <span class="status ${concern.status}">${concern.status}</span></p>
                    </div>
                    <div class="details">
                        <h3>Concern Details:</h3>
                        <p><strong>Title:</strong> ${concern.title}</p>
                        <p><strong>Category:</strong> ${concern.category}</p>
                        <p><strong>Priority:</strong> <span class="priority ${concern.priority}">${concern.priority}</span></p>
                    </div>
                    <p>This is a friendly reminder about your concern. Please check for any updates.</p>
                    <a href="${this.baseUrl}" class="btn">Track Your Concern</a>`;
                
            default:
                return `<p>Email notification for concern ${concern.trackingId}</p>`;
        }
    }

    // Send real email
    async sendEmail(to, subject, htmlContent) {
        if (!this.transporter) {
            await this.initialize();
        }
        
        if (!this.transporter) {
            console.warn('Email transporter not available. Logging email instead:');
            console.log(`To: ${to}, Subject: ${subject}`);
            return { success: false, error: 'Email transporter not available' };
        }

        try {
            const mailOptions = {
                from: `"ConcernTracker PRO" <${process.env.EMAIL_USER}>`,
                to: to,
                subject: subject,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log(`Email sent successfully to ${to}: ${result.messageId}`);
            
            if (this.useEthereal) {
                console.log(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
                return {
                    success: true,
                    messageId: result.messageId,
                    previewUrl: nodemailer.getTestMessageUrl(result),
                    testMode: true,
                    realInbox: false
                };
            } else {
                return {
                    success: true,
                    messageId: result.messageId,
                    realInbox: true,
                    testMode: false
                };
            }
        } catch (error) {
            console.error('Email send failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Notification trigger system
    async triggerNotification(concern, type, additionalData = {}) {
        const userEmail = concern.studentEmail || concern.email;
        
        if (!userEmail) {
            return {
                success: false,
                error: 'No email address found for user'
            };
        }

        const subject = `ConcernTracker: ${this.getSubject(type)} - ${concern.trackingId}`;
        const html = this.generateEmailTemplate(concern, type, additionalData);
        
        return this.sendEmail(userEmail, subject, html);
    }

    getSubject(type) {
        const subjects = {
            concernSubmitted: 'Concern Submitted',
            statusUpdated: 'Status Update',
            concernResolved: 'Concern Resolved',
            adminReply: 'Admin Response',
            deadlineReminder: 'Deadline Reminder'
        };
        return subjects[type] || 'Notification';
    }

    // Notification methods
    async sendConcernSubmittedNotification(concern) {
        return this.triggerNotification(concern, 'concernSubmitted');
    }

    async sendStatusUpdateNotification(concern, updateInfo) {
        return this.triggerNotification(concern, 'statusUpdated', updateInfo);
    }

    async sendAdminReplyNotification(concern, message, adminEmail) {
        return this.triggerNotification(concern, 'adminReply', { message, adminEmail });
    }

    async sendConcernResolvedNotification(concern) {
        return this.triggerNotification(concern, 'concernResolved');
    }

    async sendDeadlineReminderNotification(concern, daysRemaining, deadline) {
        return this.triggerNotification(concern, 'deadlineReminder', { daysRemaining, deadline });
    }

    // Check if service is ready
    isReady() {
        return this.isConfigured;
    }

    // Get configuration status
    getConfigStatus() {
        return {
            configured: this.isConfigured,
            testMode: this.useEthereal,
            emailUser: !this.useEthereal ? process.env.EMAIL_USER : null,
            type: 'real_email'
        };
    }
}

const realEmailService = new RealEmailService();

module.exports = {
    realEmailService,
    RealEmailService
};
