import { NavLink } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useSidebar } from "../context/SidebarContext";
import { useThemeContext } from "../theme/ThemeContext";
import { colors } from "../theme/colors";

function Sidebar() {
  const { collapsed } = useSidebar();

  const { darkMode } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  // Estilo de cada opción del menú
  const menuItemStyle = ({
    isActive,
  }: {
    isActive: boolean;
  }) => ({
    display: "flex",

    alignItems: "center",

    justifyContent: collapsed
      ? "center"
      : "flex-start",

    gap: "12px",

    textDecoration: "none",

    // Azul solamente para la opción activa
    color: isActive
      ? currentColors.primary
      : currentColors.textSecondary,

    // Fondo suave para opción activa
    backgroundColor: isActive
      ? currentColors.primaryLight
      : "transparent",

    padding: collapsed
      ? "12px"
      : "12px 14px",

    borderRadius: "10px",

    fontWeight: isActive ? 700 : 500,

    transition: "all 0.25s ease",
  });

  return (
    <aside
      style={{
        width: collapsed ? "80px" : "260px",

        minHeight: "100vh",

        backgroundColor: currentColors.sidebar,

        borderRight: `1px solid ${currentColors.border}`,

        padding: "20px",

        display: "flex",

        flexDirection: "column",

        transition: "all 0.25s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          marginBottom: "40px",
          textAlign: "center",
        }}
      >
        {!collapsed ? (
          <>
            <h2
              style={{
                margin: 0,

                fontSize: "20px",

                fontWeight: 700,

                letterSpacing: "-0.5px",

                color: currentColors.textPrimary,
              }}
            >
              Darnel Paraguay SA
            </h2>

            <p
              style={{
                marginTop: "8px",

                fontSize: "13px",

                fontWeight: 500,

                color: currentColors.textSecondary,
              }}
            >
              Sistema de Optimización
            </p>
          </>
        ) : (
          <div
            style={{
              width: "40px",

              height: "40px",

              margin: "0 auto",

              borderRadius: "10px",

              backgroundColor:
                currentColors.primary,

              color: "#ffffff",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontWeight: 700,

              fontSize: "18px",
            }}
          >
            D
          </div>
        )}
      </div>

      {/* Menú */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <NavLink to="/" style={menuItemStyle}>
          <DashboardIcon />
          {!collapsed && "Dashboard"}
        </NavLink>

        <NavLink
          to="/productos"
          style={menuItemStyle}
        >
          <Inventory2Icon />
          {!collapsed && "Productos"}
        </NavLink>

        <NavLink
          to="/camiones"
          style={menuItemStyle}
        >
          <LocalShippingIcon />
          {!collapsed && "Camiones"}
        </NavLink>

        <NavLink
          to="/fotopicking"
          style={menuItemStyle}
        >
          <PhotoCameraIcon />
          {!collapsed && "FotoPicking"}
        </NavLink>

        <NavLink
          to="/optimizacion"
          style={menuItemStyle}
        >
          <PsychologyIcon />
          {!collapsed && "Optimización"}
        </NavLink>
        <NavLink
          to="/historial"
          style={menuItemStyle}
        >
          <HistoryIcon />
          {!collapsed && "Historial"}
        </NavLink>

        <NavLink
          to="/configuracion"
          style={menuItemStyle}
        >
          <SettingsIcon />
          {!collapsed && "Configuración"}
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;