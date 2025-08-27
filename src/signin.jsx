import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "1rem",
    backgroundColor: "#f3f4f6",
  },
  card: {
    width: "100%",
    maxWidth: "24rem",
    padding: "2rem",
    backgroundColor: "white",
    borderRadius: "0.75rem",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: "700",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "0.25rem",
  },
  inputContainer: {
    position: "relative",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  icon: {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#9ca3af",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "0.5rem",
    border: "1px solid #d1d5db",
    padding: "0.5rem 1rem 0.5rem 2.5rem",
    fontSize: "0.875rem",
    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
  },
  passwordInput: {
    paddingRight: "2.5rem",
  },
  toggleButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    color: "#6b7280",
    cursor: "pointer",
    background: "none",
    border: "none",
  },
  submitButton: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "0.75rem 1rem",
    border: "1px solid transparent",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    fontSize: "1.125rem",
    fontWeight: "500",
    color: "white",
    backgroundColor: "#111827",
    cursor: "pointer",
    transition: "background-color 0.15s ease-in-out",
  },
  submitButtonHover: {
    backgroundColor: "#374151",
  },
  errorText: {
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    color: "#dc2626",
  },
  signupText: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.875rem",
    color: "#4b5563",
  },
  signupLink: {
    fontWeight: "500",
    color: "#4f46e5",
    textDecoration: "none",
  },
  signupLinkHover: {
    color: "#6366f1",
  },
};

// Main App component
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Handles form submission
  const handleSignIn = (e) => {
    e.preventDefault();
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError("Email Address is required.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email Address is invalid.");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      // Logic for sign-in, e.g., API call
      console.log("Signing in with:", { email, password });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    if (email && password) {
      navigate("/orderby");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>

        <form onSubmit={handleSignIn} style={styles.form}>
          {/* Email Address Input */}
          <div>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <div style={styles.inputContainer}>
              <Mail style={styles.icon} className="h-5 w-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
              />
            </div>
            {emailError && <p style={styles.errorText}>{emailError}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <div style={styles.inputContainer}>
              <Lock style={styles.icon} className="h-5 w-5" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                style={{ ...styles.input, ...styles.passwordInput }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={styles.toggleButton}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordError && <p style={styles.errorText}>{passwordError}</p>}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            style={styles.submitButton}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                styles.submitButtonHover.backgroundColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                styles.submitButton.backgroundColor)
            }
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
