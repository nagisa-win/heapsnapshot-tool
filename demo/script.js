function draw(root) {
    console.time('process_data');

    /**
     * invert key and value of an array of string
     *
     * ["a","b","c"] => {
     *   "a":0,
     *   "b":1,
     *   "c":2
     * }
     *
     **/
    function key_invert(arr) {
        var ret = {};
        for (var i = 0; i < arr.length; i++) {
            ret[arr[i]] = i;
        }
        return ret;
    }

    var META = root.snapshot.meta;
    var NAMING = {
        NODE_FIELDS: key_invert(META.node_fields),
        EDGE_FIELDS: key_invert(META.edge_fields),
        NODE_TYPES: key_invert(META.node_types[0]),
        EDGE_TYPES: key_invert(META.edge_types[0])
    };
    var EDGE_FIELDS_LENGTH = META.edge_fields.length;

    console.debug('root: %o meta: %o NAMING: %o', root, root.snapshot.meta, NAMING);

    var n = root.nodes;
    var s = root.strings;
    var e = root.edges;

    var NODES_MAP = (window.N = {});
    var EDGES_ARRAY = (window.E = []);

    var edge_offset = 0;

    for (var i = 0; i < n.length; i += META.node_fields.length) {
        var i_type = n[i];
        var i_name = s[n[i + 1]];
        var i_id = n[i + 2];
        var i_size = n[i + 3];
        var i_edge_count = n[i + 4];

        var node = {
            id: i_id,
            group: i_type,
            label: i_name + '\n@' + i_id,
            title: META.node_types[0][i_type],
            edge_count: i_edge_count
        };

        if (i_type === NAMING.NODE_TYPES['string']) {
            if (i_name && i_name.length > 20) {
                node.label = 'string[' + i_name.length + ']\n@' + i_id;
                node.title = i_name;
            }
        }

        for (var j = 0; j < i_edge_count; j++) {
            var base = edge_offset + j * EDGE_FIELDS_LENGTH;
            var e_type = e[base];
            var e_prop;
            var e_to = e[base + 2];

            /**
             * @link https://github.com/joyent/node/blob/d13d7f74d794340ac5e126cfb4ce507fe0f803d5/deps/v8/src/heap-snapshot-generator.cc#L2874
             **/

            if (e_type === 1 || e_type === 4) {
                e_prop = '[' + e[base + 1] + ']';
            } else {
                e_prop = s[e[base + 1]];
            }

            /**
             * context: "0"
             * element: "1"
             * property: "2"
             * internal: "3"
             * hidden: "4"
             * shortcut: "5"
             * weak: "6"
             */
            var e_found = {
                id: base,
                from: i_id,
                to: n[e_to + 2],
                arrows: 'middle',
                title: META.edge_types[0][e_type],
                label: e_prop
            };

            if (e_type == NAMING.EDGE_TYPES['internal']) {
                e_found.dashes = true;
                e_found.arrows = 'to';
            } else if (e_type == NAMING.EDGE_TYPES['hidden']) {
                e_found.dashes = true;
                e_found.arrows = 'to';
            }

            EDGES_ARRAY.push(e_found);
        }

        edge_offset += EDGE_FIELDS_LENGTH * i_edge_count;
        NODES_MAP[i_id] = node;
    }

    /**
     * hidden: "0"
     * array: "1"
     * string: "2"
     * object: "3"
     * code: "4"
     * closure: "5"
     * regexp: "6"
     * number: "7"
     * native: "8"
     * synthetic: "9"
     */

    var count = 0;
    var nodes = _.filter(NODES_MAP, function (n) {
        if ([6, 7, 8, 9].indexOf(n.group) !== -1) {
            return true;
        }

        if (n.id < 32) {
            return true;
        }
    });

    var node_id = _.map(nodes, function (i) {
        return i.id;
    });

    var edges = _.filter(EDGES_ARRAY, function (i) {
        if (_.indexOf(node_id, i.from) !== -1 && _.indexOf(node_id, i.to) !== -1) {
            return true;
        } else {
            return false;
        }
    });

    // create a network
    var container = document.getElementById('root');

    var nodeDS = new vis.DataSet(nodes);
    var edgeDS = new vis.DataSet(edges);

    var data = {
        nodes: nodeDS,
        edges: edgeDS
    };

    var options = {
        height: $(window).innerHeight() - 80 + 'px',
        nodes: {
            size: 10,
            shape: 'dot'
        },
        edges: {
            color: {
                color: '#9e9e9e',
                inherit: 'to'
            },
            font: {
                color: '#9e9e9e'
            }
        }
    };

    /**
     * hidden: "0"
     * array: "1"
     * string: "2"
     * object: "3"
     * code: "4"
     * closure: "5"
     * regexp: "6"
     * number: "7"
     * native: "8"
     * synthetic: "9"
     */
    options.groups = {};

    options.groups[NAMING.NODE_TYPES['regexp']] = {
        color: '#dd8482',
        font: {
            color: '#dd8482'
        },
        shape: 'dot',
        size: 5
    };

    options.groups[NAMING.NODE_TYPES['hidden']] = {
        color: '#cccccc',
        font: {
            color: '#cccccc'
        }
    };

    options.groups[NAMING.NODE_TYPES['number']] = {
        color: '#442ed5',
        font: {
            color: '#442ed5'
        },
        size: 5
    };

    options.groups[NAMING.NODE_TYPES['native']] = {
        color: '#c4c4c4',
        font: {
            color: '#c4c4c4'
        }
    };

    options.groups[NAMING.NODE_TYPES['synthetic']] = {
        color: '#666666',
        font: {
            color: '#666666'
        }
    };

    options.groups[NAMING.NODE_TYPES['string']] = {
        shape: 'text',
        color: '#d66966',
        font: {
            color: '#d66966'
        }
    };

    options.groups[NAMING.NODE_TYPES['closure']] = {
        shape: 'triangle',
        color: 'orange'
    };

    options.groups[NAMING.NODE_TYPES['code']] = {
        color: 'orange'
    };

    options.groups[NAMING.NODE_TYPES['object']] = {
        shape: 'square'
    };

    console.timeEnd('process_data');

    console.info('rendering %d nodes and %d egdes', nodes.length, edges.length);

    var network = new vis.Network(container, data, options);
    track_progress(network);

    network.on('click', clickHandler);

    function toggleFix(e) {
        _.each(e.nodes, function (id) {
            var n = nodeDS.get(id);
            n.physics = !n.physics;
            nodeDS.update(n);
        });
    }

    function clickHandler(e) {
        switch ($(':checked').val()) {
            case 'from':
                expand(e, 'from');
                break;
            case 'to':
                expand(e, 'to');
                break;
            case 'remove':
                remove(e);
                break;
            case 'fix':
                toggleFix(e);
                break;
            case 'unchain':
                unchain(e);
                break;
        }
    }

    function unchain(e) {
        edgeDS.remove(e.edges);
    }

    function remove(e) {
        nodeDS.remove(e.nodes);
        edgeDS.remove(e.edges);
    }

    function expand(e, direction) {
        _.each(e.nodes, function (id) {
            var condition = {};
            condition[direction] = parseInt(id);
            var edges = _.where(EDGES_ARRAY, condition);

            if (edges.length > 30 && !window.confirm('确认要展开 ' + edges.length + ' 条边么？')) {
                return;
            }

            _.each(edges, function (edge) {
                if (direction === 'from') {
                    if (!nodeDS.get(edge.to)) {
                        nodeDS.add(NODES_MAP[edge.to]);
                    }
                } else {
                    if (!nodeDS.get(edge.from)) {
                        nodeDS.add(NODES_MAP[edge.from]);
                    }
                }

                if (!edgeDS.get(edge.id)) {
                    edgeDS.add(edge);
                }
            });
        });
    }

    $('#file')[0].addEventListener('change', function () {
        var reader = new FileReader();
        var file = this.files[0];

        reader.onload = function () {
            try {
                var data = JSON.parse(reader.result);
                draw(data);
            } catch (e) {
                alert(e.message);
            }
        };

        reader.readAsText(file);
    });
}
