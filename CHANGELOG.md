# Changelog

All notable changes to `@arraypress/file-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] — Unreleased

### Added

- `uniqueNames(taken?)`: a namer that numbers a name it has given before, case aside (“View.jpg”, “View 2.jpg”, “View 3.jpg”), a long name cut to make room for its number. Moved from Better Saves (its ZIP's entries and folder), for Better Images, which also hands it the names already in a folder (`taken`) so nothing saved there replaces a file.

## [1.5.0] — Unreleased

### Added

- `sanitize`'s `maxBytes` option: the longest name in UTF-8 bytes, which is what Linux and APFS count (255). `finishName` and `pageName` use it (240): 120 Chinese or Japanese characters are 360 bytes.
- `isReservedName(name)`: whether Windows keeps a name for a device. `namesSite(text, site)`: whether text names a site as a word of its own.

### Fixed

- `extensionFor` (so `ruleName` and `finishName`) never replaces a real extension. The type a site sends is too often a guess: “main.c”, “backup.sql”, “key.pem”, “logo.svg” and “notebook.ipynb” sent as text/plain became “.txt”, “deck.key” and “map.kmz” sent as application/zip “.zip”, “song.m4a” sent as video/mp4 “.mp4”, “feed.xml” sent as text/html “.html”. The type now decides only for a name with no extension or with a server script's (“download.php”, “.aspx”, “.jsp”, “.do”…), and plain text adds nothing to “Makefile” or “LICENSE”.
- `extensionFromMime` knows the Office and OpenDocument types (docx, xlsx, pptx, xls, ppt, odt, ods, odp) and the aliases servers send (`application/x-zip-compressed`, `audio/mp3`, `image/jpg`, `audio/x-wav`, `image/vnd.microsoft.icon`, `application/vnd.rar`, `text/xml`…), and reads a type in any case, with or without parameters: a Word document with no extension got none.
- `sanitize` drops what can't be seen or turns the text round (bidirectional overrides and isolates, zero-width spaces, the soft hyphen, the byte-order mark), so “invoice‮fdp.exe” no longer displays as “invoiceexe.pdf”; the zero-width joiners Persian, Indic words and emoji are spelt with stay. `renameKeepingExtension` drops the isolates (U+2066–U+2069) and the Arabic letter mark too.
- `splitName` takes extensions up to 14 characters (“.unitypackage”, “.webmanifest”).
- `isMeaningless`: a long word in a script without Latin vowels (“Бухгалтерия”, “東京都知事選挙の結果について”, Greek, Arabic, Hebrew, Korean) was taken for a random token, so the file was renamed from the page.
- `fromLinkText`: a file type in the middle of the words is part of the name (“The CSV format explained” was “The”, “Zip codes list” nothing): the note about the file is in brackets or the last word. Only “download” comes off on its own; “open”, “view”, “get”, “save”, “export” and “print” also start names (“Open University prospectus”, “Export controls policy”) and come off only before an article, after “click here to” or before a colon.
- `fromTitle`, `withSite`, `pageName`: the site's name is matched as a word, so “After the crash | Financial Times” on ft.com keeps its headline and ea.com no longer drops “Create an account”.
- `fromQuery`: a switch is no file name (`?download=true` named the file “true.pdf”; `attachment=yes`, `file=inline`).
- `siteName` knows `.ne.jp`, `.or.jp`, `.go.kr`, `.gob.mx`, `.govt.nz` and the like.
- `cleanName`: only an image's name has a size mark, and a size has a side of three digits (“iphone-12x.jpg”, “covid-19x19.jpg”, “photo-16x9.jpg” and “mix_128x.mp3” keep their names); “copy” after a word that makes it part of the name stays (“Hard copy.pdf”, “Certified copy 2.pdf”); one plus between short words is a plus (“Q+A.pdf”, “AT+T_bill.pdf”).
- `sanitize`: a name is cut by characters, not UTF-16 units (an emoji was cut in two); the extension is kept as written (it was lowercased); an extension longer than the limit no longer makes the name longer than it was; a cut leaves no trailing space or dot and no reserved name; the `replacement` is taken as written (`'d'` collapsed every run of digits); COM¹–COM³, LPT¹–LPT³, CONIN$, CONOUT$, CLOCK$ and “CON .txt” are reserved too.
- `pageName`: a title with no space to cut at (Chinese, Japanese, one long word) is cut at the limit instead of dropped; a name Windows keeps for a device gets a “_” (“con.com” was the folder “Con”).
- `humanize` capitalises the first letter of each word in any script (“résumé” was “RéSumé”, “don't” “Don'T”).
- `formatSize`: 1,048,575 bytes are “1.0 MB”, not “1024.0 KB”; a size that is no number is `''` (was “NaN B”). `wholeUnits` is unchanged: it is the PHP's output, digit for digit.

### Changed

- `fromLinkText('View from the summit')` is now the whole phrase, and `decodeName('A+B')` stays “A+B”.

## [1.4.0] — 2026-11-11

### Added

- `pageName(page, options?)` and `MAX_PAGE_NAME_LENGTH`: a name for something made from a whole page (Better Saves' folder of a page's files, Better Screenshots' captures): the title without the site's own words, the site's name in front (else the site's name, else the host), what file systems refuse made readable, cut between words at 80 characters. Moved from Better Saves' `folderName` so Better Screenshots shares it.

## [1.3.0] — 2026-11-10

### Added

- Naming a file from the web, moved here from Better Downloads so Better Saves can share it: `ruleName(facts, options?)`, `finishName`, `cleanName`, `isMeaningless`, `isDeviceName`, `splitName`, `joinName`, `baseName`, `decodeName`, `stripTracking`, `stripCopyMarks`, `tidySpacing`, `siteName`, `fromLabel`, `fromLinkText`, `fromTitle`, `fromQuery`, `fromPath`, `withSite`, `hostOf`, `extensionFor`, `MAX_NAME_LENGTH`; types `DownloadFacts`, `RuleName`, `RuleNameOptions`, `NameParts`.
- `label` among the facts: what a page says a file is (alt text, a caption, a heading), used as it is ahead of the link's text (`fromLabel`), so “View from the summit” keeps its first word.
- `cleanName` drops image servers' size marks (`stripSizeMarks`: MediaWiki's “1280px-”, WordPress' “-1024x683”, Shopify's “_600x”, X's “_400x400”) and an image extension left inside a name (“photo.jpg.webp”).
- `ruleName(facts, { site: false })` leaves the site's name off a name from the page (for files going into a folder named after the site).
- `isMeaningless` reads a generic word beside an id as meaningless (an image CDN's `photo-1506744038136-46273834b3fb`, `image_8f3a9c2e41`); a generic word beside a date still says which (`Invoice 2026-11`). `isDeviceName` no longer takes an id beside “photo” for a camera's name.

## [1.2.0] — 2026-10-11

### Added

- `formatSize(bytes, { locale })` — a BCP 47 tag writes the number and unit with `Intl.NumberFormat` in that language: `formatSize(1536, { locale: 'de' })` → `'1,5 kB'`, `formatSize(104857600, { wholeUnits: true, locale: 'fr' })` → `'100 Mo'`. The scale (1024, or 1000 with `si`) and the decimals are those of the same options without it. Null and invalid input return what they did; an unknown locale gives the output without it.

## [1.1.0] — 2026-10-09

### Added

- `formatSize(bytes, options)` — an options object as the second argument: `decimals`, and `wholeUnits` (with `si`) for exactly the output of the PHP `SugarCommerce\Format\Bytes::format()`. A number still means decimals.
- `renameKeepingExtension(current, typed, max?)` — a rename that keeps the file's extension and refuses a name with no letter or digit.
- `getCategoryFromName(filename)` — the category from the extension, in step with the PHP `FileType` kinds.
- `inlineType(filename)` and `isPlayableAudio(filename)` — what every current browser shows or plays inline, by name.
- `getKindFromName(filename)` — the category, or `font` or `software` (plugins, installers, presets, project files) where the category says `other`; new type `FileKind`. `Category` and `getCategoryFromName()` are unchanged, so they stay in step with the PHP `FileType`.
- `getLabelFromName(filename)` — a kind people read: "WAV audio", "ZIP archive", "OTF font", "VST3 file".
- `getPreviewKind(filename)` — `image`, `audio`, `video` or `null`: the element to preview a file with, from `inlineType()`.

## [1.0.0]

- Size, name and type helpers in one package, replacing `file-size`, `safe-filename` and `mime-types`.
