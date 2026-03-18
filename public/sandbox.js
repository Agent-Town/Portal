/**
 * sandbox.js — Browser-side TypeScript sandbox for the iterate experience.
 *
 * Primary: WebContainer API (requires COOP + COEP headers).
 * Fallback: iframe + esbuild-wasm (when SharedArrayBuffer unavailable).
 *
 * Usage:
 *   const sb = await createSandbox();
 *   const result = await sb.run({ 'src/index.ts': 'console.log(42)' });
 *   // result = { stdout, stderr, exitCode, executionMs }
 *   const zip = await sb.exportZip();
 *   await sb.dispose();
 */

// ── Constants ─────────────────────────────────────────────────
const EXECUTION_TIMEOUT_MS = 30_000;
const INSTALL_TIMEOUT_MS = 60_000;
const MAX_FS_BYTES = 50 * 1024 * 1024; // 50 MB
const DEFAULT_ENTRYPOINT = 'src/index.ts';

const DEFAULT_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    outDir: 'dist',
    rootDir: 'src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  },
};

const DEFAULT_PACKAGE_JSON = {
  name: 'iterate-sandbox',
  version: '1.0.0',
  private: true,
  scripts: {
    build: 'tsc',
    start: 'node dist/index.js',
  },
  devDependencies: {
    typescript: '^5.0.0',
  },
};

// ── Capability detection ──────────────────────────────────────
function supportsWebContainer() {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
}

// ── WebContainer Sandbox ──────────────────────────────────────
async function createWebContainerSandbox() {
  const { WebContainer } = await import('https://esm.sh/@webcontainer/api@1');
  const wc = await WebContainer.boot();

  let disposed = false;

  async function mount(files) {
    const tree = filesToTree(files);
    // Add tsconfig and package.json if not present
    if (!tree['tsconfig.json']) {
      tree['tsconfig.json'] = { file: { contents: JSON.stringify(DEFAULT_TSCONFIG, null, 2) } };
    }
    if (!tree['package.json']) {
      tree['package.json'] = { file: { contents: JSON.stringify(DEFAULT_PACKAGE_JSON, null, 2) } };
    }
    await wc.mount(tree);
  }

  async function install() {
    const proc = await wc.spawn('npm', ['install', '--prefer-offline']);
    const output = await collectOutput(proc, INSTALL_TIMEOUT_MS);
    if (output.exitCode !== 0) {
      throw new Error(`npm install failed (exit ${output.exitCode}): ${output.stderr.slice(0, 500)}`);
    }
    return output;
  }

  async function compile() {
    const proc = await wc.spawn('npx', ['tsc', '--noEmit', 'false']);
    const output = await collectOutput(proc, EXECUTION_TIMEOUT_MS);
    return output;
  }

  async function execute(entrypoint) {
    const jsEntry = entrypoint
      .replace(/^src\//, 'dist/')
      .replace(/\.ts$/, '.js');
    const proc = await wc.spawn('node', [jsEntry]);
    const output = await collectOutput(proc, EXECUTION_TIMEOUT_MS);
    return output;
  }

  async function run(files, entrypoint = DEFAULT_ENTRYPOINT) {
    if (disposed) throw new Error('Sandbox disposed');
    const t0 = Date.now();

    await mount(files);
    await install();

    const compileResult = await compile();
    if (compileResult.exitCode !== 0) {
      return {
        stdout: '',
        stderr: compileResult.stderr,
        exitCode: compileResult.exitCode,
        executionMs: Date.now() - t0,
        phase: 'compile',
      };
    }

    const execResult = await execute(entrypoint);
    return {
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      executionMs: Date.now() - t0,
      phase: 'execute',
    };
  }

  async function exportZip() {
    if (disposed) throw new Error('Sandbox disposed');
    return await wc.export('.', { format: 'zip' });
  }

  async function importZip(zipData) {
    if (disposed) throw new Error('Sandbox disposed');
    await wc.mount(zipData);
  }

  async function readFile(path) {
    if (disposed) throw new Error('Sandbox disposed');
    return await wc.fs.readFile(path, 'utf-8');
  }

  function dispose() {
    disposed = true;
    wc.teardown();
  }

  return {
    type: 'webcontainer',
    ready: true,
    run,
    mount,
    install,
    compile,
    execute,
    exportZip,
    importZip,
    readFile,
    dispose,
  };
}

// ── Fallback: iframe + inline eval ────────────────────────────
async function createFallbackSandbox() {
  // Lightweight fallback: compile TS with esbuild-wasm, execute in sandboxed iframe.
  let esbuild = null;
  let esbuildReady = false;
  let disposed = false;
  let currentFiles = {};

  try {
    esbuild = await import('https://esm.sh/esbuild-wasm@0.25.0');
    await esbuild.initialize({
      wasmURL: 'https://esm.sh/esbuild-wasm@0.25.0/esbuild.wasm',
    });
    esbuildReady = true;
  } catch (e) {
    console.warn('esbuild-wasm init failed:', e.message);
  }

  async function compileTs(source) {
    if (!esbuildReady) throw new Error('esbuild not available');
    const result = await esbuild.transform(source, {
      loader: 'ts',
      target: 'es2020',
      format: 'esm',
    });
    return { code: result.code, errors: result.warnings };
  }

  function executeInIframe(jsCode) {
    return new Promise((resolve) => {
      const stdout = [];
      const stderr = [];
      let exitCode = 0;
      const t0 = Date.now();

      const iframe = document.createElement('iframe');
      iframe.sandbox = 'allow-scripts';
      iframe.style.display = 'none';

      // Capture console output via message passing
      const wrappedCode = `
        const __stdout = [];
        const __stderr = [];
        const __origLog = console.log;
        const __origErr = console.error;
        console.log = (...args) => __stdout.push(args.map(String).join(' '));
        console.error = (...args) => __stderr.push(args.map(String).join(' '));
        try {
          ${jsCode}
        } catch(e) {
          __stderr.push(String(e));
          parent.postMessage({ __sandbox: true, stdout: __stdout.join('\\n'), stderr: __stderr.join('\\n'), exitCode: 1 }, '*');
          return;
        }
        parent.postMessage({ __sandbox: true, stdout: __stdout.join('\\n'), stderr: __stderr.join('\\n'), exitCode: 0 }, '*');
      `;

      const timeout = setTimeout(() => {
        iframe.remove();
        resolve({ stdout: stdout.join('\n'), stderr: 'Execution timeout', exitCode: 1, executionMs: Date.now() - t0 });
      }, EXECUTION_TIMEOUT_MS);

      function onMessage(evt) {
        if (evt.data?.__sandbox !== true) return;
        clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        iframe.remove();
        resolve({
          stdout: evt.data.stdout || '',
          stderr: evt.data.stderr || '',
          exitCode: evt.data.exitCode ?? 0,
          executionMs: Date.now() - t0,
        });
      }

      window.addEventListener('message', onMessage);
      iframe.srcdoc = `<!doctype html><script>${wrappedCode}<\/script>`;
      document.body.appendChild(iframe);
    });
  }

  async function run(files, entrypoint = DEFAULT_ENTRYPOINT) {
    if (disposed) throw new Error('Sandbox disposed');
    currentFiles = { ...files };
    const t0 = Date.now();

    const source = files[entrypoint];
    if (!source) {
      return { stdout: '', stderr: `File not found: ${entrypoint}`, exitCode: 1, executionMs: 0, phase: 'compile' };
    }

    try {
      const compiled = await compileTs(source);
      const result = await executeInIframe(compiled.code);
      return { ...result, phase: 'execute' };
    } catch (e) {
      return { stdout: '', stderr: e.message, exitCode: 1, executionMs: Date.now() - t0, phase: 'compile' };
    }
  }

  async function exportZip() {
    // Fallback: create a simple JSON blob (not a real zip, but transferable)
    const blob = JSON.stringify(currentFiles);
    return new TextEncoder().encode(blob);
  }

  async function importZip(data) {
    try {
      const text = new TextDecoder().decode(data);
      currentFiles = JSON.parse(text);
    } catch {
      throw new Error('Invalid snapshot data');
    }
  }

  function dispose() {
    disposed = true;
    currentFiles = {};
  }

  return {
    type: 'fallback',
    ready: esbuildReady,
    run,
    mount: async (files) => { currentFiles = { ...files }; },
    install: async () => ({ stdout: '', stderr: '', exitCode: 0 }),
    compile: async () => ({ stdout: '', stderr: '', exitCode: 0 }),
    execute: async () => ({ stdout: '', stderr: '', exitCode: 0 }),
    exportZip,
    importZip,
    readFile: async (path) => currentFiles[path] || '',
    dispose,
  };
}

// ── Helpers ───────────────────────────────────────────────────
function filesToTree(files) {
  const tree = {};
  for (const [path, contents] of Object.entries(files)) {
    const parts = path.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { directory: {} };
      node = node[parts[i]].directory;
    }
    node[parts[parts.length - 1]] = { file: { contents } };
  }
  return tree;
}

async function collectOutput(process, timeoutMs) {
  let stdout = '';
  let stderr = '';

  const stdoutReader = process.output.getReader();
  const stderrReader = process.error?.getReader?.();

  const readStream = async (reader, target) => {
    if (!reader) return '';
    let result = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += value;
      }
    } catch { /* stream closed */ }
    return result;
  };

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), timeoutMs)
  );

  try {
    const [out, err, exitCode] = await Promise.race([
      Promise.all([
        readStream(stdoutReader),
        stderrReader ? readStream(stderrReader) : '',
        process.exit,
      ]),
      timeoutPromise,
    ]);
    stdout = out;
    stderr = err;
    return { stdout, stderr, exitCode };
  } catch (e) {
    if (e.message === 'EXECUTION_TIMEOUT') {
      try { process.kill(); } catch { /* already dead */ }
      return { stdout, stderr: stderr + '\nExecution timeout', exitCode: 1 };
    }
    throw e;
  }
}

// ── Public API ────────────────────────────────────────────────
export async function createSandbox() {
  if (supportsWebContainer()) {
    try {
      return await createWebContainerSandbox();
    } catch (e) {
      console.warn('WebContainer boot failed, using fallback:', e.message);
    }
  }
  return await createFallbackSandbox();
}

export { supportsWebContainer, DEFAULT_ENTRYPOINT, DEFAULT_TSCONFIG, DEFAULT_PACKAGE_JSON };
