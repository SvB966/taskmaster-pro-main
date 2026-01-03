@echo off
setlocal

:: Ensure Node.js is available
where node >nul 2>nul
if errorlevel 1 (
	echo Node.js is not on PATH. Please install Node.js and reopen this script.
	pause
	goto :end
)

:: Run from the project directory
pushd "%~dp0"

:: Install dependencies if missing
if not exist node_modules (
	echo Installing dependencies...
	call npm install
	if errorlevel 1 goto :fail
)

echo Starting dev servers...
call npm run dev
if errorlevel 1 goto :fail

goto :end

:fail
echo.
echo Failed to start. Check the error messages above.
pause

:end
popd
endlocal
