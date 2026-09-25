@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Mutation Designer needs Node.js 22 or newer.
  echo Install Node.js, then double-click this launcher again.
  pause
  exit /b 1
)
node "%~dp0launch.mjs" %*
if errorlevel 1 pause
