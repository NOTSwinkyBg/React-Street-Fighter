declare module "react-game-engine" {
  import * as React from "react";

  export interface GameEngineProps {
    systems: any[];
    entities: any;
    running?: boolean;
    onEvent?: (event: any) => void;
    style?: React.CSSProperties;
    className?: string;
  }

  export class GameEngine extends React.Component<GameEngineProps> {
    swap: (entities: any) => void;
  }
}