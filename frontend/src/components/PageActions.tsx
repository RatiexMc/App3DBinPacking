import SearchBar from "./SearchBar";
import ActionButton from "./ActionButton";

interface PageActionsProps {
  value: string;

  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onAdd?: () => void;

  onDelete?: () => void;
}

function PageActions({
  value,
  onChange,
  onAdd,
  onDelete,
}: PageActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "30px",
      }}
    >
      {/* Buscador */}
      <SearchBar
        value={value}
        onChange={onChange}
      />

      {/* Futuro POST */}

      <ActionButton

      text="Añadir"
      
      onClick={onAdd}
      
    />

      {/* Futuro PUT */}
      <ActionButton text="Modificar" />

      {/* DELETE */}
      <ActionButton
        text="Borrar"
        onClick={onDelete}
      />
    </div>
  );
}

export default PageActions;
``