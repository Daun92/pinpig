# docviz — 제품 문서 시각화 생성기

`docs/product/` 의 HTML 문서 3종을 생성한다. HTML을 직접 고치지 말고 **`content.py`를 고친 뒤 재생성**한다.

```bash
python -X utf8 scripts/docviz/content.py
```

| 파일 | 역할 |
|------|------|
| `render.py` | 시각 체계 · 트리 레이아웃 · SVG/HTML 출력 (내용 없음) |
| `content.py` | 문서 3종의 내용 정의 (여기만 고치면 된다) |

## 산출물

- `docs/product/PinPig_PRD_구조도.html`
- `docs/product/PinPig_유저플로우.html`
- `docs/product/PinPig_IA_화면구조.html`

## 시각 체계

`참고/BRIS_대시보드_유저플로우.html` · `참고/dash_erp_구조도_영역정리.html` 에서 역설계했다.

| 요소 | 규격 |
|------|------|
| 캔버스 | `#f7f7f9` + 24px 점격자, 드래그 팬 · 휠 줌, HUD(화면 맞춤 · 100%) |
| 그리드 | 행 간격 44 · 노드 높이 32 · 컬럼 간격 64 · 상단 여백 48 |
| 레인 | 구분선 = 직전 레인 하단 +11, 다음 레인 상단 = 구분선 +27 |
| 레인명 | `x=18`, `#9a9aa8`, 11.5px, baseline = 레인 첫 행 중심 +4 |
| 커넥터 | `#c5c5d2` 1.5px 엘보, midx = (출발 오른쪽 + 도착 왼쪽)/2, 반경 `min(7, |dy|/2)` |
| 배치 | 트리 레이아웃 — 잎은 연속 슬롯, 부모는 자식 span의 중앙 |

### 노드 4종

| 타입 | 채움 / 테두리 | 글자 | 모서리 | 의미 |
|------|--------------|------|--------|------|
| `start` | `#ececf0` | `#2a2a30` | 7 | 진입점 |
| `hub` | `#7461e6` | `#ffffff` | 7 | 영역 · 화면 |
| `leaf` | `#efeafc` / `#ddd3fb` | `#2a2a30` | 7 | 구성 요소 |
| `action` | `#1e1e22` | `#ffffff` | 16 (pill) | 동작 · 규칙 |

## content.py 작성법

```python
Doc(제목, 부제, 메타,
    n('r', '앱 실행', 'start'),      # col0
    n('h', 'PinPig', 'hub'),         # col1 — 첫 레인 자식들의 중앙에 자동 정렬
    [
      {'title': '레인 이름', 'trees': [
          n('id', '라벨', 'hub',                    # col2
            n('id2', '라벨', 'leaf',                # col3
              n('id3', '라벨', 'action')))]},       # col4
    ])
```

- 노드 `id`는 문서 안에서 유일해야 한다
- 컬럼 폭은 그 컬럼의 최장 라벨이 결정한다 — 라벨이 길면 전체가 넓어진다
- 레인 옵션: `base_col`(시작 컬럼, 기본 2) · `from_hub`(col1 허브와 연결, 기본 True)
- 레인을 가로지르는 연결은 `Doc(..., extra_edges=[('a','b')])` — 다만 같은 출발점에서 여러 개를 걸면
  수직선이 겹치므로, 가능하면 하나의 트리로 묶는 편이 낫다
