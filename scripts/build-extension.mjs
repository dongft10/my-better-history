#!/usr/bin/env node

/**
 * Build script for My Better History extension (Chrome / Edge)
 *
 * Usage:
 *   node scripts/build-extension.mjs                # Chrome 包 → output/
 *   node scripts/build-extension.mjs --edge         # Edge 包   → edge/
 *   node scripts/build-extension.mjs --out <dir>    # 自定义输出目录
 *
 * 平台差异可通过 applyPlatformTweaks() 扩展（目前 manifest 双平台通用）。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// ---- 参数解析 ----
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(name);

const edgeMode = hasFlag("--edge");
// 两种模式共用同一个输出目录（output/），仅 ZIP 文件名按平台区分
const outDirName = getArg("--out", "output");
const zipSuffix = edgeMode ? "edge" : "";

const outputDir = path.join(projectRoot, outDirName);
const distDir = path.join(outputDir, "dist");
const publicDir = path.join(projectRoot, "public");
const manifestPath = path.join(projectRoot, "manifest.json");
const backgroundPath = path.join(projectRoot, "background.js");
const releaseDir = path.join(outputDir, "release");

console.log(
  `Building My Better History extension for ${edgeMode ? "Edge Add-ons" : "Chrome Web Store"}...`,
);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function copyPublicFiles(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Warning: Source directory does not exist: ${src}`);
    return;
  }

  const items = fs.readdirSync(src);

  for (let item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyPublicFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getExtensionVersion() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return manifest.version;
}

/**
 * 平台级 manifest 微调（目前双平台通用，无差异；未来 Edge 有特殊要求在此处理）
 * @param {object} manifest 解析后的 manifest 对象
 * @param {boolean} isEdge 是否 Edge 模式
 */
function applyPlatformTweaks(manifest, isEdge) {
  if (isEdge) {
    // 预留：Edge 特有的 manifest 调整写在这里（如未来需要）
    // 例：manifest.description = "..."; manifest.minimum_chrome_version = "...";
  }
  return manifest;
}

async function createZip() {
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  const version = getExtensionVersion();
  const zipName = `my-better-history-${zipSuffix ? zipSuffix + "-" : ""}v${version}.zip`;
  const zipPath = path.join(releaseDir, zipName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(
        `ZIP created: ${zipPath} (${(archive.pointer() / 1024).toFixed(2)} KB)`,
      );
      resolve(zipPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

async function buildExtension() {
  try {
    console.log("Running Vite build...");
    // 两种模式均输出到 output/dist（vite.config.js 已配置）
    execSync("npm run build", { cwd: projectRoot, stdio: "inherit" });

    // 读取并写入平台微调后的 manifest
    const manifest = applyPlatformTweaks(
      JSON.parse(fs.readFileSync(manifestPath, "utf8")),
      edgeMode,
    );

    if (manifest) {
      fs.writeFileSync(
        path.join(distDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      );
      console.log("Manifest file copied to dist/");
    } else {
      console.warn("Warning: manifest.json not found in project root");
    }

    const faviconPath = path.join(projectRoot, "favicon.ico");
    if (fs.existsSync(faviconPath)) {
      fs.copyFileSync(faviconPath, path.join(distDir, "favicon.ico"));
      console.log("Favicon copied to dist/");
    } else {
      console.warn("Warning: favicon.ico not found in project root");
    }

    if (fs.existsSync(backgroundPath)) {
      fs.copyFileSync(backgroundPath, path.join(distDir, "background.js"));
      console.log("Background script copied to dist/");
    } else {
      console.warn("Warning: background.js not found in project root");
    }

    copyPublicFiles(publicDir, distDir);
    console.log("Public files copied to dist/");

    const publicDistDir = path.join(distDir, "public");
    if (fs.existsSync(publicDistDir)) {
      const files = fs.readdirSync(publicDistDir);
      for (const file of files) {
        if (path.extname(file) === ".html") {
          const srcPath = path.join(publicDistDir, file);
          const destPath = path.join(distDir, file);

          if (!fs.existsSync(destPath)) {
            fs.renameSync(srcPath, destPath);
            console.log(`Moved ${file} to root dist directory`);
          } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Updated ${file} in root dist directory`);
            fs.unlinkSync(srcPath);
          }
        }
      }

      const remainingFiles = fs.readdirSync(publicDistDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(publicDistDir);
        console.log("Removed empty public subdirectory");
      }
    }

    const localesDir = path.join(distDir, "locales");
    const underscoreLocalesDir = path.join(distDir, "_locales");

    if (fs.existsSync(localesDir)) {
      if (fs.existsSync(underscoreLocalesDir)) {
        fs.rmSync(underscoreLocalesDir, { recursive: true, force: true });
      }

      fs.renameSync(localesDir, underscoreLocalesDir);
      console.log("Locales directory renamed to _locales for extension");
    }

    console.log("\nCreating release package...");
    await createZip();

    console.log("\nBuild completed successfully!");
    console.log(
      `\nTo load the extension in the browser: select the "${outDirName}/dist" folder`,
    );
    console.log(
      `\nTo upload to ${edgeMode ? "Edge Add-ons" : "Chrome Web Store"}:`,
    );
    console.log(`Use the ZIP file in the ${outDirName}/release/ folder`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildExtension();
