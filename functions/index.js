const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ─── Search & Boolean ────────────────────────────────────────────────────────
exports.generateBooleanSearch = require('./generate-boolean-search').generateBooleanSearch;
exports.generateSophisticatedBoolean = require('./generate-sophisticated-boolean').generateSophisticatedBoolean;
exports.explainBoolean = require('./explain-boolean').explainBoolean;
exports.linkedinSearch = require('./linkedin-search').linkedinSearch;
exports.locationSearch = require('./location-search').locationSearch;
exports.perplexitySearch = require('./perplexity-search').perplexitySearch;

// ─── Enrichment ──────────────────────────────────────────────────────────────
exports.enrichProfile = require('./enrich-profile').enrichProfile;
exports.searchContacts = require('./search-contacts').searchContacts;
exports.getContactInfo = require('./get-contact-info').getContactInfo;
exports.clearbitEnrichment = require('./clearbit-enrichment').clearbitEnrichment;
exports.hunterIoSearch = require('./hunter-io-search').hunterIoSearch;
exports.pdlSearch = require('./pdl-search').pdlSearch;
exports.waterfallEnrich = require('./waterfall-enrich').waterfallEnrich;

// ─── AI & Analysis ───────────────────────────────────────────────────────────
exports.analyzeCandidate = require('./analyze-candidate').analyzeCandidate;
exports.analyzeResume = require('./analyze-resume').analyzeResume;
exports.analyzeCompensation = require('./analyze-compensation').analyzeCompensation;
exports.extractNlpTerms = require('./extract-nlp-terms').extractNlpTerms;
exports.geminiApi = require('./gemini-api').geminiApi;
exports.chatAssistant = require('./chat-assistant').chatAssistant;

// ─── Document Processing ─────────────────────────────────────────────────────
exports.parseDocument = require('./parse-document').parseDocument;
exports.processTextExtraction = require('./process-text-extraction').processTextExtraction;
exports.extractDocumentGemini = require('./extract-document-gemini').extractDocumentGemini;
exports.firecrawlUrl = require('./firecrawl-url').firecrawlUrl;
exports.transcribeAudio = require('./transcribe-audio').transcribeAudio;

// ─── Job Description ─────────────────────────────────────────────────────────
exports.processJobRequirements = require('./process-job-requirements').processJobRequirements;
exports.processJobRequirementsV2 = require('./process-job-requirements-v2').processJobRequirementsV2;
exports.enhanceJobDescription = require('./enhance-job-description').enhanceJobDescription;
exports.generateJobDescription = require('./generate-job-description').generateJobDescription;
exports.extractJobContext = require('./extract-job-context').extractJobContext;
exports.optimizeJobTemplate = require('./optimize-job-template').optimizeJobTemplate;
exports.summarizeJob = require('./summarize-job').summarizeJob;

// ─── Content & LinkedIn ──────────────────────────────────────────────────────
exports.generateContent = require('./generate-content').generateContent;
exports.generateLinkedinAnalysis = require('./generate-linkedin-analysis').generateLinkedinAnalysis;
exports.createLinkedinPost = require('./create-linkedin-post').createLinkedinPost;

// ─── Email ───────────────────────────────────────────────────────────────────
const sendEmailModule = require('./send-email');
exports.sendEmail = sendEmailModule.sendEmail;
exports.sendBulkEmails = sendEmailModule.sendBulkEmails;
exports.sendTemplatedEmail = sendEmailModule.sendTemplatedEmail;

const campaignModule = require('./send-campaign-email');
exports.sendCampaignEmail = campaignModule.sendCampaignEmail;
exports.manageSubscriberList = campaignModule.manageSubscriberList;
exports.handleUnsubscribe = campaignModule.handleUnsubscribe;
exports.getCampaignAnalytics = campaignModule.getCampaignAnalytics;

exports.sendOutreachEmail = require('./send-outreach-email').sendOutreachEmail;
exports.generateEmailTemplates = require('./generate-email-templates').generateEmailTemplates;

const emailWebhookModule = require('./process-email-webhook');
exports.processEmailWebhook = emailWebhookModule.processEmailWebhook;
exports.getEmailEvents = emailWebhookModule.getEmailEvents;
exports.getEmailAnalytics = emailWebhookModule.getEmailAnalytics;

// ─── Interviews & Meetings ───────────────────────────────────────────────────
exports.generateInterviewQuestions = require('./generate-interview-questions').generateInterviewQuestions;
exports.scheduleInterview = require('./schedule-interview').scheduleInterview;
exports.prepareInterview = require('./prepare-interview').prepareInterview;
exports.createDailyRoom = require('./create-daily-room').createDailyRoom;
exports.initializeDailyBot = require('./initialize-daily-bot').initializeDailyBot;
exports.interviewGuidanceWs = require('./interview-guidance-ws').interviewGuidanceWs;
exports.processRecording = require('./process-recording').processRecording;

// ─── Billing & Subscriptions ─────────────────────────────────────────────────
exports.createCheckoutSession = require('./create-checkout-session').createCheckoutSession;
exports.createPortalSession = require('./create-portal-session').createPortalSession;
exports.stripeWebhook = require('./stripe-webhook').stripeWebhook;

const subscriptionModule = require('./subscription-emails');
exports.checkTrialExpirations = subscriptionModule.checkTrialExpirations;
exports.sendSubscriptionNotification = subscriptionModule.sendSubscriptionNotification;

// ─── Auth & Tokens ───────────────────────────────────────────────────────────
exports.exchangeGoogleToken = require('./exchange-google-token').exchangeGoogleToken;
exports.refreshGoogleToken = require('./refresh-google-token').refreshGoogleToken;
exports.revokeGoogleToken = require('./revoke-google-token').revokeGoogleToken;

// ─── API Keys ────────────────────────────────────────────────────────────────
exports.getDailyKey = require('./get-daily-key').getDailyKey;
exports.getGeminiKey = require('./get-gemini-key').getGeminiKey;
exports.getGoogleCseKey = require('./get-google-cse-key').getGoogleCseKey;

// ─── Admin ───────────────────────────────────────────────────────────────────
const adminModule = require('./admin-grant-pro');
exports.adminGrantPro = adminModule.adminGrantPro;
exports.grantProAccess = adminModule.grantProAccess;

// ─── Clarvida ────────────────────────────────────────────────────────────────
exports.generateClarvidaReport = require('./generate-clarvida-report').generateClarvidaReport;
exports.generateClarvidaMarketingImage = require('./generate-clarvida-marketing-image').generateClarvidaMarketingImage;

// ─── Extension API & MCP ─────────────────────────────────────────────────────
exports.getProjects = require('./get-projects').getProjects;
exports.mcpChatStream = require('./mcp-chat-stream').mcpChatStream;
// ─── Health Check ────────────────────────────────────────────────────────────
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'firebase-functions',
    timestamp: new Date().toISOString()
  });
});
