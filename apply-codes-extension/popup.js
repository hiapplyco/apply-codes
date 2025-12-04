document.addEventListener('DOMContentLoaded', function() {
  const evaluateCandidateButton = document.getElementById('evaluate-candidate');
  const getContactInfoButton = document.getElementById('get-contact-info');
  const generateBooleanButton = document.getElementById('generate-boolean');
  const generateContentButton = document.getElementById('generate-content');
  const jobRequirements = document.getElementById('job-requirements');
  const resultsDiv = document.getElementById('results');

  evaluateCandidateButton.addEventListener('click', function() {
    resultsDiv.innerHTML = 'Evaluating...';
    chrome.runtime.sendMessage({
      action: 'evaluate-candidate',
      requirements: jobRequirements.value
    });
  });

  getContactInfoButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'get-contact-info' });
  });

  generateBooleanButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'generate-boolean' });
  });

  generateContentButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'generate-content' });
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'display-results') {
      const { success, summary, match_score, strengths, concerns, recommendation } = request.data;
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
        resultsDiv.innerHTML = `<p>Error: ${request.data.error}</p>`;
      }
    }
  });
});
