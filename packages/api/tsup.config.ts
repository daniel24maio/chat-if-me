import { defineConfig } from "tsup";

/**
 * Configuração do tsup (bundler TypeScript).
 * - entry: ponto de entrada da aplicação
 * - format: gera módulo ESM (compatível com "type": "module" no package.json)
 * - onSuccess: executa o servidor automaticamente após cada build
 */
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
  onSuccess: "node dist/server.js",
});
