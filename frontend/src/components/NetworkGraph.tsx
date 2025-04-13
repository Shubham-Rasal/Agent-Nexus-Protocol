'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface Agent {
  id: string;
  name: string;
  privacy_level: string;
  stake: number;
  description: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  strength: number;
  description: string;
  queries_processed: number;
  success_rate: number;
}

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  privacy_level: string;
  stake: number;
  description: string;
  radius?: number;
  x?: number;
  y?: number;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: string;
  strength: number;
  description: string;
  queries_processed: number;
  success_rate: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const privacyLevelColors: Record<string, string> = {
  low: '#4ade80', // light green
  medium: '#facc15', // yellow
  high: '#fb923c', // orange
  critical: '#ef4444', // red
};

const relationshipTypeColors: Record<string, string> = {
  collaboration: '#3b82f6', // blue
  dependency: '#8b5cf6', // purple
  competition: '#ec4899', // pink
};

interface NetworkGraphProps {
  width: number;
  height: number;
  initialAgents: Agent[];
  initialRelationships: Relationship[];
  onSave?: () => void;
}

export default function NetworkGraph({ 
  width, 
  height, 
  initialAgents, 
  initialRelationships,
  onSave
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'agents' | 'relationships'>('agents');
  const [editedAgents, setEditedAgents] = useState<Agent[]>(initialAgents || []);
  const [editedRelationships, setEditedRelationships] = useState<Relationship[]>(initialRelationships || []);
  const [graphFilter, setGraphFilter] = useState<{
    relationshipType: string;
    minStrength: number;
  }>({
    relationshipType: 'all',
    minStrength: 0.7,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newRelationship, setNewRelationship] = useState<{
    source: string;
    target: string;
    type: string;
    strength: number;
    description: string;
    queries_processed: number;
    success_rate: number;
  }>({
    source: '',
    target: '',
    type: 'collaboration',
    strength: 0.75,
    description: '',
    queries_processed: 0,
    success_rate: 0.0,
  });

  useEffect(() => {
    setEditedAgents(initialAgents || []);
    setEditedRelationships(initialRelationships || []);
  }, [initialAgents, initialRelationships]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Map agents data to nodes
    const agents = editedAgents;
    const relationships = editedRelationships.filter(
      (rel) =>
        (graphFilter.relationshipType === 'all' ||
          rel.type === graphFilter.relationshipType) &&
        rel.strength >= graphFilter.minStrength
    );

    // Create graph data
    const graphData: GraphData = {
      nodes: agents.map((agent) => ({
        ...agent,
        radius: Math.sqrt(agent.stake) / 10 + 10, // Scale node size based on stake
      })),
      links: relationships.map((rel) => ({
        ...rel,
        source: rel.source,
        target: rel.target,
      })),
    };

    createForceGraph(graphData);
  }, [graphFilter, width, height, editedAgents, editedRelationships]);

  // Function to create and update the force directed graph
  const createForceGraph = (data: GraphData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear SVG

    // Create a container group
    const g = svg.append('g');

    // Initialize the force simulation
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        'link',
        d3
          .forceLink(data.links)
          .id((d: any) => d.id)
          .distance((d: any) => 150 - d.strength * 50) // Stronger links are closer
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

    // Create SVG markers for different relationship types
    const markerTypes = ['collaboration', 'dependency', 'competition'];
    markerTypes.forEach((type) => {
      svg
        .append('defs')
        .selectAll('marker')
        .data([type])
        .enter()
        .append('marker')
        .attr('id', (d) => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', (d) => relationshipTypeColors[d])
        .attr('d', 'M0,-5L10,0L0,5');
    });

    // Add lines for links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => relationshipTypeColors[d.type])
      .attr('stroke-width', (d: any) => Math.max(1, d.strength * 3))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', (d: any) => `url(#arrow-${d.type})`)
      .on('mouseover', (event, d: any) => {
        const [x, y] = d3.pointer(event);
        setTooltipPosition({ x, y });
        setSelectedLink(d);
      })
      .on('mouseout', () => {
        setSelectedLink(null);
      });

    // Add circles for nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => privacyLevelColors[d.privacy_level])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseover', (event, d: any) => {
        const [x, y] = d3.pointer(event);
        setTooltipPosition({ x, y });
        setSelectedNode(d);
      })
      .on('mouseout', () => {
        setSelectedNode(null);
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Add labels for nodes
    const labels = g
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.name)
      .attr('font-size', 10)
      .attr('dx', (d: any) => d.radius + 5)
      .attr('dy', 4)
      .attr('fill', '#333');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => {
          // Calculate the position just before the target node
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance === 0) return d.target.x;
          const targetRadius = d.target.radius || 10;
          return d.source.x + (dx / distance) * (distance - targetRadius);
        })
        .attr('y2', (d: any) => {
          // Calculate the position just before the target node
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance === 0) return d.target.y;
          const targetRadius = d.target.radius || 10;
          return d.source.y + (dy / distance) * (distance - targetRadius);
        });

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom as any);
  };

  // Handle filter changes
  const handleFilterRelationshipTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setGraphFilter({
      ...graphFilter,
      relationshipType: e.target.value,
    });
  };

  const handleStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGraphFilter({
      ...graphFilter,
      minStrength: parseFloat(e.target.value),
    });
  };

  // Function to update an agent's stake
  const handleAgentStakeChange = (id: string, newStake: number) => {
    setEditedAgents(
      editedAgents.map((agent) =>
        agent.id === id ? { ...agent, stake: newStake } : agent
      )
    );
  };

  // Function to update a relationship's strength
  const handleRelationshipStrengthChange = (source: string, target: string, newStrength: number) => {
    setEditedRelationships(
      editedRelationships.map((rel) =>
        rel.source === source && rel.target === target
          ? { ...rel, strength: newStrength }
          : rel
      )
    );
  };

  // Function to update a relationship's type
  const handleRelationshipTypeChange = (source: string, target: string, newType: string) => {
    setEditedRelationships(
      editedRelationships.map((rel) =>
        rel.source === source && rel.target === target
          ? { ...rel, type: newType }
          : rel
      )
    );
  };

  // Function to handle new relationship input changes
  const handleNewRelationshipChange = (field: string, value: any) => {
    setNewRelationship({
      ...newRelationship,
      [field]: value,
    });
  };

  // Function to add a new relationship
  const addNewRelationship = () => {
    // Check if the source and target are selected
    if (!newRelationship.source || !newRelationship.target) {
      alert('Please select both source and target agents');
      return;
    }

    // Check if a relationship with the same source and target already exists
    const relationshipExists = editedRelationships.some(
      (rel) => rel.source === newRelationship.source && rel.target === newRelationship.target
    );

    if (relationshipExists) {
      alert('A relationship between these agents already exists');
      return;
    }

    // Add the new relationship
    setEditedRelationships([
      ...editedRelationships,
      {
        ...newRelationship,
        description: newRelationship.description || `${newRelationship.source} to ${newRelationship.target} relationship`,
        queries_processed: newRelationship.queries_processed || 0,
        success_rate: newRelationship.success_rate || 0.85,
      },
    ]);

    // Reset the new relationship form
    setNewRelationship({
      source: '',
      target: '',
      type: 'collaboration',
      strength: 0.75,
      description: '',
      queries_processed: 0,
      success_rate: 0.0,
    });
  };

  // Function to delete a relationship
  const deleteRelationship = (source: string, target: string) => {
    if (confirm('Are you sure you want to delete this relationship?')) {
      setEditedRelationships(
        editedRelationships.filter(
          (rel) => !(rel.source === source && rel.target === target)
        )
      );
    }
  };

  // Function to save changes to the JSON files
  const saveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Calculate changes for summary
      const agentsChanged = JSON.stringify(editedAgents) !== JSON.stringify(initialAgents);
      const relCountBefore = initialRelationships.length;
      const relCountAfter = editedRelationships.length;
      const relationshipsChanged = JSON.stringify(editedRelationships) !== JSON.stringify(initialRelationships);
      const relationshipsAdded = relCountAfter > relCountBefore;
      
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents: editedAgents,
          relationships: editedRelationships,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const data = await response.json();
      
      if (data.success) {
        // Create summary of changes
        let changesSummary = '';
        
        if (agentsChanged) {
          changesSummary += '• Updated agent stake values\n';
        }
        
        if (relationshipsChanged) {
          if (relationshipsAdded) {
            changesSummary += `• Added ${relCountAfter - relCountBefore} new relationship(s)\n`;
          }
          if (relCountBefore > relCountAfter) {
            changesSummary += `• Removed ${relCountBefore - relCountAfter} relationship(s)\n`;
          }
          changesSummary += '• Updated relationship properties\n';
        }
        
        if (!changesSummary) {
          changesSummary = 'No changes were made.';
        }
        
        alert(`Changes saved successfully!\n\nSummary of changes:\n${changesSummary}`);
        setIsEditModalOpen(false);
        
        // Call onSave callback to refresh data
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to reset edits when modal is closed
  const resetEdits = () => {
    setEditedAgents(initialAgents || []);
    setEditedRelationships(initialRelationships || []);
  };

  // Function to handle modal open
  const handleOpenModal = () => {
    // Reset to original data before opening modal
    resetEdits();
    setIsEditModalOpen(true);
  };

  // Function to handle modal close
  const handleCloseModal = () => {
    // Ask for confirmation if changes were made
    const agentsChanged = JSON.stringify(editedAgents) !== JSON.stringify(initialAgents);
    const relationshipsChanged = JSON.stringify(editedRelationships) !== JSON.stringify(initialRelationships);
    
    if (agentsChanged || relationshipsChanged) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetEdits();
        setIsEditModalOpen(false);
      }
    } else {
      setIsEditModalOpen(false);
    }
  };

  // Modal component for editing agents and relationships
  const EditModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Edit {editMode === 'agents' ? 'Agents' : 'Relationships'}
            </h2>
            <div>
              <button
                onClick={() => setEditMode('agents')}
                className={`mr-2 px-4 py-2 rounded ${
                  editMode === 'agents' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => setEditMode('relationships')}
                className={`mr-2 px-4 py-2 rounded ${
                  editMode === 'relationships' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Relationships
              </button>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
          
          {editMode === 'agents' ? (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Agent Stakes</h3>
              <div className="space-y-2">
                {editedAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{agent.name}</span> ({agent.id})
                    </div>
                    <div className="flex items-center">
                      <label className="mr-2">Stake:</label>
                      <input
                        type="number"
                        value={agent.stake}
                        min="100"
                        max="5000"
                        step="100"
                        onChange={(e) => handleAgentStakeChange(agent.id, Number(e.target.value))}
                        className="border rounded px-2 py-1 w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="mb-6 border-b pb-4">
                <h3 className="font-semibold mb-3">Create New Relationship</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Source Agent:</label>
                    <select
                      value={newRelationship.source}
                      onChange={(e) => handleNewRelationshipChange('source', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="">Select source agent</option>
                      {editedAgents.map((agent) => (
                        <option key={`source-${agent.id}`} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Agent:</label>
                    <select
                      value={newRelationship.target}
                      onChange={(e) => handleNewRelationshipChange('target', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="">Select target agent</option>
                      {editedAgents.map((agent) => (
                        <option key={`target-${agent.id}`} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship Type:</label>
                    <select
                      value={newRelationship.type}
                      onChange={(e) => handleNewRelationshipChange('type', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="collaboration">Collaboration</option>
                      <option value="dependency">Dependency</option>
                      <option value="competition">Competition</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Strength: {newRelationship.strength.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={newRelationship.strength}
                      onChange={(e) => handleNewRelationshipChange('strength', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Description:</label>
                  <input
                    type="text"
                    value={newRelationship.description}
                    onChange={(e) => handleNewRelationshipChange('description', e.target.value)}
                    placeholder="Describe the relationship"
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="text-right">
                  <button
                    onClick={addNewRelationship}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Add Relationship
                  </button>
                </div>
              </div>

              <h3 className="font-semibold mb-2">Existing Relationships</h3>
              <div className="space-y-3">
                {editedRelationships.map((rel, index) => {
                  const sourceAgent = editedAgents.find(a => a.id === rel.source);
                  const targetAgent = editedAgents.find(a => a.id === rel.target);
                  
                  return (
                    <div key={index} className="p-3 border rounded bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div className="font-medium mb-2 md:mb-0">
                          {sourceAgent?.name || rel.source} → {targetAgent?.name || rel.target}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => deleteRelationship(rel.source, rel.target)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Delete relationship"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Relationship Type:</label>
                          <select
                            value={rel.type}
                            onChange={(e) => handleRelationshipTypeChange(rel.source, rel.target, e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          >
                            <option value="collaboration">Collaboration</option>
                            <option value="dependency">Dependency</option>
                            <option value="competition">Competition</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Strength: {rel.strength.toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={rel.strength}
                            onChange={(e) => 
                              handleRelationshipStrengthChange(
                                rel.source, 
                                rel.target, 
                                Number(e.target.value)
                              )
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {rel.description} • {rel.queries_processed.toLocaleString()} queries • {(rel.success_rate * 100).toFixed(1)}% success rate
                      </div>
                    </div>
                  );
                })}
                
                {editedRelationships.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No relationships found. Create a new relationship above.
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 border rounded text-gray-700 mr-2"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={saveChanges}
              className={`px-4 py-2 ${isSaving ? 'bg-blue-400' : 'bg-blue-600'} text-white rounded flex items-center`}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex">
          <div className="mr-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship Type:
            </label>
            <select
              value={graphFilter.relationshipType}
              onChange={handleFilterRelationshipTypeChange}
              className="border rounded p-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="collaboration">Collaboration Only</option>
              <option value="dependency">Dependency Only</option>
              <option value="competition">Competition Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Relationship Strength: {graphFilter.minStrength.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={graphFilter.minStrength}
              onChange={handleStrengthChange}
              className="w-48"
            />
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Edit Network
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="text-sm">
          <span className="font-medium mr-2">Node Size:</span>
          Stake Amount
        </div>
        <div className="text-sm">
          <span className="font-medium mr-2">Node Color:</span>
          <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-1"></span> Low Privacy,
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mx-1"></span> Medium,
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mx-1"></span> High,
          <span className="inline-block w-3 h-3 rounded-full bg-red-400 mx-1"></span> Critical
        </div>
        <div className="text-sm">
          <span className="font-medium mr-2">Edge Color:</span>
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span> Collaboration,
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mx-1"></span> Dependency,
          <span className="inline-block w-3 h-3 rounded-full bg-pink-500 mx-1"></span> Competition
        </div>
      </div>

      {/* SVG for graph */}
      <div className="bg-gray-50 rounded-lg border overflow-hidden relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="block"
          style={{ backgroundColor: '#f9fafb' }}
        />

        {/* Tooltip for selected node */}
        {selectedNode && (
          <div 
            className="absolute bg-white p-3 shadow-lg rounded-md border text-sm z-10 max-w-xs"
            style={{ 
              left: tooltipPosition.x + 10, 
              top: tooltipPosition.y + 10,
              pointerEvents: 'none' 
            }}
          >
            <h3 className="font-bold">{selectedNode.name}</h3>
            <p className="text-gray-600 text-xs mt-1">{selectedNode.description}</p>
            <div className="mt-1">
              <span className="font-medium">Stake:</span> ${selectedNode.stake.toLocaleString()}
            </div>
            <div className="mt-1">
              <span className="font-medium">Privacy Level:</span>{' '}
              {selectedNode.privacy_level}
            </div>
          </div>
        )}

        {/* Tooltip for selected link */}
        {selectedLink && (
          <div 
            className="absolute bg-white p-3 shadow-lg rounded-md border text-sm z-10 max-w-xs"
            style={{ 
              left: tooltipPosition.x + 10, 
              top: tooltipPosition.y + 10,
              pointerEvents: 'none' 
            }}
          >
            <h3 className="font-bold">{selectedLink.description}</h3>
            <div className="mt-1">
              <span className="font-medium">Type:</span> {selectedLink.type}
            </div>
            <div className="mt-1">
              <span className="font-medium">Strength:</span>{' '}
              {selectedLink.strength.toFixed(2)}
            </div>
            <div className="mt-1">
              <span className="font-medium">Queries:</span>{' '}
              {selectedLink.queries_processed.toLocaleString()}
            </div>
            <div className="mt-1">
              <span className="font-medium">Success Rate:</span>{' '}
              {(selectedLink.success_rate * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
      
      {isEditModalOpen && <EditModal />}
    </div>
  );
} 