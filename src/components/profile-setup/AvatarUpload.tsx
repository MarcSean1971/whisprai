
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUpload({ avatarUrl, onAvatarChange }: AvatarUploadProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="w-20 h-20">
        <AvatarImage src={avatarUrl || ''} alt="Profile" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-center gap-1">
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </label>
        </Button>
      </div>
    </div>
  );
}
