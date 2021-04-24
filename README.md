# Tuto3D

This is bunch of examples of 3D implemetation on the web.

<details><summary>Development</summary>

## Run in development

Install dependencies

```sh
pnpm install
```

Run project

```sh
PORT=3003 pnpm run dev -- --host
```

Build

```sh
pnpm run assets
pnpm build
```

if you want to add new assets, add new values to `src/helper/mAssets.ts` file.

Build a docker builder

```sh
docker build -t ryts/buildpnpm:latest ci/build
```

</details>
