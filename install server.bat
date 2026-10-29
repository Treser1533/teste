@echo off

:: Install dependencies
npm install
npm --prefix backend install

pause

:: Navigate to backend folder
cd ./backend

:: Run Prisma migrations and generate client
npx prisma migrate dev
npx prisma generate

pause
