const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '*.{node,dll}'
    },
    icon: './backend/assets/images/favicon.ico',
    arch: ['x64', 'ia32'], // Support both 64-bit and 32-bit
    ignore: [
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/out/,
      /^\/frontend\/node_modules/,
      /^\/frontend\/src/,
      /^\/frontend\/public/,
      /^\/frontend\/\.gitignore/,
      /^\/frontend\/eslint\.config\.js/,
      /^\/frontend\/vite\.config\.js/,
      /^\/frontend\/package/,
      /^\/report_demo/,
      /^\/\.env/
    ],
  },
  rebuildConfig: {},
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'sujithrex',
          name: 'Ecclesia-desktop'
        },
        prerelease: false,
        draft: false
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './backend/assets/images/favicon.ico',
      },
      platforms: ['win32'],
      arch: ['x64', 'ia32'], // Build both 64-bit and 32-bit installers
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
