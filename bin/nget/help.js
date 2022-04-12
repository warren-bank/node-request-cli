const help = `
usage:
======
nget <options>

==================
options (general):
==================

"-h"
"--help"
    Print a help message detailing all of Nget's command-line options.

"-V"
"--version"
    Display the version of Nget.

"-u" <URL>
"--url" <URL>
    Specify the URL to download.

"-i" <filepath>
"--input-file" <filepath>
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

"-mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.
    Special case:
        When the size of the download queue is 1,
        then the single URL will be downloaded concurrently in chunks.
    This option pairs well with: "--chunk-size"

"-cs" <integer>
"--chunk-size" <integer>
    Specify a fixed value for the size of each concurrent chunk.
    Unit: MB
    This option is only used when:
      1. "--max-concurrency" is greater than 1
      2. the number of URLs to download is equal to 1
    By default:
      1. the size of each concurrent chunk is dynamic
      2. its value is the total size of the single URL to download
         divided by "--max-concurrency"
      3. this methodology will usually result in every thread
         completing the download of its assigned chunk
         at approximately the same time

"-w" <integer>
"--wait" <integer>
    Specify the number of seconds to wait between requests
    when "--max-concurrency" is 1.

"--random-wait"
    Used in combination with "--wait".
    Converts wait duration to milliseconds,
    and multiplies by a randomized factor in the range 0.5 to 1.5.

"--headers" <filepath>
    Read request headers from a local text file.
    Use "-" to read from standard input.
    Format is JSON. Data structure is an Object.
    Keys contain header name. Values contain header value.

"--referer" <URL>
    Specify request header: "Referer: <URL>"
    Takes priority over value read by "--headers"
    for the specific header name.

"-U" <value>
"--user-agent" <value>
    Specify request header: "User-Agent: <value>"
    Takes priority over value read by "--headers"
    for the specific header name.

"--header" "<name>=<value>"
"--header" "<name>:<value>"
    Specify request header: "<name>: <value>"
    Takes priority over value read by "--headers"
    for the specific header name.
    This flag can be repeated to add multiple request headers.

"--method" <value>
    HTTP verb. Value must be one of:
      "GET","HEAD","POST","PUT","DELETE",
      "CONNECT","OPTIONS","TRACE","PATCH"
    The default is "GET", which changes to "POST"
    when "--post-data" or "--post-file" are defined.

"--post-data" <data>
    Specifies a string to send as POST data.
    By default, the 'Content-Type' request header will contain:
      'application/x-www-form-urlencoded'
    Special tokens:
      "{{btoa value}}"
        Replaced by: \`btoa("value")\`
      "{{atob value}}"
        Replaced by: \`atob("value")\`
      "{{+ value}}"
        Replaced by: \`encodeURIComponent("value")\`
      "{{- value}}"
        Replaced by: \`decodeURIComponent("value")\`
      "{{@ filepath}}"
        Changes the 'Content-Type' request header to:
          'multipart/form-data'
        "filepath" is the path to a file;
        either absolute or relative to the current working directory.
        The binary content of such files are included in the request.
        The binary data piped from a filepath can be configured with:
          "{{@ filepath | mime}}"
        Use "-" to redirect standard input.
        The binary data piped from stdin can be configured with:
          "{{@ - filename | mime}}"
    When 'content-type: multipart/form-data':
      All form field names  are automatically urlencoded.
      All form field values are automatically urldecoded.
      It is perfectly valid to repeat form field names;
      the server is responsible to parse the multiple values.
      Be aware of server-side quirks;
      for example, PHP requires repeated form fields
      to obey a naming convention that appends the suffix: '[]'.

"--post-file" <filepath>
    Open as a readable stream. Pipe the binary content to POST data.
    Use "-" to redirect standard input to POST data.
    By default, the 'Content-Type' request header will contain:
      'application/octet-stream'
    This option is nullified by: "--post-data"

"--max-redirect" <integer>
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

"--load-cookies" <filepath>
    Specifies the text file used to store cookies.
    Format is JSON.

"--load-cookies" "true"
    Indicates that cookies should be stored in memory
    for the lifespan of a single Nget session.

"--no-cookies"
    Indicates that cookies must not be used during the current Nget session.
    Takes priority over: "--load-cookies"

"-P" <dirpath>
"--directory-prefix" <dirpath>
    Specifies the directory to which all file downloads will be saved.
    The default is "." (the current directory).

"--default-page" <value>
    Specify the filename to save URLs having only a directory path.
    The default is "index.html".

"-O" <filepath>
"--output-document" <filepath>
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
    that is obtained from the basename of the original URL request.
    This option pairs well with: "--directory-prefix"
    This option is nullified by: "--output-document"

"--trust-server-names"
    Indicates that the output should be saved with a filename
    that is obtained from the basename of the URL after redirects.
    The default behavior is to obtain a filename
    that is obtained from the basename of the original URL request.
    This option pairs well with: "--directory-prefix"
    This option is nullified by: "--output-document"
    When recursively crawling a website:
      The output directory tree hierarchy is derived from URL paths.
      This option can result in a very different directory structure.

"-nQ"
"--no-querystring"
    Exclude the URL querystring from the filename given to a download.
    For example:
      URL      = "http://example.com/image?format=png&size=100"
      default  = "image@format=png&size=100"
      filename = "image"

"--restrict-file-names" <value>
    Specify character set restrictions that apply when naming files.
    Supported values:
      "windows"
          Escapes character sets:
            1. \|/:?"*<>
            2. ascii byte range (decimal): 0-31
            3. ascii byte range (decimal): 128-159
          Also:
            1. When the downloaded URL contains a querystring,
               use '@' character to prefix the query,
               rather than '?'
            2. When recursively crawling a website,
               in directory path components for each host,
               use '+' character to prefix the port number,
               rather than ':'
      "unix"
          Escapes character sets:
            1. /
            2. ascii byte range (decimal): 0-31
            3. ascii byte range (decimal): 128-159
      "ascii"
          Escapes character sets:
            1. ascii byte range (decimal): 128-255
      "nocontrol"
          Modifier to prevent the escaping of character sets:
            1. ascii byte range (decimal): 0-31
            2. ascii byte range (decimal): 128-159
      "lowercase"
          Modifier to convert all uppercase characters to lowercase.
      "uppercase"
          Modifier to convert all lowercase characters to uppercase.
    This flag can be repeated to combine character set restrictions.

"-nc"
"--no-clobber"
    Indicates that a file download should not occur
    when the filepath to which it would be saved already exists.
    The default behavior is to delete the existing file
    and download the new file in its place.

"-c"
"--continue"
    Indicates that a file download should continue
    when the filepath to which it would be saved already exists.
    The default behavior is to delete the existing file
    and download the new file in its place.

"-S"
"--server-response"
    Print the HTTP response headers returned by the server to stdout.

"-dr"
"--dry-run"
    Do not write to output.

"--save-headers"
    Write the HTTP response headers returned by the server to output.
    This metadata prepends to the normal output, with a LF separator.

"--plugins" <filepath>
    Read hook functions from a local javascript file.
    Format is a CommonJS module that exports one or more plugins.
    Supported plugins are:
      module.exports = {
        change_filename: (filename) => {
          // ======
          // notes:
          // ======
          // - the input filename is the basename of a filepath
          //   to which a downloaded URL may be saved.
          // - the input filename is influenced by:
          //     "--content-disposition"
          //     "--trust-server-names"
          //     "--no-querystring"
          //     "--restrict-file-names"
          // ======
          // - if a value is returned,
          //   then it will change the filename used for output.
          // - the output filename is subject to:
          //   "--no-clobber"
          //   "--continue"
          // ======
        }
      }

=======================
options (curl aliases):
=======================

"-I"
"--head"
    This option is a convenience aggregate, which is equivalent to:
        --method HEAD --server-response --dry-run

"-e" <URL>
"--referer" <URL>

"-A" <value>
"--user-agent" <value>

"-H" "<name>: <value>"
"--header" "<name>: <value>"

"-X" <value>
"--request" <value>
"--method" <value>

"-d" <data>
"--data" <data>
"--form" <data>
"--post-data" <data>

"--insecure"
"--no-check-certificate"

"-o" <filepath>
"--output" <filepath>
"--output-document" <filepath>

=======================
options (proxy server):
=======================

Note:
    When options allow for an environment variable
    to serve as an alternative method to specify a value,
    the command-line parameter always takes preference.

"--no-proxy"
    Specify that no requests are tunneled through any proxy server.

"-x" <URL>
"--proxy" <URL>
    Specify the connection URL for a proxy server.
    HTTP and HTTPS requests tunnel through the same proxy server.
    Format of URL:
      <protocol>://<auth>@<host>:<port>
    Where:
      <protocol> is any of the following values:
        'http','https','socks','socks4','socks4a','socks5','socks5h'
      <auth> is "<username>:<password>" in clear text,
        which is used to send a Basic 'Proxy-Authorization' header
      <host> is required.
    Defaults:
      <protocol> = 'http'
      <port>     = 80 (http), 443 (https), 1080 (socks*)
    Notes:
      <auth> is URL decoded to allow for special characters.
      For example, a password is allowed to contain the '@' character.
      If this character is not URL encoded, then the URL is broken:
        socks5://username:p@ssword@host
      The correct connection URL is:
        socks5://username:p%40ssword@host
    Environment variable:
      \`proxy\`

"--proxy-http" <URL>
    Specify the connection URL for a proxy server.
    HTTP requests tunnel through the proxy server.
    Environment variable:
      \`http_proxy\`

"--proxy-https" <URL>
    Specify the connection URL for a proxy server.
    HTTPS requests tunnel through the proxy server.
    Environment variable:
      \`https_proxy\`

======================
options (web crawler):
======================

"--spider"
    This option is a convenience aggregate, which is equivalent to:
        --mirror --server-response --dry-run

"-m"
"--mirror"
    This option is a convenience aggregate, which is equivalent to:
        -r -l 0 --trust-server-names -E -k

"-r"
"--recursive"
    Enable recursive website crawling.
    When recursively crawling a website:
      1. URLs that match a blacklist are not followed
      2. URLs that match a whitelist are followed
      3. When there is a whitelist, non-matching URLs are not followed
      4. When there is no whitelist, same-host URLs are followed
    All followed URLs are:
      1. mirrored to the local file system
    When the content-type of a followed URL is HTML or CSS:
      1. the content of the response is inspected for embedded URLs
      2. all embedded URLs are compared to white/black lists
      3. all embedded URLs that will be followed
         are rewritten as relative links to the local file system
      4. all embedded URLs that will not be followed
         are rewritten as absolute links to the remote host

"-l" <integer>
"--level" <integer>
    Specify the maximum depth for recursion.
    Depth is counted as the number of "hops" from the original URL.
    The default is 5, which is consistent with Wget.
    For example:
      --level 1
        will conditionally download
        only the links in the target webpage.
    Special case:
      --level 0
        indicates infinite recursion.

"-p"
"--page-requisites"
    When either:
      1. recursively crawling a website with a finite maximum depth
      2. downloading a single webpage without recursive crawling,
         which for the purpose of this discussion can be thought of
         as equivalent to a recursive crawl
         with a maximum depth that is truly equal to zero
    HTML documents that are downloaded at the maximum recursion depth
    will only contain absolute remote URLs to all page resources;
    all such page resources require deeper recursion than allowed.
    The purpose for this option is to allow one extra "hop"
    for all URLs that don't return HTML content.
    This option pairs well with: "--force-html"

"-E"
"--adjust-extension"
    Force that the filenames used to save HTML content
    always end with an ".html" extension.
    This option pairs well with: "--force-html"
    WARNING:
      - Unlike Wget, which uses a 2x-pass methodology,
        Nget only uses a 1x-pass strategy,
        which requires a deterministic way to identify
        that a URL will return HTML content.
      - This restriction does not apply to the actual
        crawling of webpages; content-type of the server response
        is used to identify HTML content for this purpose.
      - This restriction does apply to the determination
        of filenames, and is especially important with respect
        to the ability to adjust the extension of filenames.
      - The reason for this restriction is that the determination
        of filenames must occur at a lower recursion depth,
        while the URLs in HTML and CSS documents are identified,
        and conditionally rewritten as relative links
        to the local file system.

"-k"
"--convert-links"
    Rewrite the URLs in HTML and CSS documents
    that have been followed and mirrored,
    as relative links to the local file system.
    By default, all such URLs are rewritten
    as absolute links to the remote host.

"-np"
"--no-parent"
    Blacklist all requests with a pathname that does not descend
    from the absolute directory path in the original URL pathname.
    This rule only applies to URLs requested from the same host.
    This option pairs well with: "--span-subdomains"
    This option pairs well with: "--no-host-directories", "--cut-dirs"

"-xD" <value>
"--exclude" <value>
"--exclude-directory" <value>
    Blacklist an absolute directory path that applies only to the host
    associated with the original URL for the target webpage.
    No URLs that are a descendant of this directory are followed.
    This flag can be repeated to blacklist multiple directory paths.
    WARNING:
      This option uses a non-standard alias.
      Wget uses the alias "-X" as an alias for "--exclude"
      Curl uses the alias "-X" as an alias for "--method"
      The alias is allocated for compatability with Curl,
      because "--method" is used more frequently.

"-iD" <value>
"--include" <value>
"--include-directory" <value>
    Whitelist an absolute directory path that applies only to the host
    associated with the original URL for the target webpage.
    All URLs that are a descendant of this directory are followed.
    This flag can be repeated to whitelist multiple directory paths.
    WARNING:
      This option uses a non-standard alias.
      Wget uses the alias "-I" as an alias for "--include"
      Curl uses the alias "-I" as an alias for "--head"
      The alias is allocated for compatability with Curl,
      because "--head" is used more frequently.

"-sD"
"--span-subdomains"
    Conditionally follow URLs hosted by any subdomain
    that shares the same 2x top level domain names
    as the original URL for the target webpage.
    For example:
      URL     = "http://www1.example.com/foo.html"
      follows = "http://www2.example.com/bar.html"

"-sH"
"--span-hosts"
    Conditionally follow URLs hosted by any domain.
    This option pairs well with: "--include-host", "--exclude-host"
    This option pairs well with: "--accept-regex", "--reject-regex"
    WARNING:
      This option uses a non-standard alias.
      Wget uses the alias "-H" as an alias for "--span-hosts"
      Curl uses the alias "-H" as an alias for "--header"
      The alias is allocated for compatability with Curl,
      because "--header" is used more frequently.

"-xH" <value>
"--exclude-domains" <value>
"--exclude-host" <value>
    Blacklist a case-insensitive host name.
    When "--span-subdomains" is enabled:
        Host names are normalized to only contain the 2x top domains.
    This option pairs well with: "--span-hosts"
    This flag can be repeated to blacklist multiple hosts.

"-iH" <value>
"-D" <value>
"--domains" <value>
"--include-host" <value>
    Whitelist a case-insensitive host name.
    When "--span-subdomains" is enabled:
        Host names are normalized to only contain the 2x top domains.
    This option pairs well with: "--span-hosts"
    This flag can be repeated to whitelist multiple hosts.

"--reject-regex" <regex>
    Specify a case-insensitive PCRE regex pattern
    to blacklist absolute URLs.
    This option pairs well with: "--span-hosts"
    This flag can be repeated to blacklist multiple URL patterns.

"--accept-regex" <regex>
    Specify a case-insensitive PCRE regex pattern
    to whitelist absolute URLs.
    This option pairs well with: "--span-hosts"
    This flag can be repeated to whitelist multiple URL patterns.

"-nd"
"--no-directories"
    Disable the creation of a directory tree hierarchy.
    Save all file downloads to a single output directory.
    By default, crawling produces a directory structure
    which mirrors that of the remote server.
    This option pairs well with: "--directory-prefix"

"--protocol-directories"
    Include top-level subdirectories in the resulting directory tree
    named for the network protocol with which they were crawled.
    For example: "http/host/path/file" or "https/host/path/file"
    This option is nullified by: "--no-directories"

"-nH"
"--no-host-directories"
    Exclude top-level subdirectories in the resulting directory tree
    named for the host from which they were crawled.
    For example: "path/file"
    This option is nullified by: "--no-directories"

"--cut-dirs" <integer>
    Exclude the top n-levels of subdirectories from the URL pathname.
    For example: --cut-dirs 3
      URL      = "http://example.com/1/2/3/4/5/index.html"
      default  = "example.com/1/2/3/4/5/index.html"
      filepath = "example.com/4/5/index.html"
    This option is nullified by: "--no-directories"

"-F" <regex>
"--force-html" <regex>
    Specify a case-insensitive PCRE regex pattern
    to match absolute URLs.
    Matching URLs are:
      1. inspected for embedded URLs
      2. given an ".html" file extension by "--adjust-extension"
    When not configured, a default pattern matches many common cgi.
    This flag can be repeated to match multiple URL patterns.

"-B" <URL>
"--base" <URL>
    Specify a <base href="URL"> that is used only to resolve
    relative links extracted from the target webpage.
    More formally, when the depth of recursion is exactly zero.
`

module.exports = help
