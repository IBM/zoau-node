const dataset = require('../../lib/zoau').datasets;
const mvscmd = require('../../lib/zoau').mvscmd;
const DDStatement = require('../../lib/types').DDStatement;
const DatasetDefinition = require('../../lib/types').DatasetDefinition;
const assert = require('assert');

const ID = process.env.USER;
let HLQ,
    dsA,
    dsB,
    dsC,
    dsOpt,
    dsOutDD,
    dsOut,
    dsAuthIn1,
    dsAuthIn2;

function errfunc(err) {
  throw err;
}

async function setUp() {
  HLQ = `${await dataset.hlq()}.ZOAUTEST`;
  await dataset.delete(`${HLQ}.*`, {'force':true});
  dsA = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsB = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsC = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsOpt = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsOutDD = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsOut = await dataset.create(await dataset.tmpName(HLQ), 'SEQ');
  dsAuthIn1 = await dataset.create(await dataset.tmpName(HLQ), 'SEQ', {'format': 'VB'});
  dsAuthIn2 = await dataset.create(await dataset.tmpName(HLQ), 'SEQ', {'format': 'VB'});

  await dsA.write('TEST');
  await dsB.write('TEST');
  await dsC.write('NOTEST');
  await dsOpt.write('   CMPCOLM 1:72');
}

async function testExecuteSuccessfulExecution() {
  let dds = [];
  dds.push(new DDStatement('newdd', dsA.name));
  dds.push(new DDStatement('olddd', dsB.name));
  dds.push(new DDStatement('sysin', dsOpt.name));
  dds.push(new DDStatement('outdd', dsOutDD.name));
  let rc = await mvscmd.execute('isrsupc', 'DELTAL,LINECMP', dds).catch(errfunc);
  console.log(`rc = ${rc}\n`);

  let res = await mvscmd._execute('isrsupc', 'DELTAL,LINECMP', dds).catch(errfunc);
  console.log(`res = ${JSON.stringify(res)}\n`);
}

async function testExecuteFailedExecution() {
  let dds = [];
  dds.push(new DDStatement('newdd', dsA.name));
  dds.push(new DDStatement('olddd', dsC.name));
  dds.push(new DDStatement('sysin', dsOpt.name));
  dds.push(new DDStatement('outdd', dsOutDD.name));
  let pass = false;
  try {
    await mvscmd.execute('isrsupc', 'DELTAL,LINECMP', dds);
  } catch(err) {
    let json = JSON.parse(err.message);
    console.log(`res = ${err.message}\n`);
    assert.equal(json['rc'], 1);
    pass = true;
  }
  assert.equal(pass, true);

  let res = await mvscmd._execute('isrsupc', 'DELTAL,LINECMP', dds);
  console.log(`res = ${JSON.stringify(res)}\n`);
  assert.equal(res['rc'], 1);
}

async function testExecuteAuthorizedSuccessfulExecution() {
  let dsn = `${ID}.ZOAUTEST.MVSCMD.AUTH.OUT`;
  await dataset.delete(dsn, {'force': true}).catch(errfunc);

  let dds = [];
  dds.push(new DDStatement('sysin', dsAuthIn1.name));
  dds.push(new DDStatement('sysprint', dsOut.name));
  dds.push(new DDStatement('amsdump', 'dummy'));
  let res = await mvscmd._executeAuthorized('IDCAMS', '', dds).catch(errfunc);
  console.log(`res = ${JSON.stringify(res)}\n`);
  assert.equal(res['rc'], 0);
}

async function testExecuteAuthorizedNewDisposition() {
  await dsAuthIn1.write(` LISTCAT ENTRIES(${ID}.*)`);
  let dsn = `${ID}.ZOAUTEST.MVSCMD.AUTH.OUT`;
  await dataset.delete(dsn, {'force': true}).catch(errfunc);

  let dds = [];
  dds.push(new DDStatement('sysin', dsAuthIn1.name));
  dds.push(new DDStatement('sysprint', new DatasetDefinition(dsn, {
    'disposition': 'NEW',
    'primary': 10,
    'primary_unit': 'TRK',
    'secondary': 2,
    'secondary_unit': 'TRK',
    'type': 'SEQ'
  })));
  dds.push(new DDStatement('asmdump', 'dummy'));

  // test also return of raw data (from _function)
  let res = await mvscmd._executeAuthorized('IDCAMS', '', dds);
  console.log(`res = ${JSON.stringify(res)}\n`);
  assert.equal(res['rc'], 0); // if no catalog, rc would be 4

  let contents = await dataset.read(dsn);
  console.log(`content of ${dsn}=<\n${contents}\n`);
}

async function testExecuteAuthorizedNewDispositionDeleteInputDSOnSuccessOrFailure() {
  await dsAuthIn1.write(` LISTCAT ENTRIES(${ID}.*)`);
  let dsn = `${ID}.ZOAUTEST.MVSCMD.AUTH.OUT`;
  await dataset.delete(dsn, {'force': true});
  let dds = [];
  dds.push(new DDStatement('sysin', new DatasetDefinition(dsAuthIn1.name, {
    'disposition': 'SHR',
    'normal_disposition': 'DELETE',
    'conditional_disposition': 'DELETE'
  })));
  dds.push(new DDStatement('sysprint', new DatasetDefinition(dsn, {'disposition': 'NEW', 'primary': 10, 'primary_unit': 'TRK', 'secondary': 2, 'secondary_unit': 'TRK', 'type': 'SEQ'})));
  dds.push(new DDStatement('asmdump', 'dummy'));
  let res = await mvscmd._executeAuthorized('IDCAMS', '', dds);
  console.log(`res = ${JSON.stringify(res)}\n`);
  assert.equal(res['rc'], 0); // if no catalog, rc would be 4
  assert.equal(await dataset.exists(dsAuthIn1.name), false);
}

async function testExecuteAuthorizedOutputToPDSMember() {
  let dsn = `${ID}.ZOAUTEST.MVSCMD.AUTH.OUT`;
  await dataset.delete(dsn, {'force': true});
  await dataset.create(dsn, 'PDS');
  await dsAuthIn2.write(` LISTCAT ENTRIES(${ID}.*)`);
  let dds = [];
  dds.push(new DDStatement('sysin', new DatasetDefinition(dsAuthIn2.name, {'disposition': 'SHR'})));
  dds.push(new DDStatement('sysprint', `${dsn}(MEM1)`));
  dds.push(new DDStatement('asmdump', 'dummy'));
  let res = await mvscmd._executeAuthorized('IDCAMS', '', dds);
  console.log(`res = ${JSON.stringify(res)}\n`);
  assert.equal(res['rc'], 0); // if no catalog, rc would be 4
  let contents = await dataset.read(`${dsn}(MEM1)`);
  assert.equal(contents.includes('THE NUMBER OF ENTRIES PROCESSED WAS'), true);
}

async function test() {
  try {
    await setUp();
    await testExecuteSuccessfulExecution();
    await testExecuteFailedExecution();
    await testExecuteAuthorizedSuccessfulExecution();
    await testExecuteAuthorizedNewDisposition();
    await testExecuteAuthorizedNewDispositionDeleteInputDSOnSuccessOrFailure();
    await testExecuteAuthorizedOutputToPDSMember();
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
