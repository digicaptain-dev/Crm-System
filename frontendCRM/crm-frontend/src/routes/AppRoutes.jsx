import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Activities from "../pages/Activities";
import Users from "../pages/Users";
import Deals from "../pages/Deals";
import DealDetails from "../pages/DealDetails";
import Leads from "../pages/Leads";
import LeadDetails from "../pages/LeadDetails";
import Contacts from "../pages/Contacts";
import Companies from "../pages/Companies";
import Pipeline from "../pages/Pipeline";

function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* CRM */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={<MainLayout />}
          >

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/activities"
              element={<Activities />}
            />

            <Route
              path="/users"
              element={<Users />}
            />

            <Route
              path="/deals"
              element={<Deals />}
            />

            <Route
              path="/deals/:id"
              element={<DealDetails />}
            />

            <Route
              path="/leads"
              element={<Leads />}
            />

            <Route
              path="/lead/:id"
              element={<LeadDetails />}
            />

            <Route
              path="/activities"
              element={<Activities />}
            />

            <Route
              path="/contacts"
              element={<Contacts />}
            />

            <Route
              path="/companies"
              element={<Companies />}
            />

            <Route
              path="/pipelines"
              element={<Pipeline />}
            />

          </Route>

        </Route>
      </Routes>


    </BrowserRouter>
  );
}

export default AppRoutes;