<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { fade } from "svelte/transition";

import { informationData } from "@/store/store";
import Icon from "@/components/icon.svelte";
import { hljs, stringToHTML, converter } from "@/helper/md";

// Give infromation
informationData.set("");

const context = [
  `
# 3D for Projects

Examples shows 3d view on web.

This materials help us to test and check some benchmarks on usage technics.  
Most of materials are use **ThreeJS** and I will keep update this site.

We are thinking to add 3D objects and show all of them in here so you can download and use in your project as well. Check models section.

You can also add a material about any subject to show us your problem and solution, like auto generation text or new better models.

For any question you can ask me. [Eray Ates](https://discord.gg/mdcse7FQsm)

---

Resources:
- https://threejs-journey.xyz/
- https://threejs.org/docs/
- https://threejsfundamentals.org/
- https://polygonrunway.com/
- [PolyGonRunway Youtube](https://www.youtube.com/channel/UCGSJevmBuDyxjLLOBNaYMGA)

Assets for Texture:
- https://3dtextures.me/
- https://texturehaven.com/
`,
  `
# Performance notes of threejs

- \`renderer.render(scene, camera)\` should run on just changes needed not in every frame!
- Use \`renderer.setAnimationLoop\` function to call function on each frame, better than \`window.requestAnimationFrame\`
- For pivot changes do it in model program (blender) and if you want to change threejs objects use

    \`\`\`js
    // Set geometry and pivot points
    const plane = new THREE.PlaneGeometry(1, 1);
    plane.applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, 0));
    \`\`\`

- Don't use too much bone modifier. Limited max 4 vertex group per vertex.
- Combine some parts for faster drawing.
- Use dublicate linked objects.

`,
];

const contextDom = context.map((text) => {
  const converted = stringToHTML(converter.makeHtml(text));
  converted.querySelectorAll("pre code").forEach((block: HTMLElement) => {
    (hljs as any).highlightElement(block);
  });
  return converted.innerHTML;
});

let selected = 0;

const rightClick = () => {
  if (selected < context.length-1) {
    selected++;
  }
};
const leftClick = () => {
  if (selected > 0) {
    selected--;
  }
};

const keypress = (event) => {
  switch (event.code) {
    case "KeyA":
    case "ArrowLeft":
      leftClick();
      break;
    case "KeyD":
    case "ArrowRight":
      rightClick();
      break;
  }
};

onMount(() => {
  document.addEventListener("keyup", keypress);
});

onDestroy(() => {
  document.removeEventListener("keyup", keypress);
});

</script>

<div class="fitm">
  <div>
    {#each contextDom as element, i}
      {#if i == selected}
        <div class="part" in:fade={{ delay: 200 }} out:fade={{ duration: 200 }}>
          {@html element}
        </div>
      {/if}
    {/each}
  </div>
  <div class="clickp">
    <button type="button" on:click={leftClick} disabled={selected == 0}><Icon icon="arrow" position="left"/></button>
    <button type="button" on:click={rightClick} disabled={context.length-1 == selected}><Icon icon="arrow"/></button>
  </div>
</div>

<span class="progress">
  <span class="width" style={`width: ${(selected+1)/context.length * 100}%;`}/>
</span>

<style lang="scss">
$progress-height: 10px;

.fitm {
  box-sizing: border-box;
  height: calc(100%);
  padding: 0 $progress-height $progress-height;
}

.part {
  position: absolute;
}

.clickp {
  bottom: 0;
  padding-bottom: $progress-height;
  padding-right: 10px;
  position: fixed;
  right: 0;

  button {
    border: unset;
    margin: 0;

    &:disabled {
      background-color: inherit;
      cursor: not-allowed;
      opacity: 0.2;
    }

    &:hover:enabled {
      fill: var(--red);
    }
  }
}

.progress {
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABHNCSVQICAgIfAhkiAAAAGlJREFUGFddjgENgDAMBDcbQwbYwAY6pgMb2AAZYGP7S9qmockn3+36bS2lrNIjUV06pc/6Uc0A7Qbw1KRXqg4weaWkIb+QBMAnoki6mbS+YYiLnfJbSupB+s7/TQ7ETgPiJgA+c9KRb5qLfRfVZfjOggAAAABJRU5ErkJggg==') repeat;
  bottom: 0;
  display: block;
  height: $progress-height;
  position: absolute;
  width: 100%;
  position: fixed;

  .width {
    background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABHNCSVQICAgIfAhkiAAAACNJREFUCFtjZACCPyLW/1neHGUE0WACJAgCIEFGrCpgykGSAO2vFuNVT50qAAAAAElFTkSuQmCC') repeat;
    height: 100%;
    position: absolute;
    transition-duration: 0.5s;
    transition-property: width;
  }
}
</style>
