import { describe, it, assert } from 'vitest';
import { parse } from './index';

describe('parse(string)', function () {
  describe('with only type', function () {
    it('should parse quoted value leniently', function () {
      assert.deepEqual(parse('"attachment"'), {
        type: '"attachment"',
        parameters: {},
      });
    });

    it('should ignore trailing semicolon', function () {
      assert.deepEqual(parse('attachment;'), {
        type: 'attachment',
        parameters: {},
      });
    });

    it('should parse "attachment"', function () {
      assert.deepEqual(parse('attachment'), {
        type: 'attachment',
        parameters: {},
      });
    });

    it('should parse "inline"', function () {
      assert.deepEqual(parse('inline'), {
        type: 'inline',
        parameters: {},
      });
    });

    it('should parse "form-data"', function () {
      assert.deepEqual(parse('form-data'), {
        type: 'form-data',
        parameters: {},
      });
    });

    it('should parse with trailing LWS', function () {
      assert.deepEqual(parse('attachment \t '), {
        type: 'attachment',
        parameters: {},
      });
    });

    it('should normalize to lower-case', function () {
      assert.deepEqual(parse('ATTACHMENT'), {
        type: 'attachment',
        parameters: {},
      });
    });
  });

  describe('with parameters', function () {
    it('should ignore trailing semicolon', function () {
      assert.deepEqual(parse('attachment; filename="rates.pdf";'), {
        type: 'attachment',
        parameters: { filename: 'rates.pdf' },
      });
    });

    it('should preserve invalid parameter name', function () {
      assert.deepEqual(parse('attachment; filename@="rates.pdf"'), {
        type: 'attachment',
        parameters: { 'filename@': 'rates.pdf' },
      });
    });

    it('should treat missing parameter value as empty', function () {
      assert.deepEqual(parse('attachment; filename='), {
        type: 'attachment',
        parameters: { filename: '' },
      });
    });

    it('should preserve invalid parameter value', function () {
      assert.deepEqual(parse('attachment; filename=trolly,trains'), {
        type: 'attachment',
        parameters: { filename: 'trolly,trains' },
      });
    });

    it('should preserve otherwise invalid parameters', function () {
      assert.deepEqual(parse('attachment; filename=total/; foo=bar'), {
        type: 'attachment',
        parameters: { filename: 'total/', foo: 'bar' },
      });
    });

    it('should keep the first duplicate parameter', function () {
      assert.deepEqual(parse('attachment; filename=foo; filename=bar'), {
        type: 'attachment',
        parameters: { filename: 'foo' },
      });
    });

    it('should parse missing type leniently', function () {
      assert.deepEqual(parse('filename="plans.pdf"'), {
        type: 'filename="plans.pdf"',
        parameters: {},
      });
      assert.deepEqual(parse('; filename="plans.pdf"'), {
        type: '',
        parameters: { filename: 'plans.pdf' },
      });
    });

    it('should lower-case parameter name', function () {
      assert.deepEqual(parse('attachment; FILENAME="plans.pdf"'), {
        type: 'attachment',
        parameters: { filename: 'plans.pdf' },
      });
    });

    it('should parse quoted parameter value', function () {
      assert.deepEqual(parse('attachment; filename="plans.pdf"'), {
        type: 'attachment',
        parameters: { filename: 'plans.pdf' },
      });
    });

    it('should parse & unescape quoted value', function () {
      assert.deepEqual(parse('attachment; filename="the \\"plans\\".pdf"'), {
        type: 'attachment',
        parameters: { filename: 'the "plans".pdf' },
      });
    });

    it('should include all parameters', function () {
      assert.deepEqual(parse('attachment; filename="plans.pdf"; foo=bar'), {
        type: 'attachment',
        parameters: { filename: 'plans.pdf', foo: 'bar' },
      });
    });

    it('should parse parameters separated with any LWS', function () {
      assert.deepEqual(
        parse('attachment;filename="plans.pdf" \t;    \t\t foo=bar'),
        {
          type: 'attachment',
          parameters: { filename: 'plans.pdf', foo: 'bar' },
        },
      );
    });

    it('should parse token filename', function () {
      assert.deepEqual(parse('attachment; filename=plans.pdf'), {
        type: 'attachment',
        parameters: { filename: 'plans.pdf' },
      });
    });

    it('should parse ISO-8859-1 filename', function () {
      assert.deepEqual(parse('attachment; filename="£ rates.pdf"'), {
        type: 'attachment',
        parameters: { filename: '£ rates.pdf' },
      });
    });
  });

  describe('with extended parameters', function () {
    it('should preserve quoted extended parameter value', function () {
      assert.deepEqual(
        parse('attachment; filename*="UTF-8\'\'%E2%82%AC%20rates.pdf"'),
        {
          type: 'attachment',
          parameters: { 'filename*': "UTF-8''%E2%82%AC%20rates.pdf" },
        },
      );
    });

    it('should parse UTF-8 extended parameter value', function () {
      assert.deepEqual(
        parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
    });

    it('should parse UTF8 extended parameter value', function () {
      assert.deepEqual(
        parse("attachment; filename*=utf8''%E2%82%AC%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
    });

    it('should parse UTF-8 extended parameter value', function () {
      assert.deepEqual(
        parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
      assert.deepEqual(parse("attachment; filename*=UTF-8''%E4%20rates.pdf"), {
        type: 'attachment',
        parameters: { filename: '\ufffd rates.pdf' },
      });
    });

    it('should parse ISO-8859-1 extended parameter value', function () {
      assert.deepEqual(
        parse("attachment; filename*=ISO-8859-1''%A3%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '£ rates.pdf' },
        },
      );
      assert.deepEqual(
        parse("attachment; filename*=ISO-8859-1''%82%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '? rates.pdf' },
        },
      );
    });

    it('should not be case-sensitive for charset', function () {
      assert.deepEqual(
        parse("attachment; filename*=utf-8''%E2%82%AC%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
    });

    it('should preserve unsupported charset as the original parameter', function () {
      assert.deepEqual(
        parse("attachment; filename*=ISO-8859-2''%A4%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { 'filename*': "ISO-8859-2''%A4%20rates.pdf" },
        },
      );
    });

    it('should parse with embedded language', function () {
      assert.deepEqual(
        parse("attachment; filename*=UTF-8'en'%E2%82%AC%20rates.pdf"),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
    });

    it('should prefer extended parameter value', function () {
      assert.deepEqual(
        parse(
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
        ),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
      assert.deepEqual(
        parse(
          'attachment; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf; filename="EURO rates.pdf"',
        ),
        {
          type: 'attachment',
          parameters: { filename: '€ rates.pdf' },
        },
      );
    });

    it('should keep fallback filename when extended parameter cannot be decoded', function () {
      assert.deepEqual(
        parse(
          'attachment; filename="EURO rates.pdf"; filename*=ISO-8859-2\'\'%A4%20rates.pdf',
        ),
        {
          type: 'attachment',
          parameters: {
            filename: 'EURO rates.pdf',
            'filename*': "ISO-8859-2''%A4%20rates.pdf",
          },
        },
      );
    });
  });

  describe('from TC 2231', function () {
    describe('Disposition-Type Inline', function () {
      it('should parse "inline"', function () {
        assert.deepEqual(parse('inline'), {
          type: 'inline',
          parameters: {},
        });
      });

      it('should parse ""inline"" leniently', function () {
        assert.deepEqual(parse('"inline"'), {
          type: '"inline"',
          parameters: {},
        });
      });

      it('should parse "inline; filename="foo.html""', function () {
        assert.deepEqual(parse('inline; filename="foo.html"'), {
          type: 'inline',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should parse "inline; filename="Not an attachment!""', function () {
        assert.deepEqual(parse('inline; filename="Not an attachment!"'), {
          type: 'inline',
          parameters: { filename: 'Not an attachment!' },
        });
      });

      it('should parse "inline; filename="foo.pdf""', function () {
        assert.deepEqual(parse('inline; filename="foo.pdf"'), {
          type: 'inline',
          parameters: { filename: 'foo.pdf' },
        });
      });
    });

    describe('Disposition-Type Attachment', function () {
      it('should parse "attachment"', function () {
        assert.deepEqual(parse('attachment'), {
          type: 'attachment',
          parameters: {},
        });
      });

      it('should parse ""attachment"" leniently', function () {
        assert.deepEqual(parse('"attachment"'), {
          type: '"attachment"',
          parameters: {},
        });
      });

      it('should parse "ATTACHMENT"', function () {
        assert.deepEqual(parse('ATTACHMENT'), {
          type: 'attachment',
          parameters: {},
        });
      });

      it('should parse "attachment; filename="foo.html""', function () {
        assert.deepEqual(parse('attachment; filename="foo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should parse "attachment; filename="0000000000111111111122222""', function () {
        assert.deepEqual(
          parse('attachment; filename="0000000000111111111122222"'),
          {
            type: 'attachment',
            parameters: { filename: '0000000000111111111122222' },
          },
        );
      });

      it('should parse "attachment; filename="00000000001111111111222222222233333""', function () {
        assert.deepEqual(
          parse('attachment; filename="00000000001111111111222222222233333"'),
          {
            type: 'attachment',
            parameters: { filename: '00000000001111111111222222222233333' },
          },
        );
      });

      it('should parse "attachment; filename="f\\oo.html""', function () {
        assert.deepEqual(parse('attachment; filename="f\\oo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should parse "attachment; filename="\\"quoting\\" tested.html""', function () {
        assert.deepEqual(
          parse('attachment; filename="\\"quoting\\" tested.html"'),
          {
            type: 'attachment',
            parameters: { filename: '"quoting" tested.html' },
          },
        );
      });

      it('should parse "attachment; filename="Here\'s a semicolon;.html""', function () {
        assert.deepEqual(
          parse('attachment; filename="Here\'s a semicolon;.html"'),
          {
            type: 'attachment',
            parameters: { filename: "Here's a semicolon;.html" },
          },
        );
      });

      it('should parse "attachment; foo="bar"; filename="foo.html""', function () {
        assert.deepEqual(parse('attachment; foo="bar"; filename="foo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html', foo: 'bar' },
        });
      });

      it('should parse "attachment; foo="\\"\\\\";filename="foo.html""', function () {
        assert.deepEqual(
          parse('attachment; foo="\\"\\\\";filename="foo.html"'),
          {
            type: 'attachment',
            parameters: { filename: 'foo.html', foo: '"\\' },
          },
        );
      });

      it('should parse "attachment; FILENAME="foo.html""', function () {
        assert.deepEqual(parse('attachment; FILENAME="foo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should parse "attachment; filename=foo.html"', function () {
        assert.deepEqual(parse('attachment; filename=foo.html'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should preserve commas in token values', function () {
        assert.deepEqual(parse('attachment; filename=foo,bar.html'), {
          type: 'attachment',
          parameters: { filename: 'foo,bar.html' },
        });
      });

      it('should ignore trailing semicolon after value', function () {
        assert.deepEqual(parse('attachment; filename=foo.html ;'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should skip empty parameter slots', function () {
        assert.deepEqual(parse('attachment; ;filename=foo'), {
          type: 'attachment',
          parameters: { filename: 'foo' },
        });
      });

      it('should preserve spaces in token values', function () {
        assert.deepEqual(parse('attachment; filename=foo bar.html'), {
          type: 'attachment',
          parameters: { filename: 'foo bar.html' },
        });
      });

      it("should parse \"attachment; filename='foo.bar'", function () {
        assert.deepEqual(parse("attachment; filename='foo.bar'"), {
          type: 'attachment',
          parameters: { filename: "'foo.bar'" },
        });
      });

      it('should parse "attachment; filename="foo-ä.html""', function () {
        assert.deepEqual(parse('attachment; filename="foo-ä.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo-ä.html' },
        });
      });

      it('should parse "attachment; filename="foo-Ã¤.html""', function () {
        assert.deepEqual(parse('attachment; filename="foo-Ã¤.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo-Ã¤.html' },
        });
      });

      it('should parse "attachment; filename="foo-%41.html""', function () {
        assert.deepEqual(parse('attachment; filename="foo-%41.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo-%41.html' },
        });
      });

      it('should parse "attachment; filename="50%.html""', function () {
        assert.deepEqual(parse('attachment; filename="50%.html"'), {
          type: 'attachment',
          parameters: { filename: '50%.html' },
        });
      });

      it('should parse "attachment; filename="foo-%\\41.html""', function () {
        assert.deepEqual(parse('attachment; filename="foo-%\\41.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo-%41.html' },
        });
      });

      it('should parse "attachment; name="foo-%41.html""', function () {
        assert.deepEqual(parse('attachment; name="foo-%41.html"'), {
          type: 'attachment',
          parameters: { name: 'foo-%41.html' },
        });
      });

      it('should parse "attachment; filename="ä-%41.html""', function () {
        assert.deepEqual(parse('attachment; filename="ä-%41.html"'), {
          type: 'attachment',
          parameters: { filename: 'ä-%41.html' },
        });
      });

      it('should parse "attachment; filename="foo-%c3%a4-%e2%82%ac.html""', function () {
        assert.deepEqual(
          parse('attachment; filename="foo-%c3%a4-%e2%82%ac.html"'),
          {
            type: 'attachment',
            parameters: { filename: 'foo-%c3%a4-%e2%82%ac.html' },
          },
        );
      });

      it('should parse "attachment; filename ="foo.html""', function () {
        assert.deepEqual(parse('attachment; filename ="foo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should keep the first duplicate quoted filename', function () {
        assert.deepEqual(
          parse('attachment; filename="foo.html"; filename="bar.html"'),
          {
            type: 'attachment',
            parameters: { filename: 'foo.html' },
          },
        );
      });

      it('should preserve bracket characters in token values', function () {
        assert.deepEqual(parse('attachment; filename=foo[1](2).html'), {
          type: 'attachment',
          parameters: { filename: 'foo[1](2).html' },
        });
      });

      it('should preserve latin1 token values', function () {
        assert.deepEqual(parse('attachment; filename=foo-ä.html'), {
          type: 'attachment',
          parameters: { filename: 'foo-ä.html' },
        });
      });

      it('should preserve mojibake token values', function () {
        assert.deepEqual(parse('attachment; filename=foo-Ã¤.html'), {
          type: 'attachment',
          parameters: { filename: 'foo-Ã¤.html' },
        });
      });

      it('should treat a bare parameter as the type', function () {
        assert.deepEqual(parse('filename=foo.html'), {
          type: 'filename=foo.html',
          parameters: {},
        });
      });

      it('should preserve invalid type token with parameters', function () {
        assert.deepEqual(parse('x=y; filename=foo.html'), {
          type: 'x=y',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should stop at the first recoverable parameter after a quoted type', function () {
        assert.deepEqual(parse('"foo; filename=bar;baz"; filename=qux'), {
          type: '"foo',
          parameters: { filename: 'bar' },
        });
      });

      it('should preserve commas in a malformed type token', function () {
        assert.deepEqual(parse('filename=foo.html, filename=bar.html'), {
          type: 'filename=foo.html, filename=bar.html',
          parameters: {},
        });
      });

      it('should allow an empty type when parameters follow', function () {
        assert.deepEqual(parse('; filename=foo.html'), {
          type: '',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should preserve leading punctuation in the type', function () {
        assert.deepEqual(parse(': inline; attachment; filename=foo.html'), {
          type: ': inline',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should skip bare parameters without values', function () {
        assert.deepEqual(parse('inline; attachment; filename=foo.html'), {
          type: 'inline',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should skip bare attachment parameters without values', function () {
        assert.deepEqual(parse('attachment; inline; filename=foo.html'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should ignore a suffix after a quoted filename', function () {
        assert.deepEqual(parse('attachment; filename="foo.html".txt'), {
          type: 'attachment',
          parameters: { filename: 'foo.html' },
        });
      });

      it('should treat an unterminated quoted filename as empty', function () {
        assert.deepEqual(parse('attachment; filename="bar'), {
          type: 'attachment',
          parameters: { filename: '' },
        });
      });

      it('should stop a token value at the next semicolon', function () {
        assert.deepEqual(parse('attachment; filename=foo"bar;baz"qux'), {
          type: 'attachment',
          parameters: { filename: 'foo"bar' },
        });
      });

      it('should preserve a comma-separated header fragment in the first value', function () {
        assert.deepEqual(
          parse('attachment; filename=foo.html, attachment; filename=bar.html'),
          {
            type: 'attachment',
            parameters: { filename: 'foo.html, attachment' },
          },
        );
      });

      it('should keep an unseparated parameter assignment inside the value', function () {
        assert.deepEqual(parse('attachment; foo=foo filename=bar'), {
          type: 'attachment',
          parameters: { foo: 'foo filename=bar' },
        });
      });

      it('should keep trailing assignments inside the filename value', function () {
        assert.deepEqual(parse('attachment; filename=bar foo=foo'), {
          type: 'attachment',
          parameters: { filename: 'bar foo=foo' },
        });
      });

      it('should treat missing semicolon after the type as part of the type', function () {
        assert.deepEqual(parse('attachment filename=bar'), {
          type: 'attachment filename=bar',
          parameters: {},
        });
      });

      it('should keep the first malformed type segment', function () {
        assert.deepEqual(parse('filename=foo.html; attachment'), {
          type: 'filename=foo.html',
          parameters: {},
        });
      });

      it('should parse "attachment; xfilename=foo.html"', function () {
        assert.deepEqual(parse('attachment; xfilename=foo.html'), {
          type: 'attachment',
          parameters: { xfilename: 'foo.html' },
        });
      });

      it('should parse "attachment; filename="/foo.html""', function () {
        assert.deepEqual(parse('attachment; filename="/foo.html"'), {
          type: 'attachment',
          parameters: { filename: '/foo.html' },
        });
      });

      it('should parse "attachment; filename="\\\\foo.html""', function () {
        assert.deepEqual(parse('attachment; filename="\\\\foo.html"'), {
          type: 'attachment',
          parameters: { filename: '\\foo.html' },
        });
      });
    });

    describe('Additional Parameters', function () {
      it('should parse "attachment; creation-date="Wed, 12 Feb 1997 16:29:51 -0500""', function () {
        assert.deepEqual(
          parse('attachment; creation-date="Wed, 12 Feb 1997 16:29:51 -0500"'),
          {
            type: 'attachment',
            parameters: { 'creation-date': 'Wed, 12 Feb 1997 16:29:51 -0500' },
          },
        );
      });

      it('should parse "attachment; modification-date="Wed, 12 Feb 1997 16:29:51 -0500""', function () {
        assert.deepEqual(
          parse(
            'attachment; modification-date="Wed, 12 Feb 1997 16:29:51 -0500"',
          ),
          {
            type: 'attachment',
            parameters: {
              'modification-date': 'Wed, 12 Feb 1997 16:29:51 -0500',
            },
          },
        );
      });
    });

    describe('Disposition-Type Extension', function () {
      it('should parse "foobar"', function () {
        assert.deepEqual(parse('foobar'), {
          type: 'foobar',
          parameters: {},
        });
      });

      it('should parse "attachment; example="filename=example.txt""', function () {
        assert.deepEqual(parse('attachment; example="filename=example.txt"'), {
          type: 'attachment',
          parameters: { example: 'filename=example.txt' },
        });
      });
    });

    describe('RFC 2231/5987 Encoding: Character Sets', function () {
      it('should parse "attachment; filename*=iso-8859-1\'\'foo-%E4.html"', function () {
        assert.deepEqual(
          parse("attachment; filename*=iso-8859-1''foo-%E4.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it('should parse "attachment; filename*=UTF-8\'\'foo-%c3%a4-%e2%82%ac.html"', function () {
        assert.deepEqual(
          parse("attachment; filename*=UTF-8''foo-%c3%a4-%e2%82%ac.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä-€.html' },
          },
        );
      });

      it('should preserve extended values without a charset', function () {
        assert.deepEqual(
          parse("attachment; filename*=''foo-%c3%a4-%e2%82%ac.html"),
          {
            type: 'attachment',
            parameters: { 'filename*': "''foo-%c3%a4-%e2%82%ac.html" },
          },
        );
      });

      it('should parse "attachment; filename*=UTF-8\'\'foo-a%cc%88.html"', function () {
        assert.deepEqual(
          parse("attachment; filename*=UTF-8''foo-a%cc%88.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it('should parse "attachment; filename*=iso-8859-1\'\'foo-%c3%a4-%e2%82%ac.html"', function () {
        assert.deepEqual(
          parse("attachment; filename*=iso-8859-1''foo-%c3%a4-%e2%82%ac.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-Ã¤-â?¬.html' },
          },
        );
      });

      it('should parse "attachment; filename*=utf-8\'\'foo-%E4.html"', function () {
        assert.deepEqual(parse("attachment; filename*=utf-8''foo-%E4.html"), {
          type: 'attachment',
          parameters: { filename: 'foo-\ufffd.html' },
        });
      });

      it('should preserve spaces before the star in the parameter name', function () {
        assert.deepEqual(
          parse("attachment; filename *=UTF-8''foo-%c3%a4.html"),
          {
            type: 'attachment',
            parameters: { 'filename ': 'foo-ä.html' },
          },
        );
      });

      it('should parse "attachment; filename*= UTF-8\'\'foo-%c3%a4.html"', function () {
        assert.deepEqual(
          parse("attachment; filename*= UTF-8''foo-%c3%a4.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it('should parse "attachment; filename* =UTF-8\'\'foo-%c3%a4.html"', function () {
        assert.deepEqual(
          parse("attachment; filename* =UTF-8''foo-%c3%a4.html"),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it('should preserve quoted UTF-8 extended values verbatim', function () {
        assert.deepEqual(
          parse('attachment; filename*="UTF-8\'\'foo-%c3%a4.html"'),
          {
            type: 'attachment',
            parameters: { 'filename*': "UTF-8''foo-%c3%a4.html" },
          },
        );
      });

      it('should preserve quoted extended values without charset verbatim', function () {
        assert.deepEqual(parse('attachment; filename*="foo%20bar.html"'), {
          type: 'attachment',
          parameters: { 'filename*': 'foo%20bar.html' },
        });
      });

      it('should preserve extended values without both apostrophes', function () {
        assert.deepEqual(parse("attachment; filename*=UTF-8'foo-%c3%a4.html"), {
          type: 'attachment',
          parameters: { 'filename*': "UTF-8'foo-%c3%a4.html" },
        });
      });

      it('should preserve malformed trailing percent escapes', function () {
        assert.deepEqual(parse("attachment; filename*=UTF-8''foo%"), {
          type: 'attachment',
          parameters: { filename: 'foo%' },
        });
      });

      it('should preserve malformed percent escapes inside the value', function () {
        assert.deepEqual(parse("attachment; filename*=UTF-8''f%oo.html"), {
          type: 'attachment',
          parameters: { filename: 'f%oo.html' },
        });
      });

      it('should parse "attachment; filename*=UTF-8\'\'A-%2541.html"', function () {
        assert.deepEqual(parse("attachment; filename*=UTF-8''A-%2541.html"), {
          type: 'attachment',
          parameters: { filename: 'A-%41.html' },
        });
      });

      it('should parse "attachment; filename*=UTF-8\'\'%5cfoo.html"', function () {
        assert.deepEqual(parse("attachment; filename*=UTF-8''%5cfoo.html"), {
          type: 'attachment',
          parameters: { filename: '\\foo.html' },
        });
      });
    });

    describe('RFC2231 Encoding: Continuations', function () {
      it('should parse "attachment; filename*0="foo."; filename*1="html""', function () {
        assert.deepEqual(
          parse('attachment; filename*0="foo."; filename*1="html"'),
          {
            type: 'attachment',
            parameters: { 'filename*0': 'foo.', 'filename*1': 'html' },
          },
        );
      });

      it('should parse "attachment; filename*0="foo"; filename*1="\\b\\a\\r.html""', function () {
        assert.deepEqual(
          parse('attachment; filename*0="foo"; filename*1="\\b\\a\\r.html"'),
          {
            type: 'attachment',
            parameters: { 'filename*0': 'foo', 'filename*1': 'bar.html' },
          },
        );
      });

      it('should parse "attachment; filename*0*=UTF-8\'\'foo-%c3%a4; filename*1=".html""', function () {
        assert.deepEqual(
          parse(
            'attachment; filename*0*=UTF-8\'\'foo-%c3%a4; filename*1=".html"',
          ),
          {
            type: 'attachment',
            parameters: {
              'filename*0': 'foo-ä',
              'filename*1': '.html',
            },
          },
        );
      });

      it('should parse "attachment; filename*0="foo"; filename*01="bar""', function () {
        assert.deepEqual(
          parse('attachment; filename*0="foo"; filename*01="bar"'),
          {
            type: 'attachment',
            parameters: { 'filename*0': 'foo', 'filename*01': 'bar' },
          },
        );
      });

      it('should parse "attachment; filename*0="foo"; filename*2="bar""', function () {
        assert.deepEqual(
          parse('attachment; filename*0="foo"; filename*2="bar"'),
          {
            type: 'attachment',
            parameters: { 'filename*0': 'foo', 'filename*2': 'bar' },
          },
        );
      });

      it('should parse "attachment; filename*1="foo."; filename*2="html""', function () {
        assert.deepEqual(
          parse('attachment; filename*1="foo."; filename*2="html"'),
          {
            type: 'attachment',
            parameters: { 'filename*1': 'foo.', 'filename*2': 'html' },
          },
        );
      });

      it('should parse "attachment; filename*1="bar"; filename*0="foo""', function () {
        assert.deepEqual(
          parse('attachment; filename*1="bar"; filename*0="foo"'),
          {
            type: 'attachment',
            parameters: { 'filename*1': 'bar', 'filename*0': 'foo' },
          },
        );
      });
    });

    describe('RFC2231 Encoding: Fallback Behaviour', function () {
      it('should parse "attachment; filename="foo-ae.html"; filename*=UTF-8\'\'foo-%c3%a4.html"', function () {
        assert.deepEqual(
          parse(
            'attachment; filename="foo-ae.html"; filename*=UTF-8\'\'foo-%c3%a4.html',
          ),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it('should parse "attachment; filename*=UTF-8\'\'foo-%c3%a4.html; filename="foo-ae.html"', function () {
        assert.deepEqual(
          parse(
            'attachment; filename*=UTF-8\'\'foo-%c3%a4.html; filename="foo-ae.html"',
          ),
          {
            type: 'attachment',
            parameters: { filename: 'foo-ä.html' },
          },
        );
      });

      it("should parse \"attachment; filename*0*=ISO-8859-15''euro-sign%3d%a4; filename*=ISO-8859-1''currency-sign%3d%a4", function () {
        assert.deepEqual(
          parse(
            "attachment; filename*0*=ISO-8859-15''euro-sign%3d%a4; filename*=ISO-8859-1''currency-sign%3d%a4",
          ),
          {
            type: 'attachment',
            parameters: {
              filename: 'currency-sign=¤',
              'filename*0*': "ISO-8859-15''euro-sign%3d%a4",
            },
          },
        );
      });

      it('should parse "attachment; foobar=x; filename="foo.html"', function () {
        assert.deepEqual(parse('attachment; foobar=x; filename="foo.html"'), {
          type: 'attachment',
          parameters: { filename: 'foo.html', foobar: 'x' },
        });
      });
    });

    describe('RFC2047 Encoding', function () {
      it('should preserve RFC2047-looking token values', function () {
        assert.deepEqual(
          parse('attachment; filename==?ISO-8859-1?Q?foo-=E4.html?='),
          {
            type: 'attachment',
            parameters: { filename: '=?ISO-8859-1?Q?foo-=E4.html?=' },
          },
        );
      });

      it('should parse "attachment; filename="=?ISO-8859-1?Q?foo-=E4.html?=""', function () {
        assert.deepEqual(
          parse('attachment; filename="=?ISO-8859-1?Q?foo-=E4.html?="'),
          {
            type: 'attachment',
            parameters: { filename: '=?ISO-8859-1?Q?foo-=E4.html?=' },
          },
        );
      });
    });
  });
});
