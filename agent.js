/**
 * EazyDiner Voice Agent – Core Logic
 * TTS: ElevenLabs API (primary) → Web Speech API (fallback)
 * STT: Web Speech Recognition API (Chrome/Edge)
 *
 * BUG FIXES applied:
 * 1. state.isSpeaking set immediately in speak() — no race condition
 * 2. browserSpeak uses a safety timeout fallback in case onstart never fires
 * 3. Auto-listening starts after agent finishes speaking
 * 4. Mic button properly disabled (pointer-events) while agent speaks
 * 5. Better error messages and status indicators
 */

// ─── Card Data ────────────────────────────────────────────────────────────────
const CARDS = {
  signature: {
    id: 'signature',
    name: 'EazyDiner IndusInd Signature Credit Card',
    icon: '💎',
    color: 'signature',
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
    color: 'platinum',
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
      { icon: '💼', title: 'No Risk Entry', desc: 'Perfect starter card with full dining benefits' },
    ],
  },
};

// ─── Conversation Script ───────────────────────────────────────────────────────
const CONVERSATION = [
  {
    step: 0,
    agentText: `Hi there! This is Priya calling from EazyDiner's card advisory team. I'm delighted to speak with you today! I'd love to help you discover which EazyDiner credit card would be a perfect match for your lifestyle. This will just take a couple of minutes. Does that sound good to you?`,
    quickReplies: ['Yes, go ahead!', "Sure, let's do it", 'Sounds great'],
    inputKey: 'consent',
  },
  {
    step: 1,
    agentText: `Wonderful! Let me start with a simple question. How often do you typically dine out at restaurants — would you say it's a few times a week, a couple of times a month, or just occasionally for special occasions?`,
    quickReplies: ['Several times a week', 'A few times a month', 'Occasionally'],
    inputKey: 'diningFrequency',
    scoring: {
      'several times a week': { signature: 3, platinum: 1 },
      'few times a week':     { signature: 3, platinum: 1 },
      'couple times a month': { signature: 1, platinum: 2 },
      'few times a month':    { signature: 1, platinum: 2 },
      'occasionally':         { signature: 0, platinum: 3 },
      'special occasions':    { signature: 0, platinum: 3 },
    },
  },
  {
    step: 2,
    agentText: `Got it! Now, do you usually prefer premium or fine dining restaurants, or are you more of a casual dining person?`,
    quickReplies: ['Premium / fine dining', 'Casual & variety', 'Mix of both'],
    inputKey: 'diningStyle',
    scoring: {
      'premium':     { signature: 3, platinum: 1 },
      'fine dining': { signature: 3, platinum: 1 },
      'casual':      { signature: 1, platinum: 3 },
      'variety':     { signature: 1, platinum: 2 },
      'mix':         { signature: 2, platinum: 2 },
      'both':        { signature: 2, platinum: 2 },
    },
  },
  {
    step: 2,
    agentText: `That helps! Thinking about your overall monthly spending across dining, shopping, and entertainment — is it generally above ₹20,000 per month, between ₹10,000 and ₹20,000, or below ₹10,000?`,
    quickReplies: ['Above ₹20,000/month', '₹10,000–₹20,000', 'Below ₹10,000'],
    inputKey: 'spending',
    scoring: {
      'above':   { signature: 3, platinum: 0 },
      '20,000':  { signature: 3, platinum: 0 },
      '15,000':  { signature: 2, platinum: 1 },
      '10,000':  { signature: 1, platinum: 2 },
      'modest':  { signature: 0, platinum: 3 },
      'below':   { signature: 0, platinum: 3 },
    },
  },
  {
    step: 3,
    agentText: `Perfect! Do you travel frequently by flights and value airport lounge access? And do you enjoy free movie tickets every month?`,
    quickReplies: ['Yes, I travel and love movies!', 'I travel but not movies', 'Not into either'],
    inputKey: 'lifestyle',
    scoring: {
      'travel':      { signature: 3, platinum: 0 },
      'lounge':      { signature: 3, platinum: 0 },
      'movies':      { signature: 2, platinum: 0 },
      'yes':         { signature: 3, platinum: 0 },
      'not really':  { signature: 0, platinum: 3 },
      'not into':    { signature: 0, platinum: 3 },
      'neither':     { signature: 0, platinum: 3 },
    },
  },
  {
    step: 3,
    agentText: `Almost done! How do you feel about a card with a ₹1,999 annual fee that comes with significantly higher savings and premium benefits? Or do you prefer a card with absolutely no annual fee?`,
    quickReplies: ['Fine with fee if savings are higher', 'Prefer no annual fee', 'Open to either'],
    inputKey: 'feePreference',
    scoring: {
      'fine with':  { signature: 3, platinum: 0 },
      'savings':    { signature: 2, platinum: 0 },
      'no annual':  { signature: 0, platinum: 3 },
      'no fee':     { signature: 0, platinum: 3 },
      'open':       { signature: 1, platinum: 1 },
      'either':     { signature: 1, platinum: 1 },
    },
  },
];

// ─── ElevenLabs Config ────────────────────────────────────────────────────────
const EL = {
  apiKey: '',
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
  modelId: 'eleven_turbo_v2_5',
  enabled: false,
  currentAudio: null,
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  conversationIndex: 0,
  scores: { signature: 0, platinum: 0 },
  answers: {},
  synth: window.speechSynthesis,
  recognition: null,
  isListening: false,
  isSpeaking: false,        // ← BUG FIX: managed centrally in speak(), not in onstart
  voices: [],
  preferredVoice: null,
  speakTimer: null,         // ← safety timeout handle
};

// ─── DOM References ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
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
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

// ─── ElevenLabs Badge ─────────────────────────────────────────────────────────
function setElBadgeActive(active) {
  if (active) {
    elBadge.classList.remove('inactive');
    elBadgeText.textContent = 'ElevenLabs ✓';
    mainHintText.textContent = 'Powered by ElevenLabs · Works in Chrome & Edge';
  } else {
    elBadge.classList.add('inactive');
    elBadgeText.textContent = 'Browser Voice';
    mainHintText.textContent = 'Using browser voice · Works in Chrome & Edge';
  }
}

// ─── Mic UI State (centralised) ───────────────────────────────────────────────
// BUG FIX: All isSpeaking state managed here, not scattered across TTS callbacks
function setMicSpeaking() {
  state.isSpeaking = true;
  micBtn.className     = 'mic-btn speaking';
  micBtn.disabled      = true;              // ← Actually disable the button
  micLabel.textContent = 'Agent Speaking';
  speakingInd.className = 'speaking-indicator speaking';
  document.querySelector('.avatar-ring').classList.add('active');
  setAgentStatus('Speaking…');
}

function setMicIdle() {
  state.isSpeaking = false;
  micBtn.disabled      = false;             // ← Re-enable the button
  micBtn.className     = 'mic-btn idle';
  micLabel.textContent = 'Tap to Speak';
  micTip.textContent   = '👆 Tap the mic and speak your answer';
  speakingInd.className = 'speaking-indicator';
  document.querySelector('.avatar-ring').classList.remove('active');
  setAgentStatus('Your turn — tap mic or use buttons below');
}

function setMicListening() {
  state.isListening    = true;
  micBtn.className     = 'mic-btn listening';
  micLabel.textContent = 'Listening…';
  micTip.textContent   = '🟢 Speak now, I\'m listening!';
  speakingInd.className = 'speaking-indicator listening';
  setAgentStatus('Listening to you…');
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  agentStatus.innerHTML = `Generating voice<span class="el-loading-dots"><span class="el-loading-dot"></span><span class="el-loading-dot"></span><span class="el-loading-dot"></span></span>`;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: EL.modelId,
          voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail?.message || `HTTP ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl  = URL.createObjectURL(audioBlob);
    const audio     = new Audio(audioUrl);
    EL.currentAudio = audio;

    await new Promise((resolve, reject) => {
      audio.onplay   = () => setAgentStatus('Speaking…');
      audio.onended  = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      audio.onerror  = reject;
      audio.play().catch(reject);
    });

  } catch (err) {
    console.error('ElevenLabs TTS error:', err);
    await browserSpeak(text);   // ← Fallback to browser voice
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
    v => v.name.toLowerCase().includes('zira'),
    v => v.name.toLowerCase().includes('samantha'),
    v => v.name.toLowerCase().includes('victoria'),
    v => v.name.toLowerCase().includes('karen'),
    v => v.lang === 'en-IN',
    v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
    v => v.lang.startsWith('en'),
  ];
  for (const check of preferred) {
    const found = state.voices.find(check);
    if (found) { state.preferredVoice = found; break; }
  }
}
state.synth.addEventListener('voiceschanged', loadVoices);
loadVoices();

function browserSpeak(text) {
  return new Promise((resolve) => {
    state.synth.cancel();
    const utter  = new SpeechSynthesisUtterance(text);
    utter.voice  = state.preferredVoice;
    utter.rate   = 0.92;
    utter.pitch  = 1.05;
    utter.volume = 1;
    utter.lang   = 'en-IN';

    // BUG FIX: Safety timeout — if onend never fires within 30s, resolve anyway
    const safetyTimer = setTimeout(() => {
      console.warn('Speech synthesis timeout — resolving anyway');
      resolve();
    }, 30000);

    const done = () => {
      clearTimeout(safetyTimer);
      resolve();
    };

    utter.onend   = done;
    utter.onerror = (e) => { console.warn('Speech error:', e.error); done(); };

    state.synth.speak(utter);
  });
}

// ─── Unified speak() — BUG FIX: isSpeaking managed HERE, not in callbacks ────
async function speak(text) {
  setMicSpeaking();   // ← immediately lock mic + set state.isSpeaking = true
  try {
    if (EL.enabled && EL.apiKey) {
      await elevenLabsSpeak(text);
    } else {
      await browserSpeak(text);
    }
  } finally {
    setMicIdle();     // ← always unlock mic after speaking, even if error
  }
}

// ─── Speech Recognition ───────────────────────────────────────────────────────
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micTip.textContent = '⚠️ Voice input not supported — use the buttons below instead';
    return null;
  }
  const rec = new SpeechRecognition();
  rec.lang = 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  return rec;
}

function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const rec = initRecognition();
  if (!rec) { setAgentStatus('Use the buttons below 👇'); return; }

  setMicListening();

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript.trim();
    if (text) handleUserInput(text);
  };

  rec.onerror = (e) => {
    console.warn('Recognition error:', e.error);
    state.isListening = false;
    setMicIdle();
    if (e.error === 'not-allowed') {
      micTip.textContent = '🔴 Microphone access denied. Please allow mic in browser settings, or use the buttons below.';
      setAgentStatus('Mic permission denied');
    } else if (e.error === 'no-speech') {
      micTip.textContent = 'No speech detected. Tap mic again or use buttons below.';
      setAgentStatus('Your turn — tap mic or use buttons below');
    } else {
      micTip.textContent = `Error: ${e.error}. Try again or use buttons.`;
    }
  };

  rec.onend = () => {
    state.isListening = false;
    if (state.isSpeaking) return; // agent may have started speaking already
    setMicIdle();
  };

  state.recognition = rec;
  try {
    rec.start();
  } catch(e) {
    console.warn('Could not start recognition:', e.message);
    state.isListening = false;
    setMicIdle();
    micTip.textContent = 'Could not start mic. Use the buttons below.';
  }
}

function stopListening() {
  if (state.recognition) {
    try { state.recognition.stop(); } catch(_) {}
    state.recognition = null;
  }
  state.isListening = false;
}

// ─── Transcript ───────────────────────────────────────────────────────────────
function addMessage(role, text) {
  const placeholder = transcriptBox.querySelector('.transcript-placeholder');
  if (placeholder) placeholder.remove();

  const msg    = document.createElement('div');
  msg.className = `msg ${role}`;
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'agent' ? '👩‍💼' : '👤';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  msg.append(avatar, bubble);
  transcriptBox.append(msg);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

function showTypingIndicator() {
  const placeholder = transcriptBox.querySelector('.transcript-placeholder');
  if (placeholder) placeholder.remove();
  const typing = document.createElement('div');
  typing.className = 'msg agent';
  typing.id = 'typingIndicator';
  typing.innerHTML = `<div class="msg-avatar">👩‍💼</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  transcriptBox.append(typing);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

function removeTypingIndicator() {
  const ti = $('typingIndicator');
  if (ti) ti.remove();
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function setAgentStatus(text) {
  agentStatus.textContent = text;
  const steps   = document.querySelectorAll('.step');
  const current = CONVERSATION[state.conversationIndex]?.step ?? 4;
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < current)        s.classList.add('done');
    else if (i === current) s.classList.add('active');
  });
}

function setQuickReplies(options = []) {
  quickReplies.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'quick-reply-chip';
    chip.textContent = opt;
    chip.onclick = () => {
      if (state.isSpeaking) return;
      handleUserInput(opt);
    };
    quickReplies.append(chip);
  });
}

// ─── Main Conversation Flow ───────────────────────────────────────────────────
async function agentSpeak(text) {
  showTypingIndicator();
  await sleep(400);
  removeTypingIndicator();
  addMessage('agent', text);
  await speak(text);
  // BUG FIX: Auto-start listening after agent finishes speaking
  // Small delay so user knows agent is done
  await sleep(300);
  if (!state.isSpeaking && state.conversationIndex < CONVERSATION.length) {
    startListening();
  }
}

async function handleUserInput(text) {
  if (state.isSpeaking) return;
  stopListening();
  quickReplies.innerHTML = '';
  addMessage('user', text);

  const turn = CONVERSATION[state.conversationIndex];
  if (turn?.scoring) scoreFromText(text, turn.scoring, state.scores);
  if (turn?.inputKey) state.answers[turn.inputKey] = text;

  state.conversationIndex++;
  await sleep(300);
  await runNextTurn();
}

async function runNextTurn() {
  if (state.conversationIndex >= CONVERSATION.length) {
    await agentSpeak(buildRecommendationSpeech());
    await sleep(800);
    showResult();
    return;
  }
  const turn = CONVERSATION[state.conversationIndex];
  setAgentStatus(`Step ${turn.step + 1} of 5`);
  await agentSpeak(turn.agentText);
  setQuickReplies(turn.quickReplies || []);
}

// ─── Recommendation Speech ────────────────────────────────────────────────────
function buildRecommendationSpeech() {
  const winner = state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum';
  const gap    = Math.abs(state.scores.signature - state.scores.platinum);
  const conf   = gap >= 6 ? 'absolutely perfect' : gap >= 3 ? 'a great fit' : 'a solid choice';

  if (winner === 'signature') {
    return `Based on everything you've shared, I'm thrilled to recommend the EazyDiner IndusInd Signature Credit Card — it's ${conf} for you! Given your dining frequency, spending level, and love for premium experiences, this card will deliver exceptional value with up to fifty percent off at over two thousand restaurants, free movie tickets every month, airport lounge access, and ten reward points for every hundred rupees you spend on dining. The annual fee of under two thousand rupees will be easily recovered in your very first month. Would you like to apply today?`;
  } else {
    return `Based on our conversation, I'd recommend the EazyDiner IndusInd Platinum Credit Card — and it's ${conf} for your lifestyle! This lifetime free card gives you all the core EazyDiner benefits — up to fifty percent off at two thousand plus restaurants, extra twenty percent savings via PayEazy, and reward points on all your spends — with absolutely zero annual fees. It's a fantastic way to start enjoying dining privileges with no commitment whatsoever. Ready to apply?`;
  }
}

// ─── Result Display ───────────────────────────────────────────────────────────
function showResult() {
  agentSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  const winner = state.scores.signature >= state.scores.platinum ? 'signature' : 'platinum';
  const card   = CARDS[winner];
  const total  = Math.max(state.scores.signature + state.scores.platinum, 1);
  const pct    = Math.min(Math.round((Math.max(state.scores.signature, state.scores.platinum) / total) * 100) + 20, 95);

  $('resultIcon').textContent = card.icon;
  $('resultName').textContent = card.name;
  $('resultName').className   = `result-name ${winner}`;
  $('resultWhy').textContent  = buildWhyText(winner);
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

function buildWhyText(winner) {
  const diningFreq  = state.answers.diningFrequency || '';
  const diningStyle = state.answers.diningStyle     || '';
  if (winner === 'signature') {
    return `Based on your dining habits (${diningFreq.toLowerCase() || 'regular dining'}), preference for ${diningStyle.toLowerCase() || 'premium restaurants'}, and spending level, the Signature Card is your best match. Its premium rewards, free movies, lounge access, and higher PayEazy savings easily outweigh the ₹1,999 annual fee. You'll recover the fee in your very first couple of dining outings!`;
  } else {
    return `Given your ${diningFreq.toLowerCase() || 'casual'} dining frequency, preference for ${diningStyle.toLowerCase() || 'casual dining'}, and preference for a zero-fee card, the Platinum Card is the smart choice. You get all the essential EazyDiner benefits without any annual cost. It's the ideal starting point for dining rewards!`;
  }
}

// ─── ElevenLabs Modal ─────────────────────────────────────────────────────────
function closeModal() { setupModal.classList.add('hidden'); }
function openModal()  {
  setupModal.classList.remove('hidden');
  const saved = sessionStorage.getItem('el_api_key');
  if (saved) $('apiKeyInput').value = saved;
  $('apiTestResult').classList.add('hidden');
}

document.querySelectorAll('.voice-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type=radio]').checked = true;
    EL.voiceId = opt.dataset.voice;
  });
});

$('toggleVis').addEventListener('click', () => {
  const inp = $('apiKeyInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

$('saveApiKey').addEventListener('click', async () => {
  const key = $('apiKeyInput').value.trim();
  if (!key) { showApiTestResult('error', '⚠️ Please enter your ElevenLabs API key.'); return; }

  EL.modelId = $('modelSelect').value;
  const sv = document.querySelector('.voice-option.selected');
  if (sv) EL.voiceId = sv.dataset.voice;

  showApiTestResult('loading', '🔄 Validating key with a live test…');
  $('saveApiKey').disabled = true;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello!', model_id: EL.modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      }
    );
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.detail?.message || `Status ${res.status}`);
    }
    EL.apiKey  = key;
    EL.enabled = true;
    sessionStorage.setItem('el_api_key', key);
    showApiTestResult('success', '✅ Connected! Starting consultation with ElevenLabs voice…');
    setElBadgeActive(true);
    await sleep(1800);
    closeModal();
  } catch (err) {
    showApiTestResult('error', `❌ ${err.message}. Check your key and try again.`);
  } finally {
    $('saveApiKey').disabled = false;
  }
});

$('skipApiKey').addEventListener('click', () => {
  EL.enabled = false;
  setElBadgeActive(false);
  closeModal();
});

$('settingsBtn').addEventListener('click', openModal);

function showApiTestResult(type, msg) {
  const el = $('apiTestResult');
  el.textContent = msg;
  el.className   = `api-test-result ${type}`;
  el.classList.remove('hidden');
}

// ─── Main Buttons ─────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  heroSection.classList.add('hidden');
  agentSection.classList.remove('hidden');
  setAgentStatus('Connecting…');
  await sleep(600);
  await runNextTurn();
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
  showResult();
});

restartBtn.addEventListener('click', () => {
  state.conversationIndex = 0;
  state.scores   = { signature: 0, platinum: 0 };
  state.answers  = {};
  state.isSpeaking  = false;
  state.isListening = false;
  state.synth.cancel();
  if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }

  transcriptBox.innerHTML = '<div class="transcript-placeholder">Your conversation will appear here…</div>';
  quickReplies.innerHTML  = '';
  micBtn.disabled = false;
  resultSection.classList.add('hidden');
  heroSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── CSS: disable mic while speaking ─────────────────────────────────────────
// Inject style to make disabled mic clearly un-clickable
(function() {
  const s = document.createElement('style');
  s.textContent = `.mic-btn:disabled { opacity: 0.6; cursor: not-allowed !important; pointer-events: none; }
  .mic-btn:disabled:hover { transform: none; }`;
  document.head.appendChild(s);
})();

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setElBadgeActive(false);
  openModal();
  if (!window.speechSynthesis) {
    $('skipApiKey').textContent = 'Browser voice not supported — please use ElevenLabs';
  }
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
