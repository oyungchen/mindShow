#!/bin/bash

# MindShow 服务管理脚本

APP_NAME="mindshow"
PID_FILE="/tmp/${APP_NAME}.pid"

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

do_start() {
    if is_running; then
        echo "MindShow 服务已在运行 (PID: $(get_pid))"
        return 1
    fi

    echo "=================================="
    echo "    MindShow 脑图服务启动器"
    echo "=================================="
    echo ""

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "错误: 未找到 Node.js"
        exit 1
    fi
    echo "Node.js 版本: $(node --version)"

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo "错误: 未找到 npm"
        exit 1
    fi
    echo "npm 版本: $(npm --version)"
    echo ""

    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "正在安装依赖..."
        npm install
        if [ $? -ne 0 ]; then
            echo "依赖安装失败"
            exit 1
        fi
        echo "依赖安装完成"
        echo ""
    fi

    # 创建数据目录
    mkdir -p data

    echo "正在启动 MindShow 服务..."
    echo "前端: http://localhost:5173"
    echo "后端: http://localhost:3000"
    echo ""

    # 启动服务
    npm run dev &

    # 保存 PID
    echo $! > "$PID_FILE"
    echo "服务已启动 (PID: $(get_pid))"
}

do_stop() {
    if ! is_running; then
        echo "MindShow 服务未运行"
        rm -f "$PID_FILE"
        return 0
    fi

    local pid=$(get_pid)
    echo "正在停止 MindShow 服务 (PID: $pid)..."

    # 杀掉开发服务器相关的进程
    pkill -f "vite" 2>/dev/null
    pkill -f "tsx watch src/index.ts" 2>/dev/null

    # 尝试优雅停止，如果失败则强制杀掉
    sleep 1
    if is_running; then
        kill -9 "$pid" 2>/dev/null
    fi

    rm -f "$PID_FILE"
    echo "服务已停止"
}

do_restart() {
    do_stop
    sleep 1
    do_start
}

case "${1:-start}" in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_restart
        ;;
    *)
        echo "用法: $0 {start|stop|restart}"
        exit 1
        ;;
esac
