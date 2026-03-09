# Raw User Input

I want to introduce a new feature. It's going to be a browser use function for Chrome (using the Apply extension) to navigate a LinkedIn Recruiter dashboard, or a LinkedIn Recruiter Lite dashboard, or even just navigating any candidate database to find candidates autonomously.

I want to be a recruiter, tell the AI agent what I'm looking for including location, skills, etc... and I'm logged in to the dashboard already, and it takes over and finds the candidates and drops them into an exportable table (in the extension) that I can copy or share of the results.

## User Decisions
- **Dashboards:** All three - LinkedIn Recruiter (full), Recruiter Lite, and regular LinkedIn search
- **Automation approach:** Extension content scripts (pure Chrome extension, inject scripts that interact with LinkedIn DOM directly)
- **No external dependencies** for browser control
