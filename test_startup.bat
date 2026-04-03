@echo off
.venv\Scripts\python.exe -m uvicorn app.main:app > startup_log.txt 2>&1
