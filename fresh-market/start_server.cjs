// Запасной запуск без Python: только встроенные модули Node.js.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const root = __dirname;
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const preferred = portIndex === -1 ? 8000 : Number(args[portIndex + 1]);
if (!Number.isInteger(preferred) || preferred < 0 || preferred > 65535) {
  console.error("Укажите порт от 0 до 65535: --port 8000");
  process.exit(1);
}
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".json": "application/json; charset=utf-8", ".ico": "image/x-icon" };
const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Outside root");
    if (!fs.statSync(file).isFile()) throw new Error("Not a file");
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Файл не найден");
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(file).on("error", () => response.destroy()).pipe(response);
});
let attempts = 0;
let port = preferred;
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && attempts++ < 10) {
    port = port > 0 && port < 65535 ? port + 1 : 0;
    server.listen(port, "127.0.0.1");
  } else {
    console.error(`Не удалось запустить сервер: ${error.message}`);
    process.exitCode = 1;
  }
});
server.on("listening", () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`Свежий Маркет: ${url}`);
  console.log(`Задачи команды: ${url}tasks.html`);
  console.log("Оставьте это окно открытым. Для остановки нажмите Ctrl+C.");
  if (!args.includes("--no-browser") && process.platform === "win32") {
    const browser = spawn("cmd.exe", ["/c", "start", "", url], { windowsHide: true, stdio: "ignore" });
    browser.on("error", () => console.log("Откройте адрес выше в браузере вручную."));
    browser.unref();
  }
});
server.listen(port, "127.0.0.1");
process.on("SIGINT", () => server.close(() => process.exit(0)));
