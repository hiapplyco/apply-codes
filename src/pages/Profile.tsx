import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Mail, 
  Calendar, 
  Search, 
  Folder, 
  Users,
  Star,
  Activity,
  Settings,
  LogOut,
  Edit3,
  Camera,
  Clock,
  Hash,
  Briefcase,
  Trash2,
  MoreVertical,
  Plus,
  Filter,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
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

interface Project {
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

interface SearchHistoryItem {
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

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Search History states
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#8B5CF6",
    icon: "folder"
  });

  const projectIcons = [
    { name: "folder", icon: Folder },
    { name: "briefcase", icon: Briefcase },
    { name: "users", icon: Users },
  ];

  const projectColors = [
    "#8B5CF6", // Purple
    "#D946EF", // Pink
    "#10B981", // Green
    "#F59E0B", // Orange
    "#3B82F6", // Blue
    "#EF4444", // Red
  ];

  useEffect(() => {
    fetchProfileData();
    fetchUserStats();
    fetchSearchHistory();
    fetchProjects();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfileData(data);
      setEditingName(data.full_name || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile data");
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      // Fetch search history count
      const { count: searchCount } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Fetch saved candidates count
      const { count: candidatesCount } = await supabase
        .from('saved_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Fetch projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Fetch favorite searches count
      const { count: favoritesCount } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_favorite', true);
      
      // Fetch recent searches (this week and month)
      const weekStart = startOfWeek(new Date());
      const monthStart = startOfMonth(new Date());
      
      const { count: weekSearches } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString());
      
      const { count: monthSearches } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());
      
      // Fetch recent activity
      const { data: recentSearches } = await supabase
        .from('search_history')
        .select('id, search_query, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      const recentActivity = recentSearches?.map(search => ({
        id: search.id,
        type: 'search' as const,
        description: `Searched for "${search.search_query}"`,
        timestamp: search.created_at
      })) || [];
      
      setUserStats({
        totalSearches: searchCount || 0,
        totalCandidatesSaved: candidatesCount || 0,
        totalProjects: projectsCount || 0,
        favoriteSearches: favoritesCount || 0,
        searchesThisWeek: weekSearches || 0,
        searchesThisMonth: monthSearches || 0,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast.error("Failed to load search history");
    }
  };

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileData) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editingName })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfileData({ ...profileData, full_name: editingName });
      setEditModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    setUploadingAvatar(true);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      if (profileData) {
        setProfileData({ ...profileData, avatar_url: publicUrl });
      }
      
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleFavorite = async (searchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .update({ is_favorite: !currentStatus })
        .eq('id', searchId);

      if (error) throw error;
      
      fetchSearchHistory();
      toast.success(currentStatus ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      
      fetchSearchHistory();
      toast.success("Search deleted successfully");
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error("Failed to delete search");
    }
  };

  const createProject = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          ...newProject,
          user_id: user.id
        });

      if (error) throw error;
      
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
      const { error } = await supabase
        .from('projects')
        .update({
          name: editingProject.name,
          description: editingProject.description,
          color: editingProject.color,
          icon: editingProject.icon
        })
        .eq('id', editingProject.id);

      if (error) throw error;
      
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
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', projectId);

      if (error) throw error;
      
      fetchProjects();
      toast.success("Project archived successfully");
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error("Failed to archive project");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getProjectIcon = (iconName: string) => {
    const icon = projectIcons.find(i => i.name === iconName);
    const IconComponent = icon ? icon.icon : Folder;
    return IconComponent;
  };

  const favoriteSearches = searchHistory.filter(s => s.is_favorite);
  const activeProjects = projects.filter(p => !p.is_archived);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Profile Header */}
      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-black">
                  <AvatarImage src={profileData?.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl font-bold">
                    {getInitials(profileData?.full_name, user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <div className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors">
                    {uploadingAvatar ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                </label>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profileData?.full_name || 'Unnamed User'}
                </h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Member since {profileData && format(new Date(profileData.created_at), 'MMMM yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditModalOpen(true)}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-purple-600">{userStats?.totalSearches || 0}</p>
              </div>
              <Search className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saved Candidates</p>
                <p className="text-2xl font-bold text-green-600">{userStats?.totalCandidatesSaved || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-orange-600">{userStats?.totalProjects || 0}</p>
              </div>
              <Folder className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{userStats?.searchesThisMonth || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full bg-[#F1F1F1] p-1 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
          <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="searches" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Search History
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Projects
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and searches</CardDescription>
            </CardHeader>
            <CardContent>
              {userStats?.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {userStats?.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'search' && <Search className="h-5 w-5 text-purple-600" />}
                        {activity.type === 'save' && <Star className="h-5 w-5 text-yellow-600" />}
                        {activity.type === 'project' && <Folder className="h-5 w-5 text-green-600" />}
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="searches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Search History</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>

          {/* Favorite Searches */}
          {favoriteSearches.length > 0 && (
            <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Favorite Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favoriteSearches.map((search) => (
                    <div key={search.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                      <div className="flex-1">
                        <p className="font-medium">{search.search_query}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {search.platform}
                          </span>
                          <span>{search.results_count} results</span>
                          <span>{format(new Date(search.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/sourcing?search=${encodeURIComponent(search.boolean_query)}`)}>
                            <Search className="h-4 w-4 mr-2" />
                            Re-run Search
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFavorite(search.id, true)}>
                            <Star className="h-4 w-4 mr-2" />
                            Remove from Favorites
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteSearch(search.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Searches */}
          <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>All Searches</CardTitle>
              <CardDescription>Your complete search history</CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No searches yet</p>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((search) => (
                    <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{search.search_query}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {search.platform}
                          </span>
                          <span>{search.results_count} results</span>
                          <span>{format(new Date(search.created_at), 'MMM d, yyyy')}</span>
                          {search.project && (
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: search.project.color + '20', color: search.project.color }}
                            >
                              {search.project.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/sourcing?search=${encodeURIComponent(search.boolean_query)}`)}>
                            <Search className="h-4 w-4 mr-2" />
                            Re-run Search
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFavorite(search.id, search.is_favorite)}>
                            <Star className="h-4 w-4 mr-2" />
                            {search.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteSearch(search.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Projects</h2>
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => {
              const IconComponent = getProjectIcon(project.icon);
              return (
                <Card 
                  key={project.id} 
                  className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <IconComponent className="h-6 w-6" style={{ color: project.color }} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                          }}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            archiveProject(project.id);
                          }}>
                            <Folder className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{project.candidates_count} candidates</span>
                      <span>{format(new Date(project.created_at), 'MMM d')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Usage & Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Monthly Searches</span>
                      <span className="text-sm font-medium">{userStats?.searchesThisMonth || 0} / 500</span>
                    </div>
                    <Progress value={(userStats?.searchesThisMonth || 0) / 5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Saved Candidates</span>
                      <span className="text-sm font-medium">{userStats?.totalCandidatesSaved || 0} / 1000</span>
                    </div>
                    <Progress value={(userStats?.totalCandidatesSaved || 0) / 10} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProfile}
              className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Organize your candidates and searches into projects
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                placeholder="e.g., Q1 Engineering Hiring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                placeholder="Brief description of this project..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2">
                {projectIcons.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setNewProject({ ...newProject, icon: name })}
                    className={`p-3 rounded-lg border-2 ${
                      newProject.icon === name 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {projectColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewProject({ ...newProject, color })}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      newProject.color === color 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateProject(false)}
              className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={createProject}
              disabled={!newProject.name}
              className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-2">
                  {projectIcons.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setEditingProject({ ...editingProject, icon: name })}
                      className={`p-3 rounded-lg border-2 ${
                        editingProject.icon === name 
                          ? 'border-purple-600 bg-purple-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {projectColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingProject({ ...editingProject, color })}
                      className={`w-10 h-10 rounded-lg border-2 ${
                        editingProject.color === color 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingProject(null)}
                className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              >
                Cancel
              </Button>
              <Button 
                onClick={updateProject}
                className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}