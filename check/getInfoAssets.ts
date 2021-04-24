import { mAssets } from "../src/helper/mAssets.ts";
import type { typeAssest } from "../src/helper/mAssets.ts";
import { encoder, decoder, bytesToSize, getMDate } from "./helperFunc.ts";

const fillAssets = async (assets: typeAssest[], newFilePath: string) => {
  const newAssets = await Promise.all(assets.map(async (asset) => {
    const path = `./public/${asset.URL}`;
    const fstat = await Deno.stat(path);

    // Fill parameters
    if (!asset.size) {
      asset.size = bytesToSize(fstat.size);
    }

    if (!asset.dateModified) {
      const mdate = await getMDate(path);
      asset.dateModified = mdate ?? fstat.mtime?.toJSON();
    }

    if (!asset.name) {
      asset.name = path.split("/").pop();
    }
    return asset;
  }));

  // Open file and change it

  // set coder utf8
  const buf = new Uint8Array(1);
  const bufBig = new Uint8Array(100);
  // set data
  const data = encoder.encode("\n" + JSON.stringify(newAssets, null, 2) + ";\n");

  // open file
  const file = Deno.openSync(newFilePath, { read: true, write: true, truncate: false, create: false });

  // Turn to find modify location
  const startText = "// START - MODIFY";
  const stopText = "// END - MODIFY";
  let startRid = 0;
  let stopRid = 0;
  let i = 0;

  let searchText = startText;
  console.log("> Searching..");
  loop:
  while (Deno.readSync(file.rid, buf)) {
    if (decoder.decode(buf) == searchText[i]) {
      i++;
      if (i == searchText.length) {
        // found start location write content
        console.log("found", searchText);
        switch (searchText) {
          case startText:
            startRid = file.seekSync(0, Deno.SeekMode.Current);
            console.log("startRid", startRid);
            searchText = stopText;
            i=0;
            break;
          case stopText:
            stopRid = file.seekSync(0, Deno.SeekMode.Current) - stopText.length;
            console.log("stopRid", stopRid);
            break loop;
          default:
            break;
        }
      }
    } else {
      i=0;
    }
  }

  // read after that stop
  console.log("> Reading last parts..");
  let totalBufBig = "";
  Deno.seekSync(file.rid, stopRid, Deno.SeekMode.Start);
  let readByte: number | null = null;
  while (readByte = Deno.readSync(file.rid, bufBig), readByte) {
    totalBufBig += decoder.decode(bufBig.slice(0, readByte));
  }

  // write file
  console.log("> Writing..");
  Deno.seekSync(file.rid, startRid, Deno.SeekMode.Start);
  const bytesWritten = Deno.writeSync(file.rid, data);
  console.log(bytesWritten);

  // write afters
  console.log("> Writing afters..");
  const bytesWrittenBufi = Deno.writeSync(file.rid, encoder.encode(totalBufBig));
  console.log(bytesWrittenBufi);

  // close file
  Deno.close(file.rid);
};

// Main method
if (import.meta.main) {
  fillAssets(mAssets, "./src/helper/assets.ts");
}

export { fillAssets };
