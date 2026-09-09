import "../../styles/pipeline/pipeline-stats.css";

function PipelineStats({ pipeline }) {
  const stages = Array.isArray(pipeline?.stages) ? pipeline.stages : [];

  const deals = stages.flatMap((stage) =>
    Array.isArray(stage.deals) ? stage.deals : []
  );

  const totalDeals = deals.length;

  const totalValue = deals.reduce((total, deal) => {
    const value = Number(deal?.deal_value);
    return Number.isFinite(value) ? total + value : total;
  }, 0);

  const openDeals = deals.filter(
    (deal) => !deal?.deal_status || String(deal?.deal_status).toLowerCase() === "open"
  );

  const wonDeals = deals.filter(
    (deal) => String(deal?.deal_status || "").toLowerCase() === "won"
  );

  const lostDeals = deals.filter(
    (deal) => String(deal?.deal_status || "").toLowerCase() === "lost"
  );

  const openValue = openDeals.reduce((sum, d) => sum + Number(d.deal_value || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.deal_value || 0), 0);
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
  const avgDeal = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="pipeline-kpi-grid">
      {/* 1. Total Deals */}
      <div className="pipeline-kpi-card card-blue">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Total Deals</span>
          <div className="kpi-icon-pill icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>
        <div className="kpi-card-value">{totalDeals}</div>
        <div className="kpi-card-footer">
          <span className="kpi-sub-text">Across {stages.length} active stages</span>
        </div>
      </div>

      {/* 2. Pipeline Value */}
      <div className="pipeline-kpi-card card-violet">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Pipeline Value</span>
          <div className="kpi-icon-pill icon-violet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
        <div className="kpi-card-value highlight-violet">{formatCurrency(totalValue)}</div>
        <div className="kpi-card-footer">
          <span className="kpi-sub-text">Avg: {formatCurrency(avgDeal)} / deal</span>
        </div>
      </div>

      {/* 3. Open Deals */}
      <div className="pipeline-kpi-card card-amber">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Open Deals</span>
          <div className="kpi-icon-pill icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        <div className="kpi-card-value">{openDeals.length}</div>
        <div className="kpi-card-footer">
          <span className="kpi-sub-text">Value: {formatCurrency(openValue)}</span>
        </div>
      </div>

      {/* 4. Won Deals */}
      <div className="pipeline-kpi-card card-emerald">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Won Deals</span>
          <div className="kpi-icon-pill icon-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <div className="kpi-card-value">{wonDeals.length}</div>
        <div className="kpi-card-footer">
          <span className="kpi-badge-win">{winRate}% Win Rate</span>
          <span className="kpi-sub-text">{formatCurrency(wonValue)}</span>
        </div>
      </div>

      {/* 5. Lost Deals */}
      <div className="pipeline-kpi-card card-rose">
        <div className="kpi-card-header">
          <span className="kpi-card-label">Lost Deals</span>
          <div className="kpi-icon-pill icon-rose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
        <div className="kpi-card-value">{lostDeals.length}</div>
        <div className="kpi-card-footer">
          <span className="kpi-sub-text">
            {totalDeals > 0 ? Math.round((lostDeals.length / totalDeals) * 100) : 0}% loss rate
          </span>
        </div>
      </div>
    </div>
  );
}

export default PipelineStats;