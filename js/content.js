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
    replay: 'replay our little adventure',
    letter: (answer, date, note, word) =>
      `dear blue cat,\n\nmy answer: ${answer}\nthe date that works for me: ${date}` +
      (note ? `\n\na little note: ${note}` : '') +
      `\n\nsecret word: ${word}\n\n♡ pink cat`,
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
