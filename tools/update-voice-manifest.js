/* Lists every audio/vo/*.mp3 in audio/vo/manifest.json so the game plays them.
   Run after adding or removing recordings:  node tools/update-voice-manifest.js */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'audio', 'vo');
const ids = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(ids, null, 1) + '\n');
console.log(ids.length + ' recording(s) listed in audio/vo/manifest.json');
