@echo off
REM Run Django with ASGI server (Uvicorn) for async support
REM This is REQUIRED for async views to work properly

cd /d "%~dp0"

echo Starting Django with ASGI server (Uvicorn)...
echo Make sure FASTAPI_SECRET is set in your environment!
echo.

uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
