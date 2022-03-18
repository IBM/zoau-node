# zoau - A Node.js module for Z Open Automation Utilities (ZOAU)

## Table of Contents

- [zoau - A Node.js module for Z Open Automation Utilities (ZOAU)](#zoau---a-nodejs-module-for-z-open-automation-utilities-zoau)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [System Requirements](#system-requirements)
  - [Build and Install](#build-and-install)
  - [Setup](#setup)
  - [Quick Start](#quick-start)
  - [API Documentation](#api-documentation)
  - [Contributing](#contributing)
  - [Legalities](#legalities)
    - [Copyright](#copyright)

## Overview

zoau - a Node.js module that exposes the Z Open Automation Utilities (ZOAU)
APIs in Node.js!

## System Requirements

- IBM® SDK for Node.js - z/OS® 14.15.1 or higher or IBM Open Enterprise SDK for Node.js 16.0 or higher
- z/OS V2R3 or higher
- ZOAU v1.1.0 or higher is required on the system.
  - For more details, [see the zoau documentation.](https://www.ibm.com/docs/en/zoau/latest?topic=installing-configuring-zoa-utilities)

## Build and Install

- Before installing, [download and install IBM Open Enterprise SDK for Node.js](https://www.ibm.com/products/sdk-nodejs-compiler-zos).

## Setup

- The PATH and LIBPATH environment variables need to include the location of the ZOAU
binaries and dlls, respectively.

```shell
export PATH=<path_to_zoau>/bin:$PATH
export LIBPATH=<path_to_zoau>/lib:$LIBPATH
```

For more details on setting up ZOAU, [see the documentation.](https://www.ibm.com/docs/en/zoau/latest?topic=installing-configuring-zoa-utilities)

## Quick Start

1. Create a Node.js project directory and install the zoau Node.js module:

    ```shell
    mkdir my-example-project && cd my-example-project
    npm init --yes
    npm install zoau
    ```

1. Create a file named `listds.js` containing the following contents:

    ```js
    const ds=require('./lib/zoau.js').datasets;
    ds.listing("SYS1.PARM*", {"detailed":true})
      .then(console.log)
      .catch(console.error);
    ```

    This code will list all datasets starting with SYS.PARM.  We have chosen
    a detailed output, specified as the second parameter.

1. Run the code

    ```shell
    node listds.js
    ```

# More Examples

- [Managing files in a partitioned dataset with the zoau Node.js module](https://community.ibm.com/community/user/ibmz-and-linuxone/blogs/wayne-zhang1/2022/03/17/managing-files-partitioned-dataset-zoau-nodejs)

## API Documentation

TODO

## Contributing

See the zoau [CONTRIBUTING.md file](CONTRIBUTING.md) for details.

## Legalities

The zoau Node.js module is available under the Apache 2.0 license. See the [LICENSE
file](LICENSE) file for details

### Copyright

```text
Licensed Materials - Property of IBM
zoau
(C) Copyright IBM Corp. 2020. All Rights Reserved.
US Government Users Restricted Rights - Use, duplication
or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
```
