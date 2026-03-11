@echo off
setlocal

set "OUTFILE=TestStory.zip"
if exist "%OUTFILE%" del "%OUTFILE%"
powershell -Command "Get-ChildItem -Include *.docx, *.json -Recurse | Compress-Archive -DestinationPath '%OUTFILE%'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Created %OUTFILE%
) else (
    echo.
    echo Error: Something went wrong during packaging.
)

pause