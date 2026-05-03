import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
// import { v1 } from '@supabase/supabase-js'; // UUID not needed


/**
 * Upload Service - Supabase Storage 'items-bucket/products/' (max 2MB)
 * Firebase auth/firestore unchanged
 */

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Upload file to Supabase Storage bucket 'items-bucket'
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
      const supabase = this.supabaseService.getClient();
      const bucket = 'items-bucket';
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `products/${filename}`;

      // Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: publicUrl,
        filename: filename
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }
}

