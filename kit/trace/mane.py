"""Adds the booklet's mane to the traced body: a column of pointed tufts with rounded valleys down each side,
from the ear bases to the paw level (every printed cat has it). Works on the dense faithful contour."""
import re, math, numpy as np
path = open('faithful_body.txt').read()
nums = [float(x) for x in re.findall(r'-?\d+\.?\d*', path)]
pts = [(nums[0], nums[1])]; i = 2
while i + 5 < len(nums): pts.append((nums[i+4], nums[i+5])); i += 6
P = np.array(pts); n = len(P)
# arc length
seg = np.hypot(*(np.roll(P, -1, axis=0) - P).T); s = np.concatenate([[0], np.cumsum(seg)[:-1]])
cx, cy = P[:, 0].mean(), P[:, 1].mean()
def outward(i):
    a = P[(i - 1) % n]; b = P[(i + 1) % n]; tx, ty = b[0] - a[0], b[1] - a[1]; L = math.hypot(tx, ty) or 1
    nx, ny = ty / L, -tx / L
    if (P[i][0] + nx - cx) ** 2 + (P[i][1] + ny - cy) ** 2 < (P[i][0] - nx - cx) ** 2 + (P[i][1] - ny - cy) ** 2: nx, ny = -nx, -ny
    return nx, ny
# mane zones: left side x < -24 and right side x > 48, between the ear bases and the paw level
def zone(x, y):
    if x < -24 and -82 < y < -34: return 'L'
    if x > 48 and -82 < y < -34: return 'R'
    return None
# 1) flatten the existing small bumps inside the zones (local average over ~14 units) so the tufts are clean
Q = P.copy()
for i in range(n):
    if zone(*P[i]):
        w = 7; acc = np.zeros(2); c = 0
        for d in range(-w, w + 1): acc += P[(i + d) % n]; c += 1
        Q[i] = acc / c
# 2) sawtooth tufts: sharp tips, rounded valleys (tri^2), depth 5.2, period 9.5 along the arc; taper at the zone ends
DEPTH, PERIOD = 6.2, 11.5
rng = np.random.default_rng(7); jit = {}
R = Q.copy()
for i in range(n):
    z = zone(*P[i])
    if not z: continue
    # taper: distance (in points) to the zone boundary
    k = 0
    while k < 6 and zone(*P[(i - k) % n]) == z and zone(*P[(i + k) % n]) == z: k += 1
    taper = min(1, k / 6)
    cell = int(s[i] // PERIOD); amp = jit.setdefault(cell, 1 + (rng.random() - 0.5) * 0.3)
    ph = (s[i] % PERIOD) / PERIOD; tri = 1 - abs(2 * ph - 1); bump = tri ** 2
    nx, ny = outward(i)
    R[i] = Q[i] + np.array([nx, ny]) * DEPTH * amp * bump * taper
# feet on y=0
R[:, 1] -= R[:, 1].max()
# RDP simplify then Catmull-Rom
def rdp(points, eps):
    def dist(p, a, b):
        if a == b: return math.hypot(p[0]-a[0], p[1]-a[1])
        t = max(0, min(1, ((p[0]-a[0])*(b[0]-a[0]) + (p[1]-a[1])*(b[1]-a[1])) / ((b[0]-a[0])**2 + (b[1]-a[1])**2)))
        q = (a[0] + t*(b[0]-a[0]), a[1] + t*(b[1]-a[1])); return math.hypot(p[0]-q[0], p[1]-q[1])
    def rec(pts):
        if len(pts) < 3: return pts
        a, b = pts[0], pts[-1]; dmax, idx = 0, 0
        for i in range(1, len(pts)-1):
            d = dist(pts[i], a, b)
            if d > dmax: dmax, idx = d, i
        if dmax > eps: return rec(pts[:idx+1])[:-1] + rec(pts[idx:])
        return [a, b]
    half = len(points)//2
    return rec(points[:half+1])[:-1] + rec(points[half:] + [points[0]])[:-1]
pts2 = [tuple(p) for p in R]; S = rdp(pts2, 0.22); m = len(S)
def cr(Q):
    out = f"M{Q[0][0]:.1f} {Q[0][1]:.1f}"
    for i in range(m):
        p0 = Q[(i-1)%m]; p1 = Q[i]; p2 = Q[(i+1)%m]; p3 = Q[(i+2)%m]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6); c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        out += f" C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return out + ' Z'
out = cr(S); open('mane_body.txt', 'w').write(out)
xs = [q[0] for q in S]; ys = [q[1] for q in S]
print(len(out), 'chars', m, 'pts; bbox x', round(min(xs), 1), round(max(xs), 1), 'y', round(min(ys), 1), round(max(ys), 1))
