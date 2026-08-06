#!/usr/bin/env bash
# ============================================================
# 园林知识库 RAG 系统 — 便捷启动脚本
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# --- 加载 .env 文件（如有） ---
if [ -f ".env" ]; then
    echo "[信息] 加载 .env 配置文件"
    set -a
    source ".env"
    set +a
fi

# --- 激活 conda 环境 ---
if command -v conda &>/dev/null; then
    eval "$(conda shell.bash hook)" 2>/dev/null || true
    conda activate MinerU 2>/dev/null || {
        echo "[错误] 无法激活 MinerU conda 环境，请确认环境存在。"
        exit 1
    }
else
    echo "[警告] 未找到 conda，将使用系统 Python。"
fi

# --- 设置 PYTHONPATH（vendor 兜底，优先用 conda 环境已有的包） ---
# 关键：将 vendor 放在末尾，让 conda 环境的 torch/transformers 等优先加载
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"
export VENDOR_PATH="$SCRIPT_DIR/vendor"
# 强制离线模式：模型已缓存到本地，无需联网下载
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1

# --- 显示帮助 ---
show_help() {
    echo "用法: ./run.sh <命令> [参数...]"
    echo ""
    echo "命令:"
    echo "  convert          转换 Resource/ 下新文档 (MinerU → Markdown)"
    echo "  convert --full   强制全量转换所有文档"
    echo "  index            索引 converted/ 下新文档 (BGE → Qdrant)"
    echo "  index --full     清空索引后全量重建"
    echo "  update           增量更新（转换 + 索引）"
    echo "  update --full    全量重建（转换 + 索引）"
    echo "  update --with-images  增量更新 + 图片索引"
    echo "  update --full --with-images  全量重建 + 图片索引"
    echo "  query \"问题\"      单次问答"
    echo "  query             进入交互式问答"
    echo "  query-image|qi 图片路径 \"问题\"  图片搜索"
    echo "  web              启动 Gradio Web 界面 (http://127.0.0.1:7860)"
  echo "  api [--reload]    启动 FastAPI REST API 服务器 (http://127.0.0.1:8000)"
  echo "  serve-frontend    启动前端静态服务器 (http://127.0.0.1:8088)"
    echo ""
    echo "首次使用:"
    echo "  1. export DEEPSEEK_API_KEY=你的API密钥"
    echo "  2. ./run.sh update --with-images  # 转换全部文档并建索引（含图片）"
    echo "  3. ./run.sh query           # 开始交互问答"
    echo "  4. ./run.sh web             # 启动 Web 界面"
    echo "  5. ./run.sh api             # 启动 REST API (前端页面使用)"
    echo "  6. ./run.sh serve-frontend  # 启动前端静态服务器 (http://127.0.0.1:8088)"
}

# --- 主入口 ---
case "${1:-}" in
    convert)
        shift
        python -m src.update --convert-only "$@"
        ;;
    index)
        shift
        python -m src.update --index-only "$@"
        ;;
    update)
        shift
        python -m src.update "$@"
        ;;
    query)
        shift
        python -m src.query "$@"
        ;;
    query-image|qi)
        shift
        # qi 图片路径 "问题"
        python -m src.query -i "$@"
        ;;
    web)
        python app.py
        ;;
    api)
        shift
        reload_flag=""
        port="8000"
        for arg in "$@"; do
            case "$arg" in
                --reload) reload_flag="--reload" ;;
                --port=*) port="${arg#*=}" ;;
                *) echo "[警告] 未知参数: $arg" ;;
            esac
        done
        # 确保 fastapi + uvicorn 可用
        if ! python -c "import fastapi" 2>/dev/null; then
            echo "[信息] 安装 fastapi + uvicorn..."
            pip install fastapi uvicorn -q
        elif ! python -c "import uvicorn" 2>/dev/null; then
            echo "[信息] 安装 uvicorn..."
            pip install uvicorn -q
        fi
        export API_PORT="$port"
        export API_RELOAD="$reload_flag"
        # 若未设置 DEEPSEEK_API_KEY，注入占位值以便 config 加载通过
        if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
            export DEEPSEEK_API_KEY="__missing__"
            echo "ℹ️  DEEPSEEK_API_KEY 未设置，LLM 生成不可用 (将降级为原文检索)"
        fi
        echo "🌿 启动 RAG API (端口 $port)..."
        python api_server.py
        ;;
    serve-frontend)
        echo "🌿 启动前端静态服务器 → http://127.0.0.1:8088"
        echo "   按 Ctrl+C 停止"
        cd "$SCRIPT_DIR/../../Owner_ClassicGarden"
        python3 -m http.server 8088
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
