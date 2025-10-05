import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for upload status (in production, use Redis or database)
const uploadStatuses = new Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  steps: Array<{
    step: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    message?: string;
    data?: any;
  }>;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('id');

  if (!uploadId) {
    return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
  }

  const status = uploadStatuses.get(uploadId);
  
  if (!status) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const { uploadId, step, status, message, data, error } = await request.json();

  if (!uploadId) {
    return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
  }

  let uploadStatus = uploadStatuses.get(uploadId);
  
  if (!uploadStatus) {
    uploadStatus = {
      id: uploadId,
      status: 'pending',
      progress: 0,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    uploadStatuses.set(uploadId, uploadStatus);
  }

  // Update step status
  if (step) {
    const stepIndex = uploadStatus.steps.findIndex(s => s.step === step);
    if (stepIndex >= 0) {
      uploadStatus.steps[stepIndex] = {
        ...uploadStatus.steps[stepIndex],
        status,
        message,
        data
      };
    } else {
      uploadStatus.steps.push({
        step,
        status,
        message,
        data
      });
    }
  }

  // Update overall status
  if (status) {
    uploadStatus.status = status;
  }

  // Calculate progress
  const completedSteps = uploadStatus.steps.filter(s => s.status === 'completed').length;
  const totalSteps = uploadStatus.steps.length;
  uploadStatus.progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Set error if provided
  if (error) {
    uploadStatus.error = error;
    uploadStatus.status = 'error';
  }

  uploadStatus.updatedAt = new Date();
  uploadStatuses.set(uploadId, uploadStatus);

  return NextResponse.json({ success: true });
}

// Cleanup old uploads (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [id, status] of uploadStatuses.entries()) {
    if (status.updatedAt < oneHourAgo) {
      uploadStatuses.delete(id);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes
