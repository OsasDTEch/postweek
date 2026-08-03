export interface User {
  id: string;
  email: string;
  is_verified: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  role: string | null;
  offering: string | null;
  audience: string | null;
  topics: string | null;
  known_for: string | null;
  tone_preset: "casual" | "professional" | "contrarian" | "storyteller" | null;
}

export interface StyleSample {
  id: string;
  content: string;
  created_at: string;
}

export type PostStatus = "draft" | "edited" | "copied";
export type Platform = "linkedin" | "x";

export interface Post {
  id: string;
  week_id: string;
  pillar: string;
  suggested_day: string;
  platform: Platform;
  body: string;
  edited_body: string | null;
  status: PostStatus;
  copied_at: string | null;
}

export interface XPost extends Post {
  platform: "x";
  tweets: string[];   // pre-split by backend
}

export interface WeekSummary {
  id: string;
  prompt_version: string;
  model_used: string | null;
  regen_count: number;
  created_at: string;
}

export interface Week extends WeekSummary {
  posts: Post[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}
