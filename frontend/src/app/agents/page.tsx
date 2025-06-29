import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents - ANP",
  description: "AI Network Protocol - Agents",
};

export default function AgentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <h1 className="text-4xl font-bold mb-4">Agents</h1>
      <p className="text-xl text-gray-600">Coming Soon</p>
      <p className="mt-4 text-gray-500">Stay tuned for exciting updates about our AI agents!</p>
    </div>
  );
} 