import AppRoutes from "./routes/AppRoutes";

import { SidebarProvider } from "./context/SidebarContext";

function App() {
  return (
    <SidebarProvider>
      <AppRoutes />
    </SidebarProvider>
  );
}

export default App;