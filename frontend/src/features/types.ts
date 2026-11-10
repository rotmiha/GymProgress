export type Exercise = { id: string; name: string; muscle_group: string; equipment: string };
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
