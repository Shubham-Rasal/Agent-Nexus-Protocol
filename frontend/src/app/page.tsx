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
  ArrowRightCircle
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-8 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2 max-w-[800px]">
              <Badge className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                Agent Nexus Protocol
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                The Intelligent Multi-Agent Orchestration Platform
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

      {/* Create Agent CTA Section */}
      <section className="w-full py-16 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 space-y-3">
              <h2 className="text-2xl font-bold text-slate-800">Ready to build your first agent?</h2>
              <p className="text-slate-600 text-base">
                Start building your own custom agent network today and transform how you interact with AI.
              </p>
            </div>
            <div className="md:w-1/2">
              <AgentCreationFeature />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
