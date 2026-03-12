import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_ICONS, PROJECT_COLORS } from '@/types/profile';
import type { Project } from '@/types/profile';

interface ProjectFormModalProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { name: string; description: string; color: string; icon: string };
  onProjectChange: (updates: Partial<{ name: string; description: string; color: string; icon: string }>) => void;
  onSubmit: () => void;
}

export function ProjectFormModal({
  mode,
  open,
  onOpenChange,
  project,
  onProjectChange,
  onSubmit,
}: ProjectFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</DialogTitle>
          {mode === 'create' && (
            <DialogDescription>
              Organize your candidates and searches into projects
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={project.name}
              onChange={(e) => onProjectChange({ name: e.target.value })}
              placeholder={mode === 'create' ? "e.g., Q1 Engineering Hiring" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={project.description}
              onChange={(e) => onProjectChange({ description: e.target.value })}
              placeholder={mode === 'create' ? "Brief description of this project..." : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2">
              {PROJECT_ICONS.map(({ name, icon: Icon }) => (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onProjectChange({ icon: name })}
                  className={`p-3 rounded-lg ${project.icon === name
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant="outline"
                  onClick={() => onProjectChange({ color })}
                  className={`w-10 h-10 rounded-lg p-0 ${project.color === color
                      ? 'border-foreground scale-110'
                      : 'border-border'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!project.name}
          >
            {mode === 'create' ? 'Create Project' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
