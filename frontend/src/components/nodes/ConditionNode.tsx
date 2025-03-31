'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MoveHorizontal } from 'lucide-react';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Copy, Info } from 'lucide-react';

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`rounded-lg border bg-white px-4 py-3 shadow-sm ${selected ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <MoveHorizontal className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="font-semibold">{data.label}</div>
              <div className="text-xs text-gray-500">{data.description}</div>
              {data.config?.condition && (
                <div className="mt-1 text-xs font-mono px-2 py-1 bg-gray-100 rounded">
                  {data.config.condition}
                </div>
              )}
            </div>
          </div>
          
          {/* One input, two outputs (Yes/No) */}
          <Handle
            type="target"
            position={Position.Top}
            id="in"
            className="h-3 w-3 bg-blue-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="h-3 w-3 bg-green-500 -ml-5"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="h-3 w-3 bg-red-500 ml-5"
          />
          
          {/* Labels for the outputs */}
          <div className="absolute -bottom-6 left-4 text-xs text-green-600 font-medium">Yes</div>
          <div className="absolute -bottom-6 right-4 text-xs text-red-600 font-medium">No</div>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={() => data.onNodeInfo?.()}>
          <Info className="mr-2 h-4 w-4" />
          Node Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => data.onNodeEdit?.()}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Node
        </ContextMenuItem>
        <ContextMenuItem onClick={() => data.onNodeDuplicate?.()}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Node
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={() => data.onNodeDelete?.()}
          className="text-red-600 focus:text-red-600 hover:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Node
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default memo(ConditionNode); 