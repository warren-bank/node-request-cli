#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export workspace="${DIR}/workspace"

if [ ! -d "$workspace" ];then
  mkdir "$workspace"
  cd "$workspace"

  npm init -y
  npm install --save "${DIR}/.."
  clear

  mkdir "${workspace}/continue"
else
  cd "$workspace"
fi

PATH="${workspace}/node_modules/.bin:${PATH}"

# ------------------
# PDF is 20MB
#
# To test --continue:
#  1. begin download
#  2. wait a few seconds, then kill the download (ex: close the terminal window)
#  3. repeat steps 1-2 several times, until download is complete
#
# Assertions and Post Conditions:
#  1. the filesize will grow with each run
#  2. once the download is complete, the filesize will remain constant
#  3. the resulting PDF file is not corrupt, and opens in a reader without error
#
# ------------------

PDF_URL='https://github.com/germanoa/compiladores/raw/master/doc/ebook/The C Programming Language - 2nd Edition - Ritchie Kernighan.pdf'
nget -c -O "${workspace}/continue/book.pdf" --url "$PDF_URL" -S >>"${workspace}/continue/book.log"
