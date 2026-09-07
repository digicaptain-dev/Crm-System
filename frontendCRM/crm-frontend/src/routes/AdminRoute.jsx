import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRoute() {
    const location = useLocation();

    const token = localStorage.getItem("token");

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Failed to parse user data:", error);
    }

    // Not logged in
    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );
    }

    // Logged-in user but not admin
    if (user?.role !== "admin") {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
}

export default AdminRoute;