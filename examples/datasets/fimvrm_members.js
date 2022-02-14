// TODO(gabylb): the test that moves/renames MEM2 to MVED5 fails for me on zoscan2b
// (even when running mmv directly the command line), but this entire test passes
// on torolabc.

let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;
const PDS_SRC = 'SYS1.PARMLIB';
const PDS_TGT1 = `${ID}.ZOAU4A.PDS`;
const PDS_TGT2 = `${ID}.ZOAU4B.PDS`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    console.log(`Test: checking if required ${PDS_SRC} exists`);
    let rc = await zoau.datasets.exists(PDS_SRC).catch(errfunc);
    if (rc !== true) {
      errfunc(`This test assumes dataset ${PDS_SRC} exists, change it to another PDS that exists on your system.`);
    }

    console.log(`Test: listMembers of ${PDS_SRC} to get a member`);
    let res = await zoau.datasets.listMembers(PDS_SRC).catch(errfunc);
    if (res.length <= 0) {
      errfunc(`This test assumes dataset ${PDS_SRC} exists and has at least one member, change it to another such PDS that exists on your system.`);
    }

    let MEM_SRC = `'${PDS_SRC}(${res[0]})'`;

    console.log(`Test: delete ${PDS_TGT1} and ${PDS_TGT2}`);
    await zoau.datasets.delete(PDS_TGT1, {'force':true}).catch(errfunc);
    await zoau.datasets.delete(PDS_TGT2, {'force':true}).catch(errfunc);

    console.log(`Test: create ${PDS_TGT1}`);
    let details = { 'primary_space' : 50 };
    await zoau.datasets.create(PDS_TGT1, 'PDS', details).then(console.log).catch(errfunc);

    console.log(`Test: create ${PDS_TGT2}`);
    details = { 'primary_space' : 50 };
    await zoau.datasets.create(PDS_TGT2, 'PDS', details).then(console.log).catch(errfunc);

    for (let i = 1; i <= 5; i++) {
      let tgt = (i < 4) ? `'${PDS_TGT1}(MEM${i})'` : `'${PDS_TGT1}(ABCD${i})'`;
      console.log(`Test: copy ${MEM_SRC} to ${tgt}`);
      await zoau.datasets.copy(MEM_SRC, tgt).catch(errfunc);
    }
    for (let i = 1; i <= 5; i++) {
      let tgt = (i < 4) ? `'${PDS_TGT2}(ME${i})'` : `'${PDS_TGT2}(ABC${i})'`;
      console.log(`Test: copy ${MEM_SRC} to ${tgt}`);
      await zoau.datasets.copy(MEM_SRC, tgt).catch(errfunc);
    }

    console.log(`Test: listMembers of ${PDS_TGT1}`);
    res = await zoau.datasets.listMembers(PDS_TGT1).catch(errfunc);
    let exp = [ 'ABCD4', 'ABCD5', 'MEM1', 'MEM2', 'MEM3' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem == exp[i];
    }))) {
      errfunc(`unexpected members: found ${res}, expected ${exp}`);
    }

    console.log(`Test: listMembers of ${PDS_TGT2}`);
    res = await zoau.datasets.listMembers(PDS_TGT2).catch(errfunc);
    exp = [ 'ABC4', 'ABC5', 'ME1', 'ME2', 'ME3' ];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem == exp[i];
    }))) {
      errfunc(`unexpected members: found ${res}, expected ${exp}`);
    }

    console.log(`Test: findMember MEM1 in ${PDS_TGT1}`);
    res = await zoau.datasets.findMember('ABC4', PDS_TGT2).catch(errfunc);
    if (res != PDS_TGT2) {
      errfunc(`findMember: ABC4 found in ${res}, expected ${PDS_TGT2}`);
    }

    console.log(`Test: findMember MEM1 in ${PDS_TGT1} and ${PDS_TGT2}`);
    res = await zoau.datasets.findMember('MEM1', `${PDS_TGT1}:${PDS_TGT2}`).catch(errfunc);
    if (res !== PDS_TGT1) {
      errfunc(`findMember: MEM2 found in ${res}, expected ${PDS_TGT1}`);
    }

    console.log(`Test: findMember MEM2 in ${PDS_TGT2} and ${PDS_TGT1}`);
    res = await zoau.datasets.findMember('MEM2', `${PDS_TGT2}:${PDS_TGT1}`).catch(errfunc);
    if (res !== PDS_TGT1) {
      errfunc(`findMember: MEM2 found in ${res}, expected ${PDS_TGT1}`);
    }

    console.log(`Test: moveMember (rename) MEM2 in ${PDS_TGT1} to MVED5`);
    await zoau.datasets.moveMember(PDS_TGT1, 'MEM2', 'MVED5').catch(errfunc);

    console.log(`Test: moveMember non-existent MEM222 in ${PDS_TGT1} to XY`);
    rc = -1;
    try {
      await zoau.datasets.moveMember(PDS_TGT1, 'MEM222', 'XY');
    } catch(err) {
      console.log(err);
      rc = 0;
    }
    if (rc != 0) {
      errfunc("moveMember expected to throw but didn't.");
    }

    console.log(`Test: moveMember non-existent MEM222 in ${PDS_TGT1} to XY (use raw API)`);
    res = await zoau.datasets._moveMember(PDS_TGT1, 'MEM222', 'XY').catch(errfunc);
    console.log(`res rc=${res['rc']}`);
    console.log(`res stdout=${res['stdout']}`);
    console.log(`res stderr=${res['stderr']}`);
    console.log(`res command=${res['command']}`);
    if (res['rc'] === 0) {
      errfunc(`invalid _moveMember returned 'exit' === 0, expected non-0`);
    }

    res = await zoau.datasets.findMember('MVED5', `${PDS_TGT2}:${PDS_TGT1}`).catch(errfunc);
    if (res !== PDS_TGT1) {
      errfunc(`findMember failed, MVED5 found in ${res}, expected ${PDS_TGT1}`);
    }

    console.log(`Test: listMembers of ${PDS_TGT1}`);
    res = await zoau.datasets.listMembers(PDS_TGT1).catch(errfunc);
    exp = ['ABCD4','ABCD5','MEM1','MEM3','MVED5'];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem == exp[i];
    }))) {
      errfunc(`unexpected members after moveMember: found ${res}, expected ${exp}`);
    }

    console.log(`Test: deleteMembers MEM1, MEM3 in ${PDS_TGT1}`);
    await zoau.datasets.deleteMembers(`${PDS_TGT1}(MEM?)`).catch(errfunc);

    console.log(`Test: listMembers of ${PDS_TGT1}`);
    res = await zoau.datasets.listMembers(PDS_TGT1).catch(errfunc);
    exp = ['ABCD4','ABCD5','MVED5'];
    if (!(res.length == exp.length && res.every(function(elem, i) {
      return elem == exp[i];
    }))) {
      errfunc(`unexpected members after deleteMembers: found ${res}, expected ${exp}`);
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
