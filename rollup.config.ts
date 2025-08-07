import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import externals from "rollup-plugin-node-externals";

export default [
  {
    input: "lib/index.ts",
    output: [
      {
        file: "./build/index.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
    ],
    watch: {
      include: "lib/**",
    },
    plugins: [externals(), typescript(), resolve(), commonjs()],
  },
];
