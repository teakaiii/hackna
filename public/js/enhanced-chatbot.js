// Enhanced AI Chatbot with NLP Integration
class ConcernTrackChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.conversationContext = [];
        this.userName = 'Student';
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.attachEventListeners();
        this.loadUserData();
        
        // Show welcome message after delay
        setTimeout(() => {
            this.showWelcomeNotification();
        }, 2000);
    }

    loadUserData() {
        // Try to get user name from localStorage or context
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (userData.name) {
            this.userName = userData.name.split(' ')[0];
        }
    }

    createChatWidget() {
        // Check if widget already exists
        if (document.getElementById('concernTrackChatbot')) return;

        const widgetHTML = `
            <div id="concernTrackChatbot" class="chat-widget">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="chat-title">
                            <h3>AI Assistant <span class="status-dot"></span></h3>
                            <p>Always here to help you</p>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-header-btn" id="minimizeChat" title="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="chat-header-btn" id="closeChat" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <h3><i class="fas fa-sparkles"></i> Hello ${this.userName}!</h3>
                        <p>I'm your AI-powered assistant. How can I help you today?</p>
                        <div class="welcome-features">
                            <div class="welcome-feature">
                                <i class="fas fa-lightbulb"></i>
                                <span>Smart Suggestions</span>
                            </div>
                            <div class="welcome-feature">
                                <i class="fas fa-bolt"></i>
                                <span>Instant Help</span>
                            </div>
                            <div class="welcome-feature">
                                <i class="fas fa-brain"></i>
                                <span>NLP Powered</span>
                            </div>
                            <div class="welcome-feature">
                                <i class="fas fa-file-alt"></i>
                                <span>Submit Concerns</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <div class="chat-input-wrapper">
                        <input type="text" 
                               id="chatInput" 
                               class="chat-input" 
                               placeholder="Ask me anything..."
                               autocomplete="off">
                        <div class="input-actions">
                            <button class="input-action-btn" id="emojiBtn" title="Add emoji">
                                <i class="far fa-smile"></i>
                            </button>
                        </div>
                    </div>
                    <button class="send-btn" id="sendBtn" title="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <button class="chat-float-btn" id="chatFloatBtn" title="Open chat">
                <i class="fas fa-comments"></i>
                <span class="unread-badge" id="unreadBadge" style="display: none;">1</span>
            </button>
        `;

        const div = document.createElement('div');
        div.innerHTML = widgetHTML;
        document.body.appendChild(div);

        // Add styles
        if (!document.getElementById('enhancedChatbotStyles')) {
            const link = document.createElement('link');
            link.id = 'enhancedChatbotStyles';
            link.rel = 'stylesheet';
            link.href = 'css/enhanced-chatbot.css';
            document.head.appendChild(link);
        }
    }

    attachEventListeners() {
        // Float button - open chat
        document.getElementById('chatFloatBtn')?.addEventListener('click', () => {
            this.openChat();
        });

        // Close button
        document.getElementById('closeChat')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Minimize button
        document.getElementById('minimizeChat')?.addEventListener('click', () => {
            this.minimizeChat();
        });

        // Send button
        document.getElementById('sendBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Emoji button (placeholder)
        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            this.showQuickEmoji();
        });
    }

    openChat() {
        const widget = document.getElementById('concernTrackChatbot');
        const floatBtn = document.getElementById('chatFloatBtn');
        
        widget?.classList.add('active');
        floatBtn?.classList.add('hidden');
        this.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            document.getElementById('chatInput')?.focus();
        }, 300);

        // Hide unread badge
        const badge = document.getElementById('unreadBadge');
        if (badge) badge.style.display = 'none';

        // Add initial greeting if first time
        if (this.messages.length === 0) {
            this.addBotMessage(`Hi ${this.userName}! 👋 Welcome to ConcernTrack. I'm your AI assistant powered by Natural Language Processing.

I can help you with:
💡 **Smart solutions** for common issues
📝 **Submitting concerns** with AI assistance  
📊 **Tracking** your concern status
🎯 **Understanding** campus processes

What brings you here today?`);

            // Add quick action buttons
            this.addQuickActions([
                'WiFi Issues',
                'Portal Problems',
                'Grade Concerns',
                'Submit New Concern'
            ]);
        }
    }

    closeChat() {
        const widget = document.getElementById('concernTrackChatbot');
        const floatBtn = document.getElementById('chatFloatBtn');
        
        widget?.classList.remove('active');
        floatBtn?.classList.remove('hidden');
        this.isOpen = false;
    }

    minimizeChat() {
        this.closeChat();
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input?.value.trim();
        
        if (!message || this.isTyping) return;

        // Add user message
        this.addUserMessage(message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Process with NLP and get response
        try {
            const response = await this.processMessageWithNLP(message);
            this.hideTypingIndicator();
            this.addBotMessage(response.text, response.actions);
        } catch (error) {
            this.hideTypingIndicator();
            this.addBotMessage("I'm sorry, I encountered an error. Please try again or contact support.");
        }
    }

    async processMessageWithNLP(message) {
        // Store in conversation context
        this.conversationContext.push({ role: 'user', text: message });

        // Simple NLP analysis
        const nlpAnalysis = this.analyzeWithNLP(message);
        
        // Generate contextual response
        const response = this.generateContextualResponse(nlpAnalysis, message);
        
        return response;
    }

    analyzeWithNLP(message) {
        const lowerMsg = message.toLowerCase();
        
        // Intent detection
        const intents = {
            greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
            wifi: ['wifi', 'internet', 'connection', 'network', 'online'],
            portal: ['portal', 'login', 'password', 'account', 'access'],
            grades: ['grade', 'grades', 'mark', 'marks', 'score', 'exam', 'test'],
            submit: ['submit', 'concern', 'complaint', 'issue', 'problem', 'report'],
            tracking: ['track', 'status', 'progress', 'where', 'how long'],
            help: ['help', 'assist', 'support', 'what can you do'],
            goodbye: ['bye', 'goodbye', 'see you', 'thanks', 'thank you']
        };

        let detectedIntent = 'default';
        let confidence = 0;

        for (const [intent, keywords] of Object.entries(intents)) {
            const matchCount = keywords.filter(kw => lowerMsg.includes(kw)).length;
            if (matchCount > 0) {
                const intentConfidence = matchCount / keywords.length;
                if (intentConfidence > confidence) {
                    detectedIntent = intent;
                    confidence = intentConfidence;
                }
            }
        }

        // Sentiment analysis (simple)
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thanks', 'thank you'];
        const negativeWords = ['bad', 'terrible', 'awful', 'frustrated', 'angry', 'annoyed', 'hate'];
        const urgentWords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'quick'];

        let sentiment = 'neutral';
        let urgency = 'normal';

        if (positiveWords.some(w => lowerMsg.includes(w))) sentiment = 'positive';
        if (negativeWords.some(w => lowerMsg.includes(w))) sentiment = 'negative';
        if (urgentWords.some(w => lowerMsg.includes(w))) urgency = 'high';

        // Entity extraction
        const entities = this.extractEntities(message);

        return {
            intent: detectedIntent,
            confidence,
            sentiment,
            urgency,
            entities,
            originalMessage: message
        };
    }

    extractEntities(message) {
        const entities = [];
        
        // Extract location mentions
        const locations = ['library', 'cafeteria', 'classroom', 'lab', 'dorm', 'office', 'building'];
        locations.forEach(loc => {
            if (message.toLowerCase().includes(loc)) {
                entities.push({ type: 'location', value: loc });
            }
        });

        // Extract time mentions
        const timePatterns = [/\d{1,2}:\d{2}/, /today/, /tomorrow/, /yesterday/, /morning/, /afternoon/, /evening/];
        timePatterns.forEach(pattern => {
            const match = message.match(pattern);
            if (match) {
                entities.push({ type: 'time', value: match[0] });
            }
        });

        return entities;
    }

    generateContextualResponse(nlp, message) {
        const responses = {
            greeting: {
                text: this.formatGreeting(),
                actions: ['WiFi Issues', 'Portal Problems', 'Submit Concern', 'Track My Concerns']
            },
            
            wifi: {
                text: nlp.urgency === 'high' 
                    ? this.formatUrgentWiFiHelp()
                    : this.formatWiFiHelp(),
                actions: ['Submit IT Support', 'More Solutions', 'Check Status']
            },
            
            portal: {
                text: this.formatPortalHelp(),
                actions: ['Reset Password', 'Submit Portal Issue', 'Contact Support']
            },
            
            grades: {
                text: this.formatGradesHelp(),
                actions: ['Submit Grade Concern', 'Grade Appeal Info', 'View My Grades']
            },
            
            submit: {
                text: this.formatSubmissionHelp(),
                actions: ['Start Submission', 'See Categories', 'Get Help']
            },
            
            tracking: {
                text: this.formatTrackingHelp(),
                actions: ['Find My ID', 'Track by Email', 'View All My Concerns']
            },
            
            help: {
                text: this.formatGeneralHelp(),
                actions: ['WiFi Help', 'Portal Help', 'Submit Concern', 'Track Status']
            },
            
            goodbye: {
                text: this.formatGoodbye(),
                actions: ['Close Chat']
            },
            
            default: {
                text: nlp.sentiment === 'negative' 
                    ? this.formatNegativeSentiment(message)
                    : this.formatDefault(message),
                actions: ['Technical Issue', 'Academic Issue', 'Service Issue', 'Submit Concern']
            }
        };

        return responses[nlp.intent] || responses.default;
    }

    // Professional HTML Formatting Methods
    formatGreeting() {
        return `
            <div class="msg-header">👋 Hi ${this.userName}!</div>
            <div class="msg-intro">Welcome to ConcernTrack! I'm your AI assistant here to help with any campus concerns.</div>
            <div class="chat-card">
                <div class="chat-card-title">💡 What I Can Help With</div>
                <ul class="bullet-list">
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>WiFi Issues</strong> - Connection problems</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Portal Access</strong> - Login & password help</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Grade Concerns</strong> - Academic questions</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Submit Concerns</strong> - AI-powered submission</span></li>
                </ul>
            </div>
            <p>What do you need help with today?</p>
        `;
    }

    formatWiFiHelp() {
        return `
            <div class="msg-header">📶 WiFi Connection Help</div>
            <div class="msg-intro">Here are quick fixes for common WiFi issues:</div>
            <div class="chat-card">
                <div class="chat-card-title">🔧 Quick Solutions</div>
                <ul class="step-list">
                    <li class="step-item"><span class="step-number">1</span><span class="step-text"><strong>Restart WiFi:</strong> Turn off and back on</span></li>
                    <li class="step-item"><span class="step-number">2</span><span class="step-text"><strong>Forget Network:</strong> Remove and reconnect</span></li>
                    <li class="step-item"><span class="step-number">3</span><span class="step-text"><strong>Move Location:</strong> Try closer to router</span></li>
                    <li class="step-item"><span class="step-number">4</span><span class="step-text"><strong>Restart Device:</strong> Full device reboot</span></li>
                </ul>
            </div>
            <p>If these don't work, I can help you submit an <span class="keyword">IT Support</span> concern with <strong>high priority</strong>.</p>
        `;
    }

    formatUrgentWiFiHelp() {
        return `
            <div class="msg-header">⚡ Urgent WiFi Issue</div>
            <div class="chat-card urgent">
                <div class="chat-card-title">🚨 Immediate Actions</div>
                <ul class="step-list">
                    <li class="step-item"><span class="step-number">1</span><span class="step-text">Forget network & reconnect</span></li>
                    <li class="step-item"><span class="step-number">2</span><span class="step-text">Toggle airplane mode</span></li>
                    <li class="step-item"><span class="step-number">3</span><span class="step-text">Move closer to access point</span></li>
                    <li class="step-item"><span class="step-number">4</span><span class="step-text">Check if others have same issue</span></li>
                </ul>
            </div>
            <p>Still having issues? I can submit a <span class="keyword">HIGH PRIORITY</span> IT support concern right now.</p>
        `;
    }

    formatPortalHelp() {
        return `
            <div class="msg-header">🔐 Portal Access Help</div>
            <div class="msg-intro">Let's get your portal access working again.</div>
            <div class="chat-card warning">
                <div class="chat-card-title">🔧 Try These First</div>
                <ul class="step-list">
                    <li class="step-item"><span class="step-number">1</span><span class="step-text">Clear browser cache & cookies</span></li>
                    <li class="step-item"><span class="step-number">2</span><span class="step-text">Use incognito/private mode</span></li>
                    <li class="step-item"><span class="step-number">3</span><span class="step-text">Check Caps Lock is off</span></li>
                    <li class="step-item"><span class="step-number">4</span><span class="step-text">Try a different browser</span></li>
                </ul>
            </div>
            <p>If these don't work, I can help you submit a <span class="keyword">Portal Access</span> concern or guide you through password reset.</p>
        `;
    }

    formatGradesHelp() {
        return `
            <div class="msg-header">📊 Grade Concerns</div>
            <div class="msg-intro">I understand grade issues are important. Here's how to handle them:</div>
            <div class="chat-card success">
                <div class="chat-card-title">📝 Recommended Steps</div>
                <ul class="step-list">
                    <li class="step-item"><span class="step-number">1</span><span class="step-text">Contact professor directly first</span></li>
                    <li class="step-item"><span class="step-number">2</span><span class="step-text">Verify all submissions were completed</span></li>
                    <li class="step-item"><span class="step-number">3</span><span class="step-text">Review grading rubric</span></li>
                    <li class="step-item"><span class="step-number">4</span><span class="step-text">Document your concerns</span></li>
                </ul>
            </div>
            <p>Need to submit a formal concern? I'll categorize it as <span class="keyword">Academic Affairs</span> with appropriate priority.</p>
        `;
    }

    formatSubmissionHelp() {
        return `
            <div class="msg-header">📝 Submit a Concern</div>
            <div class="msg-intro">I'll guide you through submitting your concern with AI assistance.</div>
            <div class="chat-card">
                <div class="chat-card-title">✨ AI Will Help You With</div>
                <ul class="bullet-list">
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Auto-Categorization</strong> - Finds right department</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Priority Detection</strong> - Flags urgent issues</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Smart Solutions</strong> - Suggests fixes first</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Tracking ID</strong> - For easy follow-up</span></li>
                </ul>
            </div>
            <p>Ready to start? Just describe your issue and I'll take care of the rest!</p>
        `;
    }

    formatTrackingHelp() {
        return `
            <div class="msg-header">📍 Track Your Concerns</div>
            <div class="msg-intro">Monitor the status of all your submitted concerns.</div>
            <div class="chat-card">
                <div class="chat-card-title">🔍 What You Need</div>
                <ul class="bullet-list">
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Tracking ID:</strong> CTR-2024-XXXX format</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Your Email:</strong> Used during submission</span></li>
                </ul>
            </div>
            <p>Status meanings: <span class="keyword">Submitted</span> → <span class="keyword">Under Review</span> → <span class="keyword">In Progress</span> → <span class="keyword">Resolved</span></p>
        `;
    }

    formatGeneralHelp() {
        return `
            <div class="msg-header">🤖 ConcernTrack AI Assistant</div>
            <div class="msg-intro">Here's everything I can help you with:</div>
            <div class="chat-card">
                <div class="chat-card-title">🎯 Core Features</div>
                <ul class="bullet-list">
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Smart Concern Submission with AI</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Instant Solutions for Common Issues</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Real-time Status Tracking</span></li>
                    <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">24/7 Automated Assistance</span></li>
                </ul>
            </div>
            <p><strong>Popular Topics:</strong> WiFi • Portal • Grades • Facilities • Services</p>
        `;
    }

    formatGoodbye() {
        return `
            <div class="msg-header">👋 Take Care, ${this.userName}!</div>
            <div class="chat-card success">
                <div class="chat-card-title">✅ Remember</div>
                <p style="margin:0;">I'm always here 24/7 if you need help. Just click the chat button anytime!</p>
            </div>
            <p>Have a great day! 🌟</p>
        `;
    }

    formatNegativeSentiment(message) {
        return `
            <div class="msg-header">🤝 I Understand Your Frustration</div>
            <div class="msg-divider"></div>
            <div class="chat-card urgent">
                <div class="chat-card-title">💬 You Mentioned</div>
                <p style="margin:0; font-style: italic;">"${this.escapeHtml(message)}"</p>
            </div>
            <div class="msg-intro">To help you better, please tell me:</div>
            <ul class="step-list">
                <li class="step-item"><span class="step-number">1</span><span class="step-text"><strong>What exactly</strong> is happening?</span></li>
                <li class="step-item"><span class="step-number">2</span><span class="step-text"><strong>Where</strong> is it happening?</span></li>
                <li class="step-item"><span class="step-number">3</span><span class="step-text"><strong>When</strong> did it start?</span></li>
            </ul>
            <p>This will help me give you the <strong>best solution</strong> or submit the right concern type.</p>
        `;
    }

    formatDefault(message) {
        return `
            <div class="msg-header">🤔 I Want to Help You</div>
            <div class="msg-divider"></div>
            <div class="chat-card">
                <div class="chat-card-title">💬 Your Message</div>
                <p style="margin:0; font-style: italic;">"${this.escapeHtml(message)}"</p>
            </div>
            <div class="msg-intro">To provide the best assistance, could you clarify:</div>
            <ul class="bullet-list">
                <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Is this a <strong>technical issue</strong> (WiFi, portal)?</span></li>
                <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Is it <strong>academic</strong> (grades, courses)?</span></li>
                <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text">Is it a <strong>service/facilities</strong> issue?</span></li>
            </ul>
            <p>Or simply say <span class="keyword">"Submit concern"</span> and I'll guide you!</p>
        `;
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(text)}</p>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.messages.push({ role: 'user', text, time: new Date() });
        this.scrollToBottom();
    }

    addBotMessage(text, actions = []) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        // Convert markdown-style formatting to HTML
        const formattedText = this.formatMessage(text);
        
        let actionsHtml = '';
        if (actions && actions.length > 0) {
            actionsHtml = `
                <div class="quick-actions">
                    ${actions.map(action => `
                        <button class="quick-action-btn" data-action="${this.escapeHtml(action)}">
                            ${this.escapeHtml(action)}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-body">${formattedText}</div>
                <span class="message-time">${this.getCurrentTime()}</span>
                ${actionsHtml}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.messages.push({ role: 'bot', text, time: new Date() });

        // Attach event listeners to action buttons
        messageDiv.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        this.scrollToBottom();
    }

    handleQuickAction(action) {
        // Add user message for the action
        this.addUserMessage(action);
        
        // Show typing
        this.showTypingIndicator();

        // Process the action
        setTimeout(() => {
            this.hideTypingIndicator();
            
            const actionResponses = {
                'WiFi Issues': `
                    <div class="msg-header">⚡ WiFi Quick Fix</div>
                    <div class="chat-card">
                        <div class="chat-card-title">🔧 Try These Steps</div>
                        <ul class="step-list">
                            <li class="step-item"><span class="step-number">1</span><span class="step-text">Restart your device's WiFi</span></li>
                            <li class="step-item"><span class="step-number">2</span><span class="step-text">Forget network & reconnect</span></li>
                            <li class="step-item"><span class="step-number">3</span><span class="step-text">Try a different location</span></li>
                        </ul>
                    </div>
                    <p>If these don't work, I can submit an <span class="keyword">IT Support</span> concern for you.</p>
                `,
                
                'Portal Problems': `
                    <div class="msg-header">🔐 Portal Access Fix</div>
                    <div class="chat-card warning">
                        <div class="chat-card-title">🔧 Quick Solutions</div>
                        <ul class="step-list">
                            <li class="step-item"><span class="step-number">1</span><span class="step-text">Clear browser cache & cookies</span></li>
                            <li class="step-item"><span class="step-number">2</span><span class="step-text">Use incognito/private mode</span></li>
                            <li class="step-item"><span class="step-number">3</span><span class="step-text">Check Caps Lock is off</span></li>
                        </ul>
                    </div>
                    <p>Need to submit a <span class="keyword">Portal Access</span> concern?</p>
                `,
                
                'Grade Concerns': `
                    <div class="msg-header">📊 Grade Issue Options</div>
                    <div class="chat-card">
                        <div class="chat-card-title">📝 Available Actions</div>
                        <ul class="bullet-list">
                            <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Submit Academic Concern</strong> - Formal process</span></li>
                            <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Grade Appeal Info</strong> - Learn the process</span></li>
                            <li class="bullet-item"><span class="bullet-icon">▸</span><span class="step-text"><strong>Check Status</strong> - View existing concerns</span></li>
                        </ul>
                    </div>
                    <p>Which option works best for you?</p>
                `,
                
                'Submit Concern': `
                    <div class="msg-header">📝 Start Your Submission</div>
                    <div class="msg-intro">I'll help you submit with AI assistance.</div>
                    <div class="chat-card success">
                        <div class="chat-card-title">📝 Tell Me</div>
                        <ul class="step-list">
                            <li class="step-item"><span class="step-number">1</span><span class="step-text">What's the issue?</span></li>
                            <li class="step-item"><span class="step-number">2</span><span class="step-text">Where is it happening?</span></li>
                            <li class="step-item"><span class="step-number">3</span><span class="step-text">How urgent is it?</span></li>
                        </ul>
                    </div>
                    <p>Or visit the <span class="keyword">Submit Concern</span> page.</p>
                `,
                
                'Close Chat': () => this.closeChat()
            };

            let response = actionResponses[action];
            if (!response) {
                response = `
                    <div class="msg-header">🤔 Let Me Help</div>
                    <div class="msg-intro">You selected: <span class="keyword">${this.escapeHtml(action)}</span></div>
                    <div class="chat-card">
                        <div class="chat-card-title">💡 What I Can Do</div>
                        <p style="margin:0;">I can provide detailed information and guide you through this. Please tell me more about what you need help with specifically.</p>
                    </div>
                `;
            }
            
            if (typeof response === 'function') {
                response();
            } else {
                this.addBotMessage(response, ['More Help', 'Start Over', 'Close Chat']);
            }
        }, 1000);
    }

    addQuickActions(actions) {
        const lastMessage = document.querySelector('.message.bot:last-child .message-content');
        if (!lastMessage) return;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'quick-actions';
        actionsDiv.innerHTML = actions.map(action => `
            <button class="quick-action-btn" data-action="${this.escapeHtml(action)}">
                ${this.escapeHtml(action)}
            </button>
        `).join('');

        lastMessage.appendChild(actionsDiv);

        // Attach listeners
        actionsDiv.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    showTypingIndicator() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';

        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    formatMessage(text) {
        // If text already contains HTML tags (our new format), return as-is
        if (text.includes('<div class="msg-header">') || 
            text.includes('<div class="chat-card">') ||
            text.includes('<ul class="step-list">')) {
            return text;
        }
        
        // Otherwise, convert markdown-style formatting to HTML (for legacy support)
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        
        // Wrap plain text in a paragraph if no HTML structure
        if (!text.trim().startsWith('<')) {
            text = `<p>${text}</p>`;
        }
        
        return text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    showWelcomeNotification() {
        // Show the chat float button with a subtle animation
        const floatBtn = document.getElementById('chatFloatBtn');
        if (floatBtn) {
            floatBtn.style.transform = 'scale(0)';
            setTimeout(() => {
                floatBtn.style.transform = 'scale(1)';
            }, 100);
        }
    }

    showQuickEmoji() {
        // Simple emoji suggestions
        const emojis = ['👍', '👎', '😊', '😢', '⚡', '💡', '🙏'];
        const input = document.getElementById('chatInput');
        if (input) {
            input.value += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
        }
    }
}

// Initialize the chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.concernTrackChatbot = new ConcernTrackChatbot();
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConcernTrackChatbot;
}
