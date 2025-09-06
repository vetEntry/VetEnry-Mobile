declare module '@react-native-async-storage/async-storage' {
  interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  }
  
  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

declare module '@react-native-community/netinfo' {
  interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
  }
  
  interface NetInfo {
    fetch(): Promise<NetInfoState>;
    addEventListener(listener: (state: NetInfoState) => void): () => void;
  }
  
  const NetInfo: NetInfo;
  export default NetInfo;
}
