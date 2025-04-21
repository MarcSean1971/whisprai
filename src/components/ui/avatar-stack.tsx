
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarStackProps {
  avatars: {
    src?: string;
    name: string;
    onClick?: () => void;
    isOnline?: boolean;
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
        <div key={i} className="relative">
          <Avatar 
            className={cn(
              "border-2 border-background cursor-pointer hover:scale-105 transition-transform", 
              sizeClasses[size]
            )}
            onClick={avatar.onClick}
          >
            <AvatarImage src={avatar.src} alt={avatar.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {avatar.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {avatar.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          )}
        </div>
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
