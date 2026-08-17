import { useState } from "react";
import { Search } from "lucide-react";

import VideoCard from "../components/VideoCard";

function Explore({
  videos,
  loading,
  onVideoClick
}) {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [aiVideoIds, setAiVideoIds] =
    useState(null);

  const [aiSearching, setAiSearching] =
    useState(false);

  const categories = [
    "All",
    "Technology",
    "Gaming",
    "Travel",
    "Education",
    "Music",
    "Sports",
    "Entertainment"
  ];

  const handleSearchChange = async (value) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setAiVideoIds(null);
      setAiSearching(false);
      return;
    }

    setAiSearching(true);

    try {
      const response = await fetch(
        "http://localhost:5001/ai-search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: value,
            videos: videos
          })
        }
      );

      if (!response.ok) {
        throw new Error("AI search failed");
      }

      const data = await response.json();

      setAiVideoIds(
        data.videoIds || []
      );

    } catch (error) {
      console.error(
        "AI search error:",
        error
      );

      setAiVideoIds(null);

    } finally {
      setAiSearching(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    const search = searchTerm.toLowerCase();

    const matchesNormalSearch =
      video.title?.toLowerCase().includes(search) ||
      video.description?.toLowerCase().includes(search) ||
      video.uploader?.toLowerCase().includes(search) ||
      video.tags?.some((tag) =>
        tag.toLowerCase().includes(search)
      );

    const matchesAiSearch =
      !searchTerm.trim() ||
      aiVideoIds === null ||
      aiVideoIds.includes(video.id);

    const matchesSearch =
      aiVideoIds !== null
        ? matchesAiSearch
        : matchesNormalSearch;

    const matchesCategory =
      selectedCategory === "All" ||
      video.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="section">
      <div className="page-container">

        <div className="section-header">
          <div>
            <h1 className="section-title">
              Explore Videos
            </h1>

            <p className="section-subtitle">
              Discover content with AI-powered search.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px"
          }}
        >
          <div className="search-bar">
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#71717a"
              }}
            />

            <input
              type="text"
              placeholder="Ask AI to find videos..."
              value={searchTerm}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
            />
          </div>

          {aiSearching && (
            <p className="section-subtitle">
              AI is searching...
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "35px"
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? "btn btn-primary"
                  : "btn btn-secondary"
              }
              onClick={() =>
                setSelectedCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>

        {loading && (
          <p className="section-subtitle">
            Loading videos...
          </p>
        )}

        {!loading &&
          !aiSearching &&
          filteredVideos.length === 0 && (
            <p className="section-subtitle">
              No videos found.
            </p>
          )}

        {!loading &&
          !aiSearching &&
          filteredVideos.length > 0 && (
            <div className="video-grid">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() =>
                    onVideoClick(video)
                  }
                />
              ))}
            </div>
          )}

      </div>
    </div>
  );
}

export default Explore;
