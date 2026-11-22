# 조사 노트 — 세상에서 가장 이해하기 쉬운 GPU 만드는 법
조사일: 2026-11-11 · 질문: GPU는 무엇으로, 어떤 원리로, 어떻게 만들어지는가 (가장 작은 부품부터 완성된 칩까지)

도구: WebSearch(검색 결과 요약으로 교차 확인). 제조사 원문 페이지를 직접 열지는 않았다.

## 영상에 쓰는 사실
| # | 사실 (내 말로) | 출처 | 교차 확인 | 큐 |
|---|---|---|---|---|
| 1 | 4K 화면은 3840×2160 = 8,294,400개(약 830만)의 점(픽셀). 1초 60번 → 약 5억 번 | 산술 + MIT 성능공학 강의 노트(4K ≈ 8 MPixels, 60 Hz) | 산술로 검증 | op02–op03, ai08 |
| 2 | 트랜지스터는 전기로 켜고 끄는 스위치이고, 컴퓨터는 두 전압을 1과 0으로 읽는다 | Berkeley CS61C 노트, Baeldung "Arithmetic Logic Unit" | 복수 교재 | sw01–sw03 |
| 3 | AND는 두 입력이 모두 1일 때 1, XOR는 하나만 1일 때 1. 반가산기 = XOR(합) + AND(올림). 이진수 1+1=10 | Crash Course Computer Science #5, 101computing.net, Baeldung | 복수 | sw05–sw09 |
| 4 | 가산기를 이어 붙이면 여러 자리 덧셈(리플 캐리), ALU는 덧셈·뺄셈·논리 연산을 한다 | kindatechnical.com, Utah CS3810 슬라이드 | 복수 | sw10–sw11 |
| 5 | CPU는 복잡한 일을 잘하는 소수의 강한 코어, GPU는 같은 연산을 대량 데이터에 동시에 하는 다수의 단순한 코어 | Paperspace/DigitalOcean CUDA 튜토리얼, learnopencv | 복수 | cp02–cp03 |
| 6 | 가정용 CPU 코어 수: Ryzen 9 9950X 16코어, Core i9-14900K 24코어 | Digital Trends, Club386 비교 | 복수 | cp02 |
| 7 | RTX 4090: 쿠다 코어 16,384개(풀 다이 18,432), 트랜지스터 763억 개, TSMC 4N, 약 608 mm² | HotHardware, TechPowerUp, TweakTown 리뷰 | 복수 일치 | cp04 |
| 8 | GPU 옆에 전용 메모리, 넓은 버스(RTX 4090: 384비트, 24 GB GDDR6X) | TweakTown 사양 | — | cp08 |
| 9 | 칩 재료 실리콘은 석영 모래에서 정제, 전자급 폴리실리콘 9N(99.9999999 %) | MKS "Silicon Wafer Production", 대학 강의 자료(Xiao) | 복수(9N이 정확) | fb01–fb02 |
| 10 | 초크랄스키법으로 단결정 잉곳 → 얇게 썰어 300 mm 웨이퍼 | MKS, averroes.ai | 복수 | fb03 |
| 11 | 포토리소그래피: 감광막에 빛을 비춰 무늬를 복제 | ASML "6 crucial steps in semiconductor manufacturing" | TRUMPF | fb04–fb05 |
| 12 | EUV 13.5 nm, 진공 속 주석 방울을 레이저가 초당 5만 번 타격, 장비 180톤·부품 10만 개 이상 | TRUMPF "Behind the scenes of microchip production", Wikipedia EUVL | 복수 | fb06–fb07 |
| 13 | 웨이퍼 제작은 수천 단계, 설계부터 생산까지 3개월 이상 | ASML 위 글 | — | fb08 |
| 14 | 다이아몬드 톱으로 잘라 개별 칩으로 | ASML 위 글 | — | fb09 |
| 15 | H100: 트랜지스터 800억 개, 814 mm², TSMC 4N | Tom's Hardware, HotHardware, TechPowerUp | 복수(한 곳의 "8000억"은 오타) | fb10 |
| 16 | 그래픽과 AI 모두 대량의 독립된 곱셈·덧셈(행렬 곱셈)이라 GPU에 맞는다; 볼타 세대부터 행렬 연산 전용 텐서 코어 | creativestrategies.com, deepdatamininglearning 문서 | 복수 | ai01–ai05 |

## 주제에 없던 내용으로 덧붙인 것
- EUV 광원(주석 방울, 초당 5만 번), 3개월·수천 단계, H100 800억 트랜지스터, 텐서 코어.

## 명칭
| 대상 | 화면 표기 | 읽기 |
|---|---|---|
| 그래픽 처리 장치 | GPU | 지피유 |
| 중앙 처리 장치 | CPU | 씨피유 |
| 엔비디아 RTX 4090 | RTX 4090 | 알티엑스 사공구공 |
| 엔비디아 H100 | H100 | 에이치백 |
| 극자외선 | 극자외선(EUV) | 극자외선 |

## 출처끼리 다른 점
- 가정용 CPU 코어 수는 모델마다 다름 → "16개에서 24개쯤".
- 칩 크기: 4090 약 608 mm², H100 814 mm² → "우표만 한".

## 뺀 것
- "세계 최초의 GPU, 지포스 256(1999)": 마케팅 용어라 논란이 있어 뺌.
- 워프(32개 스레드 묶음), SM 구조: 처음 듣는 사람에게 필요 없는 용어라 뺌.
