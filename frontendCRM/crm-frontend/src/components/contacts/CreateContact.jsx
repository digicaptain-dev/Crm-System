import { useState } from "react";

import "../../styles/contacts/create-contact.css";

function CreateContact({
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
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
      className="create-contact-form"
      onSubmit={handleSubmit}
    >

      <div className="form-group">
        <label>Name</label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter contact name"
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
          required
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
        <label>Company</label>

        <input
          name="company"
          value={form.company}
          onChange={handleChange}
          placeholder="Enter company"
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
          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
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
          Create Contact
        </button>

      </div>

    </form>
  );
}

export default CreateContact;