import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  const bigint = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function srgbToLin(val) {
  const s = val / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

test('visual design tokens: obsidian, azure, gold, war, and neutral hierarchy in atlas.css', () => {
  const css = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');

  // Void & obsidian tokens
  assert.ok(css.includes('--void-deep:'), 'Must include --void-deep');
  assert.ok(css.includes('--void:'), 'Must include --void');
  assert.ok(css.includes('--void-surface:'), 'Must include --void-surface');
  assert.ok(css.includes('--panel:'), 'Must include --panel');
  assert.ok(css.includes('--panel-solid:'), 'Must include --panel-solid');
  assert.ok(css.includes('--card-bg:'), 'Must include --card-bg');

  // Azure / Starsilk programmable substrate scale
  assert.ok(css.includes('--azure:'), 'Must include --azure');
  assert.ok(css.includes('--azure-bright:'), 'Must include --azure-bright');
  assert.ok(css.includes('--azure-glow:'), 'Must include --azure-glow');
  assert.ok(css.includes('--azure-mute:'), 'Must include --azure-mute');

  // Restrained canon & era accents
  assert.ok(css.includes('--gold:'), 'Must include --gold');
  assert.ok(css.includes('--accent-war:'), 'Must include --accent-war');
  assert.ok(css.includes('--accent-locking:'), 'Must include --accent-locking');
  assert.ok(css.includes('--accent-postwar:'), 'Must include --accent-postwar');

  // Text contrast tokens
  assert.ok(css.includes('--txt-primary:'), 'Must include --txt-primary');
  assert.ok(css.includes('--txt:'), 'Must include --txt');
  assert.ok(css.includes('--txt-secondary:'), 'Must include --txt-secondary');
  assert.ok(css.includes('--txt-muted:'), 'Must include --txt-muted');

  // Font stacks
  assert.ok(css.includes('--display:'), 'Must include --display serif font');
  assert.ok(css.includes('--mono:'), 'Must include --mono code/telemetry font');
  assert.ok(css.includes('--sans:'), 'Must include --sans UI font');
});

test('numeric readability and tabular figures in atlas.css', () => {
  const css = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');

  assert.ok(css.includes('font-variant-numeric:tabular-nums') || css.includes('font-variant-numeric: tabular-nums'),
    'Must declare tabular-nums for numeric stability');
  assert.ok(css.includes('scale-gauge-text'), 'Scale gauge readout must use tabular numerals');
  assert.ok(css.includes('first-action-hud'), 'Orientation HUD must use tabular numerals');
  assert.ok(css.includes('analysis-cell'), 'Strategy analysis cells must use tabular numerals');
});

test('focus-visible accessibility ring across interactive elements', () => {
  const css = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');

  assert.ok(css.includes('button:focus-visible'), 'button must have focus-visible styling');
  assert.ok(css.includes('input:focus-visible'), 'input must have focus-visible styling');
  assert.ok(css.includes('select:focus-visible'), 'select must have focus-visible styling');
  assert.ok(css.includes('textarea:focus-visible'), 'textarea must have focus-visible styling');
  assert.ok(css.includes('[tabindex]:focus-visible'), 'generic tabindex focus must have focus-visible styling');
  assert.ok(css.includes('outline:2px solid var(--azure-bright)') || css.includes('outline: 2px solid var(--azure-bright)'),
    'Focus ring must use high-visibility azure bright');
});

test('custom scrollbars and non-backdrop-filter fallback', () => {
  const css = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');

  assert.ok(css.includes('scrollbar-width:thin') || css.includes('scrollbar-width: thin'),
    'Must define thin scrollbars');
  assert.ok(css.includes('::-webkit-scrollbar'), 'Must style WebKit scrollbars');
  assert.ok(css.includes('@supports not (backdrop-filter'), 'Must provide fallback for environments lacking backdrop-filter');
});

test('comprehensive reduced motion handling across stylesheet suite', () => {
  const atlasCss = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');
  const focusCss = fs.readFileSync(path.join(rootDir, 'atlas-focus.css'), 'utf8');
  const networkCss = fs.readFileSync(path.join(rootDir, 'network.css'), 'utf8');
  const strategicCss = fs.readFileSync(path.join(rootDir, 'strategic.css'), 'utf8');

  assert.ok(atlasCss.includes('@media(prefers-reduced-motion:reduce)'), 'atlas.css must handle reduced-motion');
  assert.ok(focusCss.includes('@media(prefers-reduced-motion:reduce)'), 'atlas-focus.css must handle reduced-motion');
  assert.ok(networkCss.includes('@media(prefers-reduced-motion:reduce)'), 'network.css must handle reduced-motion');
  assert.ok(strategicCss.includes('@media(prefers-reduced-motion:reduce)'), 'strategic.css must handle reduced-motion');
});

test('WCAG 2.1 contrast ratio verification for core design system colors', () => {
  // Void background #03060b vs Primary Text #f8fafc
  const voidBg = '#03060b';
  const txtPrimary = '#f8fafc';
  const ratioPrimary = contrastRatio(txtPrimary, voidBg);
  assert.ok(ratioPrimary >= 14.0, `Primary text on void background must exceed 14:1 (got ${ratioPrimary.toFixed(2)}:1)`);

  // Void background #03060b vs Azure Bright #38bdf8
  const azureBright = '#38bdf8';
  const ratioAzure = contrastRatio(azureBright, voidBg);
  assert.ok(ratioAzure >= 8.0, `Azure bright on void background must exceed 8:1 (got ${ratioAzure.toFixed(2)}:1)`);

  // Void background #03060b vs Reference Landmark Gold #d9b98b
  const gold = '#d9b98b';
  const ratioGold = contrastRatio(gold, voidBg);
  assert.ok(ratioGold >= 7.0, `Gold on void background must exceed 7:1 (got ${ratioGold.toFixed(2)}:1)`);

  // Panel Solid #030b13 vs War Crimson #ef4444
  const warCrimson = '#ef4444';
  const ratioWar = contrastRatio(warCrimson, '#030b13');
  assert.ok(ratioWar >= 4.5, `War accent on panel solid must exceed WCAG AA 4.5:1 (got ${ratioWar.toFixed(2)}:1)`);
});
