import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNewAuth } from '@/context/NewAuthContext';
import { Project, CreateProjectInput } from '@/types/project';
import { toast } from 'sonner';

export const useProjects = () => {
  const { user } = useNewAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('user_id', '==', user.uid),
        where('is_archived', '==', false),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at instanceof Timestamp
          ? doc.data().created_at.toDate().toISOString()
          : doc.data().created_at,
        updated_at: doc.data().updated_at instanceof Timestamp
          ? doc.data().updated_at.toDate().toISOString()
          : doc.data().updated_at
      })) as Project[];

      setProjects(projectsData);
    } catch (error: any) {
      // Don't log or show errors for unauthenticated users
      if (user) {
        console.error('Error fetching projects:', error);
        // Only show toast for unexpected errors, not authentication/permission issues
        const isAuthError = error?.code === 'permission-denied' ||
                           error?.code === 'unauthenticated';

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
    if (!user || !db) return null;

    try {
      const projectData = {
        ...input,
        user_id: user.uid,
        color: input.color || '#8B5CF6',
        icon: input.icon || 'folder',
        is_archived: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, projectData);

      const newProject: Project = {
        id: docRef.id,
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Project;

      setProjects(prev => [newProject, ...prev]);
      toast.success('Project created successfully');
      return newProject;
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error?.code === 'already-exists') {
        toast.error('A project with this name already exists');
      } else {
        toast.error('Failed to create project');
      }
      return null;
    }
  };

  // Update a project
  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    if (!db || !user) return false;

    try {
      const projectRef = doc(db, 'projects', projectId);
      const updateData = {
        ...updates,
        updated_at: serverTimestamp()
      };

      await updateDoc(projectRef, updateData);

      setProjects(prev =>
        prev.map(project => project.id === projectId ? {
          ...project,
          ...updates,
          updated_at: new Date().toISOString()
        } : project)
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

  // Load projects when user is authenticated with real-time updates
  useEffect(() => {
    if (!user || !db) {
      setProjects([]);
      setSelectedProjectId(null);
      setLoading(false);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef,
      where('user_id', '==', user.uid),
      where('is_archived', '==', false),
      orderBy('created_at', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at instanceof Timestamp
            ? doc.data().created_at.toDate().toISOString()
            : doc.data().created_at,
          updated_at: doc.data().updated_at instanceof Timestamp
            ? doc.data().updated_at.toDate().toISOString()
            : doc.data().updated_at
        })) as Project[];

        setProjects(projectsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to projects:', error);
        toast.error('Failed to load projects');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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