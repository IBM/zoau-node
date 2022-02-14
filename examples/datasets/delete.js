let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;
const DSN1 = `${ID}.ZOAU3A`;
const DSN2 = `${ID}.ZOAU3B`;
const DSN3 = `${ID}.ZOAU3C`;
const DSN4 = `${ID}.ZOAU3D`;
const DSN5 = `${ID}.ZOAU3E`;

const DSNPATTERN = `${ID}.ZOAU3*`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    console.log(DSNPATTERN);

    console.log('Test: delete all datasets matching ZOAU3* pattern, if any');
    await zoau.datasets.delete(DSNPATTERN, {'force': true}).then(console.log).catch(errfunc);

    console.log('Test: create 5 datasets');
    let details = { 'primary_space' : 10  };
    let res, exp;
    await zoau.datasets.create(DSN1, 'SEQ', details).then(console.log).catch(errfunc);
    await zoau.datasets.create(DSN2, 'SEQ', details).then(console.log).catch(errfunc);
    await zoau.datasets.create(DSN3, 'SEQ', details).then(console.log).catch(errfunc);
    await zoau.datasets.create(DSN4, 'SEQ', details).then(console.log).catch(errfunc);
    await zoau.datasets.create(DSN5, 'SEQ', details).then(console.log).catch(errfunc);

    console.log('Test: list created datasets matching ZOAU3* pattern');
    res = await zoau.datasets.listing(DSNPATTERN, {'detailed' : true}).catch(errfunc);
    exp = [ DSN1, DSN2, DSN3, DSN4, DSN5 ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      console.log(`TODO: ${elem['name']}`); return elem['name'] === exp[i];
    }))) {
      errfunc(`unexpected dataset in listing: found ${JSON.stringify(res)}, expected ${exp}`);
    }

    console.log('Test: delete 1st dataset');
    await zoau.datasets.delete(DSN1).then(console.log).catch(errfunc);

    console.log('Test: list remaining created datasets');
    res = await zoau.datasets.listing(DSNPATTERN, {'detailed' : true}).catch(errfunc);
    exp = [ DSN2, DSN3, DSN4, DSN5 ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem['name'] === exp[i];
    }))) {
      errfunc(`unexpected dataset in listing: found ${JSON.stringify(res)}, expected ${exp}`);
    }

    console.log('Test: delete remaining 4 datasets matching ZOAU3* pattern');
    await zoau.datasets.delete(DSNPATTERN).then(console.log).catch(errfunc);

    console.log('Test: empty list of created datasets');
    res = await zoau.datasets.listing(DSNPATTERN, {'detailed' : true}).catch(errfunc);
    if (res.length !== 0) {
      errfunc(`expected all datasets in DSNPATTERN to be deleted, found ${res.length} still exist`);
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
