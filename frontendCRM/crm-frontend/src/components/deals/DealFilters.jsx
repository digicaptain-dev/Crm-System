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
  pipelines,
  assignedUser,
  setAssignedUser,
  users,
  onReset,

  // Permission
  isAdmin = false,
}) {
  const hasActiveFilters =
    search ||
    status ||
    priority ||
    pipeline ||
    assignedUser;

  return (
    <div className="deal-filters">

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="deal-filter-search">

        <span className="deal-search-icon">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search deals, organization, email..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        {search && (
          <button
            type="button"
            className="deal-search-clear"
            onClick={() =>
              setSearch("")
            }
            aria-label="Clear search"
          >
            ×
          </button>
        )}

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      <select
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value
          )
        }
        aria-label="Filter by status"
      >

        <option value="">
          All Status
        </option>

        <option value="Open">
          Open
        </option>

        <option value="Closed Won">
          Closed Won
        </option>

        <option value="Closed Lost">
          Closed Lost
        </option>

        <option value="Removed">
          Removed
        </option>

      </select>

      {/* =================================================
          PRIORITY
      ================================================= */}

      <select
        value={priority}
        onChange={(e) =>
          setPriority(
            e.target.value
          )
        }
        aria-label="Filter by priority"
      >

        <option value="">
          All Priority
        </option>

        <option value="High">
          High
        </option>

        <option value="Medium">
          Medium
        </option>

        <option value="Low">
          Low
        </option>

      </select>

      {/* =================================================
          PIPELINE
      ================================================= */}

      <select
        value={pipeline}
        onChange={(e) =>
          setPipeline(
            e.target.value
          )
        }
        aria-label="Filter by pipeline"
      >

        <option value="">
          All Pipelines
        </option>

        {pipelines.map(
          (item) => (
            <option
              key={
                item.pipeline_id
              }
              value={
                item.pipeline_id
              }
            >
              {
                item.pipeline_name
              }
            </option>
          )
        )}

      </select>

      {/* =================================================
          ASSIGNED USER
          ADMIN ONLY
      ================================================= */}

      {isAdmin && (
        <select
          value={assignedUser}
          onChange={(e) =>
            setAssignedUser(
              e.target.value
            )
          }
          aria-label="Filter by assigned user"
        >

          <option value="">
            All Assigned Users
          </option>

          <option value="unassigned">
            Unassigned
          </option>

          {users.map(
            (user) => (
              <option
                key={
                  user.user_id
                }
                value={
                  user.user_id
                }
              >
                {user.name}
              </option>
            )
          )}

        </select>
      )}

      {/* =================================================
          RESET
      ================================================= */}

      {hasActiveFilters && (
        <button
          type="button"
          className="filter-reset-button"
          onClick={onReset}
        >
          Reset
        </button>
      )}

    </div>
  );
}

export default DealFilters;