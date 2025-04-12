import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, compileResults } from '@/features/taskRouter/taskRouterService';
import { processTask } from '@/features/taskRouter/taskExecutorService';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query } = body;

    // Validate the query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing query parameter' },
        { status: 400 }
      );
    }

    // Analyze the query and break it down into subtasks
    console.log(`Processing task routing for query: "${query}"`);
    const task = await analyzeQuery(query);
    
    // Process all subtasks
    const processedTask = await processTask(task);
    
    // Compile the final result
    const finalResult = await compileResults({}, processedTask);
    
    // Return the result
    return NextResponse.json({
      success: true,
      data: {
        taskId: processedTask.taskId,
        analysis: processedTask.analysis,
        subtasks: processedTask.subtasks,
        result: finalResult
      }
    });
  } catch (error) {
    console.error('Error in task router API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 