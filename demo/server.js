'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { create, parse } = require('../dist/index.js');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const indexPath = path.join(__dirname, 'index.html');

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      const html = fs.readFileSync(indexPath, 'utf8');
      send(res, 200, html, 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'POST' && req.url === '/inspect') {
      const result = await inspectUpload(req);
      send(
        res,
        200,
        JSON.stringify(result, null, 2),
        'application/json; charset=utf-8',
      );
      return;
    }

    send(
      res,
      404,
      JSON.stringify({ error: 'Not found' }),
      'application/json; charset=utf-8',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    send(
      res,
      400,
      JSON.stringify({ error: message }),
      'application/json; charset=utf-8',
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Content-Disposition demo running at http://${HOST}:${PORT}`);
});

function send(res, statusCode, body, contentType) {
  res.writeHead(statusCode, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': contentType,
  });
  res.end(body);
}

async function inspectUpload(req) {
  const contentType = req.headers['content-type'] || '';
  const boundary = getBoundary(contentType);

  if (!boundary) {
    throw new Error('Expected multipart/form-data upload');
  }

  const body = await readRequestBody(req);
  const parts = parseMultipart(body, boundary);
  const fields = {};
  const files = [];

  for (const part of parts) {
    const dispositionHeader = part.headers['content-disposition'];
    if (!dispositionHeader) continue;

    const disposition = parse(dispositionHeader);
    const name = disposition.parameters.name || '';
    const filename = disposition.parameters.filename;

    if (!filename) {
      fields[name] = part.content.toString('utf8');
      continue;
    }

    files.push({
      fieldName: name,
      filename,
      size: part.content.length,
      contentType: part.headers['content-type'] || 'application/octet-stream',
      rawHeaders: part.rawHeaders,
      uploadContentDisposition: dispositionHeader,
      parsedUploadDisposition: disposition,
    });
  }

  const options = getCreateOptions(fields);

  return {
    options,
    files: files.map((file) => ({
      ...file,
      generatedDownloadDisposition: create(file.filename, options),
      reparsedGeneratedDisposition: parse(create(file.filename, options)),
    })),
  };
}

function getCreateOptions(fields) {
  const type = fields.dispositionType === 'inline' ? 'inline' : 'attachment';
  const fallbackMode =
    fields.fallbackMode === 'none'
      ? 'none'
      : fields.fallbackMode === 'custom'
        ? 'custom'
        : 'auto';
  const customFallback = (fields.customFallback || '').trim();

  if (fallbackMode === 'none') {
    return { type, fallback: false };
  }

  if (fallbackMode === 'custom' && customFallback) {
    return { type, fallback: customFallback };
  }

  return { type };
}

function getBoundary(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  return match ? match[1] || match[2] : undefined;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(body, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];

  for (const section of splitBuffer(body, boundaryBuffer)) {
    const part = stripMultipartSection(section);
    if (!part || part.equals(Buffer.from('--'))) continue;

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const rawHeaders = decodeMultipartHeaders(part.subarray(0, headerEnd));
    const content = part.subarray(headerEnd + 4);
    const headers = {};

    for (const line of rawHeaders.split('\r\n')) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      headers[key] = value;
    }

    parts.push({ headers, rawHeaders, content });
  }

  return parts;
}

function decodeMultipartHeaders(buffer) {
  const utf8 = buffer.toString('utf8');
  return utf8.includes('\uFFFD') ? buffer.toString('latin1') : utf8;
}

function splitBuffer(buffer, separator) {
  const sections = [];
  let offset = 0;

  while (offset <= buffer.length) {
    const index = buffer.indexOf(separator, offset);
    if (index === -1) {
      sections.push(buffer.subarray(offset));
      break;
    }

    sections.push(buffer.subarray(offset, index));
    offset = index + separator.length;
  }

  return sections;
}

function stripMultipartSection(section) {
  let start = 0;
  let end = section.length;

  while (start < end && (section[start] === 13 || section[start] === 10))
    start++;
  while (end > start && (section[end - 1] === 13 || section[end - 1] === 10))
    end--;

  return start < end ? section.subarray(start, end) : null;
}
