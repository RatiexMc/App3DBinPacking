import type { ReactNode } from "react";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor:
            currentColors.background,
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            padding: "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;