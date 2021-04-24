const encoder = new TextEncoder();
const decoder = new TextDecoder();

// SIZE
const k = 1024;
const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

const bytesToSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const dm = decimals < 0 ? 0 : decimals;

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Modified date get with git log
const getMDate = async (filePath: string) => {
  const p = Deno.run({ cmd: ["git", "log", "-1", "--pretty=%ci", filePath],
    stdout: "piped",
    stderr: "piped",
    stdin: "null" });

  await p.status();
  const result = decoder.decode(await p.output()).trim();
  if (result == "") {
    return undefined;
  }
  return result;
};

export { bytesToSize, getMDate, encoder, decoder };

// Test Func
// console.log(bytesToSize(1463528));
console.log(await getMDate("public/assets/draw/craneCoils.blend"));
