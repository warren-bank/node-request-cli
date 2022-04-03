### [Nget](https://github.com/warren-bank/node-request-cli)

An extremely lightweight HTTP request client for the command-line. Supports: http, https, redirects, cookies, content-encoding, multipart/form-data.

#### Installation:

```bash
npm install --global @warren-bank/node-request-cli
```

#### Summary:

* [request](https://github.com/warren-bank/node-request) implements the HTTP request client as a javascript library
* [Nget](https://github.com/warren-bank/node-request-cli) provides a command-line interface for this javascript library
  * CLI options allow the user to access and configure much of its functionality
  * CLI options follow a naming convention intended to be (somewhat) consistent with `wget`
    * `wget` has hundreds of CLI options
    * `nget` has maybe a dozen.. written in one evening
      * don't expect feature parity
      * do expect the most important features to be present
        * pull requests that implement additional `wget` features are always welcome
          * if the feature involves a fair amount of work, please open an issue so we can discuss before-hand

#### Usage:

```bash
nget <options>

options:
========
"-h"
"--help"
    Print a help message detailing all of Nget's command-line options.

"-V"
"--version"
    Display the version of Nget.

"-u <URL>"
"--url <URL>"
    Specify the URL to download.

"-i <filepath>"
"--input-file <filepath>"
    Read URLs from a local text file.
    Use "-" to read from standard input.
    Format is one URL per line.
    Each line is parsed as a collection of tab-separated values:
      - 1st value must always be the URL
      - 2nd value is an optional output document filepath
          * absolute paths are supported
          * relative paths are supported
            and resolve relative to "--directory-prefix" (if defined)
            or the current working directory
      - all subsequent values are ignored as comments

"--mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"--headers <filepath>"
    Read request headers from a local text file.
    Use "-" to read from standard input.
    Format is JSON. Data structure is an Object.
    Keys contain header name. Values contain header value.

"--referer <value>"
    Specify request header: "Referer: <value>"
    Takes priority over value read by "--headers"
    for the specific header name.

"-U <value>"
"--user-agent <value>"
    Specify request header: "User-Agent: <value>"
    Takes priority over value read by "--headers"
    for the specific header name.

"--header <name=value>"
"--header <name:value>"
    Specify request header: "<name>: <value>"
    Takes priority over value read by "--headers"
    for the specific header name.

"--method <value>"
    HTTP verb. Value must be one of:
      "GET","HEAD","POST","PUT","DELETE",
      "CONNECT","OPTIONS","TRACE","PATCH"
    The default is "GET", which changes to "POST"
    when "--post-data" or "--post-file" are defined.

"--post-data <data>"
    Specifies a string to send as POST data.
    By default, the 'Content-Type' request header will contain:
      'application/x-www-form-urlencoded'
    Special tokens:
      "{{btoa value}}"
        Replaced by: `btoa("value")`
      "{{atob value}}"
        Replaced by: `atob("value")`
      "{{+ value}}"
        Replaced by: `encodeURIComponent("value")`
      "{{- value}}"
        Replaced by: `decodeURIComponent("value")`
      "{{@ filepath}}"
        Changes the 'Content-Type' request header to:
          'multipart/form-data'
        "filepath" is the path to a file;
        either absolute or relative to the current working directory.
        The binary content of such files are included in the request.
        Use "-" to redirect standard input.
        The binary data piped from stdin can be configured with:
          "{{@ - filename | mime}}"
    Examples:
      --post-data "text_encoded={{+ value to urlencode}}&text_decoded={{- value%20to%20urldecode}}&binary_stdin={{@ -}}&binary_file={{@ /path/to/file}}"
      --post-data "image={{@ - image.png}}"
      --post-data "image={{@ - image.png | image/awesome-png}}"
    When 'content-type: multipart/form-data':
      All form field names  are automatically urlencoded.
      All form field values are automatically urldecoded.
      It is perfectly valid to repeat form field names;
      the server is responsible to parse the multiple values.
      Be aware of server-side quirks;
      for example, PHP requires repeated form fields
      to obey a naming convention that appends the suffix: '[]'.

"--post-file <filepath>"
    Open as a readable stream. Pipe the binary content to POST data.
    Use "-" to redirect standard input to POST data.
    By default, the 'Content-Type' request header will contain:
      'application/octet-stream'
    This option is nullified by: "--post-data"

"--max-redirect <number>"
    Specifies the maximum number of redirections to follow.
    The default is 10.

"--no-check-certificate"
    Do not check HTTPS TLS/SSL certificates.

"--no-follow-redirect"
    Do not follow any redirections.

"--no-validate-status-code"
    Do not throw an Error when the status code of the response
    for the final request is not 200.
    This option pairs well with: "--no-follow-redirect"

"--load-cookies <filepath>"
    Specifies the text file used to store cookies.
    Format is JSON.

"--load-cookies true"
    Indicates that cookies should be stored in memory
    for the lifespan of a single Nget session.

"--no-cookies"
    Indicates that cookies must not be used during the current Nget session.
    Takes priority over: "--load-cookies"

"-P <dirpath>"
"--directory-prefix <dirpath>"
    Specifies the directory to which all file downloads will be saved.
    The default is "." (the current directory).

"-O <filepath>"
"--output-document <filepath>"
    Specifies where output will be written.
    Use "-" to write to standard output.
    Priority when used with a single "--url":
      1. stdout or absolute filepath
      2. ("--directory-prefix" or cwd) + relative filepath
      3. ("--directory-prefix" or cwd) + "--content-disposition"
      4. ("--directory-prefix" or cwd) + URL basename
    Priority when used in combination with "--input-file":
      1. the 2nd tab-separated value on each line of input
      2. stdout
      3. ("--directory-prefix" or cwd) + "--content-disposition"
      4. ("--directory-prefix" or cwd) + URL basename

"--content-disposition"
    Indicates that the output should be saved with a filename
    that is obtained from the 'Content-Disposition' response header.
    The default behavior is to obtain a filename
    that is obtained from the basename of the requested URL.
    This option pairs well with: "--directory-prefix"
    This option is nullified by: "--output-document"

"-nc"
"--no-clobber"
    Indicates that a file download should not occur
    when the filepath to which it would be saved already exists.
    The default behavior is to delete the existing file
    and download the new file in its place.

"--save-headers"
    Write the HTTP response headers returned by the server to output.
    This metadata prepends to the normal output, with a LF separator.

"-S"
"--server-response"
    Print the headers sent by the HTTP server.
```

```bash
nget-convert-cookiefile --json-to-text --in <filepath> --out <filepath>
nget-convert-cookiefile --text-to-json --in <filepath> --out <filepath>

options:
========
"-h"
"--help"
    Print a help message describing all of Nget's command-line options.

"-V"
"--version"
    Display the version of Nget.

"--json-to-text"
    Enable the conversion operation: JSON to Netscape text format

"--text-to-json"
    Enable the conversion operation: Netscape text format to JSON

"--in <filepath>"
    Specify path to input file.

"--out <filepath>"
    Specify path to output file.
```

#### Example:

* [this test script](https://github.com/warren-bank/node-request-cli/blob/master/tests/run.sh) is a good introduction

#### Usage as an Embedded Library:

* without cluttering the README with too much technical info, I will quickly mention that:
  * all functionality can be imported as a function:<br>`const {download} = require('@warren-bank/node-request-cli')`
  * all command-line options can be specified at runtime in a configuration object passed to the function:<br>`download({})`

#### Requirements:

* Node version: v6.4.0 (and higher)
  * [ES6 support](http://node.green/)
    * v0.12.18+: Promise
    * v4.08.03+: Object shorthand methods
    * v5.12.00+: spread operator
    * v6.04.00+: Proxy constructor
    * v6.04.00+: Proxy 'apply' handler
    * v6.04.00+: Reflect.apply
  * tested in:
    * v7.9.0

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
