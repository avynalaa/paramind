const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = (env, options) => {
  const isDev = options.mode === "development";
  
  return {
    devtool: isDev ? "eval-source-map" : "source-map",
    entry: {
      taskpane: "./src/taskpane/taskpane.tsx",
      commands: "./src/commands/commands.ts"
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  "@babel/preset-env",
                  "@babel/preset-react",
                  "@babel/preset-typescript"
                ]
              }
            }
          ]
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico|svg)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext]"
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/taskpane/taskpane.html",
        filename: "taskpane.html",
        chunks: ["taskpane"]
      }),
      new HtmlWebpackPlugin({
        template: "./src/commands/commands.html",
        filename: "commands.html",
        chunks: ["commands"]
      })
    ],
    devServer: {
      port: 3000,
      https: true,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      static: {
        directory: path.join(__dirname, "dist")
      }
    }
  };
}; 