export interface Lecture {
  id: string;
  title: string;
  type: "text" | "audio";
  content: string; // raw text transcript or placeholder for audio processing
  createdAt: string; // ISO
}

export interface ClassItem {
  id: string;
  name: string;
  code?: string;
  color: string; // tailwind bg color class
  bgImage?: string; // optional data URL for background image
  lectures: Lecture[];
  createdAt: string;
}

export interface ClassCardProps {
  item: ClassItem;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  onUploadBackground?: (item: ClassItem) => void;
  onDeleteBackground?: (id: string) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: (id: string) => void;
}

export const CLASS_COLORS: string[] = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-purple-500",
];

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export type ActionItem = {
  id: string;
  text: string;
  done?: boolean;
};

export type LectureDerivatives = {
  transcript: string;
  summary: string;
  actions: ActionItem[];
};

export const DUMMY_LECTURE_DERIVATIVES: LectureDerivatives = {
  transcript:
    "Today we covered the fundamentals of neural networks, including perceptrons, activation functions, and backpropagation. We also discussed how gradient descent optimizes loss and briefly touched on overfitting and regularization techniques like dropout and L2.",
  summary:
    "Neural networks basics: perceptron → MLP, activation (ReLU, sigmoid), backprop with gradient descent, loss minimization, and regularization (dropout, L2).",
  actions: [
    {
      id: generateId(),
      text: "Review backpropagation derivation",
      done: false,
    },
    { id: generateId(), text: "Implement a small MLP in PyTorch", done: false },
    {
      id: generateId(),
      text: "Prepare 3 quiz questions for next class",
      done: false,
    },
  ],
};
