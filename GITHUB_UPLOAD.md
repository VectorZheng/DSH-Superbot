# 新版项目上传 GitHub

源码位置：D:\DSH-Superagent。请先在 GitHub 创建目标仓库，或确认要更新的既有仓库。当前操作不自动建仓、push 或合并。

## 网页上传

1. 解压交付的 source ZIP。
2. 在 GitHub 目标仓库选择 Add file → Upload files。
3. 上传项目目录里面的文件，保持 src、apps、tests、docs 等层级，不要再多套一层同名文件夹。
4. 填写提交说明并提交。大项目建议使用 Git 命令上传，以完整保留隐藏文件和目录。

## 使用 Git

```powershell
cd D:\DSH-Superagent
git status
git remote -v
```

本地保留原有 Git 历史和 remote。确认目标仓库地址后再选择更新现有 remote，或添加单独的新 remote：

```powershell
git remote add release https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
```

本轮改动已提交；此前其他本地改动仍未提交。逐项审阅并明确选择要上传的原有改动，创建自己的提交后再 push 对应分支。不要直接 force push。

## 不要上传

API Key、token、.env、个人账号包装脚本、DSH profile、SQLite 数据库、日志、node_modules、lib、dist、.host-restart、.git 目录、备份包。

源码包是当前工作树快照；其中包含此前未提交的功能改动，并不完全等同于一个 Git commit。验收记录会明确区分两者。
