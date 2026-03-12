import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Search, Star, Hash, Trash2, MoreVertical, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { SearchHistoryItem } from '@/types/profile';

interface SearchHistoryTabProps {
  searchHistory: SearchHistoryItem[];
  toggleFavorite: (searchId: string, currentStatus: boolean) => void;
  deleteSearch: (searchId: string) => void;
}

export function SearchHistoryTab({ searchHistory, toggleFavorite, deleteSearch }: SearchHistoryTabProps) {
  const router = useRouter();
  const favoriteSearches = searchHistory.filter(s => s.is_favorite);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Search History</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Favorite Searches */}
      {favoriteSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Favorite Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {favoriteSearches.map((search) => (
                <SearchHistoryRow
                  key={search.id}
                  search={search}
                  variant="favorite"
                  onRerun={() => router.push(`/sourcing?search=${encodeURIComponent(search.boolean_query)}`)}
                  onToggleFavorite={() => toggleFavorite(search.id, true)}
                  onDelete={() => deleteSearch(search.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Searches */}
      <Card>
        <CardHeader>
          <CardTitle>All Searches</CardTitle>
          <CardDescription>Your complete search history</CardDescription>
        </CardHeader>
        <CardContent>
          {searchHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No searches yet</p>
          ) : (
            <div className="space-y-3">
              {searchHistory.map((search) => (
                <SearchHistoryRow
                  key={search.id}
                  search={search}
                  variant="default"
                  onRerun={() => router.push(`/sourcing?search=${encodeURIComponent(search.boolean_query)}`)}
                  onToggleFavorite={() => toggleFavorite(search.id, search.is_favorite)}
                  onDelete={() => deleteSearch(search.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SearchHistoryRow({
  search,
  variant,
  onRerun,
  onToggleFavorite,
  onDelete,
}: {
  search: SearchHistoryItem;
  variant: 'favorite' | 'default';
  onRerun: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const bgClass = variant === 'favorite'
    ? 'bg-yellow-50'
    : 'bg-muted hover:bg-muted/80 transition-colors';

  return (
    <div className={`flex items-center justify-between p-4 ${bgClass} rounded-lg`}>
      <div className="flex-1">
        <p className="font-medium">{search.search_query}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
          <DropdownMenuItem onClick={onRerun}>
            <Search className="h-4 w-4 mr-2" />
            Re-run Search
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFavorite}>
            <Star className="h-4 w-4 mr-2" />
            {search.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
