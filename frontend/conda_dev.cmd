@echo off
SET NODE_EXECUTABLE_PATH="D:\nodejs\node.exe"

SET "PROJECT_DIR=%~dp0"
IF "%PROJECT_DIR:~-1%"=="\" SET "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

cd /d "%PROJECT_DIR%"

FOR %%F IN (%NODE_EXECUTABLE_PATH%) DO SET "NODE_DIR=%%~dpF"
IF "%NODE_DIR:~-1%"=="\" SET "NODE_DIR=%NODE_DIR:~0,-1%"

SET "PATH=%PROJECT_DIR%\node_modules\.bin;%NODE_DIR%;%PATH%"

start /B cmd /c "set PORT=3001 && node node_modules\NeteaseCloudMusicApi\app.js"

echo.
nodemon server.js

:eof
pause