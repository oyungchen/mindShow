// 主题配置 - 15套主题（5套暗色系 + 5套亮色系 + 5套彩色系）
import deep from './deep';
import mediumDark from './mediumDark';
import medium from './medium';
import light from './light';
import lightest from './lightest';
import bright from './bright';
import bright2 from './bright2';
import bright3 from './bright3';
import bright4 from './bright4';
import bright5 from './bright5';
import sunset from './sunset';
import ocean from './ocean';
import forest from './forest';
import berry from './berry';
import sakura from './sakura';

// 主题列表（暗色系 + 亮色系 + 彩色系）
export const themes = [
  deep,
  mediumDark,
  medium,
  light,
  lightest,
  bright,
  bright2,
  bright3,
  bright4,
  bright5,
  sunset,
  ocean,
  forest,
  berry,
  sakura,
];

// 主题Map，方便通过key查找
export const themeMap: Record<string, typeof deep> = {
  deep,
  mediumDark,
  medium,
  light,
  lightest,
  bright,
  bright2,
  bright3,
  bright4,
  bright5,
  sunset,
  ocean,
  forest,
  berry,
  sakura,
};

// 主题按钮列表（深色系删除前三个：deep, mediumDark, medium）
export const themeList = themes.slice(3).map(theme => ({
  key: theme.key,
  name: theme.name,
  color: theme.colors[0].bg,
}));

// 计算颜色亮度 (0-255)
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 获取文字颜色（根据背景色亮度）
export function getTextColor(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 150 ? '#1A202C' : '#FFFFFF';
}

// 导出单个主题
export { default as deep } from './deep';
export { default as mediumDark } from './mediumDark';
export { default as medium } from './medium';
export { default as light } from './light';
export { default as lightest } from './lightest';
export { default as bright } from './bright';
export { default as bright2 } from './bright2';
export { default as bright3 } from './bright3';
export { default as bright4 } from './bright4';
export { default as bright5 } from './bright5';
export { default as sunset } from './sunset';
export { default as ocean } from './ocean';
export { default as forest } from './forest';
export { default as berry } from './berry';
export { default as sakura } from './sakura';
