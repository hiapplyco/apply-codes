import { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Folder, Briefcase, Users, Star, Hash, Target } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { CreateProjectInput } from '@/types/project';

interface ProjectSelectorProps {
  onProjectChange?: (projectId: string | null) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  label?: string;
  size?: 'default' | 'sm' | 'lg';
}

const PROJECT_COLORS = [
  '#8B5CF6', // Purple (default)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const PROJECT_ICONS = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'users', label: 'Team', icon: Users },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'hash', label: 'Hash', icon: Hash },
  { value: 'target', label: 'Target', icon: Target },
];

export function ProjectSelector({
  onProjectChange,
  className = '',
  placeholder = 'Select a project',
  required = false,
  label = 'Project',
  size = 'default'
}: ProjectSelectorProps) {
  const { 
    projects, 
    loading, 
    selectedProjectId, 
    setSelectedProjectId,
    createProject 
  } = useProjects();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState<CreateProjectInput>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    icon: 'folder'
  });

  const handleProjectChange = (value: string) => {
    if (value === 'create-new') {
      setShowCreateDialog(true);
    } else {
      setSelectedProjectId(value === 'none' ? null : value);
      onProjectChange?.(value === 'none' ? null : value);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    setCreating(true);
    const created = await createProject(newProject);
    
    if (created) {
      setSelectedProjectId(created.id);
      onProjectChange?.(created.id);
      setShowCreateDialog(false);
      setNewProject({
        name: '',
        description: '',
        color: PROJECT_COLORS[0],
        icon: 'folder'
      });
    }
    setCreating(false);
  };

  const getIconComponent = (iconValue: string) => {
    const iconConfig = PROJECT_ICONS.find(i => i.value === iconValue);
    return iconConfig?.icon || Folder;
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <>
      <div className={className}>
        {label && (
          <Label htmlFor="project-selector" className="mb-2 block">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select
          value={selectedProjectId || 'none'}
          onValueChange={handleProjectChange}
          disabled={loading}
        >
          <SelectTrigger 
            id="project-selector"
            className={`
              ${size === 'sm' && 'h-8 text-sm'}
              ${size === 'lg' && 'h-12 text-lg'}
            `}
          >
            <SelectValue placeholder={placeholder}>
              {selectedProject ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getIconComponent(selectedProject.icon);
                    return <Icon className="h-4 w-4" style={{ color: selectedProject.color }} />;
                  })()}
                  <span>{selectedProject.name}</span>
                  {selectedProject.candidates_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedProject.candidates_count}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {!required && (
              <>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No project</span>
                </SelectItem>
                <SelectSeparator />
              </>
            )}
            
            {projects.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects yet
              </div>
            ) : (
              projects.map((project) => {
                const Icon = getIconComponent(project.icon);
                return (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: project.color }} />
                      <span>{project.name}</span>
                      {project.candidates_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {project.candidates_count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })
            )}
            
            <SelectSeparator />
            <SelectItem value="create-new">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                <span>Create new project</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your recruitment activities.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g., Q1 Engineering Hiring"
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description || ''}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description of this project..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newProject.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProject({ ...newProject, color })}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_ICONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`p-2 rounded border-2 transition-all ${
                      newProject.icon === value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewProject({ ...newProject, icon: value })}
                    title={label}
                  >
                    <Icon className="h-5 w-5" style={{ 
                      color: newProject.icon === value ? newProject.color : undefined 
                    }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!newProject.name.trim() || creating}
              type="button"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}