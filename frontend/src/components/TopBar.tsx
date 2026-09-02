import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { colors } from "../theme/colors";
import { useSidebar } from "../context/SidebarContext";
import { useThemeContext } from "../theme/ThemeContext";

function TopBar() {
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

        <IconButton
          sx={{
            color: currentColors.textSecondary,
          }}
        >
          <NotificationsNoneIcon />
        </IconButton>

        <Box
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
            Junior
          </Typography>

          <Avatar
            sx={{
              bgcolor: currentColors.primary,
              color: "#ffffff",
              width: 36,
              height: 36,
              fontWeight: 700,
            }}
          >
            J
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;