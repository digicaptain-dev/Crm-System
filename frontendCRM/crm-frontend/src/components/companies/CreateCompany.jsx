import { useState } from "react";

import "../../styles/companies/create-company.css";

function CreateCompany({
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    industry: "Technology",
    owner: "",
    status: "Active",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onCreate(form);
  };

  return (
    <form
      className="create-company-form"
      onSubmit={handleSubmit}
    >

      <div className="form-group">
        <label>Company Name</label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter company name"
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
          placeholder="Enter company email"
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
        <label>Website</label>

        <input
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="www.example.com"
        />
      </div>


      <div className="form-group">
        <label>Industry</label>

        <select
          name="industry"
          value={form.industry}
          onChange={handleChange}
        >
          <option>Technology</option>
          <option>Finance</option>
          <option>Marketing</option>
          <option>Healthcare</option>
          <option>Retail</option>
          <option>Manufacturing</option>
          <option>Other</option>
        </select>
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
          <option>Active</option>
          <option>Inactive</option>
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
          Create Company
        </button>

      </div>

    </form>
  );
}

export default CreateCompany;