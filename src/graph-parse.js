import _ from 'lodash';
import {parseSize} from './util.js';
import {HasSearchLog} from './constants.js';
/**
 * dump 图
 */
export class Graph {
    graph = null;
    nodes = {};
    edges = [];

    constructor(json) {
        this.graph = this._getGraph(json);
    }

    /**
     * 获取图数据
     *
     * @returns 返回包含节点、边、字符串、节点字段、节点类型、边字段、边类型、节点数量和边数量的对象
     */
    _getGraph(json) {
        try {
            return {
                nodes: json.nodes,
                edges: json.edges,
                strings: json.strings,
                nodeFields: json.snapshot.meta.node_fields,
                nodeTypes: json.snapshot.meta.node_types,
                edgeFields: json.snapshot.meta.edge_fields,
                edgeTypes: json.snapshot.meta.edge_types,
                nodeCount: json.snapshot.node_count,
                edgeCount: json.snapshot.edge_count
            };
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    get nodes() {
        if (!this.nodes) return undefined;
        return this.nodes;
    }

    get edges() {
        if (!this.edges) return undefined;
        return this.edges;
    }

    get nodeLen() {
        return this.graph.nodeFields.length;
    }

    get edgeLen() {
        return this.graph.edgeFields.length;
    }

    /**
     * 获取图中指定索引的节点信息
     *
     * @param i 节点索引
     * @returns 返回节点信息对象，若索引不存在则返回null
     */
    getGraphNode(i) {
        if (this.graph.nodes[i] !== undefined) {
            const ret = {};
            this.graph.nodeFields.forEach((key, index) => {
                ret[key] = this.graph.nodes[i + index];
            });
            ret.type = ret.type !== undefined ? this.getType(ret.type, 'node') : 0;
            ret.name = ret.name !== undefined ? this.graph.strings[ret.name] : '';
            return ret;
        }
        return null;
    }

    /**
     * 获取图的一条边
     *
     * @param i 边的索引
     * @returns 返回边的对象，如果边不存在则返回undefined
     */
    getGraphEdge(i) {
        if (this.graph.edges[i] !== undefined) {
            const ret = {};
            this.graph.edgeFields.forEach((key, index) => {
                ret[key] = this.graph.edges[i + index];
            });
            ret.type = ret.type !== undefined ? this.getType(ret.type, 'edge') : 0;
            return ret;
        }
        return null;
    }

    /**
     * 根据来源获取类型名称
     *
     * @param type 类型
     * @param from 来源，可选值为 'node' 或 'edge'
     * @returns 返回与来源对应的类型名称
     */
    getType(type, from) {
        switch (from) {
            case 'node':
                return this.graph.nodeTypes[0][type] || type;
            case 'edge':
                return this.graph.edgeTypes[0][type] || type;
        }
    }

    /**
     * 获取图的所有节点和边
     *
     * @returns Promise<void>
     */
    getAll() {
        return new Promise(resolve => {
            const nodes = {};
            // const edges = [];
            let edgeOffset = 0;
            for (let i = 0; i < this.graph.nodeCount; ++i) {
                const node = this.getGraphNode(i * this.nodeLen);
                const node_edges = [];
                for (let j = 0; j < node.edge_count; ++j) {
                    const baseIndex = edgeOffset + j * this.edgeLen;
                    const edge = this.getGraphEdge(baseIndex);
                    if (edge.type === 'element' || edge.type === 'hidden') {
                        edge.prop = `[${edge.name_or_index}]`;
                    } else {
                        edge.prop = this.graph.strings[edge.name_or_index];
                    }
                    const targetNode = this.getGraphNode(edge.to_node);
                    const e = {
                        id: baseIndex,
                        from: node.id,
                        to: targetNode.id,
                        type: edge.type,
                        value: edge.prop,
                        label: `${edge.prop} :: ${targetNode.name} @${targetNode.id}`
                    };
                    // edges.push(e);
                    node_edges.push(e);
                }
                edgeOffset += node.edge_count * this.edgeLen;
                nodes[node.id] = {...node, edges: node_edges};
            }
            this.nodes = nodes;
            // this.edges = edges;
            resolve();
        });
    }

    /**
     * 在节点集合中查找满足条件的节点
     *
     * @param property 节点属性名
     * @param val 属性值，支持正则表达式和精确匹配
     * @param nodes 节点集合，默认为当前实例的nodes属性
     * @returns 返回满足条件的节点数组
     */
    findNode(property, val, nodes = this.nodes) {
        return new Promise((resolve, reject) => {
            const ret = _.filter(_.values(nodes), node => {
                if (val instanceof RegExp && val.test(node[property])) {
                    return true;
                }
                if (node[property] === val) {
                    return true;
                }
                return false;
            });
            resolve(ret);
        });
    }

    /**
     * 判断节点是否有指定属性的边
     *
     * @param nodeWithEdges 节点对象，包含edges属性
     * @param property 边对象的属性名
     * @param val 边的属性值
     * @returns 返回布尔值，表示节点是否有指定属性的边
     * @throws 如果nodeWithEdges.edges为undefined，则抛出异常
     */
    hasEdge(nodeWithEdges, property, val) {
        if (!nodeWithEdges.edges) {
            reject('nodeWithEdges.edges is undefined');
        }
        const edges = nodeWithEdges.edges;
        let ret = false;
        for (let i = 0; i < edges.length; ++i) {
            if (val instanceof RegExp && val.test(edges[i][property])) {
                ret = true;
            }
            if (edges[i][property] === val) {
                ret = true;
            }
        }
        return ret;
    }

    // getNodeEdges(nodes) {
    //     return new Promise(resolve => {
    //         const res = [];
    //         nodes.forEach(node => {
    //             const n = {...node, edges: []};
    //             this.edges.forEach(edge => {
    //                 if (edge.from === node.id && this.nodes[edge.to]) {
    //                     n.edges.push(edge);
    //                 }
    //             });
    //             res.push(n);
    //         });
    //         resolve(res);
    //     });
    // }

    /**
     * 追踪节点
     *
     * @param fromNodes 起始节点
     * @returns 返回追踪到的节点大小
     */
    traceNodes(fromNodes) {
        const total = this.graph.nodeCount;
        return new Promise((resolve, reject) => {
            if (!this.nodes) {
                reject('call `getAll()` first');
            }
            let size = 0;
            let count = 0;
            const visited = {};
            const queue = [...fromNodes];
            let lastQueueSize = queue.length;
            while (queue.length) {
                const node = queue.shift();
                if (!visited[node.id]) {
                    size += node.self_size;
                    count++;
                    if (HasSearchLog && count % 1000 === 0) {
                        console.log(
                            `Size: \x1b[94m${parseSize(size).padStart(
                                10,
                                ' '
                            )}\x1b[0m. Searched: \x1b[94m${((count / total) * 100)
                                .toFixed(2)
                                .padStart(6, ' ')}%\x1b[0m. Left: \x1b[94m${queue.length
                                .toString()
                                .padStart(10, ' ')}\x1b[0m. Trend: ${
                                lastQueueSize > queue.length
                                    ? '\x1b[91m↓\x1b[0m'
                                    : '\x1b[32m↑\x1b[0m'
                            }`
                        );
                        lastQueueSize = queue.length;
                    }
                }
                visited[node.id] = true;
                for (let i = 0; i < node.edges.length; ++i) {
                    const edge = node.edges[i];
                    if (visited[edge.to] || !this.nodes[edge.to]) {
                        continue;
                    }
                    const target = this.nodes[edge.to];
                    if (
                        [
                            'string',
                            'object',
                            'code',
                            'regexp',
                            'number',
                            'native',
                            'concatenated string',
                            'sliced string',
                            'symbol',
                            'bigint'
                        ].includes(target.type)
                    ) {
                        queue.push(target);
                    }
                }
            }
            resolve(size);
        });
    }

    async searchGraph(node, visited, count = 0) {
        if (!this.nodes) {
            throw new Error('call `getAll()` first');
        }

        let size = 0;
        if (!visited[node.id]) {
            size += node.self_size;
            count++;
            visited[node.id] = true;
        }

        const asyncArr = [];
        for (let i = 0; i < node.edges.length; ++i) {
            const edge = node.edges[i];
            if (visited[edge.to] || !this.nodes[edge.to]) {
                continue;
            }
            if (
                node.type === 'object' &&
                node.name === 'Module' &&
                ['filename', 'parent', 'path', 'paths', '__proto__'].includes(edge.value)
            ) {
                continue;
            }
            const nextNode = this.nodes[edge.to];
            size += nextNode.self_size;
            count++;
            visited[node.id] = true;
            asyncArr.push(this.searchGraph(nextNode, visited, count));
        }

        const sizes = await Promise.all(asyncArr);
        return size + sizes.reduce((a, b) => a + b, 0);
    }
}
