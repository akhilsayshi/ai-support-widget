import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for widget
  build: {
    outDir: 'dist',
    
    // Library mode for widget embedding
    lib: {
      entry: 'src/main.jsx',
      name: 'AISupportWidget',
      fileName: (format) => `widget.${format}.js`,
      formats: ['es', 'umd']
    },
    
    // Rollup options for external dependencies
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [],
      
      output: {
        // Global variables for UMD build
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        
        // Asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/widget-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Source maps for debugging
    sourcemap: false,
    
    // Target modern browsers
    target: 'es2018',
    
    // CSS code splitting
    cssCodeSplit: false,
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    cors: true,
    
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ]
    },
    
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Environment variables
  envPrefix: 'WIDGET_',
  
  // Base path for deployment
  base: process.env.NODE_ENV === 'production' ? '/widget/' : '/',
  
  // Worker configuration
  worker: {
    format: 'es'
  },
  
  // Experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `"/widget/${filename}"` }
      } else {
        return { relative: true }
      }
    }
  }
});
