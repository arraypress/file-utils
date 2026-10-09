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

Pass an options object instead of a number for more: `decimals`, and `wholeUnits` — a value within
0.05 of a whole unit prints without a decimal, thousands are grouped, the sign is kept and the
scale reaches PB. That is exactly what the PHP `SugarCommerce\Format\Bytes::format()` prints, for
pages where the server and the browser both write sizes. Add `si: true` for 1000-based units.

```js
formatSize(104857600, { wholeUnits: true });            // '100 MB'
formatSize(1048063, { wholeUnits: true });              // '1,023.5 KB'
formatSize(104857600, { wholeUnits: true, si: true });  // '104.9 MB'
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

**`renameKeepingExtension(current, typed, max = 255)`** — the name a file ends up with when somebody
renames it, keeping its extension whatever they typed (a rename from `.wav` to `.exe` would be a
different file to an upload check, a player and the buyer's computer). Invisible and
direction-changing characters go, whitespace collapses, slashes become `-`, outer dots and spaces
go; `''` when no letter or digit is left. Lengths are counted in characters, not UTF-16 units.

```js
renameKeepingExtension('Master.wav', 'Final mix');      // 'Final mix.wav'
renameKeepingExtension('Master.wav', 'Final mix.WAV');  // 'Final mix.wav'
renameKeepingExtension('Master.wav', 'evil.exe');       // 'evil.exe.wav'
renameKeepingExtension('Master.wav', '...');            // ''
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

### Type, by name

For when there is a filename and no content type — a file list, an upload queue. Presentation
only: never decide whether a file is safe from its extension.

**`getCategoryFromName(filename)`** — the same six categories as `getCategory`, from the
extension. Spreadsheets and slides count as documents; code and fonts as other. Kept in step with
the PHP `SugarCommerce\Format\FileType`, so a file gets the same icon on both sides.

**`inlineType(filename)`** — the content type to show or play a file inline as, when every current
browser renders it: PNG/JPEG/GIF/WebP/AVIF, MP4/WebM/MOV, MP3/WAV/M4A/AAC/Ogg/Opus/FLAC and PDF.
`''` otherwise — not SVG (it can carry script), not TIFF/HEIC/PSD, not AIFF (Safari only).

**`isPlayableAudio(filename)`** — whether `inlineType` is audio.

```js
getCategoryFromName('Budget.xlsx');  // 'document'
inlineType('take.flac');             // 'audio/flac'
isPlayableAudio('session.aiff');     // false
```

### Kind, by name

For a file browser: the category, plus `font` and `software` (plugins,
installers, presets, project files) that the categories fold into `other`.

```js
import { getKindFromName, getLabelFromName, getPreviewKind } from '@arraypress/file-utils';

getKindFromName('Grotto Sans.otf');   // 'font'
getKindFromName('Prism.vst3');        // 'software'
getLabelFromName('Night Shift.wav');  // 'WAV audio'
getPreviewKind('cover.webp');         // 'image' (null when browsers don't all render it)
```

| | |
|---|---|
| `getKindFromName(filename)` | `FileKind`: a `Category`, `font`, or `software`. |
| `getLabelFromName(filename)` | "WAV audio", "OTF font", "VST3 file", or "File". |
| `getPreviewKind(filename)` | `image`, `audio`, `video` or `null`. |

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

## Testing

```bash
npm test
```

224 tests. The `wholeUnits` size cases are values the PHP `Bytes::format()` printed, so the two
cannot drift apart unnoticed.

## License

MIT
