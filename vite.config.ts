import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Bind explicitly to IPv4 loopback to avoid occasional IPv6/localhost resolution issues on Windows.
    host: "127.0.0.1",
    // Keep Vite's default port so local "화면보기" / links stay consistent.
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    // OneDrive/네트워크 드라이브 경로에서 파일 변경 감지가 끊기는 경우가 있어 polling을 사용.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
