import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único index.html autocontido (para publicar como artefato).
export default defineConfig({ plugins: [viteSingleFile()] });
