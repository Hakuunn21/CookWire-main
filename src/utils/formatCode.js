const parserMap = {
  html: "html",
  css: "css",
  js: "babel",
};

// Prettier は使用時に動的インポートして初期バンドルサイズを削減する
export const formatSource = async (type, value) => {
  const parser = parserMap[type];
  if (!parser) return value;

  const [prettier, babel, estree, html, postcss] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
  ]);

  return prettier.default.format(value, {
    parser,
    plugins: [babel.default, estree.default, html.default, postcss.default],
    printWidth: 100,
    singleQuote: true,
    semi: false,
  });
};
