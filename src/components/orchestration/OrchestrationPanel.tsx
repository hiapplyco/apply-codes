import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrchestration } from '@/hooks/useOrchestration';
import { 
  Play, 
  Pause, 
  StopCircle, 
  RefreshCw, 
  Bot, 
  Workflow,
  Activity,
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const OrchestrationPanel: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    activeWorkflows,
    agentMetrics,
    orchestratorStatus,
    initialize,
    executeWorkflow,
    executeCustomWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    workflowTemplates
  } = useOrchestration({ autoInitialize: true });

  const [selectedTemplate, setSelectedTemplate] = useState('FULL_RECRUITMENT');
  const [customWorkflow, setCustomWorkflow] = useState({
    name: '',
    description: '',
    sourcingPlatforms: ['linkedin'],
    enrichmentTypes: ['contact', 'skills'],
    maxCandidates: 50
  });

  const handleExecuteTemplate = async () => {
    if (!selectedTemplate) return;
    
    await executeWorkflow(selectedTemplate, {
      // Add any dynamic input here based on UI
    });
  };

  const handleExecuteCustom = async () => {
    if (!customWorkflow.name || !customWorkflow.description) return;
    
    await executeCustomWorkflow({
      ...customWorkflow,
      includeStrategicPlanning: true
    });
  };

  if (!isInitialized) {
    return (
      <Card className="p-8 text-center">
        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">AI Orchestration Not Initialized</h3>
        <p className="text-gray-600 mb-4">Initialize the orchestration system to get started</p>
        <Button onClick={initialize} disabled={isLoading}>
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          Initialize Orchestration
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Orchestration Status</p>
              <p className="text-xs text-gray-600">
                {orchestratorStatus?.activeAgents || 0} agents • 
                {orchestratorStatus?.activeWorkflows || 0} workflows • 
                {orchestratorStatus?.messageQueueSize || 0} messages
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50">
            System Active
          </Badge>
        </div>
      </Card>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="custom">Custom Workflow</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Workflow Templates</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Select Workflow Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(workflowTemplates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && workflowTemplates[selectedTemplate] && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {workflowTemplates[selectedTemplate].name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {workflowTemplates[selectedTemplate].description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Workflow Steps:</p>
                    {workflowTemplates[selectedTemplate].steps.map((step, index) => (
                      <div key={step.id} className="flex items-center text-xs text-gray-600">
                        <ChevronRight className="h-3 w-3 mr-1" />
                        <span>{index + 1}. {step.name} ({step.agentType})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleExecuteTemplate} 
                disabled={isLoading || !selectedTemplate}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Workflow
              </Button>
            </div>
          </Card>

          {/* Active Workflows */}
          {activeWorkflows.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Active Workflows</h3>
              <div className="space-y-3">
                {activeWorkflows.map(workflow => (
                  <div 
                    key={workflow.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{workflow.workflowId}</p>
                      <p className="text-xs text-gray-600">
                        Status: {workflow.status} • Step: {workflow.currentStep || 'N/A'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {workflow.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseWorkflow(workflow.id)}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {workflow.status === 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resumeWorkflow(workflow.id)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Agents</h3>
            
            {agentMetrics.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No active agents</p>
            ) : (
              <div className="space-y-3">
                {agentMetrics.map(agent => (
                  <div key={agent.agentId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Bot className="h-4 w-4 text-purple-600" />
                          <p className="font-medium text-sm">{agent.agentId}</p>
                        </div>
                        <p className="text-xs text-gray-600">
                          Tasks: {agent.successfulTasks}/{agent.totalTasks} successful
                        </p>
                        <p className="text-xs text-gray-600">
                          Avg Response: {Math.round(agent.averageResponseTime)}ms
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Last Active: {new Date(agent.lastActiveAt).toLocaleTimeString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.capabilities.slice(0, 3).map(cap => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Custom Workflow Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create Custom Workflow</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Workflow Name</Label>
                <Input
                  value={customWorkflow.name}
                  onChange={(e) => setCustomWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engineering Talent Search"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={customWorkflow.description}
                  onChange={(e) => setCustomWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the workflow objective..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Sourcing Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['linkedin', 'google_jobs', 'github', 'indeed'].map(platform => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customWorkflow.sourcingPlatforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomWorkflow(prev => ({
                              ...prev,
                              sourcingPlatforms: [...prev.sourcingPlatforms, platform]
                            }));
                          } else {
                            setCustomWorkflow(prev => ({
                              ...prev,
                              sourcingPlatforms: prev.sourcingPlatforms.filter(p => p !== platform)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Enrichment Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['contact', 'social', 'experience', 'skills'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customWorkflow.enrichmentTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomWorkflow(prev => ({
                              ...prev,
                              enrichmentTypes: [...prev.enrichmentTypes, type]
                            }));
                          } else {
                            setCustomWorkflow(prev => ({
                              ...prev,
                              enrichmentTypes: prev.enrichmentTypes.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Max Candidates</Label>
                <Input
                  type="number"
                  value={customWorkflow.maxCandidates}
                  onChange={(e) => setCustomWorkflow(prev => ({ 
                    ...prev, 
                    maxCandidates: parseInt(e.target.value) || 50 
                  }))}
                  min={1}
                  max={500}
                />
              </div>

              <Button 
                onClick={handleExecuteCustom} 
                disabled={isLoading || !customWorkflow.name || !customWorkflow.description}
                className="w-full"
              >
                <Workflow className="h-4 w-4 mr-2" />
                Create & Execute Custom Workflow
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};