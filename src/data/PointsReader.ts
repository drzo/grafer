import {GraphPoints} from './GraphPoints';
import {App, DrawCall, PicoGL, Program, Texture, TransformFeedback, VertexArray, VertexBuffer} from 'picogl';
import {computeDataTypes, DataMappings, DataShader, packData} from './DataTools';
import {configureVAO, GenericUniforms, GLDataTypes, glDataTypesInfo, setDrawCallUniforms} from '../renderer/Renderable';
import noopFS from './shaders/noop.fs.glsl';

export abstract class PointsReader<T_SRC, T_TGT> {
    private dataDrawCall: DrawCall;
    private dataProgram: Program;
    private dataBuffer: ArrayBuffer;
    private dataStride: number;
    private dataView: DataView;
    private points: GraphPoints;
    private map: Map<number | string, number | string>;

    protected sourceVBO: VertexBuffer;
    protected sourceVAO: VertexArray;

    protected targetVBO: VertexBuffer;
    protected targetTFO: TransformFeedback;

    protected get dataTexture(): Texture {
        return this.points.dataTexture;
    }

    protected constructor(context: App, points: GraphPoints, data: unknown[], mappings: Partial<DataMappings<T_SRC>>) {
        this.points = points;
        this.ingestData(context, data, mappings);
        this.initializeTargetBuffers(context, data.length);
        this.initializeDataDrawCall(context);
    }

    public getEntryPointID(id: number | string):  number | string {
        return this.map.get(id);
    }

    protected ingestData(context: App, data: unknown[], mappings: Partial<DataMappings<T_SRC>>): void {
        // compute the data mappings for this instance
        const dataMappings: DataMappings<T_SRC> = this.computeMappings(mappings);

        // get the GL data types for this instance
        const types = computeDataTypes(this.getGLSourceTypes(), dataMappings);

        // get the idKey for this instance
        const idKey = this.idKey();
        const pointKey = this.pointKey();

        this.map = new Map();

        this.dataBuffer = packData(data, dataMappings, types, false, (i, entry) => {
            if (idKey in entry) {
                this.map.set(entry[idKey], entry[pointKey]);
            }
        });
        this.dataView = new DataView(this.dataBuffer);

        // initialize the data WebGL objects
        const typesInfo = glDataTypesInfo(types);
        this.dataStride = typesInfo.stride;
        this.sourceVBO = context.createInterleavedBuffer(this.dataStride, this.dataView);
        this.sourceVAO = context.createVertexArray();

        configureVAO(this.sourceVAO, this.sourceVBO, types, typesInfo);
    }

    protected initializeTargetBuffers(context: App, dataLength: number): void {
        const targetTypes = this.getGLTargetTypes();
        const stride = glDataTypesInfo(targetTypes).stride;

        this.targetVBO = context.createInterleavedBuffer(stride, dataLength * stride);
        this.targetTFO = context.createTransformFeedback().feedbackBuffer(0, this.targetVBO);
    }

    protected initializeDataDrawCall(context: App): void {
        const dataShader = this.getDataShader();

        this.dataProgram = context.createProgram(dataShader.vs, noopFS, {
            transformFeedbackVaryings: dataShader.varyings,
            transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS,
        })

        this.dataDrawCall = context.createDrawCall(this.dataProgram, this.sourceVAO).transformFeedback(this.targetTFO);
        this.dataDrawCall.primitive(PicoGL.POINTS);
    }

    public compute(context: App, uniforms: GenericUniforms): void {
        setDrawCallUniforms(this.dataDrawCall, uniforms);

        context.enable(PicoGL.RASTERIZER_DISCARD);
        this.dataDrawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);
    }

    protected configureTargetVAO(vao: VertexArray, attrIndex: number = 1) {
        const types = this.getGLTargetTypes();
        const typesInfo = glDataTypesInfo(types);
        configureVAO(vao, this.targetVBO, types, typesInfo, attrIndex, true);
    }

    protected idKey(): string {
        return 'id';
    }

    protected pointKey(): string {
        return 'point';
    }

    protected abstract computeMappings(mappings: Partial<DataMappings<T_SRC>>): DataMappings<T_SRC>;
    protected abstract getGLSourceTypes(): GLDataTypes<T_SRC>;
    protected abstract getGLTargetTypes(): GLDataTypes<T_TGT>;
    protected abstract getDataShader(): DataShader;
}