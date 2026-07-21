'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { cn } from '@/src/lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  multiple?: boolean;
  accept?: string;
  className?: string;
}

export const ImageUpload = ({
  images,
  onChange,
  maxImages = 6,
  label,
  multiple = true,
  accept = 'image/*',
  className,
}: ImageUploadProps) => {
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const filesToProcess = fileArray.slice(0, maxImages - images.length);
    const newImages: string[] = [];
    let processedCount = 0;

    if (filesToProcess.length === 0) {
      setShowImportMenu(false);
      return;
    }

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          newImages.push(result);
          processedCount++;

          if (processedCount === filesToProcess.length) {
            onChange([...images, ...newImages]);
            setShowImportMenu(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowImportMenu(false);
      }
    };

    if (showImportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImportMenu]);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700">{label}</label>
      )}
      
      {/* Aperçu des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="h-32 w-full rounded-xl object-cover border-2 border-beige-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton Importer */}
      <div className="relative" ref={menuRef} style={{ zIndex: 9999 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept={accept}
        />
        <input
          ref={galleryInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*"
          capture="environment"
        />
        
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="border-beige-300 hover:bg-beige-100"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Importer
          </Button>
        )}
        
        {showImportMenu && (
          <div 
            className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-white border-2 border-beige-200 shadow-xl overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            <button
              type="button"
              onClick={() => {
                galleryInputRef.current?.click();
              }}
              className="w-full px-4 py-3 text-left hover:bg-beige-50 transition-colors flex items-center gap-3 text-sm font-medium text-neutral-700"
            >
              <svg className="h-5 w-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Galerie
            </button>
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="w-full px-4 py-3 text-left hover:bg-beige-50 transition-colors flex items-center gap-3 text-sm font-medium text-neutral-700 border-t border-beige-100"
            >
              <svg className="h-5 w-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ordinateur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
