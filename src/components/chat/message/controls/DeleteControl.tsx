
import { Trash2 } from "lucide-react";

interface DeleteControlProps {
  onDelete: () => void;
  isDeleting: boolean;
}

export function DeleteControl({ onDelete, isDeleting }: DeleteControlProps) {
  return (
    <button
      onClick={onDelete}
      disabled={isDeleting}
      className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
      title="Delete message"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
