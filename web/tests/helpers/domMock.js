const path = require('path');

class MockClassList {
  constructor(initial = '') {
    this._set = new Set(String(initial).split(/\s+/).filter(Boolean));
  }
  add(...tokens) {
    tokens.forEach((t) => t && this._set.add(t));
  }
  remove(...tokens) {
    tokens.forEach((t) => this._set.delete(t));
  }
  contains(token) {
    return this._set.has(token);
  }
  toggle(token, force) {
    if (force === true) {
      this._set.add(token);
      return true;
    }
    if (force === false) {
      this._set.delete(token);
      return false;
    }
    if (this._set.has(token)) {
      this._set.delete(token);
      return false;
    }
    this._set.add(token);
    return true;
  }
  toString() {
    return Array.from(this._set).join(' ');
  }
}

function createStorage() {
  let store = new Map();
  return {
    getItem(k) {
      return store.has(String(k)) ? store.get(String(k)) : null;
    },
    setItem(k, v) {
      store.set(String(k), String(v));
    },
    removeItem(k) {
      store.delete(String(k));
    },
    clear() {
      store = new Map();
    },
    key(i) {
      return Array.from(store.keys())[i] || null;
    },
    get length() {
      return store.size;
    },
  };
}

function matchSelector(el, selector) {
  if (!el || !selector) return false;
  const parts = selector
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.some((sel) => {
    // Support basic combinator fallback by checking last segment first
    const segments = sel.split(/\s+/).filter(Boolean);
    const tail = segments[segments.length - 1];
    if (tail.startsWith('#')) {
      return el.id === tail.slice(1);
    }
    if (tail.startsWith('.')) {
      return tail
        .slice(1)
        .split('.')
        .every((cls) => el.classList.contains(cls));
    }
    const attrMatch = tail.match(/^([a-z0-9_-]*)\[([a-z0-9_-]+)(?:=["']?([^"'\]]+)["']?)?\]$/i);
    if (attrMatch) {
      const [, tag, attr, val] = attrMatch;
      if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      const got = el.getAttribute(attr);
      return val !== undefined ? String(got) === String(val) : got !== null;
    }
    if (tail.includes('.')) {
      const [tag, ...classes] = tail.split('.');
      if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      return classes.every((cls) => el.classList.contains(cls));
    }
    return el.tagName.toLowerCase() === tail.toLowerCase();
  });
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function decodeEntities(str) {
  return String(str)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttributesIntoElement(el, attrText, registry) {
  if (!attrText) return;
  const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = attrRegex.exec(attrText)) !== null) {
    const name = m[1].toLowerCase();
    const val = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    el.setAttribute(name, val);
    if (name === 'value') el.value = val;
    if (name === 'type') el.type = val;
    if (name === 'checked') el.checked = true;
    if (name === 'id' && val && registry) registry.set(val, el);
  }
}

function parseHtmlFragment(html, rootParent, registry) {
  if (!html || !String(html).includes('<')) return;
  const stack = [rootParent];
  const openStartStack = [];
  const tagRegex = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const isClosing = full.startsWith('</');

    if (isClosing) {
      if (stack.length > 1) {
        const closedEl = stack[stack.length - 1];
        const innerStart = openStartStack.pop();
        if (closedEl && closedEl.tagName.toLowerCase() === tag && innerStart !== undefined) {
          const innerSlice = html.slice(innerStart, match.index).replace(/<[^>]*>/g, '').trim();
          if (tag === 'option' && innerSlice) {
            closedEl._textContent = decodeEntities(innerSlice);
            if (!closedEl.hasAttribute('value')) closedEl.value = closedEl._textContent;
          }
        }
        stack.pop();
      }
    } else {
      const parent = stack[stack.length - 1] || rootParent;
      const el = new MockElement(tag);
      el._fromHtml = true;
      el._registry = registry || parent._registry || null;
      parseAttributesIntoElement(el, attrs, el._registry);
      parent.appendChild(el);
      const isSelfClosing = full.endsWith('/>') || VOID_TAGS.has(tag);
      if (!isSelfClosing) {
        stack.push(el);
        openStartStack.push(tagRegex.lastIndex);
      }
    }
  }
}

class MockElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = String(tagName).toUpperCase();
    this.id = id;
    this._classList = new MockClassList(className);
    this.style = { cssText: '', setProperty() {}, removeProperty() {} };
    this.dataset = {};
    this.attributes = {};
    this._listeners = {};
    this.children = [];
    this.parentElement = null;
    this.parentNode = null;
    this._fromHtml = false;
    this._registry = null;
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.href = '';
    this.src = '';
    this.alt = '';
    this.type = '';
    this._innerHTML = '';
    this._textContent = '';
    this.files = [];
    this.rows = [];
  }

  add(opt) {
    this.appendChild(opt);
  }
  get selectedIndex() {
    const idx = this.options.findIndex((o) => o.value === this.value);
    return idx >= 0 ? idx : 0;
  }
  get options() {
    const childOpts = this.querySelectorAll('option');
    if (childOpts.length > 0) return childOpts;
    const opts = [];
    const regex = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
    let m;
    while ((m = regex.exec(this._innerHTML || '')) !== null) {
      const opt = new MockElement('option');
      const valMatch = m[1].match(/\bvalue=["']([^"']*)["']/i);
      const nomeMatch = m[1].match(/\bdata-nome=["']([^"']*)["']/i);
      const idMatch = m[1].match(/\bdata-id=["']([^"']*)["']/i);
      opt.value = valMatch ? valMatch[1] : m[2];
      opt.textContent = m[2].replace(/<[^>]*>/g, '').trim();
      if (nomeMatch) opt.dataset.nome = nomeMatch[1];
      if (idMatch) opt.dataset.id = idMatch[1];
      opts.push(opt);
    }
    return opts;
  }
  get selectedOptions() {
    const found = this.options.find((o) => o.value === this.value) || this.options[0];
    return found ? [found] : [];
  }

  get className() {
    return this._classList.toString();
  }
  set className(val) {
    this._classList = new MockClassList(val);
  }
  get classList() {
    return this._classList;
  }

  get innerHTML() {
    const manualChildren = this.children.filter((c) => !c._fromHtml);
    if (manualChildren.length > 0) {
      return this._innerHTML + manualChildren.map((c) => c.outerHTML).join('');
    }
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = String(val ?? '');
    this.children = this.children.filter((c) => !c._fromHtml);
    if (this._innerHTML === '') {
      this.children = [];
    } else if (this._innerHTML.includes('<')) {
      parseHtmlFragment(this._innerHTML, this, this._registry);
    }
  }
  get outerHTML() {
    return this.innerHTML;
  }
  set outerHTML(val) {
    this._innerHTML = String(val ?? '');
  }

  get textContent() {
    if (this._textContent) return this._textContent;
    return this._innerHTML.replace(/<[^>]*>/g, '');
  }
  set textContent(val) {
    const raw = String(val ?? '');
    this._textContent = raw;
    this._innerHTML = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  get innerText() {
    return this.textContent;
  }
  set innerText(val) {
    this.textContent = val;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
    if (name.startsWith('data-')) {
      const camel = name
        .slice(5)
        .replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[camel] = String(value);
    }
  }
  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }
  removeAttribute(name) {
    delete this.attributes[name];
  }

  appendChild(child) {
    if (child) {
      child.parentElement = this;
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    return child;
  }
  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }
  insertAdjacentHTML(_pos, html) {
    const fragment = String(html ?? '');
    this._innerHTML += fragment;
    if (fragment.includes('<')) {
      parseHtmlFragment(fragment, this, this._registry);
    }
  }

  addEventListener(evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
  }
  removeEventListener(evt, fn) {
    if (!this._listeners[evt]) return;
    this._listeners[evt] = this._listeners[evt].filter((f) => f !== fn);
  }
  dispatchEvent(evtObj) {
    const evt = typeof evtObj === 'string' ? { type: evtObj } : { ...evtObj };
    evt.target = evt.target || this;
    evt.currentTarget = this;
    evt.preventDefault = evt.preventDefault || (() => {});
    evt.stopPropagation = evt.stopPropagation || (() => {});
    (this._listeners[evt.type] || []).forEach((fn) => fn(evt));
    return true;
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (matchSelector(cur, selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const out = [];
    const visit = (node) => {
      for (const ch of node.children || []) {
        if (matchSelector(ch, selector)) out.push(ch);
        visit(ch);
      }
    };
    visit(this);
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  focus() {}
  blur() {}
  click() {
    this.dispatchEvent({ type: 'click' });
  }
  reset() {
    this.value = '';
  }
  getContext() {
    return {
      clearRect: () => {},
      fillRect: () => {},
      canvas: this,
    };
  }
}

function setupWebDom(initialUrl = 'https://doareguardar.org/index.html') {
  const registry = new Map();
  const docListeners = {};
  const winListeners = {};

  const documentElement = new MockElement('html');
  documentElement._registry = registry;
  documentElement.setAttribute('lang', 'pt-BR');
  const head = new MockElement('head');
  head._registry = registry;
  const body = new MockElement('body');
  body._registry = registry;
  documentElement.appendChild(head);
  documentElement.appendChild(body);

  const registerEl = (tag, id = '', className = '', parent = body) => {
    const el = new MockElement(tag, id, className);
    el._registry = registry;
    if (id) registry.set(id, el);
    if (parent) parent.appendChild(el);
    return el;
  };

  const registerIds = (ids, defaultTag = 'div') => {
    ids.forEach((id) => {
      if (!registry.has(id)) {
        registerEl(defaultTag, id);
      }
    });
  };

  const querySelectorAllTree = (selector) => {
    const all = [];
    const walk = (node) => {
      if (node !== documentElement && matchSelector(node, selector)) {
        all.push(node);
      }
      for (const ch of node.children || []) walk(ch);
    };
    walk(documentElement);
    for (const el of registry.values()) {
      if (!all.includes(el) && matchSelector(el, selector)) {
        all.push(el);
      }
    }
    return all;
  };

  const documentMock = {
    documentElement,
    head,
    body,
    activeElement: body,
    cookie: '',
    createElement(tag) {
      const el = new MockElement(tag);
      el._registry = registry;
      return el;
    },
    getElementById(id) {
      return registry.get(id) || null;
    },
    querySelector(selector) {
      if (selector.startsWith('#') && !selector.includes(' ') && !selector.includes('.')) {
        const direct = registry.get(selector.slice(1));
        if (direct) return direct;
      }
      return querySelectorAllTree(selector)[0] || null;
    },
    querySelectorAll(selector) {
      return querySelectorAllTree(selector);
    },
    getElementsByClassName(cls) {
      return querySelectorAllTree(`.${cls}`);
    },
    addEventListener(evt, fn) {
      if (!docListeners[evt]) docListeners[evt] = [];
      docListeners[evt].push(fn);
    },
    removeEventListener(evt, fn) {
      if (!docListeners[evt]) return;
      docListeners[evt] = docListeners[evt].filter((f) => f !== fn);
    },
    dispatchEvent(evtObj) {
      const evt = typeof evtObj === 'string' ? { type: evtObj } : { ...evtObj };
      evt.preventDefault = evt.preventDefault || (() => {});
      (docListeners[evt.type] || []).forEach((fn) => fn(evt));
      return true;
    },
    registerEl,
    registerIds,
    registry,
  };

  const parsedUrl = new URL(initialUrl);
  const locationMock = {
    href: initialUrl,
    pathname: parsedUrl.pathname,
    search: parsedUrl.search,
    hash: parsedUrl.hash,
    origin: parsedUrl.origin,
    assign(url) {
      this.href = url;
    },
    replace(url) {
      this.href = url;
    },
    reload: jest.fn(),
  };

  const historyMock = {
    replaceState: jest.fn((_s, _t, url) => {
      if (url) locationMock.hash = String(url).includes('#') ? `#${String(url).split('#')[1]}` : '';
    }),
    pushState: jest.fn(),
  };

  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const alertMock = jest.fn();
  const confirmMock = jest.fn(() => true);
  const promptMock = jest.fn(() => '');
  const fetchMock = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ sucesso: true }),
    text: async () => '{}',
  }));

  const ChartMock = jest.fn().mockImplementation(function Chart(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroy = jest.fn();
    this.update = jest.fn();
  });

  const openMock = jest.fn();
  const printMock = jest.fn();
  const scrollToMock = jest.fn();

  global.document = documentMock;
  global.window = global;
  global.window.document = documentMock;
  global.localStorage = localStorage;
  global.sessionStorage = sessionStorage;
  global.location = locationMock;
  global.history = historyMock;
  global.alert = alertMock;
  global.confirm = confirmMock;
  global.prompt = promptMock;
  global.fetch = fetchMock;
  global.Chart = ChartMock;
  global.open = openMock;
  global.print = printMock;
  global.scrollTo = scrollToMock;
  global.window.open = openMock;
  global.window.print = printMock;
  global.window.scrollTo = scrollToMock;
  global.html2pdf = undefined;
  global.Option = function Option(text, value) {
    const o = new MockElement('option');
    o.textContent = text ?? '';
    o.value = value !== undefined ? String(value) : String(text ?? '');
    return o;
  };
  global.Blob = global.Blob || function MockBlob(parts) { this.parts = parts; };
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
  global.navigator = {
    clipboard: { writeText: jest.fn(async () => {}) },
    userAgent: 'jest-web-mock',
  };
  global.window.addEventListener = (evt, fn) => {
    if (!winListeners[evt]) winListeners[evt] = [];
    winListeners[evt].push(fn);
  };
  global.window.dispatchEvent = (evtObj) => {
    const evt = typeof evtObj === 'string' ? { type: evtObj } : { ...evtObj };
    (winListeners[evt.type] || []).forEach((fn) => fn(evt));
    return true;
  };
  global.btoa = global.btoa || ((s) => Buffer.from(s, 'binary').toString('base64'));
  global.atob = global.atob || ((s) => Buffer.from(s, 'base64').toString('binary'));

  // Clean custom window exports from previous script loads
  return {
    document: documentMock,
    localStorage,
    sessionStorage,
    location: locationMock,
    history: historyMock,
    alert: alertMock,
    confirm: confirmMock,
    fetch: fetchMock,
    Chart: ChartMock,
    open: openMock,
    print: printMock,
    scrollTo: scrollToMock,
    registerEl,
    registerIds,
    MockElement,
    dispararDOMContentLoaded() {
      documentMock.dispatchEvent({ type: 'DOMContentLoaded' });
    },
  };
}

function carregarScriptWeb(nomeArquivo) {
  const absPath = path.resolve(__dirname, '../../public/js', nomeArquivo);
  delete require.cache[require.resolve(absPath)];
  return require(absPath);
}

module.exports = {
  MockElement,
  setupWebDom,
  carregarScriptWeb,
};
