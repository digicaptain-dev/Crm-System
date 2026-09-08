import { useEffect, useMemo, useState } from "react";

import Modal from "../components/common/Modal";
import ActivityForm from "../components/activities/ActivityForm";
import ScheduleForm from "../components/activities/ScheduleForm";
import ActivityCalendar from "../components/activities/ActivityCalendar";
import ActivityList from "../components/activities/ActivityList";

import api from "../services/api";

import "../styles/activities/activities.css";

function Activities() {
  // =====================================================
  // DATE HELPERS
  // =====================================================

  const getLocalDateString = (date) => {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const today = new Date();
  const todayDate = getLocalDateString(today);

  // =====================================================
  // STATE
  // =====================================================

  const [selectedDate, setSelectedDate] =
    useState(todayDate);

  const [activities, setActivities] =
    useState([]);

  const [schedules, setSchedules] =
    useState([]);

  const [deals, setDeals] =
    useState([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showSchedule, setShowSchedule] =
    useState(false);

  const [selectedSchedule, setSelectedSchedule] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activityType, setActivityType] =
    useState("all");

  const [dealFilter, setDealFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("selected");

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================

  const fetchActivities = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/activities"
      );

      const fetchedActivities =
        response.data?.activities || [];

      setActivities(
        Array.isArray(fetchedActivities)
          ? fetchedActivities
          : []
      );
    } catch (error) {
      console.error(
        "Fetch activities error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
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

  // =====================================================
  // FETCH DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      const response = await api.get(
        "/deals"
      );

      const fetchedDeals =
        Array.isArray(response.data)
          ? response.data
          : response.data?.deals || [];

      setDeals(
        Array.isArray(fetchedDeals)
          ? fetchedDeals
          : []
      );
    } catch (error) {
      console.error(
        "Fetch deals error:",
        error
      );

      setDeals([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

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
  // ACTIVITY DATE
  // =====================================================

  const getActivityDate = (activity) => {
    if (!activity?.created_at) {
      return null;
    }

    const date = new Date(
      activity.created_at
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return getLocalDateString(date);
  };

  // =====================================================
  // SCHEDULE DATE
  // =====================================================

  const getScheduleDate = (schedule) => {
    if (!schedule?.start_time) {
      return null;
    }

    const date = new Date(
      schedule.start_time
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return getLocalDateString(date);
  };

  // =====================================================
  // ACTIVITY TYPE
  // =====================================================

  const getActivityType = (activity) => {
    return (
      activity?.activity_type || ""
    ).toLowerCase();
  };

  // =====================================================
  // SEARCH ACTIVITY
  // =====================================================

  const getSearchableText = (activity) => {
    return [
      activity?.activity_type,
      activity?.details,
      activity?.deal_name,
      activity?.user_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  // =====================================================
  // SELECTED DATE ACTIVITIES
  // =====================================================

  const selectedDateActivities =
    useMemo(() => {
      return activities.filter(
        (activity) =>
          getActivityDate(activity) ===
          selectedDate
      );
    }, [
      activities,
      selectedDate,
    ]);

  // =====================================================
  // SELECTED DATE SCHEDULES
  // =====================================================

  const selectedDateSchedules =
    useMemo(() => {
      return schedules
        .filter(
          (schedule) =>
            getScheduleDate(schedule) ===
            selectedDate
        )
        .sort(
          (a, b) =>
            new Date(a.start_time) -
            new Date(b.start_time)
        );
    }, [
      schedules,
      selectedDate,
    ]);

  // =====================================================
  // FILTERED ACTIVITIES
  // =====================================================

  const filteredActivities =
    useMemo(() => {
      const searchValue =
        search.trim().toLowerCase();

      return activities.filter(
        (activity) => {
          if (
            searchValue &&
            !getSearchableText(
              activity
            ).includes(searchValue)
          ) {
            return false;
          }

          if (
            activityType !== "all" &&
            getActivityType(activity) !==
              activityType
          ) {
            return false;
          }

          if (
            dealFilter !== "all" &&
            String(
              activity?.deal_id || ""
            ) !== String(dealFilter)
          ) {
            return false;
          }

          if (
            dateFilter === "selected" &&
            getActivityDate(activity) !==
              selectedDate
          ) {
            return false;
          }

          if (
            dateFilter === "today" &&
            getActivityDate(activity) !==
              todayDate
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      activities,
      search,
      activityType,
      dealFilter,
      dateFilter,
      selectedDate,
      todayDate,
    ]);

  // =====================================================
  // FILTERED SCHEDULES
  // =====================================================

  const filteredSchedules =
    useMemo(() => {
      const searchValue =
        search.trim().toLowerCase();

      return schedules.filter(
        (schedule) => {
          if (
            searchValue &&
            ![
              schedule.title,
              schedule.description,
              schedule.activity_type,
              schedule.deal_name,
              schedule.user_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(searchValue)
          ) {
            return false;
          }

          if (
            dealFilter !== "all" &&
            String(
              schedule.deal_id || ""
            ) !== String(dealFilter)
          ) {
            return false;
          }

          if (
            dateFilter === "selected" &&
            getScheduleDate(schedule) !==
              selectedDate
          ) {
            return false;
          }

          if (
            dateFilter === "today" &&
            getScheduleDate(schedule) !==
              todayDate
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      schedules,
      search,
      dealFilter,
      dateFilter,
      selectedDate,
      todayDate,
    ]);

  // =====================================================
  // VISIBLE SELECTED DATE SCHEDULES
  // =====================================================

  const visibleSelectedDateSchedules =
    useMemo(() => {
      return filteredSchedules
        .filter(
          (schedule) =>
            getScheduleDate(schedule) ===
            selectedDate
        )
        .sort(
          (a, b) =>
            new Date(a.start_time) -
            new Date(b.start_time)
        );
    }, [
      filteredSchedules,
      selectedDate,
    ]);

  // =====================================================
  // ALL SCHEDULES FOR MANAGEMENT
  // =====================================================

  const manageableSchedules =
    useMemo(() => {
      return schedules
        .filter((schedule) => {
          const searchValue =
            search.trim().toLowerCase();

          if (
            searchValue &&
            ![
              schedule.title,
              schedule.description,
              schedule.activity_type,
              schedule.deal_name,
              schedule.user_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(searchValue)
          ) {
            return false;
          }

          if (
            activityType !== "all"
          ) {
            return false;
          }

          if (
            dealFilter !== "all" &&
            String(
              schedule.deal_id || ""
            ) !== String(dealFilter)
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (a, b) =>
            new Date(a.start_time) -
            new Date(b.start_time)
        );
    }, [
      schedules,
      search,
      activityType,
      dealFilter,
    ]);

  // =====================================================
  // KPI
  // =====================================================

  const activityStats = useMemo(() => {
    const todayActivities =
      activities.filter(
        (activity) =>
          getActivityDate(activity) ===
          todayDate
      );

    const todaySchedules =
      schedules.filter(
        (schedule) =>
          schedule.status !==
            "cancelled" &&
          getScheduleDate(schedule) ===
            todayDate
      );

    const countType = (type) =>
      activities.filter(
        (activity) =>
          getActivityType(activity) ===
          type
      ).length;

    return {
      total: activities.length,

      today:
        todayActivities.length +
        todaySchedules.length,

      comments:
        countType("comment"),

      stageChanges:
        countType("stage change"),

      tasks:
        countType("task"),

      selected:
        selectedDateActivities.length +
        selectedDateSchedules.length,

      scheduled:
        schedules.filter(
          (schedule) =>
            schedule.status ===
            "scheduled"
        ).length,

      completed:
        schedules.filter(
          (schedule) =>
            schedule.status ===
            "completed"
        ).length,

      cancelled:
        schedules.filter(
          (schedule) =>
            schedule.status ===
            "cancelled"
        ).length,

      scheduledCalls:
        schedules.filter(
          (schedule) =>
            schedule.activity_type ===
              "call" &&
            schedule.status ===
              "scheduled"
        ).length,

      scheduledMeetings:
        schedules.filter(
          (schedule) =>
            schedule.activity_type ===
              "meeting" &&
            schedule.status ===
              "scheduled"
        ).length,

      scheduledFollowUps:
        schedules.filter(
          (schedule) =>
            schedule.activity_type ===
              "follow_up" &&
            schedule.status ===
              "scheduled"
        ).length,
    };
  }, [
    activities,
    schedules,
    selectedDateActivities,
    selectedDateSchedules,
    todayDate,
  ]);

  // =====================================================
  // UPCOMING SCHEDULES
  // =====================================================

  const upcomingSchedules =
    useMemo(() => {
      const now = new Date();

      return schedules
        .filter((schedule) => {
          if (
            schedule.status !==
            "scheduled"
          ) {
            return false;
          }

          if (!schedule.start_time) {
            return false;
          }

          const start =
            new Date(
              schedule.start_time
            );

          return start >= now;
        })
        .sort(
          (a, b) =>
            new Date(a.start_time) -
            new Date(b.start_time)
        )
        .slice(0, 8);
    }, [schedules]);

  // =====================================================
  // ACTIVITY CREATED
  // =====================================================

  const handleActivityCreated = (
    newActivity
  ) => {
    if (newActivity) {
      setActivities((current) => [
        newActivity,
        ...current,
      ]);
    }

    fetchActivities(false);
    setShowCreate(false);
  };

  // =====================================================
  // SCHEDULE CREATED
  // =====================================================

  const handleScheduleCreated = (
    newSchedule
  ) => {
    if (newSchedule) {
      const normalizedSchedule = {
        ...newSchedule,
        status:
          newSchedule.status ||
          "scheduled",
        activity_type:
          newSchedule.activity_type ||
          "follow_up",
      };

      setSchedules((current) => [
        ...current,
        normalizedSchedule,
      ]);

      setSelectedSchedule(
        normalizedSchedule
      );
    }

    setShowSchedule(false);

    /*
     * Backend sync will be finalized
     * in the next step.
     */
    fetchSchedules();
  };

  // =====================================================
  // OPEN SCHEDULE DETAILS
  // =====================================================

  const handleOpenScheduleDetails = (
    schedule
  ) => {
    setSelectedSchedule({
      ...schedule,
      status:
        schedule.status ||
        "scheduled",
      activity_type:
        schedule.activity_type ||
        "follow_up",
    });
  };

  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  const handleCloseScheduleDetails =
    () => {
      setSelectedSchedule(null);
    };

  // =====================================================
  // STATUS UPDATE BY ID
  // =====================================================

  const handleScheduleStatusChangeForId =
    (scheduleId, status) => {
      setSchedules((current) =>
        current.map((schedule) =>
          String(schedule.id) ===
          String(scheduleId)
            ? {
                ...schedule,
                status,
              }
            : schedule
        )
      );

      setSelectedSchedule(
        (current) => {
          if (
            !current ||
            String(current.id) !==
              String(scheduleId)
          ) {
            return current;
          }

          return {
            ...current,
            status,
          };
        }
      );
    };

  // =====================================================
  // STATUS UPDATE FROM MODAL
  // =====================================================

  const handleScheduleStatusChange = (
    status
  ) => {
    if (!selectedSchedule) {
      return;
    }

    handleScheduleStatusChangeForId(
      selectedSchedule.id,
      status
    );
  };

  // =====================================================
  // DELETE BY ID
  // =====================================================

  const handleDeleteScheduleById = (
    scheduleId
  ) => {
    const schedule =
      schedules.find(
        (item) =>
          String(item.id) ===
          String(scheduleId)
      );

    if (!schedule) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${schedule.title || "this activity"}"?`
      );

    if (!confirmed) {
      return;
    }

    setSchedules((current) =>
      current.filter(
        (item) =>
          String(item.id) !==
          String(scheduleId)
      )
    );

    setSelectedSchedule(
      (current) => {
        if (
          current &&
          String(current.id) ===
            String(scheduleId)
        ) {
          return null;
        }

        return current;
      }
    );
  };

  // =====================================================
  // DELETE FROM MODAL
  // =====================================================

  const handleDeleteSchedule = () => {
    if (!selectedSchedule) {
      return;
    }

    handleDeleteScheduleById(
      selectedSchedule.id
    );
  };

  // =====================================================
  // OPEN CREATE
  // =====================================================

  const handleOpenCreate = () => {
    setShowCreate(true);
  };

  const handleOpenSchedule = () => {
    setShowSchedule(true);
  };

  // =====================================================
  // CLOSE MODALS
  // =====================================================

  const handleCloseCreate = () => {
    setShowCreate(false);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchActivities(false),
        fetchSchedules(),
        fetchDeals(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setActivityType("all");
    setDealFilter("all");
    setDateFilter("selected");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    activityType !== "all" ||
    dealFilter !== "all" ||
    dateFilter !== "selected";

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatSelectedDate = () => {
    const date = new Date(
      `${selectedDate}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return selectedDate;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // SCHEDULE DATE FORMAT
  // =====================================================

  const formatScheduleDate = (
    value
  ) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatActivityTime = (
    value
  ) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // TYPE LABEL
  // =====================================================

  const getScheduleTypeLabel = (
    type
  ) => {
    switch (type) {
      case "call":
        return "Call";

      case "meeting":
        return "Meeting";

      case "follow_up":
        return "Follow-up";

      default:
        return "Activity";
    }
  };

  // =====================================================
  // TYPE ICON
  // =====================================================

  const getScheduleIcon = (
    type
  ) => {
    switch (type) {
      case "call":
        return "☎";

      case "meeting":
        return "◫";

      case "follow_up":
        return "↻";

      default:
        return "•";
    }
  };

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (
    status
  ) => {
    switch (status) {
      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "scheduled":
      default:
        return "Scheduled";
    }
  };

  // =====================================================
  // ACTIVITY ICON
  // =====================================================

  const getActivityIcon = (type) => {
    switch (
      (type || "").toLowerCase()
    ) {
      case "comment":
        return "C";

      case "stage change":
        return "↗";

      case "task":
        return "✓";

      default:
        return "•";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="activities-page">
        <div className="activities-loading">
          <div className="activities-spinner" />
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="activities-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="activities-header">

        <div className="activities-heading">

          <div className="activities-breadcrumb">
            CRM
            <span>/</span>
            Activities
          </div>

          <h1>Activities</h1>

          <p>
            Manage calls, meetings, tasks and
            follow-ups from one central workspace.
          </p>

        </div>

        <div className="activities-header-actions">

          <button
            type="button"
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span
              className={
                refreshing
                  ? "refresh-icon spinning"
                  : "refresh-icon"
              }
            >
              ↻
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={handleOpenCreate}
          >
            <span>+</span>
            Add Activity
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleOpenSchedule}
          >
            <span>+</span>
            Schedule Activity
          </button>

        </div>

      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="activities-error">

          <div className="error-content">

            <strong>
              Unable to load activities
            </strong>

            <span>{error}</span>

          </div>

          <button
            type="button"
            onClick={() =>
              fetchActivities()
            }
          >
            Try Again
          </button>

        </div>
      )}

      {/* =================================================
          KPI
      ================================================= */}

      <section className="activities-kpi-grid">

        <div className="activity-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Total Activities
            </span>

            <strong>
              {activityStats.total}
            </strong>

            <span className="kpi-description">
              Recorded activity history
            </span>
          </div>

          <div className="kpi-icon">◷</div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Today
            </span>

            <strong>
              {activityStats.today}
            </strong>

            <span className="kpi-description">
              Scheduled or recorded today
            </span>
          </div>

          <div className="kpi-icon">⊙</div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Scheduled
            </span>

            <strong>
              {activityStats.scheduled}
            </strong>

            <span className="kpi-description">
              Upcoming CRM activities
            </span>
          </div>

          <div className="kpi-icon">◫</div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Meetings
            </span>

            <strong>
              {activityStats.scheduledMeetings}
            </strong>

            <span className="kpi-description">
              Scheduled meetings
            </span>
          </div>

          <div className="kpi-icon">◫</div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">
              Follow-ups
            </span>

            <strong>
              {activityStats.scheduledFollowUps}
            </strong>

            <span className="kpi-description">
              Scheduled follow-ups
            </span>
          </div>

          <div className="kpi-icon">↻</div>
        </div>

      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="activities-toolbar">

        <div className="activities-search">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search activities, deals or users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="filter-group">

          <select
            value={activityType}
            onChange={(e) =>
              setActivityType(
                e.target.value
              )
            }
          >
            <option value="all">
              All Activity Types
            </option>

            <option value="comment">
              Comments
            </option>

            <option value="stage change">
              Stage Changes
            </option>

            <option value="task">
              Tasks
            </option>
          </select>

          <select
            value={dealFilter}
            onChange={(e) =>
              setDealFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Deals
            </option>

            {deals.map((deal) => (
              <option
                key={deal.deal_id}
                value={deal.deal_id}
              >
                {deal.deal_name ||
                  "Untitled Deal"}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(
                e.target.value
              )
            }
          >
            <option value="selected">
              Selected Date
            </option>

            <option value="today">
              Today
            </option>

            <option value="all">
              All Dates
            </option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>

      </section>

      {/* =================================================
          RESULTS
      ================================================= */}

      <div className="activities-results-bar">

        <div>
          <strong>
            {filteredActivities.length +
              filteredSchedules.length}
          </strong>

          <span>
            {" "}
            {filteredActivities.length +
              filteredSchedules.length ===
            1
              ? "activity"
              : "activities"}
          </span>
        </div>

        <span>
          {dateFilter === "selected"
            ? formatSelectedDate()
            : dateFilter === "today"
              ? "Today"
              : "All dates"}
        </span>

      </div>

      {/* =================================================
          CALENDAR + DAILY ACTIVITY
      ================================================= */}

      <div className="activities-layout">

        {/* CALENDAR */}

        <section className="activities-calendar-card">

          <div className="activities-card-header">

            <div>
              <h2>Calendar</h2>

              <p>
                View and schedule CRM activities.
              </p>
            </div>

            <button
              type="button"
              className="today-button"
              onClick={() => {
                setSelectedDate(
                  todayDate
                );

                setDateFilter(
                  "selected"
                );
              }}
            >
              Today
            </button>

          </div>

          <ActivityCalendar
            activities={activities}
            schedules={schedules}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setDateFilter("selected");
            }}
          />

        </section>

        {/* DAILY ACTIVITIES */}

        <section className="activities-list-card">

          <div className="activities-card-header">

            <div>
              <h2>
                {dateFilter === "selected"
                  ? "Daily Activities"
                  : "Activities"}
              </h2>

              <p>
                {dateFilter === "selected"
                  ? formatSelectedDate()
                  : "Activity overview"}
              </p>
            </div>

            <span className="activity-count-badge">
              {filteredActivities.length +
                filteredSchedules.length}
            </span>

          </div>

          {/* SCHEDULED FOR SELECTED DATE */}

          {dateFilter === "selected" &&
            visibleSelectedDateSchedules.length >
              0 && (
              <div className="daily-schedules">

                <div className="daily-schedules-header">

                  <div>
                    <strong>
                      Scheduled
                    </strong>

                    <span>
                      {
                        visibleSelectedDateSchedules.length
                      }{" "}
                      planned
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleOpenSchedule
                    }
                  >
                    + Schedule
                  </button>

                </div>

                <div className="daily-schedule-list">

                  {visibleSelectedDateSchedules.map(
                    (schedule) => (
                      <div
                        className="daily-schedule-item"
                        key={schedule.id}
                        onClick={() =>
                          handleOpenScheduleDetails(
                            schedule
                          )
                        }
                      >

                        <div
                          className={`daily-schedule-icon ${schedule.activity_type}`}
                        >
                          {getScheduleIcon(
                            schedule.activity_type
                          )}
                        </div>

                        <div className="daily-schedule-content">

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

                          <small>
                            {formatActivityTime(
                              schedule.start_time
                            )}
                            {" – "}
                            {formatActivityTime(
                              schedule.end_time
                            )}
                          </small>

                        </div>

                        <span
                          className={`daily-schedule-type ${schedule.activity_type}`}
                        >
                          {getScheduleTypeLabel(
                            schedule.activity_type
                          )}
                        </span>

                        <div
                          className="schedule-quick-actions"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          {schedule.status ===
                            "scheduled" && (
                            <>
                              <button
                                type="button"
                                className="quick-complete"
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
                                className="quick-cancel"
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

                          {schedule.status ===
                            "completed" && (
                            <button
                              type="button"
                              className="quick-reopen"
                              onClick={() =>
                                handleScheduleStatusChangeForId(
                                  schedule.id,
                                  "scheduled"
                                )
                              }
                              title="Reopen"
                            >
                              ↻
                            </button>
                          )}

                          {schedule.status ===
                            "cancelled" && (
                            <button
                              type="button"
                              className="quick-reopen"
                              onClick={() =>
                                handleScheduleStatusChangeForId(
                                  schedule.id,
                                  "scheduled"
                                )
                              }
                              title="Reschedule"
                            >
                              ↻
                            </button>
                          )}

                          <button
                            type="button"
                            className="quick-delete"
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

              </div>
            )}

          <ActivityList
            activities={
              filteredActivities
            }
            selectedDate={
              dateFilter === "selected"
                ? selectedDate
                : null
            }
          />

        </section>

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
        <Modal
          title="Create Activity"
          onClose={handleCloseCreate}
        >
          <ActivityForm
            selectedDate={selectedDate}
            deals={deals}
            onClose={handleCloseCreate}
            onCreated={handleActivityCreated}
          />
        </Modal>
      )}

      {/* =================================================
          SCHEDULE MODAL
      ================================================= */}

      {showSchedule && (
        <Modal
          title="Schedule Activity"
          onClose={handleCloseSchedule}
        >
          <ScheduleForm
            selectedDate={selectedDate}
            deals={deals}
            onClose={handleCloseSchedule}
            onCreated={handleScheduleCreated}
          />
        </Modal>
      )}

      {/* =================================================
          SCHEDULE DETAILS MODAL
      ================================================= */}

      {selectedSchedule && (
        <Modal
          title="Scheduled Activity"
          onClose={
            handleCloseScheduleDetails
          }
        >
          <div className="schedule-details-modal">

            <div className="schedule-detail-header">

              <div
                className={`schedule-detail-icon ${selectedSchedule.activity_type}`}
              >
                {getScheduleIcon(
                  selectedSchedule.activity_type
                )}
              </div>

              <div>

                <span
                  className={`schedule-detail-type ${selectedSchedule.activity_type}`}
                >
                  {getScheduleTypeLabel(
                    selectedSchedule.activity_type
                  )}
                </span>

                <h3>
                  {selectedSchedule.title ||
                    "Scheduled Activity"}
                </h3>

              </div>

            </div>

            <div className="schedule-detail-status-row">

              <span className="schedule-detail-label">
                Status
              </span>

              <span
                className={`schedule-status-badge ${
                  selectedSchedule.status ||
                  "scheduled"
                }`}
              >
                {getStatusLabel(
                  selectedSchedule.status
                )}
              </span>

            </div>

            <div className="schedule-detail-section">

              <div className="schedule-detail-field">

                <span>Date</span>

                <strong>
                  {formatScheduleDate(
                    selectedSchedule.start_time
                  )}
                </strong>

              </div>

              <div className="schedule-detail-field">

                <span>Time</span>

                <strong>
                  {formatActivityTime(
                    selectedSchedule.start_time
                  )}
                  {" – "}
                  {formatActivityTime(
                    selectedSchedule.end_time
                  )}
                </strong>

              </div>

            </div>

            <div className="schedule-detail-section">

              <div className="schedule-detail-field full">

                <span>
                  Related Deal
                </span>

                <strong>
                  {selectedSchedule.deal_name ||
                    "No deal associated"}
                </strong>

              </div>

            </div>

            <div className="schedule-detail-description">

              <span>
                Description
              </span>

              <p>
                {selectedSchedule.description ||
                  "No description provided."}
              </p>

            </div>

            <div className="schedule-detail-actions">

              {selectedSchedule.status ===
                "scheduled" && (
                <>
                  <button
                    type="button"
                    className="schedule-complete-button"
                    onClick={() =>
                      handleScheduleStatusChange(
                        "completed"
                      )
                    }
                  >
                    ✓ Complete
                  </button>

                  <button
                    type="button"
                    className="schedule-cancel-button"
                    onClick={() =>
                      handleScheduleStatusChange(
                        "cancelled"
                      )
                    }
                  >
                    Cancel
                  </button>
                </>
              )}

              {selectedSchedule.status ===
                "completed" && (
                <button
                  type="button"
                  className="schedule-reopen-button"
                  onClick={() =>
                    handleScheduleStatusChange(
                      "scheduled"
                    )
                  }
                >
                  ↻ Reopen
                </button>
              )}

              {selectedSchedule.status ===
                "cancelled" && (
                <button
                  type="button"
                  className="schedule-reopen-button"
                  onClick={() =>
                    handleScheduleStatusChange(
                      "scheduled"
                    )
                  }
                >
                  ↻ Reschedule
                </button>
              )}

              <button
                type="button"
                className="schedule-delete-button"
                onClick={
                  handleDeleteSchedule
                }
              >
                🗑 Delete
              </button>

              <button
                type="button"
                className="schedule-close-button"
                onClick={
                  handleCloseScheduleDetails
                }
              >
                Close
              </button>

            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}

export default Activities;