@echo off

rem :: enable writing log statements in web crawler to stdout
set NODE_ENV=development

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
mkdir "%workspace%\i_old"
mkdir "%workspace%\i_new"
mkdir "%workspace%\i_now"
mkdir "%workspace%\cookies"
mkdir "%workspace%\stream"
mkdir "%workspace%\multipart_form_data"
mkdir "%workspace%\pipe"
mkdir "%workspace%\mirror"

call nget --help >"help.txt"

call nget --url "https://github.com/warren-bank/node-request/archive/master.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" --content-disposition
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -O "%workspace%\O\master.-O.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\P"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\i_old" -i "%DIR%\.etc\urls_old.txt"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\i_new" -i "%DIR%\.etc\urls_new.txt"
call nget                                                                        -P "%workspace%\i_now" -i "%DIR%\.etc\urls_now.txt" --mc 5
call node "%DIR%\.etc\urls_now.js" "%workspace%\i_now" >"%workspace%\i_now\summary.json"

call nget --url "https://httpbin.org/cookies/set/foo/bar" --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\1-set.txt" --save-headers --no-follow-redirect --no-validate-status-code
call nget --url "https://httpbin.org/cookies"             --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\2-get.txt"

call nget-convert-cookiefile --json-to-text --in "%workspace%\cookies\cookie.json"          --out "%workspace%\cookies\cookie.convert-1.txt"
call nget-convert-cookiefile --text-to-json --in "%workspace%\cookies\cookie.convert-1.txt" --out "%workspace%\cookies\cookie.convert-2.json"

call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "%workspace%\stream\1-package.json"       --post-file      "%workspace%\package.json"
call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "%workspace%\stream\2-package-stdin.json" --post-file "-" <"%workspace%\package.json"
call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "-"                                       --post-file "-" <"%workspace%\package.json" >"%workspace%\stream\3-package-stdout.json"

call node -e "const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent('value to urldecode')} }}&binary_stdin={{@ -}}&binary_file={{@ package.json}}`; const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\1-post-data.json"
call node -e "const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent('value to urldecode')} }}`;                                                     const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\2-post-data.json"
call node -e "const post_data = `text_encoded={{btoa value to b64encode}}&text_decoded={{atob ${              btoa('value to b64decode')} }}`;                                                     const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\3-post-data.json"

rem :: -------------
rem :: using:
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/echo-post-data/echo-post-data.pl
rem :: -------------

rem :: absolute path to file piped to stdin stream
set path_abs=%workspace%\..\..\.gitignore
rem :: -------------
rem :: all "multipart/form-data" fields
set post_data="hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz&file1={{@ -}}&files2={{@ ../../.gitignore}}&files2={{@ package.json}}"
rem :: -------------
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\4-echo-post-data.multipart-form.txt" <"%path_abs%"

rem :: -------------
rem :: all "application/x-www-form-urlencoded" fields
set post_data="hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz"
rem :: -------------
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\5-echo-post-data.urlencoded-form.txt"

rem :: -------------
rem :: re-POST the previous unmodified form fields using "multipart/form-data" encoding
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\6-echo-post-data.multipart-form.txt" --header "Content-Type: multipart/form-data"

rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (no filename, default mime)
set post_data="image={{@ -}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\1-echo-post-data.multipart-form.txt"

rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, default mime)
set post_data="image={{@ - avatar.png}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\2-echo-post-data.multipart-form.txt"

rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, explicit mime)
set post_data="image={{@ - avatar.png | image/awesome-png}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\3-echo-post-data.multipart-form.txt"

rem :: -------------
rem :: query github API for SHA hash of an arbitrary file in a repo
rem :: https://docs.github.com/en/rest/reference/repos#get-repository-content
call nget --url "https://api.github.com/repos/warren-bank/Android-WebMonkey/contents/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -U "nget" -O "-" | perl -pe "s/^.*\x22content\x22:\x22([^\x22]+)\x22.*$/\1/; s/\\n//g" | openssl sha1 >"%workspace%\pipe\4a-sha1-base64-actual.txt"

rem :: -------------
rem :: pipe: download same file and generate SHA hash to compare
call nget --url "https://github.com/warren-bank/Android-WebMonkey/raw/master/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -O "-" | openssl base64 -A | openssl sha1 >"%workspace%\pipe\4b-sha1-base64-piped.txt"

rem :: -------------
rem :: perform bitwise comparison
fc /b "%workspace%\pipe\4a-sha1-base64-actual.txt" "%workspace%\pipe\4b-sha1-base64-piped.txt" >"%workspace%\pipe\4c-sha1-base64-equality.txt"

rem :: ------------------
rem :: request 1:
set req1_url_image="https://avatars.githubusercontent.com/u/6810270"
rem :: ------------------
rem :: request 2:
rem :: [API] https://textart.io/api/img2txt
set req2_api_endpoint="http://api.textart.io/img2txt"
set req2_api_postdata="image={{@ - avatar.png}}&format=color&encode=true"
rem :: ------------------
call nget --url %req1_url_image% -O "-" | call nget --url %req2_api_endpoint% --method POST --post-data %req2_api_postdata% -O "-" >"%workspace%\pipe\5a-ascii_art.json"
call node -e "let ascii_art = require(process.env.workspace + '/pipe/5a-ascii_art.json'); ascii_art = ascii_art.contents.textart; ascii_art = atob(ascii_art); console.log(ascii_art)" >"%workspace%\pipe\5b-ascii_art.html"

rem :: ------------------
rem :: mirror a website: (830 KB, 47 files)
call nget -P "%workspace%\mirror" --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" -np -S >"%workspace%\mirror\hexdocs.pm.log" 2>&1
