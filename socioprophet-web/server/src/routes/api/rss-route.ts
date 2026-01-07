export {};
const express = require("express");
const { JSDOM } = require("jsdom");
const NodeCache = require("node-cache");
const { HN_URL } = require("../../constants/index");

const { Response: Res } = express;

const router = express.Router();

const cache = new NodeCache({ stdTTL: 600 });

const fetchHackerNewsFeed = async (res: typeof Res) => {
  const feedResponse = await fetch(HN_URL);
  const feedData = await feedResponse.text();

  const dom = new JSDOM(feedData, { contentType: "text/xml" });

  type FeedItem = {
    title: string;
    link: string;
  };

  const items: FeedItem[] = Array.from(
    dom.window.document.querySelectorAll("item")
  ).map((itemElement) => {
    const item = itemElement as Element;
    const title = item.querySelector("title")?.textContent || "";
    const link = item.querySelector("link")?.textContent || "";

    return { title, link };
  });

  cache.set(HN_URL, items);
  res.send(items);
};

router.get("/rss", (_req: Request, res: typeof Res) => {
  const cachedData = cache.get(HN_URL);

  if (cachedData) {
    res.send(cachedData);
  } else {
    fetchHackerNewsFeed(res);
  }
});

module.exports = router;
