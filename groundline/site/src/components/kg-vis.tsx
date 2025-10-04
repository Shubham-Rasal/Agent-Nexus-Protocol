"use client"

import { useEffect, useState } from "react"

interface Node {
  id: number
  x: number
  y: number
  verified: boolean
  pulsing: boolean
}

interface Edge {
  from: number
  to: number
  active: boolean
}

export function KnowledgeGraphViz() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 0, x: 50, y: 10, verified: false, pulsing: false },
    { id: 1, x: 20, y: 25, verified: false, pulsing: false },
    { id: 2, x: 80, y: 25, verified: false, pulsing: false },
    { id: 3, x: 35, y: 40, verified: false, pulsing: false },
    { id: 4, x: 65, y: 40, verified: false, pulsing: false },
    { id: 5, x: 15, y: 55, verified: false, pulsing: false },
    { id: 6, x: 50, y: 55, verified: false, pulsing: false },
    { id: 7, x: 85, y: 55, verified: false, pulsing: false },
    { id: 8, x: 30, y: 70, verified: false, pulsing: false },
    { id: 9, x: 70, y: 70, verified: false, pulsing: false },
    { id: 10, x: 50, y: 85, verified: false, pulsing: false },
    { id: 11, x: 10, y: 40, verified: false, pulsing: false },
    { id: 12, x: 90, y: 40, verified: false, pulsing: false },
    { id: 13, x: 40, y: 25, verified: false, pulsing: false },
    { id: 14, x: 60, y: 25, verified: false, pulsing: false },
  ])

  const [edges] = useState<Edge[]>([
    { from: 0, to: 1, active: false },
    { from: 0, to: 2, active: false },
    { from: 0, to: 13, active: false },
    { from: 0, to: 14, active: false },
    { from: 1, to: 3, active: false },
    { from: 1, to: 11, active: false },
    { from: 2, to: 4, active: false },
    { from: 2, to: 12, active: false },
    { from: 3, to: 5, active: false },
    { from: 3, to: 6, active: false },
    { from: 4, to: 6, active: false },
    { from: 4, to: 7, active: false },
    { from: 5, to: 8, active: false },
    { from: 6, to: 8, active: false },
    { from: 6, to: 9, active: false },
    { from: 6, to: 10, active: false },
    { from: 7, to: 9, active: false },
    { from: 8, to: 10, active: false },
    { from: 9, to: 10, active: false },
    { from: 11, to: 5, active: false },
    { from: 12, to: 7, active: false },
    { from: 13, to: 3, active: false },
    { from: 14, to: 4, active: false },
    { from: 1, to: 13, active: false },
    { from: 2, to: 14, active: false },
  ])

  const [activeEdges, setActiveEdges] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Verification wave animation
    const verificationInterval = setInterval(() => {
      const randomNode = Math.floor(Math.random() * nodes.length)

      setNodes((prev) =>
        prev.map((node, idx) => {
          if (idx === randomNode) {
            return { ...node, pulsing: true, verified: true }
          }
          return node
        }),
      )

      // Reset pulsing after animation
      setTimeout(() => {
        setNodes((prev) =>
          prev.map((node, idx) => {
            if (idx === randomNode) {
              return { ...node, pulsing: false }
            }
            return node
          }),
        )
      }, 600)

      // Activate connected edges
      const connectedEdgeIndices = edges
        .map((edge, idx) => (edge.from === randomNode || edge.to === randomNode ? idx : -1))
        .filter((idx) => idx !== -1)

      setActiveEdges(new Set(connectedEdgeIndices))

      setTimeout(() => {
        setActiveEdges(new Set())
      }, 600)
    }, 1200)

    return () => clearInterval(verificationInterval)
  }, [nodes.length, edges])

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes[edge.from]
          const toNode = nodes[edge.to]
          return (
            <line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className={`transition-all duration-300 ${
                activeEdges.has(idx) ? "opacity-100 stroke-[1.5]" : "opacity-20"
              }`}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Pulse ring for verification */}
            {node.pulsing && (
              <circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="animate-ping opacity-75"
              />
            )}

            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r="2.5"
              className={`transition-all duration-300 ${
                node.verified ? "fill-current opacity-100" : "fill-none stroke-current stroke-[0.5] opacity-40"
              }`}
            />

            {/* Verification checkmark */}
            {node.verified && (
              <text x={node.x} y={node.y + 1} fontSize="3" textAnchor="middle" className="fill-background font-bold">
                ✓
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
