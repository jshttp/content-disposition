# content-disposition

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Create an attachment Content-Disposition header

## Installation

```sh
$ npm install content-disposition
```

## API

```js
var contentDisposition = require('content-disposition')
```

### contentDisposition([filename])

Create an attachment `Content-Disposition` header value using the given file name,
if supplied.

```js
res.setHeader('Content-Disposition', contentDisposition('∫ maths.pdf'))
```

## Examples

### Send a file for download

```js
var contentDisposition = require('content-disposition')
var destroy = require('destroy')
var http = require('http')
var onFinished = require('on-finished')

var filePath = '/path/to/public/plans.pdf'

http.createServer(function onRequest(req, res) {
  // set headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', contentDisposition(filePath))

  // send file
  var stream = fs.createReadStream(filePath)
  stream.pipe(res)
  onFinished(res, function (err) {
    destroy(stream)
  })
})
```

## Testing

```sh
$ npm test
```

## References

- [RFC 2616: Hypertext Transfer Protocol -- HTTP/1.1][rfc-2616]
- [RFC 5987: Character Set and Language Encoding for Hypertext Transfer Protocol (HTTP) Header Field Parameters][rfc-5987]
- [RFC 6266: Use of the Content-Disposition Header Field in the Hypertext Transfer Protocol (HTTP)][rfc-6266]
- [Test Cases for HTTP Content-Disposition header field (RFC 6266) and the Encodings defined in RFCs 2047, 2231 and 5987][tc-2231]

[rfc-2616]: https://tools.ietf.org/html/rfc2616
[rfc-5987]: https://tools.ietf.org/html/rfc5987
[rfc-6266]: https://tools.ietf.org/html/rfc6266
[tc-2231]: http://greenbytes.de/tech/tc2231/

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/content-disposition.svg?style=flat
[npm-url]: https://npmjs.org/package/content-disposition
[node-version-image]: https://img.shields.io/node/v/content-disposition.svg?style=flat
[node-version-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/jshttp/content-disposition.svg?style=flat
[travis-url]: https://travis-ci.org/jshttp/content-disposition
[coveralls-image]: https://img.shields.io/coveralls/jshttp/content-disposition.svg?style=flat
[coveralls-url]: https://coveralls.io/r/jshttp/content-disposition?branch=master
[downloads-image]: https://img.shields.io/npm/dm/content-disposition.svg?style=flat
[downloads-url]: https://npmjs.org/package/content-disposition
