import { css } from "lit";

export const axesStyles = css`
  li {
    list-style-type: none;
  }

  #wrapped-element {
    position: relative;
    display: inline-block;
    margin: 2rem;
  }

  #wrapped-element > svg {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: visible;

    line {
      shape-rendering: crispEdges;
    }
  }

  svg g {
    stroke: currentColor;

    > text {
      stroke: none;
    }
  }

  ::part(grid) {
    color: lightblue;
    opacity: 0.6;
  }

  #x-axis-g {
    transform: translateY(calc(100% - 4px));
  }
`;
