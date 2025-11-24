const functions = require('firebase-functions');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.githubProfile = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    // Initialize Supabase client for auth verification
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }

    const requestData = req.body || {};
    console.log("GitHub Profile request:", JSON.stringify(requestData).substring(0, 200));

    // Validate input
    const { github_url, username } = requestData;

    if (!github_url && !username) {
      res.status(400).json({
        error: 'github_url or username is required'
      });
      return;
    }

    // Extract username from URL if provided
    let githubUsername = username;
    if (github_url && !username) {
      const urlMatch = github_url.match(/github\.com\/([^\/]+)/);
      if (urlMatch) {
        githubUsername = urlMatch[1];
      } else {
        res.status(400).json({
          error: 'Invalid GitHub URL format'
        });
        return;
      }
    }

    // Analyze GitHub profile
    const profileAnalysis = await analyzeGitHubProfile(githubUsername);

    if (!profileAnalysis) {
      res.status(404).json({
        error: 'GitHub profile not found or inaccessible',
        username: githubUsername
      });
      return;
    }

    res.status(200).json(profileAnalysis);

  } catch (error) {
    console.error('Error in github-profile function:', error);

    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      type: error.constructor?.name || 'Error',
      timestamp: new Date().toISOString()
    };

    // Special handling for common errors
    if (errorMessage.includes('API rate limit')) {
      errorResponse.suggestion = 'GitHub API rate limit exceeded. Please try again later.';
    } else if (errorMessage.includes('Missing GitHub token')) {
      errorResponse.suggestion = 'Please configure GITHUB_TOKEN in Cloud Functions environment variables';
    }

    console.error('Detailed error:', errorResponse);

    res.status(500).json(errorResponse);
  }
});

async function analyzeGitHubProfile(username) {
  console.log(`Analyzing GitHub profile for: ${username}`);

  const githubToken = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Apply-Codes-Recruitment-Platform'
  };

  // Add token if available for higher rate limits
  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  try {
    // Fetch user profile
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers
    });

    const userProfile = userResponse.data;

    // Fetch user repositories
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers
    });

    const repositories = reposResponse.data;

    // Fetch user events for activity analysis
    const eventsResponse = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, {
      headers
    });

    const events = eventsResponse.data;

    // Analyze the data
    const analysis = await performProfileAnalysis(userProfile, repositories, events);

    return {
      profile: {
        username: userProfile.login,
        name: userProfile.name,
        bio: userProfile.bio,
        location: userProfile.location,
        company: userProfile.company,
        blog: userProfile.blog,
        email: userProfile.email,
        followers: userProfile.followers,
        following: userProfile.following,
        public_repos: userProfile.public_repos,
        avatar_url: userProfile.avatar_url,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      },
      analysis,
      repositories: repositories.slice(0, 20), // Top 20 most recent repos
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      console.error('GitHub API error:', status, errorData);

      // Handle specific GitHub API errors
      if (status === 404) {
        console.log('GitHub user not found');
        return null;
      } else if (status === 403) {
        if (errorData.message && errorData.message.includes('rate limit')) {
          throw new Error('GitHub API rate limit exceeded');
        }
        throw new Error('GitHub API access forbidden');
      } else if (status === 401) {
        throw new Error('Invalid GitHub token');
      }

      throw new Error(`GitHub API error: ${status} - ${errorData.message || 'Unknown error'}`);
    }

    console.error('Error calling GitHub API:', error);
    throw error;
  }
}

async function performProfileAnalysis(userProfile, repositories, events) {
  // Programming languages analysis
  const languageStats = analyzeLanguages(repositories);

  // Activity analysis
  const activityStats = analyzeActivity(events);

  // Repository analysis
  const repoStats = analyzeRepositories(repositories);

  // Contribution patterns
  const contributionPatterns = analyzeContributions(events);

  // Skills and expertise assessment
  const skillsAssessment = assessSkills(repositories, languageStats, activityStats);

  // Developer metrics
  const metrics = calculateDeveloperMetrics(userProfile, repositories, events);

  return {
    languages: languageStats,
    activity: activityStats,
    repositories: repoStats,
    contributions: contributionPatterns,
    skills: skillsAssessment,
    metrics,
    summary: generateProfileSummary(userProfile, languageStats, activityStats, repoStats, metrics)
  };
}

function analyzeLanguages(repositories) {
  const languageCounts = {};
  const languageBytes = {};

  repositories.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      // Size as proxy for code amount in that language
      languageBytes[repo.language] = (languageBytes[repo.language] || 0) + (repo.size || 0);
    }
  });

  const totalRepos = Object.values(languageCounts).reduce((a, b) => a + b, 0);
  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);

  const languageStats = Object.entries(languageCounts).map(([language, count]) => ({
    language,
    repositories: count,
    percentage: ((count / totalRepos) * 100).toFixed(1),
    size_bytes: languageBytes[language],
    size_percentage: totalBytes > 0 ? ((languageBytes[language] / totalBytes) * 100).toFixed(1) : '0'
  })).sort((a, b) => b.repositories - a.repositories);

  return {
    primary_languages: languageStats.slice(0, 5),
    all_languages: languageStats,
    total_languages: languageStats.length
  };
}

function analyzeActivity(events) {
  const eventTypes = {};
  const recentActivity = [];
  const activityByMonth = {};

  events.forEach(event => {
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

    const eventDate = new Date(event.created_at);
    const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
    activityByMonth[monthKey] = (activityByMonth[monthKey] || 0) + 1;

    if (recentActivity.length < 10) {
      recentActivity.push({
        type: event.type,
        repo: event.repo?.name,
        created_at: event.created_at
      });
    }
  });

  const sortedActivity = Object.entries(activityByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  return {
    total_events: events.length,
    event_types: eventTypes,
    recent_activity: recentActivity,
    monthly_activity: sortedActivity,
    most_active_month: sortedActivity[0] || null
  };
}

function analyzeRepositories(repositories) {
  const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const totalSize = repositories.reduce((sum, repo) => sum + (repo.size || 0), 0);

  const forkedRepos = repositories.filter(repo => repo.fork).length;
  const originalRepos = repositories.filter(repo => !repo.fork).length;

  const mostStarred = repositories
    .filter(repo => !repo.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5);

  const mostRecent = repositories
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return {
    total_repositories: repositories.length,
    original_repositories: originalRepos,
    forked_repositories: forkedRepos,
    total_stars: totalStars,
    total_forks: totalForks,
    total_size_kb: totalSize,
    average_stars_per_repo: originalRepos > 0 ? (totalStars / originalRepos).toFixed(1) : '0',
    most_starred: mostStarred.map(repo => ({
      name: repo.name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      description: repo.description
    })),
    most_recent: mostRecent.map(repo => ({
      name: repo.name,
      language: repo.language,
      updated_at: repo.updated_at,
      description: repo.description
    }))
  };
}

function analyzeContributions(events) {
  const pushEvents = events.filter(event => event.type === 'PushEvent');
  const prEvents = events.filter(event => event.type === 'PullRequestEvent');
  const issueEvents = events.filter(event => event.type === 'IssuesEvent');

  const commitCount = pushEvents.reduce((sum, event) => {
    return sum + (event.payload?.commits?.length || 0);
  }, 0);

  return {
    total_commits_recent: commitCount,
    pull_requests: prEvents.length,
    issues_involved: issueEvents.length,
    push_events: pushEvents.length,
    contribution_score: calculateContributionScore(pushEvents, prEvents, issueEvents)
  };
}

function calculateContributionScore(pushEvents, prEvents, issueEvents) {
  // Simple scoring algorithm
  const pushScore = pushEvents.length * 2;
  const prScore = prEvents.length * 5;
  const issueScore = issueEvents.length * 3;

  return pushScore + prScore + issueScore;
}

function assessSkills(repositories, languageStats, activityStats) {
  const skills = [];

  // Extract skills from languages
  languageStats.primary_languages.forEach(lang => {
    skills.push({
      skill: lang.language,
      type: 'Programming Language',
      proficiency: calculateLanguageProficiency(lang),
      evidence: `${lang.repositories} repositories, ${lang.percentage}% of total`
    });
  });

  // Extract framework/technology skills from repository names and descriptions
  const techKeywords = {
    'React': /react/i,
    'Vue': /vue/i,
    'Angular': /angular/i,
    'Node.js': /node|nodejs/i,
    'Express': /express/i,
    'Django': /django/i,
    'Flask': /flask/i,
    'Spring': /spring/i,
    'Docker': /docker/i,
    'Kubernetes': /kubernetes|k8s/i,
    'AWS': /aws|amazon/i,
    'Machine Learning': /ml|machine.learning|tensorflow|pytorch/i,
    'Data Science': /data.science|pandas|numpy|jupyter/i,
    'Mobile': /android|ios|mobile|react.native/i,
    'DevOps': /devops|ci\/cd|jenkins|gitlab/i
  };

  Object.entries(techKeywords).forEach(([tech, regex]) => {
    const matchingRepos = repositories.filter(repo =>
      regex.test(repo.name) || regex.test(repo.description || '')
    );

    if (matchingRepos.length > 0) {
      skills.push({
        skill: tech,
        type: 'Framework/Technology',
        proficiency: matchingRepos.length > 3 ? 'Advanced' : matchingRepos.length > 1 ? 'Intermediate' : 'Beginner',
        evidence: `${matchingRepos.length} related repositories`
      });
    }
  });

  return skills;
}

function calculateLanguageProficiency(langStats) {
  const repoCount = langStats.repositories;
  const percentage = parseFloat(langStats.percentage);

  if (repoCount >= 10 && percentage >= 30) return 'Expert';
  if (repoCount >= 5 && percentage >= 20) return 'Advanced';
  if (repoCount >= 3 && percentage >= 10) return 'Intermediate';
  return 'Beginner';
}

function calculateDeveloperMetrics(userProfile, repositories, events) {
  const accountAge = Math.floor((new Date() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24 * 365));
  const reposPerYear = accountAge > 0 ? (repositories.length / accountAge).toFixed(1) : repositories.length;

  const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const avgStarsPerRepo = repositories.length > 0 ? (totalStars / repositories.length).toFixed(1) : '0';

  const activityScore = calculateActivityScore(events, repositories);
  const influenceScore = calculateInfluenceScore(userProfile, repositories);

  return {
    account_age_years: accountAge,
    repositories_per_year: parseFloat(reposPerYear),
    average_stars_per_repository: parseFloat(avgStarsPerRepo),
    activity_score: activityScore,
    influence_score: influenceScore,
    developer_level: calculateDeveloperLevel(activityScore, influenceScore, accountAge),
    specialization: determineSpecialization(repositories)
  };
}

function calculateActivityScore(events, repositories) {
  const recentEvents = events.length;
  const recentRepos = repositories.filter(repo => {
    const updated = new Date(repo.updated_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return updated > sixMonthsAgo;
  }).length;

  return Math.min(100, (recentEvents * 2) + (recentRepos * 10));
}

function calculateInfluenceScore(userProfile, repositories) {
  const followers = userProfile.followers || 0;
  const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

  return Math.min(100, (followers * 2) + (totalStars * 0.5) + (totalForks * 1));
}

function calculateDeveloperLevel(activityScore, influenceScore, accountAge) {
  const combinedScore = (activityScore + influenceScore) / 2;
  const experienceBonus = Math.min(accountAge * 5, 25);
  const finalScore = combinedScore + experienceBonus;

  if (finalScore >= 80) return 'Senior';
  if (finalScore >= 60) return 'Mid-level';
  if (finalScore >= 40) return 'Junior';
  return 'Entry-level';
}

function determineSpecialization(repositories) {
  const languageCounts = {};
  repositories.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  const topLanguage = Object.entries(languageCounts)
    .sort(([,a], [,b]) => b - a)[0];

  if (!topLanguage) return 'General Development';

  const specializations = {
    'JavaScript': 'Frontend/Full-stack Development',
    'TypeScript': 'Frontend/Full-stack Development',
    'React': 'Frontend Development',
    'Python': 'Backend/Data Science',
    'Java': 'Backend/Enterprise Development',
    'Go': 'Backend/Systems Programming',
    'Rust': 'Systems Programming',
    'C++': 'Systems/Game Development',
    'C#': 'Enterprise/.NET Development',
    'Swift': 'iOS Development',
    'Kotlin': 'Android Development',
    'PHP': 'Web Development',
    'Ruby': 'Web Development',
    'Scala': 'Big Data/Backend Development'
  };

  return specializations[topLanguage[0]] || `${topLanguage[0]} Development`;
}

function generateProfileSummary(userProfile, languageStats, activityStats, repoStats, metrics) {
  const primaryLanguage = languageStats.primary_languages[0]?.language || 'Unknown';
  const totalStars = repoStats.total_stars;
  const level = metrics.developer_level;
  const specialization = metrics.specialization;

  return {
    headline: `${level} developer specializing in ${specialization}`,
    key_strengths: [
      `Primary language: ${primaryLanguage}`,
      `${repoStats.original_repositories} original repositories`,
      `${totalStars} total stars across projects`,
      `${activityStats.total_events} recent activities`
    ],
    profile_strength: calculateProfileStrength(userProfile, repoStats, activityStats),
    recommended_roles: generateRecommendedRoles(specialization, level, languageStats)
  };
}

function calculateProfileStrength(userProfile, repoStats, activityStats) {
  let score = 0;

  // Profile completeness
  if (userProfile.bio) score += 10;
  if (userProfile.location) score += 5;
  if (userProfile.company) score += 10;
  if (userProfile.blog) score += 5;

  // Repository quality
  if (repoStats.original_repositories > 5) score += 20;
  if (repoStats.total_stars > 10) score += 15;
  if (repoStats.total_stars > 50) score += 10;

  // Activity level
  if (activityStats.total_events > 50) score += 20;
  if (activityStats.total_events > 100) score += 5;

  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Good';
  return 'Developing';
}

function generateRecommendedRoles(specialization, level, languageStats) {
  const roles = [];
  const primaryLang = languageStats.primary_languages[0]?.language;

  // Base roles by specialization
  const specializationRoles = {
    'Frontend/Full-stack Development': ['Frontend Developer', 'Full-stack Developer', 'React Developer'],
    'Backend/Data Science': ['Backend Developer', 'Data Scientist', 'Python Developer'],
    'Mobile Development': ['Mobile Developer', 'iOS Developer', 'Android Developer'],
    'Systems Programming': ['Systems Engineer', 'DevOps Engineer', 'Platform Engineer'],
    'Enterprise/.NET Development': ['Enterprise Developer', '.NET Developer', 'Software Engineer']
  };

  // Get base roles
  const baseRoles = specializationRoles[specialization] || ['Software Developer', 'Software Engineer'];

  // Adjust by level
  baseRoles.forEach(role => {
    if (level === 'Senior') {
      roles.push(`Senior ${role}`, `Lead ${role}`);
    } else if (level === 'Mid-level') {
      roles.push(role, `Mid-level ${role}`);
    } else {
      roles.push(`Junior ${role}`, role);
    }
  });

  // Add language-specific roles
  if (primaryLang) {
    roles.push(`${primaryLang} Developer`);
  }

  return [...new Set(roles)].slice(0, 6); // Remove duplicates and limit to 6
}