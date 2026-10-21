@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 민준이의 오락실 서버

set PY=
where py > nul 2> nul && set PY=py
if not defined PY where python > nul 2> nul && set PY=python
if not defined PY (
  echo 파이썬이 없어서 서버를 켤 수 없어요.
  echo https://www.python.org 에서 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)

echo.
echo   민준이의 오락실을 여는 중이에요...
echo   주소: http://localhost:8123/arcade.html
echo   이 창을 닫으면 게임 서버도 꺼져요.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8123/arcade.html'"
%PY% -m http.server 8123 --bind 127.0.0.1
