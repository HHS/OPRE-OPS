// const path = require('path');

// const configType = 'DEVELOPMENT';

// const webpackConfig = (config) => {
//   config.module.rules.push({
//     "test": '/\.(sa|sc|c)ss$/',
//     "exclude": '/\.module\.(sa|sc|c)ss$/i',
//     "use": ['style-loader', 'css-loader', {
//       "loader": "sass-loader",
//       "options": {
//         "sourceMap": true,
//         "sassOptions": {
//           "includePaths": [
//             "./node_modules/@uswds",
//             "./node_modules/@uswds/uswds/packages",
//           ],
//         },
//       },
//     },],
//     "include": path.resolve(__dirname, '../'),
//   });

//   config.module.rules.push({
//     "test": '/\.module\.(sa|sc|c)ss$/i',
//     "include": path.resolve(__dirname, '../src'),
//     "use": [
//       'style-loader',
//       {
//         "loader": 'css-loader',
//         "options": {
//           "modules": {
//             "localIdentName": '[path][name]__[local]--[hash:base64:5]',
//           },
//         },
//       },
//       "sass-loader",
//     ],
//   });

//   // const fileLoaderRule = config.module.rules.find(
//   //   (rule) => rule.test && rule.test.test('.svg')
//   // );
//   // fileLoaderRule.exclude = /\.svg$/;

//   config.module.rules.push({
//     "test": '/\.svg$/',
//     "oneOf": [
//       {
//         "issuer": '/\.[jt]sx?$/',
//         "resourceQuery": '/svgr/',
//         "use": [
//           {
//             "loader": '@svgr/webpack',
//             "options": {
//               "icon": true,
//             },
//           },
//         ],
//       },
//       {
//         "type": 'asset',
//       },
//     ],
//   });

//   // Return the altered config
//   return config;
// };
// // Export a function. Accept the base config as the only param.
// module.exports = {
//   "staticDirs": ['../public', { from: '../uswds', to: '/assets' }],
//   "stories": [
//         "../src/**/*.stories.mdx",
//         "../src/**/*.stories.@(js|jsx|ts|tsx)"
//       ],
//   "addons": [
//     "@storybook/addon-links",
//     "@storybook/addon-essentials",
//     "@storybook/addon-interactions",
//     "@storybook/preset-create-react-app",
//     "@storybook/addon-a11y"
//   ],
//   "framework": "@storybook/react",
//   "core": {
//     "builder": "@storybook/builder-webpack5"
//   },
//   webpackFinal: async (config, { configType }) => {
//     return webpackConfig(config)
//   },
// };

module.exports = {
  "staticDirs": ['../public', { from: '../src/uswds', to: '/assets' }],
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app"
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-webpack5"
  }
};
