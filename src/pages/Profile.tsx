import { useState, useEffect } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { uploadAvatar } from "@/lib/firebase-storage";
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
  const { user, signOut, updateUser } = useNewAuth();
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

  const normalizeTimestamp = (value: any): string => {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (value && typeof value.toDate === "function") return value.toDate().toISOString();
    if (typeof value === "string") return value;
    return new Date().toISOString();
  };

  useEffect(() => {
    fetchProfileData();
    fetchUserStats();
    fetchSearchHistory();
    fetchProjects();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        setProfileData(null);
        setEditingName("");
        return;
      }

      const data = profileSnap.data() as ProfileData;
      const normalizedProfile: ProfileData = {
        ...data,
        created_at: normalizeTimestamp(data.created_at),
        updated_at: normalizeTimestamp(data.updated_at)
      };
      setProfileData(normalizedProfile);
      setEditingName(normalizedProfile.full_name || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile data");
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const [searchSnapshot, candidatesSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'search_history'), where('user_id', '==', user.uid))),
        getDocs(query(collection(db, 'saved_candidates'), where('user_id', '==', user.uid))),
        getDocs(query(collection(db, 'projects'), where('user_id', '==', user.uid)))
      ]);

      const searchDocs = searchSnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          created_at: normalizeTimestamp(data.created_at)
        };
      });

      const searchCount = searchDocs.length;
      const favoritesCount = searchDocs.filter(search => search.is_favorite).length;

      const weekStart = startOfWeek(new Date());
      const monthStart = startOfMonth(new Date());

      const weekIso = weekStart.toISOString();
      const monthIso = monthStart.toISOString();

      const weekSearches = searchDocs.filter(search => search.created_at >= weekIso).length;
      const monthSearches = searchDocs.filter(search => search.created_at >= monthIso).length;

      const recentActivity = searchDocs
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 5)
        .map(search => ({
          id: search.id,
          type: 'search' as const,
          description: `Searched for "${search.search_query}"`,
          timestamp: search.created_at
        }));
      
      setUserStats({
        totalSearches: searchCount,
        totalCandidatesSaved: candidatesSnapshot.size,
        totalProjects: projectsSnapshot.size,
        favoriteSearches: favoritesCount,
        searchesThisWeek: weekSearches,
        searchesThisMonth: monthSearches,
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
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const historyQuery = query(
        collection(db, 'search_history'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(historyQuery);
      const projectCache = new Map<string, Project>();

      const history = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as any;
          let project: Project | undefined;

          if (data.project_id) {
            if (projectCache.has(data.project_id)) {
              project = projectCache.get(data.project_id);
            } else {
              const projectRef = doc(db, 'projects', data.project_id);
              const projectSnap = await getDoc(projectRef);
              if (projectSnap.exists()) {
                const projectData = projectSnap.data() as Project;
                project = {
                  id: projectSnap.id,
                  ...projectData,
                  created_at: normalizeTimestamp(projectData.created_at),
                  updated_at: normalizeTimestamp(projectData.updated_at)
                };
                projectCache.set(data.project_id, project);
              }
            }
          }

          return {
            id: docSnap.id,
            ...(data as SearchHistoryItem),
            created_at: normalizeTimestamp(data.created_at),
            project
          } as SearchHistoryItem;
        })
      );

      setSearchHistory(history);
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast.error("Failed to load search history");
    }
  };

  const fetchProjects = async () => {
    if (!user) return;

    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const projectsQuery = query(
        collection(db, 'projects'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);
      const loadedProjects = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as Project;
        return {
          id: docSnap.id,
          ...data,
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

  const handleUpdateProfile = async () => {
    if (!user || !profileData) return;
    
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        full_name: editingName,
        updated_at: new Date().toISOString()
      });
      
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

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload to Firebase Storage with progress tracking
      const avatarUrl = await uploadAvatar(user.uid, file, (progress) => {
        // Optional: You could show upload progress here
        console.log(`Upload progress: ${progress}%`);
      });

      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });

      if (profileData) {
        setProfileData({ ...profileData, avatar_url: avatarUrl });
      }

      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error('Error uploading avatar:', error);

      // Provide more specific error messages
      let errorMessage = "Failed to upload avatar";
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = "Please sign in again to upload an avatar";
        } else if (error.message.includes('quota exceeded')) {
          errorMessage = "Storage quota exceeded. Please try again later";
        } else if (error.message.includes('unauthorized')) {
          errorMessage = "You don't have permission to upload files";
        } else if (error.message.includes('invalid format')) {
          errorMessage = "Invalid image format. Please use JPEG, PNG, GIF, or WebP";
        }
      }

      toast.error(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleFavorite = async (searchId: string, currentStatus: boolean) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const searchRef = doc(db, 'search_history', searchId);
      await updateDoc(searchRef, {
        is_favorite: !currentStatus,
        updated_at: new Date().toISOString()
      });
      
      fetchSearchHistory();
      toast.success(currentStatus ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await deleteDoc(doc(db, 'search_history', searchId));
      
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
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await addDoc(collection(db, 'projects'), {
        ...newProject,
        user_id: user.uid,
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
