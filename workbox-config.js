module.exports = {
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}'
  ],
  swDest: 'build/sw.js',
  runtimeCaching: [{
    urlPattern: /\.(?:png|jpg|jpeg|svg|ico)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }
  }, {
    urlPattern: /\.(?:js|css)$/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-resources'
    }
  }, {
    urlPattern: /^https:\/\/fonts\.googleapis\.com/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-stylesheets'
    }
  }, {
    urlPattern: /^https:\/\/fonts\.gstatic\.com/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: {
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30
      }
    }
  }]
}
