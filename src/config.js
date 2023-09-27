export class Config {
  isDebug() {
    return this.boolEnv('DEBUG');
  }
  isLocal() {
    return this.boolEnv('LOCAL');
  }
  boolEnv(n) {
    return process.env[n] === '1';
  }
}
