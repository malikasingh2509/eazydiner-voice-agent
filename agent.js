/**
 * EazyDiner Voice Agent
 * AI Brain  : Pollinations AI — FREE, NO API KEY NEEDED
 * Voice TTS  : ElevenLabs (optional) → Browser fallback
 * Voice STT  : Web Speech Recognition (Chrome / Edge)
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
      { icon: '🎬', title: '2 Free Movies / Month',           desc: 'BookMyShow – up to ₹200 off per ticket' },
      { icon: '✈️', title: 'Airport Lounge Access',           desc: '2 complimentary domestic lounge visits per quarter' },
      { icon: '🍹', title: 'Free Premium Drink',              desc: 'Complimentary drink at select partner restaurants' },
      { icon: '🎁', title: 'Welcome Gift',                    desc: '2,000 bonus points + The Postcard Hotel stay voucher' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver',           desc: '1% waiver on ₹500–₹3,000 transactions' },
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
      { icon: '🆓', title: 'Lifetime Free Card',              desc: 'Absolutely zero joining or annual fee – ever' },
      { icon: '🍽️', title: 'Complimentary Prime (3 Months)', desc: '₹1,095 value – 25–50% off at 2,000+ restaurants' },
      { icon: '📱', title: 'PayEazy Discount',                desc: 'Extra 20% off up to ₹500, 3 times/month via app' },
      { icon: '🔄', title: 'Renewable Prime',                 desc: 'Renew for 3 months by spending ₹30,000 per quarter' },
      { icon: '💳', title: 'Earn Reward Points',              desc: '2 pts/₹100 on all eligible spends (except fuel)' },
      { icon: '🎯', title: 'EazyPoints Bonus',                desc: '2X EazyPoints on every EazyDiner app booking' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver',           desc: '1% waiver on ₹400–₹4,000 transactions' },
      { icon: '💼', title: 'No Risk Entry',                   desc: 'Perfect starter card – full dining benefits, zero commitment' },
    ],
  },
};

// ─── AI System Prompt ─────────────────────────────────────────────────────────
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
- You respond naturally to ANYTHING the customer says, even off-topic questions
- If someone says something unrelated, give a brief friendly reply then steer back to the card topic
- You are NOT a robot. You do NOT follow a fixed script. Be spontaneous.

YOUR GOAL:
- Introduce yourself and purpose of call
- Understand the customer through natural conversation (dining habits, spending, lifestyle, fee preference)
- After 4-5 exchanges, recommend ONE card with clear personal reasoning
- Encourage them to apply

RULES — VERY IMPORTANT:
- Keep EVERY response to 2-3 sentences MAXIMUM (this is a VOICE call)
- Ask only ONE question at a time
- Never ask about credit score — customer already has a good one
- When ready to make your final recommendation, end your message with the marker [RECOMMEND:signature] or [RECOMMEND:platinum] — do NOT say this out loud, it is a system tag only`;

// ─── AI Config (Pollinations — No key needed) ─────────────────────────────────
const AI = {
  history: [],
  enabled: true,   // always on — no key required
};

// ─── ElevenLabs (optional premium voice) ─────────────────────────────────────
const EL = {
  apiKey:       '',
  voiceId:      'EXAVITQu4vr4xnSDxMaL',
  modelId:      'eleven_turbo_v2_5',
  enabled:      false,
  currentAudio: null,
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  synth:          window.speechSynthesis,
  recognition:    null,
  isListening:    false,
  isSpeaking:     false,
  manualStop:     false,
  voices:         [],
  preferredVoice: null,
  turnCount:      0,
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
const textInput     = $('textInput');
const textSendBtn   = $('textSendBtn');

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
  micBtn.disabled  = true;
  if (textInput) textInput.disabled = true;
  micBtn.className = 'mic-btn speaking';
  micLabel.textContent = 'Agent Speaking';
  speakingInd.className = 'speaking-indicator speaking';
  document.querySelector('.avatar-ring').classList.add('active');
  agentStatus.textContent = 'Speaking…';
}

function setMicIdle() {
  state.isSpeaking = false;
  micBtn.disabled  = false;
  if (textInput) textInput.disabled = false;
  micBtn.className = 'mic-btn idle';
  micLabel.textContent = 'Tap to Speak';
  micTip.textContent   = '👆 Tap mic or type your answer below';
  speakingInd.className = 'speaking-indicator';
  document.querySelector('.avatar-ring').classList.remove('active');
  agentStatus.textContent = 'Your turn — speak or type below';
}

function setMicListening() {
  micBtn.className = 'mic-btn listening';
  micLabel.textContent = 'Tap to Stop 🟥';
  micTip.textContent   = '🟢 Listening… speak now or type below';
  speakingInd.className = 'speaking-indicator listening';
  agentStatus.textContent = 'Listening…';
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  agentStatus.textContent = 'Generating voice…';
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      { method: 'POST',
        headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: EL.modelId,
          voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }) }
    );
    if (!res.ok) throw new Error(`EL ${res.status}`);
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
    console.warn('EL error, falling back:', err.message);
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

// ─── Speak (unified) ──────────────────────────────────────────────────────────
async function speak(text) {
  setMicSpeaking();
  try {
    if (EL.enabled && EL.apiKey) await elevenLabsSpeak(text);
    else await browserSpeak(text);
  } finally {
    setMicIdle();
  }
}

// ─── Pollinations AI — No Key Required ───────────────────────────────────────
async function aiChat(userMessage) {
  if (userMessage) AI.history.push({ role: 'user', content: userMessage });

  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...AI.history,
      ],
      model:  'openai',
      seed:   Math.floor(Math.random() * 9999),
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const text = (await res.text()).trim();
  if (!text) throw new Error('Empty AI response');
  AI.history.push({ role: 'assistant', content: text });
  return text;
}

function extractRecommendation(text) {
  const m = text.match(/\[RECOMMEND:(signature|platinum)\]/i);
  return m ? m[1].toLowerCase() : null;
}
function cleanForSpeech(text) {
  return text.replace(/\[RECOMMEND:(signature|platinum)\]/gi, '').trim();
}

// ─── Speech Recognition ───────────────────────────────────────────────────────
function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micTip.textContent = '⚠️ Mic not supported — use the text box below'; return; }

  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;

  let gotResult = false;
  state.isListening = true;
  state.manualStop  = false;
  setMicListening();

  rec.onresult = e => {
    gotResult = true;
    const text = e.results[0][0].transcript.trim();
    if (text) handleUserInput(text);
  };

  rec.onerror = e => {
    state.isListening = false; state.recognition = null;
    if (e.error === 'not-allowed') {
      setMicIdle();
      micTip.textContent = '🔴 Mic blocked — type your answer in the box below';
      return;
    }
    if (!state.manualStop && !state.isSpeaking) setTimeout(() => startListening(), 200);
    else setMicIdle();
  };

  rec.onend = () => {
    state.isListening = false; state.recognition = null;
    if (gotResult || state.isSpeaking) return;
    if (state.manualStop) { setMicIdle(); return; }
    setTimeout(() => startListening(), 200);
  };

  state.recognition = rec;
  try { rec.start(); }
  catch(e) { state.isListening = false; setMicIdle(); }
}

function stopListening() {
  state.manualStop = true;
  if (state.recognition) { try { state.recognition.stop(); } catch(_) {} state.recognition = null; }
  state.isListening = false;
  setMicIdle();
}

// ─── Transcript ───────────────────────────────────────────────────────────────
function addMessage(role, text) {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const av   = document.createElement('div'); av.className = 'msg-avatar';
  av.textContent = role === 'agent' ? '👩‍💼' : '👤';
  const bub  = document.createElement('div'); bub.className = 'msg-bubble';
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

// ─── Handle User Input ────────────────────────────────────────────────────────
async function handleUserInput(text) {
  if (state.isSpeaking) return;
  stopListening();
  quickReplies.innerHTML = '';
  addMessage('user', text);

  agentStatus.textContent = 'Thinking…';
  showTyping();

  try {
    const response       = await aiChat(text);
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
    console.error('AI error:', err);
    const sorry = "I'm having a small connection issue! Could you please repeat that?";
    addMessage('agent', sorry);
    await speak(sorry);
    startListening();
  }
}

// ─── Agent Say ────────────────────────────────────────────────────────────────
async function agentSay(text) {
  showTyping(); await sleep(300); hideTyping();
  addMessage('agent', text);
  await speak(text);
}

// ─── Start Conversation ───────────────────────────────────────────────────────
async function startConversation() {
  agentStatus.textContent = 'Connecting…';
  await sleep(400);
  agentStatus.textContent = 'Priya is preparing…';
  showTyping();
  try {
    const intro = await aiChat('');
    hideTyping();
    state.turnCount = 0; setProgress(0);
    await agentSay(cleanForSpeech(intro));
    startListening();
  } catch(err) {
    hideTyping();
    console.error('Start error:', err);
    const fallback = "Hi there! This is Priya from EazyDiner's card advisory team. I'd love to help you find the perfect credit card. How often do you dine out?";
    await agentSay(fallback);
    startListening();
  }
}

// ─── Show Result ──────────────────────────────────────────────────────────────
function showResult(winner, reasoning = '') {
  agentSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  const card = CARDS[winner];
  const pct  = 72 + Math.floor(Math.random() * 22);

  $('resultIcon').textContent = card.icon;
  $('resultName').textContent = card.name;
  $('resultName').className   = `result-name ${winner}`;
  $('resultWhy').textContent  = cleanForSpeech(reasoning) || `Based on your answers, ${card.name} is your ideal match.`;
  $('applyBtn').href          = card.applyUrl;
  $('applyBtn').className     = winner === 'platinum' ? 'apply-btn purple' : 'apply-btn';
  $('scoreValue').textContent = `${pct}% match`;
  $('scoreValue').className   = winner === 'platinum' ? 'score-value purple' : 'score-value';
  $('scoreBar').className     = winner === 'platinum' ? 'score-bar purple' : 'score-bar';
  setTimeout(() => { $('scoreBar').style.width = `${pct}%`; }, 100);

  const benefitsEl = $('resultBenefits');
  benefitsEl.innerHTML = '';
  card.benefits.forEach(b => {
    const el = document.createElement('div'); el.className = 'benefit-item';
    el.innerHTML = `<div class="benefit-icon">${b.icon}</div><div class="benefit-text"><strong>${b.title}</strong>${b.desc}</div>`;
    benefitsEl.append(el);
  });
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Settings Modal (Voice only now) ─────────────────────────────────────────
$('closeModal').addEventListener('click', () => setupModal.classList.add('hidden'));

document.querySelectorAll('.voice-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type=radio]').checked = true;
    EL.voiceId = opt.dataset.voice;
  });
});

$('toggleVis').addEventListener('click', () => {
  const i = $('apiKeyInput'); i.type = i.type === 'password' ? 'text' : 'password';
});

$('saveApiKey').addEventListener('click', async () => {
  const elKey = $('apiKeyInput').value.trim();
  const btn   = $('saveApiKey');
  if (!elKey) { setupModal.classList.add('hidden'); return; }

  btn.disabled = true;
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
    showApiResult('apiTestResult', 'success', '✅ ElevenLabs connected! Priya now has a human voice.');
    setBadge('AI + ElevenLabs ✓', true);
    await sleep(1500);
  } catch(err) {
    showApiResult('apiTestResult', 'error', `❌ ${err.message}`);
    btn.disabled = false; return;
  }
  btn.disabled = false;
  setupModal.classList.add('hidden');
});

$('skipApiKey').addEventListener('click', () => {
  setupModal.classList.add('hidden');
});

$('settingsBtn').addEventListener('click', () => {
  const se = sessionStorage.getItem('el_api_key');
  if (se) $('apiKeyInput').value = se;
  $('apiTestResult').classList.add('hidden');
  setupModal.classList.remove('hidden');
});

function showApiResult(id, type, msg) {
  const el = $(id);
  el.textContent = msg; el.className = `api-test-result ${type}`; el.classList.remove('hidden');
}

// ─── Text Input ───────────────────────────────────────────────────────────────
function submitText() {
  const text = textInput.value.trim();
  if (!text || state.isSpeaking) return;
  textInput.value = '';
  handleUserInput(text);
}
textSendBtn.addEventListener('click', submitText);
textInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitText(); });

// ─── Mic Button ───────────────────────────────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (state.isSpeaking || micBtn.disabled) return;
  if (state.isListening) stopListening();
  else startListening();
});

// ─── Start / End / Restart ────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  heroSection.classList.add('hidden');
  agentSection.classList.remove('hidden');
  await startConversation();
});

endBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening(); state.isSpeaking = false;
  const winner = AI.history.length > 3
    ? (AI.history.some(m => m.content.toLowerCase().includes('signature')) ? 'signature' : 'platinum')
    : 'signature';
  showResult(winner, 'Call ended early — here is your best match based on the conversation so far.');
});

restartBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening();
  Object.assign(state, { isSpeaking: false, isListening: false, manualStop: false, turnCount: 0 });
  AI.history = [];
  micBtn.disabled = false;
  if (textInput) { textInput.disabled = false; textInput.value = ''; }
  transcriptBox.innerHTML = '<div class="transcript-placeholder">Your conversation will appear here…</div>';
  quickReplies.innerHTML  = '';
  resultSection.classList.add('hidden');
  heroSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = `.mic-btn:disabled{opacity:.5;cursor:not-allowed!important;pointer-events:none}`;
document.head.appendChild(styleEl);

window.addEventListener('DOMContentLoaded', () => {
  // AI is always on — no key needed
  setBadge('AI Ready ✓', true);
  mainHintText.textContent = '🧠 Powered by AI · No setup needed · Just start talking';

  // Restore ElevenLabs key if saved
  const se = sessionStorage.getItem('el_api_key');
  if (se) { $('apiKeyInput').value = se; }

  // Show modal only for optional voice upgrade
  // (skip auto-open — AI works without it)
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
