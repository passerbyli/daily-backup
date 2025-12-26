/** @type {import('cz-git').UserConfig} */
// 文件用于配置 commitlint 工具，它用于规范化 Git 提交消息格式。
// @see: https://cz-git.qbenben.com/zh/guide

export default {
  /* 一个字符串数组，用于指定对应的 commitlint 配置扩展文件（使用了 “@commitlint/config-conventional” 扩展，它是一个常用的提交消息规范） */
  extends: ['@commitlint/config-conventional'],
  /* 一组规则用于校验提交消息的格式 */
  rules: {
    // @see: http://commitlint.js.org/#/reference-rules
    'body-leading-blank': [2, 'always'], // 规定提交消息的正文部分之前是否需要空行，配置为 [2, "always"] 表示必须要有空行。
    'footer-leading-blank': [1, 'always'], // 规定提交消息的尾部部分之前是否需要空行，配置为 [1, "always"] 表示应该有空行。
    'header-max-length': [2, 'always', 108], // 规定提交消息头部的最大长度，配置为 [2, "always", 108] 表示最大长度为 108。
    'subject-empty': [2, 'never'], // 规定提交消息的主题部分是否允许为空，配置为 [2, "never"] 表示主题不能为空。
    'type-empty': [2, 'never'], //  规定提交消息的类型部分是否允许为空，配置为 [2, "never"] 表示类型不能为空。
    'subject-case': [0], // 规定提交消息的主题部分的大小写，配置为 [0] 表示不强制大小写。
    'type-enum': [
      // 规定提交消息的类型部分的取值范围，配置为 [2, "always", [类型列表]]，其中类型列表包含了规定的若干提交类型。
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档
        'style', // 样式
        'refactor', // 重构
        'test', // 测试
        'chore', // 构建过程或辅助工具的变动
        'revert',
        'ci',
        'chore',
        'wip',
        'workflow',
        'types',
        'release',
      ],
    ],
  },
  /* 提交过程中向用户提问时使用的各种提示信息 */
  prompt: {
    types: [
      {
        value: "feat",
        name: "新功能: ✨ 新增功能",
        emoji: ":sparkles:",
      },
      {
        value: "fix",
        name: "修复: 🐛 修复缺陷",
        emoji: ":bug:",
      },
      {
        value: "docs",
        name: "docs: 📚 更新文档",
        emoji: ":books:",
      },
      {
        value: "refactor",
        name: "refactor: 🔨 代码重构（不新增功能也不修复bug）",
        emoji: ":hammer:",
      },
      {
        value: "perf",
        name: "perf: ⚡ 性能优化",
        emoji: ":zap:",
      },
      {
        value: "style",
        name: "样式: 💄 代码格式（不影响功能，例如空格、分号等格式修正）",
        emoji: ":lipstick:",
      },
      {
        value: "test",
        name: "测试: ✅ 添加、修改测试用例",
        emoji: ":white_check_mark:",
      },
      {
        value: "chore",
        name: "构建过程或辅助工具的变动: 🔧 构建过程或辅助工具的变动",
        emoji: ":wrench:",
      },
      {
        value: "revert",
        name: "回滚: ⏪ 回滚到上一个版本",
        emoji: ":rewind:",
      },
      {
        value: "ci",
        name: "CI: 🤖 CI/CD 相关更改",
        emoji: ":robot:",
      },
      {
        value: "wip",
        name: "工作进行中: 🚧 工作进行中",
        emoji: ":construction:",
      },
      {
        value: "workflow",
        name: "工作流: 🔄 工作流相关更改",
        emoji: ":repeat:",
      },
      {
        value: "types",
        name: "类型: 🏷️ 类型定义相关更改",
        emoji: ":label:",
      },
      {
        value: "release",
        name: "发布: 🚀 发布新版本",
        emoji: ":rocket:",
      },
    ],
    scopes: [
      { name: "components" },
      { name: "utils" },
      { name: "backend" },
      { name: "frontend" },
      { name: "root" },
    ],
    allowCustomScopes: true,
    skipQuestions: ["body", "footer", "footerPrefix", "breaking"], // 跳过 详细描述 和 底部详细
    messages: {
      type: "选择 Commit 类型:",
      scope: "选择 Commit Scope:",
      customScope: "请输入 Commit Scope:",
      subject: "请输入 Commit 描述:",
      body: "请输入 Commit 详细描述:",
      footer: "请输入 Commit 底部信息:",
      confirmCommit: "确认使用以上信息提交？(y/n)",
    },
  },
};
