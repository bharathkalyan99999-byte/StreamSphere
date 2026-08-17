import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Play,
  Eye,
  ThumbsUp,
  UserPlus,
  UserCheck
} from "lucide-react";

function CreatorProfile({
  creatorId,
  loggedInUser,
  setLoggedInUser,
  onBack,
  onVideoClick
}) {
  const [creator, setCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCreatorProfile = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:5001/creators/${creatorId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load creator"
          );
        }

        setCreator(data.creator);
        setVideos(data.videos || []);

        if (
          loggedInUser &&
          loggedInUser.following
        ) {
          setFollowing(
            loggedInUser.following.includes(
              creatorId
            )
          );
        }

      } catch (error) {
        console.error(
          "Creator profile error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (creatorId) {
      loadCreatorProfile();
    }
  }, [creatorId, loggedInUser]);

  const handleFollow = async () => {
    if (!loggedInUser) {
      alert("Please log in to follow creators");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/users/${creatorId}/follow`,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Failed to update follow status"
        );
      }

      setFollowing(data.following);

      const updatedFollowing =
        loggedInUser.following || [];

      const newFollowing =
        data.following
          ? [
              ...updatedFollowing,
              creatorId
            ]
          : updatedFollowing.filter(
              (id) => id !== creatorId
            );

      const updatedUser = {
        ...loggedInUser,
        following: newFollowing
      };

      setLoggedInUser(updatedUser);

      localStorage.setItem(
        "streamSphereUser",
        JSON.stringify(updatedUser)
      );

      setCreator((previous) => ({
        ...previous,
        followersCount: data.followersCount
      }));

    } catch (error) {
      console.error(
        "Follow error:",
        error
      );

      alert("Failed to update follow status");
    }
  };

  if (loading) {
    return (
      <div className="creator-profile-page">
        <p>Loading creator profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="creator-profile-page">
        <p>Creator not found.</p>
      </div>
    );
  }

  const isOwnProfile =
    loggedInUser?.id === creator.id;

  return (
    <div className="creator-profile-page">

      <div className="page-container">

        <button
          className="watch-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="creator-profile-header">

          <div className="creator-profile-avatar">

            {creator.profilePicture ? (
              <img
                src={creator.profilePicture}
                alt={creator.name}
              />
            ) : (
              <div className="creator-profile-placeholder">
                {creator.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
            )}

          </div>

          <div className="creator-profile-details">

            <h1>
              {creator.name}
            </h1>

            <p className="creator-role">
              Creator
            </p>

            <div className="creator-stats">

              <div>
                <strong>
                  {creator.postsCount}
                </strong>

                <span>Posts</span>
              </div>

              <div>
                <strong>
                  {creator.followersCount ?? "NO VALUE"}
                </strong>

                <span>Followers</span>
              </div>

              <div>
                <strong>
                  {creator.followingCount}
                </strong>

                <span>Following</span>
              </div>

            </div>

          </div>

          {!isOwnProfile && (
            <button
              className={
                following
                  ? "following-button"
                  : "follow-button"
              }
              onClick={handleFollow}
            >
              {following ? (
                <>
                  <UserCheck size={17} />
                  Following
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Follow
                </>
              )}
            </button>
          )}

        </section>

        <section className="creator-videos">

          <h2>
            Videos
          </h2>

          {videos.length > 0 ? (

            <div className="video-grid">

              {videos.map((video) => (

                <div
                  className="video-card"
                  key={video.id}
                  onClick={() =>
                    onVideoClick(video)
                  }
                >

                  <div className="video-thumbnail">

                    {video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="video-thumbnail-empty">
                        Video unavailable
                      </div>
                    )}

                    <div className="play-overlay">

                      <div className="play-button">

                        <Play
                          size={22}
                          fill="currentColor"
                        />

                      </div>

                    </div>

                  </div>

                  <div className="video-info">

                    <h3 className="video-title">
                      {video.title}
                    </h3>

                    <div className="video-meta">

                      <span>
                        <Eye size={14} />
                        {video.views || 0}
                      </span>

                      <span>
                        <ThumbsUp size={14} />
                        {video.likes || 0}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <p className="no-videos">
              This creator has not posted
              any videos yet.
            </p>

          )}

        </section>

      </div>

    </div>
  );
}

export default CreatorProfile;
