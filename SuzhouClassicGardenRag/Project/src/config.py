"""
配置加载模块 —— 从 config.yaml 读取配置，支持环境变量替换。
"""
import os
import yaml
from pathlib import Path
from typing import Any, Dict


def _resolve_env(value: str) -> str:
    """将 ${VAR_NAME} 替换为环境变量值。"""
    if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
        var_name = value[2:-1]
        env_val = os.environ.get(var_name, "")
        if not env_val:
            raise ValueError(f"环境变量 {var_name} 未设置！请先 export {var_name}=xxx")
        return env_val
    return value


def _resolve_paths(cfg: Dict[str, Any], base_dir: Path) -> Dict[str, Any]:
    """将相对路径转为绝对路径（相对于 config.yaml 所在目录）。"""
    for key in cfg:
        if isinstance(cfg[key], dict):
            _resolve_paths(cfg[key], base_dir)
        elif isinstance(cfg[key], str) and key.endswith(("_dir", "_path", "_db")):
            p = Path(cfg[key])
            if not p.is_absolute():
                cfg[key] = str((base_dir / p).resolve())
    return cfg


def load_config(config_path: str = None) -> Dict[str, Any]:
    """加载配置文件，解析环境变量和路径。"""
    if config_path is None:
        config_path = Path(__file__).parent.parent / "config.yaml"

    base_dir = Path(config_path).parent

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    # 递归解析环境变量
    def walk(obj):
        if isinstance(obj, dict):
            return {k: walk(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [walk(v) for v in obj]
        elif isinstance(obj, str):
            return _resolve_env(obj)
        return obj

    cfg = walk(cfg)
    cfg = _resolve_paths(cfg, base_dir)
    return cfg


# 全局配置单例
_config: Dict[str, Any] | None = None


def get_config() -> Dict[str, Any]:
    global _config
    if _config is None:
        _config = load_config()
    return _config
