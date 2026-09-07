import "../../styles/pipeline/pipeline-summary.css";

function PipelineSummary({ deals = [] }) {
  const totalDeals = deals.length;

  const totalValue = deals.reduce(
    (total, deal) =>
      total + Number(deal.deal_value || 0),
    0
  );

  const openDeals = deals.filter(
    (deal) =>
      String(
        deal.deal_status || "Open"
      ).toLowerCase() === "open"
  ).length;

  const wonDeals = deals.filter(
    (deal) =>
      String(
        deal.deal_status || ""
      ).toLowerCase() === "won"
  ).length;

  const lostDeals = deals.filter(
    (deal) =>
      String(
        deal.deal_status || ""
      ).toLowerCase() === "lost"
  ).length;

  const formatCurrency = (value) => {
    return `$${Number(value).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 0,
      }
    )}`;
  };

  const cards = [
    {
      label: "Total Deals",
      value: totalDeals,
      icon: "▣",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(
        totalValue
      ),
      icon: "$",
    },
    {
      label: "Open Deals",
      value: openDeals,
      icon: "◉",
    },
    {
      label: "Won Deals",
      value: wonDeals,
      icon: "✓",
    },
    {
      label: "Lost Deals",
      value: lostDeals,
      icon: "×",
    },
  ];

  return (
    <div className="pipeline-summary">

      {cards.map((card) => (
        <div
          className="pipeline-summary-card"
          key={card.label}
        >
          <div className="pipeline-summary-icon">
            {card.icon}
          </div>

          <div className="pipeline-summary-content">
            <span>
              {card.label}
            </span>

            <strong>
              {card.value}
            </strong>
          </div>
        </div>
      ))}

    </div>
  );
}

export default PipelineSummary;