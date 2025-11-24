const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import individual function modules
const { generateBooleanSearch } = require('./generate-boolean-search');
const { enrichProfile } = require('./enrich-profile');
const { analyzeCandidate } = require('./analyze-candidate');
const { processJobRequirements } = require('./process-job-requirements');
const { sendOutreachEmail } = require('./send-outreach-email');
const { createCheckoutSession } = require('./create-checkout-session');
const { stripeWebhook } = require('./stripe-webhook');
const { transcribeAudio } = require('./transcribe-audio');
const { perplexitySearch } = require('./perplexity-search');
const { parseDocument } = require('./parse-document');
const { searchContacts } = require('./search-contacts');
const { getContactInfo } = require('./get-contact-info');
const { explainBoolean } = require('./explain-boolean');
const { generateContent } = require('./generate-content');
const { enhanceJobDescription } = require('./enhance-job-description');
const { chatAssistant } = require('./chat-assistant');
const { analyzeResume } = require('./analyze-resume');
// const { handleInterview } = require('./handle-interview'); // Temporarily disabled - needs Supabase removal
const { generateInterviewQuestions } = require('./generate-interview-questions');
const { clearbitEnrichment } = require('./clearbit-enrichment');
const { hunterIoSearch } = require('./hunter-io-search');
// const { githubProfile } = require('./github-profile'); // Temporarily disabled - needs Supabase removal
const { linkedinSearch } = require('./linkedin-search');
const { pdlSearch } = require('./pdl-search');
const { sendEmail, sendBulkEmails, sendTemplatedEmail } = require('./send-email');
const { sendCampaignEmail, manageSubscriberList, handleUnsubscribe, getCampaignAnalytics } = require('./send-campaign-email');
const { scheduleInterview } = require('./schedule-interview');
// const { processTextExtraction } = require('./process-text-extraction'); // Temporarily disabled - needs Supabase removal
const { prepareInterview } = require('./prepare-interview');
const { processEmailWebhook, getEmailEvents, getEmailAnalytics } = require('./process-email-webhook');

// Import newly migrated functions
const { firecrawlUrl } = require('./firecrawl-url');
const { generateLinkedinAnalysis } = require('./generate-linkedin-analysis');
const { createLinkedinPost } = require('./create-linkedin-post');
// const { generateDashboardMetrics } = require('./generate-dashboard-metrics'); // Temporarily disabled - needs Supabase removal
const { analyzeCompensation } = require('./analyze-compensation');
const { extractNlpTerms } = require('./extract-nlp-terms');
const { summarizeJob } = require('./summarize-job');
const { generateEmailTemplates } = require('./generate-email-templates');
const { geminiApi } = require('./gemini-api');
const { createDailyRoom } = require('./create-daily-room');
const { getDailyKey } = require('./get-daily-key');
const { getGeminiKey } = require('./get-gemini-key');
const { getGoogleCseKey } = require('./get-google-cse-key');
const { generateClarvidaReport } = require('./generate-clarvida-report');
const { processJobRequirementsV2 } = require('./process-job-requirements-v2');
const { testOrchestration } = require('./test-orchestration');
const { initializeDailyBot } = require('./initialize-daily-bot');
const { interviewGuidanceWs } = require('./interview-guidance-ws');
const { exchangeGoogleToken } = require('./exchange-google-token');
const { refreshGoogleToken } = require('./refresh-google-token');
const { revokeGoogleToken } = require('./revoke-google-token');
const { processRecording } = require('./process-recording');

// Export functions
exports.generateBooleanSearch = generateBooleanSearch;
exports.enrichProfile = enrichProfile;
exports.analyzeCandidate = analyzeCandidate;
exports.processJobRequirements = processJobRequirements;
exports.sendOutreachEmail = sendOutreachEmail;
exports.createCheckoutSession = createCheckoutSession;
exports.stripeWebhook = stripeWebhook;
exports.transcribeAudio = transcribeAudio;
exports.perplexitySearch = perplexitySearch;
exports.parseDocument = parseDocument;
exports.searchContacts = searchContacts;
exports.getContactInfo = getContactInfo;
exports.explainBoolean = explainBoolean;
exports.generateContent = generateContent;
exports.enhanceJobDescription = enhanceJobDescription;
exports.chatAssistant = chatAssistant;
exports.analyzeResume = analyzeResume;
// exports.handleInterview = handleInterview; // Temporarily disabled - needs Supabase removal
exports.generateInterviewQuestions = generateInterviewQuestions;
exports.clearbitEnrichment = clearbitEnrichment;
exports.hunterIoSearch = hunterIoSearch;
// exports.githubProfile = githubProfile; // Temporarily disabled - needs Supabase removal
exports.linkedinSearch = linkedinSearch;
exports.pdlSearch = pdlSearch;
exports.sendEmail = sendEmail;
exports.sendBulkEmails = sendBulkEmails;
exports.sendTemplatedEmail = sendTemplatedEmail;
exports.sendCampaignEmail = sendCampaignEmail;
exports.manageSubscriberList = manageSubscriberList;
exports.handleUnsubscribe = handleUnsubscribe;
exports.getCampaignAnalytics = getCampaignAnalytics;
exports.scheduleInterview = scheduleInterview;
// exports.processTextExtraction = processTextExtraction; // Temporarily disabled - needs Supabase removal
exports.prepareInterview = prepareInterview;
exports.processEmailWebhook = processEmailWebhook;
exports.getEmailEvents = getEmailEvents;
exports.getEmailAnalytics = getEmailAnalytics;

// Export newly migrated functions
exports.firecrawlUrl = firecrawlUrl;
exports.generateLinkedinAnalysis = generateLinkedinAnalysis;
exports.createLinkedinPost = createLinkedinPost;
// exports.generateDashboardMetrics = generateDashboardMetrics; // Temporarily disabled - needs Supabase removal
exports.analyzeCompensation = analyzeCompensation;
exports.extractNlpTerms = extractNlpTerms;
exports.summarizeJob = summarizeJob;
exports.generateEmailTemplates = generateEmailTemplates;
exports.geminiApi = geminiApi;
exports.createDailyRoom = createDailyRoom;
exports.getDailyKey = getDailyKey;
exports.getGeminiKey = getGeminiKey;
exports.getGoogleCseKey = getGoogleCseKey;
exports.generateClarvidaReport = generateClarvidaReport;
exports.processJobRequirementsV2 = processJobRequirementsV2;
exports.testOrchestration = testOrchestration;
exports.initializeDailyBot = initializeDailyBot;
exports.interviewGuidanceWs = interviewGuidanceWs;
exports.exchangeGoogleToken = exchangeGoogleToken;
exports.refreshGoogleToken = refreshGoogleToken;
exports.revokeGoogleToken = revokeGoogleToken;
exports.processRecording = processRecording;

// Example: Health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'firebase-functions',
    timestamp: new Date().toISOString()
  });
});

// Example: Scheduled function (runs every 24 hours)
// Note: Requires firebase-functions v2 for scheduled functions
// For now, commenting out to avoid deployment errors
// exports.dailyCleanup = functions.pubsub
//   .schedule('every 24 hours')
//   .timeZone('America/New_York')
//   .onRun(async (context) => {
//     console.log('Running daily cleanup...');
//     // Add cleanup logic here
//     return null;
//   });
