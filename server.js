const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// Parse requests of
// content-type - application/json
// content-type - application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ravenpod
require('@ravenpod/ravenpod-web-dc')(
  app,
  {
    accessKey: '48ed2abd-b0a8-4e46-9a87-56338ca5ef1c',
    secretAccessKey: '4b9d4199f095a1745606ce3ee30622411bb8fc2a8ec41d71e1a6b2516f1bc189',
  }
)  
// Ravenpod

// Application routes 
require("./app/routes/asset.routes.js")(app);

// 'public' directory to server static assets
app.use(express.static('public'));

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

