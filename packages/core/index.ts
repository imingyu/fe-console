import { rewriteApi, rewriteView } from "./rewrite";
import MpcStorage from "./storage";

const mpcStorage = new MpcStorage();
rewriteApi(mpcStorage);
rewriteView(mpcStorage);
