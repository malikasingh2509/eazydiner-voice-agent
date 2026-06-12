/**
 * EazyDiner Voice Agent
 * AI: Pollinations AI → Smart local AI fallback
 * TTS: ElevenLabs → Browser voice
 * STT: Web Speech API (Chrome/Edge — NOT Brave)
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
      { icon: '🎁', title: 'Welcome Gift',                    desc: '2,000 bonus points + The Postcard Hotel voucher' },
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

// ─── Pollinations system prompt ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Priya, a warm sales advisor from EazyDiner's card advisory team on a voice call. Help choose between:
1. SIGNATURE (Rs 1999/yr): 1yr Prime, 10x dining points, 2 free movies/month, airport lounges, best for frequent diners/travelers.
2. PLATINUM (FREE): 3mo Prime, 2x points, no fee, best for casual diners/beginners.
Be warm and respond to ANY message including greetings and off-topic. Ask ONE question at a time. Max 2-3 sentences. After 4-5 exchanges end with [RECOMMEND:signature] or [RECOMMEND:platinum]. Never ask about credit score.`;

// ─── Smart Local AI — understands context, handles off-topic ─────────────────
class Priya {
  constructor() {
    this.step = 0;        // which question we're on
    this.sig  = 0;        // signature score
    this.plat = 0;        // platinum score
    this.asked = [];      // questions already asked
  }

  questions() {
    return [
      'How often do you dine out at restaurants — several times a week, a few times a month, or just occasionally?',
      'Do you prefer premium fine-dining restaurants, or are you more of a casual dining person?',
      'What\'s your approximate monthly spending overall — above ₹20,000, between ₹10–20k, or below ₹10,000?',
      'Do you travel often or enjoy perks like airport lounge access and free movies each month?',
      'Last one — are you okay with a ₹1,999 annual fee if the savings are much bigger, or would you prefer a completely free card?',
    ];
  }

  currentQuestion() { return this.questions()[Math.min(this.step, this.questions().length - 1)]; }

  // Detect if message is off-topic (should NOT advance the conversation)
  isOffTopic(msg) {
    const m = msg.toLowerCase().trim();
    if (m.length < 3) return true;
    const offtopicPatterns = [
      /^(hi+|hello+|hey+|hiya|yo+|sup|howdy|greetings)[\s!?.]*$/i,
      /^how (are|r) (you|u|doing|ya)\??$/i,
      /^(good|great|nice|cool|okay|ok|fine|sure|yes|no|nah|yeah|yep|nope|lol|haha|lmao)[\s!?.]*$/i,
      /^what(\'s| is) (\d+\s*[\+\-\*\/]\s*\d+|\d+\s*plus\s*\d+)/i,
      /^(\d+\s*[\+\-\*\/x]\s*\d+)\??$/i,
      /who (are|r) you\??/i,
      /are you (a |an )?(ai|bot|robot|human|real)\??/i,
      /what(\'s| is) your name\??/i,
      /what time|what\'s the (date|day|weather|time)/i,
      /tell me (a )?joke/i,
      /can you (help|assist)/i,
    ];
    return offtopicPatterns.some(p => p.test(m));
  }

  // Reply to off-topic WITHOUT advancing the question
  offTopicReply(msg) {
    const m = msg.toLowerCase().trim();

    // Math
    const mathMatch = msg.match(/(\d+)\s*[\+\-\*\/x]\s*(\d+)/);
    if (mathMatch) {
      try {
        const expr = msg.match(/[\d\s\+\-\*\/]+/)[0];
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${expr})`)();
        return `Ha! That's ${result}. You're sharp! Now, ${this.currentQuestion()}`;
      } catch(_) {
        return `Ha, good one! Anyway, ${this.currentQuestion()}`;
      }
    }
    // Greeting
    if (/^(hi+|hello+|hey+|hiya|yo+|sup|howdy)[\s!?.]*$/i.test(m))
      return `Hey! Great to hear from you! I'm doing well, thanks! Now, ${this.currentQuestion()}`;
    // How are you
    if (/how (are|r) (you|u|doing|ya)/i.test(m))
      return `I'm doing great, thanks so much for asking! Now, ${this.currentQuestion()}`;
    // Who are you
    if (/who (are|r) you|what(\'s| is) your name|are you (a |an )?(ai|bot|robot|human)/i.test(m))
      return `I'm Priya, your AI card advisor from EazyDiner! Think of me as a friend who helps you pick the best credit card. ${this.currentQuestion()}`;
    // Simple yes/no/okay
    if (/^(yes|no|okay|ok|sure|nah|yeah|yep|nope|cool|fine|great|nice|good|lol|haha)[\s!?.]*$/i.test(m))
      return `Got it! ${this.currentQuestion()}`;

    return `Interesting! But let me get back to helping you. ${this.currentQuestion()}`;
  }

  // Score the reply and advance to next question
  score(msg) {
    const m = msg.toLowerCase();
    // Frequency
    if (/several times|daily|every day|all the time|very often|multiple times a week/i.test(m)) this.sig  += 3;
    else if (/few times a week|twice a week|3.4 times/i.test(m))                                this.sig  += 2;
    else if (/few times a month|once or twice|couple times/i.test(m))                           this.plat += 1;
    else if (/occasionally|rarely|sometimes|once a month|seldom/i.test(m))                      this.plat += 3;

    // Dining style
    if (/premium|fine dining|fine-dining|fancy|high.?end|upscale|5 star|luxury/i.test(m))       this.sig  += 3;
    else if (/mix|both|depends|casual and premium/i.test(m))                                     this.sig  += 1;
    else if (/casual|regular|affordable|normal|simple|anywhere/i.test(m))                        this.plat += 2;

    // Spending
    if (/above 20|20,000|20000|20k\+?|more than 20|high spend|a lot/i.test(m))                  this.sig  += 3;
    else if (/10.?20|15k|12k|middle|medium/i.test(m))                                            this.sig  += 1;
    else if (/below 10|under 10|10k|less than 10|low spend|not much/i.test(m))                   this.plat += 3;

    // Lifestyle
    if (/travel|lounge|airport|movie|movies|entertainment|both|yes all/i.test(m))                this.sig  += 3;
    else if (/no|neither|not into|don't travel|no movies/i.test(m))                              this.plat += 2;

    // Fee preference
    if (/fine with fee|ok with fee|fee is fine|savings|worth it|fee is okay|annual.?fee.?ok/i.test(m)) this.sig += 3;
    else if (/free|no fee|no annual|prefer free|lifetime|no charges|zero/i.test(m))              this.plat += 4;
    else if (/open|either|both|doesn't matter|dont mind/i.test(m))                               this.sig  += 1;
  }

  respond(userMsg) {
    // First message = introduction
    if (!userMsg) {
      return `Hi there! This is Priya calling from EazyDiner's card advisory team. I'm here to help you find the best credit card for your lifestyle — it'll just take a couple of minutes! ${this.currentQuestion()}`;
    }

    // Off-topic → reply warmly but DON'T advance
    if (this.isOffTopic(userMsg)) {
      return this.offTopicReply(userMsg);
    }

    // Score and advance
    this.score(userMsg);
    this.step++;

    const acks = ['Got it!', 'That\'s really helpful!', 'I see!', 'Perfect!', 'Great to know!', 'Understood!'];
    const ack  = acks[Math.floor(Math.random() * acks.length)];

    // Enough info or last question answered → recommend
    const enoughInfo = this.step >= 5 || (this.step >= 3 && (this.sig >= 7 || this.plat >= 7));
    if (enoughInfo) {
      const winner = this.sig >= this.plat ? 'signature' : 'platinum';
      if (winner === 'signature') {
        return `${ack} Based on everything you've shared, I'd confidently recommend the EazyDiner Signature Card! Your lifestyle — the dining frequency, spending level, and love for premium experiences — makes this card an amazing value. The benefits easily outweigh the annual fee. Shall we get you started? [RECOMMEND:signature]`;
      }
      return `${ack} Based on our chat, the EazyDiner Platinum Card is absolutely perfect for you! Zero annual fee, yet you still get 25 to 50 percent off at over 2,000 restaurants. All the dining benefits with no commitment at all. Ready to apply? [RECOMMEND:platinum]`;
    }

    // Next question
    return `${ack} ${this.currentQuestion()}`;
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
const AI = { history: [], priya: new Priya() };
const EL = { apiKey: '', voiceId: 'EXAVITQu4vr4xnSDxMaL', modelId: 'eleven_turbo_v2_5', enabled: false, currentAudio: null };
const state = {
  synth: window.speechSynthesis, recognition: null,
  isListening: false, isSpeaking: false, manualStop: false,
  voices: [], preferredVoice: null, turnCount: 0,
  silenceTimer: null,
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

// ─── Browser check ────────────────────────────────────────────────────────────
const isBrave = !!(navigator.brave);  // Brave exposes navigator.brave

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
  if (textInput) { textInput.disabled = false; textInput.focus(); }
  micBtn.className = 'mic-btn idle'; micLabel.textContent = 'Tap to Speak';
  micTip.textContent = isBrave
    ? '⚠️ Brave blocks mic — type below or use Chrome'
    : '👆 Tap mic to speak · Or type below';
  speakingInd.className = 'speaking-indicator';
  document.querySelector('.avatar-ring').classList.remove('active');
  agentStatus.textContent = 'Your turn — speak or type below ↓';
}
function setMicListening() {
  micBtn.className = 'mic-btn listening'; micLabel.textContent = 'Tap to Stop 🟥';
  micTip.textContent = isBrave
    ? '⚠️ Brave browser may block mic — type your answer below'
    : '🟢 Listening… speak now · Or type below';
  speakingInd.className = 'speaking-indicator listening';
  agentStatus.textContent = isBrave ? 'Brave may block mic — type below ↓' : 'Listening…';
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────
async function elevenLabsSpeak(text) {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`,
      { method: 'POST', headers: { 'xi-api-key': EL.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: EL.modelId, voice_settings: { stability: 0.48, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true } }) }
    );
    if (!res.ok) throw new Error(`EL ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url); EL.currentAudio = audio;
    await new Promise((resolve, reject) => {
      audio.onplay = () => agentStatus.textContent = 'Speaking…';
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject; audio.play().catch(reject);
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
    u.onend = done; u.onerror = () => done(); state.synth.speak(u);
  });
}

async function speak(text) {
  setMicSpeaking();
  try {
    if (EL.enabled && EL.apiKey) await elevenLabsSpeak(text);
    else await browserSpeak(text);
  } finally { setMicIdle(); }
}

// ─── Pollinations AI + Local Fallback ────────────────────────────────────────
async function aiChat(userMsg) {
  if (userMsg) AI.history.push({ role: 'user', content: userMsg });

  // Try Pollinations (6s timeout)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...AI.history],
        model: 'openai', seed: Date.now() % 9999, stream: false,
      }),
    });
    clearTimeout(t);
    if (res.ok) {
      const raw = (await res.text()).trim();
      let text = raw;
      try { const j = JSON.parse(raw); text = j?.choices?.[0]?.message?.content || j?.text || raw; } catch(_) {}
      if (text && text.length > 10) {
        AI.history.push({ role: 'assistant', content: text });
        return text;
      }
    }
  } catch(e) { console.info('Using local AI:', e.message); }

  // Local AI fallback
  const text = AI.priya.respond(userMsg || '');
  AI.history.push({ role: 'assistant', content: text });
  return text;
}

function extractRecommendation(t) { const m=t.match(/\[RECOMMEND:(signature|platinum)\]/i); return m?m[1].toLowerCase():null; }
function cleanForSpeech(t)        { return t.replace(/\[RECOMMEND:(signature|platinum)\]/gi,'').trim(); }

// ─── Speech Recognition ───────────────────────────────────────────────────────
function startListening() {
  if (state.isSpeaking || state.isListening) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    micTip.textContent = '⚠️ Mic not supported — use the text box below';
    return;
  }

  if (isBrave) {
    // Brave blocks Google speech API — just show warning, keep text box focused
    setMicListening();
    state.isListening = true;
    if (textInput) textInput.focus();
    return;
  }

  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;

  let gotResult = false;
  state.isListening = true; state.manualStop = false;
  setMicListening();

  // Show "can't hear you" after 7 seconds with no result
  clearTimeout(state.silenceTimer);
  state.silenceTimer = setTimeout(() => {
    if (state.isListening && !state.isSpeaking) {
      micTip.textContent = "💬 Can't hear you — please type your answer below";
      if (textInput) textInput.focus();
    }
  }, 7000);

  rec.onresult = e => {
    gotResult = true;
    clearTimeout(state.silenceTimer);
    const text = e.results[0][0].transcript.trim();
    if (text) handleUserInput(text);
  };
  rec.onerror = e => {
    clearTimeout(state.silenceTimer);
    state.isListening = false; state.recognition = null;
    if (e.error === 'not-allowed') {
      setMicIdle(); micTip.textContent = '🔴 Mic blocked — type your answer below';
      if (textInput) textInput.focus(); return;
    }
    if (!state.manualStop && !state.isSpeaking) setTimeout(() => startListening(), 200);
    else setMicIdle();
  };
  rec.onend = () => {
    clearTimeout(state.silenceTimer);
    state.isListening = false; state.recognition = null;
    if (gotResult || state.isSpeaking) return;
    if (state.manualStop) { setMicIdle(); return; }
    setTimeout(() => startListening(), 200);
  };

  state.recognition = rec;
  try { rec.start(); }
  catch(e) { state.isListening = false; setMicIdle(); if (textInput) textInput.focus(); }
}

function stopListening() {
  clearTimeout(state.silenceTimer);
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
function setQuickReplies(opts = []) {
  quickReplies.innerHTML = '';
  opts.forEach(opt => {
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

  const response = await aiChat(text);
  hideTyping();
  const rec  = extractRecommendation(response);
  const clean = cleanForSpeech(response);

  state.turnCount++; setProgress(Math.min(state.turnCount, 4));
  showTyping(); await sleep(250); hideTyping();
  addMessage('agent', clean);
  await speak(clean);

  if (rec) { await sleep(500); showResult(rec, clean); }
  else startListening();
}

// ─── Start ────────────────────────────────────────────────────────────────────
async function startConversation() {
  agentStatus.textContent = 'Connecting…'; await sleep(400);
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
  const be = $('resultBenefits'); be.innerHTML = '';
  card.benefits.forEach(b => {
    const el = document.createElement('div'); el.className = 'benefit-item';
    el.innerHTML = `<div class="benefit-icon">${b.icon}</div><div class="benefit-text"><strong>${b.title}</strong>${b.desc}</div>`;
    be.append(el);
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
  const k = $('apiKeyInput').value.trim(); const btn = $('saveApiKey');
  if (!k) { setupModal.classList.add('hidden'); return; }
  btn.disabled = true; EL.modelId = $('modelSelect').value;
  const sv = document.querySelector('.voice-option.selected'); if (sv) EL.voiceId = sv.dataset.voice;
  showApiResult('apiTestResult', 'loading', '🔄 Testing ElevenLabs key…');
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': k, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello!', model_id: EL.modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail?.message||`Status ${res.status}`); }
    EL.apiKey = k; EL.enabled = true; sessionStorage.setItem('el_api_key', k);
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

// ─── Mic button ───────────────────────────────────────────────────────────────
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
  const winner = AI.priya.sig >= AI.priya.plat ? 'signature' : 'platinum';
  showResult(winner, 'Based on our conversation, here is your best card match.');
});
restartBtn.addEventListener('click', () => {
  state.synth.cancel(); if (EL.currentAudio) { EL.currentAudio.pause(); EL.currentAudio = null; }
  stopListening(); clearTimeout(state.silenceTimer);
  Object.assign(state, { isSpeaking: false, isListening: false, manualStop: false, turnCount: 0 });
  AI.history = []; AI.priya = new Priya();
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

  if (isBrave) {
    mainHintText.textContent = '⚠️ Brave browser detected — mic blocked. Use the text box or switch to Chrome for voice.';
    mainHintText.style.color = '#f59e0b';
  } else {
    mainHintText.textContent = '🧠 AI-powered · No setup required · Works best in Chrome';
  }

  const se = sessionStorage.getItem('el_api_key'); if (se) $('apiKeyInput').value = se;
  document.addEventListener('click', () => { if (!state.voices.length) loadVoices(); }, { once: true });
});
