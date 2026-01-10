
export abstract class PersistenceStrategy {
    abstract save(path: string, content: string): Promise<void>;
    abstract load(path: string): Promise<string>;
    abstract exists(path: string): Promise<boolean>;
    abstract delete(path: string): Promise<void>;
    abstract rename(oldPath: string, newPath: string): Promise<void>;
    abstract list(dir: string): Promise<string[]>;
    abstract getStream(path: string): Promise<NodeJS.ReadableStream>;
}
