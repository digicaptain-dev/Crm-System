import { NavLink } from "react-router-dom";

import "../../styles/layout/sidebar.css";

function Sidebar() {
  return (
    <aside className="app-sidebar">

      <div className="sidebar-logo">

        <div className="sidebar-logo-mark">
          CRM
        </div>

        <span>
          CRM System
        </span>

      </div>

      <nav className="sidebar-navigation">

        <div className="sidebar-section-title">
          MAIN
        </div>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-icon">
            ▦
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>

        <NavLink
          to="/pipelines"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">
            ◈
          </span>

          <span>
            Pipelines
          </span>
        </NavLink>

        <NavLink
          to="/deals"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-icon">
            ◈
          </span>

          <span>
            Deals
          </span>
        </NavLink>


        <NavLink
          to="/activities"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">
            ◷
          </span>

          <span>
            Activities
          </span>
        </NavLink>

        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">
            ◉
          </span>

          <span>
            Contacts
          </span>
        </NavLink>

        <NavLink
          to="/companies"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">
            ◉
          </span>

          <span>
            Companies
          </span>
        </NavLink>

        <div className="sidebar-section-title">
          MANAGEMENT
        </div>

        <NavLink
          to="/users"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-icon">
            ♙
          </span>

          <span>
            Users
          </span>
        </NavLink>

        <NavLink
          to="/leads"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-icon">
            ◈
          </span>

          <span>
            Leads
          </span>
        </NavLink>

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
              Company Admin
            </div>
          </div>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;