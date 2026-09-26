@echo off
title تشغيل نظام الإدارة المدرسية وسجل الامتحانات
chcp 65001 >nul

:: البحث عن المتصفحات المتوافقة لتشغيل التطبيق كنافذة سطح مكتب مستقلة دون أشرطة ويب
set "APP_URL=file:///%~dp0index.html"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1366,850
    exit /b
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%" --window-size=1366,850
    exit /b
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1366,850
    exit /b
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%" --window-size=1366,850
    exit /b
)

:: في حال عدم العثور، فتح الملف بالمتصفح الافتراضي
start "" "%~dp0index.html"
exit /b
