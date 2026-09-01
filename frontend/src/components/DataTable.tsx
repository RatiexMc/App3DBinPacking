import type { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
}

function DataTable({
  headers,
  rows,
}: DataTableProps) {
  return (
    <div className="datatable-container">
      <table className="datatable">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;