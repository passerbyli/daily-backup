const log = require('electron-log');

let initialized = false;

function initLogger(options = {}) {
  if (initialized) return log;
  initialized = true;

  const level = options.level || process.env.LOG_LEVEL || 'info';

  log.transports.file.level = level;
  log.transports.console.level = level;

  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.file.archiveLog = true;

  // 统一格式（可选）
  log.hooks.push((message) => {
    // message.data 是数组
    return message;
  });

  log.info('===== logger initialized =====');
  return log;
}

module.exports = {
  initLogger,
  log,
};
