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
      arrive: 'once upon a time, a very clever cat visited geneva...',
      problem: 'there was just one tiny problem.',
      forgot: 'he forgot the door code.',
      plan: 'fortunately, he had a perfectly reasonable backup plan.',
      her: 'oh. it’s this guy again.',
    },
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
    letter: (answer, date, note, word) =>
      `dear blue cat,\n\nmy answer: ${answer}\nthe date that works for me: ${date}` +
      (note ? `\n\na little note: ${note}` : '') +
      `\n\nsecret word: ${word}\n\n♡ pink cat`,
  },

  // the last view: the department's counter, and the application that doubles as her reply
  office: {
    eyebrow: 'one last formality',
    title: 'the official paperwork',
    instruction: 'the department of extremely important romantic affairs requires her majesty’s decision in writing.',
    helper: 'pick what fits, add a remark if you like, then stamp it.',
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
    remarks: 'royal remarks (optional)',
    remarksPlaceholder: 'a little note for the applicant...',
    stampBtn: 'stamp it ♡',
    restampBtn: 'stamp it again',
    stamps: { yes: 'approved', check: 'pending', no: 'declined' },
    gag: ['no.', 'nice try.', 'still no.', 'we’ve been over this.'],   // what the clerk says when he drops onto a "no" button; he never lets it through
    dispatched: { yes: 'carrier pigeon dispatched. he is beside himself.', check: 'carrier pigeon dispatched. he will wait by the window.', no: 'carrier pigeon dispatched. he has filed an appeal.' },
    replyTitle: 'the official reply',
    replyHint: 'this is the letter the pigeon carries. the pigeon is imaginary, so please copy it into a message (or write it by hand).',
    copy: 'copy my little letter',
    copied: 'copied! paste it into a message ♡',
    copyFail: 'your browser blocked copying, so here is the letter to select and copy by hand:',
    byHand: 'write it by hand instead ♡',
    byHandNote: 'lovely. any paper will do. don’t forget the secret word.',
    replay: 'replay our little adventure',
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
