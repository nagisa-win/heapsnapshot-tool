import dayjs from 'dayjs';
import fs from 'fs';
import tar from 'tar';
import {log, time, timeEnd, parseJSON, readDir, readFile, writeFile, parseSize} from './util.js';
import {getLatestSnapshot, downloadFile} from './req.js';
import {SnapshotURL, PATH, Target} from './constants.js';
import {Graph} from './graph-parse.js';

function matchLatest(content) {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const latestReg = new RegExp(`<a href="heapsnapshots-${today}.tar.gz">`);
    const yesterdayReg = new RegExp(`<a href="heapsnapshots-${yesterday}.tar.gz">`);
    if (content.match(latestReg)) {
        return `heapsnapshots-${today}.tar.gz`;
    } else if (content.match(yesterdayReg)) {
        return `heapsnapshots-${yesterday}.tar.gz`;
    } else {
        throw new Error('no snapshot found');
    }
}

async function main() {
    log('fetch latest snapshot web page');
    time('fetch');
    const snapshotWeb = await getLatestSnapshot();
    timeEnd('fetch');
    const fileName = matchLatest(snapshotWeb.data);
    log(`matched file: \x1b[32m${fileName}\x1b[0m`);
    log('downloading...', SnapshotURL + fileName);
    time('download');
    await downloadFile(SnapshotURL + fileName, PATH + fileName);
    timeEnd('download');
    log('extracting...');
    time('extract');
    await tar.x({
        file: PATH + fileName,
        cwd: PATH
    });
    timeEnd('extract');
    await fs.promises.unlink(PATH + fileName);
    log('removed file:', PATH + fileName);

    const [file] = await readDir(PATH);
    if (!file) {
        log('no file found.');
        return;
    }
    log(`reading file: \x1b[32m${file}\x1b[0m`);
    time('read');
    // 读取文件内容
    const hugeContent = await readFile(PATH + file);
    timeEnd('read');
    log('parse content: ', hugeContent.length);
    time('parse');
    // 生成graph对象
    const G = new Graph(parseJSON(hugeContent));
    timeEnd('parse');
    log('process graph nodes');
    time('process graph');
    // 解析graph
    await G.getAll();
    timeEnd('process graph');
    log('processed graph nodes:', Object.keys(G.nodes).length, 'expect:', G.graph.nodeCount);
    if (!Target) {
        log('no target specified, skip.');
        return;
    }
    log(`finding \x1b[32m${Target}\x1b[0m named Module`);
    time('find nodes');
    // 找到所有Module object节点
    let targetNodes = await G.findNode('name', 'Module');
    targetNodes = await G.findNode('type', 'object', targetNodes);
    log('found Module nodes:', targetNodes.length);
    // 找到目标节点
    targetNodes = targetNodes.filter(node => {
        return G.hasEdge(node, 'label', Target);
    });
    if (!targetNodes[0]) {
        log('no node found.');
        return;
    }
    // 此时targetNodes[0]是目标节点
    log('writing target node to file');
    await writeFile('target.json', JSON.stringify(targetNodes[0], null, 4));
    timeEnd('find nodes');
    log(`tracing \x1b[32m${Target}\x1b[0m nodes in graph`);
    time('trace nodes');
    const size = await G.traceNodes(targetNodes);
    // const visited = {};
    // const res = await G.searchGraph(targetNodes[0], visited);
    timeEnd('trace nodes');
    log(`\n\x1b[93m${Target}\x1b[0m nodes total size: \x1b[93m${parseSize(size)}\x1b[0m`);
}

main();
