/**
 * The naming rules, end to end (`ruleName`) over a table of real-world downloads: the name
 * the browser would use, where it came from, its type, and the page it was on. Then each rule
 * alone: splitting, decoding, tracking, copy marks, meaningless names, names from the page
 * and the address, extensions for types, and names safe on every file system.
 * (Moved here from Better Downloads, where the rules were written.)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanName, decodeName, stripCopyMarks, stripTracking, fromLinkText, fromPath, fromQuery, fromTitle, siteName, extensionFor,
  isDeviceName, isMeaningless, MAX_NAME_LENGTH, finishName, hostOf, ruleName, withSite, baseName, joinName, splitName,
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
    assert.equal(decodeName('A+B'), 'A B');
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
    ['html', 'image/png', 'png'],
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

describe('finished names are safe on macOS, Windows and Linux', () => {
  it('characters file systems refuse become readable stand-ins', () => {
    assert.equal(finishName('Q3: “final” report?', 'php', 'application/pdf'), 'Q3 - “final” report.pdf');
    assert.equal(finishName('a/b\\c', '', 'text/plain'), 'a-b-c.txt');
    assert.equal(finishName('<draft> *v2* | "x"', 'txt', 'text/plain'), 'draft v2 x.txt');
    assert.equal(finishName('tab\there\u0000', 'txt', 'text/plain'), 'tab here.txt');
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
    const facts = { filename: 'photo-1506744038136-46273834b3fb', mime: 'image/jpeg', referrer: 'https://unsplash.com/photos/x', linkText: 'A mountain lake at dawn' };
    assert.equal(ruleName(facts).name, 'Unsplash A mountain lake at dawn.jpg');
    assert.equal(ruleName(facts, { site: false }).name, 'A mountain lake at dawn.jpg');
    assert.equal(ruleName({ filename: 'a7f3e9c2b1d4.jpg', referrer: 'https://www.acme.com/team', pageTitle: 'Our team – Acme' }, { site: false }).name, 'Our team.jpg');
  });

  it('a name from the query is the server’s own, with or without the site', () => {
    assert.equal(ruleName({ filename: 'file', mime: 'image/png', url: 'https://x.example.com/get?filename=Q3%20chart.png' }, { site: false }).name, 'Q3 chart.png');
  });
});
