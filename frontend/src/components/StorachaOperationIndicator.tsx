import React from 'react';
import { Database, Upload, Download, Share2, List, Info } from 'lucide-react';

type OperationType = 'upload' | 'download' | 'list' | 'share' | 'info' | 'delegation';

interface StorachaOperationIndicatorProps {
  operation: OperationType;
  agentId: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp: Date;
  dataType?: string;
}

export function StorachaOperationIndicator({
  operation,
  agentId,
  status,
  message,
  timestamp,
  dataType
}: StorachaOperationIndicatorProps) {
  // Get the appropriate icon based on operation type
  const getIcon = () => {
    switch (operation) {
      case 'upload':
        return <Upload size={16} className="text-green-600" />;
      case 'download':
        return <Download size={16} className="text-blue-600" />;
      case 'list':
        return <List size={16} className="text-purple-600" />;
      case 'share':
        return <Share2 size={16} className="text-amber-600" />;
      case 'info':
      case 'delegation':
        return <Info size={16} className="text-gray-600" />;
      default:
        return <Database size={16} className="text-gray-600" />;
    }
  };

  // Get the appropriate status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="animate-pulse h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
        );
      case 'success':
        return (
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
        );
      case 'error':
        return (
          <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
        );
      default:
        return null;
    }
  };

  // Get the appropriate background color based on status
  const getBackgroundColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex justify-center my-1">
      <div className={`flex items-center px-3 py-1.5 rounded-full ${getBackgroundColor()} border text-xs text-gray-700 max-w-xs md:max-w-md shadow-sm`}>
        <div className="flex-shrink-0 mr-2">
          {getIcon()}
        </div>
        <div className="flex items-center">
          {getStatusIndicator()}
          <span className="font-medium">{operation}</span>
          <span className="mx-1">•</span>
          <span>{agentId}</span>
          {dataType && (
            <>
              <span className="mx-1">•</span>
              <span className="text-gray-600">{dataType}</span>
            </>
          )}
        </div>
        {message && (
          <div className="ml-2 text-gray-500 truncate">
            {message}
          </div>
        )}
        <div className="ml-2 text-gray-400 text-[10px]">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export default StorachaOperationIndicator; 