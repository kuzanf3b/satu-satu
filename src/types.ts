export interface MicroStep {
  instruction: string;
  estimated_time: string;
}

export interface TaskMission {
  id: string;
  task_title: string;
  steps: MicroStep[];
  anchor_step: string; // 10-second ultra-low friction activation trigger
  affirmation: string;
  createdAt: number;
  completedSteps: boolean[]; // tracks which steps the user completed
  currentStepIndex: number; // tracks active card isolation
}

export interface DecompressResponse {
  task_title: string;
  steps: MicroStep[];
  anchor_step: string;
  affirmation: string;
}

export interface PresetItem {
  id: string;
  title: string;
  type: "visual" | "voice" | "text";
  description: string;
  imageUrl?: string;
  sampleText?: string;
}
