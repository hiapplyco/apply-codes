import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutGrid, 
  List, 
  Rows3,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'compact';
export type DensityMode = 'comfortable' | 'compact' | 'spacious';

interface LayoutToggleProps {
  viewMode: ViewMode;
  densityMode: DensityMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDensityModeChange: (mode: DensityMode) => void;
  className?: string;
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({
  viewMode,
  densityMode,
  onViewModeChange,
  onDensityModeChange,
  className
}) => {
  const viewModeIcons = {
    grid: <LayoutGrid className="w-4 h-4" />,
    list: <List className="w-4 h-4" />,
    compact: <Rows3 className="w-4 h-4" />
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Quick View Mode Toggle */}
      <div className="flex items-center border rounded-lg p-1">
        {Object.entries(viewModeIcons).map(([mode, icon]) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-2",
              viewMode === mode && "shadow-sm"
            )}
            onClick={() => onViewModeChange(mode as ViewMode)}
            title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
          >
            {icon}
          </Button>
        ))}
      </div>

      {/* Density Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Display
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Display Density</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={densityMode} onValueChange={(value) => onDensityModeChange(value as DensityMode)}>
            <DropdownMenuRadioItem value="comfortable" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <div>
                <div className="font-medium">Comfortable</div>
                <div className="text-xs text-gray-500">Balanced spacing</div>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <div>
                <div className="font-medium">Compact</div>
                <div className="text-xs text-gray-500">More results visible</div>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="spacious" className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <div>
                <div className="font-medium">Spacious</div>
                <div className="text-xs text-gray-500">Extra breathing room</div>
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};