import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Volume2,
  VolumeX,
  UserPlus,
  UserCheck,
  MoreVertical,
  Play,
  Pause
} from "lucide-react";

function Flips({
  videos = [],
  loggedInUser,
  onLike,
  onCreatorClick
}) {
  const [muted, setMuted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [following, setFollowing] = useState({});
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      const height = container.clientHeight;

      if (!height) return;

      const index = Math.round(
        container.scrollTop / height
      );

      setActiveIndex(index);
    };

    container.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      container.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {

    videoRefs.current.forEach(
      (videoElement, index) => {

        if (!videoElement) return;

        if (index === activeIndex) {

          videoElement.play()
            .catch((error) => {
              console.log(
                "Autoplay blocked:",
                error
              );
            });

        } else {

          videoElement.pause();

        }

      }
    );

  }, [activeIndex]);

  useEffect(() => {
    if (!loggedInUser?.following) return;

    const initialFollowing = {};

    loggedInUser.following.forEach((id) => {
      initialFollowing[id] = true;
    });

    setFollowing(initialFollowing);
  }, [loggedInUser]);

  const handleFollow = async (creatorId) => {
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
          data.error || "Failed to update follow"
        );
      }

      setFollowing((previous) => ({
        ...previous,
        [creatorId]: data.following
      }));

      const currentFollowing =
        loggedInUser.following || [];

      const newFollowing = data.following
        ? [...new Set([
            ...currentFollowing,
            creatorId
          ])]
        : currentFollowing.filter(
            (id) => id !== creatorId
          );

      const updatedUser = {
        ...loggedInUser,
        following: newFollowing
      };

      localStorage.setItem(
        "streamSphereUser",
        JSON.stringify(updatedUser)
      );

    } catch (error) {
      console.error("Follow error:", error);
      alert(error.message);
    }
  };

  const handleShare = async (video) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || "StreamSphere Flip",
          text: video.description || "",
          url: video.videoUrl || window.location.href
        });
      } else if (
        navigator.clipboard &&
        video.videoUrl
      ) {
        await navigator.clipboard.writeText(
          video.videoUrl
        );

        alert("Video link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  };

  const handleOptions = (video) => {
    alert(
      `More options for "${video.title || "this Flip"}"`
    );
  };

  return (
    <div
      className="flips-page"
      ref={containerRef}
    >
      {videos.map((video, index) => {
        const isFollowing =
          following[video.uploaderId] || false;

        const isOwnVideo =
          loggedInUser?.id === video.uploaderId;

        return (
          <div
            className="reel-item"
            key={video.id}
          >

            <div className="reel-video-container">

              {video.videoUrl ? (
                <video
                  ref={(element) => {
                    videoRefs.current[index] =
                      element;
                  }}
                  className="reel-video"
                  src={video.videoUrl}
                  loop
                  muted={muted}
                  playsInline
                  preload="auto"
                  onCanPlay={() => {
                    if (index === activeIndex) {
                      const videoElement =
                        videoRefs.current[index];

                      videoElement?.play()
                        .catch((error) => {
                          console.log(
                            "Autoplay error:",
                            error
                          );
                        });
                    }
                  }}
                  onClick={() => {

                    const videoElement =
                      videoRefs.current[index];

                    if (!videoElement) return;

                    if (
                      videoElement.paused
                    ) {

                      videoElement.play()
                        .catch((error) => {
                          console.log(
                            "Play error:",
                            error
                          );
                        });

                    } else {

                      videoElement.pause();

                    }

                  }}
                />
              ) : (
                <div className="reel-video-empty">
                  Video unavailable
                </div>
              )}

            </div>

            <div className="reel-gradient" />

            {/* RIGHT ACTIONS */}

            <div className="reel-actions">

              <button
                className="reel-action"
                onClick={() => onLike(video)}
              >
                <Heart size={28} />
                <span>
                  {video.likes || 0}
                </span>
              </button>

              <button
                className="reel-action"
                onClick={() => {
                  alert(
                    `${video.comments?.length || 0} comments`
                  );
                }}
              >
                <MessageCircle size={28} />
                <span>
                  {video.comments?.length || 0}
                </span>
              </button>

              <button
                className="reel-action"
                onClick={() => setMuted(!muted)}
              >
                {muted ? (
                  <VolumeX size={28} />
                ) : (
                  <Volume2 size={28} />
                )}

                <span>
                  {muted ? "Unmute" : "Mute"}
                </span>
              </button>

              <button
                className="reel-action"
                onClick={() => handleShare(video)}
              >
                <Share2 size={28} />
                <span>Share</span>
              </button>

              <div className="reel-views">
                <Eye size={25} />
                <span>
                  {video.views || 0}
                </span>
              </div>

              {/* OPTIONS */}

              <button
                className="reel-action reel-options"
                onClick={() => handleOptions(video)}
              >
                <MoreVertical size={28} />
              </button>

            </div>

            {/* CREATOR + DESCRIPTION */}

            <div className="reel-bottom">

              <div className="reel-creator-row">

                <button
                  className="reel-avatar"
                  onClick={() => {
                    if (
                      video.uploaderId &&
                      onCreatorClick
                    ) {
                      onCreatorClick(
                        video.uploaderId
                      );
                    }
                  }}
                >
                  {video.uploaderProfilePicture ? (
                    <img
                      src={
                        video.uploaderProfilePicture
                      }
                      alt={
                        video.uploader ||
                        "Creator"
                      }
                    />
                  ) : (
                    <div className="reel-avatar-placeholder">
                      {(video.uploader || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </button>

                <button
                  className="reel-creator-name"
                  onClick={() => {
                    if (
                      video.uploaderId &&
                      onCreatorClick
                    ) {
                      onCreatorClick(
                        video.uploaderId
                      );
                    }
                  }}
                >
                  {video.uploader ||
                    "Creator"}
                </button>

                {true &&
                  video.uploaderId && (
                    <button
                      className={
                        isFollowing
                          ? "reel-follow following"
                          : "reel-follow"
                      }
                      onClick={() =>
                        handleFollow(
                          video.uploaderId
                        )
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={16} />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Follow
                        </>
                      )}
                    </button>
                  )}

              </div>

              {video.description && (
                <p className="reel-description">
                  {video.description}
                </p>
              )}

            </div>

          </div>
        );
      })}
    </div>
  );
}

export default Flips;
