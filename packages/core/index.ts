import { rewriteApi, rewriteView, rewriteConsole } from "./rewrite";
import MpcStorage from "./storage";

const mpcStorage = new MpcStorage();
rewriteApi(mpcStorage);
rewriteView(mpcStorage);
rewriteConsole(mpcStorage);
