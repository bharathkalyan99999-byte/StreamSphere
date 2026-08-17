import { useState } from "react";

function App() {
  // Authentication
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("consumer");

  const [authMessage, setAuthMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Explore
  const [showExplore, setShowExplore] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  // Check backend
  const checkBackend = async () => {
    try {
      const response = await fetch("http://localhost:5001/");
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert("Backend is not connected");
    }
  };

  // Register user
  const registerUser = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5001/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setAuthMessage(data.message || "Registration successful!");

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setAuthMessage(
        "Registration failed: " + error.message
      );
    }
  };

  // Login user
  const loginUser = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5001/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setLoggedInUser(data.user || {
        email: email
      })

      localStorage.setItem("token", data.token);;

      setAuthMessage(data.message || "Login successful!");

      setEmail("");
      setPassword("");
    } catch (error) {
      setAuthMessage(
        "Login failed: " + error.message
      );
    }
  };

  // Explore videos
  const exploreVideos = async () => {
    setShowExplore(true);
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5001/videos"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Could not load videos");
      }

      setVideos(data);
    } catch (error) {
      console.error(
        "Error fetching videos:",
        error
      );

      alert("Could not load videos");
    } finally {
      setLoading(false);
    }
  };

  // Upload video
  const uploadVideo = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage(
        "Please select a video file."
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      "video",
      selectedFile
    );

    formData.append(
      "title",
      title
    );

    formData.append(
      "description",
      description
    );

    formData.append(
      "category",
      category
    );

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/upload",
        {
          method: "POST",
	  headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      setUploadMessage(
        data.message || "Video uploaded successfully!"
      );

      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
    } catch (error) {
      setUploadMessage(
        "Upload failed: " + error.message
      );
    }
  };

  // Logout
  const logoutUser = () => {
    setLoggedInUser(null);
    setAuthMessage("Logged out successfully.");
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px",
        fontFamily: "Arial"
      }}
    >
      <h1>StreamSphere</h1>

      <p>
        A platform for streaming and discovering videos.
      </p>

      <hr />

      <h2>Backend Connection</h2>

      <button onClick={checkBackend}>
        Check Backend
      </button>

      <hr />

      {!loggedInUser && (
        <>
          <button
            onClick={() => {
              setShowRegister(!showRegister);
              setShowLogin(false);
            }}
          >
            Register
          </button>

          <button
            onClick={() => {
              setShowLogin(!showLogin);
              setShowRegister(false);
            }}
            style={{
              marginLeft: "10px"
            }}
          >
            Login
          </button>
        </>
      )}

      {loggedInUser && (
        <div>
          <h3>
            Welcome,{" "}
            {loggedInUser.name ||
              loggedInUser.email}
          </h3>

          <button onClick={logoutUser}>
            Logout
          </button>
        </div>
      )}

      {showRegister && (
        <form
          onSubmit={registerUser}
          style={{
            marginTop: "20px"
          }}
        >
          <h2>Register</h2>

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />

          <br />
          <br />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <br />
          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <br />
          <br />

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
          >
            <option value="consumer">
              Consumer
            </option>

            <option value="creator">
              Creator
            </option>
          </select>

          <br />
          <br />

          <button type="submit">
            Register
          </button>
        </form>
      )}

      {showLogin && (
        <form
          onSubmit={loginUser}
          style={{
            marginTop: "20px"
          }}
        >
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <br />
          <br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <br />
          <br />

          <button type="submit">
            Login
          </button>
        </form>
      )}

      {authMessage && (
        <p>
          <strong>{authMessage}</strong>
        </p>
      )}

      <hr />

      <h2>Videos</h2>

      <button onClick={exploreVideos}>
        Explore Videos
      </button>

      <button
        onClick={() =>
          setShowUpload(!showUpload)
        }
        style={{
          marginLeft: "10px"
        }}
      >
        Upload Video
      </button>

      {showUpload && (
        <form
          onSubmit={uploadVideo}
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc"
          }}
        >
          <h2>Upload Video</h2>

          <input
            type="text"
            placeholder="Video title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <br />
          <br />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />

          <br />
          <br />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          />

          <br />
          <br />

          <input
            type="file"
            accept="video/*"
            onChange={(event) =>
              setSelectedFile(
                event.target.files[0]
              )
            }
          />

          <br />
          <br />

          <button type="submit">
            Upload
          </button>

          {uploadMessage && (
            <p>{uploadMessage}</p>
          )}
        </form>
      )}

      {showExplore && (
        <div
          style={{
            marginTop: "30px"
          }}
        >
          <h2>Explore StreamSphere</h2>

          {loading && (
            <p>Loading videos...</p>
          )}

          {!loading &&
            videos.length === 0 && (
              <p>No videos found.</p>
            )}

          {!loading &&
            videos.map((video) => (
              <div
                key={video.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "15px",
                  marginTop: "15px",
                  borderRadius: "8px"
                }}
              >
                <h3>{video.title}</h3>

                {video.videoUrl && (
                  <video
                    controls
                    style={{
                      width: "500px",
                      maxWidth: "100%",
                      marginBottom: "15px"
                    }}
                  >
                    <source
                      src={video.videoUrl}
                      type="video/mp4"
                    />

                    Your browser does not support
                    video playback.
                  </video>
                )}

                <p>
                  {video.description}
                </p>

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  {video.category}
                </p>

                <p>
                  <strong>
                    Uploader:
                  </strong>{" "}
                  {video.uploader}
                </p>

                <p>
                  👁 {video.views} views | 👍{" "}
                  {video.likes} likes
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default App;
