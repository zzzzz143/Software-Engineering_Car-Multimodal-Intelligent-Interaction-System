@echo off
REM 设置指定的Node.js可执行文件路径
REM SET NODE_EXECUTABLE_PATH="C:\Program Files\nodejs\node.exe"
SET NODE_EXECUTABLE_PATH="D:\Node\node.exe"

REM 设置项目目录 (package.json 和 node_modules 所在的目录)
REM "%~dp0" 解析为该脚本所在的目录。
SET "PROJECT_DIR=%~dp0"
REM 如果路径以反斜杠结尾，则移除它，以便更清晰地拼接路径
IF "%PROJECT_DIR:~-1%"=="\" SET "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM 切换到项目目录
cd /d "%PROJECT_DIR%"

REM 提取Node.js可执行文件的目录
FOR %%F IN (%NODE_EXECUTABLE_PATH%) DO SET "NODE_DIR=%%~dpF"
REM 如果NODE_DIR以反斜杠结尾，则移除它
IF "%NODE_DIR:~-1%"=="\" SET "NODE_DIR=%NODE_DIR:~0,-1%"

REM 为此脚本执行设置本地 PATH 环境变量
SET "PATH=%PROJECT_DIR%\node_modules\.bin;%NODE_DIR%;%PATH%"

REM 使用 start /B 尝试在后台运行，不打开新窗口
REM 'cmd /c' 用于确保 'set' 和 '&&' 与 'start /B' 命令正确工作
start /B cmd /c "set PORT=3001 && node node_modules\NeteaseCloudMusicApi\app.js"

echo.
nodemon server.js

REM nodemon server.js 会阻塞后续命令，直到它被终止
:eof
pause
