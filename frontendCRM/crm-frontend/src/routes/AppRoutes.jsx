import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Activities from "../pages/Activities";
import Users from "../pages/Users";
import DealDetails from "../pages/DealDetails";
import LeadDetails from "../pages/LeadDetails";
import Leads from "../pages/Leads";
import Pipeline from "../pages/Pipeline";
import Deals from "../pages/Deals";

// import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            Public Routes
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            Protected Application
        ========================= */}

        {/* <Route element={<ProtectedRoute />}> */}

          {/* Main Layout
              Sidebar + Header + Outlet
          */}
          <Route element={<MainLayout />}>

            {/* Dashboard */}
            <Route
              path="/"
              element={<Dashboard />}
            />

            {/* Deals */}
            <Route
              path="/deal/:id"
              element={<DealDetails />}
            />

            <Route
              path="/deals"
              element={<Deals />}
            />

            {/* Leads */}
            <Route
              path="/leads"
              element={<Leads />}
            />

            {/* Lead Details */}
            <Route
              path="/lead/:id"
              element={<LeadDetails />}
            />

            {/* Activities */}
            <Route
              path="/activities"
              element={<Activities />}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<Users />}
            />

            {/* Pipeline */}
            <Route
              path="/pipelines"
              element={<Pipeline />}
            />

          </Route>

        {/* </Route> */}


        {/* =========================
            Fallback
        ========================= */}

        {/* <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;