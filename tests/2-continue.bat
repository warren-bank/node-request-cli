@echo off

set DIR=%~dp0.
set workspace=%DIR%\workspace

if not exist "%workspace%" (
  mkdir "%workspace%"
  cd "%workspace%"

  call npm init -y
  call npm install --save "%DIR%\.."
  cls
  pause

  mkdir "%workspace%\continue"
) else (
  cd "%workspace%"
)

set PATH=%workspace%\node_modules\.bin;%PATH%

rem :: ------------------
rem :: PDF is 20MB
rem ::
rem :: To test --continue:
rem ::  1. begin download
rem ::  2. wait a few seconds, then kill the download (ex: close the terminal window)
rem ::  3. repeat steps 1-2 several times, until download is complete
rem ::
rem :: Assertions and Post Conditions:
rem ::  1. the filesize will grow with each run
rem ::  2. once the download is complete, the filesize will remain constant
rem ::  3. the resulting PDF file is not corrupt, and opens in a reader without error
rem ::
rem :: ------------------

set PDF_URL="https://github.com/germanoa/compiladores/raw/master/doc/ebook/The C Programming Language - 2nd Edition - Ritchie Kernighan.pdf"
call nget -c -O "%workspace%\continue\book.pdf" --url %PDF_URL% -S >>"%workspace%\continue\book.log"
