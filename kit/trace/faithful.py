"""Builds the body contour straight from the booklet cutout's outline: ears and tail removed,
the real cheek and foot fluff kept, only scan noise smoothed away. Output normalised like cat.js."""
import numpy as np, math, json
raw = np.load('full_contour.npy')
k = 102 / 512.0
# --- classify points
x, y = raw[:, 0], raw[:, 1]
earL = (y < 112) & (x > 160) & (x < 338)
earR = (y < 104) & (x > 392) & (x < 530)
tail = (x < 150) & (y > 320)
keep = ~(earL | earR | tail)
# walk the contour; where a removed run is met, bridge with a straight line between its ends
n = len(raw); pts = []
i = 0
# start at a kept point
start = int(np.argmax(keep)); order = [(start + j) % n for j in range(n)]
j = 0
while j < n:
    idx = order[j]
    if keep[idx]: pts.append(tuple(raw[idx])); j += 1; continue
    # removed run: find its end
    a = pts[-1]; jj = j
    while jj < n and not keep[order[jj]]: jj += 1
    b = tuple(raw[order[jj % n]])
    # bridge: for the ears bow the bridge slightly upward (a gentle dome), for the tail keep it straight
    L = math.hypot(b[0] - a[0], b[1] - a[1]); m = max(2, int(L / 3))
    dome = (a[1] < 200 and b[1] < 200)
    for t in np.linspace(0, 1, m, endpoint=False)[1:]:
        px = a[0] + (b[0] - a[0]) * t; py = a[1] + (b[1] - a[1]) * t
        if dome: py -= 10 * math.sin(math.pi * t)
        pts.append((px, py))
    j = jj
P = np.array(pts)
# --- light smoothing (circular moving average, ~9 px window) keeps the fur bumps
def smooth(P, w):
    out = P.copy()
    for d in range(1, w // 2 + 1):
        out += np.roll(P, d, axis=0) + np.roll(P, -d, axis=0)
    return out / (2 * (w // 2) + 1)
S = smooth(P, 9)
# --- resample every ~4 px
seg = np.hypot(*(np.roll(S, -1, axis=0) - S).T); cum = np.concatenate([[0], np.cumsum(seg)]); total = cum[-1]
m = int(total / 4.0); targets = np.linspace(0, total, m, endpoint=False)
Q = []
for t in targets:
    i = int(np.searchsorted(cum, t) - 1); i = max(0, min(i, len(S) - 1)); i2 = (i + 1) % len(S)
    u = (t - cum[i]) / (seg[i] or 1); Q.append((S[i][0] + (S[i2][0] - S[i][0]) * u, S[i][1] + (S[i2][1] - S[i][1]) * u))
Q = [((px - 9.5) * k - 62, (py - 521.5) * k) for px, py in Q]
# feet on y = 0 exactly: shift so the lowest point is 0
ymax = max(q[1] for q in Q); Q = [(qx, qy - ymax) for qx, qy in Q]
mm = len(Q)
def cr(Q):
    out = f"M{Q[0][0]:.1f} {Q[0][1]:.1f}"
    for i in range(mm):
        p0 = Q[(i - 1) % mm]; p1 = Q[i]; p2 = Q[(i + 1) % mm]; p3 = Q[(i + 2) % mm]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out += f" C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return out + ' Z'
path = cr(Q); open('faithful_body.txt', 'w').write(path)
xs = [q[0] for q in Q]; ys = [q[1] for q in Q]
print(len(path), 'chars', mm, 'pts; bbox x', round(min(xs), 1), round(max(xs), 1), 'y', round(min(ys), 1), round(max(ys), 1))
# head-top between the ears, for ear placement
top = [q for q in Q if -5 < q[0] < 20]; print('head top y between ears ~', round(min(q[1] for q in top), 1))
