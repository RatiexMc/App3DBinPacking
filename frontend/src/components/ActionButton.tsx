interface Props {
  text: string;
}

function ActionButton({ text }: Props) {
  return (
    <button className="primary-button">
      {text}
    </button>
  );
}

export default ActionButton;