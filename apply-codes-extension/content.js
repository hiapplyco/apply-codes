// This script is injected into LinkedIn profile pages.
// It extracts the candidate's name and profile information.

function getCandidateProfile() {
  const nameElement = document.querySelector('h1');
  const name = nameElement ? nameElement.innerText : 'Unknown';

  // This is a very simplified way to get the profile text.
  // A more robust solution would be to traverse the DOM and extract
  // relevant sections like experience, education, skills, etc.
  const profileText = document.body.innerText;

  return {
    name: name,
    profile: profileText
  };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'get-candidate-profile') {
    sendResponse(getCandidateProfile());
  }
});

// To handle the case where the script is injected after the page is loaded
if (document.readyState === "complete") {
  // The page is already loaded, do nothing special.
  // The background script will message this script when it's time to act.
}