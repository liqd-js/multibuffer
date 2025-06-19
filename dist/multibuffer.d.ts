export default class MultiBuffer {
    #private;
    constructor(...buffers: Buffer[]);
    append(...buffers: Buffer[]): void;
    slice(start?: number, end?: number): Buffer<ArrayBufferLike>[];
    splice(start?: number, deleteCount?: number, ...buffers: Buffer[]): Buffer<ArrayBufferLike>[];
    spliceConcat(start: number, deleteCount: number, ...buffers: Buffer[]): Buffer<ArrayBufferLike>;
    get(index: number): number | undefined;
    set(index: number, value: Buffer): Buffer<ArrayBufferLike>;
    equals(buffer: Buffer, offset?: number, length?: number): boolean;
    indexOf(buffer: Buffer | string, offset?: number, encoding?: BufferEncoding): number;
    partialIndexOf(buffer: Buffer | string, offset?: number, encoding?: BufferEncoding): number;
    get length(): number;
    clear(): void;
}
