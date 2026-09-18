@echo off
rem 启动官网（独立子项目）—— 不影响 Analyzer；停止请直接关闭本窗口或按 Ctrl + C。
rem 默认端口 8789；需要换端口：set SITE_PORT=9010 && start-site.bat
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [site] 未找到 node，请先安装 Node.js。
  pause
  exit /b 1
)
node "%~dp0serve.mjs" --open
endlocal
