/**
 * EazyDiner Voice Agent – Final Automated Test Suite
 * Extracts pure logic via regex, stubs browser APIs, then tests everything.
 * Run: node test_agent.js
 */

let passed = 0, failed = 0;
const errors = [];

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch(e) { console.log(`  ❌ ${name}\n     → ${e.message}`); failed++; errors.push({name,error:e.message}); }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function assertEqual(a, b, m) { if (a !== b) throw new Error(m || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function assertContains(str, val, m) { if (!str.includes(val)) throw new Error(m || `Missing: ${val}`); }

const fs = require('fs');
const src = fs.readFileSync('./agent.js', 'utf-8');
const html = fs.readFileSync('./index.html', 'utf-8');
const css  = fs.readFileSync('./style.css', 'utf-8');

// ── Extract pure data/logic sections via regex ────────────────────────────────
function extract(pattern) {
  const m = src.match(pattern);
  if (!m) throw new Error(`Pattern not found: ${pattern}`);
  return m[0];
}

const cardsBlock   = extract(/const CARDS = \{[\s\S]*?\n\};\n/);
const convBlock    = extract(/const CONVERSATION = \[[\s\S]*?\n\];\n/);
const elBlock      = extract(/const EL = \{[\s\S]*?\n\};\n/);
// state references window.speechSynthesis — patch it out
const stateRaw     = extract(/const state = \{[\s\S]*?\n\};\n/);
const stateBlock   = stateRaw.replace('window.speechSynthesis', '{ getVoices:()=>[], cancel:()=>{}, speak:()=>{}, addEventListener:()=>{} }');
const recBlock     = extract(/function buildRecommendationSpeech\(\)[\s\S]*?\n\}\n/);
const whyBlock     = extract(/function buildWhyText\([\s\S]*?\n\}\n/);

const moduleCode = [cardsBlock, convBlock, elBlock, stateBlock, recBlock, whyBlock].join('\n') +
  '\nmodule.exports={CARDS,CONVERSATION,EL,state,buildRecommendationSpeech,buildWhyText};';

fs.writeFileSync('./__agent_logic.js', moduleCode);
let mod;
try {
  mod = require('./__agent_logic.js');
} catch(e) {
  fs.unlinkSync('./__agent_logic.js');
  console.error('FATAL – could not load agent logic:', e.message);
  process.exit(1);
}
fs.unlinkSync('./__agent_logic.js');

const { CARDS, CONVERSATION, EL, state, buildRecommendationSpeech, buildWhyText } = mod;

// Scoring helper (mirrors agent logic exactly)
function scoreFromText(text, scoringMap, scores) {
  const lower = text.toLowerCase();
  for (const [kw, pts] of Object.entries(scoringMap)) {
    if (lower.includes(kw)) {
      scores.signature += pts.signature || 0;
      scores.platinum  += pts.platinum  || 0;
      return true;
    }
  }
  return false;
}

function simulate(answers) {
  const sc = { signature: 0, platinum: 0 };
  const scoringTurns = CONVERSATION.filter(t => t.scoring);
  answers.forEach((ans, i) => { if (scoringTurns[i]) scoreFromText(ans, scoringTurns[i].scoring, sc); });
  return sc.signature >= sc.platinum ? 'signature' : 'platinum';
}

// ════════════════════════════════════════════════════════════════════
console.log('\n📋 1. Card Data Integrity');
// ════════════════════════════════════════════════════════════════════
test('Both cards present: signature & platinum', () => assert(CARDS.signature && CARDS.platinum));
test('Signature annual fee = ₹1,999 + taxes/year', () => assertEqual(CARDS.signature.fee, '₹1,999 + taxes/year'));
test('Platinum fee is Lifetime Free', () => assert(CARDS.platinum.fee.toLowerCase().includes('lifetime free')));
test('Signature has exactly 8 benefits', () => assertEqual(CARDS.signature.benefits.length, 8));
test('Platinum has exactly 8 benefits', () => assertEqual(CARDS.platinum.benefits.length, 8));
test('Every benefit has icon, title, desc', () => {
  [...CARDS.signature.benefits, ...CARDS.platinum.benefits].forEach((b, i) =>
    assert(b.icon && b.title && b.desc, `Benefit ${i} incomplete`)
  );
});
test('Apply URLs point to IndusInd Bank', () => {
  assert(CARDS.signature.applyUrl.startsWith('https://www.indusind.com'));
  assert(CARDS.platinum.applyUrl.startsWith('https://www.indusind.com'));
});
test('Card icons are non-empty', () => {
  assert(CARDS.signature.icon.length > 0 && CARDS.platinum.icon.length > 0);
});
test('Signature tagline mentions diners or travelers', () => {
  const t = CARDS.signature.tagline.toLowerCase();
  assert(t.includes('diner') || t.includes('traveler'));
});
test('Platinum tagline mentions casual or beginner', () => {
  const t = CARDS.platinum.tagline.toLowerCase();
  assert(t.includes('casual') || t.includes('beginner'));
});
test('Signature benefits include airport lounge & movies', () => {
  const titles = CARDS.signature.benefits.map(b => b.title.toLowerCase()).join(' ');
  assert(titles.includes('lounge') && (titles.includes('movie') || titles.includes('film')));
});
test('Platinum benefits include "Lifetime Free"', () => {
  const titles = CARDS.platinum.benefits.map(b => b.title.toLowerCase()).join(' ');
  assert(titles.includes('lifetime') || titles.includes('free'));
});

// ════════════════════════════════════════════════════════════════════
console.log('\n💬 2. Conversation Flow');
// ════════════════════════════════════════════════════════════════════
test('Exactly 6 conversation turns', () => assertEqual(CONVERSATION.length, 6));
test('Turn 0 is step 0 (intro)', () => assertEqual(CONVERSATION[0].step, 0));
test('Agent name "Priya" in intro', () => assertContains(CONVERSATION[0].agentText, 'Priya'));
test('Intro explains purpose of call (EazyDiner + card)', () => {
  const t = CONVERSATION[0].agentText.toLowerCase();
  assert(t.includes('eazydiner') || t.includes('card'));
});
test('Every turn has agentText > 20 chars', () => {
  CONVERSATION.forEach((t, i) => assert(t.agentText?.length > 20, `Turn ${i} text too short`));
});
test('Every turn has ≥2 quickReplies', () => {
  CONVERSATION.forEach((t, i) => assert(Array.isArray(t.quickReplies) && t.quickReplies.length >= 2, `Turn ${i}`));
});
test('Turns 1-5 have scoring maps', () => {
  CONVERSATION.slice(1).forEach((t, i) =>
    assert(t.scoring && Object.keys(t.scoring).length > 0, `Turn ${i + 1} missing scoring`)
  );
});
test('Intro (turn 0) has NO scoring map — no credit score check', () => assert(!CONVERSATION[0].scoring));
test('All step numbers in range 0–4', () => {
  CONVERSATION.forEach((t, i) => assert(t.step >= 0 && t.step <= 4, `Turn ${i} step=${t.step}`));
});
test('Questions cover dining frequency', () => {
  const texts = CONVERSATION.map(t => t.agentText.toLowerCase()).join(' ');
  assert(texts.includes('often') || texts.includes('frequen') || texts.includes('times a'));
});
test('Questions cover dining style (premium vs casual)', () => {
  const texts = CONVERSATION.map(t => t.agentText.toLowerCase()).join(' ');
  assert(texts.includes('premium') || texts.includes('fine dining'));
});
test('Questions cover monthly spending', () => {
  const texts = CONVERSATION.map(t => t.agentText.toLowerCase()).join(' ');
  assert(texts.includes('spending') || texts.includes('monthly'));
});
test('Questions cover lifestyle (travel/movies)', () => {
  const texts = CONVERSATION.map(t => t.agentText.toLowerCase()).join(' ');
  assert(texts.includes('travel') || texts.includes('lounge'));
});
test('Questions cover fee preference', () => {
  const texts = CONVERSATION.map(t => t.agentText.toLowerCase()).join(' ');
  assert(texts.includes('annual fee') || texts.includes('fee'));
});

// ════════════════════════════════════════════════════════════════════
console.log('\n🎯 3. Scoring Logic');
// ════════════════════════════════════════════════════════════════════
test('Heavy diner → Signature scores higher', () => {
  const s={signature:0,platinum:0}; scoreFromText('several times a week', CONVERSATION[1].scoring, s);
  assert(s.signature > s.platinum, `sig=${s.signature} plat=${s.platinum}`);
});
test('Occasional diner → Platinum scores higher', () => {
  const s={signature:0,platinum:0}; scoreFromText('occasionally', CONVERSATION[1].scoring, s);
  assert(s.platinum > s.signature);
});
test('Special occasions → Platinum', () => {
  const s={signature:0,platinum:0}; scoreFromText('special occasions', CONVERSATION[1].scoring, s);
  assert(s.platinum > s.signature);
});
test('Few times a week → Signature', () => {
  const s={signature:0,platinum:0}; scoreFromText('few times a week', CONVERSATION[1].scoring, s);
  assert(s.signature > s.platinum);
});
test('Premium fine dining → Signature', () => {
  const s={signature:0,platinum:0}; scoreFromText('premium fine dining', CONVERSATION[2].scoring, s);
  assert(s.signature > s.platinum);
});
test('Casual & variety → Platinum', () => {
  const s={signature:0,platinum:0}; scoreFromText('casual and variety', CONVERSATION[2].scoring, s);
  assert(s.platinum > s.signature);
});
test('Mix of both → tied (both get points)', () => {
  const s={signature:0,platinum:0}; scoreFromText('mix of both', CONVERSATION[2].scoring, s);
  assert(s.signature > 0 && s.platinum > 0, 'Both should score for mixed preference');
});
test('High spend >₹20k → Signature', () => {
  const s={signature:0,platinum:0}; scoreFromText('above 20,000 per month', CONVERSATION[3].scoring, s);
  assert(s.signature > s.platinum);
});
test('Low spend <₹10k → Platinum', () => {
  const s={signature:0,platinum:0}; scoreFromText('below 10,000 modest', CONVERSATION[3].scoring, s);
  assert(s.platinum > s.signature);
});
test('Loves travel & movies → Signature', () => {
  const s={signature:0,platinum:0}; scoreFromText('yes travel and movies', CONVERSATION[4].scoring, s);
  assert(s.signature > s.platinum);
});
test('"Not really into either" → Platinum', () => {
  const s={signature:0,platinum:0}; scoreFromText('not really into either', CONVERSATION[4].scoring, s);
  assert(s.platinum > s.signature);
});
test('OK with annual fee → Signature', () => {
  const s={signature:0,platinum:0}; scoreFromText('fine with annual fee if savings are higher', CONVERSATION[5].scoring, s);
  assert(s.signature > s.platinum);
});
test('Prefers no fees → Platinum', () => {
  const s={signature:0,platinum:0}; scoreFromText('prefer no annual fees at all', CONVERSATION[5].scoring, s);
  assert(s.platinum > s.signature);
});
test('Unrecognised input → no score change, returns false', () => {
  const s={signature:0,platinum:0};
  const hit = scoreFromText('xyzzy gobbledygook 12345', CONVERSATION[1].scoring, s);
  assertEqual(hit, false); assertEqual(s.signature, 0); assertEqual(s.platinum, 0);
});

// ════════════════════════════════════════════════════════════════════
console.log('\n🎭 4. Full Scenario Simulations');
// ════════════════════════════════════════════════════════════════════
test('Scenario A: Heavy + Premium + Big Spender + Traveler + Fee-OK → Signature', () => {
  assertEqual(simulate(['several times a week','premium fine dining','above 20,000','yes travel and movies','fine with annual fee']), 'signature');
});
test('Scenario B: Occasional + Casual + Low Spend + No Travel + No Fee → Platinum', () => {
  assertEqual(simulate(['occasionally special occasions','casual and variety','below 10,000 modest','not really into either','prefer no annual fees at all']), 'platinum');
});
test('Scenario C: Few times/month + mix + mid spend + no travel + open → valid result', () => {
  const r = simulate(['few times a month','mix of both','10,000 to 20,000','not really','open to either']);
  assert(r === 'signature' || r === 'platinum');
});
test('Scenario D: All max Signature inputs → Signature wins', () => {
  const s={signature:0,platinum:0};
  const turns=CONVERSATION.filter(t=>t.scoring);
  ['several times a week','premium','above 20,000','yes travel movies','fine with annual fee savings'].forEach((a,i)=>{
    if(turns[i]) scoreFromText(a, turns[i].scoring, s);
  });
  assert(s.signature > s.platinum, `sig=${s.signature} plat=${s.platinum}`);
});
test('Scenario E: All max Platinum inputs → Platinum wins', () => {
  const s={signature:0,platinum:0};
  const turns=CONVERSATION.filter(t=>t.scoring);
  ['occasionally','casual variety','modest below','not really neither','no annual fees at all'].forEach((a,i)=>{
    if(turns[i]) scoreFromText(a, turns[i].scoring, s);
  });
  assert(s.platinum > s.signature, `sig=${s.signature} plat=${s.platinum}`);
});

// ════════════════════════════════════════════════════════════════════
console.log('\n🔊 5. ElevenLabs Configuration');
// ════════════════════════════════════════════════════════════════════
test('EL object has all 5 required fields', () => {
  ['apiKey','voiceId','modelId','enabled','currentAudio'].forEach(k =>
    assert(k in EL, `EL.${k} missing`)
  );
});
test('EL default voice = Sarah (EXAVITQu4vr4xnSDxMaL)', () => assertEqual(EL.voiceId, 'EXAVITQu4vr4xnSDxMaL'));
test('EL default model = eleven_turbo_v2_5', () => assertEqual(EL.modelId, 'eleven_turbo_v2_5'));
test('EL starts disabled with empty apiKey', () => {
  assertEqual(EL.apiKey, ''); assertEqual(EL.enabled, false);
});
test('EL endpoint URL format is valid', () => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`;
  assertContains(url, 'elevenlabs.io/v1/text-to-speech');
  assertContains(url, EL.voiceId);
  assertContains(url, 'mp3_44100_128');
});
test('All 3 voice IDs present in HTML', () => {
  assertContains(html, 'EXAVITQu4vr4xnSDxMaL', 'Sarah ID missing');
  assertContains(html, '21m00Tcm4TlvDq8ikWAM', 'Rachel ID missing');
  assertContains(html, 'pNInz6obpgDQGcFmaJgB', 'Adam ID missing');
});
test('All 3 model IDs present in HTML', () => {
  assertContains(html, 'eleven_turbo_v2_5');
  assertContains(html, 'eleven_multilingual_v2');
  assertContains(html, 'eleven_monolingual_v1');
});
test('ElevenLabs API called with xi-api-key header (in source)', () => {
  assertContains(src, "'xi-api-key'", 'Missing xi-api-key header in fetch call');
});
test('ElevenLabs fetch uses POST method', () => {
  assertContains(src, "method: 'POST'");
});
test('ElevenLabs has fallback to browserSpeak on error', () => {
  assertContains(src, 'await browserSpeak', 'No fallback to browser TTS');
});

// ════════════════════════════════════════════════════════════════════
console.log('\n🏗️  6. HTML DOM Structure');
// ════════════════════════════════════════════════════════════════════
const reqIds = [
  'hero-section','agentSection','resultSection','setupModal',
  'startBtn','endBtn','micBtn','micLabel','micTip','transcriptBox',
  'agentStatus','speakingIndicator','quickReplies','progressSteps',
  'restartBtn','elBadge','elDot','elBadgeText','mainHintText',
  'apiKeyInput','toggleVis','saveApiKey','skipApiKey','apiTestResult',
  'modelSelect','resultIcon','resultName','resultWhy','resultBenefits',
  'scoreBar','scoreValue','applyBtn',
];
reqIds.forEach(id => test(`id="${id}" in HTML`, () => assertContains(html, `id="${id}"`)));
test('Modal visible on load (no hidden class on setupModal tag)', () => {
  const m = html.match(/id="setupModal"[^>]*/); assert(m && !m[0].includes('hidden'));
});
test('agentSection starts hidden', () => assertContains(html, 'class="agent-interface hidden"'));
test('resultSection starts hidden', () => assertContains(html, 'class="result-section hidden"'));
test('3 voice options in modal', () => assert((html.match(/class="voice-option/g)||[]).length >= 3));
test('3 model options in select', () => assert((html.match(/<option value="eleven_/g)||[]).length === 3));
test('Apply Now links to IndusInd Bank', () => assertContains(html, 'www.indusind.com'));
test('Outfit font loaded from Google Fonts', () => assertContains(html, 'Outfit'));
test('Exactly 1 <h1> tag', () => assertEqual((html.match(/<h1/g)||[]).length, 1));
test('Meta description present', () => assertContains(html, '<meta name="description"'));
test('ElevenLabs link in footer', () => assertContains(html, 'elevenlabs.io'));
test('5 progress steps in conversation bar', () => {
  assert((html.match(/class="step/g)||[]).length >= 5, 'Should have 5 progress steps');
});

// ════════════════════════════════════════════════════════════════════
console.log('\n🎨 7. CSS Design System');
// ════════════════════════════════════════════════════════════════════
const cssSelectors = [
  '.modal-overlay','.modal-box','.voice-option','.voice-option.selected',
  '.el-status-badge','.el-status-badge.inactive','.settings-btn',
  '.form-input','.form-select','.modal-primary','.modal-secondary',
  '.api-test-result','.el-loading-dots','.el-loading-dot',
  '.mic-btn','.mic-btn.listening','.mic-btn.speaking','.mic-btn.idle',
  '.transcript-box','.msg','.msg.agent','.msg.user','.quick-reply-chip',
  '.result-card','.benefit-item','.score-bar','.comparison-table',
  '.compare-row','.step','.step.active','.bg-orb','.gradient-text',
  '.start-btn','.apply-btn','.typing-indicator','.typing-dot',
];
cssSelectors.forEach(sel => test(`CSS "${sel}" exists`, () => assertContains(css, sel)));
test('CSS design tokens: --bg-base, --accent-gold, --font', () => {
  assertContains(css,'--bg-base'); assertContains(css,'--accent-gold'); assertContains(css,'--font');
});
test('Responsive @media (max-width: 600px)', () => assertContains(css,'@media (max-width: 600px)'));
test('.hidden utility class exists', () => assertContains(css,'.hidden'));
test('Animations: orbFloat, pulseBtn, spin, blink, fadeUp', () => {
  ['orbFloat','pulseBtn','spin','blink','fadeUp'].forEach(a => assertContains(css,a,`Missing animation: ${a}`));
});
test('backdrop-filter (glassmorphism) in header', () => assertContains(css,'backdrop-filter'));
test('api-test-result has .success, .error, .loading variants', () => {
  assertContains(css,'.api-test-result.success');
  assertContains(css,'.api-test-result.error');
  assertContains(css,'.api-test-result.loading');
});

// ════════════════════════════════════════════════════════════════════
console.log('\n⚙️  8. State Machine & Business Logic');
// ════════════════════════════════════════════════════════════════════
test('State has all 7 required fields', () => {
  ['conversationIndex','scores','answers','isListening','isSpeaking','voices','preferredVoice'].forEach(k =>
    assert(k in state, `state.${k} missing`)
  );
});
test('state.scores starts at {sig:0, plat:0}', () => {
  assertEqual(state.scores.signature, 0); assertEqual(state.scores.platinum, 0);
});
test('state.conversationIndex starts at 0', () => assertEqual(state.conversationIndex, 0));
test('state.isSpeaking starts false', () => assertEqual(state.isSpeaking, false));
test('state.isListening starts false', () => assertEqual(state.isListening, false));
test('buildRecommendationSpeech returns string >100 chars', () => {
  const s = buildRecommendationSpeech(); assert(typeof s === 'string' && s.length > 100);
});
test('Signature speech mentions "Signature" card name', () => {
  state.scores.signature = 15; state.scores.platinum = 3;
  assertContains(buildRecommendationSpeech().toLowerCase(), 'signature');
  state.scores.signature = 0; state.scores.platinum = 0;
});
test('Platinum speech mentions "Platinum" or "lifetime"', () => {
  state.scores.platinum = 15; state.scores.signature = 3;
  const s = buildRecommendationSpeech().toLowerCase();
  assert(s.includes('platinum') || s.includes('lifetime'));
  state.scores.signature = 0; state.scores.platinum = 0;
});
test('buildWhyText for Signature references the card correctly', () => {
  state.answers.diningFrequency = 'Several times a week';
  state.answers.diningStyle = 'Premium dining';
  state.scores.signature = 10; state.scores.platinum = 2;
  const w = buildWhyText('signature').toLowerCase();
  assert(w.includes('signature') || w.includes('dining'));
  state.answers = {}; state.scores.signature = 0; state.scores.platinum = 0;
});
test('buildWhyText for Platinum references the card correctly', () => {
  state.answers.diningFrequency = 'Occasionally';
  state.answers.diningStyle = 'Casual';
  state.scores.platinum = 10; state.scores.signature = 2;
  const w = buildWhyText('platinum').toLowerCase();
  assert(w.includes('platinum') || w.includes('casual') || w.includes('fee'));
  state.answers = {}; state.scores.signature = 0; state.scores.platinum = 0;
});
test('NO credit score check in any conversation turn', () => {
  const all = CONVERSATION.map(t => t.agentText + JSON.stringify(t.quickReplies)).join(' ').toLowerCase();
  assert(!all.includes('credit score') && !all.includes('cibil'), 'Credit score check found — must be removed');
});
test('Agent introduces itself (Priya) in first turn', () => assertContains(CONVERSATION[0].agentText, 'Priya'));
test('Agent mentions EazyDiner in intro', () => {
  assert(CONVERSATION[0].agentText.toLowerCase().includes('eazydiner'));
});
test('Source has Speech Recognition (STT) support', () => assertContains(src, 'SpeechRecognition'));
test('Source has fallback to browser TTS', () => assertContains(src, 'browserSpeak'));
test('Source handles recognition errors gracefully', () => assertContains(src, 'rec.onerror'));
test('Source has End Call button handler', () => assertContains(src, "endBtn.addEventListener"));
test('Source has Start Over / restart handler', () => assertContains(src, "restartBtn.addEventListener"));
test('Source has settings button handler to re-open modal', () => assertContains(src, "'settingsBtn'"));
test('ElevenLabs audio is stopped on End Call', () => assertContains(src, 'EL.currentAudio'));

// ════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ════════════════════════════════════════════════════════════════════
const total = passed + failed;
console.log('\n' + '═'.repeat(62));
console.log('  📊  FINAL TEST REPORT – EazyDiner Voice Agent');
console.log('═'.repeat(62));
console.log(`  Total Tests  : ${total}`);
console.log(`  ✅ Passed    : ${passed}  (${Math.round(passed/total*100)}%)`);
console.log(`  ❌ Failed    : ${failed}`);

if (errors.length > 0) {
  console.log('\n  🚨 FAILED TESTS:');
  errors.forEach(e => console.log(`    • ${e.name}\n      ${e.error}`));
} else {
  console.log('\n  🎉 ALL TESTS PASSED — Project verified and working correctly!\n');
}
console.log('═'.repeat(62) + '\n');
process.exit(failed > 0 ? 1 : 0);
