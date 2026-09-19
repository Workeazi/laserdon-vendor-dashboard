import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

function supabaseProxyPlugin() {
  return {
    name: 'supabase-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/supabase-api/')) {
          const targetUrl = (process.env.VITE_SUPABASE_URL || 'https://cqcxcjadqlwajmznxnzx.supabase.co') + req.url.replace('/supabase-api', '');
          
          const headersToKeep = {};
          for (const [key, value] of Object.entries(req.headers)) {
            const k = key.toLowerCase();
            // Aggressively strip ALL browser fingerprint headers
            if (!k.startsWith('sec-') && 
                k !== 'origin' && 
                k !== 'referer' && 
                k !== 'user-agent' && 
                k !== 'host' && 
                k !== 'accept' && 
                k !== 'accept-language' && 
                k !== 'accept-encoding' && 
                k !== 'connection') {
              headersToKeep[key] = value;
            }
          }
          headersToKeep['User-Agent'] = 'node-fetch/1.0';
          
          const options = {
            method: req.method,
            headers: headersToKeep
          };

          const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          });

          req.pipe(proxyReq);
          
          proxyReq.on('error', (err) => {
            console.error('Proxy error:', err);
            res.statusCode = 500;
            res.end('Proxy Error');
          });
          
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Expose env to process.env so proxy plugin can access it
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), supabaseProxyPlugin()],
    resolve: { alias: { '@': '/src' } }
  }
})
