import Link from 'next/link';
import AgentCreationFeature from '@/components/AgentCreationFeature';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BrainCircuit, 
  Network, 
  Router, 
  MessageCircle, 
  ChevronRight, 
  ArrowRightCircle,
  ArrowRight,
  BarChart4,
  ArrowUpRight
} from 'lucide-react';
import Image from 'next/image';

// Import relationships data
import relationshipsData from './relationships.json';

export default function Home() {
  // Sort relationships by strength for display
  const sortedRelationships = [...relationshipsData.relationships].sort((a, b) => b.strength - a.strength).slice(0, 5);
  
  // Get unique agent names for the agent cards
  const uniqueAgents = Array.from(
    new Set(
      relationshipsData.relationships.flatMap(rel => [rel.source, rel.target])
    )
  ).filter(agent => agent !== "general_purpose");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-8 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2 max-w-[800px]">
              <Badge className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                 The Intelligent Multi-Agent Orchestration Platform
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Agent Nexus Protocol
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-lg mt-3">
                Connect specialized AI agents that work together to solve complex problems through collaborative intelligence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-800">
                <Link href="/chat">Experience Multi-Agent Chat</Link>
              </Button>
              <Button variant="outline" size="lg">
                <Link href="/agents">Explore Agent Directory</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full py-10 md:py-16 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="space-y-2 max-w-[600px] mb-10">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">Key Capabilities</h2>
              <p className="text-gray-500 md:text-base">
                Discover how Agent Nexus Protocol revolutionizes AI workflows
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Multi-Agent Chat Feature */}
              <Card className="hover:shadow-md transition-all border border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mb-3 mx-auto">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Multi-Agent Chat</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Engage with multiple specialized AI agents collaborating in real-time to solve your complex problems.
                  </p>
                  <Link href="/chat" className="text-purple-600 inline-flex items-center text-sm hover:underline">
                    Try it now <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              {/* Intelligent Task Routing Feature */}
              <Card className="hover:shadow-md transition-all border border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-3 mx-auto">
                    <Router className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Intelligent Task Routing</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Smart delegation ensures each task is handled by the most capable agent for optimal results.
                  </p>
                  <Link href="/agents" className="text-blue-600 inline-flex items-center text-sm hover:underline">
                    Explore agents <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              {/* Agent Network Feature */}
              <Card className="hover:shadow-md transition-all border border-gray-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-3 mx-auto">
                    <Network className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Agent Network</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Visualize and customize how your AI agents interconnect to create powerful workflow systems.
                  </p>
                  <Link href="/network" className="text-green-600 inline-flex items-center text-sm hover:underline">
                    See network <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Nexus Protocol Description Section */}
      <section className="w-full py-16 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center">
            <div className="space-y-4 max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-slate-800">Agent Nexus Protocol</h2>
              <p className="text-slate-600">
                The Agent Nexus Protocol establishes standardized communication channels between specialized AI agents, enabling them to collaborate effectively on complex tasks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                    <BrainCircuit className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">Semantic Routing</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Intelligently directs queries to the most capable agent based on expertise and context.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <ArrowRightCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">Chain of Thought Sharing</h3>
                  <p className="text-sm text-slate-600 text-center">
                    Agents can share their reasoning process, enabling transparent collaboration.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                    <Network className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-slate-800">Decentralized Knowledge</h3>
                  <p className="text-sm text-slate-600 text-center">
                    A distributed system where each agent maintains specialized knowledge while contributing to a collective intelligence.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" size="sm">
                  <Link href="/network" className="flex items-center">
                    Network <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Task Router & Agent Relationships Visualization */}
      <section className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center">
            <div className="space-y-2 max-w-[700px] mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">Task Router in Action</h2>
              <p className="text-gray-600">
                See how our intelligent task router orchestrates work between specialized agents to solve complex business problems
              </p>
            </div>

            {/* Agent Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {uniqueAgents.map((agent, index) => (
                <div 
                  key={agent} 
                  className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index % 4 === 0 ? 'bg-purple-100 text-purple-600' : 
                    index % 4 === 1 ? 'bg-blue-100 text-blue-600' : 
                    index % 4 === 2 ? 'bg-green-100 text-green-600' : 
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {index % 4 === 0 ? <BrainCircuit className="h-5 w-5" /> : 
                     index % 4 === 1 ? <MessageCircle className="h-5 w-5" /> : 
                     index % 4 === 2 ? <BarChart4 className="h-5 w-5" /> : 
                     <Router className="h-5 w-5" />}
                  </div>
                  <h3 className="font-medium mt-2 text-slate-800 capitalize">
                    {agent.replace(/-/g, ' ')}
                  </h3>
                </div>
              ))}
            </div>

            {/* Top Relationships List */}
            <div className="w-full max-w-3xl">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Top Agent Relationships</h3>
              
              <div className="space-y-3">
                {sortedRelationships.map((rel, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="font-medium text-slate-800 capitalize">{rel.source.replace(/-/g, ' ')}</div>
                        <ArrowRight className="mx-2 h-4 w-4 text-slate-400" />
                        <div className="font-medium text-slate-800 capitalize">{rel.target.replace(/-/g, ' ')}</div>
                      </div>
                      <Badge className={
                        rel.strength > 0.8 ? "bg-green-100 text-green-800" : 
                        rel.strength > 0.7 ? "bg-blue-100 text-blue-800" : 
                        "bg-orange-100 text-orange-800"
                      }>
                        {Math.round(rel.strength * 100)}% Strength
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{rel.description}</p>
                    <div className="flex justify-between mt-3 text-xs text-slate-500">
                      <span>{rel.queries_processed.toLocaleString()} queries processed</span>
                      <span>{Math.round(rel.success_rate * 100)}% success rate</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <Button variant="outline">
                  <Link href="/network" className="flex items-center">
                    View Complete Network <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="space-y-2 max-w-[600px] mb-10">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">Powered By</h2>
              <p className="text-gray-500 md:text-base">
                Our trusted partners who make Agent Nexus Protocol possible
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* OpenAI */}
              <div className="flex items-center justify-center">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg"
                  alt="OpenAI Logo"
                  width={260}
                  height={80}
                  className="dark:invert"
                />
              </div>
              <div className="text-center mt-4">
                <Link href="https://openai.com" target="_blank" className="text-purple-600 inline-flex items-center text-sm hover:underline">
                  Learn more about OpenAI
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {/* Storacha */}
              <Card className="hover:shadow-md transition-all border border-gray-100">
                <CardHeader className="pb-2 flex flex-col items-center">
                  <div className="h-12 mb-2 flex items-center justify-center">
                    <img 
                      src="https://console.storacha.network/storacha-logo.svg" 
                      alt="Storacha Logo" 
                      className="max-h-10 w-auto"
                    />
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    For chat, agent CoT storage and multi-agent collaboration
                  </p>
                  <Link href="https://console.storacha.network/" target="_blank" className="text-blue-600 inline-flex items-center text-sm hover:underline">
                    Learn more <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>

              {/* Akave */}
              <Card className="hover:shadow-md transition-all border border-gray-100">
                <CardHeader className="pb-2 flex flex-col items-center">
                  <div className="h-12 mb-2 flex items-center justify-center">
                    <img 
                      src="https://docs.akave.ai/~gitbook/image?url=https%3A%2F%2F594872226-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FTBZ1Ifp7uxt1BgTdXKIM%252Fsites%252Fsite_xssfp%252Ficon%252FUaLr5SOAddNDtHFmF7no%252FIcon_Duo_BLUE_1%252B4.png%3Falt%3Dmedia%26token%3D47f03ba5-98a0-4a71-8d69-25068348e3a7&width=32&dpr=4&quality=100&sign=cbdd9f6b&sv=2" 
                      alt="Akave Logo" 
                      className="max-h-10 w-auto"
                    />
                    <span className="ml-2 text-xl font-bold text-gray-800">Akave</span>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Storage tool for all agents to autonomously use
                  </p>
                  <Link href="https://docs.akave.ai/" target="_blank" className="text-green-600 inline-flex items-center text-sm hover:underline">
                    Learn more <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
