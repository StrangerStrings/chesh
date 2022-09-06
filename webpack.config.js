const htmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

const src = path.resolve(__dirname, 'src')

module.exports = {
  entry: path.resolve(src,'WholePage.ts'),
  plugins: [
    new htmlWebpackPlugin({
      template: path.resolve(src, 'index.html')
    })
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        include: src,
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    ]
  }
}
