'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Code, Copy, Check } from 'lucide-react';

interface N8NDemoProps {
  workflow?: string;
  workflowUrl?: string;
  frame?: boolean;
  src?: string;
  collapseOnMobile?: boolean;
  clickToInteract?: boolean;
  hideCanvasErrors?: boolean;
  disableInteractivity?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

interface WorkflowData {
  nodes: any[];
  connections?: any;
}

const N8NDemo: React.FC<N8NDemoProps> = ({
  workflow = '{}',
  workflowUrl,
  frame = false,
  src = 'https://n8n-preview-service.internal.n8n.cloud/workflows/demo',
  collapseOnMobile = true,
  clickToInteract = false,
  hideCanvasErrors = false,
  disableInteractivity = false,
  theme,
  className = ''
}) => {
  const [showCode, setShowCode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [insideIframe, setInsideIframe] = useState(false);
  const [copyText, setCopyText] = useState('Copy');
  const [isMobileView, setIsMobileView] = useState(false);
  const [error, setError] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [n8nReady, setN8nReady] = useState(false);
  const [iframeVisible, setIframeVisible] = useState(false);
  const [loadedWorkflow, setLoadedWorkflow] = useState<string>(workflow);
  const [loading, setLoading] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollPosition = useRef({ x: 0, y: 0 });

  // Check if string is valid JSON
  const isJson = useCallback((str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Fetch workflow from URL
  const fetchWorkflowFromUrl = useCallback(async (url: string) => {
    try {
      setLoading(true);
      setError(false);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`);
      }
      
      const workflowData = await response.text();
      
      // Validate it's valid JSON
      if (!isJson(workflowData)) {
        throw new Error('Invalid JSON format');
      }
      
      setLoadedWorkflow(workflowData);
      
      // If n8n is ready and iframe is visible, load the workflow
      if (n8nReady && iframeVisible) {
        loadWorkflow();
      }
    } catch (err) {
      console.error('Failed to fetch workflow:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isJson, n8nReady, iframeVisible]);

  // Handle messages from iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    const iframe = iframeRef.current;
    if (!iframe || event.source !== iframe.contentWindow) return;

    if (isJson(event.data)) {
      const data = JSON.parse(event.data);
      
      switch (data.command) {
        case 'n8nReady':
          setN8nReady(true);
          if (iframeVisible) {
            loadWorkflow();
          }
          break;
        case 'openNDV':
          setFullscreen(true);
          break;
        case 'closeNDV':
          setFullscreen(false);
          break;
        case 'error':
          setError(true);
          setShowPreview(false);
          break;
      }
    }
  }, [iframeVisible, isJson]);

  // Load workflow into iframe
  const loadWorkflow = useCallback(() => {
    try {
      const workflowData: WorkflowData = JSON.parse(loadedWorkflow);
      
      if (!workflowData || !Array.isArray(workflowData.nodes)) {
        throw new Error('Invalid workflow data');
      }

      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            command: 'openWorkflow',
            workflow: workflowData,
            hideNodeIssues: hideCanvasErrors,
          }),
          '*'
        );
      }
    } catch (err) {
      setError(true);
    }
  }, [loadedWorkflow, hideCanvasErrors]);

  // Copy workflow to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(loadedWorkflow);
      setCopyText('Copied');
      setTimeout(() => setCopyText('Copy'), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [loadedWorkflow]);

  // Handle document scroll for non-interactive mode
  const handleDocumentScroll = useCallback(() => {
    if (
      interactive &&
      insideIframe &&
      !('ontouchstart' in window || navigator.maxTouchPoints > 0)
    ) {
      window.scrollTo(scrollPosition.current.x, scrollPosition.current.y);
    }
  }, [interactive, insideIframe]);

  // Fetch workflow from URL when workflowUrl is provided
  useEffect(() => {
    if (workflowUrl) {
      fetchWorkflowFromUrl(workflowUrl);
    }
  }, [workflowUrl, fetchWorkflowFromUrl]);

  // Setup intersection observer
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(iframe);
          setIframeVisible(true);
          if (n8nReady) {
            loadWorkflow();
          }
        }
      });
    });

    observer.observe(iframe);
    return () => observer.disconnect();
  }, [n8nReady, loadWorkflow]);

  // Setup event listeners
  useEffect(() => {
    // Check mobile view
    const checkMobile = () => {
      setIsMobileView(window.matchMedia('only screen and (max-width: 760px)').matches);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Setup message listener
    window.addEventListener('message', handleMessage);
    
    // Setup scroll listener
    document.addEventListener('scroll', handleDocumentScroll);

    // Handle initial interactivity state
    if (clickToInteract || disableInteractivity) {
      setInteractive(false);
    }

    // Handle mobile collapse
    if (collapseOnMobile && window.matchMedia('only screen and (max-width: 760px)').matches) {
      setShowPreview(false);
    }

    // Decode URL encoded workflow
    try {
      if (workflow.startsWith('%7B%')) {
        workflow = decodeURIComponent(workflow);
      }
    } catch (e) {
      // Ignore decode errors
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('scroll', handleDocumentScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, [workflow, clickToInteract, disableInteractivity, collapseOnMobile, handleMessage, handleDocumentScroll]);

  const handleMouseEnter = () => {
    setInsideIframe(true);
    scrollPosition.current = { x: window.scrollX, y: window.scrollY };
  };

  const handleMouseLeave = () => {
    setInsideIframe(false);
  };

  const handleOverlayClick = () => {
    if (!disableInteractivity) {
      setInteractive(true);
    }
  };

  const toggleCode = () => setShowCode(!showCode);
  const toggleView = () => setShowPreview(true);

  const iframeUrl = theme ? `${src}?theme=${theme}` : src;
  const interactivityDisabled = disableInteractivity;
  const showFrame = frame && showPreview && !error;

  return (
    <div className={`${className}`}>
      <div
        className={`
          ${showFrame ? 'p-3 bg-gray-100 rounded-lg' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Collapsed view toggle */}
        {!showPreview && !error && (
          <div className="text-center py-4">
            <button
              onClick={toggleView}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
            >
              <ChevronDown className="w-4 h-4" />
              Show workflow
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading workflow...</p>
            </div>
          </div>
        )}

        {/* Main iframe container */}
        {showPreview && !error && !loading && (
          <div className="relative">
            {/* Overlay for interactivity control */}
            {(interactivityDisabled || !interactive) && (
              <div
                className={`
                  absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center
                  transition-opacity duration-250 hover:opacity-100 z-10
                  ${insideIframe || isMobileView ? 'opacity-0' : 'opacity-100'}
                `}
                onClick={!interactivityDisabled ? handleOverlayClick : undefined}
                style={{ pointerEvents: interactivityDisabled ? 'none' : 'auto' }}
              >
                {!interactivityDisabled && (
                  <button className="px-8 py-5 bg-orange-500 text-white font-semibold text-lg rounded-lg hover:bg-orange-600 transition-colors">
                    Click to explore
                  </button>
                )}
              </div>
            )}

            {/* Iframe */}
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className={`
                w-full border-0 bg-white
                ${fullscreen 
                  ? 'fixed inset-0 z-50 h-screen w-screen' 
                  : 'min-h-[300px] rounded-lg'
                }
                ${!interactive ? 'pointer-events-none' : ''}
              `}
              allow={interactivityDisabled ? undefined : 'clipboard-write'}
              title="n8n Workflow"
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Could not load workflow preview. You can still{' '}
            <button
              onClick={toggleCode}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              view the code
            </button>{' '}
            and paste it into n8n
          </div>
        )}

        {/* Frame tip */}
        {showFrame && (
          <div className={`text-center text-gray-500 text-sm mt-3 ${showCode ? 'mb-3' : ''}`}>
            💡 Double-click a node to see its settings, or paste{' '}
            <button
              onClick={toggleCode}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              this workflow's code
            </button>{' '}
            into n8n to import it
          </div>
        )}

        {/* Code view */}
        {showCode && (
          <div className="mt-4 relative">
            <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-3 bg-purple-100 border-b border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Code className="w-4 h-4" />
                  Workflow JSON
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  {copyText === 'Copied' ? (
                    <>
                      <Check className="w-3 h-3" />
                      {copyText}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      {copyText}
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 max-h-80 overflow-auto">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {isJson(loadedWorkflow)
                    ? JSON.stringify(JSON.parse(loadedWorkflow), undefined, 2)
                    : 'Invalid JSON'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default N8NDemo;
