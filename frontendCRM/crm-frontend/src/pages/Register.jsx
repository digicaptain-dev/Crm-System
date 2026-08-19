import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/auth/auth.css";
import "../styles/auth/register.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });


  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =  (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Frontend validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:1000/api/register",
        {
          name: form.name,
          email: form.email,
          password: form.password,
        }
      );

      console.log("Register response:", response.data);
      // Only navigate after successful backend response
      if (response.data.success) {
        alert("Account created successfully! Please log in.");
        navigate("/login");
      }
      else {
        setError(
          response.data.msg ||
          response.data.message ||
          "Registration failed."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );

    }finally {
      setLoading(false);
    }

  };

  return (
    <div className="auth-page register-page">

      <div className="auth-card register-card">

        <div className="auth-logo">
          CRM
        </div>

        <div className="auth-header">
          <h1>Create Account</h1>

          <p>
            Create your CRM account to get started.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label htmlFor="companyName">
              Company Name
            </label>

            <input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Enter company name"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-form-row">

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button register-button"
          >
            Create Account
          </button>

        </form>

        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Sign In
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;