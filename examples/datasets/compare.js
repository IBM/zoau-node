const zoau = require('../../lib/zoau.js');

const ID = process.env.USER;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    let res;
    console.log('Test: delete work  datasets');
    await zoau.datasets.delete(`${ID}.ZOAU2?`, {'force':true}).catch(errfunc);

    console.log('Test: create source & target dataset');
    await zoau.datasets.create(`${ID}.ZOAU2a`, 'SEQ').then(console.log).catch(errfunc);
    await zoau.datasets.create(`${ID}.ZOAU2b`, 'SEQ').then(console.log).catch(errfunc);

    console.log('Test: write to dataset 2a');
    await zoau.datasets.write(`${ID}.ZOAU2a`,
                              `This is the first line.
This is the second line.
This is the thrid line.`
    ).then(console.log).catch(errfunc);

    console.log('Test: copy 2a to 2b');
    await zoau.datasets.copy(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`).then(console.log).catch(errfunc);

    console.log('Test: compare identical datasets');
    res = await zoau.datasets._compare(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`).catch(errfunc);
    if (res['rc'] !== 0 || res['stdout'].length !== 0 || res['stderr'].length != 0) {
      errfunc(`_compare failed: res=${JSON.stringify(res)}`);
    }

    console.log('Test: write an extra line to 2a');
    await zoau.datasets.write(`${ID}.ZOAU2a`, 'This is the fourth line.', true).catch(errfunc);

    console.log('Test: compare datasets that differ');
    res = await zoau.datasets._compare(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`).catch(errfunc);
    console.log(`res=${JSON.stringify(res)}`);
    if (res['rc'] === 0) {
      errfunc('_compare failed');
    }

    console.log('Test: match the 2nd dataset but case some words differently');
    await zoau.datasets.write(`${ID}.ZOAU2b`, 'This IS the FOURTH Line.', true).catch(errfunc);

    console.log('Test: compare datasets that differ only in case, ignore case, should not differ');
    res = await zoau.datasets._compare(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`, {'ignore_case' : true}).catch(errfunc);
    if (res['rc'] !== 0) {
      errfunc(`_compare failed: res=${JSON.stringify(res)}`);
    }

    console.log("Test: compare datasets that differ only in case, don't ignore case (explicit this time), should differ");
    res = await zoau.datasets._compare(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`, {'ignore_case' : false}).catch(errfunc);
    if (res['rc'] === 0) {
      errfunc(`_compare failed: res=${JSON.stringify(res)}`);
    }

    console.log("Test: compare the columns containing 'This', should not differ");
    res = await zoau.datasets.compare(`${ID}.ZOAU2a`, `${ID}.ZOAU2b`, {'ignore_case' : false, 'columns' : '1:4'}).catch(errfunc);
    // test that res === null, not undefined or otherwise
    if (res || res !== null || res === undefined) {
      errfunc(`compare failed: res=${JSON.stringify(res)}`);
    }

    console.log('Test: compare non existent datasets');
    res = await zoau.datasets._compare(`${ID}.ZOAU2c`, `${ID}.ZOAU2d`).catch(errfunc);
    console.log(`res=${JSON.stringify(res)}`);
    if (res['rc'] === 0) {
      errfunc('_compare failed');
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
