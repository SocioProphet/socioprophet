const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const cookieSession = require("cookie-session");
const rateLimit = require("express-rate-limit");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const rssRouter = require("./routes/api/rss-route");
const buildsRouter = require("./routes/api/builds-route");
const fleetRouter = require("./routes/api/fleet-route");
const bootRouter = require("./routes/boot-route");
const proCyberneticaRouter = require("./routes/api/procybernetica-dashboard-route");
const deliveryRouter = require("./routes/api/delivery-route");
const consentRouter = require("./routes/api/consent-route");
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

// HTTP-layer rate limiting (complements the per-user app limits in the routes).
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const bootLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

app.use("/api/feed", rssRouter);
app.use("/api/builds", apiLimiter, requireAuth, buildsRouter);
app.use("/api/fleet", apiLimiter, requireAuth, fleetRouter);
app.use("/api/procybernetica", apiLimiter, proCyberneticaRouter);
// Sovereign delivery producer (public read): /api/delivery/* + /api/cowork/*.
// Sovereign store is canonical; the client adapters fail closed when unreachable.
app.use("/api", apiLimiter, deliveryRouter);
// Consent plane. AUTHENTICATED: the subject comes from the session, never from the request, so
// a caller cannot name whose consent they read or change. Backs client-vue's ConsentBoard.
app.use("/svc/consent", apiLimiter, requireAuth, consentRouter);
// Device provisioning is UNAUTHENTICATED (claim-code authorized) — nlboot devices
// have no Socbase token; rate-limited at the HTTP layer.
app.use("/boot", bootLimiter, bootRouter);

const server = app.listen(port, () =>
  console.log(`Server up and running on port ${port}.`)
);

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
