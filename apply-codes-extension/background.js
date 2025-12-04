import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received action:', request.action);
  if (request.action === 'evaluate-candidate') {
    const { requirements } = request;

    if (!currentUser) {
      chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'You must be logged in to use this feature.' } });
      return true;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        }).then(() => {
          chrome.tabs.sendMessage(activeTab.id, { action: 'get-candidate-profile' }, function(response) {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'Could not communicate with the content script.' } });
              return;
            }

            const candidateProfile = response;

            const analyzeCandidate = httpsCallable(functions, 'analyzeCandidate');
            analyzeCandidate({ candidate: candidateProfile, requirements: requirements })
              .then((result) => {
                chrome.runtime.sendMessage({ action: 'display-results', data: result.data });
              })
              .catch((error) => {
                console.error("Error calling analyzeCandidate function:", error);
                chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: error.message } });
              });
          });
        }).catch(err => {
          console.error('Failed to inject script:', err);
          chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'Failed to inject content script.' } });
        });
      } else {
        chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'No active tab found.' } });
      }
    });

  } else if (request.action === 'get-contact-info') {
    if (!currentUser) {
      chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'You must be logged in to use this feature.' } });
      return true;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url) {
        currentUser.getIdToken().then(token => {
          // Note: The function URL is constructed from the Firebase project ID.
          // You may need to change the region if your functions are not in 'us-central1'.
          const functionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/getContactInfo`;
          
          fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profileUrl: activeTab.url })
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            chrome.runtime.sendMessage({ action: 'display-contact-info', data: data });
          })
          .catch(error => {
            console.error("Error calling getContactInfo function:", error);
            chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: error.message } });
          });
        });
      } else {
        chrome.runtime.sendMessage({ action: 'display-results', data: { success: false, error: 'Could not get the active tab\'s URL.' } });
      }
    });
  } else if (request.action === 'generate-boolean') {
    const { jobTitle, description } = request.data;
    const payload = {
      jobTitle,
      description
    };

    if (currentUser) {
      payload.userId = currentUser.uid;
    }

    const generateBooleanSearch = httpsCallable(functions, 'generateBooleanSearch');
    generateBooleanSearch(payload)
      .then((result) => {
        chrome.runtime.sendMessage({ action: 'display-boolean-search', data: result.data });
      })
      .catch((error) => {
        console.error("Error calling generateBooleanSearch function:", error);
        chrome.runtime.sendMessage({ action: 'display-boolean-search', data: { success: false, error: error.message } });
      });

  } else if (request.action === 'generate-content') {
    const { userInput } = request.data;
    const functionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/generateContent`;
    
    const payload = {
      userInput: userInput,
      contentType: 'recruiting_email',
      systemPrompt: 'You are an expert recruiter writing outreach content. Your tone should be professional, friendly, and engaging. Do not include a subject line.'
    };

    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      chrome.runtime.sendMessage({ action: 'display-content', data: data });
    })
    .catch(error => {
      console.error("Error calling generateContent function:", error);
      chrome.runtime.sendMessage({ action: 'display-content', data: { success: false, error: error.message } });
    });
  }
  return true; // Indicates that the response will be sent asynchronously
});
