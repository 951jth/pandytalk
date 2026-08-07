const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const paths = {
  appConfig: path.join(projectRoot, 'app.config.js'),
  buildGradle: path.join(projectRoot, 'android', 'app', 'build.gradle'),
  strings: path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
    'strings.xml',
  ),
}

const read = filePath => fs.readFileSync(filePath, 'utf8')

const extractSingleVersion = (contents, pattern, label) => {
  const matches = [...contents.matchAll(pattern)]
  if (matches.length !== 1) {
    throw new Error(`${label} 값을 정확히 하나 찾을 수 없습니다.`)
  }
  return Number(matches[0][1])
}

const replaceSingle = (contents, pattern, replacement, label) => {
  let count = 0
  const nextContents = contents.replace(pattern, (...args) => {
    count += 1
    return typeof replacement === 'function' ? replacement(...args) : replacement
  })
  if (count !== 1) {
    throw new Error(`${label} 값을 정확히 하나 변경할 수 없습니다.`)
  }
  return nextContents
}

const appConfig = read(paths.appConfig)
const buildGradle = read(paths.buildGradle)
const strings = read(paths.strings)

const versions = {
  appConfig: extractSingleVersion(
    appConfig,
    /android:\s*\{[\s\S]*?versionCode:\s*(\d+)/g,
    'app.config.js android.versionCode',
  ),
  runtime: extractSingleVersion(
    appConfig,
    /const ANDROID_RUNTIME_VERSION = '(\d+)'/g,
    'app.config.js Android runtimeVersion',
  ),
  buildGradle: extractSingleVersion(
    buildGradle,
    /^\s*versionCode\s+(\d+)\s*$/gm,
    'android/app/build.gradle versionCode',
  ),
  nativeRuntime: extractSingleVersion(
    strings,
    /<string name="expo_runtime_version">(\d+)<\/string>/g,
    'Android expo_runtime_version',
  ),
}

const currentVersions = new Set(Object.values(versions))
if (currentVersions.size !== 1) {
  throw new Error(
    `Android 빌드 버전이 일치하지 않습니다: ${JSON.stringify(versions)}`,
  )
}

const currentVersion = versions.appConfig
const nextVersion = currentVersion + 1

if (process.argv.includes('--check')) {
  console.log(
    `Android build/runtime version 동기화 정상: ${currentVersion} (다음: ${nextVersion})`,
  )
  process.exit(0)
}

const nextAppConfig = replaceSingle(
  replaceSingle(
    appConfig,
    /const ANDROID_RUNTIME_VERSION = '\d+'/g,
    `const ANDROID_RUNTIME_VERSION = '${nextVersion}'`,
    'app.config.js Android runtimeVersion',
  ),
  /(android:\s*\{[\s\S]*?versionCode:\s*)\d+/g,
  (_match, prefix) => `${prefix}${nextVersion}`,
  'app.config.js android.versionCode',
)
const nextBuildGradle = replaceSingle(
  buildGradle,
  /^(\s*versionCode\s+)\d+(\s*)$/gm,
  (_match, prefix, suffix) => `${prefix}${nextVersion}${suffix}`,
  'android/app/build.gradle versionCode',
)
const nextStrings = replaceSingle(
  strings,
  /(<string name="expo_runtime_version">)\d+(<\/string>)/g,
  (_match, prefix, suffix) => `${prefix}${nextVersion}${suffix}`,
  'Android expo_runtime_version',
)

fs.writeFileSync(paths.appConfig, nextAppConfig, 'utf8')
fs.writeFileSync(paths.buildGradle, nextBuildGradle, 'utf8')
fs.writeFileSync(paths.strings, nextStrings, 'utf8')

console.log(`Android build/runtime version: ${currentVersion} -> ${nextVersion}`)
