import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  Check as CheckIcon,
  CirclePlus as PlusCircledIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FacetedFilter, TicketArea, Section } from "@/types";
import {
  formatIsoDateFromString,
  formatLongSpanishDateFromString,
} from "@/helpers/formatters/datetime";

interface TableTicketFacetedFilterProps {
  title: string;
  label?: string;
  options: FacetedFilter["options"];
  onUpdateFilter: (field: string, activeFacets: string[]) => void;
  area: TicketArea | Section;
  formatDate?: boolean;
}

export const TableTicketFacetedFilter = forwardRef(
  function TableTicketFacetedFilter(
    {
      title,
      label,
      options,
      onUpdateFilter,
      area,
      formatDate,
    }: TableTicketFacetedFilterProps,
    ref
  ) {
    const [selectedValues, setSelectedValues] = useState<Set<string>>(
      new Set()
    );
    const [isCleaned, setIsCleaned] = useState(false);

    const formatter = !formatDate
      ? (value: any) => value
      : area === TicketArea.ACARREOS || area === Section.VOUCHERCAMION
      ? formatIsoDateFromString
      : formatLongSpanishDateFromString;

    const handleOnSelect = (optionValue: string, isSelected: boolean) => {
      if (isSelected) {
        setSelectedValues((prev) => {
          const next = new Set(prev);
          next.delete(optionValue);
          return next;
        });
      } else {
        setSelectedValues((prev) => new Set(prev).add(optionValue));
      }
    };

    const handleCleanSelections = () => {
      setSelectedValues(new Set());
    };

    useImperativeHandle(ref, () => ({
      cleanSelections() {
        setIsCleaned(true);
        setSelectedValues(new Set());
      },
    }));

    useEffect(() => {
      if (isCleaned) setIsCleaned(false);
      else onUpdateFilter(title, Array.from(selectedValues));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedValues, isCleaned]);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="group h-8 border-2 border-primary text-primary hover:bg-primary hover:!text-accent-light capitalize"
          >
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            {label ?? title}
            {selectedValues?.size > 0 && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-2 h-4 w-[1.5px] bg-primary group-hover:bg-accent-light"
                />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-medium bg-green-50 group-hover:bg-primary-light group-hover:text-accent lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden space-x-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-medium bg-green-50 group-hover:bg-primary-light group-hover:text-accent"
                    >
                      {selectedValues.size} seleccionados
                    </Badge>
                  ) : (
                    options
                      .filter((option) => selectedValues.has(option.value))
                      .map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-medium bg-green-50 group-hover:bg-primary-light group-hover:text-accent max-w-28 text-ellipsis overflow-hidden whitespace-nowrap inline-block"
                        >
                          {formatter(option.value)}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={label ?? title}
              className="capitalize"
            />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      className="cursor-pointer"
                      onSelect={() => handleOnSelect(option.value, isSelected)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border-2 border-primary",
                          isSelected
                            ? "bg-primary-light text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <CheckIcon
                          strokeWidth={3}
                          className="h-4 w-4 text-accent"
                        />
                      </div>
                      <span className="font-normal pr-3">
                        {formatter(option.value)}
                      </span>
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono font-normal text-xs">
                        {option.count}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCleanSelections}
                      className="justify-center text-center cursor-pointer font-medium"
                    >
                      Limpiar filtros
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
