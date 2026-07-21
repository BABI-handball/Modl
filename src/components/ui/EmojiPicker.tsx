'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

// Emojis organisés en pages simples
const EMOJI_PAGES = [
  // Page 1 - Smileys
  ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄'],
  // Page 2 - Émotions
  ['😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥'],
  // Page 3 - Expressions
  ['😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  // Page 4 - Symboles et objets
  ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀'],
  // Page 5 - Cœurs et symboles
  ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋'],
  // Page 6 - Divers
  ['✅', '❌', '✔️', '✖️', '➖', '➕', '➗', '✖️', '💯', '🔢', '🔣', '🔤', '🔠', '🔡', '🎵', '🎶', '🎤', '🎧', '📻', '🎷', '🎺', '🎸', '🪗', '🥁', '🪘', '🎹', '🎼', '🎯', '🎲', '🎮', '🎰', '🃏', '🀄', '🎴', '🎭', '🖼️'],
];

export const EmojiPicker = ({ onEmojiSelect, className }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalPages = EMOJI_PAGES.length;
  const currentEmojis = EMOJI_PAGES[currentPage] || [];

  return (
    <div className={cn('relative', className)} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
        title="Ajouter un emoji"
      >
        <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 h-96 bg-white border-2 border-beige-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Emojis */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2">
            {currentEmojis.map((emoji, index) => (
              <button
                key={`${currentPage}-${index}`}
                onClick={() => {
                  onEmojiSelect(emoji);
                  setIsOpen(false);
                }}
                className="relative text-2xl rounded-lg p-2 transition-all duration-200 hover:bg-beige-100 active:bg-beige-200 flex items-center justify-center"
                style={{ transformOrigin: 'center' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Navigation entre pages */}
          <div className="flex items-center justify-between border-t border-beige-200 bg-beige-50 px-3 py-2">
            <button
              onClick={() => setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))}
              className="p-1.5 rounded-lg hover:bg-beige-200 transition-colors"
              title="Page précédente"
            >
              <svg className="h-4 w-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-medium text-neutral-600">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))}
              className="p-1.5 rounded-lg hover:bg-beige-200 transition-colors"
              title="Page suivante"
            >
              <svg className="h-4 w-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
