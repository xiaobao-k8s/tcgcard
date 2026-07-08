/**
 * 统一图片 URL 工具函数
 * 处理 basePath（GitHub Pages 部署时图片路径需加前缀）
 */

/** 生产环境的 basePath，与 next.config.mjs 保持一致 */
const BASE_PATH = '/tcgcard';

/**
 * 判断当前是否生产环境（浏览器端）
 * 通过检查 window.location.pathname 是否以 basePath 开头
 */
function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(BASE_PATH);
}

/**
 * 获取原始图片路径对应的完整 URL
 * 本地开发：直接返回原路径
 * 生产部署：加上 basePath 前缀
 */
export function getImageUrl(path: string): string {
  if (!path) return path;
  if (isProduction()) {
    return `${BASE_PATH}${path}`;
  }
  return path;
}

/**
 * 获取 PokeAPI 官方 artwork URL
 */
export function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}
