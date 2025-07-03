
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SearchResultItemProps, Profile } from "../types"; // Import Profile
import { useProfileEnrichment } from "../hooks/useProfileEnrichment";
import { EnrichedInfoModal } from "../../enriched-info-modal/EnrichedInfoModal"; // Updated import path and name

export const SearchResultItem = ({ 
  result, 
  searchType 
}: SearchResultItemProps) => {
  console.log("🔍 [DEBUG] SearchResultItem rendering with:", {
    name: result.name || result.title,
    link: result.link || result.profileUrl,
    hasLocation: !!result.location
  });

  const { enrichProfile } = useProfileEnrichment();
  const [isLoading, setIsLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [showContactCard, setShowContactCard] = useState(false);
  
  // Extract name from the title for better search results
  const extractNameFromTitle = (title: string): string => {
    // Remove HTML tags
    const withoutTags = title.replace(/<\/?[^>]+(>|$)/g, "");
    // Try to get just the name before any symbols like |, -, at, etc.
    const namePart = withoutTags.split(/[|\-–—@]/).map(segment => segment.trim())[0];
    return namePart || withoutTags;
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

  // Construct a basic Profile object from the result
  const profile: Profile = {
    name: extractNameFromTitle(result.htmlTitle || result.name),
    title: result.jobTitle || result.title, // Use jobTitle if available
    location: result.location,
    profile_name: extractNameFromTitle(result.htmlTitle || result.name),
    profile_title: result.jobTitle || result.title,
    profile_location: result.location,
    profile_url: result.link || result.profileUrl || '',
    snippet: result.snippet || '',
  };

  return (
    <div className="p-4 border rounded-lg border-black relative hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-[#F5F0ED]">
      <h3 className="font-medium">
        <a
          href={profile.profile_url} // Use constructed profile URL
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          dangerouslySetInnerHTML={{ __html: result.htmlTitle || profile.name }} // Use profile name
        />
      </h3>
      {profile.location && ( // Use profile location
        <p className="mt-1 text-sm font-semibold text-emerald-600 flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          {profile.location}
        </p>
      )}
      <p className="mt-1 text-sm text-gray-600">{profile.snippet || profile.title}</p>
      
      {(profile.profile_url?.includes('linkedin.com/in/')) && ( // Check constructed profile URL
        <div className="mt-2 flex justify-end">
          <Button
            onClick={handleGetContactInfo}
            size="sm"
            variant="secondary"
            disabled={isLoading}
            className="border-2 border-black bg-[#FEF7CD] hover:bg-[#FEF7CD]/80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] z-10 animate-fade-in"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Get Contact Info
              </>
            )}
          </Button>
        </div>
      )}

      {/* Use the new consolidated modal */}
      <EnrichedInfoModal
        isOpen={showContactCard}
        onClose={() => setShowContactCard(false)}
        profile={profile} // Pass the constructed profile object
        profileData={enrichedData} // Pass enrichedData
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
