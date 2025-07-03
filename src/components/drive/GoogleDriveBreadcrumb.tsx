import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { 
  Home, 
  ChevronRight, 
  FolderOpen, 
  MoreHorizontal, 
  Star, 
  Clock, 
  Users, 
  Trash2,
  GoogleDrive,
  Search,
  Filter
} from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'root' | 'folder' | 'shared' | 'recent' | 'starred' | 'trash';
  path: string;
  isClickable?: boolean;
}

interface GoogleDriveBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  currentFilter?: string;
  className?: string;
}

export function GoogleDriveBreadcrumb({
  items,
  onNavigate,
  onSearch,
  onFilterChange,
  currentFilter,
  className = ''
}: GoogleDriveBreadcrumbProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'root':
        return <Home className="w-4 h-4" />;
      case 'folder':
        return <FolderOpen className="w-4 h-4" />;
      case 'shared':
        return <Users className="w-4 h-4" />;
      case 'recent':
        return <Clock className="w-4 h-4" />;
      case 'starred':
        return <Star className="w-4 h-4" />;
      case 'trash':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'root':
        return 'bg-blue-100 text-blue-800';
      case 'shared':
        return 'bg-green-100 text-green-800';
      case 'recent':
        return 'bg-orange-100 text-orange-800';
      case 'starred':
        return 'bg-yellow-100 text-yellow-800';
      case 'trash':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query && onSearch) {
      onSearch(query);
    }
  };

  // Show collapsed breadcrumb if too many items
  const shouldCollapse = items.length > 4;
  const visibleItems = shouldCollapse ? 
    [items[0], ...items.slice(-2)] : 
    items;
  const hiddenItems = shouldCollapse ? items.slice(1, -2) : [];

  return (
    <div className={`flex items-center justify-between p-4 bg-white border-b ${className}`}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {/* Google Drive Icon */}
        <GoogleDrive className="w-5 h-5 text-blue-600 flex-shrink-0" />
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 min-w-0">
          {visibleItems.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-1">
              {/* Show collapsed items indicator */}
              {shouldCollapse && index === 1 && hiddenItems.length > 0 && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-600 hover:text-gray-900"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {hiddenItems.map((hiddenItem) => (
                        <DropdownMenuItem
                          key={hiddenItem.id}
                          onClick={() => onNavigate(hiddenItem)}
                          className="flex items-center space-x-2"
                        >
                          {getIcon(hiddenItem.type)}
                          <span className="truncate">{hiddenItem.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </>
              )}
              
              {/* Breadcrumb item */}
              <div className="flex items-center space-x-2">
                {item.isClickable !== false ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(item)}
                    className="h-8 px-2 text-gray-600 hover:text-gray-900 max-w-[200px]"
                  >
                    <div className="flex items-center space-x-1 min-w-0">
                      {getIcon(item.type)}
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-1 px-2 min-w-0">
                    {getIcon(item.type)}
                    <span className="text-gray-900 font-medium truncate">{item.name}</span>
                  </div>
                )}
              </div>
              
              {/* Separator */}
              {index < visibleItems.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </nav>

        {/* Current folder type badge */}
        {items.length > 0 && items[items.length - 1].type !== 'root' && (
          <Badge className={`${getTypeColor(items[items.length - 1].type)} text-xs`}>
            {items[items.length - 1].type}
          </Badge>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Search */}
        {onSearch && (
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="search"
                type="text"
                placeholder="Search files..."
                className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </form>
        )}

        {/* Filter */}
        {onFilterChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {currentFilter && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {currentFilter}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFilterChange('all')}>
                All Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('documents')}>
                Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('recent')}>
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('shared')}>
                Shared with me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('starred')}>
                Starred
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Quick navigation shortcuts component
export function GoogleDriveQuickNav({
  onNavigate,
  currentPath = '',
  className = ''
}: {
  onNavigate: (item: BreadcrumbItem) => void;
  currentPath?: string;
  className?: string;
}) {
  const quickNavItems: BreadcrumbItem[] = [
    {
      id: 'root',
      name: 'My Drive',
      type: 'root',
      path: '/',
      isClickable: true
    },
    {
      id: 'recent',
      name: 'Recent',
      type: 'recent',
      path: '/recent',
      isClickable: true
    },
    {
      id: 'starred',
      name: 'Starred',
      type: 'starred',
      path: '/starred',
      isClickable: true
    },
    {
      id: 'shared',
      name: 'Shared with me',
      type: 'shared',
      path: '/shared',
      isClickable: true
    },
    {
      id: 'trash',
      name: 'Trash',
      type: 'trash',
      path: '/trash',
      isClickable: true
    }
  ];

  return (
    <div className={`flex items-center space-x-2 p-2 bg-gray-50 border-b ${className}`}>
      <span className="text-sm font-medium text-gray-700">Quick access:</span>
      <div className="flex items-center space-x-1">
        {quickNavItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item)}
            className={`h-8 px-3 text-xs ${
              currentPath === item.path 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1">
              {getIcon(item.type)}
              <span>{item.name}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

// Helper function for getting icons (shared with main component)
function getIcon(type: string) {
  switch (type) {
    case 'root':
      return <Home className="w-4 h-4" />;
    case 'folder':
      return <FolderOpen className="w-4 h-4" />;
    case 'shared':
      return <Users className="w-4 h-4" />;
    case 'recent':
      return <Clock className="w-4 h-4" />;
    case 'starred':
      return <Star className="w-4 h-4" />;
    case 'trash':
      return <Trash2 className="w-4 h-4" />;
    default:
      return <FolderOpen className="w-4 h-4" />;
  }
}