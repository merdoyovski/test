export enum EnumActionType {
  NONE = 0,
  CUSTOM = 1,
  TRANSFER = 2,
  JUPITER = 3,
  METEORA = 4,
}

export const actionTypeMap: Record<string, EnumActionType> = {
  customNode: EnumActionType.CUSTOM,
  transferNode: EnumActionType.TRANSFER,
  jupiterNode: EnumActionType.JUPITER,
  meteoraNode: EnumActionType.METEORA,
};
