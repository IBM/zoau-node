let zoau = require('../../lib/zoau.js');
const { exec } = require('child_process');

const ID = process.env.USER;
const DST = `${ID}.ZOAUTEST`;

function errfunc(err) {
  throw err;
}

async function prepareDS(delOld = null) {
  let ds = await zoau.datasets.tmpName(DST).catch(errfunc);
  console.log(`Test: create ${ds}`);
  let details = { 'primary_space' : 10  };
  await zoau.datasets.create(ds, 'SEQ', details).then(console.log).catch(errfunc);
  if (delOld) {
    console.log(`Deleting old ${delOld} dataset`);
    await zoau.datasets.delete(delOld).then(console.log).catch(errfunc);
  }
  return ds;
}

async function lockDS(dsn) {
  let promise = new Promise((resolve, reject) => {
    console.log(`Test: dlockcmd ${dsn} 500`);
    exec(`dlockcmd ${dsn} 500`, (err, stdout, stderr) => {
      if (stderr.startsWith('BGYSC4603I Lock rc: 0')) {
        let pid = stderr.split(' ')[8].trimEnd();
        resolve(pid);
      } else {
        reject(stderr);
      }
    });
  });
  return await promise.catch(errfunc);
}

function verifyLockError(err) {
  let json = JSON.parse(err.message);
  if (!json['stderr'].startsWith(`BGYSC1801E Failed to obtain the lock for ${DST}`)) {
    errfunc(err.message);
  }
}

async function test() {
  try {
    let DS, res, exp;

    // The tests below are based on mvsutil-python/tests/test_datasets.py

    // ---------------------------- insert after
    DS = await prepareDS(DS);
    await zoau.datasets.write(DS, 'ONE').catch(console.errfunc);
    await zoau.datasets.write(DS, 'FOUR', true).catch(console.errfunc);
    console.log('Test: blockinfile insertafter');
    await zoau.datasets.blockinfile(DS, 'TWO\\nTHREE', { 'marker': 'OPEN\\nCLOSE\\n# \{mark\} BLOCK', 'ins_aft': 'ONE'}).catch(errfunc);

    console.log('Test: read and verify');
    res = await zoau.datasets.read(DS).catch(console.errfunc);
    res = res.split('\n');
    exp = [ 'ONE', '# OPEN BLOCK', 'TWO', 'THREE', '# CLOSE BLOCK', 'FOUR' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`unexpected line in ${DS}: found ${res}, expected ${exp}`);
    }

    // ---------------------------- insert before
    DS = await prepareDS(DS);
    await zoau.datasets.write(DS, 'ONE').catch(console.errfunc);
    await zoau.datasets.write(DS, 'FOUR', true).catch(console.errfunc);
    console.log('Test: blockinfile insertbefore');
    await zoau.datasets.blockinfile(DS, 'TWO\\nTHREE', { 'marker': 'OPEN\\nCLOSE\\n# \{mark\} BLOCK', 'ins_bef': 'FOUR'}).catch(errfunc);

    console.log('Test: read and verify');
    res = await zoau.datasets.read(DS).catch(console.errfunc);
    res = res.split('\n');
    exp = [ 'ONE', '# OPEN BLOCK', 'TWO', 'THREE', '# CLOSE BLOCK', 'FOUR' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`unexpected line in ${DS}: found ${res}, expected ${exp}`);
    }

    // ---------------------------- delete
    DS = await prepareDS(DS);

    await zoau.datasets.write(DS, 'ONE').catch(console.errfunc);
    await zoau.datasets.write(DS, '# OPEN BLOCK', true).catch(console.errfunc);
    await zoau.datasets.write(DS, 'TWO', true).catch(console.errfunc);
    await zoau.datasets.write(DS, '# CLOSE BLOCK', true).catch(console.errfunc);
    await zoau.datasets.write(DS, 'THREE', true).catch(console.errfunc);

    console.log('Test: blockinfile delete');
    await zoau.datasets.blockinfile(DS, null, { 'marker': 'OPEN\\nCLOSE\\n# \{mark\} BLOCK', 'state': false}).catch(errfunc);

    console.log('Test: read and verify');
    res = await zoau.datasets.read(DS).catch(console.errfunc);
    res = res.split('\n');
    exp = [ 'ONE', 'THREE' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`unexpected line in ${DS}: found ${res}, expected ${exp}`);
    }

    // ---------------------------- lock
    DS = await prepareDS();
    console.log(`Test: write to ${DS}`);
    await zoau.datasets.write(DS, 'ONE').catch(console.errfunc);
    await zoau.datasets.write(DS, 'THREE', true).catch(console.errfunc);

    let lockPid = await lockDS(DS).catch(errfunc);

    console.log('Test: blockinfile insert while dataset is locked');
    await zoau.datasets.blockinfile(DS, 'TWO', {'marker': 'OPEN\\nCLOSE\\n# {mark} BLOCK', 'ins_aft': 'ONE', 'lock': true}).catch(verifyLockError);

    console.log('Test: read and verify');
    res = await zoau.datasets.read(DS).catch(console.errfunc);
    res = res.split('\n');
    console.log(`read res=${res}`);
    exp = [ 'ONE', 'THREE' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`unexpected line in ${DS}: found ${res}, expected ${exp}`);
    }

    console.log('Test: blockinfile unlock dataset');
    process.kill(lockPid,'SIGQUIT');

    console.log('Test: blockinfile insert after dataset is unlocked');
    await zoau.datasets.blockinfile(DS, 'TWO', {'marker': 'OPEN\\nCLOSE\\n# {mark} BLOCK', 'ins_aft': 'ONE', 'lock': true}).catch(verifyLockError);

    console.log('Test: read and verify');
    res = await zoau.datasets.read(DS).catch(console.errfunc);
    res = res.split('\n');
    exp = [ 'ONE', '# OPEN BLOCK', 'TWO', '# CLOSE BLOCK', 'THREE' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`unexpected line in ${DS}: found ${res}, expected ${exp}`);
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
