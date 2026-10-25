/* ------------------------------------------------------------
   a tiny adventure – all story strings and choices in one place.
   Edit the dates here if the invitation changes.
   The secret word is stored lightly encoded so a quick look at
   the source does not spoil it (it decodes to the real word).
   ------------------------------------------------------------ */
window.TA_CONTENT = {
  secretEncoded: 'UGlyb3VldHRl',
  soundDefault: true,    // on by default (browsers still need a first tap before anything plays)
  dates: { friday: 'friday the 5th', saturday: 'saturday the 6th' },

  prologue: {
    heading: 'psst... there’s more.',
    sub: 'there’s a tiny secret hiding inside your invitation.',
    cta: 'let’s find it ♡',
  },

  map: {
    eyebrow: 'chapter 1 of 4',
    title: 'open the little map',
    instruction: 'tap the three folded corners to open the map.',
    helper: 'each little fold hides a clue.',
    note: 'probably the right way.',
    note2: 'trust me.',
    bridge: 'a tiny rink... and a secret upstairs!',
    next: 'follow the map',
  },

  lane: {
    eyebrow: 'chapter 2 of 4',
    title: 'the snowy little lane',
    instruction: 'turn the little path pieces so the footprints reach the rink.',
    helper: 'tap a piece to rotate it.',
    bridge: 'pawprints all the way to the rink!',
    next: 'on to the booth',
  },

  balcony: {
    eyebrow: 'a tiny flashback',
    title: 'operation: totally normal entrance',
    instruction: 'a true story from geneva. mostly.',
    skip: 'skip the flashback',
    captions: {
      arrive: 'once upon a time, in geneva...',
      bus: 'he walked her to the bus. she had work.',
      back: 'then he went back to her place to wait for her.',
      problem: 'there was just one tiny problem.',
      forgot: 'he forgot the door code.',
      plan: 'fortunately, he had a perfectly reasonable backup plan.',
      setback: 'minor setback.',
      setback2: 'slightly bigger setback.',
      later: '...a few hours later.',
      her: 'oh. my. gosh.',
    },
    busSign: 'work',
    bridge: 'some cats never learn.',
    bridge2: 'good thing we’re building proper stairs this time.',
    next: 'build proper stairs',
  },

  stairs: {
    eyebrow: 'chapter 3 of 4',
    title: 'a tiny staircase!',
    instruction: 'put the three objects on the glowing outlines to reach the envelope.',
    helper: 'tap an object, then its matching outline (or drag it).',
    label: 'the secret is up there!',
    tray: 'little helpers',
    progress: (n) => `${n} / 3 steps built`,
    bridge: 'got it! but it’s sealed with a tiny ice lock...',
    next: 'to the rink',
  },

  rink: {
    eyebrow: 'chapter 4 of 4',
    title: 'one little spin to unlock it',
    instruction: 'tap the four glowing beats to help them twirl.',
    helper: 'no rush \u2014 it\u2019s not a timing game.',
    nailed: 'nailed it.',
    dance: 'a secret little dance',
    bridge: 'the little ice lock clicked open!',
    next: 'open it ♡',
  },

  epilogue: {
    found: 'you found it!',
    label: 'your secret word is',
    sentence: 'now send me a tiny letter with your answer, the date that works for you, and the secret word. ♡',
    replyTitle: 'a tiny reply',
    replyHint: 'pick what fits, add a note if you like, then copy it into a message (or write it by hand).',
    answers: ['yes, i’d love to!', 'i need to check', 'i can’t make it'],
    dateChoices: ['friday the 5th', 'saturday the 6th', 'either works', 'another date'],
    noteLabel: 'a little note (optional)',
    notePlaceholder: 'a little note...',
    copy: 'copy my little letter',
    copied: 'copied! paste it into a message ♡',
    copyFail: 'your browser blocked copying, so here is the letter to select and copy by hand:',
    byHand: 'write it by hand instead ♡',
    byHandNote: 'lovely. any paper will do. don’t forget the secret word.',
    toOffice: 'file the official paperwork ♡',
    toOfficeHint: 'the department needs your decision in writing.',
  },

  // the last view: the department's counter, and the application that doubles as her reply
  office: {
    eyebrow: 'one last formality',
    title: 'the official paperwork',
    instruction: 'the department of extremely important romantic affairs requires her majesty’s decision in writing.',
    helper: 'choose her majesty’s decision and a date, then stamp it.',
    doc: {
      title: 'official date application',
      dept: 'department of extremely important romantic affairs',
      rows: [
        ['applicant', 'one suspiciously enthusiastic blue cat'],
        ['purpose', 'attendance at art on ice with a very special pink cat'],
        ['secret authorization code', '{word}'],
        ['delivery method', 'carrier pigeon, naturally.'],
      ],
      statusLabel: 'status',
      status: { none: 'awaiting her majesty’s decision', yes: 'approved. the applicant is beside himself.', check: 'pending. the applicant is pacing.', no: 'declined. an appeal has been filed.' },
      footnote: 'form 1/1 · filed in triplicate · one copy eaten',
    },
    decision: 'her majesty’s decision',
    date: 'preferred date',
    stampBtn: 'stamp',
    restampBtn: 'stamp again',
    stampWait: 'choose a decision and a date first.',
    sealLabel: 'for official use only',
    kachunk: 'ka-chunk!',
    stamps: { yes: 'approved', check: 'pending', no: 'declined' },
    gag: ['no.', 'nice try.', 'still no.', 'we’ve been over this.'],   // what the clerk says when he drops onto a "no" button; he never lets it through
    notified: 'a copy has also gone straight to the department’s phone.',   // shown once the real notification has left (js/notify.js)
    dispatched: { yes: 'carrier pigeon dispatched. the applicant is beside himself.', check: 'carrier pigeon dispatched. the applicant will wait by the window.', no: 'carrier pigeon dispatched. the applicant has filed an appeal.' },
    replyTitle: 'the official reply',
    replyHint: 'the following correspondence is to be delivered by carrier pigeon. the pigeon being imaginary, kindly copy it into a message (or transcribe it by hand).',
    copy: 'copy the official reply',
    copied: 'copied. kindly paste it into a message ♡',
    copyFail: 'your browser blocked copying, so here is the reply to select and copy by hand:',
    byHand: 'transcribe it by hand instead ♡',
    byHandNote: 'splendid. any parchment will do. kindly include the authorization code.',
    replay: 'replay our little adventure',
    // the reply itself: overly formal, as is proper. The royal we. (kind: yes / check / no; dateIdx: index into epilogue.dateChoices)
    letter: (kind, dateIdx, word) => {
      const decision = {
        yes: 'with reference to your application of recent date, we are pleased to inform you that, following careful and entirely impartial deliberation, it has been approved.',
        check: 'with reference to your application of recent date, we wish to inform you that it remains under careful consideration.',
        no: 'with reference to your application of recent date, we regret to inform you that it cannot be granted at this time.',
      }[kind] || '';
      const when = [
        'we shall attend art on ice on friday the 5th.',
        'we shall attend art on ice on saturday the 6th.',
        'either date is agreeable to us. the applicant may choose (wisely).',
        'we kindly request that an alternative date be proposed at the applicant’s earliest convenience.',
      ][dateIdx] || '';
      return [
        'to: the department of extremely important romantic affairs',
        'attn: one suspiciously enthusiastic blue cat',
        're: official date application no. 1 (art on ice)',
        '',
        'dear sir,',
        '',
        decision,
        '',
        when,
        '',
        `secret authorization code: ${word}`,
        '',
        'kindly acknowledge receipt at your earliest convenience.',
        '',
        'yours most faithfully,',
        'her majesty the pink cat ♡',
        '',
        'signed, sealed and stamped.',
        'p.s. the pigeon has been fed.',
      ].join('\n');
    },
  },

  ui: {
    soundOff: 'sound: off',
    soundOn: 'sound: on',
    hint: 'show hint',
    skip: 'skip puzzle',
    progressOf: (n) => `${n} of 4`,
    tapToContinue: 'continue',
  },
};
