
import { useContacts } from "@/hooks/use-contacts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactSelectProps {
  selectedContactId?: string;
  onSelect: (contactId: string) => void;
  disabled?: boolean;
}

export function ContactSelect({ selectedContactId, onSelect, disabled }: ContactSelectProps) {
  const { data: contacts, isLoading: isLoadingContacts } = useContacts();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Assign to</label>
      <Select
        value={selectedContactId}
        onValueChange={onSelect}
        disabled={disabled || isLoadingContacts}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a contact" />
        </SelectTrigger>
        <SelectContent 
          className="pointer-events-auto z-[99999]"
        >
          {contacts?.map((contact) => (
            <SelectItem 
              key={contact.contact_id} 
              value={contact.contact_id}
            >
              {contact.contact_profile?.first_name} {contact.contact_profile?.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
