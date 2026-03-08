const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");
const { getModel } = require("./utils/gemini");
const { executeSerperSearch } = require("./utils/serper");
const {
  generateCacheKey,
  getCachedResults,
  setCachedResults,
} = require("./utils/search-cache");

/**
 * Source configurations for multi-source candidate search.
 * Mirrors src/types/candidate-search.ts SOURCE_CONFIGS.
 */
const SOURCE_CONFIGS = {
  linkedin: {
    id: "linkedin",
    siteRestriction: "site:linkedin.com/in/",
    excludeTerms: [],
    isPortfolio: false,
    ttlHours: 24,
  },
  indeed: {
    id: "indeed",
    siteRestriction: "site:indeed.com/r/",
    excludeTerms: [],
    isPortfolio: false,
    ttlHours: 48,
  },
  github: {
    id: "github",
    siteRestriction: "site:github.com",
    excludeTerms: [
      "-site:github.com/orgs",
      "-site:github.com/topics",
      "-site:github.com/marketplace",
      "-site:github.com/trending",
    ],
    isPortfolio: false,
    ttlHours: 72,
  },
  stackoverflow: {
    id: "stackoverflow",
    siteRestriction: "site:stackoverflow.com/users/",
    excludeTerms: [],
    isPortfolio: false,
    ttlHours: 72,
  },
  glassdoor: {
    id: "glassdoor",
    siteRestriction: "site:glassdoor.com/member/",
    excludeTerms: [],
    isPortfolio: false,
    ttlHours: 72,
  },
  behance: {
    id: "behance",
    siteRestriction: "site:behance.net",
    excludeTerms: [],
    isPortfolio: true,
    ttlHours: 72,
  },
  dribbble: {
    id: "dribbble",
    siteRestriction: "site:dribbble.com",
    excludeTerms: [],
    isPortfolio: true,
    ttlHours: 72,
  },
};

const VALID_SOURCES = Object.keys(SOURCE_CONFIGS);

/**
 * Multi-source candidate search cloud function.
 *
 * Executes parallel x-ray searches across selected platforms via Serper.dev,
 * parses and normalizes results, calculates match scores, and caches in Firestore.
 */
const candidateSearch = onCall(
  {
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: ["SERPER_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const startTime = Date.now();

    try {
      const {
        keywords,
        sources = ["linkedin", "indeed", "github"],
        location,
        experienceLevel,
        page = 1,
        resultsPerSource = 10,
        useAIGeneration = true,
      } = data;

      // Validate keywords
      if (!keywords || typeof keywords !== "string" || !keywords.trim()) {
        throw new HttpsError(
          "invalid-argument",
          "Keywords parameter is required and must be a non-empty string"
        );
      }

      // Validate sources
      const validatedSources = (Array.isArray(sources) ? sources : [sources])
        .filter((s) => VALID_SOURCES.includes(s));

      if (validatedSources.length === 0) {
        throw new HttpsError(
          "invalid-argument",
          `No valid sources provided. Valid sources: ${VALID_SOURCES.join(", ")}`
        );
      }

      const validatedPage = Math.max(parseInt(page) || 1, 1);
      const validatedNum = Math.min(Math.max(parseInt(resultsPerSource) || 10, 1), 20);

      logger.info("[candidate-search] Search request", {
        keywords: keywords.substring(0, 60),
        sources: validatedSources,
        location,
        page: validatedPage,
      });

      // Step 1: Check cache
      const cacheKey = generateCacheKey({
        keywords,
        sources: validatedSources,
        location,
        experienceLevel,
        page: validatedPage,
      });

      const cached = await getCachedResults(cacheKey);
      if (cached) {
        logger.info("[candidate-search] Returning cached results");
        return { ...cached, data: { ...cached.data, metadata: { ...cached.data.metadata, cached: true } } };
      }

      // Step 2: Generate boolean query
      let booleanQuery;
      try {
        if (useAIGeneration) {
          booleanQuery = await generateAIBooleanQuery(keywords, location, experienceLevel);
        } else {
          booleanQuery = generateBasicBooleanQuery(keywords, location, experienceLevel);
        }
      } catch (err) {
        logger.warn("[candidate-search] AI boolean failed, using basic", err.message);
        booleanQuery = generateBasicBooleanQuery(keywords, location, experienceLevel);
      }

      logger.info("[candidate-search] Boolean query generated", {
        length: booleanQuery.length,
        preview: booleanQuery.substring(0, 80),
      });

      // Step 3: Execute parallel searches across all sources
      const sourcePromises = validatedSources.map((source) =>
        searchSource(source, booleanQuery, location, validatedNum, validatedPage)
      );

      const sourceResults = await Promise.allSettled(sourcePromises);

      // Step 4: Collect results
      const sourcesSucceeded = [];
      const sourcesFailed = [];
      const allSourceData = [];

      sourceResults.forEach((result, i) => {
        const source = validatedSources[i];
        if (result.status === "fulfilled") {
          sourcesSucceeded.push(source);
          allSourceData.push(result.value);
        } else {
          sourcesFailed.push(source);
          allSourceData.push({
            source,
            results: [],
            totalEstimated: 0,
            status: "rejected",
            error: result.reason?.message || "Unknown error",
            latencyMs: 0,
          });
        }
      });

      // Step 5: Merge all results and calculate match scores
      const allResults = allSourceData.flatMap((sd) => sd.results);
      const scoredResults = calculateMatchScores(allResults, keywords, experienceLevel);

      const response = {
        success: true,
        data: {
          sources: allSourceData,
          merged: scoredResults,
          metadata: {
            totalFound: scoredResults.length,
            sourcesQueried: validatedSources,
            sourcesSucceeded,
            sourcesFailed,
            page: validatedPage,
            keywords,
            location: location || undefined,
            experienceLevel: experienceLevel || undefined,
            booleanQuery,
            searchTime: new Date().toISOString(),
            cacheKey,
            cached: false,
          },
        },
      };

      // Step 6: Cache results asynchronously (don't block response)
      const maxTtl = Math.min(
        ...validatedSources.map((s) => SOURCE_CONFIGS[s].ttlHours)
      );
      setCachedResults(cacheKey, response, maxTtl).catch(() => {});

      const elapsed = Date.now() - startTime;
      logger.info("[candidate-search] Complete", {
        totalResults: scoredResults.length,
        sourcesSucceeded: sourcesSucceeded.length,
        sourcesFailed: sourcesFailed.length,
        elapsedMs: elapsed,
      });

      return response;
    } catch (error) {
      logger.error("[candidate-search] Error", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message || "Internal server error");
    }
  }
);

// ─── Search Execution ─────────────────────────────────────────────────────────

/**
 * Search a single source via Serper.dev and parse results.
 */
async function searchSource(source, booleanQuery, location, num, page) {
  const config = SOURCE_CONFIGS[source];
  let q = `${config.siteRestriction} ${booleanQuery}`;

  if (config.excludeTerms.length > 0) {
    q += " " + config.excludeTerms.join(" ");
  }

  const query = {
    q,
    gl: "us",
    num,
    page,
    ...(location ? { location } : {}),
  };

  const start = Date.now();
  const serperResult = await executeSerperSearch(query);
  const latencyMs = Date.now() - start;

  const results = serperResult.organic.map((item, index) =>
    parseResult(item, source, index)
  );

  return {
    source,
    results,
    totalEstimated: parseInt(serperResult.searchInformation?.totalResults) || results.length,
    status: "fulfilled",
    latencyMs,
  };
}

// ─── Result Parsers ───────────────────────────────────────────────────────────

/**
 * Parse a single Serper organic result into a normalized CandidateResult.
 */
function parseResult(item, source, index) {
  const parsers = {
    linkedin: parseLinkedInResult,
    indeed: parseIndeedResult,
    github: parseGitHubResult,
    stackoverflow: parseStackOverflowResult,
    glassdoor: parseGlassdoorResult,
    behance: parsePortfolioResult,
    dribbble: parsePortfolioResult,
  };

  const parser = parsers[source] || parseGenericResult;
  const parsed = parser(item, source);

  return {
    id: `${source}-${Date.now()}-${index}`,
    source,
    name: parsed.name || "Name not available",
    title: parsed.title || "Title not specified",
    company: parsed.company || "",
    location: parsed.location || "",
    profileUrl: item.link || "",
    snippet: item.snippet || "",
    skills: extractSkillsFromText(item.snippet || "", item.title || ""),
    matchScore: 0,
    searchRank: index + 1,
    serperPosition: item.position || index + 1,
    meta: parsed.meta || {},
  };
}

/**
 * LinkedIn: "FirstName LastName - Title at Company | LinkedIn"
 */
function parseLinkedInResult(item) {
  const title = item.title || "";
  const snippet = item.snippet || "";

  let name = "";
  let jobTitle = "";
  let company = "";
  let location = "";

  // Pattern: "Name - Title at Company | LinkedIn" or "Name | Title | LinkedIn"
  const pipeMatch = title.match(/^(.+?)\s*[-–|]\s*(.+?)(?:\s*[-–|]\s*LinkedIn)?$/i);
  if (pipeMatch) {
    name = pipeMatch[1].replace(/LinkedIn/i, "").trim();
    const roleStr = pipeMatch[2].replace(/LinkedIn/i, "").trim();
    const atIdx = roleStr.lastIndexOf(" at ");
    if (atIdx > -1) {
      jobTitle = roleStr.substring(0, atIdx).trim();
      company = roleStr.substring(atIdx + 4).trim();
    } else {
      jobTitle = roleStr;
    }
  }

  // Extract location from snippet
  const locMatch = snippet.match(
    /(?:Location:|Based in:|Located in:|·)\s*([^.·\n]+)/i
  );
  if (locMatch) {
    const candidate = locMatch[1].trim();
    if (candidate.length < 60) location = candidate;
  }

  return { name, title: jobTitle, company, location, meta: {} };
}

/**
 * Indeed: "FirstName LastName - City, State | Indeed.com"
 */
function parseIndeedResult(item) {
  const title = item.title || "";
  const snippet = item.snippet || "";

  let name = "";
  let jobTitle = "";
  let location = "";

  // Pattern: "Name - Location | Indeed.com"
  const match = title.match(/^(.+?)\s*[-–]\s*(.+?)(?:\s*\|.*)?$/);
  if (match) {
    name = match[1].trim();
    const rest = match[2].replace(/Indeed\.com/i, "").trim();
    // If rest looks like a location (City, ST), use it
    if (/[A-Z][a-z]+,\s*[A-Z]{2}/.test(rest)) {
      location = rest;
    } else {
      jobTitle = rest;
    }
  }

  // Extract job title from snippet
  if (!jobTitle) {
    const titleMatch = snippet.match(
      /(?:^|\.\s*)([^.]+(?:engineer|developer|manager|analyst|designer|architect|specialist|consultant)[^.]*)/i
    );
    if (titleMatch) jobTitle = titleMatch[1].trim().substring(0, 80);
  }

  return { name, title: jobTitle, company: "", location, meta: {} };
}

/**
 * GitHub: "Username (Display Name) · GitHub"
 */
function parseGitHubResult(item) {
  const title = item.title || "";
  const snippet = item.snippet || "";
  const link = item.link || "";

  let name = "";
  let bio = "";

  // Pattern: "username (Display Name) · GitHub" or "Display Name · GitHub"
  const ghMatch = title.match(/^(.+?)(?:\s*·\s*GitHub)?$/i);
  if (ghMatch) {
    const raw = ghMatch[1].trim();
    const parenMatch = raw.match(/^(\S+)\s*\((.+?)\)$/);
    if (parenMatch) {
      name = parenMatch[2]; // Display Name
    } else {
      name = raw;
    }
  }

  // Extract username from URL
  const username = link.match(/github\.com\/([^/?#]+)/)?.[1] || "";

  // Bio from snippet
  bio = snippet.substring(0, 200);

  // Extract language mentions
  const languages = [];
  const langPatterns = [
    "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "Julia",
  ];
  for (const lang of langPatterns) {
    if (snippet.toLowerCase().includes(lang.toLowerCase())) {
      languages.push(lang);
    }
  }

  return {
    name: name || username,
    title: bio.substring(0, 80),
    company: "",
    location: "",
    meta: { username, bio, languages },
  };
}

/**
 * Stack Overflow: "User Name - Stack Overflow"
 */
function parseStackOverflowResult(item) {
  const title = item.title || "";
  const snippet = item.snippet || "";

  let name = "";
  let reputation = "";
  const tags = [];

  // Pattern: "User Name - Stack Overflow"
  const soMatch = title.match(/^(.+?)\s*[-–]\s*Stack Overflow/i);
  if (soMatch) {
    name = soMatch[1].trim();
  }

  // Extract reputation from snippet
  const repMatch = snippet.match(/(\d[\d,]+)\s*reputation/i);
  if (repMatch) reputation = repMatch[1].replace(/,/g, "");

  // Extract tags
  const tagMatch = snippet.match(/(?:top\s+)?tags?[:\s]+([^.]+)/i);
  if (tagMatch) {
    tagMatch[1].split(/[,;·]/).forEach((t) => {
      const clean = t.trim().toLowerCase();
      if (clean && clean.length < 30) tags.push(clean);
    });
  }

  return {
    name,
    title: reputation ? `${reputation} reputation` : "",
    company: "",
    location: "",
    meta: { reputation, tags },
  };
}

/**
 * Glassdoor: "Member Name - Company | Glassdoor"
 */
function parseGlassdoorResult(item) {
  const title = item.title || "";
  const snippet = item.snippet || "";

  let name = "";
  let company = "";
  let jobTitle = "";

  const gdMatch = title.match(/^(.+?)\s*[-–|]\s*(.+?)(?:\s*\|?\s*Glassdoor)?$/i);
  if (gdMatch) {
    name = gdMatch[1].trim();
    company = gdMatch[2].replace(/Glassdoor/i, "").trim();
  }

  const titleMatch = snippet.match(
    /(?:works?\s+as|title[:\s]+|position[:\s]+)\s*([^.]+)/i
  );
  if (titleMatch) jobTitle = titleMatch[1].trim().substring(0, 80);

  return { name, title: jobTitle, company, location: "", meta: {} };
}

/**
 * Behance / Dribbble portfolio results.
 */
function parsePortfolioResult(item, source) {
  const title = item.title || "";
  const snippet = item.snippet || "";
  const link = item.link || "";

  let name = "";

  // Pattern: "Name on Behance" or "Name - Dribbble"
  const pfMatch = title.match(/^(.+?)\s*(?:on\s+Behance|[-–]\s*Dribbble|[-–|])/i);
  if (pfMatch) {
    name = pfMatch[1].trim();
  } else {
    name = title.replace(/[-–|].*/g, "").trim();
  }

  // Extract username from URL
  const username =
    link.match(/behance\.net\/([^/?#]+)/)?.[1] ||
    link.match(/dribbble\.com\/([^/?#]+)/)?.[1] ||
    "";

  return {
    name: name || username,
    title: "Creative Professional",
    company: "",
    location: "",
    meta: { username, portfolioUrl: link },
  };
}

/**
 * Generic fallback parser.
 */
function parseGenericResult(item) {
  const title = item.title || "";
  const parts = title.split(/[-–|]/);
  return {
    name: (parts[0] || "").trim(),
    title: (parts[1] || "").trim(),
    company: "",
    location: "",
    meta: {},
  };
}

// ─── Skill Extraction ─────────────────────────────────────────────────────────

const TECH_SKILLS = [
  "JavaScript", "Python", "Java", "React", "Angular", "Vue", "Node.js",
  "TypeScript", "Go", "Rust", "C++", "C#", "SQL", "PostgreSQL", "MySQL",
  "MongoDB", "Redis", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
  "TensorFlow", "PyTorch", "Machine Learning", "AI", "Data Science",
  "Swift", "Kotlin", "Flutter", "React Native", "GraphQL", "REST",
  "Figma", "Sketch", "Adobe", "Photoshop", "Illustrator",
  "Salesforce", "SAP", "Tableau", "Power BI", "Excel",
];

function extractSkillsFromText(...texts) {
  const combined = texts.join(" ").toLowerCase();
  return TECH_SKILLS.filter((skill) => combined.includes(skill.toLowerCase()));
}

// ─── Match Scoring ────────────────────────────────────────────────────────────

function calculateMatchScores(results, keywords, experienceLevel) {
  const keywordsLower = keywords.toLowerCase();
  const tokens = keywordsLower.split(/\s+/).filter((t) => t.length > 2);

  return results
    .map((result) => {
      const text = `${result.title} ${result.snippet} ${result.name}`.toLowerCase();

      let matchedTokens = 0;
      tokens.forEach((token) => {
        if (text.includes(token)) matchedTokens++;
      });

      const matchPct = tokens.length > 0 ? matchedTokens / tokens.length : 0;
      let score = 0.3 + matchPct * 0.5;

      // Title keyword boost
      const titleLower = result.title.toLowerCase();
      if (
        titleLower.includes("engineer") ||
        titleLower.includes("developer") ||
        titleLower.includes("architect") ||
        titleLower.includes("manager") ||
        titleLower.includes("designer")
      ) {
        score += 0.1;
      }

      // Experience level boost
      if (experienceLevel) {
        const expLower = experienceLevel.toLowerCase();
        if (
          (expLower.includes("senior") &&
            (titleLower.includes("senior") || titleLower.includes("lead"))) ||
          (expLower.includes("junior") &&
            (titleLower.includes("junior") || titleLower.includes("entry")))
        ) {
          score += 0.1;
        }
      }

      // Skills boost
      if (result.skills.length > 0) {
        score += Math.min(result.skills.length * 0.02, 0.1);
      }

      // Search rank boost (higher ranked = slight boost)
      score += Math.max(0, (11 - result.searchRank) * 0.005);

      result.matchScore = Math.min(Math.max(score, 0), 1);
      return result;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Boolean Query Generation (ported from linkedin-search.js) ────────────────

async function generateAIBooleanQuery(keywords, location, experienceLevel) {
  const model = getModel();
  if (!model) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const locationPrompt = location
    ? `\nLOCATION TARGETING:\nLocation: ${location}\nInclude comprehensive location OR terms: city name, state, metro area, "Greater [City]" variations, remote work terms.\n`
    : "";

  const experiencePrompt = experienceLevel
    ? `\nEXPERIENCE LEVEL:\nTarget: ${experienceLevel}\nInclude seniority keywords: Senior/Lead/Principal for senior, Junior/Entry/Associate for entry-level.\n`
    : "";

  const prompt = `You are an expert recruiter creating boolean search strings for professional profiles across LinkedIn, GitHub, Indeed, and other platforms. Generate a comprehensive boolean search string for this job posting.

Job Description/Requirements: ${keywords}
${locationPrompt}${experiencePrompt}
Create a multi-layered boolean search strategy:

1. **Core Job Titles** (3-5 variations with OR):
   - Exact matches, abbreviated forms, industry variations
   - Example: ("Software Engineer" OR "Software Developer" OR "SWE" OR "Full Stack Developer")

2. **Required Skills & Technologies**:
   - Primary technical skills (languages, frameworks, tools)
   - Full names and abbreviations
   - Group related with OR, separate groups with AND
   - Example: (JavaScript OR JS OR "Node.js") AND (React OR ReactJS)

3. **Experience Level Indicators** (if specified):
   - Seniority keywords: Senior, Lead, Principal, Staff, Junior, Entry
   - Example: ("Senior" OR "Lead" OR "Sr.")

4. **Location Terms** (if specified):
   - City, state (full and abbreviated), metro areas
   - Remote: ("remote" OR "work from home" OR "distributed")

Return ONLY the boolean search string with no explanation, markdown, or formatting.`;

  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout after 30s")), 30000)
    ),
  ]);

  const searchString = result.response.text().trim();
  if (!searchString) throw new Error("Gemini returned empty response");
  return searchString;
}

function generateBasicBooleanQuery(keywords, location, experienceLevel) {
  const keywordsLower = keywords.toLowerCase();
  const titleTerms = [];
  const skillTerms = [];
  const experienceTerms = [];

  const jobTitlePatterns = [
    "software engineer", "developer", "architect", "data scientist",
    "product manager", "designer", "analyst", "consultant",
  ];

  for (const pattern of jobTitlePatterns) {
    if (keywordsLower.includes(pattern)) titleTerms.push(`"${pattern}"`);
  }

  const techSkills = [
    "javascript", "python", "java", "react", "angular", "vue", "node",
    "typescript", "go", "rust", "sql", "aws", "azure", "gcp", "docker",
    "kubernetes", "tensorflow", "pytorch", "machine learning", "ai",
  ];

  for (const skill of techSkills) {
    if (keywordsLower.includes(skill)) skillTerms.push(`"${skill}"`);
  }

  if (experienceLevel) {
    const expLevel = experienceLevel.toLowerCase();
    if (expLevel.includes("senior")) {
      experienceTerms.push('"Senior"', '"Sr."', '"Lead"');
    } else if (expLevel.includes("junior") || expLevel.includes("entry")) {
      experienceTerms.push('"Junior"', '"Entry"', '"Associate"');
    } else if (expLevel.includes("mid")) {
      experienceTerms.push('"Mid"', '"Intermediate"');
    }
  }

  let query = "";

  if (titleTerms.length > 0) {
    query += `(${titleTerms.slice(0, 4).join(" OR ")})`;
  }

  if (skillTerms.length > 0) {
    if (query) query += " AND ";
    query += `(${skillTerms.slice(0, 6).join(" OR ")})`;
  }

  if (experienceTerms.length > 0) {
    if (query) query += " AND ";
    query += `(${experienceTerms.join(" OR ")})`;
  }

  if (location) {
    if (query) query += " AND ";
    query += `("${location}" OR remote)`;
  }

  if (!query) {
    const tokens = keywords.split(" ").slice(0, 3);
    query = tokens.map((w) => `"${w}"`).join(" AND ");
  }

  return query;
}

module.exports = { candidateSearch };
