# File Upload & Knowledge Graph Processing Feature

This feature allows users to upload markdown and text files that are automatically processed into a knowledge graph and stored on Filecoin.

## Features

- **File Upload**: Support for `.md`, `.txt`, and `.mdx` files (max 10MB)
- **Automatic Processing**: Files are processed through a 4-step pipeline:
  1. Upload to Filecoin Synapse storage
  2. Extract entities and relationships using AI
  3. Generate Cypher queries for Memgraph
  4. Store knowledge graph in Memgraph database
- **Progress Tracking**: Real-time progress indicators with step-by-step status
- **File Chunking**: Large files are automatically chunked for efficient upload
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Components

### FileUploadDialog
- Modal dialog for file upload
- Drag-and-drop support
- Progress tracking with visual indicators
- Step-by-step status display
- Processing summary with statistics

### API Endpoints

#### `/api/upload-and-process`
- Handles file upload and processing
- Validates file type and size
- Processes files through the complete pipeline
- Returns detailed results and statistics

#### `/api/upload-status`
- Tracks upload progress (for future real-time updates)
- Stores upload status in memory
- Automatic cleanup of old uploads

## Configuration

Required environment variables:

```env
# Synapse Configuration
SYNAPSE_PRIVATE_KEY=your_private_key
SYNAPSE_DATASET_ID=your_dataset_id

# Memgraph Configuration
MEMGRAPH_URL=bolt://localhost:7687

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Navigate to the Stored Data page
2. Click the "Upload File" button
3. Select or drag-and-drop a markdown/text file
4. Monitor the processing progress
5. View the processing summary upon completion

## Processing Pipeline

1. **Upload to Filecoin**: File is uploaded to Synapse storage with metadata
2. **AI Extraction**: GPT-4 extracts entities and relationships from content
3. **Query Generation**: AI generates Cypher queries for Memgraph
4. **Database Storage**: Queries are executed to create the knowledge graph

## File Chunking

Files larger than 32MB are automatically split into chunks:
- Each chunk is uploaded separately
- Metadata includes chunk information for reconstruction
- Original file hash is preserved for integrity

## Error Handling

- File type validation
- File size limits
- Network error handling
- AI processing error recovery
- Database connection error handling
