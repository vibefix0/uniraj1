// api/result.js
import fetch from "node-fetch";
import cheerio from "cheerio";
import Bottleneck from "bottleneck";
import FormData from "form-data";

const limiter = new Bottleneck({ minTime: 500, maxConcurrent: 2 });

async function fetchText(url, options) {
  return limiter.schedule(() => fetch(url, options).then(r => r.text()));
}

function parseResultHtml(html) {
  const $ = cheerio.load(html);
  const data = {};
  $('table').each((ti, table) => {
    $(table).find('tr').each((i, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 2) {
        const key = $(tds[0]).text().trim().replace(/\s+:/,'').replace(/\s+/g,' ');
        const val = $(tds[1]).text().trim().replace(/\s+/g,' ');
        if (key) data[key] = val;
      }
    });
  });
  if (Object.keys(data).length === 0) {
    $('p,div,span').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.includes(':')) {
        const [k, ...rest] = text.split(':');
        data[k.trim()] = rest.join(':').trim();
      }
    });
  }
  return { parsed: data, snippet: $.root().html().substring(0,3000) };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error: "Use POST" });
    const body = req.body || await (async ()=>{ const t=await req.text(); try{return JSON.parse(t);}catch(e){return {};}})();
    const { rid, roll, dob, extraHidden } = body;
    if (!rid || !roll || !dob) return res.status(400).json({ ok:false, error: "Missing rid/roll/dob" });
    const pageUrl = rid.includes('http') ? rid : `https://result.uniraj.ac.in/${rid}`;
    const pageHtml = await fetchText(pageUrl, { headers:{ "User-Agent":"UniResultChecker/1.0" } });
    const $ = cheerio.load(pageHtml);
    const form = $('form').first();
    const action = form && form.attr('action') ? new URL(form.attr('action'), pageUrl).href : pageUrl;
    const hidden = {};
    form.find('input[type="hidden"]').each((i, el) => {
      const name = $(el).attr('name'); const val = $(el).attr('value') || '';
      if (name) hidden[name] = val;
    });
    if (extraHidden && typeof extraHidden === 'object') Object.assign(hidden, extraHidden);
    let rollField = null, dobField = null;
    form.find('input').each((i, el) => {
      const nm = $(el).attr('name')||'';
      const ph = ($(el).attr('placeholder')||'') + ' ' + ($(el).attr('id') || '');
      const combined = (nm + ph).toLowerCase();
      if (!rollField && combined.includes('roll')) rollField = nm;
      if (!dobField && (combined.includes('dob') || combined.includes('date'))) dobField = nm;
    });
    rollField = rollField || 'txtroll' || 'rollno' || 'roll';
    dobField = dobField || 'txtdob' || 'dob' || 'dateofbirth';
    const formdata = new FormData();
    for (const k of Object.keys(hidden)) formdata.append(k, hidden[k]||'');
    formdata.append(rollField, roll);
    formdata.append(dobField, dob);
    const postHtml = await fetchText(action, {
      method: 'POST',
      headers: { "User-Agent": "UniResultChecker/1.0" },
      body: formdata
    });
    const parsed = parseResultHtml(postHtml);
    const keys = Object.keys(parsed.parsed || {});
    if (keys.length === 0) {
      const lower = postHtml.toLowerCase();
      if (lower.includes('no record') || lower.includes('not found') || lower.includes('invalid')) {
        return res.status(404).json({ ok:false, error: "No result found (server returned page)", debugSnippet: parsed.snippet });
      }
      return res.status(200).json({ ok:false, notice:"Could not confidently parse fields", snippet: parsed.snippet, rawPreview: postHtml.substring(0,3000) });
    }
    res.status(200).json({ ok:true, data: parsed.parsed });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.toString() });
  }
    }
