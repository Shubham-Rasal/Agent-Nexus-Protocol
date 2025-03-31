'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  GitGraph, 
  Settings, 
  ChevronRight 
} from 'lucide-react';

interface LeadflowLayoutProps {
  children: ReactNode;
}

export default function LeadflowLayout({ children }: LeadflowLayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    { 
      name: 'Workflow Builder', 
      href: '/leadflow', 
      icon: GitGraph, 
      active: pathname === '/leadflow'
    },
    { 
      name: 'Agent Manager', 
      href: '/leadflow/agents', 
      icon: BrainCircuit, 
      active: pathname === '/leadflow/agents'
    },
    { 
      name: 'Tool Builder', 
      href: '/leadflow/tools', 
      icon: Settings, 
      active: pathname === '/leadflow/tools'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-lg font-bold text-purple-600 flex items-center">
                  <BrainCircuit className="h-6 w-6 mr-2" />
                  ANP
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      item.active
                        ? 'border-purple-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-700">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              <Link href="/leadflow" className="hover:text-gray-700">
                LeadFlow
              </Link>
            </li>
            {pathname !== '/leadflow' && (
              <>
                <li>
                  <ChevronRight className="h-4 w-4" />
                </li>
                <li className="font-medium text-gray-700">
                  {pathname === '/leadflow/agents' ? 'Agent Manager' : 
                   pathname === '/leadflow/tools' ? 'Tool Builder' : 
                   'Workflow Details'}
                </li>
              </>
            )}
          </ol>
        </nav>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4">
        {children}
      </main>
    </div>
  );
} 