<script lang="ts">
/* eslint-disable no-unused-vars */
// Based on https://iconmonstr.com/

enum IconTypes {
  plus = "M24 9h-9v-9h-6v9h-9v6h9v9h6v-9h9z",
  arrow = "M8.122 24l-4.122-4 8-8-8-8 4.122-4 11.878 12z",
  close = "M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z",
}
type IconTypesString = keyof typeof IconTypes;

type PosTypes = "left" | "down" | "up" | undefined;

export let icon: IconTypesString;

export let height = "24";
export let width = "24";

export let className: string = undefined;
export let position: PosTypes = undefined;

const totalClass = [className, position].join(" ");

</script>

<svg xmlns="http://www.w3.org/2000/svg"
  class={totalClass ? totalClass : undefined}
  width="{width}"
  height="{height}"
  viewBox="0 0 24 24">
    <path d={IconTypes[icon]}/>
</svg>

<style lang="scss">
  .left {
    transform: rotate(180deg);
  }

  .down {
    transform: rotate(90deg);
  }

  .up {
    transform: rotate(-90deg);
  }
</style>
