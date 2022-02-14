const zoau = require('../../lib/zoau');

const ID = process.env.USER;
const DS1 = `${ID}.ZOAU1a`;
const DS2 = `${ID}.ZOAU1b`;
const DSP = `${ID}.ZOAU1?`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    let res, exp;

    console.log('Test: delete work datasets');
    await zoau.datasets.delete(DSP, {'options' : '-f'}).catch(errfunc);

    console.log('Test: copy of a non-existent USS source file');
    res = await zoau.datasets._copy('/etc/profilxyx', DS1).catch(errfunc);
    if (res === 0 || !res['stderr'].includes('No such file or directory')) {
      errfunc(`copy failed: ${res['stderr']}`);
    }

    console.log('Test: copy a USS source file');
    res = await zoau.datasets._copy('/etc/profile', DS1).catch(errfunc);
    if (res['rc'] !== 0 || res['stderr'].length !== 0) {
      errfunc(`copy failed: ${res['stderr']}`);
    }

    console.log('Test: delete work datasets');
    await zoau.datasets.delete(DSP, {'options' : '-f'}).catch(errfunc);

    console.log('Test: create');
    await zoau.datasets.create(DS1, 'SEQ').then(console.log).catch(errfunc);

    console.log('Test: write another line');
    let line = 'This is the first line.';
    await zoau.datasets.write(DS1, line).catch(errfunc);

    // TODO(gabylb): this is to test passing options, as well -B is currently required (by 'cp') to preserve the white space in the target dataset:
    console.log('Test: copy a dataset as binary');
    await zoau.datasets.copy(DS1, DS2, {'options' : '-B'}).catch(errfunc);

    console.log('Test: read to verify');
    res = await zoau.datasets.read(DS2, {'tail' : 1}).catch(errfunc);
    exp = line.padEnd(80, ' ');
    if (res !== exp) {
      errfunc(`unexpected line in ${DS2}: found:\n|${res}|\nexpected:\n|${exp}|`);
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
