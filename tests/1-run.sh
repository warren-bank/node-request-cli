#!/usr/bin/env bash

# enable writing log statements in web crawler to stdout
export NODE_ENV='development'

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export workspace="${DIR}/workspace"

if [ ! -d "$workspace" ];then
  mkdir "$workspace"
  cd "$workspace"

  npm init -y
  npm install --save "${DIR}/.."
  clear

  mkdir "${workspace}/O"
  mkdir "${workspace}/P"
  mkdir "${workspace}/i_old"
  mkdir "${workspace}/i_new"
  mkdir "${workspace}/i_now"
  mkdir "${workspace}/cookies"
  mkdir "${workspace}/stream"
  mkdir "${workspace}/multipart_form_data"
  mkdir "${workspace}/pipe"
  mkdir "${workspace}/mirror"
  mkdir "${workspace}/mirror-misc-1"
  mkdir "${workspace}/mirror-wait"
  mkdir "${workspace}/mirror-redirect-paths"
  mkdir "${workspace}/mirror-original-paths"
  mkdir "${workspace}/content-disposition"
  mkdir "${workspace}/page-requisites-1-same-host"
  mkdir "${workspace}/page-requisites-2-all-hosts"
  mkdir "${workspace}/proxy"
else
  cd "$workspace"
fi

PATH="${workspace}/node_modules/.bin:${PATH}"

nget --help >'help.txt'

nget --url "https://github.com/warren-bank/node-request/archive/master.zip"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" --content-disposition
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -O "${workspace}/O/master.-O.zip"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/P"

# -------------
echo '----- [i_old] --------------------------------------------------------'
# -------------
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/i_old" -i "${DIR}/.etc/urls_old.txt"

# -------------
echo '----- [i_new] --------------------------------------------------------'
# -------------
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/i_new" -i "${DIR}/.etc/urls_new.txt"

# -------------
echo '----- [i_now] --------------------------------------------------------'
# -------------
nget                                                                        -P "${workspace}/i_now" -i "${DIR}/.etc/urls_now.txt" --mc 5
node "${DIR}/.etc/urls_now.js" "${workspace}/i_now" >"${workspace}/i_now/summary.json"

# -------------
echo '----- [cookies/1-set] ------------------------------------------------'
# -------------
nget --url "https://httpbin.org/cookies/set/foo/bar" --load-cookies "${workspace}/cookies/cookie.json" -O "${workspace}/cookies/1-set.txt" --save-headers --no-follow-redirect --no-validate-status-code

# -------------
echo '----- [cookies/2-get] ------------------------------------------------'
# -------------
nget --url "https://httpbin.org/cookies"             --load-cookies "${workspace}/cookies/cookie.json" -O "${workspace}/cookies/2-get.txt"

# -------------
echo '----- [cookies/cookie.convert-1] -------------------------------------'
# -------------
nget-convert-cookiefile --json-to-text --in "${workspace}/cookies/cookie.json"          --out "${workspace}/cookies/cookie.convert-1.txt"

# -------------
echo '----- [cookies/cookie.convert-2] -------------------------------------'
# -------------
nget-convert-cookiefile --text-to-json --in "${workspace}/cookies/cookie.convert-1.txt" --out "${workspace}/cookies/cookie.convert-2.json"

# -------------
echo '----- [stream/1] -----------------------------------------------------'
# -------------
nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "${workspace}/stream/1-package.json"       --post-file      "${workspace}/package.json"

# -------------
echo '----- [stream/2] -----------------------------------------------------'
# -------------
nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "${workspace}/stream/2-package-stdin.json" --post-file "-" <"${workspace}/package.json"

# -------------
echo '----- [stream/3] -----------------------------------------------------'
# -------------
nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "-"                                        --post-file "-" <"${workspace}/package.json" >"${workspace}/stream/3-package-stdout.json"

# -------------
echo '----- [multipart_form_data/1-post-data] ------------------------------'
# -------------
node -e 'const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent("value to urldecode")} }}&binary_stdin={{@ -}}&binary_file={{@ package.json}}`; const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/1-post-data.json"

# -------------
echo '----- [multipart_form_data/2-post-data] ------------------------------'
# -------------
node -e 'const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent("value to urldecode")} }}`;                                                     const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/2-post-data.json"

# -------------
echo '----- [multipart_form_data/3-post-data] ------------------------------'
# -------------
node -e 'const post_data = `text_encoded={{btoa value to b64encode}}&text_decoded={{atob ${              btoa("value to b64decode")} }}`;                                                     const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_argv/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/3-post-data.json"

# -------------
# using:
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/echo-post-data/echo-post-data.pl
# -------------

# -------------
echo '----- [multipart_form_data/4-echo-post-data.multipart-form] ----------'
# -------------
# absolute path to file piped to stdin stream
path_abs="${workspace}/../../.gitignore"
# -------------
# all "multipart/form-data" fields
post_data='hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz&file1={{@ -}}&files2={{@ ../../.gitignore}}&files2={{@ package.json}}'
# -------------
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/4-echo-post-data.multipart-form.txt" <"$path_abs"

# -------------
echo '----- [multipart_form_data/5-echo-post-data.urlencoded-form] ---------'
# -------------
# all "application/x-www-form-urlencoded" fields
post_data='hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz'
# -------------
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/5-echo-post-data.urlencoded-form.txt"

# -------------
echo '----- [multipart_form_data/6-echo-post-data.multipart-form] ----------'
# -------------
# re-POST the previous unmodified form fields using "multipart/form-data" encoding
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/6-echo-post-data.multipart-form.txt" --header "Content-Type: multipart/form-data"

# -------------
echo '----- [pipe/1-echo-post-data.multipart-form] -------------------------'
# -------------
# pipe: request 1 downloads image, request 2 uploads image to echo server (no filename, default mime)
post_data='image={{@ -}}'
nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/pipe/1-echo-post-data.multipart-form.txt"

# -------------
echo '----- [pipe/2-echo-post-data.multipart-form] -------------------------'
# -------------
# pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, default mime)
post_data='image={{@ - avatar.png}}'
nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/pipe/2-echo-post-data.multipart-form.txt"

# -------------
echo '----- [pipe/3-echo-post-data.multipart-form] -------------------------'
# -------------
# pipe: request 1 downloads image, request 2 uploads image to echo server (explicit filename, explicit mime)
post_data='image={{@ - avatar.png | image/awesome-png}}'
nget --url "https://avatars.githubusercontent.com/u/6810270" -O "-" | nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/pipe/3-echo-post-data.multipart-form.txt"

# -------------
echo '----- [pipe/4a-sha1-base64-actual] -----------------------------------'
# -------------
# query github API for SHA hash of an arbitrary file in a repo
# https://docs.github.com/en/rest/reference/repos#get-repository-content
nget --url "https://api.github.com/repos/warren-bank/Android-WebMonkey/contents/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -U "nget" -O "-" | perl -pe 's/^.*\x22content\x22:\x22([^\x22]+)\x22.*$/\1/; s/\\n//g' | openssl sha1 >"${workspace}/pipe/4a-sha1-base64-actual.txt"

# -------------
echo '----- [pipe/4b-sha1-base64-piped] ------------------------------------'
# -------------
# pipe: download same file and generate SHA hash to compare
nget --url "https://github.com/warren-bank/Android-WebMonkey/raw/master/android-studio-project/WebMonkey/src/main/res/drawable/launcher.png" -O "-" | openssl base64 -A | openssl sha1 >"${workspace}/pipe/4b-sha1-base64-piped.txt"

# -------------
echo '----- [pipe/4c-sha1-base64-equality] ---------------------------------'
# -------------
# perform bitwise comparison
diff -s "${workspace}/pipe/4a-sha1-base64-actual.txt" "${workspace}/pipe/4b-sha1-base64-piped.txt" >"${workspace}/pipe/4c-sha1-base64-equality.txt"

# ------------------
# request 1:
req1_url_image='https://avatars.githubusercontent.com/u/6810270'
# ------------------
# request 2:
# [API] https://textart.io/api/img2txt
req2_api_endpoint='http://api.textart.io/img2txt'
req2_api_postdata='image={{@ - avatar.png}}&format=color&encode=true'
# ------------------
echo '----- [pipe/5a-ascii_art] --------------------------------------------'
# ------------------
nget --url "$req1_url_image" -O '-' | nget --url "$req2_api_endpoint" --method POST --post-data "$req2_api_postdata" -O '-' >"${workspace}/pipe/5a-ascii_art.json"
# ------------------
echo '----- [pipe/5b-ascii_art] --------------------------------------------'
# ------------------
node -e 'let ascii_art = require(process.env.workspace + "/pipe/5a-ascii_art.json"); ascii_art = ascii_art.contents.textart; ascii_art = atob(ascii_art); console.log(ascii_art)' >"${workspace}/pipe/5b-ascii_art.html"

# ------------------
echo '----- [mirror/hexdocs.pm] --------------------------------------------'
# ------------------
# mirror a website: (830 KB, 47 files)
nget -P "${workspace}/mirror" --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" -np -S >"${workspace}/mirror/hexdocs.pm.log" 2>&1

# ------------------
echo '----- [mirror-misc-1/hexdocs.pm] -------------------------------------'
# ------------------
# mirror a website: (830 KB, 47 files)
# w/ misc options
nget -P "${workspace}/mirror-misc-1" --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" --include-directory "/crawler/1.1.2" --no-host-directories --cut-dirs 2 -S >"${workspace}/mirror-misc-1/hexdocs.pm.log" 2>&1

# ------------------
echo '----- [mirror-wait/hexdocs.pm] ---------------------------------------'
# ------------------
# mirror a website: (830 KB, 47 files)
# wait a random duration within the range of 2.5 to 7.5 seconds between each file download during the crawl
nget -P "${workspace}/mirror-wait" --wait 5 --random-wait --mirror --url "https://hexdocs.pm/crawler/1.1.2/api-reference.html" -np -S >"${workspace}/mirror-wait/hexdocs.pm.log" 2>&1

# ------------------
# using:
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/hello-world/hello-world.php
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L114
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L23
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/bin/http/httpd.json#L253

# ------------------
echo '----- [mirror-redirect-paths] ----------------------------------------'
# ------------------
# mirror a single webpage w/o any links.
# its URL follows 1x redirect.
# the filepath written to disk uses pathname after redirect.
nget -P "${workspace}/mirror-redirect-paths" --mirror --url "http://localhost/IGNORE_EXPLICIT/cgi-bin/hello-world/hello-world.php" --save-headers -S >"${workspace}/mirror-redirect-paths/log.txt" 2>&1

# ------------------
echo '----- [mirror-original-paths] ----------------------------------------'
# ------------------
# mirror a single webpage w/o any links.
# its URL follows 1x redirect.
# the filepath written to disk uses pathname before redirect.
nget -P "${workspace}/mirror-original-paths" -r -l 0 -E -k --url "http://localhost/IGNORE_EXPLICIT/cgi-bin/hello-world/hello-world.php" --save-headers -S >"${workspace}/mirror-original-paths/log.txt" 2>&1

# ------------------
# using:
#   http://test.greenbytes.de/tech/tc2231/#attwithutf8fnplain

# ------------------
echo '----- [content-disposition] ------------------------------------------'
# ------------------
# download a single file with a content-disposition header.
# the suggested filename contains restricted characters that need to be escaped.
nget -P "${workspace}/content-disposition" --content-disposition --restrict-file-names "windows" --restrict-file-names "ascii" --url "http://test.greenbytes.de/tech/tc2231/attwithutf8fnplain.asis" --save-headers -S >"${workspace}/content-disposition/log.txt" 2>&1

# ------------------
echo '----- [page-requisites-1-same-host] ----------------------------------'
# ------------------
# download a single webpage with all of its assets (ie: non-html links) from the same host
nget -P "${workspace}/page-requisites-1-same-host" --page-requisites --url "https://hexdocs.pm/crawler/1.1.2/readme.html" -S >"${workspace}/page-requisites-1-same-host/hexdocs.pm.log" 2>&1

# ------------------
echo '----- [page-requisites-2-all-hosts] ----------------------------------'
# ------------------
# download a single webpage with all of its assets (ie: non-html links) from all hosts
nget -P "${workspace}/page-requisites-2-all-hosts" -sH --page-requisites --url "https://hexdocs.pm/crawler/1.1.2/readme.html" -S >"${workspace}/page-requisites-2-all-hosts/hexdocs.pm.log" 2>&1

# ------------------
# using:
#   https://getflix.zendesk.com/hc/en-gb/search?query=proxy&commit=Search
#   https://getflix.zendesk.com/hc/en-gb/articles/115000687823-Firefox-Squid3-Proxy-Settings
#     Firefox instructions use port: 3128 (http)
#   https://getflix.zendesk.com/hc/en-gb/articles/115000659386-Vuze-Socks5-Proxy-Settings
#     Vuze instructions use port: 1080 (socks5)
#
#   https://getflix.zendesk.com/hc/en-gb/articles/204476204-Full-VPN-Server-Locations-and-Addresses
#     list of all servers

# ------------------
# configs:
# ------------------
[ -z "$HOME" ] && HOME='/c'
source "${HOME}/getflix_account.sh"
# ------------------
getflix_server='us-dl2.serverlocation.co'
getflix_username="$GETFLIX_USERNAME"
getflix_password="$GETFLIX_PASSWORD"
# ------------------
getflix_protocol='http'
getflix_port='3128'
getflix_url_http="${getflix_protocol}://${getflix_username}:${getflix_password}@${getflix_server}:${getflix_port}"
# ------------------
getflix_protocol='socks5'
getflix_port='1080'
getflix_url_socks5="${getflix_protocol}://${getflix_username}:${getflix_password}@${getflix_server}:${getflix_port}"

# ------------------
echo '----- [proxy] --------------------------------------------------------'
# ------------------
# display IP and geo-location of proxied request as observed by the destination server
nget --proxy "$getflix_url_http"   --url "http://ipv4.ipleak.net/json/" -O "-" >"${workspace}/proxy/http.json"   2>&1
nget --proxy "$getflix_url_socks5" --url "http://ipv4.ipleak.net/json/" -O "-" >"${workspace}/proxy/socks5.json" 2>&1
