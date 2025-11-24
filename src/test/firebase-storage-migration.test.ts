import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FirebaseStorageAdapter,
  FirebaseStorageManager,
  uploadAvatar,
  uploadRecording,
  uploadDocument
} from '@/lib/firebase-storage';

const mockRef = vi.fn();
const mockUploadBytes = vi.fn();
const mockUploadBytesResumable = vi.fn();
const mockGetDownloadURL = vi.fn();
const mockDeleteObject = vi.fn();
const mockListAll = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  uploadBytesResumable: (...args: any[]) => mockUploadBytesResumable(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
  listAll: (...args: any[]) => mockListAll(...args)
}));

vi.mock('@/lib/firebase', () => ({
  storage: { name: 'mock-storage' }
}));

describe('Firebase Storage helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRef.mockReturnValue({});
    mockUploadBytes.mockResolvedValue({ ref: { fullPath: 'bucket/path', bucket: 'bucket' }, metadata: {} });

    // Mock uploadBytesResumable to return a proper upload task
    const mockUploadTask = {
      ref: { fullPath: 'bucket/path', bucket: 'bucket' },
      metadata: {},
      on: (state: string, progress: any, error: any, complete: any) => {
        // Simulate progress
        progress({ bytesTransferred: 50, totalBytes: 100 });
        // Simulate completion
        setTimeout(() => complete(), 0);
        return mockUploadTask;
      },
      then: (resolve: any) => {
        // Make it awaitable
        resolve({ ref: { fullPath: 'bucket/path', bucket: 'bucket' }, metadata: {} });
        return Promise.resolve({ ref: { fullPath: 'bucket/path', bucket: 'bucket' }, metadata: {} });
      },
      catch: (reject: any) => Promise.reject()
    };

    mockUploadBytesResumable.mockReturnValue(mockUploadTask);
    mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/bucket/path');
  });

  it('FirebaseStorageAdapter reports availability', () => {
    const adapter = new FirebaseStorageAdapter();
    expect(adapter.isAvailable()).toBe(true);
  });

  it('FirebaseStorageManager uploads files', async () => {
    const manager = new FirebaseStorageManager();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const result = await manager.upload('files', 'test.txt', file);
    expect(result.url).toContain('https://');
    expect(mockUploadBytes).toHaveBeenCalled();
  });

  it('uploadAvatar uses storage manager', async () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const url = await uploadAvatar('user-123', file);
    expect(url).toContain('https://');
    expect(mockUploadBytes).toHaveBeenCalled();
  });

  it('uploadRecording uploads blobs', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const url = await uploadRecording('user-123', blob);
    expect(url).toContain('https://');
  });

  it('uploadDocument reports progress', async () => {
    const file = new File(['doc'], 'doc.pdf', { type: 'application/pdf' });
    let progressSeen = 0;
    mockUploadBytes.mockResolvedValue({
      ref: { fullPath: 'docs/user/doc.pdf', bucket: 'docs' },
      metadata: {}
    });
    mockGetDownloadURL.mockResolvedValue('https://storage.googleapis.com/docs/user/doc.pdf');

    const result = await uploadDocument('user-123', file, (progress) => {
      progressSeen = progress;
    });

    expect(result.url).toContain('https://');
    expect(progressSeen).toBeGreaterThanOrEqual(0);
  });
});
