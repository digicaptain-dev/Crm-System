import { useEffect, useState } from "react";
import "../../styles/pipeline/edit-pipeline-modal.css";

function EditPipelineModal({
  pipeline,
  onClose,
  onUpdate,
}) {
  const [form, setForm] = useState({
    pipeline_name: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pipeline) return;

    setForm({
      pipeline_name:
        pipeline.pipeline_name || "",
      description:
        pipeline.description || "",
    });
  }, [pipeline]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const pipelineName =
      form.pipeline_name.trim();

    if (!pipelineName) {
      return;
    }

    try {
      setSaving(true);

      await onUpdate({
        pipeline_name: pipelineName,
        description:
          form.description.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!pipeline) {
    return null;
  }

  return (
    <div
      className="pipeline-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="pipeline-modal">
        <div className="pipeline-modal-header">
          <div>
            <h2>Edit Pipeline</h2>

            <p>
              Update your pipeline details.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pipeline_name">
              Pipeline Name
            </label>

            <input
              id="pipeline_name"
              type="text"
              name="pipeline_name"
              value={form.pipeline_name}
              onChange={handleChange}
              placeholder="e.g. Sales Pipeline"
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="pipeline_description">
              Description
            </label>

            <textarea
              id="pipeline_description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter pipeline description"
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="pipeline-modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-pipeline-btn"
              disabled={
                saving ||
                !form.pipeline_name.trim()
              }
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPipelineModal;