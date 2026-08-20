require("dotenv").config();

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
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


const getProfilePictureUrl = (blobName) => {
  if (!blobName) return null;

  // Support old records that still contain a full URL
  if (blobName.startsWith("http")) {
    return blobName;
  }

  const accountName =
    process.env.AZURE_STORAGE_ACCOUNT_NAME;

  const accountKey =
    process.env.AZURE_STORAGE_ACCOUNT_KEY;

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
          Date.now() + 24 * 60 * 60 * 1000
        )
      },
      sharedKeyCredential
    ).toString();

  const blockBlobClient =
    profilePicturesContainer
      .getBlockBlobClient(blobName);

  return `${blockBlobClient.url}?${sasToken}`;
};

module.exports = {
  videoContainer,
  profilePicturesContainer,
  getProfilePictureUrl
};
