import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber, formatBytes, formatSize, formatDate, isExternalSearch } from '../src/lib/format.js'

test('formatNumber', () => {
  assert.equal(formatNumber(950), '950')
  assert.equal(formatNumber(1234), '1.2k')
  assert.equal(formatNumber(45_000), '45k')
  assert.equal(formatNumber(3_400_000), '3.4M')
  assert.equal(formatNumber(null), null)
})

test('formatBytes', () => {
  assert.equal(formatBytes(2_500_000), '2.5 MB')
  assert.equal(formatBytes(0), null)
})

test('formatSize treats UCI size as rows', () => {
  assert.equal(formatSize({ source: 'uci', size: 768 }), '768 rows')
  assert.equal(formatSize({ source: 'huggingface', size: 1_200_000_000 }), '1.2 GB')
})

test('formatDate', () => {
  const now = new Date('2026-10-12T00:00:00Z')
  assert.equal(formatDate('2026-10-02T00:00:00Z', now), '10d ago')
  assert.equal(formatDate('2026-06-12T00:00:00Z', now), '4mo ago')
  assert.equal(formatDate('2019-01-01', now), '2019')
  assert.equal(formatDate(null, now), null)
})

test('isExternalSearch', () => {
  assert.equal(isExternalSearch({ tags: ['external-search'] }), true)
  assert.equal(isExternalSearch({ tags: [] }), false)
})
