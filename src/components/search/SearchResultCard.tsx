import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/search/SourceBadge';
import { Search, Sparkles, Mail, MapPin, Globe, Plus, CheckCircle, User, Phone, Briefcase, Code, Loader2, AlertCircle } from 'lucide-react';
import type { SearchResult, ContactInfo } from '@/types/search-form';

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  analysis: any;
  contact: ContactInfo | undefined;
  loadingAnalysis: boolean;
  loadingContact: boolean;
  savedCandidate: boolean;
  savingCandidate: boolean;
  onToggleSelection: (index: number) => void;
  onAnalyze: (result: SearchResult, index: number) => void;
  onGetContact: (result: SearchResult, index: number) => void;
  onSave: (result: SearchResult, index: number) => void;
  onEmail: (index: number) => void;
}

export function SearchResultCard({
  result,
  index,
  viewMode,
  isSelected,
  analysis,
  contact,
  loadingAnalysis,
  loadingContact,
  savedCandidate,
  savingCandidate,
  onToggleSelection,
  onAnalyze,
  onGetContact,
  onSave,
  onEmail,
}: SearchResultCardProps) {
  return (
    <div
      className={`
        group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl
        ${isSelected ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/30' : 'border-gray-200 hover:border-purple-200'}
        ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 p-6' : 'flex flex-col p-5 h-full'}
      `}
    >
      {/* Selection Checkbox - Absolute positioning for grid */}
      <div className="absolute top-4 right-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(index);
          }}
          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer transition-all"
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${viewMode === 'list' ? 'min-w-0' : 'flex flex-col'}`}>
        {/* Header: Title & Role */}
        <div className="mb-3 pr-8">
          <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-purple-700 transition-colors">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline decoration-2 decoration-purple-200"
            >
              {result.title.split(' | ')[0] || result.title.split(' - ')[0] || result.title}
            </a>
          </h3>
          {(result.title.includes(' | ') || result.title.includes(' - ')) && (
            <p className="text-sm font-medium text-purple-600 mt-1">
              {result.title.split(' | ')[1] || result.title.split(' - ')[1]}
            </p>
          )}
        </div>

        {/* Location & Source */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          {(result as any).source && (
            <SourceBadge source={(result as any).source} size="sm" />
          )}
          {result.location && (
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {result.location}
            </span>
          )}
          {!((result as any).source) && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {(() => { try { return new URL(result.link).hostname.replace('www.', ''); } catch { return result.displayLink; } })()}
            </span>
          )}
        </div>

        {/* Snippet */}
        <p className={`text-sm text-gray-600 leading-relaxed mb-4 ${viewMode === 'grid' ? 'line-clamp-4 flex-1' : ''}`}>
          {result.snippet}
        </p>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {((result as any).skills?.length > 0
            ? (result as any).skills.slice(0, viewMode === 'grid' ? 4 : 8)
            : result.snippet.match(/\b(Python|JavaScript|React|Node|AWS|GCP|Azure|SQL|Docker|Kubernetes|Java|C\+\+|TypeScript|Machine Learning|AI|Data Science|Full Stack|Backend|Frontend|DevOps)\b/gi)?.slice(0, viewMode === 'grid' ? 4 : 8) || []
          ).map((skill: string, skillIndex: number) => (
            <Badge
              key={skillIndex}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 font-medium"
            >
              {skill}
            </Badge>
          ))}
        </div>

        {/* Action Bar */}
        <div className={`
          flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-auto
          ${viewMode === 'list' ? 'justify-start' : 'justify-between'}
        `}>
          {/* Analyze Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAnalyze(result, index)}
            disabled={loadingAnalysis}
            className="h-8 text-xs font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {loadingAnalysis ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Analyze
          </Button>

          {/* Get Contact Info Button (Nymeria) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onGetContact(result, index)}
            disabled={loadingContact || !!contact}
            className={`h-8 text-xs font-medium ${contact
              ? 'text-green-600 bg-green-50 hover:bg-green-100'
              : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
          >
            {loadingContact ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : contact ? (
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <User className="w-3.5 h-3.5 mr-1.5" />
            )}
            {contact ? 'Contact Found' : 'Get Contact'}
          </Button>

          {/* Email Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEmail(index)}
            className="h-8 text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Email
          </Button>

          {/* Add to Global Project Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSave(result, index)}
            disabled={savingCandidate || savedCandidate}
            className={`h-8 text-xs font-medium ${savedCandidate
              ? 'text-green-600 bg-green-50 hover:bg-green-100'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            {savingCandidate ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : savedCandidate ? (
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1.5" />
            )}
            {savedCandidate ? 'Saved' : 'Add to Project'}
          </Button>
        </div>
      </div>

      {/* Contact Info Section */}
      {contact && (
        <div className={`
          bg-white border border-gray-100 rounded-xl p-4 shadow-sm
          ${viewMode === 'list' ? 'w-72 flex-shrink-0' : 'mt-4'}
        `}>
          <h4 className="font-semibold text-sm text-emerald-900 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-emerald-600" />
            Contact Info
          </h4>
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline truncate">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.work_email && contact.work_email !== contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <a href={`mailto:${contact.work_email}`} className="text-blue-600 hover:underline truncate">
                  {contact.work_email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.twitter_url && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <a href={contact.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  Twitter
                </a>
              </div>
            )}
            {contact.github_url && (
              <div className="flex items-center gap-2 text-sm">
                <Code className="w-3.5 h-3.5 text-gray-400" />
                <a href={contact.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  GitHub
                </a>
              </div>
            )}
            {!contact.email && !contact.phone && (
              <p className="text-xs text-gray-500 italic">No contact details found</p>
            )}
          </div>
        </div>
      )}

      {/* Analysis Results Overlay/Section */}
      {analysis && (
        <div className={`
          bg-white border border-gray-100 rounded-xl p-4 shadow-sm
          ${viewMode === 'list' ? 'w-80 flex-shrink-0' : 'mt-4'}
        `}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Analysis
            </h4>
            {analysis.match_score && (
              <Badge className={`
                ${analysis.match_score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                  analysis.match_score >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'}
              `}>
                {analysis.match_score}% Match
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Strengths</span>
                <ul className="mt-1 space-y-1">
                  {analysis.strengths.slice(0, 2).map((strength: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.concerns && analysis.concerns.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Concerns</span>
                <ul className="mt-1 space-y-1">
                  {analysis.concerns.slice(0, 1).map((concern: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
