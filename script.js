
(() => {
  const LESSON_LINES = ["Hey Riley! Today we’re learning a super useful spelling rule.", "It’s called the CVC Doubling Rule — we use it to guard a short vowel.", "CVC means: consonant, vowel, consonant. Like r-u-n… run.", "Here’s the big idea: when a vowel suffix tries to sneak in — like -ing, -ed, -er, -est, or -y — it can make the vowel sound long.", "Example: hope plus ing becomes hoping. The o changes to a long o.", "But with a short vowel word like hop, we want the o to stay short.", "So we double the last consonant to lock the vowel in: hop plus ing becomes hopping.", "Let’s say the checklist together.", "One: is it one syllable? Two: does it have one short vowel? Three: does it end in one consonant? Four: does the suffix start with a vowel?", "If yes to all four… double the final consonant!", "Examples: run to running. sit to sitter. stop to stopped. big to biggest.", "Now when do we NOT double?", "If the suffix starts with a consonant — like sad plus ness. No doubling.", "If the base word has two vowels — like read plus ing. No doubling.", "If the base word ends with two consonants — like jump plus ing. No doubling.", "And we never double w, x, or y.", "Alright — lesson complete. Now we practice with sentences!"];
  const PRACTICE = [{"word": "running", "sentence": "Every morning, I am __ around the block."}, {"word": "hopping", "sentence": "The bunny is __ over a log."}, {"word": "sitting", "sentence": "I am __ at my desk doing homework."}, {"word": "stopped", "sentence": "The rain __, and the sun came out."}, {"word": "biggest", "sentence": "That was the __ snowman on the hill."}, {"word": "swimmer", "sentence": "My cousin is a fast __."}, {"word": "funnier", "sentence": "That joke was even __ the second time."}, {"word": "sunniest", "sentence": "Saturday was the __ day this week."}, {"word": "clapping", "sentence": "The crowd started __ for the band."}, {"word": "skipped", "sentence": "We __ rocks across the lake."}, {"word": "grinning", "sentence": "Riley was __ when she heard the good news."}, {"word": "dropped", "sentence": "I __ my pencil, so I picked it up."}, {"word": "hugging", "sentence": "The little girl was __ her puppy."}, {"word": "planning", "sentence": "We are __ a fun day at the park."}, {"word": "trimming", "sentence": "Dad is __ the hedge in the yard."}, {"word": "drumming", "sentence": "He was __ on the table with his fingers."}, {"word": "slipped", "sentence": "My shoe __ on the wet floor."}, {"word": "shipping", "sentence": "The store is __ the package today."}, {"word": "bigger", "sentence": "This puzzle is __ than the last one."}, {"word": "happy", "sentence": "Riley felt __ after the surprise."}, {"word": "saddest", "sentence": "That was the __ scene in the movie."}, {"word": "robbed", "sentence": "The thief __ the bank in the story."}, {"word": "jogging", "sentence": "My aunt goes __ after dinner."}, {"word": "spitting", "sentence": "The baby was __ out her carrots."}, {"word": "sipped", "sentence": "She __ her hot cocoa slowly."}, {"word": "hottest", "sentence": "July is usually the __ month."}, {"word": "fatter", "sentence": "The bear looked __ before winter."}, {"word": "muddier", "sentence": "The trail got __ after the storm."}, {"word": "foggy", "sentence": "The morning was __ near the river."}, {"word": "sunny", "sentence": "The beach day was __ and bright."}];

  // UI
  const stagePill = document.getElementById('stagePill');
  const masteryPill = document.getElementById('masteryPill');
  const teacherLine = document.getElementById('teacherLine');
  const sentenceLine = document.getElementById('sentenceLine');
  const subLine = document.getElementById('subLine');
  const answer = document.getElementById('answer');
  const checkBtn = document.getElementById('checkBtn');
  const feedback = document.getElementById('feedback');

  const playBtn = document.getElementById('playBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const resetBtn = document.getElementById('resetBtn');

  const voiceSel = document.getElementById('voiceSel');
  const speed = document.getElementById('speed');
  const speedLbl = document.getElementById('speedLbl');
  const soundSel = document.getElementById('soundSel');

  const correctEl = document.getElementById('correct');
  const attemptsEl = document.getElementById('attempts');
  const streakEl = document.getElementById('streak');
  const triesEl = document.getElementById('tries');
  const xpEl = document.getElementById('xp');
  const accuracyEl = document.getElementById('accuracy');

  // State
  const state = {
    mode: 'idle', // idle | teaching | practice
    lessonIdx: 0,
    practiceIdx: 0,
    lastSpokenText: '',
    speaking: false,
    cancelled: false,
    correct: 0,
    attempts: 0,
    streak: 0,
    tries: 0,
    xp: 0,
    currentWord: null,
    currentSentence: null,
    missesOnCurrent: 0,
    speechToken: 0,
    // practice flow
    queue: [],
    recycle: [],
  };

  // --- Poses + celebration FX ---
  const POSES = {
    neutral: 'riley-avatar.png',
    celebrate: 'pose_celebrate.png',
    sad: 'pose_sad.png',
  };
  const rileyImg = document.getElementById('rileyImg');
  let poseTimer = null;
  function setPose(key, ms=0){
    if(!rileyImg) return;
    if(poseTimer){ clearTimeout(poseTimer); poseTimer=null; }
    rileyImg.src = POSES[key] || POSES.neutral;
    if(ms>0){
      poseTimer = setTimeout(()=>{ rileyImg.src = POSES.neutral; }, ms);
    }
  }

  // Simple fireworks burst on a full-screen canvas
  const fxCanvas = document.getElementById('fxCanvas');
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
  function resizeFx(){
    if(!fxCanvas) return;
    fxCanvas.width = Math.floor(window.innerWidth * (window.devicePixelRatio||1));
    fxCanvas.height = Math.floor(window.innerHeight * (window.devicePixelRatio||1));
    fxCanvas.style.width = window.innerWidth + 'px';
    fxCanvas.style.height = window.innerHeight + 'px';
    if(fxCtx){ fxCtx.setTransform((window.devicePixelRatio||1),0,0,(window.devicePixelRatio||1),0,0); }
  }
  window.addEventListener('resize', resizeFx);
  resizeFx();
  function fireworksBurst(durationMs=1200){
    if(!fxCanvas || !fxCtx) return;
    fxCanvas.style.display = 'block';
    const start = performance.now();
    const particles = [];
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.25;
    const n = 70;
    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i)/n;
      const sp = 2.5 + Math.random()*4.0;
      particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0});
    }
    function tick(t){
      const dt = 16;
      fxCtx.clearRect(0,0,window.innerWidth,window.innerHeight);
      for(const p of particles){
        p.life += dt;
        p.vy += 0.05;
        p.x += p.vx;
        p.y += p.vy;
        const alpha = Math.max(0, 1 - (t-start)/durationMs);
        fxCtx.globalAlpha = alpha;
        fxCtx.beginPath();
        fxCtx.arc(p.x,p.y,2.2,0,Math.PI*2);
        fxCtx.fill();
      }
      fxCtx.globalAlpha = 1;
      if(t-start < durationMs){ requestAnimationFrame(tick); }
      else{ fxCtx.clearRect(0,0,window.innerWidth,window.innerHeight); fxCanvas.style.display='none'; }
    }
    requestAnimationFrame(tick);
  }

  function setStage(s){ stagePill.textContent = s; }

  function updateStats(){
    correctEl.textContent = String(state.correct);
    attemptsEl.textContent = String(state.attempts);
    streakEl.textContent = String(state.streak);
    triesEl.textContent = String(state.tries);
    xpEl.textContent = String(state.xp);
    const acc = state.attempts ? Math.round((state.correct/state.attempts)*100) : 0;
    masteryPill.textContent = acc + '%';
    accuracyEl.textContent = acc + '%';
  }

  // ---------- Speech (robust queue) ----------
  function soundOn(){ return soundSel.value === 'on'; }
  function rate(){ return Number(speed.value) || 0.98; }

  function getSelectedVoice(){
    const voices = speechSynthesis.getVoices();
    const vId = voiceSel.value;
    return voices.find(v => v.voiceURI === vId) || voices.find(v => v.name === vId) || null;
  }

  function speak(text, {token=null, interrupt=false} = {}){
    // Speech queue control: interrupt cancels any current/pending speech and bumps the token.
    if(interrupt){
      state.speechToken = (state.speechToken||0) + 1;
      try{ speechSynthesis.cancel(); }catch(e){}
    }
    const myToken = token ?? (state.speechToken||0);
    state.lastSpokenText = text;
    if(!soundOn()) return Promise.resolve();

    return new Promise((resolve)=>{
      try{
        const u = new SpeechSynthesisUtterance(String(text||''));
        u.rate = Math.max(0.6, Math.min(1.25, Number(speed.value)||1));
        const v = getSelectedVoice();
        if(v) u.voice = v;
        u.onend = ()=> resolve();
        u.onerror = ()=> resolve();
        speechSynthesis.speak(u);
      }catch(e){
        resolve();
      }
    });
  }

  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  // ---------- Voices list ----------
  function buildVoiceList(){
    const voices = speechSynthesis.getVoices().filter(v => (v.lang||'').toLowerCase().startsWith('en-us'));
    voiceSel.innerHTML = '';

    const pref = [
      v => /google us english/i.test(v.name),
      v => /samantha/i.test(v.name),
      v => /ava/i.test(v.name),
      v => /alloy|verse|nova/i.test(v.name),
    ];

    const sorted = voices.slice().sort((a,b)=>{
      const score = (v)=>{
        let s=0;
        pref.forEach((fn,i)=>{ if(fn(v)) s += (10-i); });
        if(/microsoft/i.test(v.name)) s -= 2;
        return -s;
      };
      return score(a) - score(b);
    });

    for(const v of sorted){
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = v.name + ' (' + v.lang + ')';
      voiceSel.appendChild(opt);
    }

    // default
    const best = sorted.find(v => /google us english/i.test(v.name)) || sorted[0];
    if(best) voiceSel.value = best.voiceURI;
  }

  // Safari needs a tick to populate voices
  function initVoices(){
    buildVoiceList();
    if(!voiceSel.options.length){
      setTimeout(buildVoiceList, 250);
      setTimeout(buildVoiceList, 650);
    }
  }

  // ---------- Lesson flow ----------
  async function runTeaching(){
    state.mode = 'teaching';
    // Interrupt any prior speech once, then speak the lesson smoothly without cancelling mid-line.
    state.speechToken = (state.speechToken||0) + 1;
    const tok = state.speechToken;
    try{ speechSynthesis.cancel(); }catch(e){}
    setStage('Teaching');
    answer.disabled = true;
    checkBtn.disabled = true;
    feedback.style.display='none';

    for(; state.lessonIdx < LESSON_LINES.length; state.lessonIdx++){
      if(state.cancelled) return;
      const line = LESSON_LINES[state.lessonIdx];
      teacherLine.textContent = line;
      sentenceLine.textContent = 'Teaching… listen to the lesson. Practice starts after teaching.';
      subLine.textContent = 'Tip: Press Repeat to hear the last line again.';
      await speak(line, {token: tok});
      await wait(250);
    }

    // Transition
    teacherLine.textContent = 'Great job. Now it’s your turn — practice time!';
    await speak('Great job. Now it’s your turn — practice time!', {token: tok});
    await wait(200);

    await startPractice();
  }

  function shuffleInPlace(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }

  function refillQueue(){
    // Only recycle words Riley missed (after 3 tries). If nothing missed, reshuffle full bank.
    if(state.queue.length===0){
      if(state.recycle.length>0){
        state.queue = shuffleInPlace(state.recycle.slice());
        state.recycle = [];
      } else {
        state.queue = shuffleInPlace(PRACTICE.slice());
      }
    }
  }

  function choosePracticeItem(){
    refillQueue();
    const item = state.queue.shift();
    state.currentItem = item;
    state.currentWord = item.word;
    state.currentSentence = item.sentence;
    state.missesOnCurrent = 0;
    sentenceLine.textContent = 'Sentence: ' + item.sentence;
    subLine.textContent = 'Listen: sentence first, then the word. Type the missing word.';
    answer.value = '';
    answer.focus();
    feedback.style.display='none';
  }

  async function speakPracticePrompt(){
    // Interrupt any previous prompt so we never race or overlap speech.
    state.speechToken = (state.speechToken||0) + 1;
    const tok = state.speechToken;
    try{ speechSynthesis.cancel(); }catch(e){}

    const sent = state.currentSentence;
    const word = state.currentWord;
    // Speak sentence with a pause, then the target word.
    await speak('Sentence. ' + String(sent||'').replace('__','blank'), {token: tok});
    await wait(280);
    await speak('Word. ' + String(word||'') + '.', {token: tok});
  }

  async function startPractice(){
    state.mode = 'practice';
    setStage('Guided');
    answer.disabled = false;
    checkBtn.disabled = false;
    state.queue = [];
    state.recycle = [];
    choosePracticeItem();
    // Auto-read prompt once when practice begins
    await speakPracticePrompt();
  }

  async function handlePlay(){
    state.cancelled = false;

    if(state.mode === 'idle'){
      state.lessonIdx = 0;
      teacherLine.textContent = 'Starting lesson…';
      await wait(50);
      await runTeaching();
      return;
    }

    if(state.mode === 'teaching'){
      // replay current line (don't skip ahead)
      state.speechToken++;
      const tok = state.speechToken;
      try{ speechSynthesis.cancel(); }catch(e){}
      const idx = Math.min(state.lessonIdx, LESSON_LINES.length-1);
      const line = LESSON_LINES[idx] || 'Teaching in progress.';
      teacherLine.textContent = line;
      await speak(line, {token: tok});
      return;
    }

    if(state.mode === 'practice'){
      await speakPracticePrompt();
    }
  }

  async function handleRepeat(){
    if(state.lastSpokenText){
      await speak(state.lastSpokenText, {interrupt:true});
    } else if(state.mode === 'practice'){
      await speakPracticePrompt();
    } else {
      await speak('Press Play to start.');
    }
  }

  function showFeedback(ok, msg){
    feedback.style.display='flex';
    feedback.classList.toggle('good', ok);
    feedback.textContent = String(msg ?? '');
  }

  function showFeedbackHTML(ok, html){
    feedback.style.display='flex';
    feedback.classList.toggle('good', ok);
    feedback.innerHTML = html;
  }

  async function speakSpelling(word, token){
    // Speak the word, then spell it out loud letter-by-letter.
    const w = String(word||'').trim();
    if(!w) return;
    await speak(`The correct spelling is ${w}.`, { token });
    await wait(120);
    const letters = w.toUpperCase().split('').join(' ');
    await speak(`Spell it: ${letters}.`, { token });
  }

  async function nextItem(){
    choosePracticeItem();
    await wait(120);
    await speakPracticePrompt();
  }

  async function check(){
    if(state.mode !== 'practice') return;

    const got = (answer.value||'').trim().toLowerCase();
    const want = (state.currentWord||'').trim().toLowerCase();
    if(!got) return;

    state.attempts++;
    state.tries++;

    // Stop any ongoing sentence/word prompt so feedback coaching doesn't get cut off.
    state.speechToken = (state.speechToken||0) + 1;
    const tok = state.speechToken;
    try{ speechSynthesis.cancel(); }catch(e){}

    if(got === want){
      state.correct++;
      state.streak++;
      state.xp += 10;
      updateStats();
      showFeedback(true, 'Correct!');
      // celebrate (brief)
      setPose('celebrate', 1200);
      burstFireworks(1200);
      await speak('Correct! Nice work.', {token: tok});
      await wait(250);
      await nextItem();
      return;
    }

    // incorrect
    setPose('sad', 900);
    state.streak = 0;
    state.missesOnCurrent++;
    updateStats();

    if(state.missesOnCurrent < 3){
      showFeedback(false, 'Try again. Say the base word in your head. Is the vowel short?');
      await speak("Not yet. Say the base word. If the vowel sounds short and it's C-V-C, you usually double the last consonant before the ending. Try again.", {token: tok});
      // Do not repeat the sentence after an incorrect response — let her try again.
      return;
    }
    // 3 misses: SHORT coach + reveal correct spelling (shown + spoken + spelled) then advance.
    if(state.currentItem) state.recycle.push(state.currentItem);
    const correct = want;
    const shortCoach = [
      "Let's lock the vowel.",
      "If the word ends C V C and the ending starts with a vowel, we double the last consonant.",
      "Watch: the extra vowel would try to change the short vowel — like hoping versus hopping."
    ];

    // Keep the on-screen coaching compact.
    showFeedbackHTML(false, `Let's lock the vowel. <br><br><strong>Correct spelling:</strong> ${correct}`);

    // Speak the coaching in a natural, short sequence.
    for(const line of shortCoach){
      await speak(line, {token: tok});
      await wait(160);
    }

    // Say + spell the correct word before advancing.
    await speak('Correct spelling is ' + correct + '.', {token: tok});
    await wait(120);
    await speak('Spell it: ' + String(correct).split('').join(' ') + '.', {token: tok});
    await wait(250);

    await nextItem();

  }

  function resetAll(){
    state.cancelled = true;
    try{ speechSynthesis.cancel(); }catch(e){}

    state.mode = 'idle';
    state.lessonIdx = 0;
    state.practiceIdx = 0;
    state.lastSpokenText = '';
    state.correct = 0;
    state.attempts = 0;
    state.streak = 0;
    state.tries = 0;
    state.xp = 0;
    state.currentWord = null;
    state.currentSentence = null;
    state.missesOnCurrent = 0;

    setStage('Intro');
    teacherLine.innerHTML = 'Press <strong>Play</strong> to start the lesson.';
    sentenceLine.innerHTML = 'Press <strong>Play</strong> to begin teaching. Practice starts after the lesson.';
    subLine.textContent = 'You will hear a sentence and a word. Type the missing word.';
    answer.value = '';
    answer.disabled = true;
    checkBtn.disabled = true;
    feedback.style.display='none';
    updateStats();
  }

  // Events
  playBtn.addEventListener('click', () => { handlePlay(); });
  repeatBtn.addEventListener('click', () => { handleRepeat(); });
  resetBtn.addEventListener('click', () => { resetAll(); });

  checkBtn.addEventListener('click', () => { check(); });
  answer.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); check(); } });

  speed.addEventListener('input', ()=>{ speedLbl.textContent = (Number(speed.value)).toFixed(2) + '×'; });
  soundSel.addEventListener('change', ()=>{ if(!soundOn()) { try{ speechSynthesis.cancel(); }catch(e){} } });

  // init
  initVoices();
  if('speechSynthesis' in window){
    window.speechSynthesis.onvoiceschanged = () => buildVoiceList();
  }
  updateStats();
  resetAll();

})();
