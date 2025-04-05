'use client';

import { useState, useEffect } from 'react';
import { useWorkflowRegistry } from '@/features/workflows/registry/registry';
import { Workflow, WorkflowDomainType } from '@/features/workflows/registry/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import {Search} from './ui/search';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  ChevronRight, 
  GitBranch, 
  FileSearch, 
  MessageSquare, 
  Database, 
  Sparkles, 
  Layers, 
  Star,
  Clock,
  PlusCircle,
  Lightbulb,
  Users
} from 'lucide-react';

const domainIcons: Record<string, React.ReactNode> = {
  lead_generation: <Lightbulb className="h-4 w-4" />,
  customer_support: <MessageSquare className="h-4 w-4" />,
  research: <FileSearch className="h-4 w-4" />,
  content_creation: <Sparkles className="h-4 w-4" />,
  data_analysis: <Database className="h-4 w-4" />,
  general: <Layers className="h-4 w-4" />,
  custom: <PlusCircle className="h-4 w-4" />,
  recruitment: <Users className="h-4 w-4" />,
};

const domainLabels: Record<string, string> = {
  lead_generation: 'Lead Generation',
  customer_support: 'Customer Support',
  research: 'Research',
  content_creation: 'Content Creation',
  data_analysis: 'Data Analysis',
  general: 'General Purpose',
  custom: 'Custom',
  recruitment: 'Recruitment',
};

interface WorkflowSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (workflow: Workflow | null) => void;
}

export function WorkflowSelector({ isOpen, onClose, onSelectWorkflow }: WorkflowSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>([]);
  const [featuredWorkflows, setFeaturedWorkflows] = useState<Workflow[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<Workflow[]>([]);
  
  const workflowRegistry = useWorkflowRegistry();
  
  // Load workflows from registry when component mounts
  useEffect(() => {
    if (isOpen) {
      // Get all workflows from registry
      const registryItems = workflowRegistry.listWorkflows();
      const workflows = registryItems.map(item => item.workflow);
      setAllWorkflows(workflows);
      
      // Generate featured workflows (those with high usage count or rating)
      const featured = workflows
        .filter(w => (w.usageCount || 0) > 5 || (w.rating || 0) > 4)
        .sort((a, b) => ((b.usageCount || 0) + (b.rating || 0)) - ((a.usageCount || 0) + (a.rating || 0)))
        .slice(0, 6);
      setFeaturedWorkflows(featured);
      
      // Get recent workflows from localStorage
      try {
        const recentWorkflowIds = JSON.parse(localStorage.getItem('anp-recent-workflows') || '[]');
        const recent = workflows.filter(w => recentWorkflowIds.includes(w.id));
        setRecentWorkflows(recent);
      } catch (error) {
        console.error('Error loading recent workflows from localStorage:', error);
        setRecentWorkflows([]);
      }
      
      // Set initial filtered workflows
      setFilteredWorkflows(workflows);
    }
  }, [isOpen, workflowRegistry]);
  
  // Filter workflows based on search query and selected tab
  useEffect(() => {
    if (searchQuery) {
      // Filter by search query
      const query = searchQuery.toLowerCase();
      const filtered = allWorkflows.filter(
        w => w.name.toLowerCase().includes(query) || 
             w.description.toLowerCase().includes(query) ||
             w.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredWorkflows(filtered);
    } else if (selectedTab === 'all') {
      setFilteredWorkflows(allWorkflows);
    } else if (selectedTab === 'featured') {
      setFilteredWorkflows(featuredWorkflows);
    } else if (selectedTab === 'recent') {
      setFilteredWorkflows(recentWorkflows);
    } else if (Object.values(WorkflowDomainType).includes(selectedTab as WorkflowDomainType)) {
      // Filter by domain
      const filtered = allWorkflows.filter(
        w => w.domains.includes(selectedTab as WorkflowDomainType)
      );
      setFilteredWorkflows(filtered);
    }
  }, [searchQuery, selectedTab, allWorkflows, featuredWorkflows, recentWorkflows]);
  
  const handleWorkflowSelect = (workflow: Workflow) => {
    // Save to recent workflows in localStorage
    try {
      const recentWorkflowIds = JSON.parse(localStorage.getItem('anp-recent-workflows') || '[]');
      // Add to the start of the array and remove any duplicates
      const updatedRecentIds = [
        workflow.id,
        ...recentWorkflowIds.filter((id: string) => id !== workflow.id)
      ].slice(0, 10); // Keep only the 10 most recent
      
      localStorage.setItem('anp-recent-workflows', JSON.stringify(updatedRecentIds));
    } catch (error) {
      console.error('Error saving recent workflow to localStorage:', error);
    }
    
    onSelectWorkflow(workflow);
    onClose();
  };
  
  const handleStartWithoutWorkflow = () => {
    onSelectWorkflow(null);
    onClose();
  };
  
  // Helper function to group workflows by domain
  const groupWorkflowsByDomain = (workflows: Workflow[]) => {
    const groups: Record<string, Workflow[]> = {};
    
    // Initialize empty arrays for all domain types
    Object.values(WorkflowDomainType).forEach(domain => {
      groups[domain] = [];
    });
    
    // Group workflows by their domains
    workflows.forEach(workflow => {
      workflow.domains.forEach(domain => {
        if (groups[domain]) {
          groups[domain].push(workflow);
        }
      });
      
      // If workflow has no domains, add to general
      if (workflow.domains.length === 0) {
        groups[WorkflowDomainType.GENERAL].push(workflow);
      }
    });
    
    return groups;
  };
  
  const domainGroups = groupWorkflowsByDomain(filteredWorkflows);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-600" />
            Select a Workflow
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex my-4">
          <Search 
            className="w-full max-w-sm" 
            placeholder="Search workflows..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-10 gap-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-1">
              <Star className="h-3 w-3" /> Featured
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="flex-1 overflow-hidden flex mt-0 border-0 p-0">
            <ScrollArea className="flex-1">
              {selectedTab === 'all' && (
                <div className="space-y-6 py-4">
                  {Object.entries(domainGroups).map(([domain, workflows]) => 
                    workflows.length > 0 ? (
                      <div key={domain} className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 px-2">
                          {domainIcons[domain]}
                          {domainLabels[domain]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                          {workflows.map(workflow => (
                            <WorkflowCard 
                              key={workflow.id} 
                              workflow={workflow} 
                              onSelect={handleWorkflowSelect} 
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
              
              {(selectedTab === 'featured' || selectedTab === 'recent' || Object.values(WorkflowDomainType).includes(selectedTab as WorkflowDomainType)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-2">
                  {filteredWorkflows.map(workflow => (
                    <WorkflowCard 
                      key={workflow.id} 
                      workflow={workflow} 
                      onSelect={handleWorkflowSelect} 
                    />
                  ))}
                  
                  {filteredWorkflows.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      No workflows found for this category
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleStartWithoutWorkflow}>
            Start Without Workflow
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  onSelect: (workflow: Workflow) => void;
}

function WorkflowCard({ workflow, onSelect }: WorkflowCardProps) {
  return (
    <Card className="overflow-hidden hover:border-purple-300 transition-all cursor-pointer" onClick={() => onSelect(workflow)}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{workflow.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {workflow.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="flex flex-wrap gap-1 mt-2">
          {workflow.domains.map(domain => (
            <Badge key={domain} variant="secondary" className="text-xs py-0 px-2">
              {domainLabels[domain]}
            </Badge>
          ))}
          {workflow.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs py-0 px-2">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-2 px-4 border-t bg-gray-50 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500">
          <span>By {workflow.author}</span>
          {workflow.rating && (
            <div className="flex items-center ml-2">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline-block mr-1" />
              <span>{workflow.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </CardFooter>
    </Card>
  );
} 