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

Add `locale` (a BCP 47 tag) to write the number and unit in another language with `Intl.NumberFormat`,
at the same scale and decimals. An unknown locale gives the output without it.

```js
formatSize(1536, { locale: 'de' });                         // '1,5 kB'
formatSize(104857600, { wholeUnits: true, locale: 'fr' });  // '100 Mo'
formatSize(1536, { decimals: 2, locale: 'pt-BR' });         // '1,50 kB'
```

### Name

**`sanitize(filename, options?)`** — makes a filename safe for storage and HTTP headers. Strips
directory components, control characters and platform-unsafe characters; blocks Windows reserved
device names (`isReservedName(name)`: CON, NUL, COM1, COM¹, CONIN$…, alone or before an extension);
drops invisible and direction-changing characters (bidirectional overrides, zero-width spaces);
truncates while preserving the extension as written, never cutting a character in two.

Options: `fallback` (default `'file'`), `maxLength` (default `255`, in UTF-16 units), `maxBytes`
(UTF-8 bytes, what Linux and APFS count; default no limit), `replacement` (default `'_'`).

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

### Naming a file from the web

A useful name for a file before it's saved, from what's known about it: its own name, its
address, its type, and the page and link it came from. Written for Better Downloads and Better Saves
(Chrome extensions), pure, so it runs anywhere.

```js
import { ruleName, cleanName, isMeaningless, finishName } from '@arraypress/file-utils';

ruleName({
  filename: 'download (3).pdf', mime: 'application/pdf',
  referrer: 'https://billing.acme.com/invoices', pageTitle: 'Invoice 2026-11 – Acme Billing',
}).name;                                                     // 'Acme Invoice 2026-11.pdf'

// An image whose name is a CDN's id, named from its alt text, into a folder already named after the site:
ruleName({ filename: 'photo-1506744038136-46273834b3fb', mime: 'image/jpeg',
  referrer: 'https://unsplash.com/photos/x', label: 'A mountain lake at dawn' }, { site: false }).name;
                                                             // 'A mountain lake at dawn.jpg'
cleanName('Annual%20Report%202025%20(1).pdf');               // 'Annual Report 2025.pdf'
isMeaningless('3f2a9c1e-7b4d-4e8a-9c2b-1a2b3c4d5e6f');       // true
isMeaningless('IMG_2384');                                   // false (a camera's name: kept)
finishName('Q3: “final” report?', 'php', 'application/pdf'); // 'Q3 - “final” report.pdf'
```

**`ruleName(facts, options?)`** — `facts`: `filename` (the name or path the browser would use),
and any of `url`, `finalUrl`, `mime`, `referrer` (the page), `pageTitle`, `label` (what the page
says the file is: alt text, a caption, a heading; used as it is) and `linkText` (the link's text; its
verb and note about the file come off). A name that says something is only tidied (`cleanName`)
and given the right extension; a meaningless one is named from, in order, a file name in the
address's query, the label, the link text, the page's title (the site's own name taken off), the
address's path, with the site's name in front (`options.site: false` leaves it
off). Returns `{ name, meaningless, ext }`. Every name ends with **`finishName(base, ext, mime)`**:
readable stand-ins for `:?*"<>|/`, `sanitize`, at most `MAX_NAME_LENGTH` (120) characters.

The pieces, each pure: `splitName` / `joinName` / `baseName` (`tar.gz` kept together, “Version
2.0” has no extension), `decodeName`, `stripTracking`, `stripCopyMarks`, `stripSizeMarks` (“1280px-”, “-1024x683”, “_600x”), `tidySpacing`,
`cleanName`, `isMeaningless` (generic words, numbers, hashes, base64, a generic word beside an id),
`isDeviceName` (“IMG_2384”, “PXL_…”, “Screenshot …”: never meaningless), `siteName` (“Acme” from
billing.acme.co.uk), `namesSite(text, site)` (the site's name as a word of its own), `fromLabel`, `fromLinkText`, `fromTitle`, `fromQuery`, `fromPath`, `withSite`, `hostOf`,
`extensionFor(ext, mime)` (a real extension is always kept: “main.c” sent as text/plain,
“deck.key” as application/zip and “song.m4a” as video/mp4 are still themselves; the type's usual
one only when there is none, or it is the server script's that sent the file, “download.php”;
plain text adds none to “Makefile”; never a program's changed or given).

**`pageName({ url, title }, { maxLength, fallback })`**: a name for something made from a whole
page (a folder of its files, a screenshot of it): `withSite(fromTitle(title))`, else the site's
name, else the host; `:` and slashes made readable; cut between words at `MAX_PAGE_NAME_LENGTH`
(80). “Lake District trips – Example” on www.example.com → “Example Lake District trips”.

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
web, media and office types and the aliases servers send (`audio/mp3`, `image/jpg`,
`application/x-zip-compressed`) rather than the full IANA registry; case and parameters don't matter.

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
