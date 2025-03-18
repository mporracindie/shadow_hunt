declare namespace NodeJS {
  interface ProcessEnv {
    SERVER_URL?: string;
    NODE_ENV?: 'development' | 'production';
  }
}

declare const process: {
  env: {
    SERVER_URL?: string;
    NODE_ENV?: 'development' | 'production';
  }
} 