import { AcademicCombinationForm } from "@/components/combobox";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getUniqueCombinations, getUniqueYears } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const [years, combinations] = await Promise.all([
    getUniqueYears(supabase),
    getUniqueCombinations(supabase),
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex flex-1 flex-col gap-20 max-w-5xl">
          <div className="pt-10">
            <AcademicCombinationForm
              years={years}
              combinations={combinations as Array<{ label: string; value: string }>}
            />
          </div>
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-4">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
