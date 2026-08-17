import {
  Video,
  Eye,
  ThumbsUp,
  MessageCircle,
  Upload,
  Trash2,
  Plus
} from "lucide-react";

import { useState } from "react";
function CreatorDashboard({
  videos = [],
  loggedInUser,
  onUpload,
  onVideoClick,
  onDelete
}) {
  const myVideos = videos.filter(
    (video) =>
      video.uploaderId === loggedInUser?.id
  );

  const totalViews = myVideos.reduce(
    (total, video) =>
      total + (video.views || 0),
    0
  );

  const totalLikes = myVideos.reduce(
    (total, video) =>
      total + (video.likes || 0),
    0
  );

  const followersCount =
    loggedInUser?.followersCount ||
    loggedInUser?.followers?.length ||
    0;

  return (
    <div className="dashboard-page">
      <div className="page-container">

        <section className="creator-profile">

          <div className="creator-avatar">
            {loggedInUser?.profilePicture ? (
              <img
                src={loggedInUser.profilePicture}
                alt="Profile"
              />
            ) : (
              loggedInUser?.name
                ? loggedInUser.name
                    .charAt(0)
                    .toUpperCase()
                : "C"
            )}
          </div>

          <div className="creator-profile-content">

            <div className="creator-profile-top">

              <div>
                <h1>
                  {loggedInUser?.name || "Creator"}
                </h1>

                <p>
                  Creator
                </p>
              </div>



            </div>

            <div className="creator-stats">

              <div>
                <strong>
                  {myVideos.length}
                </strong>
                <span>Videos</span>
              </div>

              <div>
                <strong>
                  {totalViews}
                </strong>
                <span>Views</span>
              </div>

              <div>
                <strong>
                  {totalLikes}
                </strong>
                <span>Likes</span>
              </div>

              <div>
                <strong>
                  {followersCount}
                </strong>
                <span>Followers</span>
              </div>

            </div>

          </div>

        </section>

        <div className="creator-divider"></div>

        <section className="dashboard-videos">

          <div className="dashboard-section-header">

            <h2>
              Videos
            </h2>

            <span>
              {myVideos.length} uploaded
            </span>

          </div>

          {myVideos.length === 0 ? (

            <div className="dashboard-empty">

              <Video size={40} />

              <h3>
                No videos yet
              </h3>

              <p>
                Upload your first video to get started.
              </p>


            </div>

          ) : (

            <div className="dashboard-video-list">

              {myVideos.map((video) => (

                <div
                  className="dashboard-video"
                  key={video.id}
                  onClick={() =>
                    onVideoClick(video)
                  }
                >

                  <div className="dashboard-video-thumbnail">

                    {video.videoUrl && (
                      <video
                        src={video.videoUrl}
                        preload="metadata"
                      />
                    )}

                  </div>

                  <div className="dashboard-video-info">

                    <div className="dashboard-video-title-row">

                      <div>

                        <h3>
                          {video.title}
                        </h3>

                        <p>
                          {video.category || "General"}
                        </p>

                      </div>


                    </div>

                    <div className="dashboard-video-stats">

                      <span>
                        <Eye size={15} />
                        {video.views || 0}
                      </span>

                      <span>
                        <ThumbsUp size={15} />
                        {video.likes || 0}
                      </span>

                      <span>
                        <MessageCircle size={15} />
                        {video.comments?.length || 0}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>


    </div>
  );
}

export default CreatorDashboard;
