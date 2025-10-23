import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md", className)}
      style={{ 
        backgroundColor: 'var(--rating-background)',
        opacity: 0.6
      }}
      {...props}
    />
  );
}

export { Skeleton };
