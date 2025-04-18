
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { TaglineSection } from "./TaglineSection";
import { LanguageSection } from "./LanguageSection";
import { BioSection } from "./BioSection";

interface ProfileDetailsProps {
  form: UseFormReturn<ProfileFormValues>;
  onEnhanceBio: (enhancedBio: string) => void;
}

export function ProfileDetails({ form, onEnhanceBio }: ProfileDetailsProps) {
  return (
    <div className="space-y-4">
      <TaglineSection form={form} />
      <LanguageSection form={form} />
      <BioSection form={form} onEnhanceBio={onEnhanceBio} />
    </div>
  );
}
