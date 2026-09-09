import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";

import "../styles/deal-details/deal-details.css";

// Stage theme palette
const STAGE_THEMES = [
  { accent: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", text: "#1d4ed8" },
  { accent: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", text: "#6d28d9" },
  { accent: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", text: "#0e7490" },
  { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", text: "#b45309" },
  { accent: "#ec4899", bg: "rgba(236, 72, 153, 0.08)", text: "#be185d" },
  { accent: "#10b981", bg: "rgba(16, 185, 129, 0.08)", text: "#047857" },
];

function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stages, setStages] = useState([]);
  const [status, setStatus] = useState("Open");

  // Activities & Timeline
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState("all");

  // Composer Form
  const [activeComposerTab, setActiveComposerTab] = useState("comment"); // "comment" | "task" | "call"
  const [commentText, setCommentText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [callSummary, setCallSummary] = useState("");
  const [callOutcome, setCallOutcome] = useState("Connected");

  // Copied feedback
  const [copiedField, setCopiedField] = useState("");

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: "", // "status" | "stage"
    title: "",
    message: "",
    targetValue: null,
    confirmVariant: "primary", // "won" | "lost" | "primary"
    confirmText: "Confirm",
  });

  // =====================================================
  // FETCH DEAL
  // =====================================================
  const fetchDeal = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/deal/${id}`);
      const fetchedDeal = response.data?.deal || response.data;

      if (!fetchedDeal?.deal_id) {
        setDeal(null);
        setError("Deal not found.");
        return;
      }

      setDeal(fetchedDeal);
      setStatus(fetchedDeal.deal_status || "Open");
    } catch (err) {
      console.error("Failed to fetch deal:", err);
      setDeal(null);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load deal details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  const isAdmin = currentUser?.role === "admin";

  const handleDeleteDeal = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this deal? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const res = await api.delete(`/deal/${id}`);
      if (res.data?.success) {
        alert("Deal deleted successfully.");
        navigate("/deals");
      }
    } catch (err) {
      console.error("Failed to delete deal:", err);
      alert(err.response?.data?.message || "Failed to delete deal.");
    }
  };

  // =====================================================
  // FETCH PIPELINE STAGES
  // =====================================================
  const fetchStages = useCallback(async () => {
    try {
      const response = await api.get("/pipelines");
      const pipelineData = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];

      if (pipelineData.length > 0) {
        const matched = pipelineData.find(
          (p) => String(p.pipeline_id) === String(deal?.pipeline_id)
        ) || pipelineData[0];

        if (matched?.stages) {
          const sorted = [...matched.stages].sort(
            (a, b) => Number(a.stage_order || 0) - Number(b.stage_order || 0)
          );
          setStages(sorted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pipeline stages:", err);
    }
  }, [deal?.pipeline_id]);

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================
  const fetchActivities = useCallback(async () => {
    if (!id) return;
    try {
      setActivityLoading(true);
      const response = await api.get(`/deals/${id}/activities`);
      const fetchedActivities = response.data?.activities || [];
      setActivities(Array.isArray(fetchedActivities) ? fetchedActivities : []);
    } catch (err) {
      console.error("Failed to fetch deal activities:", err);
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeal();
    fetchActivities();
  }, [fetchDeal, fetchActivities]);

  useEffect(() => {
    if (deal) {
      fetchStages();
    }
  }, [deal, fetchStages]);

  // =====================================================
  // RECORD ACTIVITY
  // =====================================================
  const logActivity = async (activityType, details) => {
    if (!deal?.deal_id || !details) return false;
    try {
      setActivitySubmitting(true);
      const response = await api.post("/activities", {
        deal_id: deal.deal_id,
        activity_type: activityType,
        details: details.trim(),
      });

      if (response.data?.success) {
        await fetchActivities();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to record activity:", err);
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to log activity."
      );
      return false;
    } finally {
      setActivitySubmitting(false);
    }
  };

  // =====================================================
  // SUBMIT COMPOSER FORMS
  // =====================================================
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const ok = await logActivity("comment", commentText.trim());
    if (ok) setCommentText("");
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    const taskDetails = taskDueDate
      ? `Task: ${taskText.trim()} (Due: ${new Date(taskDueDate).toLocaleDateString()})`
      : `Task: ${taskText.trim()}`;
    const ok = await logActivity("task", taskDetails);
    if (ok) {
      setTaskText("");
      setTaskDueDate("");
    }
  };

  const handleCallSubmit = async (e) => {
    e.preventDefault();
    if (!callSummary.trim()) return;
    const details = `Call Logged [Outcome: ${callOutcome}]: ${callSummary.trim()}`;
    const ok = await logActivity("call", details);
    if (ok) setCallSummary("");
  };

  // =====================================================
  // CONFIRMATION PROMPT TRIGGER FUNCTIONS
  // =====================================================
  const promptStatusChange = (newStatus) => {
    if (!deal?.deal_id || newStatus === status) return;
    const isWon = newStatus === "Won";
    const isLost = newStatus === "Lost";

    setConfirmationModal({
      isOpen: true,
      type: "status",
      title: isWon
        ? "Mark Deal as Won?"
        : isLost
        ? "Mark Deal as Lost?"
        : "Reopen Deal?",
      message: isWon
        ? `Are you sure you want to mark "${deal.deal_name || "this deal"}" as WON? This indicates the deal has been successfully closed.`
        : isLost
        ? `Are you sure you want to mark "${deal.deal_name || "this deal"}" as LOST? This will close the deal without winning.`
        : `Are you sure you want to reopen "${deal.deal_name || "this deal"}" back to OPEN status?`,
      targetValue: newStatus,
      confirmVariant: isWon ? "won" : isLost ? "lost" : "primary",
      confirmText: isWon ? "✓ Mark as Won" : isLost ? "✕ Mark as Lost" : "Reopen Deal",
    });
  };

  const promptStageChange = (targetStageId) => {
    if (!deal?.deal_id || String(deal.deal_stage) === String(targetStageId)) return;
    const targetStageObj = stages.find((s) => String(s.stage_id) === String(targetStageId));
    const stageName = targetStageObj ? targetStageObj.stage_name : `Stage ${targetStageId}`;

    setConfirmationModal({
      isOpen: true,
      type: "stage",
      title: `Advance to "${stageName}"?`,
      message: `Are you sure you want to move "${deal.deal_name || "this deal"}" to the "${stageName}" stage in the sales pipeline?`,
      targetValue: targetStageId,
      confirmVariant: "primary",
      confirmText: `Move to ${stageName}`,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.isOpen) return;
    const { type, targetValue } = confirmationModal;
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

    if (type === "status") {
      await executeStatusChange(targetValue);
    } else if (type === "stage") {
      await executeStageChange(targetValue);
    }
  };

  const handleCloseConfirmation = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  // =====================================================
  // ACTUAL BACKEND EXECUTIONS
  // =====================================================
  const executeStageChange = async (targetStageId) => {
    if (!deal?.deal_id) return;
    const prevStage = deal.deal_stage;
    const targetStageObj = stages.find((s) => String(s.stage_id) === String(targetStageId));
    const targetStageName = targetStageObj ? targetStageObj.stage_name : `Stage ${targetStageId}`;

    // Optimistic update
    setDeal((curr) => ({ ...curr, deal_stage: targetStageId }));

    try {
      await api.put(`/deals/${deal.deal_id}/stage`, {
        deal_stage: targetStageId,
      });

      await logActivity(
        "stage change",
        `Deal stage advanced to "${targetStageName}".`
      );
    } catch (err) {
      console.error("Failed to update deal stage:", err);
      setDeal((curr) => ({ ...curr, deal_stage: prevStage }));
      alert("Failed to advance deal stage. Reverted.");
    }
  };

  const executeStatusChange = async (newStatus) => {
    if (!deal?.deal_id) return;
    const previousStatus = deal.deal_status || "Open";

    try {
      setActivitySubmitting(true);
      setStatus(newStatus);

      await api.put(`/deal/${deal.deal_id}`, {
        deal_status: newStatus,
      });

      setDeal((current) => ({
        ...current,
        deal_status: newStatus,
      }));

      await logActivity(
        "stage change",
        `Deal status changed from "${previousStatus}" to "${newStatus}".`
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatus(previousStatus);
      alert("Failed to update deal status.");
    } finally {
      setActivitySubmitting(false);
    }
  };

  // =====================================================
  // COPY TO CLIPBOARD HELPER
  // =====================================================
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // =====================================================
  // FORMATTERS
  // =====================================================
  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === "") return "$0";
    return `$${Number(val).toLocaleString()}`;
  };

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  // Filtered timeline items
  const filteredActivities = useMemo(() => {
    if (timelineFilter === "all") return activities;
    return activities.filter((act) => {
      const type = String(act.activity_type || "").toLowerCase();
      if (timelineFilter === "comments") return type === "comment";
      if (timelineFilter === "stages") return type === "stage change" || type === "status change";
      if (timelineFilter === "tasks") return type === "task";
      if (timelineFilter === "calls") return type === "call";
      return true;
    });
  }, [activities, timelineFilter]);

  // Current stage index calculation
  const currentStageIndex = useMemo(() => {
    if (!stages.length || !deal?.deal_stage) return 0;
    const idx = stages.findIndex((s) => String(s.stage_id) === String(deal.deal_stage));
    return idx !== -1 ? idx : 0;
  }, [stages, deal?.deal_stage]);

  // =====================================================
  // LOADING / ERROR STATES
  // =====================================================
  if (loading) {
    return (
      <div className="deal-details-page">
        <div className="deal-loading-card">
          <div className="deal-spinner-lg" />
          <h3>Loading Deal Record...</h3>
          <p>Fetching deal intelligence, contacts, stage progression, and activity history.</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="deal-details-page">
        <div className="deal-not-found-card">
          <div className="not-found-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Deal Not Found</h2>
          <p>{error || "The requested deal record could not be found or has been removed."}</p>
          <div className="not-found-actions">
            <button
              type="button"
              className="deal-btn-primary"
              onClick={() => navigate("/deals")}
            >
              ← Back to Deals
            </button>
            <button
              type="button"
              className="deal-btn-secondary"
              onClick={() => navigate("/pipelines")}
            >
              Go to Pipeline Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priority = deal.deal_priority || "Medium";
  const priorityClass = priority.toLowerCase().replace(/\s+/g, "-");
  const statusClass = (status || deal.deal_status || "Open").toLowerCase().replace(/\s+/g, "-");

  // =====================================================
  // RENDER MAIN COMPONENT
  // =====================================================
  return (
    <div className="deal-details-page">
      {/* =================================================
          TOP BREADCRUMB & HEADER CARD
      ================================================= */}
      <div className="deal-header-card">
        <div className="deal-header-top-row">
          <div className="deal-breadcrumb-nav">
            <Link to="/deals" className="deal-back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Deals</span>
            </Link>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">{deal.deal_name || "Deal Details"}</span>
          </div>

          <div className="deal-quick-status-actions">
            {status !== "Won" && (
              <button
                type="button"
                className="deal-action-btn btn-mark-won"
                onClick={() => promptStatusChange("Won")}
                disabled={activitySubmitting}
                title="Mark deal as Won"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Won
              </button>
            )}

            {status !== "Lost" && (
              <button
                type="button"
                className="deal-action-btn btn-mark-lost"
                onClick={() => promptStatusChange("Lost")}
                disabled={activitySubmitting}
                title="Mark deal as Lost"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Lost
              </button>
            )}

            {status !== "Open" && (
              <button
                type="button"
                className="deal-action-btn btn-reopen"
                onClick={() => promptStatusChange("Open")}
                disabled={activitySubmitting}
                title="Reopen deal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Reopen Deal
              </button>
            )}

            <button
              type="button"
              className="deal-action-btn btn-view-pipeline"
              onClick={() => navigate("/pipelines")}
              title="View on Pipeline Board"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
              Pipeline Board
            </button>

            {isAdmin && (
              <button
                type="button"
                className="deal-action-btn"
                onClick={handleDeleteDeal}
                title="Delete this deal"
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "9px",
                  fontWeight: "600",
                  fontSize: "13px",
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete Deal</span>
              </button>
            )}
          </div>
        </div>

        <div className="deal-title-section">
          <div className="deal-title-left">
            <h1 className="deal-primary-title">
              {deal.deal_name || "Untitled Deal"}
            </h1>
            {deal.deal_organization && (
              <div className="deal-org-subtitle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>{deal.deal_organization}</span>
              </div>
            )}
          </div>

          <div className="deal-title-badges">
            <span className={`deal-pill-badge priority-${priorityClass}`}>
              {priority} Priority
            </span>
            <span className={`deal-pill-badge status-${statusClass}`}>
              ● {status}
            </span>
            <button
              type="button"
              className="deal-id-chip"
              onClick={() => handleCopy(deal.deal_id, "id")}
              title="Click to copy Deal ID"
            >
              <span>ID: {deal.deal_id.slice(0, 8)}...</span>
              {copiedField === "id" ? <span className="copied-text">✓ Copied!</span> : <span className="copy-icon">⎘</span>}
            </button>
          </div>
        </div>

        {/* =================================================
            INTERACTIVE STAGE PROGRESSION STEPPER
        ================================================= */}
        {stages.length > 0 && (
          <div className="deal-stage-stepper-wrapper">
            <div className="stepper-track">
              {stages.map((st, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const theme = STAGE_THEMES[idx % STAGE_THEMES.length];

                return (
                  <div
                    key={st.stage_id}
                    className={`stepper-step ${isPassed ? "step-passed" : ""} ${isCurrent ? "step-current" : ""}`}
                    onClick={() => promptStageChange(st.stage_id)}
                    title={`Click to set stage to: ${st.stage_name}`}
                  >
                    <div
                      className="step-indicator"
                      style={
                        isCurrent
                          ? { backgroundColor: theme.accent, borderColor: theme.accent }
                          : isPassed
                          ? { backgroundColor: "#10b981", borderColor: "#10b981" }
                          : {}
                      }
                    >
                      {isPassed ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className="step-label"
                      style={isCurrent ? { color: theme.accent, fontWeight: 700 } : {}}
                    >
                      {st.stage_name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          MAIN 2-COLUMN LAYOUT
      ================================================= */}
      <div className="deal-layout-grid">
        {/* ===============================================
            LEFT COLUMN: DEAL & CONTACT INTELLIGENCE
        =============================================== */}
        <div className="deal-left-column">
          {/* Card 1: Value & Key Metrics */}
          <div className="deal-sidebar-card card-highlight">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Deal Value</span>
              <span className="currency-tag">USD</span>
            </div>
            <div className="deal-big-value">
              {formatCurrency(deal.deal_value)}
            </div>
            <div className="deal-metrics-subrow">
              <div className="metric-item">
                <span className="metric-label">Close Date</span>
                <strong className="metric-value">
                  {deal.close_date
                    ? new Date(deal.close_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not set"}
                </strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Probability</span>
                <strong className="metric-value">
                  {deal.probability ? `${deal.probability}%` : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Person & Info */}
          <div className="deal-sidebar-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Contact Information</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-header-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="deal-contact-list">
              <div className="contact-field-group">
                <span className="contact-field-label">Contact Person</span>
                <div className="contact-person-row">
                  <div className="contact-avatar-circle">
                    {(deal.contact_person || deal.deal_name || "C").charAt(0).toUpperCase()}
                  </div>
                  <strong className="contact-field-value">
                    {deal.contact_person || "Not specified"}
                  </strong>
                </div>
              </div>

              {deal.customer_email && (
                <div className="contact-field-group">
                  <span className="contact-field-label">Email Address</span>
                  <div className="contact-action-row">
                    <a href={`mailto:${deal.customer_email}`} className="contact-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{deal.customer_email}</span>
                    </a>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(deal.customer_email, "email")}
                      title="Copy email"
                    >
                      {copiedField === "email" ? "✓" : "⎘"}
                    </button>
                  </div>
                </div>
              )}

              {deal.customer_number && (
                <div className="contact-field-group">
                  <span className="contact-field-label">Phone Number</span>
                  <div className="contact-action-row">
                    <a href={`tel:${deal.customer_number}`} className="contact-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{deal.customer_number}</span>
                    </a>
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(deal.customer_number, "phone")}
                      title="Copy phone"
                    >
                      {copiedField === "phone" ? "✓" : "⎘"}
                    </button>
                  </div>
                </div>
              )}

              {deal.customer_address && (
                <div className="contact-field-group">
                  <span className="contact-field-label">Address</span>
                  <div className="contact-simple-text">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{deal.customer_address}</span>
                  </div>
                </div>
              )}

              {deal.time_zone && (
                <div className="contact-field-group">
                  <span className="contact-field-label">Timezone</span>
                  <div className="contact-simple-text">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{deal.time_zone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Ownership & Stage Details */}
          <div className="deal-sidebar-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Deal Assignment & Flow</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-header-icon">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>

            <div className="deal-detail-field-list">
              <div className="detail-row">
                <span className="detail-key">Assigned User</span>
                <div className="owner-badge-pill">
                  <div className="owner-tiny-avatar">
                    {(deal.deal_owner || deal.assigned_user_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span>{deal.deal_owner || deal.assigned_user_name || "Unassigned"}</span>
                </div>
              </div>

              <div className="detail-row">
                <span className="detail-key">Pipeline</span>
                <span className="detail-val-pill">
                  {deal.pipeline_name || "pipeline 01"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-key">Current Stage</span>
                <select
                  className="inline-stage-select"
                  value={deal.deal_stage || ""}
                  onChange={(e) => promptStageChange(e.target.value)}
                  disabled={activitySubmitting}
                >
                  {stages.map((st) => (
                    <option key={st.stage_id} value={st.stage_id}>
                      {st.stage_name}
                    </option>
                  ))}
                </select>
              </div>

              {deal.deal_source && (
                <div className="detail-row">
                  <span className="detail-key">Lead Source</span>
                  <span className="detail-val-text">{deal.deal_source}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Deal Notes */}
          {deal.deal_notes && (
            <div className="deal-sidebar-card">
              <div className="sidebar-card-header">
                <span className="sidebar-card-title">Original Notes</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-header-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="deal-notes-box">
                <p>{deal.deal_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* ===============================================
            RIGHT COLUMN: INTERACTIVE ACTIVITY & COLLABORATION
        =============================================== */}
        <div className="deal-right-column">
          {/* 1. Activity Composer Box */}
          <div className="deal-composer-card">
            <div className="composer-nav-tabs">
              <button
                type="button"
                className={`composer-tab ${activeComposerTab === "comment" ? "tab-active" : ""}`}
                onClick={() => setActiveComposerTab("comment")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Add Note / Comment</span>
              </button>

              <button
                type="button"
                className={`composer-tab ${activeComposerTab === "task" ? "tab-active" : ""}`}
                onClick={() => setActiveComposerTab("task")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Create Task</span>
              </button>

              <button
                type="button"
                className={`composer-tab ${activeComposerTab === "call" ? "tab-active" : ""}`}
                onClick={() => setActiveComposerTab("call")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Log Call</span>
              </button>
            </div>

            <div className="composer-body">
              {/* Tab 1: Comment Form */}
              {activeComposerTab === "comment" && (
                <form onSubmit={handleCommentSubmit} className="composer-form">
                  <textarea
                    className="composer-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment, meeting takeaway, or deal update..."
                    rows="3"
                    disabled={activitySubmitting}
                  />
                  <div className="composer-footer">
                    <span className="composer-tip">Press Post to record in the deal timeline</span>
                    <button
                      type="submit"
                      className="composer-submit-btn"
                      disabled={activitySubmitting || !commentText.trim()}
                    >
                      {activitySubmitting ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Task Form */}
              {activeComposerTab === "task" && (
                <form onSubmit={handleTaskSubmit} className="composer-form">
                  <input
                    type="text"
                    className="composer-input"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="E.g. Send updated pricing proposal, follow up via email..."
                    disabled={activitySubmitting}
                  />
                  <div className="composer-task-row">
                    <div className="composer-date-group">
                      <label>Due Date:</label>
                      <input
                        type="date"
                        className="composer-date-input"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        disabled={activitySubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      className="composer-submit-btn"
                      disabled={activitySubmitting || !taskText.trim()}
                    >
                      {activitySubmitting ? "Adding..." : "+ Add Task"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Call Form */}
              {activeComposerTab === "call" && (
                <form onSubmit={handleCallSubmit} className="composer-form">
                  <div className="composer-call-row">
                    <div className="composer-outcome-group">
                      <label>Call Outcome:</label>
                      <select
                        className="composer-select"
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value)}
                        disabled={activitySubmitting}
                      >
                        <option value="Connected">Connected / Discussed</option>
                        <option value="Left Voicemail">Left Voicemail</option>
                        <option value="No Answer">No Answer</option>
                        <option value="Busy">Busy</option>
                        <option value="Wrong Number">Wrong Number</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    className="composer-textarea"
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    placeholder="Briefly describe discussion points and next steps..."
                    rows="2"
                    disabled={activitySubmitting}
                  />
                  <div className="composer-footer">
                    <span className="composer-tip">Recorded as phone activity in history</span>
                    <button
                      type="submit"
                      className="composer-submit-btn"
                      disabled={activitySubmitting || !callSummary.trim()}
                    >
                      {activitySubmitting ? "Logging..." : "Log Call"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* 2. Activity Timeline Feed */}
          <div className="deal-timeline-card">
            <div className="timeline-card-header">
              <div className="timeline-title-wrap">
                <h3 className="timeline-title">Deal Timeline</h3>
                <span className="timeline-count-badge">{activities.length}</span>
              </div>

              {/* Filter Tabs */}
              <div className="timeline-filter-pills">
                <button
                  type="button"
                  className={`timeline-pill ${timelineFilter === "all" ? "pill-active" : ""}`}
                  onClick={() => setTimelineFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`timeline-pill ${timelineFilter === "comments" ? "pill-active" : ""}`}
                  onClick={() => setTimelineFilter("comments")}
                >
                  Comments
                </button>
                <button
                  type="button"
                  className={`timeline-pill ${timelineFilter === "stages" ? "pill-active" : ""}`}
                  onClick={() => setTimelineFilter("stages")}
                >
                  Stages
                </button>
                <button
                  type="button"
                  className={`timeline-pill ${timelineFilter === "tasks" ? "pill-active" : ""}`}
                  onClick={() => setTimelineFilter("tasks")}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  className={`timeline-pill ${timelineFilter === "calls" ? "pill-active" : ""}`}
                  onClick={() => setTimelineFilter("calls")}
                >
                  Calls
                </button>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="timeline-stream-container">
              {activityLoading ? (
                <div className="timeline-loading-state">
                  <div className="deal-spinner-sm" />
                  <span>Loading activity stream...</span>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="timeline-empty-state">
                  <div className="timeline-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h4>No activities recorded yet</h4>
                  <p>Use the composer above to write notes, create tasks, or log calls on this deal.</p>
                </div>
              ) : (
                <div className="timeline-list">
                  {filteredActivities.map((act) => {
                    const type = String(act.activity_type || "").toLowerCase();
                    const isComment = type === "comment";
                    const isStage = type === "stage change" || type === "status change";
                    const isTask = type === "task";
                    const isCall = type === "call";

                    let iconSvg = (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                      </svg>
                    );
                    let iconClass = "icon-default";
                    let label = "Activity";

                    if (isComment) {
                      iconClass = "icon-comment";
                      label = "Comment Note";
                      iconSvg = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      );
                    } else if (isStage) {
                      iconClass = "icon-stage";
                      label = "Stage Progress";
                      iconSvg = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      );
                    } else if (isTask) {
                      iconClass = "icon-task";
                      label = "Task Action";
                      iconSvg = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      );
                    } else if (isCall) {
                      iconClass = "icon-call";
                      label = "Phone Call";
                      iconSvg = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      );
                    }

                    return (
                      <div className="timeline-item" key={act.id || act.created_at}>
                        <div className={`timeline-icon-box ${iconClass}`}>
                          {iconSvg}
                        </div>

                        <div className="timeline-content-card">
                          <div className="timeline-header-meta">
                            <div className="timeline-author-info">
                              <span className="timeline-badge-tag">{label}</span>
                              <span className="timeline-author-name">
                                {act.user_name || "Team Member"}
                              </span>
                            </div>
                            <span className="timeline-time-label">
                              {formatActivityTime(act.created_at)}
                            </span>
                          </div>

                          <div className="timeline-body-text">
                            {act.details || "Activity recorded"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          CUSTOM CONFIRMATION MODAL
      ================================================= */}
      {confirmationModal.isOpen && (
        <div className="deal-confirm-overlay" onClick={handleCloseConfirmation}>
          <div className="deal-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="deal-confirm-icon-wrap">
              {confirmationModal.confirmVariant === "won" ? (
                <div className="confirm-icon-circle icon-won">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : confirmationModal.confirmVariant === "lost" ? (
                <div className="confirm-icon-circle icon-lost">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              ) : (
                <div className="confirm-icon-circle icon-stage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="confirm-modal-title">{confirmationModal.title}</h3>
            <p className="confirm-modal-message">{confirmationModal.message}</p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={handleCloseConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`confirm-btn-execute variant-${confirmationModal.confirmVariant}`}
                onClick={handleConfirmAction}
              >
                {confirmationModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealDetails;