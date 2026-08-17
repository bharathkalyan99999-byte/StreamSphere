import { useState } from "react";
import { X } from "lucide-react";

function AuthModal({
  mode,
  onClose,
  onLogin,
  onRegister
}) {
  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("consumer");

  const [message, setMessage] =
    useState("");

  const isLogin = mode === "login";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    try {
      if (isLogin) {
        const result = await onLogin(
          email,
          password
        );

        if (result?.error) {
          setMessage(result.error);
        }

      } else {
        const result = await onRegister(
          name,
          email,
          password,
          role
        );

        if (result?.error) {
          setMessage(result.error);
        } else {
          setMessage(
            "Registration successful! You can now log in."
          );
        }
      }

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <div>
            <h2>
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="section-subtitle">
              {isLogin
                ? "Log in to continue to StreamSphere."
                : "Join the StreamSphere community."}
            </p>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            <X size={22} />
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type</label>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                >
                  <option value="consumer">
                    Consumer — Watch videos
                  </option>

                  <option value="creator">
                    Creator — Upload videos
                  </option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {isLogin
              ? "Login"
              : "Create Account"}
          </button>

          {message && (
            <p className="section-subtitle">
              {message}
            </p>
          )}

        </form>

      </div>

    </div>
  );
}

export default AuthModal;
