import { useState } from "react";

function CreateLead({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    owner: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    status: "New",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "company" && !prev.name ? { name: value } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.company.trim()) {
      alert("Please enter Business Name.");
      return;
    }
    if (!form.owner.trim()) {
      alert("Please enter Owner Name.");
      return;
    }
    if (!form.website.trim()) {
      alert("Please enter Website.");
      return;
    }
    if (!form.phone.trim()) {
      alert("Please enter Phone Number.");
      return;
    }
    if (!form.email.trim()) {
      alert("Please enter Email Address.");
      return;
    }
    if (!form.address.trim()) {
      alert("Please enter Address / Location.");
      return;
    }

    onCreate({
      id: Date.now(),
      name: form.company.trim(),
      company: form.company.trim(),
      owner: form.owner.trim(),
      website: form.website.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      status: form.status,
    });

    onClose();
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Business Name <span className="required-star">*</span></label>
        <input
          name="company"
          value={form.company}
          onChange={handleChange}
          placeholder="e.g. Acme Corporation"
          required
        />
      </div>

      <div className="form-group">
        <label>Owner Name <span className="required-star">*</span></label>
        <input
          name="owner"
          value={form.owner}
          onChange={handleChange}
          placeholder="e.g. Suyash Sharma"
          required
        />
      </div>

      <div className="form-group">
        <label>Website <span className="required-star">*</span></label>
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="e.g. https://example.com"
          required
        />
      </div>

      <div className="form-group">
        <label>Phone Number <span className="required-star">*</span></label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="e.g. +91 9876543210"
          required
        />
      </div>

      <div className="form-group">
        <label>Email Address <span className="required-star">*</span></label>
        <input
          type="text"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="e.g. contact@example.com or Contact via website"
          required
        />
      </div>

      <div className="form-group">
        <label>Address / Location <span className="required-star">*</span></label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="e.g. Sector 62, Noida, India"
          required
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