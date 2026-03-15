#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

FILE_IN='1-run.sh'
FILE_OUT='runner.log'

source "${DIR}/${FILE_IN}" >"${DIR}/${FILE_OUT}" 2>&1
