import React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

type Props = {
  values: Array<{ label: string; value: string | number }>;
  field: { value: string | number };
  onSelect: (value: string | number) => void;
};

const ComboboxPopover = ({ values, field, onSelect }: Props) => {
  return (
    <Popover> 
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-24 justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? values.find(({ value }) => value === field.value)?.label
              : "Select"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandGroup>
              {values.map(({ label, value }) => (
                <CommandItem
                  className="font-medium"
                  value={label}
                  key={value}
                  onSelect={onSelect.bind(null, value)}
                >
                  {label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === field.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ComboboxPopover;
