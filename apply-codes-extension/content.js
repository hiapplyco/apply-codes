// This script is injected into LinkedIn profile pages.
// It extracts the candidate's name and profile information in a more structured way.

function getCandidateProfile() {
  const nameElement = document.querySelector('h1');
  const name = nameElement ? nameElement.innerText.trim() : 'Unknown';

  let headline = '';
  if (nameElement) {
    // The headline is usually in a div that's a sibling to the h1's parent
    const headlineElement = nameElement.parentElement.nextElementSibling;
    if (headlineElement) {
      headline = headlineElement.innerText.trim();
    }
  }

  const experienceSection = document.getElementById('experience');
  const educationSection = document.getElementById('education');

  let experienceText = '';
  if (experienceSection) {
    experienceText = Array.from(experienceSection.querySelectorAll('ul > li')).map(li => li.innerText).join('\\n\\n');
  }

  let educationText = '';
  if (educationSection) {
    educationText = Array.from(educationSection.querySelectorAll('ul > li')).map(li => li.innerText).join('\\n\\n');
  }

  const profile = `
Name: ${name}
Headline: ${headline}

---
Experience:
${experienceText}

---
Education:
${educationText}
  `;

  return {
    name: name,
    profile: profile.trim()
  };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'get-candidate-profile') {
    sendResponse(getCandidateProfile());
  }
  return true; // Keep the message channel open for async response
});