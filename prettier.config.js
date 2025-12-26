/**
 * 控制代码格式
 * @type {import('prettier').Config}
 * @see https://prettier.io/docs/en/options.html
 */

export default {
  trailingComma: "all",
  printWidth: 120,
  // 缩进制表符宽度｜空格数
  tabWidth: 2,
  // 使用制表符而不是空格缩进行（true：使用制表符；false：使用空格）
  useTabs: false,
  // 语句末尾是否添加分号（true：添加分号；false：不添加分号）
  semi: true,
  // 单引号（true：使用单引号；false：使用双引号）
  singleQuote: true,
  //  对象属性是否添加引号（'as-needed'：仅在需要时添加引号；'consistent'：如果一个属性需要引号，则所有属性都需要引号；'preserve'：保持输入时的样式）
  quoteProps: "as-needed",
  // JSX中使用单引号（true：使用单引号；false：使用双引号）
  jsxSingleQuote: false,
  // 对象字面量的大括号内是否添加空格（true：添加空格；false：不添加空格）
  bracketSpacing: true,
  // 多行HTML、JSX、Vue等标签的闭合标签是否另起一行（true：另起一行；false：不另起一行）
  bracketSameLine: false,
  // 箭头函数参数是否添加括号（'always'：总是添加括号；'avoid'：避免添加括号）
  arrowParens: "always",

  // 换行符（'lf'：换行；'crlf'：回车换行；'cr'：回车；'auto'：保持现有的换行符）
  endOfLine: "lf",
};
