# a tiny adventure

The next chapter of the Art on Ice booklet, hidden behind its QR code: the two cats open a tiny map, walk a snowy lane, sit through a short flashback about a door code, build a staircase up to the balcony of that very house, unlock a heart-shaped ice lock with a little skating twirl (his goes wrong first; a kiss fixes it), and find the secret word. The last view is the Department of Extremely Important Romantic Affairs, where the official date application doubles as her reply (decision, date, remarks, a stamp, a carrier pigeon) and the letter can be copied. Nothing is sent anywhere.

Plain HTML, CSS and JavaScript. No build step, no backend, no analytics, no external requests. Fonts and artwork are local files.

## Design kit alignment

Built against `art_on_ice_claude_pack` (master prompt, docs/STORY_AND_GAMES.md, docs/DESIGN_SYSTEM.md, docs/QA_ACCEPTANCE.md, config/content.json). Copies of `content.json` and `design-tokens.css` sit in `kit/` for reference; the live strings are in `js/content.js` (same words, curly apostrophes) and the live tokens in `css/style.css`.

- Story: continuation of the booklet (no second delivery), prologue + four games + finale, codeword hidden until the finale, dates quoted exactly as printed with no month or year.
- Sound: on by default (`soundDefault: true` in `js/content.js`; the kit's `content.json` says `false`, flip the flag to go back). The little effects are synthesised, nothing plays before the first tap, the toggle is remembered.
- Music: the attached cat cover (`assets/audio/lover-cat-cover.mp3`, your file, 1:21, loops). It is played through a plain `<audio loop>` element on purpose: on an iPhone that keeps playing even with the ringer switch on silent, and while it plays the little effects pass the switch too. Its level is baked into the file (normalised to about -19 LUFS, peaks at -6 dBFS, the original was a hot -12 LUFS with clipping) because iOS ignores the `volume` property. Browsers block sound before the first interaction, so on a fresh visit the song starts on her first tap (normally "let's find it ♡"); where the browser already trusts the page it starts on open. The sound toggle pauses and resumes it, and it pauses when the tab is hidden. The rights to the recording are yours to consider: the site is unlisted (`noindex`) but public.
- Cats: two canonical vector cats (`js/cat.js`). The body is the printed blue cat's actual outline (ears and tail removed, scan noise smoothed, the foot fluff kept) with the printed mane added back as a column of pointed tufts down each side; flat fills sampled from the print. The face and paws are not redrawn at all: the ω mouth, the open mouth with its tongue, the "> <" squint, the little caret, the "///" blush, the "m m" paws and the bow are traced from the booklet cutouts as filled ink shapes (`shots/cat/trace.py`), each normalised to the rig's face frame by its drawing's eye spacing, so they are the printed strokes themselves, hand-drawn thickness included. Expression presets only combine faces that appear in the booklet (dots + ω, dots + open mouth, squint + open mouth, dots + caret). No whiskers (four of the five printed cats have none). The pink cat is the mirrored rig with the bow on her far ear, as printed.
- Tokens: paper #fffdfc, ink #191717, secondary ink #575354, blue #bfddfb, pink #f9d5e4, heart #f49fbb, rink #e9f4fd, butter #fff0bf, lavender #ece8fa; 16px button radius, 22px scene radius, 900px stage, Itim + Nunito.
- The reference PDF and anti-reference screenshots are not shipped.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000      # then open http://localhost:8000
```

(Opening the file directly works too; everything is relative.)

## Files (component map)

```
index.html            page skeleton: header with progress hearts + sound toggle,
                      eight <section class="chapter"> blocks (the interlude and the paperwork
                      view are two of them); the application form is built by app.js
css/style.css         design tokens (paper, ink, blue, pink, heart, rink, butter, lavender),
                      typography (Itim for story headings, Nunito for UI), chapter layout,
                      SVG state styles (folds, tiles, ghosts, beats), animations, reduced motion
js/content.js         every story string, the date labels, reply choices, letter template
                      (edit dates here; the secret word is base64 so a glance at the source
                      does not spoil it)
js/app.js             SceneStage + SceneTransition (chapter routing, portrait/landscape
                      composition choice, progress hearts, resume), AudioManager (`Sound`:
                      synthesised effects + the looping music element, on by default, started on
                      the first gesture), small drawing helpers, the reply builder + clipboard
js/art.js             the illustration kit every scene draws from: sky cards, snow hills, pines,
                      lamp posts, string lights, bunting, snowfall, soft shadows, spotlights, the
                      crowd, rink boards, banner, snow caps, the ticket booth, the chalet
js/cat.js             CanonicalCat (one SVG rig: body, tail, two ears, bow, face, blush, resting
                      paws, raised paws, and props: skates, a hard hat, a sweat drop, paws-over-eyes),
                      CatExpression presets (the booklet faces: shy, curious, excited, delighted,
                      affectionate, calm, surprised, pleased; plus acting faces built from the same
                      traced parts: proud, determined, skeptical, sheepish, dizzy, bashful, stern;
                      the half-closed eyes are flat-cut dots with a lid line) and
                      CatAnimationController: a single pose state rendered by one function
                      (no other code writes transforms), shared idle loop (breathing, blinking,
                      tail sway, ear flicks, settle) and awaitable actions (lookAt, lookAtViewer,
                      lookUp, tilt, lean, perk, nod, wave, crouch, hopTo, walkAlong, glideAlong,
                      pirouette, failedPirouette, steady, nearSlip, triumph, helmetOn, sweatDrop,
                      slap, coverFace, clap, dance, bounce, nuzzle) and `pettable` (tap reactions)
js/scenes.js          prologue, map, lane, stairs, epilogue (PuzzleInteraction per chapter). Each
                      renders an SVG for the current composition (portrait / landscape) from its
                      own small state object, so a resize re-renders without losing progress.
                      Every scene is one SVG viewBox: cats, props, markers, paths, effects and
                      hit areas share that coordinate space.
js/balcony.js         the interlude between chapters 2 and 3 ("operation: totally normal
                      entrance"): a cancellable timeline (each step checks a generation counter,
                      so skip, unmount or a resize can never leave two timelines running), a
                      camera (the viewBox tweened and clamped to the stage), captions, sounds,
                      and one shared end state that skip and reduced motion land on
js/office.js          the last view: the department's counter (the blue cat as clerk, a carrier
                      pigeon), reactions to her decision, the bouncer (he drops onto a "no"
                      button) and the pigeon's delivery flight once the stamp has come down
js/art.js             (also) Doodle.house: the Geneva house, drawn once for the interlude and
                      chapter 3 (scaled, strokes kept at scene weight; cat slots keep scene
                      coordinates so cats can stand behind its railing and go in its door)
js/rink.js            chapter 4: beat state machine (idle -> busy -> idle, taps ignored while
                      busy), the four choreographed beats on the cat controller, the heart trail
                      and the envelope descent. Portrait (primary) and landscape compositions.
kit/                  content.json + design-tokens.css from the design kit, and reference-sprites/
                      (cutouts from the booklet PDF; reference only, never loaded by the page)
fonts/                Itim + Nunito (OFL licences included)
favicon.svg
```

## The experience

- Prologue: the printed invitation page with a tiny sealed pocket tucked into the envelope. "let's find it ♡".
- Chapter 1, open the little map: a real tri-fold. The corner, the right third and the bottom-left strip lie folded over the map (their paper backs on top, numbered); tapping one swings it open around its crease (the flap mirrors through the hinge line, darkens as it stands edge-on, its map art appears past the halfway point, and it settles with a tiny overshoot). The landing zones never overlap, so any order works. Under the second flap a little note is tucked into the map ("probably the right way.", with a "trust me." arrow): blue looks proud of it, pink is politely skeptical. The route draws from "home" to the rink once all three are open.
- Chapter 2, the snowy little lane: tap pieces to rotate them until the pawprints link up; the cats stroll across in single file (blue leads, pink waits a beat and follows a body-length behind on the same line; about 150 scene units a second with a 2.8-bob-per-second step, an easy walk rather than a trot). On the bend he nearly slips (paws up, a scramble, upright again), looks back to check whether anyone saw, and she saw: he goes sheepish, she smiles, and they walk on. The path logic is untouched; the slip is a pause in the same walk. The rotation is an SVG transform about the tile's true centre (tweened with a little overshoot), so the bend piece sits exactly on the lane line of its neighbours in every orientation and the route the cats walk is the route that is drawn; the rotate buttons retire once the lane is linked.
- Interlude, "operation: totally normal entrance" (between chapters 2 and 3, about 25 seconds, skippable, works muted): a flashback to Geneva. Blue strolls up to a front door with a keypad, types a code (keys light, beeps), gets the red buzz, blinks, tries again with great confidence, buzz again. The camera creeps in; he looks at the keypad, at you, back at the keypad; a sweat drop; "he forgot the door code."; a tumbleweed crosses the lane. He looks up at the balcony, perks: "fortunately, he had a perfectly reasonable backup plan." A dramatic sting, the camera dives onto his face, a hard hat drops onto his head, a sparkle crosses his eyes. Back to the whole scene: pink rises into view on the balcony, looks at you, "oh. it's this guy again.", then down at him, amused; he salutes her with the hat on. Resolve: "some cats never learn." / "good thing we're building proper stairs this time." The skip link (and reduced motion) jump straight to that end state; the stored progress moves on to the staircase as soon as the interlude ends, so a reload never replays it against her will.
- Chapter 3, a tiny staircase: the house is the flashback's house (same facade, keypad, number 7, balcony), so "proper stairs this time" means stairs up to that balcony and its door. The helpers own their touches (`touch-action: none` plus a touchstart guard for browsers that ignore it on SVG), so on a page that scrolls a finger on a helper drags it instead of scrolling, while a swipe anywhere else still scrolls. The tower has no ground entrance, only a little arched door on a landing high up (plus a round attic window and a lantern). Put the stool, the crate and the little fridge (two doors, handles, magnets, a note) on their matching outlines (tap, then tap the outline, or drag; the tray objects jiggle and lift to show they can be picked up, and a ghost stool demonstrates after two seconds). Then the staircase lights up from the bottom, the cats hop from object top to object top; he lands on the balcony first, behind its railing, and poses like a mountaineer (chest out, one paw high, a glance at you) while she arrives a step below, amused; he immediately acts normal. The balcony door swings open on its hinge, the envelope floats out to blue's paw, pink joins him, they nuzzle, both slip in through the doorway, the door closes and the peephole and lantern glow. No overlay is left behind.
- Chapter 4, one little spin: a small show venue (string lights, light beams, a crowd of tiny cats in the stands who bob and cheer, boards with a pink band, a spotlight pool that follows the pair, skate lines on the ice, and a tiny boombox at the boards: the secret-dance easter egg). Both cats wear little skates, attached to the rig so they follow every pose; the trails start at the blades. Tap beats 1 to 4. Beat 1: look, blink, lean in, paws meet, crouch, glide with trail. Beat 2: pink's stylised twirl (narrow, back view, return; bow and tail lag), blue's delighted bounce, sparkles, glide. Beat 3: his big moment. He winds up for a pirouette, spins faster and faster, the spin gets away from him, he sways, and goes down flat on the ice, a dizzy puddle with a star circling his head; the music stops; "nailed it."; she skates over, leans down and kisses him (a little heart, a kiss sound); he springs back up blushing, the star is gone, a soft chime, the music comes back, and they glide on together (the "softer music" of the brief is the same track resuming under a soft chime pad: the page cannot change the track's volume on iOS, see below). Beat 4: a glance, a glide to the centre, the trail draws a heart that glows, a nuzzle, hearts rise, the envelope floats down, the little padlock on its flap springs open, drops off and melts away; the envelope stays sealed (the flap lifts a crack, light behind it) so that "open it ♡" really opens it on the next page.
- Epilogue: the envelope opens, the word rises out of it, and only once the card is fully up does the copy below appear ("you found it!", the word, and "file the official paperwork ♡"). Nothing below the drawing is visible before that, so the word is never half-spoiled.
- The paperwork (the last view): the counter of the Department of Extremely Important Romantic Affairs, with the blue cat on duty behind it (papers, a bell, the stamp, a "now serving ♡ 1" sign) and a carrier pigeon at the end of the counter. Below it the OFFICIAL DATE APPLICATION (applicant: one suspiciously enthusiastic blue cat; purpose: attendance at Art on Ice with a very special pink cat; secret authorization code: the word; delivery method: carrier pigeon, naturally; status: live) is her reply form: HER MAJESTY'S DECISION (yes / need to check / can't), PREFERRED DATE, ROYAL REMARKS, and "stamp it ♡". The stamp slams APPROVED, PENDING or DECLINED onto the form (the status line changes with it: "approved. the applicant is beside himself." / "pending. the applicant is pacing." / "declined. an appeal has been filed."), the clerk reacts, the pigeon takes the letter and flies off over the counter (and comes back for the next one), and "the official reply" appears below with "copy my little letter" and "write it by hand instead". Changing the decision after stamping re-stamps at once. The pigeon is imaginary and the page says so: the copy button is the real delivery.
- The bouncer: picking "i need to check" or "i can't make it" makes the clerk leave the counter, drop out of the top of the screen onto the very button she tapped, plant himself on it with both paws up, stare, and shake his head ("no."); he hops back up and returns to the counter; the decision stays on "yes". He never gives in: the lines rotate ("nice try.", "still no.", "we've been over this."), every other time with a long look, so the only decision the form can ever carry is yes and the only stamp is APPROVED (the pending and declined paths exist in the code but cannot be reached). The drop-in cat is an overlay in page coordinates (never catching taps), so it works wherever the form is scrolled.
- Easter eggs: the cats can be petted in every chapter (tap one: a blink and tilt with a mew, a perk with a purr, a bounce with a meow, a shy glance at you); pink gets more bashful the more you tap her (every third tap she covers her eyes with her paws and leans on him, and he goes pleased). In the rink a small ♪ button at the boards starts a two-second secret dance (both cats, with meows) when no beat is playing. Petting is ignored while a puzzle animation runs, so it can never break a puzzle.

Every game has a visible goal, the instruction above the play area, progress text, "show hint" and "skip puzzle"; the interlude has "skip the flashback". Keyboard: Tab to a fold, piece, object, outline, beat, the skip link, a decision chip or the stamp and press Enter (the bouncer works from the keyboard too). Reduced motion is respected (beats and the interlude resolve to their end state; the comedy beats keep their captions; the bouncer still appears on the button, without the drop, long enough to read).

Sound is on by default; the preference is remembered. Browsers only allow audio after a user gesture, so the audio context is created on the first tap or key press (normally "let's find it") and nothing plays before that. If the browser refuses, the button shows "sound: unavailable" instead of pretending. All effects are synthesised in the page (glides, chimes, a tiny meow, hop and landing, the envelope descent, the unlock, a flourish, and the comedy set: keypad clicks, an OK beep, the error buzz, a plink, the tumbleweed's bounces, a dramatic sting, the hard hat's clank, a sparkle, embarrassed meows and mews, a purr, the pirouette's whirr and wobble, a record-stop for the failed spin, the recovery chime, the paperwork's rustle and stamp, the bouncer's landing and a flat "nope" for each shake of the head, a kiss); the only audio file is the music. The toggle really silences everything.

Nothing scrolls on a phone except the last page: each chapter's drawing is capped (`fitScene` in `js/app.js`) so the header, the words above it and the controls below it (or the success panel that replaces them, whichever is taller) fit the visible viewport, Safari's bars included; on short screens the helper line and the chapter eyebrow fold away, and a phone on its side gets a compact header. The epilogue (secret word) and the paperwork view (the form) are the two pages that may scroll; the bouncer lands on the button wherever it is on the page.

Progress is remembered in the browser (localStorage, by scene name; the older numeric values still resolve): reopening the page returns to the current chapter, straight to the secret once found, or to the paperwork once she has reached it. "play the tiny adventure again" clears it.

## Free hosting (GitHub Pages, recommended)

Free for public repositories, no credit card, no monthly credits that can pause the site, stable HTTPS URL, and files can be uploaded in the browser.

1. Create a free account at https://github.com if needed. Top right "+", then "New repository". Name it for example `tiny-adventure`, keep it Public, create.
2. On the empty repository page click "uploading an existing file". Drag everything inside this folder (index.html, css, js, assets, fonts, favicon.svg, README.md) onto the upload area. Drag the folders themselves so the structure is kept. "Commit changes".
3. Settings, then Pages (left menu). Source: "Deploy from a branch". Branch: `main`, folder `/ (root)`. Save.
4. After a minute or two the page shows the live URL: `https://<username>.github.io/tiny-adventure/`. Open it on your phone and play through once.

Updating: edit a file in the repository (pencil icon) or upload the changed files again via "Add file > Upload files". The URL never changes; the site rebuilds within a couple of minutes.

With git instead of the browser:

```
git init && git add . && git commit -m "a tiny adventure"
git branch -M main
git remote add origin https://github.com/<username>/tiny-adventure.git
git push -u origin main
```

Alternative: Netlify Drop (https://app.netlify.com/drop, free plan, no credit card): log in, drag the folder, rename the site under Site configuration. Dropping again updates the same URL. Note that new Netlify accounts have a monthly credit allowance; this tiny site uses almost none, but if it were ever exceeded the site would pause until the next month. GitHub Pages has no such mechanism.

## Replacing the QR code

Generate the QR code only from the final live URL, after opening it on your phone. A QR code pointing at a draft URL cannot be fixed after printing.

## Verified

Headless Chromium (Playwright), every chapter including the interlude at 375x667, 390x844, 393x852, 430x932, 768x1024, 1280x800 and 1440x900: no horizontal overflow, no text over artwork, every control at least 44x44. Full journeys at 390x844 and 1440x900 by tap, by drag, keyboard only (Tab + Enter, through the interlude's skip link, the epilogue's button, the decision chips, the stamp) and with reduced motion (where the interlude lands on its end state at once), ending at the secret word, an approved application, a dispatched pigeon and a copied letter, with no console errors; a reload returns to the paperwork, replay returns to the prologue.

The music was checked under both browser policies: with autoplay blocked (the default) it is paused before any gesture and playing right after the first tap; with autoplay allowed it plays on open; it loops at the end, pauses and resumes with the toggle, and the choice survives a reload.

Animation QA was done on sampled frames, not just end states: the map unfolding (23 frames across the three flaps), the lane crossing (16 frames), the staircase climb-and-enter (30 frames plus close-ups), the expression sheet for both cats (all presets), hop / walk / spin / nuzzle frames, the Chapter 3 tray idle (jiggle, lift, shadow), hover, pressed and drag states, the placement flash, the climb-and-enter sequence (at 390 and 1440), and every Chapter 4 beat plus the finale at 390 and 1440 (the trail closes into a heart; the envelope opens once). Also: rapid tapping during a beat (ignored; wrong beats shake), a resize in the middle of a beat (re-rendered after it settles), replay resetting the rink, and a real touch drag (CDP touch events) of a helper on a 390x560 viewport where the page scrolls: the page stayed put, the helper landed on its outline, and a swipe on the background still scrolled.

Audio: `sound: on` before any gesture with no AudioContext yet; the context is created on the first tap and reports `running`; map and lane actions trigger tap / rustle / chime / pick / glide / hop / land / tada in sync with the animations; with the toggle off no oscillator is created at all; the choice survives a reload.

Fit was checked on iPhone SE (375x667 and 375x548 with Safari's bars), iPhone 14 (390x844 and 390x664 with bars), 14 Pro (393x660), 15 Pro Max (430x746) and a 14 on its side (844x390): every chapter, the interlude included, in its solved state too, fits with no vertical scroll.

The comedy pass was checked on sampled frames as well: the interlude at 390x844 and 1440x900 (captions arrive in order; the camera creep, the face zoom and the hat drop stay inside the rounded stage on both layouts; the tumbleweed crosses; pink appears only at her cue; skip lands on the end state and stores the staircase as the next chapter), the map note and both reactions, the lane stroll with the slip (the solved route is unchanged), the staircase summit pose at both sizes, the failed pirouette (30 frames: wind-up, spin, wobble, dizzy star, "nailed it.", the music element paused and resumed, the recovery), the petting reactions (pink's paws over her eyes on the third tap; petting ignored during a beat), the secret dance, the bouncer (drop, guard pose on the right button, bubble, head shake, exit; four tries refused with four different lines; the letter never changes), the stamp, the pigeon's flight and return, the staircase climb up to the balcony and in through its door, the kiss recovery, and the fridge in the tray and on its outline. Rapid tapping during the bouncer is ignored until he is back behind the counter.

Not verified: a real iPhone (Safari) was not available here; please do one run on your phone before printing the QR code, including a check with the ringer switch on silent, and listen to the pirouette beat (the music stop and restart is a real pause of the `<audio>` element; Safari should honour it, but it was only checked in Chromium).
