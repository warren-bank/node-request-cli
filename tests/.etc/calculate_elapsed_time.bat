@echo off

set should_pad_digits=0

rem :: https://stackoverflow.com/questions/9922498/calculate-time-difference-in-windows-batch-file
rem :: https://stackoverflow.com/a/17217171

if not defined STARTTIME goto :bad_input
if not defined ENDTIME   goto :bad_input

:calculate_interval

rem :: Change formatting for the start and end times
for /F "tokens=1-4 delims=:.," %%a in ("%STARTTIME%") do (
  set /A "start=(((%%a*60)+1%%b %% 100)*60+1%%c %% 100)*100+1%%d %% 100"
)

for /F "tokens=1-4 delims=:.," %%a in ("%ENDTIME%") do (
  IF %ENDTIME% GTR %STARTTIME% set /A "end=(((%%a*60)+1%%b %% 100)*60+1%%c %% 100)*100+1%%d %% 100"
  IF %ENDTIME% LSS %STARTTIME% set /A "end=((((%%a+24)*60)+1%%b %% 100)*60+1%%c %% 100)*100+1%%d %% 100"
)

rem :: Calculate the elapsed time by subtracting values
set /A elapsed=end-start

rem :: Format the results for output
set /A hh=elapsed/(60*60*100), rest=elapsed%%(60*60*100), mm=rest/(60*100), rest%%=60*100, ss=rest/100, cc=rest%%100

if "%should_pad_digits%"=="1" call :pad_digits
call :format_option_3
goto :done

:pad_digits
  rem :: Pad all values to include 2x digits
  if %hh% lss 10 set hh=0%hh%
  if %mm% lss 10 set mm=0%mm%
  if %ss% lss 10 set ss=0%ss%
  if %cc% lss 10 set cc=0%cc%
  goto :eof

:format_option_1
  set DURATION=%hh%:%mm%:%ss%,%cc%
  goto :eof

:format_option_2
  set DURATION=
  if %hh% gtr 00 set DURATION=%DURATION%%hh% hr, 
  if %mm% gtr 00 set DURATION=%DURATION%%mm% min, 
  set DURATION=%DURATION%%ss%.%cc% sec
  goto :eof

:format_option_3
  set DURATION=%hh% hr, %mm% min, %ss%.%cc% sec
  goto :eof

:bad_input
  set DURATION=UNDEFINED

:done
