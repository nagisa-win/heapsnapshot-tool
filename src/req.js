import axios from 'axios';
import fs from 'fs';
import {SnapshotURL} from './constants.js';
import path from 'path';

export function getLatestSnapshot() {
    return axios.get(SnapshotURL);
}

export async function downloadFile(url, filePath) {
    // 使用 Axios 发起 GET 请求
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const fileDir = path.join(...filePath.split('/').slice(0, -1));

    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
    }

    // 创建一个可写流
    const writeStream = fs.createWriteStream(filePath);

    // 将响应数据管道到可写流
    response.data.pipe(writeStream);

    // 等待文件下载完成
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}
