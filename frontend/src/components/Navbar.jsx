import { useState } from "react";

import {
  LogIn,
  UserPlus,
  LogOut,
  User,
  LayoutDashboard,
  Plus
} from "lucide-react";

function Navbar({
  setCurrentPage,
  currentPage,
  loggedInUser,
  onLogin,
  onRegister,
  onLogout,
  onProfilePictureChange
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      onProfilePictureChange(reader.result);
      setProfileOpen(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <nav className="navbar">

        <div
          className="logo"
          onClick={() => setCurrentPage("home")}
        >
          Stream<span>Sphere</span>
        </div>

        {!loggedInUser && (
          <div className="nav-actions">

            <button
              className="btn btn-secondary"
              onClick={onLogin}
            >
              <LogIn size={17} />
              Login
            </button>

            <button
              className="btn btn-primary"
              onClick={onRegister}
            >
              <UserPlus size={17} />
              Register
            </button>

          </div>
        )}

      </nav>

      {loggedInUser && currentPage !== "upload" && (
        <div className="app-bottom-bar">

          <div className="bottom-profile">

            <button
              className="bottom-profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="bottom-avatar">
                {loggedInUser.profilePicture ? (
                  <img
                    src={loggedInUser.profilePicture}
                    alt="Profile"
                  />
                ) : (
                  loggedInUser.name
                    ? loggedInUser.name.charAt(0).toUpperCase()
                    : <User size={18} />
                )}
              </div>
            </button>

            {profileOpen && (
              <div className="bottom-profile-dropdown">

                <label className="change-profile-picture">
                  <User size={17} />
                  Change Profile Picture

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                </label>

                {loggedInUser.role === "creator" && (
                  <button
                    onClick={() => {
                      setCurrentPage("dashboard");
                      setProfileOpen(false);
                    }}
                  >
                    <LayoutDashboard size={17} />
                    Dashboard
                  </button>
                )}

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={17} />
                  Logout
                </button>

              </div>
            )}

          </div>

          {currentPage !== "upload" && (
            <>
              <div className="bottom-navigation">

                <button onClick={() => setCurrentPage("home")}>
                  Home
                </button>

                <button onClick={() => setCurrentPage("explore")}>
                  Flips
                </button>

                <button onClick={() => setCurrentPage("categories")}>
                  Search
                </button>

              </div>

              {loggedInUser.role === "creator" && (
                <button
                  className="bottom-upload-button"
                  onClick={() => setCurrentPage("upload")}
                  title="Upload Video"
                >
                  <Plus size={24} />
                </button>
              )}
            </>
          )}

        </div>
      )}
    </>
  );
}

export default Navbar;
