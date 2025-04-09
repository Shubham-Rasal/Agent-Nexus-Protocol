'use client';

import { useState, useCallback, useEffect, useMemo, useRef, useContext, useImperativeHandle, forwardRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
  OnConnectStartParams,
  ConnectionLineType,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Save, 
  Play, 
  FileDown, 
  FileUp, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Plus,
  PanelRight,
  BrainCircuit,
  Settings,
  GitBranch,
  MoveHorizontal,
  Mail,
  Calendar,
  FileSpreadsheet,
  BarChart2,
  Edit,
  Copy,
  Info,
  Check,
  PlayCircle,
  Pause,
  StopCircle,
  X,
  Loader2,
} from 'lucide-react';

// Import your workflow types
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowDomainType,
  WorkflowCapabilityType,
  NODE_TYPES 
} from '@/features/workflows/registry/types';
import { PRESET_AGENTS } from '@/features/leadflow/agents/presets';
import { PRESET_TOOLS } from '@/features/leadflow/tools/presets';
import { generateId } from '@/components/WorkflowUtils';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

// Custom Node Types
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import AgentNode from './nodes/AgentNode';

// Sidebar Components
import ToolConfig from '@/components/tools/ToolConfig';

// Import the TriggerSelector component
import TriggerSelector from './triggers/TriggerSelector';

// Import new registry types and methods
import { agents } from '@/app/agents.json';
import { workflowRegistry } from '@/features/workflows/registry/registry';

// Import the editor context
import { EditorContext } from '@/app/editor/layout';

// Generic type for Tool
interface Tool {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

// Custom Tool presets for the editor
const EDITOR_TOOLS: Tool[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Send and receive emails',
    capabilities: ['Communication', 'Notification']
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Manage calendar events',
    capabilities: ['Scheduling', 'Reminders']
  },
  {
    id: 'docs',
    name: 'Documents',
    description: 'Create and edit documents',
    capabilities: ['Content', 'Collaboration']
  },
  {
    id: 'spreadsheet',
    name: 'Spreadsheet',
    description: 'Work with tabular data',
    capabilities: ['Data', 'Analysis']
  }
];

// Custom AgentCard for the workflow editor
const WorkflowAgentCard = ({ 
  agent, 
  onDragStart 
}: { 
  agent: { 
    id: string; 
    name: string; 
    description: string; 
    tools: string[]; 
    knowledge_sources?: string[]; 
    privacy_level?: string; 
    stake?: number; 
  };
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
}) => (
  <div
    className="border border-gray-200 rounded-md p-3 bg-white hover:shadow-md cursor-move"
    draggable
    onDragStart={onDragStart}
  >
    <div className="font-medium text-sm mb-1">{agent.name}</div>
    <div className="text-xs text-gray-500 mb-2">{agent.description}</div>
    <div className="flex flex-wrap gap-1">
      {agent.tools.map((tool, idx) => (
        <Badge key={idx} variant="outline" className="text-xs">
          {tool}
        </Badge>
      ))}
    </div>
  </div>
);

// Define the custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  agent: AgentNode,
};

// Simplify the custom edge component - just highlight when selected
const ConditionalEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
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
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#10b981' : '#777',
          cursor: 'pointer',
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

interface NodeCategoryProps {
  title: string;
  children: React.ReactNode;
}

const NodeCategory = ({ title, children }: NodeCategoryProps) => (
  <div className="mb-4">
    <h3 className="text-sm font-medium mb-2">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

interface DraggableItemProps {
  label: string;
  type: string;
  description?: string;
  icon?: React.ReactNode;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const DraggableItem = ({ label, type, description, icon, onDragStart }: DraggableItemProps) => (
  <div
    className="flex items-start p-2 border border-gray-200 rounded-md hover:shadow-sm cursor-move bg-white"
    draggable
    onDragStart={(event) => {
      onDragStart(event, type);
    }}
  >
    <div className="mr-2 mt-0.5">
      {icon || <div className="w-4 h-4 rounded-full bg-gray-300" />}
    </div>
    <div>
      <div className="text-sm font-medium">{label}</div>
      {description && <div className="text-xs text-gray-500">{description}</div>}
    </div>
  </div>
);

// Custom Node Wrapper with Context Menu
const NodeWithContextMenu = ({ 
  children, 
  node, 
  onNodeEdit, 
  onNodeDelete, 
  onNodeDuplicate, 
  onNodeInfo
}: { 
  children: React.ReactNode, 
  node: Node, 
  onNodeEdit: (node: Node) => void, 
  onNodeDelete: (node: Node) => void,
  onNodeDuplicate: (node: Node) => void,
  onNodeInfo: (node: Node) => void
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={() => onNodeInfo(node)}>
          <Info className="mr-2 h-4 w-4" />
          Node Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onNodeEdit(node)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Node
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onNodeDuplicate(node)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Node
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={() => onNodeDelete(node)}
          className="text-red-600 focus:text-red-600 hover:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Node
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

// Add agent type definitions
const AGENT_CONFIGS = {
  'lead-qualifier': {
    inputs: {
      message: 'The input message to analyze'
    },
    outputs: {
      score: 'Lead qualification score (0-100)',
      analysis: {
        positiveKeywords: 'Number of positive keywords found',
        negativeKeywords: 'Number of negative keywords found',
        text: 'Analyzed text'
      }
    }
  },
  'email-outreach': {
    inputs: {
      score: 'Lead qualification score',
      message: 'Original message for context'
    },
    outputs: {
      emailSent: 'Whether the email was sent successfully',
      template: 'Email template used',
      message: 'Email message content'
    }
  },
  'meeting-scheduler': {
    inputs: {
      score: 'Lead qualification score',
      message: 'Original message for context'
    },
    outputs: {
      meetingScheduled: 'Whether the meeting was scheduled',
      proposedTime: 'Proposed meeting time',
      duration: 'Meeting duration in minutes',
      type: 'Type of meeting'
    }
  }
};

interface EnhancedWorkflowEditorProps {
  initialWorkflow: Workflow;
  onSave: (workflow: Workflow) => void;
}

const FlowEditor = forwardRef<{ handleSave: () => void }, EnhancedWorkflowEditorProps>(
  ({ initialWorkflow, onSave }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow.name);
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow.description);
  const [isEdited, setIsEdited] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<any>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [nodeResults, setNodeResults] = useState<Record<string, any>>({});
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  
  // Define handler functions first (before they're used in useEffect dependencies)
  const handleDeleteNode = useCallback((node: Node) => {
    setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
    setEdges((edges) => edges.filter(
      (edge) => edge.source !== node.id && edge.target !== node.id
    ));
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsEdited(true);
  }, [setNodes, setEdges]);

  const handleEditNode = useCallback((node: Node) => {
    // Placeholder for edit node functionality
    console.log('Edit node:', node);
    // In a real application, you would show a modal or form to edit the node properties
    alert(`Editing node: ${node.data.label}`);
  }, []);

  const handleDuplicateNode = useCallback((node: Node) => {
    const newNodeId = generateId(node.type || 'node');
    const newNode = {
      ...node,
      id: newNodeId,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setIsEdited(true);
  }, [setNodes]);

  const handleNodeInfo = useCallback((node: Node) => {
    // Placeholder for node info functionality
    const details = `
      Type: ${node.type}
      Label: ${node.data.label}
      Description: ${node.data.description}
      ID: ${node.id}
    `;
    alert(details);
  }, []);
  
  // Simplify the onConnect callback to remove conditional parameters
  const onConnect = useCallback(
    (connection: Connection) => {
      let edgeLabel = undefined;
      
      // If this is a connection from a condition node's yes/no output, add default label
      if (connection.sourceHandle === 'yes') {
        edgeLabel = 'Yes';
      } else if (connection.sourceHandle === 'no') {
        edgeLabel = 'No';
      }
      
      setEdges((eds) => addEdge({
        ...connection,
        id: generateId('edge'),
        type: 'conditional',
        animated: false,
        label: edgeLabel,
      }, eds));
      setIsEdited(true);
    },
    [setEdges]
  );

  // Update useEffect that processes initial workflow edges to use the custom edge type
  useEffect(() => {
    const rfNodes = initialWorkflow.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        onNodeDelete: () => handleDeleteNode({id: node.id, data: node.data, position: node.position, type: node.type}),
        onNodeEdit: () => handleEditNode({id: node.id, data: node.data, position: node.position, type: node.type}),
        onNodeDuplicate: () => handleDuplicateNode({id: node.id, data: node.data, position: node.position, type: node.type}),
        onNodeInfo: () => handleNodeInfo({id: node.id, data: node.data, position: node.position, type: node.type}),
      },
    }));
    
    const rfEdges = initialWorkflow.edges.map((edge) => {
      // For yes/no edges from condition nodes, make sure they have proper labels
      let edgeLabel = edge.label;
      if (!edgeLabel && edge.sourceHandle === 'yes') {
        edgeLabel = 'Yes';
      } else if (!edgeLabel && edge.sourceHandle === 'no') {
        edgeLabel = 'No';
      }
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edgeLabel,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: 'conditional', // Use our custom edge type
        data: edge.data, // Include the edge data
      };
    });
    
    setNodes(rfNodes);
    setEdges(rfEdges);
    setWorkflowName(initialWorkflow.name);
    setWorkflowDescription(initialWorkflow.description);
  }, [initialWorkflow, setNodes, setEdges, handleDeleteNode, handleEditNode, handleDuplicateNode, handleNodeInfo]);

  // Keep track of edited state
  useEffect(() => {
    setIsEdited(true);
  }, [nodes, edges, workflowName, workflowDescription]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    // Ensure edge is properly selected
    setSelectedEdge(edge);
    setSelectedNode(null);
    
    // Set standard labels for condition node edges if they don't have labels yet
    if (edge.sourceHandle === 'yes' && !edge.label) {
      // This is a 'yes' output from a condition node
      setEdges(edges.map(e => {
        if (e.id === edge.id) {
          return {
            ...e,
            label: 'Yes'
          };
        }
        return e;
      }));
    } else if (edge.sourceHandle === 'no' && !edge.label) {
      // This is a 'no' output from a condition node
      setEdges(edges.map(e => {
        if (e.id === edge.id) {
          return {
            ...e,
            label: 'No'
          };
        }
        return e;
      }));
    }
  }, [edges, setEdges]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
      
      // For regular nodes, also set some basic data
      event.dataTransfer.setData('node/data', JSON.stringify({
        type: nodeType,
        label: event.currentTarget.querySelector('.text-sm')?.textContent || '',
        description: event.currentTarget.querySelector('.text-xs')?.textContent || ''
      }));
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let newNode: WorkflowNode;
      const nodeId = generateId(type);

      // Prepare the common callback functions
      const nodeCallbacks = {
        onNodeDelete: () => handleDeleteNode({id: nodeId, type, position, data: {}} as Node),
        onNodeEdit: () => handleEditNode({id: nodeId, type, position, data: {}} as Node),
        onNodeDuplicate: () => handleDuplicateNode({id: nodeId, type, position, data: {}} as Node),
        onNodeInfo: () => handleNodeInfo({id: nodeId, type, position, data: {}} as Node),
      };

      switch (type) {
        case NODE_TYPES.TRIGGER:
                newNode = {
            id: generateId('trigger'),
            type: type,
                  position,
                  data: {
              label: 'Text Message Trigger',
              type: type,
              description: 'Triggered by a text message',
                    config: {
                triggerType: 'text'
                    },
                    outputs: {
                message: 'The input text message',
                triggered: 'Whether the trigger was activated'
              }
            }
            };
            break;
        case NODE_TYPES.CONDITION:
                newNode = {
            id: generateId('condition'),
            type: type,
                  position,
                  data: {
              label: 'New Condition',
              type: type,
              description: 'Branch based on condition',
                    config: {
                condition: ''
                    },
                    outputs: {
                result: 'The result of the condition evaluation'
              }
            }
            };
            break;
        case NODE_TYPES.AGENT:
          const agentData = event.dataTransfer.getData('agent/data');
          if (agentData) {
            const agent = JSON.parse(agentData);
            const agentConfig = AGENT_CONFIGS[agent.id];
                newNode = {
              id: generateId('agent'),
              type: type,
                  position,
                  data: {
                label: agent.name,
                type: type,
                description: agent.description,
                    config: {
                  agentId: agent.id,
                  inputs: agentConfig?.inputs || {},
                  outputs: agentConfig?.outputs || {}
                },
                inputs: agentConfig?.inputs || {},
                outputs: agentConfig?.outputs || {}
              }
            };
          } else {
          newNode = {
              id: generateId('agent'),
              type: type,
            position,
            data: {
                label: 'New Agent',
                type: type,
                description: 'Execute agent task',
                    config: {
                  agentId: ''
                },
                inputs: {},
                outputs: {}
              }
            };
          }
          break;
        default:
            return;
      }

      setNodes((nds) => nds.concat(newNode));
      setIsEdited(true);
    },
    [reactFlowInstance, setNodes, handleDeleteNode, handleEditNode, handleDuplicateNode, handleNodeInfo]
  );
  
  const handleSave = useCallback(() => {
    // Convert React Flow nodes back to workflow nodes
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: node.type || NODE_TYPES.ACTION,
      position: node.position,
      data: node.data,
    }));
    
    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      label: edge.label != null && typeof edge.label !== 'object' ? String(edge.label) : undefined,
      data: edge.data, // Save edge data including conditions
    }));
    
    const updatedWorkflow: Workflow = {
      ...initialWorkflow,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedWorkflow);
    setIsEdited(false);
  }, [initialWorkflow, nodes, edges, workflowName, workflowDescription, onSave]);

  // Update the executeNode function to handle agent inputs/outputs properly
  const executeNode = async (nodeId: string, inputData: any) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    setActiveNodes(prev => [...prev, nodeId]);

    try {
      let result;
      switch (node.type) {
        case NODE_TYPES.TRIGGER:
          result = {
            message: inputData.message,
            timestamp: new Date().toISOString()
          };
          break;

        case NODE_TYPES.CONDITION:
          const condition = node.data.config?.condition;
          if (!condition) {
            throw new Error('No condition specified');
          }
          // Evaluate the condition using input data
          const evalResult = eval(`with (${JSON.stringify(inputData)}) { ${condition} }`);
          result = { 
            result: evalResult,
            condition: condition,
            inputData
          };
          break;

        case NODE_TYPES.AGENT:
          const agentId = node.data.config?.agentId;
          const agent = agents.find(a => a.id === agentId);
          if (!agent) {
            throw new Error('Agent not found');
          }

          // Validate required inputs
          const requiredInputs = Object.keys(node.data.inputs || {});
          const missingInputs = requiredInputs.filter(input => !(input in inputData));
          if (missingInputs.length > 0) {
            throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
          }

          const output = await simulateAgentProcessing(agent, inputData);
          result = {
            ...output,
            agentId,
            agentName: agent.name,
            input: inputData
          };
          break;

        default:
          result = inputData;
      }

      // Store the result
      setNodeResults(prev => ({
        ...prev,
        [nodeId]: { success: true, data: result }
      }));

      return result;
    } catch (error) {
      setNodeResults(prev => ({
        ...prev,
        [nodeId]: { success: false, error: error instanceof Error ? error.message : String(error) }
      }));
      return null;
    } finally {
      setActiveNodes(prev => prev.filter(id => id !== nodeId));
    }
  };

  // Update the simulateAgentProcessing function to handle inputs properly
  const simulateAgentProcessing = async (agent: any, input: any) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (agent.id) {
      case 'lead-qualifier':
        const text = input.message.toLowerCase();
        const keywords = {
          positive: ['interested', 'buy', 'purchase', 'demo', 'pricing', 'price', 'information'],
          negative: ['spam', 'unsubscribe', 'stop', 'not interested']
        };

        const positiveCount = keywords.positive.filter(word => text.includes(word)).length;
        const negativeCount = keywords.negative.filter(word => text.includes(word)).length;
        
        const score = Math.max(0, Math.min(100, 
          50 + (positiveCount * 15) - (negativeCount * 25)
        ));

        return {
          score,
          analysis: {
            positiveKeywords: positiveCount,
            negativeKeywords: negativeCount,
            text: input.message
          }
        };

      case 'email-outreach':
        // Use the score to determine the email template
        const emailScore = input.score || 0;
        const template = emailScore < 30 ? 'rejection' : 'follow_up';
        const message = emailScore < 30 
          ? 'Thank you for your message. We don\'t think our services are a good fit at this time.'
          : 'Thank you for your interest. We will contact you soon with more information.';

                          return {
          emailSent: true,
          template,
          message
        };

      case 'meeting-scheduler':
        // Only schedule meetings for high-scoring leads
        const meetingScore = input.score || 0;
        if (meetingScore < 70) {
          throw new Error('Score too low to schedule a meeting');
        }

        return {
          meetingScheduled: true,
          proposedTime: new Date(Date.now() + 86400000).toISOString(),
          duration: 30,
          type: 'discovery_call'
        };

      default:
                              return {
          processed: true,
          message: 'Agent processed the request'
        };
    }
  };

  // Update the executeWorkflow function to properly pass data between nodes
  const executeWorkflow = async (startNodeId: string, input: any) => {
    setIsTestRunning(true);
    setNodeResults({});
    setActiveNodes([]);

    try {
      const processNode = async (nodeId: string, inputData: any) => {
        const result = await executeNode(nodeId, inputData);
        if (!result) return;

        // Find connected nodes
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        
        for (const edge of outgoingEdges) {
          const sourceNode = nodes.find(n => n.id === nodeId);
          if (sourceNode?.type === NODE_TYPES.CONDITION) {
            const conditionResult = result.result;
            if ((edge.sourceHandle === 'yes' && conditionResult) ||
                (edge.sourceHandle === 'no' && !conditionResult)) {
              // Pass the original input data along with the condition result
              await processNode(edge.target, {
                ...inputData,
                conditionResult: result
              });
            }
          } else {
            // For agent nodes, pass their output as input to the next node
            await processNode(edge.target, result);
          }
        }
      };

      await processNode(startNodeId, { message: input });
    } finally {
      setIsTestRunning(false);
    }
  };

  // Update the node settings panel to include test functionality
  const renderNodeSettings = () => {
    if (!selectedNode) return null;

                            return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Node Settings</h2>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
            onClick={() => setSelectedNode(null)}
                                >
            <X className="h-4 w-4" />
                                </Button>
                              </div>

        <div className="space-y-4">
                  <div>
            <Label>Label</Label>
                    <Input
              value={selectedNode.data.label || ''}
                      onChange={(e) => {
                const newNodes = nodes.map(node => {
                          if (node.id === selectedNode.id) {
                            return {
                              ...node,
                              data: { 
                                ...node.data, 
                        label: e.target.value
                              }
                            };
                          }
                          return node;
                });
                setNodes(newNodes);
                      }}
                      className="mt-1"
                    />
                  </div>
                
                    <div>
            <Label>Description</Label>
            <Input
              value={selectedNode.data.description || ''}
                        onChange={(e) => {
                const newNodes = nodes.map(node => {
                            if (node.id === selectedNode.id) {
                              return {
                                ...node,
                                data: { 
                                  ...node.data, 
                        description: e.target.value
                                }
                              };
                            }
                            return node;
                });
                setNodes(newNodes);
              }}
              className="mt-1"
            />
                    </div>
                    
          {selectedNode.type === NODE_TYPES.CONDITION && (
                      <div>
              <Label>Condition</Label>
              <Input
                value={selectedNode.data.config?.condition || ''}
                          onChange={(e) => {
                  const newNodes = nodes.map(node => {
                          if (node.id === selectedNode.id) {
                            return {
                              ...node,
                              data: { 
                                ...node.data, 
                                    config: { 
                                      ...node.data.config, 
                            condition: e.target.value
                                    }
                              }
                            };
                          }
                          return node;
                  });
                  setNodes(newNodes);
                }}
                className="mt-1"
                placeholder="Enter condition (e.g. data.score >= 70)"
              />
                      </div>
          )}
                      
          {selectedNode.type === NODE_TYPES.TRIGGER && (
            <>
                        <div>
                <Label>Trigger Type</Label>
                          <select
                  value={selectedNode.data.config?.triggerType || 'text'}
                            onChange={(e) => {
                    const newNodes = nodes.map(node => {
                                if (node.id === selectedNode.id) {
                                  return {
                                    ...node,
                                    data: { 
                                      ...node.data, 
                                      config: { 
                                        ...node.data.config, 
                              triggerType: e.target.value
                                      } 
                                    }
                                  };
                                }
                                return node;
                    });
                    setNodes(newNodes);
                  }}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="text">Text Message</option>
                  <option value="gmail">Gmail</option>
                          </select>
                        </div>
                      
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-2">Test Workflow</h3>
                <div className="space-y-4">
                          <div>
                    <Label>Test Input</Label>
                    <textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter test message..."
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
                            />
                          </div>
                  <Button
                    onClick={() => executeWorkflow(selectedNode.id, testInput)}
                    disabled={isTestRunning || !testInput}
                    className="w-full"
                  >
                    {isTestRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test Workflow
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedNode.type === NODE_TYPES.AGENT && (
            <div>
              <Label>Agent</Label>
              <select
                value={selectedNode.data.config?.agentId || ''}
                              onChange={(e) => {
                  const newNodes = nodes.map(node => {
                                  if (node.id === selectedNode.id) {
                                    return {
                                      ...node,
                                      data: { 
                                        ...node.data, 
                                        config: { 
                                          ...node.data.config, 
                            agentId: e.target.value
                                        } 
                                      }
                                    };
                                  }
                                  return node;
                  });
                  setNodes(newNodes);
                }}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select an agent...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
                  </div>
                )}
                
          {/* Show execution results */}
          {Object.keys(nodeResults).length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Execution Results</h3>
              <div className="space-y-3">
                {Object.entries(nodeResults).map(([nodeId, result]) => {
                  const node = nodes.find(n => n.id === nodeId);
                  return (
                    <div key={nodeId} className="p-3 rounded-md bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{node?.data.label}</span>
                        {result.success ? (
                          <Badge variant="success">Success</Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                </div>
                      <pre className="text-xs mt-2 overflow-auto max-h-32 bg-white p-2 rounded border">
                        {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                      </pre>
              </div>
                  );
                })}
            </div>
                </div>
          )}
            </div>
            </div>
    );
  };

  // Update the renderSidebar function to use the new renderNodeSettings
  const renderSidebar = () => (
    <div className="bg-white border-l border-gray-200 h-full overflow-auto">
      <Tabs defaultValue="nodes" className="h-full flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1 p-4">
          {selectedNode ? renderNodeSettings() : (
              <>
                <TabsContent value="nodes" className="mt-2 h-full">
                  <div className="space-y-4">
                    <NodeCategory title="Triggers">
                      <DraggableItem
                        label="Start Trigger"
                        type="trigger"
                        description="Starting point for the workflow"
                        icon={<Play className="h-4 w-4 text-green-600" />}
                        onDragStart={onDragStart}
                      />
                    </NodeCategory>
                    
                    <NodeCategory title="Flow Control">
                      <DraggableItem
                        label="Condition"
                        type="condition"
                        description="Branch based on conditions"
                        icon={<GitBranch className="h-4 w-4 text-blue-600" />}
                        onDragStart={onDragStart}
                      />
                    </NodeCategory>
                  </div>
                </TabsContent>
                
                <TabsContent value="agents" className="mt-2 h-full space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {agents.map((agent) => (
                      <WorkflowAgentCard
                        key={agent.id}
                        agent={{
                          id: agent.id,
                          name: agent.name,
                          description: agent.description,
                          tools: agent.tools,
                          knowledge_sources: agent.knowledge_sources,
                          privacy_level: agent.privacy_level,
                          stake: agent.stake,
                        }}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/reactflow', 'agent');
                          event.dataTransfer.setData('agent/data', JSON.stringify({
                            id: agent.id,
                            name: agent.name,
                            description: agent.description,
                            tools: agent.tools
                          }));
                        }}
                      />
                    ))}
            </div>
                </TabsContent>
            </>
        )}
      </ScrollArea>
        </Tabs>
    </div>
  );

  // Add visual feedback for active nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          border: activeNodes.includes(node.id) ? '2px solid #3b82f6' : undefined,
          boxShadow: activeNodes.includes(node.id) ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : undefined
        },
      }))
    );
  }, [activeNodes, setNodes]);

    // Make handleSave available via ref
    useImperativeHandle(ref, () => ({
      handleSave: () => {
        handleSave();
      }
    }));

  // Debounced autosave effect
  useEffect(() => {
    if (!isEdited) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout for autosave
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      handleSave();
      setLastSaved(new Date());
      setIsSaving(false);
    }, 2000); // 2 second debounce

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isEdited, nodes, edges, workflowName, workflowDescription]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full overflow-hidden"
    >
      <ResizablePanel defaultSize={75} minSize={30}>
        <div className="h-full w-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.1}
            maxZoom={4}
            attributionPosition="bottom-right"
            connectionLineType={ConnectionLineType.SmoothStep}
            nodesDraggable={true}
            elementsSelectable={true}
            edgesUpdatable={false}
            edgesFocusable={true}
            className="h-full w-full"
          >
            <Panel position="top-left" className="m-2 bg-white p-4 rounded-lg shadow-sm border">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {isSaving ? (
                      <span className="text-xs text-gray-500">Saving...</span>
                    ) : (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-gray-500">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => {
                      setWorkflowName(e.target.value);
                      setIsEdited(true);
                    }}
                    className="w-[300px]"
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Input
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => {
                      setWorkflowDescription(e.target.value);
                      setIsEdited(true);
                    }}
                    className="w-[300px]"
                    placeholder="Enter workflow description"
                  />
                </div>
              </div>
            </Panel>
            <Controls />
            <Background gap={12} size={1} />
            
            {!sidebarOpen && (
              <Panel position="top-right" className="m-2">
                <Button 
                  onClick={() => setSidebarOpen(true)}
                  variant="outline" 
                  size="sm"
                >
                  <PanelRight className="h-4 w-4 mr-2" />
                  Show Panel
                </Button>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </ResizablePanel>
      
      {sidebarOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            {renderSidebar()}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
  }
);

export function EnhancedWorkflowEditor(props: EnhancedWorkflowEditorProps) {
  const { saveWorkflow, triggerSave } = useContext(EditorContext);
  
  // Create a ref to the FlowEditor component's handleSave function
  const flowEditorRef = useRef<{ handleSave: () => void } | null>(null);
  
  // Effect to trigger save when the save button is clicked in the layout
  useEffect(() => {
    if (flowEditorRef.current) {
      flowEditorRef.current.handleSave();
    }
  }, [triggerSave]);
  
  return (
    <ReactFlowProvider>
      <FlowEditor 
        ref={flowEditorRef}
        initialWorkflow={props.initialWorkflow} 
        onSave={props.onSave} 
      />
    </ReactFlowProvider>
  );
} 