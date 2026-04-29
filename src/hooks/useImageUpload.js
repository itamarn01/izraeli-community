import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

const MAX_MB = 5;

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const upload = async (file) => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד');
      return null;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`גודל התמונה חייב להיות עד ${MAX_MB}MB`);
      return null;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאת התמונה');
      setPreview(null);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
  };

  return { upload, uploading, preview, clear };
}
