import { NavLink } from "react-router-dom";
import "../../styles/layout/sidebar.css";

function Sidebar() {
  // Get logged-in user
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("Failed to read logged-in user:", error);
  }

  const isUser = user?.role === "user";
  const isAdmin = user?.role === "admin";

  return (
    <aside className="app-sidebar">

      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          CRM
        </div>

        <span>CRM System</span>
      </div>

      <nav className="sidebar-navigation">

        <div className="sidebar-section-title">
          MAIN
        </div>

        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">▦</span>
          <span>Dashboard</span>
        </NavLink>

        {/* Pipelines */}
        <NavLink
          to="/pipelines"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◈</span>
          <span>Pipelines</span>
        </NavLink>

        {/* Deals */}
        <NavLink
          to="/deals"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◈</span>
          <span>Deals</span>
        </NavLink>

        {/* Activities */}
        <NavLink
          to="/activities"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◷</span>
          <span>Activities</span>
        </NavLink>

        {/* Contacts */}
        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◉</span>
          <span>Contacts</span>
        </NavLink>

        {/* Companies */}
        <NavLink
          to="/companies"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◉</span>
          <span>Companies</span>
        </NavLink>

        {/* ================================
            MANAGEMENT
            Only Admin can see this section
           ================================= */}
        {isAdmin && (
          <>
            <div className="sidebar-section-title">
              MANAGEMENT
            </div>

            {/* Users */}
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">♙</span>
              <span>Users</span>
            </NavLink>

            {/* Leads */}
            <NavLink
              to="/leads"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">◈</span>
              <span>Leads</span>
            </NavLink>
          </>
        )}

      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-company">

          <div className="company-avatar">
            C
          </div>

          <div>
            <div className="company-name">
              My Company
            </div>

            <div className="company-role">
              {isAdmin ? "Company Admin" : "User"}
            </div>
          </div>

        </div>
      </div>

    </aside>
  );
}

export default Sidebar;