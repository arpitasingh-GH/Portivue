export type EntryCategory =
  | 'Projects'
  | 'Certificates'
  | 'Hackathons'
  | 'Achievements'
  | 'Internships'
  | 'Other';

export type EvidenceLabel = 'Evidence linked' | 'Self-reported';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  skills: string[];
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  outcome: string;
  category: EntryCategory;
  evidence_url: string | null;
  evidence_type: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
