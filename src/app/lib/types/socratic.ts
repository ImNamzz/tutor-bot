// Socratic learning environment types
export type DocumentKind = "pdf" | "ppt" | "word" | "video" | "text";

export interface DocumentRef {
  id: string;
  kind: DocumentKind;
  title: string;
  uploadedAt: Date;
  pages?: number; // for pdf/ppt/word
  durationSeconds?: number; // for video
  contentExcerpt?: string; // short snippet for list previews
}

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Citation {
  id: string;
  documentId: string;
  ref: string; // e.g. page:line or timestamp
  preview: string; // short text preview
}

export interface Note {
  id: string;
  questionId?: string; // tie note to a Socratic question
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocraticProgressState {
  currentStep: number;
  totalSteps: number;
  confidenceLevel: number; // 0-100
  timeSpent: number; // seconds
}

export type QuestionType =
  | "clarification"
  | "assumption"
  | "evidence"
  | "perspective"
  | "implication"
  | "relevance";

export interface SocraticMessageBase {
  id: string;
  role: "ai" | "user";
  createdAt: Date;
}

export interface SocraticAIMessage extends SocraticMessageBase {
  role: "ai";
  type: QuestionType;
  content: string;
  citationIds?: string[];
  hint?: boolean; // if this represents a hint rather than a main question
  reasoningSteps?: string[]; // optional chain-of-thought style (UI only; not stored raw if policy restricts)
}

export interface SocraticUserMessage extends SocraticMessageBase {
  role: "user";
  content: string;
  confidenceSelfAssessment?: number; // user provided after answering
}

export type SocraticMessage = SocraticAIMessage | SocraticUserMessage;
