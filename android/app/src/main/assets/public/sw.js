/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-d488705a'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "8444c40b2ea64562dfc33e3e01188210"
  }, {
    "url": "pwa-512x512.png",
    "revision": "50973d28d943d1d3233c1f96f8f2d680"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5dbd9e7696b4b7b05465b4f62014bae5"
  }, {
    "url": "index.html",
    "revision": "02c0cf307d17ea66725535b2d5c52001"
  }, {
    "url": "icon.svg",
    "revision": "c1455be1e3fa6530e91231a24e022b0b"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "bc75783e86884b77aeb920eb41e46971"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-u-H0LInY.css",
    "revision": null
  }, {
    "url": "assets/index-CqwtL2MT.js",
    "revision": null
  }, {
    "url": "assets/aistudio/imgupscaler-enhanced__1_-Photoroom_04a70808.png",
    "revision": null
  }, {
    "url": "assets/aistudio/download_c44308e1.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Untitled_Design__1__fe83ded9.png",
    "revision": null
  }, {
    "url": "assets/aistudio/SAFAR_Geometric_Travel_Logo_Board__1_-Photoroom_c44308e1.png",
    "revision": null
  }, {
    "url": "assets/aistudio/6f7fdfc9-b075-47cb-82d6-43431092bd3b_c44308e1.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "bc75783e86884b77aeb920eb41e46971"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5dbd9e7696b4b7b05465b4f62014bae5"
  }, {
    "url": "pwa-512x512.png",
    "revision": "50973d28d943d1d3233c1f96f8f2d680"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8444c40b2ea64562dfc33e3e01188210"
  }, {
    "url": "assets/aistudio/6f7fdfc9-b075-47cb-82d6-43431092bd3b_c44308e1.png",
    "revision": "6977664cf5b3d8c891cdc4d4f31f0bca"
  }, {
    "url": "assets/aistudio/imgupscaler-enhanced__1_-Photoroom_04a70808.png",
    "revision": "7989d68585fa3e8765c50623dcc4572d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ed096be81b9d5d07ff34c863bf8e19"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(/^https:\/\/api\.aladhan\.com\/.*/i, new workbox.NetworkFirst({
    "cacheName": "aladhan-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 259200
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/api\.alquran\.cloud\/.*/i, new workbox.CacheFirst({
    "cacheName": "alquran-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 120,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');

}));
