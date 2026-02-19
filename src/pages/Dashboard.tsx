import { useState, useEffect } from "react";
import {
  Search,
  UserSearch,
  Briefcase,
  Video,
  MessageSquare,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Folder,
  Clock,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useNewAuth } from "@/context/NewAuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
  limit as firestoreLimit
} from "firebase/firestore";
import { normalizeTimestamp } from "@/lib/timestamp";
import { formatDistanceToNow, startOfWeek } from "date-fns";

interface RecentSearch {
  id: string;
  search_query: string;
  boolean_query: string;
  platform: string;
  results_count: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  candidates_count: number;
  created_at: string;
  is_archived: boolean;
}

interface DashboardStats {
  totalSearches: number;
  searchesThisWeek: number;
  totalProjects: number;
  activeProjects: number;
}

const quickActions = [
  {
    title: "New Search",
    description: "Find candidates with AI boolean search",
    icon: Search,
    path: "/sourcing",
    color: "bg-purple-100 text-purple-700",
  },
  {
    title: "Find Contacts",
    description: "Look up emails and phone numbers",
    icon: UserSearch,
    path: "/enrichment",
    color: "bg-teal-100 text-teal-700",
  },
  {
    title: "Post a Job",
    description: "Create an AI-optimized job posting",
    icon: Briefcase,
    path: "/job-post",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Start Interview",
    description: "Launch an AI-assisted video call",
    icon: Video,
    path: "/meeting",
    color: "bg-green-100 text-green-700",
  },
  {
    title: "AI Assistant",
    description: "Get help from your recruiting copilot",
    icon: MessageSquare,
    path: "/chat",
    color: "bg-pink-100 text-pink-700",
  },
  {
    title: "Create Content",
    description: "Generate outreach and job descriptions",
    icon: PlusCircle,
    path: "/content-creation",
    color: "bg-orange-100 text-orange-700",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useNewAuth();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setError(null);

        const [searchesResult, projectsResult, countSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "search_history"),
              where("user_id", "==", user.uid),
              orderBy("created_at", "desc"),
              firestoreLimit(5)
            )
          ),
          getDocs(
            query(
              collection(db, "projects"),
              where("user_id", "==", user.uid),
              orderBy("created_at", "desc")
            )
          ),
          getCountFromServer(
            query(
              collection(db, "search_history"),
              where("user_id", "==", user.uid)
            )
          ),
        ]);

        const searches = searchesResult.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<RecentSearch, "id">),
          created_at: normalizeTimestamp(doc.data().created_at),
        }));
        setRecentSearches(searches);

        const allProjects = projectsResult.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
          created_at: normalizeTimestamp(doc.data().created_at),
        }));
        const active = allProjects.filter((p) => !p.is_archived);
        setProjects(active.slice(0, 4));

        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekSearches = searches.filter(
          (s) => new Date(s.created_at) >= weekStart
        ).length;

        setStats({
          totalSearches: countSnap.data().count,
          searchesThisWeek: weekSearches,
          totalProjects: allProjects.length,
          activeProjects: active.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Unable to load your dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your recruiting pipeline
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Search className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSearches}</p>
                  <p className="text-xs text-gray-500">Total Searches</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.searchesThisWeek}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                  <p className="text-xs text-gray-500">Active Projects</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  <p className="text-xs text-gray-500">Total Projects</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
              >
                <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Two column layout: Recent Searches + Projects */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Searches */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Recent Searches
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentSearches.length === 0 ? (
                  <div className="text-center py-6">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No searches yet</p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/sourcing")}
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Start Your First Search
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {recentSearches.map((search) => (
                      <li key={search.id}>
                        <button
                          onClick={() => navigate("/sourcing")}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {search.search_query || "Boolean Search"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {search.platform || "Google"}
                              </Badge>
                              {search.results_count > 0 && (
                                <span className="text-[10px] text-gray-400">
                                  {search.results_count} results
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {search.created_at
                              ? formatDistanceToNow(new Date(search.created_at), { addSuffix: true })
                              : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Folder className="h-4 w-4 text-gray-400" />
                    Active Projects
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-6">
                    <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No active projects</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create a project to organize your recruiting pipeline
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((project) => (
                      <li key={project.id}>
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${project.color}20` }}
                            >
                              <Folder className="h-4 w-4" style={{ color: project.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-[10px] text-gray-400 truncate">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                            {project.candidates_count || 0} candidates
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
