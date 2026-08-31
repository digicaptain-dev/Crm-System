import { useEffect, useMemo, useState } from "react";

import Modal from "../components/common/Modal";
import ActivityForm from "../components/activities/ActivityForm";
import ActivityCalendar from "../components/activities/ActivityCalendar";
import ActivityList from "../components/activities/ActivityList";

import api from "../services/api";

import "../styles/activities/activities.css";

function Activities() {
  // =====================================================
  // STATE
  // =====================================================

  const today = new Date();

  const todayDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] =
    useState(todayDate);

  const [activities, setActivities] =
    useState([]);

  const [deals, setDeals] =
    useState([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching all activities..."
      );

      const response = await api.get(
        "/activities"
      );

      console.log(
        "Activities response:",
        response.data
      );

      const fetchedActivities =
        response.data?.activities ||
        [];

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
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      console.log(
        "Fetching deals for activity form..."
      );

      const response = await api.get(
        "/deals"
      );

      console.log(
        "Deals response:",
        response.data
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
    fetchActivities();
    fetchDeals();
  }, []);

  // =====================================================
  // ACTIVITIES FOR SELECTED DATE
  // =====================================================

  const selectedDateActivities =
    useMemo(() => {
      return activities.filter(
        (activity) => {
          if (!activity.created_at) {
            return false;
          }

          const activityDate =
            new Date(
              activity.created_at
            );

          const formattedDate =
            `${activityDate.getFullYear()}-${String(
              activityDate.getMonth() + 1
            ).padStart(2, "0")}-${String(
              activityDate.getDate()
            ).padStart(2, "0")}`;

          return (
            formattedDate ===
            selectedDate
          );
        }
      );
    }, [
      activities,
      selectedDate,
    ]);

  // =====================================================
  // ACTIVITY CREATED
  // =====================================================

  const handleActivityCreated = (
    newActivity
  ) => {
    console.log(
      "New activity:",
      newActivity
    );

    /*
     * Add immediately to UI.
     */

    setActivities(
      (current) => [
        newActivity,
        ...current,
      ]
    );

    /*
     * Refresh from backend so UI and
     * database stay synchronized.
     */

    fetchActivities();
  };

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const handleOpenCreate = () => {
    setShowCreate(true);
  };

  // =====================================================
  // CLOSE CREATE MODAL
  // =====================================================

  const handleCloseCreate = () => {
    setShowCreate(false);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="activities-page">
        <div className="activities-loading">
          Loading activities...
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

      <div className="activities-header">

        <div>
          <h1>
            Activities
          </h1>

          <p>
            Manage calls, meetings,
            tasks and follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleOpenCreate}
        >
          + Add Activity
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="activities-error">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="activities-summary">

        <div className="activity-summary-card">

          <span className="summary-label">
            Total Activities
          </span>

          <strong>
            {activities.length}
          </strong>

        </div>

        <div className="activity-summary-card">

          <span className="summary-label">
            Selected Date
          </span>

          <strong>
            {selectedDateActivities.length}
          </strong>

        </div>

        <div className="activity-summary-card">

          <span className="summary-label">
            Deals
          </span>

          <strong>
            {deals.length}
          </strong>

        </div>

      </div>

      {/* =================================================
          CALENDAR + LIST
      ================================================= */}

      <div className="activities-layout">

        <ActivityCalendar
          activities={activities}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        <ActivityList
          activities={activities}
          selectedDate={selectedDate}
        />

      </div>

      {/* =================================================
          CREATE ACTIVITY MODAL
      ================================================= */}

      {showCreate && (
        <Modal
          title="Create Activity"
          onClose={
            handleCloseCreate
          }
        >

          <ActivityForm
            selectedDate={
              selectedDate
            }
            deals={deals}
            onClose={
              handleCloseCreate
            }
            onCreated={
              handleActivityCreated
            }
          />

        </Modal>
      )}

    </div>
  );
}

export default Activities;