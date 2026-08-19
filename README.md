# @arraypress/file-utils

> The three things you know about a file before you open it — its **size**, its **name**, and its **type**. Zero dependencies, works in any JS runtime.

For what's *inside* a file — EXIF, IPTC, ID3 — reach for
[`@arraypress/file-metadata`](https://github.com/arraypress/file-metadata), which parses the bytes
themselves. This package handles the attributes you already have.

## Install

```bash
npm install @arraypress/file-utils
```

## Usage

```js
import { formatSize, sanitize, getLabel } from '@arraypress/file-utils';

formatSize(file.size);  // '1.5 MB'
sanitize(file.name);    // 'my_upload.pdf'
getLabel(file.type);    // 'Document'
```

A typical upload handler uses all three at once:

```js
import { formatSize, sanitize, contentDisposition, isPreviewable } from '@arraypress/file-utils';

const name = sanitize(upload.name);                  // safe for disk + headers
const label = `${getLabel(upload.type)} · ${formatSize(upload.size)}`;  // 'Image · 2.4 MB'

return new Response(body, {
  headers: {
    'Content-Disposition': contentDisposition(name, isPreviewable(upload.type) ? 'inline' : 'attachment'),
  },
});
```

## API

### Size

**`formatSize(bytes, decimals = 1)`** — bytes as a human-readable string. Returns `''` for
`null`/`undefined`/negative, `'0 B'` for zero. Scales through B → KB → MB → GB → TB.

```js
formatSize(0);           // '0 B'
formatSize(1536);        // '1.5 KB'
formatSize(1073741824);  // '1.0 GB'
formatSize(1536, 2);     // '1.50 KB'
```

### Name

**`sanitize(filename, options?)`** — makes a filename safe for storage and HTTP headers. Strips
directory components, control characters and platform-unsafe characters; blocks Windows reserved
device names; truncates while preserving the extension.

Options: `fallback` (default `'file'`), `maxLength` (default `255`), `replacement` (default `'_'`).

```js
sanitize('report.pdf');            // 'report.pdf'
sanitize('../../uploads/report.pdf');  // 'report.pdf'
sanitize('my "file".txt');         // 'my _file_.txt'
sanitize('file\x00name.zip');      // 'file_name.zip'
sanitize('CON.txt');               // '_CON.txt'
sanitize('');                      // 'file'
```

**`contentDisposition(filename, disposition = 'attachment')`** — a complete, safe header value.
Sanitises first, then adds an RFC 5987 `filename*` when the name contains non-ASCII characters.

```js
contentDisposition('report.pdf');
// 'attachment; filename="report.pdf"'

contentDisposition('résumé.pdf');
// 'attachment; filename="r_sum_.pdf"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9.pdf'

contentDisposition('photo.jpg', 'inline');
// 'inline; filename="photo.jpg"'
```

**`extensionFromName(filename)`** — extension without the dot, lowercased. `''` when there isn't one.

```js
extensionFromName('report.pdf');      // 'pdf'
extensionFromName('archive.tar.gz');  // 'gz'
extensionFromName('README');          // ''
```

**`replaceExtension(filename, ext)`** — swap the extension.

```js
replaceExtension('photo.png', 'webp');  // 'photo.webp'
replaceExtension('README', 'md');       // 'README.md'
```

**`humanize(filename)`** — a display title from a filename. Strips the extension, turns separators
into spaces, title-cases. Handy for alt text and headings.

```js
humanize('my-product-banner.jpg');     // 'My Product Banner'
humanize('dark_ambient_loop_01.wav');  // 'Dark Ambient Loop 01'
```

### Type

**`isImage(mime)`** · **`isAudio(mime)`** · **`isVideo(mime)`** · **`isDocument(mime)`** ·
**`isArchive(mime)`** — predicates over a content-type string. `isDocument` covers PDF, Office
(including OpenXML and OpenDocument) and text formats; `isArchive` covers zip, rar, 7z, tar, gzip
and bzip2.

**`getCategory(mime)`** — one of `'image' | 'audio' | 'video' | 'document' | 'archive' | 'other'`.

**`getLabel(mime)`** — a human-readable label. Falls back to the upper-cased subtype for anything
uncategorised, and `'Unknown'` for empty input.

```js
getLabel('image/png');         // 'Image'
getLabel('application/pdf');   // 'Document'
getLabel('application/json');  // 'JSON'
getLabel(null);                // 'Unknown'
```

**`extensionFromMime(mime)`** — the usual extension for a content type, or `''`. Covers common
web and media types rather than the full IANA registry.

```js
extensionFromMime('image/jpeg');  // 'jpg'
extensionFromMime('audio/mpeg');  // 'mp3'
```

**`isPreviewable(mime)`** — whether a browser can render it natively: images, audio, video, PDF
and `text/*`.

### Why `extensionFromName` and `extensionFromMime`

Both answer "what's the extension?", but from opposite directions — one reads a filename, the other
derives it from a content type. They arrived here from two packages that each called it
`getExtension`, so they're now named for their input. `extensionFromName('image.png')` and
`extensionFromMime('image/png')` both return `'png'`; pass the wrong one and you'd silently get `''`.

## Absorbed packages

This package replaces three that have since been removed from npm:

| Removed | Now |
|---|---|
| `@arraypress/file-size` | `formatSize` |
| `@arraypress/safe-filename` | `sanitize`, `contentDisposition`, `extensionFromName`, `replaceExtension`, `humanize` |
| `@arraypress/mime-types` | `isImage`…`isPreviewable`, `getCategory`, `getLabel`, `extensionFromMime` |

Behaviour is unchanged apart from the two `getExtension` renames above.

## License

MIT
