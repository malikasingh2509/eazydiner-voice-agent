# 🍽️ EazyDiner Credit Card Voice Agent

> An AI-powered voice sales agent that recommends the best EazyDiner credit card based on a customer's lifestyle — built with ElevenLabs TTS + Web Speech API.

---

## 📌 What This Does

This project simulates a **sales call from a bank representative** named *Priya*, who:

1. **Introduces herself** as an EazyDiner card advisor
2. **Asks 5 questions** about the customer's dining habits, spending, and lifestyle
3. **Compares both cards** using a real-time scoring engine
4. **Recommends** either the Signature or Platinum card
5. **Explains the benefits** and encourages the customer to apply

---

## 💳 The Two Cards

| Feature | Signature 💎 | Platinum ⚡ |
|---------|-------------|-----------|
| Annual Fee | ₹1,999/year | **Lifetime Free** |
| EazyDiner Prime | 1 Year (₹3,550 value) | 3 Months |
| Dining Discount | 25–50% off | 25–50% off |
| PayEazy Savings | 25% off (max ₹1,000) | 20% off (max ₹500) |
| Reward Points | **10 pts/₹100** dining | 2 pts/₹100 |
| Free Movies | 2/month (BookMyShow) | ❌ |
| Airport Lounge | 2 visits/quarter | ❌ |
| Best For | Heavy diners, travelers | Casual diners, beginners |

---

## 🎙️ Voice Technology

| Mode | Technology | Quality |
|------|-----------|---------|
| **Primary** | ElevenLabs API (optional) | 🔥 Hyper-realistic human voice |
| **Fallback** | Web Speech API (built-in) | 🤖 Browser voice, no setup needed |

The agent works **instantly without any API key** using the browser's built-in voice.

---

## 🚀 Live Demo

👉 **[Try it here](https://YOUR-USERNAME.github.io/eazydiner-voice-agent)**

> Works best in **Google Chrome** or **Microsoft Edge**

---

## 🛠️ How to Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/eazydiner-voice-agent.git

# Navigate to folder
cd eazydiner-voice-agent

# Serve locally (required for microphone access)
python3 -m http.server 5555

# Open in Chrome
http://localhost:5555
```

> ⚠️ Must be served via a server (not opened as a file) for microphone to work.

---

## 📁 Project Structure

```
eazydiner-voice-agent/
├── index.html       — UI layout, modal, all HTML elements
├── style.css        — Full design system, animations, glassmorphism
├── agent.js         — Conversation logic, scoring engine, TTS/STT
└── test_agent.js    — 160-test automated test suite
```

---

## 🧠 How the Recommendation Works

The agent uses a **weighted scoring engine** across 5 dimensions:

```
Customer Answer → Score Update → Final Winner
───────────────────────────────────────────────
"I dine out several times a week"  → Signature +3
"I prefer premium restaurants"     → Signature +3
"I spend above ₹20,000/month"      → Signature +3
"I travel and love movies"         → Signature +3
"Fine with annual fee"             → Signature +3

"I dine occasionally"              → Platinum +3
"I prefer casual dining"           → Platinum +3
"Below ₹10,000/month"              → Platinum +3
"Not into travel or movies"        → Platinum +3
"Prefer no annual fee"             → Platinum +3
```

Whichever card has the higher score at the end gets recommended.

---

## ✅ Task Requirements Checklist

- [x] Visited EazyDiner website and collected full card details
- [x] Voice agent built using ElevenLabs + Web Speech API
- [x] Agent introduces itself (Priya, EazyDiner Card Advisor)
- [x] Asks about dining habits, spending, lifestyle preferences
- [x] Compares both cards based on responses
- [x] Recommends the most suitable card
- [x] Explains key benefits of recommended card
- [x] Encourages customer to apply (Apply Now button → IndusInd Bank)
- [x] Does NOT ask about credit score (assumed good)
- [x] Full comparison table shown on result screen
- [x] 160 automated tests passing

---

## 🔊 Using ElevenLabs (Optional)

1. Create a free account at [elevenlabs.io](https://elevenlabs.io)
2. Go to **Profile → API Keys → Create Key**
3. Open the app → click **⚙️ Settings** (top right)
4. Paste your key → select voice → click **Save & Enable**

Free tier: 10,000 characters/month (plenty for testing)

---

## 🧪 Run Tests

```bash
node test_agent.js
# Expected output: 160/160 tests passed ✅
```

---

*Built for EazyDiner Internship Assignment | June 2026*
