import { NavLink } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";

import { useSidebar } from "../context/SidebarContext";

function Sidebar() {
  const { collapsed } = useSidebar();

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

    color: isActive ? "#1976d2" : "#374151",

    backgroundColor: isActive
      ? "#e3f2fd"
      : "transparent",

    padding: "12px 14px",

    borderRadius: "10px",

    fontWeight: isActive ? 600 : 500,

    transition: "all 0.25s ease",
  });

  return (
    <aside
      style={{
        width: collapsed ? "80px" : "260px",

        minHeight: "100vh",

        backgroundColor: "#ffffff",

        borderRight: "1px solid #e5e7eb",

        padding: "20px",

        display: "flex",
        flexDirection: "column",

        transition: "all 0.25s ease",
      }}
    >
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
                color: "#111827",
              }}
            >
              Darnel Paraguay SA
            </h2>

            <p
              style={{
                marginTop: "6px",
                color: "#6b7280",
                fontSize: "14px",
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

              backgroundColor: "#1976d2",

              color: "#ffffff",

              borderRadius: "10px",

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
          to="/historial"
          style={menuItemStyle}
        >
          <HistoryIcon />
          {!collapsed && "ListPicking"}
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