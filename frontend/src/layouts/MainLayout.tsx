import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default MainLayout;