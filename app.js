// ===== State =====
const state = {
  studentName: '',
  currentUnit: null,
  words: [],
  ex: {
    type: null,
    questions: [],
    index: 0,
    results: [],
    startTime: null,
    timer: null,
    timerRemaining: 0,
    answered: false
  }
};

// ===== DOM Cache =====
const $ = id => document.getElementById(id);
const dom = {
  loading: $('loading'),
  screens: {
    landing: $('screen-landing'),
    units: $('screen-units'),
    exercises: $('screen-exercises'),
    studyCards: $('screen-study-cards'),
    matching: $('screen-matching'),
    gap: $('screen-gap'),
    sentence: $('screen-sentence'),
    results: $('screen-results')
  },
  nameInput: $('name-input'),
  btnLandingNext: $('btn-landing-next'),
  unitCards: $('unit-cards'),
  exTitle: $('ex-unit-title'),
  exerciseCards: $('exercise-cards'),
  btnExBack: $('btn-ex-back'),
  // Study Cards
  scCounter: $('sc-counter'),
  scWord: $('sc-word'),
  scPronunciation: $('sc-pronunciation'),
  scSpeak: $('sc-speak'),
  scDefinition: $('sc-definition'),
  scSynonym: $('sc-synonym'),
  scExample: $('sc-example'),
  flipCard: $('flip-card'),
  btnScPrev: $('btn-sc-prev'),
  btnScNext: $('btn-sc-next'),
  btnScBack: $('btn-sc-back'),
  // Matching
  matchTitle: $('match-title'),
  matchProgress: $('match-progress'),
  matchTimer: $('match-timer'),
  matchPrompt: $('match-prompt'),
  matchPromptText: $('match-prompt-text'),
  matchSpeak: $('match-speak'),
  matchOptions: $('match-options'),
  matchFeedback: $('match-feedback'),
  btnMatchBack: $('btn-match-back'),
  // Gap
  gapProgress: $('gap-progress'),
  gapTimer: $('gap-timer'),
  gapSentence: $('gap-sentence'),
  gapOptions: $('gap-options'),
  gapFeedback: $('gap-feedback'),
  btnGapBack: $('btn-gap-back'),
  // Sentence
  sentProgress: $('sent-progress'),
  sentTimer: $('sent-timer'),
  sentWord: $('sent-word'),
  sentPronunciation: $('sent-pronunciation'),
  sentSpeak: $('sent-speak'),
  sentInput: $('sent-input'),
  btnSentSubmit: $('btn-sent-submit'),
  sentFeedback: $('sent-feedback'),
  btnSentBack: $('btn-sent-back'),
  // Results
  resultName: $('result-name'),
  resultUnit: $('result-unit'),
  resultExercise: $('result-exercise'),
  resultScore: $('result-score'),
  resultTime: $('result-time'),
  btnResultsUnits: $('btn-results-units')
};

// ===== Utilities =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getUnitWords(unitNum) {
  return state.words.filter(w => w.unit === unitNum);
}

function getDistractors(word, unitWords, count) {
  const others = unitWords.filter(w => w.id !== word.id);
  return shuffle(others).slice(0, count);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function speak(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.lang = 'en-US';
    speechSynthesis.speak(u);
  }
}

function clearExerciseTimer() {
  if (state.ex.timer) {
    clearInterval(state.ex.timer);
    state.ex.timer = null;
  }
}

// ===== Screen Management =====
function showScreen(id) {
  clearExerciseTimer();
  Object.values(dom.screens).forEach(s => s.classList.remove('active'));
  const screen = dom.screens[id];
  if (screen) screen.classList.add('active');
  window.scrollTo(0, 0);
}

// ===== Landing Screen =====
dom.nameInput.addEventListener('input', () => {
  const val = dom.nameInput.value.trim();
  dom.btnLandingNext.disabled = val.length < 1;
});

dom.btnLandingNext.addEventListener('click', () => {
  state.studentName = dom.nameInput.value.trim();
  if (state.studentName) {
    showScreen('units');
    renderUnits();
  }
});

dom.nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !dom.btnLandingNext.disabled) {
    dom.btnLandingNext.click();
  }
});

// ===== Unit Selection =====
function renderUnits() {
  const labels = ['A–E', 'F–P', 'Q–Z'];
  dom.unitCards.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const count = getUnitWords(i).length;
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `
      <span class="card-btn-icon">📘</span>
      <span class="card-btn-text">Unit ${i} (${labels[i-1]})</span>
      <span class="card-btn-sub">${count} words</span>
    `;
    btn.addEventListener('click', () => {
      state.currentUnit = i;
      showScreen('exercises');
      renderExercises(i);
    });
    dom.unitCards.appendChild(btn);
  }
}

// ===== Exercise Selection =====
const EXERCISES = [
  { id: 'study-cards', icon: '📚', label: 'Study Cards', desc: 'Learn with flip cards' },
  { id: 'matching-synonyms', icon: '🔗', label: 'Matching Synonyms', desc: '25s per question' },
  { id: 'matching-words', icon: '🔤', label: 'Matching Words', desc: '25s per question' },
  { id: 'matching-definitions', icon: '📖', label: 'Matching Definitions', desc: '25s per question' },
  { id: 'gap-filling', icon: '🧩', label: 'Gap Filling', desc: '30s per question' },
  { id: 'sentence-making', icon: '✍️', label: 'Sentence Making', desc: '15 words, 2 min each' }
];

function renderExercises(unitNum) {
  const label = ['A–E', 'F–P', 'Q–Z'][unitNum - 1];
  dom.exTitle.textContent = `Unit ${unitNum} (${label})`;
  dom.exerciseCards.innerHTML = '';
  EXERCISES.forEach(ex => {
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `
      <span class="card-btn-icon">${ex.icon}</span>
      <span class="card-btn-text">${ex.label}</span>
      <span class="card-btn-sub">${ex.desc}</span>
    `;
    btn.addEventListener('click', () => startExercise(unitNum, ex.id));
    dom.exerciseCards.appendChild(btn);
  });
}

dom.btnExBack.addEventListener('click', () => showScreen('units'));

// ===== Exercise Router =====
function startExercise(unitNum, type) {
  switch (type) {
    case 'study-cards': startStudyCards(unitNum); break;
    case 'matching-synonyms': startQuiz(unitNum, CONFIGS.matchingSynonyms); break;
    case 'matching-words': startQuiz(unitNum, CONFIGS.matchingWords); break;
    case 'matching-definitions': startQuiz(unitNum, CONFIGS.matchingDefinitions); break;
    case 'gap-filling': startQuiz(unitNum, CONFIGS.gapFilling); break;
    case 'sentence-making': startSentenceMaking(unitNum); break;
  }
}

// ===== Exercise Configurations =====
const CONFIGS = {
  matchingSynonyms: {
    id: 'matching-synonyms',
    title: 'Matching Synonyms',
    timerSeconds: 25,
    renderPrompt(word) {
      dom.matchPrompt.querySelector('.prompt-label').textContent = 'Word:';
      dom.matchPromptText.textContent = word.word;
    },
    buildOptions(word, unitWords) {
      const dist = getDistractors(word, unitWords, 3);
      return shuffle([
        { text: word.synonym, isCorrect: true },
        ...dist.map(d => ({ text: d.synonym, isCorrect: false }))
      ]);
    },
    speakWord(word) { return word.word; }
  },
  matchingWords: {
    id: 'matching-words',
    title: 'Matching Words',
    timerSeconds: 25,
    renderPrompt(word) {
      dom.matchPrompt.querySelector('.prompt-label').textContent = 'Synonym:';
      dom.matchPromptText.textContent = word.synonym;
    },
    buildOptions(word, unitWords) {
      const dist = getDistractors(word, unitWords, 3);
      return shuffle([
        { text: word.word, isCorrect: true },
        ...dist.map(d => ({ text: d.word, isCorrect: false }))
      ]);
    },
    speakWord(word) { return word.word; }
  },
  matchingDefinitions: {
    id: 'matching-definitions',
    title: 'Matching Definitions',
    timerSeconds: 25,
    renderPrompt(word) {
      dom.matchPrompt.querySelector('.prompt-label').textContent = 'Word:';
      dom.matchPromptText.textContent = word.word;
    },
    buildOptions(word, unitWords) {
      const dist = getDistractors(word, unitWords, 3);
      return shuffle([
        { text: word.definition, isCorrect: true },
        ...dist.map(d => ({ text: d.definition, isCorrect: false }))
      ]);
    },
    speakWord(word) { return word.word; }
  },
  gapFilling: {
    id: 'gap-filling',
    title: 'Gap Filling',
    timerSeconds: 30,
    screen: 'gap',
    renderPrompt(word) {
      const lower = word.example.toLowerCase();
      const target = word.word.toLowerCase();
      let result = '';
      let last = 0;
      let idx = lower.indexOf(target, last);
      while (idx !== -1) {
        result += word.example.slice(last, idx) + '_____';
        last = idx + word.word.length;
        idx = lower.indexOf(target, last);
      }
      result += word.example.slice(last);
      dom.gapSentence.textContent = result;
    },
    buildOptions(word, unitWords) {
      const dist = getDistractors(word, unitWords, 3);
      return shuffle([
        { text: word.word, isCorrect: true },
        ...dist.map(d => ({ text: d.word, isCorrect: false }))
      ]);
    }
  }
};

// ===== Study Cards =====
let scWords = [];
let scIndex = 0;

function startStudyCards(unitNum) {
  scWords = shuffle(getUnitWords(unitNum));
  scIndex = 0;
  showScreen('studyCards');
  showStudyCard(0);
}

function showStudyCard(index) {
  const w = scWords[index];
  if (!w) return;
  dom.flipCard.classList.remove('flipped');
  dom.scWord.textContent = w.word;
  dom.scPronunciation.textContent = w.pronunciation;
  dom.scDefinition.textContent = w.definition;
  dom.scSynonym.textContent = w.synonym;
  dom.scExample.textContent = w.example;
  dom.scCounter.textContent = `${index + 1} / ${scWords.length}`;
  dom.btnScPrev.disabled = index === 0;
  dom.btnScNext.disabled = index === scWords.length - 1;
}

dom.flipCard.addEventListener('click', () => {
  dom.flipCard.classList.toggle('flipped');
});

dom.scSpeak.addEventListener('click', (e) => {
  e.stopPropagation();
  const w = scWords[scIndex];
  if (w) speak(w.word);
});

dom.btnScPrev.addEventListener('click', () => {
  if (scIndex > 0) { scIndex--; showStudyCard(scIndex); }
});

dom.btnScNext.addEventListener('click', () => {
  if (scIndex < scWords.length - 1) { scIndex++; showStudyCard(scIndex); }
});

dom.btnScBack.addEventListener('click', () => {
  showScreen('exercises');
  renderExercises(state.currentUnit);
});

// ===== Quiz Runner (Matching + Gap) =====
function startQuiz(unitNum, config) {
  const unitWords = getUnitWords(unitNum);
  const shuffled = shuffle(unitWords);

  state.ex.type = config.id;
  state.ex.questions = shuffled.map(w => ({
    word: w,
    options: config.buildOptions(w, unitWords),
    answered: false
  }));
  state.ex.index = 0;
  state.ex.results = [];
  state.ex.startTime = Date.now();
  state.ex.answered = false;

  if (config.screen === 'gap') {
    showScreen('gap');
  } else {
    showScreen('matching');
    dom.matchTitle.textContent = config.title;
  }

  showQuizQuestion(config);
}

function showQuizQuestion(config) {
  const q = state.ex.questions[state.ex.index];
  if (!q) return finishQuiz(config);

  state.ex.answered = false;
  const total = state.ex.questions.length;

  // Render prompt
  config.renderPrompt(q.word);

  // Update progress display
  const isGap = config.screen === 'gap';
  const progressEl = isGap ? dom.gapProgress : dom.matchProgress;
  const timerEl = isGap ? dom.gapTimer : dom.matchTimer;
  const optionsEl = isGap ? dom.gapOptions : dom.matchOptions;
  const feedbackEl = isGap ? dom.gapFeedback : dom.matchFeedback;

  progressEl.textContent = `Question ${state.ex.index + 1} / ${total}`;
  timerEl.textContent = `${config.timerSeconds}s`;
  timerEl.classList.remove('warning');
  feedbackEl.classList.add('hidden');

  // Render options
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => handleQuizAnswer(i, config));
    optionsEl.appendChild(btn);
  });

  // Speak button for matching (not gap)
  if (!isGap && config.speakWord) {
    dom.matchSpeak.onclick = () => speak(config.speakWord(q.word));
  }

  // Start timer
  clearExerciseTimer();
  state.ex.timerRemaining = config.timerSeconds;
  state.ex.timer = setInterval(() => {
    state.ex.timerRemaining--;
    timerEl.textContent = `${state.ex.timerRemaining}s`;
    if (state.ex.timerRemaining <= 5) {
      timerEl.classList.add('warning');
    }
    if (state.ex.timerRemaining <= 0) {
      handleQuizTimeout(config);
    }
  }, 1000);
}

function handleQuizAnswer(optIndex, config) {
  if (state.ex.answered) return;
  state.ex.answered = true;
  clearExerciseTimer();

  const q = state.ex.questions[state.ex.index];
  const isCorrect = q.options[optIndex].isCorrect;
  const isGap = config.screen === 'gap';
  const optionsEl = isGap ? dom.gapOptions : dom.matchOptions;
  const feedbackEl = isGap ? dom.gapFeedback : dom.matchFeedback;
  const timerEl = isGap ? dom.gapTimer : dom.matchTimer;
  const btns = optionsEl.querySelectorAll('.option-btn');

  // Record result
  state.ex.results.push({
    wordId: q.word.id,
    correct: isCorrect,
    timedOut: false,
    timeSpent: config.timerSeconds - state.ex.timerRemaining
  });

  // Show feedback
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (q.options[i].isCorrect) btn.classList.add('correct');
    if (i === optIndex && !isCorrect) btn.classList.add('wrong');
  });

  timerEl.textContent = isCorrect ? '✓' : '✗';
  feedbackEl.textContent = isCorrect ? 'Correct!' : `Wrong. The answer was: ${q.options.find(o => o.isCorrect).text}`;
  feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
  feedbackEl.classList.remove('hidden');

  setTimeout(() => nextQuizQuestion(config), 1200);
}

function handleQuizTimeout(config) {
  if (state.ex.answered) return;
  state.ex.answered = true;
  clearExerciseTimer();

  const q = state.ex.questions[state.ex.index];
  const isGap = config.screen === 'gap';
  const optionsEl = isGap ? dom.gapOptions : dom.matchOptions;
  const feedbackEl = isGap ? dom.gapFeedback : dom.matchFeedback;
  const timerEl = isGap ? dom.gapTimer : dom.matchTimer;
  const btns = optionsEl.querySelectorAll('.option-btn');

  // Record as wrong
  state.ex.results.push({
    wordId: q.word.id,
    correct: false,
    timedOut: true,
    timeSpent: config.timerSeconds
  });

  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (q.options[i].isCorrect) btn.classList.add('correct');
  });

  timerEl.textContent = '⏰';
  feedbackEl.textContent = `Time's up! The answer was: ${q.options.find(o => o.isCorrect).text}`;
  feedbackEl.className = 'feedback wrong';
  feedbackEl.classList.remove('hidden');

  setTimeout(() => nextQuizQuestion(config), 1200);
}

function nextQuizQuestion(config) {
  state.ex.index++;
  if (state.ex.index >= state.ex.questions.length) {
    finishQuiz(config);
  } else {
    showQuizQuestion(config);
  }
}

function finishQuiz(config) {
  clearExerciseTimer();
  const total = state.ex.results.length;
  const correct = state.ex.results.filter(r => r.correct).length;
  const totalTime = Math.round((Date.now() - state.ex.startTime) / 1000);

  showResultsScreen({
    studentName: state.studentName,
    unit: state.currentUnit,
    exercise: config.title,
    correct,
    total,
    totalTime,
    results: state.ex.results
  });
}

// ===== Sentence Making =====
let sentWords = [];
let sentIndex = 0;
let sentResults = [];
let sentStartTime = null;
let sentTimerInterval = null;

function startSentenceMaking(unitNum) {
  const all = getUnitWords(unitNum);
  sentWords = shuffle(all).slice(0, 15);
  sentIndex = 0;
  sentResults = [];
  sentStartTime = Date.now();
  showScreen('sentence');
  showSentQuestion();
}

function showSentQuestion() {
  const w = sentWords[sentIndex];
  if (!w) return finishSentenceMaking();

  dom.sentWord.textContent = w.word;
  dom.sentPronunciation.textContent = w.pronunciation;
  dom.sentInput.value = '';
  dom.sentInput.disabled = false;
  dom.btnSentSubmit.disabled = false;
  dom.sentInput.focus();
  dom.sentFeedback.classList.add('hidden');
  dom.sentProgress.textContent = `Word ${sentIndex + 1} / ${sentWords.length}`;

  dom.sentSpeak.onclick = () => speak(w.word);

  clearExerciseTimer();
  let remaining = 120;
  dom.sentTimer.textContent = '2:00';
  dom.sentTimer.classList.remove('warning');

  if (sentTimerInterval) clearInterval(sentTimerInterval);
  sentTimerInterval = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    dom.sentTimer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    if (remaining <= 10) dom.sentTimer.classList.add('warning');
    if (remaining <= 0) {
      clearInterval(sentTimerInterval);
      handleSentTimeout();
    }
  }, 1000);

  state.ex.timer = sentTimerInterval;
}

dom.btnSentSubmit.addEventListener('click', handleSentSubmit);
dom.sentInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSentSubmit();
  }
});

function handleSentSubmit() {
  if (dom.sentInput.disabled) return;
  const w = sentWords[sentIndex];
  const sentence = dom.sentInput.value.trim();

  clearInterval(sentTimerInterval);

  let valid = false;
  let reason = '';
  if (sentence.length < 8) {
    reason = 'Sentence too short (min 8 characters).';
  } else if (!sentence.toLowerCase().includes(w.word.toLowerCase())) {
    reason = `Your sentence must contain the word "${w.word}".`;
  } else {
    valid = true;
  }

  dom.sentInput.disabled = true;
  dom.btnSentSubmit.disabled = true;

  sentResults.push({ wordId: w.id, sentence, valid });

  dom.sentFeedback.textContent = valid ? '✓ Good sentence!' : `✗ ${reason}`;
  dom.sentFeedback.className = `feedback ${valid ? 'correct' : 'wrong'}`;
  dom.sentFeedback.classList.remove('hidden');

  setTimeout(() => {
    sentIndex++;
    if (sentIndex >= sentWords.length) {
      finishSentenceMaking();
    } else {
      showSentQuestion();
    }
  }, 1500);
}

function handleSentTimeout() {
  const w = sentWords[sentIndex];
  dom.sentInput.disabled = true;
  dom.btnSentSubmit.disabled = true;

  sentResults.push({ wordId: w.id, sentence: '', valid: false });

  dom.sentFeedback.textContent = "Time's up! Moving to next word.";
  dom.sentFeedback.className = 'feedback wrong';
  dom.sentFeedback.classList.remove('hidden');

  setTimeout(() => {
    sentIndex++;
    if (sentIndex >= sentWords.length) {
      finishSentenceMaking();
    } else {
      showSentQuestion();
    }
  }, 1500);
}

function finishSentenceMaking() {
  clearInterval(sentTimerInterval);
  const total = sentResults.length;
  const correct = sentResults.filter(r => r.valid).length;
  const totalTime = Math.round((Date.now() - sentStartTime) / 1000);

  showResultsScreen({
    studentName: state.studentName,
    unit: state.currentUnit,
    exercise: 'Sentence Making',
    correct,
    total,
    totalTime,
    results: sentResults
  });
}

// ===== Results Screen =====
function showResultsScreen(data) {
  showScreen('results');
  dom.resultName.textContent = data.studentName;
  const label = ['A–E', 'F–P', 'Q–Z'][data.unit - 1];
  dom.resultUnit.textContent = `Unit ${data.unit} (${label})`;
  dom.resultExercise.textContent = data.exercise;
  const pct = data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : '0.0';
  dom.resultScore.textContent = `${data.correct} / ${data.total} (${pct}%)`;
  dom.resultTime.textContent = formatTime(data.totalTime);

  sendTelegramReport(data);
}

dom.btnResultsUnits.addEventListener('click', () => {
  showScreen('units');
  renderUnits();
});

// Back buttons for exercises
dom.btnMatchBack.addEventListener('click', () => {
  clearExerciseTimer();
  showScreen('exercises');
  renderExercises(state.currentUnit);
});

dom.btnGapBack.addEventListener('click', () => {
  clearExerciseTimer();
  showScreen('exercises');
  renderExercises(state.currentUnit);
});

dom.btnSentBack.addEventListener('click', () => {
  clearInterval(sentTimerInterval);
  showScreen('exercises');
  renderExercises(state.currentUnit);
});

// ===== Telegram Reporting =====
function sendTelegramReport(data) {
  const token = TELEGRAM_CONFIG.botToken;
  const chatId = TELEGRAM_CONFIG.chatId;
  if (!token || token === 'YOUR_BOT_TOKEN_HERE' || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    console.log('Telegram not configured. Skipping report.');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const pct = data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : '0.0';
  const label = ['A–E', 'F–P', 'Q–Z'][data.unit - 1];

  const message = [
    '\u{1F4DA} Academic Words for Reading and Listening',
    '',
    `\u{1F464} Student: ${data.studentName}`,
    `\u{1F4D8} Unit: Unit ${data.unit} (${label})`,
    `\u{270F}\u{FE0F} Exercise: ${data.exercise}`,
    `\u{1F4C5} Date: ${dateStr}   \u{23F0} Time: ${timeStr}`,
    '',
    `\u{2705} Score: ${data.correct} / ${data.total}   (${pct}%)`
  ].join('\n');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  }).catch(err => console.error('Telegram send failed:', err));
}

// ===== Init =====
async function init() {
  try {
    dom.loading.classList.remove('hidden');
    const res = await fetch('words.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.words = await res.json();
    console.log(`Loaded ${state.words.length} words`);
    dom.loading.classList.add('hidden');
    showScreen('landing');
    dom.nameInput.focus();
  } catch (err) {
    dom.loading.innerHTML = `<div class="loading-text">Failed to load words.json.<br>${err.message}<br><br>Make sure you're serving this via a local HTTP server (e.g. <code>npx serve .</code> or <code>python -m http.server</code>).</div>`;
  }
}

init();

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const active = document.querySelector('.screen.active');
    if (active) {
      const backBtn = active.querySelector('.btn-back');
      if (backBtn) backBtn.click();
    }
  }
});
