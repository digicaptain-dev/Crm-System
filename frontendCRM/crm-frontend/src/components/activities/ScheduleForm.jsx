import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

import "../../styles/activities/schedule-form.css";

function ScheduleForm({
    deals = [],
    selectedDate,
    onCreated,
    onClose
}) {
    const defaultDate = selectedDate
        ? selectedDate
        : new Date().toISOString().split("T")[0];

    const [form, setForm] = useState({
        activity_type: "call",
        deal_id: "",
        title: "",
        description: "",
        date: defaultDate,
        start_time: "10:00",
        end_time: "10:30"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (selectedDate) {
            setForm((prev) => ({
                ...prev,
                date: selectedDate
            }));
        }
    }, [selectedDate]);

    const selectedDeal = useMemo(() => {
        return deals.find(
            (deal) => String(deal.deal_id) === String(form.deal_id)
        );
    }, [deals, form.deal_id]);

    const activityConfig = {
        call: {
            label: "Call",
            description: "Schedule a customer or prospect call"
        },
        meeting: {
            label: "Meeting",
            description: "Schedule a meeting with the customer"
        },
        follow_up: {
            label: "Follow-up",
            description: "Schedule a follow-up activity"
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!form.deal_id) {
            setError("Please select a deal.");
            return;
        }

        if (!form.date) {
            setError("Please select a date.");
            return;
        }

        if (!form.start_time || !form.end_time) {
            setError("Please select start and end time.");
            return;
        }

        if (form.end_time <= form.start_time) {
            setError("End time must be after start time.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/schedules",
                {
                    deal_id: form.deal_id,

                    activity_type:
                        form.activity_type,

                    title:
                        form.title.trim() ||
                        activityConfig[form.activity_type].label,

                    description:
                        form.description.trim(),

                    start_time:
                        `${form.date}T${form.start_time}:00`,

                    end_time:
                        `${form.date}T${form.end_time}:00`
                }
            );

            if (response.data?.success) {
                onCreated?.(
                    response.data.schedule
                );

                onClose?.();
            } else {
                setError(
                    response.data?.message ||
                    "Unable to schedule activity."
                );
            }

        } catch (err) {
            console.error(
                "Schedule creation error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to schedule activity."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className="schedule-form"
            onSubmit={handleSubmit}
        >
            {error && (
                <div className="schedule-form-error">
                    <span>!</span>
                    <div>{error}</div>
                </div>
            )}

            <div className="schedule-type-grid">
                {Object.entries(activityConfig).map(
                    ([type, config]) => (
                        <button
                            type="button"
                            key={type}
                            className={`schedule-type-card ${
                                form.activity_type === type
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    activity_type: type
                                }))
                            }
                        >
                            <span className="schedule-type-icon">
                                {type === "call"
                                    ? "☎"
                                    : type === "meeting"
                                        ? "◫"
                                        : "↻"}
                            </span>

                            <strong>
                                {config.label}
                            </strong>

                            <small>
                                {config.description}
                            </small>
                        </button>
                    )
                )}
            </div>

            <div className="schedule-form-grid">
                <div className="schedule-field schedule-field-full">
                    <label>
                        Related Deal
                    </label>

                    <select
                        name="deal_id"
                        value={form.deal_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            Select a deal
                        </option>

                        {deals.map((deal) => (
                            <option
                                key={deal.deal_id}
                                value={deal.deal_id}
                            >
                                {deal.deal_name}
                            </option>
                        ))}
                    </select>

                    {selectedDeal && (
                        <div className="schedule-selected-deal">
                            <span className="schedule-deal-dot" />

                            <div>
                                <strong>
                                    {selectedDeal.deal_name}
                                </strong>

                                {selectedDeal.contact_person && (
                                    <small>
                                        {selectedDeal.contact_person}
                                    </small>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="schedule-field schedule-field-full">
                    <label>
                        Activity Title
                    </label>

                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder={
                            form.activity_type === "call"
                                ? "Customer follow-up call"
                                : form.activity_type === "meeting"
                                    ? "Product demo meeting"
                                    : "Follow up with customer"
                        }
                        maxLength={255}
                    />
                </div>

                <div className="schedule-field">
                    <label>
                        Date
                    </label>

                    <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="schedule-field">
                    <label>
                        Start Time
                    </label>

                    <input
                        type="time"
                        name="start_time"
                        value={form.start_time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="schedule-field">
                    <label>
                        End Time
                    </label>

                    <input
                        type="time"
                        name="end_time"
                        value={form.end_time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="schedule-field schedule-field-full">
                    <label>
                        Notes
                    </label>

                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="4"
                        maxLength={2000}
                        placeholder="Add notes, agenda or context..."
                    />

                    <div className="schedule-character-count">
                        {form.description.length}/2000
                    </div>
                </div>
            </div>

            <div className="schedule-form-footer">
                <button
                    type="button"
                    className="schedule-btn secondary"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="schedule-btn primary"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="schedule-spinner" />
                            Scheduling...
                        </>
                    ) : (
                        "Schedule Activity"
                    )}
                </button>
            </div>
        </form>
    );
}

export default ScheduleForm;