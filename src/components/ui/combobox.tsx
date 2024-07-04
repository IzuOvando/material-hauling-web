"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Item {
    value: string;
    label: string;
}

interface ComboBoxProps {
    items: Item[];
    label: string;
    onSelectionChange: (value: string) => void;
}

export function ComboBox({ items, label, onSelectionChange }: ComboBoxProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState("");

    const selectedLabel = items.find(item => item.value === value)?.label || label;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {selectedLabel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${label}...`} />
                    <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup>
                        {items.map((item) => (
                            <CommandItem
                                key={item.value}
                                value={item.value}
                                onSelect={() => {
                                    onSelectionChange(item.value);
                                    setValue(item.value);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={`mr-2 h-4 w-4 ${value === item.value ? "opacity-100" : "opacity-0"}`}
                                />
                                {item.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
