# Changelog

All notable changes to `@arraypress/file-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] — Unreleased

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
