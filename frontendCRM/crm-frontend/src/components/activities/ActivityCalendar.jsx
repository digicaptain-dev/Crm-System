import { useMemo, useState } from "react";
import "../../styles/activities/activity-calendar.css";

function getLocalDateString(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function ActivityCalendar({
    selectedDate,
    onDateSelect,
    activities = [],
    schedules = []
}) {
  const selected = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date();

  const [currentMonth, setCurrentMonth] = useState(selected.getMonth());
  const [currentYear, setCurrentYear] = useState(selected.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatDate = (year, month, day) => {
    const d = new Date(year, month, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const today = new Date();
  const todayFormatted = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  // Fast map of date to activity count
  const activityMap = useMemo(() => {
    const map = {};
    for (const act of activities) {
      if (!act.created_at) continue;
      const d = new Date(act.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [activities]);

  // Generate 42 calendar grid days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const previousMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, previousMonthDays - i);
      const dateStr = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
      days.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateStr,
        outside: true,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day);
      days.push({
        day,
        month: currentMonth,
        year: currentYear,
        dateStr,
        outside: false,
      });
    }

    // Next month filler
    let nextDay = 1;
    while (days.length < 42) {
      const date = new Date(currentYear, currentMonth + 1, nextDay++);
      const dateStr = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
      days.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateStr,
        outside: true,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const handleDateClick = (day) => {
    onDateSelect(day.dateStr);
    if (day.outside) {
      setCurrentMonth(day.month);
      setCurrentYear(day.year);
    }
  };

  const goPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onDateSelect(todayFormatted);
  };

  const years = [];
  for (let y = currentYear - 3; y <= currentYear + 3; y++) {
    years.push(y);
  }

  return (
    <div className="activity-calendar">
      {/* Top Header */}
      <div className="calendar-top-bar">
        <div className="calendar-month-heading">
          <h2>
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        <div className="calendar-controls-group">
          <button
            type="button"
            className="calendar-today-btn"
            onClick={goToday}
            title="Go to Today"
          >
            Today
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={goPreviousMonth}
            title="Previous Month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={goNextMonth}
            title="Next Month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selectors for fast jump */}
      <div className="calendar-selects-row">
        <select
          className="calendar-select"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(Number(e.target.value))}
        >
          {monthNames.map((name, idx) => (
            <option key={name} value={idx}>
              {name}
            </option>
          ))}
        </select>

        <select
          className="calendar-select"
          value={currentYear}
          onChange={(e) => setCurrentYear(Number(e.target.value))}
        >
          {years.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      {/* Weekday headers */}
      <div className="calendar-weekdays-grid">
        {daysOfWeek.map((day) => (
          <div className="calendar-weekday-cell" key={day}>
            {day}
          </div>
        ))}
      </div>

      {/* 42 Days grid */}
      <div className="calendar-days-grid">
        {calendarDays.map((cell) => {
          const isSelected = selectedDate === cell.dateStr;
          const isToday = todayFormatted === cell.dateStr;
          const count = activityMap[cell.dateStr] || 0;

          return (
            <div
              key={cell.dateStr}
              className={`calendar-day-cell ${cell.outside ? "outside-month" : ""} ${
                isSelected ? "is-selected" : ""
              } ${isToday ? "is-today" : ""}`}
              onClick={() => handleDateClick(cell)}
              title={`${cell.dateStr}: ${count} activities`}
            >
              <span className="day-number-text">{cell.day}</span>

              {count > 0 && (
                <div className="calendar-day-indicators">
                  <span className={`activity-count-badge ${count > 3 ? "has-many" : ""}`}>
                    {count}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="calendar-legend-bar">
        <div className="legend-item">
          <span className="legend-dot today" />
          <span>Today</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot active" />
          <span>Selected Date</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot event" />
          <span>Has Activities</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityCalendar;