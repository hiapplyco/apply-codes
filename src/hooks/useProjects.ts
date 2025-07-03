import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Project, CreateProjectInput } from '@/types/project';
import { toast } from 'sonner';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      // Don't log or show errors for unauthenticated users
      if (user) {
        console.error('Error fetching projects:', error);
        // Only show toast for unexpected errors, not authentication/permission issues
        const isAuthError = error?.message?.toLowerCase().includes('jwt') || 
                           error?.message?.toLowerCase().includes('auth') ||
                           error?.message?.toLowerCase().includes('permission') ||
                           error?.message?.toLowerCase().includes('policy') ||
                           error?.code === 'PGRST301' || // JWT required
                           error?.code === '42501' || // Insufficient privilege
                           error?.code === 'PGRST116' || // Table not found
                           error?.code === '42P01'; // Undefined table
        
        if (!isAuthError) {
          toast.error('Failed to load projects. Please try refreshing the page.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new project
  const createProject = async (input: CreateProjectInput): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          user_id: user.id,
          color: input.color || '#8B5CF6',
          icon: input.icon || 'folder'
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setProjects(prev => [data, ...prev]);
        toast.success('Project created successfully');
        return data;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error?.code === '23505') {
        toast.error('A project with this name already exists');
      } else {
        toast.error('Failed to create project');
      }
      return null;
    }
  };

  // Update a project
  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProjects(prev => 
        prev.map(project => project.id === projectId ? { ...project, ...updates } : project)
      );
      toast.success('Project updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  };

  // Delete (archive) a project
  const archiveProject = async (projectId: string): Promise<boolean> => {
    return updateProject(projectId, { is_archived: true });
  };

  // Get selected project
  const selectedProject = projects.find(project => project.id === selectedProjectId);

  // Load projects when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      // Clear projects when user logs out
      setProjects([]);
      setSelectedProjectId(null);
      setLoading(false);
    }
  }, [user, fetchProjects]);

  // Persist selected project in localStorage
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && projects.some(project => project.id === savedProjectId)) {
      setSelectedProjectId(savedProjectId);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selectedProjectId', selectedProjectId);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProjectId]);

  return {
    projects,
    loading,
    selectedProjectId,
    selectedProject,
    setSelectedProjectId,
    createProject,
    updateProject,
    archiveProject,
    refetch: fetchProjects
  };
};