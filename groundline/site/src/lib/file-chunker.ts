import crypto from 'crypto';

export interface ChunkMetadata {
  originalFileName: string;
  originalFileSize: number;
  originalFileHash?: string;
  totalChunks: number;
}

export interface FileChunk {
  index: number;
  totalChunks: number;
  chunkData: Buffer;
  chunkHash: string;
  originalFileName: string;
  originalFileHash?: string;
}

export class FileChunker {
  private static readonly CHUNK_SIZE = 32 * 1024 * 1024; // 32MB chunks
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max

  static needsChunking(fileSize: number): boolean {
    return fileSize > this.CHUNK_SIZE;
  }

  static async splitFile(fileBuffer: Buffer, fileName: string): Promise<{
    chunks: FileChunk[];
    metadata: ChunkMetadata;
  }> {
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const originalFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const totalChunks = Math.ceil(fileBuffer.length / this.CHUNK_SIZE);
    const chunks: FileChunk[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, fileBuffer.length);
      const chunkData = fileBuffer.slice(start, end);
      const chunkHash = crypto.createHash('sha256').update(chunkData).digest('hex');

      chunks.push({
        index: i,
        totalChunks,
        chunkData,
        chunkHash,
        originalFileName: fileName,
        originalFileHash: originalFileHash
      });
    }

    const metadata: ChunkMetadata = {
      originalFileName: fileName,
      originalFileSize: fileBuffer.length,
      originalFileHash: originalFileHash,
      totalChunks
    };

    return { chunks, metadata };
  }

  static async reconstructFile(chunks: FileChunk[]): Promise<Buffer> {
    // Sort chunks by index to ensure correct order
    const sortedChunks = chunks.sort((a, b) => a.index - b.index);
    
    // Verify we have all chunks
    const expectedChunks = sortedChunks[0]?.totalChunks || 0;
    if (sortedChunks.length !== expectedChunks) {
      throw new Error(`Missing chunks. Expected ${expectedChunks}, got ${sortedChunks.length}`);
    }

    // Combine all chunk data
    const totalSize = sortedChunks.reduce((sum, chunk) => sum + chunk.chunkData.length, 0);
    const reconstructedBuffer = Buffer.alloc(totalSize);
    
    let offset = 0;
    for (const chunk of sortedChunks) {
      chunk.chunkData.copy(reconstructedBuffer, offset);
      offset += chunk.chunkData.length;
    }

    return reconstructedBuffer;
  }
}
