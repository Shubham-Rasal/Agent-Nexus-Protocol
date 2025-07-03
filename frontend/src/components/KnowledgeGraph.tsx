"use client";
import React, { useRef, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { GraphData, GraphNode } from "../types/graphTypes";


type Props = {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
};

const KnowledgeGraph: React.FC<Props> = ({ data, width = 900, height = 700, onNodeClick }) => {
  const fgRef = useRef<any>(null);
   
  // Center the graph and fit to canvas on mount/data change
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('center').strength(2); // Strong center force
      fgRef.current.zoomToFit(400);
    }
  }, [data, width, height]);

  return (
    <ForceGraph3D
      ref={fgRef}
      width={width}
      height={height}   
      graphData={data}
      nodeAutoColorBy="user"
      
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      nodeLabel={(node) => (node as GraphNode).label || (node as GraphNode).id}
      onNodeClick={(node) => {
        console.log(node);
      }}
    />
  );
};

export default KnowledgeGraph; 