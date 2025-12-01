
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, MapPin, ExternalLink, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { SearchResultItemProps, Profile } from "../types";
import { useProfileEnrichment } from "../hooks/useProfileEnrichment";
import { EnrichedInfoModal } from "../../enriched-info-modal/EnrichedInfoModal";

export const SearchResultItem = ({
  result,
  searchType
}: SearchResultItemProps) => {
  const { enrichProfile } = useProfileEnrichment();
  const [isLoading, setIsLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [showContactCard, setShowContactCard] = useState(false);

  // Extract name from the title for better search results
  const extractNameFromTitle = (title: string): string => {
    const withoutTags = title.replace(/<\/?[^>]+(>|$)/g, "");
    const namePart = withoutTags.split(/[|\-–—@]/).map(segment => segment.trim())[0];
    return namePart || withoutTags;
  };

  // Extract location from snippet if not already provided
  const extractLocationFromSnippet = (snippet: string): string | null => {
    // Common patterns for location in LinkedIn snippets
    const locationPatterns = [
      /(?:located in|based in|from)\s+([A-Z][a-zA-Z\s,]+(?:Area|Metro)?)/i,
      /([A-Z][a-zA-Z]+(?:,\s*[A-Z]{2})?)\s+(?:Area|Metro)/,
      /·\s*([A-Z][a-zA-Z\s,]+(?:Area|Metro)?)\s*·/,
    ];

    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Extract job title from snippet
  const extractJobTitleFromSnippet = (snippet: string): string | null => {
    const withoutTags = snippet.replace(/<\/?[^>]+(>|$)/g, "");
    // Try to find title patterns
    const titlePatterns = [
      /^([^·|]+?)(?:\s*[·|]|$)/,
      /(?:^|\n)([A-Z][^·|\n]{10,60})(?:\s+at\s+|\s+@\s+)/i,
    ];

    for (const pattern of titlePatterns) {
      const match = withoutTags.match(pattern);
      if (match && match[1] && match[1].length > 5) {
        return match[1].trim();
      }
    }
    return null;
  };

  const handleGetContactInfo = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setShowContactCard(true);

    try {
      const data = await enrichProfile(result.link || result.profileUrl || '');
      if (data) {
        setEnrichedData(data);
        toast.success("Contact information found!");
      } else {
        setError("No contact information found");
        toast.error("No contact information found");
      }
    } catch (error) {
      console.error("Error enriching profile:", error);
      setError("Could not retrieve contact information");
      toast.error("Could not retrieve contact information");
    } finally {
      setIsLoading(false);
    }
  };

  const name = extractNameFromTitle(result.htmlTitle || result.name || result.title || '');
  const location = result.location || extractLocationFromSnippet(result.snippet || '');
  const jobTitle = result.jobTitle || result.title || extractJobTitleFromSnippet(result.snippet || '');
  const profileUrl = result.link || result.profileUrl || '';
  const snippet = result.snippet || '';
  const isLinkedIn = profileUrl.includes('linkedin.com/in/');

  // Construct a basic Profile object from the result
  const profile: Profile = {
    name,
    title: jobTitle,
    location,
    profile_name: name,
    profile_title: jobTitle,
    profile_location: location,
    profile_url: profileUrl,
    snippet,
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
      {/* Header: Name + External Link */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span dangerouslySetInnerHTML={{ __html: result.htmlTitle || name }} />
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
            </a>
          </h3>

          {/* Job Title */}
          {jobTitle && jobTitle !== name && (
            <p className="mt-1 text-sm text-gray-600 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{jobTitle}</span>
            </p>
          )}

          {/* Location */}
          {location && (
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{location}</span>
            </p>
          )}
        </div>

        {/* LinkedIn Badge */}
        {isLinkedIn && (
          <span className="flex-shrink-0 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
            LinkedIn
          </span>
        )}
      </div>

      {/* Snippet */}
      {snippet && (
        <p className="mt-3 text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {snippet.replace(/<\/?[^>]+(>|$)/g, "")}
        </p>
      )}

      {/* Actions */}
      {isLinkedIn && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <Button
            onClick={handleGetContactInfo}
            size="sm"
            variant="outline"
            disabled={isLoading}
            className="text-sm h-8 px-3 border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 mr-1.5" />
                Get Contact Info
              </>
            )}
          </Button>
        </div>
      )}

      <EnrichedInfoModal
        isOpen={showContactCard}
        onClose={() => setShowContactCard(false)}
        profile={profile}
        profileData={enrichedData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
