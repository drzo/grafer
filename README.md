# grafer

![CI](../../workflows/CI/badge.svg)

Grafer is a large graph/network rendering library written using webGL, specializing in displaying and interacting with large datasets in real time. It provides multiple node types including simple geometric shapes and custom textures. Multiple edge types are also provided such as straight line, straight path, and bezier. Labels are customizable, with options included to change background, placement, and font. The viewer can operate in 2D or 3D.

![header image](./docs/assets/grafer-3d.png)

## Usage Example

```js
    import { GraferController } from '@uncharted.software/grafer';

    // format data
    const nodes = {
        data: [
            { x: -8.6, y: 5.0 },
            { x: 8.6, y: 5.0 },
            { x: 0.0, y: -10.0 },
            { x: 0.0, y: 0.0 },
        ],
    };
    const edges = {
        data: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 0 },

            { source: 3, target: 0 },
            { source: 3, target: 1 },
            { source: 3, target: 2 },
        ],
    };

    // initialize grafer
    const canvas = document.getElementById('grafer_container');
    const layers = [{ nodes, edges }];
    new GraferController(canvas, { layers });
```

See more examples available [here](./examples).

## Documentation

All documentaton, including API reference, is available [here](./docs/table-of-contents.md).

## Build and Development

1. `yarn run install` to install all required dependencies

2. One of the following scripts depending on use case:
- `yarn run build` - to build the library from source
- `yarn run develop` - to build and start the hot-reload dev server (which also allows examples to be accessed at `http://localhost:8090/`)
- `yarn run lint` - to run linter
- `yarn run test` - to run tests

### Publishing Instructions

1. Make sure `package.json` contains new version number
2. `yarn run prepack` to run build and validation scripts
3. `npm version <new_version_num>` to update the version number
4. `npm publish @uncharted.software/grafer` to publish to NPM