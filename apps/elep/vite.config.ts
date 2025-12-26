import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  base: './', // 避免打包后路径错误。缺少会导致electron找不到资源。不添加生成的路径为‘/xxx’
  build: {
    outDir: './pages',
    assetsDir: './assets',
  },
  plugins: [vue(), vueDevTools()],
})
