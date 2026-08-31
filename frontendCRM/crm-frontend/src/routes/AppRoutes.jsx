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

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";

function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                {/* =========================
                    PUBLIC
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
                    PROTECTED APPLICATION
                ========================= */}

                <Route element={<ProtectedRoute />}>

                    <Route element={<MainLayout />}>

                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/deals"
                            element={<Deals />}
                        />

                        <Route
                            path="/deal/:id"
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
                            path="/users"
                            element={<Users />}
                        />

                        <Route
                            path="/pipelines"
                            element={<Pipeline />}
                        />

                    </Route>

                </Route>


                {/* =========================
                    FALLBACK
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;