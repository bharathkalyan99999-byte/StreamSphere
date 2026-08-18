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
  Trash2
} from "lucide-react";


function Flips({
  videos = [],
  loggedInUser,
  setLoggedInUser,
  onLike,
  onComment,
  onCreatorClick
}) {
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [following, setFollowing] = useState({});
  const [optionsVideo, setOptionsVideo] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [commentsVideo, setCommentsVideo] = useState(null);
  const [hiddenVideos, setHiddenVideos] = useState(new Set());
  const [reportVideo, setReportVideo] = useState(null);
  const [reportReason, setReportReason] = useState("");

  const [aiSummary, setAiSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [commentText, setCommentText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);


  const handleGenerateSummary = async (video) => {
    try {
      setSummaryLoading((prev) => ({
        ...prev,
        [video.id]: true
      }));

      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/ai-video-summary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: video.title,
            description: video.description
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate summary"
        );
      }

      setAiSummary((prev) => ({
        ...prev,
        [video.id]: data.summary || ""
      }));

    } catch (error) {
      console.error("AI summary error:", error);
      alert(error.message || "Failed to generate AI summary");

    } finally {
      setSummaryLoading((prev) => ({
        ...prev,
        [video.id]: false
      }));
    }
  };




  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const updateActiveVideo = () => {
      const height = container.clientHeight;

      if (!height) return;

      const index = Math.round(
        container.scrollTop / height
      );

      setActiveIndex(index);
    };

    container.addEventListener(
      "scroll",
      updateActiveVideo,
      { passive: true }
    );

    return () => {
      container.removeEventListener(
        "scroll",
        updateActiveVideo
      );
    };
  }, []);


  useEffect(() => {
    videoRefs.current.forEach(
      (videoElement, index) => {
        if (!videoElement) return;

        if (index === activeIndex) {
          videoElement.muted = muted;

          videoElement
            .play()
            .catch(() => {});
        } else {
          videoElement.pause();
          videoElement.currentTime =
            videoElement.currentTime;
        }
      }
    );
  }, [activeIndex, muted]);


  useEffect(() => {
    const initial = {};

    loggedInUser?.following?.forEach((id) => {
      initial[id] = true;
    });

    setFollowing(initial);
  }, [loggedInUser]);

  const togglePlay = (index) => {
    const video = videoRefs.current[index];

    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleMute = () => {
    const nextMuted = !muted;

    setMuted(nextMuted);

    const video = videoRefs.current[activeIndex];

    if (video) {
      video.muted = nextMuted;
    }
  };

  const handleFollow = async (creatorId) => {
    if (!loggedInUser) {
      alert("Please log in to follow creators");
      return;
    }

    try {
      const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/users/${creatorId}/follow`,
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
          data.error || "Failed to follow creator"
        );
      }

      setFollowing((previous) => ({
        ...previous,
        [creatorId]: data.following
      }));

      if (setLoggedInUser) {
        const currentFollowing =
          loggedInUser.following || [];

        const newFollowing = data.following
          ? [
              ...currentFollowing.filter(
                (id) => id !== creatorId
              ),
              creatorId
            ]
          : currentFollowing.filter(
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
      }
    } catch (error) {
      console.error(
        "Follow error:",
        error
      );

      alert("Failed to update follow status");
    }
  };

  const handleShare = async (video) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || "StreamSphere",
          text:
            video.description ||
            "Check this video on StreamSphere",
          url: window.location.href
        });
      } else if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          window.location.href
        );

        alert("Video link copied");
      }
    } catch (error) {
      console.log("Share cancelled");
    }
  };

  const handleOptions = (videoId) => {
    setOptionsVideo((current) =>
      current === videoId ? null : videoId
    );
  };

  const toggleDescription = (id) => {
    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id]
    }));
  };


  useEffect(() => {
    if (commentsVideo) {
      document.body.classList.add("comments-open");
    } else {
      document.body.classList.remove("comments-open");
    }

    return () => {
      document.body.classList.remove("comments-open");
    };
  }, [commentsVideo]);

  const handleDeleteComment = async (
    comment
  ) => {
    if (!loggedInUser || !commentsVideo) {
      return;
    }

    try {
      const response = await fetch(
        `https://streamsphere-backend-bk2026.azurewebsites.net/videos/${commentsVideo.id}/comments/${comment.id}`,
        {
          method: "DELETE",
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
          "Failed to delete comment"
        );
      }

      setCommentsVideo((previousVideo) => {
        if (!previousVideo) return null;

        return {
          ...previousVideo,
          comments: data.comments
        };
      });

    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      alert(
        error.message ||
        "Could not delete comment"
      );
    }
  };

  return (
    <div
      className="flips-page"
      ref={containerRef}
    >
      {videos
        .filter(
          (video) =>
            !hiddenVideos.has(video.id)
        )
        .map((video, index) => {
        const isFollowing =
          video.uploaderId
            ? !!following[video.uploaderId]
            : false;

        const isOwnVideo =
          loggedInUser?.id ===
          video.uploaderId;

        const description =
          video.description || "";

        const isLongDescription =
          description.length > 90;

        const shortDescription =
          isLongDescription
            ? description.slice(0, 90)
            : description;

        return (
          <section
            className="flip-item"
            key={video.id}
          >
            <div className="flip-video-wrap">

              {video.videoUrl ? (
                <video
                  ref={(element) => {
                    videoRefs.current[index] =
                      element;
                  }}
                  className="flip-video"
                  src={video.videoUrl}
                  muted={muted}
                  loop
                  playsInline
                  preload="auto"
                  onClick={() =>
                    togglePlay(index)
                  }
                />
              ) : (
                <div className="flip-video-empty">
                  Video unavailable
                </div>
              )}

              <div className="flip-overlay" />

              {/* RIGHT SIDE BUTTONS */}

              <div className="flip-actions">

                <button
                  className="flip-action"
                  onClick={() => handleGenerateSummary(video)}
                  disabled={summaryLoading[video.id]}
                >
                  ✨
                  <span>
                    {summaryLoading[video.id]
                      ? "Loading..."
                      : "AI Summary"}
                  </span>
                </button>

                {aiSummary[video.id] && (
                  <div className="ai-summary-popup">
                    <div className="ai-summary-title">
                      ✨ AI Summary
                    </div>
                    <p>
                      {aiSummary[video.id]}
                    </p>
                    <button
                      className="ai-summary-close"
                      onClick={() =>
                        setAiSummary((prev) => ({
                          ...prev,
                          [video.id]: ""
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                )}

                <button
                  className="flip-action"
                  onClick={() =>
                    onLike?.(video)
                  }
                >
                  <Heart
                    size={27}
                    fill={
                      video.liked
                        ? "currentColor"
                        : "none"
                    }
                  />

                  <span>
                    {video.likes || 0}
                  </span>
                </button>

                <button
                  className="flip-action"
                  onClick={() => {
                    setCommentsVideo(video);
                    setCommentText("");
                  }}
                >
                  <MessageCircle size={27} />

                  <span>
                    {video.comments?.length ||
                      0}
                  </span>
                </button>

                <button
                  className="flip-action"
                  onClick={handleMute}
                >
                  {muted ? (
                    <VolumeX size={27} />
                  ) : (
                    <Volume2 size={27} />
                  )}

                  <span>
                    {muted
                      ? "Unmute"
                      : "Mute"}
                  </span>
                </button>

                <button
                  className="flip-action"
                  onClick={() =>
                    handleShare(video)
                  }
                >
                  <Share2 size={27} />

                  <span>
                    Share
                  </span>
                </button>

                <div className="flip-action flip-views">
                  <Eye size={25} />

                  <span>
                    {video.views || 0}
                  </span>
                </div>

                <div className="flip-options-wrapper">

                  <button
                    className="flip-action"
                    onClick={() => handleOptions(video.id)}
                  >
                    <MoreVertical size={27} />
                  </button>

                  {optionsVideo === video.id && (
                    <div className="flip-options-menu">

                      <button
                        onClick={async () => {
                          const videoLink =
                            `${window.location.origin}/video/${video.id}`;

                          try {
                            await navigator.clipboard.writeText(
                              videoLink
                            );

                            alert("Link copied!");
                          } catch (error) {
                            console.error(
                              "Could not copy link:",
                              error
                            );

                            alert(
                              "Could not copy the link"
                            );
                          }

                          setOptionsVideo(null);
                        }}
                      >
                        Copy link
                      </button>

                      <button
                        onClick={() => {
                          setHiddenVideos((previous) => {
                            const updated = new Set(previous);
                            updated.add(video.id);
                            return updated;
                          });

                          setOptionsVideo(null);
                        }}
                      >
                        Not interested
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          setReportReason("");
                          setReportVideo({
                            ...video
                          });

                          setOptionsVideo(null);
                        }}
                      >
                        Report
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* BOTTOM INFORMATION */}

              <div className="flip-bottom">

                <div className="flip-creator-row">

                  <button
                    className="flip-avatar"
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
                      <div className="flip-avatar-placeholder">
                        {(
                          video.uploader ||
                          "C"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </button>

                  <button
                    className="flip-creator-name"
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

                  {!isOwnVideo &&
                    video.uploaderId && (
                      <button
                        className={
                          isFollowing
                            ? "flip-follow following"
                            : "flip-follow"
                        }
                        onClick={() =>
                          handleFollow(
                            video.uploaderId
                          )
                        }
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck
                              size={15}
                            />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus
                              size={15}
                            />
                            Follow
                          </>
                        )}
                      </button>
                    )}

                </div>

                {description && (
                  <div className="flip-description">

                    <span>
                      {expanded[video.id]
                        ? description
                        : shortDescription}

                      {!expanded[video.id] &&
                        isLongDescription && (
                          <>
                            ...{" "}
                            <button
                              className="flip-more"
                              onClick={() =>
                                toggleDescription(
                                  video.id
                                )
                              }
                            >
                              more
                            </button>
                          </>
                        )}
                    </span>

                    {expanded[video.id] && (
                      <button
                        className="flip-more"
                        onClick={() =>
                          toggleDescription(
                            video.id
                          )
                        }
                      >
                        less
                      </button>
                    )}

                  </div>
                )}

              </div>

            </div>
          </section>
        );
      })}
    {reportVideo && (
      <div
        className="report-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setReportVideo(null);
          }
        }}
      >
        <div
          className="report-box"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <h3>Report video</h3>

          <p>Why are you reporting this video?</p>

          <div className="report-reasons">

            {[
              "Spam",
              "Inappropriate content",
              "Harassment",
              "Other"
            ].map((reason) => (
              <button
                key={reason}
                className={
                  reportReason === reason
                    ? "report-reason selected"
                    : "report-reason"
                }
                onClick={() =>
                  setReportReason(reason)
                }
              >
                {reason}
              </button>
            ))}

          </div>

          <div className="report-actions">

            <button
              className="report-cancel"
              onClick={() =>
                setReportVideo(null)
              }
            >
              Cancel
            </button>

            <button
              className="report-submit"
              disabled={!reportReason}
              onClick={() => {
                alert(
                  `Report submitted for: ${reportReason}`
                );

                setReportVideo(null);
                setReportReason("");
              }}
            >
              Submit report
            </button>

          </div>
        </div>
      </div>
    )}

    {commentToDelete && (
      <div
        className="delete-confirm-overlay"
        onClick={() =>
          setCommentToDelete(null)
        }
      >
        <div
          className="delete-confirm-box"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <h3>Delete comment?</h3>

          <p>
            This action cannot be undone.
          </p>

          <div className="delete-confirm-actions">

            <button
              className="cancel-delete"
              onClick={() =>
                setCommentToDelete(null)
              }
            >
              Cancel
            </button>

            <button
              className="confirm-delete"
              onClick={async () => {
                await handleDeleteComment(
                  commentToDelete
                );

                setCommentToDelete(null);
              }}
            >
              Delete
            </button>

          </div>
        </div>
      </div>
    )}

    {commentsVideo && (
      <div
        className="comments-overlay"
        onClick={() =>
          setCommentsVideo(null)
        }
      >
        <div
          className="comments-panel"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <div className="comments-header">
            <h3>Comments</h3>

            <button
              onClick={() =>
                setCommentsVideo(null)
              }
            >
              ×
            </button>
          </div>

          <div className="comments-list">

            {commentsVideo.comments?.length ? (
              commentsVideo.comments.map(
                (comment) => (
                  <div
                    className="comment-item"
                    key={comment.id}
                  >
                    <strong className="comment-user">
                      {comment.userName}
                    </strong>

                    <p className="comment-text">
                      {comment.text}
                    </p>

                    {(loggedInUser?.id ===
                      comment.userId ||
                      loggedInUser?.id ===
                      commentsVideo.uploaderId) && (
                      <button
                        className="comment-delete"
                        onClick={() =>
                          setCommentToDelete(
                            comment
                          )
                        }
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              )
            ) : (
              <p className="no-comments">
                No comments yet.
              </p>
            )}

          </div>

          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault();

              if (
                !commentText.trim() ||
                !onComment
              ) {
                return;
              }

              const text = commentText.trim();

              onComment(
                commentsVideo,
                text
              ).then(() => {
                setCommentsVideo((previousVideo) => {
                  if (!previousVideo) return null;

                  return {
                    ...previousVideo,
                    comments: [
                      ...(previousVideo.comments || []),
                      {
                        id: `temp-${Date.now()}`,
                        userName: loggedInUser?.name || "You",
                        text
                      }
                    ]
                  };
                });

                setCommentText("");
              });
            }}
          >

            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(event) =>
                setCommentText(
                  event.target.value
                )
              }
            />

            <button type="submit">
              Post
            </button>

          </form>

        </div>
      </div>
    )}

    </div>
  );
}

export default Flips;
