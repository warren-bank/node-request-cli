const help = `
usage:
======
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

"--post-file <filepath>"
    Open as a readable stream. Pipe the binary content to POST data.
    Use "-" to redirect standard input to POST data.
    By default, the 'Content-Type' request header will contain:
      'application/octet-stream'

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
`

module.exports = help
