#!/usr/bin/env node

/**
 * Build script for My Better History Chrome Extension
 * This script prepares the extension for packaging
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const distDir = path.join(projectRoot, "out/dist");
const publicDir = path.join(projectRoot, "public");
const manifestPath = path.join(projectRoot, "manifest.json");
const backgroundPath = path.join(projectRoot, "background.js");
const releaseDir = path.join(projectRoot, "out/release");

console.log("Building My Better History extension...");

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

async function createZip() {
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  const version = getExtensionVersion();
  const zipPath = path.join(releaseDir, `my-better-history-v${version}.zip`);

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
    execSync("npm run build", { cwd: projectRoot, stdio: "inherit" });

    if (fs.existsSync(manifestPath)) {
      fs.copyFileSync(manifestPath, path.join(distDir, "manifest.json"));
      console.log("Manifest file copied to out/dist/");
    } else {
      console.warn("Warning: manifest.json not found in project root");
    }

    const faviconPath = path.join(projectRoot, "favicon.ico");
    if (fs.existsSync(faviconPath)) {
      fs.copyFileSync(faviconPath, path.join(distDir, "favicon.ico"));
      console.log("Favicon copied to out/dist/");
    }

    if (fs.existsSync(backgroundPath)) {
      fs.copyFileSync(backgroundPath, path.join(distDir, "background.js"));
      console.log("Background script copied to out/dist/");
    } else {
      console.warn("Warning: background.js not found in project root");
    }

    copyPublicFiles(publicDir, distDir);
    console.log("Public files copied to out/dist/");

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
      console.log("Locales directory renamed to _locales for Chrome extension");
    }

    console.log("\nCreating release package...");
    await createZip();

    console.log("\nBuild completed successfully!");
    console.log("\nTo load the extension in Chrome:");
    console.log("1. Open Chrome and navigate to chrome://extensions");
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select the "out/dist" folder in this project');
    console.log("\nTo upload to Chrome Web Store:");
    console.log("Use the ZIP file in the out/release/ folder");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildExtension();
