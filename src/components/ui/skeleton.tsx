import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-md relative overflow-hidden", className)}
      style={{ 
        backgroundColor: 'var(--rating-background)',
      }}
      {...props}
    />
  );
}

export { Skeleton };
