import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ExternalLink,
    MapPin,
    Building2,
    Star,
    UserPlus,
    Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LinkedInCandidate {
    id: string;
    name: string;
    title: string;
    company: string;
    location: string;
    profileUrl: string;
    summary?: string;
    skills?: string[];
    matchScore?: number;
    source?: string;
}

interface LinkedInCandidateCardProps {
    candidate: LinkedInCandidate;
    onViewProfile?: (url: string) => void;
    onSave?: (candidate: LinkedInCandidate) => void;
    onGetContact?: (candidate: LinkedInCandidate) => void;
    compact?: boolean;
}

export const LinkedInCandidateCard: React.FC<LinkedInCandidateCardProps> = ({
    candidate,
    onViewProfile,
    onSave,
    onGetContact,
    compact = false
}) => {
    const handleViewProfile = () => {
        if (onViewProfile) {
            onViewProfile(candidate.profileUrl);
        } else {
            window.open(candidate.profileUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const matchPercentage = candidate.matchScore
        ? Math.round(candidate.matchScore * 100)
        : null;

    return (
        <Card className={cn(
            "border-2 border-gray-200 hover:border-purple-300 transition-all duration-200",
            "bg-gradient-to-br from-white to-purple-50/30",
            "hover:shadow-lg hover:-translate-y-0.5",
            compact ? "p-2" : "p-0"
        )}>
            <CardContent className={cn(compact ? "p-2" : "p-4")}>
                {/* Header with name and match score */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-base">
                            {candidate.name || 'Name not available'}
                        </h4>
                        {candidate.title && (
                            <p className="text-sm text-purple-700 font-medium truncate mt-0.5">
                                {candidate.title}
                            </p>
                        )}
                    </div>

                    {matchPercentage !== null && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            matchPercentage >= 80 ? "bg-green-100 text-green-700" :
                                matchPercentage >= 60 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-gray-100 text-gray-600"
                        )}>
                            <Star className="w-3 h-3" />
                            {matchPercentage}%
                        </div>
                    )}
                </div>

                {/* Company and Location */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                    {candidate.company && candidate.company !== 'Company not specified' && (
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {candidate.company}
                        </span>
                    )}
                    {candidate.location && candidate.location !== 'Location not specified' && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {candidate.location}
                        </span>
                    )}
                </div>

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {candidate.skills.slice(0, 5).map((skill, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700 border-0"
                            >
                                {skill}
                            </Badge>
                        ))}
                        {candidate.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 5} more
                            </Badge>
                        )}
                    </div>
                )}

                {/* Summary snippet */}
                {candidate.summary && !compact && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {candidate.summary}
                    </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                        size="sm"
                        variant="default"
                        onClick={handleViewProfile}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                    >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        View Profile
                    </Button>

                    {onSave && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSave(candidate)}
                            className="text-xs h-8 border-purple-200 hover:bg-purple-50"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                    )}

                    {onGetContact && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGetContact(candidate)}
                            className="text-xs h-8 border-purple-200 hover:bg-purple-50"
                        >
                            <Mail className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Component to render a list of candidates in chat
interface LinkedInCandidateListProps {
    candidates: LinkedInCandidate[];
    onSave?: (candidate: LinkedInCandidate) => void;
    onGetContact?: (candidate: LinkedInCandidate) => void;
}

export const LinkedInCandidateList: React.FC<LinkedInCandidateListProps> = ({
    candidates,
    onSave,
    onGetContact
}) => {
    if (!candidates || candidates.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                    Found {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                {candidates.map((candidate, idx) => (
                    <LinkedInCandidateCard
                        key={candidate.id || idx}
                        candidate={candidate}
                        onSave={onSave}
                        onGetContact={onGetContact}
                        compact={candidates.length > 4}
                    />
                ))}
            </div>
        </div>
    );
};

export default LinkedInCandidateCard;
