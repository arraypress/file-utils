# Changelog

All notable changes to `@arraypress/file-utils` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — Unreleased

### Added

- `formatSize(bytes, options)` — an options object as the second argument: `decimals`, and `wholeUnits` (with `si`) for exactly the output of the PHP `SugarCommerce\Format\Bytes::format()`. A number still means decimals.
- `renameKeepingExtension(current, typed, max?)` — a rename that keeps the file's extension and refuses a name with no letter or digit.
- `getCategoryFromName(filename)` — the category from the extension, in step with the PHP `FileType` kinds.
- `inlineType(filename)` and `isPlayableAudio(filename)` — what every current browser shows or plays inline, by name.

## [1.0.0]

- Size, name and type helpers in one package, replacing `file-size`, `safe-filename` and `mime-types`.
