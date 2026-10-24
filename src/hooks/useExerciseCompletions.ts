import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  completed_at: string;
}

const STORAGE_KEY = "calmo_exercise_completions";

function readGuest(): ExerciseCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExerciseCompletion[]) : [];
  } catch {
    return [];
  }
}

function writeGuest(records: ExerciseCompletion[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-500)));
  } catch {
    /* ignore */
  }
}

const fetchServer = async (userId: string): Promise<ExerciseCompletion[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("exercise_completions")
    .select("id, exercise_id, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const useExerciseCompletions = () => {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();

  const guestQuery = useQuery({
    queryKey: ["exercise-completions", "guest"],
    queryFn: () => Promise.resolve(readGuest()),
    enabled: isGuest,
  });

  const authQuery = useQuery({
    queryKey: ["exercise-completions", user?.id],
    queryFn: () => (user ? fetchServer(user.id) : Promise.resolve([])),
    enabled: !!user && !isGuest && isSupabaseConfigured,
  });

  const mutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!user || isGuest || !isSupabaseConfigured) throw new Error("not authenticated");
      const { data, error } = await supabase
        .from("exercise_completions")
        .insert({ user_id: user.id, exercise_id: exerciseId })
        .select()
        .single();
      if (error) throw error;
      return data as ExerciseCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-completions"] });
    },
  });

  const logCompletion = (exerciseId: string) => {
    if (isGuest) {
      const next: ExerciseCompletion = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
        exercise_id: exerciseId,
        completed_at: new Date().toISOString(),
      };
      const current = readGuest();
      const updated = [next, ...current];
      writeGuest(updated);
      queryClient.setQueryData(["exercise-completions", "guest"], updated);
    } else {
      mutation.mutate(exerciseId);
    }
  };

  const completions = isGuest ? guestQuery.data || [] : authQuery.data || [];

  return {
    completions,
    logCompletion,
    isLogging: mutation.isPending,
  };
};
