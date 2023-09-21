import * as dotenv from "dotenv";

dotenv.config();

import FrontierSRV from "#struct/FrontierSRV";

const { TOKEN } = process.env;

const srv = new FrontierSRV();

srv.login(TOKEN);
