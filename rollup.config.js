import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";

module.exports = {
  input: "src/Pather.js",
  output: [
    {
      file: "dist/leaflet-pather.cjs.js",
      format: "cjs",
      // sourcemap: 'inline',
      exports: "named",
      external: ["leaflet"]
    }
  ],
  plugins: [
    resolve(),
    commonjs({}),
    babel({
      exclude: "node_modules/**"
    })
  ]
};
