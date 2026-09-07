import "../../styles/pipeline/pipeline-stats.css";

function PipelineStats({ pipeline }) {
  const stages = Array.isArray(pipeline?.stages)
    ? pipeline.stages
    : [];

  const deals = stages.flatMap((stage) =>
    Array.isArray(stage.deals) ? stage.deals : []
  );

  const totalDeals = deals.length;

  const totalValue = deals.reduce((total, deal) => {
    const value = Number(deal?.deal_value);

    return Number.isFinite(value)
      ? total + value
      : total;
  }, 0);

  const openDeals = deals.filter(
    (deal) =>
      String(deal?.deal_status || "").toLowerCase() ===
      "open"
  ).length;

  const wonDeals = deals.filter(
    (deal) =>
      String(deal?.deal_status || "").toLowerCase() ===
      "won"
  ).length;

  const lostDeals = deals.filter(
    (deal) =>
      String(deal?.deal_status || "").toLowerCase() ===
      "lost"
  ).length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      label: "Total Deals",
      value: totalDeals,
      icon: "▦",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(totalValue),
      icon: "$",
    },
    {
      label: "Open Deals",
      value: openDeals,
      icon: "◉",
    },
    {
      label: "Won",
      value: wonDeals,
      icon: "✓",
    },
    {
      label: "Lost",
      value: lostDeals,
      icon: "×",
    },
  ];

  return (
    <div className="pipeline-stats">
      {stats.map((stat) => (
        <div
          className="pipeline-stat-card"
          key={stat.label}
        >
          <div className="pipeline-stat-icon">
            {stat.icon}
          </div>

          <div className="pipeline-stat-content">
            <span className="pipeline-stat-label">
              {stat.label}
            </span>

            <strong className="pipeline-stat-value">
              {stat.value}
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PipelineStats;