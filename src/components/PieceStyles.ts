import { css } from "lit-element";

/**
 * Styles for the different chess pieces
 */
export const pieceStyles = css`
  .white {
    --secondary: #8c9abb;
    --main: #c3dad0;
  }
  .black {
    --secondary: #c3dad0;
    --main: #8c9abb;
  }
  .piece {
    background: var(--main);
    border-radius: 50%;
  }
  
  .pawn {
    height: 55%;
    width: 55%;
  }
  .castle {
    height: 77%;
    width: 77%;
    border-radius: 8%;
  }
  .horse {
    height: 48%;
    width: 92%;
    border-radius: 100px;
  }
  .bishop {
    height: 101%;
    width: 21%;
    border-radius: 100px;
  }
  .queen {
    height: 100%;
    width: 100%;
  }
  .king {
    height:80%;
    width: 80%;
  }

  .king .secondary {
    height: 33%;
    width: 33%;
    border-radius: 50%;
    background: var(--secondary);
    opacity: 0.6;
    transition: all 0.3s ease-in
  }
  .king.black .secondary {
    opacity: 0.8
  }
  .isInCheck .king .secondary {
    height: 56%;
    width: 56%;
  }

  .pinged .king .secondary {
    animation: ping1 0.4s ease-out
  }
  .pinged.isInCheck .king .secondary {
    animation: ping2 0.4s ease-out
  }
  /* can't move there cause you'd be in check */
  @keyframes ping1 {
    0% {
      height: 33%;
      width: 33%;
    }
    50% {
      height: 66%;
      width: 66%;
    }
    100% {
      height: 33%;
      width: 33%;
    }
  }
  /* can't move there cause you'd be in check, and you're already in check */
  @keyframes ping2 {
    0% {
      height: 56%;
      width: 56%;
    }
    50% {
      height: 26%;
      width: 26%;
    }
    100% {
      height: 56%;
      width: 56%;
    }
  }
`;