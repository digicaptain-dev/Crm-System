import { useState } from "react";

function CreateLead({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    owner: "",
    status: "New",
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
      id: Date.now(),
      ...form,
    });

    onClose();
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>

      <div className="form-group">
        <label>Lead Name</label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter lead name"
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
        <label>Phone</label>

        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
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
        <label>Status</label>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Converted</option>
          <option>Lost</option>
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
          Create Lead
        </button>

      </div>

    </form>
  );
}

export default CreateLead;