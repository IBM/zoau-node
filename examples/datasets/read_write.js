let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;
const DSN = `${ID}.ZOAU1`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    console.log(`Test: delete ${DSN} if exists`);
    await zoau.datasets.delete(DSN, {'force': true}).then(console.log).catch(errfunc);

    let res, exp, options, details, resarr;
    console.log('Test: create');
    details = { 'primary_space' : 10  };
    await zoau.datasets.create(DSN, 'SEQ', details).then(console.log).catch(errfunc);

    console.log('Test: write no append');
    await zoau.datasets.write(DSN, 'This is the first line.').catch(errfunc);

    console.log('Test: read to verify');
    res = await zoau.datasets.read(DSN).catch(errfunc);
    res = res.split('\n');
    exp = [ 'This is the first line.' ];
    if (!(res.length === exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`read after write failed, expected:\n${exp}\ngot:\n${res}`);
    }

    console.log('Test: _write with append, debug and verbose');
    options = { 'debug' : true, 'verbose' : true };
    res = await zoau.datasets._write(DSN, 'This is the second line.', true, options).catch(errfunc);
    let o = res['stderr'];
    // TODO(gabylb): 777 is an arbitrary length as a check that there is debug info
    if (res['rc'] !== 0 || res['stdout'].length !== 0
   || o.length < 777 || !o.includes(DSN) || !o.includes('.dsout /tmp/decho')) {
      errfunc(`unexpected result returned: ${JSON.stringify(res)}`);
    }
    console.log(`RET-2=${JSON.stringify(res)}`);

    console.log('Test: write and apppend a 3rd line');
    res = await zoau.datasets._write(DSN, 'This is the third line.', true).catch(errfunc);
    if (res['rc'] !== 0 || res['stdout'].length !== 0 || res['stderr'].length !== 0) {
      errfunc(`unexpected result returned: ${JSON.stringify(res)}`);
    }

    console.log('Test: read all');
    let lines = `This is the first line.\nThis is the second line.\nThis is the third line.`;
    let linesarr = lines.split('\n');
    exp = linesarr;
    res = await zoau.datasets.read(DSN).catch(errfunc);
    res = res.split('\n');
    if (!(res.length === exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`read after write failed, expected:\n${exp}\ngot:\n${res}`);
    }

    console.log('Test: read with tail -1');
    res = await zoau.datasets.read(DSN, {'tail' : 1}).catch(errfunc);
    exp = linesarr[2].padEnd(80, ' ');
    if (res !== exp) {
      errfunc(`read after write failed, expected:\n${exp}|\ngot:\n${res}|`);
    }

    console.log('Test: _read from_line 2');
    res = await zoau.datasets._read(DSN, {'from_line' : 2}).catch(errfunc);
    // read() truncates the trailing \n but _read() doesn't.
    resarr = res['stdout'].split('\n').slice(0, -1);
    exp = [ linesarr[1], linesarr[2] ];
    if (!(resarr.length === exp.length && resarr.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`read after write failed, expected:\n${exp}\ngot:\n${resarr}`);
    }

    console.log('Test: write no append');
    await zoau.datasets.write(DSN, 'Only line in dataset.').catch(errfunc);

    console.log('Test: read');
    res = await zoau.datasets.read(DSN).catch(errfunc);
    exp = 'Only line in dataset.'.padEnd(80, ' ');
    if (res !== exp) {
      errfunc(`read after write failed, expected:\n${exp}|\ngot:\n${res}|`);
    }

    console.log('All tests passed.');
  } catch(err) {
    let json = JSON.parse(err.message);
    console.error(`Failed: ${json['command']}`);
    console.error(`rc = ${json['rc']}`);
    console.error(`stderr =  ${json['stderr']}`);
    console.error(`stdout = ${json['stdout']}`);
    process.exit(-1);
  }
}

test();
