const VARIABLES = {
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? (() => { throw new Error("ACCESS_TOKEN_SECRET is not defined") })(),
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? (() => { throw new Error("REFRESH_TOKEN_SECRET is not defined") })(),

};
  
export default VARIABLES;