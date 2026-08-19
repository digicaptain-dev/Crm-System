import { useState } from "react";

function CreateDeal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    owner: "",
    value: "",
    priority: "Medium",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onCreate({
      ...form,
      id: Date.now(),
      stage: "New Leads",
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Deal Name</label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter deal name"
          required
        />
      </div>

      <div className="form-group">
        <label>Company</label>

        <input
          name="company"
          value={form.company}
          onChange={handleChange}
          placeholder="Enter company"
          required
        />
      </div>

      <div className="form-group">
        <label>Email</label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter email"
        />
      </div>

      <div className="form-group">
        <label>Owner</label>

        <input
          name="owner"
          value={form.owner}
          onChange={handleChange}
          placeholder="Enter owner"
        />
      </div>

      <div className="form-group">
        <label>Deal Value</label>

        <input
          name="value"
          value={form.value}
          onChange={handleChange}
          placeholder="$10,000"
        />
      </div>

      <div className="form-group">
        <label>Priority</label>

        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
        >
          Create Deal
        </button>
      </div>
    </form>
  );
}

export default CreateDeal;