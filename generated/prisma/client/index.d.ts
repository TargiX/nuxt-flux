
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Dream
 * 
 */
export type Dream = $Result.DefaultSelection<Prisma.$DreamPayload>
/**
 * Model GeneratedImage
 * 
 */
export type GeneratedImage = $Result.DefaultSelection<Prisma.$GeneratedImagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.dream`: Exposes CRUD operations for the **Dream** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Dreams
    * const dreams = await prisma.dream.findMany()
    * ```
    */
  get dream(): Prisma.DreamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.generatedImage`: Exposes CRUD operations for the **GeneratedImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GeneratedImages
    * const generatedImages = await prisma.generatedImage.findMany()
    * ```
    */
  get generatedImage(): Prisma.GeneratedImageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Dream: 'Dream',
    GeneratedImage: 'GeneratedImage'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "dream" | "generatedImage"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Dream: {
        payload: Prisma.$DreamPayload<ExtArgs>
        fields: Prisma.DreamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DreamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DreamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          findFirst: {
            args: Prisma.DreamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DreamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          findMany: {
            args: Prisma.DreamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>[]
          }
          create: {
            args: Prisma.DreamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          createMany: {
            args: Prisma.DreamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DreamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>[]
          }
          delete: {
            args: Prisma.DreamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          update: {
            args: Prisma.DreamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          deleteMany: {
            args: Prisma.DreamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DreamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DreamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>[]
          }
          upsert: {
            args: Prisma.DreamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DreamPayload>
          }
          aggregate: {
            args: Prisma.DreamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDream>
          }
          groupBy: {
            args: Prisma.DreamGroupByArgs<ExtArgs>
            result: $Utils.Optional<DreamGroupByOutputType>[]
          }
          count: {
            args: Prisma.DreamCountArgs<ExtArgs>
            result: $Utils.Optional<DreamCountAggregateOutputType> | number
          }
        }
      }
      GeneratedImage: {
        payload: Prisma.$GeneratedImagePayload<ExtArgs>
        fields: Prisma.GeneratedImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GeneratedImageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GeneratedImageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          findFirst: {
            args: Prisma.GeneratedImageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GeneratedImageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          findMany: {
            args: Prisma.GeneratedImageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>[]
          }
          create: {
            args: Prisma.GeneratedImageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          createMany: {
            args: Prisma.GeneratedImageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GeneratedImageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>[]
          }
          delete: {
            args: Prisma.GeneratedImageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          update: {
            args: Prisma.GeneratedImageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          deleteMany: {
            args: Prisma.GeneratedImageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GeneratedImageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GeneratedImageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>[]
          }
          upsert: {
            args: Prisma.GeneratedImageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GeneratedImagePayload>
          }
          aggregate: {
            args: Prisma.GeneratedImageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGeneratedImage>
          }
          groupBy: {
            args: Prisma.GeneratedImageGroupByArgs<ExtArgs>
            result: $Utils.Optional<GeneratedImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.GeneratedImageCountArgs<ExtArgs>
            result: $Utils.Optional<GeneratedImageCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    dream?: DreamOmit
    generatedImage?: GeneratedImageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    dreams: number
    generatedImages: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dreams?: boolean | UserCountOutputTypeCountDreamsArgs
    generatedImages?: boolean | UserCountOutputTypeCountGeneratedImagesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountDreamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DreamWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountGeneratedImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GeneratedImageWhereInput
  }


  /**
   * Count Type DreamCountOutputType
   */

  export type DreamCountOutputType = {
    generatedImages: number
  }

  export type DreamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    generatedImages?: boolean | DreamCountOutputTypeCountGeneratedImagesArgs
  }

  // Custom InputTypes
  /**
   * DreamCountOutputType without action
   */
  export type DreamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DreamCountOutputType
     */
    select?: DreamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DreamCountOutputType without action
   */
  export type DreamCountOutputTypeCountGeneratedImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GeneratedImageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    emailVerified: Date | null
    passwordHash: string | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    emailVerified: Date | null
    passwordHash: string | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    emailVerified: number
    passwordHash: number
    image: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    passwordHash?: true
    image?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    passwordHash?: true
    image?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    passwordHash?: true
    image?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string | null
    email: string | null
    emailVerified: Date | null
    passwordHash: string | null
    image: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    passwordHash?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dreams?: boolean | User$dreamsArgs<ExtArgs>
    generatedImages?: boolean | User$generatedImagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    passwordHash?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    passwordHash?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    passwordHash?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "emailVerified" | "passwordHash" | "image" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dreams?: boolean | User$dreamsArgs<ExtArgs>
    generatedImages?: boolean | User$generatedImagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      dreams: Prisma.$DreamPayload<ExtArgs>[]
      generatedImages: Prisma.$GeneratedImagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      email: string | null
      emailVerified: Date | null
      passwordHash: string | null
      image: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dreams<T extends User$dreamsArgs<ExtArgs> = {}>(args?: Subset<T, User$dreamsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    generatedImages<T extends User$generatedImagesArgs<ExtArgs> = {}>(args?: Subset<T, User$generatedImagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly emailVerified: FieldRef<"User", 'DateTime'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly image: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.dreams
   */
  export type User$dreamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    where?: DreamWhereInput
    orderBy?: DreamOrderByWithRelationInput | DreamOrderByWithRelationInput[]
    cursor?: DreamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DreamScalarFieldEnum | DreamScalarFieldEnum[]
  }

  /**
   * User.generatedImages
   */
  export type User$generatedImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    where?: GeneratedImageWhereInput
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    cursor?: GeneratedImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GeneratedImageScalarFieldEnum | GeneratedImageScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Dream
   */

  export type AggregateDream = {
    _count: DreamCountAggregateOutputType | null
    _avg: DreamAvgAggregateOutputType | null
    _sum: DreamSumAggregateOutputType | null
    _min: DreamMinAggregateOutputType | null
    _max: DreamMaxAggregateOutputType | null
  }

  export type DreamAvgAggregateOutputType = {
    id: number | null
  }

  export type DreamSumAggregateOutputType = {
    id: number | null
  }

  export type DreamMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    title: string | null
    userId: string | null
  }

  export type DreamMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    title: string | null
    userId: string | null
  }

  export type DreamCountAggregateOutputType = {
    id: number
    createdAt: number
    title: number
    data: number
    userId: number
    _all: number
  }


  export type DreamAvgAggregateInputType = {
    id?: true
  }

  export type DreamSumAggregateInputType = {
    id?: true
  }

  export type DreamMinAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    userId?: true
  }

  export type DreamMaxAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    userId?: true
  }

  export type DreamCountAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    data?: true
    userId?: true
    _all?: true
  }

  export type DreamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dream to aggregate.
     */
    where?: DreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dreams to fetch.
     */
    orderBy?: DreamOrderByWithRelationInput | DreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dreams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dreams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Dreams
    **/
    _count?: true | DreamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DreamAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DreamSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DreamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DreamMaxAggregateInputType
  }

  export type GetDreamAggregateType<T extends DreamAggregateArgs> = {
        [P in keyof T & keyof AggregateDream]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDream[P]>
      : GetScalarType<T[P], AggregateDream[P]>
  }




  export type DreamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DreamWhereInput
    orderBy?: DreamOrderByWithAggregationInput | DreamOrderByWithAggregationInput[]
    by: DreamScalarFieldEnum[] | DreamScalarFieldEnum
    having?: DreamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DreamCountAggregateInputType | true
    _avg?: DreamAvgAggregateInputType
    _sum?: DreamSumAggregateInputType
    _min?: DreamMinAggregateInputType
    _max?: DreamMaxAggregateInputType
  }

  export type DreamGroupByOutputType = {
    id: number
    createdAt: Date
    title: string | null
    data: JsonValue
    userId: string
    _count: DreamCountAggregateOutputType | null
    _avg: DreamAvgAggregateOutputType | null
    _sum: DreamSumAggregateOutputType | null
    _min: DreamMinAggregateOutputType | null
    _max: DreamMaxAggregateOutputType | null
  }

  type GetDreamGroupByPayload<T extends DreamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DreamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DreamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DreamGroupByOutputType[P]>
            : GetScalarType<T[P], DreamGroupByOutputType[P]>
        }
      >
    >


  export type DreamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    data?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    generatedImages?: boolean | Dream$generatedImagesArgs<ExtArgs>
    _count?: boolean | DreamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dream"]>

  export type DreamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    data?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dream"]>

  export type DreamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    data?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["dream"]>

  export type DreamSelectScalar = {
    id?: boolean
    createdAt?: boolean
    title?: boolean
    data?: boolean
    userId?: boolean
  }

  export type DreamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "title" | "data" | "userId", ExtArgs["result"]["dream"]>
  export type DreamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    generatedImages?: boolean | Dream$generatedImagesArgs<ExtArgs>
    _count?: boolean | DreamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DreamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type DreamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $DreamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Dream"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      generatedImages: Prisma.$GeneratedImagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date
      title: string | null
      data: Prisma.JsonValue
      userId: string
    }, ExtArgs["result"]["dream"]>
    composites: {}
  }

  type DreamGetPayload<S extends boolean | null | undefined | DreamDefaultArgs> = $Result.GetResult<Prisma.$DreamPayload, S>

  type DreamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DreamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DreamCountAggregateInputType | true
    }

  export interface DreamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Dream'], meta: { name: 'Dream' } }
    /**
     * Find zero or one Dream that matches the filter.
     * @param {DreamFindUniqueArgs} args - Arguments to find a Dream
     * @example
     * // Get one Dream
     * const dream = await prisma.dream.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DreamFindUniqueArgs>(args: SelectSubset<T, DreamFindUniqueArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Dream that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DreamFindUniqueOrThrowArgs} args - Arguments to find a Dream
     * @example
     * // Get one Dream
     * const dream = await prisma.dream.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DreamFindUniqueOrThrowArgs>(args: SelectSubset<T, DreamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Dream that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamFindFirstArgs} args - Arguments to find a Dream
     * @example
     * // Get one Dream
     * const dream = await prisma.dream.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DreamFindFirstArgs>(args?: SelectSubset<T, DreamFindFirstArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Dream that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamFindFirstOrThrowArgs} args - Arguments to find a Dream
     * @example
     * // Get one Dream
     * const dream = await prisma.dream.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DreamFindFirstOrThrowArgs>(args?: SelectSubset<T, DreamFindFirstOrThrowArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Dreams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Dreams
     * const dreams = await prisma.dream.findMany()
     * 
     * // Get first 10 Dreams
     * const dreams = await prisma.dream.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dreamWithIdOnly = await prisma.dream.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DreamFindManyArgs>(args?: SelectSubset<T, DreamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Dream.
     * @param {DreamCreateArgs} args - Arguments to create a Dream.
     * @example
     * // Create one Dream
     * const Dream = await prisma.dream.create({
     *   data: {
     *     // ... data to create a Dream
     *   }
     * })
     * 
     */
    create<T extends DreamCreateArgs>(args: SelectSubset<T, DreamCreateArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Dreams.
     * @param {DreamCreateManyArgs} args - Arguments to create many Dreams.
     * @example
     * // Create many Dreams
     * const dream = await prisma.dream.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DreamCreateManyArgs>(args?: SelectSubset<T, DreamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Dreams and returns the data saved in the database.
     * @param {DreamCreateManyAndReturnArgs} args - Arguments to create many Dreams.
     * @example
     * // Create many Dreams
     * const dream = await prisma.dream.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Dreams and only return the `id`
     * const dreamWithIdOnly = await prisma.dream.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DreamCreateManyAndReturnArgs>(args?: SelectSubset<T, DreamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Dream.
     * @param {DreamDeleteArgs} args - Arguments to delete one Dream.
     * @example
     * // Delete one Dream
     * const Dream = await prisma.dream.delete({
     *   where: {
     *     // ... filter to delete one Dream
     *   }
     * })
     * 
     */
    delete<T extends DreamDeleteArgs>(args: SelectSubset<T, DreamDeleteArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Dream.
     * @param {DreamUpdateArgs} args - Arguments to update one Dream.
     * @example
     * // Update one Dream
     * const dream = await prisma.dream.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DreamUpdateArgs>(args: SelectSubset<T, DreamUpdateArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Dreams.
     * @param {DreamDeleteManyArgs} args - Arguments to filter Dreams to delete.
     * @example
     * // Delete a few Dreams
     * const { count } = await prisma.dream.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DreamDeleteManyArgs>(args?: SelectSubset<T, DreamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Dreams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Dreams
     * const dream = await prisma.dream.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DreamUpdateManyArgs>(args: SelectSubset<T, DreamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Dreams and returns the data updated in the database.
     * @param {DreamUpdateManyAndReturnArgs} args - Arguments to update many Dreams.
     * @example
     * // Update many Dreams
     * const dream = await prisma.dream.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Dreams and only return the `id`
     * const dreamWithIdOnly = await prisma.dream.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DreamUpdateManyAndReturnArgs>(args: SelectSubset<T, DreamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Dream.
     * @param {DreamUpsertArgs} args - Arguments to update or create a Dream.
     * @example
     * // Update or create a Dream
     * const dream = await prisma.dream.upsert({
     *   create: {
     *     // ... data to create a Dream
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Dream we want to update
     *   }
     * })
     */
    upsert<T extends DreamUpsertArgs>(args: SelectSubset<T, DreamUpsertArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Dreams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamCountArgs} args - Arguments to filter Dreams to count.
     * @example
     * // Count the number of Dreams
     * const count = await prisma.dream.count({
     *   where: {
     *     // ... the filter for the Dreams we want to count
     *   }
     * })
    **/
    count<T extends DreamCountArgs>(
      args?: Subset<T, DreamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DreamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Dream.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DreamAggregateArgs>(args: Subset<T, DreamAggregateArgs>): Prisma.PrismaPromise<GetDreamAggregateType<T>>

    /**
     * Group by Dream.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DreamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DreamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DreamGroupByArgs['orderBy'] }
        : { orderBy?: DreamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DreamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDreamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Dream model
   */
  readonly fields: DreamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Dream.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DreamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    generatedImages<T extends Dream$generatedImagesArgs<ExtArgs> = {}>(args?: Subset<T, Dream$generatedImagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Dream model
   */
  interface DreamFieldRefs {
    readonly id: FieldRef<"Dream", 'Int'>
    readonly createdAt: FieldRef<"Dream", 'DateTime'>
    readonly title: FieldRef<"Dream", 'String'>
    readonly data: FieldRef<"Dream", 'Json'>
    readonly userId: FieldRef<"Dream", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Dream findUnique
   */
  export type DreamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter, which Dream to fetch.
     */
    where: DreamWhereUniqueInput
  }

  /**
   * Dream findUniqueOrThrow
   */
  export type DreamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter, which Dream to fetch.
     */
    where: DreamWhereUniqueInput
  }

  /**
   * Dream findFirst
   */
  export type DreamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter, which Dream to fetch.
     */
    where?: DreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dreams to fetch.
     */
    orderBy?: DreamOrderByWithRelationInput | DreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dreams.
     */
    cursor?: DreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dreams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dreams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dreams.
     */
    distinct?: DreamScalarFieldEnum | DreamScalarFieldEnum[]
  }

  /**
   * Dream findFirstOrThrow
   */
  export type DreamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter, which Dream to fetch.
     */
    where?: DreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dreams to fetch.
     */
    orderBy?: DreamOrderByWithRelationInput | DreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Dreams.
     */
    cursor?: DreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dreams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dreams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Dreams.
     */
    distinct?: DreamScalarFieldEnum | DreamScalarFieldEnum[]
  }

  /**
   * Dream findMany
   */
  export type DreamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter, which Dreams to fetch.
     */
    where?: DreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Dreams to fetch.
     */
    orderBy?: DreamOrderByWithRelationInput | DreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Dreams.
     */
    cursor?: DreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Dreams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Dreams.
     */
    skip?: number
    distinct?: DreamScalarFieldEnum | DreamScalarFieldEnum[]
  }

  /**
   * Dream create
   */
  export type DreamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * The data needed to create a Dream.
     */
    data: XOR<DreamCreateInput, DreamUncheckedCreateInput>
  }

  /**
   * Dream createMany
   */
  export type DreamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Dreams.
     */
    data: DreamCreateManyInput | DreamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Dream createManyAndReturn
   */
  export type DreamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * The data used to create many Dreams.
     */
    data: DreamCreateManyInput | DreamCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Dream update
   */
  export type DreamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * The data needed to update a Dream.
     */
    data: XOR<DreamUpdateInput, DreamUncheckedUpdateInput>
    /**
     * Choose, which Dream to update.
     */
    where: DreamWhereUniqueInput
  }

  /**
   * Dream updateMany
   */
  export type DreamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Dreams.
     */
    data: XOR<DreamUpdateManyMutationInput, DreamUncheckedUpdateManyInput>
    /**
     * Filter which Dreams to update
     */
    where?: DreamWhereInput
    /**
     * Limit how many Dreams to update.
     */
    limit?: number
  }

  /**
   * Dream updateManyAndReturn
   */
  export type DreamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * The data used to update Dreams.
     */
    data: XOR<DreamUpdateManyMutationInput, DreamUncheckedUpdateManyInput>
    /**
     * Filter which Dreams to update
     */
    where?: DreamWhereInput
    /**
     * Limit how many Dreams to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Dream upsert
   */
  export type DreamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * The filter to search for the Dream to update in case it exists.
     */
    where: DreamWhereUniqueInput
    /**
     * In case the Dream found by the `where` argument doesn't exist, create a new Dream with this data.
     */
    create: XOR<DreamCreateInput, DreamUncheckedCreateInput>
    /**
     * In case the Dream was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DreamUpdateInput, DreamUncheckedUpdateInput>
  }

  /**
   * Dream delete
   */
  export type DreamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
    /**
     * Filter which Dream to delete.
     */
    where: DreamWhereUniqueInput
  }

  /**
   * Dream deleteMany
   */
  export type DreamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Dreams to delete
     */
    where?: DreamWhereInput
    /**
     * Limit how many Dreams to delete.
     */
    limit?: number
  }

  /**
   * Dream.generatedImages
   */
  export type Dream$generatedImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    where?: GeneratedImageWhereInput
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    cursor?: GeneratedImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GeneratedImageScalarFieldEnum | GeneratedImageScalarFieldEnum[]
  }

  /**
   * Dream without action
   */
  export type DreamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Dream
     */
    select?: DreamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Dream
     */
    omit?: DreamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DreamInclude<ExtArgs> | null
  }


  /**
   * Model GeneratedImage
   */

  export type AggregateGeneratedImage = {
    _count: GeneratedImageCountAggregateOutputType | null
    _avg: GeneratedImageAvgAggregateOutputType | null
    _sum: GeneratedImageSumAggregateOutputType | null
    _min: GeneratedImageMinAggregateOutputType | null
    _max: GeneratedImageMaxAggregateOutputType | null
  }

  export type GeneratedImageAvgAggregateOutputType = {
    id: number | null
    dreamId: number | null
  }

  export type GeneratedImageSumAggregateOutputType = {
    id: number | null
    dreamId: number | null
  }

  export type GeneratedImageMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    imageUrl: string | null
    promptText: string | null
    dreamId: number | null
    userId: string | null
  }

  export type GeneratedImageMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    updatedAt: Date | null
    imageUrl: string | null
    promptText: string | null
    dreamId: number | null
    userId: string | null
  }

  export type GeneratedImageCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    imageUrl: number
    promptText: number
    graphState: number
    dreamId: number
    userId: number
    _all: number
  }


  export type GeneratedImageAvgAggregateInputType = {
    id?: true
    dreamId?: true
  }

  export type GeneratedImageSumAggregateInputType = {
    id?: true
    dreamId?: true
  }

  export type GeneratedImageMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    imageUrl?: true
    promptText?: true
    dreamId?: true
    userId?: true
  }

  export type GeneratedImageMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    imageUrl?: true
    promptText?: true
    dreamId?: true
    userId?: true
  }

  export type GeneratedImageCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    imageUrl?: true
    promptText?: true
    graphState?: true
    dreamId?: true
    userId?: true
    _all?: true
  }

  export type GeneratedImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GeneratedImage to aggregate.
     */
    where?: GeneratedImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GeneratedImages to fetch.
     */
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GeneratedImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GeneratedImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GeneratedImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GeneratedImages
    **/
    _count?: true | GeneratedImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GeneratedImageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GeneratedImageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GeneratedImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GeneratedImageMaxAggregateInputType
  }

  export type GetGeneratedImageAggregateType<T extends GeneratedImageAggregateArgs> = {
        [P in keyof T & keyof AggregateGeneratedImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGeneratedImage[P]>
      : GetScalarType<T[P], AggregateGeneratedImage[P]>
  }




  export type GeneratedImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GeneratedImageWhereInput
    orderBy?: GeneratedImageOrderByWithAggregationInput | GeneratedImageOrderByWithAggregationInput[]
    by: GeneratedImageScalarFieldEnum[] | GeneratedImageScalarFieldEnum
    having?: GeneratedImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GeneratedImageCountAggregateInputType | true
    _avg?: GeneratedImageAvgAggregateInputType
    _sum?: GeneratedImageSumAggregateInputType
    _min?: GeneratedImageMinAggregateInputType
    _max?: GeneratedImageMaxAggregateInputType
  }

  export type GeneratedImageGroupByOutputType = {
    id: number
    createdAt: Date
    updatedAt: Date
    imageUrl: string
    promptText: string | null
    graphState: JsonValue | null
    dreamId: number
    userId: string
    _count: GeneratedImageCountAggregateOutputType | null
    _avg: GeneratedImageAvgAggregateOutputType | null
    _sum: GeneratedImageSumAggregateOutputType | null
    _min: GeneratedImageMinAggregateOutputType | null
    _max: GeneratedImageMaxAggregateOutputType | null
  }

  type GetGeneratedImageGroupByPayload<T extends GeneratedImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GeneratedImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GeneratedImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GeneratedImageGroupByOutputType[P]>
            : GetScalarType<T[P], GeneratedImageGroupByOutputType[P]>
        }
      >
    >


  export type GeneratedImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    imageUrl?: boolean
    promptText?: boolean
    graphState?: boolean
    dreamId?: boolean
    userId?: boolean
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["generatedImage"]>

  export type GeneratedImageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    imageUrl?: boolean
    promptText?: boolean
    graphState?: boolean
    dreamId?: boolean
    userId?: boolean
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["generatedImage"]>

  export type GeneratedImageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    imageUrl?: boolean
    promptText?: boolean
    graphState?: boolean
    dreamId?: boolean
    userId?: boolean
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["generatedImage"]>

  export type GeneratedImageSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    imageUrl?: boolean
    promptText?: boolean
    graphState?: boolean
    dreamId?: boolean
    userId?: boolean
  }

  export type GeneratedImageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "imageUrl" | "promptText" | "graphState" | "dreamId" | "userId", ExtArgs["result"]["generatedImage"]>
  export type GeneratedImageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GeneratedImageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GeneratedImageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    dream?: boolean | DreamDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GeneratedImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GeneratedImage"
    objects: {
      dream: Prisma.$DreamPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date
      updatedAt: Date
      imageUrl: string
      promptText: string | null
      graphState: Prisma.JsonValue | null
      dreamId: number
      userId: string
    }, ExtArgs["result"]["generatedImage"]>
    composites: {}
  }

  type GeneratedImageGetPayload<S extends boolean | null | undefined | GeneratedImageDefaultArgs> = $Result.GetResult<Prisma.$GeneratedImagePayload, S>

  type GeneratedImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GeneratedImageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GeneratedImageCountAggregateInputType | true
    }

  export interface GeneratedImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GeneratedImage'], meta: { name: 'GeneratedImage' } }
    /**
     * Find zero or one GeneratedImage that matches the filter.
     * @param {GeneratedImageFindUniqueArgs} args - Arguments to find a GeneratedImage
     * @example
     * // Get one GeneratedImage
     * const generatedImage = await prisma.generatedImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GeneratedImageFindUniqueArgs>(args: SelectSubset<T, GeneratedImageFindUniqueArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GeneratedImage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GeneratedImageFindUniqueOrThrowArgs} args - Arguments to find a GeneratedImage
     * @example
     * // Get one GeneratedImage
     * const generatedImage = await prisma.generatedImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GeneratedImageFindUniqueOrThrowArgs>(args: SelectSubset<T, GeneratedImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GeneratedImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageFindFirstArgs} args - Arguments to find a GeneratedImage
     * @example
     * // Get one GeneratedImage
     * const generatedImage = await prisma.generatedImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GeneratedImageFindFirstArgs>(args?: SelectSubset<T, GeneratedImageFindFirstArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GeneratedImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageFindFirstOrThrowArgs} args - Arguments to find a GeneratedImage
     * @example
     * // Get one GeneratedImage
     * const generatedImage = await prisma.generatedImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GeneratedImageFindFirstOrThrowArgs>(args?: SelectSubset<T, GeneratedImageFindFirstOrThrowArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GeneratedImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GeneratedImages
     * const generatedImages = await prisma.generatedImage.findMany()
     * 
     * // Get first 10 GeneratedImages
     * const generatedImages = await prisma.generatedImage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const generatedImageWithIdOnly = await prisma.generatedImage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GeneratedImageFindManyArgs>(args?: SelectSubset<T, GeneratedImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GeneratedImage.
     * @param {GeneratedImageCreateArgs} args - Arguments to create a GeneratedImage.
     * @example
     * // Create one GeneratedImage
     * const GeneratedImage = await prisma.generatedImage.create({
     *   data: {
     *     // ... data to create a GeneratedImage
     *   }
     * })
     * 
     */
    create<T extends GeneratedImageCreateArgs>(args: SelectSubset<T, GeneratedImageCreateArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GeneratedImages.
     * @param {GeneratedImageCreateManyArgs} args - Arguments to create many GeneratedImages.
     * @example
     * // Create many GeneratedImages
     * const generatedImage = await prisma.generatedImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GeneratedImageCreateManyArgs>(args?: SelectSubset<T, GeneratedImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GeneratedImages and returns the data saved in the database.
     * @param {GeneratedImageCreateManyAndReturnArgs} args - Arguments to create many GeneratedImages.
     * @example
     * // Create many GeneratedImages
     * const generatedImage = await prisma.generatedImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GeneratedImages and only return the `id`
     * const generatedImageWithIdOnly = await prisma.generatedImage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GeneratedImageCreateManyAndReturnArgs>(args?: SelectSubset<T, GeneratedImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GeneratedImage.
     * @param {GeneratedImageDeleteArgs} args - Arguments to delete one GeneratedImage.
     * @example
     * // Delete one GeneratedImage
     * const GeneratedImage = await prisma.generatedImage.delete({
     *   where: {
     *     // ... filter to delete one GeneratedImage
     *   }
     * })
     * 
     */
    delete<T extends GeneratedImageDeleteArgs>(args: SelectSubset<T, GeneratedImageDeleteArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GeneratedImage.
     * @param {GeneratedImageUpdateArgs} args - Arguments to update one GeneratedImage.
     * @example
     * // Update one GeneratedImage
     * const generatedImage = await prisma.generatedImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GeneratedImageUpdateArgs>(args: SelectSubset<T, GeneratedImageUpdateArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GeneratedImages.
     * @param {GeneratedImageDeleteManyArgs} args - Arguments to filter GeneratedImages to delete.
     * @example
     * // Delete a few GeneratedImages
     * const { count } = await prisma.generatedImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GeneratedImageDeleteManyArgs>(args?: SelectSubset<T, GeneratedImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GeneratedImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GeneratedImages
     * const generatedImage = await prisma.generatedImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GeneratedImageUpdateManyArgs>(args: SelectSubset<T, GeneratedImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GeneratedImages and returns the data updated in the database.
     * @param {GeneratedImageUpdateManyAndReturnArgs} args - Arguments to update many GeneratedImages.
     * @example
     * // Update many GeneratedImages
     * const generatedImage = await prisma.generatedImage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GeneratedImages and only return the `id`
     * const generatedImageWithIdOnly = await prisma.generatedImage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GeneratedImageUpdateManyAndReturnArgs>(args: SelectSubset<T, GeneratedImageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GeneratedImage.
     * @param {GeneratedImageUpsertArgs} args - Arguments to update or create a GeneratedImage.
     * @example
     * // Update or create a GeneratedImage
     * const generatedImage = await prisma.generatedImage.upsert({
     *   create: {
     *     // ... data to create a GeneratedImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GeneratedImage we want to update
     *   }
     * })
     */
    upsert<T extends GeneratedImageUpsertArgs>(args: SelectSubset<T, GeneratedImageUpsertArgs<ExtArgs>>): Prisma__GeneratedImageClient<$Result.GetResult<Prisma.$GeneratedImagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GeneratedImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageCountArgs} args - Arguments to filter GeneratedImages to count.
     * @example
     * // Count the number of GeneratedImages
     * const count = await prisma.generatedImage.count({
     *   where: {
     *     // ... the filter for the GeneratedImages we want to count
     *   }
     * })
    **/
    count<T extends GeneratedImageCountArgs>(
      args?: Subset<T, GeneratedImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GeneratedImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GeneratedImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GeneratedImageAggregateArgs>(args: Subset<T, GeneratedImageAggregateArgs>): Prisma.PrismaPromise<GetGeneratedImageAggregateType<T>>

    /**
     * Group by GeneratedImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GeneratedImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GeneratedImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GeneratedImageGroupByArgs['orderBy'] }
        : { orderBy?: GeneratedImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GeneratedImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGeneratedImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GeneratedImage model
   */
  readonly fields: GeneratedImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GeneratedImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GeneratedImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    dream<T extends DreamDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DreamDefaultArgs<ExtArgs>>): Prisma__DreamClient<$Result.GetResult<Prisma.$DreamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GeneratedImage model
   */
  interface GeneratedImageFieldRefs {
    readonly id: FieldRef<"GeneratedImage", 'Int'>
    readonly createdAt: FieldRef<"GeneratedImage", 'DateTime'>
    readonly updatedAt: FieldRef<"GeneratedImage", 'DateTime'>
    readonly imageUrl: FieldRef<"GeneratedImage", 'String'>
    readonly promptText: FieldRef<"GeneratedImage", 'String'>
    readonly graphState: FieldRef<"GeneratedImage", 'Json'>
    readonly dreamId: FieldRef<"GeneratedImage", 'Int'>
    readonly userId: FieldRef<"GeneratedImage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * GeneratedImage findUnique
   */
  export type GeneratedImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter, which GeneratedImage to fetch.
     */
    where: GeneratedImageWhereUniqueInput
  }

  /**
   * GeneratedImage findUniqueOrThrow
   */
  export type GeneratedImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter, which GeneratedImage to fetch.
     */
    where: GeneratedImageWhereUniqueInput
  }

  /**
   * GeneratedImage findFirst
   */
  export type GeneratedImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter, which GeneratedImage to fetch.
     */
    where?: GeneratedImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GeneratedImages to fetch.
     */
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GeneratedImages.
     */
    cursor?: GeneratedImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GeneratedImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GeneratedImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GeneratedImages.
     */
    distinct?: GeneratedImageScalarFieldEnum | GeneratedImageScalarFieldEnum[]
  }

  /**
   * GeneratedImage findFirstOrThrow
   */
  export type GeneratedImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter, which GeneratedImage to fetch.
     */
    where?: GeneratedImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GeneratedImages to fetch.
     */
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GeneratedImages.
     */
    cursor?: GeneratedImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GeneratedImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GeneratedImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GeneratedImages.
     */
    distinct?: GeneratedImageScalarFieldEnum | GeneratedImageScalarFieldEnum[]
  }

  /**
   * GeneratedImage findMany
   */
  export type GeneratedImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter, which GeneratedImages to fetch.
     */
    where?: GeneratedImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GeneratedImages to fetch.
     */
    orderBy?: GeneratedImageOrderByWithRelationInput | GeneratedImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GeneratedImages.
     */
    cursor?: GeneratedImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GeneratedImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GeneratedImages.
     */
    skip?: number
    distinct?: GeneratedImageScalarFieldEnum | GeneratedImageScalarFieldEnum[]
  }

  /**
   * GeneratedImage create
   */
  export type GeneratedImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * The data needed to create a GeneratedImage.
     */
    data: XOR<GeneratedImageCreateInput, GeneratedImageUncheckedCreateInput>
  }

  /**
   * GeneratedImage createMany
   */
  export type GeneratedImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GeneratedImages.
     */
    data: GeneratedImageCreateManyInput | GeneratedImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GeneratedImage createManyAndReturn
   */
  export type GeneratedImageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * The data used to create many GeneratedImages.
     */
    data: GeneratedImageCreateManyInput | GeneratedImageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GeneratedImage update
   */
  export type GeneratedImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * The data needed to update a GeneratedImage.
     */
    data: XOR<GeneratedImageUpdateInput, GeneratedImageUncheckedUpdateInput>
    /**
     * Choose, which GeneratedImage to update.
     */
    where: GeneratedImageWhereUniqueInput
  }

  /**
   * GeneratedImage updateMany
   */
  export type GeneratedImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GeneratedImages.
     */
    data: XOR<GeneratedImageUpdateManyMutationInput, GeneratedImageUncheckedUpdateManyInput>
    /**
     * Filter which GeneratedImages to update
     */
    where?: GeneratedImageWhereInput
    /**
     * Limit how many GeneratedImages to update.
     */
    limit?: number
  }

  /**
   * GeneratedImage updateManyAndReturn
   */
  export type GeneratedImageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * The data used to update GeneratedImages.
     */
    data: XOR<GeneratedImageUpdateManyMutationInput, GeneratedImageUncheckedUpdateManyInput>
    /**
     * Filter which GeneratedImages to update
     */
    where?: GeneratedImageWhereInput
    /**
     * Limit how many GeneratedImages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GeneratedImage upsert
   */
  export type GeneratedImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * The filter to search for the GeneratedImage to update in case it exists.
     */
    where: GeneratedImageWhereUniqueInput
    /**
     * In case the GeneratedImage found by the `where` argument doesn't exist, create a new GeneratedImage with this data.
     */
    create: XOR<GeneratedImageCreateInput, GeneratedImageUncheckedCreateInput>
    /**
     * In case the GeneratedImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GeneratedImageUpdateInput, GeneratedImageUncheckedUpdateInput>
  }

  /**
   * GeneratedImage delete
   */
  export type GeneratedImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
    /**
     * Filter which GeneratedImage to delete.
     */
    where: GeneratedImageWhereUniqueInput
  }

  /**
   * GeneratedImage deleteMany
   */
  export type GeneratedImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GeneratedImages to delete
     */
    where?: GeneratedImageWhereInput
    /**
     * Limit how many GeneratedImages to delete.
     */
    limit?: number
  }

  /**
   * GeneratedImage without action
   */
  export type GeneratedImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GeneratedImage
     */
    select?: GeneratedImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GeneratedImage
     */
    omit?: GeneratedImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GeneratedImageInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    emailVerified: 'emailVerified',
    passwordHash: 'passwordHash',
    image: 'image',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const DreamScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    title: 'title',
    data: 'data',
    userId: 'userId'
  };

  export type DreamScalarFieldEnum = (typeof DreamScalarFieldEnum)[keyof typeof DreamScalarFieldEnum]


  export const GeneratedImageScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    imageUrl: 'imageUrl',
    promptText: 'promptText',
    graphState: 'graphState',
    dreamId: 'dreamId',
    userId: 'userId'
  };

  export type GeneratedImageScalarFieldEnum = (typeof GeneratedImageScalarFieldEnum)[keyof typeof GeneratedImageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    email?: StringNullableFilter<"User"> | string | null
    emailVerified?: DateTimeNullableFilter<"User"> | Date | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    dreams?: DreamListRelationFilter
    generatedImages?: GeneratedImageListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    emailVerified?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dreams?: DreamOrderByRelationAggregateInput
    generatedImages?: GeneratedImageOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    emailVerified?: DateTimeNullableFilter<"User"> | Date | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    dreams?: DreamListRelationFilter
    generatedImages?: GeneratedImageListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    emailVerified?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailVerified?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    passwordHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    image?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type DreamWhereInput = {
    AND?: DreamWhereInput | DreamWhereInput[]
    OR?: DreamWhereInput[]
    NOT?: DreamWhereInput | DreamWhereInput[]
    id?: IntFilter<"Dream"> | number
    createdAt?: DateTimeFilter<"Dream"> | Date | string
    title?: StringNullableFilter<"Dream"> | string | null
    data?: JsonFilter<"Dream">
    userId?: StringFilter<"Dream"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    generatedImages?: GeneratedImageListRelationFilter
  }

  export type DreamOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrderInput | SortOrder
    data?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
    generatedImages?: GeneratedImageOrderByRelationAggregateInput
  }

  export type DreamWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: DreamWhereInput | DreamWhereInput[]
    OR?: DreamWhereInput[]
    NOT?: DreamWhereInput | DreamWhereInput[]
    createdAt?: DateTimeFilter<"Dream"> | Date | string
    title?: StringNullableFilter<"Dream"> | string | null
    data?: JsonFilter<"Dream">
    userId?: StringFilter<"Dream"> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    generatedImages?: GeneratedImageListRelationFilter
  }, "id">

  export type DreamOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrderInput | SortOrder
    data?: SortOrder
    userId?: SortOrder
    _count?: DreamCountOrderByAggregateInput
    _avg?: DreamAvgOrderByAggregateInput
    _max?: DreamMaxOrderByAggregateInput
    _min?: DreamMinOrderByAggregateInput
    _sum?: DreamSumOrderByAggregateInput
  }

  export type DreamScalarWhereWithAggregatesInput = {
    AND?: DreamScalarWhereWithAggregatesInput | DreamScalarWhereWithAggregatesInput[]
    OR?: DreamScalarWhereWithAggregatesInput[]
    NOT?: DreamScalarWhereWithAggregatesInput | DreamScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Dream"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Dream"> | Date | string
    title?: StringNullableWithAggregatesFilter<"Dream"> | string | null
    data?: JsonWithAggregatesFilter<"Dream">
    userId?: StringWithAggregatesFilter<"Dream"> | string
  }

  export type GeneratedImageWhereInput = {
    AND?: GeneratedImageWhereInput | GeneratedImageWhereInput[]
    OR?: GeneratedImageWhereInput[]
    NOT?: GeneratedImageWhereInput | GeneratedImageWhereInput[]
    id?: IntFilter<"GeneratedImage"> | number
    createdAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    updatedAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    imageUrl?: StringFilter<"GeneratedImage"> | string
    promptText?: StringNullableFilter<"GeneratedImage"> | string | null
    graphState?: JsonNullableFilter<"GeneratedImage">
    dreamId?: IntFilter<"GeneratedImage"> | number
    userId?: StringFilter<"GeneratedImage"> | string
    dream?: XOR<DreamScalarRelationFilter, DreamWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type GeneratedImageOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    imageUrl?: SortOrder
    promptText?: SortOrderInput | SortOrder
    graphState?: SortOrderInput | SortOrder
    dreamId?: SortOrder
    userId?: SortOrder
    dream?: DreamOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type GeneratedImageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: GeneratedImageWhereInput | GeneratedImageWhereInput[]
    OR?: GeneratedImageWhereInput[]
    NOT?: GeneratedImageWhereInput | GeneratedImageWhereInput[]
    createdAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    updatedAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    imageUrl?: StringFilter<"GeneratedImage"> | string
    promptText?: StringNullableFilter<"GeneratedImage"> | string | null
    graphState?: JsonNullableFilter<"GeneratedImage">
    dreamId?: IntFilter<"GeneratedImage"> | number
    userId?: StringFilter<"GeneratedImage"> | string
    dream?: XOR<DreamScalarRelationFilter, DreamWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type GeneratedImageOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    imageUrl?: SortOrder
    promptText?: SortOrderInput | SortOrder
    graphState?: SortOrderInput | SortOrder
    dreamId?: SortOrder
    userId?: SortOrder
    _count?: GeneratedImageCountOrderByAggregateInput
    _avg?: GeneratedImageAvgOrderByAggregateInput
    _max?: GeneratedImageMaxOrderByAggregateInput
    _min?: GeneratedImageMinOrderByAggregateInput
    _sum?: GeneratedImageSumOrderByAggregateInput
  }

  export type GeneratedImageScalarWhereWithAggregatesInput = {
    AND?: GeneratedImageScalarWhereWithAggregatesInput | GeneratedImageScalarWhereWithAggregatesInput[]
    OR?: GeneratedImageScalarWhereWithAggregatesInput[]
    NOT?: GeneratedImageScalarWhereWithAggregatesInput | GeneratedImageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"GeneratedImage"> | number
    createdAt?: DateTimeWithAggregatesFilter<"GeneratedImage"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"GeneratedImage"> | Date | string
    imageUrl?: StringWithAggregatesFilter<"GeneratedImage"> | string
    promptText?: StringNullableWithAggregatesFilter<"GeneratedImage"> | string | null
    graphState?: JsonNullableWithAggregatesFilter<"GeneratedImage">
    dreamId?: IntWithAggregatesFilter<"GeneratedImage"> | number
    userId?: StringWithAggregatesFilter<"GeneratedImage"> | string
  }

  export type UserCreateInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    dreams?: DreamCreateNestedManyWithoutUserInput
    generatedImages?: GeneratedImageCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    dreams?: DreamUncheckedCreateNestedManyWithoutUserInput
    generatedImages?: GeneratedImageUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dreams?: DreamUpdateManyWithoutUserNestedInput
    generatedImages?: GeneratedImageUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dreams?: DreamUncheckedUpdateManyWithoutUserNestedInput
    generatedImages?: GeneratedImageUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DreamCreateInput = {
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    user: UserCreateNestedOneWithoutDreamsInput
    generatedImages?: GeneratedImageCreateNestedManyWithoutDreamInput
  }

  export type DreamUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    userId: string
    generatedImages?: GeneratedImageUncheckedCreateNestedManyWithoutDreamInput
  }

  export type DreamUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    user?: UserUpdateOneRequiredWithoutDreamsNestedInput
    generatedImages?: GeneratedImageUpdateManyWithoutDreamNestedInput
  }

  export type DreamUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    userId?: StringFieldUpdateOperationsInput | string
    generatedImages?: GeneratedImageUncheckedUpdateManyWithoutDreamNestedInput
  }

  export type DreamCreateManyInput = {
    id?: number
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    userId: string
  }

  export type DreamUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
  }

  export type DreamUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type GeneratedImageCreateInput = {
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dream: DreamCreateNestedOneWithoutGeneratedImagesInput
    user: UserCreateNestedOneWithoutGeneratedImagesInput
  }

  export type GeneratedImageUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId: number
    userId: string
  }

  export type GeneratedImageUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dream?: DreamUpdateOneRequiredWithoutGeneratedImagesNestedInput
    user?: UserUpdateOneRequiredWithoutGeneratedImagesNestedInput
  }

  export type GeneratedImageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId?: IntFieldUpdateOperationsInput | number
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type GeneratedImageCreateManyInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId: number
    userId: string
  }

  export type GeneratedImageUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
  }

  export type GeneratedImageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId?: IntFieldUpdateOperationsInput | number
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DreamListRelationFilter = {
    every?: DreamWhereInput
    some?: DreamWhereInput
    none?: DreamWhereInput
  }

  export type GeneratedImageListRelationFilter = {
    every?: GeneratedImageWhereInput
    some?: GeneratedImageWhereInput
    none?: GeneratedImageWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type DreamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GeneratedImageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    passwordHash?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    passwordHash?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    passwordHash?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type DreamCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    data?: SortOrder
    userId?: SortOrder
  }

  export type DreamAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DreamMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    userId?: SortOrder
  }

  export type DreamMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    userId?: SortOrder
  }

  export type DreamSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DreamScalarRelationFilter = {
    is?: DreamWhereInput
    isNot?: DreamWhereInput
  }

  export type GeneratedImageCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    imageUrl?: SortOrder
    promptText?: SortOrder
    graphState?: SortOrder
    dreamId?: SortOrder
    userId?: SortOrder
  }

  export type GeneratedImageAvgOrderByAggregateInput = {
    id?: SortOrder
    dreamId?: SortOrder
  }

  export type GeneratedImageMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    imageUrl?: SortOrder
    promptText?: SortOrder
    dreamId?: SortOrder
    userId?: SortOrder
  }

  export type GeneratedImageMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    imageUrl?: SortOrder
    promptText?: SortOrder
    dreamId?: SortOrder
    userId?: SortOrder
  }

  export type GeneratedImageSumOrderByAggregateInput = {
    id?: SortOrder
    dreamId?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DreamCreateNestedManyWithoutUserInput = {
    create?: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput> | DreamCreateWithoutUserInput[] | DreamUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DreamCreateOrConnectWithoutUserInput | DreamCreateOrConnectWithoutUserInput[]
    createMany?: DreamCreateManyUserInputEnvelope
    connect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
  }

  export type GeneratedImageCreateNestedManyWithoutUserInput = {
    create?: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput> | GeneratedImageCreateWithoutUserInput[] | GeneratedImageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutUserInput | GeneratedImageCreateOrConnectWithoutUserInput[]
    createMany?: GeneratedImageCreateManyUserInputEnvelope
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
  }

  export type DreamUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput> | DreamCreateWithoutUserInput[] | DreamUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DreamCreateOrConnectWithoutUserInput | DreamCreateOrConnectWithoutUserInput[]
    createMany?: DreamCreateManyUserInputEnvelope
    connect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
  }

  export type GeneratedImageUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput> | GeneratedImageCreateWithoutUserInput[] | GeneratedImageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutUserInput | GeneratedImageCreateOrConnectWithoutUserInput[]
    createMany?: GeneratedImageCreateManyUserInputEnvelope
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type DreamUpdateManyWithoutUserNestedInput = {
    create?: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput> | DreamCreateWithoutUserInput[] | DreamUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DreamCreateOrConnectWithoutUserInput | DreamCreateOrConnectWithoutUserInput[]
    upsert?: DreamUpsertWithWhereUniqueWithoutUserInput | DreamUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DreamCreateManyUserInputEnvelope
    set?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    disconnect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    delete?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    connect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    update?: DreamUpdateWithWhereUniqueWithoutUserInput | DreamUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DreamUpdateManyWithWhereWithoutUserInput | DreamUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DreamScalarWhereInput | DreamScalarWhereInput[]
  }

  export type GeneratedImageUpdateManyWithoutUserNestedInput = {
    create?: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput> | GeneratedImageCreateWithoutUserInput[] | GeneratedImageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutUserInput | GeneratedImageCreateOrConnectWithoutUserInput[]
    upsert?: GeneratedImageUpsertWithWhereUniqueWithoutUserInput | GeneratedImageUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GeneratedImageCreateManyUserInputEnvelope
    set?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    disconnect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    delete?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    update?: GeneratedImageUpdateWithWhereUniqueWithoutUserInput | GeneratedImageUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GeneratedImageUpdateManyWithWhereWithoutUserInput | GeneratedImageUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
  }

  export type DreamUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput> | DreamCreateWithoutUserInput[] | DreamUncheckedCreateWithoutUserInput[]
    connectOrCreate?: DreamCreateOrConnectWithoutUserInput | DreamCreateOrConnectWithoutUserInput[]
    upsert?: DreamUpsertWithWhereUniqueWithoutUserInput | DreamUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: DreamCreateManyUserInputEnvelope
    set?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    disconnect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    delete?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    connect?: DreamWhereUniqueInput | DreamWhereUniqueInput[]
    update?: DreamUpdateWithWhereUniqueWithoutUserInput | DreamUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: DreamUpdateManyWithWhereWithoutUserInput | DreamUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: DreamScalarWhereInput | DreamScalarWhereInput[]
  }

  export type GeneratedImageUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput> | GeneratedImageCreateWithoutUserInput[] | GeneratedImageUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutUserInput | GeneratedImageCreateOrConnectWithoutUserInput[]
    upsert?: GeneratedImageUpsertWithWhereUniqueWithoutUserInput | GeneratedImageUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GeneratedImageCreateManyUserInputEnvelope
    set?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    disconnect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    delete?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    update?: GeneratedImageUpdateWithWhereUniqueWithoutUserInput | GeneratedImageUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GeneratedImageUpdateManyWithWhereWithoutUserInput | GeneratedImageUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutDreamsInput = {
    create?: XOR<UserCreateWithoutDreamsInput, UserUncheckedCreateWithoutDreamsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDreamsInput
    connect?: UserWhereUniqueInput
  }

  export type GeneratedImageCreateNestedManyWithoutDreamInput = {
    create?: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput> | GeneratedImageCreateWithoutDreamInput[] | GeneratedImageUncheckedCreateWithoutDreamInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutDreamInput | GeneratedImageCreateOrConnectWithoutDreamInput[]
    createMany?: GeneratedImageCreateManyDreamInputEnvelope
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
  }

  export type GeneratedImageUncheckedCreateNestedManyWithoutDreamInput = {
    create?: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput> | GeneratedImageCreateWithoutDreamInput[] | GeneratedImageUncheckedCreateWithoutDreamInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutDreamInput | GeneratedImageCreateOrConnectWithoutDreamInput[]
    createMany?: GeneratedImageCreateManyDreamInputEnvelope
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutDreamsNestedInput = {
    create?: XOR<UserCreateWithoutDreamsInput, UserUncheckedCreateWithoutDreamsInput>
    connectOrCreate?: UserCreateOrConnectWithoutDreamsInput
    upsert?: UserUpsertWithoutDreamsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDreamsInput, UserUpdateWithoutDreamsInput>, UserUncheckedUpdateWithoutDreamsInput>
  }

  export type GeneratedImageUpdateManyWithoutDreamNestedInput = {
    create?: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput> | GeneratedImageCreateWithoutDreamInput[] | GeneratedImageUncheckedCreateWithoutDreamInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutDreamInput | GeneratedImageCreateOrConnectWithoutDreamInput[]
    upsert?: GeneratedImageUpsertWithWhereUniqueWithoutDreamInput | GeneratedImageUpsertWithWhereUniqueWithoutDreamInput[]
    createMany?: GeneratedImageCreateManyDreamInputEnvelope
    set?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    disconnect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    delete?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    update?: GeneratedImageUpdateWithWhereUniqueWithoutDreamInput | GeneratedImageUpdateWithWhereUniqueWithoutDreamInput[]
    updateMany?: GeneratedImageUpdateManyWithWhereWithoutDreamInput | GeneratedImageUpdateManyWithWhereWithoutDreamInput[]
    deleteMany?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type GeneratedImageUncheckedUpdateManyWithoutDreamNestedInput = {
    create?: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput> | GeneratedImageCreateWithoutDreamInput[] | GeneratedImageUncheckedCreateWithoutDreamInput[]
    connectOrCreate?: GeneratedImageCreateOrConnectWithoutDreamInput | GeneratedImageCreateOrConnectWithoutDreamInput[]
    upsert?: GeneratedImageUpsertWithWhereUniqueWithoutDreamInput | GeneratedImageUpsertWithWhereUniqueWithoutDreamInput[]
    createMany?: GeneratedImageCreateManyDreamInputEnvelope
    set?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    disconnect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    delete?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    connect?: GeneratedImageWhereUniqueInput | GeneratedImageWhereUniqueInput[]
    update?: GeneratedImageUpdateWithWhereUniqueWithoutDreamInput | GeneratedImageUpdateWithWhereUniqueWithoutDreamInput[]
    updateMany?: GeneratedImageUpdateManyWithWhereWithoutDreamInput | GeneratedImageUpdateManyWithWhereWithoutDreamInput[]
    deleteMany?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
  }

  export type DreamCreateNestedOneWithoutGeneratedImagesInput = {
    create?: XOR<DreamCreateWithoutGeneratedImagesInput, DreamUncheckedCreateWithoutGeneratedImagesInput>
    connectOrCreate?: DreamCreateOrConnectWithoutGeneratedImagesInput
    connect?: DreamWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutGeneratedImagesInput = {
    create?: XOR<UserCreateWithoutGeneratedImagesInput, UserUncheckedCreateWithoutGeneratedImagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGeneratedImagesInput
    connect?: UserWhereUniqueInput
  }

  export type DreamUpdateOneRequiredWithoutGeneratedImagesNestedInput = {
    create?: XOR<DreamCreateWithoutGeneratedImagesInput, DreamUncheckedCreateWithoutGeneratedImagesInput>
    connectOrCreate?: DreamCreateOrConnectWithoutGeneratedImagesInput
    upsert?: DreamUpsertWithoutGeneratedImagesInput
    connect?: DreamWhereUniqueInput
    update?: XOR<XOR<DreamUpdateToOneWithWhereWithoutGeneratedImagesInput, DreamUpdateWithoutGeneratedImagesInput>, DreamUncheckedUpdateWithoutGeneratedImagesInput>
  }

  export type UserUpdateOneRequiredWithoutGeneratedImagesNestedInput = {
    create?: XOR<UserCreateWithoutGeneratedImagesInput, UserUncheckedCreateWithoutGeneratedImagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGeneratedImagesInput
    upsert?: UserUpsertWithoutGeneratedImagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutGeneratedImagesInput, UserUpdateWithoutGeneratedImagesInput>, UserUncheckedUpdateWithoutGeneratedImagesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DreamCreateWithoutUserInput = {
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    generatedImages?: GeneratedImageCreateNestedManyWithoutDreamInput
  }

  export type DreamUncheckedCreateWithoutUserInput = {
    id?: number
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    generatedImages?: GeneratedImageUncheckedCreateNestedManyWithoutDreamInput
  }

  export type DreamCreateOrConnectWithoutUserInput = {
    where: DreamWhereUniqueInput
    create: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput>
  }

  export type DreamCreateManyUserInputEnvelope = {
    data: DreamCreateManyUserInput | DreamCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type GeneratedImageCreateWithoutUserInput = {
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dream: DreamCreateNestedOneWithoutGeneratedImagesInput
  }

  export type GeneratedImageUncheckedCreateWithoutUserInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId: number
  }

  export type GeneratedImageCreateOrConnectWithoutUserInput = {
    where: GeneratedImageWhereUniqueInput
    create: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput>
  }

  export type GeneratedImageCreateManyUserInputEnvelope = {
    data: GeneratedImageCreateManyUserInput | GeneratedImageCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type DreamUpsertWithWhereUniqueWithoutUserInput = {
    where: DreamWhereUniqueInput
    update: XOR<DreamUpdateWithoutUserInput, DreamUncheckedUpdateWithoutUserInput>
    create: XOR<DreamCreateWithoutUserInput, DreamUncheckedCreateWithoutUserInput>
  }

  export type DreamUpdateWithWhereUniqueWithoutUserInput = {
    where: DreamWhereUniqueInput
    data: XOR<DreamUpdateWithoutUserInput, DreamUncheckedUpdateWithoutUserInput>
  }

  export type DreamUpdateManyWithWhereWithoutUserInput = {
    where: DreamScalarWhereInput
    data: XOR<DreamUpdateManyMutationInput, DreamUncheckedUpdateManyWithoutUserInput>
  }

  export type DreamScalarWhereInput = {
    AND?: DreamScalarWhereInput | DreamScalarWhereInput[]
    OR?: DreamScalarWhereInput[]
    NOT?: DreamScalarWhereInput | DreamScalarWhereInput[]
    id?: IntFilter<"Dream"> | number
    createdAt?: DateTimeFilter<"Dream"> | Date | string
    title?: StringNullableFilter<"Dream"> | string | null
    data?: JsonFilter<"Dream">
    userId?: StringFilter<"Dream"> | string
  }

  export type GeneratedImageUpsertWithWhereUniqueWithoutUserInput = {
    where: GeneratedImageWhereUniqueInput
    update: XOR<GeneratedImageUpdateWithoutUserInput, GeneratedImageUncheckedUpdateWithoutUserInput>
    create: XOR<GeneratedImageCreateWithoutUserInput, GeneratedImageUncheckedCreateWithoutUserInput>
  }

  export type GeneratedImageUpdateWithWhereUniqueWithoutUserInput = {
    where: GeneratedImageWhereUniqueInput
    data: XOR<GeneratedImageUpdateWithoutUserInput, GeneratedImageUncheckedUpdateWithoutUserInput>
  }

  export type GeneratedImageUpdateManyWithWhereWithoutUserInput = {
    where: GeneratedImageScalarWhereInput
    data: XOR<GeneratedImageUpdateManyMutationInput, GeneratedImageUncheckedUpdateManyWithoutUserInput>
  }

  export type GeneratedImageScalarWhereInput = {
    AND?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
    OR?: GeneratedImageScalarWhereInput[]
    NOT?: GeneratedImageScalarWhereInput | GeneratedImageScalarWhereInput[]
    id?: IntFilter<"GeneratedImage"> | number
    createdAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    updatedAt?: DateTimeFilter<"GeneratedImage"> | Date | string
    imageUrl?: StringFilter<"GeneratedImage"> | string
    promptText?: StringNullableFilter<"GeneratedImage"> | string | null
    graphState?: JsonNullableFilter<"GeneratedImage">
    dreamId?: IntFilter<"GeneratedImage"> | number
    userId?: StringFilter<"GeneratedImage"> | string
  }

  export type UserCreateWithoutDreamsInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    generatedImages?: GeneratedImageCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutDreamsInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    generatedImages?: GeneratedImageUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutDreamsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDreamsInput, UserUncheckedCreateWithoutDreamsInput>
  }

  export type GeneratedImageCreateWithoutDreamInput = {
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    user: UserCreateNestedOneWithoutGeneratedImagesInput
  }

  export type GeneratedImageUncheckedCreateWithoutDreamInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    userId: string
  }

  export type GeneratedImageCreateOrConnectWithoutDreamInput = {
    where: GeneratedImageWhereUniqueInput
    create: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput>
  }

  export type GeneratedImageCreateManyDreamInputEnvelope = {
    data: GeneratedImageCreateManyDreamInput | GeneratedImageCreateManyDreamInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutDreamsInput = {
    update: XOR<UserUpdateWithoutDreamsInput, UserUncheckedUpdateWithoutDreamsInput>
    create: XOR<UserCreateWithoutDreamsInput, UserUncheckedCreateWithoutDreamsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDreamsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDreamsInput, UserUncheckedUpdateWithoutDreamsInput>
  }

  export type UserUpdateWithoutDreamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generatedImages?: GeneratedImageUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutDreamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    generatedImages?: GeneratedImageUncheckedUpdateManyWithoutUserNestedInput
  }

  export type GeneratedImageUpsertWithWhereUniqueWithoutDreamInput = {
    where: GeneratedImageWhereUniqueInput
    update: XOR<GeneratedImageUpdateWithoutDreamInput, GeneratedImageUncheckedUpdateWithoutDreamInput>
    create: XOR<GeneratedImageCreateWithoutDreamInput, GeneratedImageUncheckedCreateWithoutDreamInput>
  }

  export type GeneratedImageUpdateWithWhereUniqueWithoutDreamInput = {
    where: GeneratedImageWhereUniqueInput
    data: XOR<GeneratedImageUpdateWithoutDreamInput, GeneratedImageUncheckedUpdateWithoutDreamInput>
  }

  export type GeneratedImageUpdateManyWithWhereWithoutDreamInput = {
    where: GeneratedImageScalarWhereInput
    data: XOR<GeneratedImageUpdateManyMutationInput, GeneratedImageUncheckedUpdateManyWithoutDreamInput>
  }

  export type DreamCreateWithoutGeneratedImagesInput = {
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    user: UserCreateNestedOneWithoutDreamsInput
  }

  export type DreamUncheckedCreateWithoutGeneratedImagesInput = {
    id?: number
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
    userId: string
  }

  export type DreamCreateOrConnectWithoutGeneratedImagesInput = {
    where: DreamWhereUniqueInput
    create: XOR<DreamCreateWithoutGeneratedImagesInput, DreamUncheckedCreateWithoutGeneratedImagesInput>
  }

  export type UserCreateWithoutGeneratedImagesInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    dreams?: DreamCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutGeneratedImagesInput = {
    id?: string
    name?: string | null
    email?: string | null
    emailVerified?: Date | string | null
    passwordHash?: string | null
    image?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    dreams?: DreamUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutGeneratedImagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutGeneratedImagesInput, UserUncheckedCreateWithoutGeneratedImagesInput>
  }

  export type DreamUpsertWithoutGeneratedImagesInput = {
    update: XOR<DreamUpdateWithoutGeneratedImagesInput, DreamUncheckedUpdateWithoutGeneratedImagesInput>
    create: XOR<DreamCreateWithoutGeneratedImagesInput, DreamUncheckedCreateWithoutGeneratedImagesInput>
    where?: DreamWhereInput
  }

  export type DreamUpdateToOneWithWhereWithoutGeneratedImagesInput = {
    where?: DreamWhereInput
    data: XOR<DreamUpdateWithoutGeneratedImagesInput, DreamUncheckedUpdateWithoutGeneratedImagesInput>
  }

  export type DreamUpdateWithoutGeneratedImagesInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    user?: UserUpdateOneRequiredWithoutDreamsNestedInput
  }

  export type DreamUncheckedUpdateWithoutGeneratedImagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type UserUpsertWithoutGeneratedImagesInput = {
    update: XOR<UserUpdateWithoutGeneratedImagesInput, UserUncheckedUpdateWithoutGeneratedImagesInput>
    create: XOR<UserCreateWithoutGeneratedImagesInput, UserUncheckedCreateWithoutGeneratedImagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutGeneratedImagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutGeneratedImagesInput, UserUncheckedUpdateWithoutGeneratedImagesInput>
  }

  export type UserUpdateWithoutGeneratedImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dreams?: DreamUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutGeneratedImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerified?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dreams?: DreamUncheckedUpdateManyWithoutUserNestedInput
  }

  export type DreamCreateManyUserInput = {
    id?: number
    createdAt?: Date | string
    title?: string | null
    data: JsonNullValueInput | InputJsonValue
  }

  export type GeneratedImageCreateManyUserInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId: number
  }

  export type DreamUpdateWithoutUserInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    generatedImages?: GeneratedImageUpdateManyWithoutDreamNestedInput
  }

  export type DreamUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
    generatedImages?: GeneratedImageUncheckedUpdateManyWithoutDreamNestedInput
  }

  export type DreamUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    data?: JsonNullValueInput | InputJsonValue
  }

  export type GeneratedImageUpdateWithoutUserInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dream?: DreamUpdateOneRequiredWithoutGeneratedImagesNestedInput
  }

  export type GeneratedImageUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId?: IntFieldUpdateOperationsInput | number
  }

  export type GeneratedImageUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    dreamId?: IntFieldUpdateOperationsInput | number
  }

  export type GeneratedImageCreateManyDreamInput = {
    id?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    imageUrl: string
    promptText?: string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    userId: string
  }

  export type GeneratedImageUpdateWithoutDreamInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    user?: UserUpdateOneRequiredWithoutGeneratedImagesNestedInput
  }

  export type GeneratedImageUncheckedUpdateWithoutDreamInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type GeneratedImageUncheckedUpdateManyWithoutDreamInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    imageUrl?: StringFieldUpdateOperationsInput | string
    promptText?: NullableStringFieldUpdateOperationsInput | string | null
    graphState?: NullableJsonNullValueInput | InputJsonValue
    userId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}