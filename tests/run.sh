#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
workspace="${DIR}/workspace"

[ -d "$workspace" ] && rm -rf "$workspace"
mkdir "$workspace"
cd "$workspace"

npm init -y
npm install --save "${DIR}/.."
clear

PATH="${workspace}/node_modules/.bin:${PATH}"

mkdir "${workspace}/O"
mkdir "${workspace}/P"
mkdir "${workspace}/i_old"
mkdir "${workspace}/i_new"
mkdir "${workspace}/i_now"
mkdir "${workspace}/cookies"
mkdir "${workspace}/stream"
mkdir "${workspace}/multipart_form_data"

nget --help >'help.txt'

nget --url "https://github.com/warren-bank/node-request/archive/master.zip"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" --content-disposition
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -O "${workspace}/O/master.-O.zip"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/P"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/i_old" -i "${DIR}/.etc/urls_old.txt"
nget --url "https://github.com/warren-bank/node-request/archive/master.zip" -P "${workspace}/i_new" -i "${DIR}/.etc/urls_new.txt"
nget                                                                        -P "${workspace}/i_now" -i "${DIR}/.etc/urls_now.txt" --mc 5
node "${DIR}/.etc/urls_now.js" "${workspace}/i_now" >"${workspace}/i_now/summary.json"

nget --url "https://httpbin.org/cookies/set/foo/bar" --load-cookies "${workspace}/cookies/cookie.json" -O "${workspace}/cookies/1-set.txt" --save-headers --no-follow-redirect --no-validate-status-code
nget --url "https://httpbin.org/cookies"             --load-cookies "${workspace}/cookies/cookie.json" -O "${workspace}/cookies/2-get.txt"

nget-convert-cookiefile --json-to-text --in "${workspace}/cookies/cookie.json"          --out "${workspace}/cookies/cookie.convert-1.txt"
nget-convert-cookiefile --text-to-json --in "${workspace}/cookies/cookie.convert-1.txt" --out "${workspace}/cookies/cookie.convert-2.json"

nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "${workspace}/stream/1-package.json"       --post-file      "${workspace}/package.json"
nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "${workspace}/stream/2-package-stdin.json" --post-file "-" <"${workspace}/package.json"
nget --url "https://httpbin.org/post" --method "POST" --header "content-type: application/json" -O "-"                                        --post-file "-" <"${workspace}/package.json" >"${workspace}/stream/3-package-stdout.json"

node -e 'const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent("value to urldecode")} }}&binary_stdin={{@ -}}&binary_file={{@ package.json}}`; const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/1-post-data.json"
node -e 'const post_data = `text_encoded={{+    value to urlencode}}&text_decoded={{-    ${encodeURIComponent("value to urldecode")} }}`;                                                     const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/2-post-data.json"
node -e 'const post_data = `text_encoded={{btoa value to b64encode}}&text_decoded={{atob ${              btoa("value to b64decode")} }}`;                                                     const process_post_data = require("@warren-bank/node-request-cli/bin/nget/process_post_data"); console.log(process_post_data(post_data))' >"${workspace}/multipart_form_data/3-post-data.json"

# -------------
# using:
#   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/echo-post-data/echo-post-data.pl
# -------------

# absolute path to file piped to stdin stream
path_abs="${workspace}/../../.gitignore"
# -------------
# all "multipart/form-data" fields
post_data='hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz&file1={{@ -}}&files2={{@ ../../.gitignore}}&files2={{@ package.json}}'
# -------------
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/4-echo-post-data.multipart-form.json" <"$path_abs"

# -------------
# all "application/x-www-form-urlencoded" fields
post_data='hidden1={{+ Hello, World!}}&select1=Foo&select1=Bar&select1=Baz&radio1=Foo&checkbox1=Foo&checkbox1=Bar&checkbox1=Baz'
# -------------
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/5-echo-post-data.urlencoded-form.json"

# -------------
# re-POST the previous unmodified form fields using "multipart/form-data" encoding
nget --url "http://localhost/cgi-bin/echo-post-data/echo-post-data.pl" --method "POST" --post-data "$post_data" -O "${workspace}/multipart_form_data/6-echo-post-data.multipart-form.json" --header "Content-Type: multipart/form-data"
