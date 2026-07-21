'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/src/lib/auth';
import { authSupabase } from '@/src/lib/authSupabase';
import { cn } from '@/src/lib/utils';
import { devAccounts } from '@/src/lib/devAccounts';
import { userStore } from '@/src/lib/userStore';
import { messagesStore } from '@/src/lib/messagesStore';
import { applicationsStore } from '@/src/lib/applications';
import { Logo } from './Logo';

const IconJobs = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconPost = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const IconInbox = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const IconMessages = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconProfile = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconLogout = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Utiliser useEffect pour éviter les problèmes d'hydratation
  const [user, setUser] = useState(auth.getCurrentUser());
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    
    // Calculer le nombre de messages non lus
    if (currentUser) {
      const count = messagesStore.getUnreadCount(currentUser.id);
      setUnreadCount(count);
      
      // Calculer le nombre de candidatures en attente pour les marques/photographes
      if (currentUser.role === 'BRAND' || currentUser.role === 'PHOTOGRAPHER') {
        const pendingCount = applicationsStore.getPendingCount(currentUser.id);
        setPendingApplicationsCount(pendingCount);
      }
    }
    
    // Écouter les changements de localStorage pour mettre à jour la navbar
    const handleStorageChange = () => {
      const updatedUser = auth.getCurrentUser();
      setUser(updatedUser);
      if (updatedUser) {
        const count = messagesStore.getUnreadCount(updatedUser.id);
        setUnreadCount(count);
        
        // Mettre à jour le nombre de candidatures en attente
        if (updatedUser.role === 'BRAND' || updatedUser.role === 'PHOTOGRAPHER') {
          const pendingCount = applicationsStore.getPendingCount(updatedUser.id);
          setPendingApplicationsCount(pendingCount);
        }
      }
    };
    
    // Écouter les changements de pathname aussi
    const handlePathnameChange = () => {
      const updatedUser = auth.getCurrentUser();
      setUser(updatedUser);
      if (updatedUser) {
        const count = messagesStore.getUnreadCount(updatedUser.id);
        setUnreadCount(count);
        
        // Mettre à jour le nombre de candidatures en attente
        if (updatedUser.role === 'BRAND' || updatedUser.role === 'PHOTOGRAPHER') {
          const pendingCount = applicationsStore.getPendingCount(updatedUser.id);
          setPendingApplicationsCount(pendingCount);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Écouter aussi les événements personnalisés
    window.addEventListener('userChanged', handleStorageChange);
    
    // Polling pour mettre à jour le nombre de messages non lus et candidatures en attente
    // Augmenté à 15 secondes pour réduire les re-renders et la compilation constante
    const interval = setInterval(() => {
      if (currentUser) {
        const count = messagesStore.getUnreadCount(currentUser.id);
        setUnreadCount(count);
        
        // Mettre à jour le nombre de candidatures en attente
        if (currentUser.role === 'BRAND' || currentUser.role === 'PHOTOGRAPHER') {
          const pendingCount = applicationsStore.getPendingCount(currentUser.id);
          setPendingApplicationsCount(pendingCount);
        }
      }
    }, 15000); // Vérifier toutes les 15 secondes au lieu de 3
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname]); // Re-run quand le pathname change

  if (!mounted || !user || pathname === '/auth' || pathname === '/onboarding' || pathname === '/') {
    return null;
  }

  // Ne pas afficher la navbar sur les pages de chat (elles ont leur propre header)
  if (pathname.startsWith('/messages/')) {
    return null;
  }

  const navItems = [
    {
      href: '/jobs',
      label: 'Annonces',
      icon: IconJobs,
      roles: ['MODEL', 'BRAND', 'PHOTOGRAPHER'],
    },
    {
      href: '/post-job',
      label: 'Publier',
      icon: IconPost,
      roles: ['BRAND', 'PHOTOGRAPHER'],
    },
    {
      href: '/inbox',
      label: 'Candidatures',
      icon: IconInbox,
      roles: ['BRAND', 'PHOTOGRAPHER'],
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: IconMessages,
      roles: ['MODEL', 'BRAND', 'PHOTOGRAPHER'],
    },
    {
      href: '/profile',
      label: 'Profil',
      icon: IconProfile,
      roles: ['MODEL', 'BRAND', 'PHOTOGRAPHER'],
    },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-beige-200/80 bg-white/98 backdrop-blur-md safe-area-inset-bottom shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        pointerEvents: 'auto', // S'assurer que la navbar peut recevoir des clics
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-1 sm:px-2 py-2 sm:py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const showUnreadBadge = item.href === '/messages' && unreadCount > 0;
          const showPendingBadge = item.href === '/inbox' && pendingApplicationsCount > 0 && (user.role === 'BRAND' || user.role === 'PHOTOGRAPHER');
          
          return (
            <button
              key={item.href}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Utiliser window.location.href directement pour forcer la navigation
                // même pendant la compilation
                window.location.href = item.href;
              }}
              className={cn(
                'relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-300 ease-out active:scale-95',
                'pointer-events-auto cursor-pointer z-50 border-0 bg-transparent', // Style de bouton
                isActive
                  ? 'text-black'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-beige-50/50'
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', isActive && 'text-black')} />
                {showUnreadBadge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 min-w-[0.875rem] sm:min-w-[1rem] items-center justify-center rounded-full bg-beige-500 text-[8px] sm:text-[9px] font-bold text-white shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {showPendingBadge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 min-w-[0.875rem] sm:min-w-[1rem] items-center justify-center rounded-full bg-beige-500 text-[8px] sm:text-[9px] font-bold text-white shadow-md">
                    {pendingApplicationsCount > 9 ? '9+' : pendingApplicationsCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] sm:text-xs font-semibold tracking-tight', isActive && 'text-black')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 sm:-bottom-1 h-0.5 sm:h-1 w-6 sm:w-8 rounded-full bg-black" />
              )}
            </button>
          );
        })}
        <button
          onClick={async () => {
            // Déconnexion Supabase
            await authSupabase.signOut();
            // Nettoyer le localStorage
            userStore.logout();
            auth.logout();
            // Utiliser window.location pour éviter les problèmes de navigation
            window.location.href = '/auth';
          }}
          className="flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-beige-50/50 transition-all duration-300 ease-out active:scale-95"
          aria-label="Déconnexion"
        >
          <IconLogout className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-[10px] sm:text-xs font-medium">Déco</span>
        </button>
      </div>
    </nav>
  );
};
