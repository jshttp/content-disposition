import { Buffer } from 'safe-buffer';

/**
 * RegExp to match percent encoding escape.
 * @private
 */
const HEX_ESCAPE_REPLACE_REGEXP = /%([0-9A-Fa-f]{2})/g;

/**
 * RegExp to match non-latin1 characters.
 * @private
 */
const NON_LATIN1_REGEXP = /[^\x20-\x7e\xa0-\xff]/g;

/**
 * RegExp to match quoted-pair in RFC 2616
 *
 * quoted-pair = "\" CHAR
 * CHAR        = <any US-ASCII character (octets 0 - 127)>
 * @private
 */
const QESC_REGEXP = /\\([\u0000-\u007f])/g; // eslint-disable-line no-control-regex

/**
 * RegExp for parameter parsing according to RFC 2616
 *
 * parameter     = token "=" ( token | quoted-string )
 * token         = 1*<any CHAR except CTLs or separators>
 * separators    = "(" | ")" | "<" | ">" | "@"
 *               | "," | ";" | ":" | "\" | <">
 *               | "/" | "[" | "]" | "?" | "="
 *               | "{" | "}" | SP | HT
 * quoted-string = ( <"> *(qdtext | quoted-pair ) <"> )
 * qdtext        = <any TEXT except <">>
 * quoted-pair   = "\" CHAR
 * CHAR          = <any US-ASCII character (octets 0 - 127)>
 * TEXT          = <any OCTET except CTLs, but including LWS>
 * LWS           = [CRLF] 1*( SP | HT )
 * CRLF          = CR LF
 * CR            = <US-ASCII CR, carriage return (13)>
 * LF            = <US-ASCII LF, linefeed (10)>
 * SP            = <US-ASCII SP, space (32)>
 * HT            = <US-ASCII HT, horizontal-tab (9)>
 * CTL           = <any US-ASCII control character (octets 0 - 31) and DEL (127)>
 * OCTET         = <any 8-bit sequence of data>
 * @private
 */
const PARAM_REGEXP = /;[\x09\x20]*([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*=[\x09\x20]*("(?:[\x20!\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\x20-\x7e])*"|[!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*/g; // eslint-disable-line no-control-regex

/**
 * RegExp for extended field value parsing according to RFC 5987
 *
 * ext-value     = charset  "'" [ language ] "'" value-chars
 * charset       = "UTF-8" / "ISO-8859-1" / mime-charset
 * mime-charset  = 1*mime-charsetc
 * mime-charsetc = ALPHA / DIGIT
 *               / "!" / "#" / "$" / "%" / "&"
 *               / "+" / "-" / "^" / "_" / "`"
 *               / "{" / "}" / "~"
 * language      = ( 2*3ALPHA [ extlang ] )
 *               / 4ALPHA
 *               / 5*8ALPHA
 * extlang       = *3( "-" 3ALPHA )
 * value-chars   = *( pct-encoded / attr-char )
 * pct-encoded   = "%" HEXDIG HEXDIG
 * attr-char     = ALPHA / DIGIT
 *               / "!" / "#" / "$" / "&" / "+" / "-" / "."
 *               / "^" / "_" / "`" / "|" / "~"
 * @private
 */
const EXT_VALUE_REGEXP = /^([A-Za-z0-9!#$%&+\-^_`{}~]+)'(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4,8}|)'((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!#$&+.^_`|~-])+)$/;

class ContentDisposition {
  
  /**
   * Parse Content-Disposition header string.
   *
   * @param {string} string
   * @return {object}
   * @public
   */
  static parse(string: string): { type: string, parameters: Record<string, string> } {
    if (!string || typeof string !== 'string') {
      throw new TypeError('argument string is required');
    }

    const match = /^([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*(?:$|;)/.exec(string);

    if (!match) {
      throw new TypeError('invalid type format');
    }

    // normalize type
    let index = match[0].length;
    const type = match[1].toLowerCase();

    let key: string;
    const names: string[] = [];
    const params: Record<string, string> = {};
    let value: string;

    // calculate index to start at
    index = PARAM_REGEXP.lastIndex = match[0].slice(-1) === ';' ? index - 1 : index;

    // match parameters
    let paramMatch: RegExpExecArray | null;
    while ((paramMatch = PARAM_REGEXP.exec(string))) {
      if (paramMatch.index !== index) {
        throw new TypeError('invalid parameter format');
      }

      index += paramMatch[0].length;
      key = paramMatch[1].toLowerCase();
      value = paramMatch[2];

      if (names.includes(key)) {
        throw new TypeError('invalid duplicate parameter');
      }

      names.push(key);

      if (key.endsWith('*')) {
        // decode extended value
        key = key.slice(0, -1);
        value = decodefield(value);

        // overwrite existing value
        params[key] = value;
        continue;
      }

      if (typeof params[key] === 'string') {
        continue;
      }

      if (value[0] === '"') {
        // remove quotes and escapes
        value = value.slice(1, -1).replace(QESC_REGEXP, '$1');
      }

      params[key] = value;
    }

    if (index !== -1 && index !== string.length) {
      throw new TypeError('invalid parameter format');
    }

    return { type, parameters: params };
  }
}

/**
 * Decode a RFC 5987 field value (gracefully).
 *
 * @param {string} str
 * @return {string}
 * @private
 */
function decodefield(str: string): string {
  const match = EXT_VALUE_REGEXP.exec(str);

  if (!match) {
    throw new TypeError('invalid extended field value');
  }

  const charset = match[1].toLowerCase();
  const encoded = match[2];

  // convert percent-encoded string to binary
  const binary = encoded.replace(HEX_ESCAPE_REPLACE_REGEXP, (str, hex) => String.fromCharCode(parseInt(hex, 16)));

  switch (charset) {
    case 'iso-8859-1':
      return getlatin1(binary);
    case 'utf-8':
    case 'utf8':
      return Buffer.from(binary, 'binary').toString('utf8');
    default:
      throw new TypeError('unsupported charset in extended field');
  }
}

/**
 * Get ISO-8859-1 version of string.
 *
 * @param {string} val
 * @return {string}
 * @private
 */
function getlatin1(val: string): string {
  // simple Unicode -> ISO-8859-1 transformation
  return val.replace(NON_LATIN1_REGEXP, '?');
}

export { ContentDisposition };
