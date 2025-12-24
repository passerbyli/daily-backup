// .lintstagedrc.js
export default {
  // 这些后缀的文件，运行cspell进行检查
  "*.{js,ts,mjs,json,tsx,css,less,scss,vue,html,md}": ["cspell lint"],
  "*.{ts,tsx,js,jsx,vue,md}": ["prettier --write", "eslint"],
};
