'use strict';

const util = require('./util');

class Dataset {
  constructor(name, recfm, lrecl, blockSize, dsorg, volume, lastReferenced,
              usedSpace, totalSpace) {
    this._name = name;
    this.recfm = recfm || 0;
    this.lrecl = lrecl || 0;
    this.blockSize = blockSize || 0;
    this.dsorg = dsorg || 0;
    this.volume = volume || 0;
    this.lastReferenced = lastReferenced || 0;
    this.usedSpace = usedSpace || 0;
    this.totalSpace = totalSpace || 0;
  }

  get name() {
    return this._name;
  }

  toDict() {
    return {
      'name': this.name,
      'recfm': this.recfm,
      'lrecl': this.lrecl,
      'dsorg': this.dsorg,
      'volume': this.volume,
      'block_size': this.blockSize,
      'last_referenced': this.lastReferenced,
      'used_space': this.usedSpace,
      'total_space': this.totalSpace
    };
  }

  static fromDict(arr) {
    return new Dataset(arr['name'],
                       arr['recfm'],
                       arr['lrecl'],
                       arr['dsorg'],
                       arr['volume'],
                       arr['block_size'],
                       arr['last_referenced'],
                       arr['used_space'],
                       arr['total_space']);
  }

  async read(args = {}) {
    return await read(this.name, args);
  }

  async write(content, append = false, args = {}) {
    return await write(this.name, content, append, args);
  }

  async delete(args = {}) {
    return await delete(this.name);
  }
}

async function listing(pattern, args = {}) {
  let response = await _listing(pattern, args);
  let listToReturn = [];

  if (response['rc'] === 1) {
    return [];
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  let unparsedDatasets = response['stdout']
                            .split('\n')
                            .filter(word => word != '');
  for (let dataset of unparsedDatasets) {
    let datasetToParse = dataset.split(/\s+/);

    if (datasetToParse.length == 1) {
      listToReturn.push(new Dataset(datasetToParse[0]));
      continue;
    }

    if (datasetToParse.length == 9) {
      listToReturn.push(new Dataset(datasetToParse[0],
                                    datasetToParse[3],
                                    datasetToParse[4],
                                    datasetToParse[5],
                                    datasetToParse[2],
                                    datasetToParse[6],
                                    datasetToParse[1],
                                    datasetToParse[7],
                                    datasetToParse[8]));
    } else {
      response['stderr'] = 'Unexpected number of elements to parse in dataset';
      throw new Error(JSON.stringify(response));
    }
  }
  return listToReturn;
}

async function _listing(pattern, args = {}) {
  let options = util.parseUniversalArguments(args);
  if ('migrated' in args && args['migrated']) {
    options += ' -m';
  }

  if ('detailed' in args && args['detailed']) {
    options += ' -l -u -s -b';
  }

  options += ' "' + util.cleanShellInput(pattern) + '"';
  return util.callZoauLibrary('dls', options);
}

async function _listMembers(pattern, args = {}) {
  let options = util.parseUniversalArguments(args);
  options += ' "' + util.cleanShellInput(pattern) + '"';
  return util.callZoauLibrary('mls', options);
}

async function listMembers(pattern, args = {}) {
  let response = await _listMembers(pattern, args);

  if (response['rc'] === 1) {
    return [];
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].slice(0, -1).split('\n');
}

async function exists(dataset, args = {}) {
  let listArr = await listing(dataset, args);
  return listArr.length > 0;
}

async function _read(dataset, args = {}) {
  dataset = util.cleanShellInput(dataset);
  let options = util.parseUniversalArguments(args);

  if ('tail' in args) {
    options += ' -n -' + args['tail'];
  } else if ('from_line' in args) {
    options += ' -n +' + args['from_line'];
  } else {
    options += ' -n +1';
  }

  options += ' ' + "'" + dataset + "'";

  return util.callZoauLibrary('dtail', options);
}

async function read(dataset, args = {}) {
  let response = await _read(dataset, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].slice(0, -1);
}

async function _copy(source, target, args = {}) {
  source = util.cleanShellInput(source);
  target = util.cleanShellInput(target);

  let options = util.parseUniversalArguments(args);
  options += `${source} ${target}`;

  return util.callZoauLibrary('dcp', options);
}

async function copy(source, target, args = {}) {
  let response = await _copy(source, target, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['rc'];
}

async function _move(source, target, args = {}) {
  let options = util.parseUniversalArguments(args);

  source = util.cleanShellInput(source);
  target = util.cleanShellInput(target);

  options += ' ' + source + ' ' + target;

  return util.callZoauLibrary('dmv', options);
}

async function move(source, target, args = {}) {
  let response = await _move(source, target, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['rc'];
}

async function _create(name, type, args = {}) {
  let options = util.parseUniversalArguments(args);
  options += ' -t' + type;

  if ('primary_space' in args) {
    options += ' -s' + args['primary_space'];
  }

  if ('secondary_space' in args) {
    options += ' -c' + args['secondary_space'];
  }

  if ('block_size' in args) {
    options += ' -B' + args['block_size'];
  }

  if ('record_format' in args) {
    options += ' -r' + args['record_format'];
  }

  if ('storage_class_name' in args) {
    options += ' -c' + args['storage_class_name'];
  }

  if ('data_class_name' in args) {
    options += ' -D' + args['data_class_name'];
  }

  if ('management_class_name' in args) {
    options += ' -m' + args['management_class_name'];
  }

  if ('record_length' in args) {
    options += ' -l' + args['record_length'];
  }

  if ('key_length' in args && 'key_offset' in args) {
    options += ' -k' + args['key_length'] + ':' + args['key_offset'];
  }

  if ('directory_blocks' in args) {
    options += ' -b' + args['directory_blocks'];
  }

  if ('volumes' in args) {
    options += ' -V' + args['volumes'];
  }

  options += ' ' + name;

  return util.callZoauLibrary('dtouch', options);
}

async function create(name, type = 'pds', args = {}) {
  let response = await _create(name, type, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  let dslist = await listing(name, {'detailed' : true});
  return dslist[0];
}

async function _write(dataset, content, append = false, args = {}) {
  dataset = util.cleanShellInput(dataset);
  content = util.cleanShellInput(content);

  let options = util.parseUniversalArguments(args);
  options += (append ? '-a ' : '') + `"${content}" "${dataset}"`;

  return util.callZoauLibrary('decho', options);
}

async function write(dataset, content, append = false, args = {}) {
  let response = await _write(dataset, content, append, args);

  if (response['rc'] != 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

async function _compare(source, target, args = {}) {
  source = util.cleanShellInput(source);
  target = util.cleanShellInput(target);

  let options = util.parseUniversalArguments(args);

  if ('lines' in args && args['lines']) {
    options += ' -C' + args['lines'];
  }

  if ('columns' in args && args['columns']) {
    options += ' -c' + args['columns'];
  }

  if ('ignore_case' in args && args['ignore_case']) {
    options += ' -i';
  }

  options += ' "' + source + '" "' + target + '"';
  return util.callZoauLibrary('ddiff', options);
}

async function compare(source, target, args = {}) {
  let response = await _compare(source, target, args);

  if (response['stderr'].length != 0) {
    throw new Error(JSON.stringify(response));
  }

  if (response['stdout'].length === 0) {
    return null;
  }
  return response['stdout'];
}

async function _search(dataset, value, args = {}) {
  dataset = util.cleanShellInput(dataset);
  value = util.cleanShellInput(value);

  let options = util.parseUniversalArguments(args);

  if ('lines' in args && args['lines']) {
    options += ' -C' + args['lines'];
  }

  if ('ignore_case' in args && args['ignore_case']) {
    options += ' -i';
  }

  if ('display_lines' in args && args['display_lines']) {
    options += ' -n';
  }

  if ('print_datasets' in args && args['print_datasets']) {
    options += ' -v';
  }

  options += ' "' + value + '" "' + dataset + '"';

  return util.callZoauLibrary('dgrep', options);
}

async function search(dataset, value, args = {}) {
  let response = await _search(dataset, value, args);

  if (response['rc'] === 1) {
    return [];
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].slice(0, -1).split('\n');
}

async function _deletes(dataset, args = {}) {
  dataset = util.cleanShellInput(dataset);

  let options = util.parseUniversalArguments(args);
  options += ' -v "' + dataset + '"';

  return util.callZoauLibrary('drm', options);
}

async function deletes(dataset, args = {}) {
  let response = await _deletes(dataset, args);

  // TODO(gabylb): check of "force" not in Python's delete()
  if (response['rc'] === 1 && 'force' in args && args['force']) {
    return 0;
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

async function _deleteMembers(pattern, args = {}) {
  pattern = util.cleanShellInput(pattern);

  let options = util.parseUniversalArguments(args);
  options += ' "' + pattern + '"';

  return util.callZoauLibrary('mrm', options);
}

async function deleteMembers(pattern, args = {}) {
  let response = await _deleteMembers(pattern, args);

  // TODO(gabylb): check of "force" not in Python's delete_members()
  if (response['rc'] === 1 && 'force' in args && args['force']) {
    return 0;
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

async function _moveMember(dataset, source, target, args = {}) {
  dataset = util.cleanShellInput(dataset);
  source = util.cleanShellInput(source);
  target = util.cleanShellInput(target);

  let options = util.parseUniversalArguments(args);
  options += ` "${dataset}" "${source}" "${target}"`;
  return util.callZoauLibrary('mmv', options);
}

async function moveMember(dataset, source, target, args = {}) {
  let response = await _moveMember(dataset, source, target, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

async function _findMember(member, concatentation, args = {}) {
  member = util.cleanShellInput(member);
  concatentation = util.cleanShellInput(concatentation);

  let options = util.parseUniversalArguments(args);
  options += ' "' + member + '" "' + concatentation + '"';

  return util.callZoauLibrary('dwhence', options);
}

async function findMember(member, concatentation, args = {}) {
  let response = await _findMember(member, concatentation, args = {});

  // TODO(gabylb): dwhence returns either 0 (found) or 8 (not found or invalid
  // dataset, etc) with no error message.

  if (!response['stdout']) {
    return null;
  }

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].slice(0, -1);
}

async function _hlq(args = {}) {
  let options = util.parseUniversalArguments(args);
  return util.callZoauLibrary('hlq', options);
}

async function hlq(args = {}) {
  let response = await _hlq(args);

  if (response['rc'] !== 0 || !response['stdout']) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].trimEnd();
}

async function _tmpName(hlq = null, args = {}) {
  let options = util.parseUniversalArguments(args);
  if (hlq) {
    options += ' ' + hlq;
  }

  return util.callZoauLibrary('mvstmp', options);
}

async function tmpName(hlq = null, args = {}) {
  let response = await _tmpName(hlq, args);

  if (response['rc'] !== 0 || !response['stdout']) {
    throw new Error(JSON.stringify(response));
  }

  return response['stdout'].trimEnd();
}

async function _findReplace(dataset, find, replace, args = {}) {
  let options = util.parseUniversalArguments(args);
  options += ` "s/${find}/${replace}/g" ${dataset}`;

  return util.callZoauLibrary('dsed', options);
}

async function findReplace(dataset, find, replace, args = {}) {
  let response = await _findReplace(dataset, find, replace, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return response['rc'];
}

async function _zip(file, target, args = {}) {
  file = util.cleanShellInput(file);
  target = util.cleanShellInput(target);

  let options = util.parseUniversalArguments(args);

  if ('size' in args) {
    options += ` -s${args['size']}`;
  }

  if ('volume' in args && args['volume']) {
    options += ' -V';
  }

  if ('force' in args && args['force']) {
    options += ' -f';
  }

  if ('overwrite' in args && args['overwrite']) {
    options += ' -o';
  }

  if ('dataset' in args && args['dataset']) {
    options += ' -D';
  }

  if ('exclude' in args) {
    options += ` -e"${args['exclude']}"`;
  }

  if ('storage_class_name' in args) {
    options += ` -S"${args['storage_class_name']}"`;
  }

  if ('management_class_name' in args) {
    options += ` -m"${args['management_class_name']}"`;
  }

  if ('dest_volume' in args) {
    options += ` -t"${args['dest_volume']}"`;
  }

  options += ` "${file}" "${target}"`;

  if ('src_volume' in args) {
    options += ` "${args['src_volume']}"`;
  }

  return util.callZoauLibrary('dzip', options);
}

async function zip(file, target, args = {}) {
  let response = await _zip(file, target, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

async function _unzip(file, hlq, args = {}) {
  file = util.cleanShellInput(file);
  hlq = util.cleanShellInput(hlq);

  let options = util.parseUniversalArguments(args);

  if ('size' in args) {
    options += ` -s${args['size']}`;
  }

  if ('volume' in args && args['volume']) {
    options += ' -V';
  }

  if ('dataset' in args && args['dataset']) {
    options += ' -D';
  }

  if ('overwrite' in args && args['overwrite']) {
    options += ' -o';
  }

  if ('sms_for_tmp' in args && args['sms_for_tmp']) {
    options += ' -u';
  }

  if ('include' in args) {
    options += ` -i"${args['include']}"`;
  }

  if ('exclude' in args) {
    options += ` -e"${args['exclude']}"`;
  }

  if ('storage_class_name' in args) {
    options += ` -S"${args['storage_class_name']}"`;
  }

  if ('management_class_name' in args) {
    options += ` -m"${args['management_class_name']}"`;
  }

  if ('dest_volume' in args) {
    options += ` -t"${args['dest_volume']}"`;
  }

  options += ` -H${hlq} "${file}"`;

  if ('volume' in args) {
    options += ` "${args['volume']}"`;
  } else if ('src_volume' in args) {
    options += ` "${args['src_volume']}"`;
  }

  return util.callZoauLibrary('dunzip', options);
}

async function unzip(file, hlq, args = {}) {
  let response = await _unzip(file, hlq, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

/* TODO(gabylb): datasets.py defines lineinfile with the following arguments:
(dataset, line, state=true, regex=null, ins_aft=null, ins_bef=null, args={})

Here I moved state, ins_aft and ins_bef to args - since JS doesn't support
named parameters.

Also, in datasets.py, there's no _lineinfile(), and lineinfile() there returns
the response as an object. Here we do that in _lineinfile() to match the other
functions, and lineinfile() return response["rc"] as the others.

For doc on lineinfile, see:
https://docs.ansible.com/ansible/latest/collections/ansible/builtin/lineinfile_module.html
*/

async function _lineinfile(dataset, line, regex = null, args = {}) {
  dataset = util.cleanShellInput(dataset);
  let options = util.parseUniversalArguments(args);

  let state = true, insAft = null, insBef = null;
  let matchCharacter = '$';

  if ('state' in args) {
    if (typeof args['state'] !== 'boolean') {
      let response = {
        rc: 55,
        stdout: '',
        command: '_lineinfile()',
        stderr: 'state should be true or false'
      };
      throw new Error(JSON.stringify(response));
    } else {
      state = args['state'];
    }
  }
  if ('ins_aft' in args) {
    let v = args['ins_aft'].toUpperCase();
    if (v === 'EOF') {
      insAft = 'EOF';
    } else {
      insAft = args['ins_aft'];
    } // a regex
  }
  if ('ins_bef' in args) {
    let v = args['ins_bef'].toUpperCase();
    if (v === 'BOF') {
      insBef = 'BOF';
    } else {
      insBef = args['ins_bef'];
    } // a regex
  }

  if ('lock' in args) {
    if (typeof args['lock'] !== 'boolean') {
      let response = {
        rc: 55,
        stdout: '',
        command: '_lineinfile()',
        stderr: 'lock should be true or false'
      };
      throw new Error(JSON.stringify(response));
    }
    if (args['lock']) {
      options += ' -l';
    }
  }
  if ('encoding' in args) {
    options += ` -c ${args['encoding']}`;
  }

  if ('backref' in args) {
    if (typeof args['backref'] !== 'boolean') {
      let response = {
        rc: 55,
        stdout: '',
        command: '_lineinfile()',
        stderr: 'backref should be true or false'
      };
      throw new Error(JSON.stringify(response));
    }
    if (args['backref']) {
      options += ' -r';
    }
  }
  if ('first_match' in args && args['first_match']) {
    matchCharacter = '1';
  }

  if (state) {
    if (regex) {
      if (insAft) {
        if (insAft === 'EOF') {
          options += ` -s -e  \"/${regex}/c\\${line}/${matchCharacter}\" -e \"$ a\\${line}\" \"${dataset}\"`;
        } else {
          options += ` -s -e \"/${regex}/c\\${line}/${matchCharacter}\" -e \"/${insAft}/a\\${line}/${matchCharacter}\" -e \"$ a\\${line}\" \"${dataset}\"`;
        }
      } else if (insBef) {
        if (insBef === 'BOF') {
          options += ` -s -e \"/${regex}/c\\${line}/${matchCharacter}\" -e \"1 i\\${line}\" \"${dataset}\"`;
        } else {
          options += ` -s -e \"/${regex}/c\\${line}/${matchCharacter}\" -e \"/${insBef}/i\\${line}/${matchCharacter}\" -e \"$ a\\${line}\" \"${dataset}\"`;
        }
      } else {
        options += ` \"/${regex}/c\\${line}/${matchCharacter}\" \"${dataset}\"`;
      }
    } else {
      if (insAft) {
        if (insAft === 'EOF') {
          options += ` \"$ a\\${line}\" \"${dataset}\"`;
        } else {
          options += ` -s -e \"/${insAft}/a\\${line}/${matchCharacter}\" -e \"$ a\\${line}\" \"${dataset}\"`;
        }
      } else if (insBef) {
        if (insBef === 'BOF') {
          options += ` \"1 i\\${line}\" \"${dataset}\"`;
        } else {
          options += ` -s -e \"/${insBef}/i\\${line}/${matchCharacter}\" -e \"$ a\\${line}\" \"${dataset}\"`;
        }
      } else {
        let response = {
          rc: 55,
          stdout: '',
          command: '_lineinfile()',
          stderr: 'Incorrect parameters'
        };
        throw new Error(JSON.stringify(response));
      }
    }
  } else {
    if (regex) {
      if (line) {
        options += ` -s -e \"/${regex}/d\" -e \"/${line}/d\" \"${dataset}\"`;
      } else {
        options += ` "\"/${regex}/d\" \"${dataset}\"`;
      }
    } else {
      options += ` \"/${line}/d\" \"${dataset}\"`;
    }
  }
  return util.callZoauLibrary('dsed', options);
}

async function lineinfile(dataset, line, regex = null, args = {}) {
  let response = await _lineinfile(dataset, line, regex, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

/* TODO(gabylb): datasets.py defines blockinfile with the following arguments:
(dataset, state=true, args={})

Here I moved state to args and added block - to be consistent with lineinfile
and since JS doesn't support named parameters.

Also, in datasets.py, there's no _blockinfile(), and blockinfile() there returns
the response as an object. Here we do that in _blockinfile() to match the other
functions, and blockinfile() return response["rc"] as the others.
*/

async function _blockinfile(dataset, block = null, args = {}) {
  dataset = util.cleanShellInput(dataset);
  let options = '-b ' + util.parseUniversalArguments(args);

  let state = true, insAft = null, insBef = null;

  if ('state' in args) {
    if (typeof args['state'] !== 'boolean') {
      let response = {
        rc: 55,
        stdout: '',
        command: '_blockinfile()',
        stderr: 'state should be true or false'
      };
      throw new Error(JSON.stringify(response));
    } else {
      state = args['state'];
    }
  }
  if ('lock' in args) {
    if (typeof args['lock'] !== 'boolean') {
      let response = {
        rc: 55,
        stdout: '',
        command: '_blockinfile()',
        stderr: 'lock should be true or false'
      };
      throw new Error(JSON.stringify(response));
    } else if (args['lock']) {
      options += ' -l';
    }
  }
  if ('encoding' in args) {
    options += ` -c ${args['encoding']}`;
  }
  if ('marker' in args) {
    options += ` -m \"${args['marker']}\"`;
  }

  if ('ins_aft' in args) {
    let v = args['ins_aft'].toUpperCase();
    if (v === 'EOF') {
      insAft = 'EOF';
    } else {
      insAft = args['ins_aft'];
    } // a regex
  }
  if ('ins_bef' in args) {
    let v = args['ins_bef'].toUpperCase();
    if (v === 'BOF') {
      insBef = 'BOF';
    } else {
      insBef = args['ins_bef'];
    } // a regex
  }

  if (state) {
    if (!block) {
      let response = {
        rc: 55,
        stdout: '',
        command: '_blockinfile()',
        stderr: 'block is required when state=true'
      };
      throw new Error(JSON.stringify(response));
    } else if (insAft) {
      if (insAft === 'EOF') {
        options += ` \"$ a\\${block}\" \"${dataset}\"`;
      } else {
        options += ` -s -e \"/${insAft}/a\\${block}/$\" -e \"$ a\\${block}\" \"${dataset}\"`;
      }
    } else if (insBef) {
      if (insBef == 'BOF') {
        options += ` \"1 i\\${block}\" \"${dataset}\"`;
      } else {
        options += ` -s -e \"/${insBef}/i\\${block}/$\" -e \"$ a\\${block}\" \"${dataset}\"`;
      }
    } else {
      let response = {
        rc: 55,
        stdout: '',
        command: '_blockinfile()',
        stderr: 'insertafter or insertbefore is required when state=true'
      };
      throw new Error(JSON.stringify(response));
    }
  } else {
    options += ` \"//d\" \"${dataset}\"`;
  }
  return util.callZoauLibrary('dmod', options);
}

async function blockinfile(dataset, block = null, args = {}) {
  let response = await _blockinfile(dataset, block, args);

  if (response['rc'] !== 0) {
    throw new Error(JSON.stringify(response));
  }

  return 0;
}

exports.Dataset = Dataset;
exports.listing = listing;
exports._listing = _listing;
exports.listMembers = listMembers;
exports._listMembers = _listMembers;
exports.exists = exists;
exports.read = read;
exports._read = _read;
exports.create = create;
exports._create = _create;
exports.copy = copy;
exports._copy = _copy;
exports.move = move;
exports._move = _move;
exports.write = write;
exports._write = _write;
exports.compare = compare;
exports._compare = _compare;
exports.search = search;
exports._search = _search;
exports.deleteMembers = deleteMembers;
exports._deleteMembers = _deleteMembers;
exports.moveMember = moveMember;
exports._moveMember = _moveMember;
exports.findMember = findMember;
exports._findMember = _findMember;
exports.hlq = hlq;
exports._hlq = _hlq;
exports.tmpName = tmpName;
exports._tmpName = _tmpName;
exports.findReplace = findReplace;
exports._findReplace = _findReplace;
exports.zip = zip;
exports._zip = _zip;
exports.unzip = unzip;
exports._unzip = _unzip;
exports.delete = deletes;
exports._delete = _deletes;
exports.lineinfile = lineinfile;
exports._lineinfile = _lineinfile;
exports.blockinfile = blockinfile;
exports._blockinfile = _blockinfile;
