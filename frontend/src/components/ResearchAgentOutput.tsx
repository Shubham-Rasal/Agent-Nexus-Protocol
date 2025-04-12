import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Link, FileText, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Source {
  title: string;
  url: string;
}

interface ResearchAgentOutputProps {
  response: string;
  sources?: Source[];
  className?: string;
  maxHeight?: string;
}

export function ResearchAgentOutput({ 
  response, 
  sources = [], 
  className = '',
  maxHeight = '500px'
}: ResearchAgentOutputProps) {
  const [formattedResponse, setFormattedResponse] = useState<string>(response);
  const [extractedSources, setExtractedSources] = useState<Source[]>(sources);

  // Process the response to extract sources if they're embedded in the text
  useEffect(() => {
    if (!response) return;

    // This is a simple regex to find URLs in the text
    // A more sophisticated approach would be needed for a production app
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const matches = response.match(urlRegex) || [];
    
    // If we have matches and no sources were provided, create source objects
    if (matches.length > 0 && sources.length === 0) {
      const extractedSources = matches.map((url, index) => ({
        title: `Source ${index + 1}`,
        url
      }));
      setExtractedSources(extractedSources);
    }

    // Format the response text by adding paragraph breaks
    let formatted = response.replace(/\n\n/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    
    setFormattedResponse(formatted);
  }, [response, sources]);

  if (!response) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
          <div className="text-sm text-gray-400">No research results to display</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">Research Results</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs px-2 py-0">
            AI Generated
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ScrollArea className={`max-h-[${maxHeight}]`}>
          <div 
            className="text-sm leading-6 space-y-2 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formattedResponse }}
          />
        </ScrollArea>
        
        {extractedSources.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 mb-2">
              <FileText className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium">Sources</span>
            </div>
            
            <div className="space-y-1">
              {extractedSources.map((source, index) => (
                <div key={index} className="flex items-start gap-1">
                  <Link className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-500 hover:underline line-clamp-1"
                  >
                    {source.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 