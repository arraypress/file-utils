import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isImage, isAudio, isVideo, isDocument, isArchive, getCategory, getLabel, extensionFromMime, isPreviewable } from '../src/index.js';

describe('isImage', () => {
  it('image/png', () => assert.equal(isImage('image/png'), true));
  it('image/jpeg', () => assert.equal(isImage('image/jpeg'), true));
  it('image/svg+xml', () => assert.equal(isImage('image/svg+xml'), true));
  it('image/webp', () => assert.equal(isImage('image/webp'), true));
  it('text/plain', () => assert.equal(isImage('text/plain'), false));
  it('null', () => assert.equal(isImage(null), false));
  it('empty', () => assert.equal(isImage(''), false));
});

describe('isAudio', () => {
  it('audio/mpeg', () => assert.equal(isAudio('audio/mpeg'), true));
  it('audio/wav', () => assert.equal(isAudio('audio/wav'), true));
  it('image/png', () => assert.equal(isAudio('image/png'), false));
  it('null', () => assert.equal(isAudio(null), false));
});

describe('isVideo', () => {
  it('video/mp4', () => assert.equal(isVideo('video/mp4'), true));
  it('video/webm', () => assert.equal(isVideo('video/webm'), true));
  it('audio/mpeg', () => assert.equal(isVideo('audio/mpeg'), false));
  it('null', () => assert.equal(isVideo(null), false));
});

describe('isDocument', () => {
  it('application/pdf', () => assert.equal(isDocument('application/pdf'), true));
  it('application/msword', () => assert.equal(isDocument('application/msword'), true));
  it('text/plain', () => assert.equal(isDocument('text/plain'), true));
  it('text/csv', () => assert.equal(isDocument('text/csv'), true));
  it('docx', () => assert.equal(isDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), true));
  it('xlsx', () => assert.equal(isDocument('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), true));
  it('xls', () => assert.equal(isDocument('application/vnd.ms-excel'), true));
  it('odt', () => assert.equal(isDocument('application/vnd.oasis.opendocument.text'), true));
  it('image/png', () => assert.equal(isDocument('image/png'), false));
  it('null', () => assert.equal(isDocument(null), false));
});

describe('isArchive', () => {
  it('application/zip', () => assert.equal(isArchive('application/zip'), true));
  it('application/x-rar', () => assert.equal(isArchive('application/x-rar'), true));
  it('application/x-rar-compressed', () => assert.equal(isArchive('application/x-rar-compressed'), true));
  it('application/x-7z-compressed', () => assert.equal(isArchive('application/x-7z-compressed'), true));
  it('application/gzip', () => assert.equal(isArchive('application/gzip'), true));
  it('application/x-tar', () => assert.equal(isArchive('application/x-tar'), true));
  it('application/pdf', () => assert.equal(isArchive('application/pdf'), false));
  it('null', () => assert.equal(isArchive(null), false));
});

describe('getCategory', () => {
  it('image', () => assert.equal(getCategory('image/png'), 'image'));
  it('audio', () => assert.equal(getCategory('audio/mpeg'), 'audio'));
  it('video', () => assert.equal(getCategory('video/mp4'), 'video'));
  it('document', () => assert.equal(getCategory('application/pdf'), 'document'));
  it('archive', () => assert.equal(getCategory('application/zip'), 'archive'));
  it('other', () => assert.equal(getCategory('application/json'), 'other'));
});

describe('getLabel', () => {
  it('Image', () => assert.equal(getLabel('image/png'), 'Image'));
  it('Audio', () => assert.equal(getLabel('audio/mpeg'), 'Audio'));
  it('Video', () => assert.equal(getLabel('video/mp4'), 'Video'));
  it('Document', () => assert.equal(getLabel('application/pdf'), 'Document'));
  it('Archive', () => assert.equal(getLabel('application/zip'), 'Archive'));
  it('other → subtype', () => assert.equal(getLabel('application/json'), 'JSON'));
  it('null → Unknown', () => assert.equal(getLabel(null), 'Unknown'));
  it('empty → Unknown', () => assert.equal(getLabel(''), 'Unknown'));
});

describe('extensionFromMime', () => {
  it('png', () => assert.equal(extensionFromMime('image/png'), 'png'));
  it('jpg', () => assert.equal(extensionFromMime('image/jpeg'), 'jpg'));
  it('mp3', () => assert.equal(extensionFromMime('audio/mpeg'), 'mp3'));
  it('mp4', () => assert.equal(extensionFromMime('video/mp4'), 'mp4'));
  it('pdf', () => assert.equal(extensionFromMime('application/pdf'), 'pdf'));
  it('zip', () => assert.equal(extensionFromMime('application/zip'), 'zip'));
  it('txt', () => assert.equal(extensionFromMime('text/plain'), 'txt'));
  it('csv', () => assert.equal(extensionFromMime('text/csv'), 'csv'));
  it('unknown → empty', () => assert.equal(extensionFromMime('application/x-custom'), ''));
  it('null → empty', () => assert.equal(extensionFromMime(null), ''));
});

describe('isPreviewable', () => {
  it('image → true', () => assert.equal(isPreviewable('image/png'), true));
  it('audio → true', () => assert.equal(isPreviewable('audio/mpeg'), true));
  it('video → true', () => assert.equal(isPreviewable('video/mp4'), true));
  it('pdf → true', () => assert.equal(isPreviewable('application/pdf'), true));
  it('text → true', () => assert.equal(isPreviewable('text/plain'), true));
  it('html → true', () => assert.equal(isPreviewable('text/html'), true));
  it('zip → false', () => assert.equal(isPreviewable('application/zip'), false));
  it('word → false', () => assert.equal(isPreviewable('application/msword'), false));
  it('null → false', () => assert.equal(isPreviewable(null), false));
});
