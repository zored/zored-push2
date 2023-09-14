export class Config {
  isDebug() {
    return process.env.DEBUG === '1';
  }
}
