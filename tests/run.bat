@echo off

set DIR=%~dp0.
set workspace=%DIR%\workspace

if exist "%workspace%" rmdir /Q /S "%workspace%"
mkdir "%workspace%"
cd "%workspace%"

call npm init -y
call npm install --save "%DIR%\.."
cls

set PATH=%workspace%\node_modules\.bin;%PATH%

mkdir "%workspace%\O"
mkdir "%workspace%\P"
mkdir "%workspace%\i"
mkdir "%workspace%\cookies"

call nget --help >"help.txt"

call nget --url "https://github.com/warren-bank/node-request/archive/master.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" --content-disposition
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -O "%workspace%\O\master.-O.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\P"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\i" -i "%DIR%\.etc\urls.txt"

call nget --url "https://httpbin.org/cookies/set/foo/bar" --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\1-set.txt" --save-headers --no-follow-redirect --no-validate-status-code
call nget --url "https://httpbin.org/cookies"             --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\2-get.txt"
