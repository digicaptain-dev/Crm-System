import { useState } from "react";

import "../../styles/pipeline/create-pipeline-modal.css";

function CreatePipelineModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    pipeline_name: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.pipeline_name.trim()) {
      return;
    }

    onCreate({
      pipeline_name: form.pipeline_name.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <div className="pipeline-modal-overlay">
      <div className="pipeline-modal">
        <div className="pipeline-modal-header">
          <div>
            <h2>Create Pipeline</h2>
            <p>Create a new sales pipeline.</p>
          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pipeline Name</label>

            <input
              type="text"
              name="pipeline_name"
              value={form.pipeline_name}
              onChange={handleChange}
              placeholder="e.g. Sales Pipeline"
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter pipeline description"
              rows="4"
            />
          </div>

          <div className="pipeline-modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-pipeline-btn"
            >
              Create Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePipelineModal;