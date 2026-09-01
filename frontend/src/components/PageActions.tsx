import SearchBar from "./SearchBar";
import ActionButton from "./ActionButton";

interface PageActionsProps {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

function PageActions({
  value,
  onChange,
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
      <SearchBar
        value={value}
        onChange={onChange}
      />

      <ActionButton text="Añadir" />

      <ActionButton text="Modificar" />

      <ActionButton text="Borrar" />
    </div>
  );
}

export default PageActions;