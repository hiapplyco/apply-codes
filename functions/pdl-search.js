const functions = require('firebase-functions');
const axios = require('axios');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// People Data Labs API base URLs
const PDL_API_BASE = 'https://api.peopledatalabs.com/v5';

exports.pdlSearch = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    const { searchType, searchParams, pagination } = req.body || {};
    console.log("PDL Search request:", { searchType, searchParams, pagination });

    // Validate search type
    if (!searchType || !['person', 'company', 'person_search', 'company_search', 'person_enrich', 'company_enrich'].includes(searchType)) {
      res.status(400).json({
        error: 'Invalid or missing searchType. Must be one of: person, company, person_search, company_search, person_enrich, company_enrich',
        type: 'ValidationError',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get API key
    const apiKey = process.env.PDL_API_KEY || process.env.PEOPLE_DATA_LABS_API_KEY;
    if (!apiKey) {
      console.error('PDL_API_KEY is not set');
      res.status(500).json({
        error: 'API configuration error: Missing People Data Labs API key',
        type: 'ConfigurationError',
        timestamp: new Date().toISOString()
      });
      return;
    }

    let result;

    switch (searchType) {
      case 'person':
      case 'person_enrich':
        result = await personEnrich(apiKey, searchParams);
        break;
      case 'company':
      case 'company_enrich':
        result = await companyEnrich(apiKey, searchParams);
        break;
      case 'person_search':
        result = await personSearch(apiKey, searchParams, pagination);
        break;
      case 'company_search':
        result = await companySearch(apiKey, searchParams, pagination);
        break;
      default:
        res.status(400).json({
          error: 'Unsupported search type',
          type: 'ValidationError',
          timestamp: new Date().toISOString()
        });
        return;
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Error processing PDL search request:', error);

    const errorMessage = error.message || 'Unknown error';
    const errorDetails = {
      error: errorMessage,
      type: error.constructor?.name || 'Error',
      timestamp: new Date().toISOString()
    };

    const statusCode = error.status || error.response?.status || 500;
    res.status(statusCode).json(errorDetails);
  }
});

/**
 * Person Enrichment - Get detailed info about a specific person
 */
async function personEnrich(apiKey, searchParams) {
  if (!searchParams) {
    throw new Error('searchParams is required for person enrichment');
  }

  // Validate required parameters for person enrichment
  const hasProfile = searchParams.profile;
  const hasEmail = searchParams.email;
  const hasPhone = searchParams.phone;
  const hasEmailHash = searchParams.email_hash;
  const hasLinkedIn = searchParams.lid;
  const hasName = (searchParams.first_name && searchParams.last_name) || searchParams.name;
  const hasLocation = searchParams.locality || searchParams.region || searchParams.company ||
                     searchParams.school || searchParams.location || searchParams.postal_code;

  if (!hasProfile && !hasEmail && !hasPhone && !hasEmailHash && !hasLinkedIn && !(hasName && hasLocation)) {
    throw new Error('Person enrichment requires at least one of: profile, email, phone, email_hash, lid, or (name + location/company/school)');
  }

  const queryParams = new URLSearchParams();

  // Add all provided parameters
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== '') {
      queryParams.append(key, searchParams[key]);
    }
  });

  const url = `${PDL_API_BASE}/person/enrich?${queryParams.toString()}`;
  console.log('Calling PDL Person Enrich API:', url);

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const person = response.data;

    return {
      data: person ? transformPersonData(person) : null,
      source: 'peopledatalabs',
      searchType: 'person_enrich',
      credits_used: response.headers['x-credits-charged'] || 1,
      credits_remaining: response.headers['x-credits-remaining']
    };

  } catch (error) {
    if (error.response?.status === 404) {
      return {
        data: null,
        source: 'peopledatalabs',
        searchType: 'person_enrich',
        message: 'No matching person found',
        credits_used: 0
      };
    }
    throw error;
  }
}

/**
 * Company Enrichment - Get detailed info about a specific company
 */
async function companyEnrich(apiKey, searchParams) {
  if (!searchParams) {
    throw new Error('searchParams is required for company enrichment');
  }

  // Validate required parameters for company enrichment
  if (!searchParams.name && !searchParams.ticker && !searchParams.website && !searchParams.profile) {
    throw new Error('Company enrichment requires at least one of: name, ticker, website, or profile');
  }

  const queryParams = new URLSearchParams();

  // Add all provided parameters
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== '') {
      queryParams.append(key, searchParams[key]);
    }
  });

  const url = `${PDL_API_BASE}/company/enrich?${queryParams.toString()}`;
  console.log('Calling PDL Company Enrich API:', url);

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const company = response.data;

    return {
      data: company ? transformCompanyData(company) : null,
      source: 'peopledatalabs',
      searchType: 'company_enrich',
      credits_used: response.headers['x-credits-charged'] || 1,
      credits_remaining: response.headers['x-credits-remaining']
    };

  } catch (error) {
    if (error.response?.status === 404) {
      return {
        data: null,
        source: 'peopledatalabs',
        searchType: 'company_enrich',
        message: 'No matching company found',
        credits_used: 0
      };
    }
    throw error;
  }
}

/**
 * Person Search - Find multiple people matching criteria
 */
async function personSearch(apiKey, searchParams, pagination = {}) {
  if (!searchParams) {
    throw new Error('searchParams is required for person search');
  }

  const requestBody = {
    query: searchParams,
    size: Math.min(100, Math.max(1, pagination.size || 10)), // PDL allows up to 100 results per request
    from: Math.max(0, pagination.from || 0)
  };

  // Add additional parameters if provided
  if (searchParams.required) {
    requestBody.required = searchParams.required;
  }
  if (searchParams.scroll_token) {
    requestBody.scroll_token = searchParams.scroll_token;
  }

  const url = `${PDL_API_BASE}/person/search`;
  console.log('Calling PDL Person Search API:', url);

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const searchData = response.data;

    return {
      data: (searchData.data || []).map(transformPersonData),
      total: searchData.total,
      size: searchData.size,
      from: searchData.from,
      scroll_token: searchData.scroll_token,
      source: 'peopledatalabs',
      searchType: 'person_search',
      credits_used: response.headers['x-credits-charged'],
      credits_remaining: response.headers['x-credits-remaining']
    };

  } catch (error) {
    if (error.response?.status === 404) {
      return {
        data: [],
        total: 0,
        size: requestBody.size,
        from: requestBody.from,
        source: 'peopledatalabs',
        searchType: 'person_search',
        message: 'No matching people found',
        credits_used: 0
      };
    }
    throw error;
  }
}

/**
 * Company Search - Find multiple companies matching criteria
 */
async function companySearch(apiKey, searchParams, pagination = {}) {
  if (!searchParams) {
    throw new Error('searchParams is required for company search');
  }

  const requestBody = {
    query: searchParams,
    size: Math.min(100, Math.max(1, pagination.size || 10)),
    from: Math.max(0, pagination.from || 0)
  };

  // Add additional parameters if provided
  if (searchParams.required) {
    requestBody.required = searchParams.required;
  }
  if (searchParams.scroll_token) {
    requestBody.scroll_token = searchParams.scroll_token;
  }

  const url = `${PDL_API_BASE}/company/search`;
  console.log('Calling PDL Company Search API:', url);

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const searchData = response.data;

    return {
      data: (searchData.data || []).map(transformCompanyData),
      total: searchData.total,
      size: searchData.size,
      from: searchData.from,
      scroll_token: searchData.scroll_token,
      source: 'peopledatalabs',
      searchType: 'company_search',
      credits_used: response.headers['x-credits-charged'],
      credits_remaining: response.headers['x-credits-remaining']
    };

  } catch (error) {
    if (error.response?.status === 404) {
      return {
        data: [],
        total: 0,
        size: requestBody.size,
        from: requestBody.from,
        source: 'peopledatalabs',
        searchType: 'company_search',
        message: 'No matching companies found',
        credits_used: 0
      };
    }
    throw error;
  }
}

/**
 * Transform person data to consistent format
 */
function transformPersonData(person) {
  if (!person) return null;

  return {
    id: person.id,
    full_name: person.full_name,
    first_name: person.first_name,
    middle_name: person.middle_name,
    last_name: person.last_name,

    // Contact information
    emails: person.emails || [],
    phone_numbers: person.phone_numbers || [],

    // Location
    location_names: person.location_names || [],
    location_locality: person.location_locality,
    location_region: person.location_region,
    location_country: person.location_country,

    // Employment
    job_title: person.job_title,
    job_title_role: person.job_title_role,
    job_title_sub_role: person.job_title_sub_role,
    job_title_levels: person.job_title_levels || [],
    job_company_name: person.job_company_name,
    job_company_website: person.job_company_website,
    job_company_size: person.job_company_size,
    job_company_founded: person.job_company_founded,
    job_company_industry: person.job_company_industry,
    job_start_date: person.job_start_date,
    job_summary: person.job_summary,

    // Experience
    experience: person.experience || [],

    // Education
    education: person.education || [],

    // Social profiles
    profiles: person.profiles || [],
    linkedin_url: person.linkedin_url,
    linkedin_username: person.linkedin_username,
    linkedin_id: person.linkedin_id,
    facebook_url: person.facebook_url,
    facebook_username: person.facebook_username,
    facebook_id: person.facebook_id,
    twitter_url: person.twitter_url,
    twitter_username: person.twitter_username,
    github_url: person.github_url,
    github_username: person.github_username,

    // Skills and interests
    skills: person.skills || [],
    interests: person.interests || [],

    // Summary fields for display
    hasContactInfo: !!(person.emails?.length || person.phone_numbers?.length),
    hasEmploymentInfo: !!(person.job_title || person.job_company_name),
    hasEducationInfo: !!(person.education?.length),
    hasSocialProfiles: !!(person.profiles?.length),

    // Raw data for advanced use cases
    raw: person
  };
}

/**
 * Transform company data to consistent format
 */
function transformCompanyData(company) {
  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    display_name: company.display_name,
    size: company.size,
    employee_count: company.employee_count,
    id: company.id,
    founded: company.founded,
    industry: company.industry,
    naics: company.naics || [],
    sic: company.sic || [],
    tags: company.tags || [],

    // Contact and location
    website: company.website,
    location_name: company.location_name,
    location_locality: company.location_locality,
    location_region: company.location_region,
    location_country: company.location_country,
    location_continent: company.location_continent,

    // Social profiles
    profiles: company.profiles || [],
    linkedin_url: company.linkedin_url,
    linkedin_id: company.linkedin_id,
    facebook_url: company.facebook_url,
    twitter_url: company.twitter_url,

    // Company details
    type: company.type,
    ticker: company.ticker,
    gics_sector: company.gics_sector,
    mic_exchange: company.mic_exchange,

    // Summary fields for display
    hasContactInfo: !!(company.website),
    hasLocationInfo: !!(company.location_name || company.location_locality),
    hasSocialProfiles: !!(company.profiles?.length),

    // Raw data for advanced use cases
    raw: company
  };
}