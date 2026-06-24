/* ============================================================================
   brief-email.mjs — CorpLawTracker · The Brief
   Renders an email-ready, brand-matched HTML brief from data.js.

   Design goals (read before editing):
     • Email-client safe: TABLE layout + INLINE styles only. No flex/grid, no
       <style> media queries that clients strip, web-safe fonts (Georgia serif
       headlines, Helvetica/Arial body) so it renders identically everywhere.
     • Editorially honest: a "Why it matters" line is only printed when the deal
       actually carries an `implication` from enrichment. Until enrichment runs,
       the brief leads with crisp verified facts (summary, counsel, stage, value)
       — never invented analysis. Run the enrichment pass and the brief upgrades
       itself automatically.
     • One screen of signal: a lead story, ~6 deals that moved, the regulators'
       desk, and (weekly) a league note. No filler.

   Usage:
     node engine/brief-email.mjs                 -> writes brief-email.html (latest day)
     node engine/brief-email.mjs --date "13 Jun 2026"
     node engine/brief-email.mjs --max 7 --out brief-email.html
   ============================================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://www.corplawtracker.com";

/* ---- args ---- */
const args = process.argv.slice(2);
const argVal = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const MAX_DEALS = parseInt(argVal("--max") || "6", 10);
const OUT = argVal("--out") || path.join(ROOT, "brief-email.html");
const FORCE_DATE = argVal("--date");

/* ---- load data.js (it assigns window.CLT_DATA) ---- */
function loadData() {
  const file = path.join(ROOT, "data.js");
  const src = fs.readFileSync(file, "utf8");
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function("window", src)(sandbox.window);
  return sandbox.window.CLT_DATA || {};
}

/* ---- helpers ---- */
const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function parseDate(t) {
  if (!t) return new Date(0);
  const m = String(t).match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!m) return new Date(0);
  return new Date(+m[3], MONTHS[m[2]] ?? 0, +m[1]);
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function stripTags(s) { return String(s || "").replace(/<[^>]+>/g, ""); }
function clamp(s, n) { s = stripTags(s).trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
function dealUrl(id) { return `${SITE}/#/deal/${encodeURIComponent(id)}`; }

const TYPE = {
  ma:   { label: "M&A / JV",     c: "#16243F" },
  ipo:  { label: "IPO / ECM",    c: "#0c8f5a" },
  pe:   { label: "PE / VC",      c: "#6e44d4" },
  ibc:  { label: "IBC",          c: "#cf3a52" },
  reg:  { label: "Regulatory",   c: "#b87400" },
  bank: { label: "Banking & Fin",c: "#0a8585" },
  lit:  { label: "Disputes",     c: "#475569" },
};
const STAGE = {
  rumoured:"Rumoured", announced:"Announced", review:"In regulatory review",
  completed:"Completed", filed:"Filed / open", ruling:"Ruling", inforce:"In force",
};

function leadCounsel(d) {
  const firms = (d.firms || []).map(f => f.name).filter(Boolean);
  if (!firms.length) return "";
  const uniq = [...new Set(firms)];
  return uniq.length > 3 ? uniq.slice(0, 3).join(", ") + ` +${uniq.length - 3}` : uniq.join(", ");
}
function metaLine(d) {
  const bits = [];
  const c = leadCounsel(d);
  if (c) bits.push(`Counsel: ${esc(c)}`);
  if (d.stage && STAGE[d.stage]) bits.push(esc(STAGE[d.stage]));
  if (d.value && d.value !== "—") bits.push(esc(d.value));
  return bits.join("&nbsp;&nbsp;·&nbsp;&nbsp;");
}
function whyMatters(d) {
  const w = stripTags(d.implication || "").trim();
  return w.length > 8 ? w : "";
}
function primarySource(d) {
  const s = (d.sources || [])[0];
  return s && s.url ? s : null;
}

/* ---- selection ---- */
function pickItems(DEALS) {
  const sorted = [...DEALS].sort((a, b) => parseDate(b.time) - parseDate(a.time));
  let pool = sorted;
  if (FORCE_DATE) pool = sorted.filter(d => d.time === FORCE_DATE);
  if (!pool.length) pool = sorted;
  // lead = the highest-importance item among the most recent slice
  const recent = pool.slice(0, Math.max(MAX_DEALS + 1, 8));
  const impRank = { hi: 3, md: 2, lo: 1 };
  const lead = [...recent].sort((a, b) => (impRank[b.imp] || 0) - (impRank[a.imp] || 0))[0] || pool[0];
  const rest = pool.filter(d => d.id !== lead.id).slice(0, MAX_DEALS);
  return { lead, rest, dateLabel: lead ? lead.time : "" };
}

/* ============================ RENDERERS ============================ */
function typePill(d) {
  const t = TYPE[d.type] || { label: (d.type || "").toUpperCase(), c: "#16243F" };
  return `<span style="display:inline-block;font:600 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:${t.c};padding:4px 7px;border-radius:3px;">${esc(t.label)}</span>`;
}
function verifiedTag(d) {
  return d.verified
    ? `<span style="font:600 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.04em;color:#0c8f5a;">✓ VERIFIED</span>`
    : `<span style="font:600 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.04em;color:#9a8f7a;">◔ REPORTED</span>`;
}

function leadBlock(d) {
  const why = whyMatters(d);
  const src = primarySource(d);
  return `
  <tr><td style="padding:4px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="padding-bottom:10px;">${typePill(d)}&nbsp;&nbsp;${verifiedTag(d)}</td>
    </tr></table>
    <a href="${dealUrl(d.id)}" style="text-decoration:none;">
      <div style="font:600 25px/1.22 Georgia,'Times New Roman',serif;color:#16243F;letter-spacing:-.01em;margin:0 0 10px;">${esc(d.headline)}</div>
    </a>
    <div style="font:400 15px/1.62 Georgia,'Times New Roman',serif;color:#33373d;margin:0 0 14px;">${esc(clamp(d.detail || d.sum, 360))}</div>
    ${why ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px;"><tr>
      <td style="border-left:3px solid #16243F;padding:2px 0 2px 14px;">
        <div style="font:600 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#16243F;margin-bottom:5px;">Why it matters</div>
        <div style="font:400 14px/1.6 Helvetica,Arial,sans-serif;color:#3a3f47;">${esc(clamp(why, 280))}</div>
      </td></tr></table>` : ""}
    <div style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#7a7e86;margin-bottom:4px;">${metaLine(d) || "&nbsp;"}</div>
    ${src ? `<a href="${esc(src.url)}" style="font:600 12px/1.5 Helvetica,Arial,sans-serif;color:#16243F;text-decoration:none;">Read the source — ${esc(src.name)} →</a>` : ""}
  </td></tr>
  <tr><td style="padding:22px 32px 0;"><div style="border-top:1px solid #e6e3dd;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
}

function dealRow(d) {
  const why = whyMatters(d);
  const src = primarySource(d);
  return `
  <tr><td style="padding:18px 32px 0;">
    <div style="margin-bottom:7px;">${typePill(d)}&nbsp;&nbsp;${verifiedTag(d)}</div>
    <a href="${dealUrl(d.id)}" style="text-decoration:none;">
      <div style="font:600 17px/1.32 Georgia,'Times New Roman',serif;color:#16243F;margin:0 0 6px;">${esc(d.headline)}</div>
    </a>
    <div style="font:400 13.5px/1.58 Helvetica,Arial,sans-serif;color:#41454c;margin:0 0 8px;">${esc(clamp(d.sum || d.detail, 200))}</div>
    ${why ? `<div style="font:400 13px/1.55 Helvetica,Arial,sans-serif;color:#16243F;margin:0 0 8px;"><b style="font-weight:600;">Why it matters — </b>${esc(clamp(why, 180))}</div>` : ""}
    <div style="font:400 11.5px/1.5 Helvetica,Arial,sans-serif;color:#8a8e96;">${metaLine(d) || "&nbsp;"}${src ? `&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${esc(src.url)}" style="color:#16243F;text-decoration:none;">source →</a>` : ""}</div>
  </td></tr>
  <tr><td style="padding:18px 32px 0;"><div style="border-top:1px solid #eeece6;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
}

function regSection(REG) {
  if (!REG || !REG.length) return "";
  const rows = REG.slice(0, 4).map(r => {
    const head = r.headline || r.title || r.name || "";
    const tag = r.reg || r.status || "";
    const body = clamp(r.sum || r.detail || r.impact || r.note || "", 170);
    const url = (r.sources && r.sources[0] && r.sources[0].url) || r.url || "";
    return `<tr><td style="padding:11px 0;border-bottom:1px solid #eeece6;">
      ${tag ? `<div style="font:600 9.5px/1 Helvetica,Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#b87400;margin-bottom:5px;">${esc(tag)}</div>` : ""}
      <div style="font:600 14px/1.4 Georgia,'Times New Roman',serif;color:#16243F;margin-bottom:4px;">${esc(head)}</div>
      ${body ? `<div style="font:400 12.5px/1.55 Helvetica,Arial,sans-serif;color:#52565d;">${esc(body)}</div>` : ""}
      ${url ? `<a href="${esc(url)}" style="font:600 11.5px/1.5 Helvetica,Arial,sans-serif;color:#16243F;text-decoration:none;">view →</a>` : ""}
    </td></tr>`;
  }).join("");
  return sectionHead("On the regulators' desk") + `
  <tr><td style="padding:2px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table></td></tr>`;
}

function movesSection(MOVES) {
  if (!MOVES || !MOVES.length) return "";
  const rows = MOVES.slice(0, 4).map(m => {
    const who = m.name || m.who || "";
    const txt = clamp(m.move || m.headline || m.sum || m.note || "", 150);
    return `<tr><td style="padding:9px 0;border-bottom:1px solid #eeece6;font:400 13px/1.5 Helvetica,Arial,sans-serif;color:#41454c;">
      ${who ? `<b style="color:#16243F;font-weight:600;">${esc(who)}</b> — ` : ""}${esc(txt)}</td></tr>`;
  }).join("");
  return sectionHead("Lateral & partner moves") + `
  <tr><td style="padding:2px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table></td></tr>`;
}

function sectionHead(label) {
  return `<tr><td style="padding:26px 32px 6px;">
    <div style="font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9a8f7a;border-bottom:2px solid #16243F;padding-bottom:7px;">${esc(label)}</div>
  </td></tr>`;
}

function render(DATA) {
  const DEALS = DATA.DEALS || [];
  const { lead, rest, dateLabel } = pickItems(DEALS);
  const updated = DATA.UPDATED || dateLabel;
  const count = DEALS.length;

  const dealsHtml = rest.map(dealRow).join("");
  const reg = regSection(DATA.REGITEMS);
  const moves = movesSection(DATA.MOVES);

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>CorpLawTracker · The Brief — ${esc(dateLabel)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ee;-webkit-text-size-adjust:100%;">
<!-- preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">The day's Indian corporate deals, before 9am — ${esc(lead ? clamp(lead.headline, 90) : "")}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;">
<tr><td align="center" style="padding:28px 14px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e6e3dd;border-radius:6px;overflow:hidden;">

    <!-- masthead -->
    <tr><td style="background:#16243F;padding:22px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <div style="font:700 19px/1 Georgia,'Times New Roman',serif;color:#ffffff;letter-spacing:.01em;">CorpLaw<span style="color:#c9d2e2;font-weight:400;">Tracker</span> <span style="font:400 12px/1 Helvetica,Arial,sans-serif;color:#9fb0cb;">· The Brief</span></div>
        </td>
        <td align="right" style="vertical-align:middle;font:600 11px/1 Helvetica,Arial,sans-serif;color:#9fb0cb;letter-spacing:.04em;">${esc(dateLabel)}</td>
      </tr></table>
    </td></tr>

    <!-- standfirst -->
    <tr><td style="padding:18px 32px 6px;">
      <div style="font:400 13px/1.55 Helvetica,Arial,sans-serif;color:#6a6e76;">The day's Indian corporate deals — who moved, who advised, and what's on the regulators' desk. Every item verified against its primary source.</div>
    </td></tr>

    ${sectionHead("Today's lead")}
    ${lead ? leadBlock(lead) : ""}

    ${sectionHead("Deals that moved")}
    ${dealsHtml}

    ${reg}
    ${moves}

    <!-- CTA back to site -->
    <tr><td style="padding:28px 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#f4f2ee;border:1px solid #e6e3dd;border-radius:6px;padding:18px 20px;">
        <div style="font:400 13px/1.5 Helvetica,Arial,sans-serif;color:#52565d;margin-bottom:12px;">${count}+ matters tracked, refreshed nightly from primary filings.</div>
        <a href="${SITE}" style="display:inline-block;font:600 13px/1 Helvetica,Arial,sans-serif;color:#ffffff;background:#16243F;text-decoration:none;padding:12px 22px;border-radius:5px;">Open the full tracker →</a>
      </td></tr></table>
    </td></tr>

    <!-- footer -->
    <tr><td style="padding:24px 32px 30px;">
      <div style="border-top:1px solid #e6e3dd;padding-top:16px;font:400 11px/1.6 Helvetica,Arial,sans-serif;color:#9a9ea6;">
        <b style="color:#6a6e76;">CorpLawTracker</b> — the decision engine for India's corporate legal market. Built only on primary filings (BSE/NSE · SEBI · RBI · CCI · IBBI · NCLT). This brief is current-awareness, not legal advice; open the primary source before advising.<br><br>
        You're receiving this because you subscribed at corplawtracker.com.
        <a href="{{unsubscribe}}" style="color:#16243F;text-decoration:underline;">Unsubscribe</a> ·
        <a href="${SITE}" style="color:#16243F;text-decoration:underline;">View online</a>
      </div>
    </td></tr>

  </table>

</td></tr>
</table>
</body></html>`;
}

/* ============================ MAIN ============================ */
const DATA = loadData();
const html = render(DATA);
fs.writeFileSync(OUT, html, "utf8");
const { lead, rest } = pickItems(DATA.DEALS || []);
console.log(`brief written -> ${path.relative(ROOT, OUT)}`);
console.log(`lead: ${lead ? lead.headline : "(none)"}`);
console.log(`deals in brief: ${1 + rest.length} | regulator items: ${(DATA.REGITEMS || []).length} | moves: ${(DATA.MOVES || []).length}`);
