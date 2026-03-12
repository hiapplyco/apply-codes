import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit3, Folder, MoreVertical, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { Project } from '@/types/profile';
import { getProjectIcon } from '@/types/profile';

interface ProjectsTabProps {
  activeProjects: Project[];
  onCreateNew: () => void;
  onEdit: (project: Project) => void;
  onArchive: (projectId: string) => void;
}

export function ProjectsTab({ activeProjects, onCreateNew, onEdit, onArchive }: ProjectsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProjects.map((project) => {
          const IconComponent = getProjectIcon(project.icon);
          return (
            <Card
              key={project.id}
              className="transition-all cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: project.color + '20' }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: project.color }} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(project);
                      }}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onArchive(project.id);
                      }}>
                        <Folder className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{project.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{project.candidates_count} candidates</span>
                  <span>{format(new Date(project.created_at), 'MMM d')}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
