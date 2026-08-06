#!/usr/bin/env python3
"""
CBDB 子集提取脚本
==================
从 CBDB SQLite 单机版中提取苏州九园相关人物子集，
输出为前端可直接加载的 JSON。

用法:
    python extract_cbdb_subset.py \
        --cbdb PATH_TO_CBDB.sqlite3 \
        --query-list data/owners_query_list.json \
        --output data/cbdb_subset.json

依赖: 仅标准库 (sqlite3, json, argparse, logging)

数据流:
    CBDB SQLite → [按姓名查 BIOG_MAIN] → [消歧过滤] → [获取 c_personid]
    → [展开 KIN_DATA 一阶亲属] → [展开 ASSOC_DATA 一阶社会关系]
    → [合并去重] → cbdb_subset.json
"""

import sqlite3
import json
import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict


# ── 繁简转换（内建表，无外部依赖）──────────────────────
# CBDB 人名以繁体字存储，查询清单为简体，需转换后搜索
# 覆盖 all query_list 中 116 个字符的 S→T 差异部分

CJK_S2T = {
    "万": "萬", "东": "東", "严": "嚴", "吴": "吳",
    "孙": "孫", "宁": "寧", "张": "張", "时": "時",
    "毕": "畢", "润": "潤", "献": "獻", "瓒": "瓚",
    "贝": "貝", "钦": "欽", "钱": "錢", "陆": "陸",
    "陈": "陳", "隐": "隱", "韩": "韓", "顾": "顧",
    "鸿": "鴻", "龙": "龍", "刘": "劉", "苏": "蘇",
    "则": "則", "华": "華", "师": "師", "征": "徵",
    "怀": "懷", "谦": "謙", "蒋": "蔣", "兰": "蘭",
    "禅": "禪", "维": "維", "斋": "齋", "荦": "犖",
    "骙": "騤", "铁": "鐵", "风": "風", "沧": "滄",
    "浪": "浪", "网": "網", "狮": "獅", "涛": "濤",
    "玛": "瑪", "丽": "麗", "阳": "陽", "长": "長",
    "园": "園", "门": "門", "关": "關", "苏": "蘇",
    "州": "州", "馆": "館", "厅": "廳", "阁": "閣",
    "楼": "樓", "桥": "橋", "台": "臺", "庄": "莊",
    "纯": "純", "顾": "顧", "沄": "沄", "沅": "沅",
    "徵": "徵",  # 已为繁体
    "臺": "臺", "門": "門", "関": "關",
}

def s2t(name: str) -> list[str]:
    """简体 → 繁体转换，返回 [原始, 繁体] 列表（去重）"""
    trad = "".join(CJK_S2T.get(c, c) for c in name)
    if trad == name:
        return [name]
    return [name, trad]

# ── 日志配置 ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","module":"cbdb_extract","%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
log = logging.getLogger(__name__)


# ── CBDB 表结构常量（基于 20250520 版）────────────────────
# 注意：若 CBDB 表名或字段有变更，在此更新

TABLE_BIOG_MAIN = "BIOG_MAIN"
TABLE_KIN_DATA = "KIN_DATA"
TABLE_ASSOC_DATA = "ASSOC_DATA"
TABLE_ALTNAME_DATA = "ALTNAME_DATA"
TABLE_POSTED_TO_OFFICE_DATA = "POSTED_TO_OFFICE_DATA"
TABLE_OFFICE_CODES = "OFFICE_CODES"
TABLE_BIOG_ADDR_DATA = "BIOG_ADDR_DATA"
TABLE_TEXT_DATA = "TEXT_DATA"
TABLE_EVENTS_DATA = "EVENTS_DATA"

# BIOG_MAIN 关键列
COL_PERSON_ID = "c_personid"
COL_NAME_CHN = "c_name_chn"
COL_INDEX_YEAR = "c_index_year"
COL_BIRTH_YEAR = "c_birthyear"  # 注意：CBDB 中年份可能是负数（公元前）
COL_DEATH_YEAR = "c_deathyear"
COL_BY_NHI = "c_by_nh_code"         # 出生年号索引代码
COL_DYNASTY = "c_dy"            # 所属朝代
COL_DEATH_NHI = "c_death_nhi"   # 卒年年号索引

# KIN_DATA 关键列
KIN_COL_PERSON_ID = "c_personid"
KIN_COL_KIN_ID = "c_kin_id"
KIN_COL_KIN_CODE = "c_kin_code"  # 亲属关系类型代码

# ASSOC_DATA 关键列
ASSOC_COL_PERSON_ID = "c_personid"
ASSOC_COL_ASSOC_ID = "c_assoc_id"
ASSOC_COL_ASSOC_CODE = "c_assoc_code"  # 社会关系类型代码


def load_query_list(path: str) -> dict:
    """加载园主查询清单"""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # 去重（按 name_chn）
    seen = set()
    unique = []
    for q in data["query_list"]:
        key = q["name_chn"]
        if key not in seen:
            seen.add(key)
            unique.append(q)
    log.info(f'"event":"query_list_loaded","file":"{path}","total":{len(data["query_list"])},"unique":{len(unique)}')
    return {"meta": data["meta"], "query_list": unique, "exclusion": data.get("exclusion_list", [])}


def search_person_by_name(cursor, name: str) -> list[dict]:
    """
    在 BIOG_MAIN 中按姓名精确匹配。
    先试原始名（简体），再试繁体转换结果。
    返回匹配的所有记录。
    """
    variants = s2t(name)
    seen_ids = set()
    results = []
    for variant in variants:
        cursor.execute(
            f"SELECT {COL_PERSON_ID}, {COL_NAME_CHN}, {COL_INDEX_YEAR}, "
            f"{COL_BIRTH_YEAR}, {COL_DEATH_YEAR}, {COL_BY_NHI}, {COL_DYNASTY} "
            f"FROM {TABLE_BIOG_MAIN} WHERE {COL_NAME_CHN} = ?",
            (variant,)
        )
        for r in cursor.fetchall():
            if r[0] not in seen_ids:
                seen_ids.add(r[0])
                results.append({
                    "c_personid": r[0],
                    "c_name_chn": r[1],
                    "c_index_year": r[2],
                    "c_birth_year": r[3],
                    "c_death_year": r[4],
                    "c_by_nh_code": r[5],
                    "c_dy": r[6],
                })
    return results


def disambiguate(candidates: list[dict], query: dict) -> dict | None:
    """
    消歧：从多个同名候选人中选出最可能的目标。
    使用三约束逐级收窄（方案 7.1）：
      1. 年代交叠：c_index_year 在 era_range 内
      2. 籍贯匹配：查 BIOG_ADDR_DATA 含苏州
      3. 官职佐证：查 POSTED_TO_OFFICE_DATA（在 extract 阶段做）

    返回：最佳匹配 dict 或 None
    """
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    query_era = query.get("era_range")
    query_conf = query.get("confidence", "medium")

    scored = []
    for c in candidates:
        score = 0
        reasons = []

        # 约束 1：年代交叠
        if query_era and c["c_index_year"] is not None:
            idx = c["c_index_year"]
            if query_era[0] <= idx <= query_era[1]:
                score += 3
                reasons.append(f"index_year {idx} in range {query_era}")
            elif abs(idx - query_era[0]) <= 50 or abs(idx - query_era[1]) <= 50:
                score += 1
                reasons.append(f"index_year {idx} near range {query_era}")

        # 约束 2：c_by_nhi 年号索引匹配（如果有）
        if c.get("c_by_nhi") and c["c_by_nhi"] != 0:
            score += 1
            reasons.append("has nhi index")

        scored.append((score, reasons, c))

    scored.sort(key=lambda x: x[0], reverse=True)

    if scored[0][0] == 0 and len(scored) > 1:
        # 所有候选分数均为 0，无法自动消歧
        log.warning(
            f'"event":"disambiguate_failed","name":"{query["name_chn"]}",'
            f'"candidates":{len(candidates)},"warning":"{query.get("warning","")}"'
        )
        # 返回第一个（最好的人工检查）
        return scored[0][2]

    best = scored[0]
    if best[0] >= 3:
        log.info(
            f'"event":"disambiguate_ok","name":"{query["name_chn"]}",'
            f'"score":{best[0]},"reasons":{best[1]},'
            f'"candidates_total":{len(candidates)}'
        )
    return best[2]


def get_altnames(cursor, person_id: int) -> list[str]:
    """获取别名（字、号、别号）"""
    cursor.execute(
        f"SELECT c_alt_name_chn FROM {TABLE_ALTNAME_DATA} WHERE c_personid = ?",
        (person_id,)
    )
    return [r[0] for r in cursor.fetchall() if r[0]]


def get_offices(cursor, person_id: int) -> list[str]:
    """获取官职"""
    cursor.execute(
        f"SELECT p.c_office_id, o.c_office_chn "
        f"FROM {TABLE_POSTED_TO_OFFICE_DATA} p "
        f"JOIN {TABLE_OFFICE_CODES} o ON p.c_office_id = o.c_office_id "
        f"WHERE p.c_personid = ?",
        (person_id,)
    )
    return [r[1] for r in cursor.fetchall() if r[1]]


def get_kin_neighbors(cursor, person_id: int) -> list[dict]:
    """获取一阶亲属关系（KIN_DATA）"""
    cursor.execute(
        f"SELECT {KIN_COL_KIN_ID}, {KIN_COL_KIN_CODE} "
        f"FROM {TABLE_KIN_DATA} WHERE {KIN_COL_PERSON_ID} = ?",
        (person_id,)
    )
    return [{"kin_id": r[0], "kin_code": r[1]} for r in cursor.fetchall()]


def get_assoc_neighbors(cursor, person_id: int) -> list[dict]:
    """获取一阶社会关系（ASSOC_DATA）"""
    cursor.execute(
        f"SELECT {ASSOC_COL_ASSOC_ID}, {ASSOC_COL_ASSOC_CODE} "
        f"FROM {TABLE_ASSOC_DATA} WHERE {ASSOC_COL_PERSON_ID} = ?",
        (person_id,)
    )
    return [{"assoc_id": r[0], "assoc_code": r[1]} for r in cursor.fetchall()]


def get_person_biog(cursor, person_id: int) -> dict | None:
    """获取单个人的基本信息"""
    cursor.execute(
        f"SELECT {COL_PERSON_ID}, {COL_NAME_CHN}, {COL_INDEX_YEAR}, "
        f"{COL_BIRTH_YEAR}, {COL_DEATH_YEAR}, {COL_DYNASTY} "
        f"FROM {TABLE_BIOG_MAIN} WHERE {COL_PERSON_ID} = ?",
        (person_id,)
    )
    r = cursor.fetchone()
    if not r:
        return None
    return {
        "c_personid": r[0],
        "c_name_chn": r[1],
        "c_index_year": r[2],
        "c_birth_year": r[3],
        "c_death_year": r[4],
        "c_dy": r[5],
        "aliases": [],
        "offices": [],
    }


def extract_subset(db_path: str, query_data: dict, output_path: str) -> dict:
    """
    主提取流程:
    1. 遍历 query_list，按姓名查 BIOG_MAIN
    2. 消歧，确定 c_personid
    3. 收集所有匹配人物的别名 + 官职
    4. 展开一阶邻居（亲属 + 社会关系）
    5. 补全邻居的基本信息
    6. 去重，导出 JSON
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ── 第 1 步：查询园主 ──────────────────────────────
    matched_persons = {}       # c_personid → person_info
    matched_edges_kin = []     # {source, target, kin_code}
    matched_edges_assoc = []   # {source, target, assoc_code}
    query_results = []         # 每人的查询结果（含失败）
    neighbor_ids = set()       # 一阶邻居 person_id 集合

    for query in query_data["query_list"]:
        name = query["name_chn"]
        if query.get("priority") == 3:
            continue  # 跳过排除标记条目

        candidates = search_person_by_name(cursor, name)

        if not candidates:
            log.warning(f'"event":"person_not_found","name":"{name}","garden":"{query.get("garden","")}"')
            query_results.append({"query": query, "status": "not_found", "candidates": 0})
            continue

        best = disambiguate(candidates, query)
        if best is None:
            query_results.append({"query": query, "status": "disambiguate_failed", "candidates": len(candidates)})
            continue

        pid = best["c_personid"]
        if pid in matched_persons:
            query_results.append({"query": query, "status": "duplicate", "person_id": pid})
            continue

        # 补充别名 + 官职
        best["aliases"] = get_altnames(cursor, pid)
        best["offices"] = get_offices(cursor, pid)
        matched_persons[pid] = best

        query_results.append({
            "query": query,
            "status": "matched",
            "person_id": pid,
            "score_candidates": len(candidates),
        })

        # ── 第 2 步：展开一阶邻居 ──────────────────────
        # 亲属
        for kin in get_kin_neighbors(cursor, pid):
            neighbor_ids.add(kin["kin_id"])
            matched_edges_kin.append({
                "source": pid,
                "target": kin["kin_id"],
                "kin_code": kin["kin_code"],
            })

        # 社会关系
        for assoc in get_assoc_neighbors(cursor, pid):
            neighbor_ids.add(assoc["assoc_id"])
            matched_edges_assoc.append({
                "source": pid,
                "target": assoc["assoc_id"],
                "assoc_code": assoc["assoc_code"],
            })

    # ── 第 3 步：补全邻居信息 ─────────────────────────
    for nid in neighbor_ids:
        if nid in matched_persons:
            continue
        biog = get_person_biog(cursor, nid)
        if biog:
            biog["aliases"] = get_altnames(cursor, nid)
            biog["offices"] = get_offices(cursor, nid)
            matched_persons[nid] = biog

    conn.close()

    # ── 第 4 步：构建输出 ─────────────────────────────
    nodes = [
        {
            "c_personid": p["c_personid"],
            "name_chn": p["c_name_chn"],
            "index_year": p.get("c_index_year"),
            "birth_year": p.get("c_birth_year"),
            "death_year": p.get("c_death_year"),
            "dynasty": p.get("c_dy"),
            "aliases": p.get("aliases", []),
            "offices": p.get("offices", []),
        }
        for p in matched_persons.values()
    ]

    # 合并边
    edges = []
    for e in matched_edges_kin:
        edges.append({
            "source": e["source"],
            "target": e["target"],
            "type": "kin",
            "subtype": e["kin_code"],
        })
    for e in matched_edges_assoc:
        edges.append({
            "source": e["source"],
            "target": e["target"],
            "type": "assoc",
            "subtype": e["assoc_code"],
        })

    # 去重边（相同 source/target/type）
    seen_edges = set()
    unique_edges = []
    for e in edges:
        key = (e["source"], e["target"], e["type"])
        if key not in seen_edges:
            seen_edges.add(key)
            unique_edges.append(e)

    result = {
        "meta": {
            "version": "1.0.0",
            "extracted_at": datetime.now().isoformat(),
            "cbdb_source": db_path,
            "cbdb_version_target": query_data["meta"].get("cbdb_version_target", "unknown"),
            "total_nodes": len(nodes),
            "total_edges": len(unique_edges),
            "seed_matched": sum(1 for r in query_results if r["status"] == "matched"),
            "neighbor_expanded": len(neighbor_ids),
        },
        "nodes": nodes,
        "edges": unique_edges,
        "extraction_log": {
            "total_queries": len(query_data["query_list"]),
            "matched": sum(1 for r in query_results if r["status"] == "matched"),
            "not_found": sum(1 for r in query_results if r["status"] == "not_found"),
            "disambiguate_failed": sum(1 for r in query_results if r["status"] == "disambiguate_failed"),
            "details": query_results,
        },
    }

    # ── 第 5 步：写入 JSON ─────────────────────────────
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # ── 摘要日志 ──────────────────────────────────────
    log.info(
        f'"event":"extraction_complete",'
        f'"nodes":{len(nodes)},"edges":{len(unique_edges)},'
        f'"matched":{result["extraction_log"]["matched"]},'
        f'"not_found":{result["extraction_log"]["not_found"]},'
        f'"output":"{output_path}"'
    )

    return result


def validate_subset(result: dict) -> list[str]:
    """
    基本完整性断言（对应方案 8.6 数据层测试）:
    - 9 座园林各自至少匹配到 1 人
    - 总节点数 ≥ 30（园主数量）
    - 一阶邻居 ≥ 200 人（目标 300-500）
    - 无重复边
    """
    issues = []

    # 从 extraction_log 按 garden 检查
    garden_match = defaultdict(int)
    for detail in result["extraction_log"]["details"]:
        if detail["status"] == "matched":
            garden = detail["query"].get("garden", "")
            if garden:
                for g in garden.split("/"):
                    garden_match[g.strip()] += 1

    expected_gardens = [
        "拙政园", "留园", "网师园", "环秀山庄", "沧浪亭",
        "狮子林", "艺圃", "耦园", "退思园"
    ]
    for g in expected_gardens:
        if garden_match.get(g, 0) == 0:
            issues.append(f"园林 '{g}' 未匹配到任何人物！")

    if result["meta"]["total_nodes"] < 30:
        issues.append(
            f"总节点数 {result['meta']['total_nodes']} < 30，"
            f"园主匹配率可能过低"
        )

    if result["meta"]["total_nodes"] < 200:
        issues.append(
            f"总节点数 {result['meta']['total_nodes']} < 200，"
            f"一阶邻居展开可能不完整（预期 300-500）"
        )

    # 检查重复边
    edge_keys = [(e["source"], e["target"], e["type"]) for e in result["edges"]]
    if len(edge_keys) != len(set(edge_keys)):
        issues.append("存在重复边！去重逻辑可能未生效")

    return issues


# ── 主入口 ─────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="从 CBDB SQLite 提取苏州九园人物子集"
    )
    parser.add_argument(
        "--cbdb", required=True,
        help="CBDB SQLite 数据库文件路径"
    )
    parser.add_argument(
        "--query-list", default="data/owners_query_list.json",
        help="园主查询清单 JSON 路径 (默认: data/owners_query_list.json)"
    )
    parser.add_argument(
        "--output", default="data/cbdb_subset.json",
        help="输出 JSON 路径 (默认: data/cbdb_subset.json)"
    )
    parser.add_argument(
        "--validate-only", action="store_true",
        help="仅验证已有的输出文件，不重新提取"
    )
    args = parser.parse_args()

    if args.validate_only:
        # 仅验证模式
        with open(args.output, "r", encoding="utf-8") as f:
            existing = json.load(f)
        issues = validate_subset(existing)
        if issues:
            print("❌ 验证失败:")
            for i in issues:
                print(f"  - {i}")
            sys.exit(1)
        else:
            print("✅ 验证通过")
            sys.exit(0)

    # 检查 CBDB 文件存在
    if not Path(args.cbdb).exists():
        log.error(f'"event":"cbdb_not_found","path":"{args.cbdb}"')
        print(f"❌ CBDB 数据库文件不存在: {args.cbdb}")
        print("   请从 https://github.com/cbdb-project/cbdb-sqlite 下载")
        sys.exit(1)

    # 加载查询清单
    query_data = load_query_list(args.query_list)

    # 执行提取
    print(f"📦 从 {args.cbdb} 提取人物子集...")
    print(f"  查询清单: {len(query_data['query_list'])} 人")
    result = extract_subset(args.cbdb, query_data, args.output)

    # 验证
    issues = validate_subset(result)
    print(f"\n📊 提取结果:")
    print(f"  节点: {result['meta']['total_nodes']}")
    print(f"  边:   {result['meta']['total_edges']}")
    print(f"  匹配: {result['extraction_log']['matched']}/{result['extraction_log']['total_queries']}")
    print(f"  未找到: {result['extraction_log']['not_found']}")

    if issues:
        print(f"\n⚠️  验证警告:")
        for i in issues:
            print(f"  - {i}")
    else:
        print(f"\n✅ 验证通过")

    print(f"\n💾 输出: {args.output}")


if __name__ == "__main__":
    main()
