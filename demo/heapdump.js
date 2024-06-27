import heapdump from 'heapdump';

var i = 0;
var s = 'abc';
var o = {a: 1, b: '2'};
var a = [1, 2];
var f = () => {
    return 1;
};
var r = /abc/;
var d = new Date();
var n = null;
var u = undefined;
var b = new Buffer.alloc(10);
var e = new Error('error');
var h = new Map();
var s2 = Symbol('symbol');
var p = new Promise(resolve => {
    resolve(1);
});

heapdump.writeSnapshot('nodejs.heapsnapshot');