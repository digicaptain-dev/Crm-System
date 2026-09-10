import "../../styles/pipeline/pipeline-summary.css";

function PipelineSummary({ deals = [] }) {
  const totalDeals = deals.length;

  const lostDeals = deals.filter(
    (deal) =>
      String(
        deal.deal_status || ""
      ).toLowerCase() === "lost"
  ).length;

  const cards = [
    {
      label: "Total Deals",
      value: totalDeals,
      icon: "▣",
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