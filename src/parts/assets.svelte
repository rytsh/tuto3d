<script lang="ts">
import Dcard from "@/components/dcard.svelte";
import { informationData } from "@/store/store";
import { assets } from "@/helper/assets";

// Give infromation
informationData.set("");

</script>

<div class="fit">
  <h1>Downloadable assets</h1>
  <div class="assets">
  {#each assets as asset }
    <Dcard asset={asset} />
  {/each}
  </div>
</div>

<style lang="scss">
.assets {
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
}
</style>