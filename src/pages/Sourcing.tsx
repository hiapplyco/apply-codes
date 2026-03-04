import { lazy, Suspense, memo, useState, useEffect, useRef } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { type ContextBarProps } from "@/components/context/ContextBar";
import { StandardProjectContext } from '@/components/project/StandardProjectContext';
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { useProjectContext } from "@/context/ProjectContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  Search,
  TrendingUp,
  Users,
  Folder,
  Upload,
  Link,
  Sparkles,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MinimalSearchForm = lazy(() => import("@/components/MinimalSearchForm"));

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="lg" text="Loading search tools..." />
  </div>
);

interface RecentSearch {
  id: string;
  search_query: string;
  boolean_query: string;
  platform: string;
  results_count: number;
  created_at: string;
}

const SourcingComponent = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useNewAuth();
  const { selectedProjectId, selectedProject } = useProjectContext();
  const { subscription } = useSubscription();
  const { processContent } = useContextIntegration({ context: 'sourcing' });

  const [showContext, setShowContext] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [totalSearches, setTotalSearches] = useState(0);
  const [searchesThisWeek, setSearchesThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const loadSourcingData = async () => {
      try {
        setError(null);
        const [searchesResult, countSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "search_history"),
              where("user_id", "==", user.uid),
              orderBy("created_at", "desc"),
              firestoreLimit(5)
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
        setTotalSearches(countSnap.data().count);

        const weekStart = startOfWeek(new Date());
        setSearchesThisWeek(
          searches.filter((s) => new Date(s.created_at) >= weekStart).length
        );
      } catch (err) {
        console.error("Failed to load sourcing data:", err);
        setError("Unable to load sourcing data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    loadSourcingData();
  }, [user]);

  const enrichmentsUsed = subscription?.usage?.candidatesEnriched ?? 0;

  const scrollToSearch = () => {
    searchFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContextContent: NonNullable<ContextBarProps['onContentProcessed']> = async (content) => {
    try {
      await processContent(content);
    } catch (error) {
      console.error('Context processing error:', error);
      toast.error('Failed to process context content');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading sourcing data..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please refresh the page or log in again to continue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const quickActions = [
    {
      title: "New Search",
      icon: Search,
      color: "bg-primary/10 text-primary",
      onClick: scrollToSearch,
    },
    {
      title: "Upload JD",
      icon: Upload,
      color: "bg-success/10 text-success",
      onClick: () => {
        scrollToSearch();
        toast.info("Use the Upload button in the search form below");
      },
    },
    {
      title: "Scrape URL",
      icon: Link,
      color: "bg-info/10 text-info",
      onClick: () => {
        scrollToSearch();
        toast.info("Use the Scrape button in the search form below");
      },
    },
    {
      title: "AI Research",
      icon: Sparkles,
      color: "bg-warning/10 text-warning",
      onClick: () => {
        scrollToSearch();
        toast.info("Use the AI Research button in the search form below");
      },
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Candidate Sourcing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered boolean search, enrichment, and outreach pipeline
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowContext(!showContext)}
            aria-label={showContext ? 'Hide context panel' : 'Show context panel'}
            aria-expanded={showContext}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedProject
                ? 'bg-success/5 text-success border border-success/20'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[120px] truncate">
              {selectedProject?.name || 'Add Context'}
            </span>
            {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Collapsible Context */}
        {showContext && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <StandardProjectContext
                context="sourcing"
                title=""
                description=""
                onContentProcessed={async (content) => {
                  await handleContextContent(content);
                  setShowContext(false);
                }}
                enabledButtons={{
                  upload: true,
                  firecrawl: true,
                  perplexity: true,
                  location: true
                }}
                className="border-0 shadow-none p-0 mb-0"
              />
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" /> : totalSearches}
                </p>
                <p className="text-xs text-muted-foreground">Total Searches</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" /> : searchesThisWeek}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{enrichmentsUsed}</p>
                <p className="text-xs text-muted-foreground">Enrichments</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Folder className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground truncate max-w-[100px]">
                  {selectedProject?.name || "—"}
                </p>
                <p className="text-xs text-muted-foreground">Active Project</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                variant="ghost"
                key={action.title}
                onClick={action.onClick}
                className="group flex flex-col items-center gap-2 p-4 h-auto rounded-xl bg-white border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div aria-hidden="true" className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                  {action.title}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {!loading && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground/60" />
                  Recent Searches
                </CardTitle>
                {recentSearches.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollToSearch}
                    className="text-xs text-primary hover:text-primary"
                  >
                    New Search
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentSearches.length === 0 ? (
                <div className="text-center py-6">
                  <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No searches yet</p>
                  <Button
                    size="sm"
                    onClick={scrollToSearch}
                    className="mt-3"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Start Your First Search
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {recentSearches.map((search) => (
                    <li key={search.id}>
                      <Button
                        variant="ghost"
                        onClick={scrollToSearch}
                        className="w-full flex items-center justify-between p-2.5 h-auto rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {search.search_query || "Boolean Search"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {search.platform || "Google"}
                            </Badge>
                            {search.results_count > 0 && (
                              <span className="text-[10px] text-muted-foreground/60">
                                {search.results_count} results
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 ml-2">
                          {search.created_at
                            ? formatDistanceToNow(new Date(search.created_at), { addSuffix: true })
                            : ""}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section Divider */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Boolean Search
        </h2>

        {/* Search Form */}
        <div ref={searchFormRef}>
          <Suspense fallback={<LoadingState />}>
            <MinimalSearchForm
              userId={user?.uid ?? null}
              selectedProjectId={selectedProjectId}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const Sourcing = memo(SourcingComponent);
export default Sourcing;
