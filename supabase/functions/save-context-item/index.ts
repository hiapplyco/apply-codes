import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextItemInput {
  type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input';
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  file_name?: string;
  file_type?: string;
  metadata?: Record<string, any>;
  project_id?: string;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const contextItem: ContextItemInput = await req.json();
    
    // Validate required fields
    if (!contextItem.type || !contextItem.title || !contextItem.content) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: type, title, and content are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save context item to database
    const { data, error } = await supabase
      .from('context_items')
      .insert([{
        user_id: user.id,
        type: contextItem.type,
        title: contextItem.title,
        content: contextItem.content,
        summary: contextItem.summary,
        source_url: contextItem.source_url,
        file_name: contextItem.file_name,
        file_type: contextItem.file_type,
        metadata: contextItem.metadata || {},
        project_id: contextItem.project_id,
        tags: contextItem.tags || [],
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save context item',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in save-context-item function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});