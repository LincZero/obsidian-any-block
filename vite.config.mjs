import path from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import autoPreprocess from 'svelte-preprocess';
import builtins from 'builtin-modules';

let prod = false;

export default defineConfig(({mode}) => {
    if (mode === 'production') {
        prod = true;
    }
    if (mode === 'development') {
        prod = false;
    }
    return {
        plugins: [
            svelte({
                preprocess: autoPreprocess()
            })
        ],
        watch: !prod,
        build: {
            sourcemap: prod ? false : 'inline',
            minify: prod,
            // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
            commonjsOptions: {
                ignoreTryCatch: false,
            },
            lib: {
                entry: path.resolve(__dirname, './src/main.ts'),
                formats: ['cjs'],
            },
            css: {},
            rollupOptions: {
                output: {
                    // Overwrite default Vite output fileName
                    entryFileNames: 'main.js',
                    assetFileNames: 'styles.css',
                },
                external: ['obsidian',
                    'electron',
                    "codemirror",
                    "@codemirror/autocomplete",
                    "@codemirror/closebrackets",
                    "@codemirror/collab",
                    "@codemirror/commands",
                    "@codemirror/comment",
                    "@codemirror/fold",
                    "@codemirror/gutter",
                    "@codemirror/highlight",
                    "@codemirror/history",
                    "@codemirror/language",
                    "@codemirror/lint",
                    "@codemirror/matchbrackets",
                    "@codemirror/panel",
                    "@codemirror/rangeset",
                    "@codemirror/rectangular-selection",
                    "@codemirror/search",
                    "@codemirror/state",
                    "@codemirror/stream-parser",
                    "@codemirror/text",
                    "@codemirror/tooltip",
                    "@codemirror/view",
                    "@lezer/common",
                    "@lezer/lr",
                    "@lezer/highlight",
                    ...builtins,
                ],
            },
            // Use root as the output dir
            emptyOutDir: false,
            outDir: '.',
        },
    }
});
