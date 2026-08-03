/**
 * Flag beta publique — tout est gratuit et illimité.
 * Passer à false quand la monétisation (Stripe) est activée.
 */
export const IS_BETA = true;

/** Email public de contact / support (légal, FAQ, etc.) */
export const CONTACT_EMAIL = 'modl.contactsupport@gmail.com';

export const BETA_COPY = {
  banner:
    'MODL est en beta — accès 100 % gratuit. Vos retours nous aident à améliorer la plateforme.',
  heroTag: 'Beta ouverte · Gratuit · Paris & Île-de-France',
  creditsLabel: 'Illimités pendant la beta',
  listingsLabel: 'Illimitées pendant la beta',
  pricingHeadline: 'Beta gratuite',
  pricingSub:
    'Pendant la beta, tout est offert : annonces illimitées, crédits illimités, accès complet. Les tarifs ci-dessous arriveront plus tard.',
  footer: 'Beta gratuite · Retours bienvenus · Paiements à venir',
} as const;
