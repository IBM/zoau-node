let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    // ---------------hlq
    console.log('Test: hlq');
    let res = await zoau.datasets.hlq().catch(errfunc);
    if (res !== ID) {
      errfunc(`hlq returned ${res}, expected ${ID}`);
      process.exitCode = -1; return;
    }

    console.log('Test: hlq -d');
    res = await zoau.datasets.hlq({'debug':true}).catch(errfunc);
    if (res !== ID) {
      errfunc(`hlq -d returned ${res}, expected ${ID}`);
      process.exitCode = -1; return;
    }

    console.log('Test: _hlq -d');
    res = await zoau.datasets._hlq({'debug':true}).catch(errfunc);
    console.log('exit=<' + res['rc'] + '>');
    console.log('stdout=<' + res['stdout'] + '>');
    if (res['stdout'].trimEnd('\n') !== ID) {
      errfunc(`hlq -d returned ${res['stdout'].trimEnd('\n')}, expected ${ID}`);
      process.exitCode = -1; return;
    }
    console.log('stderr=<' + res['stderr'] + '>');

    // ---------------tmp_name
    console.log('Test: tmp_name');
    res = await zoau.datasets.tmp_name().catch(errfunc);
    console.log(`res=${res}`);
    let dots = (res.match(/\./g) || []).length;
    if (!res.startsWith('MVSTMP.') || res.length < 33 || dots < 3) {
      errfunc(`string returned by tmp_name expected to start with 'MVSTMP.', got ${res}`);
      process.exitCode = -1; return;
    }

    console.log('Test: tmp_name with HLQ of the temp dataset name');
    res = await zoau.datasets.tmp_name('ABC.DEF.GHI.').catch(errfunc);
    dots = (res.match(/\./g) || []).length;
    console.log(`res=${res}`);
    if (!res.startsWith('ABC.DEF.GHI..') || res.length != 39 || dots != 6) {
      errfunc(`string returned by tmp_name expected to start with 'ABC.DEF.GHI..', got ${res}`);
      process.exitCode = -1; return;
    }

    console.log('Test: _tmp_name -d');
    res = await zoau.datasets._tmp_name(null, {'debug':true}).catch(errfunc);
    console.log('exit=<' + res['rc'] + '>');
    console.log('stdout=<' + res['stdout'] + '>');
    console.log('stderr=<' + res['stderr'] + '>');
    console.log('command=<' + res['command'] + '>');
    if (!res['stdout'].trimEnd('\n').startsWith('MVSTMP')) {
      errfunc(`string returned by '_tmp_name -d' stdout expected to start with 'MVSTMP.', got ${res['stdout'].trimEnd('\n')}`);
      process.exitCode = -1; return;
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
