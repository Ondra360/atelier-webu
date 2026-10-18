import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/editor/app.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

function runtime(script) {
  const listeners = {};
  const nodes = {};
  const document = {
    baseURI: 'https://example.test/',
    addEventListener: (type, listener) => { listeners[type] = listener; },
    contains: () => true,
    querySelector: selector => nodes[selector] || null,
    querySelectorAll: () => [],
    dispatchEvent: () => true,
  };
  const window = { location: { href: '' }, open: () => {} };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; this.defaultPrevented = false; }
    preventDefault() { this.defaultPrevented = true; }
  }
  const context = { document, window, CSS: { escape: value => value }, URL, CustomEvent, alert: () => {} };
  vm.runInNewContext(script, context);
  return { document, window, nodes, listeners };
}

function click(runtime, actionData, source) {
  source.dataset = { action: JSON.stringify(actionData) };
  runtime.listeners.click({ target: { closest: () => source }, preventDefault() {} });
}

const mount = extract('function mountActions(root)', 'function startAnimations(root)');
const editorScript = `${mount}\nmountActions(document);`;

test('legacy actions stay readable and are migrated only when edited', () => {
  const code = extract('function actionsFor(el)', 'function animationFor(el)');
  const helpers = vm.runInNewContext(`${code}\n({actionsFor, editableActions})`);
  const original = { type: 'scroll', target: 'section', value: '' };
  const element = { props: { action: original } };
  assert.equal(helpers.actionsFor(element)[0], original);
  assert.equal(element.props.actions, undefined);
  const actions = helpers.editableActions(element);
  assert.equal(actions[0].target, 'section');
  assert.notEqual(actions[0], original);
  assert.equal(element.props.action, undefined);
  actions.push({ type: 'alert', value: 'Hello', target: '' });
  assert.equal(helpers.actionsFor(element).length, 2);
  assert.equal(helpers.actionsFor({ props: { action: { type: 'none' } } }).length, 0);
});

test('multiple actions execute in order and an old single action still works', () => {
  const app = runtime(editorScript);
  const button = { textContent: 'Before' };
  const target = { hidden: false };
  app.nodes['#button'] = button;
  app.nodes['#target'] = target;
  click(app, [
    { type: 'text', target: 'button', value: 'First' },
    { type: 'toggle', target: 'target' },
    { type: 'text', target: 'button', value: 'Last' },
  ], button);
  assert.equal(button.textContent, 'Last');
  assert.equal(target.hidden, true);
  click(app, { type: 'toggle', target: 'target' }, button);
  assert.equal(target.hidden, false);
});

test('navigating to another page ends the sequence', () => {
  const app = runtime(editorScript);
  const button = { textContent: 'Before' };
  app.nodes['#button'] = button;
  click(app, [
    { type: 'text', target: 'button', value: 'Before navigation' },
    { type: 'page', target: 'next', value: 'next.html' },
    { type: 'text', target: 'button', value: 'Must not run' },
  ], button);
  assert.equal(button.textContent, 'Before navigation');
  assert.equal(app.window.location.href, 'next.html');
});

const exportDir = process.env.ATELIER_TEST_EXPORT;
test('generated HTML and script run the exported sequence', { skip: !exportDir }, () => {
  const html = readFileSync(join(exportDir, 'stranka-3.html'), 'utf8');
  const match = html.match(/<button id="([^"]+)"[^>]*data-action="([^"]+)"/);
  assert.ok(match, 'export must contain the configured button');
  const actionText = match[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const actions = JSON.parse(actionText);
  assert.deepEqual(actions.map(action => action.value), ['DRUHA', 'PRVNI']);
  const script = readFileSync(join(exportDir, 'script.js'), 'utf8');
  const app = runtime(script);
  const button = { textContent: 'Before' };
  app.nodes['#' + match[1]] = button;
  click(app, actions, button);
  assert.equal(button.textContent, 'PRVNI');
});
