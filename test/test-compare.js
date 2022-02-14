const assert = require('assert').strict;
const zoau = require('../lib/zoau.js');

const ID = process.env.USER;

describe('Dataset#compare', () => {
  beforeEach(async () => {
    await zoau.datasets.delete(
      `'${ID}.ZOAU2a'`,
      { 'force' : true }
    );
    let zoau2a = await zoau.datasets.create(
      `'${ID}.ZOAU2a'`,
      'SEQ',
      { 'primary_space' : 10 }
    );
    assert.ok(zoau2a);

    let writeRC = await zoau.datasets.write(
      `'${ID}.ZOAU2a'`,
      `This is the first line.\n` +
      `This is the second line.\n` +
      `This is the thrid line.`
    );
    assert.equal(writeRC, 0);

    let copyRC = await zoau.datasets.copy(`'${ID}.ZOAU2a'`, `'${ID}.ZOAU2b'`);
    assert.equal(copyRC, 0);
  });

  it('should not return diff for datasets with identical columns', async () => {
    // compare the columns containing 'This'.
    let result = await zoau.datasets.compare(
      `'${ID}.ZOAU2a'`,
      `'${ID}.ZOAU2b'`,
      {
        'ignore_case' : false,
        'columns' : '1:4'
      }
    );
    assert.equal(result, '');
  });

  afterEach(async () => {
    let zoau2aRC = await zoau.datasets.delete(`'${ID}.ZOAU2a'`);
    assert.equal(zoau2aRC, 0);

    let zoau2bRC = await zoau.datasets.delete(`'${ID}.ZOAU2b'`);
    assert.equal(zoau2bRC, 0);
  });
});
