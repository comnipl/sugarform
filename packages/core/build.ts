import { consola } from 'consola';
import { basename, join } from 'path';
import type { RawSourceMap } from 'source-map';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { transform, minify } from '@swc/core';
import { build } from 'esbuild';
import { execa } from 'execa';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import packageJson from './package.json' assert { type: 'json' };
import { transfer } from 'multi-stage-sourcemap';
import { stderr, stdout } from 'process';

const entry = './src/lib.ts';
const tsbuildinfo = 'node_modules/.cache/tsbuildinfo.json';

consola.start('Building @sugarform/core...');

consola.info(`entrypoint: ${entry}`);

await rm('./dist', { recursive: true, force: true });
consola.success('Cleaned up dist folder.');

await mkdir('./dist', { recursive: true });
consola.success('Created dist folder.');

consola.log('');
const bundled = bundle();
await Promise.all([bundled, pipeline('esm'), pipeline('cjs'), types()]);
consola.log('');
consola.success('All tasks completed.');
consola.log('');

async function bundle() {
  consola.start(`Bundling...`);
  const { outputFiles } = await build({
    entryPoints: [entry],
    sourcemap: 'external',
    target: 'esnext',
    bundle: true,
    write: false,
    platform: 'neutral',
    outfile: './index.ts',
    jsx: 'preserve',
    plugins: [
      nodeExternalsPlugin({
        devDependencies: false,
      }),
    ],
  });
  const sourcemap = outputFiles.find((v) =>
    v.path.endsWith('index.ts.map')
  )?.text;
  const source = outputFiles.find((v) => v.path.endsWith('index.ts'))?.text;

  if (sourcemap === undefined) {
    consola.error('Build result of esbuild did not contain sourcemap!');
    process.exit(1);
  }
  if (source === undefined) {
    consola.error('Build result of esbuild did not contain source!');
    process.exit(1);
  }
  consola.success(
    `Bundled by esbuild! (${toKiloBytes(getStringBytes(source))})`
  );
  return { sourcemap, source };
}

async function types() {
  const output = join(packageJson.exports['.'].types);
  consola.start('Building types...');

  const preserved_buildinfo = await readFile(tsbuildinfo).catch(() => null);
  await execa('tsc', ['--project', 'tsconfig.types.json'])
    .pipeStdout?.(stdout)
    .pipeStderr?.(stderr);
  if (preserved_buildinfo !== null) {
    consola.info('tsbuildinfo was changed. reverting...');
    await writeFile(tsbuildinfo, preserved_buildinfo);
  } else {
    consola.info('tsbuildinfo was generated. removing...');
    await rm(tsbuildinfo);
  }

  consola.success(`Done! (${output})`);
}

async function pipeline(format: 'esm' | 'cjs') {
  const code = await bundled;

  consola.start(`[${format}] Building...`);
  const output = join(
    format === 'esm'
      ? packageJson.exports['.'].import
      : packageJson.exports['.'].require
  );
  const sourcemap_output = `${output}.map`;

  const transformed = await transform(code.source, {
    sourceMaps: true,
    isModule: true,
    minify: true,
    module: {
      type: format === 'esm' ? 'es6' : 'commonjs',
    },
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      target: 'es2017',
      loose: false,
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
  });

  const transform_map = transformed.map;
  if (transform_map === undefined) {
    consola.error(
      `[${format}] Transform result of SWC did not contain source!`
    );
    process.exit(1);
  }

  const minified = await minify(transformed.code, {
    compress: {},
    sourceMap: true,
    mangle: false,
    module: true,
  });

  const minify_map = minified.map;
  if (minify_map === undefined) {
    consola.error(`[${format}] Minify result of SWC did not contain source!`);
    process.exit(1);
  }

  const size = {
    unminified: getStringBytes(transformed.code),
    minified: getStringBytes(minified.code),
  };

  consola.info(
    `[${format}] SWC minified. (${toKiloBytes(
      size.unminified
    )} -> ${toKiloBytes(size.minified)}, -${Math.round(
      (1 - size.minified / size.unminified) * 100
    )}%)`
  );

  await writeFile(
    output,
    minified.code + `\n//# sourceMappingURL=${basename(sourcemap_output)}`
  );
  consola.success(`[${format}] Done! (${output})`);

  consola.start(`[${format}] Merging sourcemaps...`);
  const swc_map = transfer({
    fromSourceMap: minify_map,
    toSourceMap: transform_map,
  });
  const sourcemap = transfer({
    fromSourceMap: swc_map,
    toSourceMap: (await bundled).sourcemap,
  });

  const relative_sourcemap = JSON.parse(sourcemap) as RawSourceMap;
  relative_sourcemap.sourcesContent = undefined;
  relative_sourcemap.sourceRoot = '';
  relative_sourcemap.sources = relative_sourcemap.sources.map((v) => {
    if (!v.startsWith('src')) {
      consola.error(
        `[${format}] Source path ${v} is including out of ./src folder!`
      );
      process.exit(1);
    }
    return `../${v}`;
  });

  await writeFile(sourcemap_output, JSON.stringify(relative_sourcemap));
  consola.success(`[${format}] Done! (${sourcemap_output})`);
}

function getStringBytes(str: string) {
  return Buffer.byteLength(str, 'utf-8');
}
function toKiloBytes(bytes: number) {
  return `${Math.round(bytes / 10) / 100}kB`;
}
