'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, User, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import Image from 'next/image';

interface ImageUploadProps {
  /** URL ảnh hiện tại (khi edit) */
  value?: string;
  /** Callback khi upload xong, trả về URL */
  onChange: (url: string) => void;
  /** Kích thước avatar (px) */
  size?: number;
  /** Folder trong Cloudinary */
  folder?: string;
  /** Mode hiển thị: 'avatar' cho upload ảnh avatar, 'file' cho upload tài liệu */
  mode?: 'avatar' | 'file';

  fileType?: string; // Loại file được phép upload (ví dụ: "image/*" hoặc "application/pdf")
}

export default function ImageUpload({
  value,
  onChange,
  size = 88,
  folder = 'chat-app-microservices/global',
  mode = 'avatar',
  fileType = 'image/*',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [previewName, setPreviewName] = useState(value?.split('/').pop() || '');
  const [previewIsImage, setPreviewIsImage] = useState(
    Boolean(value && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(value)),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const prevValueRef = useRef(value);

  const clearObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    clearObjectUrl();
    setPreview(value || null);
    setPreviewName(value?.split('/').pop() || '');
    setPreviewIsImage(Boolean(value && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(value)));
  }, [clearObjectUrl, value]);

  useEffect(() => {
    return () => clearObjectUrl();
  }, [clearObjectUrl]);

  const { upload, uploading, error } = useFileUpload({
    folder,
    type: 'image',
    onSuccess: (file) => {
      clearObjectUrl();
      setPreview(file.url);
      setPreviewName(file.name || file.url.split('/').pop() || '');
      setPreviewIsImage(
        ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(file.format.toLowerCase()),
      );
      onChange(file.url);
    },
    onError: () => {
      clearObjectUrl();
      setPreview(value || null);
      setPreviewName(value?.split('/').pop() || '');
      setPreviewIsImage(Boolean(value && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(value)));
      onChange('');
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview ngay lập tức (optimistic)
    clearObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setPreviewName(file.name);
    setPreviewIsImage(file.type.startsWith('image/'));

    await upload(file);

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearObjectUrl();
    setPreview(null);
    setPreviewName('');
    setPreviewIsImage(false);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {mode === 'avatar' ? (
        <>
          {/* Avatar circle */}
          <div
            className="relative cursor-pointer group"
            style={{ width: size, height: size }}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <div
              className="w-full h-full rounded-full border-2 border-dashed border-border group-hover:border-primary/60 bg-muted/30 flex items-center justify-center overflow-hidden transition-all"
              style={{ width: size, height: size }}
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Avatar"
                  width={size}
                  height={size}
                  className="w-full h-full object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <User
                  className="text-muted-foreground/40"
                  style={{
                    width: size * 0.4,
                    height: size * 0.4,
                  }}
                />
              )}
            </div>

            {/* Overlay hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Nút xóa */}
            {preview && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {uploading ? 'Đang tải lên...' : 'Nhấp để chọn ảnh'}
          </p>
        </>
      ) : (
        <>
          {/* File upload box */}
          <div
            className="relative w-full cursor-pointer group"
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <div className="w-full border-2 border-dashed border-border group-hover:border-primary/60 bg-muted/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all">
              {preview ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  {previewIsImage ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={preview}
                        alt={previewName || 'Preview'}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <FileText className="w-8 h-8 text-primary" />
                  )}
                  <p className="text-sm font-medium text-muted-foreground text-center truncate max-w-[200px]">
                    {previewName || preview.split('/').pop() || 'Tệp đã tải'}
                  </p>
                </div>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    {uploading ? 'Đang tải lên...' : 'Nhấp để chọn tệp'}
                  </p>
                </>
              )}
              {uploading && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Nút xóa */}
            {preview && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {uploading ? 'Đang xử lý...' : fileType}
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={mode === 'avatar' ? 'image/jpeg,image/png,image/webp,image/gif' : '*'}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && <p className="text-[11px] text-destructive text-center font-medium">{error}</p>}
    </div>
  );
}
