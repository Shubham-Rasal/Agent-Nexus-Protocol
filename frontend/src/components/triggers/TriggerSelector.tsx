'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Clock, Calendar, Webhook, FileText } from 'lucide-react';
import GmailTriggerConfig from './GmailTriggerConfig';

interface TriggerSelectorProps {
  config: any;
  onChange: (config: any) => void;
}

export default function TriggerSelector({ config, onChange }: TriggerSelectorProps) {
  // Default to 'gmail' if no triggerType is set
  const [activeTab, setActiveTab] = useState(config?.triggerType || 'gmail');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the config with the new trigger type
    onChange({
      ...config,
      triggerType: value,
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Select Trigger Type</h3>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="gmail" className="flex flex-col items-center py-3 gap-1">
            <Mail className="h-5 w-5" />
            <span className="text-xs">Gmail</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex flex-col items-center py-3 gap-1">
            <Clock className="h-5 w-5" />
            <span className="text-xs">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex flex-col items-center py-3 gap-1">
            <Webhook className="h-5 w-5" />
            <span className="text-xs">Webhook</span>
          </TabsTrigger>
          <TabsTrigger value="form" className="flex flex-col items-center py-3 gap-1">
            <FileText className="h-5 w-5" />
            <span className="text-xs">Form</span>
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="pt-6">
            <TabsContent value="gmail" className="mt-0">
              <GmailTriggerConfig config={config} onChange={onChange} />
            </TabsContent>
            
            <TabsContent value="schedule" className="mt-0">
              <div className="p-8 text-center text-gray-500 space-y-2">
                <Clock className="h-8 w-8 mx-auto text-gray-400" />
                <h3 className="font-medium">Schedule Trigger</h3>
                <p className="text-sm">Coming soon. This trigger will run your workflow on a schedule.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="webhook" className="mt-0">
              <div className="p-8 text-center text-gray-500 space-y-2">
                <Webhook className="h-8 w-8 mx-auto text-gray-400" />
                <h3 className="font-medium">Webhook Trigger</h3>
                <p className="text-sm">Coming soon. This trigger will run your workflow when a webhook is called.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="form" className="mt-0">
              <div className="p-8 text-center text-gray-500 space-y-2">
                <FileText className="h-8 w-8 mx-auto text-gray-400" />
                <h3 className="font-medium">Form Submission Trigger</h3>
                <p className="text-sm">Coming soon. This trigger will run your workflow when a form is submitted.</p>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
} 