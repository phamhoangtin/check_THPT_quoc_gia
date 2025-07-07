import { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "./unstable-cache";
import { Database } from "./supabase/db-types";

const transformer = <T>({ value }: { value: T }) => ({
  label: String(value),
  value,
});

export const getUniqueYears = unstable_cache(
  async (supabase: SupabaseClient) => {
    return supabase
      .from("unique_years")
      .select("value:year")
      .order("year", { ascending: false })
      .then(({ data }) => data ?? [])
      .then((data) => data.map(transformer));
  },
  ["getUniqueYears"],
  {
    revalidate: 60 * 60, // 1 hour
  }
);

export const getUniqueCombinations = unstable_cache(
  async (supabase: SupabaseClient<Database>) => {
    return supabase
      .from("unique_combinations")
      .select("value:combination")
      .order("combination", { ascending: true })
      .then(({ data }) => data ?? [])
      .then((data) => data.map(transformer));
  },
  ["getUniqueCombinations"],
  {
    revalidate: 60 * 60, // 1 hour
  }
);

type GetClosestScoresParams = {
  year: number;
  combination: string;
  score: number;
};

export const getClosestScores = async (
  supabase: SupabaseClient<Database>,
  params: GetClosestScoresParams
) => {
  const { data, error } = await supabase.rpc("get_closest_scores", {
    input_combination: params.combination,
    input_score: params.score,
    input_year: params.year,
  });
  if (error) return [];
  return data;
};
