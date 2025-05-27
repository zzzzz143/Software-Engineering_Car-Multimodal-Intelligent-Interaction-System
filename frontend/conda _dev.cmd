@echo off
:: 强制指定 Node.js 路径
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin;%PATH%"

:: 运行开发命令
call "%NODE_PATH%\node.exe" "%CD%\node_modules\nodemon\bin\nodemon.js" server.js