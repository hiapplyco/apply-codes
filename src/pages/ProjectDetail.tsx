import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useNewAuth } from "@/context/NewAuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  documentId,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { 
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  ExternalLink,
  Trash2,
  Download,
  Filter,
  Search,
  Copy,
  CheckCircle,
  UserPlus,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { URLScrapeButton } from "@/components/url-scraper";
import { useProfileEnrichment } from "@/components/search/hooks/useProfileEnrichment";
import { normalizeTimestamp } from "@/lib/timestamp";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  candidates_count?: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface SavedCandidate {
  id: string;
  name: string;
  linkedin_url: string;
  job_title: string;
  company: string;
  location: string;
  work_email: string | null;
  personal_emails: string[] | null;
  mobile_phone: string | null;
  profile_summary: string | null;
  profile_completeness: number | null;
  created_at: string;
  projectCandidateId?: string;
  projectMetadata?: {
    added_at?: string | null;
    notes?: string | null;
    tags?: string[] | null;
  };
}

const CANDIDATES_PER_PAGE = 20;

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useNewAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [enrichingCandidate, setEnrichingCandidate] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Use profile enrichment hook
  const { enrichProfile, isLoading: isEnriching } = useProfileEnrichment();

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
    } else if (!user) {
      // If no user, don't try to fetch - wait for auth
      setLoading(false);
    }
  }, [user, projectId]);

  // Show loading state while waiting for auth
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  const fetchProjectData = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        // Reset pagination state on fresh load
        setLastDoc(null);
        setHasMore(true);
      }

      if (!projectId) {
        throw new Error("Project ID missing");
      }

      if (!user?.id) {
        console.warn("User not authenticated, skipping data fetch");
        return;
      }

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      // Fetch project data only on initial load
      let projectData: Project | null = project;
      if (!loadMore) {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          throw new Error("Project not found or access denied");
        }

        projectData = projectSnap.data() as Project;

        if (projectData.user_id && projectData.user_id !== user.uid) {
          throw new Error("Access denied for this project");
        }

        // Get total count for display
        const countQuery = query(
          collection(db, "project_candidates"),
          where("project_id", "==", projectId)
        );
        const countSnapshot = await getDocs(countQuery);
        setTotalCount(countSnapshot.size);
      }

      // Build paginated query for project_candidates
      const queryConstraints = [
        where("project_id", "==", projectId),
        orderBy("created_at", "desc"),
        limit(CANDIDATES_PER_PAGE)
      ];

      if (loadMore && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const projectCandidatesQuery = query(
        collection(db, "project_candidates"),
        ...queryConstraints
      );

      const projectCandidatesSnapshot = await getDocs(projectCandidatesQuery);

      // Check if there are more results
      setHasMore(projectCandidatesSnapshot.docs.length === CANDIDATES_PER_PAGE);

      // Store last document for pagination cursor
      if (projectCandidatesSnapshot.docs.length > 0) {
        setLastDoc(projectCandidatesSnapshot.docs[projectCandidatesSnapshot.docs.length - 1]);
      }

      // Build a map of candidate_id -> project metadata for efficient lookup
      const projectCandidateMap = new Map<string, { docId: string; metadata: any }>();
      const candidateIds: string[] = [];

      projectCandidatesSnapshot.docs.forEach((projectCandidateDoc) => {
        const data = projectCandidateDoc.data();
        if (data.candidate_id) {
          candidateIds.push(data.candidate_id);
          projectCandidateMap.set(data.candidate_id, {
            docId: projectCandidateDoc.id,
            metadata: {
              added_at: normalizeTimestamp(data.added_at || data.created_at),
              notes: data.notes || null,
              tags: data.tags || []
            }
          });
        }
      });

      // Batch fetch all candidates - Firestore IN query supports up to 30 items
      const BATCH_SIZE = 30;
      const candidateBatches: SavedCandidate[][] = [];

      for (let i = 0; i < candidateIds.length; i += BATCH_SIZE) {
        const batchIds = candidateIds.slice(i, i + BATCH_SIZE);
        if (batchIds.length === 0) continue;

        const candidatesQuery = query(
          collection(db, "saved_candidates"),
          where(documentId(), "in", batchIds)
        );

        const candidatesSnapshot = await getDocs(candidatesQuery);

        const batchCandidates = candidatesSnapshot.docs.map((candidateSnap) => {
          const candidateData = candidateSnap.data();
          const projData = projectCandidateMap.get(candidateSnap.id);

          return {
            id: candidateSnap.id,
            name: candidateData.name,
            linkedin_url: candidateData.linkedin_url,
            job_title: candidateData.job_title,
            company: candidateData.company,
            location: candidateData.location,
            work_email: candidateData.work_email ?? null,
            personal_emails: candidateData.personal_emails ?? null,
            mobile_phone: candidateData.mobile_phone ?? null,
            profile_summary: candidateData.profile_summary ?? null,
            profile_completeness: candidateData.profile_completeness ?? null,
            created_at: normalizeTimestamp(candidateData.created_at),
            projectCandidateId: projData?.docId,
            projectMetadata: projData?.metadata
          } as SavedCandidate;
        });

        candidateBatches.push(batchCandidates);
      }

      // Flatten and maintain original order based on project_candidates order
      const candidatesMap = new Map<string, SavedCandidate>();
      candidateBatches.flat().forEach(candidate => {
        candidatesMap.set(candidate.id, candidate);
      });

      // Preserve original order from project_candidates query
      const newCandidates = candidateIds
        .map(id => candidatesMap.get(id))
        .filter((candidate): candidate is SavedCandidate => candidate !== undefined);

      if (loadMore) {
        // Append to existing candidates
        setCandidates(prev => [...prev, ...newCandidates]);
      } else {
        // Replace candidates
        setCandidates(newCandidates);

        if (projectData) {
          setProject({
            id: projectId,
            ...projectData,
            candidates_count: totalCount || newCandidates.length,
            created_at: normalizeTimestamp(projectData.created_at),
            updated_at: normalizeTimestamp(projectData.updated_at)
          });
        }
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load project data: ${errorMessage}`);
      if (!loadMore) {
        navigate("/profile");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProjectData(true);
    }
  };

  const handleRemoveCandidate = async (candidateId: string, projectCandidateId?: string) => {
    if (!confirm("Are you sure you want to remove this candidate from the project?")) {
      return;
    }

    try {
      if (!db) {
        throw new Error("Firestore not initialized");
      }

      if (!projectCandidateId) {
        throw new Error("Unable to locate project candidate record");
      }

      await deleteDoc(doc(db, "project_candidates", projectCandidateId));

      toast.success("Candidate removed from project");
      fetchProjectData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove candidate");
    }
  };

  const handleCopyField = (value: string, fieldName: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportCandidates = () => {
    const csvContent = [
      ["Name", "Job Title", "Company", "Location", "Work Email", "Personal Emails", "Phone", "LinkedIn URL"],
      ...filteredCandidates.map(candidate => [
        candidate.name,
        candidate.job_title || "",
        candidate.company || "",
        candidate.location || "",
        candidate.work_email || "",
        candidate.personal_emails?.join("; ") || "",
        candidate.mobile_phone || "",
        candidate.linkedin_url
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const projectName = project?.name || "project";
    a.download = `${projectName.replace(/\s+/g, "-")}-candidates.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Candidates exported successfully");
  };

  const handleEnrichCandidate = async (candidate: SavedCandidate) => {
    if (!candidate.linkedin_url) {
      toast.error("No LinkedIn URL available for this candidate");
      return;
    }

    setEnrichingCandidate(candidate.id);
    
    try {
      const enrichedData = await enrichProfile(candidate.linkedin_url);
      
      if (enrichedData) {
        if (!db) {
          throw new Error("Firestore not initialized");
        }

        const candidateRef = doc(db, "saved_candidates", candidate.id);
        await updateDoc(candidateRef, {
          work_email: enrichedData.work_email || candidate.work_email,
          personal_emails: enrichedData.personal_emails || candidate.personal_emails,
          mobile_phone: enrichedData.mobile_phone || candidate.mobile_phone,
          profile_summary: enrichedData.bio || enrichedData.summary || candidate.profile_summary,
          ...(enrichedData.job_title && { job_title: enrichedData.job_title }),
          ...(enrichedData.job_company_name && { company: enrichedData.job_company_name }),
          updated_at: new Date().toISOString()
        });

        fetchProjectData();
        toast.success('Contact information updated successfully');
      }
    } catch (error) {
      console.error('Error enriching candidate:', error);
      toast.error('Failed to enrich candidate');
    } finally {
      setEnrichingCandidate(null);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const searchLower = searchTerm.toLowerCase();
    return (
      candidate.name.toLowerCase().includes(searchLower) ||
      candidate.job_title?.toLowerCase().includes(searchLower) ||
      candidate.company?.toLowerCase().includes(searchLower) ||
      candidate.location?.toLowerCase().includes(searchLower) ||
      candidate.work_email?.toLowerCase().includes(searchLower)
    );
  });

  const projectCreatedDate = project?.created_at ? new Date(project.created_at) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/search-history")}
            className="mb-4 hover:bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <Users
                className="w-8 h-8"
                style={{ color: project.color }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#39FF14] to-[#9D4EDD] bg-clip-text text-transparent">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600 mt-2 text-lg">{project.description}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Created {projectCreatedDate ? format(projectCreatedDate, "MMM d, yyyy") : "N/A"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {totalCount || candidates.length} candidates
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <URLScrapeButton
              context="general"
              buttonText="Add Research"
              projectId={project.id}
            />
            <Button
              onClick={handleExportCandidates}
              disabled={filteredCandidates.length === 0}
              className="bg-gradient-to-r from-[#39FF14] to-[#9D4EDD] hover:opacity-90 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search candidates by name, title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="grid gap-4">
          {filteredCandidates.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
              <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No candidates match your search" : "No candidates in this project yet"}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/sourcing")}
                >
                  Start Sourcing
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="bg-white/90 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all hover:scale-[1.01] hover:bg-white group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{candidate.name}</h3>
                      {candidate.profile_completeness && (
                        <Badge variant="outline">
                          {candidate.profile_completeness}% complete
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {candidate.job_title && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{candidate.job_title}</span>
                        </div>
                      )}
                      {candidate.company && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{candidate.company}</span>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{candidate.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {(candidate.work_email || candidate.personal_emails?.length || candidate.mobile_phone) && (
                      <div className="bg-gradient-to-r from-green-50 to-purple-50 p-4 rounded-lg mb-4 space-y-2 border border-green-200/50">
                        {candidate.work_email && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-green-600" />
                              <span>{candidate.work_email}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyField(candidate.work_email!, "Email")}
                              className="p-1"
                            >
                              {copiedField === "Email" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        {candidate.mobile_phone && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-green-600" />
                              <span>{candidate.mobile_phone}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyField(candidate.mobile_phone!, "Phone")}
                              className="p-1"
                            >
                              {copiedField === "Phone" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    {candidate.profile_summary && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {candidate.profile_summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View LinkedIn
                        </a>
                      </Button>
                      
                      {/* Nymeria Get Contact Button - Show if missing contact info */}
                      {(!candidate.work_email && !candidate.personal_emails?.length && !candidate.mobile_phone) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnrichCandidate(candidate)}
                          disabled={enrichingCandidate === candidate.id}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          {enrichingCandidate === candidate.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Getting Contact...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Get Contact Info
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                          onClick={() => handleRemoveCandidate(candidate.id, candidate.projectCandidateId)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Button */}
        {hasMore && candidates.length > 0 && !searchTerm && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="min-w-[200px]"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More Candidates</>
              )}
            </Button>
          </div>
        )}

        {/* Pagination Status */}
        {candidates.length > 0 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {candidates.length} of {totalCount} candidates
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
