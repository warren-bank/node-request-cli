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
