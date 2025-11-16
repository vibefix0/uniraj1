export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.scraperapi.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "free",
          url: "https://result.uniraj.ac.in/"
        })
      }
    );

    const html = await response.text();
    const cheerio = (await import("cheerio")).default;
    const $ = cheerio.load(html);

    const links = [];
    $("a[href]").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && href.includes("rid=")) {
        links.push({
          title: text,
          url: "https://result.uniraj.ac.in/" + href
        });
      }
    });

    res.status(200).json({ ok: true, categories: links });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.toString() });
  }
}
