const http = require("http");
const https = require("https");

function fetchHTML(url, callback) {
  https
    .get(url, (res) => {
      let data = "";

      // A chunk of data has been received.
      res.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Process the result.
      res.on("end", () => {
        callback(data);
      });
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

function extractStories(html) {
  const stories = [];
  let startIndex = 0;

  for (let i = 0; i < 6; i++) {
    // Find the <h3> tag containing the headline
    startIndex = html.indexOf(
      '<h3 class="latest-stories__item-headline">',
      startIndex
    );
    if (startIndex === -1) break;

    // Find the start of the URL
    startIndex = html.indexOf('<a href="', startIndex) + 9;
    let endIndex = html.indexOf('"', startIndex);
    const storyUrl = "https://time.com" + html.substring(startIndex, endIndex);

    // Find the start of the title text
    startIndex = html.indexOf('">', endIndex) + 2;
    endIndex = html.indexOf("</a>", startIndex);
    let storyTitle = html.substring(startIndex, endIndex).trim();

    // Clean the title by removing any potential HTML tags
    storyTitle = storyTitle.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, "");

    stories.push({ title: storyTitle, url: storyUrl });
  }

  return stories;
}

function getLatestStories(callback) {
  const url = "https://time.com";

  fetchHTML(url, (html) => {
    const stories = extractStories(html);
    callback(stories);
  });
}


http
  .createServer((req, res) => {
    if (req.url === "/getTimeStories" && req.method === "GET") {
      getLatestStories((stories) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(stories));
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  })
  .listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
  });
