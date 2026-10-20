"""Read-only, offline text retrieval for game research.

Run from the repository root with the project's MinerU environment:
    conda run -n MinerU python Game/tools/query_garden_rag.py "留园鹤所石林小院花窗"

This deliberately never calls DeepSeek or indexes documents. Results are leads,
not verified historical claims.
"""

from __future__ import annotations

import argparse
from contextlib import redirect_stdout
import json
import os
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="离线查询本地园林文字向量库（只返回片段与来源）")
    parser.add_argument("query", help="具体园林、院落、构件和空间关系")
    parser.add_argument("--max-chars", type=int, default=700, help="每条命中片段的最大字符数")
    args = parser.parse_args()
    if not args.query.strip() or args.max_chars < 100:
        parser.error("查询不可为空，--max-chars 不得小于 100")

    repo = Path(__file__).resolve().parents[2]
    project = repo / "SuzhouClassicGardenRag" / "Project"
    if not (project / "api_server.py").is_file():
        parser.error(f"找不到本地 RAG 项目：{project}")

    os.environ["DEEPSEEK_API_KEY"] = "__missing__"
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.chdir(project)  # RAG config.yaml uses paths relative to its project root.
    sys.path.insert(0, str(project))

    import api_server  # noqa: PLC0415 - import only after offline settings and path setup

    with redirect_stdout(sys.stderr):
        retriever = api_server._build_retriever()
    try:
        with redirect_stdout(sys.stderr):
            nodes = retriever.retrieve(args.query)
        payload = {
            "mode": "local_vector_retrieval_only",
            "collection": "garden_knowledge",
            "query": args.query,
            "results": [
                {
                    "rank": index,
                    "score": round(node.score or 0, 4),
                    "source": node.metadata.get("source", ""),
                    "excerpt": node.text[: args.max_chars],
                }
                for index, node in enumerate(nodes, 1)
            ],
            "warning": "向量分数只用于召回；原图、具体部位、年代和授权必须另行人工核查。",
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    finally:
        if api_server._qdrant_client is not None:
            api_server._qdrant_client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
