'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Define type for storage providers
type StorageProvider = 'storache' | 'akave' | 'recall';

export default function CreateAgentForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [storageProvider, setStorageProvider] = useState<StorageProvider>('storache');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array
      const fileArray = Array.from(e.target.files);
      
      // Check for valid file types
      const validTypes = ['application/pdf', 'text/markdown', 'text/plain'];
      const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        setError('Only PDF, Markdown, and TXT files are supported');
        return;
      }
      
      setFiles(prev => [...prev, ...fileArray]);
      setError('');
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim() || !description.trim() || !systemPrompt.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a unique ID for the agent
      const id = `agent_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
      
      // Process files - in a real app, you would upload these to your storage provider
      const knowledgeSources = files.map(file => {
        return `${storageProvider}:${file.name.replace(/\.[^/.]+$/, "")}`;
      });
      
      // Create the new agent object
      const newAgent = {
        id,
        name,
        description,
        system_prompt: systemPrompt,
        knowledge_sources: knowledgeSources.length ? knowledgeSources : [`${storageProvider}:default_knowledge`],
        tools: ["doc_analyzer", "text_extractor"], // Default tools
        stake: 100, // Default stake
        privacy_level: "medium" // Default privacy level
      };
      
      // Save to local storage
      // Get existing custom agents or initialize empty array
      const existingAgents = JSON.parse(localStorage.getItem('customAgents') || '[]');
      
      // Add new agent to array
      const updatedAgents = [...existingAgents, newAgent];
      
      // Save back to local storage
      localStorage.setItem('customAgents', JSON.stringify(updatedAgents));
      
      console.log('Agent created and saved to localStorage:', newAgent);
      
      // Show success message and redirect (simulate a bit of delay for UX)
      setTimeout(() => {
        router.push('/agents');
      }, 1000);
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError('Failed to create agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create Custom AI Agent</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Name field */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Agent Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="w-full p-2 border rounded-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Legal Assistant, Data Analyst"
            required
          />
        </div>
        
        {/* Description field */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            id="description"
            type="text"
            className="w-full p-2 border rounded-lg"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what your agent does"
            required
          />
        </div>
        
        {/* System Prompt field */}
        <div className="mb-4">
          <label htmlFor="systemPrompt" className="block text-sm font-medium mb-1">
            System Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            id="systemPrompt"
            className="w-full p-2 border rounded-lg min-h-32"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Detailed instructions for your agent. E.g., 'You are a legal assistant specialized in contract review...'"
            required
          />
        </div>
        
        {/* Storage Provider field */}
        <div className="mb-4">
          <label htmlFor="storageProvider" className="block text-sm font-medium mb-1">
            Storage Provider
          </label>
          <select
            id="storageProvider"
            className="w-full p-2 border rounded-lg"
            value={storageProvider}
            onChange={(e) => setStorageProvider(e.target.value as StorageProvider)}
          >
            <option value="storache">Storache (Versioned Private Storage)</option>
            <option value="akave">Akave (Fast Cached Access)</option>
            <option value="recall">Recall (Immutable Knowledge Graph)</option>
          </select>
        </div>
        
        {/* Knowledge Base files */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Knowledge Base
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Upload PDFs, Markdown, or TXT files that will serve as your agent's knowledge base
          </p>
          
          {/* File upload button */}
          <div className="flex items-center gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Select Files
            </Button>
            <span className="text-sm text-gray-500">
              Supported: PDF, Markdown, TXT
            </span>
          </div>
          
          {/* File list */}
          {files.length > 0 && (
            <div className="border rounded-lg p-3 mb-3">
              <p className="text-sm font-medium mb-2">Selected Files:</p>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
} 