export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_outputs: {
        Row: {
          compensation_analysis: string | null
          created_at: string | null
          enhanced_description: string | null
          id: number
          job_id: number | null
          job_summary: string | null
          terms: Json | null
        }
        Insert: {
          compensation_analysis?: string | null
          created_at?: string | null
          enhanced_description?: string | null
          id?: number
          job_id?: number | null
          job_summary?: string | null
          terms?: Json | null
        }
        Update: {
          compensation_analysis?: string | null
          created_at?: string | null
          enhanced_description?: string | null
          id?: number
          job_id?: number | null
          job_summary?: string | null
          terms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_outputs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_job"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_email: string | null
          candidate_name: string | null
          id: string
          job_id: number | null
          resume_url: string | null
          submitted_at: string | null
        }
        Insert: {
          candidate_email?: string | null
          candidate_name?: string | null
          id?: string
          job_id?: number | null
          resume_url?: string | null
          submitted_at?: string | null
        }
        Update: {
          candidate_email?: string | null
          candidate_name?: string | null
          id?: string
          job_id?: number | null
          resume_url?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          id: number
          media_url: string | null
          role: string
          session_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          media_url?: string | null
          role: string
          session_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          media_url?: string | null
          role?: string
          session_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: number
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      daily_transcriptions: {
        Row: {
          created_at: string | null
          id: number
          meeting_id: number | null
          participant_id: string
          text: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          meeting_id?: number | null
          participant_id: string
          text: string
          timestamp: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          meeting_id?: number | null
          participant_id?: string
          text?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_transcriptions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      daughter_registrations: {
        Row: {
          created_at: string
          daughter_age: number
          daughter_name: string
          daughter_tshirt_size: string | null
          id: string
          registration_id: string
        }
        Insert: {
          created_at?: string
          daughter_age: number
          daughter_name: string
          daughter_tshirt_size?: string | null
          id?: string
          registration_id: string
        }
        Update: {
          created_at?: string
          daughter_age?: number
          daughter_name?: string
          daughter_tshirt_size?: string | null
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daughter_registrations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_frameworks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          question_types: Json | null
          system_prompt: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          question_types?: Json | null
          system_prompt: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          question_types?: Json | null
          system_prompt?: string
        }
        Relationships: []
      }
      interview_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          role: string
          session_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          role: string
          session_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          role?: string
          session_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_plans: {
        Row: {
          generated_at: string | null
          id: number
          plan_content: Json
          session_id: number | null
          status: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: number
          plan_content: Json
          session_id?: number | null
          status?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: number
          plan_content?: Json
          session_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_plans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string | null
          custom_framework_prompt: string | null
          ended_at: string | null
          id: number
          interview_framework: string | null
          interview_plan: Json | null
          role_description: string | null
          role_title: string | null
          started_at: string | null
          status: string | null
          uploaded_files: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_framework_prompt?: string | null
          ended_at?: string | null
          id?: number
          interview_framework?: string | null
          interview_plan?: Json | null
          role_description?: string | null
          role_title?: string | null
          started_at?: string | null
          status?: string | null
          uploaded_files?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_framework_prompt?: string | null
          ended_at?: string | null
          id?: number
          interview_framework?: string | null
          interview_plan?: Json | null
          role_description?: string | null
          role_title?: string | null
          started_at?: string | null
          status?: string | null
          uploaded_files?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          analysis: Json | null
          application_deadline: string | null
          category: string | null
          client_id: string | null
          content: string | null
          created_at: string
          experience_level: string | null
          id: number
          is_active: boolean | null
          job_type: string | null
          location: string | null
          posted_at: string | null
          remote_allowed: boolean | null
          salary_max: number | null
          salary_min: number | null
          salary_range: string | null
          search_string: string | null
          skills_required: string[] | null
          source: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          analysis?: Json | null
          application_deadline?: string | null
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          experience_level?: string | null
          id?: number
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_at?: string | null
          remote_allowed?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          search_string?: string | null
          skills_required?: string[] | null
          source?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          analysis?: Json | null
          application_deadline?: string | null
          category?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          experience_level?: string | null
          id?: number
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_at?: string | null
          remote_allowed?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          search_string?: string | null
          skills_required?: string[] | null
          source?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      kickoff_calls: {
        Row: {
          action_items: string[] | null
          content: string | null
          created_at: string
          file_paths: string[] | null
          id: number
          key_points: string[] | null
          summary: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          action_items?: string[] | null
          content?: string | null
          created_at?: string
          file_paths?: string[] | null
          id?: number
          key_points?: string[] | null
          summary?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action_items?: string[] | null
          content?: string | null
          created_at?: string
          file_paths?: string[] | null
          id?: number
          key_points?: string[] | null
          summary?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kickoff_summaries: {
        Row: {
          call_id: number | null
          content: string
          created_at: string
          id: number
          source: string
          sources: string[] | null
          user_id: string
        }
        Insert: {
          call_id?: number | null
          content: string
          created_at?: string
          id?: number
          source: string
          sources?: string[] | null
          user_id: string
        }
        Update: {
          call_id?: number | null
          content?: string
          created_at?: string
          id?: number
          source?: string
          sources?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kickoff_summaries_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "kickoff_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string
          created_at: string
          email: string
          id: string
          industry: string
          message: string
          name: string
          phone: string | null
          preferred_contact: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company: string
          created_at?: string
          email: string
          id?: string
          industry: string
          message: string
          name: string
          phone?: string | null
          preferred_contact: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          industry?: string
          message?: string
          name?: string
          phone?: string | null
          preferred_contact?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_analyses: {
        Row: {
          analysis: string
          created_at: string | null
          id: number
          processed_at: string
          recording_id: string
          video_url: string
        }
        Insert: {
          analysis: string
          created_at?: string | null
          id?: never
          processed_at?: string
          recording_id: string
          video_url: string
        }
        Update: {
          analysis?: string
          created_at?: string | null
          id?: never
          processed_at?: string
          recording_id?: string
          video_url?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: number
          meeting_date: string
          participants: Json | null
          start_time: string
          summary: string | null
          transcription: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: number
          meeting_date?: string
          participants?: Json | null
          start_time: string
          summary?: string | null
          transcription?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: number
          meeting_date?: string
          participants?: Json | null
          start_time?: string
          summary?: string | null
          transcription?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          id: string
          report_id: string | null
          sender: string | null
          ts: string | null
        }
        Insert: {
          body?: string | null
          id?: string
          report_id?: string | null
          sender?: string | null
          ts?: string | null
        }
        Update: {
          body?: string | null
          id?: string
          report_id?: string | null
          sender?: string | null
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "production_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      parsed_documents: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: number
          original_filename: string | null
          parsed_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: number
          original_filename?: string | null
          parsed_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: number
          original_filename?: string | null
          parsed_text?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_status: string | null
          registration_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          registration_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          registration_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      production_reports: {
        Row: {
          crew_call: string | null
          crew_count: number | null
          id: string
          inserted_at: string | null
          notes: string | null
          project_id: string | null
          project_name: string | null
          raw_ai: Json | null
          scenes_int: number | null
          shoot_date: string | null
          status: string | null
          user_id: string | null
          wrap_time: string | null
        }
        Insert: {
          crew_call?: string | null
          crew_count?: number | null
          id?: string
          inserted_at?: string | null
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          raw_ai?: Json | null
          scenes_int?: number | null
          shoot_date?: string | null
          status?: string | null
          user_id?: string | null
          wrap_time?: string | null
        }
        Update: {
          crew_call?: string | null
          crew_count?: number | null
          id?: string
          inserted_at?: string | null
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          raw_ai?: Json | null
          scenes_int?: number | null
          shoot_date?: string | null
          status?: string | null
          user_id?: string | null
          wrap_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_candidates: {
        Row: {
          added_at: string | null
          added_by: string
          candidate_id: number
          id: string
          notes: string | null
          project_id: string
          tags: string[] | null
        }
        Insert: {
          added_at?: string | null
          added_by: string
          candidate_id: number
          id?: string
          notes?: string | null
          project_id: string
          tags?: string[] | null
        }
        Update: {
          added_at?: string | null
          added_by?: string
          candidate_id?: number
          id?: string
          notes?: string | null
          project_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "saved_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          candidates_count: number | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidates_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidates_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          dad_email: string
          dad_name: string
          dad_phone: string
          dad_tshirt_size: string | null
          dietary_restrictions: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          id: string
          number_of_daughters: number
          payment_method: string | null
          registration_status: string | null
          special_requests: string | null
          swimming_ability: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dad_email: string
          dad_name: string
          dad_phone: string
          dad_tshirt_size?: string | null
          dietary_restrictions?: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          id?: string
          number_of_daughters?: number
          payment_method?: string | null
          registration_status?: string | null
          special_requests?: string | null
          swimming_ability?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dad_email?: string
          dad_name?: string
          dad_phone?: string
          dad_tshirt_size?: string | null
          dietary_restrictions?: string | null
          emergency_contact_name?: string
          emergency_contact_phone?: string
          id?: string
          number_of_daughters?: number
          payment_method?: string | null
          registration_status?: string | null
          special_requests?: string | null
          swimming_ability?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_matches: {
        Row: {
          created_at: string | null
          id: number
          job_id: number | null
          matching_entities: Json | null
          matching_keywords: Json | null
          parsed_job: Json | null
          parsed_resume: Json | null
          resume_file_path: string | null
          resume_text: string | null
          similarity_score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          job_id?: number | null
          matching_entities?: Json | null
          matching_keywords?: Json | null
          parsed_job?: Json | null
          parsed_resume?: Json | null
          resume_file_path?: string | null
          resume_text?: string | null
          similarity_score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          job_id?: number | null
          matching_entities?: Json | null
          matching_keywords?: Json | null
          parsed_job?: Json | null
          parsed_resume?: Json | null
          resume_file_path?: string | null
          resume_text?: string | null
          similarity_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_candidates: {
        Row: {
          company: string | null
          created_at: string | null
          id: number
          job_id: number | null
          job_title: string | null
          linkedin_url: string | null
          location: string | null
          mobile_phone: string | null
          name: string
          notes: string | null
          personal_emails: string[] | null
          profile_completeness: number | null
          profile_summary: string | null
          search_string: string | null
          seniority_level: string | null
          skills: string[] | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          work_email: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: never
          job_id?: number | null
          job_title?: string | null
          linkedin_url?: string | null
          location?: string | null
          mobile_phone?: string | null
          name: string
          notes?: string | null
          personal_emails?: string[] | null
          profile_completeness?: number | null
          profile_summary?: string | null
          search_string?: string | null
          seniority_level?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          work_email?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: never
          job_id?: number | null
          job_title?: string | null
          linkedin_url?: string | null
          location?: string | null
          mobile_phone?: string | null
          name?: string
          notes?: string | null
          personal_emails?: string[] | null
          profile_completeness?: number | null
          profile_summary?: string | null
          search_string?: string | null
          seniority_level?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          boolean_query: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          platform: string | null
          project_id: string | null
          results_count: number | null
          search_params: Json | null
          search_query: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          boolean_query?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          platform?: string | null
          project_id?: string | null
          results_count?: number | null
          search_params?: Json | null
          search_query: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          boolean_query?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          platform?: string | null
          project_id?: string | null
          results_count?: number | null
          search_params?: Json | null
          search_query?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      search_results: {
        Row: {
          created_at: string | null
          id: number
          job_id: number | null
          profile_location: string | null
          profile_name: string | null
          profile_title: string | null
          profile_url: string | null
          relevance_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          job_id?: number | null
          profile_location?: string | null
          profile_name?: string | null
          profile_title?: string | null
          profile_url?: string | null
          relevance_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          job_id?: number | null
          profile_location?: string | null
          profile_name?: string | null
          profile_title?: string | null
          profile_url?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_searches: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: number
          search_string: string | null
          search_text: string | null
          search_type: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: number
          search_string?: string | null
          search_text?: string | null
          search_type?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: number
          search_string?: string | null
          search_text?: string | null
          search_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          camping_location: string | null
          created_at: string
          departure_location: string | null
          id: string
          is_active: boolean
          price_per_person: number | null
          return_date: string
          spots_available: number
          total_spots: number
          trip_date: string
          updated_at: string
        }
        Insert: {
          camping_location?: string | null
          created_at?: string
          departure_location?: string | null
          id?: string
          is_active?: boolean
          price_per_person?: number | null
          return_date: string
          spots_available?: number
          total_spots?: number
          trip_date: string
          updated_at?: string
        }
        Update: {
          camping_location?: string | null
          created_at?: string
          departure_location?: string | null
          id?: string
          is_active?: boolean
          price_per_person?: number | null
          return_date?: string
          spots_available?: number
          total_spots?: number
          trip_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_video_analyses: {
        Row: {
          analysis_prompt: string
          analysis_result: string | null
          created_at: string | null
          id: number
          status: string | null
          user_id: string | null
          video_name: string
          video_url: string
        }
        Insert: {
          analysis_prompt: string
          analysis_result?: string | null
          created_at?: string | null
          id?: number
          status?: string | null
          user_id?: string | null
          video_name: string
          video_url: string
        }
        Update: {
          analysis_prompt?: string
          analysis_result?: string | null
          created_at?: string | null
          id?: number
          status?: string | null
          user_id?: string | null
          video_name?: string
          video_url?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string | null
          phone: string
          role: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          phone: string
          role?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          phone?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
