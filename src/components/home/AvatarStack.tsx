
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarStackProps {
  users: {
    name: string;
    image?: string;
  }[];
  limit?: number;
}

export function AvatarStack({ 
  users, 
  limit = 3 
}: AvatarStackProps) {
  const displayUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, i) => (
        <Avatar key={i} className="border-2 border-background">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div className="flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium h-8 w-8 border-2 border-background">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
