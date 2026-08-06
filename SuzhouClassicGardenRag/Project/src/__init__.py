# 园林知识库 RAG 系统

import os
import sys

# 将 vendor 目录追加到 sys.path 末尾（优先级低于 conda site-packages）
_vendor_path = os.environ.get("VENDOR_PATH")
if _vendor_path and _vendor_path not in sys.path:
    sys.path.append(_vendor_path)
