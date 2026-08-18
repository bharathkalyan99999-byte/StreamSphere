import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Volume2,
  VolumeX,
  Share2,
  MoreVertical,
  UserPlus,
  UserCheck
} from "lucide-react";


function ReelItem({
  video,
  loggedInUser,
  onLike,
  onCreatorClick
}) {

  const videoRef = useRef(null);

  const [muted, setMuted] =
    useState(false);

  const [following, setFollowing] =
    useState(false);

  const [expanded, setExpanded] =
    useState(false);

  const [aiSummary, setAiSummary] =
    useState("");

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const handleGenerateSummary =
    async () => {

      try {

        setSummaryLoading(true);

        const response =
          await fetch(
            "https://streamsphere-backend-bk2026.azurewebsites.net/ai-video-summary",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                title: video.title,
                description:
                  video.description
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.error ||
            "Failed to generate summary"
          );

        }

        setAiSummary(
          data.summary || ""
        );

      } catch (error) {

        console.error(
          "AI summary error:",
          error
        );

        alert(
          error.message ||
          "Failed to generate AI summary"
        );

      } finally {

        setSummaryLoading(false);

      }

    };


  useEffect(() => {

    const element =
      videoRef.current;

    if (!element) {
      return;
    }


    const observer =
      new IntersectionObserver(
        (entries) => {

          const entry =
            entries[0];

          if (entry.isIntersecting) {

            element
              .play()
              .catch(() => {});

          } else {

            element.pause();

          }

        },
        {
          threshold: 0.75
        }
      );


    observer.observe(element);


    return () => {
      observer.disconnect();
      element.pause();
    };

  }, []);


  const handleFollow =
    async () => {

      if (!loggedInUser) {

        alert(
          "Please log in to follow creators"
        );

        return;
      }


      if (!video.uploaderId) {

        return;
      }


      try {

        const response =
          await fetch(
            `https://streamsphere-backend-bk2026.azurewebsites.net/users/${video.uploaderId}/follow`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                userId:
                  loggedInUser.id
              })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.error ||
            "Failed to follow creator"
          );

        }


        setFollowing(
          data.following
        );

      } catch (error) {

        console.error(
          "Follow error:",
          error
        );

        alert(
          "Failed to update follow status"
        );

      }

    };


  const handleShare =
    async () => {

      try {

        if (
          navigator.share
        ) {

          await navigator.share({
            title:
              video.title || "StreamSphere",
            text:
              video.description || "",
            url:
              window.location.href
          });

        } else if (
          navigator.clipboard
        ) {

          await navigator.clipboard.writeText(
            window.location.href
          );

          alert(
            "Video link copied!"
          );

        }

      } catch (error) {

        console.log(
          "Share cancelled"
        );

      }

    };


  const description =
    video.description ||
    "No description provided.";


  return (

    <article
      className="reel-item"
    >

      <div
        className="reel-video-container"
      >

        {video.videoUrl ? (

          <video
            ref={videoRef}
            src={video.videoUrl}
            className="reel-video"
            playsInline
            muted={muted}
            loop
            preload="metadata"

            onClick={(event) => {

              const current =
                event.currentTarget;

              if (current.paused) {

                current.play();

              } else {

                current.pause();

              }

            }}
          />

        ) : (

          <div className="reel-video-empty">
            Video unavailable
          </div>

        )}


        {/* RIGHT SIDE ACTIONS */}

        <div
          className="reel-actions"
        >

          <button
            className="reel-action ai-summary-action"
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
          >
            ✨

            <span>
              {summaryLoading
                ? "Loading..."
                : "AI Summary"}
            </span>
          </button>

          <button
            className="reel-action"
            onClick={() =>
              onLike(video)
            }
          >

            <Heart
              size={30}
              strokeWidth={2.2}
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
            className="reel-action"
            onClick={() => {

              const comments =
                document.querySelector(
                  ".reel-comments"
                );

              if (comments) {
                comments.scrollIntoView({
                  behavior: "smooth"
                });
              }

            }}
          >

            <MessageCircle
              size={30}
              strokeWidth={2.2}
            />

            <span>
              {video.comments?.length || 0}
            </span>

          </button>


          <button
            className="reel-action"
            onClick={() =>
              setMuted(!muted)
            }
          >

            {muted ? (

              <VolumeX
                size={30}
                strokeWidth={2.2}
              />

            ) : (

              <Volume2
                size={30}
                strokeWidth={2.2}
              />

            )}

            <span>
              {muted
                ? "Unmute"
                : "Mute"}
            </span>

          </button>


          <button
            className="reel-action"
            onClick={
              handleShare
            }
          >

            <Share2
              size={30}
              strokeWidth={2.2}
            />

            <span>
              Share
            </span>

          </button>


          <div
            className="reel-action"
          >

            <Eye
              size={30}
              strokeWidth={2.2}
            />

            <span>
              {video.views || 0}
            </span>

          </div>


          <button
            className="reel-action"
            onClick={() => {}}
          >

            <MoreVertical
              size={30}
              strokeWidth={2.2}
            />

          </button>

        </div>


        {/* BOTTOM INFORMATION */}

        <div
          className={
            expanded
              ? "reel-bottom expanded"
              : "reel-bottom"
          }
        >

          {/* CREATOR */}

          <div
            className="reel-creator"
          >

            <button
              className="reel-creator-profile"
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

                <div
                  className="reel-avatar-placeholder"
                >
                  {(
                    video.uploader ||
                    "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

              )}

            </button>


            <div
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

              <strong>
                {video.uploader ||
                  "Unknown Creator"}
              </strong>

              <span>
                Creator
              </span>

            </div>


            {loggedInUser?.id !==
              video.uploaderId && (

              <button
                className={
                  following
                    ? "reel-follow following"
                    : "reel-follow"
                }
                onClick={
                  handleFollow
                }
              >

                {following ? (

                  <>
                    <UserCheck
                      size={16}
                    />
                    Following
                  </>

                ) : (

                  <>
                    <UserPlus
                      size={16}
                    />
                    Follow
                  </>

                )}

              </button>

            )}

          </div>


          {/* DESCRIPTION */}

          <div
            className="reel-description"
          >

            <span>
              {expanded
                ? description
                : description.length > 100
                ? description.substring(
                    0,
                    100
                  ) + "..."
                : description}
            </span>


            {description.length >
              100 && (

              <button
                className="reel-more"
                onClick={() =>
                  setExpanded(
                    !expanded
                  )
                }
              >

                {expanded
                  ? "Show less"
                  : "More"}

              </button>

            )}

          </div>

          <div className="ai-summary-section">

            {!aiSummary ? (

              <button
                type="button"
                className="ai-summary-button"
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
              >
                {summaryLoading
                  ? "Generating summary..."
                  : "✨ Generate AI Summary"}
              </button>

            ) : (

              <div className="ai-summary-box">

                <strong>
                  ✨ AI Video Summary
                </strong>

                <p>
                  {aiSummary}
                </p>

                <button
                  type="button"
                  className="ai-summary-button"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                >
                  Generate Again
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </article>

  );

}


function VideoDetail({
  video,
  onBack,
  onVideoClick,
  onLike,
  onComment,
  loggedInUser,
  onCreatorClick,
  relatedVideos = []
}) {


  if (!video) {
    return null;
  }


  /*
    Put the selected video first.
    Then put the remaining videos after it.
  */

  const feedVideos = [
    video,

    ...relatedVideos.filter(
      (item) =>
        item.id !== video.id
    )
  ];


  return (

    <div
      className="flips-page"
    >

      {/* BACK BUTTON */}

      <button
        className="flips-back"
        onClick={onBack}
      >

        <ArrowLeft
          size={18}
        />

        Back

      </button>


      {/* VERTICAL REELS FEED */}

      <div
        className="flips-feed"
      >

        {feedVideos.map(
          (item, index) => (

            <ReelItem
              key={item.id}
              video={item}
              loggedInUser={
                loggedInUser
              }
              onLike={onLike}
              onCreatorClick={
                onCreatorClick
              }
            />

          )
        )}

      </div>

    </div>

  );

}


export default VideoDetail;
