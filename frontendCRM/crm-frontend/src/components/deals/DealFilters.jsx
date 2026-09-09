import "../../styles/deals/deal-filters.css";

function DealFilters({
  search,
  setSearch,
  status,
  setStatus,
  priority,
  setPriority,
  pipeline,
  setPipeline,
  pipelines = [],
  assignedUser,
  setAssignedUser,
  users = [],
  onReset,
  isAdmin = false,
  view = "table",
  setView,
}) {
  const hasActiveFilters = Boolean(search || status || priority || pipeline || assignedUser);

  return (
    <div className="deal-filters-toolbar">
      <div className="deal-filter-left-group">
        {/* Search */}
        <div className="deal-filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="deal-search-input"
            placeholder="Search deals, company, contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <select
          className="deal-select-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">● Open</option>
          <option value="Closed Won">✓ Closed Won</option>
          <option value="Closed Lost">✕ Closed Lost</option>
        </select>

        {/* Priority Dropdown */}
        <select
          className="deal-select-filter"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Pipeline Selector (if multiple exist) */}
        {pipelines.length > 1 && (
          <select
            className="deal-select-filter"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value)}
          >
            <option value="">All Pipelines</option>
            {pipelines.map((p) => (
              <option key={p.pipeline_id} value={p.pipeline_id}>
                {p.pipeline_name}
              </option>
            ))}
          </select>
        )}

        {/* Assigned User Filter (Admin Only) */}
        {isAdmin && users.length > 0 && (
          <select
            className="deal-select-filter"
            value={assignedUser}
            onChange={(e) => setAssignedUser(e.target.value)}
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="deal-btn-reset-filters"
            onClick={onReset}
            title="Clear all filters"
          >
            <span>✕ Clear Filters</span>
          </button>
        )}
      </div>

      {/* Right Group: View Mode Switcher */}
      {setView && (
        <div className="deal-filter-right-group">
          <div className="deals-view-toggle">
            <button
              type="button"
              className={`view-btn ${view === "table" ? "active" : ""}`}
              onClick={() => setView("table")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`view-btn ${view === "cards" ? "active" : ""}`}
              onClick={() => setView("cards")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Cards</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealFilters;