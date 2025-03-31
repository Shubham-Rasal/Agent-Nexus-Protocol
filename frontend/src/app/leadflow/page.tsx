'use client';

import { EnhancedWorkflowEditor } from '@/components/EnhancedWorkflowEditor';
import { Workflow } from '@/features/leadflow/workflows/schema';
import { createLeadGenerationWorkflow } from '@/features/leadflow/workflows/presets';
import { saveWorkflowToLocalStorage } from '@/components/WorkflowUtils';
import { useState, useEffect } from 'react';

export default function LeadflowPage() {
  const [initialWorkflow, setInitialWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the most recently edited workflow or use the default one
  useEffect(() => {
    try {
      const savedWorkflows = JSON.parse(localStorage.getItem('leadflow_workflows') || '[]');
      if (savedWorkflows.length > 0) {
        // Sort by updatedAt and get the most recent
        const mostRecent = [...savedWorkflows].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        // Convert date strings back to Date objects
        mostRecent.createdAt = new Date(mostRecent.createdAt);
        mostRecent.updatedAt = new Date(mostRecent.updatedAt);
        if (mostRecent.stats?.lastRunAt) {
          mostRecent.stats.lastRunAt = new Date(mostRecent.stats.lastRunAt);
        }
        
        setInitialWorkflow(mostRecent);
      } else {
        // No saved workflows, use the default
        setInitialWorkflow(createLeadGenerationWorkflow());
      }
    } catch (err) {
      console.error('Failed to load saved workflows:', err);
      setInitialWorkflow(createLeadGenerationWorkflow());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle workflow save
  const handleSave = (workflow: Workflow) => {
    console.log('Workflow saved:', workflow);
    saveWorkflowToLocalStorage(workflow);
    // In a real app, you would also save this to your backend
  };

  if (isLoading || !initialWorkflow) {
    return <div className="flex items-center justify-center h-screen">Loading workflow...</div>;
  }

  return (
    <div className="h-screen w-full absolute top-0 left-0 bg-gray-50">
      <EnhancedWorkflowEditor 
        initialWorkflow={initialWorkflow} 
        onSave={handleSave} 
      />
    </div>
  );
} 