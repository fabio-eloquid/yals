const express = require("express");
const { join } = require("path");
const app = express();
const { auth } = require("express-oauth2-jwt-bearer");
const authConfig = require("./auth_config.json");

console.log("Auth Config:", authConfig);

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

if (!authConfig.domain || !authConfig.audience) {
  throw "Please make sure that auth_config.json is in place and populated";
}

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  next();
});

console.log("checkJwt middleware initialized with:", { 
  audience: authConfig.audience, 
  issuerBaseURL: `https://${authConfig.domain}` 
});

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`,
});

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.get("/api/external", (req, res, next) => {
  console.log("Accessing /api/external");
  return checkJwt(req, res, next);
}, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  console.log("Serving index.html");
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

// Error handling middleware
app.use(function(err, req, res, next) {
  console.error("Error caught in middleware:", err);
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }
  next(err, req, res);
});

// Listen on port 4000
app.listen(4000, () => console.log("Application running on port 4000"));
