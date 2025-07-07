import React, { useState } from 'react';
import { Plus, X, Target, Brain, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { InterviewCompetency } from '@/types/interview';

interface CompetencySetupProps {
  jobRole: string;
  onCompetenciesSet: (competencies: InterviewCompetency[]) => void;
  initialCompetencies?: InterviewCompetency[];
}

const DEFAULT_COMPETENCIES: Partial<InterviewCompetency>[] = [
  {
    name: 'Technical Skills',
    description: 'Core technical abilities required for the role',
    category: 'technical',
    required: true,
  },
  {
    name: 'Problem Solving',
    description: 'Ability to analyze and solve complex problems',
    category: 'technical',
    required: true,
  },
  {
    name: 'Communication',
    description: 'Clear and effective communication skills',
    category: 'behavioral',
    required: true,
  },
  {
    name: 'Team Collaboration',
    description: 'Working effectively with team members',
    category: 'behavioral',
    required: false,
  },
  {
    name: 'Cultural Fit',
    description: 'Alignment with company values and culture',
    category: 'cultural',
    required: false,
  },
];

export const CompetencySetup: React.FC<CompetencySetupProps> = ({
  jobRole,
  onCompetenciesSet,
  initialCompetencies = [],
}) => {
  const [competencies, setCompetencies] = useState<InterviewCompetency[]>(
    initialCompetencies.length > 0
      ? initialCompetencies
      : DEFAULT_COMPETENCIES.map((comp, idx) => ({
          ...comp,
          id: `comp-${idx}`,
          coverageLevel: 0,
        } as InterviewCompetency))
  );

  const [newCompetency, setNewCompetency] = useState({
    name: '',
    description: '',
    category: 'technical' as InterviewCompetency['category'],
    required: true,
  });

  const handleAddCompetency = () => {
    if (!newCompetency.name.trim()) return;

    const competency: InterviewCompetency = {
      id: `comp-${Date.now()}`,
      ...newCompetency,
      coverageLevel: 0,
    };

    setCompetencies([...competencies, competency]);
    setNewCompetency({
      name: '',
      description: '',
      category: 'technical',
      required: true,
    });
  };

  const handleRemoveCompetency = (id: string) => {
    setCompetencies(competencies.filter((comp) => comp.id !== id));
  };

  const handleUpdateCompetency = (id: string, updates: Partial<InterviewCompetency>) => {
    setCompetencies(
      competencies.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp))
    );
  };

  const getCategoryIcon = (category: InterviewCompetency['category']) => {
    switch (category) {
      case 'technical':
        return <Brain className="w-4 h-4" />;
      case 'behavioral':
        return <Users className="w-4 h-4" />;
      case 'cultural':
        return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: InterviewCompetency['category']) => {
    switch (category) {
      case 'technical':
        return 'bg-purple-100 border-purple-300';
      case 'behavioral':
        return 'bg-green-100 border-green-300';
      case 'cultural':
        return 'bg-blue-100 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Interview Competencies</h3>
        <p className="text-sm text-gray-600">
          Define the key competencies to assess for the {jobRole} position
        </p>
      </div>

      {/* Existing Competencies */}
      <div className="space-y-3">
        {competencies.map((comp) => (
          <div
            key={comp.id}
            className={`p-4 rounded-lg border-2 ${getCategoryColor(comp.category)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(comp.category)}
                  <h4 className="font-medium">{comp.name}</h4>
                  {comp.required && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{comp.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">
                    Category: {comp.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={comp.required}
                      onCheckedChange={(checked) =>
                        handleUpdateCompetency(comp.id, { required: checked })
                      }
                    />
                    <Label className="text-xs">Required</Label>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCompetency(comp.id)}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Competency */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Add New Competency</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="comp-name">Name</Label>
            <Input
              id="comp-name"
              value={newCompetency.name}
              onChange={(e) =>
                setNewCompetency({ ...newCompetency, name: e.target.value })
              }
              placeholder="e.g., System Design"
            />
          </div>
          <div>
            <Label htmlFor="comp-category">Category</Label>
            <Select
              value={newCompetency.category}
              onValueChange={(value) =>
                setNewCompetency({
                  ...newCompetency,
                  category: value as InterviewCompetency['category'],
                })
              }
            >
              <SelectTrigger id="comp-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="comp-desc">Description</Label>
          <Textarea
            id="comp-desc"
            value={newCompetency.description}
            onChange={(e) =>
              setNewCompetency({ ...newCompetency, description: e.target.value })
            }
            placeholder="Brief description of what to assess"
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={newCompetency.required}
              onCheckedChange={(checked) =>
                setNewCompetency({ ...newCompetency, required: checked })
              }
            />
            <Label className="text-sm">Required competency</Label>
          </div>
          <Button
            onClick={handleAddCompetency}
            disabled={!newCompetency.name.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Competency
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setCompetencies(
              DEFAULT_COMPETENCIES.map((comp, idx) => ({
                ...comp,
                id: `comp-${idx}`,
                coverageLevel: 0,
              } as InterviewCompetency))
            );
          }}
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={() => onCompetenciesSet(competencies)}
          disabled={competencies.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Save Competencies ({competencies.length})
        </Button>
      </div>
    </div>
  );
};