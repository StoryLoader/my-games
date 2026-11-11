# 조사 노트 — 컴퓨터 하드웨어 한 번에 총정리
조사일: 2026-11-11 · 질문: 본체 안의 부품(CPU, RAM, 저장장치, GPU·VRAM, 메인보드, 파워, 냉각)은 각각 무슨 일을 하고, 왜 나뉘어 있는가

도구: WebSearch(검색 결과 요약으로 교차 확인). 제조사 원문 페이지를 직접 열지는 않았다.

## 영상에 쓰는 사실
| # | 사실 (내 말로) | 출처 | 교차 확인 | 큐 |
|---|---|---|---|---|
| 1 | 가정용 CPU 코어 수는 대략 6~24개 (Ryzen 5 계열 6, Ryzen 9 9950X 16, Core i9-14900K 24) | 지난 영상(gpu-easy) 조사 + 제조사 사양 상식 | 복수 | cpu03 |
| 2 | 클럭 5 GHz = 1초에 50억 사이클 | 단위 정의 | 산술 | cpu05–06 |
| 3 | DDR5 메모리 지연은 수십 나노초(CL30 DDR5-6000의 CAS 지연 10 ns, 실제 접근은 그보다 김), NVMe SSD는 수십 마이크로초 → 대략 천 배 | Lexar "RAM timings vs speed", Crucial DDR5, KodeKloud 메모리 계층 노트 | 복수(배수는 1,000~5,000배로 출처마다 다름 → "천 배쯤") | mem06–07 |
| 4 | RAM은 휘발성: 전원이 꺼지면 내용이 사라짐 | Crucial, KodeKloud | 복수 | mem09 |
| 5 | 요즘 PC RAM 16~32 GB, 저장장치 1 TB가 흔함 | 소매 구성 상식 | — | mem08 |
| 6 | 7,200 rpm HDD 순차 읽기 약 150~250 MB/s(한 측정 198 MB/s), PCIe 4.0 NVMe 최대 약 7,000 MB/s(Corsair MP600 Elite 사양) → 약 35배 | TechSpot 저장장치 비교, gamingpcguru, Corsair 사양 | 복수 | mem12 |
| 7 | RTX 4090: 쿠다 코어 16,384개, 24 GB GDDR6X, 384비트, 21 Gbps → 1,008 GB/s | TechPowerUp, Tom's Hardware 리뷰 | 복수 | gpu03, gpu06 |
| 8 | DDR5-6000 2채널 이론 대역폭 = 6000 MT/s × 64비트 × 2 ÷ 8 = 96 GB/s (측정치 55~90 GB/s) | 산술 + 리뷰 측정치 | 산술 | gpu07 |
| 9 | VRAM이 넘치면 드라이버가 넘친 데이터를 PCIe로 시스템 RAM에 두고 가져옴 → 훨씬 느려 끊김, 텍스처가 늦게 선명해짐 | sunbeamtech, pcgamecheck, evetech 가이드 | 복수(배수는 출처마다 다름 → 수치 안 씀) | gpu08–09 |
| 10 | 파워: 교류를 정류·변압해 +12 V(CPU·GPU), +5 V, +3.3 V 직류로 | PC Gamer "How PC power supplies work", TechSpot "Anatomy of a PSU", Corsair | 복수 | base05–06 |
| 11 | 한국 가정 전기 220 V, 60 Hz 교류 | 상식(전기 규격) | — | base05 |
| 12 | 너무 뜨거워지면 CPU·GPU가 스스로 클럭을 낮춤(스로틀링) | 상식(제조사 열 보호 동작) | — | base09 |
| 13 | 작업 관리자는 CPU, 메모리, 디스크, GPU 사용률을 퍼센트로 보여 줌 (Windows) | 상식 | — | fin02 |

## 명칭
| 대상 | 화면 표기 | 읽기 |
|---|---|---|
| 중앙 처리 장치 | CPU | 씨피유 |
| 램 | RAM | 램 |
| 비디오 램 | VRAM | 브이램 |
| 그래픽 처리 장치 | GPU | 지피유 |
| 솔리드 스테이트 드라이브 | SSD | 에스에스디 |
| 엔비디아 RTX 4090 | RTX 4090 | 알티엑스 사공구공 |

## 출처끼리 다른 점
- RAM과 SSD의 지연 배수: 1,000~5,000배 → "천 배쯤".
- VRAM이 넘쳤을 때의 속도 저하 배수: 10~30배 → 숫자 대신 "훨씬 느린 길".

## 뺀 것
- CPU 캐시, PCIe 세대, 칩셋: 처음 듣는 사람에게 이번 주제의 핵심이 아니라 뺌.
