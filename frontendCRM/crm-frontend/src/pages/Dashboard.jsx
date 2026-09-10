import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import "../styles/dashboard/dashboard.css";

// Stage color palette
const STAGE_THEMES = [
  { accent: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", text: "#1d4ed8", border: "#bfdbfe" },
  { accent: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", text: "#6d28d9", border: "#ddd6fe" },
  { accent: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", text: "#0e7490", border: "#a5f3fc" },
  { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", text: "#b45309", border: "#fde68a" },
  { accent: "#ec4899", bg: "rgba(236, 72, 153, 0.08)", text: "#be185d", border: "#fbcfe8" },
  { accent: "#10b981", bg: "rgba(16, 185, 129, 0.08)", text: "#047857", border: "#a7f3d0" },
];

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // USER SESSION & ROLE
  // =====================================================

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Failed to read user from localStorage:", err);
  }
  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?.user_id || currentUser?.id;
  const currentUserName = currentUser?.name || "User";

  // =====================================================
  // STATE
  // =====================================================

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("all");
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [timeFilter, setTimeFilter] = useState("all"); // "all" | "30days" | "thisYear"

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await api.get("/pipelines");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];
      setPipelines(data);
      return data;
    } catch (err) {
      console.error("Fetch pipelines error:", err);
      return [];
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const response = await api.get("/deals?limit=1000&page=1");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.deals || [];
      setDeals(data);
      return data;
    } catch (err) {
      console.error("Fetch deals error:", err);
      return [];
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return [];
    try {
      const response = await api.get("/users");
      const data = response.data?.users || (Array.isArray(response.data) ? response.data : []);
      setUsers(data);
      return data;
    } catch (err) {
      console.error("Fetch users error:", err);
      return [];
    }
  }, [isAdmin]);

  // Initial Load
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([fetchPipelines(), fetchDeals(), fetchUsers()]);
      } catch (err) {
        setError("Failed to load analytics dashboard.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [fetchPipelines, fetchDeals, fetchUsers]);

  // Refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await Promise.all([fetchPipelines(), fetchDeals(), fetchUsers()]);
    } catch (err) {
      setError("Failed to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // FILTERED DATA BY PIPELINE
  // =====================================================

  const scopedDeals = useMemo(() => {
    let list = deals;

    // Filter by pipeline if not "all"
    if (selectedPipelineId !== "all") {
      list = list.filter(
        (d) => String(d.pipeline_id) === String(selectedPipelineId)
      );
    }

    return list;
  }, [deals, selectedPipelineId]);

  // =====================================================
  // KPI CALCULATIONS (ADMIN & USER)
  // =====================================================

  const stats = useMemo(() => {
    const totalDeals = scopedDeals.length;
    const openDeals = scopedDeals.filter(
      (d) => !d.deal_status || d.deal_status.toLowerCase() === "open"
    );
    const wonDeals = scopedDeals.filter(
      (d) => d.deal_status && d.deal_status.toLowerCase() === "won"
    );
    const lostDeals = scopedDeals.filter(
      (d) => d.deal_status && d.deal_status.toLowerCase() === "lost"
    );

    const totalPipelineValue = scopedDeals.reduce(
      (acc, d) => acc + Number(d.deal_value || 0),
      0
    );

    const openPipelineValue = openDeals.reduce(
      (acc, d) => acc + Number(d.deal_value || 0),
      0
    );

    const wonPipelineValue = wonDeals.reduce(
      (acc, d) => acc + Number(d.deal_value || 0),
      0
    );

    const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
    const avgDealValue = totalDeals > 0 ? Math.round(totalPipelineValue / totalDeals) : 0;

    // Priority Counts
    const highPriority = scopedDeals.filter(
      (d) => (d.deal_priority || "").toLowerCase() === "high"
    ).length;
    const mediumPriority = scopedDeals.filter(
      (d) => (d.deal_priority || "").toLowerCase() === "medium"
    ).length;
    const lowPriority = scopedDeals.filter(
      (d) => (d.deal_priority || "").toLowerCase() === "low"
    ).length;

    // Assigned vs Unassigned
    const unassignedCount = scopedDeals.filter((d) => !d.assign_to).length;
    const assignedCount = totalDeals - unassignedCount;

    return {
      totalDeals,
      openCount: openDeals.length,
      openPipelineValue,
      wonCount: wonDeals.length,
      wonPipelineValue,
      lostCount: lostDeals.length,
      totalPipelineValue,
      avgDealValue,
      winRate,
      highPriority,
      mediumPriority,
      lowPriority,
      unassignedCount,
      assignedCount,
      totalUsers: users.length,
    };
  }, [scopedDeals, users]);

  // =====================================================
  // USER ASSIGNMENT BREAKDOWN (ADMIN VIEW)
  // =====================================================

  const userAssignments = useMemo(() => {
    if (!isAdmin) return [];

    // Map each user with their deals
    const list = users.map((u) => {
      const userDeals = deals.filter(
        (d) => String(d.assign_to) === String(u.user_id)
      );

      const openDeals = userDeals.filter(
        (d) => !d.deal_status || d.deal_status.toLowerCase() === "open"
      );
      const wonDeals = userDeals.filter(
        (d) => d.deal_status && d.deal_status.toLowerCase() === "won"
      );

      const totalValue = userDeals.reduce(
        (acc, d) => acc + Number(d.deal_value || 0),
        0
      );

      const percentage = deals.length > 0 ? Math.round((userDeals.length / deals.length) * 100) : 0;

      return {
        userId: u.user_id,
        name: u.name || "Unnamed User",
        email: u.email || "-",
        role: u.role || "user",
        dealCount: userDeals.length,
        openCount: openDeals.length,
        wonCount: wonDeals.length,
        totalValue,
        percentage,
      };
    });

    // Add unassigned bucket if there are unassigned deals
    const unassignedDeals = deals.filter((d) => !d.assign_to);
    if (unassignedDeals.length > 0) {
      const unassignedValue = unassignedDeals.reduce(
        (acc, d) => acc + Number(d.deal_value || 0),
        0
      );
      list.push({
        userId: "unassigned",
        name: "Unassigned Deals",
        email: "Pending Assignment",
        role: "unassigned",
        dealCount: unassignedDeals.length,
        openCount: unassignedDeals.filter((d) => !d.deal_status || d.deal_status.toLowerCase() === "open").length,
        wonCount: unassignedDeals.filter((d) => d.deal_status && d.deal_status.toLowerCase() === "won").length,
        totalValue: unassignedValue,
        percentage: deals.length > 0 ? Math.round((unassignedDeals.length / deals.length) * 100) : 0,
      });
    }

    // Sort by total deals descending
    return list.sort((a, b) => b.dealCount - a.dealCount);
  }, [isAdmin, users, deals]);

  // =====================================================
  // STAGE BREAKDOWN GRAPH DATA
  // =====================================================

  const stageBreakdown = useMemo(() => {
    // Gather all stages across pipelines or current pipeline
    const stagesList = [];

    pipelines.forEach((p) => {
      if (selectedPipelineId !== "all" && String(p.pipeline_id) !== String(selectedPipelineId)) {
        return;
      }
      (p.stages || []).forEach((st) => {
        stagesList.push({
          stageId: st.stage_id,
          stageName: st.stage_name,
          stageOrder: st.stage_order || 0,
        });
      });
    });

    // Deduplicate stages
    const uniqueStages = [];
    const seen = new Set();
    stagesList.sort((a, b) => a.stageOrder - b.stageOrder).forEach((st) => {
      if (!seen.has(st.stageId)) {
        seen.add(st.stageId);
        uniqueStages.push(st);
      }
    });

    const maxDeals = scopedDeals.length || 1;

    return uniqueStages.map((st, idx) => {
      const stageDeals = scopedDeals.filter(
        (d) => String(d.deal_stage) === String(st.stageId)
      );

      const stageValue = stageDeals.reduce(
        (sum, d) => sum + Number(d.deal_value || 0),
        0
      );

      const pct = Math.round((stageDeals.length / maxDeals) * 100);
      const theme = STAGE_THEMES[idx % STAGE_THEMES.length];

      return {
        ...st,
        count: stageDeals.length,
        value: stageValue,
        percentage: pct,
        theme,
      };
    });
  }, [pipelines, scopedDeals, selectedPipelineId]);

  // =====================================================
  // TOP / RECENT DEALS
  // =====================================================

  const recentDeals = useMemo(() => {
    return [...scopedDeals]
      .sort((a, b) => Number(b.deal_value || 0) - Number(a.deal_value || 0))
      .slice(0, 6);
  }, [scopedDeals]);

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-state">
          <div className="dashboard-spinner" />
          <h3>Loading CRM Analytics & Stats...</h3>
          <p>Analyzing team performance, deals distribution, and pipeline health.</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dashboard-container">
      {/* =================================================
          TOP HERO / WELCOME CARD
      ================================================= */}
      <div className="analytics-hero-card">
        <div className="hero-left">
          <div className="user-role-badge">
            <span className="live-dot" />
            {isAdmin ? "Admin Overview & Intelligence" : "My Sales Performance"}
          </div>
          <h1 className="hero-title">
            Welcome back, {currentUserName} 👋
          </h1>
          <p className="hero-subtitle">
            {isAdmin
              ? "Comprehensive analytics of your entire sales organization, team deal assignments, and revenue streams."
              : "Here is the performance overview and stage progression of your assigned deals."}
          </p>
        </div>

        <div className="hero-right-actions">
          {/* Pipeline filter */}
          <div className="analytics-select-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="analytics-dropdown"
            >
              <option value="all">All Pipelines</option>
              {pipelines.map((p) => (
                <option key={p.pipeline_id} value={p.pipeline_id}>
                  {p.pipeline_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`btn-secondary ${refreshing ? "is-refreshing" : ""}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg
              className={`refresh-icon ${refreshing ? "spin-animation" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Refresh
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/deals")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            View All Deals
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR ALERT
      ================================================= */}
      {error && (
        <div className="dashboard-alert-banner">
          <div className="alert-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="alert-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================
          PRIMARY STATS / KPI GRID
      ================================================= */}
      <div className="analytics-kpi-grid">
        {/* 1. Total Deals */}
        <div className="stat-box card-blue">
          <div className="stat-top">
            <span className="stat-label">
              {isAdmin ? "Total Deals Managed" : "My Assigned Deals"}
            </span>
            <div className="stat-icon-wrap icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div className="stat-number">{stats.totalDeals}</div>
          <div className="stat-sub-row">
            <span className="stat-pill pill-blue">
              {stats.openCount} Open Active
            </span>
            <span className="stat-muted">
              {stats.lostCount} Lost
            </span>
          </div>
        </div>

        {/* 2. Active Opportunities */}
        <div className="stat-box card-indigo">
          <div className="stat-top">
            <span className="stat-label">
              {isAdmin ? "Active Opportunities" : "My Active Deals"}
            </span>
            <div className="stat-icon-wrap icon-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-number">
            {stats.openCount}
          </div>
          <div className="stat-sub-row">
            <span className="stat-pill pill-indigo">
              {stats.totalDeals > 0 ? Math.round((stats.openCount / stats.totalDeals) * 100) : 0}% of all deals
            </span>
          </div>
        </div>

        {/* 3. Won Deals & Win Rate */}
        <div className="stat-box card-emerald">
          <div className="stat-top">
            <span className="stat-label">Won Deals</span>
            <div className="stat-icon-wrap icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="stat-number text-emerald">
            {stats.wonCount}
          </div>
          <div className="stat-sub-row">
            <span className="stat-pill pill-emerald">
              {stats.winRate}% Win Rate
            </span>
          </div>
        </div>

        {/* 4. Admin: Total Team / User: High Priority */}
        {isAdmin ? (
          <div className="stat-box card-violet">
            <div className="stat-top">
              <span className="stat-label">Team & Reps</span>
              <div className="stat-icon-wrap icon-violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-sub-row">
              <span className="stat-pill pill-violet">
                {stats.assignedCount} Deals Assigned
              </span>
              {stats.unassignedCount > 0 && (
                <span className="stat-pill pill-amber">
                  {stats.unassignedCount} Unassigned
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="stat-box card-amber">
            <div className="stat-top">
              <span className="stat-label">High Priority Deals</span>
              <div className="stat-icon-wrap icon-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="stat-number text-amber">{stats.highPriority}</div>
            <div className="stat-sub-row">
              <span className="stat-pill pill-amber">Needs Attention</span>
            </div>
          </div>
        )}

        {/* 5. Overall Win Rate */}
        <div className="stat-box card-slate">
          <div className="stat-top">
            <span className="stat-label">Win Rate</span>
            <div className="stat-icon-wrap icon-slate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
          </div>
          <div className="stat-number">
            {stats.winRate}%
          </div>
          <div className="stat-sub-row">
            <span className="stat-muted">{stats.wonCount} won of {stats.totalDeals} total</span>
          </div>
        </div>
      </div>

      {/* =================================================
          ANALYTICS GRAPHS & SECTION ROW
      ================================================= */}
      <div className="analytics-charts-grid">
        {/* Graph 1: Pipeline Stage Conversion / Distribution Bar Chart */}
        <div className="chart-panel-card">
          <div className="chart-header">
            <div className="chart-header-left">
              <h3 className="chart-title">Pipeline Stage Distribution</h3>
              <p className="chart-subtitle">
                Deals count across each pipeline stage
              </p>
            </div>
            <span className="chart-badge">
              {stageBreakdown.length} Stages
            </span>
          </div>

          <div className="stage-bars-container">
            {stageBreakdown.length === 0 ? (
              <div className="chart-empty-state">
                <p>No stage data found for this pipeline.</p>
              </div>
            ) : (
              stageBreakdown.map((st) => (
                <div key={st.stageId} className="stage-bar-item">
                  <div className="stage-bar-label-row">
                    <div className="stage-name-wrap">
                      <span
                        className="stage-dot"
                        style={{ backgroundColor: st.theme.accent }}
                      />
                      <span className="stage-name-text">{st.stageName}</span>
                    </div>

                    <div className="stage-stats-wrap">
                      <span className="stage-deal-count">
                        <strong>{st.count}</strong> {st.count === 1 ? "deal" : "deals"}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="stage-progress-track">
                    <div
                      className="stage-progress-fill"
                      style={{
                        width: `${Math.max(st.percentage, st.count > 0 ? 6 : 0)}%`,
                        backgroundColor: st.theme.accent,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Graph 2: Deal Priority & Health Breakdown */}
        <div className="chart-panel-card">
          <div className="chart-header">
            <div className="chart-header-left">
              <h3 className="chart-title">Deal Priority & Pipeline Health</h3>
              <p className="chart-subtitle">Opportunities categorized by urgency & stage</p>
            </div>
          </div>

          <div className="priority-health-content">
            {/* Priority Progress Bars */}
            <div className="priority-bars-group">
              {/* High Priority */}
              <div className="priority-item">
                <div className="priority-item-header">
                  <span className="priority-badge-label priority-high">
                    ● High Priority
                  </span>
                  <span className="priority-count-val">
                    {stats.highPriority} deals (
                    {stats.totalDeals > 0
                      ? Math.round((stats.highPriority / stats.totalDeals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="priority-track">
                  <div
                    className="priority-fill fill-high"
                    style={{
                      width: `${stats.totalDeals > 0 ? (stats.highPriority / stats.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Medium Priority */}
              <div className="priority-item">
                <div className="priority-item-header">
                  <span className="priority-badge-label priority-medium">
                    ● Medium Priority
                  </span>
                  <span className="priority-count-val">
                    {stats.mediumPriority} deals (
                    {stats.totalDeals > 0
                      ? Math.round((stats.mediumPriority / stats.totalDeals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="priority-track">
                  <div
                    className="priority-fill fill-medium"
                    style={{
                      width: `${stats.totalDeals > 0 ? (stats.mediumPriority / stats.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Low Priority */}
              <div className="priority-item">
                <div className="priority-item-header">
                  <span className="priority-badge-label priority-low">
                    ● Low Priority
                  </span>
                  <span className="priority-count-val">
                    {stats.lowPriority} deals (
                    {stats.totalDeals > 0
                      ? Math.round((stats.lowPriority / stats.totalDeals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="priority-track">
                  <div
                    className="priority-fill fill-low"
                    style={{
                      width: `${stats.totalDeals > 0 ? (stats.lowPriority / stats.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Health Snapshot Cards */}
            <div className="health-snapshot-grid">
              <div className="health-pill-card open-health">
                <span className="health-label">Open Active</span>
                <strong>{stats.openCount} Deals</strong>
                <span className="health-sub">Active in pipeline</span>
              </div>

              <div className="health-pill-card won-health">
                <span className="health-label">Closed Won</span>
                <strong>{stats.wonCount} Deals</strong>
                <span className="health-sub">{stats.winRate}% Win Rate</span>
              </div>

              <div className="health-pill-card lost-health">
                <span className="health-label">Closed Lost</span>
                <strong>{stats.lostCount} Deals</strong>
                <span className="health-sub">Requires Follow-up</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          ADMIN EXCLUSIVE: TEAM DEAL ASSIGNMENTS (KISKO KITNA ASSIGNED H)
      ================================================= */}
      {isAdmin && (
        <div className="analytics-section-card">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Team Workload & Deal Distribution</h3>
              <p className="section-subtitle">
                Overview of assigned deals, active volume, and status breakdown per sales rep / user.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/users")}
            >
              Manage Users
            </button>
          </div>

          <div className="team-distribution-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th>Assigned Deals</th>
                  <th>Active / Open</th>
                  <th>Won Deals</th>
                  <th>Workload Share</th>
                </tr>
              </thead>
              <tbody>
                {userAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty-cell">
                      No team members or deal assignments found.
                    </td>
                  </tr>
                ) : (
                  userAssignments.map((u) => {
                    const isUnassignedBucket = u.userId === "unassigned";

                    return (
                      <tr key={u.userId} className={isUnassignedBucket ? "unassigned-row" : ""}>
                        {/* Member */}
                        <td>
                          <div className="member-info-cell">
                            <div className={`member-avatar ${isUnassignedBucket ? "avatar-unassigned" : ""}`}>
                              {isUnassignedBucket ? "⚠️" : (u.name.charAt(0).toUpperCase() || "U")}
                            </div>
                            <div className="member-text">
                              <strong>{u.name}</strong>
                              <small>{u.email}</small>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <span className={`role-pill role-${u.role}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Assigned Deals Count */}
                        <td>
                          <span className="deal-count-badge">
                            <strong>{u.dealCount}</strong> deals
                          </span>
                        </td>

                        {/* Open Deals */}
                        <td>
                          <span className="status-pill status-open">
                            {u.openCount} Open
                          </span>
                        </td>

                        {/* Won Deals */}
                        <td>
                          <span className="status-pill status-won">
                            {u.wonCount} Won
                          </span>
                        </td>

                        {/* Workload Share */}
                        <td>
                          <div className="workload-bar-wrap">
                            <div className="workload-track">
                              <div
                                className={`workload-fill ${isUnassignedBucket ? "fill-unassigned" : ""}`}
                                style={{ width: `${Math.max(u.percentage, u.dealCount > 0 ? 5 : 0)}%` }}
                              />
                            </div>
                            <span className="workload-pct">{u.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================
          TOP OPPORTUNITIES / RECENT DEALS TABLE
      ================================================= */}
      <div className="analytics-section-card">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">
              {isAdmin ? "Highest Value Deals in Pipeline" : "My Top Opportunities"}
            </h3>
            <p className="section-subtitle">
              High-impact revenue opportunities requiring team focus and follow-up.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/deals")}
          >
            View Full List →
          </button>
        </div>

        <div className="team-distribution-table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Deal Name</th>
                <th>Organization</th>
                <th>Assigned Rep</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    No deals available in this pipeline.
                  </td>
                </tr>
              ) : (
                recentDeals.map((deal) => {
                  const priority = (deal.deal_priority || "Medium").toLowerCase();
                  const status = (deal.deal_status || "Open").toLowerCase();
                  const assignedName = deal.assigned_user_name || deal.deal_owner || "Unassigned";

                  return (
                    <tr
                      key={deal.deal_id}
                      className="clickable-row"
                      onClick={() => navigate(`/deal/${deal.deal_id}`)}
                    >
                      {/* Deal Name */}
                      <td className="deal-name-cell">
                        <strong>{deal.deal_name || "Untitled Deal"}</strong>
                      </td>

                      {/* Organization */}
                      <td>{deal.deal_organization || "-"}</td>

                      {/* Assigned Rep */}
                      <td>
                        <span className="assigned-rep-pill">
                          {assignedName}
                        </span>
                      </td>

                      {/* Priority */}
                      <td>
                        <span className={`table-priority-pill priority-${priority}`}>
                          {deal.deal_priority || "Medium"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`table-status-pill status-${status}`}>
                          {deal.deal_status || "Open"}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          type="button"
                          className="table-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deal/${deal.deal_id}`);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;