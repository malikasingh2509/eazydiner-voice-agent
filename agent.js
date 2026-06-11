/**
 * EazyDiner Voice Agent — AI-Powered
 * AI Brain  : Google Gemini 1.5 Flash (free)
 * Voice TTS  : ElevenLabs API (optional) → Web Speech API (fallback)
 * Voice STT  : Web Speech Recognition (Chrome/Edge)
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
      { icon: '🍽️', title: 'Complimentary Prime (1 Year)', desc: '₹3,550 value – 25–50% off at 2,000+ premium restaurants' },
      { icon: '💸', title: 'Maximum PayEazy Savings', desc: 'Extra 25% off up to ₹1,000 per dining transaction' },
      { icon: '⭐', title: 'Premium Reward Points', desc: '10 pts/₹100 on dining, 4 pts/₹100 on all other spends' },
      { icon: '🎬', title: '2 Free Movies/Month', desc: 'BookMyShow – up to ₹200 off per ticket' },
      { icon: '✈️', title: 'Airport Lounge Access', desc: '2 complimentary domestic lounge visits per quarter' },
      { icon: '🍹', title: 'Free Premium Drink', desc: 'Complimentary premium drink at select partner restaurants' },
      { icon: '🎁', title: 'Welcome Gift', desc: '2,000 bonus points + The Postcard Hotel stay voucher' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver', desc: '1% waiver on ₹500–₹3,000 transactions (max ₹250/cycle)' },
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
      { icon: '🆓', title: 'Lifetime Free Card', desc: 'Absolutely zero joining or annual fee – ever' },
      { icon: '🍽️', title: 'Complimentary Prime (3 Months)', desc: '₹1,095 value – 25–50% off at 2,000+ restaurants' },
      { icon: '📱', title: 'PayEazy Discount', desc: 'Extra 20% off up to ₹500 (3 times/month via app)' },
      { icon: '🔄', title: 'Renewable Prime', desc: 'Renew for 3 months by spending ₹30,000 per quarter' },
      { icon: '💳', title: 'Earn Reward Points', desc: '2 pts/₹100 on all eligible spends (except fuel)' },
      { icon: '🎯', title: 'EazyPoints Bonus', desc: '2X EazyPoints on every EazyDiner app booking' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver', desc: '1% waiver on ₹400–₹4,000 transactions (max ₹250/cycle)' },
      { icon: '💼', title: 'No Risk Entry', desc: 'Perfect starter card with full dining benefits, zero commitment' },
    ],
  },
};

// ─── Gemini System Prompt ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Priya, a warm and professional sales advisor from EazyDiner's card advisory team. You are on a voice call with a potential customer to help them choose the right EazyDiner credit card.

TWO CARDS AVAILABLE:

1. SIGNATURE CARD (Annual fee: Rs 1,999 per year):
   - 1 Year EazyDiner Prime membership (25-50% off at 2000+ restaurants, worth Rs 3,550)
   - 25% extra PayEazy discount up to Rs 1,000 per dining transaction
   - 10 reward points per Rs 100 on dining, 4 points on other spends
   - 2 free movies per month on BookMyShow
   - 2 airport lounge visits per quarter
   - Welcome gift: 2000 bonus points + The Postcard Hotel voucher
   - Best for: frequent diners, travelers, people who spend over Rs 20,000/month

2. PLATINUM CARD (LIFETIME FREE - zero annual fee ever):
   - 3 Months EazyDiner Prime (25-50% off at 2000+ restaurants, worth Rs 1,095)
   - 20% extra PayEazy discount up to Rs 500 (3 times per month)
   - 2 reward points per Rs 100 on all spends
   - Renew Prime every 3 months by spending Rs 30,000
   - Best for: casual diners, beginners, budget-conscious, people who prefer no fees

YOUR GOAL:
- Introduce yourself warmly and explain you're calling about EazyDiner credit cards
- Ask about their dining habits, spending level, lifestyle preferences, and fee tolerance
- Based on their answers, recommend the better card with clear reasoning
- Encourage them to apply

RULES — VERY IMPORTANT:
- Keep every response to 2-3 sentences MAXIMUM (this is a voice call, not a chat)
- Ask only ONE question at a time — never multiple questions at once
- Be warm, natural, and conversational like a real human agent
- Do NOT ask about credit score — the customer already has a good one
- After 4-5 exchanges, make your final recommendation
- When you are ready to give your final recommendation, end your message with the marker [RECOMMEND:signature] or [RECOMMEND:platinum] — this is a system tag, do not say it aloud

CONVERSATION FLOW:
1. Introduce yourself and ask for consent to proceed
2. Ask about dining frequency (how often they eat out)
3. Ask about dining preference (premium vs casual)
4. Ask about monthly spending or lifestyle (travel/movies)
5. Ask about fee preference (ok with annual fee or prefer free card)
6. Make your recommendation with clear reasoning and encourage to apply`;

// ─── Gemini Config ────────────────────────────────────────────────────────────
const GEMINI = {
  apiKey: '',
  enabled: false,
  model: 'gemini-1.5-flash',
  history: [],  // conversation history
};

// ─── ElevenLabs Config ────────────────────────────────────────────────────────
const EL = {
  apiKey: '',
  voiceId: 'EXAVITQu4vr4xnSDxMaL',
  modelId: 'eleven_turbo_v2_5',
  enabled: false,
  currentAudio: null,
};

// ─── Scripted fallback (when Gemini not configured) ───────────────────────────
const CONVERSATION = [
  { step: 0, agentText: `Hi there! This is Priya calling from EazyDiner's card advisory team. I'd love to help you find the perfect EazyDiner credit card for your lifestyle. Can I ask you a few quick questions?`, quickReplies: ['Yes, go ahead!', 'Sure!', 'Sounds great'], inputKey: 'consent', scoring: null },
  { step: 1, agentText: `Great! How often do you dine out at restaurants — several times a week, a few times a month, or just occasionally?`, quickReplies: ['Several times a week', 'A few times a month', 'Occasionally'], inputKey: 'diningFrequency', scoring: { 'several times': { signature: 3, platinum: 1 }, 'few times a week': { signature: 3, platinum: 1 }, 'few times a month': { signature: 1, platinum: 2 }, 'occasionally': { signature: 0, platinum: 3 } } },
  { step: 2, agentText: `Nice! Do you prefer premium or fine dining restaurants, or are you more of a casual dining person?`, quickReplies: ['Premium / fine dining', 'Casual & variety', 'Mix of both'], inputKey: 'diningStyle', scoring: { 'premium': { signature: 3, platinum: 0 }, 'fine dining': { signature: 3, platinum: 0 }, 'casual': { signature: 0, platinum: 3 }, 'mix': { signature: 2, platinum: 2 } } },
  { step: 2, agentText: `And what's your approximate monthly spending overall — above ₹20,000, between ₹10,000–₹20,000, or below ₹10,000?`, quickReplies: ['Above ₹20,000/month', '₹10,000–₹20,000', 'Below ₹10,000'], inputKey: 'spending', scoring: { 'above 20': { signature: 3, platinum: 0 }, '20,000': { signature: 2, platinum: 1 }, '10,000': { signature: 1, platinum: 2 }, 'below': { signature: 0, platinum: 3 } } },
  { step: 3, agentText: `Do you travel frequently and value airport lounge access? And do you enjoy free movie tickets?`, quickReplies: ['Yes, travel + movies!', 'Travel but not movies', 'Not into either'], inputKey: 'lifestyle', scoring: { 'travel': { signature: 3, platinum: 0 }, 'movies': { signature: 2, platinum: 0 }, 'yes': { signature: 3, platinum: 0 }, 'not': { signature: 0, platinum: 3 } } },
  { step: 3, agentText: `Last question — are you okay with a ₹1,999 annual fee if the savings are higher, or do you prefer a completely free card?`, quickReplies: ['Fine with fee if savings are higher', 'Prefer no annual fee', 'Open to either'], inputKey: 'feePreference', scoring: { 'fine with fee': { signature: 3, platinum: 0 }, 'savings': { signature: 2, platinum: 0 }, 'no annual fee': { signature: 0, platinum: 3 }, 'prefer no': { signature: 0, platinum: 3 }, 'open': { signature: 1, platinum: 1 } } },
];

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  conversationIndex: 0,
  scores: { signature: 0, platinum: 0 },
  answers: {},
  synth: window.speechSynthesis,
  recognition: null,
  isListening: false,
  isSpeaking: false,
  voices: [],
  preferredVoice: null,
  turnCount: 0,
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

// ─── Utilities ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Status Badge ─────────────────────────────────────────────────────────────
function setBadge(text, active) {
  elBadgeText.textContent = text;
  active ? elBadge.classList.remove('inactive') : elBadge.classList.add('inactive');
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
function setProgress(stepNum) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < stepNum)       s.classList.add('done');
    else if (i === stepNum) s.classList.add('active');
  });
}

// ─── Mic UI State ─────────────────────────────────────────────────────────────
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
  state.isListening = true;
  micBtn.className = 'mic-btn listening';
  micLabel.textContent = 'Listening…';
  micTip.textContent = '🟢 Speak now, I\'m listening!';
  speakingInd.className = 'speaking-indicator listening';
  agentStatus.textContent = 'Listening to you…';
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  agentStatus.innerHTML = `Generating voice<span class="el-loading-dots"><span class="el-loading-dot"></span><span class="el-loading-dot"></span><span class="el-loading-dot"></span></span>`;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      { method: 'POST', headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: EL.modelId, voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }) }
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
    console.error('ElevenLabs error:', err);
    await browserSpeak(text);
  } finally {
    EL.currentAudio = null;
  }
}

// ─── Browser TTS ──────────────────────────────────────────────────────────────
function loadVoices() {
  state.voices = state.synth.getVoices();
  const preferred = [
    v => v.name.toLowerCase().includes('india') && v.name.toLowerCase().includes('female'),
    v => v.name.toLowerCase().includes('veena'),
    v => v.name.toLowerCase().includes('samantha'),
    v => v.name.toLowerCase().includes('karen'),
    v => v.lang === 'en-IN',
    v => v.lang.startsWith('en'),
  ];
  for (const check of preferred) { const f = state.voices.find(check); if (f) { state.preferredVoice = f; break; } }
}
state.synth.addEventListener('voiceschanged', loadVoices);
loadVoices();

function browserSpeak(text) {
  return new Promise(resolve => {
    state.synth.cancel();
    const utter  = new SpeechSynthesisUtterance(text);
    utter.voice  = state.preferredVoice;
    utter.rate   = 0.9;
    utter.pitch  = 1.05;
    utter.volume = 1;
    utter.lang   = 'en-IN';
    const timer  = setTimeout(resolve, 30000);
    const done   = () => { clearTimeout(timer); resolve(); };
    utter.onend   = done;
    utter.onerror = e => { console.warn('TTS error:', e.error); done(); };
    state.synth.speak(utter);
  });
}

// ─── Unified speak() ──────────────────────────────────────────────────────────
async function speak(text) {
  setMicSpeaking();
  try {
    if (EL.enabled && EL.apiKey) await elevenLabsSpeak(text);
    else await browserSpeak(text);
  } finally {
    setMicIdle();
  }
}

// ─── Gemini AI Brain ──────────────────────────────────────────────────────────
async function geminiChat(userMessage) {
  // Add user message to history
  if (userMessage) {
    GEMINI.history.push({ role: 'user', parts: [{ text: userMessage }] });
  }

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: GEMINI.history,
    generationConfig: { maxOutputTokens: 200, temperature: 0.85, topP: 0.95 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI.model}:generateContent?key=${GEMINI.apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Gemini');

  // Save to history
  GEMINI.history.push({ role: 'model', parts: [{ text }] });
  return text;
}

// Extract recommendation marker from Gemini response
function extractRecommendation(text) {
  const m = text.match(/\[RECOMMEND:(signature|platinum)\]/i);
  return m ? m[1].toLowerCase() : null;
}

// Strip markers and clean up for TTS
function cleanForSpeech(text) {
  return text.replace(/\[RECOMMEND:(signature|platinum)\]/gi, '').trim();
}

// Estimate which step we're on from turn count
function getProgressStep(turnCount) {
  if (turnCount === 0) return 0;
  if (turnCount === 1) return 1;
  if (turnCount === 2) return 2;
  if (turnCount === 3) return 3;
  return 4;
}

// ─── Speech Recognition ───────────────────────────────────────────────────────
function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micTip.textContent = '⚠️ Use the buttons below — voice input not supported in this browser'; return null; }
  const rec = new SR();
  rec.lang = 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  return rec;
}

function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const rec = initRecognition();
  if (!rec) return;

  let gotResult = false;
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
      micTip.textContent = '🔴 Mic access denied. Click 🔴 in Chrome address bar → Allow.';
    } else {
      // For no-speech / audio-capture — restart silently, keep button green
      if (!state.isSpeaking) setTimeout(() => startListening(), 150);
    }
  };

  rec.onend = () => {
    state.isListening = false;
    state.recognition = null;
    if (gotResult || state.isSpeaking) return;
    // No speech yet — restart to keep listening
    setTimeout(() => startListening(), 150);
  };

  state.recognition = rec;
  try { rec.start(); } catch(e) {
    state.isListening = false;
    setMicIdle();
    micTip.textContent = 'Could not start mic. Use the buttons below.';
  }
}

function stopListening() {
  if (state.recognition) { try { state.recognition.stop(); } catch(_) {} state.recognition = null; }
  state.isListening = false;
}

// ─── Transcript ───────────────────────────────────────────────────────────────
function addMessage(role, text) {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const msg    = document.createElement('div');
  msg.className = `msg ${role}`;
  const avatar  = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'agent' ? '👩‍💼' : '👤';
  const bubble  = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  msg.append(avatar, bubble);
  transcriptBox.append(msg);
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

// ─── Quick Replies ────────────────────────────────────────────────────────────
function setQuickReplies(options = []) {
  quickReplies.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'quick-reply-chip';
    chip.textContent = opt;
    chip.onclick = () => { if (!state.isSpeaking) handleUserInput(opt); };
    quickReplies.append(chip);
  });
}

// ─── Scripted Scoring (fallback mode) ────────────────────────────────────────
function scoreText(text, map) {
  const lower = text.toLowerCase();
  for (const [kw, pts] of Object.entries(map || {})) {
    if (lower.includes(kw)) { state.scores.signature += pts.signature || 0; state.scores.platinum += pts.platinum || 0; return; }
  }
}

// ─── Agent Speech ─────────────────────────────────────────────────────────────
async function agentSay(text) {
  showTyping();
  await sleep(350);
  hideTyping();
  addMessage('agent', text);
  await speak(text);
}

// ─── AI-POWERED CONVERSATION ─────────────────────────────────────────────────
async function handleUserInput(text) {
  if (state.isSpeaking) return;
  stopListening();
  quickReplies.innerHTML = '';
  addMessage('user', text);

  if (GEMINI.enabled) {
    // ── GEMINI MODE ───────────────────────────────────────────────────────────
    agentStatus.textContent = 'Thinking…';
    showTyping();
    try {
      const response = await geminiChat(text);
      hideTyping();

      const recommendation = extractRecommendation(response);
      const clean = cleanForSpeech(response);

      state.turnCount++;
      setProgress(getProgressStep(state.turnCount));

      await agentSay(clean);

      if (recommendation) {
        await sleep(600);
        showResult(recommendation, clean);
      } else {
        startListening();
      }
    } catch(err) {
      hideTyping();
      console.error('Gemini error:', err);
      addMessage('agent', 'I had a small hiccup! Could you repeat that?');
      await speak('I had a small hiccup! Could you repeat that?');
      startListening();
    }
  } else {
    // ── SCRIPTED MODE (no Gemini) ─────────────────────────────────────────────
    const turn = CONVERSATION[state.conversationIndex];
    scoreText(text, turn?.scoring);
    if (turn?.inputKey) state.answers[turn.inputKey] = text;
    state.conversationIndex++;

    if (state.conversationIndex >= CONVERSATION.length) {
      const winner = state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum';
      const speech = winner === 'signature'
        ? `Based on everything you've shared, I highly recommend the EazyDiner IndusInd Signature Credit Card. Given your dining frequency and lifestyle, the premium benefits — including free movies, airport lounges, and 10x reward points — will more than cover the small annual fee. Would you like to apply today?`
        : `Based on our conversation, the EazyDiner IndusInd Platinum Credit Card is perfect for you. You get all the core dining benefits with absolutely zero annual fee — a fantastic deal with no commitment. Ready to apply?`;
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

// ─── Start Conversation ───────────────────────────────────────────────────────
async function startConversation() {
  agentStatus.textContent = 'Connecting…';
  await sleep(500);

  if (GEMINI.enabled) {
    // Start with Gemini — send empty first message to get intro
    agentStatus.textContent = 'Preparing AI…';
    showTyping();
    try {
      const intro = await geminiChat('');
      hideTyping();
      const clean = cleanForSpeech(intro);
      state.turnCount = 0;
      setProgress(0);
      await agentSay(clean);
      startListening();
    } catch(err) {
      hideTyping();
      console.error('Gemini intro error:', err);
      // Fall back to scripted
      GEMINI.enabled = false;
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

// ─── Result Display ───────────────────────────────────────────────────────────
function showResult(winner, reasoning = '') {
  agentSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  const card = CARDS[winner];
  const pct  = winner === 'signature'
    ? 75 + Math.floor(Math.random() * 20)
    : 70 + Math.floor(Math.random() * 20);

  $('resultIcon').textContent = card.icon;
  $('resultName').textContent = card.name;
  $('resultName').className   = `result-name ${winner}`;
  $('resultWhy').textContent  = reasoning
    ? reasoning.replace(/\[RECOMMEND:(signature|platinum)\]/gi, '').trim()
    : `Based on your preferences, the ${card.name} is your ideal match.`;
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

// ─── Modal Logic ──────────────────────────────────────────────────────────────
// Tab switching
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    $(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

// Voice option selection
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
$('toggleGeminiVis').addEventListener('click', () => {
  const i = $('geminiKeyInput'); i.type = i.type === 'password' ? 'text' : 'password';
});

$('saveApiKey').addEventListener('click', async () => {
  const elKey     = $('apiKeyInput').value.trim();
  const geminiKey = $('geminiKeyInput').value.trim();
  const btn       = $('saveApiKey');

  // Validate ElevenLabs key if provided
  if (elKey) {
    EL.modelId = $('modelSelect').value;
    const sv = document.querySelector('.voice-option.selected');
    if (sv) EL.voiceId = sv.dataset.voice;
    showApiResult('apiTestResult', 'loading', '🔄 Testing ElevenLabs key…');
    btn.disabled = true;
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello!', model_id: EL.modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail?.message || `Status ${res.status}`); }
      EL.apiKey = elKey; EL.enabled = true;
      sessionStorage.setItem('el_api_key', elKey);
      showApiResult('apiTestResult', 'success', '✅ ElevenLabs voice connected!');
    } catch(err) {
      showApiResult('apiTestResult', 'error', `❌ ElevenLabs: ${err.message}`);
      btn.disabled = false; return;
    }
    btn.disabled = false;
  }

  // Validate Gemini key if provided
  if (geminiKey) {
    showApiResult('geminiTestResult', 'loading', '🔄 Testing Gemini AI key…');
    btn.disabled = true;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hi briefly.' }] }], generationConfig: { maxOutputTokens: 20 } }) }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      GEMINI.apiKey = geminiKey; GEMINI.enabled = true;
      sessionStorage.setItem('gemini_api_key', geminiKey);
      showApiResult('geminiTestResult', 'success', '✅ Gemini AI connected! Priya will now respond naturally.');
    } catch(err) {
      showApiResult('geminiTestResult', 'error', `❌ Gemini: ${err.message}`);
      btn.disabled = false; return;
    }
    btn.disabled = false;
  }

  // Update badge
  if (GEMINI.enabled && EL.enabled) setBadge('AI + ElevenLabs ✓', true);
  else if (GEMINI.enabled)          setBadge('Gemini AI ✓', true);
  else if (EL.enabled)              setBadge('ElevenLabs ✓', true);
  else                              setBadge('Browser Voice', false);

  if (geminiKey || elKey) {
    mainHintText.textContent = GEMINI.enabled
      ? '🧠 AI-powered · Priya will respond naturally to anything you say'
      : '🔊 ElevenLabs voice ready · Scripted conversation mode';
    await sleep(1500);
  }

  setupModal.classList.add('hidden');
});

$('skipApiKey').addEventListener('click', () => {
  GEMINI.enabled = false; EL.enabled = false;
  setBadge('Browser Voice', false);
  mainHintText.textContent = 'Using browser voice · Scripted mode (no AI)';
  setupModal.classList.add('hidden');
});

$('settingsBtn').addEventListener('click', () => {
  const savedEl = sessionStorage.getItem('el_api_key');
  const savedGm = sessionStorage.getItem('gemini_api_key');
  if (savedEl) $('apiKeyInput').value = savedEl;
  if (savedGm) $('geminiKeyInput').value = savedGm;
  $('apiTestResult').classList.add('hidden');
  $('geminiTestResult').classList.add('hidden');
  setupModal.classList.remove('hidden');
});

function showApiResult(id, type, msg) {
  const el = $(id);
  el.textContent = msg;
  el.className = `api-test-result ${type}`;
  el.classList.remove('hidden');
}

// ─── Main Buttons ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  heroSection.classList.add('hidden');
  agentSection.classList.remove('hidden');
  await startConversation();
});

micBtn.addEventListener('click', () => {
  if (state.isSpeaking || micBtn.disabled) return;
  if (state.isListening) stopListening();
  else startListening();
});

endBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening();
  state.isSpeaking = false;
  const winner = GEMINI.enabled
    ? (GEMINI.history.length > 4 ? 'signature' : 'platinum')
    : (state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum');
  showResult(winner, 'Call ended early. Here is the best card based on your conversation so far.');
});

restartBtn.addEventListener('click', () => {
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening();
  state.conversationIndex = 0;
  state.scores   = { signature: 0, platinum: 0 };
  state.answers  = {};
  state.isSpeaking = false;
  state.isListening = false;
  state.turnCount = 0;
  GEMINI.history = [];
  micBtn.disabled = false;
  transcriptBox.innerHTML = '<div class="transcript-placeholder">Your conversation will appear here…</div>';
  quickReplies.innerHTML = '';
  resultSection.classList.add('hidden');
  heroSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Inject disabled mic style ────────────────────────────────────────────────
(function() {
  const s = document.createElement('style');
  s.textContent = `.mic-btn:disabled{opacity:.55;cursor:not-allowed!important;pointer-events:none}.mic-btn:disabled:hover{transform:none}`;
  document.head.appendChild(s);
})();

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setBadge('Setting up…', false);
  // Restore saved keys
  const savedEl = sessionStorage.getItem('el_api_key');
  const savedGm = sessionStorage.getItem('gemini_api_key');
  if (savedEl) { $('apiKeyInput').value = savedEl; }
  if (savedGm) { $('geminiKeyInput').value = savedGm; }
  setupModal.classList.remove('hidden');
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
