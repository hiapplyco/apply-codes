'use client';

import { useState, useEffect } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Mail,
  Calendar,
  Search,
  Folder,
  Users,
  Star,
  Activity,
  LogOut,
  Edit3,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from 'next/navigation';

// Extracted hooks
import { useProfileData } from '@/views/profile/useProfileData';
import { useSearchHistory } from '@/views/profile/useSearchHistory';
import { useProjects } from '@/views/profile/useProjects';

// Extracted components
import { SearchHistoryTab } from '@/views/profile/SearchHistoryTab';
import { ProjectsTab } from '@/views/profile/ProjectsTab';
import { SettingsTab } from '@/views/profile/SettingsTab';
import { ProjectFormModal } from '@/views/profile/ProjectFormModal';

export default function Profile() {
  const { user, signOut } = useNewAuth();
  const router = useRouter();
  const { subscription, createPortalSession, loading: subscriptionLoading } = useSubscription();

  // Extracted hooks
  const profile = useProfileData(user?.uid);
  const history = useSearchHistory(user?.uid);
  const proj = useProjects(user?.uid);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          profile.fetchProfileData(),
          proj.fetchProjects()
        ]);
        const historyData = await history.fetchSearchHistory();
        history.computeUserStats(historyData);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase();
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative flex-shrink-0">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={profile.profileData?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(profile.profileData?.full_name, user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-2 -right-2 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={profile.handleAvatarUpload}
                    disabled={profile.uploadingAvatar}
                  />
                  <div className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors">
                    {profile.uploadingAvatar ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {profile.profileData?.full_name || 'Unnamed User'}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm sm:text-base">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  Member since {profile.profileData && format(new Date(profile.profileData.created_at), 'MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => profile.setEditModalOpen(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Searches" value={history.userStats?.totalSearches || 0} icon={Search} color="primary" />
        <StatCard label="Saved Candidates" value={history.userStats?.totalCandidatesSaved || 0} icon={Users} color="success" />
        <StatCard label="Active Projects" value={history.userStats?.totalProjects || 0} icon={Folder} color="warning" />
        <StatCard label="This Month" value={history.userStats?.searchesThisMonth || 0} icon={Activity} color="info" />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full bg-muted p-1 rounded-lg">
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="searches" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Search History
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Projects
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and searches</CardDescription>
            </CardHeader>
            <CardContent>
              {history.userStats?.recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {history.userStats?.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'search' && <Search className="h-5 w-5 text-primary" />}
                        {activity.type === 'save' && <Star className="h-5 w-5 text-yellow-600" />}
                        {activity.type === 'project' && <Folder className="h-5 w-5 text-success" />}
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
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
          <SearchHistoryTab
            searchHistory={history.searchHistory}
            toggleFavorite={history.toggleFavorite}
            deleteSearch={history.deleteSearch}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsTab
            activeProjects={proj.activeProjects}
            onCreateNew={() => proj.setShowCreateProject(true)}
            onEdit={(project) => proj.setEditingProject(project)}
            onArchive={proj.archiveProject}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsTab
            subscription={subscription}
            subscriptionLoading={subscriptionLoading}
            createPortalSession={createPortalSession}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <Dialog open={profile.editModalOpen} onOpenChange={profile.setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.editingName}
                onChange={(e) => profile.setEditingName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => profile.setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={profile.handleUpdateProfile}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <ProjectFormModal
        mode="create"
        open={proj.showCreateProject}
        onOpenChange={proj.setShowCreateProject}
        project={proj.newProject}
        onProjectChange={(updates) => proj.setNewProject({ ...proj.newProject, ...updates })}
        onSubmit={proj.createProject}
      />

      {/* Edit Project Modal */}
      {proj.editingProject && (
        <ProjectFormModal
          mode="edit"
          open={!!proj.editingProject}
          onOpenChange={() => proj.setEditingProject(null)}
          project={proj.editingProject}
          onProjectChange={(updates) => proj.setEditingProject({ ...proj.editingProject!, ...updates })}
          onSubmit={proj.updateProject}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold text-${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color} opacity-20`} />
        </div>
      </CardContent>
    </Card>
  );
}
