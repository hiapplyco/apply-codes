import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
  // Main view elements
  const loginView = document.getElementById('login-view');
  const mainView = document.getElementById('main-view');
  const loginButton = document.getElementById('login-google');
  const logoutButton = a-zA-Z0-9_-('logout');

  // Evaluate candidate elements
  const evaluateCandidateButton = document.getElementById('evaluate-candidate');
  const jobRequirements = document.getElementById('job-requirements');
  const resultsDiv = document.getElementById('results');
  
  // Get contact info elements
  const getContactInfoButton = document.getElementById('get-contact-info');

  // Boolean search elements
  const generateBooleanView = document.getElementById('generate-boolean-view');
  const showGenerateBooleanButton = document.getElementById('show-generate-boolean');
  const backToMainFromBooleanButton = document.getElementById('back-to-main-from-boolean');
  const generateBooleanActionButton = document.getElementById('generate-boolean-action');
  const jobTitleInput = document.getElementById('job-title');
  const jobDescriptionInput = document.getElementById('job-description');
  const booleanResultsDiv = document.getElementById('boolean-results');

  // Generate content elements
  const generateContentView = document.getElementById('generate-content-view');
  const showGenerateContentButton = document.getElementById('show-generate-content');
  const backToMainFromContentButton = document.getElementById('back-to-main-from-content');
  const generateContentActionButton = document.getElementById('generate-content-action');
  const contentPromptInput = document.getElementById('content-prompt');
  const contentResultsDiv = document.getElementById('content-results');


  // Auth state observer
  onAuthStateChanged(auth, user => {
    if (user) {
      loginView.style.display = 'none';
      mainView.style.display = 'block';
      chrome.storage.local.set({ user: user });
    } else {
      loginView.style.display = 'block';
      mainView.style.display = 'none';
      chrome.storage.local.remove('user');
    }
  });

  // Google Sign-In
  loginButton.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .catch(error => {
        console.error('Google Sign-In Error:', error);
        resultsDiv.innerHTML = `<p>Error during sign-in: ${error.message}</p>`;
      });
  });

  // Logout
  logoutButton.addEventListener('click', () => {
    signOut(auth);
  });

  // Evaluate Candidate
  evaluateCandidateButton.addEventListener('click', function() {
    resultsDiv.innerHTML = 'Evaluating...';
    chrome.runtime.sendMessage({
      action: 'evaluate-candidate',
      requirements: jobRequirements.value
    });
  });

  // Get Contact Info
  getContactInfoButton.addEventListener('click', function() {
    resultsDiv.innerHTML = 'Getting contact info...';
    chrome.runtime.sendMessage({ action: 'get-contact-info' });
  });

  // Show Boolean Search View
  showGenerateBooleanButton.addEventListener('click', () => {
    mainView.style.display = 'none';
    generateBooleanView.style.display = 'block';
  });

  // Back to Main from Boolean
  backToMainFromBooleanButton.addEventListener('click', () => {
    generateBooleanView.style.display = 'none';
    mainView.style.display = 'block';
  });

  // Generate Boolean Action
  generateBooleanActionButton.addEventListener('click', () => {
    booleanResultsDiv.innerHTML = 'Generating...';
    chrome.runtime.sendMessage({
      action: 'generate-boolean',
      data: {
        jobTitle: jobTitleInput.value,
        description: jobDescriptionInput.value
      }
    });
  });

  // Show Generate Content View
  showGenerateContentButton.addEventListener('click', () => {
    mainView.style.display = 'none';
    generateContentView.style.display = 'block';
  });

  // Back to Main from Content
  backToMainFromContentButton.addEventListener('click', () => {
    generateContentView.style.display = 'none';
    mainView.style.display = 'block';
  });
  
  // Generate Content Action
  generateContentActionButton.addEventListener('click', function() {
    contentResultsDiv.innerHTML = 'Generating...';
    chrome.runtime.sendMessage({
      action: 'generate-content',
      data: {
        userInput: contentPromptInput.value
      }
    });
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'display-results') {
      const { success, summary, match_score, strengths, concerns, recommendation, error } = request.data;
      if (success) {
        resultsDiv.innerHTML = `
          <h3>Analysis Complete</h3>
          <p><strong>Recommendation:</strong> ${recommendation}</p>
          <p><strong>Match Score:</strong> ${match_score}%</p>
          <p><strong>Summary:</strong> ${summary}</p>
          <h4>Strengths:</h4>
          <ul>
            ${strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
          <h4>Concerns:</h4>
          <ul>
            ${concerns.map(c => `<li>${c}</li>`).join('')}
          </ul>
        `;
      } else {
        resultsDiv.innerHTML = `<p>Error: ${error}</p>`;
      }
    } else if (request.action === 'display-contact-info') {
      const { email, phone, work_email, personal_emails, mobile_phone, phone_numbers, social_profiles, message, error } = request.data;
      if (error) {
        resultsDiv.innerHTML = `<p>Error: ${error}</p>`;
        return;
      }
      if (message && !email && !phone) {
        resultsDiv.innerHTML = `<p>${message}</p>`;
      } else {
        resultsDiv.innerHTML = `
          <h3>Contact Info Found</h3>
          ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${work_email ? `<p><strong>Work Email:</strong> ${work_email}</p>` : ''}
          ${mobile_phone ? `<p><strong>Mobile Phone:</strong> ${mobile_phone}</p>` : ''}
          ${personal_emails && personal_emails.length > 0 ? `<h4>Personal Emails:</h4><ul>${personal_emails.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
          ${phone_numbers && phone_numbers.length > 0 ? `<h4>Phone Numbers:</h4><ul>${phone_numbers.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
          ${social_profiles && social_profiles.length > 0 ? `<h4>Social Profiles:</h4><ul>${social_profiles.map(s => `<li><a href="${s.url}" target="_blank">${s.type}</a></li>`).join('')}</ul>` : ''}
        `;
      }
    } else if (request.action === 'display-boolean-search') {
      const { success, searchString, error } = request.data;
      if (success) {
        booleanResultsDiv.innerHTML = `<textarea readonly style="width: 100%; height: 100px;">${searchString}</textarea>`;
      } else {
        booleanResultsDiv.innerHTML = `<p>Error: ${error}</p>`;
      }
    } else if (request.action === 'display-content') {
      const { success, content, error } = request.data;
      if (success) {
        contentResultsDiv.innerHTML = `<div style="white-space: pre-wrap; width: 100%; height: 150px; overflow-y: scroll; border: 1px solid #ccc; padding: 5px;">${content}</div>`;
      } else {
        contentResultsDiv.innerHTML = `<p>Error: ${error}</p>`;
      }
    }
  });
});
