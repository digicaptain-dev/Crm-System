import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/auth/auth.css";
import "../styles/auth/login.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:1000/api/login",
        {
          email: form.email,
          password: form.password,
        }
      );

      console.log("Login response:", response.data);

      // Only save token if backend returned one
      if (response.data.token) {
        localStorage.setItem(
          "token",
          response.data.token
        );

        // Navigate ONLY after successful backend response
        navigate("/");
      } else {
        setError("Login failed. Token not received.");
      }

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Invalid email or password"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">

      <div className="auth-card">

        <div className="auth-logo">
          CRM
        </div>

        <div className="auth-header">
          <h1>Welcome Back</h1>

          <p>
            Sign in to your account to continue.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

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

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-options">

            <label className="remember-me">

              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />

              <span>
                Remember me
              </span>

            </label>

            <button
              type="button"
              className="forgot-password"
            >
              Forgot Password?
            </button>

          </div>

          <button
            type="submit"
            className="primary-button login-button"
          >
            Sign In
          </button>

        </form>

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create Account
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;