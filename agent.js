/**
 * EazyDiner Voice Agent — Groq AI + ElevenLabs
 * AI Brain : Groq (free) — llama-3.3-70b-versatile
 * Voice TTS: ElevenLabs API → Browser fallback
 * Voice STT: Web Speech Recognition (Chrome/Edge)
 */

// ─── Card Data ────────────────────────────────────────────────────────────────
const CARDS = {
  signature: {
    id: 'signature',
    name: 'EazyDiner IndusInd Signature Credit Card',
    icon: '💎',
    applyUrl: 'https://www.indusind.com/in/en/personal/cards/credit-card/eazydiner-indusind-bank-credit-card.html',
    fee: '₹1,999 + taxes/year',
    tagline: 'Best for heavy diners, travelers & lifestyle enthusiasts',
    benefits: [
      { icon: '🍽️', title: 'Complimentary Prime (1 Year)',   desc: '₹3,550 value – 25–50% off at 2,000+ premium restaurants' },
      { icon: '💸', title: 'Maximum PayEazy Savings',         desc: 'Extra 25% off up to ₹1,000 per dining transaction' },
      { icon: '⭐', title: 'Premium Reward Points',           desc: '10 pts/₹100 on dining, 4 pts/₹100 on all other spends' },
      { icon: '🎬', title: '2 Free Movies/Month',             desc: 'BookMyShow – up to ₹200 off per ticket' },
      { icon: '✈️', title: 'Airport Lounge Access',           desc: '2 complimentary domestic lounge visits per quarter' },
      { icon: '🍹', title: 'Free Premium Drink',              desc: 'Complimentary premium drink at select partner restaurants' },
      { icon: '🎁', title: 'Welcome Gift',                    desc: '2,000 bonus points + The Postcard Hotel stay voucher' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver',           desc: '1% waiver on ₹500–₹3,000 transactions (max ₹250/cycle)' },
    ],
  },
  platinum: {
    id: 'platinum',
    name: 'EazyDiner IndusInd Platinum Credit Card',
    icon: '⚡',
    applyUrl: 'https://www.indusind.com/in/en/personal/cards/credit-card/eazydiner-indusind-bank-credit-card.html',
    fee: 'Lifetime Free – Zero annual charges',
    tagline: 'Best for casual diners, beginners & cost-conscious users',
    benefits: [
      { icon: '🆓', title: 'Lifetime Free Card',          desc: 'Absolutely zero joining or annual fee – ever' },
      { icon: '🍽️', title: 'Complimentary Prime (3 Months)', desc: '₹1,095 value – 25–50% off at 2,000+ restaurants' },
      { icon: '📱', title: 'PayEazy Discount',            desc: 'Extra 20% off up to ₹500 (3 times/month via app)' },
      { icon: '🔄', title: 'Renewable Prime',             desc: 'Renew for 3 months by spending ₹30,000 per quarter' },
      { icon: '💳', title: 'Earn Reward Points',          desc: '2 pts/₹100 on all eligible spends (except fuel)' },
      { icon: '🎯', title: 'EazyPoints Bonus',            desc: '2X EazyPoints on every EazyDiner app booking' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver',       desc: '1% waiver on ₹400–₹4,000 transactions (max ₹250/cycle)' },
      { icon: '💼', title: 'No Risk Entry',               desc: 'Perfect starter card with full dining benefits, zero commitment' },
    ],
  },
};

// ─── Groq System Prompt ───────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Priya, a warm and friendly sales advisor calling from EazyDiner's card advisory team. You are having a real voice conversation with a customer to help them choose between two EazyDiner credit cards.

THE TWO CARDS:

SIGNATURE CARD (Rs 1,999 per year fee):
- 1 year EazyDiner Prime (25-50% off at 2000+ restaurants, worth Rs 3,550)
- 25% PayEazy extra discount up to Rs 1,000 per transaction
- 10 reward points per Rs 100 on dining, 4 points on others
- 2 free movies per month on BookMyShow
- 2 airport lounge visits per quarter
- Welcome: 2000 bonus points + hotel stay voucher
- Best for: frequent diners, travelers, people spending 20k+ monthly

PLATINUM CARD (LIFETIME FREE - zero fee ever):
- 3 months EazyDiner Prime (25-50% off at 2000+ restaurants)
- 20% PayEazy extra discount up to Rs 500, 3 times/month
- 2 reward points per Rs 100 on all spends
- Best for: casual diners, beginners, people who prefer no fees

YOUR PERSONALITY:
- You are warm, natural, conversational — like a real human on a phone call
- You respond to ANYTHING the customer says — even off-topic questions
- If someone asks "what is 2+2" you answer "Ha, that's 4! But back to helping you find the perfect card..."
- You naturally steer the conversation back to understanding their needs
- You are NOT a robot. You do NOT follow a fixed script.

YOUR GOAL:
- Introduce yourself and the purpose of the call
- Understand the customer through natural conversation (dining habits, spending, lifestyle, fee preference)
- After enough info (usually 4-5 exchanges), recommend one card with clear reasoning
- Encourage them to apply

CRITICAL RULES:
- Keep every response SHORT — maximum 2-3 sentences (this is a VOICE call)
- Ask only ONE question at a time
- Never ask about credit score — customer already has a good one
- When you are ready to make your final recommendation, end your message with [RECOMMEND:signature] or [RECOMMEND:platinum] (do NOT say this out loud, it's a system tag)
- Be spontaneous and human — vary your language, don't repeat same phrases`;

// ─── Groq Config ──────────────────────────────────────────────────────────────
const GROQ = {
  apiKey:  '',
  enabled: false,
  model:   'llama-3.3-70b-versatile',
  history: [],
};

// ─── ElevenLabs Config ────────────────────────────────────────────────────────
const EL = {
  apiKey:       '',
  voiceId:      'EXAVITQu4vr4xnSDxMaL',
  modelId:      'eleven_turbo_v2_5',
  enabled:      false,
  currentAudio: null,
};

// ─── Scripted fallback ────────────────────────────────────────────────────────
const CONVERSATION = [
  { step: 0, agentText: `Hi there! This is Priya calling from EazyDiner's card advisory team. I'd love to help you find the perfect EazyDiner credit card for your lifestyle — it'll just take a couple of minutes. Does that sound good?`, quickReplies: ['Yes, go ahead!', 'Sure!', 'Sounds great'], scoring: null },
  { step: 1, agentText: `Great! How often do you typically dine out — several times a week, a few times a month, or just occasionally?`, quickReplies: ['Several times a week', 'A few times a month', 'Occasionally'], scoring: { 'several times': { signature: 3, platinum: 1 }, 'few times a month': { signature: 1, platinum: 2 }, 'occasionally': { signature: 0, platinum: 3 } } },
  { step: 2, agentText: `Nice! Do you prefer premium fine-dining restaurants, or are you more of a casual dining person?`, quickReplies: ['Premium / fine dining', 'Casual & variety', 'Mix of both'], scoring: { 'premium': { signature: 3, platinum: 0 }, 'fine dining': { signature: 3, platinum: 0 }, 'casual': { signature: 0, platinum: 3 }, 'mix': { signature: 2, platinum: 2 } } },
  { step: 2, agentText: `What's your approximate monthly spend overall — above ₹20,000, between ₹10–20k, or below ₹10,000?`, quickReplies: ['Above ₹20,000/month', '₹10,000–₹20,000', 'Below ₹10,000'], scoring: { 'above': { signature: 3, platinum: 0 }, '20,000': { signature: 2, platinum: 1 }, '10,000': { signature: 1, platinum: 2 }, 'below': { signature: 0, platinum: 3 } } },
  { step: 3, agentText: `Do you travel frequently and value airport lounge access? And do you enjoy free movie tickets?`, quickReplies: ['Yes, I travel + love movies!', 'Travel but no movies', 'Not into either'], scoring: { 'travel': { signature: 3, platinum: 0 }, 'movies': { signature: 2, platinum: 0 }, 'yes': { signature: 3, platinum: 0 }, 'not': { signature: 0, platinum: 3 } } },
  { step: 3, agentText: `Last one — are you okay with a ₹1,999 annual fee if the savings are much higher, or do you prefer a completely free card?`, quickReplies: ['Fine with fee if savings are higher', 'Prefer no annual fee', 'Open to either'], scoring: { 'fine': { signature: 3, platinum: 0 }, 'savings': { signature: 2, platinum: 0 }, 'no annual': { signature: 0, platinum: 3 }, 'prefer no': { signature: 0, platinum: 3 }, 'open': { signature: 1, platinum: 1 } } },
];

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
  conversationIndex: 0,
  scores:       { signature: 0, platinum: 0 },
  answers:      {},
  synth:        window.speechSynthesis,
  recognition:  null,
  isListening:  false,
  isSpeaking:   false,
  manualStop:   false,   // ← FIX: prevents auto-restart when user taps to stop
  voices:       [],
  preferredVoice: null,
  turnCount:    0,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const heroSection   = $('hero-section');
const agentSection  = $('agentSection');
const resultSection = $('resultSection');
const setupModal    = $('setupModal');
const startBtn      = $('startBtn');
const endBtn        = $('endBtn');
const micBtn        = $('micBtn');
const micLabel      = $('micLabel');
const micTip        = $('micTip');
const transcriptBox = $('transcriptBox');
const agentStatus   = $('agentStatus');
const speakingInd   = $('speakingIndicator');
const quickReplies  = $('quickReplies');
const restartBtn    = $('restartBtn');
const elBadge       = $('elBadge');
const elBadgeText   = $('elBadgeText');
const mainHintText  = $('mainHintText');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Badge ────────────────────────────────────────────────────────────────────
function setBadge(text, active) {
  elBadgeText.textContent = text;
  active ? elBadge.classList.remove('inactive') : elBadge.classList.add('inactive');
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function setProgress(n) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < n) s.classList.add('done');
    else if (i === n) s.classList.add('active');
  });
}

// ─── Mic UI ───────────────────────────────────────────────────────────────────
function setMicSpeaking() {
  state.isSpeaking = true;
  micBtn.disabled = true;
  micBtn.className = 'mic-btn speaking';
  micLabel.textContent = 'Agent Speaking';
  speakingInd.className = 'speaking-indicator speaking';
  document.querySelector('.avatar-ring').classList.add('active');
  agentStatus.textContent = 'Speaking…';
}

function setMicIdle() {
  state.isSpeaking = false;
  micBtn.disabled = false;
  micBtn.className = 'mic-btn idle';
  micLabel.textContent = 'Tap to Speak';
  micTip.textContent = '👆 Tap the mic and speak your answer';
  speakingInd.className = 'speaking-indicator';
  document.querySelector('.avatar-ring').classList.remove('active');
  agentStatus.textContent = 'Your turn — tap mic or use buttons below';
}

function setMicListening() {
  micBtn.className = 'mic-btn listening';
  micLabel.textContent = 'Tap to Stop 🟥';
  micTip.textContent = '🟢 Speak now… tap button again to stop';
  speakingInd.className = 'speaking-indicator listening';
  agentStatus.textContent = 'Listening…';
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  agentStatus.innerHTML = 'Generating voice<span class="el-loading-dots"><span class="el-loading-dot"></span><span class="el-loading-dot"></span><span class="el-loading-dot"></span></span>';
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      { method: 'POST',
        headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: EL.modelId,
          voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }) }
    );
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail?.message || `HTTP ${res.status}`); }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    EL.currentAudio = audio;
    await new Promise((resolve, reject) => {
      audio.onplay  = () => agentStatus.textContent = 'Speaking…';
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  } catch(err) {
    console.error('EL error:', err);
    await browserSpeak(text);
  } finally {
    EL.currentAudio = null;
  }
}

// ─── Browser TTS ──────────────────────────────────────────────────────────────
function loadVoices() {
  state.voices = state.synth.getVoices();
  const checks = [
    v => v.name.toLowerCase().includes('india') && v.name.toLowerCase().includes('female'),
    v => v.name.toLowerCase().includes('veena'),
    v => v.name.toLowerCase().includes('samantha'),
    v => v.name.toLowerCase().includes('karen'),
    v => v.lang === 'en-IN',
    v => v.lang.startsWith('en'),
  ];
  for (const c of checks) { const f = state.voices.find(c); if (f) { state.preferredVoice = f; break; } }
}
state.synth.addEventListener('voiceschanged', loadVoices);
loadVoices();

function browserSpeak(text) {
  return new Promise(resolve => {
    state.synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice  = state.preferredVoice;
    u.rate   = 0.9; u.pitch = 1.05; u.volume = 1; u.lang = 'en-IN';
    const t  = setTimeout(resolve, 30000);
    const done = () => { clearTimeout(t); resolve(); };
    u.onend = done; u.onerror = () => done();
    state.synth.speak(u);
  });
}

// ─── Unified speak ────────────────────────────────────────────────────────────
async function speak(text) {
  setMicSpeaking();
  try {
    if (EL.enabled && EL.apiKey) await elevenLabsSpeak(text);
    else await browserSpeak(text);
  } finally {
    setMicIdle();
  }
}

// ─── Groq AI ──────────────────────────────────────────────────────────────────
async function groqChat(userMessage) {
  if (userMessage) GROQ.history.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ.model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...GROQ.history],
      max_tokens: 180,
      temperature: 0.85,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response');
  GROQ.history.push({ role: 'assistant', content: text });
  return text;
}

function extractRecommendation(text) {
  const m = text.match(/\[RECOMMEND:(signature|platinum)\]/i);
  return m ? m[1].toLowerCase() : null;
}

function cleanForSpeech(text) {
  return text.replace(/\[RECOMMEND:(signature|platinum)\]/gi, '').trim();
}

// ─── Speech Recognition — FIXED STOP ─────────────────────────────────────────
function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micTip.textContent = '⚠️ Voice not supported — use the buttons below'; return; }

  const rec = new SR();
  rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;

  let gotResult = false;
  state.isListening = true;
  state.manualStop  = false;   // reset manual stop flag
  setMicListening();

  rec.onresult = e => {
    gotResult = true;
    const text = e.results[0][0].transcript.trim();
    if (text) handleUserInput(text);
  };

  rec.onerror = e => {
    state.isListening = false;
    state.recognition = null;
    if (e.error === 'not-allowed') {
      setMicIdle();
      micTip.textContent = '🔴 Mic blocked. Click the 🔴 icon in Chrome address bar → Allow mic.';
      return;
    }
    // For no-speech / audio-capture → restart ONLY if not manually stopped
    if (!state.manualStop && !state.isSpeaking) setTimeout(() => startListening(), 150);
    else setMicIdle();
  };

  rec.onend = () => {
    state.isListening = false;
    state.recognition = null;
    if (gotResult)         return;   // user spoke — handleUserInput takes over
    if (state.isSpeaking)  return;   // agent speaking — don't restart
    if (state.manualStop) { setMicIdle(); return; }  // ← user pressed stop button
    // Chrome ended without speech — restart silently (keep button green)
    setTimeout(() => startListening(), 150);
  };

  state.recognition = rec;
  try { rec.start(); }
  catch(e) { state.isListening = false; setMicIdle(); micTip.textContent = 'Could not start mic. Use buttons below.'; }
}

function stopListening() {
  state.manualStop = true;   // ← tell onend NOT to restart
  if (state.recognition) {
    try { state.recognition.stop(); } catch(_) {}
    state.recognition = null;
  }
  state.isListening = false;
  setMicIdle();
}

// ─── Transcript ───────────────────────────────────────────────────────────────
function addMessage(role, text) {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const wrap   = document.createElement('div');
  wrap.className = `msg ${role}`;
  const av     = document.createElement('div');
  av.className = 'msg-avatar';
  av.textContent = role === 'agent' ? '👩‍💼' : '👤';
  const bub    = document.createElement('div');
  bub.className = 'msg-bubble';
  bub.textContent = text;
  wrap.append(av, bub);
  transcriptBox.append(wrap);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

function showTyping() {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const el = document.createElement('div');
  el.className = 'msg agent'; el.id = 'typingIndicator';
  el.innerHTML = `<div class="msg-avatar">👩‍💼</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  transcriptBox.append(el);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}
function hideTyping() { $('typingIndicator')?.remove(); }

function setQuickReplies(options = []) {
  quickReplies.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'quick-reply-chip'; chip.textContent = opt;
    chip.onclick = () => { if (!state.isSpeaking) handleUserInput(opt); };
    quickReplies.append(chip);
  });
}

// ─── Scripted fallback scoring ────────────────────────────────────────────────
function scoreText(text, map) {
  const lower = text.toLowerCase();
  for (const [kw, pts] of Object.entries(map || {})) {
    if (lower.includes(kw)) {
      state.scores.signature += pts.signature || 0;
      state.scores.platinum  += pts.platinum  || 0;
      return;
    }
  }
}

// ─── Agent speak helper ───────────────────────────────────────────────────────
async function agentSay(text) {
  showTyping();
  await sleep(350);
  hideTyping();
  addMessage('agent', text);
  await speak(text);
}

// ─── Main input handler ───────────────────────────────────────────────────────
async function handleUserInput(text) {
  if (state.isSpeaking) return;
  stopListening();
  quickReplies.innerHTML = '';
  addMessage('user', text);

  if (GROQ.enabled) {
    // ══ GROQ AI MODE — real conversation ══════════════════════════════════════
    agentStatus.textContent = 'Thinking…';
    showTyping();
    try {
      const response       = await groqChat(text);
      hideTyping();
      const recommendation = extractRecommendation(response);
      const clean          = cleanForSpeech(response);
      state.turnCount++;
      setProgress(Math.min(state.turnCount, 4));
      await agentSay(clean);
      if (recommendation) { await sleep(600); showResult(recommendation, clean); }
      else startListening();
    } catch(err) {
      hideTyping();
      console.error('Groq error:', err);
      const sorry = 'Sorry, I had a small issue! Could you repeat that?';
      addMessage('agent', sorry);
      await speak(sorry);
      startListening();
    }
  } else {
    // ══ SCRIPTED MODE ═════════════════════════════════════════════════════════
    const turn = CONVERSATION[state.conversationIndex];
    scoreText(text, turn?.scoring);
    state.conversationIndex++;
    if (state.conversationIndex >= CONVERSATION.length) {
      const winner  = state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum';
      const speech  = winner === 'signature'
        ? `Based on your answers, I highly recommend the EazyDiner Signature Card! With your dining habits and lifestyle, the premium benefits — free movies, airport lounges, and ten times reward points — will easily outweigh the small annual fee. Would you like to apply today?`
        : `The EazyDiner Platinum Card is the perfect match for you! You get all the core dining benefits with absolutely zero annual fee. It's a fantastic way to enjoy dining rewards with no commitment. Ready to apply?`;
      await agentSay(speech);
      await sleep(600);
      showResult(winner, speech);
    } else {
      const next = CONVERSATION[state.conversationIndex];
      setProgress(next.step);
      await agentSay(next.agentText);
      setQuickReplies(next.quickReplies || []);
      startListening();
    }
  }
}

// ─── Start conversation ───────────────────────────────────────────────────────
async function startConversation() {
  agentStatus.textContent = 'Connecting…';
  await sleep(400);

  if (GROQ.enabled) {
    agentStatus.textContent = 'Starting AI…';
    showTyping();
    try {
      const intro = await groqChat('');
      hideTyping();
      state.turnCount = 0;
      setProgress(0);
      await agentSay(cleanForSpeech(intro));
      startListening();
    } catch(err) {
      hideTyping();
      console.error('Groq start error:', err);
      GROQ.enabled = false;
      await scriptedStart();
    }
  } else {
    await scriptedStart();
  }
}

async function scriptedStart() {
  const first = CONVERSATION[0];
  setProgress(first.step);
  await agentSay(first.agentText);
  setQuickReplies(first.quickReplies || []);
  startListening();
}

// ─── Show Result ──────────────────────────────────────────────────────────────
function showResult(winner, reasoning = '') {
  agentSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  const card = CARDS[winner];
  const pct  = 70 + Math.floor(Math.random() * 25);

  $('resultIcon').textContent = card.icon;
  $('resultName').textContent = card.name;
  $('resultName').className   = `result-name ${winner}`;
  $('resultWhy').textContent  = cleanForSpeech(reasoning) || `Based on your conversation, the ${card.name} is your best match.`;
  $('applyBtn').href          = card.applyUrl;
  $('applyBtn').className     = winner === 'platinum' ? 'apply-btn purple' : 'apply-btn';
  $('scoreValue').textContent = `${pct}% match`;
  $('scoreValue').className   = winner === 'platinum' ? 'score-value purple' : 'score-value';
  $('scoreBar').className     = winner === 'platinum' ? 'score-bar purple' : 'score-bar';
  setTimeout(() => { $('scoreBar').style.width = `${pct}%`; }, 100);

  const benefitsEl = $('resultBenefits');
  benefitsEl.innerHTML = '';
  card.benefits.forEach(b => {
    const el = document.createElement('div');
    el.className = 'benefit-item';
    el.innerHTML = `<div class="benefit-icon">${b.icon}</div><div class="benefit-text"><strong>${b.title}</strong>${b.desc}</div>`;
    benefitsEl.append(el);
  });
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Modal — Tab switching ────────────────────────────────────────────────────
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    $(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

document.querySelectorAll('.voice-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type=radio]').checked = true;
    EL.voiceId = opt.dataset.voice;
  });
});

$('toggleVis').addEventListener('click', () => { const i=$('apiKeyInput'); i.type=i.type==='password'?'text':'password'; });
$('toggleGroqVis').addEventListener('click', () => { const i=$('groqKeyInput'); i.type=i.type==='password'?'text':'password'; });

// ─── Save & Start ─────────────────────────────────────────────────────────────
$('saveApiKey').addEventListener('click', async () => {
  const groqKey = $('groqKeyInput').value.trim();
  const elKey   = $('apiKeyInput').value.trim();
  const btn     = $('saveApiKey');
  btn.disabled  = true;

  // Test Groq key
  if (groqKey) {
    showApiResult('groqTestResult', 'loading', '🔄 Testing Groq AI key…');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Say hi in 3 words.' }], max_tokens: 10 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      GROQ.apiKey = groqKey; GROQ.enabled = true;
      sessionStorage.setItem('groq_api_key', groqKey);
      showApiResult('groqTestResult', 'success', '✅ Groq AI connected! Priya will now respond naturally to anything.');
    } catch(err) {
      showApiResult('groqTestResult', 'error', `❌ ${err.message}`);
      btn.disabled = false; return;
    }
  }

  // Test ElevenLabs key
  if (elKey) {
    EL.modelId = $('modelSelect').value;
    const sv = document.querySelector('.voice-option.selected');
    if (sv) EL.voiceId = sv.dataset.voice;
    showApiResult('apiTestResult', 'loading', '🔄 Testing ElevenLabs key…');
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello!', model_id: EL.modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail?.message||`Status ${res.status}`); }
      EL.apiKey = elKey; EL.enabled = true;
      sessionStorage.setItem('el_api_key', elKey);
      showApiResult('apiTestResult', 'success', '✅ ElevenLabs voice connected!');
    } catch(err) {
      showApiResult('apiTestResult', 'error', `❌ ${err.message}`);
      btn.disabled = false; return;
    }
  }

  // Update badge
  if (GROQ.enabled && EL.enabled)  setBadge('Groq AI + ElevenLabs ✓', true);
  else if (GROQ.enabled)            setBadge('Groq AI ✓', true);
  else if (EL.enabled)              setBadge('ElevenLabs ✓', true);
  else                              setBadge('Browser Voice', false);

  mainHintText.textContent = GROQ.enabled
    ? '🧠 AI-powered by Groq · Priya responds to anything you say'
    : '🔊 Browser voice · Scripted conversation mode';

  btn.disabled = false;
  await sleep(1200);
  setupModal.classList.add('hidden');
});

$('skipApiKey').addEventListener('click', () => {
  GROQ.enabled = false; EL.enabled = false;
  setBadge('Browser Voice', false);
  mainHintText.textContent = 'Using browser voice · Scripted mode';
  setupModal.classList.add('hidden');
});

$('settingsBtn').addEventListener('click', () => {
  const sg = sessionStorage.getItem('groq_api_key');
  const se = sessionStorage.getItem('el_api_key');
  if (sg) $('groqKeyInput').value = sg;
  if (se) $('apiKeyInput').value  = se;
  $('groqTestResult').classList.add('hidden');
  $('apiTestResult').classList.add('hidden');
  setupModal.classList.remove('hidden');
});

function showApiResult(id, type, msg) {
  const el = $(id);
  el.textContent = msg; el.className = `api-test-result ${type}`; el.classList.remove('hidden');
}

// ─── Main Buttons ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  heroSection.classList.add('hidden');
  agentSection.classList.remove('hidden');
  await startConversation();
});

// MIC BUTTON — tap to speak / tap again to stop
micBtn.addEventListener('click', () => {
  if (state.isSpeaking || micBtn.disabled) return;
  if (state.isListening) {
    stopListening();    // ← tap again = STOP
  } else {
    startListening();   // ← tap once = START
  }
});

endBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening();
  state.isSpeaking = false;
  const winner = GROQ.enabled
    ? (GROQ.history.length > 3 ? 'signature' : 'platinum')
    : (state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum');
  showResult(winner, 'Call ended early. Here is the best match based on your conversation so far.');
});

restartBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening();
  Object.assign(state, { conversationIndex:0, scores:{signature:0,platinum:0}, answers:{}, isSpeaking:false, isListening:false, manualStop:false, turnCount:0 });
  GROQ.history = [];
  micBtn.disabled = false;
  transcriptBox.innerHTML = '<div class="transcript-placeholder">Your conversation will appear here…</div>';
  quickReplies.innerHTML  = '';
  resultSection.classList.add('hidden');
  heroSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Inject disabled-mic style ────────────────────────────────────────────────
const s = document.createElement('style');
s.textContent = `.mic-btn:disabled{opacity:.55;cursor:not-allowed!important;pointer-events:none}`;
document.head.appendChild(s);

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setBadge('Setting up…', false);
  const sg = sessionStorage.getItem('groq_api_key');
  const se = sessionStorage.getItem('el_api_key');
  if (sg) $('groqKeyInput').value = sg;
  if (se) $('apiKeyInput').value  = se;
  setupModal.classList.remove('hidden');
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
