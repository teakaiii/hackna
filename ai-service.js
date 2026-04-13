// AI Service Module for ConcernTracker PRO
// Provides AI-powered categorization, priority detection, and chatbot functionality

const axios = require('axios');

// Configuration for AI API (using OpenAI as example)
const AI_CONFIG = {
    apiKey: process.env.OPENAI_API_KEY || 'demo-key',
    model: 'gpt-3.5-turbo',
    maxTokens: 150
};

// Concern categories with keywords
const CATEGORIES = {
    'IT Support': [
        'wifi', 'internet', 'computer', 'laptop', 'software', 'hardware', 
        'login', 'password', 'email', 'network', 'connection', 'slow',
        'website', 'portal', 'system', 'technology', 'printer', 'scanner'
    ],
    'Academic Affairs': [
        'grade', 'course', 'class', 'professor', 'teacher', 'exam', 'test',
        'assignment', 'homework', 'schedule', 'registration', 'enrollment',
        'transcript', 'degree', 'major', 'minor', 'curriculum', 'academic'
    ],
    'Facilities': [
        'building', 'room', 'classroom', 'library', 'dorm', 'cafeteria',
        'parking', 'maintenance', 'cleaning', 'repair', 'equipment',
        'furniture', 'lighting', 'air conditioning', 'heating', 'plumbing'
    ],
    'Financial Aid': [
        'tuition', 'fee', 'payment', 'scholarship', 'grant', 'loan',
        'financial aid', 'money', 'cost', 'billing', 'invoice',
        'refund', 'stipend', 'work study', 'funding'
    ],
    'Student Welfare': [
        'health', 'counseling', 'mental health', 'wellness', 'safety',
        'security', 'harassment', 'discrimination', 'accommodation',
        'disability', 'medical', 'emergency', 'support', 'advising'
    ],
    'Administrative': [
        'administration', 'policy', 'procedure', 'document', 'form',
        'record', 'identification', 'id card', 'parking permit',
        'housing', 'residence', 'student services', 'office'
    ]
};

// Priority keywords
const PRIORITY_KEYWORDS = {
    'high': [
        'urgent', 'emergency', 'critical', 'immediate', 'asap', 'broken',
        'dangerous', 'unsafe', 'fail', 'crash', 'down', 'stuck', 'locked',
        'lost', 'stolen', 'theft', 'assault', 'injury', 'accident'
    ],
    'medium': [
        'slow', 'delay', 'issue', 'problem', 'concern', 'difficulty',
        'confusion', 'unclear', 'incorrect', 'wrong', 'missing', 'late'
    ],
    'low': [
        'question', 'inquiry', 'information', 'suggestion', 'improvement',
        'feedback', 'comment', 'request', 'would like', 'prefer'
    ]
};

// AI-powered concern categorization
async function categorizeConcern(text) {
    try {
        // Simple keyword-based categorization (for demo)
        const lowerText = text.toLowerCase();
        let bestCategory = 'Student Welfare'; // default
        let highestScore = 0;
        
        for (const [category, keywords] of Object.entries(CATEGORIES)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score += 1;
                }
            });
            
            if (score > highestScore) {
                highestScore = score;
                bestCategory = category;
            }
        }
        
        const confidence = Math.min(0.9, 0.5 + (highestScore * 0.1));
        
        // In production, you would use actual AI API call:
        /*
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: AI_CONFIG.model,
            messages: [{
                role: 'user',
                content: `Categorize this student concern into one of these categories: ${Object.keys(CATEGORIES).join(', ')}\n\nConcern: "${text}"\n\nRespond with only the category name.`
            }],
            max_tokens: AI_CONFIG.maxTokens,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        const aiCategory = response.data.choices[0].message.content.trim();
        return {
            category: aiCategory,
            confidence: 0.85,
            method: 'ai'
        };
        */
        
        return {
            category: bestCategory,
            confidence: confidence,
            method: 'keyword',
            keywords: highestScore
        };
        
    } catch (error) {
        console.error('Error in categorizeConcern:', error);
        return {
            category: 'Student Welfare',
            confidence: 0.5,
            method: 'fallback'
        };
    }
}

// AI-powered priority detection
async function detectPriority(text) {
    try {
        const lowerText = text.toLowerCase();
        let highScore = 0;
        let mediumScore = 0;
        let lowScore = 0;
        
        // Count priority keywords
        PRIORITY_KEYWORDS.high.forEach(keyword => {
            if (lowerText.includes(keyword)) highScore += 2;
        });
        
        PRIORITY_KEYWORDS.medium.forEach(keyword => {
            if (lowerText.includes(keyword)) mediumScore += 1;
        });
        
        PRIORITY_KEYWORDS.low.forEach(keyword => {
            if (lowerText.includes(keyword)) lowScore += 0.5;
        });
        
        // Determine priority based on scores
        let priority = 'low';
        let confidence = 0.5;
        
        if (highScore > 0) {
            priority = 'high';
            confidence = Math.min(0.9, 0.6 + (highScore * 0.1));
        } else if (mediumScore > lowScore) {
            priority = 'medium';
            confidence = Math.min(0.8, 0.5 + (mediumScore * 0.1));
        } else {
            priority = 'low';
            confidence = Math.min(0.7, 0.4 + (lowScore * 0.1));
        }
        
        return {
            priority: priority,
            confidence: confidence,
            method: 'keyword',
            scores: { high: highScore, medium: mediumScore, low: lowScore }
        };
        
    } catch (error) {
        console.error('Error in detectPriority:', error);
        return {
            priority: 'medium',
            confidence: 0.5,
            method: 'fallback'
        };
    }
}

// AI Chatbot for user assistance
async function generateResponse(message, context = {}) {
    try {
        const lowerMessage = message.toLowerCase();
        
        // FAQ responses (rule-based for demo)
        const faqResponses = {
            'how to submit': 'To submit a concern: 1) Click "Submit Concern" 2) Fill in the title and description 3) Choose category or let AI suggest 4) Add your email 5) Submit! You\'ll get a tracking ID.',
            'tracking id': 'Your tracking ID looks like "CTR-2024-1001". Use it to track your concern status anytime. You can also track using your email address.',
            'anonymous': 'Yes! You can submit concerns anonymously. Your identity will be hidden from admins, but you\'ll still receive email updates about your concern.',
            'response time': 'Most concerns are reviewed within 24-48 hours. High-priority issues are handled first. You\'ll get email notifications when status changes.',
            'categories': 'We have 6 categories: IT Support, Academic Affairs, Facilities, Financial Aid, Student Welfare, and Administrative. Our AI helps suggest the best category!',
            'contact': 'For immediate help, email support@concerntracker.com or call our hotline at 1-800-CONCERN.',
            'password': 'Click "Forgot Password" on the login page. You\'ll receive an email to reset your password.',
            'account': 'You can use your Google account to sign in quickly, or continue as a guest with just your email address.'
        };
        
        // Check for FAQ matches
        for (const [keyword, response] of Object.entries(faqResponses)) {
            if (lowerMessage.includes(keyword)) {
                return {
                    type: 'faq',
                    response: response,
                    confidence: 0.9
                };
            }
        }
        
        // Context-aware responses
        if (context.currentStep === 'submitting') {
            return {
                type: 'guided',
                response: 'I can help you submit your concern! What\'s the main issue you\'re experiencing? Try to be specific about what\'s wrong and where it\'s happening.',
                confidence: 0.8
            };
        }
        
        if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
            return {
                type: 'greeting',
                response: 'Hello! I\'m your ConcernTracker AI assistant. I can help you submit concerns, track status, or answer questions about the system. What would you like help with?',
                confidence: 0.95
            };
        }
        
        if (lowerMessage.includes('thank')) {
            return {
                type: 'gratitude',
                response: 'You\'re welcome! Is there anything else I can help you with today?',
                confidence: 0.9
            };
        }
        
        // Default response
        return {
            type: 'general',
            response: 'I\'m here to help! You can ask me about:\n• How to submit concerns\n• Tracking your concern status\n• Anonymous submissions\n• Response times\n• Account issues\n\nWhat would you like to know more about?',
            confidence: 0.7
        };
        
        // In production, you would use actual AI API:
        /*
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: AI_CONFIG.model,
            messages: [{
                role: 'system',
                content: 'You are a helpful AI assistant for ConcernTracker, a student concern tracking system. Be concise, helpful, and friendly.'
            }, {
                role: 'user',
                content: message
            }],
            max_tokens: AI_CONFIG.maxTokens,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        return {
            type: 'ai',
            response: response.data.choices[0].message.content.trim(),
            confidence: 0.85
        };
        */
        
    } catch (error) {
        console.error('Error in generateResponse:', error);
        return {
            type: 'error',
            response: 'I\'m having trouble connecting right now. Please try again later or contact support@concerntracker.com for immediate help.',
            confidence: 0.3
        };
    }
}

// AI-powered concern analysis
async function analyzeConcern(title, description) {
    try {
        const fullText = `${title} ${description}`;
        
        const [categorization, priority] = await Promise.all([
            categorizeConcern(fullText),
            detectPriority(fullText)
        ]);
        
        // Generate suggested response
        const suggestedActions = {
            'IT Support': 'Contact IT Help Desk, Check if others have similar issues, Try basic troubleshooting',
            'Academic Affairs': 'Contact Academic Advisor, Review course policies, Check academic calendar',
            'Facilities': 'Submit maintenance request, Document with photos, Follow up with facilities office',
            'Financial Aid': 'Contact Financial Aid Office, Check student account, Review payment options',
            'Student Welfare': 'Contact Counseling Services, Meet with Student Advisor, Review campus resources',
            'Administrative': 'Visit relevant office, Check online portal, Bring required documents'
        };
        
        return {
            categorization,
            priority,
            suggestedActions: suggestedActions[categorization.category] || 'Contact appropriate department',
            estimatedResolutionTime: getEstimatedResolutionTime(categorization.category, priority.priority),
            requiresUrgentAttention: priority.priority === 'high'
        };
        
    } catch (error) {
        console.error('Error in analyzeConcern:', error);
        return {
            categorization: { category: 'Student Welfare', confidence: 0.5 },
            priority: { priority: 'medium', confidence: 0.5 },
            suggestedActions: 'Contact appropriate department',
            estimatedResolutionTime: '3-5 business days',
            requiresUrgentAttention: false
        };
    }
}

// Helper function for resolution time estimation
function getEstimatedResolutionTime(category, priority) {
    const times = {
        'high': {
            'IT Support': '2-4 hours',
            'Facilities': '4-8 hours',
            'Student Welfare': '1-2 hours',
            'default': '24 hours'
        },
        'medium': {
            'IT Support': '1-2 business days',
            'Academic Affairs': '2-3 business days',
            'Financial Aid': '3-5 business days',
            'default': '2-3 business days'
        },
        'low': {
            'Administrative': '5-7 business days',
            'Academic Affairs': '3-5 business days',
            'default': '3-5 business days'
        }
    };
    
    return times[priority]?.[category] || times[priority]?.default || '3-5 business days';
}

module.exports = {
    categorizeConcern,
    detectPriority,
    generateResponse,
    analyzeConcern
};
