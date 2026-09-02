import AppRoutes from "./routes/AppRoutes";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./theme/ThemeContext";

function App() {
return (
<ThemeProvider>
<SidebarProvider>
<AppRoutes />
</SidebarProvider>
</ThemeProvider>
);
}

export default App;