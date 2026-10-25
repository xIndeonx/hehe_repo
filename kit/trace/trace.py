"""Traces the printed face features and paws as filled vector shapes (exact replicas of the ink), normalised
to the rig's face frame: eye midpoint -> (14, -66), eye spacing -> 34 units, eye line made horizontal."""
import numpy as np, json, math
from PIL import Image
from scipy import ndimage
from skimage import measure
def load(n): return np.array(Image.open(f'/home/claude/site/kit/reference-sprites/{n}.png').convert('RGBA')).astype(int)
def ink(a): return (a[..., 3] > 128) & ((a[..., 0] + a[..., 1] + a[..., 2]) / 3 < 135)
def pink(a): return (a[..., 3] > 128) & (a[..., 0] > 200) & (a[..., 0] - a[..., 1] > 35) & (a[..., 2] > 120)
def frame(eyeL, eyeR):
    mx, my = (eyeL[0] + eyeR[0]) / 2, (eyeL[1] + eyeR[1]) / 2
    ang = math.atan2(eyeR[1] - eyeL[1], eyeR[0] - eyeL[0]); sp = math.hypot(eyeR[0] - eyeL[0], eyeR[1] - eyeL[1]); k = 34 / sp
    def T(px, py):
        x, y = px - mx, py - my; c, s = math.cos(-ang), math.sin(-ang)
        return (14 + (x * c - y * s) * k, -66 + (x * s + y * c) * k)
    return T, k
def trace(mask, box, T, tol=0.9, minlen=12):
    x0, y0, x1, y1 = box; sub = np.zeros_like(mask); sub[y0:y1, x0:x1] = mask[y0:y1, x0:x1]
    sub = ndimage.binary_closing(sub, iterations=1)
    cs = measure.find_contours(sub.astype(float), 0.5); d = ''
    for c in cs:
        if len(c) < minlen: continue
        c = measure.approximate_polygon(c, tolerance=tol)
        pts = [T(p[1], p[0]) for p in c]
        d += 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z '
    return d.strip()
out = {}
# blue-smile: ω mouth, dot eyes, paws
a = load('blue-smile'); T, k = frame((312.5, 201.5), (483.5, 175))
out['omega'] = trace(ink(a), (360, 170, 445, 226), T)
out['paws'] = trace(ink(a), (310, 282, 516, 386), T)
out['eyeR_smile'] = round(15.5 * k, 2)
# pair-holding, blue cat: open mouth (ring) + tongue
a = load('pair-holding'); T, k = frame((183, 121), (293, 106))
out['open'] = trace(ink(a), (210, 102, 273, 166), T, tol=0.7)
out['tongue'] = trace(pink(a), (210, 102, 273, 166), T, tol=0.7)
out['eyeR_pair'] = round(9 * k, 2)
# blue-joy: squint eyes, open mouth, blush
a = load('blue-joy'); T, k = frame((296, 182.5), (465, 185.5))
out['squint'] = trace(ink(a), (268, 156, 494, 212), T)
out['openJoy'] = trace(ink(a), (338, 183, 421, 271), T, tol=0.7)
out['tongueJoy'] = trace(pink(a), (338, 183, 421, 271), T, tol=0.7)
out['blush'] = trace(pink(a), (190, 190, 540, 240), T, tol=0.7)
# blue-rest: the little caret mouth, whisker ticks
a = load('blue-rest'); T, k = frame((341, 224), (532, 243.5))
out['caret'] = trace(ink(a), (410, 226, 470, 278), T)
out['whiskers'] = trace(ink(a), (255, 210, 295, 300), T) + ' ' + trace(ink(a), (580, 240, 625, 300), T)
# pink-reach: the bow
a = load('pink-reach'); T, k = frame((100.5, 154), (242.5, 188))
out['bow'] = trace(pink(a), (280, 88, 380, 158), T, tol=0.8)
# split the paws polygon at its centre so the two paws can move on their own (a straight cut, invisible when together)
import re
def poly(d):
    nums = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]; return [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
def clip_half(P, xc, keep_left):
    outp = []
    for i in range(len(P)):
        a_, b_ = P[i], P[(i + 1) % len(P)]
        ina = (a_[0] <= xc) if keep_left else (a_[0] >= xc); inb = (b_[0] <= xc) if keep_left else (b_[0] >= xc)
        if ina: outp.append(a_)
        if ina != inb:
            t_ = (xc - a_[0]) / (b_[0] - a_[0]); outp.append((xc, a_[1] + (b_[1] - a_[1]) * t_))
    return outp
P = poly(out['paws']); xc = (min(x for x, y in P) + max(x for x, y in P)) / 2
fmt = lambda Q: 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in Q) + ' Z'
out['pawL'] = fmt(clip_half(P, xc, True)); out['pawR'] = fmt(clip_half(P, xc, False)); out['pawSplit'] = round(xc, 2)
# mirror the bow about the face centre so it sits on the template's left ear (the pink cat is the mirrored template)
B = poly(out['bow']); out['bowL'] = fmt([(28 - x, y) for x, y in B])
json.dump(out, open('traced.json', 'w'), indent=0)
for kk, v in out.items(): print(kk, (len(v) if isinstance(v, str) else v))
