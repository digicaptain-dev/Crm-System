import "../styles/deals/deals.css";

function Deals() {
  return (
    <div className="deals-page">
      <div className="page-header">
        <div>
          <h1>Deals</h1>
          <p>Manage your deals and opportunities.</p>
        </div>

        <button className="primary-button">
          + Add Deal
        </button>
      </div>

      <div className="deals-content">
        <p>No deals available.</p>
      </div>
    </div>
  );
}

export default Deals;