declare module '@3d-dice/dice-box' {
  export interface DiceBoxConfig {
    assetPath: string;
    container?: string;
    id?: string;
    offscreen?: boolean;
    scale?: number;
    theme?: string;
    themeColor?: string;
  }

  export interface DiceBoxRollDie {
    rollId: string;
    value: number;
    sides: number | string;
    die?: number | string;
  }

  export interface DiceBoxRollGroup {
    qty: number;
    value: number;
    rolls: DiceBoxRollDie[];
  }

  export default class DiceBox {
    constructor(config: DiceBoxConfig);
    clear(): this;
    hide(className?: string): this;
    init(): Promise<this>;
    roll(notation: string | readonly string[]): Promise<DiceBoxRollGroup[]>;
    show(): this;
  }
}
