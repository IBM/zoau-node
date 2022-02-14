let zoau = require('../../lib/zoau.js');

const ID = process.env.USER;
const DSN1 = `${ID}.ZOAU3A`;
const DSN2 = `${ID}.ZOAU3B`;

function errfunc(err) {
  throw err;
}

async function test() {
  try {
    console.log(`Test: delete ${DSN1} and ${DSN2} if any exists`);
    await zoau.datasets.delete(DSN1, {'force': true}).then(console.log).catch(errfunc);
    await zoau.datasets.delete(DSN2, {'force': true}).then(console.log).catch(errfunc);

    let res, line, origlines, expEnd, exp;
    console.log('Test: create 1st dataset');
    let details = { 'primary_space' : 10  };
    await zoau.datasets.create(DSN1, 'SEQ', details).catch(errfunc);

    origlines = `This is the first line.\nThis is the second line.\nThis is the third line.`;
    console.log('Test: write to dataset 3');
    await zoau.datasets.write(DSN1, origlines).then(console.log).catch(errfunc);

    console.log('Test: _search dataset');
    res = await zoau.datasets._search(DSN1, 'the second').catch(errfunc);
    line = res['stdout'].split('\n')[0];
    // FIXME(gabylb) - change back to 80 padding once dgrep bug is fixed; see:
    // https://ibm-systems-z.slack.com/archives/CGRPT7DRP/p1611106365012600
    expEnd = 'This is the second line.'.padEnd(128, ' ');
    if (!line.startsWith(DSN1) || !line.endsWith(expEnd)) {
      errfunc(`search failed: result=${JSON.stringify(res)}`);
    }

    console.log('Test: _search dataset - no match due to case');
    res = await zoau.datasets._search(DSN1, 'the Second').catch(errfunc);
    if (res['rc'] === 0 || res['stdout'].length !== 0 || res['stderr'].length !== 0) {
      errfunc(`_search expected to fail: ${JSON.stringify(res)}`);
    }

    console.log('Test: search dataset - no match due to case but ignore case');
    res = await zoau.datasets.search(DSN1, 'the Second', {'ignore_case' : true}).catch(errfunc);
    // see FIXME above:
    expEnd = 'This is the second line.'.padEnd(128, ' ');
    if (!line.startsWith(DSN1) || !line.endsWith(expEnd)) {
      errfunc(`search expected to pass: result=${JSON.stringify(res)}`);
    }

    console.log(`Test: copy ${DSN1} to ${DSN2}`);
    await zoau.datasets.copy(DSN1, DSN2).then(console.log).catch(errfunc);

    console.log('Test: search datasets - specify all options');
    res = await zoau.datasets.search(`${ID}.ZOAU3?`, 'the Second', {'ignore_case' : true, 'display_lines' : true, 'lines' : 2, 'print_datasets' : true}).catch(errfunc);
    let lines = origlines.split('\n');
    exp = [`${DSN1.padEnd(60,' ')}*:  ${lines[0].padEnd(128,' ')}`,
      `${DSN1.padEnd(60,' ')}2:  ${lines[1].padEnd(128,' ')}`,
      `${DSN1.padEnd(60,' ')}*:  ${lines[2].padEnd(128,' ')}`,
      `${DSN2.padEnd(60,' ')}*:  ${lines[0].padEnd(128,' ')}`,
      `${DSN2.padEnd(60,' ')}2:  ${lines[1].padEnd(128,' ')}`,
      `${DSN2.padEnd(60,' ')}*:  ${lines[2].padEnd(128,' ')}`];

    if (!(res.length === exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`search of ${ID}.ZOAU3? failed, expected:\n${exp}\ngot:\n${res}`);
    }

    console.log('Test: _search datasets - specify all options');
    res = await zoau.datasets._search(`${ID}.ZOAU3?`, 'the Second', {'ignore_case' : true, 'display_lines' : true, 'lines' : 2, 'print_datasets' : true}).catch(errfunc);
    res = res['stdout'].split('\n').slice(0, -1); // search() truncates the trailing \n

    if (!(res.length === exp.length && res.every(function(elem, i) {
      return elem === exp[i].padEnd(80, ' ');
    }))) {
      errfunc(`search of ${ID}.ZOAU3? failed, expected:\n${exp}\ngot:\n${res}`);
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
