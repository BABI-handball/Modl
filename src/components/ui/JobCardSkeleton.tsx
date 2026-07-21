'use client';

import { Card, CardContent } from './Card';
import { Skeleton } from './Skeleton';

export const JobCardSkeleton = () => {
  return (
    <Card className="border-2 border-beige-300 bg-white w-full max-w-full overflow-hidden">
      <CardContent className="p-4 sm:p-6 md:p-8 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full max-w-full">
          <div className="flex-1 w-full min-w-0 space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 mb-2" variant="text" />
                  <Skeleton className="h-4 w-1/4" variant="text" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" variant="circular" />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Skeleton className="h-5 w-20 rounded-full" variant="rectangular" />
                <Skeleton className="h-5 w-16 rounded-full" variant="rectangular" />
                <Skeleton className="h-5 w-24 rounded-full" variant="rectangular" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-5/6" variant="text" />
              <Skeleton className="h-4 w-4/6" variant="text" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-4 w-16" variant="text" />
              <Skeleton className="h-4 w-20" variant="text" />
              <Skeleton className="h-4 w-24" variant="text" />
            </div>
          </div>
          <Skeleton className="w-full sm:w-24 h-48 sm:h-24 rounded-xl sm:rounded-2xl" variant="rectangular" />
        </div>
      </CardContent>
    </Card>
  );
};
