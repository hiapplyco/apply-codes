import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { projectId, candidateProfileUrl, userCustomText } = await req.json();
    
    if (!projectId || !candidateProfileUrl || !userCustomText?.trim()) {
      throw new Error('Project ID, candidate profile URL, and custom text are required');
    }

    console.log(`Processing outreach email for project: ${projectId}`);
    
    // Step 1: Fetch project details from database
    const projectData = await fetchProjectDetails(projectId);
    
    // Step 2: Enrich candidate profile using Nymeria
    const candidateData = await enrichCandidateProfile(candidateProfileUrl);
    
    if (!candidateData?.email) {
      throw new Error('Unable to find candidate email address');
    }
    
    // Step 3: Generate email content using Gemini
    const emailContent = await generateEmailContent(projectData, candidateData, userCustomText);
    
    // Step 4: Send email via SendGrid
    const emailResult = await sendEmail({
      to: candidateData.email,
      subject: emailContent.subject,
      body: emailContent.body,
      recipientName: candidateData.name || 'there'
    });
    
    // Step 5: Log the outreach activity
    await logOutreachActivity(projectId, candidateProfileUrl, candidateData.email, 'sent');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully',
        recipient: candidateData.email,
        subject: emailContent.subject
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in send-outreach-email:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchProjectDetails(projectId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}&select=*`,
    {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch project details: ${response.status}`);
  }
  
  const projects = await response.json();
  
  if (projects.length === 0) {
    throw new Error('Project not found');
  }
  
  return projects[0];
}

async function enrichCandidateProfile(profileUrl: string) {
  const nymeriaApiKey = Deno.env.get('NYMERIA_API_KEY');
  
  if (!nymeriaApiKey) {
    throw new Error('Missing Nymeria API key');
  }
  
  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;
  
  const response = await fetch(nymeriaUrl, {
    method: 'GET',
    headers: {
      'X-Api-Key': nymeriaApiKey
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Candidate profile not found in contact database');
    }
    throw new Error(`Failed to enrich candidate profile: ${response.status}`);
  }
  
  const enrichedData = await response.json();
  
  // Extract key information
  return {
    email: enrichedData.emails?.[0]?.email || null,
    name: enrichedData.name?.full_name || enrichedData.name?.first_name || null,
    currentRole: enrichedData.experiences?.[0]?.title || null,
    currentCompany: enrichedData.experiences?.[0]?.company?.name || null,
    location: enrichedData.location?.full_location || null,
    skills: enrichedData.skills?.map(skill => skill.name).slice(0, 5) || [],
    experienceSummary: enrichedData.experiences?.slice(0, 3).map(exp => 
      `${exp.title} at ${exp.company?.name}`
    ).join(', ') || null
  };
}

async function generateEmailContent(
  projectData: { name: string; description?: string }, 
  candidateData: { name?: string; currentRole?: string; currentCompany?: string; location?: string; skills?: string[]; experienceSummary?: string }, 
  userCustomText: string
) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!geminiApiKey) {
    throw new Error('Missing Gemini API key');
  }
  
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  });
  
  const prompt = `You are a friendly and professional recruiter writing a personalized outreach email to a potential candidate.

PROJECT DETAILS:
- Project Name: ${projectData.name}
- Description: ${projectData.description || 'Not specified'}

CANDIDATE DETAILS:
- Name: ${candidateData.name || 'Candidate'}
- Current Role: ${candidateData.currentRole || 'Not specified'}
- Current Company: ${candidateData.currentCompany || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Key Skills: ${candidateData.skills?.join(', ') || 'Not specified'}
- Experience Summary: ${candidateData.experienceSummary || 'Not specified'}

USER'S CUSTOM MESSAGE:
${userCustomText}

REQUIREMENTS:
1. Write a compelling email subject line (under 60 characters)
2. Write a concise, engaging email body (under 200 words)
3. Maintain a professional yet approachable tone
4. Personalize based on the candidate's background
5. Incorporate the user's custom message naturally
6. End with a clear call to action
7. Sign off as "Best regards, Apply Team"

Format your response as JSON with "subject" and "body" fields.`;
  
  const result = await model.generateContent([{ text: prompt }]);
  const response = result.response.text();
  
  // Clean and parse the response
  const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    console.warn('Failed to parse Gemini response as JSON, using fallback');
    return {
      subject: `Exciting opportunity at ${projectData.name}`,
      body: `Hi ${candidateData.name || 'there'},\n\nI hope this message finds you well. I came across your profile and was impressed by your background in ${candidateData.currentRole} at ${candidateData.currentCompany}.\n\n${userCustomText}\n\nI'd love to discuss this opportunity with you further. Are you available for a brief chat next week?\n\nBest regards,\nApply Team`
    };
  }
}

async function sendEmail({ to, subject, body, recipientName }: {
  to: string;
  subject: string;
  body: string;
  recipientName: string;
}) {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  
  if (!sendgridApiKey) {
    throw new Error('Missing SendGrid API key');
  }
  
  const emailData = {
    personalizations: [{
      to: [{ email: to, name: recipientName }],
      subject: subject
    }],
    from: {
      email: 'hello@hiapply.co',
      name: 'Apply Team'
    },
    content: [{
      type: 'text/plain',
      value: body
    }, {
      type: 'text/html',
      value: body.replace(/\n/g, '<br>')
    }]
  };
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SendGrid error:', errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
  
  return { success: true };
}

async function logOutreachActivity(projectId: string, profileUrl: string, email: string, status: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Missing Supabase configuration, skipping log');
      return;
    }
    
    // Create a simple log entry in agent_outputs table for now
    await fetch(
      `${supabaseUrl}/rest/v1/agent_outputs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          agent_type: 'outreach',
          input_data: { 
            profile_url: profileUrl, 
            project_id: projectId,
            recipient_email: email 
          },
          output_data: { status, sent_at: new Date().toISOString() },
          project_id: projectId,
          created_at: new Date().toISOString()
        })
      }
    );
  } catch (error) {
    console.error('Error logging outreach activity:', error);
    // Don't throw error to avoid failing the main operation
  }
}