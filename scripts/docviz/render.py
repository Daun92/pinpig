# -*- coding: utf-8 -*-
"""
참고/ 의 시각 체계를 그대로 따르는 문서 생성기.

역설계한 규칙
  캔버스   #f7f7f9 + 24px 점격자, 팬(드래그)·줌(휠), HUD(화면 맞춤·100%)
  그리드   행 간격 44, 노드 높이 32, 컬럼 간격 64, 상단 여백 48
  레인     구분선 = 직전 레인 하단 +11, 다음 레인 상단 = 구분선 +27 (총 38)
  레인명   x=18, fill #9a9aa8, 11.5px, baseline = 레인 첫 행 중심 +4
  노드     start #ececf0 / hub #7461e6 / leaf #efeafc+#ddd3fb / action #1e1e22(pill rx16)
  커넥터   #c5c5d2 1.5px, 엘보 midx=(src.right+dst.left)/2, 반경 min(7, |dy|/2)
  배치     트리 레이아웃 — 잎은 연속 슬롯, 부모는 자식 span의 중앙
"""
import io, os, math

ROW, NODE_H, COL_GAP, TOP = 44.0, 32.0, 64.0, 48.0
LANE_GAP_A, LANE_GAP_B = 11.0, 27.0
COL0_X = 130.0

C = {
    'start':  ('#ececf0', '#ececf0', '#2a2a30', 7.0),
    'hub':    ('#7461e6', '#7461e6', '#ffffff', 7.0),
    'leaf':   ('#efeafc', '#ddd3fb', '#2a2a30', 7.0),
    'action': ('#1e1e22', '#1e1e22', '#ffffff', 16.0),
}


def tw(s):
    w = 0.0
    for ch in s:
        if ord(ch) < 128:
            if ch == ' ':
                w += 4.0
            elif ch.isdigit():
                w += 7.2
            elif ch.isupper():
                w += 8.4
            elif ch.isalpha():
                w += 6.9
            else:
                w += 5.6
        else:
            w += 13.4
    return w


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


class Node:
    __slots__ = ('id', 'label', 'type', 'kids', 'col', 'y', 'w')

    def __init__(self, id, label, type, kids=None):
        self.id, self.label, self.type = id, label, type
        self.kids = kids or []
        self.col = self.y = 0.0
        self.w = round(max(64.0, tw(label) + 38.0), 1)


def n(id, label, type, *kids):
    return Node(id, label, type, list(kids))


class Doc:
    def __init__(self, title, subtitle, meta, root, hub, lanes, extra_edges=()):
        self.title, self.subtitle, self.meta = title, subtitle, meta
        self.root, self.hub, self.lanes = root, hub, lanes
        self.extra = list(extra_edges)

    # ---------- layout ----------
    def build(self):
        self.all = {}
        self.edges = []
        self.lane_marks = []          # (lane_title, first_row_center, bottom)
        cursor = TOP

        for li, lane in enumerate(self.lanes):
            base = lane.get('base_col', 2)
            slot = [cursor]           # mutable slot cursor (y of next free row top)
            tops = []
            for t in lane['trees']:
                self._place(t, base, slot)
                tops.append(t)
            first = min(self._span(t)[0] for t in tops)
            last = max(self._span(t)[1] for t in tops)
            self.lane_marks.append([lane['title'], first + NODE_H / 2, last + NODE_H])
            if lane.get('from_hub', True):
                for t in tops:
                    self.edges.append((self.hub.id, t.id))
            cursor = last + NODE_H + LANE_GAP_A + LANE_GAP_B
            if li < len(self.lanes) - 1:
                self.lane_marks[-1].append(last + NODE_H + LANE_GAP_A)
            else:
                self.lane_marks[-1].append(None)

        # col0 / col1 spine — 첫 레인 자식들의 중앙에 맞춘다
        l1 = self.lanes[0]['trees']
        c1 = (min(self._span(t)[0] for t in l1) + max(self._span(t)[1] for t in l1)) / 2
        self.hub.col, self.hub.y = 1, c1
        self.root.col, self.root.y = 0, c1
        self.all[self.hub.id] = self.hub
        self.all[self.root.id] = self.root
        self.edges.insert(0, (self.root.id, self.hub.id))
        self.edges.extend(self.extra)

        # column x
        widest = {}
        for nd in self.all.values():
            widest[nd.col] = max(widest.get(nd.col, 0.0), nd.w)
        self.colx = {0: COL0_X}
        for c in range(1, max(widest) + 1):
            self.colx[c] = self.colx[c - 1] + widest.get(c - 1, 0.0) + COL_GAP
        self.W = round(max(self.colx[nd.col] + nd.w for nd in self.all.values()) + 60)
        self.H = round(max(nd.y + NODE_H for nd in self.all.values()) + 48)

    def _place(self, node, col, slot):
        node.col = col
        self.all[node.id] = node
        if not node.kids:
            node.y = slot[0]
            slot[0] += ROW
            return
        for k in node.kids:
            self._place(k, col + 1, slot)
            self.edges.append((node.id, k.id))
        node.y = (node.kids[0].y + node.kids[-1].y) / 2

    def _span(self, node):
        lo, hi = node.y, node.y
        for k in node.kids:
            a, b = self._span(k)
            lo, hi = min(lo, a), max(hi, b)
        return lo, hi

    # ---------- render ----------
    def elbow(self, a, b):
        x1 = self.colx[a.col] + a.w
        y1 = a.y + NODE_H / 2
        x2 = self.colx[b.col]
        y2 = b.y + NODE_H / 2
        if abs(y1 - y2) < 0.01:
            return 'M %.1f %.1f L %.1f %.1f' % (x1, y1, x2, y2)
        mx = (x1 + x2) / 2
        r = min(7.0, abs(y2 - y1) / 2)
        s = 1 if y2 > y1 else -1
        return ('M %.1f %.1f L %.1f %.1f Q %.1f %.1f %.1f %.1f '
                'L %.1f %.1f Q %.1f %.1f %.1f %.1f L %.1f %.1f') % (
            x1, y1, mx - r, y1, mx, y1, mx, y1 + s * r,
            mx, y2 - s * r, mx, y2, mx + r, y2, x2, y2)

    def svg(self):
        o = []
        o.append('<svg id="cv" xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
                 'viewBox="0 0 %d %d" font-family="\'Pretendard\',\'Apple SD Gothic Neo\','
                 '\'Noto Sans KR\',\'Malgun Gothic\',sans-serif" font-size="13">'
                 % (self.W, self.H, self.W, self.H))
        o.append('<defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" '
                 'markerHeight="6.5" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#c5c5d2"/>'
                 '</marker></defs>')
        for title, first_c, _bottom, sep in self.lane_marks:
            o.append('<text x="18" y="%.1f" fill="#9a9aa8" font-size="11.5">%s</text>'
                     % (first_c + 4, esc(title)))
            if sep is not None:
                o.append('<line x1="14" y1="%.1f" x2="%d" y2="%.1f" stroke="#e6e6ee" '
                         'stroke-width="1"/>' % (sep, self.W - 14, sep))
        for a, b in self.edges:
            o.append('<path d="%s" fill="none" stroke="#c5c5d2" stroke-width="1.5" '
                     'marker-end="url(#arr)"/>' % self.elbow(self.all[a], self.all[b]))
        for nd in sorted(self.all.values(), key=lambda z: (z.col, z.y)):
            fill, stroke, tc, rx = C[nd.type]
            x = self.colx[nd.col]
            o.append('<g><rect x="%.1f" y="%.1f" width="%.1f" height="32" rx="%s" fill="%s" '
                     'stroke="%s" stroke-width="1"/><text x="%.1f" y="%.1f" text-anchor="middle" '
                     'fill="%s">%s</text></g>'
                     % (x, nd.y, nd.w, rx, fill, stroke, x + nd.w / 2, nd.y + 20.5, tc,
                        esc(nd.label)))
        o.append('</svg>')
        return '\n'.join(o)

    def html(self):
        self.build()
        return HTML % dict(title=esc(self.title), sub=esc(self.subtitle),
                           meta=esc(self.meta), svg=self.svg())


HTML = '''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<style>
  html,body{margin:0;height:100%%;overflow:hidden;background:#f7f7f9;}
  #vp{position:relative;width:100%%;height:100vh;cursor:grab;
      background-image:radial-gradient(circle,#dcdce4 1.1px,transparent 1.1px);
      background-size:24px 24px;}
  #vp.drag{cursor:grabbing;}
  #cv{position:absolute;left:0;top:0;transform-origin:0 0;user-select:none;}
  .ui{font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;}
  #hd{position:fixed;left:14px;top:14px;background:rgba(255,255,255,.92);
      border:1px solid #e6e6ee;border-radius:10px;padding:10px 14px;backdrop-filter:blur(6px);}
  #hd h1{margin:0;font-size:14.5px;color:#2a2a30;font-weight:600;letter-spacing:-.01em;}
  #hd p{margin:3px 0 0;font-size:11.5px;color:#77778a;}
  #hd .m{margin-top:6px;font-size:10.5px;color:#9a9aa8;}
  #lg{position:fixed;left:14px;bottom:14px;background:rgba(255,255,255,.92);
      border:1px solid #e6e6ee;border-radius:10px;padding:9px 12px;backdrop-filter:blur(6px);
      display:flex;gap:14px;align-items:center;font-size:11px;color:#55555f;}
  #lg span{display:flex;gap:6px;align-items:center;}
  #lg i{width:16px;height:11px;display:inline-block;}
  #hud{position:fixed;right:14px;bottom:14px;display:flex;gap:6px;}
  #hud button{border:1px solid #d9d9e3;background:#ffffff;border-radius:8px;
      padding:6px 12px;font-size:12.5px;color:#44444c;cursor:pointer;}
  #hud button:hover{background:#f1f1f5;}
</style>
</head>
<body>
<div id="vp">%(svg)s</div>
<div id="hd" class="ui"><h1>%(title)s</h1><p>%(sub)s</p><div class="m">%(meta)s</div></div>
<div id="lg" class="ui">
  <span><i style="background:#7461e6;border-radius:3px"></i>영역·화면</span>
  <span><i style="background:#efeafc;border:1px solid #ddd3fb;border-radius:3px"></i>구성 요소</span>
  <span><i style="background:#1e1e22;border-radius:6px"></i>동작·규칙</span>
</div>
<div id="hud" class="ui"><button id="fit">화면 맞춤</button><button id="z1">100%%</button></div>
<script>
(function(){
  var vp=document.getElementById('vp'),cv=document.getElementById('cv');
  var W=+cv.getAttribute('width'),H=+cv.getAttribute('height');
  var s=1,tx=0,ty=0,drag=null;
  function apply(){cv.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';}
  function fit(){
    var r=vp.getBoundingClientRect();
    s=Math.min(1,(r.width-40)/W,(r.height-40)/H);
    tx=(r.width-W*s)/2; ty=(r.height-H*s)/2; apply();
  }
  vp.addEventListener('wheel',function(e){
    e.preventDefault();
    var r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
    var ns=Math.min(4,Math.max(0.15,s*(e.deltaY<0?1.12:0.89)));
    tx=mx-(mx-tx)*(ns/s); ty=my-(my-ty)*(ns/s); s=ns; apply();
  },{passive:false});
  vp.addEventListener('pointerdown',function(e){
    drag={x:e.clientX-tx,y:e.clientY-ty};
    vp.classList.add('drag'); vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove',function(e){
    if(drag){tx=e.clientX-drag.x;ty=e.clientY-drag.y;apply();}
  });
  vp.addEventListener('pointerup',function(){drag=null;vp.classList.remove('drag');});
  document.getElementById('fit').onclick=fit;
  document.getElementById('z1').onclick=function(){s=1;tx=20;ty=20;apply();};
  fit();
})();
</script>
</body>
</html>
'''

OUT = r'D:\claude\pinpig\docs\product'


def write(name, doc):
    p = os.path.join(OUT, name)
    io.open(p, 'w', encoding='utf-8').write(doc.html())
    print('%-34s %5d x %5d  nodes=%3d edges=%3d' % (name, doc.W, doc.H, len(doc.all), len(doc.edges)))
