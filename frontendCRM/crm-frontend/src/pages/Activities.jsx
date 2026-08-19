import { useState } from "react";

import Modal from "../components/common/Modal";
import CreateActivity from "../components/activities/CreateActivity";
import ActivityCalendar from "../components/activities/ActivityCalendar";
import ActivityList from "../components/activities/ActivityList";

import "../styles/activities/activities.css";

const initialActivities = [
  {
    id: 1,
    title: "Client Meeting",
    type: "Meeting",
    date: "2026-08-14",
    time: "02:00 PM",
    contact: "John Smith",
    description: "Discuss project requirements.",
  },
  {
    id: 2,
    title: "Follow-up Call",
    type: "Call",
    date: "2026-08-15",
    time: "11:00 AM",
    contact: "David Wilson",
    description: "Follow up regarding proposal.",
  },
  {
    id: 3,
    title: "Project Follow-up",
    type: "Follow-up",
    date: "2026-08-18",
    time: "04:00 PM",
    contact: "Michael Brown",
    description: "Check project progress.",
  },
];

function Activities() {
  const [selectedDate, setSelectedDate] = useState("2026-08-19");

  const [activities, setActivities] = useState(initialActivities);

  const [showCreate, setShowCreate] = useState(false);

  const handleCreateActivity = (activity) => {
    setActivities((current) => [
      ...current,
      activity,
    ]);

    setSelectedDate(activity.date);
  };

  return (
    <div className="activities-page">

      <div className="activities-header">
        <div>
          <h1>Activities</h1>

          <p>
            Manage calls, meetings and follow-ups.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowCreate(true)}
        >
          + Add Activity
        </button>
      </div>

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

      {showCreate && (
        <Modal
          title="Create Activity"
          onClose={() => setShowCreate(false)}
        >
          <CreateActivity
            selectedDate={selectedDate}
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateActivity}
          />
        </Modal>
      )}

    </div>
  );
}

export default Activities;