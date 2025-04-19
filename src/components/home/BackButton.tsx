
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(-1);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="hover:bg-accent"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
