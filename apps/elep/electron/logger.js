const log = require('electron-log');
const path = require('path');
const { app } = require('electron');

let initialized = false;

function initLogger(options = {}) {
  if (initialized) return log;
  initialized = true;

  const level = options.level || process.env.LOG_LEVEL || 'info';
  
  // 明确设置日志文件路径
  const logPath = path.join(app.getPath('userData'), 'logs', 'main.log');
  log.transports.file.resolvePath = () => logPath;

  // 设置日志级别
  log.transports.file.level = level;
  log.transports.console.level = level;

  // 设置日志格式
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

  // 日志文件大小限制和归档
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.file.archiveLog = true;
  log.transports.file.archiveOldFile = true;
  log.transports.file.maxFiles = 10;

  log.info('===== logger initialized =====');
  log.info(`日志文件路径: ${logPath}`);
  return log;
}

module.exports = {
  initLogger,
  log,
};
