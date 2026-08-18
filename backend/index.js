require("dotenv").config();

const OLLAMA_URL =
  "https://streamsphere-ollama.greenpebble-f818ef38.polandcentral.azurecontainerapps.io";

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential
} = require("@azure/storage-blob");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { videosContainer,usersContainer } = require("./cosmos");
const {
  videoContainer: containerClient,
  profilePicturesContainer
} = require("./blob");

const app = express();
const PORT = process.env.PORT || 5001;

const upload = multer({
  storage: multer.memoryStorage()
});

app.use(cors());
app.use(express.json({
  limit: "10mb"
}));

app.get("/", (req, res) => {
  res.json({
    message: "StreamSphere backend is running!"
  });
});

app.post("/ai-search", async (req, res) => {
  try {
    const { query, videos } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Please enter a search query"
      });
    }

    if (!videos || videos.length === 0) {
      return res.json({
        videoIds: []
      });
    }

    const videoData = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags || []
    }));

    const prompt = `You are an AI video search assistant.

The user will search for videos using natural language.

Identify the videos that best match the user's request.

Return ONLY valid JSON in this exact format:

{"videoIds":["video-id-1","video-id-2"]}

Only include IDs from the provided videos.

Search request:
${query}

Videos:
${JSON.stringify(videoData)}`;

    const response = await fetch(
      `${OLLAMA_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt,
          stream: false,
          format: "json"
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Ollama error:",
        response.status,
        errorText
      );

      throw new Error(
        `Ollama request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    const result = JSON.parse(data.response);

    res.json({
      videoIds: result.videoIds || []
    });

  } catch (error) {
    console.error("AI search error:", error);

    res.status(500).json({
      error: "AI search failed"
    });
  }
});

app.post("/ai-upload-assist", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Please describe your video"
      });
    }

    const aiPrompt = `You are an AI assistant for a video sharing platform.

Based on the user's description, generate:

1. A short, engaging video title
2. A clear video description
3. The best matching category
4. 3 to 6 relevant hashtags

Return ONLY valid JSON. No markdown. No explanation.

Use exactly this format:

{
  "title": "Example video title",
  "description": "Example description",
  "category": "Technology",
  "tags": ["#example", "#video"]
}

Allowed categories are ONLY:

Technology, Gaming, Travel, Education, Music, Sports, Fitness, Entertainment

User's video description:

${prompt}`;

    const response = await fetch(
      `${OLLAMA_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt: aiPrompt,
          stream: false,
          format: "json"
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Ollama error:",
        response.status,
        errorText
      );

      throw new Error(
        `Ollama request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    const result = JSON.parse(data.response);

    res.json({
      title: result.title || "",
      description: result.description || "",
      category: result.category || "Technology",
      tags: Array.isArray(result.tags)
        ? result.tags
        : []
    });

  } catch (error) {
    console.error("AI upload assistant error:", error);

    res.status(500).json({
      error: "AI assistant failed"
    });
  }
});

app.post("/ai-video-summary", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        error: "Video information is required"
      });
    }

    const aiPrompt = `Create a short and clear summary of this video based ONLY on the information provided below.

Keep the summary between 2 and 4 sentences.

Do not invent events or details that are not provided.

Video title:

${title || "Not provided"}

Video description:

${description || "Not provided"}

Return only the summary text. No heading. No markdown.`;

    const response = await fetch(
      `${OLLAMA_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3.2:3b",
          prompt: aiPrompt,
          stream: false
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Ollama error:",
        response.status,
        errorText
      );

      throw new Error(
        `Ollama request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    res.json({
      summary: data.response?.trim() || ""
    });

  } catch (error) {
    console.error("AI video summary error:", error);

    res.status(500).json({
      error: "AI summary failed"
    });
  }
});

app.get("/videos", async (req, res) => {
  try {
    const { resources: videos } = await videosContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING;

    const accountName =
      connectionString.match(/AccountName=([^;]+)/)[1];

    const accountKey =
      connectionString.match(/AccountKey=([^;]+)/)[1];

    const sharedKeyCredential =
      new StorageSharedKeyCredential(
        accountName,
        accountKey
      );

    const videosWithAccessUrls = videos.map((video) => {
      if (!video.blobName) {
        return video;
      }

      const sasToken =
        generateBlobSASQueryParameters(
          {
            containerName: "videos",
            blobName: video.blobName,
            permissions: BlobSASPermissions.parse("r"),
            startsOn: new Date(),
            expiresOn: new Date(
              Date.now() + 60 * 60 * 1000
            )
          },
          sharedKeyCredential
        ).toString();

      return {
        ...video,
        videoUrl:
          `${containerClient.url}/${video.blobName}?${sasToken}`
      };
    });

    const videosWithCreatorProfiles =
      await Promise.all(
        videosWithAccessUrls.map(async (video) => {
          if (!video.uploaderId) {
            return video;
          }

          try {
            const { resource: creator } =
              await usersContainer
                .item(
                  video.uploaderId,
                  "creator"
                )
                .read();

            return {
              ...video,
              uploaderProfilePicture:
                creator?.profilePicture || null
            };

          } catch (error) {
            return {
              ...video,
              uploaderProfilePicture: null
            };
          }
        })
      );

    res.json(videosWithCreatorProfiles);

  } catch (error) {
    console.error("Video fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch videos"
    });
  }
});

app.delete("/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { resource: video } = await videosContainer
      .item(id, id)
      .read();

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    if (video.blobName) {
      const blobClient =
        containerClient.getBlockBlobClient(video.blobName);

      await blobClient.deleteIfExists();
    }

    await videosContainer
      .item(id, video.partitionKey || id)
      .delete();

    res.json({
      message: "Video deleted successfully"
    });

  } catch (error) {
    console.error("Delete video error:", error);

    res.status(500).json({
      error: "Failed to delete video"
    });
  }
});

app.post(
  "/upload",
  upload.single("video"),
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          error: "Please log in to upload a video"
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (!req.file) {
        return res.status(400).json({
          error: "Please select a video file"
        });
      }

      const {
        title,
        description,
        category,
        tags
      } = req.body;

      const blobName =
        `${Date.now()}-${req.file.originalname}`;

      const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(
        req.file.buffer,
        {
          blobHTTPHeaders: {
            blobContentType: req.file.mimetype
          }
        }
      );

      const video = {
        id: `video-${Date.now()}`,
        title:
          title || req.file.originalname,
        description:
          description || "",
        category:
          category || "General",
        tags: tags
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        uploaderId: decoded.id,
        uploader: decoded.name,
        videoUrl:
          blockBlobClient.url,
        blobName:
          blobName,
        views: 0,
        likes: 0,
        createdAt:
          new Date().toISOString()
      };

      await videosContainer.items.create(video);

      res.status(201).json({
        message:
          "Video uploaded successfully!",
        video
      });

    } catch (error) {
      console.error("Upload error:", error);

      res.status(500).json({
        error:
          "Failed to upload video"
      });
    }
  }
);

app.post("/videos/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: "Please log in to like videos"
      });
    }

    const { resource: video } =
      await videosContainer.item(id, id).read();

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    if (!video.likedBy) {
      video.likedBy = [];
    }

    const alreadyLiked =
      video.likedBy.includes(userId);

    if (alreadyLiked) {
      video.likedBy =
        video.likedBy.filter(
          (user) => user !== userId
        );

      video.likes =
        Math.max(
          0,
          (video.likes || 0) - 1
        );

    } else {
      video.likedBy.push(userId);

      video.likes =
        (video.likes || 0) + 1;
    }

    const { resource: updatedVideo } =
      await videosContainer
        .item(video.id, video.id)
        .replace(video);

    res.json({
      ...updatedVideo,
      liked: !alreadyLiked
    });

  } catch (error) {
    console.error("Like update error:", error);

    res.status(500).json({
      error: "Failed to update like"
    });
  }
});

app.post("/videos/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    const { resource: video } =
      await videosContainer.item(id, id).read();

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    video.views = (video.views || 0) + 1;

    const { resource: updatedVideo } =
      await videosContainer
        .item(video.id, video.id)
        .replace(video);

    res.json(updatedVideo);

  } catch (error) {
    console.error("View update error:", error);

    res.status(500).json({
      error: "Failed to update views"
    });
  }
});

app.post("/videos/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      userId,
      userName,
      text
    } = req.body;

    if (!userId || !userName || !text) {
      return res.status(400).json({
        error: "User and comment text are required"
      });
    }

    const { resource: video } =
      await videosContainer.item(id, id).read();

    if (!video) {
      return res.status(404).json({
        error: "Video not found"
      });
    }

    if (!video.comments) {
      video.comments = [];
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      userId,
      userName,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    video.comments.push(newComment);

    const { resource: updatedVideo } =
      await videosContainer
        .item(video.id, video.id)
        .replace(video);

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      comments: updatedVideo.comments
    });

  } catch (error) {
    console.error("Comment error:", error);

    res.status(500).json({
      error: "Failed to add comment"
    });
  }
});


// -------------------------
// DELETE COMMENT
// -------------------------

app.delete(
  "/videos/:videoId/comments/:commentId",
  async (req, res) => {
    try {
      const {
        videoId,
        commentId
      } = req.params;

      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: "Please log in"
        });
      }

      const { resource: video } =
        await videosContainer
          .item(videoId, videoId)
          .read();

      if (!video) {
        return res.status(404).json({
          error: "Video not found"
        });
      }

      const comment =
        video.comments?.find(
          (item) => item.id === commentId
        );

      if (!comment) {
        return res.status(404).json({
          error: "Comment not found"
        });
      }

      const isCommentOwner =
        comment.userId === userId;

      const isVideoCreator =
        video.uploaderId === userId;

      if (
        !isCommentOwner &&
        !isVideoCreator
      ) {
        return res.status(403).json({
          error:
            "You cannot delete this comment"
        });
      }

      video.comments =
        video.comments.filter(
          (item) => item.id !== commentId
        );

      const { resource: updatedVideo } =
        await videosContainer
          .item(video.id, video.id)
          .replace(video);

      res.json({
        message:
          "Comment deleted successfully",
        comments:
          updatedVideo.comments
      });

    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to delete comment"
      });
    }
  }
);

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    if (role !== "creator" && role !== "consumer") {
      return res.status(400).json({
        error: "Role must be creator or consumer"
      });
    }

    const { resources: existingUsers } =
      await usersContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.email = @email",
          parameters: [
            {
              name: "@email",
              value: email
            }
          ]
        })
        .fetchAll();

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: "User already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role,
      profilePicture: null,
      createdAt: new Date().toISOString()
    };

    await usersContainer.items.create(user);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      error: "Failed to register user"
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const { resources: users } =
      await usersContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.email = @email",
          parameters: [
            {
              name: "@email",
              value: email
            }
          ]
        })
        .fetchAll();

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = users[0];

    const passwordMatch =
      await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Failed to login"
    });
  }
});

// -------------------------
// UPDATE PROFILE PICTURE
// -------------------------

app.put("/users/:id/profile-picture", async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const userId = req.params.id;

    if (!profilePicture) {
      return res.status(400).json({
        error: "Profile picture is required"
      });
    }

    const { resources: users } =
      await usersContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [
            {
              name: "@id",
              value: userId
            }
          ]
        })
        .fetchAll();

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const user = users[0];

    const matches =
      profilePicture.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );

    if (!matches) {
      return res.status(400).json({
        error: "Invalid image format"
      });
    }

    const contentType = matches[1];
    const imageBuffer =
      Buffer.from(matches[2], "base64");

    const extension =
      contentType.split("/")[1]
        .replace("jpeg", "jpg");

    const blobName =
      `profile-${userId}-${Date.now()}.${extension}`;

    await profilePicturesContainer.createIfNotExists();

    const blockBlobClient =
      profilePicturesContainer
        .getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(
      imageBuffer,
      {
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      }
    );

    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING;

    const accountName =
      connectionString.match(
        /AccountName=([^;]+)/
      )[1];

    const accountKey =
      connectionString.match(
        /AccountKey=([^;]+)/
      )[1];

    const sharedKeyCredential =
      new StorageSharedKeyCredential(
        accountName,
        accountKey
      );

    const sasToken =
      generateBlobSASQueryParameters(
        {
          containerName: "profile-pictures",
          blobName,
          permissions:
            BlobSASPermissions.parse("r"),
          startsOn: new Date(),
          expiresOn: new Date(
            Date.now() +
            24 * 60 * 60 * 1000
          )
        },
        sharedKeyCredential
      ).toString();

    const profilePictureUrl =
      `${blockBlobClient.url}?${sasToken}`;

    user.profilePicture =
      profilePictureUrl;

    const { resource: updatedUser } =
      await usersContainer
        .item(user.id, user.role)
        .replace(user);

    res.json({
      message:
        "Profile picture updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture:
          updatedUser.profilePicture
      }
    });

  } catch (error) {
    console.error(
      "PROFILE PICTURE UPDATE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to update profile picture"
    });
  }
});


// -------------------------
// FOLLOW / UNFOLLOW CREATOR
// -------------------------

app.post("/users/:creatorId/follow", async (req, res) => {
  try {
    const { userId } = req.body;
    const creatorId = req.params.creatorId;

    if (!userId) {
      return res.status(400).json({
        error: "Please log in to follow creators"
      });
    }

    if (userId === creatorId) {
      return res.status(400).json({
        error: "You cannot follow yourself"
      });
    }

    const { resources: users } =
      await usersContainer.items
        .query({
          query:
            "SELECT * FROM c WHERE c.id = @id",
          parameters: [
            {
              name: "@id",
              value: userId
            }
          ]
        })
        .fetchAll();

    const { resources: creators } =
      await usersContainer.items
        .query({
          query:
            "SELECT * FROM c WHERE c.id = @id",
          parameters: [
            {
              name: "@id",
              value: creatorId
            }
          ]
        })
        .fetchAll();

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (creators.length === 0) {
      return res.status(404).json({
        error: "Creator not found"
      });
    }

    const user = users[0];
    const creator = creators[0];

    if (!user.following) {
      user.following = [];
    }

    if (!creator.followers) {
      creator.followers = [];
    }

    const alreadyFollowing =
      user.following.includes(creatorId);

    if (alreadyFollowing) {
      user.following =
        user.following.filter(
          (id) => id !== creatorId
        );

      creator.followers =
        creator.followers.filter(
          (id) => id !== userId
        );
    } else {
      user.following.push(creatorId);
      creator.followers.push(userId);
    }

    await usersContainer
      .item(user.id, user.role)
      .replace(user);

    await usersContainer
      .item(creator.id, creator.role)
      .replace(creator);

    res.json({
      message: alreadyFollowing
        ? "Unfollowed successfully"
        : "Followed successfully",

      following: !alreadyFollowing,

      followersCount:
        creator.followers.length
    });

  } catch (error) {
    console.error(
      "FOLLOW ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to update follow status"
    });
  }
});


// -------------------------
// GET CREATOR PROFILE
// -------------------------

app.get("/creators/:id", async (req, res) => {
  try {
    const creatorId = req.params.id;

    const { resources: creators } =
      await usersContainer.items
        .query({
          query:
            "SELECT * FROM c WHERE c.id = @id",
          parameters: [
            {
              name: "@id",
              value: creatorId
            }
          ]
        })
        .fetchAll();

    if (creators.length === 0) {
      return res.status(404).json({
        error: "Creator not found"
      });
    }

    const creator = creators[0];

    const { resources: videos } =
      await videosContainer.items
        .query({
          query:
            "SELECT * FROM c WHERE c.uploaderId = @id",
          parameters: [
            {
              name: "@id",
              value: creatorId
            }
          ]
        })
        .fetchAll();

    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING;

    const accountName =
      connectionString.match(
        /AccountName=([^;]+)/
      )[1];

    const accountKey =
      connectionString.match(
        /AccountKey=([^;]+)/
      )[1];

    const sharedKeyCredential =
      new StorageSharedKeyCredential(
        accountName,
        accountKey
      );

    const videosWithAccessUrls =
      videos.map((video) => {

        if (!video.blobName) {
          return video;
        }

        const sasToken =
          generateBlobSASQueryParameters(
            {
              containerName: "videos",
              blobName: video.blobName,
              permissions:
                BlobSASPermissions.parse("r"),
              startsOn: new Date(
                Date.now() - 5 * 60 * 1000
              ),
              expiresOn: new Date(
                Date.now() +
                60 * 60 * 1000
              )
            },
            sharedKeyCredential
          ).toString();

        return {
          ...video,
          videoUrl:
            `${containerClient.url}/${video.blobName}?${sasToken}`
        };

      });

    res.json({
      creator: {
        id: creator.id,
        name: creator.name,
        role: creator.role,
        profilePicture:
          creator.profilePicture || null,

        followersCount:
          creator.followers
            ? creator.followers.length
            : 0,

        followingCount:
          creator.following
            ? creator.following.length
            : 0,

        postsCount:
          videos.length
      },

      videos:
        videosWithAccessUrls
    });

  } catch (error) {
    console.error(
      "CREATOR PROFILE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to load creator profile"
    });
  }
});



app.listen(PORT, () => {
  console.log(
    `Backend running at http://localhost:${PORT}`
  );
});
