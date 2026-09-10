import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ProfileSettingsModal from "./ProfileSettingsModal";
import "../../styles/layout/sidebar.css";

function Sidebar() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalTab, setModalTab] = useState("profile");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUserUpdated = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("storage", handleUserUpdated);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("storage", handleUserUpdated);
    };
  }, []);

  const isAdmin = user?.role === "admin";
  const userInitial = (user?.name || "U").charAt(0).toUpperCase();
  const userName = user?.name || "User";
  const companyName = user?.company_name || "My Company";

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <img
          src="/brand-logo.png"
          alt="Brand Center USA"
          className="sidebar-brand-img"
        />
      </div>

      <nav className="sidebar-navigation">
        <div className="sidebar-section-title">MAIN</div>

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
            <div className="sidebar-section-title">MANAGEMENT</div>

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
          </>
        )}
      </nav>

      {/* Bottom Profile / Settings Card */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-company interactive"
          onClick={() => {
            setModalTab("profile");
            setShowProfileModal(true);
          }}
          title="Click to view & edit Profile / Settings"
        >
          <div className="company-avatar">{userInitial}</div>

          <div className="company-details">
            <div className="company-name">{userName}</div>
            <div className="company-role">{companyName}</div>
          </div>

          <button
            type="button"
            className="sidebar-settings-quick-btn"
            onClick={(e) => {
              e.stopPropagation();
              setModalTab("security");
              setShowProfileModal(true);
            }}
            title="Security Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialTab={modalTab}
        onUserUpdated={(updated) => setUser(updated)}
      />
    </aside>
  );
}

export default Sidebar;