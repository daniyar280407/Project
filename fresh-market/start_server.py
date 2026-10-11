"""Запускает магазин через локальный HTTP-сервер без дополнительных пакетов."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
import sys
import webbrowser


STORE_DIRECTORY = Path(__file__).resolve().parent


class StoreHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = False

    def server_bind(self):
        # В Windows нельзя делить порт со старым сервером: он отдаст другой сайт.
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class StoreRequestHandler(SimpleHTTPRequestHandler):
    # Тип JavaScript должен быть правильным даже при других настройках Windows.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def create_server(preferred_port):
    handler = partial(StoreRequestHandler, directory=str(STORE_DIRECTORY))
    # Занятый порт не мешает запуску: пробуем соседние, затем любой свободный.
    ports = [0] if preferred_port == 0 else [
        *range(preferred_port, min(preferred_port + 10, 65535) + 1), 0
    ]
    for port in ports:
        try:
            return StoreHTTPServer(("127.0.0.1", port), handler)
        except OSError:
            if port == 0:
                raise


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="Локальный запуск Свежего Маркета")
    parser.add_argument("--port", type=int, default=8000, help="Предпочитаемый порт")
    parser.add_argument("--no-browser", action="store_true", help="Не открывать браузер")
    options = parser.parse_args()
    if not 0 <= options.port <= 65535:
        parser.error("Порт должен быть числом от 0 до 65535.")

    try:
        with create_server(options.port) as server:
            url = f"http://127.0.0.1:{server.server_address[1]}/"
            print(f"Свежий Маркет: {url}", flush=True)
            print("Не закрывайте это окно, пока пользуетесь сайтом.", flush=True)
            print("Чтобы остановить сервер, нажмите Ctrl+C.", flush=True)

            if not options.no_browser:
                try:
                    if not webbrowser.open(url):
                        print("Откройте адрес выше в браузере вручную.", flush=True)
                except (webbrowser.Error, OSError):
                    print("Откройте адрес выше в браузере вручную.", flush=True)

            try:
                server.serve_forever()
            except KeyboardInterrupt:
                print("\nСервер остановлен.", flush=True)
    except OSError as error:
        print(f"Не удалось запустить локальный сервер: {error}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
