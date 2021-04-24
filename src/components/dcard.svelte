<script lang="ts">
import type { typeAssest } from "@/helper/mAssets";
import { timeago } from "@/helper/time";

export let asset: typeAssest;

const date = new Date(asset.dateModified);
const diff = timeago(Date.now() - date.getTime());
</script>

<div class="card">
  <div class="card-pic">
    <a href={asset.URL} title={asset.URL}>{asset.name}</a>
  </div>
  <div class="card-info">
    <span>{asset.info}</span>
    <span><b>Size:</b> {asset.size}</span>
    <span><b>Author:</b> {asset.author}</span>
    <span><b>Date:</b> {diff}</span>
  </div>
</div>

<style lang="scss">

.card {
  --shadowColor: var(--black);

  background-color: var(--white);
  border: 1px solid #000;
  box-shadow: var(--shadow) var(--shadowColor);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 10px;
  min-height: 100px;
  width: 200px;

  &:hover {
    --shadowColor: var(--red);
  }
}

.card-pic {
  background-color: var(--yellow);
  border-bottom: solid 1px #000;
  text-align: center;

  &:hover {
    background-color: var(--green);
  }
}

.card-info {
  padding: 5px;

  > span {
    display: block;
  }
}

</style>
