
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onBack?: () => void;
}

export function BackButton({ onBack }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="md:hover:bg-accent"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
