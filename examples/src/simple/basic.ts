import {html, render} from 'lit-html';
import {LocalJSONL} from '../../../src/loaders/LocalJSONL';

import {Viewport} from '../../../src/renderer/Viewport';
import {DragRotation} from '../../../src/UX/DragRotation';
import {ScrollZoom} from '../../../src/UX/ScrollZoom';

import Tweakpane from 'tweakpane';
import {FolderApi} from 'tweakpane/dist/types/api/folder';
import {
    GraferLoaderEdges,
    GraferLoaderNodes,
    GraferLoaderNodesStats,
    normalizeNodeLayers
} from '../../../src/loaders/GraferLoader';
import {Layer} from '../../../src/graph/Layer';
import {Circular} from '../../../src/graph/nodes/circular/Circular';
import {Gravity} from '../../../src/graph/edges/gravity/Gravity';
import {DebugMenu} from '../../../src/UX/DebugMenu';

interface LoaderColor {
    r: number;
    g: number;
    b: number;
}

interface FilesSelector {
    name: string;
    ready: boolean;
    nodes: string;
    nodesFile: File | null;
    edges: string;
    edgesFile: File | null;
    colors: LoaderColor[];
}

interface LoadedLayer {
    nodes: GraferLoaderNodes;
    edges: GraferLoaderEdges;
}

interface LoadLayersResult {
    layers: LoadedLayer[];
    stats: GraferLoaderNodesStats;
}

const kPolarNight: LoaderColor[] = [
    { r: 59, g: 66, b: 82 },
    { r: 67, g: 76, b: 94 },
    { r: 76, g: 86, b: 106 },
];

const kSnowStorm: LoaderColor[] = [
    { r: 216, g: 222, b: 233 },
    { r: 229, g: 233, b: 240 },
    { r: 236, g: 239, b: 244 },
];

const kFrost: LoaderColor[] = [
    { r: 143, g: 188, b: 187 },
    { r: 136, g: 192, b: 208 },
    { r: 129, g: 161, b: 193 },
    { r: 94, g: 129, b: 172 },
];

const kAurora: LoaderColor[] = [
    { r: 191, g: 97, b: 106 },
    { r: 208, g: 135, b: 112 },
    { r: 235, g: 203, b: 139 },
    { r: 163, g: 190, b: 140 },
    { r: 180, g: 142, b: 173 },
];

const kColorPresets = [
    { name: 'none', colors: null },
    { name: 'polar night', colors: kPolarNight },
    { name: 'snow storm', colors: kSnowStorm },
    { name: 'frost', colors: kFrost },
    { name: 'aurora', colors: kAurora },
];

function createColorsSelector(folder: FolderApi, colors: LoaderColor[]): void {
    const dummy = { preset: 0 };
    const presetOptions: {[key: string]: number} = {};
    for (let i = 0, n = kColorPresets.length; i < n; ++i) {
        presetOptions[kColorPresets[i].name] = i;
    }
    const preset = folder.addInput(dummy, 'preset', { options: presetOptions });
    preset.on('change', (value: number): void => {
        if (value > 0) {
            colors.length = 0;
            colors.push(...kColorPresets[value].colors);

            const items = folder.controller.uiContainer.items;
            while (items.length > 3) {
                items[items.length - 3].viewModel.dispose();
            }

            for (let i = 0, n = colors.length; i < n; ++i) {
                folder.addInput(colors, `${i}`, { index: i + 1 });
            }

            remove.hidden = colors.length <= 1;
        }
    });

    for (let i = 0, n = colors.length; i < n; ++i) {
        folder.addInput(colors, `${i}`);
    }

    const remove = folder.addButton({ title: 'remove color' });
    remove.hidden = colors.length <= 1;
    remove.on('click', () => {
        colors.pop();
        const items = folder.controller.uiContainer.items;
        items[items.length - 3].viewModel.dispose();
        remove.hidden = colors.length <= 1;
        dummy.preset = 0;
        preset.refresh();
    });

    folder.addButton( { title: 'add color' }).on('click', () => {
        const lastColor: LoaderColor = colors[colors.length - 1];
        const color: LoaderColor = { r: lastColor.r, g: lastColor.g, b: lastColor.b };
        colors.push(color);
        folder.addInput(colors, `${colors.length -1}`, { index: colors.length });
        remove.hidden = colors.length <= 1;
        dummy.preset = 0;
        preset.refresh();
    });
}

function createFileInput(cb: () => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}

let gLayerCount = 0;
function createFilesSelector(pane: Tweakpane, layers: FilesSelector[], updateLoadBtn: () => void): FilesSelector {
    const result = {
        name: `layer_${gLayerCount++}`,
        ready: false,
        nodes: 'No file selected.',
        nodesFile: null,
        edges: 'No file selected.',
        edgesFile: null,
        colors:[...kAurora],
    }
    const folder = pane.addFolder({
        title: result.name,
        index: layers.length,
    });
    folder.addInput(result, 'name');

    folder.addSeparator();

    const nodesInput = createFileInput(() => {
        if (nodesInput.files.length) {
            result.nodesFile = nodesInput.files[0];
            result.nodes = result.nodesFile.name;
            result.ready = true;
        } else {
            result.nodes = 'No file selected.';
            result.nodesFile = null;
            result.ready = false;
        }
        updateLoadBtn();
    });
    folder.addMonitor(result, 'nodes');
    folder.addButton({ title: 'browse...' }).on('click', () => nodesInput.click());

    folder.addSeparator();

    const edgesInput = createFileInput(() => {
        if (edgesInput.files.length) {
            result.edgesFile = edgesInput.files[0];
            result.edges = result.edgesFile.name;
        } else {
            result.edges = 'No file selected.';
            result.edgesFile = null;
        }
    });
    folder.addMonitor(result, 'edges');
    folder.addButton({ title: 'browse...' }).on('click', () => edgesInput.click());

    folder.addSeparator();

    const colors = folder.addFolder({ title: 'colors', expanded: false });
    createColorsSelector(colors, result.colors);

    const misc = folder.addFolder({ title: 'misc', expanded: false });
    misc.addMonitor(result, 'ready');
    misc.addButton({ title: 'remove layer'}).on('click', () => {
        const i = layers.indexOf(result);
        if (i !== -1) {
            layers.splice(i, 1);
            folder.dispose();
            updateLoadBtn();
        }
    });

    folder.addSeparator();

    return result;
}

async function loadLayers(layers: FilesSelector[]): Promise<LoadLayersResult> {
    const loadedLayers: LoadedLayer[] = [];

    for (let i = 0, n = layers.length; i < n; ++i) {
        const layer = layers[i];
        const colors = [];
        for (let ii = 0, nn = layer.colors.length; ii < nn; ++ii) {
            colors.push([layer.colors[ii].r, layer.colors[ii].g, layer.colors[ii].b]);
        }
        loadedLayers.push({
            nodes: await LocalJSONL.loadNodes(layers[i].nodesFile, colors),
            edges: null,
        });
    }

    const stats = normalizeNodeLayers(loadedLayers.map(layer => layer.nodes));

    for (let i = 0, n = layers.length; i < n; ++i) {
        if (layers[i].edgesFile) {
            loadedLayers[i].edges = await LocalJSONL.loadEdges(layers[i].edgesFile, loadedLayers[i].nodes);
        }
    }

    return {
        layers: loadedLayers,
        stats,
    };
}

export async function basic(container): Promise<void> {
    render(html`<div id="menu" class="start_menu"></div>`, container);

    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });

    const layers: FilesSelector[] = [];

    const addBtn = menu.addButton({ title: 'add layer' });
    const loadBtn = menu.addButton({ title: 'load' });
    const updateLoadBtn = () => {
        if (layers.length) {
            for (let i = 0, n = layers.length; i < n; ++i) {
                if (!layers[i].ready) {
                    loadBtn.hidden = true;
                    return;
                }
            }
            loadBtn.hidden = false;
        } else {
            loadBtn.hidden = true;
        }
    };

    loadBtn.hidden = true;
    addBtn.on('click', () => {
        layers.push(createFilesSelector(menu, layers, updateLoadBtn));
        updateLoadBtn();
    });

    loadBtn.on('click', async (): Promise<void> => {
        menu.dispose();
        const loading = new Tweakpane({
            title: 'loading...',
            container: document.querySelector('#menu'),
        });

        try {
            const loaded = await loadLayers(layers);

            container.innerHTML = '';
            const viewport = new Viewport(container);


            for (let i = 0, n = loaded.layers.length; i < n; ++i) {
                const loadedLayer = loaded.layers[i];
                const nodes = new Circular(viewport.context, loadedLayer.nodes.positions, loadedLayer.nodes.colors, loadedLayer.nodes.sizes);
                const edges = !loadedLayer.edges ? null : new Gravity(viewport.context, loadedLayer.edges.positions, loadedLayer.edges.colors);
                const layer = new Layer(nodes, edges, layers[i].name);
                viewport.graph.addLayer(layer);
            }

            viewport.camera.position = [0, 0, loaded.stats.cornerLength];

            const rotation = new DragRotation(viewport);
            rotation.start();

            const zoom = new ScrollZoom(viewport);
            zoom.start();

            const debug = new DebugMenu(viewport);
            console.log(debug);

            viewport.render();
            requestAnimationFrame(() => viewport.render());
        } catch (e) {
            loading.addMonitor({ error: e.toString() }, 'error');
            throw e;
        }

        // loading.dispose();
    });
}