/**
 * Babel configuration for the Fahman app
 * Configures NativeWind for Tailwind CSS support and path aliases
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@/components": "./src/components",
            "@/screens": "./src/screens",
            "@/themes": "./src/themes",
            "@/utils": "./src/utils",
            "@/hooks": "./src/hooks",
            "@/config": "./src/config",
            "@/services": "./src/services",
            "@/contexts": "./src/contexts",
          },
        },
      ],
    ],
  };
};
