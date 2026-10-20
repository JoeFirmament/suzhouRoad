/** Project-authored garden-note lines, never an attributed historical quotation. */
export const LIUYUAN_TEXT_VARIANT = {
  knowledgeId: 'liuyuan-garden-note-variant',
  academy: '隔窗看山，移步景同。',
  copyist: '隔窗看山，移步景异。',
  sourceLabel: '自拟园记 · 游戏故事',
} as const;
export const readLiuyuanVariant = () =>
  `他正在抄的那一行是“${LIUYUAN_TEXT_VARIANT.copyist}”你记得府学那本写的是“景同”。同与异，只差一个字；哪本先错了，现在还不能断定。`;
