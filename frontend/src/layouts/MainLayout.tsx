import type { ReactNode } from "react";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

import "../styles/layout.css";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content-area">
        <TopBar />

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;