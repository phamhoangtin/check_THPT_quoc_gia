"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import ComboboxPopover from "./combobox-popover";
import { Input } from "@/components/ui/input";
import { getClosestScores } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/db-types";

function getPercentage(
  input_score: number,
  args: Array<Tables<"diem_thpt_quoc_gia">>
): number {
  const [lower, higher] = args;

  const step = higher.score - lower.score;
  const score_step =
    (higher.ranking_in_combination - lower.ranking_in_combination) /
    (10 * step);

  const exact_ranking =
    lower.ranking_in_combination + (input_score - lower.score) * score_step;

  return exact_ranking;
}

const EntrySchema = z.object({
  year: z.number({
    required_error: "Year is required",
    invalid_type_error: "Year must be a number",
  }),
  combination: z.string({
    required_error: "Combination is required",
  }),
  score: z.union([
    z
      .number({
        required_error: "Score is required",
        invalid_type_error: "Score must be a number",
      })
      .min(0, "Score must be at least 0")
      .max(10, "Score must be at most 10"),
    z.string().regex(/^\d+\.?\d*$/, "Invalid score format"),
    z.undefined(),
  ]),
});

const FormSchema = z.object({
  entries: z.array(EntrySchema).min(1, "At least one entry is required"),
});

type Props = {
  years: Array<{ label: string; value: number }>;
  combinations: Array<{ label: string; value: string }>;
};

export function AcademicCombinationForm({ years, combinations }: Props) {
  const [firstYear] = years;
  const [firstCombination] = combinations;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      entries: [
        {
          year: firstYear.value,
          combination: firstCombination.value,
          score: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  async function onSubmit({ entries }: z.infer<typeof FormSchema>) {
    const supanase = createClient();
    const validEntries = entries.filter(
      (entry) => entry.year && entry.combination && entry.score !== undefined
    );
    if (validEntries.length === 0) {
      toast.error("Please fill in at least one valid entry.");
      return;
    }

    const closestScores = await Promise.all(
      validEntries.map((entry) =>
        getClosestScores(supanase, {
          year: entry.year,
          combination: entry.combination,
          score: Number(entry.score),
        })
      )
    );

    const validResults = closestScores.filter((scores) => scores.length === 2); // Ensure we have two results for each entry

    const percentages = validResults.map((results) => {
      const [lower] = results;
      const currentYear = lower.year;
      const entry = validEntries.find((e) => e.year === currentYear);
      return {
        year: currentYear,
        percentage: getPercentage(Number(entry!.score), results),
      };
    });
    console.log("Percentages:", percentages);
  }

  function onError(errors: unknown) {
    const errorMessages = Object.entries(errors as Error)
      .map(([, error]: [string, Error]) => error.message)
      .join("\n");

    toast.error("Validation Error", {
      position: "top-right",
      description: errorMessages,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-4"
      >
        <div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-3">
              <FormField
                control={form.control}
                name={`entries.${index}.year`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      // htmlFor={`year-${index}`}
                      className={cn("font-bold", index > 0 && "sr-only")}
                    >
                      Năm
                    </FormLabel>
                    <ComboboxPopover
                      values={years}
                      field={field}
                      onSelect={(value) =>
                        form.setValue(`entries.${index}.year`, Number(value))
                      }
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`entries.${index}.combination`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      // htmlFor={`combination-${index}`}
                      className={cn("font-bold", index > 0 && "sr-only")}
                    >
                      Khối
                    </FormLabel>
                    <ComboboxPopover
                      values={combinations}
                      field={field}
                      onSelect={(value) =>
                        form.setValue(
                          `entries.${index}.combination`,
                          value.toString()
                        )
                      }
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`entries.${index}.score`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel
                      htmlFor={`score-${index}`}
                      className={cn("font-bold", index > 0 && "sr-only")}
                    >
                      Điểm chuẩn
                    </FormLabel>
                    <Input
                      id={`score-${index}`}
                      className="w-24 font-medium"
                      name={`score-${index}`}
                      type="text"
                      placeholder="(e.g. 1.5)"
                      value={field.value ? field.value : ""}
                      onChange={(e) => {
                        // First replace any comma with a decimal point
                        const value = e.target.value.replace(",", ".");

                        // Handle empty input
                        if (value === "") {
                          field.onChange(undefined);
                          return;
                        }

                        // Filter out any non-numeric characters except decimal point
                        const filteredValue = value
                          .split("")
                          .filter((char, index) => {
                            // Allow digits
                            if (/\d/.test(char)) return true;
                            // Allow only one decimal point and not as first character
                            if (
                              char === "." &&
                              index > 0 &&
                              !value.slice(0, index).includes(".")
                            )
                              return true;
                            return false;
                          })
                          .join("");

                        // If it's a complete valid number and within range
                        if (/^\d+\.\d+$/.test(filteredValue)) {
                          const numValue = parseFloat(filteredValue);
                          if (numValue >= 0 && numValue <= 10) {
                            field.onChange(numValue);
                            return;
                          }
                        }

                        // For partial inputs (like "1." or "1") or out of range values
                        if (/^\d+\.?\d*$/.test(filteredValue)) {
                          field.onChange(filteredValue);
                        }
                      }}
                    />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2
                  className={cn("h-4 w-4", fields.length === 1 && "hidden")}
                />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("flex items-center gap-2")}
            disabled={fields.length === years.length}
            onClick={() =>
              append({
                year: years[fields.length].value,
                combination: firstCombination.value,
                score: undefined,
              })
            }
          >
            <PlusCircle className="h-4 w-4" />
            Add Entry
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}
