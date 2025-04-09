'use client';

import { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Panel,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  ConnectionLineType,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Workflow } from '@/features/workflows/registry/types';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import AgentNode from './nodes/AgentNode';

// Define the custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  agent: AgentNode,
};

// Simplified edge component - just for visualization
const ConditionalEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#777',
          pointerEvents: 'none'
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <foreignObject
          width={100}
          height={30}
          x={labelX - 50}
          y={labelY - 15}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex justify-center items-center pointer-events-none">
            <div className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
              {typeof label === 'string' ? label : String(label)}
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
};

// Define the custom edge types
const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

interface WorkflowViewerProps {
  workflow: Workflow;
}

export function WorkflowViewer({ workflow }: WorkflowViewerProps) {
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [executionFlow, setExecutionFlow] = useState<string[]>([]);

  // Simulate workflow execution
  const runWorkflow = async () => {
    setIsRunning(true);
    setResults({});
    setActiveNodes([]);
    setExecutionFlow([]);

    try {
      // Start with trigger node
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) return;

      // Process nodes in sequence
      await processNode(triggerNode.id, { message: testInput });
    } finally {
      setIsRunning(false);
    }
  };

  // Process individual nodes
  const processNode = async (nodeId: string, inputData: any) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setActiveNodes(prev => [...prev, nodeId]);
    setExecutionFlow(prev => [...prev, nodeId]);

    try {
      let result;
      // Add delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (node.type) {
        case 'trigger':
          result = {
            message: inputData.message,
            timestamp: new Date().toISOString()
          };
          break;

        case 'agent':
          if (node.data.config?.agentId === 'lead-qualifier') {
            const text = inputData.message.toLowerCase();
            const keywords = {
              positive: ['interested', 'buy', 'purchase', 'demo', 'pricing', 'price', 'information'],
              negative: ['spam', 'unsubscribe', 'stop', 'not interested']
            };
            const positiveCount = keywords.positive.filter(word => text.includes(word)).length;
            const negativeCount = keywords.negative.filter(word => text.includes(word)).length;
            const score = Math.max(0, Math.min(100, 50 + (positiveCount * 15) - (negativeCount * 25)));
            
            result = {
              score,
              analysis: {
                positiveKeywords: positiveCount,
                negativeKeywords: negativeCount,
                text: inputData.message
              }
            };
          } else if (node.data.config?.agentId === 'email-outreach') {
            const score = inputData.score || 0;
            result = {
              emailSent: true,
              template: score < 30 ? 'rejection' : 'follow_up',
              message: score < 30 
                ? 'Thank you for your message. We don\'t think our services are a good fit at this time.'
                : 'Thank you for your interest. We will contact you soon with more information.'
            };
          } else if (node.data.config?.agentId === 'meeting-scheduler') {
            const score = inputData.score || 0;
            if (score < 70) {
              throw new Error('Score too low to schedule a meeting');
            }
            result = {
              meetingScheduled: true,
              proposedTime: new Date(Date.now() + 86400000).toISOString(),
              duration: 30,
              type: 'discovery_call'
            };
          }
          break;

        case 'condition':
          const condition = node.data.config?.condition;
          if (!condition) {
            throw new Error('No condition specified');
          }
          const evalResult = eval(`with (${JSON.stringify(inputData)}) { ${condition} }`);
          result = { 
            result: evalResult,
            condition: condition,
            inputData
          };
          break;
      }

      setResults(prev => ({
        ...prev,
        [nodeId]: { 
          success: true, 
          data: result,
          input: inputData,
          timestamp: new Date().toISOString()
        }
      }));

      // Process next nodes
      const edges = workflow.edges.filter(e => e.source === nodeId);
      for (const edge of edges) {
        if (node.type === 'condition') {
          const conditionResult = result.result;
          if ((edge.sourceHandle === 'yes' && conditionResult) ||
              (edge.sourceHandle === 'no' && !conditionResult)) {
            await processNode(edge.target, result);
          }
        } else {
          await processNode(edge.target, result);
        }
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [nodeId]: { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          input: inputData,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setActiveNodes(prev => prev.filter(id => id !== nodeId));
    }
  };

  // Update nodes to show active state
  const nodes: Node[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.data,
      onNodeDelete: undefined,
      onNodeEdit: undefined,
      onNodeDuplicate: undefined,
      onNodeInfo: undefined,
    },
    draggable: false,
    selectable: false,
    style: {
      border: activeNodes.includes(node.id) ? '2px solid #3b82f6' : undefined,
      boxShadow: activeNodes.includes(node.id) ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : undefined
    }
  }));

  // Convert workflow edges to ReactFlow edges
  const edges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'conditional',
    label: edge.label,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    selectable: false,
  }));

  const getNodeExecutionOrder = (nodeId: string): number => {
    const index = executionFlow.indexOf(nodeId);
    return index === -1 ? Infinity : index + 1;
  };

  const getEdgeHighlight = (edge: Edge): string => {
    const sourceResult = results[edge.source];
    const targetResult = results[edge.target];
    
    if (!sourceResult || !targetResult) return '#777';
    
    // If both nodes were executed successfully and in sequence
    const sourceIndex = executionFlow.indexOf(edge.source);
    const targetIndex = executionFlow.indexOf(edge.target);
    
    if (sourceIndex !== -1 && targetIndex !== -1 && targetIndex > sourceIndex) {
      return '#10b981'; // Success color
    }
    
    return '#777'; // Default color
  };

  // Update edges to show flow
  const flowEdges: Edge[] = workflow.edges.map((edge) => ({
    ...edge,
    type: edge.type || 'conditional',
    label: edge.label,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    selectable: false,
    style: {
      stroke: getEdgeHighlight(edge),
      strokeWidth: executionFlow.includes(edge.source) && executionFlow.includes(edge.target) ? 3 : 2
    }
  }));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-right"
        connectionLineType={ConnectionLineType.SmoothStep}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={true}
        proOptions={{ hideAttribution: true }}
      >
        <Panel position="top-left" className="m-2 bg-white p-4 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{workflow.name}</h2>
              <p className="text-sm text-gray-600">{workflow.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsTestPanelOpen(true)}
                disabled={isTestPanelOpen || isRunning}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Workflow
              </Button>
            </div>

            {isTestPanelOpen && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Test Input</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsTestPanelOpen(false);
                      setResults({});
                      setActiveNodes([]);
                      setExecutionFlow([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Sample Messages:</Label>
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-600">High Score: "I'm interested in a demo of your product. Can you share pricing information?"</div>
                    <div className="text-gray-600">Low Score: "Please remove me from your list. Not interested."</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter test message..."
                    disabled={isRunning}
                  />
                </div>

                <Button
                  onClick={runWorkflow}
                  disabled={!testInput || isRunning}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>

                {Object.keys(results).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Execution Flow:</h3>
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="space-y-4 p-4">
                        {workflow.nodes
                          .sort((a, b) => getNodeExecutionOrder(a.id) - getNodeExecutionOrder(b.id))
                          .map(node => {
                            const result = results[node.id];
                            if (!result) return null;

                            const executionOrder = getNodeExecutionOrder(node.id);
                            if (executionOrder === Infinity) return null;

                            return (
                              <div key={node.id} className="p-4 rounded-md bg-gray-50 border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                                      {executionOrder}
                                    </div>
                                    <span className="font-medium">{node.data.label}</span>
                                  </div>
                                  <Badge variant={result.success ? "success" : "destructive"}>
                                    {result.success ? "Success" : "Error"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-1">Input:</div>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-24">
                                      {JSON.stringify(result.input, null, 2)}
                                    </pre>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-1">
                                      {result.success ? "Output:" : "Error:"}
                                    </div>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-24">
                                      {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                                    </pre>
                                  </div>

                                  <div className="text-xs text-gray-500">
                                    Processed at: {new Date(result.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
        <Controls showInteractive={false} />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
} 