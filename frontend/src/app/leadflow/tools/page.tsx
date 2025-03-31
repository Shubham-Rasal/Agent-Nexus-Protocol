'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PRESET_TOOLS } from '@/features/leadflow/tools/presets';
import { TOOL_CATEGORIES } from '@/features/leadflow/tools/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Wrench, FileEdit, Trash2, Mail, FileSpreadsheet, Calendar, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatProviderName } from '@/components/WorkflowUtils';

// Map of category IDs to their icons
const CATEGORY_ICONS: Record<string, any> = {
  email: Mail,
  sheets: FileSpreadsheet,
  calendar: Calendar,
  analysis: BarChart2,
};

export default function ToolBuilderPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTools = selectedCategory === 'all' 
    ? PRESET_TOOLS 
    : PRESET_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tool Builder</h1>
          <p className="text-gray-500">Create and manage tools for your agents</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tool
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="min-w-20">All Tools</TabsTrigger>
          {TOOL_CATEGORIES.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="min-w-20">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map(tool => {
              const Icon = CATEGORY_ICONS[tool.category] || Wrench;
              
              return (
                <Card key={tool.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FileEdit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Provider:</span>
                        <span className="font-medium">{formatProviderName(tool.provider)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Authentication:</span>
                        <Badge variant={tool.requiresAuth ? "warning" : "success"}>
                          {tool.requiresAuth ? 'Required' : 'Not Required'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Parameters:</span>
                        <span className="font-medium">{tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 