const { execFile } = require('child_process');

if (process.platform !== 'os390') {
  console.log(`zoau-node ERR! this module is for use on z/OS only: wanted: ` +
              `os390 (current: ${process.platform})`);
  process.exit(1);
}

execFile('zoaversion', (error, stdout, stderr) => {
  if (error || stderr || !stdout) {
    if (String(stderr).match(/CEE3201S.+call_shared_function.+/s)) {
      console.log(`zoau-node ERR! ZOA Utilities is not correctly installed ` +
                  `on your system (please ensure you have added ZOA ` +
                  `Utilities to the LIBPATH environment variable)`);
    } else {
      console.log(`zoau-node ERR! ZOA Utilities is not installed on your ` +
                  `system (please ensure you have added ZOA Utilities to ` +
                  `the PATH environment variable)`);
    }

    process.exit(1);
  }

  let matches = stdout.match(/.+(V([0-9]+)\.([0-9]+)\.([0-9]+))/);
  let version = matches[1];
  let major = parseInt(matches[2]);
  let minor = parseInt(matches[3]);
  let patch = parseInt(matches[4]);

  // require >= V1.1.0.
  if (major < 1 ||
      major === 1 && minor < 1 ||
      major === 1 && minor === 1 && patch < 0) {
    console.log(`zoau-node ERR! version of ZOA Utilities installed on your ` +
                `system is too low: wanted: >= V1.1.0 (current: ${version})`);
    process.exit(1);
  }
});

execFile('mvscmdauth', (error, stdout, stderr) => {
  // output is on stderr instead of stdout, and return code is non-0.
  if (stdout || !stderr) {
    console.log(`zoau-node ERR! ZOA Utilities is not correctly installed on ` +
                `your system`);
    process.exit(1);
  }

  if (String(stderr).match(/^MVSCMD\(1\)/)) {
    console.log(`zoau-node ERR! ZOA Utilities is not correctly installed ` +
                `on your system (please ensure the APF authorization bit is ` +
                `on for the mvscmdauth and mvscmdauthhelper utility)`);
    process.exit(1);
  }
});
