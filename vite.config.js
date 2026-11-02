import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/apice/',plugins:[react()],build:{sourcemap:false}});
