@echo off
REM Wrapper to run the one_click_runner PowerShell script for Windows
SET SCRIPT_PATH=C:\data\.openclaw\workspace\reports\moltbook\stripe\one_click_runner.ps1n
REM Ensure PowerShell executes the script with bypass policy
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" %*
