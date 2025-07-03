import { CollaborationUser } from '@/hooks/useCollaboration';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface UserPresenceProps {
  users: CollaborationUser[];
  isConnected: boolean;
  className?: string;
}

export function UserPresence({ users, isConnected, className = '' }: UserPresenceProps) {
  if (!isConnected && users.length === 0) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-orange-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Generate a consistent color based on user ID
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 30) return 'Just now';
    if (minutes < 1) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {users.length > 0 && (
        <>
          <TooltipProvider>
            <div className="flex items-center -space-x-2">
              {users.slice(0, 5).map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className={`${getUserColor(user.id)} text-white text-xs`}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">
                        Active {formatLastSeen(user.lastSeen)}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {users.length > 5 && (
                <div className="flex items-center justify-center h-8 w-8 bg-gray-100 border-2 border-white rounded-full text-xs font-medium text-gray-600">
                  +{users.length - 5}
                </div>
              )}
            </div>
          </TooltipProvider>
          
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {users.length} online
          </Badge>
        </>
      )}
      
      {isConnected && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Connected</span>
        </div>
      )}
    </div>
  );
}