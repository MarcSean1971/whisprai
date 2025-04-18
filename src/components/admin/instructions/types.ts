
export interface Instruction {
  id: string;
  name: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  suspended: boolean;
  updated_by?: string | null;
}
