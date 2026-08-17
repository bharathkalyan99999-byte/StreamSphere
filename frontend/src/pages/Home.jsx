import {
  Play,
  Sparkles,
  Cpu,
  Gamepad2,
  Plane,
  GraduationCap,
  Music,
  Trophy
} from "lucide-react";

import VideoCard from "../components/VideoCard";

function Home({
  videos,
  loading,
  onExplore,
  onUpload,
  onVideoClick,
  loggedInUser
}) {

  const categories = [
    {
      name: "Technology",
      icon: <Cpu size={26} />
    },
    {
      name: "Gaming",
      icon: <Gamepad2 size={26} />
    },
    {
      name: "Travel",
      icon: <Plane size={26} />
    },
    {
      name: "Education",
      icon: <GraduationCap size={26} />
    },
    {
      name: "Music",
      icon: <Music size={26} />
    },
    {
      name: "Sports",
      icon: <Trophy size={26} />
    }
  ];

  const latestVideos = videos.slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="page-container">

          <div className="hero-content">

            <div className="hero-badge">
              <Sparkles size={15} />
              The future of video streaming
            </div>

            <h1>
              Discover what
              <br />
              <span>moves you.</span>
            </h1>

            <p>
              Stream, discover and share videos
              from creators around the world.
              Your next favourite video is waiting.
            </p>

            <div className="hero-buttons">

              <button
                className="btn btn-primary"
                onClick={onExplore}
              >
                <Play size={18} fill="currentColor" />
                Explore Videos
              </button>

              {loggedInUser?.role === "creator" && (
                <button
                  className="btn btn-secondary"
                  onClick={onUpload}
                >
                  Start Creating
                </button>
              )}

            </div>

          </div>

        </div>
      </section>

      <section className="section">
        <div className="page-container">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Explore Categories
              </h2>

              <p className="section-subtitle">
                Find videos based on what interests you.
              </p>
            </div>

          </div>

          <div className="category-grid">

            {categories.map((category) => (
              <div
                className="category-card"
                key={category.name}
              >
                <div className="category-icon">
                  {category.icon}
                </div>

                {category.name}
              </div>
            ))}

          </div>

        </div>
      </section>

      <section className="section">
        <div className="page-container">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Latest Videos
              </h2>

              <p className="section-subtitle">
                Fresh content from the StreamSphere community.
              </p>
            </div>

            <button
              className="btn btn-secondary"
              onClick={onExplore}
            >
              View All
            </button>

          </div>

          {loading && (
            <p>Loading videos...</p>
          )}

          {!loading && latestVideos.length === 0 && (
            <p className="section-subtitle">
              No videos available yet.
            </p>
          )}

          {!loading && latestVideos.length > 0 && (
            <div className="video-grid">

              {latestVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => onVideoClick(video)}
                />
              ))}

            </div>
          )}

        </div>
      </section>
    </>
  );
}

export default Home;
