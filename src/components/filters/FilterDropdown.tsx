import * as React from "react";
import { useState, useEffect } from "react";
import { ComboBox } from "@/components/ui/combobox";
import TableViewer from './TableView'
import { getFilteredVouchers } from '@/actions/getfilters'
import prisma from "@/lib/db";

interface Filters {
    empresa: string[];
    material: string[];
}

interface SelectedFilters {
    empresa: string;
    material: string;
}

const FilterDropdown: React.FC = () => {
    const [filters, setFilters] = useState<Filters>({ empresa: [], material: [] });
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({ empresa: 'Ninguno', material: 'Ninguno' });
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const usersWithEmpresa = await prisma.ticket.findMany({
                    select: { empresa: true },
                    distinct: ['empresa']
                });

                const usersWithMaterial = await prisma.ticket.findMany({
                    select: { material: true },
                    distinct: ['material']
                });

                const newFilters = {
                    empresa: ['Ninguno', ...usersWithEmpresa.map(u => u.empresa)],
                    material: ['Ninguno', ...usersWithMaterial.map(u => u.material)],
                };

                setFilters(newFilters);
            } catch (error) {
                console.error('Error loading filters:', error);
            }
        };

        loadFilters();
    }, []);

    useEffect(() => {
        const fetchFilteredData = async () => {
            const activeFilters = Object.entries(selectedFilters).reduce<Record<keyof SelectedFilters, string>>((acc, [key, value]) => {
                if (value && value !== 'Ninguno') {
                    acc[key as keyof SelectedFilters] = value;
                }
                return acc;
            }, {} as Record<keyof SelectedFilters, string>);

            const data = await getFilteredVouchers(activeFilters);
            setTableData(data);
        };

        fetchFilteredData();
    }, [selectedFilters]);

    const handleSelect = (filterName: keyof SelectedFilters) => (value: string) => {
        setSelectedFilters(prev => ({ ...prev, [filterName]: value }));
    };

    return (
        <div>
            {Object.entries(filters).map(([filterName, options]) => (
                <ComboBox
                    key={filterName}
                    items={options}
                    label={filterName.charAt(0).toUpperCase() + filterName.slice(1)}
                    onSelectionChange={(value: any) => handleSelect(filterName as keyof SelectedFilters)(value as string)}
                />
            ))}
            <TableViewer data={tableData} />
        </div>
    );
}

export default FilterDropdown;

