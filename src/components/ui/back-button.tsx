
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onBack?: () => void;
  to?: string;
}

export function BackButton({ onBack, to }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onBack) {
      onBack();
    } else if (to) {
      navigate(to);
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
