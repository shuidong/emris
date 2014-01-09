// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
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
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 21984;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a95() } });
var ___fsmu8;
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,80,56,0,0,88,1,0,0,82,1,0,0,98,0,0,0,216,0,0,0,6,0,0,0,8,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv119__pointer_type_infoE;
__ZTVN10__cxxabiv119__pointer_type_infoE=allocate([0,0,0,0,96,56,0,0,88,1,0,0,100,0,0,0,98,0,0,0,216,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,128,56,0,0,88,1,0,0,120,0,0,0,98,0,0,0,216,0,0,0,6,0,0,0,28,0,0,0,2,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTIc;
__ZTIc=allocate([96,32,0,0,128,33,0,0], "i8", ALLOC_STATIC);
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt12out_of_rangeD1Ev;
var __ZNSt14overflow_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
/* memory initializer */ allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,99,117,114,66,111,120,80,111,115,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,99,117,114,66,111,120,67,111,108,111,114,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,83,104,97,100,101,114,32,99,111,109,112,105,108,101,32,108,111,103,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,80,114,111,103,114,97,109,32,108,105,110,107,32,108,111,103,0,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,83,104,97,100,101,114,32,112,114,111,103,114,97,109,32,108,105,110,107,32,101,114,114,111,114,58,32,0,0,0,0,0,95,95,110,101,120,116,95,112,114,105,109,101,32,111,118,101,114,102,108,111,119,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,114,97,103,109,101,110,116,32,115,104,97,100,101,114,32,99,111,109,112,105,108,101,32,101,114,114,111,114,58,32,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,86,101,114,116,101,120,32,115,104,97,100,101,114,32,99,111,109,112,105,108,101,32,101,114,114,111,114,58,32,0,0,0,73,110,118,97,108,105,100,32,116,121,112,101,46,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,112,114,101,99,105,115,105,111,110,32,109,101,100,105,117,109,112,32,102,108,111,97,116,59,10,32,32,32,32,32,32,32,32,118,97,114,121,105,110,103,32,118,101,99,52,32,118,95,112,111,115,105,116,105,111,110,59,10,32,32,32,32,32,32,32,32,118,97,114,121,105,110,103,32,118,101,99,51,32,118,95,110,111,114,109,97,108,59,10,32,32,32,32,32,32,32,32,117,110,105,102,111,114,109,32,118,101,99,52,32,98,111,120,67,111,108,111,114,59,10,32,32,32,32,32,32,32,32,117,110,105,102,111,114,109,32,118,101,99,52,32,99,117,114,66,111,120,67,111,108,111,114,59,10,32,32,32,32,32,32,32,32,117,110,105,102,111,114,109,32,118,101,99,51,32,99,117,114,66,111,120,80,111,115,59,10,32,32,32,32,32,32,32,32,10,32,32,32,32,32,32,32,32,118,111,105,100,32,109,97,105,110,40,41,10,32,32,32,32,32,32,32,32,123,10,32,32,32,32,32,32,32,32,32,32,32,32,118,101,99,51,32,108,32,61,32,99,117,114,66,111,120,80,111,115,32,45,32,118,95,112,111,115,105,116,105,111,110,46,120,121,122,59,10,32,32,32,32,32,32,32,32,32,32,32,32,102,108,111,97,116,32,100,105,102,102,117,115,101,32,61,32,109,97,120,40,48,46,48,44,32,100,111,116,40,110,111,114,109,97,108,105,122,101,40,118,95,110,111,114,109,97,108,41,44,32,110,111,114,109,97,108,105,122,101,40,108,41,41,41,32,42,32,48,46,53,32,43,32,48,46,53,59,10,32,32,32,32,32,32,32,32,32,32,32,32,118,101,99,52,32,108,112,32,61,32,40,110,111,114,109,97,108,105,122,101,40,99,117,114,66,111,120,67,111,108,111,114,41,32,42,32,49,46,53,32,43,32,50,46,53,41,32,42,32,100,105,102,102,117,115,101,32,47,32,112,111,119,40,108,101,110,103,116,104,40,108,41,44,32,48,46,53,41,59,10,32,32,32,32,32,32,32,32,32,32,32,32,118,101,99,52,32,99,111,108,111,114,32,61,32,98,111,120,67,111,108,111,114,32,42,32,108,112,59,10,32,32,32,32,32,32,32,32,32,32,32,32,10,32,32,32,32,32,32,32,32,32,32,32,32,103,108,95,70,114,97,103,67,111,108,111,114,32,61,32,99,111,108,111,114,59,10,32,32,32,32,32,32,32,32,125,10,32,32,32,32,32,32,32,32,0,0,0,0,0,0,0,110,111,114,109,97,108,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,10,32,32,32,32,32,32,32,32,97,116,116,114,105,98,117,116,101,32,118,101,99,52,32,112,111,115,105,116,105,111,110,59,10,32,32,32,32,32,32,32,32,97,116,116,114,105,98,117,116,101,32,118,101,99,51,32,110,111,114,109,97,108,59,10,32,32,32,32,32,32,32,32,118,97,114,121,105,110,103,32,118,101,99,52,32,118,95,112,111,115,105,116,105,111,110,59,10,32,32,32,32,32,32,32,32,118,97,114,121,105,110,103,32,118,101,99,51,32,118,95,110,111,114,109,97,108,59,10,32,32,32,32,32,32,32,32,117,110,105,102,111,114,109,32,109,97,116,52,32,109,111,100,101,108,77,97,116,59,10,32,32,32,32,32,32,32,32,117,110,105,102,111,114,109,32,109,97,116,52,32,118,105,101,119,80,114,111,106,77,97,116,59,10,32,32,32,32,32,32,32,32,10,32,32,32,32,32,32,32,32,118,111,105,100,32,109,97,105,110,40,41,10,32,32,32,32,32,32,32,32,123,10,32,32,32,32,32,32,32,32,32,32,32,32,118,95,112,111,115,105,116,105,111,110,32,61,32,109,111,100,101,108,77,97,116,32,42,32,112,111,115,105,116,105,111,110,59,10,32,32,32,32,32,32,32,32,32,32,32,32,118,95,110,111,114,109,97,108,32,61,32,109,97,116,51,40,109,111,100,101,108,77,97,116,41,32,42,32,110,111,114,109,97,108,59,10,32,32,32,32,32,32,32,32,32,32,32,32,103,108,95,80,111,115,105,116,105,111,110,32,61,32,118,105,101,119,80,114,111,106,77,97,116,32,42,32,118,95,112,111,115,105,116,105,111,110,59,10,32,32,32,32,32,32,32,32,125,10,32,32,32,32,32,32,32,32,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,86,69,82,46,32,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,64,80,69,84,65,95,79,75,69,67,72,65,78,0,0,0,118,58,32,80,85,84,0,0,80,77,0,0,0,0,0,0,94,58,32,84,85,82,78,0,65,77,0,0,0,0,0,0,118,58,32,84,85,82,78,0,94,58,32,80,85,84,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,60,58,32,76,69,70,84,0,80,85,83,72,32,65,78,89,32,75,69,89,33,33,0,0,69,77,82,73,83,0,0,0,84,58,32,63,63,63,63,63,63,63,0,0,0,0,0,0,82,58,32,82,69,83,84,65,82,84,0,0,0,0,0,0,118,105,101,119,80,114,111,106,77,97,116,0,0,0,0,0,105,110,118,97,114,105,100,32,116,121,112,101,46,0,0,0,115,116,100,58,58,101,120,99,101,112,116,105,111,110,0,0,105,110,118,97,108,105,100,32,116,121,112,101,46,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,117,110,111,114,100,101,114,101,100,95,109,97,112,58,58,97,116,58,32,107,101,121,32,110,111,116,32,102,111,117,110,100,0,0,0,0,0,0,0,0,47,85,115,101,114,115,47,112,101,116,97,47,68,111,99,117,109,101,110,116,115,47,71,105,116,72,117,98,47,101,109,114,105,115,47,115,114,99,47,83,104,97,100,101,114,46,104,112,112,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,115,105,122,101,111,102,40,100,97,116,97,41,32,62,61,32,118,46,116,121,112,101,83,105,122,101,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,67,101,108,108,97,114,47,103,108,109,47,48,46,57,46,52,46,54,47,105,110,99,108,117,100,101,47,103,108,109,47,99,111,114,101,47,102,117,110,99,95,101,120,112,111,110,101,110,116,105,97,108,46,105,110,108,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,120,32,62,32,103,101,110,84,121,112,101,40,48,41,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,35,35,35,32,35,35,35,32,35,35,35,32,35,35,35,32,32,32,35,32,35,35,35,32,35,35,35,32,32,32,35,32,35,35,35,32,35,35,35,32,32,32,35,32,32,32,32,32,35,32,32,32,32,32,35,32,32,32,32,32,35,32,32,32,32,32,35,32,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,35,32,35,32,32,35,32,32,35,32,32,32,32,32,35,32,32,32,35,32,32,32,35,32,35,32,35,32,32,32,35,32,35,32,35,32,32,32,35,32,32,32,35,32,32,32,32,35,35,35,32,32,32,35,32,32,32,32,32,32,32,35,32,32,35,32,32,32,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,35,32,35,32,32,35,32,32,35,35,35,32,35,35,35,32,35,35,35,32,35,35,35,32,35,35,35,32,32,32,35,32,35,35,35,32,35,35,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,35,35,35,35,32,35,35,35,35,35,32,32,32,32,32,0,0,0,0,71,76,83,76,32,118,101,114,115,105,111,110,58,32,0,0,35,32,35,32,32,35,32,32,32,32,35,32,32,32,35,32,35,32,35,32,35,32,32,32,35,32,32,32,32,32,35,32,35,32,35,32,35,32,35,32,32,35,35,35,32,32,32,32,35,32,32,32,32,35,32,32,32,32,32,32,32,35,32,32,35,32,32,32,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,35,35,35,33,35,35,32,33,35,35,35,33,35,35,35,33,35,32,35,33,35,35,35,33,35,35,35,33,35,35,35,33,35,35,35,33,35,35,35,33,32,32,35,32,32,33,32,32,35,32,32,33,32,32,35,32,32,33,32,32,35,32,32,33,32,33,32,33,0,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,35,35,35,32,35,32,32,32,32,35,35,32,35,32,35,32,35,35,35,32,32,35,32,32,35,35,35,32,32,35,32,32,32,35,32,35,32,32,35,32,35,32,32,35,32,32,35,35,35,32,35,32,32,35,32,32,32,32,35,35,35,35,32,35,35,35,32,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,35,32,35,32,35,32,32,32,35,35,32,32,35,32,35,32,32,32,35,32,32,35,32,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,35,32,32,35,32,32,32,32,32,32,32,32,32,32,32,35,32,32,32,32,32,32,32,32,0,0,0,0,0,116,114,117,101,0,0,0,0,35,32,35,32,35,35,35,32,35,32,35,32,35,35,32,32,35,35,35,32,32,35,32,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,35,32,32,32,35,32,32,32,35,32,32,35,32,32,35,32,32,32,32,35,32,35,35,32,32,32,32,32,0,0,0,0,0,58,32,0,0,0,0,0,0,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,32,32,35,32,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,32,35,32,35,32,32,32,35,32,32,32,35,32,35,35,32,32,32,32,32,0,0,0,0,0,35,35,35,33,35,35,35,33,35,35,35,33,35,35,35,33,35,35,35,33,35,35,35,33,35,32,35,33,35,32,35,33,35,32,35,32,35,33,35,32,35,33,35,32,35,33,35,35,35,33,35,33,35,35,35,33,32,33,32,35,35,35,33,32,32,32,33,0,0,0,0,0,35,32,35,32,35,35,32,32,35,35,35,32,35,35,32,32,35,35,35,32,35,32,32,32,35,35,35,32,35,32,35,32,35,32,35,35,35,32,35,32,35,32,35,35,35,32,35,32,32,32,35,32,35,32,32,35,32,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,32,35,32,32,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,32,35,32,32,32,35,32,35,32,32,35,32,0,0,0,0,0,0,0,35,35,35,32,35,35,32,32,35,32,32,32,35,32,35,32,35,35,35,32,35,35,35,32,35,32,35,32,35,35,35,32,35,32,32,32,35,32,35,35,32,32,35,32,32,32,35,32,35,32,35,32,35,32,35,35,32,0,0,0,0,0,0,0,79,112,101,110,71,76,32,118,101,114,115,105,111,110,58,32,0,0,0,0,0,0,0,0,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,35,32,32,32,35,32,32,32,35,32,32,32,35,32,35,32,35,32,32,32,35,32,35,32,35,32,35,32,32,32,35,35,32,35,35,32,35,35,32,35,32,0,0,0,0,0,0,0,32,35,32,33,35,35,32,33,35,35,35,33,35,35,32,33,35,35,35,33,35,35,35,33,35,35,35,33,35,32,35,33,35,33,32,32,35,33,35,32,35,33,35,32,32,33,35,32,32,32,35,33,35,32,32,35,33,0,0,0,0,0,0,0,67,0,0,0,0,0,0,0,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,33,63,32,64,95,48,49,50,51,52,53,54,55,56,57,94,118,60,62,58,46,0,118,101,99,116,111,114,0,0,37,46,48,76,102,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,83,117,110,100,97,121,0,0,83,67,79,82,69,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,83,101,112,0,0,0,0,0,65,117,103,0,0,0,0,0,48,46,51,0,0,0,0,0,115,101,116,85,110,105,102,111,114,109,0,0,0,0,0,0,105,110,118,101,114,115,101,115,113,114,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,152,49,0,0,46,0,0,0,174,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,49,0,0,16,1,0,0,226,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,49,0,0,106,0,0,0,32,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,49,0,0,106,0,0,0,102,1,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,49,0,0,140,0,0,0,38,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,49,0,0,140,0,0,0,14,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,49,0,0,140,0,0,0,30,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,50,0,0,232,0,0,0,122,0,0,0,74,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,50,0,0,68,1,0,0,0,1,0,0,74,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,50,0,0,224,0,0,0,2,1,0,0,74,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,50,0,0,94,1,0,0,204,0,0,0,74,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,51,0,0,90,1,0,0,138,0,0,0,74,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,51,0,0,222,0,0,0,164,0,0,0,74,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,51,0,0,62,0,0,0,166,0,0,0,74,0,0,0,134,0,0,0,4,0,0,0,30,0,0,0,6,0,0,0,20,0,0,0,54,0,0,0,2,0,0,0,248,255,255,255,96,51,0,0,24,0,0,0,12,0,0,0,38,0,0,0,16,0,0,0,2,0,0,0,34,0,0,0,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,51,0,0,80,1,0,0,56,1,0,0,74,0,0,0,22,0,0,0,16,0,0,0,58,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,136,51,0,0,72,0,0,0,114,0,0,0,128,0,0,0,138,0,0,0,102,0,0,0,48,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,51,0,0,112,0,0,0,4,1,0,0,74,0,0,0,50,0,0,0,44,0,0,0,12,0,0,0,56,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,51,0,0,146,0,0,0,102,0,0,0,74,0,0,0,46,0,0,0,90,0,0,0,16,0,0,0,72,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,51,0,0,84,1,0,0,4,0,0,0,74,0,0,0,26,0,0,0,32,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,51,0,0,70,0,0,0,8,0,0,0,74,0,0,0,8,0,0,0,12,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,52,0,0,40,1,0,0,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,52,0,0,42,0,0,0,202,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,52,0,0,12,0,0,0,238,0,0,0,74,0,0,0,26,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,52,0,0,144,0,0,0,28,0,0,0,74,0,0,0,18,0,0,0,22,0,0,0,32,0,0,0,20,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,52,0,0,64,0,0,0,36,0,0,0,74,0,0,0,46,0,0,0,44,0,0,0,36,0,0,0,38,0,0,0,28,0,0,0,42,0,0,0,34,0,0,0,52,0,0,0,50,0,0,0,48,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,52,0,0,86,0,0,0,6,0,0,0,74,0,0,0,76,0,0,0,68,0,0,0,62,0,0,0,64,0,0,0,56,0,0,0,66,0,0,0,60,0,0,0,74,0,0,0,72,0,0,0,70,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,52,0,0,108,0,0,0,136,0,0,0,74,0,0,0,6,0,0,0,18,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,52,0,0,40,0,0,0,244,0,0,0,74,0,0,0,16,0,0,0,22,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,52,0,0,18,0,0,0,254,0,0,0,74,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,132,0,0,0,106,0,0,0,24,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,52,0,0,248,0,0,0,26,0,0,0,74,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,54,0,0,0,10,0,0,0,20,0,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,53,0,0,248,0,0,0,118,0,0,0,74,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,104,0,0,0,64,0,0,0,10,0,0,0,142,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,53,0,0,248,0,0,0,148,0,0,0,74,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,32,0,0,0,78,0,0,0,8,0,0,0,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,53,0,0,248,0,0,0,54,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,53,0,0,94,0,0,0,220,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,53,0,0,248,0,0,0,114,0,0,0,74,0,0,0,20,0,0,0,2,0,0,0,4,0,0,0,10,0,0,0,14,0,0,0,32,0,0,0,28,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,53,0,0,100,1,0,0,56,0,0,0,74,0,0,0,22,0,0,0,22,0,0,0,18,0,0,0,42,0,0,0,8,0,0,0,6,0,0,0,28,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,0,0,0,0,184,53,0,0,28,1,0,0,14,1,0,0,200,255,255,255,200,255,255,255,184,53,0,0,48,0,0,0,150,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,53,0,0,104,0,0,0,52,1,0,0,82,0,0,0,6,0,0,0,14,0,0,0,40,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,53,0,0,178,0,0,0,200,0,0,0,144,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,53,0,0,248,0,0,0,124,0,0,0,74,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,32,0,0,0,78,0,0,0,8,0,0,0,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,53,0,0,248,0,0,0,228,0,0,0,74,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,32,0,0,0,78,0,0,0,8,0,0,0,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,54,0,0,76,0,0,0,38,1,0,0,80,0,0,0,44,0,0,0,24,0,0,0,4,0,0,0,52,0,0,0,92,0,0,0,18,0,0,0,136,0,0,0,14,0,0,0,32,0,0,0,16,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,54,0,0,190,0,0,0,72,1,0,0,24,0,0,0,24,0,0,0,14,0,0,0,20,0,0,0,94,0,0,0,110,0,0,0,38,0,0,0,30,0,0,0,28,0,0,0,6,0,0,0,48,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,54,0,0,16,0,0,0,176,0,0,0,80,0,0,0,44,0,0,0,30,0,0,0,16,0,0,0,52,0,0,0,92,0,0,0,18,0,0,0,8,0,0,0,14,0,0,0,36,0,0,0,16,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,80,54,0,0,68,0,0,0,32,1,0,0,252,255,255,255,252,255,255,255,80,54,0,0,210,0,0,0,188,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,104,54,0,0,44,1,0,0,74,1,0,0,252,255,255,255,252,255,255,255,104,54,0,0,162,0,0,0,20,1,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,128,54,0,0,130,0,0,0,104,1,0,0,248,255,255,255,248,255,255,255,128,54,0,0,250,0,0,0,70,1,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,152,54,0,0,160,0,0,0,26,1,0,0,248,255,255,255,248,255,255,255,152,54,0,0,198,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,54,0,0,22,1,0,0,252,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,54,0,0,86,1,0,0,60,1,0,0,20,0,0,0,24,0,0,0,14,0,0,0,20,0,0,0,60,0,0,0,110,0,0,0,38,0,0,0,30,0,0,0,28,0,0,0,6,0,0,0,36,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,54,0,0,218,0,0,0,246,0,0,0,44,0,0,0,44,0,0,0,30,0,0,0,16,0,0,0,96,0,0,0,92,0,0,0,18,0,0,0,8,0,0,0,14,0,0,0,36,0,0,0,46,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,55,0,0,54,1,0,0,208,0,0,0,74,0,0,0,70,0,0,0,130,0,0,0,34,0,0,0,96,0,0,0,6,0,0,0,38,0,0,0,56,0,0,0,28,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,55,0,0,158,0,0,0,92,0,0,0,74,0,0,0,120,0,0,0,126,0,0,0,64,0,0,0,92,0,0,0,94,0,0,0,30,0,0,0,124,0,0,0,68,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,55,0,0,58,1,0,0,172,0,0,0,74,0,0,0,18,0,0,0,62,0,0,0,8,0,0,0,60,0,0,0,100,0,0,0,70,0,0,0,100,0,0,0,74,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,55,0,0,110,0,0,0,236,0,0,0,74,0,0,0,112,0,0,0,116,0,0,0,36,0,0,0,90,0,0,0,32,0,0,0,26,0,0,0,84,0,0,0,88,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,55,0,0,132,0,0,0,24,0,0,0,52,0,0,0,24,0,0,0,14,0,0,0,20,0,0,0,94,0,0,0,110,0,0,0,38,0,0,0,74,0,0,0,86,0,0,0,10,0,0,0,48,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,55,0,0,22,0,0,0,46,1,0,0,82,0,0,0,44,0,0,0,30,0,0,0,16,0,0,0,52,0,0,0,92,0,0,0,18,0,0,0,20,0,0,0,26,0,0,0,2,0,0,0,16,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,55,0,0,52,0,0,0,186,0,0,0,4,0,0,0,46,0,0,0,194,0,0,0,66,1,0,0,2,0,0,0,40,0,0,0,88,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,55,0,0,78,0,0,0,44,0,0,0,36,0,0,0,78,0,0,0,134,0,0,0,182,0,0,0,192,0,0,0,20,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,55,0,0,128,0,0,0,2,0,0,0,76,0,0,0,50,0,0,0,154,0,0,0,82,0,0,0,2,0,0,0,30,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,0,0,62,1,0,0,184,0,0,0,108,0,0,0,42,0,0,0,34,1,0,0,88,0,0,0,10,0,0,0,34,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,56,0,0,88,1,0,0,126,0,0,0,98,0,0,0,216,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,56,0,0,88,1,0,0,18,1,0,0,98,0,0,0,216,0,0,0,6,0,0,0,2,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,56,0,0,156,0,0,0,64,1,0,0,30,1,0,0,240,0,0,0,76,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,56,0,0,90,0,0,0,58,0,0,0,152,0,0,0,6,1,0,0,58,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,56,0,0,96,0,0,0,50,1,0,0,24,1,0,0,96,1,0,0,98,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,56,0,0,180,0,0,0,72,0,0,0,30,1,0,0,10,1,0,0,48,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,56,0,0,168,0,0,0,92,1,0,0,80,0,0,0,242,0,0,0,4,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,99,0,0,0,0,0,0,0,90,78,54,84,101,116,114,105,115,52,71,97,109,101,67,49,69,105,105,69,85,108,109,69,95,0,0,0,0,0,0,0,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,118,69,95,0,0,0,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,102,69,95,0,0,0,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,52,118,101,99,50,69,95,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,52,111,118,101,114,102,108,111,119,95,101,114,114,111,114,0,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,111,117,116,95,111,102,95,114,97,110,103,101,0,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,80,75,99,0,0,0,0,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98].concat([115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,98,97,115,105,99,95,111,115,116,114,105,110,103,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,98,97,100,95,102,117,110,99,116,105,111,110,95,99,97,108,108,69,0,0,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,105,110,103,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,54,84,101,116,114,105,115,52,71,97,109,101,67,49,69,105,105,69,85,108,109,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,70,100,109,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,118,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,70,118,118,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,102,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,51,95,69,69,70,102,102,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,102,117,110,99,73,90,78,49,50,84,80,83,71,97,109,101,83,99,101,110,101,52,68,114,97,119,69,118,69,85,108,52,118,101,99,50,69,95,78,83,95,57,97,108,108,111,99,97,116,111,114,73,83,52,95,69,69,70,118,83,51,95,69,69,69,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,118,118,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,118,52,118,101,99,50,69,69,69,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,102,102,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,102,117,110,99,116,105,111,110,54,95,95,98,97,115,101,73,70,100,109,69,69,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,51,95,95,102,117,110,100,97,109,101,110,116,97,108,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,57,95,95,112,111,105,110,116,101,114,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,112,98,97,115,101,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,68,110,0,0,0,0,0,0,57,71,97,109,101,83,99,101,110,101,0,0,0,0,0,0,53,83,99,101,110,101,0,0,49,51,71,97,109,101,79,118,101,114,83,99,101,110,101,0,49,50,84,80,83,71,97,109,101,83,99,101,110,101,0,0,49,48,84,105,116,108,101,83,99,101,110,101,0,0,0,0,96,32,0,0,120,33,0,0,0,0,0,0,136,33,0,0,0,0,0,0,168,33,0,0,0,0,0,0,200,33,0,0,0,0,0,0,232,33,0,0,0,0,0,0,16,34,0,0,0,0,0,0,32,34,0,0,0,0,0,0,48,34,0,0,144,49,0,0,0,0,0,0,0,0,0,0,64,34,0,0,144,49,0,0,0,0,0,0,0,0,0,0,80,34,0,0,200,49,0,0,0,0,0,0,0,0,0,0,104,34,0,0,144,49,0,0,0,0,0,0,0,0,0,0,128,34,0,0,248,49,0,0,0,0,0,0,0,0,0,0,152,34,0,0,248,49,0,0,0,0,0,0,0,0,0,0,176,34,0,0,144,49,0,0,0,0,0,0,0,0,0,0,192,34,0,0,1,0,0,0,0,0,0,0,0,0,0,0,200,34,0,0,136,32,0,0,224,34,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,248,54,0,0,0,0,0,0,136,32,0,0,40,35,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,0,55,0,0,0,0,0,0,136,32,0,0,112,35,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,8,55,0,0,0,0,0,0,136,32,0,0,184,35,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,16,55,0,0,0,0,0,0,0,0,0,0,0,36,0,0,16,52,0,0,0,0,0,0,0,0,0,0,48,36,0,0,16,52,0,0,0,0,0,0,136,32,0,0,96,36,0,0,0,0,0,0,1,0,0,0,56,54,0,0,0,0,0,0,136,32,0,0,120,36,0,0,0,0,0,0,1,0,0,0,56,54,0,0,0,0,0,0,136,32,0,0,144,36,0,0,0,0,0,0,1,0,0,0,64,54,0,0,0,0,0,0,136,32,0,0,168,36,0,0,0,0,0,0,1,0,0,0,64,54,0,0,0,0,0,0,136,32,0,0,192,36,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,168,55,0,0,0,8,0,0,136,32,0,0,8,37,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,168,55,0,0,0,8,0,0,136,32,0,0,80,37,0,0,0,0,0,0,3,0,0,0,72,53,0,0,2,0,0,0,24,50,0,0,2,0,0,0,168,53,0,0,0,8,0,0,136,32,0,0,152,37,0,0,0,0,0,0,3,0,0,0,72,53,0,0,2,0,0,0,24,50,0,0,2,0,0,0,176,53,0,0,0,8,0,0,0,0,0,0,224,37,0,0,72,53,0,0,0,0,0,0,0,0,0,0,248,37,0,0,72,53,0,0,0,0,0,0,136,32,0,0,16,38,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,72,54,0,0,2,0,0,0,136,32,0,0,40,38,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,72,54,0,0,2,0,0,0,0,0,0,0,64,38,0,0,0,0,0,0,88,38,0,0,176,54,0,0,0,0,0,0,136,32,0,0,120,38,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,192,50,0,0,0,0,0,0,136,32,0,0,192,38,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,216,50,0,0,0,0,0,0,136,32,0,0,8,39,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,240,50,0,0,0,0,0,0,136,32,0,0,80,39,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,8,51,0,0,0,0,0,0,0,0,0,0,152,39,0,0,72,53,0,0,0,0,0,0,0,0,0,0,176,39,0,0,72,53,0,0,0,0,0,0,136,32,0,0,200,39,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,192,54,0,0,2,0,0,0,136,32,0,0,240,39,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,192,54,0,0,2,0,0,0,136,32,0,0,24,40,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,192,54,0,0,2,0,0,0,136,32,0,0,64,40,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,192,54,0,0,2,0,0,0,0,0,0,0,104,40,0,0,48,54,0,0,0,0,0,0,0,0,0,0,128,40,0,0,72,53,0,0,0,0,0,0,136,32,0,0,152,40,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,160,55,0,0,2,0,0,0,136,32,0,0,176,40,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,160,55,0,0,2,0,0,0,0,0,0,0,200,40,0,0,0,0,0,0,240,40,0,0,0,0,0,0,24,41,0,0,104,54,0,0,0,0,0,0,0,0,0,0,96,41,0,0,200,54,0,0,0,0,0,0,0,0,0,0,128,41,0,0,144,49,0,0,0,0,0,0,0,0,0,0,160,41,0,0,40,53,0,0,0,0,0,0,0,0,0,0,200,41,0,0,40,53,0,0,0,0,0,0,0,0,0,0,240,41,0,0,32,54,0,0,0,0,0,0,0,0,0,0,56,42,0,0,0,0,0,0,112,42,0,0,0,0,0,0,168,42,0,0,0,0,0,0,200,42,0,0,0,0,0,0,232,42,0,0,0,0,0,0,8,43,0,0,0,0,0,0,40,43,0,0,136,32,0,0,64,43,0,0,0,0,0,0,1,0,0,0,160,50,0,0,3,244,255,255,136,32,0,0,112,43,0,0,0,0,0,0,1,0,0,0,176,50,0,0,3,244,255,255,136,32,0,0,160,43,0,0,0,0,0,0,1,0,0,0,160,50,0,0,3,244,255,255,136,32,0,0,208,43,0,0,0,0,0,0,1,0,0,0,176,50,0,0,3,244,255,255,0,0,0,0,0,44,0,0,200,49,0,0,0,0,0,0,0,0,0,0,24,44,0,0,0,0,0,0,48,44,0,0,40,54,0,0,0,0,0,0,0,0,0,0,72,44,0,0,24,54,0,0,0,0,0,0,0,0,0,0,104,44,0,0,32,54,0,0,0,0,0,0,0,0,0,0,136,44,0,0,0,0,0,0,168,44,0,0,0,0,0,0,200,44,0,0,0,0,0,0,232,44,0,0,136,32,0,0,8,45,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,152,55,0,0,2,0,0,0,136,32,0,0,40,45,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,152,55,0,0,2,0,0,0,136,32,0,0,72,45,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,152,55,0,0,2,0,0,0,136,32,0,0,104,45,0,0,0,0,0,0,2,0,0,0,72,53,0,0,2,0,0,0,152,55,0,0,2,0,0,0,0,0,0,0,136,45,0,0,0,0,0,0,160,45,0,0,0,0,0,0,184,45,0,0,0,0,0,0,208,45,0,0,24,54,0,0,0,0,0,0,0,0,0,0,232,45,0,0,32,54,0,0,0,0,0,0,0,0,0,0,0,46,0,0,40,56,0,0,0,0,0,0,0,0,0,0,80,46,0,0,16,56,0,0,0,0,0,0,0,0,0,0,168,46,0,0,32,56,0,0,0,0,0,0,0,0,0,0,0,47,0,0,24,56,0,0,0,0,0,0,0,0,0,0,88,47,0,0,0,0,0,0,128,47,0,0,0,0,0,0,168,47,0,0,0,0,0,0,208,47,0,0,0,0,0,0,248,47,0,0,144,56,0,0,0,0,0,0,0,0,0,0,32,48,0,0,128,56,0,0,0,0,0,0,0,0,0,0,72,48,0,0,128,56,0,0,0,0,0,0,0,0,0,0,112,48,0,0,112,56,0,0,0,0,0,0,0,0,0,0,152,48,0,0,144,56,0,0,0,0,0,0,0,0,0,0,192,48,0,0,144,56,0,0,0,0,0,0,0,0,0,0,232,48,0,0,136,49,0,0,0,0,0,0,96,32,0,0,16,49,0,0,0,0,0,0,24,49,0,0,184,56,0,0,0,0,0,0,0,0,0,0,40,49,0,0,0,0,0,0,48,49,0,0,184,56,0,0,0,0,0,0,0,0,0,0,64,49,0,0,168,56,0,0,0,0,0,0,0,0,0,0,80,49,0,0,184,56,0,0,0,0,0,0,56,0,0,0,0,0,0,0,104,54,0,0,44,1,0,0,74,1,0,0,200,255,255,255,200,255,255,255,104,54,0,0,162,0,0,0,20,1,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,13,0,0,0,17,0,0,0,19,0,0,0,23,0,0,0,29,0,0,0,31,0,0,0,37,0,0,0,41,0,0,0,43,0,0,0,47,0,0,0,53,0,0,0,59,0,0,0,61,0,0,0,67,0,0,0,71,0,0,0,73,0,0,0,79,0,0,0,83,0,0,0,89,0,0,0,97,0,0,0,101,0,0,0,103,0,0,0,107,0,0,0,109,0,0,0,113,0,0,0,121,0,0,0,127,0,0,0,131,0,0,0,137,0,0,0,139,0,0,0,143,0,0,0,149,0,0,0,151,0,0,0,157,0,0,0,163,0,0,0,167,0,0,0,169,0,0,0,173,0,0,0,179,0,0,0,181,0,0,0,187,0,0,0,191,0,0,0,193,0,0,0,197,0,0,0,199,0,0,0,209,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,7,0,0,0,11,0,0,0,13,0,0,0,17,0,0,0,19,0,0,0,23,0,0,0,29,0,0,0,31,0,0,0,37,0,0,0,41,0,0,0,43,0,0,0,47,0,0,0,53,0,0,0,59,0,0,0,61,0,0,0,67,0,0,0,71,0,0,0,73,0,0,0,79,0,0,0,83,0,0,0,89,0,0,0,97,0,0,0,101,0,0,0,103,0,0,0,107,0,0,0,109,0,0,0,113,0,0,0,127,0,0,0,131,0,0,0,137,0,0,0,139,0,0,0,149,0,0,0,151,0,0,0,157,0,0,0,163,0,0,0,167,0,0,0,173,0,0,0,179,0,0,0,181,0,0,0,191,0,0,0,193,0,0,0,197,0,0,0,199,0,0,0,211,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  var GLUT={initTime:null,idleFunc:null,displayFunc:null,keyboardFunc:null,keyboardUpFunc:null,specialFunc:null,specialUpFunc:null,reshapeFunc:null,motionFunc:null,passiveMotionFunc:null,mouseFunc:null,buttons:0,modifiers:0,initWindowWidth:256,initWindowHeight:256,initDisplayMode:18,windowX:0,windowY:0,windowWidth:0,windowHeight:0,saveModifiers:function (event) {
        GLUT.modifiers = 0;
        if (event['shiftKey'])
          GLUT.modifiers += 1; /* GLUT_ACTIVE_SHIFT */
        if (event['ctrlKey'])
          GLUT.modifiers += 2; /* GLUT_ACTIVE_CTRL */
        if (event['altKey'])
          GLUT.modifiers += 4; /* GLUT_ACTIVE_ALT */
      },onMousemove:function (event) {
        /* Send motion event only if the motion changed, prevents
         * spamming our app with uncessary callback call. It does happen in
         * Chrome on Windows.
         */
        var lastX = Browser.mouseX;
        var lastY = Browser.mouseY;
        Browser.calculateMouseEvent(event);
        var newX = Browser.mouseX;
        var newY = Browser.mouseY;
        if (newX == lastX && newY == lastY) return;
        if (GLUT.buttons == 0 && event.target == Module["canvas"] && GLUT.passiveMotionFunc) {
          event.preventDefault();
          GLUT.saveModifiers(event);
          Runtime.dynCall('vii', GLUT.passiveMotionFunc, [lastX, lastY]);
        } else if (GLUT.buttons != 0 && GLUT.motionFunc) {
          event.preventDefault();
          GLUT.saveModifiers(event);
          Runtime.dynCall('vii', GLUT.motionFunc, [lastX, lastY]);
        }
      },getSpecialKey:function (keycode) {
          var key = null;
          switch (keycode) {
            case 8:  key = 120 /* backspace */; break;
            case 46: key = 111 /* delete */; break;
            case 0x70 /*DOM_VK_F1*/: key = 1 /* GLUT_KEY_F1 */; break;
            case 0x71 /*DOM_VK_F2*/: key = 2 /* GLUT_KEY_F2 */; break;
            case 0x72 /*DOM_VK_F3*/: key = 3 /* GLUT_KEY_F3 */; break;
            case 0x73 /*DOM_VK_F4*/: key = 4 /* GLUT_KEY_F4 */; break;
            case 0x74 /*DOM_VK_F5*/: key = 5 /* GLUT_KEY_F5 */; break;
            case 0x75 /*DOM_VK_F6*/: key = 6 /* GLUT_KEY_F6 */; break;
            case 0x76 /*DOM_VK_F7*/: key = 7 /* GLUT_KEY_F7 */; break;
            case 0x77 /*DOM_VK_F8*/: key = 8 /* GLUT_KEY_F8 */; break;
            case 0x78 /*DOM_VK_F9*/: key = 9 /* GLUT_KEY_F9 */; break;
            case 0x79 /*DOM_VK_F10*/: key = 10 /* GLUT_KEY_F10 */; break;
            case 0x7a /*DOM_VK_F11*/: key = 11 /* GLUT_KEY_F11 */; break;
            case 0x7b /*DOM_VK_F12*/: key = 12 /* GLUT_KEY_F12 */; break;
            case 0x25 /*DOM_VK_LEFT*/: key = 100 /* GLUT_KEY_LEFT */; break;
            case 0x26 /*DOM_VK_UP*/: key = 101 /* GLUT_KEY_UP */; break;
            case 0x27 /*DOM_VK_RIGHT*/: key = 102 /* GLUT_KEY_RIGHT */; break;
            case 0x28 /*DOM_VK_DOWN*/: key = 103 /* GLUT_KEY_DOWN */; break;
            case 0x21 /*DOM_VK_PAGE_UP*/: key = 104 /* GLUT_KEY_PAGE_UP */; break;
            case 0x22 /*DOM_VK_PAGE_DOWN*/: key = 105 /* GLUT_KEY_PAGE_DOWN */; break;
            case 0x24 /*DOM_VK_HOME*/: key = 106 /* GLUT_KEY_HOME */; break;
            case 0x23 /*DOM_VK_END*/: key = 107 /* GLUT_KEY_END */; break;
            case 0x2d /*DOM_VK_INSERT*/: key = 108 /* GLUT_KEY_INSERT */; break;
            case 16   /*DOM_VK_SHIFT*/:
            case 0x05 /*DOM_VK_LEFT_SHIFT*/:
              key = 112 /* GLUT_KEY_SHIFT_L */;
              break;
            case 0x06 /*DOM_VK_RIGHT_SHIFT*/:
              key = 113 /* GLUT_KEY_SHIFT_R */;
              break;
            case 17   /*DOM_VK_CONTROL*/:
            case 0x03 /*DOM_VK_LEFT_CONTROL*/:
              key = 114 /* GLUT_KEY_CONTROL_L */;
              break;
            case 0x04 /*DOM_VK_RIGHT_CONTROL*/:
              key = 115 /* GLUT_KEY_CONTROL_R */;
              break;
            case 18   /*DOM_VK_ALT*/:
            case 0x02 /*DOM_VK_LEFT_ALT*/:
              key = 116 /* GLUT_KEY_ALT_L */;
              break;
            case 0x01 /*DOM_VK_RIGHT_ALT*/:
              key = 117 /* GLUT_KEY_ALT_R */;
              break;
          };
          return key;
      },getASCIIKey:function (event) {
        if (event['ctrlKey'] || event['altKey'] || event['metaKey']) return null;
        var keycode = event['keyCode'];
        /* The exact list is soooo hard to find in a canonical place! */
        if (48 <= keycode && keycode <= 57)
          return keycode; // numeric  TODO handle shift?
        if (65 <= keycode && keycode <= 90)
          return event['shiftKey'] ? keycode : keycode + 32;
        if (106 <= keycode && keycode <= 111)
          return keycode - 106 + 42; // *,+-./  TODO handle shift?
        switch (keycode) {
          case 27: // escape
          case 32: // space
          case 61: // equal
            return keycode;
        }
        var s = event['shiftKey'];
        switch (keycode) {
          case 186: return s ? 58 : 59; // colon / semi-colon
          case 187: return s ? 43 : 61; // add / equal (these two may be wrong)
          case 188: return s ? 60 : 44; // less-than / comma
          case 189: return s ? 95 : 45; // dash
          case 190: return s ? 62 : 46; // greater-than / period
          case 191: return s ? 63 : 47; // forward slash
          case 219: return s ? 123 : 91; // open bracket
          case 220: return s ? 124 : 47; // back slash
          case 221: return s ? 125 : 93; // close braket
          case 222: return s ? 34 : 39; // single quote
        }
        return null;
      },onKeydown:function (event) {
        if (GLUT.specialFunc || GLUT.keyboardFunc) {
          var key = GLUT.getSpecialKey(event['keyCode']);
          if (key !== null) {
            if( GLUT.specialFunc ) {
              event.preventDefault();
              GLUT.saveModifiers(event);
              Runtime.dynCall('viii', GLUT.specialFunc, [key, Browser.mouseX, Browser.mouseY]);
            }
          }
          else
          {
            key = GLUT.getASCIIKey(event);
            if( key !== null && GLUT.keyboardFunc ) {
              event.preventDefault();
              GLUT.saveModifiers(event);
              Runtime.dynCall('viii', GLUT.keyboardFunc, [key, Browser.mouseX, Browser.mouseY]);
            }
          }
        }
      },onKeyup:function (event) {
        if (GLUT.specialUpFunc || GLUT.keyboardUpFunc) {
          var key = GLUT.getSpecialKey(event['keyCode']);
          if (key !== null) {
            if(GLUT.specialUpFunc) {
              event.preventDefault ();
              GLUT.saveModifiers(event);
              Runtime.dynCall('viii', GLUT.specialUpFunc, [key, Browser.mouseX, Browser.mouseY]);
            }
          }
          else
          {
            key = GLUT.getASCIIKey(event);
            if( key !== null && GLUT.keyboardUpFunc ) {
              event.preventDefault ();
              GLUT.saveModifiers(event);
              Runtime.dynCall('viii', GLUT.keyboardUpFunc, [key, Browser.mouseX, Browser.mouseY]);
            }
          }
        }
      },onMouseButtonDown:function (event) {
        Browser.calculateMouseEvent(event);
        GLUT.buttons |= (1 << event['button']);
        if (event.target == Module["canvas"] && GLUT.mouseFunc) {
          try {
            event.target.setCapture();
          } catch (e) {}
          event.preventDefault();
          GLUT.saveModifiers(event);
          Runtime.dynCall('viiii', GLUT.mouseFunc, [event['button'], 0/*GLUT_DOWN*/, Browser.mouseX, Browser.mouseY]);
        }
      },onMouseButtonUp:function (event) {
        Browser.calculateMouseEvent(event);
        GLUT.buttons &= ~(1 << event['button']);
        if (GLUT.mouseFunc) {
          event.preventDefault();
          GLUT.saveModifiers(event);
          Runtime.dynCall('viiii', GLUT.mouseFunc, [event['button'], 1/*GLUT_UP*/, Browser.mouseX, Browser.mouseY]);
        }
      },onMouseWheel:function (event) {
        Browser.calculateMouseEvent(event);
        // cross-browser wheel delta
        var e = window.event || event; // old IE support
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        var button = 3; // wheel up
        if (delta < 0) {
          button = 4; // wheel down
        }
        if (GLUT.mouseFunc) {
          event.preventDefault();
          GLUT.saveModifiers(event);
          Runtime.dynCall('viiii', GLUT.mouseFunc, [button, 0/*GLUT_DOWN*/, Browser.mouseX, Browser.mouseY]);
        }
      },onFullScreenEventChange:function (event) {
        var width;
        var height;
        if (document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"]) {
          width = screen["width"];
          height = screen["height"];
        } else {
          width = GLUT.windowWidth;
          height = GLUT.windowHeight;
          // TODO set position
          document.removeEventListener('fullscreenchange', GLUT.onFullScreenEventChange, true);
          document.removeEventListener('mozfullscreenchange', GLUT.onFullScreenEventChange, true);
          document.removeEventListener('webkitfullscreenchange', GLUT.onFullScreenEventChange, true);
        }
        Browser.setCanvasSize(width, height);
        /* Can't call _glutReshapeWindow as that requests cancelling fullscreen. */
        if (GLUT.reshapeFunc) {
          // console.log("GLUT.reshapeFunc (from FS): " + width + ", " + height);
          Runtime.dynCall('vii', GLUT.reshapeFunc, [width, height]);
        }
        _glutPostRedisplay();
      },requestFullScreen:function () {
        var RFS = Module["canvas"]['requestFullscreen'] ||
                  Module["canvas"]['requestFullScreen'] ||
                  Module["canvas"]['mozRequestFullScreen'] ||
                  Module["canvas"]['webkitRequestFullScreen'] ||
                  (function() {});
        RFS.apply(Module["canvas"], []);
      },cancelFullScreen:function () {
        var CFS = document['exitFullscreen'] ||
                  document['cancelFullScreen'] ||
                  document['mozCancelFullScreen'] ||
                  document['webkitCancelFullScreen'] ||
                  (function() {});
        CFS.apply(document, []);
      }};function _glutPostRedisplay() {
      if (GLUT.displayFunc) {
        Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          Runtime.dynCall('v', GLUT.displayFunc);
        });
      }
    }
  function _glutTimerFunc(msec, func, value) {
      Browser.safeSetTimeout(function() { Runtime.dynCall('vi', func, [value]); }, msec);
    }
  function _glutInitWindowSize(width, height) {
      Browser.setCanvasSize( GLUT.initWindowWidth = width,
                             GLUT.initWindowHeight = height );
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
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
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
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
                mmap: MEMFS.stream_ops.mmap
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
            },
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
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
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
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
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
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
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
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
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
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
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
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
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
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
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
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            contextAttributes.preserveDrawingBuffer = true;
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};function _glutInit(argcp, argv) {
      // Ignore arguments
      GLUT.initTime = Date.now();
      var isTouchDevice = 'ontouchstart' in document.documentElement;
      window.addEventListener("keydown", GLUT.onKeydown, true);
      window.addEventListener("keyup", GLUT.onKeyup, true);
      if (isTouchDevice) {
        window.addEventListener("touchmove", GLUT.onMousemove, true);
        window.addEventListener("touchstart", GLUT.onMouseButtonDown, true);
        window.addEventListener("touchend", GLUT.onMouseButtonUp, true);
      } else {
        window.addEventListener("mousemove", GLUT.onMousemove, true);
        window.addEventListener("mousedown", GLUT.onMouseButtonDown, true);
        window.addEventListener("mouseup", GLUT.onMouseButtonUp, true);
        // IE9, Chrome, Safari, Opera
        window.addEventListener("mousewheel", GLUT.onMouseWheel, true);
        // Firefox
        window.addEventListener("DOMMouseScroll", GLUT.onMouseWheel, true);
      }
      Browser.resizeListeners.push(function(width, height) {
        if (GLUT.reshapeFunc) {
        	Runtime.dynCall('vii', GLUT.reshapeFunc, [width, height]);
        }
      });
      __ATEXIT__.push({ func: function() {
        window.removeEventListener("keydown", GLUT.onKeydown, true);
        window.removeEventListener("keyup", GLUT.onKeyup, true);
        if (isTouchDevice) {
          window.removeEventListener("touchmove", GLUT.onMousemove, true);
          window.removeEventListener("touchstart", GLUT.onMouseButtonDown, true);
          window.removeEventListener("touchend", GLUT.onMouseButtonUp, true);
        } else {
          window.removeEventListener("mousemove", GLUT.onMousemove, true);
          window.removeEventListener("mousedown", GLUT.onMouseButtonDown, true);
          window.removeEventListener("mouseup", GLUT.onMouseButtonUp, true);
          // IE9, Chrome, Safari, Opera
          window.removeEventListener("mousewheel", GLUT.onMouseWheel, true);
          // Firefox
          window.removeEventListener("DOMMouseScroll", GLUT.onMouseWheel, true);
        }
        Module["canvas"].width = Module["canvas"].height = 1;
      } });
    }
  function _glutInitDisplayMode(mode) {
      GLUT.initDisplayMode = mode;
    }
  function _glutCreateWindow(name) {
      var contextAttributes = {
        antialias: ((GLUT.initDisplayMode & 0x0080 /*GLUT_MULTISAMPLE*/) != 0),
        depth: ((GLUT.initDisplayMode & 0x0010 /*GLUT_DEPTH*/) != 0),
        stencil: ((GLUT.initDisplayMode & 0x0020 /*GLUT_STENCIL*/) != 0)
      };
      Module.ctx = Browser.createContext(Module['canvas'], true, true, contextAttributes);
      return Module.ctx ? 1 /* a new GLUT window ID for the created context */ : 0 /* failure */;
    }
  function _glutDisplayFunc(func) {
      GLUT.displayFunc = func;
    }
  function _glutKeyboardFunc(func) {
      GLUT.keyboardFunc = func;
    }
  function _glutSpecialFunc(func) {
      GLUT.specialFunc = func;
    }
  function _glutMouseFunc(func) {
      GLUT.mouseFunc = func;
    }
  var GL={counter:1,lastError:0,buffers:[],programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],clientBuffers:[],currArrayBuffer:0,currElementArrayBuffer:0,byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],programInfos:{},stringCache:{},packAlignment:4,unpackAlignment:4,init:function () {
        Browser.moduleContextCreatedCallbacks.push(GL.initExtensions);
      },recordError:function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },getNewId:function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },MINI_TEMP_BUFFER_SIZE:16,miniTempBuffer:null,miniTempBufferViews:[0],MAX_TEMP_BUFFER_SIZE:2097152,tempBufferIndexLookup:null,tempVertexBuffers:null,tempIndexBuffers:null,tempQuadIndexBuffer:null,generateTempBuffers:function (quads) {
        GL.tempBufferIndexLookup = new Uint8Array(GL.MAX_TEMP_BUFFER_SIZE+1);
        GL.tempVertexBuffers = [];
        GL.tempIndexBuffers = [];
        var last = -1, curr = -1;
        var size = 1;
        for (var i = 0; i <= GL.MAX_TEMP_BUFFER_SIZE; i++) {
          if (i > size) {
            size <<= 1;
          }
          if (size != last) {
            curr++;
            GL.tempVertexBuffers[curr] = Module.ctx.createBuffer();
            Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, GL.tempVertexBuffers[curr]);
            Module.ctx.bufferData(Module.ctx.ARRAY_BUFFER, size, Module.ctx.DYNAMIC_DRAW);
            Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, null);
            GL.tempIndexBuffers[curr] = Module.ctx.createBuffer();
            Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, GL.tempIndexBuffers[curr]);
            Module.ctx.bufferData(Module.ctx.ELEMENT_ARRAY_BUFFER, size, Module.ctx.DYNAMIC_DRAW);
            Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, null);
            last = size;
          }
          GL.tempBufferIndexLookup[i] = curr;
        }
        if (quads) {
          // GL_QUAD indexes can be precalculated
          GL.tempQuadIndexBuffer = Module.ctx.createBuffer();
          Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, GL.tempQuadIndexBuffer);
          var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
          var quadIndexes = new Uint16Array(numIndexes);
          var i = 0, v = 0;
          while (1) {
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+1;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+3;
            if (i >= numIndexes) break;
            v += 4;
          }
          Module.ctx.bufferData(Module.ctx.ELEMENT_ARRAY_BUFFER, quadIndexes, Module.ctx.STATIC_DRAW);
          Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, null);
        }
      },findToken:function (source, token) {
        function isIdentChar(ch) {
          if (ch >= 48 && ch <= 57) // 0-9
            return true;
          if (ch >= 65 && ch <= 90) // A-Z
            return true;
          if (ch >= 97 && ch <= 122) // a-z
            return true;
          return false;
        }
        var i = -1;
        do {
          i = source.indexOf(token, i + 1);
          if (i < 0) {
            break;
          }
          if (i > 0 && isIdentChar(source[i - 1])) {
            continue;
          }
          i += token.length;
          if (i < source.length - 1 && isIdentChar(source[i + 1])) {
            continue;
          }
          return true;
        } while (true);
        return false;
      },getSource:function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var frag;
          if (length) {
            var len = HEAP32[(((length)+(i*4))>>2)];
            if (len < 0) {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
            } else {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)], len);
            }
          } else {
            frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
          }
          source += frag;
        }
        // Let's see if we need to enable the standard derivatives extension
        type = Module.ctx.getShaderParameter(GL.shaders[shader], 0x8B4F /* GL_SHADER_TYPE */);
        if (type == 0x8B30 /* GL_FRAGMENT_SHADER */) {
          if (GL.findToken(source, "dFdx") ||
              GL.findToken(source, "dFdy") ||
              GL.findToken(source, "fwidth")) {
            source = "#extension GL_OES_standard_derivatives : enable\n" + source;
            var extension = Module.ctx.getExtension("OES_standard_derivatives");
          }
        }
        return source;
      },computeImageSize:function (width, height, sizePerPixel, alignment) {
        function roundedToNextMultipleOf(x, y) {
          return Math.floor((x + y - 1) / y) * y
        }
        var plainRowSize = width * sizePerPixel;
        var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
        return (height <= 0) ? 0 :
                 ((height - 1) * alignedRowSize + plainRowSize);
      },getTexPixelData:function (type, format, width, height, pixels, internalFormat) {
        var sizePerPixel;
        switch (type) {
          case 0x1401 /* GL_UNSIGNED_BYTE */:
            switch (format) {
              case 0x1906 /* GL_ALPHA */:
              case 0x1909 /* GL_LUMINANCE */:
                sizePerPixel = 1;
                break;
              case 0x1907 /* GL_RGB */:
                sizePerPixel = 3;
                break;
              case 0x1908 /* GL_RGBA */:
                sizePerPixel = 4;
                break;
              case 0x190A /* GL_LUMINANCE_ALPHA */:
                sizePerPixel = 2;
                break;
              default:
                throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x1403 /* GL_UNSIGNED_SHORT */:
            if (format == 0x1902 /* GL_DEPTH_COMPONENT */) {
              sizePerPixel = 2;
            } else {
              throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x1405 /* GL_UNSIGNED_INT */:
            if (format == 0x1902 /* GL_DEPTH_COMPONENT */) {
              sizePerPixel = 4;
            } else {
              throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x84FA /* UNSIGNED_INT_24_8_WEBGL */:
            sizePerPixel = 4;
            break;
          case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
          case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
          case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
            sizePerPixel = 2;
            break;
          case 0x1406 /* GL_FLOAT */:
            switch (format) {
              case 0x1907 /* GL_RGB */:
                sizePerPixel = 3*4;
                break;
              case 0x1908 /* GL_RGBA */:
                sizePerPixel = 4*4;
                break;
              default:
                throw 'Invalid format (' + format + ')';
            }
            internalFormat = Module.ctx.RGBA;
            break;
          default:
            throw 'Invalid type (' + type + ')';
        }
        var bytes = GL.computeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
        if (type == 0x1401 /* GL_UNSIGNED_BYTE */) {
          pixels = HEAPU8.subarray((pixels),(pixels+bytes));
        } else if (type == 0x1406 /* GL_FLOAT */) {
          pixels = HEAPF32.subarray((pixels)>>2,(pixels+bytes)>>2);
        } else if (type == 0x1405 /* GL_UNSIGNED_INT */ || type == 0x84FA /* UNSIGNED_INT_24_8_WEBGL */) {
          pixels = HEAPU32.subarray((pixels)>>2,(pixels+bytes)>>2);
        } else {
          pixels = HEAPU16.subarray((pixels)>>1,(pixels+bytes)>>1);
        }
        return {
          pixels: pixels,
          internalFormat: internalFormat
        }
      },calcBufLength:function calcBufLength(size, type, stride, count) {
        if (stride > 0) {
          return count * stride;  // XXXvlad this is not exactly correct I don't think
        }
        var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
        return size * typeSize * count;
      },usedTempBuffers:[],preDrawHandleClientVertexAttribBindings:function preDrawHandleClientVertexAttribBindings(count) {
        GL.resetBufferBinding = false;
        var used = GL.usedTempBuffers;
        used.length = 0;
        // TODO: initial pass to detect ranges we need to upload, might not need an upload per attrib
        for (var i = 0; i < GL.maxVertexAttribs; ++i) {
          var cb = GL.clientBuffers[i];
          if (!cb.clientside || !cb.enabled) continue;
          GL.resetBufferBinding = true;
          var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
          var index = GL.tempBufferIndexLookup[size];
          var buf;
          do {
            buf = GL.tempVertexBuffers[index++];
          } while (used.indexOf(buf) >= 0);
          used.push(buf);
          Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, buf);
          Module.ctx.bufferSubData(Module.ctx.ARRAY_BUFFER,
                                   0,
                                   HEAPU8.subarray(cb.ptr, cb.ptr + size));
          Module.ctx.vertexAttribPointer(i, cb.size, cb.type, cb.normalized, cb.stride, 0);
        }
      },postDrawHandleClientVertexAttribBindings:function postDrawHandleClientVertexAttribBindings() {
        if (GL.resetBufferBinding) {
          Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, GL.buffers[GL.currArrayBuffer]);
        }
      },initExtensions:function () {
        if (GL.initExtensions.done) return;
        GL.initExtensions.done = true;
        if (!Module.useWebGL) return; // an app might link both gl and 2d backends
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i+1);
        }
        GL.maxVertexAttribs = Module.ctx.getParameter(Module.ctx.MAX_VERTEX_ATTRIBS);
        for (var i = 0; i < GL.maxVertexAttribs; i++) {
          GL.clientBuffers[i] = { enabled: false, clientside: false, size: 0, type: 0, normalized: 0, stride: 0, ptr: 0 };
        }
        GL.generateTempBuffers();
        // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist. 
        GL.compressionExt = Module.ctx.getExtension('WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
        GL.anisotropicExt = Module.ctx.getExtension('EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        GL.floatExt = Module.ctx.getExtension('OES_texture_float');
        // These are the 'safe' feature-enabling extensions that don't add any performance impact related to e.g. debugging, and
        // should be enabled by default so that client GLES2/GL code will not need to go through extra hoops to get its stuff working.
        // As new extensions are ratified at http://www.khronos.org/registry/webgl/extensions/ , feel free to add your new extensions
        // here, as long as they don't produce a performance impact for users that might not be using those extensions.
        // E.g. debugging-related extensions should probably be off by default.
        var automaticallyEnabledExtensions = [ "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives",
                                               "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture",
                                               "OES_element_index_uint", "EXT_texture_filter_anisotropic", "ANGLE_instanced_arrays",
                                               "OES_texture_float_linear", "OES_texture_half_float_linear", "WEBGL_compressed_texture_atc",
                                               "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float",
                                               "EXT_frag_depth", "EXT_sRGB", "WEBGL_draw_buffers", "WEBGL_shared_resources" ];
        function shouldEnableAutomatically(extension) {
          for(var i in automaticallyEnabledExtensions) {
            var include = automaticallyEnabledExtensions[i];
            if (ext.indexOf(include) != -1) {
              return true;
            }
          }
          return false;
        }
        var extensions = Module.ctx.getSupportedExtensions();
        for(var e in extensions) {
          var ext = extensions[e].replace('MOZ_', '').replace('WEBKIT_', '');
          if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
            Module.ctx.getExtension(ext); // Calling .getExtension enables that extension permanently, no need to store the return value to be enabled.
          }
        }
      },populateUniformTable:function (program) {
        var p = GL.programs[program];
        GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0, // This is eagerly computed below, since we already enumerate all uniforms anyway.
          maxAttributeLength: -1 // This is lazily computed and cached, computed when/if first asked, "-1" meaning not computed yet.
        };
        var ptable = GL.programInfos[program];
        var utable = ptable.uniforms;
        // A program's uniform table maps the string name of an uniform to an integer location of that uniform.
        // The global GL.uniforms map maps integer locations to WebGLUniformLocations.
        var numUniforms = Module.ctx.getProgramParameter(p, Module.ctx.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; ++i) {
          var u = Module.ctx.getActiveUniform(p, i);
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length+1);
          // Strip off any trailing array specifier we might have got, e.g. "[0]".
          if (name.indexOf(']', name.length-1) !== -1) {
            var ls = name.lastIndexOf('[');
            name = name.slice(0, ls);
          }
          // Optimize memory usage slightly: If we have an array of uniforms, e.g. 'vec3 colors[3];', then 
          // only store the string 'colors' in utable, and 'colors[0]', 'colors[1]' and 'colors[2]' will be parsed as 'colors'+i.
          // Note that for the GL.uniforms table, we still need to fetch the all WebGLUniformLocations for all the indices.
          var loc = Module.ctx.getUniformLocation(p, name);
          var id = GL.getNewId(GL.uniforms);
          utable[name] = [u.size, id];
          GL.uniforms[id] = loc;
          for (var j = 1; j < u.size; ++j) {
            var n = name + '['+j+']';
            loc = Module.ctx.getUniformLocation(p, n);
            id = GL.getNewId(GL.uniforms);
            GL.uniforms[id] = loc;
          }
        }
      }};function _glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret; 
      switch(name_) {
        case 0x1F00 /* GL_VENDOR */:
        case 0x1F01 /* GL_RENDERER */:
        case 0x1F02 /* GL_VERSION */:
          ret = allocate(intArrayFromString(Module.ctx.getParameter(name_)), 'i8', ALLOC_NORMAL);
          break;
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = Module.ctx.getSupportedExtensions();
          var gl_exts = [];
          for (i in exts) {
            gl_exts.push(exts[i]);
            gl_exts.push("GL_" + exts[i]);
          }
          ret = allocate(intArrayFromString(gl_exts.join(' ')), 'i8', ALLOC_NORMAL);
          break;
        case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
          ret = allocate(intArrayFromString('OpenGL ES GLSL 1.00 (WebGL)'), 'i8', ALLOC_NORMAL);
          break;
        default:
          GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }
  function _glutReshapeWindow(width, height) {
      GLUT.cancelFullScreen();
      Browser.setCanvasSize(width, height);
      if (GLUT.reshapeFunc) {
        Runtime.dynCall('vii', GLUT.reshapeFunc, [width, height]);
      }
      _glutPostRedisplay();
    }function _glutMainLoop() {
      _glutReshapeWindow(Module['canvas'].width, Module['canvas'].height);
      _glutPostRedisplay();
      throw 'SimulateInfiniteLoop';
    }
  function ___gxx_personality_v0() {
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  Module["_strlen"] = _strlen;
  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _glClear(x0) { Module.ctx.clear(x0) }
  function _glUseProgram(program) {
      Module.ctx.useProgram(program ? GL.programs[program] : null);
    }
  function _glEnable(x0) { Module.ctx.enable(x0) }
  function _glDisable(x0) { Module.ctx.disable(x0) }
  function _glFlush() { Module.ctx.flush() }
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  var _ceilf=Math_ceil;
  var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC); 
  Module["_llvm_ctlz_i32"] = _llvm_ctlz_i32;
  function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = GL.getNewId(GL.buffers);
        var buffer = Module.ctx.createBuffer();
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }
  function _glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
      if (target == Module.ctx.ARRAY_BUFFER) {
        GL.currArrayBuffer = buffer;
      } else if (target == Module.ctx.ELEMENT_ARRAY_BUFFER) {
        GL.currElementArrayBuffer = buffer;
      }
      Module.ctx.bindBuffer(target, bufferObj);
    }
  function _glBufferData(target, size, data, usage) {
      switch (usage) { // fix usages, WebGL only has *_DRAW
        case 0x88E1: // GL_STREAM_READ
        case 0x88E2: // GL_STREAM_COPY
          usage = 0x88E0; // GL_STREAM_DRAW
          break;
        case 0x88E5: // GL_STATIC_READ
        case 0x88E6: // GL_STATIC_COPY
          usage = 0x88E4; // GL_STATIC_DRAW
          break;
        case 0x88E9: // GL_DYNAMIC_READ
        case 0x88EA: // GL_DYNAMIC_COPY
          usage = 0x88E8; // GL_DYNAMIC_DRAW
          break;
      }
      Module.ctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
    }
  function _glEnableVertexAttribArray(index) {
      var cb = GL.clientBuffers[index];
      cb.enabled = true;
      Module.ctx.enableVertexAttribArray(index);
    }
  function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      var cb = GL.clientBuffers[index];
      if (!GL.currArrayBuffer) {
        cb.size = size;
        cb.type = type;
        cb.normalized = normalized;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        return;
      }
      cb.clientside = false;
      Module.ctx.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    }
  var _sqrtf=Math_sqrt;
  var _sinf=Math_sin;
  var _cosf=Math_cos;
  function _glDrawArrays(mode, first, count) {
      // bind any client-side buffers
      GL.preDrawHandleClientVertexAttribBindings(first + count);
      Module.ctx.drawArrays(mode, first, count);
      GL.postDrawHandleClientVertexAttribBindings();
    }
  function _glUniformMatrix4fv(location, count, transpose, value) {
      location = GL.uniforms[location];
      var view;
      if (count == 1) {
        // avoid allocation for the common case of uploading one uniform matrix
        view = GL.miniTempBufferViews[15];
        for (var i = 0; i < 16; i++) {
          view[i] = HEAPF32[(((value)+(i*4))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*64)>>2);
      }
      Module.ctx.uniformMatrix4fv(location, transpose, view);
    }
  Module["_memcmp"] = _memcmp;
  function _glUniform3fv(location, count, value) {
      location = GL.uniforms[location];
      var view;
      if (count == 1) {
        // avoid allocation for the common case of uploading one uniform
        view = GL.miniTempBufferViews[2];
        view[0] = HEAPF32[((value)>>2)];
        view[1] = HEAPF32[(((value)+(4))>>2)];
        view[2] = HEAPF32[(((value)+(8))>>2)];
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*12)>>2);
      }
      Module.ctx.uniform3fv(location, view);
    }
  function _glUniform4fv(location, count, value) {
      location = GL.uniforms[location];
      var view;
      if (count == 1) {
        // avoid allocation for the common case of uploading one uniform
        view = GL.miniTempBufferViews[3];
        view[0] = HEAPF32[((value)>>2)];
        view[1] = HEAPF32[(((value)+(4))>>2)];
        view[2] = HEAPF32[(((value)+(8))>>2)];
        view[3] = HEAPF32[(((value)+(12))>>2)];
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*16)>>2);
      }
      Module.ctx.uniform4fv(location, view);
    }
  function _glBlendFunc(x0, x1) { Module.ctx.blendFunc(x0, x1) }
  function _glFrontFace(x0) { Module.ctx.frontFace(x0) }
  function _glCullFace(x0) { Module.ctx.cullFace(x0) }
  function _glClearColor(x0, x1, x2, x3) { Module.ctx.clearColor(x0, x1, x2, x3) }
  function _glDeleteProgram(program) {
      var program = GL.programs[program];
      Module.ctx.deleteProgram(program);
      program.name = 0;
      GL.programs[program] = null;
      GL.programInfos[program] = null;
    }
  var _exp=Math_exp;
  function _glGetProgramiv(program, pname, p) {
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        HEAP32[((p)>>2)]=Module.ctx.getProgramInfoLog(GL.programs[program]).length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        var ptable = GL.programInfos[program];
        if (ptable) {
          HEAP32[((p)>>2)]=ptable.maxUniformLength;
          return;
        } else if (program < GL.counter) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        } else {
          GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        }
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        var ptable = GL.programInfos[program];
        if (ptable) {
          if (ptable.maxAttributeLength == -1) {
            var program = GL.programs[program];
            var numAttribs = Module.ctx.getProgramParameter(program, Module.ctx.ACTIVE_ATTRIBUTES);
            ptable.maxAttributeLength = 0; // Spec says if there are no active attribs, 0 must be returned.
            for(var i = 0; i < numAttribs; ++i) {
              var activeAttrib = Module.ctx.getActiveAttrib(program, i);
              ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length+1);
            }
          }
          HEAP32[((p)>>2)]=ptable.maxAttributeLength;
          return;
        } else if (program < GL.counter) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        } else {
          GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        }
      } else {
        HEAP32[((p)>>2)]=Module.ctx.getProgramParameter(GL.programs[program], pname);
      }
    }
  function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = Module.ctx.getActiveUniform(program, index);
      var infoname = info.name.slice(0, Math.max(0, bufSize - 1));
      writeStringToMemory(infoname, name);
      if (length) {
        HEAP32[((length)>>2)]=infoname.length;
      }
      if (size) {
        HEAP32[((size)>>2)]=info.size;
      }
      if (type) {
        HEAP32[((type)>>2)]=info.type;
      }
    }
  function _glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
      var ptable = GL.programInfos[program];
      if (!ptable) {
        return -1;
      }
      var utable = ptable.uniforms;
      var uniformInfo = utable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }
  function _glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = Module.ctx.getActiveAttrib(program, index);
      var infoname = info.name.slice(0, Math.max(0, bufSize - 1));
      writeStringToMemory(infoname, name);
      if (length) {
        HEAP32[((length)>>2)]=infoname.length;
      }
      if (size) {
        HEAP32[((size)>>2)]=info.size;
      }
      if (type) {
        HEAP32[((type)>>2)]=info.type;
      }
    }
  function _glGetAttribLocation(program, name) {
      program = GL.programs[program];
      name = Pointer_stringify(name);
      return Module.ctx.getAttribLocation(program, name);
    }
  function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = Module.ctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }
  function _glAttachShader(program, shader) {
      Module.ctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }
  function _glDeleteShader(shader) {
      Module.ctx.deleteShader(GL.shaders[shader]);
      GL.shaders[shader] = null;
    }
  function _glDetachShader(program, shader) {
      Module.ctx.detachShader(GL.programs[program],
                              GL.shaders[shader]);
    }
  function _glLinkProgram(program) {
      Module.ctx.linkProgram(GL.programs[program]);
      GL.programInfos[program] = null; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }
  function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = Module.ctx.getProgramInfoLog(GL.programs[program]);
      // Work around a bug in Chromium which causes getProgramInfoLog to return null
      if (!log) {
        log = "";
      }
      log = log.substr(0, maxLength - 1);
      writeStringToMemory(log, infoLog);
      if (length) {
        HEAP32[((length)>>2)]=log.length
      }
    }
  function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = Module.ctx.createShader(shaderType);
      return id;
    }
  function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      Module.ctx.shaderSource(GL.shaders[shader], source);
    }
  function _glCompileShader(shader) {
      Module.ctx.compileShader(GL.shaders[shader]);
    }
  function _glGetShaderiv(shader, pname, p) {
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        HEAP32[((p)>>2)]=Module.ctx.getShaderInfoLog(GL.shaders[shader]).length + 1;
      } else {
        HEAP32[((p)>>2)]=Module.ctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }
  function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = Module.ctx.getShaderInfoLog(GL.shaders[shader]);
      // Work around a bug in Chromium which causes getShaderInfoLog to return null
      if (!log) {
        log = "";
      }
      log = log.substr(0, maxLength - 1);
      writeStringToMemory(log, infoLog);
      if (length) {
        HEAP32[((length)>>2)]=log.length
      }
    }
  var _tanf=Math_tan;
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
GL.init()
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_fii(index,a1,a2) {
  try {
    return Module["dynCall_fii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_dii(index,a1,a2) {
  try {
    return Module["dynCall_dii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTIc|0;var r=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var s=env._stderr|0;var t=env.___fsmu8|0;var u=env._stdout|0;var v=env.__ZTVN10__cxxabiv119__pointer_type_infoE|0;var w=env.___dso_handle|0;var x=+env.NaN;var y=+env.Infinity;var z=0;var A=0;var B=0;var C=0;var D=0,E=0,F=0,G=0,H=0.0,I=0,J=0,K=0,L=0.0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=0;var V=0;var W=global.Math.floor;var X=global.Math.abs;var Y=global.Math.sqrt;var Z=global.Math.pow;var _=global.Math.cos;var $=global.Math.sin;var aa=global.Math.tan;var ab=global.Math.acos;var ac=global.Math.asin;var ad=global.Math.atan;var ae=global.Math.atan2;var af=global.Math.exp;var ag=global.Math.log;var ah=global.Math.ceil;var ai=global.Math.imul;var aj=env.abort;var ak=env.assert;var al=env.asmPrintInt;var am=env.asmPrintFloat;var an=env.min;var ao=env.invoke_viiiii;var ap=env.invoke_fii;var aq=env.invoke_dii;var ar=env.invoke_viii;var as=env.invoke_vi;var at=env.invoke_vii;var au=env.invoke_iii;var av=env.invoke_iiii;var aw=env.invoke_viiiiiid;var ax=env.invoke_ii;var ay=env.invoke_viiiiiii;var az=env.invoke_viiiiid;var aA=env.invoke_v;var aB=env.invoke_iiiiiiiii;var aC=env.invoke_viiiiiiiii;var aD=env.invoke_viiiiiiii;var aE=env.invoke_viiiiii;var aF=env.invoke_iiiii;var aG=env.invoke_iiiiii;var aH=env.invoke_viiii;var aI=env._llvm_lifetime_end;var aJ=env._glFlush;var aK=env._glClearColor;var aL=env._sysconf;var aM=env.__scanString;var aN=env._pthread_mutex_lock;var aO=env.___cxa_end_catch;var aP=env._glLinkProgram;var aQ=env._strtoull;var aR=env._fflush;var aS=env._isxdigit;var aT=env.__isLeapYear;var aU=env._glGetString;var aV=env._glDetachShader;var aW=env._llvm_eh_exception;var aX=env._exit;var aY=env._glCompileShader;var aZ=env._isspace;var a_=env._glutInit;var a$=env.___cxa_guard_abort;var a0=env._newlocale;var a1=env.___gxx_personality_v0;var a2=env._pthread_cond_wait;var a3=env.___cxa_rethrow;var a4=env.___resumeException;var a5=env._glCreateShader;var a6=env._snprintf;var a7=env._glGetActiveAttrib;var a8=env._cosf;var a9=env._vsscanf;var ba=env._glutTimerFunc;var bb=env._fgetc;var bc=env._glGetProgramiv;var bd=env._glVertexAttribPointer;var be=env.__getFloat;var bf=env._atexit;var bg=env.___cxa_free_exception;var bh=env._glGetUniformLocation;var bi=env._glCullFace;var bj=env._glUniform4fv;var bk=env.___setErrNo;var bl=env._glutDisplayFunc;var bm=env._glDrawArrays;var bn=env._glDeleteProgram;var bo=env._glutInitDisplayMode;var bp=env._sprintf;var bq=env.___ctype_b_loc;var br=env._freelocale;var bs=env._glAttachShader;var bt=env._catgets;var bu=env._asprintf;var bv=env.___cxa_is_number_type;var bw=env.___cxa_does_inherit;var bx=env.___cxa_guard_acquire;var by=env._glGetProgramInfoLog;var bz=env.___cxa_begin_catch;var bA=env._sinf;var bB=env._recv;var bC=env.__parseInt64;var bD=env.__ZSt18uncaught_exceptionv;var bE=env.___cxa_call_unexpected;var bF=env._glUniform3fv;var bG=env._fwrite;var bH=env._glGetShaderiv;var bI=env.__exit;var bJ=env._strftime;var bK=env._llvm_va_end;var bL=env.___cxa_throw;var bM=env._send;var bN=env._glShaderSource;var bO=env._pread;var bP=env._sqrtf;var bQ=env.__arraySum;var bR=env._glDisable;var bS=env._glClear;var bT=env._glEnableVertexAttribArray;var bU=env._glutReshapeWindow;var bV=env._glutSpecialFunc;var bW=env.___cxa_find_matching_catch;var bX=env._glutMouseFunc;var bY=env._glutInitWindowSize;var bZ=env._glBindBuffer;var b_=env._glutCreateWindow;var b$=env._glBufferData;var b0=env.__formatString;var b1=env._pthread_cond_broadcast;var b2=env.__ZSt9terminatev;var b3=env._gettimeofday;var b4=env._isascii;var b5=env._pthread_mutex_unlock;var b6=env._sbrk;var b7=env._tanf;var b8=env.___errno_location;var b9=env._strerror;var ca=env._catclose;var cb=env._llvm_lifetime_start;var cc=env._time;var cd=env.___cxa_guard_release;var ce=env._ungetc;var cf=env._uselocale;var cg=env._vsnprintf;var ch=env._glUseProgram;var ci=env._sscanf;var cj=env.___assert_fail;var ck=env._fread;var cl=env._glGetShaderInfoLog;var cm=env._abort;var cn=env._isdigit;var co=env._strtoll;var cp=env.__addDays;var cq=env._glEnable;var cr=env.__reallyNegative;var cs=env._glutPostRedisplay;var ct=env._write;var cu=env._read;var cv=env._glGenBuffers;var cw=env._glGetAttribLocation;var cx=env.___cxa_allocate_exception;var cy=env._glDeleteShader;var cz=env._glBlendFunc;var cA=env._glCreateProgram;var cB=env._ceilf;var cC=env._vasprintf;var cD=env._catopen;var cE=env.___ctype_toupper_loc;var cF=env.___ctype_tolower_loc;var cG=env._glUniformMatrix4fv;var cH=env._glGetActiveUniform;var cI=env._pwrite;var cJ=env._strerror_r;var cK=env._glFrontFace;var cL=env._exp;var cM=env._glutMainLoop;var cN=env._glutKeyboardFunc;var cO=0.0;
// EMSCRIPTEN_START_FUNCS
function c7(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function c8(){return i|0}function c9(a){a=a|0;i=a}function da(a,b){a=a|0;b=b|0;if((z|0)==0){z=a;A=b}}function db(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function dc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function dd(a){a=a|0;M=a}function de(a){a=a|0;N=a}function df(a){a=a|0;O=a}function dg(a){a=a|0;P=a}function dh(a){a=a|0;Q=a}function di(a){a=a|0;R=a}function dj(a){a=a|0;S=a}function dk(a){a=a|0;T=a}function dl(a){a=a|0;U=a}function dm(a){a=a|0;V=a}function dn(){c[3162]=p+8;c[3164]=p+8;c[3166]=p+8;c[3168]=p+8;c[3170]=p+8;c[3172]=p+8;c[3174]=r+8;c[3178]=r+8;c[3182]=r+8;c[3186]=r+8;c[3190]=r+8;c[3194]=r+8;c[3198]=r+8;c[3202]=v+8;c[3205]=q;c[3206]=p+8;c[3240]=r+8;c[3244]=r+8;c[3308]=r+8;c[3312]=r+8;c[3332]=p+8;c[3334]=r+8;c[3370]=r+8;c[3374]=r+8;c[3410]=r+8;c[3414]=r+8;c[3434]=p+8;c[3436]=p+8;c[3438]=r+8;c[3442]=r+8;c[3446]=r+8;c[3450]=r+8;c[3454]=r+8;c[3458]=r+8;c[3462]=p+8;c[3464]=p+8;c[3466]=p+8;c[3468]=p+8;c[3470]=p+8;c[3472]=p+8;c[3474]=p+8;c[3500]=r+8;c[3504]=p+8;c[3506]=r+8;c[3510]=r+8;c[3514]=r+8;c[3518]=p+8;c[3520]=p+8;c[3522]=p+8;c[3524]=p+8;c[3558]=p+8;c[3560]=p+8;c[3562]=p+8;c[3564]=r+8;c[3568]=r+8;c[3572]=r+8;c[3576]=r+8;c[3580]=r+8;c[3584]=r+8;c[3588]=p+8;c[3590]=p+8;c[3592]=p+8;c[3594]=p+8;c[3596]=r+8;c[3600]=r+8;c[3604]=r+8;c[3608]=r+8;c[3612]=r+8;c[3616]=r+8;c[3620]=r+8;c[3626]=r+8;c[3630]=p+8;c[3632]=r+8;c[3636]=r+8;c[3640]=r+8}function dp(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+8>>2]|0;if((b|0)!=0){d=b;while(1){b=c[d>>2]|0;e=d+8|0;f=c[e+12>>2]|0;g=f;if((f|0)!=0){h=e+16|0;e=c[h>>2]|0;if((f|0)!=(e|0)){c[h>>2]=e+(~((e-8+(-g|0)|0)>>>3)<<3)}n6(f)}n6(d);if((b|0)==0){break}else{d=b}}}d=a|0;a=c[d>>2]|0;c[d>>2]=0;if((a|0)==0){return}n6(a);return}function dq(a){a=a|0;cs();ba(33,268,0);return}function dr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;c[g>>2]=a;bY(480,480);a_(g|0,b|0);bo(16);b_(c[b>>2]|0)|0;bl(2);cN(4);bV(2);bX(6);ba(33,268,0);b=dt(21288,3872)|0;g=ds(b,aU(7938)|0)|0;hd(f,g+(c[(c[g>>2]|0)-12>>2]|0)|0);b=lF(f,21192)|0;a=cV[c[(c[b>>2]|0)+28>>2]&63](b,10)|0;lE(f);hY(g,a)|0;hL(g)|0;g=dt(21288,3048)|0;a=ds(g,aU(35724)|0)|0;hd(e,a+(c[(c[a>>2]|0)-12>>2]|0)|0);g=lF(e,21192)|0;f=cV[c[(c[g>>2]|0)+28>>2]&63](g,10)|0;lE(e);hY(a,f)|0;hL(a)|0;a=c[3772]|0;if((a|0)!=0){cT[c[(c[a>>2]|0)+4>>2]&511](a)}a=n4(136)|0;f=a;dv(f);c[a>>2]=8536;c[3772]=f;dy(a);cM();i=d;return 0}function ds(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=g|0;a[k]=0;c[g+4>>2]=b;l=b;m=c[(c[l>>2]|0)-12>>2]|0;n=b;do{if((c[n+(m+16)>>2]|0)==0){o=c[n+(m+72)>>2]|0;if((o|0)!=0){hL(o)|0}a[k]=1;o=og(d|0)|0;p=c[(c[l>>2]|0)-12>>2]|0;c[h>>2]=c[n+(p+24)>>2];q=d+o|0;o=(c[n+(p+4)>>2]&176|0)==32?q:d;r=n+p|0;s=n+(p+76)|0;p=c[s>>2]|0;if((p|0)==-1){hd(f,r);t=lF(f,21192)|0;u=cV[c[(c[t>>2]|0)+28>>2]&63](t,32)|0;lE(f);c[s>>2]=u<<24>>24;v=u}else{v=p&255}du(j,h,d,o,q,r,v);if((c[j>>2]|0)!=0){break}r=c[(c[l>>2]|0)-12>>2]|0;hb(n+r|0,c[n+(r+16)>>2]|5)}}while(0);hW(g);i=e;return b|0}function dt(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=g|0;a[k]=0;c[g+4>>2]=b;l=b;m=c[(c[l>>2]|0)-12>>2]|0;n=b;do{if((c[n+(m+16)>>2]|0)==0){o=c[n+(m+72)>>2]|0;if((o|0)!=0){hL(o)|0}a[k]=1;o=og(d|0)|0;p=c[(c[l>>2]|0)-12>>2]|0;c[h>>2]=c[n+(p+24)>>2];q=d+o|0;o=(c[n+(p+4)>>2]&176|0)==32?q:d;r=n+p|0;s=n+(p+76)|0;p=c[s>>2]|0;if((p|0)==-1){hd(f,r);t=lF(f,21192)|0;u=cV[c[(c[t>>2]|0)+28>>2]&63](t,32)|0;lE(f);c[s>>2]=u<<24>>24;v=u}else{v=p&255}du(j,h,d,o,q,r,v);if((c[j>>2]|0)!=0){break}r=c[(c[l>>2]|0)-12>>2]|0;hb(n+r|0,c[n+(r+16)>>2]|5)}}while(0);hW(g);i=e;return b|0}function du(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;do{if((h|0)>0){if((cW[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){if(q>>>0<11>>>0){h=q<<1&255;e=l;a[e]=h;r=l+1|0;s=h;t=e}else{e=q+16&-16;h=n4(e)|0;c[l+8>>2]=h;g=e|1;c[l>>2]=g;c[l+4>>2]=q;r=h;s=g&255;t=l}of(r|0,j|0,q|0);a[r+q|0]=0;if((s&1)==0){u=l+1|0}else{u=c[l+8>>2]|0}if((cW[c[(c[d>>2]|0)+48>>2]&63](d,u,q)|0)==(q|0)){if((a[t]&1)==0){break}n6(c[l+8>>2]|0);break}c[m>>2]=0;c[b>>2]=0;if((a[t]&1)==0){i=k;return}n6(c[l+8>>2]|0);i=k;return}}while(0);l=n-o|0;do{if((l|0)>0){if((cW[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function dv(a){a=a|0;var b=0,d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0;b=i;i=i+112|0;d=b|0;e=b+64|0;f=b+80|0;h=b+96|0;c[a>>2]=8416;j=a+48|0;of(j|0,0,12);k=a+68|0;c[k>>2]=0;l=k|0;g[l>>2]=1.0;k=a+72|0;m=a+88|0;of(k|0,0,16);g[m>>2]=1.0;n=a+92|0;o=a+108|0;of(n|0,0,16);g[o>>2]=1.0;p=a+112|0;q=a+128|0;of(p|0,0,16);g[q>>2]=1.0;r=a+132|0;c[r>>2]=0;s=1.0/+aa(.5235987901687622);g[a+4>>2]=s;of(a+8|0,0,16);g[a+24>>2]=s;of(a+28|0,0,16);g[a+44>>2]=-1.0020020008087158;g[j>>2]=-1.0;g[a+52>>2]=0.0;g[a+56>>2]=0.0;g[a+60>>2]=-.20020020008087158;g[a+64>>2]=0.0;g[e>>2]=1.0;g[e+4>>2]=0.0;g[e+8>>2]=20.0;g[f>>2]=1.0;g[f+4>>2]=0.0;g[f+8>>2]=0.0;g[h>>2]=0.0;g[h+4>>2]=1.0;g[h+8>>2]=0.0;e9(d,e,f,h);g[l>>2]=+g[d>>2];g[k>>2]=+g[d+4>>2];g[a+76>>2]=+g[d+8>>2];g[a+80>>2]=+g[d+12>>2];g[a+84>>2]=+g[d+16>>2];g[m>>2]=+g[d+20>>2];g[n>>2]=+g[d+24>>2];g[a+96>>2]=+g[d+28>>2];g[a+100>>2]=+g[d+32>>2];g[a+104>>2]=+g[d+36>>2];g[o>>2]=+g[d+40>>2];g[p>>2]=+g[d+44>>2];g[a+116>>2]=+g[d+48>>2];g[a+120>>2]=+g[d+52>>2];g[a+124>>2]=+g[d+56>>2];g[q>>2]=+g[d+60>>2];c[r>>2]=fG(0)|0;i=b;return}function dw(a){a=a|0;eL(a|0);return}function dx(a){a=a|0;eL(a|0);n6(a);return}function dy(b){b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0;d=i;i=i+1888|0;e=d|0;f=d+16|0;h=d+32|0;j=d+96|0;k=d+112|0;l=d+128|0;m=d+144|0;n=d+208|0;o=d+224|0;p=d+240|0;q=d+256|0;r=d+272|0;s=d+288|0;t=d+304|0;u=d+368|0;v=d+384|0;w=d+400|0;x=d+416|0;y=d+432|0;z=d+448|0;A=d+512|0;B=d+528|0;C=d+544|0;D=d+560|0;F=d+624|0;G=d+640|0;H=d+656|0;I=d+672|0;J=d+736|0;K=d+752|0;L=d+768|0;M=d+784|0;N=d+848|0;O=d+864|0;P=d+880|0;Q=d+896|0;R=d+960|0;S=d+976|0;T=d+992|0;U=d+1008|0;V=d+1072|0;W=d+1088|0;X=d+1104|0;Y=d+1120|0;Z=d+1184|0;_=d+1200|0;$=d+1216|0;aa=d+1232|0;ab=d+1296|0;ac=d+1312|0;ad=d+1328|0;ae=d+1344|0;af=d+1408|0;ag=d+1424|0;ah=d+1440|0;ai=d+1456|0;aj=d+1520|0;ak=d+1536|0;al=d+1552|0;am=d+1568|0;an=d+1632|0;ao=d+1648|0;ap=d+1664|0;aq=d+1680|0;ar=d+1696|0;as=d+1712|0;at=d+1776|0;au=d+1792|0;av=d+1808|0;aw=d+1824|0;cq(2929);cq(2884);cK(2305);bi(1029);aK(+0.0,+.30000001192092896,+0.0,+1.0);ax=b+132|0;ay=(c[ax>>2]|0)+20|0;az=e;aA=e;a[aA]=16;aB=az+1|0;aC=aB|0;E=1769172848;a[aC]=E&255;E=E>>8;a[aC+1|0]=E&255;E=E>>8;a[aC+2|0]=E&255;E=E>>8;a[aC+3|0]=E&255;aC=aB+4|0;E=1852795252;a[aC]=E&255;E=E>>8;a[aC+1|0]=E&255;E=E>>8;a[aC+2|0]=E&255;E=E>>8;a[aC+3|0]=E&255;a[az+9|0]=0;az=c[(dS(ay,e)|0)+12>>2]|0;if((a[aA]&1)!=0){n6(c[e+8>>2]|0)}e=(c[ax>>2]|0)+20|0;aA=f;ay=f;a[ay]=12;aC=aA+1|0;a[aC]=a[1552]|0;a[aC+1|0]=a[1553]|0;a[aC+2|0]=a[1554]|0;a[aC+3|0]=a[1555]|0;a[aC+4|0]=a[1556]|0;a[aC+5|0]=a[1557]|0;a[aA+7|0]=0;aA=c[(dS(e,f)|0)+12>>2]|0;if((a[ay]&1)!=0){n6(c[f+8>>2]|0)}bS(16640);f=b+68|0;g[j>>2]=0.0;g[j+4>>2]=0.0;g[j+8>>2]=20.0;g[k>>2]=0.0;g[k+4>>2]=0.0;g[k+8>>2]=0.0;g[l>>2]=0.0;g[l+4>>2]=1.0;g[l+8>>2]=0.0;e9(h,j,k,l);g[f>>2]=+g[h>>2];g[b+72>>2]=+g[h+4>>2];g[b+76>>2]=+g[h+8>>2];g[b+80>>2]=+g[h+12>>2];g[b+84>>2]=+g[h+16>>2];g[b+88>>2]=+g[h+20>>2];g[b+92>>2]=+g[h+24>>2];g[b+96>>2]=+g[h+28>>2];g[b+100>>2]=+g[h+32>>2];g[b+104>>2]=+g[h+36>>2];g[b+108>>2]=+g[h+40>>2];g[b+112>>2]=+g[h+44>>2];g[b+116>>2]=+g[h+48>>2];g[b+120>>2]=+g[h+52>>2];g[b+124>>2]=+g[h+56>>2];g[b+128>>2]=+g[h+60>>2];ch(c[(c[ax>>2]|0)+40>>2]|0);ed(m,b+4|0,f);f=c[ax>>2]|0;b=n4(16)|0;h=n+8|0;c[h>>2]=b;c[n>>2]=17;c[n+4>>2]=11;oe(b|0,2224,11)|0;a[b+11|0]=0;dX(f,n,m,1,0);if((a[n]&1)!=0){n6(c[h>>2]|0)}h=c[ax>>2]|0;n=n4(16)|0;m=o+8|0;c[m>>2]=n;c[o>>2]=17;c[o+4>>2]=11;oe(n|0,504,11)|0;a[n+11|0]=0;g[p>>2]=0.0;g[p+4>>2]=.4000000059604645;g[p+8>>2]=.4000000059604645;g[p+12>>2]=1.0;dU(h,o,p,1);if((a[o]&1)!=0){n6(c[m>>2]|0)}m=c[ax>>2]|0;o=q;p=q;a[p]=18;h=o+1|0;oe(h|0,328,9)|0;a[o+10|0]=0;g[r>>2]=0.0;g[r+4>>2]=6.0;g[r+8>>2]=4.0;dV(m,q,r,1);if((a[p]&1)!=0){n6(c[q+8>>2]|0)}dY(az,aA,10,20);q=c[ax>>2]|0;p=s;r=s;a[r]=16;m=p+1|0;o=m|0;E=1701080941;a[o]=E&255;E=E>>8;a[o+1|0]=E&255;E=E>>8;a[o+2|0]=E&255;E=E>>8;a[o+3|0]=E&255;o=m+4|0;E=1952533868;a[o]=E&255;E=E>>8;a[o+1|0]=E&255;E=E>>8;a[o+2|0]=E&255;E=E>>8;a[o+3|0]=E&255;a[p+9|0]=0;c[t>>2]=0;g[t>>2]=1.0;of(t+4|0,0,16);g[t+20>>2]=1.0;of(t+24|0,0,16);g[t+40>>2]=1.0;of(t+44|0,0,16);g[t+60>>2]=1.0;dX(q,s,t,1,0);if((a[r]&1)!=0){n6(c[s+8>>2]|0)}s=c[ax>>2]|0;r=u;t=u;a[t]=16;q=r+1|0;p=q|0;E=1131966306;a[p]=E&255;E=E>>8;a[p+1|0]=E&255;E=E>>8;a[p+2|0]=E&255;E=E>>8;a[p+3|0]=E&255;p=q+4|0;E=1919904879;a[p]=E&255;E=E>>8;a[p+1|0]=E&255;E=E>>8;a[p+2|0]=E&255;E=E>>8;a[p+3|0]=E&255;a[r+9|0]=0;g[v>>2]=0.0;g[v+4>>2]=.3333333432674408;g[v+8>>2]=0.0;g[v+12>>2]=1.0;dU(s,u,v,1);if((a[t]&1)!=0){n6(c[u+8>>2]|0)}bm(4,0,c[5426]|0);dT(az,aA);u=w;t=w;a[t]=10;v=u+1|0;a[v]=a[2184]|0;a[v+1|0]=a[2185]|0;a[v+2|0]=a[2186]|0;a[v+3|0]=a[2187]|0;a[v+4|0]=a[2188]|0;a[u+6|0]=0;u=c[ax>>2]|0;g[x>>2]=0.0;g[x+4>>2]=5.0;g[x+8>>2]=1.0;g[y>>2]=.800000011920929;g[y+4>>2]=.800000011920929;g[y+8>>2]=2.0;c[z>>2]=0;g[z>>2]=1.0;of(z+4|0,0,16);g[z+20>>2]=1.0;of(z+24|0,0,16);g[z+40>>2]=1.0;of(z+44|0,0,16);g[z+60>>2]=1.0;d_(0,w,u,-65536,x,y,z,2);if((a[t]&1)!=0){n6(c[w+8>>2]|0)}dZ(az,aA);aA=n4(16)|0;az=A+8|0;c[az>>2]=aA;c[A>>2]=17;c[A+4>>2]=14;oe(aA|0,2168,14)|0;a[aA+14|0]=0;aA=c[ax>>2]|0;g[B>>2]=0.0;g[B+4>>2]=0.0;g[B+8>>2]=1.0;g[C>>2]=.20000000298023224;g[C+4>>2]=.20000000298023224;g[C+8>>2]=.20000000298023224;c[D>>2]=0;g[D>>2]=1.0;of(D+4|0,0,16);g[D+20>>2]=1.0;of(D+24|0,0,16);g[D+40>>2]=1.0;of(D+44|0,0,16);g[D+60>>2]=1.0;d_(0,A,aA,-23296,B,C,D,2);if((a[A]&1)!=0){n6(c[az>>2]|0)}do{if((a[15040]&1)==0){az=Z;a[az]=14;A=Z+1|0;a[A]=a[2160]|0;a[A+1|0]=a[2161]|0;a[A+2|0]=a[2162]|0;a[A+3|0]=a[2163]|0;a[A+4|0]=a[2164]|0;a[A+5|0]=a[2165]|0;a[A+6|0]=a[2166]|0;A=Z+8|0;a[A]=0;D=c[ax>>2]|0;g[_>>2]=-2.5;g[_+4>>2]=-3.5;g[_+8>>2]=0.0;g[$>>2]=.20000000298023224;g[$+4>>2]=.20000000298023224;g[$+8>>2]=.20000000298023224;c[aa>>2]=0;g[aa>>2]=1.0;of(aa+4|0,0,16);g[aa+20>>2]=1.0;of(aa+24|0,0,16);g[aa+40>>2]=1.0;of(aa+44|0,0,16);g[aa+60>>2]=1.0;d_(0,Z,D,-8586240,_,$,aa,0);if((a[az]&1)!=0){n6(c[A>>2]|0)}A=ab;az=ab;a[az]=16;D=A+1|0;C=D|0;E=1377843774;a[C]=E&255;E=E>>8;a[C+1|0]=E&255;E=E>>8;a[C+2|0]=E&255;E=E>>8;a[C+3|0]=E&255;C=D+4|0;E=1414022985;a[C]=E&255;E=E>>8;a[C+1|0]=E&255;E=E>>8;a[C+2|0]=E&255;E=E>>8;a[C+3|0]=E&255;a[A+9|0]=0;A=c[ax>>2]|0;g[ac>>2]=-2.5;g[ac+4>>2]=-5.0;g[ac+8>>2]=0.0;g[ad>>2]=.20000000298023224;g[ad+4>>2]=.20000000298023224;g[ad+8>>2]=.20000000298023224;c[ae>>2]=0;g[ae>>2]=1.0;of(ae+4|0,0,16);g[ae+20>>2]=1.0;of(ae+24|0,0,16);g[ae+40>>2]=1.0;of(ae+44|0,0,16);g[ae+60>>2]=1.0;d_(0,ab,A,-8586240,ac,ad,ae,0);if((a[az]&1)!=0){n6(c[ab+8>>2]|0)}az=af;a[az]=14;A=af+1|0;a[A]=a[2096]|0;a[A+1|0]=a[2097]|0;a[A+2|0]=a[2098]|0;a[A+3|0]=a[2099]|0;a[A+4|0]=a[2100]|0;a[A+5|0]=a[2101]|0;a[A+6|0]=a[2102]|0;A=af+8|0;a[A]=0;C=c[ax>>2]|0;g[ag>>2]=-2.5;g[ag+4>>2]=-6.5;g[ag+8>>2]=0.0;g[ah>>2]=.20000000298023224;g[ah+4>>2]=.20000000298023224;g[ah+8>>2]=.20000000298023224;c[ai>>2]=0;g[ai>>2]=1.0;of(ai+4|0,0,16);g[ai+20>>2]=1.0;of(ai+24|0,0,16);g[ai+40>>2]=1.0;of(ai+44|0,0,16);g[ai+60>>2]=1.0;d_(0,af,C,-8586240,ag,ah,ai,0);if((a[az]&1)!=0){n6(c[A>>2]|0)}A=aj;az=aj;a[az]=12;C=A+1|0;a[C]=a[2080]|0;a[C+1|0]=a[2081]|0;a[C+2|0]=a[2082]|0;a[C+3|0]=a[2083]|0;a[C+4|0]=a[2084]|0;a[C+5|0]=a[2085]|0;a[A+7|0]=0;A=c[ax>>2]|0;g[ak>>2]=-2.5;g[ak+4>>2]=-8.0;g[ak+8>>2]=0.0;g[al>>2]=.20000000298023224;g[al+4>>2]=.20000000298023224;g[al+8>>2]=.20000000298023224;c[am>>2]=0;g[am>>2]=1.0;of(am+4|0,0,16);g[am+20>>2]=1.0;of(am+24|0,0,16);g[am+40>>2]=1.0;of(am+44|0,0,16);g[am+60>>2]=1.0;d_(0,aj,A,-8586240,ak,al,am,0);if((a[az]&1)==0){break}n6(c[aj+8>>2]|0)}else{az=F;A=F;a[A]=16;C=az+1|0;D=C|0;E=542330964;a[D]=E&255;E=E>>8;a[D+1|0]=E&255;E=E>>8;a[D+2|0]=E&255;E=E>>8;a[D+3|0]=E&255;D=C+4|0;E=1162104653;a[D]=E&255;E=E>>8;a[D+1|0]=E&255;E=E>>8;a[D+2|0]=E&255;E=E>>8;a[D+3|0]=E&255;a[az+9|0]=0;az=c[ax>>2]|0;g[G>>2]=-2.5;g[G+4>>2]=-2.0;g[G+8>>2]=0.0;g[H>>2]=.20000000298023224;g[H+4>>2]=.20000000298023224;g[H+8>>2]=.20000000298023224;c[I>>2]=0;g[I>>2]=1.0;of(I+4|0,0,16);g[I+20>>2]=1.0;of(I+24|0,0,16);g[I+40>>2]=1.0;of(I+44|0,0,16);g[I+60>>2]=1.0;d_(0,F,az,-16711681,G,H,I,0);if((a[A]&1)!=0){n6(c[F+8>>2]|0)}A=J;a[A]=14;az=J+1|0;a[az]=a[2160]|0;a[az+1|0]=a[2161]|0;a[az+2|0]=a[2162]|0;a[az+3|0]=a[2163]|0;a[az+4|0]=a[2164]|0;a[az+5|0]=a[2165]|0;a[az+6|0]=a[2166]|0;az=J+8|0;a[az]=0;D=c[ax>>2]|0;g[K>>2]=-2.5;g[K+4>>2]=-3.5;g[K+8>>2]=0.0;g[L>>2]=.20000000298023224;g[L+4>>2]=.20000000298023224;g[L+8>>2]=.20000000298023224;c[M>>2]=0;g[M>>2]=1.0;of(M+4|0,0,16);g[M+20>>2]=1.0;of(M+24|0,0,16);g[M+40>>2]=1.0;of(M+44|0,0,16);g[M+60>>2]=1.0;d_(0,J,D,-16711681,K,L,M,0);if((a[A]&1)!=0){n6(c[az>>2]|0)}az=N;A=N;a[A]=16;D=az+1|0;C=D|0;E=1377843774;a[C]=E&255;E=E>>8;a[C+1|0]=E&255;E=E>>8;a[C+2|0]=E&255;E=E>>8;a[C+3|0]=E&255;C=D+4|0;E=1414022985;a[C]=E&255;E=E>>8;a[C+1|0]=E&255;E=E>>8;a[C+2|0]=E&255;E=E>>8;a[C+3|0]=E&255;a[az+9|0]=0;az=c[ax>>2]|0;g[O>>2]=-2.5;g[O+4>>2]=-5.0;g[O+8>>2]=0.0;g[P>>2]=.20000000298023224;g[P+4>>2]=.20000000298023224;g[P+8>>2]=.20000000298023224;c[Q>>2]=0;g[Q>>2]=1.0;of(Q+4|0,0,16);g[Q+20>>2]=1.0;of(Q+24|0,0,16);g[Q+40>>2]=1.0;of(Q+44|0,0,16);g[Q+60>>2]=1.0;d_(0,N,az,-16711681,O,P,Q,0);if((a[A]&1)!=0){n6(c[N+8>>2]|0)}A=R;az=R;a[az]=12;C=A+1|0;a[C]=a[2120]|0;a[C+1|0]=a[2121]|0;a[C+2|0]=a[2122]|0;a[C+3|0]=a[2123]|0;a[C+4|0]=a[2124]|0;a[C+5|0]=a[2125]|0;a[A+7|0]=0;A=c[ax>>2]|0;g[S>>2]=-2.5;g[S+4>>2]=-6.5;g[S+8>>2]=0.0;g[T>>2]=.20000000298023224;g[T+4>>2]=.20000000298023224;g[T+8>>2]=.20000000298023224;c[U>>2]=0;g[U>>2]=1.0;of(U+4|0,0,16);g[U+20>>2]=1.0;of(U+24|0,0,16);g[U+40>>2]=1.0;of(U+44|0,0,16);g[U+60>>2]=1.0;d_(0,R,A,-16711681,S,T,U,0);if((a[az]&1)!=0){n6(c[R+8>>2]|0)}az=V;a[az]=14;A=V+1|0;a[A]=a[2112]|0;a[A+1|0]=a[2113]|0;a[A+2|0]=a[2114]|0;a[A+3|0]=a[2115]|0;a[A+4|0]=a[2116]|0;a[A+5|0]=a[2117]|0;a[A+6|0]=a[2118]|0;A=V+8|0;a[A]=0;C=c[ax>>2]|0;g[W>>2]=-2.5;g[W+4>>2]=-8.0;g[W+8>>2]=0.0;g[X>>2]=.20000000298023224;g[X+4>>2]=.20000000298023224;g[X+8>>2]=.20000000298023224;c[Y>>2]=0;g[Y>>2]=1.0;of(Y+4|0,0,16);g[Y+20>>2]=1.0;of(Y+24|0,0,16);g[Y+40>>2]=1.0;of(Y+44|0,0,16);g[Y+60>>2]=1.0;d_(0,V,C,-16711681,W,X,Y,0);if((a[az]&1)==0){break}n6(c[A>>2]|0)}}while(0);Y=c[ax>>2]|0;X=an;W=an;a[W]=18;V=X+1|0;oe(V|0,328,9)|0;a[X+10|0]=0;g[ao>>2]=0.0;g[ao+4>>2]=-6.0;g[ao+8>>2]=8.0;dV(Y,an,ao,1);if((a[W]&1)!=0){n6(c[an+8>>2]|0)}an=n4(16)|0;W=ap+8|0;c[W>>2]=an;c[ap>>2]=17;c[ap+4>>2]=13;oe(an|0,2064,13)|0;a[an+13|0]=0;an=c[ax>>2]|0;g[aq>>2]=0.0;g[aq+4>>2]=-9.5;g[aq+8>>2]=2.0;g[ar>>2]=.15000000596046448;g[ar+4>>2]=.15000000596046448;g[ar+8>>2]=.05000000074505806;c[as>>2]=0;g[as>>2]=1.0;of(as+4|0,0,16);g[as+20>>2]=1.0;of(as+24|0,0,16);g[as+40>>2]=1.0;of(as+44|0,0,16);g[as+60>>2]=1.0;d_(0,ap,an,-65536,aq,ar,as,2);if((a[ap]&1)!=0){n6(c[W>>2]|0)}ha(at,2024,21736);W=c[ax>>2]|0;g[au>>2]=8.0;g[au+4>>2]=-9.5;g[au+8>>2]=2.0;g[av>>2]=.15000000596046448;g[av+4>>2]=.15000000596046448;g[av+8>>2]=.05000000074505806;c[aw>>2]=0;g[aw>>2]=1.0;of(aw+4|0,0,16);g[aw+20>>2]=1.0;of(aw+24|0,0,16);g[aw+40>>2]=1.0;of(aw+44|0,0,16);g[aw+60>>2]=1.0;d_(0,at,W,-65536,au,av,aw,2);if((a[at]&1)==0){aJ();i=d;return}n6(c[at+8>>2]|0);aJ();i=d;return}function dz(a){a=a|0;return}function dA(b,d){b=b|0;d=d|0;var e=0,f=0;if((d<<24>>24|0)==116|(d<<24>>24|0)==84){a[15040]=a[15040]&1^1;d=c[3772]|0;if((d|0)!=0){cT[c[(c[d>>2]|0)+4>>2]&511](d)}d=n4(136)|0;b=d;dv(b);c[d>>2]=8536;c[3772]=b;dy(d);return}d=c[3772]|0;b=(d|0)==0;if((a[15040]&1)==0){if(!b){cT[c[(c[d>>2]|0)+4>>2]&511](d)}e=n4(140)|0;f=e;dv(f);c[e>>2]=8376;c[e+136>>2]=0;c[3772]=f;dE(e);return}else{if(!b){cT[c[(c[d>>2]|0)+4>>2]&511](d)}d=n4(256)|0;b=d;dv(b);c[d+136>>2]=0;c[d>>2]=8496;a[d+144|0]=0;c[d+200>>2]=0;c[d+224>>2]=0;c[d+248>>2]=0;of(d+148|0,0,24);c[3772]=b;dE(d);return}}function dB(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=c[3772]|0;if((e|0)!=0){cT[c[(c[e>>2]|0)+4>>2]&511](e)}e=n4(140)|0;d=e;dv(d);c[e>>2]=8376;c[e+136>>2]=0;c[3772]=d;dE(e);return}function dC(a){a=a|0;var b=0;c[a>>2]=8376;b=c[a+136>>2]|0;if((b|0)!=0){e2(b);n6(b)}eL(a|0);return}function dD(a){a=a|0;var b=0;c[a>>2]=8376;b=c[a+136>>2]|0;if((b|0)!=0){e2(b);n6(b)}eL(a|0);n6(a);return}function dE(b){b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;i=i+144|0;e=d|0;f=d+64|0;h=d+80|0;j=d+96|0;k=d+112|0;l=d+128|0;cq(2929);cq(2884);cK(2305);bi(1029);aK(+0.0,+.30000001192092896,+0.0,+1.0);cz(770,771);m=b+132|0;ch(c[(c[m>>2]|0)+40>>2]|0);ed(e,b+4|0,b+68|0);n=c[m>>2]|0;o=n4(16)|0;p=f+8|0;c[p>>2]=o;c[f>>2]=17;c[f+4>>2]=11;oe(o|0,2224,11)|0;a[o+11|0]=0;dX(n,f,e,1,0);if((a[f]&1)!=0){n6(c[p>>2]|0)}p=c[m>>2]|0;f=n4(16)|0;e=h+8|0;c[e>>2]=f;c[h>>2]=17;c[h+4>>2]=11;oe(f|0,504,11)|0;a[f+11|0]=0;g[j>>2]=0.0;g[j+4>>2]=.4000000059604645;g[j+8>>2]=.4000000059604645;g[j+12>>2]=1.0;dU(p,h,j,1);if((a[h]&1)!=0){n6(c[e>>2]|0)}e=c[m>>2]|0;m=k;h=k;a[h]=18;j=m+1|0;oe(j|0,328,9)|0;a[m+10|0]=0;g[l>>2]=0.0;g[l+4>>2]=6.0;g[l+8>>2]=4.0;dV(e,k,l,1);if((a[h]&1)!=0){n6(c[k+8>>2]|0)}k=n4(120)|0;eR(k,10,20);c[b+136>>2]=k;eQ(k);i=d;return}function dF(b){b=b|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0,ac=0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0;e=i;i=i+944|0;f=e|0;h=e+16|0;j=e+32|0;k=e+48|0;l=e+64|0;m=e+80|0;n=e+96|0;o=e+112|0;p=e+128|0;q=e+192|0;r=e+208|0;s=e+224|0;t=e+288|0;u=e+304|0;v=e+320|0;w=e+384|0;x=e+400|0;y=e+416|0;z=e+480|0;A=e+496|0;B=e+512|0;C=e+528|0;D=e+544|0;F=e+608|0;G=e+624|0;H=e+640|0;I=e+656|0;J=e+672|0;K=e+736|0;L=e+752|0;M=e+768|0;N=e+784|0;O=e+848|0;P=e+864|0;Q=e+880|0;R=b+136|0;S=c[R>>2]|0;if((a[S+20|0]&1)!=0){T=c[3772]|0;if((T|0)!=0){cT[c[(c[T>>2]|0)+4>>2]&511](T)}T=n4(136)|0;U=T;dv(U);c[T>>2]=8456;c[3772]=U;eG(T);i=e;return}dR(S);S=b+132|0;T=(c[S>>2]|0)+20|0;U=f;V=f;a[V]=16;W=U+1|0;X=W|0;E=1769172848;a[X]=E&255;E=E>>8;a[X+1|0]=E&255;E=E>>8;a[X+2|0]=E&255;E=E>>8;a[X+3|0]=E&255;X=W+4|0;E=1852795252;a[X]=E&255;E=E>>8;a[X+1|0]=E&255;E=E>>8;a[X+2|0]=E&255;E=E>>8;a[X+3|0]=E&255;a[U+9|0]=0;U=c[(dS(T,f)|0)+12>>2]|0;if((a[V]&1)!=0){n6(c[f+8>>2]|0)}f=(c[S>>2]|0)+20|0;V=h;T=h;a[T]=12;X=V+1|0;a[X]=a[1552]|0;a[X+1|0]=a[1553]|0;a[X+2|0]=a[1554]|0;a[X+3|0]=a[1555]|0;a[X+4|0]=a[1556]|0;a[X+5|0]=a[1557]|0;a[V+7|0]=0;V=c[(dS(f,h)|0)+12>>2]|0;if((a[T]&1)!=0){n6(c[h+8>>2]|0)}h=c[R>>2]|0;T=c[h+4>>2]|0;f=c[h+8>>2]|0;do{if((a[21952]|0)==0){if((bx(21952)|0)==0){break}h=c[c[R>>2]>>2]|0;Y=+(-(c[h>>2]|0)|0)*.5+.5;Z=+(-(c[h+4>>2]|0)|0)*.5+.5;of(17640,0,52);g[4410]=1.0;of(17644,0,16);g[4415]=1.0;of(17664,0,16);g[4420]=1.0;g[4421]=0.0;_=Y*0.0;$=Z*0.0;aa=_+$+0.0;g[4422]=Y+$+0.0;g[4423]=_+Z+0.0;g[4424]=aa;g[4425]=aa+1.0}}while(0);bS(16640);ch(c[(c[S>>2]|0)+40>>2]|0);dT(U,V);h=(T|0)!=0;if(h){switch(d[T|0]|0){case 1:{ab=-16711681;break};case 2:{ab=-256;break};case 3:{ab=-8586240;break};case 4:{ab=-52429;break};case 5:{ab=-10066177;break};case 6:{ab=-23296;break};case 7:{ab=-7077677;break};default:{X=cx(4)|0;c[X>>2]=2272;bL(X|0,12808,0)}}X=c[S>>2]|0;W=n4(16)|0;ac=j+8|0;c[ac>>2]=W;c[j>>2]=17;c[j+4>>2]=11;oe(W|0,504,11)|0;a[W+11|0]=0;aa=+(ab>>>16&255|0)/255.0;Z=+(ab>>>8&255|0)/255.0;_=+(ab&255|0)/255.0;g[k>>2]=aa;g[k+4>>2]=Z;g[k+8>>2]=_;g[k+12>>2]=1.0;dU(X,j,k,1);if((a[j]&1)!=0){n6(c[ac>>2]|0)}ac=c[S>>2]|0;j=l;k=l;a[k]=18;X=j+1|0;oe(X|0,328,9)|0;a[j+10|0]=0;j=T+16|0;X=T+20|0;$=+(c[j>>2]|0);Y=+(c[X>>2]|0);ad=+g[4423]+($*+g[4411]+Y*+g[4415]+ +g[4419]*0.0);g[m>>2]=+g[4422]+($*+g[4410]+Y*+g[4414]+ +g[4418]*0.0);g[m+4>>2]=ad;g[m+8>>2]=2.0;dV(ac,l,m,1);if((a[k]&1)!=0){n6(c[l+8>>2]|0)}l=c[S>>2]|0;k=n;m=n;a[m]=16;ac=k+1|0;ab=ac|0;E=1131966306;a[ab]=E&255;E=E>>8;a[ab+1|0]=E&255;E=E>>8;a[ab+2|0]=E&255;E=E>>8;a[ab+3|0]=E&255;ab=ac+4|0;E=1919904879;a[ab]=E&255;E=E>>8;a[ab+1|0]=E&255;E=E>>8;a[ab+2|0]=E&255;E=E>>8;a[ab+3|0]=E&255;a[k+9|0]=0;g[o>>2]=aa;g[o+4>>2]=Z;g[o+8>>2]=_;g[o+12>>2]=1.0;dU(l,n,o,1);if((a[m]&1)!=0){n6(c[n+8>>2]|0)}_=+(c[j>>2]|0);Z=+(c[X>>2]|0);of(p|0,0,52);aa=+g[4410];g[p>>2]=aa;ad=+g[4411];g[p+4>>2]=ad;Y=+g[4412];g[p+8>>2]=Y;$=+g[4413];g[p+12>>2]=$;ae=+g[4414];g[p+16>>2]=ae;af=+g[4415];g[p+20>>2]=af;ag=+g[4416];g[p+24>>2]=ag;ah=+g[4417];g[p+28>>2]=ah;ai=+g[4418];g[p+32>>2]=ai;aj=+g[4419];g[p+36>>2]=aj;ak=+g[4420];g[p+40>>2]=ak;al=+g[4421];g[p+44>>2]=al;am=_*ad+Z*af+aj*0.0+ +g[4423];aj=_*Y+Z*ag+ak*0.0+ +g[4424];ak=_*$+Z*ah+al*0.0+ +g[4425];g[p+48>>2]=_*aa+Z*ae+ai*0.0+ +g[4422];g[p+52>>2]=am;g[p+56>>2]=aj;g[p+60>>2]=ak;dW(b,T,p)}if((f|0)!=0){switch(d[f|0]|0){case 2:{an=-256;break};case 3:{an=-8586240;break};case 4:{an=-52429;break};case 5:{an=-10066177;break};case 6:{an=-23296;break};case 7:{an=-7077677;break};case 1:{an=-16711681;break};default:{p=cx(4)|0;c[p>>2]=2272;bL(p|0,12808,0)}}p=c[S>>2]|0;X=q;j=q;a[j]=16;n=X+1|0;m=n|0;E=1131966306;a[m]=E&255;E=E>>8;a[m+1|0]=E&255;E=E>>8;a[m+2|0]=E&255;E=E>>8;a[m+3|0]=E&255;m=n+4|0;E=1919904879;a[m]=E&255;E=E>>8;a[m+1|0]=E&255;E=E>>8;a[m+2|0]=E&255;E=E>>8;a[m+3|0]=E&255;a[X+9|0]=0;g[r>>2]=+(an>>>16&255|0)/255.0;g[r+4>>2]=+(an>>>8&255|0)/255.0;g[r+8>>2]=+(an&255|0)/255.0;g[r+12>>2]=1.0;dU(p,q,r,1);if((a[j]&1)!=0){n6(c[q+8>>2]|0)}of(s|0,0,48);g[s>>2]=1.0;of(s+4|0,0,16);g[s+20>>2]=1.0;of(s+24|0,0,16);g[s+40>>2]=.20000000298023224;g[s+44>>2]=0.0;g[s+48>>2]=8.0;g[s+52>>2]=6.0;g[s+56>>2]=1.0;g[s+60>>2]=1.0;dW(b,f,s)}s=c[R>>2]|0;f=c[s>>2]|0;L293:do{if((c[f>>2]|0)>0){q=t;j=t;r=q+1|0;p=q+9|0;q=u|0;an=u+4|0;X=u+8|0;m=u+12|0;n=v;o=v|0;l=v+4|0;k=v+8|0;ab=v+12|0;ac=v+16|0;W=v+20|0;ao=v+24|0;ap=v+28|0;aq=v+32|0;ar=v+36|0;as=v+40|0;at=v+44|0;au=v+48|0;av=v+52|0;aw=v+56|0;ax=v+60|0;ay=w;az=w;aA=ay+1|0;aB=ay+9|0;ay=w+8|0;aC=t+8|0;aD=0;aE=s;aF=f;L295:while(1){if((c[aF+4>>2]|0)>0){ak=+(aD|0);aG=0;aH=aF;aI=aE;while(1){aK=a[(c[(c[aH+8>>2]|0)+(aD*12|0)>>2]|0)+aG|0]|0;if(aK<<24>>24==0){aL=aI}else{switch(aK&255|0){case 2:{aM=-256;break};case 3:{aM=-8586240;break};case 4:{aM=-52429;break};case 5:{aM=-10066177;break};case 6:{aM=-23296;break};case 7:{aM=-7077677;break};case 1:{aM=-16711681;break};default:{break L295}}aK=c[S>>2]|0;a[j]=16;aN=r|0;E=1131966306;a[aN]=E&255;E=E>>8;a[aN+1|0]=E&255;E=E>>8;a[aN+2|0]=E&255;E=E>>8;a[aN+3|0]=E&255;aN=r+4|0;E=1919904879;a[aN]=E&255;E=E>>8;a[aN+1|0]=E&255;E=E>>8;a[aN+2|0]=E&255;E=E>>8;a[aN+3|0]=E&255;a[p]=0;g[q>>2]=+(aM>>>16&255|0)/255.0;g[an>>2]=+(aM>>>8&255|0)/255.0;g[X>>2]=+(aM&255|0)/255.0;g[m>>2]=1.0;dU(aK,t,u,1);if((a[j]&1)!=0){n6(c[aC>>2]|0)}aj=+(aG|0);of(n|0,0,52);am=+g[4410];g[o>>2]=am;ai=+g[4411];g[l>>2]=ai;ae=+g[4412];g[k>>2]=ae;Z=+g[4413];g[ab>>2]=Z;aa=+g[4414];g[ac>>2]=aa;_=+g[4415];g[W>>2]=_;al=+g[4416];g[ao>>2]=al;ah=+g[4417];g[ap>>2]=ah;$=+g[4418];g[aq>>2]=$;ag=+g[4419];g[ar>>2]=ag;Y=+g[4420];g[as>>2]=Y;af=+g[4421];g[at>>2]=af;ad=ak*ai+aj*_+ag*0.0+ +g[4423];ag=ak*ae+aj*al+Y*0.0+ +g[4424];Y=ak*Z+aj*ah+af*0.0+ +g[4425];g[au>>2]=ak*am+aj*aa+$*0.0+ +g[4422];g[av>>2]=ad;g[aw>>2]=ag;g[ax>>2]=Y;aK=c[S>>2]|0;a[az]=16;aN=aA|0;E=1701080941;a[aN]=E&255;E=E>>8;a[aN+1|0]=E&255;E=E>>8;a[aN+2|0]=E&255;E=E>>8;a[aN+3|0]=E&255;aN=aA+4|0;E=1952533868;a[aN]=E&255;E=E>>8;a[aN+1|0]=E&255;E=E>>8;a[aN+2|0]=E&255;E=E>>8;a[aN+3|0]=E&255;a[aB]=0;dX(aK,w,v,1,0);if((a[az]&1)!=0){n6(c[ay>>2]|0)}bm(4,0,c[5426]|0);aL=c[R>>2]|0}aK=aG+1|0;aN=c[aL>>2]|0;if((aK|0)<(c[aN+4>>2]|0)){aG=aK;aH=aN;aI=aL}else{aO=aL;aP=aN;break}}}else{aO=aE;aP=aF}aI=aD+1|0;if((aI|0)<(c[aP>>2]|0)){aD=aI;aE=aO;aF=aP}else{break L293}}aF=cx(4)|0;c[aF>>2]=2272;bL(aF|0,12808,0)}}while(0);dY(U,V,10,20);aP=c[S>>2]|0;aO=x;aL=x;a[aL]=16;v=aO+1|0;w=v|0;E=1701080941;a[w]=E&255;E=E>>8;a[w+1|0]=E&255;E=E>>8;a[w+2|0]=E&255;E=E>>8;a[w+3|0]=E&255;w=v+4|0;E=1952533868;a[w]=E&255;E=E>>8;a[w+1|0]=E&255;E=E>>8;a[w+2|0]=E&255;E=E>>8;a[w+3|0]=E&255;a[aO+9|0]=0;c[y>>2]=0;g[y>>2]=1.0;of(y+4|0,0,16);g[y+20>>2]=1.0;of(y+24|0,0,16);g[y+40>>2]=1.0;of(y+44|0,0,16);g[y+60>>2]=1.0;dX(aP,x,y,1,0);if((a[aL]&1)!=0){n6(c[x+8>>2]|0)}x=c[S>>2]|0;aL=z;y=z;a[y]=16;aP=aL+1|0;aO=aP|0;E=1131966306;a[aO]=E&255;E=E>>8;a[aO+1|0]=E&255;E=E>>8;a[aO+2|0]=E&255;E=E>>8;a[aO+3|0]=E&255;aO=aP+4|0;E=1919904879;a[aO]=E&255;E=E>>8;a[aO+1|0]=E&255;E=E>>8;a[aO+2|0]=E&255;E=E>>8;a[aO+3|0]=E&255;a[aL+9|0]=0;g[A>>2]=0.0;g[A+4>>2]=.3333333432674408;g[A+8>>2]=0.0;g[A+12>>2]=1.0;dU(x,z,A,1);if((a[y]&1)!=0){n6(c[z+8>>2]|0)}bm(4,0,c[5426]|0);if(h){dT(U,V);cq(3042);h=c[S>>2]|0;z=B;y=B;a[y]=16;A=z+1|0;x=A|0;E=1131966306;a[x]=E&255;E=E>>8;a[x+1|0]=E&255;E=E>>8;a[x+2|0]=E&255;E=E>>8;a[x+3|0]=E&255;x=A+4|0;E=1919904879;a[x]=E&255;E=E>>8;a[x+1|0]=E&255;E=E>>8;a[x+2|0]=E&255;E=E>>8;a[x+3|0]=E&255;a[z+9|0]=0;g[C>>2]=1.0;g[C+4>>2]=1.0;g[C+8>>2]=1.0;g[C+12>>2]=.3333333432674408;dU(h,B,C,1);if((a[y]&1)!=0){n6(c[B+8>>2]|0)}B=c[R>>2]|0;ak=+(c[B+12>>2]|0);Y=+(c[B+16>>2]|0);of(D|0,0,52);ag=+g[4410];g[D>>2]=ag;ad=+g[4411];g[D+4>>2]=ad;$=+g[4412];g[D+8>>2]=$;aa=+g[4413];g[D+12>>2]=aa;aj=+g[4414];g[D+16>>2]=aj;am=+g[4415];g[D+20>>2]=am;af=+g[4416];g[D+24>>2]=af;ah=+g[4417];g[D+28>>2]=ah;Z=+g[4418];g[D+32>>2]=Z;al=+g[4419];g[D+36>>2]=al;ae=+g[4420];g[D+40>>2]=ae;_=+g[4421];g[D+44>>2]=_;ai=ak*ad+Y*am+al*0.0+ +g[4423];al=ak*$+Y*af+ae*0.0+ +g[4424];ae=ak*aa+Y*ah+_*0.0+ +g[4425];g[D+48>>2]=ak*ag+Y*aj+Z*0.0+ +g[4422];g[D+52>>2]=ai;g[D+56>>2]=al;g[D+60>>2]=ae;B=c[S>>2]|0;y=F;C=F;a[C]=16;h=y+1|0;z=h|0;E=1701080941;a[z]=E&255;E=E>>8;a[z+1|0]=E&255;E=E>>8;a[z+2|0]=E&255;E=E>>8;a[z+3|0]=E&255;z=h+4|0;E=1952533868;a[z]=E&255;E=E>>8;a[z+1|0]=E&255;E=E>>8;a[z+2|0]=E&255;E=E>>8;a[z+3|0]=E&255;a[y+9|0]=0;dX(B,F,D,1,0);if((a[C]&1)!=0){n6(c[F+8>>2]|0)}dW(b,T,D);bR(3042)}dZ(U,V);V=G;U=G;a[U]=8;D=V+1|0;E=1415071054;a[D]=E&255;E=E>>8;a[D+1|0]=E&255;E=E>>8;a[D+2|0]=E&255;E=E>>8;a[D+3|0]=E&255;a[V+5|0]=0;V=c[S>>2]|0;g[H>>2]=8.0;g[H+4>>2]=8.0;g[H+8>>2]=1.0;g[I>>2]=.20000000298023224;g[I+4>>2]=.20000000298023224;g[I+8>>2]=.20000000298023224;c[J>>2]=0;g[J>>2]=1.0;of(J+4|0,0,16);g[J+20>>2]=1.0;of(J+24|0,0,16);g[J+40>>2]=1.0;of(J+44|0,0,16);g[J+60>>2]=1.0;d_(0,G,V,-23245,H,I,J,2);if((a[U]&1)!=0){n6(c[G+8>>2]|0)}G=K;U=K;a[U]=10;J=G+1|0;a[J]=a[4272]|0;a[J+1|0]=a[4273]|0;a[J+2|0]=a[4274]|0;a[J+3|0]=a[4275]|0;a[J+4|0]=a[4276]|0;a[G+6|0]=0;G=c[S>>2]|0;g[L>>2]=8.0;g[L+4>>2]=0.0;g[L+8>>2]=1.0;g[M>>2]=.20000000298023224;g[M+4>>2]=.20000000298023224;g[M+8>>2]=.20000000298023224;c[N>>2]=0;g[N>>2]=1.0;of(N+4|0,0,16);g[N+20>>2]=1.0;of(N+24|0,0,16);g[N+40>>2]=1.0;of(N+44|0,0,16);g[N+60>>2]=1.0;d_(0,K,G,-23245,L,M,N,2);if((a[U]&1)!=0){n6(c[K+8>>2]|0)}K=c[(c[R>>2]|0)+28>>2]|0;R=c[S>>2]|0;g[O>>2]=8.0;g[O+4>>2]=-1.5;g[O+8>>2]=1.0;g[P>>2]=.20000000298023224;g[P+4>>2]=.20000000298023224;g[P+8>>2]=.20000000298023224;c[Q>>2]=0;g[Q>>2]=1.0;of(Q+4|0,0,16);g[Q+20>>2]=1.0;of(Q+24|0,0,16);g[Q+40>>2]=1.0;of(Q+44|0,0,16);g[Q+60>>2]=1.0;d$(0,K,6,R,-52429,O,P,Q,2);aJ();i=e;return}function dG(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=i;i=i+8|0;f=e|0;switch(d&255|0){case 119:{d=c[b+136>>2]|0;g=d+104|0;j=c[g>>2]|0;k=d+100|0;l=c[k>>2]|0;if((j|0)==(l|0)){m=0}else{m=(j-l<<8)-1|0}n=d+112|0;o=c[n>>2]|0;p=d+116|0;q=c[p>>2]|0;if((m|0)==(q+o|0)){dM(d+96|0);r=c[p>>2]|0;s=c[n>>2]|0;t=c[k>>2]|0;u=c[g>>2]|0}else{r=q;s=o;t=l;u=j}j=r+s|0;do{if((u|0)==(t|0)){v=r}else{s=(c[t+(j>>>10<<2)>>2]|0)+((j&1023)<<2)|0;if((s|0)==0){v=r;break}c[s>>2]=2;v=c[p>>2]|0}}while(0);c[p>>2]=v+1;i=e;return};case 112:{v=c[b+136>>2]|0;p=v+80|0;if((a[p]&1)==0){b3(f|0,0)|0;h[v+72>>3]=+(c[f>>2]|0)+ +(c[f+4>>2]|0)*1.0e-6;a[p]=1;i=e;return}else{dI(v,1);i=e;return}break};case 100:{v=c[b+136>>2]|0;p=v+104|0;f=c[p>>2]|0;r=v+100|0;j=c[r>>2]|0;if((f|0)==(j|0)){w=0}else{w=(f-j<<8)-1|0}t=v+112|0;u=c[t>>2]|0;s=v+116|0;l=c[s>>2]|0;if((w|0)==(l+u|0)){dM(v+96|0);x=c[s>>2]|0;y=c[t>>2]|0;z=c[r>>2]|0;A=c[p>>2]|0}else{x=l;y=u;z=j;A=f}f=x+y|0;do{if((A|0)==(z|0)){B=x}else{y=(c[z+(f>>>10<<2)>>2]|0)+((f&1023)<<2)|0;if((y|0)==0){B=x;break}c[y>>2]=1;B=c[s>>2]|0}}while(0);c[s>>2]=B+1;i=e;return};case 115:{B=c[b+136>>2]|0;s=B+104|0;x=c[s>>2]|0;f=B+100|0;z=c[f>>2]|0;if((x|0)==(z|0)){C=0}else{C=(x-z<<8)-1|0}A=B+112|0;y=c[A>>2]|0;j=B+116|0;u=c[j>>2]|0;if((C|0)==(u+y|0)){dM(B+96|0);D=c[j>>2]|0;E=c[A>>2]|0;F=c[f>>2]|0;G=c[s>>2]|0}else{D=u;E=y;F=z;G=x}x=D+E|0;do{if((G|0)==(F|0)){H=D}else{E=(c[F+(x>>>10<<2)>>2]|0)+((x&1023)<<2)|0;if((E|0)==0){H=D;break}c[E>>2]=3;H=c[j>>2]|0}}while(0);c[j>>2]=H+1;i=e;return};case 97:{H=c[b+136>>2]|0;b=H+104|0;j=c[b>>2]|0;D=H+100|0;x=c[D>>2]|0;if((j|0)==(x|0)){I=0}else{I=(j-x<<8)-1|0}F=H+112|0;G=c[F>>2]|0;E=H+116|0;z=c[E>>2]|0;if((I|0)==(z+G|0)){dM(H+96|0);J=c[E>>2]|0;K=c[F>>2]|0;L=c[D>>2]|0;M=c[b>>2]|0}else{J=z;K=G;L=x;M=j}j=J+K|0;do{if((M|0)==(L|0)){N=J}else{K=(c[L+(j>>>10<<2)>>2]|0)+((j&1023)<<2)|0;if((K|0)==0){N=J;break}c[K>>2]=0;N=c[E>>2]|0}}while(0);c[E>>2]=N+1;i=e;return};default:{i=e;return}}}function dH(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return}function dI(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0;e=i;i=i+8|0;f=e|0;if(d){d=b+96|0;dJ(d|0);dK(d);g=c[b+100>>2]|0;j=b+104|0;k=c[j>>2]|0;if((g|0)!=(k|0)){c[j>>2]=k+(~((k-4+(-g|0)|0)>>>2)<<2)}dL(d|0);of(d|0,0,24)}a[b+80|0]=0;b3(f|0,0)|0;d=b+56|0;h[d>>3]=+(c[f>>2]|0)+ +(c[f+4>>2]|0)*1.0e-6-(+h[b+72>>3]- +h[d>>3]);i=e;return}function dJ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+4|0;d=c[b>>2]|0;e=a+16|0;f=c[e>>2]|0;g=d+(f>>>10<<2)|0;h=a+8|0;i=c[h>>2]|0;if((i|0)==(d|0)){j=0;k=0;l=a+20|0}else{m=a+20|0;a=f+(c[m>>2]|0)|0;j=(c[d+(a>>>10<<2)>>2]|0)+((a&1023)<<2)|0;k=(c[g>>2]|0)+((f&1023)<<2)|0;l=m}m=g;g=k;L421:while(1){k=g;do{if((k|0)==(j|0)){break L421}k=k+4|0;}while((k-(c[m>>2]|0)|0)!=4096);k=m+4|0;m=k;g=c[k>>2]|0}c[l>>2]=0;l=i-d>>2;if(l>>>0>2>>>0){i=d;while(1){n6(c[i>>2]|0);d=(c[b>>2]|0)+4|0;c[b>>2]=d;g=(c[h>>2]|0)-d>>2;if(g>>>0>2>>>0){i=d}else{n=g;break}}}else{n=l}if((n|0)==1){c[e>>2]=512;return}else if((n|0)==2){c[e>>2]=1024;return}else{return}}function dK(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;b=a+20|0;if((c[b>>2]|0)==0){d=a+8|0;e=c[d>>2]|0;f=a+4|0;if((e|0)!=(c[f>>2]|0)){g=e;do{n6(c[g-4>>2]|0);g=(c[d>>2]|0)-4|0;c[d>>2]=g;}while((g|0)!=(c[f>>2]|0))}c[a+16>>2]=0;h=a|0;dL(h);return}f=a+16|0;g=c[f>>2]|0;d=a+4|0;e=c[d>>2]|0;if(g>>>0>1023>>>0){n6(c[e>>2]|0);i=(c[d>>2]|0)+4|0;c[d>>2]=i;d=(c[f>>2]|0)-1024|0;c[f>>2]=d;j=d;k=i}else{j=g;k=e}e=a+8|0;g=c[e>>2]|0;if((g|0)==(k|0)){l=0}else{l=(g-k<<8)-1|0}if((l-j-(c[b>>2]|0)|0)>>>0<=1023>>>0){h=a|0;dL(h);return}n6(c[g-4>>2]|0);c[e>>2]=(c[e>>2]|0)-4;h=a|0;dL(h);return}function dL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;b=a+12|0;d=a|0;e=c[d>>2]|0;f=a+8|0;g=c[f>>2]|0;h=a+4|0;a=c[h>>2]|0;i=g-a|0;j=i>>2;if((c[b>>2]|0)-e>>2>>>0<=j>>>0){return}if((j|0)==0){k=0}else{k=n4(i)|0}i=k+(j<<2)|0;if((a|0)==(g|0)){l=g;m=g;n=e}else{e=a;a=k;while(1){if((a|0)==0){o=0}else{c[a>>2]=c[e>>2];o=a}j=e+4|0;if((j|0)==(g|0)){break}else{e=j;a=o+4|0}}l=c[f>>2]|0;m=c[h>>2]|0;n=c[d>>2]|0}c[d>>2]=k;c[h>>2]=k;c[f>>2]=k+(l-m>>2<<2);c[b>>2]=i;if((n|0)==0){return}n6(n);return}function dM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;b=i;i=i+48|0;d=b|0;e=b+8|0;f=b+16|0;g=b+40|0;h=a+16|0;j=c[h>>2]|0;if(j>>>0>1023>>>0){c[h>>2]=j-1024;j=a+4|0;h=c[j>>2]|0;k=c[h>>2]|0;l=h+4|0;c[j>>2]=l;m=a+8|0;n=c[m>>2]|0;o=a+12|0;do{if((n|0)==(c[o>>2]|0)){p=a|0;q=c[p>>2]|0;if(l>>>0>q>>>0){r=l;s=((r-q>>2)+1|0)/-2|0;t=s+1|0;u=n-r|0;oh(h+(t<<2)|0,l|0,u|0);r=h+(t+(u>>2)<<2)|0;c[m>>2]=r;c[j>>2]=(c[j>>2]|0)+(s<<2);v=r;break}r=n-q>>1;s=(r|0)==0?1:r;r=n4(s<<2)|0;u=r+(s>>>2<<2)|0;t=r+(s<<2)|0;if((l|0)==(n|0)){w=u;x=q}else{q=l;s=u;do{if((s|0)==0){y=0}else{c[s>>2]=c[q>>2];y=s}s=y+4|0;q=q+4|0;}while((q|0)!=(n|0));w=s;x=c[p>>2]|0}c[p>>2]=r;c[j>>2]=u;c[m>>2]=w;c[o>>2]=t;if((x|0)==0){v=w;break}n6(x);v=c[m>>2]|0}else{v=n}}while(0);if((v|0)==0){z=0}else{c[v>>2]=k;z=c[m>>2]|0}c[m>>2]=z+4;i=b;return}z=a|0;m=a+8|0;k=c[m>>2]|0;v=a+4|0;n=k-(c[v>>2]|0)>>2;x=a+12|0;w=x|0;o=c[w>>2]|0;j=a|0;a=o-(c[j>>2]|0)|0;if(n>>>0>=a>>2>>>0){y=a>>1;a=(y|0)==0?1:y;y=f+12|0;c[f+16>>2]=x;x=n4(a<<2)|0;l=f|0;c[l>>2]=x;h=x+(n<<2)|0;n=f+8|0;c[n>>2]=h;q=f+4|0;c[q>>2]=h;c[y>>2]=x+(a<<2);c[g>>2]=n4(4096)|0;dP(f,g);g=c[m>>2]|0;while(1){if((g|0)==(c[v>>2]|0)){break}a=g-4|0;dQ(f,a);g=a}f=c[j>>2]|0;c[j>>2]=c[l>>2];c[l>>2]=f;c[v>>2]=c[q>>2];c[q>>2]=g;q=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=q;l=c[w>>2]|0;c[w>>2]=c[y>>2];c[y>>2]=l;if((g|0)!=(q|0)){c[n>>2]=q+(~((q-4+(-g|0)|0)>>>2)<<2)}if((f|0)==0){i=b;return}n6(f);i=b;return}f=n4(4096)|0;if((o|0)!=(k|0)){c[d>>2]=f;dN(z,d);i=b;return}c[e>>2]=f;dO(z,e);e=c[v>>2]|0;z=c[e>>2]|0;f=e+4|0;c[v>>2]=f;d=c[m>>2]|0;do{if((d|0)==(c[w>>2]|0)){k=c[j>>2]|0;if(f>>>0>k>>>0){o=f;g=((o-k>>2)+1|0)/-2|0;q=g+1|0;n=d-o|0;oh(e+(q<<2)|0,f|0,n|0);o=e+(q+(n>>2)<<2)|0;c[m>>2]=o;c[v>>2]=(c[v>>2]|0)+(g<<2);A=o;break}o=d-k>>1;g=(o|0)==0?1:o;o=n4(g<<2)|0;n=o+(g>>>2<<2)|0;q=o+(g<<2)|0;if((f|0)==(d|0)){B=n;C=k}else{k=f;g=n;do{if((g|0)==0){D=0}else{c[g>>2]=c[k>>2];D=g}g=D+4|0;k=k+4|0;}while((k|0)!=(d|0));B=g;C=c[j>>2]|0}c[j>>2]=o;c[v>>2]=n;c[m>>2]=B;c[w>>2]=q;if((C|0)==0){A=B;break}n6(C);A=c[m>>2]|0}else{A=d}}while(0);if((A|0)==0){E=0}else{c[A>>2]=z;E=c[m>>2]|0}c[m>>2]=E+4;i=b;return}function dN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+8|0;e=c[d>>2]|0;f=a+12|0;do{if((e|0)==(c[f>>2]|0)){g=a+4|0;h=c[g>>2]|0;i=a|0;j=c[i>>2]|0;if(h>>>0>j>>>0){k=h;l=((k-j>>2)+1|0)/-2|0;m=e-k|0;oh(h+(l<<2)|0,h|0,m|0);k=h+(l+(m>>2)<<2)|0;c[d>>2]=k;c[g>>2]=(c[g>>2]|0)+(l<<2);n=k;break}k=e-j>>1;l=(k|0)==0?1:k;k=n4(l<<2)|0;m=k+(l>>>2<<2)|0;o=k+(l<<2)|0;if((h|0)==(e|0)){p=m;q=j}else{j=h;h=m;do{if((h|0)==0){r=0}else{c[h>>2]=c[j>>2];r=h}h=r+4|0;j=j+4|0;}while((j|0)!=(e|0));p=h;q=c[i>>2]|0}c[i>>2]=k;c[g>>2]=m;c[d>>2]=p;c[f>>2]=o;if((q|0)==0){n=p;break}n6(q);n=c[d>>2]|0}else{n=e}}while(0);if((n|0)==0){s=0;t=s+4|0;c[d>>2]=t;return}c[n>>2]=c[b>>2];s=c[d>>2]|0;t=s+4|0;c[d>>2]=t;return}function dO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+4|0;e=c[d>>2]|0;f=a|0;do{if((e|0)==(c[f>>2]|0)){g=a+8|0;h=c[g>>2]|0;i=a+12|0;j=c[i>>2]|0;k=j;if(h>>>0<j>>>0){j=h;l=((k-j>>2)+1|0)/2|0;m=j-e|0;j=h+(l-(m>>2)<<2)|0;oh(j|0,e|0,m|0);c[d>>2]=j;c[g>>2]=(c[g>>2]|0)+(l<<2);n=j;break}j=k-e>>1;k=(j|0)==0?1:j;j=n4(k<<2)|0;l=j+((k+3|0)>>>2<<2)|0;m=j+(k<<2)|0;if((e|0)==(h|0)){o=l;p=e}else{k=e;q=l;do{if((q|0)==0){r=0}else{c[q>>2]=c[k>>2];r=q}q=r+4|0;k=k+4|0;}while((k|0)!=(h|0));o=q;p=c[f>>2]|0}c[f>>2]=j;c[d>>2]=l;c[g>>2]=o;c[i>>2]=m;if((p|0)==0){n=l;break}n6(p);n=c[d>>2]|0}else{n=e}}while(0);e=n-4|0;if((e|0)==0){s=n;t=s-4|0;c[d>>2]=t;return}c[e>>2]=c[b>>2];s=c[d>>2]|0;t=s-4|0;c[d>>2]=t;return}function dP(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+8|0;e=c[d>>2]|0;f=a+12|0;do{if((e|0)==(c[f>>2]|0)){g=a+4|0;h=c[g>>2]|0;i=a|0;j=c[i>>2]|0;if(h>>>0>j>>>0){k=h;l=((k-j>>2)+1|0)/-2|0;m=e-k|0;oh(h+(l<<2)|0,h|0,m|0);k=h+(l+(m>>2)<<2)|0;c[d>>2]=k;c[g>>2]=(c[g>>2]|0)+(l<<2);n=k;break}k=e-j>>1;l=(k|0)==0?1:k;k=n4(l<<2)|0;m=k+(l>>>2<<2)|0;o=k+(l<<2)|0;if((h|0)==(e|0)){p=m;q=j}else{j=h;h=m;do{if((h|0)==0){r=0}else{c[h>>2]=c[j>>2];r=h}h=r+4|0;j=j+4|0;}while((j|0)!=(e|0));p=h;q=c[i>>2]|0}c[i>>2]=k;c[g>>2]=m;c[d>>2]=p;c[f>>2]=o;if((q|0)==0){n=p;break}n6(q);n=c[d>>2]|0}else{n=e}}while(0);if((n|0)==0){s=0;t=s+4|0;c[d>>2]=t;return}c[n>>2]=c[b>>2];s=c[d>>2]|0;t=s+4|0;c[d>>2]=t;return}function dQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+4|0;e=c[d>>2]|0;f=a|0;do{if((e|0)==(c[f>>2]|0)){g=a+8|0;h=c[g>>2]|0;i=a+12|0;j=c[i>>2]|0;k=j;if(h>>>0<j>>>0){j=h;l=((k-j>>2)+1|0)/2|0;m=j-e|0;j=h+(l-(m>>2)<<2)|0;oh(j|0,e|0,m|0);c[d>>2]=j;c[g>>2]=(c[g>>2]|0)+(l<<2);n=j;break}j=k-e>>1;k=(j|0)==0?1:j;j=n4(k<<2)|0;l=j+((k+3|0)>>>2<<2)|0;m=j+(k<<2)|0;if((e|0)==(h|0)){o=l;p=e}else{k=e;q=l;do{if((q|0)==0){r=0}else{c[q>>2]=c[k>>2];r=q}q=r+4|0;k=k+4|0;}while((k|0)!=(h|0));o=q;p=c[f>>2]|0}c[f>>2]=j;c[d>>2]=l;c[g>>2]=o;c[i>>2]=m;if((p|0)==0){n=l;break}n6(p);n=c[d>>2]|0}else{n=e}}while(0);e=n-4|0;if((e|0)==0){s=n;t=s-4|0;c[d>>2]=t;return}c[e>>2]=c[b>>2];s=c[d>>2]|0;t=s-4|0;c[d>>2]=t;return}function dR(b){b=b|0;var d=0,e=0,f=0,g=0,j=0.0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;if((a[b+80|0]&1)!=0){i=d;return}ev(b);b3(g|0,0)|0;j=+(c[g>>2]|0)+ +(c[g+4>>2]|0)*1.0e-6;h[b+64>>3]=j;g=b+56|0;k=b+88|0;if(j- +h[g>>3]<+h[k>>3]){i=d;return}l=b+4|0;m=c[l>>2]|0;L626:do{if((m|0)==0){n=b+8|0;c[l>>2]=c[n>>2];o=n4(28)|0;p=b|0;q=c[p>>2]|0;r=c[q>>2]|0;s=c[q+4>>2]|0;q=eA()|0;a[o]=q;eC(o+4|0,q);q=o+16|0;c[q>>2]=(r|0)/2|0;c[q+4>>2]=s-1;c[o+24>>2]=0;c[n>>2]=o;o=c[p>>2]|0;p=c[l>>2]|0;n=c[p+4>>2]|0;s=((c[p+24>>2]|0)>>>0)%((((c[p+8>>2]|0)-n|0)/12|0)>>>0)|0;q=c[n+(s*12|0)>>2]|0;r=c[n+(s*12|0)+4>>2]|0;s=o+8|0;n=(q|0)==(r|0);t=c[p+16>>2]|0;u=c[p+20>>2]|0;p=c[o+4>>2]|0;v=o|0;L630:do{if(!n){o=q;while(1){w=(c[o>>2]|0)+t|0;x=(c[o+4>>2]|0)+u|0;if((x|0)<(p|0)){if((w|0)<0){break}if((w|0)>=(c[v>>2]|0)|(x|0)<0){break}if((a[(c[(c[s>>2]|0)+(w*12|0)>>2]|0)+x|0]|0)!=0){break}}o=o+8|0;if((o|0)==(r|0)){break L630}}a[b+20|0]=1;break L626}}while(0);o=0;L640:while(1){if(!n){y=o+u|0;x=q;do{w=(c[x>>2]|0)+t|0;z=(c[x+4>>2]|0)+y|0;if((z|0)<(p|0)){if((w|0)<0){break L640}if((w|0)>=(c[v>>2]|0)|(z|0)<0){break L640}if((a[(c[(c[s>>2]|0)+(w*12|0)>>2]|0)+z|0]|0)!=0){break L640}}x=x+8|0;}while((x|0)!=(r|0))}o=o-1|0}o=b+12|0;c[o>>2]=t;c[o+4>>2]=y;c[b+16>>2]=y+1}else{o=b|0;r=c[o>>2]|0;s=c[m+4>>2]|0;v=((c[m+24>>2]|0)>>>0)%((((c[m+8>>2]|0)-s|0)/12|0)>>>0)|0;p=c[s+(v*12|0)>>2]|0;q=c[s+(v*12|0)+4>>2]|0;v=r+8|0;L654:do{if((p|0)==(q|0)){A=c[m+20>>2]|0}else{s=m+16|0;u=c[s>>2]|0;n=m+20|0;x=c[n>>2]|0;z=c[r+4>>2]|0;w=r|0;B=x-1|0;C=p;while(1){D=(c[C>>2]|0)+u|0;E=B+(c[C+4>>2]|0)|0;if((E|0)<(z|0)){if((D|0)<0){break}if((D|0)>=(c[w>>2]|0)|(E|0)<0){break}if((a[(c[(c[v>>2]|0)+(D*12|0)>>2]|0)+E|0]|0)!=0){break}}E=C+8|0;if((E|0)==(q|0)){A=x;break L654}else{C=E}}C=m|0;w=p;z=u;B=x;while(1){a[(c[(c[v>>2]|0)+((z+(c[w>>2]|0)|0)*12|0)>>2]|0)+(B+(c[w+4>>2]|0))|0]=a[C]|0;E=w+8|0;if((E|0)==(q|0)){break}w=E;z=c[s>>2]|0;B=c[n>>2]|0}n=c[l>>2]|0;if((n|0)!=0){B=n+4|0;s=c[B>>2]|0;if((s|0)!=0){z=n+8|0;w=c[z>>2]|0;if((s|0)==(w|0)){F=s}else{C=w;while(1){w=C-12|0;c[z>>2]=w;x=c[w>>2]|0;u=x;if((x|0)==0){G=w}else{w=C-12+4|0;E=c[w>>2]|0;if((x|0)!=(E|0)){c[w>>2]=E+(~((E-8+(-u|0)|0)>>>3)<<3)}n6(x);G=c[z>>2]|0}if((s|0)==(G|0)){break}else{C=G}}F=c[B>>2]|0}n6(F)}n6(n|0)}c[l>>2]=0;C=ew(c[o>>2]|0)|0;s=b+24|0;c[s>>2]=(c[s>>2]|0)+C;s=b+28|0;z=c[s>>2]|0;if((C|0)==0){H=z}else{x=ot(C-1|0,0,C-2|0,0)|0;u=z+(C*20|0)+((x>>>1|M<<31)*10|0)-10|0;c[s>>2]=u;H=u}c[e>>2]=H;u=c[b+48>>2]|0;if((u|0)==0){s=cx(4)|0;c[s>>2]=6936;bL(s|0,13784,178)}else{h[k>>3]=+cR[c[(c[u>>2]|0)+24>>2]&3](u,e);break L626}}}while(0);c[m+20>>2]=A-1}}while(0);b3(f|0,0)|0;h[g>>3]=+(c[f>>2]|0)+ +(c[f+4>>2]|0)*1.0e-6;i=d;return}function dS(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=b|0;eu(f,h,d);b=c[f>>2]|0;if((b|0)!=0){j=b;k=j+20|0;i=e;return k|0}b=d;d=n4(48)|0;f=d+8|0;if((f|0)!=0){c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];of(b|0,0,12)}b=d+20|0;if((b|0)!=0){a[b]=0;a[d+21|0]=0;c[d+32>>2]=0;c[d+36>>2]=0;c[d+44>>2]=0}er(g,h,d);j=c[g>>2]|0;k=j+20|0;i=e;return k|0}function dT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0;d=i;i=i+3168|0;e=d|0;f=c[5076]|0;if((f|0)!=0){bZ(34962,f|0);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5430]|0;c[5426]=h;i=d;return}f=e|0;g[f>>2]=.44999998807907104;g[e+4>>2]=.5;g[e+8>>2]=.44999998807907104;g[e+12>>2]=0.0;g[e+16>>2]=1.0;g[e+20>>2]=0.0;g[e+24>>2]=.44999998807907104;g[e+28>>2]=.5;g[e+32>>2]=-.44999998807907104;g[e+36>>2]=0.0;g[e+40>>2]=1.0;g[e+44>>2]=0.0;g[e+48>>2]=-.44999998807907104;g[e+52>>2]=.5;g[e+56>>2]=.44999998807907104;g[e+60>>2]=0.0;g[e+64>>2]=1.0;g[e+68>>2]=0.0;g[e+72>>2]=-.44999998807907104;g[e+76>>2]=.5;g[e+80>>2]=.44999998807907104;g[e+84>>2]=0.0;g[e+88>>2]=1.0;g[e+92>>2]=0.0;g[e+96>>2]=.44999998807907104;g[e+100>>2]=.5;g[e+104>>2]=-.44999998807907104;g[e+108>>2]=0.0;g[e+112>>2]=1.0;g[e+116>>2]=0.0;g[e+120>>2]=-.44999998807907104;g[e+124>>2]=.5;g[e+128>>2]=-.44999998807907104;g[e+132>>2]=0.0;g[e+136>>2]=1.0;g[e+140>>2]=0.0;g[e+144>>2]=.44999998807907104;g[e+148>>2]=-.5;g[e+152>>2]=-.44999998807907104;g[e+156>>2]=-0.0;g[e+160>>2]=-1.0;g[e+164>>2]=-0.0;g[e+168>>2]=.44999998807907104;g[e+172>>2]=-.5;g[e+176>>2]=.44999998807907104;g[e+180>>2]=-0.0;g[e+184>>2]=-1.0;g[e+188>>2]=-0.0;g[e+192>>2]=-.44999998807907104;g[e+196>>2]=-.5;g[e+200>>2]=-.44999998807907104;g[e+204>>2]=-0.0;g[e+208>>2]=-1.0;g[e+212>>2]=-0.0;g[e+216>>2]=-.44999998807907104;g[e+220>>2]=-.5;g[e+224>>2]=-.44999998807907104;g[e+228>>2]=-0.0;g[e+232>>2]=-1.0;g[e+236>>2]=-0.0;g[e+240>>2]=.44999998807907104;g[e+244>>2]=-.5;g[e+248>>2]=.44999998807907104;g[e+252>>2]=-0.0;g[e+256>>2]=-1.0;g[e+260>>2]=-0.0;g[e+264>>2]=-.44999998807907104;g[e+268>>2]=-.5;g[e+272>>2]=.44999998807907104;g[e+276>>2]=-0.0;g[e+280>>2]=-1.0;g[e+284>>2]=-0.0;g[e+288>>2]=-.5;g[e+292>>2]=-.44999998807907104;g[e+296>>2]=-.44999998807907104;g[e+300>>2]=-1.0;g[e+304>>2]=0.0;g[e+308>>2]=-0.0;g[e+312>>2]=-.5;g[e+316>>2]=-.44999998807907104;g[e+320>>2]=.44999998807907104;g[e+324>>2]=-1.0;g[e+328>>2]=0.0;g[e+332>>2]=-0.0;g[e+336>>2]=-.5;g[e+340>>2]=.44999998807907104;g[e+344>>2]=-.44999998807907104;g[e+348>>2]=-1.0;g[e+352>>2]=0.0;g[e+356>>2]=-0.0;g[e+360>>2]=-.5;g[e+364>>2]=.44999998807907104;g[e+368>>2]=-.44999998807907104;g[e+372>>2]=-1.0;g[e+376>>2]=0.0;g[e+380>>2]=-0.0;g[e+384>>2]=-.5;g[e+388>>2]=-.44999998807907104;g[e+392>>2]=.44999998807907104;g[e+396>>2]=-1.0;g[e+400>>2]=0.0;g[e+404>>2]=-0.0;g[e+408>>2]=-.5;g[e+412>>2]=.44999998807907104;g[e+416>>2]=.44999998807907104;g[e+420>>2]=-1.0;g[e+424>>2]=0.0;g[e+428>>2]=-0.0;g[e+432>>2]=.44999998807907104;g[e+436>>2]=.44999998807907104;g[e+440>>2]=.5;g[e+444>>2]=0.0;g[e+448>>2]=-0.0;g[e+452>>2]=1.0;g[e+456>>2]=-.44999998807907104;g[e+460>>2]=.44999998807907104;g[e+464>>2]=.5;g[e+468>>2]=0.0;g[e+472>>2]=-0.0;g[e+476>>2]=1.0;g[e+480>>2]=.44999998807907104;g[e+484>>2]=-.44999998807907104;g[e+488>>2]=.5;g[e+492>>2]=0.0;g[e+496>>2]=-0.0;g[e+500>>2]=1.0;g[e+504>>2]=.44999998807907104;g[e+508>>2]=-.44999998807907104;g[e+512>>2]=.5;g[e+516>>2]=0.0;g[e+520>>2]=-0.0;g[e+524>>2]=1.0;g[e+528>>2]=-.44999998807907104;g[e+532>>2]=.44999998807907104;g[e+536>>2]=.5;g[e+540>>2]=0.0;g[e+544>>2]=-0.0;g[e+548>>2]=1.0;g[e+552>>2]=-.44999998807907104;g[e+556>>2]=-.44999998807907104;g[e+560>>2]=.5;g[e+564>>2]=0.0;g[e+568>>2]=-0.0;g[e+572>>2]=1.0;g[e+576>>2]=.5;g[e+580>>2]=.44999998807907104;g[e+584>>2]=-.44999998807907104;g[e+588>>2]=1.0;g[e+592>>2]=-0.0;g[e+596>>2]=0.0;g[e+600>>2]=.5;g[e+604>>2]=.44999998807907104;g[e+608>>2]=.44999998807907104;g[e+612>>2]=1.0;g[e+616>>2]=-0.0;g[e+620>>2]=0.0;g[e+624>>2]=.5;g[e+628>>2]=-.44999998807907104;g[e+632>>2]=-.44999998807907104;g[e+636>>2]=1.0;g[e+640>>2]=-0.0;g[e+644>>2]=0.0;g[e+648>>2]=.5;g[e+652>>2]=-.44999998807907104;g[e+656>>2]=-.44999998807907104;g[e+660>>2]=1.0;g[e+664>>2]=-0.0;g[e+668>>2]=0.0;g[e+672>>2]=.5;g[e+676>>2]=.44999998807907104;g[e+680>>2]=.44999998807907104;g[e+684>>2]=1.0;g[e+688>>2]=-0.0;g[e+692>>2]=0.0;g[e+696>>2]=.5;g[e+700>>2]=-.44999998807907104;g[e+704>>2]=.44999998807907104;g[e+708>>2]=1.0;g[e+712>>2]=-0.0;g[e+716>>2]=0.0;g[e+720>>2]=.5;g[e+724>>2]=.44999998807907104;g[e+728>>2]=-.44999998807907104;g[e+732>>2]=.699999988079071;g[e+736>>2]=0.0;g[e+740>>2]=-.699999988079071;g[e+744>>2]=.5;g[e+748>>2]=-.44999998807907104;g[e+752>>2]=-.44999998807907104;g[e+756>>2]=.699999988079071;g[e+760>>2]=0.0;g[e+764>>2]=-.699999988079071;g[e+768>>2]=.44999998807907104;g[e+772>>2]=.44999998807907104;g[e+776>>2]=-.5;g[e+780>>2]=.699999988079071;g[e+784>>2]=0.0;g[e+788>>2]=-.699999988079071;g[e+792>>2]=.44999998807907104;g[e+796>>2]=.44999998807907104;g[e+800>>2]=-.5;g[e+804>>2]=.699999988079071;g[e+808>>2]=0.0;g[e+812>>2]=-.699999988079071;g[e+816>>2]=.5;g[e+820>>2]=-.44999998807907104;g[e+824>>2]=-.44999998807907104;g[e+828>>2]=.699999988079071;g[e+832>>2]=0.0;g[e+836>>2]=-.699999988079071;g[e+840>>2]=.44999998807907104;g[e+844>>2]=-.44999998807907104;g[e+848>>2]=-.5;g[e+852>>2]=.699999988079071;g[e+856>>2]=0.0;g[e+860>>2]=-.699999988079071;g[e+864>>2]=-.44999998807907104;g[e+868>>2]=.5;g[e+872>>2]=-.44999998807907104;g[e+876>>2]=0.0;g[e+880>>2]=.699999988079071;g[e+884>>2]=-.699999988079071;g[e+888>>2]=.44999998807907104;g[e+892>>2]=.5;g[e+896>>2]=-.44999998807907104;g[e+900>>2]=0.0;g[e+904>>2]=.699999988079071;g[e+908>>2]=-.699999988079071;g[e+912>>2]=-.44999998807907104;g[e+916>>2]=.44999998807907104;g[e+920>>2]=-.5;g[e+924>>2]=0.0;g[e+928>>2]=.699999988079071;g[e+932>>2]=-.699999988079071;g[e+936>>2]=-.44999998807907104;g[e+940>>2]=.44999998807907104;g[e+944>>2]=-.5;g[e+948>>2]=0.0;g[e+952>>2]=.699999988079071;g[e+956>>2]=-.699999988079071;g[e+960>>2]=.44999998807907104;g[e+964>>2]=.5;g[e+968>>2]=-.44999998807907104;g[e+972>>2]=0.0;g[e+976>>2]=.699999988079071;g[e+980>>2]=-.699999988079071;g[e+984>>2]=.44999998807907104;g[e+988>>2]=.44999998807907104;g[e+992>>2]=-.5;g[e+996>>2]=0.0;g[e+1e3>>2]=.699999988079071;g[e+1004>>2]=-.699999988079071;g[e+1008>>2]=.44999998807907104;g[e+1012>>2]=.5;g[e+1016>>2]=-.44999998807907104;g[e+1020>>2]=.699999988079071;g[e+1024>>2]=.699999988079071;g[e+1028>>2]=0.0;g[e+1032>>2]=.44999998807907104;g[e+1036>>2]=.5;g[e+1040>>2]=.44999998807907104;g[e+1044>>2]=.699999988079071;g[e+1048>>2]=.699999988079071;g[e+1052>>2]=0.0;g[e+1056>>2]=.5;g[e+1060>>2]=.44999998807907104;g[e+1064>>2]=-.44999998807907104;g[e+1068>>2]=.699999988079071;g[e+1072>>2]=.699999988079071;g[e+1076>>2]=0.0;g[e+1080>>2]=.5;g[e+1084>>2]=.44999998807907104;g[e+1088>>2]=-.44999998807907104;g[e+1092>>2]=.699999988079071;g[e+1096>>2]=.699999988079071;g[e+1100>>2]=0.0;g[e+1104>>2]=.44999998807907104;g[e+1108>>2]=.5;g[e+1112>>2]=.44999998807907104;g[e+1116>>2]=.699999988079071;g[e+1120>>2]=.699999988079071;g[e+1124>>2]=0.0;g[e+1128>>2]=.5;g[e+1132>>2]=.44999998807907104;g[e+1136>>2]=.44999998807907104;g[e+1140>>2]=.699999988079071;g[e+1144>>2]=.699999988079071;g[e+1148>>2]=0.0;g[e+1152>>2]=.44999998807907104;g[e+1156>>2]=-.5;g[e+1160>>2]=-.44999998807907104;g[e+1164>>2]=-0.0;g[e+1168>>2]=-.699999988079071;g[e+1172>>2]=-.699999988079071;g[e+1176>>2]=-.44999998807907104;g[e+1180>>2]=-.5;g[e+1184>>2]=-.44999998807907104;g[e+1188>>2]=-0.0;g[e+1192>>2]=-.699999988079071;g[e+1196>>2]=-.699999988079071;g[e+1200>>2]=.44999998807907104;g[e+1204>>2]=-.44999998807907104;g[e+1208>>2]=-.5;g[e+1212>>2]=-0.0;g[e+1216>>2]=-.699999988079071;g[e+1220>>2]=-.699999988079071;g[e+1224>>2]=.44999998807907104;g[e+1228>>2]=-.44999998807907104;g[e+1232>>2]=-.5;g[e+1236>>2]=-0.0;g[e+1240>>2]=-.699999988079071;g[e+1244>>2]=-.699999988079071;g[e+1248>>2]=-.44999998807907104;g[e+1252>>2]=-.5;g[e+1256>>2]=-.44999998807907104;g[e+1260>>2]=-0.0;g[e+1264>>2]=-.699999988079071;g[e+1268>>2]=-.699999988079071;g[e+1272>>2]=-.44999998807907104;g[e+1276>>2]=-.44999998807907104;g[e+1280>>2]=-.5;g[e+1284>>2]=-0.0;g[e+1288>>2]=-.699999988079071;g[e+1292>>2]=-.699999988079071;g[e+1296>>2]=.5;g[e+1300>>2]=-.44999998807907104;g[e+1304>>2]=-.44999998807907104;g[e+1308>>2]=.699999988079071;g[e+1312>>2]=-.699999988079071;g[e+1316>>2]=0.0;g[e+1320>>2]=.5;g[e+1324>>2]=-.44999998807907104;g[e+1328>>2]=.44999998807907104;g[e+1332>>2]=.699999988079071;g[e+1336>>2]=-.699999988079071;g[e+1340>>2]=0.0;g[e+1344>>2]=.44999998807907104;g[e+1348>>2]=-.5;g[e+1352>>2]=-.44999998807907104;g[e+1356>>2]=.699999988079071;g[e+1360>>2]=-.699999988079071;g[e+1364>>2]=0.0;g[e+1368>>2]=.44999998807907104;g[e+1372>>2]=-.5;g[e+1376>>2]=-.44999998807907104;g[e+1380>>2]=.699999988079071;g[e+1384>>2]=-.699999988079071;g[e+1388>>2]=0.0;g[e+1392>>2]=.5;g[e+1396>>2]=-.44999998807907104;g[e+1400>>2]=.44999998807907104;g[e+1404>>2]=.699999988079071;g[e+1408>>2]=-.699999988079071;g[e+1412>>2]=0.0;g[e+1416>>2]=.44999998807907104;g[e+1420>>2]=-.5;g[e+1424>>2]=.44999998807907104;g[e+1428>>2]=.699999988079071;g[e+1432>>2]=-.699999988079071;g[e+1436>>2]=0.0;g[e+1440>>2]=-.5;g[e+1444>>2]=-.44999998807907104;g[e+1448>>2]=-.44999998807907104;g[e+1452>>2]=-.699999988079071;g[e+1456>>2]=0.0;g[e+1460>>2]=-.699999988079071;g[e+1464>>2]=-.5;g[e+1468>>2]=.44999998807907104;g[e+1472>>2]=-.44999998807907104;g[e+1476>>2]=-.699999988079071;g[e+1480>>2]=0.0;g[e+1484>>2]=-.699999988079071;g[e+1488>>2]=-.44999998807907104;g[e+1492>>2]=-.44999998807907104;g[e+1496>>2]=-.5;g[e+1500>>2]=-.699999988079071;g[e+1504>>2]=0.0;g[e+1508>>2]=-.699999988079071;g[e+1512>>2]=-.44999998807907104;g[e+1516>>2]=-.44999998807907104;g[e+1520>>2]=-.5;g[e+1524>>2]=-.699999988079071;g[e+1528>>2]=0.0;g[e+1532>>2]=-.699999988079071;g[e+1536>>2]=-.5;g[e+1540>>2]=.44999998807907104;g[e+1544>>2]=-.44999998807907104;g[e+1548>>2]=-.699999988079071;g[e+1552>>2]=0.0;g[e+1556>>2]=-.699999988079071;g[e+1560>>2]=-.44999998807907104;g[e+1564>>2]=.44999998807907104;g[e+1568>>2]=-.5;g[e+1572>>2]=-.699999988079071;g[e+1576>>2]=0.0;g[e+1580>>2]=-.699999988079071;g[e+1584>>2]=-.44999998807907104;g[e+1588>>2]=-.5;g[e+1592>>2]=-.44999998807907104;g[e+1596>>2]=-.699999988079071;g[e+1600>>2]=-.699999988079071;g[e+1604>>2]=-0.0;g[e+1608>>2]=-.44999998807907104;g[e+1612>>2]=-.5;g[e+1616>>2]=.44999998807907104;g[e+1620>>2]=-.699999988079071;g[e+1624>>2]=-.699999988079071;g[e+1628>>2]=-0.0;g[e+1632>>2]=-.5;g[e+1636>>2]=-.44999998807907104;g[e+1640>>2]=-.44999998807907104;g[e+1644>>2]=-.699999988079071;g[e+1648>>2]=-.699999988079071;g[e+1652>>2]=-0.0;g[e+1656>>2]=-.5;g[e+1660>>2]=-.44999998807907104;g[e+1664>>2]=-.44999998807907104;g[e+1668>>2]=-.699999988079071;g[e+1672>>2]=-.699999988079071;g[e+1676>>2]=-0.0;g[e+1680>>2]=-.44999998807907104;g[e+1684>>2]=-.5;g[e+1688>>2]=.44999998807907104;g[e+1692>>2]=-.699999988079071;g[e+1696>>2]=-.699999988079071;g[e+1700>>2]=-0.0;g[e+1704>>2]=-.5;g[e+1708>>2]=-.44999998807907104;g[e+1712>>2]=.44999998807907104;g[e+1716>>2]=-.699999988079071;g[e+1720>>2]=-.699999988079071;g[e+1724>>2]=-0.0;g[e+1728>>2]=-.5;g[e+1732>>2]=.44999998807907104;g[e+1736>>2]=-.44999998807907104;g[e+1740>>2]=-.699999988079071;g[e+1744>>2]=.699999988079071;g[e+1748>>2]=0.0;g[e+1752>>2]=-.5;g[e+1756>>2]=.44999998807907104;g[e+1760>>2]=.44999998807907104;g[e+1764>>2]=-.699999988079071;g[e+1768>>2]=.699999988079071;g[e+1772>>2]=0.0;g[e+1776>>2]=-.44999998807907104;g[e+1780>>2]=.5;g[e+1784>>2]=-.44999998807907104;g[e+1788>>2]=-.699999988079071;g[e+1792>>2]=.699999988079071;g[e+1796>>2]=0.0;g[e+1800>>2]=-.44999998807907104;g[e+1804>>2]=.5;g[e+1808>>2]=-.44999998807907104;g[e+1812>>2]=-.699999988079071;g[e+1816>>2]=.699999988079071;g[e+1820>>2]=0.0;g[e+1824>>2]=-.5;g[e+1828>>2]=.44999998807907104;g[e+1832>>2]=.44999998807907104;g[e+1836>>2]=-.699999988079071;g[e+1840>>2]=.699999988079071;g[e+1844>>2]=0.0;g[e+1848>>2]=-.44999998807907104;g[e+1852>>2]=.5;g[e+1856>>2]=.44999998807907104;g[e+1860>>2]=-.699999988079071;g[e+1864>>2]=.699999988079071;g[e+1868>>2]=0.0;g[e+1872>>2]=.44999998807907104;g[e+1876>>2]=.44999998807907104;g[e+1880>>2]=.5;g[e+1884>>2]=.699999988079071;g[e+1888>>2]=-0.0;g[e+1892>>2]=.699999988079071;g[e+1896>>2]=.44999998807907104;g[e+1900>>2]=-.44999998807907104;g[e+1904>>2]=.5;g[e+1908>>2]=.699999988079071;g[e+1912>>2]=-0.0;g[e+1916>>2]=.699999988079071;g[e+1920>>2]=.5;g[e+1924>>2]=.44999998807907104;g[e+1928>>2]=.44999998807907104;g[e+1932>>2]=.699999988079071;g[e+1936>>2]=-0.0;g[e+1940>>2]=.699999988079071;g[e+1944>>2]=.5;g[e+1948>>2]=.44999998807907104;g[e+1952>>2]=.44999998807907104;g[e+1956>>2]=.699999988079071;g[e+1960>>2]=-0.0;g[e+1964>>2]=.699999988079071;g[e+1968>>2]=.44999998807907104;g[e+1972>>2]=-.44999998807907104;g[e+1976>>2]=.5;g[e+1980>>2]=.699999988079071;g[e+1984>>2]=-0.0;g[e+1988>>2]=.699999988079071;g[e+1992>>2]=.5;g[e+1996>>2]=-.44999998807907104;g[e+2e3>>2]=.44999998807907104;g[e+2004>>2]=.699999988079071;g[e+2008>>2]=-0.0;g[e+2012>>2]=.699999988079071;g[e+2016>>2]=.44999998807907104;g[e+2020>>2]=.5;g[e+2024>>2]=.44999998807907104;g[e+2028>>2]=0.0;g[e+2032>>2]=.699999988079071;g[e+2036>>2]=.699999988079071;g[e+2040>>2]=-.44999998807907104;g[e+2044>>2]=.5;g[e+2048>>2]=.44999998807907104;g[e+2052>>2]=0.0;g[e+2056>>2]=.699999988079071;g[e+2060>>2]=.699999988079071;g[e+2064>>2]=.44999998807907104;g[e+2068>>2]=.44999998807907104;g[e+2072>>2]=.5;g[e+2076>>2]=0.0;g[e+2080>>2]=.699999988079071;g[e+2084>>2]=.699999988079071;g[e+2088>>2]=.44999998807907104;g[e+2092>>2]=.44999998807907104;g[e+2096>>2]=.5;g[e+2100>>2]=0.0;g[e+2104>>2]=.699999988079071;g[e+2108>>2]=.699999988079071;g[e+2112>>2]=-.44999998807907104;g[e+2116>>2]=.5;g[e+2120>>2]=.44999998807907104;g[e+2124>>2]=0.0;g[e+2128>>2]=.699999988079071;g[e+2132>>2]=.699999988079071;g[e+2136>>2]=-.44999998807907104;g[e+2140>>2]=.44999998807907104;g[e+2144>>2]=.5;g[e+2148>>2]=0.0;g[e+2152>>2]=.699999988079071;g[e+2156>>2]=.699999988079071;g[e+2160>>2]=.44999998807907104;g[e+2164>>2]=-.44999998807907104;g[e+2168>>2]=.5;g[e+2172>>2]=-0.0;g[e+2176>>2]=-.699999988079071;g[e+2180>>2]=.699999988079071;g[e+2184>>2]=-.44999998807907104;g[e+2188>>2]=-.44999998807907104;g[e+2192>>2]=.5;g[e+2196>>2]=-0.0;g[e+2200>>2]=-.699999988079071;g[e+2204>>2]=.699999988079071;g[e+2208>>2]=.44999998807907104;g[e+2212>>2]=-.5;g[e+2216>>2]=.44999998807907104;g[e+2220>>2]=-0.0;g[e+2224>>2]=-.699999988079071;g[e+2228>>2]=.699999988079071;g[e+2232>>2]=.44999998807907104;g[e+2236>>2]=-.5;g[e+2240>>2]=.44999998807907104;g[e+2244>>2]=-0.0;g[e+2248>>2]=-.699999988079071;g[e+2252>>2]=.699999988079071;g[e+2256>>2]=-.44999998807907104;g[e+2260>>2]=-.44999998807907104;g[e+2264>>2]=.5;g[e+2268>>2]=-0.0;g[e+2272>>2]=-.699999988079071;g[e+2276>>2]=.699999988079071;g[e+2280>>2]=-.44999998807907104;g[e+2284>>2]=-.5;g[e+2288>>2]=.44999998807907104;g[e+2292>>2]=-0.0;g[e+2296>>2]=-.699999988079071;g[e+2300>>2]=.699999988079071;g[e+2304>>2]=-.44999998807907104;g[e+2308>>2]=-.44999998807907104;g[e+2312>>2]=.5;g[e+2316>>2]=-.699999988079071;g[e+2320>>2]=0.0;g[e+2324>>2]=.699999988079071;g[e+2328>>2]=-.44999998807907104;g[e+2332>>2]=.44999998807907104;g[e+2336>>2]=.5;g[e+2340>>2]=-.699999988079071;g[e+2344>>2]=0.0;g[e+2348>>2]=.699999988079071;g[e+2352>>2]=-.5;g[e+2356>>2]=-.44999998807907104;g[e+2360>>2]=.44999998807907104;g[e+2364>>2]=-.699999988079071;g[e+2368>>2]=0.0;g[e+2372>>2]=.699999988079071;g[e+2376>>2]=-.5;g[e+2380>>2]=-.44999998807907104;g[e+2384>>2]=.44999998807907104;g[e+2388>>2]=-.699999988079071;g[e+2392>>2]=0.0;g[e+2396>>2]=.699999988079071;g[e+2400>>2]=-.44999998807907104;g[e+2404>>2]=.44999998807907104;g[e+2408>>2]=.5;g[e+2412>>2]=-.699999988079071;g[e+2416>>2]=0.0;g[e+2420>>2]=.699999988079071;g[e+2424>>2]=-.5;g[e+2428>>2]=.44999998807907104;g[e+2432>>2]=.44999998807907104;g[e+2436>>2]=-.699999988079071;g[e+2440>>2]=0.0;g[e+2444>>2]=.699999988079071;g[e+2448>>2]=.44999998807907104;g[e+2452>>2]=.44999998807907104;g[e+2456>>2]=-.5;g[e+2460>>2]=0.0;g[e+2464>>2]=0.0;g[e+2468>>2]=-1.0;g[e+2472>>2]=.44999998807907104;g[e+2476>>2]=-.44999998807907104;g[e+2480>>2]=-.5;g[e+2484>>2]=0.0;g[e+2488>>2]=0.0;g[e+2492>>2]=-1.0;g[e+2496>>2]=-.44999998807907104;g[e+2500>>2]=.44999998807907104;g[e+2504>>2]=-.5;g[e+2508>>2]=0.0;g[e+2512>>2]=0.0;g[e+2516>>2]=-1.0;g[e+2520>>2]=-.44999998807907104;g[e+2524>>2]=.44999998807907104;g[e+2528>>2]=-.5;g[e+2532>>2]=0.0;g[e+2536>>2]=0.0;g[e+2540>>2]=-1.0;g[e+2544>>2]=.44999998807907104;g[e+2548>>2]=-.44999998807907104;g[e+2552>>2]=-.5;g[e+2556>>2]=0.0;g[e+2560>>2]=0.0;g[e+2564>>2]=-1.0;g[e+2568>>2]=-.44999998807907104;g[e+2572>>2]=-.44999998807907104;g[e+2576>>2]=-.5;g[e+2580>>2]=0.0;g[e+2584>>2]=0.0;g[e+2588>>2]=-1.0;g[e+2592>>2]=.44999998807907104;g[e+2596>>2]=.5;g[e+2600>>2]=-.44999998807907104;g[e+2604>>2]=.5799999833106995;g[e+2608>>2]=.5799999833106995;g[e+2612>>2]=-.5799999833106995;g[e+2616>>2]=.5;g[e+2620>>2]=.44999998807907104;g[e+2624>>2]=-.44999998807907104;g[e+2628>>2]=.5799999833106995;g[e+2632>>2]=.5799999833106995;g[e+2636>>2]=-.5799999833106995;g[e+2640>>2]=.44999998807907104;g[e+2644>>2]=.44999998807907104;g[e+2648>>2]=-.5;g[e+2652>>2]=.5799999833106995;g[e+2656>>2]=.5799999833106995;g[e+2660>>2]=-.5799999833106995;g[e+2664>>2]=.44999998807907104;g[e+2668>>2]=-.44999998807907104;g[e+2672>>2]=-.5;g[e+2676>>2]=.5799999833106995;g[e+2680>>2]=-.5799999833106995;g[e+2684>>2]=-.5799999833106995;g[e+2688>>2]=.5;g[e+2692>>2]=-.44999998807907104;g[e+2696>>2]=-.44999998807907104;g[e+2700>>2]=.5799999833106995;g[e+2704>>2]=-.5799999833106995;g[e+2708>>2]=-.5799999833106995;g[e+2712>>2]=.44999998807907104;g[e+2716>>2]=-.5;g[e+2720>>2]=-.44999998807907104;g[e+2724>>2]=.5799999833106995;g[e+2728>>2]=-.5799999833106995;g[e+2732>>2]=-.5799999833106995;g[e+2736>>2]=-.44999998807907104;g[e+2740>>2]=-.44999998807907104;g[e+2744>>2]=-.5;g[e+2748>>2]=-.5799999833106995;g[e+2752>>2]=-.5799999833106995;g[e+2756>>2]=-.5799999833106995;g[e+2760>>2]=-.44999998807907104;g[e+2764>>2]=-.5;g[e+2768>>2]=-.44999998807907104;g[e+2772>>2]=-.5799999833106995;g[e+2776>>2]=-.5799999833106995;g[e+2780>>2]=-.5799999833106995;g[e+2784>>2]=-.5;g[e+2788>>2]=-.44999998807907104;g[e+2792>>2]=-.44999998807907104;g[e+2796>>2]=-.5799999833106995;g[e+2800>>2]=-.5799999833106995;g[e+2804>>2]=-.5799999833106995;g[e+2808>>2]=-.5;g[e+2812>>2]=.44999998807907104;g[e+2816>>2]=-.44999998807907104;g[e+2820>>2]=-.5799999833106995;g[e+2824>>2]=.5799999833106995;g[e+2828>>2]=-.5799999833106995;g[e+2832>>2]=-.44999998807907104;g[e+2836>>2]=.5;g[e+2840>>2]=-.44999998807907104;g[e+2844>>2]=-.5799999833106995;g[e+2848>>2]=.5799999833106995;g[e+2852>>2]=-.5799999833106995;g[e+2856>>2]=-.44999998807907104;g[e+2860>>2]=.44999998807907104;g[e+2864>>2]=-.5;g[e+2868>>2]=-.5799999833106995;g[e+2872>>2]=.5799999833106995;g[e+2876>>2]=-.5799999833106995;g[e+2880>>2]=.5;g[e+2884>>2]=.44999998807907104;g[e+2888>>2]=.44999998807907104;g[e+2892>>2]=.5799999833106995;g[e+2896>>2]=.5799999833106995;g[e+2900>>2]=.5799999833106995;g[e+2904>>2]=.44999998807907104;g[e+2908>>2]=.5;g[e+2912>>2]=.44999998807907104;g[e+2916>>2]=.5799999833106995;g[e+2920>>2]=.5799999833106995;g[e+2924>>2]=.5799999833106995;g[e+2928>>2]=.44999998807907104;g[e+2932>>2]=.44999998807907104;g[e+2936>>2]=.5;g[e+2940>>2]=.5799999833106995;g[e+2944>>2]=.5799999833106995;g[e+2948>>2]=.5799999833106995;g[e+2952>>2]=.44999998807907104;g[e+2956>>2]=-.44999998807907104;g[e+2960>>2]=.5;g[e+2964>>2]=.5799999833106995;g[e+2968>>2]=-.5799999833106995;g[e+2972>>2]=.5799999833106995;g[e+2976>>2]=.44999998807907104;g[e+2980>>2]=-.5;g[e+2984>>2]=.44999998807907104;g[e+2988>>2]=.5799999833106995;g[e+2992>>2]=-.5799999833106995;g[e+2996>>2]=.5799999833106995;g[e+3e3>>2]=.5;g[e+3004>>2]=-.44999998807907104;g[e+3008>>2]=.44999998807907104;g[e+3012>>2]=.5799999833106995;g[e+3016>>2]=-.5799999833106995;g[e+3020>>2]=.5799999833106995;g[e+3024>>2]=-.44999998807907104;g[e+3028>>2]=-.44999998807907104;g[e+3032>>2]=.5;g[e+3036>>2]=-.5799999833106995;g[e+3040>>2]=-.5799999833106995;g[e+3044>>2]=.5799999833106995;g[e+3048>>2]=-.5;g[e+3052>>2]=-.44999998807907104;g[e+3056>>2]=.44999998807907104;g[e+3060>>2]=-.5799999833106995;g[e+3064>>2]=-.5799999833106995;g[e+3068>>2]=.5799999833106995;g[e+3072>>2]=-.44999998807907104;g[e+3076>>2]=-.5;g[e+3080>>2]=.44999998807907104;g[e+3084>>2]=-.5799999833106995;g[e+3088>>2]=-.5799999833106995;g[e+3092>>2]=.5799999833106995;g[e+3096>>2]=-.44999998807907104;g[e+3100>>2]=.5;g[e+3104>>2]=.44999998807907104;g[e+3108>>2]=-.5799999833106995;g[e+3112>>2]=.5799999833106995;g[e+3116>>2]=.5799999833106995;g[e+3120>>2]=-.5;g[e+3124>>2]=.44999998807907104;g[e+3128>>2]=.44999998807907104;g[e+3132>>2]=-.5799999833106995;g[e+3136>>2]=.5799999833106995;g[e+3140>>2]=.5799999833106995;g[e+3144>>2]=-.44999998807907104;g[e+3148>>2]=.44999998807907104;g[e+3152>>2]=.5;g[e+3156>>2]=-.5799999833106995;g[e+3160>>2]=.5799999833106995;g[e+3164>>2]=.5799999833106995;j=n4(3168)|0;k=e+3168|0;e=f;f=j;do{if((f|0)==0){l=0}else{g[f>>2]=+g[e>>2];l=f}f=l+4|0;e=e+4|0;}while((e|0)!=(k|0));cv(1,20304);bZ(34962,c[5076]|0);k=f-j|0;b$(34962,k|0,j|0,35044);c[5430]=(k>>2>>>0)/6|0;if((j|0)==0){bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5430]|0;c[5426]=h;i=d;return}n6(j);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5430]|0;c[5426]=h;i=d;return}function dU(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;eq(g,a|0,b);b=c[g>>2]|0;if((b|0)==0){g=cx(8)|0;gt(g,2312);c[g>>2]=5312;bL(g|0,12760,10)}if((c[b+40>>2]|0)>>>0<17>>>0){bj(c[b+32>>2]|0,e|0,d|0);i=f;return}else{cj(2456,2352,123,4728)}}function dV(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;eq(g,a|0,b);b=c[g>>2]|0;if((b|0)==0){g=cx(8)|0;gt(g,2312);c[g>>2]=5312;bL(g|0,12760,10)}if((c[b+40>>2]|0)>>>0<13>>>0){bF(c[b+32>>2]|0,e|0,d|0);i=f;return}else{cj(2456,2352,116,4728)}}function dW(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0;f=i;i=i+80|0;h=f|0;j=f+64|0;k=c[d+4>>2]|0;l=((c[d+24>>2]|0)>>>0)%((((c[d+8>>2]|0)-k|0)/12|0)>>>0)|0;d=c[k+(l*12|0)>>2]|0;m=c[k+(l*12|0)+4>>2]|0;if((d|0)==(m|0)){i=f;return}l=e|0;k=h;n=h|0;o=e+4|0;p=h+4|0;q=e+8|0;r=h+8|0;s=e+12|0;t=h+12|0;u=e+16|0;v=h+16|0;w=e+20|0;x=h+20|0;y=e+24|0;z=h+24|0;A=e+28|0;B=h+28|0;C=e+32|0;D=h+32|0;F=e+36|0;G=h+36|0;H=e+40|0;I=h+40|0;J=e+44|0;K=h+44|0;L=e+48|0;M=h+48|0;N=e+52|0;O=h+52|0;P=e+56|0;Q=h+56|0;R=e+60|0;e=h+60|0;S=b+132|0;b=j;T=j;U=b+1|0;V=b+9|0;b=j+8|0;W=d;do{X=+(c[W>>2]|0);Y=+(c[W+4>>2]|0);of(k|0,0,52);Z=+g[l>>2];g[n>>2]=Z;_=+g[o>>2];g[p>>2]=_;$=+g[q>>2];g[r>>2]=$;aa=+g[s>>2];g[t>>2]=aa;ab=+g[u>>2];g[v>>2]=ab;ac=+g[w>>2];g[x>>2]=ac;ad=+g[y>>2];g[z>>2]=ad;ae=+g[A>>2];g[B>>2]=ae;af=+g[C>>2];g[D>>2]=af;ag=+g[F>>2];g[G>>2]=ag;ah=+g[H>>2];g[I>>2]=ah;ai=+g[J>>2];g[K>>2]=ai;aj=X*_+Y*ac+ag*0.0+ +g[N>>2];ag=X*$+Y*ad+ah*0.0+ +g[P>>2];ah=X*aa+Y*ae+ai*0.0+ +g[R>>2];g[M>>2]=X*Z+Y*ab+af*0.0+ +g[L>>2];g[O>>2]=aj;g[Q>>2]=ag;g[e>>2]=ah;d=c[S>>2]|0;a[T]=16;ak=U|0;E=1701080941;a[ak]=E&255;E=E>>8;a[ak+1|0]=E&255;E=E>>8;a[ak+2|0]=E&255;E=E>>8;a[ak+3|0]=E&255;ak=U+4|0;E=1952533868;a[ak]=E&255;E=E>>8;a[ak+1|0]=E&255;E=E>>8;a[ak+2|0]=E&255;E=E>>8;a[ak+3|0]=E&255;a[V]=0;dX(d,j,h,1,0);if((a[T]&1)!=0){n6(c[b>>2]|0)}bm(4,0,c[5426]|0);W=W+8|0;}while((W|0)!=(m|0));i=f;return}function dX(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+8|0;h=g|0;eq(h,a|0,b);b=c[h>>2]|0;if((b|0)==0){h=cx(8)|0;gt(h,2312);c[h>>2]=5312;bL(h|0,12760,10)}if((c[b+40>>2]|0)>>>0<65>>>0){cG(c[b+32>>2]|0,e|0,f|0,d|0);i=g;return}else{cj(2456,2352,144,4728)}}function dY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0.0,as=0.0,at=0.0,au=0.0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0;f=i;i=i+488|0;h=f|0;j=f+144|0;k=f+208|0;l=f+224|0;m=f+288|0;n=f+296|0;o=f+312|0;p=f+376|0;q=f+384|0;r=f+400|0;s=f+464|0;t=f+472|0;u=c[5074]|0;if((u|0)!=0){bZ(34962,u|0);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);v=c[5428]|0;c[5426]=v;i=f;return}u=h|0;g[u>>2]=-.5;g[h+4>>2]=.5;g[h+8>>2]=0.0;g[h+12>>2]=0.0;g[h+16>>2]=0.0;g[h+20>>2]=1.0;g[h+24>>2]=-.5;g[h+28>>2]=-.5;g[h+32>>2]=0.0;g[h+36>>2]=0.0;g[h+40>>2]=0.0;g[h+44>>2]=1.0;g[h+48>>2]=.5;g[h+52>>2]=.5;g[h+56>>2]=0.0;g[h+60>>2]=0.0;g[h+64>>2]=0.0;g[h+68>>2]=1.0;g[h+72>>2]=.5;g[h+76>>2]=.5;g[h+80>>2]=0.0;g[h+84>>2]=0.0;g[h+88>>2]=0.0;g[h+92>>2]=1.0;g[h+96>>2]=-.5;g[h+100>>2]=-.5;g[h+104>>2]=0.0;g[h+108>>2]=0.0;g[h+112>>2]=0.0;g[h+116>>2]=1.0;g[h+120>>2]=.5;g[h+124>>2]=-.5;g[h+128>>2]=0.0;g[h+132>>2]=0.0;g[h+136>>2]=0.0;g[h+140>>2]=1.0;w=n4(144)|0;x=w;y=h+144|0;h=u;u=x;do{if((u|0)==0){z=0}else{g[u>>2]=+g[h>>2];z=u}u=z+4|0;h=h+4|0;}while((h|0)!=(y|0));y=j|0;h=j+4|0;z=j+20|0;A=j+24|0;B=j+40|0;C=j+44|0;D=j+60|0;E=C;c[E>>2]=0;c[E+4>>2]=0;E=k|0;c[E>>2]=0;F=k+4|0;c[F>>2]=0;G=k+8|0;c[G>>2]=0;H=j+8|0;I=j+12|0;J=j+16|0;of(h|0,0,12);K=j+28|0;L=j+32|0;M=j+36|0;of(A|0,0,12);N=j+48|0;O=j+52|0;P=j+56|0;Q=+(e|0);R=Q+2.0;S=+(d|0);T=S*0.0;U=R*0.0;g[y>>2]=S;g[h>>2]=T;g[H>>2]=T;g[I>>2]=T;g[J>>2]=U;g[z>>2]=R;g[A>>2]=U;g[K>>2]=U;g[L>>2]=0.0;g[M>>2]=0.0;g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=0.0;g[O>>2]=1.0;g[P>>2]=-.5;g[D>>2]=1.0;ef(k,j);V=S*.5;W=V*-0.0;X=W+0.0;of(h|0,0,12);of(A|0,0,12);g[y>>2]=1.0;g[h>>2]=0.0;g[H>>2]=0.0;g[I>>2]=0.0;g[J>>2]=U;g[z>>2]=R;g[A>>2]=U;g[K>>2]=U;g[L>>2]=0.0;g[M>>2]=0.0;g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=0.0-V+0.0;g[O>>2]=W+1.0+0.0;g[P>>2]=X;g[D>>2]=X+1.0;g[m>>2]=1.5707963705062866;g[n>>2]=0.0;g[n+4>>2]=1.0;g[n+8>>2]=0.0;ep(l,j,m,n);g[y>>2]=+g[l>>2];g[h>>2]=+g[l+4>>2];g[H>>2]=+g[l+8>>2];g[I>>2]=+g[l+12>>2];g[J>>2]=+g[l+16>>2];g[z>>2]=+g[l+20>>2];g[A>>2]=+g[l+24>>2];g[K>>2]=+g[l+28>>2];g[L>>2]=+g[l+32>>2];g[M>>2]=+g[l+36>>2];g[B>>2]=+g[l+40>>2];g[C>>2]=+g[l+44>>2];g[N>>2]=+g[l+48>>2];g[O>>2]=+g[l+52>>2];g[P>>2]=+g[l+56>>2];g[D>>2]=+g[l+60>>2];l=c[F>>2]|0;if((l|0)==(c[G>>2]|0)){ef(k,j)}else{if((l|0)==0){Y=0}else{of(l|0,0,64);g[l>>2]=+g[y>>2];g[l+4>>2]=+g[h>>2];g[l+8>>2]=+g[H>>2];g[l+12>>2]=+g[I>>2];g[l+16>>2]=+g[J>>2];g[l+20>>2]=+g[z>>2];g[l+24>>2]=+g[A>>2];g[l+28>>2]=+g[K>>2];g[l+32>>2]=+g[L>>2];g[l+36>>2]=+g[M>>2];g[l+40>>2]=+g[B>>2];g[l+44>>2]=+g[C>>2];g[l+48>>2]=+g[N>>2];g[l+52>>2]=+g[O>>2];g[l+56>>2]=+g[P>>2];g[l+60>>2]=+g[D>>2];Y=c[F>>2]|0}c[F>>2]=Y+64}X=V*0.0;W=X+0.0;of(h|0,0,12);of(A|0,0,12);g[y>>2]=1.0;g[h>>2]=0.0;g[H>>2]=0.0;g[I>>2]=0.0;g[J>>2]=U;g[z>>2]=R;g[A>>2]=U;g[K>>2]=U;g[L>>2]=0.0;g[M>>2]=0.0;g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=V+0.0;g[O>>2]=X+1.0+0.0;g[P>>2]=W;g[D>>2]=W+1.0;g[p>>2]=1.5707963705062866;g[q>>2]=0.0;g[q+4>>2]=-1.0;g[q+8>>2]=0.0;ep(o,j,p,q);g[y>>2]=+g[o>>2];g[h>>2]=+g[o+4>>2];g[H>>2]=+g[o+8>>2];g[I>>2]=+g[o+12>>2];g[J>>2]=+g[o+16>>2];g[z>>2]=+g[o+20>>2];g[A>>2]=+g[o+24>>2];g[K>>2]=+g[o+28>>2];g[L>>2]=+g[o+32>>2];g[M>>2]=+g[o+36>>2];g[B>>2]=+g[o+40>>2];g[C>>2]=+g[o+44>>2];g[N>>2]=+g[o+48>>2];g[O>>2]=+g[o+52>>2];g[P>>2]=+g[o+56>>2];g[D>>2]=+g[o+60>>2];o=c[F>>2]|0;if((o|0)==(c[G>>2]|0)){ef(k,j)}else{if((o|0)==0){Z=0}else{of(o|0,0,64);g[o>>2]=+g[y>>2];g[o+4>>2]=+g[h>>2];g[o+8>>2]=+g[H>>2];g[o+12>>2]=+g[I>>2];g[o+16>>2]=+g[J>>2];g[o+20>>2]=+g[z>>2];g[o+24>>2]=+g[A>>2];g[o+28>>2]=+g[K>>2];g[o+32>>2]=+g[L>>2];g[o+36>>2]=+g[M>>2];g[o+40>>2]=+g[B>>2];g[o+44>>2]=+g[C>>2];g[o+48>>2]=+g[N>>2];g[o+52>>2]=+g[O>>2];g[o+56>>2]=+g[P>>2];g[o+60>>2]=+g[D>>2];Z=c[F>>2]|0}c[F>>2]=Z+64}W=Q*.5;Q=W*-0.0+0.0;of(h|0,0,12);g[y>>2]=S;g[h>>2]=T;g[H>>2]=T;g[I>>2]=T;g[J>>2]=0.0;g[z>>2]=1.0;of(A|0,0,16);g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=Q;g[O>>2]=0.0-W+0.0;g[P>>2]=Q;g[D>>2]=Q+1.0;g[s>>2]=1.5707963705062866;g[t>>2]=-1.0;g[t+4>>2]=0.0;g[t+8>>2]=0.0;ep(r,j,s,t);g[y>>2]=+g[r>>2];g[h>>2]=+g[r+4>>2];g[H>>2]=+g[r+8>>2];g[I>>2]=+g[r+12>>2];g[J>>2]=+g[r+16>>2];g[z>>2]=+g[r+20>>2];g[A>>2]=+g[r+24>>2];g[K>>2]=+g[r+28>>2];g[L>>2]=+g[r+32>>2];g[M>>2]=+g[r+36>>2];g[B>>2]=+g[r+40>>2];g[C>>2]=+g[r+44>>2];g[N>>2]=+g[r+48>>2];g[O>>2]=+g[r+52>>2];g[P>>2]=+g[r+56>>2];g[D>>2]=+g[r+60>>2];r=c[F>>2]|0;if((r|0)==(c[G>>2]|0)){ef(k,j);_=c[F>>2]|0}else{if((r|0)==0){$=0}else{of(r|0,0,64);g[r>>2]=+g[y>>2];g[r+4>>2]=+g[h>>2];g[r+8>>2]=+g[H>>2];g[r+12>>2]=+g[I>>2];g[r+16>>2]=+g[J>>2];g[r+20>>2]=+g[z>>2];g[r+24>>2]=+g[A>>2];g[r+28>>2]=+g[K>>2];g[r+32>>2]=+g[L>>2];g[r+36>>2]=+g[M>>2];g[r+40>>2]=+g[B>>2];g[r+44>>2]=+g[C>>2];g[r+48>>2]=+g[N>>2];g[r+52>>2]=+g[O>>2];g[r+56>>2]=+g[P>>2];g[r+60>>2]=+g[D>>2];$=c[F>>2]|0}r=$+64|0;c[F>>2]=r;_=r}Q=V+5.0;V=Q*-0.0;T=V+0.0;of(h|0,0,12);of(A|0,0,12);g[y>>2]=10.0;g[h>>2]=0.0;g[H>>2]=0.0;g[I>>2]=0.0;g[J>>2]=U;g[z>>2]=R;g[A>>2]=U;g[K>>2]=U;g[L>>2]=0.0;g[M>>2]=0.0;g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=0.0-Q+0.0;g[O>>2]=V+1.0+0.0;g[P>>2]=T+.5+0.0;g[D>>2]=T+1.0;if((_|0)==(c[G>>2]|0)){ef(k,j);aa=c[F>>2]|0}else{if((_|0)==0){ab=0}else{of(_|0,0,64);g[_>>2]=+g[y>>2];g[_+4>>2]=+g[h>>2];g[_+8>>2]=+g[H>>2];g[_+12>>2]=+g[I>>2];g[_+16>>2]=+g[J>>2];g[_+20>>2]=+g[z>>2];g[_+24>>2]=+g[A>>2];g[_+28>>2]=+g[K>>2];g[_+32>>2]=+g[L>>2];g[_+36>>2]=+g[M>>2];g[_+40>>2]=+g[B>>2];g[_+44>>2]=+g[C>>2];g[_+48>>2]=+g[N>>2];g[_+52>>2]=+g[O>>2];g[_+56>>2]=+g[P>>2];g[_+60>>2]=+g[D>>2];ab=c[F>>2]|0}_=ab+64|0;c[F>>2]=_;aa=_}T=Q*0.0;V=T+0.0;of(h|0,0,12);of(A|0,0,12);g[y>>2]=10.0;g[h>>2]=0.0;g[H>>2]=0.0;g[I>>2]=0.0;g[J>>2]=U;g[z>>2]=R;g[A>>2]=U;g[K>>2]=U;g[L>>2]=0.0;g[M>>2]=0.0;g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=Q+0.0;g[O>>2]=T+1.0+0.0;g[P>>2]=V+.5+0.0;g[D>>2]=V+1.0;if((aa|0)==(c[G>>2]|0)){ef(k,j);ac=c[F>>2]|0}else{if((aa|0)==0){ad=0}else{of(aa|0,0,64);g[aa>>2]=+g[y>>2];g[aa+4>>2]=+g[h>>2];g[aa+8>>2]=+g[H>>2];g[aa+12>>2]=+g[I>>2];g[aa+16>>2]=+g[J>>2];g[aa+20>>2]=+g[z>>2];g[aa+24>>2]=+g[A>>2];g[aa+28>>2]=+g[K>>2];g[aa+32>>2]=+g[L>>2];g[aa+36>>2]=+g[M>>2];g[aa+40>>2]=+g[B>>2];g[aa+44>>2]=+g[C>>2];g[aa+48>>2]=+g[N>>2];g[aa+52>>2]=+g[O>>2];g[aa+56>>2]=+g[P>>2];g[aa+60>>2]=+g[D>>2];ad=c[F>>2]|0}aa=ad+64|0;c[F>>2]=aa;ac=aa}V=W+2.0;W=V*-0.0+0.0;of(h|0,0,12);T=S+20.0;S=T*0.0;g[y>>2]=T;g[h>>2]=S;g[H>>2]=S;g[I>>2]=S;g[J>>2]=0.0;g[z>>2]=4.0;of(A|0,0,16);g[B>>2]=1.0;g[C>>2]=0.0;g[N>>2]=W;g[O>>2]=0.0-V+0.0;g[P>>2]=W+.5+0.0;g[D>>2]=W+1.0;if((ac|0)==(c[G>>2]|0)){ef(k,j);ae=c[F>>2]|0}else{if((ac|0)==0){af=0}else{of(ac|0,0,64);g[ac>>2]=+g[y>>2];g[ac+4>>2]=+g[h>>2];g[ac+8>>2]=+g[H>>2];g[ac+12>>2]=+g[I>>2];g[ac+16>>2]=+g[J>>2];g[ac+20>>2]=+g[z>>2];g[ac+24>>2]=+g[A>>2];g[ac+28>>2]=+g[K>>2];g[ac+32>>2]=+g[L>>2];g[ac+36>>2]=+g[M>>2];g[ac+40>>2]=+g[B>>2];g[ac+44>>2]=+g[C>>2];g[ac+48>>2]=+g[N>>2];g[ac+52>>2]=+g[O>>2];g[ac+56>>2]=+g[P>>2];g[ac+60>>2]=+g[D>>2];af=c[F>>2]|0}D=af+64|0;c[F>>2]=D;ae=D}D=c[E>>2]|0;L821:do{if((D|0)==(ae|0)){ag=0;ah=0}else{af=u-w>>2;ac=(af>>>0)/6|0;P=af>>>0>5>>>0;af=0;O=0;N=0;C=D;L823:while(1){W=+g[C>>2];V=+g[C+4>>2];S=+g[C+8>>2];T=+g[C+16>>2];Q=+g[C+20>>2];U=+g[C+24>>2];R=+g[C+32>>2];X=+g[C+36>>2];ai=+g[C+40>>2];aj=+g[C+48>>2];ak=+g[C+52>>2];al=+g[C+56>>2];if(P){B=af;M=O;L=N;K=0;while(1){A=K*6|0;am=+g[x+(A<<2)>>2];an=+g[x+((A|1)<<2)>>2];ao=+g[x+(A+2<<2)>>2];ap=+g[x+(A+3<<2)>>2];aq=+g[x+(A+4<<2)>>2];ar=+g[x+(A+5<<2)>>2];as=aj+(W*am+T*an+R*ao);at=ak+(V*am+Q*an+X*ao);au=al+(S*am+U*an+ai*ao);ao=W*ap+T*aq+R*ar;an=V*ap+Q*aq+X*ar;am=S*ap+U*aq+ai*ar;do{if((M|0)==(B|0)){A=M-L|0;z=A>>2;J=z+1|0;if(J>>>0>1073741823>>>0){av=776;break L823}if(z>>>0>536870910>>>0){aw=1073741823;av=780}else{I=A>>1;H=I>>>0<J>>>0?J:I;if((H|0)==0){ax=0;ay=0}else{aw=H;av=780}}if((av|0)==780){av=0;ax=n4(aw<<2)|0;ay=aw}H=ax+(z<<2)|0;z=ax+(ay<<2)|0;if((H|0)!=0){g[H>>2]=as}H=ax+(J<<2)|0;J=ax;I=L;oe(J|0,I|0,A)|0;if((L|0)==0){az=ax;aA=H;aB=z;break}n6(I);az=ax;aA=H;aB=z}else{if((M|0)!=0){g[M>>2]=as}az=L;aA=M+4|0;aB=B}}while(0);do{if((aA|0)==(aB|0)){z=aB-az|0;H=z>>2;I=H+1|0;if(I>>>0>1073741823>>>0){av=791;break L823}if(H>>>0>536870910>>>0){aC=1073741823;av=795}else{A=z>>1;J=A>>>0<I>>>0?I:A;if((J|0)==0){aD=0;aE=0}else{aC=J;av=795}}if((av|0)==795){av=0;aD=n4(aC<<2)|0;aE=aC}J=aD+(H<<2)|0;H=aD+(aE<<2)|0;if((J|0)!=0){g[J>>2]=at}J=aD+(I<<2)|0;I=aD;A=az;oe(I|0,A|0,z)|0;if((az|0)==0){aF=aD;aG=J;aH=H;break}n6(A);aF=aD;aG=J;aH=H}else{if((aA|0)!=0){g[aA>>2]=at}aF=az;aG=aA+4|0;aH=aB}}while(0);do{if((aG|0)==(aH|0)){H=aH-aF|0;J=H>>2;A=J+1|0;if(A>>>0>1073741823>>>0){av=806;break L823}if(J>>>0>536870910>>>0){aI=1073741823;av=810}else{z=H>>1;I=z>>>0<A>>>0?A:z;if((I|0)==0){aJ=0;aK=0}else{aI=I;av=810}}if((av|0)==810){av=0;aJ=n4(aI<<2)|0;aK=aI}I=aJ+(J<<2)|0;J=aJ+(aK<<2)|0;if((I|0)!=0){g[I>>2]=au}I=aJ+(A<<2)|0;A=aJ;z=aF;oe(A|0,z|0,H)|0;if((aF|0)==0){aL=aJ;aM=I;aN=J;break}n6(z);aL=aJ;aM=I;aN=J}else{if((aG|0)!=0){g[aG>>2]=au}aL=aF;aM=aG+4|0;aN=aH}}while(0);do{if((aM|0)==(aN|0)){J=aN-aL|0;I=J>>2;z=I+1|0;if(z>>>0>1073741823>>>0){av=821;break L823}if(I>>>0>536870910>>>0){aO=1073741823;av=825}else{H=J>>1;A=H>>>0<z>>>0?z:H;if((A|0)==0){aP=0;aQ=0}else{aO=A;av=825}}if((av|0)==825){av=0;aP=n4(aO<<2)|0;aQ=aO}A=aP+(I<<2)|0;I=aP+(aQ<<2)|0;if((A|0)!=0){g[A>>2]=ao}A=aP+(z<<2)|0;z=aP;H=aL;oe(z|0,H|0,J)|0;if((aL|0)==0){aR=aP;aS=A;aT=I;break}n6(H);aR=aP;aS=A;aT=I}else{if((aM|0)!=0){g[aM>>2]=ao}aR=aL;aS=aM+4|0;aT=aN}}while(0);do{if((aS|0)==(aT|0)){I=aT-aR|0;A=I>>2;H=A+1|0;if(H>>>0>1073741823>>>0){av=836;break L823}if(A>>>0>536870910>>>0){aU=1073741823;av=840}else{J=I>>1;z=J>>>0<H>>>0?H:J;if((z|0)==0){aV=0;aW=0}else{aU=z;av=840}}if((av|0)==840){av=0;aV=n4(aU<<2)|0;aW=aU}z=aV+(A<<2)|0;A=aV+(aW<<2)|0;if((z|0)!=0){g[z>>2]=an}z=aV+(H<<2)|0;H=aV;J=aR;oe(H|0,J|0,I)|0;if((aR|0)==0){aX=aV;aY=z;aZ=A;break}n6(J);aX=aV;aY=z;aZ=A}else{if((aS|0)!=0){g[aS>>2]=an}aX=aR;aY=aS+4|0;aZ=aT}}while(0);do{if((aY|0)==(aZ|0)){A=aZ-aX|0;z=A>>2;J=z+1|0;if(J>>>0>1073741823>>>0){av=851;break L823}if(z>>>0>536870910>>>0){a_=1073741823;av=855}else{I=A>>1;H=I>>>0<J>>>0?J:I;if((H|0)==0){a$=0;a0=0}else{a_=H;av=855}}if((av|0)==855){av=0;a$=n4(a_<<2)|0;a0=a_}H=a$+(z<<2)|0;z=a$+(a0<<2)|0;if((H|0)!=0){g[H>>2]=am}H=a$+(J<<2)|0;J=a$;I=aX;oe(J|0,I|0,A)|0;if((aX|0)==0){a1=a$;a2=H;a3=z;break}n6(I);a1=a$;a2=H;a3=z}else{if((aY|0)!=0){g[aY>>2]=am}a1=aX;a2=aY+4|0;a3=aZ}}while(0);z=K+1|0;if(z>>>0<ac>>>0){B=a3;M=a2;L=a1;K=z}else{a4=a3;a5=a2;a6=a1;break}}}else{a4=af;a5=O;a6=N}K=C+64|0;if((K|0)==(ae|0)){ag=a5;ah=a6;break L821}else{af=a4;O=a5;N=a6;C=K}}if((av|0)==791){lw(0)}else if((av|0)==806){lw(0)}else if((av|0)==776){lw(0)}else if((av|0)==821){lw(0)}else if((av|0)==836){lw(0)}else if((av|0)==851){lw(0)}}}while(0);cv(1,20296);bZ(34962,c[5074]|0);av=ag-ah|0;ag=ah;b$(34962,av|0,ag|0,35044);c[5428]=(av>>2>>>0)/6|0;if((ah|0)!=0){n6(ag)}ag=c[E>>2]|0;E=ag;if((ag|0)!=0){ah=c[F>>2]|0;if((ag|0)!=(ah|0)){c[F>>2]=ah+(~((ah-64+(-E|0)|0)>>>6)<<6)}n6(ag)}if((w|0)==0){bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);v=c[5428]|0;c[5426]=v;i=f;return}n6(w);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);v=c[5428]|0;c[5426]=v;i=f;return}function dZ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0;d=i;i=i+864|0;e=d|0;f=c[5072]|0;if((f|0)!=0){bZ(34962,f|0);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5432]|0;c[5426]=h;i=d;return}f=e|0;g[f>>2]=-.5;g[e+4>>2]=.5;g[e+8>>2]=.5;g[e+12>>2]=0.0;g[e+16>>2]=0.0;g[e+20>>2]=1.0;g[e+24>>2]=-.5;g[e+28>>2]=-.5;g[e+32>>2]=.5;g[e+36>>2]=0.0;g[e+40>>2]=0.0;g[e+44>>2]=1.0;g[e+48>>2]=.5;g[e+52>>2]=.5;g[e+56>>2]=.5;g[e+60>>2]=0.0;g[e+64>>2]=0.0;g[e+68>>2]=1.0;g[e+72>>2]=.5;g[e+76>>2]=.5;g[e+80>>2]=.5;g[e+84>>2]=0.0;g[e+88>>2]=0.0;g[e+92>>2]=1.0;g[e+96>>2]=-.5;g[e+100>>2]=-.5;g[e+104>>2]=.5;g[e+108>>2]=0.0;g[e+112>>2]=0.0;g[e+116>>2]=1.0;g[e+120>>2]=.5;g[e+124>>2]=-.5;g[e+128>>2]=.5;g[e+132>>2]=0.0;g[e+136>>2]=0.0;g[e+140>>2]=1.0;g[e+144>>2]=-.5;g[e+148>>2]=.5;g[e+152>>2]=-.5;g[e+156>>2]=0.0;g[e+160>>2]=0.0;g[e+164>>2]=-1.0;g[e+168>>2]=.5;g[e+172>>2]=.5;g[e+176>>2]=-.5;g[e+180>>2]=0.0;g[e+184>>2]=0.0;g[e+188>>2]=-1.0;g[e+192>>2]=-.5;g[e+196>>2]=-.5;g[e+200>>2]=-.5;g[e+204>>2]=0.0;g[e+208>>2]=0.0;g[e+212>>2]=-1.0;g[e+216>>2]=-.5;g[e+220>>2]=-.5;g[e+224>>2]=-.5;g[e+228>>2]=0.0;g[e+232>>2]=0.0;g[e+236>>2]=-1.0;g[e+240>>2]=.5;g[e+244>>2]=.5;g[e+248>>2]=-.5;g[e+252>>2]=0.0;g[e+256>>2]=0.0;g[e+260>>2]=-1.0;g[e+264>>2]=.5;g[e+268>>2]=-.5;g[e+272>>2]=-.5;g[e+276>>2]=0.0;g[e+280>>2]=0.0;g[e+284>>2]=-1.0;g[e+288>>2]=-.5;g[e+292>>2]=.5;g[e+296>>2]=-.5;g[e+300>>2]=-1.0;g[e+304>>2]=0.0;g[e+308>>2]=0.0;g[e+312>>2]=-.5;g[e+316>>2]=-.5;g[e+320>>2]=-.5;g[e+324>>2]=-1.0;g[e+328>>2]=0.0;g[e+332>>2]=0.0;g[e+336>>2]=-.5;g[e+340>>2]=.5;g[e+344>>2]=.5;g[e+348>>2]=-1.0;g[e+352>>2]=0.0;g[e+356>>2]=0.0;g[e+360>>2]=-.5;g[e+364>>2]=.5;g[e+368>>2]=.5;g[e+372>>2]=-1.0;g[e+376>>2]=0.0;g[e+380>>2]=0.0;g[e+384>>2]=-.5;g[e+388>>2]=-.5;g[e+392>>2]=-.5;g[e+396>>2]=-1.0;g[e+400>>2]=0.0;g[e+404>>2]=0.0;g[e+408>>2]=-.5;g[e+412>>2]=-.5;g[e+416>>2]=.5;g[e+420>>2]=-1.0;g[e+424>>2]=0.0;g[e+428>>2]=0.0;g[e+432>>2]=.5;g[e+436>>2]=.5;g[e+440>>2]=-.5;g[e+444>>2]=1.0;g[e+448>>2]=0.0;g[e+452>>2]=0.0;g[e+456>>2]=.5;g[e+460>>2]=.5;g[e+464>>2]=.5;g[e+468>>2]=1.0;g[e+472>>2]=0.0;g[e+476>>2]=0.0;g[e+480>>2]=.5;g[e+484>>2]=-.5;g[e+488>>2]=-.5;g[e+492>>2]=1.0;g[e+496>>2]=0.0;g[e+500>>2]=0.0;g[e+504>>2]=.5;g[e+508>>2]=-.5;g[e+512>>2]=-.5;g[e+516>>2]=1.0;g[e+520>>2]=0.0;g[e+524>>2]=0.0;g[e+528>>2]=.5;g[e+532>>2]=.5;g[e+536>>2]=.5;g[e+540>>2]=1.0;g[e+544>>2]=0.0;g[e+548>>2]=0.0;g[e+552>>2]=.5;g[e+556>>2]=-.5;g[e+560>>2]=.5;g[e+564>>2]=1.0;g[e+568>>2]=0.0;g[e+572>>2]=0.0;g[e+576>>2]=-.5;g[e+580>>2]=.5;g[e+584>>2]=-.5;g[e+588>>2]=0.0;g[e+592>>2]=1.0;g[e+596>>2]=0.0;g[e+600>>2]=-.5;g[e+604>>2]=.5;g[e+608>>2]=.5;g[e+612>>2]=0.0;g[e+616>>2]=1.0;g[e+620>>2]=0.0;g[e+624>>2]=.5;g[e+628>>2]=.5;g[e+632>>2]=-.5;g[e+636>>2]=0.0;g[e+640>>2]=1.0;g[e+644>>2]=0.0;g[e+648>>2]=.5;g[e+652>>2]=.5;g[e+656>>2]=-.5;g[e+660>>2]=0.0;g[e+664>>2]=1.0;g[e+668>>2]=0.0;g[e+672>>2]=-.5;g[e+676>>2]=.5;g[e+680>>2]=.5;g[e+684>>2]=0.0;g[e+688>>2]=1.0;g[e+692>>2]=0.0;g[e+696>>2]=.5;g[e+700>>2]=.5;g[e+704>>2]=.5;g[e+708>>2]=0.0;g[e+712>>2]=1.0;g[e+716>>2]=0.0;g[e+720>>2]=-.5;g[e+724>>2]=-.5;g[e+728>>2]=-.5;g[e+732>>2]=0.0;g[e+736>>2]=-1.0;g[e+740>>2]=0.0;g[e+744>>2]=.5;g[e+748>>2]=-.5;g[e+752>>2]=-.5;g[e+756>>2]=0.0;g[e+760>>2]=-1.0;g[e+764>>2]=0.0;g[e+768>>2]=-.5;g[e+772>>2]=-.5;g[e+776>>2]=.5;g[e+780>>2]=0.0;g[e+784>>2]=-1.0;g[e+788>>2]=0.0;g[e+792>>2]=-.5;g[e+796>>2]=-.5;g[e+800>>2]=.5;g[e+804>>2]=0.0;g[e+808>>2]=-1.0;g[e+812>>2]=0.0;g[e+816>>2]=.5;g[e+820>>2]=-.5;g[e+824>>2]=-.5;g[e+828>>2]=0.0;g[e+832>>2]=-1.0;g[e+836>>2]=0.0;g[e+840>>2]=.5;g[e+844>>2]=-.5;g[e+848>>2]=.5;g[e+852>>2]=0.0;g[e+856>>2]=-1.0;g[e+860>>2]=0.0;j=n4(864)|0;k=e+864|0;e=f;f=j;do{if((f|0)==0){l=0}else{g[f>>2]=+g[e>>2];l=f}f=l+4|0;e=e+4|0;}while((e|0)!=(k|0));cv(1,20288);bZ(34962,c[5072]|0);k=f-j|0;b$(34962,k|0,j|0,35044);c[5432]=(k>>2>>>0)/6|0;if((j|0)==0){bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5432]|0;c[5426]=h;i=d;return}n6(j);bT(a|0);bd(a|0,3,5126,0,24,0);bT(b|0);bd(b|0,3,5126,0,24,12);h=c[5432]|0;c[5426]=h;i=d;return}function d_(b,d,e,f,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0,S=0,T=0,U=0,V=0,W=0;b=i;i=i+208|0;m=b|0;n=b+16|0;o=b+32|0;p=b+96|0;q=b+112|0;r=b+176|0;s=b+192|0;t=d;if((a[t]&1)==0){u=n;c[u>>2]=c[t>>2];c[u+4>>2]=c[t+4>>2];c[u+8>>2]=c[t+8>>2]}else{t=c[d+8>>2]|0;u=c[d+4>>2]|0;if(u>>>0>4294967279>>>0){gQ(0)}if(u>>>0<11>>>0){a[n]=u<<1&255;v=n+1|0}else{d=u+16&-16;w=n4(d)|0;c[n+8>>2]=w;c[n>>2]=d|1;c[n+4>>2]=u;v=w}oe(v|0,t|0,u)|0;a[v+u|0]=0}ec(m,n,l);if((a[n]&1)!=0){n6(c[n+8>>2]|0)}of(o|0,0,48);x=+g[k>>2];y=+g[k+4>>2];z=+g[k+8>>2];A=+g[k+12>>2];B=+g[k+16>>2];C=+g[k+20>>2];D=+g[k+24>>2];F=+g[k+28>>2];G=+g[k+32>>2];H=+g[k+36>>2];I=+g[k+40>>2];J=+g[k+44>>2];n=h|0;K=+g[n>>2];L=+g[n+4>>2];M=+g[n+8>>2];N=x*K+B*L+G*M+ +g[k+48>>2];O=K*y+L*C+M*H+ +g[k+52>>2];P=K*z+L*D+M*I+ +g[k+56>>2];Q=K*A+L*F+M*J+ +g[k+60>>2];k=j|0;M=+g[k>>2];L=+g[k+4>>2];K=+g[k+8>>2];g[o>>2]=x*M;g[o+4>>2]=M*y;g[o+8>>2]=M*z;g[o+12>>2]=M*A;g[o+16>>2]=B*L;g[o+20>>2]=L*C;g[o+24>>2]=L*D;g[o+28>>2]=L*F;g[o+32>>2]=G*K;g[o+36>>2]=K*H;g[o+40>>2]=K*I;g[o+44>>2]=K*J;g[o+48>>2]=N;g[o+52>>2]=O;g[o+56>>2]=P;g[o+60>>2]=Q;k=m|0;j=c[k>>2]|0;n=m+4|0;m=c[n>>2]|0;if((j|0)==(m|0)){R=j}else{h=p;l=p;u=h+1|0;v=h+9|0;h=r;t=r;w=h+1|0;d=h+9|0;Q=+(f>>>16&255|0)/255.0;P=+(f>>>8&255|0)/255.0;O=+(f&255|0)/255.0;N=+(f>>>24|0)/255.0;f=s|0;h=s+4|0;S=s+8|0;T=s+12|0;U=r+8|0;V=p+8|0;W=j;do{a[l]=16;j=u|0;E=1701080941;a[j]=E&255;E=E>>8;a[j+1|0]=E&255;E=E>>8;a[j+2|0]=E&255;E=E>>8;a[j+3|0]=E&255;j=u+4|0;E=1952533868;a[j]=E&255;E=E>>8;a[j+1|0]=E&255;E=E>>8;a[j+2|0]=E&255;E=E>>8;a[j+3|0]=E&255;a[v]=0;ed(q,o,W);dX(e,p,q,1,0);if((a[l]&1)!=0){n6(c[V>>2]|0)}a[t]=16;j=w|0;E=1131966306;a[j]=E&255;E=E>>8;a[j+1|0]=E&255;E=E>>8;a[j+2|0]=E&255;E=E>>8;a[j+3|0]=E&255;j=w+4|0;E=1919904879;a[j]=E&255;E=E>>8;a[j+1|0]=E&255;E=E>>8;a[j+2|0]=E&255;E=E>>8;a[j+3|0]=E&255;a[d]=0;g[f>>2]=Q;g[h>>2]=P;g[S>>2]=O;g[T>>2]=N;dU(e,r,s,1);if((a[t]&1)!=0){n6(c[U>>2]|0)}bm(4,0,c[5426]|0);W=W+64|0;}while((W|0)!=(m|0));R=c[k>>2]|0}if((R|0)==0){i=b;return}k=c[n>>2]|0;if((R|0)!=(k|0)){c[n>>2]=k+(~((k-64+(-R|0)|0)>>>6)<<6)}n6(R);i=b;return}function d$(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=i;i=i+16|0;m=b|0;n=m;o=i;i=i+136|0;p=i;i=i+12|0;i=i+7&-8;q=o|0;r=o+4|0;s=o;c[q>>2]=14588;t=o;u=o+56|0;c[u>>2]=14608;he(o+56|0,r);c[o+128>>2]=0;c[o+132>>2]=-1;c[q>>2]=6844;c[o+56>>2]=6864;v=r|0;c[v>>2]=7224;w=o+8|0;lC(w);x=o+12|0;of(x|0,0,24);c[v>>2]=7080;v=o+36|0;y=o+48|0;z=o+52|0;of(o+36|0,0,16);c[z>>2]=16;of(n|0,0,12);eb(r,m);if((a[n]&1)!=0){n6(c[m+8>>2]|0)}c[t+((c[(c[s>>2]|0)-12>>2]|0)+76)>>2]=48;c[t+((c[(c[s>>2]|0)-12>>2]|0)+12)>>2]=e;hX(o,d)|0;d=p;e=c[z>>2]|0;do{if((e&16|0)==0){if((e&8|0)==0){of(d|0,0,12);break}z=c[x>>2]|0;s=c[o+20>>2]|0;t=z;m=s-t|0;if(m>>>0>4294967279>>>0){gQ(0)}if(m>>>0<11>>>0){a[d]=m<<1&255;A=p+1|0}else{n=m+16&-16;r=n4(n)|0;c[p+8>>2]=r;c[p>>2]=n|1;c[p+4>>2]=m;A=r}if((z|0)==(s|0)){B=A}else{r=s+(-t|0)|0;t=A;m=z;while(1){a[t]=a[m]|0;z=m+1|0;if((z|0)==(s|0)){break}else{t=t+1|0;m=z}}B=A+r|0}a[B]=0}else{m=c[y>>2]|0;t=c[o+28>>2]|0;if(m>>>0<t>>>0){c[y>>2]=t;C=t}else{C=m}m=c[o+24>>2]|0;t=m;s=C-t|0;if(s>>>0>4294967279>>>0){gQ(0)}if(s>>>0<11>>>0){a[d]=s<<1&255;D=p+1|0}else{z=s+16&-16;n=n4(z)|0;c[p+8>>2]=n;c[p>>2]=z|1;c[p+4>>2]=s;D=n}if((m|0)==(C|0)){E=D}else{n=C+(-t|0)|0;t=D;s=m;while(1){a[t]=a[s]|0;m=s+1|0;if((m|0)==(C|0)){break}else{t=t+1|0;s=m}}E=D+n|0}a[E]=0}}while(0);d_(0,p,f,g,h,j,k,l);if((a[d]&1)!=0){n6(c[p+8>>2]|0)}c[q>>2]=6844;c[u>>2]=6864;u=o+4|0;c[u>>2]=7080;if((a[v]&1)==0){c[u>>2]=7224;lE(w);F=o+56|0;hc(F);i=b;return}n6(c[o+44>>2]|0);c[u>>2]=7224;lE(w);F=o+56|0;hc(F);i=b;return}function d0(b){b=b|0;var d=0;c[b>>2]=6844;c[b+56>>2]=6864;d=b+4|0;c[d>>2]=7080;if((a[b+36|0]&1)!=0){n6(c[b+44>>2]|0)}c[d>>2]=7224;lE(b+8|0);hc(b+56|0);return}function d1(b){b=b|0;var d=0,e=0,f=0;d=b;e=c[(c[b>>2]|0)-12>>2]|0;c[d+e>>2]=6844;b=d+(e+56)|0;c[b>>2]=6864;f=d+(e+4)|0;c[f>>2]=7080;if((a[d+(e+36)|0]&1)!=0){n6(c[d+(e+44)>>2]|0)}c[f>>2]=7224;lE(d+(e+8)|0);hc(b);return}function d2(b){b=b|0;var d=0;c[b>>2]=6844;c[b+56>>2]=6864;d=b+4|0;c[d>>2]=7080;if((a[b+36|0]&1)!=0){n6(c[b+44>>2]|0)}c[d>>2]=7224;lE(b+8|0);hc(b+56|0);n6(b);return}function d3(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=c[(c[b>>2]|0)-12>>2]|0;b=d+e|0;c[b>>2]=6844;f=d+(e+56)|0;c[f>>2]=6864;g=d+(e+4)|0;c[g>>2]=7080;if((a[d+(e+36)|0]&1)!=0){n6(c[d+(e+44)>>2]|0)}c[g>>2]=7224;lE(d+(e+8)|0);hc(f);n6(b);return}function d4(b){b=b|0;var d=0;d=b|0;c[d>>2]=7080;if((a[b+32|0]&1)!=0){n6(c[b+40>>2]|0)}c[d>>2]=7224;lE(b+4|0);return}function d5(b){b=b|0;var d=0;d=b|0;c[d>>2]=7080;if((a[b+32|0]&1)!=0){n6(c[b+40>>2]|0)}c[d>>2]=7224;lE(b+4|0);n6(b);return}function d6(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;i=d+44|0;j=c[i>>2]|0;k=d+24|0;l=c[k>>2]|0;if(j>>>0<l>>>0){c[i>>2]=l;m=l}else{m=j}j=h&24;do{if((j|0)==0){i=b;c[i>>2]=0;c[i+4>>2]=0;i=b+8|0;c[i>>2]=-1;c[i+4>>2]=-1;return}else if((j|0)==24){if((g|0)==2){n=1034;break}else if((g|0)==0){o=0;p=0;break}else if((g|0)!=1){n=1038;break}i=b;c[i>>2]=0;c[i+4>>2]=0;i=b+8|0;c[i>>2]=-1;c[i+4>>2]=-1;return}else{if((g|0)==2){n=1034;break}else if((g|0)==0){o=0;p=0;break}else if((g|0)!=1){n=1038;break}if((h&8|0)==0){i=l-(c[d+20>>2]|0)|0;o=(i|0)<0|0?-1:0;p=i;break}else{i=(c[d+12>>2]|0)-(c[d+8>>2]|0)|0;o=(i|0)<0|0?-1:0;p=i;break}}}while(0);if((n|0)==1038){g=b;c[g>>2]=0;c[g+4>>2]=0;g=b+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}if((n|0)==1034){n=d+32|0;if((a[n]&1)==0){q=n+1|0}else{q=c[d+40>>2]|0}n=m-q|0;o=(n|0)<0|0?-1:0;p=n}n=ok(p,o,e,f)|0;f=M;e=0;do{if(!((f|0)<(e|0)|(f|0)==(e|0)&n>>>0<0>>>0)){o=d+32|0;if((a[o]&1)==0){r=o+1|0}else{r=c[d+40>>2]|0}o=m-r|0;p=(o|0)<0|0?-1:0;if((p|0)<(f|0)|(p|0)==(f|0)&o>>>0<n>>>0){break}o=h&8;do{if(!((n|0)==0&(f|0)==0)){do{if((o|0)!=0){if((c[d+12>>2]|0)!=0){break}p=b;c[p>>2]=0;c[p+4>>2]=0;p=b+8|0;c[p>>2]=-1;c[p+4>>2]=-1;return}}while(0);if(!((h&16|0)!=0&(l|0)==0)){break}p=b;c[p>>2]=0;c[p+4>>2]=0;p=b+8|0;c[p>>2]=-1;c[p+4>>2]=-1;return}}while(0);if((o|0)!=0){c[d+12>>2]=(c[d+8>>2]|0)+n;c[d+16>>2]=m}if((h&16|0)!=0){c[k>>2]=(c[d+20>>2]|0)+n}p=b;c[p>>2]=0;c[p+4>>2]=0;p=b+8|0;c[p>>2]=n;c[p+4>>2]=f;return}}while(0);f=b;c[f>>2]=0;c[f+4>>2]=0;f=b+8|0;c[f>>2]=-1;c[f+4>>2]=-1;return}function d7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=d;d=i;i=i+16|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];c[d+8>>2]=c[g+8>>2];c[d+12>>2]=c[g+12>>2];g=d+8|0;c3[c[(c[b>>2]|0)+16>>2]&63](a,b,c[g>>2]|0,c[g+4>>2]|0,0,e);i=f;return}function d8(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,i=0;b=a+44|0;e=c[b>>2]|0;f=c[a+24>>2]|0;if(e>>>0<f>>>0){c[b>>2]=f;g=f}else{g=e}if((c[a+48>>2]&8|0)==0){h=-1;return h|0}e=a+16|0;f=c[e>>2]|0;b=c[a+12>>2]|0;if(f>>>0<g>>>0){c[e>>2]=g;i=g}else{i=f}if(b>>>0>=i>>>0){h=-1;return h|0}h=d[b]|0;return h|0}function d9(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=b+44|0;f=c[e>>2]|0;g=c[b+24>>2]|0;if(f>>>0<g>>>0){c[e>>2]=g;h=g}else{h=f}f=b+8|0;g=c[f>>2]|0;e=b+12|0;i=c[e>>2]|0;if(g>>>0>=i>>>0){j=-1;return j|0}if((d|0)==-1){c[f>>2]=g;c[e>>2]=i-1;c[b+16>>2]=h;j=0;return j|0}k=i-1|0;do{if((c[b+48>>2]&16|0)==0){if((d<<24>>24|0)==(a[k]|0)){break}else{j=-1}return j|0}}while(0);c[f>>2]=g;c[e>>2]=k;c[b+16>>2]=h;a[k]=d&255;j=d;return j|0}function ea(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;if((d|0)==-1){e=0;return e|0}f=b|0;g=b+12|0;h=b+8|0;i=(c[g>>2]|0)-(c[h>>2]|0)|0;j=b+24|0;k=c[j>>2]|0;l=b+28|0;m=c[l>>2]|0;if((k|0)==(m|0)){n=b+48|0;if((c[n>>2]&16|0)==0){e=-1;return e|0}o=b+20|0;p=c[o>>2]|0;q=k-p|0;r=b+44|0;s=(c[r>>2]|0)-p|0;p=b+32|0;t=p;u=p;v=a[u]|0;if((v&1)==0){w=(v&255)>>>1;x=10}else{w=c[b+36>>2]|0;x=(c[p>>2]&-2)-1|0}if((w|0)==(x|0)){g0(p,x,1,x,x,0,0);y=a[u]|0}else{y=v}if((y&1)==0){a[u]=(w<<1)+2&255;z=t+1|0;A=w+1|0}else{y=c[b+40>>2]|0;v=w+1|0;c[b+36>>2]=v;z=y;A=v}a[z+w|0]=0;a[z+A|0]=0;A=a[u]|0;if((A&1)==0){B=10;C=A}else{A=c[p>>2]|0;B=(A&-2)-1|0;C=A&255}A=C&255;if((A&1|0)==0){D=A>>>1}else{D=c[b+36>>2]|0}do{if(D>>>0<B>>>0){A=B-D|0;gX(p,A,0)|0}else{if((C&1)==0){a[t+1+B|0]=0;a[u]=B<<1&255;break}else{a[(c[b+40>>2]|0)+B|0]=0;c[b+36>>2]=B;break}}}while(0);B=a[u]|0;if((B&1)==0){E=t+1|0}else{E=c[b+40>>2]|0}t=B&255;if((t&1|0)==0){F=t>>>1}else{F=c[b+36>>2]|0}t=E+F|0;c[o>>2]=E;c[l>>2]=t;l=E+q|0;c[j>>2]=l;q=E+s|0;c[r>>2]=q;G=l;H=t;I=q;J=n}else{G=k;H=m;I=c[b+44>>2]|0;J=b+48|0}m=G+1|0;k=m>>>0<I>>>0?I:m;c[b+44>>2]=k;if((c[J>>2]&8|0)!=0){J=b+32|0;if((a[J]&1)==0){K=J+1|0}else{K=c[b+40>>2]|0}c[h>>2]=K;c[g>>2]=K+i;c[b+16>>2]=k}if((G|0)==(H|0)){e=cV[c[(c[b>>2]|0)+52>>2]&63](f,d&255)|0;return e|0}else{c[j>>2]=m;a[G]=d&255;e=d&255;return e|0}return 0}function eb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=b+32|0;do{if((e|0)!=(d|0)){f=a[d]|0;if((f&1)==0){g=d+1|0}else{g=c[d+8>>2]|0}h=f&255;if((h&1|0)==0){i=h>>>1}else{i=c[d+4>>2]|0}h=e;f=e;j=a[f]|0;if((j&1)==0){k=10;l=j}else{j=c[e>>2]|0;k=(j&-2)-1|0;l=j&255}if(k>>>0<i>>>0){j=l&255;if((j&1|0)==0){m=j>>>1}else{m=c[b+36>>2]|0}g$(e,k,i-k|0,m,0,m,i,g);break}if((l&1)==0){n=h+1|0}else{n=c[b+40>>2]|0}oh(n|0,g|0,i|0);a[n+i|0]=0;if((a[f]&1)==0){a[f]=i<<1&255;break}else{c[b+36>>2]=i;break}}}while(0);i=b+44|0;c[i>>2]=0;n=b+48|0;g=c[n>>2]|0;if((g&8|0)!=0){l=e;m=a[e]|0;k=(m&1)==0;if(k){o=l+1|0}else{o=c[b+40>>2]|0}d=m&255;if((d&1|0)==0){p=d>>>1}else{p=c[b+36>>2]|0}d=o+p|0;c[i>>2]=d;if(k){q=l+1|0;r=l+1|0}else{l=c[b+40>>2]|0;q=l;r=l}c[b+8>>2]=r;c[b+12>>2]=q;c[b+16>>2]=d}if((g&16|0)==0){return}g=e;d=e;q=a[d]|0;r=q&255;if((r&1|0)==0){s=r>>>1}else{s=c[b+36>>2]|0}if((q&1)==0){c[i>>2]=g+1+s;t=10;u=q}else{c[i>>2]=(c[b+40>>2]|0)+s;i=c[e>>2]|0;t=(i&-2)-1|0;u=i&255}i=u&255;if((i&1|0)==0){v=i>>>1}else{v=c[b+36>>2]|0}do{if(v>>>0<t>>>0){i=t-v|0;gX(e,i,0)|0}else{if((u&1)==0){a[g+1+t|0]=0;a[d]=t<<1&255;break}else{a[(c[b+40>>2]|0)+t|0]=0;c[b+36>>2]=t;break}}}while(0);t=a[d]|0;if((t&1)==0){w=g+1|0;x=g+1|0}else{g=c[b+40>>2]|0;w=g;x=g}g=t&255;if((g&1|0)==0){y=g>>>1}else{y=c[b+36>>2]|0}g=b+24|0;c[g>>2]=x;c[b+20>>2]=x;c[b+28>>2]=w+y;if((c[n>>2]&3|0)==0){return}c[g>>2]=x+s;return}function ec(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0,S=0,T=0,U=0;f=i;i=i+112|0;h=f|0;j=f+16|0;k=f+32|0;l=f+48|0;m=d;n=a[m]|0;o=n&255;if((o&1|0)==0){p=o>>>1}else{p=c[d+4>>2]|0}if((p|0)==0){of(b|0,0,12);i=f;return}if((n&1)==0){n=j;c[n>>2]=c[m>>2];c[n+4>>2]=c[m+4>>2];c[n+8>>2]=c[m+8>>2]}else{m=c[d+8>>2]|0;n=c[d+4>>2]|0;if(n>>>0>4294967279>>>0){gQ(0)}if(n>>>0<11>>>0){a[j]=n<<1&255;q=j+1|0}else{d=n+16&-16;p=n4(d)|0;c[j+8>>2]=p;c[j>>2]=d|1;c[j+4>>2]=n;q=p}oe(q|0,m|0,n)|0;a[q+n|0]=0}ee(h,j);if((a[j]&1)!=0){n6(c[j+8>>2]|0)}j=h|0;n=c[j>>2]|0;q=h+4|0;h=c[q>>2]|0;m=(n|0)==(h|0);if(m){r=-1.0}else{p=n;d=0;while(1){s=c[p+4>>2]|0;o=p+20|0;if((o|0)==(h|0)){break}else{p=o;d=d+1+s|0}}r=+(d+s|0)}if((e|0)==1){t=-0.0-r}else if((e|0)==2){t=r*-.5}else{t=0.0}e=k|0;c[e>>2]=0;s=k+4|0;c[s>>2]=0;d=k+8|0;c[d>>2]=0;if(m){u=0;v=0;w=0}else{p=l;o=l|0;x=l+4|0;y=l+20|0;z=l+24|0;A=l+40|0;B=l+44|0;C=l+48|0;D=l+52|0;E=l+56|0;F=l+60|0;G=n;H=0;while(1){I=c[G+4>>2]|0;r=t+(+(H|0)+ +(I>>>0>>>0)*.5);J=c[G+8>>2]|0;K=c[G+12>>2]|0;if((J|0)!=(K|0)){L=J;do{M=r+ +g[L>>2];N=+g[L+4>>2]+0.0;of(p|0,0,52);g[o>>2]=1.0;of(x|0,0,16);g[y>>2]=1.0;of(z|0,0,16);g[A>>2]=1.0;g[B>>2]=0.0;O=M*0.0;P=N*0.0;Q=M+P+0.0;M=O+N+0.0;N=O+P+0.0;P=N+1.0;g[C>>2]=Q;g[D>>2]=M;g[E>>2]=N;g[F>>2]=P;J=c[s>>2]|0;if((J|0)==(c[d>>2]|0)){ef(k,l)}else{if((J|0)==0){R=0}else{of(J|0,0,60);g[J>>2]=1.0;of(J+4|0,0,16);g[J+20>>2]=1.0;of(J+24|0,0,16);g[J+40>>2]=1.0;g[J+44>>2]=0.0;g[J+48>>2]=Q;g[J+52>>2]=M;g[J+56>>2]=N;g[J+60>>2]=P;R=c[s>>2]|0}c[s>>2]=R+64}L=L+8|0;}while((L|0)!=(K|0))}K=G+20|0;if((K|0)==(h|0)){break}else{G=K;H=H+1+I|0}}u=c[e>>2]|0;v=c[s>>2]|0;w=c[d>>2]|0}c[b>>2]=u;c[b+4>>2]=v;c[b+8>>2]=w;c[d>>2]=0;c[s>>2]=0;c[e>>2]=0;if((n|0)==0){i=f;return}if(m){S=n}else{m=h;while(1){h=m-20|0;c[q>>2]=h;e=c[m-20+8>>2]|0;s=e;if((e|0)==0){T=h}else{d=m-20+12|0;w=c[d>>2]|0;if((e|0)==(w|0)){U=h}else{c[d>>2]=w+(~((w-8+(-s|0)|0)>>>3)<<3);U=c[q>>2]|0}n6(e);T=U}if((n|0)==(T|0)){break}else{m=T}}S=c[j>>2]|0}n6(S|0);i=f;return}function ed(a,b,c){a=a|0;b=b|0;c=c|0;var d=0.0,e=0.0,f=0.0,h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0;d=+g[b>>2];e=+g[b+4>>2];f=+g[b+8>>2];h=+g[b+12>>2];i=+g[b+16>>2];j=+g[b+20>>2];k=+g[b+24>>2];l=+g[b+28>>2];m=+g[b+32>>2];n=+g[b+36>>2];o=+g[b+40>>2];p=+g[b+44>>2];q=+g[b+48>>2];r=+g[b+52>>2];s=+g[b+56>>2];t=+g[b+60>>2];u=+g[c>>2];v=+g[c+4>>2];w=+g[c+8>>2];x=+g[c+12>>2];y=+g[c+16>>2];z=+g[c+20>>2];A=+g[c+24>>2];B=+g[c+28>>2];C=+g[c+32>>2];D=+g[c+36>>2];E=+g[c+40>>2];F=+g[c+44>>2];G=+g[c+48>>2];H=+g[c+52>>2];I=+g[c+56>>2];J=+g[c+60>>2];of(a|0,0,60);g[a>>2]=d*u+i*v+m*w+q*x;g[a+4>>2]=e*u+j*v+n*w+r*x;g[a+8>>2]=f*u+k*v+o*w+s*x;g[a+12>>2]=h*u+l*v+p*w+t*x;g[a+16>>2]=d*y+i*z+m*A+q*B;g[a+20>>2]=e*y+j*z+n*A+r*B;g[a+24>>2]=f*y+k*z+o*A+s*B;g[a+28>>2]=h*y+l*z+p*A+t*B;g[a+32>>2]=d*C+i*D+m*E+q*F;g[a+36>>2]=e*C+j*D+n*E+r*F;g[a+40>>2]=f*C+k*D+o*E+s*F;g[a+44>>2]=h*C+l*D+p*E+t*F;g[a+48>>2]=d*G+i*H+m*I+q*J;g[a+52>>2]=e*G+j*H+n*I+r*J;g[a+56>>2]=f*G+k*H+o*I+s*J;g[a+60>>2]=h*G+l*H+p*I+t*J;return}function ee(b,e){b=b|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0,W=0,X=0.0,Y=0,Z=0.0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;f=i;i=i+256|0;h=f|0;j=f+16|0;k=f+200|0;l=f+224|0;m=f+232|0;n=f+248|0;do{if((c[5423]|0)==0){o=n4(48)|0;p=h+8|0;c[p>>2]=o;c[h>>2]=49;q=h+4|0;c[q>>2]=47;oe(o|0,4032,47)|0;a[o+47|0]=0;o=j|0;r=n4(64)|0;c[j+8>>2]=r;c[j>>2]=65;c[j+4>>2]=57;oe(r|0,3960,57)|0;a[r+57|0]=0;r=n4(64)|0;c[j+20>>2]=r;c[j+12>>2]=65;c[j+16>>2]=57;oe(r|0,3896,57)|0;a[r+57|0]=0;r=n4(64)|0;c[j+32>>2]=r;c[j+24>>2]=65;c[j+28>>2]=57;oe(r|0,3808,57)|0;a[r+57|0]=0;r=n4(64)|0;c[j+44>>2]=r;c[j+36>>2]=65;c[j+40>>2]=57;oe(r|0,3744,57)|0;a[r+57|0]=0;r=n4(64)|0;c[j+56>>2]=r;c[j+48>>2]=65;c[j+52>>2]=57;oe(r|0,3664,57)|0;a[r+57|0]=0;r=n4(80)|0;c[j+68>>2]=r;c[j+60>>2]=81;c[j+64>>2]=67;oe(r|0,3592,67)|0;a[r+67|0]=0;r=n4(80)|0;c[j+80>>2]=r;c[j+72>>2]=81;c[j+76>>2]=67;oe(r|0,3520,67)|0;a[r+67|0]=0;r=n4(80)|0;c[j+92>>2]=r;c[j+84>>2]=81;c[j+88>>2]=67;oe(r|0,3440,67)|0;a[r+67|0]=0;r=n4(80)|0;c[j+104>>2]=r;c[j+96>>2]=81;c[j+100>>2]=67;oe(r|0,3360,67)|0;a[r+67|0]=0;r=n4(80)|0;c[j+116>>2]=r;c[j+108>>2]=81;c[j+112>>2]=67;oe(r|0,3248,67)|0;a[r+67|0]=0;r=n4(80)|0;c[j+128>>2]=r;c[j+120>>2]=81;c[j+124>>2]=68;oe(r|0,3160,68)|0;a[r+68|0]=0;r=n4(80)|0;c[j+140>>2]=r;c[j+132>>2]=81;c[j+136>>2]=68;oe(r|0,3064,68)|0;a[r+68|0]=0;r=n4(80)|0;c[j+152>>2]=r;c[j+144>>2]=81;c[j+148>>2]=68;oe(r|0,2976,68)|0;a[r+68|0]=0;r=n4(80)|0;c[j+164>>2]=r;c[j+156>>2]=81;c[j+160>>2]=68;oe(r|0,2888,68)|0;a[r+68|0]=0;r=n4(80)|0;c[j+176>>2]=r;c[j+168>>2]=81;c[j+172>>2]=68;oe(r|0,2776,68)|0;a[r+68|0]=0;r=n4(180)|0;s=r;t=j+180|0;u=o;o=s;L1405:do{do{if((o|0)!=0){v=u;if((a[v]&1)==0){w=o;c[w>>2]=c[v>>2];c[w+4>>2]=c[v+4>>2];c[w+8>>2]=c[v+8>>2];break}v=c[u+8>>2]|0;w=c[u+4>>2]|0;if(w>>>0>4294967279>>>0){x=1275;break L1405}if(w>>>0<11>>>0){a[o]=w<<1&255;y=o+1|0}else{z=w+16&-16;A=n4(z)|0;c[o+8>>2]=A;c[o>>2]=z|1;c[o+4>>2]=w;y=A}oe(y|0,v|0,w)|0;a[y+w|0]=0}}while(0);o=o+12|0;u=u+12|0;}while((u|0)!=(t|0));if((x|0)==1275){gQ(0)}if((a[j+168|0]&1)!=0){n6(c[j+176>>2]|0)}if((a[j+156|0]&1)!=0){n6(c[j+164>>2]|0)}if((a[j+144|0]&1)!=0){n6(c[j+152>>2]|0)}if((a[j+132|0]&1)!=0){n6(c[j+140>>2]|0)}if((a[j+120|0]&1)!=0){n6(c[j+128>>2]|0)}if((a[j+108|0]&1)!=0){n6(c[j+116>>2]|0)}if((a[j+96|0]&1)!=0){n6(c[j+104>>2]|0)}if((a[j+84|0]&1)!=0){n6(c[j+92>>2]|0)}if((a[j+72|0]&1)!=0){n6(c[j+80>>2]|0)}if((a[j+60|0]&1)!=0){n6(c[j+68>>2]|0)}if((a[j+48|0]&1)!=0){n6(c[j+56>>2]|0)}if((a[j+36|0]&1)!=0){n6(c[j+44>>2]|0)}if((a[j+24|0]&1)!=0){n6(c[j+32>>2]|0)}if((a[j+12|0]&1)!=0){n6(c[j+20>>2]|0)}if((a[j]&1)!=0){n6(c[j+8>>2]|0)}t=a[h]|0;u=t&255;w=(u&1|0)==0?u>>>1:c[q>>2]|0;L1468:do{if((w|0)!=0){u=(o-r|0)/12|0;v=k+8|0;A=k+12|0;z=k+16|0;B=h+1|0;C=k|0;D=k+4|0;E=l|0;F=l+4|0;G=k+8|0;H=0;I=0;J=0;do{K=H*5|0;if(K>>>0>=u>>>0){break L1468}L=s+(K*12|0)|0;M=L;N=(a[M]&1)==0;O=L+1|0;L=s+(K*12|0)+8|0;P=I;while(1){Q=P+1|0;if(N){R=O}else{R=c[L>>2]|0}if((a[R+Q|0]|0)==33){break}else{P=Q}}c[v>>2]=0;c[A>>2]=0;c[z>>2]=0;a[C]=a[((t&1)==0?B:c[p>>2]|0)+J|0]|0;L=Q-I|0;c[D>>2]=L;S=+(L>>>0>>>0)*.5;O=0;N=L;while(1){if((N|0)==0){T=0}else{L=O+K|0;U=s+(L*12|0)|0;V=U;W=U+1|0;X=-0.0-(+(O|0)+.5+ -2.5);U=s+(L*12|0)+8|0;L=0;while(1){if((a[V]&1)==0){Y=W}else{Y=c[U>>2]|0}do{if((a[Y+(L+I)|0]|0)==35){Z=+(L|0)+.5-S;g[E>>2]=Z;g[F>>2]=X;_=c[A>>2]|0;if(_>>>0>=(c[z>>2]|0)>>>0){eo(G,l);break}if((_|0)==0){$=0}else{g[_>>2]=Z;g[_+4>>2]=X;$=c[A>>2]|0}c[A>>2]=$+8}}while(0);_=L+1|0;aa=c[D>>2]|0;if(_>>>0<aa>>>0){L=_}else{T=aa;break}}}L=O+1|0;if((L|0)<5){O=L;N=T}else{break}}N=eg(21680,C)|0;a[N|0]=a[C]|0;c[N+4>>2]=c[D>>2];if((N|0)!=(k|0)){en(N+8|0,c[v>>2]|0,c[A>>2]|0)}J=J+1|0;N=P+2|0;O=d[M]|0;if((O&1|0)==0){ab=O>>>1}else{ab=c[s+(K*12|0)+4>>2]|0}O=N>>>0<ab>>>0;H=(O&1^1)+H|0;I=O?N:0;N=c[v>>2]|0;O=N;if((N|0)!=0){L=c[A>>2]|0;if((N|0)!=(L|0)){c[A>>2]=L+(~((L-8+(-O|0)|0)>>>3)<<3)}n6(N)}}while(J>>>0<w>>>0)}}while(0);if((r|0)!=0){if((s|0)!=(o|0)){w=o;while(1){q=w-12|0;if((a[q]&1)!=0){n6(c[w-12+8>>2]|0)}if((s|0)==(q|0)){break}else{w=q}}}n6(r)}if((t&1)==0){break}n6(c[p>>2]|0)}}while(0);ab=m|0;c[ab>>2]=0;k=m+4|0;c[k>>2]=0;T=m+8|0;c[T>>2]=0;$=e;l=a[e]|0;if((l&1)==0){ac=$+1|0;ad=$+1|0}else{$=c[e+8>>2]|0;ac=$;ad=$}$=l&255;if(($&1|0)==0){ae=$>>>1}else{ae=c[e+4>>2]|0}e=ac+ae|0;if((ad|0)==(e|0)){af=0;ag=0;ah=0;ai=b|0;aj=b+4|0;ak=b+8|0;c[ai>>2]=af;c[aj>>2]=ag;c[ak>>2]=ah;i=f;return}else{al=ad}do{a[n]=a[al]|0;ad=eh(21680,n)|0;ae=c[k>>2]|0;if((ae|0)==(c[T>>2]|0)){el(m,ad)}else{if((ae|0)==0){am=0}else{a[ae|0]=a[ad|0]|0;c[ae+4>>2]=c[ad+4>>2];em(ae+8|0,ad+8|0);am=c[k>>2]|0}c[k>>2]=am+20}al=al+1|0;}while((al|0)!=(e|0));af=c[ab>>2]|0;ag=c[k>>2]|0;ah=c[T>>2]|0;ai=b|0;aj=b+4|0;ak=b+8|0;c[ai>>2]=af;c[aj>>2]=ag;c[ak>>2]=ah;i=f;return}function ef(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=a+4|0;e=c[d>>2]|0;f=a|0;h=c[f>>2]|0;i=h;j=e-i>>6;k=j+1|0;if(k>>>0>67108863>>>0){lw(0)}l=a+8|0;a=(c[l>>2]|0)-i|0;if(a>>6>>>0>33554430>>>0){m=67108863;n=1442}else{o=a>>5;a=o>>>0<k>>>0?k:o;if((a|0)==0){p=0;q=0}else{m=a;n=1442}}if((n|0)==1442){p=n4(m<<6)|0;q=m}m=p+(j<<6)|0;n=p+(q<<6)|0;if((m|0)!=0){of(m|0,0,64);g[m>>2]=+g[b>>2];g[p+(j<<6)+4>>2]=+g[b+4>>2];g[p+(j<<6)+8>>2]=+g[b+8>>2];g[p+(j<<6)+12>>2]=+g[b+12>>2];g[p+(j<<6)+16>>2]=+g[b+16>>2];g[p+(j<<6)+20>>2]=+g[b+20>>2];g[p+(j<<6)+24>>2]=+g[b+24>>2];g[p+(j<<6)+28>>2]=+g[b+28>>2];g[p+(j<<6)+32>>2]=+g[b+32>>2];g[p+(j<<6)+36>>2]=+g[b+36>>2];g[p+(j<<6)+40>>2]=+g[b+40>>2];g[p+(j<<6)+44>>2]=+g[b+44>>2];g[p+(j<<6)+48>>2]=+g[b+48>>2];g[p+(j<<6)+52>>2]=+g[b+52>>2];g[p+(j<<6)+56>>2]=+g[b+56>>2];g[p+(j<<6)+60>>2]=+g[b+60>>2]}b=p+(k<<6)|0;if((e|0)==(h|0)){r=e;s=m}else{k=j-1-((e-64+(-i|0)|0)>>>6)|0;i=e;e=m;while(1){m=e-64|0;j=i-64|0;if((m|0)!=0){of(m|0,0,64);g[m>>2]=+g[j>>2];g[e-64+4>>2]=+g[i-64+4>>2];g[e-64+8>>2]=+g[i-64+8>>2];g[e-64+12>>2]=+g[i-64+12>>2];g[e-64+16>>2]=+g[i-64+16>>2];g[e-64+20>>2]=+g[i-64+20>>2];g[e-64+24>>2]=+g[i-64+24>>2];g[e-64+28>>2]=+g[i-64+28>>2];g[e-64+32>>2]=+g[i-64+32>>2];g[e-64+36>>2]=+g[i-64+36>>2];g[e-64+40>>2]=+g[i-64+40>>2];g[e-64+44>>2]=+g[i-64+44>>2];g[e-64+48>>2]=+g[i-64+48>>2];g[e-64+52>>2]=+g[i-64+52>>2];g[e-64+56>>2]=+g[i-64+56>>2];g[e-64+60>>2]=+g[i-64+60>>2]}if((j|0)==(h|0)){break}else{i=j;e=m}}r=c[f>>2]|0;s=p+(k<<6)|0}c[f>>2]=s;c[d>>2]=b;c[l>>2]=n;if((r|0)==0){return}n6(r);return}function eg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+8|0;f=e|0;g=b|0;h=a[d]|0;d=h&255;j=c[b+4>>2]|0;L1575:do{if((j|0)!=0){k=j-1|0;l=(k&j|0)!=0;if(l){m=(d>>>0)%(j>>>0)|0}else{m=k&d}n=c[(c[b>>2]|0)+(m<<2)>>2]|0;if((n|0)==0){break}if(l){l=n;while(1){o=c[l>>2]|0;if((o|0)==0){break L1575}if((((c[o+4>>2]|0)>>>0)%(j>>>0)|0|0)!=(m|0)){break L1575}if((a[o+8|0]|0)==h<<24>>24){p=o;break}else{l=o}}}else{l=n;while(1){o=c[l>>2]|0;if((o|0)==0){break L1575}if((c[o+4>>2]&k|0)!=(m|0)){break L1575}if((a[o+8|0]|0)==h<<24>>24){p=o;break}else{l=o}}}if((p|0)==0){break}else{q=p}r=q+8|0;s=r+4|0;t=s;i=e;return t|0}}while(0);p=n4(32)|0;m=p+8|0;if((m|0)!=0){a[m]=h}h=p+12|0;if((h|0)!=0){of(h|0,0,20)}ei(f,g,p);q=c[f>>2]|0;r=q+8|0;s=r+4|0;t=s;i=e;return t|0}function eh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;i=i+8|0;f=e|0;g=b|0;h=a[d]|0;d=h&255;j=c[b+4>>2]|0;L1603:do{if((j|0)!=0){k=j-1|0;l=(k&j|0)!=0;if(l){m=(d>>>0)%(j>>>0)|0}else{m=k&d}n=c[(c[b>>2]|0)+(m<<2)>>2]|0;if((n|0)==0){break}if(l){l=n;while(1){o=c[l>>2]|0;if((o|0)==0){break L1603}if((((c[o+4>>2]|0)>>>0)%(j>>>0)|0|0)!=(m|0)){break L1603}if((a[o+8|0]|0)==h<<24>>24){p=o;break}else{l=o}}}else{l=n;while(1){o=c[l>>2]|0;if((o|0)==0){break L1603}if((c[o+4>>2]&k|0)!=(m|0)){break L1603}if((a[o+8|0]|0)==h<<24>>24){p=o;break}else{l=o}}}if((p|0)==0){break}else{q=p}r=q+8|0;s=r+4|0;t=s;i=e;return t|0}}while(0);p=n4(32)|0;m=p+8|0;if((m|0)!=0){a[m]=h}h=p+12|0;if((h|0)!=0){of(h|0,0,20)}ei(f,g,p);q=c[f>>2]|0;r=q+8|0;s=r+4|0;t=s;i=e;return t|0}function ei(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0,z=0,A=0,B=0;f=a[e+8|0]|0;h=f&255;i=e+4|0;c[i>>2]=h;j=d+4|0;k=c[j>>2]|0;l=(k|0)==0;L1631:do{if(l){m=0}else{n=k-1|0;o=(n&k|0)!=0;if(o){p=(h>>>0)%(k>>>0)|0}else{p=n&h}q=c[(c[d>>2]|0)+(p<<2)>>2]|0;if((q|0)==0){m=p;break}if(o){o=q;while(1){r=c[o>>2]|0;if((r|0)==0){m=p;break L1631}if((((c[r+4>>2]|0)>>>0)%(k>>>0)|0|0)!=(p|0)){m=p;break L1631}if((a[r+8|0]|0)==f<<24>>24){s=r;t=0;break}else{o=r}}u=b|0;c[u>>2]=s;v=b+4|0;a[v]=t;return}else{o=q;while(1){r=c[o>>2]|0;if((r|0)==0){m=p;break L1631}if((c[r+4>>2]&n|0)!=(p|0)){m=p;break L1631}if((a[r+8|0]|0)==f<<24>>24){s=r;t=0;break}else{o=r}}u=b|0;c[u>>2]=s;v=b+4|0;a[v]=t;return}}}while(0);f=d+12|0;w=+(((c[f>>2]|0)+1|0)>>>0>>>0);x=+g[d+16>>2];do{if(w>+(k>>>0>>>0)*x|l){if(k>>>0>2>>>0){y=(k-1&k|0)!=0|0}else{y=1}p=y|k<<1;h=~~+ah(w/x);ej(d,p>>>0<h>>>0?h:p);p=c[j>>2]|0;h=c[i>>2]|0;o=p-1|0;if((o&p|0)==0){z=h&o;A=p;break}else{z=(h>>>0)%(p>>>0)|0;A=p;break}}else{z=m;A=k}}while(0);k=d|0;m=c[(c[k>>2]|0)+(z<<2)>>2]|0;do{if((m|0)==0){i=d+8|0;j=i|0;y=e|0;c[y>>2]=c[j>>2];c[j>>2]=e;c[(c[k>>2]|0)+(z<<2)>>2]=i;i=c[y>>2]|0;if((i|0)==0){break}y=c[i+4>>2]|0;i=A-1|0;if((i&A|0)==0){B=y&i}else{B=(y>>>0)%(A>>>0)|0}c[(c[k>>2]|0)+(B<<2)>>2]=e}else{y=m|0;c[e>>2]=c[y>>2];c[y>>2]=e}}while(0);c[f>>2]=(c[f>>2]|0)+1;s=e;t=1;u=b|0;c[u>>2]=s;v=b+4|0;a[v]=t;return}function ej(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;do{if((b|0)==1){d=2}else{if((b-1&b|0)==0){d=b;break}d=gO(b)|0}}while(0);b=c[a+4>>2]|0;if(d>>>0>b>>>0){ek(a,d);return}if(d>>>0>=b>>>0){return}do{if(b>>>0>2>>>0){if((b-1&b|0)!=0){e=1553;break}f=1<<32-(oi(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2])-1|0)|0)}else{e=1553}}while(0);if((e|0)==1553){f=gO(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2]))|0}e=d>>>0<f>>>0?f:d;if(e>>>0>=b>>>0){return}ek(a,e);return}function ek(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=(d|0)!=0;if(e){f=n4(d<<2)|0}else{f=0}g=b|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)!=0){n6(h)}c[b+4>>2]=d;if(e){i=0}else{return}do{c[(c[g>>2]|0)+(i<<2)>>2]=0;i=i+1|0;}while(i>>>0<d>>>0);i=b+8|0;b=c[i>>2]|0;if((b|0)==0){return}e=c[b+4>>2]|0;h=d-1|0;f=(h&d|0)!=0;if(f){j=(e>>>0)%(d>>>0)|0}else{j=e&h}c[(c[g>>2]|0)+(j<<2)>>2]=i;i=b|0;e=c[i>>2]|0;if((e|0)==0){return}else{k=b;l=j;m=i;n=e}L1712:while(1){e=k;i=m;j=n;L1714:while(1){o=j;while(1){b=c[o+4>>2]|0;if(f){p=(b>>>0)%(d>>>0)|0}else{p=b&h}if((p|0)==(l|0)){break}q=(c[g>>2]|0)+(p<<2)|0;if((c[q>>2]|0)==0){break L1714}b=o+8|0;r=o;do{s=r|0;r=c[s>>2]|0;if((r|0)==0){break}}while((a[b]|0)==(a[r+8|0]|0));c[i>>2]=r;c[s>>2]=c[c[(c[g>>2]|0)+(p<<2)>>2]>>2];c[c[(c[g>>2]|0)+(p<<2)>>2]>>2]=o;b=c[i>>2]|0;if((b|0)==0){t=1588;break L1712}else{o=b}}b=o|0;u=c[b>>2]|0;if((u|0)==0){t=1589;break L1712}else{e=o;i=b;j=u}}c[q>>2]=e;j=o|0;i=c[j>>2]|0;if((i|0)==0){t=1590;break}else{k=o;l=p;m=j;n=i}}if((t|0)==1590){return}else if((t|0)==1588){return}else if((t|0)==1589){return}}function el(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=b+4|0;f=c[e>>2]|0;g=b|0;h=c[g>>2]|0;i=h;j=(f-i|0)/20|0;k=j+1|0;if(k>>>0>214748364>>>0){lw(0)}l=b+8|0;b=((c[l>>2]|0)-i|0)/20|0;if(b>>>0>107374181>>>0){m=214748364;n=1596}else{i=b<<1;b=i>>>0<k>>>0?k:i;if((b|0)==0){o=0;p=0}else{m=b;n=1596}}if((n|0)==1596){o=n4(m*20|0)|0;p=m}m=o+(j*20|0)|0;n=o+(p*20|0)|0;if((m|0)==0){q=h;r=f}else{a[m|0]=a[d|0]|0;c[o+(j*20|0)+4>>2]=c[d+4>>2];em(o+(j*20|0)+8|0,d+8|0);q=c[g>>2]|0;r=c[e>>2]|0}d=o+(k*20|0)|0;do{if((r|0)==(q|0)){c[g>>2]=m;c[e>>2]=d;c[l>>2]=n;s=r}else{k=j-1-(((r-20+(-q|0)|0)>>>0)/20|0)|0;f=r;h=m;while(1){p=f-20|0;b=h-20|0;if((b|0)!=0){a[b]=a[p|0]|0;c[b+4>>2]=c[f-20+4>>2];i=b+8|0;c[i>>2]=0;t=b+12|0;c[t>>2]=0;u=b+16|0;c[u>>2]=0;b=f-20+8|0;c[i>>2]=c[b>>2];i=f-20+12|0;c[t>>2]=c[i>>2];t=f-20+16|0;c[u>>2]=c[t>>2];c[t>>2]=0;c[i>>2]=0;c[b>>2]=0}if((p|0)==(q|0)){break}else{f=p;h=h-20|0}}h=c[g>>2]|0;f=c[e>>2]|0;c[g>>2]=o+(k*20|0);c[e>>2]=d;c[l>>2]=n;if((h|0)==(f|0)){s=h;break}else{v=f}while(1){f=v-20|0;p=c[v-20+8>>2]|0;b=p;if((p|0)!=0){i=v-20+12|0;t=c[i>>2]|0;if((p|0)!=(t|0)){c[i>>2]=t+(~((t-8+(-b|0)|0)>>>3)<<3)}n6(p)}if((h|0)==(f|0)){s=h;break}else{v=f}}}}while(0);if((s|0)==0){return}n6(s|0);return}function em(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;a=b+4|0;h=b|0;b=(c[a>>2]|0)-(c[h>>2]|0)|0;i=b>>3;if((i|0)==0){return}if(i>>>0>536870911>>>0){lw(0)}j=n4(b)|0;c[e>>2]=j;c[d>>2]=j;c[f>>2]=j+(i<<3);i=c[h>>2]|0;h=c[a>>2]|0;if((i|0)==(h|0)){return}else{k=i;l=j}do{if((l|0)==0){m=0}else{g[l>>2]=+g[k>>2];g[l+4>>2]=+g[k+4>>2];m=c[e>>2]|0}l=m+8|0;c[e>>2]=l;k=k+8|0;}while((k|0)!=(h|0));return}function en(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=b;f=d-e>>3;h=a+8|0;i=c[h>>2]|0;j=a|0;k=c[j>>2]|0;l=k;if(f>>>0>i-l>>3>>>0){if((k|0)==0){m=i}else{i=a+4|0;n=c[i>>2]|0;if((k|0)!=(n|0)){c[i>>2]=n+(~((n-8+(-l|0)|0)>>>3)<<3)}n6(k);c[h>>2]=0;c[i>>2]=0;c[j>>2]=0;m=0}if(f>>>0>536870911>>>0){lw(0)}i=m;do{if(i>>3>>>0>268435454>>>0){o=536870911}else{m=i>>2;n=m>>>0<f>>>0?f:m;if(n>>>0<=536870911>>>0){o=n;break}lw(0)}}while(0);i=n4(o<<3)|0;n=a+4|0;c[n>>2]=i;c[j>>2]=i;c[h>>2]=i+(o<<3);if((b|0)==(d|0)){return}else{p=b;q=i}do{if((q|0)==0){r=0}else{g[q>>2]=+g[p>>2];g[q+4>>2]=+g[p+4>>2];r=c[n>>2]|0}q=r+8|0;c[n>>2]=q;p=p+8|0;}while((p|0)!=(d|0));return}p=a+4|0;a=(c[p>>2]|0)-l>>3;if(f>>>0>a>>>0){s=1;t=b+(a<<3)|0}else{s=0;t=d}if((t|0)==(b|0)){u=k}else{a=((t-8+(-e|0)|0)>>>3)+1|0;e=k;f=b;while(1){g[e>>2]=+g[f>>2];g[e+4>>2]=+g[f+4>>2];b=f+8|0;if((b|0)==(t|0)){break}else{e=e+8|0;f=b}}u=k+(a<<3)|0}a=u;if(!s){s=c[p>>2]|0;if((u|0)==(s|0)){return}c[p>>2]=s+(~((s-8+(-a|0)|0)>>>3)<<3);return}if((t|0)==(d|0)){return}a=t;t=c[p>>2]|0;do{if((t|0)==0){v=0}else{g[t>>2]=+g[a>>2];g[t+4>>2]=+g[a+4>>2];v=c[p>>2]|0}t=v+8|0;c[p>>2]=t;a=a+8|0;}while((a|0)!=(d|0));return}function eo(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=a+4|0;e=c[d>>2]|0;f=a|0;h=c[f>>2]|0;i=h;j=e-i>>3;k=j+1|0;if(k>>>0>536870911>>>0){lw(0)}l=a+8|0;a=(c[l>>2]|0)-i|0;if(a>>3>>>0>268435454>>>0){m=536870911;n=1677}else{o=a>>2;a=o>>>0<k>>>0?k:o;if((a|0)==0){p=0;q=0}else{m=a;n=1677}}if((n|0)==1677){p=n4(m<<3)|0;q=m}m=p+(j<<3)|0;n=p+(q<<3)|0;if((m|0)!=0){g[m>>2]=+g[b>>2];g[p+(j<<3)+4>>2]=+g[b+4>>2]}b=p+(k<<3)|0;if((e|0)==(h|0)){r=e;s=m}else{k=j-1-((e-8+(-i|0)|0)>>>3)|0;i=e;e=m;while(1){m=e-8|0;j=i-8|0;if((m|0)!=0){g[m>>2]=+g[j>>2];g[e-8+4>>2]=+g[i-8+4>>2]}if((j|0)==(h|0)){break}else{i=j;e=m}}r=c[f>>2]|0;s=p+(k<<3)|0}c[f>>2]=s;c[d>>2]=b;c[l>>2]=n;if((r|0)==0){return}n6(r);return}function ep(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0.0,f=0.0,h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0;e=+g[c>>2];f=+_(e);h=+$(e);e=+g[d>>2];i=+g[d+4>>2];j=+g[d+8>>2];k=e*e+i*i+j*j;if(k>0.0){l=1.0/+Y(k);k=e*l;e=i*l;i=j*l;l=1.0-f;j=l*k;m=l*e;n=l*i;l=f+k*j;o=h*i;p=o+(e*j+0.0);q=h*e;r=i*j+0.0-q;j=k*m+0.0-o;o=f+e*m;s=h*k;h=s+(i*m+0.0);m=q+(k*n+0.0);k=e*n+0.0-s;s=f+i*n;of(a|0,0,60);n=+g[b>>2];i=+g[b+4>>2];f=+g[b+8>>2];e=+g[b+12>>2];q=+g[b+16>>2];t=+g[b+20>>2];u=+g[b+24>>2];v=+g[b+28>>2];w=+g[b+32>>2];x=+g[b+36>>2];y=+g[b+40>>2];z=+g[b+44>>2];g[a>>2]=n*l+p*q+r*w;g[a+4>>2]=i*l+p*t+r*x;g[a+8>>2]=l*f+p*u+r*y;g[a+12>>2]=l*e+p*v+r*z;g[a+16>>2]=j*n+o*q+h*w;g[a+20>>2]=j*i+o*t+h*x;g[a+24>>2]=j*f+o*u+h*y;g[a+28>>2]=j*e+o*v+h*z;g[a+32>>2]=m*n+k*q+s*w;g[a+36>>2]=m*i+k*t+s*x;g[a+40>>2]=m*f+k*u+s*y;g[a+44>>2]=m*e+k*v+s*z;g[a+48>>2]=+g[b+48>>2];g[a+52>>2]=+g[b+52>>2];g[a+56>>2]=+g[b+56>>2];g[a+60>>2]=+g[b+60>>2];return}else{cj(2664,2504,149,4744)}}function eq(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;g=f;h=a[f]|0;i=(h&1)==0;if(i){j=g+1|0}else{j=c[f+8>>2]|0}k=h&255;h=(k&1|0)==0;if(h){l=k>>>1}else{l=c[f+4>>2]|0}if(l>>>0>3>>>0){m=l;n=j;o=l;while(1){p=n;q=ai(d[p]|d[p+1|0]<<8|d[p+2|0]<<16|d[p+3|0]<<24|0,1540483477)|0;p=(ai(q>>>24^q,1540483477)|0)^(ai(m,1540483477)|0);q=n+4|0;r=o-4|0;if(r>>>0>3>>>0){m=p;n=q;o=r}else{s=p;t=q;u=r;break}}}else{s=l;t=j;u=l}if((u|0)==3){v=d[t+2|0]<<16^s;w=1704}else if((u|0)==2){v=s;w=1704}else if((u|0)==1){x=s;w=1705}else{y=s}if((w|0)==1704){x=d[t+1|0]<<8^v;w=1705}if((w|0)==1705){y=ai(d[t]^x,1540483477)|0}x=ai(y>>>13^y,1540483477)|0;y=x>>>15^x;x=c[e+4>>2]|0;L1885:do{if((x|0)!=0){t=x-1|0;w=(t&x|0)!=0;if(w){z=(y>>>0)%(x>>>0)|0}else{z=y&t}v=c[(c[e>>2]|0)+(z<<2)>>2]|0;if((v|0)==0){break}s=c[v>>2]|0;if((s|0)==0){break}v=g+1|0;u=f+8|0;l=f+4|0;L1893:do{if(w){j=s;while(1){if((((c[j+4>>2]|0)>>>0)%(x>>>0)|0|0)!=(z|0)){break L1885}o=j+8|0;n=o;m=a[o]|0;o=m&255;if((o&1|0)==0){A=o>>>1}else{A=c[j+12>>2]|0}if(h){B=k>>>1}else{B=c[l>>2]|0}L1932:do{if((A|0)==(B|0)){o=(m&1)==0;if(o){C=n+1|0}else{C=c[j+16>>2]|0}if(i){D=v}else{D=c[u>>2]|0}if(!o){if((oj(C|0,D|0,A|0)|0)==0){E=j;break L1893}else{break}}if((A|0)==0){E=j;break L1893}else{F=D;G=C;H=A}while(1){if((a[G]|0)!=(a[F]|0)){break L1932}o=H-1|0;if((o|0)==0){E=j;break L1893}else{F=F+1|0;G=G+1|0;H=o}}}}while(0);j=c[j>>2]|0;if((j|0)==0){break L1885}}}else{j=s;while(1){if((c[j+4>>2]&t|0)!=(z|0)){break L1885}n=j+8|0;m=n;o=a[n]|0;n=o&255;if((n&1|0)==0){I=n>>>1}else{I=c[j+12>>2]|0}if(h){J=k>>>1}else{J=c[l>>2]|0}L1905:do{if((I|0)==(J|0)){n=(o&1)==0;if(n){K=m+1|0}else{K=c[j+16>>2]|0}if(i){L=v}else{L=c[u>>2]|0}if(!n){if((oj(K|0,L|0,I|0)|0)==0){E=j;break L1893}else{break}}if((I|0)==0){E=j;break L1893}else{M=L;N=K;O=I}while(1){if((a[N]|0)!=(a[M]|0)){break L1905}n=O-1|0;if((n|0)==0){E=j;break L1893}else{M=M+1|0;N=N+1|0;O=n}}}}while(0);j=c[j>>2]|0;if((j|0)==0){break L1885}}}}while(0);c[b>>2]=E;return}}while(0);c[b>>2]=0;return}function er(b,e,f){b=b|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0.0,Q=0,R=0,S=0,T=0;h=f+8|0;i=h;j=a[h]|0;h=(j&1)==0;if(h){k=i+1|0}else{k=c[f+16>>2]|0}l=j&255;j=(l&1|0)==0;if(j){m=l>>>1}else{m=c[f+12>>2]|0}if(m>>>0>3>>>0){n=m;o=k;p=m;while(1){q=o;r=ai(d[q]|d[q+1|0]<<8|d[q+2|0]<<16|d[q+3|0]<<24|0,1540483477)|0;q=(ai(r>>>24^r,1540483477)|0)^(ai(n,1540483477)|0);r=o+4|0;s=p-4|0;if(s>>>0>3>>>0){n=q;o=r;p=s}else{t=q;u=r;v=s;break}}}else{t=m;u=k;v=m}if((v|0)==2){w=t;x=1766}else if((v|0)==3){w=d[u+2|0]<<16^t;x=1766}else if((v|0)==1){y=t;x=1767}else{z=t}if((x|0)==1766){y=d[u+1|0]<<8^w;x=1767}if((x|0)==1767){z=ai(d[u]^y,1540483477)|0}y=ai(z>>>13^z,1540483477)|0;z=y>>>15^y;y=f+4|0;c[y>>2]=z;u=e+4|0;w=c[u>>2]|0;t=(w|0)==0;L1972:do{if(t){A=0}else{v=w-1|0;m=(v&w|0)!=0;if(m){B=(z>>>0)%(w>>>0)|0}else{B=z&v}k=c[(c[e>>2]|0)+(B<<2)>>2]|0;if((k|0)==0){A=B;break}p=c[k>>2]|0;if((p|0)==0){A=B;break}k=i+1|0;o=f+16|0;n=f+12|0;s=p;L1980:while(1){p=c[s+4>>2]|0;if(m){C=(p>>>0)%(w>>>0)|0}else{C=p&v}if((C|0)!=(B|0)){A=B;break L1972}p=s+8|0;r=p;q=a[p]|0;p=q&255;if((p&1|0)==0){D=p>>>1}else{D=c[s+12>>2]|0}if(j){E=l>>>1}else{E=c[n>>2]|0}L1995:do{if((D|0)==(E|0)){p=(q&1)==0;if(p){F=r+1|0}else{F=c[s+16>>2]|0}if(h){G=k}else{G=c[o>>2]|0}if(!p){if((oj(F|0,G|0,D|0)|0)==0){H=s;I=0;x=1815;break L1980}else{break}}if((D|0)==0){H=s;I=0;x=1812;break L1980}else{J=G;K=F;L=D}while(1){if((a[K]|0)!=(a[J]|0)){break L1995}p=L-1|0;if((p|0)==0){H=s;I=0;x=1813;break L1980}else{J=J+1|0;K=K+1|0;L=p}}}}while(0);r=c[s>>2]|0;if((r|0)==0){A=B;break L1972}else{s=r}}if((x|0)==1812){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}else if((x|0)==1813){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}else if((x|0)==1815){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}}}while(0);x=e+12|0;O=+(((c[x>>2]|0)+1|0)>>>0>>>0);P=+g[e+16>>2];do{if(O>+(w>>>0>>>0)*P|t){if(w>>>0>2>>>0){Q=(w-1&w|0)!=0|0}else{Q=1}B=Q|w<<1;L=~~+ah(O/P);es(e,B>>>0<L>>>0?L:B);B=c[u>>2]|0;L=c[y>>2]|0;K=B-1|0;if((K&B|0)==0){R=L&K;S=B;break}else{R=(L>>>0)%(B>>>0)|0;S=B;break}}else{R=A;S=w}}while(0);w=e|0;A=c[(c[w>>2]|0)+(R<<2)>>2]|0;do{if((A|0)==0){y=e+8|0;u=y|0;Q=f|0;c[Q>>2]=c[u>>2];c[u>>2]=f;c[(c[w>>2]|0)+(R<<2)>>2]=y;y=c[Q>>2]|0;if((y|0)==0){break}Q=c[y+4>>2]|0;y=S-1|0;if((y&S|0)==0){T=Q&y}else{T=(Q>>>0)%(S>>>0)|0}c[(c[w>>2]|0)+(T<<2)>>2]=f}else{Q=A|0;c[f>>2]=c[Q>>2];c[Q>>2]=f}}while(0);c[x>>2]=(c[x>>2]|0)+1;H=f;I=1;M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}function es(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;do{if((b|0)==1){d=2}else{if((b-1&b|0)==0){d=b;break}d=gO(b)|0}}while(0);b=c[a+4>>2]|0;if(d>>>0>b>>>0){et(a,d);return}if(d>>>0>=b>>>0){return}do{if(b>>>0>2>>>0){if((b-1&b|0)!=0){e=1825;break}f=1<<32-(oi(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2])-1|0)|0)}else{e=1825}}while(0);if((e|0)==1825){f=gO(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2]))|0}e=d>>>0<f>>>0?f:d;if(e>>>0>=b>>>0){return}et(a,e);return}function et(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=(d|0)!=0;if(e){f=n4(d<<2)|0}else{f=0}g=b|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)!=0){n6(h)}c[b+4>>2]=d;if(e){i=0}else{return}do{c[(c[g>>2]|0)+(i<<2)>>2]=0;i=i+1|0;}while(i>>>0<d>>>0);i=b+8|0;b=c[i>>2]|0;if((b|0)==0){return}e=c[b+4>>2]|0;h=d-1|0;f=(h&d|0)!=0;if(f){j=(e>>>0)%(d>>>0)|0}else{j=e&h}c[(c[g>>2]|0)+(j<<2)>>2]=i;i=b|0;e=c[i>>2]|0;if((e|0)==0){return}else{k=b;l=j;m=i;n=e}L2078:while(1){e=k;i=m;j=n;L2080:while(1){o=j;while(1){b=c[o+4>>2]|0;if(f){p=(b>>>0)%(d>>>0)|0}else{p=b&h}if((p|0)==(l|0)){break}q=(c[g>>2]|0)+(p<<2)|0;if((c[q>>2]|0)==0){break L2080}b=o|0;r=c[b>>2]|0;L2090:do{if((r|0)==0){s=b;t=0}else{u=o+8|0;v=a[u]|0;w=v&255;x=(w&1|0)==0;y=w>>>1;w=u+1|0;u=o+16|0;z=o+12|0;A=b;B=r;while(1){if(x){C=y}else{C=c[z>>2]|0}D=B+8|0;E=a[D]|0;F=E&255;if((F&1|0)==0){G=F>>>1}else{G=c[B+12>>2]|0}if((C|0)!=(G|0)){s=A;t=B;break L2090}F=(v&1)==0;if(F){H=w}else{H=c[u>>2]|0}if((E&1)==0){I=D+1|0}else{I=c[B+16>>2]|0}do{if(F){if((C|0)==0){break}else{J=I;K=H;L=C}while(1){if((a[K]|0)!=(a[J]|0)){s=A;t=B;break L2090}D=L-1|0;if((D|0)==0){break}else{J=J+1|0;K=K+1|0;L=D}}}else{if((oj(H|0,I|0,C|0)|0)!=0){s=A;t=B;break L2090}}}while(0);F=B|0;D=c[F>>2]|0;if((D|0)==0){s=F;t=0;break}else{A=F;B=D}}}}while(0);c[i>>2]=t;c[s>>2]=c[c[(c[g>>2]|0)+(p<<2)>>2]>>2];c[c[(c[g>>2]|0)+(p<<2)>>2]>>2]=o;r=c[i>>2]|0;if((r|0)==0){M=1877;break L2078}else{o=r}}r=o|0;b=c[r>>2]|0;if((b|0)==0){M=1878;break L2078}else{e=o;i=r;j=b}}c[q>>2]=e;j=o|0;i=c[j>>2]|0;if((i|0)==0){M=1876;break}else{k=o;l=p;m=j;n=i}}if((M|0)==1876){return}else if((M|0)==1877){return}else if((M|0)==1878){return}}function eu(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;g=f;h=a[f]|0;i=(h&1)==0;if(i){j=g+1|0}else{j=c[f+8>>2]|0}k=h&255;h=(k&1|0)==0;if(h){l=k>>>1}else{l=c[f+4>>2]|0}if(l>>>0>3>>>0){m=l;n=j;o=l;while(1){p=n;q=ai(d[p]|d[p+1|0]<<8|d[p+2|0]<<16|d[p+3|0]<<24|0,1540483477)|0;p=(ai(q>>>24^q,1540483477)|0)^(ai(m,1540483477)|0);q=n+4|0;r=o-4|0;if(r>>>0>3>>>0){m=p;n=q;o=r}else{s=p;t=q;u=r;break}}}else{s=l;t=j;u=l}if((u|0)==3){v=d[t+2|0]<<16^s;w=1890}else if((u|0)==2){v=s;w=1890}else if((u|0)==1){x=s;w=1891}else{y=s}if((w|0)==1890){x=d[t+1|0]<<8^v;w=1891}if((w|0)==1891){y=ai(d[t]^x,1540483477)|0}x=ai(y>>>13^y,1540483477)|0;y=x>>>15^x;x=c[e+4>>2]|0;L2143:do{if((x|0)!=0){t=x-1|0;w=(t&x|0)!=0;if(w){z=(y>>>0)%(x>>>0)|0}else{z=y&t}v=c[(c[e>>2]|0)+(z<<2)>>2]|0;if((v|0)==0){break}s=c[v>>2]|0;if((s|0)==0){break}v=g+1|0;u=f+8|0;l=f+4|0;j=s;L2151:while(1){s=c[j+4>>2]|0;if(w){A=(s>>>0)%(x>>>0)|0}else{A=s&t}if((A|0)!=(z|0)){break L2143}s=j+8|0;o=s;n=a[s]|0;s=n&255;if((s&1|0)==0){B=s>>>1}else{B=c[j+12>>2]|0}if(h){C=k>>>1}else{C=c[l>>2]|0}L2166:do{if((B|0)==(C|0)){s=(n&1)==0;if(s){D=o+1|0}else{D=c[j+16>>2]|0}if(i){E=v}else{E=c[u>>2]|0}if(!s){if((oj(D|0,E|0,B|0)|0)==0){break L2151}else{break}}if((B|0)==0){break L2151}else{F=E;G=D;H=B}while(1){if((a[G]|0)!=(a[F]|0)){break L2166}s=H-1|0;if((s|0)==0){break L2151}else{F=F+1|0;G=G+1|0;H=s}}}}while(0);o=c[j>>2]|0;if((o|0)==0){break L2143}else{j=o}}c[b>>2]=j;return}}while(0);c[b>>2]=0;return}function ev(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0;d=i;i=i+8|0;e=d|0;f=b+116|0;g=c[f>>2]|0;if((g|0)==0){i=d;return}j=b+100|0;k=b+112|0;l=b+4|0;m=b|0;n=b+12|0;o=n;p=b+16|0;q=n|0;n=e|0;r=e+4|0;s=b+56|0;b=1;t=g;while(1){g=c[j>>2]|0;u=c[k>>2]|0;v=c[(c[g+(u>>>10<<2)>>2]|0)+((u&1023)<<2)>>2]|0;c[f>>2]=t-1;w=u+1|0;c[k>>2]=w;if(w>>>0>2047>>>0){n6(c[g>>2]|0);c[j>>2]=(c[j>>2]|0)+4;c[k>>2]=(c[k>>2]|0)-1024}g=c[l>>2]|0;do{if((g|0)!=0){if((v|0)==1){w=c[m>>2]|0;u=c[g+24>>2]|0;x=c[g+8>>2]|0;y=c[g+4>>2]|0;z=(u>>>0)%(((x-y|0)/12|0)>>>0)|0;A=c[y+(z*12|0)>>2]|0;B=c[y+(z*12|0)+4>>2]|0;z=w+8|0;C=c[g+16>>2]|0;L2199:do{if((A|0)==(B|0)){D=1957}else{E=c[g+20>>2]|0;F=c[w+4>>2]|0;G=w|0;H=C+1|0;I=A;while(1){J=(c[I+4>>2]|0)+E|0;K=H+(c[I>>2]|0)|0;if((J|0)<(F|0)){if((K|0)<0){L=w;M=u;N=x;O=y;P=C;Q=E;R=F;break L2199}if((K|0)>=(c[G>>2]|0)|(J|0)<0){L=w;M=u;N=x;O=y;P=C;Q=E;R=F;break L2199}if((a[(c[(c[z>>2]|0)+(K*12|0)>>2]|0)+J|0]|0)!=0){L=w;M=u;N=x;O=y;P=C;Q=E;R=F;break L2199}}J=I+8|0;if((J|0)==(B|0)){D=1957;break}else{I=J}}}}while(0);if((D|0)==1957){D=0;c[g+16>>2]=C+1;B=c[m>>2]|0;y=c[l>>2]|0;L=B;M=c[y+24>>2]|0;N=c[y+8>>2]|0;O=c[y+4>>2]|0;P=c[y+16>>2]|0;Q=c[y+20>>2]|0;R=c[B+4>>2]|0}B=(M>>>0)%(((N-O|0)/12|0)>>>0)|0;y=c[O+(B*12|0)>>2]|0;x=c[O+(B*12|0)+4>>2]|0;B=L+8|0;u=(y|0)==(x|0);w=L|0;z=0;L2211:while(1){if(!u){S=z+Q|0;A=y;do{I=(c[A>>2]|0)+P|0;F=(c[A+4>>2]|0)+S|0;if((F|0)<(R|0)){if((I|0)<0){break L2211}if((I|0)>=(c[w>>2]|0)|(F|0)<0){break L2211}if((a[(c[(c[B>>2]|0)+(I*12|0)>>2]|0)+F|0]|0)!=0){break L2211}}A=A+8|0;}while((A|0)!=(x|0))}z=z-1|0}c[o>>2]=P;c[o+4>>2]=S;c[p>>2]=S+1;break}else if((v|0)==3){if((c[q>>2]|0)==(c[g+16>>2]|0)){if((c[p>>2]|0)==(c[g+20>>2]|0)){break}}z=g+16|0;x=c[o+4>>2]|0;c[z>>2]=c[o>>2];c[z+4>>2]=x;b3(e|0,0)|0;h[s>>3]=+(c[n>>2]|0)+ +(c[r>>2]|0)*1.0e-6;break}else if((v|0)==0){x=c[m>>2]|0;z=c[g+24>>2]|0;B=c[g+8>>2]|0;w=c[g+4>>2]|0;y=(z>>>0)%(((B-w|0)/12|0)>>>0)|0;u=c[w+(y*12|0)>>2]|0;C=c[w+(y*12|0)+4>>2]|0;y=x+8|0;A=c[g+16>>2]|0;L2229:do{if((u|0)==(C|0)){D=1939}else{F=c[g+20>>2]|0;I=c[x+4>>2]|0;E=x|0;G=A-1|0;H=u;while(1){J=(c[H+4>>2]|0)+F|0;K=G+(c[H>>2]|0)|0;if((J|0)<(I|0)){if((K|0)<0){T=x;U=z;V=B;W=w;X=A;Y=F;Z=I;break L2229}if((K|0)>=(c[E>>2]|0)|(J|0)<0){T=x;U=z;V=B;W=w;X=A;Y=F;Z=I;break L2229}if((a[(c[(c[y>>2]|0)+(K*12|0)>>2]|0)+J|0]|0)!=0){T=x;U=z;V=B;W=w;X=A;Y=F;Z=I;break L2229}}J=H+8|0;if((J|0)==(C|0)){D=1939;break}else{H=J}}}}while(0);if((D|0)==1939){D=0;c[g+16>>2]=A-1;C=c[m>>2]|0;w=c[l>>2]|0;T=C;U=c[w+24>>2]|0;V=c[w+8>>2]|0;W=c[w+4>>2]|0;X=c[w+16>>2]|0;Y=c[w+20>>2]|0;Z=c[C+4>>2]|0}C=(U>>>0)%(((V-W|0)/12|0)>>>0)|0;w=c[W+(C*12|0)>>2]|0;B=c[W+(C*12|0)+4>>2]|0;C=T+8|0;z=(w|0)==(B|0);x=T|0;y=0;L2241:while(1){if(!z){_=y+Y|0;u=w;do{H=(c[u>>2]|0)+X|0;I=(c[u+4>>2]|0)+_|0;if((I|0)<(Z|0)){if((H|0)<0){break L2241}if((H|0)>=(c[x>>2]|0)|(I|0)<0){break L2241}if((a[(c[(c[C>>2]|0)+(H*12|0)>>2]|0)+I|0]|0)!=0){break L2241}}u=u+8|0;}while((u|0)!=(B|0))}y=y-1|0}c[o>>2]=X;c[o+4>>2]=_;c[p>>2]=_+1;break}else if((v|0)==2){y=c[m>>2]|0;B=g+24|0;C=c[B>>2]|0;x=c[g+8>>2]|0;w=c[g+4>>2]|0;z=((C+1|0)>>>0)%(((x-w|0)/12|0)>>>0)|0;A=c[w+(z*12|0)>>2]|0;u=c[w+(z*12|0)+4>>2]|0;I=y+8|0;L2255:do{if((A|0)==(u|0)){D=1975}else{H=c[g+16>>2]|0;F=c[g+20>>2]|0;E=c[y+4>>2]|0;G=y|0;J=A;while(1){K=(c[J>>2]|0)+H|0;$=(c[J+4>>2]|0)+F|0;if(($|0)<(E|0)){if((K|0)<0){aa=y;ab=C;ac=x;ad=w;ae=H;af=F;ag=E;break L2255}if((K|0)>=(c[G>>2]|0)|($|0)<0){aa=y;ab=C;ac=x;ad=w;ae=H;af=F;ag=E;break L2255}if((a[(c[(c[I>>2]|0)+(K*12|0)>>2]|0)+$|0]|0)!=0){aa=y;ab=C;ac=x;ad=w;ae=H;af=F;ag=E;break L2255}}$=J+8|0;if(($|0)==(u|0)){D=1975;break}else{J=$}}}}while(0);if((D|0)==1975){D=0;c[B>>2]=z;u=c[m>>2]|0;w=c[l>>2]|0;aa=u;ab=c[w+24>>2]|0;ac=c[w+8>>2]|0;ad=c[w+4>>2]|0;ae=c[w+16>>2]|0;af=c[w+20>>2]|0;ag=c[u+4>>2]|0}u=(ab>>>0)%(((ac-ad|0)/12|0)>>>0)|0;w=c[ad+(u*12|0)>>2]|0;x=c[ad+(u*12|0)+4>>2]|0;u=aa+8|0;C=(w|0)==(x|0);y=aa|0;I=0;L2267:while(1){if(!C){ah=I+af|0;A=w;do{J=(c[A>>2]|0)+ae|0;E=(c[A+4>>2]|0)+ah|0;if((E|0)<(ag|0)){if((J|0)<0){break L2267}if((J|0)>=(c[y>>2]|0)|(E|0)<0){break L2267}if((a[(c[(c[u>>2]|0)+(J*12|0)>>2]|0)+E|0]|0)!=0){break L2267}}A=A+8|0;}while((A|0)!=(x|0))}I=I-1|0}c[o>>2]=ae;c[o+4>>2]=ah;c[p>>2]=ah+1;break}else{break}}}while(0);g=c[f>>2]|0;if(b>>>0>=g>>>0){break}b=b+1|0;t=g}i=d;return}function ew(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;d=b+4|0;e=c[d>>2]|0;if((e|0)<=0){f=0;return f|0}g=b|0;h=b+8|0;i=0;j=0;k=0;l=e;L2287:while(1){e=j;m=l;while(1){n=c[g>>2]|0;o=m;L2291:while(1){p=o-1|0;q=0;while(1){if((q|0)>=(n|0)){break L2291}if((a[(c[(c[h>>2]|0)+(q*12|0)>>2]|0)+p|0]|0)==0){break}else{q=q+1|0}}if((p|0)>0){o=p}else{r=e;s=k;break L2287}}if((e|0)==(i|0)){break}if((e|0)!=0){c[e>>2]=p}o=e+4|0;if((p|0)>0){e=o;m=p}else{r=o;s=k;break L2287}}m=i-k|0;e=m>>2;o=e+1|0;if(o>>>0>1073741823>>>0){t=2014;break}if(e>>>0>536870910>>>0){u=1073741823;t=2018}else{n=m>>1;q=n>>>0<o>>>0?o:n;if((q|0)==0){v=0;w=0}else{u=q;t=2018}}if((t|0)==2018){t=0;v=n4(u<<2)|0;w=u}q=v+(e<<2)|0;e=v+(w<<2)|0;if((q|0)!=0){c[q>>2]=p}q=v+(o<<2)|0;o=v;n=k;oe(o|0,n|0,m)|0;if((k|0)!=0){n6(n)}if((p|0)>0){i=e;j=q;k=v;l=p}else{r=q;s=v;break}}if((t|0)==2014){lw(0);return 0}if((s|0)!=(r|0)){t=b|0;v=b+8|0;b=s;do{p=c[b>>2]|0;l=c[d>>2]|0;k=c[t>>2]|0;if((p|0)<(l-1|0)){j=p;p=k;i=l;while(1){w=j+1|0;if((p|0)>0){u=0;do{h=c[(c[v>>2]|0)+(u*12|0)>>2]|0;a[h+j|0]=a[h+w|0]|0;u=u+1|0;x=c[t>>2]|0;}while((u|0)<(x|0));y=x;z=c[d>>2]|0}else{y=p;z=i}if((w|0)<(z-1|0)){j=w;p=y;i=z}else{A=y;B=z;break}}}else{A=k;B=l}L2333:do{if((A|0)>0){i=0;p=B;while(1){a[(c[(c[v>>2]|0)+(i*12|0)>>2]|0)+(p-1)|0]=0;j=i+1|0;if((j|0)>=(c[t>>2]|0)){break L2333}i=j;p=c[d>>2]|0}}}while(0);b=b+4|0;}while((b|0)!=(r|0))}b=r-s>>2;if((s|0)==0){f=b;return f|0}n6(s);f=b;return f|0}function ex(a){a=a|0;return}function ey(a){a=a|0;n6(a);return}function ez(a){a=a|0;return 2256}function eA(){var b=0,d=0;do{if((a[21960]|0)==0){if((bx(21960)|0)==0){break}c[4426]=5489;b=1;d=5489;do{d=(ai(d>>>30^d,1812433253)|0)+b|0;c[17704+(b<<2)>>2]=d;b=b+1|0;}while(b>>>0<624>>>0);c[5050]=0}}while(0);do{if((a[21968]|0)==0){if((bx(21968)|0)==0){break}a[20208]=1;a[20209]=7}}while(0);return eB(0,17704,20208)|0}function eB(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a[f+1|0]|0;g=f|0;f=a[g]|0;h=(b&255)-(f&255)+1|0;if(b<<24>>24==f<<24>>24){i=b;return i|0}if((h|0)==0){b=e+2496|0;f=c[b>>2]|0;j=((f+1|0)>>>0)%624|0;k=e+(f<<2)|0;l=c[e+(j<<2)>>2]|0;c[k>>2]=-(l&1)&-1727483681^c[e+((((f+397|0)>>>0)%624|0)<<2)>>2]^(l&2147483646|c[k>>2]&-2147483648)>>>1;k=c[e+(c[b>>2]<<2)>>2]|0;l=k>>>11^k;c[b>>2]=j;j=l<<7&-1658038656^l;l=j<<15&-272236544^j;i=(l>>>18^l)&255;return i|0}l=32-(oi(h|0)|0)|0;j=(((-1>>>((33-l|0)>>>0)&h|0)==0)<<31>>31)+l|0;l=(j>>>0)/((((j&31|0)!=0)+(j>>>5)|0)>>>0)|0;if((l|0)==0){m=0}else{m=-1>>>((32-l|0)>>>0)}l=e+2496|0;j=c[l>>2]|0;while(1){b=((j+1|0)>>>0)%624|0;k=e+(j<<2)|0;f=c[e+(b<<2)>>2]|0;c[k>>2]=-(f&1)&-1727483681^c[e+((((j+397|0)>>>0)%624|0)<<2)>>2]^(f&2147483646|c[k>>2]&-2147483648)>>>1;k=c[e+(c[l>>2]<<2)>>2]|0;f=k>>>11^k;c[l>>2]=b;k=f<<7&-1658038656^f;f=k<<15&-272236544^k;n=(f>>>18^f)&m;if(n>>>0<h>>>0){break}else{j=b}}i=(d[g]|0)+n&255;return i|0}function eC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0,cQ=0,cR=0,cS=0,cT=0,cU=0,cV=0,cW=0;d=i;i=i+64|0;e=d|0;f=d+16|0;g=d+32|0;h=g|0;j=g;k=i;i=i+12|0;i=i+7&-8;l=i;i=i+32|0;m=l|0;n=l;o=i;i=i+12|0;i=i+7&-8;p=i;i=i+32|0;q=p|0;r=p;s=i;i=i+12|0;i=i+7&-8;t=i;i=i+32|0;u=t|0;v=t;w=i;i=i+12|0;i=i+7&-8;x=i;i=i+32|0;y=x|0;z=x;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+32|0;C=B|0;D=B;E=i;i=i+12|0;i=i+7&-8;F=i;i=i+32|0;G=F|0;H=F;I=i;i=i+12|0;i=i+7&-8;J=i;i=i+32|0;K=J|0;L=J;M=i;i=i+12|0;i=i+7&-8;N=i;i=i+32|0;O=N|0;P=N;Q=i;i=i+12|0;i=i+7&-8;R=i;i=i+32|0;S=R|0;T=R;U=i;i=i+12|0;i=i+7&-8;V=i;i=i+32|0;W=V|0;X=V;Y=i;i=i+12|0;i=i+7&-8;Z=i;i=i+32|0;_=Z|0;$=Z;aa=i;i=i+12|0;i=i+7&-8;ab=i;i=i+32|0;ac=ab|0;ad=ab;ae=i;i=i+12|0;i=i+7&-8;af=i;i=i+32|0;ag=af|0;ah=af;ai=i;i=i+12|0;i=i+7&-8;aj=i;i=i+32|0;ak=aj|0;al=aj;am=i;i=i+12|0;i=i+7&-8;an=i;i=i+32|0;ao=an|0;ap=an;aq=i;i=i+12|0;i=i+7&-8;ar=i;i=i+32|0;as=ar|0;at=ar;au=i;i=i+12|0;i=i+7&-8;av=i;i=i+32|0;aw=av|0;ax=av;ay=i;i=i+12|0;i=i+7&-8;az=i;i=i+32|0;aA=az|0;aB=az;aC=e|0;c[aC>>2]=0;aD=e+4|0;c[aD>>2]=0;aE=e+8|0;c[aE>>2]=0;switch(b&255|0){case 5:{c[J>>2]=-1;c[L+4>>2]=0;c[J+8>>2]=0;c[L+12>>2]=0;c[J+16>>2]=1;c[L+20>>2]=0;c[J+24>>2]=1;c[L+28>>2]=-1;L=I|0;c[L>>2]=0;b=I+4|0;c[b>>2]=0;aF=I+8|0;c[aF>>2]=0;aG=n4(32)|0;aH=aG;c[b>>2]=aH;c[L>>2]=aH;aI=aG+32|0;c[aF>>2]=aI;if((aG|0)==0){aJ=0}else{aK=aG;aG=c[K+4>>2]|0;c[aK>>2]=c[K>>2];c[aK+4>>2]=aG;aJ=aH}aG=aJ+8|0;c[b>>2]=aG;if((aG|0)==0){aL=0}else{aJ=J+8|0;aK=aG;K=c[aJ+4>>2]|0;c[aK>>2]=c[aJ>>2];c[aK+4>>2]=K;aL=aG}aG=aL+8|0;c[b>>2]=aG;if((aG|0)==0){aM=0}else{aL=J+16|0;K=aG;aK=c[aL+4>>2]|0;c[K>>2]=c[aL>>2];c[K+4>>2]=aK;aM=aG}aG=aM+8|0;c[b>>2]=aG;if((aG|0)==0){aN=0}else{aM=J+24|0;J=aG;aK=c[aM+4>>2]|0;c[J>>2]=c[aM>>2];c[J+4>>2]=aK;aN=aG}aG=aN+8|0;c[b>>2]=aG;aN=c[aD>>2]|0;if(aN>>>0<(c[aE>>2]|0)>>>0){if((aN|0)==0){aO=0;aP=aH}else{c[aN>>2]=aH;c[aN+4>>2]=aG;c[aN+8>>2]=aI;c[aF>>2]=0;c[b>>2]=0;c[L>>2]=0;aO=c[aD>>2]|0;aP=0}c[aD>>2]=aO+12;aQ=aP}else{eD(e,I);aQ=c[L>>2]|0}L=aQ;if((aQ|0)!=0){I=c[b>>2]|0;if((aQ|0)!=(I|0)){c[b>>2]=I+(~((I-8+(-L|0)|0)>>>3)<<3)}n6(aQ)}c[N>>2]=0;c[P+4>>2]=-1;c[N+8>>2]=0;c[P+12>>2]=0;c[N+16>>2]=0;c[P+20>>2]=1;c[N+24>>2]=1;c[P+28>>2]=1;P=M|0;c[P>>2]=0;aQ=M+4|0;c[aQ>>2]=0;L=M+8|0;c[L>>2]=0;I=n4(32)|0;b=I;c[aQ>>2]=b;c[P>>2]=b;aP=I+32|0;c[L>>2]=aP;if((I|0)==0){aR=0}else{aO=I;I=c[O+4>>2]|0;c[aO>>2]=c[O>>2];c[aO+4>>2]=I;aR=b}I=aR+8|0;c[aQ>>2]=I;if((I|0)==0){aS=0}else{aR=N+8|0;aO=I;O=c[aR+4>>2]|0;c[aO>>2]=c[aR>>2];c[aO+4>>2]=O;aS=I}I=aS+8|0;c[aQ>>2]=I;if((I|0)==0){aT=0}else{aS=N+16|0;O=I;aO=c[aS+4>>2]|0;c[O>>2]=c[aS>>2];c[O+4>>2]=aO;aT=I}I=aT+8|0;c[aQ>>2]=I;if((I|0)==0){aU=0}else{aT=N+24|0;N=I;aO=c[aT+4>>2]|0;c[N>>2]=c[aT>>2];c[N+4>>2]=aO;aU=I}I=aU+8|0;c[aQ>>2]=I;aU=c[aD>>2]|0;if(aU>>>0<(c[aE>>2]|0)>>>0){if((aU|0)==0){aV=0;aW=b}else{c[aU>>2]=b;c[aU+4>>2]=I;c[aU+8>>2]=aP;c[L>>2]=0;c[aQ>>2]=0;c[P>>2]=0;aV=c[aD>>2]|0;aW=0}c[aD>>2]=aV+12;aX=aW}else{eD(e,M);aX=c[P>>2]|0}P=aX;if((aX|0)!=0){M=c[aQ>>2]|0;if((aX|0)!=(M|0)){c[aQ>>2]=M+(~((M-8+(-P|0)|0)>>>3)<<3)}n6(aX)}c[R>>2]=-1;c[T+4>>2]=-1;c[R+8>>2]=0;c[T+12>>2]=-1;c[R+16>>2]=1;c[T+20>>2]=-1;c[R+24>>2]=-1;c[T+28>>2]=0;T=Q|0;c[T>>2]=0;aX=Q+4|0;c[aX>>2]=0;P=Q+8|0;c[P>>2]=0;M=n4(32)|0;aQ=M;c[aX>>2]=aQ;c[T>>2]=aQ;aW=M+32|0;c[P>>2]=aW;if((M|0)==0){aY=0}else{aV=M;M=c[S+4>>2]|0;c[aV>>2]=c[S>>2];c[aV+4>>2]=M;aY=aQ}M=aY+8|0;c[aX>>2]=M;if((M|0)==0){aZ=0}else{aY=R+8|0;aV=M;S=c[aY+4>>2]|0;c[aV>>2]=c[aY>>2];c[aV+4>>2]=S;aZ=M}M=aZ+8|0;c[aX>>2]=M;if((M|0)==0){a_=0}else{aZ=R+16|0;S=M;aV=c[aZ+4>>2]|0;c[S>>2]=c[aZ>>2];c[S+4>>2]=aV;a_=M}M=a_+8|0;c[aX>>2]=M;if((M|0)==0){a$=0}else{a_=R+24|0;R=M;aV=c[a_+4>>2]|0;c[R>>2]=c[a_>>2];c[R+4>>2]=aV;a$=M}M=a$+8|0;c[aX>>2]=M;a$=c[aD>>2]|0;if(a$>>>0<(c[aE>>2]|0)>>>0){if((a$|0)==0){a0=0;a1=aQ}else{c[a$>>2]=aQ;c[a$+4>>2]=M;c[a$+8>>2]=aW;c[P>>2]=0;c[aX>>2]=0;c[T>>2]=0;a0=c[aD>>2]|0;a1=0}c[aD>>2]=a0+12;a2=a1}else{eD(e,Q);a2=c[T>>2]|0}T=a2;if((a2|0)!=0){Q=c[aX>>2]|0;if((a2|0)!=(Q|0)){c[aX>>2]=Q+(~((Q-8+(-T|0)|0)>>>3)<<3)}n6(a2)}c[V>>2]=0;c[X+4>>2]=-1;c[V+8>>2]=0;c[X+12>>2]=0;c[V+16>>2]=0;c[X+20>>2]=1;c[V+24>>2]=-1;c[X+28>>2]=-1;X=U|0;c[X>>2]=0;a2=U+4|0;c[a2>>2]=0;T=U+8|0;c[T>>2]=0;Q=n4(32)|0;aX=Q;c[a2>>2]=aX;c[X>>2]=aX;a1=Q+32|0;c[T>>2]=a1;if((Q|0)==0){a3=0}else{a0=Q;Q=c[W+4>>2]|0;c[a0>>2]=c[W>>2];c[a0+4>>2]=Q;a3=aX}Q=a3+8|0;c[a2>>2]=Q;if((Q|0)==0){a4=0}else{a3=V+8|0;a0=Q;W=c[a3+4>>2]|0;c[a0>>2]=c[a3>>2];c[a0+4>>2]=W;a4=Q}Q=a4+8|0;c[a2>>2]=Q;if((Q|0)==0){a5=0}else{a4=V+16|0;W=Q;a0=c[a4+4>>2]|0;c[W>>2]=c[a4>>2];c[W+4>>2]=a0;a5=Q}Q=a5+8|0;c[a2>>2]=Q;if((Q|0)==0){a6=0}else{a5=V+24|0;V=Q;a0=c[a5+4>>2]|0;c[V>>2]=c[a5>>2];c[V+4>>2]=a0;a6=Q}Q=a6+8|0;c[a2>>2]=Q;a6=c[aD>>2]|0;if(a6>>>0<(c[aE>>2]|0)>>>0){if((a6|0)==0){a7=0;a8=aX}else{c[a6>>2]=aX;c[a6+4>>2]=Q;c[a6+8>>2]=a1;c[T>>2]=0;c[a2>>2]=0;c[X>>2]=0;a7=c[aD>>2]|0;a8=0}c[aD>>2]=a7+12;a9=a8}else{eD(e,U);a9=c[X>>2]|0}if((a9|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}X=c[a2>>2]|0;if((a9|0)!=(X|0)){c[a2>>2]=X+(~((X-8+(-a9|0)|0)>>>3)<<3)}n6(a9);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 3:{c[t>>2]=0;c[v+4>>2]=0;c[t+8>>2]=1;c[v+12>>2]=0;c[t+16>>2]=-1;c[v+20>>2]=-1;c[t+24>>2]=0;c[v+28>>2]=-1;v=s|0;c[v>>2]=0;a9=s+4|0;c[a9>>2]=0;X=s+8|0;c[X>>2]=0;a2=n4(32)|0;U=a2;c[a9>>2]=U;c[v>>2]=U;a8=a2+32|0;c[X>>2]=a8;if((a2|0)==0){bg=0}else{a7=a2;a2=c[u+4>>2]|0;c[a7>>2]=c[u>>2];c[a7+4>>2]=a2;bg=U}a2=bg+8|0;c[a9>>2]=a2;if((a2|0)==0){bh=0}else{bg=t+8|0;a7=a2;u=c[bg+4>>2]|0;c[a7>>2]=c[bg>>2];c[a7+4>>2]=u;bh=a2}a2=bh+8|0;c[a9>>2]=a2;if((a2|0)==0){bi=0}else{bh=t+16|0;u=a2;a7=c[bh+4>>2]|0;c[u>>2]=c[bh>>2];c[u+4>>2]=a7;bi=a2}a2=bi+8|0;c[a9>>2]=a2;if((a2|0)==0){bj=0}else{bi=t+24|0;t=a2;a7=c[bi+4>>2]|0;c[t>>2]=c[bi>>2];c[t+4>>2]=a7;bj=a2}a2=bj+8|0;c[a9>>2]=a2;bj=c[aD>>2]|0;if(bj>>>0<(c[aE>>2]|0)>>>0){if((bj|0)==0){bk=0;bl=U}else{c[bj>>2]=U;c[bj+4>>2]=a2;c[bj+8>>2]=a8;c[X>>2]=0;c[a9>>2]=0;c[v>>2]=0;bk=c[aD>>2]|0;bl=0}c[aD>>2]=bk+12;bm=bl}else{eD(e,s);bm=c[v>>2]|0}v=bm;if((bm|0)!=0){s=c[a9>>2]|0;if((bm|0)!=(s|0)){c[a9>>2]=s+(~((s-8+(-v|0)|0)>>>3)<<3)}n6(bm)}c[x>>2]=-1;c[z+4>>2]=1;c[x+8>>2]=-1;of(z+12|0,0,16);c[z+28>>2]=-1;z=w|0;c[z>>2]=0;bm=w+4|0;c[bm>>2]=0;v=w+8|0;c[v>>2]=0;s=n4(32)|0;a9=s;c[bm>>2]=a9;c[z>>2]=a9;bl=s+32|0;c[v>>2]=bl;if((s|0)==0){bn=0}else{bk=s;s=c[y+4>>2]|0;c[bk>>2]=c[y>>2];c[bk+4>>2]=s;bn=a9}s=bn+8|0;c[bm>>2]=s;if((s|0)==0){bo=0}else{bn=x+8|0;bk=s;y=c[bn+4>>2]|0;c[bk>>2]=c[bn>>2];c[bk+4>>2]=y;bo=s}s=bo+8|0;c[bm>>2]=s;if((s|0)==0){bp=0}else{bo=x+16|0;y=s;bk=c[bo+4>>2]|0;c[y>>2]=c[bo>>2];c[y+4>>2]=bk;bp=s}s=bp+8|0;c[bm>>2]=s;if((s|0)==0){bq=0}else{bp=x+24|0;x=s;bk=c[bp+4>>2]|0;c[x>>2]=c[bp>>2];c[x+4>>2]=bk;bq=s}s=bq+8|0;c[bm>>2]=s;bq=c[aD>>2]|0;if(bq>>>0<(c[aE>>2]|0)>>>0){if((bq|0)==0){br=0;bs=a9}else{c[bq>>2]=a9;c[bq+4>>2]=s;c[bq+8>>2]=bl;c[v>>2]=0;c[bm>>2]=0;c[z>>2]=0;br=c[aD>>2]|0;bs=0}c[aD>>2]=br+12;bt=bs}else{eD(e,w);bt=c[z>>2]|0}if((bt|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}z=c[bm>>2]|0;if((bt|0)!=(z|0)){c[bm>>2]=z+(~((z-8+(-bt|0)|0)>>>3)<<3)}n6(bt);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 4:{c[B>>2]=-1;of(D+4|0,0,16);c[D+20>>2]=-1;c[B+24>>2]=1;c[D+28>>2]=-1;D=A|0;c[D>>2]=0;bt=A+4|0;c[bt>>2]=0;z=A+8|0;c[z>>2]=0;bm=n4(32)|0;w=bm;c[bt>>2]=w;c[D>>2]=w;bs=bm+32|0;c[z>>2]=bs;if((bm|0)==0){bu=0}else{br=bm;bm=c[C+4>>2]|0;c[br>>2]=c[C>>2];c[br+4>>2]=bm;bu=w}bm=bu+8|0;c[bt>>2]=bm;if((bm|0)==0){bv=0}else{bu=B+8|0;br=bm;C=c[bu+4>>2]|0;c[br>>2]=c[bu>>2];c[br+4>>2]=C;bv=bm}bm=bv+8|0;c[bt>>2]=bm;if((bm|0)==0){bw=0}else{bv=B+16|0;C=bm;br=c[bv+4>>2]|0;c[C>>2]=c[bv>>2];c[C+4>>2]=br;bw=bm}bm=bw+8|0;c[bt>>2]=bm;if((bm|0)==0){bx=0}else{bw=B+24|0;B=bm;br=c[bw+4>>2]|0;c[B>>2]=c[bw>>2];c[B+4>>2]=br;bx=bm}bm=bx+8|0;c[bt>>2]=bm;bx=c[aD>>2]|0;if(bx>>>0<(c[aE>>2]|0)>>>0){if((bx|0)==0){by=0;bz=w}else{c[bx>>2]=w;c[bx+4>>2]=bm;c[bx+8>>2]=bs;c[z>>2]=0;c[bt>>2]=0;c[D>>2]=0;by=c[aD>>2]|0;bz=0}c[aD>>2]=by+12;bA=bz}else{eD(e,A);bA=c[D>>2]|0}D=bA;if((bA|0)!=0){A=c[bt>>2]|0;if((bA|0)!=(A|0)){c[bt>>2]=A+(~((A-8+(-D|0)|0)>>>3)<<3)}n6(bA)}c[F>>2]=0;c[H+4>>2]=-1;c[F+8>>2]=0;c[H+12>>2]=0;c[F+16>>2]=1;c[H+20>>2]=0;c[F+24>>2]=1;c[H+28>>2]=1;H=E|0;c[H>>2]=0;bA=E+4|0;c[bA>>2]=0;D=E+8|0;c[D>>2]=0;A=n4(32)|0;bt=A;c[bA>>2]=bt;c[H>>2]=bt;bz=A+32|0;c[D>>2]=bz;if((A|0)==0){bB=0}else{by=A;A=c[G+4>>2]|0;c[by>>2]=c[G>>2];c[by+4>>2]=A;bB=bt}A=bB+8|0;c[bA>>2]=A;if((A|0)==0){bC=0}else{bB=F+8|0;by=A;G=c[bB+4>>2]|0;c[by>>2]=c[bB>>2];c[by+4>>2]=G;bC=A}A=bC+8|0;c[bA>>2]=A;if((A|0)==0){bD=0}else{bC=F+16|0;G=A;by=c[bC+4>>2]|0;c[G>>2]=c[bC>>2];c[G+4>>2]=by;bD=A}A=bD+8|0;c[bA>>2]=A;if((A|0)==0){bE=0}else{bD=F+24|0;F=A;by=c[bD+4>>2]|0;c[F>>2]=c[bD>>2];c[F+4>>2]=by;bE=A}A=bE+8|0;c[bA>>2]=A;bE=c[aD>>2]|0;if(bE>>>0<(c[aE>>2]|0)>>>0){if((bE|0)==0){bF=0;bG=bt}else{c[bE>>2]=bt;c[bE+4>>2]=A;c[bE+8>>2]=bz;c[D>>2]=0;c[bA>>2]=0;c[H>>2]=0;bF=c[aD>>2]|0;bG=0}c[aD>>2]=bF+12;bH=bG}else{eD(e,E);bH=c[H>>2]|0}if((bH|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}H=c[bA>>2]|0;if((bH|0)!=(H|0)){c[bA>>2]=H+(~((H-8+(-bH|0)|0)>>>3)<<3)}n6(bH);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 6:{c[Z>>2]=-1;c[$+4>>2]=0;c[Z+8>>2]=0;c[$+12>>2]=0;c[Z+16>>2]=1;c[$+20>>2]=0;c[Z+24>>2]=-1;c[$+28>>2]=-1;$=Y|0;c[$>>2]=0;bH=Y+4|0;c[bH>>2]=0;H=Y+8|0;c[H>>2]=0;bA=n4(32)|0;E=bA;c[bH>>2]=E;c[$>>2]=E;bG=bA+32|0;c[H>>2]=bG;if((bA|0)==0){bI=0}else{bF=bA;bA=c[_+4>>2]|0;c[bF>>2]=c[_>>2];c[bF+4>>2]=bA;bI=E}bA=bI+8|0;c[bH>>2]=bA;if((bA|0)==0){bJ=0}else{bI=Z+8|0;bF=bA;_=c[bI+4>>2]|0;c[bF>>2]=c[bI>>2];c[bF+4>>2]=_;bJ=bA}bA=bJ+8|0;c[bH>>2]=bA;if((bA|0)==0){bK=0}else{bJ=Z+16|0;_=bA;bF=c[bJ+4>>2]|0;c[_>>2]=c[bJ>>2];c[_+4>>2]=bF;bK=bA}bA=bK+8|0;c[bH>>2]=bA;if((bA|0)==0){bM=0}else{bK=Z+24|0;Z=bA;bF=c[bK+4>>2]|0;c[Z>>2]=c[bK>>2];c[Z+4>>2]=bF;bM=bA}bA=bM+8|0;c[bH>>2]=bA;bM=c[aD>>2]|0;if(bM>>>0<(c[aE>>2]|0)>>>0){if((bM|0)==0){bN=0;bO=E}else{c[bM>>2]=E;c[bM+4>>2]=bA;c[bM+8>>2]=bG;c[H>>2]=0;c[bH>>2]=0;c[$>>2]=0;bN=c[aD>>2]|0;bO=0}c[aD>>2]=bN+12;bP=bO}else{eD(e,Y);bP=c[$>>2]|0}$=bP;if((bP|0)!=0){Y=c[bH>>2]|0;if((bP|0)!=(Y|0)){c[bH>>2]=Y+(~((Y-8+(-$|0)|0)>>>3)<<3)}n6(bP)}c[ab>>2]=0;c[ad+4>>2]=-1;c[ab+8>>2]=0;c[ad+12>>2]=0;c[ab+16>>2]=0;c[ad+20>>2]=1;c[ab+24>>2]=1;c[ad+28>>2]=-1;ad=aa|0;c[ad>>2]=0;bP=aa+4|0;c[bP>>2]=0;$=aa+8|0;c[$>>2]=0;Y=n4(32)|0;bH=Y;c[bP>>2]=bH;c[ad>>2]=bH;bO=Y+32|0;c[$>>2]=bO;if((Y|0)==0){bQ=0}else{bN=Y;Y=c[ac+4>>2]|0;c[bN>>2]=c[ac>>2];c[bN+4>>2]=Y;bQ=bH}Y=bQ+8|0;c[bP>>2]=Y;if((Y|0)==0){bR=0}else{bQ=ab+8|0;bN=Y;ac=c[bQ+4>>2]|0;c[bN>>2]=c[bQ>>2];c[bN+4>>2]=ac;bR=Y}Y=bR+8|0;c[bP>>2]=Y;if((Y|0)==0){bS=0}else{bR=ab+16|0;ac=Y;bN=c[bR+4>>2]|0;c[ac>>2]=c[bR>>2];c[ac+4>>2]=bN;bS=Y}Y=bS+8|0;c[bP>>2]=Y;if((Y|0)==0){bT=0}else{bS=ab+24|0;ab=Y;bN=c[bS+4>>2]|0;c[ab>>2]=c[bS>>2];c[ab+4>>2]=bN;bT=Y}Y=bT+8|0;c[bP>>2]=Y;bT=c[aD>>2]|0;if(bT>>>0<(c[aE>>2]|0)>>>0){if((bT|0)==0){bU=0;bV=bH}else{c[bT>>2]=bH;c[bT+4>>2]=Y;c[bT+8>>2]=bO;c[$>>2]=0;c[bP>>2]=0;c[ad>>2]=0;bU=c[aD>>2]|0;bV=0}c[aD>>2]=bU+12;bW=bV}else{eD(e,aa);bW=c[ad>>2]|0}ad=bW;if((bW|0)!=0){aa=c[bP>>2]|0;if((bW|0)!=(aa|0)){c[bP>>2]=aa+(~((aa-8+(-ad|0)|0)>>>3)<<3)}n6(bW)}c[af>>2]=-1;c[ah+4>>2]=-1;c[af+8>>2]=0;c[ah+12>>2]=-1;c[af+16>>2]=1;c[ah+20>>2]=-1;c[af+24>>2]=1;c[ah+28>>2]=0;ah=ae|0;c[ah>>2]=0;bW=ae+4|0;c[bW>>2]=0;ad=ae+8|0;c[ad>>2]=0;aa=n4(32)|0;bP=aa;c[bW>>2]=bP;c[ah>>2]=bP;bV=aa+32|0;c[ad>>2]=bV;if((aa|0)==0){bX=0}else{bU=aa;aa=c[ag+4>>2]|0;c[bU>>2]=c[ag>>2];c[bU+4>>2]=aa;bX=bP}aa=bX+8|0;c[bW>>2]=aa;if((aa|0)==0){bY=0}else{bX=af+8|0;bU=aa;ag=c[bX+4>>2]|0;c[bU>>2]=c[bX>>2];c[bU+4>>2]=ag;bY=aa}aa=bY+8|0;c[bW>>2]=aa;if((aa|0)==0){bZ=0}else{bY=af+16|0;ag=aa;bU=c[bY+4>>2]|0;c[ag>>2]=c[bY>>2];c[ag+4>>2]=bU;bZ=aa}aa=bZ+8|0;c[bW>>2]=aa;if((aa|0)==0){b_=0}else{bZ=af+24|0;af=aa;bU=c[bZ+4>>2]|0;c[af>>2]=c[bZ>>2];c[af+4>>2]=bU;b_=aa}aa=b_+8|0;c[bW>>2]=aa;b_=c[aD>>2]|0;if(b_>>>0<(c[aE>>2]|0)>>>0){if((b_|0)==0){b$=0;b0=bP}else{c[b_>>2]=bP;c[b_+4>>2]=aa;c[b_+8>>2]=bV;c[ad>>2]=0;c[bW>>2]=0;c[ah>>2]=0;b$=c[aD>>2]|0;b0=0}c[aD>>2]=b$+12;b1=b0}else{eD(e,ae);b1=c[ah>>2]|0}ah=b1;if((b1|0)!=0){ae=c[bW>>2]|0;if((b1|0)!=(ae|0)){c[bW>>2]=ae+(~((ae-8+(-ah|0)|0)>>>3)<<3)}n6(b1)}c[aj>>2]=0;c[al+4>>2]=-1;c[aj+8>>2]=0;c[al+12>>2]=0;c[aj+16>>2]=0;c[al+20>>2]=1;c[aj+24>>2]=-1;c[al+28>>2]=1;al=ai|0;c[al>>2]=0;b1=ai+4|0;c[b1>>2]=0;ah=ai+8|0;c[ah>>2]=0;ae=n4(32)|0;bW=ae;c[b1>>2]=bW;c[al>>2]=bW;b0=ae+32|0;c[ah>>2]=b0;if((ae|0)==0){b2=0}else{b$=ae;ae=c[ak+4>>2]|0;c[b$>>2]=c[ak>>2];c[b$+4>>2]=ae;b2=bW}ae=b2+8|0;c[b1>>2]=ae;if((ae|0)==0){b3=0}else{b2=aj+8|0;b$=ae;ak=c[b2+4>>2]|0;c[b$>>2]=c[b2>>2];c[b$+4>>2]=ak;b3=ae}ae=b3+8|0;c[b1>>2]=ae;if((ae|0)==0){b4=0}else{b3=aj+16|0;ak=ae;b$=c[b3+4>>2]|0;c[ak>>2]=c[b3>>2];c[ak+4>>2]=b$;b4=ae}ae=b4+8|0;c[b1>>2]=ae;if((ae|0)==0){b5=0}else{b4=aj+24|0;aj=ae;b$=c[b4+4>>2]|0;c[aj>>2]=c[b4>>2];c[aj+4>>2]=b$;b5=ae}ae=b5+8|0;c[b1>>2]=ae;b5=c[aD>>2]|0;if(b5>>>0<(c[aE>>2]|0)>>>0){if((b5|0)==0){b6=0;b7=bW}else{c[b5>>2]=bW;c[b5+4>>2]=ae;c[b5+8>>2]=b0;c[ah>>2]=0;c[b1>>2]=0;c[al>>2]=0;b6=c[aD>>2]|0;b7=0}c[aD>>2]=b6+12;b8=b7}else{eD(e,ai);b8=c[al>>2]|0}if((b8|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}al=c[b1>>2]|0;if((b8|0)!=(al|0)){c[b1>>2]=al+(~((al-8+(-b8|0)|0)>>>3)<<3)}n6(b8);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 1:{c[g>>2]=-2;c[j+4>>2]=0;c[g+8>>2]=-1;c[j+12>>2]=0;c[g+16>>2]=0;c[j+20>>2]=0;c[g+24>>2]=1;c[j+28>>2]=0;j=f|0;c[j>>2]=0;b8=f+4|0;c[b8>>2]=0;al=f+8|0;c[al>>2]=0;b1=n4(32)|0;ai=b1;c[b8>>2]=ai;c[j>>2]=ai;b7=b1+32|0;c[al>>2]=b7;if((b1|0)==0){b9=0}else{b6=b1;b1=c[h+4>>2]|0;c[b6>>2]=c[h>>2];c[b6+4>>2]=b1;b9=ai}b1=b9+8|0;c[b8>>2]=b1;if((b1|0)==0){ca=0}else{b9=g+8|0;b6=b1;h=c[b9+4>>2]|0;c[b6>>2]=c[b9>>2];c[b6+4>>2]=h;ca=b1}b1=ca+8|0;c[b8>>2]=b1;if((b1|0)==0){cb=0}else{ca=g+16|0;h=b1;b6=c[ca+4>>2]|0;c[h>>2]=c[ca>>2];c[h+4>>2]=b6;cb=b1}b1=cb+8|0;c[b8>>2]=b1;if((b1|0)==0){cc=0}else{cb=g+24|0;g=b1;b6=c[cb+4>>2]|0;c[g>>2]=c[cb>>2];c[g+4>>2]=b6;cc=b1}b1=cc+8|0;c[b8>>2]=b1;cc=c[aD>>2]|0;if(cc>>>0<(c[aE>>2]|0)>>>0){if((cc|0)==0){cd=0;ce=ai}else{c[cc>>2]=ai;c[cc+4>>2]=b1;c[cc+8>>2]=b7;c[al>>2]=0;c[b8>>2]=0;c[j>>2]=0;cd=c[aD>>2]|0;ce=0}c[aD>>2]=cd+12;cf=ce}else{eD(e,f);cf=c[j>>2]|0}j=cf;if((cf|0)!=0){f=c[b8>>2]|0;if((cf|0)!=(f|0)){c[b8>>2]=f+(~((f-8+(-j|0)|0)>>>3)<<3)}n6(cf)}c[l>>2]=0;c[n+4>>2]=-2;c[l+8>>2]=0;c[n+12>>2]=-1;c[l+16>>2]=0;c[n+20>>2]=0;c[l+24>>2]=0;c[n+28>>2]=1;n=k|0;c[n>>2]=0;cf=k+4|0;c[cf>>2]=0;j=k+8|0;c[j>>2]=0;f=n4(32)|0;b8=f;c[cf>>2]=b8;c[n>>2]=b8;ce=f+32|0;c[j>>2]=ce;if((f|0)==0){cg=0}else{cd=f;f=c[m+4>>2]|0;c[cd>>2]=c[m>>2];c[cd+4>>2]=f;cg=b8}f=cg+8|0;c[cf>>2]=f;if((f|0)==0){ch=0}else{cg=l+8|0;cd=f;m=c[cg+4>>2]|0;c[cd>>2]=c[cg>>2];c[cd+4>>2]=m;ch=f}f=ch+8|0;c[cf>>2]=f;if((f|0)==0){ci=0}else{ch=l+16|0;m=f;cd=c[ch+4>>2]|0;c[m>>2]=c[ch>>2];c[m+4>>2]=cd;ci=f}f=ci+8|0;c[cf>>2]=f;if((f|0)==0){cj=0}else{ci=l+24|0;l=f;cd=c[ci+4>>2]|0;c[l>>2]=c[ci>>2];c[l+4>>2]=cd;cj=f}f=cj+8|0;c[cf>>2]=f;cj=c[aD>>2]|0;if(cj>>>0<(c[aE>>2]|0)>>>0){if((cj|0)==0){ck=0;cl=b8}else{c[cj>>2]=b8;c[cj+4>>2]=f;c[cj+8>>2]=ce;c[j>>2]=0;c[cf>>2]=0;c[n>>2]=0;ck=c[aD>>2]|0;cl=0}c[aD>>2]=ck+12;cm=cl}else{eD(e,k);cm=c[n>>2]|0}if((cm|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}n=c[cf>>2]|0;if((cm|0)!=(n|0)){c[cf>>2]=n+(~((n-8+(-cm|0)|0)>>>3)<<3)}n6(cm);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 2:{c[p>>2]=0;c[r+4>>2]=0;c[p+8>>2]=1;c[r+12>>2]=0;c[p+16>>2]=0;c[r+20>>2]=1;c[p+24>>2]=1;c[r+28>>2]=1;r=o|0;c[r>>2]=0;cm=o+4|0;c[cm>>2]=0;n=o+8|0;c[n>>2]=0;cf=n4(32)|0;k=cf;c[cm>>2]=k;c[r>>2]=k;cl=cf+32|0;c[n>>2]=cl;if((cf|0)==0){cn=0}else{ck=cf;cf=c[q+4>>2]|0;c[ck>>2]=c[q>>2];c[ck+4>>2]=cf;cn=k}cf=cn+8|0;c[cm>>2]=cf;if((cf|0)==0){co=0}else{cn=p+8|0;ck=cf;q=c[cn+4>>2]|0;c[ck>>2]=c[cn>>2];c[ck+4>>2]=q;co=cf}cf=co+8|0;c[cm>>2]=cf;if((cf|0)==0){cp=0}else{co=p+16|0;q=cf;ck=c[co+4>>2]|0;c[q>>2]=c[co>>2];c[q+4>>2]=ck;cp=cf}cf=cp+8|0;c[cm>>2]=cf;if((cf|0)==0){cq=0}else{cp=p+24|0;p=cf;ck=c[cp+4>>2]|0;c[p>>2]=c[cp>>2];c[p+4>>2]=ck;cq=cf}cf=cq+8|0;c[cm>>2]=cf;cq=c[aD>>2]|0;if(cq>>>0<(c[aE>>2]|0)>>>0){if((cq|0)==0){cr=0;cs=k}else{c[cq>>2]=k;c[cq+4>>2]=cf;c[cq+8>>2]=cl;c[n>>2]=0;c[cm>>2]=0;c[r>>2]=0;cr=c[aD>>2]|0;cs=0}c[aD>>2]=cr+12;ct=cs}else{eD(e,o);ct=c[r>>2]|0}if((ct|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}r=c[cm>>2]|0;if((ct|0)!=(r|0)){c[cm>>2]=r+(~((r-8+(-ct|0)|0)>>>3)<<3)}n6(ct);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};case 7:{c[an>>2]=-1;c[ap+4>>2]=0;c[an+8>>2]=0;c[ap+12>>2]=0;c[an+16>>2]=1;c[ap+20>>2]=0;c[an+24>>2]=0;c[ap+28>>2]=-1;ap=am|0;c[ap>>2]=0;ct=am+4|0;c[ct>>2]=0;r=am+8|0;c[r>>2]=0;cm=n4(32)|0;o=cm;c[ct>>2]=o;c[ap>>2]=o;cs=cm+32|0;c[r>>2]=cs;if((cm|0)==0){cu=0}else{cr=cm;cm=c[ao+4>>2]|0;c[cr>>2]=c[ao>>2];c[cr+4>>2]=cm;cu=o}cm=cu+8|0;c[ct>>2]=cm;if((cm|0)==0){cv=0}else{cu=an+8|0;cr=cm;ao=c[cu+4>>2]|0;c[cr>>2]=c[cu>>2];c[cr+4>>2]=ao;cv=cm}cm=cv+8|0;c[ct>>2]=cm;if((cm|0)==0){cw=0}else{cv=an+16|0;ao=cm;cr=c[cv+4>>2]|0;c[ao>>2]=c[cv>>2];c[ao+4>>2]=cr;cw=cm}cm=cw+8|0;c[ct>>2]=cm;if((cm|0)==0){cy=0}else{cw=an+24|0;an=cm;cr=c[cw+4>>2]|0;c[an>>2]=c[cw>>2];c[an+4>>2]=cr;cy=cm}cm=cy+8|0;c[ct>>2]=cm;cy=c[aD>>2]|0;if(cy>>>0<(c[aE>>2]|0)>>>0){if((cy|0)==0){cz=0;cA=o}else{c[cy>>2]=o;c[cy+4>>2]=cm;c[cy+8>>2]=cs;c[r>>2]=0;c[ct>>2]=0;c[ap>>2]=0;cz=c[aD>>2]|0;cA=0}c[aD>>2]=cz+12;cB=cA}else{eD(e,am);cB=c[ap>>2]|0}ap=cB;if((cB|0)!=0){am=c[ct>>2]|0;if((cB|0)!=(am|0)){c[ct>>2]=am+(~((am-8+(-ap|0)|0)>>>3)<<3)}n6(cB)}c[ar>>2]=0;c[at+4>>2]=1;c[ar+8>>2]=0;c[at+12>>2]=0;c[ar+16>>2]=1;c[at+20>>2]=0;c[ar+24>>2]=0;c[at+28>>2]=-1;at=aq|0;c[at>>2]=0;cB=aq+4|0;c[cB>>2]=0;ap=aq+8|0;c[ap>>2]=0;am=n4(32)|0;ct=am;c[cB>>2]=ct;c[at>>2]=ct;cA=am+32|0;c[ap>>2]=cA;if((am|0)==0){cC=0}else{cz=am;am=c[as+4>>2]|0;c[cz>>2]=c[as>>2];c[cz+4>>2]=am;cC=ct}am=cC+8|0;c[cB>>2]=am;if((am|0)==0){cD=0}else{cC=ar+8|0;cz=am;as=c[cC+4>>2]|0;c[cz>>2]=c[cC>>2];c[cz+4>>2]=as;cD=am}am=cD+8|0;c[cB>>2]=am;if((am|0)==0){cE=0}else{cD=ar+16|0;as=am;cz=c[cD+4>>2]|0;c[as>>2]=c[cD>>2];c[as+4>>2]=cz;cE=am}am=cE+8|0;c[cB>>2]=am;if((am|0)==0){cF=0}else{cE=ar+24|0;ar=am;cz=c[cE+4>>2]|0;c[ar>>2]=c[cE>>2];c[ar+4>>2]=cz;cF=am}am=cF+8|0;c[cB>>2]=am;cF=c[aD>>2]|0;if(cF>>>0<(c[aE>>2]|0)>>>0){if((cF|0)==0){cG=0;cH=ct}else{c[cF>>2]=ct;c[cF+4>>2]=am;c[cF+8>>2]=cA;c[ap>>2]=0;c[cB>>2]=0;c[at>>2]=0;cG=c[aD>>2]|0;cH=0}c[aD>>2]=cG+12;cI=cH}else{eD(e,aq);cI=c[at>>2]|0}at=cI;if((cI|0)!=0){aq=c[cB>>2]|0;if((cI|0)!=(aq|0)){c[cB>>2]=aq+(~((aq-8+(-at|0)|0)>>>3)<<3)}n6(cI)}c[av>>2]=-1;c[ax+4>>2]=-1;c[av+8>>2]=0;c[ax+12>>2]=-1;c[av+16>>2]=1;c[ax+20>>2]=-1;c[av+24>>2]=0;c[ax+28>>2]=0;ax=au|0;c[ax>>2]=0;cI=au+4|0;c[cI>>2]=0;at=au+8|0;c[at>>2]=0;aq=n4(32)|0;cB=aq;c[cI>>2]=cB;c[ax>>2]=cB;cH=aq+32|0;c[at>>2]=cH;if((aq|0)==0){cJ=0}else{cG=aq;aq=c[aw+4>>2]|0;c[cG>>2]=c[aw>>2];c[cG+4>>2]=aq;cJ=cB}aq=cJ+8|0;c[cI>>2]=aq;if((aq|0)==0){cK=0}else{cJ=av+8|0;cG=aq;aw=c[cJ+4>>2]|0;c[cG>>2]=c[cJ>>2];c[cG+4>>2]=aw;cK=aq}aq=cK+8|0;c[cI>>2]=aq;if((aq|0)==0){cL=0}else{cK=av+16|0;aw=aq;cG=c[cK+4>>2]|0;c[aw>>2]=c[cK>>2];c[aw+4>>2]=cG;cL=aq}aq=cL+8|0;c[cI>>2]=aq;if((aq|0)==0){cM=0}else{cL=av+24|0;av=aq;cG=c[cL+4>>2]|0;c[av>>2]=c[cL>>2];c[av+4>>2]=cG;cM=aq}aq=cM+8|0;c[cI>>2]=aq;cM=c[aD>>2]|0;if(cM>>>0<(c[aE>>2]|0)>>>0){if((cM|0)==0){cN=0;cO=cB}else{c[cM>>2]=cB;c[cM+4>>2]=aq;c[cM+8>>2]=cH;c[at>>2]=0;c[cI>>2]=0;c[ax>>2]=0;cN=c[aD>>2]|0;cO=0}c[aD>>2]=cN+12;cP=cO}else{eD(e,au);cP=c[ax>>2]|0}ax=cP;if((cP|0)!=0){au=c[cI>>2]|0;if((cP|0)!=(au|0)){c[cI>>2]=au+(~((au-8+(-ax|0)|0)>>>3)<<3)}n6(cP)}c[az>>2]=-1;of(aB+4|0,0,16);c[aB+20>>2]=1;c[az+24>>2]=0;c[aB+28>>2]=-1;aB=ay|0;c[aB>>2]=0;cP=ay+4|0;c[cP>>2]=0;ax=ay+8|0;c[ax>>2]=0;au=n4(32)|0;cI=au;c[cP>>2]=cI;c[aB>>2]=cI;cO=au+32|0;c[ax>>2]=cO;if((au|0)==0){cQ=0}else{cN=au;au=c[aA+4>>2]|0;c[cN>>2]=c[aA>>2];c[cN+4>>2]=au;cQ=cI}au=cQ+8|0;c[cP>>2]=au;if((au|0)==0){cR=0}else{cQ=az+8|0;cN=au;aA=c[cQ+4>>2]|0;c[cN>>2]=c[cQ>>2];c[cN+4>>2]=aA;cR=au}au=cR+8|0;c[cP>>2]=au;if((au|0)==0){cS=0}else{cR=az+16|0;aA=au;cN=c[cR+4>>2]|0;c[aA>>2]=c[cR>>2];c[aA+4>>2]=cN;cS=au}au=cS+8|0;c[cP>>2]=au;if((au|0)==0){cT=0}else{cS=az+24|0;az=au;cN=c[cS+4>>2]|0;c[az>>2]=c[cS>>2];c[az+4>>2]=cN;cT=au}au=cT+8|0;c[cP>>2]=au;cT=c[aD>>2]|0;if(cT>>>0<(c[aE>>2]|0)>>>0){if((cT|0)==0){cU=0;cV=cI}else{c[cT>>2]=cI;c[cT+4>>2]=au;c[cT+8>>2]=cO;c[ax>>2]=0;c[cP>>2]=0;c[aB>>2]=0;cU=c[aD>>2]|0;cV=0}c[aD>>2]=cU+12;cW=cV}else{eD(e,ay);cW=c[aB>>2]|0}if((cW|0)==0){ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return}aB=c[cP>>2]|0;if((cW|0)!=(aB|0)){c[cP>>2]=aB+(~((aB-8+(-cW|0)|0)>>>3)<<3)}n6(cW);ba=a|0;bb=a+4|0;bc=a+8|0;bd=c[aC>>2]|0;c[ba>>2]=bd;be=c[aD>>2]|0;c[bb>>2]=be;bf=c[aE>>2]|0;c[bc>>2]=bf;i=d;return};default:{d=cx(4)|0;c[d>>2]=2240;bL(d|0,12808,0)}}}function eD(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=a+4|0;e=c[d>>2]|0;f=a|0;g=c[f>>2]|0;h=g;i=(e-h|0)/12|0;j=i+1|0;if(j>>>0>357913941>>>0){lw(0)}k=a+8|0;a=((c[k>>2]|0)-h|0)/12|0;if(a>>>0>178956969>>>0){l=357913941;m=2554}else{h=a<<1;a=h>>>0<j>>>0?j:h;if((a|0)==0){n=0;o=0}else{l=a;m=2554}}if((m|0)==2554){n=n4(l*12|0)|0;o=l}l=n+(i*12|0)|0;m=n+(o*12|0)|0;if((l|0)==0){p=g;q=e}else{e=b|0;c[l>>2]=c[e>>2];g=b+4|0;c[n+(i*12|0)+4>>2]=c[g>>2];o=b+8|0;c[n+(i*12|0)+8>>2]=c[o>>2];c[o>>2]=0;c[g>>2]=0;c[e>>2]=0;p=c[f>>2]|0;q=c[d>>2]|0}e=n+(j*12|0)|0;do{if((q|0)==(p|0)){c[f>>2]=l;c[d>>2]=e;c[k>>2]=m;r=q}else{j=i-1-(((q-12+(-p|0)|0)>>>0)/12|0)|0;g=q;o=l;while(1){b=o-12|0;a=g-12|0;if((b|0)!=0){h=b|0;c[h>>2]=0;s=o-12+4|0;c[s>>2]=0;t=o-12+8|0;c[t>>2]=0;u=a|0;c[h>>2]=c[u>>2];h=g-12+4|0;c[s>>2]=c[h>>2];s=g-12+8|0;c[t>>2]=c[s>>2];c[s>>2]=0;c[h>>2]=0;c[u>>2]=0}if((a|0)==(p|0)){break}else{g=a;o=b}}o=c[f>>2]|0;g=c[d>>2]|0;c[f>>2]=n+(j*12|0);c[d>>2]=e;c[k>>2]=m;if((o|0)==(g|0)){r=o;break}else{v=g}while(1){g=v-12|0;b=c[g>>2]|0;a=b;if((b|0)!=0){u=v-12+4|0;h=c[u>>2]|0;if((b|0)!=(h|0)){c[u>>2]=h+(~((h-8+(-a|0)|0)>>>3)<<3)}n6(b)}if((o|0)==(g|0)){r=o;break}else{v=g}}}}while(0);if((r|0)==0){return}n6(r);return}function eE(a){a=a|0;eL(a|0);return}function eF(a){a=a|0;eL(a|0);n6(a);return}function eG(b){b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=i;i=i+656|0;e=d|0;f=d+16|0;h=d+32|0;j=d+96|0;k=d+112|0;l=d+128|0;m=d+144|0;n=d+208|0;o=d+224|0;p=d+240|0;q=d+256|0;r=d+272|0;s=d+288|0;t=d+304|0;u=d+320|0;v=d+336|0;w=d+352|0;x=d+368|0;y=d+432|0;z=d+448|0;A=d+464|0;B=d+480|0;C=d+544|0;D=d+560|0;F=d+576|0;G=d+592|0;cq(2929);cq(2884);cK(2305);bi(1029);aK(+0.0,+.30000001192092896,+0.0,+1.0);H=b+132|0;I=(c[H>>2]|0)+20|0;J=e;K=e;a[K]=16;L=J+1|0;M=L|0;E=1769172848;a[M]=E&255;E=E>>8;a[M+1|0]=E&255;E=E>>8;a[M+2|0]=E&255;E=E>>8;a[M+3|0]=E&255;M=L+4|0;E=1852795252;a[M]=E&255;E=E>>8;a[M+1|0]=E&255;E=E>>8;a[M+2|0]=E&255;E=E>>8;a[M+3|0]=E&255;a[J+9|0]=0;J=c[(dS(I,e)|0)+12>>2]|0;if((a[K]&1)!=0){n6(c[e+8>>2]|0)}e=(c[H>>2]|0)+20|0;K=f;I=f;a[I]=12;M=K+1|0;a[M]=a[1552]|0;a[M+1|0]=a[1553]|0;a[M+2|0]=a[1554]|0;a[M+3|0]=a[1555]|0;a[M+4|0]=a[1556]|0;a[M+5|0]=a[1557]|0;a[K+7|0]=0;K=c[(dS(e,f)|0)+12>>2]|0;if((a[I]&1)!=0){n6(c[f+8>>2]|0)}cz(770,771);bS(256);ch(c[(c[H>>2]|0)+40>>2]|0);ed(h,b+4|0,b+68|0);b=c[H>>2]|0;f=n4(16)|0;I=j+8|0;c[I>>2]=f;c[j>>2]=17;c[j+4>>2]=11;oe(f|0,2224,11)|0;a[f+11|0]=0;dX(b,j,h,1,0);if((a[j]&1)!=0){n6(c[I>>2]|0)}I=c[H>>2]|0;j=n4(16)|0;h=k+8|0;c[h>>2]=j;c[k>>2]=17;c[k+4>>2]=11;oe(j|0,504,11)|0;a[j+11|0]=0;g[l>>2]=1.0;g[l+4>>2]=1.0;g[l+8>>2]=1.0;g[l+12>>2]=1.0;dU(I,k,l,1);if((a[k]&1)!=0){n6(c[h>>2]|0)}dZ(J,K);cq(3042);of(m|0,0,40);g[m>>2]=40.0;of(m+4|0,0,16);g[m+20>>2]=40.0;of(m+24|0,0,16);g[m+40>>2]=1.5;of(m+44|0,0,16);g[m+60>>2]=1.0;K=c[H>>2]|0;J=n;h=n;a[h]=16;k=J+1|0;l=k|0;E=1701080941;a[l]=E&255;E=E>>8;a[l+1|0]=E&255;E=E>>8;a[l+2|0]=E&255;E=E>>8;a[l+3|0]=E&255;l=k+4|0;E=1952533868;a[l]=E&255;E=E>>8;a[l+1|0]=E&255;E=E>>8;a[l+2|0]=E&255;E=E>>8;a[l+3|0]=E&255;a[J+9|0]=0;dX(K,n,m,1,0);if((a[h]&1)!=0){n6(c[n+8>>2]|0)}n=c[H>>2]|0;h=o;m=o;a[m]=16;K=h+1|0;J=K|0;E=1131966306;a[J]=E&255;E=E>>8;a[J+1|0]=E&255;E=E>>8;a[J+2|0]=E&255;E=E>>8;a[J+3|0]=E&255;J=K+4|0;E=1919904879;a[J]=E&255;E=E>>8;a[J+1|0]=E&255;E=E>>8;a[J+2|0]=E&255;E=E>>8;a[J+3|0]=E&255;a[h+9|0]=0;g[p>>2]=0.0;g[p+4>>2]=0.0;g[p+8>>2]=0.0;g[p+12>>2]=.6235294342041016;dU(n,o,p,1);if((a[m]&1)!=0){n6(c[o+8>>2]|0)}o=c[H>>2]|0;m=q;p=q;a[p]=18;n=m+1|0;oe(n|0,328,9)|0;a[m+10|0]=0;g[r>>2]=0.0;g[r+4>>2]=0.0;g[r+8>>2]=40.0;dV(o,q,r,1);if((a[p]&1)!=0){n6(c[q+8>>2]|0)}bm(4,0,c[5426]|0);bR(3042);q=c[H>>2]|0;p=s;r=s;a[r]=18;o=p+1|0;oe(o|0,328,9)|0;a[p+10|0]=0;g[t>>2]=0.0;g[t+4>>2]=0.0;g[t+8>>2]=4.0;dV(q,s,t,1);if((a[r]&1)!=0){n6(c[s+8>>2]|0)}s=u;r=u;a[r]=16;t=s+1|0;q=t|0;E=1162690887;a[q]=E&255;E=E>>8;a[q+1|0]=E&255;E=E>>8;a[q+2|0]=E&255;E=E>>8;a[q+3|0]=E&255;q=t+4|0;E=1380275791;a[q]=E&255;E=E>>8;a[q+1|0]=E&255;E=E>>8;a[q+2|0]=E&255;E=E>>8;a[q+3|0]=E&255;a[s+9|0]=0;s=c[H>>2]|0;g[v>>2]=0.0;g[v+4>>2]=3.0;g[v+8>>2]=2.0;g[w>>2]=.5;g[w+4>>2]=.5;g[w+8>>2]=.5;c[x>>2]=0;g[x>>2]=1.0;of(x+4|0,0,16);g[x+20>>2]=1.0;of(x+24|0,0,16);g[x+40>>2]=1.0;of(x+44|0,0,16);g[x+60>>2]=1.0;d_(0,u,s,-52429,v,w,x,2);if((a[r]&1)!=0){n6(c[u+8>>2]|0)}u=y;r=y;a[r]=20;x=u+1|0;oe(x|0,2208,10)|0;a[u+11|0]=0;u=c[H>>2]|0;g[z>>2]=0.0;g[z+4>>2]=-3.5;g[z+8>>2]=2.0;g[A>>2]=.20000000298023224;g[A+4>>2]=.20000000298023224;g[A+8>>2]=.20000000298023224;c[B>>2]=0;g[B>>2]=1.0;of(B+4|0,0,16);g[B+20>>2]=1.0;of(B+24|0,0,16);g[B+40>>2]=1.0;of(B+44|0,0,16);g[B+60>>2]=1.0;d_(0,y,u,-8586240,z,A,B,2);if((a[r]&1)!=0){n6(c[y+8>>2]|0)}y=C;r=C;a[r]=20;B=y+1|0;oe(B|0,2192,10)|0;a[y+11|0]=0;y=c[H>>2]|0;g[D>>2]=0.0;g[D+4>>2]=-6.0;g[D+8>>2]=2.0;g[F>>2]=.20000000298023224;g[F+4>>2]=.20000000298023224;g[F+8>>2]=.20000000298023224;c[G>>2]=0;g[G>>2]=1.0;of(G+4|0,0,16);g[G+20>>2]=1.0;of(G+24|0,0,16);g[G+40>>2]=1.0;of(G+44|0,0,16);g[G+60>>2]=1.0;d_(0,C,y,-8586240,D,F,G,2);if((a[r]&1)==0){aJ();i=d;return}n6(c[C+8>>2]|0);aJ();i=d;return}function eH(a){a=a|0;return}function eI(b,d){b=b|0;d=d|0;var e=0,f=0;if((d<<24>>24|0)==114|(d<<24>>24|0)==82){e=2637}else if(!((d<<24>>24|0)==116|(d<<24>>24|0)==84)){return}do{if((e|0)==2637){a[15040]=0;b=c[3772]|0;if((b|0)!=0){cT[c[(c[b>>2]|0)+4>>2]&511](b)}b=n4(136)|0;f=b;dv(f);c[b>>2]=8536;c[3772]=f;dy(b);if((d<<24>>24|0)==116|(d<<24>>24|0)==84){break}return}}while(0);a[15040]=1;d=c[3772]|0;if((d|0)!=0){cT[c[(c[d>>2]|0)+4>>2]&511](d)}d=n4(136)|0;e=d;dv(e);c[d>>2]=8536;c[3772]=e;dy(d);return}function eJ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return}function eK(a){a=a|0;cq(2929);cq(2884);cK(2305);bi(1029);aK(+0.0,+.30000001192092896,+0.0,+1.0);return}function eL(b){b=b|0;var d=0,e=0;c[b>>2]=8416;d=c[b+132>>2]|0;if((d|0)==0){return}bn(c[d+40>>2]|0);b=c[d+28>>2]|0;if((b|0)!=0){e=b;while(1){b=c[e>>2]|0;if((a[e+20|0]&1)!=0){n6(c[e+28>>2]|0)}if((a[e+8|0]&1)!=0){n6(c[e+16>>2]|0)}n6(e);if((b|0)==0){break}else{e=b}}}e=d+20|0;b=c[e>>2]|0;c[e>>2]=0;if((b|0)!=0){n6(b)}b=c[d+8>>2]|0;if((b|0)!=0){e=b;while(1){b=c[e>>2]|0;if((a[e+20|0]&1)!=0){n6(c[e+28>>2]|0)}if((a[e+8|0]&1)!=0){n6(c[e+16>>2]|0)}n6(e);if((b|0)==0){break}else{e=b}}}e=d|0;b=c[e>>2]|0;c[e>>2]=0;if((b|0)!=0){n6(b)}n6(d);return}function eM(a){a=a|0;eL(a);return}function eN(a){a=a|0;eL(a);n6(a);return}function eO(a){a=a|0;return}function eP(a,b){a=a|0;b=b|0;return}function eQ(b){b=b|0;var d=0,e=0,f=0,g=0;h[b+56>>3]=0.0;a[b+80|0]=0;d=b+96|0;dJ(d|0);dK(d);e=c[b+100>>2]|0;f=b+104|0;g=c[f>>2]|0;if((e|0)!=(g|0)){c[f>>2]=g+(~((g-4+(-e|0)|0)>>>2)<<2)}dL(d|0);of(d|0,0,24);d=n4(28)|0;e=c[b>>2]|0;g=c[e>>2]|0;f=c[e+4>>2]|0;e=eA()|0;a[d]=e;eC(d+4|0,e);e=d+16|0;c[e>>2]=(g|0)/2|0;c[e+4>>2]=f-1;c[d+24>>2]=0;c[b+8>>2]=d;return}function eR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0;e=i;i=i+32|0;f=e|0;g=e+8|0;c[a+24>>2]=0;j=a+28|0;c[j>>2]=0;k=a+48|0;c[k>>2]=0;of(a|0,0,21);of(a+56|0,0,25);of(a+96|0,0,24);l=n4(20)|0;e0(l,b,d);c[a>>2]=l;l=g+16|0;d=g;c[l>>2]=d;c[g>>2]=8064;eS(g,a+32|0);b=c[l>>2]|0;do{if((b|0)==(d|0)){cT[c[(c[g>>2]|0)+16>>2]&511](d)}else{if((b|0)==0){break}cT[c[(c[b>>2]|0)+20>>2]&511](b)}}while(0);c[f>>2]=c[j>>2];j=c[k>>2]|0;if((j|0)==0){k=cx(4)|0;c[k>>2]=6936;bL(k|0,13784,178)}else{h[a+88>>3]=+cR[c[(c[j>>2]|0)+24>>2]&3](j,f);i=e;return}}function eS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=e|0;g=a+16|0;h=c[g>>2]|0;j=a;a=b+16|0;k=c[a>>2]|0;l=b;m=(k|0)==(l|0);if((h|0)!=(j|0)){if(!m){c[g>>2]=k;c[a>>2]=h;i=d;return}cU[c[(c[b>>2]|0)+12>>2]&127](l,j);l=c[a>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);c[a>>2]=c[g>>2];c[g>>2]=j;i=d;return}j=c[(c[h>>2]|0)+12>>2]|0;if(!m){m=b;cU[j&127](h,m);l=c[g>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);l=b+16|0;c[g>>2]=c[l>>2];c[l>>2]=m;i=d;return}cU[j&127](h,f);j=c[g>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[g>>2]=0;j=c[a>>2]|0;cU[c[(c[j>>2]|0)+12>>2]&127](j,h);j=c[a>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[a>>2]=0;c[g>>2]=h;cU[c[(c[e>>2]|0)+12>>2]&127](f,k);cT[c[(c[e>>2]|0)+16>>2]&511](f);c[a>>2]=k;i=d;return}function eT(a){a=a|0;return}function eU(a){a=a|0;n6(a);return}function eV(a){a=a|0;a=n4(8)|0;if((a|0)!=0){c[a>>2]=8064}return a|0}function eW(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=8064;return}function eX(a){a=a|0;return}function eY(a){a=a|0;n6(a);return}function eZ(a,b){a=a|0;b=b|0;var d=0.0;d=+af((-0.0- +((c[b>>2]|0)>>>0>>>0))/500.0);return+(d<.01?.005:d*.5)}function e_(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==8584?a+4|0:0)|0}function e$(a){a=a|0;return 12648}function e0(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;c[b>>2]=d;c[b+4>>2]=e;f=b+8|0;e1(f,d);d=c[f>>2]|0;f=c[b+12>>2]|0;if((d|0)==(f|0)){return}b=(e|0)==0;g=(e|0)<0;h=d;while(1){if(b){i=0;j=0;k=0}else{if(g){break}d=n4(e)|0;l=e;m=d;do{if((m|0)==0){n=0}else{a[m]=0;n=m}m=n+1|0;l=l-1|0;}while((l|0)!=0);i=d;j=m;k=d+e|0}l=h|0;o=c[l>>2]|0;p=h+4|0;if((o|0)==0){q=h+8|0}else{if((o|0)!=(c[p>>2]|0)){c[p>>2]=o}r=h+8|0;n6(o);c[r>>2]=0;c[p>>2]=0;c[l>>2]=0;q=r}c[l>>2]=i;c[p>>2]=j;c[q>>2]=k;p=h+12|0;if((p|0)==(f|0)){s=2789;break}else{h=p}}if((s|0)==2789){return}lw(0)}function e1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;if((b|0)==0){return}if(b>>>0>357913941>>>0){lw(0)}a=n4(b*12|0)|0;c[e>>2]=a;c[d>>2]=a;c[f>>2]=a+(b*12|0);f=b;b=a;do{if((b|0)==0){g=0}else{c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;g=c[e>>2]|0}b=g+12|0;c[e>>2]=b;f=f-1|0;}while((f|0)!=0);return}function e2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;b=c[a>>2]|0;if((b|0)!=0){d=b+8|0;e=c[d>>2]|0;if((e|0)!=0){f=b+12|0;g=c[f>>2]|0;if((e|0)==(g|0)){h=e}else{i=g;while(1){g=i-12|0;c[f>>2]=g;j=c[g>>2]|0;if((j|0)==0){k=g}else{g=i-12+4|0;if((j|0)!=(c[g>>2]|0)){c[g>>2]=j}n6(j);k=c[f>>2]|0}if((e|0)==(k|0)){break}else{i=k}}h=c[d>>2]|0}n6(h)}n6(b)}b=c[a+4>>2]|0;if((b|0)!=0){h=b+4|0;d=c[h>>2]|0;if((d|0)!=0){k=b+8|0;i=c[k>>2]|0;if((d|0)==(i|0)){l=d}else{e=i;while(1){i=e-12|0;c[k>>2]=i;f=c[i>>2]|0;j=f;if((f|0)==0){m=i}else{i=e-12+4|0;g=c[i>>2]|0;if((f|0)!=(g|0)){c[i>>2]=g+(~((g-8+(-j|0)|0)>>>3)<<3)}n6(f);m=c[k>>2]|0}if((d|0)==(m|0)){break}else{e=m}}l=c[h>>2]|0}n6(l)}n6(b|0)}b=c[a+8>>2]|0;if((b|0)!=0){l=b+4|0;h=c[l>>2]|0;if((h|0)!=0){m=b+8|0;e=c[m>>2]|0;if((h|0)==(e|0)){n=h}else{d=e;while(1){e=d-12|0;c[m>>2]=e;k=c[e>>2]|0;f=k;if((k|0)==0){o=e}else{e=d-12+4|0;j=c[e>>2]|0;if((k|0)!=(j|0)){c[e>>2]=j+(~((j-8+(-f|0)|0)>>>3)<<3)}n6(k);o=c[m>>2]|0}if((h|0)==(o|0)){break}else{d=o}}n=c[l>>2]|0}n6(n)}n6(b|0)}b=a+96|0;dJ(b|0);n=a+100|0;l=c[n>>2]|0;o=a+104|0;d=c[o>>2]|0;do{if((l|0)!=(d|0)){h=l;do{n6(c[h>>2]|0);h=h+4|0;}while((h|0)!=(d|0));h=c[n>>2]|0;m=c[o>>2]|0;if((h|0)==(m|0)){break}c[o>>2]=m+(~((m-4+(-h|0)|0)>>>2)<<2)}}while(0);o=c[b>>2]|0;if((o|0)!=0){n6(o)}o=c[a+48>>2]|0;if((o|0)==(a+32|0)){cT[c[(c[o>>2]|0)+16>>2]&511](o);return}if((o|0)==0){return}cT[c[(c[o>>2]|0)+20>>2]&511](o);return}function e3(a){a=a|0;fF(a);return}function e4(a){a=a|0;fF(a);n6(a);return}function e5(b){b=b|0;var e=0,f=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0.0,au=0.0,av=0.0,aw=0.0,ax=0.0,ay=0.0,az=0.0,aA=0.0,aB=0.0,aC=0.0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0.0;e=i;i=i+1104|0;f=e|0;j=e+8|0;k=e+24|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+80|0;p=e+104|0;q=e+128|0;r=e+144|0;s=e+160|0;t=e+224|0;u=e+240|0;v=e+256|0;w=e+320|0;x=e+336|0;y=e+352|0;z=e+368|0;A=e+384|0;B=e+400|0;C=e+416|0;D=e+480|0;F=e+496|0;G=e+512|0;H=e+576|0;I=e+592|0;J=e+608|0;K=e+672|0;L=e+688|0;M=e+704|0;N=e+720|0;O=e+736|0;P=e+800|0;Q=e+816|0;R=e+880|0;S=e+896|0;T=e+912|0;U=e+976|0;V=e+992|0;W=e+1008|0;X=e+1024|0;Y=e+1040|0;Z=e+1056|0;_=e+1072|0;$=e+1088|0;do{if((a[21984]|0)==0){if((bx(21984)|0)==0){break}aa=c[c[b+136>>2]>>2]|0;ab=(c[aa+4>>2]|0)-1|0;g[5070]=+((c[aa>>2]|0)/2|0|0);g[5071]=+(ab|0)}}while(0);ab=b|0;aa=b+136|0;ac=c[aa>>2]|0;if((a[ac+20|0]&1)!=0){ad=c[3772]|0;if((ad|0)!=0){cT[c[(c[ad>>2]|0)+4>>2]&511](ad)}ad=n4(136)|0;ae=ad;dv(ae);c[ad>>2]=8456;c[3772]=ae;eG(ad);i=e;return}dR(ac);ac=b+132|0;ad=(c[ac>>2]|0)+20|0;ae=j;af=j;a[af]=16;ag=ae+1|0;ah=ag|0;E=1769172848;a[ah]=E&255;E=E>>8;a[ah+1|0]=E&255;E=E>>8;a[ah+2|0]=E&255;E=E>>8;a[ah+3|0]=E&255;ah=ag+4|0;E=1852795252;a[ah]=E&255;E=E>>8;a[ah+1|0]=E&255;E=E>>8;a[ah+2|0]=E&255;E=E>>8;a[ah+3|0]=E&255;a[ae+9|0]=0;ae=c[(dS(ad,j)|0)+12>>2]|0;if((a[af]&1)!=0){n6(c[j+8>>2]|0)}j=(c[ac>>2]|0)+20|0;af=k;ad=k;a[ad]=12;ah=af+1|0;a[ah]=a[1552]|0;a[ah+1|0]=a[1553]|0;a[ah+2|0]=a[1554]|0;a[ah+3|0]=a[1555]|0;a[ah+4|0]=a[1556]|0;a[ah+5|0]=a[1557]|0;a[af+7|0]=0;af=c[(dS(j,k)|0)+12>>2]|0;if((a[ad]&1)!=0){n6(c[k+8>>2]|0)}k=c[aa>>2]|0;ad=c[k+4>>2]|0;j=c[k+8>>2]|0;do{if((a[21976]|0)==0){if((bx(21976)|0)==0){break}k=c[c[aa>>2]>>2]|0;ai=+(-(c[k>>2]|0)|0)*.5+.5;aj=+(-(c[k+4>>2]|0)|0)*.5+.5;of(20216,0,52);g[5054]=1.0;of(20220,0,16);g[5059]=1.0;of(20240,0,16);g[5064]=1.0;g[5065]=0.0;ak=ai*0.0;al=aj*0.0;am=ak+al+0.0;g[5066]=ai+al+0.0;g[5067]=ak+aj+0.0;g[5068]=am;g[5069]=am+1.0}}while(0);k=b+144|0;do{if(!((a[k|0]&1)!=0|(ad|0)==0)){am=+(c[ad+16>>2]|0);aj=+(c[ad+20>>2]|0);ak=+g[5070];al=+g[5071];if(!(am!=ak|aj!=al)){break}g[l>>2]=ak;g[l+4>>2]=al;g[m>>2]=am;g[m+4>>2]=aj;ah=n+16|0;ag=n;c[ah>>2]=ag;c[n>>2]=8176;an=o+16|0;ao=o;c[an>>2]=ao;c[o>>2]=8232;ap=p+16|0;aq=p;c[ap>>2]=aq;c[p>>2]=8120;c[p+4>>2]=b;e7(k,l,m,3.0,n,o,p);ar=c[ap>>2]|0;do{if((ar|0)==(aq|0)){cT[c[(c[p>>2]|0)+16>>2]&511](aq)}else{if((ar|0)==0){break}cT[c[(c[ar>>2]|0)+20>>2]&511](ar)}}while(0);ar=c[an>>2]|0;do{if((ar|0)==(ao|0)){cT[c[(c[o>>2]|0)+16>>2]&511](ao)}else{if((ar|0)==0){break}cT[c[(c[ar>>2]|0)+20>>2]&511](ar)}}while(0);ar=c[ah>>2]|0;do{if((ar|0)==(ag|0)){cT[c[(c[n>>2]|0)+16>>2]&511](ag)}else{if((ar|0)==0){break}cT[c[(c[ar>>2]|0)+20>>2]&511](ar)}}while(0);ar=c[aa>>2]|0;b3(f|0,0)|0;h[ar+72>>3]=+(c[f>>2]|0)+ +(c[f+4>>2]|0)*1.0e-6;a[ar+80|0]=1}}while(0);e8(k);bS(16640);ch(c[(c[ac>>2]|0)+40>>2]|0);dT(ae,af);k=(ad|0)!=0;if(k){aj=+g[5070];am=+g[5071];al=+g[5066]+(aj*+g[5054]+am*+g[5058]+ +g[5062]*0.0);ak=+g[5067]+(aj*+g[5055]+am*+g[5059]+ +g[5063]*0.0)+3.0;g[q>>2]=al;g[q+4>>2]=ak;g[q+8>>2]=3.0;g[r>>2]=al+0.0;g[r+4>>2]=ak+ -4.5;g[r+8>>2]=0.0;f=b+68|0;g[t>>2]=0.0;g[t+4>>2]=0.0;g[t+8>>2]=1.0;e9(s,q,r,t);g[f>>2]=+g[s>>2];g[b+72>>2]=+g[s+4>>2];g[b+76>>2]=+g[s+8>>2];g[b+80>>2]=+g[s+12>>2];g[b+84>>2]=+g[s+16>>2];g[b+88>>2]=+g[s+20>>2];g[b+92>>2]=+g[s+24>>2];g[b+96>>2]=+g[s+28>>2];g[b+100>>2]=+g[s+32>>2];g[b+104>>2]=+g[s+36>>2];g[b+108>>2]=+g[s+40>>2];g[b+112>>2]=+g[s+44>>2];g[b+116>>2]=+g[s+48>>2];g[b+120>>2]=+g[s+52>>2];g[b+124>>2]=+g[s+56>>2];g[b+128>>2]=+g[s+60>>2];s=c[ac>>2]|0;t=n4(16)|0;r=u+8|0;c[r>>2]=t;c[u>>2]=17;c[u+4>>2]=11;oe(t|0,2224,11)|0;a[t+11|0]=0;ed(v,b+4|0,f);dX(s,u,v,1,0);if((a[u]&1)!=0){n6(c[r>>2]|0)}switch(d[ad|0]|0){case 2:{as=-256;break};case 3:{as=-8586240;break};case 4:{as=-52429;break};case 5:{as=-10066177;break};case 6:{as=-23296;break};case 7:{as=-7077677;break};case 1:{as=-16711681;break};default:{r=cx(4)|0;c[r>>2]=2272;bL(r|0,12808,0)}}r=c[ac>>2]|0;u=n4(16)|0;v=w+8|0;c[v>>2]=u;c[w>>2]=17;c[w+4>>2]=11;oe(u|0,504,11)|0;a[u+11|0]=0;ak=+(as>>>16&255|0)/255.0;al=+(as>>>8&255|0)/255.0;am=+(as&255|0)/255.0;g[x>>2]=ak;g[x+4>>2]=al;g[x+8>>2]=am;g[x+12>>2]=1.0;dU(r,w,x,1);if((a[w]&1)!=0){n6(c[v>>2]|0)}v=c[ac>>2]|0;w=y;x=y;a[x]=18;r=w+1|0;oe(r|0,328,9)|0;a[w+10|0]=0;aj=+g[5070];ai=+g[5071];at=+g[5067]+(aj*+g[5055]+ai*+g[5059]+ +g[5063]*0.0);g[z>>2]=+g[5066]+(aj*+g[5054]+ai*+g[5058]+ +g[5062]*0.0);g[z+4>>2]=at;g[z+8>>2]=2.0;dV(v,y,z,1);if((a[x]&1)!=0){n6(c[y+8>>2]|0)}y=c[ac>>2]|0;x=A;z=A;a[z]=16;v=x+1|0;w=v|0;E=1131966306;a[w]=E&255;E=E>>8;a[w+1|0]=E&255;E=E>>8;a[w+2|0]=E&255;E=E>>8;a[w+3|0]=E&255;w=v+4|0;E=1919904879;a[w]=E&255;E=E>>8;a[w+1|0]=E&255;E=E>>8;a[w+2|0]=E&255;E=E>>8;a[w+3|0]=E&255;a[x+9|0]=0;g[B>>2]=ak;g[B+4>>2]=al;g[B+8>>2]=am;g[B+12>>2]=1.0;dU(y,A,B,1);if((a[z]&1)!=0){n6(c[A+8>>2]|0)}am=+g[5070];al=+g[5071];of(C|0,0,52);ak=+g[5054];g[C>>2]=ak;at=+g[5055];g[C+4>>2]=at;ai=+g[5056];g[C+8>>2]=ai;aj=+g[5057];g[C+12>>2]=aj;au=+g[5058];g[C+16>>2]=au;av=+g[5059];g[C+20>>2]=av;aw=+g[5060];g[C+24>>2]=aw;ax=+g[5061];g[C+28>>2]=ax;ay=+g[5062];g[C+32>>2]=ay;az=+g[5063];g[C+36>>2]=az;aA=+g[5064];g[C+40>>2]=aA;aB=+g[5065];g[C+44>>2]=aB;aC=am*at+al*av+az*0.0+ +g[5067];az=am*ai+al*aw+aA*0.0+ +g[5068];aA=am*aj+al*ax+aB*0.0+ +g[5069];g[C+48>>2]=am*ak+al*au+ay*0.0+ +g[5066];g[C+52>>2]=aC;g[C+56>>2]=az;g[C+60>>2]=aA;dW(ab,ad,C)}C=c[aa>>2]|0;A=c[C>>2]|0;L3282:do{if((c[A>>2]|0)>0){z=D;B=D;y=z+1|0;x=z+9|0;z=F|0;w=F+4|0;v=F+8|0;r=F+12|0;as=G;u=G|0;s=G+4|0;f=G+8|0;t=G+12|0;q=G+16|0;n=G+20|0;o=G+24|0;p=G+28|0;m=G+32|0;l=G+36|0;ar=G+40|0;ag=G+44|0;ah=G+48|0;ao=G+52|0;an=G+56|0;aq=G+60|0;ap=H;aD=H;aE=ap+1|0;aF=ap+9|0;ap=H+8|0;aG=D+8|0;aH=0;aI=C;aK=A;L3284:while(1){if((c[aK+4>>2]|0)>0){aA=+(aH|0);aL=0;aM=aK;aN=aI;while(1){aO=a[(c[(c[aM+8>>2]|0)+(aH*12|0)>>2]|0)+aL|0]|0;if(aO<<24>>24==0){aP=aN}else{switch(aO&255|0){case 2:{aQ=-256;break};case 3:{aQ=-8586240;break};case 4:{aQ=-52429;break};case 5:{aQ=-10066177;break};case 6:{aQ=-23296;break};case 7:{aQ=-7077677;break};case 1:{aQ=-16711681;break};default:{break L3284}}aO=c[ac>>2]|0;a[B]=16;aR=y|0;E=1131966306;a[aR]=E&255;E=E>>8;a[aR+1|0]=E&255;E=E>>8;a[aR+2|0]=E&255;E=E>>8;a[aR+3|0]=E&255;aR=y+4|0;E=1919904879;a[aR]=E&255;E=E>>8;a[aR+1|0]=E&255;E=E>>8;a[aR+2|0]=E&255;E=E>>8;a[aR+3|0]=E&255;a[x]=0;g[z>>2]=+(aQ>>>16&255|0)/255.0;g[w>>2]=+(aQ>>>8&255|0)/255.0;g[v>>2]=+(aQ&255|0)/255.0;g[r>>2]=1.0;dU(aO,D,F,1);if((a[B]&1)!=0){n6(c[aG>>2]|0)}az=+(aL|0);of(as|0,0,52);aC=+g[5054];g[u>>2]=aC;ay=+g[5055];g[s>>2]=ay;au=+g[5056];g[f>>2]=au;al=+g[5057];g[t>>2]=al;ak=+g[5058];g[q>>2]=ak;am=+g[5059];g[n>>2]=am;aB=+g[5060];g[o>>2]=aB;ax=+g[5061];g[p>>2]=ax;aj=+g[5062];g[m>>2]=aj;aw=+g[5063];g[l>>2]=aw;ai=+g[5064];g[ar>>2]=ai;av=+g[5065];g[ag>>2]=av;at=aA*ay+az*am+aw*0.0+ +g[5067];aw=aA*au+az*aB+ai*0.0+ +g[5068];ai=aA*al+az*ax+av*0.0+ +g[5069];g[ah>>2]=aA*aC+az*ak+aj*0.0+ +g[5066];g[ao>>2]=at;g[an>>2]=aw;g[aq>>2]=ai;aO=c[ac>>2]|0;a[aD]=16;aR=aE|0;E=1701080941;a[aR]=E&255;E=E>>8;a[aR+1|0]=E&255;E=E>>8;a[aR+2|0]=E&255;E=E>>8;a[aR+3|0]=E&255;aR=aE+4|0;E=1952533868;a[aR]=E&255;E=E>>8;a[aR+1|0]=E&255;E=E>>8;a[aR+2|0]=E&255;E=E>>8;a[aR+3|0]=E&255;a[aF]=0;dX(aO,H,G,1,0);if((a[aD]&1)!=0){n6(c[ap>>2]|0)}bm(4,0,c[5426]|0);aP=c[aa>>2]|0}aO=aL+1|0;aR=c[aP>>2]|0;if((aO|0)<(c[aR+4>>2]|0)){aL=aO;aM=aR;aN=aP}else{aS=aP;aT=aR;break}}}else{aS=aI;aT=aK}aN=aH+1|0;if((aN|0)<(c[aT>>2]|0)){aH=aN;aI=aS;aK=aT}else{break L3282}}aK=cx(4)|0;c[aK>>2]=2272;bL(aK|0,12808,0)}}while(0);dY(ae,af,10,20);aT=c[ac>>2]|0;aS=I;aP=I;a[aP]=16;G=aS+1|0;H=G|0;E=1701080941;a[H]=E&255;E=E>>8;a[H+1|0]=E&255;E=E>>8;a[H+2|0]=E&255;E=E>>8;a[H+3|0]=E&255;H=G+4|0;E=1952533868;a[H]=E&255;E=E>>8;a[H+1|0]=E&255;E=E>>8;a[H+2|0]=E&255;E=E>>8;a[H+3|0]=E&255;a[aS+9|0]=0;c[J>>2]=0;g[J>>2]=1.0;of(J+4|0,0,16);g[J+20>>2]=1.0;of(J+24|0,0,16);g[J+40>>2]=1.0;of(J+44|0,0,16);g[J+60>>2]=1.0;dX(aT,I,J,1,0);if((a[aP]&1)!=0){n6(c[I+8>>2]|0)}I=c[ac>>2]|0;aP=K;J=K;a[J]=16;aT=aP+1|0;aS=aT|0;E=1131966306;a[aS]=E&255;E=E>>8;a[aS+1|0]=E&255;E=E>>8;a[aS+2|0]=E&255;E=E>>8;a[aS+3|0]=E&255;aS=aT+4|0;E=1919904879;a[aS]=E&255;E=E>>8;a[aS+1|0]=E&255;E=E>>8;a[aS+2|0]=E&255;E=E>>8;a[aS+3|0]=E&255;a[aP+9|0]=0;g[L>>2]=0.0;g[L+4>>2]=.3333333432674408;g[L+8>>2]=0.0;g[L+12>>2]=1.0;dU(I,K,L,1);if((a[J]&1)!=0){n6(c[K+8>>2]|0)}bm(4,0,c[5426]|0);if(k){dT(ae,af);cq(3042);k=c[ac>>2]|0;K=M;J=M;a[J]=16;L=K+1|0;I=L|0;E=1131966306;a[I]=E&255;E=E>>8;a[I+1|0]=E&255;E=E>>8;a[I+2|0]=E&255;E=E>>8;a[I+3|0]=E&255;I=L+4|0;E=1919904879;a[I]=E&255;E=E>>8;a[I+1|0]=E&255;E=E>>8;a[I+2|0]=E&255;E=E>>8;a[I+3|0]=E&255;a[K+9|0]=0;g[N>>2]=1.0;g[N+4>>2]=1.0;g[N+8>>2]=1.0;g[N+12>>2]=.3333333432674408;dU(k,M,N,1);if((a[J]&1)!=0){n6(c[M+8>>2]|0)}M=c[aa>>2]|0;aA=+(c[M+12>>2]|0);ai=+(c[M+16>>2]|0);of(O|0,0,52);aw=+g[5054];g[O>>2]=aw;at=+g[5055];g[O+4>>2]=at;aj=+g[5056];g[O+8>>2]=aj;ak=+g[5057];g[O+12>>2]=ak;az=+g[5058];g[O+16>>2]=az;aC=+g[5059];g[O+20>>2]=aC;av=+g[5060];g[O+24>>2]=av;ax=+g[5061];g[O+28>>2]=ax;al=+g[5062];g[O+32>>2]=al;aB=+g[5063];g[O+36>>2]=aB;au=+g[5064];g[O+40>>2]=au;am=+g[5065];g[O+44>>2]=am;ay=aA*at+ai*aC+aB*0.0+ +g[5067];aB=aA*aj+ai*av+au*0.0+ +g[5068];au=aA*ak+ai*ax+am*0.0+ +g[5069];g[O+48>>2]=aA*aw+ai*az+al*0.0+ +g[5066];g[O+52>>2]=ay;g[O+56>>2]=aB;g[O+60>>2]=au;M=c[ac>>2]|0;J=P;N=P;a[N]=16;k=J+1|0;K=k|0;E=1701080941;a[K]=E&255;E=E>>8;a[K+1|0]=E&255;E=E>>8;a[K+2|0]=E&255;E=E>>8;a[K+3|0]=E&255;K=k+4|0;E=1952533868;a[K]=E&255;E=E>>8;a[K+1|0]=E&255;E=E>>8;a[K+2|0]=E&255;E=E>>8;a[K+3|0]=E&255;a[J+9|0]=0;dX(M,P,O,1,0);if((a[N]&1)!=0){n6(c[P+8>>2]|0)}dW(ab,ad,O);bR(3042)}fa(Q,b+68|0);bS(256);if((j|0)!=0){dT(ae,af);switch(d[j|0]|0){case 2:{aU=-256;break};case 3:{aU=-8586240;break};case 4:{aU=-52429;break};case 5:{aU=-10066177;break};case 6:{aU=-23296;break};case 7:{aU=-7077677;break};case 1:{aU=-16711681;break};default:{b=cx(4)|0;c[b>>2]=2272;bL(b|0,12808,0)}}b=c[ac>>2]|0;O=R;ad=R;a[ad]=16;P=O+1|0;N=P|0;E=1131966306;a[N]=E&255;E=E>>8;a[N+1|0]=E&255;E=E>>8;a[N+2|0]=E&255;E=E>>8;a[N+3|0]=E&255;N=P+4|0;E=1919904879;a[N]=E&255;E=E>>8;a[N+1|0]=E&255;E=E>>8;a[N+2|0]=E&255;E=E>>8;a[N+3|0]=E&255;a[O+9|0]=0;g[S>>2]=+(aU>>>16&255|0)/255.0;g[S+4>>2]=+(aU>>>8&255|0)/255.0;g[S+8>>2]=+(aU&255|0)/255.0;g[S+12>>2]=1.0;dU(b,R,S,1);if((a[ad]&1)!=0){n6(c[R+8>>2]|0)}of(T|0,0,48);au=+g[Q>>2];aB=+g[Q+4>>2];ay=+g[Q+8>>2];al=+g[Q+12>>2];az=+g[Q+16>>2];ai=+g[Q+20>>2];aw=+g[Q+24>>2];aA=+g[Q+28>>2];am=+g[Q+32>>2];ax=+g[Q+36>>2];ak=+g[Q+40>>2];av=+g[Q+44>>2];aj=au*.4000000059604645+az*.30000001192092896+am*-1.0+ +g[Q+48>>2];aC=aB*.4000000059604645+ai*.30000001192092896+ax*-1.0+ +g[Q+52>>2];at=ay*.4000000059604645+aw*.30000001192092896+ak*-1.0+ +g[Q+56>>2];aV=al*.4000000059604645+aA*.30000001192092896+av*-1.0+ +g[Q+60>>2];g[T>>2]=au*.05000000074505806;g[T+4>>2]=aB*.05000000074505806;g[T+8>>2]=ay*.05000000074505806;g[T+12>>2]=al*.05000000074505806;g[T+16>>2]=az*.05000000074505806;g[T+20>>2]=ai*.05000000074505806;g[T+24>>2]=aw*.05000000074505806;g[T+28>>2]=aA*.05000000074505806;g[T+32>>2]=am*.009999999776482582;g[T+36>>2]=ax*.009999999776482582;g[T+40>>2]=ak*.009999999776482582;g[T+44>>2]=av*.009999999776482582;g[T+48>>2]=aj;g[T+52>>2]=aC;g[T+56>>2]=at;g[T+60>>2]=aV;dW(ab,j,T)}dZ(ae,af);af=U;ae=U;a[ae]=8;T=af+1|0;E=1415071054;a[T]=E&255;E=E>>8;a[T+1|0]=E&255;E=E>>8;a[T+2|0]=E&255;E=E>>8;a[T+3|0]=E&255;a[af+5|0]=0;af=c[ac>>2]|0;g[V>>2]=8.0;g[V+4>>2]=8.0;g[V+8>>2]=-20.0;g[W>>2]=.20000000298023224;g[W+4>>2]=.20000000298023224;g[W+8>>2]=.20000000298023224;d_(0,U,af,-23245,V,W,Q,2);if((a[ae]&1)!=0){n6(c[U+8>>2]|0)}U=X;ae=X;a[ae]=10;W=U+1|0;a[W]=a[4272]|0;a[W+1|0]=a[4273]|0;a[W+2|0]=a[4274]|0;a[W+3|0]=a[4275]|0;a[W+4|0]=a[4276]|0;a[U+6|0]=0;U=c[ac>>2]|0;g[Y>>2]=8.0;g[Y+4>>2]=0.0;g[Y+8>>2]=-20.0;g[Z>>2]=.20000000298023224;g[Z+4>>2]=.20000000298023224;g[Z+8>>2]=.20000000298023224;d_(0,X,U,-23245,Y,Z,Q,2);if((a[ae]&1)!=0){n6(c[X+8>>2]|0)}X=c[(c[aa>>2]|0)+28>>2]|0;aa=c[ac>>2]|0;g[_>>2]=8.0;g[_+4>>2]=-1.5;g[_+8>>2]=-20.0;g[$>>2]=.20000000298023224;g[$+4>>2]=.20000000298023224;g[$+8>>2]=.20000000298023224;d$(0,X,6,aa,-52429,_,$,Q,2);aJ();i=e;return}function e6(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=i;i=i+8|0;f=e|0;switch(d&255|0){case 97:{d=c[b+136>>2]|0;g=d+104|0;j=c[g>>2]|0;k=d+100|0;l=c[k>>2]|0;if((j|0)==(l|0)){m=0}else{m=(j-l<<8)-1|0}n=d+112|0;o=c[n>>2]|0;p=d+116|0;q=c[p>>2]|0;if((m|0)==(q+o|0)){dM(d+96|0);r=c[p>>2]|0;s=c[n>>2]|0;t=c[k>>2]|0;u=c[g>>2]|0}else{r=q;s=o;t=l;u=j}j=r+s|0;do{if((u|0)==(t|0)){v=r}else{s=(c[t+(j>>>10<<2)>>2]|0)+((j&1023)<<2)|0;if((s|0)==0){v=r;break}c[s>>2]=1;v=c[p>>2]|0}}while(0);c[p>>2]=v+1;i=e;return};case 119:{v=c[b+136>>2]|0;p=v+104|0;r=c[p>>2]|0;j=v+100|0;t=c[j>>2]|0;if((r|0)==(t|0)){w=0}else{w=(r-t<<8)-1|0}u=v+112|0;s=c[u>>2]|0;l=v+116|0;o=c[l>>2]|0;if((w|0)==(o+s|0)){dM(v+96|0);x=c[l>>2]|0;y=c[u>>2]|0;z=c[j>>2]|0;A=c[p>>2]|0}else{x=o;y=s;z=t;A=r}r=x+y|0;do{if((A|0)==(z|0)){B=x}else{y=(c[z+(r>>>10<<2)>>2]|0)+((r&1023)<<2)|0;if((y|0)==0){B=x;break}c[y>>2]=3;B=c[l>>2]|0}}while(0);c[l>>2]=B+1;i=e;return};case 100:{B=c[b+136>>2]|0;l=B+104|0;x=c[l>>2]|0;r=B+100|0;z=c[r>>2]|0;if((x|0)==(z|0)){C=0}else{C=(x-z<<8)-1|0}A=B+112|0;y=c[A>>2]|0;t=B+116|0;s=c[t>>2]|0;if((C|0)==(s+y|0)){dM(B+96|0);D=c[t>>2]|0;E=c[A>>2]|0;F=c[r>>2]|0;G=c[l>>2]|0}else{D=s;E=y;F=z;G=x}x=D+E|0;do{if((G|0)==(F|0)){H=D}else{E=(c[F+(x>>>10<<2)>>2]|0)+((x&1023)<<2)|0;if((E|0)==0){H=D;break}c[E>>2]=0;H=c[t>>2]|0}}while(0);c[t>>2]=H+1;i=e;return};case 115:{H=c[b+136>>2]|0;t=H+104|0;D=c[t>>2]|0;x=H+100|0;F=c[x>>2]|0;if((D|0)==(F|0)){I=0}else{I=(D-F<<8)-1|0}G=H+112|0;E=c[G>>2]|0;z=H+116|0;y=c[z>>2]|0;if((I|0)==(y+E|0)){dM(H+96|0);J=c[z>>2]|0;K=c[G>>2]|0;L=c[x>>2]|0;M=c[t>>2]|0}else{J=y;K=E;L=F;M=D}D=J+K|0;do{if((M|0)==(L|0)){N=J}else{K=(c[L+(D>>>10<<2)>>2]|0)+((D&1023)<<2)|0;if((K|0)==0){N=J;break}c[K>>2]=2;N=c[z>>2]|0}}while(0);c[z>>2]=N+1;i=e;return};case 112:{N=c[b+136>>2]|0;b=N+80|0;if((a[b]&1)==0){b3(f|0,0)|0;h[N+72>>3]=+(c[f>>2]|0)+ +(c[f+4>>2]|0)*1.0e-6;a[b]=1;i=e;return}else{dI(N,1);i=e;return}break};default:{i=e;return}}}function e7(b,d,e,f,h,j,k){b=b|0;d=d|0;e=e|0;f=+f;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0;l=i;i=i+72|0;m=l|0;n=l+24|0;o=l+48|0;a[b|0]=1;p=d|0;g[b+4>>2]=+g[p>>2];q=d+4|0;g[b+8>>2]=+g[q>>2];g[b+12>>2]=+g[p>>2];g[b+16>>2]=+g[q>>2];g[b+20>>2]=+g[e>>2];g[b+24>>2]=+g[e+4>>2];g[b+28>>2]=f;g[b+32>>2]=0.0;e=b+40|0;q=c[h+16>>2]|0;do{if((q|0)==0){c[n+16>>2]=0}else{if((q|0)==(h|0)){p=n;c[n+16>>2]=p;cU[c[(c[q>>2]|0)+12>>2]&127](q,p);break}else{c[n+16>>2]=cY[c[(c[q>>2]|0)+8>>2]&255](q)|0;break}}}while(0);fE(n,e);e=c[n+16>>2]|0;do{if((e|0)==(n|0)){cT[c[(c[e>>2]|0)+16>>2]&511](e)}else{if((e|0)==0){break}cT[c[(c[e>>2]|0)+20>>2]&511](e)}}while(0);e=b+64|0;n=c[j+16>>2]|0;do{if((n|0)==0){c[m+16>>2]=0}else{if((n|0)==(j|0)){q=m;c[m+16>>2]=q;cU[c[(c[n>>2]|0)+12>>2]&127](n,q);break}else{c[m+16>>2]=cY[c[(c[n>>2]|0)+8>>2]&255](n)|0;break}}}while(0);fD(m,e);e=c[m+16>>2]|0;do{if((e|0)==(m|0)){cT[c[(c[e>>2]|0)+16>>2]&511](e)}else{if((e|0)==0){break}cT[c[(c[e>>2]|0)+20>>2]&511](e)}}while(0);e=b+88|0;b=c[k+16>>2]|0;do{if((b|0)==0){c[o+16>>2]=0}else{if((b|0)==(k|0)){m=o;c[o+16>>2]=m;cU[c[(c[b>>2]|0)+12>>2]&127](b,m);break}else{c[o+16>>2]=cY[c[(c[b>>2]|0)+8>>2]&255](b)|0;break}}}while(0);fC(o,e);e=c[o+16>>2]|0;if((e|0)==(o|0)){cT[c[(c[e>>2]|0)+16>>2]&511](e);i=l;return}if((e|0)==0){i=l;return}cT[c[(c[e>>2]|0)+20>>2]&511](e);i=l;return}function e8(b){b=b|0;var d=0,e=0,f=0,h=0,j=0,k=0.0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0;d=i;i=i+16|0;e=d|0;f=d+8|0;h=b|0;if((a[h]&1)==0){i=d;return}j=b+32|0;k=+g[j>>2]+1.0;g[j>>2]=k;l=b+28|0;g[e>>2]=k/+g[l>>2];m=c[b+56>>2]|0;if((m|0)==0){n=cx(4)|0;c[n>>2]=6936;bL(n|0,13784,178)}k=+cQ[c[(c[m>>2]|0)+24>>2]&3](m,e);o=1.0-k;p=o*+g[b+12>>2]+k*+g[b+20>>2];q=o*+g[b+16>>2]+k*+g[b+24>>2];g[b+4>>2]=p;g[b+8>>2]=q;g[f>>2]=p;g[f+4>>2]=q;e=c[b+80>>2]|0;if((e|0)==0){m=cx(4)|0;c[m>>2]=6936;bL(m|0,13784,178)}cU[c[(c[e>>2]|0)+24>>2]&127](e,f);if(+g[j>>2]<+g[l>>2]){i=d;return}a[h]=0;h=c[b+104>>2]|0;if((h|0)==0){b=cx(4)|0;c[b>>2]=6936;bL(b|0,13784,178)}cT[c[(c[h>>2]|0)+24>>2]&511](h);i=d;return}function e9(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0.0,f=0.0,h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0;e=+g[b>>2];f=+g[c>>2]-e;h=+g[b+4>>2];i=+g[c+4>>2]-h;j=+g[b+8>>2];k=+g[c+8>>2]-j;l=f*f+i*i+k*k;if(l<=0.0){cj(2664,2504,149,4744)}m=1.0/+Y(l);l=f*m;f=i*m;i=k*m;m=+g[d>>2];k=+g[d+4>>2];n=+g[d+8>>2];o=m*m+k*k+n*n;if(o<=0.0){cj(2664,2504,149,4744)}p=1.0/+Y(o);o=m*p;m=k*p;k=n*p;p=f*k-i*m;n=i*o-l*k;k=l*m-f*o;o=k*k+(p*p+n*n);if(o>0.0){m=1.0/+Y(o);o=p*m;p=n*m;n=k*m;m=i*p-f*n;k=l*n-i*o;q=f*o-l*p;of(a|0,0,56);d=a|0;c=a+16|0;of(a+4|0,0,12);b=a+32|0;of(a+24|0,0,12);r=a+48|0;of(a+44|0,0,12);g[a+60>>2]=1.0;g[d>>2]=o;g[c>>2]=p;g[b>>2]=n;g[d+4>>2]=m;g[c+4>>2]=k;g[b+4>>2]=q;g[d+8>>2]=-0.0-l;g[c+8>>2]=-0.0-f;g[b+8>>2]=-0.0-i;g[r>>2]=-0.0-(o*e+p*h+n*j);g[r+4>>2]=-0.0-(m*e+k*h+q*j);g[r+8>>2]=l*e+f*h+i*j;return}else{cj(2664,2504,149,4744)}}function fa(a,b){a=a|0;b=b|0;var c=0,d=0.0,e=0,f=0.0,h=0.0,i=0.0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0;c=b+32|0;d=+g[c+8>>2];e=b+48|0;f=+g[e+12>>2];h=+g[e+8>>2];i=+g[c+12>>2];j=d*f-h*i;k=b+16|0;l=+g[k+8>>2];m=+g[k+12>>2];n=f*l-h*m;o=i*l-d*m;p=+g[c+4>>2];q=+g[e+4>>2];r=f*p-i*q;s=+g[k+4>>2];t=f*s-m*q;u=i*s-m*p;v=h*p-d*q;w=h*s-l*q;x=d*s-l*p;y=+g[c>>2];z=+g[e>>2];A=f*y-i*z;B=+g[k>>2];C=f*B-m*z;f=i*B-m*y;i=h*y-d*z;D=h*B-l*z;h=d*B-l*y;d=q*y-p*z;E=q*B-s*z;z=p*B-s*y;k=b|0;y=+g[k>>2];p=+g[k+4>>2];q=+g[k+8>>2];F=+g[k+12>>2];G=m*v+(j*s-l*r);H=(m*i+(j*B-l*A))*-1.0;I=m*d+(r*B-s*A);m=(l*d+(v*B-s*i))*-1.0;of(a|0,0,56);s=G*y+H*p+I*q+m*F;g[a>>2]=G/s;g[a+4>>2]=(j*p-r*q+v*F)*-1.0/s;g[a+8>>2]=(n*p-t*q+w*F)/s;g[a+12>>2]=(o*p-u*q+x*F)*-1.0/s;g[a+16>>2]=H/s;g[a+20>>2]=(j*y-A*q+i*F)/s;g[a+24>>2]=(n*y-C*q+D*F)*-1.0/s;g[a+28>>2]=(o*y-f*q+h*F)/s;g[a+32>>2]=I/s;g[a+36>>2]=(r*y-A*p+d*F)*-1.0/s;g[a+40>>2]=(t*y-p*C+E*F)/s;g[a+44>>2]=(u*y-p*f+z*F)*-1.0/s;g[a+48>>2]=m/s;g[a+52>>2]=(v*y-i*p+d*q)/s;g[a+56>>2]=(w*y-p*D+E*q)*-1.0/s;g[a+60>>2]=(x*y-p*h+z*q)/s;return}function fb(a){a=a|0;return}function fc(a){a=a|0;n6(a);return}function fd(a){a=a|0;var b=0,d=0;b=n4(8)|0;if((b|0)==0){d=b;return d|0}c[b>>2]=8120;c[b+4>>2]=c[a+4>>2];d=b;return d|0}function fe(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=8120;c[b+4>>2]=c[a+4>>2];return}function ff(a){a=a|0;return}function fg(a){a=a|0;n6(a);return}function fh(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=c[(c[b+4>>2]|0)+136>>2]|0;a[f+80|0]=0;b3(e|0,0)|0;b=f+56|0;h[b>>3]=+(c[e>>2]|0)+ +(c[e+4>>2]|0)*1.0e-6-(+h[f+72>>3]- +h[b>>3]);i=d;return}function fi(a,b){a=a|0;b=b|0;var d=0;if((c[b+4>>2]|0)!=8616){d=0;return d|0}d=a+4|0;return d|0}function fj(a){a=a|0;return 12656}function fk(a){a=a|0;return}function fl(a){a=a|0;n6(a);return}function fm(a){a=a|0;a=n4(8)|0;if((a|0)!=0){c[a>>2]=8232}return a|0}function fn(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=8232;return}function fo(a){a=a|0;return}function fp(a){a=a|0;n6(a);return}function fq(a,b){a=a|0;b=b|0;var c=0.0;c=+g[b+4>>2];g[5070]=+g[b>>2];g[5071]=c;return}function fr(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==8680?a+4|0:0)|0}function fs(a){a=a|0;return 12672}function ft(a){a=a|0;return}function fu(a){a=a|0;n6(a);return}function fv(a){a=a|0;a=n4(8)|0;if((a|0)!=0){c[a>>2]=8176}return a|0}function fw(a,b){a=a|0;b=b|0;if((b|0)==0){return}c[b>>2]=8176;return}function fx(a){a=a|0;return}function fy(a){a=a|0;n6(a);return}function fz(a,b){a=a|0;b=b|0;return+(+g[b>>2])}function fA(a,b){a=a|0;b=b|0;return((c[b+4>>2]|0)==8648?a+4|0:0)|0}function fB(a){a=a|0;return 12664}function fC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=e|0;g=a+16|0;h=c[g>>2]|0;j=a;a=b+16|0;k=c[a>>2]|0;l=b;m=(k|0)==(l|0);if((h|0)!=(j|0)){if(!m){c[g>>2]=k;c[a>>2]=h;i=d;return}cU[c[(c[b>>2]|0)+12>>2]&127](l,j);l=c[a>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);c[a>>2]=c[g>>2];c[g>>2]=j;i=d;return}j=c[(c[h>>2]|0)+12>>2]|0;if(!m){m=b;cU[j&127](h,m);l=c[g>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);l=b+16|0;c[g>>2]=c[l>>2];c[l>>2]=m;i=d;return}cU[j&127](h,f);j=c[g>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[g>>2]=0;j=c[a>>2]|0;cU[c[(c[j>>2]|0)+12>>2]&127](j,h);j=c[a>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[a>>2]=0;c[g>>2]=h;cU[c[(c[e>>2]|0)+12>>2]&127](f,k);cT[c[(c[e>>2]|0)+16>>2]&511](f);c[a>>2]=k;i=d;return}function fD(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=e|0;g=a+16|0;h=c[g>>2]|0;j=a;a=b+16|0;k=c[a>>2]|0;l=b;m=(k|0)==(l|0);if((h|0)!=(j|0)){if(!m){c[g>>2]=k;c[a>>2]=h;i=d;return}cU[c[(c[b>>2]|0)+12>>2]&127](l,j);l=c[a>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);c[a>>2]=c[g>>2];c[g>>2]=j;i=d;return}j=c[(c[h>>2]|0)+12>>2]|0;if(!m){m=b;cU[j&127](h,m);l=c[g>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);l=b+16|0;c[g>>2]=c[l>>2];c[l>>2]=m;i=d;return}cU[j&127](h,f);j=c[g>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[g>>2]=0;j=c[a>>2]|0;cU[c[(c[j>>2]|0)+12>>2]&127](j,h);j=c[a>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[a>>2]=0;c[g>>2]=h;cU[c[(c[e>>2]|0)+12>>2]&127](f,k);cT[c[(c[e>>2]|0)+16>>2]&511](f);c[a>>2]=k;i=d;return}function fE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+16|0;e=d|0;f=e|0;g=a+16|0;h=c[g>>2]|0;j=a;a=b+16|0;k=c[a>>2]|0;l=b;m=(k|0)==(l|0);if((h|0)!=(j|0)){if(!m){c[g>>2]=k;c[a>>2]=h;i=d;return}cU[c[(c[b>>2]|0)+12>>2]&127](l,j);l=c[a>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);c[a>>2]=c[g>>2];c[g>>2]=j;i=d;return}j=c[(c[h>>2]|0)+12>>2]|0;if(!m){m=b;cU[j&127](h,m);l=c[g>>2]|0;cT[c[(c[l>>2]|0)+16>>2]&511](l);l=b+16|0;c[g>>2]=c[l>>2];c[l>>2]=m;i=d;return}cU[j&127](h,f);j=c[g>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[g>>2]=0;j=c[a>>2]|0;cU[c[(c[j>>2]|0)+12>>2]&127](j,h);j=c[a>>2]|0;cT[c[(c[j>>2]|0)+16>>2]&511](j);c[a>>2]=0;c[g>>2]=h;cU[c[(c[e>>2]|0)+12>>2]&127](f,k);cT[c[(c[e>>2]|0)+16>>2]&511](f);c[a>>2]=k;i=d;return}function fF(a){a=a|0;var b=0,d=0,e=0;b=a|0;c[b>>2]=8496;d=c[a+248>>2]|0;do{if((d|0)==(a+232|0)){cT[c[(c[d>>2]|0)+16>>2]&511](d)}else{if((d|0)==0){break}cT[c[(c[d>>2]|0)+20>>2]&511](d)}}while(0);d=c[a+224>>2]|0;do{if((d|0)==(a+208|0)){cT[c[(c[d>>2]|0)+16>>2]&511](d)}else{if((d|0)==0){break}cT[c[(c[d>>2]|0)+20>>2]&511](d)}}while(0);d=c[a+200>>2]|0;do{if((d|0)==(a+184|0)){cT[c[(c[d>>2]|0)+16>>2]&511](d)}else{if((d|0)==0){break}cT[c[(c[d>>2]|0)+20>>2]&511](d)}}while(0);c[b>>2]=8376;b=c[a+136>>2]|0;if((b|0)==0){e=a|0;eL(e);return}e2(b);n6(b);e=a|0;eL(e);return}function fG(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+32|0;d=b|0;e=b+16|0;f=n4(44)|0;g=n4(400)|0;h=d+8|0;c[h>>2]=g;c[d>>2]=401;c[d+4>>2]=397;oe(g|0,1584,397)|0;a[g+397|0]=0;g=n4(576)|0;j=e+8|0;c[j>>2]=g;c[e>>2]=577;c[e+4>>2]=561;oe(g|0,984,561)|0;a[g+561|0]=0;fH(f,d,e);if((a[e]&1)!=0){n6(c[j>>2]|0)}if((a[d]&1)==0){i=b;return f|0}n6(c[h>>2]|0);i=b;return f|0}function fH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+32|0;h=f|0;j=f+16|0;of(b|0,0,16);g[b+16>>2]=1.0;of(b+20|0,0,16);g[b+36>>2]=1.0;c[b+40>>2]=0;k=d;if((a[k]&1)==0){l=h;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];c[l+8>>2]=c[k+8>>2]}else{k=c[d+8>>2]|0;l=c[d+4>>2]|0;if(l>>>0>4294967279>>>0){gQ(0)}if(l>>>0<11>>>0){a[h]=l<<1&255;m=h+1|0}else{d=l+16&-16;n=n4(d)|0;c[h+8>>2]=n;c[h>>2]=d|1;c[h+4>>2]=l;m=n}oe(m|0,k|0,l)|0;a[m+l|0]=0}l=e;if((a[l]&1)==0){m=j;c[m>>2]=c[l>>2];c[m+4>>2]=c[l+4>>2];c[m+8>>2]=c[l+8>>2]}else{l=c[e+8>>2]|0;m=c[e+4>>2]|0;if(m>>>0>4294967279>>>0){gQ(0)}if(m>>>0<11>>>0){a[j]=m<<1&255;o=j+1|0}else{e=m+16&-16;k=n4(e)|0;c[j+8>>2]=k;c[j>>2]=e|1;c[j+4>>2]=m;o=k}oe(o|0,l|0,m)|0;a[o+m|0]=0}fI(b,h,j);if((a[j]&1)!=0){n6(c[j+8>>2]|0)}if((a[h]&1)!=0){n6(c[h+8>>2]|0)}fJ(b);i=f;return}function fI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;c[k>>2]=0;c[l>>2]=0;m=b+40|0;c[m>>2]=cA()|0;if((a[d]&1)==0){n=d+1|0}else{n=c[d+8>>2]|0}if(!(fP(b,k,35633,n)|0)){n=fQ(dt(21288,912)|0,d)|0;hd(j,n+(c[(c[n>>2]|0)-12>>2]|0)|0);d=lF(j,21192)|0;o=cV[c[(c[d>>2]|0)+28>>2]&63](d,10)|0;lE(j);hY(n,o)|0;hL(n)|0;i=f;return}if((a[e]&1)==0){p=e+1|0}else{p=c[e+8>>2]|0}if(!(fP(b,l,35632,p)|0)){p=fQ(dt(21288,856)|0,e)|0;hd(h,p+(c[(c[p>>2]|0)-12>>2]|0)|0);e=lF(h,21192)|0;n=cV[c[(c[e>>2]|0)+28>>2]&63](e,10)|0;lE(h);hY(p,n)|0;hL(p)|0;i=f;return}p=c[k>>2]|0;bs(c[m>>2]|0,p|0);k=c[l>>2]|0;bs(c[m>>2]|0,k|0);if(fR(b)|0){aV(c[m>>2]|0,p|0);aV(c[m>>2]|0,k|0);cy(p|0);cy(k|0);i=f;return}b=dt(21288,776)|0;hd(g,b+(c[(c[b>>2]|0)-12>>2]|0)|0);l=lF(g,21192)|0;n=cV[c[(c[l>>2]|0)+28>>2]&63](l,10)|0;lE(g);hY(b,n)|0;hL(b)|0;if((p|0)!=0){cy(p|0)}if((k|0)!=0){cy(k|0)}k=c[m>>2]|0;if((k|0)==0){i=f;return}bn(k|0);c[m>>2]=0;i=f;return}function fJ(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=i;i=i+656|0;e=d|0;f=d+8|0;g=d+272|0;h=d+280|0;j=d+288|0;k=d+304|0;l=d+336|0;m=d+592|0;n=d+600|0;o=d+608|0;p=d+624|0;q=b+40|0;bc(c[q>>2]|0,35718,e|0);bc(c[q>>2]|0,35719,f|0);L3695:do{if((c[e>>2]|0)>0){r=d+16|0;s=b|0;t=j;u=j+1|0;v=k|0;w=k;x=k+12|0;y=k+16|0;z=k+20|0;A=k+24|0;B=j+8|0;C=k+8|0;D=j|0;E=j+4|0;F=0;while(1){of(r|0,0,255);cH(c[q>>2]|0,F|0,255,0,g|0,h|0,r|0);G=bh(c[q>>2]|0,r|0)|0;H=og(r|0)|0;if(H>>>0>4294967279>>>0){break}if(H>>>0<11>>>0){a[t]=H<<1&255;I=u}else{J=H+16&-16;K=n4(J)|0;c[B>>2]=K;c[D>>2]=J|1;c[E>>2]=H;I=K}oe(I|0,r|0,H)|0;a[I+H|0]=0;H=fK(s,j)|0;fL(v,r,G,c[h>>2]|0,c[g>>2]|0);G=H;if((a[G]&1)==0){a[H+1|0]=0;a[G]=0}else{a[c[H+8>>2]|0]=0;c[H+4>>2]=0}gY(H|0,0);c[G>>2]=c[w>>2];c[G+4>>2]=c[w+4>>2];c[G+8>>2]=c[w+8>>2];of(w|0,0,12);c[H+12>>2]=c[x>>2];c[H+16>>2]=c[y>>2];c[H+20>>2]=c[z>>2];c[H+24>>2]=c[A>>2];if((a[w]&1)!=0){n6(c[C>>2]|0)}if((a[t]&1)!=0){n6(c[B>>2]|0)}F=F+1|0;if((F|0)>=(c[e>>2]|0)){break L3695}}gQ(0)}}while(0);bc(c[q>>2]|0,35721,e|0);bc(c[q>>2]|0,35722,f|0);if((c[e>>2]|0)<=0){i=d;return}f=l|0;l=b+20|0;b=o;g=o+1|0;h=p|0;j=p;I=p+12|0;k=p+16|0;F=p+20|0;B=p+24|0;t=o+8|0;C=p+8|0;p=o|0;w=o+4|0;A=0;while(1){of(f|0,0,255);a7(c[q>>2]|0,A|0,255,0,m|0,n|0,f|0);z=cw(c[q>>2]|0,f|0)|0;y=og(f|0)|0;if(y>>>0>4294967279>>>0){L=3363;break}if(y>>>0<11>>>0){a[b]=y<<1&255;M=g}else{x=y+16&-16;r=n4(x)|0;c[t>>2]=r;c[p>>2]=x|1;c[w>>2]=y;M=r}oe(M|0,f|0,y)|0;a[M+y|0]=0;y=dS(l,o)|0;fL(h,f,z,c[n>>2]|0,c[m>>2]|0);z=y;if((a[z]&1)==0){a[y+1|0]=0;a[z]=0}else{a[c[y+8>>2]|0]=0;c[y+4>>2]=0}gY(y|0,0);c[z>>2]=c[j>>2];c[z+4>>2]=c[j+4>>2];c[z+8>>2]=c[j+8>>2];of(j|0,0,12);c[y+12>>2]=c[I>>2];c[y+16>>2]=c[k>>2];c[y+20>>2]=c[F>>2];c[y+24>>2]=c[B>>2];if((a[j]&1)!=0){n6(c[C>>2]|0)}if((a[b]&1)!=0){n6(c[t>>2]|0)}y=A+1|0;if((y|0)<(c[e>>2]|0)){A=y}else{L=3384;break}}if((L|0)==3363){gQ(0)}else if((L|0)==3384){i=d;return}}function fK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=b|0;eq(f,h,d);b=c[f>>2]|0;if((b|0)!=0){j=b;k=j+20|0;i=e;return k|0}b=d;d=n4(48)|0;f=d+8|0;if((f|0)!=0){c[f>>2]=c[b>>2];c[f+4>>2]=c[b+4>>2];c[f+8>>2]=c[b+8>>2];of(b|0,0,12)}b=d+20|0;if((b|0)!=0){a[b]=0;a[d+21|0]=0;c[d+32>>2]=0;c[d+36>>2]=0;c[d+44>>2]=0}fM(g,h,d);j=c[g>>2]|0;k=j+20|0;i=e;return k|0}function fL(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;h=og(d|0)|0;if(h>>>0>4294967279>>>0){gQ(0)}if(h>>>0<11>>>0){a[b]=h<<1&255;i=b+1|0}else{j=h+16&-16;k=n4(j)|0;c[b+8>>2]=k;c[b>>2]=j|1;c[b+4>>2]=h;i=k}oe(i|0,d|0,h)|0;a[i+h|0]=0;c[b+12>>2]=e;c[b+16>>2]=f;c[b+24>>2]=g;if((f|0)==35667){c[b+20>>2]=8;return}else if((f|0)==35666){c[b+20>>2]=16;return}else if((f|0)==5124){c[b+20>>2]=4;return}else if((f|0)==5126){c[b+20>>2]=4;return}else if((f|0)==35664){c[b+20>>2]=8;return}else if((f|0)==35672){c[b+20>>2]=3;return}else if((f|0)==35668){c[b+20>>2]=12;return}else if((f|0)==35665){c[b+20>>2]=12;return}else if((f|0)==35670){c[b+20>>2]=1;return}else if((f|0)==35673){c[b+20>>2]=4;return}else if((f|0)==35669){c[b+20>>2]=16;return}else if((f|0)==35674){c[b+20>>2]=16;return}else if((f|0)==35675){c[b+20>>2]=36;return}else if((f|0)==35676){c[b+20>>2]=64;return}else if((f|0)==35678){c[b+20>>2]=4;return}else if((f|0)==35680){c[b+20>>2]=4;return}else if((f|0)==35671){c[b+20>>2]=2;return}else{b=cx(4)|0;c[b>>2]=944;bL(b|0,12808,0)}}function fM(b,e,f){b=b|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0.0,Q=0,R=0,S=0,T=0;h=f+8|0;i=h;j=a[h]|0;h=(j&1)==0;if(h){k=i+1|0}else{k=c[f+16>>2]|0}l=j&255;j=(l&1|0)==0;if(j){m=l>>>1}else{m=c[f+12>>2]|0}if(m>>>0>3>>>0){n=m;o=k;p=m;while(1){q=o;r=ai(d[q]|d[q+1|0]<<8|d[q+2|0]<<16|d[q+3|0]<<24|0,1540483477)|0;q=(ai(r>>>24^r,1540483477)|0)^(ai(n,1540483477)|0);r=o+4|0;s=p-4|0;if(s>>>0>3>>>0){n=q;o=r;p=s}else{t=q;u=r;v=s;break}}}else{t=m;u=k;v=m}if((v|0)==3){w=d[u+2|0]<<16^t;x=3458}else if((v|0)==1){y=t;x=3459}else if((v|0)==2){w=t;x=3458}else{z=t}if((x|0)==3458){y=d[u+1|0]<<8^w;x=3459}if((x|0)==3459){z=ai(d[u]^y,1540483477)|0}y=ai(z>>>13^z,1540483477)|0;z=y>>>15^y;y=f+4|0;c[y>>2]=z;u=e+4|0;w=c[u>>2]|0;t=(w|0)==0;L3822:do{if(t){A=0}else{v=w-1|0;m=(v&w|0)!=0;if(m){B=(z>>>0)%(w>>>0)|0}else{B=z&v}k=c[(c[e>>2]|0)+(B<<2)>>2]|0;if((k|0)==0){A=B;break}p=c[k>>2]|0;if((p|0)==0){A=B;break}k=i+1|0;o=f+16|0;n=f+12|0;s=p;L3830:while(1){p=c[s+4>>2]|0;if(m){C=(p>>>0)%(w>>>0)|0}else{C=p&v}if((C|0)!=(B|0)){A=B;break L3822}p=s+8|0;r=p;q=a[p]|0;p=q&255;if((p&1|0)==0){D=p>>>1}else{D=c[s+12>>2]|0}if(j){E=l>>>1}else{E=c[n>>2]|0}L3845:do{if((D|0)==(E|0)){p=(q&1)==0;if(p){F=r+1|0}else{F=c[s+16>>2]|0}if(h){G=k}else{G=c[o>>2]|0}if(!p){if((oj(F|0,G|0,D|0)|0)==0){H=s;I=0;x=3505;break L3830}else{break}}if((D|0)==0){H=s;I=0;x=3504;break L3830}else{J=G;K=F;L=D}while(1){if((a[K]|0)!=(a[J]|0)){break L3845}p=L-1|0;if((p|0)==0){H=s;I=0;x=3506;break L3830}else{J=J+1|0;K=K+1|0;L=p}}}}while(0);r=c[s>>2]|0;if((r|0)==0){A=B;break L3822}else{s=r}}if((x|0)==3504){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}else if((x|0)==3505){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}else if((x|0)==3506){M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}}}while(0);x=e+12|0;O=+(((c[x>>2]|0)+1|0)>>>0>>>0);P=+g[e+16>>2];do{if(O>+(w>>>0>>>0)*P|t){if(w>>>0>2>>>0){Q=(w-1&w|0)!=0|0}else{Q=1}B=Q|w<<1;L=~~+ah(O/P);fN(e,B>>>0<L>>>0?L:B);B=c[u>>2]|0;L=c[y>>2]|0;K=B-1|0;if((K&B|0)==0){R=L&K;S=B;break}else{R=(L>>>0)%(B>>>0)|0;S=B;break}}else{R=A;S=w}}while(0);w=e|0;A=c[(c[w>>2]|0)+(R<<2)>>2]|0;do{if((A|0)==0){y=e+8|0;u=y|0;Q=f|0;c[Q>>2]=c[u>>2];c[u>>2]=f;c[(c[w>>2]|0)+(R<<2)>>2]=y;y=c[Q>>2]|0;if((y|0)==0){break}Q=c[y+4>>2]|0;y=S-1|0;if((y&S|0)==0){T=Q&y}else{T=(Q>>>0)%(S>>>0)|0}c[(c[w>>2]|0)+(T<<2)>>2]=f}else{Q=A|0;c[f>>2]=c[Q>>2];c[Q>>2]=f}}while(0);c[x>>2]=(c[x>>2]|0)+1;H=f;I=1;M=b|0;c[M>>2]=H;N=b+4|0;a[N]=I;return}function fN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;do{if((b|0)==1){d=2}else{if((b-1&b|0)==0){d=b;break}d=gO(b)|0}}while(0);b=c[a+4>>2]|0;if(d>>>0>b>>>0){fO(a,d);return}if(d>>>0>=b>>>0){return}do{if(b>>>0>2>>>0){if((b-1&b|0)!=0){e=3517;break}f=1<<32-(oi(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2])-1|0)|0)}else{e=3517}}while(0);if((e|0)==3517){f=gO(~~+ah(+((c[a+12>>2]|0)>>>0>>>0)/+g[a+16>>2]))|0}e=d>>>0<f>>>0?f:d;if(e>>>0>=b>>>0){return}fO(a,e);return}function fO(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=(d|0)!=0;if(e){f=n4(d<<2)|0}else{f=0}g=b|0;h=c[g>>2]|0;c[g>>2]=f;if((h|0)!=0){n6(h)}c[b+4>>2]=d;if(e){i=0}else{return}do{c[(c[g>>2]|0)+(i<<2)>>2]=0;i=i+1|0;}while(i>>>0<d>>>0);i=b+8|0;b=c[i>>2]|0;if((b|0)==0){return}e=c[b+4>>2]|0;h=d-1|0;f=(h&d|0)!=0;if(f){j=(e>>>0)%(d>>>0)|0}else{j=e&h}c[(c[g>>2]|0)+(j<<2)>>2]=i;i=b|0;e=c[i>>2]|0;if((e|0)==0){return}else{k=b;l=j;m=i;n=e}L3928:while(1){e=k;i=m;j=n;L3930:while(1){o=j;while(1){b=c[o+4>>2]|0;if(f){p=(b>>>0)%(d>>>0)|0}else{p=b&h}if((p|0)==(l|0)){break}q=(c[g>>2]|0)+(p<<2)|0;if((c[q>>2]|0)==0){break L3930}b=o|0;r=c[b>>2]|0;L3940:do{if((r|0)==0){s=b;t=0}else{u=o+8|0;v=a[u]|0;w=v&255;x=(w&1|0)==0;y=w>>>1;w=u+1|0;u=o+16|0;z=o+12|0;A=b;B=r;while(1){if(x){C=y}else{C=c[z>>2]|0}D=B+8|0;E=a[D]|0;F=E&255;if((F&1|0)==0){G=F>>>1}else{G=c[B+12>>2]|0}if((C|0)!=(G|0)){s=A;t=B;break L3940}F=(v&1)==0;if(F){H=w}else{H=c[u>>2]|0}if((E&1)==0){I=D+1|0}else{I=c[B+16>>2]|0}do{if(F){if((C|0)==0){break}else{J=I;K=H;L=C}while(1){if((a[K]|0)!=(a[J]|0)){s=A;t=B;break L3940}D=L-1|0;if((D|0)==0){break}else{J=J+1|0;K=K+1|0;L=D}}}else{if((oj(H|0,I|0,C|0)|0)!=0){s=A;t=B;break L3940}}}while(0);F=B|0;D=c[F>>2]|0;if((D|0)==0){s=F;t=0;break}else{A=F;B=D}}}}while(0);c[i>>2]=t;c[s>>2]=c[c[(c[g>>2]|0)+(p<<2)>>2]>>2];c[c[(c[g>>2]|0)+(p<<2)>>2]>>2]=o;r=c[i>>2]|0;if((r|0)==0){M=3571;break L3928}else{o=r}}r=o|0;b=c[r>>2]|0;if((b|0)==0){M=3569;break L3928}else{e=o;i=r;j=b}}c[q>>2]=e;j=o|0;i=c[j>>2]|0;if((i|0)==0){M=3570;break}else{k=o;l=p;m=j;n=i}}if((M|0)==3569){return}else if((M|0)==3570){return}else if((M|0)==3571){return}}function fP(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+48|0;g=b|0;h=b+8|0;j=b+16|0;k=b+32|0;l=b+40|0;c[k>>2]=f;f=a5(e|0)|0;bN(f|0,1,k|0,0);aY(f|0);bH(f|0,35713,l|0);if((c[l>>2]|0)!=0){m=1;n=f;c[d>>2]=n;i=b;return m|0}l=n4(32)|0;oe(l|0,616,18)|0;a[l+18|0]=0;k=j;e=n4(32)|0;o=j+8|0;c[o>>2]=e;c[j>>2]=33;c[j+4>>2]=18;oe(e|0,l|0,18)|0;a[e+18|0]=0;c[h>>2]=0;bH(f|0,35716,h|0);e=c[h>>2]|0;if((e|0)>1){p=n$(e)|0;cl(f|0,e|0,h|0,p|0);h=dt(dt(fQ(21288,j)|0,672)|0,p)|0;hd(g,h+(c[(c[h>>2]|0)-12>>2]|0)|0);j=lF(g,21192)|0;e=cV[c[(c[j>>2]|0)+28>>2]&63](j,10)|0;lE(g);hY(h,e)|0;hL(h)|0;n0(p);if((a[k]&1)!=0){q=3587}}else{q=3587}if((q|0)==3587){n6(c[o>>2]|0)}n6(l);cy(f|0);m=0;n=0;c[d>>2]=n;i=b;return m|0}function fQ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=g|0;a[k]=0;c[g+4>>2]=b;l=b;m=c[(c[l>>2]|0)-12>>2]|0;n=b;do{if((c[n+(m+16)>>2]|0)==0){o=c[n+(m+72)>>2]|0;if((o|0)!=0){hL(o)|0}a[k]=1;o=d;p=a[d]|0;q=p&255;if((q&1|0)==0){r=q>>>1}else{r=c[d+4>>2]|0}q=c[(c[l>>2]|0)-12>>2]|0;c[h>>2]=c[n+(q+24)>>2];s=(p&1)==0;if(s){t=o+1|0}else{t=c[d+8>>2]|0}do{if((c[n+(q+4)>>2]&176|0)==32){if(s){u=o+1+r|0;v=3614;break}else{w=(c[d+8>>2]|0)+r|0;v=3613;break}}else{if(s){u=o+1|0;v=3614;break}else{w=c[d+8>>2]|0;v=3613;break}}}while(0);if((v|0)==3613){x=c[d+8>>2]|0;y=w}else if((v|0)==3614){x=o+1|0;y=u}s=n+q|0;p=n+(q+76)|0;z=c[p>>2]|0;if((z|0)==-1){hd(f,s);A=lF(f,21192)|0;B=cV[c[(c[A>>2]|0)+28>>2]&63](A,32)|0;lE(f);c[p>>2]=B<<24>>24;C=B}else{C=z&255}du(j,h,t,y,x+r|0,s,C);if((c[j>>2]|0)!=0){break}s=c[(c[l>>2]|0)-12>>2]|0;hb(n+s|0,c[n+(s+16)>>2]|5)}}while(0);hW(g);i=e;return b|0}function fR(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+40|0;e=d|0;f=d+8|0;g=d+16|0;h=d+32|0;j=b+40|0;aP(c[j>>2]|0);bc(c[j>>2]|0,35714,h|0);if((c[h>>2]|0)!=0){k=1;i=d;return k|0}h=c[j>>2]|0;j=n4(32)|0;oe(j|0,720,16)|0;a[j+16|0]=0;b=g;l=n4(32)|0;m=g+8|0;c[m>>2]=l;c[g>>2]=33;c[g+4>>2]=16;oe(l|0,j|0,16)|0;a[l+16|0]=0;c[f>>2]=0;bc(h|0,35716,f|0);l=c[f>>2]|0;if((l|0)>1){n=n$(l)|0;by(h|0,l|0,f|0,n|0);f=dt(dt(fQ(21288,g)|0,672)|0,n)|0;hd(e,f+(c[(c[f>>2]|0)-12>>2]|0)|0);g=lF(e,21192)|0;l=cV[c[(c[g>>2]|0)+28>>2]&63](g,10)|0;lE(e);hY(f,l)|0;hL(f)|0;n0(n);if((a[b]&1)!=0){o=3649}}else{o=3649}if((o|0)==3649){n6(c[m>>2]|0)}n6(j);k=0;i=d;return k|0}function fS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;if((b|0)!=0){return}b=c[3772]|0;c6[c[(c[b>>2]|0)+20>>2]&31](b,a,d,e);return}function fT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((a|0)==101){e=119}else if((a|0)==102){e=100}else if((a|0)==100){e=97}else if((a|0)==103){e=115}else{e=0}a=c[3772]|0;cU[c[(c[a>>2]|0)+16>>2]&127](a,e);return}function fU(a,b,d){a=a|0;b=b|0;d=d|0;d=c[3772]|0;cU[c[(c[d>>2]|0)+16>>2]&127](d,a);return}function fV(){var a=0;a=c[3772]|0;cT[c[(c[a>>2]|0)+12>>2]&511](a);return}function fW(){of(21680|0,0|0,16|0);g[5424]=1.0;bf(332,21680,w|0)|0;a[21736]=6;a[21737]=a[4720]|0;a[21738]=a[4721]|0;a[21739]=a[4722]|0;a[21740]=0;bf(354,21736,w|0)|0;return}function fX(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+32|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=c[o>>2]|0;gh(20560,h,20688);c[5388]=7444;c[5390]=7464;c[5389]=0;he(21560,20560);c[5408]=0;c[5409]=-1;j=c[u>>2]|0;c[5116]=7224;lC(20468);of(20472,0,24);c[5116]=7592;c[5124]=j;lD(g,20468);k=lF(g,20888)|0;l=k;lE(g);c[5125]=l;c[5126]=20696;a[20508]=(cY[c[(c[k>>2]|0)+28>>2]&255](l)|0)&1;c[5322]=7348;c[5323]=7368;he(21292,20464);c[5341]=0;c[5342]=-1;l=c[s>>2]|0;c[5128]=7224;lC(20516);of(20520,0,24);c[5128]=7592;c[5136]=l;lD(f,20516);k=lF(f,20888)|0;g=k;lE(f);c[5137]=g;c[5138]=20704;a[20556]=(cY[c[(c[k>>2]|0)+28>>2]&255](g)|0)&1;c[5366]=7348;c[5367]=7368;he(21468,20512);c[5385]=0;c[5386]=-1;g=c[(c[(c[5366]|0)-12>>2]|0)+21488>>2]|0;c[5344]=7348;c[5345]=7368;he(21380,g);c[5363]=0;c[5364]=-1;c[(c[(c[5388]|0)-12>>2]|0)+21624>>2]=21288;g=(c[(c[5366]|0)-12>>2]|0)+21468|0;c[g>>2]=c[g>>2]|8192;c[(c[(c[5366]|0)-12>>2]|0)+21536>>2]=21288;f3(20408,h,20712);c[5300]=7396;c[5302]=7416;c[5301]=0;he(21208,20408);c[5320]=0;c[5321]=-1;c[5078]=7152;lC(20316);of(20320,0,24);c[5078]=7520;c[5086]=j;lD(e,20316);j=lF(e,20880)|0;h=j;lE(e);c[5087]=h;c[5088]=20720;a[20356]=(cY[c[(c[j>>2]|0)+28>>2]&255](h)|0)&1;c[5230]=7300;c[5231]=7320;he(20924,20312);c[5249]=0;c[5250]=-1;c[5090]=7152;lC(20364);of(20368,0,24);c[5090]=7520;c[5098]=l;lD(d,20364);l=lF(d,20880)|0;h=l;lE(d);c[5099]=h;c[5100]=20728;a[20404]=(cY[c[(c[l>>2]|0)+28>>2]&255](h)|0)&1;c[5274]=7300;c[5275]=7320;he(21100,20360);c[5293]=0;c[5294]=-1;h=c[(c[(c[5274]|0)-12>>2]|0)+21120>>2]|0;c[5252]=7300;c[5253]=7320;he(21012,h);c[5271]=0;c[5272]=-1;c[(c[(c[5300]|0)-12>>2]|0)+21272>>2]=20920;h=(c[(c[5274]|0)-12>>2]|0)+21100|0;c[h>>2]=c[h>>2]|8192;c[(c[(c[5274]|0)-12>>2]|0)+21168>>2]=20920;i=b;return}function fY(a){a=a|0;hL(21288)|0;hL(21376)|0;hR(20920)|0;hR(21008)|0;return}function fZ(a){a=a|0;c[a>>2]=7152;lE(a+4|0);return}function f_(a){a=a|0;c[a>>2]=7152;lE(a+4|0);n6(a);return}function f$(b,d){b=b|0;d=d|0;var e=0;cY[c[(c[b>>2]|0)+24>>2]&255](b)|0;e=lF(d,20880)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(cY[c[(c[e>>2]|0)+28>>2]&255](d)|0)&1;return}function f0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=c5[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((bG(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=3714;break}if((l|0)==2){m=-1;n=3713;break}else if((l|0)!=1){n=3710;break}}if((n|0)==3710){m=((aR(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==3714){i=b;return m|0}else if((n|0)==3713){i=b;return m|0}return 0}function f1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((a[b+44|0]&1)!=0){f=bG(d|0,4,e|0,c[b+32>>2]|0)|0;return f|0}g=b;if((e|0)>0){h=d;i=0}else{f=0;return f|0}while(1){if((cV[c[(c[g>>2]|0)+52>>2]&63](b,c[h>>2]|0)|0)==-1){f=i;j=3723;break}d=i+1|0;if((d|0)<(e|0)){h=h+4|0;i=d}else{f=d;j=3721;break}}if((j|0)==3723){return f|0}else if((j|0)==3721){return f|0}return 0}function f2(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L4111:do{if(!k){c[g>>2]=d;if((a[b+44|0]&1)!=0){if((bG(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+4|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=c0[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=3737;break}if((v|0)==3){w=3731;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=3741;break}v=(c[h>>2]|0)-r|0;if((bG(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=3739;break}if(u){t=u?c[j>>2]|0:t}else{break L4111}}if((w|0)==3741){i=e;return l|0}else if((w|0)==3731){if((bG(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==3737){i=e;return l|0}else if((w|0)==3739){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function f3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=7152;j=b+4|0;lC(j);of(b+8|0,0,24);c[h>>2]=7920;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;lD(g,j);j=lF(g,20880)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=cY[c[(c[j>>2]|0)+24>>2]&255](e)|0;e=c[d>>2]|0;a[b+53|0]=(cY[c[(c[e>>2]|0)+28>>2]&255](e)|0)&1;if((c[h>>2]|0)<=8){lE(g);i=f;return}kY(184);lE(g);i=f;return}function f4(a){a=a|0;c[a>>2]=7152;lE(a+4|0);return}function f5(a){a=a|0;c[a>>2]=7152;lE(a+4|0);n6(a);return}function f6(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=lF(d,20880)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=cY[c[(c[e>>2]|0)+24>>2]&255](d)|0;d=c[f>>2]|0;a[b+53|0]=(cY[c[(c[d>>2]|0)+28>>2]&255](d)|0)&1;if((c[g>>2]|0)<=8){return}kY(184);return}function f7(a){a=a|0;return ga(a,0)|0}function f8(a){a=a|0;return ga(a,1)|0}function f9(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L4154:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=c0[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+4|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L4154}r=o-1|0;c[g>>2]=r;if((ce(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function ga(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;if((a[k]&1)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;L4174:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=bb(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o&255;l=l+1|0;if((l|0)>=(k|0)){break L4174}}i=e;return n|0}}while(0);L4181:do{if((a[b+53|0]&1)==0){l=b+40|0;m=b+36|0;o=f|0;p=g+4|0;q=b+32|0;r=k;while(1){s=c[l>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[m>>2]|0;w=f+r|0;x=c0[c[(c[t>>2]|0)+16>>2]&31](t,s,o,w,h,g,p,j)|0;if((x|0)==3){y=3788;break}else if((x|0)==2){n=-1;y=3805;break}else if((x|0)!=1){z=r;break L4181}x=c[l>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){n=-1;y=3798;break}v=bb(c[q>>2]|0)|0;if((v|0)==-1){n=-1;y=3797;break}a[w]=v&255;r=r+1|0}if((y|0)==3788){c[g>>2]=a[o]|0;z=r;break}else if((y|0)==3797){i=e;return n|0}else if((y|0)==3798){i=e;return n|0}else if((y|0)==3805){i=e;return n|0}}else{c[g>>2]=a[f|0]|0;z=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=z;while(1){if((b|0)<=0){break}z=b-1|0;if((ce(a[f+z|0]|0,c[d>>2]|0)|0)==-1){n=-1;y=3802;break}else{b=z}}if((y|0)==3802){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function gb(a){a=a|0;c[a>>2]=7224;lE(a+4|0);return}function gc(a){a=a|0;c[a>>2]=7224;lE(a+4|0);n6(a);return}function gd(b,d){b=b|0;d=d|0;var e=0;cY[c[(c[b>>2]|0)+24>>2]&255](b)|0;e=lF(d,20888)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(cY[c[(c[e>>2]|0)+28>>2]&255](d)|0)&1;return}function ge(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=c5[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((bG(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=3816;break}if((l|0)==2){m=-1;n=3815;break}else if((l|0)!=1){n=3812;break}}if((n|0)==3816){i=b;return m|0}else if((n|0)==3812){m=((aR(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==3815){i=b;return m|0}return 0}function gf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((a[b+44|0]&1)!=0){g=bG(e|0,1,f|0,c[b+32>>2]|0)|0;return g|0}h=b;if((f|0)>0){i=e;j=0}else{g=0;return g|0}while(1){if((cV[c[(c[h>>2]|0)+52>>2]&63](b,d[i]|0)|0)==-1){g=j;k=3823;break}e=j+1|0;if((e|0)<(f|0)){i=i+1|0;j=e}else{g=e;k=3825;break}}if((k|0)==3825){return g|0}else if((k|0)==3823){return g|0}return 0}function gg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L4232:do{if(!k){a[g]=d&255;if((a[b+44|0]&1)!=0){if((bG(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+1|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=c0[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=3843;break}if((v|0)==3){w=3833;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=3840;break}v=(c[h>>2]|0)-r|0;if((bG(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=3844;break}if(u){t=u?c[j>>2]|0:t}else{break L4232}}if((w|0)==3833){if((bG(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==3840){i=e;return l|0}else if((w|0)==3844){i=e;return l|0}else if((w|0)==3843){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function gh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=7224;j=b+4|0;lC(j);of(b+8|0,0,24);c[h>>2]=7992;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;lD(g,j);j=lF(g,20888)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=cY[c[(c[j>>2]|0)+24>>2]&255](e)|0;e=c[d>>2]|0;a[b+53|0]=(cY[c[(c[e>>2]|0)+28>>2]&255](e)|0)&1;if((c[h>>2]|0)<=8){lE(g);i=f;return}kY(184);lE(g);i=f;return}function gi(a){a=a|0;c[a>>2]=7224;lE(a+4|0);return}function gj(a){a=a|0;c[a>>2]=7224;lE(a+4|0);n6(a);return}function gk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=lF(d,20888)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=cY[c[(c[e>>2]|0)+24>>2]&255](d)|0;d=c[f>>2]|0;a[b+53|0]=(cY[c[(c[d>>2]|0)+28>>2]&255](d)|0)&1;if((c[g>>2]|0)<=8){return}kY(184);return}function gl(a){a=a|0;return go(a,0)|0}function gm(a){a=a|0;return go(a,1)|0}function gn(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L4275:do{if(l){a[h]=c[n>>2]&255;o=c[b+36>>2]|0;p=f|0;q=c0[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+1|0,j,p,f+8|0,g)|0;if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}else if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L4275}r=o-1|0;c[g>>2]=r;if((ce(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function go(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=b+52|0;if((a[l]&1)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;L4295:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=bb(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p&255;m=m+1|0;if((m|0)>=(l|0)){break L4295}}i=f;return o|0}}while(0);L4302:do{if((a[b+53|0]&1)==0){m=b+40|0;n=b+36|0;p=g|0;q=h+1|0;r=b+32|0;s=l;while(1){t=c[m>>2]|0;u=t;v=c[u>>2]|0;w=c[u+4>>2]|0;u=c[n>>2]|0;x=g+s|0;y=c0[c[(c[u>>2]|0)+16>>2]&31](u,t,p,x,j,h,q,k)|0;if((y|0)==3){z=3890;break}else if((y|0)==2){o=-1;z=3902;break}else if((y|0)!=1){A=s;break L4302}y=c[m>>2]|0;c[y>>2]=v;c[y+4>>2]=w;if((s|0)==8){o=-1;z=3903;break}w=bb(c[r>>2]|0)|0;if((w|0)==-1){o=-1;z=3900;break}a[x]=w&255;s=s+1|0}if((z|0)==3890){a[h]=a[p]|0;A=s;break}else if((z|0)==3900){i=f;return o|0}else if((z|0)==3902){i=f;return o|0}else if((z|0)==3903){i=f;return o|0}}else{a[h]=a[g|0]|0;A=l}}while(0);do{if(e){l=a[h]|0;c[b+48>>2]=l&255;B=l}else{l=b+32|0;k=A;while(1){if((k|0)<=0){z=3897;break}j=k-1|0;if((ce(d[g+j|0]|0|0,c[l>>2]|0)|0)==-1){o=-1;z=3904;break}else{k=j}}if((z|0)==3897){B=a[h]|0;break}else if((z|0)==3904){i=f;return o|0}}}while(0);o=B&255;i=f;return o|0}function gp(){fX(0);bf(206,21640,w|0)|0;return}function gq(a){a=a|0;return}function gr(a){a=a|0;var b=0;b=a+4|0;K=c[b>>2]|0,c[b>>2]=K+1,K;return}function gs(a){a=a|0;var b=0,d=0;b=a+4|0;if(((K=c[b>>2]|0,c[b>>2]=K+ -1,K)|0)!=0){d=0;return d|0}cT[c[(c[a>>2]|0)+8>>2]&511](a);d=1;return d|0}function gt(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=5376;d=a+4|0;if((d|0)==0){return}a=og(b|0)|0;e=a+1|0;f=n5(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;oe(a|0,b|0,e)|0;return}function gu(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5376;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((K=c[d>>2]|0,c[d>>2]=K+ -1,K)-1|0)>=0){e=a;n6(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;n6(e);return}n7(d);e=a;n6(e);return}function gv(a){a=a|0;var b=0;c[a>>2]=5376;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((K=c[a>>2]|0,c[a>>2]=K+ -1,K)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}n7(a);return}function gw(a){a=a|0;return c[a+4>>2]|0}function gx(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;c[b>>2]=5280;e=b+4|0;if((e|0)==0){return}if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=og(f|0)|0;b=d+1|0;g=n5(d+13|0)|0;c[g+4>>2]=d;c[g>>2]=d;d=g+12|0;c[e>>2]=d;c[g+8>>2]=0;oe(d|0,f|0,b)|0;return}function gy(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=5280;d=a+4|0;if((d|0)==0){return}a=og(b|0)|0;e=a+1|0;f=n5(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;oe(a|0,b|0,e)|0;return}function gz(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5280;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((K=c[d>>2]|0,c[d>>2]=K+ -1,K)-1|0)>=0){e=a;n6(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;n6(e);return}n7(d);e=a;n6(e);return}function gA(a){a=a|0;var b=0;c[a>>2]=5280;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((K=c[a>>2]|0,c[a>>2]=K+ -1,K)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}n7(a);return}function gB(a){a=a|0;return c[a+4>>2]|0}function gC(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5376;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((K=c[d>>2]|0,c[d>>2]=K+ -1,K)-1|0)>=0){e=a;n6(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;n6(e);return}n7(d);e=a;n6(e);return}function gD(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5376;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((K=c[d>>2]|0,c[d>>2]=K+ -1,K)-1|0)>=0){e=a;n6(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;n6(e);return}n7(d);e=a;n6(e);return}function gE(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5280;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((K=c[d>>2]|0,c[d>>2]=K+ -1,K)-1|0)>=0){e=a;n6(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;n6(e);return}n7(d);e=a;n6(e);return}function gF(a){a=a|0;return}function gG(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function gH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;cS[c[(c[a>>2]|0)+12>>2]&15](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function gI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function gJ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;d=b9(e|0)|0;e=og(d|0)|0;if(e>>>0>4294967279>>>0){gQ(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;oe(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=n4(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;oe(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function gK(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;h=f;j=i;i=i+12|0;i=i+7&-8;k=e|0;l=c[k>>2]|0;do{if((l|0)!=0){m=d[h]|0;if((m&1|0)==0){n=m>>>1}else{n=c[f+4>>2]|0}if((n|0)==0){o=l}else{g_(f,3512,2)|0;o=c[k>>2]|0}m=c[e+4>>2]|0;cS[c[(c[m>>2]|0)+24>>2]&15](j,m,o);m=j;p=a[m]|0;if((p&1)==0){q=j+1|0}else{q=c[j+8>>2]|0}r=p&255;if((r&1|0)==0){s=r>>>1}else{s=c[j+4>>2]|0}g_(f,q,s)|0;if((a[m]&1)==0){break}n6(c[j+8>>2]|0)}}while(0);j=b;c[j>>2]=c[h>>2];c[j+4>>2]=c[h+4>>2];c[j+8>>2]=c[h+8>>2];of(h|0,0,12);i=g;return}function gL(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+16|0;j=og(e|0)|0;if(j>>>0>4294967279>>>0){gQ(0)}if(j>>>0<11>>>0){a[h]=j<<1&255;k=h+1|0}else{l=j+16&-16;m=n4(l)|0;c[h+8>>2]=m;c[h>>2]=l|1;c[h+4>>2]=j;k=m}oe(k|0,e|0,j)|0;a[k+j|0]=0;gK(g,d,h);gx(b|0,g);if((a[g]&1)!=0){n6(c[g+8>>2]|0)}if((a[h]&1)!=0){n6(c[h+8>>2]|0)}c[b>>2]=7488;h=d;d=b+8|0;b=c[h+4>>2]|0;c[d>>2]=c[h>>2];c[d+4>>2]=b;i=f;return}function gM(a){a=a|0;gA(a|0);n6(a);return}function gN(a){a=a|0;gA(a|0);return}function gO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if(a>>>0<212>>>0){b=14848;d=48;L4474:while(1){e=d;while(1){if((e|0)==0){break L4474}f=(e|0)/2|0;if((c[b+(f<<2)>>2]|0)>>>0<a>>>0){break}else{e=f}}b=b+(f+1<<2)|0;d=e-1-f|0}g=c[b>>2]|0;return g|0}if(a>>>0>4294967291>>>0){b=cx(8)|0;gy(b,808);c[b>>2]=5248;bL(b|0,12728,60);return 0}b=(a>>>0)/210|0;f=b*210|0;d=a-f|0;a=14656;h=48;L4487:while(1){i=h;while(1){if((i|0)==0){break L4487}j=(i|0)/2|0;if((c[a+(j<<2)>>2]|0)>>>0<d>>>0){break}else{i=j}}a=a+(j+1<<2)|0;h=i-1-j|0}j=a-14656>>2;a=b;b=j;h=(c[14656+(j<<2)>>2]|0)+f|0;L4494:while(1){f=5;while(1){if(f>>>0>=47>>>0){k=211;l=4064;break}j=c[14848+(f<<2)>>2]|0;d=(h>>>0)/(j>>>0)|0;if(d>>>0<j>>>0){g=h;l=4171;break L4494}if((h|0)==(ai(d,j)|0)){break}else{f=f+1|0}}L4500:do{if((l|0)==4064){while(1){l=0;f=(h>>>0)/(k>>>0)|0;if(f>>>0<k>>>0){g=h;l=4181;break L4494}if((h|0)==(ai(f,k)|0)){break L4500}f=k+10|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4182;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+12|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4183;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+16|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4184;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+18|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4185;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+22|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4186;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+28|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4187;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+30|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4188;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+36|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4189;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+40|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4190;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+42|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4191;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+46|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4192;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+52|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4193;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+58|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4194;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+60|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4195;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+66|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4196;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+70|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4197;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+72|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4198;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+78|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4199;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+82|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4200;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+88|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4201;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+96|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4202;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+100|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4203;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+102|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4204;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+106|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4176;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+108|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4162;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+112|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4163;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+120|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4165;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+126|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4168;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+130|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4180;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+136|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4167;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+138|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4166;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+142|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4175;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+148|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4173;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+150|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4174;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+156|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4172;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+162|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4178;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+166|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4179;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+168|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4206;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+172|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4170;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+178|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4208;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+180|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4205;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+186|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4209;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+190|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4210;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+192|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4207;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+196|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4211;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+198|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4177;break L4494}if((h|0)==(ai(i,f)|0)){break L4500}f=k+208|0;i=(h>>>0)/(f>>>0)|0;if(i>>>0<f>>>0){g=h;l=4169;break L4494}if((h|0)==(ai(i,f)|0)){break}else{k=k+210|0;l=4064}}}}while(0);f=b+1|0;i=(f|0)==48;j=i?0:f;f=(i&1)+a|0;a=f;b=j;h=(c[14656+(j<<2)>>2]|0)+(f*210|0)|0}if((l|0)==4162){return g|0}else if((l|0)==4163){return g|0}else if((l|0)==4165){return g|0}else if((l|0)==4166){return g|0}else if((l|0)==4167){return g|0}else if((l|0)==4168){return g|0}else if((l|0)==4174){return g|0}else if((l|0)==4175){return g|0}else if((l|0)==4176){return g|0}else if((l|0)==4177){return g|0}else if((l|0)==4169){return g|0}else if((l|0)==4170){return g|0}else if((l|0)==4171){return g|0}else if((l|0)==4172){return g|0}else if((l|0)==4173){return g|0}else if((l|0)==4187){return g|0}else if((l|0)==4188){return g|0}else if((l|0)==4189){return g|0}else if((l|0)==4190){return g|0}else if((l|0)==4191){return g|0}else if((l|0)==4183){return g|0}else if((l|0)==4184){return g|0}else if((l|0)==4185){return g|0}else if((l|0)==4186){return g|0}else if((l|0)==4178){return g|0}else if((l|0)==4179){return g|0}else if((l|0)==4180){return g|0}else if((l|0)==4181){return g|0}else if((l|0)==4182){return g|0}else if((l|0)==4192){return g|0}else if((l|0)==4193){return g|0}else if((l|0)==4194){return g|0}else if((l|0)==4195){return g|0}else if((l|0)==4196){return g|0}else if((l|0)==4197){return g|0}else if((l|0)==4210){return g|0}else if((l|0)==4211){return g|0}else if((l|0)==4198){return g|0}else if((l|0)==4199){return g|0}else if((l|0)==4200){return g|0}else if((l|0)==4201){return g|0}else if((l|0)==4202){return g|0}else if((l|0)==4203){return g|0}else if((l|0)==4204){return g|0}else if((l|0)==4205){return g|0}else if((l|0)==4206){return g|0}else if((l|0)==4207){return g|0}else if((l|0)==4208){return g|0}else if((l|0)==4209){return g|0}return 0}function gP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e;if((c[a>>2]|0)==1){do{a2(20640,20616)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){f;return}c[a>>2]=1;g;cT[d&511](b);h;c[a>>2]=-1;i;b1(20640)|0;return}function gQ(a){a=a|0;a=cx(8)|0;gt(a,296);c[a>>2]=5344;bL(a|0,12776,50)}function gR(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+8>>2]|0;f=c[d+4>>2]|0;if(f>>>0>4294967279>>>0){gQ(0)}if(f>>>0<11>>>0){a[b]=f<<1&255;g=b+1|0}else{d=f+16&-16;h=n4(d)|0;c[b+8>>2]=h;c[b>>2]=d|1;c[b+4>>2]=f;g=h}oe(g|0,e|0,f)|0;a[g+f|0]=0;return}function gS(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if(e>>>0>4294967279>>>0){gQ(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;oe(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=n4(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;oe(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function gT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if(d>>>0>4294967279>>>0){gQ(0)}if(d>>>0<11>>>0){a[b]=d<<1&255;f=b+1|0}else{g=d+16&-16;h=n4(g)|0;c[b+8>>2]=h;c[b>>2]=g|1;c[b+4>>2]=d;f=h}of(f|0,e|0,d|0);a[f+d|0]=0;return}function gU(b){b=b|0;if((a[b]&1)==0){return}n6(c[b+8>>2]|0);return}function gV(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=og(d|0)|0;f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0<e>>>0){h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}g$(b,i,e-i|0,k,0,k,e,d);return b|0}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}oh(l|0,d|0,e|0);a[l+e|0]=0;if((a[g]&1)==0){a[g]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function gW(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;g=a[f]|0;h=g&255;if((h&1|0)==0){i=h>>>1}else{i=c[b+4>>2]|0}if(i>>>0<d>>>0){h=d-i|0;gX(b,h,e)|0;return}if((g&1)==0){a[b+1+d|0]=0;a[f]=d<<1&255;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;return}}function gX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){return b|0}f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<d>>>0){g0(b,h,d-h+j|0,j,j,0,0);k=a[f]|0}else{k=i}if((k&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}of(l+j|0,e|0,d|0);e=j+d|0;if((a[f]&1)==0){a[f]=e<<1&255}else{c[b+4>>2]=e}a[l+e|0]=0;return b|0}function gY(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if(d>>>0>4294967279>>>0){gQ(0)}e=b;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}g=j>>>0>d>>>0?j:d;if(g>>>0<11>>>0){k=11}else{k=g+16&-16}g=k-1|0;if((g|0)==(h|0)){return}if((g|0)==10){l=e+1|0;m=c[b+8>>2]|0;n=1;o=0}else{if(g>>>0>h>>>0){p=n4(k)|0}else{p=n4(k)|0}h=i&1;if(h<<24>>24==0){q=e+1|0}else{q=c[b+8>>2]|0}l=p;m=q;n=h<<24>>24!=0;o=1}h=i&255;if((h&1|0)==0){r=h>>>1}else{r=c[b+4>>2]|0}h=r+1|0;oe(l|0,m|0,h)|0;if(n){n6(m)}if(o){c[b>>2]=k|1;c[b+4>>2]=j;c[b+8>>2]=l;return}else{a[f]=j<<1&255;return}}function gZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=10}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){g0(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+1|0;k=g+1|0;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}}function g_(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){g$(b,h,e-h+j|0,j,j,0,e,d);return b|0}if((e|0)==0){return b|0}if((i&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}i=k+j|0;oe(i|0,d|0,e)|0;d=j+e|0;if((a[f]&1)==0){a[f]=d<<1&255}else{c[b+4>>2]=d}a[k+d|0]=0;return b|0}function g$(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((-18-d|0)>>>0<e>>>0){gQ(0)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);e=n4(o)|0;if((g|0)!=0){oe(e|0,k|0,g)|0}if((i|0)!=0){n=e+g|0;oe(n|0,j|0,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g)|0;l=k+(h+g)|0;oe(n|0,l|0,f)|0}if((d|0)==10){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}n6(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}function g0(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((-17-d|0)>>>0<e>>>0){gQ(0)}if((a[b]&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<11>>>0){n=11;break}n=m+16&-16}else{n=-17}}while(0);e=n4(n)|0;if((g|0)!=0){oe(e|0,j|0,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g)|0;i=j+(h+g)|0;oe(m|0,i|0,f)|0}if((d|0)==10){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}n6(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function g1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(e>>>0>1073741807>>>0){gQ(0)}if(e>>>0<2>>>0){a[b]=e<<1&255;f=b+4|0;g=ny(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}else{i=e+4&-4;j=n4(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=e;f=j;g=ny(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}}function g2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(d>>>0>1073741807>>>0){gQ(0)}if(d>>>0<2>>>0){a[b]=d<<1&255;f=b+4|0;g=nA(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}else{i=d+4&-4;j=n4(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=d;f=j;g=nA(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}}function g3(b){b=b|0;if((a[b]&1)==0){return}n6(c[b+8>>2]|0);return}function g4(a,b){a=a|0;b=b|0;return g5(a,b,nx(b)|0)|0}function g5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(h>>>0<e>>>0){g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}g8(b,h,e-h|0,j,0,j,e,d);return b|0}if((i&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}nz(k,d,e)|0;c[k+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function g6(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if(d>>>0>1073741807>>>0){gQ(0)}e=b;f=a[e]|0;if((f&1)==0){g=1;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;if((f&1|0)==0){i=f>>>1}else{i=c[b+4>>2]|0}f=i>>>0>d>>>0?i:d;if(f>>>0<2>>>0){j=2}else{j=f+4&-4}f=j-1|0;if((f|0)==(g|0)){return}if((f|0)==1){k=b+4|0;l=c[b+8>>2]|0;m=1;n=0}else{d=j<<2;if(f>>>0>g>>>0){o=n4(d)|0}else{o=n4(d)|0}d=h&1;if(d<<24>>24==0){p=b+4|0}else{p=c[b+8>>2]|0}k=o;l=p;m=d<<24>>24!=0;n=1}d=k;k=h&255;if((k&1|0)==0){q=k>>>1}else{q=c[b+4>>2]|0}ny(d,l,q+1|0)|0;if(m){n6(l)}if(n){c[b>>2]=j|1;c[b+4>>2]=i;c[b+8>>2]=d;return}else{a[e]=i<<1&255;return}}function g7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=1}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){g9(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+4|0;k=g+1|0;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}}function g8(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((1073741806-d|0)>>>0<e>>>0){gQ(0)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<2>>>0){o=2;break}o=n+4&-4}else{o=1073741807}}while(0);e=n4(o<<2)|0;if((g|0)!=0){ny(e,k,g)|0}if((i|0)!=0){n=e+(g<<2)|0;ny(n,j,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g<<2)|0;l=k+(h+g<<2)|0;ny(n,l,f)|0}if((d|0)==1){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}n6(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}function g9(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((1073741807-d|0)>>>0<e>>>0){gQ(0)}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<2>>>0){n=2;break}n=m+4&-4}else{n=1073741807}}while(0);e=n4(n<<2)|0;if((g|0)!=0){ny(e,j,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g<<2)|0;i=j+(h+g<<2)|0;ny(m,i,f)|0}if((d|0)==1){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}n6(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function ha(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;of(g|0,0,12);h=og(e|0)|0;i=f;j=f;k=d[j]|0;if((k&1|0)==0){l=k>>>1}else{l=c[f+4>>2]|0}k=l+h|0;if(k>>>0>4294967279>>>0){gQ(0)}if(k>>>0<11>>>0){a[g]=h<<1&255;m=b+1|0}else{g=k+16&-16;k=n4(g)|0;c[b+8>>2]=k;c[b>>2]=g|1;c[b+4>>2]=h;m=k}oe(m|0,e|0,h)|0;a[m+h|0]=0;if((a[j]&1)==0){n=i+1|0}else{n=c[f+8>>2]|0}g_(b,n,l)|0;return}function hb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=(c[b+24>>2]|0)==0;if(g){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((g&1|d)&c[b+20>>2]|0)==0){i=e;return}e=cx(16)|0;do{if((a[21832]|0)==0){if((bx(21832)|0)==0){break}c[4274]=6888;bf(104,17096,w|0)|0}}while(0);b=om(17096,0,32)|0;c[f>>2]=b&0|1;c[f+4>>2]=M|0;gL(e,f,3728);c[e>>2]=6024;bL(e|0,13336,42)}function hc(a){a=a|0;var b=0,d=0,e=0,f=0;c[a>>2]=6e3;b=c[a+40>>2]|0;d=a+32|0;e=a+36|0;if((b|0)!=0){f=b;do{f=f-1|0;cS[c[(c[d>>2]|0)+(f<<2)>>2]&15](0,a,c[(c[e>>2]|0)+(f<<2)>>2]|0);}while((f|0)!=0)}lE(a+28|0);n0(c[d>>2]|0);n0(c[e>>2]|0);n0(c[a+48>>2]|0);n0(c[a+60>>2]|0);return}function hd(a,b){a=a|0;b=b|0;lD(a,b+28|0);return}function he(a,b){a=a|0;b=b|0;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;b=a+28|0;of(a+32|0,0,40);if((b|0)==0){return}lC(b);return}function hf(a){a=a|0;c[a>>2]=7224;lE(a+4|0);n6(a);return}function hg(a){a=a|0;c[a>>2]=7224;lE(a+4|0);return}function hh(a,b){a=a|0;b=b|0;return}function hi(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function hj(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function hk(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function hl(a){a=a|0;return 0}function hm(a){a=a|0;return 0}function hn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1;l=a[k]|0}else{k=cY[c[(c[f>>2]|0)+40>>2]&255](b)|0;if((k|0)==-1){g=d;m=4586;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=4585;break}}if((m|0)==4585){return g|0}else if((m|0)==4586){return g|0}return 0}function ho(a){a=a|0;return-1|0}function hp(a){a=a|0;var b=0,e=0;if((cY[c[(c[a>>2]|0)+36>>2]&255](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;b=d[a]|0;return b|0}function hq(a,b){a=a|0;b=b|0;return-1|0}function hr(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;if((f|0)<=0){h=0;return h|0}i=b+24|0;j=b+28|0;k=0;l=e;while(1){e=c[i>>2]|0;if(e>>>0<(c[j>>2]|0)>>>0){m=a[l]|0;c[i>>2]=e+1;a[e]=m}else{if((cV[c[(c[g>>2]|0)+52>>2]&63](b,d[l]|0)|0)==-1){h=k;n=4601;break}}m=k+1|0;if((m|0)<(f|0)){k=m;l=l+1|0}else{h=m;n=4603;break}}if((n|0)==4603){return h|0}else if((n|0)==4601){return h|0}return 0}function hs(a,b){a=a|0;b=b|0;return-1|0}function ht(a){a=a|0;c[a>>2]=7152;lE(a+4|0);n6(a);return}function hu(a){a=a|0;c[a>>2]=7152;lE(a+4|0);return}function hv(a,b){a=a|0;b=b|0;return}function hw(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function hx(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function hy(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function hz(a){a=a|0;return 0}function hA(a){a=a|0;return 0}function hB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4;k=c[j>>2]|0}else{j=cY[c[(c[e>>2]|0)+40>>2]&255](a)|0;if((j|0)==-1){f=b;l=4622;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=4621;break}}if((l|0)==4622){return f|0}else if((l|0)==4621){return f|0}return 0}function hC(a){a=a|0;return-1|0}function hD(a){a=a|0;var b=0,d=0;if((cY[c[(c[a>>2]|0)+36>>2]&255](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;b=c[a>>2]|0;return b|0}function hE(a,b){a=a|0;b=b|0;return-1|0}function hF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4;c[b>>2]=k}else{if((cV[c[(c[e>>2]|0)+52>>2]&63](a,c[j>>2]|0)|0)==-1){f=i;l=4637;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=4638;break}}if((l|0)==4637){return f|0}else if((l|0)==4638){return f|0}return 0}function hG(a,b){a=a|0;b=b|0;return-1|0}function hH(a){a=a|0;hc(a+8|0);n6(a);return}function hI(a){a=a|0;hc(a+8|0);return}function hJ(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;hc(b+(d+8)|0);n6(b+d|0);return}function hK(a){a=a|0;hc(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function hL(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){hL(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((cY[c[(c[k>>2]|0)+24>>2]&255](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;hb(h+k|0,c[h+(k+16)>>2]|1)}}while(0);hW(e);i=d;return b|0}function hM(a){a=a|0;var b=0;b=a+16|0;c[b>>2]=c[b>>2]|1;if((c[a+20>>2]&1|0)==0){return}else{a3()}}function hN(a){a=a|0;hc(a+8|0);n6(a);return}function hO(a){a=a|0;hc(a+8|0);return}function hP(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;hc(b+(d+8)|0);n6(b+d|0);return}function hQ(a){a=a|0;hc(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function hR(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){hR(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((cY[c[(c[k>>2]|0)+24>>2]&255](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;hb(h+k|0,c[h+(k+16)>>2]|1)}}while(0);h1(e);i=d;return b|0}function hS(a){a=a|0;hc(a+4|0);n6(a);return}function hT(a){a=a|0;hc(a+4|0);return}function hU(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;hc(b+(d+4)|0);n6(b+d|0);return}function hV(a){a=a|0;hc(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function hW(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bD()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((cY[c[(c[e>>2]|0)+24>>2]&255](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;hb(d+b|0,c[d+(b+16)>>2]|1);return}function hX(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=h|0;a[l]=0;c[h+4>>2]=b;m=b;n=c[(c[m>>2]|0)-12>>2]|0;o=b;do{if((c[o+(n+16)>>2]|0)==0){p=c[o+(n+72)>>2]|0;if((p|0)!=0){hL(p)|0}a[l]=1;lD(j,o+((c[(c[m>>2]|0)-12>>2]|0)+28)|0);p=lF(j,20840)|0;lE(j);q=c[(c[m>>2]|0)-12>>2]|0;r=c[o+(q+24)>>2]|0;s=o+(q+76)|0;t=c[s>>2]|0;if((t|0)==-1){lD(g,o+(q+28)|0);u=lF(g,21192)|0;v=cV[c[(c[u>>2]|0)+28>>2]&63](u,32)|0;lE(g);c[s>>2]=v<<24>>24;w=v}else{w=t&255}t=c[(c[p>>2]|0)+24>>2]|0;c[f>>2]=r;c3[t&63](k,p,f,o+q|0,w,d);if((c[k>>2]|0)!=0){break}q=c[(c[m>>2]|0)-12>>2]|0;hb(o+q|0,c[o+(q+16)>>2]|5)}}while(0);hW(h);i=e;return b|0}function hY(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+8|0;f=e|0;g=f|0;a[g]=0;c[f+4>>2]=b;h=b;j=c[(c[h>>2]|0)-12>>2]|0;k=b;do{if((c[k+(j+16)>>2]|0)==0){l=c[k+(j+72)>>2]|0;if((l|0)!=0){hL(l)|0}a[g]=1;l=c[k+((c[(c[h>>2]|0)-12>>2]|0)+24)>>2]|0;m=l;if((l|0)==0){n=m}else{o=l+24|0;p=c[o>>2]|0;if((p|0)==(c[l+28>>2]|0)){q=cV[c[(c[l>>2]|0)+52>>2]&63](m,d&255)|0}else{c[o>>2]=p+1;a[p]=d;q=d&255}n=(q|0)==-1?0:m}if((n|0)!=0){break}m=c[(c[h>>2]|0)-12>>2]|0;hb(k+m|0,c[k+(m+16)>>2]|1)}}while(0);hW(f);i=e;return b|0}function hZ(a){a=a|0;hc(a+4|0);n6(a);return}function h_(a){a=a|0;hc(a+4|0);return}function h$(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;hc(b+(d+4)|0);n6(b+d|0);return}function h0(a){a=a|0;hc(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function h1(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bD()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((cY[c[(c[e>>2]|0)+24>>2]&255](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;hb(d+b|0,c[d+(b+16)>>2]|1);return}function h2(a){a=a|0;return 4128}function h3(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)==1){gS(a,4376,35);return}else{gJ(a,b|0,c);return}}function h4(a){a=a|0;gF(a|0);return}function h5(a){a=a|0;gN(a|0);n6(a);return}function h6(a){a=a|0;gN(a|0);return}function h7(a){a=a|0;hc(a);n6(a);return}function h8(a){a=a|0;gF(a|0);n6(a);return}function h9(a){a=a|0;gq(a|0);n6(a);return}function ia(a){a=a|0;gq(a|0);return}function ib(a){a=a|0;gq(a|0);return}function ic(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L5288:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=4802;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=4803;break}if(l<<24>>24<k<<24>>24){i=1;j=4804;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L5288}else{b=k;h=l}}if((j|0)==4803){return i|0}else if((j|0)==4804){return i|0}else if((j|0)==4802){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function id(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;if(g>>>0>4294967279>>>0){gQ(b)}if(g>>>0<11>>>0){a[b]=g<<1&255;h=b+1|0}else{i=g+16&-16;j=n4(i)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=g;h=j}if((e|0)==(f|0)){k=h;a[k]=0;return}j=f+(-d|0)|0;d=h;g=e;while(1){a[d]=a[g]|0;e=g+1|0;if((e|0)==(f|0)){break}else{d=d+1|0;g=e}}k=h+j|0;a[k]=0;return}function ie(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]|0)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function ig(a){a=a|0;gq(a|0);n6(a);return}function ih(a){a=a|0;gq(a|0);return}function ii(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L5324:do{if((e|0)==(f|0)){g=b}else{a=b;h=e;while(1){if((a|0)==(d|0)){i=-1;j=4834;break}k=c[a>>2]|0;l=c[h>>2]|0;if((k|0)<(l|0)){i=-1;j=4832;break}if((l|0)<(k|0)){i=1;j=4831;break}k=a+4|0;l=h+4|0;if((l|0)==(f|0)){g=k;break L5324}else{a=k;h=l}}if((j|0)==4834){return i|0}else if((j|0)==4832){return i|0}else if((j|0)==4831){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function ij(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){gQ(b)}if(h>>>0<2>>>0){a[b]=g>>>1&255;i=b+4|0}else{g=h+4&-4;j=n4(g<<2)|0;c[b+8>>2]=j;c[b>>2]=g|1;c[b+4>>2]=h;i=j}if((e|0)==(f|0)){k=i;c[k>>2]=0;return}j=(f-4+(-d|0)|0)>>>2;d=i;h=e;while(1){c[d>>2]=c[h>>2];e=h+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;h=e}}k=i+(j+1<<2)|0;c[k>>2]=0;return}function ik(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function il(a){a=a|0;gq(a|0);n6(a);return}function im(a){a=a|0;gq(a|0);return}function io(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];cZ[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==0){a[j]=0}else if((w|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}hd(r,g);q=r|0;r=c[q>>2]|0;if((c[5298]|0)!=-1){c[m>>2]=21192;c[m+4>>2]=20;c[m+8>>2]=0;gP(21192,m,142)}m=(c[5299]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;gs(n)|0;hd(s,g);n=s|0;p=c[n>>2]|0;if((c[5202]|0)!=-1){c[l>>2]=20808;c[l+4>>2]=20;c[l+8>>2]=0;gP(20808,l,142)}d=(c[5203]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;gs(z)|0;z=t|0;A=x;cU[c[(c[A>>2]|0)+24>>2]&127](z,y);cU[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(ip(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];gU(t+12|0);gU(t|0);i=k;return}}while(0);o=cx(4)|0;nC(o);bL(o|0,12712,196)}}while(0);k=cx(4)|0;nC(k);bL(k|0,12712,196)}function ip(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=n$(m)|0;if((o|0)!=0){p=o;q=o;break}ob();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){z=r;break}if((cY[c[(c[r>>2]|0)+36>>2]&255](r)|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){A=z;B=0}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if((cY[c[(c[m>>2]|0)+36>>2]&255](m)|0)!=-1){C=m;break}c[b>>2]=0;C=0}else{C=m}}while(0);A=c[u>>2]|0;B=C}D=(B|0)==0;if(!((r^D)&(s|0)!=0)){break}m=c[A+12>>2]|0;if((m|0)==(c[A+16>>2]|0)){E=(cY[c[(c[A>>2]|0)+36>>2]&255](A)|0)&255}else{E=a[m]|0}if(k){F=E}else{F=cV[c[(c[e>>2]|0)+12>>2]&63](h,E)|0}do{if(n){G=x;H=s}else{m=t+1|0;L5435:do{if(k){y=s;o=x;w=p;v=0;I=f;while(1){do{if((a[w]|0)==1){J=I;if((a[J]&1)==0){K=I+1|0}else{K=c[I+8>>2]|0}if(F<<24>>24!=(a[K+t|0]|0)){a[w]=0;L=v;M=o;N=y-1|0;break}O=d[J]|0;if((O&1|0)==0){P=O>>>1}else{P=c[I+4>>2]|0}if((P|0)!=(m|0)){L=1;M=o;N=y;break}a[w]=2;L=1;M=o+1|0;N=y-1|0}else{L=v;M=o;N=y}}while(0);O=I+12|0;if((O|0)==(g|0)){Q=N;R=M;S=L;break L5435}y=N;o=M;w=w+1|0;v=L;I=O}}else{I=s;v=x;w=p;o=0;y=f;while(1){do{if((a[w]|0)==1){O=y;if((a[O]&1)==0){T=y+1|0}else{T=c[y+8>>2]|0}if(F<<24>>24!=(cV[c[(c[e>>2]|0)+12>>2]&63](h,a[T+t|0]|0)|0)<<24>>24){a[w]=0;U=o;V=v;W=I-1|0;break}J=d[O]|0;if((J&1|0)==0){X=J>>>1}else{X=c[y+4>>2]|0}if((X|0)!=(m|0)){U=1;V=v;W=I;break}a[w]=2;U=1;V=v+1|0;W=I-1|0}else{U=o;V=v;W=I}}while(0);J=y+12|0;if((J|0)==(g|0)){Q=W;R=V;S=U;break L5435}I=W;v=V;w=w+1|0;o=U;y=J}}}while(0);if(!S){G=R;H=Q;break}m=c[u>>2]|0;y=m+12|0;o=c[y>>2]|0;if((o|0)==(c[m+16>>2]|0)){w=c[(c[m>>2]|0)+40>>2]|0;cY[w&255](m)|0}else{c[y>>2]=o+1}if((R+Q|0)>>>0<2>>>0|n){G=R;H=Q;break}o=t+1|0;y=R;m=p;w=f;while(1){do{if((a[m]|0)==2){v=d[w]|0;if((v&1|0)==0){Y=v>>>1}else{Y=c[w+4>>2]|0}if((Y|0)==(o|0)){Z=y;break}a[m]=0;Z=y-1|0}else{Z=y}}while(0);v=w+12|0;if((v|0)==(g|0)){G=Z;H=Q;break}else{y=Z;m=m+1|0;w=v}}}}while(0);t=t+1|0;x=G;s=H}do{if((A|0)==0){_=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){_=A;break}if((cY[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[u>>2]=0;_=0;break}else{_=c[u>>2]|0;break}}}while(0);u=(_|0)==0;do{if(D){$=4977}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(u){break}else{$=4979;break}}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)==-1){c[b>>2]=0;$=4977;break}else{if(u^(B|0)==0){break}else{$=4979;break}}}}while(0);if(($|0)==4977){if(u){$=4979}}if(($|0)==4979){c[j>>2]=c[j>>2]|2}L5514:do{if(n){$=4984}else{u=f;B=p;while(1){if((a[B]|0)==2){aa=u;break L5514}b=u+12|0;if((b|0)==(g|0)){$=4984;break L5514}u=b;B=B+1|0}}}while(0);if(($|0)==4984){c[j>>2]=c[j>>2]|4;aa=g}if((q|0)==0){i=l;return aa|0}n0(q);i=l;return aa|0}function iq(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ir(a,0,j,k,f,g,h);i=b;return}function ir(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;i7(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L5538:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((cY[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=5012}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L5538}}if((cY[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=5012;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L5538}}}}while(0);if((E|0)==5012){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gW(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gW(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iJ(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;cY[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=ng(H,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L5598:do{if(J){E=5053}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((cY[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=5053;break L5598}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);do{if((E|0)==5053){if(h){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}function is(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];it(a,0,j,k,f,g,h);i=b;return}function it(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;i7(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L5623:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((cY[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=5081}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L5623}}if((cY[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=5081;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L5623}}}}while(0);if((E|0)==5081){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;N=D>>>1}else{D=c[z>>2]|0;L=D;N=D}gW(o,L<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}gW(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;K=c[D>>2]|0;R=B+16|0;if((K|0)==(c[R>>2]|0)){S=(cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{S=a[K]|0}if((iJ(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;cY[R&255](B)|0;m=Q;w=B;continue}else{c[D>>2]=K+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=nf(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=M;k0(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L5683:do{if(J){E=5122}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((cY[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=5122;break L5683}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}}while(0);do{if((E|0)==5122){if(h){break}V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}function iu(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iv(a,0,j,k,f,g,h);i=b;return}function iv(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;f=i;i=i+72|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+32|0;o=f+40|0;p=f+56|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}v=m|0;i7(o,j,v,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=a[n]|0;n=x;x=c[j>>2]|0;L5708:while(1){do{if((x|0)==0){C=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){C=x;break}if((cY[c[(c[x>>2]|0)+36>>2]&255](x)|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);D=(C|0)==0;E=c[g>>2]|0;do{if((E|0)==0){F=5150}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){if(D){G=E;H=0;break}else{I=n;J=E;K=0;break L5708}}if((cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)==-1){c[g>>2]=0;F=5150;break}else{L=(E|0)==0;if(D^L){G=E;H=L;break}else{I=n;J=E;K=L;break L5708}}}}while(0);if((F|0)==5150){F=0;if(D){I=n;J=0;K=1;break}else{G=0;H=1}}E=d[q]|0;L=(E&1|0)==0;if(((c[r>>2]|0)-n|0)==((L?E>>>1:c[A>>2]|0)|0)){if(L){M=E>>>1;N=E>>>1}else{E=c[A>>2]|0;M=E;N=E}gW(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[h>>2]&-2)-1|0}gW(p,O,0);if((a[q]&1)==0){P=y}else{P=c[z>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}E=C+12|0;L=c[E>>2]|0;R=C+16|0;if((L|0)==(c[R>>2]|0)){S=(cY[c[(c[C>>2]|0)+36>>2]&255](C)|0)&255}else{S=a[L]|0}if((iJ(S,w,Q,r,u,B,o,m,t,v)|0)!=0){I=Q;J=G;K=H;break}L=c[E>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[C>>2]|0)+40>>2]|0;cY[R&255](C)|0;n=Q;x=C;continue}else{c[E>>2]=L+1;n=Q;x=C;continue}}x=d[o]|0;if((x&1|0)==0){T=x>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=Q}}while(0);b[l>>1]=ne(I,c[r>>2]|0,k,w)|0;k0(o,m,c[t>>2]|0,k);do{if(D){U=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){U=C;break}if((cY[c[(c[C>>2]|0)+36>>2]&255](C)|0)!=-1){U=C;break}c[j>>2]=0;U=0}}while(0);j=(U|0)==0;L5768:do{if(K){F=5191}else{do{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((cY[c[(c[J>>2]|0)+36>>2]&255](J)|0)!=-1){break}c[g>>2]=0;F=5191;break L5768}}while(0);if(!(j^(J|0)==0)){break}V=e|0;c[V>>2]=U;gU(p);gU(o);i=f;return}}while(0);do{if((F|0)==5191){if(j){break}V=e|0;c[V>>2]=U;gU(p);gU(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;V=e|0;c[V>>2]=U;gU(p);gU(o);i=f;return}function iw(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];ix(a,0,j,k,f,g,h);i=b;return}function ix(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;i7(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L5793:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((cY[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=5219}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L5793}}if((cY[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=5219;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L5793}}}}while(0);if((E|0)==5219){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gW(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gW(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iJ(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;cY[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=nd(H,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L5853:do{if(J){E=5260}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((cY[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=5260;break L5853}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);do{if((E|0)==5260){if(h){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}function iy(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iz(a,0,j,k,f,g,h);i=b;return}
function iz(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;i7(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L5878:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((cY[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=5288}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L5878}}if((cY[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=5288;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L5878}}}}while(0);if((E|0)==5288){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}gW(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}gW(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{R=a[K]|0}if((iJ(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;cY[Q&255](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=nc(H,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L5938:do{if(J){E=5329}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((cY[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=5329;break L5938}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);do{if((E|0)==5329){if(h){break}U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;gU(o);gU(n);i=e;return}function iA(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iB(a,0,j,k,f,g,h);i=b;return}function iB(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;i7(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L5963:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((cY[c[(c[w>>2]|0)+36>>2]&255](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=5357}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L5963}}if((cY[c[(c[D>>2]|0)+36>>2]&255](D)|0)==-1){c[f>>2]=0;E=5357;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L5963}}}}while(0);if((E|0)==5357){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;N=D>>>1}else{D=c[z>>2]|0;L=D;N=D}gW(o,L<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}gW(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;K=c[D>>2]|0;R=B+16|0;if((K|0)==(c[R>>2]|0)){S=(cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)&255}else{S=a[K]|0}if((iJ(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;cY[R&255](B)|0;m=Q;w=B;continue}else{c[D>>2]=K+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=nb(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=M;k0(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L6023:do{if(J){E=5398}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((cY[c[(c[I>>2]|0)+36>>2]&255](I)|0)!=-1){break}c[f>>2]=0;E=5398;break L6023}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}}while(0);do{if((E|0)==5398){if(h){break}V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gU(o);gU(n);i=e;return}function iC(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iD(a,0,j,k,f,g,h);i=b;return}function iD(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;i8(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6043:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((cY[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=5422}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L6043}}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=5422;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L6043}}}}while(0);if((H|0)==5422){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gW(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}gW(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((i9(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;cY[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);g[l>>2]=+na(K,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L6104:do{if(M){H=5464}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((cY[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=5464;break L6104}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);do{if((H|0)==5464){if(j){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}function iE(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iF(a,0,j,k,f,g,h);i=b;return}function iF(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;i8(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6124:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((cY[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=5488}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L6124}}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=5488;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L6124}}}}while(0);if((H|0)==5488){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gW(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gW(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((i9(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;cY[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+m9(K,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L6185:do{if(M){H=5530}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((cY[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=5530;break L6185}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);do{if((H|0)==5530){if(j){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}function iG(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iH(a,0,j,k,f,g,h);i=b;return}function iH(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;i8(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6205:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((cY[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=5554}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L6205}}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[f>>2]=0;H=5554;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L6205}}}}while(0);if((H|0)==5554){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}gW(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gW(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)&255}else{U=a[N]|0}if((i9(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;cY[T&255](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+m8(K,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((cY[c[(c[E>>2]|0)+36>>2]&255](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L6266:do{if(M){H=5596}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((cY[c[(c[L>>2]|0)+36>>2]&255](L)|0)!=-1){break}c[f>>2]=0;H=5596;break L6266}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);do{if((H|0)==5596){if(j){break}X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;gU(p);gU(o);i=e;return}function iI(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+48|0;o=i;i=i+4|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;of(n|0,0,12);u=p;hd(o,h);h=o|0;o=c[h>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;v=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+32>>2]|0;c4[z&15](x,14616,14642,y)|0;x=c[h>>2]|0;gs(x)|0;of(u|0,0,12);x=p;gW(p,10,0);if((a[u]&1)==0){z=x+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;x=f|0;w=g|0;D=p|0;E=p+4|0;F=A;G=c[x>>2]|0;L6293:while(1){do{if((G|0)==0){H=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){H=G;break}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[w>>2]|0;do{if((J|0)==0){K=5627}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{L=F;break L6293}}if((cY[c[(c[J>>2]|0)+36>>2]&255](J)|0)==-1){c[w>>2]=0;K=5627;break}else{if(I^(J|0)==0){break}else{L=F;break L6293}}}}while(0);if((K|0)==5627){K=0;if(I){L=F;break}}J=d[u]|0;M=(J&1|0)==0;if(((c[q>>2]|0)-F|0)==((M?J>>>1:c[E>>2]|0)|0)){if(M){N=J>>>1;O=J>>>1}else{J=c[E>>2]|0;N=J;O=J}gW(p,N<<1,0);if((a[u]&1)==0){P=10}else{P=(c[D>>2]&-2)-1|0}gW(p,P,0);if((a[u]&1)==0){Q=B}else{Q=c[C>>2]|0}c[q>>2]=Q+O;R=Q}else{R=F}J=H+12|0;M=c[J>>2]|0;S=H+16|0;if((M|0)==(c[S>>2]|0)){T=(cY[c[(c[H>>2]|0)+36>>2]&255](H)|0)&255}else{T=a[M]|0}if((iJ(T,16,R,q,t,0,n,z,s,y)|0)!=0){L=R;break}M=c[J>>2]|0;if((M|0)==(c[S>>2]|0)){S=c[(c[H>>2]|0)+40>>2]|0;cY[S&255](H)|0;F=R;G=H;continue}else{c[J>>2]=M+1;F=R;G=H;continue}}a[L+3|0]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);G=iK(L,c[4272]|0,3232,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){U=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){U=G;break}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)!=-1){U=G;break}c[x>>2]=0;U=0}}while(0);x=(U|0)==0;G=c[w>>2]|0;do{if((G|0)==0){K=5672}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(!x){break}V=b|0;c[V>>2]=U;gU(p);gU(n);i=e;return}if((cY[c[(c[G>>2]|0)+36>>2]&255](G)|0)==-1){c[w>>2]=0;K=5672;break}if(!(x^(G|0)==0)){break}V=b|0;c[V>>2]=U;gU(p);gU(n);i=e;return}}while(0);do{if((K|0)==5672){if(x){break}V=b|0;c[V>>2]=U;gU(p);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;gU(p);gU(n);i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function iJ(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(a[m+24|0]|0)==b<<24>>24;if(!p){if((a[m+25|0]|0)!=b<<24>>24){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&b<<24>>24==i<<24>>24){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+26|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((a[i]|0)==b<<24>>24){s=i;break}else{i=i+1|0}}i=s-m|0;if((i|0)>23){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((i|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<22){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;m=a[14616+i|0]|0;s=c[g>>2]|0;c[g>>2]=s+1;a[s]=m;q=0;return q|0}}while(0);f=a[14616+i|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function iK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=cf(b|0)|0;b=a9(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}cf(h|0)|0;i=f;return b|0}function iL(a){a=a|0;gq(a|0);n6(a);return}function iM(a){a=a|0;gq(a|0);return}function iN(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];cZ[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==1){a[j]=1}else if((w|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}hd(r,g);q=r|0;r=c[q>>2]|0;if((c[5296]|0)!=-1){c[m>>2]=21184;c[m+4>>2]=20;c[m+8>>2]=0;gP(21184,m,142)}m=(c[5297]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;gs(n)|0;hd(s,g);n=s|0;p=c[n>>2]|0;if((c[5200]|0)!=-1){c[l>>2]=20800;c[l+4>>2]=20;c[l+8>>2]=0;gP(20800,l,142)}d=(c[5201]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;gs(z)|0;z=t|0;A=x;cU[c[(c[A>>2]|0)+24>>2]&127](z,y);cU[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(iO(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];g3(t+12|0);g3(t|0);i=k;return}}while(0);o=cx(4)|0;nC(o);bL(o|0,12712,196)}}while(0);k=cx(4)|0;nC(k);bL(k|0,12712,196)}function iO(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=n$(m)|0;if((o|0)!=0){p=o;q=o;break}ob();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{m=c[r+12>>2]|0;if((m|0)==(c[r+16>>2]|0)){A=cY[c[(c[r>>2]|0)+36>>2]&255](r)|0}else{A=c[m>>2]|0}if((A|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){B=z;C=0}else{y=c[m+12>>2]|0;if((y|0)==(c[m+16>>2]|0)){D=cY[c[(c[m>>2]|0)+36>>2]&255](m)|0}else{D=c[y>>2]|0}if((D|0)==-1){c[b>>2]=0;E=0}else{E=m}B=c[u>>2]|0;C=E}F=(C|0)==0;if(!((r^F)&(s|0)!=0)){break}r=c[B+12>>2]|0;if((r|0)==(c[B+16>>2]|0)){G=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{G=c[r>>2]|0}if(k){H=G}else{H=cV[c[(c[e>>2]|0)+28>>2]&63](h,G)|0}do{if(n){I=x;J=s}else{r=t+1|0;L6500:do{if(k){m=s;y=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){K=v;if((a[K]&1)==0){L=v+4|0}else{L=c[v+8>>2]|0}if((H|0)!=(c[L+(t<<2)>>2]|0)){a[o]=0;M=w;N=y;O=m-1|0;break}P=d[K]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[v+4>>2]|0}if((Q|0)!=(r|0)){M=1;N=y;O=m;break}a[o]=2;M=1;N=y+1|0;O=m-1|0}else{M=w;N=y;O=m}}while(0);P=v+12|0;if((P|0)==(g|0)){R=O;S=N;T=M;break L6500}m=O;y=N;o=o+1|0;w=M;v=P}}else{v=s;w=x;o=p;y=0;m=f;while(1){do{if((a[o]|0)==1){P=m;if((a[P]&1)==0){U=m+4|0}else{U=c[m+8>>2]|0}if((H|0)!=(cV[c[(c[e>>2]|0)+28>>2]&63](h,c[U+(t<<2)>>2]|0)|0)){a[o]=0;V=y;W=w;X=v-1|0;break}K=d[P]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[m+4>>2]|0}if((Y|0)!=(r|0)){V=1;W=w;X=v;break}a[o]=2;V=1;W=w+1|0;X=v-1|0}else{V=y;W=w;X=v}}while(0);K=m+12|0;if((K|0)==(g|0)){R=X;S=W;T=V;break L6500}v=X;w=W;o=o+1|0;y=V;m=K}}}while(0);if(!T){I=S;J=R;break}r=c[u>>2]|0;m=r+12|0;y=c[m>>2]|0;if((y|0)==(c[r+16>>2]|0)){o=c[(c[r>>2]|0)+40>>2]|0;cY[o&255](r)|0}else{c[m>>2]=y+4}if((S+R|0)>>>0<2>>>0|n){I=S;J=R;break}y=t+1|0;m=S;r=p;o=f;while(1){do{if((a[r]|0)==2){w=d[o]|0;if((w&1|0)==0){Z=w>>>1}else{Z=c[o+4>>2]|0}if((Z|0)==(y|0)){_=m;break}a[r]=0;_=m-1|0}else{_=m}}while(0);w=o+12|0;if((w|0)==(g|0)){I=_;J=R;break}else{m=_;r=r+1|0;o=w}}}}while(0);t=t+1|0;x=I;s=J}do{if((B|0)==0){$=1}else{J=c[B+12>>2]|0;if((J|0)==(c[B+16>>2]|0)){aa=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{aa=c[J>>2]|0}if((aa|0)==-1){c[u>>2]=0;$=1;break}else{$=(c[u>>2]|0)==0;break}}}while(0);do{if(F){ab=5847}else{u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){ac=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{ac=c[u>>2]|0}if((ac|0)==-1){c[b>>2]=0;ab=5847;break}else{if($^(C|0)==0){break}else{ab=5849;break}}}}while(0);if((ab|0)==5847){if($){ab=5849}}if((ab|0)==5849){c[j>>2]=c[j>>2]|2}L6581:do{if(n){ab=5854}else{$=f;C=p;while(1){if((a[C]|0)==2){ad=$;break L6581}b=$+12|0;if((b|0)==(g|0)){ab=5854;break L6581}$=b;C=C+1|0}}}while(0);if((ab|0)==5854){c[j>>2]=c[j>>2]|4;ad=g}if((q|0)==0){i=l;return ad|0}n0(q);i=l;return ad|0}function iP(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iQ(a,0,j,k,f,g,h);i=b;return}function iQ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;ja(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=cY[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=22}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L11}}}}while(0);if((F|0)==22){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gW(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gW(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((i6(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;cY[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=ng(K,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=64}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=cY[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=64;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);do{if((F|0)==64){if(h){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}function iR(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iS(a,0,j,k,f,g,h);i=b;return}function iS(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;ja(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L101:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=cY[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=93}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=93;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;N=G;break L101}}}}while(0);if((F|0)==93){F=0;if(E){K=m;L=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}gW(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gW(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{U=c[G>>2]|0}if((i6(U,v,S,q,t,A,n,l,s,u)|0)!=0){K=S;L=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;cY[T&255](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=nf(K,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=M;k0(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=135}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){Y=cY[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=135;break}if(!(h^(L|0)==0)){break}Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}}while(0);do{if((F|0)==135){if(h){break}Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}function iT(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iU(a,0,j,k,f,g,h);i=b;return}function iU(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;f=i;i=i+144|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+112|0;p=f+128|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}v=m|0;ja(o,j,v,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=c[n>>2]|0;n=x;x=c[j>>2]|0;L191:while(1){do{if((x|0)==0){C=0}else{D=c[x+12>>2]|0;if((D|0)==(c[x+16>>2]|0)){E=cY[c[(c[x>>2]|0)+36>>2]&255](x)|0}else{E=c[D>>2]|0}if((E|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);F=(C|0)==0;D=c[g>>2]|0;do{if((D|0)==0){G=164}else{H=c[D+12>>2]|0;if((H|0)==(c[D+16>>2]|0)){I=cY[c[(c[D>>2]|0)+36>>2]&255](D)|0}else{I=c[H>>2]|0}if((I|0)==-1){c[g>>2]=0;G=164;break}else{H=(D|0)==0;if(F^H){J=D;K=H;break}else{L=n;M=D;N=H;break L191}}}}while(0);if((G|0)==164){G=0;if(F){L=n;M=0;N=1;break}else{J=0;K=1}}D=d[q]|0;H=(D&1|0)==0;if(((c[r>>2]|0)-n|0)==((H?D>>>1:c[A>>2]|0)|0)){if(H){O=D>>>1;P=D>>>1}else{D=c[A>>2]|0;O=D;P=D}gW(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}gW(p,Q,0);if((a[q]&1)==0){R=y}else{R=c[z>>2]|0}c[r>>2]=R+P;S=R}else{S=n}D=C+12|0;H=c[D>>2]|0;T=C+16|0;if((H|0)==(c[T>>2]|0)){U=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{U=c[H>>2]|0}if((i6(U,w,S,r,u,B,o,m,t,v)|0)!=0){L=S;M=J;N=K;break}H=c[D>>2]|0;if((H|0)==(c[T>>2]|0)){T=c[(c[C>>2]|0)+40>>2]|0;cY[T&255](C)|0;n=S;x=C;continue}else{c[D>>2]=H+4;n=S;x=C;continue}}x=d[o]|0;if((x&1|0)==0){V=x>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=S}}while(0);b[l>>1]=ne(L,c[r>>2]|0,k,w)|0;k0(o,m,c[t>>2]|0,k);do{if(F){W=0}else{t=c[C+12>>2]|0;if((t|0)==(c[C+16>>2]|0)){X=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{X=c[t>>2]|0}if((X|0)!=-1){W=C;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;do{if(N){G=206}else{C=c[M+12>>2]|0;if((C|0)==(c[M+16>>2]|0)){Y=cY[c[(c[M>>2]|0)+36>>2]&255](M)|0}else{Y=c[C>>2]|0}if((Y|0)==-1){c[g>>2]=0;G=206;break}if(!(j^(M|0)==0)){break}Z=e|0;c[Z>>2]=W;gU(p);gU(o);i=f;return}}while(0);do{if((G|0)==206){if(j){break}Z=e|0;c[Z>>2]=W;gU(p);gU(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;Z=e|0;c[Z>>2]=W;gU(p);gU(o);i=f;return}function iV(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iW(a,0,j,k,f,g,h);i=b;return}function iW(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;ja(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L281:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=cY[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=235}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=235;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L281}}}}while(0);if((F|0)==235){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gW(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gW(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((i6(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;cY[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=nd(K,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=277}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=cY[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=277;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);do{if((F|0)==277){if(h){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}function iX(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];iY(a,0,j,k,f,g,h);i=b;return}function iY(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;ja(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L371:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=cY[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=306}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=306;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L371}}}}while(0);if((F|0)==306){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}gW(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}gW(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{T=c[G>>2]|0}if((i6(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;cY[S&255](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=nc(K,c[q>>2]|0,j,v)|0;k0(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=348}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=cY[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=348;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);do{if((F|0)==348){if(h){break}Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;gU(o);gU(n);i=e;return}function iZ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];i_(a,0,j,k,f,g,h);i=b;return}function i_(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;ja(n,h,u,m);of(p|0,0,12);h=o;gW(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L461:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=cY[c[(c[w>>2]|0)+36>>2]&255](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=377}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=cY[c[(c[C>>2]|0)+36>>2]&255](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=377;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;N=G;break L461}}}}while(0);if((F|0)==377){F=0;if(E){K=m;L=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}gW(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}gW(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{U=c[G>>2]|0}if((i6(U,v,S,q,t,A,n,l,s,u)|0)!=0){K=S;L=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;cY[T&255](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=nb(K,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=M;k0(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=419}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){Y=cY[c[(c[L>>2]|0)+36>>2]&255](L)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=419;break}if(!(h^(L|0)==0)){break}Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}}while(0);do{if((F|0)==419){if(h){break}Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gU(o);gU(n);i=e;return}function i$(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];i0(a,0,j,k,f,g,h);i=b;return}function i0(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;jb(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L546:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=444}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=cY[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=444;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L546}}}}while(0);if((I|0)==444){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gW(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[h>>2]&-2)-1|0}gW(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((jc(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;cY[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);g[l>>2]=+na(N,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=487}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=cY[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=487;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);do{if((I|0)==487){if(j){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}function i1(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];i2(a,0,j,k,f,g,h);i=b;return}function i2(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;jb(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L632:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=512}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=cY[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=512;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L632}}}}while(0);if((I|0)==512){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gW(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}gW(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((jc(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;cY[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+m9(N,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=555}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=cY[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=555;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);do{if((I|0)==555){if(j){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}function i3(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];i4(a,0,j,k,f,g,h);i=b;return}function i4(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;jb(o,j,x,m,n);of(q|0,0,12);j=p;gW(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L718:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=580}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=cY[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=580;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L718}}}}while(0);if((I|0)==580){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}gW(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}gW(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{W=c[J>>2]|0}if((jc(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;cY[V&255](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+m8(N,c[r>>2]|0,k);k0(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=cY[c[(c[E>>2]|0)+36>>2]&255](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=623}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=cY[c[(c[O>>2]|0)+36>>2]&255](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=623;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);do{if((I|0)==623){if(j){break}$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;gU(p);gU(o);i=e;return}function i5(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+136|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+120|0;o=i;i=i+4|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;of(n|0,0,12);u=p;hd(o,h);h=o|0;o=c[h>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;v=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+48>>2]|0;c4[z&15](x,14616,14642,y)|0;x=c[h>>2]|0;gs(x)|0;of(u|0,0,12);x=p;gW(p,10,0);if((a[u]&1)==0){z=x+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;x=f|0;w=g|0;D=p|0;E=p+4|0;F=A;G=c[x>>2]|0;L811:while(1){do{if((G|0)==0){H=0}else{I=c[G+12>>2]|0;if((I|0)==(c[G+16>>2]|0)){J=cY[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{J=c[I>>2]|0}if((J|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;K=c[w>>2]|0;do{if((K|0)==0){L=655}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=cY[c[(c[K>>2]|0)+36>>2]&255](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[w>>2]=0;L=655;break}else{if(I^(K|0)==0){break}else{O=F;break L811}}}}while(0);if((L|0)==655){L=0;if(I){O=F;break}}K=d[u]|0;M=(K&1|0)==0;if(((c[q>>2]|0)-F|0)==((M?K>>>1:c[E>>2]|0)|0)){if(M){P=K>>>1;Q=K>>>1}else{K=c[E>>2]|0;P=K;Q=K}gW(p,P<<1,0);if((a[u]&1)==0){R=10}else{R=(c[D>>2]&-2)-1|0}gW(p,R,0);if((a[u]&1)==0){S=B}else{S=c[C>>2]|0}c[q>>2]=S+Q;T=S}else{T=F}K=H+12|0;M=c[K>>2]|0;U=H+16|0;if((M|0)==(c[U>>2]|0)){V=cY[c[(c[H>>2]|0)+36>>2]&255](H)|0}else{V=c[M>>2]|0}if((i6(V,16,T,q,t,0,n,z,s,y)|0)!=0){O=T;break}M=c[K>>2]|0;if((M|0)==(c[U>>2]|0)){U=c[(c[H>>2]|0)+40>>2]|0;cY[U&255](H)|0;F=T;G=H;continue}else{c[K>>2]=M+4;F=T;G=H;continue}}a[O+3|0]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);G=iK(O,c[4272]|0,3232,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){W=0}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){X=cY[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{X=c[F>>2]|0}if((X|0)!=-1){W=G;break}c[x>>2]=0;W=0}}while(0);x=(W|0)==0;G=c[w>>2]|0;do{if((G|0)==0){L=700}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){Y=cY[c[(c[G>>2]|0)+36>>2]&255](G)|0}else{Y=c[F>>2]|0}if((Y|0)==-1){c[w>>2]=0;L=700;break}if(!(x^(G|0)==0)){break}Z=b|0;c[Z>>2]=W;gU(p);gU(n);i=e;return}}while(0);do{if((L|0)==700){if(x){break}Z=b|0;c[Z>>2]=W;gU(p);gU(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;gU(p);gU(n);i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function i6(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((c[i>>2]|0)==(b|0)){s=i;break}else{i=i+4|0}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[14616+m|0]|0;b=c[g>>2]|0;c[g>>2]=b+1;a[b]=s;q=0;return q|0}}while(0);f=a[14616+m|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function i7(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;hd(k,d);d=k|0;k=c[d>>2]|0;if((c[5298]|0)!=-1){c[j>>2]=21192;c[j+4>>2]=20;c[j+8>>2]=0;gP(21192,j,142)}j=(c[5299]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+32>>2]|0;c4[o&15](n,14616,14642,e)|0;n=c[d>>2]|0;if((c[5202]|0)!=-1){c[h>>2]=20808;c[h+4>>2]=20;c[h+8>>2]=0;gP(20808,h,142)}o=(c[5203]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;a[f]=cY[c[(c[p>>2]|0)+16>>2]&255](q)|0;cU[c[(c[p>>2]|0)+20>>2]&127](b,q);q=c[d>>2]|0;gs(q)|0;i=g;return}}while(0);o=cx(4)|0;nC(o);bL(o|0,12712,196)}}while(0);g=cx(4)|0;nC(g);bL(g|0,12712,196)}function i8(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+40|0;j=h|0;k=h+16|0;l=h+32|0;hd(l,d);d=l|0;l=c[d>>2]|0;if((c[5298]|0)!=-1){c[k>>2]=21192;c[k+4>>2]=20;c[k+8>>2]=0;gP(21192,k,142)}k=(c[5299]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;p=c[(c[n>>2]|0)+32>>2]|0;c4[p&15](o,14616,14648,e)|0;o=c[d>>2]|0;if((c[5202]|0)!=-1){c[j>>2]=20808;c[j+4>>2]=20;c[j+8>>2]=0;gP(20808,j,142)}p=(c[5203]|0)-1|0;n=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-n>>2>>>0>p>>>0){q=c[n+(p<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;a[f]=cY[c[(c[s>>2]|0)+12>>2]&255](r)|0;a[g]=cY[c[(c[s>>2]|0)+16>>2]&255](r)|0;cU[c[(c[q>>2]|0)+20>>2]&127](b,r);r=c[d>>2]|0;gs(r)|0;i=h;return}}while(0);p=cx(4)|0;nC(p);bL(p|0,12712,196)}}while(0);h=cx(4)|0;nC(h);bL(h|0,12712,196)}function i9(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((a[j]|0)==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[14616+j|0]|0;if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}b=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=b}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function ja(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+32|0;hd(j,b);b=j|0;j=c[b>>2]|0;if((c[5296]|0)!=-1){c[h>>2]=21184;c[h+4>>2]=20;c[h+8>>2]=0;gP(21184,h,142)}h=(c[5297]|0)-1|0;k=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-k>>2>>>0>h>>>0){l=c[k+(h<<2)>>2]|0;if((l|0)==0){break}m=l;n=c[(c[l>>2]|0)+48>>2]|0;c4[n&15](m,14616,14642,d)|0;m=c[b>>2]|0;if((c[5200]|0)!=-1){c[g>>2]=20800;c[g+4>>2]=20;c[g+8>>2]=0;gP(20800,g,142)}n=(c[5201]|0)-1|0;l=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-l>>2>>>0>n>>>0){o=c[l+(n<<2)>>2]|0;if((o|0)==0){break}p=o;c[e>>2]=cY[c[(c[o>>2]|0)+16>>2]&255](p)|0;cU[c[(c[o>>2]|0)+20>>2]&127](a,p);p=c[b>>2]|0;gs(p)|0;i=f;return}}while(0);n=cx(4)|0;nC(n);bL(n|0,12712,196)}}while(0);f=cx(4)|0;nC(f);bL(f|0,12712,196)}function jb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;hd(k,b);b=k|0;k=c[b>>2]|0;if((c[5296]|0)!=-1){c[j>>2]=21184;c[j+4>>2]=20;c[j+8>>2]=0;gP(21184,j,142)}j=(c[5297]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+48>>2]|0;c4[o&15](n,14616,14648,d)|0;n=c[b>>2]|0;if((c[5200]|0)!=-1){c[h>>2]=20800;c[h+4>>2]=20;c[h+8>>2]=0;gP(20800,h,142)}o=(c[5201]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;r=p;c[e>>2]=cY[c[(c[r>>2]|0)+12>>2]&255](q)|0;c[f>>2]=cY[c[(c[r>>2]|0)+16>>2]&255](q)|0;cU[c[(c[p>>2]|0)+20>>2]&127](a,q);q=c[b>>2]|0;gs(q)|0;i=g;return}}while(0);o=cx(4)|0;nC(o);bL(o|0,12712,196)}}while(0);g=cx(4)|0;nC(g);bL(g|0,12712,196)}function jc(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[14616+o|0]|0;do{if((o|0)==25|(o|0)==24){b=c[h>>2]|0;do{if((b|0)!=(g|0)){if((a[b-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=b+1;a[b]=s;p=0;return p|0}else if((o|0)==22|(o|0)==23){a[f]=80}else{r=a[f]|0;if((s&95|0)!=(r<<24>>24|0)){break}a[f]=r|-128;if((a[e]&1)==0){break}a[e]=0;r=d[k]|0;if((r&1|0)==0){t=r>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}r=c[m>>2]|0;if((r-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function jd(a){a=a|0;gq(a|0);n6(a);return}function je(a){a=a|0;gq(a|0);return}function jf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];c3[o&63](b,d,l,f,g,h&1);i=j;return}hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5202]|0)!=-1){c[k>>2]=20808;c[k+4>>2]=20;c[k+8>>2]=0;gP(20808,k,142)}k=(c[5203]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;gs(o)|0;o=c[l>>2]|0;if(h){cU[c[o+24>>2]&127](n,d)}else{cU[c[o+28>>2]&127](n,d)}d=n;o=n;l=a[o]|0;if((l&1)==0){p=d+1|0;q=p;r=p;s=n+8|0}else{p=n+8|0;q=c[p>>2]|0;r=d+1|0;s=p}p=e|0;d=n+4|0;t=q;u=l;while(1){if((u&1)==0){v=r}else{v=c[s>>2]|0}l=u&255;if((t|0)==(v+((l&1|0)==0?l>>>1:c[d>>2]|0)|0)){break}l=a[t]|0;w=c[p>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)!=(c[w+28>>2]|0)){c[x>>2]=y+1;a[y]=l;break}if((cV[c[(c[w>>2]|0)+52>>2]&63](w,l&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];gU(n);i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function jg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[5160]|0;a[q+1|0]=a[5161]|0;a[q+2|0]=a[5162]|0;a[q+3|0]=a[5163]|0;a[q+4|0]=a[5164]|0;a[q+5|0]=a[5165]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);v=jh(u,12,c[4272]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=963;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=963;break}w=k+2|0}else{x=963}}while(0);if((x|0)==963){w=u}x=l|0;hd(o,f);ji(u,w,q,x,m,n,o);gs(c[o>>2]|0)|0;c[p>>2]=c[e>>2];du(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jh(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;j=cf(d|0)|0;d=cg(a|0,b|0,e|0,h|0)|0;if((j|0)==0){i=g;return d|0}cf(j|0)|0;i=g;return d|0}function ji(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[5298]|0)!=-1){c[n>>2]=21192;c[n+4>>2]=20;c[n+8>>2]=0;gP(21192,n,142)}n=(c[5299]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}r=k;s=c[p>>2]|0;if((c[5202]|0)!=-1){c[m>>2]=20808;c[m+4>>2]=20;c[m+8>>2]=0;gP(20808,m,142)}m=(c[5203]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}t=s;cU[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+32>>2]|0;c4[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cV[c[(c[k>>2]|0)+28>>2]&63](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cV[c[(c[p>>2]|0)+28>>2]&63](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=cV[c[(c[p>>2]|0)+28>>2]&63](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=cY[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+1;a[I]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=cV[c[(c[p>>2]|0)+28>>2]&63](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;gU(o);i=l;return}else{L=g+(e-b)|0;c[h>>2]=L;gU(o);i=l;return}}function jj(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);t=jh(u,22,c[4272]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1046;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1046;break}w=l+2|0}else if((j|0)==32){w=r}else{x=1046}}while(0);if((x|0)==1046){w=u}x=m|0;hd(p,f);ji(u,w,r,x,n,o,p);gs(c[p>>2]|0)|0;c[q>>2]=c[e>>2];du(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jk(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[5160]|0;a[q+1|0]=a[5161]|0;a[q+2|0]=a[5162]|0;a[q+3|0]=a[5163]|0;a[q+4|0]=a[5164]|0;a[q+5|0]=a[5165]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);t=jh(u,12,c[4272]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1071;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1071;break}w=k+2|0}else if((h|0)==32){w=q}else{x=1071}}while(0);if((x|0)==1071){w=u}x=l|0;hd(o,f);ji(u,w,q,x,m,n,o);gs(c[o>>2]|0)|0;c[p>>2]=c[e>>2];du(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=l|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);v=jh(u,23,c[4272]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1096;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1096;break}w=l+2|0}else if((j|0)==32){w=r}else{x=1096}}while(0);if((x|0)==1096){w=u}x=m|0;hd(p,f);ji(u,w,r,x,n,o,p);gs(c[p>>2]|0)|0;c[q>>2]=c[e>>2];du(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jm(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=c[4272]|0;if(y){w=jh(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=jh(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[21824]|0)==0;if(y){do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);w=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ob();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1152;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1152;break}F=E+2|0}else{G=1152}}while(0);if((G|0)==1152){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=n$(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}ob();H=0;I=0;J=c[m>>2]|0}}while(0);hd(q,f);jo(J,F,A,H,o,p,q);gs(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];du(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){n0(I)}if((D|0)==0){i=d;return}n0(D);i=d;return}function jn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=cf(b|0)|0;b=cC(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}cf(h|0)|0;i=f;return b|0}function jo(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[5298]|0)!=-1){c[n>>2]=21192;c[n+4>>2]=20;c[n+8>>2]=0;gP(21192,n,142)}n=(c[5299]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}r=k;s=c[p>>2]|0;if((c[5202]|0)!=-1){c[m>>2]=20808;c[m+4>>2]=20;c[m+8>>2]=0;gP(20808,m,142)}m=(c[5203]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}t=s;cU[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cV[c[(c[k>>2]|0)+28>>2]&63](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L1483:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=1218;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=1218;break}p=k;n=cV[c[(c[p>>2]|0)+28>>2]&63](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=cV[c[(c[p>>2]|0)+28>>2]&63](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L1483}u=a[q]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((aS(u<<24>>24|0,c[4272]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=1218}}while(0);L1498:do{if((x|0)==1218){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L1498}q=a[w]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((cn(q<<24>>24|0,c[4272]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=1218}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+32>>2]|0;c4[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=cY[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+1;a[J]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=cV[c[(c[p>>2]|0)+28>>2]&63](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-1|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=a[K]|0;a[K]=a[L]|0;a[L]=D;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L1537:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cV[c[(c[L>>2]|0)+28>>2]&63](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L1537}}L=cY[c[(c[s>>2]|0)+12>>2]&255](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);c4[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;gU(o);i=l;return}N=g+(e-b)|0;c[h>>2]=N;gU(o);i=l;return}function jp(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=c[4272]|0;if(y){w=jh(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=jh(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[21824]|0)==0;if(y){do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);w=jn(m,c[4272]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ob();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1315;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1315;break}F=E+2|0}else{G=1315}}while(0);if((G|0)==1315){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=n$(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}ob();H=0;I=0;J=c[m>>2]|0}}while(0);hd(q,f);jo(J,F,A,H,o,p,q);gs(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];du(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){n0(I)}if((D|0)==0){i=d;return}n0(D);i=d;return}function jq(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+104|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+88|0;n=d+96|0;o=d+16|0;a[o]=a[5168]|0;a[o+1|0]=a[5169]|0;a[o+2|0]=a[5170]|0;a[o+3|0]=a[5171]|0;a[o+4|0]=a[5172]|0;a[o+5|0]=a[5173]|0;p=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);q=jh(p,20,c[4272]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=1348;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=1348;break}s=k+2|0}else if((h|0)==32){s=o}else{t=1348}}while(0);if((t|0)==1348){s=p}hd(m,f);t=m|0;m=c[t>>2]|0;if((c[5298]|0)!=-1){c[j>>2]=21192;c[j+4>>2]=20;c[j+8>>2]=0;gP(21192,j,142)}j=(c[5299]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}u=r;v=c[t>>2]|0;gs(v)|0;v=l|0;w=c[(c[r>>2]|0)+32>>2]|0;c4[w&15](u,p,o,v)|0;u=l+q|0;if((s|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;du(b,n,v,x,u,f,g);i=d;return}x=l+(s-k)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;du(b,n,v,x,u,f,g);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function jr(a){a=a|0;gq(a|0);n6(a);return}function js(a){a=a|0;gq(a|0);return}function jt(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];c3[o&63](b,d,l,f,g,h&1);i=j;return}hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5200]|0)!=-1){c[k>>2]=20800;c[k+4>>2]=20;c[k+8>>2]=0;gP(20800,k,142)}k=(c[5201]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;gs(o)|0;o=c[l>>2]|0;if(h){cU[c[o+24>>2]&127](n,d)}else{cU[c[o+28>>2]&127](n,d)}d=n;o=a[d]|0;if((o&1)==0){l=n+4|0;p=l;q=l;r=n+8|0}else{l=n+8|0;p=c[l>>2]|0;q=n+4|0;r=l}l=e|0;s=p;t=o;while(1){if((t&1)==0){u=q}else{u=c[r>>2]|0}o=t&255;if((o&1|0)==0){v=o>>>1}else{v=c[q>>2]|0}if((s|0)==(u+(v<<2)|0)){break}o=c[s>>2]|0;w=c[l>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)==(c[w+28>>2]|0)){z=cV[c[(c[w>>2]|0)+52>>2]&63](w,o)|0}else{c[x>>2]=y+4;c[y>>2]=o;z=o}if((z|0)!=-1){break}c[l>>2]=0}}while(0);s=s+4|0;t=a[d]|0}c[b>>2]=c[l>>2];g3(n);i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function ju(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[5160]|0;a[q+1|0]=a[5161]|0;a[q+2|0]=a[5162]|0;a[q+3|0]=a[5163]|0;a[q+4|0]=a[5164]|0;a[q+5|0]=a[5165]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);t=jh(u,12,c[4272]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1419;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1419;break}w=k+2|0}else{x=1419}}while(0);if((x|0)==1419){w=u}x=l|0;hd(o,f);jv(u,w,q,x,m,n,o);gs(c[o>>2]|0)|0;c[p>>2]=c[e>>2];jw(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jv(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[5296]|0)!=-1){c[n>>2]=21184;c[n+4>>2]=20;c[n+8>>2]=0;gP(21184,n,142)}n=(c[5297]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}r=k;s=c[p>>2]|0;if((c[5200]|0)!=-1){c[m>>2]=20800;c[m+4>>2]=20;c[m+8>>2]=0;gP(20800,m,142)}m=(c[5201]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}t=s;cU[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+48>>2]|0;c4[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cV[c[(c[k>>2]|0)+44>>2]&63](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cV[c[(c[p>>2]|0)+44>>2]&63](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=cV[c[(c[p>>2]|0)+44>>2]&63](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=cY[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=cV[c[(c[p>>2]|0)+44>>2]&63](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;gU(o);i=l;return}else{L=g+(e-b<<2)|0;c[h>>2]=L;gU(o);i=l;return}}function jw(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;do{if((h|0)>0){if((cW[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){g2(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((cW[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){g3(l);break}c[m>>2]=0;c[b>>2]=0;g3(l);i=k;return}}while(0);l=n-o|0;o=l>>2;do{if((l|0)>0){if((cW[c[(c[d>>2]|0)+48>>2]&63](d,f,o)|0)==(o|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function jx(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+232|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+200|0;o=d+208|0;p=d+216|0;q=d+224|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=l|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);v=jh(u,22,c[4272]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1520;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1520;break}w=l+2|0}else if((j|0)==32){w=r}else{x=1520}}while(0);if((x|0)==1520){w=u}x=m|0;hd(p,f);jv(u,w,r,x,n,o,p);gs(c[p>>2]|0)|0;c[q>>2]=c[e>>2];jw(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jy(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[5160]|0;a[q+1|0]=a[5161]|0;a[q+2|0]=a[5162]|0;a[q+3|0]=a[5163]|0;a[q+4|0]=a[5164]|0;a[q+5|0]=a[5165]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);v=jh(u,12,c[4272]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1545;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1545;break}w=k+2|0}else if((h|0)==32){w=q}else{x=1545}}while(0);if((x|0)==1545){w=u}x=l|0;hd(o,f);jv(u,w,q,x,m,n,o);gs(c[o>>2]|0)|0;c[p>>2]=c[e>>2];jw(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function jz(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+240|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+208|0;o=d+216|0;p=d+224|0;q=d+232|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=l|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);v=jh(u,23,c[4272]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1570;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1570;break}w=l+2|0}else{x=1570}}while(0);if((x|0)==1570){w=u}x=m|0;hd(p,f);jv(u,w,r,x,n,o,p);gs(c[p>>2]|0)|0;c[q>>2]=c[e>>2];jw(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function jA(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=c[4272]|0;if(y){w=jh(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=jh(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[21824]|0)==0;if(y){do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);w=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ob();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1626;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1626;break}F=E+2|0}else if((B|0)==32){F=A}else{G=1626}}while(0);if((G|0)==1626){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=n$(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}ob();H=B;I=B;J=c[m>>2]|0}}while(0);hd(q,f);jB(J,F,A,H,o,p,q);gs(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];jw(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){n0(I)}if((D|0)==0){i=d;return}n0(D);i=d;return}function jB(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[5296]|0)!=-1){c[n>>2]=21184;c[n+4>>2]=20;c[n+8>>2]=0;gP(21184,n,142)}n=(c[5297]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=cx(4)|0;s=r;nC(s);bL(r|0,12712,196)}r=k;s=c[p>>2]|0;if((c[5200]|0)!=-1){c[m>>2]=20800;c[m+4>>2]=20;c[m+8>>2]=0;gP(20800,m,142)}m=(c[5201]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=cx(4)|0;u=t;nC(u);bL(t|0,12712,196)}t=s;cU[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cV[c[(c[k>>2]|0)+44>>2]&63](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L2022:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=1681;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=1681;break}p=k;n=cV[c[(c[p>>2]|0)+44>>2]&63](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=cV[c[(c[p>>2]|0)+44>>2]&63](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L2022}u=a[q]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((aS(u<<24>>24|0,c[4272]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=1681}}while(0);L2037:do{if((x|0)==1681){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L2037}q=a[w]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((cn(q<<24>>24|0,c[4272]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=1681}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+48>>2]|0;c4[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=cY[c[(c[s>>2]|0)+16>>2]&255](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=cV[c[(c[p>>2]|0)+44>>2]&63](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-4|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=D;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L2076:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cV[c[(c[L>>2]|0)+44>>2]&63](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L2076}}L=cY[c[(c[s>>2]|0)+12>>2]&255](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);c4[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;gU(o);i=l;return}N=g+(e-b<<2)|0;c[h>>2]=N;gU(o);i=l;return}function jC(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=c[4272]|0;if(y){w=jh(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=jh(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[21824]|0)==0;if(y){do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=jn(m,c[4272]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);w=jn(m,c[4272]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ob();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1778;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1778;break}F=E+2|0}else{G=1778}}while(0);if((G|0)==1778){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=n$(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}ob();H=B;I=B;J=c[m>>2]|0}}while(0);hd(q,f);jB(J,F,A,H,o,p,q);gs(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];jw(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){n0(I)}if((D|0)==0){i=d;return}n0(D);i=d;return}function jD(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+216|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+200|0;n=d+208|0;o=d+16|0;a[o]=a[5168]|0;a[o+1|0]=a[5169]|0;a[o+2|0]=a[5170]|0;a[o+3|0]=a[5171]|0;a[o+4|0]=a[5172]|0;a[o+5|0]=a[5173]|0;p=k|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);q=jh(p,20,c[4272]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=1811;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=1811;break}s=k+2|0}else if((h|0)==32){s=o}else{t=1811}}while(0);if((t|0)==1811){s=p}hd(m,f);t=m|0;m=c[t>>2]|0;if((c[5296]|0)!=-1){c[j>>2]=21184;c[j+4>>2]=20;c[j+8>>2]=0;gP(21184,j,142)}j=(c[5297]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}u=r;v=c[t>>2]|0;gs(v)|0;v=l|0;w=c[(c[r>>2]|0)+48>>2]|0;c4[w&15](u,p,o,v)|0;u=l+(q<<2)|0;if((s|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;jw(b,n,v,x,u,f,g);i=d;return}x=l+(s-k<<2)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;jw(b,n,v,x,u,f,g);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function jE(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;n=i;i=i+48|0;o=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[o>>2];o=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[o>>2];o=n|0;p=n+16|0;q=n+24|0;r=n+32|0;s=n+40|0;hd(p,h);t=p|0;p=c[t>>2]|0;if((c[5298]|0)!=-1){c[o>>2]=21192;c[o+4>>2]=20;c[o+8>>2]=0;gP(21192,o,142)}o=(c[5299]|0)-1|0;u=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-u>>2>>>0>o>>>0){v=c[u+(o<<2)>>2]|0;if((v|0)==0){break}w=v;x=c[t>>2]|0;gs(x)|0;c[j>>2]=0;x=f|0;L2206:do{if((l|0)==(m|0)){y=1890}else{z=g|0;A=v;B=v;C=v+8|0;D=e;E=r|0;F=s|0;G=q|0;H=l;I=0;L2208:while(1){J=I;while(1){if((J|0)!=0){y=1890;break L2206}K=c[x>>2]|0;do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((cY[c[(c[K>>2]|0)+36>>2]&255](K)|0)!=-1){L=K;break}c[x>>2]=0;L=0}}while(0);K=(L|0)==0;M=c[z>>2]|0;L2218:do{if((M|0)==0){y=1843}else{do{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((cY[c[(c[M>>2]|0)+36>>2]&255](M)|0)!=-1){break}c[z>>2]=0;y=1843;break L2218}}while(0);if(K){N=M}else{y=1844;break L2208}}}while(0);if((y|0)==1843){y=0;if(K){y=1844;break L2208}else{N=0}}if((cW[c[(c[A>>2]|0)+36>>2]&63](w,a[H]|0,0)|0)<<24>>24==37){y=1847;break}M=a[H]|0;if(M<<24>>24>=0){O=c[C>>2]|0;if((b[O+(M<<24>>24<<1)>>1]&8192)!=0){P=H;y=1858;break}}Q=L+12|0;M=c[Q>>2]|0;R=L+16|0;if((M|0)==(c[R>>2]|0)){S=(cY[c[(c[L>>2]|0)+36>>2]&255](L)|0)&255}else{S=a[M]|0}M=cV[c[(c[B>>2]|0)+12>>2]&63](w,S)|0;if(M<<24>>24==(cV[c[(c[B>>2]|0)+12>>2]&63](w,a[H]|0)|0)<<24>>24){y=1885;break}c[j>>2]=4;J=4}L2236:do{if((y|0)==1847){y=0;J=H+1|0;if((J|0)==(m|0)){y=1848;break L2208}M=cW[c[(c[A>>2]|0)+36>>2]&63](w,a[J]|0,0)|0;if((M<<24>>24|0)==69|(M<<24>>24|0)==48){T=H+2|0;if((T|0)==(m|0)){y=1851;break L2208}U=M;V=cW[c[(c[A>>2]|0)+36>>2]&63](w,a[T]|0,0)|0;W=T}else{U=0;V=M;W=J}J=c[(c[D>>2]|0)+36>>2]|0;c[E>>2]=L;c[F>>2]=N;c1[J&7](q,e,r,s,h,j,k,V,U);c[x>>2]=c[G>>2];X=W+1|0}else if((y|0)==1885){y=0;J=c[Q>>2]|0;if((J|0)==(c[R>>2]|0)){M=c[(c[L>>2]|0)+40>>2]|0;cY[M&255](L)|0}else{c[Q>>2]=J+1}X=H+1|0}else if((y|0)==1858){while(1){y=0;J=P+1|0;if((J|0)==(m|0)){Y=m;break}M=a[J]|0;if(M<<24>>24<0){Y=J;break}if((b[O+(M<<24>>24<<1)>>1]&8192)==0){Y=J;break}else{P=J;y=1858}}K=L;J=N;while(1){do{if((K|0)==0){Z=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){Z=K;break}if((cY[c[(c[K>>2]|0)+36>>2]&255](K)|0)!=-1){Z=K;break}c[x>>2]=0;Z=0}}while(0);M=(Z|0)==0;do{if((J|0)==0){y=1871}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(M){_=J;break}else{X=Y;break L2236}}if((cY[c[(c[J>>2]|0)+36>>2]&255](J)|0)==-1){c[z>>2]=0;y=1871;break}else{if(M^(J|0)==0){_=J;break}else{X=Y;break L2236}}}}while(0);if((y|0)==1871){y=0;if(M){X=Y;break L2236}else{_=0}}T=Z+12|0;$=c[T>>2]|0;aa=Z+16|0;if(($|0)==(c[aa>>2]|0)){ab=(cY[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)&255}else{ab=a[$]|0}if(ab<<24>>24<0){X=Y;break L2236}if((b[(c[C>>2]|0)+(ab<<24>>24<<1)>>1]&8192)==0){X=Y;break L2236}$=c[T>>2]|0;if(($|0)==(c[aa>>2]|0)){aa=c[(c[Z>>2]|0)+40>>2]|0;cY[aa&255](Z)|0;K=Z;J=_;continue}else{c[T>>2]=$+1;K=Z;J=_;continue}}}}while(0);if((X|0)==(m|0)){y=1890;break L2206}H=X;I=c[j>>2]|0}if((y|0)==1848){c[j>>2]=4;ac=L;break}else if((y|0)==1851){c[j>>2]=4;ac=L;break}else if((y|0)==1844){c[j>>2]=4;ac=L;break}}}while(0);if((y|0)==1890){ac=c[x>>2]|0}w=f|0;do{if((ac|0)!=0){if((c[ac+12>>2]|0)!=(c[ac+16>>2]|0)){break}if((cY[c[(c[ac>>2]|0)+36>>2]&255](ac)|0)!=-1){break}c[w>>2]=0}}while(0);x=c[w>>2]|0;v=(x|0)==0;I=g|0;H=c[I>>2]|0;L2294:do{if((H|0)==0){y=1900}else{do{if((c[H+12>>2]|0)==(c[H+16>>2]|0)){if((cY[c[(c[H>>2]|0)+36>>2]&255](H)|0)!=-1){break}c[I>>2]=0;y=1900;break L2294}}while(0);if(!v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);do{if((y|0)==1900){if(v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;ad=d|0;c[ad>>2]=x;i=n;return}}while(0);n=cx(4)|0;nC(n);bL(n|0,12712,196)}function jF(a){a=a|0;gq(a|0);n6(a);return}function jG(a){a=a|0;gq(a|0);return}function jH(a){a=a|0;return 2}function jI(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];jE(a,b,k,l,f,g,h,5152,5160);i=j;return}function jJ(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=cY[c[(c[n>>2]|0)+20>>2]&255](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=o;e=a[o]|0;if((e&1)==0){p=f+1|0;q=f+1|0}else{f=c[o+8>>2]|0;p=f;q=f}f=e&255;if((f&1|0)==0){r=f>>>1}else{r=c[o+4>>2]|0}jE(b,d,l,m,g,h,j,q,p+r|0);i=k;return}function jK(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gs(o)|0;o=c[e>>2]|0;q=b+8|0;r=cY[c[c[q>>2]>>2]&255](q)|0;c[k>>2]=o;o=(ip(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function jL(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gs(o)|0;o=c[e>>2]|0;q=b+8|0;r=cY[c[(c[q>>2]|0)+4>>2]&255](q)|0;c[k>>2]=o;o=(ip(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function jM(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;hd(l,f);f=l|0;l=c[f>>2]|0;if((c[5298]|0)!=-1){c[k>>2]=21192;c[k+4>>2]=20;c[k+8>>2]=0;gP(21192,k,142)}k=(c[5299]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;gs(n)|0;c[j>>2]=c[e>>2];n=jR(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=cx(4)|0;nC(b);bL(b|0,12712,196)}function jN(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;hd(z,g);_=z|0;z=c[_>>2]|0;if((c[5298]|0)!=-1){c[y>>2]=21192;c[y+4>>2]=20;c[y+8>>2]=0;gP(21192,y,142)}y=(c[5299]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;gs(aa)|0;L2371:do{switch(k<<24>>24|0){case 72:{c[u>>2]=c[f>>2];aa=jR(e,u,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L2371}else{c[h>>2]=ac|4;break L2371}break};case 120:{ac=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];cZ[ac&127](b,d,U,V,g,h,j);i=l;return};case 88:{ac=d+8|0;aa=cY[c[(c[ac>>2]|0)+24>>2]&255](ac)|0;ac=e|0;c[X>>2]=c[ac>>2];c[Y>>2]=c[f>>2];ad=aa;ae=a[aa]|0;if((ae&1)==0){af=ad+1|0;ag=ad+1|0}else{ad=c[aa+8>>2]|0;af=ad;ag=ad}ad=ae&255;if((ad&1|0)==0){ah=ad>>>1}else{ah=c[aa+4>>2]|0}jE(W,d,X,Y,g,h,j,ag,af+ah|0);c[ac>>2]=c[W>>2];break};case 70:{ac=e|0;c[H>>2]=c[ac>>2];c[I>>2]=c[f>>2];jE(G,d,H,I,g,h,j,5136,5144);c[ac>>2]=c[G>>2];break};case 109:{c[r>>2]=c[f>>2];ac=(jR(e,r,h,ab,2)|0)-1|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<12){c[j+16>>2]=ac;break L2371}else{c[h>>2]=aa|4;break L2371}break};case 73:{aa=j+8|0;c[t>>2]=c[f>>2];ac=jR(e,t,h,ab,2)|0;ad=c[h>>2]|0;do{if((ad&4|0)==0){if((ac-1|0)>>>0>=12>>>0){break}c[aa>>2]=ac;break L2371}}while(0);c[h>>2]=ad|4;break};case 100:case 101:{ac=j+12|0;c[v>>2]=c[f>>2];aa=jR(e,v,h,ab,2)|0;ae=c[h>>2]|0;do{if((ae&4|0)==0){if((aa-1|0)>>>0>=31>>>0){break}c[ac>>2]=aa;break L2371}}while(0);c[h>>2]=ae|4;break};case 84:{aa=e|0;c[S>>2]=c[aa>>2];c[T>>2]=c[f>>2];jE(R,d,S,T,g,h,j,5104,5112);c[aa>>2]=c[R>>2];break};case 77:{c[q>>2]=c[f>>2];aa=jR(e,q,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<60){c[j+4>>2]=aa;break L2371}else{c[h>>2]=ac|4;break L2371}break};case 121:{c[n>>2]=c[f>>2];ac=jR(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2371}if((ac|0)<69){ai=ac+2e3|0}else{ai=(ac-69|0)>>>0<31>>>0?ac+1900|0:ac}c[j+20>>2]=ai-1900;break};case 82:{ac=e|0;c[P>>2]=c[ac>>2];c[Q>>2]=c[f>>2];jE(O,d,P,Q,g,h,j,5112,5117);c[ac>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ac=jR(e,p,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<61){c[j>>2]=ac;break L2371}else{c[h>>2]=aa|4;break L2371}break};case 99:{aa=d+8|0;ac=cY[c[(c[aa>>2]|0)+12>>2]&255](aa)|0;aa=e|0;c[B>>2]=c[aa>>2];c[C>>2]=c[f>>2];ad=ac;aj=a[ac]|0;if((aj&1)==0){ak=ad+1|0;al=ad+1|0}else{ad=c[ac+8>>2]|0;ak=ad;al=ad}ad=aj&255;if((ad&1|0)==0){am=ad>>>1}else{am=c[ac+4>>2]|0}jE(A,d,B,C,g,h,j,al,ak+am|0);c[aa>>2]=c[A>>2];break};case 98:case 66:case 104:{aa=c[f>>2]|0;ac=d+8|0;ad=cY[c[(c[ac>>2]|0)+4>>2]&255](ac)|0;c[w>>2]=aa;aa=(ip(e,w,ad,ad+288|0,ab,h,0)|0)-ad|0;if((aa|0)>=288){break L2371}c[j+16>>2]=((aa|0)/12|0|0)%12|0;break};case 97:case 65:{aa=c[f>>2]|0;ad=d+8|0;ac=cY[c[c[ad>>2]>>2]&255](ad)|0;c[x>>2]=aa;aa=(ip(e,x,ac,ac+168|0,ab,h,0)|0)-ac|0;if((aa|0)>=168){break L2371}c[j+24>>2]=((aa|0)/12|0|0)%7|0;break};case 68:{aa=e|0;c[E>>2]=c[aa>>2];c[F>>2]=c[f>>2];jE(D,d,E,F,g,h,j,5144,5152);c[aa>>2]=c[D>>2];break};case 110:case 116:{c[J>>2]=c[f>>2];jO(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];jP(d,j+8|0,e,K,h,ab);break};case 114:{aa=e|0;c[M>>2]=c[aa>>2];c[N>>2]=c[f>>2];jE(L,d,M,N,g,h,j,5120,5131);c[aa>>2]=c[L>>2];break};case 119:{c[o>>2]=c[f>>2];aa=jR(e,o,h,ab,1)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<7){c[j+24>>2]=aa;break L2371}else{c[h>>2]=ac|4;break L2371}break};case 106:{c[s>>2]=c[f>>2];ac=jR(e,s,h,ab,3)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<366){c[j+28>>2]=ac;break L2371}else{c[h>>2]=aa|4;break L2371}break};case 89:{c[m>>2]=c[f>>2];aa=jR(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2371}c[j+20>>2]=aa-1900;break};case 37:{c[Z>>2]=c[f>>2];jQ(0,e,Z,h,ab);break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=cx(4)|0;nC(l);bL(l|0,12712,196)}function jO(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;j=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[j>>2];j=e|0;e=f|0;f=h+8|0;L2452:while(1){h=c[j>>2]|0;do{if((h|0)==0){k=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){k=h;break}if((cY[c[(c[h>>2]|0)+36>>2]&255](h)|0)==-1){c[j>>2]=0;k=0;break}else{k=c[j>>2]|0;break}}}while(0);h=(k|0)==0;l=c[e>>2]|0;L2461:do{if((l|0)==0){m=2040}else{do{if((c[l+12>>2]|0)==(c[l+16>>2]|0)){if((cY[c[(c[l>>2]|0)+36>>2]&255](l)|0)!=-1){break}c[e>>2]=0;m=2040;break L2461}}while(0);if(h){n=l;o=0}else{p=l;q=0;break L2452}}}while(0);if((m|0)==2040){m=0;if(h){p=0;q=1;break}else{n=0;o=1}}l=c[j>>2]|0;r=c[l+12>>2]|0;if((r|0)==(c[l+16>>2]|0)){s=(cY[c[(c[l>>2]|0)+36>>2]&255](l)|0)&255}else{s=a[r]|0}if(s<<24>>24<0){p=n;q=o;break}if((b[(c[f>>2]|0)+(s<<24>>24<<1)>>1]&8192)==0){p=n;q=o;break}r=c[j>>2]|0;l=r+12|0;t=c[l>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;cY[u&255](r)|0;continue}else{c[l>>2]=t+1;continue}}o=c[j>>2]|0;do{if((o|0)==0){v=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){v=o;break}if((cY[c[(c[o>>2]|0)+36>>2]&255](o)|0)==-1){c[j>>2]=0;v=0;break}else{v=c[j>>2]|0;break}}}while(0);j=(v|0)==0;do{if(q){m=2059}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(!(j^(p|0)==0)){break}i=d;return}if((cY[c[(c[p>>2]|0)+36>>2]&255](p)|0)==-1){c[e>>2]=0;m=2059;break}if(!j){break}i=d;return}}while(0);do{if((m|0)==2059){if(j){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function jP(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=cY[c[(c[l>>2]|0)+8>>2]&255](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=ip(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function jQ(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=d|0;d=c[h>>2]|0;do{if((d|0)==0){j=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){j=d;break}if((cY[c[(c[d>>2]|0)+36>>2]&255](d)|0)==-1){c[h>>2]=0;j=0;break}else{j=c[h>>2]|0;break}}}while(0);d=(j|0)==0;j=e|0;e=c[j>>2]|0;L2535:do{if((e|0)==0){k=2097}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((cY[c[(c[e>>2]|0)+36>>2]&255](e)|0)!=-1){break}c[j>>2]=0;k=2097;break L2535}}while(0);if(d){l=e;m=0}else{k=2098}}}while(0);if((k|0)==2097){if(d){k=2098}else{l=0;m=1}}if((k|0)==2098){c[f>>2]=c[f>>2]|6;i=b;return}d=c[h>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){n=(cY[c[(c[d>>2]|0)+36>>2]&255](d)|0)&255}else{n=a[e]|0}if((cW[c[(c[g>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24!=37){c[f>>2]=c[f>>2]|4;i=b;return}n=c[h>>2]|0;g=n+12|0;e=c[g>>2]|0;if((e|0)==(c[n+16>>2]|0)){d=c[(c[n>>2]|0)+40>>2]|0;cY[d&255](n)|0}else{c[g>>2]=e+1}e=c[h>>2]|0;do{if((e|0)==0){o=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){o=e;break}if((cY[c[(c[e>>2]|0)+36>>2]&255](e)|0)==-1){c[h>>2]=0;o=0;break}else{o=c[h>>2]|0;break}}}while(0);h=(o|0)==0;do{if(m){k=2117}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(!(h^(l|0)==0)){break}i=b;return}if((cY[c[(c[l>>2]|0)+36>>2]&255](l)|0)==-1){c[j>>2]=0;k=2117;break}if(!h){break}i=b;return}}while(0);do{if((k|0)==2117){if(h){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}function jR(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=i;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){l=d;break}if((cY[c[(c[d>>2]|0)+36>>2]&255](d)|0)==-1){c[k>>2]=0;l=0;break}else{l=c[k>>2]|0;break}}}while(0);d=(l|0)==0;l=e|0;e=c[l>>2]|0;L2589:do{if((e|0)==0){m=2137}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((cY[c[(c[e>>2]|0)+36>>2]&255](e)|0)!=-1){break}c[l>>2]=0;m=2137;break L2589}}while(0);if(d){n=e}else{m=2138}}}while(0);if((m|0)==2137){if(d){m=2138}else{n=0}}if((m|0)==2138){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}d=c[k>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){p=(cY[c[(c[d>>2]|0)+36>>2]&255](d)|0)&255}else{p=a[e]|0}do{if(p<<24>>24>=0){e=g+8|0;if((b[(c[e>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){break}d=g;q=(cW[c[(c[d>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24;r=c[k>>2]|0;s=r+12|0;t=c[s>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;cY[u&255](r)|0;v=q;w=h;x=n}else{c[s>>2]=t+1;v=q;w=h;x=n}while(1){y=v-48|0;q=w-1|0;t=c[k>>2]|0;do{if((t|0)==0){z=0}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){z=t;break}if((cY[c[(c[t>>2]|0)+36>>2]&255](t)|0)==-1){c[k>>2]=0;z=0;break}else{z=c[k>>2]|0;break}}}while(0);t=(z|0)==0;if((x|0)==0){A=z;B=0}else{do{if((c[x+12>>2]|0)==(c[x+16>>2]|0)){if((cY[c[(c[x>>2]|0)+36>>2]&255](x)|0)!=-1){C=x;break}c[l>>2]=0;C=0}else{C=x}}while(0);A=c[k>>2]|0;B=C}D=(B|0)==0;if(!((t^D)&(q|0)>0)){m=2167;break}s=c[A+12>>2]|0;if((s|0)==(c[A+16>>2]|0)){E=(cY[c[(c[A>>2]|0)+36>>2]&255](A)|0)&255}else{E=a[s]|0}if(E<<24>>24<0){o=y;m=2185;break}if((b[(c[e>>2]|0)+(E<<24>>24<<1)>>1]&2048)==0){o=y;m=2183;break}s=((cW[c[(c[d>>2]|0)+36>>2]&63](g,E,0)|0)<<24>>24)+(y*10|0)|0;r=c[k>>2]|0;u=r+12|0;F=c[u>>2]|0;if((F|0)==(c[r+16>>2]|0)){G=c[(c[r>>2]|0)+40>>2]|0;cY[G&255](r)|0;v=s;w=q;x=B;continue}else{c[u>>2]=F+1;v=s;w=q;x=B;continue}}if((m|0)==2167){do{if((A|0)==0){H=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){H=A;break}if((cY[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[k>>2]=0;H=0;break}else{H=c[k>>2]|0;break}}}while(0);d=(H|0)==0;L2646:do{if(D){m=2177}else{do{if((c[B+12>>2]|0)==(c[B+16>>2]|0)){if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){break}c[l>>2]=0;m=2177;break L2646}}while(0);if(d){o=y}else{break}i=j;return o|0}}while(0);do{if((m|0)==2177){if(d){break}else{o=y}i=j;return o|0}}while(0);c[f>>2]=c[f>>2]|2;o=y;i=j;return o|0}else if((m|0)==2183){i=j;return o|0}else if((m|0)==2185){i=j;return o|0}}}while(0);c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}function jS(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0;l=i;i=i+48|0;m=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[m>>2];m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=l|0;n=l+16|0;o=l+24|0;p=l+32|0;q=l+40|0;hd(n,f);r=n|0;n=c[r>>2]|0;if((c[5296]|0)!=-1){c[m>>2]=21184;c[m+4>>2]=20;c[m+8>>2]=0;gP(21184,m,142)}m=(c[5297]|0)-1|0;s=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;v=c[r>>2]|0;gs(v)|0;c[g>>2]=0;v=d|0;L2669:do{if((j|0)==(k|0)){w=2257}else{x=e|0;y=t;z=t;A=t;B=b;C=p|0;D=q|0;E=o|0;F=j;G=0;L2671:while(1){H=G;while(1){if((H|0)!=0){w=2257;break L2669}I=c[v>>2]|0;do{if((I|0)==0){J=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){L=cY[c[(c[I>>2]|0)+36>>2]&255](I)|0}else{L=c[K>>2]|0}if((L|0)!=-1){J=I;break}c[v>>2]=0;J=0}}while(0);I=(J|0)==0;K=c[x>>2]|0;do{if((K|0)==0){w=2209}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=cY[c[(c[K>>2]|0)+36>>2]&255](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[x>>2]=0;w=2209;break}else{if(I^(K|0)==0){O=K;break}else{w=2211;break L2671}}}}while(0);if((w|0)==2209){w=0;if(I){w=2211;break L2671}else{O=0}}if((cW[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){w=2214;break}if(cW[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){P=F;w=2224;break}Q=J+12|0;K=c[Q>>2]|0;R=J+16|0;if((K|0)==(c[R>>2]|0)){S=cY[c[(c[J>>2]|0)+36>>2]&255](J)|0}else{S=c[K>>2]|0}K=cV[c[(c[A>>2]|0)+28>>2]&63](u,S)|0;if((K|0)==(cV[c[(c[A>>2]|0)+28>>2]&63](u,c[F>>2]|0)|0)){w=2252;break}c[g>>2]=4;H=4}L2703:do{if((w|0)==2252){w=0;H=c[Q>>2]|0;if((H|0)==(c[R>>2]|0)){K=c[(c[J>>2]|0)+40>>2]|0;cY[K&255](J)|0}else{c[Q>>2]=H+4}T=F+4|0}else if((w|0)==2214){w=0;H=F+4|0;if((H|0)==(k|0)){w=2215;break L2671}K=cW[c[(c[y>>2]|0)+52>>2]&63](u,c[H>>2]|0,0)|0;if((K<<24>>24|0)==69|(K<<24>>24|0)==48){M=F+8|0;if((M|0)==(k|0)){w=2218;break L2671}U=K;V=cW[c[(c[y>>2]|0)+52>>2]&63](u,c[M>>2]|0,0)|0;W=M}else{U=0;V=K;W=H}H=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=O;c1[H&7](o,b,p,q,f,g,h,V,U);c[v>>2]=c[E>>2];T=W+4|0}else if((w|0)==2224){while(1){w=0;H=P+4|0;if((H|0)==(k|0)){X=k;break}if(cW[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[H>>2]|0)|0){P=H;w=2224}else{X=H;break}}I=J;H=O;while(1){do{if((I|0)==0){Y=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){Z=cY[c[(c[I>>2]|0)+36>>2]&255](I)|0}else{Z=c[K>>2]|0}if((Z|0)!=-1){Y=I;break}c[v>>2]=0;Y=0}}while(0);K=(Y|0)==0;do{if((H|0)==0){w=2239}else{M=c[H+12>>2]|0;if((M|0)==(c[H+16>>2]|0)){_=cY[c[(c[H>>2]|0)+36>>2]&255](H)|0}else{_=c[M>>2]|0}if((_|0)==-1){c[x>>2]=0;w=2239;break}else{if(K^(H|0)==0){$=H;break}else{T=X;break L2703}}}}while(0);if((w|0)==2239){w=0;if(K){T=X;break L2703}else{$=0}}M=Y+12|0;aa=c[M>>2]|0;ab=Y+16|0;if((aa|0)==(c[ab>>2]|0)){ac=cY[c[(c[Y>>2]|0)+36>>2]&255](Y)|0}else{ac=c[aa>>2]|0}if(!(cW[c[(c[z>>2]|0)+12>>2]&63](u,8192,ac)|0)){T=X;break L2703}aa=c[M>>2]|0;if((aa|0)==(c[ab>>2]|0)){ab=c[(c[Y>>2]|0)+40>>2]|0;cY[ab&255](Y)|0;I=Y;H=$;continue}else{c[M>>2]=aa+4;I=Y;H=$;continue}}}}while(0);if((T|0)==(k|0)){w=2257;break L2669}F=T;G=c[g>>2]|0}if((w|0)==2211){c[g>>2]=4;ad=J;break}else if((w|0)==2215){c[g>>2]=4;ad=J;break}else if((w|0)==2218){c[g>>2]=4;ad=J;break}}}while(0);if((w|0)==2257){ad=c[v>>2]|0}u=d|0;do{if((ad|0)!=0){t=c[ad+12>>2]|0;if((t|0)==(c[ad+16>>2]|0)){ae=cY[c[(c[ad>>2]|0)+36>>2]&255](ad)|0}else{ae=c[t>>2]|0}if((ae|0)!=-1){break}c[u>>2]=0}}while(0);v=c[u>>2]|0;t=(v|0)==0;G=e|0;F=c[G>>2]|0;do{if((F|0)==0){w=2270}else{z=c[F+12>>2]|0;if((z|0)==(c[F+16>>2]|0)){af=cY[c[(c[F>>2]|0)+36>>2]&255](F)|0}else{af=c[z>>2]|0}if((af|0)==-1){c[G>>2]=0;w=2270;break}if(!(t^(F|0)==0)){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);do{if((w|0)==2270){if(t){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ag=a|0;c[ag>>2]=v;i=l;return}}while(0);l=cx(4)|0;nC(l);bL(l|0,12712,196)}function jT(a){a=a|0;gq(a|0);n6(a);return}function jU(a){a=a|0;gq(a|0);return}function jV(a){a=a|0;return 2}function jW(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];jS(a,b,k,l,f,g,h,5072,5104);i=j;return}function jX(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=cY[c[(c[n>>2]|0)+20>>2]&255](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=a[o]|0;if((f&1)==0){p=o+4|0;q=o+4|0}else{e=c[o+8>>2]|0;p=e;q=e}e=f&255;if((e&1|0)==0){r=e>>>1}else{r=c[o+4>>2]|0}jS(b,d,l,m,g,h,j,q,p+(r<<2)|0);i=k;return}function jY(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gs(o)|0;o=c[e>>2]|0;q=b+8|0;r=cY[c[c[q>>2]>>2]&255](q)|0;c[k>>2]=o;o=(iO(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function jZ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;hd(m,f);f=m|0;m=c[f>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;gs(o)|0;o=c[e>>2]|0;q=b+8|0;r=cY[c[(c[q>>2]|0)+4>>2]&255](q)|0;c[k>>2]=o;o=(iO(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=cx(4)|0;nC(j);bL(j|0,12712,196)}function j_(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;hd(l,f);f=l|0;l=c[f>>2]|0;if((c[5296]|0)!=-1){c[k>>2]=21184;c[k+4>>2]=20;c[k+8>>2]=0;gP(21184,k,142)}k=(c[5297]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;gs(n)|0;c[j>>2]=c[e>>2];n=j3(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=cx(4)|0;nC(b);bL(b|0,12712,196)}function j$(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;hd(z,g);_=z|0;z=c[_>>2]|0;if((c[5296]|0)!=-1){c[y>>2]=21184;c[y+4>>2]=20;c[y+8>>2]=0;gP(21184,y,142)}y=(c[5297]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;gs(aa)|0;L2846:do{switch(k<<24>>24|0){case 121:{c[n>>2]=c[f>>2];aa=j3(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2846}if((aa|0)<69){ac=aa+2e3|0}else{ac=(aa-69|0)>>>0<31>>>0?aa+1900|0:aa}c[j+20>>2]=ac-1900;break};case 88:{aa=d+8|0;ad=cY[c[(c[aa>>2]|0)+24>>2]&255](aa)|0;aa=e|0;c[X>>2]=c[aa>>2];c[Y>>2]=c[f>>2];ae=a[ad]|0;if((ae&1)==0){af=ad+4|0;ag=ad+4|0}else{ah=c[ad+8>>2]|0;af=ah;ag=ah}ah=ae&255;if((ah&1|0)==0){ai=ah>>>1}else{ai=c[ad+4>>2]|0}jS(W,d,X,Y,g,h,j,ag,af+(ai<<2)|0);c[aa>>2]=c[W>>2];break};case 68:{aa=e|0;c[E>>2]=c[aa>>2];c[F>>2]=c[f>>2];jS(D,d,E,F,g,h,j,5040,5072);c[aa>>2]=c[D>>2];break};case 72:{c[u>>2]=c[f>>2];aa=j3(e,u,h,ab,2)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L2846}else{c[h>>2]=ad|4;break L2846}break};case 114:{ad=e|0;c[M>>2]=c[ad>>2];c[N>>2]=c[f>>2];jS(L,d,M,N,g,h,j,4992,5036);c[ad>>2]=c[L>>2];break};case 82:{ad=e|0;c[P>>2]=c[ad>>2];c[Q>>2]=c[f>>2];jS(O,d,P,Q,g,h,j,4968,4988);c[ad>>2]=c[O>>2];break};case 70:{ad=e|0;c[H>>2]=c[ad>>2];c[I>>2]=c[f>>2];jS(G,d,H,I,g,h,j,4904,4936);c[ad>>2]=c[G>>2];break};case 106:{c[s>>2]=c[f>>2];ad=j3(e,s,h,ab,3)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ad|0)<366){c[j+28>>2]=ad;break L2846}else{c[h>>2]=aa|4;break L2846}break};case 73:{aa=j+8|0;c[t>>2]=c[f>>2];ad=j3(e,t,h,ab,2)|0;ah=c[h>>2]|0;do{if((ah&4|0)==0){if((ad-1|0)>>>0>=12>>>0){break}c[aa>>2]=ad;break L2846}}while(0);c[h>>2]=ah|4;break};case 83:{c[p>>2]=c[f>>2];ad=j3(e,p,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ad|0)<61){c[j>>2]=ad;break L2846}else{c[h>>2]=aa|4;break L2846}break};case 119:{c[o>>2]=c[f>>2];aa=j3(e,o,h,ab,1)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(aa|0)<7){c[j+24>>2]=aa;break L2846}else{c[h>>2]=ad|4;break L2846}break};case 77:{c[q>>2]=c[f>>2];ad=j3(e,q,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ad|0)<60){c[j+4>>2]=ad;break L2846}else{c[h>>2]=aa|4;break L2846}break};case 100:case 101:{aa=j+12|0;c[v>>2]=c[f>>2];ad=j3(e,v,h,ab,2)|0;ae=c[h>>2]|0;do{if((ae&4|0)==0){if((ad-1|0)>>>0>=31>>>0){break}c[aa>>2]=ad;break L2846}}while(0);c[h>>2]=ae|4;break};case 120:{ad=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];cZ[ad&127](b,d,U,V,g,h,j);i=l;return};case 98:case 66:case 104:{ad=c[f>>2]|0;aa=d+8|0;ah=cY[c[(c[aa>>2]|0)+4>>2]&255](aa)|0;c[w>>2]=ad;ad=(iO(e,w,ah,ah+288|0,ab,h,0)|0)-ah|0;if((ad|0)>=288){break L2846}c[j+16>>2]=((ad|0)/12|0|0)%12|0;break};case 109:{c[r>>2]=c[f>>2];ad=(j3(e,r,h,ab,2)|0)-1|0;ah=c[h>>2]|0;if((ah&4|0)==0&(ad|0)<12){c[j+16>>2]=ad;break L2846}else{c[h>>2]=ah|4;break L2846}break};case 97:case 65:{ah=c[f>>2]|0;ad=d+8|0;aa=cY[c[c[ad>>2]>>2]&255](ad)|0;c[x>>2]=ah;ah=(iO(e,x,aa,aa+168|0,ab,h,0)|0)-aa|0;if((ah|0)>=168){break L2846}c[j+24>>2]=((ah|0)/12|0|0)%7|0;break};case 89:{c[m>>2]=c[f>>2];ah=j3(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2846}c[j+20>>2]=ah-1900;break};case 99:{ah=d+8|0;aa=cY[c[(c[ah>>2]|0)+12>>2]&255](ah)|0;ah=e|0;c[B>>2]=c[ah>>2];c[C>>2]=c[f>>2];ad=a[aa]|0;if((ad&1)==0){aj=aa+4|0;ak=aa+4|0}else{al=c[aa+8>>2]|0;aj=al;ak=al}al=ad&255;if((al&1|0)==0){am=al>>>1}else{am=c[aa+4>>2]|0}jS(A,d,B,C,g,h,j,ak,aj+(am<<2)|0);c[ah>>2]=c[A>>2];break};case 84:{ah=e|0;c[S>>2]=c[ah>>2];c[T>>2]=c[f>>2];jS(R,d,S,T,g,h,j,4936,4968);c[ah>>2]=c[R>>2];break};case 110:case 116:{c[J>>2]=c[f>>2];j0(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];j1(d,j+8|0,e,K,h,ab);break};case 37:{c[Z>>2]=c[f>>2];j2(0,e,Z,h,ab);break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=cx(4)|0;nC(l);bL(l|0,12712,196)}function j0(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=d|0;d=f;L2927:while(1){h=c[g>>2]|0;do{if((h|0)==0){j=1}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){l=cY[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[g>>2]=0;j=1;break}else{j=(c[g>>2]|0)==0;break}}}while(0);h=c[b>>2]|0;do{if((h|0)==0){m=2414}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){n=cY[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{n=c[k>>2]|0}if((n|0)==-1){c[b>>2]=0;m=2414;break}else{k=(h|0)==0;if(j^k){o=h;p=k;break}else{q=h;r=k;break L2927}}}}while(0);if((m|0)==2414){m=0;if(j){q=0;r=1;break}else{o=0;p=1}}h=c[g>>2]|0;k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){s=cY[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{s=c[k>>2]|0}if(!(cW[c[(c[d>>2]|0)+12>>2]&63](f,8192,s)|0)){q=o;r=p;break}k=c[g>>2]|0;h=k+12|0;t=c[h>>2]|0;if((t|0)==(c[k+16>>2]|0)){u=c[(c[k>>2]|0)+40>>2]|0;cY[u&255](k)|0;continue}else{c[h>>2]=t+4;continue}}p=c[g>>2]|0;do{if((p|0)==0){v=1}else{o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){w=cY[c[(c[p>>2]|0)+36>>2]&255](p)|0}else{w=c[o>>2]|0}if((w|0)==-1){c[g>>2]=0;v=1;break}else{v=(c[g>>2]|0)==0;break}}}while(0);do{if(r){m=2436}else{g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){x=cY[c[(c[q>>2]|0)+36>>2]&255](q)|0}else{x=c[g>>2]|0}if((x|0)==-1){c[b>>2]=0;m=2436;break}if(!(v^(q|0)==0)){break}i=a;return}}while(0);do{if((m|0)==2436){if(v){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function j1(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=cY[c[(c[l>>2]|0)+8>>2]&255](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=iO(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function j2(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=c[g>>2]|0;do{if((b|0)==0){h=1}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){k=cY[c[(c[b>>2]|0)+36>>2]&255](b)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=2476}else{b=c[d+12>>2]|0;if((b|0)==(c[d+16>>2]|0)){m=cY[c[(c[d>>2]|0)+36>>2]&255](d)|0}else{m=c[b>>2]|0}if((m|0)==-1){c[k>>2]=0;l=2476;break}else{b=(d|0)==0;if(h^b){n=d;o=b;break}else{l=2478;break}}}}while(0);if((l|0)==2476){if(h){l=2478}else{n=0;o=1}}if((l|0)==2478){c[e>>2]=c[e>>2]|6;i=a;return}h=c[g>>2]|0;d=c[h+12>>2]|0;if((d|0)==(c[h+16>>2]|0)){p=cY[c[(c[h>>2]|0)+36>>2]&255](h)|0}else{p=c[d>>2]|0}if((cW[c[(c[f>>2]|0)+52>>2]&63](f,p,0)|0)<<24>>24!=37){c[e>>2]=c[e>>2]|4;i=a;return}p=c[g>>2]|0;f=p+12|0;d=c[f>>2]|0;if((d|0)==(c[p+16>>2]|0)){h=c[(c[p>>2]|0)+40>>2]|0;cY[h&255](p)|0}else{c[f>>2]=d+4}d=c[g>>2]|0;do{if((d|0)==0){q=1}else{f=c[d+12>>2]|0;if((f|0)==(c[d+16>>2]|0)){r=cY[c[(c[d>>2]|0)+36>>2]&255](d)|0}else{r=c[f>>2]|0}if((r|0)==-1){c[g>>2]=0;q=1;break}else{q=(c[g>>2]|0)==0;break}}}while(0);do{if(o){l=2500}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){s=cY[c[(c[n>>2]|0)+36>>2]&255](n)|0}else{s=c[g>>2]|0}if((s|0)==-1){c[k>>2]=0;l=2500;break}if(!(q^(n|0)==0)){break}i=a;return}}while(0);do{if((l|0)==2500){if(q){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function j3(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;h=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[h>>2];h=a|0;a=c[h>>2]|0;do{if((a|0)==0){j=1}else{k=c[a+12>>2]|0;if((k|0)==(c[a+16>>2]|0)){l=cY[c[(c[a>>2]|0)+36>>2]&255](a)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[h>>2]=0;j=1;break}else{j=(c[h>>2]|0)==0;break}}}while(0);l=b|0;b=c[l>>2]|0;do{if((b|0)==0){m=2522}else{a=c[b+12>>2]|0;if((a|0)==(c[b+16>>2]|0)){n=cY[c[(c[b>>2]|0)+36>>2]&255](b)|0}else{n=c[a>>2]|0}if((n|0)==-1){c[l>>2]=0;m=2522;break}else{if(j^(b|0)==0){o=b;break}else{m=2524;break}}}}while(0);if((m|0)==2522){if(j){m=2524}else{o=0}}if((m|0)==2524){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}j=c[h>>2]|0;b=c[j+12>>2]|0;if((b|0)==(c[j+16>>2]|0)){q=cY[c[(c[j>>2]|0)+36>>2]&255](j)|0}else{q=c[b>>2]|0}b=e;if(!(cW[c[(c[b>>2]|0)+12>>2]&63](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}j=e;n=(cW[c[(c[j>>2]|0)+52>>2]&63](e,q,0)|0)<<24>>24;q=c[h>>2]|0;a=q+12|0;k=c[a>>2]|0;if((k|0)==(c[q+16>>2]|0)){r=c[(c[q>>2]|0)+40>>2]|0;cY[r&255](q)|0;s=n;t=f;u=o}else{c[a>>2]=k+4;s=n;t=f;u=o}while(1){v=s-48|0;o=t-1|0;f=c[h>>2]|0;do{if((f|0)==0){w=0}else{n=c[f+12>>2]|0;if((n|0)==(c[f+16>>2]|0)){x=cY[c[(c[f>>2]|0)+36>>2]&255](f)|0}else{x=c[n>>2]|0}if((x|0)==-1){c[h>>2]=0;w=0;break}else{w=c[h>>2]|0;break}}}while(0);f=(w|0)==0;if((u|0)==0){y=w;z=0}else{n=c[u+12>>2]|0;if((n|0)==(c[u+16>>2]|0)){A=cY[c[(c[u>>2]|0)+36>>2]&255](u)|0}else{A=c[n>>2]|0}if((A|0)==-1){c[l>>2]=0;B=0}else{B=u}y=c[h>>2]|0;z=B}C=(z|0)==0;if(!((f^C)&(o|0)>0)){break}f=c[y+12>>2]|0;if((f|0)==(c[y+16>>2]|0)){D=cY[c[(c[y>>2]|0)+36>>2]&255](y)|0}else{D=c[f>>2]|0}if(!(cW[c[(c[b>>2]|0)+12>>2]&63](e,2048,D)|0)){p=v;m=2575;break}f=((cW[c[(c[j>>2]|0)+52>>2]&63](e,D,0)|0)<<24>>24)+(v*10|0)|0;n=c[h>>2]|0;k=n+12|0;a=c[k>>2]|0;if((a|0)==(c[n+16>>2]|0)){q=c[(c[n>>2]|0)+40>>2]|0;cY[q&255](n)|0;s=f;t=o;u=z;continue}else{c[k>>2]=a+4;s=f;t=o;u=z;continue}}if((m|0)==2575){i=g;return p|0}do{if((y|0)==0){E=1}else{u=c[y+12>>2]|0;if((u|0)==(c[y+16>>2]|0)){F=cY[c[(c[y>>2]|0)+36>>2]&255](y)|0}else{F=c[u>>2]|0}if((F|0)==-1){c[h>>2]=0;E=1;break}else{E=(c[h>>2]|0)==0;break}}}while(0);do{if(C){m=2568}else{h=c[z+12>>2]|0;if((h|0)==(c[z+16>>2]|0)){G=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{G=c[h>>2]|0}if((G|0)==-1){c[l>>2]=0;m=2568;break}if(E^(z|0)==0){p=v}else{break}i=g;return p|0}}while(0);do{if((m|0)==2568){if(E){break}else{p=v}i=g;return p|0}}while(0);c[d>>2]=c[d>>2]|2;p=v;i=g;return p|0}function j4(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((f|0)==(c[4272]|0)){g=b|0;gq(g);n6(d);return}br(c[e>>2]|0);g=b|0;gq(g);n6(d);return}function j5(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((e|0)==(c[4272]|0)){f=b|0;gq(f);return}br(c[d>>2]|0);f=b|0;gq(f);return}function j6(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+112|0;f=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[f>>2];f=g|0;l=g+8|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=bJ(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=cV[c[(c[s>>2]|0)+52>>2]&63](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function j7(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((f|0)==(c[4272]|0)){g=b|0;gq(g);n6(d);return}br(c[e>>2]|0);g=b|0;gq(g);n6(d);return}function j8(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((e|0)==(c[4272]|0)){f=b|0;gq(f);return}br(c[d>>2]|0);f=b|0;gq(f);return}function j9(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+408|0;e=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[e>>2];e=f|0;k=f+400|0;l=e|0;c[k>>2]=e+400;ka(b+8|0,l,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((l|0)==(j|0)){m=k;n=a|0;c[n>>2]=m;i=f;return}else{o=k;p=l}while(1){l=c[p>>2]|0;if((o|0)==0){q=0}else{k=o+24|0;d=c[k>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=cV[c[(c[o>>2]|0)+52>>2]&63](o,l)|0}else{c[k>>2]=d+4;c[d>>2]=l;r=l}q=(r|0)==-1?0:o}l=p+4|0;if((l|0)==(j|0)){m=q;break}else{o=q;p=l}}n=a|0;c[n>>2]=m;i=f;return}function ka(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;k=j|0;l=j+112|0;m=i;i=i+4|0;i=i+7&-8;n=j+8|0;o=k|0;a[o]=37;p=k+1|0;a[p]=g;q=k+2|0;a[q]=h;a[k+3|0]=0;if(h<<24>>24!=0){a[p]=h;a[q]=g}g=b|0;bJ(n|0,100,o|0,f|0,c[g>>2]|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[m>>2]=n;n=(c[e>>2]|0)-d>>2;f=cf(c[g>>2]|0)|0;g=ns(d,m,n,l)|0;if((f|0)!=0){cf(f|0)|0}if((g|0)==-1){kY(2288)}else{c[e>>2]=d+(g<<2);i=j;return}}function kb(a){a=a|0;gq(a|0);n6(a);return}function kc(a){a=a|0;gq(a|0);return}function kd(a){a=a|0;return 127}function ke(a){a=a|0;return 127}function kf(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kg(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kh(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function ki(a,b){a=a|0;b=b|0;gT(a,1,45);return}function kj(a){a=a|0;return 0}function kk(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kl(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function km(a){a=a|0;gq(a|0);n6(a);return}function kn(a){a=a|0;gq(a|0);return}function ko(a){a=a|0;return 127}function kp(a){a=a|0;return 127}function kq(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kr(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function ks(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kt(a,b){a=a|0;b=b|0;gT(a,1,45);return}function ku(a){a=a|0;return 0}function kv(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kw(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kx(a){a=a|0;gq(a|0);n6(a);return}function ky(a){a=a|0;gq(a|0);return}function kz(a){a=a|0;return 2147483647}function kA(a){a=a|0;return 2147483647}function kB(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kC(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kD(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kE(a,b){a=a|0;b=b|0;g2(a,1,45);return}function kF(a){a=a|0;return 0}function kG(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kH(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kI(a){a=a|0;gq(a|0);n6(a);return}function kJ(a){a=a|0;gq(a|0);return}function kK(a){a=a|0;return 2147483647}function kL(a){a=a|0;return 2147483647}function kM(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kN(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kO(a,b){a=a|0;b=b|0;of(a|0,0,12);return}function kP(a,b){a=a|0;b=b|0;g2(a,1,45);return}function kQ(a){a=a|0;return 0}function kR(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kS(b,c){b=b|0;c=c|0;c=b;E=67109634;a[c]=E&255;E=E>>8;a[c+1|0]=E&255;E=E>>8;a[c+2|0]=E&255;E=E>>8;a[c+3|0]=E&255;return}function kT(a){a=a|0;gq(a|0);n6(a);return}function kU(a){a=a|0;gq(a|0);return}function kV(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+280|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=d+160|0;t=d+176|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=230;w=m+100|0;hd(p,h);m=p|0;x=c[m>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(kX(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+32>>2]|0;c4[D&15](A,4888,4898,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>98){H=n$(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}ob();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+10|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((a[N]|0)==(a[M]|0)){O=N;break}else{N=N+1|0}}a[L]=a[4888+(O-H)|0]|0;N=M+1|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=ci(D|0,4144,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}n0(J);break}M=cx(8)|0;gy(M,4096);bL(M|0,12744,34)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){R=z;break}if((cY[c[(c[z>>2]|0)+36>>2]&255](z)|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){S=2751}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(A){break}else{S=2753;break}}if((cY[c[(c[z>>2]|0)+36>>2]&255](z)|0)==-1){c[B>>2]=0;S=2751;break}else{if(A^(z|0)==0){break}else{S=2753;break}}}}while(0);if((S|0)==2751){if(A){S=2753}}if((S|0)==2753){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;gs(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}cT[c[v>>2]&511](z);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function kW(a){a=a|0;return}function kX(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0;q=i;i=i+440|0;r=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[r>>2];r=q|0;s=q+400|0;t=q+408|0;u=q+416|0;v=q+424|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=r|0;of(w|0,0,12);E=x;F=y;G=z;H=A;of(E|0,0,12);of(F|0,0,12);of(G|0,0,12);of(H|0,0,12);k$(g,h,s,t,u,v,x,y,z,B);h=n|0;c[o>>2]=c[h>>2];g=e|0;e=f|0;f=m+8|0;m=z+1|0;I=z+4|0;J=z+8|0;K=y+1|0;L=y+4|0;M=y+8|0;N=(j&512|0)!=0;j=x+1|0;O=x+4|0;P=x+8|0;Q=A+1|0;R=A+4|0;S=A+8|0;T=s+3|0;U=v+4|0;V=n+4|0;n=p;p=230;W=D;X=D;D=r+400|0;r=0;Y=0;L3359:while(1){Z=c[g>>2]|0;do{if((Z|0)==0){_=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){_=Z;break}if((cY[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[g>>2]=0;_=0;break}else{_=c[g>>2]|0;break}}}while(0);Z=(_|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=2779}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=3038;break L3359}}if((cY[c[(c[$>>2]|0)+36>>2]&255]($)|0)==-1){c[e>>2]=0;aa=2779;break}else{if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=3038;break L3359}}}}while(0);if((aa|0)==2779){aa=0;if(Z){ac=p;ad=W;ae=X;af=r;aa=3038;break}else{ab=0}}L3381:do{switch(a[s+Y|0]|0){case 3:{$=a[F]|0;ag=$&255;ah=(ag&1|0)==0?ag>>>1:c[L>>2]|0;ag=a[G]|0;ai=ag&255;aj=(ai&1|0)==0?ai>>>1:c[I>>2]|0;if((ah|0)==(-aj|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3381}ai=(ah|0)==0;ah=c[g>>2]|0;aq=c[ah+12>>2]|0;ar=c[ah+16>>2]|0;as=(aq|0)==(ar|0);if(!(ai|(aj|0)==0)){if(as){aj=(cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0)&255;at=c[g>>2]|0;au=aj;av=a[F]|0;aw=at;ax=c[at+12>>2]|0;ay=c[at+16>>2]|0}else{au=a[aq]|0;av=$;aw=ah;ax=aq;ay=ar}ar=aw+12|0;at=(ax|0)==(ay|0);if(au<<24>>24==(a[(av&1)==0?K:c[M>>2]|0]|0)){if(at){aj=c[(c[aw>>2]|0)+40>>2]|0;cY[aj&255](aw)|0}else{c[ar>>2]=ax+1}ar=d[F]|0;ak=((ar&1|0)==0?ar>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break L3381}if(at){az=(cY[c[(c[aw>>2]|0)+36>>2]&255](aw)|0)&255}else{az=a[ax]|0}if(az<<24>>24!=(a[(a[G]&1)==0?m:c[J>>2]|0]|0)){aa=2874;break L3359}at=c[g>>2]|0;ar=at+12|0;aj=c[ar>>2]|0;if((aj|0)==(c[at+16>>2]|0)){aA=c[(c[at>>2]|0)+40>>2]|0;cY[aA&255](at)|0}else{c[ar>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L3381}if(ai){if(as){ai=(cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0)&255;aB=ai;aC=a[G]|0}else{aB=a[aq]|0;aC=ag}if(aB<<24>>24!=(a[(aC&1)==0?m:c[J>>2]|0]|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3381}ag=c[g>>2]|0;ai=ag+12|0;aj=c[ai>>2]|0;if((aj|0)==(c[ag+16>>2]|0)){ar=c[(c[ag>>2]|0)+40>>2]|0;cY[ar&255](ag)|0}else{c[ai>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L3381}if(as){as=(cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0)&255;aD=as;aE=a[F]|0}else{aD=a[aq]|0;aE=$}if(aD<<24>>24!=(a[(aE&1)==0?K:c[M>>2]|0]|0)){a[l]=1;ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3381}$=c[g>>2]|0;aq=$+12|0;as=c[aq>>2]|0;if((as|0)==(c[$+16>>2]|0)){ah=c[(c[$>>2]|0)+40>>2]|0;cY[ah&255]($)|0}else{c[aq>>2]=as+1}as=d[F]|0;ak=((as&1|0)==0?as>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break};case 0:{aa=2807;break};case 2:{if(!((r|0)!=0|Y>>>0<2>>>0)){if((Y|0)==2){aF=(a[T]|0)!=0}else{aF=0}if(!(N|aF)){ak=0;al=D;am=X;an=W;ao=p;ap=n;break L3381}}as=a[E]|0;aq=c[P>>2]|0;$=(as&1)==0?j:aq;L3441:do{if((Y|0)==0){aG=$;aH=as;aI=aq}else{if((d[s+(Y-1)|0]|0)>>>0>=2>>>0){aG=$;aH=as;aI=aq;break}ah=as&255;L3444:do{if((((ah&1|0)==0?ah>>>1:c[O>>2]|0)|0)==0){aJ=$;aK=as;aL=aq}else{aj=$;while(1){ai=a[aj]|0;if((b4(ai|0)|0)==0){break}if((b[(c[f>>2]|0)+(ai<<1)>>1]&8192)==0){break}ai=aj+1|0;ag=a[E]|0;ar=c[P>>2]|0;at=ag&255;if((ai|0)==(((ag&1)==0?j:ar)+((at&1|0)==0?at>>>1:c[O>>2]|0)|0)){aJ=ai;aK=ag;aL=ar;break L3444}else{aj=ai}}aJ=aj;aK=a[E]|0;aL=c[P>>2]|0}}while(0);ah=(aK&1)==0?j:aL;ai=aJ-ah|0;ar=a[H]|0;ag=ar&255;at=(ag&1|0)==0?ag>>>1:c[R>>2]|0;if(ai>>>0>at>>>0){aG=ah;aH=aK;aI=aL;break}ag=(ar&1)==0?Q:c[S>>2]|0;ar=ag+at|0;if((aJ|0)==(ah|0)){aG=aJ;aH=aK;aI=aL;break}aA=ag+(at-ai)|0;ai=ah;while(1){if((a[aA]|0)!=(a[ai]|0)){aG=ah;aH=aK;aI=aL;break L3441}at=aA+1|0;if((at|0)==(ar|0)){aG=aJ;aH=aK;aI=aL;break}else{aA=at;ai=ai+1|0}}}}while(0);$=aH&255;L3458:do{if((aG|0)==(((aH&1)==0?j:aI)+(($&1|0)==0?$>>>1:c[O>>2]|0)|0)){aM=aG}else{aq=ab;as=aG;while(1){ai=c[g>>2]|0;do{if((ai|0)==0){aN=0}else{if((c[ai+12>>2]|0)!=(c[ai+16>>2]|0)){aN=ai;break}if((cY[c[(c[ai>>2]|0)+36>>2]&255](ai)|0)==-1){c[g>>2]=0;aN=0;break}else{aN=c[g>>2]|0;break}}}while(0);ai=(aN|0)==0;do{if((aq|0)==0){aa=2905}else{if((c[aq+12>>2]|0)!=(c[aq+16>>2]|0)){if(ai){aO=aq;break}else{aM=as;break L3458}}if((cY[c[(c[aq>>2]|0)+36>>2]&255](aq)|0)==-1){c[e>>2]=0;aa=2905;break}else{if(ai){aO=aq;break}else{aM=as;break L3458}}}}while(0);if((aa|0)==2905){aa=0;if(ai){aM=as;break L3458}else{aO=0}}aj=c[g>>2]|0;aA=c[aj+12>>2]|0;if((aA|0)==(c[aj+16>>2]|0)){aP=(cY[c[(c[aj>>2]|0)+36>>2]&255](aj)|0)&255}else{aP=a[aA]|0}if(aP<<24>>24!=(a[as]|0)){aM=as;break L3458}aA=c[g>>2]|0;aj=aA+12|0;ar=c[aj>>2]|0;if((ar|0)==(c[aA+16>>2]|0)){ah=c[(c[aA>>2]|0)+40>>2]|0;cY[ah&255](aA)|0}else{c[aj>>2]=ar+1}ar=as+1|0;aj=a[E]|0;aA=aj&255;if((ar|0)==(((aj&1)==0?j:c[P>>2]|0)+((aA&1|0)==0?aA>>>1:c[O>>2]|0)|0)){aM=ar;break}else{aq=aO;as=ar}}}}while(0);if(!N){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3381}$=a[E]|0;as=$&255;if((aM|0)==((($&1)==0?j:c[P>>2]|0)+((as&1|0)==0?as>>>1:c[O>>2]|0)|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n}else{aa=2918;break L3359}break};case 1:{if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=3038;break L3359}as=c[g>>2]|0;$=c[as+12>>2]|0;if(($|0)==(c[as+16>>2]|0)){aQ=(cY[c[(c[as>>2]|0)+36>>2]&255](as)|0)&255}else{aQ=a[$]|0}$=aQ<<24>>24;if((b4($|0)|0)==0){aa=2806;break L3359}if((b[(c[f>>2]|0)+($<<1)>>1]&8192)==0){aa=2806;break L3359}$=c[g>>2]|0;as=$+12|0;aq=c[as>>2]|0;if((aq|0)==(c[$+16>>2]|0)){aR=(cY[c[(c[$>>2]|0)+40>>2]&255]($)|0)&255}else{c[as>>2]=aq+1;aR=a[aq]|0}gZ(A,aR);aa=2807;break};case 4:{aq=0;as=D;$=X;ar=W;aA=p;aj=n;L3508:while(1){ah=c[g>>2]|0;do{if((ah|0)==0){aS=0}else{if((c[ah+12>>2]|0)!=(c[ah+16>>2]|0)){aS=ah;break}if((cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0)==-1){c[g>>2]=0;aS=0;break}else{aS=c[g>>2]|0;break}}}while(0);ah=(aS|0)==0;at=c[e>>2]|0;do{if((at|0)==0){aa=2931}else{if((c[at+12>>2]|0)!=(c[at+16>>2]|0)){if(ah){break}else{break L3508}}if((cY[c[(c[at>>2]|0)+36>>2]&255](at)|0)==-1){c[e>>2]=0;aa=2931;break}else{if(ah){break}else{break L3508}}}}while(0);if((aa|0)==2931){aa=0;if(ah){break}}at=c[g>>2]|0;ag=c[at+12>>2]|0;if((ag|0)==(c[at+16>>2]|0)){aT=(cY[c[(c[at>>2]|0)+36>>2]&255](at)|0)&255}else{aT=a[ag]|0}ag=aT<<24>>24;do{if((b4(ag|0)|0)==0){aa=2951}else{if((b[(c[f>>2]|0)+(ag<<1)>>1]&2048)==0){aa=2951;break}at=c[o>>2]|0;if((at|0)==(aj|0)){aU=(c[V>>2]|0)!=230;aV=c[h>>2]|0;aW=aj-aV|0;aX=aW>>>0<2147483647>>>0?aW<<1:-1;aY=n1(aU?aV:0,aX)|0;if((aY|0)==0){ob()}do{if(aU){c[h>>2]=aY;aZ=aY}else{aV=c[h>>2]|0;c[h>>2]=aY;if((aV|0)==0){aZ=aY;break}cT[c[V>>2]&511](aV);aZ=c[h>>2]|0}}while(0);c[V>>2]=116;aY=aZ+aW|0;c[o>>2]=aY;a_=(c[h>>2]|0)+aX|0;a$=aY}else{a_=aj;a$=at}c[o>>2]=a$+1;a[a$]=aT;a0=aq+1|0;a1=as;a2=$;a3=ar;a4=aA;a5=a_}}while(0);if((aa|0)==2951){aa=0;ag=d[w]|0;if((((ag&1|0)==0?ag>>>1:c[U>>2]|0)|0)==0|(aq|0)==0){break}if(aT<<24>>24!=(a[u]|0)){break}if(($|0)==(as|0)){ag=$-ar|0;ah=ag>>>0<2147483647>>>0?ag<<1:-1;if((aA|0)==230){a6=0}else{a6=ar}aY=n1(a6,ah)|0;aU=aY;if((aY|0)==0){ob()}a7=aU+(ah>>>2<<2)|0;a8=aU+(ag>>2<<2)|0;a9=aU;ba=116}else{a7=as;a8=$;a9=ar;ba=aA}c[a8>>2]=aq;a0=0;a1=a7;a2=a8+4|0;a3=a9;a4=ba;a5=aj}aU=c[g>>2]|0;ag=aU+12|0;ah=c[ag>>2]|0;if((ah|0)==(c[aU+16>>2]|0)){aY=c[(c[aU>>2]|0)+40>>2]|0;cY[aY&255](aU)|0;aq=a0;as=a1;$=a2;ar=a3;aA=a4;aj=a5;continue}else{c[ag>>2]=ah+1;aq=a0;as=a1;$=a2;ar=a3;aA=a4;aj=a5;continue}}if((ar|0)==($|0)|(aq|0)==0){bb=as;bc=$;bd=ar;be=aA}else{if(($|0)==(as|0)){ah=$-ar|0;ag=ah>>>0<2147483647>>>0?ah<<1:-1;if((aA|0)==230){bf=0}else{bf=ar}aU=n1(bf,ag)|0;aY=aU;if((aU|0)==0){ob()}bg=aY+(ag>>>2<<2)|0;bh=aY+(ah>>2<<2)|0;bi=aY;bj=116}else{bg=as;bh=$;bi=ar;bj=aA}c[bh>>2]=aq;bb=bg;bc=bh+4|0;bd=bi;be=bj}if((c[B>>2]|0)>0){aY=c[g>>2]|0;do{if((aY|0)==0){bk=0}else{if((c[aY+12>>2]|0)!=(c[aY+16>>2]|0)){bk=aY;break}if((cY[c[(c[aY>>2]|0)+36>>2]&255](aY)|0)==-1){c[g>>2]=0;bk=0;break}else{bk=c[g>>2]|0;break}}}while(0);aY=(bk|0)==0;aq=c[e>>2]|0;do{if((aq|0)==0){aa=2984}else{if((c[aq+12>>2]|0)!=(c[aq+16>>2]|0)){if(aY){bl=aq;break}else{aa=2991;break L3359}}if((cY[c[(c[aq>>2]|0)+36>>2]&255](aq)|0)==-1){c[e>>2]=0;aa=2984;break}else{if(aY){bl=aq;break}else{aa=2991;break L3359}}}}while(0);if((aa|0)==2984){aa=0;if(aY){aa=2991;break L3359}else{bl=0}}aq=c[g>>2]|0;aA=c[aq+12>>2]|0;if((aA|0)==(c[aq+16>>2]|0)){bm=(cY[c[(c[aq>>2]|0)+36>>2]&255](aq)|0)&255}else{bm=a[aA]|0}if(bm<<24>>24!=(a[t]|0)){aa=2991;break L3359}aA=c[g>>2]|0;aq=aA+12|0;ar=c[aq>>2]|0;if((ar|0)==(c[aA+16>>2]|0)){$=c[(c[aA>>2]|0)+40>>2]|0;cY[$&255](aA)|0;bn=aj;bo=bl}else{c[aq>>2]=ar+1;bn=aj;bo=bl}while(1){ar=c[g>>2]|0;do{if((ar|0)==0){bp=0}else{if((c[ar+12>>2]|0)!=(c[ar+16>>2]|0)){bp=ar;break}if((cY[c[(c[ar>>2]|0)+36>>2]&255](ar)|0)==-1){c[g>>2]=0;bp=0;break}else{bp=c[g>>2]|0;break}}}while(0);ar=(bp|0)==0;do{if((bo|0)==0){aa=3007}else{if((c[bo+12>>2]|0)!=(c[bo+16>>2]|0)){if(ar){bq=bo;break}else{aa=3016;break L3359}}if((cY[c[(c[bo>>2]|0)+36>>2]&255](bo)|0)==-1){c[e>>2]=0;aa=3007;break}else{if(ar){bq=bo;break}else{aa=3016;break L3359}}}}while(0);if((aa|0)==3007){aa=0;if(ar){aa=3016;break L3359}else{bq=0}}aq=c[g>>2]|0;aA=c[aq+12>>2]|0;if((aA|0)==(c[aq+16>>2]|0)){br=(cY[c[(c[aq>>2]|0)+36>>2]&255](aq)|0)&255}else{br=a[aA]|0}aA=br<<24>>24;if((b4(aA|0)|0)==0){aa=3016;break L3359}if((b[(c[f>>2]|0)+(aA<<1)>>1]&2048)==0){aa=3016;break L3359}aA=c[o>>2]|0;if((aA|0)==(bn|0)){aq=(c[V>>2]|0)!=230;$=c[h>>2]|0;as=bn-$|0;ah=as>>>0<2147483647>>>0?as<<1:-1;ag=n1(aq?$:0,ah)|0;if((ag|0)==0){ob()}do{if(aq){c[h>>2]=ag;bs=ag}else{$=c[h>>2]|0;c[h>>2]=ag;if(($|0)==0){bs=ag;break}cT[c[V>>2]&511]($);bs=c[h>>2]|0}}while(0);c[V>>2]=116;ag=bs+as|0;c[o>>2]=ag;bt=(c[h>>2]|0)+ah|0;bu=ag}else{bt=bn;bu=aA}ag=c[g>>2]|0;aq=c[ag+12>>2]|0;if((aq|0)==(c[ag+16>>2]|0)){ar=(cY[c[(c[ag>>2]|0)+36>>2]&255](ag)|0)&255;bv=ar;bw=c[o>>2]|0}else{bv=a[aq]|0;bw=bu}c[o>>2]=bw+1;a[bw]=bv;aq=(c[B>>2]|0)-1|0;c[B>>2]=aq;ar=c[g>>2]|0;ag=ar+12|0;$=c[ag>>2]|0;if(($|0)==(c[ar+16>>2]|0)){aU=c[(c[ar>>2]|0)+40>>2]|0;cY[aU&255](ar)|0}else{c[ag>>2]=$+1}if((aq|0)>0){bn=bt;bo=bq}else{bx=bt;break}}}else{bx=aj}if((c[o>>2]|0)==(c[h>>2]|0)){aa=3036;break L3359}else{ak=r;al=bb;am=bc;an=bd;ao=be;ap=bx}break};default:{ak=r;al=D;am=X;an=W;ao=p;ap=n}}}while(0);L3664:do{if((aa|0)==2807){aa=0;if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=3038;break L3359}else{by=ab}while(1){Z=c[g>>2]|0;do{if((Z|0)==0){bz=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){bz=Z;break}if((cY[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[g>>2]=0;bz=0;break}else{bz=c[g>>2]|0;break}}}while(0);Z=(bz|0)==0;do{if((by|0)==0){aa=2820}else{if((c[by+12>>2]|0)!=(c[by+16>>2]|0)){if(Z){bA=by;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3664}}if((cY[c[(c[by>>2]|0)+36>>2]&255](by)|0)==-1){c[e>>2]=0;aa=2820;break}else{if(Z){bA=by;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3664}}}}while(0);if((aa|0)==2820){aa=0;if(Z){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3664}else{bA=0}}aA=c[g>>2]|0;ah=c[aA+12>>2]|0;if((ah|0)==(c[aA+16>>2]|0)){bB=(cY[c[(c[aA>>2]|0)+36>>2]&255](aA)|0)&255}else{bB=a[ah]|0}ah=bB<<24>>24;if((b4(ah|0)|0)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3664}if((b[(c[f>>2]|0)+(ah<<1)>>1]&8192)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L3664}ah=c[g>>2]|0;aA=ah+12|0;as=c[aA>>2]|0;if((as|0)==(c[ah+16>>2]|0)){bC=(cY[c[(c[ah>>2]|0)+40>>2]&255](ah)|0)&255}else{c[aA>>2]=as+1;bC=a[as]|0}gZ(A,bC);by=bA}}}while(0);aj=Y+1|0;if(aj>>>0<4>>>0){n=ap;p=ao;W=an;X=am;D=al;r=ak;Y=aj}else{ac=ao;ad=an;ae=am;af=ak;aa=3038;break}}L3702:do{if((aa|0)==2806){c[k>>2]=c[k>>2]|4;bD=0;bE=W;bF=p}else if((aa|0)==2874){c[k>>2]=c[k>>2]|4;bD=0;bE=W;bF=p}else if((aa|0)==2918){c[k>>2]=c[k>>2]|4;bD=0;bE=W;bF=p}else if((aa|0)==2991){c[k>>2]=c[k>>2]|4;bD=0;bE=bd;bF=be}else if((aa|0)==3016){c[k>>2]=c[k>>2]|4;bD=0;bE=bd;bF=be}else if((aa|0)==3036){c[k>>2]=c[k>>2]|4;bD=0;bE=bd;bF=be}else if((aa|0)==3038){L3710:do{if((af|0)!=0){ak=af;am=af+1|0;an=af+8|0;ao=af+4|0;Y=1;L3712:while(1){r=d[ak]|0;if((r&1|0)==0){bG=r>>>1}else{bG=c[ao>>2]|0}if(Y>>>0>=bG>>>0){break L3710}r=c[g>>2]|0;do{if((r|0)==0){bH=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){bH=r;break}if((cY[c[(c[r>>2]|0)+36>>2]&255](r)|0)==-1){c[g>>2]=0;bH=0;break}else{bH=c[g>>2]|0;break}}}while(0);r=(bH|0)==0;Z=c[e>>2]|0;do{if((Z|0)==0){aa=3056}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){if(r){break}else{break L3712}}if((cY[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)==-1){c[e>>2]=0;aa=3056;break}else{if(r){break}else{break L3712}}}}while(0);if((aa|0)==3056){aa=0;if(r){break}}Z=c[g>>2]|0;al=c[Z+12>>2]|0;if((al|0)==(c[Z+16>>2]|0)){bI=(cY[c[(c[Z>>2]|0)+36>>2]&255](Z)|0)&255}else{bI=a[al]|0}if((a[ak]&1)==0){bJ=am}else{bJ=c[an>>2]|0}if(bI<<24>>24!=(a[bJ+Y|0]|0)){break}al=Y+1|0;Z=c[g>>2]|0;D=Z+12|0;X=c[D>>2]|0;if((X|0)==(c[Z+16>>2]|0)){ap=c[(c[Z>>2]|0)+40>>2]|0;cY[ap&255](Z)|0;Y=al;continue}else{c[D>>2]=X+1;Y=al;continue}}c[k>>2]=c[k>>2]|4;bD=0;bE=ad;bF=ac;break L3702}}while(0);if((ad|0)==(ae|0)){bD=1;bE=ae;bF=ac;break}c[C>>2]=0;k0(v,ad,ae,C);if((c[C>>2]|0)==0){bD=1;bE=ad;bF=ac;break}c[k>>2]=c[k>>2]|4;bD=0;bE=ad;bF=ac}}while(0);gU(A);gU(z);gU(y);gU(x);gU(v);if((bE|0)==0){i=q;return bD|0}cT[bF&511](bE);i=q;return bD|0}function kY(a){a=a|0;var b=0;b=cx(8)|0;gy(b,a);bL(b|0,12744,34)}function kZ(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+160|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=230;u=m+100|0;hd(p,h);m=p|0;v=c[m>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(kX(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){a[k+1|0]=0;a[B]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){gZ(k,cV[c[(c[B>>2]|0)+28>>2]&63](y,45)|0)}x=cV[c[(c[B>>2]|0)+28>>2]&63](y,48)|0;y=c[o>>2]|0;B=y-1|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((a[C]|0)==x<<24>>24){C=C+1|0}else{break}}k_(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){D=B;break}if((cY[c[(c[B>>2]|0)+36>>2]&255](B)|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){E=3114}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){break}else{E=3116;break}}if((cY[c[(c[A>>2]|0)+36>>2]&255](A)|0)==-1){c[z>>2]=0;E=3114;break}else{if(x^(A|0)==0){break}else{E=3116;break}}}}while(0);if((E|0)==3114){if(x){E=3116}}if((E|0)==3116){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;gs(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}cT[c[t>>2]&511](A);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function k_(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=10;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){return b|0}if((k-j|0)>>>0<h>>>0){g0(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(j-g)|0;g=d;d=n+j|0;while(1){a[d]=a[g]|0;l=g+1|0;if((l|0)==(e|0)){break}else{g=l;d=d+1|0}}a[n+m|0]=0;m=j+h|0;if((a[f]&1)==0){a[f]=m<<1&255;return b|0}else{c[b+4>>2]=m;return b|0}return 0}function k$(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;C=i;i=i+12|0;i=i+7&-8;D=C;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[5416]|0)!=-1){c[p>>2]=21664;c[p+4>>2]=20;c[p+8>>2]=0;gP(21664,p,142)}p=(c[5417]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=cx(4)|0;L=K;nC(L);bL(K|0,12712,196)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=cx(4)|0;L=K;nC(L);bL(K|0,12712,196)}K=b;cU[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;E=c[q>>2]|0;a[L]=E&255;E=E>>8;a[L+1|0]=E&255;E=E>>8;a[L+2|0]=E&255;E=E>>8;a[L+3|0]=E&255;L=b;cU[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){a[l+1|0]=0;a[q]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];of(s|0,0,12);gU(r);cU[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){a[k+1|0]=0;a[r]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gY(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];of(u|0,0,12);gU(t);t=b;a[f]=cY[c[(c[t>>2]|0)+12>>2]&255](K)|0;a[g]=cY[c[(c[t>>2]|0)+16>>2]&255](K)|0;cU[c[(c[L>>2]|0)+20>>2]&127](v,K);t=h;if((a[t]&1)==0){a[h+1|0]=0;a[t]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gY(h,0);c[t>>2]=c[w>>2];c[t+4>>2]=c[w+4>>2];c[t+8>>2]=c[w+8>>2];of(w|0,0,12);gU(v);cU[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];of(y|0,0,12);gU(x);M=cY[c[(c[b>>2]|0)+36>>2]&255](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[5418]|0)!=-1){c[o>>2]=21672;c[o+4>>2]=20;c[o+8>>2]=0;gP(21672,o,142)}o=(c[5419]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=cx(4)|0;O=N;nC(O);bL(N|0,12712,196)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=cx(4)|0;O=N;nC(O);bL(N|0,12712,196)}N=K;cU[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;E=c[z>>2]|0;a[O]=E&255;E=E>>8;a[O+1|0]=E&255;E=E>>8;a[O+2|0]=E&255;E=E>>8;a[O+3|0]=E&255;O=K;cU[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){a[l+1|0]=0;a[z]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];of(B|0,0,12);gU(A);cU[c[(c[O>>2]|0)+28>>2]&127](C,N);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gY(k,0);c[A>>2]=c[D>>2];c[A+4>>2]=c[D+4>>2];c[A+8>>2]=c[D+8>>2];of(D|0,0,12);gU(C);C=K;a[f]=cY[c[(c[C>>2]|0)+12>>2]&255](N)|0;a[g]=cY[c[(c[C>>2]|0)+16>>2]&255](N)|0;cU[c[(c[O>>2]|0)+20>>2]&127](F,N);C=h;if((a[C]&1)==0){a[h+1|0]=0;a[C]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gY(h,0);c[C>>2]=c[G>>2];c[C+4>>2]=c[G+4>>2];c[C+8>>2]=c[G+8>>2];of(G|0,0,12);gU(F);cU[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){a[j+1|0]=0;a[O]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];of(I|0,0,12);gU(H);M=cY[c[(c[K>>2]|0)+36>>2]&255](N)|0;c[m>>2]=M;i=n;return}}function k0(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}do{k=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=k;m=m+4|0;n=n-4|0;}while(m>>>0<n>>>0);l=a[h]|0}}while(0);if((l&1)==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L3925:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}k=(e-h|0)>1?h+1|0:h;j=n+4|0;q=a[k]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(j>>>0<b>>>0){h=k;n=j;m=r;i=s}else{t=r;u=s;break L3925}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function k1(a){a=a|0;gq(a|0);n6(a);return}function k2(a){a=a|0;gq(a|0);return}function k3(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+600|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=d+456|0;t=d+496|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=230;w=m+400|0;hd(p,h);m=p|0;x=c[m>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(k4(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+48>>2]|0;c4[D&15](A,4872,4882,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>392){H=n$((G>>2)+2|0)|0;if((H|0)!=0){I=H;J=H;break}ob();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+40|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((c[N>>2]|0)==(c[M>>2]|0)){O=N;break}else{N=N+4|0}}a[L]=a[4872+(O-H>>2)|0]|0;N=M+4|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=ci(D|0,4144,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}n0(J);break}M=cx(8)|0;gy(M,4096);bL(M|0,12744,34)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){S=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{S=c[M>>2]|0}if((S|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){T=3283}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){U=cY[c[(c[z>>2]|0)+36>>2]&255](z)|0}else{U=c[M>>2]|0}if((U|0)==-1){c[B>>2]=0;T=3283;break}else{if(A^(z|0)==0){break}else{T=3285;break}}}}while(0);if((T|0)==3283){if(A){T=3285}}if((T|0)==3285){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;gs(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}cT[c[v>>2]&511](z);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function k4(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0;p=i;i=i+448|0;q=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[q>>2];q=p|0;r=p+8|0;s=p+408|0;t=p+416|0;u=p+424|0;v=p+432|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;c[q>>2]=o;o=r|0;of(w|0,0,12);D=x;E=y;F=z;G=A;of(D|0,0,12);of(E|0,0,12);of(F|0,0,12);of(G|0,0,12);k7(f,g,s,t,u,v,x,y,z,B);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=e|0;e=l;H=z+4|0;I=z+8|0;J=y+4|0;K=y+8|0;L=(h&512|0)!=0;h=x+4|0;M=x+8|0;N=A+4|0;O=A+8|0;P=s+3|0;Q=v+4|0;R=230;S=o;T=o;o=r+400|0;r=0;U=0;L4009:while(1){V=c[f>>2]|0;do{if((V|0)==0){W=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){Y=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{Y=c[X>>2]|0}if((Y|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=3311}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){_=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{_=c[X>>2]|0}if((_|0)==-1){c[b>>2]=0;Z=3311;break}else{if(W^(V|0)==0){$=V;break}else{aa=R;ab=S;ac=T;ad=r;Z=3551;break L4009}}}}while(0);if((Z|0)==3311){Z=0;if(W){aa=R;ab=S;ac=T;ad=r;Z=3551;break}else{$=0}}L4033:do{switch(a[s+U|0]|0){case 1:{if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=3551;break L4009}V=c[f>>2]|0;X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){ae=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{ae=c[X>>2]|0}if(!(cW[c[(c[e>>2]|0)+12>>2]&63](l,8192,ae)|0)){Z=3335;break L4009}X=c[f>>2]|0;V=X+12|0;af=c[V>>2]|0;if((af|0)==(c[X+16>>2]|0)){ag=cY[c[(c[X>>2]|0)+40>>2]&255](X)|0}else{c[V>>2]=af+4;ag=c[af>>2]|0}g7(A,ag);Z=3336;break};case 0:{Z=3336;break};case 3:{af=a[E]|0;V=af&255;X=(V&1|0)==0;ah=a[F]|0;ai=ah&255;aj=(ai&1|0)==0;if(((X?V>>>1:c[J>>2]|0)|0)==(-(aj?ai>>>1:c[H>>2]|0)|0)){ak=r;al=o;am=T;an=S;ao=R;break L4033}do{if(((X?V>>>1:c[J>>2]|0)|0)!=0){if(((aj?ai>>>1:c[H>>2]|0)|0)==0){break}ap=c[f>>2]|0;aq=c[ap+12>>2]|0;if((aq|0)==(c[ap+16>>2]|0)){ar=cY[c[(c[ap>>2]|0)+36>>2]&255](ap)|0;as=ar;at=a[E]|0}else{as=c[aq>>2]|0;at=af}aq=c[f>>2]|0;ar=aq+12|0;ap=c[ar>>2]|0;au=(ap|0)==(c[aq+16>>2]|0);if((as|0)==(c[((at&1)==0?J:c[K>>2]|0)>>2]|0)){if(au){av=c[(c[aq>>2]|0)+40>>2]|0;cY[av&255](aq)|0}else{c[ar>>2]=ap+4}ar=d[E]|0;ak=((ar&1|0)==0?ar>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;al=o;am=T;an=S;ao=R;break L4033}if(au){aw=cY[c[(c[aq>>2]|0)+36>>2]&255](aq)|0}else{aw=c[ap>>2]|0}if((aw|0)!=(c[((a[F]&1)==0?H:c[I>>2]|0)>>2]|0)){Z=3401;break L4009}ap=c[f>>2]|0;aq=ap+12|0;au=c[aq>>2]|0;if((au|0)==(c[ap+16>>2]|0)){ar=c[(c[ap>>2]|0)+40>>2]|0;cY[ar&255](ap)|0}else{c[aq>>2]=au+4}a[k]=1;au=d[F]|0;ak=((au&1|0)==0?au>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;al=o;am=T;an=S;ao=R;break L4033}}while(0);ai=c[f>>2]|0;aj=c[ai+12>>2]|0;au=(aj|0)==(c[ai+16>>2]|0);if(((X?V>>>1:c[J>>2]|0)|0)==0){if(au){aq=cY[c[(c[ai>>2]|0)+36>>2]&255](ai)|0;ax=aq;ay=a[F]|0}else{ax=c[aj>>2]|0;ay=ah}if((ax|0)!=(c[((ay&1)==0?H:c[I>>2]|0)>>2]|0)){ak=r;al=o;am=T;an=S;ao=R;break L4033}aq=c[f>>2]|0;ap=aq+12|0;ar=c[ap>>2]|0;if((ar|0)==(c[aq+16>>2]|0)){av=c[(c[aq>>2]|0)+40>>2]|0;cY[av&255](aq)|0}else{c[ap>>2]=ar+4}a[k]=1;ar=d[F]|0;ak=((ar&1|0)==0?ar>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;al=o;am=T;an=S;ao=R;break L4033}if(au){au=cY[c[(c[ai>>2]|0)+36>>2]&255](ai)|0;az=au;aA=a[E]|0}else{az=c[aj>>2]|0;aA=af}if((az|0)!=(c[((aA&1)==0?J:c[K>>2]|0)>>2]|0)){a[k]=1;ak=r;al=o;am=T;an=S;ao=R;break L4033}aj=c[f>>2]|0;au=aj+12|0;ai=c[au>>2]|0;if((ai|0)==(c[aj+16>>2]|0)){ar=c[(c[aj>>2]|0)+40>>2]|0;cY[ar&255](aj)|0}else{c[au>>2]=ai+4}ai=d[E]|0;ak=((ai&1|0)==0?ai>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;al=o;am=T;an=S;ao=R;break};case 2:{if(!((r|0)!=0|U>>>0<2>>>0)){if((U|0)==2){aB=(a[P]|0)!=0}else{aB=0}if(!(L|aB)){ak=0;al=o;am=T;an=S;ao=R;break L4033}}ai=a[D]|0;au=(ai&1)==0?h:c[M>>2]|0;L4105:do{if((U|0)==0){aC=au;aD=ai;aE=$}else{if((d[s+(U-1)|0]|0)>>>0<2>>>0){aF=au;aG=ai}else{aC=au;aD=ai;aE=$;break}while(1){aj=aG&255;if((aF|0)==(((aG&1)==0?h:c[M>>2]|0)+(((aj&1|0)==0?aj>>>1:c[h>>2]|0)<<2)|0)){aH=aG;break}if(!(cW[c[(c[e>>2]|0)+12>>2]&63](l,8192,c[aF>>2]|0)|0)){Z=3412;break}aF=aF+4|0;aG=a[D]|0}if((Z|0)==3412){Z=0;aH=a[D]|0}aj=(aH&1)==0;ar=aF-(aj?h:c[M>>2]|0)>>2;ap=a[G]|0;aq=ap&255;av=(aq&1|0)==0;L4115:do{if(ar>>>0<=(av?aq>>>1:c[N>>2]|0)>>>0){aI=(ap&1)==0;aJ=(aI?N:c[O>>2]|0)+((av?aq>>>1:c[N>>2]|0)-ar<<2)|0;aK=(aI?N:c[O>>2]|0)+((av?aq>>>1:c[N>>2]|0)<<2)|0;if((aJ|0)==(aK|0)){aC=aF;aD=aH;aE=$;break L4105}else{aL=aJ;aM=aj?h:c[M>>2]|0}while(1){if((c[aL>>2]|0)!=(c[aM>>2]|0)){break L4115}aJ=aL+4|0;if((aJ|0)==(aK|0)){aC=aF;aD=aH;aE=$;break L4105}aL=aJ;aM=aM+4|0}}}while(0);aC=aj?h:c[M>>2]|0;aD=aH;aE=$}}while(0);L4122:while(1){ai=aD&255;if((aC|0)==(((aD&1)==0?h:c[M>>2]|0)+(((ai&1|0)==0?ai>>>1:c[h>>2]|0)<<2)|0)){break}ai=c[f>>2]|0;do{if((ai|0)==0){aN=1}else{au=c[ai+12>>2]|0;if((au|0)==(c[ai+16>>2]|0)){aO=cY[c[(c[ai>>2]|0)+36>>2]&255](ai)|0}else{aO=c[au>>2]|0}if((aO|0)==-1){c[f>>2]=0;aN=1;break}else{aN=(c[f>>2]|0)==0;break}}}while(0);do{if((aE|0)==0){Z=3433}else{ai=c[aE+12>>2]|0;if((ai|0)==(c[aE+16>>2]|0)){aP=cY[c[(c[aE>>2]|0)+36>>2]&255](aE)|0}else{aP=c[ai>>2]|0}if((aP|0)==-1){c[b>>2]=0;Z=3433;break}else{if(aN^(aE|0)==0){aQ=aE;break}else{break L4122}}}}while(0);if((Z|0)==3433){Z=0;if(aN){break}else{aQ=0}}ai=c[f>>2]|0;aj=c[ai+12>>2]|0;if((aj|0)==(c[ai+16>>2]|0)){aR=cY[c[(c[ai>>2]|0)+36>>2]&255](ai)|0}else{aR=c[aj>>2]|0}if((aR|0)!=(c[aC>>2]|0)){break}aj=c[f>>2]|0;ai=aj+12|0;au=c[ai>>2]|0;if((au|0)==(c[aj+16>>2]|0)){af=c[(c[aj>>2]|0)+40>>2]|0;cY[af&255](aj)|0}else{c[ai>>2]=au+4}aC=aC+4|0;aD=a[D]|0;aE=aQ}if(!L){ak=r;al=o;am=T;an=S;ao=R;break L4033}au=a[D]|0;ai=au&255;if((aC|0)==(((au&1)==0?h:c[M>>2]|0)+(((ai&1|0)==0?ai>>>1:c[h>>2]|0)<<2)|0)){ak=r;al=o;am=T;an=S;ao=R}else{Z=3445;break L4009}break};case 4:{ai=0;au=o;aj=T;af=S;ah=R;L4158:while(1){V=c[f>>2]|0;do{if((V|0)==0){aS=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aT=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aT=c[X>>2]|0}if((aT|0)==-1){c[f>>2]=0;aS=1;break}else{aS=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=3459}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aU=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aU=c[X>>2]|0}if((aU|0)==-1){c[b>>2]=0;Z=3459;break}else{if(aS^(V|0)==0){break}else{break L4158}}}}while(0);if((Z|0)==3459){Z=0;if(aS){break}}V=c[f>>2]|0;X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aV=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{aV=c[X>>2]|0}if(cW[c[(c[e>>2]|0)+12>>2]&63](l,2048,aV)|0){X=c[n>>2]|0;if((X|0)==(c[q>>2]|0)){k8(m,n,q);aW=c[n>>2]|0}else{aW=X}c[n>>2]=aW+4;c[aW>>2]=aV;aX=ai+1|0;aY=au;aZ=aj;a_=af;a$=ah}else{X=d[w]|0;if((((X&1|0)==0?X>>>1:c[Q>>2]|0)|0)==0|(ai|0)==0){break}if((aV|0)!=(c[u>>2]|0)){break}if((aj|0)==(au|0)){X=(ah|0)!=230;V=aj-af|0;aq=V>>>0<2147483647>>>0?V<<1:-1;if(X){a0=af}else{a0=0}X=n1(a0,aq)|0;av=X;if((X|0)==0){ob()}a1=av+(aq>>>2<<2)|0;a2=av+(V>>2<<2)|0;a3=av;a4=116}else{a1=au;a2=aj;a3=af;a4=ah}c[a2>>2]=ai;aX=0;aY=a1;aZ=a2+4|0;a_=a3;a$=a4}av=c[f>>2]|0;V=av+12|0;aq=c[V>>2]|0;if((aq|0)==(c[av+16>>2]|0)){X=c[(c[av>>2]|0)+40>>2]|0;cY[X&255](av)|0;ai=aX;au=aY;aj=aZ;af=a_;ah=a$;continue}else{c[V>>2]=aq+4;ai=aX;au=aY;aj=aZ;af=a_;ah=a$;continue}}if((af|0)==(aj|0)|(ai|0)==0){a5=au;a6=aj;a7=af;a8=ah}else{if((aj|0)==(au|0)){aq=(ah|0)!=230;V=aj-af|0;av=V>>>0<2147483647>>>0?V<<1:-1;if(aq){a9=af}else{a9=0}aq=n1(a9,av)|0;X=aq;if((aq|0)==0){ob()}ba=X+(av>>>2<<2)|0;bb=X+(V>>2<<2)|0;bc=X;bd=116}else{ba=au;bb=aj;bc=af;bd=ah}c[bb>>2]=ai;a5=ba;a6=bb+4|0;a7=bc;a8=bd}X=c[B>>2]|0;if((X|0)>0){V=c[f>>2]|0;do{if((V|0)==0){be=1}else{av=c[V+12>>2]|0;if((av|0)==(c[V+16>>2]|0)){bf=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bf=c[av>>2]|0}if((bf|0)==-1){c[f>>2]=0;be=1;break}else{be=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=3508}else{ai=c[V+12>>2]|0;if((ai|0)==(c[V+16>>2]|0)){bg=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bg=c[ai>>2]|0}if((bg|0)==-1){c[b>>2]=0;Z=3508;break}else{if(be^(V|0)==0){bh=V;break}else{Z=3514;break L4009}}}}while(0);if((Z|0)==3508){Z=0;if(be){Z=3514;break L4009}else{bh=0}}V=c[f>>2]|0;ai=c[V+12>>2]|0;if((ai|0)==(c[V+16>>2]|0)){bi=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bi=c[ai>>2]|0}if((bi|0)!=(c[t>>2]|0)){Z=3514;break L4009}ai=c[f>>2]|0;V=ai+12|0;ah=c[V>>2]|0;if((ah|0)==(c[ai+16>>2]|0)){af=c[(c[ai>>2]|0)+40>>2]|0;cY[af&255](ai)|0;bj=bh;bk=X}else{c[V>>2]=ah+4;bj=bh;bk=X}while(1){ah=c[f>>2]|0;do{if((ah|0)==0){bl=1}else{V=c[ah+12>>2]|0;if((V|0)==(c[ah+16>>2]|0)){bm=cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0}else{bm=c[V>>2]|0}if((bm|0)==-1){c[f>>2]=0;bl=1;break}else{bl=(c[f>>2]|0)==0;break}}}while(0);do{if((bj|0)==0){Z=3531}else{ah=c[bj+12>>2]|0;if((ah|0)==(c[bj+16>>2]|0)){bn=cY[c[(c[bj>>2]|0)+36>>2]&255](bj)|0}else{bn=c[ah>>2]|0}if((bn|0)==-1){c[b>>2]=0;Z=3531;break}else{if(bl^(bj|0)==0){bo=bj;break}else{Z=3538;break L4009}}}}while(0);if((Z|0)==3531){Z=0;if(bl){Z=3538;break L4009}else{bo=0}}ah=c[f>>2]|0;V=c[ah+12>>2]|0;if((V|0)==(c[ah+16>>2]|0)){bp=cY[c[(c[ah>>2]|0)+36>>2]&255](ah)|0}else{bp=c[V>>2]|0}if(!(cW[c[(c[e>>2]|0)+12>>2]&63](l,2048,bp)|0)){Z=3538;break L4009}if((c[n>>2]|0)==(c[q>>2]|0)){k8(m,n,q)}V=c[f>>2]|0;ah=c[V+12>>2]|0;if((ah|0)==(c[V+16>>2]|0)){bq=cY[c[(c[V>>2]|0)+36>>2]&255](V)|0}else{bq=c[ah>>2]|0}ah=c[n>>2]|0;c[n>>2]=ah+4;c[ah>>2]=bq;ah=bk-1|0;c[B>>2]=ah;V=c[f>>2]|0;ai=V+12|0;af=c[ai>>2]|0;if((af|0)==(c[V+16>>2]|0)){aj=c[(c[V>>2]|0)+40>>2]|0;cY[aj&255](V)|0}else{c[ai>>2]=af+4}if((ah|0)>0){bj=bo;bk=ah}else{break}}}if((c[n>>2]|0)==(c[g>>2]|0)){Z=3549;break L4009}else{ak=r;al=a5;am=a6;an=a7;ao=a8}break};default:{ak=r;al=o;am=T;an=S;ao=R}}}while(0);L4302:do{if((Z|0)==3336){Z=0;if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=3551;break L4009}else{br=$}while(1){X=c[f>>2]|0;do{if((X|0)==0){bs=1}else{ah=c[X+12>>2]|0;if((ah|0)==(c[X+16>>2]|0)){bt=cY[c[(c[X>>2]|0)+36>>2]&255](X)|0}else{bt=c[ah>>2]|0}if((bt|0)==-1){c[f>>2]=0;bs=1;break}else{bs=(c[f>>2]|0)==0;break}}}while(0);do{if((br|0)==0){Z=3350}else{X=c[br+12>>2]|0;if((X|0)==(c[br+16>>2]|0)){bu=cY[c[(c[br>>2]|0)+36>>2]&255](br)|0}else{bu=c[X>>2]|0}if((bu|0)==-1){c[b>>2]=0;Z=3350;break}else{if(bs^(br|0)==0){bv=br;break}else{ak=r;al=o;am=T;an=S;ao=R;break L4302}}}}while(0);if((Z|0)==3350){Z=0;if(bs){ak=r;al=o;am=T;an=S;ao=R;break L4302}else{bv=0}}X=c[f>>2]|0;ah=c[X+12>>2]|0;if((ah|0)==(c[X+16>>2]|0)){bw=cY[c[(c[X>>2]|0)+36>>2]&255](X)|0}else{bw=c[ah>>2]|0}if(!(cW[c[(c[e>>2]|0)+12>>2]&63](l,8192,bw)|0)){ak=r;al=o;am=T;an=S;ao=R;break L4302}ah=c[f>>2]|0;X=ah+12|0;af=c[X>>2]|0;if((af|0)==(c[ah+16>>2]|0)){bx=cY[c[(c[ah>>2]|0)+40>>2]&255](ah)|0}else{c[X>>2]=af+4;bx=c[af>>2]|0}g7(A,bx);br=bv}}}while(0);af=U+1|0;if(af>>>0<4>>>0){R=ao;S=an;T=am;o=al;r=ak;U=af}else{aa=ao;ab=an;ac=am;ad=ak;Z=3551;break}}L4339:do{if((Z|0)==3549){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==3551){L4342:do{if((ad|0)!=0){ak=ad;am=ad+4|0;an=ad+8|0;ao=1;L4344:while(1){U=d[ak]|0;if((U&1|0)==0){bB=U>>>1}else{bB=c[am>>2]|0}if(ao>>>0>=bB>>>0){break L4342}U=c[f>>2]|0;do{if((U|0)==0){bC=1}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bD=cY[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bD=c[r>>2]|0}if((bD|0)==-1){c[f>>2]=0;bC=1;break}else{bC=(c[f>>2]|0)==0;break}}}while(0);U=c[b>>2]|0;do{if((U|0)==0){Z=3570}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bE=cY[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bE=c[r>>2]|0}if((bE|0)==-1){c[b>>2]=0;Z=3570;break}else{if(bC^(U|0)==0){break}else{break L4344}}}}while(0);if((Z|0)==3570){Z=0;if(bC){break}}U=c[f>>2]|0;r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bF=cY[c[(c[U>>2]|0)+36>>2]&255](U)|0}else{bF=c[r>>2]|0}if((a[ak]&1)==0){bG=am}else{bG=c[an>>2]|0}if((bF|0)!=(c[bG+(ao<<2)>>2]|0)){break}r=ao+1|0;U=c[f>>2]|0;al=U+12|0;o=c[al>>2]|0;if((o|0)==(c[U+16>>2]|0)){T=c[(c[U>>2]|0)+40>>2]|0;cY[T&255](U)|0;ao=r;continue}else{c[al>>2]=o+4;ao=r;continue}}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa;break L4339}}while(0);if((ab|0)==(ac|0)){by=1;bz=ac;bA=aa;break}c[C>>2]=0;k0(v,ab,ac,C);if((c[C>>2]|0)==0){by=1;bz=ab;bA=aa;break}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa}else if((Z|0)==3538){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==3514){c[j>>2]=c[j>>2]|4;by=0;bz=a7;bA=a8}else if((Z|0)==3335){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==3401){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==3445){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}}while(0);g3(A);g3(z);g3(y);g3(x);gU(v);if((bz|0)==0){i=p;return by|0}cT[bA&511](bz);i=p;return by|0}function k5(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+456|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=230;u=m+400|0;hd(p,h);m=p|0;v=c[m>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(k4(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){c[k+4>>2]=0;a[B]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){g7(k,cV[c[(c[B>>2]|0)+44>>2]&63](y,45)|0)}x=cV[c[(c[B>>2]|0)+44>>2]&63](y,48)|0;y=c[o>>2]|0;B=y-4|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((c[C>>2]|0)==(x|0)){C=C+4|0}else{break}}k6(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{E=c[B+12>>2]|0;if((E|0)==(c[B+16>>2]|0)){F=cY[c[(c[B>>2]|0)+36>>2]&255](B)|0}else{F=c[E>>2]|0}if((F|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){G=3625}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){H=cY[c[(c[A>>2]|0)+36>>2]&255](A)|0}else{H=c[B>>2]|0}if((H|0)==-1){c[z>>2]=0;G=3625;break}else{if(x^(A|0)==0){break}else{G=3627;break}}}}while(0);if((G|0)==3625){if(x){G=3627}}if((G|0)==3627){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;gs(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}cT[c[t>>2]&511](A);i=d;return}}while(0);d=cx(4)|0;nC(d);bL(d|0,12712,196)}function k6(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=1;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g>>2;if((h|0)==0){return b|0}if((k-j|0)>>>0<h>>>0){g9(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(j<<2)|0;if((d|0)==(e|0)){o=m}else{l=j+((e-4+(-g|0)|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];m=g+4|0;if((m|0)==(e|0)){break}else{g=m;d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=j+h|0;if((a[f]&1)==0){a[f]=o<<1&255;return b|0}else{c[b+4>>2]=o;return b|0}return 0}function k7(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;C=i;i=i+12|0;i=i+7&-8;D=C;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[5412]|0)!=-1){c[p>>2]=21648;c[p+4>>2]=20;c[p+8>>2]=0;gP(21648,p,142)}p=(c[5413]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=cx(4)|0;L=K;nC(L);bL(K|0,12712,196)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=cx(4)|0;L=K;nC(L);bL(K|0,12712,196)}K=b;cU[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;E=c[q>>2]|0;a[L]=E&255;E=E>>8;a[L+1|0]=E&255;E=E>>8;a[L+2|0]=E&255;E=E>>8;a[L+3|0]=E&255;L=b;cU[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){c[l+4>>2]=0;a[q]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];of(s|0,0,12);g3(r);cU[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){c[k+4>>2]=0;a[r]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}g6(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];of(u|0,0,12);g3(t);t=b;c[f>>2]=cY[c[(c[t>>2]|0)+12>>2]&255](K)|0;c[g>>2]=cY[c[(c[t>>2]|0)+16>>2]&255](K)|0;cU[c[(c[b>>2]|0)+20>>2]&127](v,K);b=h;if((a[b]&1)==0){a[h+1|0]=0;a[b]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gY(h,0);c[b>>2]=c[w>>2];c[b+4>>2]=c[w+4>>2];c[b+8>>2]=c[w+8>>2];of(w|0,0,12);gU(v);cU[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){c[j+4>>2]=0;a[L]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}g6(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];of(y|0,0,12);g3(x);M=cY[c[(c[t>>2]|0)+36>>2]&255](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[5414]|0)!=-1){c[o>>2]=21656;c[o+4>>2]=20;c[o+8>>2]=0;gP(21656,o,142)}o=(c[5415]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=cx(4)|0;O=N;nC(O);bL(N|0,12712,196)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=cx(4)|0;O=N;nC(O);bL(N|0,12712,196)}N=K;cU[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;E=c[z>>2]|0;a[O]=E&255;E=E>>8;a[O+1|0]=E&255;E=E>>8;a[O+2|0]=E&255;E=E>>8;a[O+3|0]=E&255;O=K;cU[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){c[l+4>>2]=0;a[z]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];of(B|0,0,12);g3(A);cU[c[(c[O>>2]|0)+28>>2]&127](C,N);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}g6(k,0);c[A>>2]=c[D>>2];c[A+4>>2]=c[D+4>>2];c[A+8>>2]=c[D+8>>2];of(D|0,0,12);g3(C);C=K;c[f>>2]=cY[c[(c[C>>2]|0)+12>>2]&255](N)|0;c[g>>2]=cY[c[(c[C>>2]|0)+16>>2]&255](N)|0;cU[c[(c[K>>2]|0)+20>>2]&127](F,N);K=h;if((a[K]&1)==0){a[h+1|0]=0;a[K]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}gY(h,0);c[K>>2]=c[G>>2];c[K+4>>2]=c[G+4>>2];c[K+8>>2]=c[G+8>>2];of(G|0,0,12);gU(F);cU[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){c[j+4>>2]=0;a[O]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}g6(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];of(I|0,0,12);g3(H);M=cY[c[(c[C>>2]|0)+36>>2]&255](N)|0;c[m>>2]=M;i=n;return}}function k8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=230;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647>>>0?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=n1(k,j)|0;k=a;if((a|0)==0){ob()}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}cT[c[e>>2]&511](a);l=c[g>>2]|0}}while(0);c[e>>2]=116;c[b>>2]=l+(i<<2);c[d>>2]=(c[g>>2]|0)+(j>>>2<<2);return}function k9(a){a=a|0;gq(a|0);n6(a);return}function la(a){a=a|0;gq(a|0);return}function lb(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;e=i;i=i+280|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+232|0;p=e+240|0;q=e+248|0;r=e+256|0;s=e+264|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+100|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=a6(D|0,100,4088,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);G=jn(n,c[4272]|0,4088,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){ob();I=c[n>>2]|0}else{I=H}H=n$(G)|0;if((H|0)!=0){J=H;K=G;L=I;M=H;break}ob();J=0;K=G;L=I;M=0}else{J=E;K=F;L=0;M=0}}while(0);hd(o,j);F=o|0;E=c[F>>2]|0;if((c[5298]|0)!=-1){c[m>>2]=21192;c[m+4>>2]=20;c[m+8>>2]=0;gP(21192,m,142)}m=(c[5299]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}G=D;H=c[n>>2]|0;N=H+K|0;O=c[(c[D>>2]|0)+32>>2]|0;c4[O&15](G,H,N,J)|0;if((K|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}of(t|0,0,12);of(v|0,0,12);of(x|0,0,12);lc(g,P,o,p,q,r,s,u,w,y);N=z|0;H=c[y>>2]|0;if((K|0)>(H|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(K-H<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+H|0;do{if(O>>>0>100>>>0){D=n$(O)|0;if((D|0)!=0){V=D;W=D;break}ob();V=0;W=0}else{V=N;W=0}}while(0);ld(V,A,B,c[j+4>>2]|0,J,J+K|0,G,P,p,a[q]|0,a[r]|0,s,u,w,H);c[C>>2]=c[f>>2];du(b,C,V,c[A>>2]|0,c[B>>2]|0,j,k);if((W|0)!=0){n0(W)}gU(w);gU(u);gU(s);N=c[F>>2]|0;gs(N)|0;if((M|0)!=0){n0(M)}if((L|0)==0){i=e;return}n0(L);i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function lc(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;C=i;i=i+4|0;i=i+7&-8;D=C;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[5416]|0)!=-1){c[p>>2]=21664;c[p+4>>2]=20;c[p+8>>2]=0;gP(21664,p,142)}p=(c[5417]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=cx(4)|0;R=Q;nC(R);bL(Q|0,12712,196)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=cx(4)|0;R=Q;nC(R);bL(Q|0,12712,196)}Q=e;R=c[e>>2]|0;if(d){cU[c[R+44>>2]&127](r,Q);r=f;E=c[q>>2]|0;a[r]=E&255;E=E>>8;a[r+1|0]=E&255;E=E>>8;a[r+2|0]=E&255;E=E>>8;a[r+3|0]=E&255;cU[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){a[l+1|0]=0;a[r]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];of(t|0,0,12);gU(s)}else{cU[c[R+40>>2]&127](v,Q);v=f;E=c[u>>2]|0;a[v]=E&255;E=E>>8;a[v+1|0]=E&255;E=E>>8;a[v+2|0]=E&255;E=E>>8;a[v+3|0]=E&255;cU[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){a[l+1|0]=0;a[v]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];of(x|0,0,12);gU(w)}w=e;a[g]=cY[c[(c[w>>2]|0)+12>>2]&255](Q)|0;a[h]=cY[c[(c[w>>2]|0)+16>>2]&255](Q)|0;w=e;cU[c[(c[w>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];of(z|0,0,12);gU(y);cU[c[(c[w>>2]|0)+24>>2]&127](A,Q);w=k;if((a[w]&1)==0){a[k+1|0]=0;a[w]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gY(k,0);c[w>>2]=c[B>>2];c[w+4>>2]=c[B+4>>2];c[w+8>>2]=c[B+8>>2];of(B|0,0,12);gU(A);S=cY[c[(c[e>>2]|0)+36>>2]&255](Q)|0;c[m>>2]=S;i=n;return}else{if((c[5418]|0)!=-1){c[o>>2]=21672;c[o+4>>2]=20;c[o+8>>2]=0;gP(21672,o,142)}o=(c[5419]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=cx(4)|0;U=T;nC(U);bL(T|0,12712,196)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=cx(4)|0;U=T;nC(U);bL(T|0,12712,196)}T=P;U=c[P>>2]|0;if(d){cU[c[U+44>>2]&127](D,T);D=f;E=c[C>>2]|0;a[D]=E&255;E=E>>8;a[D+1|0]=E&255;E=E>>8;a[D+2|0]=E&255;E=E>>8;a[D+3|0]=E&255;cU[c[(c[P>>2]|0)+32>>2]&127](F,T);D=l;if((a[D]&1)==0){a[l+1|0]=0;a[D]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];of(G|0,0,12);gU(F)}else{cU[c[U+40>>2]&127](I,T);I=f;E=c[H>>2]|0;a[I]=E&255;E=E>>8;a[I+1|0]=E&255;E=E>>8;a[I+2|0]=E&255;E=E>>8;a[I+3|0]=E&255;cU[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){a[l+1|0]=0;a[I]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}gY(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];of(K|0,0,12);gU(J)}J=P;a[g]=cY[c[(c[J>>2]|0)+12>>2]&255](T)|0;a[h]=cY[c[(c[J>>2]|0)+16>>2]&255](T)|0;J=P;cU[c[(c[J>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];of(M|0,0,12);gU(L);cU[c[(c[J>>2]|0)+24>>2]&127](N,T);J=k;if((a[J]&1)==0){a[k+1|0]=0;a[J]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}gY(k,0);c[J>>2]=c[O>>2];c[J+4>>2]=c[O+4>>2];c[J+8>>2]=c[O+8>>2];of(O|0,0,12);gU(N);S=cY[c[(c[P>>2]|0)+36>>2]&255](T)|0;c[m>>2]=S;i=n;return}}function ld(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=h;h=0;while(1){L4699:do{switch(a[l+h|0]|0){case 2:{H=a[q]|0;I=H&255;J=(I&1|0)==0;if(J){K=I>>>1}else{K=c[z>>2]|0}if((K|0)==0|x){L=G;break L4699}if((H&1)==0){M=y;N=y}else{H=c[A>>2]|0;M=H;N=H}if(J){O=I>>>1}else{O=c[z>>2]|0}I=M+O|0;J=c[f>>2]|0;if((N|0)==(I|0)){P=J}else{H=N;Q=J;while(1){a[Q]=a[H]|0;J=H+1|0;R=Q+1|0;if((J|0)==(I|0)){P=R;break}else{H=J;Q=R}}}c[f>>2]=P;L=G;break};case 0:{c[e>>2]=c[f>>2];L=G;break};case 3:{Q=a[t]|0;H=Q&255;if((H&1|0)==0){S=H>>>1}else{S=c[w>>2]|0}if((S|0)==0){L=G;break L4699}if((Q&1)==0){T=u}else{T=c[v>>2]|0}Q=a[T]|0;H=c[f>>2]|0;c[f>>2]=H+1;a[H]=Q;L=G;break};case 1:{c[e>>2]=c[f>>2];Q=cV[c[(c[s>>2]|0)+28>>2]&63](j,32)|0;H=c[f>>2]|0;c[f>>2]=H+1;a[H]=Q;L=G;break};case 4:{Q=c[f>>2]|0;H=k?G+1|0:G;I=H;while(1){if(I>>>0>=i>>>0){break}R=a[I]|0;if(R<<24>>24<0){break}if((b[(c[p>>2]|0)+(R<<24>>24<<1)>>1]&2048)==0){break}else{I=I+1|0}}R=I;if(B){if(I>>>0>H>>>0){J=H+(-R|0)|0;R=J>>>0<o>>>0?o:J;J=R+r|0;U=I;V=r;W=Q;while(1){X=U-1|0;Y=a[X]|0;c[f>>2]=W+1;a[W]=Y;Y=V-1|0;Z=(Y|0)>0;if(!(X>>>0>H>>>0&Z)){break}U=X;V=Y;W=c[f>>2]|0}W=I+R|0;if(Z){_=J;$=W;aa=3898}else{ab=0;ac=J;ad=W}}else{_=r;$=I;aa=3898}if((aa|0)==3898){aa=0;ab=cV[c[(c[s>>2]|0)+28>>2]&63](j,48)|0;ac=_;ad=$}W=c[f>>2]|0;c[f>>2]=W+1;if((ac|0)>0){V=ac;U=W;while(1){a[U]=ab;Y=V-1|0;X=c[f>>2]|0;c[f>>2]=X+1;if((Y|0)>0){V=Y;U=X}else{ae=X;break}}}else{ae=W}a[ae]=m;af=ad}else{af=I}if((af|0)==(H|0)){U=cV[c[(c[s>>2]|0)+28>>2]&63](j,48)|0;V=c[f>>2]|0;c[f>>2]=V+1;a[V]=U}else{U=a[C]|0;V=U&255;if((V&1|0)==0){ag=V>>>1}else{ag=c[F>>2]|0}if((ag|0)==0){ah=af;ai=0;aj=0;ak=-1}else{if((U&1)==0){al=D}else{al=c[E>>2]|0}ah=af;ai=0;aj=0;ak=a[al]|0}while(1){do{if((ai|0)==(ak|0)){U=c[f>>2]|0;c[f>>2]=U+1;a[U]=n;U=aj+1|0;V=a[C]|0;J=V&255;if((J&1|0)==0){am=J>>>1}else{am=c[F>>2]|0}if(U>>>0>=am>>>0){an=ak;ao=U;ap=0;break}J=(V&1)==0;if(J){aq=D}else{aq=c[E>>2]|0}if((a[aq+U|0]|0)==127){an=-1;ao=U;ap=0;break}if(J){ar=D}else{ar=c[E>>2]|0}an=a[ar+U|0]|0;ao=U;ap=0}else{an=ak;ao=aj;ap=ai}}while(0);U=ah-1|0;J=a[U]|0;V=c[f>>2]|0;c[f>>2]=V+1;a[V]=J;if((U|0)==(H|0)){break}else{ah=U;ai=ap+1|0;aj=ao;ak=an}}}I=c[f>>2]|0;if((Q|0)==(I|0)){L=H;break L4699}W=I-1|0;if(Q>>>0<W>>>0){as=Q;at=W}else{L=H;break L4699}while(1){W=a[as]|0;a[as]=a[at]|0;a[at]=W;W=as+1|0;I=at-1|0;if(W>>>0<I>>>0){as=W;at=I}else{L=H;break}}break};default:{L=G}}}while(0);H=h+1|0;if(H>>>0<4>>>0){G=L;h=H}else{break}}h=a[t]|0;t=h&255;L=(t&1|0)==0;if(L){au=t>>>1}else{au=c[w>>2]|0}if(au>>>0>1>>>0){if((h&1)==0){av=u;aw=u}else{u=c[v>>2]|0;av=u;aw=u}if(L){ax=t>>>1}else{ax=c[w>>2]|0}w=av+ax|0;ax=c[f>>2]|0;av=aw+1|0;if((av|0)==(w|0)){ay=ax}else{aw=ax;ax=av;while(1){a[aw]=a[ax]|0;av=aw+1|0;t=ax+1|0;if((t|0)==(w|0)){ay=av;break}else{aw=av;ax=t}}}c[f>>2]=ay}ay=g&176;if((ay|0)==32){c[e>>2]=c[f>>2];return}else if((ay|0)==16){return}else{c[e>>2]=d;return}}function le(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+100|0;i=i+7&-8;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;hd(m,h);B=m|0;C=c[B>>2]|0;if((c[5298]|0)!=-1){c[l>>2]=21192;c[l+4>>2]=20;c[l+8>>2]=0;gP(21192,l,142)}l=(c[5299]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=k;I=a[H]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[k+4>>2]|0}if((K|0)==0){L=0}else{if((I&1)==0){M=G+1|0}else{M=c[k+8>>2]|0}I=a[M]|0;L=I<<24>>24==(cV[c[(c[E>>2]|0)+28>>2]&63](F,45)|0)<<24>>24}of(r|0,0,12);of(t|0,0,12);of(v|0,0,12);lc(g,L,m,n,o,p,q,s,u,w);E=x|0;I=a[H]|0;J=I&255;N=(J&1|0)==0;if(N){O=J>>>1}else{O=c[k+4>>2]|0}P=c[w>>2]|0;if((O|0)>(P|0)){if(N){Q=J>>>1}else{Q=c[k+4>>2]|0}J=d[v]|0;if((J&1|0)==0){R=J>>>1}else{R=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){S=J>>>1}else{S=c[s+4>>2]|0}T=(Q-P<<1|1)+R+S|0}else{J=d[v]|0;if((J&1|0)==0){U=J>>>1}else{U=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){V=J>>>1}else{V=c[s+4>>2]|0}T=U+2+V|0}J=T+P|0;do{if(J>>>0>100>>>0){N=n$(J)|0;if((N|0)!=0){W=N;X=N;Y=I;break}ob();W=0;X=0;Y=a[H]|0}else{W=E;X=0;Y=I}}while(0);if((Y&1)==0){Z=G+1|0;_=G+1|0}else{I=c[k+8>>2]|0;Z=I;_=I}I=Y&255;if((I&1|0)==0){$=I>>>1}else{$=c[k+4>>2]|0}ld(W,y,z,c[h+4>>2]|0,_,Z+$|0,F,L,n,a[o]|0,a[p]|0,q,s,u,P);c[A>>2]=c[f>>2];du(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){gU(u);gU(s);gU(q);aa=c[B>>2]|0;ab=aa|0;ac=gs(ab)|0;i=e;return}n0(X);gU(u);gU(s);gU(q);aa=c[B>>2]|0;ab=aa|0;ac=gs(ab)|0;i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function lf(a){a=a|0;gq(a|0);n6(a);return}function lg(a){a=a|0;gq(a|0);return}function lh(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+576|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+528|0;p=e+536|0;q=e+544|0;r=e+552|0;s=e+560|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+400|0;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=a6(D|0,100,4088,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);G=jn(n,c[4272]|0,4088,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){ob();I=c[n>>2]|0}else{I=H}H=n$(G<<2)|0;J=H;if((H|0)!=0){K=J;L=G;M=I;N=J;break}ob();K=J;L=G;M=I;N=J}else{K=E;L=F;M=0;N=0}}while(0);hd(o,j);F=o|0;E=c[F>>2]|0;if((c[5296]|0)!=-1){c[m>>2]=21184;c[m+4>>2]=20;c[m+8>>2]=0;gP(21184,m,142)}m=(c[5297]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}J=D;G=c[n>>2]|0;H=G+L|0;O=c[(c[D>>2]|0)+48>>2]|0;c4[O&15](J,G,H,K)|0;if((L|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}of(t|0,0,12);of(v|0,0,12);of(x|0,0,12);li(g,P,o,p,q,r,s,u,w,y);H=z|0;G=c[y>>2]|0;if((L|0)>(G|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(L-G<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+G|0;do{if(O>>>0>100>>>0){D=n$(O<<2)|0;V=D;if((D|0)!=0){W=V;X=V;break}ob();W=V;X=V}else{W=H;X=0}}while(0);lj(W,A,B,c[j+4>>2]|0,K,K+(L<<2)|0,J,P,p,c[q>>2]|0,c[r>>2]|0,s,u,w,G);c[C>>2]=c[f>>2];jw(b,C,W,c[A>>2]|0,c[B>>2]|0,j,k);if((X|0)!=0){n0(X)}g3(w);g3(u);gU(s);H=c[F>>2]|0;gs(H)|0;if((N|0)!=0){n0(N)}if((M|0)==0){i=e;return}n0(M);i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function li(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;C=i;i=i+4|0;i=i+7&-8;D=C;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[5412]|0)!=-1){c[p>>2]=21648;c[p+4>>2]=20;c[p+8>>2]=0;gP(21648,p,142)}p=(c[5413]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=cx(4)|0;R=Q;nC(R);bL(Q|0,12712,196)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=cx(4)|0;R=Q;nC(R);bL(Q|0,12712,196)}Q=e;R=c[e>>2]|0;if(d){cU[c[R+44>>2]&127](r,Q);r=f;E=c[q>>2]|0;a[r]=E&255;E=E>>8;a[r+1|0]=E&255;E=E>>8;a[r+2|0]=E&255;E=E>>8;a[r+3|0]=E&255;cU[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){c[l+4>>2]=0;a[r]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];of(t|0,0,12);g3(s)}else{cU[c[R+40>>2]&127](v,Q);v=f;E=c[u>>2]|0;a[v]=E&255;E=E>>8;a[v+1|0]=E&255;E=E>>8;a[v+2|0]=E&255;E=E>>8;a[v+3|0]=E&255;cU[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){c[l+4>>2]=0;a[v]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];of(x|0,0,12);g3(w)}w=e;c[g>>2]=cY[c[(c[w>>2]|0)+12>>2]&255](Q)|0;c[h>>2]=cY[c[(c[w>>2]|0)+16>>2]&255](Q)|0;cU[c[(c[e>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];of(z|0,0,12);gU(y);cU[c[(c[e>>2]|0)+24>>2]&127](A,Q);e=k;if((a[e]&1)==0){c[k+4>>2]=0;a[e]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}g6(k,0);c[e>>2]=c[B>>2];c[e+4>>2]=c[B+4>>2];c[e+8>>2]=c[B+8>>2];of(B|0,0,12);g3(A);S=cY[c[(c[w>>2]|0)+36>>2]&255](Q)|0;c[m>>2]=S;i=n;return}else{if((c[5414]|0)!=-1){c[o>>2]=21656;c[o+4>>2]=20;c[o+8>>2]=0;gP(21656,o,142)}o=(c[5415]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=cx(4)|0;U=T;nC(U);bL(T|0,12712,196)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=cx(4)|0;U=T;nC(U);bL(T|0,12712,196)}T=P;U=c[P>>2]|0;if(d){cU[c[U+44>>2]&127](D,T);D=f;E=c[C>>2]|0;a[D]=E&255;E=E>>8;a[D+1|0]=E&255;E=E>>8;a[D+2|0]=E&255;E=E>>8;a[D+3|0]=E&255;cU[c[(c[P>>2]|0)+32>>2]&127](F,T);D=l;if((a[D]&1)==0){c[l+4>>2]=0;a[D]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];of(G|0,0,12);g3(F)}else{cU[c[U+40>>2]&127](I,T);I=f;E=c[H>>2]|0;a[I]=E&255;E=E>>8;a[I+1|0]=E&255;E=E>>8;a[I+2|0]=E&255;E=E>>8;a[I+3|0]=E&255;cU[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){c[l+4>>2]=0;a[I]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}g6(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];of(K|0,0,12);g3(J)}J=P;c[g>>2]=cY[c[(c[J>>2]|0)+12>>2]&255](T)|0;c[h>>2]=cY[c[(c[J>>2]|0)+16>>2]&255](T)|0;cU[c[(c[P>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}gY(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];of(M|0,0,12);gU(L);cU[c[(c[P>>2]|0)+24>>2]&127](N,T);P=k;if((a[P]&1)==0){c[k+4>>2]=0;a[P]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}g6(k,0);c[P>>2]=c[O>>2];c[P+4>>2]=c[O+4>>2];c[P+8>>2]=c[O+8>>2];of(O|0,0,12);g3(N);S=cY[c[(c[J>>2]|0)+36>>2]&255](T)|0;c[m>>2]=S;i=n;return}}function lj(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){L5020:do{switch(a[k+g|0]|0){case 0:{c[d>>2]=c[e>>2];D=n;break};case 2:{E=a[p]|0;F=E&255;G=(F&1|0)==0;if(G){H=F>>>1}else{H=c[w>>2]|0}if((H|0)==0|v){D=n;break L5020}if((E&1)==0){I=w;J=w;K=w}else{E=c[x>>2]|0;I=E;J=E;K=E}if(G){L=F>>>1}else{L=c[w>>2]|0}F=I+(L<<2)|0;G=c[e>>2]|0;if((J|0)==(F|0)){M=G}else{E=(I+(L-1<<2)+(-K|0)|0)>>>2;N=J;O=G;while(1){c[O>>2]=c[N>>2];P=N+4|0;if((P|0)==(F|0)){break}N=P;O=O+4|0}M=G+(E+1<<2)|0}c[e>>2]=M;D=n;break};case 3:{O=a[s]|0;N=O&255;if((N&1|0)==0){Q=N>>>1}else{Q=c[t>>2]|0}if((Q|0)==0){D=n;break L5020}if((O&1)==0){R=t}else{R=c[u>>2]|0}O=c[R>>2]|0;N=c[e>>2]|0;c[e>>2]=N+4;c[N>>2]=O;D=n;break};case 1:{c[d>>2]=c[e>>2];O=cV[c[(c[r>>2]|0)+44>>2]&63](i,32)|0;N=c[e>>2]|0;c[e>>2]=N+4;c[N>>2]=O;D=n;break};case 4:{O=c[e>>2]|0;N=j?n+4|0:n;F=N;while(1){if(F>>>0>=h>>>0){break}if(cW[c[(c[o>>2]|0)+12>>2]&63](i,2048,c[F>>2]|0)|0){F=F+4|0}else{break}}if(y){if(F>>>0>N>>>0){E=F;G=q;do{E=E-4|0;P=c[E>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=P;G=G-1|0;T=(G|0)>0;}while(E>>>0>N>>>0&T);if(T){U=G;V=E;W=4174}else{X=0;Y=G;Z=E}}else{U=q;V=F;W=4174}if((W|0)==4174){W=0;X=cV[c[(c[r>>2]|0)+44>>2]&63](i,48)|0;Y=U;Z=V}P=c[e>>2]|0;c[e>>2]=P+4;if((Y|0)>0){S=Y;_=P;while(1){c[_>>2]=X;$=S-1|0;aa=c[e>>2]|0;c[e>>2]=aa+4;if(($|0)>0){S=$;_=aa}else{ab=aa;break}}}else{ab=P}c[ab>>2]=l;ac=Z}else{ac=F}if((ac|0)==(N|0)){_=cV[c[(c[r>>2]|0)+44>>2]&63](i,48)|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=_}else{_=a[z]|0;S=_&255;if((S&1|0)==0){ad=S>>>1}else{ad=c[C>>2]|0}if((ad|0)==0){ae=ac;af=0;ag=0;ah=-1}else{if((_&1)==0){ai=A}else{ai=c[B>>2]|0}ae=ac;af=0;ag=0;ah=a[ai]|0}while(1){do{if((af|0)==(ah|0)){_=c[e>>2]|0;c[e>>2]=_+4;c[_>>2]=m;_=ag+1|0;S=a[z]|0;E=S&255;if((E&1|0)==0){aj=E>>>1}else{aj=c[C>>2]|0}if(_>>>0>=aj>>>0){ak=ah;al=_;am=0;break}E=(S&1)==0;if(E){an=A}else{an=c[B>>2]|0}if((a[an+_|0]|0)==127){ak=-1;al=_;am=0;break}if(E){ao=A}else{ao=c[B>>2]|0}ak=a[ao+_|0]|0;al=_;am=0}else{ak=ah;al=ag;am=af}}while(0);_=ae-4|0;E=c[_>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=E;if((_|0)==(N|0)){break}else{ae=_;af=am+1|0;ag=al;ah=ak}}}F=c[e>>2]|0;if((O|0)==(F|0)){D=N;break L5020}P=F-4|0;if(O>>>0<P>>>0){ap=O;aq=P}else{D=N;break L5020}while(1){P=c[ap>>2]|0;c[ap>>2]=c[aq>>2];c[aq>>2]=P;P=ap+4|0;F=aq-4|0;if(P>>>0<F>>>0){ap=P;aq=F}else{D=N;break}}break};default:{D=n}}}while(0);N=g+1|0;if(N>>>0<4>>>0){n=D;g=N}else{break}}g=a[s]|0;s=g&255;D=(s&1|0)==0;if(D){ar=s>>>1}else{ar=c[t>>2]|0}if(ar>>>0>1>>>0){if((g&1)==0){as=t;at=t;au=t}else{g=c[u>>2]|0;as=g;at=g;au=g}if(D){av=s>>>1}else{av=c[t>>2]|0}t=as+(av<<2)|0;s=c[e>>2]|0;D=at+4|0;if((D|0)==(t|0)){aw=s}else{at=((as+(av-2<<2)+(-au|0)|0)>>>2)+1|0;au=s;av=D;while(1){c[au>>2]=c[av>>2];D=av+4|0;if((D|0)==(t|0)){break}else{au=au+4|0;av=D}}aw=s+(at<<2)|0}c[e>>2]=aw}aw=f&176;if((aw|0)==16){return}else if((aw|0)==32){c[d>>2]=c[e>>2];return}else{c[d>>2]=b;return}}function lk(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+400|0;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;hd(m,h);B=m|0;C=c[B>>2]|0;if((c[5296]|0)!=-1){c[l>>2]=21184;c[l+4>>2]=20;c[l+8>>2]=0;gP(21184,l,142)}l=(c[5297]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=a[G]|0;I=H&255;if((I&1|0)==0){J=I>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((H&1)==0){L=k+4|0}else{L=c[k+8>>2]|0}H=c[L>>2]|0;K=(H|0)==(cV[c[(c[E>>2]|0)+44>>2]&63](F,45)|0)}of(r|0,0,12);of(t|0,0,12);of(v|0,0,12);li(g,K,m,n,o,p,q,s,u,w);E=x|0;H=a[G]|0;I=H&255;M=(I&1|0)==0;if(M){N=I>>>1}else{N=c[k+4>>2]|0}O=c[w>>2]|0;if((N|0)>(O|0)){if(M){P=I>>>1}else{P=c[k+4>>2]|0}I=d[v]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){R=I>>>1}else{R=c[s+4>>2]|0}S=(P-O<<1|1)+Q+R|0}else{I=d[v]|0;if((I&1|0)==0){T=I>>>1}else{T=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){U=I>>>1}else{U=c[s+4>>2]|0}S=T+2+U|0}I=S+O|0;do{if(I>>>0>100>>>0){M=n$(I<<2)|0;V=M;if((M|0)!=0){W=V;X=V;Y=H;break}ob();W=V;X=V;Y=a[G]|0}else{W=E;X=0;Y=H}}while(0);if((Y&1)==0){Z=k+4|0;_=k+4|0}else{H=c[k+8>>2]|0;Z=H;_=H}H=Y&255;if((H&1|0)==0){$=H>>>1}else{$=c[k+4>>2]|0}lj(W,y,z,c[h+4>>2]|0,_,Z+($<<2)|0,F,K,n,c[o>>2]|0,c[p>>2]|0,q,s,u,O);c[A>>2]=c[f>>2];jw(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){g3(u);g3(s);gU(q);aa=c[B>>2]|0;ab=aa|0;ac=gs(ab)|0;i=e;return}n0(X);g3(u);g3(s);gU(q);aa=c[B>>2]|0;ab=aa|0;ac=gs(ab)|0;i=e;return}}while(0);e=cx(4)|0;nC(e);bL(e|0,12712,196)}function ll(a){a=a|0;gq(a|0);n6(a);return}function lm(a){a=a|0;gq(a|0);return}function ln(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=cD(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function lo(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+16|0;j=d|0;k=j;of(k|0,0,12);l=b;m=h;n=a[h]|0;if((n&1)==0){o=m+1|0;p=m+1|0}else{m=c[h+8>>2]|0;o=m;p=m}m=n&255;if((m&1|0)==0){q=m>>>1}else{q=c[h+4>>2]|0}h=o+q|0;do{if(p>>>0<h>>>0){q=p;do{gZ(j,a[q]|0);q=q+1|0;}while(q>>>0<h>>>0);q=(e|0)==-1?-1:e<<1;if((a[k]&1)==0){r=q;s=4306;break}t=c[j+8>>2]|0;u=q}else{r=(e|0)==-1?-1:e<<1;s=4306}}while(0);if((s|0)==4306){t=j+1|0;u=r}r=bt(u|0,f|0,g|0,t|0)|0;of(l|0,0,12);l=og(r|0)|0;t=r+l|0;if((l|0)>0){v=r}else{gU(j);i=d;return}do{gZ(b,a[v]|0);v=v+1|0;}while(v>>>0<t>>>0);gU(j);i=d;return}function lp(a,b){a=a|0;b=b|0;ca(((b|0)==-1?-1:b<<1)|0)|0;return}function lq(a){a=a|0;gq(a|0);n6(a);return}function lr(a){a=a|0;gq(a|0);return}function ls(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=cD(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function lt(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+224|0;j=d|0;k=d+8|0;l=d+40|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+192|0;q=d+200|0;r=d+208|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;of(s|0,0,12);v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=7024;x=a[h]|0;if((x&1)==0){y=h+4|0;z=h+4|0}else{A=c[h+8>>2]|0;y=A;z=A}A=x&255;if((A&1|0)==0){B=A>>>1}else{B=c[h+4>>2]|0}h=y+(B<<2)|0;L5253:do{if(z>>>0<h>>>0){B=t;y=k|0;A=k+32|0;x=z;C=7024;while(1){c[m>>2]=x;D=(c0[c[C+12>>2]&31](w,j,x,h,m,y,A,l)|0)==2;E=c[m>>2]|0;if(D|(E|0)==(x|0)){break}if(y>>>0<(c[l>>2]|0)>>>0){D=y;do{gZ(r,a[D]|0);D=D+1|0;}while(D>>>0<(c[l>>2]|0)>>>0);F=c[m>>2]|0}else{F=E}if(F>>>0>=h>>>0){break L5253}x=F;C=c[B>>2]|0}B=cx(8)|0;gy(B,2288);bL(B|0,12744,34)}}while(0);gq(t|0);if((a[s]&1)==0){G=r+1|0}else{G=c[r+8>>2]|0}s=bt(((e|0)==-1?-1:e<<1)|0,f|0,g|0,G|0)|0;of(v|0,0,12);v=u|0;c[u+4>>2]=0;c[u>>2]=6968;G=og(s|0)|0;g=s+G|0;if((G|0)<1){H=u|0;gq(H);gU(r);i=d;return}G=u;f=g;e=o|0;t=o+128|0;o=s;s=6968;while(1){c[q>>2]=o;F=(c0[c[s+16>>2]&31](v,n,o,(f-o|0)>32?o+32|0:g,q,e,t,p)|0)==2;h=c[q>>2]|0;if(F|(h|0)==(o|0)){break}if(e>>>0<(c[p>>2]|0)>>>0){F=e;do{g7(b,c[F>>2]|0);F=F+4|0;}while(F>>>0<(c[p>>2]|0)>>>0);I=c[q>>2]|0}else{I=h}if(I>>>0>=g>>>0){J=4373;break}o=I;s=c[G>>2]|0}if((J|0)==4373){H=u|0;gq(H);gU(r);i=d;return}d=cx(8)|0;gy(d,2288);bL(d|0,12744,34)}function lu(a,b){a=a|0;b=b|0;ca(((b|0)==-1?-1:b<<1)|0)|0;return}function lv(b){b=b|0;var d=0,e=0,f=0;c[b>>2]=6408;d=b+8|0;e=c[d>>2]|0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);if((e|0)==(c[4272]|0)){f=b|0;gq(f);return}br(c[d>>2]|0);f=b|0;gq(f);return}function lw(a){a=a|0;a=cx(8)|0;gt(a,4080);c[a>>2]=5344;bL(a|0,12776,50)}function lx(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+448|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=e+64|0;l=e+80|0;m=e+96|0;n=e+112|0;o=e+128|0;p=e+144|0;q=e+160|0;r=e+176|0;s=e+192|0;t=e+208|0;u=e+224|0;v=e+240|0;w=e+256|0;x=e+272|0;y=e+288|0;z=e+304|0;A=e+320|0;B=e+336|0;C=e+352|0;D=e+368|0;E=e+384|0;F=e+400|0;G=e+416|0;H=e+432|0;c[b+4>>2]=d-1;c[b>>2]=6664;d=b+8|0;I=b+12|0;a[b+136|0]=1;J=b+24|0;K=J;c[I>>2]=K;c[d>>2]=K;c[b+16>>2]=J+112;J=28;L=K;do{if((L|0)==0){M=0}else{c[L>>2]=0;M=c[I>>2]|0}L=M+4|0;c[I>>2]=L;J=J-1|0;}while((J|0)!=0);gS(b+144|0,4024,1);J=c[d>>2]|0;d=c[I>>2]|0;if((J|0)!=(d|0)){c[I>>2]=d+(~((d-4+(-J|0)|0)>>>2)<<2)}c[4305]=0;c[4304]=6368;if((c[5218]|0)!=-1){c[H>>2]=20872;c[H+4>>2]=20;c[H+8>>2]=0;gP(20872,H,142)}ly(b,17216,(c[5219]|0)-1|0);c[4303]=0;c[4302]=6328;if((c[5216]|0)!=-1){c[G>>2]=20864;c[G+4>>2]=20;c[G+8>>2]=0;gP(20864,G,142)}ly(b,17208,(c[5217]|0)-1|0);c[4355]=0;c[4354]=6776;c[4356]=0;a[17428]=0;c[4356]=c[(bq()|0)>>2];if((c[5298]|0)!=-1){c[F>>2]=21192;c[F+4>>2]=20;c[F+8>>2]=0;gP(21192,F,142)}ly(b,17416,(c[5299]|0)-1|0);c[4353]=0;c[4352]=6696;if((c[5296]|0)!=-1){c[E>>2]=21184;c[E+4>>2]=20;c[E+8>>2]=0;gP(21184,E,142)}ly(b,17408,(c[5297]|0)-1|0);c[4307]=0;c[4306]=6464;if((c[5222]|0)!=-1){c[D>>2]=20888;c[D+4>>2]=20;c[D+8>>2]=0;gP(20888,D,142)}ly(b,17224,(c[5223]|0)-1|0);c[1215]=0;c[1214]=6408;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);c[1216]=c[4272];if((c[5220]|0)!=-1){c[C>>2]=20880;c[C+4>>2]=20;c[C+8>>2]=0;gP(20880,C,142)}ly(b,4856,(c[5221]|0)-1|0);c[4309]=0;c[4308]=6520;if((c[5224]|0)!=-1){c[B>>2]=20896;c[B+4>>2]=20;c[B+8>>2]=0;gP(20896,B,142)}ly(b,17232,(c[5225]|0)-1|0);c[4311]=0;c[4310]=6576;if((c[5226]|0)!=-1){c[A>>2]=20904;c[A+4>>2]=20;c[A+8>>2]=0;gP(20904,A,142)}ly(b,17240,(c[5227]|0)-1|0);c[4285]=0;c[4284]=5872;a[17144]=46;a[17145]=44;of(17148,0,12);if((c[5202]|0)!=-1){c[z>>2]=20808;c[z+4>>2]=20;c[z+8>>2]=0;gP(20808,z,142)}ly(b,17136,(c[5203]|0)-1|0);c[1207]=0;c[1206]=5824;c[1208]=46;c[1209]=44;of(4840,0,12);if((c[5200]|0)!=-1){c[y>>2]=20800;c[y+4>>2]=20;c[y+8>>2]=0;gP(20800,y,142)}ly(b,4824,(c[5201]|0)-1|0);c[4301]=0;c[4300]=6256;if((c[5214]|0)!=-1){c[x>>2]=20856;c[x+4>>2]=20;c[x+8>>2]=0;gP(20856,x,142)}ly(b,17200,(c[5215]|0)-1|0);c[4299]=0;c[4298]=6184;if((c[5212]|0)!=-1){c[w>>2]=20848;c[w+4>>2]=20;c[w+8>>2]=0;gP(20848,w,142)}ly(b,17192,(c[5213]|0)-1|0);c[4297]=0;c[4296]=6120;if((c[5210]|0)!=-1){c[v>>2]=20840;c[v+4>>2]=20;c[v+8>>2]=0;gP(20840,v,142)}ly(b,17184,(c[5211]|0)-1|0);c[4295]=0;c[4294]=6056;if((c[5208]|0)!=-1){c[u>>2]=20832;c[u+4>>2]=20;c[u+8>>2]=0;gP(20832,u,142)}ly(b,17176,(c[5209]|0)-1|0);c[4365]=0;c[4364]=7856;if((c[5418]|0)!=-1){c[t>>2]=21672;c[t+4>>2]=20;c[t+8>>2]=0;gP(21672,t,142)}ly(b,17456,(c[5419]|0)-1|0);c[4363]=0;c[4362]=7792;if((c[5416]|0)!=-1){c[s>>2]=21664;c[s+4>>2]=20;c[s+8>>2]=0;gP(21664,s,142)}ly(b,17448,(c[5417]|0)-1|0);c[4361]=0;c[4360]=7728;if((c[5414]|0)!=-1){c[r>>2]=21656;c[r+4>>2]=20;c[r+8>>2]=0;gP(21656,r,142)}ly(b,17440,(c[5415]|0)-1|0);c[4359]=0;c[4358]=7664;if((c[5412]|0)!=-1){c[q>>2]=21648;c[q+4>>2]=20;c[q+8>>2]=0;gP(21648,q,142)}ly(b,17432,(c[5413]|0)-1|0);c[4283]=0;c[4282]=5528;if((c[5190]|0)!=-1){c[p>>2]=20760;c[p+4>>2]=20;c[p+8>>2]=0;gP(20760,p,142)}ly(b,17128,(c[5191]|0)-1|0);c[4281]=0;c[4280]=5488;if((c[5188]|0)!=-1){c[o>>2]=20752;c[o+4>>2]=20;c[o+8>>2]=0;gP(20752,o,142)}ly(b,17120,(c[5189]|0)-1|0);c[4279]=0;c[4278]=5448;if((c[5186]|0)!=-1){c[n>>2]=20744;c[n+4>>2]=20;c[n+8>>2]=0;gP(20744,n,142)}ly(b,17112,(c[5187]|0)-1|0);c[4277]=0;c[4276]=5408;if((c[5184]|0)!=-1){c[m>>2]=20736;c[m+4>>2]=20;c[m+8>>2]=0;gP(20736,m,142)}ly(b,17104,(c[5185]|0)-1|0);c[1203]=0;c[1202]=5728;c[1204]=5776;if((c[5198]|0)!=-1){c[l>>2]=20792;c[l+4>>2]=20;c[l+8>>2]=0;gP(20792,l,142)}ly(b,4808,(c[5199]|0)-1|0);c[1199]=0;c[1198]=5632;c[1200]=5680;if((c[5196]|0)!=-1){c[k>>2]=20784;c[k+4>>2]=20;c[k+8>>2]=0;gP(20784,k,142)}ly(b,4792,(c[5197]|0)-1|0);c[1195]=0;c[1194]=6632;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);c[1196]=c[4272];c[1194]=5600;if((c[5194]|0)!=-1){c[j>>2]=20776;c[j+4>>2]=20;c[j+8>>2]=0;gP(20776,j,142)}ly(b,4776,(c[5195]|0)-1|0);c[1191]=0;c[1190]=6632;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);c[1192]=c[4272];c[1190]=5568;if((c[5192]|0)!=-1){c[h>>2]=20768;c[h+4>>2]=20;c[h+8>>2]=0;gP(20768,h,142)}ly(b,4760,(c[5193]|0)-1|0);c[4293]=0;c[4292]=5960;if((c[5206]|0)!=-1){c[g>>2]=20824;c[g+4>>2]=20;c[g+8>>2]=0;gP(20824,g,142)}ly(b,17168,(c[5207]|0)-1|0);c[4291]=0;c[4290]=5920;if((c[5204]|0)!=-1){c[f>>2]=20816;c[f+4>>2]=20;c[f+8>>2]=0;gP(20816,f,142)}ly(b,17160,(c[5205]|0)-1|0);i=e;return}function ly(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;gr(b|0);e=a+8|0;f=a+12|0;a=c[f>>2]|0;g=e|0;h=c[g>>2]|0;i=a-h>>2;do{if(i>>>0>d>>>0){j=h}else{k=d+1|0;if(i>>>0<k>>>0){ni(e,k-i|0);j=c[g>>2]|0;break}if(i>>>0<=k>>>0){j=h;break}l=h+(k<<2)|0;if((l|0)==(a|0)){j=h;break}c[f>>2]=a+(~((a-4+(-l|0)|0)>>>2)<<2);j=h}}while(0);h=c[j+(d<<2)>>2]|0;if((h|0)==0){m=j;n=m+(d<<2)|0;c[n>>2]=b;return}gs(h|0)|0;m=c[g>>2]|0;n=m+(d<<2)|0;c[n>>2]=b;return}function lz(a){a=a|0;lA(a);n6(a);return}function lA(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;c[b>>2]=6664;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)!=(g|0)){h=0;i=g;g=e;while(1){e=c[i+(h<<2)>>2]|0;if((e|0)==0){j=g;k=i}else{l=e|0;gs(l)|0;j=c[d>>2]|0;k=c[f>>2]|0}l=h+1|0;if(l>>>0<j-k>>2>>>0){h=l;i=k;g=j}else{break}}}gU(b+144|0);j=c[f>>2]|0;if((j|0)==0){m=b|0;gq(m);return}f=c[d>>2]|0;if((j|0)!=(f|0)){c[d>>2]=f+(~((f-4+(-j|0)|0)>>>2)<<2)}if((j|0)==(b+24|0)){a[b+136|0]=0;m=b|0;gq(m);return}else{n6(j);m=b|0;gq(m);return}}function lB(){var b=0,d=0;if((a[21808]|0)!=0){b=c[4264]|0;return b|0}if((bx(21808)|0)==0){b=c[4264]|0;return b|0}do{if((a[21816]|0)==0){if((bx(21816)|0)==0){break}lx(17248,1);c[4268]=17248;c[4266]=17072}}while(0);d=c[c[4266]>>2]|0;c[4270]=d;gr(d|0);c[4264]=17080;b=c[4264]|0;return b|0}function lC(a){a=a|0;var b=0;b=c[(lB()|0)>>2]|0;c[a>>2]=b;gr(b|0);return}function lD(a,b){a=a|0;b=b|0;var d=0;d=c[b>>2]|0;c[a>>2]=d;gr(d|0);return}function lE(a){a=a|0;gs(c[a>>2]|0)|0;return}function lF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=c[a>>2]|0;a=b|0;if((c[a>>2]|0)!=-1){c[e>>2]=b;c[e+4>>2]=20;c[e+8>>2]=0;gP(a,e,142)}e=(c[b+4>>2]|0)-1|0;b=c[f+8>>2]|0;if((c[f+12>>2]|0)-b>>2>>>0<=e>>>0){g=cx(4)|0;h=g;nC(h);bL(g|0,12712,196);return 0}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=cx(4)|0;h=g;nC(h);bL(g|0,12712,196);return 0}else{i=d;return f|0}return 0}function lG(a){a=a|0;gq(a|0);n6(a);return}function lH(a){a=a|0;if((a|0)==0){return}cT[c[(c[a>>2]|0)+4>>2]&511](a);return}function lI(a){a=a|0;c[a+4>>2]=(K=c[5228]|0,c[5228]=K+1,K)+1;return}function lJ(a){a=a|0;gq(a|0);n6(a);return}function lK(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(bq()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function lL(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(bq()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function lM(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(bq()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=4597;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=4596;break}else{h=e}}if((i|0)==4597){return g|0}else if((i|0)==4596){return g|0}return 0}function lN(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=4605;break}e=c[a>>2]|0;if(e>>>0>=128>>>0){g=a;h=4607;break}if((b[(c[(bq()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=4606;break}else{a=a+4|0}}if((h|0)==4607){return g|0}else if((h|0)==4605){return g|0}else if((h|0)==4606){return g|0}return 0}function lO(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(cE()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function lP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(cE()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function lQ(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(cF()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function lR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(cF()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function lS(a,b){a=a|0;b=b|0;return b<<24>>24|0}function lT(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function lU(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function lV(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=((e-4+(-d|0)|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function lW(b){b=b|0;var d=0;c[b>>2]=6776;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}n7(d)}}while(0);gq(b|0);n6(b);return}function lX(b){b=b|0;var d=0;c[b>>2]=6776;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}n7(d)}}while(0);gq(b|0);return}function lY(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(cE()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function lZ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(cE()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function l_(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(cF()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function l$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(cF()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function l0(a,b){a=a|0;b=b|0;return b|0}function l1(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function l2(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24<0?c:b)|0}function l3(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24<0?e:f;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function l4(a){a=a|0;gq(a|0);n6(a);return}function l5(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function l6(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function l7(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function l8(a){a=a|0;return 1}function l9(a){a=a|0;return 1}function ma(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function mb(a){a=a|0;return 1}function mc(a){a=a|0;lv(a);n6(a);return}function md(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+8|0;m=l|0;n=m;o=i;i=i+4|0;i=i+7&-8;p=e;while(1){if((p|0)==(f|0)){q=f;break}if((c[p>>2]|0)==0){q=p;break}else{p=p+4|0}}c[k>>2]=h;c[g>>2]=e;L5671:do{if((e|0)==(f|0)|(h|0)==(j|0)){r=e}else{p=d;s=j;t=b+8|0;u=o|0;v=h;w=e;x=q;while(1){y=c[p+4>>2]|0;c[m>>2]=c[p>>2];c[m+4>>2]=y;y=cf(c[t>>2]|0)|0;z=nv(v,g,x-w>>2,s-v|0,d)|0;if((y|0)!=0){cf(y|0)|0}if((z|0)==(-1|0)){A=4729;break}else if((z|0)==0){B=1;A=4765;break}y=(c[k>>2]|0)+z|0;c[k>>2]=y;if((y|0)==(j|0)){A=4762;break}if((x|0)==(f|0)){C=f;D=y;E=c[g>>2]|0}else{y=cf(c[t>>2]|0)|0;z=nu(u,0,d)|0;if((y|0)!=0){cf(y|0)|0}if((z|0)==-1){B=2;A=4767;break}y=c[k>>2]|0;if(z>>>0>(s-y|0)>>>0){B=1;A=4768;break}L5690:do{if((z|0)!=0){F=z;G=u;H=y;while(1){I=a[G]|0;c[k>>2]=H+1;a[H]=I;I=F-1|0;if((I|0)==0){break L5690}F=I;G=G+1|0;H=c[k>>2]|0}}}while(0);y=(c[g>>2]|0)+4|0;c[g>>2]=y;z=y;while(1){if((z|0)==(f|0)){J=f;break}if((c[z>>2]|0)==0){J=z;break}else{z=z+4|0}}C=J;D=c[k>>2]|0;E=y}if((E|0)==(f|0)|(D|0)==(j|0)){r=E;break L5671}else{v=D;w=E;x=C}}if((A|0)==4729){c[k>>2]=v;L5702:do{if((w|0)==(c[g>>2]|0)){K=w}else{x=w;u=v;while(1){s=c[x>>2]|0;p=cf(c[t>>2]|0)|0;z=nu(u,s,n)|0;if((p|0)!=0){cf(p|0)|0}if((z|0)==-1){K=x;break L5702}p=(c[k>>2]|0)+z|0;c[k>>2]=p;z=x+4|0;if((z|0)==(c[g>>2]|0)){K=z;break}else{x=z;u=p}}}}while(0);c[g>>2]=K;B=2;i=l;return B|0}else if((A|0)==4762){r=c[g>>2]|0;break}else if((A|0)==4765){i=l;return B|0}else if((A|0)==4767){i=l;return B|0}else if((A|0)==4768){i=l;return B|0}}}while(0);B=(r|0)!=(f|0)|0;i=l;return B|0}function me(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+8|0;m=l|0;n=m;o=e;while(1){if((o|0)==(f|0)){p=f;break}if((a[o]|0)==0){p=o;break}else{o=o+1|0}}c[k>>2]=h;c[g>>2]=e;L5723:do{if((e|0)==(f|0)|(h|0)==(j|0)){q=e}else{o=d;r=j;s=b+8|0;t=h;u=e;v=p;while(1){w=c[o+4>>2]|0;c[m>>2]=c[o>>2];c[m+4>>2]=w;x=v;w=cf(c[s>>2]|0)|0;y=nr(t,g,x-u|0,r-t>>2,d)|0;if((w|0)!=0){cf(w|0)|0}if((y|0)==(-1|0)){z=4784;break}else if((y|0)==0){A=2;z=4819;break}w=(c[k>>2]|0)+(y<<2)|0;c[k>>2]=w;if((w|0)==(j|0)){z=4816;break}y=c[g>>2]|0;if((v|0)==(f|0)){B=f;C=w;D=y}else{E=cf(c[s>>2]|0)|0;F=nq(w,y,1,d)|0;if((E|0)!=0){cf(E|0)|0}if((F|0)!=0){A=2;z=4823;break}c[k>>2]=(c[k>>2]|0)+4;F=(c[g>>2]|0)+1|0;c[g>>2]=F;E=F;while(1){if((E|0)==(f|0)){G=f;break}if((a[E]|0)==0){G=E;break}else{E=E+1|0}}B=G;C=c[k>>2]|0;D=F}if((D|0)==(f|0)|(C|0)==(j|0)){q=D;break L5723}else{t=C;u=D;v=B}}if((z|0)==4784){c[k>>2]=t;L5747:do{if((u|0)==(c[g>>2]|0)){H=u}else{v=t;r=u;while(1){o=cf(c[s>>2]|0)|0;E=nq(v,r,x-r|0,n)|0;if((o|0)!=0){cf(o|0)|0}if((E|0)==0){I=r+1|0}else if((E|0)==(-1|0)){z=4795;break}else if((E|0)==(-2|0)){z=4796;break}else{I=r+E|0}E=(c[k>>2]|0)+4|0;c[k>>2]=E;if((I|0)==(c[g>>2]|0)){H=I;break L5747}else{v=E;r=I}}if((z|0)==4795){c[g>>2]=r;A=2;i=l;return A|0}else if((z|0)==4796){c[g>>2]=r;A=1;i=l;return A|0}}}while(0);c[g>>2]=H;A=(H|0)!=(f|0)|0;i=l;return A|0}else if((z|0)==4816){q=c[g>>2]|0;break}else if((z|0)==4819){i=l;return A|0}else if((z|0)==4823){i=l;return A|0}}}while(0);A=(q|0)!=(f|0)|0;i=l;return A|0}function mf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;j=cf(c[b+8>>2]|0)|0;b=nu(e,0,d)|0;if((j|0)!=0){cf(j|0)|0}if((b|0)==(-1|0)|(b|0)==0){k=2;i=h;return k|0}j=b-1|0;b=c[g>>2]|0;if(j>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((j|0)==0){k=0;i=h;return k|0}else{l=j;m=e;n=b}while(1){b=a[m]|0;c[g>>2]=n+1;a[n]=b;b=l-1|0;if((b|0)==0){k=0;break}l=b;m=m+1|0;n=c[g>>2]|0}i=h;return k|0}function mg(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;a=cf(c[b>>2]|0)|0;d=nt(0,0,4)|0;if((a|0)!=0){cf(a|0)|0}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}b=cf(d|0)|0;if((b|0)==0){e=0;return e|0}cf(b|0)|0;e=0;return e|0}function mh(a){a=a|0;return 0}function mi(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=cf(c[i>>2]|0)|0;l=np(a,h-a|0,b)|0;if((k|0)!=0){cf(k|0)|0}if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;m=4880;break}else if((l|0)==0){n=1;o=a+1|0}else{n=l;o=a+l|0}l=n+d|0;k=j+1|0;if(k>>>0>=f>>>0|(o|0)==(e|0)){g=l;m=4882;break}else{a=o;d=l;j=k}}if((m|0)==4880){return g|0}else if((m|0)==4882){return g|0}return 0}function mj(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=cf(b|0)|0;if((a|0)==0){d=4;break}cf(a|0)|0;d=4}}while(0);return d|0}function mk(a){a=a|0;gq(a|0);n6(a);return}function ml(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=mm(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function mm(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){m=1;return m|0}else{c[j>>2]=h+1;a[h]=-17;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-69;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-65;break}}}while(0);h=f;l=c[g>>2]|0;if(l>>>0>=f>>>0){m=0;return m|0}d=i;i=l;L5840:while(1){l=b[i>>1]|0;n=l&65535;if(n>>>0>k>>>0){m=2;o=4923;break}do{if((l&65535)>>>0<128>>>0){p=c[j>>2]|0;if((d-p|0)<1){m=1;o=4928;break L5840}c[j>>2]=p+1;a[p]=l&255}else{if((l&65535)>>>0<2048>>>0){p=c[j>>2]|0;if((d-p|0)<2){m=1;o=4921;break L5840}c[j>>2]=p+1;a[p]=(n>>>6|192)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0<55296>>>0){p=c[j>>2]|0;if((d-p|0)<3){m=1;o=4919;break L5840}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0>=56320>>>0){if((l&65535)>>>0<57344>>>0){m=2;o=4924;break L5840}p=c[j>>2]|0;if((d-p|0)<3){m=1;o=4922;break L5840}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((h-i|0)<4){m=1;o=4927;break L5840}p=i+2|0;q=e[p>>1]|0;if((q&64512|0)!=56320){m=2;o=4925;break L5840}if((d-(c[j>>2]|0)|0)<4){m=1;o=4920;break L5840}r=n&960;if(((r<<10)+65536|n<<10&64512|q&1023)>>>0>k>>>0){m=2;o=4926;break L5840}c[g>>2]=p;p=(r>>>6)+1|0;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(p>>>2|240)&255;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(n>>>2&15|p<<4&48|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n<<4&48|q>>>6&15|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(q&63|128)&255}}while(0);n=(c[g>>2]|0)+2|0;c[g>>2]=n;if(n>>>0<f>>>0){i=n}else{m=0;o=4930;break}}if((o|0)==4919){return m|0}else if((o|0)==4920){return m|0}else if((o|0)==4921){return m|0}else if((o|0)==4922){return m|0}else if((o|0)==4923){return m|0}else if((o|0)==4924){return m|0}else if((o|0)==4925){return m|0}else if((o|0)==4926){return m|0}else if((o|0)==4927){return m|0}else if((o|0)==4928){return m|0}else if((o|0)==4930){return m|0}return 0}function mn(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=mo(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function mo(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;c[g>>2]=e;c[j>>2]=h;h=c[g>>2]|0;do{if((l&4|0)==0){m=h}else{if((f-h|0)<=2){m=h;break}if((a[h]|0)!=-17){m=h;break}if((a[h+1|0]|0)!=-69){m=h;break}if((a[h+2|0]|0)!=-65){m=h;break}e=h+3|0;c[g>>2]=e;m=e}}while(0);L5886:do{if(m>>>0<f>>>0){h=f;l=i;e=c[j>>2]|0;n=m;L5888:while(1){if(e>>>0>=i>>>0){o=n;break L5886}p=a[n]|0;q=p&255;if(q>>>0>k>>>0){r=2;s=4973;break}do{if(p<<24>>24>-1){b[e>>1]=p&255;c[g>>2]=(c[g>>2]|0)+1}else{if((p&255)>>>0<194>>>0){r=2;s=4976;break L5888}if((p&255)>>>0<224>>>0){if((h-n|0)<2){r=1;s=4974;break L5888}t=d[n+1|0]|0;if((t&192|0)!=128){r=2;s=4975;break L5888}u=t&63|q<<6&1984;if(u>>>0>k>>>0){r=2;s=4980;break L5888}b[e>>1]=u&65535;c[g>>2]=(c[g>>2]|0)+2;break}if((p&255)>>>0<240>>>0){if((h-n|0)<3){r=1;s=4978;break L5888}u=a[n+1|0]|0;t=a[n+2|0]|0;if((q|0)==224){if((u&-32)<<24>>24!=-96){r=2;s=4977;break L5888}}else if((q|0)==237){if((u&-32)<<24>>24!=-128){r=2;s=4979;break L5888}}else{if((u&-64)<<24>>24!=-128){r=2;s=4981;break L5888}}v=t&255;if((v&192|0)!=128){r=2;s=4982;break L5888}t=(u&255)<<6&4032|q<<12|v&63;if((t&65535)>>>0>k>>>0){r=2;s=4983;break L5888}b[e>>1]=t&65535;c[g>>2]=(c[g>>2]|0)+3;break}if((p&255)>>>0>=245>>>0){r=2;s=4984;break L5888}if((h-n|0)<4){r=1;s=4985;break L5888}t=a[n+1|0]|0;v=a[n+2|0]|0;u=a[n+3|0]|0;if((q|0)==240){if((t+112&255)>>>0>=48>>>0){r=2;s=4986;break L5888}}else if((q|0)==244){if((t&-16)<<24>>24!=-128){r=2;s=4987;break L5888}}else{if((t&-64)<<24>>24!=-128){r=2;s=4988;break L5888}}w=v&255;if((w&192|0)!=128){r=2;s=4989;break L5888}v=u&255;if((v&192|0)!=128){r=2;s=4990;break L5888}if((l-e|0)<4){r=1;s=4991;break L5888}u=q&7;x=t&255;t=w<<6;y=v&63;if((x<<12&258048|u<<18|t&4032|y)>>>0>k>>>0){r=2;s=4992;break L5888}b[e>>1]=(x<<2&60|w>>>4&3|((x>>>4&3|u<<2)<<6)+16320|55296)&65535;u=(c[j>>2]|0)+2|0;c[j>>2]=u;b[u>>1]=(y|t&960|56320)&65535;c[g>>2]=(c[g>>2]|0)+4}}while(0);q=(c[j>>2]|0)+2|0;c[j>>2]=q;p=c[g>>2]|0;if(p>>>0<f>>>0){e=q;n=p}else{o=p;break L5886}}if((s|0)==4973){return r|0}else if((s|0)==4974){return r|0}else if((s|0)==4975){return r|0}else if((s|0)==4976){return r|0}else if((s|0)==4977){return r|0}else if((s|0)==4978){return r|0}else if((s|0)==4979){return r|0}else if((s|0)==4980){return r|0}else if((s|0)==4981){return r|0}else if((s|0)==4982){return r|0}else if((s|0)==4983){return r|0}else if((s|0)==4984){return r|0}else if((s|0)==4985){return r|0}else if((s|0)==4986){return r|0}else if((s|0)==4987){return r|0}else if((s|0)==4988){return r|0}else if((s|0)==4989){return r|0}else if((s|0)==4990){return r|0}else if((s|0)==4991){return r|0}else if((s|0)==4992){return r|0}}else{o=m}}while(0);r=o>>>0<f>>>0|0;return r|0}function mp(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function mq(a){a=a|0;return 0}function mr(a){a=a|0;return 0}function ms(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return mt(c,d,e,1114111,0)|0}function mt(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L5959:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L5961:while(1){k=a[j]|0;l=k&255;if(l>>>0>f>>>0){m=j;break L5959}do{if(k<<24>>24>-1){n=j+1|0;o=i}else{if((k&255)>>>0<194>>>0){m=j;break L5959}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L5959}p=d[j+1|0]|0;if((p&192|0)!=128){m=j;break L5959}if((p&63|l<<6&1984)>>>0>f>>>0){m=j;break L5959}n=j+2|0;o=i;break}if((k&255)>>>0<240>>>0){q=j;if((g-q|0)<3){m=j;break L5959}p=a[j+1|0]|0;r=a[j+2|0]|0;if((l|0)==237){if((p&-32)<<24>>24!=-128){s=5020;break L5961}}else if((l|0)==224){if((p&-32)<<24>>24!=-96){s=5018;break L5961}}else{if((p&-64)<<24>>24!=-128){s=5022;break L5961}}t=r&255;if((t&192|0)!=128){m=j;break L5959}if(((p&255)<<6&4032|l<<12&61440|t&63)>>>0>f>>>0){m=j;break L5959}n=j+3|0;o=i;break}if((k&255)>>>0>=245>>>0){m=j;break L5959}u=j;if((g-u|0)<4){m=j;break L5959}if((e-i|0)>>>0<2>>>0){m=j;break L5959}t=a[j+1|0]|0;p=a[j+2|0]|0;r=a[j+3|0]|0;if((l|0)==240){if((t+112&255)>>>0>=48>>>0){s=5031;break L5961}}else if((l|0)==244){if((t&-16)<<24>>24!=-128){s=5033;break L5961}}else{if((t&-64)<<24>>24!=-128){s=5035;break L5961}}v=p&255;if((v&192|0)!=128){m=j;break L5959}p=r&255;if((p&192|0)!=128){m=j;break L5959}if(((t&255)<<12&258048|l<<18&1835008|v<<6&4032|p&63)>>>0>f>>>0){m=j;break L5959}n=j+4|0;o=i+1|0}}while(0);l=o+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L5959}}if((s|0)==5031){w=u-b|0;return w|0}else if((s|0)==5020){w=q-b|0;return w|0}else if((s|0)==5018){w=q-b|0;return w|0}else if((s|0)==5022){w=q-b|0;return w|0}else if((s|0)==5035){w=u-b|0;return w|0}else if((s|0)==5033){w=u-b|0;return w|0}}else{m=h}}while(0);w=m-b|0;return w|0}function mu(a){a=a|0;return 4}function mv(a){a=a|0;gq(a|0);n6(a);return}function mw(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=mx(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function mx(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){k=1;return k|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(f>>>0>=d>>>0){k=0;return k|0}j=g;g=f;L6025:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>i>>>0){k=2;l=5076;break}do{if(f>>>0<128>>>0){b=c[h>>2]|0;if((j-b|0)<1){k=1;l=5079;break L6025}c[h>>2]=b+1;a[b]=f&255}else{if(f>>>0<2048>>>0){b=c[h>>2]|0;if((j-b|0)<2){k=1;l=5078;break L6025}c[h>>2]=b+1;a[b]=(f>>>6|192)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}b=c[h>>2]|0;m=j-b|0;if(f>>>0<65536>>>0){if((m|0)<3){k=1;l=5075;break L6025}c[h>>2]=b+1;a[b]=(f>>>12|224)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f>>>6&63|128)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f&63|128)&255;break}else{if((m|0)<4){k=1;l=5077;break L6025}c[h>>2]=b+1;a[b]=(f>>>18|240)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>12&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>6&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{k=0;l=5073;break}}if((l|0)==5075){return k|0}else if((l|0)==5077){return k|0}else if((l|0)==5076){return k|0}else if((l|0)==5073){return k|0}else if((l|0)==5078){return k|0}else if((l|0)==5079){return k|0}return 0}function my(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=mz(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function mz(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;c[f>>2]=b;c[i>>2]=g;g=c[f>>2]|0;do{if((k&4|0)==0){l=g}else{if((e-g|0)<=2){l=g;break}if((a[g]|0)!=-17){l=g;break}if((a[g+1|0]|0)!=-69){l=g;break}if((a[g+2|0]|0)!=-65){l=g;break}b=g+3|0;c[f>>2]=b;l=b}}while(0);L6058:do{if(l>>>0<e>>>0){g=e;k=c[i>>2]|0;b=l;L6060:while(1){if(k>>>0>=h>>>0){m=b;break L6058}n=a[b]|0;o=n&255;do{if(n<<24>>24>-1){if(o>>>0>j>>>0){p=2;q=5126;break L6060}c[k>>2]=o;c[f>>2]=(c[f>>2]|0)+1}else{if((n&255)>>>0<194>>>0){p=2;q=5122;break L6060}if((n&255)>>>0<224>>>0){if((g-b|0)<2){p=1;q=5129;break L6060}r=d[b+1|0]|0;if((r&192|0)!=128){p=2;q=5125;break L6060}s=r&63|o<<6&1984;if(s>>>0>j>>>0){p=2;q=5123;break L6060}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+2;break}if((n&255)>>>0<240>>>0){if((g-b|0)<3){p=1;q=5131;break L6060}s=a[b+1|0]|0;r=a[b+2|0]|0;if((o|0)==237){if((s&-32)<<24>>24!=-128){p=2;q=5124;break L6060}}else if((o|0)==224){if((s&-32)<<24>>24!=-96){p=2;q=5140;break L6060}}else{if((s&-64)<<24>>24!=-128){p=2;q=5128;break L6060}}t=r&255;if((t&192|0)!=128){p=2;q=5137;break L6060}r=(s&255)<<6&4032|o<<12&61440|t&63;if(r>>>0>j>>>0){p=2;q=5138;break L6060}c[k>>2]=r;c[f>>2]=(c[f>>2]|0)+3;break}if((n&255)>>>0>=245>>>0){p=2;q=5133;break L6060}if((g-b|0)<4){p=1;q=5130;break L6060}r=a[b+1|0]|0;t=a[b+2|0]|0;s=a[b+3|0]|0;if((o|0)==244){if((r&-16)<<24>>24!=-128){p=2;q=5121;break L6060}}else if((o|0)==240){if((r+112&255)>>>0>=48>>>0){p=2;q=5139;break L6060}}else{if((r&-64)<<24>>24!=-128){p=2;q=5135;break L6060}}u=t&255;if((u&192|0)!=128){p=2;q=5136;break L6060}t=s&255;if((t&192|0)!=128){p=2;q=5132;break L6060}s=(r&255)<<12&258048|o<<18&1835008|u<<6&4032|t&63;if(s>>>0>j>>>0){p=2;q=5134;break L6060}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+4}}while(0);o=(c[i>>2]|0)+4|0;c[i>>2]=o;n=c[f>>2]|0;if(n>>>0<e>>>0){k=o;b=n}else{m=n;break L6058}}if((q|0)==5122){return p|0}else if((q|0)==5133){return p|0}else if((q|0)==5134){return p|0}else if((q|0)==5137){return p|0}else if((q|0)==5138){return p|0}else if((q|0)==5125){return p|0}else if((q|0)==5126){return p|0}else if((q|0)==5128){return p|0}else if((q|0)==5139){return p|0}else if((q|0)==5140){return p|0}else if((q|0)==5135){return p|0}else if((q|0)==5136){return p|0}else if((q|0)==5121){return p|0}else if((q|0)==5131){return p|0}else if((q|0)==5132){return p|0}else if((q|0)==5129){return p|0}else if((q|0)==5130){return p|0}else if((q|0)==5123){return p|0}else if((q|0)==5124){return p|0}}else{m=l}}while(0);p=m>>>0<e>>>0|0;return p|0}function mA(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function mB(a){a=a|0;return 0}function mC(a){a=a|0;return 0}function mD(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return mE(c,d,e,1114111,0)|0}function mE(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L6129:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=1;j=h;L6131:while(1){k=a[j]|0;l=k&255;do{if(k<<24>>24>-1){if(l>>>0>f>>>0){m=j;break L6129}n=j+1|0}else{if((k&255)>>>0<194>>>0){m=j;break L6129}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L6129}o=d[j+1|0]|0;if((o&192|0)!=128){m=j;break L6129}if((o&63|l<<6&1984)>>>0>f>>>0){m=j;break L6129}n=j+2|0;break}if((k&255)>>>0<240>>>0){p=j;if((g-p|0)<3){m=j;break L6129}o=a[j+1|0]|0;q=a[j+2|0]|0;if((l|0)==237){if((o&-32)<<24>>24!=-128){r=5167;break L6131}}else if((l|0)==224){if((o&-32)<<24>>24!=-96){r=5165;break L6131}}else{if((o&-64)<<24>>24!=-128){r=5169;break L6131}}s=q&255;if((s&192|0)!=128){m=j;break L6129}if(((o&255)<<6&4032|l<<12&61440|s&63)>>>0>f>>>0){m=j;break L6129}n=j+3|0;break}if((k&255)>>>0>=245>>>0){m=j;break L6129}t=j;if((g-t|0)<4){m=j;break L6129}s=a[j+1|0]|0;o=a[j+2|0]|0;q=a[j+3|0]|0;if((l|0)==244){if((s&-16)<<24>>24!=-128){r=5179;break L6131}}else if((l|0)==240){if((s+112&255)>>>0>=48>>>0){r=5177;break L6131}}else{if((s&-64)<<24>>24!=-128){r=5181;break L6131}}u=o&255;if((u&192|0)!=128){m=j;break L6129}o=q&255;if((o&192|0)!=128){m=j;break L6129}if(((s&255)<<12&258048|l<<18&1835008|u<<6&4032|o&63)>>>0>f>>>0){m=j;break L6129}n=j+4|0}}while(0);if(!(n>>>0<c>>>0&i>>>0<e>>>0)){m=n;break L6129}i=i+1|0;j=n}if((r|0)==5169){v=p-b|0;return v|0}else if((r|0)==5165){v=p-b|0;return v|0}else if((r|0)==5177){v=t-b|0;return v|0}else if((r|0)==5179){v=t-b|0;return v|0}else if((r|0)==5181){v=t-b|0;return v|0}else if((r|0)==5167){v=p-b|0;return v|0}}else{m=h}}while(0);v=m-b|0;return v|0}function mF(a){a=a|0;return 4}function mG(a){a=a|0;gq(a|0);n6(a);return}function mH(a){a=a|0;gq(a|0);n6(a);return}function mI(a){a=a|0;c[a>>2]=5872;gU(a+12|0);gq(a|0);n6(a);return}function mJ(a){a=a|0;c[a>>2]=5872;gU(a+12|0);gq(a|0);return}function mK(a){a=a|0;c[a>>2]=5824;gU(a+16|0);gq(a|0);n6(a);return}function mL(a){a=a|0;c[a>>2]=5824;gU(a+16|0);gq(a|0);return}function mM(b){b=b|0;return a[b+8|0]|0}function mN(a){a=a|0;return c[a+8>>2]|0}function mO(b){b=b|0;return a[b+9|0]|0}function mP(a){a=a|0;return c[a+12>>2]|0}function mQ(a,b){a=a|0;b=b|0;gR(a,b+12|0);return}function mR(a,b){a=a|0;b=b|0;gR(a,b+16|0);return}function mS(a,b){a=a|0;b=b|0;gS(a,3432,4);return}function mT(a,b){a=a|0;b=b|0;g1(a,3336,nx(3336)|0);return}function mU(a,b){a=a|0;b=b|0;gS(a,3240,5);return}function mV(a,b){a=a|0;b=b|0;g1(a,3136,nx(3136)|0);return}function mW(b){b=b|0;var d=0;if((a[21904]|0)!=0){d=c[4390]|0;return d|0}if((bx(21904)|0)==0){d=c[4390]|0;return d|0}do{if((a[21792]|0)==0){if((bx(21792)|0)==0){break}of(16600,0,168);bf(362,0,w|0)|0}}while(0);gV(16600,4264)|0;gV(16612,4256)|0;gV(16624,4248)|0;gV(16636,4232)|0;gV(16648,4216)|0;gV(16660,4208)|0;gV(16672,4192)|0;gV(16684,4184)|0;gV(16696,4176)|0;gV(16708,4168)|0;gV(16720,4160)|0;gV(16732,4152)|0;gV(16744,4120)|0;gV(16756,4112)|0;c[4390]=16600;d=c[4390]|0;return d|0}function mX(b){b=b|0;var d=0;if((a[21848]|0)!=0){d=c[4368]|0;return d|0}if((bx(21848)|0)==0){d=c[4368]|0;return d|0}do{if((a[21768]|0)==0){if((bx(21768)|0)==0){break}of(15856,0,168);bf(214,0,w|0)|0}}while(0);g4(15856,4648)|0;g4(15868,4616)|0;g4(15880,4584)|0;g4(15892,4544)|0;g4(15904,4504)|0;g4(15916,4472)|0;g4(15928,4432)|0;g4(15940,4416)|0;g4(15952,4360)|0;g4(15964,4344)|0;g4(15976,4328)|0;g4(15988,4312)|0;g4(16e3,4296)|0;g4(16012,4280)|0;c[4368]=15856;d=c[4368]|0;return d|0}function mY(b){b=b|0;var d=0;if((a[21896]|0)!=0){d=c[4388]|0;return d|0}if((bx(21896)|0)==0){d=c[4388]|0;return d|0}do{if((a[21784]|0)==0){if((bx(21784)|0)==0){break}of(16312,0,288);bf(234,0,w|0)|0}}while(0);gV(16312,288)|0;gV(16324,272)|0;gV(16336,264)|0;gV(16348,256)|0;gV(16360,248)|0;gV(16372,240)|0;gV(16384,232)|0;gV(16396,224)|0;gV(16408,168)|0;gV(16420,160)|0;gV(16432,144)|0;gV(16444,128)|0;gV(16456,120)|0;gV(16468,112)|0;gV(16480,104)|0;gV(16492,96)|0;gV(16504,248)|0;gV(16516,88)|0;gV(16528,80)|0;gV(16540,4712)|0;gV(16552,4704)|0;gV(16564,4696)|0;gV(16576,4688)|0;gV(16588,4680)|0;c[4388]=16312;d=c[4388]|0;return d|0}function mZ(b){b=b|0;var d=0;if((a[21840]|0)!=0){d=c[4366]|0;return d|0}if((bx(21840)|0)==0){d=c[4366]|0;return d|0}do{if((a[21760]|0)==0){if((bx(21760)|0)==0){break}of(15568,0,288);bf(298,0,w|0)|0}}while(0);g4(15568,2032)|0;g4(15580,1984)|0;g4(15592,1560)|0;g4(15604,960)|0;g4(15616,440)|0;g4(15628,888)|0;g4(15640,832)|0;g4(15652,744)|0;g4(15664,680)|0;g4(15676,640)|0;g4(15688,576)|0;g4(15700,536)|0;g4(15712,520)|0;g4(15724,488)|0;g4(15736,472)|0;g4(15748,456)|0;g4(15760,440)|0;g4(15772,424)|0;g4(15784,408)|0;g4(15796,392)|0;g4(15808,376)|0;g4(15820,360)|0;g4(15832,344)|0;g4(15844,312)|0;c[4366]=15568;d=c[4366]|0;return d|0}function m_(b){b=b|0;var d=0;if((a[21912]|0)!=0){d=c[4392]|0;return d|0}if((bx(21912)|0)==0){d=c[4392]|0;return d|0}do{if((a[21800]|0)==0){if((bx(21800)|0)==0){break}of(16768,0,288);bf(292,0,w|0)|0}}while(0);gV(16768,2104)|0;gV(16780,2088)|0;c[4392]=16768;d=c[4392]|0;return d|0}function m$(b){b=b|0;var d=0;if((a[21856]|0)!=0){d=c[4370]|0;return d|0}if((bx(21856)|0)==0){d=c[4370]|0;return d|0}do{if((a[21776]|0)==0){if((bx(21776)|0)==0){break}of(16024,0,288);bf(334,0,w|0)|0}}while(0);g4(16024,2144)|0;g4(16036,2128)|0;c[4370]=16024;d=c[4370]|0;return d|0}function m0(b){b=b|0;if((a[21920]|0)!=0){return 17576}if((bx(21920)|0)==0){return 17576}gS(17576,2960,8);bf(354,17576,w|0)|0;return 17576}function m1(b){b=b|0;if((a[21864]|0)!=0){return 17488}if((bx(21864)|0)==0){return 17488}g1(17488,2848,nx(2848)|0);bf(264,17488,w|0)|0;return 17488}function m2(b){b=b|0;if((a[21944]|0)!=0){return 17624}if((bx(21944)|0)==0){return 17624}gS(17624,2760,8);bf(354,17624,w|0)|0;return 17624}function m3(b){b=b|0;if((a[21888]|0)!=0){return 17536}if((bx(21888)|0)==0){return 17536}g1(17536,2704,nx(2704)|0);bf(264,17536,w|0)|0;return 17536}function m4(b){b=b|0;if((a[21936]|0)!=0){return 17608}if((bx(21936)|0)==0){return 17608}gS(17608,2680,20);bf(354,17608,w|0)|0;return 17608}function m5(b){b=b|0;if((a[21880]|0)!=0){return 17520}if((bx(21880)|0)==0){return 17520}g1(17520,2576,nx(2576)|0);bf(264,17520,w|0)|0;return 17520}function m6(b){b=b|0;if((a[21928]|0)!=0){return 17592}if((bx(21928)|0)==0){return 17592}gS(17592,2488,11);bf(354,17592,w|0)|0;return 17592}function m7(b){b=b|0;if((a[21872]|0)!=0){return 17504}if((bx(21872)|0)==0){return 17504}g1(17504,2408,nx(2408)|0);bf(264,17504,w|0)|0;return 17504}function m8(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=b8()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=+od(b,g,c[4272]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function m9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=b8()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=+od(b,g,c[4272]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function na(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=b8()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);l=+od(b,g,c[4272]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function nb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=b8()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);n=aQ(b|0,h|0,f|0,c[4272]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=M;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(M=j,k)|0}function nc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=b8()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);m=aQ(b|0,h|0,f|0,c[4272]|0)|0;f=M;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function nd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=b8()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);m=aQ(b|0,h|0,f|0,c[4272]|0)|0;f=M;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function ne(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=b8()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);m=aQ(b|0,h|0,f|0,c[4272]|0)|0;f=M;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function nf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(M=j,k)|0}l=b8()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);n=co(b|0,h|0,f|0,c[4272]|0)|0;f=M;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(M=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(M=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(M=j,k)|0}function ng(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=b8()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[21824]|0)==0){if((bx(21824)|0)==0){break}c[4272]=a0(2147483647,4024,0)|0}}while(0);m=co(b|0,h|0,f|0,c[4272]|0)|0;f=M;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function nh(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+4|0;d=(c[a>>2]|0)+(c[b+4>>2]|0)|0;a=d;e=c[b>>2]|0;if((e&1|0)==0){f=e;cT[f&511](a);return}else{f=c[(c[d>>2]|0)+(e-1)>>2]|0;cT[f&511](a);return}}function ni(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){lw(0)}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=5625}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=5625;break}a[l]=1;p=j;q=h}}while(0);if((o|0)==5625){p=n4(n<<2)|0;q=n}n=d;d=p+(g<<2)|0;do{if((d|0)==0){r=0}else{c[d>>2]=0;r=d}d=r+4|0;n=n-1|0;}while((n|0)!=0);n=p+(q<<2)|0;q=c[k>>2]|0;r=(c[f>>2]|0)-q|0;o=p+(g-(r>>2)<<2)|0;g=o;p=q;oe(g|0,p|0,r)|0;c[k>>2]=o;c[f>>2]=d;c[e>>2]=n;if((q|0)==0){return}if((q|0)==(j|0)){a[b+128|0]=0;return}else{n6(p);return}}function nj(a){a=a|0;g3(16300);g3(16288);g3(16276);g3(16264);g3(16252);g3(16240);g3(16228);g3(16216);g3(16204);g3(16192);g3(16180);g3(16168);g3(16156);g3(16144);g3(16132);g3(16120);g3(16108);g3(16096);g3(16084);g3(16072);g3(16060);g3(16048);g3(16036);g3(16024);return}function nk(a){a=a|0;gU(17044);gU(17032);gU(17020);gU(17008);gU(16996);gU(16984);gU(16972);gU(16960);gU(16948);gU(16936);gU(16924);gU(16912);gU(16900);gU(16888);gU(16876);gU(16864);gU(16852);gU(16840);gU(16828);gU(16816);gU(16804);gU(16792);gU(16780);gU(16768);return}function nl(a){a=a|0;g3(15844);g3(15832);g3(15820);g3(15808);g3(15796);g3(15784);g3(15772);g3(15760);g3(15748);g3(15736);g3(15724);g3(15712);g3(15700);g3(15688);g3(15676);g3(15664);g3(15652);g3(15640);g3(15628);g3(15616);g3(15604);g3(15592);g3(15580);g3(15568);return}function nm(a){a=a|0;gU(16588);gU(16576);gU(16564);gU(16552);gU(16540);gU(16528);gU(16516);gU(16504);gU(16492);gU(16480);gU(16468);gU(16456);gU(16444);gU(16432);gU(16420);gU(16408);gU(16396);gU(16384);gU(16372);gU(16360);gU(16348);gU(16336);gU(16324);gU(16312);return}function nn(a){a=a|0;g3(16012);g3(16e3);g3(15988);g3(15976);g3(15964);g3(15952);g3(15940);g3(15928);g3(15916);g3(15904);g3(15892);g3(15880);g3(15868);g3(15856);return}function no(a){a=a|0;gU(16756);gU(16744);gU(16732);gU(16720);gU(16708);gU(16696);gU(16684);gU(16672);gU(16660);gU(16648);gU(16636);gU(16624);gU(16612);gU(16600);return}function np(a,b,c){a=a|0;b=b|0;c=c|0;return nq(0,a,b,(c|0)!=0?c:15080)|0}function nq(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;j=((f|0)==0?15072:f)|0;f=c[j>>2]|0;L6678:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L6678}o=d+1|0;p=c[t+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L6696:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L6678}else{s=o;u=p;v=q;w=l}while(1){s=s+1|0;u=(w&255)-128|u<<6;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L6696}w=a[s]|0;if(((w&255)-128|0)>>>0>63>>>0){break L6678}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(b8()|0)>>2]=84;k=-1;i=g;return k|0}function nr(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;i=i+1032|0;h=g|0;j=g+1024|0;k=c[b>>2]|0;c[j>>2]=k;l=(a|0)!=0;m=l?e:256;e=l?a:h|0;L6709:do{if((k|0)==0|(m|0)==0){n=0;o=d;p=m;q=e;r=k}else{a=h|0;s=m;t=d;u=0;v=e;w=k;while(1){x=t>>>2;y=x>>>0>=s>>>0;if(!(y|t>>>0>131>>>0)){n=u;o=t;p=s;q=v;r=w;break L6709}z=y?s:x;A=t-z|0;x=ns(v,j,z,f)|0;if((x|0)==-1){break}if((v|0)==(a|0)){B=a;C=s}else{B=v+(x<<2)|0;C=s-x|0}z=x+u|0;x=c[j>>2]|0;if((x|0)==0|(C|0)==0){n=z;o=A;p=C;q=B;r=x;break L6709}else{s=C;t=A;u=z;v=B;w=x}}n=-1;o=A;p=0;q=v;r=c[j>>2]|0}}while(0);L6720:do{if((r|0)==0){D=n}else{if((p|0)==0|(o|0)==0){D=n;break}else{E=p;F=o;G=n;H=q;I=r}while(1){J=nq(H,I,F,f)|0;if((J+2|0)>>>0<3>>>0){break}A=(c[j>>2]|0)+J|0;c[j>>2]=A;B=E-1|0;C=G+1|0;if((B|0)==0|(F|0)==(J|0)){D=C;break L6720}else{E=B;F=F-J|0;G=C;H=H+4|0;I=A}}if((J|0)==(-1|0)){D=-1;break}else if((J|0)==0){c[j>>2]=0;D=G;break}else{c[f>>2]=0;D=G;break}}}while(0);if(!l){i=g;return D|0}c[b>>2]=c[j>>2];i=g;return D|0}function ns(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;h=c[e>>2]|0;do{if((g|0)==0){i=5695}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=5695;break}if((b|0)==0){l=k;m=h;n=f;i=5706;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=5726}}while(0);if((i|0)==5695){if((b|0)==0){s=h;u=f;i=5697}else{v=h;w=b;x=f;i=5696}}L6741:while(1){if((i|0)==5696){i=0;if((x|0)==0){y=f;i=5748;break}else{z=x;A=w;B=v}while(1){h=a[B]|0;do{if(((h&255)-1|0)>>>0<127>>>0){if((B&3|0)==0&z>>>0>3>>>0){C=z;D=A;E=B}else{F=B;G=A;H=z;I=h;break}while(1){J=c[E>>2]|0;if(((J-16843009|J)&-2139062144|0)!=0){i=5720;break}c[D>>2]=J&255;c[D+4>>2]=d[E+1|0]|0;c[D+8>>2]=d[E+2|0]|0;K=E+4|0;L=D+16|0;c[D+12>>2]=d[E+3|0]|0;M=C-4|0;if(M>>>0>3>>>0){C=M;D=L;E=K}else{i=5721;break}}if((i|0)==5720){i=0;F=E;G=D;H=C;I=J&255;break}else if((i|0)==5721){i=0;F=K;G=L;H=M;I=a[K]|0;break}}else{F=B;G=A;H=z;I=h}}while(0);N=I&255;if((N-1|0)>>>0>=127>>>0){break}c[G>>2]=N;h=H-1|0;if((h|0)==0){y=f;i=5744;break L6741}else{z=h;A=G+4|0;B=F+1|0}}h=N-194|0;if(h>>>0>50>>>0){O=H;P=G;Q=F;i=5737;break}o=c[t+(h<<2)>>2]|0;p=F+1|0;q=G;r=H;i=5726;continue}else if((i|0)==5697){i=0;h=a[s]|0;do{if(((h&255)-1|0)>>>0<127>>>0){if((s&3|0)!=0){R=s;S=u;T=h;break}g=c[s>>2]|0;if(((g-16843009|g)&-2139062144|0)==0){U=u;V=s}else{R=s;S=u;T=g&255;break}do{V=V+4|0;U=U-4|0;W=c[V>>2]|0;}while(((W-16843009|W)&-2139062144|0)==0);R=V;S=U;T=W&255}else{R=s;S=u;T=h}}while(0);h=T&255;if((h-1|0)>>>0<127>>>0){s=R+1|0;u=S-1|0;i=5697;continue}g=h-194|0;if(g>>>0>50>>>0){O=S;P=b;Q=R;i=5737;break}l=c[t+(g<<2)>>2]|0;m=R+1|0;n=S;i=5706;continue}else if((i|0)==5706){i=0;g=(d[m]|0)>>>3;if((g-16|g+(l>>26))>>>0>7>>>0){i=5707;break}g=m+1|0;do{if((l&33554432|0)==0){X=g}else{if(((d[g]|0)-128|0)>>>0>63>>>0){i=5710;break L6741}h=m+2|0;if((l&524288|0)==0){X=h;break}if(((d[h]|0)-128|0)>>>0>63>>>0){i=5713;break L6741}X=m+3|0}}while(0);s=X;u=n-1|0;i=5697;continue}else if((i|0)==5726){i=0;g=d[p]|0;h=g>>>3;if((h-16|h+(o>>26))>>>0>7>>>0){i=5727;break}h=p+1|0;Y=g-128|o<<6;do{if((Y|0)<0){g=(d[h]|0)-128|0;if(g>>>0>63>>>0){i=5730;break L6741}k=p+2|0;Z=g|Y<<6;if((Z|0)>=0){_=Z;$=k;break}g=(d[k]|0)-128|0;if(g>>>0>63>>>0){i=5733;break L6741}_=g|Z<<6;$=p+3|0}else{_=Y;$=h}}while(0);c[q>>2]=_;v=$;w=q+4|0;x=r-1|0;i=5696;continue}}if((i|0)==5707){aa=l;ab=m-1|0;ac=b;ad=n;i=5736}else if((i|0)==5713){aa=l;ab=m-1|0;ac=b;ad=n;i=5736}else if((i|0)==5744){return y|0}else if((i|0)==5727){aa=o;ab=p-1|0;ac=q;ad=r;i=5736}else if((i|0)==5748){return y|0}else if((i|0)==5730){aa=Y;ab=p-1|0;ac=q;ad=r;i=5736}else if((i|0)==5733){aa=Z;ab=p-1|0;ac=q;ad=r;i=5736}else if((i|0)==5710){aa=l;ab=m-1|0;ac=b;ad=n;i=5736}if((i|0)==5736){if((aa|0)==0){O=ad;P=ac;Q=ab;i=5737}else{ae=ac;af=ab}}do{if((i|0)==5737){if((a[Q]|0)!=0){ae=P;af=Q;break}if((P|0)!=0){c[P>>2]=0;c[e>>2]=0}y=f-O|0;return y|0}}while(0);c[(b8()|0)>>2]=84;if((ae|0)==0){y=-1;return y|0}c[e>>2]=af;y=-1;return y|0}function nt(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){k=h;c[h>>2]=k;l=k}else{l=b}k=a[e]|0;m=k&255;if(k<<24>>24>-1){c[l>>2]=m;j=k<<24>>24!=0|0;i=g;return j|0}k=m-194|0;if(k>>>0>50>>>0){break}m=e+1|0;n=c[t+(k<<2)>>2]|0;if(f>>>0<4>>>0){if((n&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}k=d[m]|0;m=k>>>3;if((m-16|m+(n>>26))>>>0>7>>>0){break}m=k-128|n<<6;if((m|0)>=0){c[l>>2]=m;j=2;i=g;return j|0}n=(d[e+2|0]|0)-128|0;if(n>>>0>63>>>0){break}k=n|m<<6;if((k|0)>=0){c[l>>2]=k;j=3;i=g;return j|0}m=(d[e+3|0]|0)-128|0;if(m>>>0>63>>>0){break}c[l>>2]=m|k<<6;j=4;i=g;return j|0}}while(0);c[(b8()|0)>>2]=84;j=-1;i=g;return j|0}function nu(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((b|0)==0){f=1;return f|0}if(d>>>0<128>>>0){a[b]=d&255;f=1;return f|0}if(d>>>0<2048>>>0){a[b]=(d>>>6|192)&255;a[b+1|0]=(d&63|128)&255;f=2;return f|0}if(d>>>0<55296>>>0|(d-57344|0)>>>0<8192>>>0){a[b]=(d>>>12|224)&255;a[b+1|0]=(d>>>6&63|128)&255;a[b+2|0]=(d&63|128)&255;f=3;return f|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=(d>>>18|240)&255;a[b+1|0]=(d>>>12&63|128)&255;a[b+2|0]=(d>>>6&63|128)&255;a[b+3|0]=(d&63|128)&255;f=4;return f|0}else{c[(b8()|0)>>2]=84;f=-1;return f|0}return 0}function nv(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+264|0;g=f|0;h=f+256|0;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=k?e:256;e=k?a:g|0;L6862:do{if((j|0)==0|(l|0)==0){m=0;n=d;o=l;p=e;q=j}else{a=g|0;r=l;s=d;t=0;u=e;v=j;while(1){w=s>>>0>=r>>>0;if(!(w|s>>>0>32>>>0)){m=t;n=s;o=r;p=u;q=v;break L6862}x=w?r:s;y=s-x|0;w=nw(u,h,x,0)|0;if((w|0)==-1){break}if((u|0)==(a|0)){z=a;A=r}else{z=u+w|0;A=r-w|0}x=w+t|0;w=c[h>>2]|0;if((w|0)==0|(A|0)==0){m=x;n=y;o=A;p=z;q=w;break L6862}else{r=A;s=y;t=x;u=z;v=w}}m=-1;n=y;o=0;p=u;q=c[h>>2]|0}}while(0);L6873:do{if((q|0)==0){B=m}else{if((o|0)==0|(n|0)==0){B=m;break}else{C=o;D=n;E=m;F=p;G=q}while(1){H=nu(F,c[G>>2]|0,0)|0;if((H+1|0)>>>0<2>>>0){break}y=(c[h>>2]|0)+4|0;c[h>>2]=y;z=D-1|0;A=E+1|0;if((C|0)==(H|0)|(z|0)==0){B=A;break L6873}else{C=C-H|0;D=z;E=A;F=F+H|0;G=y}}if((H|0)!=0){B=-1;break}c[h>>2]=0;B=E}}while(0);if(!k){i=f;return B|0}c[b>>2]=c[h>>2];i=f;return B|0}function nw(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;if((b|0)==0){h=c[d>>2]|0;j=g|0;k=c[h>>2]|0;if((k|0)==0){l=0;i=f;return l|0}else{m=0;n=h;o=k}while(1){if(o>>>0>127>>>0){k=nu(j,o,0)|0;if((k|0)==-1){l=-1;p=5840;break}else{q=k}}else{q=1}k=q+m|0;h=n+4|0;r=c[h>>2]|0;if((r|0)==0){l=k;p=5839;break}else{m=k;n=h;o=r}}if((p|0)==5839){i=f;return l|0}else if((p|0)==5840){i=f;return l|0}}L6899:do{if(e>>>0>3>>>0){o=e;n=b;m=c[d>>2]|0;while(1){q=c[m>>2]|0;if((q|0)==0){s=o;t=n;break L6899}if(q>>>0>127>>>0){j=nu(n,q,0)|0;if((j|0)==-1){l=-1;break}u=n+j|0;v=o-j|0;w=m}else{a[n]=q&255;u=n+1|0;v=o-1|0;w=c[d>>2]|0}q=w+4|0;c[d>>2]=q;if(v>>>0>3>>>0){o=v;n=u;m=q}else{s=v;t=u;break L6899}}i=f;return l|0}else{s=e;t=b}}while(0);L6911:do{if((s|0)==0){x=0}else{b=g|0;u=s;v=t;w=c[d>>2]|0;while(1){m=c[w>>2]|0;if((m|0)==0){p=5833;break}if(m>>>0>127>>>0){n=nu(b,m,0)|0;if((n|0)==-1){l=-1;p=5842;break}if(n>>>0>u>>>0){p=5829;break}o=c[w>>2]|0;nu(v,o,0)|0;y=v+n|0;z=u-n|0;A=w}else{a[v]=m&255;y=v+1|0;z=u-1|0;A=c[d>>2]|0}m=A+4|0;c[d>>2]=m;if((z|0)==0){x=0;break L6911}else{u=z;v=y;w=m}}if((p|0)==5842){i=f;return l|0}else if((p|0)==5829){l=e-u|0;i=f;return l|0}else if((p|0)==5833){a[v]=0;x=u;break}}}while(0);c[d>>2]=0;l=e-x|0;i=f;return l|0}function nx(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function ny(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((d|0)==0){return a|0}else{e=b;f=d;g=a}while(1){d=f-1|0;c[g>>2]=c[e>>2];if((d|0)==0){break}else{e=e+4|0;f=d;g=g+4|0}}return a|0}function nz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}else{f=d}do{f=f-1|0;c[a+(f<<2)>>2]=c[b+(f<<2)>>2];}while((f|0)!=0);return a|0}else{if(e){return a|0}else{g=b;h=d;i=a}while(1){d=h-1|0;c[i>>2]=c[g>>2];if((d|0)==0){break}else{g=g+4|0;h=d;i=i+4|0}}return a|0}return 0}function nA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((d|0)==0){return a|0}else{e=d;f=a}while(1){d=e-1|0;c[f>>2]=b;if((d|0)==0){break}else{e=d;f=f+4|0}}return a|0}function nB(a){a=a|0;return}function nC(a){a=a|0;c[a>>2]=5216;return}function nD(a){a=a|0;n6(a);return}function nE(a){a=a|0;return}function nF(a){a=a|0;return 3320}function nG(a){a=a|0;nB(a|0);return}function nH(a){a=a|0;return}function nI(a){a=a|0;return}function nJ(a){a=a|0;nB(a|0);n6(a);return}function nK(a){a=a|0;nB(a|0);n6(a);return}function nL(a){a=a|0;nB(a|0);n6(a);return}function nM(a){a=a|0;nB(a|0);n6(a);return}function nN(a){a=a|0;nB(a|0);n6(a);return}function nO(a,b,c){a=a|0;b=b|0;c=c|0;return(a|0)==(b|0)|0}function nP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=nU(b,14480,14464,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}of(f|0,0,56);c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;c6[c[(c[h>>2]|0)+28>>2]&31](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function nQ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function nR(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;c6[c[(c[g>>2]|0)+28>>2]&31](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}
function nS(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;c6[c[(c[j>>2]|0)+28>>2]&31](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;c6[c[(c[j>>2]|0)+28>>2]&31](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=5938;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=5939;break}}if((m|0)==5938){return}else if((m|0)==5939){return}}function nT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+56|0;f=e|0;c[d>>2]=c[c[d>>2]>>2];g=b|0;do{if((a|0)==(g|0)|(g|0)==14496){h=1}else{if((b|0)==0){h=0;break}j=nU(b,14480,14432,-1)|0;if((j|0)==0){h=0;break}if((c[j+8>>2]&~c[a+8>>2]|0)!=0){h=0;break}k=c[a+12>>2]|0;l=j+12|0;if((k|0)==(c[l>>2]|0)|(k|0)==12640){h=1;break}if((k|0)==0){h=0;break}j=nU(k,14480,14464,-1)|0;if((j|0)==0){h=0;break}k=c[l>>2]|0;if((k|0)==0){h=0;break}l=nU(k,14480,14464,-1)|0;k=l;if((l|0)==0){h=0;break}of(f|0,0,56);c[f>>2]=k;c[f+8>>2]=j;c[f+12>>2]=-1;c[f+48>>2]=1;c6[c[(c[l>>2]|0)+28>>2]&31](k,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){h=0;break}c[d>>2]=c[f+16>>2];h=1}}while(0);i=e;return h|0}function nU(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;of(e|0,0,39);if((k|0)==(d|0)){c[g+48>>2]=1;c3[c[(c[k>>2]|0)+20>>2]&63](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}cP[c[(c[k>>2]|0)+24>>2]&7](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==0){if((c[n>>2]|0)!=1){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}o=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return o|0}else if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}if((c[m>>2]|0)==1){break}else{o=0}i=f;return o|0}}while(0);o=c[e>>2]|0;i=f;return o|0}else{o=0;i=f;return o|0}return 0}function nV(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L7109:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L7111:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;c3[c[(c[v>>2]|0)+20>>2]&63](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L7111}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=5999;break L7109}if((c[o>>2]&2|0)==0){B=5999;break L7109}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=5998}else{D=x;B=5995}}else{D=0;B=5995}}while(0);do{if((B|0)==5995){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=5998;break}if((c[d+24>>2]|0)!=2){C=D;B=5998;break}a[d+54|0]=1;if(D){B=5999}else{B=6e3}}}while(0);if((B|0)==5998){if(C){B=5999}else{B=6e3}}if((B|0)==5999){c[i>>2]=3;return}else if((B|0)==6e3){c[i>>2]=4;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;cP[c[(c[y>>2]|0)+24>>2]&7](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=6037;break}if((c[b>>2]|0)==1){B=6038;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;cP[c[(c[w>>2]|0)+24>>2]&7](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=6027;break}}if((B|0)==6027){return}else if((B|0)==6037){return}else if((B|0)==6038){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=6040;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=6041;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;cP[c[(c[w>>2]|0)+24>>2]&7](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=6028;break}}if((B|0)==6040){return}else if((B|0)==6041){return}else if((B|0)==6028){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=6034;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;cP[c[(c[i>>2]|0)+24>>2]&7](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=6033;break}}if((B|0)==6033){return}else if((B|0)==6034){return}}function nW(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;cP[c[(c[h>>2]|0)+24>>2]&7](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;c3[c[(c[l>>2]|0)+20>>2]&63](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=6055}else{if((a[j]&1)==0){m=1;n=6055}}L7211:do{if((n|0)==6055){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=6058;break}a[d+54|0]=1;if(m){break L7211}}else{n=6058}}while(0);if((n|0)==6058){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function nX(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function nY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;c3[c[(c[p>>2]|0)+20>>2]&63](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L7260:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L7260}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L7260}}else{if((c[o>>2]|0)==1){break L7260}if((c[q>>2]&2|0)==0){break L7260}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;c3[c[(c[u>>2]|0)+20>>2]&63](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function nZ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;c3[c[(c[i>>2]|0)+20>>2]&63](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function n_(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function n$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[3774]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=15136+(h<<2)|0;j=15136+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3774]=e&~(1<<g)}else{if(l>>>0<(c[3778]|0)>>>0){cm();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{cm();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3776]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=15136+(p<<2)|0;m=15136+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3774]=e&~(1<<r)}else{if(l>>>0<(c[3778]|0)>>>0){cm();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{cm();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3776]|0;if((l|0)!=0){q=c[3779]|0;d=l>>>3;l=d<<1;f=15136+(l<<2)|0;k=c[3774]|0;h=1<<d;do{if((k&h|0)==0){c[3774]=k|h;s=f;t=15136+(l+2<<2)|0}else{d=15136+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3778]|0)>>>0){s=g;t=d;break}cm();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3776]=m;c[3779]=e;n=i;return n|0}l=c[3775]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[15400+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3778]|0;if(r>>>0<i>>>0){cm();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){cm();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){cm();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){cm();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){cm();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{cm();return 0}}}while(0);L7427:do{if((e|0)!=0){f=d+28|0;i=15400+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3775]=c[3775]&~(1<<c[f>>2]);break L7427}else{if(e>>>0<(c[3778]|0)>>>0){cm();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L7427}}}while(0);if(v>>>0<(c[3778]|0)>>>0){cm();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3776]|0;if((f|0)!=0){e=c[3779]|0;i=f>>>3;f=i<<1;q=15136+(f<<2)|0;k=c[3774]|0;g=1<<i;do{if((k&g|0)==0){c[3774]=k|g;y=q;z=15136+(f+2<<2)|0}else{i=15136+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3778]|0)>>>0){y=l;z=i;break}cm();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3776]=p;c[3779]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[3775]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[15400+(A<<2)>>2]|0;L7475:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L7475}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[15400+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3776]|0)-g|0)>>>0){o=g;break}q=K;m=c[3778]|0;if(q>>>0<m>>>0){cm();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){cm();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){cm();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){cm();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){cm();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{cm();return 0}}}while(0);L7525:do{if((e|0)!=0){i=K+28|0;m=15400+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3775]=c[3775]&~(1<<c[i>>2]);break L7525}else{if(e>>>0<(c[3778]|0)>>>0){cm();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L7525}}}while(0);if(L>>>0<(c[3778]|0)>>>0){cm();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=15136+(e<<2)|0;r=c[3774]|0;j=1<<i;do{if((r&j|0)==0){c[3774]=r|j;O=m;P=15136+(e+2<<2)|0}else{i=15136+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3778]|0)>>>0){O=d;P=i;break}cm();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=15400+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3775]|0;l=1<<Q;if((m&l|0)==0){c[3775]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=6315;break}else{l=l<<1;m=j}}if((T|0)==6315){if(S>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3778]|0;if(m>>>0<i>>>0){cm();return 0}if(j>>>0<i>>>0){cm();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3776]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3779]|0;if(S>>>0>15>>>0){R=J;c[3779]=R+o;c[3776]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3776]=0;c[3779]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3777]|0;if(o>>>0<J>>>0){S=J-o|0;c[3777]=S;J=c[3780]|0;K=J;c[3780]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3762]|0)==0){J=aL(30)|0;if((J-1&J|0)==0){c[3764]=J;c[3763]=J;c[3765]=-1;c[3766]=-1;c[3767]=0;c[3885]=0;c[3762]=(cc(0)|0)&-16^1431655768;break}else{cm();return 0}}}while(0);J=o+48|0;S=c[3764]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3884]|0;do{if((O|0)!=0){P=c[3882]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L7617:do{if((c[3885]&4|0)==0){O=c[3780]|0;L7619:do{if((O|0)==0){T=6345}else{L=O;P=15544;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=6345;break L7619}else{P=M}}if((P|0)==0){T=6345;break}L=R-(c[3777]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=b6(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=6354}}while(0);do{if((T|0)==6345){O=b6(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3763]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3882]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[3884]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=b6($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=6354}}while(0);L7639:do{if((T|0)==6354){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=6365;break L7617}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[3764]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((b6(O|0)|0)==-1){b6(m|0)|0;W=Y;break L7639}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=6365;break L7617}}}while(0);c[3885]=c[3885]|4;ad=W;T=6362}else{ad=0;T=6362}}while(0);do{if((T|0)==6362){if(S>>>0>=2147483647>>>0){break}W=b6(S|0)|0;Z=b6(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=6365}}}while(0);do{if((T|0)==6365){ad=(c[3882]|0)+aa|0;c[3882]=ad;if(ad>>>0>(c[3883]|0)>>>0){c[3883]=ad}ad=c[3780]|0;L7659:do{if((ad|0)==0){S=c[3778]|0;if((S|0)==0|ab>>>0<S>>>0){c[3778]=ab}c[3886]=ab;c[3887]=aa;c[3889]=0;c[3783]=c[3762];c[3782]=-1;S=0;do{Y=S<<1;ac=15136+(Y<<2)|0;c[15136+(Y+3<<2)>>2]=ac;c[15136+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[3780]=ab+ae;c[3777]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[3781]=c[3766]}else{S=15544;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=6377;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==6377){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[3780]|0;Y=(c[3777]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[3780]=Z+ai;c[3777]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3781]=c[3766];break L7659}}while(0);if(ab>>>0<(c[3778]|0)>>>0){c[3778]=ab}S=ab+aa|0;Y=15544;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=6387;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==6387){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[3780]|0)){J=(c[3777]|0)+K|0;c[3777]=J;c[3780]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[3779]|0)){J=(c[3776]|0)+K|0;c[3776]=J;c[3779]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L7704:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=15136+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3778]|0)>>>0){cm();return 0}if((c[U+12>>2]|0)==(Z|0)){break}cm();return 0}}while(0);if((Q|0)==(U|0)){c[3774]=c[3774]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[3778]|0)>>>0){cm();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}cm();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[3778]|0)>>>0){cm();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){cm();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{cm();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=15400+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[3775]=c[3775]&~(1<<c[P>>2]);break L7704}else{if(m>>>0<(c[3778]|0)>>>0){cm();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L7704}}}while(0);if(an>>>0<(c[3778]|0)>>>0){cm();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=15136+(V<<2)|0;P=c[3774]|0;m=1<<J;do{if((P&m|0)==0){c[3774]=P|m;as=X;at=15136+(V+2<<2)|0}else{J=15136+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3778]|0)>>>0){as=U;at=J;break}cm();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=15400+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[3775]|0;Q=1<<au;if((X&Q|0)==0){c[3775]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=6460;break}else{Q=Q<<1;X=m}}if((T|0)==6460){if(aw>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3778]|0;if(X>>>0<$>>>0){cm();return 0}if(m>>>0<$>>>0){cm();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=15544;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[3780]=ab+aB;c[3777]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[3781]=c[3766];c[ac+4>>2]=27;c[W>>2]=c[3886];c[W+4>>2]=c[3887];c[W+8>>2]=c[3888];c[W+12>>2]=c[3889];c[3886]=ab;c[3887]=aa;c[3889]=0;c[3888]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=15136+(K<<2)|0;S=c[3774]|0;m=1<<W;do{if((S&m|0)==0){c[3774]=S|m;aC=Z;aD=15136+(K+2<<2)|0}else{W=15136+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3778]|0)>>>0){aC=Q;aD=W;break}cm();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=15400+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[3775]|0;Q=1<<aE;if((Z&Q|0)==0){c[3775]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=6495;break}else{Q=Q<<1;Z=m}}if((T|0)==6495){if(aG>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3778]|0;if(Z>>>0<m>>>0){cm();return 0}if(_>>>0<m>>>0){cm();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[3777]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[3777]=_;ad=c[3780]|0;Q=ad;c[3780]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(b8()|0)>>2]=12;n=0;return n|0}function n0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3778]|0;if(b>>>0<e>>>0){cm()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){cm()}h=f&-8;i=a+(h-8)|0;j=i;L7876:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){cm()}if((n|0)==(c[3779]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3776]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=15136+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){cm()}if((c[k+12>>2]|0)==(n|0)){break}cm()}}while(0);if((s|0)==(k|0)){c[3774]=c[3774]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){cm()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}cm()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){cm()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){cm()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){cm()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{cm()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=15400+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3775]=c[3775]&~(1<<c[v>>2]);q=n;r=o;break L7876}else{if(p>>>0<(c[3778]|0)>>>0){cm()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L7876}}}while(0);if(A>>>0<(c[3778]|0)>>>0){cm()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3778]|0)>>>0){cm()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3778]|0)>>>0){cm()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){cm()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){cm()}do{if((e&2|0)==0){if((j|0)==(c[3780]|0)){B=(c[3777]|0)+r|0;c[3777]=B;c[3780]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3779]|0)){return}c[3779]=0;c[3776]=0;return}if((j|0)==(c[3779]|0)){B=(c[3776]|0)+r|0;c[3776]=B;c[3779]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L7978:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=15136+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3778]|0)>>>0){cm()}if((c[u+12>>2]|0)==(j|0)){break}cm()}}while(0);if((g|0)==(u|0)){c[3774]=c[3774]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3778]|0)>>>0){cm()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}cm()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3778]|0)>>>0){cm()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3778]|0)>>>0){cm()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){cm()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{cm()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=15400+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3775]=c[3775]&~(1<<c[t>>2]);break L7978}else{if(f>>>0<(c[3778]|0)>>>0){cm()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L7978}}}while(0);if(E>>>0<(c[3778]|0)>>>0){cm()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3778]|0)>>>0){cm()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3778]|0)>>>0){cm()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3779]|0)){H=B;break}c[3776]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=15136+(d<<2)|0;A=c[3774]|0;E=1<<r;do{if((A&E|0)==0){c[3774]=A|E;I=e;J=15136+(d+2<<2)|0}else{r=15136+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3778]|0)>>>0){I=h;J=r;break}cm()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=15400+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3775]|0;d=1<<K;do{if((r&d|0)==0){c[3775]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=6672;break}else{A=A<<1;J=E}}if((N|0)==6672){if(M>>>0<(c[3778]|0)>>>0){cm()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3778]|0;if(J>>>0<E>>>0){cm()}if(B>>>0<E>>>0){cm()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3782]|0)-1|0;c[3782]=q;if((q|0)==0){O=15552}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3782]=-1;return}function n1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=n$(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(b8()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=n2(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=n$(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;oe(f|0,a|0,e)|0;n0(a);d=f;return d|0}function n2(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3778]|0;if(g>>>0<j>>>0){cm();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){cm();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){cm();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3764]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;n3(g+b|0,k);n=a;return n|0}if((i|0)==(c[3780]|0)){k=(c[3777]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3780]=g+b;c[3777]=l;n=a;return n|0}if((i|0)==(c[3779]|0)){l=(c[3776]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3776]=q;c[3779]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L8165:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=15136+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){cm();return 0}if((c[l+12>>2]|0)==(i|0)){break}cm();return 0}}while(0);if((k|0)==(l|0)){c[3774]=c[3774]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){cm();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}cm();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){cm();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){cm();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){cm();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{cm();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=15400+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3775]=c[3775]&~(1<<c[t>>2]);break L8165}else{if(s>>>0<(c[3778]|0)>>>0){cm();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L8165}}}while(0);if(y>>>0<(c[3778]|0)>>>0){cm();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3778]|0)>>>0){cm();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;n3(g+b|0,q);n=a;return n|0}return 0}function n3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L8241:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3778]|0;if(i>>>0<l>>>0){cm()}if((j|0)==(c[3779]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3776]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=15136+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){cm()}if((c[p+12>>2]|0)==(j|0)){break}cm()}}while(0);if((q|0)==(p|0)){c[3774]=c[3774]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){cm()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}cm()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){cm()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){cm()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){cm()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{cm()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=15400+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3775]=c[3775]&~(1<<c[t>>2]);n=j;o=k;break L8241}else{if(m>>>0<(c[3778]|0)>>>0){cm()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L8241}}}while(0);if(y>>>0<(c[3778]|0)>>>0){cm()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3778]|0)>>>0){cm()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3778]|0)>>>0){cm()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3778]|0;if(e>>>0<a>>>0){cm()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3780]|0)){A=(c[3777]|0)+o|0;c[3777]=A;c[3780]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3779]|0)){return}c[3779]=0;c[3776]=0;return}if((f|0)==(c[3779]|0)){A=(c[3776]|0)+o|0;c[3776]=A;c[3779]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L8341:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=15136+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){cm()}if((c[g+12>>2]|0)==(f|0)){break}cm()}}while(0);if((t|0)==(g|0)){c[3774]=c[3774]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){cm()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}cm()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){cm()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){cm()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){cm()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{cm()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=15400+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3775]=c[3775]&~(1<<c[l>>2]);break L8341}else{if(m>>>0<(c[3778]|0)>>>0){cm()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L8341}}}while(0);if(C>>>0<(c[3778]|0)>>>0){cm()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3778]|0)>>>0){cm()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3778]|0)>>>0){cm()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3779]|0)){F=A;break}c[3776]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=15136+(z<<2)|0;C=c[3774]|0;b=1<<o;do{if((C&b|0)==0){c[3774]=C|b;G=y;H=15136+(z+2<<2)|0}else{o=15136+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3778]|0)>>>0){G=d;H=o;break}cm()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=15400+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3775]|0;z=1<<I;if((o&z|0)==0){c[3775]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=6952;break}else{I=I<<1;J=G}}if((L|0)==6952){if(K>>>0<(c[3778]|0)>>>0){cm()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3778]|0;if(J>>>0<I>>>0){cm()}if(L>>>0<I>>>0){cm()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function n4(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=n$(b)|0;if((d|0)!=0){e=6996;break}a=(K=c[5438]|0,c[5438]=K+0,K);if((a|0)==0){break}c$[a&3]()}if((e|0)==6996){return d|0}d=cx(4)|0;c[d>>2]=5184;bL(d|0,12696,46);return 0}function n5(a){a=a|0;return n4(a)|0}function n6(a){a=a|0;if((a|0)==0){return}n0(a);return}function n7(a){a=a|0;n6(a);return}function n8(a){a=a|0;n6(a);return}function n9(a){a=a|0;return}function oa(a){a=a|0;return 2744}function ob(){var a=0;a=cx(4)|0;c[a>>2]=5184;bL(a|0,12696,46)}function oc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((aZ(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){k=a[g]|0;if(((k<<24>>24)-48|0)>>>0<10>>>0){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;g=g+1|0}l=g+(-f|0)|0;i=(e|0)<0;m=((i^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(i?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){i=a[m]|0;r=m+1|0;if(i<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=i;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=7027}else{if((e|0)>0){v=0.0;w=e;x=l;y=7027}else{z=0.0;A=0.0}}if((y|0)==7027){f=x;n=w;m=0;while(1){r=a[f]|0;i=f+1|0;if(r<<24>>24==46){B=a[i]|0;C=f+2|0}else{B=r;C=i}D=(m*10|0)-48+(B<<24>>24)|0;i=n-1|0;if((i|0)>0){f=C;n=i;m=D}else{break}}z=+(D|0);A=v}E=A+z;do{if((k<<24>>24|0)==69|(k<<24>>24|0)==101){m=g+1|0;n=a[m]|0;if((n<<24>>24|0)==43){F=g+2|0;G=0}else if((n<<24>>24|0)==45){F=g+2|0;G=1}else{F=m;G=0}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10>>>0){H=F;I=0;J=m}else{K=0;L=F;M=G;break}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10>>>0){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}}else{K=0;L=g;M=0}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(b8()|0)>>2]=34;N=1.0;O=8;P=511;y=7044}else{if((m|0)==0){Q=1.0}else{N=1.0;O=8;P=m;y=7044}}if((y|0)==7044){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=7044}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((j|0)==0){S=q;return+S}S=-0.0-q;return+S}function od(a,b,c){a=a|0;b=b|0;c=c|0;return+(+oc(a,b))}function oe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function of(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function og(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function oh(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{oe(b,c,d)|0}}function oi(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function oj(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function ok(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(M=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function ol(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(M=e,a-c>>>0|0)|0}function om(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){M=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}M=a<<c-32;return 0}function on(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){M=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}M=0;return b>>>c-32|0}function oo(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){M=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}M=(b|0)<0?-1:0;return b>>c-32|0}function op(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function oq(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ai(d,c)|0;f=a>>>16;a=(e>>>16)+(ai(d,f)|0)|0;d=b>>>16;b=ai(d,c)|0;return(M=(a>>>16)+(ai(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function or(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=ol(e^a,f^b,e,f)|0;b=M;a=g^e;e=h^f;f=ol((ow(i,b,ol(g^c,h^d,g,h)|0,M,0)|0)^a,M^e,a,e)|0;return(M=M,f)|0}function os(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=ol(h^a,j^b,h,j)|0;b=M;a=ol(k^d,l^e,k,l)|0;ow(m,b,a,M,g)|0;a=ol(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=M;i=f;return(M=j,a)|0}function ot(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=oq(e,a)|0;f=M;return(M=(ai(b,a)|0)+(ai(d,e)|0)+f|f&0,c|0|0)|0}function ou(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=ow(a,b,c,d,0)|0;return(M=M,e)|0}function ov(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;ow(a,b,d,e,g)|0;i=f;return(M=c[g+4>>2]|0,c[g>>2]|0)|0}function ow(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(M=n,o)|0}else{if(!m){n=0;o=0;return(M=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(M=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(M=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(M=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((op(l|0)|0)>>>0);return(M=n,o)|0}p=(oi(l|0)|0)-(oi(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(M=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(M=n,o)|0}else{if(!m){r=(oi(l|0)|0)-(oi(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(M=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(M=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(oi(j|0)|0)+33-(oi(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(M=n,o)|0}else{p=op(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(M=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=ok(g,d,-1,-1)|0;k=M;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;ol(e,k,j,a)|0;b=M;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;K=ol(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;L=M;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=L;u=K;t=b;s=J}}B=H;C=I;D=L;E=K;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(M=n,o)|0}function ox(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;cP[a&7](b|0,c|0,d|0,e|0,f|0)}function oy(a,b,c){a=a|0;b=b|0;c=c|0;return+cQ[a&3](b|0,c|0)}function oz(a,b,c){a=a|0;b=b|0;c=c|0;return+cR[a&3](b|0,c|0)}function oA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;cS[a&15](b|0,c|0,d|0)}function oB(a,b){a=a|0;b=b|0;cT[a&511](b|0)}function oC(a,b,c){a=a|0;b=b|0;c=c|0;cU[a&127](b|0,c|0)}function oD(a,b,c){a=a|0;b=b|0;c=c|0;return cV[a&63](b|0,c|0)|0}function oE(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return cW[a&63](b|0,c|0,d|0)|0}function oF(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;cX[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function oG(a,b){a=a|0;b=b|0;return cY[a&255](b|0)|0}function oH(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;cZ[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function oI(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;c_[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function oJ(a){a=a|0;c$[a&3]()}function oK(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return c0[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function oL(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;c1[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function oM(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c2[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function oN(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;c3[a&63](b|0,c|0,d|0,e|0,f|0,g|0)}function oO(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return c4[a&15](b|0,c|0,d|0,e|0)|0}function oP(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return c5[a&31](b|0,c|0,d|0,e|0,f|0)|0}function oQ(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;c6[a&31](b|0,c|0,d|0,e|0)}function oR(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aj(0)}function oS(a,b){a=a|0;b=b|0;aj(1);return 0.0}function oT(a,b){a=a|0;b=b|0;aj(2);return 0.0}function oU(a,b,c){a=a|0;b=b|0;c=c|0;aj(3)}function oV(a){a=a|0;aj(4)}function oW(a,b){a=a|0;b=b|0;aj(5)}function oX(a,b){a=a|0;b=b|0;aj(6);return 0}function oY(a,b,c){a=a|0;b=b|0;c=c|0;aj(7);return 0}function oZ(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;aj(8)}function o_(a){a=a|0;aj(9);return 0}function o$(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;aj(10)}function o0(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;aj(11)}function o1(){aj(12)}function o2(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;aj(13);return 0}function o3(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;aj(14)}function o4(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;aj(15)}function o5(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aj(16)}function o6(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aj(17);return 0}function o7(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aj(18);return 0}function o8(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aj(19)}
// EMSCRIPTEN_END_FUNCS
var cP=[oR,oR,nX,oR,nW,oR,nV,oR];var cQ=[oS,oS,fz,oS];var cR=[oT,oT,eZ,oT];var cS=[oU,oU,fT,oU,fU,oU,gG,oU,h3,oU,oU,oU,oU,oU,oU,oU];var cT=[oV,oV,fu,oV,lq,oV,il,oV,ll,oV,gv,oV,js,oV,gC,oV,hg,oV,lv,oV,lI,oV,gi,oV,f5,oV,l4,oV,jd,oV,gu,oV,gE,oV,gA,oV,iL,oV,gD,oV,ia,oV,h6,oV,fc,oV,n9,oV,d1,oV,gv,oV,eT,oV,lG,oV,lW,oV,eN,oV,gA,oV,jU,oV,iM,oV,nC,oV,h_,oV,lm,oV,e4,oV,lH,oV,d4,oV,fb,oV,dy,oV,fy,oV,hJ,oV,im,oV,fp,oV,eM,oV,kx,oV,lA,oV,eE,oV,nH,oV,nN,oV,mI,oV,h4,oV,gA,oV,ih,oV,kc,oV,mL,oV,lJ,oV,n0,oV,mk,oV,nK,oV,lf,oV,mH,oV,nJ,oV,ft,oV,hO,oV,f4,oV,ff,oV,ig,oV,j7,oV,gv,oV,nh,oV,je,oV,mJ,oV,mv,oV,d3,oV,eK,oV,fx,oV,dC,oV,ky,oV,hI,oV,hV,oV,j4,oV,jT,oV,dw,oV,h7,oV,km,oV,n8,oV,hf,oV,ex,oV,e3,oV,fg,oV,fl,oV,eU,oV,h$,oV,hu,oV,fh,oV,eX,oV,nE,oV,hK,oV,ey,oV,h5,oV,kT,oV,fY,oV,kI,oV,h0,oV,lE,oV,nn,oV,nI,oV,gb,oV,lz,oV,j5,oV,k2,oV,nD,oV,mG,oV,kW,oV,lg,oV,nm,oV,kb,oV,jr,oV,dF,oV,dz,oV,h9,oV,gc,oV,ib,oV,hQ,oV,gM,oV,mc,oV,k9,oV,k1,oV,mK,oV,eO,oV,g3,oV,e5,oV,dq,oV,d2,oV,nE,oV,nM,oV,hU,oV,gN,oV,eG,oV,hH,oV,d0,oV,dE,oV,hZ,oV,fo,oV,nk,oV,d5,oV,hc,oV,nl,oV,hT,oV,gj,oV,lC,oV,eF,oV,h8,oV,kJ,oV,jF,oV,kn,oV,f_,oV,fk,oV,dD,oV,eY,oV,la,oV,hP,oV,ht,oV,hS,oV,dp,oV,nj,oV,jG,oV,nL,oV,lr,oV,fZ,oV,nG,oV,j8,oV,dx,oV,kU,oV,eH,oV,gU,oV,lX,oV,gz,oV,hN,oV,no,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV,oV];var cU=[oW,oW,mU,oW,dA,oW,kO,oW,kq,oW,fq,oW,mR,oW,kH,oW,mQ,oW,kw,oW,f$,oW,lp,oW,hv,oW,ki,oW,kR,oW,kE,oW,kh,oW,kM,oW,kf,oW,kP,oW,lD,oW,fn,oW,gd,oW,eW,oW,e6,oW,fw,oW,f6,oW,kS,oW,mT,oW,eP,oW,kr,oW,gy,oW,kB,oW,mV,oW,kG,oW,kt,oW,mS,oW,kv,oW,dG,oW,fe,oW,hh,oW,gk,oW,lu,oW,kl,oW,kk,oW,kg,oW,kC,oW,kD,oW,kN,oW,eI,oW,ks,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW,oW];var cV=[oX,oX,gn,oX,lS,oX,hE,oX,l0,oX,f9,oX,gg,oX,lO,oX,ea,oX,l_,oX,fi,oX,lY,oX,hs,oX,hG,oX,lQ,oX,fA,oX,d9,oX,fr,oX,hq,oX,f2,oX,e_,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX,oX];var cW=[oY,oY,ie,oY,lR,oY,nP,oY,ln,oY,lU,oY,ik,oY,gH,oY,hr,oY,hn,oY,lK,oY,lZ,oY,hw,oY,ls,oY,l2,oY,nT,oY,lP,oY,nO,oY,f1,oY,hB,oY,gI,oY,l$,oY,hi,oY,gf,oY,hF,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY,oY];var cX=[oZ,oZ,lh,oZ,lb,oZ,oZ,oZ];var cY=[o_,o_,m7,o_,eV,o_,fj,o_,ho,o_,l9,o_,mZ,o_,hp,o_,m5,o_,ko,o_,gl,o_,jH,o_,mX,o_,gm,o_,hD,o_,hC,o_,mB,o_,m1,o_,fd,o_,m$,o_,nF,o_,gB,o_,mP,o_,mM,o_,m0,o_,mN,o_,hl,o_,l8,o_,kQ,o_,m2,o_,f0,o_,kp,o_,mr,o_,fs,o_,fB,o_,kK,o_,mW,o_,f7,o_,fv,o_,mC,o_,oa,o_,h2,o_,kj,o_,f8,o_,e$,o_,mO,o_,hm,o_,hz,o_,ge,o_,mb,o_,ku,o_,m6,o_,mq,o_,mh,o_,fm,o_,hA,o_,kd,o_,mY,o_,ke,o_,gw,o_,kz,o_,mj,o_,kF,o_,kA,o_,m_,o_,kL,o_,mg,o_,jV,o_,d8,o_,m4,o_,m3,o_,mu,o_,ez,o_,mF,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_,o_];var cZ=[o$,o$,jM,o$,jW,o$,jY,o$,lk,o$,jz,o$,jx,o$,le,o$,jI,o$,jL,o$,jZ,o$,jl,o$,i5,o$,jK,o$,iV,o$,jX,o$,jj,o$,iZ,o$,iR,o$,iT,o$,iI,o$,iX,o$,iP,o$,iN,o$,i3,o$,i1,o$,i$,o$,j_,o$,iw,o$,jJ,o$,iA,o$,is,o$,iu,o$,iy,o$,iq,o$,iG,o$,iE,o$,iC,o$,io,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$,o$];var c_=[o0,o0,jC,o0,jA,o0,jp,o0,jm,o0,o0,o0,o0,o0,o0,o0];var c$=[o1,o1,fV,o1];var c0=[o2,o2,md,o2,mn,o2,ml,o2,my,o2,me,o2,mw,o2,l5,o2,l6,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2,o2];var c1=[o3,o3,j$,o3,jN,o3,o3,o3];var c2=[o4,o4,j9,o4,j6,o4,kV,o4,k3,o4,kZ,o4,k5,o4,o4,o4];var c3=[o5,o5,nY,o5,jy,o5,ju,o5,nZ,o5,jD,o5,lo,o5,hx,o5,jq,o5,jf,o5,jk,o5,jg,o5,d6,o5,jt,o5,n_,o5,hj,o5,lt,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5,o5];var c4=[o6,o6,lL,o6,lM,o6,l1,o6,lT,o6,lN,o6,o6,o6,o6,o6];var c5=[o7,o7,lV,o7,mp,o7,ii,o7,mD,o7,ms,o7,l3,o7,mf,o7,ic,o7,l7,o7,ma,o7,mA,o7,mi,o7,o7,o7,o7,o7,o7,o7];var c6=[o8,o8,dH,o8,d7,o8,fS,o8,nR,o8,nS,o8,eJ,o8,nQ,o8,hk,o8,ij,o8,hy,o8,id,o8,dB,o8,o8,o8,o8,o8,o8,o8];return{_memcmp:oj,_strlen:og,_free:n0,_main:dr,_realloc:n1,_memmove:oh,__GLOBAL__I_a:fW,_memset:of,_malloc:n$,_memcpy:oe,_llvm_ctlz_i32:oi,__GLOBAL__I_a95:gp,runPostSets:dn,stackAlloc:c7,stackSave:c8,stackRestore:c9,setThrew:da,setTempRet0:dd,setTempRet1:de,setTempRet2:df,setTempRet3:dg,setTempRet4:dh,setTempRet5:di,setTempRet6:dj,setTempRet7:dk,setTempRet8:dl,setTempRet9:dm,dynCall_viiiii:ox,dynCall_fii:oy,dynCall_dii:oz,dynCall_viii:oA,dynCall_vi:oB,dynCall_vii:oC,dynCall_iii:oD,dynCall_iiii:oE,dynCall_viiiiiid:oF,dynCall_ii:oG,dynCall_viiiiiii:oH,dynCall_viiiiid:oI,dynCall_v:oJ,dynCall_iiiiiiiii:oK,dynCall_viiiiiiiii:oL,dynCall_viiiiiiii:oM,dynCall_viiiiii:oN,dynCall_iiiii:oO,dynCall_iiiiii:oP,dynCall_viiii:oQ}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_fii": invoke_fii, "invoke_dii": invoke_dii, "invoke_viii": invoke_viii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "invoke_iiii": invoke_iiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "_glFlush": _glFlush, "_glClearColor": _glClearColor, "_sysconf": _sysconf, "__scanString": __scanString, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_glLinkProgram": _glLinkProgram, "_strtoull": _strtoull, "_fflush": _fflush, "_isxdigit": _isxdigit, "__isLeapYear": __isLeapYear, "_glGetString": _glGetString, "_glDetachShader": _glDetachShader, "_llvm_eh_exception": _llvm_eh_exception, "_exit": _exit, "_glCompileShader": _glCompileShader, "_isspace": _isspace, "_glutInit": _glutInit, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "___resumeException": ___resumeException, "_glCreateShader": _glCreateShader, "_snprintf": _snprintf, "_glGetActiveAttrib": _glGetActiveAttrib, "_cosf": _cosf, "_vsscanf": _vsscanf, "_glutTimerFunc": _glutTimerFunc, "_fgetc": _fgetc, "_glGetProgramiv": _glGetProgramiv, "_glVertexAttribPointer": _glVertexAttribPointer, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_glGetUniformLocation": _glGetUniformLocation, "_glCullFace": _glCullFace, "_glUniform4fv": _glUniform4fv, "___setErrNo": ___setErrNo, "_glutDisplayFunc": _glutDisplayFunc, "_glDrawArrays": _glDrawArrays, "_glDeleteProgram": _glDeleteProgram, "_glutInitDisplayMode": _glutInitDisplayMode, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_glAttachShader": _glAttachShader, "_catgets": _catgets, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "_glGetProgramInfoLog": _glGetProgramInfoLog, "___cxa_begin_catch": ___cxa_begin_catch, "_sinf": _sinf, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_call_unexpected": ___cxa_call_unexpected, "_glUniform3fv": _glUniform3fv, "_fwrite": _fwrite, "_glGetShaderiv": _glGetShaderiv, "__exit": __exit, "_strftime": _strftime, "_llvm_va_end": _llvm_va_end, "___cxa_throw": ___cxa_throw, "_send": _send, "_glShaderSource": _glShaderSource, "_pread": _pread, "_sqrtf": _sqrtf, "__arraySum": __arraySum, "_glDisable": _glDisable, "_glClear": _glClear, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "_glutReshapeWindow": _glutReshapeWindow, "_glutSpecialFunc": _glutSpecialFunc, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_glutMouseFunc": _glutMouseFunc, "_glutInitWindowSize": _glutInitWindowSize, "_glBindBuffer": _glBindBuffer, "_glutCreateWindow": _glutCreateWindow, "_glBufferData": _glBufferData, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_gettimeofday": _gettimeofday, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_sbrk": _sbrk, "_tanf": _tanf, "___errno_location": ___errno_location, "_strerror": _strerror, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "_time": _time, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_glUseProgram": _glUseProgram, "_sscanf": _sscanf, "___assert_fail": ___assert_fail, "_fread": _fread, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_abort": _abort, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "_glEnable": _glEnable, "__reallyNegative": __reallyNegative, "_glutPostRedisplay": _glutPostRedisplay, "_write": _write, "_read": _read, "_glGenBuffers": _glGenBuffers, "_glGetAttribLocation": _glGetAttribLocation, "___cxa_allocate_exception": ___cxa_allocate_exception, "_glDeleteShader": _glDeleteShader, "_glBlendFunc": _glBlendFunc, "_glCreateProgram": _glCreateProgram, "_ceilf": _ceilf, "_vasprintf": _vasprintf, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_glUniformMatrix4fv": _glUniformMatrix4fv, "_glGetActiveUniform": _glGetActiveUniform, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_glFrontFace": _glFrontFace, "_exp": _exp, "_glutMainLoop": _glutMainLoop, "_glutKeyboardFunc": _glutKeyboardFunc, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTIc": __ZTIc, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "___fsmu8": ___fsmu8, "_stdout": _stdout, "__ZTVN10__cxxabiv119__pointer_type_infoE": __ZTVN10__cxxabiv119__pointer_type_infoE, "___dso_handle": ___dso_handle }, buffer);
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _llvm_ctlz_i32 = Module["_llvm_ctlz_i32"] = asm["_llvm_ctlz_i32"];
var __GLOBAL__I_a95 = Module["__GLOBAL__I_a95"] = asm["__GLOBAL__I_a95"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_fii = Module["dynCall_fii"] = asm["dynCall_fii"];
var dynCall_dii = Module["dynCall_dii"] = asm["dynCall_dii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
