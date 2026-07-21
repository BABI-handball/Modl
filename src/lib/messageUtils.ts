/**
 * Utilitaires pour la messagerie
 */

// Détecter les URLs dans le texte
export const detectUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Détecter si une URL est une image
export const isImageUrl = (url: string): boolean => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  return imageExtensions.test(url) || url.includes('unsplash.com') || url.includes('imgur.com');
};

// Extraire le domaine d'une URL pour la prévisualisation
export const getUrlDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Détecter si un message est uniquement un emoji
export const isOnlyEmoji = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  
  // Nettoyer le texte (enlever les espaces et sauts de ligne)
  const cleanedText = text.trim().replace(/\s/g, '');
  
  // Regex améliorée pour détecter les emojis
  // Supporte: emojis simples, emojis avec variantes de couleur, emojis combinés (comme les drapeaux)
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+$/u;
  
  // Vérifier si le texte ne contient que des emojis
  // Limite à environ 3-4 emojis pour considérer comme "message emoji simple"
  // (les emojis peuvent faire 1-4 caractères chacun)
  if (!emojiRegex.test(cleanedText)) return false;
  
  // Compter approximativement le nombre d'emojis (en comptant les séquences)
  // Un emoji simple fait généralement 2 caractères, mais peut aller jusqu'à 4-8 pour les emojis combinés
  // On accepte jusqu'à environ 3-4 emojis
  const emojiCount = cleanedText.match(/[\p{Emoji_Presentation}\p{Emoji}]/gu)?.length || 0;
  
  return emojiCount > 0 && emojiCount <= 4 && cleanedText.length <= 20;
};
