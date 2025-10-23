import { Skeleton } from "./ui/skeleton";

export function AnimeCardSkeleton() {
  return (
    <div className="theme-card rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--card-border)' }}>
      <div className="relative">
        <Skeleton className="w-full aspect-[3/4]" />
        <div className="absolute top-2 left-2">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

export function AnticipatedCardSkeleton() {
  return (
    <div className="theme-card rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--card-border)' }}>
      <div className="relative">
        <Skeleton className="w-full aspect-[3/4]" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}
