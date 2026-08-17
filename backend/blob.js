require("dotenv").config();

const {
  BlobServiceClient
} = require("@azure/storage-blob");

const blobServiceClient =
  BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );

const videoContainer =
  blobServiceClient.getContainerClient("videos");

const profilePicturesContainer =
  blobServiceClient.getContainerClient(
    "profile-pictures"
  );

module.exports = {
  videoContainer,
  profilePicturesContainer
};
