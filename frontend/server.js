const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = 3000;

// API代理配置
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost:5000/api',
    changeOrigin: true,
    pathRewrite: {'^/api' : ''}
  })
);

// 静态文件托管
app.use(express.static(__dirname));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));

app.listen(port, () => {
  console.log(`Frontend server running at http://localhost:${port}`);
});