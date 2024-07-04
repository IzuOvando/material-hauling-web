"use client";
import { useMemo } from 'react';
import { useTable, Column } from 'react-table';

interface RowData {
  [key: string]: any;
}

interface TableViewerProps {
  data: RowData[];
}

export default function TableViewer({ data }: TableViewerProps) {
  const columns: Column<RowData>[] = useMemo(() => {
    if (data.length === 0) {
      return [];
    }
    return Object.keys(data[0]).map((key) => ({
      Header: key,
      accessor: key,
    }));
  }, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
  });

  return (
    <div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} key={column.id}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} key={cell.column.id}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

