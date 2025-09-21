"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Code, 
  FileCode, 
  Globe, 
  Eye, 
  EyeOff,
  Copy,
  Download
} from "lucide-react"
import { ContentType } from "@/lib/contentTypeDetection"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface ContentRendererProps {
  contentType: ContentType
  content: string
  parsedContent?: any
  isGraphData?: boolean
}

export function ContentRenderer({ 
  contentType, 
  content, 
  parsedContent, 
  isGraphData = false 
}: ContentRendererProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState(false)

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'json':
        return <Code className="w-5 h-5" />
      case 'markdown':
        return <FileText className="w-5 h-5" />
      case 'html':
        return <Globe className="w-5 h-5" />
      case 'text':
        return <FileText className="w-5 h-5" />
      default:
        return <FileCode className="w-5 h-5" />
    }
  }

  const getContentTypeColor = (type: ContentType) => {
    switch (type) {
      case 'json':
        return 'bg-blue-100 text-blue-800'
      case 'markdown':
        return 'bg-green-100 text-green-800'
      case 'html':
        return 'bg-orange-100 text-orange-800'
      case 'text':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Content copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy content')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content.${contentType === 'json' ? 'json' : contentType === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Content downloaded')
  }

  const renderContent = () => {
    if (showRaw) {
      return (
        <Textarea
          value={content}
          readOnly
          className="min-h-[400px] font-mono text-sm"
        />
      )
    }

    switch (contentType) {
      case 'json':
        return (
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
            {JSON.stringify(parsedContent || content, null, 2)}
          </pre>
        )
      
      case 'markdown':
        return (
          <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  return !isInline ? (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  )
                },
                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-slate-900 mb-3 mt-5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-4">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-semibold text-slate-900 mb-2 mt-3">{children}</h4>,
                p: ({ children }) => <p className="text-slate-700 mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-700">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-3">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    className="text-blue-600 hover:text-blue-800 underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-slate-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-slate-200 px-4 py-2 bg-slate-50 text-left font-semibold text-slate-900">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-slate-200 px-4 py-2 text-slate-700">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )
      
      case 'html':
        return (
          <div 
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )
      
      case 'text':
      default:
        return (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getContentIcon(contentType)}
              <div>
                <CardTitle className="text-lg">
                  Content Viewer
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getContentTypeColor(contentType)}>
                    {contentType.toUpperCase()}
                  </Badge>
                  {isGraphData && (
                    <Badge variant="outline" className="text-xs">
                      Graph Data
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showRaw ? 'Formatted' : 'Raw'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={copied}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {contentType === 'json' && parsedContent && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Parsed JSON:</strong> This content has been parsed and can be viewed in both formatted and raw modes.
              </div>
            )}
            
            {contentType === 'markdown' && (
              <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                <strong>Markdown Content:</strong> This content is being rendered as Markdown. Use the "Raw" button to see the original markdown syntax.
              </div>
            )}
            
            {contentType === 'html' && (
              <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                <strong>HTML Content:</strong> This content is being rendered as HTML. Use the "Raw" button to see the original HTML source.
              </div>
            )}
            
            {contentType === 'text' && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Text Content:</strong> This is plain text content. Use the "Raw" button to see the content in a textarea for editing.
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
