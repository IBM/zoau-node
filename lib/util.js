const { exec } = require('child_process');

function cleanShellInput(str) {
  str = str.replace(/"/g, '\\"');
  return str;
}

async function callZoauLibrary(exe, params) {
  let exitPromise;
  let promise = new Promise((resolve, reject) => {
    let json = {};
    let child = exec(exe + ' ' + params, (err, stdout, stderr) => {
      json['stdout'] = stdout;
      json['stderr'] = stderr;
      json['command'] = `${exe} ${params}`;
      resolve(json);
    });
    exitPromise = new Promise((resolve, reject) => {
      child.on('exit', code => {
        resolve(code);
      });
    });
  });
  let obj = await promise;
  obj['rc'] = await exitPromise;
  return obj;
}

function parseUniversalArguments(args = {}) {
  let ret = '';
  if ('debug' in args && args['debug']) {
    ret += '-d ';
  }
  if ('verbose' in args && args['verbose']) {
    ret += '-v ';
  }
  if ('options' in args) {
    ret += args['options'] + ' ';
  }
  return ret;
}

exports.cleanShellInput = cleanShellInput;
exports.callZoauLibrary = callZoauLibrary;
exports.parseUniversalArguments = parseUniversalArguments;
