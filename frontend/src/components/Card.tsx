import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

function Card({ children }: Props) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

export default Card;