'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, GitBranch, FileEdit, Settings, Home, Wrench, User, Users, SplitSquareVertical, UserCheck, ChevronDown, GitGraph, Server} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink 
                href="/" 
                icon={""}
                isActive={pathname === '/'}
              >
              <span className="text-purple-600 font-bold text-lg">ANP</span>
              </NavLink>
              <NavLink 
                href="/chat" 
                icon={<MessageSquare className="h-5 w-5" />}
                isActive={pathname === '/chat'}
              >
                Chat
              </NavLink>
              <NavLink 
                href="/mcp" 
                icon={<Server className="w-4 h-4" />}
                isActive={pathname === '/mcp'}
              >
                MCP
              </NavLink>
              <NavLink 
                href="/agents" 
                icon={<User className="h-5 w-5" />}
                isActive={pathname === '/agents'}
              >
                Agents
              </NavLink>
              {/* <NavLink 
                href="/mcp" 
                icon={<Server className="h-5 w-5" />}
                isActive={pathname === '/mcp'}
              >
                MCP
              </NavLink> */}
              <NavLink 
                href="/network" 
                icon={<Users className="h-5 w-5" />}
                isActive={pathname === '/network'}
              >
                Network
              </NavLink>
              <NavLink 
                href="/kg" 
                icon={<GitGraph className="h-5 w-5" />}
                isActive={pathname === '/kg'}
              >
                Knowledge Graph
              </NavLink>
              
            </div>
          </div>  
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="grid grid-cols-7 h-16">
          <MobileNavLink 
            href="/" 
            icon={<Home className="h-5 w-5" />}
            isActive={pathname === '/'}
          >
            Home
          </MobileNavLink>
          <MobileNavLink 
            href="/chat" 
            icon={<MessageSquare className="h-5 w-5" />}
            isActive={pathname === '/chat'}
          >
            Chat
          </MobileNavLink>
          <MobileNavLink 
            href="/tools" 
            icon={<Wrench className="h-5 w-5" />}
            isActive={pathname === '/tools'}
          >
            Tools
          </MobileNavLink>
          <MobileNavLink 
            href="/agents" 
            icon={<User className="h-5 w-5" />}
            isActive={pathname.startsWith('/agents')}
          >
            Agents
          </MobileNavLink>
          <MobileNavLink 
            href="/mcp" 
            icon={<Server className="h-5 w-5" />}
            isActive={pathname === '/mcp'}
          >
            MCP
          </MobileNavLink>
          <MobileNavLink 
            href="/leadgen" 
            icon={<UserCheck className="h-5 w-5" />}
            isActive={pathname === '/leadgen'}
          >
            Lead Gen
          </MobileNavLink>
          <MobileNavLink 
            href="/task-router" 
            icon={<SplitSquareVertical className="h-5 w-5" />}
            isActive={pathname === '/task-router'}
          >
            Tasks
          </MobileNavLink>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  isActive: boolean;
}

function NavLink({ href, children, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive
          ? 'border-purple-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex flex-col items-center justify-center text-xs font-medium ${
        isActive ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="mt-1">{children}</span>
    </Link>
  );
} 