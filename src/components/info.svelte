<script lang="ts">
import { moveElement, shrinkElement } from "@/helper/drag";
import { informationData, showInfo, showInfoReset } from "@/store/store";
import { converter } from "@/helper/md";
import { afterUpdate, onMount } from "svelte";
import { hljs } from "@/helper/md";
import Icon from "./icon.svelte";

let mounted = false;

let top: HTMLElement;
let info: HTMLElement;
let lined: HTMLElement;
let liney: HTMLElement;
let linex: HTMLElement;

let html: string;

const check = () => {
  info.querySelectorAll("pre code").forEach((block: HTMLElement) => {
    (hljs as any).highlightElement(block);
  });
};

$: {
  html = converter.makeHtml($informationData);
}

$: if (mounted && $showInfoReset != undefined) {
  info.style.top = null;
  info.style.left = null;
  info.style.height = null;
  info.style.width = null;
}

afterUpdate(() => {
  if (mounted) {
    check();
  }
});

onMount(() => {
  moveElement(info, top, document.getElementsByClassName("main")[0] as HTMLElement);
  shrinkElement(info, lined, false);
  shrinkElement(info, liney, true);
  shrinkElement(info, linex, undefined);
  mounted = true;
});

</script>

<div class:ndisplay={!$showInfo} class="info" bind:this={info}>
  <div class="frame">
    <div class="top" bind:this={top}></div>
    <div class="title">
      <span class="triangle"/>
      <button type="button" on:click|stopPropagation={()=>showInfo.set(false)}>
        <Icon className="close-button" icon="close"/>
      </button>
    </div>
    <span class="line-base lined" bind:this={lined}/>
    <span class="line-base liney" bind:this={liney}/>
    <span class="line-base linex" bind:this={linex}/>
  </div>
  <div class="content">
    {@html html}
  </div>
</div>
