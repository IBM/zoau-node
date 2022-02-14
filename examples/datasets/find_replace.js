let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;
const DS = `${ID}.ZOAU5.SEQ`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    console.log(`Test: delete ${DS} if exists`);
    await zoau.datasets.delete(DS, {'force': true}).then(console.log).catch(errfunc);

    console.log(`Test: create ${DS}`);
    let details = { 'primary_space' : 10  };
    await zoau.datasets.create(DS, 'SEQ', details).then(console.log).catch(errfunc);

    console.log(`Test: write to ${DS}`);
    await zoau.datasets.write(DS,
                              `This is the first line.
This is the second line.
This is the third line.`
    ).then(console.log).catch(errfunc);

    console.log('Test: findReplace');
    let rc = await zoau.datasets.findReplace(DS, 'line.', 'LINE').catch(errfunc);
    if (rc != 0) {
      errfunc(`findReplace returned ${rc}, expected 0`);
    }

    console.log('Test: _findReplace -d');
    let res = await zoau.datasets._findReplace(DS, 'This is the', 'That was', {'debug':true}).catch(errfunc);
    if (res['rc'] !== 0) {
      errfunc(`findReplace returned ${res['rc']}, expected 0`);
    }

    // verify result including debug info
    let json = JSON.parse(res['stdout']);
    let found = json['found'];
    console.log(`found=${found}`);
    if (found !== 3) {
      errfunc(`findReplace found ${found}, expected 3`);
    }
    let changed = json['changed'];
    console.log(`changed=${changed}`);
    if (changed !== 1) {
      errfunc(`findReplace 'changed' debug variable is ${changed}, expected 1`);
    }

    console.log("Test: _findReplace -d on a string that doesn't exist");
    res = await zoau.datasets._findReplace(DS, 'This is the', 'That was', {'debug':true}).catch(errfunc);
    if (res['rc'] === 0) {
      errfunc(`findReplace returned ${res['rc']}, expected non-0`);
    }

    console.log('Test: read to verify');
    res = await zoau.datasets.read(DS).catch(errfunc);
    res = res.split('\n');
    let exp = [ 'That was first LINE', 'That was second LINE', 'That was third LINE' ];
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
