'use strict';

class DDStatement {
  /*
  DDStatement for use with mvscmd.execute and similar functions

  Parameters
  ==========
  `name` : string
      DD name

  `definition`: DatasetDefinition or FileDefinition or string or [DataDefinition]
      Additional arguments and options for DDStatement. For specifying a
      concatentation of datasets, use [DataDefinition] (array).
  */
  constructor(name, definition) {
    this.name = name;
    this.definition = definition;
  }

  getMvscmdString() {
    let ddString, mvscmdString = `--${this.name}="`;
    if (Array.isArray(this.definition)) {
      console.log('TODO: ARRAY');
      for (let i = 0; i < this.definition.length; i++) {
        ddString = this.definition[i].buildArgString();
        mvscmdString += `:${ddString}`;
      }
    } else if (typeof this.definition === 'string' ||
               this.definition instanceof String) {
      mvscmdString += this.definition;
    } else {
      mvscmdString += this.definition.buildArgString();
    }

    mvscmdString += '"';
    return mvscmdString;
  }
}

class DataDefinition extends Object {
  constructor(name) {
    super(name);
    this.name = name;
  }

  buildArgString() {
    return (this.name + this._buildArgString());
  }

  _appendMvscmdString(string, variableName, variable) {
    if (variable === null || variableName === null
    || (Array.isArray(variable) && variable.length === 0)) {
      return string;
    }
    string += `,${variableName}=`;
    if (Array.isArray(variable)) {
      let i;
      for (i = 0; i < variable.length - 1; i++) {
        string += `${variable[i]},`;
      }
      string += `${variable[i]}`;
    } else {
      string += variable;
    }

    return string;
  }
}

class FileDefinition extends DataDefinition {
  /*
  Definition of an HFS file

  Parameters
  ==========
  `path_name` : string
    Full path to the HFS file
  `args` = {
    `normal_disposition` : string
    `abnormal_disposition` : string
    `path_mode` : string
    `status_mode` : string
    `file_data` : string
    `record_length` : string
    `block_size` : string
    `record_format` : string
  }
  */
  constructor(pathName, args = {}) {
    super(pathName);

    this.normalDisposition = args['normal_disposition'] || null;
    this.abnormalDisposition = args['abnormal_disposition'] || null;
    this.pathMode = args['path_mode'] || null;
    this.statusGroup = args['status_group'] || null;
    this.fileData = args['file_data'] || null;
    this.recordLength = args['record_length'] || null;
    this.blockSize = args['block_size'] || null;
    this.recordFormat = args['record_format'] || null;
  }

  _buildArgString() {
    let mvscmdString;
    mvscmdString = '';
    mvscmdString = this._appendMvscmdString(mvscmdString, 'normdisp', this.normalDisposition);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'abnormdisp', this.abnormalDisposition);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'pathmode', this.pathMode);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'statusgroup', this.statusGroup);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'filedata', this.fileData);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'lrecl', this.recordLength);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'blksize', this.blockSize);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'recfm', this.recordFormat);
    return mvscmdString;
  }
}

class DatasetDefinition extends DataDefinition {
  /*
  Definition of z/OS dataset

  Parameters
  ==========
  `dataset_name` : string
    Name of the dataset
  `args` = {
    `disposition` : string
    `type` : string
    `primary` : string
    `primary_unit` : string
    `secondary` : string
    `secondary_unit` : string
    `normal_disposition` : string
    `abnormal_disposition` : string
    `conditional_disposition` : string
    `block_size` : string
    `record_format` : string
    `storage_class` : string
    `data_class` : string
    `management_class` : string
    `key_length` : string
    `key_offset` : string
    `volumes` : string
    `dataset_key_label` : string
    `key_label1` : string
    `key_encoding1` : string
    `key_label2` : string
    `key_encoding2` : string
  }
  */

  constructor(datasetName, args = {}) {
    super(datasetName);

    this.disposition = args['disposition'] || 'SHR';
    this.type = args['type'] || null;
    this.primary = args['primary'] || null;
    this.primaryUnit = args['primary_unit'] || null;
    this.secondary = args['secondary'] || null;
    this.secondaryUnit = args['secondary_unit'] || null;
    this.normalDisposition = args['normal_disposition'] || null;
    this.abnormalDisposition = args['abnormal_disposition'] || null;
    this.conditionalDisposition = args['conditional_disposition'] || null;
    this.blockSize = args['block_size'] || null;
    this.recordFormat = args['record_format'] || null;
    this.recordLength = args['record_length'] || null;
    this.storageClass = args['storage_class'] || null;
    this.dataClass = args['data_class'] || null;
    this.managementClass = args['management_class'] || null;
    this.keyLength = args['key_length'] || null;
    this.keyOffset = args['key_offset'] || null;
    this.volumes = args['volumes'] || null;
    this.datasetKeyLabel = args['dataset_key_label'] || null;
    this.keyLabel1 = args['key_label1'] || null;
    this.keyEncoding1 = args['key_encoding1'] || null;
    this.keyLabel2 = args['key_label2'] || null;
    this.keyEncoding2 = args['key_encoding2'] || null;
  }

  _buildArgString() {
    let mvscmdString;
    mvscmdString = (this.disposition ? `,${this.disposition}` : '');
    mvscmdString = this._appendMvscmdString(mvscmdString, 'type', this.type);
    if (this.primary) {
      mvscmdString += `,primary=${this.primary}`;
      if (this.primaryUnit) {
        mvscmdString += this.primaryUnit;
      }
    }
    if (this.secondary) {
      mvscmdString += `,secondary=${this.secondary}`;
      if (this.secondaryUnit) {
        mvscmdString += this.secondaryUnit;
      }
    }
    mvscmdString = this._appendMvscmdString(mvscmdString, 'normdisp', this.normalDisposition);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'abnormdisp', this.abnormalDisposition);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'blksize', this.blockSize);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'recfm', this.recordFormat);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'lrecl', this.recordLength);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'storclas', this.storageClass);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'dataclas', this.dataClass);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'mgmtclas', this.managementClass);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keylen', this.keyLength);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keyoffset', this.keyOffset);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'volumes', this.volumes);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'dskeylbl', this.datasetKeyLabel);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keylab1', this.keyLabel1);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keylab2', this.keyLabel2);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keycd1', this.keyEncoding1);
    mvscmdString = this._appendMvscmdString(mvscmdString, 'keycd2', this.keyEncoding2);
    return mvscmdString;
  }
}

module.exports = {
  DDStatement,
  DataDefinition,
  FileDefinition,
  DatasetDefinition
};
