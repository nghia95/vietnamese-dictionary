export interface Word {
  id: number;
  word: string;
  definition: string;
  phonetic: string | null;
  user_id: number | null;
  user_name: string | null;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface WordInput {
  word: string;
  definition: string;
  phonetic?: string;
}
