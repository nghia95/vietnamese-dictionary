export interface Definition {
  id: number;
  word_id: number;
  definition: string;
  source: string;
  type?: string;
  order: number;
  created_at: string;
}

export interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  image: string | null;
  user_id: number | null;
  user_name: string | null;
  created_at: string;
  definitions: Definition[];
  etymologies: string[];
  synonyms: string[];
  antonyms: string[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface WordInput {
  word: string;
  phonetic?: string;
  image?: string;
  definitions: {
    definition: string;
    source: string;
    type?: string;
  }[];
  etymologies: string[];
  synonyms: string[];
  antonyms: string[];
}

export interface Feedback {
  id: number;
  word_id: number | null;
  word_text: string | null;
  user_id: number;
  user_name: string;
  user_email: string;
  content: string;
  status: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  details: string | null;
  created_at: string;
}
