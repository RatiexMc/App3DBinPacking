interface Props {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

function SearchBar({ value, onChange }: Props) {
  return (
    <input
      className="input-search"
      type="text"
      placeholder="Buscar..."
      value={value}
      onChange={onChange}
    />
  );
}

export default SearchBar;