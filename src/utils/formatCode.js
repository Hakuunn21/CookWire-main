import prettier from 'prettier/standalone'
import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginEstree from 'prettier/plugins/estree'
import prettierPluginHtml from 'prettier/plugins/html'
import prettierPluginPostcss from 'prettier/plugins/postcss'

const PLUGINS = [prettierPluginBabel, prettierPluginEstree, prettierPluginHtml, prettierPluginPostcss]

const parserMap = {
  html: 'html',
  css: 'css',
  js: 'babel',
}

export const formatSource = async (type, value) => {
  const parser = parserMap[type]
  if (!parser) return value
  return prettier.format(value, {
    parser,
    plugins: PLUGINS,
    printWidth: 100,
    singleQuote: true,
    semi: false,
  })
}
