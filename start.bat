@echo off
REM MindShow 快速启动脚本 (Windows)

chcp 65001 >nul
echo ==================================
echo     MindShow 脑图服务启动器
echo ==================================
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version

REM 检查 npm 是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

echo ✅ npm 版本:
npm --version
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

REM 创建数据目录（如果不存在）
if not exist "data" mkdir data

echo 🚀 正在启动 MindShow 服务...
echo.
echo 📖 使用说明:
echo    - 前端将在 Vite 开发服务器运行
echo    - 后端 API 将在 http://localhost:3000 运行
echo    - 按 Ctrl+C 停止服务
echo.
echo ==================================
echo.

REM 启动开发服务
call npm run dev

pause
