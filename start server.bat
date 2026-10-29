@echo off
:loop
cls
echo ==============================
echo Iniciando servidores Node.js...
echo ==============================
start cmd /k "npm run dev:api"
npm run dev

echo.
echo Pressione qualquer tecla para reiniciar os servidores...
pause >nul

echo Encerrando servidores...
taskkill /IM node.exe /F

goto loop
