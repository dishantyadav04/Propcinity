'use client';

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from '@/lib/admin-fetch';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string[];
  onRemove: (url: string) => void;
  /** Used to build descriptive alt text, e.g. "Project Gallery". Defaults to "Uploaded image". */
  label?: string;
}

export default function ImageUpload({ onUpload, value = [], onRemove, label = 'Uploaded image' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }
      const data = await response.json();
      onUpload(data.url);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {value.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border)] group">
            <img src={url} alt={`${label} ${index + 1}`} className="w-full h-full object-cover" />
            <button 
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all">
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-[var(--text-muted)]" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Add Image</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
