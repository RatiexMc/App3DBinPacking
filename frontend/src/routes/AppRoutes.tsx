import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Productos from "../pages/Productos";
import Camiones from "../pages/Camiones";
import Historial from "../pages/Historial";
import Configuracion from "../pages/Configuracion";
import FotoPicking from "../pages/FotoPicking";
import Optimizacion from "../pages/Optimizacion";
import Acceso from "../pages/Acceso";
import MainLayout from "../layouts/MainLayout";
import { comprobarSesion, useSesion } from "../context/authStore";

function Protegida() {
  const { usuario, cargando } = useSesion();
  if (cargando) return <p className="session-loading" role="status">Comprobando sesión…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  return <MainLayout><Outlet /></MainLayout>;
}
export default function AppRoutes() {
  useEffect(() => { void comprobarSesion(); }, []);
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Acceso />} />
    <Route path="/registro" element={<Acceso registro />} />
    <Route element={<Protegida />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/productos" element={<Productos />} />
      <Route path="/camiones" element={<Camiones />} />
      <Route path="/fotopicking" element={<FotoPicking />} />
      <Route path="/optimizacion" element={<Optimizacion />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/configuracion" element={<Configuracion />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}

