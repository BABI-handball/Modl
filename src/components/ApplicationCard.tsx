'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Application, ModelProfile } from '@/src/types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatDate } from '@/src/lib/utils';
import { messagesStore } from '@/src/lib/messagesStore';
import { useCurrentUser } from '@/src/hooks/useCurrentUser';
import { jobsStore } from '@/src/lib/jobs';
import { mockJobPosts } from '@/src/data/mock';

interface ApplicationCardProps {
  application: Application;
  modelProfile: ModelProfile;
  onSwipe?: (applicationId: string, direction: 'left' | 'right') => void;
}

export const ApplicationCard = ({ application, modelProfile, onSwipe }: ApplicationCardProps) => {
  const router = useRouter();
  const { user } = useCurrentUser(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const handleMessage = () => {
    if (!user) return;
    
    const allJobs = [...mockJobPosts, ...jobsStore.getAll()];
    const job = allJobs.find(j => j.id === application.jobId);
    
    const threadId = messagesStore.getOrCreateThread(
      user.id,
      application.modelUserId,
      application.jobId,
      job ? `Bonjour ${modelProfile.name}, votre profil nous intéresse pour "${job.title}". Seriez-vous disponible pour échanger ?` : undefined
    );
    
    router.push(`/messages/${threadId}`);
  };

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setOffsetX(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(offsetX) > 100) {
      onSwipe?.(application.id, offsetX > 0 ? 'right' : 'left');
    }
    setOffsetX(0);
  };

  return (
    <Card
      className="relative touch-none select-none"
      style={{
        transform: `translateX(${offsetX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {modelProfile.portfolioImages[0] && (
            <img
              src={modelProfile.portfolioImages[0]}
              alt={modelProfile.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{modelProfile.name}</h3>
              <Badge
                variant={
                  application.status === 'SHORTLISTED'
                    ? 'success'
                    : application.status === 'REJECTED'
                    ? 'danger'
                    : 'default'
                }
              >
                {application.status === 'SHORTLISTED'
                  ? 'Sélectionné'
                  : application.status === 'REJECTED'
                  ? 'Refusé'
                  : 'En attente'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p>{modelProfile.age} ans • {modelProfile.height}cm • {modelProfile.city}</p>
            </div>
            {application.message && (
              <p className="text-sm text-gray-700">{application.message}</p>
            )}
            <p className="text-xs text-gray-500">{formatDate(application.createdAt)}</p>
            {application.status === 'SHORTLISTED' && user && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMessage}
                  className="w-full"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Envoyer un message
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
