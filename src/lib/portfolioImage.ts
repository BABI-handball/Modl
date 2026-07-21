// Configuration centralisée de l'image de portfolio
// Image avec fond violet/bleu - style shooting mannequin
// Remplacez cette URL par l'URL exacte de votre image avec fond violet
export const PORTFOLIO_IMAGE_URL = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800';

// Génère un tableau de 6 fois la même image
export const getPortfolioImages = (): string[] => {
  return Array(6).fill(PORTFOLIO_IMAGE_URL);
};
