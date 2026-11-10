export type Exercise = { id: string; name: string; muscle_group: string; equipment: string };
export type WorkoutSet = {
  id: string;
  exercise_position: number;
  set_number: number;
  reps: number;
  weight_kg: number;
};
export type WorkoutSession = {
  workout_records?: {
    id: string;
    exercise_id: string;
    weight_kg: number;
    previous_weight_kg: number | null;
    exercises: { name: string };
  }[];
  id: string;
  trainee_id: string;
  program_name: string;
  started_at: string;
  completed_at: string | null;
  total_volume_kg: number;
  program_snapshot: {
    exercise_id: string;
    name: string;
    position: number;
    target_sets: number;
    target_reps: number;
  }[];
  workout_sets: WorkoutSet[];
};
export type ProgramExercise = {
  id?: string;
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  position?: number;
  exercises?: Exercise;
};
export type Program = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  program_exercises: ProgramExercise[];
};
