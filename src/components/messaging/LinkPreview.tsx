'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { isImageUrl, getUrlDomain } from '@/src/lib/messageUtils';

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export const LinkPreview = ({ url, className }: LinkPreviewProps) => {
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    setIsImage(isImageUrl(url));
  }, [url]);

  if (isImage) {
    return (
      <div className={cn('mt-2 rounded-xl overflow-hidden', className)}>
        <img
          src={url}
          alt="Image preview"
          className="w-full max-w-md h-auto rounded-xl"
          onError={(e) => {
            // Si l'image ne charge pas, afficher comme un lien normal
            setIsImage(false);
          }}
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mt-2 block rounded-xl border-2 border-beige-200 bg-beige-50 p-3 hover:bg-beige-100 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{getUrlDomain(url)}</p>
          <p className="text-xs text-neutral-600 truncate">{url}</p>
        </div>
        <svg className="h-4 w-4 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
};
