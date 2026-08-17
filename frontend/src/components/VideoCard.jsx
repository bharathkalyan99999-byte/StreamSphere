import { Play, Eye, ThumbsUp } from "lucide-react";

function VideoCard({ video, onClick }) {
  return (
    <div
      className="video-card"
      onClick={onClick}
    >
      <div className="video-thumbnail">

        {video.videoUrl ? (
          <video
            src={video.videoUrl}
            preload="metadata"
          />
        ) : (
          <div />
        )}

        <div className="play-overlay">
          <div className="play-button">
            <Play size={22} fill="currentColor" />
          </div>
        </div>

      </div>

      <div className="video-info">

        <h3 className="video-title">
          {video.title}
        </h3>

        <div className="video-creator">
          {video.uploader || "Unknown Creator"}
        </div>

        <div className="video-meta">
          <span>
            <Eye size={14} /> {video.views || 0}
          </span>

          <span>
            <ThumbsUp size={14} /> {video.likes || 0}
          </span>

          {video.category && (
            <span>
              {video.category}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default VideoCard;
