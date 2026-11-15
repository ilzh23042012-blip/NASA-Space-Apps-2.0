/* Builds one self-contained HTML file of the whole game, for sharing or submitting.
   Usage:  node tools/build-single.js   ->  share/the-last-transmission.html

   The three pages (index, story, repair) and the shared scripts are packed into a single file.
   A small loader shows the right page from "?page=story&mission=a15" etc., and links between
   pages are rewritten to that form, so the game also works when opened straight from disk.
   three.js, GSAP, p5.js and MediaPipe still load from their CDNs (internet needed).
   Recorded voice files in audio/vo/ are not packed; without them the browser's speech voice is used. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function pack(page) {
  let s = read(page + '.html');
  // inline the shared scripts
  s = s.replace(/<script src="(shared\/[a-z]+\.js)"><\/script>/g, (_, f) => '<script>\n' + read(f) + '\n</script>');
  // links between pages: "story.html?mission=x" -> "?page=story&mission=x", "index.html" -> "?page=index"
  s = s.replace(/\b(index|story|repair)\.html(\?)?/g, (_, p, q) => '?page=' + p + (q ? '&' : ''));
  return s;
}

const pages = {};
for (const p of ['index', 'story', 'repair']) pages[p] = pack(p);
// safe inside a <script>: no "</script" or "<!--" can appear in the JSON
const json = JSON.stringify(pages).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');

const out = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Last Transmission · Project RECLAIM</title>
<style>html,body{margin:0;height:100%;background:#03060c;color:#9fb4d0;font:14px system-ui,sans-serif}body{display:grid;place-items:center}</style>
</head><body>Loading…
<script>
/* Project RECLAIM: the whole game in one file (built by tools/build-single.js). */
var PAGES = ${json};
setTimeout(function () {
  var page = new URLSearchParams(location.search).get('page');
  var html = PAGES[page] || PAGES.index;
  document.open(); document.write(html); document.close();
}, 0);
</script>
</body></html>
`;
fs.mkdirSync(path.join(ROOT, 'share'), { recursive: true });
const F = path.join(ROOT, 'share', 'the-last-transmission.html');
fs.writeFileSync(F, out);
console.log('wrote', path.relative(ROOT, F), (out.length / 1024).toFixed(0) + ' KB');
