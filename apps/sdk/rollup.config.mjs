import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/streamkit.esm.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [typescript({ tsconfig: "./tsconfig.json", declaration: false }), terser()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/streamkit.umd.js",
      format: "iife",
      name: "StreamKit",
      sourcemap: true,
      exports: "named",
    },
    plugins: [typescript({ tsconfig: "./tsconfig.json", declaration: false }), terser()],
  },
];
