import { useState } from "react";
import { Upload as UploadIcon, Video } from "lucide-react";

function Upload({
  onUploadSuccess,
  setCurrentPage
}) {
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState("Technology");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [aiPrompt, setAiPrompt] =
    useState("");

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiMessage, setAiMessage] =
    useState("");

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) {
      setAiMessage(
        "Describe your video first."
      );
      return;
    }

    try {
      setAiLoading(true);
      setAiMessage(
        "AI is creating your video details..."
      );

      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/ai-upload-assist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: aiPrompt
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "AI assistant failed"
        );
      }

      setTitle(data.title || "");
      setDescription(
        data.description || ""
      );
      setCategory(
        data.category || "Technology"
      );
      setTags(
        Array.isArray(data.tags)
          ? data.tags
          : []
      );

      setAiMessage(
        "AI details added successfully!"
      );

    } catch (error) {
      setAiMessage(
        "AI failed: " + error.message
      );
    } finally {
      setAiLoading(false);
    }
  };

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

    formData.append(
      "tags",
      tags.join(",")
    );

    try {
      setUploadMessage("Uploading video...");

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "https://streamsphere-backend-bk2026.azurewebsites.net/upload",
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
        "Video uploaded successfully!"
      );

      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setCategory("Technology");
      setTags([]);
      setTagInput("");

      if (onUploadSuccess) {
        onUploadSuccess(data.video);
      }

    } catch (error) {
      setUploadMessage(
        "Upload failed: " + error.message
      );
    }
  };

  return (
    <div className="page-container">

      <div className="upload-container">

        <div className="section-header">

          <button
            type="button"
            className="upload-back-button"
            onClick={() => setCurrentPage("home")}
          >
            ← Back
          </button>

          <div>
            <h1 className="section-title">
              Upload a Video
            </h1>

            <p className="section-subtitle">
              Share your content with the
              StreamSphere community.
            </p>
          </div>
        </div>

        <form onSubmit={uploadVideo}>

          <label className="upload-zone">

            <Video size={42} />

            <h3>
              {selectedFile
                ? selectedFile.name
                : "Choose a video to upload"}
            </h3>

            <p className="section-subtitle">
              Click here to select a video file
            </p>

            <input
              type="file"
              accept="video/*"
              onChange={(event) =>
                setSelectedFile(
                  event.target.files[0]
                )
              }
            />

          </label>

          <br />

          <div className="ai-upload-section">

            <div className="ai-upload-header">

              <h3>✨ AI Upload Assistant</h3>

              <p>
                Describe your video and AI will create the title,
                description, category and hashtags.
              </p>

            </div>

            <textarea
              className="ai-upload-input"
              placeholder="Example: I recorded my first day at the gym and trained legs..."
              value={aiPrompt}
              onChange={(event) =>
                setAiPrompt(event.target.value)
              }
            />

            <button
              type="button"
              className="btn btn-secondary ai-assist-button"
              onClick={handleAiAssist}
              disabled={aiLoading}
            >
              {aiLoading
                ? "AI is creating..."
                : "✨ Generate with AI"}
            </button>

            {aiMessage && (
              <p className="ai-upload-message">
                {aiMessage}
              </p>
            )}

          </div>

          <div className="form-group">
            <label>Video Title</label>

            <input
              type="text"
              placeholder="Give your video a title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              placeholder="Tell viewers about your video..."
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Category</label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option>Technology</option>
              <option>Gaming</option>
              <option>Travel</option>
              <option>Education</option>
              <option>Music</option>
              <option>Sports</option>
              <option>Fitness</option>
              <option>Entertainment</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tags</label>

            <div className="tags-input-container">

              {tags.map((tag) => (
                <span
                  className="tag-chip"
                  key={tag}
                >
                  {tag}

                  <button
                    type="button"
                    onClick={() =>
                      setTags((previous) =>
                        previous.filter(
                          (item) => item !== tag
                        )
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder="#gym #workout #legsday"
                value={tagInput}
                onChange={(event) =>
                  setTagInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === ","
                  ) {
                    event.preventDefault();

                    const values = tagInput
                      .trim()
                      .split(/[\s,]+/)
                      .filter(Boolean)
                      .map((value) =>
                        value.startsWith("#")
                          ? value
                          : `#${value}`
                      );

                    if (!values.length) return;

                    setTags((previous) => [
                      ...previous,
                      ...values.filter(
                        (tag) =>
                          !previous.includes(tag)
                      )
                    ]);

                    setTagInput("");
                  }
                }}
              />

            </div>

            <small className="tags-help">
              Type a hashtag and press Enter
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary upload-submit-button"
          >
            <UploadIcon size={18} />
            Upload Video
          </button>

          {uploadMessage && (
            <p className="section-subtitle">
              {uploadMessage}
            </p>
          )}

        </form>

      </div>

    </div>
  );
}

export default Upload;
