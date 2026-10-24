import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base ต้องตรงกับชื่อ GitHub repo เพื่อให้ Deploy บน GitHub Pages ได้
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/order-app/' : '/',
}))
