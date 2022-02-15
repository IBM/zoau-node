# zoau - A Node.js module for Z Open Automation Utilities (ZOAU)

## Table of Contents

 * [Overview](#overview)
 * [System Requirements](#system-requirements)
 * [Build and Install](#build-and-install)
 * [Setup](#setup)
 * [Quick Start](#quick-start)
 * [API Documentation](#api-documentation)
 * [Contributing](#contributing)
 * [Legalities](#legalities)

## Overview

zoau - a Node.js module that exposes the Z Open Automation Utilities (ZOAU)
APIs in Node.js!

## System Requirements

* IBM® SDK for Node.js - z/OS® 14.15.1 or higher or IBM Open Enterprise SDK for Node.js 16.0 or higher
* z/OS V2R3 or higher
* ZOAU v1.1.0 or higher is required on the system.
  * For more details, visit: 
    https://www.ibm.com/docs/en/zoau/latest?topic=installing-configuring-zoa-utilities

## Build and Install

* Before installing, [download and install IBM Open Enterprise SDK for Node.js](https://www.ibm.com/products/sdk-nodejs-compiler-zos).

## Setup

* The PATH and LIBPATH environment variables need to include the location of the ZOAU
binaries and dlls, respectively.
``` bash
export PATH=<path_to_zoau>/bin:$PATH
export LIBPATH=<path_to_zoau>/lib:$LIBPATH
```
For more details on setting up ZOAU, visit:
https://www.ibm.com/docs/en/zoau/latest?topic=installing-configuring-zoa-utilities

## Quick Start

1. Create a Node.js project directory and install the zoau Node.js module:
```bash
mkdir my-example-project && cd my-example-project
npm init --yes
npm install zoau
```

2. Create a file named `listds.js` containing the following contents:

```js
const ds=require('./lib/zoau.js').datasets;
ds.listing("SYS1.PARM*", {"detailed":true})
	.then(console.log)
	.catch(console.error);
```

This code will list all datasets starting with SYS.PARM.  We have chosen
a detailed output, specified as the second parameter.

3.  Run the code
```bash
node listds.js
```

## API Documentation

TODO

## Contributing

See the zoau [CONTRIBUTING.md file](CONTRIBUTING.md) for details.

## Legalities

The zoau Node.js module is available under the Apache 2.0 license. See the [LICENSE 
file](LICENSE) file for details

### Copyright

```
Licensed Materials - Property of IBM
zoau
(C) Copyright IBM Corp. 2020. All Rights Reserved.
US Government Users Restricted Rights - Use, duplication
or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
```
