import { useState, useRef, useEffect } from "react";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
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

  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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
  // HANDLE IMAGE UPLOAD (CLOUDINARY)
  // =====================================================
  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingScreenshot(true);
      setUploadError("");
      const url = await uploadToCloudinary(file);
      setScreenshotUrl(url);
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setUploadError(err.message || "Failed to upload screenshot. Please try again.");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // =====================================================
  // CLIPBOARD PASTE LISTENER (Ctrl + V)
  // =====================================================
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await handleImageUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

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
      screenshot_url: screenshotUrl ? screenshotUrl.trim() : null,
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
    <>
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

          {/* SCREENSHOT DROPZONE / PASTE ATTACHMENT */}
          <div className="form-group form-group-full screenshot-field-container">
            <label>
              Lead Screenshot / Attachment
              <span className="optional-tag">(Optional • Paste with Ctrl+V)</span>
            </label>

            {screenshotUrl ? (
              <div className="screenshot-preview-card">
                <div
                  className="screenshot-thumb-wrapper"
                  onClick={() => setPreviewModalOpen(true)}
                  title="Click to view full screenshot"
                >
                  <img
                    src={screenshotUrl}
                    alt="Attached Lead Screenshot"
                    className="screenshot-thumb-img"
                  />
                  <div className="screenshot-zoom-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Zoom</span>
                  </div>
                </div>

                <div className="screenshot-info">
                  <div className="screenshot-success-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Screenshot Attached & Saved</span>
                  </div>
                  <div className="screenshot-actions">
                    <button
                      type="button"
                      className="screenshot-view-btn"
                      onClick={() => setPreviewModalOpen(true)}
                    >
                      View Full Size
                    </button>
                    <button
                      type="button"
                      className="screenshot-remove-btn"
                      onClick={() => setScreenshotUrl("")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`screenshot-dropzone ${uploadingScreenshot ? "is-uploading" : ""}`}
                onClick={() => !uploadingScreenshot && fileInputRef.current?.click()}
                title="Click or Paste (Ctrl+V) Screenshot"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />

                {uploadingScreenshot ? (
                  <div className="screenshot-loading-box">
                    <div className="screenshot-spinner" />
                    <span className="screenshot-loading-text">
                      Uploading to Cloudinary...
                    </span>
                  </div>
                ) : (
                  <div className="screenshot-dropzone-content">
                    <div className="screenshot-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="screenshot-text-stack">
                      <span className="dropzone-title">
                        <strong>Click to upload</strong> or <strong>Ctrl + V</strong> anywhere to paste
                      </span>
                      <span className="dropzone-subtitle">
                        Compressed & uploaded directly to Cloudinary (PNG, JPG, WebP)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="screenshot-error-msg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {uploadError}
              </div>
            )}
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
            disabled={submitting || uploadingScreenshot}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting || uploadingScreenshot}
          >
            {submitting ? "Creating Lead..." : "Create Lead"}
          </button>
        </div>
      </form>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {previewModalOpen && (
        <div
          className="screenshot-lightbox-backdrop"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="screenshot-lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="screenshot-lightbox-header">
              <span>Attached Screenshot Preview</span>
              <button
                type="button"
                className="screenshot-lightbox-close"
                onClick={() => setPreviewModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="screenshot-lightbox-body">
              <img
                src={screenshotUrl}
                alt="Full Screenshot"
                className="screenshot-lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateDeal;