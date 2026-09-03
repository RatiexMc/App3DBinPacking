import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Productos from "../pages/Productos";
import Camiones from "../pages/Camiones";
import Historial from "../pages/Historial";
import Configuracion from "../pages/Configuracion";
import FotoPicking from "../pages/FotoPicking";
import Optimizacion from "../pages/Optimizacion";
import MainLayout from "../layouts/MainLayout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/productos"
          element={
            <MainLayout>
              <Productos />
            </MainLayout>
          }
        />

        <Route
          path="/camiones"
          element={
            <MainLayout>
              <Camiones />
            </MainLayout>
          }
        />

        <Route
          path="/fotopicking"
          element={
            <MainLayout>
              <FotoPicking />
            </MainLayout>
          }
        />
        <Route
          path="/optimizacion"
          element={
            <MainLayout>
              <Optimizacion />
            </MainLayout>
          }
        />
        <Route
          path="/historial"
          element={
            <MainLayout>
              <Historial />
            </MainLayout>
          }
        />
        <Route
          path="/configuracion"
          element={
            <MainLayout>
              <Configuracion />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;