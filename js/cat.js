/* ------------------------------------------------------------
   The character system
   CanonicalCat        – one vector cat (blue or pink), parts rigged
   CatExpression       – eyes / mouth / blush / ear mood presets
   CatAnimationController – one authoritative pose state per cat,
                          an idle loop, and queued actions
   Geometry is authored at height 100 with the feet on y = 0 and the
   body centred on x = 0, measured from the booklet's page-3 cat.
   The pink cat is the same silhouette mirrored, with her bow.
   ------------------------------------------------------------ */
(() => {
  'use strict';
  const TA = window.TA;
  const { tween, wait, ease, REDUCED } = TA.helpers;
  const INK = '#191717';
  const SW = 4.0;                       // ink stroke at height 100 (the printed line is about 4% of the body height)
  // sampled from the printed cats
  const COL = { blue: '#b6d6fb', pink: '#fde7ee', heart: '#f49fbb', blush: '#f5a3bd', bow: '#f49fbb', tongue: '#f7a3bd', lid: 'currentColor', helmet: '#ffd76a', helmet2: '#f4bf3a' };

  // ---------------------------------------------------------- geometry (local units, feet at y=0)
  const G = {
    body: 'M-9.6 -0.1 C-10.4 -0.1 -11.7 0.1 -12.8 -0.2 C-14.0 -0.5 -15.4 -1.6 -16.5 -1.7 C-17.6 -1.8 -18.4 -0.8 -19.5 -0.8 C-20.6 -0.9 -22.2 -1.9 -23.3 -2.0 C-24.4 -2.1 -25.4 -1.4 -26.3 -1.3 C-27.2 -1.2 -27.9 -1.1 -28.7 -1.3 C-29.4 -1.5 -30.1 -1.9 -30.8 -2.4 C-31.5 -2.9 -32.1 -3.5 -32.6 -4.0 C-33.1 -4.5 -33.3 -4.8 -33.6 -5.2 C-33.9 -5.7 -33.0 -1.5 -34.2 -6.7 C-35.4 -11.9 -39.4 -31.2 -40.7 -36.3 C-42.0 -41.5 -41.0 -37.2 -41.9 -37.7 C-42.8 -38.2 -45.0 -38.8 -46.0 -39.3 C-47.0 -39.8 -47.8 -40.1 -48.0 -40.6 C-48.1 -41.1 -47.4 -41.7 -47.0 -42.1 C-46.6 -42.5 -46.1 -42.8 -45.5 -43.0 C-44.9 -43.3 -43.8 -43.0 -43.2 -43.6 C-42.6 -44.1 -42.0 -45.7 -41.8 -46.4 C-41.5 -47.1 -41.5 -46.8 -41.8 -47.8 C-42.1 -48.9 -43.2 -51.6 -43.5 -52.9 C-43.8 -54.2 -43.6 -54.8 -43.5 -55.5 C-43.3 -56.2 -43.1 -56.8 -42.6 -57.0 C-42.2 -57.1 -41.5 -56.7 -40.8 -56.3 C-40.1 -55.9 -39.1 -54.9 -38.7 -54.6 C-38.2 -54.3 -38.3 -54.4 -38.1 -54.5 C-37.8 -54.6 -37.2 -55.1 -37.1 -55.4 C-36.9 -55.8 -36.8 -55.7 -37.1 -56.5 C-37.5 -57.3 -38.5 -59.4 -39.1 -60.2 C-39.6 -61.0 -39.9 -61.2 -40.4 -61.2 C-40.9 -61.3 -42.2 -60.9 -42.3 -60.7 C-42.4 -60.6 -42.1 -59.5 -40.9 -60.3 C-39.7 -61.1 -36.2 -63.6 -35.2 -65.5 C-34.1 -67.3 -34.7 -70.1 -34.7 -71.3 C-34.8 -72.5 -35.1 -72.3 -35.5 -72.6 C-35.9 -73.0 -37.8 -73.4 -37.3 -73.6 C-36.8 -73.7 -33.7 -73.3 -32.6 -73.4 C-31.5 -73.5 -31.1 -73.9 -30.7 -74.1 C-30.3 -74.3 -30.3 -74.4 -30.2 -74.6 C-30.1 -74.9 -29.9 -75.0 -29.9 -75.4 C-29.9 -75.7 -29.8 -76.2 -30.0 -76.8 C-30.2 -77.5 -31.1 -78.7 -31.3 -79.2 C-31.5 -79.7 -31.5 -79.5 -31.4 -79.8 C-31.3 -80.2 -31.3 -80.8 -30.8 -81.1 C-30.3 -81.4 -29.1 -81.7 -28.5 -81.7 C-27.9 -81.8 -27.5 -81.5 -27.2 -81.6 C-27.0 -81.6 -27.3 -82.0 -27.1 -82.1 C-26.9 -82.2 -27.6 -82.0 -26.3 -82.4 C-25.0 -82.8 -22.1 -83.8 -19.4 -84.4 C-16.7 -85.0 -13.8 -85.7 -10.0 -85.9 C-6.2 -86.1 0.4 -85.6 3.6 -85.7 C6.8 -85.8 7.8 -86.2 9.1 -86.5 C10.4 -86.8 10.6 -86.6 11.4 -87.2 C12.2 -87.8 13.5 -89.5 14.2 -90.0 C14.9 -90.5 14.2 -90.3 15.8 -90.3 C17.4 -90.3 21.2 -90.4 23.7 -90.2 C26.2 -90.0 28.9 -89.4 30.8 -89.0 C32.8 -88.6 33.4 -88.4 35.4 -87.6 C37.4 -86.8 40.9 -85.4 42.7 -84.4 C44.5 -83.4 45.4 -82.4 46.4 -81.4 C47.4 -80.4 48.3 -79.2 48.9 -78.3 C49.5 -77.4 49.5 -76.7 49.9 -76.1 C50.2 -75.5 50.0 -75.4 51.0 -74.8 C51.9 -74.3 54.5 -73.2 55.5 -72.8 C56.6 -72.4 57.3 -73.1 57.3 -72.4 C57.2 -71.8 55.3 -69.6 55.0 -68.9 C54.6 -68.2 54.9 -68.5 55.1 -68.2 C55.4 -67.8 55.8 -67.3 56.2 -67.0 C56.6 -66.8 56.8 -66.7 57.6 -66.8 C58.4 -66.9 60.2 -67.5 61.2 -67.6 C62.1 -67.7 62.6 -67.4 63.2 -67.3 C63.7 -67.1 64.8 -67.8 64.5 -66.7 C64.3 -65.5 62.1 -61.6 61.6 -60.3 C61.1 -59.0 61.4 -59.4 61.5 -58.9 C61.5 -58.4 61.6 -58.1 62.0 -57.5 C62.5 -56.9 63.5 -56.4 64.3 -55.4 C65.1 -54.5 66.7 -52.5 66.9 -51.8 C67.1 -51.0 66.3 -51.0 65.5 -50.8 C64.8 -50.6 63.2 -50.9 62.4 -50.6 C61.7 -50.3 61.3 -49.5 61.0 -49.0 C60.6 -48.5 60.4 -48.1 60.4 -47.5 C60.3 -47.0 60.1 -47.0 60.4 -45.8 C60.7 -44.5 61.9 -41.0 62.1 -39.9 C62.4 -38.8 62.2 -39.1 61.9 -39.2 C61.6 -39.3 60.7 -40.4 60.2 -40.7 C59.8 -40.9 59.5 -40.6 59.2 -40.5 C58.9 -40.4 58.7 -40.2 58.4 -39.9 C58.1 -39.5 57.6 -39.1 57.5 -38.3 C57.5 -37.5 58.0 -36.2 58.1 -35.3 C58.1 -34.4 57.9 -33.6 57.9 -32.8 C57.9 -32.0 58.2 -31.3 58.3 -30.5 C58.4 -29.7 58.4 -29.0 58.3 -28.1 C58.2 -27.2 57.6 -25.8 57.6 -25.0 C57.6 -24.2 57.8 -24.0 58.1 -23.4 C58.4 -22.8 59.0 -22.1 59.3 -21.4 C59.6 -20.7 59.9 -20.2 59.9 -19.1 C59.9 -18.1 59.7 -16.5 59.4 -15.1 C59.1 -13.7 58.3 -11.7 57.9 -10.6 C57.5 -9.5 57.2 -9.0 56.8 -8.5 C56.4 -8.0 56.2 -7.7 55.7 -7.4 C55.2 -7.1 54.3 -6.7 53.5 -6.5 C52.7 -6.3 52.0 -6.4 51.1 -6.1 C50.2 -5.8 49.4 -4.8 48.3 -4.6 C47.2 -4.4 45.5 -5.2 44.4 -5.0 C43.3 -4.8 42.6 -4.0 41.6 -3.7 C40.6 -3.4 39.2 -3.4 38.4 -3.4 C37.6 -3.4 37.7 -3.2 36.8 -3.7 C35.9 -4.2 34.0 -6.0 33.1 -6.6 C32.2 -7.2 34.5 -7.3 31.6 -7.1 C28.7 -6.9 21.3 -6.0 15.7 -5.6 C10.1 -5.2 1.5 -5.0 -1.8 -4.8 C-5.1 -4.5 -3.2 -4.7 -4.0 -4.1 C-4.8 -3.5 -6.0 -1.8 -6.7 -1.2 C-7.4 -0.6 -7.6 -0.6 -8.1 -0.4 C-8.6 -0.2 -8.8 -0.1 -9.6 -0.1 Z',
    earL: { base: [-29, -81.5], base2: [-2, -86], tip: [-20, -101], pivot: [-15, -83] },
    earR: { base: [16, -90], base2: [42, -85], tip: [31, -102], pivot: [29, -87] },
    tail: { pivot: [-33, -22], path: 'M-30 -12 C -44 -3, -63 -8, -62 -26 C -61 -38, -45 -41, -36 -31 C -33 -27, -31 -20, -30 -12 Z' },
    face: { cx: 14, cy: -63, eyeL: [-3, -66], eyeR: [31, -66], eyeR_: 3.0 },
    paws: { restL: 'M-5 -33 C -5 -41, 1 -46, 6 -46 C 11 -46, 15 -42, 15 -29', restR: 'M17 -29 C 17 -42, 21 -46, 26 -46 C 31 -46, 37 -41, 37 -33', raiseL: 'M-30 -40 C -42 -44, -50 -53, -44 -63', raiseR: 'M50 -40 C 62 -44, 70 -53, 64 -63' },
    whiskers: { L: [], R: [] },   // the booklet cats have none; their cheek tufts are in the contour
    feet: ['M-24 -0.5 q 1 -4 4 -1', 'M36 -0.5 q 1 -4 4 -1'],
    blushL: ['M-16 -54.5 l3.5 -5.5', 'M-11.5 -54.5 l3.5 -5.5', 'M-7 -54.5 l3.5 -5.5'],
    blushR: ['M34 -54.5 l3.5 -5.5', 'M38.5 -54.5 l3.5 -5.5', 'M43 -54.5 l3.5 -5.5'],
    shadow: { cx: 12, rx: 50, ry: 6.5 },
  };
  // ---------------------------------------------------------- traced from the printed cats (exact ink shapes, in the face frame)
  const T = {
    "omega": "M11.8 -59.7 L9.3 -60.3 L8.1 -61.3 L7.4 -62.3 L6.7 -64.6 L7.2 -66.7 L8.5 -67.6 L10.0 -67.4 L10.9 -66.1 L10.9 -64.3 L11.1 -64.0 L11.5 -64.0 L12.3 -64.5 L12.8 -65.6 L13.6 -66.2 L14.7 -66.4 L16.0 -66.0 L17.5 -64.2 L17.8 -64.5 L18.0 -65.6 L17.8 -66.7 L18.3 -67.4 L19.3 -68.1 L19.9 -68.2 L21.2 -67.4 L21.6 -66.9 L22.1 -65.0 L21.8 -63.2 L20.7 -61.2 L19.5 -60.3 L17.8 -60.0 L16.3 -60.2 L15.2 -61.0 L14.6 -61.1 L13.5 -60.3 L11.8 -59.7 Z",
    "open": "M14.8 -51.4 L12.7 -52.0 L11.0 -53.9 L9.6 -57.8 L9.4 -60.6 L8.1 -61.5 L6.7 -63.7 L7.0 -65.6 L8.5 -66.4 L9.1 -66.4 L10.0 -65.2 L9.9 -64.5 L10.3 -64.0 L11.5 -63.9 L12.8 -65.1 L12.3 -66.1 L12.7 -66.9 L13.9 -67.9 L14.9 -67.7 L15.2 -68.0 L15.5 -67.7 L16.4 -67.5 L17.0 -66.7 L16.8 -65.2 L17.5 -64.3 L18.7 -64.1 L19.0 -64.4 L19.4 -65.7 L20.6 -66.6 L22.1 -66.1 L22.7 -65.0 L22.4 -62.8 L19.9 -60.7 L19.4 -56.8 L19.0 -56.5 L18.8 -55.0 L18.0 -53.2 L16.1 -51.8 L14.8 -51.4 Z M14.8 -54.9 L15.9 -56.3 L16.5 -60.9 L14.7 -62.2 L12.8 -60.8 L12.7 -60.1 L13.0 -59.8 L13.0 -57.6 L13.7 -55.7 L14.3 -54.8 L14.8 -54.9 Z",
    "tongue": "M14.6 -54.8 L13.7 -55.7 L12.7 -60.1 L12.8 -60.8 L14.7 -62.2 L16.5 -60.9 L15.9 -56.3 L15.5 -55.4 L14.6 -54.8 Z",
    "squint": "M-5.5 -61.5 L-6.7 -61.7 L-7.7 -62.8 L-7.7 -63.4 L-7.2 -64.3 L-4.1 -65.9 L-5.0 -66.8 L-7.3 -67.7 L-7.8 -68.6 L-7.4 -69.8 L-6.1 -70.6 L0.6 -67.7 L1.5 -66.6 L1.5 -65.6 L0.8 -64.7 L-3.5 -62.8 L-5.5 -61.5 Z M34.5 -61.8 L33.1 -62.0 L26.8 -64.9 L26.1 -66.0 L26.5 -67.0 L27.5 -68.0 L30.1 -69.2 L32.9 -70.1 L33.3 -70.5 L34.1 -70.7 L34.9 -70.3 L35.7 -69.2 L35.3 -68.2 L31.9 -66.1 L34.6 -64.9 L35.2 -64.4 L35.6 -63.0 L34.5 -61.8 Z M19.6 -60.6 L13.8 -60.5 L13.6 -60.7 L7.8 -60.4 L7.1 -60.8 L6.6 -61.6 L6.2 -63.8 L6.5 -64.6 L7.9 -65.2 L9.0 -64.5 L9.2 -63.3 L10.3 -62.4 L11.6 -63.3 L12.1 -64.7 L13.5 -65.3 L14.5 -64.9 L15.0 -64.4 L15.2 -63.6 L16.4 -62.5 L16.8 -62.5 L17.9 -63.5 L17.9 -64.3 L18.5 -65.0 L19.5 -65.4 L20.6 -65.0 L21.1 -64.3 L21.1 -63.3 L20.5 -62.3 L20.5 -61.5 L19.6 -60.6 Z",
    "blush": "M-10.4 -54.4 L-12.9 -54.4 L-13.2 -54.9 L-13.0 -55.5 L-12.4 -56.1 L-10.8 -58.7 L-9.7 -59.8 L-8.9 -59.9 L-8.5 -59.7 L-8.2 -59.2 L-8.2 -58.2 L-9.0 -57.1 L-9.2 -56.3 L-10.3 -54.9 L-10.4 -54.4 Z M-6.0 -54.5 L-9.1 -54.5 L-7.2 -57.8 L-6.1 -58.9 L-5.5 -59.1 L-4.9 -58.9 L-4.6 -58.4 L-4.6 -57.2 L-6.0 -54.5 Z M35.6 -55.2 L32.7 -55.3 L33.7 -57.1 L34.1 -58.5 L35.3 -59.6 L36.1 -59.5 L36.7 -58.8 L36.7 -57.8 L35.6 -55.2 Z M31.6 -55.1 L28.9 -55.2 L29.7 -56.8 L30.0 -58.4 L31.1 -59.4 L31.9 -59.4 L32.6 -58.5 L32.7 -57.7 L32.1 -56.5 L31.9 -55.5 L31.6 -55.1 Z M-1.8 -54.6 L-4.5 -54.6 L-3.1 -57.2 L-2.3 -58.0 L-1.4 -58.0 L-0.7 -57.3 L-0.7 -56.1 L-1.8 -54.6 Z M39.4 -55.3 L36.9 -55.3 L37.9 -57.2 L38.1 -58.0 L38.8 -58.7 L39.6 -58.7 L40.5 -57.6 L40.5 -57.2 L39.4 -55.3 Z",
    "caret": "M18.5 -59.7 L17.4 -59.6 L16.5 -60.3 L15.9 -61.3 L15.8 -61.9 L15.1 -62.8 L14.4 -62.1 L12.9 -59.9 L12.4 -59.7 L11.9 -59.6 L11.1 -60.0 L10.7 -60.5 L10.5 -61.5 L12.2 -64.2 L13.9 -66.2 L14.7 -66.7 L15.6 -66.6 L16.4 -66.3 L16.9 -65.7 L19.2 -61.9 L19.3 -60.8 L18.5 -59.7 Z",
    "pawL": "M9.4 -28.5 L8.2 -28.7 L7.3 -29.9 L7.3 -30.9 L8.9 -33.8 L9.6 -36.9 L9.2 -39.4 L8.3 -40.6 L7.0 -41.6 L5.0 -42.3 L3.2 -42.2 L1.5 -41.6 L0.0 -40.6 L-1.6 -38.8 L-2.7 -37.0 L-2.9 -36.1 L-4.5 -35.0 L-5.7 -35.2 L-6.8 -36.5 L-6.6 -38.6 L-5.6 -40.5 L-3.6 -42.9 L-1.2 -45.0 L3.4 -46.5 L6.6 -46.2 L9.2 -45.2 L11.0 -44.0 L12.3 -42.2 L12.3 -31.3 L11.0 -29.3 L10.0 -28.6 L9.4 -28.5 Z",
    "pawR": "M12.3 -42.2 L13.3 -41.0 L14.9 -42.7 L17.0 -44.2 L18.9 -44.9 L21.3 -45.3 L24.2 -44.9 L25.5 -44.1 L26.3 -44.0 L29.3 -41.2 L31.0 -37.8 L31.5 -34.9 L31.1 -33.6 L30.1 -32.8 L28.7 -32.8 L27.8 -33.4 L27.1 -34.6 L26.8 -36.6 L25.2 -39.4 L23.2 -40.7 L20.4 -40.9 L19.2 -40.5 L17.3 -39.1 L16.7 -38.0 L16.1 -34.3 L17.2 -31.0 L17.0 -29.6 L16.2 -28.8 L15.0 -28.6 L13.9 -29.2 L12.4 -31.4 L12.3 -31.3 Z",
    "bowL": "M-27.3 -80.1 L-25.9 -80.0 L-23.3 -80.8 L-21.0 -82.4 L-19.0 -81.7 L-17.8 -81.9 L-17.0 -81.0 L-15.0 -79.5 L-13.9 -79.0 L-11.3 -78.7 L-10.1 -79.4 L-9.7 -80.1 L-8.8 -83.9 L-8.5 -88.9 L-9.3 -90.1 L-10.1 -90.8 L-11.7 -91.2 L-15.6 -90.0 L-17.6 -88.5 L-19.6 -89.2 L-20.8 -89.1 L-22.2 -90.3 L-23.5 -90.9 L-24.9 -92.0 L-26.3 -92.3 L-27.8 -91.9 L-28.9 -90.9 L-29.5 -87.4 L-29.1 -85.9 L-29.3 -83.3 L-29.0 -81.6 L-28.5 -80.9 L-27.3 -80.1 Z"
  };
  // facial variants, all centred on the face
  const EYES = {
    dots: (r) => `<circle class="eye" cx="${G.face.eyeL[0]}" cy="${G.face.eyeL[1]}" r="${r}" fill="${INK}"/><circle class="eye" cx="${G.face.eyeR[0]}" cy="${G.face.eyeR[1]}" r="${r}" fill="${INK}"/>`,
    wide: (r) => EYES.dots(r * 1.25),
    happy: () => `<path d="M${G.face.eyeL[0] - 5} ${G.face.eyeL[1] + 2} q5 -7 10 0 M${G.face.eyeR[0] - 5} ${G.face.eyeR[1] + 2} q5 -7 10 0" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round"/>`,
    content: () => `<path d="M${G.face.eyeL[0] - 5} ${G.face.eyeL[1] - 1} q5 6 10 0 M${G.face.eyeR[0] - 5} ${G.face.eyeR[1] - 1} q5 6 10 0" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round"/>`,
    closed: () => `<path d="M${G.face.eyeL[0] - 4.5} ${G.face.eyeL[1]} h9 M${G.face.eyeR[0] - 4.5} ${G.face.eyeR[1]} h9" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round"/>`,
    // the printed "> <" squeeze of pure joy
    squint: () => `<path d="${T.squint}" fill="${INK}"/>`,
    // little ink spirals: dizzy
    spiral: () => [G.face.eyeL, G.face.eyeR].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0.00 1.00 L-0.23 1.08 L-0.49 1.11 L-0.78 1.07 L-1.07 0.96 L-1.34 0.77 L-1.57 0.51 L-1.75 0.18 L-1.86 -0.20 L-1.88 -0.61 L-1.80 -1.04 L-1.63 -1.47 L-1.35 -1.86 L-0.98 -2.20 L-0.52 -2.46 L-0.00 -2.62 L0.57 -2.67 L1.16 -2.60 L1.73 -2.39 L2.27 -2.05 L2.74 -1.58 L3.11 -1.01 L3.36 -0.35 L3.47 0.36 L3.42 1.11 L3.21 1.85 L2.84 2.55 L2.31 3.18 L1.64 3.68 L0.86 4.05 L0.00 4.25 L-0.91 4.26 L-1.82 4.08 L-2.69 3.70 L-3.48 3.13 L-4.15 2.40 L-4.66 1.51 L-4.98 0.52 L-5.09 -0.53 L-4.97 -1.61 L-4.62 -2.67 L-4.04 -3.64 L-3.26 -4.49 L-2.30 -5.17 L-1.20 -5.64 L-0.00 -5.88 L1.24 -5.85 L2.48 -5.57 L3.64 -5.02" fill="none" stroke="${INK}" stroke-width="${SW * 0.42}" stroke-linecap="round"/>`).join(''),
    // half-closed: the dot cut flat near its top, with an ink lid line along the cut (a skeptical, unamused look)
    lidded: (r) => [G.face.eyeL, G.face.eyeR].map(([x, y]) => { const dy = -r * 0.3, hw = Math.sqrt(r * r - dy * dy); return `<path class="eye" d="M${(x - hw).toFixed(2)} ${(y + dy).toFixed(2)} A${r} ${r} 0 1 0 ${(x + hw).toFixed(2)} ${(y + dy).toFixed(2)} Z" fill="${INK}"/><path d="M${(x - r * 1.45).toFixed(2)} ${(y + dy).toFixed(2)} h${(r * 2.9).toFixed(2)}" fill="none" stroke="${INK}" stroke-width="${(r * 0.6).toFixed(2)}" stroke-linecap="round"/>`; }).join(''),
  };
  const MOUTHS = {
    w: `<path d="${T.omega}" fill="${INK}" fill-rule="evenodd"/>`,
    smile: `<path d="${T.omega}" fill="${INK}" fill-rule="evenodd"/>`,
    tiny: `<path d="${T.caret}" fill="${INK}"/>`,
    open: `<path d="${T.open}" fill="${INK}" fill-rule="evenodd"/><path d="${T.tongue}" fill="${COL.tongue}"/>`,
    o: `<path d="${T.open}" fill="${INK}" fill-rule="evenodd"/><path d="${T.tongue}" fill="${COL.tongue}"/>`,
    grin: `<path d="${T.open}" fill="${INK}" fill-rule="evenodd"/><path d="${T.tongue}" fill="${COL.tongue}"/>`,
  };
  // CatExpression presets
  const EXPRESSIONS = {
    shy:          { eyes: 'dots', mouth: 'w', blush: true, tilt: 2, ears: [0, 0] },
    calm:         { eyes: 'dots', mouth: 'w', blush: false, tilt: 0, ears: [0, 0] },
    pleased:      { eyes: 'dots', mouth: 'w', blush: true, tilt: 0, ears: [0, 0] },
    affectionate: { eyes: 'dots', mouth: 'w', blush: true, tilt: 5, ears: [2, -2] },
    curious:      { eyes: 'dots', mouth: 'w', blush: false, tilt: -6, ears: [-6, 8] },
    excited:      { eyes: 'dots', mouth: 'open', blush: true, tilt: 0, ears: [-4, 4] },
    delighted:    { eyes: 'dots', mouth: 'open', blush: true, tilt: 0, ears: [-2, 2] },
    surprised:    { eyes: 'wide', mouth: 'open', blush: false, tilt: 0, ears: [-8, 8] },
    joy:          { eyes: 'squint', mouth: 'open', blush: true, tilt: 0, ears: [-3, 3] },
    // acting faces built from the same printed parts
    proud:        { eyes: 'squint', mouth: 'w', blush: true, tilt: -4, ears: [-3, 3] },      // chin up, eyes squeezed shut in satisfaction
    determined:   { eyes: 'dots', mouth: 'tiny', blush: false, tilt: -6, ears: [-10, 10] },  // the little caret mouth, ears forward
    skeptical:    { eyes: 'lidded', mouth: 'tiny', blush: false, tilt: 6, ears: [0, 0] },
    sheepish:     { eyes: 'dots', mouth: 'tiny', blush: true, tilt: 8, ears: [10, -10] },    // ears back, blushing
    dizzy:        { eyes: 'spiral', mouth: 'tiny', blush: false, tilt: 0, ears: [12, -12] },
    bashful:      { eyes: 'squint', mouth: 'w', blush: true, tilt: 10, ears: [8, -8] },
    stern:        { eyes: 'lidded', mouth: 'tiny', blush: false, tilt: 0, ears: [-12, 12] },   // flat lids, ears flat, not amused
  };

  // ---------------------------------------------------------- markup
  function bowMarkup() {
    return `<g class="bow"><path d="${T.bowL}" fill="${COL.bow}" stroke="${INK}" stroke-width="${SW * 0.55}" stroke-linejoin="round"/></g>`;
  }
  function earPaths(e, col) {
    const [bx, by] = e.base, [bx2, by2] = e.base2, [tx, ty] = e.tip;
    const outer = `M${bx} ${by} C ${bx + (tx - bx) * 0.4} ${by + (ty - by) * 0.65}, ${tx - 2.5} ${ty + 1.5}, ${tx} ${ty} C ${tx + 2.5} ${ty + 1.5}, ${bx2 - (bx2 - tx) * 0.4} ${by2 + (ty - by2) * 0.65}, ${bx2} ${by2}`;
    // the fill is pushed 8 units into the head so a rotated ear never shows a seam; only the outer edges carry ink
    const inset = 8;
    return `<path d="${outer} L${bx2} ${by2 + inset} L${bx} ${by + inset} Z" fill="${col}"/><path d="${outer}" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const strokes = (arr, w = SW * 0.85, col = INK) => arr.map((d) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`).join('');

  function catMarkup(id, kind) {
    const col = COL[kind];
    const mirror = kind === 'pink';
    return `<g class="ccat ccat-${kind}" data-id="${id}">
      <g class="cc-shadow"><ellipse cx="${G.shadow.cx}" cy="1" rx="${G.shadow.rx}" ry="${G.shadow.ry}" fill="${INK}" opacity=".07"/></g>
      <g class="cc-pose">
        <g class="cc-mirror" transform="scale(${mirror ? -1 : 1} 1)">
          <g class="cc-tail"><path d="${G.tail.path}" fill="${col}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/></g>
          <g class="cc-bob">
            <path class="cc-body" d="${G.body}" fill="${col}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
            <g class="cc-ear cc-ear-l">${earPaths(G.earL, col)}${mirror ? bowMarkup() : ''}</g>
            <g class="cc-ear cc-ear-r">${earPaths(G.earR, col)}</g>
            <g class="cc-face" color="${col}">
              <g class="cc-blush"><path d="${T.blush}" fill="${COL.blush}"/></g>
              <g class="cc-eyes"></g>
              <g class="cc-mouth"></g>
            </g>
            <g class="cc-skates" opacity="0">${[-13, 37].map((x) => `<g transform="translate(${x} 0)">
              <path d="M-9 -1 v-6.5 q0 -3 3 -3 h8.5 q4 0 5.2 3.2 l2.3 6.3 z" fill="#fff" stroke="${INK}" stroke-width="${SW * 0.8}" stroke-linejoin="round"/>
              <path d="M-5.5 -6.5 l3 1.8 l-3 1.8 M-1 -6.5 l3 1.8 l-3 1.8" fill="none" stroke="${COL.heart}" stroke-width="${SW * 0.5}" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M-6 -1 v4 M6 -1 v4" stroke="${INK}" stroke-width="${SW * 0.6}" stroke-linecap="round"/>
              <path d="M-10.5 3 h20 q3.5 0 3.5 -3.5" fill="none" stroke="${INK}" stroke-width="${SW * 0.8}" stroke-linecap="round"/>
            </g>`).join('')}</g>
            <g class="cc-cover" opacity="0">${[[G.face.eyeL, T.pawL, 2.8, -37.5], [G.face.eyeR, T.pawR, 21.9, -37]].map(([[x, y], d, cx, cy]) => `<circle cx="${x}" cy="${y + 1}" r="10.5" fill="${col}"/><g transform="translate(${x} ${y + 2}) scale(0.85) translate(${-cx} ${-cy})"><path d="${d}" fill="${INK}"/></g>`).join('')}</g>
            <g class="cc-helmet" opacity="0"><g class="cc-helmet-y">
              <path d="M-22 -92 q0 -22 22 -24 q22 2 22 24 z" fill="${COL.helmet}" stroke="${INK}" stroke-width="${SW * 0.8}" stroke-linejoin="round"/>
              <path d="M-4 -114 h8 v10 h-8 z" fill="${COL.helmet2}" stroke="${INK}" stroke-width="${SW * 0.6}" stroke-linejoin="round"/>
              <path d="M-30 -92 h60 q3 0 3 3 q0 3 -3 3 h-60 q-3 0 -3 -3 q0 -3 3 -3 z" fill="${COL.helmet2}" stroke="${INK}" stroke-width="${SW * 0.8}" stroke-linejoin="round"/>
              <path d="M-12 -104 q6 -6 14 -8" fill="none" stroke="#fff" stroke-width="${SW * 0.6}" stroke-linecap="round" opacity=".8"/>
            </g></g>
            <g class="cc-snowcap" opacity="0"><path d="M-23 -89 q-4 -12 9 -15 q2 -11 14 -9 q9 -8 18 1 q12 0 9 12 q-1 7 -10 7 h-31 q-6 0 -9 4 z" fill="#fff" stroke="${INK}" stroke-width="${SW * 0.7}" stroke-linejoin="round"/><circle cx="-7" cy="-99" r="1.7" fill="#cfe2f6"/><circle cx="9" cy="-103" r="1.5" fill="#cfe2f6"/><circle cx="20" cy="-96" r="1.3" fill="#cfe2f6"/></g>
            <g class="cc-sweat" opacity="0"><path d="M44 -84 q-4 7 -4 10 a4 4 0 0 0 8 0 q0 -3 -4 -10 z" fill="#cfe4fb" stroke="${INK}" stroke-width="${SW * 0.55}" stroke-linejoin="round"/></g>
            <g class="cc-paws">
              <path class="cc-paw cc-paw-l" d="${T.pawL}" fill="${INK}"/>
              <path class="cc-paw cc-paw-r" d="${T.pawR}" fill="${INK}"/>
              <g class="cc-raise cc-raise-l" opacity="0"><path d="${G.paws.raiseL}" fill="none" stroke="${INK}" stroke-width="${10 + SW * 1.6}" stroke-linecap="round"/><path d="${G.paws.raiseL}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/><circle cx="-44" cy="-63" r="7.5" fill="${col}" stroke="${INK}" stroke-width="${SW * 0.8}"/><path d="M-48 -67 q4 -3 8 0" fill="none" stroke="${INK}" stroke-width="${SW * 0.55}" stroke-linecap="round" opacity=".55"/></g>
              <g class="cc-raise cc-raise-r" opacity="0"><path d="${G.paws.raiseR}" fill="none" stroke="${INK}" stroke-width="${10 + SW * 1.6}" stroke-linecap="round"/><path d="${G.paws.raiseR}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/><circle cx="64" cy="-63" r="7.5" fill="${col}" stroke="${INK}" stroke-width="${SW * 0.8}"/><path d="M60 -67 q4 -3 8 0" fill="none" stroke="${INK}" stroke-width="${SW * 0.55}" stroke-linecap="round" opacity=".55"/></g>
            </g>
          </g>
        </g>
      </g>
    </g>`;
  }

  // ---------------------------------------------------------- controller
  class CatAnimationController {
    constructor(el, kind, h) {
      this.el = el; this.kind = kind; this.h = h; this.scale = h / 100;
      this.q = (s) => el.querySelector(s);
      this.pose = this.q('.cc-pose'); this.bobG = this.q('.cc-bob'); this.tailG = this.q('.cc-tail');
      this.earL = this.q('.cc-ear-l'); this.earR = this.q('.cc-ear-r'); this.face = this.q('.cc-face');
      this.eyesG = this.q('.cc-eyes'); this.mouthG = this.q('.cc-mouth'); this.blushG = this.q('.cc-blush');
      this.pawL = this.q('.cc-paw-l'); this.pawR = this.q('.cc-paw-r'); this.raiseL = this.q('.cc-raise-l'); this.raiseR = this.q('.cc-raise-r');
      this.shadowG = this.q('.cc-shadow'); this.shadowEl = this.shadowG.firstElementChild; this.skatesG = this.q('.cc-skates');
      this.coverG = this.q('.cc-cover'); this.helmetG = this.q('.cc-helmet'); this.helmetY = this.q('.cc-helmet-y'); this.sweatG = this.q('.cc-sweat'); this.snowcapG = this.q('.cc-snowcap');
      this.mirror = kind === 'pink' ? -1 : 1;
      // authoritative state
      this.s = { x: 0, y: 0, flip: 1, lean: 0, sx: 1, sy: 1, bob: 0, tilt: 0, gaze: 0, blink: 0, earL: 0, earR: 0, tail: 0, tailIdle: 0, breath: 1, back: false, pawL: 0, pawR: 0, raiseL: 0, raiseR: 0, air: 0, skates: 0, gazeY: 0, cover: 0, helmet: 0, helmetDrop: 0, sweat: 0, spin: 0, snowcap: 0 };
      this.expr = 'shy'; this.exprBase = EXPRESSIONS.shy;
      this.busy = false; this.phase = Math.random() * 7; this.nextBlink = 1.5 + Math.random() * 3;
      this.setExpression('shy');
      this.render();
    }
    // ---- expression
    setExpression(name) {
      const e = EXPRESSIONS[name] || EXPRESSIONS.shy; this.expr = name; this.exprBase = e;
      this.eyesG.innerHTML = (EYES[e.eyes] || EYES.dots)(G.face.eyeR_);
      this.eyesKind = e.eyes;
      this.mouthG.innerHTML = MOUTHS[e.mouth] || MOUTHS.w;
      this.blushG.setAttribute('opacity', e.blush ? '1' : '0');
      this.render();
    }
    // ---- rendering: the ONLY place that writes transforms
    render() {
      const s = this.s, k = this.scale;
      this.el.setAttribute('transform', `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);
      this.pose.setAttribute('transform', `rotate(${s.lean.toFixed(2)}) scale(${(k * s.sx * s.flip).toFixed(4)} ${(k * s.sy * s.breath).toFixed(4)})`);
      // the ground shadow stays on the ground: it shrinks and fades as the cat leaves it
      const air = Math.max(0, s.air); const sh = Math.max(0.35, 1 - air / 140);
      this.shadowG.setAttribute('transform', `translate(0 ${air.toFixed(2)}) scale(${(k * s.flip * sh).toFixed(4)} ${(k * sh).toFixed(4)})`);
      this.shadowEl.setAttribute('opacity', (0.07 * Math.max(0.3, 1 - air / 120)).toFixed(3));
      this.bobG.setAttribute('transform', `translate(0 ${s.bob.toFixed(2)})`);
      this.tailG.setAttribute('transform', `rotate(${(s.tail + s.tailIdle).toFixed(2)} ${G.tail.pivot[0]} ${G.tail.pivot[1]}) translate(0 ${s.bob.toFixed(2)})`);
      const eb = this.exprBase.ears;
      this.earL.setAttribute('transform', `rotate(${(s.earL + eb[0]).toFixed(2)} ${G.earL.pivot[0]} ${G.earL.pivot[1]})`);
      this.earR.setAttribute('transform', `rotate(${(s.earR + eb[1]).toFixed(2)} ${G.earR.pivot[0]} ${G.earR.pivot[1]})`);
      const tilt = s.tilt + this.exprBase.tilt;
      this.face.setAttribute('transform', `rotate(${tilt.toFixed(2)} ${G.face.cx} ${G.face.cy}) translate(${(s.gaze * 2.2).toFixed(2)} ${(Math.abs(tilt) * 0.08 + s.gazeY * 2.4).toFixed(2)})`);
      this.coverG.setAttribute('opacity', s.cover ? '1' : '0'); this.coverG.setAttribute('transform', this.face.getAttribute('transform'));
      this.helmetG.setAttribute('opacity', s.helmet ? '1' : '0'); this.helmetY.setAttribute('transform', `translate(0 ${(-s.helmetDrop).toFixed(2)})`);
      this.sweatG.setAttribute('opacity', s.sweat ? String(s.sweat) : '0');
      this.snowcapG.setAttribute('opacity', s.snowcap ? String(s.snowcap) : '0');
      this.face.setAttribute('opacity', s.back ? '0' : '1');
      this.blushG.setAttribute('opacity', this.exprBase.blush && !s.back ? '1' : '0');
      // blink: swap eyes to closed lines while blinking (dots/wide only)
      if (s.blink > 0.5 && this.eyesKind !== 'closed' && !this._blinking) { this._blinking = true; this.eyesG.innerHTML = EYES.closed(); }
      else if (s.blink <= 0.5 && this._blinking) { this._blinking = false; this.eyesG.innerHTML = (EYES[this.eyesKind] || EYES.dots)(G.face.eyeR_); }
      // paws
      this.pawL.setAttribute('transform', `translate(0 ${(-s.pawL * 2.5).toFixed(2)})`); this.pawR.setAttribute('transform', `translate(0 ${(-s.pawR * 2.5).toFixed(2)})`);
      this.pawL.setAttribute('opacity', s.raiseL > 0.5 ? '0' : '1'); this.pawR.setAttribute('opacity', s.raiseR > 0.5 ? '0' : '1');
      this.raiseL.setAttribute('opacity', s.raiseL > 0.5 ? '1' : '0'); this.raiseR.setAttribute('opacity', s.raiseR > 0.5 ? '1' : '0');
      this.skatesG.setAttribute('opacity', s.skates ? '1' : '0');
    }
    set(p) { Object.assign(this.s, p); this.render(); return this; }
    // scene-space point of a raised paw tip ('l' or 'r'), ignoring lean/breath (close enough for holding props)
    pawPoint(side) { const s = this.s, k = this.scale; const lx = side === 'l' ? -44 : 64; return { x: s.x + lx * k * s.sx * s.flip, y: s.y - 63 * k * s.sy, flip: s.flip }; }
    place(x, y) { this.s.x = x; this.s.y = y; this.render(); return this; }
    // which side is "forward": flip 1 faces screen-right for blue; the pink template faces left, so her forward flip is -1
    faceDir(dir) { this.s.flip = this.kind === 'pink' ? -dir : dir; this.render(); }
    // ---- idle (called by the scene's shared loop with elapsed seconds)
    tick(t) {
      if (REDUCED || this.busyIdle) return;
      const s = this.s; const p = this.phase;
      s.breath = 1 + 0.012 * Math.sin((t + p) * 2 * Math.PI / 3.6);
      s.tailIdle = 6 * Math.sin((t + p) * 2 * Math.PI / 2.8);
      if (!this.busy) {
        s.earL = 0; s.earR = 0;
        // an occasional ear flick
        const f = ((t + p) % 6.5); if (f > 6.2) { const z = (f - 6.2) / 0.3; s.earR = -10 * Math.sin(Math.PI * z); }
      }
      if (t > this.nextBlink && s.blink === 0 && !s.back) { s.blink = 1; setTimeout(() => { s.blink = 0; this.render(); }, 120); this.nextBlink = t + 2.4 + Math.random() * 3.6; }
      this.render();
    }
    // ---- action primitives (each returns a promise; scenes sequence them)
    async blinkOnce() { this.s.blink = 1; this.render(); await wait(120); this.s.blink = 0; this.render(); }
    // dir is in screen terms (+1 = screen right); the pink template is mirrored
    async lookAt(dir, dur = 240) { const to = dir * this.mirror; const from = this.s.gaze; await tween(dur, (t) => { this.s.gaze = from + (to - from) * ease.out(t); this.render(); }); }
    async tiltTo(deg, dur = 300) { const to = deg * this.mirror * this.s.flip; const from = this.s.tilt; await tween(dur, (t) => { this.s.tilt = from + (to - from) * ease.inOut(t); this.render(); }); }
    async leanTo(deg, dur = 300) { const from = this.s.lean; await tween(dur, (t) => { this.s.lean = from + (deg - from) * ease.inOut(t); this.s.tail = -this.s.lean * 0.9; this.render(); }); }
    async earFlick() { await tween(260, (t) => { this.s.earR = -14 * Math.sin(Math.PI * t); this.render(); }); }
    async nod() { await tween(380, (t) => { this.s.tilt = 7 * Math.sin(Math.PI * t); this.s.bob = 2 * Math.sin(Math.PI * t); this.render(); }); this.s.tilt = 0; this.s.bob = 0; this.render(); }
    async perk() { await tween(360, (t) => { const b = Math.sin(Math.PI * t); this.s.sy = 1 + 0.06 * b; this.s.sx = 1 - 0.04 * b; this.s.earL = -10 * b; this.s.earR = 10 * b; this.s.bob = -3 * b; this.render(); }); this.s.sy = 1; this.s.sx = 1; this.s.earL = this.s.earR = 0; this.s.bob = 0; this.render(); }
    async wave(side = 'r', times = 2) {
      const k = side === 'r' ? 'raiseR' : 'raiseL'; this.s[k] = 1; this.render();
      for (let i = 0; i < times; i++) await tween(260, (t) => { this.s.tilt = 4 * Math.sin(2 * Math.PI * t); this.render(); });
      this.s[k] = 0; this.s.tilt = 0; this.render();
    }
    async crouch(amount = 0.08, dur = 220) { const a0 = this.s.sy, b0 = this.s.sx; await tween(dur, (t) => { const e = ease.out(t); this.s.sy = a0 + (1 - amount - a0) * e; this.s.sx = b0 + (1 + amount * 0.6 - b0) * e; this.render(); }); }
    // ease back to neutral with a tiny overshoot (follow-through)
    async settle(dur = 240) { const sx0 = this.s.sx, sy0 = this.s.sy, l0 = this.s.lean, t0 = this.s.tail; await tween(dur, (t) => { const e = ease.out(t); const o = Math.sin(Math.PI * t) * 0.025; this.s.sx = sx0 + (1 - sx0) * e - o; this.s.sy = sy0 + (1 - sy0) * e + o; this.s.lean = l0 * (1 - e); this.s.tail = t0 * (1 - e); this.render(); }); this.s.sx = this.s.sy = 1; this.s.lean = 0; this.s.tail = 0; this.s.bob = 0; this.render(); }
    // hop from the current position to (x, y) along an arc
    async hopTo(x, y, { height = 40, dur = 560, turn = false } = {}) {
      const x0 = this.s.x, y0 = this.s.y; if (Math.abs(x - x0) > 1) this.faceDir(x > x0 ? 1 : -1);
      await this.crouch(0.1, 140);
      TA.Sound.play('hop');
      await tween(dur, (t) => {
        const e = ease.inOut(t), arc = 4 * t * (1 - t);
        this.s.x = x0 + (x - x0) * e; this.s.y = y0 + (y - y0) * e - height * arc; this.s.air = height * arc;
        const up = t < 0.5;
        this.s.sy = 1 + (up ? 0.1 : 0.04) * Math.sin(Math.PI * t); this.s.sx = 1 - 0.06 * Math.sin(Math.PI * t);
        this.s.earL = 12 * (up ? 1 : -1) * Math.sin(Math.PI * t); this.s.earR = -this.s.earL;
        this.s.tail = (this.kind === 'blue' ? -1 : 1) * 22 * Math.sin(Math.PI * t);
        if (turn) { this.s.sx *= 0.82 + 0.18 * Math.abs(Math.cos(Math.PI * t)); this.s.lean = 6 * Math.sin(2 * Math.PI * t); }
        this.render();
      });
      this.s.x = x; this.s.y = y; this.s.lean = 0; this.s.earL = this.s.earR = 0; this.s.air = 0;
      TA.Sound.play('land');
      await tween(260, (t) => { const e = ease.out(t); this.s.sy = 0.88 + 0.12 * e + 0.03 * Math.sin(Math.PI * t); this.s.sx = 1.1 - 0.1 * e; this.s.tail *= (1 - e); this.render(); });
      this.s.sx = this.s.sy = 1; this.s.tail = 0; this.render();
    }
    // walk along an SVG path element between two fractions of its length
    // walk along a path; `trail` keeps the cat that many units behind the leader along the same path (single file)
    async walkAlong(pathEl, from, to, dur, { offsetX = 0, offsetY = 0, stepHz = 1.4, trail = 0, easing = null } = {}) {   // stepHz: paw-swap cycles per second (two bobs each)
      const len = pathEl.getTotalLength(); const start = { x: this.s.x, y: this.s.y }; const ez = easing || ease.walk;
      const dist = (e) => Math.min(len, Math.max(0, len * (from + (to - from) * e) - trail));
      const p0 = pathEl.getPointAtLength(dist(0)); p0.x += offsetX; p0.y += offsetY;
      await tween(dur, (t) => {
        const e = ez(t); const d = dist(e);
        const p = pathEl.getPointAtLength(d); const q = pathEl.getPointAtLength(Math.min(len, Math.max(0, d + (to > from ? 2 : -2))));
        if (Math.abs(q.x - p.x) > 0.4) this.faceDir(q.x > p.x ? 1 : -1);
        const blend = Math.min(1, d / Math.max(30, trail * 0.6)); // from where the cat stood onto the path over its first stretch (a follower waits in place first)
        const ox = (start.x - p0.x) * (1 - blend), oy = (start.y - p0.y) * (1 - blend);
        const step = Math.sin(t * dur / 1000 * stepHz * 2 * Math.PI);
        this.s.x = p.x + ox + offsetX; this.s.y = p.y + oy + offsetY - Math.abs(step) * 2.2; this.s.air = Math.abs(step) * 2.2;
        this.s.pawL = step > 0 ? 1 : 0; this.s.pawR = step > 0 ? 0 : 1;
        this.s.lean = 1.2 * Math.sin(Math.PI * t) * this.s.flip * this.mirror; this.s.tail = 5 * step;
        this.render();
      });
      this.s.pawL = this.s.pawR = 0; this.s.lean = 0; this.s.tail = 0; this.s.air = 0; this.render();
    }
    // skate along a path: lean into the curve, one paw forward, tail trailing
    async glideAlong(pathEl, from, to, dur, { offsetX = 0, offsetY = 0, onFrame = null, face = null } = {}) {
      const len = pathEl.getTotalLength(); const start = { x: this.s.x, y: this.s.y }; const p0 = pathEl.getPointAtLength(len * from); p0.x += offsetX; p0.y += offsetY;
      if (face) this.faceDir(face);
      this.s.raiseR = this.kind === 'blue' ? 1 : 0; this.s.raiseL = this.kind === 'pink' ? 1 : 0;
      await tween(dur, (t) => {
        const e = ease.inOut(t); const d = len * (from + (to - from) * e);
        const p = pathEl.getPointAtLength(d); const q = pathEl.getPointAtLength(Math.min(len, Math.max(0, d + 3)));
        const dir = Math.atan2(q.y - p.y, q.x - p.x);
        const ox = (start.x - p0.x) * (1 - e), oy = (start.y - p0.y) * (1 - e);
        this.s.x = p.x + ox + offsetX; this.s.y = p.y + oy + offsetY;
        const lean = Math.max(-8, Math.min(8, Math.cos(dir) * 7)) * Math.sin(Math.PI * Math.min(1, t * 1.2));
        const push = Math.sin(t * dur / 1000 * 1.6 * 2 * Math.PI);      // a slow push-glide rhythm
        this.s.lean = lean; this.s.tail = -lean * 1.8 * this.mirror + push * 4; this.s.earL = -lean * 0.6; this.s.earR = -lean * 0.6;
        this.s.sy = 1 + 0.02 * push; this.s.sx = 1 - 0.012 * push; this.s.bob = -1.2 * Math.max(0, push);
        this.render(); if (onFrame) onFrame(d, p, t);
      });
      this.s.raiseL = this.s.raiseR = 0; this.s.bob = 0; await this.settle(240); this.s.earL = this.s.earR = 0; this.render();
    }
    // stylised twirl: narrow to 60%, show the back, return; bow and tail lag
    async spin(dur = 760) {
      const y0 = this.s.y; const steps = [[1, 0.6, false], [0.6, 1, true], [1, 0.6, true], [0.6, 1, false]];
      let k = 0;
      for (const [a, b, back] of steps) {
        this.s.back = back;
        await tween(dur / 4, (t) => {
          const e = ease.inOut(t); this.s.sx = a + (b - a) * e;
          this.s.tail = (back ? -1 : 1) * 18 * Math.sin(Math.PI * t); this.s.earL = -8 * Math.sin(Math.PI * t); this.s.earR = 8 * Math.sin(Math.PI * t);
          this.s.y = y0 - 9 * Math.sin(Math.PI * (k + t) / 4); this.s.air = 9 * Math.sin(Math.PI * (k + t) / 4); this.s.sy = 1 + 0.03 * Math.sin(Math.PI * (k + t) / 4);
          this.render();
        });
        k++;
      }
      this.s.sx = 1; this.s.sy = 1; this.s.back = false; this.s.tail = 0; this.s.earL = this.s.earR = 0; this.s.y = y0; this.s.air = 0; this.render();
    }
    // a real pirouette: the body turns through cos(θ), never quite flat, paws up, ears and tail lagging, a little rise
    async pirouette(dur = 1200, turns = 2) {
      const y0 = this.s.y; const flip0 = this.s.flip; this.s.raiseL = 1; this.s.raiseR = 1; this.render();
      await tween(dur, (t) => {
        const e = ease.inOut(t); const th = e * turns * 2 * Math.PI; const c = Math.cos(th);
        this.s.sx = Math.sign(c || 1) * Math.max(0.14, Math.abs(c)); this.s.back = c < 0;
        const lift = Math.sin(Math.PI * t); this.s.y = y0 - 10 * lift; this.s.air = 10 * lift; this.s.sy = 1 + 0.04 * lift;
        this.s.tail = -Math.sin(th) * 16; this.s.earL = -Math.sin(th) * 9; this.s.earR = Math.sin(th) * 9;
        this.render();
      });
      this.s.sx = 1; this.s.sy = 1; this.s.back = false; this.s.tail = 0; this.s.earL = this.s.earR = 0; this.s.y = y0; this.s.air = 0; this.s.flip = flip0;
      this.s.raiseL = 0; this.s.raiseR = 0; this.render();
      await this.settle(260);
    }
    // happy clapping: both paws up, little alternating pats
    async clap(times = 3) {
      this.s.raiseL = 1; this.s.raiseR = 1; this.render();
      for (let i = 0; i < times; i++) await tween(220, (t) => { const b = Math.sin(Math.PI * t); this.s.bob = -3 * b; this.s.sy = 1 + 0.03 * b; this.s.tilt = 4 * Math.sin(2 * Math.PI * t); this.render(); });
      this.s.raiseL = 0; this.s.raiseR = 0; this.s.bob = 0; this.s.sy = 1; this.s.tilt = 0; this.render();
    }
    // look at the viewer: face forward, eyes a little wide, a tiny tilt
    async lookAtViewer(dur = 240) { await Promise.all([this.lookAt(0, dur), this.tiltTo(0, dur)]); }
    async lookUp(amount = 1, dur = 260) { const from = this.s.gazeY; await tween(dur, (t) => { this.s.gazeY = from + (-amount - from) * ease.out(t); this.render(); }); }
    async lookDown(amount = 1, dur = 260) { const from = this.s.gazeY; await tween(dur, (t) => { this.s.gazeY = from + (amount - from) * ease.out(t); this.render(); }); }
    async gazeReset(dur = 240) { const from = this.s.gazeY; await tween(dur, (t) => { this.s.gazeY = from * (1 - ease.out(t)); this.render(); }); }
    // a comic double take: glance, look away, snap back wide-eyed
    async doubleTake(dir = 1) {
      const expr = this.expr;
      await this.lookAt(dir, 180); await wait(260); await this.lookAt(-dir * 0.6, 160); await wait(140);
      this.setExpression('surprised'); await Promise.all([this.lookAt(dir, 90), this.perk()]); await wait(420);
      this.setExpression(expr);
    }
    // the hard hat drops onto the head with a little bounce
    async helmetOn() {
      this.s.helmet = 1; this.s.helmetDrop = 150; this.render();
      await tween(380, (t) => { const e = ease.in(t); this.s.helmetDrop = 150 * (1 - e); this.render(); });
      TA.Sound.play('clank');
      await tween(260, (t) => { const b = Math.sin(Math.PI * t); this.s.helmetDrop = 7 * b; this.s.sy = 1 - 0.06 * b; this.s.sx = 1 + 0.04 * b; this.s.earL = -14 * b; this.s.earR = 14 * b; this.render(); });
      this.s.helmetDrop = 0; this.s.sx = this.s.sy = 1; this.s.earL = this.s.earR = 0; this.render();
    }
    async sweatDrop(ms = 1400) { await tween(260, (t) => { this.s.sweat = ease.out(t); this.render(); }); await wait(ms); await tween(300, (t) => { this.s.sweat = 1 - t; this.render(); }); this.s.sweat = 0; this.render(); }
    // the triumphant mountaineer: chest out, one paw high, chin up
    async triumph(ms = 900) {
      const expr = this.expr; this.setExpression('proud'); this.s.raiseR = 1;
      await tween(260, (t) => { const e = ease.out(t); this.s.sy = 1 + 0.06 * e; this.s.sx = 1 - 0.03 * e; this.s.lean = -5 * e * this.s.flip * this.mirror; this.render(); });
      await wait(ms);
      this.s.raiseR = 0; this.setExpression(expr); await this.settle(240);
    }
    // showing off: a pirouette that gets away from him. He winds up, spins faster and faster, the spin
    // goes wrong (the body wobbles off its axis), and he ends dizzy and swaying. Returns when he is swaying.
    async failedPirouette(onDizzy) {
      const y0 = this.s.y, x0 = this.s.x, flip0 = this.s.flip;
      this.setExpression('proud'); await this.crouch(0.12, 260); await wait(120);
      this.s.raiseL = 1; this.s.raiseR = 1; this.setExpression('determined'); this.render();
      let th = 0;
      await tween(2100, (t) => {
        const speed = 2 + 14 * t * t;                                  // turns per second, accelerating
        th += speed * (16 / 1000) * 2 * Math.PI;                       // frame-rate independent enough at 60fps
        const c = Math.cos(th); this.s.sx = Math.sign(c || 1) * Math.max(0.14, Math.abs(c)); this.s.back = c < 0;
        const wobble = Math.max(0, t - 0.55) / 0.45;                   // the axis starts to go after half way
        this.s.lean = Math.sin(th * 0.37) * 16 * wobble; this.s.x = x0 + Math.sin(th * 0.23) * 9 * wobble;
        const lift = Math.sin(Math.PI * Math.min(1, t * 1.3)); this.s.y = y0 - 8 * lift; this.s.air = 8 * lift; this.s.sy = 1 + 0.05 * lift;
        this.s.tail = -Math.sin(th) * 16; this.s.earL = -Math.sin(th) * 9; this.s.earR = Math.sin(th) * 9;
        if (t > 0.8 && this.expr !== 'surprised') this.setExpression('surprised');
        this.render();
      });
      this.s.raiseL = this.s.raiseR = 0; this.s.back = false; this.s.flip = flip0; this.s.y = y0; this.s.air = 0; this.s.sy = 1; this.s.sx = 1;
      this.setExpression('dizzy'); this.render(); if (onDizzy) onDizzy();
      this.swaying = true; const t0 = performance.now();
      const sway = () => { if (!this.swaying) return; const t = (performance.now() - t0) / 1000; this.s.lean = Math.sin(t * 5.2) * 11; this.s.tilt = Math.sin(t * 3.1) * 12; this.s.x = x0 + Math.sin(t * 2.6) * 5; this.render(); requestAnimationFrame(sway); };
      if (!REDUCED) requestAnimationFrame(sway);
    }
    // she takes his paw: he steadies, the sway dies down, both blush
    async steady(dur = 900) {
      this.swaying = false; const l0 = this.s.lean, t0 = this.s.tilt, x0 = this.s.x;
      await tween(dur, (t) => { const e = ease.out(t); const damp = (1 - e) * Math.cos(t * 9); this.s.lean = l0 * damp; this.s.tilt = t0 * damp; this.render(); });
      this.s.lean = 0; this.s.tilt = 0; this.render();
    }
    // the sway gives out: he goes down flat on the ice, a dizzy puddle of a cat (squashed, tail flopped out)
    async flop(dur = 340) {
      this.swaying = false; const l0 = this.s.lean, t0 = this.s.tilt;
      await tween(dur, (t) => { const e = ease.in(t); this.s.sy = 1 - 0.52 * e; this.s.sx = 1 + 0.38 * e; this.s.lean = l0 * (1 - e); this.s.tilt = t0 * (1 - e) + 10 * e; this.s.tail = 28 * e; this.s.raiseL = this.s.raiseR = 0; this.render(); });
      TA.Sound.play('land');
      await tween(180, (t) => { const b = Math.sin(Math.PI * t); this.s.sy = 0.48 - 0.05 * b; this.s.sx = 1.38 + 0.06 * b; this.render(); });
    }
    // ...and back on his feet with a spring (an overshoot, then settled)
    async springUp(dur = 380) {
      const sy0 = this.s.sy, sx0 = this.s.sx, tl0 = this.s.tail, t0 = this.s.tilt;
      await tween(dur, (t) => { const e = ease.out(t); const o = Math.sin(Math.PI * t) * 0.2; this.s.sy = sy0 + (1 - sy0) * e + o; this.s.sx = sx0 + (1 - sx0) * e - o * 0.6; this.s.tail = tl0 * (1 - e); this.s.tilt = t0 * (1 - e); this.render(); });
      this.s.sy = 1; this.s.sx = 1; this.s.tail = 0; this.s.tilt = 0; this.render();
    }
    // a very short, very silly synchronized dance: sway with paws up, tail swinging, four beats
    async dance(beats = 4, beatMs = 250) {
      const y0 = this.s.y; this.s.raiseL = 1; this.s.raiseR = 1; const expr = this.expr; this.setExpression('joy');
      for (let i = 0; i < beats; i++) {
        const dir = i % 2 ? -1 : 1;
        await tween(beatMs, (t) => { const b = Math.sin(Math.PI * t); this.s.lean = dir * 9 * Math.sin(Math.PI * Math.min(1, t * 1.6)); this.s.y = y0 - 7 * b; this.s.air = 7 * b; this.s.sy = 1 + 0.06 * b; this.s.sx = 1 - 0.04 * b; this.s.tail = dir * 18; this.s.tilt = dir * 6; this.render(); });
      }
      this.s.raiseL = this.s.raiseR = 0; this.s.y = y0; this.s.air = 0; this.setExpression(expr); await this.settle(220); this.s.tilt = 0; this.render();
    }
    // a near-slip on the snow: the feet shoot forward, the body tips back with the arms out, then a quick scramble upright
    async nearSlip() {
      const expr = this.expr; const x0 = this.s.x; const fwd = this.s.flip * this.mirror * -1;   // which way is "forward" on screen for this cat
      this.setExpression('surprised'); this.s.raiseL = 1; this.s.raiseR = 1; TA.Sound.play('slip');
      await tween(240, (t) => { const e = ease.out(t); this.s.lean = -16 * e * fwd * -1; this.s.x = x0 + 10 * e * fwd * -1; this.s.sx = 1 + 0.08 * e; this.s.sy = 1 - 0.1 * e; this.s.earL = 14 * e; this.s.earR = -14 * e; this.render(); });
      await wait(140);
      await tween(300, (t) => { const b = Math.sin(Math.PI * t); const e = ease.inOut(t); this.s.lean = -16 * (1 - e) * fwd * -1 + 6 * b * fwd; this.s.sx = 1 + 0.08 * (1 - e) - 0.03 * b; this.s.sy = 1 - 0.1 * (1 - e) + 0.05 * b; this.s.bob = -3 * b; this.render(); });
      this.s.raiseL = this.s.raiseR = 0; this.s.lean = 0; this.s.sx = this.s.sy = 1; this.s.bob = 0; this.s.earL = this.s.earR = 0; this.setExpression(expr); this.render();
    }
    // the cat-slap: he turns to the viewer with a flat look, leans in close (scales up a touch), and swipes.
    // `onSwipe` lets the scene draw the swipe arc and play the sound at the moment of impact.
    async slap(onSwipe) {
      const expr = this.expr; const flip0 = this.s.flip; const x0 = this.s.x, y0 = this.s.y, lean0 = this.s.lean;
      this.setExpression('stern'); await this.lookAtViewer(220); await wait(520);
      await tween(200, (t) => { const e = ease.out(t); this.s.sx = 1 + 0.16 * e; this.s.sy = 1 + 0.16 * e; this.s.y = y0 + 6 * e; this.s.lean = lean0 * (1 - e); this.render(); });
      this.s.raiseR = 1; this.render(); await wait(160);
      await tween(90, (t) => { this.s.lean = -14 * t * this.s.flip * this.mirror; this.s.gaze = 0; this.render(); });
      if (onSwipe) onSwipe(this.pawPoint('r'));
      await tween(140, (t) => { const e = ease.out(t); this.s.lean = (-14 + 26 * e) * this.s.flip * this.mirror; this.render(); });
      await wait(260);
      await tween(300, (t) => { const e = ease.inOut(t); this.s.sx = 1.16 - 0.16 * e; this.s.sy = 1.16 - 0.16 * e; this.s.y = y0 + 6 * (1 - e); this.s.lean = 12 * (1 - e) * this.s.flip * this.mirror + lean0 * e; this.render(); });
      this.s.raiseR = 0; this.s.flip = flip0; this.s.x = x0; this.s.y = y0; this.s.lean = lean0; this.setExpression(expr); this.render();
    }
    // "no.": the head shakes side to side (eyes and face sweep, a little counter-tilt, ears flat); onBeat(i) fires at each turn
    async shakeHead(times = 3, dur = 900, onBeat = null) {
      let last = -1;
      await tween(dur, (t) => {
        const w = Math.sin(t * times * 2 * Math.PI) * Math.sin(Math.PI * Math.min(1, t * 1.15));
        this.s.gaze = w * 1.1 * this.mirror; this.s.tilt = -w * 5; this.s.earL = -8; this.s.earR = 8;
        const beat = Math.floor(t * times * 2); if (beat !== last) { last = beat; if (onBeat) onBeat(beat); }
        this.render();
      });
      this.s.gaze = 0; this.s.tilt = 0; this.s.earL = this.s.earR = 0; this.render();
    }
    // the bouncer's stance: planted wide, both paws up, stern. guard(false) relaxes it.
    guard(on = true) { this.s.raiseL = this.s.raiseR = on ? 1 : 0; this.s.sx = on ? 1.1 : 1; this.render(); return this; }
    // paws over the eyes (bashful); call with 0 to peek out again
    async coverFace(on = 1) { this.s.cover = on; this.render(); }
    async bounce(height = 10, dur = 420) { const y0 = this.s.y; await tween(dur, (t) => { const a = Math.sin(Math.PI * t); this.s.y = y0 - height * a; this.s.air = height * a; this.s.sy = 1 + 0.05 * a; this.s.sx = 1 - 0.03 * a; this.render(); }); this.s.y = y0; this.s.air = 0; this.s.sx = this.s.sy = 1; this.render(); }
    async nuzzle(dir, dur = 420) { await Promise.all([this.leanTo(dir * 7, dur), this.tiltTo(dir * 6, dur)]); }
  }

  // ---------------------------------------------------------- petting (the easter egg)
  // A tap on a cat that is standing around earns a little reaction; a few variations so it never repeats
  // twice in a row. Tapping the pink cat again and again makes her more and more bashful: on every third
  // tap she hides behind her paws and leans on him, and he goes pink. `idle()` is the scene's say on
  // whether the cats are free right now; nothing happens while a choreography runs.
  function pettable(blue, pink, idle) {
    let busy = false, last = -1, pinkTaps = 0;
    const other = (c) => (c === blue ? pink : blue);
    const reactions = [
      async (c) => { TA.Sound.play('mew'); const e = c.expr; c.setExpression('pleased'); await c.tiltTo(8, 200); await c.blinkOnce(); await wait(260); await c.tiltTo(0, 200); c.setExpression(e); },
      async (c) => { TA.Sound.play('purr'); const e = c.expr; c.setExpression('joy'); await c.perk(); await wait(380); c.setExpression(e); },
      async (c) => { TA.Sound.play('meow'); const e = c.expr; c.setExpression('delighted'); await c.bounce(9, 380); await wait(120); c.setExpression(e); },
      async (c) => { TA.Sound.play('mew'); const e = c.expr; c.setExpression('shy'); await c.lookAtViewer(200); await c.blinkOnce(); await wait(420); await c.lookAt(c.s.gaze, 1); c.setExpression(e); },
    ];
    async function bashful() {
      const toward = Math.sign(blue.s.x - pink.s.x) || -1;           // which way he is, in screen terms
      const eb = blue.expr, ep = pink.expr;
      TA.Sound.play('meowShy');
      pink.setExpression('bashful'); pink.coverFace(1); await pink.leanTo(toward * 9, 320);
      await wait(260); blue.setExpression('pleased'); await blue.blinkOnce(); await blue.tiltTo(-6, 220);
      await wait(1100);
      pink.coverFace(0); await Promise.all([pink.leanTo(0, 300), blue.tiltTo(0, 220)]);
      pink.setExpression(ep); blue.setExpression(eb);
    }
    const onTap = async (c, e) => {
      e.preventDefault(); e.stopPropagation();
      if (busy || (idle && !idle())) return;
      busy = true;
      if (TA.note) TA.note(`pet.${c.kind}`);
      try {
        if (c === pink && ++pinkTaps % 3 === 0) { if (TA.note) TA.note('pet.bashful'); await bashful(); }
        else { let i; do { i = Math.floor(Math.random() * reactions.length); } while (i === last); last = i; await reactions[i](c); }
      } finally { busy = false; }
    };
    [blue, pink].forEach((c) => {
      c.el.classList.add('pettable'); c.el.setAttribute('role', 'button'); c.el.setAttribute('tabindex', '-1'); c.el.setAttribute('aria-label', `${c.kind} cat`);
      c.el.addEventListener('click', (e) => onTap(c, e));
    });
    return { reset() { pinkTaps = 0; } };
  }

  // ---------------------------------------------------------- public API
  TA.cat = {
    markup: catMarkup,
    pettable,
    attach(svg, id, kind, h) { const el = svg.querySelector(`.ccat[data-id="${id}"]`); return new CatAnimationController(el, kind, h); },
    EXPRESSIONS: Object.keys(EXPRESSIONS),
    // a scene registers its cats; one rAF loop drives their idle life
    life(cats) {
      let raf = null; const t0 = performance.now();
      const step = (now) => { const t = (now - t0) / 1000; cats.forEach((c) => c.tick(t)); raf = requestAnimationFrame(step); };
      if (!REDUCED) raf = requestAnimationFrame(step); else cats.forEach((c) => c.render());
      return () => { if (raf) cancelAnimationFrame(raf); };
    },
  };
})();
