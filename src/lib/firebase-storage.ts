import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  FirebaseStorage,
  UploadResult,
  UploadTask,
  StorageReference
} from 'firebase/storage';
import { storage } from './firebase';

// Types for storage operations
export interface UploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (url: string) => void;
}

export interface StorageError extends Error {
  code: string;
  serverResponse?: string;
}

export interface FileUploadResult {
  url: string;
  fullPath: string;
  bucket: string;
  metadata?: any;
}

// Storage adapter class that provides Supabase-like API for Firebase Storage
export class FirebaseStorageAdapter {
  private storage: FirebaseStorage | null;

  constructor() {
    this.storage = storage;
  }

  /**
   * Check if Firebase Storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }

  /**
   * Upload a file to Firebase Storage with progress tracking
   * Provides backward compatibility with Supabase storage API
   */
  async upload(
    bucketName: string,
    filePath: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<FileUploadResult> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const storageRef = ref(this.storage, `${bucketName}/${filePath}`);

      // Set metadata if provided
      const metadata: any = {};
      if (options.contentType) {
        metadata.contentType = options.contentType;
      }
      if (options.customMetadata) {
        metadata.customMetadata = options.customMetadata;
      }

      let uploadResult: UploadResult;

      // Use resumable upload if progress callback is provided
      if (options.onProgress) {
        const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadResult = await new Promise<UploadResult>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              options.onProgress?.(progress);
            },
            (error) => {
              options.onError?.(error);
              reject(error);
            },
            async () => {
              try {
                const result = await uploadTask;
                resolve(result);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        uploadResult = await uploadBytes(storageRef, file, metadata);
      }

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      options.onComplete?.(downloadURL);

      return {
        url: downloadURL,
        fullPath: uploadResult.ref.fullPath,
        bucket: uploadResult.ref.bucket,
        metadata: uploadResult.metadata
      };

    } catch (error) {
      const storageError = this.handleFirebaseStorageError(error);
      options.onError?.(storageError);
      throw storageError;
    }
  }

  /**
   * Get download URL for a file (equivalent to Supabase getPublicUrl)
   */
  async getDownloadUrl(bucketName: string, filePath: string): Promise<string> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const storageRef = ref(this.storage, `${bucketName}/${filePath}`);
      return await getDownloadURL(storageRef);
    } catch (error) {
      throw this.handleFirebaseStorageError(error);
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async delete(bucketName: string, filePath: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const storageRef = ref(this.storage, `${bucketName}/${filePath}`);
      await deleteObject(storageRef);
    } catch (error) {
      throw this.handleFirebaseStorageError(error);
    }
  }

  /**
   * List files in a directory
   */
  async list(bucketName: string, prefix?: string): Promise<StorageReference[]> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const storageRef = ref(this.storage, prefix ? `${bucketName}/${prefix}` : bucketName);
      const result = await listAll(storageRef);
      return result.items;
    } catch (error) {
      throw this.handleFirebaseStorageError(error);
    }
  }

  /**
   * Handle Firebase Storage errors and convert to user-friendly messages
   */
  private handleFirebaseStorageError(error: any): StorageError {
    const storageError = new Error() as StorageError;
    storageError.code = error.code || 'unknown';
    storageError.serverResponse = error.serverResponse;

    switch (error.code) {
      case 'storage/object-not-found':
        storageError.message = 'File not found';
        break;
      case 'storage/bucket-not-found':
        storageError.message = 'Storage bucket not found';
        break;
      case 'storage/project-not-found':
        storageError.message = 'Firebase project not found';
        break;
      case 'storage/quota-exceeded':
        storageError.message = 'Storage quota exceeded';
        break;
      case 'storage/unauthenticated':
        storageError.message = 'User not authenticated';
        break;
      case 'storage/unauthorized':
        storageError.message = 'User not authorized to perform this action';
        break;
      case 'storage/retry-limit-exceeded':
        storageError.message = 'Upload retry limit exceeded';
        break;
      case 'storage/invalid-format':
        storageError.message = 'Invalid file format';
        break;
      case 'storage/no-default-bucket':
        storageError.message = 'No default storage bucket configured';
        break;
      case 'storage/cannot-slice-blob':
        storageError.message = 'File upload failed - invalid file data';
        break;
      case 'storage/server-file-wrong-size':
        storageError.message = 'File size mismatch';
        break;
      default:
        storageError.message = error.message || 'Storage operation failed';
    }

    return storageError;
  }
}

// Firebase-only storage manager
export class FirebaseStorageManager {
  private firebaseAdapter: FirebaseStorageAdapter;

  constructor() {
    this.firebaseAdapter = new FirebaseStorageAdapter();
  }

  /**
   * Upload file using Firebase Storage
   */
  async upload(
    bucketName: string,
    filePath: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<FileUploadResult> {
    if (!this.firebaseAdapter.isAvailable()) {
      throw new Error('Firebase Storage not available');
    }

    console.log('Using Firebase Storage for upload:', { bucketName, filePath });
    return this.firebaseAdapter.upload(bucketName, filePath, file, options);
  }

  /**
   * Get download URL using Firebase Storage
   */
  async getDownloadUrl(bucketName: string, filePath: string): Promise<string> {
    if (!this.firebaseAdapter.isAvailable()) {
      throw new Error('Firebase Storage not available');
    }

    return this.firebaseAdapter.getDownloadUrl(bucketName, filePath);
  }

  /**
   * Delete file using Firebase Storage
   */
  async delete(bucketName: string, filePath: string): Promise<void> {
    if (!this.firebaseAdapter.isAvailable()) {
      throw new Error('Firebase Storage not available');
    }

    return this.firebaseAdapter.delete(bucketName, filePath);
  }

  /**
   * Check if Firebase Storage is available
   */
  isAvailable(): boolean {
    return this.firebaseAdapter.isAvailable();
  }
}

// Helper functions for common storage operations
export const storageManager = new FirebaseStorageManager();

/**
 * Upload avatar image with optimized settings
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const result = await storageManager.upload('avatars', filePath, file, {
    contentType: file.type,
    customMetadata: {
      userId: userId,
      uploadedAt: new Date().toISOString()
    },
    onProgress
  });

  return result.url;
}

/**
 * Upload recording with progress tracking
 */
export async function uploadRecording(
  userId: string,
  blob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileName = `${userId}/${Date.now()}.webm`;

  const result = await storageManager.upload('recordings', fileName, blob, {
    contentType: 'audio/webm',
    customMetadata: {
      userId: userId,
      uploadedAt: new Date().toISOString()
    },
    onProgress
  });

  return result.url;
}

/**
 * Upload document with progress tracking
 */
export async function uploadDocument(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; storagePath: string }> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

  const result = await storageManager.upload('docs', storagePath, file, {
    contentType: file.type,
    customMetadata: {
      userId: userId,
      originalFileName: file.name,
      uploadedAt: new Date().toISOString()
    },
    onProgress
  });

  return {
    url: result.url,
    storagePath: storagePath
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucketName: string, filePath: string): Promise<void> {
  return storageManager.delete(bucketName, filePath);
}

/**
 * Get public URL for a file
 */
export async function getFileUrl(bucketName: string, filePath: string): Promise<string> {
  return storageManager.getDownloadUrl(bucketName, filePath);
}

// Security rules helpers for Firebase Storage
export const STORAGE_RULES_REFERENCE = `
// Firebase Storage Security Rules for Apply.codes
// These rules should be configured in the Firebase Console

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars bucket - users can only access their own avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Recordings bucket - users can only access their own recordings
    match /recordings/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Documents bucket - users can only access their own documents
    match /docs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny rule
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
`;

// Export the default storage manager
export default storageManager;