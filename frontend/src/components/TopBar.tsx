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

import { useSidebar } from "../context/SidebarContext";

function TopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        color: "#111827",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          sx={{ mr: 2 }}
          onClick={toggleSidebar}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
          }}
        >
          Sistema de Optimización de Carga
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton>
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
          <Typography variant="body2">
            Junior
          </Typography>

          <Avatar
            sx={{
              bgcolor: "#1976d2",
              width: 36,
              height: 36,
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
``