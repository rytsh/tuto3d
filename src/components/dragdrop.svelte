<script lang="ts">
import { createEventDispatcher, onMount } from "svelte";

let dropArea: HTMLDivElement;
let active = false;
let input: HTMLInputElement;

const dispatch = createEventDispatcher();
const fileHandle = (file) => {
  dispatch("fileHandle", {
    file: file,
  });
  input.value = "";
};

const fileReader = (file) => {
  // Read file
  const fileReader = new FileReader();
  fileReader.onload = () => {
    fileHandle(fileReader.result);
  };
  fileReader.readAsArrayBuffer(file);
};

onMount(()=> {
  dropArea.addEventListener("dragover", (e)=>{
    e.preventDefault();
    active = true;
  });

  dropArea.addEventListener("dragleave", ()=>{
    active = false;
  });

  dropArea.addEventListener("drop", (e)=>{
    e.preventDefault();

    fileReader(e.dataTransfer.files[0]);

    active = false;
  });

  input.addEventListener("change", ()=>{
    if (input.files.length != 0) {
      fileReader(input.files[0]);
    }
  });
});
</script>

<div class:active={active} bind:this={dropArea}>
  <span>Drop File Here</span>
  <button type="button" on:click={()=>input.click()}>Browse File</button>
  <input type="file" bind:this={input} hidden/>
</div>

<style lang="scss">

div {
  border: 1px solid var(--black);
  padding: 10px;
  text-align: center;
}

button {
  margin: 0;
}

.active {
  outline: var(--red) solid 4px;
  outline-offset: -5px;
}
</style>
