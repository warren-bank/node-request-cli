@echo off

rem :: enable writing log statements in web crawler to stdout
set NODE_ENV=development

set DIR=%~dp0.
set workspace=%DIR%\workspace

if not exist "%workspace%" (
  mkdir "%workspace%"
  cd "%workspace%"

  call npm init -y
  call npm install --save "%DIR%\.."
  cls
  pause

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
  mkdir "%workspace%\mirror-misc-1"
  mkdir "%workspace%\mirror-wait"
  mkdir "%workspace%\mirror-redirect-paths"
  mkdir "%workspace%\mirror-original-paths"
  mkdir "%workspace%\content-disposition"
  mkdir "%workspace%\page-requisites-1-same-host"
  mkdir "%workspace%\page-requisites-2-all-hosts"
  mkdir "%workspace%\proxy"
  mkdir "%workspace%\concurrency"
) else (
  cd "%workspace%"
)

set PATH=%workspace%\node_modules\.bin;%PATH%

call nget --help >"help.txt"

call nget --url "https://github.com/warren-bank/node-request/archive/master.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" --content-disposition
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -O "%workspace%\O\master.-O.zip"
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\P"

rem :: -------------
echo ----- [i_old] --------------------------------------------------------
rem :: -------------
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\i_old" -i "%DIR%\.etc\urls_old.txt"

rem :: -------------
echo ----- [i_new] --------------------------------------------------------
rem :: -------------
call nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "%workspace%\i_new" -i "%DIR%\.etc\urls_new.txt"

rem :: -------------
echo ----- [i_now] --------------------------------------------------------
rem :: -------------
call nget                                                                        -P "%workspace%\i_now" -i "%DIR%\.etc\urls_now.txt" -mc 5
call node "%DIR%\.etc\urls_now.js" "%workspace%\i_now" >"%workspace%\i_now\summary.json"

rem :: -------------
echo ----- [cookies/1-set] ------------------------------------------------
rem :: -------------
call nget --url "https://httpbin.org/cookies/set/foo/bar" --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\1-set.txt" --save-headers --no-follow-redirect --no-validate-status-code

rem :: -------------
echo ----- [cookies/2-get] ------------------------------------------------
rem :: -------------
call nget --url "https://httpbin.org/cookies"             --load-cookies "%workspace%\cookies\cookie.json" -O "%workspace%\cookies\2-get.txt"

rem :: -------------
echo ----- [cookies/cookie.convert-1] -------------------------------------
rem :: -------------
call nget-convert-cookiefile --json-to-text --in "%workspace%\cookies\cookie.json"          --out "%workspace%\cookies\cookie.convert-1.txt"

rem :: -------------
echo ----- [cookies/cookie.convert-2] -------------------------------------
rem :: -------------
call nget-convert-cookiefile --text-to-json --in "%workspace%\cookies\cookie.convert-1.txt" --out "%workspace%\cookies\cookie.convert-2.json"

rem :: -------------
echo ----- [stream/1] -----------------------------------------------------
rem :: -------------
call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "%workspace%\stream\1-package.json"       --post-file      "%workspace%\package.json"

rem :: -------------
echo ----- [stream/2] -----------------------------------------------------
rem :: -------------
call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "%workspace%\stream\2-package-stdin.json" --post-file "-" <"%workspace%\package.json"

rem :: -------------
echo ----- [stream/3] -----------------------------------------------------
rem :: -------------
call nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "-"                                       --post-file "-" <"%workspace%\package.json" >"%workspace%\stream\3-package-stdout.json"

rem :: -------------
echo ----- [multipart_form_data/1-post-data] ------------------------------
rem :: -------------
call node -e "const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent('value to urldecode')} }}&binary_stdin={{@ -}}&binary_file={{@ package.json}}`; const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\1-post-data.json"

rem :: -------------
echo ----- [multipart_form_data/2-post-data] ------------------------------
rem :: -------------
call node -e "const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent('value to urldecode')} }}`;                                                     const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\2-post-data.json"

rem :: -------------
echo ----- [multipart_form_data/3-post-data] ------------------------------
rem :: -------------
call node -e "const post_data = `text_encoded={{btoa value to b64encode}}&text_decoded={{atob ${              btoa('value to b64decode')} }}`;                                                     const process_post_data = require('@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data'); console.log(process_post_data(post_data))" >"%workspace%\multipart_form_data\3-post-data.json"

rem :: -------------
rem :: using:
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/echo-post-data/echo-post-data.pl
rem :: -------------

rem :: -------------
echo ----- [multipart_form_data/4-echo-post-data.multipart-form] ----------
rem :: -------------
rem :: absolute path to file piped to stdin stream
set path_abs=%workspace%\..\..\.gitignore
rem :: -------------
rem :: all "multipart/form-data" fields
set post_data="hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz&file1={{@ -}}&files2={{@ ../../.gitignore}}&files2={{@ package.json}}"
rem :: -------------
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\4-echo-post-data.multipart-form.txt" <"%path_abs%"

rem :: -------------
echo ----- [multipart_form_data/5-echo-post-data.urlencoded-form] ---------
rem :: -------------
rem :: all "application/x-www-form-urlencoded" fields
set post_data="hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz"
rem :: -------------
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\5-echo-post-data.urlencoded-form.txt"

rem :: -------------
echo ----- [multipart_form_data/6-echo-post-data.multipart-form] ----------
rem :: -------------
rem :: re-POST the previous unmodified form fields using "multipart/form-data" encoding
call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\multipart_form_data\6-echo-post-data.multipart-form.txt" --header "Content-Type: multipart/form-data"

rem :: -------------
echo ----- [pipe/1-echo-post-data.multipart-form] -------------------------
rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (no filename, default mime)
set post_data="image={{@ -}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\1-echo-post-data.multipart-form.txt"

rem :: -------------
echo ----- [pipe/2-echo-post-data.multipart-form] -------------------------
rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, default mime)
set post_data="image={{@ - avatar.png}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\2-echo-post-data.multipart-form.txt"

rem :: -------------
echo ----- [pipe/3-echo-post-data.multipart-form] -------------------------
rem :: -------------
rem :: pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, explicit mime)
set post_data="image={{@ - avatar.png | image/awesome-png}}"
call nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | call nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data %post_data% -O "%workspace%\pipe\3-echo-post-data.multipart-form.txt"

rem :: -------------
echo ----- [pipe/4a-sha1-base64-actual] -----------------------------------
rem :: -------------
rem :: query github API for SHA hash of an arbitrary file in a repo
rem :: https://docs.github.com/en/rest/reference/repos#get-repository-content
call nget --url "https://api.github.com/repos/warren-bank/Android-WebMonkey/contents/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -U "nget" -O "-" | perl -pe "s/^.*\x22content\x22:\x22([^\x22]+)\x22.*$/\1/; s/\\n//g" | openssl sha1 >"%workspace%\pipe\4a-sha1-base64-actual.txt"

rem :: -------------
echo ----- [pipe/4b-sha1-base64-piped] ------------------------------------
rem :: -------------
rem :: pipe: download same file and generate SHA hash to compare
call nget --url "https://github.com/warren-bank/Android-WebMonkey/raw/master/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -O "-" | openssl base64 -A | openssl sha1 >"%workspace%\pipe\4b-sha1-base64-piped.txt"

rem :: -------------
echo ----- [pipe/4c-sha1-base64-equality] ---------------------------------
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
echo ----- [pipe/5a-ascii_art] --------------------------------------------
rem :: ------------------
call nget --url %req1_url_image% -O "-" | call nget --url %req2_api_endpoint% --method POST --post-data %req2_api_postdata% -O "-" >"%workspace%\pipe\5a-ascii_art.json"
rem :: ------------------
echo ----- [pipe/5b-ascii_art] --------------------------------------------
rem :: ------------------
call node -e "let ascii_art = require(process.env.workspace + '/pipe/5a-ascii_art.json'); ascii_art = ascii_art.contents.textart; ascii_art = atob(ascii_art); console.log(ascii_art)" >"%workspace%\pipe\5b-ascii_art.html"

rem :: ------------------
echo ----- [mirror/hexdocs.pm] --------------------------------------------
rem :: ------------------
rem :: mirror a website: (830 KB, 47 files)
call nget -P "%workspace%\mirror" --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" -np -S >"%workspace%\mirror\hexdocs.pm.log" 2>&1

rem :: ------------------
echo ----- [mirror-misc-1/hexdocs.pm] -------------------------------------
rem :: ------------------
rem :: mirror a website: (830 KB, 47 files)
rem :: w/ misc options
set opts=--include-directory "/crawler/1.1.2" --no-host-directories --cut-dirs 2
call nget -P "%workspace%\mirror-misc-1" --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" %opts% -S >"%workspace%\mirror-misc-1\hexdocs.pm.log" 2>&1

rem :: ------------------
echo ----- [mirror-wait/hexdocs.pm] ---------------------------------------
rem :: ------------------
rem :: mirror a website: (830 KB, 47 files)
rem :: wait a random duration within the range of 2.5 to 7.5 seconds between each file download during the crawl
call nget -P "%workspace%\mirror-wait" --wait 5 --random-wait --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" -np -S >"%workspace%\mirror-wait\hexdocs.pm.log" 2>&1

rem :: ------------------
rem :: using:
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/hello-world/hello-world.php
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L114
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L23
rem ::   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L253

rem :: ------------------
echo ----- [mirror-redirect-paths] ----------------------------------------
rem :: ------------------
rem :: mirror a single webpage w/o any links.
rem :: its URL follows 1x redirect.
rem :: the filepath written to disk uses pathname after redirect.
call nget -P "%workspace%\mirror-redirect-paths" --mirror --url "http://localhost/IGNORE_EXPLICIT/cgi-bin/hello-world/hello-world.php" --save-headers -S >"%workspace%\mirror-redirect-paths\log.txt" 2>&1

rem :: ------------------
echo ----- [mirror-original-paths] ----------------------------------------
rem :: ------------------
rem :: mirror a single webpage w/o any links.
rem :: its URL follows 1x redirect.
rem :: the filepath written to disk uses pathname before redirect.
call nget -P "%workspace%\mirror-original-paths" -r -l 0 -E -k --url "http://localhost/IGNORE_EXPLICIT/cgi-bin/hello-world/hello-world.php" --save-headers -S >"%workspace%\mirror-original-paths\log.txt" 2>&1

rem :: ------------------
rem :: using:
rem ::   http://test.greenbytes.de/tech/tc2231/#attwithutf8fnplain

rem :: ------------------
echo ----- [content-disposition] ------------------------------------------
rem :: ------------------
rem :: download a single file with a content-disposition header.
rem :: the suggested filename contains restricted characters that need to be escaped.
call nget -P "%workspace%\content-disposition" --content-disposition --restrict-file-names "windows" --restrict-file-names "ascii" --url "http://test.greenbytes.de/tech/tc2231/attwithutf8fnplain.asis" --save-headers -S >"%workspace%\content-disposition\log.txt" 2>&1

rem :: ------------------
echo ----- [page-requisites-1-same-host] ----------------------------------
rem :: ------------------
rem :: download a single webpage with all of its assets (ie: non-html links) from the same host
call nget -P "%workspace%\page-requisites-1-same-host" --page-requisites --url "https://hexdocs.pm/crawler/1.1.2/readme.html" -S >"%workspace%\page-requisites-1-same-host\hexdocs.pm.log" 2>&1

rem :: ------------------
echo ----- [page-requisites-2-all-hosts] ----------------------------------
rem :: ------------------
rem :: download a single webpage with all of its assets (ie: non-html links) from all hosts
call nget -P "%workspace%\page-requisites-2-all-hosts" -sH --page-requisites --url "https://hexdocs.pm/crawler/1.1.2/readme.html" -S >"%workspace%\page-requisites-2-all-hosts\hexdocs.pm.log" 2>&1

rem :: ------------------
rem :: using:
rem ::   https://getflix.zendesk.com/hc/en-gb/search?query=proxy&commit=Search
rem ::   https://getflix.zendesk.com/hc/en-gb/articles/115000687823-Firefox-Squid3-Proxy-Settings
rem ::     Firefox instructions use port: 3128 (http)
rem ::   https://getflix.zendesk.com/hc/en-gb/articles/115000659386-Vuze-Socks5-Proxy-Settings
rem ::     Vuze instructions use port: 1080 (socks5)
rem ::
rem ::   https://getflix.zendesk.com/hc/en-gb/articles/204476204-Full-VPN-Server-Locations-and-Addresses
rem ::     list of all servers

rem :: ------------------
rem :: configs:
rem :: ------------------
if not defined HOME set HOME=C:
call "%HOME%\getflix_account.bat"
rem :: ------------------
set getflix_server=us-dl2.serverlocation.co
set getflix_username=%GETFLIX_USERNAME%
set getflix_password=%GETFLIX_PASSWORD%
rem :: ------------------
set getflix_protocol=http
set getflix_port=3128
set getflix_url_http="%getflix_protocol%://%getflix_username%:%getflix_password%@%getflix_server%:%getflix_port%"
rem :: ------------------
set getflix_protocol=socks5
set getflix_port=1080
set getflix_url_socks5="%getflix_protocol%://%getflix_username%:%getflix_password%@%getflix_server%:%getflix_port%"

rem :: ------------------
echo ----- [proxy] --------------------------------------------------------
rem :: ------------------
rem :: display IP and geo-location of proxied request as observed by the destination server
call nget --proxy %getflix_url_http%   --url "http://ipv4.ipleak.net/json/" -O "-" >"%workspace%\proxy\http.json"   2>&1
call nget --proxy %getflix_url_socks5% --url "http://ipv4.ipleak.net/json/" -O "-" >"%workspace%\proxy\socks5.json" 2>&1

rem :: ------------------
rem :: using:
rem ::   https://archive.org/details/BigBuckBunny_124
set video_url="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4"

rem :: ------------------
echo ----- [concurrency baseline w/ only 1x thread] -----------------------
rem :: ------------------
rem :: download a single large file in a single request using only 1x thread
set threads=1
set STARTTIME=%TIME%
call nget --max-concurrency %threads% --chunk-size 10 --url %video_url% -O "%workspace%\concurrency\video.mp4" -S >"%workspace%\concurrency\%threads%x-threads.log" 2>&1
set ENDTIME=%TIME%
call "%DIR%\.etc\calculate_elapsed_time.bat"
set elapsed_msg=Time to perform download: %DURATION%
echo %elapsed_msg%
echo.>>"%workspace%\concurrency\%threads%x-threads.log"
echo %elapsed_msg%>>"%workspace%\concurrency\%threads%x-threads.log"
del /Q /F "%workspace%\concurrency\video.mp4"

rem :: ------------------
echo ----- [concurrency w/ 2x threads] ------------------------------------
rem :: ------------------
rem :: download a single large file in 10MB chunks using 2x parallel threads
set threads=2
set STARTTIME=%TIME%
call nget --max-concurrency %threads% --chunk-size 10 --url %video_url% -O "%workspace%\concurrency\video.mp4" -S >"%workspace%\concurrency\%threads%x-threads.log" 2>&1
set ENDTIME=%TIME%
call "%DIR%\.etc\calculate_elapsed_time.bat"
set elapsed_msg=Time to perform download: %DURATION%
echo %elapsed_msg%
echo.>>"%workspace%\concurrency\%threads%x-threads.log"
echo %elapsed_msg%>>"%workspace%\concurrency\%threads%x-threads.log"
del /Q /F "%workspace%\concurrency\video.mp4"

rem :: ------------------
echo ----- [concurrency w/ 4x threads] ------------------------------------
rem :: ------------------
rem :: download a single large file in 10MB chunks using 4x parallel threads
set threads=4
set STARTTIME=%TIME%
call nget --max-concurrency %threads% --chunk-size 10 --url %video_url% -O "%workspace%\concurrency\video.mp4" -S >"%workspace%\concurrency\%threads%x-threads.log" 2>&1
set ENDTIME=%TIME%
call "%DIR%\.etc\calculate_elapsed_time.bat"
set elapsed_msg=Time to perform download: %DURATION%
echo %elapsed_msg%
echo.>>"%workspace%\concurrency\%threads%x-threads.log"
echo %elapsed_msg%>>"%workspace%\concurrency\%threads%x-threads.log"
del /Q /F "%workspace%\concurrency\video.mp4"

rem :: ------------------
echo ----- [concurrency w/ 8x threads] ------------------------------------
rem :: ------------------
rem :: download a single large file in 10MB chunks using 8x parallel threads
set threads=8
set STARTTIME=%TIME%
call nget --max-concurrency %threads% --chunk-size 10 --url %video_url% -O "%workspace%\concurrency\video.mp4" -S >"%workspace%\concurrency\%threads%x-threads.log" 2>&1
set ENDTIME=%TIME%
call "%DIR%\.etc\calculate_elapsed_time.bat"
set elapsed_msg=Time to perform download: %DURATION%
echo %elapsed_msg%
echo.>>"%workspace%\concurrency\%threads%x-threads.log"
echo %elapsed_msg%>>"%workspace%\concurrency\%threads%x-threads.log"
