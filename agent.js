/**
 * EazyDiner Voice Agent
 * AI: Pollinations AI (free, no key) → Smart local fallback (works offline)
 * TTS: ElevenLabs (optional) → Browser voice
 * STT: Web Speech API (Chrome/Edge)
 */

// ─── Card Data ────────────────────────────────────────────────────────────────
const CARDS = {
  signature: {
    id: 'signature', icon: '💎',
    name: 'EazyDiner IndusInd Signature Credit Card',
    applyUrl: 'https://www.indusind.com/in/en/personal/cards/credit-card/eazydiner-indusind-bank-credit-card.html',
    fee: '₹1,999 + taxes/year',
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
    id: 'platinum', icon: '⚡',
    name: 'EazyDiner IndusInd Platinum Credit Card',
    applyUrl: 'https://www.indusind.com/in/en/personal/cards/credit-card/eazydiner-indusind-bank-credit-card.html',
    fee: 'Lifetime Free – Zero annual charges',
    benefits: [
      { icon: '🆓', title: 'Lifetime Free Card',              desc: 'Absolutely zero joining or annual fee – ever' },
      { icon: '🍽️', title: 'Complimentary Prime (3 Months)', desc: '₹1,095 value – 25–50% off at 2,000+ restaurants' },
      { icon: '📱', title: 'PayEazy Discount',                desc: 'Extra 20% off up to ₹500, 3 times/month via app' },
      { icon: '🔄', title: 'Renewable Prime',                 desc: 'Renew for 3 months by spending ₹30,000 per quarter' },
      { icon: '💳', title: 'Earn Reward Points',              desc: '2 pts/₹100 on all eligible spends (except fuel)' },
      { icon: '🎯', title: 'EazyPoints Bonus',                desc: '2X EazyPoints on every EazyDiner app booking' },
      { icon: '⛽', title: 'Fuel Surcharge Waiver',           desc: '1% waiver on ₹400–₹4,000 transactions' },
      { icon: '💼', title: 'No Risk Entry',                   desc: 'Full dining benefits with zero financial commitment' },
    ],
  },
};

// ─── System Prompt (for Pollinations) ────────────────────────────────────────
const SYSTEM_PROMPT = `You are Priya, a warm sales advisor from EazyDiner's card advisory team on a voice call. Help the customer choose between:

1. SIGNATURE (Rs 1999/yr): 1yr Prime membership, 10x dining points, 2 free movies/month, airport lounge access, 25% PayEazy discount up to Rs 1000. Best for frequent diners, travelers, high spenders.
2. PLATINUM (LIFETIME FREE): 3mo Prime, 2x points, 20% PayEazy up to Rs 500. Best for casual diners, beginners, those who prefer no fees.

Be warm and natural. Respond to ANY message including off-topic ones (answer briefly then return to topic). Ask ONE question at a time. Keep responses to 2-3 sentences max (voice call). After 4-5 exchanges, recommend one card and end with [RECOMMEND:signature] or [RECOMMEND:platinum]. Never ask about credit score.`;

// ─── Smart Local AI (works 100% offline, no API) ─────────────────────────────
class LocalPriya {
  constructor() { this.turn = 0; this.sig = 0; this.plat = 0; }

  score(msg) {
    const m = msg.toLowerCase();
    if (/often|daily|week|frequent|regular/i.test(m))              this.sig  += 2;
    if (/occasional|rarely|sometimes|month|seldom/i.test(m))       this.plat += 2;
    if (/premium|fine|fancy|upscale|high.?end/i.test(m))           this.sig  += 2;
    if (/casual|budget|affordable|simple|cheap/i.test(m))          this.plat += 2;
    if (/travel|lounge|airport|movie|movies|entertainment/i.test(m)) this.sig += 2;
    if (/no fee|free card|annual fee|prefer free|lifetime/i.test(m)) this.plat += 2;
    if (/20[k,]?000|high spend|a lot|above/i.test(m))              this.sig  += 2;
    if (/10[k,]?000|low|below|less|budget/i.test(m))               this.plat += 2;
    if (/fine with fee|ok with fee|fee is fine/i.test(m))          this.sig  += 3;
  }

  ack(msg) {
    const m = msg.toLowerCase();
    const greetings = /hi|hello|hey|good|fine|okay|yes|sure|alright/i;
    const questions = /what|how|who|why|when|where|\?/i;
    if (greetings.test(m) && !questions.test(m)) return 'Great! ';
    if (/2\+2|math|calculate/i.test(m)) return "Ha, that's 4! Now, ";
    if (/who are you|introduce/i.test(m)) return "I'm Priya, your EazyDiner card advisor! ";
    if (/what card|which card/i.test(m)) return "That's exactly what I'm here to find out! ";
    if (/thanks|thank you/i.test(m)) return "My pleasure! ";
    return '';
  }

  respond(userMsg) {
    if (userMsg) this.score(userMsg);
    this.turn++;

    const prefix = userMsg ? this.ack(userMsg) : '';

    const flow = [
      `Hi there! This is Priya calling from EazyDiner's card advisory team. I'd love to help you find the perfect credit card — it'll just take 2 minutes! How often do you dine out at restaurants?`,
      `${prefix}That's helpful to know! Do you prefer premium fine-dining restaurants, or are you more of a casual dining person?`,
      `${prefix}Got it! And what's your approximate monthly spending overall — above ₹20,000, between ₹10–20k, or below ₹10,000?`,
      `${prefix}Perfect! Do you travel frequently and value things like airport lounge access or free movie tickets each month?`,
      `${prefix}Almost done! Are you okay with a small ₹1,999 annual fee if the savings are much higher, or do you prefer a lifetime free card with no charges ever?`,
    ];

    if (this.turn <= flow.length) return flow[this.turn - 1];

    // Final recommendation
    const winner = this.sig >= this.plat ? 'signature' : 'platinum';
    if (winner === 'signature') {
      return `${prefix}Based on everything you've shared, I'd confidently recommend the EazyDiner IndusInd Signature Card! With your dining frequency and lifestyle, the 10x reward points, free movies, and airport lounges will easily outweigh the small annual fee. Shall I help you get started with the application? [RECOMMEND:signature]`;
    }
    return `${prefix}Based on our conversation, the EazyDiner IndusInd Platinum Card is absolutely perfect for you! You get the full EazyDiner dining experience — 25 to 50 percent off at over 2,000 restaurants — completely free, forever. It's a no-brainer! Ready to apply? [RECOMMEND:platinum]`;
  }
}

// ─── AI Config ────────────────────────────────────────────────────────────────
const AI = { history: [], localPriya: new LocalPriya() };

// ─── ElevenLabs ───────────────────────────────────────────────────────────────
const EL = {
  apiKey: '', voiceId: 'EXAVITQu4vr4xnSDxMaL',
  modelId: 'eleven_turbo_v2_5', enabled: false, currentAudio: null,
};

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  synth: window.speechSynthesis, recognition: null,
  isListening: false, isSpeaking: false, manualStop: false,
  voices: [], preferredVoice: null, turnCount: 0,
};

// ─── DOM ──────────────────────────────────────────────────────────────────────
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
const sleep         = ms => new Promise(r => setTimeout(r, ms));

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
  state.isSpeaking = true; micBtn.disabled = true;
  if (textInput) textInput.disabled = true;
  micBtn.className = 'mic-btn speaking'; micLabel.textContent = 'Agent Speaking';
  speakingInd.className = 'speaking-indicator speaking';
  document.querySelector('.avatar-ring').classList.add('active');
  agentStatus.textContent = 'Speaking…';
}
function setMicIdle() {
  state.isSpeaking = false; micBtn.disabled = false;
  if (textInput) textInput.disabled = false;
  micBtn.className = 'mic-btn idle'; micLabel.textContent = 'Tap to Speak';
  micTip.textContent = '👆 Tap mic to speak · Or type below';
  speakingInd.className = 'speaking-indicator';
  document.querySelector('.avatar-ring').classList.remove('active');
  agentStatus.textContent = 'Your turn — speak or type below ↓';
}
function setMicListening() {
  micBtn.className = 'mic-btn listening'; micLabel.textContent = 'Tap to Stop 🟥';
  micTip.textContent = '🟢 Listening… speak now or type below';
  speakingInd.className = 'speaking-indicator listening';
  agentStatus.textContent = 'Listening…';
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      { method: 'POST', headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: EL.modelId,
          voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }) }
    );
    if (!res.ok) throw new Error(`EL ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url); EL.currentAudio = audio;
    await new Promise((resolve, reject) => {
      audio.onplay  = () => agentStatus.textContent = 'Speaking…';
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  } catch(e) { console.warn('EL fallback:', e.message); await browserSpeak(text); }
  finally    { EL.currentAudio = null; }
}

// ─── Browser TTS ──────────────────────────────────────────────────────────────
function loadVoices() {
  state.voices = state.synth.getVoices();
  const checks = [
    v => v.name.toLowerCase().includes('india') && v.name.toLowerCase().includes('female'),
    v => v.name.toLowerCase().includes('veena'),
    v => v.name.toLowerCase().includes('samantha'),
    v => v.lang === 'en-IN', v => v.lang.startsWith('en'),
  ];
  for (const c of checks) { const f = state.voices.find(c); if (f) { state.preferredVoice = f; break; } }
}
state.synth.addEventListener('voiceschanged', loadVoices); loadVoices();

function browserSpeak(text) {
  return new Promise(resolve => {
    state.synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = state.preferredVoice; u.rate = 0.9; u.pitch = 1.05; u.lang = 'en-IN';
    const t = setTimeout(resolve, 30000);
    const done = () => { clearTimeout(t); resolve(); };
    u.onend = done; u.onerror = () => done();
    state.synth.speak(u);
  });
}

async function speak(text) {
  setMicSpeaking();
  try {
    if (EL.enabled && EL.apiKey) await elevenLabsSpeak(text);
    else await browserSpeak(text);
  } finally { setMicIdle(); }
}

// ─── AI Chat — Pollinations first, local fallback ─────────────────────────────
async function aiChat(userMessage) {
  if (userMessage) AI.history.push({ role: 'user', content: userMessage });

  // Try Pollinations AI (8s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...AI.history],
        model: 'openai', seed: Date.now() % 9999, stream: false,
      }),
    });
    clearTimeout(timer);

    if (res.ok) {
      const raw = (await res.text()).trim();
      if (raw && raw.length > 5) {
        // Handle plain text or JSON response
        let text = raw;
        try {
          const j = JSON.parse(raw);
          text = j?.choices?.[0]?.message?.content || j?.text || raw;
        } catch(_) {}
        if (text && text.length > 5) {
          AI.history.push({ role: 'assistant', content: text });
          return text;
        }
      }
    }
  } catch(e) {
    console.warn('Pollinations unavailable, using local AI:', e.message);
  }

  // Local AI fallback — always works
  const text = AI.localPriya.respond(userMessage || '');
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

// ─── Speech Recognition — with stop fix ──────────────────────────────────────
function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micTip.textContent = '⚠️ Mic not supported — use the text box below'; return; }

  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;

  let gotResult = false;
  state.isListening = true; state.manualStop = false;
  setMicListening();

  rec.onresult = e => {
    gotResult = true;
    const text = e.results[0][0].transcript.trim();
    if (text) handleUserInput(text);
  };
  rec.onerror = e => {
    state.isListening = false; state.recognition = null;
    if (e.error === 'not-allowed') { setMicIdle(); micTip.textContent = '🔴 Mic blocked — type your answer below'; return; }
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
  state.isListening = false; setMicIdle();
}

// ─── Transcript ───────────────────────────────────────────────────────────────
function addMessage(role, text) {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const wrap = document.createElement('div'); wrap.className = `msg ${role}`;
  const av = document.createElement('div'); av.className = 'msg-avatar';
  av.textContent = role === 'agent' ? '👩‍💼' : '👤';
  const bub = document.createElement('div'); bub.className = 'msg-bubble';
  bub.textContent = text;
  wrap.append(av, bub); transcriptBox.append(wrap);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}
function showTyping() {
  transcriptBox.querySelector('.transcript-placeholder')?.remove();
  const el = document.createElement('div'); el.className = 'msg agent'; el.id = 'typingIndicator';
  el.innerHTML = `<div class="msg-avatar">👩‍💼</div><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  transcriptBox.append(el); transcriptBox.scrollTop = transcriptBox.scrollHeight;
}
function hideTyping() { $('typingIndicator')?.remove(); }

function setQuickReplies(options = []) {
  quickReplies.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button'); chip.className = 'quick-reply-chip'; chip.textContent = opt;
    chip.onclick = () => { if (!state.isSpeaking) handleUserInput(opt); };
    quickReplies.append(chip);
  });
}

// ─── Handle Input ─────────────────────────────────────────────────────────────
async function handleUserInput(text) {
  if (state.isSpeaking) return;
  stopListening(); quickReplies.innerHTML = '';
  addMessage('user', text);
  agentStatus.textContent = 'Thinking…'; showTyping();

  const response       = await aiChat(text);
  hideTyping();
  const recommendation = extractRecommendation(response);
  const clean          = cleanForSpeech(response);

  state.turnCount++; setProgress(Math.min(state.turnCount, 4));
  showTyping(); await sleep(300); hideTyping();
  addMessage('agent', clean);
  await speak(clean);

  if (recommendation) { await sleep(500); showResult(recommendation, clean); }
  else startListening();
}

// ─── Start ────────────────────────────────────────────────────────────────────
async function startConversation() {
  agentStatus.textContent = 'Connecting…'; await sleep(500);
  showTyping();
  const intro = await aiChat('');
  hideTyping(); setProgress(0);
  addMessage('agent', cleanForSpeech(intro));
  await speak(cleanForSpeech(intro));
  startListening();
}

// ─── Result ───────────────────────────────────────────────────────────────────
function showResult(winner, reasoning) {
  agentSection.classList.add('hidden'); resultSection.classList.remove('hidden');
  const card = CARDS[winner]; const pct = 72 + Math.floor(Math.random() * 22);
  $('resultIcon').textContent = card.icon;
  $('resultName').textContent = card.name;
  $('resultName').className   = `result-name ${winner}`;
  $('resultWhy').textContent  = cleanForSpeech(reasoning || `Based on your preferences, ${card.name} is your ideal match.`);
  $('applyBtn').href          = card.applyUrl;
  $('applyBtn').className     = winner === 'platinum' ? 'apply-btn purple' : 'apply-btn';
  $('scoreValue').textContent = `${pct}% match`;
  $('scoreValue').className   = winner === 'platinum' ? 'score-value purple' : 'score-value';
  $('scoreBar').className     = winner === 'platinum' ? 'score-bar purple' : 'score-bar';
  setTimeout(() => { $('scoreBar').style.width = `${pct}%`; }, 100);
  const benefitsEl = $('resultBenefits'); benefitsEl.innerHTML = '';
  card.benefits.forEach(b => {
    const el = document.createElement('div'); el.className = 'benefit-item';
    el.innerHTML = `<div class="benefit-icon">${b.icon}</div><div class="benefit-text"><strong>${b.title}</strong>${b.desc}</div>`;
    benefitsEl.append(el);
  });
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
$('closeModal').addEventListener('click', () => setupModal.classList.add('hidden'));
document.querySelectorAll('.voice-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected'); opt.querySelector('input[type=radio]').checked = true; EL.voiceId = opt.dataset.voice;
  });
});
$('toggleVis').addEventListener('click', () => { const i=$('apiKeyInput'); i.type=i.type==='password'?'text':'password'; });
$('saveApiKey').addEventListener('click', async () => {
  const elKey = $('apiKeyInput').value.trim(); const btn = $('saveApiKey');
  if (!elKey) { setupModal.classList.add('hidden'); return; }
  btn.disabled = true; EL.modelId = $('modelSelect').value;
  const sv = document.querySelector('.voice-option.selected'); if (sv) EL.voiceId = sv.dataset.voice;
  showApiResult('apiTestResult', 'loading', '🔄 Testing ElevenLabs key…');
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello!', model_id: EL.modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail?.message||`Status ${res.status}`); }
    EL.apiKey = elKey; EL.enabled = true; sessionStorage.setItem('el_api_key', elKey);
    showApiResult('apiTestResult', 'success', '✅ ElevenLabs connected! Priya now has a human voice.');
    setBadge('AI + Human Voice ✓', true); await sleep(1500);
  } catch(e) { showApiResult('apiTestResult', 'error', `❌ ${e.message}`); btn.disabled = false; return; }
  btn.disabled = false; setupModal.classList.add('hidden');
});
$('skipApiKey').addEventListener('click', () => setupModal.classList.add('hidden'));
$('settingsBtn').addEventListener('click', () => {
  const se = sessionStorage.getItem('el_api_key'); if (se) $('apiKeyInput').value = se;
  $('apiTestResult').classList.add('hidden'); setupModal.classList.remove('hidden');
});
function showApiResult(id, type, msg) { const el=$(id); el.textContent=msg; el.className=`api-test-result ${type}`; el.classList.remove('hidden'); }

// ─── Text Input ───────────────────────────────────────────────────────────────
function submitText() {
  const text = textInput.value.trim();
  if (!text || state.isSpeaking) return;
  textInput.value = ''; handleUserInput(text);
}
textSendBtn.addEventListener('click', submitText);
textInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitText(); });

// ─── Mic ──────────────────────────────────────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (state.isSpeaking || micBtn.disabled) return;
  if (state.isListening) stopListening(); else startListening();
});

// ─── Main ─────────────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  heroSection.classList.add('hidden'); agentSection.classList.remove('hidden');
  await startConversation();
});
endBtn.addEventListener('click', () => {
  state.synth.cancel(); if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening(); state.isSpeaking = false;
  const winner = AI.localPriya.sig >= AI.localPriya.plat ? 'signature' : 'platinum';
  showResult(winner, 'Based on our conversation so far, here is your best match.');
});
restartBtn.addEventListener('click', () => {
  state.synth.cancel(); if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening(); Object.assign(state, { isSpeaking:false, isListening:false, manualStop:false, turnCount:0 });
  AI.history = []; AI.localPriya = new LocalPriya();
  micBtn.disabled = false;
  if (textInput) { textInput.disabled = false; textInput.value = ''; }
  transcriptBox.innerHTML = '<div class="transcript-placeholder">Your conversation will appear here…</div>';
  quickReplies.innerHTML = '';
  resultSection.classList.add('hidden'); heroSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
const s = document.createElement('style');
s.textContent = `.mic-btn:disabled{opacity:.5;cursor:not-allowed!important;pointer-events:none}.text-input:disabled{opacity:.5;cursor:not-allowed}`;
document.head.appendChild(s);

window.addEventListener('DOMContentLoaded', () => {
  setBadge('AI Ready ✓', true);
  mainHintText.textContent = '🧠 AI-powered · No setup required · Just click Start';
  const se = sessionStorage.getItem('el_api_key'); if (se) $('apiKeyInput').value = se;
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
