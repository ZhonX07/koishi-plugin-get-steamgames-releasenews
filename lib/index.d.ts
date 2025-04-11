import { Context, Schema } from 'koishi';
export declare const name = "get-steamgames-releasenews";
export interface Config {
    maxLength?: number;
    count?: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
