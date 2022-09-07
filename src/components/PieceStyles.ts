import { css } from "lit-element";

/**
 * border-box and no padding or margin
 */
export const pieceStyles = css`
  .white {
    --secondary: #8c9abb;
    --main: #b8cdc4;
    --main: #c5dbd1;
    --main: #c3dad0;
  }
  .black {
    --secondary: #c3dad0;
    --main: #ffd7b9;
    --main: #bc6fb1;
    --main: #a0a5b1;
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


  /* bishop and horse thinktank */
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

  /* maybe this? */
  /* .horse {
    height: 90%;
    width: 54%;
    border-radius: 100px;
  }
  .bishop {
    height: 112%;
    width: 22%;
    border-radius: 100px;
    transform: rotate(45deg);
  }
  .even .bishop {
    transform: rotate(-45deg);
  } */

  /* bishop and horse thinktank */
  

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
  .isInCheck .king .secondary {
    /* animation: check0 0.4s ease-out forwards */
    height: 56%;
    width: 56%;
  }
  .wouldBeInCheck .king .secondary {
    animation: check 0.4s ease-out
  }

  @keyframes check0 {
    0% {
      height: 33%;
      width: 33%;
    }
    50% {
      height: 66%;
      width: 66%;
    }
    100% {
      height: 56%;
      width: 56%;
    }
  }
  @keyframes check1 {
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
  @keyframes check2 {
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
  .king.black .secondary {
    opacity: 0.8
  }

  .pinged .king .secondary {
    animation: check1 0.4s ease-out
  }
  .pinged.isInCheck .king .secondary {
    animation: check2 0.4s ease-out
  }
`;