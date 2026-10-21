# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 역할과 작업 원칙

- **사용자에게 하는 모든 답변은 한국어로 한다.**

- 너는 **웹 게임 개발자**다. 외부 툴(게임 엔진, 에셋 생성기, 빌드 도구, 외부 디자인 툴) 없이 **Claude Code만으로** 게임을 만든다.
- 디자인 작업은 **impeccable 스킬**(`impeccable:impeccable`)을 기본으로 사용한다. 디자인 맥락은 `PRODUCT.md`, impeccable 설정은 `.impeccable/config.json`.
- **이 파일(CLAUDE.md)은 중요한 결정·구조 변경·새 규칙이 생기면 사용자 요청 없이 즉시 업데이트한다.**

## 실행 / 빌드

- 빌드, 린트, 테스트 없음. 순수 정적 HTML/CSS/JS 파일이며 더블클릭으로 브라우저에서 연다.
- **`start.bat`** 더블클릭 = 로컬 서버(`py -m http.server 8123 --bind 127.0.0.1`) + 브라우저로 `http://localhost:8123/arcade.html` 열기. `file://`로 열면 Chrome이 파일마다 다른 출처로 취급해서 확장 프로그램·미리보기 도구 등이 "Unsafe attempt to load URL file:///… 'file:' URLs are treated as unique security origins" 경고를 띄울 수 있다(게임 코드 문제 아님). 서버로 열면 사라진다.
- `index.html`은 ES module + importmap으로 Three.js(`three@0.160.0`, jsDelivr CDN)를 불러온다. 일부 브라우저에서 `file://` 모듈 로딩이 막히면 로컬 서버로 연다: `python -m http.server 8000`.
- 외부 의존성은 CDN(Three.js, Google Fonts)만 허용. 그 외 에셋은 코드(CSS/Canvas/SVG/절차적 텍스처)로 직접 만든다.

## 구조

- `index.html` — "민준이의 섬". 단일 파일(HTML+CSS+JS). Three.js 3D 섬 캔버스(`#scene`), 유성우 하늘(`#sky`), 나무 표지판 태그 → 이야기 패널(`#panel`), 아래로 파 내려가는 땅속 층(`#dig`: 흙/돌/깊은 돌/물/다이아). 블록 텍스처는 `--tex-*` CSS 변수로 주입된다. `arcade.html`로 가는 "게임하러 가기" 버튼 포함.
- `arcade.html` — "민준이의 오락실" **게임 선택 로비**(밤하늘 배경, 게임 카드). 새 게임을 만들면 여기에 카드를 추가한다.
- `games/*.html` — 게임 1개 = 독립 단일 파일. 뒤로가기는 `../arcade.html`. 브랜드 토큰을 각 파일 `:root`에 복사해 쓴다.
  - `games/stack.html` — 🧱 블록 쌓기(첫 게임). Canvas 2D, 가로 360 논리 좌표 고정·세로는 화면 비율, 절차적 16px 픽셀 텍스처(잔디→판자→돌→벽돌→금→다이아, 6층마다 변경), 높이 오를수록 낮→밤하늘. 퍼펙트(±5px) 3연속이면 블록 폭 회복.
  - `games/penalty.html` — ⚽ 승부차기(원래 arcade.html에 있던 게임을 이동).
  - `games/rps.html` — 가위바위보: **고양이(나) vs 토끼(상대)**. 사용자가 준 PNG 에셋(`games/assets/rps/`)으로 만든 화면이며 이모지를 그림 대신 쓰지 않는다.
    - 화면: `.stage`(최대 480px, `container-type: inline-size`, 크기는 전부 `cqw`) = `.arena`(배경 그림 무대, `container-type: size`, 높이 `clamp(112cqw, 100svh-58cqw, 134.2cqw)`) + `.panel`(나무 조작판: 손 버튼 3개, 스피드 모드). PC에서는 무대 바깥에 같은 배경을 흐리게 깐다.
    - 캐릭터: `.fighter[data-pose=idle|attack|win|lose]`로 그림 교체. 반응 포즈 그림은 상반신이라 포즈별 높이(`--h`)를 따로 맞췄고, 배경 아래 돌계단만 잘라 낸 `.rim` 레이어를 캐릭터 앞에 깔아 잘린 아랫부분을 가린다.
    - 점수판 그림(`board-player/rival.png`)에는 숫자 3·1이 그려져 있어서, 숫자 자리를 같은 색 판(`.num`, 위치는 그림 기준 %)으로 덮고 실제 점수를 쓴다.
    - 한 판 흐름 `play()` → 토끼 손 카드가 85ms×7 바뀜 → `finish()`: 가운데 VS 배너가 WIN!/LOSE/DRAW! 배너로 바뀜, 포즈·효과 그림(`fx-*`)·고양이 말풍선 그림(`bubble-*`)·토끼 대사(`talk()`, CSS 말풍선) 갱신. 판정은 `HANDS[x].beats` 표.
    - 규칙: **3점 선승제**(`GOAL = 3`). 연승(이기면 +1, 지면 0, 비기면 유지)은 다시 하기 후에도 이어지고 `HOT = 3`연승부터 "불붙었다!". 최고 연승은 `mj-rps-best`, 소리 켜짐/꺼짐은 `mj-rps-sound`. 키보드 1·2·3 = 가위·바위·보.
    - 최종 결과 창 `#final`: WIN/LOSE 배너 그림 + 직접 그린 SVG 트로피 + 고양이·토끼 포즈 → "다시 하기"(`newMatch()`)로 0:0.
    - 효과음: 파일 없이 WebAudio로 합성(`sfx`). 사용자가 한 번 누르기 전에는 오디오를 만들지 않는다(자동재생 정책).
    - 색종이: 전체 화면 캔버스 `#fx`의 `spray()` 하나로 처리(`popConfetti`, `celebrate`, `tears`), 별/땀방울은 에셋 그림을 sprite로 사용.
    - 성능 규칙(버벅임 수정 후): 캔버스에 이모지·글자를 `fillText`로 매 프레임 그리지 말 것(그림을 `drawImage`). 파티클마다 `save/restore` 대신 `setTransform` 한 번, `MAX_PARTS = 360` 상한, 효과 캔버스 해상도는 최대 1.5배, 움직임은 프레임 간격(dt) 기준. 움직이는 요소에 `filter: drop-shadow` 금지. 결과 창이 열리면 `body.final-open`으로 뒤쪽 반복 애니메이션을 멈춘다.
    - 스피드 모드(`#speedBtn`): 판마다 3초(`LIMIT`) 카운트다운, 시간 안에 안 내면 `timeUp()` → 자동 패배. 결과 후 1.5초 뒤 다음 카운트다운(`afterRound()`).
    - **보스 팝업**(`#boss`, 갱스터 황소 보스): 질 때마다(시간 초과 포함) `bossAfterLoss()` → 0.75초 뒤 `showBoss()`. 그동안 손 버튼은 잠긴다. 4초(`BOSS_MS`) 뒤 저절로 닫히고, 누르면 닫히지만 등장 직후 0.7초는 무시한다(연타 방지). 닫히면 콜백으로 `afterRound(true)`가 실행되어 다음 카운트다운이나 최종 결과 창으로 넘어간다. 제목·대사는 상황별로 바뀐다(`BOSS_LINES`: normal/slow/point=한 번 더 지면 끝/final). 그림은 루트의 원본 PNG(2.3MB, 투명 배경)를 잘라 `games/assets/rps/boss.webp`(589×1100, 약 150KB)로 만들었다.
  - `games/mole.html` — 두더지 잡기(로비 카드 배지는 아직 '만드는 중'). 사용자가 고른 **둥근 만화 잔디밭** 스타일: 밝은 낮 하늘·구름·언덕(SVG), 모든 그림 테두리는 `--line`(= `--wood-ink`) 한 색. 이모지 없이 SVG로만 그린다(사용자가 🐹·💥처럼 이모지로 말해도 SVG로 그린다).
    - 화면: 맨 위 뒤로가기+제목, 그 아래 HUD 한 줄 = 나무 표지판 2개(점수, 남은 시간+줄어드는 막대) + 시작 버튼. 나무 표지판·나무 버튼은 `--grain`(잉크색 나무결+판자 이음새 SVG), 결과 창은 이음새 없는 `--grain-plain`. 480px 이하에서는 시작 버튼이 아이콘 위·글자 아래로 세워진다. 구름은 맨 위 줄(뒤로가기·제목) 높이로만 지나간다(점수판 틈·언덕에 잘려 보이지 않게). 게임이 끝나면 HUD 버튼도 나무색이고, 결과 창의 파란 "다시 하기"만 주 버튼이다.
    - 잔디판(`.field` = `.side` 흙 옆면 + `.turf` 윗면): 너비 `min(100%, 540px, 100svh-250px)`, `aspect-ratio: 1 / var(--tall)`(가로 화면 1.06, 세로 화면 1.5), `max-height: 100svh-196px`. 칸은 `1fr` 3×3, `button.hole`은 칸 전체(누르는 자리), 구멍 그림 `.art`(정사각형)는 칸 아래쪽. **`.yard`에 `container-type: size`를 걸고 `cqh`를 쓰면 크롬에서 0이 되어 잔디판이 사라진다** — 화면 높이 단위로 계산한다.
    - 구멍: `#holeTpl`(SVG viewBox 120×120)을 9번 복제. 키보드 1~9(숫자 패드는 패드 모양대로). PC 커서는 파란 장난감 망치(SVG data URI). 포커스 링은 잉크색 3px.
    - 두더지: 구멍 그림 안의 SVG(`.mole` > `.mole-body`, `.paws`). `#pit-clip`(구멍 가운데 줄 위 + 구멍 안쪽 타원) 밖은 안 보여서, `.hole.up`이 붙으면 `translateY(80px)`→0으로 튀어 오르며(오버슈트 + `boing`) 구멍에서 '쏙' 나오고 앞발이 구멍 테두리에 걸린다. 올라올 때 흙(`kickDirt`)이 튄다.
    - 흐름: 상태는 `body[data-state=ready|play|over]`, HUD 버튼은 게임 시작 → 그만하기(나무색) → 다시 하기. `GAME_SECONDS = 30`(1초씩 줄어드는 숫자 + 막대), 마지막 `LOW_SECONDS = 5`초는 빨간 숫자. 시작 1초(`FIRST_MS`) 뒤부터 `popMole()`: 한 번에 한 마리, 직전과 다른 랜덤 구멍, `SHOW_MS = 1000` 뒤 저절로 들어가고 `GAP_MS` 350~700ms 쉬고 다음.
    - 잡기: `whack(i)`는 `state === 'play'`이고 `i === upHole`일 때만 +1. 잡는 즉시 `upHole = -1`이라 연타·빈 구멍·시간 끝 뒤 클릭은 **아무 일도 없다**(빈 구멍 반응은 사용자 요청으로 없앰). 잡힌 두더지는 `.hit`(transition 없음)으로 바로 사라지고, SVG 별 `#pow` + "+1"이 뜨고, 다음 두더지는 `GAP_MS` 뒤.
    - 끝: 시간이 0이면 `finish()` → `clearMoles()`, 결과 창 `#result`("게임 오버!", 최종 점수, "다시 하기" → `start()`로 0점·30초부터). "시작!" 배너는 타이머로 숨긴다(헤드리스에서는 WAAPI `onfinish`가 안 불린다).
    - 아직 없음: 최고 기록(`mj-mole-best`)과 로비 표시, 효과음.
    - 테스트 주의: `Math.random`을 **상수 하나로 고정하면** `popMole()`의 '같은 구멍 연속 금지' 루프가 끝나지 않아 크롬이 멈춘다. 바뀌는 값 배열을 돌려 쓴다. 헤드리스는 transition·WAAPI가 제대로 진행되지 않으므로, 상태가 바뀌는 색은 transition 없이 바로 바꾼다.
  - `games/brick.html` — 벽돌깨기(로비 카드 배지 '만드는 중'). 사용자가 고른 **오락기 한 대** 스타일: 밤하늘 오락실 방(별 + 바닥) 가운데 파란 오락기 몸체 = 불 켜진 간판(`.marquee`, 픽셀 글씨 BRICK + Jua '벽돌깨기') → 화면(`.rim` > `.bezel` > `.glass`: 검은 브라운관, 주사선·가장자리 어둡게·반사광·천천히 내려가는 빛줄기 `.roll`) → 조작판(`.deck`: 빨간 조이스틱, 주황·빨강 버튼, 벽돌 스티커 줄) → 동전 넣는 곳(`.door`, '100원' 2개). 이모지 없이 CSS/SVG/캔버스로만 그린다.
    - 크기: `--s` = 화면 너비(가로·세로 남은 공간 중 작은 쪽, 최대 480px), `--u = --s / 224` = 게임 화면 1픽셀. 화면을 뺀 세로 높이 합은 `--chrome`(휴대폰 312px, 720px 이상 268px — 뒤로가기가 화면 위에 떠서 줄어듦)이라, 간판·조작판 높이를 바꾸면 이 값도 같이 고친다. 동전 넣는 곳은 아래 공간이 모자라면 JS(`fit()`)가 `.base.short`로 숨긴다(**`container-type: size` + `@container`는 flex 안에서 크롬이 잘못 계산해서 안 씀**).
    - 게임 화면: HUD(`SCORE` + 5자리 점수, '목숨' + 픽셀 하트 SVG `#i-heart` × `state.lives`)는 DOM, 경기장은 캔버스 `#field` 논리 좌표 **224×272**. 캔버스는 `n = ceil(화면너비×dpr/224)`배 정수로 크게 그린 뒤 줄여서 픽셀 크기가 고르게 보인다(`fit()`, 창 크기 바뀌면 다시 그림). 벽 두께 `WALL = 8`(쇠 파이프), 벽돌 8×4 = 26×12 칸(1픽셀 틈, 줄마다 빨강·주황·초록·파랑 `ROW_COLORS`, `BRICK_TOP = 30`), 패들 40×8(`PADDLE_Y = 244`, 은색 몸통+빨간 끝), 공 6×6은 패들 위 가운데. 상태는 `state`(score, lives, paddle, ball, bricks[alive]) 하나에 모아 두고 `draw()`가 다시 그린다. 배경 별은 고정 시드라 매번 같다.
    - 조작(2026-10-16, 사용자 요청대로 한 단계씩): ←/→ 누르고 있는 동안 패들이 `PADDLE_SPEED = 170`(초당 논리 픽셀)으로 미끄러지고 떼면 바로 멈춘다(`WALL`~`W - WALL - w` 안에서만). 스페이스 = 발사(`launch()`): 45° 대각선 위로 `BALL_SPEED = 160`, 방향은 누르던 화살표 쪽(없으면 오른쪽). 발사 전 공은 패들 위에 붙어 다닌다(`ball.stuck`).
    - 튕김(`moveBall`, 3픽셀 이하로 나눠 이동): 위·왼쪽·오른쪽 벽은 거울 반사. 패들(`hitPaddle`)은 맞은 자리로 각도가 정해진다 — 가운데 거의 위로(최소 `MIN_BOUNCE` 12°), 끝으로 갈수록 `MAX_BOUNCE` 60°까지. 벽돌(`hitBrick`)은 겹친 폭이 좁은 쪽(옆면=좌우, 위·아랫면=위아래)으로 밀어내고 그 방향만 뒤집으며, 한 번에 하나만 깬다. 깨지면 `BRICK_POINTS = 10`점 + 벽돌 색 픽셀 조각(`burst`).
    - 목숨: 바닥 아래로 떨어지면 `loseLife()` → 목숨 −1(HUD는 3칸 고정, 잃은 칸은 꽉 찬 하트가 깜빡이다 빈 하트 `#i-heart-empty`로), `RESPAWN_MS = 800` 뒤 패들 위에 새 공 → 스페이스로 다시 발사. 0이 되면 `state.mode = 'over'` → `MSG_DELAY = 700` 뒤 화면 안 안내판 `#overMsg`("게임 오버", 최종 점수, 파란 "다시 하기").
    - 클리어: 벽돌을 전부 깨면 `clearStage()` → `mode = 'clear'`, 색종이(`confetti`, 캔버스 픽셀) → `#clearMsg`("클리어!" + 양옆 픽셀 폭죽 SVG `#i-popper` — 사용자가 쓴 🎉 대신 직접 그림, 걸린 시간 = 첫 발사부터 `N초`/`N분 NN초`, "다시 하기").
    - 안내판: 브라운관 유리 안(주사선 아래)에 뜨고 "다시 하기"에 포커스. 스페이스·Enter·클릭 = `newGame()`(점수 0, 목숨 3, 벽돌 32개, 패들 가운데). 뜬 뒤 `MSG_GUARD = 600`ms는 무시해서 연타로 바로 넘어가지 않는다. "다시 하기"는 DESIGN.md의 파란 주 버튼 규칙대로 파랑.
    - 루프: `state.mode`(play/over/clear). `tick()`은 움직일 것(누른 화살표·날아가는 공·남은 조각 `parts`, 최대 `MAX_PARTS = 240`)이 있을 때만 rAF로 돌고(`busy()`/`wake()`), dt는 0~0.05초로 자른다. 그릴 때 x·y는 `snap()`으로 실제 화면 픽셀에 맞춘다. 창이 포커스를 잃으면 누른 키를 모두 놓은 것으로 친다. 조이스틱은 화살표, 주황 버튼(`fireBtn`)은 스페이스를 따라 움직인다. 터치 조작은 아직 없다.
    - 테스트: 헤드리스 사본에서 rAF를 `setTimeout(16)`으로 바꾸고 `state.ball`을 원하는 자리·속도로 옮겨 패들/벽돌/바닥 상황을 만든다(`state`, `parts`, `renderScore()` 등은 전역이라 덧붙인 `<script>`에서 바로 접근). 안내판은 700ms 뒤에 떠서 `--virtual-time-budget`이 모자라면 안 찍힐 수 있다.
    - 다음 단계 후보: 최고 점수/최단 시간(`mj-brick-best`)과 로비 표시, 터치 조작(조작판의 조이스틱·버튼 활용), 효과음, 단계별 속도.
  - `games/runner.html` — 공룡 달리기(**3D**, 3단계 → 오아시스 도착으로 끝나는 러너, 로비 카드 배지 '만드는 중', 최고 점수 `mj-runner-best` 로비 표시). 노을 지는 사막. 사용자 요청 이력(2026-10-20): 아래→위 진행 → 장애물·빌런·아이템·에너지 → 단계+오아시스 → **3D로 전체 변경 + 마우스로 360도 이동 + SVG 캐릭터**(사용자 선택: 달리기는 유지하고 자유 이동 / 포인터 따라가기 / SVG 그림 캐릭터).
    - 구성: Three.js **`three@0.149.0/build/three.min.js`(전역 `THREE`, 일반 스크립트)** — index.html은 ES 모듈 0.160.0이지만, 이 게임은 테스트에서 게임 전역(`things`, `dino`, `add()` 등)에 바로 접근해야 해서 모듈 대신 전역판을 쓴다(r149는 색 관리가 옛 방식이라 hex 색이 그대로 보임). 캔버스 2개: `#game`(WebGL 3D) 위에 `#fx`(2D 효과: 조각·글씨·고리·번개·속도선·말풍선·`!`·별, 논리 가로 `W = 360`). 3D 위치 → 효과 좌표는 `toScreen(x, y, d)`. HUD(뒤로가기·에너지·점수·단계 막대·아이템·소리 버튼·창)는 HTML 그대로.
    - 세계 좌표(미터): `x` 좌우, `y` 높이, `d` = 기준선에서 앞쪽 거리(Three의 z = −d). 공룡은 자동으로 앞으로 달리고(세상이 다가옴) 그 안에서 `x ∈ ±FIELD 6.6`, `d ∈ [D_MIN 0.5, D_MAX 9]` 범위를 360도 자유롭게 움직인다(목표점 `target`으로 `MOVE_SPEED 11`m/s까지 미끄러짐). 카메라는 `CAM_BACK 6.5`·`CAM_Y 3.4`에서 공룡 x를 0.45만큼 따라가고, 빠를수록·로켓이면 시야(fov)가 넓어지며, 도착하면 공룡 쪽으로 다가간다(`placeCamera`).
    - 조작: **마우스가 가리키는 땅 위 지점으로 달려감**(`aimAt` = 레이캐스트로 땅 평면과 만나는 점, 하얀 고리 `marker`로 표시), 클릭 = 점프. 손가락: 끌면 그쪽으로(손가락보다 `FINGER_LIFT 60`px 위를 가리켜 공룡이 손에 안 가림), 톡 = 점프. 키보드: 방향키/WASD = 그쪽으로, 스페이스 = 점프, E = 아이템.
    - 3D 모형(만화 테두리 `toon()` = 모양을 법선 방향으로 부풀린 사본을 뒷면만 잉크색으로): 선인장 `cactusModels`(0.75/1.0/1.2m, 원통+반구+팔), 돌기둥 `pillarModel`(3.4m, 못 넘음), 나무 울타리 `fenceModel`(4.3m 폭, 0.62m), 길가 말뚝 `posts`(빨간 띠, `POST_GAP 8`m), 돌멩이 `decor`, 둥근 그림자 `blob()`. 땅 `ground`·길 `pathMesh`는 모래 무늬 캔버스 텍스처를 달린 만큼 `offset`으로 밀어 움직임(`TILE 10`m). 하늘은 `paintSky()`가 캔버스에 그린 노을·별·해·메사를 `scene.background`로(지평선 높이는 카메라에서 계산, 아래는 안개 색), 안개 `Fog(dusk-glow, 30, 150)`로 땅 끝이 지평선 빛에 녹는다. 빛: 반구광 0.55 + 방향광 0.5(더 세면 모래가 하얗게 뜸).
    - SVG 캐릭터(256px 캔버스 텍스처 `svgTexture()` → `THREE.Sprite`, 발이 바닥에 오게 `center(0.5, 0.02)`): 공룡 `dinoBack(a/b/tuck)` 뒷모습 달리기·점프, `dinoQuarter` 비스듬한 모습(오른쪽은 좌우 뒤집기), `dinoFront(up/down, happy/dizzy)` 정면. 땅 기준 달리는 방향(`atan2(vx, 달리기 속도)`)이 ±0.32rad를 넘으면 비스듬한 그림, 옆으로 갈 때 살짝 기울임. 빌런 `scorpionSvg`(집게 딸깍), `vultureSvg`(날갯짓), 아이템 `ITEM_SVG`(방패·번개·로켓·치킨, 둥실 돌기). 모든 SVG는 잉크 테두리 + 방사 그라데이션 + 하이라이트. 🦖·🌵 이모지는 쓰지 않는다. 로비 카드 그림의 공룡도 `dinoBack('a')`에서 뽑음.
    - **젤리 움직임**(사용자 요청 2026-10-21 '쿠키런처럼 통통', 고른 범위는 캐릭터 움직임만 — HUD·글자는 그대로): 찌그러짐 `jelly.s`(+ 납작 / − 길쭉)를 용수철(`JELLY_K 260`, `JELLY_C 11`, 범위 −0.28~0.34)로 출렁이게 하고 `stepJelly(dt)`, 공룡 그림 크기를 가로 `1 + s×0.8`, 세로 `1 − s`로(발은 바닥에 붙은 채). 공중에선 빠를수록 길쭉한 쉼 자리. 충격 `squish(v)`: 점프 −5, 착지 +8(로켓에서 떨어지면 +12), 걸음마다 +2.4(+ 보이는 높이 `STEP_HOP 0.13`m 통통), 도착해서 폴짝 −7, 돌아서는 순간 +10, 부딪힘 +12, 게임 오버 +16(멈춘 세상에서도 `fxTick`이 출렁임 계산), 아이템 먹기 +4, 쓰기 −6. 다른 것들: 선인장은 말랑말랑 흔들(크기 ±4%), 전갈은 통통 뛰며 닿을 때 납작, 독수리는 날갯짓에 맞춰 위아래·늘었다 줄었다, 아이템은 돌며 숨 쉬듯. 돌기둥·울타리는 딱딱해서 그대로. `prefers-reduced-motion`이면 세기를 0.3~0.4배로.
    - **진동**(사용자 요청 2026-10-21, 휴대폰 바이브레이터): `navigator.vibrate`(안드로이드 크롬 등만, 아이폰 사파리는 지원 안 함, 첫 누름 뒤부터). `HAPTIC[이름] = [무늬(ms), 우선순위]`, `vibe.play(이름)` — 센 진동이 울리는 동안(`busyUntil`) 더 약한 우선순위는 건너뜀. 세기는 못 정해서 '강한' = 길게. 손가락으로 버튼·화면 누름 = `tap` 12ms(`stageBox` pointerdown, 마우스는 없음), 부딪혀 에너지 감소 = `hurt` 220ms×3(빨간 구간으로 떨어지면 `hurtLow`로 경고 덧붙임), 게임 오버 `over`(350·350·600), 그 외 pickup/heal/smash/alarm/milestone(짧게), shield/bolt/rocket/clear/oasis(무늬 있게), 로켓에서 쿵 착지 `land`. 소리 버튼 오른쪽 진동 버튼 `#vibeBtn`(아이콘 `#i-vibe`/`#i-vibe-off`, 진동 되는 터치 기기에서만 보임, `mj-runner-vibe`에 저장, 끄면 `vibrate(0)`). 테스트는 `navigator.vibrate`를 기록하는 가짜로 바꾸고 `navigator.userActivation`을 `{hasBeenActive: true}`로 덮어쓴다.
    - `things`: `{kind, x, d, pd(지난 프레임 d), y0, hitH, halfW, depth, obj, dmg, villain, alarm}`. `SPAWN_D 90`m(안개 속)에서 나와 `d < −CAM_BACK−3`이면 지움. 부딪힘 `touches()`는 **지난 프레임~이번 프레임 사이에 공룡 앞뒤를 지나쳤는지**로 봐서 빨라도 뚫고 지나가지 않는다 + 옆(`halfW + DINO_HALF 0.42`)·높이(`DINO_TALL 1.3`) 겹침. 묶음 `spawnWave()`(1.1~2.2초): 단계 `kinds`에서 고르고 `freeX()`로 서로 안 겹치게 가로 자리, 아이템은 빈 자리에. 빌런: 전갈은 `d < 16`에서 한 번 내 x로 옮겨 옴, 독수리는 `d > 12` 동안 내 x를 따라옴(`y0 0.85`, 못 넘으니 피해야 함).
    - 점프 `JUMP_SPEED 7.6`, `GRAVITY 22`(최고 약 1.3m, 체공 0.7초). 속도 `RUN_SPEED 10`m/s × 단계 배수. 점수 1m = 1점(`M_PER_POINT`, 로켓 중 2배) + 부순 점수.
    - 단계 `STAGES`: `len` 470/680/890m(약 40/44/45초), 속도 배수 1.0→1.35 / 1.35→1.75 / 1.75→2.2, `kinds`, 하늘(`sun`·`sky`·`stars`). `startStage`/`newGame`/"이 단계 다시"(`stageStart` 복원)/`reachGoal`/`showGoalCard`/`goNext`/`loop()` 흐름과 `#clear`·`#ending`·`#over` 창은 2D 때와 같다.
    - 오아시스: `makeOasis(big)`를 두 개 미리 만들어 두고(단계 1·2용 R 6, 마지막 R 8 + 꽃·야자수 더), 연못 가운데 깊이 `goalD() = 남은 거리 + D_HOME + POND_GAP + R`에 놓는다(`GOAL_VIEW 160`m부터 보임). 연못·모래 테두리·풀밭 원판, 풀 포기, 야자수 `makePalm`(휜 줄기 + 늘어진 잎 7장 + 코코넛). 오아시스 너머엔 말뚝·돌을 안 그림. 도착하면 공룡이 오아시스 앞 가운데(0, `D_HOME`)로 가서 멈추고, 돌아서서 정면(`cheerUp`/`cheerDown`)으로 폴짝폴짝 + 말풍선("야호!"/"오아시스다!") + 카메라가 다가간다. 게임 오버 땐 정면 어지러운 얼굴(`dizzy`) + 머리 위 별.
    - 에너지·치킨·아이템(방패 = 파란 반투명 구 `bubbleMesh` + 반짝이, 로켓 = 등의 로켓 그림 `rocketPack` + 불꽃·연기, 번개 = 어두워짐 + 목표마다 번개)·효과음·배경 음악(3/4 왈츠 칩튠)·화면 효과(흔들림은 카메라를 흔듦)는 2D 때 규칙 그대로(아래 값 동일): 피해 선인장 15/20/25·울타리 20·전갈 25·독수리 30·돌기둥 35, `HURT_SEC 1`, `CHICKEN_HEAL 30`, `MAX_ITEMS 3`, `SHIELD_SEC 5`, `ROCKET_SEC 3`(`ROCKET_Y 3`m), `KILL_POINTS 10`, `SFX_VOLUME 3.5`, `MUSIC_VOLUME 0.6`, `OVER_DELAY 650`, `OVER_GUARD 1000`.
    - 테스트: WebGL은 헤드리스에서 `--enable-unsafe-swiftshader --use-angle=swiftshader`를 붙이면 된다. 게임 스크립트 앞에 작은 `<script>`를 끼워 `requestAnimationFrame`을 `setTimeout(16)`으로 바꾸고, 장면을 세울 땐 그 대체 함수를 멈추고(`__stop`) `render()`(도착·정면 장면은 `state`를 그대로 둬야 그려짐). 덧붙이는 테스트 스크립트의 최상위 이름이 게임 전역(`last`, `stage` 등)과 겹치면 SyntaxError로 통째로 안 돈다. 음악 예약 수는 `BaseAudioContext.prototype.currentTime`을 `performance.now()/1000`으로 바꿔서 센다. 단계 흐름은 `STAGES.forEach(st => st.len = 120)`처럼 짧게.
    - 다음 단계 후보: 시작 화면, 동전, 빌런 보스, 휴대폰 성능 확인(실기기), 3D 그림자 품질.
- `games/assets/rps/` — 가위바위보 에셋 29장(영문 파일명 사본). 원본은 루트의 `권지훈 가위바위보/`(한글·공백 파일명이라 코드에서는 직접 참조하지 않는다).
- 최고 기록은 `localStorage` 키 `mj-<게임>-best`(예: `mj-stack-best`)에 저장하고 로비 카드에 표시. 접근은 항상 try/catch.
- 헤드리스 확인: `chrome.exe --headless=new --screenshot=... file:///...`. 창 너비는 약 500px보다 좁아지지 않으므로, 휴대폰 크기(390×844 등)는 해당 크기의 `<iframe>`을 담은 임시 페이지로 찍는다(`--allow-file-access-from-files`). 헤드리스에서는 rAF가 거의 돌지 않으므로 테스트 사본에서 `requestAnimationFrame`을 `setTimeout(…,16)`으로 바꾸고, `Math.random`을 고정해 승/패/무를 재현한다. `--dump-dom`이나 iframe 없이 직접 찍으면 CSS 애니메이션이 시작 전(`pending`)에 멈춰 요소가 투명하게 보일 수 있다. 화면 확인은 iframe 방식으로 한다. 헤드리스 크롬은 `timeout 60`으로 감싸 실행하고, 멈춘 것을 끌 때는 명령줄에 `--headless`가 있는 프로세스만 종료한다(`taskkill /IM chrome.exe`는 사용자의 크롬까지 건드린다).
- `PRODUCT.md` — 대상 사용자(민준이의 학교 친구들, 모바일+PC), 확인된 사실 목록, 브랜드 약속. **확인된 사실만 사용**(마인크래프트 건축·서바이벌, 축구 공격수, 치킨, 파란색). 생일·사는 곳·학교·사진 등은 지어내지 말 것.
- `index-설명-보안진단.md` — index.html의 쉬운 설명 + 보안 진단 문서(어린이 대상 설명 톤).
- `error/` — 사용자가 보낸 오류 스크린샷.

## 디자인 규칙

- **브랜드 컬러는 `index.html`의 `:root` 토큰을 그대로 사용**한다(예외: 사용자가 에셋을 준 게임은 그 에셋의 팔레트를 따른다. `games/rps.html`은 에셋에서 뽑은 `--outline #2a2118`, `--cream #fffaf0`, `--blue #4a9cf8`, `--pink #f85a7c`, `--yellow #f8b82c` 등). `games/mole.html`은 브랜드 토큰을 그대로 두고 잔디밭용 색(`--sky-*`, `--meadow`, `--turf`, `--dirt*`, `--alarm`)만 덧붙였다. 새 페이지/게임에도 같은 변수명으로 복사해 쓴다:
  `--night #0b1530`, `--night-deep #050a1c`, `--night-glow #1b3a6b`, `--ink #fff`, `--ink-soft #cfe0ff`,
  `--blue #2f6bff`, `--blue-light #7fd1ff`, `--blue-dark #1d46b0`,
  `--wood #c69c5d`, `--wood-ink #2b1a0e`, `--wood-edge #6e4a25`, `--grass #5fb14a`, `--torch #ffb347`.
- 스타일 방향: 3D 치비, 귀엽게, 파란색 + 밤하늘, 마인크래프트풍 픽셀/블록 감성. 만지면 반응해야 한다.
- **사용자 피드백(2026-10-08): 이모지·이모티콘만으로 된 디자인은 싫어한다.** 게임 화면의 그림 요소는 사용자가 준 이미지 에셋이나 직접 그린 SVG/CSS로 만들고, 이모지는 그림 대신 쓰지 않는다. 에셋 폴더가 주어지면 그것을 우선 사용한다.
- 유지 필수 기능(index.html): 밤하늘 배경과 유성우, 화면 클릭 시 이모지 폭죽.
- **폰트**: 사이트 UI는 `--display: 'Black Han Sans'`, `--body: 'Do Hyeon'`. **게임 화면(HUD·점수·버튼)은 임시로 `'Jua'`(Google Fonts) 하나만 사용**한다 — 둥글고 귀여워 어린이 게임에 맞고 한글 가독성이 좋다. 확정 시 이 줄을 갱신. 예외(사용자 선택, 2026-10-16): 레트로 게임인 `games/brick.html`은 SCORE·숫자·영어 간판만 픽셀 글씨 `'Press Start 2P'`(`--pixel`, 한글 없음)이고 한글은 Jua.
- 모바일 대응 필수(터치 입력, 16px 좌우 여백, 가로 스크롤 없음). UI 문구는 한국어.
