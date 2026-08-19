import { useState } from "react";

import "../../styles/layout/header.css";

function Header() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="app-header">

      <div className="header-left">

        <button
          className="mobile-menu-button"
          type="button"
        >
          ☰
        </button>

        <div className="header-title">
          CRM
        </div>

      </div>

      <div className="header-right">

        <button
          className="header-icon-button"
          type="button"
          title="Notifications"
        >
          🔔
        </button>

        <div className="header-profile">

          <button
            className="profile-button"
            type="button"
            onClick={() =>
              setShowMenu(!showMenu)
            }
          >

            <div className="profile-avatar">
              A
            </div>

            <div className="profile-info">

              <span className="profile-name">
                Admin
              </span>

              <span className="profile-role">
                Company Admin
              </span>

            </div>

            <span className="profile-arrow">
              ▼
            </span>

          </button>

          {showMenu && (
            <div className="profile-menu">

              <button type="button">
                Profile
              </button>

              <button type="button">
                Settings
              </button>

              <button type="button">
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Header;