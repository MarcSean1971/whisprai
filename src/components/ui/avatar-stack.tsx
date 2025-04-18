
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarStackProps {
  avatars: {
    src?: string;
    name: string;
  }[];
  limit?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarStack({ 
  avatars, 
  limit = 3, 
  size = "md", 
  className 
}: AvatarStackProps) {
  const sizeClasses = {
    sm: "h-6 w-6 -ml-1.5 first:ml-0",
    md: "h-8 w-8 -ml-2 first:ml-0",
    lg: "h-10 w-10 -ml-3 first:ml-0",
  };

  const displayAvatars = avatars.slice(0, limit);
  const remainingCount = avatars.length - limit;

  return (
    <div className={cn("flex items-center", className)}>
      {displayAvatars.map((avatar, i) => (
        <Avatar key={i} className={cn("border-2 border-background", sizeClasses[size])}>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {avatar.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium", 
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
