/**
 * The naming rules, end to end (`ruleName`) over a table of real-world downloads: the name
 * the browser would use, where it came from, its type, and the page it was on. Then each rule
 * alone: splitting, decoding, tracking, copy marks, meaningless names, names from the page
 * and the address, extensions for types, and names safe on every file system.
 * (Moved here from Better Downloads, where the rules were written.)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSize, isReservedName, namesSite, sanitize } from '../src/index.js';
import {
  cleanName, decodeName, stripCopyMarks, stripSizeMarks, stripTracking, fromLabel, fromLinkText, fromPath, fromQuery, fromTitle, siteName, extensionFor,
  isDeviceName, isMeaningless, MAX_NAME_LENGTH, MAX_PAGE_NAME_LENGTH, finishName, hostOf, pageName, ruleName, withSite, baseName, joinName, splitName,
} from '../src/index.js';

/** @typedef {import('../src/naming/index.js').DownloadFacts} DownloadFacts */

/**
 * Real downloads: [what Chrome would call it, the facts besides, the name wanted, whether the original said nothing].
 *
 * @type {[string, Omit<DownloadFacts, 'filename'>, string, boolean][]}
 */
const DOWNLOADS = [
  // Names that say what they are keep their words; only junk goes.
  ['IMG_2384.jpg', { mime: 'image/jpeg', url: 'https://photos.example.com/d/IMG_2384.jpg' }, 'IMG_2384.jpg', false],
  ['IMG_2384.JPG', { mime: 'image/jpeg' }, 'IMG_2384.JPG', false],
  ['PXL_20261110_094112345.jpg', { mime: 'image/jpeg' }, 'PXL_20261110_094112345.jpg', false],
  ['DSC00412.ARW', { mime: 'application/octet-stream' }, 'DSC00412.ARW', false],
  ['Screenshot 2026-11-10 at 09.41.12.png', { mime: 'image/png' }, 'Screenshot 2026-11-10 at 09.41.12.png', false],
  ['WhatsApp Image 2026-11-09 at 18.22.05.jpeg', { mime: 'image/jpeg' }, 'WhatsApp Image 2026-11-09 at 18.22.05.jpeg', false],
  ['Annual%20Report%202025.pdf', { mime: 'application/pdf' }, 'Annual Report 2025.pdf', false],
  ['Annual+Report+2025.pdf', { mime: 'application/pdf' }, 'Annual Report 2025.pdf', false],
  ['Annual%2520Report.pdf', { mime: 'application/pdf' }, 'Annual Report.pdf', false],
  ['Q3 report (1).pdf', { mime: 'application/pdf' }, 'Q3 report.pdf', false],
  ['Budget 2026 - Copy (2).xlsx', { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, 'Budget 2026.xlsx', false],
  ['Meeting notes copy.docx', { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, 'Meeting notes.docx', false],
  ['Brochure_utm_source=newsletter&utm_medium=email.pdf', { mime: 'application/pdf' }, 'Brochure.pdf', false],
  ['hero-banner.jpg_w=1200&fbclid=IwAR2x', { mime: 'image/jpeg' }, 'hero-banner.jpg', false],
  ['  spaced   out  name .txt', { mime: 'text/plain' }, 'spaced out name.txt', false],
  ['C++ Primer 5th Edition.pdf', { mime: 'application/pdf' }, 'C++ Primer 5th Edition.pdf', false],
  ['Version 2.0 release notes.md', { mime: 'text/markdown' }, 'Version 2.0 release notes.md', false],
  ['ubuntu-24.04.1-desktop-amd64.iso', { mime: 'application/x-iso9660-image' }, 'ubuntu-24.04.1-desktop-amd64.iso', false],
  ['node-v22.11.0.pkg', { mime: 'application/octet-stream' }, 'node-v22.11.0.pkg', false],
  ['backup-2026-11-10.tar.gz', { mime: 'application/gzip' }, 'backup-2026-11-10.tar.gz', false],
  ['Room (101) floor plan.pdf', { mime: 'application/pdf' }, 'Room (101) floor plan.pdf', false],
  ['INV2026110001.pdf', { mime: 'application/pdf' }, 'INV2026110001.pdf', false],
  ['Résumé – Zoë Müller.pdf', { mime: 'application/pdf' }, 'Résumé – Zoë Müller.pdf', false],
  ['会議資料 2026年11月.pdf', { mime: 'application/pdf' }, '会議資料 2026年11月.pdf', false],

  // The right extension for the type: missing or wrong ones fixed; vague types and programs left alone.
  ['report.php', { mime: 'application/pdf', url: 'https://example.com/report.php?id=7' }, 'report.pdf', true],
  ['chart', { mime: 'image/png' }, 'chart.png', false],
  ['holiday.jpeg', { mime: 'image/jpeg' }, 'holiday.jpeg', false],
  ['scores.csv', { mime: 'application/vnd.ms-excel' }, 'scores.csv', false],
  ['firmware.bin', { mime: 'application/octet-stream' }, 'firmware.bin', false],
  ['ChromeSetup.exe', { mime: 'text/html' }, 'ChromeSetup.exe', false],
  ['Contract.docx', { mime: 'application/zip' }, 'Contract.docx', false],
  ['podcast-episode-12.mp3', { mime: 'audio/mpeg' }, 'podcast-episode-12.mp3', false],
  ['track.wav', { mime: 'audio/x-wav' }, 'track.wav', false],

  // Meaningless names: named from the page and the address, the site's name in front.
  ['download (3).pdf', {
    mime: 'application/pdf', url: 'https://billing.acme.com/api/v2/files/88213', referrer: 'https://billing.acme.com/invoices',
    pageTitle: 'Invoice 2026-11 – Acme Billing',
  }, 'Acme Invoice 2026-11.pdf', true],
  ['download.pdf', {
    mime: 'application/pdf', url: 'https://www.examplebank.co.uk/statements/download?acct=1234', referrer: 'https://www.examplebank.co.uk/statements',
    pageTitle: 'Statements | Examplebank', linkText: 'Download March 2026 statement (PDF, 84 KB)',
  }, 'Examplebank March 2026 statement.pdf', true],
  ['3f2a9c1e-7b4d-4e8a-9c2b-1a2b3c4d5e6f.pdf', {
    mime: 'application/pdf', referrer: 'https://docs.example.org/reports', linkText: 'Download the 2025 annual report (PDF, 2.4 MB)',
  }, 'Example 2025 annual report.pdf', true],
  ['file', { mime: 'image/png', url: 'https://x.example.com/get?filename=Q3%20sales%20chart.png' }, 'Q3 sales chart.png', true],
  ['getfile.aspx', { mime: 'application/pdf', url: 'https://portal.example.net/getfile.aspx?name=Lease%20agreement.pdf&id=9' }, 'Lease agreement.pdf', true],
  ['download.php', { mime: 'application/pdf', url: 'https://billing.acme.com/billing/invoices/2026-11/download.php' }, 'Acme invoices 2026-11.pdf', true],
  ['1699999999123.csv', { mime: 'text/csv', url: 'https://app.example.com/reports/sales-by-region/export' }, 'Example sales by region.csv', true],
  ['export (2).csv', { mime: 'text/csv', referrer: 'https://analytics.example.io/dashboards/7', pageTitle: 'Weekly traffic · Example Analytics' }, 'Example Weekly traffic.csv', true],
  ['attachment', { mime: 'application/pdf', url: 'https://mail.example.com/attachment?id=8f3a', linkText: 'Boarding pass LHR–JFK' }, 'Example Boarding pass LHR–JFK.pdf', true],
  ['image.png', { mime: 'image/png', url: 'blob:https://draw.example.com/5c1d7e9a-2b3f-4a6c-8d9e-0f1a2b3c4d5e', referrer: 'https://draw.example.com/', pageTitle: 'Floor plan sketch - Example Draw' }, 'Example Floor plan sketch.png', true],

  // Meaningless, and nothing better known: tidied only.
  ['download (3).pdf', { mime: 'application/pdf', url: 'https://cdn.example.com/f/3f2a9c1e7b4d' }, 'download.pdf', true],
  ['aGVsbG8gd29ybGQgdGhpcw.pdf', { mime: 'application/pdf' }, 'aGVsbG8gd29ybGQgdGhpcw.pdf', true],
  ['20261110_101500.zip', { mime: 'application/zip' }, '20261110_101500.zip', true],
  ['untitled.txt', { mime: 'text/plain', referrer: 'https://example.com/', pageTitle: 'Example' }, 'untitled.txt', true],
];

describe('ruleName: real downloads', () => {
  for (const [filename, facts, wanted, meaningless] of DOWNLOADS) {
    it(`${filename} → ${wanted}`, () => {
      const result = ruleName({ filename, ...facts });
      assert.equal(result.name, wanted);
      assert.equal(result.meaningless, meaningless);
    });
  }

  it('Chrome’s full path is read as its file name', () => {
    assert.equal(ruleName({ filename: '/Users/me/Downloads/Q3 report (1).pdf', mime: 'application/pdf' }).name, 'Q3 report.pdf');
    assert.equal(ruleName({ filename: 'C:\\Users\\me\\Downloads\\Q3 report (1).pdf', mime: 'application/pdf' }).name, 'Q3 report.pdf');
  });

  it('the extension it reports is the one the name ends with', () => {
    assert.equal(ruleName({ filename: 'report.php', mime: 'application/pdf' }).ext, 'pdf');
    assert.equal(ruleName({ filename: 'IMG_1.JPG', mime: 'image/jpeg' }).ext, 'JPG');
  });
});

describe('split', () => {
  for (const [name, base, ext] of /** @type {const} */ ([
    ['Report.PDF', 'Report', 'PDF'],
    ['backup.tar.gz', 'backup', 'tar.gz'],
    ['archive.TAR.XZ', 'archive', 'TAR.XZ'],
    ['Version 2.0 final', 'Version 2.0 final', ''],
    ['Version 2.0', 'Version 2.0', ''],
    ['.bashrc', '.bashrc', ''],
    ['README', 'README', ''],
    ['photo.001', 'photo', '001'],
    ['data.12345678', 'data.12345678', ''],
    ['notes.final draft', 'notes.final draft', ''],
  ])) {
    it(`${name} → ${base} + ${ext}`, () => {
      assert.deepEqual(splitName(name), { base, ext });
      assert.equal(joinName(base, ext), name);
    });
  }

  it('baseName takes the last part of either kind of path', () => {
    assert.equal(baseName('/a/b/c.pdf'), 'c.pdf');
    assert.equal(baseName('C:\\a\\c.pdf'), 'c.pdf');
    assert.equal(baseName('c.pdf'), 'c.pdf');
  });
});

describe('clean', () => {
  it('decoding: %20, double encoding, + between words; broken encoding and real pluses stay', () => {
    assert.equal(decodeName('Q3%20report'), 'Q3 report');
    assert.equal(decodeName('Q3%2520report'), 'Q3 report');
    assert.equal(decodeName('Q3+report+final'), 'Q3 report final');
    assert.equal(decodeName('C++ Primer'), 'C++ Primer');
    assert.equal(decodeName('Annual+Report'), 'Annual Report');
    // One plus between short words is a plus.
    for (const name of ['A+B', 'Q+A', 'AT+T_bill', 'R+D']) assert.equal(decodeName(name), name);
    assert.equal(decodeName('100%'), '100%');
    assert.equal(decodeName('50%off%zz'), '50%off%zz');
    assert.equal(decodeName('caf%C3%A9'), 'café');
  });

  it('tracking: utm_*, click ids and a query after an extension go; other words stay', () => {
    assert.equal(stripTracking('Brochure_utm_source=news&utm_campaign=fall.pdf'), 'Brochure.pdf');
    assert.equal(stripTracking('photo.jpg?w=1200&fbclid=abc'), 'photo.jpg');
    assert.equal(stripTracking('photo.jpg_gclid=abc'), 'photo.jpg');
    assert.equal(stripTracking('guide_mc_cid=12ab.pdf'), 'guide.pdf');
    assert.equal(stripTracking('user_guide.pdf'), 'user_guide.pdf');
    assert.equal(stripTracking('E=mc2 notes.pdf'), 'E=mc2 notes.pdf');
  });

  it('copy marks: Chrome’s (1), Windows’ - Copy, macOS’s copy, together', () => {
    assert.equal(stripCopyMarks('download (3)'), 'download');
    assert.equal(stripCopyMarks('download (3) (1)'), 'download');
    assert.equal(stripCopyMarks('Budget - Copy'), 'Budget');
    assert.equal(stripCopyMarks('Budget - Copy (2)'), 'Budget');
    assert.equal(stripCopyMarks('Notes copy 2'), 'Notes');
    assert.equal(stripCopyMarks('Room (101)'), 'Room (101)');
    assert.equal(stripCopyMarks('(1)'), '(1)');
    assert.equal(stripCopyMarks('Copy'), 'Copy');
    assert.equal(stripCopyMarks('Photocopy'), 'Photocopy');
    // “copy” after a word that makes it part of the name.
    for (const name of ['Hard copy', 'Carbon Copy', 'Certified copy 2', 'Passport - signed copy', 'final_copy', 'My copy']) assert.equal(stripCopyMarks(name), name);
    assert.equal(stripCopyMarks('Hard copy (1)'), 'Hard copy');
    assert.equal(stripCopyMarks('Hard copy copy'), 'Hard copy');
  });

  it('a name that tidies to nothing stays as it was', () => {
    assert.equal(cleanName('___.pdf'), '___.pdf');
  });
});

describe('meaningless names', () => {
  for (const name of [
    'download', 'Download', 'download_2', 'file', 'file-12', 'document', 'attachment', 'untitled', 'unnamed', 'export',
    'image', 'img', 'blob', 'view', 'getfile', 'index', 'invoice', 'report', 'statement', 'file download',
    '1699999999123', '20261110_101500', '2026-11-10', '3f2a9c1e-7b4d-4e8a-9c2b-1a2b3c4d5e6f', 'd41d8cd98f00b204e9800998ecf8427e',
    'aGVsbG8gd29ybGQgdGhpcw', 'xkcdqzrtplmnb', 'a1', '', ' ',
  ]) {
    it(`“${name}” says nothing`, () => {
      assert.equal(isMeaningless(name), true);
    });
  }

  for (const name of [
    'IMG_2384', 'DSC00412', 'PXL_20261110_094112345', 'Screenshot 2026-11-10 at 09.41.12', 'GOPR0042', 'Scan 2026-11-02',
    'Acme invoice 2026-11', 'Q3 report', 'report2025q3', 'INV2026110001', 'Bibliography', 'Schwarzschild radius',
    'Résumé', '会議資料', 'tax return 2025', 'ubuntu-24.04.1-desktop-amd64',
  ]) {
    it(`“${name}” says something`, () => {
      assert.equal(isMeaningless(name), false);
    });
  }

  it('a device’s name needs its number: “Photo” alone is generic', () => {
    assert.equal(isDeviceName('IMG_2384'), true);
    assert.equal(isDeviceName('Photo'), false);
    assert.equal(isMeaningless('Photo'), true);
  });
});

describe('names from the page and the address', () => {
  it('link text: the verb and the note about the file come off', () => {
    assert.equal(fromLinkText('Download the 2025 annual report (PDF, 2.4 MB)'), '2025 annual report');
    assert.equal(fromLinkText('Click here to download your invoice for March 2026'), 'invoice for March 2026');
    assert.equal(fromLinkText('Get the brochure [PDF]'), 'brochure');
    assert.equal(fromLinkText('Lease agreement (312 KB)'), 'Lease agreement');
    assert.equal(fromLinkText('Download'), null);
    assert.equal(fromLinkText('Download PDF'), null);
    assert.equal(fromLinkText('Click here'), null);
    assert.equal(fromLinkText(''), null);
    assert.equal(fromLinkText(undefined), null);
  });

  it('page title: the site’s own name comes off, whichever side', () => {
    assert.equal(fromTitle('Invoice 2026-11 – Acme Billing', 'billing.acme.com'), 'Invoice 2026-11');
    assert.equal(fromTitle('Acme | Invoice 2026-11', 'acme.com'), 'Invoice 2026-11');
    assert.equal(fromTitle('Weekly traffic · Example Analytics', 'analytics.example.io'), 'Weekly traffic');
    assert.equal(fromTitle('Release notes - Version 3 - Docs', 'docs.example.com'), 'Release notes – Version 3 – Docs');
    assert.equal(fromTitle('Acme', 'acme.com'), null);
    assert.equal(fromTitle('Download', 'example.com'), null);
    assert.equal(fromTitle(undefined, 'example.com'), null);
  });

  it('a file name in the query is the server’s own', () => {
    assert.equal(fromQuery('https://x.example/get?filename=Q3%20report.pdf'), 'Q3 report');
    assert.equal(fromQuery('https://x.example/get?file=docs/Lease%20agreement.pdf'), 'Lease agreement');
    assert.equal(fromQuery('https://x.example/get?name=download.pdf'), null);
    assert.equal(fromQuery('https://x.example/get?file=https://cdn.example/a.pdf'), null);
    assert.equal(fromQuery('https://x.example/get?id=42'), null);
    assert.equal(fromQuery('not a url'), null);
    assert.equal(fromQuery('data:text/plain,hi'), null);
  });

  it('the path: its last words that aren’t plumbing, a date with the words before it', () => {
    assert.equal(fromPath('https://acme.example/billing/invoices/2026-11/download'), 'invoices 2026-11');
    assert.equal(fromPath('https://app.example.com/reports/sales-by-region/export'), 'sales by region');
    assert.equal(fromPath('https://example.com/wp-content/uploads/2026/11/Spring_Menu.pdf'), 'Spring Menu');
    assert.equal(fromPath('https://cdn.example.com/f/3f2a9c1e7b4d'), null);
    assert.equal(fromPath('https://example.com/api/v1/files/123/download'), null);
    assert.equal(fromPath('https://example.com/'), null);
  });

  it('a site’s name from its host, two-part suffixes known', () => {
    assert.equal(siteName('billing.acme.com'), 'Acme');
    assert.equal(siteName('www.examplebank.co.uk'), 'Examplebank');
    assert.equal(siteName('localhost'), '');
    assert.equal(siteName('127.0.0.1'), '');
    assert.equal(withSite('Invoice', 'acme.com'), 'Acme Invoice');
    assert.equal(withSite('Acme invoice', 'acme.com'), 'Acme invoice');
    assert.equal(withSite('Invoice', '127.0.0.1:8080'), 'Invoice');
    assert.equal(withSite(null, 'acme.com'), null);
  });

  it('a blob address belongs to its site', () => {
    assert.equal(hostOf('blob:https://draw.example.com/5c1d'), 'draw.example.com');
    assert.equal(hostOf('https://a.example.com:8443/x'), 'a.example.com:8443');
    assert.equal(hostOf(''), '');
    assert.equal(hostOf(undefined), '');
  });
});

describe('extensions for types', () => {
  for (const [ext, mime, wanted] of /** @type {const} */ ([
    ['php', 'application/pdf', 'pdf'],
    ['', 'image/png', 'png'],
    ['', 'application/pdf; charset=binary', 'pdf'],
    ['JPEG', 'image/jpeg', 'JPEG'],
    ['jpg', 'image/jpeg', 'jpg'],
    ['webp', 'image/png', 'webp'],
    ['aspx', 'image/png', 'png'],
    ['do', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    ['', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
    ['', 'application/vnd.ms-excel', 'xls'],
    ['', 'application/x-zip-compressed', 'zip'],
    ['', 'audio/mp3', 'mp3'],
    ['', 'image/jpg', 'jpg'],
    ['', 'Image/PNG', 'png'],
    ['', 'audio/x-wav', 'wav'],
    ['', 'text/plain', ''],
    ['php', 'text/plain', 'txt'],
    ['', 'text/javascript', ''],
    ['tar.gz', 'application/gzip', 'tar.gz'],
    ['tgz', 'application/x-gzip', 'tgz'],
    ['docx', 'application/zip', 'docx'],
    ['csv', 'text/plain', 'csv'],
    ['bin', 'application/octet-stream', 'bin'],
    ['', 'application/octet-stream', ''],
    ['exe', 'text/html', 'exe'],
    ['dmg', 'application/x-apple-diskimage', 'dmg'],
    ['txt', 'application/javascript', 'txt'],
    ['', 'application/javascript', ''],
    ['', 'application/x-made-up', ''],
    ['m4a', 'audio/mp4', 'm4a'],
  ])) {
    it(`.${ext} sent as ${mime} → .${wanted}`, () => {
      assert.equal(extensionFor(ext, mime), wanted);
    });
  }
});

describe('a real extension is the file’s own, whatever type the site sends', () => {
  for (const [filename, mime] of /** @type {const} */ ([
    // Plain text is what servers call anything they have no type for.
    ['backup.sql', 'text/plain'], ['key.pem', 'text/plain'], ['id_rsa.pub', 'text/plain'], ['logo.svg', 'text/plain'],
    ['analysis.ipynb', 'text/plain'], ['main.c', 'text/plain'], ['app.ts', 'text/plain'], ['style.css', 'text/plain'],
    ['nginx.conf', 'text/plain'], ['cal.ics', 'text/plain'], ['contact.vcf', 'text/plain'], ['index.html', 'text/plain'],
    ['Makefile', 'text/plain'], ['LICENSE', 'text/plain'], ['README', 'text/plain; charset=utf-8'],
    // Containers: the file is a zip, a gzip, JSON or XML inside, and something else by name.
    ['deck.key', 'application/zip'], ['map.kmz', 'application/zip'], ['macro.docm', 'application/zip'],
    ['report.pages', 'application/zip'], ['plugin.vsix', 'application/zip'], ['model.3mf', 'application/zip'],
    ['assets.unitypackage', 'application/gzip'], ['session.har', 'application/json'], ['rows.jsonl', 'application/json'],
    ['state.tfstate', 'application/json'], ['track.gpx', 'application/xml'], ['feed.xml', 'text/html'],
    // The same container under another name, and a page that isn't the file.
    ['song.m4a', 'video/mp4'], ['clip.mov', 'video/mp4'], ['art.ai', 'application/pdf'], ['photo.jpg', 'text/html'],
    ['page.html', 'image/png'], ['notes.md', 'text/html'],
  ])) {
    it(`${filename} sent as ${mime} keeps its name`, () => {
      assert.equal(ruleName({ filename, mime }).name, filename);
    });
  }
});

describe('finished names are safe on macOS, Windows and Linux', () => {
  it('characters file systems refuse become readable stand-ins', () => {
    assert.equal(finishName('Q3: “final” report?', 'php', 'application/pdf'), 'Q3 - “final” report.pdf');
    assert.equal(finishName('a/b\\c', '', 'text/html'), 'a-b-c.html');
    assert.equal(finishName('<draft> *v2* | "x"', 'txt', 'text/plain'), 'draft v2 x.txt');
    assert.equal(finishName('tab\there\u0000', 'txt', 'text/plain'), 'tab here.txt');
  });

  it('what can’t be seen or turns the text round is dropped', () => {
    assert.equal(finishName('invoice\u202Efdp', 'exe', ''), 'invoicefdp.exe');
    assert.equal(finishName('a\u200Bb\u2066c\u2069\uFEFF', 'pdf', 'application/pdf'), 'abc.pdf');
    assert.equal(sanitize('invoice\u202Efdp.exe'), 'invoicefdp.exe');
    assert.equal(sanitize('con\u200B.txt'), '_con.txt');
    assert.equal(sanitize('\u202E\u200F'), 'file');
    // Joiners spell words and emoji: they stay.
    assert.equal(sanitize('می\u200Cخواهم.pdf'), 'می\u200Cخواهم.pdf');
    assert.equal(sanitize('\u{1F468}\u200D\u{1F469}\u200D\u{1F467}.png'), '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}.png');
  });

  it('Windows’ reserved names and trailing dots are avoided', () => {
    assert.equal(finishName('CON', 'txt', 'text/plain'), '_CON.txt');
    assert.equal(finishName('aux', '', 'application/octet-stream'), '_aux');
    assert.equal(finishName('notes...', 'txt', 'text/plain'), 'notes.txt');
  });

  it(`long names are cut to ${MAX_NAME_LENGTH} characters, the extension kept`, () => {
    const name = finishName('word '.repeat(60), 'pdf', 'application/pdf');
    assert.ok(name.length <= MAX_NAME_LENGTH);
    assert.equal(name.endsWith('.pdf'), true);
  });

  it('nothing left is “download”, with the extension', () => {
    assert.equal(finishName('???', 'pdf', 'application/pdf'), 'download.pdf');
  });
});

describe('names from image hosts and pages (1.3.0)', () => {
  it('a generic word beside an id says nothing; beside a date it says which', () => {
    assert.equal(isMeaningless('photo-1506744038136-46273834b3fb'), true);
    assert.equal(isMeaningless('image_8f3a9c2e41'), true);
    assert.equal(isMeaningless('Invoice 2026-11'), false);
    assert.equal(isMeaningless('Q3 report'), false);
  });

  it('an id beside “photo” is a server’s, not a camera’s', () => {
    assert.equal(isDeviceName('photo-1506744038136-46273834b3fb'), false);
    assert.equal(isDeviceName('Photo 2026-11-10 09 41 12'), true);
  });

  it('a meaningless image is named from its alt text, the site in front unless asked not to', () => {
    const facts = { filename: 'photo-1506744038136-46273834b3fb', mime: 'image/jpeg', referrer: 'https://unsplash.com/photos/x', label: 'A mountain lake at dawn' };
    assert.equal(ruleName(facts).name, 'Unsplash A mountain lake at dawn.jpg');
    assert.equal(ruleName(facts, { site: false }).name, 'A mountain lake at dawn.jpg');
    assert.equal(ruleName({ filename: 'a7f3e9c2b1d4.jpg', referrer: 'https://www.acme.com/team', pageTitle: 'Our team – Acme' }, { site: false }).name, 'Our team.jpg');
  });

  it('a name from the query is the server’s own, with or without the site', () => {
    assert.equal(ruleName({ filename: 'file', mime: 'image/png', url: 'https://x.example.com/get?filename=Q3%20chart.png' }, { site: false }).name, 'Q3 chart.png');
  });
});

describe('what a page says a file is (1.3.0)', () => {
  it('a label is used as it is, ahead of the link’s text; a link’s verb comes off, a label’s doesn’t', () => {
    assert.equal(fromLabel('View from the summit'), 'View from the summit');
    assert.equal(fromLinkText('View the summit photo'), 'summit photo');
    assert.equal(fromLabel('image'), null);
    assert.equal(fromLabel(undefined), null);
    assert.equal(ruleName({ filename: '8f3a9c2e41b7.jpg', label: 'View from the summit', linkText: 'Download' }, { site: false }).name, 'View from the summit.jpg');
    assert.equal(ruleName({ filename: '8f3a9c2e41b7.jpg', label: 'img', linkText: 'Get the summit photo' }, { site: false }).name, 'summit photo.jpg');
  });
});

describe('size marks and inner extensions (1.3.0)', () => {
  it('image servers’ size marks go when letters are left; a name of only a size stays', () => {
    assert.equal(stripSizeMarks('1280px-Derwent_Water'), 'Derwent_Water');
    assert.equal(stripSizeMarks('lake-1024x683'), 'lake');
    assert.equal(stripSizeMarks('hero_600x'), 'hero');
    assert.equal(stripSizeMarks('0ZxKlEKB_400x400'), '0ZxKlEKB');
    assert.equal(stripSizeMarks('1920x1080'), '1920x1080');
    assert.equal(stripSizeMarks('Room 4x4'), 'Room 4x4');
    assert.equal(stripSizeMarks('300px-'), '300px-');
    assert.equal(stripSizeMarks('2026_1024x683'), '2026_1024x683');
  });

  it('a UUID says nothing, whatever letters its hex spells', () => {
    assert.equal(isMeaningless('64547710-dd08-11f1-97df-bd0937690c4d'), true);
    assert.equal(isMeaningless('64547710dd0811f197dfbd0937690c4d'), true);
  });

  it('cleanName: a smaller copy’s name is the original’s; an image extension left inside goes', () => {
    assert.equal(cleanName('960px-Mona_Lisa,_by_Leonardo.jpg'), 'Mona_Lisa,_by_Leonardo.jpg');
    assert.equal(cleanName('Spring-Menu-300x200.png'), 'Spring-Menu.png');
    assert.equal(cleanName('64547710-dd08-11f1-97df-bd0937690c4d.jpg.webp'), '64547710-dd08-11f1-97df-bd0937690c4d.webp');
    assert.equal(cleanName('report.pdf.zip'), 'report.pdf.zip');
    assert.equal(ruleName({ filename: '64547710-dd08-11f1-97df-bd0937690c4d.jpg.webp', label: 'Floods in the north' }, { site: false }).name, 'Floods in the north.webp');
  });
});

describe('names from real pages and links (1.5.0)', () => {
  it('a file type in the middle of a link’s words is part of the name', () => {
    /** @type {[string, string | null][]} */
    const cases = [
      ['The CSV format explained', 'The CSV format explained'],
      ['How to read a CSV file in Python', 'How to read a CSV file in Python'],
      ['Our PDF guide to pensions', 'Our PDF guide to pensions'],
      ['Doc Martin episode guide', 'Doc Martin episode guide'],
      ['Zip codes list', 'Zip codes list'],
      ['PNG vs JPG comparison chart', 'PNG vs JPG comparison chart'],
      ['Annual Report (PDF, 2.4 MB)', 'Annual Report'],
      ['Summer mix mp3', 'Summer mix'],
      ['Price list PDF 312 KB', 'Price list'],
      ['Price list - PDF', 'Price list'],
      ['Slides [PPTX]', 'Slides'],
      ['Lease agreement (312 KB)', 'Lease agreement'],
      ['MP3', null],
    ];
    for (const [text, want] of cases) assert.equal(fromLinkText(text), want, text);
  });

  it('a verb that starts a name stays; a link’s verb goes', () => {
    /** @type {[string, string | null][]} */
    const cases = [
      ['Open University prospectus', 'Open University prospectus'],
      ['Export controls policy', 'Export controls policy'],
      ['Get Out (2017)', 'Get Out (2017)'],
      ['Print Shop Pro manual', 'Print Shop Pro manual'],
      ['View from the summit', 'View from the summit'],
      ['Download the Open Source Guide', 'Open Source Guide'],
      ['Download Open Source Guide', 'Open Source Guide'],
      ['View the seating plan', 'seating plan'],
      ['Open: seating plan', 'seating plan'],
      ['Click here to view seating plan', 'seating plan'],
      ['Get your boarding pass', 'boarding pass'],
    ];
    for (const [text, want] of cases) assert.equal(fromLinkText(text), want, text);
  });

  it('a site’s name is a word of the title, not letters inside one', () => {
    assert.equal(fromTitle('After the crash: what’s left | Financial Times', 'www.ft.com'), 'After the crash: what’s left – Financial Times');
    assert.equal(pageName({ url: 'https://www.ea.com/x', title: 'Create an account – Electronic Arts' }), 'Ea Create an account – Electronic Arts');
    assert.equal(fromTitle('Shipping label – HP Support', 'support.hp.com'), 'Shipping label');
    assert.equal(withSite('Tax explained', 'x.com'), 'X Tax explained');
    assert.equal(withSite('Acme invoice', 'acme.com'), 'Acme invoice');
    assert.equal(namesSite('C++ primer', 'c++'), true);
    assert.equal(siteName('www.example.ne.jp'), 'Example');
    assert.equal(siteName('shop.example.go.kr'), 'Example');
  });

  it('a switch in the query is no file name', () => {
    for (const query of ['download=true', 'download=1', 'attachment=yes', 'file=inline', 'name=false']) {
      assert.equal(fromQuery(`https://x.example/a?${query}`), null, query);
    }
    assert.equal(ruleName({ filename: 'download.pdf', mime: 'application/pdf', url: 'https://x.example/a?download=true' }).name, 'download.pdf');
    assert.equal(fromQuery('https://x.example/a?download=Q3%20report.pdf'), 'Q3 report');
  });

  it('only an image’s name has a size in it, and a size has a side of three digits', () => {
    /** @type {[string, string][]} */
    const cases = [
      ['iphone-12x.jpg', 'iphone-12x.jpg'], ['covid-19x19.jpg', 'covid-19x19.jpg'], ['photo-16x9.jpg', 'photo-16x9.jpg'],
      ['iphone_15x.jpg', 'iphone_15x.jpg'], ['mix_128x.mp3', 'mix_128x.mp3'], ['plan-300x250.pdf', 'plan-300x250.pdf'],
      ['banner-300x250.png', 'banner.png'], ['lake-1024x683.jpg', 'lake.jpg'], ['hero_600x.webp', 'hero.webp'],
      ['avatar_400x400.jpg', 'avatar.jpg'], ['thumb-150x150.jpg', 'thumb.jpg'], ['wide-1920x80.png', 'wide.png'],
    ];
    for (const [name, want] of cases) assert.equal(cleanName(name), want, name);
  });

  it('“copy” that is part of the name stays in a whole name', () => {
    assert.equal(cleanName('Hard copy.pdf'), 'Hard copy.pdf');
    assert.equal(cleanName('Report copy 2.pdf'), 'Report.pdf');
  });
});

describe('names in other scripts say something (1.5.0)', () => {
  it('a long word without Latin vowels is a word, not a token', () => {
    for (const name of ['Бухгалтерия', 'Квартальный отчёт 2026', 'Απολογισμός', 'تقرير_المبيعات_السنوي', 'דוחכספישנתי2026', '東京都知事選挙の結果について', '분기별매출보고서최종본', 'Größenänderung', 'Rhythms']) {
      assert.equal(isMeaningless(name), false, name);
    }
    for (const name of ['xkcdqrstvwz', 'bcdfghjklmnp', 'a7f3e9c2b1d4', 'aGVsbG8gd29ybGQ']) assert.equal(isMeaningless(name), true, name);
    assert.equal(ruleName({ filename: 'Бухгалтерия.pdf', pageTitle: 'Other', referrer: 'https://example.com/' }).name, 'Бухгалтерия.pdf');
  });
});

describe('names fit every file system (1.5.0)', () => {
  it('a cut keeps characters whole and the extension as written', () => {
    const emoji = sanitize(`${'😀'.repeat(10)}.png`, { maxLength: 9 });
    assert.equal(emoji, '😀😀.png');
    assert.equal(sanitize(`${'x'.repeat(300)}.PDF`).slice(-5), 'x.PDF');
    assert.equal(sanitize(`${'x'.repeat(300)}.PDF`).length, 255);
    assert.equal(finishName(`a${'😀'.repeat(150)}`, 'pdf', 'application/pdf').isWellFormed(), true);
  });

  it('an extension too long to keep is cut with the rest: a name never grows', () => {
    assert.equal(sanitize('abcdefgh.verylongext', { maxLength: 5 }), 'abcde');
    assert.equal(sanitize(`a.${'b'.repeat(300)}`).length, 255);
  });

  it('a cut leaves no space or dot at the end, and no reserved name', () => {
    assert.equal(sanitize('abc def ghi.txt', { maxLength: 8 }), 'abc.txt');
    assert.equal(sanitize(`${'a'.repeat(254)} b`), 'a'.repeat(254));
    assert.equal(sanitize(`CON${'x'.repeat(10)}.txt`, { maxLength: 7 }), '_CO.txt');
  });

  it('names are counted in bytes too: 255 on Linux and APFS', () => {
    const bytes = (/** @type {string} */ text) => new TextEncoder().encode(text).length;
    const kanji = finishName('漢'.repeat(150), 'pdf', 'application/pdf');
    assert.ok(bytes(kanji) <= 240, String(bytes(kanji)));
    assert.ok(kanji.endsWith('漢.pdf'));
    assert.equal(sanitize(`${'漢'.repeat(200)}.pdf`, { maxBytes: 255 }), `${'漢'.repeat(83)}.pdf`);
    assert.equal(sanitize(`${'漢'.repeat(200)}.pdf`).length, 204);
    const title = '東京都知事選挙の結果について専門家が解説する最新ニュースまとめ速報と今後の見通しについての詳細な分析記事を掲載しています今日のトップニュース一覧と解説まとめ';
    const page = pageName({ url: 'https://news.example.jp/a', title });
    assert.ok(page.startsWith('Example 東京都知事選挙'), page);
    assert.ok(bytes(page) <= 240 && page.length <= MAX_PAGE_NAME_LENGTH);
    const word = 'Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen-Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz';
    assert.equal(pageName({ url: 'https://example.com/', title: word }), `Example ${word.slice(0, 72)}`);
  });

  it('every name Windows keeps for a device is avoided, in a file and in a page’s folder', () => {
    for (const name of ['CON', 'con.txt', 'COM¹.txt', 'LPT³', 'CONIN$', 'CONOUT$.log', 'CLOCK$', 'CON .txt', 'nul.tar.gz']) {
      assert.equal(sanitize(name), `_${name}`, name);
      assert.equal(isReservedName(name), true, name);
    }
    for (const name of ['Console.txt', 'COM10.txt', 'CONtract.pdf', 'aux-in.wav']) assert.equal(sanitize(name), name, name);
    assert.equal(pageName({ url: 'https://con.com/', title: '' }), '_Con');
    assert.equal(pageName({ url: 'https://www.nul.co.uk/', title: '' }), '_Nul');
    assert.equal(pageName({ url: 'http://localhost/', title: 'AUX' }), '_AUX');
    assert.equal(pageName({ url: 'https://aux.io/', title: 'Home' }), 'Aux Home');
  });

  it('the replacement is taken as it is written, not as a pattern', () => {
    assert.equal(sanitize('track 2024?.mp3', { replacement: 'd' }), 'track 2024d.mp3');
    assert.equal(sanitize('a??b::c', { replacement: '-' }), 'a-b-c');
    assert.equal(sanitize('a??b', { replacement: '.' }), 'a.b');
    assert.equal(sanitize('a??b', { replacement: '' }), 'ab');
  });

  it('a size that rounds up to the next unit is written in it; a size that is no number is nothing', () => {
    assert.equal(formatSize(1048575), '1.0 MB');
    assert.equal(formatSize(1024 * 1023.96), '1.0 MB');
    assert.equal(formatSize(1048575, { locale: 'de' }), '1,0 MB');
    assert.equal(formatSize(1024 * 1023.9), '1023.9 KB');
    assert.equal(formatSize(NaN), '');
    assert.equal(formatSize(Infinity), '');
  });
});

describe('pageName', () => {
  /** @type {[{url: string, title?: string}, string][]} */
  const PAGES = [
    [{ url: 'https://www.example.com/lakes', title: 'Lake District trips – Example' }, 'Example Lake District trips'],
    [{ url: 'https://github.com/arraypress', title: 'GitHub' }, 'GitHub'],
    [{ url: 'https://en.wikipedia.org/wiki/Bangkok', title: 'Bangkok - Wikipedia' }, 'Wikipedia Bangkok'],
    [{ url: 'https://shop.example.co.uk/a', title: 'Basket: 2 items | Example' }, 'Example Basket - 2 items'],
    [{ url: 'http://127.0.0.1:8080/x', title: '' }, '127.0.0.1'],
    [{ url: 'https://docs.example.com/a/b', title: 'Read a/b or c\\d' }, 'Example Read a-b or c-d'],
  ];
  for (const [page, want] of PAGES) {
    it(`${page.title || page.url} → ${want}`, () => assert.equal(pageName(page), want));
  }

  it('falls back when nothing says anything', () => {
    assert.equal(pageName({ url: 'about:blank', title: '' }), 'Page');
    assert.equal(pageName({ url: 'not an address' }, { fallback: 'Screenshot' }), 'Screenshot');
  });

  it('cuts a long name between words, at most maxLength', () => {
    const name = pageName({ url: 'https://example.com/', title: `${'Weekly report on the lakes '.repeat(8)}– Example` });
    assert.ok(name.length <= MAX_PAGE_NAME_LENGTH, name);
    assert.match(name, /^Example Weekly report on the lakes .*\S$/);
    assert.ok(`${'Weekly report on the lakes '.repeat(8)}`.includes(`${name.slice('Example '.length)} `), `cut between words: ${name}`);
    assert.equal(pageName({ url: 'https://example.com/', title: 'One two three four' }, { maxLength: 14 }), 'Example One');
    assert.equal(pageName({ url: 'https://example.com/', title: 'One two three four' }, { maxLength: 15 }), 'Example One two');
  });
});
