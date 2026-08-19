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

    const pipelineId = `pipeline-${Date.now()}`;

    const newPipeline = {
      pipeline_id: pipelineId,
      pipeline_name: form.pipeline_name,
      description: form.description,

      stages: [
        {
          stage_id: `${pipelineId}-stage-1`,
          stage_name: "Qualified",
          stage_order: 1,
          deals: [],
        },
        {
          stage_id: `${pipelineId}-stage-2`,
          stage_name: "Content Made",
          stage_order: 2,
          deals: [],
        },
        {
          stage_id: `${pipelineId}-stage-3`,
          stage_name: "Demo Scheduled",
          stage_order: 3,
          deals: [],
        },
        {
          stage_id: `${pipelineId}-stage-4`,
          stage_name: "Proposal Made",
          stage_order: 4,
          deals: [],
        },
        {
          stage_id: `${pipelineId}-stage-5`,
          stage_name: "Negotiations Started",
          stage_order: 5,
          deals: [],
        },
      ],
    };

    onCreate(newPipeline);
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