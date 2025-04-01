'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Clock,
  Mail,
  Calendar,
  FileSpreadsheet,
  BarChart2,
  Edit,
  Copy,
  Info,
} from 'lucide-react';

// Import your workflow types
import { Workflow, WorkflowNode, WorkflowEdge, NODE_TYPES } from '@/features/leadflow/workflows/schema';
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
import DelayNode from './nodes/DelayNode';

// Sidebar Components
import AgentCard from './sidebar/AgentCard';
import ToolConfig from '@/components/tools/ToolConfig';

// Import the TriggerSelector component
import TriggerSelector from './triggers/TriggerSelector';

// Define the custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  agent: AgentNode,
  delay: DelayNode,
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
    className="p-3 border border-gray-200 rounded-md bg-white hover:shadow-md cursor-move flex items-center gap-2"
    draggable
    onDragStart={(event) => onDragStart(event, type)}
  >
    {icon}
    <div>
      <div className="font-medium text-sm">{label}</div>
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

interface EnhancedWorkflowEditorProps {
  initialWorkflow: Workflow;
  onSave: (workflow: Workflow) => void;
}

const FlowEditor = ({ initialWorkflow, onSave }: EnhancedWorkflowEditorProps) => {
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
            id: nodeId,
            type,
            position,
            data: {
              label: 'New Trigger',
              type,
              description: 'Triggered when an event occurs',
              config: {
                triggerType: 'gmail',
                emailConfig: {
                  fromAddress: '',
                  subject: '',
                  hasAttachment: false,
                  maxResults: 5,
                  includeParsedContent: true
                }
              },
              outputs: {
                event: 'The triggered event',
                timestamp: 'When the event occurred',
                data: 'Data associated with the event',
                emailFrom: 'Sender of the email (Gmail trigger)',
                emailSubject: 'Subject of the email (Gmail trigger)',
                emailBody: 'Content of the email (Gmail trigger)',
                emailAttachments: 'Attachments from the email (Gmail trigger)'
              },
              ...nodeCallbacks,
            },
          };
          break;
        case NODE_TYPES.ACTION:
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'New Action',
              type,
              description: 'Performs an action',
              config: {},
              outputs: {
                status: 'The result status (success/failure)',
                result: 'The action result data',
                error: 'Any error that occurred'
              },
              ...nodeCallbacks,
            },
          };
          break;
        case NODE_TYPES.CONDITION:
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'New Condition',
              type,
              description: 'Checks a condition',
              config: {
                condition: '',
              },
              outputs: {
                result: 'The evaluation result (true/false)',
                value: 'The evaluated value'
              },
              ...nodeCallbacks,
            },
          };
          break;
        case NODE_TYPES.DELAY:
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'New Delay',
              type,
              description: 'Waits for a specified time',
              config: {
                days: 1,
              },
              outputs: {
                waited: 'The actual time waited',
                completed: 'Whether the delay completed successfully'
              },
              ...nodeCallbacks,
            },
          };
          break;
        case NODE_TYPES.AGENT:
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'New Agent',
              type,
              description: 'Uses an AI agent',
              config: {
                agentId: '',
              },
              outputs: {
                response: 'The agent response',
                success: 'Whether the agent completed successfully',
                data: 'Data produced by the agent'
              },
              ...nodeCallbacks,
            },
          };
          break;
        default:
          // For agent types
          if (type.startsWith('agent_')) {
            const agentId = type.replace('agent_', '');
            const agent = PRESET_AGENTS.find(a => a.id === agentId);
            newNode = {
              id: nodeId,
              type: NODE_TYPES.AGENT,
              position,
              data: {
                label: agent?.name || 'Unknown Agent',
                type: NODE_TYPES.AGENT,
                description: agent?.description || '',
                config: {
                  agentId,
                },
                outputs: {
                  response: 'The agent response',
                  success: 'Whether the agent completed successfully', 
                  data: 'Data produced by the agent'
                },
                ...nodeCallbacks,
              },
            };
          } else {
            return;
          }
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

  const handleRunWorkflow = useCallback(() => {
    // This is a placeholder for running the workflow
    alert('This would run the workflow in a real implementation');
  }, []);
  
  const handleExport = useCallback(() => {
    // Create updated workflow object with current nodes and edges
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
      label: typeof edge.label === 'string' ? edge.label : undefined,
    }));
    
    const exportWorkflow: Workflow = {
      ...initialWorkflow,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
      updatedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportWorkflow, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `${workflowName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  }, [initialWorkflow, nodes, edges, workflowName, workflowDescription]);
  
  const handleImport = useCallback(() => {
    // In a real implementation, this would open a file dialog
    alert('This would open a file dialog to import a workflow JSON file');
  }, []);
  
  // Update the renderSidebar function to modify what's shown when an edge is selected
  const renderSidebar = () => (
    <div className="bg-white flex flex-col h-full">
      <ScrollArea className="h-full">
        <div className="p-4">
          {selectedEdge ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Connection</h2>
                <Button 
                  onClick={() => setSelectedEdge(null)}
                  variant="ghost" 
                  size="sm"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                  <MoveHorizontal className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium">Connection Selected</h3>
                  <p className="text-xs text-gray-500">
                    {nodes.find(n => n.id === selectedEdge.source)?.data.label || 'Source'} → {nodes.find(n => n.id === selectedEdge.target)?.data.label || 'Target'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    setEdges(edges.filter(edge => edge.id !== selectedEdge.id));
                    setSelectedEdge(null);
                    setIsEdited(true);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Connection
                </Button>
              </div>
            </div>
          ) : selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Node Settings</h2>
                <Button 
                  onClick={() => setSelectedNode(null)}
                  variant="ghost" 
                  size="sm"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center
                  ${selectedNode.type === 'trigger' ? 'bg-orange-100' : 
                    selectedNode.type === 'action' ? 'bg-green-100' : 
                    selectedNode.type === 'condition' ? 'bg-blue-100' : 
                    selectedNode.type === 'delay' ? 'bg-violet-100' : 
                    'bg-purple-100'}`
                }>
                  {selectedNode.type === 'trigger' ? <GitBranch className="h-5 w-5 text-orange-500" /> :
                    selectedNode.type === 'action' ? <Settings className="h-5 w-5 text-green-500" /> :
                    selectedNode.type === 'condition' ? <MoveHorizontal className="h-5 w-5 text-blue-500" /> :
                    selectedNode.type === 'delay' ? <Clock className="h-5 w-5 text-violet-500" /> :
                    <BrainCircuit className="h-5 w-5 text-purple-500" />
                  }
                </div>
                <div>
                  <h3 className="font-medium">{selectedNode.type} Node</h3>
                  <p className="text-xs text-gray-500">ID: {selectedNode.id}</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="node-label">Label</Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      setNodes(nodes.map(node => {
                        if (node.id === selectedNode.id) {
                          return {
                            ...node,
                            data: { ...node.data, label: e.target.value }
                          };
                        }
                        return node;
                      }));
                      
                      // Update the selected node with the new label
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, label: e.target.value }
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="node-description">Description</Label>
                  <Input
                    id="node-description"
                    value={selectedNode.data.description || ''}
                    onChange={(e) => {
                      setNodes(nodes.map(node => {
                        if (node.id === selectedNode.id) {
                          return {
                            ...node,
                            data: { ...node.data, description: e.target.value }
                          };
                        }
                        return node;
                      }));
                      
                      // Update the selected node with the new description
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, description: e.target.value }
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                
                {/* Condition Node Settings - Enhanced with edge condition configuration */}
                {selectedNode.type === 'condition' && selectedNode.data.config && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="condition-expression">Condition Expression</Label>
                      <Input
                        id="condition-expression"
                        value={selectedNode.data.config.condition || ''}
                        onChange={(e) => {
                          setNodes(nodes.map(node => {
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
                          }));
                          
                          // Update the selected node with the new condition
                          setSelectedNode({
                            ...selectedNode,
                            data: { 
                              ...selectedNode.data, 
                              config: { 
                                ...selectedNode.data.config, 
                                condition: e.target.value 
                              } 
                            }
                          });
                        }}
                        className="mt-1"
                        placeholder="e.g. score >= 70"
                      />
                    </div>
                    
                    {/* Output Conditions Section */}
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Output Connections</h4>
                      
                      {/* Yes Output */}
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <div className="h-4 w-4 bg-green-500 rounded-full mr-2"></div>
                          <h5 className="font-medium text-sm">Yes Output</h5>
                        </div>
                        
                        {/* Find edges from yes output */}
                        {(() => {
                          const yesEdges = edges.filter(
                            edge => edge.source === selectedNode.id && edge.sourceHandle === 'yes'
                          );
                          
                          if (yesEdges.length === 0) {
                            return (
                              <p className="text-xs text-gray-500">No connection from Yes output</p>
                            );
                          }
                          
                          return yesEdges.map(edge => {
                            const targetNode = nodes.find(n => n.id === edge.target);
                            return (
                              <div key={edge.id} className="flex justify-between items-center text-sm">
                                <span>→ {targetNode?.data.label || 'Unknown Node'}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEdges(edges.filter(e => e.id !== edge.id));
                                    setIsEdited(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-gray-500" />
                                </Button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      
                      {/* No Output */}
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <div className="h-4 w-4 bg-red-500 rounded-full mr-2"></div>
                          <h5 className="font-medium text-sm">No Output</h5>
                        </div>
                        
                        {/* Find edges from no output */}
                        {(() => {
                          const noEdges = edges.filter(
                            edge => edge.source === selectedNode.id && edge.sourceHandle === 'no'
                          );
                          
                          if (noEdges.length === 0) {
                            return (
                              <p className="text-xs text-gray-500">No connection from No output</p>
                            );
                          }
                          
                          return noEdges.map(edge => {
                            const targetNode = nodes.find(n => n.id === edge.target);
  return (
                              <div key={edge.id} className="flex justify-between items-center text-sm">
                                <span>→ {targetNode?.data.label || 'Unknown Node'}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEdges(edges.filter(e => e.id !== edge.id));
                                    setIsEdited(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-gray-500" />
                                </Button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Delay Node Settings */}
                {selectedNode.type === 'delay' && selectedNode.data.config && (
                  <div>
                    <Label htmlFor="delay-days">Delay (days)</Label>
                    <Input
                      id="delay-days"
                      type="number"
                      value={selectedNode.data.config.days || 0}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        setNodes(nodes.map(node => {
                          if (node.id === selectedNode.id) {
                            return {
                              ...node,
                              data: { 
                                ...node.data, 
                                config: { 
                                  ...node.data.config, 
                                  days
                                } 
                              }
                            };
                          }
                          return node;
                        }));
                        
                        // Update the selected node with the new delay
                        setSelectedNode({
                          ...selectedNode,
                          data: { 
                            ...selectedNode.data, 
                            config: { 
                              ...selectedNode.data.config, 
                              days
                            } 
                          }
                        });
                      }}
                      className="mt-1"
                      min="0"
                    />
                  </div>
                )}
                
                {/* Agent Node Settings */}
                {selectedNode.type === 'agent' && selectedNode.data.config && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="agent-id">Agent</Label>
                      <select
                        id="agent-id"
                        value={selectedNode.data.config.agentId || ''}
                        onChange={(e) => {
                          const agentId = e.target.value;
                          const agent = PRESET_AGENTS.find(a => a.id === agentId);
                          
                          setNodes(nodes.map(node => {
                            if (node.id === selectedNode.id) {
                              return {
                                ...node,
                                data: { 
                                  ...node.data, 
                                  config: { 
                                    ...node.data.config, 
                                    agentId
                                  },
                                  label: agent ? agent.name : node.data.label
                                }
                              };
                            }
                            return node;
                          }));
                          
                          // Update the selected node with the new agent
                          setSelectedNode({
                            ...selectedNode,
                            data: { 
                              ...selectedNode.data, 
                              config: { 
                                ...selectedNode.data.config, 
                                agentId
                              },
                              label: agent ? agent.name : selectedNode.data.label
                            }
                          });
                        }}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select an agent</option>
                        {PRESET_AGENTS.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedNode.data.config.agentId && (
                      <div>
                        <Label>Available Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {PRESET_AGENTS.find(a => a.id === selectedNode.data.config.agentId)?.tools.map(toolId => {
                            const tool = PRESET_TOOLS.find(t => t.id === toolId);
                            return tool ? (
                              <Badge key={tool.id} variant="outline" className="text-xs py-0 px-2">
                                {tool.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Trigger Node Settings */}
                {selectedNode.type === 'trigger' && (
                  <div className="space-y-4">
                    <TriggerSelector 
                      config={selectedNode.data.config || {}}
                      onChange={(newConfig) => {
                        // Update the node's config
                        setNodes(nodes.map(node => {
                          if (node.id === selectedNode.id) {
                            return {
                              ...node,
                              data: { 
                                ...node.data, 
                                config: newConfig,
                                // If this is a Gmail trigger and it's connected, update the label
                                label: newConfig.triggerType === 'gmail' && newConfig.connected 
                                  ? `Gmail: ${newConfig.userEmail?.split('@')[0] || 'Connected'}`
                                  : node.data.label
                              }
                            };
                          }
                          return node;
                        }));
                        
                        // Update the selected node with the new config
                        setSelectedNode({
                          ...selectedNode,
                          data: { 
                            ...selectedNode.data, 
                            config: newConfig,
                            // If this is a Gmail trigger and it's connected, update the label
                            label: newConfig.triggerType === 'gmail' && newConfig.connected 
                              ? `Gmail: ${newConfig.userEmail?.split('@')[0] || 'Connected'}`
                              : selectedNode.data.label
                          }
                        });
                        
                        setIsEdited(true);
                      }}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleDuplicateNode(selectedNode)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button 
                    onClick={() => {
                      handleDeleteNode(selectedNode);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Workflow</h2>
                  <Button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    variant="ghost" 
                    size="sm"
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
            <div>
                    <Label htmlFor="workflow-name">Name</Label>
              <Input
                id="workflow-name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Input
                id="workflow-description"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                className="mt-1"
              />
                  </div>
            </div>
          </div>
          
              <div className="space-y-2 mb-4">
              <Button 
                onClick={handleSave} 
                variant="default" 
                  className="w-full"
                disabled={!isEdited}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={handleRunWorkflow} 
                variant="outline"
                  className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Run
              </Button>
                <div className="flex gap-2">
              <Button 
                onClick={handleExport} 
                variant="outline"
                    className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={handleImport} 
                variant="outline"
                    className="flex-1"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
              
              <Tabs defaultValue="nodes" className="flex flex-col">
                <TabsList className="w-full">
                  <TabsTrigger value="nodes" className="flex-1">Nodes</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="nodes" className="overflow-hidden">
                  <div className="mt-2">
                    <NodeCategory title="Flow Control">
                      <DraggableItem
                        label="Trigger"
                        type={NODE_TYPES.TRIGGER}
                        description="Starts the workflow"
                        icon={<GitBranch className="h-5 w-5 text-orange-500" />}
                        onDragStart={onDragStart}
                      />
                      <DraggableItem
                        label="Condition"
                        type={NODE_TYPES.CONDITION}
                        description="Branch based on conditions"
                        icon={<MoveHorizontal className="h-5 w-5 text-blue-500" />}
                        onDragStart={onDragStart}
                      />
                      <DraggableItem
                        label="Delay"
                        type={NODE_TYPES.DELAY}
                        description="Wait for a specified time"
                        icon={<Clock className="h-5 w-5 text-purple-500" />}
                        onDragStart={onDragStart}
                      />
                    </NodeCategory>
                    
                    <NodeCategory title="Processing">
                      <DraggableItem
                        label="Action"
                        type={NODE_TYPES.ACTION}
                        description="Perform an action"
                        icon={<Settings className="h-5 w-5 text-green-500" />}
                        onDragStart={onDragStart}
                      />
                      <DraggableItem
                        label="Agent"
                        type={NODE_TYPES.AGENT}
                        description="Use an AI agent"
                        icon={<BrainCircuit className="h-5 w-5 text-purple-500" />}
                        onDragStart={onDragStart}
                      />
                    </NodeCategory>
        </div>
                </TabsContent>
                
                <TabsContent value="agents" className="overflow-hidden">
                  <div className="space-y-3 mt-2">
                    {PRESET_AGENTS.map((agent) => (
                      <div 
                        key={agent.id}
                        draggable
                        onDragStart={(event) => onDragStart(event, `agent_${agent.id}`)}
                        className="cursor-move"
                      >
                        <AgentCard agent={agent} showTools={true} />
              </div>
                    ))}
            </div>
                </TabsContent>
                
               
              </Tabs>
            </>
        )}
      </div>
      </ScrollArea>
    </div>
  );

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full overflow-hidden"
    >
      <ResizablePanel defaultSize={75} minSize={30}>
        <div className="h-full relative" ref={reactFlowWrapper}>
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
            attributionPosition="bottom-right"
            connectionLineType={ConnectionLineType.SmoothStep}
            nodesDraggable={true}
            elementsSelectable={true}
            edgesUpdatable={false}
            edgesFocusable={true}
          >
            <Controls />
            <Background />
            
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
};

export function EnhancedWorkflowEditor(props: EnhancedWorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor {...props} />
    </ReactFlowProvider>
  );
} 