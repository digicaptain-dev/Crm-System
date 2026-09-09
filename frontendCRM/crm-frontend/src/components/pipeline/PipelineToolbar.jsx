import "../../styles/pipeline/pipeline-toolbar.css";

function PipelineToolbar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  owners,
  view,
  onViewChange,
  onClearFilters,
}) {
  const handleFilterChange = (name, value) => {
    onFiltersChange({
      ...filters,
      [name]: value,
    });
  };

  const hasFilters =
    Boolean(searchValue) ||
    Boolean(filters.owner) ||
    Boolean(filters.status) ||
    Boolean(filters.priority);

  return (
    <div className="pipeline-toolbar-card">
      <div className="pipeline-toolbar-left">
        {/* Search */}
        <div className="pipeline-search-wrapper">
          <svg
            className="pipeline-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            className="pipeline-search-input"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search deals by name, email, or owner..."
          />

          {searchValue && (
            <button
              type="button"
              className="pipeline-search-clear-btn"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="pipeline-filter-row">
          <select
            className="pipeline-select-filter"
            value={filters.owner}
            onChange={(event) => handleFilterChange("owner", event.target.value)}
          >
            <option value="">All Owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>

          <select
            className="pipeline-select-filter"
            value={filters.status}
            onChange={(event) => handleFilterChange("status", event.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            className="pipeline-select-filter"
            value={filters.priority}
            onChange={(event) => handleFilterChange("priority", event.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              className="pipeline-clear-filter-btn"
              onClick={onClearFilters}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="pipeline-toolbar-right">
        <div className="pipeline-view-switcher">
          <button
            type="button"
            className={`view-btn ${view === "board" ? "is-active" : ""}`}
            onClick={() => onViewChange("board")}
            title="Kanban Board View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
            Board
          </button>

          <button
            type="button"
            className={`view-btn ${view === "list" ? "is-active" : ""}`}
            onClick={() => onViewChange("list")}
            title="List Table View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
        </div>
      </div>
    </div>
  );
}

export default PipelineToolbar;