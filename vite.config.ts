import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

function disableHmrClientWhenHmrFalse(): Plugin {
  let hmrDisabled = false;
  return {
    name: 'disable-hmr-client-when-hmr-false',
    apply: 'serve',
    configResolved(config) {
      hmrDisabled = config.server.hmr === false;
    },
    transform(code, id) {
      if (!hmrDisabled) return;
      const normalizedId = id.replace(/\\/g, '/');
      if (normalizedId.endsWith('/vite/dist/client/client.mjs')) {
        return code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR disabled: WebSocket connection skipped */'
        );
      }
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), disableHmrClientWhenHmrFalse()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
