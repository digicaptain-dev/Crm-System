import { useMemo, useState } from "react";

import "../../styles/activities/activity-calendar.css";

function ActivityCalendar({
  activities = [],
  selectedDate,
  onDateSelect,
}) {
  const selected = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date();

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

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    year,
    month,
    day
  ) => {
    const date = new Date(
      year,
      month,
      day
    );

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // GET ACTIVITY DATE
  // =====================================================

  const getActivityDate = (activity) => {
    if (!activity.created_at) {
      return null;
    }

    const date = new Date(
      activity.created_at
    );

    return formatDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  // =====================================================
  // CALENDAR DAYS
  // =====================================================

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

    // Previous month
    for (
      let i = firstDay - 1;
      i >= 0;
      i--
    ) {
      const date = new Date(
        currentYear,
        currentMonth - 1,
        previousMonthDays - i
      );

      days.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        outside: true,
      });
    }

    // Current month
    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      days.push({
        day,
        month: currentMonth,
        year: currentYear,
        outside: false,
      });
    }

    // Next month
    let nextDay = 1;

    while (days.length < 42) {
      const date = new Date(
        currentYear,
        currentMonth + 1,
        nextDay++
      );

      days.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        outside: true,
      });
    }

    return days;
  }, [
    currentMonth,
    currentYear,
  ]);

  // =====================================================
  // ACTIVITY COUNT
  // =====================================================

  const getActivityCount = (date) => {
    return activities.filter(
      (activity) =>
        getActivityDate(activity) === date
    ).length;
  };

  // =====================================================
  // DATE CLICK
  // =====================================================

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

  // =====================================================
  // PREVIOUS MONTH
  // =====================================================

  const goPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(
        (year) => year - 1
      );
    } else {
      setCurrentMonth(
        (month) => month - 1
      );
    }
  };

  // =====================================================
  // NEXT MONTH
  // =====================================================

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(
        (year) => year + 1
      );
    } else {
      setCurrentMonth(
        (month) => month + 1
      );
    }
  };

  // =====================================================
  // TODAY
  // =====================================================

  const goToday = () => {
    const today = new Date();

    const todayDate = formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    setCurrentMonth(
      today.getMonth()
    );

    setCurrentYear(
      today.getFullYear()
    );

    onDateSelect(todayDate);
  };

  // =====================================================
  // MONTH CHANGE
  // =====================================================

  const handleMonthChange = (e) => {
    setCurrentMonth(
      Number(e.target.value)
    );
  };

  // =====================================================
  // YEAR CHANGE
  // =====================================================

  const handleYearChange = (e) => {
    setCurrentYear(
      Number(e.target.value)
    );
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

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="calendar-header">

        <div className="calendar-title">

          <h2>
            {monthNames[currentMonth]}{" "}
            {currentYear}
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
          >
            ›
          </button>

        </div>

      </div>

      {/* =================================================
          SELECTORS
      ================================================= */}

      <div className="calendar-selectors">

        <select
          value={currentMonth}
          onChange={handleMonthChange}
        >
          {monthNames.map(
            (month, index) => (
              <option
                key={month}
                value={index}
              >
                {month}
              </option>
            )
          )}
        </select>

        <select
          value={currentYear}
          onChange={handleYearChange}
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

      {/* =================================================
          WEEKDAYS
      ================================================= */}

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

      {/* =================================================
          CALENDAR GRID
      ================================================= */}

      <div className="calendar-grid">

        {calendarDays.map(
          (day, index) => {

            const date = formatDate(
              day.year,
              day.month,
              day.day
            );

            const activityCount =
              getActivityCount(date);

            const isSelected =
              date === selectedDate;

            const today =
              formatDate(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate()
              ) === date;

            return (
              <button
                type="button"
                key={`${date}-${index}`}
                className={[
                  "calendar-day",
                  day.outside
                    ? "outside-month"
                    : "",
                  isSelected
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

                {activityCount > 0 && (
                  <span className="activity-indicator">
                    {activityCount}
                  </span>
                )}

              </button>
            );
          }
        )}

      </div>

    </div>
  );
}

export default ActivityCalendar;