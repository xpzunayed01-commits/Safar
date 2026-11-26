import fs from 'fs';
import path from 'path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const appDir = path.join(androidDir, 'app');
const resDir = path.join(appDir, 'src', 'main', 'res');

if (!fs.existsSync(appDir)) {
  console.error('Android directory not found. Run `npx cap add android` first.');
  process.exit(1);
}

// 1. Patch android/app/build.gradle to sign release builds so Safar.apk installs cleanly on Android devices
const appGradlePath = path.join(appDir, 'build.gradle');
if (fs.existsSync(appGradlePath)) {
  let gradle = fs.readFileSync(appGradlePath, 'utf8');
  if (!gradle.includes('signingConfig signingConfigs.debug')) {
    gradle = gradle.replace(
      /(buildTypes\s*\{\s*release\s*\{)/,
      '$1\n            signingConfig signingConfigs.debug'
    );
    fs.writeFileSync(appGradlePath, gradle, 'utf8');
    console.log('✓ Patched build.gradle with release signingConfig');
  }
}

// 2. Patch AndroidManifest.xml with full native permissions, cleartext support, and keyboard adjustResize
const manifestPath = path.join(appDir, 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace(
      '<application',
      '<application\n        android:usesCleartextTraffic="true"'
    );
  }

  if (!manifest.includes('android:windowSoftInputMode')) {
    manifest = manifest.replace(
      '<activity',
      '<activity\n            android:windowSoftInputMode="adjustResize"'
    );
  }

  const requiredPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.WAKE_LOCK',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
  ];

  const missingPerms = requiredPermissions.filter((perm) => !manifest.includes(perm));
  if (missingPerms.length > 0) {
    const permTags = missingPerms
      .map((perm) => `    <uses-permission android:name="${perm}" />`)
      .join('\n');
    manifest = manifest.replace('</manifest>', `${permTags}\n</manifest>`);
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✓ Patched AndroidManifest.xml with native permissions');
}

// 3. Patch MainActivity.java for native WebView media autoplay (Adhan/Quran) & crisp native behavior
const mainActivityPath = path.join(
  appDir,
  'src',
  'main',
  'java',
  'com',
  'safar',
  'islamic',
  'MainActivity.java'
);
if (fs.existsSync(path.dirname(mainActivityPath))) {
  const mainActivityCode = `package com.safar.islamic;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setGeolocationEnabled(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}
`;
  fs.writeFileSync(mainActivityPath, mainActivityCode, 'utf8');
  console.log('✓ Updated MainActivity.java for native WebView audio/storage/geolocation');
}

// 4. Patch styles.xml & ic_launcher_background.xml for Safar Emerald full-screen theme
const stylesPath = path.join(resDir, 'values', 'styles.xml');
if (fs.existsSync(stylesPath)) {
  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#084B32</item>
        <item name="colorPrimaryDark">#063825</item>
        <item name="colorAccent">#D9F275</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:statusBarColor">#084B32</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="android:statusBarColor">#084B32</item>
    </style>
</resources>
`;
  fs.writeFileSync(stylesPath, stylesXml, 'utf8');
  console.log('✓ Updated styles.xml with Safar native status bar & theme');
}

const launcherBgPath = path.join(resDir, 'values', 'ic_launcher_background.xml');
if (fs.existsSync(launcherBgPath)) {
  fs.writeFileSync(
    launcherBgPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`,
    'utf8'
  );
}

// 5. Copy Safar app icons & splash images across all Android mipmap & drawable folders
const icon512 = path.join(root, 'public', 'pwa-512x512.png');
const icon192 = path.join(root, 'public', 'pwa-192x192.png');
const iconMaskable = path.join(root, 'public', 'pwa-maskable-512x512.png');
const iconAlt = path.join(
  root,
  'public',
  'assets',
  'aistudio',
  'Untitled_Design__1__fe83ded9.png'
);

const fgSource = fs.existsSync(iconMaskable)
  ? iconMaskable
  : fs.existsSync(iconAlt)
  ? iconAlt
  : icon512;
const launcherSourceLarge = fs.existsSync(iconAlt)
  ? iconAlt
  : fs.existsSync(icon512)
  ? icon512
  : icon192;
const launcherSourceSmall = fs.existsSync(icon192) ? icon192 : launcherSourceLarge;

if (fs.existsSync(resDir) && fs.existsSync(fgSource)) {
  const entries = fs.readdirSync(resDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(resDir, entry.name);

    if (entry.name.startsWith('mipmap-')) {
      const isSmall = entry.name.includes('mdpi') || entry.name.includes('hdpi');
      const launcherSrc = isSmall ? launcherSourceSmall : launcherSourceLarge;
      if (fs.existsSync(path.join(dirPath, 'ic_launcher.png'))) {
        fs.copyFileSync(launcherSrc, path.join(dirPath, 'ic_launcher.png'));
      }
      if (fs.existsSync(path.join(dirPath, 'ic_launcher_round.png'))) {
        fs.copyFileSync(fgSource, path.join(dirPath, 'ic_launcher_round.png'));
      }
      if (fs.existsSync(path.join(dirPath, 'ic_launcher_foreground.png'))) {
        fs.copyFileSync(fgSource, path.join(dirPath, 'ic_launcher_foreground.png'));
      }
    }

    if (entry.name.startsWith('drawable')) {
      const splashFile = path.join(dirPath, 'splash.png');
      if (fs.existsSync(splashFile)) {
        fs.copyFileSync(fgSource, splashFile);
      }
    }
  }
  console.log('✓ Replaced Android launcher icons & splash images with Safar branding');
}
