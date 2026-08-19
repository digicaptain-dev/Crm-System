import { Outlet } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";

import "../../styles/layout/layout.css";

function MainLayout() {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="app-main">

        <Header />

        <main className="app-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MainLayout;