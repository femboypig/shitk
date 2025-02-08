@echo off
REM Добавляем изменения
git add .

REM Запрашиваем сообщение коммита
set /p commit_msg="Enter commit message: "

REM Создаем коммит с введенным сообщением
git commit -m "%commit_msg%"

REM Пушим изменения
git push
