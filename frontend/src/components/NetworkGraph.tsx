'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import agentsData from '@/app/agents.json';
import relationshipsData from '@/app/relationships.json';

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
}

export default function NetworkGraph({ width, height }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [graphFilter, setGraphFilter] = useState<{
    relationshipType: string;
    minStrength: number;
  }>({
    relationshipType: 'all',
    minStrength: 0.7,
  });

  useEffect(() => {
    if (!svgRef.current) return;

    // Map agents data to nodes
    const agents = agentsData.agents as Agent[];
    const relationships = relationshipsData.relationships as Relationship[];

    // Create graph data
    const graphData: GraphData = {
      nodes: agents.map((agent) => ({
        ...agent,
        radius: Math.sqrt(agent.stake) / 10 + 10, // Scale node size based on stake
      })),
      links: relationships
        .filter(
          (rel) =>
            (graphFilter.relationshipType === 'all' ||
              rel.type === graphFilter.relationshipType) &&
            rel.strength >= graphFilter.minStrength
        )
        .map((rel) => ({
          ...rel,
          source: rel.source,
          target: rel.target,
        })),
    };

    createForceGraph(graphData);
  }, [graphFilter, width, height]);

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
  const handleRelationshipTypeChange = (
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

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Relationship Type
          </label>
          <select
            className="border rounded-md px-3 py-2"
            value={graphFilter.relationshipType}
            onChange={handleRelationshipTypeChange}
          >
            <option value="all">All Types</option>
            <option value="collaboration">Collaboration</option>
            <option value="dependency">Dependency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Min Strength: {graphFilter.minStrength.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={graphFilter.minStrength}
            onChange={handleStrengthChange}
            className="w-48"
          />
        </div>
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
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mx-1"></span> Dependency
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
    </div>
  );
} 