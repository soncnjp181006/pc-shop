@echo off
cd /d %~dp0..
.venv\Scripts\python.exe -m uvicorn app.main:app > logs\startup_log.txt 2>&1
