
import { Mic } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export function Logo({ size = "md", variant = "full" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-whispr-purple text-white">
        <Mic className="w-5 h-5" />
      </div>
      {variant === "full" && (
        <span className={`font-bold ${sizeClasses[size]} text-foreground`}>
          Whispr<span className="text-whispr-purple">AI</span>
        </span>
      )}
    </div>
  );
}
