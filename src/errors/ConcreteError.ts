export default class ConcreteUtilError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConcreteUtilError';
    }
  }