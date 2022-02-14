const express = require('express');
const router = express.Router();

const ds = require('../lib/zoau.js').datasets;
const zoau = require('../lib/zoau.js');

const fetch = require('node-fetch');

const ID = process.env.USER;
const default_filter = `${ID}.CLIST`;

// REST API
router.get('/list_members/:pds', (req, res) => {
  ds.listMembers(req.params.pds).then(value => {
    value = value.map(function(el) {
      return req.params.pds + '(' + el + ')';
    });
    let data = [];
    value.forEach(function(object){
      data.push({
        name: object,
      });
    });
    res.json(data);
  }, reason => {
    console.error(reason);
    res.json({});
  });
});

router.get('/read_pds/:pds', (req, res) => {
  zoau.datasets.read(req.params.pds).then(function(contents) {
    res.json({'contents': contents});
  }, reason => {
    console.error(reason);
    res.json({});
  });
});

// UI Routes
router.all('/', async (req, res) => {
  let filter = default_filter;
  if (req.body.filter) {
    filter = req.body.filter;
  }

  fetch('http://localhost:3000/list_members/' + filter).then(res2 => res2.json()).then(function(data) {
    let files = {};
    let selected;
    for (let index = 0; index < data.length; ++index) {
      files[data[index].name] = data[index].name;
      selected = files[data[index].name];
    }

    if (req.body.filename) {
      selected = req.body.filename;
    }

    fetch('http://localhost:3000/read_pds/' + selected).then(res3 => res3.json()).then(function(contents) {
      let data = { 'files':files, 'selected':selected, 'contents':contents.contents, 'filter':filter};
      res.render('edit', {
        data: data,
        info: {},
        csrfToken: req.csrfToken()
      });
    });
  });
});

router.post('/build', async (req, res) => {
  let filter = default_filter;
  if (req.body.filter) {
    filter = req.body.filter;
  }

  fetch('http://localhost:3000/list_members/' + filter).then(res2 => res2.json()).then(function(data) {
    let files = {};
    for (let index = 0; index < data.length; ++index) {
      files[data[index].name] = data[index].name;
    }
    let selected = req.body.filename;

    let contents = req.body.contents;
    console.log(req.body.contents);

    // Preprocess form contents
    contents = contents.replace(/(\r\n)/gm, '\n');
    contents = contents.replace(/\s+\n/g, '\n');
    contents = contents.replace(/\\/g, '\\\\');

    // Write contents to selected PDS member
    zoau.datasets.write(selected, contents).then(function(result) {
      let binary = 'demo_' + Math.random().toString(36).substring(7);

      // Compile and run
      let output = require('child_process').execSync('cd /tmp/ && xlc -+ -o ' + binary + " \"//'" + selected + "'\"" + ' && ./' + binary).toString();
      let data = { 'files':files, 'selected':selected, 'contents':contents, 'filter':filter};
      res.render('edit', {
        data: data,
        info: {'output':output},
        csrfToken: req.csrfToken()
      });
    });
  });
});


module.exports = router;
