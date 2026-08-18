import Flips from "./pages/Flips";
import Explore from "./pages/Explore";
import CreatorDashboard from "./pages/CreatorDashboard";
import VideoDetail from "./pages/VideoDetail";
import CreatorProfile from "./pages/CreatorProfile";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";

import Home from "./pages/Home";
import Upload from "./pages/Upload";

import "./styles/app.css";

function App() {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [selectedCreatorId, setSelectedCreatorId] =
    useState(null);
  const [currentPage, setCurrentPage] =
    useState("home");

  const [videos, setVideos] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loggedInUser, setLoggedInUser] =
    useState(() => {
      const savedUser =
        localStorage.getItem("streamSphereUser");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    });
  const [authMode, setAuthMode] =
    useState(null);

  // -------------------------
  // GET VIDEOS
  // -------------------------

  const exploreVideos = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/videos"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load videos"
        );
      }

      setVideos(data);

    } catch (error) {
      console.error(
        "Error fetching videos:",
        error
      );

    } finally {
      setLoading(false);
    }
  };

  // Load videos automatically
  useEffect(() => {
    exploreVideos();
  }, []);

  // -------------------------
  // REGISTER
  // -------------------------

  const registerUser = async (
    name,
    email,
    password,
    role
  ) => {
    try {
      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
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
        return {
          error:
            data.error ||
            "Registration failed"
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        error: error.message
      };
    }
  };

  // -------------------------
  // LOGIN
  // -------------------------

  const loginUser = async (
    email,
    password
  ) => {
    try {
      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            "Login failed"
        };
      }

      // Save token
      localStorage.setItem(
        "token",
        data.token
      );

      // Save user
      localStorage.setItem(
        "streamSphereUser",
        JSON.stringify(data.user)
      );

      setLoggedInUser(data.user);

      // Close modal
      setAuthMode(null);

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        error: error.message
      };
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------

  const logoutUser = () => {
    localStorage.removeItem("token");

    localStorage.removeItem(
    "streamSphereUser"
  );

    setLoggedInUser(null);

    setCurrentPage("home");
  };

  // -------------------------
  // UPDATE PROFILE PICTURE
  // -------------------------

  const updateProfilePicture = async (imageUrl) => {
    try {
      const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/users/${loggedInUser.id}/profile-picture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            profilePicture: imageUrl
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update profile picture"
        );
      }

      setLoggedInUser(data.user);

      localStorage.setItem(
        "streamSphereUser",
        JSON.stringify(data.user)
      );

    } catch (error) {
      console.error(
        "Profile picture update error:",
        error
      );

      alert("Failed to save profile picture");
    }
  };

  // -------------------------
  // OPEN CREATOR PROFILE
  // -------------------------

  const handleCreatorClick = (creatorId) => {
    if (!creatorId) {
      return;
    }

    setSelectedCreatorId(creatorId);
    setCurrentPage("creator-profile");
  };

  // -------------------------
  // VIDEO CLICK
  // -------------------------
  const handleVideoClick = async (video) => {
  try {
    const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/videos/${video.id}`,
        {
        method: "POST"
      }
    );

    const updatedVideo = await response.json();

    if (!response.ok) {
      throw new Error(
        updatedVideo.error || "Failed to update view"
      );
    }

    setVideos((previousVideos) =>
      previousVideos.map((item) =>
        item.id === updatedVideo.id
          ? {
              ...item,
              ...updatedVideo,
              videoUrl: video.videoUrl
            }
          : item
      )
    );

    setSelectedVideo({
      ...video,
      ...updatedVideo,
      videoUrl: video.videoUrl
    });

    setCurrentPage("watch");

  } catch (error) {
    console.error(
      "View update error:",
      error
    );

    // Still open the video even if view update fails
    setSelectedVideo(video);
    setCurrentPage("watch");
  }
};

  const handleLike = async (video) => {
    try {
      if (!loggedInUser) {
        alert("Please log in to like videos");
        return;
      }

      const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/videos/${video.id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: loggedInUser.id
          })
        }
      );

      const updatedVideo = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedVideo.error || "Failed to update like"
        );
      }

      const videoWithUrl = {
        ...video,
        ...updatedVideo,
        videoUrl: video.videoUrl
      };

      setVideos((previousVideos) =>
        previousVideos.map((item) =>
          item.id === updatedVideo.id
            ? {
                ...item,
                ...updatedVideo,
                videoUrl: item.videoUrl
              }
            : item
        )
      );

      setSelectedVideo(videoWithUrl);

    } catch (error) {
      console.error(
        "Like update error:",
        error
      );

      alert(
        "Could not update like: " + error.message
      );
    }
  };

    const handleComment = async (
    video,
    commentText
  ) => {
    try {
      if (!loggedInUser) {
        alert("Please log in to comment");
        return;
      }

      const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/videos/${video.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: loggedInUser.id,
            userName: loggedInUser.name,
            text: commentText
          })
        }
      );

      const updatedVideo = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedVideo.error ||
          "Failed to add comment"
        );
      }

      setVideos((previousVideos) =>
        previousVideos.map((item) =>
          item.id === updatedVideo.id
            ? {
                ...item,
                ...updatedVideo,
                videoUrl: item.videoUrl
              }
            : item
        )
      );

      setSelectedVideo((previousVideo) => {
        if (!previousVideo) {
          return previousVideo;
        }

        return {
          ...previousVideo,
          ...updatedVideo,
          videoUrl: previousVideo.videoUrl
        };
      });

    } catch (error) {
      console.error(
        "Comment error:",
        error
      );

      alert(
        "Could not add comment: " +
        error.message
      );
    }
  };
  // -------------------------
  // UPLOAD SUCCESS
  // -------------------------

  const handleUploadSuccess = async (newVideo) => {

    try {

      await exploreVideos();

    } catch (error) {

      console.error(
        "Error refreshing videos after upload:",
        error
      );

      setVideos((previousVideos) => [
        newVideo,
        ...previousVideos
      ]);

    }

    setCurrentPage("dashboard");

  };
  const handleDeleteVideo = async (video) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/videos/" + video.id,
        {
          method: "DELETE"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete video"
        );
      }

      setVideos((previousVideos) =>
        previousVideos.filter(
          (item) => item.id !== video.id
        )
      );

      alert("Video deleted successfully!");

    } catch (error) {
      console.error(
        "Delete video error:",
        error
      );

      alert(
        "Could not delete video: " +
        error.message
      );
    }
  };
  // -------------------------
  // PAGE CONTENT
  // -------------------------

  const renderPage = () => {
    if (currentPage === "explore") {
      return (
        <Flips
          videos={videos}
          loggedInUser={loggedInUser}
          onLike={handleLike}
          onComment={handleComment}
          onCreatorClick={handleCreatorClick}
        />
      );
    }
    if (currentPage === "creator-profile") {
      return (
        <CreatorProfile
          creatorId={selectedCreatorId}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
          onBack={() => {
            setCurrentPage("watch");
          }}
          onVideoClick={handleVideoClick}
        />
      );
    }

    if (currentPage === "watch") {
      return (
        <Flips
          videos={
            selectedVideo
              ? [
                  selectedVideo,
                  ...videos.filter(
                    (item) =>
                      item.id !== selectedVideo.id
                  )
                ]
              : videos
          }
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
          onLike={handleLike}
          onComment={handleComment}
          onCreatorClick={handleCreatorClick}
        />
      );
    }

    if (currentPage === "dashboard") {
      if (loggedInUser?.role !== "creator") {
        setCurrentPage("home");
        return null;
      }

      return (
        <CreatorDashboard
          videos={videos}
          loggedInUser={loggedInUser}
          onUpload={() => {
            setCurrentPage("upload");
          }}
          onVideoClick={handleVideoClick}
	  onDelete={handleDeleteVideo}
        />
      );
    }
    if (currentPage === "upload") {
      if (
        loggedInUser?.role !== "creator"
      ) {
        setCurrentPage("home");
        return null;
      }

      return (
        <Upload
          onUploadSuccess={
            handleUploadSuccess
          }
          setCurrentPage={setCurrentPage}
        />
      );
    }

    if (currentPage === "categories") {
      return (
        <Explore
          videos={videos}
          loading={loading}
          onVideoClick={handleVideoClick}
        />
      );
    }

    return (
      <Home
        videos={videos}
        loading={loading}
        onExplore={() =>
          setCurrentPage("explore")
        }
        onUpload={() =>
          setCurrentPage("upload")
        }
        onVideoClick={handleVideoClick}
        loggedInUser={loggedInUser}
      />
    );
  };

  return (
    <div className="app-container">

      <Navbar
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        loggedInUser={loggedInUser}
        onLogin={() =>
          setAuthMode("login")
        }
        onRegister={() =>
          setAuthMode("register")
        }
        onLogout={logoutUser}
        onProfilePictureChange={updateProfilePicture}
      />

      {renderPage()}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() =>
            setAuthMode(null)
          }
          onLogin={loginUser}
          onRegister={registerUser}
        />
      )}

    </div>
  );
}

export default App;
