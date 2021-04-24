<script lang="ts">
import { onMount, onDestroy } from "svelte";
import { informationData, showInfo, showInfoReset } from "./store/store";
import Main from "@/parts/main.svelte";
import Galaxy from "@/parts/examples/galaxy.svelte";
import Jungle from "@/parts/examples/junglebasic.svelte";
import Box from "@/parts/test/box.svelte";
import Info from "./components/info.svelte";
import Material from "./parts/test/material.svelte";
import BoxParams from "./parts/test/boxParams.svelte";
import BoxMaterial from "./parts/test/boxMaterial.svelte";
import BoxEnv from "./parts/test/boxEnv.svelte";
import BoxShadow from "./parts/test/boxShadow.svelte";
import TextOnBox from "./parts/test/textOnBox.svelte";
import Icon from "./components/icon.svelte";
import Models from "./parts/models.svelte";
import HoverBox from "./parts/test/hoverBox.svelte";
import ClickBox from "./parts/test/clickBox.svelte";
import OutlineBox from "./parts/test/outlineBox.svelte";
import MoveBox from "./parts/test/moveBox.svelte";
import CablePole from "./parts/test/cablePole.svelte";
import BoxRchange from "./parts/test/boxRchange.svelte";
import Line from "./parts/test/line.svelte";
import Bone from "./parts/test/bone.svelte";
import Scalable from "./parts/test/scalable.svelte";
import Fences from "./parts/test/fences.svelte";
import Assets from "./parts/assets.svelte";

const main = [
  { id: "main", name: "Main", component: Main },
  { id: "models", name: "Models", component: Models },
  { id: "assets", name: "Assets", component: Assets },
];

const test = [
  { id: "box", name: "Box", component: Box },
  { id: "box_renderc", name: "Box Render", component: BoxRchange },
  { id: "material", name: "Material", component: Material },
  { id: "box_params", name: "Box Params", component: BoxParams },
  { id: "box_material", name: "Box Material", component: BoxMaterial },
  { id: "box_env", name: "Box Environment", component: BoxEnv },
  { id: "box_shadow", name: "Box Shadow", component: BoxShadow },
  { id: "text_box", name: "Canvas Texture", component: TextOnBox },
  { id: "hover_box", name: "Hover Box", component: HoverBox },
  { id: "click_box", name: "Click Box", component: ClickBox },
  { id: "outline_box", name: "Outline Box", component: OutlineBox },
  { id: "move_box", name: "Move Box", component: MoveBox },
  { id: "bone", name: "Bone", component: Bone },
  { id: "line", name: "Line", component: Line },
  { id: "cable_pole", name: "Cable Pole", component: CablePole },
  { id: "scalable", name: "Scalable Model", component: Scalable },
  { id: "fences", name: "Fences", component: Fences },
];

const examples = [
  { id: "galaxy", name: "Galaxy", component: Galaxy },
  { id: "jungle_basic", name: "Jungle Basic", component: Jungle },
];

const sidePart = [
  { part: "Test", components: test, opened: false },
  { part: "Examples", components: examples, opened: false },
];

const components = [...main, ...sidePart.flatMap((val) => val.components)];

let selected = main[0].id;
let title = main[0].name;

const loc = window.location.href.split("#")[1];
if (window.location.href.split("#")[1] !== undefined) {
  const component = components.find((val) => val.id === loc);
  selected = component?.id;
  title = component?.name;
  if (!selected) {
    selected = main[0].id;
    title = main[0].name;
    history.replaceState(null, "", " ");
  }
  if (!(main.map((v) => v.id).includes(selected))) {
    sidePart.find((val) => val.components.find((component) => component.id == selected)).opened = true;
  }
}

let refSide: HTMLSpanElement;

const eventListen = (event: MouseEvent) => {
  if ((event.target as HTMLSpanElement).dataset.id !== undefined) {
    showInfo.set(false);
    showInfoReset.set({});
    selected = (event.target as HTMLSpanElement).dataset.id;
    title = (event.target as HTMLSpanElement).dataset.name;
  }
};

let sideBarOpen = true;

onMount(()=>{
  refSide.addEventListener("click", eventListen);
});

onDestroy(()=>{
  refSide.removeEventListener("click", eventListen);
});

</script>

<svelte:head>
  <title>Tuto3D - {title}</title>
</svelte:head>

<div class={`layout ${sideBarOpen ? "open": "close"}`}>
  <div class={`side ${sideBarOpen ? "": "close"}`} bind:this={refSide}>
    {#each main as m}
      <a data-id={m.id} data-name={m.name} href={`#${m.id}`} class:active={selected == m.id}>{m.name}</a>
    {/each}
    {#each sidePart as part}
      <button type="button" class="collapse" on:click={()=>part.opened = !part.opened}>
        <span>{part.part}</span>
        {#if part.opened}
          <Icon icon="arrow" className="arrow" position="down" width=18/>
        {:else}
          <Icon icon="plus" className="arrow" width=18/>
        {/if}
    </button>
      <div class="count" class:ndisplay={!part.opened}>
        {#each part.components as component}
          <a data-id={component.id} data-name={component.name} href={`#${component.id}`} class:active={selected == component.id}>{component.name}</a>
        {/each}
      </div>
    {/each}
  </div>
  <div class="top">
    <button type="button" class="click" on:click={() => sideBarOpen = !sideBarOpen}>
      {#if sideBarOpen}
        <Icon icon="arrow" className="arrow" position="left"/>
      {:else}
        <Icon icon="arrow" className="arrow"/>
      {/if}
    </button>
    <span class="txt">{title}</span>
    <button type="button" class="information" disabled={!$informationData} on:click={() => showInfo.update((v) => !v)}>Information</button>
  </div>
  <div class="main">
    <svelte:component this={components.find((component) => component.id == selected).component}/>
    <Info/>
  </div>
</div>
