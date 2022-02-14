const ds = require('../lib/zoau.js').datasets;
ds.listing('SYS1.PARM*', {'detailed':true})
  .then(console.log)
  .catch(console.error);
