
import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  tagline: z.string().max(100, 'Tagline must be less than 100 characters').optional(),
  birthdate: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    return date < now;
  }, 'Birthdate must be in the past'),
  bio: z.string().optional(),
  language: z.string().min(1, 'Please select a language'),
  interests: z.array(z.string()).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
