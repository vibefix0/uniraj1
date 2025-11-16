// api/form.js
import fetch from "node-fetch";
import cheerio from "cheerio";
import Bottleneck from "bottleneck";

const limiter = new Bottleneck({ minTime: 400, maxConcurrent: 2 });

async function fetchUrl(url) {
  return limiter.schedule(() => fetch(url, {
    headers: { "User-Agent": "UniResultChecker/1.0" },
    timeout: 15000
  }).then(r => r.text()));
}

export default async function handler(req, res) {
  try {
    const { rid } = req.query;
    if (!rid) return res.status(400).json({ ok:false, error: "Missing rid" });
    const url = rid.includes('http') ? rid : `https://result.uniraj.ac.in/${rid}`;
    const html = await fetchUrl(url);
    const $ = cheerio.load(html);
    const form = $('form').first();
    if (!form || form.length === 0) return res.status(200).json({ ok:true, debug:true, htmlPreview: html.substring(0,4000) });
    const hidden = {};
    form.find('input[type="hidden"]').each((i, el) => {
      const name = $(el).attr('name'); const val = $(el).attr('value')||'';
      if (name) hidden[name] = val;
    });
    let rollField = null, dobField = null;
    form.find('input').each((i, el) => {
      const name = $(el).attr('name') || '';
      const ph = ($(el).attr('placeholder')||'') + ' ' + ($(el).attr('id')||'');
      const combined = (name + ph).toLowerCase();
      if (!rollField && (combined.includes('roll'))) rollField = name;
      if (!dobField && (combined.includes('dob') || combined.includes('date') || combined.includes('birth'))) dobField = name;
    });
    const inputs = form.find('input').map((i,el)=>({name: $(el).attr('name')||'', type:($(el).attr('type')||'').toLowerCase()})).get();
    if (!rollField && inputs.length>0) rollField = inputs.find(i=>i.type==='text')?.name || inputs[0]?.name;
    if (!dobField && inputs.length>1) dobField = inputs.find(i=>i.type==='date')?.name || inputs[1]?.name;
    res.status(200).json({
      ok:true,
      formAction: form.attr('action') ? new URL(form.attr('action'), url).href : url,
      method: (form.attr('method') || 'GET').toUpperCase(),
      hidden,
      rollField,
      dobField,
      rawTitle: $('title').text().trim()
    });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.toString() });
  }
      }
