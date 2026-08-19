import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../components/common/Modal";

import "../styles/users/users.css";

const initialUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john@company.com",
    role: "Manager",
    department: "Sales",
    status: "Active",
    phone: "+1 555 111 2222",
  },
  {
    id: 2,
    name: "David Wilson",
    email: "david@company.com",
    role: "Employee",
    department: "Sales",
    status: "Active",
    phone: "+1 555 333 4444",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@company.com",
    role: "Employee",
    department: "Marketing",
    status: "Inactive",
    phone: "+1 555 555 6666",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Manager",
    department: "Marketing",
    status: "Active",
    phone: "+1 555 777 8888",
  },
];

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] =
    useState(initialUsers);

  const [activeTab, setActiveTab] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Employee",
    department: "Sales",
    status: "Active",
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesTab =
        activeTab === "All" ||
        user.role === activeTab;

      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        user.name
          .toLowerCase()
          .includes(searchValue) ||
        user.email
          .toLowerCase()
          .includes(searchValue) ||
        user.department
          .toLowerCase()
          .includes(searchValue);

      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, search]);

  const openCreateModal = () => {
    setSelectedUser(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      role: "Employee",
      department: "Sales",
      status: "Active",
    });

    setShowModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      status: user.status,
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                ...form,
              }
            : user
        )
      );
    } else {
      setUsers((current) => [
        ...current,
        {
          id: Date.now(),
          ...form,
        },
      ]);
    }

    setShowModal(false);
  };

  const deleteUser = (userId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmed) {
      return;
    }

    setUsers((current) =>
      current.filter(
        (user) => user.id !== userId
      )
    );
  };

  return (
    <div className="users-page">

      {/* Header */}
      <div className="users-header">

        <div>
          <h1>Users</h1>

          <p>
            Manage managers and employees.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateModal}
        >
          + Add User
        </button>

      </div>

      {/* Statistics */}
      <div className="user-statistics">

        <div className="user-stat-card">
          <div className="stat-label">
            Total Users
          </div>

          <div className="stat-value">
            {users.length}
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-label">
            Managers
          </div>

          <div className="stat-value">
            {
              users.filter(
                (user) =>
                  user.role === "Manager"
              ).length
            }
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-label">
            Employees
          </div>

          <div className="stat-value">
            {
              users.filter(
                (user) =>
                  user.role === "Employee"
              ).length
            }
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-label">
            Active Users
          </div>

          <div className="stat-value">
            {
              users.filter(
                (user) =>
                  user.status === "Active"
              ).length
            }
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="users-controls">

        <div className="user-tabs">

          {["All", "Manager", "Employee"].map(
            (tab) => (
              <button
                key={tab}
                className={
                  activeTab === tab
                    ? "user-tab active"
                    : "user-tab"
                }
                onClick={() =>
                  setActiveTab(tab)
                }
              >
                {tab}s
              </button>
            )
          )}

        </div>

        <div className="user-search">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

      </div>

      {/* Table */}
      <div className="users-table-wrapper">

        <table className="users-table">

          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredUsers.map((user) => (
              <tr key={user.id}>

                <td>
                  <div className="user-cell">

                    <div className="user-avatar">
                      {user.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div className="user-name">
                        {user.name}
                      </div>
                    </div>

                  </div>
                </td>

                <td>{user.email}</td>

                <td>
                  <span
                    className={`role-badge ${user.role.toLowerCase()}`}
                  >
                    {user.role}
                  </span>
                </td>

                <td>{user.department}</td>

                <td>{user.phone}</td>

                <td>
                  <span
                    className={`status-badge ${user.status.toLowerCase()}`}
                  >
                    <span className="status-dot" />
                    {user.status}
                  </span>
                </td>

                <td>
                  <div className="user-actions">

                    <button
                      className="table-action"
                      onClick={() =>
                        openEditModal(user)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="table-action delete"
                      onClick={() =>
                        deleteUser(user.id)
                      }
                    >
                      Delete
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-users">
            No users found.
          </div>
        )}

      </div>

      {/* User modal */}
      {showModal && (
        <Modal
          title={
            selectedUser
              ? "Edit User"
              : "Add User"
          }
          onClose={() =>
            setShowModal(false)
          }
        >

          <form
            className="user-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">
              <label>Name</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
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

            <div className="form-row">

              <div className="form-group">
                <label>Role</label>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="Employee">
                    Employee
                  </option>

                  <option value="Manager">
                    Manager
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>

                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                >
                  <option>Sales</option>
                  <option>Marketing</option>
                  <option>Support</option>
                  <option>Operations</option>
                </select>
              </div>

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
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {selectedUser
                  ? "Update User"
                  : "Create User"}
              </button>

            </div>

          </form>

        </Modal>
      )}

    </div>
  );
}

export default Users;