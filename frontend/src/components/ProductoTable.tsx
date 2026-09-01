import type { Producto } from "../types/Producto";

interface Props {
  productos: Producto[];
}

function ProductoTable({ productos }: Props) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "30px",
      }}
    >
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th>Largo (cm)</th>
          <th>Ancho (cm)</th>
          <th>Altura (cm)</th>
          <th>Apilable</th>
          <th>Categoría</th>
        </tr>
      </thead>

      <tbody>
        {productos.map((producto) => (
          <tr key={producto.codigo}>
            <td>{producto.codigo}</td>
            <td>{producto.descripcion}</td>

            <td>{producto.largo}</td>

            <td>{producto.ancho}</td>

            <td>{producto.alto}</td>

            <td>
              {producto.apilable ? "Sí" : "No"}
            </td>

            <td>{producto.categoria}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductoTable;