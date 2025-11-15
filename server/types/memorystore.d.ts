declare module "memorystore" {
  import type session from "express-session";
  type Session = typeof session;
  interface MemoryStoreOptions {
    checkPeriod?: number;
  }
  type MemoryStoreConstructor = new (options?: MemoryStoreOptions) => session.Store;
  function createStore(session: Session): MemoryStoreConstructor;
  export default createStore;
}
