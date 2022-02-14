# Contributing

## Issues

Log an issue for any question or problem you might have. When in doubt, log an issue, and
any additional policies about what to include will be provided in the responses. The only
exception is security disclosures which should be sent privately.

Committers may direct you to another repository, ask for additional clarifications, and
add appropriate metadata before the issue is addressed.

## Contributions

Any change to resources in this repository must be through pull requests. This applies to all changes
to documentation, code, binary files, etc.

No pull request can be merged without being reviewed and approved.

If you are looking to contribute to zoau-node development, follow these steps
to set up your development environment:

### Cloning and Building zoau-node

1. Follow the instructions in
https://www.ibm.com/docs/en/zoau/latest?topic=installing-configuring-zoa-utilities to install
and configure ZOAU on your system.

After installation, make sure the PATH and LIBPATH environment variables include the location
of the ZOAU binaries and dlls as follows:
``` bash
export PATH=<path_to_zoau>/bin:$PATH
export LIBPATH=<path_to_zoau>/lib:$LIBPATH
```

2. Clone the zoau-node repository.

```bash
$ git clone git@github.com/IBM/zoau-node
```

3. Install the dependencies required for zoau-node.

```bash
$ cd zoau-node
$ npm install
```

## Tests

Verify that zoau-node is working by running the test suite.

```bash
$ npm test
```

## Coding Guidelines
When contributing your changes, please make sure to adhere to the following 
coding guidelines:

* Follow the ESLint recommended coding style rules as indicated in https://eslint.org/docs/rules/
* Use async-await for asynchronous function handling: https://developers.google.com/web/fundamentals/primers/async-functions

### Commit message

A good commit message should describe what changed and why.

It should:
  * contain a short description of the change
  * be entirely in lowercase with the exception of proper nouns, acronyms, and the words that refer to code, like function/variable names
  * be prefixed with one of the following words:
    * fix: bug fix
    * hotfix: urgent bug fix
    * feat: new or updated feature
    * docs: documentation updates
    * refactor: code refactoring (no functional change)
    * perf: performance improvement
    * test: tests and CI updates

### Developer's Certificate of Origin 1.1

<pre>
By making a contribution to this project, I certify that:

 (a) The contribution was created in whole or in part by me and I
     have the right to submit it under the open source license
     indicated in the file; or

 (b) The contribution is based upon previous work that, to the best
     of my knowledge, is covered under an appropriate open source
     license and I have the right under that license to submit that
     work with modifications, whether created in whole or in part
     by me, under the same open source license (unless I am
     permitted to submit under a different license), as indicated
     in the file; or

 (c) The contribution was provided directly to me by some other
     person who certified (a), (b) or (c) and I have not modified
     it.

 (d) I understand and agree that this project and the contribution
     are public and that a record of the contribution (including all
     personal information I submit with it, including my sign-off) is
     maintained indefinitely and may be redistributed consistent with
     this project or the open source license(s) involved.
</pre>
