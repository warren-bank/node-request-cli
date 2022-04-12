#!/usr/bin/env bash

export DURATION=''

secs_to_human() {
  DURATION="$(( ${1} / 3600 )) hr, $(( (${1} / 60) % 60 )) min, $(( ${1} % 60 )) sec"
}

if [ -n "$STARTTIME" -a -n "$ENDTIME" ]; then
  elapsed=$(( ENDTIME - STARTTIME ))
  secs_to_human "$elapsed"
else
  DURATION='UNDEFINED'
fi
