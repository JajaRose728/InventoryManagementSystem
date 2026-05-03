/**
 * Upload Service - Uses Firebase Storage (up to 2MB)
 */

import { Injectable, signal } from '@angular/core';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(file: File): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'File too large. Max 2MB allowed.' };
    }

    try {
      const storage = FirebaseService.getStorage();
      if (!storage) {
        return { success: false, error: 'Storage not available' };
      }

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/\s/g, '_')}`;
      const storageRef = ref(storage, `products/${filename}`);

      // Upload to Firebase Storage
      const snapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL,
        filename: filename
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }
}