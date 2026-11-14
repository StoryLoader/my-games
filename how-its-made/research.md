# 조사 노트 — 이 영상은 이렇게 만들었습니다 (튜토리얼)
조사일: 2026-11-14 · 목적: 「반도체 vs 우주선」 영상을 만든 과정을, 터미널의 Claude Code CLI 기준으로 처음부터 따라 할 수 있게 보여 준다.

사용자 지침(2026-11-14): ① 터미널(cmd) Claude Code CLI 기준 ② 깃허브에서 스킬 찾는 법부터 순서대로 따라 하는 튜토리얼 ③ 스킬 소개 ④ 영상 제작 원리 ⑤ 완성된 영상을 처음과 마지막에 보여 줄 것.

도구: 이 저장소의 실제 파일(스킬 README, render.py --help, chip-vs-rocket 프로젝트), `gh api search/repositories`(실제 검색 결과), WebSearch(Claude Code 설치·스킬 위치 — 공식 문서 페이지는 이 세션에서 직접 열지 못해 검색 요약으로 확인).

## 영상에 쓰는 사실
| # | 사실 | 출처 | 큐 |
|---|---|---|---|
| 1 | Claude Code 설치(맥·리눅스·WSL): `curl -fsSL https://claude.ai/install.sh \| bash`. 윈도우 PowerShell은 `irm https://claude.ai/install.ps1 \| iex` | code.claude.com 설치 문서(검색 요약), 여러 설치 안내 글 일치 | pr02–03 |
| 2 | `claude`로 실행, 첫 실행 때 로그인 | 같은 문서 | pr04 |
| 3 | script-to-motion은 macOS·Linux 기준. 준비물: Node.js, Chrome, (MP4) Python 3·ffmpeg, (내레이션) Fish Audio 키·음성 ID | 스킬 README "설치" | pr03, pr05, in04 |
| 4 | 스킬 = SKILL.md가 든 폴더. 개인 스킬 위치 `~/.claude/skills/<이름>/`, 프로젝트 스킬 `.claude/skills/<이름>/` | code.claude.com skills 문서(검색 요약), 스킬 README | gh02, in02 |
| 5 | 깃허브 저장소 검색 "claude skill motion graphics video" → 170건(2026-11-14). 예: bangtutorial/bang-motion ★2,124 · haidrrrry/claude-remotion-skill ★992 · charlie947/motion-graphics-skills ★668 · kstost/script-to-motion ★42(MIT, 최근 푸시 2026-11-10) | `gh api search/repositories` 실행 결과 | gh03–07 |
| 6 | 설치 명령: `git clone https://github.com/kstost/script-to-motion.git <스킬 폴더>/script-to-motion` → `cd …/scripts && npm install` | 스킬 README | in03 |
| 7 | Fish Audio 키는 스킬 폴더의 `.env`에 `FISH_API_KEY=…`, 음성은 `FISH_VOICE=…`. 키가 없으면 내레이션 없는 영상 | 스킬 README | in05–06 |
| 8 | 실제로 입력한 요청: "주제 : 반도체 기술 vs 우주선 기술, 무엇이 더 어려운가?" → (첫 결과는 2D) → "three.js로 입체적이고 멋지게 만들어라. 반도체쪽은 라이트한 테마로 우주쪽은 다크한 테마로 잘 이해되게" | 이 작업의 대화 기록 | rq02, rq04 |
| 9 | 완성 영상: 383.44초(6분 23초), 대본 47줄, 60fps면 약 23,006장. 큐 pa05(주석 방울)는 71.8초 시작 | chip-vs-rocket/js/cues.js | pp04, pp08 |
| 10 | 전체 프레임 검사 1/30초 간격 11,545장면, 오류 0 | 이 작업의 errscan 결과 | rq03 화면 |
| 11 | 완성 폴더의 index.html을 Chrome으로 열면 재생, `python3 render.py`로 MP4(프레임마다 그려서 찍음) | 스킬 README, render.py --help | ex02–03, pp08–09 |
| 12 | 화면이 멈춘 문제(다른 영상 「사상체질」 0:49)와 수정 | 이 작업의 기록 | rq06 |

## 화면 재현에 대하여
- 터미널·검색 화면은 실제 화면을 녹화한 것이 아니라 **재현**이다(화면에 "재현 화면" 표기). 명령은 실제 명령 그대로, 출력은 요약.
- 깃허브·Claude의 로고는 쓰지 않는다(이름은 글자로만).
- API 키는 어디에도 보이지 않는다(가림 처리된 예시만).

## 실사 자료
- 완성 영상 발췌 5개(assets/user/vid/demo_a~e.mp4): 이 저장소의 chip-vs-rocket 프로젝트를 render.py로 구운 것 — provenance.json.

## 소리
- 배경음악 없음(따라 하는 튜토리얼 — 말이 또렷해야 함). 효과음만 sfx/make_sfx.py로 합성(타자·엔터·단계 종·전환음·팝·틱·완료음·셔터·되감기·버즈·임팩트 12종). 자세한 배치와 음량은 storyboard.md → 소리.
