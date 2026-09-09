import { useEffect, useMemo, useState } from "react";
import Modal from "../components/common/Modal";
import ActivityForm from "../components/activities/ActivityForm";
import ScheduleForm from "../components/activities/ScheduleForm";
import ActivityCalendar from "../components/activities/ActivityCalendar";
import ActivityList from "../components/activities/ActivityList";
import api from "../services/api";

import "../styles/activities/activities.css";

function Activities() {
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState("");
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [search, setSearch] =
    useState("");

  const [activityType, setActivityType] =
    useState("all");

  const [dealFilter, setDealFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("selected");

  // =====================================================
  // FETCH ACTIVITIES & DEALS
  // =====================================================
  const fetchActivities = async () => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await api.get("/activities");
      const fetchedActivities = response.data?.activities || [];
      setActivities(Array.isArray(fetchedActivities) ? fetchedActivities : []);
    } catch (err) {
      console.error("Fetch activities error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch activities."
      );
      setActivities([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // =====================================================
  // FETCH SCHEDULES
  // =====================================================

  const fetchSchedules = async () => {
    try {
      const response = await api.get(
        "/schedules"
      );

      const fetchedSchedules =
        response.data?.schedules || [];

      const normalizedSchedules =
        Array.isArray(fetchedSchedules)
          ? fetchedSchedules.map(
              (schedule) => ({
                ...schedule,

                status:
                  schedule.status ||
                  "scheduled",

                activity_type:
                  schedule.activity_type ||
                  "follow_up",
              })
            )
          : [];

      setSchedules(
        normalizedSchedules
      );
    } catch (error) {
      console.error(
        "Fetch schedules error:",
        error
      );

      /*
       * Backend will be properly connected
       * in the next step.
       *
       * For now do not break the page
       * when schedules API is unavailable.
       */
      setSchedules([]);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await api.get("/deals");
      const fetchedDeals = Array.isArray(response.data)
        ? response.data
        : response.data?.deals || [];
      setDeals(Array.isArray(fetchedDeals) ? fetchedDeals : []);
    } catch (err) {
      console.error("Fetch deals error:", err);
      setDeals([]);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);

      await Promise.all([
        fetchActivities(),
        fetchSchedules(),
        fetchDeals(),
      ]);

      setLoading(false);
    };

    loadPage();
  }, []);

  // =====================================================
  // DELETE ACTIVITY
  // =====================================================
  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity record?")) return;

    try {
      await api.delete(`/activities/${activityId}`);
      setActivities((curr) => curr.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error("Failed to delete activity:", err);
      alert("Failed to delete activity.");
    }
  };

  // =====================================================
  // FILTERED ACTIVITIES
  // =====================================================
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type Filter
      if (typeFilter !== "all") {
        const t = String(act.activity_type || "").toLowerCase();
        if (typeFilter === "calls" && t !== "call") return false;
        if (typeFilter === "meetings" && t !== "meeting") return false;
        if (typeFilter === "tasks" && t !== "task") return false;
        if (typeFilter === "stages" && t !== "stage change" && t !== "status change") return false;
        if (typeFilter === "comments" && t !== "comment") return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const detailsMatch = String(act.details || "").toLowerCase().includes(q);
        const dealMatch = String(act.deal_name || "").toLowerCase().includes(q);
        const userMatch = String(act.user_name || "").toLowerCase().includes(q);
        const typeMatch = String(act.activity_type || "").toLowerCase().includes(q);
        if (!detailsMatch && !dealMatch && !userMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [activities, typeFilter, searchQuery]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    let callsCount = 0;
    let meetingsCount = 0;
    let tasksCount = 0;
    let stagesCount = 0;

    for (const act of activities) {
      const t = String(act.activity_type || "").toLowerCase();
      if (t === "call") callsCount++;
      else if (t === "meeting") meetingsCount++;
      else if (t === "task") tasksCount++;
      else if (t === "stage change" || t === "status change") stagesCount++;
    }

    return {
      total: activities.length,
      calls: callsCount,
      meetings: meetingsCount,
      tasks: tasksCount,
      stages: stagesCount,
    };
  }, [activities]);

  const handleActivityCreated = (newActivity) => {
    if (newActivity) {
      setActivities((current) => [newActivity, ...current]);
    }
    fetchActivities();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="activities-page">
        <div className="activities-loading-card">
          <div className="activities-spinner" />
          <h3>Loading Activities Feed...</h3>
          <p>Fetching scheduled tasks, calls, meetings, and pipeline timeline logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activities-page">
      {/* =================================================
          TOP HEADER CARD
      ================================================= */}
      <div className="activities-header-card">
        <div className="activities-header-top">
          <div className="activities-header-title-wrap">
            <h1>
              <span>Activities & Tasks</span>
            </h1>
            <p>Track, schedule, and execute calls, meetings, tasks, and follow-ups across all deals.</p>
          </div>

          <div className="activities-header-actions">
            <button
              type="button"
              className="btn-refresh-activities"
              onClick={fetchActivities}
              title="Refresh Activities"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-add-activity"
              onClick={() => setShowCreate(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Log Activity</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR: SEARCH & FILTER PILLS */}
        <div className="activities-toolbar">
          <div className="activities-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="activities-search-input"
              placeholder="Search activities, deals, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="activities-filter-pills">
            <button
              type="button"
              className={`filter-pill-btn ${typeFilter === "all" ? "pill-active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              All Types ({activities.length})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${typeFilter === "tasks" ? "pill-active" : ""}`}
              onClick={() => setTypeFilter("tasks")}
            >
              ✓ Tasks ({metrics.tasks})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${typeFilter === "calls" ? "pill-active" : ""}`}
              onClick={() => setTypeFilter("calls")}
            >
              📞 Calls ({metrics.calls})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${typeFilter === "meetings" ? "pill-active" : ""}`}
              onClick={() => setTypeFilter("meetings")}
            >
              📅 Meetings ({metrics.meetings})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${typeFilter === "stages" ? "pill-active" : ""}`}
              onClick={() => setTypeFilter("stages")}
            >
              🔄 Stage Shifts ({metrics.stages})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="activities-error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* =================================================
          KPI STATS SUMMARY CARDS
      ================================================= */}
      <div className="activities-metrics-grid">
        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Total Activities</span>
            <span className="metric-kpi-val">{metrics.total}</span>
          </div>
          <div className="metric-icon-box metric-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Tasks & Follow-ups</span>
            <span className="metric-kpi-val">{metrics.tasks}</span>
          </div>
          <div className="metric-icon-box metric-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Calls & Meetings</span>
            <span className="metric-kpi-val">{metrics.calls + metrics.meetings}</span>
          </div>
          <div className="metric-icon-box metric-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Pipeline Deals Active</span>
            <span className="metric-kpi-val">{deals.length}</span>
          </div>
          <div className="metric-icon-box metric-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN 2-COLUMN LAYOUT: CALENDAR + LIST FEED
      ================================================= */}
      <div className="activities-main-layout">
        <div className="activities-calendar-card">
          <ActivityCalendar
            activities={filteredActivities}
            selectedDate={selectedDate}
            onDateSelect={(dt) => setSelectedDate(dt === selectedDate ? "" : dt)}
          />
        </div>

        <div className="activities-list-card">
          <ActivityList
            activities={filteredActivities}
            selectedDate={selectedDate}
            onClearDateFilter={() => setSelectedDate("")}
            onOpenCreate={() => setShowCreate(true)}
            onDeleteActivity={handleDeleteActivity}
          />
        </div>
      </div>

      {/* =================================================
          SCHEDULE MANAGEMENT
      ================================================= */}

      <section className="schedule-management-section">

        <div className="schedule-management-header">

          <div>
            <h2>
              Scheduled Activities
            </h2>

            <p>
              Manage calls, meetings and follow-ups.
            </p>
          </div>

          <div className="schedule-management-summary">

            <span className="management-count">
              {manageableSchedules.length}
            </span>

            <button
              type="button"
              onClick={handleOpenSchedule}
            >
              + Schedule
            </button>

          </div>

        </div>

        {manageableSchedules.length === 0 ? (
          <div className="schedule-management-empty">

            <div className="schedule-empty-icon">
              ◫
            </div>

            <strong>
              No scheduled activities
            </strong>

            <span>
              Create a call, meeting or follow-up
              related to a deal.
            </span>

            <button
              type="button"
              onClick={handleOpenSchedule}
            >
              Schedule Activity
            </button>

          </div>
        ) : (
          <div className="schedule-management-table">

            <div className="schedule-table-head">

              <span>Activity</span>
              <span>Related Deal</span>
              <span>Date & Time</span>
              <span>Type</span>
              <span>Status</span>
              <span>Actions</span>

            </div>

            {manageableSchedules.map(
              (schedule) => (
                <div
                  className="schedule-table-row"
                  key={schedule.id}
                >

                  {/* ACTIVITY */}

                  <div className="schedule-table-activity">

                    <div
                      className={`schedule-table-icon ${schedule.activity_type}`}
                    >
                      {getScheduleIcon(
                        schedule.activity_type
                      )}
                    </div>

                    <div>
                      <strong>
                        {schedule.title ||
                          getScheduleTypeLabel(
                            schedule.activity_type
                          )}
                      </strong>

                      {schedule.description && (
                        <span>
                          {schedule.description}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* DEAL */}

                  <div className="schedule-table-deal">

                    {schedule.deal_name ||
                      "No deal associated"}

                  </div>

                  {/* DATE TIME */}

                  <div className="schedule-table-time">

                    <strong>
                      {formatScheduleDate(
                        schedule.start_time
                      )}
                    </strong>

                    <span>
                      {formatActivityTime(
                        schedule.start_time
                      )}
                      {" – "}
                      {formatActivityTime(
                        schedule.end_time
                      )}
                    </span>

                  </div>

                  {/* TYPE */}

                  <div>
                    <span
                      className={`schedule-table-type ${schedule.activity_type}`}
                    >
                      {getScheduleTypeLabel(
                        schedule.activity_type
                      )}
                    </span>
                  </div>

                  {/* STATUS */}

                  <div>
                    <span
                      className={`schedule-table-status ${
                        schedule.status ||
                        "scheduled"
                      }`}
                    >
                      {getStatusLabel(
                        schedule.status
                      )}
                    </span>
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="schedule-table-actions"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >

                    <button
                      type="button"
                      className="view-schedule-action"
                      onClick={() =>
                        handleOpenScheduleDetails(
                          schedule
                        )
                      }
                      title="View details"
                    >
                      View
                    </button>

                    {schedule.status ===
                      "scheduled" && (
                      <>
                        <button
                          type="button"
                          className="complete-schedule-action"
                          onClick={() =>
                            handleScheduleStatusChangeForId(
                              schedule.id,
                              "completed"
                            )
                          }
                          title="Complete"
                        >
                          ✓
                        </button>

                        <button
                          type="button"
                          className="cancel-schedule-action"
                          onClick={() =>
                            handleScheduleStatusChangeForId(
                              schedule.id,
                              "cancelled"
                            )
                          }
                          title="Cancel"
                        >
                          ×
                        </button>
                      </>
                    )}

                    {(schedule.status ===
                      "completed" ||
                      schedule.status ===
                        "cancelled") && (
                      <button
                        type="button"
                        className="reopen-schedule-action"
                        onClick={() =>
                          handleScheduleStatusChangeForId(
                            schedule.id,
                            "scheduled"
                          )
                        }
                        title="Reopen / Reschedule"
                      >
                        ↻
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-schedule-action"
                      onClick={() =>
                        handleDeleteScheduleById(
                          schedule.id
                        )
                      }
                      title="Delete"
                    >
                      🗑
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* =================================================
          UPCOMING
      ================================================= */}

      <section className="upcoming-section">

        <div className="upcoming-header">

          <div>
            <h2>
              Upcoming Activities
            </h2>

            <p>
              Your next scheduled CRM activities.
            </p>
          </div>

          <div className="upcoming-header-actions">

            <span>
              {activityStats.scheduled}
            </span>

            <button
              type="button"
              onClick={handleOpenSchedule}
            >
              + Schedule
            </button>

          </div>

        </div>

        {upcomingSchedules.length === 0 ? (
          <div className="upcoming-empty">

            <div className="upcoming-empty-icon">
              ◫
            </div>

            <strong>
              No upcoming activities
            </strong>

            <span>
              Schedule a call, meeting or
              follow-up to keep your pipeline moving.
            </span>

            <button
              type="button"
              onClick={handleOpenSchedule}
            >
              Schedule Activity
            </button>

          </div>
        ) : (
          <div className="upcoming-list">

            {upcomingSchedules.map(
              (schedule) => (
                <button
                  type="button"
                  className="upcoming-item"
                  key={schedule.id}
                  onClick={() =>
                    handleOpenScheduleDetails(
                      schedule
                    )
                  }
                >

                  <div
                    className={`upcoming-icon schedule-${schedule.activity_type}`}
                  >
                    {getScheduleIcon(
                      schedule.activity_type
                    )}
                  </div>

                  <div className="upcoming-content">

                    <strong>
                      {schedule.title ||
                        getScheduleTypeLabel(
                          schedule.activity_type
                        )}
                    </strong>

                    <span>
                      {schedule.deal_name ||
                        "No deal associated"}
                    </span>

                  </div>

                  <div className="upcoming-meta">

                    <strong>
                      {new Date(
                        schedule.start_time
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </strong>

                    <span>
                      {formatActivityTime(
                        schedule.start_time
                      )}
                      {" – "}
                      {formatActivityTime(
                        schedule.end_time
                      )}
                    </span>

                  </div>

                  <span
                    className={`upcoming-type ${schedule.activity_type}`}
                  >
                    {getScheduleTypeLabel(
                      schedule.activity_type
                    )}
                  </span>

                  <span className="schedule-view-arrow">
                    →
                  </span>

                </button>
              )
            )}

          </div>
        )}

      </section>

      {/* =================================================
          CREATE ACTIVITY MODAL
      ================================================= */}
      {showCreate && (
        <Modal title="Log New Activity" onClose={() => setShowCreate(false)}>
          <ActivityForm
            selectedDate={selectedDate || todayDate}
            deals={deals}
            onClose={() => setShowCreate(false)}
            onCreated={handleActivityCreated}
          />
        </Modal>
      )}
    </div>
  );
}

export default Activities;