/* Writes audio/vo/lines.csv (one row per spoken line) from shared/voice.js, ready for VoiceStudio batch narration.
   Run from the project folder:  node tools/export-voice-lines.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), src = fs.readFileSync(path.join(root, 'shared/voice.js'), 'utf8');
const ctx = { window: {}, localStorage: { getItem: () => null }, fetch: () => Promise.reject(new Error('no fetch')), console };
vm.createContext(ctx); vm.runInContext(src + '\nthis.VO_LINES = VO_LINES; this.VO_SPEAKERS = VO_SPEAKERS;', ctx);
const voice = { control: 'Mission Control 2075 (calm, clear, female)', narrator: 'Narrator (warm documentary, male)', capcom: 'Houston CAPCOM 1972 (crisp, male, radio)', ana: 'Dr Ana Ruiz (relieved, female)' };
const q = s => '"' + String(s).replace(/"/g, '""') + '"';
const rows = [['file', 'speaker', 'voice', 'text'].join(',')].concat(Object.entries(ctx.VO_LINES).map(([id, [who, text]]) => [q(id + '.mp3'), q(who), q(voice[who] || who), q(text)].join(',')));
fs.mkdirSync(path.join(root, 'audio/vo'), { recursive: true });
fs.writeFileSync(path.join(root, 'audio/vo/lines.csv'), rows.join('\n') + '\n');
console.log('Wrote ' + (rows.length - 1) + ' lines to audio/vo/lines.csv');
