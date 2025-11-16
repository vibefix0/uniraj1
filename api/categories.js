// api/categories.js
import fetch from "node-fetch";
import cheerio from "cheerio";
import Bottleneck from "bottleneck";

const BASE = "https://result.uniraj.ac.in/";
const limiter = new Bottleneck({ minTime: 500, maxConcurrent: 2 });

async function fetchUrl(url) {
  return limiter.schedule(() => fetch(url, {
    headers: { "User-Agent": "UniResultChecker/1.0" },
    timeout: 15000
  }).then(r => r.text()));
}

export default async function handler(req, res) {
  try {
    const html = await fetchUrl(BASE);
    const $ = cheerio.load(html);
    const links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (!href) return;
      const full = href.startsWith('http') ? href : new URL(href, BASE).href;
      if (full.includes('rid=')) links.push({ title: text || full, url: full });
    });
    // dedupe
    const seen = new Set(); const uniq = [];
    for (const l of links) { if (!seen.has(l.url)) { seen.add(l.url); uniq.push(l); } }
    res.status(200).json({ ok: true, count: uniq.length, categories: uniq });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.toString() });
  }
                      }
