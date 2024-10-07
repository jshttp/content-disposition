import { expect } from 'chai';
import { ContentDisposition } from './ContentDisposition'; // Импорт класса ContentDisposition

describe('Content-Disposition', () => {

  it('should parse a simple attachment type', () => {
    const result = ContentDisposition.parse('attachment');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {}
    });
  });

  it('should parse an attachment with filename', () => {
    const result = ContentDisposition.parse('attachment; filename="example.txt"');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'example.txt'
      }
    });
  });

  it('should parse an inline type with parameters', () => {
    const result = ContentDisposition.parse('inline; filename="document.pdf"; creation-date="Tue, 12 Feb 2019 10:00:00 GMT"');
    expect(result).to.deep.equal({
      type: 'inline',
      parameters: {
        filename: 'document.pdf',
        'creation-date': 'Tue, 12 Feb 2019 10:00:00 GMT'
      }
    });
  });

  it('should decode RFC 5987 extended filename parameter', () => {
    const result = ContentDisposition.parse('attachment; filename*=UTF-8\'\'%e2%82%ac%20rates');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: '€ rates'
      }
    });
  });

  it('should parse filename with emoji', () => {
    const result = ContentDisposition.parse('attachment; filename*=UTF-8\'\'%F0%9F%98%8A%20file.txt');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: '😊 file.txt'
      }
    });
  });

  it('should parse filename with Cyrillic characters', () => {
    const result = ContentDisposition.parse('attachment; filename*=UTF-8\'\'%D0%A4%D0%B0%D0%B9%D0%BB.txt');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'Файл.txt'
      }
    });
  });

  it('should parse filename with Arabic characters', () => {
    const result = ContentDisposition.parse('attachment; filename*=UTF-8\'\'%D9%85%D9%84%D9%81.txt');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'ملف.txt'
      }
    });
  });

  it('should parse filename with Chinese characters', () => {
    const result = ContentDisposition.parse('attachment; filename*=UTF-8\'\'%E6%96%87%E4%BB%B6.txt');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: '文件.txt'
      }
    });
  });

  it('should throw an error for invalid header string', () => {
    expect(() => ContentDisposition.parse(';invalid-header')).to.throw(TypeError, 'invalid type format');
  });

  it('should throw an error for duplicate parameters', () => {
    expect(() => ContentDisposition.parse('attachment; filename="file.txt"; filename="other.txt"'))
      .to.throw(TypeError, 'invalid duplicate parameter');
  });

  it('should handle non-quoted string parameters', () => {
    const result = ContentDisposition.parse('attachment; filename=file.txt');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'file.txt'
      }
    });
  });

  it('should handle escaped characters in quoted string', () => {
    const result = ContentDisposition.parse('attachment; filename="file \\"name\\".txt"');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'file "name".txt'
      }
    });
  });

  it('should handle ISO-8859-1 encoding in extended field', () => {
    const result = ContentDisposition.parse('attachment; filename*=ISO-8859-1\'\'caf%E9');
    expect(result).to.deep.equal({
      type: 'attachment',
      parameters: {
        filename: 'café'
      }
    });
  });

  it('should throw error for unsupported charset in extended field', () => {
    expect(() => ContentDisposition.parse('attachment; filename*=UNKNOWN\'\'caf%E9'))
      .to.throw(TypeError, 'unsupported charset in extended field');
  });

});
