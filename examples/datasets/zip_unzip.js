const zoau = require('../../lib/zoau.js');
const fs = require('fs');

const ID = process.env.USER;
const HLQ = ID;
const PDS_SRC = 'SYS1.PARMLIB';
const PDS_TGT1 = `${ID}.ZOAU6A.PDS`;
const PDS_TGT1I = `${ID}.ZOAU6?.PDS`;
const PDS_TGT2 = `${ID}.ZOAU6B.PDS`;

const hrTime = process.hrtime();
const nownano = hrTime[0] * 1000000000 + hrTime[1];
const ZIP1 = `/tmp/${ID}.${nownano}.zip1`;
const ZIPDS1 = `${ID}.ZOAU4A.ZIP`;

function errfunc(err) {
  throw err;
}

async function delIfExists(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(ZIP1);
  }
}

async function verifyDS(exp) {
  console.log(`Test: listMembers of ${HLQ}`);
  let res = await zoau.datasets.listMembers(PDS_TGT1).catch(errfunc);
  if (!(res.length == exp.length && res.every(function(elem, i) {
    return elem == exp[i];
  }))) {
    errfunc(`unexpected members after unzip: found ${res}, expected ${exp}`);
  }
}

async function verifyxDS(exp) {
  console.log(`Test: listMembers of ${HLQ}`);
  let res = await zoau.datasets.listMembers(PDS_TGT1).catch(errfunc);
  if (!(res.length == exp.length && res.every(function(elem, i) {
    return elem == exp[i];
  }))) {
    errfunc(`unexpected members after unzip: found ${res}, expected ${exp}`);
  }
}

async function deleteDS(ds) {
  console.log(`Test: delete ${ds}`);
  await zoau.datasets.delete(ds).catch(errfunc);
}

async function dispResult(res) {
  console.log(`res rc=${res['rc']}`);
  console.log(`res stdout=${res['stdout']}`);
  console.log(`res stderr=${res['stderr']}`);
  console.log(`res command=${res['command']}`);
}

async function test() {
  try {
    let res, exp, args;

    console.log(`Test: checking if required ${PDS_SRC} exists`);
    let rc = await zoau.datasets.exists(PDS_SRC).catch(errfunc);
    if (rc !== true) {
      errfunc(`This test assumes dataset ${PDS_SRC} exists, change it to another PDS that exists on your system.`);
    }

    console.log(`Test: listMembers of ${PDS_SRC} to get a member`);
    res = await zoau.datasets.listMembers(PDS_SRC).catch(errfunc);
    if (res.length <= 0) {
      errfunc(`This test assumes dataset ${PDS_SRC} exists and has at least one member, change it to another such PDS that exists on your system.`);
    }

    let MEM_SRC = `'${PDS_SRC}(${res[0]})'`;

    if (await zoau.datasets.exists(PDS_TGT1).catch(errfunc)) {
      deleteDS(PDS_TGT1);
    }
    if (await zoau.datasets.exists(PDS_TGT2).catch(errfunc)) {
      deleteDS(PDS_TGT2);
    }

    console.log(`Test: create ${PDS_TGT1}`);
    let details = { 'primary_space' : 50 };
    let dsdet = await zoau.datasets.create(PDS_TGT1, 'PDS', details).catch(errfunc);
    let volume = dsdet.toDict()['volume'];
    console.log(`Volume = ${volume}`);

    console.log(`Test: create ${PDS_TGT2}`);
    details = { 'primary_space' : 50 };
    let ds = await zoau.datasets.create(PDS_TGT2, 'PDS', details).catch(errfunc);
    console.log(ds.toDict());

    for (let i = 1; i <= 3; i++) {
      let tgt = (i < 4) ? `'${PDS_TGT1}(MEM${i})'` : `'${PDS_TGT1}(ABCD${i})'`;
      console.log(`Test: copy ${MEM_SRC} to ${tgt}`);
      await zoau.datasets.copy(MEM_SRC, tgt).catch(errfunc);
    }

    for (let i = 1; i <= 3; i++) {
      let tgt = (i < 4) ? `'${PDS_TGT2}(ME${i})'` : `'${PDS_TGT2}(ABC${i})'`;
      console.log(`Test: copy ${MEM_SRC} to ${tgt}`);
      await zoau.datasets.copy(MEM_SRC, tgt).catch(errfunc);
    }

    console.log(`Test: zip ${PDS_TGT1}`);
    await delIfExists(ZIP1);
    await zoau.datasets.zip(ZIP1, PDS_TGT1).catch(errfunc);
    if (!fs.existsSync(ZIP1)) {
      errfunc(`expected zip file not found: ${ZIP1}`);
    }
    await deleteDS(PDS_TGT1);

    console.log(`Test: unzip ${ZIP1}`);
    await zoau.datasets.unzip(ZIP1, HLQ).catch(errfunc);
    exp = [ 'MEM1', 'MEM2', 'MEM3' ];
    await verifyDS(exp);

    // ---------------
    console.log(`Test: zip ${ZIP1} with size and overwrite (-s5M -o)`);
    args = {
      'size' : '5M',
      'dataset' : false,
      'volume' : false, // TODO(gabylb) - test with true and specify volume (obtained above)
      'force' : false,  // not authorized, confirmed -f does get passed.
      'overwrite' : true,
    };
    res = await zoau.datasets._zip(ZIP1, PDS_TGT1, args).catch(errfunc);
    dispResult(res);
    if (res['rc'] != 0) {
      errfunc(res['stderr']);
    }

    await deleteDS(PDS_TGT1);
    console.log(`Test: unzip ${ZIP1}`);
    await zoau.datasets.unzip(ZIP1, HLQ).catch(errfunc);
    exp = [ 'MEM1', 'MEM2', 'MEM3' ];
    await verifyDS(exp);

    // ---------------
    console.log(`Test: zip ${PDS_TGT1} and ${PDS_TGT2} to dataset $ZIPDS1`);
    args = {
      'dataset' : true,
      'overwrite' : true,
    };
    res = await zoau.datasets._zip(ZIPDS1, `${PDS_TGT1} ${PDS_TGT2}`, args).catch(errfunc);
    dispResult(res);
    if (res['rc'] != 0) {
      errfunc(res['stderr']);
    }

    await deleteDS(PDS_TGT1);
    if (await zoau.datasets.exists(PDS_TGT2).catch(errfunc)) {
      await deleteDS(PDS_TGT2);
    }
    console.log(`Test: unzip from dataset ${ZIPDS1}, args should be -D -o -i"x" -e"y"`);
    args = {
      'dataset' : true,
      'overwrite' : true,
      'include' : `${PDS_TGT1I}`,
      'exclude' : `${PDS_TGT2}`,
    };

    await zoau.datasets.unzip(ZIPDS1, HLQ, args).catch(errfunc);
    exp = [ 'MEM1', 'MEM2', 'MEM3' ];
    await verifyxDS(exp);
    await deleteDS(PDS_TGT1);
    await deleteDS(ZIPDS1);
    if (await zoau.datasets.exists(PDS_TGT2).catch(errfunc)) {
      errfunc(`unzip shouldn't have extracted ${PDS_TGT2} as it was excluded.}`);
    }

    // TODO(gabylb): test remaining args for both zip and unzip

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
