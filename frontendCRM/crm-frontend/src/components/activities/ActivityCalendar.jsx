import { useMemo, useState } from "react";

import "../../styles/activities/activity-calendar.css";

function ActivityCalendar({
  activities = [],
  selectedDate,
  onDateSelect,
}) {
  const selected = new Date(`${selectedDate}T00:00:00`);

  const [currentMonth, setCurrentMonth] =
    useState(selected.getMonth());

  const [currentYear, setCurrentYear] =
    useState(selected.getFullYear());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentYear,
      currentMonth,
      1
    ).getDay();

    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

    const previousMonthDays = new Date(
      currentYear,
      currentMonth,
      0
    ).getDate();

    const days = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: previousMonthDays - i,
        month: currentMonth - 1,
        year:
          currentMonth === 0
            ? currentYear - 1
            : currentYear,
        outside: true,
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        month: currentMonth,
        year: currentYear,
        outside: false,
      });
    }

    // Next month's days
    let nextDay = 1;

    while (days.length < 42) {
      days.push({
        day: nextDay++,
        month: currentMonth + 1,
        year:
          currentMonth === 11
            ? currentYear + 1
            : currentYear,
        outside: true,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const formatDate = (year, month, day) => {
    const normalizedMonth = month < 0
      ? 11
      : month > 11
        ? 0
        : month;

    const normalizedYear =
      month < 0
        ? year - 1
        : month > 11
          ? year + 1
          : year;

    return `${normalizedYear}-${String(
      normalizedMonth + 1
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const hasActivity = (date) => {
    return activities.some(
      (activity) => activity.date === date
    );
  };

  const getActivityCount = (date) => {
    return activities.filter(
      (activity) => activity.date === date
    ).length;
  };

  const handleDateClick = (day) => {
    const date = formatDate(
      day.year,
      day.month,
      day.day
    );

    onDateSelect(date);

    if (day.outside) {
      setCurrentMonth(day.month);
      setCurrentYear(day.year);
    }
  };

  const goPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  const goToday = () => {
    const today = new Date();

    const todayDate = formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onDateSelect(todayDate);
  };

  const handleMonthChange = (e) => {
    setCurrentMonth(Number(e.target.value));
  };

  const handleYearChange = (e) => {
    setCurrentYear(Number(e.target.value));
  };

  const years = [];

  for (
    let year = currentYear - 5;
    year <= currentYear + 5;
    year++
  ) {
    years.push(year);
  }

  return (
    <div className="activity-calendar">

      {/* Calendar Header */}
      <div className="calendar-header">

        <div className="calendar-title">
          <h2>
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <p>
            Select a date to view activities
          </p>
        </div>

        <div className="calendar-actions">

          <button
            type="button"
            className="calendar-nav-button"
            onClick={goPreviousMonth}
            aria-label="Previous month"
          >
            ‹
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={goToday}
          >
            Today
          </button>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={goNextMonth}
            aria-label="Next month"
          >
            ›
          </button>

        </div>

      </div>

      {/* Month / Year Selectors */}
      <div className="calendar-selectors">

        <select
          value={currentMonth}
          onChange={handleMonthChange}
          aria-label="Select month"
        >
          {monthNames.map((month, index) => (
            <option
              key={month}
              value={index}
            >
              {month}
            </option>
          ))}
        </select>

        <select
          value={currentYear}
          onChange={handleYearChange}
          aria-label="Select year"
        >
          {years.map((year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>

      </div>

      {/* Weekdays */}
      <div className="calendar-weekdays">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="calendar-weekday"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">

        {calendarDays.map((day, index) => {
          const date = formatDate(
            day.year,
            day.month,
            day.day
          );

          const selectedDay =
            date === selectedDate;

          const activityCount =
            getActivityCount(date);

          const today =
            date ===
            formatDate(
              new Date().getFullYear(),
              new Date().getMonth(),
              new Date().getDate()
            );

          return (
            <button
              type="button"
              key={`${date}-${index}`}
              className={[
                "calendar-day",
                day.outside
                  ? "outside-month"
                  : "",
                selectedDay
                  ? "selected"
                  : "",
                today
                  ? "today"
                  : "",
              ].join(" ")}
              onClick={() =>
                handleDateClick(day)
              }
            >
              <span className="day-number">
                {day.day}
              </span>

              {hasActivity(date) && (
                <span className="activity-indicator">
                  {activityCount > 1
                    ? activityCount
                    : "•"}
                </span>
              )}
            </button>
          );
        })}

      </div>

    </div>
  );
}

export default ActivityCalendar;