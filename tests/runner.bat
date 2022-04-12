@echo off

call "%~dp0.\1-run.bat" >"%~dpn0.log" 2>&1
