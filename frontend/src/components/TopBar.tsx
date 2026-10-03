import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import { useSesion } from "../context/authStore";
import { API_URL } from "../services/api";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { colors } from "../theme/colors";
import { useSidebar } from "../context/SidebarContext";
import { useThemeContext } from "../theme/ThemeContext";

function TopBar() {
  const { usuario } = useSesion();
  const { toggleSidebar } = useSidebar();

  const {
    darkMode,
    toggleTheme,
  } = useThemeContext();

  const currentColors = darkMode
    ? colors.dark
    : colors.light;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: currentColors.topbar,
        color: currentColors.textPrimary,
        borderBottom: `1px solid ${currentColors.border}`,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          aria-label="Mostrar u ocultar menú"
          onClick={toggleSidebar}
          sx={{
            mr: 2,
            color: currentColors.textPrimary,
          }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: currentColors.textPrimary,
          }}
        >
          Sistema de Optimización de Carga
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          sx={{
            color: currentColors.textSecondary,
          }}
        >
          {darkMode ? (
            <LightModeIcon />
          ) : (
            <DarkModeIcon />
          )}
        </IconButton>

        <Box
          component={Link}
          to="/configuracion"
          aria-label="Abrir mi perfil"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            ml: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: currentColors.textPrimary,
              fontWeight: 500,
            }}
          >
            {usuario?.nombre}
          </Typography>

          <Avatar
            src={usuario?.foto_revision ? API_URL + "/auth/foto?v=" + usuario.foto_revision : undefined}
            sx={{
              bgcolor: currentColors.primary,
              color: "#ffffff",
              width: 36,
              height: 36,
              fontWeight: 700,
            }}
          >
            {usuario?.nombre.slice(0, 1).toUpperCase()}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
