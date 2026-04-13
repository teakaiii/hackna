// NLP Service - Natural Language Processing for Concern Analysis
const natural = require('natural');
const Sentiment = require('sentiment');
const stopword = require('stopword');

class NLPService {
    constructor() {
        this.sentiment = new Sentiment();
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        
        // Initialize NLP components
        this.initializeNLPModels();
    }

    initializeNLPModels() {
        // Define concern categories with keywords
        this.categories = {
            'IT Support': [
                'computer', 'laptop', 'wifi', 'internet', 'network', 'software', 'hardware',
                'password', 'login', 'email', 'access', 'system', 'server', 'connection',
                'slow', 'crash', 'freeze', 'error', 'bug', 'technical', 'digital'
            ],
            'Academic Issues': [
                'grade', 'exam', 'test', 'assignment', 'homework', 'class', 'course',
                'professor', 'teacher', 'lecture', 'study', 'academic', 'curriculum',
                'schedule', 'deadline', 'project', 'research', 'paper', 'thesis'
            ],
            'Student Welfare': [
                'counseling', 'mental', 'health', 'stress', 'anxiety', 'depression',
                'wellbeing', 'support', 'guidance', 'personal', 'emotional', 'psychological',
                'therapy', 'help', 'crisis', 'emergency', 'wellness'
            ],
            'Facilities': [
                'building', 'room', 'dormitory', 'cafeteria', 'library', 'parking',
                'maintenance', 'cleaning', 'repair', 'broken', 'damaged', 'infrastructure',
                'equipment', 'furniture', 'lighting', 'temperature', 'noise'
            ],
            'Financial': [
                'tuition', 'fee', 'payment', 'scholarship', 'grant', 'loan', 'financial',
                'money', 'cost', 'expense', 'budget', 'billing', 'refund', 'aid'
            ],
            'Administrative': [
                'registration', 'enrollment', 'records', 'transcript', 'certificate',
                'document', 'paperwork', 'form', 'application', 'admission', 'policy',
                'procedure', 'administration', 'office', 'staff'
            ]
        };

        // Define urgency indicators
        this.urgencyWords = {
            high: [
                'urgent', 'emergency', 'immediate', 'asap', 'critical', 'severe',
                'serious', 'major', 'crisis', 'disaster', 'broken', 'failed',
                'cannot', 'unable', 'stuck', 'blocked', 'down', 'crashed'
            ],
            medium: [
                'important', 'need', 'require', 'please', 'help', 'issue',
                'problem', 'concern', 'matter', 'situation', 'difficulty'
            ],
            low: [
                'suggestion', 'recommendation', 'improvement', 'enhancement',
                'minor', 'small', 'slight', 'occasional', 'sometimes', 'occasionally'
            ]
        };

        // Define action words for response suggestions
        this.actionWords = [
            'contact', 'call', 'email', 'visit', 'schedule', 'appointment',
            'submit', 'apply', 'register', 'request', 'report', 'notify'
        ];
    }

    // Analyze concern text and extract insights
    async analyzeConcern(title, description) {
        const fullText = `${title} ${description}`.toLowerCase();
        
        const analysis = {
            category: this.categorizeConcern(fullText),
            priority: this.detectPriority(fullText),
            sentiment: this.analyzeSentiment(fullText),
            keywords: this.extractKeywords(fullText),
            entities: this.extractEntities(fullText),
            urgency: this.assessUrgency(fullText),
            summary: this.generateSummary(fullText),
            suggestedActions: this.suggestActions(fullText),
            complexity: this.assessComplexity(fullText),
            estimatedResolutionTime: this.estimateResolutionTime(fullText)
        };

        return analysis;
    }

    // Categorize concern based on keywords
    categorizeConcern(text) {
        const tokens = this.tokenizer.tokenize(text);
        const cleanedTokens = stopword.removeStopwords(tokens);
        
        let categoryScores = {};
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            categoryScores[category] = 0;
            
            for (const keyword of keywords) {
                for (const token of cleanedTokens) {
                    if (token.includes(keyword) || keyword.includes(token)) {
                        categoryScores[category]++;
                    }
                }
            }
        }

        // Find category with highest score
        let bestCategory = 'General';
        let highestScore = 0;
        
        for (const [category, score] of Object.entries(categoryScores)) {
            if (score > highestScore) {
                highestScore = score;
                bestCategory = category;
            }
        }

        return {
            category: bestCategory,
            confidence: Math.min(highestScore / 5, 1.0), // Normalize confidence
            alternatives: Object.entries(categoryScores)
                .sort(([,a], [,b]) => b - a)
                .slice(1, 3)
                .map(([cat, score]) => ({ category: cat, score }))
        };
    }

    // Detect priority based on urgency words and sentiment
    detectPriority(text) {
        const urgencyScore = this.calculateUrgencyScore(text);
        const sentimentScore = this.analyzeSentiment(text);
        
        let priority = 'medium';
        let confidence = 0.5;

        if (urgencyScore >= 0.7 || sentimentScore.score <= -3) {
            priority = 'high';
            confidence = 0.8;
        } else if (urgencyScore >= 0.4 || sentimentScore.score <= -1) {
            priority = 'medium';
            confidence = 0.6;
        } else {
            priority = 'low';
            confidence = 0.7;
        }

        return {
            priority,
            confidence,
            factors: {
                urgency: urgencyScore,
                sentiment: sentimentScore.score
            }
        };
    }

    // Calculate urgency score based on urgency words
    calculateUrgencyScore(text) {
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        let urgencyScore = 0;
        let totalWords = tokens.length;

        for (const token of tokens) {
            for (const [level, words] of Object.entries(this.urgencyWords)) {
                for (const word of words) {
                    if (token.includes(word)) {
                        if (level === 'high') urgencyScore += 0.3;
                        else if (level === 'medium') urgencyScore += 0.2;
                        else urgencyScore += 0.1;
                    }
                }
            }
        }

        return Math.min(urgencyScore, 1.0);
    }

    // Analyze sentiment of the text
    analyzeSentiment(text) {
        return this.sentiment.analyze(text);
    }

    // Extract important keywords from text
    extractKeywords(text) {
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const cleanedTokens = stopword.removeStopwords(tokens);
        
        // Apply stemming
        const stemmedTokens = cleanedTokens.map(token => this.stemmer.stem(token));
        
        // Count word frequency
        const wordFreq = {};
        for (const token of stemmedTokens) {
            if (token.length > 2) { // Ignore very short words
                wordFreq[token] = (wordFreq[token] || 0) + 1;
            }
        }

        // Sort by frequency and return top keywords
        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq }));
    }

    // Extract entities (email addresses, phone numbers, etc.)
    extractEntities(text) {
        const entities = {
            emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
            phoneNumbers: text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [],
            dates: text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g) || [],
            trackingIds: text.match(/\bCTR-\d{4}-\d{4}-[A-Z0-9]{4}\b/gi) || [],
            urls: text.match(/https?:\/\/[^\s]+/g) || []
        };

        return entities;
    }

    // Assess urgency level
    assessUrgency(text) {
        const urgencyScore = this.calculateUrgencyScore(text);
        const sentiment = this.analyzeSentiment(text);
        
        let urgencyLevel = 'normal';
        if (urgencyScore >= 0.7 || sentiment.score <= -3) {
            urgencyLevel = 'high';
        } else if (urgencyScore >= 0.4 || sentiment.score <= -1) {
            urgencyLevel = 'medium';
        }

        return {
            level: urgencyLevel,
            score: urgencyScore,
            sentiment: sentiment.score,
            reasons: this.getUrgencyReasons(text)
        };
    }

    // Get reasons for urgency assessment
    getUrgencyReasons(text) {
        const reasons = [];
        const tokens = this.tokenizer.tokenize(text.toLowerCase());

        for (const [level, words] of Object.entries(this.urgencyWords)) {
            for (const word of words) {
                if (tokens.some(token => token.includes(word))) {
                    reasons.push({
                        word,
                        level,
                        context: 'urgency_indicator'
                    });
                }
            }
        }

        return reasons;
    }

    // Generate summary of the concern
    generateSummary(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length <= 2) {
            return text.substring(0, 200) + (text.length > 200 ? '...' : '');
        }

        // Simple extractive summarization - pick sentences with most keywords
        const keywords = this.extractKeywords(text).slice(0, 5).map(k => k.word);
        
        let sentenceScores = sentences.map(sentence => {
            let score = 0;
            const sentenceTokens = this.tokenizer.tokenize(sentence.toLowerCase());
            
            for (const keyword of keywords) {
                if (sentenceTokens.some(token => token.includes(keyword))) {
                    score++;
                }
            }
            
            return { sentence: sentence.trim(), score };
        });

        // Sort by score and pick top sentences
        sentenceScores.sort((a, b) => b.score - a.score);
        const topSentences = sentenceScores.slice(0, 2);
        
        return topSentences.map(s => s.sentence).join('. ') + '.';
    }

    // Suggest actions based on concern content
    suggestActions(text) {
        const actions = [];
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const category = this.categorizeConcern(text).category;

        // Category-specific actions
        const categoryActions = {
            'IT Support': [
                'Contact IT Help Desk',
                'Restart your device',
                'Check network connection',
                'Try alternative device'
            ],
            'Academic Issues': [
                'Contact academic advisor',
                'Review course materials',
                'Schedule meeting with professor',
                'Check academic calendar'
            ],
            'Student Welfare': [
                'Contact counseling services',
                'Schedule wellness appointment',
                'Reach out to support staff',
                'Call emergency services if needed'
            ],
            'Facilities': [
                'Contact facilities management',
                'Submit maintenance request',
                'Report to building administrator',
                'Document the issue with photos'
            ],
            'Financial': [
                'Visit financial aid office',
                'Review payment options',
                'Check scholarship deadlines',
                'Contact billing department'
            ],
            'Administrative': [
                'Visit registrar office',
                'Check online portal',
                'Review required documents',
                'Contact department secretary'
            ]
        };

        // Add category-specific actions
        if (categoryActions[category]) {
            actions.push(...categoryActions[category]);
        }

        // Add action-based suggestions
        for (const token of tokens) {
            for (const action of this.actionWords) {
                if (token.includes(action)) {
                    actions.push(`Consider ${action}ing the relevant department`);
                }
            }
        }

        // Remove duplicates and limit to top 5
        return [...new Set(actions)].slice(0, 5);
    }

    // Assess complexity of the concern
    assessComplexity(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = this.tokenizer.tokenize(text);
        const keywords = this.extractKeywords(text);
        
        let complexity = 'simple';
        let score = 0;

        // Length-based complexity
        if (words.length > 100) score += 0.3;
        if (sentences.length > 5) score += 0.2;

        // Keyword diversity
        if (keywords.length > 10) score += 0.2;

        // Technical terms
        const technicalTerms = ['system', 'network', 'software', 'hardware', 'database', 'server'];
        const technicalCount = technicalTerms.filter(term => 
            text.toLowerCase().includes(term)
        ).length;
        if (technicalCount > 2) score += 0.3;

        if (score >= 0.7) complexity = 'complex';
        else if (score >= 0.4) complexity = 'moderate';

        return {
            level: complexity,
            score,
            factors: {
                wordCount: words.length,
                sentenceCount: sentences.length,
                keywordDiversity: keywords.length,
                technicalTerms: technicalCount
            }
        };
    }

    // Estimate resolution time based on category and complexity
    estimateResolutionTime(text) {
        const category = this.categorizeConcern(text).category;
        const complexity = this.assessComplexity(text).level;
        const urgency = this.assessUrgency(text).level;

        const baseTimes = {
            'IT Support': { simple: '1-2 hours', moderate: '1-2 days', complex: '3-5 days' },
            'Academic Issues': { simple: '1-2 days', moderate: '3-5 days', complex: '1-2 weeks' },
            'Student Welfare': { simple: 'same day', moderate: '1-2 days', complex: '1 week' },
            'Facilities': { simple: '1-2 days', moderate: '3-5 days', complex: '1-2 weeks' },
            'Financial': { simple: '2-3 days', moderate: '1 week', complex: '2-3 weeks' },
            'Administrative': { simple: '1-2 days', moderate: '3-5 days', complex: '1-2 weeks' }
        };

        let estimatedTime = baseTimes[category]?.[complexity] || '3-5 days';

        // Adjust for urgency
        if (urgency === 'high') {
            estimatedTime = 'same day';
        } else if (urgency === 'medium') {
            // Reduce time by half for medium urgency
            if (estimatedTime.includes('week')) {
                estimatedTime = estimatedTime.replace('week', 'days');
            } else if (estimatedTime.includes('days')) {
                const days = parseInt(estimatedTime);
                estimatedTime = `${Math.ceil(days / 2)} days`;
            }
        }

        return {
            estimated: estimatedTime,
            category,
            complexity,
            urgency
        };
    }

    // Generate intelligent response suggestions
    generateResponseSuggestions(analysis) {
        const suggestions = [];

        // Based on category
        const categoryResponses = {
            'IT Support': [
                'I understand you\'re experiencing technical difficulties. Our IT team is ready to assist you.',
                'Technical issues can be frustrating. Let me connect you with our support specialists.',
                'I\'ve logged your IT concern and our technical team will investigate promptly.'
            ],
            'Academic Issues': [
                'Academic concerns are important to us. Let me help you find the right resources.',
                'I understand your academic needs. Our student services team is here to support you.',
                'Your academic success matters. Let me connect you with the appropriate department.'
            ],
            'Student Welfare': [
                'Your wellbeing is our priority. Support is available and we\'re here to help.',
                'I understand this is important. Our counseling services are confidential and supportive.',
                'Your mental health matters. Let me connect you with our wellness resources.'
            ]
        };

        if (categoryResponses[analysis.category]) {
            suggestions.push(...categoryResponses[analysis.category]);
        }

        // Based on urgency
        if (analysis.urgency.level === 'high') {
            suggestions.push('This requires immediate attention. I\'m escalating this priority level.');
        }

        // Based on sentiment
        if (analysis.sentiment.score < -2) {
            suggestions.push('I understand this is frustrating. We\'re committed to resolving this quickly.');
        }

        return suggestions.slice(0, 3);
    }
}

const nlpService = new NLPService();

module.exports = {
    nlpService,
    NLPService
};
