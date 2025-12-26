# 0) 到仓库根目录（按你的路径调整）
cd /Users/lihaomin/projects/GitHub/daily-backup

# 1) 停掉 nodemon / 其他占用进程（若在前台就 Ctrl+C）
# 这里假设你已经停止

# 2) 还原项目 & 缓存目录所有权（避免 root 污染）
sudo chown -R "$(id -un)":"$(id -gn)" .
sudo chown -R "$(id -un)":"$(id -gn)" ~/Library/pnpm 2>/dev/null || true
sudo chown -R "$(id -un)":"$(id -gn)" ~/Library/Caches/electron ~/Library/Caches/electron-builder 2>/dev/null || true
chmod -R u+rwX ~/Library/pnpm ~/Library/Caches/electron ~/Library/Caches/electron-builder 2>/dev/null || true

# 3) 确保允许执行安装/构建脚本（Electron 需要 postinstall 下载二进制）
pnpm config set ignore-scripts false
# pnpm v10 的构建白名单，批准一下（互动式，看到 electron 相关就允许）
pnpm approve-builds || true

# 4) 清理损坏安装（只清掉 Electron 相关，保守做法）
rm -rf node_modules/electron node_modules/.pnpm/electron@*
rm -rf apps/elep/node_modules/electron apps/elep/node_modules/.pnpm/electron@*

# 若你怀疑锁文件也被 root 写坏，干脆全清（可选，出问题再用）
# rm -rf node_modules pnpm-lock.yaml

# 5) 如需镜像（网络到 GitHub/S3 不稳时开启；稳定可跳过）
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# 6) 仅安装当前子包及其依赖（在工作区根执行）
pnpm -w install --filter ./apps/elep

# 7) 重新执行 Electron 的安装脚本（会下载解压二进制）
pnpm -w rebuild electron --filter ./apps/elep

# 8) 验证 Electron 二进制是否到位
pnpm -C apps/elep exec electron --version
ls apps/elep/node_modules/electron/dist | sed -n '1,50p'

# 9) 启动你的项目（示例，按你的脚本调整）
cd apps/elep
pnpm run dev   # 或 nodemon/electron-vite 等你的启动命令