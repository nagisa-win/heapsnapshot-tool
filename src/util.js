import dayjs from 'dayjs';
import fs from 'fs';

const timeMap = {};

export function getDateTime(format = 'YYYY-MM-DD HH:mm:ss.SSS') {
    return dayjs().format(format);
}

export function log(...args) {
    const now = getDateTime();
    return console.log(`\x1b[90m[${now}]\x1b[0m`, ...args);
}

export function parseTime(millionSeconds) {
    if (millionSeconds < 800) return `${millionSeconds}ms`;
    return `${millionSeconds / 1000}s`;
}

export function parseSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function time(str) {
    timeMap[str] = Date.now();
}

export function timeEnd(str) {
    if (!timeMap[str]) return;
    const time = Date.now() - timeMap[str];
    log(`\x1b[91m[TIME] ${str}: ${parseTime(time)}\x1b[0m`);
    timeMap[str] = undefined;
}

/**
 * 解析JSON字符串
 *
 * @param {string} str 要解析的JSON字符串
 * @returns {object} 解析后的JSON对象
 */
export function parseJSON(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse error:\n', e);
        return {};
    }
}

export function readDir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) return reject(err);
            resolve(files);
        });
    });
}

export function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

export function writeFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, err => {
            if (err) return reject(err);
            resolve();
        });
    });
}
