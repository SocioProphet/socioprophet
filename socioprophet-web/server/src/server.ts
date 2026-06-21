const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const cookieSession = require("cookie-session");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const rssRouter = require("./routes/api/rss-route");
const buildsRouter = require("./routes/api/builds-route");
const fleetRouter = require("./routes/api/fleet-route");
const bootRouter = require("./routes/boot-route");
const { requireAuth } = require("./middleware/auth");

const app = express();
const port = process.env.PORT;

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    name: "basic-session",
    keys: ["key1", "key2"],
  })
);

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/feed", rssRouter);
app.use("/api/builds", requireAuth, buildsRouter);
app.use("/api/fleet", requireAuth, fleetRouter);
// Device provisioning is UNAUTHENTICATED (claim-code authorized) — nlboot devices
// have no Firebase token.
app.use("/boot", bootRouter);

const server = app.listen(port, () =>
  console.log(`Server up and running on port ${port}.`)
);

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
