# dsh-imgcmp

DSH 插件：右下角悬浮窗「图片查重」。上传两张图，跑 SuperPoint 特征点 + RANSAC 几何校验，判断是否重复（支持翻转 / 旋转 / 拉伸），并标注重复区域。

## 结构

```text
dsh-imgcmp/
├── package.json     # name/version + exports + dsh.client
├── src/index.js     # Node half：POST /api/dsh-imgcmp/compare
├── src/client.js    # Client half：shell.overlay 悬浮窗 UI
└── README.md
```

## 依赖（必须存在）

Host half 会执行：

```sh
cd /home/zhaoqi/zhaoqi/DSH/bioimg-dedup && .venv/bin/python compare_bridge.py
```

复用前确保该目录里存在：

- `.venv/`（torch 2.9.1+cu130、torchvision、kornia、PIL、numpy、cv2）
- `compare_bridge.py`（stdin→stdout JSON 桥）
- `src/lightglue_geo.py` + `src/lightglue_lite/`（SuperPoint）
- SuperPoint 权重（`torch.hub` 缓存 `superpoint_v1.pth`）
- GPU

换机器时把整个项目目录拷过去，并在 insert 行的 `config.project` 里指到新路径（默认 `DEFAULT_PROJECT` 见 `src/index.js`）。

## 安装

```sh
# 前置：需要 pnpm（dsh plugin 用它管理 profile 插件）
npm install -g pnpm

# 1) 安装包到 web profile
dsh plugin --profile web add /home/zhaoqi/.dsh/dsh-plugins/plugins/dsh-imgcmp

# 2) 挂载 insert 行（二选一）
#    a. 写入 profile patch：  $DSH_HOME/profiles/web/cordis.patch.yml
#    b. 写入 --patch overlay：$DSH_HOME/web-remote.patch.yml
#
#    - insert:
#        - id: imgcmp
#          name: 'dsh-imgcmp'
#          config:
#            project: '/home/zhaoqi/zhaoqi/DSH/bioimg-dedup'
#            timeoutMs: 180000

# 3) 重启 web 使 Node half 生效（配置行 HMR 只覆盖已加载插件；新插件的 Node half 需重启）
#    （本会话运行在该 web 进程内，重启会短暂断开，需重新连接）
```

## 配置项

插件 insert 行 `config`（可移植，无需改代码）：

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `project` | `/home/zhaoqi/zhaoqi/DSH/bioimg-dedup` | Python 项目根目录（`.venv/` + `compare_bridge.py` 所在） |
| `timeoutMs` | `180000` | 单次比对的 shell 超时（毫秒） |

Python 侧可调（在 `compare_bridge.py` → `src/lightglue_geo.py`）：

- `threshold`（UI 里调）：内点判定阈值，默认 12。
- `detection_threshold`：采样密度，越小点越多，当前 0.0001。
- `max_kpts`：每图关键点上限，默认 2048。

## 发布形式

插件是「纯 cordis」形态（单 apply + insert 行），可选的发布方式：

1. **git 源（当前，推荐个人复用）**：`dsh plugin --profile web add "github:henlii/dsh-plugins#main&path:/plugins/dsh-imgcmp"`，带版本、可回退；
2. **npm 发布（对外分享）**：在 `plugins/dsh-imgcmp/` 里 `npm publish` 后 `dsh plugin add dsh-imgcmp`——但 Python 后端（bioimg-dedup 项目 + venv + GPU）仍需单独分发并配 `config.project`；
3. **集合 patch（随 dsh-plugins 一次性安装）**：`dsh web --patch .../dsh-plugins/cordis.patch.yml` 挂载全部插件；
4. **bundle 形态**：如需把「insert 行 + 配置」打包成层栈随包分发，可改造成 `dsh.bundle.patch`（重启生效）。

因为插件依赖本机的 Python venv + GPU，**发布边界是 JS 壳**；计算后端永远需要 bioimg-dedup 项目在场。

## License

MIT
