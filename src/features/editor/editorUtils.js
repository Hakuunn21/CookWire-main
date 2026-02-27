/**
 * エディタ共通ユーティリティ
 */

/**
 * ファイルキーに対応するプレースホルダーテキストを返す
 * @param {'html'|'css'|'js'} fileKey
 * @returns {string}
 */
export function placeholderFor(fileKey) {
  if (fileKey === "html") return "<section>...</section>";
  if (fileKey === "css") return ".class { ... }";
  return "console.log()";
}
