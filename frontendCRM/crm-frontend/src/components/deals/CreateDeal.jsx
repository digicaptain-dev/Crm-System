import { useState } from "react";
import "../../styles/deals/create-deal.css";

function CreateDeal({
  onClose,
  onCreate,
  pipelines = [],
}) {
  const [form, setForm] = useState({
    deal_organization: "",
    deal_owner: "",
    website: "",
    customer_number: "",
    customer_email: "",
    customer_address: "",
    deal_priority: "Medium",
    pipeline_id: "",
    deal_stage: "",
    deal_status: "Open",
    deal_notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "pipeline_id" ? { deal_stage: "" } : {}),
    }));
  };

  // =====================================================
  // SELECTED PIPELINE & STAGES
  // =====================================================
  const selectedPipeline = pipelines.find(
    (pipeline) => String(pipeline.pipeline_id) === String(form.pipeline_id)
  ) || pipelines[0];

  // =====================================================
  // SUBMIT
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.pipeline_id) {
      alert("Please select a pipeline.");
      return;
    }

    if (!form.deal_stage) {
      alert("Please select a pipeline stage.");
      return;
    }

    if (!form.deal_organization.trim()) {
      alert("Please enter a Business Name.");
      return;
    }

    if (!form.deal_owner.trim()) {
      alert("Please enter Owner Name.");
      return;
    }

    if (!form.website.trim()) {
      alert("Please enter Website.");
      return;
    }

    if (!form.customer_number.trim()) {
      alert("Please enter Phone Number.");
      return;
    }

    if (!form.customer_email.trim()) {
      alert("Please enter Email Address.");
      return;
    }

    if (!form.customer_address.trim()) {
      alert("Please enter Address / Location.");
      return;
    }

    const dealData = {
      deal_name: form.deal_organization.trim(),
      deal_organization: form.deal_organization.trim(),
      deal_owner: form.deal_owner.trim(),
      website: form.website.trim(),
      customer_number: form.customer_number.trim(),
      customer_email: form.customer_email.trim(),
      customer_address: form.customer_address.trim(),
      deal_priority: form.deal_priority,
      pipeline_id: form.pipeline_id,
      deal_stage: form.deal_stage,
      deal_status: form.deal_status,
      deal_notes: form.deal_notes.trim() || null,
      deal_source: form.website.trim() || null,
    };

    try {
      setSubmitting(true);
      if (onCreate) {
        await onCreate(dealData);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="create-deal-form" onSubmit={handleSubmit}>
      <div className="create-deal-grid">
        {/* PIPELINE */}
        <div className="form-group">
          <label>
            Pipeline <span className="required-star">*</span>
          </label>
          <select
            name="pipeline_id"
            value={form.pipeline_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Pipeline</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                {pipeline.pipeline_name}
              </option>
            ))}
          </select>
        </div>

        {/* STAGE */}
        <div className="form-group">
          <label>
            Stage <span className="required-star">*</span>
          </label>
          <select
            name="deal_stage"
            value={form.deal_stage}
            onChange={handleChange}
            required
            disabled={!selectedPipeline}
          >
            <option value="">
              {selectedPipeline ? "Select Stage" : "Select Pipeline First"}
            </option>
            {selectedPipeline?.stages
              ?.slice()
              .sort((a, b) => Number(a.stage_order || 0) - Number(b.stage_order || 0))
              .map((stage) => (
                <option key={stage.stage_id} value={stage.stage_id}>
                  {stage.stage_name}
                </option>
              ))}
          </select>
        </div>

        {/* BUSINESS NAME */}
        <div className="form-group form-group-full">
          <label>
            Business Name <span className="required-star">*</span>
          </label>
          <input
            name="deal_organization"
            value={form.deal_organization}
            onChange={handleChange}
            placeholder="e.g. Acme Corporation Pvt Ltd"
            required
          />
        </div>

        {/* OWNER NAME */}
        <div className="form-group">
          <label>
            Owner Name <span className="required-star">*</span>
          </label>
          <input
            name="deal_owner"
            value={form.deal_owner}
            onChange={handleChange}
            placeholder="e.g. Suyash Sharma"
            required
          />
        </div>

        {/* WEBSITE */}
        <div className="form-group">
          <label>
            Website <span className="required-star">*</span>
          </label>
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="e.g. https://example.com"
            required
          />
        </div>

        {/* PHONE NUMBER */}
        <div className="form-group">
          <label>
            Phone Number <span className="required-star">*</span>
          </label>
          <input
            type="tel"
            name="customer_number"
            value={form.customer_number}
            onChange={handleChange}
            placeholder="e.g. +91 9876543210"
            required
          />
        </div>

        {/* EMAIL ADDRESS */}
        <div className="form-group">
          <label>
            Email Address <span className="required-star">*</span>
          </label>
          <input
            type="text"
            name="customer_email"
            value={form.customer_email}
            onChange={handleChange}
            placeholder="e.g. contact@example.com or Contact via website"
            required
          />
        </div>

        {/* ADDRESS / LOCATION */}
        <div className="form-group form-group-full">
          <label>
            Address / Location <span className="required-star">*</span>
          </label>
          <input
            name="customer_address"
            value={form.customer_address}
            onChange={handleChange}
            placeholder="e.g. Sector 62, Noida, Uttar Pradesh, India"
            required
          />
        </div>

        {/* PRIORITY */}
        <div className="form-group">
          <label>Priority</label>
          <select
            name="deal_priority"
            value={form.deal_priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* STATUS */}
        <div className="form-group">
          <label>Status</label>
          <select
            name="deal_status"
            value={form.deal_status}
            onChange={handleChange}
          >
            <option value="Open">Open</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* NOTES */}
        <div className="form-group form-group-full">
          <label>Deal Notes / Context</label>
          <textarea
            name="deal_notes"
            value={form.deal_notes}
            onChange={handleChange}
            placeholder="Key discussion points, requirements, or next steps..."
            rows="3"
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={submitting}
        >
          {submitting ? "Creating Lead..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}

export default CreateDeal;