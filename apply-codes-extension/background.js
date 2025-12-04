chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Received action:', request.action);
  if (request.action === 'evaluate-candidate') {
    const { requirements } = request;

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
            console.log('Candidate Profile:', candidateProfile);
            console.log('Job Requirements:', requirements);

            // Placeholder for Firebase call
            // In the next step, we will replace this with a real call to the Firebase function.
            const dummyResponse = {
              success: true,
              summary: 'This is a dummy summary.',
              match_score: 85,
              strengths: ['Strength 1', 'Strength 2'],
              concerns: ['Concern 1'],
              recommendation: 'maybe'
            };

            chrome.runtime.sendMessage({ action: 'display-results', data: dummyResponse });
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
    // Logic to get contact info
  } else if (request.action === 'generate-boolean') {
    // Logic to generate boolean
  } else if (request.action === 'generate-content') {
    // Logic to generate content
  }
  return true; // Indicates that the response will be sent asynchronously
});
