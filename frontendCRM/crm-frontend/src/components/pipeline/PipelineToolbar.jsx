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
    searchValue ||
    filters.owner ||
    filters.status ||
    filters.priority;

  return (
    <div className="pipeline-toolbar">
      <div className="pipeline-toolbar-left">
        <div className="pipeline-search">
          <span className="pipeline-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={searchValue}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search deals..."
          />

          {searchValue && (
            <button
              type="button"
              className="pipeline-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="pipeline-filter-group">
          <select
            value={filters.owner}
            onChange={(event) =>
              handleFilterChange(
                "owner",
                event.target.value
              )
            }
          >
            <option value="">All Owners</option>

            {owners.map((owner) => (
              <option
                key={owner}
                value={owner}
              >
                {owner}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              handleFilterChange(
                "status",
                event.target.value
              )
            }
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            value={filters.priority}
            onChange={(event) =>
              handleFilterChange(
                "priority",
                event.target.value
              )
            }
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            className="pipeline-clear-filters"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="pipeline-toolbar-right">
        <div className="pipeline-view-toggle">
          <button
            type="button"
            className={
              view === "board"
                ? "active"
                : ""
            }
            onClick={() =>
              onViewChange("board")
            }
          >
            Board
          </button>

          <button
            type="button"
            className={
              view === "list"
                ? "active"
                : ""
            }
            onClick={() =>
              onViewChange("list")
            }
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}

export default PipelineToolbar;