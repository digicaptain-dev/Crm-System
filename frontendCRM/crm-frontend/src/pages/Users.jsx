import { useEffect, useMemo, useState } from "react";

import api from "../services/api";
import Modal from "../components/common/Modal";

import "../styles/users/users.css";


// =====================================================
// ROLE LABEL
// =====================================================

const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin";

    case "coworker":
      return "Manager";

    case "user":
      return "Employee";

    default:
      return role || "Unknown";
  }
};


// =====================================================
// INITIAL FORM
// =====================================================

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};


// =====================================================
// USERS PAGE
// =====================================================

function Users() {

  // ===================================================
  // STATE
  // ===================================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("All");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState(emptyForm);


  // ===================================================
  // FETCH USERS
  // ===================================================

  const fetchUsers = async () => {

    try {

      setLoading(true);
      setError("");

      console.log("Fetching users...");

      const response = await api.get("/users");

      console.log(
        "USERS API RESPONSE:",
        response.data
      );

      /*
        Backend currently returns:

        [
          {
            user_id,
            name,
            email
          }
        ]

        If role is also returned from backend,
        it will automatically work.
      */

      setUsers(
        Array.isArray(response.data?.users)
          ? response.data.users
          : []
      );

    } catch (error) {

      console.error(
        "FETCH USERS ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to fetch users."
      );

    } finally {

      setLoading(false);

    }
  };


  // ===================================================
  // LOAD USERS ON PAGE LOAD
  // ===================================================

  useEffect(() => {

    fetchUsers();

  }, []);


  // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {

    return users.filter((user) => {

      let matchesTab = true;

      // -----------------------------------------------
      // ROLE FILTER
      // -----------------------------------------------

      if (activeTab === "Manager") {

        matchesTab =
          user.role === "coworker";

      }

      if (activeTab === "Employee") {

        matchesTab =
          user.role === "user";

      }

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =

        user.name
          ?.toLowerCase()
          .includes(searchValue) ||

        user.email
          ?.toLowerCase()
          .includes(searchValue);

      return (
        matchesTab &&
        matchesSearch
      );

    });

  }, [users, activeTab, search]);


  // ===================================================
  // STATISTICS
  // ===================================================

  const totalUsers = users.length;

  const managerCount =
    users.filter(
      (user) =>
        user.role === "coworker"
    ).length;

  const employeeCount =
    users.filter(
      (user) =>
        user.role === "user"
    ).length;


  // ===================================================
  // OPEN CREATE MODAL
  // ===================================================

  const openCreateModal = () => {

    setSelectedUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "user",
    });

    setError("");

    setShowModal(true);

  };


  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (user) => {

    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
    });

    setError("");

    setShowModal(true);

  };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {

    if (saving) {
      return;
    }

    setShowModal(false);

    setSelectedUser(null);

    setForm(emptyForm);

  };


  // ===================================================
  // HANDLE INPUT
  // ===================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

  };


  // ===================================================
  // CREATE / UPDATE USER
  // ===================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setSaving(true);

      setError("");


      // =================================================
      // UPDATE
      // =================================================

      if (selectedUser) {

        console.log(
          "Updating user:",
          selectedUser.user_id
        );

        await api.put(
          `/users/${selectedUser.user_id}`,
          {
            name: form.name,
            email: form.email,
            role: form.role,
          }
        );

      }

      // =================================================
      // CREATE
      // =================================================

      else {

        console.log(
          "Creating user:",
          form
        );

        await api.post(
          "/users",
          {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          }
        );

      }


      // =================================================
      // CLOSE MODAL
      // =================================================

      setShowModal(false);

      setSelectedUser(null);

      setForm(emptyForm);


      // =================================================
      // REFRESH USERS
      // =================================================

      await fetchUsers();

    } catch (error) {

      console.error(
        "SAVE USER ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.response?.data?.msg ||
        "Failed to save user."
      );

    } finally {

      setSaving(false);

    }

  };


  // ===================================================
  // DELETE USER
  // ===================================================

  const deleteUser = async (userId) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmed) {
      return;
    }


    try {

      setError("");

      console.log(
        "Deleting user:",
        userId
      );

      await api.delete(
        `/users/${userId}`
      );


      // Refresh data from database
      await fetchUsers();

    } catch (error) {

      console.error(
        "DELETE USER ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to delete user."
      );

    }

  };


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date) => {

    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (Number.isNaN(
      parsedDate.getTime()
    )) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

  };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="users-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="users-header">

        <div>

          <h1>
            Users
          </h1>

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


      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (

        <div className="user-error">

          {error}

        </div>

      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="user-statistics">


        {/* TOTAL */}

        <div className="user-stat-card">

          <div className="stat-label">
            Total Users
          </div>

          <div className="stat-value">
            {totalUsers}
          </div>

        </div>


        {/* MANAGERS */}

        <div className="user-stat-card">

          <div className="stat-label">
            Managers
          </div>

          <div className="stat-value">
            {managerCount}
          </div>

        </div>


        {/* EMPLOYEES */}

        <div className="user-stat-card">

          <div className="stat-label">
            Employees
          </div>

          <div className="stat-value">
            {employeeCount}
          </div>

        </div>


        {/* ACTIVE */}

        <div className="user-stat-card">

          <div className="stat-label">
            Registered Users
          </div>

          <div className="stat-value">
            {totalUsers}
          </div>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="users-controls">


        {/* TABS */}

        <div className="user-tabs">

          {[
            "All",
            "Manager",
            "Employee"
          ].map((tab) => (

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

              {tab === "All"
                ? "All"
                : `${tab}s`}

            </button>

          ))}

        </div>


        {/* SEARCH */}

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


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="users-table-wrapper">


        {loading ? (

          <div className="empty-users">

            Loading users...

          </div>

        ) : (

          <table className="users-table">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Created
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredUsers.map(
                (user) => (

                  <tr
                    key={user.user_id}
                  >


                    {/* USER */}

                    <td>

                      <div className="user-cell">

                        <div className="user-avatar">

                          {user.name
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>


                        <div>

                          <div className="user-name">

                            {user.name}

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* EMAIL */}

                    <td>

                      {user.email}

                    </td>


                    {/* ROLE */}

                    <td>

                      <span
                        className={`role-badge ${user.role || "user"}`}
                      >

                        {getRoleLabel(
                          user.role
                        )}

                      </span>

                    </td>


                    {/* CREATED */}

                    <td>

                      {formatDate(
                        user.created_at
                      )}

                    </td>


                    {/* ACTIONS */}

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
                            deleteUser(
                              user.user_id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}


        {/* EMPTY */}

        {!loading &&
          filteredUsers.length === 0 && (

            <div className="empty-users">

              {search
                ? "No users match your search."
                : "No users found."}

            </div>

          )}

      </div>


      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showModal && (

        <Modal

          title={
            selectedUser
              ? "Edit User"
              : "Add User"
          }

          onClose={closeModal}

        >

          <form
            className="user-form"
            onSubmit={handleSubmit}
          >


            {/* NAME */}

            <div className="form-group">

              <label>
                Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />

            </div>


            {/* PASSWORD ONLY CREATE */}

            {!selectedUser && (

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  minLength={6}
                  required
                />

              </div>

            )}


            {/* ROLE */}

            <div className="form-group">

              <label>
                Role
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >

                <option value="user">
                  Employee
                </option>

                <option value="coworker">
                  Manager
                </option>

              </select>

            </div>


            {/* FORM ACTIONS */}

            <div className="form-actions">


              <button
                type="button"
                className="secondary-button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : selectedUser
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

