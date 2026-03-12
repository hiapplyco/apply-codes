import { useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { normalizeTimestamp } from '@/lib/timestamp';
import { toast } from 'sonner';
import type { Project } from '@/types/profile';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#8B5CF6",
    icon: "folder"
  });

  const fetchProjects = async () => {
    if (!userId) return;

    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const projectsQuery = query(
        collection(db, 'projects'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);
      const loadedProjects = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as Project;
        return {
          ...data,
          id: docSnap.id,
          created_at: normalizeTimestamp(data.created_at),
          updated_at: normalizeTimestamp(data.updated_at)
        };
      });

      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    }
  };

  const createProject = async () => {
    if (!userId) return;

    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await addDoc(collection(db, 'projects'), {
        ...newProject,
        user_id: userId,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      fetchProjects();
      setShowCreateProject(false);
      setNewProject({ name: "", description: "", color: "#8B5CF6", icon: "folder" });
      toast.success("Project created successfully");
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;

    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const projectRef = doc(db, 'projects', editingProject.id);
      await updateDoc(projectRef, {
        name: editingProject.name,
        description: editingProject.description,
        color: editingProject.color,
        icon: editingProject.icon,
        updated_at: new Date().toISOString()
      });

      fetchProjects();
      setEditingProject(null);
      toast.success("Project updated successfully");
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error("Failed to update project");
    }
  };

  const archiveProject = async (projectId: string) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        is_archived: true,
        updated_at: new Date().toISOString()
      });

      fetchProjects();
      toast.success("Project archived successfully");
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error("Failed to archive project");
    }
  };

  const activeProjects = projects.filter(p => !p.is_archived);

  return {
    projects,
    activeProjects,
    showCreateProject,
    setShowCreateProject,
    editingProject,
    setEditingProject,
    newProject,
    setNewProject,
    fetchProjects,
    createProject,
    updateProject,
    archiveProject,
  };
}
