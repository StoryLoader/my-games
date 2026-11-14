# 조사 노트 — LLM과 AI 에이전트, 처음부터 오늘까지
조사일: 2026-11-14 · 요청: "완전 초보도 이해할수 있는 LLM과 AI Agent 개념과 역사(오늘날 클로드와 chatgpt까지)"

도구: WebSearch(연도·수치 교차 확인), OpenAI·Anthropic 공식 발표 페이지 검색 결과, Anthropic 문서(code.claude.com), 위키미디어 공용(사진·라이선스). 위키백과 본문은 이 세션의 네트워크 허용 목록 밖이라 직접 열지 못했고, 검색 결과에 인용된 내용으로 확인했다. 널리 알려진 논문의 수치(알렉스넷, GPT-1/3 파라미터 수)는 원 논문 기준이며 이번 세션에서 원문을 다시 열어 보지는 못했다.

## 영상에 쓰는 사실
| # | 사실 | 근거 | 큐 |
|---|---|---|---|
| 1 | 1950년 10월, 앨런 튜링이 학술지 Mind에 "Computing Machinery and Intelligence" 발표. "기계가 생각할 수 있는가"를 묻고 흉내 내기 놀이(훗날 튜링 테스트)를 제안 | 검색 결과(IEEE Spectrum 등 다수 일치) | ha03–05 |
| 2 | 1956년 여름 다트머스 워크숍. "artificial intelligence"는 이 모임을 제안한 글(1955)에서 존 매카시가 처음 썼다 → 대본은 "이 모임을 제안하면서 처음 쓴 이름"이라고 표현 | 검색 결과(1955/1956 두 설명 모두 이 표현과 일치) | ha06 |
| 3 | 프랭크 로젠블랫의 퍼셉트론 — 1957년 고안, 1958년 발표(자료에 따라 연도 표기가 갈림 → "1958년 발표") | 검색 결과, 미 해군 사진 설명(위키미디어) | ha07–09 |
| 4 | ELIZA — MIT 요제프 바이첸바움, 1966년 논문 발표(개발 1964–66). DOCTOR 스크립트는 키워드를 정해진 틀에 끼워 넣는 방식. "어머니" → 가족 이야기로 받는 규칙 | 검색 결과, 위키미디어 ELIZA 화면 | ha10–12 |
| 5 | AI 겨울 두 차례: 1970년대 중반~1980년, 1980년대 말~1990년대 초. 연구비 삭감 | 일반적으로 통용되는 시기 구분 | ha13–14 |
| 6 | 1986년 역전파 — Rumelhart·Hinton·Williams, Nature. (처음 고안된 것은 아니고 "널리 알려짐") | 원 논문 | hb03–04 |
| 7 | 1997년 5월 IBM 딥 블루가 카스파로프에게 승리. 탐색·평가 규칙 기반 | 위키미디어 사진 설명 등 | hb05–06 |
| 8 | 2012년 알렉스넷 — ImageNet 대회 상위 5개 오답률 15.3%, 2위 26.2% | Krizhevsky 외 2012 논문 | hb09–10 |
| 9 | 2016년 3월 서울, 알파고(딥마인드, 구글 자회사)가 이세돌 9단에게 4대 1 승. 제4국은 이세돌 승 | 위키미디어 기보, 널리 보도 | hb11–12 |
| 10 | 2017년 "Attention Is All You Need" — 구글 소속 연구자 8명, 트랜스포머 제안 | 검색 결과(저자 8명·구글 소속 확인) | hc02–08 |
| 11 | 2018년 GPT-1(약 1억 1,700만 파라미터) → 2020년 GPT-3(1,750억). GPT = Generative Pre-trained Transformer | OpenAI 논문 | hc09–11 |
| 12 | 2022-11-30 ChatGPT 공개. 5일 만에 100만 명(샘 올트먼), 2023년 1월 월간 사용자 약 1억 명 추정(UBS·Similarweb) | 검색 결과(History.com, Reuters 인용 다수) | hc12–13 |
| 13 | 2026년 2월 OpenAI 발표: ChatGPT 주간 사용자 9억 명. (이후 10억 돌파 보도도 있으나 출처가 갈려 쓰지 않음) | 검색 결과(Search Engine Land 통계 정리 등) | hc13b |
| 14 | Anthropic은 2021년 OpenAI 출신들이 설립, Claude 첫 공개 2023년 3월 | 널리 알려진 사실, Anthropic 발표 | hc14 |
| 15 | 2023-06-13 OpenAI API에 function calling 도입. 같은 해 AutoGPT·BabyAGI 화제(안정성 부족) | 검색 결과 | ah02–03 |
| 16 | 2024년 10월 Claude computer use, 2024년 11월 Model Context Protocol(MCP) 공개 | 검색 결과 | ah04–05 |
| 17 | Claude Code — 2025년 2월 연구 미리보기, 2025-05-22 Claude 4와 함께 정식 출시 | Anthropic Claude 4 발표 | ah06 |
| 18 | 2025-07-17 OpenAI "ChatGPT agent" 발표 — 자체 가상 컴퓨터에서 작업 | OpenAI 발표 페이지 | ah07 |
| 19 | 이 영상은 Claude Code(에이전트)가 조사·대본·화면 제작을 수행 | 이 작업의 기록 | ah09 |

## 덧붙인 것 / 일부러 뺀 것
- "다이얼"(파라미터), "수첩"(기억), "충전기 규격"(MCP) 비유는 이해를 돕기 위해 직접 지은 것.
- 예시 문장("오늘 날씨가 참 …", "철수가 사과를 먹었다. 그것은 달았다", 부산 출장 기차표)은 설명용으로 지은 것이며 점수(62%, 21% …)도 예시 값이다(화면에 "예시" 표기).
- 환각 예시("세종대왕이 1887년에 스마트폰을 발명")는 일부러 지어낸 틀린 문장이다.
- 최신 모델의 구체적 이름·버전(GPT-5.x, Claude 5 계열 등)은 금방 바뀌고 출처마다 날짜가 갈려 내레이션에 넣지 않았다.
- 구글 제미나이 등 다른 서비스는 "구글을 비롯한 여러 회사"로만 언급.

## 실사 자료 (위키미디어 공용 · 화면에 출처·라이선스 표기)
| 파일 | 내용 | 저작자 | 라이선스 | 출처 |
|---|---|---|---|---|
| turing.jpg | 앨런 튜링, 1951년 | Elliott & Fry | Public domain | https://commons.wikimedia.org/wiki/File%3AAlan_Turing_%281951%29.jpg |
| perceptron.jpg | 글자를 알아보는 실험 기계(퍼셉트론)를 다루는 모습, 미 해군 사진 | National Museum of the U.S. Navy | Public domain | https://commons.wikimedia.org/wiki/File%3A330-PSA-80-60_%28USN_710739%29_%2820897323365%29.jpg |
| eliza.png | 엘리자와 나눈 대화 화면 | Unknown author | Public domain | https://commons.wikimedia.org/wiki/File%3AELIZA_conversation.png |
| deepblue_b.jpg | IBM 딥 블루와 같은 기종의 컴퓨터 | James the photographer | CC BY 2.0 | https://commons.wikimedia.org/wiki/File%3ADeep_Blue.jpg |
| leesedol.jpg | 이세돌 9단, 2016년 | LG Electronics | CC BY 2.0 | https://commons.wikimedia.org/wiki/File%3ALee_Se-Dol.jpg |
| go_game4.jpg | 이세돌 대 알파고 제4국 기보 | Wesalius | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3ALee_Sedol_%28B%29_vs_AlphaGo_%28W%29_-_Game_4.jpg |
| dartmouth.jpg | 다트머스 대학의 다트머스 홀 | Daderot | CC0 | https://commons.wikimedia.org/wiki/File%3ADartmouth_Hall_-_Dartmouth_College_-_DSC01608.jpg |
| weizenbaum.jpg | 요제프 바이첸바움, 1982년 | Rochester Institute of Technology | Public domain | https://commons.wikimedia.org/wiki/File%3AWeizenbaum_1982.jpg |
| hinton.jpg | 제프리 힌턴, 2024년 | Arthur Petron | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AGeoffrey_E._Hinton%2C_2024_Nobel_Prize_Laureate_in_Physics_%28cropped1%29.jpg |

로고(ChatGPT, Claude, OpenAI, Anthropic, Google, IBM)는 쓰지 않고 이름을 글자로만 표기한다.

## 소리
- 배경음악 없음(설명 영상). 효과음은 sfx/make_sfx.py로 합성.
