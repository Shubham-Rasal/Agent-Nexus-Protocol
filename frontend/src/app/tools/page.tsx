'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ToolBuilderPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">Tool Builder</h1>
          <p className="text-gray-500">Create and manage tools for your agents</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tool
        </Button>
      </div>

      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Tools Available</CardTitle>
            <CardDescription>
              Tools have been removed from this application. This page is now a placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              The tool system has been completely removed. If you need to add tools back in the future, 
              you can implement them here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 