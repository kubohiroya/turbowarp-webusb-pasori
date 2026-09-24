import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {promisify} from 'node:util';

interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  packageManager?: string;
  engines?: {node?: string};
  repository?: {url?: string};
  bugs?: {url?: string};
  files?: string[];
  bin?: string | Record<string, string>;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface RepoPolicy {
  schemaVersion: number;
  productName: string;
  packageType: string;
  licensePolicy: string;
  packageManager: string;
  homepage: string;
  node: {
    minimum: string;
  };
  extension: {
    id: string;
    standaloneBundle: string;
    manifest: string;
  };
  runtimeApi: {
    namespace: string;
    readerOwnership: string;
    waitSemantics: string;
  };
  exceptions: {
    webUsbRequiresUserGesture: boolean;
    browserDevicePermission: boolean;
    protectedInterfaceMayFail: boolean;
  };
}

interface PackResult {
  version: string;
  files: {path: string}[];
}

const execFileAsync = promisify(execFile);
const errors: string[] = [];

const packageMetadata = JSON.parse(await readFile('package.json', 'utf8')) as PackageMetadata;
const policy = JSON.parse(await readFile('repo-policy.json', 'utf8')) as RepoPolicy;
const readme = await readFile('README.md', 'utf8');
const readmeJa = await readFile('README.ja.md', 'utf8');
const changelog = await readFile('CHANGELOG.md', 'utf8');
const license = await readFile('LICENSE', 'utf8');
const config = await readFile('src/config.ts', 'utf8');
const blockDefinitions = await readFile('src/block-definitions.json', 'utf8');
const bundle = await readFile(policy.extension.standaloneBundle, 'utf8');
const manifest = JSON.parse(await readFile(policy.extension.manifest, 'utf8'));
const pages = [
  await readFile('docs/index.html', 'utf8'),
  await readFile('docs/ja/index.html', 'utf8')
];

checkPolicy();
checkPackageMetadata();
checkReadme();
checkChangelog();
checkLicense();
checkRuntimeContracts();
await checkPackContents();

if (errors.length > 0) {
  throw new Error(`Repository policy check failed:\n- ${errors.join('\n- ')}`);
}

process.stdout.write('Repository policy is aligned.\n');

function checkPolicy() {
  if (policy.schemaVersion !== 1) errors.push('repo-policy.json schemaVersion must be 1');
  if (policy.productName !== 'TurboWarp-WebUSB-PaSoRi') {
    errors.push('repo-policy.json productName must be TurboWarp-WebUSB-PaSoRi');
  }
  if (policy.packageType !== 'capability-extension') {
    errors.push('repo-policy.json packageType must be capability-extension');
  }
  if (policy.licensePolicy !== 'mpl-2.0') errors.push('repo-policy.json licensePolicy must be mpl-2.0');
  if (policy.packageManager !== 'pnpm') errors.push('repo-policy.json packageManager must be pnpm');
  if (policy.homepage !== 'pages') {
    errors.push('repo-policy.json homepage must record Pages as the user entrypoint');
  }
  if (policy.node?.minimum !== '22') errors.push('repo-policy.json node.minimum must be 22');
  if (policy.extension?.id !== 'kubohiroyawebusbpasori') {
    errors.push('repo-policy.json must retain the WebUSB PaSoRi extension ID');
  }
  if (policy.runtimeApi?.namespace !== 'ext_kubohiroyawebusbpasori') {
    errors.push('repo-policy.json must retain the runtime API namespace');
  }
}

function checkPackageMetadata() {
  for (const key of ['description', 'author', 'license', 'homepage', 'packageManager'] as const) {
    const value = packageMetadata[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`package.json ${key} must be a non-empty string`);
    }
  }
  if (packageMetadata.license !== 'MPL-2.0') errors.push('package.json license must be MPL-2.0');
  if (packageMetadata.homepage !== 'https://kubohiroya.github.io/turbowarp-webusb-pasori/') {
    errors.push('package.json homepage must point to the Pages user guide');
  }
  if (packageMetadata.engines?.node !== '>=22.18.0') errors.push('package.json engines.node must be >=22.18.0');
  if (packageMetadata.packageManager !== 'pnpm@11.11.0') {
    errors.push('package.json packageManager must pin pnpm@11.11.0');
  }
  for (const file of ['dist/', 'CHANGELOG.md', 'README.md', 'README.ja.md', 'LICENSE']) {
    if (!packageMetadata.files?.includes(file)) errors.push(`package.json files must include ${file}`);
  }
  for (const command of ['docs:check', 'check', 'check:dist', 'prepack']) {
    if (/\bnpm run\b/u.test(packageMetadata.scripts?.[command] ?? '')) {
      errors.push(`package.json ${command} must use pnpm commands`);
    }
  }
}

function checkReadme() {
  if (!readme.startsWith(`# ${policy.productName}\n`)) {
    errors.push('README.md H1 must match repo-policy.json productName');
  }
  if (!readmeJa.startsWith(`# ${policy.productName}\n`)) {
    errors.push('README.ja.md H1 must match repo-policy.json productName');
  }
  if (!readme.includes('[日本語](README.ja.md)') || !readmeJa.includes('[English](README.md)')) {
    errors.push('README language switch links must use the common format');
  }
  const installLine = `pnpm add --save-exact ${packageMetadata.name}@${packageMetadata.version}`;
  const cdnUrl = `https://cdn.jsdelivr.net/npm/${packageMetadata.name}@${packageMetadata.version}/dist/webusb-pasori.js`;
  for (const text of [readme, readmeJa, ...pages]) {
    if (!text.includes('https://kubohiroya.github.io/turbowarp-webusb-pasori/')) {
      errors.push('README and Pages must link to the user guide');
    }
    if (!text.includes(installLine)) {
      errors.push('README and Pages install examples must match package version');
    }
    if (!text.includes(cdnUrl)) {
      errors.push('README and Pages CDN URLs must match package version');
    }
  }
  for (const required of ['secure context', 'WebUSB', 'user gesture', 'device permission']) {
    if (!readme.includes(required)) {
      errors.push(`README.md must describe WebUSB requirement: ${required}`);
    }
  }
  if (!readme.includes('SPDX-License-Identifier: MPL-2.0')) {
    errors.push('README.md License section must include the SPDX identifier');
  }
  if (!readmeJa.includes('SPDX-License-Identifier: MPL-2.0')) {
    errors.push('README.ja.md License section must include the SPDX identifier');
  }
}

function checkChangelog() {
  if (!changelog.includes(`## ${packageMetadata.version} `)) {
    errors.push('CHANGELOG.md must contain the current package version section');
  }
}

function checkLicense() {
  if (!license.startsWith('Mozilla Public License Version 2.0\n==================================')) {
    errors.push('LICENSE must contain the Mozilla Public License Version 2.0 full text');
  }
  if (!license.includes('Exhibit A - Source Code Form License Notice')) {
    errors.push('LICENSE must include the MPL-2.0 Exhibit A text');
  }
}

function checkRuntimeContracts() {
  if (!config.includes("id: 'kubohiroyawebusbpasori'")) {
    errors.push('src/config.ts must retain the WebUSB PaSoRi extension ID');
  }
  if (!config.includes("license: 'MPL-2.0'")) {
    errors.push('src/config.ts license metadata must be MPL-2.0');
  }
  if (!bundle.includes('// License: MPL-2.0')) {
    errors.push('dist/webusb-pasori.js license metadata must be MPL-2.0');
  }
  if (!bundle.includes('// ID: kubohiroyawebusbpasori')) {
    errors.push('dist/webusb-pasori.js must retain the WebUSB PaSoRi extension ID');
  }
  if (manifest.id !== 'kubohiroyawebusbpasori') {
    errors.push('dist/extension-manifest.json must retain the WebUSB PaSoRi extension ID');
  }
  for (const opcode of [
    'connectPasoriBlock',
    'waitForNfcIdmSetRuntimeVar',
    'waitForNfcIdmSetRuntimeVarAndBroadcast',
    'lastIdmReporter',
    'connectedPasoriCount'
  ]) {
    if (!blockDefinitions.includes(`"opcode": "${opcode}"`) || !bundle.includes(opcode)) {
      errors.push(`block opcode must remain available: ${opcode}`);
    }
  }
  const legacyPoseNamePattern = new RegExp(
    [['tm', 'pose'].join(''), ['TM', 'Pose'].join(''), ['TM', 'POSE'].join('')].join('|'),
    'u'
  );
  if (legacyPoseNamePattern.test([readme, readmeJa, ...pages, bundle].join('\n'))) {
    errors.push('normal docs and dist must not retain legacy pose-era naming');
  }
}

async function checkPackContents() {
  const {stdout} = await execFileAsync('npm', [
    'pack',
    '--dry-run',
    '--ignore-scripts',
    '--json'
  ]);
  const [pack] = JSON.parse(stdout) as PackResult[];
  if (!pack) {
    errors.push('npm pack must report a package');
    return;
  }
  const files = new Set(pack.files.map((file) => file.path));
  for (const file of [
    'README.md',
    'README.ja.md',
    'LICENSE',
    'CHANGELOG.md',
    policy.extension.standaloneBundle,
    policy.extension.manifest
  ]) {
    if (!files.has(file)) errors.push(`npm pack must include ${file}`);
  }
  if (pack.version !== packageMetadata.version) {
    errors.push('npm pack version must match package.json version');
  }
}
