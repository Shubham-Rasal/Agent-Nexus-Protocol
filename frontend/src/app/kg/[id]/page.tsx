"use client"

import { useParams } from "next/navigation"
import KnowledgeGraph from "@/components/KnowledgeGraph"

export default function KnowledgeGraphPage() {
  const params = useParams()
  const rootCID = params.id as string

  return (
    <div className="pt-12 h-fit">
      <KnowledgeGraph rootCID={rootCID} />
    </div>
  )
}