'use strict';
const util = require('./util');

async function execute(pgm, pgmArgs, dds, args = {}) {
  let response = await _execute(pgm, pgmArgs, dds, args);
  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }
  return 0;
}

async function _execute(pgm, pgmArgs, dds, args = {}) {
  let options = util.parseUniversalArguments(args);

  options += ` --pgm=${pgm}`;

  if (pgmArgs) {
    options += ` --args='${pgmArgs}'`;
  }

  for (let i = 0; i < dds.length; i++) {
    options += ` ${dds[i].getMvscmdString()}`;
  }

  return util.callZoauLibrary('mvscmd', options);
}

async function executeAuthorized(pgm, pgmArgs, dds, args = {}) {
  let response = await _executeAuthorized(pgm, pgmArgs, dds, args);
  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }
  return 0;
}

async function _executeAuthorized(pgm, pgmArgs, dds, args = {}) {
  let options = util.parseUniversalArguments(args);

  options += ` --pgm=${pgm}`;

  if (pgmArgs) {
    options += ` --args='${pgmArgs}'`;
  }

  for (let i = 0; i < dds.length; i++) {
    options += ` ${dds[i].getMvscmdString()}`;
  }

  return util.callZoauLibrary('mvscmdauth', options);
}

module.exports = {
  execute,
  _execute,
  executeAuthorized: executeAuthorized,
  _executeAuthorized: _executeAuthorized
};
