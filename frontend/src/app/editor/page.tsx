'use client';

import { EnhancedWorkflowEditor } from '@/components/EnhancedWorkflowEditor';
import { useState, useEffect } from 'react';
import { workflowRegistry } from '@/features/workflows/registry/registry';
import { Workflow } from '@/features/workflows/registry/types';
import { WorkflowDomainType, WorkflowCapabilityType } from '@/features/workflows/registry/types';
import { generateId } from '@/components/WorkflowUtils';

export default function WorkflowEditorPage() {
  const [initialWorkflow, setInitialWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Load the most recently edited workflow or create a new one
  useEffect(() => {
    try {
      // Get all workflows from registry
      const registryItems = workflowRegistry.listWorkflows();
      
      if (registryItems.length > 0) {
        // Sort by updatedAt and get the most recent
        const mostRecent = [...registryItems]
          .map(item => item.workflow)
          .sort((a, b) => 
            new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
          )[0];
        
        setInitialWorkflow(mostRecent);
      } else {
        // No workflows in registry, create a default one
        const defaultWorkflow: Workflow = {
          id: generateId('workflow'),
          name: 'New Workflow',
          description: 'My custom workflow',
          domains: [WorkflowDomainType.GENERAL],
          capabilities: [WorkflowCapabilityType.AUTOMATION],
          author: 'Me',
          version: '1.0.0',
          isPublic: true,
          requiredTools: [],
          tags: ['custom'],
          nodes: [
            {
              id: 'trigger_start',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: {
                label: 'Start',
                type: 'trigger',
                description: 'Workflow start'
              }
            }
          ],
          edges: []
        };
        
        setInitialWorkflow(defaultWorkflow);
      }
    } catch (err) {
      console.error('Failed to load workflows from registry:', err);
      // Create a default workflow as fallback
      setInitialWorkflow({
        id: generateId('workflow'),
        name: 'New Workflow',
        description: 'A blank workflow',
        domains: [WorkflowDomainType.GENERAL],
        capabilities: [WorkflowCapabilityType.AUTOMATION],
        author: 'Me',
        version: '1.0.0',
        isPublic: true,
        requiredTools: [],
        tags: ['custom'],
        nodes: [
          {
            id: 'trigger_start',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Start',
              type: 'trigger',
              description: 'Workflow start'
            }
          }
        ],
        edges: []
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-clear save status message after 3 seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Handle workflow save
  const handleSave = (workflow: Workflow) => {
    try {
      // Update workflow in the registry
      if (workflowRegistry.getWorkflow(workflow.id)) {
        workflowRegistry.updateWorkflow(workflow.id, workflow);
        console.log(`Workflow "${workflow.name}" updated successfully`);
        setSaveStatus({
          message: `Workflow "${workflow.name}" updated successfully`,
          type: 'success'
        });
      } else {
        workflowRegistry.registerWorkflow(workflow);
        console.log(`Workflow "${workflow.name}" created successfully`);
        setSaveStatus({
          message: `Workflow "${workflow.name}" created successfully`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      setSaveStatus({
        message: 'An error occurred while saving the workflow',
        type: 'error'
      });
    }
  };

  if (isLoading || !initialWorkflow) {
    return <div className="flex items-center justify-center h-screen">Loading workflow editor...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-gray-50 relative">
      {saveStatus && (
        <div 
          className={`absolute top-4 right-4 p-3 rounded-md z-50 shadow-md ${
            saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {saveStatus.message}
        </div>
      )}
      <EnhancedWorkflowEditor 
        initialWorkflow={initialWorkflow} 
        onSave={handleSave} 
      />
    </div>
  );
} 