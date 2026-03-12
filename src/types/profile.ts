import { Folder, Briefcase, Users } from 'lucide-react';

export interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalSearches: number;
  totalCandidatesSaved: number;
  totalProjects: number;
  favoriteSearches: number;
  recentActivity: Array<{
    id: string;
    type: 'search' | 'save' | 'project';
    description: string;
    timestamp: string;
  }>;
  searchesThisWeek: number;
  searchesThisMonth: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  candidates_count: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface SearchHistoryItem {
  id: string;
  search_query: string;
  boolean_query: string;
  platform: string;
  results_count: number;
  created_at: string;
  is_favorite: boolean;
  tags: string[];
  project_id: string | null;
  project?: Project;
}

export const PROJECT_ICONS = [
  { name: "folder", icon: Folder },
  { name: "briefcase", icon: Briefcase },
  { name: "users", icon: Users },
] as const;

export const PROJECT_COLORS = [
  "#8B5CF6", // Purple
  "#D946EF", // Pink
  "#10B981", // Green
  "#F59E0B", // Orange
  "#3B82F6", // Blue
  "#EF4444", // Red
] as const;

export function getProjectIcon(iconName: string) {
  const icon = PROJECT_ICONS.find(i => i.name === iconName);
  return icon ? icon.icon : Folder;
}
