import 'dotenv/config';

/**
 * 获取快照的URL
 * @type {string}
 */
export const SnapshotURL = process.env.SNAPSHOT_URL || '';

/**
 * 本地存储路径
 * @type {string}
 */
export const PATH = process.env.DOWNLOAD_PATH || './download/';

/**
 * 目标文件正则
 * @type {string|RegExp}
 */
export const Target = process.env.TARGET ? new RegExp(process.env.TARGET) : '';

/**
 * 是否开启搜索过程中的日志
 */
export const HasSearchLog = process.env.LOG === '1';
