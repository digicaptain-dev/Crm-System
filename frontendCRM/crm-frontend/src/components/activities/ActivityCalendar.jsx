import {
    useMemo,
    useState,
    useEffect
} from "react";

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
    const initialDate = selectedDate
        ? new Date(`${selectedDate}T12:00:00`)
        : new Date();

    const [currentDate, setCurrentDate] =
        useState(initialDate);

    /*
     * Keep calendar month/year synchronized
     * whenever selectedDate changes from parent.
     */
    useEffect(() => {
        if (!selectedDate) return;

        const date = new Date(
            `${selectedDate}T12:00:00`
        );

        if (!Number.isNaN(date.getTime())) {
            setCurrentDate(date);
        }
    }, [selectedDate]);

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
        "December"
    ];

    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    const currentYear =
        currentDate.getFullYear();

    const currentMonth =
        currentDate.getMonth();

    /*
     * Combined activity count.
     *
     * Historical activities use created_at.
     * Scheduled activities use start_time.
     */
    const activityMap = useMemo(() => {
        const map = {};

        activities.forEach((activity) => {
            if (!activity.created_at) return;

            const date = new Date(
                activity.created_at
            );

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key =
                getLocalDateString(date);

            map[key] =
                (map[key] || 0) + 1;
        });

        schedules.forEach((schedule) => {
            if (!schedule.start_time) return;

            const date = new Date(
                schedule.start_time
            );

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key =
                getLocalDateString(date);

            map[key] =
                (map[key] || 0) + 1;
        });

        return map;
    }, [activities, schedules]);

    /*
     * Scheduled activities grouped by date.
     */
    const scheduleMap = useMemo(() => {
        const map = {};

        schedules.forEach((schedule) => {
            if (!schedule.start_time) return;

            const date = new Date(
                schedule.start_time
            );

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key =
                getLocalDateString(date);

            if (!map[key]) {
                map[key] = [];
            }

            map[key].push(schedule);
        });

        /*
         * Keep schedules sorted by start time.
         */
        Object.keys(map).forEach((key) => {
            map[key].sort((a, b) => {
                return (
                    new Date(a.start_time) -
                    new Date(b.start_time)
                );
            });
        });

        return map;
    }, [schedules]);

    /*
     * Generate 42 calendar cells.
     */
    const calendarDays = useMemo(() => {
        const firstDay =
            new Date(
                currentYear,
                currentMonth,
                1
            ).getDay();

        const daysInMonth =
            new Date(
                currentYear,
                currentMonth + 1,
                0
            ).getDate();

        const previousMonthDays =
            new Date(
                currentYear,
                currentMonth,
                0
            ).getDate();

        const days = [];

        /*
         * Previous month's days.
         */
        for (
            let i = firstDay - 1;
            i >= 0;
            i--
        ) {
            const date =
                new Date(
                    currentYear,
                    currentMonth - 1,
                    previousMonthDays - i
                );

            days.push({
                date,
                currentMonth: false
            });
        }

        /*
         * Current month's days.
         */
        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {
            days.push({
                date: new Date(
                    currentYear,
                    currentMonth,
                    day
                ),
                currentMonth: true
            });
        }

        /*
         * Next month's days.
         */
        let nextDay = 1;

        while (days.length < 42) {
            days.push({
                date: new Date(
                    currentYear,
                    currentMonth + 1,
                    nextDay++
                ),
                currentMonth: false
            });
        }

        return days;
    }, [
        currentYear,
        currentMonth
    ]);

    const goPreviousMonth = () => {
        setCurrentDate(
            new Date(
                currentYear,
                currentMonth - 1,
                1
            )
        );
    };

    const goNextMonth = () => {
        setCurrentDate(
            new Date(
                currentYear,
                currentMonth + 1,
                1
            )
        );
    };

    const goToday = () => {
        const today = new Date();

        setCurrentDate(today);

        onDateSelect?.(
            getLocalDateString(today)
        );
    };

    const handleDateClick = (date) => {
        const key =
            getLocalDateString(date);

        setCurrentDate(date);

        onDateSelect?.(key);
    };

    const selectedKey =
        selectedDate || "";

    const todayKey =
        getLocalDateString(new Date());

    const formatTime = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    };

    const getScheduleIcon = (
        activityType
    ) => {
        switch (activityType) {
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

    const getScheduleLabel = (
        activityType
    ) => {
        switch (activityType) {
            case "call":
                return "Call";

            case "meeting":
                return "Meeting";

            case "follow_up":
                return "Follow-up";

            default:
                return "Scheduled Activity";
        }
    };

    return (
        <div className="activity-calendar">

            {/* =========================
                HEADER
            ========================== */}

            <div className="activity-calendar-header">

                <div>
                    <div className="activity-calendar-title">
                        Activity Calendar
                    </div>

                    <div className="activity-calendar-subtitle">
                        Scheduled calls, meetings and follow-ups
                    </div>
                </div>

                <div className="activity-calendar-actions">

                    <button
                        type="button"
                        onClick={
                            goPreviousMonth
                        }
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <button
                        type="button"
                        className="activity-calendar-today"
                        onClick={goToday}
                    >
                        Today
                    </button>

                    <button
                        type="button"
                        onClick={
                            goNextMonth
                        }
                        aria-label="Next month"
                    >
                        ›
                    </button>

                </div>
            </div>

            {/* =========================
                MONTH / YEAR SELECTORS
            ========================== */}

            <div className="activity-calendar-selectors">

                <select
                    value={currentMonth}
                    onChange={(e) => {
                        setCurrentDate(
                            new Date(
                                currentYear,
                                Number(
                                    e.target.value
                                ),
                                1
                            )
                        );
                    }}
                    aria-label="Select month"
                >
                    {monthNames.map(
                        (
                            month,
                            index
                        ) => (
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
                    onChange={(e) => {
                        setCurrentDate(
                            new Date(
                                Number(
                                    e.target.value
                                ),
                                currentMonth,
                                1
                            )
                        );
                    }}
                    aria-label="Select year"
                >
                    {Array.from(
                        {
                            length: 11
                        },
                        (
                            _,
                            index
                        ) =>
                            new Date().getFullYear() -
                            5 +
                            index
                    ).map(
                        (year) => (
                            <option
                                key={year}
                                value={year}
                            >
                                {year}
                            </option>
                        )
                    )}
                </select>

            </div>

            {/* =========================
                WEEKDAYS
            ========================== */}

            <div className="activity-calendar-weekdays">

                {weekdays.map(
                    (day) => (
                        <div
                            key={day}
                        >
                            {day}
                        </div>
                    )
                )}

            </div>

            {/* =========================
                CALENDAR GRID
            ========================== */}

            <div className="activity-calendar-grid">

                {calendarDays.map(
                    ({
                        date,
                        currentMonth:
                            isCurrentMonth
                    }) => {

                        const key =
                            getLocalDateString(
                                date
                            );

                        const count =
                            activityMap[
                                key
                            ] || 0;

                        const daySchedules =
                            scheduleMap[
                                key
                            ] || [];

                        const isSelected =
                            key ===
                            selectedKey;

                        const isToday =
                            key ===
                            todayKey;

                        return (
                            <button
                                type="button"
                                key={key}
                                className={`
                                    activity-calendar-day
                                    ${
                                        isCurrentMonth
                                            ? ""
                                            : "outside"
                                    }
                                    ${
                                        isSelected
                                            ? "selected"
                                            : ""
                                    }
                                    ${
                                        isToday
                                            ? "today"
                                            : ""
                                    }
                                `}
                                onClick={() =>
                                    handleDateClick(
                                        date
                                    )
                                }
                                aria-label={`
                                    ${date.toLocaleDateString(
                                        undefined,
                                        {
                                            weekday:
                                                "long",
                                            month:
                                                "long",
                                            day:
                                                "numeric",
                                            year:
                                                "numeric"
                                        }
                                    )}
                                    ${
                                        daySchedules.length
                                    } scheduled activities
                                `}
                                aria-pressed={
                                    isSelected
                                }
                            >

                                {/* DATE */}

                                <span className="activity-day-number">
                                    {date.getDate()}
                                </span>

                                {/* TOTAL ACTIVITY COUNT */}

                                {count > 0 && (
                                    <span className="activity-day-indicator">
                                        {count > 99
                                            ? "99+"
                                            : count}
                                    </span>
                                )}

                                {/* SCHEDULED ACTIVITIES */}

                                {daySchedules.length >
                                    0 && (
                                    <div className="activity-day-schedules">

                                        {daySchedules
                                            .slice(
                                                0,
                                                2
                                            )
                                            .map(
                                                (
                                                    schedule
                                                ) => {

                                                    const type =
                                                        schedule.activity_type ||
                                                        "follow_up";

                                                    return (
                                                        <span
                                                            key={
                                                                schedule.id
                                                            }
                                                            className={`
                                                                schedule-mini
                                                                schedule-${type}
                                                            `}
                                                            title={`
                                                                ${getScheduleLabel(
                                                                    type
                                                                )}
                                                                -
                                                                ${
                                                                    schedule.title ||
                                                                    "Scheduled Activity"
                                                                }
                                                                -
                                                                ${formatTime(
                                                                    schedule.start_time
                                                                )}
                                                            `}
                                                        >
                                                            {getScheduleIcon(
                                                                type
                                                            )}
                                                        </span>
                                                    );
                                                }
                                            )}

                                        {daySchedules.length >
                                            2 && (
                                            <span
                                                className="schedule-more"
                                                title={`
                                                    ${
                                                        daySchedules.length -
                                                        2
                                                    } more scheduled activities
                                                `}
                                            >
                                                +
                                                {
                                                    daySchedules.length -
                                                    2
                                                }
                                            </span>
                                        )}

                                    </div>
                                )}

                            </button>
                        );
                    }
                )}

            </div>

            {/* =========================
                FOOTER
            ========================== */}

            <div className="activity-calendar-footer">

                <div className="calendar-legend">

                    <span className="calendar-legend-dot" />

                    <span>
                        Scheduled activity
                    </span>

                </div>

                <div className="calendar-selected-date">

                    {selectedDate
                        ? new Date(
                              `${selectedDate}T12:00:00`
                          ).toLocaleDateString(
                              undefined,
                              {
                                  weekday:
                                      "long",
                                  month:
                                      "long",
                                  day:
                                      "numeric",
                                  year:
                                      "numeric"
                              }
                          )
                        : "Select a date"}

                </div>

            </div>

        </div>
    );
}

export default ActivityCalendar;