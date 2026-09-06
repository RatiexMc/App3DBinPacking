import type { ReactNode } from "react";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  selectedRow?: number | null;
  onRowSelect?: (index: number) => void;
}

function DataTable({
  headers,
  rows,
  selectedRow,
  onRowSelect,
}: DataTableProps) {
  // Obtenemos el tema actual
  const { darkMode } = useThemeContext();

  // Seleccionamos la paleta correspondiente
  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <div
      style={{
        backgroundColor: currentColors.card,
        border: `1px solid ${currentColors.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: darkMode
                ? "#1E3A8A"
                : "#F8FAFC",
            }}
          >
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  padding: "14px",
                  textAlign: "left",
                  color: currentColors.textPrimary,
                  borderBottom: `1px solid ${currentColors.border}`,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowSelect?.(rowIndex)}
              style={{
                borderBottom: `1px solid ${currentColors.border}`,

                cursor: "pointer",

                backgroundColor:
                  selectedRow === rowIndex
                    ? darkMode
                      ? "#1E40AF"
                      : "#DBEAFE"
                    : "transparent",
              }}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: "14px",
                    color: currentColors.textPrimary,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;