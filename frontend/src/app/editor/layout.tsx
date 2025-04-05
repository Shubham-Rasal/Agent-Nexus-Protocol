'use client';

import { ReactNode, useContext, createContext, useState, useCallback } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { FileText, Save, Settings, Eye, Workflow, Filter } from 'lucide-react';

// Create a context for the editor actions
type EditorContextType = {
  saveWorkflow: () => void;
  triggerSave: boolean;
};

export const EditorContext = createContext<EditorContextType>({
  saveWorkflow: () => {},
  triggerSave: false
});

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  const [triggerSave, setTriggerSave] = useState(false);

  // Function to trigger the save action in child components
  const saveWorkflow = useCallback(() => {
    setTriggerSave(prev => !prev); // Toggle to trigger an effect in consumer components
  }, []);

  return (
    <EditorContext.Provider value={{ saveWorkflow, triggerSave }}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Editor Toolbar */}
        <div className="border-b border-gray-200 bg-white py-2 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/workflows">Workflows</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Workflow Editor</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
              onClick={saveWorkflow}
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </EditorContext.Provider>
  );
} 