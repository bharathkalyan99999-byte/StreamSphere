require("dotenv").config();

const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database =
  client.database(process.env.COSMOS_DATABASE);

const videosContainer =
  database.container(process.env.COSMOS_CONTAINER);

const usersContainer =
  database.container("Users");

module.exports = {
  videosContainer,
  usersContainer
};