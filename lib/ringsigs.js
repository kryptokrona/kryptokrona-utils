var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
Module["arguments"] = [];
Module["thisProgram"] = "./this.program";
Module["quit"] = (function(status, toThrow) {
 throw toThrow;
});
Module["preRun"] = [];
Module["postRun"] = [];
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
var ENVIRONMENT_IS_REACT_NATIVE = false;

ENVIRONMENT_IS_REACT_NATIVE = typeof global === 'object' && global.navigator && global.navigator.product && global.navigator.product === 'ReactNative';
ENVIRONMENT_IS_WEB = typeof window === 'object' && !ENVIRONMENT_IS_REACT_NATIVE;
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function' && !ENVIRONMENT_IS_REACT_NATIVE;
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_REACT_NATIVE;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_REACT_NATIVE;

var scriptDirectory = "";
function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 } else {
  return scriptDirectory + path;
 }
}
if (ENVIRONMENT_IS_NODE) {
 scriptDirectory = __dirname + "/";
 var nodeFS;
 var nodePath;
 Module["read"] = function shell_read(filename, binary) {
  var ret;
  ret = tryParseAsDataURI(filename);
  if (!ret) {
   if (!nodeFS) nodeFS = require("fs");
   if (!nodePath) nodePath = require("path");
   filename = nodePath["normalize"](filename);
   ret = nodeFS["readFileSync"](filename);
  }
  return binary ? ret : ret.toString();
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 if (process["argv"].length > 1) {
  Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 process["on"]("unhandledRejection", abort);
 Module["quit"] = (function(status) {
  process["exit"](status);
 });
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL || ENVIRONMENT_IS_REACT_NATIVE) {
 if (typeof read != "undefined") {
  Module["read"] = function shell_read(f) {
   var data = tryParseAsDataURI(f);
   if (data) {
    return intArrayToString(data);
   }
   return read(f);
  };
 }
 Module["readBinary"] = function readBinary(f) {
  var data;
  data = tryParseAsDataURI(f);
  if (data) {
   return data;
  }
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof quit === "function") {
  Module["quit"] = (function(status) {
   quit(status);
  });
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 Module["read"] = function shell_read(url) {
  try {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  } catch (err) {
   var data = tryParseAsDataURI(url);
   if (data) {
    return intArrayToString(data);
   }
   throw err;
  }
 };
 if (ENVIRONMENT_IS_WORKER) {
  Module["readBinary"] = function readBinary(url) {
   try {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   } catch (err) {
    var data = tryParseAsDataURI(url);
    if (data) {
     return data;
    }
    throw err;
   }
  };
 }
 Module["readAsync"] = function readAsync(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
    return;
   }
   var data = tryParseAsDataURI(url);
   if (data) {
    onload(data.buffer);
    return;
   }
   onerror();
  };
  xhr.onerror = onerror;
  xhr.send(null);
 };
 Module["setWindowTitle"] = (function(title) {
  document.title = title;
 });
} else {}

/* Export the module so we can require/import it */
if (ENVIRONMENT_IS_REACT_NATIVE) {
  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }
}

var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);
var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);
for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
moduleOverrides = undefined;
var STACK_ALIGN = 16;
function staticAlloc(size) {
 var ret = STATICTOP;
 STATICTOP = STATICTOP + size + 15 & -16;
 return ret;
}
function dynamicAlloc(size) {
 var ret = HEAP32[DYNAMICTOP_PTR >> 2];
 var end = ret + size + 15 & -16;
 HEAP32[DYNAMICTOP_PTR >> 2] = end;
 if (end >= TOTAL_MEMORY) {
  var success = enlargeMemory();
  if (!success) {
   HEAP32[DYNAMICTOP_PTR >> 2] = ret;
   return 0;
  }
 }
 return ret;
}
function alignMemory(size, factor) {
 if (!factor) factor = STACK_ALIGN;
 return Math.ceil(size / factor) * factor;
}
function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
  return 1;
 case "i16":
  return 2;
 case "i32":
  return 4;
 case "i64":
  return 8;
 case "float":
  return 4;
 case "double":
  return 8;
 default:
  {
   if (type[type.length - 1] === "*") {
    return 4;
   } else if (type[0] === "i") {
    var bits = parseInt(type.substr(1));
    assert(bits % 8 === 0);
    return bits / 8;
   } else {
    return 0;
   }
  }
 }
}
function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
 }
}
var jsCallStartIndex = 1;
var functionPointers = new Array(0);
var funcWrappers = {};
function dynCall(sig, ptr, args) {
 if (args && args.length) {
  return Module["dynCall_" + sig].apply(null, [ ptr ].concat(args));
 } else {
  return Module["dynCall_" + sig].call(null, ptr);
 }
}
var tempRet0 = 0;
var setTempRet0 = (function(value) {
 tempRet0 = value;
});
var getTempRet0 = (function() {
 return tempRet0;
});
var GLOBAL_BASE = 8;
var ABORT = false;
var EXITSTATUS = 0;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
function getCFunc(ident) {
 var func = Module["_" + ident];
 assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
 return func;
}
var JSfuncs = {
 "stackSave": (function() {
  stackSave();
 }),
 "stackRestore": (function() {
  stackRestore();
 }),
 "arrayToC": (function(arr) {
  var ret = stackAlloc(arr.length);
  writeArrayToMemory(arr, ret);
  return ret;
 }),
 "stringToC": (function(str) {
  var ret = 0;
  if (str !== null && str !== undefined && str !== 0) {
   var len = (str.length << 2) + 1;
   ret = stackAlloc(len);
   stringToUTF8(str, ret, len);
  }
  return ret;
 })
};
var toC = {
 "string": JSfuncs["stringToC"],
 "array": JSfuncs["arrayToC"]
};
function ccall(ident, returnType, argTypes, args, opts) {
 function convertReturnValue(ret) {
  if (returnType === "string") return Pointer_stringify(ret);
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 ret = convertReturnValue(ret);
 if (stack !== 0) stackRestore(stack);
 return ret;
}
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
var ALLOC_STATIC = 2;
var ALLOC_NONE = 4;
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return UTF8ToString(ptr);
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array, idx) {
 var endPtr = idx;
 while (u8Array[endPtr]) ++endPtr;
 if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
 } else {
  var u0, u1, u2, u3, u4, u5;
  var str = "";
  while (1) {
   u0 = u8Array[idx++];
   if (!u0) return str;
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   u1 = u8Array[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   u2 = u8Array[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u3 = u8Array[idx++] & 63;
    if ((u0 & 248) == 240) {
     u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
    } else {
     u4 = u8Array[idx++] & 63;
     if ((u0 & 252) == 248) {
      u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
     } else {
      u5 = u8Array[idx++] & 63;
      u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
     }
    }
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
}
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function demangle(func) {
 return func;
}
function demangleAll(text) {
 var regex = /__Z[\w\d_]+/g;
 return text.replace(regex, (function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferViews() {
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;
function abortOnCannotGrowMemory() {
 abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}
function enlargeMemory() {
 abortOnCannotGrowMemory();
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
if (Module["buffer"]) {
 buffer = Module["buffer"];
} else {
 {
  buffer = new ArrayBuffer(TOTAL_MEMORY);
 }
 Module["buffer"] = buffer;
}
updateGlobalBufferViews();
function getTotalMemory() {
 return TOTAL_MEMORY;
}
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
function writeArrayToMemory(array, buffer) {
 HEAP8.set(array, buffer);
}
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
if (!Math.imul || Math.imul(4294967295, 5) !== -5) Math.imul = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
if (!Math.clz32) Math.clz32 = (function(x) {
 var n = 32;
 var y = x >> 16;
 if (y) {
  n -= 16;
  x = y;
 }
 y = x >> 8;
 if (y) {
  n -= 8;
  x = y;
 }
 y = x >> 4;
 if (y) {
  n -= 4;
  x = y;
 }
 y = x >> 2;
 if (y) {
  n -= 2;
  x = y;
 }
 y = x >> 1;
 if (y) return n - 2;
 return n - x;
});
if (!Math.trunc) Math.trunc = (function(x) {
 return x < 0 ? Math.ceil(x) : Math.floor(x);
});
var Math_abs = Math.abs;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_min = Math.min;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
 return id;
}
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
 return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
}
STATIC_BASE = GLOBAL_BASE;
STATICTOP = STATIC_BASE + 40672;
__ATINIT__.push({
 func: (function() {
  _init_random();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_crypto_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_turtlecoin_crypto_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_bind_cpp();
 })
});
memoryInitializer = "data:application/octet-stream;base64,AAAAAAAAAAC2eFn/hXLTAL1uFf8PCmoAKcABAJjoef+8PKD/mXHO/wC34v60DUj/AAAAAAAAAACwoA7+08mG/54YjwB/aTUAYAy9AKfX+/+fTID+amXh/x78BACSDK4AAAAAAAAAAABZ8bL+CuWm/3vdKv4eFNQAUoADADDR8wB3eUD/MuOc/wBuxQFnG5AAAAAAAAAAAACFO4wBvfEk//glwwFg3DcAt0w+/8NCPQAyTKQB4aRM/0w9o/91Ph8AUZFA/3ZBDgCic9b/BoouAHzm9P8Kio8ANBrCALj0TACBjykBvvQT/3uqev9igUQAedWTAFZlHv+hZ5sAjFlD/+/lvgFDC7UAxvCJ/u5FvP/qcTz/Jf85/0Wytv6A0LMAdhp9/gMH1v/xMk3/VcvF/9OH+v8ZMGT/u9W0/hFYaQBT0Z4BBXNiAASuPP6rN27/2bUR/xS8qgCSnGb+V9au/3J6mwHpLKoAfwjvAdbs6gCvBdsAMWo9/wZC0P8Cam7/UeoT/9drwP9Dl+4AEyps/+VVcQEyRIf/EWoJADJnAf9QAagBI5ge/xCouQE4Wej/ZdL8ACn6RwDMqk//Di7v/1BN7wC91kv/EY35ACZQTP++VXUAVuSqAJzY0AHDz6T/lkJM/6/hEP+NUGIBTNvyAMaicgAu2pgAmyvx/pugaP+yCfz+ZG7UAA4FpwDp76P/HJedAWWSCv/+nkb+R/nkAFgeMgBEOqD/vxhoAYFCgf/AMlX/CLOK/yb6yQBzUKAAg+ZxAH1YkwBaRMcA/UyeABz/dgBx+v4AQksuAObaKwDleLoBlEQrAIh87gG7a8X/VDX2/zN0/v8zu6UAAhGvAEJUoAH3Oh4AI0E1/kXsvwAthvUBo3vdACBuFP80F6UAutZHAOmwYADy7zYBOVmKAFMAVP+IoGQAXI54/mh8vgC1sT7/+ilVAJiCKgFg/PYAl5c//u+FPgAgOJwALae9/46FswGDVtMAu7OW/vqqDv9EcRX/3ro7/0IH8QFFBkgAVpxs/jenWQBtNNv+DbAX/8Qsav/vlUf/pIx9/5+tAQAzKecAkT4hAIpvXQG5U0UAkHMuAGGXEP8Y5BoAMdniAHFL6v7BmQz/tjBg/w4NGgCAw/n+RcE7AIQlUf59ajwA1vCpAaTjQgDSo04AJTSXAGNNGgDunNX/1cDRAUkuVAAUQSkBNs5PAMmDkv6qbxj/sSEy/qsmy/9O93QA0d2ZAIWAsgE6LBkAySc7Ab0T/AAx5dIBdbt1ALWzuAEActsAMF6TAPUpOAB9Dcz+9K13ACzdIP5U6hQA+aDGAex+6v+PPt0AgVnW/zeLBf5EFL//DsyyASPD2QAvM84BJvalAM4bBv6eVyQA2TSS/3171/9VPB//qw0HANr1WP78IzwAN9ag/4VlOADgIBP+k0DqABqRogFydn0A+Pz6AGVexP/GjeL+Myq2AIcMCf5trNL/xezCAfFBmgAwnC//mUM3/9qlIv5KtLMA2kJHAVh6YwDUtdv/XCrn/+8AmgD1Tbf/XlGqARLV2ACrXUcANF74ABKXof7F0UL/rvQP/qIwtwAxPfD+tl3DAMfkBgHIBRH/iS3t/2yUBABaT+3/Jz9N/zVSzwGOFnb/ZegSAVwaQwAFyFj/IaiK/5XhSAAC0Rv/LPWoAdztEf8e02n+je7dAIBQ9f5v/g4A3l++Ad8J8QCSTNT/bM1o/z91mQCQRTAAI+RvAMAhwf9w1r7+c5iXABdmWAAzSvgA4seP/syiZf/QYb0B9WgSAOb2Hv8XlEUAblg0/uK1Wf/QL1r+cqFQ/yF0+ACzmFf/RZCxAVjuGv86IHEBAU1FADt5NP+Y7lMANAjBAOcn6f/HIooA3kStAFs58v7c0n//wAf2/pcjuwDD7KUAb13OANT3hQGahdH/m+cKAEBOJgB6+WQBHhNh/z5b+QH4hU0AxT+o/nQKUgC47HH+1MvC/z1k/P4kBcr/d1uZ/4FPHQBnZ6v+7ddv/9g1RQDv8BcAwpXd/ybh3gDo/7T+dlKF/znRsQGL6IUAnrAu/sJzLgBY9+UBHGe/AN3er/6V6ywAl+QZ/tppZwCOVdIAlYG+/9VBXv51huD/UsZ1AJ3d3ACjZSQAxXIlAGispv4LtgAAUUi8/2G8EP9FBgoAx5OR/wgJcwFB1q//2a3RAFB/pgD35QT+p7d8/1oczP6vO/D/Cyn4AWwoM/+QscP+lvp+AIpbQQF4PN7/9cHvAB3Wvf+AAhkAUJqiAE3cawHqzUr/NqZn/3RICQDkXi//HsgZ/yPWWf89sIz/U+Kj/0uCrACAJhEAX4mY/9d8nwFPXQAAlFKd/sOC+/8oykz/+37gAJ1jPv7PB+H/YETDAIy6nf+DE+f/KoD+ADTbPf5my0gAjQcL/7qk1QAfencAhfKRAND86P9b1bb/jwT6/vnXSgClHm8BqwnfAOV7IgFcghr/TZstAcOLHP874E4AiBH3AGx5IABP+r3/YOP8/ibxPgA+rn3/m29d/wrmzgFhxSj/ADE5/kH6DQAS+5b/3G3S/wWupv4sgb0A6yOT/yX3jf9IjQT/Z2v/APdaBAA1LCoAAh7wAAQ7PwBYTiQAcae0AL5Hwf/HnqT/OgisAE0hDABBPwMAmU0h/6z+ZgHk3QT/Vx7+AZIpVv+KzO/+bI0R/7vyhwDS0H8ARC0O/klgPgBRPBj/qgYk/wP5GgAj1W0AFoE2/xUj4f/qPTj/OtkGAI98WADsfkIA0Sa3/yLuBv+ukWYAXxbTAMQPmf4uVOj/dSKSAef6Sv8bhmQBXLvD/6rGcAB4HCoA0UZDAB1RHwAdqGQBqa2gAGsjdQA+YDv/UQxFAYfvvv/c/BIAo9w6/4mJvP9TZm0AYAZMAOre0v+5rs0BPJ7V/w3x1gCsgYwAXWjyAMCc+wArdR4A4VGeAH/o2gDiHMsA6RuX/3UrBf/yDi//IRQGAIn7LP4bH/X/t9Z9/ih5lQC6ntX/WQjjAEVYAP7Lh+EAya7LAJNHuAASeSn+XgVOAODW8P4kBbQA+4fnAaOK1ADS+XT+WIG7ABMIMf4+DpD/n0zTANYzUgBtdeT+Z9/L/0v8DwGaR9z/Fw1bAY2oYP+1toUA+jM3AOrq1P6vP54AJ/A0AZ69JP/VKFUBILT3/xNmGgFUGGH/RRXeAJSLev/c1esB6Mv/AHk5kwDjB5oANRaTAUgB4QBShjD+Uzyd/5FIqQAiZ+8AxukvAHQTBP+4agn/t4FTACSw5gEiZ0gA26KGAPUqngAglWD+pSyQAMrvSP7XlgUAKkIkAYTXrwBWrlb/GsWc/zHoh/5ntlIA/YCwAZmyegD1+goA7BiyAIlqhAAoHSkAMh6Y/3xpJgDmv0sAjyuqACyDFP8sDRf/7f+bAZ9tZP9wtRj/aNxsADfTgwBjDNX/mJeR/+4FnwBhmwgAIWxRAAEDZwA+bSL/+pu0ACBHw/8mRpEBn1/1AEXlZQGIHPAAT+AZAE5uef/4qHwAu4D3AAKT6/5PC4QARjoMAbUIo/9PiYX/JaoL/43zVf+w59f/zJak/+/XJ/8uV5z+CKNY/6wi6ABCLGb/GzYp/uxjV/8pe6kBNHIrAHWGKACbhhoA589b/iOEJv8TZn3+JOOF/3YDcf8dDXwAmGBKAViSzv+nv9z+ohJY/7ZkFwAfdTQAUS5qAQwCBwBFUMkB0fasAAwwjQHg01gAdOKfAHpiggBB7OoB4eIJ/8/iewFZ1jsAcIdYAVr0y/8xCyYBgWy6AFlwDwFlLsz/f8wt/k//3f8zSRL/fypl//EVygCg4wcAaTLsAE80xf9oytABtA8QAGXFTv9iTcsAKbnxASPBfAAjmxf/zzXAAAt9owH5nrn/BIMwABVdb/89eecBRcgk/7kwuf9v7hX/JzIZ/2PXo/9X1B7/pJMF/4AGIwFs327/wkyyAEpltADzLzAArhkr/1Kt/QE2csD/KDdbANdssP8LOAcA4OlMANFiyv7yGX0ALMFd/ssIsQCHsBMAcEfV/847sAEEQxoADo/V/io30P88Q3gAwRWjAGOkcwAKFHYAnNTe/qAH2f9y9UwBdTt7ALDCVv7VD7AATs7P/tWBOwDp+xYBYDeY/+z/D//FWVT/XZWFAK6gcQDqY6n/mHRYAJCkU/9fHcb/Ii8P/2N4hv8F7MEA+fd+/5O7HgAy5nX/bNnb/6NRpv9IGan+m3lP/xybWf4HfhEAk0EhAS/q/QAaMxIAaVPH/6PE5gBx+KQA4v7aAL3Ry/+k997+/yOlAAS88wF/s0cAJe3+/2S68AAFOUf+Z0hJ//QSUf7l0oT/7ga0/wvlrv/j3cABETEcAKPXxP4JdgT/M/BHAHGBbf9M8OcAvLF/AH1HLAEar/MAXqkZ/hvmHQAPi3cBqKq6/6zFTP/8S7wAiXzEAEgWYP8tl/kB3JFkAEDAn/947+IAgbKSAADAfQDriuoAt52SAFPHwP+4rEj/SeGAAE0G+v+6QUMAaPbPALwgiv/aGPIAQ4pR/u2Bef8Uz5YBKccQ/wYUgACfdgUAtRCP/9wmDwAXQJP+SRoNAFfkOQHMfIAAKxjfANtjxwAWSxT/Ext+AJ0+1wBuHeYAs6f/ATb8vgDdzLb+s55B/1GdAwDC2p8Aqt8AAOALIP8mxWIAqKQlABdYBwGkum4AYCSGAOry5QD6eRMA8v5w/wMvXgEJ7wb/UYaZ/tb9qP9DfOAA9V9KABweLP4Bbdz/sllZAPwkTAAYxi7/TE1vAIbqiP8nXh0AuUjq/0ZEh//nZgf+TeeMAKcvOgGUYXb/EBvhAabOj/9ustb/tIOiAI+N4QEN2k7/cpkhAWJozACvcnUBp85LAMrEUwE6QEMAii9vAcT3gP+J4OD+nnDPAJpk/wGGJWsAxoBP/3/Rm/+j/rn+PA7zAB/bcP4d2UEAyA10/ns8xP/gO7j+8lnEAHsQS/6VEM4ARf4wAed03//RoEEByFBiACXCuP6UPyIAi/BB/9mQhP84Ji3+x3jSAGyxpv+g3gQA3H53/qVroP9S3PgB8a+IAJCNF/+pilQAoIlO/+J2UP80G4T/P2CL/5j6JwC8mw8A6DOW/igP6P/w5Qn/ia8b/0tJYQHa1AsAhwWiAWu51QAC+Wv/KPJGANvIGQAZnQ0AQ1JQ/8T5F/+RFJUAMkiSAF5MlAEY+0EAH8AXALjUyf976aIB961IAKJX2/5+hlkAnwsM/qZpHQBJG+QBcXi3/0KjbQHUjwv/n+eoAf+AWgA5Djr+WTQK//0IowEAkdL/CoFVAS61GwBniKD+frzR/yIjbwDX2xj/1AvW/mUFdgDoxYX/36dt/+1QVv9Gi14AnsG/AZsPM/8PvnMATofP//kKGwG1fekAX6wN/qrVof8n7Ir/X11X/76AXwB9D84AppafAOMPnv/Onnj/Ko2AAGWyeAGcbYMA2g4s/veozv/UcBwAcBHk/1oQJQHF3mwA/s9T/wla8//z9KwAGlhz/810egC/5sEAtGQLAdklYP+aTpwA6+of/86ysv+VwPsAtvqHAPYWaQB8wW3/AtKV/6kRqgAAYG7/dQkIATJ7KP/BvWMAIuOgADBQRv7TM+wALXr1/iyuCACtJen/nkGrAHpF1/9aUAL/g2pg/uNyhwDNMXf+sD5A/1IzEf/xFPP/gg0I/oDZ8/+iGwH+WnbxAPbG9v83EHb/yJ+dAKMRAQCMa3kAVaF2/yYAlQCcL+4ACaamAUtitf8yShkAQg8vAIvhnwBMA47/Du64AAvPNf+3wLoBqyCu/79M3QH3qtsAGawy/tkJ6QDLfkT/t1wwAH+ntwFBMf4AED9/Af4Vqv874H/+FjA//xtOgv4owx0A+oRw/iPLkABoqagAz/0e/2goJv5e5FgAzhCA/9Q3ev/fFuoA38V/AP21tQGRZnYA7Jkk/9TZSP8UJhj+ij4+AJiMBADm3GP/ARXU/5TJ5wD0ewn+AKvSADM6Jf8B/w7/9LeR/gDypgAWSoQAedgpAF/Dcv6FGJf/nOLn//cFTf/2lHP+4VxR/95Q9v6qe1n/SseNAB0UCP+KiEb/XUtcAN2TMf40fuIA5XwXAC4JtQDNQDQBg/4cAJee1ACDQE4AzhmrAADmiwC//W7+Z/enAEAoKAEqpfH/O0vk/nzzvf/EXLL/goxW/41ZOAGTxgX/y/ie/pCijQALrOIAgioV/wGnj/+QJCT/MFik/qiq3ABiR9YAW9BPAJ9MyQGmKtb/Rf8A/waAff++AYwAklPa/9fuSAF6fzUAvXSl/1QIQv/WA9D/1W6FAMOoLAGe50UAokDI/ls6aAC2Orv++eSIAMuGTP5j3ekAS/7W/lBFmgBAmPj+7IjK/51pmf6VrxQAFiMT/3x56QC6+sb+hOWLAIlQrv+lfUQAkMqU/uvv+ACHuHYAZV4R/3pIRv5FgpIAf974AUV/dv8eUtf+vEoT/+Wnwv51GUL/Qeo4/tUWnACXO13+LRwb/7p+pP8gBu8Af3JjAds0Av9jYKb+Pr5+/2zeqAFL4q4A5uLHADx12v/8+BQB1rzMAB/Chv57RcD/qa0k/jdiWwDfKmb+iQFmAJ1aGQDvekD//AbpAAc2FP9SdK4AhyU2/w+6fQDjcK//ZLTh/yrt9P/0reL++BIhAKtjlv9K6zL/dVIg/mqo7QDPbdAB5Am6AIc8qf6zXI8A9Kpo/+stfP9GY7oAdYm3AOAf1wAoCWQAGhBfAUTZVwAIlxT/GmQ6/7ClywE0dkYAByD+/vT+9f+nkML/fXEX/7B5tQCIVNEAigYe/1kwHAAhmw7/GfCaAI3NbQFGcz7/FChr/oqax/9e3+L/nasmAKOxGf4tdgP/Dt4XAdG+Uf92e+gBDdVl/3s3e/4b9qUAMmNM/4zWIP9hQUP/GAwcAK5WTgFA92AAoIdDAEI38/+TzGD/GgYh/2IzUwGZ1dD/Arg2/xnaCwAxQ/b+EpVI/w0ZSAAqT9YAKgQmARuLkP+VuxcAEqSEAPVUuP54xmj/ftpgADh16v8NHdb+RC8K/6eahP6YJsYAQrJZ/8guq/8NY1P/0rv9/6otKgGK0XwA1qKNAAzmnABmJHD+A5NDADTXe//pqzb/Yok+APfaJ//n2uwA979/AMOSVAClsFz/E9Re/xFK4wBYKJkBxpMB/85D9f7wA9r/PY3V/2G3agDD6Ov+X1aaANEwzf520fH/8HjfAdUdnwCjf5P/DdpdAFUYRP5GFFD/vQWMAVJh/v9jY7//hFSF/2vadP9wei4AaREgAMKgP/9E3icB2P1cALFpzf+VycMAKuEL/yiicwAJB1EApdrbALQWAP4dkvz/ks/hAbSHYAAfo3AAsQvb/4UMwf4rTjIAQXF5ATvZBv9uXhgBcKxvAAcPYAAkVXsAR5YV/9BJvADAC6cB1fUiAAnmXACijif/11obAGJhWQBeT9MAWp3wAF/cfgFmsOIAJB7g/iMffwDn6HMBVVOCANJJ9f8vj3L/REHFADtIPv+3ha3+XXl2/zuxUf/qRa3/zYCxANz0MwAa9NEBSd5N/6MIYP6WldMAnv7LATZ/iwCh4DsABG0W/94qLf/Qkmb/7I67ADLN9f8KSln+ME+OAN5Mgv8epj8A7AwN/zG49AC7cWYA2mX9AJk5tv4glioAGcaSAe3xOACMRAUAW6Ss/06Ruv5DNM0A28+BAW1zEQA2jzoBFfh4/7P/HgDB7EL/Af8H//3AMP8TRdkBA9YA/0BlkgHffSP/60mz//mn4gDhrwoBYaI6AGpwqwFUrAX/hYyy/4b1jgBhWn3/usu5/99NF//AXGoAD8Zz/9mY+ACrsnj/5IY1ALA2wQH6+zUA1QpkASLHagCXH/T+rOBX/w7tF//9VRr/fyd0/6xoZAD7Dkb/1NCK//3T+gCwMaUAD0x7/yXaoP9chxABCn5y/0YF4P/3+Y0ARBQ8AfHSvf/D2bsBlwNxAJdcrgDnPrL/27fhABcXIf/NtVAAObj4/0O0Af9ae13/JwCi/2D4NP9UQowAIn/k/8KKBwGmbrwAFRGbAZq+xv/WUDv/EgePAEgd4gHH2fkA6KFHAZW+yQDZr1/+cZND/4qPx/9/zAEAHbZTAc7mm/+6zDwACn1V/+hgGf//Wff/1f6vAejBUQAcK5z+DEUIAJMY+AASxjEAhjwjAHb2Ev8xWP7+5BW6/7ZBcAHbFgH/Fn40/701Mf9wGY8AJn83/+Jlo/7QhT3/iUWuAb52kf88Ytv/2Q31//qICgBU/uIAyR99AfAz+/8fg4L/Aooy/9fXsQHfDO7//JU4/3xbRP9Ifqr+d/9kAIKH6P8OT7IA+oPFAIrG0AB52Iv+dxIk/x3BegAQKi3/1fDrAea+qf/GI+T+bq1IANbd8f84lIcAwHVO/o1dz/+PQZUAFRJi/18s9AFqv00A/lUI/tZusP9JrRP+oMTH/+1akADBrHH/yJuI/uRa3QCJMUoBpN3X/9G9Bf9p7Df/Kh+BAcH/7AAu2TwAili7/+JS7P9RRZf/jr4QAQ2GCAB/ejD/UUCcAKvziwDtI/YAeo/B/tR6kgBfKf8BV4RNAATUHwARH04AJy2t/hiO2f9fCQb/41MGAGI7gv4+HiEACHPTAaJhgP8HuBf+dByo//iKl/9i9PAAunaCAHL46/9prcgBoHxH/14kpAGvQZL/7vGq/srGxQDkR4r+LfZt/8I0ngCFu7AAU/ya/lm93f+qSfwAlDp9ACREM/4qRbH/qExW/yZkzP8mNSMArxNhAOHu/f9RUYcA0hv//utJawAIz3MAUn+IAFRjFf7PE4gAZKRlAFDQTf+Ez+3/DwMP/yGmbgCcX1X/JblvAZZqI/+ml0wAcleH/5/CQAAMeh//6Adl/q13YgCaR9z+vzk1/6jooP/gIGP/2pylAJeZowDZDZQBxXFZAJUcof7PFx4AaYTj/zbmXv+Frcz/XLed/1iQ/P5mIVoAn2EDALXam//wcncAatY1/6W+cwGYW+H/WGos/9A9cQCXNHwAvxuc/2427AEOHqb/J3/PAeXHHAC85Lz+ZJ3rAPbatwFrFsH/zqBfAEzvkwDPoXUAM6YC/zR1Cv5JOOP/mMHhAIReiP9lv9EAIGvl/8YrtAFk0nYAckOZ/xdYGv9ZmlwB3HiM/5Byz//8c/r/Is5IAIqFf/8IsnwBV0thAA/lXP7wQ4P/dnvj/pJ4aP+R1f8BgbtG/9t3NgABE60ALZaUAfhTSADL6akBjms4APf5JgEt8lD/HulnAGBSRgAXyW8AUSce/6G3Tv/C6iH/ROOM/tjOdABGG+v/aJBPAKTmXf7Wh5wAmrvy/rwUg/8kba4An3DxAAVulQEkpdoAph0TAbIuSQBdKyD++L3tAGabjQDJXcP/8Yv9/w9vYv9sQaP+m0++/0muwf72KDD/a1gL/sphVf/9zBL/cfJCAG6gwv7QEroAURU8ALxop/98pmH+0oWOADjyif4pb4IAb5c6AW/Vjf+3rPH/JgbE/7kHe/8uC/YA9Wl3AQ8Cof8Izi3/EspK/1N8cwHUjZ0AUwjR/osP6P+sNq3+MveEANa91QCQuGkA3/74AP+T8P8XvEgABzM2ALwZtP7ctAD/U6AUAKO98/860cL/V0k8AGoYMQD1+dwAFq2nAHYLw/8Tfu0Abp8l/ztSLwC0u1YAvJTQAWQlhf8HcMEAgbyc/1Rqgf+F4coADuxv/ygUZQCsrDH+MzZK//u5uP9dm+D/tPngAeaykgBIOTb+sj64AHfNSAC57/3/PQ/aAMRDOP/qIKsBLtvkANBs6v8UP+j/pTXHAYXkBf80zWsASu6M/5ac2/7vrLL/+73f/iCO0//aD4oB8cRQABwkYv4W6scAPe3c//Y5JQCOEY7/nT4aACvuX/4D2Qb/1RnwASfcrv+azTD+Ew3A//QiNv6MEJsA8LUF/pvBPACmgAT/JJE4/5bw2wB4M5EAUpkqAYzskgBrXPgBvQoDAD+I8gDTJxgAE8qhAa0buv/SzO/+KdGi/7b+n/+sdDQAw2fe/s1FOwA1FikB2jDCAFDS8gDSvM8Au6Gh/tgRAQCI4XEA+rg/AN8eYv5NqKIAOzWvABPJCv+L4MIAk8Ga/9S9DP4ByK7/MoVxAV6zWgCttocAXrFxACtZ1/+I/Gr/e4ZT/gX1Qv9SMScB3ALgAGGBsQBNO1kAPR2bAcur3P9cTosAkSG1/6kYjQE3lrMAizxQ/9onYQACk2v/PPhIAK3mLwEGU7b/EGmi/onUUf+0uIYBJ96k/91p+wHvcH0APwdhAD9o4/+UOgwAWjzg/1TU/ABP16gA+N3HAXN5AQAkrHgAIKK7/zlrMf+TKhUAasYrATlKVwB+y1H/gYfDAIwfsQDdi8IAA97XAINE5wCxVrL+fJe0ALh8JgFGoxEA+fu1ASo34wDioSwAF+xuADOVjgFdBewA2rdq/kMYTQAo9dH/3nmZAKU5HgBTfTwARiZSAeUGvABt3p3/N3Y//82XugDjIZX//rD2AeOx4wAiaqP+sCtPAGpfTgG58Xr/uQ49ACQBygANsqL/9wuEAKHmXAFBAbn/1DKlAY2SQP+e8toAFaR9ANWLegFDR1cAy56yAZdcKwCYbwX/JwPv/9n/+v+wP0f/SvVNAfquEv8iMeP/9i77/5ojMAF9nT3/aiRO/2HsmQCIu3j/cYar/xPV2f7YXtH//AU9AF4DygADGrf/QL8r/x4XFQCBjU3/ZngHAcJMjAC8rzT/EVGUAOhWNwHhMKwAhioq/+4yLwCpEv4AFJNX/w7D7/9F9xcA7uWA/7ExcACoYvv/eUf4APMIkf7245n/26mx/vuLpf8Mo7n/pCir/5mfG/7zbVv/3hhwARLW5wBrnbX+w5MA/8JjaP9ZjL7/sUJ+/mq5QgAx2h8A/K6eALxP5gHuKeAA1OoIAYgLtQCmdVP/RMNeAC6EyQDwmFgApDlF/qDgKv8710P/d8ON/yS0ef7PLwj/rtLfAGXFRP//Uo0B+onpAGFWhQEQUEUAhIOfAHRdZAAtjYsAmKyd/1orWwBHmS4AJxBw/9mIYf/cxhn+sTUxAN5Yhv+ADzwAz8Cp/8B00f9qTtMByNW3/wcMev7eyzz/IW7H/vtqdQDk4QQBeDoH/93BVP5whRsAvcjJ/4uHlgDqN7D/PTJBAJhsqf/cVQH/cIfjAKIaugDPYLn+9IhrAF2ZMgHGYZcAbgtW/491rv9z1MgABcq3AO2kCv657z4A7HgS/mJ7Y/+oycL+LurWAL+FMf9jqXcAvrsjAXMVLf/5g0gAcAZ7/9Yxtf6m6SIAXMVm/v3kzf8DO8kBKmIuANslI/+pwyYAXnzBAZwr3wBfSIX+eM6/AHrF7/+xu0///i4CAfqnvgBUgRMAy3Gm//kfvf5Incr/0EdJ/88YSAAKEBIB0lFM/1jQwP9+82v/7o14/8d56v+JDDv/JNx7/5SzPP7wDB0AQgBhASQeJv9zAV3/YGfn/8WeOwHApPAAyso5/xiuMABZTZsBKkzXAPSX6QAXMFEA7380/uOCJf/4dF0BfIR2AK3+wAEG61P/bq/nAfsctgCB+V3+VLiAAEy1PgCvgLoAZDWI/m0d4gDd6ToBFGNKAAAWoACGDRUACTQ3/xFZjACvIjsAVKV3/+Di6v8HSKb/e3P/ARLW9gD6B0cB2dy5ANQjTP8mfa8AvWHSAHLuLP8pvKn+LbqaAFFcFgCEoMEAedBi/w1RLP/LnFIARzoV/9Byv/4yJpMAmtjDAGUZEgA8+tf/6YTr/2evjgEQDlwAjR9u/u7xLf+Z2e8BYagv//lVEAEcrz7/Of42AN7nfgCmLXX+Er1g/+RMMgDI9F4Axph4AUQiRf8MQaD+ZRNaAKfFeP9ENrn/Kdq8AHGoMABYab0BGlIg/7ldpAHk8O3/QrY1AKvFXP9rCekBx3iQ/04xCv9tqmn/WgQf/xz0cf9KOgsAPtz2/3mayP6Q0rL/fjmBASv6Dv9lbxwBL1bx/z1Glv81SQX/HhqeANEaVgCK7UoApF+8AI48Hf6idPj/u6+gAJcSEADRb0H+y4Yn/1hsMf+DGkf/3RvX/mhpXf8f7B/+hwDT/49/bgHUSeUA6UOn/sMB0P+EEd3/M9laAEPrMv/f0o8AszWCAelqxgDZrdz/cOUY/6+aXf5Hy/b/MEKF/wOI5v8X3XH+62/VAKp4X/773QIALYKe/mle2f/yNLT+1UQt/2gmHAD0nkwAochg/881Df+7Q5QAqjb4AHeisv9TFAsAKirAAZKfo/+36G8ATeUV/0c1jwAbTCIA9ogv/9sntv9c4MkBE44O/0W28f+jdvUACW1qAaq19/9OL+7/VNKw/9VriwAnJgsASBWWAEiCRQDNTZv+joUVAEdvrP7iKjv/swDXASGA8QDq/A0BuE8IAG4eSf/2jb0Aqs/aAUqaRf+K9jH/myBkAH1Kaf9aVT3/I+Wx/z59wf+ZVrwBSXjUANF79v6H0Sb/lzosAVxF1v8ODFj//Jmm//3PcP88TlP/43xuALRg/P81dSH+pNxS/ykBG/8mpKb/pGOp/j2QRv/AphIAa/pCAMVBMgABsxL//2gB/yuZI/9Qb6gAbq+oAClpLf/bDs3/pOmM/isBdgDpQ8MAslKf/4pXev/U7lr/kCN8/hmMpAD71yz+hUZr/2XjUP5cqTcA1yoxAHK0Vf8h6BsBrNUZAD6we/4ghRj/4b8+AF1GmQC1KmgBFr/g/8jIjP/56iUAlTmNAMM40P/+gkb/IK3w/x3cxwBuZHP/hOX5AOTp3/8l2NH+srHR/7ctpf7gYXIAiWGo/+HerAClDTEB0uvM//wEHP5GoJcA6L40/lP4Xf8+100Br6+z/6AyQgB5MNAAP6nR/wDSyADguywBSaJSAAmwj/8TTMH/HTunARgrmgAcvr4AjbyBAOjry//qAG3/NkGfADxY6P95/Zb+/OmD/8ZuKQFTTUf/yBY7/mr98v8VDM//7UK9AFrGygHhrH8ANRbKADjmhAABVrcAbb4qAPNErgFt5JoAyLF6ASOgt/+xMFX/Wtqp//iYTgDK/m4ABjQrAI5iQf8/kRYARmpdAOiKawFusz3/04HaAfLRXAAjWtkBto9q/3Rl2f9y+t3/rcwGADyWowBJrCz/725Q/+1Mmf6hjPkAlejlAIUfKP+upHcAcTPWAIHkAv5AIvMAa+P0/65qyP9UmUYBMiMQAPpK2P7svUL/mfkNAOayBP/dKe4AduN5/15XjP7+d1wASe/2/nVXgAAT05H/sS78AOVb9gFFgPf/yk02AQgLCf+ZYKYA2dat/4bAAgEAzwAAva5rAYyGZACewfMBtmarAOuaMwCOBXv/PKhZAdkOXP8T1gUB06f+ACwGyv54Euz/D3G4/7jfiwAosXf+tnta/7ClsAD3TcIAG+p4AOcA1v87Jx4AfWOR/5ZERAGN3vgAmXvS/25/mP/lIdYBh93FAIlhAgAMj8z/USm8AHNPgv9eA4QAmK+7/3yNCv9+wLP/C2fGAJUGLQDbVbsB5hKy/0i2mAADxrj/gHDgAWGh5gD+Yyb/Op/FAJdC2wA7RY//uXD5AHeIL/97goQAqEdf/3GwKAHoua0Az111AUSdbP9mBZP+MWEhAFlBb/73HqP/fNndAWb62ADGrkv+OTcSAOMF7AHl1a0AyW3aATHp7wAeN54BGbJqAJtvvAFefowA1x/uAU3wEADV8hkBJkeoAM26Xf4x04z/2wC0/4Z2pQCgk4b/broj/8bzKgDzkncAhuujAQTxh//BLsH+Z7RP/+EEuP7ydoIAkoewAepvHgBFQtX+KWB7AHleKv+yv8P/LoIqAHVUCP/pMdb+7nptAAZHWQHs03sA9A0w/neUDgByHFb/S+0Z/5HlEP6BZDX/hpZ4/qidMgAXSGj/4DEOAP97Fv+XuZf/qlC4AYa2FAApZGUBmSEQAEyabwFWzur/wKCk/qV7Xf8B2KT+QxGv/6kLO/+eKT3/SbwO/8MGif8Wkx3/FGcD//aC4/96KIAA4i8Y/iMkIACYurf/RcoUAMOFwwDeM/cAqateAbcAoP9AzRIBnFMP/8U6+f77WW7/MgpY/jMr2ABi8sYB9ZdxAKvswgHFH8f/5VEmASk7FAD9aOYAmF0O//bykv7WqfD/8GZs/qCn7ACa2rwAlunK/xsT+gECR4X/rww/AZG3xgBoeHP/gvv3ABHUp/8+e4T/92S9AJvfmACPxSEAmzss/5Zd8AF/A1f/X0fPAadVAf+8mHT/ChcXAInDXQE2YmEA8ACo/5S8fwCGa5cATP2rAFqEwACSFjYA4EI2/ua65f8ntsQAlPuC/0GDbP6AAaAAqTGn/sf+lP/7BoMAu/6B/1VSPgCyFzr//oQFAKTVJwCG/JL+JTVR/5uGUgDNp+7/Xi20/4QooQD+b3ABNkvZALPm3QHrXr//F/MwAcqRy/8ndir/dY39AP4A3gAr+zIANqnqAVBE0ACUy/P+kQeHAAb+AAD8uX8AYgiB/yYjSP/TJNwBKBpZAKhAxf4D3u//AlPX/rSfaQA6c8IAunRq/+X32/+BdsEAyq63AaahSADJa5P+7YhKAOnmagFpb6gAQOAeAQHlAwBml6//wu7k//761AC77XkAQ/tgAcUeCwC3X8wAzVmKAEDdJQH/3x7/sjDT//HIWv+n0WD/OYLdAC5yyP89uEIAN7YY/m62IQCrvuj/cl4fABLdCAAv5/4A/3BTAHYP1/+tGSj+wMEf/+4Vkv+rwXb/Zeo1/oPUcABZwGsBCNAbALXZD//nlegAjOx+AJAJx/8MT7X+k7bK/xNttv8x1OEASqPLAK/plAAacDMAwcEJ/w+H+QCW44IAzADbARjyzQDu0HX/FvRwABrlIgAlULz/Ji3O/vBa4f8dAy//KuBMALrzpwAghA//BTN9AIuHGAAG8dsArOWF//bWMgDnC8//v35TAbSjqv/1OBgBsqTT/wMQygFiOXb/jYNZ/iEzGADzlVv//TQOACOpQ/4xHlj/sxsk/6WMtwA6vZcAWB8AAEupQgBCZcf/GNjHAXnEGv8OT8v+8OJR/14cCv9TwfD/zMGD/14PVgDaKJ0AM8HRAADysQBmufcAnm10ACaHWwDfr5UA3EIB/1Y86AAZYCX/4XqiAde7qP+enS4AOKuiAOjwZQF6FgkAMwkV/zUZ7v/ZHuj+famUAA3oZgCUCSUApWGNAeSDKQDeD/P//hIRAAY87QFqA3EAO4S9AFxwHgBp0NUAMFSz/7t55/4b2G3/ot1r/knvw//6Hzn/lYdZ/7kXcwEDo53/EnD6ABk5u/+hYKQALxDzAAyN+/5D6rj/KRKhAK8GYP+grDT+GLC3/8bBVQF8eYn/lzJy/9zLPP/P7wUBACZr/zfuXv5GmF4A1dxNAXgRRf9VpL7/y+pRACYxJf49kHwAiU4x/qj3MABfpPwAaamHAP3khgBApksAUUkU/8/SCgDqapb/XiJa//6fOf7chWMAi5O0/hgXuQApOR7/vWFMAEG73//grCX/Ij5fAeeQ8ABNan7+QJhbAB1imwDi+zX/6tMF/5DL3v+ksN3+BecYALN6zQAkAYb/fUaX/mHk/ACsgRf+MFrR/5bgUgFUhh4A8cQuAGdx6v8uZXn+KHz6/4ct8v4J+aj/jGyD/4+jqwAyrcf/WN6O/8hfngCOwKP/B3WHAG98FgDsDEH+RCZB/+Ou/gD09SYA8DLQ/6E/+gA80e8AeiMTAA4h5v4Cn3EAahR//+TNYACJ0q7+tNSQ/1limgEiWIsAp6JwAUFuxQDxJakAQjiD/wrJU/6F/bv/sXAt/sT7AADE+pf/7ujW/5bRzQAc8HYAR0xTAexjWwAq+oMBYBJA/3beIwBx1sv/ene4/0ITJADMQPkAklmLAIY+hwFo6WUAvFQaADH5gQDQ1kv/z4JN/3Ov6wCrAon/r5G6ATf1h/+aVrUBZDr2/23HPP9SzIb/1zHmAYzlwP/ewfv/UYgP/7OVov8XJx3/B19L/r9R3gDxUVr/azHJ//TTnQDejJX/Qds4/r32Wv+yO50BMNs0AGIi1wAcEbv/r6kYAFxPof/syMIBk4/qAOXhBwHFqA4A6zM1Af14rgDFBqj/ynWrAKMVzgByVVr/DykK/8ITYwBBN9j+opJ0ADLO1P9Akh3/np6DAWSlgv+sF4H/fTUJ/w/BEgEaMQv/ta7JAYfJDv9kE5UA22JPACpjj/5gADD/xflT/miVT//rboj+UoAs/0EpJP5Y0woAu3m7AGKGxwCrvLP+0gvu/0J7gv406j0AMHEX/gZWeP93svUAV4HJAPKN0QDKclUAlBahAGfDMAAZMav/ikOCALZJev6UGIIA0+WaACCbngBUaT0AscIJ/6ZZVgE2U7sA+Sh1/20D1/81kiwBPy+zAMLYA/4OVIgAiLEN/0jzuv91EX3/0zrT/11P3wBaWPX/i9Fv/0beLwAK9k//xtmyAOPhCwFOfrP/Pit+AGeUIwCBCKX+9fCUAD0zjgBR0IYAD4lz/9N37P+f9fj/AoaI/+aLOgGgpP4AclWN/zGmtv+QRlQBVbYHAC41XQAJpqH/N6Ky/y24vACSHCz+qVoxAHiy8QEOe3//B/HHAb1CMv/Gj2X+vfOH/40YGP5LYVcAdvuaAe02nACrks//g8T2/4hAcQGX6DkA8NpzADE9G/9AgUkB/Kkb/yiECgFaycH//HnwAbrOKQArxmEAkWS3AMzYUP6slkEA+eXE/mh7Sf9NaGD+grQIAGh7OQDcyuX/ZvnTAFYO6P+2TtEA7+GkAGoNIP94SRH/hkPpAFP+tQC37HABMECD//HY8/9BweIAzvFk/mSGpv/tysUANw1RACB8Zv8o5LEAdrUfAeeghv93u8oAAI48/4Amvf+myZYAz3gaATa4rAAM8sz+hULmACImHwG4cFAAIDOl/r/zNwA6SZL+m6fN/2RomP/F/s//rRP3AO4KygDvl/IAXjsn//AdZv8KXJr/5VTb/6GBUADQWswB8Nuu/55mkQE1skz/NGyoAVPeawDTJG0Adjo4AAgdFgDtoMcAqtGdAIlHLwCPViAAxvICANQwiAFcrLoA5pdpAWC/5QCKUL/+8NiC/2IrBv6oxDEA/RJbAZBJeQA9kicBP2gY/7ilcP5+62IAUNVi/3s8V/9SjPUB33it/w/GhgHOPO8A5+pc/yHuE/+lcY4BsHcmAKArpv7vW2kAaz3CARkERAAPizMApIRq/yJ0Lv6oX8UAidQXAEicOgCJcEX+lmma/+zJnQAX1Jr/iFLj/uI73f9flcAAUXY0/yEr1wEOk0v/WZx5/g4STwCT0IsBl9o+/5xYCAHSuGL/FK97/2ZT5QDcQXQBlvoE/1yO3P8i90L/zOGz/pdRlwBHKOz/ij8+AAZP8P+3ubUAdjIbAD/jwAB7YzoBMuCb/xHh3/7c4E3/Dix7AY2ArwD41MgAlju3/5NhHQCWzLUA/SVHAJFVdwCayLoAAoD5/1MYfAAOV48AqDP1AXyX5//Q8MUBfL65ADA69gAU6egAfRJi/w3+H//1sYL/bI4jAKt98v6MDCL/paGiAM7NZQD3GSIBZJE5ACdGOQB2zMv/8gCiAKX0HgDGdOIAgG+Z/4w2tgE8eg//mzo5ATYyxgCr0x3/a4qn/61rx/9tocEAWUjy/85zWf/6/o7+scpe/1FZMgAHaUL/Gf7//stAF/9P3mz/J/lLAPF8MgDvmIUA3fFpAJOXYgDVoXn+8jGJAOkl+f4qtxsAuHfm/9kgo//Q++QBiT6D/09ACf5eMHEAEYoy/sH/FgD3EsUBQzdoABDNX/8wJUIAN5w/AUBSSv/INUf+70N9ABrg3gDfiV3/HuDK/wnchADGJusBZo1WADwrUQGIHBoA6SQI/s/ylACkoj8AMy7g/3IwT/8Jr+IA3gPB/y+g6P//XWn+DirmABqKUgHQK/QAGycm/2LQf/9Albb/BfrRALs8HP4xGdr/qXTN/3cSeACcdJP/hDVt/w0KygBuU6cAnduJ/wYDgv8ypx7/PJ8v/4GAnf5eA70AA6ZEAFPf1wCWWsIBD6hBAONTM//Nq0L/Nrs8AZhmLf93muEA8PeIAGTFsv+LR9//zFIQASnOKv+cwN3/2Hv0/9rauf+7uu///Kyg/8M0FgCQrrX+u2Rz/9NOsP8bB8EAk9Vo/1rJCv9Qe0IBFiG6AAEHY/4ezgoA5eoFADUe0gCKCNz+RzenAEjhVgF2vrwA/sFlAav5rP9enrf+XQJs/7BdTP9JY0//SkCB/vYuQQBj8X/+9pdm/yw10P47ZuoAmq+k/1jyIABvJgEA/7a+/3OwD/6pPIEAeu3xAFpMPwA+Snj/esNuAHcEsgDe8tIAgiEu/pwoKQCnknABMaNv/3mw6wBMzw7/AxnGASnr1QBVJNYBMVxt/8gYHv6o7MMAkSd8AezDlQBaJLj/Q1Wq/yYjGv6DfET/75sj/zbJpADEFnX/MQ/NABjgHQF+cZAAdRW2AMufjQDfh00AsOaw/77l1/9jJbX/MxWK/xm9Wf8xMKX+mC33AKps3gBQygUAG0Vn/swWgf+0/D7+0gFb/5Ju/v/bohwA3/zVATsIIQDOEPQAgdMwAGug0ABwO9EAbU3Y/iIVuf/2Yzj/s4sT/7kdMv9UWRMASvpi/+EqyP/A2c3/0hCnAGOEXwEr5jkA/gvL/2O8P/93wfv+UGk2AOi1vQG3RXD/0Kul/y9ttP97U6UAkqI0/5oLBP+X41r/kolh/j3pKf9eKjf/bKTsAJhE/gAKjIP/CmpP/vOeiQBDskL+sXvG/w8+IgDFWCr/lV+x/5gAxv+V/nH/4Vqj/33Z9wASEeAAgEJ4/sAZCf8y3c0AMdRGAOn/pAAC0QkA3TTb/qzg9P9eOM4B8rMC/x9bpAHmLor/vebcADkvPf9vC50AsVuYABzmYgBhV34AxlmR/6dPawD5TaABHenm/5YVVv48C8EAlyUk/rmW8//k1FMBrJe0AMmpmwD0POoAjusEAUPaPADAcUsBdPPP/0GsmwBRHpz/UEgh/hLnbf+OaxX+fRqE/7AQO/+WyToAzqnJANB54gAorA7/lj1e/zg5nP+NPJH/LWyV/+6Rm//RVR/+wAzSAGNiXf6YEJcA4bncAI3rLP+grBX+Rxof/w1AXf4cOMYAsT74AbYI8QCmZZT/TlGF/4He1wG8qYH/6AdhADFwPP/Z5fsAd2yKACcTe/6DMesAhFSRAILmlP8ZSrsABfU2/7nb8QESwuT/8cpmAGlxygCb608AFQmy/5wB7wDIlD0Ac/fS/zHdhwA6vQgBIy4JAFFBBf80nrn/fXQu/0qMDf/SXKz+kxdHANng/f5zbLT/kTow/tuxGP+c/zwBmpPyAP2GVwA1S+UAMMPe/x+vMv+c0nj/0CPe/xL4swECCmX/ncL4/57MZf9o/sX/Tz4EALKsZQFgkvv/QQqcAAKJpf90BOcA8tcBABMjHf8roU8AO5X2AftCsADIIQP/UG6O/8OhEQHkOEL/ey+R/oQEpABDrqwAGf1yAFdhVwH63FQAYFvI/yV9OwATQXYAoTTx/+2sBv+wv///AUGC/t++5gBl/ef/kiNtAPodTQExABMAe1qbARZWIP/a1UEAb11/ADxdqf8If7YAEboO/v2J9v/VGTD+TO4A//hcRv9j4IsAuAn/AQek0ADNg8YBV9bHAILWXwDdld4AFyar/sVu1QArc4z+17F2AGA0QgF1nu0ADkC2/y4/rv+eX77/4c2x/ysFjv+sY9T/9LuTAB0zmf/kdBj+HmXPABP2lv+G5wUAfYbiAU1BYgDsgiH/BW4+AEVsf/8HcRYAkRRT/sKh5/+DtTwA2dGx/+WU1P4Dg7gAdbG7ARwOH/+wZlAAMlSX/30fNv8VnYX/E7OLAeDoGgAidar/p/yr/0mNzv6B+iMASE/sAdzlFP8pyq3/Y0zu/8YW4P9sxsP/JI1gAeyeO/9qZFcAbuICAOPq3gCaXXf/SnCk/0NbAv8VkSH/ZtaJ/6/mZ/6j9qYAXfd0/qfgHP/cAjkBq85UAHvkEf8beHcAdwuTAbQv4f9oyLn+pQJyAE1O1AAtmrH/GMR5/lKdtgBaEL4BDJPFAF/vmP8L60cAVpJ3/6yG1gA8g8QAoeGBAB+CeP5fyDMAaefS/zoJlP8rqN3/fO2OAMbTMv4u9WcApPhUAJhG0P+0dbEARk+5APNKIACVnM8AxcShAfU17wAPXfb+i/Ax/8RYJP+iJnsAgMidAa5MZ/+tqSL+2AGr/3IzEQCI5MIAbpY4/mr2nwATuE//lk3w/5tQogAANan/HZdWAEReEABcB27+YnWV//lN5v/9CowA1nxc/iN26wBZMDkBFjWmALiQPf+z/8IA1vg9/jtu9gB5FVH+pgPkAGpAGv9F6Ib/8tw1/i7cVQBxlff/YbNn/75/CwCH0bYAXzSBAaqQzv96yMz/qGSSADyQlf5GPCgAejSx//bTZf+u7QgABzN4ABMfrQB+75z/j73LAMSAWP/pheL/Hn2t/8lsMgB7ZDv//qMDAd2Utf/WiDn+3rSJ/89YNv8cIfv/Q9Y0AdLQZABRql4AkSg1AOBv5/4jHPT/4sfD/u4R5gDZ2aT+qZ3dANouogHHz6P/bHOiAQ5gu/92PEwAuJ+YANHnR/4qpLr/upkz/t2rtv+ijq0A6y/BAAeLEAFfpED/EN2mANvFEACEHSz/ZEV1/zzrWP4oUa0AR749/7tYnQDnCxcA7XWkAOGo3/+acnT/o5jyARggqgB9YnH+qBNMABGd3P6bNAUAE2+h/0da/P+tbvAACsZ5//3/8P9Ce9IA3cLX/nmjEf/hB2MAvjG2AHMJhQHoGor/1USEACx3ev+zYjMAlVpqAEcy5v8KmXb/sUYZAKVXzQA3iuoA7h5hAHGbzwBimX8AImvb/nVyrP9MtP/+8jmz/90irP44ojH/UwP//3Hdvf+8GeT+EFhZ/0ccxv4WEZX/83n+/2vKY/8Jzg4B3C+ZAGuJJwFhMcL/lTPF/ro6C/9rK+gByAYO/7WFQf7d5Kv/ez7nAePqs/8ivdT+9Lv5AL4NUAGCWQEA34WtAAnexv9Cf0oAp9hd/5uoxgFCkQAARGYuAaxamgDYgEv/oCgzAJ4RGwF88DEA7Mqw/5d8wP8mwb4AX7Y9AKOTfP//pTP/HCgR/tdgTgBWkdr+HyTK/1YJBQBvKcj/7WxhADk+LAB1uA8BLfF0AJgB3P+dpbwA+g+DATwsff9B3Pv/SzK4ADVagP/nUML/iIF/ARUSu/8tOqH/R5MiAK75C/4jjR0A70Sx/3NuOgDuvrEBV/Wm/74x9/+SU7j/rQ4n/5LXaACO33gAlcib/9TPkQEQtdkArSBX//8jtQB336EByN9e/0YGuv/AQ1X/MqmYAJAae/8487P+FESIACeMvP790AX/yHOHASus5f+caLsAl/unADSHFwCXmUgAk8Vr/pSeBf/uj84AfpmJ/1iYxf4HRKcA/J+l/+9ONv8YPzf/Jt5eAO23DP/OzNIAEyf2/h5K5wCHbB0Bs3MAAHV2dAGEBvz/kYGhAWlDjQBSJeL/7uLk/8zWgf6ie2T/uXnqAC1s5wBCCDj/hIiAAKzgQv6vnbwA5t/i/vLbRQC4DncBUqI4AHJ7FACiZ1X/Me9j/pyH1wBv/6f+J8TWAJAmTwH5qH0Am2Gc/xc02/+WFpAALJWl/yh/twDETen/doHS/6qH5v/Wd8YA6fAjAP00B/91ZjD/Fcya/7OIsf8XAgMBlYJZ//wRnwFGPBoAkGsRALS+PP84tjv/bkc2/8YSgf+V4Ff/3xWY/4oWtv/6nM0A7C3Q/0+U8gFlRtEAZ06uAGWQrP+YiO0Bv8KIAHFQfQGYBI0Am5Y1/8R09QDvckn+E1IR/3x96v8oNL8AKtKe/5uEpQCyBSoBQFwo/yRVTf+y5HYAiUJg/nPiQgBu8EX+l29QAKeu7P/jbGv/vPJB/7dR/wA5zrX/LyK1/9XwngFHS18AnCgY/2bSUQCrx+T/miIpAOOvSwAV78MAiuVfAUzAMQB1e1cB4+GCAH0+P/8CxqsA/iQN/pG6zgCU//T/IwCmAB6W2wFc5NQAXMY8/j6FyP/JKTsAfe5t/7Sj7gGMelIACRZY/8WdL/+ZXjkAWB62AFShVQCyknwApqYH/xXQ3wCctvIAm3m5AFOcrv6aEHb/ulPoAd86ef8dF1gAI31//6oFlf6kDIL/m8QdAKFgiAAHIx0BoiX7AAMu8v8A2bwAOa7iAc7pAgA5u4j+e70J/8l1f/+6JMwA5xnYAFBOaQAThoH/lMtEAI1Rff74pcj/1pCHAJc3pv8m61sAFS6aAN/+lv8jmbT/fbAdAStiHv/Yeub/6aAMADm5DP7wcQf/BQkQ/hpbbABtxssACJMoAIGG5P98uij/cmKE/qaEFwBjRSwACfLu/7g1OwCEgWb/NCDz/pPfyP97U7P+h5DJ/40lOAGXPOP/WkmcAcusuwBQly//Xonn/yS/O//h0bX/StfV/gZ2s/+ZNsEBMgDnAGidSAGM45r/tuIQ/mDhXP9zFKr+BvpOAPhLrf81WQb/ALR2AEitAQBACM4BroXfALk+hf/WC2IAxR/QAKun9P8W57UBltq5APepYQGli/f/L3iVAWf4MwA8RRz+GbPEAHwH2v46a1EAuOmc//xKJAB2vEMAjV81/95epf4uPTUAzjtz/y/s+v9KBSABgZru/2og4gB5uz3/A6bx/kOqrP8d2LL/F8n8AP1u8wDIfTkAbcBg/zRz7gAmefP/yTghAMJ2ggBLYBn/qh7m/ic//QAkLfr/+wHvAKDUXAEt0e0A8yFX/u1Uyf/UEp3+1GN//9liEP6LrO8AqMmC/4/Bqf/ul8EB12gpAO89pf4CA/IAFsux/rHMFgCVgdX+Hwsp/wCfef6gGXL/olDIAJ2XCwCahk4B2Db8ADBnhQBp3MUA/ahN/jWzFwAYefAB/y5g/2s8h/5izfn/P/l3/3g70/9ytDf+W1XtAJXUTQE4STEAVsaWAF3RoABFzbb/9ForABQksAB6dN0AM6cnAecBP/8NxYYAA9Ei/4c7ygCnZE4AL99MALk8PgCypnsBhAyh/z2uKwDDRZAAfy+/ASIsTgA56jQB/xYo//ZekgBT5IAAPE7g/wBg0v+Zr+wAnxVJALRzxP6D4WoA/6eGAJ8IcP94RML/sMTG/3YwqP9dqQEAcMhmAUoY/gATjQT+jj4/AIOzu/9NnJv/d1akAKrQkv/QhZr/lJs6/6J46P781ZsA8Q0qAF4ygwCzqnAAjFOX/zd3VAGMI+//mS1DAeyvJwA2l2f/nipB/8Tvh/5WNcsAlWEv/tgjEf9GA0YBZyRa/ygarQC4MA0Ao9vZ/1EGAf/dqmz+6dBdAGTJ+f5WJCP/0ZoeAePJ+/8Cvaf+ZDkDAA2AKQDFZEsAlszr/5GuOwB4+JX/VTfhAHLSNf7HzHcADvdKAT/7gQBDaJcBh4JQAE9ZN/915p3/GWCPANWRBQBF8XgBlfNf/3IqFACDSAIAmjUU/0k+bQDEZpgAKQzM/3omCwH6CpEAz32UAPb03v8pIFUBcNV+AKL5VgFHxn//UQkVAWInBP/MRy0BS2+JAOo75wAgMF//zB9yAR3Etf8z8af+XW2OAGiQLQDrDLX/NHCkAEz+yv+uDqIAPeuT/ytAuf7pfdkA81in/koxCACczEIAfNZ7ACbddgGScOwAcmKxAJdZxwBXxXAAuZWhACxgpQD4sxT/vNvY/ig+DQDzjo0A5ePO/6zKI/91sOH/Um4mASr1Dv8UU2EAMasKAPJ3eAAZ6D0A1PCT/wRzOP+REe/+yhH7//kS9f9jde8AuASz//btM/8l74n/pnCm/1G8If+5+o7/NrutANBwyQD2K+QBaLhY/9Q0xP8zdWz//nWbAC5bD/9XDpD/V+PMAFMaUwGfTOMAnxvVARiXbAB1kLP+idFSACafCgBzhckA37acAW7EXf85POkABadp/5rFpABgIrr/k4UlAdxjvgABp1T/FJGrAMLF+/5fToX//Pjz/+Fdg/+7hsT/2JmqABR2nv6MAXYAVp4PAS3TKf+TAWT+cXRM/9N/bAFnDzAAwRBmAUUzX/9rgJ0AiavpAFp8kAFqobYAr0zsAciNrP+jOmgA6bQ0//D9Dv+icf7/Ju+K/jQupgDxZSH+g7qcAG/QPv98XqD/H6z+AHCuOP+8Yxv/Q4r7AH06gAGcmK7/sgz3//xUngBSxQ7+rMhT/yUnLgFqz6cAGL0iAIOykADO1QQAoeLSAEgzaf9hLbv/Trjf/7Ad+wBPoFb/dCWyAFJN1QFSVI3/4mXUAa9Yx//1XvcBrHZt/6a5vgCDtXgAV/5d/4bwSf8g9Y//i6Jn/7NiEv7ZzHAAk994/zUK8wCmjJYAfVDI/w5t2/9b2gH//Pwv/m2cdP9zMX8BzFfT/5TK2f8aVfn/DvWGAUxZqf/yLeYAO2Ks/3JJhP5OmzH/nn5UADGvK/8QtlT/nWcjAGjBbf9D3ZoAyawB/giiWAClAR3/fZvl/x6a3AFn71wA3AFt/8rGAQBeAo4BJDYsAOvinv+q+9b/uU0JAGFK8gDbo5X/8CN2/99yWP7AxwMAaiUY/8mhdv9hWWMB4Dpn/2XHk/7ePGMA6hk7ATSHGwBmA1v+qNjrAOXoiABoPIEALqjuACe/QwBLoy8Aj2Fi/zjYqAGo6fz/I28W/1xUKwAayFcBW/2YAMo4RgCOCE0AUAqvAfzHTAAWblL/gQHCAAuAPQFXDpH//d6+AQ9IrgBVo1b+OmMs/y0YvP4azQ8AE+XS/vhDwwBjR7gAmscl/5fzef8mM0v/yVWC/ixB+gA5k/P+kis7/1kcNQAhVBj/szMS/r1GUwALnLMBYoZ3AJ5vbwB3mkn/yD+M/i0NDf+awAL+UUgqAC6guf4scAYAkteVARqwaABEHFcB7DKZ/7OA+v7Owb//plyJ/jUo7wDSAcz+qK0jAI3zLQEkMm3/D/LC/+Ofev+wr8r+RjlIACjfOADQojr/t2JdAA9vDAAeCEz/hH/2/y3yZwBFtQ//CtEeAAOzeQDx6NoBe8dY/wLSygG8glH/XmXQAWckLQBMwRgBXxrx/6WiuwAkcowAykIF/yU4kwCYC/MBf1Xo//qH1AG5sXEAWtxL/0X4kgAybzIAXBZQAPQkc/6jZFL/GcEGAX89JAD9Qx7+Qeyq/6ER1/4/r4wAN38EAE9w6QBtoCgAj1MH/0Ea7v/ZqYz/Tl69/wCTvv+TR7r+ak1//+md6QGHV+3/0A3sAZttJP+0ZNoAtKMSAL5uCQERP3v/s4i0/6V7e/+QvFH+R/Bs/xlwC//j2jP/pzLq/3JPbP8fE3P/t/BjAONXj/9I2fj/ZqlfAYGVlQDuhQwB48wjANBzGgFmCOoAcFiPAZD5DgDwnqz+ZHB3AMKNmf4oOFP/ebAuACo1TP+ev5oAW9FcAK0NEAEFSOL/zP6VAFC4zwBkCXr+dmWr//zLAP6gzzYAOEj5ATiMDf8KQGv+W2U0/+G1+AGL/4QA5pERAOk4FwB3AfH/1amX/2NjCf65D7//rWdtAa4N+/+yWAf+GztE/wohAv/4YTsAGh6SAbCTCgBfec8BvFgYALle/v5zN8kAGDJGAHg1BgCOQpIA5OL5/2jA3gGtRNsAorgk/49mif+dCxcAfS1iAOtd4f44cKD/RnTzAZn5N/+BJxEB8VD0AFdFFQFe5En/TkJB/8Lj5wA9klf/rZsX/3B02/7YJgv/g7qFAF7UuwBkL1sAzP6v/94S1/6tRGz/4+RP/ybd1QCj45b+H74SAKCzCwEKWl7/3K5YAKPT5f/HiDQAgl/d/4y85/6LcYD/davs/jHcFP87FKv/5G28ABThIP7DEK4A4/6IAYcnaQCWTc7/0u7iADfUhP7vOXwAqsJd//kQ9/8Ylz7/CpcKAE+Lsv948soAGtvVAD59I/+QAmz/5iFT/1Et2AHgPhEA1tl9AGKZmf+zsGr+g12K/20+JP+yeSD/ePxGANz4JQDMWGcBgNz7/+zjBwFqMcb/PDhrAGNy7gDczF4BSbsBAFmaIgBO2aX/DsP5/wnm/f/Nh/UAGvwH/1TNGwGGAnAAJZ4gAOdb7f+/qsz/mAfeAG3AMQDBppL/6BO1/2mONP9nEBsB/cilAMPZBP80vZD/e5ug/leCNv9OeD3/DjgpABkpff9XqPUA1qVGANSpBv/b08L+SF2k/8UhZ/8rjo0Ag+GsAPRpHABEROEAiFQN/4I5KP6LTTgAVJY1ADZfnQCQDbH+X3O6AHUXdv/0pvH/C7qHALJqy/9h2l0AK/0tAKSYBACLdu8AYAEY/uuZ0/+obhT/Mu+wAHIp6ADB+jUA/qBv/oh6Kf9hbEMA15gX/4zR1AAqvaMAyioy/2pqvf++RNn/6Tp1AOXc8wHFAwQAJXg2/gSchv8kPav+pYhk/9ToDgBargoA2MZB/wwDQAB0cXP/+GcIAOd9Ev+gHMUAHrgjAd9J+f97FC7+hzgl/60N5QF3oSL/9T1JAM19cACJaIYA2fYe/+2OjwBBn2b/bKS+ANt1rf8iJXj+yEVQAB982v5KG6D/uprH/0fH/ABoUZ8BEcgnANM9wAEa7lsAlNkMADtb1f8LUbf/geZ6/3LLkQF3tEL/SIq0AOCVagB3Umj/0IwrAGIJtv/NZYb/EmUmAF/Fpv/L8ZMAPtCR/4X2+wACqQ4ADfe4AI4H/gAkyBf/WM3fAFuBNP8Vuh4Aj+TSAffq+P/mRR/+sLqH/+7NNAGLTysAEbDZ/iDzQwDyb+kALCMJ/+NyUQEERwz/Jmm/AAd1Mv9RTxAAP0RB/50kbv9N8QP/4i37AY4ZzgB4e9EBHP7u/wWAfv9b3tf/og+/AFbwSQCHuVH+LPGjANTb0v9wopsAz2V2AKhIOP/EBTQASKzy/34Wnf+SYDv/onmY/owQXwDD/sj+UpaiAHcrkf7MrE7/puCfAGgT7f/1ftD/4jvVAHXZxQCYSO0A3B8X/g5a5/+81EABPGX2/1UYVgABsW0AklMgAUu2wAB38eAAue0b/7hlUgHrJU3//YYTAOj2egA8arMAwwsMAG1C6wF9cTsAPSikAK9o8AACL7v/MgyNAMKLtf+H+mgAYVze/9mVyf/L8Xb/T5dDAHqO2v+V9e8AiirI/lAlYf98cKf/JIpX/4Idk//xV07/zGETAbHRFv/343/+Y3dT/9QZxgEQs7MAkU2s/lmZDv/avacAa+k7/yMh8/4scHD/oX9PAcyvCgAoFYr+aHTkAMdfif+Fvqj/kqXqAbdjJwC33Db+/96FAKLbef4/7wYA4WY2//sS9gAEIoEBhySDAM4yOwEPYbcAq9iH/2WYK/+W+1sAJpFfACLMJv6yjFP/GYHz/0yQJQBqJBr+dpCs/0S65f9rodX/LqNE/5Wq/QC7EQ8A2qCl/6sj9gFgDRMApct1ANZrwP/0e7EBZANoALLyYf/7TIL/000qAfpPRv8/9FABaWX2AD2IOgHuW9UADjti/6dUTQARhC7+Oa/F/7k+uABMQM8ArK/Q/q9KJQCKG9P+lH3CAApZUQCoy2X/K9XRAev1NgAeI+L/CX5GAOJ9Xv6cdRT/OfhwAeYwQP+kXKYB4Nbm/yR4jwA3CCv/+wH1AWpipQBKa2r+NQQ2/1qylgEDeHv/9AVZAXL6Pf/+mVIBTQ8RADnuWgFf3+YA7DQv/meUpP95zyQBEhC5/0sUSgC7C2UALjCB/xbv0v9N7IH/b03M/z1IYf/H2fv/KtfMAIWRyf855pIB62TGAJJJI/5sxhT/tk/S/1JniAD2bLAAIhE8/xNKcv6oqk7/ne8U/5UpqAA6eRwAT7OG/+d5h/+u0WL/83q+AKumzQDUdDAAHWxC/6LetgEOdxUA1Sf5//7f5P+3pcYAhb4wAHzQbf93r1X/CdF5ATCrvf/DR4YBiNsz/7Zbjf4xn0gAI3b1/3C64/87iR8AiSyjAHJnPP4I1ZYAogpx/8JoSADcg3T/sk9cAMv61f5dwb3/gv8i/tS8lwCIERT/FGVT/9TOpgDl7kn/l0oD/6hX1wCbvIX/poFJAPBPhf+y01H/y0ij/sGopQAOpMf+Hv/MAEFIWwGmSmb/yCoA/8Jx4/9CF9AA5dhk/xjvGgAK6T7/ewqyARokrv9328cBLaO+ABCoKgCmOcb/HBoaAH6l5wD7bGT/PeV5/zp2igBMzxEADSJw/lkQqAAl0Gn/I8nX/yhqZf4G73IAKGfi/vZ/bv8/pzoAhPCOAAWeWP+BSZ7/XlmSAOY2kgAILa0AT6kBAHO69wBUQIMAQ+D9/8+9QACaHFEBLbg2/1fU4P8AYEn/gSHrATRCUP/7rpv/BLMlAOqkXf5dr/0AxkVX/+BqLgBjHdIAPrxy/yzqCACpr/f/F22J/+W2JwDApV7+9WXZAL9YYADEXmP/au4L/jV+8wBeAWX/LpMCAMl8fP+NDNoADaadATD77f+b+nz/apSS/7YNygAcPacA2ZgI/tyCLf/I5v8BN0FX/12/Yf5y+w4AIGlcARrPjQAYzw3+FTIw/7qUdP/TK+EAJSKi/qTSKv9EF2D/ttYI//V1if9CwzIASwxT/lCMpAAJpSQB5G7jAPERWgEZNNQABt8M/4vzOQAMcUsB9re//9W/Rf/mD44AAcPE/4qrL/9AP2oBEKnW/8+uOAFYSYX/toWMALEOGf+TuDX/CuOh/3jY9P9JTekAne6LATtB6QBG+9gBKbiZ/yDLcACSk/0AV2VtASxShf/0ljX/Xpjo/ztdJ/9Yk9z/TlENASAv/P+gE3L/XWsn/3YQ0wG5d9H/49t//lhp7P+ibhf/JKZu/1vs3f9C6nQAbxP0/grpGgAgtwb+Ar/yANqcNf4pPEb/qOxvAHm5fv/ujs//N340ANyB0P5QzKT/QxeQ/toobP9/yqQAyyED/wKeAAAlYLz/wDFKAG0EAABvpwr+W9qH/8tCrf+WwuIAyf0G/65meQDNv24ANcIEAFEoLf4jZo//DGzG/xAb6P/8R7oBsG5yAI4DdQFxTY4AE5zFAVwv/AA16BYBNhLrAC4jvf/s1IEAAmDQ/sjux/87r6T/kivnAMLZNP8D3wwAijay/lXrzwDozyIAMTQy/6ZxWf8KLdj/Pq0cAG+l9gB2c1v/gFQ8AKeQywBXDfMAFh7kAbFxkv+Bqub+/JmB/5HhKwBG5wX/eml+/lb2lP9uJZr+0QNbAESRPgDkEKX/N935/rLSWwBTkuL+RZK6AF3SaP4QGa0A57omAL16jP/7DXD/aW5dAPtIqgDAF9//GAPKAeFd5ACZk8f+baoWAPhl9v+yfAz/sv5m/jcEQQB91rQAt2CTAC11F/6Ev/kAj7DL/oi3Nv+S6rEAkmVW/yx7jwEh0ZgAwFop/lMPff/VrFIA16mQABANIgAg0WT/VBL5AcUR7P/ZuuYAMaCw/292Yf/taOsATztc/kX5C/8jrEoBE3ZEAN58pf+0QiP/Vq72ACtKb/9+kFb/5OpbAPLVGP5FLOv/3LQjAAj4B/9mL1z/8M1m/3HmqwEfucn/wvZG/3oRuwCGRsf/lQOW/3U/ZwBBaHv/1DYTAQaNWABThvP/iDVnAKkbtACxMRgAbzanAMM91/8fAWwBPCpGALkDov/ClSj/9n8m/r53Jv89dwgBYKHb/yrL3QGx8qT/9Z8KAHTEAAAFXc3+gH+zAH3t9v+Votn/VyUU/ozuwAAJCcEAYQHiAB0mCgAAiD//5UjS/iaGXP9O2tABaCRU/wwFwf/yrz3/v6kuAbOTk/9xvov+fawfAANL/P7XJA8AwRsYAf9Flf9ugXYAy135AIqJQP4mRgYAmXTeAKFKewDBY0//djte/z0MKwGSsZ0ALpO/ABD/JgALMx8BPDpi/2/CTQGaW/QAjCiQAa0K+wDL0TL+bIJOAOS0WgCuB/oAH648ACmrHgB0Y1L/dsGL/7utxv7abzgAuXvYAPmeNAA0tF3/yQlb/zgtpv6Em8v/OuhuADTTWf/9AKIBCVe3AJGILAFeevUAVbyrAZNcxgAACGgAHl+uAN3mNAH39+v/ia41/yMVzP9H49YB6FLCAAsw4/+qSbj/xvv8/ixwIgCDZYP/SKi7AISHff+KaGH/7rio//NoVP+H2OL/i5DtALyJlgFQOIz/Vqmn/8JOGf/cEbT/EQ3BAHWJ1P+N4JcAMfSvAMFjr/8TY5oB/0E+/5zSN//y9AP/+g6VAJ5Y2f+dz4b+++gcAC6c+/+rOLj/7zPqAI6Kg/8Z/vMBCsnCAD9hSwDS76IAwMgfAXXW8wAYR97+Nijo/0y3b/6QDlf/1k+I/9jE1ACEG4z+gwX9AHxsE/8c10sATN43/um2PwBEq7/+NG/e/wppTf9QqusAjxhY/y3neQCUgeABPfZUAP0u2//vTCEAMZQS/uYlRQBDhhb+jpteAB+d0/7VKh7/BOT3/vywDf8nAB/+8fT//6otCv793vkA3nKEAP8vBv+0o7MBVF6X/1nRUv7lNKn/1ewAAdY45P+Hd5f/cMnBAFOgNf4Gl0IAEqIRAOlhWwCDBU4BtXg1/3VfP//tdbkAv36I/5B36QC3OWEBL8m7/6eldwEtZH4AFWIG/pGWX/94NpgA0WJoAI9vHv64lPkA69guAPjKlP85XxYA8uGjAOn36P9HqxP/Z/Qx/1RnXf9EefQBUuANAClPK//5zqf/1zQV/sAgFv/3bzwAZUom/xZbVP4dHA3/xufX/vSayADfie0A04QOAF9Azv8RPvf/6YN5AV0XTQDNzDT+Ub2IALTbigGPEl4AzCuM/ryv2wBvYo//lz+i/9MyR/4TkjUAki1T/rJS7v8QhVT/4sZd/8lhFP94diP/cjLn/6LlnP/TGgwAcidz/87UhgDF2aD/dIFe/sfX2/9L3/kB/XS1/+jXaP/kgvb/uXVWAA4FCADvHT0B7VeF/32Sif7MqN8ALqj1AJppFgDc1KH/a0UY/4natf/xVMb/gnrT/40Imf++sXYAYFmyAP8QMP56YGn/dTbo/yJ+af/MQ6YA6DSK/9OTDAAZNgcALA/X/jPsLQC+RIEBapPhABxdLf7sjQ//ET2hANxzwADskRj+b6ipAOA6P/9/pLwAUupLAeCehgDRRG4B2abZAEbhpgG7wY//EAdY/wrNjAB1wJwBETgmABt8bAGr1zf/X/3UAJuHqP/2spn+mkRKAOg9YP5phDsAIUzHAb2wgv8JaBn+S8Zm/+kBcABs3BT/cuZGAIzChf85nqT+kgZQ/6nEYQFVt4IARp7eATvt6v9gGRr/6K9h/wt5+P5YI8IA27T8/koI4wDD40kBuG6h/zHppAGANS8AUg55/8G+OgAwrnX/hBcgACgKhgEWMxn/8Auw/245kgB1j+8BnWV2/zZUTADNuBL/LwRI/05wVf/BMkIBXRA0/whphgAMbUj/Opz7AJAjzAAsoHX+MmvCAAFEpf9vbqIAnlMo/kzW6gA62M3/q2CT/yjjcgGw4/EARvm3AYhUi/88evf+jwl1/7Guif5J948A7Ll+/z4Z9/8tQDj/ofQGACI5OAFpylMAgJPQAAZnCv9KikH/YVBk/9auIf8yhkr/bpeC/m9UrABUx0v++Dtw/wjYsgEJt18A7hsI/qrN3ADD5YcAYkzt/+JbGgFS2yf/4b7HAdnIef9Rswj/jEHOALLPV/76/C7/aFluAf29nv+Q1p7/oPU2/zW3XAEVyML/kiFxAdEB/wDraiv/pzToAJ3l3QAzHhkA+t0bAUGTV/9Pe8QAQcTf/0wsEQFV8UQAyrf5/0HU1P8JIZoBRztQAK/CO/+NSAkAZKD0AObQOAA7GUv+UMLCABIDyP6gn3MAhI/3AW9dOf867QsBht6H/3qjbAF7K77/+73O/lC2SP/Q9uABETwJAKHPJgCNbVsA2A/T/4hObgBio2j/FVB5/62ytwF/jwQAaDxS/tYQDf9g7iEBnpTm/3+BPv8z/9L/Po3s/p034P9yJ/QAwLz6/+RMNQBiVFH/rcs9/pMyN//M678ANMX0AFgr0/4bv3cAvOeaAEJRoQBcwaAB+uN4AHs34gC4EUgAhagK/haHnP8pGWf/MMo6ALqVUf+8hu8A67W9/tmLvP9KMFIALtrlAL39+wAy5Qz/042/AYD0Gf+p53r+Vi+9/4S3F/8lspb/M4n9AMhOHwAWaTIAgjwAAISjW/4X57sAwE/vAJ1mpP/AUhQBGLVn//AJ6gABe6T/hekA/8ry8gA8uvUA8RDH/+B0nv6/fVv/4FbPAHkl5//jCcb/D5nv/3no2f5LcFIAXww5/jPWaf+U3GEBx2IkAJzRDP4K1DQA2bQ3/tSq6P/YFFT/nfqHAJ1jf/4BzikAlSRGATbEyf9XdAD+66uWABuj6gDKh7QA0F8A/nucXQC3PksAieu2AMzh///Wi9L/AnMI/x0MbwA0nAEA/RX7/yWlH/4MgtMAahI1/ipjmgAO2T3+2Atc/8jFcP6TJscAJPx4/mupTQABe5//z0tmAKOvxAAsAfAAeLqw/g1iTP/tfPH/6JK8/8hg4ADMHykA0MgNABXhYP+vnMQA99B+AD649P4Cq1EAVXOeADZALf8TinIAh0fNAOMvkwHa50IA/dEcAPQPrf8GD3b+EJbQ/7kWMv9WcM//S3HXAT+SK/8E4RP+4xc+/w7/1v4tCM3/V8WX/tJS1//1+Pf/gPhGAOH3VwBaeEYA1fVcAA2F4gAvtQUBXKNp/wYehf7osj3/5pUY/xIxngDkZD3+dPP7/01LXAFR25P/TKP+/o3V9gDoJZj+YSxkAMklMgHU9DkArqu3//lKcACmnB4A3t1h//NdSf77ZWT/2Nld//6Ku/+OvjT/O8ux/8heNABzcp7/pZhoAX5j4v92nfQBa8gQAMFa5QB5BlgAnCBd/n3x0/8O7Z3/pZoV/7jgFv/6GJj/cU0fAPerF//tscz/NImR/8K2cgDg6pUACm9nAcmBBADujk4ANAYo/27Vpf48z/0APtdFAGBhAP8xLcoAeHkW/+uLMAHGLSL/tjIbAYPSW/8uNoAAr3tp/8aNTv5D9O//9TZn/k4m8v8CXPn++65X/4s/kAAYbBv/ImYSASIWmABC5Xb+Mo9jAJCplQF2HpgAsgh5AQifEgBaZeb/gR13AEQkCwHotzcAF/9g/6Epwf8/i94AD7PzAP9kD/9SNYcAiTmVAWPwqv8W5uT+MbRS/z1SKwBu9dkAx309AC79NACNxdsA05/BADd5af63FIEAqXeq/8uyi/+HKLb/rA3K/0GylAAIzysAejV/AUqhMADj1oD+Vgvz/2RWBwH1RIb/PSsVAZhUXv++PPr+73bo/9aIJQFxTGv/XWhkAZDOF/9ulpoB5Ge5ANoxMv6HTYv/uQFOAAChlP9hHen/z5SV/6CoAABbgKv/BhwT/gtv9wAnu5b/iuiVAHU+RP8/2Lz/6+og/h05oP8ZDPEBqTy/ACCDjf/tn3v/XsVe/nT+A/9cs2H+eWFc/6pwDgAVlfgA+OMDAFBgbQBLwEoBDFri/6FqRAHQcn//cir//koaSv/3s5b+eYw8AJNGyP/WKKH/obzJ/41Bh//yc/wAPi/KALSV//6CN+0ApRG6/wqpwgCcbdr/cIx7/2iA3/6xjmz/eSXb/4BNEv9vbBcBW8BLAK71Fv8E7D7/K0CZAeOt/gDteoQBf1m6/45SgP78VK4AWrOxAfPWV/9nPKL/0IIO/wuCiwDOgdv/Xtmd/+/m5v90c5/+pGtfADPaAgHYfcb/jMqA/gtfRP83CV3+rpkG/8ysYABFoG4A1SYx/htQ1QB2fXIARkZD/w+OSf+Dern/8xQy/oLtKADSn4wBxZdB/1SZQgDDfloAEO7sAXa7Zv8DGIX/u0XmADjFXAHVRV7/UIrlAc4H5gDeb+YBW+l3/wlZBwECYgEAlEqF/zP2tP/ksXABOr1s/8LL7f4V0cMAkwojAVad4gAfo4v+OAdL/z5adAC1PKkAiqLU/lGnHwDNWnD/IXDjAFOXdQGx4En/rpDZ/+bMT/8WTej/ck7qAOA5fv4JMY0A8pOlAWi2jP+nhAwBe0R/AOFXJwH7bAgAxsGPAXmHz/+sFkYAMkR0/2WvKP/4aekApssHAG7F2gDX/hr+qOL9AB+PYAALZykAt4HL/mT3Sv/VfoQA0pMsAMfqGwGUL7UAm1ueATZpr/8CTpH+ZppfAIDPf/40fOz/glRHAN3z0wCYqs8A3mrHALdUXv5cyDj/irZzAY5gkgCFiOQAYRKWADf7QgCMZgQAymeXAB4T+P8zuM8AysZZADfF4f6pX/n/QkFE/7zqfgCm32QBcO/0AJAXwgA6J7YA9CwY/q9Es/+YdpoBsKKCANlyzP6tfk7/Id4e/yQCW/8Cj/MACevXAAOrlwEY1/X/qC+k/vGSzwBFgbQARPNxAJA1SP77LQ4AF26oAERET/9uRl/+rluQ/yHOX/+JKQf/E7uZ/iP/cP8Jkbn+Mp0lAAtwMQFmCL7/6vOpATxVFwBKJ70AdDHvAK3V0gAuoWz/n5YlAMR4uf8iYgb/mcM+/2HmR/9mPUwAGtTs/6RhEADGO5IAoxfEADgYPQC1YsEA+5Pl/2K9GP8uNs7/6lL2ALdnJgFtPswACvDgAJIWdf+OmngARdQjANBjdgF5/wP/SAbCAHURxf99DxcAmk+ZANZexf+5N5P/Pv5O/n9SmQBuZj//bFKh/2m71AFQiicAPP9d/0gMugDS+x8BvqeQ/+QsE/6AQ+gA1vlr/oiRVv+ELrAAvbvj/9AWjADZ03QAMlG6/ov6HwAeQMYBh5tkAKDOF/67otP/ELw/AP7QMQBVVL8A8cDy/5l+kQHqoqL/5mHYAUCHfgC+lN8BNAAr/xwnvQFAiO4Ar8S5AGLi1f9/n/QB4q88AKDpjgG088//RZhZAR9lFQCQGaT+i7/RAFsZeQAgkwUAJ7p7/z9z5v9dp8b/j9Xc/7OcE/8ZQnoA1qDZ/wItPv9qT5L+M4lj/1dk5/+vkej/ZbgB/64JfQBSJaEBJHKN/zDejv/1upoABa7d/j9ym/+HN6ABUB+HAH76swHs2i0AFByRARCTSQD5vYQBEb3A/9+Oxv9IFA//+jXt/g8LEgAb03H+1Ws4/66Tkv9gfjAAF8FtASWiXgDHnfn+GIC7/80xsv5dpCr/K3frAVi37f/a0gH/a/4qAOYKY/+iAOIA2+1bAIGyywDQMl/+ztBf//e/Wf5u6k//pT3zABR6cP/29rn+ZwR7AOlj5gHbW/z/x94W/7P16f/T8eoAb/rA/1VUiABlOjL/g62c/nctM/926RD+8lrWAF6f2wEDA+r/Ykxc/lA25gAF5Of+NRjf/3E4dgEUhAH/q9LsADjxnv+6cxP/COWuADAsAAFycqb/Bkni/81Z9ACJ40sB+K04AEp49v53Awv/UXjG/4h6Yv+S8d0BbcJO/9/xRgHWyKn/Yb4v/y9nrv9jXEj+dum0/8Ej6f4a5SD/3vzGAMwrR//HVKwAhma+AG/uYf7mKOYA481A/sgM4QCmGd4AcUUz/4+fGACnuEoAHeB0/p7Q6QDBdH7/1AuF/xY6jAHMJDP/6B4rAOtGtf9AOJL+qRJU/+IBDf/IMrD/NNX1/qjRYQC/RzcAIk6cAOiQOgG5Sr0Auo6V/kBFf/+hy5P/sJe/AIjny/6jtokAoX77/ukgQgBEz0IAHhwlAF1yYAH+XPf/LKtFAMp3C/+8djIB/1OI/0dSGgBG4wIAIOt5AbUpmgBHhuX+yv8kACmYBQCaP0n/IrZ8AHndlv8azNUBKaxXAFqdkv9tghQAR2vI//NmvQABw5H+Llh1AAjO4wC/bv3/bYAU/oZVM/+JsXAB2CIW/4MQ0P95laoAchMXAaZQH/9x8HoA6LP6AERutP7SqncA32yk/89P6f8b5eL+0WJR/09EBwCDuWQAqh2i/xGia/85FQsBZMi1/39BpgGlhswAaKeoAAGkTwCShzsBRjKA/2Z3Df7jBocAoo6z/6Bk3gAb4NsBnl3D/+qNiQAQGH3/7s4v/2ERYv90bgz/YHNNAFvj6P/4/k//XOUG/ljGiwDOS4EA+k3O/430ewGKRdwAIJcGAYOnFv/tRKf+x72WAKOriv8zvAb/Xx2J/pTiswC1a9D/hh9S/5dlLf+ByuEA4EiTADCKl//DQM7+7dqeAGodif79ven/Zw8R/8Jh/wCyLan+xuGbACcwdf+HanMAYSa1AJYvQf9TguX+9iaBAFzvmv5bY38AoW8h/+7Z8v+DucP/1b+e/ymW2gCEqYMAWVT8AatGgP+j+Mv+ATK0/3xMVQH7b1AAY0Lv/5rttv/dfoX+Ssxj/0GTd/9jOKf/T/iV/3Sb5P/tKw7+RYkL/xb68QFbeo//zfnzANQaPP8wtrABMBe//8t5mP4tStX/PloS/vWj5v+5anT/UyOfAAwhAv9QIj4AEFeu/61lVQDKJFH+oEXM/0DhuwA6zl4AVpAvAOVW9QA/kb4BJQUnAG37GgCJk+oAonmR/5B0zv/F6Ln/t76M/0kM/v+LFPL/qlrv/2FCu//1tYf+3og0APUFM/7LL04AmGXYAEkXfQD+YCEB69JJ/yvRWAEHgW0Aemjk/qryywDyzIf/yhzp/0EGfwCfkEcAZIxfAE6WDQD7a3YBtjp9/wEmbP+NvdH/CJt9AXGjW/95T77/hu9s/0wv+ACj5O8AEW8KAFiVS//X6+8Ap58Y/y+XbP9r0bwA6edj/hzKlP+uI4r/bhhE/wJFtQBrZlIAZu0HAFwk7f/dolMBN8oG/4fqh/8Y+t4AQV6o/vX40v+nbMn+/6FvAM0I/gCIDXQAZLCE/yvXfv+xhYL/nk+UAEPgJQEMzhX/PiJuAe1or/9QhG//jq5IAFTltP5ps4wAQPgP/+mKEAD1Q3v+2nnU/z9f2gHVhYn/j7ZS/zAcCwD0co0B0a9M/521lv+65QP/pJ1vAee9iwB3yr7/2mpA/0TrP/5gGqz/uy8LAdcS+/9RVFkARDqAAF5xBQFcgdD/YQ9T/gkcvADvCaQAPM2YAMCjYv+4EjwA2baLAG07eP8EwPsAqdLw/yWsXP6U0/X/s0E0AP0NcwC5rs4BcryV/+1arQArx8D/WGxxADQjTABCGZT/3QQH/5fxcv++0egAYjLHAJeW1f8SSiQBNSgHABOHQf8arEUAru1VAGNfKQADOBAAJ6Cx/8hq2v65RFT/W7o9/kOPjf8N9Kb/Y3LGAMduo//BEroAfO/2AW5EFgAC6y4B1DxrAGkqaQEO5pgABwWDAI1omv/VAwYAg+Si/7NkHAHne1X/zg7fAf1g5gAmmJUBYol6ANbNA//imLP/BoWJAJ5FjP9xopr/tPOs/xu9c/+PLtz/1Ybh/34dRQC8K4kB8kYJAFrM///nqpMAFzgT/jh9nf8ws9r/T7b9/ybUvwEp63wAYJccAIeUvgDN+Sf+NGCI/9QsiP9D0YP//IIX/9uAFP/GgXYAbGULALIFkgE+B2T/texe/hwapABMFnD/eGZPAMrA5QHIsNcAKUD0/864TgCnLT8BoCMA/zsMjv/MCZD/217lAXobcAC9aW3/QNBK//t/NwEC4sYALEzRAJeYTf/SFy4ByatF/yzT5wC+JeD/9cQ+/6m13v8i0xEAd/HF/+UjmAEVRSj/suKhAJSzwQDbwv4BKM4z/+dc+gFDmaoAFZTxAKpFUv95Euf/XHIDALg+5gDhyVf/kmCi/7Xy3ACtu90B4j6q/zh+2QF1DeP/syzvAJ2Nm/+Q3VMA69HQACoRpQH7UYUAfPXJ/mHTGP9T1qYAmiQJ//gvfwBa24z/odkm/tSTP/9CVJQBzwMBAOaGWQF/Tnr/4JsB/1KISgCynND/uhkx/94D0gHllr7/VaI0/ylUjf9Je1T+XRGWAHcTHAEgFtf/HBfM/47xNP/kNH0AHUzPANen+v6vpOYAN89pAW279f+hLNwBKWWA/6cQXgBd1mv/dkgA/lA96v95r30Ai6n7AGEnk/76xDH/pbNu/t9Gu/8Wjn0BmrOK/3awKgEKrpkAnFxmAKgNof+PECAA+sW0/8ujLAFXICQAoZkU/3v8DwAZ41AAPFiOABEWyQGazU3/Jz8vAAh6jQCAF7b+zCcT/wRwHf8XJIz/0up0/jUyP/95q2j/oNteAFdSDv7nKgUApYt//lZOJgCCPEL+yx4t/y7EegH5NaL/iI9n/tfScgDnB6D+qZgq/28t9gCOg4f/g0fM/yTiCwAAHPL/4YrV//cu2P71A7cAbPxKAc4aMP/NNvb/08Yk/3kjMgA02Mr/JouB/vJJlABD543/Ki/MAE50GQEE4b//BpPkADpYsQB6peX//FPJ/+CnYAGxuJ7/8mmzAfjG8ACFQssB/iQvAC0Yc/93Pv4AxOG6/nuNrAAaVSn/4m+3ANXnlwAEOwf/7oqUAEKTIf8f9o3/0Y10/2hwHwBYoawAU9fm/i9vlwAtJjQBhC3MAIqAbf7pdYb/876t/vHs8ABSf+z+KN+h/2624f97ru8Ah/KRATPRmgCWA3P+2aT8/zecRQFUXv//6EktARQT1P9gxTv+YPshACbHSQFArPf/dXQ4/+QREgA+imcB9uWk//R2yf5WIJ//bSKJAVXTugAKwcH+esKxAHruZv+i2qsAbNmhAZ6qIgCwL5sBteQL/wicAAAQS10AzmL/ATqaIwAM87j+Q3VC/+blewDJKm4AhuSy/rpsdv86E5r/Uqk+/3KPcwHvxDL/rTDB/5MCVP+WhpP+X+hJAG3jNP6/iQoAKMwe/kw0Yf+k634A/ny8AEq2FQF5HSP/8R4H/lXa1v8HVJb+URt1/6CfmP5CGN3/4wo8AY2HZgDQvZYBdbNcAIQWiP94xxwAFYFP/rYJQQDao6kA9pPG/2smkAFOr83/1gX6/i9YHf+kL8z/KzcG/4OGz/50ZNYAYIxLAWrckADDIBwBrFEF/8ezNP8lVMsAqnCuAAsEWwBF9BsBdYNcACGYr/+MmWv/+4cr/leKBP/G6pP+eZhU/81lmwGdCRkASGoR/myZAP+95boAwQiw/66V0QDugh0A6dZ+AT3iZgA5owQBxm8z/y1PTgFz0gr/2gkZ/56Lxv/TUrv+UIVTAJ2B5gHzhYb/KIgQAE1rT/+3VVwBsczKAKNHk/+YRb4ArDO8AfrSrP/T8nEBWVka/0BCb/50mCoAoScb/zZQ/gBq0XMBZ3xhAN3mYv8f5wYAssB4/g/Zy/98nk8AcJH3AFz6MAGjtcH/JS+O/pC9pf8ukvAABkuAACmdyP5XedUAAXHsAAUt+gCQDFIAH2znAOHvd/+nB73/u+SE/269IgBeLMwBojTFAE688f45FI0A9JIvAc5kMwB9a5T+G8NNAJj9WgEHj5D/MyUfACJ3Jv8HxXYAmbzTAJcUdP71QTT/tP1uAS+x0QChYxH/dt7KAH2z/AF7Nn7/kTm/ADe6eQAK84oAzdPl/32c8f6UnLn/4xO8/3wpIP8fIs7+ETlTAMwWJf8qYGIAd2a4AQO+HABuUtr/yMzA/8mRdgB1zJIAhCBiAcDCeQBqofgB7Vh8ABfUGgDNq1r/+DDYAY0l5v98ywD+nqge/9b4FQBwuwf/S4Xv/0rj8//6k0YA1niiAKcJs/8WnhIA2k3RAWFtUf/0IbP/OTQ5/0Gs0v/5R9H/jqnuAJ69mf+u/mf+YiEOAI1M5v9xizT/DzrUAKjXyf/4zNcB30Sg/zmat/4v53kAaqaJAFGIigClKzMA54s9ADlfO/52Yhn/lz/sAV6++v+puXIBBfo6/0tpYQHX34YAcWOjAYA+cABjapMAo8MKACHNtgDWDq7/gSbn/zW23wBiKp//9w0oALzSsQEGFQD//z2U/oktgf9ZGnT+fiZyAPsy8v55hoD/zPmn/qXr1wDKsfMAhY0+APCCvgFur/8AABSSASXSef8HJ4IAjvpU/43IzwAJX2j/C/SuAIbofgCnAXv+EMGV/+jp7wHVRnD//HSg/vLe3P/NVeMAB7k6AHb3PwF0TbH/PvXI/j8SJf9rNej+Mt3TAKLbB/4CXisAtj62/qBOyP+HjKoA67jkAK81iv5QOk3/mMkCAT/EIgAFHrgAq7CaAHk7zgAmYycArFBN/gCGlwC6IfH+Xv3f/yxy/ABsfjn/ySgN/yflG/8n7xcBl3kz/5mW+AAK6q7/dvYE/sj1JgBFofIBELKWAHE4ggCrH2kAGlhs/zEqagD7qUIARV2VABQ5/gCkGW8AWrxa/8wExQAo1TIB1GCE/1iKtP7kknz/uPb3AEF1Vv/9ZtL+/nkkAIlzA/88GNgAhhIdADviYQCwjkcAB9GhAL1UM/6b+kgA1VTr/y3e4ADulI//qio1/06ndQC6ACj/fbFn/0XhQgDjB1gBS6wGAKkt4wEQJEb/MgIJ/4vBFgCPt+f+2kUyAOw4oQHVgyoAipEs/ojlKP8xPyP/PZH1/2XAAv7op3EAmGgmAXm52gB5i9P+d/AjAEG92f67s6L/oLvmAD74Dv88TmEA//ej/+E7W/9rRzr/8S8hATJ17ADbsT/+9FqzACPC1/+9QzL/F4eBAGi9Jf+5OcIAIz7n/9z4bAAM57IAj1BbAYNdZf+QJwIB//qyAAUR7P6LIC4AzLwm/vVzNP+/cUn+v2xF/xZF9QEXy7IAqmOqAEH4bwAlbJn/QCVFAABYPv5ZlJD/v0TgAfEnNQApy+3/kX7C/90q/f8ZY5cAYf3fAUpzMf8Gr0j/O7DLAHy3+QHk5GMAgQzP/qjAw//MsBD+mOqrAE0lVf8heIf/jsLjAR/WOgDVu33/6C48/750Kv6XshP/Mz7t/szswQDC6DwArCKd/70QuP5nA1//jekk/ikZC/8Vw6YAdvUtAEPVlf+fDBL/u6TjAaAZBQAMTsMBK8XhADCOKf7Emzz/38cSAZGInAD8dan+keLuAO8XawBttbz/5nAx/kmq7f/nt+P/UNwUAMJrfwF/zWUALjTFAdKrJP9YA1r/OJeNAGC7//8qTsgA/kZGAfR9qADMRIoBfNdGAGZCyP4RNOQAddyP/sv4ewA4Eq7/upek/zPo0AGg5Cv/+R0ZAUS+PwCFO4wBvfEk//glwwFg3DcAt0w+/8NCPQAyTKQB4aRM/0w9o/91Ph8AUZFA/3ZBDgCic9b/BoouAHzm9P8Kio8ANBrCALj0TACBjykBvvQT/3uqev9igUQAedWTAFZlHv+hZ5sAjFlD/+/lvgFDC7UAxvCJ/u5FvP9Dl+4AEyps/+VVcQEyRIf/EWoJADJnAf9QAagBI5ge/xCouQE4Wej/ZdL8ACn6RwDMqk//Di7v/1BN7wC91kv/EY35ACZQTP++VXUAVuSqAJzY0AHDz6T/lkJM/6/hEP+NUGIBTNvyAMaicgAu2pgAmyvx/pugaP8zu6UAAhGvAEJUoAH3Oh4AI0E1/kXsvwAthvUBo3vdACBuFP80F6UAutZHAOmwYADy7zYBOVmKAFMAVP+IoGQAXI54/mh8vgC1sT7/+ilVAJiCKgFg/PYAl5c//u+FPgAgOJwALae9/46FswGDVtMAu7OW/vqqDv/So04AJTSXAGNNGgDunNX/1cDRAUkuVAAUQSkBNs5PAMmDkv6qbxj/sSEy/qsmy/9O93QA0d2ZAIWAsgE6LBkAySc7Ab0T/AAx5dIBdbt1ALWzuAEActsAMF6TAPUpOAB9Dcz+9K13ACzdIP5U6hQA+aDGAex+6v8vY6j+quKZ/2az2ADijXr/ekKZ/rb1hgDj5BkB1jnr/9itOP+159IAd4Cd/4FfiP9ufjMAAqm3/weCYv5FsF7/dATjAdnykf/KrR8BaQEn/y6vRQDkLzr/1+BF/s84Rf8Q/ov/F8/U/8oUfv9f1WD/CbAhAMgFz//xKoD+IyHA//jlxAGBEXgA+2eX/wc0cP+MOEL/KOL1/9lGJf6s1gn/SEOGAZLA1v8sJnAARLhL/85a+wCV640Atao6AHT07wBcnQIAZq1iAOmJYAF/McsABZuUABeUCf/TegwAIoYa/9vMiACGCCn/4FMr/lUZ9wBtfwD+qYgwAO532//nrdUAzhL+/gi6B/9+CQcBbypIAG807P5gP40Ak79//s1OwP8Oau0Bu9tMAK/zu/5pWa0AVRlZAaLzlAACdtH+IZ4JAIujLv9dRigAbCqO/m/8jv+b35AAM+Wn/0n8m/9edAz/mKDa/5zuJf+z6s//xQCz/5qkjQDhxGgACiMZ/tHU8v9h/d7+uGXlAN4SfwGkiIf/Hs+M/pJh8wCBwBr+yVQh/28KTv+TUbL/BAQYAKHu1/8GjSEANdcO/ym10P/ni50As8vd//+5cQC94qz/cULW/8o+Lf9mQAj/Tq4Q/oV1RP/c4z3/N/L//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD6kvj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQhz+TV3a/1Wkcf5UyUX/E1BG/+QZ+/+hm+IAFeRi/2Kt/f7wx/n/AAAAAAAAAADzmnwA2CCZ/1z6+/64IjAADXhHAb5fFgDg2yj+O9Ke/6NFoAB4GDT/AAAAAAAAAAB5LDD/xmHfAAMrRQCyLHUA/ZMAAe2iDf8gIKP+E/cd/yFM0QBEKJ3/AAAAAAAAAACGkbP+7kBG/6gwSQH6CUUA8Bu5/y9D9wA/RHoA2CR//34GMQDMD2kAAAAAAAAAAAABAAAAAAAAAIKAAAAAAAAAioAAAAAAAIAAgACAAAAAgIuAAAAAAAAAAQAAgAAAAACBgACAAAAAgAmAAAAAAACAigAAAAAAAACIAAAAAAAAAAmAAIAAAAAACgAAgAAAAACLgACAAAAAAIsAAAAAAACAiYAAAAAAAIADgAAAAAAAgAKAAAAAAACAgAAAAAAAAIAKgAAAAAAAAAoAAIAAAACAgYAAgAAAAICAgAAAAAAAgAEAAIAAAAAACIAAgAAAAIABAAAAAwAAAAYAAAAKAAAADwAAABUAAAAcAAAAJAAAAC0AAAA3AAAAAgAAAA4AAAAbAAAAKQAAADgAAAAIAAAAGQAAACsAAAA+AAAAEgAAACcAAAA9AAAAFAAAACwAAAAKAAAABwAAAAsAAAARAAAAEgAAAAMAAAAFAAAAEAAAAAgAAAAVAAAAGAAAAAQAAAAPAAAAFwAAABMAAAANAAAADAAAAAIAAAAUAAAADgAAABYAAAAJAAAABgAAAAEAAAD///////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0OD///////////////////////////////////CgsMDQ4P////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yIkAAKiJAACoiQAAyIkAAKiJAACgiwAAAAAAAAAAAACoiQAAqIkAALCLAACoiQAAWIsAAOCJAACwiwAAqIkAAGiLAADIiQAAsIsAAKiJAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAARMJCwsAAAkGCwAACwAGEQAAABEREQAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAA0AAAAEDQAAAAAJDgAAAAAADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAABISEgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAoAAAAACgAAAAAJCwAAAAAACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUZUISIZDQECAxFLHAwQBAsdEh4naG5vcHFiIAUGDxMUFRoIFgcoJBcYCQoOGx8lI4OCfSYqKzw9Pj9DR0pNWFlaW1xdXl9gYWNkZWZnaWprbHJzdHl6e3wAAAAAAAAAAABJbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlv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bnNpZ25lZCBjaGFyKj4oJnNlYykpID09IDAAZnJvbUhleDogaW52YWxpZCBjaGFyYWN0ZXIAZnJvbUhleDogaW52YWxpZCBzdHJpbmcgc2l6ZQAwMTIzNDU2Nzg5YWJjZGVmAGdlbmVyYXRlUmluZ1NpZ25hdHVyZXMAaWlpaWlpaQBnZW5lcmF0ZV9rZXlzAGlpAGdlbmVyYXRlX2tleV9pbWFnZQBpaWlpAGNuX2Zhc3RfaGFzaABpaWkAdW5kZXJpdmVQdWJsaWNLZXkAaWlpaWkAVmVjdG9yU3RyaW5nAEtleXMAaQB2aQBTZWNyZXRLZXkAdmlpaQBQdWJsaWNLZXkATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUATlN0M19fMjIxX19iYXNpY19zdHJpbmdfY29tbW9uSUxiMUVFRQA0S2V5cwB2AHB1c2hfYmFjawByZXNpemUAdmlpaWkAc2l6ZQBnZXQAc2V0AE4xMGVtc2NyaXB0ZW4zdmFsRQBhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAFBLTlN0M19fMjZ2ZWN0b3JJTlNfMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRU5TNF9JUzZfRUVFRQBQTlN0M19fMjZ2ZWN0b3JJTlNfMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRU5TNF9JUzZfRUVFRQBOU3QzX18yNnZlY3RvcklOU18xMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFTlM0X0lTNl9FRUVFAE5TdDNfXzIxM19fdmVjdG9yX2Jhc2VJTlNfMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRU5TNF9JUzZfRUVFRQBOU3QzX18yMjBfX3ZlY3Rvcl9iYXNlX2NvbW1vbklMYjFFRUUAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmcgZG91YmxlPgBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0llRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAtKyAgIDBYMHgAKG51bGwpAC0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4ALgBtdXRleCBsb2NrIGZhaWxlZAB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzOiAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzAHRlcm1pbmF0aW5nIHdpdGggJXMgZm9yZWlnbiBleGNlcHRpb24AdGVybWluYXRpbmcAdW5jYXVnaHQAU3Q5ZXhjZXB0aW9uAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAFN0OXR5cGVfaW5mbwBOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAHB0aHJlYWRfb25jZSBmYWlsdXJlIGluIF9fY3hhX2dldF9nbG9iYWxzX2Zhc3QoKQBjYW5ub3QgY3JlYXRlIHB0aHJlYWQga2V5IGZvciBfX2N4YV9nZXRfZ2xvYmFscygpAGNhbm5vdCB6ZXJvIG91dCB0aHJlYWQgdmFsdWUgZm9yIF9fY3hhX2dldF9nbG9iYWxzKCkAdGVybWluYXRlX2hhbmRsZXIgdW5leHBlY3RlZGx5IHJldHVybmVkAFN0MTFsb2dpY19lcnJvcgBTdDEzcnVudGltZV9lcnJvcgBTdDEybGVuZ3RoX2Vycm9yAE4xMF9fY3h4YWJpdjExOV9fcG9pbnRlcl90eXBlX2luZm9FAE4xMF9fY3h4YWJpdjExN19fcGJhc2VfdHlwZV9pbmZvRQBOMTBfX2N4eGFiaXYxMjNfX2Z1bmRhbWVudGFsX3R5cGVfaW5mb0UAdgBEbgBiAGMAaABhAHMAdABpAGoAbABtAGYAZABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9F";
var tempDoublePtr = STATICTOP;
STATICTOP += 16;
function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ]);
}
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
function __ZSt18uncaught_exceptionv() {
 return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: (function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var key in EXCEPTIONS.infos) {
   var ptr = +key;
   var adj = EXCEPTIONS.infos[ptr].adjusted;
   var len = adj.length;
   for (var i = 0; i < len; i++) {
    if (adj[i] === adjusted) {
     return ptr;
    }
   }
  }
  return adjusted;
 }),
 addRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 }),
 decRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0 && !info.rethrown) {
   if (info.destructor) {
    Module["dynCall_vi"](info.destructor, ptr);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 }),
 clearRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 })
};
function ___cxa_begin_catch(ptr) {
 var info = EXCEPTIONS.infos[ptr];
 if (info && !info.caught) {
  info.caught = true;
  __ZSt18uncaught_exceptionv.uncaught_exception--;
 }
 if (info) info.rethrown = false;
 EXCEPTIONS.caught.push(ptr);
 EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
 return ptr;
}
function ___resumeException(ptr) {
 if (!EXCEPTIONS.last) {
  EXCEPTIONS.last = ptr;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
function ___cxa_find_matching_catch() {
 var thrown = EXCEPTIONS.last;
 if (!thrown) {
  return (setTempRet0(0), 0) | 0;
 }
 var info = EXCEPTIONS.infos[thrown];
 var throwntype = info.type;
 if (!throwntype) {
  return (setTempRet0(0), thrown) | 0;
 }
 var typeArray = Array.prototype.slice.call(arguments);
 var pointer = Module["___cxa_is_pointer_type"](throwntype);
 if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
 HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
 thrown = ___cxa_find_matching_catch.buffer;
 for (var i = 0; i < typeArray.length; i++) {
  if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
   thrown = HEAP32[thrown >> 2];
   info.adjusted.push(thrown);
   return (setTempRet0(typeArray[i]), thrown) | 0;
  }
 }
 thrown = HEAP32[thrown >> 2];
 return (setTempRet0(throwntype), thrown) | 0;
}
function ___cxa_throw(ptr, type, destructor) {
 EXCEPTIONS.infos[ptr] = {
  ptr: ptr,
  adjusted: [ ptr ],
  type: type,
  destructor: destructor,
  refcount: 0,
  caught: false,
  rethrown: false
 };
 EXCEPTIONS.last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exception = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exception++;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
function ___gxx_personality_v0() {}
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}
var PATH = {
 splitPath: (function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 }),
 normalizeArray: (function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (; up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 }),
 normalize: (function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 }),
 dirname: (function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 }),
 basename: (function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 }),
 extname: (function(path) {
  return PATH.splitPath(path)[3];
 }),
 join: (function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 }),
 join2: (function(l, r) {
  return PATH.normalize(l + "/" + r);
 }),
 resolve: (function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
   return !!p;
  })), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 }),
 relative: (function(from, to) {
  from = PATH.resolve(from).substr(1);
  to = PATH.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (; start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (; end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 })
};
var TTY = {
 ttys: [],
 init: (function() {}),
 shutdown: (function() {}),
 register: (function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 }),
 stream_ops: {
  open: (function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   stream.tty = tty;
   stream.seekable = false;
  }),
  close: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  flush: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  read: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  }),
  write: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   try {
    for (var i = 0; i < length; i++) {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES.EIO);
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  })
 },
 default_tty_ops: {
  get_char: (function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = new Buffer(BUFSIZE);
     var bytesRead = 0;
     var isPosixPlatform = process.platform != "win32";
     var fd = process.stdin.fd;
     if (isPosixPlatform) {
      var usingDevice = false;
      try {
       fd = fs.openSync("/dev/stdin", "r");
       usingDevice = true;
      } catch (e) {}
     }
     try {
      bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
     } catch (e) {
      if (e.toString().indexOf("EOF") != -1) bytesRead = 0; else throw e;
     }
     if (usingDevice) {
      fs.closeSync(fd);
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  }),
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 },
 default_tty1_ops: {
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 }
};
var MEMFS = {
 ops_table: null,
 mount: (function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 getFileDataAsRegularArray: (function(node) {
  if (node.contents && node.contents.subarray) {
   var arr = [];
   for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
   return arr;
  }
  return node.contents;
 }),
 getFileDataAsTypedArray: (function(node) {
  if (!node.contents) return new Uint8Array;
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 }),
 expandFileStorage: (function(node, newCapacity) {
  if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
   node.contents = MEMFS.getFileDataAsRegularArray(node);
   node.usedBytes = node.contents.length;
  }
  if (!node.contents || node.contents.subarray) {
   var prevCapacity = node.contents ? node.contents.length : 0;
   if (prevCapacity >= newCapacity) return;
   var CAPACITY_DOUBLING_MAX = 1024 * 1024;
   newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
   if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
   var oldContents = node.contents;
   node.contents = new Uint8Array(newCapacity);
   if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
   return;
  }
  if (!node.contents && newCapacity > 0) node.contents = [];
  while (node.contents.length < newCapacity) node.contents.push(0);
 }),
 resizeFileStorage: (function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
   return;
  }
  if (!node.contents || node.contents.subarray) {
   var oldContents = node.contents;
   node.contents = new Uint8Array(new ArrayBuffer(newSize));
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
   return;
  }
  if (!node.contents) node.contents = [];
  if (node.contents.length > newSize) node.contents.length = newSize; else while (node.contents.length < newSize) node.contents.push(0);
  node.usedBytes = newSize;
 }),
 node_ops: {
  getattr: (function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  }),
  lookup: (function(parent, name) {
   throw FS.genericErrors[ERRNO_CODES.ENOENT];
  }),
  mknod: (function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  }),
  rename: (function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   old_node.parent = new_dir;
  }),
  unlink: (function(parent, name) {
   delete parent.contents[name];
  }),
  rmdir: (function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
   }
   delete parent.contents[name];
  }),
  readdir: (function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  }),
  symlink: (function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  }),
  readlink: (function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return node.link;
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  }),
  write: (function(stream, buffer, offset, length, position, canOwn) {
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  }),
  allocate: (function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  }),
  mmap: (function(stream, buffer, offset, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = _malloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
    }
    buffer.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  }),
  msync: (function(stream, buffer, offset, length, mmapFlags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   if (mmapFlags & 2) {
    return 0;
   }
   var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  })
 }
};
var IDBFS = {
 dbs: {},
 indexedDB: (function() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  var ret = null;
  if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
 }),
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: (function(mount) {
  return MEMFS.mount.apply(null, arguments);
 }),
 syncfs: (function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, (function(err, local) {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, (function(err, remote) {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   }));
  }));
 }),
 getDB: (function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  if (!req) {
   return callback("Unable to connect to IndexedDB");
  }
  req.onupgradeneeded = (function(e) {
   var db = e.target.result;
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   if (!fileStore.indexNames.contains("timestamp")) {
    fileStore.createIndex("timestamp", "timestamp", {
     unique: false
    });
   }
  });
  req.onsuccess = (function() {
   db = req.result;
   IDBFS.dbs[name] = db;
   callback(null, db);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 getLocalSet: (function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return (function(p) {
    return PATH.join2(root, p);
   });
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    timestamp: stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 }),
 getRemoteSet: (function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, (function(err, db) {
   if (err) return callback(err);
   try {
    var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
    transaction.onerror = (function(e) {
     callback(this.error);
     e.preventDefault();
    });
    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
    var index = store.index("timestamp");
    index.openKeyCursor().onsuccess = (function(event) {
     var cursor = event.target.result;
     if (!cursor) {
      return callback(null, {
       type: "remote",
       db: db,
       entries: entries
      });
     }
     entries[cursor.primaryKey] = {
      timestamp: cursor.key
     };
     cursor.continue();
    });
   } catch (e) {
    return callback(e);
   }
  }));
 }),
 loadLocalEntry: (function(path, callback) {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode,
    contents: node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 }),
 storeLocalEntry: (function(path, entry, callback) {
  try {
   if (FS.isDir(entry.mode)) {
    FS.mkdir(path, entry.mode);
   } else if (FS.isFile(entry.mode)) {
    FS.writeFile(path, entry.contents, {
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.chmod(path, entry.mode);
   FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 removeLocalEntry: (function(path, callback) {
  try {
   var lookup = FS.lookupPath(path);
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 loadRemoteEntry: (function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = (function(event) {
   callback(null, event.target.result);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 storeRemoteEntry: (function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 removeRemoteEntry: (function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 reconcile: (function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach((function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e.timestamp > e2.timestamp) {
    create.push(key);
    total++;
   }
  }));
  var remove = [];
  Object.keys(dst.entries).forEach((function(key) {
   var e = dst.entries[key];
   var e2 = src.entries[key];
   if (!e2) {
    remove.push(key);
    total++;
   }
  }));
  if (!total) {
   return callback(null);
  }
  var completed = 0;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= total) {
    return callback(null);
   }
  }
  transaction.onerror = (function(e) {
   done(this.error);
   e.preventDefault();
  });
  create.sort().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    }));
   } else {
    IDBFS.loadLocalEntry(path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    }));
   }
  }));
  remove.sort().reverse().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  }));
 })
};
var NODEFS = {
 isWindows: false,
 staticInit: (function() {
  NODEFS.isWindows = !!process.platform.match(/^win/);
  var flags = process["binding"]("constants");
  if (flags["fs"]) {
   flags = flags["fs"];
  }
  NODEFS.flagsForNodeMap = {
   "1024": flags["O_APPEND"],
   "64": flags["O_CREAT"],
   "128": flags["O_EXCL"],
   "0": flags["O_RDONLY"],
   "2": flags["O_RDWR"],
   "4096": flags["O_SYNC"],
   "512": flags["O_TRUNC"],
   "1": flags["O_WRONLY"]
  };
 }),
 bufferFrom: (function(arrayBuffer) {
  return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
 }),
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_NODE);
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 }),
 getMode: (function(path) {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 292) >> 2;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(ERRNO_CODES[e.code]);
  }
  return stat.mode;
 }),
 realPath: (function(node) {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 }),
 flagsForNode: (function(flags) {
  flags &= ~2097152;
  flags &= ~2048;
  flags &= ~32768;
  flags &= ~524288;
  var newFlags = 0;
  for (var k in NODEFS.flagsForNodeMap) {
   if (flags & k) {
    newFlags |= NODEFS.flagsForNodeMap[k];
    flags ^= k;
   }
  }
  if (!flags) {
   return newFlags;
  } else {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
 }),
 node_ops: {
  getattr: (function(node) {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  }),
  setattr: (function(node, attr) {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  lookup: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  }),
  mknod: (function(parent, name, mode, dev) {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return node;
  }),
  rename: (function(oldNode, newDir, newName) {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  unlink: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  rmdir: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readdir: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  symlink: (function(parent, newName, oldPath) {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readlink: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    path = fs.readlinkSync(path);
    path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
    return path;
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  })
 },
 stream_ops: {
  open: (function(stream) {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  close: (function(stream) {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  read: (function(stream, buffer, offset, length, position) {
   if (length === 0) return 0;
   try {
    return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  write: (function(stream, buffer, offset, length, position) {
   try {
    return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
var WORKERFS = {
 DIR_MODE: 16895,
 FILE_MODE: 33279,
 reader: null,
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_WORKER);
  if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
  var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
  var createdParents = {};
  function ensureParent(path) {
   var parts = path.split("/");
   var parent = root;
   for (var i = 0; i < parts.length - 1; i++) {
    var curr = parts.slice(0, i + 1).join("/");
    if (!createdParents[curr]) {
     createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
    }
    parent = createdParents[curr];
   }
   return parent;
  }
  function base(path) {
   var parts = path.split("/");
   return parts[parts.length - 1];
  }
  Array.prototype.forEach.call(mount.opts["files"] || [], (function(file) {
   WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
  }));
  (mount.opts["blobs"] || []).forEach((function(obj) {
   WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
  }));
  (mount.opts["packages"] || []).forEach((function(pack) {
   pack["metadata"].files.forEach((function(file) {
    var name = file.filename.substr(1);
    WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
   }));
  }));
  return root;
 }),
 createNode: (function(parent, name, mode, dev, contents, mtime) {
  var node = FS.createNode(parent, name, mode);
  node.mode = mode;
  node.node_ops = WORKERFS.node_ops;
  node.stream_ops = WORKERFS.stream_ops;
  node.timestamp = (mtime || new Date).getTime();
  assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
  if (mode === WORKERFS.FILE_MODE) {
   node.size = contents.size;
   node.contents = contents;
  } else {
   node.size = 4096;
   node.contents = {};
  }
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 node_ops: {
  getattr: (function(node) {
   return {
    dev: 1,
    ino: undefined,
    mode: node.mode,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: undefined,
    size: node.size,
    atime: new Date(node.timestamp),
    mtime: new Date(node.timestamp),
    ctime: new Date(node.timestamp),
    blksize: 4096,
    blocks: Math.ceil(node.size / 4096)
   };
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
  }),
  lookup: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }),
  mknod: (function(parent, name, mode, dev) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rename: (function(oldNode, newDir, newName) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  unlink: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rmdir: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readdir: (function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  }),
  symlink: (function(parent, newName, oldPath) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readlink: (function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   if (position >= stream.node.size) return 0;
   var chunk = stream.node.contents.slice(position, position + length);
   var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
   buffer.set(new Uint8Array(ab), offset);
   return chunk.size;
  }),
  write: (function(stream, buffer, offset, length, position) {
   throw new FS.ErrnoError(ERRNO_CODES.EIO);
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.size;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
STATICTOP += 16;
STATICTOP += 16;
STATICTOP += 16;
var FS = {
 root: null,
 mounts: [],
 devices: {},
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 syncFSRequests: 0,
 handleFSError: (function(e) {
  if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
 }),
 lookupPath: (function(path, opts) {
  path = PATH.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(40);
  }
  var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(40);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 }),
 getPath: (function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 }),
 hashName: (function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 }),
 hashAddNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 }),
 hashRemoveNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 }),
 lookupNode: (function(parent, name) {
  var err = FS.mayLookup(parent);
  if (err) {
   throw new FS.ErrnoError(err, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 }),
 createNode: (function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
   FS.FSNode = (function(parent, name, mode, rdev) {
    if (!parent) {
     parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
   });
   FS.FSNode.prototype = {};
   var readMode = 292 | 73;
   var writeMode = 146;
   Object.defineProperties(FS.FSNode.prototype, {
    read: {
     get: (function() {
      return (this.mode & readMode) === readMode;
     }),
     set: (function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
     })
    },
    write: {
     get: (function() {
      return (this.mode & writeMode) === writeMode;
     }),
     set: (function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
     })
    },
    isFolder: {
     get: (function() {
      return FS.isDir(this.mode);
     })
    },
    isDevice: {
     get: (function() {
      return FS.isChrdev(this.mode);
     })
    }
   });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 }),
 destroyNode: (function(node) {
  FS.hashRemoveNode(node);
 }),
 isRoot: (function(node) {
  return node === node.parent;
 }),
 isMountpoint: (function(node) {
  return !!node.mounted;
 }),
 isFile: (function(mode) {
  return (mode & 61440) === 32768;
 }),
 isDir: (function(mode) {
  return (mode & 61440) === 16384;
 }),
 isLink: (function(mode) {
  return (mode & 61440) === 40960;
 }),
 isChrdev: (function(mode) {
  return (mode & 61440) === 8192;
 }),
 isBlkdev: (function(mode) {
  return (mode & 61440) === 24576;
 }),
 isFIFO: (function(mode) {
  return (mode & 61440) === 4096;
 }),
 isSocket: (function(mode) {
  return (mode & 49152) === 49152;
 }),
 flagModes: {
  "r": 0,
  "rs": 1052672,
  "r+": 2,
  "w": 577,
  "wx": 705,
  "xw": 705,
  "w+": 578,
  "wx+": 706,
  "xw+": 706,
  "a": 1089,
  "ax": 1217,
  "xa": 1217,
  "a+": 1090,
  "ax+": 1218,
  "xa+": 1218
 },
 modeStringToFlags: (function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 }),
 flagsToPermissionString: (function(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 }),
 nodePermissions: (function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return 13;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return 13;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return 13;
  }
  return 0;
 }),
 mayLookup: (function(dir) {
  var err = FS.nodePermissions(dir, "x");
  if (err) return err;
  if (!dir.node_ops.lookup) return 13;
  return 0;
 }),
 mayCreate: (function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return 17;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 }),
 mayDelete: (function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var err = FS.nodePermissions(dir, "wx");
  if (err) {
   return err;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return 20;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return 16;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return 21;
   }
  }
  return 0;
 }),
 mayOpen: (function(node, flags) {
  if (!node) {
   return 2;
  }
  if (FS.isLink(node.mode)) {
   return 40;
  } else if (FS.isDir(node.mode)) {
   if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
    return 21;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 }),
 MAX_OPEN_FDS: 4096,
 nextfd: (function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(24);
 }),
 getStream: (function(fd) {
  return FS.streams[fd];
 }),
 createStream: (function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = (function() {});
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: (function() {
      return this.node;
     }),
     set: (function(val) {
      this.node = val;
     })
    },
    isRead: {
     get: (function() {
      return (this.flags & 2097155) !== 1;
     })
    },
    isWrite: {
     get: (function() {
      return (this.flags & 2097155) !== 0;
     })
    },
    isAppend: {
     get: (function() {
      return this.flags & 1024;
     })
    }
   });
  }
  var newStream = new FS.FSStream;
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 }),
 closeStream: (function(fd) {
  FS.streams[fd] = null;
 }),
 chrdev_stream_ops: {
  open: (function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  }),
  llseek: (function() {
   throw new FS.ErrnoError(29);
  })
 },
 major: (function(dev) {
  return dev >> 8;
 }),
 minor: (function(dev) {
  return dev & 255;
 }),
 makedev: (function(ma, mi) {
  return ma << 8 | mi;
 }),
 registerDevice: (function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 }),
 getDevice: (function(dev) {
  return FS.devices[dev];
 }),
 getMounts: (function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 }),
 syncfs: (function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
   console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(err) {
   assert(FS.syncFSRequests > 0);
   FS.syncFSRequests--;
   return callback(err);
  }
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return doCallback(err);
    }
    return;
   }
   if (++completed >= mounts.length) {
    doCallback(null);
   }
  }
  mounts.forEach((function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  }));
 }),
 mount: (function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(16);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(16);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(20);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 }),
 unmount: (function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(22);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach((function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  }));
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 }),
 lookup: (function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 }),
 mknod: (function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(22);
  }
  var err = FS.mayCreate(parent, name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(1);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 }),
 create: (function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 }),
 mkdir: (function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 }),
 mkdirTree: (function(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
   if (!dirs[i]) continue;
   d += "/" + dirs[i];
   try {
    FS.mkdir(d, mode);
   } catch (e) {
    if (e.errno != 17) throw e;
   }
  }
 }),
 mkdev: (function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 }),
 symlink: (function(oldpath, newpath) {
  if (!PATH.resolve(oldpath)) {
   throw new FS.ErrnoError(2);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(2);
  }
  var newname = PATH.basename(newpath);
  var err = FS.mayCreate(parent, newname);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(1);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 }),
 rename: (function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
   lookup = FS.lookupPath(old_path, {
    parent: true
   });
   old_dir = lookup.node;
   lookup = FS.lookupPath(new_path, {
    parent: true
   });
   new_dir = lookup.node;
  } catch (e) {
   throw new FS.ErrnoError(16);
  }
  if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(18);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(22);
  }
  relative = PATH.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(39);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err = FS.mayDelete(old_dir, old_name, isdir);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(16);
  }
  if (new_dir !== old_dir) {
   err = FS.nodePermissions(old_dir, "w");
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 }),
 rmdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, true);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(16);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(20);
  }
  return node.node_ops.readdir(node);
 }),
 unlink: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, false);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(16);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readlink: (function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(2);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(22);
  }
  return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 }),
 stat: (function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(2);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(1);
  }
  return node.node_ops.getattr(node);
 }),
 lstat: (function(path) {
  return FS.stat(path, true);
 }),
 chmod: (function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 }),
 lchmod: (function(path, mode) {
  FS.chmod(path, mode, true);
 }),
 fchmod: (function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  FS.chmod(stream.node, mode);
 }),
 chown: (function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 }),
 lchown: (function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 }),
 fchown: (function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  FS.chown(stream.node, uid, gid);
 }),
 truncate: (function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(22);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(22);
  }
  var err = FS.nodePermissions(node, "w");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 }),
 ftruncate: (function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(22);
  }
  FS.truncate(stream.node, len);
 }),
 utime: (function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 }),
 open: (function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(2);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(17);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(2);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(20);
  }
  if (!created) {
   var err = FS.mayOpen(node, flags);
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    console.log("FS.trackingDelegate error on read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 }),
 close: (function(stream) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
  stream.fd = null;
 }),
 isClosed: (function(stream) {
  return stream.fd === null;
 }),
 llseek: (function(stream, offset, whence) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(29);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 }),
 read: (function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(22);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(9);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(22);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(29);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 }),
 write: (function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(22);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(9);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(22);
  }
  if (stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(29);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 }),
 allocate: (function(stream, offset, length) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(22);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(9);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(19);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(95);
  }
  stream.stream_ops.allocate(stream, offset, length);
 }),
 mmap: (function(stream, buffer, offset, length, position, prot, flags) {
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(13);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(19);
  }
  return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
 }),
 msync: (function(stream, buffer, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 }),
 munmap: (function(stream) {
  return 0;
 }),
 ioctl: (function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(25);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 }),
 readFile: (function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 }),
 writeFile: (function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data === "string") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
   FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
   throw new Error("Unsupported data type");
  }
  FS.close(stream);
 }),
 cwd: (function() {
  return FS.currentPath;
 }),
 chdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (lookup.node === null) {
   throw new FS.ErrnoError(2);
  }
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(20);
  }
  var err = FS.nodePermissions(lookup.node, "x");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  FS.currentPath = lookup.path;
 }),
 createDefaultDirectories: (function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 }),
 createDefaultDevices: (function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: (function() {
    return 0;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    return length;
   })
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto !== "undefined") {
   var randomBuffer = new Uint8Array(1);
   random_device = (function() {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0];
   });
  } else if (ENVIRONMENT_IS_NODE) {
   random_device = (function() {
    return require("crypto")["randomBytes"](1)[0];
   });
  } else {
   random_device = (function() {
    abort("random_device");
   });
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 }),
 createSpecialDirectories: (function() {
  FS.mkdir("/proc");
  FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: (function() {
    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: (function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(9);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: (function() {
         return stream.path;
        })
       }
      };
      ret.parent = ret;
      return ret;
     })
    };
    return node;
   })
  }, {}, "/proc/self/fd");
 }),
 createStandardStreams: (function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", "r");
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  var stdout = FS.open("/dev/stdout", "w");
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  var stderr = FS.open("/dev/stderr", "w");
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 }),
 ensureErrnoError: (function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.node = node;
   this.setErrno = (function(errno) {
    this.errno = errno;
   });
   this.setErrno(errno);
   this.message = "FS error";
   if (this.stack) Object.defineProperty(this, "stack", {
    value: (new Error).stack,
    writable: true
   });
  };
  FS.ErrnoError.prototype = new Error;
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ 2 ].forEach((function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  }));
 }),
 staticInit: (function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "IDBFS": IDBFS,
   "NODEFS": NODEFS,
   "WORKERFS": WORKERFS
  };
 }),
 init: (function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 }),
 quit: (function() {
  FS.init.initialized = false;
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 }),
 getMode: (function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 }),
 joinPath: (function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/") path = path.substr(1);
  return path;
 }),
 absolutePath: (function(relative, base) {
  return PATH.resolve(base, relative);
 }),
 standardizePath: (function(path) {
  return PATH.normalize(path);
 }),
 findObject: (function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   ___setErrNo(ret.error);
   return null;
  }
 }),
 analyzePath: (function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 }),
 createFolder: (function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
 }),
 createPath: (function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 }),
 createFile: (function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 }),
 createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, "w");
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 }),
 createDevice: (function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: (function(stream) {
    stream.seekable = false;
   }),
   close: (function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   }),
   read: (function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(5);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(11);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(5);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   })
  });
  return FS.mkdev(path, mode, dev);
 }),
 createLink: (function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
 }),
 forceLoadFile: (function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (Module["read"]) {
   try {
    obj.contents = intArrayFromString(Module["read"](obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    success = false;
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success) ___setErrNo(5);
  return success;
 }),
 createLazyFile: (function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest;
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   });
   var lazyArray = this;
   lazyArray.setDataGetter((function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   }));
   if (usesGzip || !datalength) {
    chunkSize = datalength = 1;
    datalength = this.getter(0).length;
    chunkSize = datalength;
    console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
   }
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array;
   Object.defineProperties(lazyArray, {
    length: {
     get: (function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._length;
     })
    },
    chunkSize: {
     get: (function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._chunkSize;
     })
    }
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperties(node, {
   usedBytes: {
    get: (function() {
     return this.contents.length;
    })
   }
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach((function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    if (!FS.forceLoadFile(node)) {
     throw new FS.ErrnoError(5);
    }
    return fn.apply(null, arguments);
   };
  }));
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   if (!FS.forceLoadFile(node)) {
    throw new FS.ErrnoError(5);
   }
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 }),
 createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   var handled = false;
   Module["preloadPlugins"].forEach((function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, (function() {
      if (onerror) onerror();
      removeRunDependency(dep);
     }));
     handled = true;
    }
   }));
   if (!handled) finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
   Browser.asyncLoad(url, (function(byteArray) {
    processData(byteArray);
   }), onerror);
  } else {
   processData(url);
  }
 }),
 indexedDB: (function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 }),
 DB_NAME: (function() {
  return "EM_FS_" + window.location.pathname;
 }),
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   console.log("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }),
 loadFilesFromDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 })
};
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 mappings: {},
 umask: 511,
 calculateAt: (function(dirfd, path) {
  if (path[0] !== "/") {
   var dir;
   if (dirfd === -100) {
    dir = FS.cwd();
   } else {
    var dirstream = FS.getStream(dirfd);
    if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
    dir = dirstream.path;
   }
   path = PATH.join2(dir, path);
  }
  return path;
 }),
 doStat: (function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -ERRNO_CODES.ENOTDIR;
   }
   throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 4 >> 2] = 0;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAP32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  HEAP32[buf + 32 >> 2] = 0;
  HEAP32[buf + 36 >> 2] = stat.size;
  HEAP32[buf + 40 >> 2] = 4096;
  HEAP32[buf + 44 >> 2] = stat.blocks;
  HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
  HEAP32[buf + 52 >> 2] = 0;
  HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
  HEAP32[buf + 60 >> 2] = 0;
  HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
  HEAP32[buf + 68 >> 2] = 0;
  HEAP32[buf + 72 >> 2] = stat.ino;
  return 0;
 }),
 doMsync: (function(addr, stream, len, flags) {
  var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
  FS.msync(stream, buffer, 0, len, flags);
 }),
 doMkdir: (function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 }),
 doMknod: (function(path, mode, dev) {
  switch (mode & 61440) {
  case 32768:
  case 8192:
  case 24576:
  case 4096:
  case 49152:
   break;
  default:
   return -ERRNO_CODES.EINVAL;
  }
  FS.mknod(path, mode, dev);
  return 0;
 }),
 doReadlink: (function(path, buf, bufsize) {
  if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
  var ret = FS.readlink(path);
  var len = Math.min(bufsize, lengthBytesUTF8(ret));
  var endChar = HEAP8[buf + len];
  stringToUTF8(ret, buf, bufsize + 1);
  HEAP8[buf + len] = endChar;
  return len;
 }),
 doAccess: (function(path, amode) {
  if (amode & ~7) {
   return -ERRNO_CODES.EINVAL;
  }
  var node;
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  node = lookup.node;
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 doDup: (function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest) FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
 }),
 doReadv: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.read(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
   if (curr < len) break;
  }
  return ret;
 }),
 doWritev: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.write(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
  }
  return ret;
 }),
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 getStreamFromFD: (function() {
  var stream = FS.getStream(SYSCALLS.get());
  if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return stream;
 }),
 getSocketFromFD: (function() {
  var socket = SOCKFS.getSocket(SYSCALLS.get());
  if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return socket;
 }),
 getSocketAddress: (function(allowNull) {
  var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
  if (allowNull && addrp === 0) return null;
  var info = __read_sockaddr(addrp, addrlen);
  if (info.errno) throw new FS.ErrnoError(info.errno);
  info.addr = DNS.lookup_addr(info.addr) || info.addr;
  return info;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  return SYSCALLS.doWritev(stream, iov, iovcnt);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall221(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
  switch (cmd) {
  case 0:
   {
    var arg = SYSCALLS.get();
    if (arg < 0) {
     return -ERRNO_CODES.EINVAL;
    }
    var newStream;
    newStream = FS.open(stream.path, stream.flags, 0, arg);
    return newStream.fd;
   }
  case 1:
  case 2:
   return 0;
  case 3:
   return stream.flags;
  case 4:
   {
    var arg = SYSCALLS.get();
    stream.flags |= arg;
    return 0;
   }
  case 12:
  case 12:
   {
    var arg = SYSCALLS.get();
    var offset = 0;
    HEAP16[arg + offset >> 1] = 2;
    return 0;
   }
  case 13:
  case 14:
  case 13:
  case 14:
   return 0;
  case 16:
  case 8:
   return -ERRNO_CODES.EINVAL;
  case 9:
   ___setErrNo(ERRNO_CODES.EINVAL);
   return -1;
  default:
   {
    return -ERRNO_CODES.EINVAL;
   }
  }
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall3(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
  return FS.read(stream, HEAP8, buf, count);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall5(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get();
  var stream = FS.open(pathname, flags, mode);
  return stream.fd;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
var structRegistrations = {};
function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}
function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}
function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body);
}
function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, (function(message) {
  this.name = errorName;
  this.message = message;
  var stack = (new Error(message)).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 }));
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = (function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 });
 return errorClass;
}
var InternalError = undefined;
function throwInternalError(message) {
 throw new InternalError(message);
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach((function(type) {
  typeDependencies[type] = dependentTypes;
 }));
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push((function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   }));
  }
 }));
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}
function __embind_finalize_value_object(structType) {
 var reg = structRegistrations[structType];
 delete structRegistrations[structType];
 var rawConstructor = reg.rawConstructor;
 var rawDestructor = reg.rawDestructor;
 var fieldRecords = reg.fields;
 var fieldTypes = fieldRecords.map((function(field) {
  return field.getterReturnType;
 })).concat(fieldRecords.map((function(field) {
  return field.setterArgumentType;
 })));
 whenDependentTypesAreResolved([ structType ], fieldTypes, (function(fieldTypes) {
  var fields = {};
  fieldRecords.forEach((function(field, i) {
   var fieldName = field.fieldName;
   var getterReturnType = fieldTypes[i];
   var getter = field.getter;
   var getterContext = field.getterContext;
   var setterArgumentType = fieldTypes[i + fieldRecords.length];
   var setter = field.setter;
   var setterContext = field.setterContext;
   fields[fieldName] = {
    read: (function(ptr) {
     return getterReturnType["fromWireType"](getter(getterContext, ptr));
    }),
    write: (function(ptr, o) {
     var destructors = [];
     setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
     runDestructors(destructors);
    })
   };
  }));
  return [ {
   name: reg.name,
   "fromWireType": (function(ptr) {
    var rv = {};
    for (var i in fields) {
     rv[i] = fields[i].read(ptr);
    }
    rawDestructor(ptr);
    return rv;
   }),
   "toWireType": (function(destructors, o) {
    for (var fieldName in fields) {
     if (!(fieldName in o)) {
      throw new TypeError("Missing field");
     }
    }
    var ptr = rawConstructor();
    for (fieldName in fields) {
     fields[fieldName].write(ptr, o[fieldName]);
    }
    if (destructors !== null) {
     destructors.push(rawDestructor, ptr);
    }
    return ptr;
   }),
   "argPackAdvance": 8,
   "readValueFromPointer": simpleReadValueFromPointer,
   destructorFunction: rawDestructor
  } ];
 }));
}
function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;
 case 2:
  return 1;
 case 4:
  return 2;
 case 8:
  return 3;
 default:
  throw new TypeError("Unknown type size: " + size);
 }
}
function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}
var BindingError = undefined;
function throwBindingError(message) {
 throw new BindingError(message);
}
function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach((function(cb) {
   cb();
  }));
 }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(wt) {
   return !!wt;
  }),
  "toWireType": (function(destructors, o) {
   return o ? trueValue : falseValue;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": (function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  }),
  destructorFunction: null
 });
}
function ClassHandle_isAliasOf(other) {
 if (!(this instanceof ClassHandle)) {
  return false;
 }
 if (!(other instanceof ClassHandle)) {
  return false;
 }
 var leftClass = this.$$.ptrType.registeredClass;
 var left = this.$$.ptr;
 var rightClass = other.$$.ptrType.registeredClass;
 var right = other.$$.ptr;
 while (leftClass.baseClass) {
  left = leftClass.upcast(left);
  leftClass = leftClass.baseClass;
 }
 while (rightClass.baseClass) {
  right = rightClass.upcast(right);
  rightClass = rightClass.baseClass;
 }
 return leftClass === rightClass && left === right;
}
function shallowCopyInternalPointer(o) {
 return {
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
 };
}
function throwInstanceAlreadyDeleted(obj) {
 function getInstanceTypeName(handle) {
  return handle.$$.ptrType.registeredClass.name;
 }
 throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}
function ClassHandle_clone() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.preservePointerOnDelete) {
  this.$$.count.value += 1;
  return this;
 } else {
  var clone = Object.create(Object.getPrototypeOf(this), {
   $$: {
    value: shallowCopyInternalPointer(this.$$)
   }
  });
  clone.$$.count.value += 1;
  clone.$$.deleteScheduled = false;
  return clone;
 }
}
function runDestructor(handle) {
 var $$ = handle.$$;
 if ($$.smartPtr) {
  $$.smartPtrType.rawDestructor($$.smartPtr);
 } else {
  $$.ptrType.registeredClass.rawDestructor($$.ptr);
 }
}
function ClassHandle_delete() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 this.$$.count.value -= 1;
 var toDelete = 0 === this.$$.count.value;
 if (toDelete) {
  runDestructor(this);
 }
 if (!this.$$.preservePointerOnDelete) {
  this.$$.smartPtr = undefined;
  this.$$.ptr = undefined;
 }
}
function ClassHandle_isDeleted() {
 return !this.$$.ptr;
}
var delayFunction = undefined;
var deletionQueue = [];
function flushPendingDeletes() {
 while (deletionQueue.length) {
  var obj = deletionQueue.pop();
  obj.$$.deleteScheduled = false;
  obj["delete"]();
 }
}
function ClassHandle_deleteLater() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 deletionQueue.push(this);
 if (deletionQueue.length === 1 && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
 this.$$.deleteScheduled = true;
 return this;
}
function init_ClassHandle() {
 ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
 ClassHandle.prototype["clone"] = ClassHandle_clone;
 ClassHandle.prototype["delete"] = ClassHandle_delete;
 ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
 ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}
function ClassHandle() {}
var registeredPointers = {};
function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = (function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  });
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}
function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
 this.name = name;
 this.constructor = constructor;
 this.instancePrototype = instancePrototype;
 this.rawDestructor = rawDestructor;
 this.baseClass = baseClass;
 this.getActualType = getActualType;
 this.upcast = upcast;
 this.downcast = downcast;
 this.pureVirtualFunctions = [];
}
function upcastPointer(ptr, ptrClass, desiredClass) {
 while (ptrClass !== desiredClass) {
  if (!ptrClass.upcast) {
   throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
  }
  ptr = ptrClass.upcast(ptr);
  ptrClass = ptrClass.baseClass;
 }
 return ptr;
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function genericPointerToWireType(destructors, handle) {
 var ptr;
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  if (this.isSmartPointer) {
   ptr = this.rawConstructor();
   if (destructors !== null) {
    destructors.push(this.rawDestructor, ptr);
   }
   return ptr;
  } else {
   return 0;
  }
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (!this.isConst && handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 if (this.isSmartPointer) {
  if (undefined === handle.$$.smartPtr) {
   throwBindingError("Passing raw pointer to smart pointer is illegal");
  }
  switch (this.sharingPolicy) {
  case 0:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
   }
   break;
  case 1:
   ptr = handle.$$.smartPtr;
   break;
  case 2:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    var clonedHandle = handle["clone"]();
    ptr = this.rawShare(ptr, __emval_register((function() {
     clonedHandle["delete"]();
    })));
    if (destructors !== null) {
     destructors.push(this.rawDestructor, ptr);
    }
   }
   break;
  default:
   throwBindingError("Unsupporting sharing policy");
  }
 }
 return ptr;
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function RegisteredPointer_getPointee(ptr) {
 if (this.rawGetPointee) {
  ptr = this.rawGetPointee(ptr);
 }
 return ptr;
}
function RegisteredPointer_destructor(ptr) {
 if (this.rawDestructor) {
  this.rawDestructor(ptr);
 }
}
function RegisteredPointer_deleteObject(handle) {
 if (handle !== null) {
  handle["delete"]();
 }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
 if (ptrClass === desiredClass) {
  return ptr;
 }
 if (undefined === desiredClass.baseClass) {
  return null;
 }
 var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
 if (rv === null) {
  return null;
 }
 return desiredClass.downcast(rv);
}
function getInheritedInstanceCount() {
 return Object.keys(registeredInstances).length;
}
function getLiveInheritedInstances() {
 var rv = [];
 for (var k in registeredInstances) {
  if (registeredInstances.hasOwnProperty(k)) {
   rv.push(registeredInstances[k]);
  }
 }
 return rv;
}
function setDelayFunction(fn) {
 delayFunction = fn;
 if (deletionQueue.length && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
}
function init_embind() {
 Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
 Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
 Module["flushPendingDeletes"] = flushPendingDeletes;
 Module["setDelayFunction"] = setDelayFunction;
}
var registeredInstances = {};
function getBasestPointer(class_, ptr) {
 if (ptr === undefined) {
  throwBindingError("ptr should not be undefined");
 }
 while (class_.baseClass) {
  ptr = class_.upcast(ptr);
  class_ = class_.baseClass;
 }
 return ptr;
}
function getInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 return registeredInstances[ptr];
}
function makeClassHandle(prototype, record) {
 if (!record.ptrType || !record.ptr) {
  throwInternalError("makeClassHandle requires ptr and ptrType");
 }
 var hasSmartPtrType = !!record.smartPtrType;
 var hasSmartPtr = !!record.smartPtr;
 if (hasSmartPtrType !== hasSmartPtr) {
  throwInternalError("Both smartPtrType and smartPtr must be specified");
 }
 record.count = {
  value: 1
 };
 return Object.create(prototype, {
  $$: {
   value: record
  }
 });
}
function RegisteredPointer_fromWireType(ptr) {
 var rawPointer = this.getPointee(ptr);
 if (!rawPointer) {
  this.destructor(ptr);
  return null;
 }
 var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
 if (undefined !== registeredInstance) {
  if (0 === registeredInstance.$$.count.value) {
   registeredInstance.$$.ptr = rawPointer;
   registeredInstance.$$.smartPtr = ptr;
   return registeredInstance["clone"]();
  } else {
   var rv = registeredInstance["clone"]();
   this.destructor(ptr);
   return rv;
  }
 }
 function makeDefaultHandle() {
  if (this.isSmartPointer) {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this.pointeeType,
    ptr: rawPointer,
    smartPtrType: this,
    smartPtr: ptr
   });
  } else {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this,
    ptr: ptr
   });
  }
 }
 var actualType = this.registeredClass.getActualType(rawPointer);
 var registeredPointerRecord = registeredPointers[actualType];
 if (!registeredPointerRecord) {
  return makeDefaultHandle.call(this);
 }
 var toType;
 if (this.isConst) {
  toType = registeredPointerRecord.constPointerType;
 } else {
  toType = registeredPointerRecord.pointerType;
 }
 var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
 if (dp === null) {
  return makeDefaultHandle.call(this);
 }
 if (this.isSmartPointer) {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp,
   smartPtrType: this,
   smartPtr: ptr
  });
 } else {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp
  });
 }
}
function init_RegisteredPointer() {
 RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
 RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
 RegisteredPointer.prototype["argPackAdvance"] = 8;
 RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
 RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
 RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}
function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
 this.name = name;
 this.registeredClass = registeredClass;
 this.isReference = isReference;
 this.isConst = isConst;
 this.isSmartPointer = isSmartPointer;
 this.pointeeType = pointeeType;
 this.sharingPolicy = sharingPolicy;
 this.rawGetPointee = rawGetPointee;
 this.rawConstructor = rawConstructor;
 this.rawShare = rawShare;
 this.rawDestructor = rawDestructor;
 if (!isSmartPointer && registeredClass.baseClass === undefined) {
  if (isConst) {
   this["toWireType"] = constNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  } else {
   this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  }
 } else {
  this["toWireType"] = genericPointerToWireType;
 }
}
function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  Module[name].argCount = numArguments;
 }
}
function embind__requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction);
 }
 var fp;
 if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
  fp = Module["FUNCTION_TABLE_" + signature][rawFunction];
 } else if (typeof FUNCTION_TABLE !== "undefined") {
  fp = FUNCTION_TABLE[rawFunction];
 } else {
  var dc = Module["dynCall_" + signature];
  if (dc === undefined) {
   dc = Module["dynCall_" + signature.replace(/f/g, "d")];
   if (dc === undefined) {
    throwBindingError("No dynCall invoker for signature: " + signature);
   }
  }
  fp = makeDynCaller(dc);
 }
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}
var UnboundTypeError = undefined;
function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}
function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
 if (upcast) {
  upcast = embind__requireFunction(upcastSignature, upcast);
 }
 if (downcast) {
  downcast = embind__requireFunction(downcastSignature, downcast);
 }
 rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
 var legalFunctionName = makeLegalFunctionName(name);
 exposePublicSymbol(legalFunctionName, (function() {
  throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [ baseClassRawType ]);
 }));
 whenDependentTypesAreResolved([ rawType, rawPointerType, rawConstPointerType ], baseClassRawType ? [ baseClassRawType ] : [], (function(base) {
  base = base[0];
  var baseClass;
  var basePrototype;
  if (baseClassRawType) {
   baseClass = base.registeredClass;
   basePrototype = baseClass.instancePrototype;
  } else {
   basePrototype = ClassHandle.prototype;
  }
  var constructor = createNamedFunction(legalFunctionName, (function() {
   if (Object.getPrototypeOf(this) !== instancePrototype) {
    throw new BindingError("Use 'new' to construct " + name);
   }
   if (undefined === registeredClass.constructor_body) {
    throw new BindingError(name + " has no accessible constructor");
   }
   var body = registeredClass.constructor_body[arguments.length];
   if (undefined === body) {
    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
   }
   return body.apply(this, arguments);
  }));
  var instancePrototype = Object.create(basePrototype, {
   constructor: {
    value: constructor
   }
  });
  constructor.prototype = instancePrototype;
  var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
  var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
  var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
  var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
  registeredPointers[rawType] = {
   pointerType: pointerConverter,
   constPointerType: constPointerConverter
  };
  replacePublicSymbol(legalFunctionName, constructor);
  return [ referenceConverter, pointerConverter, constPointerConverter ];
 }));
}
function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}
function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 invoker = embind__requireFunction(invokerSignature, invoker);
 whenDependentTypesAreResolved([], [ rawClassType ], (function(classType) {
  classType = classType[0];
  var humanName = "constructor " + classType.name;
  if (undefined === classType.registeredClass.constructor_body) {
   classType.registeredClass.constructor_body = [];
  }
  if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
   throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
  }
  classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
   throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
  };
  whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
   classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
    if (arguments.length !== argCount - 1) {
     throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
    }
    var destructors = [];
    var args = new Array(argCount);
    args[0] = rawConstructor;
    for (var i = 1; i < argCount; ++i) {
     args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
    }
    var ptr = invoker.apply(null, args);
    runDestructors(destructors);
    return argTypes[0]["fromWireType"](ptr);
   };
   return [];
  }));
  return [];
 }));
}
function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function() {}));
 dummy.prototype = constructor.prototype;
 var obj = new dummy;
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 var returns = argTypes[0].name !== "void";
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}
function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], (function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  if (isPureVirtual) {
   classType.registeredClass.pureVirtualFunctions.push(methodName);
  }
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.instancePrototype;
  var method = proto[methodName];
  if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
   unboundTypesHandler.argCount = argCount - 2;
   unboundTypesHandler.className = classType.name;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
   var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
   if (undefined === proto[methodName].overloadTable) {
    memberFunction.argCount = argCount - 2;
    proto[methodName] = memberFunction;
   } else {
    proto[methodName].overloadTable[argCount - 2] = memberFunction;
   }
   return [];
  }));
  return [];
 }));
}
var emval_free_list = [];
var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];
function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}
function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}
function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}
function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}
function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }
 case null:
  {
   return 2;
  }
 case true:
  {
   return 3;
  }
 case false:
  {
   return 4;
  }
 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}
function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  }),
  "toWireType": (function(destructors, value) {
   return __emval_register(value);
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}
function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}
function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return (function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  });
 case 3:
  return (function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  });
 default:
  throw new TypeError("Unknown float type: " + name);
 }
}
function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   return value;
  }),
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
 var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 name = readLatin1String(name);
 rawInvoker = embind__requireFunction(signature, rawInvoker);
 exposePublicSymbol(name, (function() {
  throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
 }), argCount - 1);
 whenDependentTypesAreResolved([], argTypes, (function(argTypes) {
  var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
  replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
  return [];
 }));
}
function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };
 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };
 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };
 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = (function(value) {
  return value;
 });
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = (function(value) {
   return value << bitshift >>> bitshift;
  });
 }
 var isUnsignedType = name.indexOf("unsigned") != -1;
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return isUnsignedType ? value >>> 0 : value | 0;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(heap["buffer"], data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}
function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var length = HEAPU32[value >> 2];
   var str;
   if (stdStringIsUTF8) {
    var endChar = HEAPU8[value + 4 + length];
    var endCharSwap = 0;
    if (endChar != 0) {
     endCharSwap = endChar;
     HEAPU8[value + 4 + length] = 0;
    }
    var decodeStartPtr = value + 4;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = value + 4 + i;
     if (HEAPU8[currentBytePtr] == 0) {
      var stringSegment = UTF8ToString(decodeStartPtr);
      if (str === undefined) str = stringSegment; else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
    if (endCharSwap != 0) HEAPU8[value + 4 + length] = endCharSwap;
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
    }
    str = a.join("");
   }
   _free(value);
   return str;
  }),
  "toWireType": (function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var getLength;
   var valueIsOfTypeString = typeof value === "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    getLength = (function() {
     return lengthBytesUTF8(value);
    });
   } else {
    getLength = (function() {
     return value.length;
    });
   }
   var length = getLength();
   var ptr = _malloc(4 + length + 1);
   HEAPU32[ptr >> 2] = length;
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr + 4, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      HEAPU8[ptr + 4 + i] = charCode;
     }
    } else {
     for (var i = 0; i < length; ++i) {
      HEAPU8[ptr + 4 + i] = value[i];
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var getHeap, shift;
 if (charSize === 2) {
  getHeap = (function() {
   return HEAPU16;
  });
  shift = 1;
 } else if (charSize === 4) {
  getHeap = (function() {
   return HEAPU32;
  });
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var HEAP = getHeap();
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   var start = value + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAP[start + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   var HEAP = getHeap();
   var length = value.length;
   var ptr = _malloc(4 + length * charSize);
   HEAPU32[ptr >> 2] = length;
   var start = ptr + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    HEAP[start + i] = value.charCodeAt(i);
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
 structRegistrations[rawType] = {
  name: readLatin1String(name),
  rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
  rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
  fields: []
 };
}
function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 structRegistrations[structType].fields.push({
  fieldName: readLatin1String(fieldName),
  getterReturnType: getterReturnType,
  getter: embind__requireFunction(getterSignature, getter),
  getterContext: getterContext,
  setterArgumentType: setterArgumentType,
  setter: embind__requireFunction(setterSignature, setter),
  setterContext: setterContext
 });
}
function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": (function() {
   return undefined;
  }),
  "toWireType": (function(destructors, o) {
   return undefined;
  })
 });
}
function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
}
function requireRegisteredType(rawType, humanName) {
 var impl = registeredTypes[rawType];
 if (undefined === impl) {
  throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
 }
 return impl;
}
function __emval_take_value(type, argv) {
 type = requireRegisteredType(type, "_emval_take_value");
 var v = type["readValueFromPointer"](argv);
 return __emval_register(v);
}
function _abort() {
 Module["abort"]();
}
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
var PTHREAD_SPECIFIC = {};
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 Module["dynCall_v"](func);
 _pthread_once.seen[ptr] = 1;
}
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
FS.staticInit();
__ATINIT__.unshift((function() {
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
}));
__ATMAIN__.push((function() {
 FS.ignorePermissions = false;
}));
__ATEXIT__.push((function() {
 FS.quit();
}));
__ATINIT__.unshift((function() {
 TTY.init();
}));
__ATEXIT__.push((function() {
 TTY.shutdown();
}));
if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var NODEJS_PATH = require("path");
 NODEFS.staticInit();
}
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
init_ClassHandle();
init_RegisteredPointer();
init_embind();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
init_emval();
DYNAMICTOP_PTR = staticAlloc(4);
STACK_BASE = STACKTOP = alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
var ASSERTIONS = false;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   if (ASSERTIONS) {
    assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   }
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
var decodeBase64 = typeof atob === "function" ? atob : (function(input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3;
 var enc1, enc2, enc3, enc4;
 var i = 0;
 input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 do {
  enc1 = keyStr.indexOf(input.charAt(i++));
  enc2 = keyStr.indexOf(input.charAt(i++));
  enc3 = keyStr.indexOf(input.charAt(i++));
  enc4 = keyStr.indexOf(input.charAt(i++));
  chr1 = enc1 << 2 | enc2 >> 4;
  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
  chr3 = (enc3 & 3) << 6 | enc4;
  output = output + String.fromCharCode(chr1);
  if (enc3 !== 64) {
   output = output + String.fromCharCode(chr2);
  }
  if (enc4 !== 64) {
   output = output + String.fromCharCode(chr3);
  }
 } while (i < input.length);
 return output;
});
function intArrayFromBase64(s) {
 if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
  var buf;
  try {
   buf = Buffer.from(s, "base64");
  } catch (_) {
   buf = new Buffer(s, "base64");
  }
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
 }
 try {
  var decoded = decodeBase64(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0; i < decoded.length; ++i) {
   bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
 } catch (_) {
  throw new Error("Converting base64 string to bytes failed.");
 }
}
function tryParseAsDataURI(filename) {
 if (!isDataURI(filename)) {
  return;
 }
 return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity
};
Module.asmLibraryArg = {
 "a": abort,
 "b": assert,
 "c": enlargeMemory,
 "d": getTotalMemory,
 "e": setTempRet0,
 "f": getTempRet0,
 "g": abortOnCannotGrowMemory,
 "h": ClassHandle,
 "i": ClassHandle_clone,
 "j": ClassHandle_delete,
 "k": ClassHandle_deleteLater,
 "l": ClassHandle_isAliasOf,
 "m": ClassHandle_isDeleted,
 "n": RegisteredClass,
 "o": RegisteredPointer,
 "p": RegisteredPointer_deleteObject,
 "q": RegisteredPointer_destructor,
 "r": RegisteredPointer_fromWireType,
 "s": RegisteredPointer_getPointee,
 "t": __ZSt18uncaught_exceptionv,
 "u": ___assert_fail,
 "v": ___cxa_allocate_exception,
 "w": ___cxa_begin_catch,
 "x": ___cxa_find_matching_catch,
 "y": ___cxa_throw,
 "z": ___gxx_personality_v0,
 "A": ___resumeException,
 "B": ___setErrNo,
 "C": ___syscall140,
 "D": ___syscall146,
 "E": ___syscall221,
 "F": ___syscall3,
 "G": ___syscall5,
 "H": ___syscall6,
 "I": __embind_finalize_value_object,
 "J": __embind_register_bool,
 "K": __embind_register_class,
 "L": __embind_register_class_constructor,
 "M": __embind_register_class_function,
 "N": __embind_register_emval,
 "O": __embind_register_float,
 "P": __embind_register_function,
 "Q": __embind_register_integer,
 "R": __embind_register_memory_view,
 "S": __embind_register_std_string,
 "T": __embind_register_std_wstring,
 "U": __embind_register_value_object,
 "V": __embind_register_value_object_field,
 "W": __embind_register_void,
 "X": __emval_decref,
 "Y": __emval_incref,
 "Z": __emval_register,
 "_": __emval_take_value,
 "$": _abort,
 "aa": _embind_repr,
 "ab": _emscripten_memcpy_big,
 "ac": _pthread_getspecific,
 "ad": _pthread_key_create,
 "ae": _pthread_once,
 "af": _pthread_setspecific,
 "ag": constNoSmartPtrRawPointerToWireType,
 "ah": count_emval_handles,
 "ai": craftInvokerFunction,
 "aj": createNamedFunction,
 "ak": downcastPointer,
 "al": embind__requireFunction,
 "am": embind_init_charCodes,
 "an": ensureOverloadTable,
 "ao": exposePublicSymbol,
 "ap": extendError,
 "aq": floatReadValueFromPointer,
 "ar": flushPendingDeletes,
 "as": genericPointerToWireType,
 "at": getBasestPointer,
 "au": getInheritedInstance,
 "av": getInheritedInstanceCount,
 "aw": getLiveInheritedInstances,
 "ax": getShiftFromSize,
 "ay": getTypeName,
 "az": get_first_emval,
 "aA": heap32VectorToArray,
 "aB": init_ClassHandle,
 "aC": init_RegisteredPointer,
 "aD": init_embind,
 "aE": init_emval,
 "aF": integerReadValueFromPointer,
 "aG": makeClassHandle,
 "aH": makeLegalFunctionName,
 "aI": new_,
 "aJ": nonConstNoSmartPtrRawPointerToWireType,
 "aK": readLatin1String,
 "aL": registerType,
 "aM": replacePublicSymbol,
 "aN": requireRegisteredType,
 "aO": runDestructor,
 "aP": runDestructors,
 "aQ": setDelayFunction,
 "aR": shallowCopyInternalPointer,
 "aS": simpleReadValueFromPointer,
 "aT": throwBindingError,
 "aU": throwInstanceAlreadyDeleted,
 "aV": throwInternalError,
 "aW": throwUnboundTypeError,
 "aX": upcastPointer,
 "aY": whenDependentTypesAreResolved,
 "aZ": DYNAMICTOP_PTR,
 "a_": tempDoublePtr,
 "a$": STACKTOP,
 "ba": STACK_MAX
};
// EMSCRIPTEN_START_ASM

var asm = (/** @suppress {uselessCode} */ function(global,env,buffer) {

 "use asm";
 var a = new global.Int8Array(buffer);
 var b = new global.Int16Array(buffer);
 var c = new global.Int32Array(buffer);
 var d = new global.Uint8Array(buffer);
 var e = new global.Uint16Array(buffer);
 var f = new global.Uint32Array(buffer);
 var g = new global.Float32Array(buffer);
 var h = new global.Float64Array(buffer);
 var i = env.aZ | 0;
 var j = env.a_ | 0;
 var k = env.a$ | 0;
 var l = env.ba | 0;
 var m = 0;
 var n = 0;
 var o = 0;
 var p = 0;
 var q = global.NaN, r = global.Infinity;
 var s = 0, t = 0, u = 0, v = 0, w = 0.0;
 var x = global.Math.floor;
 var y = global.Math.abs;
 var z = global.Math.sqrt;
 var A = global.Math.pow;
 var B = global.Math.cos;
 var C = global.Math.sin;
 var D = global.Math.tan;
 var E = global.Math.acos;
 var F = global.Math.asin;
 var G = global.Math.atan;
 var H = global.Math.atan2;
 var I = global.Math.exp;
 var J = global.Math.log;
 var K = global.Math.ceil;
 var L = global.Math.imul;
 var M = global.Math.min;
 var N = global.Math.max;
 var O = global.Math.clz32;
 var P = env.a;
 var Q = env.b;
 var R = env.c;
 var S = env.d;
 var T = env.e;
 var U = env.f;
 var V = env.g;
 var W = env.h;
 var X = env.i;
 var Y = env.j;
 var Z = env.k;
 var _ = env.l;
 var $ = env.m;
 var aa = env.n;
 var ba = env.o;
 var ca = env.p;
 var da = env.q;
 var ea = env.r;
 var fa = env.s;
 var ga = env.t;
 var ha = env.u;
 var ia = env.v;
 var ja = env.w;
 var ka = env.x;
 var la = env.y;
 var ma = env.z;
 var na = env.A;
 var oa = env.B;
 var pa = env.C;
 var qa = env.D;
 var ra = env.E;
 var sa = env.F;
 var ta = env.G;
 var ua = env.H;
 var va = env.I;
 var wa = env.J;
 var xa = env.K;
 var ya = env.L;
 var za = env.M;
 var Aa = env.N;
 var Ba = env.O;
 var Ca = env.P;
 var Da = env.Q;
 var Ea = env.R;
 var Fa = env.S;
 var Ga = env.T;
 var Ha = env.U;
 var Ia = env.V;
 var Ja = env.W;
 var Ka = env.X;
 var La = env.Y;
 var Ma = env.Z;
 var Na = env._;
 var Oa = env.$;
 var Pa = env.aa;
 var Qa = env.ab;
 var Ra = env.ac;
 var Sa = env.ad;
 var Ta = env.ae;
 var Ua = env.af;
 var Va = env.ag;
 var Wa = env.ah;
 var Xa = env.ai;
 var Ya = env.aj;
 var Za = env.ak;
 var _a = env.al;
 var $a = env.am;
 var ab = env.an;
 var bb = env.ao;
 var cb = env.ap;
 var db = env.aq;
 var eb = env.ar;
 var fb = env.as;
 var gb = env.at;
 var hb = env.au;
 var ib = env.av;
 var jb = env.aw;
 var kb = env.ax;
 var lb = env.ay;
 var mb = env.az;
 var nb = env.aA;
 var ob = env.aB;
 var pb = env.aC;
 var qb = env.aD;
 var rb = env.aE;
 var sb = env.aF;
 var tb = env.aG;
 var ub = env.aH;
 var vb = env.aI;
 var wb = env.aJ;
 var xb = env.aK;
 var yb = env.aL;
 var zb = env.aM;
 var Ab = env.aN;
 var Bb = env.aO;
 var Cb = env.aP;
 var Db = env.aQ;
 var Eb = env.aR;
 var Fb = env.aS;
 var Gb = env.aT;
 var Hb = env.aU;
 var Ib = env.aV;
 var Jb = env.aW;
 var Kb = env.aX;
 var Lb = env.aY;
 var Mb = 0.0;
 
// EMSCRIPTEN_START_FUNCS
function Ic(b, c, e, f) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0, hb = 0, ib = 0, jb = 0, kb = 0, lb = 0, mb = 0, nb = 0, ob = 0, pb = 0, qb = 0, rb = 0, sb = 0, tb = 0, ub = 0, vb = 0, wb = 0, xb = 0, yb = 0, zb = 0, Ab = 0, Bb = 0, Cb = 0, Db = 0, Eb = 0, Fb = 0, Gb = 0, Hb = 0, Ib = 0, Jb = 0, Kb = 0, Lb = 0, Mb = 0, Nb = 0, Ob = 0, Pb = 0, Qb = 0, Rb = 0, Sb = 0, Tb = 0, Ub = 0;
 fb = a[c + 2 >> 0] | 0;
 _ = d[c >> 0] | 0;
 ob = gg(d[c + 1 >> 0] | 0 | 0, 0, 8) | 0;
 aa = U() | 0;
 fb = fb & 255;
 q = gg(fb | 0, 0, 16) | 0;
 U() | 0;
 q = ob | _ | q & 2031616;
 _ = gg(d[c + 3 >> 0] | 0 | 0, 0, 8) | 0;
 ob = U() | 0;
 $a = gg(d[c + 4 >> 0] | 0 | 0, 0, 16) | 0;
 ob = ob | (U() | 0);
 E = d[c + 5 >> 0] | 0;
 ra = gg(E | 0, 0, 24) | 0;
 ob = fg(_ | fb | $a | ra | 0, ob | (U() | 0) | 0, 5) | 0;
 U() | 0;
 ob = ob & 2097151;
 ra = a[c + 7 >> 0] | 0;
 $a = gg(d[c + 6 >> 0] | 0 | 0, 0, 8) | 0;
 fb = U() | 0;
 ra = ra & 255;
 _ = gg(ra | 0, 0, 16) | 0;
 fb = fg($a | E | _ | 0, fb | (U() | 0) | 0, 2) | 0;
 U() | 0;
 fb = fb & 2097151;
 _ = gg(d[c + 8 >> 0] | 0 | 0, 0, 8) | 0;
 E = U() | 0;
 $a = gg(d[c + 9 >> 0] | 0 | 0, 0, 16) | 0;
 E = E | (U() | 0);
 lb = d[c + 10 >> 0] | 0;
 cb = gg(lb | 0, 0, 24) | 0;
 E = fg(_ | ra | $a | cb | 0, E | (U() | 0) | 0, 7) | 0;
 U() | 0;
 E = E & 2097151;
 cb = gg(d[c + 11 >> 0] | 0 | 0, 0, 8) | 0;
 $a = U() | 0;
 ra = gg(d[c + 12 >> 0] | 0 | 0, 0, 16) | 0;
 $a = $a | (U() | 0);
 _ = d[c + 13 >> 0] | 0;
 ub = gg(_ | 0, 0, 24) | 0;
 $a = fg(cb | lb | ra | ub | 0, $a | (U() | 0) | 0, 4) | 0;
 U() | 0;
 $a = $a & 2097151;
 ub = a[c + 15 >> 0] | 0;
 ra = gg(d[c + 14 >> 0] | 0 | 0, 0, 8) | 0;
 lb = U() | 0;
 ub = ub & 255;
 cb = gg(ub | 0, 0, 16) | 0;
 lb = fg(ra | _ | cb | 0, lb | (U() | 0) | 0, 1) | 0;
 U() | 0;
 lb = lb & 2097151;
 cb = gg(d[c + 16 >> 0] | 0 | 0, 0, 8) | 0;
 _ = U() | 0;
 ra = gg(d[c + 17 >> 0] | 0 | 0, 0, 16) | 0;
 _ = _ | (U() | 0);
 Ha = d[c + 18 >> 0] | 0;
 o = gg(Ha | 0, 0, 24) | 0;
 _ = fg(cb | ub | ra | o | 0, _ | (U() | 0) | 0, 6) | 0;
 U() | 0;
 _ = _ & 2097151;
 o = a[c + 20 >> 0] | 0;
 ra = gg(d[c + 19 >> 0] | 0 | 0, 0, 8) | 0;
 ub = U() | 0;
 o = gg(o & 255 | 0, 0, 16) | 0;
 ub = fg(ra | Ha | o | 0, ub | (U() | 0) | 0, 3) | 0;
 o = U() | 0;
 Ha = a[c + 23 >> 0] | 0;
 ra = d[c + 21 >> 0] | 0;
 cb = gg(d[c + 22 >> 0] | 0 | 0, 0, 8) | 0;
 w = U() | 0;
 Ha = Ha & 255;
 t = gg(Ha | 0, 0, 16) | 0;
 U() | 0;
 t = cb | ra | t & 2031616;
 ra = gg(d[c + 24 >> 0] | 0 | 0, 0, 8) | 0;
 cb = U() | 0;
 k = gg(d[c + 25 >> 0] | 0 | 0, 0, 16) | 0;
 cb = cb | (U() | 0);
 x = d[c + 26 >> 0] | 0;
 ca = gg(x | 0, 0, 24) | 0;
 cb = fg(ra | Ha | k | ca | 0, cb | (U() | 0) | 0, 5) | 0;
 U() | 0;
 cb = cb & 2097151;
 ca = a[c + 28 >> 0] | 0;
 k = gg(d[c + 27 >> 0] | 0 | 0, 0, 8) | 0;
 Ha = U() | 0;
 ca = ca & 255;
 ra = gg(ca | 0, 0, 16) | 0;
 Ha = fg(k | x | ra | 0, Ha | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Ha = Ha & 2097151;
 ra = gg(d[c + 29 >> 0] | 0 | 0, 0, 8) | 0;
 x = U() | 0;
 k = gg(d[c + 30 >> 0] | 0 | 0, 0, 16) | 0;
 x = x | (U() | 0);
 vb = gg(d[c + 31 >> 0] | 0 | 0, 0, 24) | 0;
 x = fg(ra | ca | k | vb | 0, x | (U() | 0) | 0, 7) | 0;
 vb = U() | 0;
 k = a[e + 2 >> 0] | 0;
 ca = d[e >> 0] | 0;
 ra = gg(d[e + 1 >> 0] | 0 | 0, 0, 8) | 0;
 sb = U() | 0;
 k = k & 255;
 tb = gg(k | 0, 0, 16) | 0;
 U() | 0;
 tb = ra | ca | tb & 2031616;
 ca = gg(d[e + 3 >> 0] | 0 | 0, 0, 8) | 0;
 ra = U() | 0;
 ha = gg(d[e + 4 >> 0] | 0 | 0, 0, 16) | 0;
 ra = ra | (U() | 0);
 n = d[e + 5 >> 0] | 0;
 Pb = gg(n | 0, 0, 24) | 0;
 ra = fg(ca | k | ha | Pb | 0, ra | (U() | 0) | 0, 5) | 0;
 U() | 0;
 ra = ra & 2097151;
 Pb = a[e + 7 >> 0] | 0;
 ha = gg(d[e + 6 >> 0] | 0 | 0, 0, 8) | 0;
 k = U() | 0;
 Pb = Pb & 255;
 ca = gg(Pb | 0, 0, 16) | 0;
 k = fg(ha | n | ca | 0, k | (U() | 0) | 0, 2) | 0;
 U() | 0;
 k = k & 2097151;
 ca = gg(d[e + 8 >> 0] | 0 | 0, 0, 8) | 0;
 n = U() | 0;
 ha = gg(d[e + 9 >> 0] | 0 | 0, 0, 16) | 0;
 n = n | (U() | 0);
 v = d[e + 10 >> 0] | 0;
 Z = gg(v | 0, 0, 24) | 0;
 n = fg(ca | Pb | ha | Z | 0, n | (U() | 0) | 0, 7) | 0;
 U() | 0;
 n = n & 2097151;
 Z = gg(d[e + 11 >> 0] | 0 | 0, 0, 8) | 0;
 ha = U() | 0;
 Pb = gg(d[e + 12 >> 0] | 0 | 0, 0, 16) | 0;
 ha = ha | (U() | 0);
 ca = d[e + 13 >> 0] | 0;
 O = gg(ca | 0, 0, 24) | 0;
 ha = fg(Z | v | Pb | O | 0, ha | (U() | 0) | 0, 4) | 0;
 U() | 0;
 ha = ha & 2097151;
 O = a[e + 15 >> 0] | 0;
 Pb = gg(d[e + 14 >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 O = O & 255;
 Z = gg(O | 0, 0, 16) | 0;
 v = fg(Pb | ca | Z | 0, v | (U() | 0) | 0, 1) | 0;
 U() | 0;
 v = v & 2097151;
 Z = gg(d[e + 16 >> 0] | 0 | 0, 0, 8) | 0;
 ca = U() | 0;
 Pb = gg(d[e + 17 >> 0] | 0 | 0, 0, 16) | 0;
 ca = ca | (U() | 0);
 ya = d[e + 18 >> 0] | 0;
 P = gg(ya | 0, 0, 24) | 0;
 ca = fg(Z | O | Pb | P | 0, ca | (U() | 0) | 0, 6) | 0;
 U() | 0;
 ca = ca & 2097151;
 P = a[e + 20 >> 0] | 0;
 Pb = gg(d[e + 19 >> 0] | 0 | 0, 0, 8) | 0;
 O = U() | 0;
 P = gg(P & 255 | 0, 0, 16) | 0;
 O = fg(Pb | ya | P | 0, O | (U() | 0) | 0, 3) | 0;
 P = U() | 0;
 ya = a[e + 23 >> 0] | 0;
 Pb = d[e + 21 >> 0] | 0;
 Z = gg(d[e + 22 >> 0] | 0 | 0, 0, 8) | 0;
 G = U() | 0;
 ya = ya & 255;
 H = gg(ya | 0, 0, 16) | 0;
 U() | 0;
 H = Z | Pb | H & 2031616;
 Pb = gg(d[e + 24 >> 0] | 0 | 0, 0, 8) | 0;
 Z = U() | 0;
 Ea = gg(d[e + 25 >> 0] | 0 | 0, 0, 16) | 0;
 Z = Z | (U() | 0);
 za = d[e + 26 >> 0] | 0;
 ma = gg(za | 0, 0, 24) | 0;
 Z = fg(Pb | ya | Ea | ma | 0, Z | (U() | 0) | 0, 5) | 0;
 U() | 0;
 Z = Z & 2097151;
 ma = a[e + 28 >> 0] | 0;
 Ea = gg(d[e + 27 >> 0] | 0 | 0, 0, 8) | 0;
 ya = U() | 0;
 ma = ma & 255;
 Pb = gg(ma | 0, 0, 16) | 0;
 ya = fg(Ea | za | Pb | 0, ya | (U() | 0) | 0, 2) | 0;
 U() | 0;
 ya = ya & 2097151;
 Pb = gg(d[e + 29 >> 0] | 0 | 0, 0, 8) | 0;
 za = U() | 0;
 Ea = gg(d[e + 30 >> 0] | 0 | 0, 0, 16) | 0;
 za = za | (U() | 0);
 Ga = gg(d[e + 31 >> 0] | 0 | 0, 0, 24) | 0;
 za = fg(Pb | ma | Ea | Ga | 0, za | (U() | 0) | 0, 7) | 0;
 Ga = U() | 0;
 Ea = a[f + 2 >> 0] | 0;
 ma = d[f >> 0] | 0;
 Pb = gg(d[f + 1 >> 0] | 0 | 0, 0, 8) | 0;
 Da = U() | 0;
 Ea = Ea & 255;
 ta = gg(Ea | 0, 0, 16) | 0;
 U() | 0;
 Ta = gg(d[f + 3 >> 0] | 0 | 0, 0, 8) | 0;
 Nb = U() | 0;
 Aa = gg(d[f + 4 >> 0] | 0 | 0, 0, 16) | 0;
 Nb = Nb | (U() | 0);
 va = d[f + 5 >> 0] | 0;
 La = gg(va | 0, 0, 24) | 0;
 Nb = fg(Ta | Ea | Aa | La | 0, Nb | (U() | 0) | 0, 5) | 0;
 U() | 0;
 La = a[f + 7 >> 0] | 0;
 Aa = gg(d[f + 6 >> 0] | 0 | 0, 0, 8) | 0;
 Ea = U() | 0;
 La = La & 255;
 Ta = gg(La | 0, 0, 16) | 0;
 Ea = fg(Aa | va | Ta | 0, Ea | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Ta = gg(d[f + 8 >> 0] | 0 | 0, 0, 8) | 0;
 va = U() | 0;
 Aa = gg(d[f + 9 >> 0] | 0 | 0, 0, 16) | 0;
 va = va | (U() | 0);
 Ia = d[f + 10 >> 0] | 0;
 u = gg(Ia | 0, 0, 24) | 0;
 va = fg(Ta | La | Aa | u | 0, va | (U() | 0) | 0, 7) | 0;
 U() | 0;
 u = gg(d[f + 11 >> 0] | 0 | 0, 0, 8) | 0;
 Aa = U() | 0;
 La = gg(d[f + 12 >> 0] | 0 | 0, 0, 16) | 0;
 Aa = Aa | (U() | 0);
 Ta = d[f + 13 >> 0] | 0;
 la = gg(Ta | 0, 0, 24) | 0;
 Aa = fg(u | Ia | La | la | 0, Aa | (U() | 0) | 0, 4) | 0;
 U() | 0;
 la = a[f + 15 >> 0] | 0;
 La = gg(d[f + 14 >> 0] | 0 | 0, 0, 8) | 0;
 Ia = U() | 0;
 la = la & 255;
 u = gg(la | 0, 0, 16) | 0;
 Ia = fg(La | Ta | u | 0, Ia | (U() | 0) | 0, 1) | 0;
 U() | 0;
 u = gg(d[f + 16 >> 0] | 0 | 0, 0, 8) | 0;
 Ta = U() | 0;
 La = gg(d[f + 17 >> 0] | 0 | 0, 0, 16) | 0;
 Ta = Ta | (U() | 0);
 r = d[f + 18 >> 0] | 0;
 ka = gg(r | 0, 0, 24) | 0;
 Ta = fg(u | la | La | ka | 0, Ta | (U() | 0) | 0, 6) | 0;
 U() | 0;
 ka = a[f + 20 >> 0] | 0;
 La = gg(d[f + 19 >> 0] | 0 | 0, 0, 8) | 0;
 la = U() | 0;
 ka = gg(ka & 255 | 0, 0, 16) | 0;
 la = fg(La | r | ka | 0, la | (U() | 0) | 0, 3) | 0;
 ka = U() | 0;
 r = a[f + 23 >> 0] | 0;
 La = d[f + 21 >> 0] | 0;
 u = gg(d[f + 22 >> 0] | 0 | 0, 0, 8) | 0;
 Va = U() | 0;
 r = r & 255;
 rb = gg(r | 0, 0, 16) | 0;
 U() | 0;
 Mb = gg(d[f + 24 >> 0] | 0 | 0, 0, 8) | 0;
 Na = U() | 0;
 Ca = gg(d[f + 25 >> 0] | 0 | 0, 0, 16) | 0;
 Na = Na | (U() | 0);
 db = d[f + 26 >> 0] | 0;
 Ob = gg(db | 0, 0, 24) | 0;
 Na = fg(Mb | r | Ca | Ob | 0, Na | (U() | 0) | 0, 5) | 0;
 U() | 0;
 Ob = a[f + 28 >> 0] | 0;
 Ca = gg(d[f + 27 >> 0] | 0 | 0, 0, 8) | 0;
 r = U() | 0;
 Ob = Ob & 255;
 Mb = gg(Ob | 0, 0, 16) | 0;
 r = fg(Ca | db | Mb | 0, r | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Mb = gg(d[f + 29 >> 0] | 0 | 0, 0, 8) | 0;
 db = U() | 0;
 Ca = gg(d[f + 30 >> 0] | 0 | 0, 0, 16) | 0;
 db = db | (U() | 0);
 jb = gg(d[f + 31 >> 0] | 0 | 0, 0, 24) | 0;
 db = fg(Mb | Ob | Ca | jb | 0, db | (U() | 0) | 0, 7) | 0;
 jb = U() | 0;
 Ca = _f(tb | 0, sb | 0, q | 0, aa | 0) | 0;
 Ca = ag(Pb | ma | ta & 2031616 | 0, Da | 0, Ca | 0, U() | 0) | 0;
 Da = U() | 0;
 ta = _f(tb | 0, sb | 0, ob | 0, 0) | 0;
 ma = U() | 0;
 Pb = _f(ra | 0, 0, q | 0, aa | 0) | 0;
 Ob = U() | 0;
 Mb = _f(tb | 0, sb | 0, fb | 0, 0) | 0;
 Jb = U() | 0;
 Ib = _f(ra | 0, 0, ob | 0, 0) | 0;
 Lb = U() | 0;
 Kb = _f(k | 0, 0, q | 0, aa | 0) | 0;
 Fa = U() | 0;
 Jb = $f(Ib | 0, Lb | 0, Mb | 0, Jb | 0) | 0;
 Fa = $f(Jb | 0, U() | 0, Kb | 0, Fa | 0) | 0;
 Fa = ag(Ea & 2097151 | 0, 0, Fa | 0, U() | 0) | 0;
 Ea = U() | 0;
 Kb = _f(tb | 0, sb | 0, E | 0, 0) | 0;
 Jb = U() | 0;
 Mb = _f(ra | 0, 0, fb | 0, 0) | 0;
 Lb = U() | 0;
 Ib = _f(k | 0, 0, ob | 0, 0) | 0;
 Ja = U() | 0;
 ea = _f(n | 0, 0, q | 0, aa | 0) | 0;
 fa = U() | 0;
 Bb = _f(tb | 0, sb | 0, $a | 0, 0) | 0;
 Cb = U() | 0;
 zb = _f(ra | 0, 0, E | 0, 0) | 0;
 Ab = U() | 0;
 Db = _f(k | 0, 0, fb | 0, 0) | 0;
 Gb = U() | 0;
 Hb = _f(n | 0, 0, ob | 0, 0) | 0;
 Eb = U() | 0;
 Fb = _f(ha | 0, 0, q | 0, aa | 0) | 0;
 Ba = U() | 0;
 Cb = $f(zb | 0, Ab | 0, Bb | 0, Cb | 0) | 0;
 Gb = $f(Cb | 0, U() | 0, Db | 0, Gb | 0) | 0;
 Eb = $f(Gb | 0, U() | 0, Hb | 0, Eb | 0) | 0;
 Ba = $f(Eb | 0, U() | 0, Fb | 0, Ba | 0) | 0;
 Ba = ag(Aa & 2097151 | 0, 0, Ba | 0, U() | 0) | 0;
 Aa = U() | 0;
 Fb = _f(tb | 0, sb | 0, lb | 0, 0) | 0;
 Eb = U() | 0;
 Hb = _f(ra | 0, 0, $a | 0, 0) | 0;
 Gb = U() | 0;
 Db = _f(k | 0, 0, E | 0, 0) | 0;
 Cb = U() | 0;
 Bb = _f(n | 0, 0, fb | 0, 0) | 0;
 Ab = U() | 0;
 zb = _f(ha | 0, 0, ob | 0, 0) | 0;
 ua = U() | 0;
 ja = _f(v | 0, 0, q | 0, aa | 0) | 0;
 ia = U() | 0;
 hb = _f(tb | 0, sb | 0, _ | 0, 0) | 0;
 gb = U() | 0;
 Ra = _f(ra | 0, 0, lb | 0, 0) | 0;
 Qa = U() | 0;
 c = _f(k | 0, 0, $a | 0, 0) | 0;
 f = U() | 0;
 Xa = _f(n | 0, 0, E | 0, 0) | 0;
 Wa = U() | 0;
 sa = _f(ha | 0, 0, fb | 0, 0) | 0;
 xb = U() | 0;
 yb = _f(v | 0, 0, ob | 0, 0) | 0;
 na = U() | 0;
 wb = _f(ca | 0, 0, q | 0, aa | 0) | 0;
 Sa = U() | 0;
 gb = $f(Ra | 0, Qa | 0, hb | 0, gb | 0) | 0;
 f = $f(gb | 0, U() | 0, c | 0, f | 0) | 0;
 Wa = $f(f | 0, U() | 0, Xa | 0, Wa | 0) | 0;
 xb = $f(Wa | 0, U() | 0, sa | 0, xb | 0) | 0;
 na = $f(xb | 0, U() | 0, yb | 0, na | 0) | 0;
 Sa = $f(na | 0, U() | 0, wb | 0, Sa | 0) | 0;
 Sa = ag(Ta & 2097151 | 0, 0, Sa | 0, U() | 0) | 0;
 Ta = U() | 0;
 wb = _f(tb | 0, sb | 0, ub | 0, o | 0) | 0;
 na = U() | 0;
 yb = _f(ra | 0, 0, _ | 0, 0) | 0;
 xb = U() | 0;
 sa = _f(k | 0, 0, lb | 0, 0) | 0;
 Wa = U() | 0;
 Xa = _f(n | 0, 0, $a | 0, 0) | 0;
 f = U() | 0;
 c = _f(ha | 0, 0, E | 0, 0) | 0;
 gb = U() | 0;
 hb = _f(v | 0, 0, fb | 0, 0) | 0;
 Qa = U() | 0;
 Ra = _f(ca | 0, 0, ob | 0, 0) | 0;
 j = U() | 0;
 B = _f(O | 0, P | 0, q | 0, aa | 0) | 0;
 S = U() | 0;
 eb = _f(tb | 0, sb | 0, t | 0, w | 0) | 0;
 mb = U() | 0;
 g = _f(ra | 0, 0, ub | 0, o | 0) | 0;
 z = U() | 0;
 nb = _f(k | 0, 0, _ | 0, 0) | 0;
 C = U() | 0;
 Pa = _f(n | 0, 0, lb | 0, 0) | 0;
 X = U() | 0;
 W = _f(ha | 0, 0, $a | 0, 0) | 0;
 Ya = U() | 0;
 Za = _f(v | 0, 0, E | 0, 0) | 0;
 M = U() | 0;
 L = _f(ca | 0, 0, fb | 0, 0) | 0;
 bb = U() | 0;
 ab = _f(O | 0, P | 0, ob | 0, 0) | 0;
 Ka = U() | 0;
 qb = _f(H | 0, G | 0, q | 0, aa | 0) | 0;
 Ua = U() | 0;
 mb = $f(g | 0, z | 0, eb | 0, mb | 0) | 0;
 C = $f(mb | 0, U() | 0, nb | 0, C | 0) | 0;
 X = $f(C | 0, U() | 0, Pa | 0, X | 0) | 0;
 Ya = $f(X | 0, U() | 0, W | 0, Ya | 0) | 0;
 M = $f(Ya | 0, U() | 0, Za | 0, M | 0) | 0;
 bb = $f(M | 0, U() | 0, L | 0, bb | 0) | 0;
 Ka = $f(bb | 0, U() | 0, ab | 0, Ka | 0) | 0;
 Ua = $f(Ka | 0, U() | 0, qb | 0, Ua | 0) | 0;
 Ua = ag(u | La | rb & 2031616 | 0, Va | 0, Ua | 0, U() | 0) | 0;
 Va = U() | 0;
 rb = _f(tb | 0, sb | 0, cb | 0, 0) | 0;
 La = U() | 0;
 u = _f(ra | 0, 0, t | 0, w | 0) | 0;
 qb = U() | 0;
 Ka = _f(k | 0, 0, ub | 0, o | 0) | 0;
 ab = U() | 0;
 bb = _f(n | 0, 0, _ | 0, 0) | 0;
 L = U() | 0;
 M = _f(ha | 0, 0, lb | 0, 0) | 0;
 Za = U() | 0;
 Ya = _f(v | 0, 0, $a | 0, 0) | 0;
 W = U() | 0;
 X = _f(ca | 0, 0, E | 0, 0) | 0;
 Pa = U() | 0;
 C = _f(O | 0, P | 0, fb | 0, 0) | 0;
 nb = U() | 0;
 mb = _f(H | 0, G | 0, ob | 0, 0) | 0;
 eb = U() | 0;
 z = _f(Z | 0, 0, q | 0, aa | 0) | 0;
 g = U() | 0;
 s = _f(tb | 0, sb | 0, Ha | 0, 0) | 0;
 $ = U() | 0;
 pb = _f(ra | 0, 0, cb | 0, 0) | 0;
 h = U() | 0;
 I = _f(k | 0, 0, t | 0, w | 0) | 0;
 ba = U() | 0;
 D = _f(n | 0, 0, ub | 0, o | 0) | 0;
 A = U() | 0;
 ib = _f(ha | 0, 0, _ | 0, 0) | 0;
 Y = U() | 0;
 kb = _f(v | 0, 0, lb | 0, 0) | 0;
 e = U() | 0;
 F = _f(ca | 0, 0, $a | 0, 0) | 0;
 i = U() | 0;
 ga = _f(O | 0, P | 0, E | 0, 0) | 0;
 _a = U() | 0;
 Ma = _f(H | 0, G | 0, fb | 0, 0) | 0;
 Oa = U() | 0;
 da = _f(Z | 0, 0, ob | 0, 0) | 0;
 N = U() | 0;
 y = _f(ya | 0, 0, q | 0, aa | 0) | 0;
 m = U() | 0;
 $ = $f(pb | 0, h | 0, s | 0, $ | 0) | 0;
 ba = $f($ | 0, U() | 0, I | 0, ba | 0) | 0;
 A = $f(ba | 0, U() | 0, D | 0, A | 0) | 0;
 Y = $f(A | 0, U() | 0, ib | 0, Y | 0) | 0;
 e = $f(Y | 0, U() | 0, kb | 0, e | 0) | 0;
 i = $f(e | 0, U() | 0, F | 0, i | 0) | 0;
 _a = $f(i | 0, U() | 0, ga | 0, _a | 0) | 0;
 Oa = $f(_a | 0, U() | 0, Ma | 0, Oa | 0) | 0;
 N = $f(Oa | 0, U() | 0, da | 0, N | 0) | 0;
 m = $f(N | 0, U() | 0, y | 0, m | 0) | 0;
 m = ag(r & 2097151 | 0, 0, m | 0, U() | 0) | 0;
 r = U() | 0;
 sb = _f(tb | 0, sb | 0, x | 0, vb | 0) | 0;
 tb = U() | 0;
 y = _f(ra | 0, 0, Ha | 0, 0) | 0;
 N = U() | 0;
 da = _f(k | 0, 0, cb | 0, 0) | 0;
 Oa = U() | 0;
 Ma = _f(n | 0, 0, t | 0, w | 0) | 0;
 _a = U() | 0;
 ga = _f(ha | 0, 0, ub | 0, o | 0) | 0;
 i = U() | 0;
 F = _f(v | 0, 0, _ | 0, 0) | 0;
 e = U() | 0;
 kb = _f(ca | 0, 0, lb | 0, 0) | 0;
 Y = U() | 0;
 ib = _f(O | 0, P | 0, $a | 0, 0) | 0;
 A = U() | 0;
 D = _f(H | 0, G | 0, E | 0, 0) | 0;
 ba = U() | 0;
 I = _f(Z | 0, 0, fb | 0, 0) | 0;
 $ = U() | 0;
 s = _f(ya | 0, 0, ob | 0, 0) | 0;
 h = U() | 0;
 aa = _f(za | 0, Ga | 0, q | 0, aa | 0) | 0;
 q = U() | 0;
 ob = _f(za | 0, Ga | 0, ob | 0, 0) | 0;
 pb = U() | 0;
 J = _f(ya | 0, 0, fb | 0, 0) | 0;
 K = U() | 0;
 Q = _f(Z | 0, 0, E | 0, 0) | 0;
 R = U() | 0;
 pa = _f(H | 0, G | 0, $a | 0, 0) | 0;
 oa = U() | 0;
 p = _f(O | 0, P | 0, lb | 0, 0) | 0;
 l = U() | 0;
 T = _f(ca | 0, 0, _ | 0, 0) | 0;
 qa = U() | 0;
 V = _f(v | 0, 0, ub | 0, o | 0) | 0;
 xa = U() | 0;
 Qb = _f(ha | 0, 0, t | 0, w | 0) | 0;
 wa = U() | 0;
 Rb = _f(n | 0, 0, cb | 0, 0) | 0;
 Sb = U() | 0;
 Ub = _f(k | 0, 0, Ha | 0, 0) | 0;
 Tb = U() | 0;
 ra = _f(ra | 0, 0, x | 0, vb | 0) | 0;
 ra = $f(Ub | 0, Tb | 0, ra | 0, U() | 0) | 0;
 Sb = $f(ra | 0, U() | 0, Rb | 0, Sb | 0) | 0;
 wa = $f(Sb | 0, U() | 0, Qb | 0, wa | 0) | 0;
 xa = $f(wa | 0, U() | 0, V | 0, xa | 0) | 0;
 qa = $f(xa | 0, U() | 0, T | 0, qa | 0) | 0;
 l = $f(qa | 0, U() | 0, p | 0, l | 0) | 0;
 oa = $f(l | 0, U() | 0, pa | 0, oa | 0) | 0;
 R = $f(oa | 0, U() | 0, Q | 0, R | 0) | 0;
 K = $f(R | 0, U() | 0, J | 0, K | 0) | 0;
 pb = $f(K | 0, U() | 0, ob | 0, pb | 0) | 0;
 ob = U() | 0;
 K = _f(za | 0, Ga | 0, E | 0, 0) | 0;
 J = U() | 0;
 R = _f(ya | 0, 0, $a | 0, 0) | 0;
 Q = U() | 0;
 oa = _f(Z | 0, 0, lb | 0, 0) | 0;
 pa = U() | 0;
 l = _f(H | 0, G | 0, _ | 0, 0) | 0;
 p = U() | 0;
 qa = _f(O | 0, P | 0, ub | 0, o | 0) | 0;
 T = U() | 0;
 xa = _f(ca | 0, 0, t | 0, w | 0) | 0;
 V = U() | 0;
 wa = _f(v | 0, 0, cb | 0, 0) | 0;
 Qb = U() | 0;
 Sb = _f(ha | 0, 0, Ha | 0, 0) | 0;
 Rb = U() | 0;
 ra = _f(n | 0, 0, x | 0, vb | 0) | 0;
 ra = $f(Sb | 0, Rb | 0, ra | 0, U() | 0) | 0;
 Qb = $f(ra | 0, U() | 0, wa | 0, Qb | 0) | 0;
 V = $f(Qb | 0, U() | 0, xa | 0, V | 0) | 0;
 T = $f(V | 0, U() | 0, qa | 0, T | 0) | 0;
 p = $f(T | 0, U() | 0, l | 0, p | 0) | 0;
 pa = $f(p | 0, U() | 0, oa | 0, pa | 0) | 0;
 Q = $f(pa | 0, U() | 0, R | 0, Q | 0) | 0;
 J = $f(Q | 0, U() | 0, K | 0, J | 0) | 0;
 K = U() | 0;
 Q = _f(za | 0, Ga | 0, lb | 0, 0) | 0;
 R = U() | 0;
 pa = _f(ya | 0, 0, _ | 0, 0) | 0;
 oa = U() | 0;
 p = _f(Z | 0, 0, ub | 0, o | 0) | 0;
 l = U() | 0;
 T = _f(H | 0, G | 0, t | 0, w | 0) | 0;
 qa = U() | 0;
 V = _f(O | 0, P | 0, cb | 0, 0) | 0;
 xa = U() | 0;
 Qb = _f(ca | 0, 0, Ha | 0, 0) | 0;
 wa = U() | 0;
 ra = _f(v | 0, 0, x | 0, vb | 0) | 0;
 ra = $f(Qb | 0, wa | 0, ra | 0, U() | 0) | 0;
 xa = $f(ra | 0, U() | 0, V | 0, xa | 0) | 0;
 qa = $f(xa | 0, U() | 0, T | 0, qa | 0) | 0;
 l = $f(qa | 0, U() | 0, p | 0, l | 0) | 0;
 oa = $f(l | 0, U() | 0, pa | 0, oa | 0) | 0;
 R = $f(oa | 0, U() | 0, Q | 0, R | 0) | 0;
 Q = U() | 0;
 oa = _f(za | 0, Ga | 0, ub | 0, o | 0) | 0;
 pa = U() | 0;
 l = _f(ya | 0, 0, t | 0, w | 0) | 0;
 p = U() | 0;
 qa = _f(Z | 0, 0, cb | 0, 0) | 0;
 T = U() | 0;
 xa = _f(H | 0, G | 0, Ha | 0, 0) | 0;
 V = U() | 0;
 ra = _f(O | 0, P | 0, x | 0, vb | 0) | 0;
 ra = $f(xa | 0, V | 0, ra | 0, U() | 0) | 0;
 T = $f(ra | 0, U() | 0, qa | 0, T | 0) | 0;
 p = $f(T | 0, U() | 0, l | 0, p | 0) | 0;
 pa = $f(p | 0, U() | 0, oa | 0, pa | 0) | 0;
 oa = U() | 0;
 p = _f(za | 0, Ga | 0, cb | 0, 0) | 0;
 l = U() | 0;
 T = _f(ya | 0, 0, Ha | 0, 0) | 0;
 qa = U() | 0;
 ra = _f(Z | 0, 0, x | 0, vb | 0) | 0;
 ra = $f(T | 0, qa | 0, ra | 0, U() | 0) | 0;
 l = $f(ra | 0, U() | 0, p | 0, l | 0) | 0;
 p = U() | 0;
 ra = ag(0, 0, x | 0, vb | 0) | 0;
 ra = _f(za | 0, Ga | 0, ra | 0, U() | 0) | 0;
 qa = U() | 0;
 T = $f(Ca | 0, Da | 0, 1048576, 0) | 0;
 V = U() | 0;
 xa = eg(T | 0, V | 0, 21) | 0;
 wa = U() | 0;
 ma = $f(Pb | 0, Ob | 0, ta | 0, ma | 0) | 0;
 ta = U() | 0;
 wa = $f(Nb & 2097151 | 0, 0, xa | 0, wa | 0) | 0;
 ta = ag(wa | 0, U() | 0, ma | 0, ta | 0) | 0;
 ma = U() | 0;
 V = ag(Ca | 0, Da | 0, T & -2097152 | 0, V | 0) | 0;
 T = U() | 0;
 Da = $f(Fa | 0, Ea | 0, 1048576, 0) | 0;
 Ca = U() | 0;
 wa = eg(Da | 0, Ca | 0, 21) | 0;
 xa = U() | 0;
 Jb = $f(Mb | 0, Lb | 0, Kb | 0, Jb | 0) | 0;
 Ja = $f(Jb | 0, U() | 0, Ib | 0, Ja | 0) | 0;
 fa = $f(Ja | 0, U() | 0, ea | 0, fa | 0) | 0;
 ea = U() | 0;
 xa = $f(va & 2097151 | 0, 0, wa | 0, xa | 0) | 0;
 ea = ag(xa | 0, U() | 0, fa | 0, ea | 0) | 0;
 fa = U() | 0;
 xa = $f(Ba | 0, Aa | 0, 1048576, 0) | 0;
 wa = U() | 0;
 va = eg(xa | 0, wa | 0, 21) | 0;
 Ja = U() | 0;
 Eb = $f(Hb | 0, Gb | 0, Fb | 0, Eb | 0) | 0;
 Cb = $f(Eb | 0, U() | 0, Db | 0, Cb | 0) | 0;
 Ab = $f(Cb | 0, U() | 0, Bb | 0, Ab | 0) | 0;
 ua = $f(Ab | 0, U() | 0, zb | 0, ua | 0) | 0;
 ia = $f(ua | 0, U() | 0, ja | 0, ia | 0) | 0;
 ja = U() | 0;
 Ia = $f(va | 0, Ja | 0, Ia & 2097151 | 0, 0) | 0;
 ja = ag(Ia | 0, U() | 0, ia | 0, ja | 0) | 0;
 ia = U() | 0;
 Ia = $f(Sa | 0, Ta | 0, 1048576, 0) | 0;
 Ja = U() | 0;
 va = eg(Ia | 0, Ja | 0, 21) | 0;
 ua = U() | 0;
 na = $f(yb | 0, xb | 0, wb | 0, na | 0) | 0;
 Wa = $f(na | 0, U() | 0, sa | 0, Wa | 0) | 0;
 f = $f(Wa | 0, U() | 0, Xa | 0, f | 0) | 0;
 gb = $f(f | 0, U() | 0, c | 0, gb | 0) | 0;
 Qa = $f(gb | 0, U() | 0, hb | 0, Qa | 0) | 0;
 j = $f(Qa | 0, U() | 0, Ra | 0, j | 0) | 0;
 S = $f(j | 0, U() | 0, B | 0, S | 0) | 0;
 B = U() | 0;
 ka = $f(va | 0, ua | 0, la | 0, ka | 0) | 0;
 B = ag(ka | 0, U() | 0, S | 0, B | 0) | 0;
 S = U() | 0;
 ka = $f(Ua | 0, Va | 0, 1048576, 0) | 0;
 la = U() | 0;
 ua = eg(ka | 0, la | 0, 21) | 0;
 va = U() | 0;
 La = $f(u | 0, qb | 0, rb | 0, La | 0) | 0;
 ab = $f(La | 0, U() | 0, Ka | 0, ab | 0) | 0;
 L = $f(ab | 0, U() | 0, bb | 0, L | 0) | 0;
 Za = $f(L | 0, U() | 0, M | 0, Za | 0) | 0;
 W = $f(Za | 0, U() | 0, Ya | 0, W | 0) | 0;
 Pa = $f(W | 0, U() | 0, X | 0, Pa | 0) | 0;
 nb = $f(Pa | 0, U() | 0, C | 0, nb | 0) | 0;
 eb = $f(nb | 0, U() | 0, mb | 0, eb | 0) | 0;
 g = $f(eb | 0, U() | 0, z | 0, g | 0) | 0;
 z = U() | 0;
 va = $f(Na & 2097151 | 0, 0, ua | 0, va | 0) | 0;
 z = ag(va | 0, U() | 0, g | 0, z | 0) | 0;
 g = U() | 0;
 va = $f(m | 0, r | 0, 1048576, 0) | 0;
 ua = U() | 0;
 Na = eg(va | 0, ua | 0, 21) | 0;
 eb = U() | 0;
 tb = $f(y | 0, N | 0, sb | 0, tb | 0) | 0;
 Oa = $f(tb | 0, U() | 0, da | 0, Oa | 0) | 0;
 _a = $f(Oa | 0, U() | 0, Ma | 0, _a | 0) | 0;
 i = $f(_a | 0, U() | 0, ga | 0, i | 0) | 0;
 e = $f(i | 0, U() | 0, F | 0, e | 0) | 0;
 Y = $f(e | 0, U() | 0, kb | 0, Y | 0) | 0;
 A = $f(Y | 0, U() | 0, ib | 0, A | 0) | 0;
 ba = $f(A | 0, U() | 0, D | 0, ba | 0) | 0;
 $ = $f(ba | 0, U() | 0, I | 0, $ | 0) | 0;
 h = $f($ | 0, U() | 0, s | 0, h | 0) | 0;
 q = $f(h | 0, U() | 0, aa | 0, q | 0) | 0;
 aa = U() | 0;
 jb = $f(Na | 0, eb | 0, db | 0, jb | 0) | 0;
 aa = ag(jb | 0, U() | 0, q | 0, aa | 0) | 0;
 q = U() | 0;
 jb = ag(1048576, 0, pb | 0, ob | 0) | 0;
 db = U() | 0;
 eb = eg(jb | 0, db | 0, 21) | 0;
 Na = U() | 0;
 k = _f(k | 0, 0, x | 0, vb | 0) | 0;
 h = U() | 0;
 n = _f(n | 0, 0, Ha | 0, 0) | 0;
 s = U() | 0;
 $ = _f(ha | 0, 0, cb | 0, 0) | 0;
 I = U() | 0;
 ba = _f(v | 0, 0, t | 0, w | 0) | 0;
 D = U() | 0;
 A = _f(ca | 0, 0, ub | 0, o | 0) | 0;
 ib = U() | 0;
 Y = _f(O | 0, P | 0, _ | 0, 0) | 0;
 kb = U() | 0;
 e = _f(H | 0, G | 0, lb | 0, 0) | 0;
 F = U() | 0;
 i = _f(Z | 0, 0, $a | 0, 0) | 0;
 ga = U() | 0;
 E = _f(ya | 0, 0, E | 0, 0) | 0;
 _a = U() | 0;
 fb = _f(za | 0, Ga | 0, fb | 0, 0) | 0;
 Ma = U() | 0;
 h = $f(n | 0, s | 0, k | 0, h | 0) | 0;
 I = $f(h | 0, U() | 0, $ | 0, I | 0) | 0;
 D = $f(I | 0, U() | 0, ba | 0, D | 0) | 0;
 ib = $f(D | 0, U() | 0, A | 0, ib | 0) | 0;
 kb = $f(ib | 0, U() | 0, Y | 0, kb | 0) | 0;
 F = $f(kb | 0, U() | 0, e | 0, F | 0) | 0;
 ga = $f(F | 0, U() | 0, i | 0, ga | 0) | 0;
 _a = $f(ga | 0, U() | 0, E | 0, _a | 0) | 0;
 Ma = $f(_a | 0, U() | 0, fb | 0, Ma | 0) | 0;
 Ma = ag(eb | 0, Na | 0, Ma | 0, U() | 0) | 0;
 Na = U() | 0;
 eb = ag(1048576, 0, J | 0, K | 0) | 0;
 fb = U() | 0;
 _a = eg(eb | 0, fb | 0, 21) | 0;
 E = U() | 0;
 ha = _f(ha | 0, 0, x | 0, vb | 0) | 0;
 ga = U() | 0;
 v = _f(v | 0, 0, Ha | 0, 0) | 0;
 i = U() | 0;
 F = _f(ca | 0, 0, cb | 0, 0) | 0;
 e = U() | 0;
 kb = _f(O | 0, P | 0, t | 0, w | 0) | 0;
 Y = U() | 0;
 ib = _f(H | 0, G | 0, ub | 0, o | 0) | 0;
 A = U() | 0;
 D = _f(Z | 0, 0, _ | 0, 0) | 0;
 ba = U() | 0;
 lb = _f(ya | 0, 0, lb | 0, 0) | 0;
 I = U() | 0;
 $a = _f(za | 0, Ga | 0, $a | 0, 0) | 0;
 $ = U() | 0;
 ga = $f(v | 0, i | 0, ha | 0, ga | 0) | 0;
 e = $f(ga | 0, U() | 0, F | 0, e | 0) | 0;
 Y = $f(e | 0, U() | 0, kb | 0, Y | 0) | 0;
 A = $f(Y | 0, U() | 0, ib | 0, A | 0) | 0;
 ba = $f(A | 0, U() | 0, D | 0, ba | 0) | 0;
 I = $f(ba | 0, U() | 0, lb | 0, I | 0) | 0;
 $ = $f(I | 0, U() | 0, $a | 0, $ | 0) | 0;
 $ = ag(_a | 0, E | 0, $ | 0, U() | 0) | 0;
 E = U() | 0;
 _a = ag(1048576, 0, R | 0, Q | 0) | 0;
 $a = U() | 0;
 I = eg(_a | 0, $a | 0, 21) | 0;
 lb = U() | 0;
 ca = _f(ca | 0, 0, x | 0, vb | 0) | 0;
 ba = U() | 0;
 P = _f(O | 0, P | 0, Ha | 0, 0) | 0;
 O = U() | 0;
 D = _f(H | 0, G | 0, cb | 0, 0) | 0;
 A = U() | 0;
 ib = _f(Z | 0, 0, t | 0, w | 0) | 0;
 Y = U() | 0;
 o = _f(ya | 0, 0, ub | 0, o | 0) | 0;
 ub = U() | 0;
 _ = _f(za | 0, Ga | 0, _ | 0, 0) | 0;
 kb = U() | 0;
 ba = $f(P | 0, O | 0, ca | 0, ba | 0) | 0;
 A = $f(ba | 0, U() | 0, D | 0, A | 0) | 0;
 Y = $f(A | 0, U() | 0, ib | 0, Y | 0) | 0;
 ub = $f(Y | 0, U() | 0, o | 0, ub | 0) | 0;
 kb = $f(ub | 0, U() | 0, _ | 0, kb | 0) | 0;
 kb = ag(I | 0, lb | 0, kb | 0, U() | 0) | 0;
 lb = U() | 0;
 I = ag(1048576, 0, pa | 0, oa | 0) | 0;
 _ = U() | 0;
 ub = eg(I | 0, _ | 0, 21) | 0;
 o = U() | 0;
 G = _f(H | 0, G | 0, x | 0, vb | 0) | 0;
 H = U() | 0;
 Z = _f(Z | 0, 0, Ha | 0, 0) | 0;
 Y = U() | 0;
 cb = _f(ya | 0, 0, cb | 0, 0) | 0;
 ib = U() | 0;
 w = _f(za | 0, Ga | 0, t | 0, w | 0) | 0;
 t = U() | 0;
 H = $f(Z | 0, Y | 0, G | 0, H | 0) | 0;
 ib = $f(H | 0, U() | 0, cb | 0, ib | 0) | 0;
 t = $f(ib | 0, U() | 0, w | 0, t | 0) | 0;
 t = ag(ub | 0, o | 0, t | 0, U() | 0) | 0;
 o = U() | 0;
 oa = $f(I & -2097152 | 0, _ | 0, pa | 0, oa | 0) | 0;
 pa = U() | 0;
 _ = ag(1048576, 0, l | 0, p | 0) | 0;
 I = U() | 0;
 ub = eg(_ | 0, I | 0, 21) | 0;
 w = U() | 0;
 vb = _f(ya | 0, 0, x | 0, vb | 0) | 0;
 x = U() | 0;
 Ha = _f(za | 0, Ga | 0, Ha | 0, 0) | 0;
 x = $f(Ha | 0, U() | 0, vb | 0, x | 0) | 0;
 x = ag(ub | 0, w | 0, x | 0, U() | 0) | 0;
 w = U() | 0;
 p = $f(_ & -2097152 | 0, I | 0, l | 0, p | 0) | 0;
 l = U() | 0;
 I = $f(ra | 0, qa | 0, 1048576, 0) | 0;
 _ = U() | 0;
 ub = eg(I | 0, _ | 0, 21) | 0;
 vb = U() | 0;
 _ = ag(ra | 0, qa | 0, I & -2097152 | 0, _ | 0) | 0;
 I = U() | 0;
 qa = $f(ta | 0, ma | 0, 1048576, 0) | 0;
 ra = U() | 0;
 Ha = eg(qa | 0, ra | 0, 21) | 0;
 Ga = U() | 0;
 ra = ag(ta | 0, ma | 0, qa & -2097152 | 0, ra | 0) | 0;
 qa = U() | 0;
 ma = $f(ea | 0, fa | 0, 1048576, 0) | 0;
 ta = U() | 0;
 za = eg(ma | 0, ta | 0, 21) | 0;
 ya = U() | 0;
 ta = ag(ea | 0, fa | 0, ma & -2097152 | 0, ta | 0) | 0;
 ma = U() | 0;
 fa = $f(ja | 0, ia | 0, 1048576, 0) | 0;
 ea = U() | 0;
 ib = eg(fa | 0, ea | 0, 21) | 0;
 cb = U() | 0;
 H = $f(B | 0, S | 0, 1048576, 0) | 0;
 G = U() | 0;
 Y = eg(H | 0, G | 0, 21) | 0;
 Z = U() | 0;
 A = $f(z | 0, g | 0, 1048576, 0) | 0;
 D = U() | 0;
 ba = eg(A | 0, D | 0, 21) | 0;
 ca = U() | 0;
 O = $f(aa | 0, q | 0, 1048576, 0) | 0;
 P = U() | 0;
 e = eg(O | 0, P | 0, 21) | 0;
 F = U() | 0;
 ga = $f(Ma | 0, Na | 0, 1048576, 0) | 0;
 ha = U() | 0;
 i = eg(ga | 0, ha | 0, 21) | 0;
 v = U() | 0;
 h = $f($ | 0, E | 0, 1048576, 0) | 0;
 k = U() | 0;
 s = eg(h | 0, k | 0, 21) | 0;
 n = U() | 0;
 Oa = $f(kb | 0, lb | 0, 1048576, 0) | 0;
 da = U() | 0;
 tb = eg(Oa | 0, da | 0, 21) | 0;
 pa = ag(tb | 0, U() | 0, oa | 0, pa | 0) | 0;
 oa = U() | 0;
 da = ag(kb | 0, lb | 0, Oa & -2097152 | 0, da | 0) | 0;
 Oa = U() | 0;
 lb = $f(t | 0, o | 0, 1048576, 0) | 0;
 kb = U() | 0;
 tb = eg(lb | 0, kb | 0, 21) | 0;
 l = ag(tb | 0, U() | 0, p | 0, l | 0) | 0;
 p = U() | 0;
 kb = ag(t | 0, o | 0, lb & -2097152 | 0, kb | 0) | 0;
 lb = U() | 0;
 o = $f(x | 0, w | 0, 1048576, 0) | 0;
 t = U() | 0;
 tb = eg(o | 0, t | 0, 21) | 0;
 I = $f(tb | 0, U() | 0, _ | 0, I | 0) | 0;
 _ = U() | 0;
 t = ag(x | 0, w | 0, o & -2097152 | 0, t | 0) | 0;
 o = U() | 0;
 w = _f(ub | 0, vb | 0, 666643, 0) | 0;
 x = U() | 0;
 tb = _f(ub | 0, vb | 0, 470296, 0) | 0;
 sb = U() | 0;
 N = _f(ub | 0, vb | 0, 654183, 0) | 0;
 y = U() | 0;
 mb = _f(ub | 0, vb | 0, -997805, -1) | 0;
 nb = U() | 0;
 C = _f(ub | 0, vb | 0, 136657, 0) | 0;
 Pa = U() | 0;
 vb = _f(ub | 0, vb | 0, -683901, -1) | 0;
 Q = ag(vb | 0, U() | 0, R | 0, Q | 0) | 0;
 $a = ag(Q | 0, U() | 0, _a & -2097152 | 0, $a | 0) | 0;
 n = $f($a | 0, U() | 0, s | 0, n | 0) | 0;
 s = U() | 0;
 $a = _f(I | 0, _ | 0, 666643, 0) | 0;
 _a = U() | 0;
 Q = _f(I | 0, _ | 0, 470296, 0) | 0;
 R = U() | 0;
 vb = _f(I | 0, _ | 0, 654183, 0) | 0;
 ub = U() | 0;
 X = _f(I | 0, _ | 0, -997805, -1) | 0;
 W = U() | 0;
 Ya = _f(I | 0, _ | 0, 136657, 0) | 0;
 Za = U() | 0;
 _ = _f(I | 0, _ | 0, -683901, -1) | 0;
 I = U() | 0;
 M = _f(t | 0, o | 0, 666643, 0) | 0;
 L = U() | 0;
 bb = _f(t | 0, o | 0, 470296, 0) | 0;
 ab = U() | 0;
 Ka = _f(t | 0, o | 0, 654183, 0) | 0;
 La = U() | 0;
 rb = _f(t | 0, o | 0, -997805, -1) | 0;
 qb = U() | 0;
 u = _f(t | 0, o | 0, 136657, 0) | 0;
 j = U() | 0;
 o = _f(t | 0, o | 0, -683901, -1) | 0;
 t = U() | 0;
 K = ag(mb | 0, nb | 0, J | 0, K | 0) | 0;
 Za = $f(K | 0, U() | 0, Ya | 0, Za | 0) | 0;
 t = $f(Za | 0, U() | 0, o | 0, t | 0) | 0;
 fb = ag(t | 0, U() | 0, eb & -2097152 | 0, fb | 0) | 0;
 v = $f(fb | 0, U() | 0, i | 0, v | 0) | 0;
 i = U() | 0;
 fb = _f(l | 0, p | 0, 666643, 0) | 0;
 eb = U() | 0;
 t = _f(l | 0, p | 0, 470296, 0) | 0;
 o = U() | 0;
 Za = _f(l | 0, p | 0, 654183, 0) | 0;
 Ya = U() | 0;
 K = _f(l | 0, p | 0, -997805, -1) | 0;
 J = U() | 0;
 nb = _f(l | 0, p | 0, 136657, 0) | 0;
 mb = U() | 0;
 p = _f(l | 0, p | 0, -683901, -1) | 0;
 l = U() | 0;
 Ra = _f(kb | 0, lb | 0, 666643, 0) | 0;
 Qa = U() | 0;
 hb = _f(kb | 0, lb | 0, 470296, 0) | 0;
 gb = U() | 0;
 c = _f(kb | 0, lb | 0, 654183, 0) | 0;
 f = U() | 0;
 Xa = _f(kb | 0, lb | 0, -997805, -1) | 0;
 Wa = U() | 0;
 sa = _f(kb | 0, lb | 0, 136657, 0) | 0;
 na = U() | 0;
 lb = _f(kb | 0, lb | 0, -683901, -1) | 0;
 kb = U() | 0;
 sb = $f(vb | 0, ub | 0, tb | 0, sb | 0) | 0;
 qb = $f(sb | 0, U() | 0, rb | 0, qb | 0) | 0;
 ob = ag(qb | 0, U() | 0, pb | 0, ob | 0) | 0;
 mb = $f(ob | 0, U() | 0, nb | 0, mb | 0) | 0;
 kb = $f(mb | 0, U() | 0, lb | 0, kb | 0) | 0;
 db = ag(kb | 0, U() | 0, jb & -2097152 | 0, db | 0) | 0;
 F = $f(db | 0, U() | 0, e | 0, F | 0) | 0;
 e = U() | 0;
 db = _f(pa | 0, oa | 0, 666643, 0) | 0;
 db = $f(ib | 0, cb | 0, db | 0, U() | 0) | 0;
 Ta = $f(db | 0, U() | 0, Sa | 0, Ta | 0) | 0;
 Ja = ag(Ta | 0, U() | 0, Ia & -2097152 | 0, Ja | 0) | 0;
 Ia = U() | 0;
 Ta = _f(pa | 0, oa | 0, 470296, 0) | 0;
 Sa = U() | 0;
 db = _f(pa | 0, oa | 0, 654183, 0) | 0;
 cb = U() | 0;
 eb = $f(hb | 0, gb | 0, fb | 0, eb | 0) | 0;
 cb = $f(eb | 0, U() | 0, db | 0, cb | 0) | 0;
 Va = $f(cb | 0, U() | 0, Ua | 0, Va | 0) | 0;
 Z = $f(Va | 0, U() | 0, Y | 0, Z | 0) | 0;
 la = ag(Z | 0, U() | 0, ka & -2097152 | 0, la | 0) | 0;
 ka = U() | 0;
 Z = _f(pa | 0, oa | 0, -997805, -1) | 0;
 Y = U() | 0;
 Va = _f(pa | 0, oa | 0, 136657, 0) | 0;
 Ua = U() | 0;
 _a = $f(bb | 0, ab | 0, $a | 0, _a | 0) | 0;
 Ya = $f(_a | 0, U() | 0, Za | 0, Ya | 0) | 0;
 Wa = $f(Ya | 0, U() | 0, Xa | 0, Wa | 0) | 0;
 Ua = $f(Wa | 0, U() | 0, Va | 0, Ua | 0) | 0;
 r = $f(Ua | 0, U() | 0, m | 0, r | 0) | 0;
 ca = $f(r | 0, U() | 0, ba | 0, ca | 0) | 0;
 ua = ag(ca | 0, U() | 0, va & -2097152 | 0, ua | 0) | 0;
 va = U() | 0;
 oa = _f(pa | 0, oa | 0, -683901, -1) | 0;
 pa = U() | 0;
 ca = $f(Ja | 0, Ia | 0, 1048576, 0) | 0;
 ba = U() | 0;
 r = eg(ca | 0, ba | 0, 21) | 0;
 m = U() | 0;
 Qa = $f(Ta | 0, Sa | 0, Ra | 0, Qa | 0) | 0;
 S = $f(Qa | 0, U() | 0, B | 0, S | 0) | 0;
 G = ag(S | 0, U() | 0, H & -2097152 | 0, G | 0) | 0;
 m = $f(G | 0, U() | 0, r | 0, m | 0) | 0;
 r = U() | 0;
 G = $f(la | 0, ka | 0, 1048576, 0) | 0;
 H = U() | 0;
 S = eg(G | 0, H | 0, 21) | 0;
 B = U() | 0;
 L = $f(t | 0, o | 0, M | 0, L | 0) | 0;
 f = $f(L | 0, U() | 0, c | 0, f | 0) | 0;
 Y = $f(f | 0, U() | 0, Z | 0, Y | 0) | 0;
 g = $f(Y | 0, U() | 0, z | 0, g | 0) | 0;
 D = ag(g | 0, U() | 0, A & -2097152 | 0, D | 0) | 0;
 B = $f(D | 0, U() | 0, S | 0, B | 0) | 0;
 S = U() | 0;
 D = $f(ua | 0, va | 0, 1048576, 0) | 0;
 A = U() | 0;
 g = eg(D | 0, A | 0, 21) | 0;
 z = U() | 0;
 x = $f(Q | 0, R | 0, w | 0, x | 0) | 0;
 La = $f(x | 0, U() | 0, Ka | 0, La | 0) | 0;
 J = $f(La | 0, U() | 0, K | 0, J | 0) | 0;
 na = $f(J | 0, U() | 0, sa | 0, na | 0) | 0;
 pa = $f(na | 0, U() | 0, oa | 0, pa | 0) | 0;
 q = $f(pa | 0, U() | 0, aa | 0, q | 0) | 0;
 P = ag(q | 0, U() | 0, O & -2097152 | 0, P | 0) | 0;
 z = $f(P | 0, U() | 0, g | 0, z | 0) | 0;
 g = U() | 0;
 P = $f(F | 0, e | 0, 1048576, 0) | 0;
 O = U() | 0;
 q = eg(P | 0, O | 0, 21) | 0;
 aa = U() | 0;
 y = $f(X | 0, W | 0, N | 0, y | 0) | 0;
 j = $f(y | 0, U() | 0, u | 0, j | 0) | 0;
 l = $f(j | 0, U() | 0, p | 0, l | 0) | 0;
 Na = $f(l | 0, U() | 0, Ma | 0, Na | 0) | 0;
 ha = ag(Na | 0, U() | 0, ga & -2097152 | 0, ha | 0) | 0;
 aa = $f(ha | 0, U() | 0, q | 0, aa | 0) | 0;
 q = U() | 0;
 O = ag(F | 0, e | 0, P & -2097152 | 0, O | 0) | 0;
 P = U() | 0;
 e = $f(v | 0, i | 0, 1048576, 0) | 0;
 F = U() | 0;
 ha = eg(e | 0, F | 0, 21) | 0;
 ga = U() | 0;
 Pa = $f(_ | 0, I | 0, C | 0, Pa | 0) | 0;
 E = $f(Pa | 0, U() | 0, $ | 0, E | 0) | 0;
 k = ag(E | 0, U() | 0, h & -2097152 | 0, k | 0) | 0;
 ga = $f(k | 0, U() | 0, ha | 0, ga | 0) | 0;
 ha = U() | 0;
 F = ag(v | 0, i | 0, e & -2097152 | 0, F | 0) | 0;
 e = U() | 0;
 i = $f(n | 0, s | 0, 1048576, 0) | 0;
 v = U() | 0;
 k = eg(i | 0, v | 0, 21) | 0;
 Oa = $f(k | 0, U() | 0, da | 0, Oa | 0) | 0;
 da = U() | 0;
 v = ag(n | 0, s | 0, i & -2097152 | 0, v | 0) | 0;
 i = U() | 0;
 s = $f(m | 0, r | 0, 1048576, 0) | 0;
 n = U() | 0;
 k = eg(s | 0, n | 0, 21) | 0;
 h = U() | 0;
 E = $f(B | 0, S | 0, 1048576, 0) | 0;
 $ = U() | 0;
 Pa = eg(E | 0, $ | 0, 21) | 0;
 C = U() | 0;
 I = $f(z | 0, g | 0, 1048576, 0) | 0;
 _ = U() | 0;
 Na = eg(I | 0, _ | 0, 21) | 0;
 P = $f(Na | 0, U() | 0, O | 0, P | 0) | 0;
 O = U() | 0;
 _ = ag(z | 0, g | 0, I & -2097152 | 0, _ | 0) | 0;
 I = U() | 0;
 g = $f(aa | 0, q | 0, 1048576, 0) | 0;
 z = U() | 0;
 Na = eg(g | 0, z | 0, 21) | 0;
 e = $f(Na | 0, U() | 0, F | 0, e | 0) | 0;
 F = U() | 0;
 z = ag(aa | 0, q | 0, g & -2097152 | 0, z | 0) | 0;
 g = U() | 0;
 q = $f(ga | 0, ha | 0, 1048576, 0) | 0;
 aa = U() | 0;
 Na = eg(q | 0, aa | 0, 21) | 0;
 i = $f(Na | 0, U() | 0, v | 0, i | 0) | 0;
 v = U() | 0;
 aa = ag(ga | 0, ha | 0, q & -2097152 | 0, aa | 0) | 0;
 q = U() | 0;
 ha = _f(Oa | 0, da | 0, 666643, 0) | 0;
 ga = U() | 0;
 Na = _f(Oa | 0, da | 0, 470296, 0) | 0;
 Ma = U() | 0;
 l = _f(Oa | 0, da | 0, 654183, 0) | 0;
 p = U() | 0;
 j = _f(Oa | 0, da | 0, -997805, -1) | 0;
 u = U() | 0;
 y = _f(Oa | 0, da | 0, 136657, 0) | 0;
 N = U() | 0;
 da = _f(Oa | 0, da | 0, -683901, -1) | 0;
 da = $f(Pa | 0, C | 0, da | 0, U() | 0) | 0;
 va = $f(da | 0, U() | 0, ua | 0, va | 0) | 0;
 A = ag(va | 0, U() | 0, D & -2097152 | 0, A | 0) | 0;
 D = U() | 0;
 va = _f(i | 0, v | 0, 666643, 0) | 0;
 ua = U() | 0;
 da = _f(i | 0, v | 0, 470296, 0) | 0;
 C = U() | 0;
 Pa = _f(i | 0, v | 0, 654183, 0) | 0;
 Oa = U() | 0;
 W = _f(i | 0, v | 0, -997805, -1) | 0;
 X = U() | 0;
 pa = _f(i | 0, v | 0, 136657, 0) | 0;
 oa = U() | 0;
 v = _f(i | 0, v | 0, -683901, -1) | 0;
 i = U() | 0;
 na = _f(aa | 0, q | 0, 666643, 0) | 0;
 na = $f(ta | 0, ma | 0, na | 0, U() | 0) | 0;
 ma = U() | 0;
 ta = _f(aa | 0, q | 0, 470296, 0) | 0;
 sa = U() | 0;
 J = _f(aa | 0, q | 0, 654183, 0) | 0;
 K = U() | 0;
 La = _f(aa | 0, q | 0, -997805, -1) | 0;
 Ka = U() | 0;
 x = _f(aa | 0, q | 0, 136657, 0) | 0;
 w = U() | 0;
 q = _f(aa | 0, q | 0, -683901, -1) | 0;
 aa = U() | 0;
 u = $f(pa | 0, oa | 0, j | 0, u | 0) | 0;
 aa = $f(u | 0, U() | 0, q | 0, aa | 0) | 0;
 h = $f(aa | 0, U() | 0, k | 0, h | 0) | 0;
 ka = $f(h | 0, U() | 0, la | 0, ka | 0) | 0;
 H = ag(ka | 0, U() | 0, G & -2097152 | 0, H | 0) | 0;
 G = U() | 0;
 ka = _f(e | 0, F | 0, 666643, 0) | 0;
 la = U() | 0;
 h = _f(e | 0, F | 0, 470296, 0) | 0;
 k = U() | 0;
 aa = _f(e | 0, F | 0, 654183, 0) | 0;
 q = U() | 0;
 u = _f(e | 0, F | 0, -997805, -1) | 0;
 j = U() | 0;
 oa = _f(e | 0, F | 0, 136657, 0) | 0;
 pa = U() | 0;
 F = _f(e | 0, F | 0, -683901, -1) | 0;
 e = U() | 0;
 R = _f(z | 0, g | 0, 666643, 0) | 0;
 Q = U() | 0;
 Y = _f(z | 0, g | 0, 470296, 0) | 0;
 Z = U() | 0;
 f = _f(z | 0, g | 0, 654183, 0) | 0;
 c = U() | 0;
 L = _f(z | 0, g | 0, -997805, -1) | 0;
 M = U() | 0;
 o = _f(z | 0, g | 0, 136657, 0) | 0;
 t = U() | 0;
 g = _f(z | 0, g | 0, -683901, -1) | 0;
 z = U() | 0;
 Ma = $f(Pa | 0, Oa | 0, Na | 0, Ma | 0) | 0;
 Ka = $f(Ma | 0, U() | 0, La | 0, Ka | 0) | 0;
 Ia = $f(Ka | 0, U() | 0, Ja | 0, Ia | 0) | 0;
 ba = ag(Ia | 0, U() | 0, ca & -2097152 | 0, ba | 0) | 0;
 pa = $f(ba | 0, U() | 0, oa | 0, pa | 0) | 0;
 z = $f(pa | 0, U() | 0, g | 0, z | 0) | 0;
 g = U() | 0;
 pa = _f(P | 0, O | 0, 666643, 0) | 0;
 T = $f(pa | 0, U() | 0, V | 0, T | 0) | 0;
 V = U() | 0;
 pa = _f(P | 0, O | 0, 470296, 0) | 0;
 oa = U() | 0;
 ba = _f(P | 0, O | 0, 654183, 0) | 0;
 ca = U() | 0;
 Ea = $f(Ha | 0, Ga | 0, Fa | 0, Ea | 0) | 0;
 Ca = ag(Ea | 0, U() | 0, Da & -2097152 | 0, Ca | 0) | 0;
 ca = $f(Ca | 0, U() | 0, ba | 0, ca | 0) | 0;
 la = $f(ca | 0, U() | 0, ka | 0, la | 0) | 0;
 Z = $f(la | 0, U() | 0, Y | 0, Z | 0) | 0;
 Y = U() | 0;
 la = _f(P | 0, O | 0, -997805, -1) | 0;
 ka = U() | 0;
 ca = _f(P | 0, O | 0, 136657, 0) | 0;
 ba = U() | 0;
 ya = $f(Ba | 0, Aa | 0, za | 0, ya | 0) | 0;
 wa = ag(ya | 0, U() | 0, xa & -2097152 | 0, wa | 0) | 0;
 ua = $f(wa | 0, U() | 0, va | 0, ua | 0) | 0;
 sa = $f(ua | 0, U() | 0, ta | 0, sa | 0) | 0;
 ba = $f(sa | 0, U() | 0, ca | 0, ba | 0) | 0;
 q = $f(ba | 0, U() | 0, aa | 0, q | 0) | 0;
 M = $f(q | 0, U() | 0, L | 0, M | 0) | 0;
 L = U() | 0;
 O = _f(P | 0, O | 0, -683901, -1) | 0;
 P = U() | 0;
 q = $f(T | 0, V | 0, 1048576, 0) | 0;
 aa = U() | 0;
 ba = eg(q | 0, aa | 0, 21) | 0;
 ca = U() | 0;
 oa = $f(ra | 0, qa | 0, pa | 0, oa | 0) | 0;
 Q = $f(oa | 0, U() | 0, R | 0, Q | 0) | 0;
 ca = $f(Q | 0, U() | 0, ba | 0, ca | 0) | 0;
 ba = U() | 0;
 aa = ag(T | 0, V | 0, q & -2097152 | 0, aa | 0) | 0;
 q = U() | 0;
 V = $f(Z | 0, Y | 0, 1048576, 0) | 0;
 T = U() | 0;
 Q = eg(V | 0, T | 0, 21) | 0;
 R = U() | 0;
 ka = $f(na | 0, ma | 0, la | 0, ka | 0) | 0;
 k = $f(ka | 0, U() | 0, h | 0, k | 0) | 0;
 c = $f(k | 0, U() | 0, f | 0, c | 0) | 0;
 R = $f(c | 0, U() | 0, Q | 0, R | 0) | 0;
 Q = U() | 0;
 c = $f(M | 0, L | 0, 1048576, 0) | 0;
 f = U() | 0;
 k = eg(c | 0, f | 0, 21) | 0;
 h = U() | 0;
 ga = $f(ja | 0, ia | 0, ha | 0, ga | 0) | 0;
 ea = ag(ga | 0, U() | 0, fa & -2097152 | 0, ea | 0) | 0;
 C = $f(ea | 0, U() | 0, da | 0, C | 0) | 0;
 K = $f(C | 0, U() | 0, J | 0, K | 0) | 0;
 P = $f(K | 0, U() | 0, O | 0, P | 0) | 0;
 j = $f(P | 0, U() | 0, u | 0, j | 0) | 0;
 t = $f(j | 0, U() | 0, o | 0, t | 0) | 0;
 h = $f(t | 0, U() | 0, k | 0, h | 0) | 0;
 k = U() | 0;
 t = $f(z | 0, g | 0, 1048576, 0) | 0;
 o = U() | 0;
 j = eg(t | 0, o | 0, 21) | 0;
 u = U() | 0;
 p = $f(W | 0, X | 0, l | 0, p | 0) | 0;
 w = $f(p | 0, U() | 0, x | 0, w | 0) | 0;
 r = $f(w | 0, U() | 0, m | 0, r | 0) | 0;
 n = ag(r | 0, U() | 0, s & -2097152 | 0, n | 0) | 0;
 e = $f(n | 0, U() | 0, F | 0, e | 0) | 0;
 u = $f(e | 0, U() | 0, j | 0, u | 0) | 0;
 j = U() | 0;
 o = ag(z | 0, g | 0, t & -2097152 | 0, o | 0) | 0;
 t = U() | 0;
 g = $f(H | 0, G | 0, 1048576, 0) | 0;
 z = U() | 0;
 e = eg(g | 0, z | 0, 21) | 0;
 F = U() | 0;
 N = $f(v | 0, i | 0, y | 0, N | 0) | 0;
 S = $f(N | 0, U() | 0, B | 0, S | 0) | 0;
 $ = ag(S | 0, U() | 0, E & -2097152 | 0, $ | 0) | 0;
 F = $f($ | 0, U() | 0, e | 0, F | 0) | 0;
 e = U() | 0;
 z = ag(H | 0, G | 0, g & -2097152 | 0, z | 0) | 0;
 g = U() | 0;
 G = $f(A | 0, D | 0, 1048576, 0) | 0;
 H = U() | 0;
 $ = eg(G | 0, H | 0, 21) | 0;
 $ = $f(_ | 0, I | 0, $ | 0, U() | 0) | 0;
 I = U() | 0;
 _ = $f(ca | 0, ba | 0, 1048576, 0) | 0;
 E = U() | 0;
 S = eg(_ | 0, E | 0, 21) | 0;
 B = U() | 0;
 N = $f(R | 0, Q | 0, 1048576, 0) | 0;
 y = U() | 0;
 i = eg(N | 0, y | 0, 21) | 0;
 v = U() | 0;
 n = $f(h | 0, k | 0, 1048576, 0) | 0;
 s = U() | 0;
 r = eg(n | 0, s | 0, 21) | 0;
 r = $f(o | 0, t | 0, r | 0, U() | 0) | 0;
 t = U() | 0;
 o = $f(u | 0, j | 0, 1048576, 0) | 0;
 m = U() | 0;
 w = eg(o | 0, m | 0, 21) | 0;
 w = $f(z | 0, g | 0, w | 0, U() | 0) | 0;
 g = U() | 0;
 m = ag(u | 0, j | 0, o & -2097152 | 0, m | 0) | 0;
 o = U() | 0;
 j = $f(F | 0, e | 0, 1048576, 0) | 0;
 u = U() | 0;
 z = eg(j | 0, u | 0, 21) | 0;
 x = U() | 0;
 u = ag(F | 0, e | 0, j & -2097152 | 0, u | 0) | 0;
 j = U() | 0;
 e = $f($ | 0, I | 0, 1048576, 0) | 0;
 F = U() | 0;
 p = eg(e | 0, F | 0, 21) | 0;
 l = U() | 0;
 F = ag($ | 0, I | 0, e & -2097152 | 0, F | 0) | 0;
 e = U() | 0;
 I = _f(p | 0, l | 0, 666643, 0) | 0;
 I = $f(aa | 0, q | 0, I | 0, U() | 0) | 0;
 q = U() | 0;
 aa = _f(p | 0, l | 0, 470296, 0) | 0;
 $ = U() | 0;
 X = _f(p | 0, l | 0, 654183, 0) | 0;
 W = U() | 0;
 P = _f(p | 0, l | 0, -997805, -1) | 0;
 O = U() | 0;
 K = _f(p | 0, l | 0, 136657, 0) | 0;
 J = U() | 0;
 l = _f(p | 0, l | 0, -683901, -1) | 0;
 p = U() | 0;
 q = eg(I | 0, q | 0, 21) | 0;
 C = U() | 0;
 $ = $f(ca | 0, ba | 0, aa | 0, $ | 0) | 0;
 E = ag($ | 0, U() | 0, _ & -2097152 | 0, E | 0) | 0;
 C = $f(E | 0, U() | 0, q | 0, C | 0) | 0;
 q = eg(C | 0, U() | 0, 21) | 0;
 E = U() | 0;
 W = $f(Z | 0, Y | 0, X | 0, W | 0) | 0;
 T = ag(W | 0, U() | 0, V & -2097152 | 0, T | 0) | 0;
 B = $f(T | 0, U() | 0, S | 0, B | 0) | 0;
 E = $f(B | 0, U() | 0, q | 0, E | 0) | 0;
 q = eg(E | 0, U() | 0, 21) | 0;
 B = U() | 0;
 O = $f(R | 0, Q | 0, P | 0, O | 0) | 0;
 y = ag(O | 0, U() | 0, N & -2097152 | 0, y | 0) | 0;
 B = $f(y | 0, U() | 0, q | 0, B | 0) | 0;
 q = eg(B | 0, U() | 0, 21) | 0;
 y = U() | 0;
 J = $f(M | 0, L | 0, K | 0, J | 0) | 0;
 f = ag(J | 0, U() | 0, c & -2097152 | 0, f | 0) | 0;
 v = $f(f | 0, U() | 0, i | 0, v | 0) | 0;
 y = $f(v | 0, U() | 0, q | 0, y | 0) | 0;
 q = eg(y | 0, U() | 0, 21) | 0;
 v = U() | 0;
 p = $f(h | 0, k | 0, l | 0, p | 0) | 0;
 s = ag(p | 0, U() | 0, n & -2097152 | 0, s | 0) | 0;
 v = $f(s | 0, U() | 0, q | 0, v | 0) | 0;
 q = eg(v | 0, U() | 0, 21) | 0;
 q = $f(r | 0, t | 0, q | 0, U() | 0) | 0;
 t = eg(q | 0, U() | 0, 21) | 0;
 o = $f(t | 0, U() | 0, m | 0, o | 0) | 0;
 m = eg(o | 0, U() | 0, 21) | 0;
 m = $f(w | 0, g | 0, m | 0, U() | 0) | 0;
 g = eg(m | 0, U() | 0, 21) | 0;
 j = $f(g | 0, U() | 0, u | 0, j | 0) | 0;
 u = eg(j | 0, U() | 0, 21) | 0;
 g = U() | 0;
 D = $f(z | 0, x | 0, A | 0, D | 0) | 0;
 H = ag(D | 0, U() | 0, G & -2097152 | 0, H | 0) | 0;
 g = $f(H | 0, U() | 0, u | 0, g | 0) | 0;
 u = eg(g | 0, U() | 0, 21) | 0;
 e = $f(u | 0, U() | 0, F | 0, e | 0) | 0;
 F = eg(e | 0, U() | 0, 21) | 0;
 u = U() | 0;
 H = _f(F | 0, u | 0, 666643, 0) | 0;
 I = $f(H | 0, U() | 0, I & 2097151 | 0, 0) | 0;
 H = U() | 0;
 G = _f(F | 0, u | 0, 470296, 0) | 0;
 C = $f(G | 0, U() | 0, C & 2097151 | 0, 0) | 0;
 G = U() | 0;
 D = _f(F | 0, u | 0, 654183, 0) | 0;
 E = $f(D | 0, U() | 0, E & 2097151 | 0, 0) | 0;
 D = U() | 0;
 A = _f(F | 0, u | 0, -997805, -1) | 0;
 B = $f(A | 0, U() | 0, B & 2097151 | 0, 0) | 0;
 A = U() | 0;
 x = _f(F | 0, u | 0, 136657, 0) | 0;
 y = $f(x | 0, U() | 0, y & 2097151 | 0, 0) | 0;
 x = U() | 0;
 u = _f(F | 0, u | 0, -683901, -1) | 0;
 v = $f(u | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 u = U() | 0;
 F = eg(I | 0, H | 0, 21) | 0;
 F = $f(C | 0, G | 0, F | 0, U() | 0) | 0;
 G = U() | 0;
 C = eg(F | 0, G | 0, 21) | 0;
 C = $f(E | 0, D | 0, C | 0, U() | 0) | 0;
 D = U() | 0;
 E = F & 2097151;
 z = eg(C | 0, D | 0, 21) | 0;
 z = $f(B | 0, A | 0, z | 0, U() | 0) | 0;
 A = U() | 0;
 B = C & 2097151;
 w = eg(z | 0, A | 0, 21) | 0;
 w = $f(y | 0, x | 0, w | 0, U() | 0) | 0;
 x = U() | 0;
 y = z & 2097151;
 t = eg(w | 0, x | 0, 21) | 0;
 t = $f(v | 0, u | 0, t | 0, U() | 0) | 0;
 u = U() | 0;
 v = w & 2097151;
 r = eg(t | 0, u | 0, 21) | 0;
 q = $f(r | 0, U() | 0, q & 2097151 | 0, 0) | 0;
 r = U() | 0;
 s = t & 2097151;
 n = eg(q | 0, r | 0, 21) | 0;
 o = $f(n | 0, U() | 0, o & 2097151 | 0, 0) | 0;
 n = U() | 0;
 p = q & 2097151;
 l = eg(o | 0, n | 0, 21) | 0;
 m = $f(l | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 l = U() | 0;
 k = eg(m | 0, l | 0, 21) | 0;
 j = $f(k | 0, U() | 0, j & 2097151 | 0, 0) | 0;
 k = U() | 0;
 h = eg(j | 0, k | 0, 21) | 0;
 g = $f(h | 0, U() | 0, g & 2097151 | 0, 0) | 0;
 h = U() | 0;
 i = j & 2097151;
 f = eg(g | 0, h | 0, 21) | 0;
 e = $f(f | 0, U() | 0, e & 2097151 | 0, 0) | 0;
 f = U() | 0;
 c = g & 2097151;
 a[b >> 0] = I;
 J = fg(I | 0, H | 0, 8) | 0;
 U() | 0;
 a[b + 1 >> 0] = J;
 H = fg(I | 0, H | 0, 16) | 0;
 U() | 0;
 I = gg(E | 0, 0, 5) | 0;
 U() | 0;
 a[b + 2 >> 0] = I | H & 31;
 H = fg(F | 0, G | 0, 3) | 0;
 U() | 0;
 a[b + 3 >> 0] = H;
 G = fg(F | 0, G | 0, 11) | 0;
 U() | 0;
 a[b + 4 >> 0] = G;
 E = fg(E | 0, 0, 19) | 0;
 G = U() | 0;
 F = gg(B | 0, 0, 2) | 0;
 U() | 0 | G;
 a[b + 5 >> 0] = F | E;
 D = fg(C | 0, D | 0, 6) | 0;
 U() | 0;
 a[b + 6 >> 0] = D;
 B = fg(B | 0, 0, 14) | 0;
 D = U() | 0;
 C = gg(y | 0, 0, 7) | 0;
 U() | 0 | D;
 a[b + 7 >> 0] = C | B;
 B = fg(z | 0, A | 0, 1) | 0;
 U() | 0;
 a[b + 8 >> 0] = B;
 A = fg(z | 0, A | 0, 9) | 0;
 U() | 0;
 a[b + 9 >> 0] = A;
 y = fg(y | 0, 0, 17) | 0;
 A = U() | 0;
 z = gg(v | 0, 0, 4) | 0;
 U() | 0 | A;
 a[b + 10 >> 0] = z | y;
 y = fg(w | 0, x | 0, 4) | 0;
 U() | 0;
 a[b + 11 >> 0] = y;
 x = fg(w | 0, x | 0, 12) | 0;
 U() | 0;
 a[b + 12 >> 0] = x;
 v = fg(v | 0, 0, 20) | 0;
 x = U() | 0;
 w = gg(s | 0, 0, 1) | 0;
 U() | 0 | x;
 a[b + 13 >> 0] = w | v;
 u = fg(t | 0, u | 0, 7) | 0;
 U() | 0;
 a[b + 14 >> 0] = u;
 s = fg(s | 0, 0, 15) | 0;
 u = U() | 0;
 t = gg(p | 0, 0, 6) | 0;
 U() | 0 | u;
 a[b + 15 >> 0] = t | s;
 s = fg(q | 0, r | 0, 2) | 0;
 U() | 0;
 a[b + 16 >> 0] = s;
 r = fg(q | 0, r | 0, 10) | 0;
 U() | 0;
 a[b + 17 >> 0] = r;
 p = fg(p | 0, 0, 18) | 0;
 r = U() | 0;
 q = gg(o | 0, n | 0, 3) | 0;
 U() | 0 | r;
 a[b + 18 >> 0] = q | p;
 p = fg(o | 0, n | 0, 5) | 0;
 U() | 0;
 a[b + 19 >> 0] = p;
 n = fg(o | 0, n | 0, 13) | 0;
 U() | 0;
 a[b + 20 >> 0] = n;
 a[b + 21 >> 0] = m;
 n = fg(m | 0, l | 0, 8) | 0;
 U() | 0;
 a[b + 22 >> 0] = n;
 l = fg(m | 0, l | 0, 16) | 0;
 U() | 0;
 m = gg(i | 0, 0, 5) | 0;
 U() | 0;
 a[b + 23 >> 0] = m | l & 31;
 l = fg(j | 0, k | 0, 3) | 0;
 U() | 0;
 a[b + 24 >> 0] = l;
 k = fg(j | 0, k | 0, 11) | 0;
 U() | 0;
 a[b + 25 >> 0] = k;
 i = fg(i | 0, 0, 19) | 0;
 k = U() | 0;
 j = gg(c | 0, 0, 2) | 0;
 U() | 0 | k;
 a[b + 26 >> 0] = j | i;
 h = fg(g | 0, h | 0, 6) | 0;
 U() | 0;
 a[b + 27 >> 0] = h;
 c = fg(c | 0, 0, 14) | 0;
 h = U() | 0;
 g = gg(e | 0, f | 0, 7) | 0;
 U() | 0 | h;
 a[b + 28 >> 0] = g | c;
 c = fg(e | 0, f | 0, 1) | 0;
 U() | 0;
 a[b + 29 >> 0] = c;
 c = fg(e | 0, f | 0, 9) | 0;
 U() | 0;
 a[b + 30 >> 0] = c;
 f = eg(e | 0, f | 0, 17) | 0;
 U() | 0;
 a[b + 31 >> 0] = f;
 return;
}

function Ac(b, e, f) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0, hb = 0, ib = 0, jb = 0, kb = 0, lb = 0, mb = 0, nb = 0, ob = 0, pb = 0, qb = 0, rb = 0, sb = 0, tb = 0, ub = 0, vb = 0, wb = 0, xb = 0, yb = 0, zb = 0, Ab = 0, Bb = 0, Cb = 0, Db = 0, Eb = 0, Fb = 0, Gb = 0, Hb = 0, Ib = 0, Jb = 0, Kb = 0, Lb = 0, Mb = 0, Nb = 0, Ob = 0, Pb = 0, Qb = 0, Rb = 0, Sb = 0, Tb = 0, Ub = 0, Vb = 0, Wb = 0, Xb = 0, Yb = 0, Zb = 0, _b = 0, $b = 0, ac = 0, bc = 0, cc = 0, fc = 0, ic = 0, jc = 0, kc = 0, lc = 0, mc = 0, nc = 0, oc = 0, pc = 0, qc = 0, rc = 0, sc = 0, tc = 0, uc = 0, vc = 0, wc = 0, xc = 0, yc = 0, zc = 0, Ac = 0, Bc = 0, Cc = 0, Dc = 0, Ec = 0, Fc = 0, Gc = 0, Hc = 0, Ic = 0, Jc = 0, Kc = 0, Lc = 0, Mc = 0, Nc = 0, Oc = 0, Pc = 0, Qc = 0, Rc = 0, Sc = 0, Tc = 0, Uc = 0, Vc = 0, Wc = 0, Xc = 0, Yc = 0, Zc = 0, _c = 0, $c = 0, ad = 0, bd = 0, cd = 0, dd = 0, ed = 0, fd = 0, gd = 0, hd = 0, id = 0, jd = 0, kd = 0, ld = 0, md = 0, nd = 0, od = 0, pd = 0, qd = 0, rd = 0, sd = 0, td = 0, ud = 0, vd = 0, wd = 0, xd = 0, yd = 0, zd = 0, Ad = 0, Bd = 0, Cd = 0, Dd = 0, Ed = 0, Fd = 0, Gd = 0, Hd = 0, Id = 0, Jd = 0, Kd = 0, Ld = 0, Md = 0, Nd = 0, Od = 0, Pd = 0, Qd = 0, Rd = 0, Sd = 0, Td = 0, Ud = 0, Vd = 0, Wd = 0, Xd = 0, Yd = 0, Zd = 0, _d = 0, $d = 0, ae = 0, be = 0, ce = 0, de = 0, ee = 0, fe = 0, ge = 0, he = 0, ie = 0, je = 0, ke = 0, le = 0, me = 0, ne = 0, oe = 0, pe = 0, qe = 0, re = 0, se = 0, te = 0, ue = 0, ve = 0, we = 0, xe = 0, ye = 0, ze = 0, Ae = 0, Be = 0, Ce = 0, De = 0, Ee = 0, Fe = 0, Ge = 0, He = 0, Ie = 0, Je = 0, Ke = 0, Le = 0, Me = 0, Ne = 0, Oe = 0, Pe = 0, Qe = 0, Re = 0, Se = 0, Te = 0, Ue = 0, Ve = 0, We = 0, Xe = 0, Ye = 0, Ze = 0, _e = 0, $e = 0, af = 0, bf = 0, cf = 0, df = 0, ef = 0, ff = 0, gf = 0, hf = 0, jf = 0, kf = 0, lf = 0, mf = 0, nf = 0, of = 0, pf = 0, qf = 0, rf = 0, sf = 0, tf = 0, uf = 0, vf = 0, wf = 0, xf = 0, yf = 0, zf = 0, Af = 0, Bf = 0, Cf = 0, Df = 0, Ef = 0, Ff = 0, Gf = 0, Hf = 0, If = 0, Jf = 0, Kf = 0, Lf = 0, Mf = 0, Nf = 0, Of = 0, Pf = 0, Qf = 0, Rf = 0, Sf = 0, Tf = 0, Uf = 0, Vf = 0, Wf = 0, Xf = 0, Yf = 0, Zf = 0, _f = 0, $f = 0, ag = 0, bg = 0, cg = 0, dg = 0, eg = 0, fg = 0, gg = 0, hg = 0, ig = 0, jg = 0, kg = 0, lg = 0, mg = 0, ng = 0, og = 0, pg = 0, qg = 0, rg = 0, sg = 0, tg = 0, ug = 0, vg = 0, wg = 0, xg = 0, yg = 0, zg = 0, Ag = 0, Bg = 0, Cg = 0, Dg = 0, Eg = 0, Fg = 0, Gg = 0, Hg = 0, Ig = 0, Jg = 0, Kg = 0, Lg = 0, Mg = 0, Ng = 0, Og = 0, Pg = 0, Qg = 0, Rg = 0, Sg = 0, Tg = 0, Ug = 0, Vg = 0, Wg = 0, Xg = 0, Yg = 0, Zg = 0, _g = 0, $g = 0, ah = 0, bh = 0, ch = 0, dh = 0, eh = 0, fh = 0, gh = 0, hh = 0, ih = 0, jh = 0, kh = 0, lh = 0, mh = 0, nh = 0, oh = 0, ph = 0;
 ph = k;
 k = k + 1824 | 0;
 kh = ph + 1280 | 0;
 lh = ph;
 mh = ph + 1664 | 0;
 nh = ph + 1504 | 0;
 oh = ph + 1344 | 0;
 g = 0;
 h = 0;
 do {
  gh = g + (d[e + h >> 0] | 0) | 0;
  ih = gh + 8 | 0;
  hh = ih >> 4;
  jh = h << 1;
  a[kh + jh >> 0] = gh - (ih & 240);
  ih = hh + 8 | 0;
  g = ih >> 4;
  a[kh + (jh | 1) >> 0] = hh - (ih & 240);
  h = h + 1 | 0;
 } while ((h | 0) != 31);
 fh = g + (d[e + 31 >> 0] | 0) | 0;
 eh = fh + 8 | 0;
 a[kh + 62 >> 0] = fh - (eh & 240);
 a[kh + 63 >> 0] = eh >>> 4;
 gc(lh, f);
 eh = mh + 120 | 0;
 fh = nh + 40 | 0;
 gh = mh + 40 | 0;
 hh = mh + 80 | 0;
 ih = nh + 80 | 0;
 jh = nh + 120 | 0;
 dc(mh, f, lh);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 160 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 320 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 480 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 640 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 800 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 h = lh + 960 | 0;
 gc(h, nh);
 dc(mh, f, h);
 ec(nh, mh, eh);
 ec(fh, gh, hh);
 ec(ih, hh, eh);
 ec(jh, mh, gh);
 gc(lh + 1120 | 0, nh);
 h = b;
 e = h + 40 | 0;
 do {
  c[h >> 2] = 0;
  h = h + 4 | 0;
 } while ((h | 0) < (e | 0));
 mg = b + 40 | 0;
 c[mg >> 2] = 1;
 h = b + 44 | 0;
 e = h + 36 | 0;
 do {
  c[h >> 2] = 0;
  h = h + 4 | 0;
 } while ((h | 0) < (e | 0));
 ng = b + 80 | 0;
 c[ng >> 2] = 1;
 h = b + 84 | 0;
 e = h + 36 | 0;
 do {
  c[h >> 2] = 0;
  h = h + 4 | 0;
 } while ((h | 0) < (e | 0));
 og = oh + 4 | 0;
 pg = oh + 40 | 0;
 qg = oh + 44 | 0;
 rg = oh + 80 | 0;
 sg = oh + 84 | 0;
 tg = oh + 8 | 0;
 ug = oh + 12 | 0;
 vg = oh + 16 | 0;
 wg = oh + 20 | 0;
 xg = oh + 24 | 0;
 yg = oh + 28 | 0;
 zg = oh + 32 | 0;
 Ag = oh + 36 | 0;
 Bg = lh + 36 | 0;
 Cg = lh + 32 | 0;
 Dg = lh + 28 | 0;
 Eg = lh + 24 | 0;
 Fg = lh + 20 | 0;
 Gg = lh + 16 | 0;
 Hg = lh + 12 | 0;
 Ig = lh + 8 | 0;
 Jg = lh + 4 | 0;
 Kg = lh + 40 | 0;
 Lg = oh + 48 | 0;
 Mg = oh + 52 | 0;
 Ng = oh + 56 | 0;
 Og = oh + 60 | 0;
 Pg = oh + 64 | 0;
 Qg = oh + 68 | 0;
 Rg = oh + 72 | 0;
 Sg = oh + 76 | 0;
 Tg = lh + 76 | 0;
 Ug = lh + 72 | 0;
 Vg = lh + 68 | 0;
 Wg = lh + 64 | 0;
 Xg = lh + 60 | 0;
 Yg = lh + 56 | 0;
 Zg = lh + 52 | 0;
 _g = lh + 48 | 0;
 $g = lh + 44 | 0;
 ah = lh + 80 | 0;
 bh = oh + 88 | 0;
 ch = oh + 92 | 0;
 dh = oh + 96 | 0;
 pa = oh + 100 | 0;
 qa = oh + 104 | 0;
 ra = oh + 108 | 0;
 sa = oh + 112 | 0;
 ta = oh + 116 | 0;
 ua = lh + 116 | 0;
 va = lh + 112 | 0;
 wa = lh + 108 | 0;
 xa = lh + 104 | 0;
 ya = lh + 100 | 0;
 za = lh + 96 | 0;
 Aa = lh + 92 | 0;
 Ba = lh + 88 | 0;
 Ca = lh + 84 | 0;
 Da = oh + 120 | 0;
 Ea = lh + 120 | 0;
 Fa = oh + 124 | 0;
 Ga = oh + 128 | 0;
 Ha = oh + 132 | 0;
 Ia = oh + 136 | 0;
 Ja = oh + 140 | 0;
 Ka = oh + 144 | 0;
 La = oh + 148 | 0;
 Ma = oh + 152 | 0;
 Na = oh + 156 | 0;
 Oa = lh + 156 | 0;
 Pa = lh + 152 | 0;
 Qa = lh + 148 | 0;
 Ra = lh + 144 | 0;
 Sa = lh + 140 | 0;
 Ta = lh + 136 | 0;
 Ua = lh + 132 | 0;
 Va = lh + 128 | 0;
 Wa = lh + 124 | 0;
 Xa = lh + 160 | 0;
 Ya = lh + 196 | 0;
 Za = lh + 192 | 0;
 _a = lh + 188 | 0;
 $a = lh + 184 | 0;
 ab = lh + 180 | 0;
 bb = lh + 176 | 0;
 cb = lh + 172 | 0;
 db = lh + 168 | 0;
 eb = lh + 164 | 0;
 fb = lh + 200 | 0;
 gb = lh + 236 | 0;
 hb = lh + 232 | 0;
 ib = lh + 228 | 0;
 jb = lh + 224 | 0;
 kb = lh + 220 | 0;
 lb = lh + 216 | 0;
 mb = lh + 212 | 0;
 nb = lh + 208 | 0;
 ob = lh + 204 | 0;
 pb = lh + 240 | 0;
 qb = lh + 276 | 0;
 rb = lh + 272 | 0;
 sb = lh + 268 | 0;
 tb = lh + 264 | 0;
 ub = lh + 260 | 0;
 vb = lh + 256 | 0;
 wb = lh + 252 | 0;
 xb = lh + 248 | 0;
 yb = lh + 244 | 0;
 zb = lh + 280 | 0;
 Ab = lh + 316 | 0;
 Bb = lh + 312 | 0;
 Cb = lh + 308 | 0;
 Db = lh + 304 | 0;
 Eb = lh + 300 | 0;
 Fb = lh + 296 | 0;
 Gb = lh + 292 | 0;
 Hb = lh + 288 | 0;
 Ib = lh + 284 | 0;
 Jb = lh + 320 | 0;
 Kb = lh + 356 | 0;
 Lb = lh + 352 | 0;
 Mb = lh + 348 | 0;
 Nb = lh + 344 | 0;
 Ob = lh + 340 | 0;
 Pb = lh + 336 | 0;
 Qb = lh + 332 | 0;
 Rb = lh + 328 | 0;
 Sb = lh + 324 | 0;
 Tb = lh + 360 | 0;
 Ub = lh + 396 | 0;
 Vb = lh + 392 | 0;
 Wb = lh + 388 | 0;
 Xb = lh + 384 | 0;
 Yb = lh + 380 | 0;
 Zb = lh + 376 | 0;
 _b = lh + 372 | 0;
 $b = lh + 368 | 0;
 ac = lh + 364 | 0;
 bc = lh + 400 | 0;
 cc = lh + 436 | 0;
 fc = lh + 432 | 0;
 ic = lh + 428 | 0;
 jc = lh + 424 | 0;
 kc = lh + 420 | 0;
 lc = lh + 416 | 0;
 mc = lh + 412 | 0;
 nc = lh + 408 | 0;
 oc = lh + 404 | 0;
 pc = lh + 440 | 0;
 qc = lh + 476 | 0;
 rc = lh + 472 | 0;
 sc = lh + 468 | 0;
 tc = lh + 464 | 0;
 uc = lh + 460 | 0;
 vc = lh + 456 | 0;
 wc = lh + 452 | 0;
 xc = lh + 448 | 0;
 yc = lh + 444 | 0;
 zc = lh + 480 | 0;
 Ac = lh + 516 | 0;
 Bc = lh + 512 | 0;
 Cc = lh + 508 | 0;
 Dc = lh + 504 | 0;
 Ec = lh + 500 | 0;
 Fc = lh + 496 | 0;
 Gc = lh + 492 | 0;
 Hc = lh + 488 | 0;
 Ic = lh + 484 | 0;
 Jc = lh + 520 | 0;
 Kc = lh + 556 | 0;
 Lc = lh + 552 | 0;
 Mc = lh + 548 | 0;
 Nc = lh + 544 | 0;
 Oc = lh + 540 | 0;
 Pc = lh + 536 | 0;
 Qc = lh + 532 | 0;
 Rc = lh + 528 | 0;
 Sc = lh + 524 | 0;
 Tc = lh + 560 | 0;
 Uc = lh + 596 | 0;
 Vc = lh + 592 | 0;
 Wc = lh + 588 | 0;
 Xc = lh + 584 | 0;
 Yc = lh + 580 | 0;
 Zc = lh + 576 | 0;
 _c = lh + 572 | 0;
 $c = lh + 568 | 0;
 ad = lh + 564 | 0;
 bd = lh + 600 | 0;
 cd = lh + 636 | 0;
 dd = lh + 632 | 0;
 ed = lh + 628 | 0;
 fd = lh + 624 | 0;
 gd = lh + 620 | 0;
 hd = lh + 616 | 0;
 id = lh + 612 | 0;
 jd = lh + 608 | 0;
 kd = lh + 604 | 0;
 ld = lh + 640 | 0;
 md = lh + 676 | 0;
 nd = lh + 672 | 0;
 od = lh + 668 | 0;
 pd = lh + 664 | 0;
 qd = lh + 660 | 0;
 rd = lh + 656 | 0;
 sd = lh + 652 | 0;
 td = lh + 648 | 0;
 ud = lh + 644 | 0;
 vd = lh + 680 | 0;
 wd = lh + 716 | 0;
 xd = lh + 712 | 0;
 yd = lh + 708 | 0;
 zd = lh + 704 | 0;
 Ad = lh + 700 | 0;
 Bd = lh + 696 | 0;
 Cd = lh + 692 | 0;
 Dd = lh + 688 | 0;
 Ed = lh + 684 | 0;
 Fd = lh + 720 | 0;
 Gd = lh + 756 | 0;
 Hd = lh + 752 | 0;
 Id = lh + 748 | 0;
 Jd = lh + 744 | 0;
 Kd = lh + 740 | 0;
 Ld = lh + 736 | 0;
 Md = lh + 732 | 0;
 Nd = lh + 728 | 0;
 Od = lh + 724 | 0;
 Pd = lh + 760 | 0;
 Qd = lh + 796 | 0;
 Rd = lh + 792 | 0;
 Sd = lh + 788 | 0;
 Td = lh + 784 | 0;
 Ud = lh + 780 | 0;
 Vd = lh + 776 | 0;
 Wd = lh + 772 | 0;
 Xd = lh + 768 | 0;
 Yd = lh + 764 | 0;
 Zd = lh + 800 | 0;
 _d = lh + 836 | 0;
 $d = lh + 832 | 0;
 ae = lh + 828 | 0;
 be = lh + 824 | 0;
 ce = lh + 820 | 0;
 de = lh + 816 | 0;
 ee = lh + 812 | 0;
 fe = lh + 808 | 0;
 ge = lh + 804 | 0;
 he = lh + 840 | 0;
 ie = lh + 876 | 0;
 je = lh + 872 | 0;
 ke = lh + 868 | 0;
 le = lh + 864 | 0;
 me = lh + 860 | 0;
 ne = lh + 856 | 0;
 oe = lh + 852 | 0;
 pe = lh + 848 | 0;
 qe = lh + 844 | 0;
 re = lh + 880 | 0;
 se = lh + 916 | 0;
 te = lh + 912 | 0;
 ue = lh + 908 | 0;
 ve = lh + 904 | 0;
 we = lh + 900 | 0;
 xe = lh + 896 | 0;
 ye = lh + 892 | 0;
 ze = lh + 888 | 0;
 Ae = lh + 884 | 0;
 Be = lh + 920 | 0;
 Ce = lh + 956 | 0;
 De = lh + 952 | 0;
 Ee = lh + 948 | 0;
 Fe = lh + 944 | 0;
 Ge = lh + 940 | 0;
 He = lh + 936 | 0;
 Ie = lh + 932 | 0;
 Je = lh + 928 | 0;
 Ke = lh + 924 | 0;
 Le = lh + 960 | 0;
 Me = lh + 996 | 0;
 Ne = lh + 992 | 0;
 Oe = lh + 988 | 0;
 Pe = lh + 984 | 0;
 Qe = lh + 980 | 0;
 Re = lh + 976 | 0;
 Se = lh + 972 | 0;
 Te = lh + 968 | 0;
 Ue = lh + 964 | 0;
 Ve = lh + 1e3 | 0;
 We = lh + 1036 | 0;
 Xe = lh + 1032 | 0;
 Ye = lh + 1028 | 0;
 Ze = lh + 1024 | 0;
 _e = lh + 1020 | 0;
 $e = lh + 1016 | 0;
 af = lh + 1012 | 0;
 bf = lh + 1008 | 0;
 cf = lh + 1004 | 0;
 df = lh + 1040 | 0;
 ef = lh + 1076 | 0;
 ff = lh + 1072 | 0;
 gf = lh + 1068 | 0;
 hf = lh + 1064 | 0;
 jf = lh + 1060 | 0;
 kf = lh + 1056 | 0;
 lf = lh + 1052 | 0;
 mf = lh + 1048 | 0;
 nf = lh + 1044 | 0;
 of = lh + 1080 | 0;
 pf = lh + 1116 | 0;
 qf = lh + 1112 | 0;
 rf = lh + 1108 | 0;
 sf = lh + 1104 | 0;
 tf = lh + 1100 | 0;
 uf = lh + 1096 | 0;
 vf = lh + 1092 | 0;
 wf = lh + 1088 | 0;
 xf = lh + 1084 | 0;
 yf = lh + 1120 | 0;
 zf = lh + 1156 | 0;
 Af = lh + 1152 | 0;
 Bf = lh + 1148 | 0;
 Cf = lh + 1144 | 0;
 Df = lh + 1140 | 0;
 Ef = lh + 1136 | 0;
 Ff = lh + 1132 | 0;
 Gf = lh + 1128 | 0;
 Hf = lh + 1124 | 0;
 If = lh + 1160 | 0;
 Jf = lh + 1196 | 0;
 Kf = lh + 1192 | 0;
 Lf = lh + 1188 | 0;
 Mf = lh + 1184 | 0;
 Nf = lh + 1180 | 0;
 Of = lh + 1176 | 0;
 Pf = lh + 1172 | 0;
 Qf = lh + 1168 | 0;
 Rf = lh + 1164 | 0;
 Sf = lh + 1200 | 0;
 Tf = lh + 1236 | 0;
 Uf = lh + 1232 | 0;
 Vf = lh + 1228 | 0;
 Wf = lh + 1224 | 0;
 Xf = lh + 1220 | 0;
 Yf = lh + 1216 | 0;
 Zf = lh + 1212 | 0;
 _f = lh + 1208 | 0;
 $f = lh + 1204 | 0;
 ag = lh + 1240 | 0;
 bg = lh + 1276 | 0;
 cg = lh + 1272 | 0;
 dg = lh + 1268 | 0;
 eg = lh + 1264 | 0;
 fg = lh + 1260 | 0;
 gg = lh + 1256 | 0;
 hg = lh + 1252 | 0;
 ig = lh + 1248 | 0;
 jg = lh + 1244 | 0;
 oa = 63;
 while (1) {
  kg = a[kh + oa >> 0] | 0;
  g = kg << 24 >> 24;
  kg = (kg & 255) >>> 7 & 255;
  lg = 0 - kg | 0;
  g = g - ((lg & g) << 1) | 0;
  hc(mh, b);
  ec(b, mh, eh);
  ec(mg, gh, hh);
  ec(ng, hh, eh);
  hc(mh, b);
  ec(b, mh, eh);
  ec(mg, gh, hh);
  ec(ng, hh, eh);
  hc(mh, b);
  ec(b, mh, eh);
  ec(mg, gh, hh);
  ec(ng, hh, eh);
  hc(mh, b);
  ec(nh, mh, eh);
  ec(fh, gh, hh);
  ec(ih, hh, eh);
  ec(jh, mh, gh);
  c[oh >> 2] = 1;
  h = og;
  e = h + 36 | 0;
  do {
   c[h >> 2] = 0;
   h = h + 4 | 0;
  } while ((h | 0) < (e | 0));
  c[pg >> 2] = 1;
  h = qg;
  e = h + 36 | 0;
  do {
   c[h >> 2] = 0;
   h = h + 4 | 0;
  } while ((h | 0) < (e | 0));
  c[rg >> 2] = 1;
  h = sg;
  e = h + 76 | 0;
  do {
   c[h >> 2] = 0;
   h = h + 4 | 0;
  } while ((h | 0) < (e | 0));
  na = g & 255;
  g = (na ^ 1) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 5;
   break;
  }
  e = c[Jg >> 2] & g;
  f = c[Ig >> 2] & g;
  i = c[Hg >> 2] & g;
  j = c[Gg >> 2] & g;
  l = c[Fg >> 2] & g;
  m = c[Eg >> 2] & g;
  n = c[Dg >> 2] & g;
  o = c[Cg >> 2] & g;
  p = c[Bg >> 2] & g;
  h = (c[lh >> 2] ^ 1) & g ^ 1;
  c[oh >> 2] = h;
  c[og >> 2] = e;
  c[tg >> 2] = f;
  c[ug >> 2] = i;
  c[vg >> 2] = j;
  c[wg >> 2] = l;
  c[xg >> 2] = m;
  c[yg >> 2] = n;
  c[zg >> 2] = o;
  c[Ag >> 2] = p;
  r = c[$g >> 2] & g;
  s = c[_g >> 2] & g;
  t = c[Zg >> 2] & g;
  u = c[Yg >> 2] & g;
  v = c[Xg >> 2] & g;
  w = c[Wg >> 2] & g;
  x = c[Vg >> 2] & g;
  y = c[Ug >> 2] & g;
  z = c[Tg >> 2] & g;
  q = (c[Kg >> 2] ^ 1) & g ^ 1;
  c[pg >> 2] = q;
  c[qg >> 2] = r;
  c[Lg >> 2] = s;
  c[Mg >> 2] = t;
  c[Ng >> 2] = u;
  c[Og >> 2] = v;
  c[Pg >> 2] = w;
  c[Qg >> 2] = x;
  c[Rg >> 2] = y;
  c[Sg >> 2] = z;
  B = c[Ca >> 2] & g;
  C = c[Ba >> 2] & g;
  D = c[Aa >> 2] & g;
  E = c[za >> 2] & g;
  F = c[ya >> 2] & g;
  G = c[xa >> 2] & g;
  H = c[wa >> 2] & g;
  I = c[va >> 2] & g;
  J = c[ua >> 2] & g;
  A = (c[ah >> 2] ^ 1) & g ^ 1;
  c[rg >> 2] = A;
  c[sg >> 2] = B;
  c[bh >> 2] = C;
  c[ch >> 2] = D;
  c[dh >> 2] = E;
  c[pa >> 2] = F;
  c[qa >> 2] = G;
  c[ra >> 2] = H;
  c[sa >> 2] = I;
  c[ta >> 2] = J;
  K = c[Ea >> 2] & g;
  L = c[Wa >> 2] & g;
  M = c[Va >> 2] & g;
  N = c[Ua >> 2] & g;
  O = c[Ta >> 2] & g;
  P = c[Sa >> 2] & g;
  Q = c[Ra >> 2] & g;
  R = c[Qa >> 2] & g;
  S = c[Pa >> 2] & g;
  T = c[Oa >> 2] & g;
  c[Da >> 2] = K;
  c[Fa >> 2] = L;
  c[Ga >> 2] = M;
  c[Ha >> 2] = N;
  c[Ia >> 2] = O;
  c[Ja >> 2] = P;
  c[Ka >> 2] = Q;
  c[La >> 2] = R;
  c[Ma >> 2] = S;
  c[Na >> 2] = T;
  g = (na ^ 2) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 7;
   break;
  }
  V = (c[eb >> 2] ^ e) & g;
  W = (c[db >> 2] ^ f) & g;
  X = (c[cb >> 2] ^ i) & g;
  Y = (c[bb >> 2] ^ j) & g;
  Z = (c[ab >> 2] ^ l) & g;
  _ = (c[$a >> 2] ^ m) & g;
  $ = (c[_a >> 2] ^ n) & g;
  aa = (c[Za >> 2] ^ o) & g;
  ba = (c[Ya >> 2] ^ p) & g;
  U = (c[Xa >> 2] ^ h) & g ^ h;
  c[oh >> 2] = U;
  V = V ^ e;
  c[og >> 2] = V;
  W = W ^ f;
  c[tg >> 2] = W;
  X = X ^ i;
  c[ug >> 2] = X;
  Y = Y ^ j;
  c[vg >> 2] = Y;
  Z = Z ^ l;
  c[wg >> 2] = Z;
  _ = _ ^ m;
  c[xg >> 2] = _;
  $ = $ ^ n;
  c[yg >> 2] = $;
  aa = aa ^ o;
  c[zg >> 2] = aa;
  ba = ba ^ p;
  c[Ag >> 2] = ba;
  e = (c[ob >> 2] ^ r) & g;
  f = (c[nb >> 2] ^ s) & g;
  i = (c[mb >> 2] ^ t) & g;
  j = (c[lb >> 2] ^ u) & g;
  l = (c[kb >> 2] ^ v) & g;
  m = (c[jb >> 2] ^ w) & g;
  n = (c[ib >> 2] ^ x) & g;
  o = (c[hb >> 2] ^ y) & g;
  p = (c[gb >> 2] ^ z) & g;
  q = (c[fb >> 2] ^ q) & g ^ q;
  c[pg >> 2] = q;
  r = e ^ r;
  c[qg >> 2] = r;
  s = f ^ s;
  c[Lg >> 2] = s;
  t = i ^ t;
  c[Mg >> 2] = t;
  u = j ^ u;
  c[Ng >> 2] = u;
  v = l ^ v;
  c[Og >> 2] = v;
  w = m ^ w;
  c[Pg >> 2] = w;
  x = n ^ x;
  c[Qg >> 2] = x;
  y = o ^ y;
  c[Rg >> 2] = y;
  z = p ^ z;
  c[Sg >> 2] = z;
  p = (c[yb >> 2] ^ B) & g;
  o = (c[xb >> 2] ^ C) & g;
  n = (c[wb >> 2] ^ D) & g;
  m = (c[vb >> 2] ^ E) & g;
  l = (c[ub >> 2] ^ F) & g;
  j = (c[tb >> 2] ^ G) & g;
  i = (c[sb >> 2] ^ H) & g;
  f = (c[rb >> 2] ^ I) & g;
  e = (c[qb >> 2] ^ J) & g;
  A = (c[pb >> 2] ^ A) & g ^ A;
  c[rg >> 2] = A;
  B = p ^ B;
  c[sg >> 2] = B;
  C = o ^ C;
  c[bh >> 2] = C;
  D = n ^ D;
  c[ch >> 2] = D;
  E = m ^ E;
  c[dh >> 2] = E;
  F = l ^ F;
  c[pa >> 2] = F;
  G = j ^ G;
  c[qa >> 2] = G;
  H = i ^ H;
  c[ra >> 2] = H;
  I = f ^ I;
  c[sa >> 2] = I;
  J = e ^ J;
  c[ta >> 2] = J;
  e = (c[Ib >> 2] ^ L) & g;
  f = (c[Hb >> 2] ^ M) & g;
  i = (c[Gb >> 2] ^ N) & g;
  j = (c[Fb >> 2] ^ O) & g;
  l = (c[Eb >> 2] ^ P) & g;
  m = (c[Db >> 2] ^ Q) & g;
  n = (c[Cb >> 2] ^ R) & g;
  o = (c[Bb >> 2] ^ S) & g;
  p = (c[Ab >> 2] ^ T) & g;
  h = (c[zb >> 2] ^ K) & g ^ K;
  c[Da >> 2] = h;
  e = e ^ L;
  c[Fa >> 2] = e;
  f = f ^ M;
  c[Ga >> 2] = f;
  i = i ^ N;
  c[Ha >> 2] = i;
  j = j ^ O;
  c[Ia >> 2] = j;
  l = l ^ P;
  c[Ja >> 2] = l;
  m = m ^ Q;
  c[Ka >> 2] = m;
  n = n ^ R;
  c[La >> 2] = n;
  o = o ^ S;
  c[Ma >> 2] = o;
  p = p ^ T;
  c[Na >> 2] = p;
  g = (na ^ 3) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 9;
   break;
  }
  L = (c[Sb >> 2] ^ V) & g;
  M = (c[Rb >> 2] ^ W) & g;
  N = (c[Qb >> 2] ^ X) & g;
  O = (c[Pb >> 2] ^ Y) & g;
  P = (c[Ob >> 2] ^ Z) & g;
  Q = (c[Nb >> 2] ^ _) & g;
  R = (c[Mb >> 2] ^ $) & g;
  S = (c[Lb >> 2] ^ aa) & g;
  T = (c[Kb >> 2] ^ ba) & g;
  K = (c[Jb >> 2] ^ U) & g ^ U;
  c[oh >> 2] = K;
  L = L ^ V;
  c[og >> 2] = L;
  M = M ^ W;
  c[tg >> 2] = M;
  N = N ^ X;
  c[ug >> 2] = N;
  O = O ^ Y;
  c[vg >> 2] = O;
  P = P ^ Z;
  c[wg >> 2] = P;
  Q = Q ^ _;
  c[xg >> 2] = Q;
  R = R ^ $;
  c[yg >> 2] = R;
  S = S ^ aa;
  c[zg >> 2] = S;
  T = T ^ ba;
  c[Ag >> 2] = T;
  da = (c[ac >> 2] ^ r) & g;
  ea = (c[$b >> 2] ^ s) & g;
  fa = (c[_b >> 2] ^ t) & g;
  ga = (c[Zb >> 2] ^ u) & g;
  ia = (c[Yb >> 2] ^ v) & g;
  ja = (c[Xb >> 2] ^ w) & g;
  ka = (c[Wb >> 2] ^ x) & g;
  la = (c[Vb >> 2] ^ y) & g;
  ma = (c[Ub >> 2] ^ z) & g;
  q = (c[Tb >> 2] ^ q) & g ^ q;
  c[pg >> 2] = q;
  r = da ^ r;
  c[qg >> 2] = r;
  s = ea ^ s;
  c[Lg >> 2] = s;
  t = fa ^ t;
  c[Mg >> 2] = t;
  u = ga ^ u;
  c[Ng >> 2] = u;
  v = ia ^ v;
  c[Og >> 2] = v;
  w = ja ^ w;
  c[Pg >> 2] = w;
  x = ka ^ x;
  c[Qg >> 2] = x;
  y = la ^ y;
  c[Rg >> 2] = y;
  z = ma ^ z;
  c[Sg >> 2] = z;
  ma = (c[oc >> 2] ^ B) & g;
  la = (c[nc >> 2] ^ C) & g;
  ka = (c[mc >> 2] ^ D) & g;
  ja = (c[lc >> 2] ^ E) & g;
  ia = (c[kc >> 2] ^ F) & g;
  ga = (c[jc >> 2] ^ G) & g;
  fa = (c[ic >> 2] ^ H) & g;
  ea = (c[fc >> 2] ^ I) & g;
  da = (c[cc >> 2] ^ J) & g;
  A = (c[bc >> 2] ^ A) & g ^ A;
  c[rg >> 2] = A;
  B = ma ^ B;
  c[sg >> 2] = B;
  C = la ^ C;
  c[bh >> 2] = C;
  D = ka ^ D;
  c[ch >> 2] = D;
  E = ja ^ E;
  c[dh >> 2] = E;
  F = ia ^ F;
  c[pa >> 2] = F;
  G = ga ^ G;
  c[qa >> 2] = G;
  H = fa ^ H;
  c[ra >> 2] = H;
  I = ea ^ I;
  c[sa >> 2] = I;
  J = da ^ J;
  c[ta >> 2] = J;
  da = (c[yc >> 2] ^ e) & g;
  ea = (c[xc >> 2] ^ f) & g;
  fa = (c[wc >> 2] ^ i) & g;
  ga = (c[vc >> 2] ^ j) & g;
  ia = (c[uc >> 2] ^ l) & g;
  ja = (c[tc >> 2] ^ m) & g;
  ka = (c[sc >> 2] ^ n) & g;
  la = (c[rc >> 2] ^ o) & g;
  ma = (c[qc >> 2] ^ p) & g;
  h = (c[pc >> 2] ^ h) & g ^ h;
  c[Da >> 2] = h;
  e = da ^ e;
  c[Fa >> 2] = e;
  f = ea ^ f;
  c[Ga >> 2] = f;
  i = fa ^ i;
  c[Ha >> 2] = i;
  j = ga ^ j;
  c[Ia >> 2] = j;
  l = ia ^ l;
  c[Ja >> 2] = l;
  m = ja ^ m;
  c[Ka >> 2] = m;
  n = ka ^ n;
  c[La >> 2] = n;
  o = la ^ o;
  c[Ma >> 2] = o;
  p = ma ^ p;
  c[Na >> 2] = p;
  g = (na ^ 4) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 11;
   break;
  }
  ba = (c[Ic >> 2] ^ L) & g;
  aa = (c[Hc >> 2] ^ M) & g;
  $ = (c[Gc >> 2] ^ N) & g;
  _ = (c[Fc >> 2] ^ O) & g;
  Z = (c[Ec >> 2] ^ P) & g;
  Y = (c[Dc >> 2] ^ Q) & g;
  X = (c[Cc >> 2] ^ R) & g;
  W = (c[Bc >> 2] ^ S) & g;
  V = (c[Ac >> 2] ^ T) & g;
  K = (c[zc >> 2] ^ K) & g ^ K;
  c[oh >> 2] = K;
  L = ba ^ L;
  c[og >> 2] = L;
  M = aa ^ M;
  c[tg >> 2] = M;
  N = $ ^ N;
  c[ug >> 2] = N;
  O = _ ^ O;
  c[vg >> 2] = O;
  P = Z ^ P;
  c[wg >> 2] = P;
  Q = Y ^ Q;
  c[xg >> 2] = Q;
  R = X ^ R;
  c[yg >> 2] = R;
  S = W ^ S;
  c[zg >> 2] = S;
  T = V ^ T;
  c[Ag >> 2] = T;
  V = (c[Sc >> 2] ^ r) & g;
  W = (c[Rc >> 2] ^ s) & g;
  X = (c[Qc >> 2] ^ t) & g;
  Y = (c[Pc >> 2] ^ u) & g;
  Z = (c[Oc >> 2] ^ v) & g;
  _ = (c[Nc >> 2] ^ w) & g;
  $ = (c[Mc >> 2] ^ x) & g;
  aa = (c[Lc >> 2] ^ y) & g;
  ba = (c[Kc >> 2] ^ z) & g;
  U = (c[Jc >> 2] ^ q) & g ^ q;
  c[pg >> 2] = U;
  V = V ^ r;
  c[qg >> 2] = V;
  W = W ^ s;
  c[Lg >> 2] = W;
  X = X ^ t;
  c[Mg >> 2] = X;
  Y = Y ^ u;
  c[Ng >> 2] = Y;
  Z = Z ^ v;
  c[Og >> 2] = Z;
  _ = _ ^ w;
  c[Pg >> 2] = _;
  $ = $ ^ x;
  c[Qg >> 2] = $;
  aa = aa ^ y;
  c[Rg >> 2] = aa;
  ba = ba ^ z;
  c[Sg >> 2] = ba;
  da = (c[ad >> 2] ^ B) & g;
  ea = (c[$c >> 2] ^ C) & g;
  fa = (c[_c >> 2] ^ D) & g;
  ga = (c[Zc >> 2] ^ E) & g;
  ia = (c[Yc >> 2] ^ F) & g;
  ja = (c[Xc >> 2] ^ G) & g;
  ka = (c[Wc >> 2] ^ H) & g;
  la = (c[Vc >> 2] ^ I) & g;
  ma = (c[Uc >> 2] ^ J) & g;
  ca = (c[Tc >> 2] ^ A) & g ^ A;
  c[rg >> 2] = ca;
  da = da ^ B;
  c[sg >> 2] = da;
  ea = ea ^ C;
  c[bh >> 2] = ea;
  fa = fa ^ D;
  c[ch >> 2] = fa;
  ga = ga ^ E;
  c[dh >> 2] = ga;
  ia = ia ^ F;
  c[pa >> 2] = ia;
  ja = ja ^ G;
  c[qa >> 2] = ja;
  ka = ka ^ H;
  c[ra >> 2] = ka;
  la = la ^ I;
  c[sa >> 2] = la;
  ma = ma ^ J;
  c[ta >> 2] = ma;
  B = (c[kd >> 2] ^ e) & g;
  C = (c[jd >> 2] ^ f) & g;
  D = (c[id >> 2] ^ i) & g;
  E = (c[hd >> 2] ^ j) & g;
  F = (c[gd >> 2] ^ l) & g;
  G = (c[fd >> 2] ^ m) & g;
  H = (c[ed >> 2] ^ n) & g;
  I = (c[dd >> 2] ^ o) & g;
  J = (c[cd >> 2] ^ p) & g;
  h = (c[bd >> 2] ^ h) & g ^ h;
  c[Da >> 2] = h;
  e = B ^ e;
  c[Fa >> 2] = e;
  f = C ^ f;
  c[Ga >> 2] = f;
  i = D ^ i;
  c[Ha >> 2] = i;
  j = E ^ j;
  c[Ia >> 2] = j;
  l = F ^ l;
  c[Ja >> 2] = l;
  m = G ^ m;
  c[Ka >> 2] = m;
  n = H ^ n;
  c[La >> 2] = n;
  o = I ^ o;
  c[Ma >> 2] = o;
  p = J ^ p;
  c[Na >> 2] = p;
  g = (na ^ 5) + -1 | 0;
  J = g >>> 31;
  g = g >> 31;
  if ((J + -1 & ~J | (J | -2) & g | 0) != -1) {
   g = 13;
   break;
  }
  r = (c[ud >> 2] ^ L) & g;
  s = (c[td >> 2] ^ M) & g;
  t = (c[sd >> 2] ^ N) & g;
  u = (c[rd >> 2] ^ O) & g;
  v = (c[qd >> 2] ^ P) & g;
  w = (c[pd >> 2] ^ Q) & g;
  x = (c[od >> 2] ^ R) & g;
  y = (c[nd >> 2] ^ S) & g;
  z = (c[md >> 2] ^ T) & g;
  q = (c[ld >> 2] ^ K) & g ^ K;
  c[oh >> 2] = q;
  r = r ^ L;
  c[og >> 2] = r;
  s = s ^ M;
  c[tg >> 2] = s;
  t = t ^ N;
  c[ug >> 2] = t;
  u = u ^ O;
  c[vg >> 2] = u;
  v = v ^ P;
  c[wg >> 2] = v;
  w = w ^ Q;
  c[xg >> 2] = w;
  x = x ^ R;
  c[yg >> 2] = x;
  y = y ^ S;
  c[zg >> 2] = y;
  z = z ^ T;
  c[Ag >> 2] = z;
  B = (c[Ed >> 2] ^ V) & g;
  C = (c[Dd >> 2] ^ W) & g;
  D = (c[Cd >> 2] ^ X) & g;
  E = (c[Bd >> 2] ^ Y) & g;
  F = (c[Ad >> 2] ^ Z) & g;
  G = (c[zd >> 2] ^ _) & g;
  H = (c[yd >> 2] ^ $) & g;
  I = (c[xd >> 2] ^ aa) & g;
  J = (c[wd >> 2] ^ ba) & g;
  A = (c[vd >> 2] ^ U) & g ^ U;
  c[pg >> 2] = A;
  B = B ^ V;
  c[qg >> 2] = B;
  C = C ^ W;
  c[Lg >> 2] = C;
  D = D ^ X;
  c[Mg >> 2] = D;
  E = E ^ Y;
  c[Ng >> 2] = E;
  F = F ^ Z;
  c[Og >> 2] = F;
  G = G ^ _;
  c[Pg >> 2] = G;
  H = H ^ $;
  c[Qg >> 2] = H;
  I = I ^ aa;
  c[Rg >> 2] = I;
  J = J ^ ba;
  c[Sg >> 2] = J;
  L = (c[Od >> 2] ^ da) & g;
  M = (c[Nd >> 2] ^ ea) & g;
  N = (c[Md >> 2] ^ fa) & g;
  O = (c[Ld >> 2] ^ ga) & g;
  P = (c[Kd >> 2] ^ ia) & g;
  Q = (c[Jd >> 2] ^ ja) & g;
  R = (c[Id >> 2] ^ ka) & g;
  S = (c[Hd >> 2] ^ la) & g;
  T = (c[Gd >> 2] ^ ma) & g;
  K = (c[Fd >> 2] ^ ca) & g ^ ca;
  c[rg >> 2] = K;
  L = L ^ da;
  c[sg >> 2] = L;
  M = M ^ ea;
  c[bh >> 2] = M;
  N = N ^ fa;
  c[ch >> 2] = N;
  O = O ^ ga;
  c[dh >> 2] = O;
  P = P ^ ia;
  c[pa >> 2] = P;
  Q = Q ^ ja;
  c[qa >> 2] = Q;
  R = R ^ ka;
  c[ra >> 2] = R;
  S = S ^ la;
  c[sa >> 2] = S;
  T = T ^ ma;
  c[ta >> 2] = T;
  da = (c[Yd >> 2] ^ e) & g;
  ea = (c[Xd >> 2] ^ f) & g;
  fa = (c[Wd >> 2] ^ i) & g;
  ga = (c[Vd >> 2] ^ j) & g;
  ia = (c[Ud >> 2] ^ l) & g;
  ja = (c[Td >> 2] ^ m) & g;
  ka = (c[Sd >> 2] ^ n) & g;
  la = (c[Rd >> 2] ^ o) & g;
  ma = (c[Qd >> 2] ^ p) & g;
  h = (c[Pd >> 2] ^ h) & g ^ h;
  c[Da >> 2] = h;
  e = da ^ e;
  c[Fa >> 2] = e;
  f = ea ^ f;
  c[Ga >> 2] = f;
  i = fa ^ i;
  c[Ha >> 2] = i;
  j = ga ^ j;
  c[Ia >> 2] = j;
  l = ia ^ l;
  c[Ja >> 2] = l;
  m = ja ^ m;
  c[Ka >> 2] = m;
  n = ka ^ n;
  c[La >> 2] = n;
  o = la ^ o;
  c[Ma >> 2] = o;
  p = ma ^ p;
  c[Na >> 2] = p;
  g = (na ^ 6) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 15;
   break;
  }
  ma = (c[ge >> 2] ^ r) & g;
  la = (c[fe >> 2] ^ s) & g;
  ka = (c[ee >> 2] ^ t) & g;
  ja = (c[de >> 2] ^ u) & g;
  ia = (c[ce >> 2] ^ v) & g;
  ga = (c[be >> 2] ^ w) & g;
  fa = (c[ae >> 2] ^ x) & g;
  ea = (c[$d >> 2] ^ y) & g;
  da = (c[_d >> 2] ^ z) & g;
  q = (c[Zd >> 2] ^ q) & g ^ q;
  c[oh >> 2] = q;
  r = ma ^ r;
  c[og >> 2] = r;
  s = la ^ s;
  c[tg >> 2] = s;
  t = ka ^ t;
  c[ug >> 2] = t;
  u = ja ^ u;
  c[vg >> 2] = u;
  v = ia ^ v;
  c[wg >> 2] = v;
  w = ga ^ w;
  c[xg >> 2] = w;
  x = fa ^ x;
  c[yg >> 2] = x;
  y = ea ^ y;
  c[zg >> 2] = y;
  z = da ^ z;
  c[Ag >> 2] = z;
  da = (c[qe >> 2] ^ B) & g;
  ea = (c[pe >> 2] ^ C) & g;
  fa = (c[oe >> 2] ^ D) & g;
  ga = (c[ne >> 2] ^ E) & g;
  ia = (c[me >> 2] ^ F) & g;
  ja = (c[le >> 2] ^ G) & g;
  ka = (c[ke >> 2] ^ H) & g;
  la = (c[je >> 2] ^ I) & g;
  ma = (c[ie >> 2] ^ J) & g;
  A = (c[he >> 2] ^ A) & g ^ A;
  c[pg >> 2] = A;
  B = da ^ B;
  c[qg >> 2] = B;
  C = ea ^ C;
  c[Lg >> 2] = C;
  D = fa ^ D;
  c[Mg >> 2] = D;
  E = ga ^ E;
  c[Ng >> 2] = E;
  F = ia ^ F;
  c[Og >> 2] = F;
  G = ja ^ G;
  c[Pg >> 2] = G;
  H = ka ^ H;
  c[Qg >> 2] = H;
  I = la ^ I;
  c[Rg >> 2] = I;
  J = ma ^ J;
  c[Sg >> 2] = J;
  ma = (c[Ae >> 2] ^ L) & g;
  la = (c[ze >> 2] ^ M) & g;
  ka = (c[ye >> 2] ^ N) & g;
  ja = (c[xe >> 2] ^ O) & g;
  ia = (c[we >> 2] ^ P) & g;
  ga = (c[ve >> 2] ^ Q) & g;
  fa = (c[ue >> 2] ^ R) & g;
  ea = (c[te >> 2] ^ S) & g;
  da = (c[se >> 2] ^ T) & g;
  K = (c[re >> 2] ^ K) & g ^ K;
  c[rg >> 2] = K;
  L = ma ^ L;
  c[sg >> 2] = L;
  M = la ^ M;
  c[bh >> 2] = M;
  N = ka ^ N;
  c[ch >> 2] = N;
  O = ja ^ O;
  c[dh >> 2] = O;
  P = ia ^ P;
  c[pa >> 2] = P;
  Q = ga ^ Q;
  c[qa >> 2] = Q;
  R = fa ^ R;
  c[ra >> 2] = R;
  S = ea ^ S;
  c[sa >> 2] = S;
  T = da ^ T;
  c[ta >> 2] = T;
  da = (c[Ke >> 2] ^ e) & g;
  ea = (c[Je >> 2] ^ f) & g;
  fa = (c[Ie >> 2] ^ i) & g;
  ga = (c[He >> 2] ^ j) & g;
  ia = (c[Ge >> 2] ^ l) & g;
  ja = (c[Fe >> 2] ^ m) & g;
  ka = (c[Ee >> 2] ^ n) & g;
  la = (c[De >> 2] ^ o) & g;
  ma = (c[Ce >> 2] ^ p) & g;
  h = (c[Be >> 2] ^ h) & g ^ h;
  c[Da >> 2] = h;
  e = da ^ e;
  c[Fa >> 2] = e;
  f = ea ^ f;
  c[Ga >> 2] = f;
  i = fa ^ i;
  c[Ha >> 2] = i;
  j = ga ^ j;
  c[Ia >> 2] = j;
  l = ia ^ l;
  c[Ja >> 2] = l;
  m = ja ^ m;
  c[Ka >> 2] = m;
  n = ka ^ n;
  c[La >> 2] = n;
  o = la ^ o;
  c[Ma >> 2] = o;
  p = ma ^ p;
  c[Na >> 2] = p;
  g = (na ^ 7) + -1 | 0;
  ma = g >>> 31;
  g = g >> 31;
  if ((ma + -1 & ~ma | (ma | -2) & g | 0) != -1) {
   g = 17;
   break;
  }
  aa = (c[Ue >> 2] ^ r) & g;
  $ = (c[Te >> 2] ^ s) & g;
  _ = (c[Se >> 2] ^ t) & g;
  Z = (c[Re >> 2] ^ u) & g;
  Y = (c[Qe >> 2] ^ v) & g;
  ca = (c[Pe >> 2] ^ w) & g;
  da = (c[Oe >> 2] ^ x) & g;
  ea = (c[Ne >> 2] ^ y) & g;
  fa = (c[Me >> 2] ^ z) & g;
  q = (c[Le >> 2] ^ q) & g ^ q;
  c[oh >> 2] = q;
  r = aa ^ r;
  c[og >> 2] = r;
  s = $ ^ s;
  c[tg >> 2] = s;
  t = _ ^ t;
  c[ug >> 2] = t;
  u = Z ^ u;
  c[vg >> 2] = u;
  v = Y ^ v;
  c[wg >> 2] = v;
  w = ca ^ w;
  c[xg >> 2] = w;
  x = da ^ x;
  c[yg >> 2] = x;
  y = ea ^ y;
  c[zg >> 2] = y;
  z = fa ^ z;
  c[Ag >> 2] = z;
  fa = (c[cf >> 2] ^ B) & g;
  ea = (c[bf >> 2] ^ C) & g;
  da = (c[af >> 2] ^ D) & g;
  ca = (c[$e >> 2] ^ E) & g;
  Y = (c[_e >> 2] ^ F) & g;
  Z = (c[Ze >> 2] ^ G) & g;
  _ = (c[Ye >> 2] ^ H) & g;
  $ = (c[Xe >> 2] ^ I) & g;
  aa = (c[We >> 2] ^ J) & g;
  A = (c[Ve >> 2] ^ A) & g ^ A;
  c[pg >> 2] = A;
  B = fa ^ B;
  c[qg >> 2] = B;
  C = ea ^ C;
  c[Lg >> 2] = C;
  D = da ^ D;
  c[Mg >> 2] = D;
  E = ca ^ E;
  c[Ng >> 2] = E;
  Y = Y ^ F;
  c[Og >> 2] = Y;
  Z = Z ^ G;
  c[Pg >> 2] = Z;
  _ = _ ^ H;
  c[Qg >> 2] = _;
  $ = $ ^ I;
  c[Rg >> 2] = $;
  aa = aa ^ J;
  c[Sg >> 2] = aa;
  ca = (c[nf >> 2] ^ L) & g;
  da = (c[mf >> 2] ^ M) & g;
  ea = (c[lf >> 2] ^ N) & g;
  fa = (c[kf >> 2] ^ O) & g;
  ga = (c[jf >> 2] ^ P) & g;
  ia = (c[hf >> 2] ^ Q) & g;
  ja = (c[gf >> 2] ^ R) & g;
  ka = (c[ff >> 2] ^ S) & g;
  la = (c[ef >> 2] ^ T) & g;
  ba = (c[df >> 2] ^ K) & g ^ K;
  c[rg >> 2] = ba;
  ca = ca ^ L;
  c[sg >> 2] = ca;
  da = da ^ M;
  c[bh >> 2] = da;
  ea = ea ^ N;
  c[ch >> 2] = ea;
  fa = fa ^ O;
  c[dh >> 2] = fa;
  ga = ga ^ P;
  c[pa >> 2] = ga;
  ia = ia ^ Q;
  c[qa >> 2] = ia;
  ja = ja ^ R;
  c[ra >> 2] = ja;
  ka = ka ^ S;
  c[sa >> 2] = ka;
  la = la ^ T;
  c[ta >> 2] = la;
  Q = (c[xf >> 2] ^ e) & g;
  R = (c[wf >> 2] ^ f) & g;
  S = (c[vf >> 2] ^ i) & g;
  ma = (c[uf >> 2] ^ j) & g;
  T = (c[tf >> 2] ^ l) & g;
  U = (c[sf >> 2] ^ m) & g;
  V = (c[rf >> 2] ^ n) & g;
  W = (c[qf >> 2] ^ o) & g;
  X = (c[pf >> 2] ^ p) & g;
  h = (c[of >> 2] ^ h) & g ^ h;
  c[Da >> 2] = h;
  e = Q ^ e;
  c[Fa >> 2] = e;
  f = R ^ f;
  c[Ga >> 2] = f;
  i = S ^ i;
  c[Ha >> 2] = i;
  j = ma ^ j;
  c[Ia >> 2] = j;
  T = T ^ l;
  c[Ja >> 2] = T;
  U = U ^ m;
  c[Ka >> 2] = U;
  V = V ^ n;
  c[La >> 2] = V;
  W = W ^ o;
  c[Ma >> 2] = W;
  X = X ^ p;
  c[Na >> 2] = X;
  g = (na ^ 8) + -1 | 0;
  na = g >>> 31;
  g = g >> 31;
  if ((na + -1 & ~na | (na | -2) & g | 0) != -1) {
   g = 19;
   break;
  }
  R = (c[Hf >> 2] ^ r) & g;
  Q = (c[Gf >> 2] ^ s) & g;
  P = (c[Ff >> 2] ^ t) & g;
  O = (c[Ef >> 2] ^ u) & g;
  N = (c[Df >> 2] ^ v) & g;
  M = (c[Cf >> 2] ^ w) & g;
  L = (c[Bf >> 2] ^ x) & g;
  K = (c[Af >> 2] ^ y) & g;
  J = (c[zf >> 2] ^ z) & g;
  S = (c[yf >> 2] ^ q) & g ^ q;
  c[oh >> 2] = S;
  R = R ^ r;
  c[og >> 2] = R;
  Q = Q ^ s;
  c[tg >> 2] = Q;
  P = P ^ t;
  c[ug >> 2] = P;
  O = O ^ u;
  c[vg >> 2] = O;
  N = N ^ v;
  c[wg >> 2] = N;
  M = M ^ w;
  c[xg >> 2] = M;
  L = L ^ x;
  c[yg >> 2] = L;
  K = K ^ y;
  c[zg >> 2] = K;
  J = J ^ z;
  c[Ag >> 2] = J;
  H = (c[Rf >> 2] ^ B) & g;
  G = (c[Qf >> 2] ^ C) & g;
  F = (c[Pf >> 2] ^ D) & g;
  t = (c[Of >> 2] ^ E) & g;
  u = (c[Nf >> 2] ^ Y) & g;
  v = (c[Mf >> 2] ^ Z) & g;
  w = (c[Lf >> 2] ^ _) & g;
  x = (c[Kf >> 2] ^ $) & g;
  z = (c[Jf >> 2] ^ aa) & g;
  I = (c[If >> 2] ^ A) & g ^ A;
  c[pg >> 2] = I;
  H = H ^ B;
  c[qg >> 2] = H;
  G = G ^ C;
  c[Lg >> 2] = G;
  F = F ^ D;
  c[Mg >> 2] = F;
  E = t ^ E;
  c[Ng >> 2] = E;
  D = u ^ Y;
  c[Og >> 2] = D;
  C = v ^ Z;
  c[Pg >> 2] = C;
  B = w ^ _;
  c[Qg >> 2] = B;
  A = x ^ $;
  c[Rg >> 2] = A;
  z = z ^ aa;
  c[Sg >> 2] = z;
  x = (c[$f >> 2] ^ ca) & g;
  w = (c[_f >> 2] ^ da) & g;
  v = (c[Zf >> 2] ^ ea) & g;
  u = (c[Yf >> 2] ^ fa) & g;
  t = (c[Xf >> 2] ^ ga) & g;
  s = (c[Wf >> 2] ^ ia) & g;
  r = (c[Vf >> 2] ^ ja) & g;
  q = (c[Uf >> 2] ^ ka) & g;
  p = (c[Tf >> 2] ^ la) & g;
  y = (c[Sf >> 2] ^ ba) & g ^ ba;
  c[rg >> 2] = y;
  x = x ^ ca;
  c[sg >> 2] = x;
  w = w ^ da;
  c[bh >> 2] = w;
  v = v ^ ea;
  c[ch >> 2] = v;
  u = u ^ fa;
  c[dh >> 2] = u;
  t = t ^ ga;
  c[pa >> 2] = t;
  s = s ^ ia;
  c[qa >> 2] = s;
  r = r ^ ja;
  c[ra >> 2] = r;
  q = q ^ ka;
  c[sa >> 2] = q;
  p = p ^ la;
  c[ta >> 2] = p;
  n = (c[jg >> 2] ^ e) & g;
  m = (c[ig >> 2] ^ f) & g;
  l = (c[hg >> 2] ^ i) & g;
  ia = (c[gg >> 2] ^ j) & g;
  ja = (c[fg >> 2] ^ T) & g;
  ka = (c[eg >> 2] ^ U) & g;
  la = (c[dg >> 2] ^ V) & g;
  ma = (c[cg >> 2] ^ W) & g;
  na = (c[bg >> 2] ^ X) & g;
  o = (c[ag >> 2] ^ h) & g ^ h;
  c[Da >> 2] = o;
  n = n ^ e;
  c[Fa >> 2] = n;
  m = m ^ f;
  c[Ga >> 2] = m;
  l = l ^ i;
  c[Ha >> 2] = l;
  j = ia ^ j;
  c[Ia >> 2] = j;
  i = ja ^ T;
  c[Ja >> 2] = i;
  f = ka ^ U;
  c[Ka >> 2] = f;
  e = la ^ V;
  c[La >> 2] = e;
  h = ma ^ W;
  c[Ma >> 2] = h;
  g = na ^ X;
  c[Na >> 2] = g;
  if ((kg + -1 & ~kg | (kg | -2) & lg | 0) != -1) {
   g = 21;
   break;
  }
  ea = (I ^ S) & lg;
  fa = (H ^ R) & lg;
  ga = (G ^ Q) & lg;
  ia = (F ^ P) & lg;
  ja = (E ^ O) & lg;
  ka = (D ^ N) & lg;
  la = (C ^ M) & lg;
  ma = (B ^ L) & lg;
  na = (A ^ K) & lg;
  kg = (z ^ J) & lg;
  c[oh >> 2] = ea ^ S;
  c[og >> 2] = fa ^ R;
  c[tg >> 2] = ga ^ Q;
  c[ug >> 2] = ia ^ P;
  c[vg >> 2] = ja ^ O;
  c[wg >> 2] = ka ^ N;
  c[xg >> 2] = la ^ M;
  c[yg >> 2] = ma ^ L;
  c[zg >> 2] = na ^ K;
  c[Ag >> 2] = kg ^ J;
  c[pg >> 2] = ea ^ I;
  c[qg >> 2] = fa ^ H;
  c[Lg >> 2] = ga ^ G;
  c[Mg >> 2] = ia ^ F;
  c[Ng >> 2] = ja ^ E;
  c[Og >> 2] = ka ^ D;
  c[Pg >> 2] = la ^ C;
  c[Qg >> 2] = ma ^ B;
  c[Rg >> 2] = na ^ A;
  c[Sg >> 2] = kg ^ z;
  c[rg >> 2] = y;
  c[sg >> 2] = x;
  c[bh >> 2] = w;
  c[ch >> 2] = v;
  c[dh >> 2] = u;
  c[pa >> 2] = t;
  c[qa >> 2] = s;
  c[ra >> 2] = r;
  c[sa >> 2] = q;
  c[ta >> 2] = p;
  c[Da >> 2] = (o ^ 0 - o) & lg ^ o;
  c[Fa >> 2] = (n ^ 0 - n) & lg ^ n;
  c[Ga >> 2] = (m ^ 0 - m) & lg ^ m;
  c[Ha >> 2] = (l ^ 0 - l) & lg ^ l;
  c[Ia >> 2] = (j ^ 0 - j) & lg ^ j;
  c[Ja >> 2] = (i ^ 0 - i) & lg ^ i;
  c[Ka >> 2] = (f ^ 0 - f) & lg ^ f;
  c[La >> 2] = (e ^ 0 - e) & lg ^ e;
  c[Ma >> 2] = (h ^ 0 - h) & lg ^ h;
  c[Na >> 2] = (g ^ 0 - g) & lg ^ g;
  dc(mh, nh, oh);
  ec(b, mh, eh);
  ec(mg, gh, hh);
  ec(ng, hh, eh);
  if (!oa) {
   g = 23;
   break;
  } else oa = oa + -1 | 0;
 }
 switch (g | 0) {
 case 5:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 7:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 9:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 11:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 13:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 15:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 17:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 19:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 21:
  {
   ha(36472, 36533, 177, 36553);
   break;
  }
 case 23:
  {
   k = ph;
   return;
  }
 }
}

function zc(b) {
 b = b | 0;
 var c = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0;
 ma = b + 1 | 0;
 ja = b + 2 | 0;
 P = a[ja >> 0] | 0;
 wa = d[b >> 0] | 0;
 F = gg(d[ma >> 0] | 0 | 0, 0, 8) | 0;
 ta = U() | 0;
 P = P & 255;
 ua = gg(P | 0, 0, 16) | 0;
 U() | 0;
 ia = b + 3 | 0;
 v = gg(d[ia >> 0] | 0 | 0, 0, 8) | 0;
 ba = U() | 0;
 ea = b + 4 | 0;
 _ = gg(d[ea >> 0] | 0 | 0, 0, 16) | 0;
 ba = ba | (U() | 0);
 da = b + 5 | 0;
 O = d[da >> 0] | 0;
 $ = gg(O | 0, 0, 24) | 0;
 ba = fg(v | P | _ | $ | 0, ba | (U() | 0) | 0, 5) | 0;
 U() | 0;
 $ = b + 6 | 0;
 _ = b + 7 | 0;
 P = a[_ >> 0] | 0;
 v = gg(d[$ >> 0] | 0 | 0, 0, 8) | 0;
 Ca = U() | 0;
 P = P & 255;
 Z = gg(P | 0, 0, 16) | 0;
 Ca = fg(v | O | Z | 0, Ca | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Z = b + 8 | 0;
 O = gg(d[Z >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 V = b + 9 | 0;
 Ba = gg(d[V >> 0] | 0 | 0, 0, 16) | 0;
 v = v | (U() | 0);
 T = b + 10 | 0;
 Ua = d[T >> 0] | 0;
 S = gg(Ua | 0, 0, 24) | 0;
 v = fg(O | P | Ba | S | 0, v | (U() | 0) | 0, 7) | 0;
 U() | 0;
 S = b + 11 | 0;
 Ba = gg(d[S >> 0] | 0 | 0, 0, 8) | 0;
 P = U() | 0;
 O = b + 12 | 0;
 I = gg(d[O >> 0] | 0 | 0, 0, 16) | 0;
 P = P | (U() | 0);
 N = b + 13 | 0;
 w = d[N >> 0] | 0;
 J = gg(w | 0, 0, 24) | 0;
 P = fg(Ba | Ua | I | J | 0, P | (U() | 0) | 0, 4) | 0;
 U() | 0;
 J = b + 14 | 0;
 I = b + 15 | 0;
 Ua = a[I >> 0] | 0;
 Ba = gg(d[J >> 0] | 0 | 0, 0, 8) | 0;
 ra = U() | 0;
 Ua = Ua & 255;
 H = gg(Ua | 0, 0, 16) | 0;
 ra = fg(Ba | w | H | 0, ra | (U() | 0) | 0, 1) | 0;
 U() | 0;
 H = b + 16 | 0;
 w = gg(d[H >> 0] | 0 | 0, 0, 8) | 0;
 Ba = U() | 0;
 D = b + 17 | 0;
 y = gg(d[D >> 0] | 0 | 0, 0, 16) | 0;
 Ba = Ba | (U() | 0);
 C = b + 18 | 0;
 x = d[C >> 0] | 0;
 B = gg(x | 0, 0, 24) | 0;
 Ba = fg(w | Ua | y | B | 0, Ba | (U() | 0) | 0, 6) | 0;
 U() | 0;
 B = b + 19 | 0;
 y = b + 20 | 0;
 Ua = a[y >> 0] | 0;
 w = gg(d[B >> 0] | 0 | 0, 0, 8) | 0;
 Va = U() | 0;
 Ua = gg(Ua & 255 | 0, 0, 16) | 0;
 Va = fg(w | x | Ua | 0, Va | (U() | 0) | 0, 3) | 0;
 Ua = U() | 0;
 x = b + 21 | 0;
 w = b + 22 | 0;
 t = b + 23 | 0;
 e = a[t >> 0] | 0;
 ab = d[x >> 0] | 0;
 bb = gg(d[w >> 0] | 0 | 0, 0, 8) | 0;
 _a = U() | 0;
 e = e & 255;
 $a = gg(e | 0, 0, 16) | 0;
 U() | 0;
 s = b + 24 | 0;
 Ma = gg(d[s >> 0] | 0 | 0, 0, 8) | 0;
 Ra = U() | 0;
 o = b + 25 | 0;
 i = gg(d[o >> 0] | 0 | 0, 0, 16) | 0;
 Ra = Ra | (U() | 0);
 n = b + 26 | 0;
 oa = d[n >> 0] | 0;
 j = gg(oa | 0, 0, 24) | 0;
 Ra = fg(Ma | e | i | j | 0, Ra | (U() | 0) | 0, 5) | 0;
 U() | 0;
 j = b + 27 | 0;
 i = b + 28 | 0;
 e = a[i >> 0] | 0;
 Ma = gg(d[j >> 0] | 0 | 0, 0, 8) | 0;
 Za = U() | 0;
 e = e & 255;
 h = gg(e | 0, 0, 16) | 0;
 Za = fg(Ma | oa | h | 0, Za | (U() | 0) | 0, 2) | 0;
 U() | 0;
 h = b + 29 | 0;
 oa = gg(d[h >> 0] | 0 | 0, 0, 8) | 0;
 Ma = U() | 0;
 g = b + 30 | 0;
 fb = gg(d[g >> 0] | 0 | 0, 0, 16) | 0;
 Ma = Ma | (U() | 0);
 c = b + 31 | 0;
 ca = d[c >> 0] | 0;
 k = gg(ca | 0, 0, 24) | 0;
 Ma = fg(oa | e | fb | k | 0, Ma | (U() | 0) | 0, 7) | 0;
 U() | 0;
 k = gg(d[b + 32 >> 0] | 0 | 0, 0, 8) | 0;
 fb = U() | 0;
 e = gg(d[b + 33 >> 0] | 0 | 0, 0, 16) | 0;
 fb = fb | (U() | 0);
 oa = d[b + 34 >> 0] | 0;
 q = gg(oa | 0, 0, 24) | 0;
 fb = fg(k | ca | e | q | 0, fb | (U() | 0) | 0, 4) | 0;
 U() | 0;
 q = a[b + 36 >> 0] | 0;
 e = gg(d[b + 35 >> 0] | 0 | 0, 0, 8) | 0;
 ca = U() | 0;
 q = q & 255;
 k = gg(q | 0, 0, 16) | 0;
 ca = fg(e | oa | k | 0, ca | (U() | 0) | 0, 1) | 0;
 U() | 0;
 k = gg(d[b + 37 >> 0] | 0 | 0, 0, 8) | 0;
 oa = U() | 0;
 e = gg(d[b + 38 >> 0] | 0 | 0, 0, 16) | 0;
 oa = oa | (U() | 0);
 Oa = d[b + 39 >> 0] | 0;
 aa = gg(Oa | 0, 0, 24) | 0;
 oa = fg(k | q | e | aa | 0, oa | (U() | 0) | 0, 6) | 0;
 U() | 0;
 aa = a[b + 41 >> 0] | 0;
 e = gg(d[b + 40 >> 0] | 0 | 0, 0, 8) | 0;
 q = U() | 0;
 aa = gg(aa & 255 | 0, 0, 16) | 0;
 q = fg(e | Oa | aa | 0, q | (U() | 0) | 0, 3) | 0;
 aa = U() | 0;
 Oa = a[b + 44 >> 0] | 0;
 e = d[b + 42 >> 0] | 0;
 k = gg(d[b + 43 >> 0] | 0 | 0, 0, 8) | 0;
 K = U() | 0;
 Oa = Oa & 255;
 r = gg(Oa | 0, 0, 16) | 0;
 U() | 0;
 z = gg(d[b + 45 >> 0] | 0 | 0, 0, 8) | 0;
 fa = U() | 0;
 Fa = gg(d[b + 46 >> 0] | 0 | 0, 0, 16) | 0;
 fa = fa | (U() | 0);
 gb = d[b + 47 >> 0] | 0;
 L = gg(gb | 0, 0, 24) | 0;
 fa = fg(z | Oa | Fa | L | 0, fa | (U() | 0) | 0, 5) | 0;
 U() | 0;
 L = a[b + 49 >> 0] | 0;
 Fa = gg(d[b + 48 >> 0] | 0 | 0, 0, 8) | 0;
 Oa = U() | 0;
 L = L & 255;
 z = gg(L | 0, 0, 16) | 0;
 Oa = fg(Fa | gb | z | 0, Oa | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Oa = Oa & 2097151;
 z = gg(d[b + 50 >> 0] | 0 | 0, 0, 8) | 0;
 gb = U() | 0;
 Fa = gg(d[b + 51 >> 0] | 0 | 0, 0, 16) | 0;
 gb = gb | (U() | 0);
 ka = d[b + 52 >> 0] | 0;
 M = gg(ka | 0, 0, 24) | 0;
 gb = fg(z | L | Fa | M | 0, gb | (U() | 0) | 0, 7) | 0;
 U() | 0;
 gb = gb & 2097151;
 M = gg(d[b + 53 >> 0] | 0 | 0, 0, 8) | 0;
 Fa = U() | 0;
 L = gg(d[b + 54 >> 0] | 0 | 0, 0, 16) | 0;
 Fa = Fa | (U() | 0);
 z = d[b + 55 >> 0] | 0;
 W = gg(z | 0, 0, 24) | 0;
 Fa = fg(M | ka | L | W | 0, Fa | (U() | 0) | 0, 4) | 0;
 U() | 0;
 Fa = Fa & 2097151;
 W = a[b + 57 >> 0] | 0;
 L = gg(d[b + 56 >> 0] | 0 | 0, 0, 8) | 0;
 ka = U() | 0;
 W = W & 255;
 M = gg(W | 0, 0, 16) | 0;
 ka = fg(L | z | M | 0, ka | (U() | 0) | 0, 1) | 0;
 U() | 0;
 ka = ka & 2097151;
 M = gg(d[b + 58 >> 0] | 0 | 0, 0, 8) | 0;
 z = U() | 0;
 L = gg(d[b + 59 >> 0] | 0 | 0, 0, 16) | 0;
 z = z | (U() | 0);
 na = d[b + 60 >> 0] | 0;
 qa = gg(na | 0, 0, 24) | 0;
 z = fg(M | W | L | qa | 0, z | (U() | 0) | 0, 6) | 0;
 U() | 0;
 z = z & 2097151;
 qa = gg(d[b + 61 >> 0] | 0 | 0, 0, 8) | 0;
 L = U() | 0;
 W = gg(d[b + 62 >> 0] | 0 | 0, 0, 16) | 0;
 L = L | (U() | 0);
 M = gg(d[b + 63 >> 0] | 0 | 0, 0, 24) | 0;
 L = fg(qa | na | W | M | 0, L | (U() | 0) | 0, 3) | 0;
 M = U() | 0;
 W = _f(L | 0, M | 0, 666643, 0) | 0;
 na = U() | 0;
 qa = _f(L | 0, M | 0, 470296, 0) | 0;
 ha = U() | 0;
 u = _f(L | 0, M | 0, 654183, 0) | 0;
 E = U() | 0;
 va = _f(L | 0, M | 0, -997805, -1) | 0;
 Aa = U() | 0;
 m = _f(L | 0, M | 0, 136657, 0) | 0;
 za = U() | 0;
 M = _f(L | 0, M | 0, -683901, -1) | 0;
 K = $f(M | 0, U() | 0, k | e | r & 2031616 | 0, K | 0) | 0;
 r = U() | 0;
 e = _f(z | 0, 0, 666643, 0) | 0;
 k = U() | 0;
 M = _f(z | 0, 0, 470296, 0) | 0;
 L = U() | 0;
 Xa = _f(z | 0, 0, 654183, 0) | 0;
 G = U() | 0;
 X = _f(z | 0, 0, -997805, -1) | 0;
 Q = U() | 0;
 ya = _f(z | 0, 0, 136657, 0) | 0;
 pa = U() | 0;
 z = _f(z | 0, 0, -683901, -1) | 0;
 R = U() | 0;
 Da = _f(ka | 0, 0, 666643, 0) | 0;
 xa = U() | 0;
 ga = _f(ka | 0, 0, 470296, 0) | 0;
 Na = U() | 0;
 Ha = _f(ka | 0, 0, 654183, 0) | 0;
 Ga = U() | 0;
 cb = _f(ka | 0, 0, -997805, -1) | 0;
 Wa = U() | 0;
 l = _f(ka | 0, 0, 136657, 0) | 0;
 p = U() | 0;
 ka = _f(ka | 0, 0, -683901, -1) | 0;
 oa = $f(ka | 0, U() | 0, oa & 2097151 | 0, 0) | 0;
 pa = $f(oa | 0, U() | 0, ya | 0, pa | 0) | 0;
 Aa = $f(pa | 0, U() | 0, va | 0, Aa | 0) | 0;
 va = U() | 0;
 pa = _f(Fa | 0, 0, 666643, 0) | 0;
 ya = U() | 0;
 oa = _f(Fa | 0, 0, 470296, 0) | 0;
 ka = U() | 0;
 sa = _f(Fa | 0, 0, 654183, 0) | 0;
 Y = U() | 0;
 Ja = _f(Fa | 0, 0, -997805, -1) | 0;
 Ia = U() | 0;
 eb = _f(Fa | 0, 0, 136657, 0) | 0;
 db = U() | 0;
 Fa = _f(Fa | 0, 0, -683901, -1) | 0;
 Ea = U() | 0;
 f = _f(gb | 0, 0, 666643, 0) | 0;
 A = U() | 0;
 Sa = _f(gb | 0, 0, 470296, 0) | 0;
 Ta = U() | 0;
 Qa = _f(gb | 0, 0, 654183, 0) | 0;
 Pa = U() | 0;
 Ya = _f(gb | 0, 0, -997805, -1) | 0;
 la = U() | 0;
 La = _f(gb | 0, 0, 136657, 0) | 0;
 Ka = U() | 0;
 gb = _f(gb | 0, 0, -683901, -1) | 0;
 fb = $f(gb | 0, U() | 0, fb & 2097151 | 0, 0) | 0;
 db = $f(fb | 0, U() | 0, eb | 0, db | 0) | 0;
 Wa = $f(db | 0, U() | 0, cb | 0, Wa | 0) | 0;
 G = $f(Wa | 0, U() | 0, Xa | 0, G | 0) | 0;
 ha = $f(G | 0, U() | 0, qa | 0, ha | 0) | 0;
 qa = U() | 0;
 G = _f(Oa | 0, 0, 666643, 0) | 0;
 Ba = $f(G | 0, U() | 0, Ba & 2097151 | 0, 0) | 0;
 G = U() | 0;
 Xa = _f(Oa | 0, 0, 470296, 0) | 0;
 Wa = U() | 0;
 cb = _f(Oa | 0, 0, 654183, 0) | 0;
 _a = $f(cb | 0, U() | 0, bb | ab | $a & 2031616 | 0, _a | 0) | 0;
 Ta = $f(_a | 0, U() | 0, Sa | 0, Ta | 0) | 0;
 ya = $f(Ta | 0, U() | 0, pa | 0, ya | 0) | 0;
 pa = U() | 0;
 Ta = _f(Oa | 0, 0, -997805, -1) | 0;
 Sa = U() | 0;
 _a = _f(Oa | 0, 0, 136657, 0) | 0;
 Za = $f(_a | 0, U() | 0, Za & 2097151 | 0, 0) | 0;
 la = $f(Za | 0, U() | 0, Ya | 0, la | 0) | 0;
 Y = $f(la | 0, U() | 0, sa | 0, Y | 0) | 0;
 Na = $f(Y | 0, U() | 0, ga | 0, Na | 0) | 0;
 k = $f(Na | 0, U() | 0, e | 0, k | 0) | 0;
 e = U() | 0;
 Oa = _f(Oa | 0, 0, -683901, -1) | 0;
 Na = U() | 0;
 ga = $f(Ba | 0, G | 0, 1048576, 0) | 0;
 Y = U() | 0;
 sa = fg(ga | 0, Y | 0, 21) | 0;
 la = U() | 0;
 Ua = $f(Xa | 0, Wa | 0, Va | 0, Ua | 0) | 0;
 la = $f(Ua | 0, U() | 0, sa | 0, la | 0) | 0;
 A = $f(la | 0, U() | 0, f | 0, A | 0) | 0;
 f = U() | 0;
 Y = ag(Ba | 0, G | 0, ga & -2097152 | 0, Y & 2047 | 0) | 0;
 ga = U() | 0;
 G = $f(ya | 0, pa | 0, 1048576, 0) | 0;
 Ba = U() | 0;
 la = fg(G | 0, Ba | 0, 21) | 0;
 sa = U() | 0;
 Ra = $f(Ta | 0, Sa | 0, Ra & 2097151 | 0, 0) | 0;
 Pa = $f(Ra | 0, U() | 0, Qa | 0, Pa | 0) | 0;
 ka = $f(Pa | 0, U() | 0, oa | 0, ka | 0) | 0;
 xa = $f(ka | 0, U() | 0, Da | 0, xa | 0) | 0;
 sa = $f(xa | 0, U() | 0, la | 0, sa | 0) | 0;
 la = U() | 0;
 xa = $f(k | 0, e | 0, 1048576, 0) | 0;
 Da = U() | 0;
 ka = eg(xa | 0, Da | 0, 21) | 0;
 oa = U() | 0;
 Ma = $f(Oa | 0, Na | 0, Ma & 2097151 | 0, 0) | 0;
 Ka = $f(Ma | 0, U() | 0, La | 0, Ka | 0) | 0;
 Ia = $f(Ka | 0, U() | 0, Ja | 0, Ia | 0) | 0;
 Ga = $f(Ia | 0, U() | 0, Ha | 0, Ga | 0) | 0;
 L = $f(Ga | 0, U() | 0, M | 0, L | 0) | 0;
 na = $f(L | 0, U() | 0, W | 0, na | 0) | 0;
 oa = $f(na | 0, U() | 0, ka | 0, oa | 0) | 0;
 ka = U() | 0;
 na = $f(ha | 0, qa | 0, 1048576, 0) | 0;
 W = U() | 0;
 L = eg(na | 0, W | 0, 21) | 0;
 M = U() | 0;
 ca = $f(Fa | 0, Ea | 0, ca & 2097151 | 0, 0) | 0;
 p = $f(ca | 0, U() | 0, l | 0, p | 0) | 0;
 Q = $f(p | 0, U() | 0, X | 0, Q | 0) | 0;
 E = $f(Q | 0, U() | 0, u | 0, E | 0) | 0;
 M = $f(E | 0, U() | 0, L | 0, M | 0) | 0;
 L = U() | 0;
 W = ag(ha | 0, qa | 0, na & -2097152 | 0, W | 0) | 0;
 na = U() | 0;
 qa = $f(Aa | 0, va | 0, 1048576, 0) | 0;
 ha = U() | 0;
 E = eg(qa | 0, ha | 0, 21) | 0;
 u = U() | 0;
 aa = $f(z | 0, R | 0, q | 0, aa | 0) | 0;
 za = $f(aa | 0, U() | 0, m | 0, za | 0) | 0;
 u = $f(za | 0, U() | 0, E | 0, u | 0) | 0;
 E = U() | 0;
 ha = ag(Aa | 0, va | 0, qa & -2097152 | 0, ha | 0) | 0;
 qa = U() | 0;
 va = $f(K | 0, r | 0, 1048576, 0) | 0;
 Aa = U() | 0;
 za = eg(va | 0, Aa | 0, 21) | 0;
 fa = $f(za | 0, U() | 0, fa & 2097151 | 0, 0) | 0;
 za = U() | 0;
 Aa = ag(K | 0, r | 0, va & -2097152 | 0, Aa | 0) | 0;
 va = U() | 0;
 r = $f(A | 0, f | 0, 1048576, 0) | 0;
 K = U() | 0;
 m = fg(r | 0, K | 0, 21) | 0;
 aa = U() | 0;
 K = ag(A | 0, f | 0, r & -2097152 | 0, K | 0) | 0;
 r = U() | 0;
 f = $f(sa | 0, la | 0, 1048576, 0) | 0;
 A = U() | 0;
 q = eg(f | 0, A | 0, 21) | 0;
 R = U() | 0;
 A = ag(sa | 0, la | 0, f & -2097152 | 0, A | 0) | 0;
 f = U() | 0;
 la = $f(oa | 0, ka | 0, 1048576, 0) | 0;
 sa = U() | 0;
 z = eg(la | 0, sa | 0, 21) | 0;
 na = $f(z | 0, U() | 0, W | 0, na | 0) | 0;
 W = U() | 0;
 sa = ag(oa | 0, ka | 0, la & -2097152 | 0, sa | 0) | 0;
 la = U() | 0;
 ka = $f(M | 0, L | 0, 1048576, 0) | 0;
 oa = U() | 0;
 z = eg(ka | 0, oa | 0, 21) | 0;
 qa = $f(z | 0, U() | 0, ha | 0, qa | 0) | 0;
 ha = U() | 0;
 oa = ag(M | 0, L | 0, ka & -2097152 | 0, oa | 0) | 0;
 ka = U() | 0;
 L = $f(u | 0, E | 0, 1048576, 0) | 0;
 M = U() | 0;
 z = eg(L | 0, M | 0, 21) | 0;
 va = $f(z | 0, U() | 0, Aa | 0, va | 0) | 0;
 Aa = U() | 0;
 M = ag(u | 0, E | 0, L & -2097152 | 0, M | 0) | 0;
 L = U() | 0;
 E = _f(fa | 0, za | 0, 666643, 0) | 0;
 ra = $f(E | 0, U() | 0, ra & 2097151 | 0, 0) | 0;
 E = U() | 0;
 u = _f(fa | 0, za | 0, 470296, 0) | 0;
 u = $f(Y | 0, ga | 0, u | 0, U() | 0) | 0;
 ga = U() | 0;
 Y = _f(fa | 0, za | 0, 654183, 0) | 0;
 Y = $f(K | 0, r | 0, Y | 0, U() | 0) | 0;
 r = U() | 0;
 K = _f(fa | 0, za | 0, -997805, -1) | 0;
 z = U() | 0;
 Q = _f(fa | 0, za | 0, 136657, 0) | 0;
 Q = $f(A | 0, f | 0, Q | 0, U() | 0) | 0;
 f = U() | 0;
 za = _f(fa | 0, za | 0, -683901, -1) | 0;
 fa = U() | 0;
 R = $f(k | 0, e | 0, q | 0, R | 0) | 0;
 Da = ag(R | 0, U() | 0, xa & -2097152 | 0, Da | 0) | 0;
 fa = $f(Da | 0, U() | 0, za | 0, fa | 0) | 0;
 za = U() | 0;
 Da = _f(va | 0, Aa | 0, 666643, 0) | 0;
 P = $f(Da | 0, U() | 0, P & 2097151 | 0, 0) | 0;
 Da = U() | 0;
 xa = _f(va | 0, Aa | 0, 470296, 0) | 0;
 xa = $f(ra | 0, E | 0, xa | 0, U() | 0) | 0;
 E = U() | 0;
 ra = _f(va | 0, Aa | 0, 654183, 0) | 0;
 ra = $f(u | 0, ga | 0, ra | 0, U() | 0) | 0;
 ga = U() | 0;
 u = _f(va | 0, Aa | 0, -997805, -1) | 0;
 u = $f(Y | 0, r | 0, u | 0, U() | 0) | 0;
 r = U() | 0;
 Y = _f(va | 0, Aa | 0, 136657, 0) | 0;
 R = U() | 0;
 Aa = _f(va | 0, Aa | 0, -683901, -1) | 0;
 Aa = $f(Q | 0, f | 0, Aa | 0, U() | 0) | 0;
 f = U() | 0;
 Q = _f(M | 0, L | 0, 666643, 0) | 0;
 v = $f(Q | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 Q = U() | 0;
 va = _f(M | 0, L | 0, 470296, 0) | 0;
 va = $f(P | 0, Da | 0, va | 0, U() | 0) | 0;
 Da = U() | 0;
 P = _f(M | 0, L | 0, 654183, 0) | 0;
 P = $f(xa | 0, E | 0, P | 0, U() | 0) | 0;
 E = U() | 0;
 xa = _f(M | 0, L | 0, -997805, -1) | 0;
 xa = $f(ra | 0, ga | 0, xa | 0, U() | 0) | 0;
 ga = U() | 0;
 ra = _f(M | 0, L | 0, 136657, 0) | 0;
 ra = $f(u | 0, r | 0, ra | 0, U() | 0) | 0;
 r = U() | 0;
 L = _f(M | 0, L | 0, -683901, -1) | 0;
 M = U() | 0;
 aa = $f(ya | 0, pa | 0, m | 0, aa | 0) | 0;
 Ba = ag(aa | 0, U() | 0, G & -2097152 | 0, Ba | 0) | 0;
 z = $f(Ba | 0, U() | 0, K | 0, z | 0) | 0;
 R = $f(z | 0, U() | 0, Y | 0, R | 0) | 0;
 M = $f(R | 0, U() | 0, L | 0, M | 0) | 0;
 L = U() | 0;
 R = _f(qa | 0, ha | 0, 666643, 0) | 0;
 Y = U() | 0;
 z = _f(qa | 0, ha | 0, 470296, 0) | 0;
 K = U() | 0;
 Ba = _f(qa | 0, ha | 0, 654183, 0) | 0;
 G = U() | 0;
 aa = _f(qa | 0, ha | 0, -997805, -1) | 0;
 m = U() | 0;
 pa = _f(qa | 0, ha | 0, 136657, 0) | 0;
 pa = $f(xa | 0, ga | 0, pa | 0, U() | 0) | 0;
 ga = U() | 0;
 ha = _f(qa | 0, ha | 0, -683901, -1) | 0;
 ha = $f(ra | 0, r | 0, ha | 0, U() | 0) | 0;
 r = U() | 0;
 ra = _f(oa | 0, ka | 0, 666643, 0) | 0;
 qa = U() | 0;
 xa = _f(oa | 0, ka | 0, 470296, 0) | 0;
 ya = U() | 0;
 u = _f(oa | 0, ka | 0, 654183, 0) | 0;
 q = U() | 0;
 e = _f(oa | 0, ka | 0, -997805, -1) | 0;
 k = U() | 0;
 A = _f(oa | 0, ka | 0, 136657, 0) | 0;
 X = U() | 0;
 ka = _f(oa | 0, ka | 0, -683901, -1) | 0;
 ka = $f(pa | 0, ga | 0, ka | 0, U() | 0) | 0;
 ga = U() | 0;
 pa = _f(na | 0, W | 0, 666643, 0) | 0;
 ta = $f(pa | 0, U() | 0, F | wa | ua & 2031616 | 0, ta | 0) | 0;
 ua = U() | 0;
 wa = _f(na | 0, W | 0, 470296, 0) | 0;
 F = U() | 0;
 pa = _f(na | 0, W | 0, 654183, 0) | 0;
 Ca = $f(pa | 0, U() | 0, Ca & 2097151 | 0, 0) | 0;
 Y = $f(Ca | 0, U() | 0, R | 0, Y | 0) | 0;
 ya = $f(Y | 0, U() | 0, xa | 0, ya | 0) | 0;
 xa = U() | 0;
 Y = _f(na | 0, W | 0, -997805, -1) | 0;
 R = U() | 0;
 Ca = _f(na | 0, W | 0, 136657, 0) | 0;
 Ca = $f(va | 0, Da | 0, Ca | 0, U() | 0) | 0;
 G = $f(Ca | 0, U() | 0, Ba | 0, G | 0) | 0;
 k = $f(G | 0, U() | 0, e | 0, k | 0) | 0;
 e = U() | 0;
 W = _f(na | 0, W | 0, -683901, -1) | 0;
 na = U() | 0;
 G = $f(ta | 0, ua | 0, 1048576, 0) | 0;
 Ba = U() | 0;
 Ca = eg(G | 0, Ba | 0, 21) | 0;
 Da = U() | 0;
 ba = $f(wa | 0, F | 0, ba & 2097151 | 0, 0) | 0;
 qa = $f(ba | 0, U() | 0, ra | 0, qa | 0) | 0;
 Da = $f(qa | 0, U() | 0, Ca | 0, Da | 0) | 0;
 Ca = U() | 0;
 Ba = ag(ta | 0, ua | 0, G & -2097152 | 0, Ba | 0) | 0;
 G = U() | 0;
 ua = $f(ya | 0, xa | 0, 1048576, 0) | 0;
 ta = U() | 0;
 qa = eg(ua | 0, ta | 0, 21) | 0;
 ra = U() | 0;
 R = $f(v | 0, Q | 0, Y | 0, R | 0) | 0;
 K = $f(R | 0, U() | 0, z | 0, K | 0) | 0;
 q = $f(K | 0, U() | 0, u | 0, q | 0) | 0;
 ra = $f(q | 0, U() | 0, qa | 0, ra | 0) | 0;
 qa = U() | 0;
 q = $f(k | 0, e | 0, 1048576, 0) | 0;
 u = U() | 0;
 K = eg(q | 0, u | 0, 21) | 0;
 z = U() | 0;
 na = $f(P | 0, E | 0, W | 0, na | 0) | 0;
 m = $f(na | 0, U() | 0, aa | 0, m | 0) | 0;
 X = $f(m | 0, U() | 0, A | 0, X | 0) | 0;
 z = $f(X | 0, U() | 0, K | 0, z | 0) | 0;
 K = U() | 0;
 X = $f(ka | 0, ga | 0, 1048576, 0) | 0;
 A = U() | 0;
 m = eg(X | 0, A | 0, 21) | 0;
 m = $f(ha | 0, r | 0, m | 0, U() | 0) | 0;
 r = U() | 0;
 A = ag(ka | 0, ga | 0, X & -2097152 | 0, A | 0) | 0;
 X = U() | 0;
 ga = $f(M | 0, L | 0, 1048576, 0) | 0;
 ka = U() | 0;
 ha = eg(ga | 0, ka | 0, 21) | 0;
 ha = $f(Aa | 0, f | 0, ha | 0, U() | 0) | 0;
 f = U() | 0;
 ka = ag(M | 0, L | 0, ga & -2097152 | 0, ka | 0) | 0;
 ga = U() | 0;
 L = $f(fa | 0, za | 0, 1048576, 0) | 0;
 M = U() | 0;
 Aa = eg(L | 0, M | 0, 21) | 0;
 Aa = $f(sa | 0, la | 0, Aa | 0, U() | 0) | 0;
 la = U() | 0;
 M = ag(fa | 0, za | 0, L & -2097152 | 0, M | 0) | 0;
 L = U() | 0;
 za = $f(Da | 0, Ca | 0, 1048576, 0) | 0;
 fa = U() | 0;
 sa = eg(za | 0, fa | 0, 21) | 0;
 aa = U() | 0;
 na = $f(ra | 0, qa | 0, 1048576, 0) | 0;
 W = U() | 0;
 E = eg(na | 0, W | 0, 21) | 0;
 P = U() | 0;
 R = $f(z | 0, K | 0, 1048576, 0) | 0;
 Y = U() | 0;
 Q = eg(R | 0, Y | 0, 21) | 0;
 Q = $f(A | 0, X | 0, Q | 0, U() | 0) | 0;
 X = U() | 0;
 A = $f(m | 0, r | 0, 1048576, 0) | 0;
 v = U() | 0;
 ba = eg(A | 0, v | 0, 21) | 0;
 ba = $f(ka | 0, ga | 0, ba | 0, U() | 0) | 0;
 ga = U() | 0;
 v = ag(m | 0, r | 0, A & -2097152 | 0, v | 0) | 0;
 A = U() | 0;
 r = $f(ha | 0, f | 0, 1048576, 0) | 0;
 m = U() | 0;
 ka = eg(r | 0, m | 0, 21) | 0;
 ka = $f(M | 0, L | 0, ka | 0, U() | 0) | 0;
 L = U() | 0;
 m = ag(ha | 0, f | 0, r & -2097152 | 0, m | 0) | 0;
 r = U() | 0;
 f = $f(Aa | 0, la | 0, 1048576, 0) | 0;
 ha = U() | 0;
 M = eg(f | 0, ha | 0, 21) | 0;
 F = U() | 0;
 ha = ag(Aa | 0, la | 0, f & -2097152 | 0, ha | 0) | 0;
 f = U() | 0;
 la = _f(M | 0, F | 0, 666643, 0) | 0;
 la = $f(Ba | 0, G | 0, la | 0, U() | 0) | 0;
 G = U() | 0;
 Ba = _f(M | 0, F | 0, 470296, 0) | 0;
 Aa = U() | 0;
 wa = _f(M | 0, F | 0, 654183, 0) | 0;
 va = U() | 0;
 pa = _f(M | 0, F | 0, -997805, -1) | 0;
 oa = U() | 0;
 p = _f(M | 0, F | 0, 136657, 0) | 0;
 l = U() | 0;
 F = _f(M | 0, F | 0, -683901, -1) | 0;
 M = U() | 0;
 G = eg(la | 0, G | 0, 21) | 0;
 ca = U() | 0;
 Aa = $f(Da | 0, Ca | 0, Ba | 0, Aa | 0) | 0;
 fa = ag(Aa | 0, U() | 0, za & -2097152 | 0, fa | 0) | 0;
 ca = $f(fa | 0, U() | 0, G | 0, ca | 0) | 0;
 G = eg(ca | 0, U() | 0, 21) | 0;
 fa = U() | 0;
 va = $f(ya | 0, xa | 0, wa | 0, va | 0) | 0;
 ta = ag(va | 0, U() | 0, ua & -2097152 | 0, ta | 0) | 0;
 aa = $f(ta | 0, U() | 0, sa | 0, aa | 0) | 0;
 fa = $f(aa | 0, U() | 0, G | 0, fa | 0) | 0;
 G = eg(fa | 0, U() | 0, 21) | 0;
 aa = U() | 0;
 oa = $f(ra | 0, qa | 0, pa | 0, oa | 0) | 0;
 W = ag(oa | 0, U() | 0, na & -2097152 | 0, W | 0) | 0;
 aa = $f(W | 0, U() | 0, G | 0, aa | 0) | 0;
 G = eg(aa | 0, U() | 0, 21) | 0;
 W = U() | 0;
 l = $f(k | 0, e | 0, p | 0, l | 0) | 0;
 u = ag(l | 0, U() | 0, q & -2097152 | 0, u | 0) | 0;
 P = $f(u | 0, U() | 0, E | 0, P | 0) | 0;
 W = $f(P | 0, U() | 0, G | 0, W | 0) | 0;
 G = eg(W | 0, U() | 0, 21) | 0;
 P = U() | 0;
 M = $f(z | 0, K | 0, F | 0, M | 0) | 0;
 Y = ag(M | 0, U() | 0, R & -2097152 | 0, Y | 0) | 0;
 P = $f(Y | 0, U() | 0, G | 0, P | 0) | 0;
 G = eg(P | 0, U() | 0, 21) | 0;
 G = $f(Q | 0, X | 0, G | 0, U() | 0) | 0;
 X = eg(G | 0, U() | 0, 21) | 0;
 A = $f(X | 0, U() | 0, v | 0, A | 0) | 0;
 v = eg(A | 0, U() | 0, 21) | 0;
 v = $f(ba | 0, ga | 0, v | 0, U() | 0) | 0;
 ga = eg(v | 0, U() | 0, 21) | 0;
 r = $f(ga | 0, U() | 0, m | 0, r | 0) | 0;
 m = eg(r | 0, U() | 0, 21) | 0;
 m = $f(ka | 0, L | 0, m | 0, U() | 0) | 0;
 L = eg(m | 0, U() | 0, 21) | 0;
 f = $f(L | 0, U() | 0, ha | 0, f | 0) | 0;
 ha = eg(f | 0, U() | 0, 21) | 0;
 L = U() | 0;
 ka = _f(ha | 0, L | 0, 666643, 0) | 0;
 la = $f(ka | 0, U() | 0, la & 2097151 | 0, 0) | 0;
 ka = U() | 0;
 ga = _f(ha | 0, L | 0, 470296, 0) | 0;
 ca = $f(ga | 0, U() | 0, ca & 2097151 | 0, 0) | 0;
 ga = U() | 0;
 ba = _f(ha | 0, L | 0, 654183, 0) | 0;
 fa = $f(ba | 0, U() | 0, fa & 2097151 | 0, 0) | 0;
 ba = U() | 0;
 X = _f(ha | 0, L | 0, -997805, -1) | 0;
 aa = $f(X | 0, U() | 0, aa & 2097151 | 0, 0) | 0;
 X = U() | 0;
 Q = _f(ha | 0, L | 0, 136657, 0) | 0;
 W = $f(Q | 0, U() | 0, W & 2097151 | 0, 0) | 0;
 Q = U() | 0;
 L = _f(ha | 0, L | 0, -683901, -1) | 0;
 P = $f(L | 0, U() | 0, P & 2097151 | 0, 0) | 0;
 L = U() | 0;
 ha = eg(la | 0, ka | 0, 21) | 0;
 ha = $f(ca | 0, ga | 0, ha | 0, U() | 0) | 0;
 ga = U() | 0;
 ca = eg(ha | 0, ga | 0, 21) | 0;
 ca = $f(fa | 0, ba | 0, ca | 0, U() | 0) | 0;
 ba = U() | 0;
 fa = ha & 2097151;
 Y = eg(ca | 0, ba | 0, 21) | 0;
 Y = $f(aa | 0, X | 0, Y | 0, U() | 0) | 0;
 X = U() | 0;
 aa = ca & 2097151;
 R = eg(Y | 0, X | 0, 21) | 0;
 R = $f(W | 0, Q | 0, R | 0, U() | 0) | 0;
 Q = U() | 0;
 W = Y & 2097151;
 M = eg(R | 0, Q | 0, 21) | 0;
 M = $f(P | 0, L | 0, M | 0, U() | 0) | 0;
 L = U() | 0;
 P = R & 2097151;
 F = eg(M | 0, L | 0, 21) | 0;
 G = $f(F | 0, U() | 0, G & 2097151 | 0, 0) | 0;
 F = U() | 0;
 K = M & 2097151;
 z = eg(G | 0, F | 0, 21) | 0;
 A = $f(z | 0, U() | 0, A & 2097151 | 0, 0) | 0;
 z = U() | 0;
 E = G & 2097151;
 u = eg(A | 0, z | 0, 21) | 0;
 v = $f(u | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 u = U() | 0;
 q = eg(v | 0, u | 0, 21) | 0;
 r = $f(q | 0, U() | 0, r & 2097151 | 0, 0) | 0;
 q = U() | 0;
 l = eg(r | 0, q | 0, 21) | 0;
 m = $f(l | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 l = U() | 0;
 p = r & 2097151;
 e = eg(m | 0, l | 0, 21) | 0;
 f = $f(e | 0, U() | 0, f & 2097151 | 0, 0) | 0;
 e = U() | 0;
 k = m & 2097151;
 a[b >> 0] = la;
 b = fg(la | 0, ka | 0, 8) | 0;
 U() | 0;
 a[ma >> 0] = b;
 b = fg(la | 0, ka | 0, 16) | 0;
 U() | 0;
 ka = gg(fa | 0, 0, 5) | 0;
 U() | 0;
 a[ja >> 0] = ka | b & 31;
 b = fg(ha | 0, ga | 0, 3) | 0;
 U() | 0;
 a[ia >> 0] = b;
 b = fg(ha | 0, ga | 0, 11) | 0;
 U() | 0;
 a[ea >> 0] = b;
 b = fg(fa | 0, 0, 19) | 0;
 fa = U() | 0;
 ea = gg(aa | 0, 0, 2) | 0;
 U() | 0 | fa;
 a[da >> 0] = ea | b;
 b = fg(ca | 0, ba | 0, 6) | 0;
 U() | 0;
 a[$ >> 0] = b;
 b = fg(aa | 0, 0, 14) | 0;
 aa = U() | 0;
 $ = gg(W | 0, 0, 7) | 0;
 U() | 0 | aa;
 a[_ >> 0] = $ | b;
 b = fg(Y | 0, X | 0, 1) | 0;
 U() | 0;
 a[Z >> 0] = b;
 b = fg(Y | 0, X | 0, 9) | 0;
 U() | 0;
 a[V >> 0] = b;
 b = fg(W | 0, 0, 17) | 0;
 W = U() | 0;
 V = gg(P | 0, 0, 4) | 0;
 U() | 0 | W;
 a[T >> 0] = V | b;
 b = fg(R | 0, Q | 0, 4) | 0;
 U() | 0;
 a[S >> 0] = b;
 b = fg(R | 0, Q | 0, 12) | 0;
 U() | 0;
 a[O >> 0] = b;
 b = fg(P | 0, 0, 20) | 0;
 P = U() | 0;
 O = gg(K | 0, 0, 1) | 0;
 U() | 0 | P;
 a[N >> 0] = O | b;
 b = fg(M | 0, L | 0, 7) | 0;
 U() | 0;
 a[J >> 0] = b;
 b = fg(K | 0, 0, 15) | 0;
 K = U() | 0;
 J = gg(E | 0, 0, 6) | 0;
 U() | 0 | K;
 a[I >> 0] = J | b;
 b = fg(G | 0, F | 0, 2) | 0;
 U() | 0;
 a[H >> 0] = b;
 b = fg(G | 0, F | 0, 10) | 0;
 U() | 0;
 a[D >> 0] = b;
 b = fg(E | 0, 0, 18) | 0;
 E = U() | 0;
 D = gg(A | 0, z | 0, 3) | 0;
 U() | 0 | E;
 a[C >> 0] = D | b;
 b = fg(A | 0, z | 0, 5) | 0;
 U() | 0;
 a[B >> 0] = b;
 b = fg(A | 0, z | 0, 13) | 0;
 U() | 0;
 a[y >> 0] = b;
 a[x >> 0] = v;
 b = fg(v | 0, u | 0, 8) | 0;
 U() | 0;
 a[w >> 0] = b;
 b = fg(v | 0, u | 0, 16) | 0;
 U() | 0;
 u = gg(p | 0, 0, 5) | 0;
 U() | 0;
 a[t >> 0] = u | b & 31;
 b = fg(r | 0, q | 0, 3) | 0;
 U() | 0;
 a[s >> 0] = b;
 b = fg(r | 0, q | 0, 11) | 0;
 U() | 0;
 a[o >> 0] = b;
 b = fg(p | 0, 0, 19) | 0;
 p = U() | 0;
 o = gg(k | 0, 0, 2) | 0;
 U() | 0 | p;
 a[n >> 0] = o | b;
 b = fg(m | 0, l | 0, 6) | 0;
 U() | 0;
 a[j >> 0] = b;
 b = fg(k | 0, 0, 14) | 0;
 k = U() | 0;
 j = gg(f | 0, e | 0, 7) | 0;
 U() | 0 | k;
 a[i >> 0] = j | b;
 b = fg(f | 0, e | 0, 1) | 0;
 U() | 0;
 a[h >> 0] = b;
 b = fg(f | 0, e | 0, 9) | 0;
 U() | 0;
 a[g >> 0] = b;
 b = eg(f | 0, e | 0, 17) | 0;
 U() | 0;
 a[c >> 0] = b;
 return;
}

function Be(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
 q = k;
 k = k + 16 | 0;
 o = q;
 do if (a >>> 0 < 245) {
  l = a >>> 0 < 11 ? 16 : a + 11 & -8;
  a = l >>> 3;
  n = c[9989] | 0;
  b = n >>> a;
  if (b & 3 | 0) {
   a = (b & 1 ^ 1) + a | 0;
   b = 39996 + (a << 1 << 2) | 0;
   d = b + 8 | 0;
   e = c[d >> 2] | 0;
   f = e + 8 | 0;
   g = c[f >> 2] | 0;
   if ((g | 0) == (b | 0)) c[9989] = n & ~(1 << a); else {
    c[g + 12 >> 2] = b;
    c[d >> 2] = g;
   }
   p = a << 3;
   c[e + 4 >> 2] = p | 3;
   p = e + p + 4 | 0;
   c[p >> 2] = c[p >> 2] | 1;
   p = f;
   k = q;
   return p | 0;
  }
  m = c[9991] | 0;
  if (l >>> 0 > m >>> 0) {
   if (b | 0) {
    i = 2 << a;
    a = b << a & (i | 0 - i);
    a = (a & 0 - a) + -1 | 0;
    i = a >>> 12 & 16;
    a = a >>> i;
    d = a >>> 5 & 8;
    a = a >>> d;
    g = a >>> 2 & 4;
    a = a >>> g;
    b = a >>> 1 & 2;
    a = a >>> b;
    e = a >>> 1 & 1;
    e = (d | i | g | b | e) + (a >>> e) | 0;
    a = 39996 + (e << 1 << 2) | 0;
    b = a + 8 | 0;
    g = c[b >> 2] | 0;
    i = g + 8 | 0;
    d = c[i >> 2] | 0;
    if ((d | 0) == (a | 0)) {
     b = n & ~(1 << e);
     c[9989] = b;
    } else {
     c[d + 12 >> 2] = a;
     c[b >> 2] = d;
     b = n;
    }
    p = e << 3;
    h = p - l | 0;
    c[g + 4 >> 2] = l | 3;
    f = g + l | 0;
    c[f + 4 >> 2] = h | 1;
    c[g + p >> 2] = h;
    if (m | 0) {
     e = c[9994] | 0;
     a = m >>> 3;
     d = 39996 + (a << 1 << 2) | 0;
     a = 1 << a;
     if (!(b & a)) {
      c[9989] = b | a;
      a = d;
      b = d + 8 | 0;
     } else {
      b = d + 8 | 0;
      a = c[b >> 2] | 0;
     }
     c[b >> 2] = e;
     c[a + 12 >> 2] = e;
     c[e + 8 >> 2] = a;
     c[e + 12 >> 2] = d;
    }
    c[9991] = h;
    c[9994] = f;
    p = i;
    k = q;
    return p | 0;
   }
   g = c[9990] | 0;
   if (g) {
    b = (g & 0 - g) + -1 | 0;
    f = b >>> 12 & 16;
    b = b >>> f;
    e = b >>> 5 & 8;
    b = b >>> e;
    h = b >>> 2 & 4;
    b = b >>> h;
    i = b >>> 1 & 2;
    b = b >>> i;
    j = b >>> 1 & 1;
    j = c[40260 + ((e | f | h | i | j) + (b >>> j) << 2) >> 2] | 0;
    b = j;
    i = j;
    j = (c[j + 4 >> 2] & -8) - l | 0;
    while (1) {
     a = c[b + 16 >> 2] | 0;
     if (!a) {
      a = c[b + 20 >> 2] | 0;
      if (!a) break;
     }
     h = (c[a + 4 >> 2] & -8) - l | 0;
     f = h >>> 0 < j >>> 0;
     b = a;
     i = f ? a : i;
     j = f ? h : j;
    }
    h = i + l | 0;
    if (h >>> 0 > i >>> 0) {
     f = c[i + 24 >> 2] | 0;
     a = c[i + 12 >> 2] | 0;
     do if ((a | 0) == (i | 0)) {
      b = i + 20 | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       b = i + 16 | 0;
       a = c[b >> 2] | 0;
       if (!a) {
        d = 0;
        break;
       }
      }
      while (1) {
       e = a + 20 | 0;
       d = c[e >> 2] | 0;
       if (!d) {
        e = a + 16 | 0;
        d = c[e >> 2] | 0;
        if (!d) break; else {
         a = d;
         b = e;
        }
       } else {
        a = d;
        b = e;
       }
      }
      c[b >> 2] = 0;
      d = a;
     } else {
      d = c[i + 8 >> 2] | 0;
      c[d + 12 >> 2] = a;
      c[a + 8 >> 2] = d;
      d = a;
     } while (0);
     do if (f | 0) {
      a = c[i + 28 >> 2] | 0;
      b = 40260 + (a << 2) | 0;
      if ((i | 0) == (c[b >> 2] | 0)) {
       c[b >> 2] = d;
       if (!d) {
        c[9990] = g & ~(1 << a);
        break;
       }
      } else {
       p = f + 16 | 0;
       c[((c[p >> 2] | 0) == (i | 0) ? p : f + 20 | 0) >> 2] = d;
       if (!d) break;
      }
      c[d + 24 >> 2] = f;
      a = c[i + 16 >> 2] | 0;
      if (a | 0) {
       c[d + 16 >> 2] = a;
       c[a + 24 >> 2] = d;
      }
      a = c[i + 20 >> 2] | 0;
      if (a | 0) {
       c[d + 20 >> 2] = a;
       c[a + 24 >> 2] = d;
      }
     } while (0);
     if (j >>> 0 < 16) {
      p = j + l | 0;
      c[i + 4 >> 2] = p | 3;
      p = i + p + 4 | 0;
      c[p >> 2] = c[p >> 2] | 1;
     } else {
      c[i + 4 >> 2] = l | 3;
      c[h + 4 >> 2] = j | 1;
      c[h + j >> 2] = j;
      if (m | 0) {
       e = c[9994] | 0;
       a = m >>> 3;
       d = 39996 + (a << 1 << 2) | 0;
       a = 1 << a;
       if (!(a & n)) {
        c[9989] = a | n;
        a = d;
        b = d + 8 | 0;
       } else {
        b = d + 8 | 0;
        a = c[b >> 2] | 0;
       }
       c[b >> 2] = e;
       c[a + 12 >> 2] = e;
       c[e + 8 >> 2] = a;
       c[e + 12 >> 2] = d;
      }
      c[9991] = j;
      c[9994] = h;
     }
     p = i + 8 | 0;
     k = q;
     return p | 0;
    }
   }
  }
 } else if (a >>> 0 > 4294967231) l = -1; else {
  a = a + 11 | 0;
  l = a & -8;
  j = c[9990] | 0;
  if (j) {
   d = 0 - l | 0;
   a = a >>> 8;
   if (!a) h = 0; else if (l >>> 0 > 16777215) h = 31; else {
    n = (a + 1048320 | 0) >>> 16 & 8;
    p = a << n;
    m = (p + 520192 | 0) >>> 16 & 4;
    p = p << m;
    h = (p + 245760 | 0) >>> 16 & 2;
    h = 14 - (m | n | h) + (p << h >>> 15) | 0;
    h = l >>> (h + 7 | 0) & 1 | h << 1;
   }
   b = c[40260 + (h << 2) >> 2] | 0;
   a : do if (!b) {
    b = 0;
    a = 0;
    p = 61;
   } else {
    a = 0;
    g = l << ((h | 0) == 31 ? 0 : 25 - (h >>> 1) | 0);
    e = 0;
    while (1) {
     f = (c[b + 4 >> 2] & -8) - l | 0;
     if (f >>> 0 < d >>> 0) if (!f) {
      a = b;
      d = 0;
      p = 65;
      break a;
     } else {
      a = b;
      d = f;
     }
     p = c[b + 20 >> 2] | 0;
     b = c[b + 16 + (g >>> 31 << 2) >> 2] | 0;
     e = (p | 0) == 0 | (p | 0) == (b | 0) ? e : p;
     if (!b) {
      b = e;
      p = 61;
      break;
     } else g = g << 1;
    }
   } while (0);
   if ((p | 0) == 61) {
    if ((b | 0) == 0 & (a | 0) == 0) {
     a = 2 << h;
     a = (a | 0 - a) & j;
     if (!a) break;
     n = (a & 0 - a) + -1 | 0;
     h = n >>> 12 & 16;
     n = n >>> h;
     g = n >>> 5 & 8;
     n = n >>> g;
     i = n >>> 2 & 4;
     n = n >>> i;
     m = n >>> 1 & 2;
     n = n >>> m;
     b = n >>> 1 & 1;
     a = 0;
     b = c[40260 + ((g | h | i | m | b) + (n >>> b) << 2) >> 2] | 0;
    }
    if (!b) {
     i = a;
     g = d;
    } else p = 65;
   }
   if ((p | 0) == 65) {
    e = b;
    while (1) {
     n = (c[e + 4 >> 2] & -8) - l | 0;
     b = n >>> 0 < d >>> 0;
     d = b ? n : d;
     a = b ? e : a;
     b = c[e + 16 >> 2] | 0;
     if (!b) b = c[e + 20 >> 2] | 0;
     if (!b) {
      i = a;
      g = d;
      break;
     } else e = b;
    }
   }
   if (i) if (g >>> 0 < ((c[9991] | 0) - l | 0) >>> 0) {
    h = i + l | 0;
    if (h >>> 0 > i >>> 0) {
     f = c[i + 24 >> 2] | 0;
     a = c[i + 12 >> 2] | 0;
     do if ((a | 0) == (i | 0)) {
      b = i + 20 | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       b = i + 16 | 0;
       a = c[b >> 2] | 0;
       if (!a) {
        a = 0;
        break;
       }
      }
      while (1) {
       e = a + 20 | 0;
       d = c[e >> 2] | 0;
       if (!d) {
        e = a + 16 | 0;
        d = c[e >> 2] | 0;
        if (!d) break; else {
         a = d;
         b = e;
        }
       } else {
        a = d;
        b = e;
       }
      }
      c[b >> 2] = 0;
     } else {
      p = c[i + 8 >> 2] | 0;
      c[p + 12 >> 2] = a;
      c[a + 8 >> 2] = p;
     } while (0);
     do if (!f) e = j; else {
      b = c[i + 28 >> 2] | 0;
      d = 40260 + (b << 2) | 0;
      if ((i | 0) == (c[d >> 2] | 0)) {
       c[d >> 2] = a;
       if (!a) {
        e = j & ~(1 << b);
        c[9990] = e;
        break;
       }
      } else {
       p = f + 16 | 0;
       c[((c[p >> 2] | 0) == (i | 0) ? p : f + 20 | 0) >> 2] = a;
       if (!a) {
        e = j;
        break;
       }
      }
      c[a + 24 >> 2] = f;
      b = c[i + 16 >> 2] | 0;
      if (b | 0) {
       c[a + 16 >> 2] = b;
       c[b + 24 >> 2] = a;
      }
      b = c[i + 20 >> 2] | 0;
      if (!b) e = j; else {
       c[a + 20 >> 2] = b;
       c[b + 24 >> 2] = a;
       e = j;
      }
     } while (0);
     b : do if (g >>> 0 < 16) {
      p = g + l | 0;
      c[i + 4 >> 2] = p | 3;
      p = i + p + 4 | 0;
      c[p >> 2] = c[p >> 2] | 1;
     } else {
      c[i + 4 >> 2] = l | 3;
      c[h + 4 >> 2] = g | 1;
      c[h + g >> 2] = g;
      a = g >>> 3;
      if (g >>> 0 < 256) {
       d = 39996 + (a << 1 << 2) | 0;
       b = c[9989] | 0;
       a = 1 << a;
       if (!(b & a)) {
        c[9989] = b | a;
        a = d;
        b = d + 8 | 0;
       } else {
        b = d + 8 | 0;
        a = c[b >> 2] | 0;
       }
       c[b >> 2] = h;
       c[a + 12 >> 2] = h;
       c[h + 8 >> 2] = a;
       c[h + 12 >> 2] = d;
       break;
      }
      a = g >>> 8;
      if (!a) d = 0; else if (g >>> 0 > 16777215) d = 31; else {
       o = (a + 1048320 | 0) >>> 16 & 8;
       p = a << o;
       n = (p + 520192 | 0) >>> 16 & 4;
       p = p << n;
       d = (p + 245760 | 0) >>> 16 & 2;
       d = 14 - (n | o | d) + (p << d >>> 15) | 0;
       d = g >>> (d + 7 | 0) & 1 | d << 1;
      }
      a = 40260 + (d << 2) | 0;
      c[h + 28 >> 2] = d;
      b = h + 16 | 0;
      c[b + 4 >> 2] = 0;
      c[b >> 2] = 0;
      b = 1 << d;
      if (!(e & b)) {
       c[9990] = e | b;
       c[a >> 2] = h;
       c[h + 24 >> 2] = a;
       c[h + 12 >> 2] = h;
       c[h + 8 >> 2] = h;
       break;
      }
      a = c[a >> 2] | 0;
      c : do if ((c[a + 4 >> 2] & -8 | 0) != (g | 0)) {
       e = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
       while (1) {
        d = a + 16 + (e >>> 31 << 2) | 0;
        b = c[d >> 2] | 0;
        if (!b) break;
        if ((c[b + 4 >> 2] & -8 | 0) == (g | 0)) {
         a = b;
         break c;
        } else {
         e = e << 1;
         a = b;
        }
       }
       c[d >> 2] = h;
       c[h + 24 >> 2] = a;
       c[h + 12 >> 2] = h;
       c[h + 8 >> 2] = h;
       break b;
      } while (0);
      o = a + 8 | 0;
      p = c[o >> 2] | 0;
      c[p + 12 >> 2] = h;
      c[o >> 2] = h;
      c[h + 8 >> 2] = p;
      c[h + 12 >> 2] = a;
      c[h + 24 >> 2] = 0;
     } while (0);
     p = i + 8 | 0;
     k = q;
     return p | 0;
    }
   }
  }
 } while (0);
 d = c[9991] | 0;
 if (d >>> 0 >= l >>> 0) {
  a = d - l | 0;
  b = c[9994] | 0;
  if (a >>> 0 > 15) {
   p = b + l | 0;
   c[9994] = p;
   c[9991] = a;
   c[p + 4 >> 2] = a | 1;
   c[b + d >> 2] = a;
   c[b + 4 >> 2] = l | 3;
  } else {
   c[9991] = 0;
   c[9994] = 0;
   c[b + 4 >> 2] = d | 3;
   p = b + d + 4 | 0;
   c[p >> 2] = c[p >> 2] | 1;
  }
  p = b + 8 | 0;
  k = q;
  return p | 0;
 }
 g = c[9992] | 0;
 if (g >>> 0 > l >>> 0) {
  n = g - l | 0;
  c[9992] = n;
  p = c[9995] | 0;
  o = p + l | 0;
  c[9995] = o;
  c[o + 4 >> 2] = n | 1;
  c[p + 4 >> 2] = l | 3;
  p = p + 8 | 0;
  k = q;
  return p | 0;
 }
 if (!(c[10107] | 0)) {
  c[10109] = 4096;
  c[10108] = 4096;
  c[10110] = -1;
  c[10111] = -1;
  c[10112] = 0;
  c[10100] = 0;
  c[10107] = o & -16 ^ 1431655768;
  a = 4096;
 } else a = c[10109] | 0;
 h = l + 48 | 0;
 i = l + 47 | 0;
 f = a + i | 0;
 e = 0 - a | 0;
 j = f & e;
 if (j >>> 0 <= l >>> 0) {
  p = 0;
  k = q;
  return p | 0;
 }
 a = c[10099] | 0;
 if (a | 0) {
  n = c[10097] | 0;
  o = n + j | 0;
  if (o >>> 0 <= n >>> 0 | o >>> 0 > a >>> 0) {
   p = 0;
   k = q;
   return p | 0;
  }
 }
 d : do if (!(c[10100] & 4)) {
  b = c[9995] | 0;
  e : do if (!b) p = 128; else {
   d = 40404;
   while (1) {
    a = c[d >> 2] | 0;
    if (a >>> 0 <= b >>> 0) if ((a + (c[d + 4 >> 2] | 0) | 0) >>> 0 > b >>> 0) break;
    a = c[d + 8 >> 2] | 0;
    if (!a) {
     p = 128;
     break e;
    } else d = a;
   }
   a = f - g & e;
   if (a >>> 0 < 2147483647) {
    e = ng(a | 0) | 0;
    if ((e | 0) == ((c[d >> 2] | 0) + (c[d + 4 >> 2] | 0) | 0)) {
     if ((e | 0) != (-1 | 0)) {
      p = 145;
      break d;
     }
    } else p = 136;
   } else a = 0;
  } while (0);
  do if ((p | 0) == 128) {
   e = ng(0) | 0;
   if ((e | 0) == (-1 | 0)) a = 0; else {
    a = e;
    b = c[10108] | 0;
    d = b + -1 | 0;
    a = ((d & a | 0) == 0 ? 0 : (d + a & 0 - b) - a | 0) + j | 0;
    b = c[10097] | 0;
    d = a + b | 0;
    if (a >>> 0 > l >>> 0 & a >>> 0 < 2147483647) {
     f = c[10099] | 0;
     if (f | 0) if (d >>> 0 <= b >>> 0 | d >>> 0 > f >>> 0) {
      a = 0;
      break;
     }
     b = ng(a | 0) | 0;
     if ((b | 0) == (e | 0)) {
      p = 145;
      break d;
     } else {
      e = b;
      p = 136;
     }
    } else a = 0;
   }
  } while (0);
  do if ((p | 0) == 136) {
   d = 0 - a | 0;
   if (!(h >>> 0 > a >>> 0 & (a >>> 0 < 2147483647 & (e | 0) != (-1 | 0)))) if ((e | 0) == (-1 | 0)) {
    a = 0;
    break;
   } else {
    p = 145;
    break d;
   }
   b = c[10109] | 0;
   b = i - a + b & 0 - b;
   if (b >>> 0 >= 2147483647) {
    p = 145;
    break d;
   }
   if ((ng(b | 0) | 0) == (-1 | 0)) {
    ng(d | 0) | 0;
    a = 0;
    break;
   } else {
    a = b + a | 0;
    p = 145;
    break d;
   }
  } while (0);
  c[10100] = c[10100] | 4;
  p = 143;
 } else {
  a = 0;
  p = 143;
 } while (0);
 if ((p | 0) == 143) if (j >>> 0 < 2147483647) {
  e = ng(j | 0) | 0;
  o = ng(0) | 0;
  b = o - e | 0;
  d = b >>> 0 > (l + 40 | 0) >>> 0;
  if (!((e | 0) == (-1 | 0) | d ^ 1 | e >>> 0 < o >>> 0 & ((e | 0) != (-1 | 0) & (o | 0) != (-1 | 0)) ^ 1)) {
   a = d ? b : a;
   p = 145;
  }
 }
 if ((p | 0) == 145) {
  b = (c[10097] | 0) + a | 0;
  c[10097] = b;
  if (b >>> 0 > (c[10098] | 0) >>> 0) c[10098] = b;
  j = c[9995] | 0;
  f : do if (!j) {
   p = c[9993] | 0;
   if ((p | 0) == 0 | e >>> 0 < p >>> 0) c[9993] = e;
   c[10101] = e;
   c[10102] = a;
   c[10104] = 0;
   c[9998] = c[10107];
   c[9997] = -1;
   c[10002] = 39996;
   c[10001] = 39996;
   c[10004] = 40004;
   c[10003] = 40004;
   c[10006] = 40012;
   c[10005] = 40012;
   c[10008] = 40020;
   c[10007] = 40020;
   c[10010] = 40028;
   c[10009] = 40028;
   c[10012] = 40036;
   c[10011] = 40036;
   c[10014] = 40044;
   c[10013] = 40044;
   c[10016] = 40052;
   c[10015] = 40052;
   c[10018] = 40060;
   c[10017] = 40060;
   c[10020] = 40068;
   c[10019] = 40068;
   c[10022] = 40076;
   c[10021] = 40076;
   c[10024] = 40084;
   c[10023] = 40084;
   c[10026] = 40092;
   c[10025] = 40092;
   c[10028] = 40100;
   c[10027] = 40100;
   c[10030] = 40108;
   c[10029] = 40108;
   c[10032] = 40116;
   c[10031] = 40116;
   c[10034] = 40124;
   c[10033] = 40124;
   c[10036] = 40132;
   c[10035] = 40132;
   c[10038] = 40140;
   c[10037] = 40140;
   c[10040] = 40148;
   c[10039] = 40148;
   c[10042] = 40156;
   c[10041] = 40156;
   c[10044] = 40164;
   c[10043] = 40164;
   c[10046] = 40172;
   c[10045] = 40172;
   c[10048] = 40180;
   c[10047] = 40180;
   c[10050] = 40188;
   c[10049] = 40188;
   c[10052] = 40196;
   c[10051] = 40196;
   c[10054] = 40204;
   c[10053] = 40204;
   c[10056] = 40212;
   c[10055] = 40212;
   c[10058] = 40220;
   c[10057] = 40220;
   c[10060] = 40228;
   c[10059] = 40228;
   c[10062] = 40236;
   c[10061] = 40236;
   c[10064] = 40244;
   c[10063] = 40244;
   p = a + -40 | 0;
   n = e + 8 | 0;
   n = (n & 7 | 0) == 0 ? 0 : 0 - n & 7;
   o = e + n | 0;
   n = p - n | 0;
   c[9995] = o;
   c[9992] = n;
   c[o + 4 >> 2] = n | 1;
   c[e + p + 4 >> 2] = 40;
   c[9996] = c[10111];
  } else {
   b = 40404;
   do {
    d = c[b >> 2] | 0;
    f = c[b + 4 >> 2] | 0;
    if ((e | 0) == (d + f | 0)) {
     p = 154;
     break;
    }
    b = c[b + 8 >> 2] | 0;
   } while ((b | 0) != 0);
   if ((p | 0) == 154) {
    g = b + 4 | 0;
    if (!(c[b + 12 >> 2] & 8)) if (e >>> 0 > j >>> 0 & d >>> 0 <= j >>> 0) {
     c[g >> 2] = f + a;
     p = (c[9992] | 0) + a | 0;
     n = j + 8 | 0;
     n = (n & 7 | 0) == 0 ? 0 : 0 - n & 7;
     o = j + n | 0;
     n = p - n | 0;
     c[9995] = o;
     c[9992] = n;
     c[o + 4 >> 2] = n | 1;
     c[j + p + 4 >> 2] = 40;
     c[9996] = c[10111];
     break;
    }
   }
   if (e >>> 0 < (c[9993] | 0) >>> 0) c[9993] = e;
   d = e + a | 0;
   b = 40404;
   do {
    if ((c[b >> 2] | 0) == (d | 0)) {
     p = 162;
     break;
    }
    b = c[b + 8 >> 2] | 0;
   } while ((b | 0) != 0);
   if ((p | 0) == 162) if (!(c[b + 12 >> 2] & 8)) {
    c[b >> 2] = e;
    n = b + 4 | 0;
    c[n >> 2] = (c[n >> 2] | 0) + a;
    n = e + 8 | 0;
    n = e + ((n & 7 | 0) == 0 ? 0 : 0 - n & 7) | 0;
    a = d + 8 | 0;
    a = d + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;
    m = n + l | 0;
    i = a - n - l | 0;
    c[n + 4 >> 2] = l | 3;
    g : do if ((j | 0) == (a | 0)) {
     p = (c[9992] | 0) + i | 0;
     c[9992] = p;
     c[9995] = m;
     c[m + 4 >> 2] = p | 1;
    } else {
     if ((c[9994] | 0) == (a | 0)) {
      p = (c[9991] | 0) + i | 0;
      c[9991] = p;
      c[9994] = m;
      c[m + 4 >> 2] = p | 1;
      c[m + p >> 2] = p;
      break;
     }
     b = c[a + 4 >> 2] | 0;
     if ((b & 3 | 0) == 1) {
      h = b & -8;
      e = b >>> 3;
      h : do if (b >>> 0 < 256) {
       b = c[a + 8 >> 2] | 0;
       d = c[a + 12 >> 2] | 0;
       if ((d | 0) == (b | 0)) {
        c[9989] = c[9989] & ~(1 << e);
        break;
       } else {
        c[b + 12 >> 2] = d;
        c[d + 8 >> 2] = b;
        break;
       }
      } else {
       g = c[a + 24 >> 2] | 0;
       b = c[a + 12 >> 2] | 0;
       do if ((b | 0) == (a | 0)) {
        d = a + 16 | 0;
        e = d + 4 | 0;
        b = c[e >> 2] | 0;
        if (!b) {
         b = c[d >> 2] | 0;
         if (!b) {
          b = 0;
          break;
         }
        } else d = e;
        while (1) {
         f = b + 20 | 0;
         e = c[f >> 2] | 0;
         if (!e) {
          f = b + 16 | 0;
          e = c[f >> 2] | 0;
          if (!e) break; else {
           b = e;
           d = f;
          }
         } else {
          b = e;
          d = f;
         }
        }
        c[d >> 2] = 0;
       } else {
        p = c[a + 8 >> 2] | 0;
        c[p + 12 >> 2] = b;
        c[b + 8 >> 2] = p;
       } while (0);
       if (!g) break;
       d = c[a + 28 >> 2] | 0;
       e = 40260 + (d << 2) | 0;
       do if ((c[e >> 2] | 0) == (a | 0)) {
        c[e >> 2] = b;
        if (b | 0) break;
        c[9990] = c[9990] & ~(1 << d);
        break h;
       } else {
        p = g + 16 | 0;
        c[((c[p >> 2] | 0) == (a | 0) ? p : g + 20 | 0) >> 2] = b;
        if (!b) break h;
       } while (0);
       c[b + 24 >> 2] = g;
       d = a + 16 | 0;
       e = c[d >> 2] | 0;
       if (e | 0) {
        c[b + 16 >> 2] = e;
        c[e + 24 >> 2] = b;
       }
       d = c[d + 4 >> 2] | 0;
       if (!d) break;
       c[b + 20 >> 2] = d;
       c[d + 24 >> 2] = b;
      } while (0);
      a = a + h | 0;
      f = h + i | 0;
     } else f = i;
     a = a + 4 | 0;
     c[a >> 2] = c[a >> 2] & -2;
     c[m + 4 >> 2] = f | 1;
     c[m + f >> 2] = f;
     a = f >>> 3;
     if (f >>> 0 < 256) {
      d = 39996 + (a << 1 << 2) | 0;
      b = c[9989] | 0;
      a = 1 << a;
      if (!(b & a)) {
       c[9989] = b | a;
       a = d;
       b = d + 8 | 0;
      } else {
       b = d + 8 | 0;
       a = c[b >> 2] | 0;
      }
      c[b >> 2] = m;
      c[a + 12 >> 2] = m;
      c[m + 8 >> 2] = a;
      c[m + 12 >> 2] = d;
      break;
     }
     a = f >>> 8;
     do if (!a) e = 0; else {
      if (f >>> 0 > 16777215) {
       e = 31;
       break;
      }
      o = (a + 1048320 | 0) >>> 16 & 8;
      p = a << o;
      l = (p + 520192 | 0) >>> 16 & 4;
      p = p << l;
      e = (p + 245760 | 0) >>> 16 & 2;
      e = 14 - (l | o | e) + (p << e >>> 15) | 0;
      e = f >>> (e + 7 | 0) & 1 | e << 1;
     } while (0);
     a = 40260 + (e << 2) | 0;
     c[m + 28 >> 2] = e;
     b = m + 16 | 0;
     c[b + 4 >> 2] = 0;
     c[b >> 2] = 0;
     b = c[9990] | 0;
     d = 1 << e;
     if (!(b & d)) {
      c[9990] = b | d;
      c[a >> 2] = m;
      c[m + 24 >> 2] = a;
      c[m + 12 >> 2] = m;
      c[m + 8 >> 2] = m;
      break;
     }
     a = c[a >> 2] | 0;
     i : do if ((c[a + 4 >> 2] & -8 | 0) != (f | 0)) {
      e = f << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
      while (1) {
       d = a + 16 + (e >>> 31 << 2) | 0;
       b = c[d >> 2] | 0;
       if (!b) break;
       if ((c[b + 4 >> 2] & -8 | 0) == (f | 0)) {
        a = b;
        break i;
       } else {
        e = e << 1;
        a = b;
       }
      }
      c[d >> 2] = m;
      c[m + 24 >> 2] = a;
      c[m + 12 >> 2] = m;
      c[m + 8 >> 2] = m;
      break g;
     } while (0);
     o = a + 8 | 0;
     p = c[o >> 2] | 0;
     c[p + 12 >> 2] = m;
     c[o >> 2] = m;
     c[m + 8 >> 2] = p;
     c[m + 12 >> 2] = a;
     c[m + 24 >> 2] = 0;
    } while (0);
    p = n + 8 | 0;
    k = q;
    return p | 0;
   }
   d = 40404;
   while (1) {
    b = c[d >> 2] | 0;
    if (b >>> 0 <= j >>> 0) {
     b = b + (c[d + 4 >> 2] | 0) | 0;
     if (b >>> 0 > j >>> 0) break;
    }
    d = c[d + 8 >> 2] | 0;
   }
   g = b + -47 | 0;
   d = g + 8 | 0;
   d = g + ((d & 7 | 0) == 0 ? 0 : 0 - d & 7) | 0;
   g = j + 16 | 0;
   d = d >>> 0 < g >>> 0 ? j : d;
   p = d + 8 | 0;
   f = a + -40 | 0;
   n = e + 8 | 0;
   n = (n & 7 | 0) == 0 ? 0 : 0 - n & 7;
   o = e + n | 0;
   n = f - n | 0;
   c[9995] = o;
   c[9992] = n;
   c[o + 4 >> 2] = n | 1;
   c[e + f + 4 >> 2] = 40;
   c[9996] = c[10111];
   f = d + 4 | 0;
   c[f >> 2] = 27;
   c[p >> 2] = c[10101];
   c[p + 4 >> 2] = c[10102];
   c[p + 8 >> 2] = c[10103];
   c[p + 12 >> 2] = c[10104];
   c[10101] = e;
   c[10102] = a;
   c[10104] = 0;
   c[10103] = p;
   a = d + 24 | 0;
   do {
    p = a;
    a = a + 4 | 0;
    c[a >> 2] = 7;
   } while ((p + 8 | 0) >>> 0 < b >>> 0);
   if ((d | 0) != (j | 0)) {
    h = d - j | 0;
    c[f >> 2] = c[f >> 2] & -2;
    c[j + 4 >> 2] = h | 1;
    c[d >> 2] = h;
    a = h >>> 3;
    if (h >>> 0 < 256) {
     d = 39996 + (a << 1 << 2) | 0;
     b = c[9989] | 0;
     a = 1 << a;
     if (!(b & a)) {
      c[9989] = b | a;
      a = d;
      b = d + 8 | 0;
     } else {
      b = d + 8 | 0;
      a = c[b >> 2] | 0;
     }
     c[b >> 2] = j;
     c[a + 12 >> 2] = j;
     c[j + 8 >> 2] = a;
     c[j + 12 >> 2] = d;
     break;
    }
    a = h >>> 8;
    if (!a) e = 0; else if (h >>> 0 > 16777215) e = 31; else {
     o = (a + 1048320 | 0) >>> 16 & 8;
     p = a << o;
     n = (p + 520192 | 0) >>> 16 & 4;
     p = p << n;
     e = (p + 245760 | 0) >>> 16 & 2;
     e = 14 - (n | o | e) + (p << e >>> 15) | 0;
     e = h >>> (e + 7 | 0) & 1 | e << 1;
    }
    d = 40260 + (e << 2) | 0;
    c[j + 28 >> 2] = e;
    c[j + 20 >> 2] = 0;
    c[g >> 2] = 0;
    a = c[9990] | 0;
    b = 1 << e;
    if (!(a & b)) {
     c[9990] = a | b;
     c[d >> 2] = j;
     c[j + 24 >> 2] = d;
     c[j + 12 >> 2] = j;
     c[j + 8 >> 2] = j;
     break;
    }
    a = c[d >> 2] | 0;
    j : do if ((c[a + 4 >> 2] & -8 | 0) != (h | 0)) {
     e = h << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
     while (1) {
      d = a + 16 + (e >>> 31 << 2) | 0;
      b = c[d >> 2] | 0;
      if (!b) break;
      if ((c[b + 4 >> 2] & -8 | 0) == (h | 0)) {
       a = b;
       break j;
      } else {
       e = e << 1;
       a = b;
      }
     }
     c[d >> 2] = j;
     c[j + 24 >> 2] = a;
     c[j + 12 >> 2] = j;
     c[j + 8 >> 2] = j;
     break f;
    } while (0);
    o = a + 8 | 0;
    p = c[o >> 2] | 0;
    c[p + 12 >> 2] = j;
    c[o >> 2] = j;
    c[j + 8 >> 2] = p;
    c[j + 12 >> 2] = a;
    c[j + 24 >> 2] = 0;
   }
  } while (0);
  a = c[9992] | 0;
  if (a >>> 0 > l >>> 0) {
   n = a - l | 0;
   c[9992] = n;
   p = c[9995] | 0;
   o = p + l | 0;
   c[9995] = o;
   c[o + 4 >> 2] = n | 1;
   c[p + 4 >> 2] = l | 3;
   p = p + 8 | 0;
   k = q;
   return p | 0;
  }
 }
 c[(Pd() | 0) >> 2] = 12;
 p = 0;
 k = q;
 return p | 0;
}

function Dc(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0;
 Ka = k;
 k = k + 512 | 0;
 Ja = Ka + 480 | 0;
 g = Ka + 432 | 0;
 h = Ka + 384 | 0;
 X = Ka + 336 | 0;
 Y = Ka + 288 | 0;
 Z = Ka + 240 | 0;
 _ = Ka + 192 | 0;
 ba = Ka + 144 | 0;
 aa = Ka + 96 | 0;
 W = Ka + 48 | 0;
 Ia = Ka;
 y = d[e >> 0] | 0;
 v = gg(d[e + 1 >> 0] | 0 | 0, 0, 8) | 0;
 l = U() | 0;
 p = gg(d[e + 2 >> 0] | 0 | 0, 0, 16) | 0;
 l = l | (U() | 0);
 O = gg(d[e + 3 >> 0] | 0 | 0, 0, 24) | 0;
 l = l | (U() | 0);
 n = a[e + 6 >> 0] | 0;
 Q = d[e + 4 >> 0] | 0;
 i = gg(d[e + 5 >> 0] | 0 | 0, 0, 8) | 0;
 P = U() | 0;
 n = gg(n & 255 | 0, 0, 16) | 0;
 P = gg(i | Q | n | 0, P | (U() | 0) | 0, 6) | 0;
 n = U() | 0;
 Q = a[e + 9 >> 0] | 0;
 i = d[e + 7 >> 0] | 0;
 S = gg(d[e + 8 >> 0] | 0 | 0, 0, 8) | 0;
 B = U() | 0;
 Q = gg(Q & 255 | 0, 0, 16) | 0;
 B = gg(S | i | Q | 0, B | (U() | 0) | 0, 5) | 0;
 Q = U() | 0;
 i = a[e + 12 >> 0] | 0;
 S = d[e + 10 >> 0] | 0;
 z = gg(d[e + 11 >> 0] | 0 | 0, 0, 8) | 0;
 j = U() | 0;
 i = gg(i & 255 | 0, 0, 16) | 0;
 j = gg(z | S | i | 0, j | (U() | 0) | 0, 3) | 0;
 i = U() | 0;
 S = a[e + 15 >> 0] | 0;
 z = d[e + 13 >> 0] | 0;
 u = gg(d[e + 14 >> 0] | 0 | 0, 0, 8) | 0;
 R = U() | 0;
 S = gg(S & 255 | 0, 0, 16) | 0;
 R = gg(u | z | S | 0, R | (U() | 0) | 0, 2) | 0;
 S = U() | 0;
 z = d[e + 16 >> 0] | 0;
 u = gg(d[e + 17 >> 0] | 0 | 0, 0, 8) | 0;
 L = U() | 0;
 ca = gg(d[e + 18 >> 0] | 0 | 0, 0, 16) | 0;
 L = L | (U() | 0);
 f = gg(d[e + 19 >> 0] | 0 | 0, 0, 24) | 0;
 f = u | z | ca | f;
 L = L | (U() | 0);
 ca = a[e + 22 >> 0] | 0;
 z = d[e + 20 >> 0] | 0;
 u = gg(d[e + 21 >> 0] | 0 | 0, 0, 8) | 0;
 T = U() | 0;
 ca = gg(ca & 255 | 0, 0, 16) | 0;
 T = gg(u | z | ca | 0, T | (U() | 0) | 0, 7) | 0;
 ca = U() | 0;
 z = a[e + 25 >> 0] | 0;
 u = d[e + 23 >> 0] | 0;
 w = gg(d[e + 24 >> 0] | 0 | 0, 0, 8) | 0;
 A = U() | 0;
 z = gg(z & 255 | 0, 0, 16) | 0;
 A = gg(w | u | z | 0, A | (U() | 0) | 0, 5) | 0;
 z = U() | 0;
 u = a[e + 28 >> 0] | 0;
 w = d[e + 26 >> 0] | 0;
 t = gg(d[e + 27 >> 0] | 0 | 0, 0, 8) | 0;
 M = U() | 0;
 u = gg(u & 255 | 0, 0, 16) | 0;
 M = gg(t | w | u | 0, M | (U() | 0) | 0, 4) | 0;
 u = U() | 0;
 w = a[e + 31 >> 0] | 0;
 t = d[e + 29 >> 0] | 0;
 e = gg(d[e + 30 >> 0] | 0 | 0, 0, 8) | 0;
 x = U() | 0;
 w = gg(w & 255 | 0, 0, 16) | 0;
 x = gg(e | t | w | 0, x | (U() | 0) | 0, 2) | 0;
 w = U() | 0;
 t = $f(x | 0, w | 0, 16777216, 0) | 0;
 e = fg(t | 0, U() | 0, 25) | 0;
 e = _f(e | 0, U() | 0, 19, 0) | 0;
 l = $f(e | 0, U() | 0, v | y | p | O | 0, l | 0) | 0;
 O = U() | 0;
 p = $f(P | 0, n | 0, 16777216, 0) | 0;
 e = fg(p | 0, U() | 0, 25) | 0;
 e = $f(B | 0, Q | 0, e | 0, U() | 0) | 0;
 Q = U() | 0;
 p = ag(P | 0, n | 0, p & -33554432 | 0, 0) | 0;
 n = U() | 0;
 P = $f(j | 0, i | 0, 16777216, 0) | 0;
 B = fg(P | 0, U() | 0, 25) | 0;
 B = $f(R | 0, S | 0, B | 0, U() | 0) | 0;
 S = U() | 0;
 R = $f(f | 0, L | 0, 16777216, 0) | 0;
 y = fg(R | 0, U() | 0, 25) | 0;
 y = $f(T | 0, ca | 0, y | 0, U() | 0) | 0;
 ca = U() | 0;
 T = $f(A | 0, z | 0, 16777216, 0) | 0;
 v = fg(T | 0, U() | 0, 25) | 0;
 v = $f(M | 0, u | 0, v | 0, U() | 0) | 0;
 u = U() | 0;
 M = $f(l | 0, O | 0, 33554432, 0) | 0;
 N = fg(M | 0, U() | 0, 26) | 0;
 N = $f(p | 0, n | 0, N | 0, U() | 0) | 0;
 U() | 0;
 M = ag(l | 0, O | 0, M & -67108864 | 0, 0) | 0;
 U() | 0;
 O = $f(e | 0, Q | 0, 33554432, 0) | 0;
 l = fg(O | 0, U() | 0, 26) | 0;
 i = $f(l | 0, U() | 0, j | 0, i | 0) | 0;
 P = ag(i | 0, U() | 0, P & -33554432 | 0, 0) | 0;
 U() | 0;
 O = ag(e | 0, Q | 0, O & -67108864 | 0, 0) | 0;
 U() | 0;
 Q = $f(B | 0, S | 0, 33554432, 0) | 0;
 e = fg(Q | 0, U() | 0, 26) | 0;
 L = $f(e | 0, U() | 0, f | 0, L | 0) | 0;
 R = ag(L | 0, U() | 0, R & -33554432 | 0, 0) | 0;
 U() | 0;
 Q = ag(B | 0, S | 0, Q & -67108864 | 0, 0) | 0;
 U() | 0;
 S = $f(y | 0, ca | 0, 33554432, 0) | 0;
 B = fg(S | 0, U() | 0, 26) | 0;
 z = $f(B | 0, U() | 0, A | 0, z | 0) | 0;
 T = ag(z | 0, U() | 0, T & -33554432 | 0, 0) | 0;
 U() | 0;
 S = ag(y | 0, ca | 0, S & -67108864 | 0, 0) | 0;
 U() | 0;
 ca = $f(v | 0, u | 0, 33554432, 0) | 0;
 y = fg(ca | 0, U() | 0, 26) | 0;
 w = $f(y | 0, U() | 0, x | 0, w | 0) | 0;
 t = ag(w | 0, U() | 0, t & -33554432 | 0, 0) | 0;
 U() | 0;
 ca = ag(v | 0, u | 0, ca & -67108864 | 0, 0) | 0;
 U() | 0;
 c[g >> 2] = M;
 c[g + 4 >> 2] = N;
 c[g + 8 >> 2] = O;
 c[g + 12 >> 2] = P;
 c[g + 16 >> 2] = Q;
 c[g + 20 >> 2] = R;
 c[g + 24 >> 2] = S;
 c[g + 28 >> 2] = T;
 c[g + 32 >> 2] = ca;
 c[g + 36 >> 2] = t;
 jc(h, g);
 t = X + 4 | 0;
 ca = c[h + 4 >> 2] | 0;
 T = c[h + 8 >> 2] | 0;
 S = c[h + 12 >> 2] | 0;
 R = c[h + 16 >> 2] | 0;
 Q = c[h + 20 >> 2] | 0;
 P = c[h + 24 >> 2] | 0;
 O = c[h + 28 >> 2] | 0;
 N = c[h + 32 >> 2] | 0;
 M = c[h + 36 >> 2] | 0;
 u = X + 8 | 0;
 v = X + 12 | 0;
 w = X + 16 | 0;
 x = X + 20 | 0;
 y = X + 24 | 0;
 z = X + 28 | 0;
 A = X + 32 | 0;
 B = X + 36 | 0;
 L = (c[h >> 2] | 0) + 1 | 0;
 c[X >> 2] = L;
 c[t >> 2] = ca;
 c[u >> 2] = T;
 c[v >> 2] = S;
 c[w >> 2] = R;
 c[x >> 2] = Q;
 c[y >> 2] = P;
 c[z >> 2] = O;
 c[A >> 2] = N;
 c[B >> 2] = M;
 ic(Y, X);
 ec(Z, 31840, h);
 e = Y + 4 | 0;
 f = Y + 8 | 0;
 i = Y + 12 | 0;
 j = Y + 16 | 0;
 l = Y + 20 | 0;
 n = Y + 24 | 0;
 p = Y + 28 | 0;
 r = Y + 32 | 0;
 s = Y + 36 | 0;
 C = Z + 4 | 0;
 D = Z + 8 | 0;
 E = Z + 12 | 0;
 F = Z + 16 | 0;
 G = Z + 20 | 0;
 H = Z + 24 | 0;
 I = Z + 28 | 0;
 J = Z + 32 | 0;
 K = Z + 36 | 0;
 ma = (c[C >> 2] | 0) + (c[e >> 2] | 0) | 0;
 la = (c[D >> 2] | 0) + (c[f >> 2] | 0) | 0;
 ka = (c[E >> 2] | 0) + (c[i >> 2] | 0) | 0;
 ja = (c[F >> 2] | 0) + (c[j >> 2] | 0) | 0;
 ia = (c[G >> 2] | 0) + (c[l >> 2] | 0) | 0;
 ga = (c[H >> 2] | 0) + (c[n >> 2] | 0) | 0;
 fa = (c[I >> 2] | 0) + (c[p >> 2] | 0) | 0;
 ea = (c[J >> 2] | 0) + (c[r >> 2] | 0) | 0;
 da = (c[K >> 2] | 0) + (c[s >> 2] | 0) | 0;
 c[Y >> 2] = (c[Z >> 2] | 0) + (c[Y >> 2] | 0);
 c[e >> 2] = ma;
 c[f >> 2] = la;
 c[i >> 2] = ka;
 c[j >> 2] = ja;
 c[l >> 2] = ia;
 c[n >> 2] = ga;
 c[p >> 2] = fa;
 c[r >> 2] = ea;
 c[s >> 2] = da;
 rc(b, X, Y);
 ic(Z, b);
 ec(Y, Z, Y);
 ca = ca - (c[e >> 2] | 0) | 0;
 T = T - (c[f >> 2] | 0) | 0;
 S = S - (c[i >> 2] | 0) | 0;
 R = R - (c[j >> 2] | 0) | 0;
 Q = Q - (c[l >> 2] | 0) | 0;
 P = P - (c[n >> 2] | 0) | 0;
 O = O - (c[p >> 2] | 0) | 0;
 N = N - (c[r >> 2] | 0) | 0;
 M = M - (c[s >> 2] | 0) | 0;
 c[Z >> 2] = L - (c[Y >> 2] | 0);
 c[C >> 2] = ca;
 c[D >> 2] = T;
 c[E >> 2] = S;
 c[F >> 2] = R;
 c[G >> 2] = Q;
 c[H >> 2] = P;
 c[I >> 2] = O;
 c[J >> 2] = N;
 c[K >> 2] = M;
 M = c[7973] | 0;
 N = c[7974] | 0;
 O = c[7975] | 0;
 P = c[7976] | 0;
 Q = c[7977] | 0;
 R = c[7978] | 0;
 S = c[7979] | 0;
 T = c[7980] | 0;
 ca = c[7981] | 0;
 c[_ >> 2] = c[7972];
 L = _ + 4 | 0;
 c[L >> 2] = M;
 M = _ + 8 | 0;
 c[M >> 2] = N;
 N = _ + 12 | 0;
 c[N >> 2] = O;
 O = _ + 16 | 0;
 c[O >> 2] = P;
 P = _ + 20 | 0;
 c[P >> 2] = Q;
 Q = _ + 24 | 0;
 c[Q >> 2] = R;
 R = _ + 28 | 0;
 c[R >> 2] = S;
 S = _ + 32 | 0;
 c[S >> 2] = T;
 T = _ + 36 | 0;
 c[T >> 2] = ca;
 sc(Ja, Z);
 ca = Ja + 1 | 0;
 da = Ja + 2 | 0;
 ea = Ja + 3 | 0;
 fa = Ja + 4 | 0;
 ga = Ja + 5 | 0;
 ia = Ja + 6 | 0;
 ja = Ja + 7 | 0;
 ka = Ja + 8 | 0;
 la = Ja + 9 | 0;
 ma = Ja + 10 | 0;
 na = Ja + 11 | 0;
 oa = Ja + 12 | 0;
 pa = Ja + 13 | 0;
 qa = Ja + 14 | 0;
 ra = Ja + 15 | 0;
 sa = Ja + 16 | 0;
 ta = Ja + 17 | 0;
 ua = Ja + 18 | 0;
 va = Ja + 19 | 0;
 wa = Ja + 20 | 0;
 xa = Ja + 21 | 0;
 ya = Ja + 22 | 0;
 za = Ja + 23 | 0;
 Aa = Ja + 24 | 0;
 Ba = Ja + 25 | 0;
 Ca = Ja + 26 | 0;
 Da = Ja + 27 | 0;
 Ea = Ja + 28 | 0;
 Fa = Ja + 29 | 0;
 Ga = Ja + 30 | 0;
 Ha = Ja + 31 | 0;
 do if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
  ec(b, b, 31984);
  $ = 5;
 } else {
  Qa = (c[e >> 2] | 0) + (c[t >> 2] | 0) | 0;
  Pa = (c[f >> 2] | 0) + (c[u >> 2] | 0) | 0;
  Oa = (c[i >> 2] | 0) + (c[v >> 2] | 0) | 0;
  Na = (c[j >> 2] | 0) + (c[w >> 2] | 0) | 0;
  Ma = (c[l >> 2] | 0) + (c[x >> 2] | 0) | 0;
  La = (c[n >> 2] | 0) + (c[y >> 2] | 0) | 0;
  m = (c[p >> 2] | 0) + (c[z >> 2] | 0) | 0;
  o = (c[r >> 2] | 0) + (c[A >> 2] | 0) | 0;
  q = (c[s >> 2] | 0) + (c[B >> 2] | 0) | 0;
  c[Z >> 2] = (c[Y >> 2] | 0) + (c[X >> 2] | 0);
  c[C >> 2] = Qa;
  c[D >> 2] = Pa;
  c[E >> 2] = Oa;
  c[F >> 2] = Na;
  c[G >> 2] = Ma;
  c[H >> 2] = La;
  c[I >> 2] = m;
  c[J >> 2] = o;
  c[K >> 2] = q;
  sc(Ja, Z);
  if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
   ec(b, b, 31936);
   $ = 5;
   break;
  }
  ec(Y, Y, 64);
  q = c[e >> 2] | 0;
  o = c[f >> 2] | 0;
  m = c[i >> 2] | 0;
  j = c[j >> 2] | 0;
  i = c[l >> 2] | 0;
  h = c[n >> 2] | 0;
  g = c[p >> 2] | 0;
  f = c[r >> 2] | 0;
  e = c[s >> 2] | 0;
  p = (c[t >> 2] | 0) - q | 0;
  r = (c[u >> 2] | 0) - o | 0;
  s = (c[v >> 2] | 0) - m | 0;
  La = (c[w >> 2] | 0) - j | 0;
  Ma = (c[x >> 2] | 0) - i | 0;
  Na = (c[y >> 2] | 0) - h | 0;
  Oa = (c[z >> 2] | 0) - g | 0;
  Pa = (c[A >> 2] | 0) - f | 0;
  Qa = (c[B >> 2] | 0) - e | 0;
  c[Z >> 2] = (c[X >> 2] | 0) - (c[Y >> 2] | 0);
  c[C >> 2] = p;
  c[D >> 2] = r;
  c[E >> 2] = s;
  c[F >> 2] = La;
  c[G >> 2] = Ma;
  c[H >> 2] = Na;
  c[I >> 2] = Oa;
  c[J >> 2] = Pa;
  c[K >> 2] = Qa;
  sc(Ja, Z);
  if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
   ec(b, b, 32080);
   V = 1;
   break;
  }
  q = q + (c[t >> 2] | 0) | 0;
  r = o + (c[u >> 2] | 0) | 0;
  s = m + (c[v >> 2] | 0) | 0;
  La = j + (c[w >> 2] | 0) | 0;
  Ma = i + (c[x >> 2] | 0) | 0;
  Na = h + (c[y >> 2] | 0) | 0;
  Oa = g + (c[z >> 2] | 0) | 0;
  Pa = f + (c[A >> 2] | 0) | 0;
  Qa = e + (c[B >> 2] | 0) | 0;
  c[Z >> 2] = (c[Y >> 2] | 0) + (c[X >> 2] | 0);
  c[C >> 2] = q;
  c[D >> 2] = r;
  c[E >> 2] = s;
  c[F >> 2] = La;
  c[G >> 2] = Ma;
  c[H >> 2] = Na;
  c[I >> 2] = Oa;
  c[J >> 2] = Pa;
  c[K >> 2] = Qa;
  sc(Ja, Z);
  if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
   ec(b, b, 32032);
   V = 1;
   break;
  } else ha(36561, 36533, 2659, 36597);
 } while (0);
 if (($ | 0) == 5) {
  ec(b, b, g);
  ec(_, _, h);
  V = 0;
 }
 sc(Ja, b);
 do if ((V | 0) != (a[Ja >> 0] & 1 | 0)) {
  sc(Ja, b);
  if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) ha(36625, 36533, 2669, 36597); else {
   E = b + 4 | 0;
   G = b + 8 | 0;
   I = b + 12 | 0;
   K = b + 16 | 0;
   Y = b + 20 | 0;
   $ = b + 24 | 0;
   Ma = b + 28 | 0;
   Oa = b + 32 | 0;
   Qa = b + 36 | 0;
   D = 0 - (c[E >> 2] | 0) | 0;
   F = 0 - (c[G >> 2] | 0) | 0;
   H = 0 - (c[I >> 2] | 0) | 0;
   J = 0 - (c[K >> 2] | 0) | 0;
   V = 0 - (c[Y >> 2] | 0) | 0;
   Z = 0 - (c[$ >> 2] | 0) | 0;
   La = 0 - (c[Ma >> 2] | 0) | 0;
   Na = 0 - (c[Oa >> 2] | 0) | 0;
   Pa = 0 - (c[Qa >> 2] | 0) | 0;
   c[b >> 2] = 0 - (c[b >> 2] | 0);
   c[E >> 2] = D;
   c[G >> 2] = F;
   c[I >> 2] = H;
   c[K >> 2] = J;
   c[Y >> 2] = V;
   c[$ >> 2] = Z;
   c[Ma >> 2] = La;
   c[Oa >> 2] = Na;
   c[Qa >> 2] = Pa;
   break;
  }
 } while (0);
 i = b + 80 | 0;
 La = c[_ >> 2] | 0;
 Na = c[L >> 2] | 0;
 Pa = c[M >> 2] | 0;
 f = c[N >> 2] | 0;
 g = c[O >> 2] | 0;
 s = c[P >> 2] | 0;
 e = c[Q >> 2] | 0;
 p = c[R >> 2] | 0;
 n = c[S >> 2] | 0;
 l = c[T >> 2] | 0;
 Ma = c[X >> 2] | 0;
 Oa = c[t >> 2] | 0;
 Qa = c[u >> 2] | 0;
 u = c[v >> 2] | 0;
 t = c[w >> 2] | 0;
 r = c[x >> 2] | 0;
 q = c[y >> 2] | 0;
 o = c[z >> 2] | 0;
 m = c[A >> 2] | 0;
 j = c[B >> 2] | 0;
 c[i >> 2] = Ma + La;
 c[b + 84 >> 2] = Oa + Na;
 c[b + 88 >> 2] = Qa + Pa;
 c[b + 92 >> 2] = u + f;
 c[b + 96 >> 2] = t + g;
 c[b + 100 >> 2] = r + s;
 c[b + 104 >> 2] = q + e;
 c[b + 108 >> 2] = o + p;
 c[b + 112 >> 2] = m + n;
 c[b + 116 >> 2] = j + l;
 h = b + 40 | 0;
 c[h >> 2] = La - Ma;
 c[b + 44 >> 2] = Na - Oa;
 c[b + 48 >> 2] = Pa - Qa;
 c[b + 52 >> 2] = f - u;
 c[b + 56 >> 2] = g - t;
 c[b + 60 >> 2] = s - r;
 c[b + 64 >> 2] = e - q;
 c[b + 68 >> 2] = p - o;
 c[b + 72 >> 2] = n - m;
 c[b + 76 >> 2] = l - j;
 ec(b, b, i);
 uc(W, i);
 ec(ba, b, W);
 ec(aa, h, W);
 ic(ba, ba);
 ic(aa, aa);
 ec(Ia, ba, aa);
 ec(Ia, 16, Ia);
 h = Ia + 4 | 0;
 i = Ia + 8 | 0;
 j = Ia + 12 | 0;
 l = Ia + 16 | 0;
 m = Ia + 20 | 0;
 n = Ia + 24 | 0;
 o = Ia + 28 | 0;
 p = Ia + 32 | 0;
 q = Ia + 36 | 0;
 e = ba + 4 | 0;
 r = (c[ba >> 2] | 0) + (c[Ia >> 2] | 0) - (c[aa >> 2] | 0) | 0;
 s = (c[e >> 2] | 0) + (c[h >> 2] | 0) - (c[aa + 4 >> 2] | 0) | 0;
 t = (c[ba + 8 >> 2] | 0) + (c[i >> 2] | 0) - (c[aa + 8 >> 2] | 0) | 0;
 u = (c[ba + 12 >> 2] | 0) + (c[j >> 2] | 0) - (c[aa + 12 >> 2] | 0) | 0;
 v = (c[ba + 16 >> 2] | 0) + (c[l >> 2] | 0) - (c[aa + 16 >> 2] | 0) | 0;
 w = (c[ba + 20 >> 2] | 0) + (c[m >> 2] | 0) - (c[aa + 20 >> 2] | 0) | 0;
 x = (c[ba + 24 >> 2] | 0) + (c[n >> 2] | 0) - (c[aa + 24 >> 2] | 0) | 0;
 y = (c[ba + 28 >> 2] | 0) + (c[o >> 2] | 0) - (c[aa + 28 >> 2] | 0) | 0;
 z = (c[ba + 32 >> 2] | 0) + (c[p >> 2] | 0) - (c[aa + 32 >> 2] | 0) | 0;
 g = (c[ba + 36 >> 2] | 0) + (c[q >> 2] | 0) - (c[aa + 36 >> 2] | 0) | 0;
 c[ba >> 2] = 1;
 f = e + 36 | 0;
 do {
  c[e >> 2] = 0;
  e = e + 4 | 0;
 } while ((e | 0) < (f | 0));
 c[Ia >> 2] = r + 1;
 c[h >> 2] = s;
 c[i >> 2] = t;
 c[j >> 2] = u;
 c[l >> 2] = v;
 c[m >> 2] = w;
 c[n >> 2] = x;
 c[o >> 2] = y;
 c[p >> 2] = z;
 c[q >> 2] = g;
 sc(Ja, Ia);
 if ((((a[ca >> 0] | a[Ja >> 0] | a[da >> 0] | a[ea >> 0] | a[fa >> 0] | a[ga >> 0] | a[ia >> 0] | a[ja >> 0] | a[ka >> 0] | a[la >> 0] | a[ma >> 0] | a[na >> 0] | a[oa >> 0] | a[pa >> 0] | a[qa >> 0] | a[ra >> 0] | a[sa >> 0] | a[ta >> 0] | a[ua >> 0] | a[va >> 0] | a[wa >> 0] | a[xa >> 0] | a[ya >> 0] | a[za >> 0] | a[Aa >> 0] | a[Ba >> 0] | a[Ca >> 0] | a[Da >> 0] | a[Ea >> 0] | a[Fa >> 0] | a[Ga >> 0] | a[Ha >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
  k = Ka;
  return;
 } else ha(36644, 36533, 2689, 36597);
}

function ec(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0, hb = 0, ib = 0, jb = 0, kb = 0, lb = 0, mb = 0, nb = 0, ob = 0, pb = 0, qb = 0, rb = 0, sb = 0, tb = 0, ub = 0, vb = 0, wb = 0, xb = 0, yb = 0, zb = 0, Ab = 0, Bb = 0, Cb = 0, Db = 0, Eb = 0, Fb = 0, Gb = 0, Hb = 0, Ib = 0, Jb = 0, Kb = 0, Lb = 0, Mb = 0, Nb = 0, Ob = 0, Pb = 0, Qb = 0, Rb = 0, Sb = 0, Tb = 0, Ub = 0, Vb = 0, Wb = 0, Xb = 0, Yb = 0, Zb = 0, _b = 0, $b = 0, ac = 0, bc = 0, cc = 0, dc = 0, ec = 0, fc = 0, gc = 0, hc = 0, ic = 0, jc = 0, kc = 0, lc = 0, mc = 0, nc = 0, oc = 0, pc = 0, qc = 0, rc = 0, sc = 0, tc = 0, uc = 0, vc = 0, wc = 0, xc = 0, yc = 0, zc = 0, Ac = 0, Bc = 0, Cc = 0, Dc = 0, Ec = 0, Fc = 0, Gc = 0, Hc = 0, Ic = 0, Jc = 0, Kc = 0, Lc = 0, Mc = 0, Nc = 0, Oc = 0, Pc = 0, Qc = 0, Rc = 0, Sc = 0;
 r = c[b >> 2] | 0;
 t = c[b + 4 >> 2] | 0;
 k = c[b + 8 >> 2] | 0;
 Tb = c[b + 12 >> 2] | 0;
 g = c[b + 16 >> 2] | 0;
 Aa = c[b + 20 >> 2] | 0;
 h = c[b + 24 >> 2] | 0;
 Bb = c[b + 28 >> 2] | 0;
 fa = c[b + 32 >> 2] | 0;
 ha = c[b + 36 >> 2] | 0;
 H = c[d >> 2] | 0;
 J = c[d + 4 >> 2] | 0;
 F = c[d + 8 >> 2] | 0;
 D = c[d + 12 >> 2] | 0;
 B = c[d + 16 >> 2] | 0;
 z = c[d + 20 >> 2] | 0;
 x = c[d + 24 >> 2] | 0;
 v = c[d + 28 >> 2] | 0;
 j = c[d + 32 >> 2] | 0;
 u = c[d + 36 >> 2] | 0;
 Oc = J * 19 | 0;
 dc = F * 19 | 0;
 sb = D * 19 | 0;
 Ia = B * 19 | 0;
 jc = z * 19 | 0;
 Fb = x * 19 | 0;
 Ua = v * 19 | 0;
 Sc = j * 19 | 0;
 Qc = u * 19 | 0;
 b = t << 1;
 i = Tb << 1;
 f = Aa << 1;
 e = Bb << 1;
 M = ha << 1;
 s = ((r | 0) < 0) << 31 >> 31;
 I = ((H | 0) < 0) << 31 >> 31;
 Mc = _f(H | 0, I | 0, r | 0, s | 0) | 0;
 Lc = U() | 0;
 K = ((J | 0) < 0) << 31 >> 31;
 wc = _f(J | 0, K | 0, r | 0, s | 0) | 0;
 vc = U() | 0;
 G = ((F | 0) < 0) << 31 >> 31;
 vb = _f(F | 0, G | 0, r | 0, s | 0) | 0;
 ub = U() | 0;
 E = ((D | 0) < 0) << 31 >> 31;
 La = _f(D | 0, E | 0, r | 0, s | 0) | 0;
 Ka = U() | 0;
 C = ((B | 0) < 0) << 31 >> 31;
 mc = _f(B | 0, C | 0, r | 0, s | 0) | 0;
 lc = U() | 0;
 A = ((z | 0) < 0) << 31 >> 31;
 Ib = _f(z | 0, A | 0, r | 0, s | 0) | 0;
 Hb = U() | 0;
 y = ((x | 0) < 0) << 31 >> 31;
 Xa = _f(x | 0, y | 0, r | 0, s | 0) | 0;
 Wa = U() | 0;
 w = ((v | 0) < 0) << 31 >> 31;
 ka = _f(v | 0, w | 0, r | 0, s | 0) | 0;
 ja = U() | 0;
 Pc = ((j | 0) < 0) << 31 >> 31;
 P = _f(j | 0, Pc | 0, r | 0, s | 0) | 0;
 O = U() | 0;
 s = _f(u | 0, ((u | 0) < 0) << 31 >> 31 | 0, r | 0, s | 0) | 0;
 r = U() | 0;
 u = ((t | 0) < 0) << 31 >> 31;
 fc = _f(H | 0, I | 0, t | 0, u | 0) | 0;
 gc = U() | 0;
 l = ((b | 0) < 0) << 31 >> 31;
 zb = _f(J | 0, K | 0, b | 0, l | 0) | 0;
 yb = U() | 0;
 Na = _f(F | 0, G | 0, t | 0, u | 0) | 0;
 Ma = U() | 0;
 oc = _f(D | 0, E | 0, b | 0, l | 0) | 0;
 nc = U() | 0;
 Kb = _f(B | 0, C | 0, t | 0, u | 0) | 0;
 Jb = U() | 0;
 Za = _f(z | 0, A | 0, b | 0, l | 0) | 0;
 Ya = U() | 0;
 ma = _f(x | 0, y | 0, t | 0, u | 0) | 0;
 la = U() | 0;
 R = _f(v | 0, w | 0, b | 0, l | 0) | 0;
 Q = U() | 0;
 u = _f(j | 0, Pc | 0, t | 0, u | 0) | 0;
 t = U() | 0;
 Pc = ((Qc | 0) < 0) << 31 >> 31;
 l = _f(Qc | 0, Pc | 0, b | 0, l | 0) | 0;
 b = U() | 0;
 j = ((k | 0) < 0) << 31 >> 31;
 xb = _f(H | 0, I | 0, k | 0, j | 0) | 0;
 wb = U() | 0;
 Ra = _f(J | 0, K | 0, k | 0, j | 0) | 0;
 Qa = U() | 0;
 qc = _f(F | 0, G | 0, k | 0, j | 0) | 0;
 pc = U() | 0;
 Mb = _f(D | 0, E | 0, k | 0, j | 0) | 0;
 Lb = U() | 0;
 $a = _f(B | 0, C | 0, k | 0, j | 0) | 0;
 _a = U() | 0;
 oa = _f(z | 0, A | 0, k | 0, j | 0) | 0;
 na = U() | 0;
 T = _f(x | 0, y | 0, k | 0, j | 0) | 0;
 S = U() | 0;
 w = _f(v | 0, w | 0, k | 0, j | 0) | 0;
 v = U() | 0;
 Rc = ((Sc | 0) < 0) << 31 >> 31;
 yc = _f(Sc | 0, Rc | 0, k | 0, j | 0) | 0;
 xc = U() | 0;
 j = _f(Qc | 0, Pc | 0, k | 0, j | 0) | 0;
 k = U() | 0;
 Ub = ((Tb | 0) < 0) << 31 >> 31;
 Pa = _f(H | 0, I | 0, Tb | 0, Ub | 0) | 0;
 Oa = U() | 0;
 q = ((i | 0) < 0) << 31 >> 31;
 uc = _f(J | 0, K | 0, i | 0, q | 0) | 0;
 tc = U() | 0;
 Ob = _f(F | 0, G | 0, Tb | 0, Ub | 0) | 0;
 Nb = U() | 0;
 bb = _f(D | 0, E | 0, i | 0, q | 0) | 0;
 ab = U() | 0;
 qa = _f(B | 0, C | 0, Tb | 0, Ub | 0) | 0;
 pa = U() | 0;
 W = _f(z | 0, A | 0, i | 0, q | 0) | 0;
 V = U() | 0;
 y = _f(x | 0, y | 0, Tb | 0, Ub | 0) | 0;
 x = U() | 0;
 Va = ((Ua | 0) < 0) << 31 >> 31;
 Ac = _f(Ua | 0, Va | 0, i | 0, q | 0) | 0;
 zc = U() | 0;
 Ub = _f(Sc | 0, Rc | 0, Tb | 0, Ub | 0) | 0;
 Tb = U() | 0;
 q = _f(Qc | 0, Pc | 0, i | 0, q | 0) | 0;
 i = U() | 0;
 za = ((g | 0) < 0) << 31 >> 31;
 sc = _f(H | 0, I | 0, g | 0, za | 0) | 0;
 rc = U() | 0;
 Sb = _f(J | 0, K | 0, g | 0, za | 0) | 0;
 Rb = U() | 0;
 db = _f(F | 0, G | 0, g | 0, za | 0) | 0;
 cb = U() | 0;
 sa = _f(D | 0, E | 0, g | 0, za | 0) | 0;
 ra = U() | 0;
 Y = _f(B | 0, C | 0, g | 0, za | 0) | 0;
 X = U() | 0;
 A = _f(z | 0, A | 0, g | 0, za | 0) | 0;
 z = U() | 0;
 Gb = ((Fb | 0) < 0) << 31 >> 31;
 Cc = _f(Fb | 0, Gb | 0, g | 0, za | 0) | 0;
 Bc = U() | 0;
 Wb = _f(Ua | 0, Va | 0, g | 0, za | 0) | 0;
 Vb = U() | 0;
 jb = _f(Sc | 0, Rc | 0, g | 0, za | 0) | 0;
 ib = U() | 0;
 za = _f(Qc | 0, Pc | 0, g | 0, za | 0) | 0;
 g = U() | 0;
 Ba = ((Aa | 0) < 0) << 31 >> 31;
 Qb = _f(H | 0, I | 0, Aa | 0, Ba | 0) | 0;
 Pb = U() | 0;
 p = ((f | 0) < 0) << 31 >> 31;
 hb = _f(J | 0, K | 0, f | 0, p | 0) | 0;
 gb = U() | 0;
 ua = _f(F | 0, G | 0, Aa | 0, Ba | 0) | 0;
 ta = U() | 0;
 _ = _f(D | 0, E | 0, f | 0, p | 0) | 0;
 Z = U() | 0;
 C = _f(B | 0, C | 0, Aa | 0, Ba | 0) | 0;
 B = U() | 0;
 kc = ((jc | 0) < 0) << 31 >> 31;
 Ec = _f(jc | 0, kc | 0, f | 0, p | 0) | 0;
 Dc = U() | 0;
 Yb = _f(Fb | 0, Gb | 0, Aa | 0, Ba | 0) | 0;
 Xb = U() | 0;
 lb = _f(Ua | 0, Va | 0, f | 0, p | 0) | 0;
 kb = U() | 0;
 Ba = _f(Sc | 0, Rc | 0, Aa | 0, Ba | 0) | 0;
 Aa = U() | 0;
 p = _f(Qc | 0, Pc | 0, f | 0, p | 0) | 0;
 f = U() | 0;
 Ab = ((h | 0) < 0) << 31 >> 31;
 fb = _f(H | 0, I | 0, h | 0, Ab | 0) | 0;
 eb = U() | 0;
 ya = _f(J | 0, K | 0, h | 0, Ab | 0) | 0;
 xa = U() | 0;
 aa = _f(F | 0, G | 0, h | 0, Ab | 0) | 0;
 $ = U() | 0;
 E = _f(D | 0, E | 0, h | 0, Ab | 0) | 0;
 D = U() | 0;
 Ja = ((Ia | 0) < 0) << 31 >> 31;
 Gc = _f(Ia | 0, Ja | 0, h | 0, Ab | 0) | 0;
 Fc = U() | 0;
 _b = _f(jc | 0, kc | 0, h | 0, Ab | 0) | 0;
 Zb = U() | 0;
 nb = _f(Fb | 0, Gb | 0, h | 0, Ab | 0) | 0;
 mb = U() | 0;
 Da = _f(Ua | 0, Va | 0, h | 0, Ab | 0) | 0;
 Ca = U() | 0;
 m = _f(Sc | 0, Rc | 0, h | 0, Ab | 0) | 0;
 n = U() | 0;
 Ab = _f(Qc | 0, Pc | 0, h | 0, Ab | 0) | 0;
 h = U() | 0;
 Cb = ((Bb | 0) < 0) << 31 >> 31;
 wa = _f(H | 0, I | 0, Bb | 0, Cb | 0) | 0;
 va = U() | 0;
 d = ((e | 0) < 0) << 31 >> 31;
 ea = _f(J | 0, K | 0, e | 0, d | 0) | 0;
 da = U() | 0;
 G = _f(F | 0, G | 0, Bb | 0, Cb | 0) | 0;
 F = U() | 0;
 tb = ((sb | 0) < 0) << 31 >> 31;
 Ic = _f(sb | 0, tb | 0, e | 0, d | 0) | 0;
 Hc = U() | 0;
 ac = _f(Ia | 0, Ja | 0, Bb | 0, Cb | 0) | 0;
 $b = U() | 0;
 pb = _f(jc | 0, kc | 0, e | 0, d | 0) | 0;
 ob = U() | 0;
 Fa = _f(Fb | 0, Gb | 0, Bb | 0, Cb | 0) | 0;
 Ea = U() | 0;
 L = _f(Ua | 0, Va | 0, e | 0, d | 0) | 0;
 o = U() | 0;
 Cb = _f(Sc | 0, Rc | 0, Bb | 0, Cb | 0) | 0;
 Bb = U() | 0;
 d = _f(Qc | 0, Pc | 0, e | 0, d | 0) | 0;
 e = U() | 0;
 ga = ((fa | 0) < 0) << 31 >> 31;
 ca = _f(H | 0, I | 0, fa | 0, ga | 0) | 0;
 ba = U() | 0;
 K = _f(J | 0, K | 0, fa | 0, ga | 0) | 0;
 J = U() | 0;
 ec = ((dc | 0) < 0) << 31 >> 31;
 Kc = _f(dc | 0, ec | 0, fa | 0, ga | 0) | 0;
 Jc = U() | 0;
 cc = _f(sb | 0, tb | 0, fa | 0, ga | 0) | 0;
 bc = U() | 0;
 rb = _f(Ia | 0, Ja | 0, fa | 0, ga | 0) | 0;
 qb = U() | 0;
 Ha = _f(jc | 0, kc | 0, fa | 0, ga | 0) | 0;
 Ga = U() | 0;
 ic = _f(Fb | 0, Gb | 0, fa | 0, ga | 0) | 0;
 hc = U() | 0;
 Eb = _f(Ua | 0, Va | 0, fa | 0, ga | 0) | 0;
 Db = U() | 0;
 Ta = _f(Sc | 0, Rc | 0, fa | 0, ga | 0) | 0;
 Sa = U() | 0;
 ga = _f(Qc | 0, Pc | 0, fa | 0, ga | 0) | 0;
 fa = U() | 0;
 ia = ((ha | 0) < 0) << 31 >> 31;
 I = _f(H | 0, I | 0, ha | 0, ia | 0) | 0;
 H = U() | 0;
 N = ((M | 0) < 0) << 31 >> 31;
 Oc = _f(Oc | 0, ((Oc | 0) < 0) << 31 >> 31 | 0, M | 0, N | 0) | 0;
 Nc = U() | 0;
 ec = _f(dc | 0, ec | 0, ha | 0, ia | 0) | 0;
 dc = U() | 0;
 tb = _f(sb | 0, tb | 0, M | 0, N | 0) | 0;
 sb = U() | 0;
 Ja = _f(Ia | 0, Ja | 0, ha | 0, ia | 0) | 0;
 Ia = U() | 0;
 kc = _f(jc | 0, kc | 0, M | 0, N | 0) | 0;
 jc = U() | 0;
 Gb = _f(Fb | 0, Gb | 0, ha | 0, ia | 0) | 0;
 Fb = U() | 0;
 Va = _f(Ua | 0, Va | 0, M | 0, N | 0) | 0;
 Ua = U() | 0;
 ia = _f(Sc | 0, Rc | 0, ha | 0, ia | 0) | 0;
 ha = U() | 0;
 N = _f(Qc | 0, Pc | 0, M | 0, N | 0) | 0;
 M = U() | 0;
 Lc = $f(Oc | 0, Nc | 0, Mc | 0, Lc | 0) | 0;
 Jc = $f(Lc | 0, U() | 0, Kc | 0, Jc | 0) | 0;
 Hc = $f(Jc | 0, U() | 0, Ic | 0, Hc | 0) | 0;
 Fc = $f(Hc | 0, U() | 0, Gc | 0, Fc | 0) | 0;
 Dc = $f(Fc | 0, U() | 0, Ec | 0, Dc | 0) | 0;
 Bc = $f(Dc | 0, U() | 0, Cc | 0, Bc | 0) | 0;
 zc = $f(Bc | 0, U() | 0, Ac | 0, zc | 0) | 0;
 xc = $f(zc | 0, U() | 0, yc | 0, xc | 0) | 0;
 b = $f(xc | 0, U() | 0, l | 0, b | 0) | 0;
 l = U() | 0;
 gc = $f(wc | 0, vc | 0, fc | 0, gc | 0) | 0;
 fc = U() | 0;
 rc = $f(uc | 0, tc | 0, sc | 0, rc | 0) | 0;
 pc = $f(rc | 0, U() | 0, qc | 0, pc | 0) | 0;
 nc = $f(pc | 0, U() | 0, oc | 0, nc | 0) | 0;
 lc = $f(nc | 0, U() | 0, mc | 0, lc | 0) | 0;
 jc = $f(lc | 0, U() | 0, kc | 0, jc | 0) | 0;
 hc = $f(jc | 0, U() | 0, ic | 0, hc | 0) | 0;
 o = $f(hc | 0, U() | 0, L | 0, o | 0) | 0;
 n = $f(o | 0, U() | 0, m | 0, n | 0) | 0;
 f = $f(n | 0, U() | 0, p | 0, f | 0) | 0;
 p = U() | 0;
 n = $f(b | 0, l | 0, 33554432, 0) | 0;
 m = U() | 0;
 o = eg(n | 0, m | 0, 26) | 0;
 L = U() | 0;
 dc = $f(gc | 0, fc | 0, ec | 0, dc | 0) | 0;
 bc = $f(dc | 0, U() | 0, cc | 0, bc | 0) | 0;
 $b = $f(bc | 0, U() | 0, ac | 0, $b | 0) | 0;
 Zb = $f($b | 0, U() | 0, _b | 0, Zb | 0) | 0;
 Xb = $f(Zb | 0, U() | 0, Yb | 0, Xb | 0) | 0;
 Vb = $f(Xb | 0, U() | 0, Wb | 0, Vb | 0) | 0;
 Tb = $f(Vb | 0, U() | 0, Ub | 0, Tb | 0) | 0;
 k = $f(Tb | 0, U() | 0, j | 0, k | 0) | 0;
 L = $f(k | 0, U() | 0, o | 0, L | 0) | 0;
 o = U() | 0;
 m = ag(b | 0, l | 0, n & -67108864 | 0, m | 0) | 0;
 n = U() | 0;
 l = $f(f | 0, p | 0, 33554432, 0) | 0;
 b = U() | 0;
 k = eg(l | 0, b | 0, 26) | 0;
 j = U() | 0;
 Pb = $f(Sb | 0, Rb | 0, Qb | 0, Pb | 0) | 0;
 Nb = $f(Pb | 0, U() | 0, Ob | 0, Nb | 0) | 0;
 Lb = $f(Nb | 0, U() | 0, Mb | 0, Lb | 0) | 0;
 Jb = $f(Lb | 0, U() | 0, Kb | 0, Jb | 0) | 0;
 Hb = $f(Jb | 0, U() | 0, Ib | 0, Hb | 0) | 0;
 Fb = $f(Hb | 0, U() | 0, Gb | 0, Fb | 0) | 0;
 Db = $f(Fb | 0, U() | 0, Eb | 0, Db | 0) | 0;
 Bb = $f(Db | 0, U() | 0, Cb | 0, Bb | 0) | 0;
 h = $f(Bb | 0, U() | 0, Ab | 0, h | 0) | 0;
 j = $f(h | 0, U() | 0, k | 0, j | 0) | 0;
 k = U() | 0;
 b = ag(f | 0, p | 0, l & -67108864 | 0, b | 0) | 0;
 l = U() | 0;
 p = $f(L | 0, o | 0, 16777216, 0) | 0;
 f = eg(p | 0, U() | 0, 25) | 0;
 h = U() | 0;
 wb = $f(zb | 0, yb | 0, xb | 0, wb | 0) | 0;
 ub = $f(wb | 0, U() | 0, vb | 0, ub | 0) | 0;
 sb = $f(ub | 0, U() | 0, tb | 0, sb | 0) | 0;
 qb = $f(sb | 0, U() | 0, rb | 0, qb | 0) | 0;
 ob = $f(qb | 0, U() | 0, pb | 0, ob | 0) | 0;
 mb = $f(ob | 0, U() | 0, nb | 0, mb | 0) | 0;
 kb = $f(mb | 0, U() | 0, lb | 0, kb | 0) | 0;
 ib = $f(kb | 0, U() | 0, jb | 0, ib | 0) | 0;
 i = $f(ib | 0, U() | 0, q | 0, i | 0) | 0;
 h = $f(i | 0, U() | 0, f | 0, h | 0) | 0;
 f = U() | 0;
 p = ag(L | 0, o | 0, p & -33554432 | 0, 0) | 0;
 o = U() | 0;
 L = $f(j | 0, k | 0, 16777216, 0) | 0;
 i = eg(L | 0, U() | 0, 25) | 0;
 q = U() | 0;
 eb = $f(hb | 0, gb | 0, fb | 0, eb | 0) | 0;
 cb = $f(eb | 0, U() | 0, db | 0, cb | 0) | 0;
 ab = $f(cb | 0, U() | 0, bb | 0, ab | 0) | 0;
 _a = $f(ab | 0, U() | 0, $a | 0, _a | 0) | 0;
 Ya = $f(_a | 0, U() | 0, Za | 0, Ya | 0) | 0;
 Wa = $f(Ya | 0, U() | 0, Xa | 0, Wa | 0) | 0;
 Ua = $f(Wa | 0, U() | 0, Va | 0, Ua | 0) | 0;
 Sa = $f(Ua | 0, U() | 0, Ta | 0, Sa | 0) | 0;
 e = $f(Sa | 0, U() | 0, d | 0, e | 0) | 0;
 q = $f(e | 0, U() | 0, i | 0, q | 0) | 0;
 i = U() | 0;
 L = ag(j | 0, k | 0, L & -33554432 | 0, 0) | 0;
 k = U() | 0;
 j = $f(h | 0, f | 0, 33554432, 0) | 0;
 e = eg(j | 0, U() | 0, 26) | 0;
 d = U() | 0;
 Oa = $f(Ra | 0, Qa | 0, Pa | 0, Oa | 0) | 0;
 Ma = $f(Oa | 0, U() | 0, Na | 0, Ma | 0) | 0;
 Ka = $f(Ma | 0, U() | 0, La | 0, Ka | 0) | 0;
 Ia = $f(Ka | 0, U() | 0, Ja | 0, Ia | 0) | 0;
 Ga = $f(Ia | 0, U() | 0, Ha | 0, Ga | 0) | 0;
 Ea = $f(Ga | 0, U() | 0, Fa | 0, Ea | 0) | 0;
 Ca = $f(Ea | 0, U() | 0, Da | 0, Ca | 0) | 0;
 Aa = $f(Ca | 0, U() | 0, Ba | 0, Aa | 0) | 0;
 g = $f(Aa | 0, U() | 0, za | 0, g | 0) | 0;
 d = $f(g | 0, U() | 0, e | 0, d | 0) | 0;
 e = U() | 0;
 j = ag(h | 0, f | 0, j & -67108864 | 0, 0) | 0;
 U() | 0;
 f = $f(q | 0, i | 0, 33554432, 0) | 0;
 h = eg(f | 0, U() | 0, 26) | 0;
 g = U() | 0;
 va = $f(ya | 0, xa | 0, wa | 0, va | 0) | 0;
 ta = $f(va | 0, U() | 0, ua | 0, ta | 0) | 0;
 ra = $f(ta | 0, U() | 0, sa | 0, ra | 0) | 0;
 pa = $f(ra | 0, U() | 0, qa | 0, pa | 0) | 0;
 na = $f(pa | 0, U() | 0, oa | 0, na | 0) | 0;
 la = $f(na | 0, U() | 0, ma | 0, la | 0) | 0;
 ja = $f(la | 0, U() | 0, ka | 0, ja | 0) | 0;
 ha = $f(ja | 0, U() | 0, ia | 0, ha | 0) | 0;
 fa = $f(ha | 0, U() | 0, ga | 0, fa | 0) | 0;
 g = $f(fa | 0, U() | 0, h | 0, g | 0) | 0;
 h = U() | 0;
 f = ag(q | 0, i | 0, f & -67108864 | 0, 0) | 0;
 U() | 0;
 i = $f(d | 0, e | 0, 16777216, 0) | 0;
 q = eg(i | 0, U() | 0, 25) | 0;
 l = $f(q | 0, U() | 0, b | 0, l | 0) | 0;
 b = U() | 0;
 i = ag(d | 0, e | 0, i & -33554432 | 0, 0) | 0;
 U() | 0;
 e = $f(g | 0, h | 0, 16777216, 0) | 0;
 d = eg(e | 0, U() | 0, 25) | 0;
 q = U() | 0;
 ba = $f(ea | 0, da | 0, ca | 0, ba | 0) | 0;
 $ = $f(ba | 0, U() | 0, aa | 0, $ | 0) | 0;
 Z = $f($ | 0, U() | 0, _ | 0, Z | 0) | 0;
 X = $f(Z | 0, U() | 0, Y | 0, X | 0) | 0;
 V = $f(X | 0, U() | 0, W | 0, V | 0) | 0;
 S = $f(V | 0, U() | 0, T | 0, S | 0) | 0;
 Q = $f(S | 0, U() | 0, R | 0, Q | 0) | 0;
 O = $f(Q | 0, U() | 0, P | 0, O | 0) | 0;
 M = $f(O | 0, U() | 0, N | 0, M | 0) | 0;
 q = $f(M | 0, U() | 0, d | 0, q | 0) | 0;
 d = U() | 0;
 e = ag(g | 0, h | 0, e & -33554432 | 0, 0) | 0;
 U() | 0;
 h = $f(l | 0, b | 0, 33554432, 0) | 0;
 g = fg(h | 0, U() | 0, 26) | 0;
 g = $f(L | 0, k | 0, g | 0, U() | 0) | 0;
 U() | 0;
 h = ag(l | 0, b | 0, h & -67108864 | 0, 0) | 0;
 U() | 0;
 b = $f(q | 0, d | 0, 33554432, 0) | 0;
 l = eg(b | 0, U() | 0, 26) | 0;
 k = U() | 0;
 H = $f(K | 0, J | 0, I | 0, H | 0) | 0;
 F = $f(H | 0, U() | 0, G | 0, F | 0) | 0;
 D = $f(F | 0, U() | 0, E | 0, D | 0) | 0;
 B = $f(D | 0, U() | 0, C | 0, B | 0) | 0;
 z = $f(B | 0, U() | 0, A | 0, z | 0) | 0;
 x = $f(z | 0, U() | 0, y | 0, x | 0) | 0;
 v = $f(x | 0, U() | 0, w | 0, v | 0) | 0;
 t = $f(v | 0, U() | 0, u | 0, t | 0) | 0;
 r = $f(t | 0, U() | 0, s | 0, r | 0) | 0;
 k = $f(r | 0, U() | 0, l | 0, k | 0) | 0;
 l = U() | 0;
 b = ag(q | 0, d | 0, b & -67108864 | 0, 0) | 0;
 U() | 0;
 d = $f(k | 0, l | 0, 16777216, 0) | 0;
 q = eg(d | 0, U() | 0, 25) | 0;
 q = _f(q | 0, U() | 0, 19, 0) | 0;
 n = $f(q | 0, U() | 0, m | 0, n | 0) | 0;
 m = U() | 0;
 d = ag(k | 0, l | 0, d & -33554432 | 0, 0) | 0;
 U() | 0;
 l = $f(n | 0, m | 0, 33554432, 0) | 0;
 k = fg(l | 0, U() | 0, 26) | 0;
 k = $f(p | 0, o | 0, k | 0, U() | 0) | 0;
 U() | 0;
 l = ag(n | 0, m | 0, l & -67108864 | 0, 0) | 0;
 U() | 0;
 c[a >> 2] = l;
 c[a + 4 >> 2] = k;
 c[a + 8 >> 2] = j;
 c[a + 12 >> 2] = i;
 c[a + 16 >> 2] = h;
 c[a + 20 >> 2] = g;
 c[a + 24 >> 2] = f;
 c[a + 28 >> 2] = e;
 c[a + 32 >> 2] = b;
 c[a + 36 >> 2] = d;
 return;
}

function Hc(b, c, e) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0;
 W = a[c + 2 >> 0] | 0;
 N = d[c >> 0] | 0;
 i = gg(d[c + 1 >> 0] | 0 | 0, 0, 8) | 0;
 Y = U() | 0;
 W = W & 255;
 O = gg(W | 0, 0, 16) | 0;
 U() | 0;
 R = gg(d[c + 3 >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 P = gg(d[c + 4 >> 0] | 0 | 0, 0, 16) | 0;
 v = v | (U() | 0);
 m = d[c + 5 >> 0] | 0;
 u = gg(m | 0, 0, 24) | 0;
 v = fg(R | W | P | u | 0, v | (U() | 0) | 0, 5) | 0;
 U() | 0;
 u = a[c + 7 >> 0] | 0;
 P = gg(d[c + 6 >> 0] | 0 | 0, 0, 8) | 0;
 W = U() | 0;
 u = u & 255;
 R = gg(u | 0, 0, 16) | 0;
 W = fg(P | m | R | 0, W | (U() | 0) | 0, 2) | 0;
 U() | 0;
 R = gg(d[c + 8 >> 0] | 0 | 0, 0, 8) | 0;
 m = U() | 0;
 P = gg(d[c + 9 >> 0] | 0 | 0, 0, 16) | 0;
 m = m | (U() | 0);
 o = d[c + 10 >> 0] | 0;
 w = gg(o | 0, 0, 24) | 0;
 m = fg(R | u | P | w | 0, m | (U() | 0) | 0, 7) | 0;
 U() | 0;
 w = gg(d[c + 11 >> 0] | 0 | 0, 0, 8) | 0;
 P = U() | 0;
 u = gg(d[c + 12 >> 0] | 0 | 0, 0, 16) | 0;
 P = P | (U() | 0);
 R = d[c + 13 >> 0] | 0;
 H = gg(R | 0, 0, 24) | 0;
 P = fg(w | o | u | H | 0, P | (U() | 0) | 0, 4) | 0;
 U() | 0;
 H = a[c + 15 >> 0] | 0;
 u = gg(d[c + 14 >> 0] | 0 | 0, 0, 8) | 0;
 o = U() | 0;
 H = H & 255;
 w = gg(H | 0, 0, 16) | 0;
 o = fg(u | R | w | 0, o | (U() | 0) | 0, 1) | 0;
 U() | 0;
 w = gg(d[c + 16 >> 0] | 0 | 0, 0, 8) | 0;
 R = U() | 0;
 u = gg(d[c + 17 >> 0] | 0 | 0, 0, 16) | 0;
 R = R | (U() | 0);
 D = d[c + 18 >> 0] | 0;
 F = gg(D | 0, 0, 24) | 0;
 R = fg(w | H | u | F | 0, R | (U() | 0) | 0, 6) | 0;
 U() | 0;
 F = a[c + 20 >> 0] | 0;
 u = gg(d[c + 19 >> 0] | 0 | 0, 0, 8) | 0;
 H = U() | 0;
 F = gg(F & 255 | 0, 0, 16) | 0;
 H = fg(u | D | F | 0, H | (U() | 0) | 0, 3) | 0;
 F = U() | 0;
 D = a[c + 23 >> 0] | 0;
 u = d[c + 21 >> 0] | 0;
 w = gg(d[c + 22 >> 0] | 0 | 0, 0, 8) | 0;
 g = U() | 0;
 D = D & 255;
 l = gg(D | 0, 0, 16) | 0;
 U() | 0;
 Z = gg(d[c + 24 >> 0] | 0 | 0, 0, 8) | 0;
 K = U() | 0;
 X = gg(d[c + 25 >> 0] | 0 | 0, 0, 16) | 0;
 K = K | (U() | 0);
 C = d[c + 26 >> 0] | 0;
 S = gg(C | 0, 0, 24) | 0;
 K = fg(Z | D | X | S | 0, K | (U() | 0) | 0, 5) | 0;
 U() | 0;
 S = a[c + 28 >> 0] | 0;
 X = gg(d[c + 27 >> 0] | 0 | 0, 0, 8) | 0;
 D = U() | 0;
 S = S & 255;
 Z = gg(S | 0, 0, 16) | 0;
 D = fg(X | C | Z | 0, D | (U() | 0) | 0, 2) | 0;
 U() | 0;
 Z = gg(d[c + 29 >> 0] | 0 | 0, 0, 8) | 0;
 C = U() | 0;
 X = gg(d[c + 30 >> 0] | 0 | 0, 0, 16) | 0;
 C = C | (U() | 0);
 I = gg(d[c + 31 >> 0] | 0 | 0, 0, 24) | 0;
 C = fg(Z | S | X | I | 0, C | (U() | 0) | 0, 7) | 0;
 I = U() | 0;
 X = a[e + 2 >> 0] | 0;
 S = d[e >> 0] | 0;
 Z = gg(d[e + 1 >> 0] | 0 | 0, 0, 8) | 0;
 T = U() | 0;
 X = X & 255;
 V = gg(X | 0, 0, 16) | 0;
 U() | 0;
 f = gg(d[e + 3 >> 0] | 0 | 0, 0, 8) | 0;
 _ = U() | 0;
 Q = gg(d[e + 4 >> 0] | 0 | 0, 0, 16) | 0;
 _ = _ | (U() | 0);
 M = d[e + 5 >> 0] | 0;
 c = gg(M | 0, 0, 24) | 0;
 _ = fg(f | X | Q | c | 0, _ | (U() | 0) | 0, 5) | 0;
 U() | 0;
 c = a[e + 7 >> 0] | 0;
 Q = gg(d[e + 6 >> 0] | 0 | 0, 0, 8) | 0;
 X = U() | 0;
 c = c & 255;
 f = gg(c | 0, 0, 16) | 0;
 X = fg(Q | M | f | 0, X | (U() | 0) | 0, 2) | 0;
 U() | 0;
 f = gg(d[e + 8 >> 0] | 0 | 0, 0, 8) | 0;
 M = U() | 0;
 Q = gg(d[e + 9 >> 0] | 0 | 0, 0, 16) | 0;
 M = M | (U() | 0);
 k = d[e + 10 >> 0] | 0;
 L = gg(k | 0, 0, 24) | 0;
 M = fg(f | c | Q | L | 0, M | (U() | 0) | 0, 7) | 0;
 U() | 0;
 L = gg(d[e + 11 >> 0] | 0 | 0, 0, 8) | 0;
 Q = U() | 0;
 c = gg(d[e + 12 >> 0] | 0 | 0, 0, 16) | 0;
 Q = Q | (U() | 0);
 f = d[e + 13 >> 0] | 0;
 j = gg(f | 0, 0, 24) | 0;
 Q = fg(L | k | c | j | 0, Q | (U() | 0) | 0, 4) | 0;
 U() | 0;
 j = a[e + 15 >> 0] | 0;
 c = gg(d[e + 14 >> 0] | 0 | 0, 0, 8) | 0;
 k = U() | 0;
 j = j & 255;
 L = gg(j | 0, 0, 16) | 0;
 k = fg(c | f | L | 0, k | (U() | 0) | 0, 1) | 0;
 U() | 0;
 L = gg(d[e + 16 >> 0] | 0 | 0, 0, 8) | 0;
 f = U() | 0;
 c = gg(d[e + 17 >> 0] | 0 | 0, 0, 16) | 0;
 f = f | (U() | 0);
 A = d[e + 18 >> 0] | 0;
 t = gg(A | 0, 0, 24) | 0;
 f = fg(L | j | c | t | 0, f | (U() | 0) | 0, 6) | 0;
 U() | 0;
 t = a[e + 20 >> 0] | 0;
 c = gg(d[e + 19 >> 0] | 0 | 0, 0, 8) | 0;
 j = U() | 0;
 t = gg(t & 255 | 0, 0, 16) | 0;
 j = fg(c | A | t | 0, j | (U() | 0) | 0, 3) | 0;
 t = U() | 0;
 A = a[e + 23 >> 0] | 0;
 c = d[e + 21 >> 0] | 0;
 L = gg(d[e + 22 >> 0] | 0 | 0, 0, 8) | 0;
 s = U() | 0;
 A = A & 255;
 r = gg(A | 0, 0, 16) | 0;
 U() | 0;
 n = gg(d[e + 24 >> 0] | 0 | 0, 0, 8) | 0;
 G = U() | 0;
 h = gg(d[e + 25 >> 0] | 0 | 0, 0, 16) | 0;
 G = G | (U() | 0);
 E = d[e + 26 >> 0] | 0;
 p = gg(E | 0, 0, 24) | 0;
 G = fg(n | A | h | p | 0, G | (U() | 0) | 0, 5) | 0;
 U() | 0;
 p = a[e + 28 >> 0] | 0;
 h = gg(d[e + 27 >> 0] | 0 | 0, 0, 8) | 0;
 A = U() | 0;
 p = p & 255;
 n = gg(p | 0, 0, 16) | 0;
 A = fg(h | E | n | 0, A | (U() | 0) | 0, 2) | 0;
 U() | 0;
 n = gg(d[e + 29 >> 0] | 0 | 0, 0, 8) | 0;
 E = U() | 0;
 h = gg(d[e + 30 >> 0] | 0 | 0, 0, 16) | 0;
 E = E | (U() | 0);
 B = gg(d[e + 31 >> 0] | 0 | 0, 0, 24) | 0;
 E = fg(n | p | h | B | 0, E | (U() | 0) | 0, 7) | 0;
 B = U() | 0;
 T = ag(i | N | O & 2031616 | 0, Y | 0, Z | S | V & 2031616 | 0, T | 0) | 0;
 V = U() | 0;
 _ = ag(v & 2097151 | 0, 0, _ & 2097151 | 0, 0) | 0;
 v = U() | 0;
 X = ag(W & 2097151 | 0, 0, X & 2097151 | 0, 0) | 0;
 W = U() | 0;
 M = ag(m & 2097151 | 0, 0, M & 2097151 | 0, 0) | 0;
 m = U() | 0;
 Q = ag(P & 2097151 | 0, 0, Q & 2097151 | 0, 0) | 0;
 P = U() | 0;
 k = ag(o & 2097151 | 0, 0, k & 2097151 | 0, 0) | 0;
 o = U() | 0;
 f = ag(R & 2097151 | 0, 0, f & 2097151 | 0, 0) | 0;
 e = U() | 0;
 t = ag(H | 0, F | 0, j | 0, t | 0) | 0;
 j = U() | 0;
 s = ag(w | u | l & 2031616 | 0, g | 0, L | c | r & 2031616 | 0, s | 0) | 0;
 r = U() | 0;
 G = ag(K & 2097151 | 0, 0, G & 2097151 | 0, 0) | 0;
 c = U() | 0;
 A = ag(D & 2097151 | 0, 0, A & 2097151 | 0, 0) | 0;
 D = U() | 0;
 B = ag(C | 0, I | 0, E | 0, B | 0) | 0;
 E = U() | 0;
 I = $f(T | 0, V | 0, 1048576, 0) | 0;
 C = U() | 0;
 K = eg(I | 0, C | 0, 21) | 0;
 K = $f(_ | 0, v | 0, K | 0, U() | 0) | 0;
 v = U() | 0;
 C = ag(T | 0, V | 0, I & -2097152 | 0, C | 0) | 0;
 I = U() | 0;
 V = $f(X | 0, W | 0, 1048576, 0) | 0;
 T = U() | 0;
 _ = eg(V | 0, T | 0, 21) | 0;
 _ = $f(M | 0, m | 0, _ | 0, U() | 0) | 0;
 m = U() | 0;
 M = $f(Q | 0, P | 0, 1048576, 0) | 0;
 L = U() | 0;
 g = eg(M | 0, L | 0, 21) | 0;
 g = $f(k | 0, o | 0, g | 0, U() | 0) | 0;
 o = U() | 0;
 k = $f(f | 0, e | 0, 1048576, 0) | 0;
 l = U() | 0;
 u = eg(k | 0, l | 0, 21) | 0;
 u = $f(t | 0, j | 0, u | 0, U() | 0) | 0;
 j = U() | 0;
 t = $f(s | 0, r | 0, 1048576, 0) | 0;
 w = U() | 0;
 F = eg(t | 0, w | 0, 21) | 0;
 F = $f(G | 0, c | 0, F | 0, U() | 0) | 0;
 c = U() | 0;
 G = $f(A | 0, D | 0, 1048576, 0) | 0;
 H = U() | 0;
 R = eg(G | 0, H | 0, 21) | 0;
 R = $f(B | 0, E | 0, R | 0, U() | 0) | 0;
 E = U() | 0;
 B = $f(K | 0, v | 0, 1048576, 0) | 0;
 S = U() | 0;
 Z = eg(B | 0, S | 0, 21) | 0;
 Y = U() | 0;
 S = ag(K | 0, v | 0, B & -2097152 | 0, S | 0) | 0;
 B = U() | 0;
 v = $f(_ | 0, m | 0, 1048576, 0) | 0;
 K = U() | 0;
 O = eg(v | 0, K | 0, 21) | 0;
 N = U() | 0;
 K = ag(_ | 0, m | 0, v & -2097152 | 0, K | 0) | 0;
 v = U() | 0;
 m = $f(g | 0, o | 0, 1048576, 0) | 0;
 _ = U() | 0;
 i = eg(m | 0, _ | 0, 21) | 0;
 h = U() | 0;
 _ = ag(g | 0, o | 0, m & -2097152 | 0, _ | 0) | 0;
 m = U() | 0;
 o = $f(u | 0, j | 0, 1048576, 0) | 0;
 g = U() | 0;
 p = eg(o | 0, g | 0, 21) | 0;
 n = U() | 0;
 g = ag(u | 0, j | 0, o & -2097152 | 0, g | 0) | 0;
 o = U() | 0;
 j = $f(F | 0, c | 0, 1048576, 0) | 0;
 u = U() | 0;
 z = eg(j | 0, u | 0, 21) | 0;
 x = U() | 0;
 u = ag(F | 0, c | 0, j & -2097152 | 0, u | 0) | 0;
 j = U() | 0;
 c = $f(R | 0, E | 0, 1048576, 0) | 0;
 F = U() | 0;
 $ = eg(c | 0, F | 0, 21) | 0;
 q = U() | 0;
 F = ag(R | 0, E | 0, c & -2097152 | 0, F | 0) | 0;
 c = U() | 0;
 E = _f($ | 0, q | 0, 666643, 0) | 0;
 I = $f(E | 0, U() | 0, C | 0, I | 0) | 0;
 C = U() | 0;
 E = _f($ | 0, q | 0, 470296, 0) | 0;
 E = $f(S | 0, B | 0, E | 0, U() | 0) | 0;
 B = U() | 0;
 S = _f($ | 0, q | 0, 654183, 0) | 0;
 R = U() | 0;
 y = _f($ | 0, q | 0, -997805, -1) | 0;
 y = $f(K | 0, v | 0, y | 0, U() | 0) | 0;
 v = U() | 0;
 K = _f($ | 0, q | 0, 136657, 0) | 0;
 J = U() | 0;
 q = _f($ | 0, q | 0, -683901, -1) | 0;
 q = $f(_ | 0, m | 0, q | 0, U() | 0) | 0;
 m = U() | 0;
 C = eg(I | 0, C | 0, 21) | 0;
 C = $f(E | 0, B | 0, C | 0, U() | 0) | 0;
 B = eg(C | 0, U() | 0, 21) | 0;
 E = U() | 0;
 W = $f(Z | 0, Y | 0, X | 0, W | 0) | 0;
 T = ag(W | 0, U() | 0, V & -2097152 | 0, T | 0) | 0;
 R = $f(T | 0, U() | 0, S | 0, R | 0) | 0;
 E = $f(R | 0, U() | 0, B | 0, E | 0) | 0;
 B = eg(E | 0, U() | 0, 21) | 0;
 B = $f(y | 0, v | 0, B | 0, U() | 0) | 0;
 v = eg(B | 0, U() | 0, 21) | 0;
 y = U() | 0;
 N = $f(Q | 0, P | 0, O | 0, N | 0) | 0;
 L = ag(N | 0, U() | 0, M & -2097152 | 0, L | 0) | 0;
 J = $f(L | 0, U() | 0, K | 0, J | 0) | 0;
 y = $f(J | 0, U() | 0, v | 0, y | 0) | 0;
 v = eg(y | 0, U() | 0, 21) | 0;
 v = $f(q | 0, m | 0, v | 0, U() | 0) | 0;
 m = eg(v | 0, U() | 0, 21) | 0;
 q = U() | 0;
 h = $f(f | 0, e | 0, i | 0, h | 0) | 0;
 l = ag(h | 0, U() | 0, k & -2097152 | 0, l | 0) | 0;
 q = $f(l | 0, U() | 0, m | 0, q | 0) | 0;
 m = eg(q | 0, U() | 0, 21) | 0;
 o = $f(m | 0, U() | 0, g | 0, o | 0) | 0;
 g = eg(o | 0, U() | 0, 21) | 0;
 m = U() | 0;
 r = $f(p | 0, n | 0, s | 0, r | 0) | 0;
 w = ag(r | 0, U() | 0, t & -2097152 | 0, w | 0) | 0;
 m = $f(w | 0, U() | 0, g | 0, m | 0) | 0;
 g = eg(m | 0, U() | 0, 21) | 0;
 j = $f(g | 0, U() | 0, u | 0, j | 0) | 0;
 u = eg(j | 0, U() | 0, 21) | 0;
 g = U() | 0;
 D = $f(z | 0, x | 0, A | 0, D | 0) | 0;
 H = ag(D | 0, U() | 0, G & -2097152 | 0, H | 0) | 0;
 g = $f(H | 0, U() | 0, u | 0, g | 0) | 0;
 u = eg(g | 0, U() | 0, 21) | 0;
 c = $f(u | 0, U() | 0, F | 0, c | 0) | 0;
 F = eg(c | 0, U() | 0, 21) | 0;
 u = U() | 0;
 H = _f(F | 0, u | 0, 666643, 0) | 0;
 I = $f(H | 0, U() | 0, I & 2097151 | 0, 0) | 0;
 H = U() | 0;
 G = _f(F | 0, u | 0, 470296, 0) | 0;
 C = $f(G | 0, U() | 0, C & 2097151 | 0, 0) | 0;
 G = U() | 0;
 D = _f(F | 0, u | 0, 654183, 0) | 0;
 E = $f(D | 0, U() | 0, E & 2097151 | 0, 0) | 0;
 D = U() | 0;
 A = _f(F | 0, u | 0, -997805, -1) | 0;
 B = $f(A | 0, U() | 0, B & 2097151 | 0, 0) | 0;
 A = U() | 0;
 x = _f(F | 0, u | 0, 136657, 0) | 0;
 y = $f(x | 0, U() | 0, y & 2097151 | 0, 0) | 0;
 x = U() | 0;
 u = _f(F | 0, u | 0, -683901, -1) | 0;
 v = $f(u | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 u = U() | 0;
 F = eg(I | 0, H | 0, 21) | 0;
 F = $f(C | 0, G | 0, F | 0, U() | 0) | 0;
 G = U() | 0;
 C = eg(F | 0, G | 0, 21) | 0;
 C = $f(E | 0, D | 0, C | 0, U() | 0) | 0;
 D = U() | 0;
 E = F & 2097151;
 z = eg(C | 0, D | 0, 21) | 0;
 z = $f(B | 0, A | 0, z | 0, U() | 0) | 0;
 A = U() | 0;
 B = C & 2097151;
 w = eg(z | 0, A | 0, 21) | 0;
 w = $f(y | 0, x | 0, w | 0, U() | 0) | 0;
 x = U() | 0;
 y = z & 2097151;
 t = eg(w | 0, x | 0, 21) | 0;
 t = $f(v | 0, u | 0, t | 0, U() | 0) | 0;
 u = U() | 0;
 v = w & 2097151;
 r = eg(t | 0, u | 0, 21) | 0;
 q = $f(r | 0, U() | 0, q & 2097151 | 0, 0) | 0;
 r = U() | 0;
 s = t & 2097151;
 n = eg(q | 0, r | 0, 21) | 0;
 o = $f(n | 0, U() | 0, o & 2097151 | 0, 0) | 0;
 n = U() | 0;
 p = q & 2097151;
 l = eg(o | 0, n | 0, 21) | 0;
 m = $f(l | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 l = U() | 0;
 k = eg(m | 0, l | 0, 21) | 0;
 j = $f(k | 0, U() | 0, j & 2097151 | 0, 0) | 0;
 k = U() | 0;
 h = eg(j | 0, k | 0, 21) | 0;
 g = $f(h | 0, U() | 0, g & 2097151 | 0, 0) | 0;
 h = U() | 0;
 i = j & 2097151;
 e = eg(g | 0, h | 0, 21) | 0;
 c = $f(e | 0, U() | 0, c & 2097151 | 0, 0) | 0;
 e = U() | 0;
 f = g & 2097151;
 a[b >> 0] = I;
 J = fg(I | 0, H | 0, 8) | 0;
 U() | 0;
 a[b + 1 >> 0] = J;
 H = fg(I | 0, H | 0, 16) | 0;
 U() | 0;
 I = gg(E | 0, 0, 5) | 0;
 U() | 0;
 a[b + 2 >> 0] = I | H & 31;
 H = fg(F | 0, G | 0, 3) | 0;
 U() | 0;
 a[b + 3 >> 0] = H;
 G = fg(F | 0, G | 0, 11) | 0;
 U() | 0;
 a[b + 4 >> 0] = G;
 E = fg(E | 0, 0, 19) | 0;
 G = U() | 0;
 F = gg(B | 0, 0, 2) | 0;
 U() | 0 | G;
 a[b + 5 >> 0] = F | E;
 D = fg(C | 0, D | 0, 6) | 0;
 U() | 0;
 a[b + 6 >> 0] = D;
 B = fg(B | 0, 0, 14) | 0;
 D = U() | 0;
 C = gg(y | 0, 0, 7) | 0;
 U() | 0 | D;
 a[b + 7 >> 0] = C | B;
 B = fg(z | 0, A | 0, 1) | 0;
 U() | 0;
 a[b + 8 >> 0] = B;
 A = fg(z | 0, A | 0, 9) | 0;
 U() | 0;
 a[b + 9 >> 0] = A;
 y = fg(y | 0, 0, 17) | 0;
 A = U() | 0;
 z = gg(v | 0, 0, 4) | 0;
 U() | 0 | A;
 a[b + 10 >> 0] = z | y;
 y = fg(w | 0, x | 0, 4) | 0;
 U() | 0;
 a[b + 11 >> 0] = y;
 x = fg(w | 0, x | 0, 12) | 0;
 U() | 0;
 a[b + 12 >> 0] = x;
 v = fg(v | 0, 0, 20) | 0;
 x = U() | 0;
 w = gg(s | 0, 0, 1) | 0;
 U() | 0 | x;
 a[b + 13 >> 0] = w | v;
 u = fg(t | 0, u | 0, 7) | 0;
 U() | 0;
 a[b + 14 >> 0] = u;
 s = fg(s | 0, 0, 15) | 0;
 u = U() | 0;
 t = gg(p | 0, 0, 6) | 0;
 U() | 0 | u;
 a[b + 15 >> 0] = t | s;
 s = fg(q | 0, r | 0, 2) | 0;
 U() | 0;
 a[b + 16 >> 0] = s;
 r = fg(q | 0, r | 0, 10) | 0;
 U() | 0;
 a[b + 17 >> 0] = r;
 p = fg(p | 0, 0, 18) | 0;
 r = U() | 0;
 q = gg(o | 0, n | 0, 3) | 0;
 U() | 0 | r;
 a[b + 18 >> 0] = q | p;
 p = fg(o | 0, n | 0, 5) | 0;
 U() | 0;
 a[b + 19 >> 0] = p;
 n = fg(o | 0, n | 0, 13) | 0;
 U() | 0;
 a[b + 20 >> 0] = n;
 a[b + 21 >> 0] = m;
 n = fg(m | 0, l | 0, 8) | 0;
 U() | 0;
 a[b + 22 >> 0] = n;
 l = fg(m | 0, l | 0, 16) | 0;
 U() | 0;
 m = gg(i | 0, 0, 5) | 0;
 U() | 0;
 a[b + 23 >> 0] = m | l & 31;
 l = fg(j | 0, k | 0, 3) | 0;
 U() | 0;
 a[b + 24 >> 0] = l;
 k = fg(j | 0, k | 0, 11) | 0;
 U() | 0;
 a[b + 25 >> 0] = k;
 i = fg(i | 0, 0, 19) | 0;
 k = U() | 0;
 j = gg(f | 0, 0, 2) | 0;
 U() | 0 | k;
 a[b + 26 >> 0] = j | i;
 h = fg(g | 0, h | 0, 6) | 0;
 U() | 0;
 a[b + 27 >> 0] = h;
 f = fg(f | 0, 0, 14) | 0;
 h = U() | 0;
 g = gg(c | 0, e | 0, 7) | 0;
 U() | 0 | h;
 a[b + 28 >> 0] = g | f;
 f = fg(c | 0, e | 0, 1) | 0;
 U() | 0;
 a[b + 29 >> 0] = f;
 f = fg(c | 0, e | 0, 9) | 0;
 U() | 0;
 a[b + 30 >> 0] = f;
 e = eg(c | 0, e | 0, 17) | 0;
 U() | 0;
 a[b + 31 >> 0] = e;
 return;
}

function Gc(b, c, e) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0;
 R = a[c + 2 >> 0] | 0;
 J = d[c >> 0] | 0;
 l = gg(d[c + 1 >> 0] | 0 | 0, 0, 8) | 0;
 P = U() | 0;
 R = R & 255;
 I = gg(R | 0, 0, 16) | 0;
 U() | 0;
 h = gg(d[c + 3 >> 0] | 0 | 0, 0, 8) | 0;
 f = U() | 0;
 M = gg(d[c + 4 >> 0] | 0 | 0, 0, 16) | 0;
 f = f | (U() | 0);
 m = d[c + 5 >> 0] | 0;
 g = gg(m | 0, 0, 24) | 0;
 f = fg(h | R | M | g | 0, f | (U() | 0) | 0, 5) | 0;
 U() | 0;
 g = a[c + 7 >> 0] | 0;
 M = gg(d[c + 6 >> 0] | 0 | 0, 0, 8) | 0;
 R = U() | 0;
 g = g & 255;
 h = gg(g | 0, 0, 16) | 0;
 R = fg(M | m | h | 0, R | (U() | 0) | 0, 2) | 0;
 U() | 0;
 h = gg(d[c + 8 >> 0] | 0 | 0, 0, 8) | 0;
 m = U() | 0;
 M = gg(d[c + 9 >> 0] | 0 | 0, 0, 16) | 0;
 m = m | (U() | 0);
 n = d[c + 10 >> 0] | 0;
 u = gg(n | 0, 0, 24) | 0;
 m = fg(h | g | M | u | 0, m | (U() | 0) | 0, 7) | 0;
 U() | 0;
 u = gg(d[c + 11 >> 0] | 0 | 0, 0, 8) | 0;
 M = U() | 0;
 g = gg(d[c + 12 >> 0] | 0 | 0, 0, 16) | 0;
 M = M | (U() | 0);
 h = d[c + 13 >> 0] | 0;
 j = gg(h | 0, 0, 24) | 0;
 M = fg(u | n | g | j | 0, M | (U() | 0) | 0, 4) | 0;
 U() | 0;
 j = a[c + 15 >> 0] | 0;
 g = gg(d[c + 14 >> 0] | 0 | 0, 0, 8) | 0;
 n = U() | 0;
 j = j & 255;
 u = gg(j | 0, 0, 16) | 0;
 n = fg(g | h | u | 0, n | (U() | 0) | 0, 1) | 0;
 U() | 0;
 u = gg(d[c + 16 >> 0] | 0 | 0, 0, 8) | 0;
 h = U() | 0;
 g = gg(d[c + 17 >> 0] | 0 | 0, 0, 16) | 0;
 h = h | (U() | 0);
 D = d[c + 18 >> 0] | 0;
 z = gg(D | 0, 0, 24) | 0;
 h = fg(u | j | g | z | 0, h | (U() | 0) | 0, 6) | 0;
 U() | 0;
 z = a[c + 20 >> 0] | 0;
 g = gg(d[c + 19 >> 0] | 0 | 0, 0, 8) | 0;
 j = U() | 0;
 z = gg(z & 255 | 0, 0, 16) | 0;
 j = fg(g | D | z | 0, j | (U() | 0) | 0, 3) | 0;
 z = U() | 0;
 D = a[c + 23 >> 0] | 0;
 g = d[c + 21 >> 0] | 0;
 u = gg(d[c + 22 >> 0] | 0 | 0, 0, 8) | 0;
 t = U() | 0;
 D = D & 255;
 w = gg(D | 0, 0, 16) | 0;
 U() | 0;
 x = gg(d[c + 24 >> 0] | 0 | 0, 0, 8) | 0;
 H = U() | 0;
 Q = gg(d[c + 25 >> 0] | 0 | 0, 0, 16) | 0;
 H = H | (U() | 0);
 E = d[c + 26 >> 0] | 0;
 r = gg(E | 0, 0, 24) | 0;
 H = fg(x | D | Q | r | 0, H | (U() | 0) | 0, 5) | 0;
 U() | 0;
 r = a[c + 28 >> 0] | 0;
 Q = gg(d[c + 27 >> 0] | 0 | 0, 0, 8) | 0;
 D = U() | 0;
 r = r & 255;
 x = gg(r | 0, 0, 16) | 0;
 D = fg(Q | E | x | 0, D | (U() | 0) | 0, 2) | 0;
 U() | 0;
 x = gg(d[c + 29 >> 0] | 0 | 0, 0, 8) | 0;
 E = U() | 0;
 Q = gg(d[c + 30 >> 0] | 0 | 0, 0, 16) | 0;
 E = E | (U() | 0);
 B = gg(d[c + 31 >> 0] | 0 | 0, 0, 24) | 0;
 E = fg(x | r | Q | B | 0, E | (U() | 0) | 0, 7) | 0;
 B = U() | 0;
 Q = a[e + 2 >> 0] | 0;
 r = d[e >> 0] | 0;
 x = gg(d[e + 1 >> 0] | 0 | 0, 0, 8) | 0;
 p = U() | 0;
 Q = Q & 255;
 s = gg(Q | 0, 0, 16) | 0;
 U() | 0;
 k = gg(d[e + 3 >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 L = gg(d[e + 4 >> 0] | 0 | 0, 0, 16) | 0;
 v = v | (U() | 0);
 V = d[e + 5 >> 0] | 0;
 O = gg(V | 0, 0, 24) | 0;
 v = fg(k | Q | L | O | 0, v | (U() | 0) | 0, 5) | 0;
 U() | 0;
 O = a[e + 7 >> 0] | 0;
 L = gg(d[e + 6 >> 0] | 0 | 0, 0, 8) | 0;
 Q = U() | 0;
 O = O & 255;
 k = gg(O | 0, 0, 16) | 0;
 Q = fg(L | V | k | 0, Q | (U() | 0) | 0, 2) | 0;
 U() | 0;
 k = gg(d[e + 8 >> 0] | 0 | 0, 0, 8) | 0;
 V = U() | 0;
 L = gg(d[e + 9 >> 0] | 0 | 0, 0, 16) | 0;
 V = V | (U() | 0);
 o = d[e + 10 >> 0] | 0;
 T = gg(o | 0, 0, 24) | 0;
 V = fg(k | O | L | T | 0, V | (U() | 0) | 0, 7) | 0;
 U() | 0;
 T = gg(d[e + 11 >> 0] | 0 | 0, 0, 8) | 0;
 L = U() | 0;
 O = gg(d[e + 12 >> 0] | 0 | 0, 0, 16) | 0;
 L = L | (U() | 0);
 k = d[e + 13 >> 0] | 0;
 K = gg(k | 0, 0, 24) | 0;
 L = fg(T | o | O | K | 0, L | (U() | 0) | 0, 4) | 0;
 U() | 0;
 K = a[e + 15 >> 0] | 0;
 O = gg(d[e + 14 >> 0] | 0 | 0, 0, 8) | 0;
 o = U() | 0;
 K = K & 255;
 T = gg(K | 0, 0, 16) | 0;
 o = fg(O | k | T | 0, o | (U() | 0) | 0, 1) | 0;
 U() | 0;
 T = gg(d[e + 16 >> 0] | 0 | 0, 0, 8) | 0;
 k = U() | 0;
 O = gg(d[e + 17 >> 0] | 0 | 0, 0, 16) | 0;
 k = k | (U() | 0);
 G = d[e + 18 >> 0] | 0;
 S = gg(G | 0, 0, 24) | 0;
 k = fg(T | K | O | S | 0, k | (U() | 0) | 0, 6) | 0;
 U() | 0;
 S = a[e + 20 >> 0] | 0;
 O = gg(d[e + 19 >> 0] | 0 | 0, 0, 8) | 0;
 K = U() | 0;
 S = gg(S & 255 | 0, 0, 16) | 0;
 K = fg(O | G | S | 0, K | (U() | 0) | 0, 3) | 0;
 S = U() | 0;
 G = a[e + 23 >> 0] | 0;
 O = d[e + 21 >> 0] | 0;
 T = gg(d[e + 22 >> 0] | 0 | 0, 0, 8) | 0;
 c = U() | 0;
 G = G & 255;
 N = gg(G | 0, 0, 16) | 0;
 U() | 0;
 q = gg(d[e + 24 >> 0] | 0 | 0, 0, 8) | 0;
 F = U() | 0;
 A = gg(d[e + 25 >> 0] | 0 | 0, 0, 16) | 0;
 F = F | (U() | 0);
 C = d[e + 26 >> 0] | 0;
 W = gg(C | 0, 0, 24) | 0;
 F = fg(q | G | A | W | 0, F | (U() | 0) | 0, 5) | 0;
 U() | 0;
 W = a[e + 28 >> 0] | 0;
 A = gg(d[e + 27 >> 0] | 0 | 0, 0, 8) | 0;
 G = U() | 0;
 W = W & 255;
 q = gg(W | 0, 0, 16) | 0;
 G = fg(A | C | q | 0, G | (U() | 0) | 0, 2) | 0;
 U() | 0;
 q = gg(d[e + 29 >> 0] | 0 | 0, 0, 8) | 0;
 C = U() | 0;
 A = gg(d[e + 30 >> 0] | 0 | 0, 0, 16) | 0;
 C = C | (U() | 0);
 e = gg(d[e + 31 >> 0] | 0 | 0, 0, 24) | 0;
 e = fg(q | W | A | e | 0, C | (U() | 0) | 0, 7) | 0;
 C = U() | 0;
 P = $f(x | r | s & 2031616 | 0, p | 0, l | J | I & 2031616 | 0, P | 0) | 0;
 I = U() | 0;
 R = $f(Q & 2097151 | 0, 0, R & 2097151 | 0, 0) | 0;
 Q = U() | 0;
 M = $f(L & 2097151 | 0, 0, M & 2097151 | 0, 0) | 0;
 L = U() | 0;
 n = $f(o & 2097151 | 0, 0, n & 2097151 | 0, 0) | 0;
 o = U() | 0;
 h = $f(k & 2097151 | 0, 0, h & 2097151 | 0, 0) | 0;
 k = U() | 0;
 z = $f(K | 0, S | 0, j | 0, z | 0) | 0;
 j = U() | 0;
 t = $f(T | O | N & 2031616 | 0, c | 0, u | g | w & 2031616 | 0, t | 0) | 0;
 w = U() | 0;
 D = $f(G & 2097151 | 0, 0, D & 2097151 | 0, 0) | 0;
 G = U() | 0;
 B = $f(e | 0, C | 0, E | 0, B | 0) | 0;
 E = U() | 0;
 C = $f(P | 0, I | 0, 1048576, 0) | 0;
 e = fg(C | 0, U() | 0, 21) | 0;
 e = $f(e | 0, U() | 0, f & 2097151 | 0, 0) | 0;
 e = $f(e | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 v = U() | 0;
 C = ag(P | 0, I | 0, C & 6291456 | 0, 0) | 0;
 I = U() | 0;
 P = $f(R | 0, Q | 0, 1048576, 0) | 0;
 f = fg(P | 0, U() | 0, 21) | 0;
 m = $f(f | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 V = $f(m | 0, U() | 0, V & 2097151 | 0, 0) | 0;
 m = U() | 0;
 f = $f(M | 0, L | 0, 1048576, 0) | 0;
 g = fg(f | 0, U() | 0, 21) | 0;
 g = $f(n | 0, o | 0, g | 0, U() | 0) | 0;
 o = U() | 0;
 n = $f(h | 0, k | 0, 1048576, 0) | 0;
 u = fg(n | 0, U() | 0, 21) | 0;
 u = $f(z | 0, j | 0, u | 0, U() | 0) | 0;
 j = U() | 0;
 z = $f(t | 0, w | 0, 1048576, 0) | 0;
 c = fg(z | 0, U() | 0, 21) | 0;
 c = $f(c | 0, U() | 0, H & 2097151 | 0, 0) | 0;
 F = $f(c | 0, U() | 0, F & 2097151 | 0, 0) | 0;
 c = U() | 0;
 H = $f(D | 0, G | 0, 1048576, 0) | 0;
 N = fg(H | 0, U() | 0, 21) | 0;
 N = $f(B | 0, E | 0, N | 0, U() | 0) | 0;
 E = U() | 0;
 B = $f(e | 0, v | 0, 1048576, 0) | 0;
 O = U() | 0;
 T = fg(B | 0, O | 0, 21) | 0;
 S = U() | 0;
 O = ag(e | 0, v | 0, B & -2097152 | 0, O & 8191 | 0) | 0;
 B = U() | 0;
 v = $f(V | 0, m | 0, 1048576, 0) | 0;
 e = U() | 0;
 K = fg(v | 0, e | 0, 21) | 0;
 J = U() | 0;
 e = ag(V | 0, m | 0, v & -2097152 | 0, e & 8191 | 0) | 0;
 v = U() | 0;
 m = $f(g | 0, o | 0, 1048576, 0) | 0;
 V = U() | 0;
 l = fg(m | 0, V | 0, 21) | 0;
 p = U() | 0;
 V = ag(g | 0, o | 0, m & -2097152 | 0, V & 8191 | 0) | 0;
 m = U() | 0;
 o = $f(u | 0, j | 0, 1048576, 0) | 0;
 g = U() | 0;
 s = fg(o | 0, g | 0, 21) | 0;
 r = U() | 0;
 g = ag(u | 0, j | 0, o & -2097152 | 0, g & 8191 | 0) | 0;
 o = U() | 0;
 j = $f(F | 0, c | 0, 1048576, 0) | 0;
 u = U() | 0;
 x = fg(j | 0, u | 0, 21) | 0;
 A = U() | 0;
 u = ag(F | 0, c | 0, j & -2097152 | 0, u & 8191 | 0) | 0;
 j = U() | 0;
 c = $f(N | 0, E | 0, 1048576, 0) | 0;
 F = U() | 0;
 W = fg(c | 0, F | 0, 21) | 0;
 q = U() | 0;
 F = ag(N | 0, E | 0, c & -2097152 | 0, F & 268435455 | 0) | 0;
 c = U() | 0;
 E = _f(W | 0, q | 0, 666643, 0) | 0;
 I = $f(E | 0, U() | 0, C | 0, I | 0) | 0;
 C = U() | 0;
 E = _f(W | 0, q | 0, 470296, 0) | 0;
 E = $f(O | 0, B | 0, E | 0, U() | 0) | 0;
 B = U() | 0;
 O = _f(W | 0, q | 0, 654183, 0) | 0;
 N = U() | 0;
 y = _f(W | 0, q | 0, -997805, -1) | 0;
 y = $f(e | 0, v | 0, y | 0, U() | 0) | 0;
 v = U() | 0;
 e = _f(W | 0, q | 0, 136657, 0) | 0;
 i = U() | 0;
 q = _f(W | 0, q | 0, -683901, -1) | 0;
 q = $f(V | 0, m | 0, q | 0, U() | 0) | 0;
 m = U() | 0;
 C = eg(I | 0, C | 0, 21) | 0;
 C = $f(E | 0, B | 0, C | 0, U() | 0) | 0;
 B = eg(C | 0, U() | 0, 21) | 0;
 E = U() | 0;
 Q = $f(T | 0, S | 0, R | 0, Q | 0) | 0;
 P = ag(Q | 0, U() | 0, P & 6291456 | 0, 0) | 0;
 N = $f(P | 0, U() | 0, O | 0, N | 0) | 0;
 E = $f(N | 0, U() | 0, B | 0, E | 0) | 0;
 B = eg(E | 0, U() | 0, 21) | 0;
 B = $f(y | 0, v | 0, B | 0, U() | 0) | 0;
 v = eg(B | 0, U() | 0, 21) | 0;
 y = U() | 0;
 J = $f(M | 0, L | 0, K | 0, J | 0) | 0;
 f = ag(J | 0, U() | 0, f & 6291456 | 0, 0) | 0;
 i = $f(f | 0, U() | 0, e | 0, i | 0) | 0;
 y = $f(i | 0, U() | 0, v | 0, y | 0) | 0;
 v = eg(y | 0, U() | 0, 21) | 0;
 v = $f(q | 0, m | 0, v | 0, U() | 0) | 0;
 m = eg(v | 0, U() | 0, 21) | 0;
 q = U() | 0;
 p = $f(h | 0, k | 0, l | 0, p | 0) | 0;
 n = ag(p | 0, U() | 0, n & 6291456 | 0, 0) | 0;
 q = $f(n | 0, U() | 0, m | 0, q | 0) | 0;
 m = eg(q | 0, U() | 0, 21) | 0;
 o = $f(m | 0, U() | 0, g | 0, o | 0) | 0;
 g = eg(o | 0, U() | 0, 21) | 0;
 m = U() | 0;
 w = $f(s | 0, r | 0, t | 0, w | 0) | 0;
 z = ag(w | 0, U() | 0, z & 6291456 | 0, 0) | 0;
 m = $f(z | 0, U() | 0, g | 0, m | 0) | 0;
 g = eg(m | 0, U() | 0, 21) | 0;
 j = $f(g | 0, U() | 0, u | 0, j | 0) | 0;
 u = eg(j | 0, U() | 0, 21) | 0;
 g = U() | 0;
 G = $f(x | 0, A | 0, D | 0, G | 0) | 0;
 H = ag(G | 0, U() | 0, H & 6291456 | 0, 0) | 0;
 g = $f(H | 0, U() | 0, u | 0, g | 0) | 0;
 u = eg(g | 0, U() | 0, 21) | 0;
 c = $f(u | 0, U() | 0, F | 0, c | 0) | 0;
 F = eg(c | 0, U() | 0, 21) | 0;
 u = U() | 0;
 H = _f(F | 0, u | 0, 666643, 0) | 0;
 I = $f(H | 0, U() | 0, I & 2097151 | 0, 0) | 0;
 H = U() | 0;
 G = _f(F | 0, u | 0, 470296, 0) | 0;
 C = $f(G | 0, U() | 0, C & 2097151 | 0, 0) | 0;
 G = U() | 0;
 D = _f(F | 0, u | 0, 654183, 0) | 0;
 E = $f(D | 0, U() | 0, E & 2097151 | 0, 0) | 0;
 D = U() | 0;
 A = _f(F | 0, u | 0, -997805, -1) | 0;
 B = $f(A | 0, U() | 0, B & 2097151 | 0, 0) | 0;
 A = U() | 0;
 x = _f(F | 0, u | 0, 136657, 0) | 0;
 y = $f(x | 0, U() | 0, y & 2097151 | 0, 0) | 0;
 x = U() | 0;
 u = _f(F | 0, u | 0, -683901, -1) | 0;
 v = $f(u | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 u = U() | 0;
 F = eg(I | 0, H | 0, 21) | 0;
 F = $f(C | 0, G | 0, F | 0, U() | 0) | 0;
 G = U() | 0;
 C = eg(F | 0, G | 0, 21) | 0;
 C = $f(E | 0, D | 0, C | 0, U() | 0) | 0;
 D = U() | 0;
 E = F & 2097151;
 z = eg(C | 0, D | 0, 21) | 0;
 z = $f(B | 0, A | 0, z | 0, U() | 0) | 0;
 A = U() | 0;
 B = C & 2097151;
 w = eg(z | 0, A | 0, 21) | 0;
 w = $f(y | 0, x | 0, w | 0, U() | 0) | 0;
 x = U() | 0;
 y = z & 2097151;
 t = eg(w | 0, x | 0, 21) | 0;
 t = $f(v | 0, u | 0, t | 0, U() | 0) | 0;
 u = U() | 0;
 v = w & 2097151;
 r = eg(t | 0, u | 0, 21) | 0;
 q = $f(r | 0, U() | 0, q & 2097151 | 0, 0) | 0;
 r = U() | 0;
 s = t & 2097151;
 n = eg(q | 0, r | 0, 21) | 0;
 o = $f(n | 0, U() | 0, o & 2097151 | 0, 0) | 0;
 n = U() | 0;
 p = q & 2097151;
 l = eg(o | 0, n | 0, 21) | 0;
 m = $f(l | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 l = U() | 0;
 k = eg(m | 0, l | 0, 21) | 0;
 j = $f(k | 0, U() | 0, j & 2097151 | 0, 0) | 0;
 k = U() | 0;
 h = eg(j | 0, k | 0, 21) | 0;
 g = $f(h | 0, U() | 0, g & 2097151 | 0, 0) | 0;
 h = U() | 0;
 i = j & 2097151;
 e = eg(g | 0, h | 0, 21) | 0;
 c = $f(e | 0, U() | 0, c & 2097151 | 0, 0) | 0;
 e = U() | 0;
 f = g & 2097151;
 a[b >> 0] = I;
 J = fg(I | 0, H | 0, 8) | 0;
 U() | 0;
 a[b + 1 >> 0] = J;
 H = fg(I | 0, H | 0, 16) | 0;
 U() | 0;
 I = gg(E | 0, 0, 5) | 0;
 U() | 0;
 a[b + 2 >> 0] = I | H & 31;
 H = fg(F | 0, G | 0, 3) | 0;
 U() | 0;
 a[b + 3 >> 0] = H;
 G = fg(F | 0, G | 0, 11) | 0;
 U() | 0;
 a[b + 4 >> 0] = G;
 E = fg(E | 0, 0, 19) | 0;
 G = U() | 0;
 F = gg(B | 0, 0, 2) | 0;
 U() | 0 | G;
 a[b + 5 >> 0] = F | E;
 D = fg(C | 0, D | 0, 6) | 0;
 U() | 0;
 a[b + 6 >> 0] = D;
 B = fg(B | 0, 0, 14) | 0;
 D = U() | 0;
 C = gg(y | 0, 0, 7) | 0;
 U() | 0 | D;
 a[b + 7 >> 0] = C | B;
 B = fg(z | 0, A | 0, 1) | 0;
 U() | 0;
 a[b + 8 >> 0] = B;
 A = fg(z | 0, A | 0, 9) | 0;
 U() | 0;
 a[b + 9 >> 0] = A;
 y = fg(y | 0, 0, 17) | 0;
 A = U() | 0;
 z = gg(v | 0, 0, 4) | 0;
 U() | 0 | A;
 a[b + 10 >> 0] = z | y;
 y = fg(w | 0, x | 0, 4) | 0;
 U() | 0;
 a[b + 11 >> 0] = y;
 x = fg(w | 0, x | 0, 12) | 0;
 U() | 0;
 a[b + 12 >> 0] = x;
 v = fg(v | 0, 0, 20) | 0;
 x = U() | 0;
 w = gg(s | 0, 0, 1) | 0;
 U() | 0 | x;
 a[b + 13 >> 0] = w | v;
 u = fg(t | 0, u | 0, 7) | 0;
 U() | 0;
 a[b + 14 >> 0] = u;
 s = fg(s | 0, 0, 15) | 0;
 u = U() | 0;
 t = gg(p | 0, 0, 6) | 0;
 U() | 0 | u;
 a[b + 15 >> 0] = t | s;
 s = fg(q | 0, r | 0, 2) | 0;
 U() | 0;
 a[b + 16 >> 0] = s;
 r = fg(q | 0, r | 0, 10) | 0;
 U() | 0;
 a[b + 17 >> 0] = r;
 p = fg(p | 0, 0, 18) | 0;
 r = U() | 0;
 q = gg(o | 0, n | 0, 3) | 0;
 U() | 0 | r;
 a[b + 18 >> 0] = q | p;
 p = fg(o | 0, n | 0, 5) | 0;
 U() | 0;
 a[b + 19 >> 0] = p;
 n = fg(o | 0, n | 0, 13) | 0;
 U() | 0;
 a[b + 20 >> 0] = n;
 a[b + 21 >> 0] = m;
 n = fg(m | 0, l | 0, 8) | 0;
 U() | 0;
 a[b + 22 >> 0] = n;
 l = fg(m | 0, l | 0, 16) | 0;
 U() | 0;
 m = gg(i | 0, 0, 5) | 0;
 U() | 0;
 a[b + 23 >> 0] = m | l & 31;
 l = fg(j | 0, k | 0, 3) | 0;
 U() | 0;
 a[b + 24 >> 0] = l;
 k = fg(j | 0, k | 0, 11) | 0;
 U() | 0;
 a[b + 25 >> 0] = k;
 i = fg(i | 0, 0, 19) | 0;
 k = U() | 0;
 j = gg(f | 0, 0, 2) | 0;
 U() | 0 | k;
 a[b + 26 >> 0] = j | i;
 h = fg(g | 0, h | 0, 6) | 0;
 U() | 0;
 a[b + 27 >> 0] = h;
 f = fg(f | 0, 0, 14) | 0;
 h = U() | 0;
 g = gg(c | 0, e | 0, 7) | 0;
 U() | 0 | h;
 a[b + 28 >> 0] = g | f;
 f = fg(c | 0, e | 0, 1) | 0;
 U() | 0;
 a[b + 29 >> 0] = f;
 f = fg(c | 0, e | 0, 9) | 0;
 U() | 0;
 a[b + 30 >> 0] = f;
 e = eg(c | 0, e | 0, 17) | 0;
 U() | 0;
 a[b + 31 >> 0] = e;
 return;
}

function qc(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0;
 qa = k;
 k = k + 224 | 0;
 ma = qa + 192 | 0;
 na = qa + 144 | 0;
 y = qa + 96 | 0;
 oa = qa + 48 | 0;
 pa = qa;
 o = d[e >> 0] | 0;
 p = gg(d[e + 1 >> 0] | 0 | 0, 0, 8) | 0;
 n = U() | 0;
 fa = gg(d[e + 2 >> 0] | 0 | 0, 0, 16) | 0;
 n = n | (U() | 0);
 m = gg(d[e + 3 >> 0] | 0 | 0, 0, 24) | 0;
 m = p | o | fa | m;
 n = n | (U() | 0);
 fa = a[e + 6 >> 0] | 0;
 o = d[e + 4 >> 0] | 0;
 p = gg(d[e + 5 >> 0] | 0 | 0, 0, 8) | 0;
 ga = U() | 0;
 fa = gg(fa & 255 | 0, 0, 16) | 0;
 fa = p | o | fa;
 ga = ga | (U() | 0);
 o = gg(fa | 0, ga | 0, 6) | 0;
 p = U() | 0;
 q = a[e + 9 >> 0] | 0;
 ha = d[e + 7 >> 0] | 0;
 s = gg(d[e + 8 >> 0] | 0 | 0, 0, 8) | 0;
 r = U() | 0;
 q = gg(q & 255 | 0, 0, 16) | 0;
 q = s | ha | q;
 r = r | (U() | 0);
 ha = a[e + 12 >> 0] | 0;
 s = d[e + 10 >> 0] | 0;
 t = gg(d[e + 11 >> 0] | 0 | 0, 0, 8) | 0;
 ia = U() | 0;
 ha = gg(ha & 255 | 0, 0, 16) | 0;
 ha = t | s | ha;
 ia = ia | (U() | 0);
 s = gg(ha | 0, ia | 0, 3) | 0;
 t = U() | 0;
 u = a[e + 15 >> 0] | 0;
 ja = d[e + 13 >> 0] | 0;
 h = gg(d[e + 14 >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 u = gg(u & 255 | 0, 0, 16) | 0;
 u = h | ja | u;
 v = v | (U() | 0);
 ja = d[e + 16 >> 0] | 0;
 h = gg(d[e + 17 >> 0] | 0 | 0, 0, 8) | 0;
 x = U() | 0;
 f = gg(d[e + 18 >> 0] | 0 | 0, 0, 16) | 0;
 x = x | (U() | 0);
 w = gg(d[e + 19 >> 0] | 0 | 0, 0, 24) | 0;
 w = h | ja | f | w;
 x = x | (U() | 0);
 f = a[e + 22 >> 0] | 0;
 ja = d[e + 20 >> 0] | 0;
 h = gg(d[e + 21 >> 0] | 0 | 0, 0, 8) | 0;
 g = U() | 0;
 f = gg(f & 255 | 0, 0, 16) | 0;
 f = h | ja | f;
 g = g | (U() | 0);
 ja = a[e + 25 >> 0] | 0;
 h = d[e + 23 >> 0] | 0;
 i = gg(d[e + 24 >> 0] | 0 | 0, 0, 8) | 0;
 ka = U() | 0;
 ja = gg(ja & 255 | 0, 0, 16) | 0;
 ja = i | h | ja;
 ka = ka | (U() | 0);
 h = gg(ja | 0, ka | 0, 5) | 0;
 i = U() | 0;
 j = a[e + 28 >> 0] | 0;
 la = d[e + 26 >> 0] | 0;
 ea = gg(d[e + 27 >> 0] | 0 | 0, 0, 8) | 0;
 l = U() | 0;
 j = gg(j & 255 | 0, 0, 16) | 0;
 j = ea | la | j;
 l = l | (U() | 0);
 la = e + 31 | 0;
 ea = a[la >> 0] | 0;
 da = d[e + 29 >> 0] | 0;
 ca = gg(d[e + 30 >> 0] | 0 | 0, 0, 8) | 0;
 e = U() | 0;
 ea = gg(ea & 255 | 0, 0, 16) | 0;
 e = gg(ca | da | ea | 0, e | (U() | 0) | 0, 2) | 0;
 U() | 0;
 e = e & 33554428;
 if ((n >>> 0 > 0 | (n | 0) == 0 & m >>> 0 > 4294967276) & ((fa | 0) == 16777215 & (ga | 0) == 0 & ((q | 0) == 16777215 & (r | 0) == 0 & ((ha | 0) == 16777215 & (ia | 0) == 0 & ((u | 0) == 16777215 & (v | 0) == 0 & ((w | 0) == -1 & (x | 0) == 0 & ((f | 0) == 16777215 & (g | 0) == 0 & ((ja | 0) == 16777215 & (ka | 0) == 0 & ((j | 0) == 16777215 & (l | 0) == 0 & ((e | 0) == 33554428 & 0 == 0)))))))))) {
  pa = -1;
  k = qa;
  return pa | 0;
 }
 Y = gg(q | 0, r | 0, 5) | 0;
 ha = U() | 0;
 ia = gg(u | 0, v | 0, 2) | 0;
 ja = U() | 0;
 f = gg(f | 0, g | 0, 7) | 0;
 ba = U() | 0;
 da = gg(j | 0, l | 0, 4) | 0;
 ka = U() | 0;
 g = $f(e | 0, 0, 16777216, 0) | 0;
 Z = fg(g | 0, U() | 0, 25) | 0;
 Z = ag(0, 0, Z | 0, U() | 0) | 0;
 U() | 0;
 Z = $f(Z & 19 | 0, 0, m | 0, n | 0) | 0;
 fa = U() | 0;
 X = $f(o | 0, p | 0, 16777216, 0) | 0;
 _ = fg(X | 0, U() | 0, 25) | 0;
 _ = $f(Y | 0, ha | 0, _ | 0, U() | 0) | 0;
 ha = U() | 0;
 X = ag(o | 0, p | 0, X & -33554432 | 0, 0) | 0;
 Y = U() | 0;
 ga = $f(s | 0, t | 0, 16777216, 0) | 0;
 $ = fg(ga | 0, U() | 0, 25) | 0;
 $ = $f(ia | 0, ja | 0, $ | 0, U() | 0) | 0;
 ja = U() | 0;
 ia = $f(w | 0, x | 0, 16777216, 0) | 0;
 aa = fg(ia | 0, U() | 0, 25) | 0;
 aa = $f(f | 0, ba | 0, aa | 0, U() | 0) | 0;
 ba = U() | 0;
 f = $f(h | 0, i | 0, 16777216, 0) | 0;
 ca = fg(f | 0, U() | 0, 25) | 0;
 ca = $f(da | 0, ka | 0, ca | 0, U() | 0) | 0;
 ka = U() | 0;
 da = $f(Z | 0, fa | 0, 33554432, 0) | 0;
 ea = fg(da | 0, U() | 0, 26) | 0;
 ea = $f(X | 0, Y | 0, ea | 0, U() | 0) | 0;
 U() | 0;
 da = ag(Z | 0, fa | 0, da & -67108864 | 0, 0) | 0;
 U() | 0;
 fa = $f(_ | 0, ha | 0, 33554432, 0) | 0;
 Z = fg(fa | 0, U() | 0, 26) | 0;
 Z = $f(Z | 0, U() | 0, s | 0, t | 0) | 0;
 ga = ag(Z | 0, U() | 0, ga & -33554432 | 0, 0) | 0;
 U() | 0;
 fa = ag(_ | 0, ha | 0, fa & -67108864 | 0, 0) | 0;
 U() | 0;
 ha = $f($ | 0, ja | 0, 33554432, 0) | 0;
 _ = fg(ha | 0, U() | 0, 26) | 0;
 _ = $f(_ | 0, U() | 0, w | 0, x | 0) | 0;
 ia = ag(_ | 0, U() | 0, ia & -33554432 | 0, 0) | 0;
 U() | 0;
 ha = ag($ | 0, ja | 0, ha & -67108864 | 0, 0) | 0;
 U() | 0;
 ja = $f(aa | 0, ba | 0, 33554432, 0) | 0;
 $ = fg(ja | 0, U() | 0, 26) | 0;
 h = $f($ | 0, U() | 0, h | 0, i | 0) | 0;
 f = ag(h | 0, U() | 0, f & -33554432 | 0, 0) | 0;
 U() | 0;
 ja = ag(aa | 0, ba | 0, ja & -67108864 | 0, 0) | 0;
 U() | 0;
 h = $f(ca | 0, ka | 0, 33554432, 0) | 0;
 ba = fg(h | 0, U() | 0, 26) | 0;
 e = $f(e | 0, 0, ba | 0, U() | 0) | 0;
 g = ag(e | 0, U() | 0, g & 33554432 | 0, 0) | 0;
 U() | 0;
 h = ag(ca | 0, ka | 0, h & -67108864 | 0, 0) | 0;
 U() | 0;
 ka = b + 40 | 0;
 c[ka >> 2] = da;
 c[b + 44 >> 2] = ea;
 c[b + 48 >> 2] = fa;
 c[b + 52 >> 2] = ga;
 c[b + 56 >> 2] = ha;
 c[b + 60 >> 2] = ia;
 c[b + 64 >> 2] = ja;
 c[b + 68 >> 2] = f;
 c[b + 72 >> 2] = h;
 c[b + 76 >> 2] = g;
 g = b + 80 | 0;
 c[g >> 2] = 1;
 h = b + 84 | 0;
 e = h;
 f = e + 36 | 0;
 do {
  c[e >> 2] = 0;
  e = e + 4 | 0;
 } while ((e | 0) < (f | 0));
 ic(na, ka);
 ec(y, na, 16);
 ba = na + 4 | 0;
 ca = na + 8 | 0;
 da = na + 12 | 0;
 ea = na + 16 | 0;
 fa = na + 20 | 0;
 ga = na + 24 | 0;
 ha = na + 28 | 0;
 ia = na + 32 | 0;
 ja = na + 36 | 0;
 I = c[g >> 2] | 0;
 H = c[h >> 2] | 0;
 F = c[b + 88 >> 2] | 0;
 D = c[b + 92 >> 2] | 0;
 B = c[b + 96 >> 2] | 0;
 z = c[b + 100 >> 2] | 0;
 m = c[b + 104 >> 2] | 0;
 j = c[b + 108 >> 2] | 0;
 h = c[b + 112 >> 2] | 0;
 f = c[b + 116 >> 2] | 0;
 o = (c[na >> 2] | 0) - I | 0;
 p = (c[ba >> 2] | 0) - H | 0;
 q = (c[ca >> 2] | 0) - F | 0;
 r = (c[da >> 2] | 0) - D | 0;
 s = (c[ea >> 2] | 0) - B | 0;
 t = (c[fa >> 2] | 0) - z | 0;
 u = (c[ga >> 2] | 0) - m | 0;
 v = (c[ha >> 2] | 0) - j | 0;
 w = (c[ia >> 2] | 0) - h | 0;
 x = (c[ja >> 2] | 0) - f | 0;
 c[na >> 2] = o;
 c[ba >> 2] = p;
 c[ca >> 2] = q;
 c[da >> 2] = r;
 c[ea >> 2] = s;
 c[fa >> 2] = t;
 c[ga >> 2] = u;
 c[ha >> 2] = v;
 c[ia >> 2] = w;
 c[ja >> 2] = x;
 G = y + 4 | 0;
 E = y + 8 | 0;
 C = y + 12 | 0;
 A = y + 16 | 0;
 n = y + 20 | 0;
 l = y + 24 | 0;
 i = y + 28 | 0;
 g = y + 32 | 0;
 e = y + 36 | 0;
 H = (c[G >> 2] | 0) + H | 0;
 F = (c[E >> 2] | 0) + F | 0;
 D = (c[C >> 2] | 0) + D | 0;
 B = (c[A >> 2] | 0) + B | 0;
 z = (c[n >> 2] | 0) + z | 0;
 m = (c[l >> 2] | 0) + m | 0;
 j = (c[i >> 2] | 0) + j | 0;
 h = (c[g >> 2] | 0) + h | 0;
 f = (c[e >> 2] | 0) + f | 0;
 c[y >> 2] = (c[y >> 2] | 0) + I;
 c[G >> 2] = H;
 c[E >> 2] = F;
 c[C >> 2] = D;
 c[A >> 2] = B;
 c[n >> 2] = z;
 c[l >> 2] = m;
 c[i >> 2] = j;
 c[g >> 2] = h;
 c[e >> 2] = f;
 rc(b, na, y);
 ic(oa, b);
 ec(oa, oa, y);
 e = oa + 4 | 0;
 f = oa + 8 | 0;
 g = oa + 12 | 0;
 h = oa + 16 | 0;
 i = oa + 20 | 0;
 j = oa + 24 | 0;
 l = oa + 28 | 0;
 m = oa + 32 | 0;
 n = oa + 36 | 0;
 p = (c[e >> 2] | 0) - p | 0;
 q = (c[f >> 2] | 0) - q | 0;
 r = (c[g >> 2] | 0) - r | 0;
 s = (c[h >> 2] | 0) - s | 0;
 t = (c[i >> 2] | 0) - t | 0;
 u = (c[j >> 2] | 0) - u | 0;
 v = (c[l >> 2] | 0) - v | 0;
 w = (c[m >> 2] | 0) - w | 0;
 x = (c[n >> 2] | 0) - x | 0;
 c[pa >> 2] = (c[oa >> 2] | 0) - o;
 o = pa + 4 | 0;
 c[o >> 2] = p;
 p = pa + 8 | 0;
 c[p >> 2] = q;
 q = pa + 12 | 0;
 c[q >> 2] = r;
 r = pa + 16 | 0;
 c[r >> 2] = s;
 s = pa + 20 | 0;
 c[s >> 2] = t;
 t = pa + 24 | 0;
 c[t >> 2] = u;
 u = pa + 28 | 0;
 c[u >> 2] = v;
 v = pa + 32 | 0;
 c[v >> 2] = w;
 w = pa + 36 | 0;
 c[w >> 2] = x;
 sc(ma, pa);
 x = ma + 1 | 0;
 y = ma + 2 | 0;
 z = ma + 3 | 0;
 A = ma + 4 | 0;
 B = ma + 5 | 0;
 C = ma + 6 | 0;
 D = ma + 7 | 0;
 E = ma + 8 | 0;
 F = ma + 9 | 0;
 G = ma + 10 | 0;
 H = ma + 11 | 0;
 I = ma + 12 | 0;
 J = ma + 13 | 0;
 K = ma + 14 | 0;
 L = ma + 15 | 0;
 M = ma + 16 | 0;
 N = ma + 17 | 0;
 O = ma + 18 | 0;
 P = ma + 19 | 0;
 Q = ma + 20 | 0;
 R = ma + 21 | 0;
 S = ma + 22 | 0;
 T = ma + 23 | 0;
 V = ma + 24 | 0;
 W = ma + 25 | 0;
 X = ma + 26 | 0;
 Y = ma + 27 | 0;
 Z = ma + 28 | 0;
 _ = ma + 29 | 0;
 $ = ma + 30 | 0;
 aa = ma + 31 | 0;
 do if ((((a[x >> 0] | a[ma >> 0] | a[y >> 0] | a[z >> 0] | a[A >> 0] | a[B >> 0] | a[C >> 0] | a[D >> 0] | a[E >> 0] | a[F >> 0] | a[G >> 0] | a[H >> 0] | a[I >> 0] | a[J >> 0] | a[K >> 0] | a[L >> 0] | a[M >> 0] | a[N >> 0] | a[O >> 0] | a[P >> 0] | a[Q >> 0] | a[R >> 0] | a[S >> 0] | a[T >> 0] | a[V >> 0] | a[W >> 0] | a[X >> 0] | a[Y >> 0] | a[Z >> 0] | a[_ >> 0] | a[$ >> 0] | a[aa >> 0]) & 255) + -1 | 0) >>> 0 <= 4294967039) {
  ba = (c[ba >> 2] | 0) + (c[e >> 2] | 0) | 0;
  ca = (c[ca >> 2] | 0) + (c[f >> 2] | 0) | 0;
  da = (c[da >> 2] | 0) + (c[g >> 2] | 0) | 0;
  ea = (c[ea >> 2] | 0) + (c[h >> 2] | 0) | 0;
  fa = (c[fa >> 2] | 0) + (c[i >> 2] | 0) | 0;
  ga = (c[ga >> 2] | 0) + (c[j >> 2] | 0) | 0;
  ha = (c[ha >> 2] | 0) + (c[l >> 2] | 0) | 0;
  ia = (c[ia >> 2] | 0) + (c[m >> 2] | 0) | 0;
  ja = (c[ja >> 2] | 0) + (c[n >> 2] | 0) | 0;
  c[pa >> 2] = (c[na >> 2] | 0) + (c[oa >> 2] | 0);
  c[o >> 2] = ba;
  c[p >> 2] = ca;
  c[q >> 2] = da;
  c[r >> 2] = ea;
  c[s >> 2] = fa;
  c[t >> 2] = ga;
  c[u >> 2] = ha;
  c[v >> 2] = ia;
  c[w >> 2] = ja;
  sc(ma, pa);
  if ((((a[x >> 0] | a[ma >> 0] | a[y >> 0] | a[z >> 0] | a[A >> 0] | a[B >> 0] | a[C >> 0] | a[D >> 0] | a[E >> 0] | a[F >> 0] | a[G >> 0] | a[H >> 0] | a[I >> 0] | a[J >> 0] | a[K >> 0] | a[L >> 0] | a[M >> 0] | a[N >> 0] | a[O >> 0] | a[P >> 0] | a[Q >> 0] | a[R >> 0] | a[S >> 0] | a[T >> 0] | a[V >> 0] | a[W >> 0] | a[X >> 0] | a[Y >> 0] | a[Z >> 0] | a[_ >> 0] | a[$ >> 0] | a[aa >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
   ec(b, b, 64);
   break;
  } else {
   pa = -1;
   k = qa;
   return pa | 0;
  }
 } while (0);
 sc(ma, b);
 do if (((d[la >> 0] | 0) >>> 7 | 0) != (a[ma >> 0] & 1 | 0)) {
  sc(ma, b);
  if ((((a[x >> 0] | a[ma >> 0] | a[y >> 0] | a[z >> 0] | a[A >> 0] | a[B >> 0] | a[C >> 0] | a[D >> 0] | a[E >> 0] | a[F >> 0] | a[G >> 0] | a[H >> 0] | a[I >> 0] | a[J >> 0] | a[K >> 0] | a[L >> 0] | a[M >> 0] | a[N >> 0] | a[O >> 0] | a[P >> 0] | a[Q >> 0] | a[R >> 0] | a[S >> 0] | a[T >> 0] | a[V >> 0] | a[W >> 0] | a[X >> 0] | a[Y >> 0] | a[Z >> 0] | a[_ >> 0] | a[$ >> 0] | a[aa >> 0]) & 255) + -1 | 0) >>> 0 > 4294967039) {
   pa = -1;
   k = qa;
   return pa | 0;
  } else {
   _ = b + 4 | 0;
   aa = b + 8 | 0;
   ca = b + 12 | 0;
   ea = b + 16 | 0;
   ga = b + 20 | 0;
   ia = b + 24 | 0;
   la = b + 28 | 0;
   na = b + 32 | 0;
   pa = b + 36 | 0;
   Z = 0 - (c[_ >> 2] | 0) | 0;
   $ = 0 - (c[aa >> 2] | 0) | 0;
   ba = 0 - (c[ca >> 2] | 0) | 0;
   da = 0 - (c[ea >> 2] | 0) | 0;
   fa = 0 - (c[ga >> 2] | 0) | 0;
   ha = 0 - (c[ia >> 2] | 0) | 0;
   ja = 0 - (c[la >> 2] | 0) | 0;
   ma = 0 - (c[na >> 2] | 0) | 0;
   oa = 0 - (c[pa >> 2] | 0) | 0;
   c[b >> 2] = 0 - (c[b >> 2] | 0);
   c[_ >> 2] = Z;
   c[aa >> 2] = $;
   c[ca >> 2] = ba;
   c[ea >> 2] = da;
   c[ga >> 2] = fa;
   c[ia >> 2] = ha;
   c[la >> 2] = ja;
   c[na >> 2] = ma;
   c[pa >> 2] = oa;
   break;
  }
 } while (0);
 ec(b + 120 | 0, b, ka);
 pa = 0;
 k = qa;
 return pa | 0;
}

function Fc(b) {
 b = b | 0;
 var c = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0;
 ma = b + 1 | 0;
 ja = b + 2 | 0;
 na = a[ja >> 0] | 0;
 ia = d[b >> 0] | 0;
 P = gg(d[ma >> 0] | 0 | 0, 0, 8) | 0;
 la = U() | 0;
 na = na & 255;
 qa = gg(na | 0, 0, 16) | 0;
 U() | 0;
 qa = P | ia | qa & 2031616;
 ia = b + 3 | 0;
 P = gg(d[ia >> 0] | 0 | 0, 0, 8) | 0;
 aa = U() | 0;
 ea = b + 4 | 0;
 _ = gg(d[ea >> 0] | 0 | 0, 0, 16) | 0;
 aa = aa | (U() | 0);
 da = b + 5 | 0;
 O = d[da >> 0] | 0;
 $ = gg(O | 0, 0, 24) | 0;
 aa = fg(P | na | _ | $ | 0, aa | (U() | 0) | 0, 5) | 0;
 U() | 0;
 $ = b + 6 | 0;
 _ = b + 7 | 0;
 na = a[_ >> 0] | 0;
 P = gg(d[$ >> 0] | 0 | 0, 0, 8) | 0;
 ra = U() | 0;
 na = na & 255;
 Z = gg(na | 0, 0, 16) | 0;
 ra = fg(P | O | Z | 0, ra | (U() | 0) | 0, 2) | 0;
 U() | 0;
 ra = ra & 2097151;
 Z = b + 8 | 0;
 O = gg(d[Z >> 0] | 0 | 0, 0, 8) | 0;
 P = U() | 0;
 V = b + 9 | 0;
 u = gg(d[V >> 0] | 0 | 0, 0, 16) | 0;
 P = P | (U() | 0);
 T = b + 10 | 0;
 A = d[T >> 0] | 0;
 S = gg(A | 0, 0, 24) | 0;
 P = fg(O | na | u | S | 0, P | (U() | 0) | 0, 7) | 0;
 U() | 0;
 S = b + 11 | 0;
 u = gg(d[S >> 0] | 0 | 0, 0, 8) | 0;
 na = U() | 0;
 O = b + 12 | 0;
 I = gg(d[O >> 0] | 0 | 0, 0, 16) | 0;
 na = na | (U() | 0);
 N = b + 13 | 0;
 w = d[N >> 0] | 0;
 J = gg(w | 0, 0, 24) | 0;
 na = fg(u | A | I | J | 0, na | (U() | 0) | 0, 4) | 0;
 U() | 0;
 na = na & 2097151;
 J = b + 14 | 0;
 I = b + 15 | 0;
 A = a[I >> 0] | 0;
 u = gg(d[J >> 0] | 0 | 0, 0, 8) | 0;
 v = U() | 0;
 A = A & 255;
 H = gg(A | 0, 0, 16) | 0;
 v = fg(u | w | H | 0, v | (U() | 0) | 0, 1) | 0;
 U() | 0;
 H = b + 16 | 0;
 w = gg(d[H >> 0] | 0 | 0, 0, 8) | 0;
 u = U() | 0;
 D = b + 17 | 0;
 y = gg(d[D >> 0] | 0 | 0, 0, 16) | 0;
 u = u | (U() | 0);
 C = b + 18 | 0;
 x = d[C >> 0] | 0;
 B = gg(x | 0, 0, 24) | 0;
 u = fg(w | A | y | B | 0, u | (U() | 0) | 0, 6) | 0;
 U() | 0;
 u = u & 2097151;
 B = b + 19 | 0;
 y = b + 20 | 0;
 A = a[y >> 0] | 0;
 w = gg(d[B >> 0] | 0 | 0, 0, 8) | 0;
 Q = U() | 0;
 A = gg(A & 255 | 0, 0, 16) | 0;
 Q = fg(w | x | A | 0, Q | (U() | 0) | 0, 3) | 0;
 A = U() | 0;
 x = b + 21 | 0;
 w = b + 22 | 0;
 t = b + 23 | 0;
 l = a[t >> 0] | 0;
 s = d[x >> 0] | 0;
 pa = gg(d[w >> 0] | 0 | 0, 0, 8) | 0;
 Y = U() | 0;
 l = l & 255;
 R = gg(l | 0, 0, 16) | 0;
 U() | 0;
 R = pa | s | R & 2031616;
 s = b + 24 | 0;
 pa = gg(d[s >> 0] | 0 | 0, 0, 8) | 0;
 r = U() | 0;
 o = b + 25 | 0;
 i = gg(d[o >> 0] | 0 | 0, 0, 16) | 0;
 r = r | (U() | 0);
 n = b + 26 | 0;
 ua = d[n >> 0] | 0;
 j = gg(ua | 0, 0, 24) | 0;
 r = fg(pa | l | i | j | 0, r | (U() | 0) | 0, 5) | 0;
 U() | 0;
 j = b + 27 | 0;
 i = b + 28 | 0;
 l = a[i >> 0] | 0;
 pa = gg(d[j >> 0] | 0 | 0, 0, 8) | 0;
 ga = U() | 0;
 l = l & 255;
 h = gg(l | 0, 0, 16) | 0;
 ga = fg(pa | ua | h | 0, ga | (U() | 0) | 0, 2) | 0;
 U() | 0;
 ga = ga & 2097151;
 h = b + 29 | 0;
 ua = gg(d[h >> 0] | 0 | 0, 0, 8) | 0;
 pa = U() | 0;
 g = b + 30 | 0;
 ca = gg(d[g >> 0] | 0 | 0, 0, 16) | 0;
 pa = pa | (U() | 0);
 c = b + 31 | 0;
 fa = gg(d[c >> 0] | 0 | 0, 0, 24) | 0;
 pa = fg(ua | l | ca | fa | 0, pa | (U() | 0) | 0, 7) | 0;
 fa = U() | 0;
 ca = $f(qa | 0, la | 0, 1048576, 0) | 0;
 l = fg(ca | 0, U() | 0, 21) | 0;
 l = $f(aa & 2097151 | 0, 0, l | 0, U() | 0) | 0;
 aa = U() | 0;
 ca = ag(qa | 0, la | 0, ca & 2097152 | 0, 0) | 0;
 la = U() | 0;
 qa = $f(ra | 0, 0, 1048576, 0) | 0;
 ua = fg(qa | 0, U() | 0, 21) | 0;
 ua = $f(P & 2097151 | 0, 0, ua | 0, U() | 0) | 0;
 P = U() | 0;
 p = $f(na | 0, 0, 1048576, 0) | 0;
 m = fg(p | 0, U() | 0, 21) | 0;
 m = $f(v & 2097151 | 0, 0, m | 0, U() | 0) | 0;
 v = U() | 0;
 K = $f(u | 0, 0, 1048576, 0) | 0;
 L = fg(K | 0, U() | 0, 21) | 0;
 L = $f(Q | 0, A | 0, L | 0, U() | 0) | 0;
 A = U() | 0;
 Q = $f(R | 0, Y | 0, 1048576, 0) | 0;
 f = fg(Q | 0, U() | 0, 21) | 0;
 f = $f(r & 2097151 | 0, 0, f | 0, U() | 0) | 0;
 r = U() | 0;
 ka = $f(ga | 0, 0, 1048576, 0) | 0;
 oa = fg(ka | 0, U() | 0, 21) | 0;
 oa = $f(pa | 0, fa | 0, oa | 0, U() | 0) | 0;
 fa = U() | 0;
 pa = $f(l | 0, aa | 0, 1048576, 0) | 0;
 ta = fg(pa | 0, U() | 0, 21) | 0;
 sa = U() | 0;
 pa = ag(l | 0, aa | 0, pa & 6291456 | 0, 0) | 0;
 aa = U() | 0;
 l = $f(ua | 0, P | 0, 1048576, 0) | 0;
 k = fg(l | 0, U() | 0, 21) | 0;
 e = U() | 0;
 l = ag(ua | 0, P | 0, l & 6291456 | 0, 0) | 0;
 P = U() | 0;
 ua = $f(m | 0, v | 0, 1048576, 0) | 0;
 E = fg(ua | 0, U() | 0, 21) | 0;
 z = U() | 0;
 ua = ag(m | 0, v | 0, ua & 6291456 | 0, 0) | 0;
 v = U() | 0;
 m = $f(L | 0, A | 0, 1048576, 0) | 0;
 F = fg(m | 0, U() | 0, 21) | 0;
 M = U() | 0;
 m = ag(L | 0, A | 0, m & 6291456 | 0, 0) | 0;
 A = U() | 0;
 L = $f(f | 0, r | 0, 1048576, 0) | 0;
 X = fg(L | 0, U() | 0, 21) | 0;
 ba = U() | 0;
 L = ag(f | 0, r | 0, L & 6291456 | 0, 0) | 0;
 r = U() | 0;
 f = $f(oa | 0, fa | 0, 1048576, 0) | 0;
 ha = U() | 0;
 va = fg(f | 0, ha | 0, 21) | 0;
 G = U() | 0;
 ha = ag(oa | 0, fa | 0, f & -2097152 | 0, ha & 134217727 | 0) | 0;
 f = U() | 0;
 fa = _f(va | 0, G | 0, 666643, 0) | 0;
 la = $f(fa | 0, U() | 0, ca | 0, la | 0) | 0;
 ca = U() | 0;
 fa = _f(va | 0, G | 0, 470296, 0) | 0;
 fa = $f(pa | 0, aa | 0, fa | 0, U() | 0) | 0;
 aa = U() | 0;
 pa = _f(va | 0, G | 0, 654183, 0) | 0;
 oa = U() | 0;
 W = _f(va | 0, G | 0, -997805, -1) | 0;
 W = $f(l | 0, P | 0, W | 0, U() | 0) | 0;
 P = U() | 0;
 l = _f(va | 0, G | 0, 136657, 0) | 0;
 q = U() | 0;
 G = _f(va | 0, G | 0, -683901, -1) | 0;
 G = $f(ua | 0, v | 0, G | 0, U() | 0) | 0;
 v = U() | 0;
 ca = eg(la | 0, ca | 0, 21) | 0;
 ca = $f(fa | 0, aa | 0, ca | 0, U() | 0) | 0;
 aa = eg(ca | 0, U() | 0, 21) | 0;
 fa = U() | 0;
 ra = $f(ta | 0, sa | 0, ra | 0, 0) | 0;
 qa = ag(ra | 0, U() | 0, qa & 2097152 | 0, 0) | 0;
 oa = $f(qa | 0, U() | 0, pa | 0, oa | 0) | 0;
 fa = $f(oa | 0, U() | 0, aa | 0, fa | 0) | 0;
 aa = eg(fa | 0, U() | 0, 21) | 0;
 aa = $f(W | 0, P | 0, aa | 0, U() | 0) | 0;
 P = eg(aa | 0, U() | 0, 21) | 0;
 W = U() | 0;
 e = $f(na | 0, 0, k | 0, e | 0) | 0;
 p = ag(e | 0, U() | 0, p & 2097152 | 0, 0) | 0;
 q = $f(p | 0, U() | 0, l | 0, q | 0) | 0;
 W = $f(q | 0, U() | 0, P | 0, W | 0) | 0;
 P = eg(W | 0, U() | 0, 21) | 0;
 P = $f(G | 0, v | 0, P | 0, U() | 0) | 0;
 v = eg(P | 0, U() | 0, 21) | 0;
 G = U() | 0;
 z = $f(u | 0, 0, E | 0, z | 0) | 0;
 K = ag(z | 0, U() | 0, K & 2097152 | 0, 0) | 0;
 G = $f(K | 0, U() | 0, v | 0, G | 0) | 0;
 v = eg(G | 0, U() | 0, 21) | 0;
 A = $f(v | 0, U() | 0, m | 0, A | 0) | 0;
 m = eg(A | 0, U() | 0, 21) | 0;
 v = U() | 0;
 Y = $f(F | 0, M | 0, R | 0, Y | 0) | 0;
 Q = ag(Y | 0, U() | 0, Q & 2097152 | 0, 0) | 0;
 v = $f(Q | 0, U() | 0, m | 0, v | 0) | 0;
 m = eg(v | 0, U() | 0, 21) | 0;
 r = $f(m | 0, U() | 0, L | 0, r | 0) | 0;
 L = eg(r | 0, U() | 0, 21) | 0;
 m = U() | 0;
 ga = $f(X | 0, ba | 0, ga | 0, 0) | 0;
 ka = ag(ga | 0, U() | 0, ka & 2097152 | 0, 0) | 0;
 m = $f(ka | 0, U() | 0, L | 0, m | 0) | 0;
 L = eg(m | 0, U() | 0, 21) | 0;
 f = $f(L | 0, U() | 0, ha | 0, f | 0) | 0;
 ha = eg(f | 0, U() | 0, 21) | 0;
 L = U() | 0;
 ka = _f(ha | 0, L | 0, 666643, 0) | 0;
 la = $f(ka | 0, U() | 0, la & 2097151 | 0, 0) | 0;
 ka = U() | 0;
 ga = _f(ha | 0, L | 0, 470296, 0) | 0;
 ca = $f(ga | 0, U() | 0, ca & 2097151 | 0, 0) | 0;
 ga = U() | 0;
 ba = _f(ha | 0, L | 0, 654183, 0) | 0;
 fa = $f(ba | 0, U() | 0, fa & 2097151 | 0, 0) | 0;
 ba = U() | 0;
 X = _f(ha | 0, L | 0, -997805, -1) | 0;
 aa = $f(X | 0, U() | 0, aa & 2097151 | 0, 0) | 0;
 X = U() | 0;
 Q = _f(ha | 0, L | 0, 136657, 0) | 0;
 W = $f(Q | 0, U() | 0, W & 2097151 | 0, 0) | 0;
 Q = U() | 0;
 L = _f(ha | 0, L | 0, -683901, -1) | 0;
 P = $f(L | 0, U() | 0, P & 2097151 | 0, 0) | 0;
 L = U() | 0;
 ha = eg(la | 0, ka | 0, 21) | 0;
 ha = $f(ca | 0, ga | 0, ha | 0, U() | 0) | 0;
 ga = U() | 0;
 ca = eg(ha | 0, ga | 0, 21) | 0;
 ca = $f(fa | 0, ba | 0, ca | 0, U() | 0) | 0;
 ba = U() | 0;
 fa = ha & 2097151;
 Y = eg(ca | 0, ba | 0, 21) | 0;
 Y = $f(aa | 0, X | 0, Y | 0, U() | 0) | 0;
 X = U() | 0;
 aa = ca & 2097151;
 R = eg(Y | 0, X | 0, 21) | 0;
 R = $f(W | 0, Q | 0, R | 0, U() | 0) | 0;
 Q = U() | 0;
 W = Y & 2097151;
 M = eg(R | 0, Q | 0, 21) | 0;
 M = $f(P | 0, L | 0, M | 0, U() | 0) | 0;
 L = U() | 0;
 P = R & 2097151;
 F = eg(M | 0, L | 0, 21) | 0;
 G = $f(F | 0, U() | 0, G & 2097151 | 0, 0) | 0;
 F = U() | 0;
 K = M & 2097151;
 z = eg(G | 0, F | 0, 21) | 0;
 A = $f(z | 0, U() | 0, A & 2097151 | 0, 0) | 0;
 z = U() | 0;
 E = G & 2097151;
 u = eg(A | 0, z | 0, 21) | 0;
 v = $f(u | 0, U() | 0, v & 2097151 | 0, 0) | 0;
 u = U() | 0;
 q = eg(v | 0, u | 0, 21) | 0;
 r = $f(q | 0, U() | 0, r & 2097151 | 0, 0) | 0;
 q = U() | 0;
 l = eg(r | 0, q | 0, 21) | 0;
 m = $f(l | 0, U() | 0, m & 2097151 | 0, 0) | 0;
 l = U() | 0;
 p = r & 2097151;
 e = eg(m | 0, l | 0, 21) | 0;
 f = $f(e | 0, U() | 0, f & 2097151 | 0, 0) | 0;
 e = U() | 0;
 k = m & 2097151;
 a[b >> 0] = la;
 b = fg(la | 0, ka | 0, 8) | 0;
 U() | 0;
 a[ma >> 0] = b;
 b = fg(la | 0, ka | 0, 16) | 0;
 U() | 0;
 ka = gg(fa | 0, 0, 5) | 0;
 U() | 0;
 a[ja >> 0] = ka | b & 31;
 b = fg(ha | 0, ga | 0, 3) | 0;
 U() | 0;
 a[ia >> 0] = b;
 b = fg(ha | 0, ga | 0, 11) | 0;
 U() | 0;
 a[ea >> 0] = b;
 b = fg(fa | 0, 0, 19) | 0;
 fa = U() | 0;
 ea = gg(aa | 0, 0, 2) | 0;
 U() | 0 | fa;
 a[da >> 0] = ea | b;
 b = fg(ca | 0, ba | 0, 6) | 0;
 U() | 0;
 a[$ >> 0] = b;
 b = fg(aa | 0, 0, 14) | 0;
 aa = U() | 0;
 $ = gg(W | 0, 0, 7) | 0;
 U() | 0 | aa;
 a[_ >> 0] = $ | b;
 b = fg(Y | 0, X | 0, 1) | 0;
 U() | 0;
 a[Z >> 0] = b;
 b = fg(Y | 0, X | 0, 9) | 0;
 U() | 0;
 a[V >> 0] = b;
 b = fg(W | 0, 0, 17) | 0;
 W = U() | 0;
 V = gg(P | 0, 0, 4) | 0;
 U() | 0 | W;
 a[T >> 0] = V | b;
 b = fg(R | 0, Q | 0, 4) | 0;
 U() | 0;
 a[S >> 0] = b;
 b = fg(R | 0, Q | 0, 12) | 0;
 U() | 0;
 a[O >> 0] = b;
 b = fg(P | 0, 0, 20) | 0;
 P = U() | 0;
 O = gg(K | 0, 0, 1) | 0;
 U() | 0 | P;
 a[N >> 0] = O | b;
 b = fg(M | 0, L | 0, 7) | 0;
 U() | 0;
 a[J >> 0] = b;
 b = fg(K | 0, 0, 15) | 0;
 K = U() | 0;
 J = gg(E | 0, 0, 6) | 0;
 U() | 0 | K;
 a[I >> 0] = J | b;
 b = fg(G | 0, F | 0, 2) | 0;
 U() | 0;
 a[H >> 0] = b;
 b = fg(G | 0, F | 0, 10) | 0;
 U() | 0;
 a[D >> 0] = b;
 b = fg(E | 0, 0, 18) | 0;
 E = U() | 0;
 D = gg(A | 0, z | 0, 3) | 0;
 U() | 0 | E;
 a[C >> 0] = D | b;
 b = fg(A | 0, z | 0, 5) | 0;
 U() | 0;
 a[B >> 0] = b;
 b = fg(A | 0, z | 0, 13) | 0;
 U() | 0;
 a[y >> 0] = b;
 a[x >> 0] = v;
 b = fg(v | 0, u | 0, 8) | 0;
 U() | 0;
 a[w >> 0] = b;
 b = fg(v | 0, u | 0, 16) | 0;
 U() | 0;
 u = gg(p | 0, 0, 5) | 0;
 U() | 0;
 a[t >> 0] = u | b & 31;
 b = fg(r | 0, q | 0, 3) | 0;
 U() | 0;
 a[s >> 0] = b;
 b = fg(r | 0, q | 0, 11) | 0;
 U() | 0;
 a[o >> 0] = b;
 b = fg(p | 0, 0, 19) | 0;
 p = U() | 0;
 o = gg(k | 0, 0, 2) | 0;
 U() | 0 | p;
 a[n >> 0] = o | b;
 b = fg(m | 0, l | 0, 6) | 0;
 U() | 0;
 a[j >> 0] = b;
 b = fg(k | 0, 0, 14) | 0;
 k = U() | 0;
 j = gg(f | 0, e | 0, 7) | 0;
 U() | 0 | k;
 a[i >> 0] = j | b;
 b = fg(f | 0, e | 0, 1) | 0;
 U() | 0;
 a[h >> 0] = b;
 b = fg(f | 0, e | 0, 9) | 0;
 U() | 0;
 a[g >> 0] = b;
 b = eg(f | 0, e | 0, 17) | 0;
 U() | 0;
 a[c >> 0] = b;
 return;
}

function Mc(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0;
 na = k;
 k = k + 48 | 0;
 la = na;
 if ((b | 0) <= 0) {
  k = na;
  return;
 }
 ma = a + 8 | 0;
 e = a;
 L = a + 160 | 0;
 g = L;
 Q = a + 128 | 0;
 x = Q;
 R = a + 168 | 0;
 i = R;
 S = a + 136 | 0;
 B = S;
 T = a + 176 | 0;
 l = T;
 V = a + 144 | 0;
 F = V;
 W = a + 184 | 0;
 n = W;
 X = a + 152 | 0;
 J = X;
 Y = a + 192 | 0;
 p = Y;
 Z = a + 80 | 0;
 r = Z;
 _ = a + 120 | 0;
 t = _;
 M = a + 88 | 0;
 v = M;
 N = a + 96 | 0;
 z = N;
 O = a + 104 | 0;
 D = O;
 P = a + 112 | 0;
 H = P;
 $ = a + 40 | 0;
 aa = a + 48 | 0;
 ba = la + 8 | 0;
 ca = a + 16 | 0;
 da = a + 56 | 0;
 ea = la + 16 | 0;
 fa = a + 24 | 0;
 ga = a + 64 | 0;
 ha = la + 24 | 0;
 ia = a + 32 | 0;
 ja = a + 72 | 0;
 ka = la + 32 | 0;
 K = 0;
 d = c[e >> 2] | 0;
 e = c[e + 4 >> 2] | 0;
 q = c[r >> 2] | 0;
 r = c[r + 4 >> 2] | 0;
 s = c[t >> 2] | 0;
 t = c[t + 4 >> 2] | 0;
 f = c[g >> 2] | 0;
 g = c[g + 4 >> 2] | 0;
 u = c[v >> 2] | 0;
 v = c[v + 4 >> 2] | 0;
 w = c[x >> 2] | 0;
 x = c[x + 4 >> 2] | 0;
 h = c[i >> 2] | 0;
 i = c[i + 4 >> 2] | 0;
 y = c[z >> 2] | 0;
 z = c[z + 4 >> 2] | 0;
 A = c[B >> 2] | 0;
 B = c[B + 4 >> 2] | 0;
 j = c[l >> 2] | 0;
 l = c[l + 4 >> 2] | 0;
 C = c[D >> 2] | 0;
 D = c[D + 4 >> 2] | 0;
 E = c[F >> 2] | 0;
 F = c[F + 4 >> 2] | 0;
 m = c[n >> 2] | 0;
 n = c[n + 4 >> 2] | 0;
 G = c[H >> 2] | 0;
 H = c[H + 4 >> 2] | 0;
 I = c[J >> 2] | 0;
 J = c[J + 4 >> 2] | 0;
 o = c[p >> 2] | 0;
 p = c[p + 4 >> 2] | 0;
 do {
  Ca = $;
  Da = c[Ca >> 2] | 0;
  Ca = c[Ca + 4 >> 2] | 0;
  Ba = Da ^ d ^ q ^ s ^ f;
  Aa = Ca ^ e ^ r ^ t ^ g;
  ya = la;
  c[ya >> 2] = Ba;
  c[ya + 4 >> 2] = Aa;
  ya = ma;
  za = c[ya >> 2] | 0;
  ya = c[ya + 4 >> 2] | 0;
  wa = aa;
  xa = c[wa >> 2] | 0;
  wa = c[wa + 4 >> 2] | 0;
  va = xa ^ za ^ u ^ w ^ h;
  ua = wa ^ ya ^ v ^ x ^ i;
  sa = ba;
  c[sa >> 2] = va;
  c[sa + 4 >> 2] = ua;
  sa = ca;
  ta = c[sa >> 2] | 0;
  sa = c[sa + 4 >> 2] | 0;
  qa = da;
  ra = c[qa >> 2] | 0;
  qa = c[qa + 4 >> 2] | 0;
  pa = ra ^ ta ^ y ^ A ^ j;
  oa = qa ^ sa ^ z ^ B ^ l;
  i = ea;
  c[i >> 2] = pa;
  c[i + 4 >> 2] = oa;
  i = fa;
  h = c[i >> 2] | 0;
  i = c[i + 4 >> 2] | 0;
  l = ga;
  j = c[l >> 2] | 0;
  l = c[l + 4 >> 2] | 0;
  m = j ^ h ^ C ^ E ^ m;
  w = l ^ i ^ D ^ F ^ n;
  A = ha;
  c[A >> 2] = m;
  c[A + 4 >> 2] = w;
  A = ia;
  x = c[A >> 2] | 0;
  A = c[A + 4 >> 2] | 0;
  E = ja;
  B = c[E >> 2] | 0;
  E = c[E + 4 >> 2] | 0;
  o = B ^ x ^ G ^ I ^ o;
  J = E ^ A ^ H ^ J ^ p;
  p = ka;
  c[p >> 2] = o;
  c[p + 4 >> 2] = J;
  p = gg(va | 0, ua | 0, 1) | 0;
  I = U() | 0;
  F = fg(va | 0, ua | 0, 63) | 0;
  F = (p | F) ^ o;
  I = (I | (U() | 0)) ^ J;
  p = a;
  c[p >> 2] = F ^ d;
  c[p + 4 >> 2] = I ^ e;
  e = $;
  c[e >> 2] = F ^ Da;
  c[e + 4 >> 2] = I ^ Ca;
  e = Z;
  c[e >> 2] = F ^ q;
  c[e + 4 >> 2] = I ^ r;
  e = _;
  c[e >> 2] = F ^ s;
  c[e + 4 >> 2] = I ^ t;
  e = L;
  c[e >> 2] = F ^ f;
  c[e + 4 >> 2] = I ^ g;
  e = gg(pa | 0, oa | 0, 1) | 0;
  I = U() | 0;
  d = fg(pa | 0, oa | 0, 63) | 0;
  d = (e | d) ^ Ba;
  I = (I | (U() | 0)) ^ Aa;
  e = d ^ za;
  f = I ^ ya;
  F = ma;
  c[F >> 2] = e;
  c[F + 4 >> 2] = f;
  F = aa;
  c[F >> 2] = d ^ xa;
  c[F + 4 >> 2] = I ^ wa;
  F = M;
  c[F >> 2] = d ^ u;
  c[F + 4 >> 2] = I ^ v;
  u = Q;
  F = I ^ c[u + 4 >> 2];
  v = Q;
  c[v >> 2] = d ^ c[u >> 2];
  c[v + 4 >> 2] = F;
  v = R;
  I = I ^ c[v + 4 >> 2];
  F = R;
  c[F >> 2] = d ^ c[v >> 2];
  c[F + 4 >> 2] = I;
  F = gg(m | 0, w | 0, 1) | 0;
  I = U() | 0;
  v = fg(m | 0, w | 0, 63) | 0;
  v = (F | v) ^ va;
  I = (I | (U() | 0)) ^ ua;
  F = ca;
  c[F >> 2] = v ^ ta;
  c[F + 4 >> 2] = I ^ sa;
  F = da;
  c[F >> 2] = v ^ ra;
  c[F + 4 >> 2] = I ^ qa;
  F = N;
  c[F >> 2] = v ^ y;
  c[F + 4 >> 2] = I ^ z;
  z = S;
  F = I ^ c[z + 4 >> 2];
  d = S;
  c[d >> 2] = v ^ c[z >> 2];
  c[d + 4 >> 2] = F;
  d = T;
  I = I ^ c[d + 4 >> 2];
  F = T;
  c[F >> 2] = v ^ c[d >> 2];
  c[F + 4 >> 2] = I;
  F = gg(o | 0, J | 0, 1) | 0;
  I = U() | 0;
  J = fg(o | 0, J | 0, 63) | 0;
  J = (F | J) ^ pa;
  I = (I | (U() | 0)) ^ oa;
  F = fa;
  c[F >> 2] = J ^ h;
  c[F + 4 >> 2] = I ^ i;
  F = ga;
  c[F >> 2] = J ^ j;
  c[F + 4 >> 2] = I ^ l;
  F = O;
  c[F >> 2] = J ^ C;
  c[F + 4 >> 2] = I ^ D;
  D = V;
  F = I ^ c[D + 4 >> 2];
  d = V;
  c[d >> 2] = J ^ c[D >> 2];
  c[d + 4 >> 2] = F;
  d = W;
  I = I ^ c[d + 4 >> 2];
  F = W;
  c[F >> 2] = J ^ c[d >> 2];
  c[F + 4 >> 2] = I;
  F = la;
  I = c[F >> 2] | 0;
  F = c[F + 4 >> 2] | 0;
  d = gg(I | 0, F | 0, 1) | 0;
  J = U() | 0;
  F = fg(I | 0, F | 0, 63) | 0;
  F = (d | F) ^ m;
  J = (J | (U() | 0)) ^ w;
  d = ia;
  c[d >> 2] = F ^ x;
  c[d + 4 >> 2] = J ^ A;
  d = ja;
  c[d >> 2] = F ^ B;
  c[d + 4 >> 2] = J ^ E;
  d = P;
  c[d >> 2] = F ^ G;
  c[d + 4 >> 2] = J ^ H;
  H = X;
  d = J ^ c[H + 4 >> 2];
  I = X;
  c[I >> 2] = F ^ c[H >> 2];
  c[I + 4 >> 2] = d;
  I = Y;
  J = J ^ c[I + 4 >> 2];
  d = Y;
  c[d >> 2] = F ^ c[I >> 2];
  c[d + 4 >> 2] = J;
  d = 0;
  do {
   Da = a + (c[32416 + (d << 2) >> 2] << 3) | 0;
   Aa = Da;
   ya = e;
   e = c[Aa >> 2] | 0;
   za = f;
   f = c[Aa + 4 >> 2] | 0;
   Aa = c[32320 + (d << 2) >> 2] | 0;
   Ba = gg(ya | 0, za | 0, Aa | 0) | 0;
   Ca = U() | 0;
   Aa = fg(ya | 0, za | 0, 64 - Aa | 0) | 0;
   Ca = U() | 0 | Ca;
   c[Da >> 2] = Aa | Ba;
   c[Da + 4 >> 2] = Ca;
   d = d + 1 | 0;
  } while ((d | 0) != 24);
  d = la;
  e = a;
  f = d + 40 | 0;
  do {
   c[d >> 2] = c[e >> 2];
   d = d + 4 | 0;
   e = e + 4 | 0;
  } while ((d | 0) < (f | 0));
  d = ba;
  Da = c[d >> 2] | 0;
  d = c[d + 4 >> 2] | 0;
  Aa = ea;
  Ca = c[Aa >> 2] | 0;
  Aa = c[Aa + 4 >> 2] | 0;
  e = a;
  za = c[e + 4 >> 2] ^ Aa & ~d;
  f = a;
  c[f >> 2] = c[e >> 2] ^ Ca & ~Da;
  c[f + 4 >> 2] = za;
  f = ha;
  za = c[f >> 2] | 0;
  f = c[f + 4 >> 2] | 0;
  e = ma;
  Aa = c[e + 4 >> 2] ^ f & ~Aa;
  Ba = ma;
  c[Ba >> 2] = c[e >> 2] ^ za & ~Ca;
  c[Ba + 4 >> 2] = Aa;
  Ba = ka;
  Aa = c[Ba >> 2] | 0;
  Ba = c[Ba + 4 >> 2] | 0;
  Ca = ca;
  f = c[Ca + 4 >> 2] ^ Ba & ~f;
  e = ca;
  c[e >> 2] = c[Ca >> 2] ^ Aa & ~za;
  c[e + 4 >> 2] = f;
  e = la;
  f = c[e >> 2] | 0;
  e = c[e + 4 >> 2] | 0;
  za = fa;
  Ba = c[za + 4 >> 2] ^ e & ~Ba;
  Ca = fa;
  c[Ca >> 2] = c[za >> 2] ^ f & ~Aa;
  c[Ca + 4 >> 2] = Ba;
  Ca = ia;
  e = c[Ca + 4 >> 2] ^ d & ~e;
  d = ia;
  c[d >> 2] = c[Ca >> 2] ^ Da & ~f;
  c[d + 4 >> 2] = e;
  d = la;
  e = $;
  f = d + 40 | 0;
  do {
   c[d >> 2] = c[e >> 2];
   d = d + 4 | 0;
   e = e + 4 | 0;
  } while ((d | 0) < (f | 0));
  d = ba;
  Da = c[d >> 2] | 0;
  d = c[d + 4 >> 2] | 0;
  Aa = ea;
  Ca = c[Aa >> 2] | 0;
  Aa = c[Aa + 4 >> 2] | 0;
  e = $;
  za = c[e + 4 >> 2] ^ Aa & ~d;
  f = $;
  c[f >> 2] = c[e >> 2] ^ Ca & ~Da;
  c[f + 4 >> 2] = za;
  f = ha;
  za = c[f >> 2] | 0;
  f = c[f + 4 >> 2] | 0;
  e = aa;
  Aa = c[e + 4 >> 2] ^ f & ~Aa;
  Ba = aa;
  c[Ba >> 2] = c[e >> 2] ^ za & ~Ca;
  c[Ba + 4 >> 2] = Aa;
  Ba = ka;
  Aa = c[Ba >> 2] | 0;
  Ba = c[Ba + 4 >> 2] | 0;
  Ca = da;
  f = c[Ca + 4 >> 2] ^ Ba & ~f;
  e = da;
  c[e >> 2] = c[Ca >> 2] ^ Aa & ~za;
  c[e + 4 >> 2] = f;
  e = la;
  f = c[e >> 2] | 0;
  e = c[e + 4 >> 2] | 0;
  za = ga;
  Ba = c[za + 4 >> 2] ^ e & ~Ba;
  Ca = ga;
  c[Ca >> 2] = c[za >> 2] ^ f & ~Aa;
  c[Ca + 4 >> 2] = Ba;
  Ca = ja;
  e = c[Ca + 4 >> 2] ^ d & ~e;
  d = ja;
  c[d >> 2] = c[Ca >> 2] ^ Da & ~f;
  c[d + 4 >> 2] = e;
  d = la;
  e = Z;
  f = d + 40 | 0;
  do {
   c[d >> 2] = c[e >> 2];
   d = d + 4 | 0;
   e = e + 4 | 0;
  } while ((d | 0) < (f | 0));
  d = ba;
  f = c[d >> 2] | 0;
  d = c[d + 4 >> 2] | 0;
  v = ea;
  u = c[v >> 2] | 0;
  v = c[v + 4 >> 2] | 0;
  r = Z;
  q = c[r >> 2] ^ u & ~f;
  r = c[r + 4 >> 2] ^ v & ~d;
  z = Z;
  c[z >> 2] = q;
  c[z + 4 >> 2] = r;
  z = ha;
  y = c[z >> 2] | 0;
  z = c[z + 4 >> 2] | 0;
  D = M;
  u = c[D >> 2] ^ y & ~u;
  v = c[D + 4 >> 2] ^ z & ~v;
  D = M;
  c[D >> 2] = u;
  c[D + 4 >> 2] = v;
  D = ka;
  C = c[D >> 2] | 0;
  D = c[D + 4 >> 2] | 0;
  H = N;
  y = c[H >> 2] ^ C & ~y;
  z = c[H + 4 >> 2] ^ D & ~z;
  H = N;
  c[H >> 2] = y;
  c[H + 4 >> 2] = z;
  H = la;
  G = c[H >> 2] | 0;
  H = c[H + 4 >> 2] | 0;
  e = O;
  C = c[e >> 2] ^ G & ~C;
  D = c[e + 4 >> 2] ^ H & ~D;
  e = O;
  c[e >> 2] = C;
  c[e + 4 >> 2] = D;
  e = P;
  G = c[e >> 2] ^ f & ~G;
  H = c[e + 4 >> 2] ^ d & ~H;
  d = P;
  c[d >> 2] = G;
  c[d + 4 >> 2] = H;
  d = la;
  e = _;
  f = d + 40 | 0;
  do {
   c[d >> 2] = c[e >> 2];
   d = d + 4 | 0;
   e = e + 4 | 0;
  } while ((d | 0) < (f | 0));
  d = ba;
  f = c[d >> 2] | 0;
  d = c[d + 4 >> 2] | 0;
  x = ea;
  w = c[x >> 2] | 0;
  x = c[x + 4 >> 2] | 0;
  t = _;
  s = c[t >> 2] ^ w & ~f;
  t = c[t + 4 >> 2] ^ x & ~d;
  B = _;
  c[B >> 2] = s;
  c[B + 4 >> 2] = t;
  B = ha;
  A = c[B >> 2] | 0;
  B = c[B + 4 >> 2] | 0;
  F = Q;
  w = c[F >> 2] ^ A & ~w;
  x = c[F + 4 >> 2] ^ B & ~x;
  F = Q;
  c[F >> 2] = w;
  c[F + 4 >> 2] = x;
  F = ka;
  E = c[F >> 2] | 0;
  F = c[F + 4 >> 2] | 0;
  J = S;
  A = c[J >> 2] ^ E & ~A;
  B = c[J + 4 >> 2] ^ F & ~B;
  J = S;
  c[J >> 2] = A;
  c[J + 4 >> 2] = B;
  J = la;
  I = c[J >> 2] | 0;
  J = c[J + 4 >> 2] | 0;
  e = V;
  E = c[e >> 2] ^ I & ~E;
  F = c[e + 4 >> 2] ^ J & ~F;
  e = V;
  c[e >> 2] = E;
  c[e + 4 >> 2] = F;
  e = X;
  I = c[e >> 2] ^ f & ~I;
  J = c[e + 4 >> 2] ^ d & ~J;
  d = X;
  c[d >> 2] = I;
  c[d + 4 >> 2] = J;
  d = la;
  e = L;
  f = d + 40 | 0;
  do {
   c[d >> 2] = c[e >> 2];
   d = d + 4 | 0;
   e = e + 4 | 0;
  } while ((d | 0) < (f | 0));
  e = ba;
  d = c[e >> 2] | 0;
  e = c[e + 4 >> 2] | 0;
  i = ea;
  h = c[i >> 2] | 0;
  i = c[i + 4 >> 2] | 0;
  g = L;
  f = c[g >> 2] ^ h & ~d;
  g = c[g + 4 >> 2] ^ i & ~e;
  l = L;
  c[l >> 2] = f;
  c[l + 4 >> 2] = g;
  l = ha;
  j = c[l >> 2] | 0;
  l = c[l + 4 >> 2] | 0;
  n = R;
  h = c[n >> 2] ^ j & ~h;
  i = c[n + 4 >> 2] ^ l & ~i;
  n = R;
  c[n >> 2] = h;
  c[n + 4 >> 2] = i;
  n = ka;
  m = c[n >> 2] | 0;
  n = c[n + 4 >> 2] | 0;
  p = T;
  j = c[p >> 2] ^ m & ~j;
  l = c[p + 4 >> 2] ^ n & ~l;
  p = T;
  c[p >> 2] = j;
  c[p + 4 >> 2] = l;
  p = la;
  o = c[p >> 2] | 0;
  p = c[p + 4 >> 2] | 0;
  Da = W;
  m = c[Da >> 2] ^ o & ~m;
  n = c[Da + 4 >> 2] ^ p & ~n;
  Da = W;
  c[Da >> 2] = m;
  c[Da + 4 >> 2] = n;
  Da = Y;
  o = c[Da >> 2] ^ d & ~o;
  p = c[Da + 4 >> 2] ^ e & ~p;
  e = Y;
  c[e >> 2] = o;
  c[e + 4 >> 2] = p;
  e = 32128 + (K << 3) | 0;
  Da = a;
  d = c[Da >> 2] ^ c[e >> 2];
  e = c[Da + 4 >> 2] ^ c[e + 4 >> 2];
  Da = a;
  c[Da >> 2] = d;
  c[Da + 4 >> 2] = e;
  K = K + 1 | 0;
 } while ((K | 0) != (b | 0));
 k = na;
 return;
}

function jc(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0;
 bb = c[b >> 2] | 0;
 La = c[b + 4 >> 2] | 0;
 t = c[b + 8 >> 2] | 0;
 da = c[b + 12 >> 2] | 0;
 u = c[b + 16 >> 2] | 0;
 db = c[b + 20 >> 2] | 0;
 j = c[b + 24 >> 2] | 0;
 pa = c[b + 28 >> 2] | 0;
 g = c[b + 32 >> 2] | 0;
 q = c[b + 36 >> 2] | 0;
 k = bb << 1;
 r = La << 1;
 Xa = t << 1;
 w = da << 1;
 Fa = u << 1;
 p = db << 1;
 oa = j << 1;
 v = pa << 1;
 Wa = db * 38 | 0;
 Ja = j * 19 | 0;
 fa = pa * 38 | 0;
 X = g * 19 | 0;
 gb = q * 38 | 0;
 cb = ((bb | 0) < 0) << 31 >> 31;
 cb = _f(bb | 0, cb | 0, bb | 0, cb | 0) | 0;
 bb = U() | 0;
 l = ((k | 0) < 0) << 31 >> 31;
 Ma = ((La | 0) < 0) << 31 >> 31;
 Ua = _f(k | 0, l | 0, La | 0, Ma | 0) | 0;
 Ta = U() | 0;
 o = ((t | 0) < 0) << 31 >> 31;
 Oa = _f(t | 0, o | 0, k | 0, l | 0) | 0;
 Na = U() | 0;
 ea = ((da | 0) < 0) << 31 >> 31;
 Ea = _f(da | 0, ea | 0, k | 0, l | 0) | 0;
 Da = U() | 0;
 e = ((u | 0) < 0) << 31 >> 31;
 sa = _f(u | 0, e | 0, k | 0, l | 0) | 0;
 ra = U() | 0;
 eb = ((db | 0) < 0) << 31 >> 31;
 ia = _f(db | 0, eb | 0, k | 0, l | 0) | 0;
 ha = U() | 0;
 s = ((j | 0) < 0) << 31 >> 31;
 _ = _f(j | 0, s | 0, k | 0, l | 0) | 0;
 Z = U() | 0;
 qa = ((pa | 0) < 0) << 31 >> 31;
 P = _f(pa | 0, qa | 0, k | 0, l | 0) | 0;
 O = U() | 0;
 h = ((g | 0) < 0) << 31 >> 31;
 F = _f(g | 0, h | 0, k | 0, l | 0) | 0;
 E = U() | 0;
 b = ((q | 0) < 0) << 31 >> 31;
 l = _f(q | 0, b | 0, k | 0, l | 0) | 0;
 k = U() | 0;
 d = ((r | 0) < 0) << 31 >> 31;
 Ma = _f(r | 0, d | 0, La | 0, Ma | 0) | 0;
 La = U() | 0;
 Ca = _f(r | 0, d | 0, t | 0, o | 0) | 0;
 Ba = U() | 0;
 f = ((w | 0) < 0) << 31 >> 31;
 wa = _f(w | 0, f | 0, r | 0, d | 0) | 0;
 va = U() | 0;
 ma = _f(u | 0, e | 0, r | 0, d | 0) | 0;
 la = U() | 0;
 x = ((p | 0) < 0) << 31 >> 31;
 aa = _f(p | 0, x | 0, r | 0, d | 0) | 0;
 $ = U() | 0;
 R = _f(j | 0, s | 0, r | 0, d | 0) | 0;
 Q = U() | 0;
 i = ((v | 0) < 0) << 31 >> 31;
 H = _f(v | 0, i | 0, r | 0, d | 0) | 0;
 G = U() | 0;
 m = _f(g | 0, h | 0, r | 0, d | 0) | 0;
 n = U() | 0;
 fb = ((gb | 0) < 0) << 31 >> 31;
 d = _f(gb | 0, fb | 0, r | 0, d | 0) | 0;
 r = U() | 0;
 ua = _f(t | 0, o | 0, t | 0, o | 0) | 0;
 ta = U() | 0;
 Ya = ((Xa | 0) < 0) << 31 >> 31;
 ka = _f(Xa | 0, Ya | 0, da | 0, ea | 0) | 0;
 ja = U() | 0;
 ca = _f(u | 0, e | 0, Xa | 0, Ya | 0) | 0;
 ba = U() | 0;
 W = _f(db | 0, eb | 0, Xa | 0, Ya | 0) | 0;
 V = U() | 0;
 N = _f(j | 0, s | 0, Xa | 0, Ya | 0) | 0;
 M = U() | 0;
 z = _f(pa | 0, qa | 0, Xa | 0, Ya | 0) | 0;
 y = U() | 0;
 Y = ((X | 0) < 0) << 31 >> 31;
 Ya = _f(X | 0, Y | 0, Xa | 0, Ya | 0) | 0;
 Xa = U() | 0;
 o = _f(gb | 0, fb | 0, t | 0, o | 0) | 0;
 t = U() | 0;
 ea = _f(w | 0, f | 0, da | 0, ea | 0) | 0;
 da = U() | 0;
 T = _f(w | 0, f | 0, u | 0, e | 0) | 0;
 S = U() | 0;
 J = _f(p | 0, x | 0, w | 0, f | 0) | 0;
 I = U() | 0;
 D = _f(j | 0, s | 0, w | 0, f | 0) | 0;
 C = U() | 0;
 ga = ((fa | 0) < 0) << 31 >> 31;
 _a = _f(fa | 0, ga | 0, w | 0, f | 0) | 0;
 Za = U() | 0;
 Qa = _f(X | 0, Y | 0, w | 0, f | 0) | 0;
 Pa = U() | 0;
 f = _f(gb | 0, fb | 0, w | 0, f | 0) | 0;
 w = U() | 0;
 L = _f(u | 0, e | 0, u | 0, e | 0) | 0;
 K = U() | 0;
 Ga = ((Fa | 0) < 0) << 31 >> 31;
 B = _f(Fa | 0, Ga | 0, db | 0, eb | 0) | 0;
 A = U() | 0;
 Ka = ((Ja | 0) < 0) << 31 >> 31;
 ab = _f(Ja | 0, Ka | 0, Fa | 0, Ga | 0) | 0;
 $a = U() | 0;
 Sa = _f(fa | 0, ga | 0, u | 0, e | 0) | 0;
 Ra = U() | 0;
 Ga = _f(X | 0, Y | 0, Fa | 0, Ga | 0) | 0;
 Fa = U() | 0;
 e = _f(gb | 0, fb | 0, u | 0, e | 0) | 0;
 u = U() | 0;
 eb = _f(Wa | 0, ((Wa | 0) < 0) << 31 >> 31 | 0, db | 0, eb | 0) | 0;
 db = U() | 0;
 Wa = _f(Ja | 0, Ka | 0, p | 0, x | 0) | 0;
 Va = U() | 0;
 Ia = _f(fa | 0, ga | 0, p | 0, x | 0) | 0;
 Ha = U() | 0;
 ya = _f(X | 0, Y | 0, p | 0, x | 0) | 0;
 xa = U() | 0;
 x = _f(gb | 0, fb | 0, p | 0, x | 0) | 0;
 p = U() | 0;
 Ka = _f(Ja | 0, Ka | 0, j | 0, s | 0) | 0;
 Ja = U() | 0;
 Aa = _f(fa | 0, ga | 0, j | 0, s | 0) | 0;
 za = U() | 0;
 oa = _f(X | 0, Y | 0, oa | 0, ((oa | 0) < 0) << 31 >> 31 | 0) | 0;
 na = U() | 0;
 s = _f(gb | 0, fb | 0, j | 0, s | 0) | 0;
 j = U() | 0;
 qa = _f(fa | 0, ga | 0, pa | 0, qa | 0) | 0;
 pa = U() | 0;
 ga = _f(X | 0, Y | 0, v | 0, i | 0) | 0;
 fa = U() | 0;
 i = _f(gb | 0, fb | 0, v | 0, i | 0) | 0;
 v = U() | 0;
 Y = _f(X | 0, Y | 0, g | 0, h | 0) | 0;
 X = U() | 0;
 h = _f(gb | 0, fb | 0, g | 0, h | 0) | 0;
 g = U() | 0;
 b = _f(gb | 0, fb | 0, q | 0, b | 0) | 0;
 q = U() | 0;
 bb = $f(eb | 0, db | 0, cb | 0, bb | 0) | 0;
 $a = $f(bb | 0, U() | 0, ab | 0, $a | 0) | 0;
 Za = $f($a | 0, U() | 0, _a | 0, Za | 0) | 0;
 Xa = $f(Za | 0, U() | 0, Ya | 0, Xa | 0) | 0;
 r = $f(Xa | 0, U() | 0, d | 0, r | 0) | 0;
 d = U() | 0;
 Ta = $f(Wa | 0, Va | 0, Ua | 0, Ta | 0) | 0;
 Ra = $f(Ta | 0, U() | 0, Sa | 0, Ra | 0) | 0;
 Pa = $f(Ra | 0, U() | 0, Qa | 0, Pa | 0) | 0;
 t = $f(Pa | 0, U() | 0, o | 0, t | 0) | 0;
 o = U() | 0;
 La = $f(Oa | 0, Na | 0, Ma | 0, La | 0) | 0;
 Ja = $f(La | 0, U() | 0, Ka | 0, Ja | 0) | 0;
 Ha = $f(Ja | 0, U() | 0, Ia | 0, Ha | 0) | 0;
 Fa = $f(Ha | 0, U() | 0, Ga | 0, Fa | 0) | 0;
 w = $f(Fa | 0, U() | 0, f | 0, w | 0) | 0;
 f = U() | 0;
 Ba = $f(Ea | 0, Da | 0, Ca | 0, Ba | 0) | 0;
 za = $f(Ba | 0, U() | 0, Aa | 0, za | 0) | 0;
 xa = $f(za | 0, U() | 0, ya | 0, xa | 0) | 0;
 u = $f(xa | 0, U() | 0, e | 0, u | 0) | 0;
 e = U() | 0;
 ta = $f(wa | 0, va | 0, ua | 0, ta | 0) | 0;
 ra = $f(ta | 0, U() | 0, sa | 0, ra | 0) | 0;
 pa = $f(ra | 0, U() | 0, qa | 0, pa | 0) | 0;
 na = $f(pa | 0, U() | 0, oa | 0, na | 0) | 0;
 p = $f(na | 0, U() | 0, x | 0, p | 0) | 0;
 x = U() | 0;
 ja = $f(ma | 0, la | 0, ka | 0, ja | 0) | 0;
 ha = $f(ja | 0, U() | 0, ia | 0, ha | 0) | 0;
 fa = $f(ha | 0, U() | 0, ga | 0, fa | 0) | 0;
 j = $f(fa | 0, U() | 0, s | 0, j | 0) | 0;
 s = U() | 0;
 ba = $f(ea | 0, da | 0, ca | 0, ba | 0) | 0;
 $ = $f(ba | 0, U() | 0, aa | 0, $ | 0) | 0;
 Z = $f($ | 0, U() | 0, _ | 0, Z | 0) | 0;
 X = $f(Z | 0, U() | 0, Y | 0, X | 0) | 0;
 v = $f(X | 0, U() | 0, i | 0, v | 0) | 0;
 i = U() | 0;
 S = $f(W | 0, V | 0, T | 0, S | 0) | 0;
 Q = $f(S | 0, U() | 0, R | 0, Q | 0) | 0;
 O = $f(Q | 0, U() | 0, P | 0, O | 0) | 0;
 g = $f(O | 0, U() | 0, h | 0, g | 0) | 0;
 h = U() | 0;
 K = $f(N | 0, M | 0, L | 0, K | 0) | 0;
 I = $f(K | 0, U() | 0, J | 0, I | 0) | 0;
 G = $f(I | 0, U() | 0, H | 0, G | 0) | 0;
 E = $f(G | 0, U() | 0, F | 0, E | 0) | 0;
 q = $f(E | 0, U() | 0, b | 0, q | 0) | 0;
 b = U() | 0;
 A = $f(D | 0, C | 0, B | 0, A | 0) | 0;
 y = $f(A | 0, U() | 0, z | 0, y | 0) | 0;
 n = $f(y | 0, U() | 0, m | 0, n | 0) | 0;
 k = $f(n | 0, U() | 0, l | 0, k | 0) | 0;
 l = U() | 0;
 d = gg(r | 0, d | 0, 1) | 0;
 r = U() | 0;
 o = gg(t | 0, o | 0, 1) | 0;
 t = U() | 0;
 f = gg(w | 0, f | 0, 1) | 0;
 w = U() | 0;
 e = gg(u | 0, e | 0, 1) | 0;
 u = U() | 0;
 x = gg(p | 0, x | 0, 1) | 0;
 p = U() | 0;
 s = gg(j | 0, s | 0, 1) | 0;
 j = U() | 0;
 i = gg(v | 0, i | 0, 1) | 0;
 v = U() | 0;
 h = gg(g | 0, h | 0, 1) | 0;
 g = U() | 0;
 b = gg(q | 0, b | 0, 1) | 0;
 q = U() | 0;
 l = gg(k | 0, l | 0, 1) | 0;
 k = U() | 0;
 n = $f(d | 0, r | 0, 33554432, 0) | 0;
 m = U() | 0;
 y = eg(n | 0, m | 0, 26) | 0;
 t = $f(y | 0, U() | 0, o | 0, t | 0) | 0;
 o = U() | 0;
 m = ag(d | 0, r | 0, n & -67108864 | 0, m | 0) | 0;
 n = U() | 0;
 r = $f(x | 0, p | 0, 33554432, 0) | 0;
 d = U() | 0;
 y = eg(r | 0, d | 0, 26) | 0;
 j = $f(y | 0, U() | 0, s | 0, j | 0) | 0;
 s = U() | 0;
 d = ag(x | 0, p | 0, r & -67108864 | 0, d | 0) | 0;
 r = U() | 0;
 p = $f(t | 0, o | 0, 16777216, 0) | 0;
 x = eg(p | 0, U() | 0, 25) | 0;
 w = $f(x | 0, U() | 0, f | 0, w | 0) | 0;
 f = U() | 0;
 p = ag(t | 0, o | 0, p & -33554432 | 0, 0) | 0;
 o = U() | 0;
 t = $f(j | 0, s | 0, 16777216, 0) | 0;
 x = eg(t | 0, U() | 0, 25) | 0;
 v = $f(x | 0, U() | 0, i | 0, v | 0) | 0;
 i = U() | 0;
 t = ag(j | 0, s | 0, t & -33554432 | 0, 0) | 0;
 s = U() | 0;
 j = $f(w | 0, f | 0, 33554432, 0) | 0;
 x = eg(j | 0, U() | 0, 26) | 0;
 u = $f(x | 0, U() | 0, e | 0, u | 0) | 0;
 e = U() | 0;
 j = ag(w | 0, f | 0, j & -67108864 | 0, 0) | 0;
 U() | 0;
 f = $f(v | 0, i | 0, 33554432, 0) | 0;
 w = eg(f | 0, U() | 0, 26) | 0;
 g = $f(w | 0, U() | 0, h | 0, g | 0) | 0;
 h = U() | 0;
 f = ag(v | 0, i | 0, f & -67108864 | 0, 0) | 0;
 U() | 0;
 i = $f(u | 0, e | 0, 16777216, 0) | 0;
 v = eg(i | 0, U() | 0, 25) | 0;
 r = $f(v | 0, U() | 0, d | 0, r | 0) | 0;
 d = U() | 0;
 i = ag(u | 0, e | 0, i & -33554432 | 0, 0) | 0;
 U() | 0;
 e = $f(g | 0, h | 0, 16777216, 0) | 0;
 u = eg(e | 0, U() | 0, 25) | 0;
 q = $f(u | 0, U() | 0, b | 0, q | 0) | 0;
 b = U() | 0;
 e = ag(g | 0, h | 0, e & -33554432 | 0, 0) | 0;
 U() | 0;
 h = $f(r | 0, d | 0, 33554432, 0) | 0;
 g = fg(h | 0, U() | 0, 26) | 0;
 g = $f(t | 0, s | 0, g | 0, U() | 0) | 0;
 U() | 0;
 h = ag(r | 0, d | 0, h & -67108864 | 0, 0) | 0;
 U() | 0;
 d = $f(q | 0, b | 0, 33554432, 0) | 0;
 r = eg(d | 0, U() | 0, 26) | 0;
 k = $f(r | 0, U() | 0, l | 0, k | 0) | 0;
 l = U() | 0;
 d = ag(q | 0, b | 0, d & -67108864 | 0, 0) | 0;
 U() | 0;
 b = $f(k | 0, l | 0, 16777216, 0) | 0;
 q = eg(b | 0, U() | 0, 25) | 0;
 q = _f(q | 0, U() | 0, 19, 0) | 0;
 n = $f(q | 0, U() | 0, m | 0, n | 0) | 0;
 m = U() | 0;
 b = ag(k | 0, l | 0, b & -33554432 | 0, 0) | 0;
 U() | 0;
 l = $f(n | 0, m | 0, 33554432, 0) | 0;
 k = fg(l | 0, U() | 0, 26) | 0;
 k = $f(p | 0, o | 0, k | 0, U() | 0) | 0;
 U() | 0;
 l = ag(n | 0, m | 0, l & -67108864 | 0, 0) | 0;
 U() | 0;
 c[a >> 2] = l;
 c[a + 4 >> 2] = k;
 c[a + 8 >> 2] = j;
 c[a + 12 >> 2] = i;
 c[a + 16 >> 2] = h;
 c[a + 20 >> 2] = g;
 c[a + 24 >> 2] = f;
 c[a + 28 >> 2] = e;
 c[a + 32 >> 2] = d;
 c[a + 36 >> 2] = b;
 return;
}

function ic(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0;
 bb = c[b >> 2] | 0;
 va = c[b + 4 >> 2] | 0;
 k = c[b + 8 >> 2] | 0;
 ma = c[b + 12 >> 2] | 0;
 g = c[b + 16 >> 2] | 0;
 db = c[b + 20 >> 2] | 0;
 h = c[b + 24 >> 2] | 0;
 o = c[b + 28 >> 2] | 0;
 O = c[b + 32 >> 2] | 0;
 C = c[b + 36 >> 2] | 0;
 r = bb << 1;
 d = va << 1;
 Xa = k << 1;
 i = ma << 1;
 oa = g << 1;
 f = db << 1;
 m = h << 1;
 e = o << 1;
 Ma = db * 38 | 0;
 sa = h * 19 | 0;
 xa = o * 38 | 0;
 ea = O * 19 | 0;
 gb = C * 38 | 0;
 cb = ((bb | 0) < 0) << 31 >> 31;
 cb = _f(bb | 0, cb | 0, bb | 0, cb | 0) | 0;
 bb = U() | 0;
 s = ((r | 0) < 0) << 31 >> 31;
 ua = ((va | 0) < 0) << 31 >> 31;
 Ka = _f(r | 0, s | 0, va | 0, ua | 0) | 0;
 Ja = U() | 0;
 j = ((k | 0) < 0) << 31 >> 31;
 Wa = _f(k | 0, j | 0, r | 0, s | 0) | 0;
 Va = U() | 0;
 na = ((ma | 0) < 0) << 31 >> 31;
 Ua = _f(ma | 0, na | 0, r | 0, s | 0) | 0;
 Ta = U() | 0;
 Z = ((g | 0) < 0) << 31 >> 31;
 Oa = _f(g | 0, Z | 0, r | 0, s | 0) | 0;
 Na = U() | 0;
 eb = ((db | 0) < 0) << 31 >> 31;
 Aa = _f(db | 0, eb | 0, r | 0, s | 0) | 0;
 za = U() | 0;
 wa = ((h | 0) < 0) << 31 >> 31;
 ha = _f(h | 0, wa | 0, r | 0, s | 0) | 0;
 ga = U() | 0;
 B = ((o | 0) < 0) << 31 >> 31;
 R = _f(o | 0, B | 0, r | 0, s | 0) | 0;
 Q = U() | 0;
 P = ((O | 0) < 0) << 31 >> 31;
 F = _f(O | 0, P | 0, r | 0, s | 0) | 0;
 E = U() | 0;
 D = ((C | 0) < 0) << 31 >> 31;
 s = _f(C | 0, D | 0, r | 0, s | 0) | 0;
 r = U() | 0;
 l = ((d | 0) < 0) << 31 >> 31;
 ua = _f(d | 0, l | 0, va | 0, ua | 0) | 0;
 va = U() | 0;
 ca = _f(d | 0, l | 0, k | 0, j | 0) | 0;
 da = U() | 0;
 q = ((i | 0) < 0) << 31 >> 31;
 Sa = _f(i | 0, q | 0, d | 0, l | 0) | 0;
 Ra = U() | 0;
 Ea = _f(g | 0, Z | 0, d | 0, l | 0) | 0;
 Da = U() | 0;
 p = ((f | 0) < 0) << 31 >> 31;
 ja = _f(f | 0, p | 0, d | 0, l | 0) | 0;
 ia = U() | 0;
 T = _f(h | 0, wa | 0, d | 0, l | 0) | 0;
 S = U() | 0;
 b = ((e | 0) < 0) << 31 >> 31;
 H = _f(e | 0, b | 0, d | 0, l | 0) | 0;
 G = U() | 0;
 u = _f(O | 0, P | 0, d | 0, l | 0) | 0;
 t = U() | 0;
 fb = ((gb | 0) < 0) << 31 >> 31;
 l = _f(gb | 0, fb | 0, d | 0, l | 0) | 0;
 d = U() | 0;
 Qa = _f(k | 0, j | 0, k | 0, j | 0) | 0;
 Pa = U() | 0;
 Ya = ((Xa | 0) < 0) << 31 >> 31;
 Ca = _f(Xa | 0, Ya | 0, ma | 0, na | 0) | 0;
 Ba = U() | 0;
 la = _f(g | 0, Z | 0, Xa | 0, Ya | 0) | 0;
 ka = U() | 0;
 Y = _f(db | 0, eb | 0, Xa | 0, Ya | 0) | 0;
 X = U() | 0;
 N = _f(h | 0, wa | 0, Xa | 0, Ya | 0) | 0;
 M = U() | 0;
 w = _f(o | 0, B | 0, Xa | 0, Ya | 0) | 0;
 v = U() | 0;
 fa = ((ea | 0) < 0) << 31 >> 31;
 Ya = _f(ea | 0, fa | 0, Xa | 0, Ya | 0) | 0;
 Xa = U() | 0;
 j = _f(gb | 0, fb | 0, k | 0, j | 0) | 0;
 k = U() | 0;
 na = _f(i | 0, q | 0, ma | 0, na | 0) | 0;
 ma = U() | 0;
 W = _f(i | 0, q | 0, g | 0, Z | 0) | 0;
 V = U() | 0;
 J = _f(f | 0, p | 0, i | 0, q | 0) | 0;
 I = U() | 0;
 A = _f(h | 0, wa | 0, i | 0, q | 0) | 0;
 z = U() | 0;
 ya = ((xa | 0) < 0) << 31 >> 31;
 _a = _f(xa | 0, ya | 0, i | 0, q | 0) | 0;
 Za = U() | 0;
 Ga = _f(ea | 0, fa | 0, i | 0, q | 0) | 0;
 Fa = U() | 0;
 q = _f(gb | 0, fb | 0, i | 0, q | 0) | 0;
 i = U() | 0;
 L = _f(g | 0, Z | 0, g | 0, Z | 0) | 0;
 K = U() | 0;
 pa = ((oa | 0) < 0) << 31 >> 31;
 y = _f(oa | 0, pa | 0, db | 0, eb | 0) | 0;
 x = U() | 0;
 ta = ((sa | 0) < 0) << 31 >> 31;
 ab = _f(sa | 0, ta | 0, oa | 0, pa | 0) | 0;
 $a = U() | 0;
 Ia = _f(xa | 0, ya | 0, g | 0, Z | 0) | 0;
 Ha = U() | 0;
 pa = _f(ea | 0, fa | 0, oa | 0, pa | 0) | 0;
 oa = U() | 0;
 Z = _f(gb | 0, fb | 0, g | 0, Z | 0) | 0;
 g = U() | 0;
 eb = _f(Ma | 0, ((Ma | 0) < 0) << 31 >> 31 | 0, db | 0, eb | 0) | 0;
 db = U() | 0;
 Ma = _f(sa | 0, ta | 0, f | 0, p | 0) | 0;
 La = U() | 0;
 ra = _f(xa | 0, ya | 0, f | 0, p | 0) | 0;
 qa = U() | 0;
 $ = _f(ea | 0, fa | 0, f | 0, p | 0) | 0;
 _ = U() | 0;
 p = _f(gb | 0, fb | 0, f | 0, p | 0) | 0;
 f = U() | 0;
 ta = _f(sa | 0, ta | 0, h | 0, wa | 0) | 0;
 sa = U() | 0;
 ba = _f(xa | 0, ya | 0, h | 0, wa | 0) | 0;
 aa = U() | 0;
 m = _f(ea | 0, fa | 0, m | 0, ((m | 0) < 0) << 31 >> 31 | 0) | 0;
 n = U() | 0;
 wa = _f(gb | 0, fb | 0, h | 0, wa | 0) | 0;
 h = U() | 0;
 B = _f(xa | 0, ya | 0, o | 0, B | 0) | 0;
 o = U() | 0;
 ya = _f(ea | 0, fa | 0, e | 0, b | 0) | 0;
 xa = U() | 0;
 b = _f(gb | 0, fb | 0, e | 0, b | 0) | 0;
 e = U() | 0;
 fa = _f(ea | 0, fa | 0, O | 0, P | 0) | 0;
 ea = U() | 0;
 P = _f(gb | 0, fb | 0, O | 0, P | 0) | 0;
 O = U() | 0;
 D = _f(gb | 0, fb | 0, C | 0, D | 0) | 0;
 C = U() | 0;
 bb = $f(eb | 0, db | 0, cb | 0, bb | 0) | 0;
 $a = $f(bb | 0, U() | 0, ab | 0, $a | 0) | 0;
 Za = $f($a | 0, U() | 0, _a | 0, Za | 0) | 0;
 Xa = $f(Za | 0, U() | 0, Ya | 0, Xa | 0) | 0;
 d = $f(Xa | 0, U() | 0, l | 0, d | 0) | 0;
 l = U() | 0;
 va = $f(Wa | 0, Va | 0, ua | 0, va | 0) | 0;
 ua = U() | 0;
 da = $f(Ua | 0, Ta | 0, ca | 0, da | 0) | 0;
 ca = U() | 0;
 Pa = $f(Sa | 0, Ra | 0, Qa | 0, Pa | 0) | 0;
 Na = $f(Pa | 0, U() | 0, Oa | 0, Na | 0) | 0;
 o = $f(Na | 0, U() | 0, B | 0, o | 0) | 0;
 n = $f(o | 0, U() | 0, m | 0, n | 0) | 0;
 f = $f(n | 0, U() | 0, p | 0, f | 0) | 0;
 p = U() | 0;
 n = $f(d | 0, l | 0, 33554432, 0) | 0;
 m = U() | 0;
 o = eg(n | 0, m | 0, 26) | 0;
 B = U() | 0;
 Ja = $f(Ma | 0, La | 0, Ka | 0, Ja | 0) | 0;
 Ha = $f(Ja | 0, U() | 0, Ia | 0, Ha | 0) | 0;
 Fa = $f(Ha | 0, U() | 0, Ga | 0, Fa | 0) | 0;
 k = $f(Fa | 0, U() | 0, j | 0, k | 0) | 0;
 B = $f(k | 0, U() | 0, o | 0, B | 0) | 0;
 o = U() | 0;
 m = ag(d | 0, l | 0, n & -67108864 | 0, m | 0) | 0;
 n = U() | 0;
 l = $f(f | 0, p | 0, 33554432, 0) | 0;
 d = U() | 0;
 k = eg(l | 0, d | 0, 26) | 0;
 j = U() | 0;
 Ba = $f(Ea | 0, Da | 0, Ca | 0, Ba | 0) | 0;
 za = $f(Ba | 0, U() | 0, Aa | 0, za | 0) | 0;
 xa = $f(za | 0, U() | 0, ya | 0, xa | 0) | 0;
 h = $f(xa | 0, U() | 0, wa | 0, h | 0) | 0;
 j = $f(h | 0, U() | 0, k | 0, j | 0) | 0;
 k = U() | 0;
 d = ag(f | 0, p | 0, l & -67108864 | 0, d | 0) | 0;
 l = U() | 0;
 p = $f(B | 0, o | 0, 16777216, 0) | 0;
 f = eg(p | 0, U() | 0, 25) | 0;
 h = U() | 0;
 sa = $f(va | 0, ua | 0, ta | 0, sa | 0) | 0;
 qa = $f(sa | 0, U() | 0, ra | 0, qa | 0) | 0;
 oa = $f(qa | 0, U() | 0, pa | 0, oa | 0) | 0;
 i = $f(oa | 0, U() | 0, q | 0, i | 0) | 0;
 h = $f(i | 0, U() | 0, f | 0, h | 0) | 0;
 f = U() | 0;
 p = ag(B | 0, o | 0, p & -33554432 | 0, 0) | 0;
 o = U() | 0;
 B = $f(j | 0, k | 0, 16777216, 0) | 0;
 i = eg(B | 0, U() | 0, 25) | 0;
 q = U() | 0;
 ka = $f(na | 0, ma | 0, la | 0, ka | 0) | 0;
 ia = $f(ka | 0, U() | 0, ja | 0, ia | 0) | 0;
 ga = $f(ia | 0, U() | 0, ha | 0, ga | 0) | 0;
 ea = $f(ga | 0, U() | 0, fa | 0, ea | 0) | 0;
 e = $f(ea | 0, U() | 0, b | 0, e | 0) | 0;
 q = $f(e | 0, U() | 0, i | 0, q | 0) | 0;
 i = U() | 0;
 B = ag(j | 0, k | 0, B & -33554432 | 0, 0) | 0;
 k = U() | 0;
 j = $f(h | 0, f | 0, 33554432, 0) | 0;
 e = eg(j | 0, U() | 0, 26) | 0;
 b = U() | 0;
 aa = $f(da | 0, ca | 0, ba | 0, aa | 0) | 0;
 _ = $f(aa | 0, U() | 0, $ | 0, _ | 0) | 0;
 g = $f(_ | 0, U() | 0, Z | 0, g | 0) | 0;
 b = $f(g | 0, U() | 0, e | 0, b | 0) | 0;
 e = U() | 0;
 j = ag(h | 0, f | 0, j & -67108864 | 0, 0) | 0;
 U() | 0;
 f = $f(q | 0, i | 0, 33554432, 0) | 0;
 h = eg(f | 0, U() | 0, 26) | 0;
 g = U() | 0;
 V = $f(Y | 0, X | 0, W | 0, V | 0) | 0;
 S = $f(V | 0, U() | 0, T | 0, S | 0) | 0;
 Q = $f(S | 0, U() | 0, R | 0, Q | 0) | 0;
 O = $f(Q | 0, U() | 0, P | 0, O | 0) | 0;
 g = $f(O | 0, U() | 0, h | 0, g | 0) | 0;
 h = U() | 0;
 f = ag(q | 0, i | 0, f & -67108864 | 0, 0) | 0;
 U() | 0;
 i = $f(b | 0, e | 0, 16777216, 0) | 0;
 q = eg(i | 0, U() | 0, 25) | 0;
 l = $f(q | 0, U() | 0, d | 0, l | 0) | 0;
 d = U() | 0;
 i = ag(b | 0, e | 0, i & -33554432 | 0, 0) | 0;
 U() | 0;
 e = $f(g | 0, h | 0, 16777216, 0) | 0;
 b = eg(e | 0, U() | 0, 25) | 0;
 q = U() | 0;
 K = $f(N | 0, M | 0, L | 0, K | 0) | 0;
 I = $f(K | 0, U() | 0, J | 0, I | 0) | 0;
 G = $f(I | 0, U() | 0, H | 0, G | 0) | 0;
 E = $f(G | 0, U() | 0, F | 0, E | 0) | 0;
 C = $f(E | 0, U() | 0, D | 0, C | 0) | 0;
 q = $f(C | 0, U() | 0, b | 0, q | 0) | 0;
 b = U() | 0;
 e = ag(g | 0, h | 0, e & -33554432 | 0, 0) | 0;
 U() | 0;
 h = $f(l | 0, d | 0, 33554432, 0) | 0;
 g = fg(h | 0, U() | 0, 26) | 0;
 g = $f(B | 0, k | 0, g | 0, U() | 0) | 0;
 U() | 0;
 h = ag(l | 0, d | 0, h & -67108864 | 0, 0) | 0;
 U() | 0;
 d = $f(q | 0, b | 0, 33554432, 0) | 0;
 l = eg(d | 0, U() | 0, 26) | 0;
 k = U() | 0;
 x = $f(A | 0, z | 0, y | 0, x | 0) | 0;
 v = $f(x | 0, U() | 0, w | 0, v | 0) | 0;
 t = $f(v | 0, U() | 0, u | 0, t | 0) | 0;
 r = $f(t | 0, U() | 0, s | 0, r | 0) | 0;
 k = $f(r | 0, U() | 0, l | 0, k | 0) | 0;
 l = U() | 0;
 d = ag(q | 0, b | 0, d & -67108864 | 0, 0) | 0;
 U() | 0;
 b = $f(k | 0, l | 0, 16777216, 0) | 0;
 q = eg(b | 0, U() | 0, 25) | 0;
 q = _f(q | 0, U() | 0, 19, 0) | 0;
 n = $f(q | 0, U() | 0, m | 0, n | 0) | 0;
 m = U() | 0;
 b = ag(k | 0, l | 0, b & -33554432 | 0, 0) | 0;
 U() | 0;
 l = $f(n | 0, m | 0, 33554432, 0) | 0;
 k = fg(l | 0, U() | 0, 26) | 0;
 k = $f(p | 0, o | 0, k | 0, U() | 0) | 0;
 U() | 0;
 l = ag(n | 0, m | 0, l & -67108864 | 0, 0) | 0;
 U() | 0;
 c[a >> 2] = l;
 c[a + 4 >> 2] = k;
 c[a + 8 >> 2] = j;
 c[a + 12 >> 2] = i;
 c[a + 16 >> 2] = h;
 c[a + 20 >> 2] = g;
 c[a + 24 >> 2] = f;
 c[a + 28 >> 2] = e;
 c[a + 32 >> 2] = d;
 c[a + 36 >> 2] = b;
 return;
}

function Yd(d, e, f, g, i) {
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 i = i | 0;
 var j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0;
 F = k;
 k = k + 64 | 0;
 B = F + 56 | 0;
 C = F + 40 | 0;
 z = F;
 D = F + 48 | 0;
 E = F + 60 | 0;
 c[B >> 2] = e;
 w = (d | 0) != 0;
 x = z + 40 | 0;
 y = x;
 z = z + 39 | 0;
 A = D + 4 | 0;
 j = 0;
 e = 0;
 m = 0;
 a : while (1) {
  do {
   do if ((e | 0) > -1) if ((j | 0) > (2147483647 - e | 0)) {
    c[(Pd() | 0) >> 2] = 75;
    e = -1;
    break;
   } else {
    e = j + e | 0;
    break;
   } while (0);
   s = c[B >> 2] | 0;
   j = a[s >> 0] | 0;
   if (!(j << 24 >> 24)) {
    v = 94;
    break a;
   }
   l = s;
   b : while (1) {
    switch (j << 24 >> 24) {
    case 37:
     {
      v = 10;
      break b;
     }
    case 0:
     {
      j = l;
      break b;
     }
    default:
     {}
    }
    u = l + 1 | 0;
    c[B >> 2] = u;
    j = a[u >> 0] | 0;
    l = u;
   }
   c : do if ((v | 0) == 10) {
    v = 0;
    j = l;
    do {
     if ((a[l + 1 >> 0] | 0) != 37) break c;
     j = j + 1 | 0;
     l = l + 2 | 0;
     c[B >> 2] = l;
    } while ((a[l >> 0] | 0) == 37);
   } while (0);
   j = j - s | 0;
   if (w) Zd(d, s, j);
  } while ((j | 0) != 0);
  u = (Rd(a[(c[B >> 2] | 0) + 1 >> 0] | 0) | 0) == 0;
  l = c[B >> 2] | 0;
  if (u) {
   q = -1;
   o = m;
   j = 1;
  } else if ((a[l + 2 >> 0] | 0) == 36) {
   q = (a[l + 1 >> 0] | 0) + -48 | 0;
   o = 1;
   j = 3;
  } else {
   q = -1;
   o = m;
   j = 1;
  }
  j = l + j | 0;
  c[B >> 2] = j;
  l = a[j >> 0] | 0;
  m = (l << 24 >> 24) + -32 | 0;
  if (m >>> 0 > 31 | (1 << m & 75913 | 0) == 0) n = 0; else {
   n = 0;
   do {
    n = 1 << m | n;
    j = j + 1 | 0;
    c[B >> 2] = j;
    l = a[j >> 0] | 0;
    m = (l << 24 >> 24) + -32 | 0;
   } while (!(m >>> 0 > 31 | (1 << m & 75913 | 0) == 0));
  }
  if (l << 24 >> 24 == 42) {
   if (!(Rd(a[j + 1 >> 0] | 0) | 0)) v = 27; else {
    l = c[B >> 2] | 0;
    if ((a[l + 2 >> 0] | 0) == 36) {
     j = l + 1 | 0;
     c[i + ((a[j >> 0] | 0) + -48 << 2) >> 2] = 10;
     j = c[g + ((a[j >> 0] | 0) + -48 << 3) >> 2] | 0;
     m = 1;
     l = l + 3 | 0;
    } else v = 27;
   }
   if ((v | 0) == 27) {
    v = 0;
    if (o | 0) {
     e = -1;
     break;
    }
    if (w) {
     u = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);
     j = c[u >> 2] | 0;
     c[f >> 2] = u + 4;
    } else j = 0;
    m = 0;
    l = (c[B >> 2] | 0) + 1 | 0;
   }
   c[B >> 2] = l;
   u = (j | 0) < 0;
   t = u ? 0 - j | 0 : j;
   n = u ? n | 8192 : n;
   u = m;
  } else {
   j = _d(B) | 0;
   if ((j | 0) < 0) {
    e = -1;
    break;
   }
   t = j;
   u = o;
   l = c[B >> 2] | 0;
  }
  do if ((a[l >> 0] | 0) == 46) {
   j = l + 1 | 0;
   if ((a[j >> 0] | 0) != 42) {
    c[B >> 2] = j;
    j = _d(B) | 0;
    l = c[B >> 2] | 0;
    break;
   }
   if (Rd(a[l + 2 >> 0] | 0) | 0) {
    j = c[B >> 2] | 0;
    if ((a[j + 3 >> 0] | 0) == 36) {
     r = j + 2 | 0;
     c[i + ((a[r >> 0] | 0) + -48 << 2) >> 2] = 10;
     r = c[g + ((a[r >> 0] | 0) + -48 << 3) >> 2] | 0;
     l = j + 4 | 0;
     c[B >> 2] = l;
     j = r;
     break;
    }
   }
   if (u | 0) {
    e = -1;
    break a;
   }
   if (w) {
    r = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);
    j = c[r >> 2] | 0;
    c[f >> 2] = r + 4;
   } else j = 0;
   l = (c[B >> 2] | 0) + 2 | 0;
   c[B >> 2] = l;
  } else j = -1; while (0);
  r = 0;
  while (1) {
   if (((a[l >> 0] | 0) + -65 | 0) >>> 0 > 57) {
    e = -1;
    break a;
   }
   m = l;
   l = l + 1 | 0;
   c[B >> 2] = l;
   m = a[(a[m >> 0] | 0) + -65 + (32848 + (r * 58 | 0)) >> 0] | 0;
   o = m & 255;
   if ((o + -1 | 0) >>> 0 >= 8) break; else r = o;
  }
  if (!(m << 24 >> 24)) {
   e = -1;
   break;
  }
  p = (q | 0) > -1;
  do if (m << 24 >> 24 == 19) if (p) {
   e = -1;
   break a;
  } else v = 54; else {
   if (p) {
    c[i + (q << 2) >> 2] = o;
    p = g + (q << 3) | 0;
    q = c[p + 4 >> 2] | 0;
    v = C;
    c[v >> 2] = c[p >> 2];
    c[v + 4 >> 2] = q;
    v = 54;
    break;
   }
   if (!w) {
    e = 0;
    break a;
   }
   $d(C, o, f);
   l = c[B >> 2] | 0;
   v = 55;
  } while (0);
  if ((v | 0) == 54) {
   v = 0;
   if (w) v = 55; else j = 0;
  }
  d : do if ((v | 0) == 55) {
   v = 0;
   l = a[l + -1 >> 0] | 0;
   l = (r | 0) != 0 & (l & 15 | 0) == 3 ? l & -33 : l;
   m = n & -65537;
   q = (n & 8192 | 0) == 0 ? n : m;
   e : do switch (l | 0) {
   case 110:
    switch ((r & 255) << 24 >> 24) {
    case 0:
     {
      c[c[C >> 2] >> 2] = e;
      j = 0;
      break d;
     }
    case 1:
     {
      c[c[C >> 2] >> 2] = e;
      j = 0;
      break d;
     }
    case 2:
     {
      j = c[C >> 2] | 0;
      c[j >> 2] = e;
      c[j + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
      j = 0;
      break d;
     }
    case 3:
     {
      b[c[C >> 2] >> 1] = e;
      j = 0;
      break d;
     }
    case 4:
     {
      a[c[C >> 2] >> 0] = e;
      j = 0;
      break d;
     }
    case 6:
     {
      c[c[C >> 2] >> 2] = e;
      j = 0;
      break d;
     }
    case 7:
     {
      j = c[C >> 2] | 0;
      c[j >> 2] = e;
      c[j + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
      j = 0;
      break d;
     }
    default:
     {
      j = 0;
      break d;
     }
    }
   case 112:
    {
     l = 120;
     j = j >>> 0 > 8 ? j : 8;
     m = q | 8;
     v = 67;
     break;
    }
   case 88:
   case 120:
    {
     m = q;
     v = 67;
     break;
    }
   case 111:
    {
     m = C;
     l = c[m >> 2] | 0;
     m = c[m + 4 >> 2] | 0;
     p = be(l, m, x) | 0;
     v = y - p | 0;
     n = 0;
     o = 39088;
     j = (q & 8 | 0) == 0 | (j | 0) > (v | 0) ? j : v + 1 | 0;
     v = 73;
     break;
    }
   case 105:
   case 100:
    {
     m = C;
     l = c[m >> 2] | 0;
     m = c[m + 4 >> 2] | 0;
     if ((m | 0) < 0) {
      l = ag(0, 0, l | 0, m | 0) | 0;
      m = U() | 0;
      n = C;
      c[n >> 2] = l;
      c[n + 4 >> 2] = m;
      n = 1;
      o = 39088;
      v = 72;
      break e;
     } else {
      n = (q & 2049 | 0) != 0 & 1;
      o = (q & 2048 | 0) == 0 ? ((q & 1 | 0) == 0 ? 39088 : 39090) : 39089;
      v = 72;
      break e;
     }
    }
   case 117:
    {
     m = C;
     n = 0;
     o = 39088;
     l = c[m >> 2] | 0;
     m = c[m + 4 >> 2] | 0;
     v = 72;
     break;
    }
   case 99:
    {
     a[z >> 0] = c[C >> 2];
     r = z;
     n = 0;
     o = 39088;
     p = 1;
     j = y;
     break;
    }
   case 109:
    {
     l = de(c[(Pd() | 0) >> 2] | 0) | 0;
     v = 77;
     break;
    }
   case 115:
    {
     l = c[C >> 2] | 0;
     l = (l | 0) == 0 ? 39098 : l;
     v = 77;
     break;
    }
   case 67:
    {
     c[D >> 2] = c[C >> 2];
     c[A >> 2] = 0;
     c[C >> 2] = D;
     o = -1;
     v = 81;
     break;
    }
   case 83:
    {
     if (!j) {
      ee(d, 32, t, 0, q);
      j = 0;
      v = 91;
     } else {
      o = j;
      v = 81;
     }
     break;
    }
   case 65:
   case 71:
   case 70:
   case 69:
   case 97:
   case 103:
   case 102:
   case 101:
    {
     j = ge(d, +h[C >> 3], t, j, q, l) | 0;
     break d;
    }
   default:
    {
     r = s;
     n = 0;
     o = 39088;
     p = j;
     m = q;
     j = y;
    }
   } while (0);
   f : do if ((v | 0) == 67) {
    s = C;
    r = c[s >> 2] | 0;
    s = c[s + 4 >> 2] | 0;
    p = ae(r, s, x, l & 32) | 0;
    o = (m & 8 | 0) == 0 | (r | 0) == 0 & (s | 0) == 0;
    n = o ? 0 : 2;
    o = o ? 39088 : 39088 + (l >>> 4) | 0;
    q = m;
    l = r;
    m = s;
    v = 73;
   } else if ((v | 0) == 72) {
    p = ce(l, m, x) | 0;
    v = 73;
   } else if ((v | 0) == 77) {
    v = 0;
    s = Td(l, 0, j) | 0;
    q = (s | 0) == 0;
    r = l;
    n = 0;
    o = 39088;
    p = q ? j : s - l | 0;
    j = q ? l + j | 0 : s;
   } else if ((v | 0) == 81) {
    v = 0;
    n = c[C >> 2] | 0;
    j = 0;
    while (1) {
     l = c[n >> 2] | 0;
     if (!l) break;
     l = fe(E, l) | 0;
     m = (l | 0) < 0;
     if (m | l >>> 0 > (o - j | 0) >>> 0) {
      v = 85;
      break;
     }
     j = l + j | 0;
     if (o >>> 0 > j >>> 0) n = n + 4 | 0; else break;
    }
    if ((v | 0) == 85) {
     v = 0;
     if (m) {
      e = -1;
      break a;
     }
    }
    ee(d, 32, t, j, q);
    if (!j) {
     j = 0;
     v = 91;
    } else {
     m = c[C >> 2] | 0;
     n = 0;
     while (1) {
      l = c[m >> 2] | 0;
      if (!l) {
       v = 91;
       break f;
      }
      l = fe(E, l) | 0;
      n = l + n | 0;
      if ((n | 0) > (j | 0)) {
       v = 91;
       break f;
      }
      Zd(d, E, l);
      if (n >>> 0 >= j >>> 0) {
       v = 91;
       break;
      } else m = m + 4 | 0;
     }
    }
   } while (0);
   if ((v | 0) == 73) {
    v = 0;
    m = (l | 0) != 0 | (m | 0) != 0;
    s = (j | 0) != 0 | m;
    m = y - p + ((m ^ 1) & 1) | 0;
    r = s ? p : x;
    p = s ? ((j | 0) > (m | 0) ? j : m) : 0;
    m = (j | 0) > -1 ? q & -65537 : q;
    j = y;
   } else if ((v | 0) == 91) {
    v = 0;
    ee(d, 32, t, j, q ^ 8192);
    j = (t | 0) > (j | 0) ? t : j;
    break;
   }
   q = j - r | 0;
   p = (p | 0) < (q | 0) ? q : p;
   s = p + n | 0;
   j = (t | 0) < (s | 0) ? s : t;
   ee(d, 32, j, s, m);
   Zd(d, o, n);
   ee(d, 48, j, s, m ^ 65536);
   ee(d, 48, p, q, 0);
   Zd(d, r, q);
   ee(d, 32, j, s, m ^ 8192);
  } while (0);
  m = u;
 }
 g : do if ((v | 0) == 94) if (!d) if (!m) e = 0; else {
  e = 1;
  while (1) {
   j = c[i + (e << 2) >> 2] | 0;
   if (!j) break;
   $d(g + (e << 3) | 0, j, f);
   e = e + 1 | 0;
   if (e >>> 0 >= 10) {
    e = 1;
    break g;
   }
  }
  while (1) {
   if (c[i + (e << 2) >> 2] | 0) {
    e = -1;
    break g;
   }
   e = e + 1 | 0;
   if (e >>> 0 >= 10) {
    e = 1;
    break;
   }
  }
 } while (0);
 k = F;
 return e | 0;
}

function ge(b, e, f, g, h, i) {
 b = b | 0;
 e = +e;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 var j = 0, l = 0, m = 0, n = 0, o = 0.0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0;
 F = k;
 k = k + 560 | 0;
 m = F + 32 | 0;
 v = F + 536 | 0;
 E = F;
 D = E;
 n = F + 540 | 0;
 c[v >> 2] = 0;
 C = n + 12 | 0;
 he(e) | 0;
 j = U() | 0;
 if ((j | 0) < 0) {
  e = -e;
  he(e) | 0;
  B = 1;
  A = 39105;
  j = U() | 0;
 } else {
  B = (h & 2049 | 0) != 0 & 1;
  A = (h & 2048 | 0) == 0 ? ((h & 1 | 0) == 0 ? 39106 : 39111) : 39108;
 }
 do if (0 == 0 & (j & 2146435072 | 0) == 2146435072) {
  E = (i & 32 | 0) != 0;
  j = B + 3 | 0;
  ee(b, 32, f, j, h & -65537);
  Zd(b, A, B);
  Zd(b, e != e | 0.0 != 0.0 ? (E ? 39132 : 39136) : E ? 39124 : 39128, 3);
  ee(b, 32, f, j, h ^ 8192);
 } else {
  e = +ie(e, v) * 2.0;
  j = e != 0.0;
  if (j) c[v >> 2] = (c[v >> 2] | 0) + -1;
  u = i | 32;
  if ((u | 0) == 97) {
   q = i & 32;
   s = (q | 0) == 0 ? A : A + 9 | 0;
   r = B | 2;
   j = 12 - g | 0;
   do if (!(g >>> 0 > 11 | (j | 0) == 0)) {
    o = 8.0;
    do {
     j = j + -1 | 0;
     o = o * 16.0;
    } while ((j | 0) != 0);
    if ((a[s >> 0] | 0) == 45) {
     e = -(o + (-e - o));
     break;
    } else {
     e = e + o - o;
     break;
    }
   } while (0);
   l = c[v >> 2] | 0;
   j = (l | 0) < 0 ? 0 - l | 0 : l;
   j = ce(j, ((j | 0) < 0) << 31 >> 31, C) | 0;
   if ((j | 0) == (C | 0)) {
    j = n + 11 | 0;
    a[j >> 0] = 48;
   }
   a[j + -1 >> 0] = (l >> 31 & 2) + 43;
   p = j + -2 | 0;
   a[p >> 0] = i + 15;
   l = (g | 0) < 1;
   m = (h & 8 | 0) == 0;
   n = E;
   do {
    B = ~~e;
    j = n + 1 | 0;
    a[n >> 0] = q | d[33312 + B >> 0];
    e = (e - +(B | 0)) * 16.0;
    if ((j - D | 0) == 1) if (m & (l & e == 0.0)) n = j; else {
     a[j >> 0] = 46;
     n = n + 2 | 0;
    } else n = j;
   } while (e != 0.0);
   if (!g) t = 25; else if ((-2 - D + n | 0) < (g | 0)) {
    l = C;
    m = p;
    j = g + 2 + l - m | 0;
   } else t = 25;
   if ((t | 0) == 25) {
    l = C;
    m = p;
    j = l - D - m + n | 0;
   }
   C = j + r | 0;
   ee(b, 32, f, C, h);
   Zd(b, s, r);
   ee(b, 48, f, C, h ^ 65536);
   D = n - D | 0;
   Zd(b, E, D);
   E = l - m | 0;
   ee(b, 48, j - (D + E) | 0, 0, 0);
   Zd(b, p, E);
   ee(b, 32, f, C, h ^ 8192);
   j = C;
   break;
  }
  l = (g | 0) < 0 ? 6 : g;
  if (j) {
   j = (c[v >> 2] | 0) + -28 | 0;
   c[v >> 2] = j;
   e = e * 268435456.0;
  } else j = c[v >> 2] | 0;
  z = (j | 0) < 0 ? m : m + 288 | 0;
  m = z;
  do {
   y = ~~e >>> 0;
   c[m >> 2] = y;
   m = m + 4 | 0;
   e = (e - +(y >>> 0)) * 1.0e9;
  } while (e != 0.0);
  y = z;
  if ((j | 0) > 0) {
   q = z;
   while (1) {
    p = (j | 0) < 29 ? j : 29;
    j = m + -4 | 0;
    if (j >>> 0 < q >>> 0) n = q; else {
     n = 0;
     do {
      t = gg(c[j >> 2] | 0, 0, p | 0) | 0;
      t = $f(t | 0, U() | 0, n | 0, 0) | 0;
      w = U() | 0;
      n = dg(t | 0, w | 0, 1e9, 0) | 0;
      x = _f(n | 0, U() | 0, 1e9, 0) | 0;
      x = ag(t | 0, w | 0, x | 0, U() | 0) | 0;
      U() | 0;
      c[j >> 2] = x;
      j = j + -4 | 0;
     } while (j >>> 0 >= q >>> 0);
     if (!n) n = q; else {
      x = q + -4 | 0;
      c[x >> 2] = n;
      n = x;
     }
    }
    a : do if (m >>> 0 > n >>> 0) {
     j = m;
     while (1) {
      m = j + -4 | 0;
      if (c[m >> 2] | 0) {
       m = j;
       break a;
      }
      if (m >>> 0 > n >>> 0) j = m; else break;
     }
    } while (0);
    j = (c[v >> 2] | 0) - p | 0;
    c[v >> 2] = j;
    if ((j | 0) > 0) q = n; else break;
   }
  } else n = z;
  if ((j | 0) < 0) {
   g = ((l + 25 | 0) / 9 | 0) + 1 | 0;
   t = (u | 0) == 102;
   do {
    s = 0 - j | 0;
    s = (s | 0) < 9 ? s : 9;
    if (n >>> 0 < m >>> 0) {
     p = (1 << s) + -1 | 0;
     q = 1e9 >>> s;
     r = 0;
     j = n;
     do {
      x = c[j >> 2] | 0;
      c[j >> 2] = (x >>> s) + r;
      r = L(x & p, q) | 0;
      j = j + 4 | 0;
     } while (j >>> 0 < m >>> 0);
     n = (c[n >> 2] | 0) == 0 ? n + 4 | 0 : n;
     if (r) {
      c[m >> 2] = r;
      m = m + 4 | 0;
     }
    } else n = (c[n >> 2] | 0) == 0 ? n + 4 | 0 : n;
    j = t ? z : n;
    m = (m - j >> 2 | 0) > (g | 0) ? j + (g << 2) | 0 : m;
    j = (c[v >> 2] | 0) + s | 0;
    c[v >> 2] = j;
   } while ((j | 0) < 0);
   t = n;
  } else t = n;
  if (t >>> 0 < m >>> 0) {
   j = (y - t >> 2) * 9 | 0;
   p = c[t >> 2] | 0;
   if (p >>> 0 >= 10) {
    n = 10;
    do {
     n = n * 10 | 0;
     j = j + 1 | 0;
    } while (p >>> 0 >= n >>> 0);
   }
  } else j = 0;
  v = (u | 0) == 103;
  w = (l | 0) != 0;
  n = l - ((u | 0) == 102 ? 0 : j) + ((w & v) << 31 >> 31) | 0;
  if ((n | 0) < (((m - y >> 2) * 9 | 0) + -9 | 0)) {
   x = n + 9216 | 0;
   n = (x | 0) / 9 | 0;
   g = z + 4 + (n + -1024 << 2) | 0;
   n = x - (n * 9 | 0) | 0;
   if ((n | 0) < 8) {
    p = 10;
    while (1) {
     p = p * 10 | 0;
     if ((n | 0) < 7) n = n + 1 | 0; else break;
    }
   } else p = 10;
   r = c[g >> 2] | 0;
   n = (r >>> 0) / (p >>> 0) | 0;
   s = r - (L(n, p) | 0) | 0;
   q = (g + 4 | 0) == (m | 0);
   if (q & (s | 0) == 0) {
    n = g;
    p = t;
   } else {
    o = (n & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
    x = p >>> 1;
    e = s >>> 0 < x >>> 0 ? .5 : q & (s | 0) == (x | 0) ? 1.0 : 1.5;
    if (B) {
     x = (a[A >> 0] | 0) == 45;
     e = x ? -e : e;
     o = x ? -o : o;
    }
    n = r - s | 0;
    c[g >> 2] = n;
    if (o + e != o) {
     x = n + p | 0;
     c[g >> 2] = x;
     if (x >>> 0 > 999999999) {
      p = g;
      j = t;
      while (1) {
       n = p + -4 | 0;
       c[p >> 2] = 0;
       if (n >>> 0 < j >>> 0) {
        j = j + -4 | 0;
        c[j >> 2] = 0;
       }
       x = (c[n >> 2] | 0) + 1 | 0;
       c[n >> 2] = x;
       if (x >>> 0 > 999999999) p = n; else {
        p = j;
        break;
       }
      }
     } else {
      n = g;
      p = t;
     }
     j = (y - p >> 2) * 9 | 0;
     r = c[p >> 2] | 0;
     if (r >>> 0 >= 10) {
      q = 10;
      do {
       q = q * 10 | 0;
       j = j + 1 | 0;
      } while (r >>> 0 >= q >>> 0);
     }
    } else {
     n = g;
     p = t;
    }
   }
   x = n + 4 | 0;
   m = m >>> 0 > x >>> 0 ? x : m;
  } else p = t;
  g = 0 - j | 0;
  b : do if (m >>> 0 > p >>> 0) while (1) {
   n = m + -4 | 0;
   if (c[n >> 2] | 0) {
    x = m;
    u = 1;
    break b;
   }
   if (n >>> 0 > p >>> 0) m = n; else {
    x = n;
    u = 0;
    break;
   }
  } else {
   x = m;
   u = 0;
  } while (0);
  do if (v) {
   l = l + ((w ^ 1) & 1) | 0;
   if ((l | 0) > (j | 0) & (j | 0) > -5) {
    r = i + -1 | 0;
    l = l + -1 - j | 0;
   } else {
    r = i + -2 | 0;
    l = l + -1 | 0;
   }
   if (!(h & 8)) {
    if (u) {
     q = c[x + -4 >> 2] | 0;
     if (!q) n = 9; else if (!((q >>> 0) % 10 | 0)) {
      n = 0;
      m = 10;
      do {
       m = m * 10 | 0;
       n = n + 1 | 0;
      } while (!((q >>> 0) % (m >>> 0) | 0 | 0));
     } else n = 0;
    } else n = 9;
    m = ((x - y >> 2) * 9 | 0) + -9 | 0;
    if ((r | 32 | 0) == 102) {
     i = m - n | 0;
     i = (i | 0) > 0 ? i : 0;
     l = (l | 0) < (i | 0) ? l : i;
     break;
    } else {
     i = m + j - n | 0;
     i = (i | 0) > 0 ? i : 0;
     l = (l | 0) < (i | 0) ? l : i;
     break;
    }
   }
  } else r = i; while (0);
  t = (l | 0) != 0;
  q = t ? 1 : h >>> 3 & 1;
  s = (r | 32 | 0) == 102;
  if (s) {
   w = 0;
   j = (j | 0) > 0 ? j : 0;
  } else {
   m = (j | 0) < 0 ? g : j;
   m = ce(m, ((m | 0) < 0) << 31 >> 31, C) | 0;
   n = C;
   if ((n - m | 0) < 2) do {
    m = m + -1 | 0;
    a[m >> 0] = 48;
   } while ((n - m | 0) < 2);
   a[m + -1 >> 0] = (j >> 31 & 2) + 43;
   j = m + -2 | 0;
   a[j >> 0] = r;
   w = j;
   j = n - j | 0;
  }
  j = B + 1 + l + q + j | 0;
  ee(b, 32, f, j, h);
  Zd(b, A, B);
  ee(b, 48, f, j, h ^ 65536);
  if (s) {
   r = p >>> 0 > z >>> 0 ? z : p;
   s = E + 9 | 0;
   p = s;
   q = E + 8 | 0;
   n = r;
   do {
    m = ce(c[n >> 2] | 0, 0, s) | 0;
    if ((n | 0) == (r | 0)) {
     if ((m | 0) == (s | 0)) {
      a[q >> 0] = 48;
      m = q;
     }
    } else if (m >>> 0 > E >>> 0) {
     kg(E | 0, 48, m - D | 0) | 0;
     do m = m + -1 | 0; while (m >>> 0 > E >>> 0);
    }
    Zd(b, m, p - m | 0);
    n = n + 4 | 0;
   } while (n >>> 0 <= z >>> 0);
   if (!((h & 8 | 0) == 0 & (t ^ 1))) Zd(b, 39140, 1);
   if (n >>> 0 < x >>> 0 & (l | 0) > 0) while (1) {
    m = ce(c[n >> 2] | 0, 0, s) | 0;
    if (m >>> 0 > E >>> 0) {
     kg(E | 0, 48, m - D | 0) | 0;
     do m = m + -1 | 0; while (m >>> 0 > E >>> 0);
    }
    Zd(b, m, (l | 0) < 9 ? l : 9);
    n = n + 4 | 0;
    m = l + -9 | 0;
    if (!(n >>> 0 < x >>> 0 & (l | 0) > 9)) {
     l = m;
     break;
    } else l = m;
   }
   ee(b, 48, l + 9 | 0, 9, 0);
  } else {
   v = u ? x : p + 4 | 0;
   if (p >>> 0 < v >>> 0 & (l | 0) > -1) {
    g = E + 9 | 0;
    t = (h & 8 | 0) == 0;
    u = g;
    r = 0 - D | 0;
    s = E + 8 | 0;
    q = p;
    do {
     m = ce(c[q >> 2] | 0, 0, g) | 0;
     if ((m | 0) == (g | 0)) {
      a[s >> 0] = 48;
      m = s;
     }
     do if ((q | 0) == (p | 0)) {
      n = m + 1 | 0;
      Zd(b, m, 1);
      if (t & (l | 0) < 1) {
       m = n;
       break;
      }
      Zd(b, 39140, 1);
      m = n;
     } else {
      if (m >>> 0 <= E >>> 0) break;
      kg(E | 0, 48, m + r | 0) | 0;
      do m = m + -1 | 0; while (m >>> 0 > E >>> 0);
     } while (0);
     D = u - m | 0;
     Zd(b, m, (l | 0) > (D | 0) ? D : l);
     l = l - D | 0;
     q = q + 4 | 0;
    } while (q >>> 0 < v >>> 0 & (l | 0) > -1);
   }
   ee(b, 48, l + 18 | 0, 18, 0);
   Zd(b, w, C - w | 0);
  }
  ee(b, 32, f, j, h ^ 8192);
 } while (0);
 k = F;
 return ((j | 0) < (f | 0) ? f : j) | 0;
}

function Nc(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0;
 ca = k;
 k = k + 352 | 0;
 aa = ca + 144 | 0;
 ba = ca;
 kg(aa | 0, 0, 200) | 0;
 N = aa + 8 | 0;
 O = aa + 16 | 0;
 P = aa + 24 | 0;
 Q = aa + 32 | 0;
 R = aa + 40 | 0;
 S = aa + 48 | 0;
 T = aa + 56 | 0;
 U = aa + 64 | 0;
 V = aa + 72 | 0;
 W = aa + 80 | 0;
 X = aa + 88 | 0;
 Y = aa + 96 | 0;
 Z = aa + 104 | 0;
 _ = aa + 112 | 0;
 $ = aa + 120 | 0;
 f = aa + 128 | 0;
 if ((d | 0) < 136) {
  g = 0;
  h = 0;
  i = 0;
  j = 0;
  l = 0;
  m = 0;
  n = 0;
  o = 0;
  p = 0;
  q = 0;
  r = 0;
  s = 0;
  t = 0;
  u = 0;
  v = 0;
  w = 0;
  x = 0;
  y = 0;
  z = 0;
  A = 0;
  B = 0;
  C = 0;
  D = 0;
  E = 0;
  F = 0;
  G = 0;
  H = 0;
  I = 0;
  J = 0;
  K = 0;
 } else {
  M = d;
  d = 0;
  g = 0;
  h = 0;
  i = 0;
  j = 0;
  l = 0;
  m = 0;
  n = 0;
  o = 0;
  p = 0;
  q = 0;
  r = 0;
  s = 0;
  t = 0;
  u = 0;
  v = 0;
  w = 0;
  x = 0;
  y = 0;
  z = 0;
  A = 0;
  B = 0;
  C = 0;
  D = 0;
  E = 0;
  F = 0;
  G = 0;
  H = 0;
  I = 0;
  J = 0;
  K = 0;
  L = 0;
  while (1) {
   ea = b;
   da = o ^ c[ea + 4 >> 2];
   o = aa;
   c[o >> 2] = j ^ c[ea >> 2];
   c[o + 4 >> 2] = da;
   j = b + 8 | 0;
   o = D ^ c[j + 4 >> 2];
   D = N;
   c[D >> 2] = C ^ c[j >> 2];
   c[D + 4 >> 2] = o;
   C = b + 16 | 0;
   D = F ^ c[C + 4 >> 2];
   F = O;
   c[F >> 2] = E ^ c[C >> 2];
   c[F + 4 >> 2] = D;
   E = b + 24 | 0;
   F = H ^ c[E + 4 >> 2];
   H = P;
   c[H >> 2] = G ^ c[E >> 2];
   c[H + 4 >> 2] = F;
   G = b + 32 | 0;
   H = J ^ c[G + 4 >> 2];
   J = Q;
   c[J >> 2] = I ^ c[G >> 2];
   c[J + 4 >> 2] = H;
   I = b + 40 | 0;
   L = L ^ c[I + 4 >> 2];
   J = R;
   c[J >> 2] = K ^ c[I >> 2];
   c[J + 4 >> 2] = L;
   K = b + 48 | 0;
   J = g ^ c[K + 4 >> 2];
   L = S;
   c[L >> 2] = d ^ c[K >> 2];
   c[L + 4 >> 2] = J;
   L = b + 56 | 0;
   J = i ^ c[L + 4 >> 2];
   K = T;
   c[K >> 2] = h ^ c[L >> 2];
   c[K + 4 >> 2] = J;
   K = b + 64 | 0;
   J = m ^ c[K + 4 >> 2];
   L = U;
   c[L >> 2] = l ^ c[K >> 2];
   c[L + 4 >> 2] = J;
   L = b + 72 | 0;
   J = p ^ c[L + 4 >> 2];
   K = V;
   c[K >> 2] = n ^ c[L >> 2];
   c[K + 4 >> 2] = J;
   K = b + 80 | 0;
   J = r ^ c[K + 4 >> 2];
   L = W;
   c[L >> 2] = q ^ c[K >> 2];
   c[L + 4 >> 2] = J;
   L = b + 88 | 0;
   J = t ^ c[L + 4 >> 2];
   K = X;
   c[K >> 2] = s ^ c[L >> 2];
   c[K + 4 >> 2] = J;
   K = b + 96 | 0;
   J = v ^ c[K + 4 >> 2];
   L = Y;
   c[L >> 2] = u ^ c[K >> 2];
   c[L + 4 >> 2] = J;
   L = b + 104 | 0;
   J = x ^ c[L + 4 >> 2];
   K = Z;
   c[K >> 2] = w ^ c[L >> 2];
   c[K + 4 >> 2] = J;
   K = b + 112 | 0;
   J = z ^ c[K + 4 >> 2];
   L = _;
   c[L >> 2] = y ^ c[K >> 2];
   c[L + 4 >> 2] = J;
   L = b + 120 | 0;
   J = B ^ c[L + 4 >> 2];
   K = $;
   c[K >> 2] = A ^ c[L >> 2];
   c[K + 4 >> 2] = J;
   K = b + 128 | 0;
   J = f;
   L = c[J + 4 >> 2] ^ c[K + 4 >> 2];
   d = f;
   c[d >> 2] = c[J >> 2] ^ c[K >> 2];
   c[d + 4 >> 2] = L;
   Mc(aa, 24);
   d = M + -136 | 0;
   b = b + 136 | 0;
   if ((M | 0) < 272) break;
   o = aa;
   D = N;
   F = O;
   H = P;
   J = Q;
   L = R;
   g = S;
   i = T;
   m = U;
   p = V;
   r = W;
   t = X;
   v = Y;
   x = Z;
   z = _;
   B = $;
   M = d;
   d = c[g >> 2] | 0;
   g = c[g + 4 >> 2] | 0;
   h = c[i >> 2] | 0;
   i = c[i + 4 >> 2] | 0;
   j = c[o >> 2] | 0;
   l = c[m >> 2] | 0;
   m = c[m + 4 >> 2] | 0;
   n = c[p >> 2] | 0;
   o = c[o + 4 >> 2] | 0;
   p = c[p + 4 >> 2] | 0;
   q = c[r >> 2] | 0;
   r = c[r + 4 >> 2] | 0;
   s = c[t >> 2] | 0;
   t = c[t + 4 >> 2] | 0;
   u = c[v >> 2] | 0;
   v = c[v + 4 >> 2] | 0;
   w = c[x >> 2] | 0;
   x = c[x + 4 >> 2] | 0;
   y = c[z >> 2] | 0;
   z = c[z + 4 >> 2] | 0;
   A = c[B >> 2] | 0;
   B = c[B + 4 >> 2] | 0;
   C = c[D >> 2] | 0;
   D = c[D + 4 >> 2] | 0;
   E = c[F >> 2] | 0;
   F = c[F + 4 >> 2] | 0;
   G = c[H >> 2] | 0;
   H = c[H + 4 >> 2] | 0;
   I = c[J >> 2] | 0;
   J = c[J + 4 >> 2] | 0;
   K = c[L >> 2] | 0;
   L = c[L + 4 >> 2] | 0;
  }
  h = aa;
  j = N;
  m = O;
  o = P;
  q = Q;
  s = R;
  u = S;
  w = T;
  y = U;
  A = V;
  C = W;
  E = X;
  G = Y;
  I = Z;
  K = _;
  f = aa + 128 | 0;
  g = c[h >> 2] | 0;
  h = c[h + 4 >> 2] | 0;
  i = c[j >> 2] | 0;
  j = c[j + 4 >> 2] | 0;
  l = c[m >> 2] | 0;
  m = c[m + 4 >> 2] | 0;
  n = c[o >> 2] | 0;
  o = c[o + 4 >> 2] | 0;
  p = c[q >> 2] | 0;
  q = c[q + 4 >> 2] | 0;
  r = c[s >> 2] | 0;
  s = c[s + 4 >> 2] | 0;
  t = c[u >> 2] | 0;
  u = c[u + 4 >> 2] | 0;
  v = c[w >> 2] | 0;
  w = c[w + 4 >> 2] | 0;
  x = c[y >> 2] | 0;
  y = c[y + 4 >> 2] | 0;
  z = c[A >> 2] | 0;
  A = c[A + 4 >> 2] | 0;
  B = c[C >> 2] | 0;
  C = c[C + 4 >> 2] | 0;
  D = c[E >> 2] | 0;
  E = c[E + 4 >> 2] | 0;
  F = c[G >> 2] | 0;
  G = c[G + 4 >> 2] | 0;
  H = c[I >> 2] | 0;
  I = c[I + 4 >> 2] | 0;
  J = c[K >> 2] | 0;
  K = c[K + 4 >> 2] | 0;
 }
 ig(ba | 0, b | 0, d | 0) | 0;
 a[ba + d >> 0] = 1;
 kg(ba + (d + 1) | 0, 0, 135 - d | 0) | 0;
 M = ba + 135 | 0;
 a[M >> 0] = a[M >> 0] | -128;
 M = ba;
 da = h ^ c[M + 4 >> 2];
 ea = aa;
 c[ea >> 2] = g ^ c[M >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 8 | 0;
 da = j ^ c[ea + 4 >> 2];
 c[N >> 2] = i ^ c[ea >> 2];
 c[N + 4 >> 2] = da;
 N = ba + 16 | 0;
 da = m ^ c[N + 4 >> 2];
 ea = O;
 c[ea >> 2] = l ^ c[N >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 24 | 0;
 da = o ^ c[ea + 4 >> 2];
 c[P >> 2] = n ^ c[ea >> 2];
 c[P + 4 >> 2] = da;
 P = ba + 32 | 0;
 da = q ^ c[P + 4 >> 2];
 ea = Q;
 c[ea >> 2] = p ^ c[P >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 40 | 0;
 da = s ^ c[ea + 4 >> 2];
 c[R >> 2] = r ^ c[ea >> 2];
 c[R + 4 >> 2] = da;
 R = ba + 48 | 0;
 da = u ^ c[R + 4 >> 2];
 ea = S;
 c[ea >> 2] = t ^ c[R >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 56 | 0;
 da = w ^ c[ea + 4 >> 2];
 c[T >> 2] = v ^ c[ea >> 2];
 c[T + 4 >> 2] = da;
 T = ba + 64 | 0;
 da = y ^ c[T + 4 >> 2];
 ea = U;
 c[ea >> 2] = x ^ c[T >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 72 | 0;
 da = A ^ c[ea + 4 >> 2];
 c[V >> 2] = z ^ c[ea >> 2];
 c[V + 4 >> 2] = da;
 V = ba + 80 | 0;
 da = C ^ c[V + 4 >> 2];
 ea = W;
 c[ea >> 2] = B ^ c[V >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 88 | 0;
 da = E ^ c[ea + 4 >> 2];
 c[X >> 2] = D ^ c[ea >> 2];
 c[X + 4 >> 2] = da;
 X = ba + 96 | 0;
 da = G ^ c[X + 4 >> 2];
 ea = Y;
 c[ea >> 2] = F ^ c[X >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 104 | 0;
 da = I ^ c[ea + 4 >> 2];
 c[Z >> 2] = H ^ c[ea >> 2];
 c[Z + 4 >> 2] = da;
 Z = ba + 112 | 0;
 da = K ^ c[Z + 4 >> 2];
 ea = _;
 c[ea >> 2] = J ^ c[Z >> 2];
 c[ea + 4 >> 2] = da;
 ea = ba + 120 | 0;
 _ = $;
 da = c[_ + 4 >> 2] ^ c[ea + 4 >> 2];
 c[$ >> 2] = c[_ >> 2] ^ c[ea >> 2];
 c[$ + 4 >> 2] = da;
 ba = ba + 128 | 0;
 $ = f;
 da = c[$ + 4 >> 2] ^ c[ba + 4 >> 2];
 ea = f;
 c[ea >> 2] = c[$ >> 2] ^ c[ba >> 2];
 c[ea + 4 >> 2] = da;
 Mc(aa, 24);
 ig(e | 0, aa | 0, 200) | 0;
 k = ca;
 return;
}

function lc(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, ab = 0, bb = 0, cb = 0, db = 0;
 Ca = k;
 k = k + 2112 | 0;
 xa = Ca + 1536 | 0;
 ya = Ca + 1280 | 0;
 za = Ca;
 Aa = Ca + 1952 | 0;
 Ba = Ca + 1792 | 0;
 mc(xa, d);
 mc(ya, f);
 fc(za, e);
 d = b;
 e = d + 40 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 wa = b + 40 | 0;
 c[wa >> 2] = 1;
 d = b + 44 | 0;
 e = d + 36 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 va = b + 80 | 0;
 c[va >> 2] = 1;
 d = b + 84 | 0;
 e = d + 36 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 d = 255;
 while (1) {
  if (a[xa + d >> 0] | 0) break;
  if (a[ya + d >> 0] | 0) break;
  if (!d) {
   g = 16;
   break;
  } else d = d + -1 | 0;
 }
 if ((g | 0) == 16) {
  k = Ca;
  return;
 }
 if ((d | 0) <= -1) {
  k = Ca;
  return;
 }
 f = Aa + 120 | 0;
 g = Ba + 40 | 0;
 h = Aa + 40 | 0;
 i = Aa + 80 | 0;
 j = Ba + 80 | 0;
 l = Ba + 120 | 0;
 m = Ba + 44 | 0;
 n = Ba + 48 | 0;
 o = Ba + 52 | 0;
 p = Ba + 56 | 0;
 q = Ba + 60 | 0;
 r = Ba + 64 | 0;
 s = Ba + 68 | 0;
 t = Ba + 72 | 0;
 u = Ba + 76 | 0;
 v = Ba + 4 | 0;
 w = Ba + 8 | 0;
 x = Ba + 12 | 0;
 y = Ba + 16 | 0;
 z = Ba + 20 | 0;
 A = Ba + 24 | 0;
 B = Ba + 28 | 0;
 C = Ba + 32 | 0;
 D = Ba + 36 | 0;
 E = Aa + 4 | 0;
 F = Aa + 8 | 0;
 G = Aa + 12 | 0;
 H = Aa + 16 | 0;
 I = Aa + 20 | 0;
 J = Aa + 24 | 0;
 K = Aa + 28 | 0;
 L = Aa + 32 | 0;
 M = Aa + 36 | 0;
 N = Aa + 44 | 0;
 O = Aa + 48 | 0;
 P = Aa + 52 | 0;
 Q = Aa + 56 | 0;
 R = Aa + 60 | 0;
 S = Aa + 64 | 0;
 T = Aa + 68 | 0;
 U = Aa + 72 | 0;
 V = Aa + 76 | 0;
 W = Ba + 84 | 0;
 X = Ba + 88 | 0;
 Y = Ba + 92 | 0;
 Z = Ba + 96 | 0;
 _ = Ba + 100 | 0;
 $ = Ba + 104 | 0;
 aa = Ba + 108 | 0;
 ba = Ba + 112 | 0;
 ca = Ba + 116 | 0;
 da = Aa + 84 | 0;
 ea = Aa + 88 | 0;
 fa = Aa + 92 | 0;
 ga = Aa + 96 | 0;
 ha = Aa + 100 | 0;
 ia = Aa + 104 | 0;
 ja = Aa + 108 | 0;
 ka = Aa + 112 | 0;
 la = Aa + 116 | 0;
 ma = Aa + 124 | 0;
 na = Aa + 128 | 0;
 oa = Aa + 132 | 0;
 pa = Aa + 136 | 0;
 qa = Aa + 140 | 0;
 ra = Aa + 144 | 0;
 sa = Aa + 148 | 0;
 ta = Aa + 152 | 0;
 ua = Aa + 156 | 0;
 while (1) {
  hc(Aa, b);
  e = a[xa + d >> 0] | 0;
  if (e << 24 >> 24 > 0) {
   ec(Ba, Aa, f);
   ec(g, h, i);
   ec(j, i, f);
   ec(l, Aa, h);
   dc(Aa, Ba, za + (((e & 255) >>> 1 & 255) * 160 | 0) | 0);
  } else if (e << 24 >> 24 < 0) {
   ec(Ba, Aa, f);
   ec(g, h, i);
   ec(j, i, f);
   ec(l, Aa, h);
   nc(Aa, Ba, za + ((((e << 24 >> 24) / -2 | 0) << 24 >> 24) * 160 | 0) | 0);
  }
  e = a[ya + d >> 0] | 0;
  if (e << 24 >> 24 > 0) {
   ec(Ba, Aa, f);
   ec(g, h, i);
   ec(j, i, f);
   ec(l, Aa, h);
   oc(Aa, Ba, 30880 + (((e & 255) >>> 1 & 255) * 120 | 0) | 0);
  } else if (e << 24 >> 24 < 0) {
   ec(Ba, Aa, f);
   ec(g, h, i);
   ec(j, i, f);
   ec(l, Aa, h);
   Ua = ((e << 24 >> 24) / -2 | 0) << 24 >> 24;
   db = c[g >> 2] | 0;
   Ra = c[m >> 2] | 0;
   Ja = c[n >> 2] | 0;
   Wa = c[o >> 2] | 0;
   _a = c[p >> 2] | 0;
   cb = c[q >> 2] | 0;
   Ea = c[r >> 2] | 0;
   Ia = c[s >> 2] | 0;
   Ma = c[t >> 2] | 0;
   Qa = c[u >> 2] | 0;
   Va = c[Ba >> 2] | 0;
   Na = c[v >> 2] | 0;
   Fa = c[w >> 2] | 0;
   Ya = c[x >> 2] | 0;
   ab = c[y >> 2] | 0;
   e = c[z >> 2] | 0;
   Ga = c[A >> 2] | 0;
   Ka = c[B >> 2] | 0;
   Oa = c[C >> 2] | 0;
   Sa = c[D >> 2] | 0;
   c[Aa >> 2] = Va + db;
   c[E >> 2] = Na + Ra;
   c[F >> 2] = Fa + Ja;
   c[G >> 2] = Ya + Wa;
   c[H >> 2] = ab + _a;
   c[I >> 2] = e + cb;
   c[J >> 2] = Ga + Ea;
   c[K >> 2] = Ka + Ia;
   c[L >> 2] = Oa + Ma;
   c[M >> 2] = Sa + Qa;
   c[h >> 2] = db - Va;
   c[N >> 2] = Ra - Na;
   c[O >> 2] = Ja - Fa;
   c[P >> 2] = Wa - Ya;
   c[Q >> 2] = _a - ab;
   c[R >> 2] = cb - e;
   c[S >> 2] = Ea - Ga;
   c[T >> 2] = Ia - Ka;
   c[U >> 2] = Ma - Oa;
   c[V >> 2] = Qa - Sa;
   ec(i, Aa, 30880 + (Ua * 120 | 0) + 40 | 0);
   ec(h, h, 30880 + (Ua * 120 | 0) | 0);
   ec(f, 30880 + (Ua * 120 | 0) + 80 | 0, l);
   Ua = c[j >> 2] << 1;
   Sa = c[W >> 2] << 1;
   Qa = c[X >> 2] << 1;
   Oa = c[Y >> 2] << 1;
   Ma = c[Z >> 2] << 1;
   Ka = c[_ >> 2] << 1;
   Ia = c[$ >> 2] << 1;
   Ga = c[aa >> 2] << 1;
   Ea = c[ba >> 2] << 1;
   e = c[ca >> 2] << 1;
   cb = c[i >> 2] | 0;
   ab = c[da >> 2] | 0;
   _a = c[ea >> 2] | 0;
   Ya = c[fa >> 2] | 0;
   Wa = c[ga >> 2] | 0;
   Fa = c[ha >> 2] | 0;
   Ja = c[ia >> 2] | 0;
   Na = c[ja >> 2] | 0;
   Ra = c[ka >> 2] | 0;
   Va = c[la >> 2] | 0;
   db = c[h >> 2] | 0;
   bb = c[N >> 2] | 0;
   $a = c[O >> 2] | 0;
   Za = c[P >> 2] | 0;
   Xa = c[Q >> 2] | 0;
   Da = c[R >> 2] | 0;
   Ha = c[S >> 2] | 0;
   La = c[T >> 2] | 0;
   Pa = c[U >> 2] | 0;
   Ta = c[V >> 2] | 0;
   c[Aa >> 2] = cb - db;
   c[E >> 2] = ab - bb;
   c[F >> 2] = _a - $a;
   c[G >> 2] = Ya - Za;
   c[H >> 2] = Wa - Xa;
   c[I >> 2] = Fa - Da;
   c[J >> 2] = Ja - Ha;
   c[K >> 2] = Na - La;
   c[L >> 2] = Ra - Pa;
   c[M >> 2] = Va - Ta;
   c[h >> 2] = db + cb;
   c[N >> 2] = bb + ab;
   c[O >> 2] = $a + _a;
   c[P >> 2] = Za + Ya;
   c[Q >> 2] = Xa + Wa;
   c[R >> 2] = Da + Fa;
   c[S >> 2] = Ha + Ja;
   c[T >> 2] = La + Na;
   c[U >> 2] = Pa + Ra;
   c[V >> 2] = Ta + Va;
   Va = c[f >> 2] | 0;
   Ta = c[ma >> 2] | 0;
   Ra = c[na >> 2] | 0;
   Pa = c[oa >> 2] | 0;
   Na = c[pa >> 2] | 0;
   La = c[qa >> 2] | 0;
   Ja = c[ra >> 2] | 0;
   Ha = c[sa >> 2] | 0;
   Fa = c[ta >> 2] | 0;
   Da = c[ua >> 2] | 0;
   c[i >> 2] = Ua - Va;
   c[da >> 2] = Sa - Ta;
   c[ea >> 2] = Qa - Ra;
   c[fa >> 2] = Oa - Pa;
   c[ga >> 2] = Ma - Na;
   c[ha >> 2] = Ka - La;
   c[ia >> 2] = Ia - Ja;
   c[ja >> 2] = Ga - Ha;
   c[ka >> 2] = Ea - Fa;
   c[la >> 2] = e - Da;
   c[f >> 2] = Va + Ua;
   c[ma >> 2] = Ta + Sa;
   c[na >> 2] = Ra + Qa;
   c[oa >> 2] = Pa + Oa;
   c[pa >> 2] = Na + Ma;
   c[qa >> 2] = La + Ka;
   c[ra >> 2] = Ja + Ia;
   c[sa >> 2] = Ha + Ga;
   c[ta >> 2] = Fa + Ea;
   c[ua >> 2] = Da + e;
  }
  ec(b, Aa, f);
  ec(wa, h, i);
  ec(va, i, f);
  if ((d | 0) > 0) d = d + -1 | 0; else break;
 }
 k = Ca;
 return;
}

function Ce(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 if (!a) return;
 d = a + -8 | 0;
 f = c[9993] | 0;
 a = c[a + -4 >> 2] | 0;
 b = a & -8;
 j = d + b | 0;
 do if (!(a & 1)) {
  e = c[d >> 2] | 0;
  if (!(a & 3)) return;
  h = d + (0 - e) | 0;
  g = e + b | 0;
  if (h >>> 0 < f >>> 0) return;
  if ((c[9994] | 0) == (h | 0)) {
   a = j + 4 | 0;
   b = c[a >> 2] | 0;
   if ((b & 3 | 0) != 3) {
    i = h;
    b = g;
    break;
   }
   c[9991] = g;
   c[a >> 2] = b & -2;
   c[h + 4 >> 2] = g | 1;
   c[h + g >> 2] = g;
   return;
  }
  d = e >>> 3;
  if (e >>> 0 < 256) {
   a = c[h + 8 >> 2] | 0;
   b = c[h + 12 >> 2] | 0;
   if ((b | 0) == (a | 0)) {
    c[9989] = c[9989] & ~(1 << d);
    i = h;
    b = g;
    break;
   } else {
    c[a + 12 >> 2] = b;
    c[b + 8 >> 2] = a;
    i = h;
    b = g;
    break;
   }
  }
  f = c[h + 24 >> 2] | 0;
  a = c[h + 12 >> 2] | 0;
  do if ((a | 0) == (h | 0)) {
   b = h + 16 | 0;
   d = b + 4 | 0;
   a = c[d >> 2] | 0;
   if (!a) {
    a = c[b >> 2] | 0;
    if (!a) {
     a = 0;
     break;
    }
   } else b = d;
   while (1) {
    e = a + 20 | 0;
    d = c[e >> 2] | 0;
    if (!d) {
     e = a + 16 | 0;
     d = c[e >> 2] | 0;
     if (!d) break; else {
      a = d;
      b = e;
     }
    } else {
     a = d;
     b = e;
    }
   }
   c[b >> 2] = 0;
  } else {
   i = c[h + 8 >> 2] | 0;
   c[i + 12 >> 2] = a;
   c[a + 8 >> 2] = i;
  } while (0);
  if (!f) {
   i = h;
   b = g;
  } else {
   b = c[h + 28 >> 2] | 0;
   d = 40260 + (b << 2) | 0;
   if ((c[d >> 2] | 0) == (h | 0)) {
    c[d >> 2] = a;
    if (!a) {
     c[9990] = c[9990] & ~(1 << b);
     i = h;
     b = g;
     break;
    }
   } else {
    i = f + 16 | 0;
    c[((c[i >> 2] | 0) == (h | 0) ? i : f + 20 | 0) >> 2] = a;
    if (!a) {
     i = h;
     b = g;
     break;
    }
   }
   c[a + 24 >> 2] = f;
   b = h + 16 | 0;
   d = c[b >> 2] | 0;
   if (d | 0) {
    c[a + 16 >> 2] = d;
    c[d + 24 >> 2] = a;
   }
   b = c[b + 4 >> 2] | 0;
   if (!b) {
    i = h;
    b = g;
   } else {
    c[a + 20 >> 2] = b;
    c[b + 24 >> 2] = a;
    i = h;
    b = g;
   }
  }
 } else {
  i = d;
  h = d;
 } while (0);
 if (h >>> 0 >= j >>> 0) return;
 a = j + 4 | 0;
 e = c[a >> 2] | 0;
 if (!(e & 1)) return;
 if (!(e & 2)) {
  if ((c[9995] | 0) == (j | 0)) {
   j = (c[9992] | 0) + b | 0;
   c[9992] = j;
   c[9995] = i;
   c[i + 4 >> 2] = j | 1;
   if ((i | 0) != (c[9994] | 0)) return;
   c[9994] = 0;
   c[9991] = 0;
   return;
  }
  if ((c[9994] | 0) == (j | 0)) {
   j = (c[9991] | 0) + b | 0;
   c[9991] = j;
   c[9994] = h;
   c[i + 4 >> 2] = j | 1;
   c[h + j >> 2] = j;
   return;
  }
  f = (e & -8) + b | 0;
  d = e >>> 3;
  do if (e >>> 0 < 256) {
   b = c[j + 8 >> 2] | 0;
   a = c[j + 12 >> 2] | 0;
   if ((a | 0) == (b | 0)) {
    c[9989] = c[9989] & ~(1 << d);
    break;
   } else {
    c[b + 12 >> 2] = a;
    c[a + 8 >> 2] = b;
    break;
   }
  } else {
   g = c[j + 24 >> 2] | 0;
   a = c[j + 12 >> 2] | 0;
   do if ((a | 0) == (j | 0)) {
    b = j + 16 | 0;
    d = b + 4 | 0;
    a = c[d >> 2] | 0;
    if (!a) {
     a = c[b >> 2] | 0;
     if (!a) {
      d = 0;
      break;
     }
    } else b = d;
    while (1) {
     e = a + 20 | 0;
     d = c[e >> 2] | 0;
     if (!d) {
      e = a + 16 | 0;
      d = c[e >> 2] | 0;
      if (!d) break; else {
       a = d;
       b = e;
      }
     } else {
      a = d;
      b = e;
     }
    }
    c[b >> 2] = 0;
    d = a;
   } else {
    d = c[j + 8 >> 2] | 0;
    c[d + 12 >> 2] = a;
    c[a + 8 >> 2] = d;
    d = a;
   } while (0);
   if (g | 0) {
    a = c[j + 28 >> 2] | 0;
    b = 40260 + (a << 2) | 0;
    if ((c[b >> 2] | 0) == (j | 0)) {
     c[b >> 2] = d;
     if (!d) {
      c[9990] = c[9990] & ~(1 << a);
      break;
     }
    } else {
     e = g + 16 | 0;
     c[((c[e >> 2] | 0) == (j | 0) ? e : g + 20 | 0) >> 2] = d;
     if (!d) break;
    }
    c[d + 24 >> 2] = g;
    a = j + 16 | 0;
    b = c[a >> 2] | 0;
    if (b | 0) {
     c[d + 16 >> 2] = b;
     c[b + 24 >> 2] = d;
    }
    a = c[a + 4 >> 2] | 0;
    if (a | 0) {
     c[d + 20 >> 2] = a;
     c[a + 24 >> 2] = d;
    }
   }
  } while (0);
  c[i + 4 >> 2] = f | 1;
  c[h + f >> 2] = f;
  if ((i | 0) == (c[9994] | 0)) {
   c[9991] = f;
   return;
  }
 } else {
  c[a >> 2] = e & -2;
  c[i + 4 >> 2] = b | 1;
  c[h + b >> 2] = b;
  f = b;
 }
 a = f >>> 3;
 if (f >>> 0 < 256) {
  d = 39996 + (a << 1 << 2) | 0;
  b = c[9989] | 0;
  a = 1 << a;
  if (!(b & a)) {
   c[9989] = b | a;
   a = d;
   b = d + 8 | 0;
  } else {
   b = d + 8 | 0;
   a = c[b >> 2] | 0;
  }
  c[b >> 2] = i;
  c[a + 12 >> 2] = i;
  c[i + 8 >> 2] = a;
  c[i + 12 >> 2] = d;
  return;
 }
 a = f >>> 8;
 if (!a) e = 0; else if (f >>> 0 > 16777215) e = 31; else {
  h = (a + 1048320 | 0) >>> 16 & 8;
  j = a << h;
  g = (j + 520192 | 0) >>> 16 & 4;
  j = j << g;
  e = (j + 245760 | 0) >>> 16 & 2;
  e = 14 - (g | h | e) + (j << e >>> 15) | 0;
  e = f >>> (e + 7 | 0) & 1 | e << 1;
 }
 a = 40260 + (e << 2) | 0;
 c[i + 28 >> 2] = e;
 c[i + 20 >> 2] = 0;
 c[i + 16 >> 2] = 0;
 b = c[9990] | 0;
 d = 1 << e;
 a : do if (!(b & d)) {
  c[9990] = b | d;
  c[a >> 2] = i;
  c[i + 24 >> 2] = a;
  c[i + 12 >> 2] = i;
  c[i + 8 >> 2] = i;
 } else {
  a = c[a >> 2] | 0;
  b : do if ((c[a + 4 >> 2] & -8 | 0) != (f | 0)) {
   e = f << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
   while (1) {
    d = a + 16 + (e >>> 31 << 2) | 0;
    b = c[d >> 2] | 0;
    if (!b) break;
    if ((c[b + 4 >> 2] & -8 | 0) == (f | 0)) {
     a = b;
     break b;
    } else {
     e = e << 1;
     a = b;
    }
   }
   c[d >> 2] = i;
   c[i + 24 >> 2] = a;
   c[i + 12 >> 2] = i;
   c[i + 8 >> 2] = i;
   break a;
  } while (0);
  h = a + 8 | 0;
  j = c[h >> 2] | 0;
  c[j + 12 >> 2] = i;
  c[h >> 2] = i;
  c[i + 8 >> 2] = j;
  c[i + 12 >> 2] = a;
  c[i + 24 >> 2] = 0;
 } while (0);
 j = (c[9997] | 0) + -1 | 0;
 c[9997] = j;
 if (j | 0) return;
 a = 40412;
 while (1) {
  a = c[a >> 2] | 0;
  if (!a) break; else a = a + 8 | 0;
 }
 c[9997] = -1;
 return;
}

function vc(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0;
 t = k;
 k = k + 592 | 0;
 o = t + 464 | 0;
 q = t;
 r = t + 304 | 0;
 p = t + 184 | 0;
 s = t + 64 | 0;
 g = a[e >> 0] | 0;
 a[q >> 0] = g & 15;
 a[q + 1 >> 0] = (g & 255) >>> 4;
 g = a[e + 1 >> 0] | 0;
 a[q + 2 >> 0] = g & 15;
 a[q + 3 >> 0] = (g & 255) >>> 4;
 g = a[e + 2 >> 0] | 0;
 a[q + 4 >> 0] = g & 15;
 a[q + 5 >> 0] = (g & 255) >>> 4;
 g = a[e + 3 >> 0] | 0;
 a[q + 6 >> 0] = g & 15;
 a[q + 7 >> 0] = (g & 255) >>> 4;
 g = a[e + 4 >> 0] | 0;
 a[q + 8 >> 0] = g & 15;
 a[q + 9 >> 0] = (g & 255) >>> 4;
 g = a[e + 5 >> 0] | 0;
 a[q + 10 >> 0] = g & 15;
 a[q + 11 >> 0] = (g & 255) >>> 4;
 g = a[e + 6 >> 0] | 0;
 a[q + 12 >> 0] = g & 15;
 a[q + 13 >> 0] = (g & 255) >>> 4;
 g = a[e + 7 >> 0] | 0;
 a[q + 14 >> 0] = g & 15;
 a[q + 15 >> 0] = (g & 255) >>> 4;
 g = a[e + 8 >> 0] | 0;
 a[q + 16 >> 0] = g & 15;
 a[q + 17 >> 0] = (g & 255) >>> 4;
 g = a[e + 9 >> 0] | 0;
 a[q + 18 >> 0] = g & 15;
 a[q + 19 >> 0] = (g & 255) >>> 4;
 g = a[e + 10 >> 0] | 0;
 a[q + 20 >> 0] = g & 15;
 a[q + 21 >> 0] = (g & 255) >>> 4;
 g = a[e + 11 >> 0] | 0;
 a[q + 22 >> 0] = g & 15;
 a[q + 23 >> 0] = (g & 255) >>> 4;
 g = a[e + 12 >> 0] | 0;
 a[q + 24 >> 0] = g & 15;
 a[q + 25 >> 0] = (g & 255) >>> 4;
 g = a[e + 13 >> 0] | 0;
 a[q + 26 >> 0] = g & 15;
 a[q + 27 >> 0] = (g & 255) >>> 4;
 g = a[e + 14 >> 0] | 0;
 a[q + 28 >> 0] = g & 15;
 a[q + 29 >> 0] = (g & 255) >>> 4;
 g = a[e + 15 >> 0] | 0;
 a[q + 30 >> 0] = g & 15;
 a[q + 31 >> 0] = (g & 255) >>> 4;
 g = a[e + 16 >> 0] | 0;
 a[q + 32 >> 0] = g & 15;
 a[q + 33 >> 0] = (g & 255) >>> 4;
 g = a[e + 17 >> 0] | 0;
 a[q + 34 >> 0] = g & 15;
 a[q + 35 >> 0] = (g & 255) >>> 4;
 g = a[e + 18 >> 0] | 0;
 a[q + 36 >> 0] = g & 15;
 a[q + 37 >> 0] = (g & 255) >>> 4;
 g = a[e + 19 >> 0] | 0;
 a[q + 38 >> 0] = g & 15;
 a[q + 39 >> 0] = (g & 255) >>> 4;
 g = a[e + 20 >> 0] | 0;
 a[q + 40 >> 0] = g & 15;
 a[q + 41 >> 0] = (g & 255) >>> 4;
 g = a[e + 21 >> 0] | 0;
 a[q + 42 >> 0] = g & 15;
 a[q + 43 >> 0] = (g & 255) >>> 4;
 g = a[e + 22 >> 0] | 0;
 a[q + 44 >> 0] = g & 15;
 a[q + 45 >> 0] = (g & 255) >>> 4;
 g = a[e + 23 >> 0] | 0;
 a[q + 46 >> 0] = g & 15;
 a[q + 47 >> 0] = (g & 255) >>> 4;
 g = a[e + 24 >> 0] | 0;
 a[q + 48 >> 0] = g & 15;
 a[q + 49 >> 0] = (g & 255) >>> 4;
 g = a[e + 25 >> 0] | 0;
 a[q + 50 >> 0] = g & 15;
 a[q + 51 >> 0] = (g & 255) >>> 4;
 g = a[e + 26 >> 0] | 0;
 a[q + 52 >> 0] = g & 15;
 a[q + 53 >> 0] = (g & 255) >>> 4;
 g = a[e + 27 >> 0] | 0;
 a[q + 54 >> 0] = g & 15;
 a[q + 55 >> 0] = (g & 255) >>> 4;
 g = a[e + 28 >> 0] | 0;
 a[q + 56 >> 0] = g & 15;
 a[q + 57 >> 0] = (g & 255) >>> 4;
 g = a[e + 29 >> 0] | 0;
 a[q + 58 >> 0] = g & 15;
 a[q + 59 >> 0] = (g & 255) >>> 4;
 g = a[e + 30 >> 0] | 0;
 a[q + 60 >> 0] = g & 15;
 a[q + 61 >> 0] = (g & 255) >>> 4;
 e = a[e + 31 >> 0] | 0;
 a[q + 62 >> 0] = e & 15;
 g = q + 63 | 0;
 a[g >> 0] = (e & 255) >>> 4;
 e = 0;
 f = 0;
 do {
  n = q + f | 0;
  m = e + (d[n >> 0] | 0) | 0;
  e = (m << 24) + 134217728 >> 28;
  a[n >> 0] = m - (e << 4);
  f = f + 1 | 0;
 } while ((f | 0) != 63);
 a[g >> 0] = e + (d[g >> 0] | 0);
 e = b;
 f = e + 40 | 0;
 do {
  c[e >> 2] = 0;
  e = e + 4 | 0;
 } while ((e | 0) < (f | 0));
 m = b + 40 | 0;
 c[m >> 2] = 1;
 j = b + 44 | 0;
 e = j;
 f = e + 36 | 0;
 do {
  c[e >> 2] = 0;
  e = e + 4 | 0;
 } while ((e | 0) < (f | 0));
 n = b + 80 | 0;
 c[n >> 2] = 1;
 l = b + 84 | 0;
 e = l;
 f = e + 76 | 0;
 do {
  c[e >> 2] = 0;
  e = e + 4 | 0;
 } while ((e | 0) < (f | 0));
 f = r + 120 | 0;
 g = r + 40 | 0;
 h = r + 80 | 0;
 i = b + 120 | 0;
 e = 1;
 do {
  wc(s, e >>> 1, a[q + e >> 0] | 0);
  oc(r, b, s);
  ec(b, r, f);
  ec(m, g, h);
  ec(n, h, f);
  ec(i, r, g);
  e = e + 2 | 0;
 } while (e >>> 0 < 64);
 B = c[b + 4 >> 2] | 0;
 z = c[b + 8 >> 2] | 0;
 y = c[b + 12 >> 2] | 0;
 x = c[b + 16 >> 2] | 0;
 w = c[b + 20 >> 2] | 0;
 v = c[b + 24 >> 2] | 0;
 u = c[b + 28 >> 2] | 0;
 e = c[b + 32 >> 2] | 0;
 A = c[b + 36 >> 2] | 0;
 c[o >> 2] = c[b >> 2];
 c[o + 4 >> 2] = B;
 c[o + 8 >> 2] = z;
 c[o + 12 >> 2] = y;
 c[o + 16 >> 2] = x;
 c[o + 20 >> 2] = w;
 c[o + 24 >> 2] = v;
 c[o + 28 >> 2] = u;
 c[o + 32 >> 2] = e;
 c[o + 36 >> 2] = A;
 A = c[j >> 2] | 0;
 e = c[b + 48 >> 2] | 0;
 j = c[b + 52 >> 2] | 0;
 u = c[b + 56 >> 2] | 0;
 v = c[b + 60 >> 2] | 0;
 w = c[b + 64 >> 2] | 0;
 x = c[b + 68 >> 2] | 0;
 y = c[b + 72 >> 2] | 0;
 z = c[b + 76 >> 2] | 0;
 c[o + 40 >> 2] = c[m >> 2];
 c[o + 44 >> 2] = A;
 c[o + 48 >> 2] = e;
 c[o + 52 >> 2] = j;
 c[o + 56 >> 2] = u;
 c[o + 60 >> 2] = v;
 c[o + 64 >> 2] = w;
 c[o + 68 >> 2] = x;
 c[o + 72 >> 2] = y;
 c[o + 76 >> 2] = z;
 z = c[l >> 2] | 0;
 y = c[b + 88 >> 2] | 0;
 x = c[b + 92 >> 2] | 0;
 w = c[b + 96 >> 2] | 0;
 v = c[b + 100 >> 2] | 0;
 u = c[b + 104 >> 2] | 0;
 j = c[b + 108 >> 2] | 0;
 l = c[b + 112 >> 2] | 0;
 e = c[b + 116 >> 2] | 0;
 c[o + 80 >> 2] = c[n >> 2];
 c[o + 84 >> 2] = z;
 c[o + 88 >> 2] = y;
 c[o + 92 >> 2] = x;
 c[o + 96 >> 2] = w;
 c[o + 100 >> 2] = v;
 c[o + 104 >> 2] = u;
 c[o + 108 >> 2] = j;
 c[o + 112 >> 2] = l;
 c[o + 116 >> 2] = e;
 hc(r, o);
 ec(p, r, f);
 o = p + 40 | 0;
 ec(o, g, h);
 e = p + 80 | 0;
 ec(e, h, f);
 hc(r, p);
 ec(p, r, f);
 ec(o, g, h);
 ec(e, h, f);
 hc(r, p);
 ec(p, r, f);
 ec(o, g, h);
 ec(e, h, f);
 hc(r, p);
 ec(b, r, f);
 ec(m, g, h);
 ec(n, h, f);
 ec(i, r, g);
 e = 0;
 do {
  wc(s, e >>> 1, a[q + e >> 0] | 0);
  oc(r, b, s);
  ec(b, r, f);
  ec(m, g, h);
  ec(n, h, f);
  ec(i, r, g);
  e = e + 2 | 0;
 } while (e >>> 0 < 64);
 k = t;
 return;
}

function oc(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0;
 V = b + 40 | 0;
 k = b + 44 | 0;
 n = b + 48 | 0;
 q = b + 52 | 0;
 t = b + 56 | 0;
 w = b + 60 | 0;
 z = b + 64 | 0;
 C = b + 68 | 0;
 F = b + 72 | 0;
 D = b + 76 | 0;
 S = b + 4 | 0;
 Q = b + 8 | 0;
 f = b + 12 | 0;
 m = b + 16 | 0;
 o = b + 20 | 0;
 v = b + 24 | 0;
 x = b + 28 | 0;
 E = b + 32 | 0;
 P = b + 36 | 0;
 ga = (c[S >> 2] | 0) + (c[k >> 2] | 0) | 0;
 fa = (c[Q >> 2] | 0) + (c[n >> 2] | 0) | 0;
 ea = (c[f >> 2] | 0) + (c[q >> 2] | 0) | 0;
 da = (c[m >> 2] | 0) + (c[t >> 2] | 0) | 0;
 ca = (c[o >> 2] | 0) + (c[w >> 2] | 0) | 0;
 ba = (c[v >> 2] | 0) + (c[z >> 2] | 0) | 0;
 aa = (c[x >> 2] | 0) + (c[C >> 2] | 0) | 0;
 $ = (c[E >> 2] | 0) + (c[F >> 2] | 0) | 0;
 Y = (c[P >> 2] | 0) + (c[D >> 2] | 0) | 0;
 c[a >> 2] = (c[b >> 2] | 0) + (c[V >> 2] | 0);
 ha = a + 4 | 0;
 c[ha >> 2] = ga;
 ga = a + 8 | 0;
 c[ga >> 2] = fa;
 fa = a + 12 | 0;
 c[fa >> 2] = ea;
 ea = a + 16 | 0;
 c[ea >> 2] = da;
 da = a + 20 | 0;
 c[da >> 2] = ca;
 ca = a + 24 | 0;
 c[ca >> 2] = ba;
 ba = a + 28 | 0;
 c[ba >> 2] = aa;
 aa = a + 32 | 0;
 c[aa >> 2] = $;
 $ = a + 36 | 0;
 c[$ >> 2] = Y;
 Y = a + 40 | 0;
 S = (c[k >> 2] | 0) - (c[S >> 2] | 0) | 0;
 Q = (c[n >> 2] | 0) - (c[Q >> 2] | 0) | 0;
 f = (c[q >> 2] | 0) - (c[f >> 2] | 0) | 0;
 m = (c[t >> 2] | 0) - (c[m >> 2] | 0) | 0;
 o = (c[w >> 2] | 0) - (c[o >> 2] | 0) | 0;
 v = (c[z >> 2] | 0) - (c[v >> 2] | 0) | 0;
 x = (c[C >> 2] | 0) - (c[x >> 2] | 0) | 0;
 E = (c[F >> 2] | 0) - (c[E >> 2] | 0) | 0;
 P = (c[D >> 2] | 0) - (c[P >> 2] | 0) | 0;
 c[Y >> 2] = (c[V >> 2] | 0) - (c[b >> 2] | 0);
 V = a + 44 | 0;
 c[V >> 2] = S;
 S = a + 48 | 0;
 c[S >> 2] = Q;
 Q = a + 52 | 0;
 c[Q >> 2] = f;
 f = a + 56 | 0;
 c[f >> 2] = m;
 m = a + 60 | 0;
 c[m >> 2] = o;
 o = a + 64 | 0;
 c[o >> 2] = v;
 v = a + 68 | 0;
 c[v >> 2] = x;
 x = a + 72 | 0;
 c[x >> 2] = E;
 E = a + 76 | 0;
 c[E >> 2] = P;
 P = a + 80 | 0;
 ec(P, a, d);
 ec(Y, Y, d + 40 | 0);
 D = a + 120 | 0;
 ec(D, d + 80 | 0, b + 120 | 0);
 F = c[b + 80 >> 2] << 1;
 C = c[b + 84 >> 2] << 1;
 z = c[b + 88 >> 2] << 1;
 w = c[b + 92 >> 2] << 1;
 t = c[b + 96 >> 2] << 1;
 q = c[b + 100 >> 2] << 1;
 n = c[b + 104 >> 2] << 1;
 k = c[b + 108 >> 2] << 1;
 h = c[b + 112 >> 2] << 1;
 e = c[b + 116 >> 2] << 1;
 Z = c[P >> 2] | 0;
 O = a + 84 | 0;
 W = c[O >> 2] | 0;
 N = a + 88 | 0;
 T = c[N >> 2] | 0;
 M = a + 92 | 0;
 b = c[M >> 2] | 0;
 L = a + 96 | 0;
 g = c[L >> 2] | 0;
 K = a + 100 | 0;
 i = c[K >> 2] | 0;
 J = a + 104 | 0;
 p = c[J >> 2] | 0;
 I = a + 108 | 0;
 r = c[I >> 2] | 0;
 H = a + 112 | 0;
 y = c[H >> 2] | 0;
 G = a + 116 | 0;
 A = c[G >> 2] | 0;
 _ = c[Y >> 2] | 0;
 X = c[V >> 2] | 0;
 U = c[S >> 2] | 0;
 R = c[Q >> 2] | 0;
 d = c[f >> 2] | 0;
 j = c[m >> 2] | 0;
 l = c[o >> 2] | 0;
 s = c[v >> 2] | 0;
 u = c[x >> 2] | 0;
 B = c[E >> 2] | 0;
 c[a >> 2] = Z - _;
 c[ha >> 2] = W - X;
 c[ga >> 2] = T - U;
 c[fa >> 2] = b - R;
 c[ea >> 2] = g - d;
 c[da >> 2] = i - j;
 c[ca >> 2] = p - l;
 c[ba >> 2] = r - s;
 c[aa >> 2] = y - u;
 c[$ >> 2] = A - B;
 c[Y >> 2] = _ + Z;
 c[V >> 2] = X + W;
 c[S >> 2] = U + T;
 c[Q >> 2] = R + b;
 c[f >> 2] = d + g;
 c[m >> 2] = j + i;
 c[o >> 2] = l + p;
 c[v >> 2] = s + r;
 c[x >> 2] = u + y;
 c[E >> 2] = B + A;
 E = c[D >> 2] | 0;
 A = a + 124 | 0;
 B = c[A >> 2] | 0;
 x = a + 128 | 0;
 y = c[x >> 2] | 0;
 u = a + 132 | 0;
 v = c[u >> 2] | 0;
 r = a + 136 | 0;
 s = c[r >> 2] | 0;
 o = a + 140 | 0;
 p = c[o >> 2] | 0;
 l = a + 144 | 0;
 m = c[l >> 2] | 0;
 i = a + 148 | 0;
 j = c[i >> 2] | 0;
 f = a + 152 | 0;
 g = c[f >> 2] | 0;
 d = a + 156 | 0;
 b = c[d >> 2] | 0;
 c[P >> 2] = E + F;
 c[O >> 2] = B + C;
 c[N >> 2] = y + z;
 c[M >> 2] = v + w;
 c[L >> 2] = s + t;
 c[K >> 2] = p + q;
 c[J >> 2] = m + n;
 c[I >> 2] = j + k;
 c[H >> 2] = g + h;
 c[G >> 2] = b + e;
 c[D >> 2] = F - E;
 c[A >> 2] = C - B;
 c[x >> 2] = z - y;
 c[u >> 2] = w - v;
 c[r >> 2] = t - s;
 c[o >> 2] = q - p;
 c[l >> 2] = n - m;
 c[i >> 2] = k - j;
 c[f >> 2] = h - g;
 c[d >> 2] = e - b;
 return;
}

function nc(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0;
 V = b + 40 | 0;
 i = b + 44 | 0;
 l = b + 48 | 0;
 o = b + 52 | 0;
 r = b + 56 | 0;
 u = b + 60 | 0;
 x = b + 64 | 0;
 A = b + 68 | 0;
 D = b + 72 | 0;
 C = b + 76 | 0;
 S = b + 4 | 0;
 P = b + 8 | 0;
 e = b + 12 | 0;
 m = b + 16 | 0;
 n = b + 20 | 0;
 v = b + 24 | 0;
 w = b + 28 | 0;
 E = b + 32 | 0;
 O = b + 36 | 0;
 ga = (c[S >> 2] | 0) + (c[i >> 2] | 0) | 0;
 fa = (c[P >> 2] | 0) + (c[l >> 2] | 0) | 0;
 ea = (c[e >> 2] | 0) + (c[o >> 2] | 0) | 0;
 da = (c[m >> 2] | 0) + (c[r >> 2] | 0) | 0;
 ca = (c[n >> 2] | 0) + (c[u >> 2] | 0) | 0;
 ba = (c[v >> 2] | 0) + (c[x >> 2] | 0) | 0;
 aa = (c[w >> 2] | 0) + (c[A >> 2] | 0) | 0;
 $ = (c[E >> 2] | 0) + (c[D >> 2] | 0) | 0;
 Y = (c[O >> 2] | 0) + (c[C >> 2] | 0) | 0;
 c[a >> 2] = (c[b >> 2] | 0) + (c[V >> 2] | 0);
 ha = a + 4 | 0;
 c[ha >> 2] = ga;
 ga = a + 8 | 0;
 c[ga >> 2] = fa;
 fa = a + 12 | 0;
 c[fa >> 2] = ea;
 ea = a + 16 | 0;
 c[ea >> 2] = da;
 da = a + 20 | 0;
 c[da >> 2] = ca;
 ca = a + 24 | 0;
 c[ca >> 2] = ba;
 ba = a + 28 | 0;
 c[ba >> 2] = aa;
 aa = a + 32 | 0;
 c[aa >> 2] = $;
 $ = a + 36 | 0;
 c[$ >> 2] = Y;
 Y = a + 40 | 0;
 S = (c[i >> 2] | 0) - (c[S >> 2] | 0) | 0;
 P = (c[l >> 2] | 0) - (c[P >> 2] | 0) | 0;
 e = (c[o >> 2] | 0) - (c[e >> 2] | 0) | 0;
 m = (c[r >> 2] | 0) - (c[m >> 2] | 0) | 0;
 n = (c[u >> 2] | 0) - (c[n >> 2] | 0) | 0;
 v = (c[x >> 2] | 0) - (c[v >> 2] | 0) | 0;
 w = (c[A >> 2] | 0) - (c[w >> 2] | 0) | 0;
 E = (c[D >> 2] | 0) - (c[E >> 2] | 0) | 0;
 O = (c[C >> 2] | 0) - (c[O >> 2] | 0) | 0;
 c[Y >> 2] = (c[V >> 2] | 0) - (c[b >> 2] | 0);
 V = a + 44 | 0;
 c[V >> 2] = S;
 S = a + 48 | 0;
 c[S >> 2] = P;
 P = a + 52 | 0;
 c[P >> 2] = e;
 e = a + 56 | 0;
 c[e >> 2] = m;
 m = a + 60 | 0;
 c[m >> 2] = n;
 n = a + 64 | 0;
 c[n >> 2] = v;
 v = a + 68 | 0;
 c[v >> 2] = w;
 w = a + 72 | 0;
 c[w >> 2] = E;
 E = a + 76 | 0;
 c[E >> 2] = O;
 O = a + 80 | 0;
 ec(O, a, d + 40 | 0);
 ec(Y, Y, d);
 C = a + 120 | 0;
 ec(C, d + 120 | 0, b + 120 | 0);
 ec(a, b + 80 | 0, d + 80 | 0);
 D = c[a >> 2] << 1;
 A = c[ha >> 2] << 1;
 x = c[ga >> 2] << 1;
 u = c[fa >> 2] << 1;
 r = c[ea >> 2] << 1;
 o = c[da >> 2] << 1;
 l = c[ca >> 2] << 1;
 i = c[ba >> 2] << 1;
 f = c[aa >> 2] << 1;
 b = c[$ >> 2] << 1;
 Z = c[O >> 2] | 0;
 N = a + 84 | 0;
 W = c[N >> 2] | 0;
 M = a + 88 | 0;
 T = c[M >> 2] | 0;
 L = a + 92 | 0;
 Q = c[L >> 2] | 0;
 K = a + 96 | 0;
 g = c[K >> 2] | 0;
 J = a + 100 | 0;
 h = c[J >> 2] | 0;
 I = a + 104 | 0;
 p = c[I >> 2] | 0;
 H = a + 108 | 0;
 q = c[H >> 2] | 0;
 G = a + 112 | 0;
 y = c[G >> 2] | 0;
 F = a + 116 | 0;
 z = c[F >> 2] | 0;
 _ = c[Y >> 2] | 0;
 X = c[V >> 2] | 0;
 U = c[S >> 2] | 0;
 R = c[P >> 2] | 0;
 d = c[e >> 2] | 0;
 j = c[m >> 2] | 0;
 k = c[n >> 2] | 0;
 s = c[v >> 2] | 0;
 t = c[w >> 2] | 0;
 B = c[E >> 2] | 0;
 c[a >> 2] = Z - _;
 c[ha >> 2] = W - X;
 c[ga >> 2] = T - U;
 c[fa >> 2] = Q - R;
 c[ea >> 2] = g - d;
 c[da >> 2] = h - j;
 c[ca >> 2] = p - k;
 c[ba >> 2] = q - s;
 c[aa >> 2] = y - t;
 c[$ >> 2] = z - B;
 c[Y >> 2] = _ + Z;
 c[V >> 2] = X + W;
 c[S >> 2] = U + T;
 c[P >> 2] = R + Q;
 c[e >> 2] = d + g;
 c[m >> 2] = j + h;
 c[n >> 2] = k + p;
 c[v >> 2] = s + q;
 c[w >> 2] = t + y;
 c[E >> 2] = B + z;
 E = c[C >> 2] | 0;
 z = a + 124 | 0;
 B = c[z >> 2] | 0;
 w = a + 128 | 0;
 y = c[w >> 2] | 0;
 t = a + 132 | 0;
 v = c[t >> 2] | 0;
 q = a + 136 | 0;
 s = c[q >> 2] | 0;
 n = a + 140 | 0;
 p = c[n >> 2] | 0;
 k = a + 144 | 0;
 m = c[k >> 2] | 0;
 h = a + 148 | 0;
 j = c[h >> 2] | 0;
 e = a + 152 | 0;
 g = c[e >> 2] | 0;
 d = a + 156 | 0;
 a = c[d >> 2] | 0;
 c[O >> 2] = D - E;
 c[N >> 2] = A - B;
 c[M >> 2] = x - y;
 c[L >> 2] = u - v;
 c[K >> 2] = r - s;
 c[J >> 2] = o - p;
 c[I >> 2] = l - m;
 c[H >> 2] = i - j;
 c[G >> 2] = f - g;
 c[F >> 2] = b - a;
 c[C >> 2] = E + D;
 c[z >> 2] = B + A;
 c[w >> 2] = y + x;
 c[t >> 2] = v + u;
 c[q >> 2] = s + r;
 c[n >> 2] = p + o;
 c[k >> 2] = m + l;
 c[h >> 2] = j + i;
 c[e >> 2] = g + f;
 c[d >> 2] = a + b;
 return;
}

function dc(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0;
 V = b + 40 | 0;
 k = b + 44 | 0;
 n = b + 48 | 0;
 q = b + 52 | 0;
 t = b + 56 | 0;
 w = b + 60 | 0;
 z = b + 64 | 0;
 C = b + 68 | 0;
 F = b + 72 | 0;
 D = b + 76 | 0;
 S = b + 4 | 0;
 Q = b + 8 | 0;
 f = b + 12 | 0;
 m = b + 16 | 0;
 o = b + 20 | 0;
 v = b + 24 | 0;
 x = b + 28 | 0;
 E = b + 32 | 0;
 P = b + 36 | 0;
 ga = (c[S >> 2] | 0) + (c[k >> 2] | 0) | 0;
 fa = (c[Q >> 2] | 0) + (c[n >> 2] | 0) | 0;
 ea = (c[f >> 2] | 0) + (c[q >> 2] | 0) | 0;
 da = (c[m >> 2] | 0) + (c[t >> 2] | 0) | 0;
 ca = (c[o >> 2] | 0) + (c[w >> 2] | 0) | 0;
 ba = (c[v >> 2] | 0) + (c[z >> 2] | 0) | 0;
 aa = (c[x >> 2] | 0) + (c[C >> 2] | 0) | 0;
 $ = (c[E >> 2] | 0) + (c[F >> 2] | 0) | 0;
 Y = (c[P >> 2] | 0) + (c[D >> 2] | 0) | 0;
 c[a >> 2] = (c[b >> 2] | 0) + (c[V >> 2] | 0);
 ha = a + 4 | 0;
 c[ha >> 2] = ga;
 ga = a + 8 | 0;
 c[ga >> 2] = fa;
 fa = a + 12 | 0;
 c[fa >> 2] = ea;
 ea = a + 16 | 0;
 c[ea >> 2] = da;
 da = a + 20 | 0;
 c[da >> 2] = ca;
 ca = a + 24 | 0;
 c[ca >> 2] = ba;
 ba = a + 28 | 0;
 c[ba >> 2] = aa;
 aa = a + 32 | 0;
 c[aa >> 2] = $;
 $ = a + 36 | 0;
 c[$ >> 2] = Y;
 Y = a + 40 | 0;
 S = (c[k >> 2] | 0) - (c[S >> 2] | 0) | 0;
 Q = (c[n >> 2] | 0) - (c[Q >> 2] | 0) | 0;
 f = (c[q >> 2] | 0) - (c[f >> 2] | 0) | 0;
 m = (c[t >> 2] | 0) - (c[m >> 2] | 0) | 0;
 o = (c[w >> 2] | 0) - (c[o >> 2] | 0) | 0;
 v = (c[z >> 2] | 0) - (c[v >> 2] | 0) | 0;
 x = (c[C >> 2] | 0) - (c[x >> 2] | 0) | 0;
 E = (c[F >> 2] | 0) - (c[E >> 2] | 0) | 0;
 P = (c[D >> 2] | 0) - (c[P >> 2] | 0) | 0;
 c[Y >> 2] = (c[V >> 2] | 0) - (c[b >> 2] | 0);
 V = a + 44 | 0;
 c[V >> 2] = S;
 S = a + 48 | 0;
 c[S >> 2] = Q;
 Q = a + 52 | 0;
 c[Q >> 2] = f;
 f = a + 56 | 0;
 c[f >> 2] = m;
 m = a + 60 | 0;
 c[m >> 2] = o;
 o = a + 64 | 0;
 c[o >> 2] = v;
 v = a + 68 | 0;
 c[v >> 2] = x;
 x = a + 72 | 0;
 c[x >> 2] = E;
 E = a + 76 | 0;
 c[E >> 2] = P;
 P = a + 80 | 0;
 ec(P, a, d);
 ec(Y, Y, d + 40 | 0);
 D = a + 120 | 0;
 ec(D, d + 120 | 0, b + 120 | 0);
 ec(a, b + 80 | 0, d + 80 | 0);
 F = c[a >> 2] << 1;
 C = c[ha >> 2] << 1;
 z = c[ga >> 2] << 1;
 w = c[fa >> 2] << 1;
 t = c[ea >> 2] << 1;
 q = c[da >> 2] << 1;
 n = c[ca >> 2] << 1;
 k = c[ba >> 2] << 1;
 h = c[aa >> 2] << 1;
 e = c[$ >> 2] << 1;
 Z = c[P >> 2] | 0;
 O = a + 84 | 0;
 W = c[O >> 2] | 0;
 N = a + 88 | 0;
 T = c[N >> 2] | 0;
 M = a + 92 | 0;
 b = c[M >> 2] | 0;
 L = a + 96 | 0;
 g = c[L >> 2] | 0;
 K = a + 100 | 0;
 i = c[K >> 2] | 0;
 J = a + 104 | 0;
 p = c[J >> 2] | 0;
 I = a + 108 | 0;
 r = c[I >> 2] | 0;
 H = a + 112 | 0;
 y = c[H >> 2] | 0;
 G = a + 116 | 0;
 A = c[G >> 2] | 0;
 _ = c[Y >> 2] | 0;
 X = c[V >> 2] | 0;
 U = c[S >> 2] | 0;
 R = c[Q >> 2] | 0;
 d = c[f >> 2] | 0;
 j = c[m >> 2] | 0;
 l = c[o >> 2] | 0;
 s = c[v >> 2] | 0;
 u = c[x >> 2] | 0;
 B = c[E >> 2] | 0;
 c[a >> 2] = Z - _;
 c[ha >> 2] = W - X;
 c[ga >> 2] = T - U;
 c[fa >> 2] = b - R;
 c[ea >> 2] = g - d;
 c[da >> 2] = i - j;
 c[ca >> 2] = p - l;
 c[ba >> 2] = r - s;
 c[aa >> 2] = y - u;
 c[$ >> 2] = A - B;
 c[Y >> 2] = _ + Z;
 c[V >> 2] = X + W;
 c[S >> 2] = U + T;
 c[Q >> 2] = R + b;
 c[f >> 2] = d + g;
 c[m >> 2] = j + i;
 c[o >> 2] = l + p;
 c[v >> 2] = s + r;
 c[x >> 2] = u + y;
 c[E >> 2] = B + A;
 E = c[D >> 2] | 0;
 A = a + 124 | 0;
 B = c[A >> 2] | 0;
 x = a + 128 | 0;
 y = c[x >> 2] | 0;
 u = a + 132 | 0;
 v = c[u >> 2] | 0;
 r = a + 136 | 0;
 s = c[r >> 2] | 0;
 o = a + 140 | 0;
 p = c[o >> 2] | 0;
 l = a + 144 | 0;
 m = c[l >> 2] | 0;
 i = a + 148 | 0;
 j = c[i >> 2] | 0;
 f = a + 152 | 0;
 g = c[f >> 2] | 0;
 d = a + 156 | 0;
 b = c[d >> 2] | 0;
 c[P >> 2] = E + F;
 c[O >> 2] = B + C;
 c[N >> 2] = y + z;
 c[M >> 2] = v + w;
 c[L >> 2] = s + t;
 c[K >> 2] = p + q;
 c[J >> 2] = m + n;
 c[I >> 2] = j + k;
 c[H >> 2] = g + h;
 c[G >> 2] = b + e;
 c[D >> 2] = F - E;
 c[A >> 2] = C - B;
 c[x >> 2] = z - y;
 c[u >> 2] = w - v;
 c[r >> 2] = t - s;
 c[o >> 2] = q - p;
 c[l >> 2] = n - m;
 c[i >> 2] = k - j;
 c[f >> 2] = h - g;
 c[d >> 2] = e - b;
 return;
}

function Vc(b, d, e, f, g, h, i) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 var j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0;
 C = k;
 k = k + 2176 | 0;
 t = C + 1280 | 0;
 u = C + 1960 | 0;
 v = C + 1800 | 0;
 A = C + 1784 | 0;
 n = C + 1624 | 0;
 p = C;
 x = C + 2144 | 0;
 y = C + 2112 | 0;
 z = C + 2080 | 0;
 q = C + 1504 | 0;
 r = C + 1344 | 0;
 s = f + 4 | 0;
 j = (c[s >> 2] | 0) - (c[f >> 2] | 0) | 0;
 l = j >> 5;
 c[A >> 2] = 0;
 B = A + 4 | 0;
 c[B >> 2] = 0;
 m = A + 8 | 0;
 c[m >> 2] = 0;
 do if (j | 0) if (l >>> 0 > 67108863) Ze(A); else {
  o = He(j << 1) | 0;
  c[A >> 2] = o;
  o = o + (l << 6) | 0;
  c[m >> 2] = o;
  c[B >> 2] = o;
  break;
 } while (0);
 Fe(39860);
 o = k;
 k = k + ((1 * ((c[s >> 2] | 0) - (c[f >> 2] | 0) << 1 | 32) | 0) + 15 & -16) | 0;
 a : do if (!(qc(n, e) | 0)) {
  fc(p, n);
  Ec(x);
  e = o;
  j = d;
  l = e + 32 | 0;
  do {
   a[e >> 0] = a[j >> 0] | 0;
   e = e + 1 | 0;
   j = j + 1 | 0;
  } while ((e | 0) < (l | 0));
  do if ((c[s >> 2] | 0) == (c[f >> 2] | 0)) j = 32; else {
   n = o + 32 | 0;
   m = 0;
   while (1) {
    if ((m | 0) == (h | 0) & 0 == (i | 0)) {
     Qc(64, t);
     zc(t);
     e = y;
     j = t;
     l = e + 32 | 0;
     do {
      a[e >> 0] = a[j >> 0] | 0;
      e = e + 1 | 0;
      j = j + 1 | 0;
     } while ((e | 0) < (l | 0));
     vc(r, y);
     tc(n + (m << 6) | 0, r);
     Lc((c[f >> 2] | 0) + (m << 5) | 0, 32, t);
     Dc(u, t);
     Cc(v, u);
     kc(r, v);
     Ac(q, y, r);
     yc(n + (m << 6) + 32 | 0, q);
    } else {
     e = c[A >> 2] | 0;
     Qc(64, t);
     zc(t);
     e = e + (m << 6) | 0;
     j = t;
     l = e + 32 | 0;
     do {
      a[e >> 0] = a[j >> 0] | 0;
      e = e + 1 | 0;
      j = j + 1 | 0;
     } while ((e | 0) < (l | 0));
     e = (c[A >> 2] | 0) + (m << 6) + 32 | 0;
     Qc(64, t);
     zc(t);
     j = t;
     l = e + 32 | 0;
     do {
      a[e >> 0] = a[j >> 0] | 0;
      e = e + 1 | 0;
      j = j + 1 | 0;
     } while ((e | 0) < (l | 0));
     if (qc(r, (c[f >> 2] | 0) + (m << 5) | 0) | 0) break;
     d = c[A >> 2] | 0;
     lc(q, d + (m << 6) | 0, r, d + (m << 6) + 32 | 0);
     yc(n + (m << 6) | 0, q);
     Lc((c[f >> 2] | 0) + (m << 5) | 0, 32, t);
     Dc(u, t);
     Cc(v, u);
     kc(r, v);
     d = c[A >> 2] | 0;
     Bc(q, d + (m << 6) + 32 | 0, r, d + (m << 6) | 0, p);
     yc(n + (m << 6) + 32 | 0, q);
     Gc(x, x, (c[A >> 2] | 0) + (m << 6) | 0);
    }
    m = m + 1 | 0;
    j = (c[s >> 2] | 0) - (c[f >> 2] | 0) | 0;
    if (m >>> 0 >= j >> 5 >>> 0) {
     w = 24;
     break;
    }
   }
   if ((w | 0) == 24) {
    j = j << 1 | 32;
    break;
   }
   a[b >> 0] = 0;
   d = b + 4 | 0;
   c[d >> 2] = 0;
   o = b + 8 | 0;
   c[o >> 2] = 0;
   j = b + 12 | 0;
   c[j >> 2] = 0;
   n = c[A >> 2] | 0;
   l = (c[B >> 2] | 0) - n | 0;
   m = l >> 6;
   if (l | 0) {
    if (m >>> 0 > 67108863) Ze(d);
    e = He(l) | 0;
    c[o >> 2] = e;
    c[d >> 2] = e;
    c[j >> 2] = e + (m << 6);
    if ((l | 0) > 0) {
     ig(e | 0, n | 0, l | 0) | 0;
     c[o >> 2] = e + (l >>> 6 << 6);
    }
   }
   break a;
  } while (0);
  Lc(o, j, z);
  Fc(z);
  Hc((c[A >> 2] | 0) + (h << 6) | 0, z, x);
  d = c[A >> 2] | 0;
  Ic(d + (h << 6) + 32 | 0, d + (h << 6) | 0, g, y);
  a[b >> 0] = 1;
  d = b + 4 | 0;
  c[d >> 2] = 0;
  o = b + 8 | 0;
  c[o >> 2] = 0;
  j = b + 12 | 0;
  c[j >> 2] = 0;
  n = c[A >> 2] | 0;
  l = (c[B >> 2] | 0) - n | 0;
  m = l >> 6;
  if (l | 0) {
   if (m >>> 0 > 67108863) Ze(d);
   e = He(l) | 0;
   c[o >> 2] = e;
   c[d >> 2] = e;
   c[j >> 2] = e + (m << 6);
   if ((l | 0) > 0) {
    ig(e | 0, n | 0, l | 0) | 0;
    c[o >> 2] = e + (l >>> 6 << 6);
   }
  }
 } else {
  a[b >> 0] = 0;
  d = b + 4 | 0;
  c[d >> 2] = 0;
  o = b + 8 | 0;
  c[o >> 2] = 0;
  j = b + 12 | 0;
  c[j >> 2] = 0;
  n = c[A >> 2] | 0;
  l = (c[B >> 2] | 0) - n | 0;
  m = l >> 6;
  if (l | 0) {
   if (m >>> 0 > 67108863) Ze(d);
   e = He(l) | 0;
   c[o >> 2] = e;
   c[d >> 2] = e;
   c[j >> 2] = e + (m << 6);
   if ((l | 0) > 0) {
    ig(e | 0, n | 0, l | 0) | 0;
    c[o >> 2] = e + (l >>> 6 << 6);
   }
  }
 } while (0);
 Ge(39860);
 j = c[A >> 2] | 0;
 if (!j) {
  k = C;
  return;
 }
 c[B >> 2] = j;
 Ie(j);
 k = C;
 return;
}

function Jc(a) {
 a = a | 0;
 var b = 0, c = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0;
 b = d[a >> 0] | 0;
 O = gg(d[a + 1 >> 0] | 0 | 0, 0, 8) | 0;
 N = U() | 0;
 M = gg(d[a + 2 >> 0] | 0 | 0, 0, 16) | 0;
 N = N | (U() | 0);
 H = gg(d[a + 3 >> 0] | 0 | 0, 0, 24) | 0;
 N = N | (U() | 0);
 I = d[a + 4 >> 0] | 0;
 L = gg(d[a + 5 >> 0] | 0 | 0, 0, 8) | 0;
 K = U() | 0;
 J = gg(d[a + 6 >> 0] | 0 | 0, 0, 16) | 0;
 K = K | (U() | 0);
 C = gg(d[a + 7 >> 0] | 0 | 0, 0, 24) | 0;
 K = K | (U() | 0);
 D = d[a + 8 >> 0] | 0;
 G = gg(d[a + 9 >> 0] | 0 | 0, 0, 8) | 0;
 F = U() | 0;
 E = gg(d[a + 10 >> 0] | 0 | 0, 0, 16) | 0;
 F = F | (U() | 0);
 x = gg(d[a + 11 >> 0] | 0 | 0, 0, 24) | 0;
 F = F | (U() | 0);
 y = d[a + 12 >> 0] | 0;
 B = gg(d[a + 13 >> 0] | 0 | 0, 0, 8) | 0;
 A = U() | 0;
 z = gg(d[a + 14 >> 0] | 0 | 0, 0, 16) | 0;
 A = A | (U() | 0);
 s = gg(d[a + 15 >> 0] | 0 | 0, 0, 24) | 0;
 A = A | (U() | 0);
 v = d[a + 16 >> 0] | 0;
 w = gg(d[a + 17 >> 0] | 0 | 0, 0, 8) | 0;
 n = U() | 0;
 u = gg(d[a + 18 >> 0] | 0 | 0, 0, 16) | 0;
 n = n | (U() | 0);
 t = gg(d[a + 19 >> 0] | 0 | 0, 0, 24) | 0;
 n = n | (U() | 0);
 q = d[a + 20 >> 0] | 0;
 r = gg(d[a + 21 >> 0] | 0 | 0, 0, 8) | 0;
 i = U() | 0;
 p = gg(d[a + 22 >> 0] | 0 | 0, 0, 16) | 0;
 i = i | (U() | 0);
 o = gg(d[a + 23 >> 0] | 0 | 0, 0, 24) | 0;
 i = i | (U() | 0);
 l = d[a + 24 >> 0] | 0;
 m = gg(d[a + 25 >> 0] | 0 | 0, 0, 8) | 0;
 c = U() | 0;
 k = gg(d[a + 26 >> 0] | 0 | 0, 0, 16) | 0;
 c = c | (U() | 0);
 j = gg(d[a + 27 >> 0] | 0 | 0, 0, 24) | 0;
 c = c | (U() | 0);
 e = d[a + 28 >> 0] | 0;
 h = gg(d[a + 29 >> 0] | 0 | 0, 0, 8) | 0;
 g = U() | 0;
 f = gg(d[a + 30 >> 0] | 0 | 0, 0, 16) | 0;
 g = g | (U() | 0);
 a = gg(d[a + 31 >> 0] | 0 | 0, 0, 24) | 0;
 g = g | (U() | 0);
 N = ag(1559614444, 0, O | b | M | H | 0, N | 0) | 0;
 H = U() | 0;
 M = eg(N | 0, H | 0, 63) | 0;
 b = U() | 0;
 H = ag(0, 0, N | 0, H | 0) | 0;
 H = fg(H | 0, U() | 0, 63) | 0;
 H = $f(M | 0, b | 0, H | 0, U() | 0) | 0;
 b = U() | 0;
 K = ag(1477600026, 0, L | I | J | C | 0, K | 0) | 0;
 C = U() | 0;
 J = eg(K | 0, C | 0, 63) | 0;
 I = U() | 0;
 C = ag(0, 0, K | 0, C | 0) | 0;
 C = eg(C | 0, U() | 0, 63) | 0;
 C = ag(J | 0, I | 0, C | 0, U() | 0) | 0;
 C = gg(C | 0, U() | 0, 1) | 0;
 C = $f(H | 0, b | 0, C | 0, U() | 0) | 0;
 b = U() | 0;
 F = ag(-1560830762, 0, G | D | E | x | 0, F | 0) | 0;
 x = U() | 0;
 E = eg(F | 0, x | 0, 63) | 0;
 D = U() | 0;
 x = ag(0, 0, F | 0, x | 0) | 0;
 x = eg(x | 0, U() | 0, 63) | 0;
 x = ag(E | 0, D | 0, x | 0, U() | 0) | 0;
 x = gg(x | 0, U() | 0, 2) | 0;
 x = $f(C | 0, b | 0, x | 0, U() | 0) | 0;
 b = U() | 0;
 A = ag(350157278, 0, B | y | z | s | 0, A | 0) | 0;
 s = U() | 0;
 z = eg(A | 0, s | 0, 63) | 0;
 y = U() | 0;
 s = ag(0, 0, A | 0, s | 0) | 0;
 s = eg(s | 0, U() | 0, 63) | 0;
 s = ag(z | 0, y | 0, s | 0, U() | 0) | 0;
 s = gg(s | 0, U() | 0, 3) | 0;
 s = $f(x | 0, b | 0, s | 0, U() | 0) | 0;
 b = U() | 0;
 n = ag(0, 0, w | v | u | t | 0, n | 0) | 0;
 n = eg(n | 0, U() | 0, 63) | 0;
 n = gg(n | 0, U() | 0, 4) | 0;
 n = $f(s | 0, b | 0, n | 0, U() | 0) | 0;
 b = U() | 0;
 i = ag(0, 0, r | q | p | o | 0, i | 0) | 0;
 i = eg(i | 0, U() | 0, 63) | 0;
 i = gg(i | 0, U() | 0, 5) | 0;
 i = $f(n | 0, b | 0, i | 0, U() | 0) | 0;
 b = U() | 0;
 c = ag(0, 0, m | l | k | j | 0, c | 0) | 0;
 c = eg(c | 0, U() | 0, 63) | 0;
 c = gg(c | 0, U() | 0, 6) | 0;
 c = $f(i | 0, b | 0, c | 0, U() | 0) | 0;
 b = U() | 0;
 g = ag(268435456, 0, h | e | f | a | 0, g | 0) | 0;
 a = U() | 0;
 f = eg(g | 0, a | 0, 63) | 0;
 e = U() | 0;
 a = ag(0, 0, g | 0, a | 0) | 0;
 a = eg(a | 0, U() | 0, 63) | 0;
 a = ag(f | 0, e | 0, a | 0, U() | 0) | 0;
 a = gg(a | 0, U() | 0, 7) | 0;
 a = $f(c | 0, b | 0, a | 0, U() | 0) | 0;
 a = fg(a | 0, U() | 0, 8) | 0;
 U() | 0;
 return a | 0;
}

function hc(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0;
 d = k;
 k = k + 48 | 0;
 I = d;
 ic(a, b);
 S = a + 80 | 0;
 ja = b + 40 | 0;
 ic(S, ja);
 v = a + 120 | 0;
 jc(v, b + 80 | 0);
 ka = a + 40 | 0;
 ia = (c[b + 44 >> 2] | 0) + (c[b + 4 >> 2] | 0) | 0;
 ha = (c[b + 48 >> 2] | 0) + (c[b + 8 >> 2] | 0) | 0;
 ga = (c[b + 52 >> 2] | 0) + (c[b + 12 >> 2] | 0) | 0;
 fa = (c[b + 56 >> 2] | 0) + (c[b + 16 >> 2] | 0) | 0;
 ea = (c[b + 60 >> 2] | 0) + (c[b + 20 >> 2] | 0) | 0;
 da = (c[b + 64 >> 2] | 0) + (c[b + 24 >> 2] | 0) | 0;
 ca = (c[b + 68 >> 2] | 0) + (c[b + 28 >> 2] | 0) | 0;
 ba = (c[b + 72 >> 2] | 0) + (c[b + 32 >> 2] | 0) | 0;
 aa = (c[b + 76 >> 2] | 0) + (c[b + 36 >> 2] | 0) | 0;
 c[ka >> 2] = (c[ja >> 2] | 0) + (c[b >> 2] | 0);
 ja = a + 44 | 0;
 c[ja >> 2] = ia;
 ia = a + 48 | 0;
 c[ia >> 2] = ha;
 ha = a + 52 | 0;
 c[ha >> 2] = ga;
 ga = a + 56 | 0;
 c[ga >> 2] = fa;
 fa = a + 60 | 0;
 c[fa >> 2] = ea;
 ea = a + 64 | 0;
 c[ea >> 2] = da;
 da = a + 68 | 0;
 c[da >> 2] = ca;
 ca = a + 72 | 0;
 c[ca >> 2] = ba;
 ba = a + 76 | 0;
 c[ba >> 2] = aa;
 ic(I, ka);
 aa = c[S >> 2] | 0;
 R = a + 84 | 0;
 $ = c[R >> 2] | 0;
 Q = a + 88 | 0;
 _ = c[Q >> 2] | 0;
 P = a + 92 | 0;
 Z = c[P >> 2] | 0;
 O = a + 96 | 0;
 Y = c[O >> 2] | 0;
 N = a + 100 | 0;
 X = c[N >> 2] | 0;
 M = a + 104 | 0;
 W = c[M >> 2] | 0;
 L = a + 108 | 0;
 V = c[L >> 2] | 0;
 K = a + 112 | 0;
 U = c[K >> 2] | 0;
 J = a + 116 | 0;
 T = c[J >> 2] | 0;
 w = c[a >> 2] | 0;
 F = a + 4 | 0;
 u = c[F >> 2] | 0;
 D = a + 8 | 0;
 s = c[D >> 2] | 0;
 B = a + 12 | 0;
 q = c[B >> 2] | 0;
 z = a + 16 | 0;
 o = c[z >> 2] | 0;
 b = a + 20 | 0;
 m = c[b >> 2] | 0;
 g = a + 24 | 0;
 j = c[g >> 2] | 0;
 l = a + 28 | 0;
 h = c[l >> 2] | 0;
 p = a + 32 | 0;
 f = c[p >> 2] | 0;
 t = a + 36 | 0;
 x = c[t >> 2] | 0;
 H = w + aa | 0;
 G = u + $ | 0;
 E = s + _ | 0;
 C = q + Z | 0;
 A = o + Y | 0;
 y = m + X | 0;
 e = j + W | 0;
 i = h + V | 0;
 n = f + U | 0;
 r = x + T | 0;
 c[ka >> 2] = H;
 c[ja >> 2] = G;
 c[ia >> 2] = E;
 c[ha >> 2] = C;
 c[ga >> 2] = A;
 c[fa >> 2] = y;
 c[ea >> 2] = e;
 c[da >> 2] = i;
 c[ca >> 2] = n;
 c[ba >> 2] = r;
 w = aa - w | 0;
 u = $ - u | 0;
 s = _ - s | 0;
 q = Z - q | 0;
 o = Y - o | 0;
 m = X - m | 0;
 j = W - j | 0;
 h = V - h | 0;
 f = U - f | 0;
 x = T - x | 0;
 c[S >> 2] = w;
 c[R >> 2] = u;
 c[Q >> 2] = s;
 c[P >> 2] = q;
 c[O >> 2] = o;
 c[N >> 2] = m;
 c[M >> 2] = j;
 c[L >> 2] = h;
 c[K >> 2] = f;
 c[J >> 2] = x;
 G = (c[I + 4 >> 2] | 0) - G | 0;
 E = (c[I + 8 >> 2] | 0) - E | 0;
 C = (c[I + 12 >> 2] | 0) - C | 0;
 A = (c[I + 16 >> 2] | 0) - A | 0;
 y = (c[I + 20 >> 2] | 0) - y | 0;
 e = (c[I + 24 >> 2] | 0) - e | 0;
 i = (c[I + 28 >> 2] | 0) - i | 0;
 n = (c[I + 32 >> 2] | 0) - n | 0;
 r = (c[I + 36 >> 2] | 0) - r | 0;
 c[a >> 2] = (c[I >> 2] | 0) - H;
 c[F >> 2] = G;
 c[D >> 2] = E;
 c[B >> 2] = C;
 c[z >> 2] = A;
 c[b >> 2] = y;
 c[g >> 2] = e;
 c[l >> 2] = i;
 c[p >> 2] = n;
 c[t >> 2] = r;
 t = a + 124 | 0;
 r = a + 128 | 0;
 p = a + 132 | 0;
 n = a + 136 | 0;
 l = a + 140 | 0;
 i = a + 144 | 0;
 g = a + 148 | 0;
 e = a + 152 | 0;
 b = a + 156 | 0;
 u = (c[t >> 2] | 0) - u | 0;
 s = (c[r >> 2] | 0) - s | 0;
 q = (c[p >> 2] | 0) - q | 0;
 o = (c[n >> 2] | 0) - o | 0;
 m = (c[l >> 2] | 0) - m | 0;
 j = (c[i >> 2] | 0) - j | 0;
 h = (c[g >> 2] | 0) - h | 0;
 f = (c[e >> 2] | 0) - f | 0;
 a = (c[b >> 2] | 0) - x | 0;
 c[v >> 2] = (c[v >> 2] | 0) - w;
 c[t >> 2] = u;
 c[r >> 2] = s;
 c[p >> 2] = q;
 c[n >> 2] = o;
 c[l >> 2] = m;
 c[i >> 2] = j;
 c[g >> 2] = h;
 c[e >> 2] = f;
 c[b >> 2] = a;
 k = d;
 return;
}

function mc(b, c) {
 b = b | 0;
 c = c | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 e = 0;
 do {
  a[b + e >> 0] = (d[c + (e >>> 3) >> 0] | 0) >>> (e & 7) & 1;
  e = e + 1 | 0;
 } while ((e | 0) != 256);
 k = 0;
 do {
  j = b + k | 0;
  e = a[j >> 0] | 0;
  i = k;
  k = k + 1 | 0;
  a : do if (e << 24 >> 24 != 0 & k >>> 0 < 256) {
   g = b + k | 0;
   c = a[g >> 0] | 0;
   b : do if (c << 24 >> 24) {
    f = e << 24 >> 24;
    e = c << 24 >> 24 << 1;
    c = e + f | 0;
    if ((c | 0) < 16) {
     a[j >> 0] = c;
     a[g >> 0] = 0;
     break;
    }
    e = f - e | 0;
    if ((e | 0) <= -16) break a;
    a[j >> 0] = e;
    e = k;
    while (1) {
     c = b + e | 0;
     if (!(a[c >> 0] | 0)) break;
     a[c >> 0] = 0;
     if (e >>> 0 < 255) e = e + 1 | 0; else break b;
    }
    a[c >> 0] = 1;
   } while (0);
   e = i + 2 | 0;
   if (e >>> 0 < 256) {
    g = b + e | 0;
    c = a[g >> 0] | 0;
    c : do if (c << 24 >> 24) {
     h = a[j >> 0] | 0;
     c = c << 24 >> 24 << 2;
     f = c + h | 0;
     if ((f | 0) < 16) {
      a[j >> 0] = f;
      a[g >> 0] = 0;
      break;
     }
     c = h - c | 0;
     if ((c | 0) <= -16) break a;
     a[j >> 0] = c;
     while (1) {
      c = b + e | 0;
      if (!(a[c >> 0] | 0)) break;
      a[c >> 0] = 0;
      if (e >>> 0 < 255) e = e + 1 | 0; else break c;
     }
     a[c >> 0] = 1;
    } while (0);
    e = i + 3 | 0;
    if (e >>> 0 < 256) {
     g = b + e | 0;
     c = a[g >> 0] | 0;
     d : do if (c << 24 >> 24) {
      h = a[j >> 0] | 0;
      c = c << 24 >> 24 << 3;
      f = c + h | 0;
      if ((f | 0) < 16) {
       a[j >> 0] = f;
       a[g >> 0] = 0;
       break;
      }
      c = h - c | 0;
      if ((c | 0) <= -16) break a;
      a[j >> 0] = c;
      while (1) {
       c = b + e | 0;
       if (!(a[c >> 0] | 0)) break;
       a[c >> 0] = 0;
       if (e >>> 0 < 255) e = e + 1 | 0; else break d;
      }
      a[c >> 0] = 1;
     } while (0);
     e = i + 4 | 0;
     if (e >>> 0 < 256) {
      g = b + e | 0;
      c = a[g >> 0] | 0;
      e : do if (c << 24 >> 24) {
       h = a[j >> 0] | 0;
       c = c << 24 >> 24 << 4;
       f = c + h | 0;
       if ((f | 0) < 16) {
        a[j >> 0] = f;
        a[g >> 0] = 0;
        break;
       }
       c = h - c | 0;
       if ((c | 0) <= -16) break a;
       a[j >> 0] = c;
       while (1) {
        c = b + e | 0;
        if (!(a[c >> 0] | 0)) break;
        a[c >> 0] = 0;
        if (e >>> 0 < 255) e = e + 1 | 0; else break e;
       }
       a[c >> 0] = 1;
      } while (0);
      e = i + 5 | 0;
      if (e >>> 0 < 256) {
       g = b + e | 0;
       c = a[g >> 0] | 0;
       f : do if (c << 24 >> 24) {
        h = a[j >> 0] | 0;
        c = c << 24 >> 24 << 5;
        f = c + h | 0;
        if ((f | 0) < 16) {
         a[j >> 0] = f;
         a[g >> 0] = 0;
         break;
        }
        c = h - c | 0;
        if ((c | 0) <= -16) break a;
        a[j >> 0] = c;
        while (1) {
         c = b + e | 0;
         if (!(a[c >> 0] | 0)) break;
         a[c >> 0] = 0;
         if (e >>> 0 < 255) e = e + 1 | 0; else break f;
        }
        a[c >> 0] = 1;
       } while (0);
       e = i + 6 | 0;
       if (e >>> 0 < 256) {
        g = b + e | 0;
        c = a[g >> 0] | 0;
        if (c << 24 >> 24) {
         h = a[j >> 0] | 0;
         c = c << 24 >> 24 << 6;
         f = c + h | 0;
         if ((f | 0) < 16) {
          a[j >> 0] = f;
          a[g >> 0] = 0;
          break;
         }
         c = h - c | 0;
         if ((c | 0) > -16) {
          a[j >> 0] = c;
          while (1) {
           c = b + e | 0;
           if (!(a[c >> 0] | 0)) break;
           a[c >> 0] = 0;
           if (e >>> 0 < 255) e = e + 1 | 0; else break a;
          }
          a[c >> 0] = 1;
         }
        }
       }
      }
     }
    }
   }
  } while (0);
 } while ((k | 0) != 256);
 return;
}
function cg(a, b, d, e, f) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
 l = a;
 j = b;
 k = j;
 h = d;
 n = e;
 i = n;
 if (!k) {
  g = (f | 0) != 0;
  if (!i) {
   if (g) {
    c[f >> 2] = (l >>> 0) % (h >>> 0);
    c[f + 4 >> 2] = 0;
   }
   n = 0;
   f = (l >>> 0) / (h >>> 0) >>> 0;
   return (T(n | 0), f) | 0;
  } else {
   if (!g) {
    n = 0;
    f = 0;
    return (T(n | 0), f) | 0;
   }
   c[f >> 2] = a | 0;
   c[f + 4 >> 2] = b & 0;
   n = 0;
   f = 0;
   return (T(n | 0), f) | 0;
  }
 }
 g = (i | 0) == 0;
 do if (!h) {
  if (g) {
   if (f | 0) {
    c[f >> 2] = (k >>> 0) % (h >>> 0);
    c[f + 4 >> 2] = 0;
   }
   n = 0;
   f = (k >>> 0) / (h >>> 0) >>> 0;
   return (T(n | 0), f) | 0;
  }
  if (!l) {
   if (f | 0) {
    c[f >> 2] = 0;
    c[f + 4 >> 2] = (k >>> 0) % (i >>> 0);
   }
   n = 0;
   f = (k >>> 0) / (i >>> 0) >>> 0;
   return (T(n | 0), f) | 0;
  }
  g = i - 1 | 0;
  if (!(g & i)) {
   if (f | 0) {
    c[f >> 2] = a | 0;
    c[f + 4 >> 2] = g & k | b & 0;
   }
   n = 0;
   f = k >>> ((bg(i | 0) | 0) >>> 0);
   return (T(n | 0), f) | 0;
  }
  g = (O(i | 0) | 0) - (O(k | 0) | 0) | 0;
  if (g >>> 0 <= 30) {
   b = g + 1 | 0;
   i = 31 - g | 0;
   h = b;
   a = k << i | l >>> (b >>> 0);
   b = k >>> (b >>> 0);
   g = 0;
   i = l << i;
   break;
  }
  if (!f) {
   n = 0;
   f = 0;
   return (T(n | 0), f) | 0;
  }
  c[f >> 2] = a | 0;
  c[f + 4 >> 2] = j | b & 0;
  n = 0;
  f = 0;
  return (T(n | 0), f) | 0;
 } else {
  if (!g) {
   g = (O(i | 0) | 0) - (O(k | 0) | 0) | 0;
   if (g >>> 0 <= 31) {
    m = g + 1 | 0;
    i = 31 - g | 0;
    b = g - 31 >> 31;
    h = m;
    a = l >>> (m >>> 0) & b | k << i;
    b = k >>> (m >>> 0) & b;
    g = 0;
    i = l << i;
    break;
   }
   if (!f) {
    n = 0;
    f = 0;
    return (T(n | 0), f) | 0;
   }
   c[f >> 2] = a | 0;
   c[f + 4 >> 2] = j | b & 0;
   n = 0;
   f = 0;
   return (T(n | 0), f) | 0;
  }
  g = h - 1 | 0;
  if (g & h | 0) {
   i = (O(h | 0) | 0) + 33 - (O(k | 0) | 0) | 0;
   p = 64 - i | 0;
   m = 32 - i | 0;
   j = m >> 31;
   o = i - 32 | 0;
   b = o >> 31;
   h = i;
   a = m - 1 >> 31 & k >>> (o >>> 0) | (k << m | l >>> (i >>> 0)) & b;
   b = b & k >>> (i >>> 0);
   g = l << p & j;
   i = (k << p | l >>> (o >>> 0)) & j | l << m & i - 33 >> 31;
   break;
  }
  if (f | 0) {
   c[f >> 2] = g & l;
   c[f + 4 >> 2] = 0;
  }
  if ((h | 0) == 1) {
   o = j | b & 0;
   p = a | 0 | 0;
   return (T(o | 0), p) | 0;
  } else {
   p = bg(h | 0) | 0;
   o = k >>> (p >>> 0) | 0;
   p = k << 32 - p | l >>> (p >>> 0) | 0;
   return (T(o | 0), p) | 0;
  }
 } while (0);
 if (!h) {
  k = i;
  j = 0;
  i = 0;
 } else {
  m = d | 0 | 0;
  l = n | e & 0;
  k = $f(m | 0, l | 0, -1, -1) | 0;
  d = U() | 0;
  j = i;
  i = 0;
  do {
   e = j;
   j = g >>> 31 | j << 1;
   g = i | g << 1;
   e = a << 1 | e >>> 31 | 0;
   n = a >>> 31 | b << 1 | 0;
   ag(k | 0, d | 0, e | 0, n | 0) | 0;
   p = U() | 0;
   o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;
   i = o & 1;
   a = ag(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;
   b = U() | 0;
   h = h - 1 | 0;
  } while ((h | 0) != 0);
  k = j;
  j = 0;
 }
 h = 0;
 if (f | 0) {
  c[f >> 2] = a;
  c[f + 4 >> 2] = b;
 }
 o = (g | 0) >>> 31 | (k | h) << 1 | (h << 1 | g >>> 31) & 0 | j;
 p = (g << 1 | 0 >>> 31) & -2 | i;
 return (T(o | 0), p) | 0;
}

function bd(b, d, e, f, g, h) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 var i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0;
 D = k;
 k = k + 336 | 0;
 x = D;
 w = D + 104 | 0;
 q = D + 296 | 0;
 l = D + 264 | 0;
 m = D + 200 | 0;
 C = D + 92 | 0;
 u = D + 136 | 0;
 B = D + 64 | 0;
 r = D + 232 | 0;
 s = D + 168 | 0;
 t = D + 80 | 0;
 c[b >> 2] = 0;
 y = b + 4 | 0;
 c[y >> 2] = 0;
 z = b + 8 | 0;
 c[z >> 2] = 0;
 o = l;
 p = o + 32 | 0;
 do {
  a[o >> 0] = 0;
  o = o + 1 | 0;
 } while ((o | 0) < (p | 0));
 Wc(d, l, 32, 0, x) | 0;
 Wc(e, m, 32, 0, x) | 0;
 c[C >> 2] = 0;
 A = C + 4 | 0;
 c[A >> 2] = 0;
 i = C + 8 | 0;
 c[i >> 2] = 0;
 j = f + 4 | 0;
 d = c[f >> 2] | 0;
 if ((c[j >> 2] | 0) != (d | 0)) {
  e = 0;
  do {
   Wc(d + (e * 12 | 0) | 0, w, 32, 0, x) | 0;
   d = c[A >> 2] | 0;
   if ((d | 0) == (c[i >> 2] | 0)) Fd(C, w); else {
    o = d;
    n = w;
    p = o + 32 | 0;
    do {
     a[o >> 0] = a[n >> 0] | 0;
     o = o + 1 | 0;
     n = n + 1 | 0;
    } while ((o | 0) < (p | 0));
    c[A >> 2] = d + 32;
   }
   e = e + 1 | 0;
   d = c[f >> 2] | 0;
  } while (e >>> 0 < (((c[j >> 2] | 0) - d | 0) / 12 | 0) >>> 0);
 }
 Wc(g, u, 32, 0, x) | 0;
 o = r;
 n = l;
 p = o + 32 | 0;
 do {
  a[o >> 0] = a[n >> 0] | 0;
  o = o + 1 | 0;
  n = n + 1 | 0;
 } while ((o | 0) < (p | 0));
 o = s;
 n = m;
 p = o + 32 | 0;
 do {
  a[o >> 0] = a[n >> 0] | 0;
  o = o + 1 | 0;
  n = n + 1 | 0;
 } while ((o | 0) < (p | 0));
 c[t >> 2] = 0;
 g = t + 4 | 0;
 c[g >> 2] = 0;
 d = t + 8 | 0;
 c[d >> 2] = 0;
 j = c[C >> 2] | 0;
 e = (c[A >> 2] | 0) - j | 0;
 i = e >> 5;
 if (e | 0) {
  if (i >>> 0 > 134217727) Ze(t);
  f = He(e) | 0;
  c[g >> 2] = f;
  c[t >> 2] = f;
  c[d >> 2] = f + (i << 5);
  if ((e | 0) > 0) {
   ig(f | 0, j | 0, e | 0) | 0;
   c[g >> 2] = f + (e >>> 5 << 5);
  }
 }
 o = q;
 n = r;
 p = o + 32 | 0;
 do {
  a[o >> 0] = a[n >> 0] | 0;
  o = o + 1 | 0;
  n = n + 1 | 0;
 } while ((o | 0) < (p | 0));
 o = w;
 n = s;
 p = o + 32 | 0;
 do {
  a[o >> 0] = a[n >> 0] | 0;
  o = o + 1 | 0;
  n = n + 1 | 0;
 } while ((o | 0) < (p | 0));
 o = x;
 n = u;
 p = o + 32 | 0;
 do {
  a[o >> 0] = a[n >> 0] | 0;
  o = o + 1 | 0;
  n = n + 1 | 0;
 } while ((o | 0) < (p | 0));
 Vc(B, q, w, t, x, h, 0);
 d = c[t >> 2] | 0;
 if (d | 0) {
  c[g >> 2] = d;
  Ie(d);
 }
 j = B + 4 | 0;
 if (!(a[B >> 0] | 0)) v = 22; else {
  d = c[j >> 2] | 0;
  f = c[B + 8 >> 2] | 0;
  if ((d | 0) != (f | 0)) {
   i = w + 11 | 0;
   do {
    o = x;
    n = d;
    p = o + 64 | 0;
    do {
     a[o >> 0] = a[n >> 0] | 0;
     o = o + 1 | 0;
     n = n + 1 | 0;
    } while ((o | 0) < (p | 0));
    Yc(w, x, 64, 0);
    e = c[y >> 2] | 0;
    if (e >>> 0 < (c[z >> 2] | 0) >>> 0) {
     c[e >> 2] = c[w >> 2];
     c[e + 4 >> 2] = c[w + 4 >> 2];
     c[e + 8 >> 2] = c[w + 8 >> 2];
     c[w >> 2] = 0;
     c[w + 4 >> 2] = 0;
     c[w + 8 >> 2] = 0;
     c[y >> 2] = (c[y >> 2] | 0) + 12;
    } else {
     Gd(b, w);
     if ((a[i >> 0] | 0) < 0) Ie(c[w >> 2] | 0);
    }
    d = d + 64 | 0;
   } while ((d | 0) != (f | 0));
   v = 22;
  }
 }
 if ((v | 0) == 22) d = c[j >> 2] | 0;
 if (d | 0) {
  c[B + 8 >> 2] = d;
  Ie(d);
 }
 d = c[C >> 2] | 0;
 if (!d) {
  k = D;
  return;
 }
 c[A >> 2] = d;
 Ie(d);
 k = D;
 return;
}

function wc(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0;
 m = k;
 k = k + 128 | 0;
 l = m;
 e = d << 24 >> 24;
 h = (d & 255) >>> 7 & 255;
 d = e - ((0 - h & e) << 1) | 0;
 c[a >> 2] = 1;
 e = a + 4 | 0;
 i = e;
 j = i + 36 | 0;
 do {
  c[i >> 2] = 0;
  i = i + 4 | 0;
 } while ((i | 0) < (j | 0));
 f = a + 40 | 0;
 c[f >> 2] = 1;
 g = a + 44 | 0;
 i = g;
 j = i + 76 | 0;
 do {
  c[i >> 2] = 0;
  i = i + 4 | 0;
 } while ((i | 0) < (j | 0));
 s = d & 255;
 r = ((s ^ 1) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) | 0, r);
 xc(f, 160 + (b * 960 | 0) + 40 | 0, r);
 j = a + 80 | 0;
 xc(j, 160 + (b * 960 | 0) + 80 | 0, r);
 r = ((s ^ 2) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 120 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 160 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 200 | 0, r);
 r = ((s ^ 3) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 240 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 280 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 320 | 0, r);
 r = ((s ^ 4) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 360 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 400 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 440 | 0, r);
 r = ((s ^ 5) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 480 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 520 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 560 | 0, r);
 r = ((s ^ 6) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 600 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 640 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 680 | 0, r);
 r = ((s ^ 7) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 720 | 0, r);
 xc(f, 160 + (b * 960 | 0) + 760 | 0, r);
 xc(j, 160 + (b * 960 | 0) + 800 | 0, r);
 s = ((s ^ 8) + -1 | 0) >>> 31;
 xc(a, 160 + (b * 960 | 0) + 840 | 0, s);
 xc(f, 160 + (b * 960 | 0) + 880 | 0, s);
 xc(j, 160 + (b * 960 | 0) + 920 | 0, s);
 b = c[g >> 2] | 0;
 s = c[a + 48 >> 2] | 0;
 r = c[a + 52 >> 2] | 0;
 q = c[a + 56 >> 2] | 0;
 p = c[a + 60 >> 2] | 0;
 o = c[a + 64 >> 2] | 0;
 n = c[a + 68 >> 2] | 0;
 d = c[a + 72 >> 2] | 0;
 i = c[a + 76 >> 2] | 0;
 c[l >> 2] = c[f >> 2];
 c[l + 4 >> 2] = b;
 c[l + 8 >> 2] = s;
 c[l + 12 >> 2] = r;
 c[l + 16 >> 2] = q;
 c[l + 20 >> 2] = p;
 c[l + 24 >> 2] = o;
 c[l + 28 >> 2] = n;
 c[l + 32 >> 2] = d;
 c[l + 36 >> 2] = i;
 i = l + 40 | 0;
 e = c[e >> 2] | 0;
 d = c[a + 8 >> 2] | 0;
 n = c[a + 12 >> 2] | 0;
 o = c[a + 16 >> 2] | 0;
 p = c[a + 20 >> 2] | 0;
 q = c[a + 24 >> 2] | 0;
 r = c[a + 28 >> 2] | 0;
 s = c[a + 32 >> 2] | 0;
 b = c[a + 36 >> 2] | 0;
 c[i >> 2] = c[a >> 2];
 c[l + 44 >> 2] = e;
 c[l + 48 >> 2] = d;
 c[l + 52 >> 2] = n;
 c[l + 56 >> 2] = o;
 c[l + 60 >> 2] = p;
 c[l + 64 >> 2] = q;
 c[l + 68 >> 2] = r;
 c[l + 72 >> 2] = s;
 c[l + 76 >> 2] = b;
 b = l + 80 | 0;
 s = 0 - (c[a + 84 >> 2] | 0) | 0;
 r = 0 - (c[a + 88 >> 2] | 0) | 0;
 q = 0 - (c[a + 92 >> 2] | 0) | 0;
 p = 0 - (c[a + 96 >> 2] | 0) | 0;
 o = 0 - (c[a + 100 >> 2] | 0) | 0;
 n = 0 - (c[a + 104 >> 2] | 0) | 0;
 d = 0 - (c[a + 108 >> 2] | 0) | 0;
 e = 0 - (c[a + 112 >> 2] | 0) | 0;
 g = 0 - (c[a + 116 >> 2] | 0) | 0;
 c[b >> 2] = 0 - (c[j >> 2] | 0);
 c[l + 84 >> 2] = s;
 c[l + 88 >> 2] = r;
 c[l + 92 >> 2] = q;
 c[l + 96 >> 2] = p;
 c[l + 100 >> 2] = o;
 c[l + 104 >> 2] = n;
 c[l + 108 >> 2] = d;
 c[l + 112 >> 2] = e;
 c[l + 116 >> 2] = g;
 xc(a, l, h);
 xc(f, i, h);
 xc(j, b, h);
 k = m;
 return;
}

function Rf(b, d, e, f, g) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
 a : do if (kf(b, c[d + 8 >> 2] | 0, g) | 0) mf(0, d, e, f); else {
  if (!(kf(b, c[d >> 2] | 0, g) | 0)) {
   q = c[b + 12 >> 2] | 0;
   k = b + 16 + (q << 3) | 0;
   Vf(b + 16 | 0, d, e, f, g);
   h = b + 24 | 0;
   if ((q | 0) <= 1) break;
   b = c[b + 8 >> 2] | 0;
   if (!(b & 2)) {
    j = d + 36 | 0;
    if ((c[j >> 2] | 0) != 1) {
     if (!(b & 1)) {
      b = d + 54 | 0;
      while (1) {
       if (a[b >> 0] | 0) break a;
       if ((c[j >> 2] | 0) == 1) break a;
       Vf(h, d, e, f, g);
       h = h + 8 | 0;
       if (h >>> 0 >= k >>> 0) break a;
      }
     }
     b = d + 24 | 0;
     i = d + 54 | 0;
     while (1) {
      if (a[i >> 0] | 0) break a;
      if ((c[j >> 2] | 0) == 1) if ((c[b >> 2] | 0) == 1) break a;
      Vf(h, d, e, f, g);
      h = h + 8 | 0;
      if (h >>> 0 >= k >>> 0) break a;
     }
    }
   }
   b = d + 54 | 0;
   while (1) {
    if (a[b >> 0] | 0) break a;
    Vf(h, d, e, f, g);
    h = h + 8 | 0;
    if (h >>> 0 >= k >>> 0) break a;
   }
  }
  if ((c[d + 16 >> 2] | 0) != (e | 0)) {
   p = d + 20 | 0;
   if ((c[p >> 2] | 0) != (e | 0)) {
    c[d + 32 >> 2] = f;
    q = d + 44 | 0;
    if ((c[q >> 2] | 0) == 4) break;
    k = b + 16 + (c[b + 12 >> 2] << 3) | 0;
    f = d + 52 | 0;
    l = d + 53 | 0;
    n = d + 54 | 0;
    m = b + 8 | 0;
    o = d + 24 | 0;
    h = 0;
    i = b + 16 | 0;
    j = 0;
    b : while (1) {
     if (i >>> 0 >= k >>> 0) {
      b = 18;
      break;
     }
     a[f >> 0] = 0;
     a[l >> 0] = 0;
     Uf(i, d, e, e, 1, g);
     if (a[n >> 0] | 0) {
      b = 18;
      break;
     }
     do if (!(a[l >> 0] | 0)) b = j; else {
      if (!(a[f >> 0] | 0)) if (!(c[m >> 2] & 1)) {
       h = 1;
       b = 18;
       break b;
      } else {
       h = 1;
       b = j;
       break;
      }
      if ((c[o >> 2] | 0) == 1) {
       b = 23;
       break b;
      }
      if (!(c[m >> 2] & 2)) {
       b = 23;
       break b;
      } else {
       h = 1;
       b = 1;
      }
     } while (0);
     i = i + 8 | 0;
     j = b;
    }
    do if ((b | 0) == 18) {
     if (!j) {
      c[p >> 2] = e;
      e = d + 40 | 0;
      c[e >> 2] = (c[e >> 2] | 0) + 1;
      if ((c[d + 36 >> 2] | 0) == 1) if ((c[o >> 2] | 0) == 2) {
       a[n >> 0] = 1;
       if (h) {
        b = 23;
        break;
       } else {
        h = 4;
        break;
       }
      }
     }
     if (h) b = 23; else h = 4;
    } while (0);
    if ((b | 0) == 23) h = 3;
    c[q >> 2] = h;
    break;
   }
  }
  if ((f | 0) == 1) c[d + 32 >> 2] = 1;
 } while (0);
 return;
}

function fc(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0;
 d = k;
 k = k + 608 | 0;
 h = d + 480 | 0;
 f = d + 320 | 0;
 n = d + 160 | 0;
 e = d;
 gc(a, b);
 r = c[b + 4 >> 2] | 0;
 q = c[b + 8 >> 2] | 0;
 p = c[b + 12 >> 2] | 0;
 o = c[b + 16 >> 2] | 0;
 m = c[b + 20 >> 2] | 0;
 g = c[b + 24 >> 2] | 0;
 j = c[b + 28 >> 2] | 0;
 l = c[b + 32 >> 2] | 0;
 i = c[b + 36 >> 2] | 0;
 c[h >> 2] = c[b >> 2];
 c[h + 4 >> 2] = r;
 c[h + 8 >> 2] = q;
 c[h + 12 >> 2] = p;
 c[h + 16 >> 2] = o;
 c[h + 20 >> 2] = m;
 c[h + 24 >> 2] = g;
 c[h + 28 >> 2] = j;
 c[h + 32 >> 2] = l;
 c[h + 36 >> 2] = i;
 i = c[b + 44 >> 2] | 0;
 l = c[b + 48 >> 2] | 0;
 j = c[b + 52 >> 2] | 0;
 g = c[b + 56 >> 2] | 0;
 m = c[b + 60 >> 2] | 0;
 o = c[b + 64 >> 2] | 0;
 p = c[b + 68 >> 2] | 0;
 q = c[b + 72 >> 2] | 0;
 r = c[b + 76 >> 2] | 0;
 c[h + 40 >> 2] = c[b + 40 >> 2];
 c[h + 44 >> 2] = i;
 c[h + 48 >> 2] = l;
 c[h + 52 >> 2] = j;
 c[h + 56 >> 2] = g;
 c[h + 60 >> 2] = m;
 c[h + 64 >> 2] = o;
 c[h + 68 >> 2] = p;
 c[h + 72 >> 2] = q;
 c[h + 76 >> 2] = r;
 r = c[b + 84 >> 2] | 0;
 q = c[b + 88 >> 2] | 0;
 p = c[b + 92 >> 2] | 0;
 o = c[b + 96 >> 2] | 0;
 m = c[b + 100 >> 2] | 0;
 g = c[b + 104 >> 2] | 0;
 j = c[b + 108 >> 2] | 0;
 l = c[b + 112 >> 2] | 0;
 i = c[b + 116 >> 2] | 0;
 c[h + 80 >> 2] = c[b + 80 >> 2];
 c[h + 84 >> 2] = r;
 c[h + 88 >> 2] = q;
 c[h + 92 >> 2] = p;
 c[h + 96 >> 2] = o;
 c[h + 100 >> 2] = m;
 c[h + 104 >> 2] = g;
 c[h + 108 >> 2] = j;
 c[h + 112 >> 2] = l;
 c[h + 116 >> 2] = i;
 hc(f, h);
 h = f + 120 | 0;
 ec(n, f, h);
 b = f + 40 | 0;
 i = f + 80 | 0;
 ec(n + 40 | 0, b, i);
 ec(n + 80 | 0, i, h);
 ec(n + 120 | 0, f, b);
 dc(f, n, a);
 ec(e, f, h);
 l = e + 40 | 0;
 ec(l, b, i);
 j = e + 80 | 0;
 ec(j, i, h);
 g = e + 120 | 0;
 ec(g, f, b);
 m = a + 160 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 m = a + 320 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 m = a + 480 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 m = a + 640 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 m = a + 800 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 m = a + 960 | 0;
 gc(m, e);
 dc(f, n, m);
 ec(e, f, h);
 ec(l, b, i);
 ec(j, i, h);
 ec(g, f, b);
 gc(a + 1120 | 0, e);
 k = d;
 return;
}

function gc(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0;
 m = b + 40 | 0;
 v = b + 44 | 0;
 u = b + 48 | 0;
 t = b + 52 | 0;
 s = b + 56 | 0;
 r = b + 60 | 0;
 q = b + 64 | 0;
 p = b + 68 | 0;
 o = b + 72 | 0;
 n = b + 76 | 0;
 d = b + 4 | 0;
 e = b + 8 | 0;
 f = b + 12 | 0;
 g = b + 16 | 0;
 h = b + 20 | 0;
 i = b + 24 | 0;
 j = b + 28 | 0;
 k = b + 32 | 0;
 l = b + 36 | 0;
 E = (c[d >> 2] | 0) + (c[v >> 2] | 0) | 0;
 D = (c[e >> 2] | 0) + (c[u >> 2] | 0) | 0;
 C = (c[f >> 2] | 0) + (c[t >> 2] | 0) | 0;
 B = (c[g >> 2] | 0) + (c[s >> 2] | 0) | 0;
 A = (c[h >> 2] | 0) + (c[r >> 2] | 0) | 0;
 z = (c[i >> 2] | 0) + (c[q >> 2] | 0) | 0;
 y = (c[j >> 2] | 0) + (c[p >> 2] | 0) | 0;
 x = (c[k >> 2] | 0) + (c[o >> 2] | 0) | 0;
 w = (c[l >> 2] | 0) + (c[n >> 2] | 0) | 0;
 c[a >> 2] = (c[b >> 2] | 0) + (c[m >> 2] | 0);
 c[a + 4 >> 2] = E;
 c[a + 8 >> 2] = D;
 c[a + 12 >> 2] = C;
 c[a + 16 >> 2] = B;
 c[a + 20 >> 2] = A;
 c[a + 24 >> 2] = z;
 c[a + 28 >> 2] = y;
 c[a + 32 >> 2] = x;
 c[a + 36 >> 2] = w;
 d = (c[v >> 2] | 0) - (c[d >> 2] | 0) | 0;
 e = (c[u >> 2] | 0) - (c[e >> 2] | 0) | 0;
 f = (c[t >> 2] | 0) - (c[f >> 2] | 0) | 0;
 g = (c[s >> 2] | 0) - (c[g >> 2] | 0) | 0;
 h = (c[r >> 2] | 0) - (c[h >> 2] | 0) | 0;
 i = (c[q >> 2] | 0) - (c[i >> 2] | 0) | 0;
 j = (c[p >> 2] | 0) - (c[j >> 2] | 0) | 0;
 k = (c[o >> 2] | 0) - (c[k >> 2] | 0) | 0;
 l = (c[n >> 2] | 0) - (c[l >> 2] | 0) | 0;
 c[a + 40 >> 2] = (c[m >> 2] | 0) - (c[b >> 2] | 0);
 c[a + 44 >> 2] = d;
 c[a + 48 >> 2] = e;
 c[a + 52 >> 2] = f;
 c[a + 56 >> 2] = g;
 c[a + 60 >> 2] = h;
 c[a + 64 >> 2] = i;
 c[a + 68 >> 2] = j;
 c[a + 72 >> 2] = k;
 c[a + 76 >> 2] = l;
 l = c[b + 84 >> 2] | 0;
 k = c[b + 88 >> 2] | 0;
 j = c[b + 92 >> 2] | 0;
 i = c[b + 96 >> 2] | 0;
 h = c[b + 100 >> 2] | 0;
 g = c[b + 104 >> 2] | 0;
 f = c[b + 108 >> 2] | 0;
 e = c[b + 112 >> 2] | 0;
 d = c[b + 116 >> 2] | 0;
 c[a + 80 >> 2] = c[b + 80 >> 2];
 c[a + 84 >> 2] = l;
 c[a + 88 >> 2] = k;
 c[a + 92 >> 2] = j;
 c[a + 96 >> 2] = i;
 c[a + 100 >> 2] = h;
 c[a + 104 >> 2] = g;
 c[a + 108 >> 2] = f;
 c[a + 112 >> 2] = e;
 c[a + 116 >> 2] = d;
 ec(a + 120 | 0, b + 120 | 0, 112);
 return;
}

function ad(b, d, e, f, g, h) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 var i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0;
 r = k;
 k = k + 64 | 0;
 n = r + 48 | 0;
 p = r + 36 | 0;
 q = r + 24 | 0;
 o = r + 12 | 0;
 m = r;
 i = d + 4 | 0;
 j = c[d >> 2] | 0;
 c[p >> 2] = 0;
 c[p + 4 >> 2] = 0;
 c[p + 8 >> 2] = 0;
 if (j >>> 0 > 4294967279) Oe(p);
 if (j >>> 0 < 11) {
  a[p + 11 >> 0] = j;
  if (!j) d = p; else {
   d = p;
   l = 6;
  }
 } else {
  l = j + 16 & -16;
  d = He(l) | 0;
  c[p >> 2] = d;
  c[p + 8 >> 2] = l | -2147483648;
  c[p + 4 >> 2] = j;
  l = 6;
 }
 if ((l | 0) == 6) ig(d | 0, i | 0, j | 0) | 0;
 a[d + j >> 0] = 0;
 i = e + 4 | 0;
 j = c[e >> 2] | 0;
 c[q >> 2] = 0;
 c[q + 4 >> 2] = 0;
 c[q + 8 >> 2] = 0;
 if (j >>> 0 > 4294967279) Oe(q);
 if (j >>> 0 < 11) {
  a[q + 11 >> 0] = j;
  if (!j) d = q; else {
   d = q;
   l = 12;
  }
 } else {
  l = j + 16 & -16;
  d = He(l) | 0;
  c[q >> 2] = d;
  c[q + 8 >> 2] = l | -2147483648;
  c[q + 4 >> 2] = j;
  l = 12;
 }
 if ((l | 0) == 12) ig(d | 0, i | 0, j | 0) | 0;
 a[d + j >> 0] = 0;
 Hd(o, f);
 i = g + 4 | 0;
 j = c[g >> 2] | 0;
 c[m >> 2] = 0;
 c[m + 4 >> 2] = 0;
 c[m + 8 >> 2] = 0;
 if (j >>> 0 > 4294967279) Oe(m);
 if (j >>> 0 < 11) {
  a[m + 11 >> 0] = j;
  if (!j) d = m; else {
   d = m;
   l = 18;
  }
 } else {
  l = j + 16 & -16;
  d = He(l) | 0;
  c[m >> 2] = d;
  c[m + 8 >> 2] = l | -2147483648;
  c[m + 4 >> 2] = j;
  l = 18;
 }
 if ((l | 0) == 18) ig(d | 0, i | 0, j | 0) | 0;
 a[d + j >> 0] = 0;
 Zb[b & 7](n, p, q, o, m, h);
 e = He(12) | 0;
 c[e >> 2] = c[n >> 2];
 l = n + 4 | 0;
 c[e + 4 >> 2] = c[l >> 2];
 h = n + 8 | 0;
 c[e + 8 >> 2] = c[h >> 2];
 c[h >> 2] = 0;
 c[l >> 2] = 0;
 c[n >> 2] = 0;
 if ((a[m + 11 >> 0] | 0) < 0) Ie(c[m >> 2] | 0);
 i = c[o >> 2] | 0;
 if (i | 0) {
  j = o + 4 | 0;
  d = c[j >> 2] | 0;
  if ((d | 0) == (i | 0)) d = i; else {
   do {
    d = d + -12 | 0;
    if ((a[d + 11 >> 0] | 0) < 0) Ie(c[d >> 2] | 0);
   } while ((d | 0) != (i | 0));
   d = c[o >> 2] | 0;
  }
  c[j >> 2] = i;
  Ie(d);
 }
 if ((a[q + 11 >> 0] | 0) < 0) Ie(c[q >> 2] | 0);
 if ((a[p + 11 >> 0] | 0) >= 0) {
  k = r;
  return e | 0;
 }
 Ie(c[p >> 2] | 0);
 k = r;
 return e | 0;
}

function rc(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 i = k;
 k = k + 240 | 0;
 d = i + 192 | 0;
 e = i + 144 | 0;
 f = i + 96 | 0;
 g = i + 48 | 0;
 h = i;
 ic(d, c);
 ec(d, d, c);
 ic(e, d);
 ec(e, e, c);
 ec(e, e, b);
 ic(f, e);
 ic(g, f);
 ic(g, g);
 ec(g, e, g);
 ec(f, f, g);
 ic(f, f);
 ec(f, g, f);
 ic(g, f);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ec(f, g, f);
 ic(g, f);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ec(g, g, f);
 ic(h, g);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ic(h, h);
 ec(g, h, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ec(f, g, f);
 ic(g, f);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ec(g, g, f);
 ic(h, g);
 c = 0;
 do {
  ic(h, h);
  c = c + 1 | 0;
 } while ((c | 0) != 99);
 ec(g, h, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ic(g, g);
 ec(f, g, f);
 ic(f, f);
 ic(f, f);
 ec(f, f, e);
 ec(f, f, d);
 ec(a, f, b);
 k = i;
 return;
}

function uc(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 g = k;
 k = k + 192 | 0;
 c = g + 144 | 0;
 d = g + 96 | 0;
 e = g + 48 | 0;
 f = g;
 ic(c, b);
 ic(d, c);
 ic(d, d);
 ec(d, b, d);
 ec(c, c, d);
 ic(e, c);
 ec(d, d, e);
 ic(e, d);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ec(d, e, d);
 ic(e, d);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ec(e, e, d);
 ic(f, e);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ic(f, f);
 ec(e, f, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ec(d, e, d);
 ic(e, d);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ec(e, e, d);
 ic(f, e);
 b = 0;
 do {
  ic(f, f);
  b = b + 1 | 0;
 } while ((b | 0) != 99);
 ec(e, f, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ic(e, e);
 ec(d, e, d);
 ic(d, d);
 ic(d, d);
 ic(d, d);
 ic(d, d);
 ic(d, d);
 ec(a, d, c);
 k = g;
 return;
}

function $d(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0.0;
 a : do if (b >>> 0 <= 20) do switch (b | 0) {
 case 9:
  {
   e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   b = c[e >> 2] | 0;
   c[d >> 2] = e + 4;
   c[a >> 2] = b;
   break a;
  }
 case 10:
  {
   e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   b = c[e >> 2] | 0;
   c[d >> 2] = e + 4;
   e = a;
   c[e >> 2] = b;
   c[e + 4 >> 2] = ((b | 0) < 0) << 31 >> 31;
   break a;
  }
 case 11:
  {
   e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   b = c[e >> 2] | 0;
   c[d >> 2] = e + 4;
   e = a;
   c[e >> 2] = b;
   c[e + 4 >> 2] = 0;
   break a;
  }
 case 12:
  {
   e = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
   b = e;
   f = c[b >> 2] | 0;
   b = c[b + 4 >> 2] | 0;
   c[d >> 2] = e + 8;
   e = a;
   c[e >> 2] = f;
   c[e + 4 >> 2] = b;
   break a;
  }
 case 13:
  {
   f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   e = c[f >> 2] | 0;
   c[d >> 2] = f + 4;
   e = (e & 65535) << 16 >> 16;
   f = a;
   c[f >> 2] = e;
   c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
   break a;
  }
 case 14:
  {
   f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   e = c[f >> 2] | 0;
   c[d >> 2] = f + 4;
   f = a;
   c[f >> 2] = e & 65535;
   c[f + 4 >> 2] = 0;
   break a;
  }
 case 15:
  {
   f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   e = c[f >> 2] | 0;
   c[d >> 2] = f + 4;
   e = (e & 255) << 24 >> 24;
   f = a;
   c[f >> 2] = e;
   c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
   break a;
  }
 case 16:
  {
   f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
   e = c[f >> 2] | 0;
   c[d >> 2] = f + 4;
   f = a;
   c[f >> 2] = e & 255;
   c[f + 4 >> 2] = 0;
   break a;
  }
 case 17:
  {
   f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
   g = +h[f >> 3];
   c[d >> 2] = f + 8;
   h[a >> 3] = g;
   break a;
  }
 case 18:
  {
   f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
   g = +h[f >> 3];
   c[d >> 2] = f + 8;
   h[a >> 3] = g;
   break a;
  }
 default:
  break a;
 } while (0); while (0);
 return;
}

function sc(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0;
 t = c[d >> 2] | 0;
 s = c[d + 4 >> 2] | 0;
 q = c[d + 8 >> 2] | 0;
 o = c[d + 12 >> 2] | 0;
 m = c[d + 16 >> 2] | 0;
 l = c[d + 20 >> 2] | 0;
 k = c[d + 24 >> 2] | 0;
 i = c[d + 28 >> 2] | 0;
 g = c[d + 32 >> 2] | 0;
 e = c[d + 36 >> 2] | 0;
 t = (((((((((((((e * 19 | 0) + 16777216 >> 25) + t >> 26) + s >> 25) + q >> 26) + o >> 25) + m >> 26) + l >> 25) + k >> 26) + i >> 25) + g >> 26) + e >> 25) * 19 | 0) + t | 0;
 s = (t >> 26) + s | 0;
 q = (s >> 25) + q | 0;
 r = s & 33554431;
 o = (q >> 26) + o | 0;
 p = q & 67108863;
 m = (o >> 25) + m | 0;
 n = o & 33554431;
 l = (m >> 26) + l | 0;
 k = (l >> 25) + k | 0;
 i = (k >> 26) + i | 0;
 j = k & 67108863;
 g = (i >> 25) + g | 0;
 h = i & 33554431;
 e = (g >> 26) + e | 0;
 f = g & 67108863;
 d = e & 33554431;
 a[b >> 0] = t;
 a[b + 1 >> 0] = t >>> 8;
 a[b + 2 >> 0] = t >>> 16;
 a[b + 3 >> 0] = r << 2 | t >>> 24 & 3;
 a[b + 4 >> 0] = s >>> 6;
 a[b + 5 >> 0] = s >>> 14;
 a[b + 6 >> 0] = p << 3 | r >>> 22;
 a[b + 7 >> 0] = q >>> 5;
 a[b + 8 >> 0] = q >>> 13;
 a[b + 9 >> 0] = n << 5 | p >>> 21;
 a[b + 10 >> 0] = o >>> 3;
 a[b + 11 >> 0] = o >>> 11;
 a[b + 12 >> 0] = m << 6 | n >>> 19;
 a[b + 13 >> 0] = m >>> 2;
 a[b + 14 >> 0] = m >>> 10;
 a[b + 15 >> 0] = m >>> 18;
 a[b + 16 >> 0] = l;
 a[b + 17 >> 0] = l >>> 8;
 a[b + 18 >> 0] = l >>> 16;
 a[b + 19 >> 0] = j << 1 | l >>> 24 & 1;
 a[b + 20 >> 0] = k >>> 7;
 a[b + 21 >> 0] = k >>> 15;
 a[b + 22 >> 0] = h << 3 | j >>> 23;
 a[b + 23 >> 0] = i >>> 5;
 a[b + 24 >> 0] = i >>> 13;
 a[b + 25 >> 0] = f << 4 | h >>> 21;
 a[b + 26 >> 0] = g >>> 4;
 a[b + 27 >> 0] = g >>> 12;
 a[b + 28 >> 0] = d << 6 | f >>> 20;
 a[b + 29 >> 0] = e >>> 2;
 a[b + 30 >> 0] = e >>> 10;
 a[b + 31 >> 0] = d >>> 18;
 return;
}

function Bc(b, d, e, f, g) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0;
 u = k;
 k = k + 2112 | 0;
 p = u + 1536 | 0;
 q = u + 1280 | 0;
 r = u;
 s = u + 1952 | 0;
 t = u + 1792 | 0;
 mc(p, d);
 mc(q, f);
 fc(r, e);
 d = b;
 e = d + 40 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 n = b + 40 | 0;
 c[n >> 2] = 1;
 d = b + 44 | 0;
 e = d + 36 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 o = b + 80 | 0;
 c[o >> 2] = 1;
 d = b + 84 | 0;
 e = d + 36 | 0;
 do {
  c[d >> 2] = 0;
  d = d + 4 | 0;
 } while ((d | 0) < (e | 0));
 d = 255;
 while (1) {
  if (a[p + d >> 0] | 0) break;
  if (a[q + d >> 0] | 0) break;
  if (!d) {
   h = 16;
   break;
  } else d = d + -1 | 0;
 }
 if ((h | 0) == 16) {
  k = u;
  return;
 }
 if ((d | 0) <= -1) {
  k = u;
  return;
 }
 f = s + 120 | 0;
 h = t + 40 | 0;
 i = s + 40 | 0;
 j = s + 80 | 0;
 l = t + 80 | 0;
 m = t + 120 | 0;
 while (1) {
  hc(s, b);
  e = a[p + d >> 0] | 0;
  if (e << 24 >> 24 > 0) {
   ec(t, s, f);
   ec(h, i, j);
   ec(l, j, f);
   ec(m, s, i);
   dc(s, t, r + (((e & 255) >>> 1 & 255) * 160 | 0) | 0);
  } else if (e << 24 >> 24 < 0) {
   ec(t, s, f);
   ec(h, i, j);
   ec(l, j, f);
   ec(m, s, i);
   nc(s, t, r + ((((e << 24 >> 24) / -2 | 0) << 24 >> 24) * 160 | 0) | 0);
  }
  e = a[q + d >> 0] | 0;
  if (e << 24 >> 24 > 0) {
   ec(t, s, f);
   ec(h, i, j);
   ec(l, j, f);
   ec(m, s, i);
   dc(s, t, g + (((e & 255) >>> 1 & 255) * 160 | 0) | 0);
  } else if (e << 24 >> 24 < 0) {
   ec(t, s, f);
   ec(h, i, j);
   ec(l, j, f);
   ec(m, s, i);
   nc(s, t, g + ((((e << 24 >> 24) / -2 | 0) << 24 >> 24) * 160 | 0) | 0);
  }
  ec(b, s, f);
  ec(n, i, j);
  ec(o, j, f);
  if ((d | 0) > 0) d = d + -1 | 0; else break;
 }
 k = u;
 return;
}

function Dd(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0;
 l = b + 8 | 0;
 h = c[l >> 2] | 0;
 m = b + 4 | 0;
 f = c[m >> 2] | 0;
 if (((h - f | 0) / 12 | 0) >>> 0 >= d >>> 0) {
  do {
   Pe(f, e);
   f = (c[m >> 2] | 0) + 12 | 0;
   c[m >> 2] = f;
   d = d + -1 | 0;
  } while ((d | 0) != 0);
  return;
 }
 g = c[b >> 2] | 0;
 i = (f - g | 0) / 12 | 0;
 f = i + d | 0;
 if (f >>> 0 > 357913941) Ze(b);
 k = (h - g | 0) / 12 | 0;
 h = k << 1;
 h = k >>> 0 < 178956970 ? (h >>> 0 < f >>> 0 ? f : h) : 357913941;
 do if (!h) g = 0; else if (h >>> 0 > 357913941) {
  m = ia(8) | 0;
  Le(m, 37333);
  c[m >> 2] = 36364;
  la(m | 0, 35608, 6);
 } else {
  g = He(h * 12 | 0) | 0;
  break;
 } while (0);
 f = g + (i * 12 | 0) | 0;
 j = f;
 k = g + (h * 12 | 0) | 0;
 h = j;
 g = f;
 while (1) {
  Pe(g, e);
  g = h + 12 | 0;
  d = d + -1 | 0;
  if (!d) break; else h = g;
 }
 i = c[b >> 2] | 0;
 d = c[m >> 2] | 0;
 if ((d | 0) == (i | 0)) {
  d = j;
  h = i;
  f = i;
 } else {
  do {
   f = f + -12 | 0;
   d = d + -12 | 0;
   c[f >> 2] = c[d >> 2];
   c[f + 4 >> 2] = c[d + 4 >> 2];
   c[f + 8 >> 2] = c[d + 8 >> 2];
   c[d >> 2] = 0;
   c[d + 4 >> 2] = 0;
   c[d + 8 >> 2] = 0;
  } while ((d | 0) != (i | 0));
  d = f;
  h = c[b >> 2] | 0;
  f = c[m >> 2] | 0;
 }
 c[b >> 2] = d;
 c[m >> 2] = g;
 c[l >> 2] = k;
 d = h;
 if ((f | 0) != (d | 0)) do {
  f = f + -12 | 0;
  if ((a[f + 11 >> 0] | 0) < 0) Ie(c[f >> 2] | 0);
 } while ((f | 0) != (d | 0));
 if (!h) return;
 Ie(h);
 return;
}

function id(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0;
 n = k;
 k = k + 48 | 0;
 j = n + 24 | 0;
 l = n + 12 | 0;
 m = n;
 g = d + 4 | 0;
 h = c[d >> 2] | 0;
 c[l >> 2] = 0;
 c[l + 4 >> 2] = 0;
 c[l + 8 >> 2] = 0;
 if (h >>> 0 > 4294967279) Oe(l);
 if (h >>> 0 < 11) {
  a[l + 11 >> 0] = h;
  if (!h) d = l; else {
   d = l;
   i = 6;
  }
 } else {
  i = h + 16 & -16;
  d = He(i) | 0;
  c[l >> 2] = d;
  c[l + 8 >> 2] = i | -2147483648;
  c[l + 4 >> 2] = h;
  i = 6;
 }
 if ((i | 0) == 6) ig(d | 0, g | 0, h | 0) | 0;
 a[d + h >> 0] = 0;
 g = f + 4 | 0;
 h = c[f >> 2] | 0;
 c[m >> 2] = 0;
 c[m + 4 >> 2] = 0;
 c[m + 8 >> 2] = 0;
 if (h >>> 0 > 4294967279) Oe(m);
 if (h >>> 0 < 11) {
  a[m + 11 >> 0] = h;
  if (!h) d = m; else {
   d = m;
   i = 12;
  }
 } else {
  i = h + 16 & -16;
  d = He(i) | 0;
  c[m >> 2] = d;
  c[m + 8 >> 2] = i | -2147483648;
  c[m + 4 >> 2] = h;
  i = 12;
 }
 if ((i | 0) == 12) ig(d | 0, g | 0, h | 0) | 0;
 a[d + h >> 0] = 0;
 Xb[b & 7](j, l, e, m);
 d = a[j + 11 >> 0] | 0;
 if (d << 24 >> 24 < 0) {
  i = c[j + 4 >> 2] | 0;
  d = Be(i + 4 | 0) | 0;
  c[d >> 2] = i;
  j = c[j >> 2] | 0;
  ig(d + 4 | 0, j | 0, i | 0) | 0;
  Ie(j);
 } else {
  i = d & 255;
  d = Be(i + 4 | 0) | 0;
  c[d >> 2] = i;
  ig(d + 4 | 0, j | 0, i | 0) | 0;
 }
 if ((a[m + 11 >> 0] | 0) < 0) Ie(c[m >> 2] | 0);
 if ((a[l + 11 >> 0] | 0) >= 0) {
  k = n;
  return d | 0;
 }
 Ie(c[l >> 2] | 0);
 k = n;
 return d | 0;
}

function ed(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0;
 m = k;
 k = k + 48 | 0;
 i = m + 24 | 0;
 j = m + 12 | 0;
 l = m;
 f = d + 4 | 0;
 g = c[d >> 2] | 0;
 c[j >> 2] = 0;
 c[j + 4 >> 2] = 0;
 c[j + 8 >> 2] = 0;
 if (g >>> 0 > 4294967279) Oe(j);
 if (g >>> 0 < 11) {
  a[j + 11 >> 0] = g;
  if (!g) d = j; else {
   d = j;
   h = 6;
  }
 } else {
  h = g + 16 & -16;
  d = He(h) | 0;
  c[j >> 2] = d;
  c[j + 8 >> 2] = h | -2147483648;
  c[j + 4 >> 2] = g;
  h = 6;
 }
 if ((h | 0) == 6) ig(d | 0, f | 0, g | 0) | 0;
 a[d + g >> 0] = 0;
 f = e + 4 | 0;
 g = c[e >> 2] | 0;
 c[l >> 2] = 0;
 c[l + 4 >> 2] = 0;
 c[l + 8 >> 2] = 0;
 if (g >>> 0 > 4294967279) Oe(l);
 if (g >>> 0 < 11) {
  a[l + 11 >> 0] = g;
  if (!g) d = l; else {
   d = l;
   h = 12;
  }
 } else {
  h = g + 16 & -16;
  d = He(h) | 0;
  c[l >> 2] = d;
  c[l + 8 >> 2] = h | -2147483648;
  c[l + 4 >> 2] = g;
  h = 12;
 }
 if ((h | 0) == 12) ig(d | 0, f | 0, g | 0) | 0;
 a[d + g >> 0] = 0;
 Wb[b & 7](i, j, l);
 d = a[i + 11 >> 0] | 0;
 if (d << 24 >> 24 < 0) {
  h = c[i + 4 >> 2] | 0;
  d = Be(h + 4 | 0) | 0;
  c[d >> 2] = h;
  i = c[i >> 2] | 0;
  ig(d + 4 | 0, i | 0, h | 0) | 0;
  Ie(i);
 } else {
  h = d & 255;
  d = Be(h + 4 | 0) | 0;
  c[d >> 2] = h;
  ig(d + 4 | 0, i | 0, h | 0) | 0;
 }
 if ((a[l + 11 >> 0] | 0) < 0) Ie(c[l >> 2] | 0);
 if ((a[j + 11 >> 0] | 0) >= 0) {
  k = m;
  return d | 0;
 }
 Ie(c[j >> 2] | 0);
 k = m;
 return d | 0;
}

function ig(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0;
 if ((e | 0) >= 8192) return Qa(b | 0, d | 0, e | 0) | 0;
 h = b | 0;
 g = b + e | 0;
 if ((b & 3) == (d & 3)) {
  while (b & 3) {
   if (!e) return h | 0;
   a[b >> 0] = a[d >> 0] | 0;
   b = b + 1 | 0;
   d = d + 1 | 0;
   e = e - 1 | 0;
  }
  e = g & -4 | 0;
  f = e - 64 | 0;
  while ((b | 0) <= (f | 0)) {
   c[b >> 2] = c[d >> 2];
   c[b + 4 >> 2] = c[d + 4 >> 2];
   c[b + 8 >> 2] = c[d + 8 >> 2];
   c[b + 12 >> 2] = c[d + 12 >> 2];
   c[b + 16 >> 2] = c[d + 16 >> 2];
   c[b + 20 >> 2] = c[d + 20 >> 2];
   c[b + 24 >> 2] = c[d + 24 >> 2];
   c[b + 28 >> 2] = c[d + 28 >> 2];
   c[b + 32 >> 2] = c[d + 32 >> 2];
   c[b + 36 >> 2] = c[d + 36 >> 2];
   c[b + 40 >> 2] = c[d + 40 >> 2];
   c[b + 44 >> 2] = c[d + 44 >> 2];
   c[b + 48 >> 2] = c[d + 48 >> 2];
   c[b + 52 >> 2] = c[d + 52 >> 2];
   c[b + 56 >> 2] = c[d + 56 >> 2];
   c[b + 60 >> 2] = c[d + 60 >> 2];
   b = b + 64 | 0;
   d = d + 64 | 0;
  }
  while ((b | 0) < (e | 0)) {
   c[b >> 2] = c[d >> 2];
   b = b + 4 | 0;
   d = d + 4 | 0;
  }
 } else {
  e = g - 4 | 0;
  while ((b | 0) < (e | 0)) {
   a[b >> 0] = a[d >> 0] | 0;
   a[b + 1 >> 0] = a[d + 1 >> 0] | 0;
   a[b + 2 >> 0] = a[d + 2 >> 0] | 0;
   a[b + 3 >> 0] = a[d + 3 >> 0] | 0;
   b = b + 4 | 0;
   d = d + 4 | 0;
  }
 }
 while ((b | 0) < (g | 0)) {
  a[b >> 0] = a[d >> 0] | 0;
  b = b + 1 | 0;
  d = d + 1 | 0;
 }
 return h | 0;
}

function Gd(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 j = b + 4 | 0;
 e = c[b >> 2] | 0;
 h = ((c[j >> 2] | 0) - e | 0) / 12 | 0;
 f = h + 1 | 0;
 if (f >>> 0 > 357913941) Ze(b);
 k = b + 8 | 0;
 i = ((c[k >> 2] | 0) - e | 0) / 12 | 0;
 g = i << 1;
 g = i >>> 0 < 178956970 ? (g >>> 0 < f >>> 0 ? f : g) : 357913941;
 do if (!g) e = 0; else if (g >>> 0 > 357913941) {
  k = ia(8) | 0;
  Le(k, 37333);
  c[k >> 2] = 36364;
  la(k | 0, 35608, 6);
 } else {
  e = He(g * 12 | 0) | 0;
  break;
 } while (0);
 f = e + (h * 12 | 0) | 0;
 i = e + (g * 12 | 0) | 0;
 c[f >> 2] = c[d >> 2];
 c[f + 4 >> 2] = c[d + 4 >> 2];
 c[f + 8 >> 2] = c[d + 8 >> 2];
 c[d >> 2] = 0;
 c[d + 4 >> 2] = 0;
 c[d + 8 >> 2] = 0;
 d = f + 12 | 0;
 h = c[b >> 2] | 0;
 e = c[j >> 2] | 0;
 if ((e | 0) == (h | 0)) {
  g = h;
  e = h;
 } else {
  do {
   f = f + -12 | 0;
   e = e + -12 | 0;
   c[f >> 2] = c[e >> 2];
   c[f + 4 >> 2] = c[e + 4 >> 2];
   c[f + 8 >> 2] = c[e + 8 >> 2];
   c[e >> 2] = 0;
   c[e + 4 >> 2] = 0;
   c[e + 8 >> 2] = 0;
  } while ((e | 0) != (h | 0));
  g = c[b >> 2] | 0;
  e = c[j >> 2] | 0;
 }
 c[b >> 2] = f;
 c[j >> 2] = d;
 c[k >> 2] = i;
 f = g;
 if ((e | 0) != (f | 0)) do {
  e = e + -12 | 0;
  if ((a[e + 11 >> 0] | 0) < 0) Ie(c[e >> 2] | 0);
 } while ((e | 0) != (f | 0));
 if (!g) return;
 Ie(g);
 return;
}

function Md(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
 n = k;
 k = k + 48 | 0;
 l = n + 32 | 0;
 g = n + 16 | 0;
 f = n;
 i = a + 28 | 0;
 e = c[i >> 2] | 0;
 c[f >> 2] = e;
 j = a + 20 | 0;
 e = (c[j >> 2] | 0) - e | 0;
 c[f + 4 >> 2] = e;
 c[f + 8 >> 2] = b;
 c[f + 12 >> 2] = d;
 e = e + d | 0;
 h = a + 60 | 0;
 c[g >> 2] = c[h >> 2];
 c[g + 4 >> 2] = f;
 c[g + 8 >> 2] = 2;
 g = Od(qa(146, g | 0) | 0) | 0;
 a : do if ((e | 0) == (g | 0)) m = 3; else {
  b = 2;
  while (1) {
   if ((g | 0) < 0) break;
   e = e - g | 0;
   p = c[f + 4 >> 2] | 0;
   o = g >>> 0 > p >>> 0;
   f = o ? f + 8 | 0 : f;
   b = b + (o << 31 >> 31) | 0;
   p = g - (o ? p : 0) | 0;
   c[f >> 2] = (c[f >> 2] | 0) + p;
   o = f + 4 | 0;
   c[o >> 2] = (c[o >> 2] | 0) - p;
   c[l >> 2] = c[h >> 2];
   c[l + 4 >> 2] = f;
   c[l + 8 >> 2] = b;
   g = Od(qa(146, l | 0) | 0) | 0;
   if ((e | 0) == (g | 0)) {
    m = 3;
    break a;
   }
  }
  c[a + 16 >> 2] = 0;
  c[i >> 2] = 0;
  c[j >> 2] = 0;
  c[a >> 2] = c[a >> 2] | 32;
  if ((b | 0) == 2) d = 0; else d = d - (c[f + 4 >> 2] | 0) | 0;
 } while (0);
 if ((m | 0) == 3) {
  p = c[a + 44 >> 2] | 0;
  c[a + 16 >> 2] = p + (c[a + 48 >> 2] | 0);
  c[i >> 2] = p;
  c[j >> 2] = p;
 }
 k = n;
 return d | 0;
}

function rf(b, d, e, f, g) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0;
 do if (kf(b, c[d + 8 >> 2] | 0, g) | 0) mf(0, d, e, f); else {
  if (!(kf(b, c[d >> 2] | 0, g) | 0)) {
   i = c[b + 8 >> 2] | 0;
   Yb[c[(c[i >> 2] | 0) + 24 >> 2] & 3](i, d, e, f, g);
   break;
  }
  if ((c[d + 16 >> 2] | 0) != (e | 0)) {
   h = d + 20 | 0;
   if ((c[h >> 2] | 0) != (e | 0)) {
    c[d + 32 >> 2] = f;
    i = d + 44 | 0;
    if ((c[i >> 2] | 0) == 4) break;
    f = d + 52 | 0;
    a[f >> 0] = 0;
    j = d + 53 | 0;
    a[j >> 0] = 0;
    b = c[b + 8 >> 2] | 0;
    Zb[c[(c[b >> 2] | 0) + 20 >> 2] & 7](b, d, e, e, 1, g);
    if (!(a[j >> 0] | 0)) {
     f = 0;
     b = 11;
    } else if (!(a[f >> 0] | 0)) {
     f = 1;
     b = 11;
    } else b = 15;
    do if ((b | 0) == 11) {
     c[h >> 2] = e;
     j = d + 40 | 0;
     c[j >> 2] = (c[j >> 2] | 0) + 1;
     if ((c[d + 36 >> 2] | 0) == 1) if ((c[d + 24 >> 2] | 0) == 2) {
      a[d + 54 >> 0] = 1;
      if (f) {
       b = 15;
       break;
      } else {
       f = 4;
       break;
      }
     }
     if (f) b = 15; else f = 4;
    } while (0);
    if ((b | 0) == 15) f = 3;
    c[i >> 2] = f;
    break;
   }
  }
  if ((f | 0) == 1) c[d + 32 >> 2] = 1;
 } while (0);
 return;
}

function re(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
 o = (c[b >> 2] | 0) + 1794895138 | 0;
 h = se(c[b + 8 >> 2] | 0, o) | 0;
 f = se(c[b + 12 >> 2] | 0, o) | 0;
 g = se(c[b + 16 >> 2] | 0, o) | 0;
 a : do if (h >>> 0 < d >>> 2 >>> 0) {
  n = d - (h << 2) | 0;
  if (f >>> 0 < n >>> 0 & g >>> 0 < n >>> 0) if (!((g | f) & 3)) {
   n = f >>> 2;
   m = g >>> 2;
   l = 0;
   while (1) {
    j = h >>> 1;
    k = l + j | 0;
    i = k << 1;
    g = i + n | 0;
    f = se(c[b + (g << 2) >> 2] | 0, o) | 0;
    g = se(c[b + (g + 1 << 2) >> 2] | 0, o) | 0;
    if (!(g >>> 0 < d >>> 0 & f >>> 0 < (d - g | 0) >>> 0)) {
     f = 0;
     break a;
    }
    if (a[b + (g + f) >> 0] | 0) {
     f = 0;
     break a;
    }
    f = te(e, b + g | 0) | 0;
    if (!f) break;
    f = (f | 0) < 0;
    if ((h | 0) == 1) {
     f = 0;
     break a;
    }
    l = f ? l : k;
    h = f ? j : h - j | 0;
   }
   f = i + m | 0;
   g = se(c[b + (f << 2) >> 2] | 0, o) | 0;
   f = se(c[b + (f + 1 << 2) >> 2] | 0, o) | 0;
   if (f >>> 0 < d >>> 0 & g >>> 0 < (d - f | 0) >>> 0) f = (a[b + (f + g) >> 0] | 0) == 0 ? b + f | 0 : 0; else f = 0;
  } else f = 0; else f = 0;
 } else f = 0; while (0);
 return f | 0;
}

function xc(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0;
 r = c[a >> 2] | 0;
 s = a + 4 | 0;
 t = c[s >> 2] | 0;
 u = a + 8 | 0;
 v = c[u >> 2] | 0;
 w = a + 12 | 0;
 x = c[w >> 2] | 0;
 e = a + 16 | 0;
 f = c[e >> 2] | 0;
 g = a + 20 | 0;
 h = c[g >> 2] | 0;
 i = a + 24 | 0;
 j = c[i >> 2] | 0;
 k = a + 28 | 0;
 l = c[k >> 2] | 0;
 m = a + 32 | 0;
 n = c[m >> 2] | 0;
 o = a + 36 | 0;
 p = c[o >> 2] | 0;
 q = 0 - d | 0;
 if ((d + -1 & ~d | d + -2 & q | 0) == -1) {
  F = (c[b + 4 >> 2] ^ t) & q;
  E = (c[b + 8 >> 2] ^ v) & q;
  D = (c[b + 12 >> 2] ^ x) & q;
  C = (c[b + 16 >> 2] ^ f) & q;
  B = (c[b + 20 >> 2] ^ h) & q;
  A = (c[b + 24 >> 2] ^ j) & q;
  z = (c[b + 28 >> 2] ^ l) & q;
  y = (c[b + 32 >> 2] ^ n) & q;
  d = (c[b + 36 >> 2] ^ p) & q;
  c[a >> 2] = (c[b >> 2] ^ r) & q ^ r;
  c[s >> 2] = F ^ t;
  c[u >> 2] = E ^ v;
  c[w >> 2] = D ^ x;
  c[e >> 2] = C ^ f;
  c[g >> 2] = B ^ h;
  c[i >> 2] = A ^ j;
  c[k >> 2] = z ^ l;
  c[m >> 2] = y ^ n;
  c[o >> 2] = d ^ p;
  return;
 } else ha(36472, 36533, 177, 36553);
}

function Ed(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 j = b + 4 | 0;
 e = c[b >> 2] | 0;
 h = ((c[j >> 2] | 0) - e | 0) / 12 | 0;
 f = h + 1 | 0;
 if (f >>> 0 > 357913941) Ze(b);
 k = b + 8 | 0;
 i = ((c[k >> 2] | 0) - e | 0) / 12 | 0;
 g = i << 1;
 g = i >>> 0 < 178956970 ? (g >>> 0 < f >>> 0 ? f : g) : 357913941;
 do if (!g) e = 0; else if (g >>> 0 > 357913941) {
  k = ia(8) | 0;
  Le(k, 37333);
  c[k >> 2] = 36364;
  la(k | 0, 35608, 6);
 } else {
  e = He(g * 12 | 0) | 0;
  break;
 } while (0);
 f = e + (h * 12 | 0) | 0;
 i = e + (g * 12 | 0) | 0;
 Pe(f, d);
 d = f + 12 | 0;
 h = c[b >> 2] | 0;
 e = c[j >> 2] | 0;
 if ((e | 0) == (h | 0)) {
  g = h;
  e = h;
 } else {
  do {
   f = f + -12 | 0;
   e = e + -12 | 0;
   c[f >> 2] = c[e >> 2];
   c[f + 4 >> 2] = c[e + 4 >> 2];
   c[f + 8 >> 2] = c[e + 8 >> 2];
   c[e >> 2] = 0;
   c[e + 4 >> 2] = 0;
   c[e + 8 >> 2] = 0;
  } while ((e | 0) != (h | 0));
  g = c[b >> 2] | 0;
  e = c[j >> 2] | 0;
 }
 c[b >> 2] = f;
 c[j >> 2] = d;
 c[k >> 2] = i;
 f = g;
 if ((e | 0) != (f | 0)) do {
  e = e + -12 | 0;
  if ((a[e + 11 >> 0] | 0) < 0) Ie(c[e >> 2] | 0);
 } while ((e | 0) != (f | 0));
 if (!g) return;
 Ie(g);
 return;
}

function Nf(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0;
 h = k;
 k = k + 64 | 0;
 g = h;
 c[d >> 2] = c[c[d >> 2] >> 2];
 if (Of(a, b, 0) | 0) b = 1; else if (!b) b = 0; else {
  e = of(b, 35536, 35640, 0) | 0;
  if (!e) b = 0; else if (!(c[e + 8 >> 2] & ~c[a + 8 >> 2])) {
   b = a + 12 | 0;
   a = e + 12 | 0;
   if (kf(c[b >> 2] | 0, c[a >> 2] | 0, 0) | 0) b = 1; else if (kf(c[b >> 2] | 0, 35672, 0) | 0) b = 1; else {
    b = c[b >> 2] | 0;
    if (!b) b = 0; else {
     f = of(b, 35536, 35520, 0) | 0;
     if (!f) b = 0; else {
      b = c[a >> 2] | 0;
      if (!b) b = 0; else {
       b = of(b, 35536, 35520, 0) | 0;
       if (!b) b = 0; else {
        a = g + 4 | 0;
        e = a + 52 | 0;
        do {
         c[a >> 2] = 0;
         a = a + 4 | 0;
        } while ((a | 0) < (e | 0));
        c[g >> 2] = b;
        c[g + 8 >> 2] = f;
        c[g + 12 >> 2] = -1;
        c[g + 48 >> 2] = 1;
        Xb[c[(c[b >> 2] | 0) + 28 >> 2] & 7](b, g, c[d >> 2] | 0, 1);
        if ((c[g + 24 >> 2] | 0) == 1) {
         c[d >> 2] = c[g + 16 >> 2];
         b = 1;
        } else b = 0;
       }
      }
     }
    }
   }
  } else b = 0;
 }
 k = h;
 return b | 0;
}

function of(d, e, f, g) {
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
 q = k;
 k = k + 64 | 0;
 o = q;
 n = c[d >> 2] | 0;
 p = d + (c[n + -8 >> 2] | 0) | 0;
 n = c[n + -4 >> 2] | 0;
 c[o >> 2] = f;
 c[o + 4 >> 2] = d;
 c[o + 8 >> 2] = e;
 c[o + 12 >> 2] = g;
 d = o + 16 | 0;
 e = o + 20 | 0;
 g = o + 24 | 0;
 h = o + 28 | 0;
 i = o + 32 | 0;
 j = o + 40 | 0;
 l = d;
 m = l + 36 | 0;
 do {
  c[l >> 2] = 0;
  l = l + 4 | 0;
 } while ((l | 0) < (m | 0));
 b[d + 36 >> 1] = 0;
 a[d + 38 >> 0] = 0;
 a : do if (kf(n, f, 0) | 0) {
  c[o + 48 >> 2] = 1;
  Zb[c[(c[n >> 2] | 0) + 20 >> 2] & 7](n, o, p, p, 1, 0);
  d = (c[g >> 2] | 0) == 1 ? p : 0;
 } else {
  Yb[c[(c[n >> 2] | 0) + 24 >> 2] & 3](n, o, p, 1, 0);
  switch (c[o + 36 >> 2] | 0) {
  case 0:
   {
    d = (c[j >> 2] | 0) == 1 & (c[h >> 2] | 0) == 1 & (c[i >> 2] | 0) == 1 ? c[e >> 2] | 0 : 0;
    break a;
   }
  case 1:
   break;
  default:
   {
    d = 0;
    break a;
   }
  }
  if ((c[g >> 2] | 0) != 1) if (!((c[j >> 2] | 0) == 0 & (c[h >> 2] | 0) == 1 & (c[i >> 2] | 0) == 1)) {
   d = 0;
   break;
  }
  d = c[d >> 2] | 0;
 } while (0);
 k = q;
 return d | 0;
}

function Xd(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0;
 s = k;
 k = k + 224 | 0;
 n = s + 208 | 0;
 p = s + 160 | 0;
 q = s + 80 | 0;
 r = s;
 f = p;
 g = f + 40 | 0;
 do {
  c[f >> 2] = 0;
  f = f + 4 | 0;
 } while ((f | 0) < (g | 0));
 c[n >> 2] = c[e >> 2];
 if ((Yd(0, d, n, q, p) | 0) < 0) e = -1; else {
  if ((c[b + 76 >> 2] | 0) > -1) o = Ud(b) | 0; else o = 0;
  e = c[b >> 2] | 0;
  m = e & 32;
  if ((a[b + 74 >> 0] | 0) < 1) c[b >> 2] = e & -33;
  f = b + 48 | 0;
  if (!(c[f >> 2] | 0)) {
   g = b + 44 | 0;
   h = c[g >> 2] | 0;
   c[g >> 2] = r;
   i = b + 28 | 0;
   c[i >> 2] = r;
   j = b + 20 | 0;
   c[j >> 2] = r;
   c[f >> 2] = 80;
   l = b + 16 | 0;
   c[l >> 2] = r + 80;
   e = Yd(b, d, n, q, p) | 0;
   if (h) {
    Qb[c[b + 36 >> 2] & 15](b, 0, 0) | 0;
    e = (c[j >> 2] | 0) == 0 ? -1 : e;
    c[g >> 2] = h;
    c[f >> 2] = 0;
    c[l >> 2] = 0;
    c[i >> 2] = 0;
    c[j >> 2] = 0;
   }
  } else e = Yd(b, d, n, q, p) | 0;
  f = c[b >> 2] | 0;
  c[b >> 2] = f | m;
  if (o | 0) Vd(b);
  e = (f & 32 | 0) == 0 ? e : -1;
 }
 k = s;
 return e | 0;
}

function Ve(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 if (d >>> 0 > 4294967279) Oe(b);
 i = b + 11 | 0;
 g = a[i >> 0] | 0;
 h = g << 24 >> 24 < 0;
 if (h) {
  k = c[b + 4 >> 2] | 0;
  e = (c[b + 8 >> 2] & 2147483647) + -1 | 0;
 } else {
  k = g & 255;
  e = 10;
 }
 j = k >>> 0 > d >>> 0 ? k : d;
 d = j >>> 0 < 11;
 j = d ? 10 : (j + 16 & -16) + -1 | 0;
 do if ((j | 0) != (e | 0)) {
  do if (d) {
   d = c[b >> 2] | 0;
   if (h) {
    g = 0;
    e = d;
    f = b;
    h = 13;
   } else {
    De(b, d, (g & 255) + 1 | 0) | 0;
    Ie(d);
    h = 16;
   }
  } else {
   e = j + 1 | 0;
   f = He(e) | 0;
   if (h) {
    g = 1;
    e = c[b >> 2] | 0;
    h = 13;
    break;
   } else {
    De(f, b, (g & 255) + 1 | 0) | 0;
    d = b + 4 | 0;
    h = 15;
    break;
   }
  } while (0);
  if ((h | 0) == 13) {
   d = b + 4 | 0;
   De(f, e, (c[d >> 2] | 0) + 1 | 0) | 0;
   Ie(e);
   if (g) {
    e = j + 1 | 0;
    h = 15;
   } else h = 16;
  }
  if ((h | 0) == 15) {
   c[b + 8 >> 2] = e | -2147483648;
   c[d >> 2] = k;
   c[b >> 2] = f;
   break;
  } else if ((h | 0) == 16) {
   a[i >> 0] = k;
   break;
  }
 } while (0);
 return;
}

function Xc(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0;
 f = a[e + 11 >> 0] | 0;
 h = f << 24 >> 24 < 0;
 f = h ? c[e + 4 >> 2] | 0 : f & 255;
 if (f & 1 | 0) {
  j = ia(8) | 0;
  Ne(j, 36962);
  la(j | 0, 35592, 8);
 }
 i = f >>> 1;
 c[b >> 2] = 0;
 f = b + 4 | 0;
 c[f >> 2] = 0;
 g = b + 8 | 0;
 c[g >> 2] = 0;
 if (!i) return;
 j = He(i) | 0;
 c[b >> 2] = j;
 b = j + i | 0;
 c[g >> 2] = b;
 kg(j | 0, 0, i | 0) | 0;
 c[f >> 2] = b;
 if ((b | 0) == (j | 0)) return;
 g = h ? c[e >> 2] | 0 : e;
 b = 0;
 h = 0;
 while (1) {
  f = b << 1;
  e = a[32512 + (d[g + f >> 0] | 0) >> 0] | 0;
  if ((e & 255) > 15) {
   f = 7;
   break;
  }
  f = a[32512 + (d[g + (f | 1) >> 0] | 0) >> 0] | 0;
  if ((f & 255) > 15) {
   f = 9;
   break;
  }
  a[j + b >> 0] = (e & 255) << 4 | f & 255;
  b = $f(b | 0, h | 0, 1, 0) | 0;
  h = U() | 0;
  if (!(h >>> 0 < 0 | (h | 0) == 0 & b >>> 0 < i >>> 0)) {
   f = 11;
   break;
  }
 }
 if ((f | 0) == 7) {
  j = ia(8) | 0;
  Ne(j, 36935);
  la(j | 0, 35592, 8);
 } else if ((f | 0) == 9) {
  j = ia(8) | 0;
  Ne(j, 36935);
  la(j | 0, 35592, 8);
 } else if ((f | 0) == 11) return;
}

function Wc(b, e, f, g, h) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 var i = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
 m = b + 11 | 0;
 j = a[m >> 0] | 0;
 k = j << 24 >> 24 < 0;
 n = b + 4 | 0;
 j = k ? c[n >> 2] | 0 : j & 255;
 if (j & 1 | 0) {
  h = 0;
  return h | 0;
 }
 i = j >>> 1;
 if (0 > g >>> 0 | 0 == (g | 0) & i >>> 0 > f >>> 0) {
  h = 0;
  return h | 0;
 }
 a : do if (j >>> 0 > 1) {
  l = 0;
  j = k;
  g = 0;
  while (1) {
   f = l << 1;
   i = j ? c[b >> 2] | 0 : b;
   j = a[32512 + (d[i + f >> 0] | 0) >> 0] | 0;
   if ((j & 255) > 15) {
    i = 0;
    f = 9;
    break;
   }
   i = a[32512 + (d[i + (f | 1) >> 0] | 0) >> 0] | 0;
   if ((i & 255) > 15) {
    i = 0;
    f = 9;
    break;
   }
   a[e + l >> 0] = (j & 255) << 4 | i & 255;
   l = $f(l | 0, g | 0, 1, 0) | 0;
   g = U() | 0;
   i = a[m >> 0] | 0;
   j = i << 24 >> 24 < 0;
   i = (j ? c[n >> 2] | 0 : i & 255) >>> 1;
   if (!(g >>> 0 < 0 | (g | 0) == 0 & l >>> 0 < i >>> 0)) {
    j = 0;
    break a;
   }
  }
  if ((f | 0) == 9) return i | 0;
 } else j = 0; while (0);
 c[h >> 2] = i;
 c[h + 4 >> 2] = j;
 h = 1;
 return h | 0;
}

function Td(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0;
 h = d & 255;
 f = (e | 0) != 0;
 a : do if (f & (b & 3 | 0) != 0) {
  g = d & 255;
  while (1) {
   if ((a[b >> 0] | 0) == g << 24 >> 24) {
    i = 6;
    break a;
   }
   b = b + 1 | 0;
   e = e + -1 | 0;
   f = (e | 0) != 0;
   if (!(f & (b & 3 | 0) != 0)) {
    i = 5;
    break;
   }
  }
 } else i = 5; while (0);
 if ((i | 0) == 5) if (f) i = 6; else i = 16;
 b : do if ((i | 0) == 6) {
  g = d & 255;
  if ((a[b >> 0] | 0) == g << 24 >> 24) if (!e) {
   i = 16;
   break;
  } else break;
  f = L(h, 16843009) | 0;
  c : do if (e >>> 0 > 3) while (1) {
   h = c[b >> 2] ^ f;
   if ((h & -2139062144 ^ -2139062144) & h + -16843009 | 0) break c;
   b = b + 4 | 0;
   e = e + -4 | 0;
   if (e >>> 0 <= 3) {
    i = 11;
    break;
   }
  } else i = 11; while (0);
  if ((i | 0) == 11) if (!e) {
   i = 16;
   break;
  }
  while (1) {
   if ((a[b >> 0] | 0) == g << 24 >> 24) break b;
   e = e + -1 | 0;
   if (!e) {
    i = 16;
    break;
   } else b = b + 1 | 0;
  }
 } while (0);
 if ((i | 0) == 16) b = 0;
 return b | 0;
}

function gd(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 j = k;
 k = k + 32 | 0;
 h = j + 12 | 0;
 i = j;
 e = d + 4 | 0;
 f = c[d >> 2] | 0;
 c[i >> 2] = 0;
 c[i + 4 >> 2] = 0;
 c[i + 8 >> 2] = 0;
 if (f >>> 0 > 4294967279) Oe(i);
 if (f >>> 0 < 11) {
  a[i + 11 >> 0] = f;
  if (!f) d = i; else {
   d = i;
   g = 6;
  }
 } else {
  g = f + 16 & -16;
  d = He(g) | 0;
  c[i >> 2] = d;
  c[i + 8 >> 2] = g | -2147483648;
  c[i + 4 >> 2] = f;
  g = 6;
 }
 if ((g | 0) == 6) ig(d | 0, e | 0, f | 0) | 0;
 a[d + f >> 0] = 0;
 Vb[b & 3](h, i);
 d = a[h + 11 >> 0] | 0;
 if (d << 24 >> 24 < 0) {
  g = c[h + 4 >> 2] | 0;
  d = Be(g + 4 | 0) | 0;
  c[d >> 2] = g;
  h = c[h >> 2] | 0;
  ig(d + 4 | 0, h | 0, g | 0) | 0;
  Ie(h);
 } else {
  g = d & 255;
  d = Be(g + 4 | 0) | 0;
  c[d >> 2] = g;
  ig(d + 4 | 0, h | 0, g | 0) | 0;
 }
 if ((a[i + 11 >> 0] | 0) >= 0) {
  k = j;
  return d | 0;
 }
 Ie(c[i >> 2] | 0);
 k = j;
 return d | 0;
}

function od(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0;
 j = k;
 k = k + 16 | 0;
 i = j;
 f = e + 4 | 0;
 g = c[e >> 2] | 0;
 c[i >> 2] = 0;
 c[i + 4 >> 2] = 0;
 c[i + 8 >> 2] = 0;
 if (g >>> 0 > 4294967279) Oe(i);
 if (g >>> 0 < 11) {
  a[i + 11 >> 0] = g;
  if (!g) e = i; else {
   e = i;
   h = 6;
  }
 } else {
  h = g + 16 & -16;
  e = He(h) | 0;
  c[i >> 2] = e;
  c[i + 8 >> 2] = h | -2147483648;
  c[i + 4 >> 2] = g;
  h = 6;
 }
 if ((h | 0) == 6) ig(e | 0, f | 0, g | 0) | 0;
 a[e + g >> 0] = 0;
 e = d + (c[b >> 2] | 0) | 0;
 f = e + 11 | 0;
 if ((a[f >> 0] | 0) < 0) {
  a[c[e >> 2] >> 0] = 0;
  c[e + 4 >> 2] = 0;
  Ve(e, 0);
  c[e >> 2] = c[i >> 2];
  c[e + 4 >> 2] = c[i + 4 >> 2];
  c[e + 8 >> 2] = c[i + 8 >> 2];
  k = j;
  return;
 } else {
  a[e >> 0] = 0;
  a[f >> 0] = 0;
  Ve(e, 0);
  c[e >> 2] = c[i >> 2];
  c[e + 4 >> 2] = c[i + 4 >> 2];
  c[e + 8 >> 2] = c[i + 8 >> 2];
  k = j;
  return;
 }
}

function Qf(b, d, e, f, g, h) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 var i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
 if (kf(b, c[d + 8 >> 2] | 0, h) | 0) nf(0, d, e, f, g); else {
  p = d + 52 | 0;
  i = a[p >> 0] | 0;
  j = d + 53 | 0;
  k = a[j >> 0] | 0;
  o = c[b + 12 >> 2] | 0;
  l = b + 16 + (o << 3) | 0;
  a[p >> 0] = 0;
  a[j >> 0] = 0;
  Uf(b + 16 | 0, d, e, f, g, h);
  a : do if ((o | 0) > 1) {
   m = d + 24 | 0;
   n = b + 8 | 0;
   o = d + 54 | 0;
   b = b + 24 | 0;
   do {
    if (a[o >> 0] | 0) break a;
    if (!(a[p >> 0] | 0)) {
     if (a[j >> 0] | 0) if (!(c[n >> 2] & 1)) break a;
    } else {
     if ((c[m >> 2] | 0) == 1) break a;
     if (!(c[n >> 2] & 2)) break a;
    }
    a[p >> 0] = 0;
    a[j >> 0] = 0;
    Uf(b, d, e, f, g, h);
    b = b + 8 | 0;
   } while (b >>> 0 < l >>> 0);
  } while (0);
  a[p >> 0] = i;
  a[j >> 0] = k;
 }
 return;
}

function Jd(a) {
 a = a | 0;
 Ja(35672, 37793);
 wa(35688, 37798, 1, 1, 0);
 Da(35696, 37803, 1, -128, 127);
 Da(35712, 37808, 1, -128, 127);
 Da(35704, 37820, 1, 0, 255);
 Da(35720, 37834, 2, -32768, 32767);
 Da(35728, 37840, 2, 0, 65535);
 Da(35736, 37855, 4, -2147483648, 2147483647);
 Da(35744, 37859, 4, 0, -1);
 Da(35752, 37872, 4, -2147483648, 2147483647);
 Da(35760, 37877, 4, 0, -1);
 Ba(35768, 37891, 4);
 Ba(35776, 37897, 8);
 Fa(35240, 37904);
 Fa(35368, 37916);
 Ga(35392, 4, 37949);
 Aa(35328, 37962);
 Ea(35416, 0, 37978);
 Ea(35424, 0, 38008);
 Ea(35432, 1, 38045);
 Ea(35440, 2, 38084);
 Ea(35448, 3, 38115);
 Ea(35456, 4, 38155);
 Ea(35464, 5, 38184);
 Ea(35472, 4, 38222);
 Ea(35480, 5, 38252);
 Ea(35424, 0, 38291);
 Ea(35432, 1, 38323);
 Ea(35440, 2, 38356);
 Ea(35448, 3, 38389);
 Ea(35456, 4, 38423);
 Ea(35464, 5, 38456);
 Ea(35488, 6, 38490);
 Ea(35496, 7, 38521);
 Ea(35504, 7, 38553);
 return;
}

function ue(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0;
 f = e + 16 | 0;
 g = c[f >> 2] | 0;
 if (!g) if (!(ve(e) | 0)) {
  g = c[f >> 2] | 0;
  h = 5;
 } else f = 0; else h = 5;
 a : do if ((h | 0) == 5) {
  j = e + 20 | 0;
  i = c[j >> 2] | 0;
  f = i;
  if ((g - i | 0) >>> 0 < d >>> 0) {
   f = Qb[c[e + 36 >> 2] & 15](e, b, d) | 0;
   break;
  }
  b : do if ((a[e + 75 >> 0] | 0) < 0 | (d | 0) == 0) {
   h = 0;
   g = b;
  } else {
   i = d;
   while (1) {
    g = i + -1 | 0;
    if ((a[b + g >> 0] | 0) == 10) break;
    if (!g) {
     h = 0;
     g = b;
     break b;
    } else i = g;
   }
   f = Qb[c[e + 36 >> 2] & 15](e, b, i) | 0;
   if (f >>> 0 < i >>> 0) break a;
   h = i;
   g = b + i | 0;
   d = d - i | 0;
   f = c[j >> 2] | 0;
  } while (0);
  ig(f | 0, g | 0, d | 0) | 0;
  c[j >> 2] = (c[j >> 2] | 0) + d;
  f = h + d | 0;
 } while (0);
 return f | 0;
}

function ke(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 do if (!b) b = 1; else {
  if (d >>> 0 < 128) {
   a[b >> 0] = d;
   b = 1;
   break;
  }
  if (!(c[c[(le() | 0) + 188 >> 2] >> 2] | 0)) if ((d & -128 | 0) == 57216) {
   a[b >> 0] = d;
   b = 1;
   break;
  } else {
   c[(Pd() | 0) >> 2] = 84;
   b = -1;
   break;
  }
  if (d >>> 0 < 2048) {
   a[b >> 0] = d >>> 6 | 192;
   a[b + 1 >> 0] = d & 63 | 128;
   b = 2;
   break;
  }
  if (d >>> 0 < 55296 | (d & -8192 | 0) == 57344) {
   a[b >> 0] = d >>> 12 | 224;
   a[b + 1 >> 0] = d >>> 6 & 63 | 128;
   a[b + 2 >> 0] = d & 63 | 128;
   b = 3;
   break;
  }
  if ((d + -65536 | 0) >>> 0 < 1048576) {
   a[b >> 0] = d >>> 18 | 240;
   a[b + 1 >> 0] = d >>> 12 & 63 | 128;
   a[b + 2 >> 0] = d >>> 6 & 63 | 128;
   a[b + 3 >> 0] = d & 63 | 128;
   b = 4;
   break;
  } else {
   c[(Pd() | 0) >> 2] = 84;
   b = -1;
   break;
  }
 } while (0);
 return b | 0;
}

function _e() {
 var a = 0, b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 f = k;
 k = k + 48 | 0;
 h = f + 32 | 0;
 e = f + 24 | 0;
 i = f + 16 | 0;
 g = f;
 f = f + 36 | 0;
 a = $e() | 0;
 if (a | 0) {
  d = c[a >> 2] | 0;
  if (d | 0) {
   a = d + 48 | 0;
   b = c[a >> 2] | 0;
   a = c[a + 4 >> 2] | 0;
   if (!((b & -256 | 0) == 1126902528 & (a | 0) == 1129074247)) {
    c[e >> 2] = 39296;
    af(39246, e);
   }
   if ((b | 0) == 1126902529 & (a | 0) == 1129074247) a = c[d + 44 >> 2] | 0; else a = d + 80 | 0;
   c[f >> 2] = a;
   e = c[d >> 2] | 0;
   a = c[e + 4 >> 2] | 0;
   if (Qb[c[(c[8878] | 0) + 16 >> 2] & 15](35512, e, f) | 0) {
    i = c[f >> 2] | 0;
    i = Ob[c[(c[i >> 2] | 0) + 8 >> 2] & 7](i) | 0;
    c[g >> 2] = 39296;
    c[g + 4 >> 2] = a;
    c[g + 8 >> 2] = i;
    af(39160, g);
   } else {
    c[i >> 2] = 39296;
    c[i + 4 >> 2] = a;
    af(39205, i);
   }
  }
 }
 af(39284, h);
}

function Tc(b, c, d, e) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
 p = k;
 k = k + 832 | 0;
 i = p + 792 | 0;
 j = p + 760 | 0;
 l = p + 600 | 0;
 m = p + 440 | 0;
 n = p + 280 | 0;
 o = p + 120 | 0;
 h = p;
 if (qc(l, d) | 0) {
  o = 0;
  k = p;
  return o | 0;
 }
 d = i + 32 | 0;
 g = i;
 f = g + 32 | 0;
 do {
  a[g >> 0] = a[b >> 0] | 0;
  g = g + 1 | 0;
  b = b + 1 | 0;
 } while ((g | 0) < (f | 0));
 if (c >>> 0 > 127) while (1) {
  f = d + 1 | 0;
  a[d >> 0] = c | 128;
  b = c >>> 7;
  if (c >>> 0 > 16383) {
   d = f;
   c = b;
  } else {
   d = f;
   break;
  }
 } else b = c;
 c = d + 1 | 0;
 a[d >> 0] = b;
 if (c >>> 0 > (i + 37 | 0) >>> 0) ha(36804, 36786, 123, 36854);
 Lc(i, c - i | 0, j);
 Fc(j);
 vc(m, j);
 gc(n, m);
 nc(o, l, n);
 pc(h, o);
 yc(e, h);
 o = 1;
 k = p;
 return o | 0;
}

function Fd(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
 l = b + 4 | 0;
 m = c[b >> 2] | 0;
 n = (c[l >> 2] | 0) - m | 0;
 f = n >> 5;
 e = f + 1 | 0;
 o = m;
 if (e >>> 0 > 134217727) Ze(b);
 k = b + 8 | 0;
 i = (c[k >> 2] | 0) - m | 0;
 j = i >> 4;
 e = i >> 5 >>> 0 < 67108863 ? (j >>> 0 < e >>> 0 ? e : j) : 134217727;
 do if (!e) j = 0; else if (e >>> 0 > 134217727) {
  o = ia(8) | 0;
  Le(o, 37333);
  c[o >> 2] = 36364;
  la(o | 0, 35608, 6);
 } else {
  j = He(e << 5) | 0;
  break;
 } while (0);
 i = j + (f << 5) | 0;
 g = j + (e << 5) | 0;
 h = i;
 e = d;
 f = h + 32 | 0;
 do {
  a[h >> 0] = a[e >> 0] | 0;
  h = h + 1 | 0;
  e = e + 1 | 0;
 } while ((h | 0) < (f | 0));
 if ((n | 0) > 0) ig(j | 0, o | 0, n | 0) | 0;
 c[b >> 2] = j;
 c[l >> 2] = i + 32;
 c[k >> 2] = g;
 if (!m) return;
 Ie(o);
 return;
}

function kg(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0;
 h = b + e | 0;
 d = d & 255;
 if ((e | 0) >= 67) {
  while (b & 3) {
   a[b >> 0] = d;
   b = b + 1 | 0;
  }
  f = h & -4 | 0;
  g = f - 64 | 0;
  i = d | d << 8 | d << 16 | d << 24;
  while ((b | 0) <= (g | 0)) {
   c[b >> 2] = i;
   c[b + 4 >> 2] = i;
   c[b + 8 >> 2] = i;
   c[b + 12 >> 2] = i;
   c[b + 16 >> 2] = i;
   c[b + 20 >> 2] = i;
   c[b + 24 >> 2] = i;
   c[b + 28 >> 2] = i;
   c[b + 32 >> 2] = i;
   c[b + 36 >> 2] = i;
   c[b + 40 >> 2] = i;
   c[b + 44 >> 2] = i;
   c[b + 48 >> 2] = i;
   c[b + 52 >> 2] = i;
   c[b + 56 >> 2] = i;
   c[b + 60 >> 2] = i;
   b = b + 64 | 0;
  }
  while ((b | 0) < (f | 0)) {
   c[b >> 2] = i;
   b = b + 4 | 0;
  }
 }
 while ((b | 0) < (h | 0)) {
  a[b >> 0] = d;
  b = b + 1 | 0;
 }
 return h - e | 0;
}

function wd(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, l = 0;
 l = k;
 k = k + 16 | 0;
 i = l;
 g = c[b >> 2] | 0;
 b = c[b + 4 >> 2] | 0;
 h = d + (b >> 1) | 0;
 if (b & 1) g = c[(c[h >> 2] | 0) + g >> 2] | 0;
 d = f + 4 | 0;
 f = c[f >> 2] | 0;
 c[i >> 2] = 0;
 c[i + 4 >> 2] = 0;
 c[i + 8 >> 2] = 0;
 if (f >>> 0 > 4294967279) Oe(i);
 if (f >>> 0 < 11) {
  a[i + 11 >> 0] = f;
  if (!f) b = i; else {
   b = i;
   j = 9;
  }
 } else {
  j = f + 16 & -16;
  b = He(j) | 0;
  c[i >> 2] = b;
  c[i + 8 >> 2] = j | -2147483648;
  c[i + 4 >> 2] = f;
  j = 9;
 }
 if ((j | 0) == 9) ig(b | 0, d | 0, f | 0) | 0;
 a[b + f >> 0] = 0;
 Wb[g & 7](h, e, i);
 if ((a[i + 11 >> 0] | 0) >= 0) {
  k = l;
  return;
 }
 Ie(c[i >> 2] | 0);
 k = l;
 return;
}

function Ue(b, d, e, f, g, h, i, j) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 j = j | 0;
 var l = 0, m = 0, n = 0, o = 0, p = 0;
 p = k;
 k = k + 16 | 0;
 o = p;
 if ((-18 - d | 0) >>> 0 < e >>> 0) Oe(b);
 if ((a[b + 11 >> 0] | 0) < 0) n = c[b >> 2] | 0; else n = b;
 if (d >>> 0 < 2147483623) {
  l = e + d | 0;
  m = d << 1;
  l = l >>> 0 < m >>> 0 ? m : l;
  l = l >>> 0 < 11 ? 11 : l + 16 & -16;
 } else l = -17;
 m = He(l) | 0;
 if (g | 0) De(m, n, g) | 0;
 if (i | 0) De(m + g | 0, j, i) | 0;
 e = f - h | 0;
 f = e - g | 0;
 if (f | 0) De(m + g + i | 0, n + g + h | 0, f) | 0;
 if ((d | 0) != 10) Ie(n);
 c[b >> 2] = m;
 c[b + 8 >> 2] = l | -2147483648;
 i = e + i | 0;
 c[b + 4 >> 2] = i;
 a[o >> 0] = 0;
 Ee(m + i | 0, o);
 k = p;
 return;
}

function ud(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0;
 j = k;
 k = k + 16 | 0;
 h = j;
 f = c[b >> 2] | 0;
 b = c[b + 4 >> 2] | 0;
 g = d + (b >> 1) | 0;
 if (b & 1) f = c[(c[g >> 2] | 0) + f >> 2] | 0;
 d = e + 4 | 0;
 e = c[e >> 2] | 0;
 c[h >> 2] = 0;
 c[h + 4 >> 2] = 0;
 c[h + 8 >> 2] = 0;
 if (e >>> 0 > 4294967279) Oe(h);
 if (e >>> 0 < 11) {
  a[h + 11 >> 0] = e;
  if (!e) b = h; else {
   b = h;
   i = 9;
  }
 } else {
  i = e + 16 & -16;
  b = He(i) | 0;
  c[h >> 2] = b;
  c[h + 8 >> 2] = i | -2147483648;
  c[h + 4 >> 2] = e;
  i = 9;
 }
 if ((i | 0) == 9) ig(b | 0, d | 0, e | 0) | 0;
 a[b + e >> 0] = 0;
 Vb[f & 3](g, h);
 if ((a[h + 11 >> 0] | 0) >= 0) {
  k = j;
  return;
 }
 Ie(c[h >> 2] | 0);
 k = j;
 return;
}

function Ae(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0;
 if ((c[d + 76 >> 2] | 0) < 0) i = 3; else if (!(Ud(d) | 0)) i = 3; else {
  f = b & 255;
  e = b & 255;
  if ((e | 0) == (a[d + 75 >> 0] | 0)) i = 10; else {
   g = d + 20 | 0;
   h = c[g >> 2] | 0;
   if (h >>> 0 < (c[d + 16 >> 2] | 0) >>> 0) {
    c[g >> 2] = h + 1;
    a[h >> 0] = f;
   } else i = 10;
  }
  if ((i | 0) == 10) e = ze(d, b) | 0;
  Vd(d);
 }
 do if ((i | 0) == 3) {
  h = b & 255;
  e = b & 255;
  if ((e | 0) != (a[d + 75 >> 0] | 0)) {
   f = d + 20 | 0;
   g = c[f >> 2] | 0;
   if (g >>> 0 < (c[d + 16 >> 2] | 0) >>> 0) {
    c[f >> 2] = g + 1;
    a[g >> 0] = h;
    break;
   }
  }
  e = ze(d, b) | 0;
 } while (0);
 return e | 0;
}

function Cd(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, l = 0;
 l = k;
 k = k + 16 | 0;
 j = l;
 h = c[b >> 2] | 0;
 g = f + 4 | 0;
 f = c[f >> 2] | 0;
 c[j >> 2] = 0;
 c[j + 4 >> 2] = 0;
 c[j + 8 >> 2] = 0;
 if (f >>> 0 > 4294967279) Oe(j);
 if (f >>> 0 < 11) {
  a[j + 11 >> 0] = f;
  if (!f) b = j; else {
   b = j;
   i = 6;
  }
 } else {
  i = f + 16 & -16;
  b = He(i) | 0;
  c[j >> 2] = b;
  c[j + 8 >> 2] = i | -2147483648;
  c[j + 4 >> 2] = f;
  i = 6;
 }
 if ((i | 0) == 6) ig(b | 0, g | 0, f | 0) | 0;
 a[b + f >> 0] = 0;
 b = Qb[h & 15](d, e, j) | 0;
 if ((a[j + 11 >> 0] | 0) >= 0) {
  k = l;
  return b | 0;
 }
 Ie(c[j >> 2] | 0);
 k = l;
 return b | 0;
}

function dd(b) {
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0;
 g = k;
 k = k + 80 | 0;
 f = g + 48 | 0;
 e = g + 16 | 0;
 d = g;
 Sc(f, e);
 c[b >> 2] = 0;
 c[b + 4 >> 2] = 0;
 c[b + 8 >> 2] = 0;
 c[b + 12 >> 2] = 0;
 c[b + 16 >> 2] = 0;
 c[b + 20 >> 2] = 0;
 Yc(d, f, 32, 0);
 a[b >> 0] = 0;
 a[b + 11 >> 0] = 0;
 Ve(b, 0);
 c[b >> 2] = c[d >> 2];
 c[b + 4 >> 2] = c[d + 4 >> 2];
 c[b + 8 >> 2] = c[d + 8 >> 2];
 Yc(d, e, 32, 0);
 e = b + 12 | 0;
 f = e + 11 | 0;
 if ((a[f >> 0] | 0) < 0) {
  a[c[e >> 2] >> 0] = 0;
  c[b + 16 >> 2] = 0;
 } else {
  a[e >> 0] = 0;
  a[f >> 0] = 0;
 }
 Ve(e, 0);
 c[e >> 2] = c[d >> 2];
 c[e + 4 >> 2] = c[d + 4 >> 2];
 c[e + 8 >> 2] = c[d + 8 >> 2];
 k = g;
 return;
}

function nf(b, d, e, f, g) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 a[d + 53 >> 0] = 1;
 do if ((c[d + 4 >> 2] | 0) == (f | 0)) {
  a[d + 52 >> 0] = 1;
  b = d + 16 | 0;
  f = c[b >> 2] | 0;
  if (!f) {
   c[b >> 2] = e;
   c[d + 24 >> 2] = g;
   c[d + 36 >> 2] = 1;
   if (!((g | 0) == 1 ? (c[d + 48 >> 2] | 0) == 1 : 0)) break;
   a[d + 54 >> 0] = 1;
   break;
  }
  if ((f | 0) != (e | 0)) {
   g = d + 36 | 0;
   c[g >> 2] = (c[g >> 2] | 0) + 1;
   a[d + 54 >> 0] = 1;
   break;
  }
  f = d + 24 | 0;
  b = c[f >> 2] | 0;
  if ((b | 0) == 2) {
   c[f >> 2] = g;
   b = g;
  }
  if ((b | 0) == 1 ? (c[d + 48 >> 2] | 0) == 1 : 0) a[d + 54 >> 0] = 1;
 } while (0);
 return;
}

function Xe(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 j = k;
 k = k + 16 | 0;
 h = j;
 i = j + 1 | 0;
 a[h >> 0] = d;
 g = b + 11 | 0;
 d = a[g >> 0] | 0;
 e = d << 24 >> 24 < 0;
 if (e) {
  f = c[b + 4 >> 2] | 0;
  d = (c[b + 8 >> 2] & 2147483647) + -1 | 0;
 } else {
  f = d & 255;
  d = 10;
 }
 if ((f | 0) == (d | 0)) {
  We(b, d, 1, d, d, 0, 0);
  if ((a[g >> 0] | 0) < 0) e = 8; else e = 7;
 } else if (e) e = 8; else e = 7;
 if ((e | 0) == 7) {
  a[g >> 0] = f + 1;
  d = b;
 } else if ((e | 0) == 8) {
  d = c[b >> 2] | 0;
  c[b + 4 >> 2] = f + 1;
 }
 b = d + f | 0;
 Ee(b, h);
 a[i >> 0] = 0;
 Ee(b + 1 | 0, i);
 k = j;
 return;
}

function hd(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0;
 i = k;
 k = k + 64 | 0;
 f = i + 12 | 0;
 g = i + 24 | 0;
 h = i;
 c[b >> 2] = 0;
 c[b + 4 >> 2] = 0;
 c[b + 8 >> 2] = 0;
 Xc(f, d);
 d = g;
 e = d + 32 | 0;
 do {
  a[d >> 0] = 0;
  d = d + 1 | 0;
 } while ((d | 0) < (e | 0));
 d = c[f >> 2] | 0;
 e = f + 4 | 0;
 Lc(d, (c[e >> 2] | 0) - d | 0, g);
 Yc(h, g, 32, 0);
 a[b >> 0] = 0;
 a[b + 11 >> 0] = 0;
 Ve(b, 0);
 c[b >> 2] = c[h >> 2];
 c[b + 4 >> 2] = c[h + 4 >> 2];
 c[b + 8 >> 2] = c[h + 8 >> 2];
 d = c[f >> 2] | 0;
 if (!d) {
  k = i;
  return;
 }
 c[e >> 2] = d;
 Ie(d);
 k = i;
 return;
}

function ff(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0;
 h = k;
 k = k + 64 | 0;
 g = h;
 if (kf(a, b, 0) | 0) b = 1; else if (!b) b = 0; else {
  b = of(b, 35536, 35520, 0) | 0;
  if (!b) b = 0; else {
   e = g + 4 | 0;
   f = e + 52 | 0;
   do {
    c[e >> 2] = 0;
    e = e + 4 | 0;
   } while ((e | 0) < (f | 0));
   c[g >> 2] = b;
   c[g + 8 >> 2] = a;
   c[g + 12 >> 2] = -1;
   c[g + 48 >> 2] = 1;
   Xb[c[(c[b >> 2] | 0) + 28 >> 2] & 7](b, g, c[d >> 2] | 0, 1);
   if ((c[g + 24 >> 2] | 0) == 1) {
    c[d >> 2] = c[g + 16 >> 2];
    b = 1;
   } else b = 0;
  }
 }
 k = h;
 return b | 0;
}

function Se(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0;
 l = k;
 k = k + 16 | 0;
 i = l;
 j = b + 11 | 0;
 f = a[j >> 0] | 0;
 g = f << 24 >> 24 < 0;
 if (g) h = (c[b + 8 >> 2] & 2147483647) + -1 | 0; else h = 10;
 do if (h >>> 0 < e >>> 0) {
  if (g) f = c[b + 4 >> 2] | 0; else f = f & 255;
  Ue(b, h, e - h | 0, f, 0, f, e, d);
 } else {
  if (g) f = c[b >> 2] | 0; else f = b;
  Te(f, d, e) | 0;
  a[i >> 0] = 0;
  Ee(f + e | 0, i);
  if ((a[j >> 0] | 0) < 0) {
   c[b + 4 >> 2] = e;
   break;
  } else {
   a[j >> 0] = e;
   break;
  }
 } while (0);
 k = l;
 return b | 0;
}

function ze(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0, l = 0, m = 0;
 m = k;
 k = k + 16 | 0;
 j = m;
 l = e & 255;
 a[j >> 0] = l;
 f = b + 16 | 0;
 g = c[f >> 2] | 0;
 if (!g) if (!(ve(b) | 0)) {
  g = c[f >> 2] | 0;
  h = 4;
 } else f = -1; else h = 4;
 do if ((h | 0) == 4) {
  i = b + 20 | 0;
  h = c[i >> 2] | 0;
  if (h >>> 0 < g >>> 0) {
   f = e & 255;
   if ((f | 0) != (a[b + 75 >> 0] | 0)) {
    c[i >> 2] = h + 1;
    a[h >> 0] = l;
    break;
   }
  }
  if ((Qb[c[b + 36 >> 2] & 15](b, j, 1) | 0) == 1) f = d[j >> 0] | 0; else f = -1;
 } while (0);
 k = m;
 return f | 0;
}

function kd(a) {
 a = a | 0;
 xa(35272, 35296, 35312, 0, 37053, 5, 37276, 0, 37276, 0, a | 0, 37141, 16);
 ya(35272, 1, 35824, 37053, 6, 2);
 a = He(8) | 0;
 c[a >> 2] = 2;
 c[a + 4 >> 2] = 0;
 za(35272, 37278, 3, 35828, 37154, 3, a | 0, 0);
 a = He(8) | 0;
 c[a >> 2] = 4;
 c[a + 4 >> 2] = 0;
 za(35272, 37288, 4, 32816, 37295, 5, a | 0, 0);
 a = He(8) | 0;
 c[a >> 2] = 7;
 c[a + 4 >> 2] = 0;
 za(35272, 37301, 2, 35840, 37093, 3, a | 0, 0);
 a = He(4) | 0;
 c[a >> 2] = 5;
 za(35272, 37306, 3, 35848, 37075, 7, a | 0, 0);
 a = He(4) | 0;
 c[a >> 2] = 8;
 za(35272, 37310, 4, 32832, 37115, 2, a | 0, 0);
 return;
}

function zd(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0;
 i = k;
 k = k + 16 | 0;
 h = i;
 f = c[d >> 2] | 0;
 g = f;
 if ((((c[d + 4 >> 2] | 0) - f | 0) / 12 | 0) >>> 0 <= e >>> 0) {
  c[b >> 2] = 1;
  k = i;
  return;
 }
 d = g + (e * 12 | 0) | 0;
 f = a[d + 11 >> 0] | 0;
 if (f << 24 >> 24 < 0) {
  f = c[g + (e * 12 | 0) + 4 >> 2] | 0;
  g = Be(f + 4 | 0) | 0;
  c[g >> 2] = f;
  d = c[d >> 2] | 0;
 } else {
  f = f & 255;
  g = Be(f + 4 | 0) | 0;
  c[g >> 2] = f;
 }
 ig(g + 4 | 0, d | 0, f | 0) | 0;
 c[h >> 2] = g;
 c[b >> 2] = Na(35240, h | 0) | 0;
 k = i;
 return;
}

function We(b, d, e, f, g, h, i) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 var j = 0, k = 0, l = 0;
 if ((-17 - d | 0) >>> 0 < e >>> 0) Oe(b);
 if ((a[b + 11 >> 0] | 0) < 0) l = c[b >> 2] | 0; else l = b;
 if (d >>> 0 < 2147483623) {
  j = e + d | 0;
  k = d << 1;
  j = j >>> 0 < k >>> 0 ? k : j;
  j = j >>> 0 < 11 ? 11 : j + 16 & -16;
 } else j = -17;
 k = He(j) | 0;
 if (g | 0) De(k, l, g) | 0;
 e = f - h - g | 0;
 if (e | 0) De(k + g + i | 0, l + g + h | 0, e) | 0;
 if ((d | 0) != 10) Ie(l);
 c[b >> 2] = k;
 c[b + 8 >> 2] = j | -2147483648;
 return;
}

function ce(b, c, d) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0;
 if (c >>> 0 > 0 | (c | 0) == 0 & b >>> 0 > 4294967295) {
  do {
   e = b;
   b = dg(b | 0, c | 0, 10, 0) | 0;
   f = c;
   c = U() | 0;
   g = _f(b | 0, c | 0, 10, 0) | 0;
   g = ag(e | 0, f | 0, g | 0, U() | 0) | 0;
   U() | 0;
   d = d + -1 | 0;
   a[d >> 0] = g & 255 | 48;
  } while (f >>> 0 > 9 | (f | 0) == 9 & e >>> 0 > 4294967295);
  c = b;
 } else c = b;
 if (c) do {
  g = c;
  c = (c >>> 0) / 10 | 0;
  d = d + -1 | 0;
  a[d >> 0] = g - (c * 10 | 0) | 48;
 } while (g >>> 0 >= 10);
 return d | 0;
}

function hf(b, d, e, f, g) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 do if (kf(b, c[d + 8 >> 2] | 0, g) | 0) mf(0, d, e, f); else if (kf(b, c[d >> 2] | 0, g) | 0) {
  if ((c[d + 16 >> 2] | 0) != (e | 0)) {
   b = d + 20 | 0;
   if ((c[b >> 2] | 0) != (e | 0)) {
    c[d + 32 >> 2] = f;
    c[b >> 2] = e;
    f = d + 40 | 0;
    c[f >> 2] = (c[f >> 2] | 0) + 1;
    if ((c[d + 36 >> 2] | 0) == 1) if ((c[d + 24 >> 2] | 0) == 2) a[d + 54 >> 0] = 1;
    c[d + 44 >> 2] = 4;
    break;
   }
  }
  if ((f | 0) == 1) c[d + 32 >> 2] = 1;
 } while (0);
 return;
}

function Hd(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 c[a >> 2] = 0;
 h = a + 4 | 0;
 c[h >> 2] = 0;
 e = a + 8 | 0;
 c[e >> 2] = 0;
 g = b + 4 | 0;
 d = (c[g >> 2] | 0) - (c[b >> 2] | 0) | 0;
 f = (d | 0) / 12 | 0;
 if (!d) return;
 if (f >>> 0 > 357913941) Ze(a);
 d = He(d) | 0;
 c[h >> 2] = d;
 c[a >> 2] = d;
 c[e >> 2] = d + (f * 12 | 0);
 a = c[b >> 2] | 0;
 b = c[g >> 2] | 0;
 if ((a | 0) == (b | 0)) return;
 do {
  Pe(d, a);
  a = a + 12 | 0;
  d = (c[h >> 2] | 0) + 12 | 0;
  c[h >> 2] = d;
 } while ((a | 0) != (b | 0));
 return;
}

function we(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0;
 h = k;
 k = k + 48 | 0;
 g = h + 32 | 0;
 f = h + 16 | 0;
 e = h;
 if (!(b & 4194368)) e = 0; else {
  c[e >> 2] = d;
  i = (c[e >> 2] | 0) + (4 - 1) & ~(4 - 1);
  d = c[i >> 2] | 0;
  c[e >> 2] = i + 4;
  e = d;
 }
 c[f >> 2] = a;
 c[f + 4 >> 2] = b | 32768;
 c[f + 8 >> 2] = e;
 e = ta(5, f | 0) | 0;
 if (!((b & 524288 | 0) == 0 | (e | 0) < 0)) {
  c[g >> 2] = e;
  c[g + 4 >> 2] = 2;
  c[g + 8 >> 2] = 1;
  ra(221, g | 0) | 0;
 }
 i = Od(e) | 0;
 k = h;
 return i | 0;
}

function $c(a) {
 a = a | 0;
 var b = 0;
 Ca(37008, 6, 32768, 37031, 1, 4);
 Ca(37039, 1, 35800, 37053, 4, 14);
 Ca(37056, 3, 35804, 37075, 6, 1);
 Ca(37080, 2, 35816, 37093, 1, 1);
 Ca(37097, 4, 32800, 37115, 1, 4);
 kd(37121);
 Ha(35232, 37134, 37139, 1, 37141, 15);
 a = He(4) | 0;
 c[a >> 2] = 12;
 b = He(4) | 0;
 c[b >> 2] = 12;
 Ia(35232, 37144, 35240, 37093, 2, a | 0, 35240, 37154, 2, b | 0);
 b = He(4) | 0;
 c[b >> 2] = 0;
 a = He(4) | 0;
 c[a >> 2] = 0;
 Ia(35232, 37159, 35240, 37093, 2, b | 0, 35240, 37154, 2, a | 0);
 va(35232);
 return;
}

function je(a, b) {
 a = +a;
 b = b | 0;
 var d = 0, e = 0, f = 0;
 h[j >> 3] = a;
 d = c[j >> 2] | 0;
 e = c[j + 4 >> 2] | 0;
 f = fg(d | 0, e | 0, 52) | 0;
 U() | 0;
 switch (f & 2047) {
 case 0:
  {
   if (a != 0.0) {
    a = +je(a * 18446744073709551616.0, b);
    d = (c[b >> 2] | 0) + -64 | 0;
   } else d = 0;
   c[b >> 2] = d;
   break;
  }
 case 2047:
  break;
 default:
  {
   c[b >> 2] = (f & 2047) + -1022;
   c[j >> 2] = d;
   c[j + 4 >> 2] = e & -2146435073 | 1071644672;
   a = +h[j >> 3];
  }
 }
 return +a;
}

function Sd(b) {
 b = b | 0;
 var d = 0, e = 0, f = 0;
 f = b;
 a : do if (!(f & 3)) e = 5; else {
  d = f;
  while (1) {
   if (!(a[b >> 0] | 0)) {
    b = d;
    break a;
   }
   b = b + 1 | 0;
   d = b;
   if (!(d & 3)) {
    e = 5;
    break;
   }
  }
 } while (0);
 if ((e | 0) == 5) {
  while (1) {
   d = c[b >> 2] | 0;
   if (!((d & -2139062144 ^ -2139062144) & d + -16843009)) b = b + 4 | 0; else break;
  }
  if ((d & 255) << 24 >> 24) do b = b + 1 | 0; while ((a[b >> 0] | 0) != 0);
 }
 return b - f | 0;
}

function oe(b, e) {
 b = b | 0;
 e = e | 0;
 var f = 0, g = 0;
 f = 0;
 while (1) {
  if ((d[33328 + f >> 0] | 0) == (b | 0)) {
   g = 4;
   break;
  }
  f = f + 1 | 0;
  if ((f | 0) == 87) {
   b = 87;
   g = 5;
   break;
  }
 }
 if ((g | 0) == 4) if (!f) f = 33424; else {
  b = f;
  g = 5;
 }
 if ((g | 0) == 5) {
  f = 33424;
  do {
   do {
    g = f;
    f = f + 1 | 0;
   } while ((a[g >> 0] | 0) != 0);
   b = b + -1 | 0;
  } while ((b | 0) != 0);
 }
 return pe(f, c[e + 20 >> 2] | 0) | 0;
}

function fd(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0, j = 0;
 f = k;
 k = k + 112 | 0;
 h = f;
 j = f + 80 | 0;
 i = f + 48 | 0;
 g = f + 32 | 0;
 c[b >> 2] = 0;
 c[b + 4 >> 2] = 0;
 c[b + 8 >> 2] = 0;
 Wc(d, j, 32, 0, h) | 0;
 Wc(e, i, 32, 0, h) | 0;
 Uc(j, i, h);
 Yc(g, h, 32, 0);
 a[b >> 0] = 0;
 a[b + 11 >> 0] = 0;
 Ve(b, 0);
 c[b >> 2] = c[g >> 2];
 c[b + 4 >> 2] = c[g + 4 >> 2];
 c[b + 8 >> 2] = c[g + 8 >> 2];
 k = f;
 return;
}

function Qc(a, b) {
 a = a | 0;
 b = b | 0;
 if ((c[9964] | 0) != 1) ha(36722, 36694, 93, 36750);
 c[9964] = 2;
 if (!a) if ((c[9964] | 0) == 2) {
  c[9964] = 1;
  return;
 } else ha(36772, 36694, 98, 36750);
 Kc(40464);
 if (a >>> 0 >= 137) do {
  ig(b | 0, 40464, 136) | 0;
  b = b + 136 | 0;
  a = a + -136 | 0;
  Kc(40464);
 } while (a >>> 0 >= 137);
 ig(b | 0, 40464, a | 0) | 0;
 if ((c[9964] | 0) == 2) {
  c[9964] = 1;
  return;
 } else ha(36772, 36694, 108, 36750);
}

function Yc(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0;
 c[b >> 2] = 0;
 c[b + 4 >> 2] = 0;
 c[b + 8 >> 2] = 0;
 if ((f | 0) == 0 & (g | 0) == 0) return;
 h = 0;
 i = 0;
 do {
  j = e + i | 0;
  Xe(b, a[36991 + ((d[j >> 0] | 0) >>> 4) >> 0] | 0);
  Xe(b, a[36991 + (a[j >> 0] & 15) >> 0] | 0);
  i = $f(i | 0, h | 0, 1, 0) | 0;
  h = U() | 0;
 } while (h >>> 0 < g >>> 0 | (h | 0) == (g | 0) & i >>> 0 < f >>> 0);
 return;
}

function vd(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0;
 i = b + 4 | 0;
 f = c[i >> 2] | 0;
 g = c[b >> 2] | 0;
 h = (f - g | 0) / 12 | 0;
 if (h >>> 0 < d >>> 0) {
  Dd(b, d - h | 0, e);
  return;
 }
 if (h >>> 0 <= d >>> 0) return;
 b = g + (d * 12 | 0) | 0;
 if ((b | 0) != (f | 0)) do {
  f = f + -12 | 0;
  if ((a[f + 11 >> 0] | 0) < 0) Ie(c[f >> 2] | 0);
 } while ((f | 0) != (b | 0));
 c[i >> 2] = b;
 return;
}

function ee(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0;
 g = k;
 k = k + 256 | 0;
 f = g;
 if ((c | 0) > (d | 0) & (e & 73728 | 0) == 0) {
  e = c - d | 0;
  kg(f | 0, b << 24 >> 24 | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0;
  if (e >>> 0 > 255) {
   b = c - d | 0;
   do {
    Zd(a, f, 256);
    e = e + -256 | 0;
   } while (e >>> 0 > 255);
   e = b & 255;
  }
  Zd(a, f, e);
 }
 k = g;
 return;
}

function Oc() {
 var a = 0, b = 0, d = 0, e = 0, f = 0;
 f = k;
 k = k + 16 | 0;
 e = we(36667, 524544, f) | 0;
 a = ye(e, 40464, 32) | 0;
 if ((a | 0) != 32) {
  b = 32;
  d = 40464;
  do {
   if ((a | 0) >= 0) {
    b = b - a | 0;
    d = (a | 0) == 0 ? d : d + a | 0;
   }
   a = ye(e, d, b) | 0;
  } while ((b | 0) != (a | 0));
 }
 Wd(e) | 0;
 if (!(c[9964] | 0)) {
  c[9964] = 1;
  k = f;
  return;
 } else ha(36680, 36694, 86, 36710);
}

function Sf(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0;
 a : do if (kf(b, c[d + 8 >> 2] | 0, 0) | 0) lf(0, d, e, f); else {
  h = c[b + 12 >> 2] | 0;
  g = b + 16 + (h << 3) | 0;
  Tf(b + 16 | 0, d, e, f);
  if ((h | 0) > 1) {
   h = d + 54 | 0;
   b = b + 24 | 0;
   do {
    Tf(b, d, e, f);
    if (a[h >> 0] | 0) break a;
    b = b + 8 | 0;
   } while (b >>> 0 < g >>> 0);
  }
 } while (0);
 return;
}

function lf(b, d, e, f) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0;
 b = d + 16 | 0;
 g = c[b >> 2] | 0;
 do if (!g) {
  c[b >> 2] = e;
  c[d + 24 >> 2] = f;
  c[d + 36 >> 2] = 1;
 } else {
  if ((g | 0) != (e | 0)) {
   f = d + 36 | 0;
   c[f >> 2] = (c[f >> 2] | 0) + 1;
   c[d + 24 >> 2] = 2;
   a[d + 54 >> 0] = 1;
   break;
  }
  b = d + 24 | 0;
  if ((c[b >> 2] | 0) == 2) c[b >> 2] = f;
 } while (0);
 return;
}

function cd(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0;
 b = k;
 k = k + 32 | 0;
 e = b;
 Ub[a & 31](e);
 a = He(24) | 0;
 c[a >> 2] = c[e >> 2];
 c[a + 4 >> 2] = c[e + 4 >> 2];
 c[a + 8 >> 2] = c[e + 8 >> 2];
 c[e >> 2] = 0;
 c[e + 4 >> 2] = 0;
 c[e + 8 >> 2] = 0;
 d = a + 12 | 0;
 e = e + 12 | 0;
 c[d >> 2] = c[e >> 2];
 c[d + 4 >> 2] = c[e + 4 >> 2];
 c[d + 8 >> 2] = c[e + 8 >> 2];
 k = b;
 return a | 0;
}

function Qe(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0, i = 0;
 g = k;
 k = k + 16 | 0;
 f = g;
 if (e >>> 0 > 4294967279) Oe(b);
 if (e >>> 0 < 11) a[b + 11 >> 0] = e; else {
  i = e + 16 & -16;
  h = He(i) | 0;
  c[b >> 2] = h;
  c[b + 8 >> 2] = i | -2147483648;
  c[b + 4 >> 2] = e;
  b = h;
 }
 De(b, d, e) | 0;
 a[f >> 0] = 0;
 Ee(b + e | 0, f);
 k = g;
 return;
}

function te(b, c) {
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 d = a[b >> 0] | 0;
 e = a[c >> 0] | 0;
 if (d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24) b = e; else {
  do {
   b = b + 1 | 0;
   c = c + 1 | 0;
   d = a[b >> 0] | 0;
   e = a[c >> 0] | 0;
  } while (!(d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24));
  b = e;
 }
 return (d & 255) - (b & 255) | 0;
}

function nd(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 d = d + (c[b >> 2] | 0) | 0;
 b = a[d + 11 >> 0] | 0;
 if (b << 24 >> 24 < 0) {
  f = c[d + 4 >> 2] | 0;
  e = Be(f + 4 | 0) | 0;
  c[e >> 2] = f;
  b = c[d >> 2] | 0;
  d = f;
 } else {
  f = b & 255;
  e = Be(f + 4 | 0) | 0;
  c[e >> 2] = f;
  b = d;
  d = f;
 }
 ig(e + 4 | 0, b | 0, d | 0) | 0;
 return e | 0;
}

function ve(b) {
 b = b | 0;
 var d = 0, e = 0;
 d = b + 74 | 0;
 e = a[d >> 0] | 0;
 a[d >> 0] = e + 255 | e;
 d = c[b >> 2] | 0;
 if (!(d & 8)) {
  c[b + 8 >> 2] = 0;
  c[b + 4 >> 2] = 0;
  e = c[b + 44 >> 2] | 0;
  c[b + 28 >> 2] = e;
  c[b + 20 >> 2] = e;
  c[b + 16 >> 2] = e + (c[b + 48 >> 2] | 0);
  b = 0;
 } else {
  c[b >> 2] = d | 32;
  b = -1;
 }
 return b | 0;
}

function qd(b) {
 b = b | 0;
 var d = 0, e = 0, f = 0;
 if (!b) return;
 e = c[b >> 2] | 0;
 if (e | 0) {
  f = b + 4 | 0;
  d = c[f >> 2] | 0;
  if ((d | 0) == (e | 0)) d = e; else {
   do {
    d = d + -12 | 0;
    if ((a[d + 11 >> 0] | 0) < 0) Ie(c[d >> 2] | 0);
   } while ((d | 0) != (e | 0));
   d = c[b >> 2] | 0;
  }
  c[f >> 2] = e;
  Ie(d);
 }
 Ie(b);
 return;
}

function Uc(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 i = k;
 k = k + 592 | 0;
 d = i + 560 | 0;
 e = i + 440 | 0;
 f = i + 280 | 0;
 g = i + 120 | 0;
 h = i;
 if (!(Jc(b) | 0)) {
  Lc(a, 32, d);
  Dc(e, d);
  Cc(f, e);
  kc(g, f);
  Ac(h, b, g);
  yc(c, h);
  k = i;
  return;
 } else ha(36875, 36786, 346, 37056);
}

function Nd(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0;
 f = k;
 k = k + 32 | 0;
 g = f;
 e = f + 20 | 0;
 c[g >> 2] = c[a + 60 >> 2];
 c[g + 4 >> 2] = 0;
 c[g + 8 >> 2] = b;
 c[g + 12 >> 2] = e;
 c[g + 16 >> 2] = d;
 if ((Od(pa(140, g | 0) | 0) | 0) < 0) {
  c[e >> 2] = -1;
  a = -1;
 } else a = c[e >> 2] | 0;
 k = f;
 return a | 0;
}

function Cc(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = k;
 k = k + 128 | 0;
 d = c;
 hc(a, b);
 b = a + 120 | 0;
 ec(d, a, b);
 h = d + 40 | 0;
 g = a + 40 | 0;
 e = a + 80 | 0;
 ec(h, g, e);
 f = d + 80 | 0;
 ec(f, e, b);
 hc(a, d);
 ec(d, a, b);
 ec(h, g, e);
 ec(f, e, b);
 hc(a, d);
 k = c;
 return;
}

function Sc(b, c) {
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 f = k;
 k = k + 224 | 0;
 g = f;
 d = f + 64 | 0;
 Fe(39860);
 Qc(64, g);
 zc(g);
 e = c;
 h = e + 32 | 0;
 do {
  a[e >> 0] = a[g >> 0] | 0;
  e = e + 1 | 0;
  g = g + 1 | 0;
 } while ((e | 0) < (h | 0));
 vc(d, c);
 tc(b, d);
 Ge(39860);
 k = f;
 return;
}

function yc(b, c) {
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 d = k;
 k = k + 176 | 0;
 e = d + 144 | 0;
 h = d + 96 | 0;
 f = d + 48 | 0;
 g = d;
 uc(h, c + 80 | 0);
 ec(f, c, h);
 ec(g, c + 40 | 0, h);
 sc(b, g);
 sc(e, f);
 c = b + 31 | 0;
 a[c >> 0] = a[c >> 0] ^ a[e >> 0] << 7 & 255;
 k = d;
 return;
}

function tc(b, c) {
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 d = k;
 k = k + 176 | 0;
 e = d + 144 | 0;
 h = d + 96 | 0;
 f = d + 48 | 0;
 g = d;
 uc(h, c + 80 | 0);
 ec(f, c, h);
 ec(g, c + 40 | 0, h);
 sc(b, g);
 sc(e, f);
 c = b + 31 | 0;
 a[c >> 0] = a[c >> 0] ^ a[e >> 0] << 7 & 255;
 k = d;
 return;
}

function Uf(a, b, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0;
 i = c[a + 4 >> 2] | 0;
 h = i >> 8;
 if (i & 1) h = c[(c[e >> 2] | 0) + h >> 2] | 0;
 a = c[a >> 2] | 0;
 Zb[c[(c[a >> 2] | 0) + 20 >> 2] & 7](a, b, d, e + h | 0, (i & 2 | 0) == 0 ? 2 : f, g);
 return;
}

function jg(b, c, d) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0;
 if ((c | 0) < (b | 0) & (b | 0) < (c + d | 0)) {
  e = b;
  c = c + d | 0;
  b = b + d | 0;
  while ((d | 0) > 0) {
   b = b - 1 | 0;
   c = c - 1 | 0;
   d = d - 1 | 0;
   a[b >> 0] = a[c >> 0] | 0;
  }
  b = e;
 } else ig(b, c, d) | 0;
 return b | 0;
}

function Zf(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 f = a & 65535;
 e = b & 65535;
 c = L(e, f) | 0;
 d = a >>> 16;
 a = (c >>> 16) + (L(e, d) | 0) | 0;
 e = b >>> 16;
 b = L(e, f) | 0;
 return (T((a >>> 16) + (L(e, d) | 0) + (((a & 65535) + b | 0) >>> 16) | 0), a + b << 16 | c & 65535 | 0) | 0;
}

function Vf(a, b, d, e, f) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0;
 h = c[a + 4 >> 2] | 0;
 g = h >> 8;
 if (h & 1) g = c[(c[d >> 2] | 0) + g >> 2] | 0;
 a = c[a >> 2] | 0;
 Yb[c[(c[a >> 2] | 0) + 24 >> 2] & 3](a, b, d + g | 0, (h & 2 | 0) == 0 ? 2 : e, f);
 return;
}

function ng(a) {
 a = a | 0;
 var b = 0, d = 0;
 d = c[i >> 2] | 0;
 b = d + a | 0;
 if ((a | 0) > 0 & (b | 0) < (d | 0) | (b | 0) < 0) {
  V() | 0;
  oa(12);
  return -1;
 }
 c[i >> 2] = b;
 if ((b | 0) > (S() | 0)) if (!(R() | 0)) {
  c[i >> 2] = d;
  oa(12);
  return -1;
 }
 return d | 0;
}

function Tf(a, b, d, e) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0;
 g = c[a + 4 >> 2] | 0;
 f = g >> 8;
 if (g & 1) f = c[(c[d >> 2] | 0) + f >> 2] | 0;
 a = c[a >> 2] | 0;
 Xb[c[(c[a >> 2] | 0) + 28 >> 2] & 7](a, b, d + f | 0, (g & 2 | 0) == 0 ? 2 : e);
 return;
}

function ae(b, c, e, f) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 f = f | 0;
 if (!((b | 0) == 0 & (c | 0) == 0)) do {
  e = e + -1 | 0;
  a[e >> 0] = d[33312 + (b & 15) >> 0] | 0 | f;
  b = fg(b | 0, c | 0, 4) | 0;
  c = U() | 0;
 } while (!((b | 0) == 0 & (c | 0) == 0));
 return e | 0;
}

function _d(b) {
 b = b | 0;
 var d = 0, e = 0;
 if (!(Rd(a[c[b >> 2] >> 0] | 0) | 0)) d = 0; else {
  d = 0;
  do {
   e = c[b >> 2] | 0;
   d = (d * 10 | 0) + -48 + (a[e >> 0] | 0) | 0;
   e = e + 1 | 0;
   c[b >> 2] = e;
  } while ((Rd(a[e >> 0] | 0) | 0) != 0);
 }
 return d | 0;
}

function Pe(b, d) {
 b = b | 0;
 d = d | 0;
 c[b >> 2] = 0;
 c[b + 4 >> 2] = 0;
 c[b + 8 >> 2] = 0;
 if ((a[d + 11 >> 0] | 0) < 0) Qe(b, c[d >> 2] | 0, c[d + 4 >> 2] | 0); else {
  c[b >> 2] = c[d >> 2];
  c[b + 4 >> 2] = c[d + 4 >> 2];
  c[b + 8 >> 2] = c[d + 8 >> 2];
 }
 return;
}

function jd(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0;
 e = k;
 k = k + 96 | 0;
 f = e;
 h = e + 64 | 0;
 g = e + 32 | 0;
 Wc(b, h, 32, 0, f) | 0;
 Wc(d, g, 32, 0, f) | 0;
 Tc(h, c, g, f) | 0;
 Yc(a, f, 32, 0);
 k = e;
 return;
}

function Lc(b, c, d) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0, f = 0;
 e = k;
 k = k + 208 | 0;
 f = e;
 Nc(b, c, f);
 b = f;
 c = d + 32 | 0;
 do {
  a[d >> 0] = a[b >> 0] | 0;
  d = d + 1 | 0;
  b = b + 1 | 0;
 } while ((d | 0) < (c | 0));
 k = e;
 return;
}

function qf(a, b, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 if (kf(a, c[b + 8 >> 2] | 0, g) | 0) nf(0, b, d, e, f); else {
  a = c[a + 8 >> 2] | 0;
  Zb[c[(c[a >> 2] | 0) + 20 >> 2] & 7](a, b, d, e, f, g);
 }
 return;
}

function wf() {
 var a = 0, b = 0;
 a = $e() | 0;
 if (a | 0) {
  a = c[a >> 2] | 0;
  if (a | 0) {
   b = a + 48 | 0;
   if ((c[b >> 2] & -256 | 0) == 1126902528 ? (c[b + 4 >> 2] | 0) == 1129074247 : 0) xf(c[a + 12 >> 2] | 0);
  }
 }
 xf(yf() | 0);
}

function Xf(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 f = k;
 k = k + 16 | 0;
 e = f;
 c[e >> 2] = c[d >> 2];
 a = Qb[c[(c[a >> 2] | 0) + 16 >> 2] & 15](a, b, e) | 0;
 if (a) c[d >> 2] = c[e >> 2];
 k = f;
 return a & 1 | 0;
}

function be(b, c, d) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 if (!((b | 0) == 0 & (c | 0) == 0)) do {
  d = d + -1 | 0;
  a[d >> 0] = b & 7 | 48;
  b = fg(b | 0, c | 0, 3) | 0;
  c = U() | 0;
 } while (!((b | 0) == 0 & (c | 0) == 0));
 return d | 0;
}

function Je(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0;
 e = Sd(b) | 0;
 d = He(e + 13 | 0) | 0;
 c[d >> 2] = e;
 c[d + 4 >> 2] = e;
 c[d + 8 >> 2] = 0;
 d = Ke(d) | 0;
 ig(d | 0, b | 0, e + 1 | 0) | 0;
 c[a >> 2] = d;
 return;
}

function td(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0;
 d = a + 4 | 0;
 e = c[d >> 2] | 0;
 if ((e | 0) == (c[a + 8 >> 2] | 0)) {
  Ed(a, b);
  return;
 } else {
  Pe(e, b);
  c[d >> 2] = (c[d >> 2] | 0) + 12;
  return;
 }
}

function Re(b, d) {
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 if ((b | 0) != (d | 0)) {
  e = a[d + 11 >> 0] | 0;
  f = e << 24 >> 24 < 0;
  Se(b, f ? c[d >> 2] | 0 : d, f ? c[d + 4 >> 2] | 0 : e & 255) | 0;
 }
 return b | 0;
}

function sf(a, b, d, e) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 if (kf(a, c[b + 8 >> 2] | 0, 0) | 0) lf(0, b, d, e); else {
  a = c[a + 8 >> 2] | 0;
  Xb[c[(c[a >> 2] | 0) + 28 >> 2] & 7](a, b, d, e);
 }
 return;
}

function ye(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 e = k;
 k = k + 16 | 0;
 f = e;
 c[f >> 2] = a;
 c[f + 4 >> 2] = b;
 c[f + 8 >> 2] = d;
 d = Od(sa(3, f | 0) | 0) | 0;
 k = e;
 return d | 0;
}

function _f(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0, f = 0;
 e = a;
 f = c;
 c = Zf(e, f) | 0;
 a = U() | 0;
 return (T((L(b, f) | 0) + (L(d, e) | 0) + a | a & 0 | 0), c | 0 | 0) | 0;
}

function kc(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 d = b + 120 | 0;
 ec(a, b, d);
 c = b + 40 | 0;
 e = b + 80 | 0;
 ec(a + 40 | 0, c, e);
 ec(a + 80 | 0, e, d);
 ec(a + 120 | 0, b, c);
 return;
}

function Ad(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 e = k;
 k = k + 16 | 0;
 f = e;
 Wb[c[a >> 2] & 7](f, b, d);
 La(c[f >> 2] | 0);
 d = c[f >> 2] | 0;
 Ka(d | 0);
 k = e;
 return d | 0;
}

function eg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if ((c | 0) < 32) {
  T(b >> c | 0);
  return a >>> c | (b & (1 << c) - 1) << 32 - c;
 }
 T(((b | 0) < 0 ? -1 : 0) | 0);
 return b >> c - 32 | 0;
}

function yd(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0;
 d = c[a >> 2] | 0;
 e = c[a + 4 >> 2] | 0;
 a = b + (e >> 1) | 0;
 if (e & 1) d = c[(c[a >> 2] | 0) + d >> 2] | 0;
 return Ob[d & 7](a) | 0;
}

function He(a) {
 a = a | 0;
 var b = 0;
 b = (a | 0) == 0 ? 1 : a;
 while (1) {
  a = Be(b) | 0;
  if (a | 0) break;
  a = Wf() | 0;
  if (!a) {
   a = 0;
   break;
  }
  Tb[a & 3]();
 }
 return a | 0;
}

function Ef(a) {
 a = a | 0;
 var b = 0, d = 0;
 if (Me(a) | 0) {
  a = Ff(c[a >> 2] | 0) | 0;
  d = a + 8 | 0;
  b = c[d >> 2] | 0;
  c[d >> 2] = b + -1;
  if ((b + -1 | 0) < 0) Ie(a);
 }
 return;
}

function md(b) {
 b = b | 0;
 var d = 0;
 if (!b) return;
 d = b + 12 | 0;
 if ((a[d + 11 >> 0] | 0) < 0) Ie(c[d >> 2] | 0);
 if ((a[b + 11 >> 0] | 0) < 0) Ie(c[b >> 2] | 0);
 Ie(b);
 return;
}

function gg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if ((c | 0) < 32) {
  T(b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c | 0);
  return a << c;
 }
 T(a << c - 32 | 0);
 return 0;
}

function Wd(a) {
 a = a | 0;
 var b = 0, d = 0;
 b = k;
 k = k + 16 | 0;
 d = b;
 c[d >> 2] = Qd(a) | 0;
 a = ua(6, d | 0) | 0;
 a = Od((a | 0) == -4 ? 0 : a) | 0;
 k = b;
 return a | 0;
}

function mf(a, b, d, e) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 if ((c[b + 4 >> 2] | 0) == (d | 0)) {
  a = b + 28 | 0;
  if ((c[a >> 2] | 0) != 1) c[a >> 2] = e;
 }
 return;
}

function tg(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 return Sb[a & 1](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0) | 0;
}

function fg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if ((c | 0) < 32) {
  T(b >>> c | 0);
  return a >>> c | (b & (1 << c) - 1) << 32 - c;
 }
 T(0);
 return b >>> c - 32 | 0;
}

function ld() {
 var a = 0;
 a = He(24) | 0;
 c[a >> 2] = 0;
 c[a + 4 >> 2] = 0;
 c[a + 8 >> 2] = 0;
 c[a + 12 >> 2] = 0;
 c[a + 16 >> 2] = 0;
 c[a + 20 >> 2] = 0;
 return a | 0;
}

function pc(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0;
 c = b + 120 | 0;
 ec(a, b, c);
 d = b + 80 | 0;
 ec(a + 40 | 0, b + 40 | 0, d);
 ec(a + 80 | 0, d, c);
 return;
}

function Ld(a) {
 a = a | 0;
 var b = 0, d = 0;
 b = k;
 k = k + 16 | 0;
 d = b;
 c[d >> 2] = Qd(c[a + 60 >> 2] | 0) | 0;
 a = Od(ua(6, d | 0) | 0) | 0;
 k = b;
 return a | 0;
}

function $e() {
 var a = 0, b = 0;
 a = k;
 k = k + 16 | 0;
 if (!(Ta(40452, 2) | 0)) {
  b = Ra(c[10114] | 0) | 0;
  k = a;
  return b | 0;
 } else af(39435, a);
 return 0;
}

function Ag(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 Zb[a & 7](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0);
}

function gf(a, b, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 if (kf(a, c[b + 8 >> 2] | 0, g) | 0) nf(0, b, d, e, f);
 return;
}

function xe(a) {
 a = a | 0;
 var b = 0, c = 0;
 b = (Sd(a) | 0) + 1 | 0;
 c = Be(b) | 0;
 if (!c) a = 0; else a = ig(c | 0, a | 0, b | 0) | 0;
 return a | 0;
}

function ag(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
 return (T(d | 0), a - c >>> 0 | 0) | 0;
}

function $f(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 c = a + c >>> 0;
 return (T(b + d + (c >>> 0 < a >>> 0 | 0) >>> 0 | 0), c | 0) | 0;
}

function af(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0;
 d = k;
 k = k + 16 | 0;
 c[d >> 2] = b;
 b = c[8965] | 0;
 Xd(b, a, d) | 0;
 Ae(10, b) | 0;
 Oa();
}

function zg(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 Yb[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0);
}

function vf(a) {
 a = a | 0;
 var b = 0;
 b = k;
 k = k + 16 | 0;
 Ce(a);
 if (!(Ua(c[10114] | 0, 0) | 0)) {
  k = b;
  return;
 } else af(39534, b);
}

function qe(a, b) {
 a = a | 0;
 b = b | 0;
 if (!b) b = 0; else b = re(c[b >> 2] | 0, c[b + 4 >> 2] | 0, a) | 0;
 return ((b | 0) == 0 ? a : b) | 0;
}

function sg(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 return Rb[a & 3](b | 0, c | 0, d | 0, e | 0) | 0;
}

function jf(a, b, d, e) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 if (kf(a, c[b + 8 >> 2] | 0, 0) | 0) lf(0, b, d, e);
 return;
}

function Ec(b) {
 b = b | 0;
 var c = 0;
 c = b + 32 | 0;
 do {
  a[b >> 0] = 0;
  b = b + 1 | 0;
 } while ((b | 0) < (c | 0));
 return;
}

function Of(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if (kf(a, b, 0) | 0) a = 1; else a = kf(b, 35680, 0) | 0;
 return a | 0;
}

function Pc() {
 if ((c[9964] | 0) == 1) {
  c[9964] = 0;
  kg(40464, 0, 200) | 0;
  return;
 } else ha(36722, 36694, 76, 36736);
}

function yg(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 Xb[a & 7](b | 0, c | 0, d | 0, e | 0);
}

function uf() {
 var a = 0;
 a = k;
 k = k + 16 | 0;
 if (!(Sa(40456, 17) | 0)) {
  k = a;
  return;
 } else af(39484, a);
}

function Gg(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 P(5);
 return 0;
}

function rg(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 return Qb[a & 15](b | 0, c | 0, d | 0) | 0;
}

function Bd(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 Re((c[a >> 2] | 0) + (b * 12 | 0) | 0, d) | 0;
 return 1;
}

function sd() {
 var a = 0;
 a = He(12) | 0;
 c[a >> 2] = 0;
 c[a + 4 >> 2] = 0;
 c[a + 8 >> 2] = 0;
 return a | 0;
}

function Od(a) {
 a = a | 0;
 if (a >>> 0 > 4294963200) {
  c[(Pd() | 0) >> 2] = 0 - a;
  a = -1;
 }
 return a | 0;
}

function hg(a) {
 a = a | 0;
 return (a & 255) << 24 | (a >> 8 & 255) << 16 | (a >> 16 & 255) << 8 | a >>> 24 | 0;
}

function Te(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if (c | 0) jg(a | 0, b | 0, c | 0) | 0;
 return a | 0;
}

function De(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if (c | 0) ig(a | 0, b | 0, c | 0) | 0;
 return a | 0;
}

function se(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = hg(a | 0) | 0;
 return ((b | 0) == 0 ? a : c) | 0;
}

function he(a) {
 a = +a;
 var b = 0;
 h[j >> 3] = a;
 b = c[j >> 2] | 0;
 T(c[j + 4 >> 2] | 0);
 return b | 0;
}

function Ng(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 P(12);
}

function Zd(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 if (!(c[a >> 2] & 32)) ue(b, d, a) | 0;
 return;
}

function Yf(a) {
 a = a | 0;
 if (!a) a = 0; else a = (of(a, 35536, 35640, 0) | 0) != 0 & 1;
 return a | 0;
}

function xg(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 Wb[a & 7](b | 0, c | 0, d | 0);
}

function dg(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 return cg(a, b, c, d, 0) | 0;
}

function fe(a, b) {
 a = a | 0;
 b = b | 0;
 if (!a) a = 0; else a = ke(a, b, 0) | 0;
 return a | 0;
}
function _b(a) {
 a = a | 0;
 var b = 0;
 b = k;
 k = k + a | 0;
 k = k + 15 & -16;
 return b | 0;
}

function Mg(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 P(11);
}

function qg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return Pb[a & 3](b | 0, c | 0) | 0;
}

function xf(a) {
 a = a | 0;
 var b = 0;
 b = k;
 k = k + 16 | 0;
 Tb[a & 3]();
 af(39587, b);
}

function xd(a) {
 a = a | 0;
 return ((c[a + 4 >> 2] | 0) - (c[a >> 2] | 0) | 0) / 12 | 0 | 0;
}

function Ne(a, b) {
 a = a | 0;
 b = b | 0;
 c[a >> 2] = 36344;
 Je(a + 4 | 0, b);
 return;
}

function Le(a, b) {
 a = a | 0;
 b = b | 0;
 c[a >> 2] = 36324;
 Je(a + 4 | 0, b);
 return;
}

function Fg(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 P(4);
 return 0;
}

function kf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return (a | 0) == (b | 0) | 0;
}

function wg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 Vb[a & 3](b | 0, c | 0);
}

function Fe(a) {
 a = a | 0;
 a = lg(a | 0) | 0;
 if (!a) return; else Ye(a, 39142);
}

function Lf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return kf(a, b, 0) | 0;
}

function Lg(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 P(10);
}

function bg(a) {
 a = a | 0;
 return (a ? 31 - (O(a ^ a - 1) | 0) | 0 : 32) | 0;
}

function Wf() {
 var a = 0;
 a = c[10115] | 0;
 c[10115] = a + 0;
 return a | 0;
}

function Ee(b, c) {
 b = b | 0;
 c = c | 0;
 a[b >> 0] = a[c >> 0] | 0;
 return;
}

function yf() {
 var a = 0;
 a = c[9058] | 0;
 c[9058] = a + 0;
 return a | 0;
}

function de(a) {
 a = a | 0;
 return oe(a, c[(ne() | 0) + 188 >> 2] | 0) | 0;
}

function Eg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 P(3);
 return 0;
}

function cc(a, b) {
 a = a | 0;
 b = b | 0;
 if (!m) {
  m = a;
  n = b;
 }
}

function pg(a, b) {
 a = a | 0;
 b = b | 0;
 return Ob[a & 7](b | 0) | 0;
}

function Gf(a) {
 a = a | 0;
 c[a >> 2] = 36344;
 Ef(a + 4 | 0);
 return;
}

function Af(a) {
 a = a | 0;
 c[a >> 2] = 36324;
 Ef(a + 4 | 0);
 return;
}

function Rd(a) {
 a = a | 0;
 return (a + -48 | 0) >>> 0 < 10 | 0;
}

function pe(a, b) {
 a = a | 0;
 b = b | 0;
 return qe(a, b) | 0;
}

function Kg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 P(9);
}

function vg(a, b) {
 a = a | 0;
 b = b | 0;
 Ub[a & 31](b | 0);
}

function Kd(a) {
 a = a | 0;
 return xe(c[a + 4 >> 2] | 0) | 0;
}

function ie(a, b) {
 a = +a;
 b = b | 0;
 return +(+je(a, b));
}

function Dg(a, b) {
 a = a | 0;
 b = b | 0;
 P(2);
 return 0;
}

function bc(a, b) {
 a = a | 0;
 b = b | 0;
 k = a;
 l = b;
}

function If(a) {
 a = a | 0;
 return Df(a + 4 | 0) | 0;
}

function Cf(a) {
 a = a | 0;
 return Df(a + 4 | 0) | 0;
}

function rd(a) {
 a = a | 0;
 return Nb[a & 3]() | 0;
}

function pf(a) {
 a = a | 0;
 bf(a);
 Ie(a);
 return;
}

function og(a) {
 a = a | 0;
 return Nb[a & 3]() | 0;
}

function cf(a) {
 a = a | 0;
 bf(a);
 Ie(a);
 return;
}

function Pf(a) {
 a = a | 0;
 bf(a);
 Ie(a);
 return;
}

function Mf(a) {
 a = a | 0;
 bf(a);
 Ie(a);
 return;
}

function Kf(a) {
 a = a | 0;
 bf(a);
 Ie(a);
 return;
}

function Jf(a) {
 a = a | 0;
 Af(a);
 Ie(a);
 return;
}

function Hf(a) {
 a = a | 0;
 Gf(a);
 Ie(a);
 return;
}

function Ge(a) {
 a = a | 0;
 mg(a | 0) | 0;
 return;
}

function Bf(a) {
 a = a | 0;
 Af(a);
 Ie(a);
 return;
}

function Zc(a) {
 a = a | 0;
 ja(a | 0) | 0;
 wf();
}

function Df(a) {
 a = a | 0;
 return c[a >> 2] | 0;
}

function Ye(a, b) {
 a = a | 0;
 b = b | 0;
 Oa();
}

function Jg(a, b) {
 a = a | 0;
 b = b | 0;
 P(8);
}

function Kc(a) {
 a = a | 0;
 Mc(a, 24);
 return;
}

function Ff(a) {
 a = a | 0;
 return a + -12 | 0;
}

function Ke(a) {
 a = a | 0;
 return a + 12 | 0;
}

function Cg(a) {
 a = a | 0;
 P(1);
 return 0;
}

function Ie(a) {
 a = a | 0;
 Ce(a);
 return;
}

function pd(a) {
 a = a | 0;
 return 35272;
}

function Qd(a) {
 a = a | 0;
 return a | 0;
}

function ug(a) {
 a = a | 0;
 Tb[a & 3]();
}

function mg(a) {
 a = a | 0;
 return 0;
}

function lg(a) {
 a = a | 0;
 return 0;
}

function Ud(a) {
 a = a | 0;
 return 1;
}

function Me(a) {
 a = a | 0;
 return 1;
}

function zf(a) {
 a = a | 0;
 return;
}

function tf(a) {
 a = a | 0;
 return;
}

function ef(a) {
 a = a | 0;
 return;
}

function df(a) {
 a = a | 0;
 return;
}

function bf(a) {
 a = a | 0;
 return;
}

function Vd(a) {
 a = a | 0;
 return;
}

function ac(a) {
 a = a | 0;
 k = a;
}

function Ze(a) {
 a = a | 0;
 Oa();
}

function Oe(a) {
 a = a | 0;
 Oa();
}

function Ig(a) {
 a = a | 0;
 P(7);
}

function ne() {
 return me() | 0;
}

function le() {
 return me() | 0;
}

function Bg() {
 P(0);
 return 0;
}

function _c() {
 $c(0);
 return;
}

function Id() {
 Jd(0);
 return;
}

function me() {
 return 35988;
}

function Pd() {
 return 39952;
}

function $b() {
 return k | 0;
}

function Rc() {
 return;
}

function Hg() {
 P(6);
}

// EMSCRIPTEN_END_FUNCS

 var Nb = [ Bg, ld, sd, Bg ];
 var Ob = [ Cg, Ld, Cf, If, cd, pd, rd, xd ];
 var Pb = [ Dg, gd, nd, yd ];
 var Qb = [ Eg, Md, Nd, ff, Lf, Nf, ed, Ad, Bd, Eg, Eg, Eg, Eg, Eg, Eg, Eg ];
 var Rb = [ Fg, id, Cd, Fg ];
 var Sb = [ Gg, ad ];
 var Tb = [ Hg, _e, uf, Hg ];
 var Ub = [ Ig, bf, cf, df, ef, pf, Af, Bf, Gf, Hf, Jf, Kf, Mf, Pf, dd, md, qd, vf, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig, Ig ];
 var Vb = [ Jg, hd, td, Jg ];
 var Wb = [ Kg, fd, od, ud, vd, zd, Kg, Kg ];
 var Xb = [ Lg, jf, sf, Sf, jd, wd, Lg, Lg ];
 var Yb = [ Mg, hf, rf, Rf ];
 var Zb = [ Ng, gf, qf, Qf, bd, Ng, Ng, Ng ];
 return {
  __GLOBAL__sub_I_bind_cpp: Id,
  __GLOBAL__sub_I_crypto_cpp: Rc,
  __GLOBAL__sub_I_turtlecoin_crypto_cpp: _c,
  ___cxa_can_catch: Xf,
  ___cxa_is_pointer_type: Yf,
  ___errno_location: Pd,
  ___getTypeName: Kd,
  ___muldi3: _f,
  ___udivdi3: dg,
  _bitshift64Ashr: eg,
  _bitshift64Lshr: fg,
  _bitshift64Shl: gg,
  _free: Ce,
  _i64Add: $f,
  _i64Subtract: ag,
  _init_random: Oc,
  _llvm_bswap_i32: hg,
  _malloc: Be,
  _memcpy: ig,
  _memmove: jg,
  _memset: kg,
  _pthread_mutex_lock: lg,
  _pthread_mutex_unlock: mg,
  _sbrk: ng,
  dynCall_i: og,
  dynCall_ii: pg,
  dynCall_iii: qg,
  dynCall_iiii: rg,
  dynCall_iiiii: sg,
  dynCall_iiiiiii: tg,
  dynCall_v: ug,
  dynCall_vi: vg,
  dynCall_vii: wg,
  dynCall_viii: xg,
  dynCall_viiii: yg,
  dynCall_viiiii: zg,
  dynCall_viiiiii: Ag,
  establishStackSpace: bc,
  setThrew: cc,
  stackAlloc: _b,
  stackRestore: ac,
  stackSave: $b
 };
})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var __GLOBAL__sub_I_crypto_cpp = Module["__GLOBAL__sub_I_crypto_cpp"] = asm["__GLOBAL__sub_I_crypto_cpp"];
var __GLOBAL__sub_I_turtlecoin_crypto_cpp = Module["__GLOBAL__sub_I_turtlecoin_crypto_cpp"] = asm["__GLOBAL__sub_I_turtlecoin_crypto_cpp"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
var _bitshift64Ashr = Module["_bitshift64Ashr"] = asm["_bitshift64Ashr"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _free = Module["_free"] = asm["_free"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _init_random = Module["_init_random"] = asm["_init_random"];
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _memset = Module["_memset"] = asm["_memset"];
var _pthread_mutex_lock = Module["_pthread_mutex_lock"] = asm["_pthread_mutex_lock"];
var _pthread_mutex_unlock = Module["_pthread_mutex_unlock"] = asm["_pthread_mutex_unlock"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = asm["dynCall_iiiiiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
Module["asm"] = asm;
if (memoryInitializer) {
 if (!isDataURI(memoryInitializer)) {
  memoryInitializer = locateFile(memoryInitializer);
 }
 if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL || ENVIRONMENT_IS_REACT_NATIVE) {
  var data = Module["readBinary"](memoryInitializer);
  HEAPU8.set(data, GLOBAL_BASE);
 } else {
  addRunDependency("memory initializer");
  var applyMemoryInitializer = (function(data) {
   if (data.byteLength) data = new Uint8Array(data);
   HEAPU8.set(data, GLOBAL_BASE);
   if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
   removeRunDependency("memory initializer");
  });
  function doBrowserLoad() {
   Module["readAsync"](memoryInitializer, applyMemoryInitializer, (function() {
    throw "could not load memory initializer " + memoryInitializer;
   }));
  }
  var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer);
  if (memoryInitializerBytes) {
   applyMemoryInitializer(memoryInitializerBytes.buffer);
  } else if (Module["memoryInitializerRequest"]) {
   function useRequest() {
    var request = Module["memoryInitializerRequest"];
    var response = request.response;
    if (request.status !== 200 && request.status !== 0) {
     var data = tryParseAsDataURI(Module["memoryInitializerRequestURL"]);
     if (data) {
      response = data.buffer;
     } else {
      console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
      doBrowserLoad();
      return;
     }
    }
    applyMemoryInitializer(response);
   }
   if (Module["memoryInitializerRequest"].response) {
    setTimeout(useRequest, 0);
   } else {
    Module["memoryInitializerRequest"].addEventListener("load", useRequest);
   }
  } else {
   doBrowserLoad();
  }
 }
}
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
function run(args) {
 args = args || Module["arguments"];
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = run;
function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 if (what !== undefined) {
  out(what);
  err(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
}
Module["abort"] = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
Module["noExitRuntime"] = true;
run();




