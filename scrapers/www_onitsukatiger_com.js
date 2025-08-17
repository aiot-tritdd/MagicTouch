(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Soraya = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
var isCallable = require('../internals/is-callable');
var tryToString = require('../internals/try-to-string');

var $TypeError = TypeError;

// `Assert: IsCallable(argument) is true`
module.exports = function (argument) {
  if (isCallable(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a function');
};

},{"../internals/is-callable":64,"../internals/try-to-string":130}],2:[function(require,module,exports){
'use strict';
var isConstructor = require('../internals/is-constructor');
var tryToString = require('../internals/try-to-string');

var $TypeError = TypeError;

// `Assert: IsConstructor(argument) is true`
module.exports = function (argument) {
  if (isConstructor(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a constructor');
};

},{"../internals/is-constructor":65,"../internals/try-to-string":130}],3:[function(require,module,exports){
'use strict';
var isPossiblePrototype = require('../internals/is-possible-prototype');

var $String = String;
var $TypeError = TypeError;

module.exports = function (argument) {
  if (isPossiblePrototype(argument)) return argument;
  throw new $TypeError("Can't set " + $String(argument) + ' as a prototype');
};

},{"../internals/is-possible-prototype":69}],4:[function(require,module,exports){
'use strict';
var wellKnownSymbol = require('../internals/well-known-symbol');
var create = require('../internals/object-create');
var defineProperty = require('../internals/object-define-property').f;

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] === undefined) {
  defineProperty(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
}

// add a key to Array.prototype[@@unscopables]
module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

},{"../internals/object-create":83,"../internals/object-define-property":85,"../internals/well-known-symbol":138}],5:[function(require,module,exports){
'use strict';
var isPrototypeOf = require('../internals/object-is-prototype-of');

var $TypeError = TypeError;

module.exports = function (it, Prototype) {
  if (isPrototypeOf(Prototype, it)) return it;
  throw new $TypeError('Incorrect invocation');
};

},{"../internals/object-is-prototype-of":91}],6:[function(require,module,exports){
'use strict';
var isObject = require('../internals/is-object');

var $String = String;
var $TypeError = TypeError;

// `Assert: Type(argument) is Object`
module.exports = function (argument) {
  if (isObject(argument)) return argument;
  throw new $TypeError($String(argument) + ' is not an object');
};

},{"../internals/is-object":68}],7:[function(require,module,exports){
'use strict';
var toIndexedObject = require('../internals/to-indexed-object');
var toAbsoluteIndex = require('../internals/to-absolute-index');
var lengthOfArrayLike = require('../internals/length-of-array-like');

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = lengthOfArrayLike(O);
    if (length === 0) return !IS_INCLUDES && -1;
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el !== el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value !== value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

},{"../internals/length-of-array-like":78,"../internals/to-absolute-index":121,"../internals/to-indexed-object":122}],8:[function(require,module,exports){
'use strict';
var bind = require('../internals/function-bind-context');
var uncurryThis = require('../internals/function-uncurry-this');
var IndexedObject = require('../internals/indexed-object');
var toObject = require('../internals/to-object');
var lengthOfArrayLike = require('../internals/length-of-array-like');
var arraySpeciesCreate = require('../internals/array-species-create');

var push = uncurryThis([].push);

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
var createMethod = function (TYPE) {
  var IS_MAP = TYPE === 1;
  var IS_FILTER = TYPE === 2;
  var IS_SOME = TYPE === 3;
  var IS_EVERY = TYPE === 4;
  var IS_FIND_INDEX = TYPE === 6;
  var IS_FILTER_REJECT = TYPE === 7;
  var NO_HOLES = TYPE === 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = IndexedObject(O);
    var length = lengthOfArrayLike(self);
    var boundFunction = bind(callbackfn, that);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push(target, value);      // filter
        } else switch (TYPE) {
          case 4: return false;             // every
          case 7: push(target, value);      // filterReject
        }
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

module.exports = {
  // `Array.prototype.forEach` method
  // https://tc39.es/ecma262/#sec-array.prototype.foreach
  forEach: createMethod(0),
  // `Array.prototype.map` method
  // https://tc39.es/ecma262/#sec-array.prototype.map
  map: createMethod(1),
  // `Array.prototype.filter` method
  // https://tc39.es/ecma262/#sec-array.prototype.filter
  filter: createMethod(2),
  // `Array.prototype.some` method
  // https://tc39.es/ecma262/#sec-array.prototype.some
  some: createMethod(3),
  // `Array.prototype.every` method
  // https://tc39.es/ecma262/#sec-array.prototype.every
  every: createMethod(4),
  // `Array.prototype.find` method
  // https://tc39.es/ecma262/#sec-array.prototype.find
  find: createMethod(5),
  // `Array.prototype.findIndex` method
  // https://tc39.es/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod(6),
  // `Array.prototype.filterReject` method
  // https://github.com/tc39/proposal-array-filtering
  filterReject: createMethod(7)
};

},{"../internals/array-species-create":11,"../internals/function-bind-context":40,"../internals/function-uncurry-this":46,"../internals/indexed-object":58,"../internals/length-of-array-like":78,"../internals/to-object":125}],9:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

module.exports = uncurryThis([].slice);

},{"../internals/function-uncurry-this":46}],10:[function(require,module,exports){
'use strict';
var isArray = require('../internals/is-array');
var isConstructor = require('../internals/is-constructor');
var isObject = require('../internals/is-object');
var wellKnownSymbol = require('../internals/well-known-symbol');

var SPECIES = wellKnownSymbol('species');
var $Array = Array;

// a part of `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (isConstructor(C) && (C === $Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? $Array : C;
};

},{"../internals/is-array":63,"../internals/is-constructor":65,"../internals/is-object":68,"../internals/well-known-symbol":138}],11:[function(require,module,exports){
'use strict';
var arraySpeciesConstructor = require('../internals/array-species-constructor');

// `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray, length) {
  return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
};

},{"../internals/array-species-constructor":10}],12:[function(require,module,exports){
'use strict';
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  try {
    if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  } catch (error) { return false; } // workaround of old WebKit + `eval` bug
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

},{"../internals/well-known-symbol":138}],13:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

var toString = uncurryThis({}.toString);
var stringSlice = uncurryThis(''.slice);

module.exports = function (it) {
  return stringSlice(toString(it), 8, -1);
};

},{"../internals/function-uncurry-this":46}],14:[function(require,module,exports){
'use strict';
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var isCallable = require('../internals/is-callable');
var classofRaw = require('../internals/classof-raw');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Object = Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) === 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = $Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) === 'Object' && isCallable(O.callee) ? 'Arguments' : result;
};

},{"../internals/classof-raw":13,"../internals/is-callable":64,"../internals/to-string-tag-support":128,"../internals/well-known-symbol":138}],15:[function(require,module,exports){
'use strict';
var hasOwn = require('../internals/has-own-property');
var ownKeys = require('../internals/own-keys');
var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');
var definePropertyModule = require('../internals/object-define-property');

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};

},{"../internals/has-own-property":53,"../internals/object-define-property":85,"../internals/object-get-own-property-descriptor":86,"../internals/own-keys":98}],16:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

},{"../internals/fails":38}],17:[function(require,module,exports){
'use strict';
// `CreateIterResultObject` abstract operation
// https://tc39.es/ecma262/#sec-createiterresultobject
module.exports = function (value, done) {
  return { value: value, done: done };
};

},{}],18:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"../internals/create-property-descriptor":19,"../internals/descriptors":24,"../internals/object-define-property":85}],19:[function(require,module,exports){
'use strict';
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],20:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');
var ordinaryToPrimitive = require('../internals/ordinary-to-primitive');

var $TypeError = TypeError;

// `Date.prototype[@@toPrimitive](hint)` method implementation
// https://tc39.es/ecma262/#sec-date.prototype-@@toprimitive
module.exports = function (hint) {
  anObject(this);
  if (hint === 'string' || hint === 'default') hint = 'string';
  else if (hint !== 'number') throw new $TypeError('Incorrect hint');
  return ordinaryToPrimitive(this, hint);
};

},{"../internals/an-object":6,"../internals/ordinary-to-primitive":97}],21:[function(require,module,exports){
'use strict';
var makeBuiltIn = require('../internals/make-built-in');
var defineProperty = require('../internals/object-define-property');

module.exports = function (target, name, descriptor) {
  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
  return defineProperty.f(target, name, descriptor);
};

},{"../internals/make-built-in":79,"../internals/object-define-property":85}],22:[function(require,module,exports){
'use strict';
var isCallable = require('../internals/is-callable');
var definePropertyModule = require('../internals/object-define-property');
var makeBuiltIn = require('../internals/make-built-in');
var defineGlobalProperty = require('../internals/define-global-property');

module.exports = function (O, key, value, options) {
  if (!options) options = {};
  var simple = options.enumerable;
  var name = options.name !== undefined ? options.name : key;
  if (isCallable(value)) makeBuiltIn(value, name, options);
  if (options.global) {
    if (simple) O[key] = value;
    else defineGlobalProperty(key, value);
  } else {
    try {
      if (!options.unsafe) delete O[key];
      else if (O[key]) simple = true;
    } catch (error) { /* empty */ }
    if (simple) O[key] = value;
    else definePropertyModule.f(O, key, {
      value: value,
      enumerable: false,
      configurable: !options.nonConfigurable,
      writable: !options.nonWritable
    });
  } return O;
};

},{"../internals/define-global-property":23,"../internals/is-callable":64,"../internals/make-built-in":79,"../internals/object-define-property":85}],23:[function(require,module,exports){
'use strict';
var global = require('../internals/global');

// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(global, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    global[key] = value;
  } return value;
};

},{"../internals/global":52}],24:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] !== 7;
});

},{"../internals/fails":38}],25:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var isObject = require('../internals/is-object');

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

},{"../internals/global":52,"../internals/is-object":68}],26:[function(require,module,exports){
'use strict';
// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

},{}],27:[function(require,module,exports){
'use strict';
// in old WebKit versions, `element.classList` is not an instance of global `DOMTokenList`
var documentCreateElement = require('../internals/document-create-element');

var classList = documentCreateElement('span').classList;
var DOMTokenListPrototype = classList && classList.constructor && classList.constructor.prototype;

module.exports = DOMTokenListPrototype === Object.prototype ? undefined : DOMTokenListPrototype;

},{"../internals/document-create-element":25}],28:[function(require,module,exports){
'use strict';
var IS_DENO = require('../internals/engine-is-deno');
var IS_NODE = require('../internals/engine-is-node');

module.exports = !IS_DENO && !IS_NODE
  && typeof window == 'object'
  && typeof document == 'object';

},{"../internals/engine-is-deno":29,"../internals/engine-is-node":32}],29:[function(require,module,exports){
'use strict';
/* global Deno -- Deno case */
module.exports = typeof Deno == 'object' && Deno && typeof Deno.version == 'object';

},{}],30:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/engine-user-agent');

module.exports = /ipad|iphone|ipod/i.test(userAgent) && typeof Pebble != 'undefined';

},{"../internals/engine-user-agent":34}],31:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/engine-user-agent');

// eslint-disable-next-line redos/no-vulnerable -- safe
module.exports = /(?:ipad|iphone|ipod).*applewebkit/i.test(userAgent);

},{"../internals/engine-user-agent":34}],32:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var classof = require('../internals/classof-raw');

module.exports = classof(global.process) === 'process';

},{"../internals/classof-raw":13,"../internals/global":52}],33:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/engine-user-agent');

module.exports = /web0s(?!.*chrome)/i.test(userAgent);

},{"../internals/engine-user-agent":34}],34:[function(require,module,exports){
'use strict';
module.exports = typeof navigator != 'undefined' && String(navigator.userAgent) || '';

},{}],35:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var userAgent = require('../internals/engine-user-agent');

var process = global.process;
var Deno = global.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;

},{"../internals/engine-user-agent":34,"../internals/global":52}],36:[function(require,module,exports){
'use strict';
// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

},{}],37:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var defineBuiltIn = require('../internals/define-built-in');
var defineGlobalProperty = require('../internals/define-global-property');
var copyConstructorProperties = require('../internals/copy-constructor-properties');
var isForced = require('../internals/is-forced');

/*
  options.target         - name of the target object
  options.global         - target is the global object
  options.stat           - export as static methods of target
  options.proto          - export as prototype methods of target
  options.real           - real prototype method for the `pure` version
  options.forced         - export even if the native feature is available
  options.bind           - bind methods to the target, required for the `pure` version
  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
  options.sham           - add a flag to not completely full polyfills
  options.enumerable     - export as enumerable property
  options.dontCallGetSet - prevent calling a getter on target
  options.name           - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || defineGlobalProperty(TARGET, {});
  } else {
    target = global[TARGET] && global[TARGET].prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.dontCallGetSet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};

},{"../internals/copy-constructor-properties":15,"../internals/create-non-enumerable-property":18,"../internals/define-built-in":22,"../internals/define-global-property":23,"../internals/global":52,"../internals/is-forced":66,"../internals/object-get-own-property-descriptor":86}],38:[function(require,module,exports){
'use strict';
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

},{}],39:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});

},{"../internals/function-bind-native":41}],40:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this-clause');
var aCallable = require('../internals/a-callable');
var NATIVE_BIND = require('../internals/function-bind-native');

var bind = uncurryThis(uncurryThis.bind);

// optional / simple context binding
module.exports = function (fn, that) {
  aCallable(fn);
  return that === undefined ? fn : NATIVE_BIND ? bind(fn, that) : function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"../internals/a-callable":1,"../internals/function-bind-native":41,"../internals/function-uncurry-this-clause":45}],41:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});

},{"../internals/fails":38}],42:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var call = Function.prototype.call;

module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};

},{"../internals/function-bind-native":41}],43:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var hasOwn = require('../internals/has-own-property');

var FunctionPrototype = Function.prototype;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn(FunctionPrototype, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

module.exports = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};

},{"../internals/descriptors":24,"../internals/has-own-property":53}],44:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var aCallable = require('../internals/a-callable');

module.exports = function (object, key, method) {
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    return uncurryThis(aCallable(Object.getOwnPropertyDescriptor(object, key)[method]));
  } catch (error) { /* empty */ }
};

},{"../internals/a-callable":1,"../internals/function-uncurry-this":46}],45:[function(require,module,exports){
'use strict';
var classofRaw = require('../internals/classof-raw');
var uncurryThis = require('../internals/function-uncurry-this');

module.exports = function (fn) {
  // Nashorn bug:
  //   https://github.com/zloirock/core-js/issues/1128
  //   https://github.com/zloirock/core-js/issues/1130
  if (classofRaw(fn) === 'Function') return uncurryThis(fn);
};

},{"../internals/classof-raw":13,"../internals/function-uncurry-this":46}],46:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var FunctionPrototype = Function.prototype;
var call = FunctionPrototype.call;
var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
  return function () {
    return call.apply(fn, arguments);
  };
};

},{"../internals/function-bind-native":41}],47:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var isCallable = require('../internals/is-callable');

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(global[namespace]) : global[namespace] && global[namespace][method];
};

},{"../internals/global":52,"../internals/is-callable":64}],48:[function(require,module,exports){
'use strict';
var classof = require('../internals/classof');
var getMethod = require('../internals/get-method');
var isNullOrUndefined = require('../internals/is-null-or-undefined');
var Iterators = require('../internals/iterators');
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (!isNullOrUndefined(it)) return getMethod(it, ITERATOR)
    || getMethod(it, '@@iterator')
    || Iterators[classof(it)];
};

},{"../internals/classof":14,"../internals/get-method":51,"../internals/is-null-or-undefined":67,"../internals/iterators":77,"../internals/well-known-symbol":138}],49:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var aCallable = require('../internals/a-callable');
var anObject = require('../internals/an-object');
var tryToString = require('../internals/try-to-string');
var getIteratorMethod = require('../internals/get-iterator-method');

var $TypeError = TypeError;

module.exports = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
  throw new $TypeError(tryToString(argument) + ' is not iterable');
};

},{"../internals/a-callable":1,"../internals/an-object":6,"../internals/function-call":42,"../internals/get-iterator-method":48,"../internals/try-to-string":130}],50:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var isArray = require('../internals/is-array');
var isCallable = require('../internals/is-callable');
var classof = require('../internals/classof-raw');
var toString = require('../internals/to-string');

var push = uncurryThis([].push);

module.exports = function (replacer) {
  if (isCallable(replacer)) return replacer;
  if (!isArray(replacer)) return;
  var rawLength = replacer.length;
  var keys = [];
  for (var i = 0; i < rawLength; i++) {
    var element = replacer[i];
    if (typeof element == 'string') push(keys, element);
    else if (typeof element == 'number' || classof(element) === 'Number' || classof(element) === 'String') push(keys, toString(element));
  }
  var keysLength = keys.length;
  var root = true;
  return function (key, value) {
    if (root) {
      root = false;
      return value;
    }
    if (isArray(this)) return value;
    for (var j = 0; j < keysLength; j++) if (keys[j] === key) return value;
  };
};

},{"../internals/classof-raw":13,"../internals/function-uncurry-this":46,"../internals/is-array":63,"../internals/is-callable":64,"../internals/to-string":129}],51:[function(require,module,exports){
'use strict';
var aCallable = require('../internals/a-callable');
var isNullOrUndefined = require('../internals/is-null-or-undefined');

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
module.exports = function (V, P) {
  var func = V[P];
  return isNullOrUndefined(func) ? undefined : aCallable(func);
};

},{"../internals/a-callable":1,"../internals/is-null-or-undefined":67}],52:[function(require,module,exports){
(function (global){(function (){
'use strict';
var check = function (it) {
  return it && it.Math === Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof global == 'object' && global) ||
  check(typeof this == 'object' && this) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],53:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var toObject = require('../internals/to-object');

var hasOwnProperty = uncurryThis({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es/no-object-hasown -- safe
module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject(it), key);
};

},{"../internals/function-uncurry-this":46,"../internals/to-object":125}],54:[function(require,module,exports){
'use strict';
module.exports = {};

},{}],55:[function(require,module,exports){
'use strict';
module.exports = function (a, b) {
  try {
    // eslint-disable-next-line no-console -- safe
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  } catch (error) { /* empty */ }
};

},{}],56:[function(require,module,exports){
'use strict';
var getBuiltIn = require('../internals/get-built-in');

module.exports = getBuiltIn('document', 'documentElement');

},{"../internals/get-built-in":47}],57:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var fails = require('../internals/fails');
var createElement = require('../internals/document-create-element');

// Thanks to IE8 for its funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a !== 7;
});

},{"../internals/descriptors":24,"../internals/document-create-element":25,"../internals/fails":38}],58:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var fails = require('../internals/fails');
var classof = require('../internals/classof-raw');

var $Object = Object;
var split = uncurryThis(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !$Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) === 'String' ? split(it, '') : $Object(it);
} : $Object;

},{"../internals/classof-raw":13,"../internals/fails":38,"../internals/function-uncurry-this":46}],59:[function(require,module,exports){
'use strict';
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var setPrototypeOf = require('../internals/object-set-prototype-of');

// makes subclassing work correct for wrapped built-ins
module.exports = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    setPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    isCallable(NewTarget = dummy.constructor) &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) setPrototypeOf($this, NewTargetPrototype);
  return $this;
};

},{"../internals/is-callable":64,"../internals/is-object":68,"../internals/object-set-prototype-of":95}],60:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var isCallable = require('../internals/is-callable');
var store = require('../internals/shared-store');

var functionToString = uncurryThis(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable(store.inspectSource)) {
  store.inspectSource = function (it) {
    return functionToString(it);
  };
}

module.exports = store.inspectSource;

},{"../internals/function-uncurry-this":46,"../internals/is-callable":64,"../internals/shared-store":111}],61:[function(require,module,exports){
'use strict';
var NATIVE_WEAK_MAP = require('../internals/weak-map-basic-detection');
var global = require('../internals/global');
var isObject = require('../internals/is-object');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var hasOwn = require('../internals/has-own-property');
var shared = require('../internals/shared-store');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = global.TypeError;
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  /* eslint-disable no-self-assign -- prototype methods protection */
  store.get = store.get;
  store.has = store.has;
  store.set = store.set;
  /* eslint-enable no-self-assign -- prototype methods protection */
  set = function (it, metadata) {
    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    store.set(it, metadata);
    return metadata;
  };
  get = function (it) {
    return store.get(it) || {};
  };
  has = function (it) {
    return store.has(it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/create-non-enumerable-property":18,"../internals/global":52,"../internals/has-own-property":53,"../internals/hidden-keys":54,"../internals/is-object":68,"../internals/shared-key":110,"../internals/shared-store":111,"../internals/weak-map-basic-detection":135}],62:[function(require,module,exports){
'use strict';
var wellKnownSymbol = require('../internals/well-known-symbol');
var Iterators = require('../internals/iterators');

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};

},{"../internals/iterators":77,"../internals/well-known-symbol":138}],63:[function(require,module,exports){
'use strict';
var classof = require('../internals/classof-raw');

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe
module.exports = Array.isArray || function isArray(argument) {
  return classof(argument) === 'Array';
};

},{"../internals/classof-raw":13}],64:[function(require,module,exports){
'use strict';
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
var documentAll = typeof document == 'object' && document.all;

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
// eslint-disable-next-line unicorn/no-typeof-undefined -- required for testing
module.exports = typeof documentAll == 'undefined' && documentAll !== undefined ? function (argument) {
  return typeof argument == 'function' || argument === documentAll;
} : function (argument) {
  return typeof argument == 'function';
};

},{}],65:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');
var classof = require('../internals/classof');
var getBuiltIn = require('../internals/get-built-in');
var inspectSource = require('../internals/inspect-source');

var noop = function () { /* empty */ };
var construct = getBuiltIn('Reflect', 'construct');
var constructorRegExp = /^\s*(?:class|function)\b/;
var exec = uncurryThis(constructorRegExp.exec);
var INCORRECT_TO_STRING = !constructorRegExp.test(noop);

var isConstructorModern = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  try {
    construct(noop, [], argument);
    return true;
  } catch (error) {
    return false;
  }
};

var isConstructorLegacy = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  switch (classof(argument)) {
    case 'AsyncFunction':
    case 'GeneratorFunction':
    case 'AsyncGeneratorFunction': return false;
  }
  try {
    // we can't check .prototype since constructors produced by .bind haven't it
    // `Function#toString` throws on some built-it function in some legacy engines
    // (for example, `DOMQuad` and similar in FF41-)
    return INCORRECT_TO_STRING || !!exec(constructorRegExp, inspectSource(argument));
  } catch (error) {
    return true;
  }
};

isConstructorLegacy.sham = true;

// `IsConstructor` abstract operation
// https://tc39.es/ecma262/#sec-isconstructor
module.exports = !construct || fails(function () {
  var called;
  return isConstructorModern(isConstructorModern.call)
    || !isConstructorModern(Object)
    || !isConstructorModern(function () { called = true; })
    || called;
}) ? isConstructorLegacy : isConstructorModern;

},{"../internals/classof":14,"../internals/fails":38,"../internals/function-uncurry-this":46,"../internals/get-built-in":47,"../internals/inspect-source":60,"../internals/is-callable":64}],66:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value === POLYFILL ? true
    : value === NATIVE ? false
    : isCallable(detection) ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;

},{"../internals/fails":38,"../internals/is-callable":64}],67:[function(require,module,exports){
'use strict';
// we can't use just `it == null` since of `document.all` special case
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
module.exports = function (it) {
  return it === null || it === undefined;
};

},{}],68:[function(require,module,exports){
'use strict';
var isCallable = require('../internals/is-callable');

module.exports = function (it) {
  return typeof it == 'object' ? it !== null : isCallable(it);
};

},{"../internals/is-callable":64}],69:[function(require,module,exports){
'use strict';
var isObject = require('../internals/is-object');

module.exports = function (argument) {
  return isObject(argument) || argument === null;
};

},{"../internals/is-object":68}],70:[function(require,module,exports){
'use strict';
module.exports = false;

},{}],71:[function(require,module,exports){
'use strict';
var getBuiltIn = require('../internals/get-built-in');
var isCallable = require('../internals/is-callable');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var USE_SYMBOL_AS_UID = require('../internals/use-symbol-as-uid');

var $Object = Object;

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
};

},{"../internals/get-built-in":47,"../internals/is-callable":64,"../internals/object-is-prototype-of":91,"../internals/use-symbol-as-uid":132}],72:[function(require,module,exports){
'use strict';
var bind = require('../internals/function-bind-context');
var call = require('../internals/function-call');
var anObject = require('../internals/an-object');
var tryToString = require('../internals/try-to-string');
var isArrayIteratorMethod = require('../internals/is-array-iterator-method');
var lengthOfArrayLike = require('../internals/length-of-array-like');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var getIterator = require('../internals/get-iterator');
var getIteratorMethod = require('../internals/get-iterator-method');
var iteratorClose = require('../internals/iterator-close');

var $TypeError = TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_RECORD = !!(options && options.IS_RECORD);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_RECORD) {
    iterator = iterable.iterator;
  } else if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = IS_RECORD ? iterable.next : iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};

},{"../internals/an-object":6,"../internals/function-bind-context":40,"../internals/function-call":42,"../internals/get-iterator":49,"../internals/get-iterator-method":48,"../internals/is-array-iterator-method":62,"../internals/iterator-close":73,"../internals/length-of-array-like":78,"../internals/object-is-prototype-of":91,"../internals/try-to-string":130}],73:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var anObject = require('../internals/an-object');
var getMethod = require('../internals/get-method');

module.exports = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
  anObject(innerResult);
  return value;
};

},{"../internals/an-object":6,"../internals/function-call":42,"../internals/get-method":51}],74:[function(require,module,exports){
'use strict';
var IteratorPrototype = require('../internals/iterators-core').IteratorPrototype;
var create = require('../internals/object-create');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var setToStringTag = require('../internals/set-to-string-tag');
var Iterators = require('../internals/iterators');

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next, ENUMERABLE_NEXT) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(+!ENUMERABLE_NEXT, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};

},{"../internals/create-property-descriptor":19,"../internals/iterators":77,"../internals/iterators-core":76,"../internals/object-create":83,"../internals/set-to-string-tag":109}],75:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var call = require('../internals/function-call');
var IS_PURE = require('../internals/is-pure');
var FunctionName = require('../internals/function-name');
var isCallable = require('../internals/is-callable');
var createIteratorConstructor = require('../internals/iterator-create-constructor');
var getPrototypeOf = require('../internals/object-get-prototype-of');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var setToStringTag = require('../internals/set-to-string-tag');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var defineBuiltIn = require('../internals/define-built-in');
var wellKnownSymbol = require('../internals/well-known-symbol');
var Iterators = require('../internals/iterators');
var IteratorsCore = require('../internals/iterators-core');

var PROPER_FUNCTION_NAME = FunctionName.PROPER;
var CONFIGURABLE_FUNCTION_NAME = FunctionName.CONFIGURABLE;
var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND && KIND in IterablePrototype) return IterablePrototype[KIND];

    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    }

    return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME === 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (CurrentIteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (!isCallable(CurrentIteratorPrototype[ITERATOR])) {
          defineBuiltIn(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (PROPER_FUNCTION_NAME && DEFAULT === VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    if (!IS_PURE && CONFIGURABLE_FUNCTION_NAME) {
      createNonEnumerableProperty(IterablePrototype, 'name', VALUES);
    } else {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return call(nativeIterator, this); };
    }
  }

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        defineBuiltIn(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    defineBuiltIn(IterablePrototype, ITERATOR, defaultIterator, { name: DEFAULT });
  }
  Iterators[NAME] = defaultIterator;

  return methods;
};

},{"../internals/create-non-enumerable-property":18,"../internals/define-built-in":22,"../internals/export":37,"../internals/function-call":42,"../internals/function-name":43,"../internals/is-callable":64,"../internals/is-pure":70,"../internals/iterator-create-constructor":74,"../internals/iterators":77,"../internals/iterators-core":76,"../internals/object-get-prototype-of":90,"../internals/object-set-prototype-of":95,"../internals/set-to-string-tag":109,"../internals/well-known-symbol":138}],76:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var create = require('../internals/object-create');
var getPrototypeOf = require('../internals/object-get-prototype-of');
var defineBuiltIn = require('../internals/define-built-in');
var wellKnownSymbol = require('../internals/well-known-symbol');
var IS_PURE = require('../internals/is-pure');

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = !isObject(IteratorPrototype) || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};
else if (IS_PURE) IteratorPrototype = create(IteratorPrototype);

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if (!isCallable(IteratorPrototype[ITERATOR])) {
  defineBuiltIn(IteratorPrototype, ITERATOR, function () {
    return this;
  });
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

},{"../internals/define-built-in":22,"../internals/fails":38,"../internals/is-callable":64,"../internals/is-object":68,"../internals/is-pure":70,"../internals/object-create":83,"../internals/object-get-prototype-of":90,"../internals/well-known-symbol":138}],77:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],78:[function(require,module,exports){
'use strict';
var toLength = require('../internals/to-length');

// `LengthOfArrayLike` abstract operation
// https://tc39.es/ecma262/#sec-lengthofarraylike
module.exports = function (obj) {
  return toLength(obj.length);
};

},{"../internals/to-length":124}],79:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');
var hasOwn = require('../internals/has-own-property');
var DESCRIPTORS = require('../internals/descriptors');
var CONFIGURABLE_FUNCTION_NAME = require('../internals/function-name').CONFIGURABLE;
var inspectSource = require('../internals/inspect-source');
var InternalStateModule = require('../internals/internal-state');

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
var $String = String;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;
var stringSlice = uncurryThis(''.slice);
var replace = uncurryThis(''.replace);
var join = uncurryThis([].join);

var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function () {
  return defineProperty(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
});

var TEMPLATE = String(String).split('String');

var makeBuiltIn = module.exports = function (value, name, options) {
  if (stringSlice($String(name), 0, 7) === 'Symbol(') {
    name = '[' + replace($String(name), /^Symbol\(([^)]*)\).*$/, '$1') + ']';
  }
  if (options && options.getter) name = 'get ' + name;
  if (options && options.setter) name = 'set ' + name;
  if (!hasOwn(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
    if (DESCRIPTORS) defineProperty(value, 'name', { value: name, configurable: true });
    else value.name = name;
  }
  if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) {
    defineProperty(value, 'length', { value: options.arity });
  }
  try {
    if (options && hasOwn(options, 'constructor') && options.constructor) {
      if (DESCRIPTORS) defineProperty(value, 'prototype', { writable: false });
    // in V8 ~ Chrome 53, prototypes of some methods, like `Array.prototype.values`, are non-writable
    } else if (value.prototype) value.prototype = undefined;
  } catch (error) { /* empty */ }
  var state = enforceInternalState(value);
  if (!hasOwn(state, 'source')) {
    state.source = join(TEMPLATE, typeof name == 'string' ? name : '');
  } return value;
};

// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
// eslint-disable-next-line no-extend-native -- required
Function.prototype.toString = makeBuiltIn(function toString() {
  return isCallable(this) && getInternalState(this).source || inspectSource(this);
}, 'toString');

},{"../internals/descriptors":24,"../internals/fails":38,"../internals/function-name":43,"../internals/function-uncurry-this":46,"../internals/has-own-property":53,"../internals/inspect-source":60,"../internals/internal-state":61,"../internals/is-callable":64}],80:[function(require,module,exports){
'use strict';
var ceil = Math.ceil;
var floor = Math.floor;

// `Math.trunc` method
// https://tc39.es/ecma262/#sec-math.trunc
// eslint-disable-next-line es/no-math-trunc -- safe
module.exports = Math.trunc || function trunc(x) {
  var n = +x;
  return (n > 0 ? floor : ceil)(n);
};

},{}],81:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var safeGetBuiltIn = require('../internals/safe-get-built-in');
var bind = require('../internals/function-bind-context');
var macrotask = require('../internals/task').set;
var Queue = require('../internals/queue');
var IS_IOS = require('../internals/engine-is-ios');
var IS_IOS_PEBBLE = require('../internals/engine-is-ios-pebble');
var IS_WEBOS_WEBKIT = require('../internals/engine-is-webos-webkit');
var IS_NODE = require('../internals/engine-is-node');

var MutationObserver = global.MutationObserver || global.WebKitMutationObserver;
var document = global.document;
var process = global.process;
var Promise = global.Promise;
var microtask = safeGetBuiltIn('queueMicrotask');
var notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!microtask) {
  var queue = new Queue();

  var flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (fn = queue.get()) try {
      fn();
    } catch (error) {
      if (queue.head) notify();
      throw error;
    }
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (!IS_IOS_PEBBLE && Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = bind(promise.then, promise);
    notify = function () {
      then(flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessage
  // - onreadystatechange
  // - setTimeout
  } else {
    // `webpack` dev server bug on IE global methods - use bind(fn, global)
    macrotask = bind(macrotask, global);
    notify = function () {
      macrotask(flush);
    };
  }

  microtask = function (fn) {
    if (!queue.head) notify();
    queue.add(fn);
  };
}

module.exports = microtask;

},{"../internals/engine-is-ios":31,"../internals/engine-is-ios-pebble":30,"../internals/engine-is-node":32,"../internals/engine-is-webos-webkit":33,"../internals/function-bind-context":40,"../internals/global":52,"../internals/queue":105,"../internals/safe-get-built-in":107,"../internals/task":119}],82:[function(require,module,exports){
'use strict';
var aCallable = require('../internals/a-callable');

var $TypeError = TypeError;

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw new $TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aCallable(resolve);
  this.reject = aCallable(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"../internals/a-callable":1}],83:[function(require,module,exports){
'use strict';
/* global ActiveXObject -- old IE, WSH */
var anObject = require('../internals/an-object');
var definePropertiesModule = require('../internals/object-define-properties');
var enumBugKeys = require('../internals/enum-bug-keys');
var hiddenKeys = require('../internals/hidden-keys');
var html = require('../internals/html');
var documentCreateElement = require('../internals/document-create-element');
var sharedKey = require('../internals/shared-key');

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es/no-object-create -- safe
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
};

},{"../internals/an-object":6,"../internals/document-create-element":25,"../internals/enum-bug-keys":36,"../internals/hidden-keys":54,"../internals/html":56,"../internals/object-define-properties":84,"../internals/shared-key":110}],84:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var V8_PROTOTYPE_DEFINE_BUG = require('../internals/v8-prototype-define-bug');
var definePropertyModule = require('../internals/object-define-property');
var anObject = require('../internals/an-object');
var toIndexedObject = require('../internals/to-indexed-object');
var objectKeys = require('../internals/object-keys');

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe
exports.f = DESCRIPTORS && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var props = toIndexedObject(Properties);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], props[key]);
  return O;
};

},{"../internals/an-object":6,"../internals/descriptors":24,"../internals/object-define-property":85,"../internals/object-keys":93,"../internals/to-indexed-object":122,"../internals/v8-prototype-define-bug":133}],85:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');
var V8_PROTOTYPE_DEFINE_BUG = require('../internals/v8-prototype-define-bug');
var anObject = require('../internals/an-object');
var toPropertyKey = require('../internals/to-property-key');

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var ENUMERABLE = 'enumerable';
var CONFIGURABLE = 'configurable';
var WRITABLE = 'writable';

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
    var current = $getOwnPropertyDescriptor(O, P);
    if (current && current[WRITABLE]) {
      O[P] = Attributes.value;
      Attributes = {
        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
        writable: false
      };
    }
  } return $defineProperty(O, P, Attributes);
} : $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw new $TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"../internals/an-object":6,"../internals/descriptors":24,"../internals/ie8-dom-define":57,"../internals/to-property-key":127,"../internals/v8-prototype-define-bug":133}],86:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var call = require('../internals/function-call');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var toIndexedObject = require('../internals/to-indexed-object');
var toPropertyKey = require('../internals/to-property-key');
var hasOwn = require('../internals/has-own-property');
var IE8_DOM_DEFINE = require('../internals/ie8-dom-define');

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
};

},{"../internals/create-property-descriptor":19,"../internals/descriptors":24,"../internals/function-call":42,"../internals/has-own-property":53,"../internals/ie8-dom-define":57,"../internals/object-property-is-enumerable":94,"../internals/to-indexed-object":122,"../internals/to-property-key":127}],87:[function(require,module,exports){
'use strict';
/* eslint-disable es/no-object-getownpropertynames -- safe */
var classof = require('../internals/classof-raw');
var toIndexedObject = require('../internals/to-indexed-object');
var $getOwnPropertyNames = require('../internals/object-get-own-property-names').f;
var arraySlice = require('../internals/array-slice');

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return $getOwnPropertyNames(it);
  } catch (error) {
    return arraySlice(windowNames);
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && classof(it) === 'Window'
    ? getWindowNames(it)
    : $getOwnPropertyNames(toIndexedObject(it));
};

},{"../internals/array-slice":9,"../internals/classof-raw":13,"../internals/object-get-own-property-names":88,"../internals/to-indexed-object":122}],88:[function(require,module,exports){
'use strict';
var internalObjectKeys = require('../internals/object-keys-internal');
var enumBugKeys = require('../internals/enum-bug-keys');

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

},{"../internals/enum-bug-keys":36,"../internals/object-keys-internal":92}],89:[function(require,module,exports){
'use strict';
// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;

},{}],90:[function(require,module,exports){
'use strict';
var hasOwn = require('../internals/has-own-property');
var isCallable = require('../internals/is-callable');
var toObject = require('../internals/to-object');
var sharedKey = require('../internals/shared-key');
var CORRECT_PROTOTYPE_GETTER = require('../internals/correct-prototype-getter');

var IE_PROTO = sharedKey('IE_PROTO');
var $Object = Object;
var ObjectPrototype = $Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe
module.exports = CORRECT_PROTOTYPE_GETTER ? $Object.getPrototypeOf : function (O) {
  var object = toObject(O);
  if (hasOwn(object, IE_PROTO)) return object[IE_PROTO];
  var constructor = object.constructor;
  if (isCallable(constructor) && object instanceof constructor) {
    return constructor.prototype;
  } return object instanceof $Object ? ObjectPrototype : null;
};

},{"../internals/correct-prototype-getter":16,"../internals/has-own-property":53,"../internals/is-callable":64,"../internals/shared-key":110,"../internals/to-object":125}],91:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

module.exports = uncurryThis({}.isPrototypeOf);

},{"../internals/function-uncurry-this":46}],92:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var hasOwn = require('../internals/has-own-property');
var toIndexedObject = require('../internals/to-indexed-object');
var indexOf = require('../internals/array-includes').indexOf;
var hiddenKeys = require('../internals/hidden-keys');

var push = uncurryThis([].push);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (hasOwn(O, key = names[i++])) {
    ~indexOf(result, key) || push(result, key);
  }
  return result;
};

},{"../internals/array-includes":7,"../internals/function-uncurry-this":46,"../internals/has-own-property":53,"../internals/hidden-keys":54,"../internals/to-indexed-object":122}],93:[function(require,module,exports){
'use strict';
var internalObjectKeys = require('../internals/object-keys-internal');
var enumBugKeys = require('../internals/enum-bug-keys');

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};

},{"../internals/enum-bug-keys":36,"../internals/object-keys-internal":92}],94:[function(require,module,exports){
'use strict';
var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;

},{}],95:[function(require,module,exports){
'use strict';
/* eslint-disable no-proto -- safe */
var uncurryThisAccessor = require('../internals/function-uncurry-this-accessor');
var isObject = require('../internals/is-object');
var requireObjectCoercible = require('../internals/require-object-coercible');
var aPossiblePrototype = require('../internals/a-possible-prototype');

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = uncurryThisAccessor(Object.prototype, '__proto__', 'set');
    setter(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    requireObjectCoercible(O);
    aPossiblePrototype(proto);
    if (!isObject(O)) return O;
    if (CORRECT_SETTER) setter(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

},{"../internals/a-possible-prototype":3,"../internals/function-uncurry-this-accessor":44,"../internals/is-object":68,"../internals/require-object-coercible":106}],96:[function(require,module,exports){
'use strict';
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var classof = require('../internals/classof');

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};

},{"../internals/classof":14,"../internals/to-string-tag-support":128}],97:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');

var $TypeError = TypeError;

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
  if (pref !== 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  throw new $TypeError("Can't convert object to primitive value");
};

},{"../internals/function-call":42,"../internals/is-callable":64,"../internals/is-object":68}],98:[function(require,module,exports){
'use strict';
var getBuiltIn = require('../internals/get-built-in');
var uncurryThis = require('../internals/function-uncurry-this');
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var anObject = require('../internals/an-object');

var concat = uncurryThis([].concat);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
};

},{"../internals/an-object":6,"../internals/function-uncurry-this":46,"../internals/get-built-in":47,"../internals/object-get-own-property-names":88,"../internals/object-get-own-property-symbols":89}],99:[function(require,module,exports){
'use strict';
var global = require('../internals/global');

module.exports = global;

},{"../internals/global":52}],100:[function(require,module,exports){
'use strict';
module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};

},{}],101:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var isCallable = require('../internals/is-callable');
var isForced = require('../internals/is-forced');
var inspectSource = require('../internals/inspect-source');
var wellKnownSymbol = require('../internals/well-known-symbol');
var IS_BROWSER = require('../internals/engine-is-browser');
var IS_DENO = require('../internals/engine-is-deno');
var IS_PURE = require('../internals/is-pure');
var V8_VERSION = require('../internals/engine-v8-version');

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var SPECIES = wellKnownSymbol('species');
var SUBCLASSING = false;
var NATIVE_PROMISE_REJECTION_EVENT = isCallable(global.PromiseRejectionEvent);

var FORCED_PROMISE_CONSTRUCTOR = isForced('Promise', function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(NativePromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(NativePromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#{ catch, finally } in the pure version for preventing prototype pollution
  if (IS_PURE && !(NativePromisePrototype['catch'] && NativePromisePrototype['finally'])) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (!V8_VERSION || V8_VERSION < 51 || !/native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) {
    // Detect correctness of subclassing with @@species support
    var promise = new NativePromiseConstructor(function (resolve) { resolve(1); });
    var FakePromise = function (exec) {
      exec(function () { /* empty */ }, function () { /* empty */ });
    };
    var constructor = promise.constructor = {};
    constructor[SPECIES] = FakePromise;
    SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
    if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  } return !GLOBAL_CORE_JS_PROMISE && (IS_BROWSER || IS_DENO) && !NATIVE_PROMISE_REJECTION_EVENT;
});

module.exports = {
  CONSTRUCTOR: FORCED_PROMISE_CONSTRUCTOR,
  REJECTION_EVENT: NATIVE_PROMISE_REJECTION_EVENT,
  SUBCLASSING: SUBCLASSING
};

},{"../internals/engine-is-browser":28,"../internals/engine-is-deno":29,"../internals/engine-v8-version":35,"../internals/global":52,"../internals/inspect-source":60,"../internals/is-callable":64,"../internals/is-forced":66,"../internals/is-pure":70,"../internals/promise-native-constructor":102,"../internals/well-known-symbol":138}],102:[function(require,module,exports){
'use strict';
var global = require('../internals/global');

module.exports = global.Promise;

},{"../internals/global":52}],103:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');
var isObject = require('../internals/is-object');
var newPromiseCapability = require('../internals/new-promise-capability');

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"../internals/an-object":6,"../internals/is-object":68,"../internals/new-promise-capability":82}],104:[function(require,module,exports){
'use strict';
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var checkCorrectnessOfIteration = require('../internals/check-correctness-of-iteration');
var FORCED_PROMISE_CONSTRUCTOR = require('../internals/promise-constructor-detection').CONSTRUCTOR;

module.exports = FORCED_PROMISE_CONSTRUCTOR || !checkCorrectnessOfIteration(function (iterable) {
  NativePromiseConstructor.all(iterable).then(undefined, function () { /* empty */ });
});

},{"../internals/check-correctness-of-iteration":12,"../internals/promise-constructor-detection":101,"../internals/promise-native-constructor":102}],105:[function(require,module,exports){
'use strict';
var Queue = function () {
  this.head = null;
  this.tail = null;
};

Queue.prototype = {
  add: function (item) {
    var entry = { item: item, next: null };
    var tail = this.tail;
    if (tail) tail.next = entry;
    else this.head = entry;
    this.tail = entry;
  },
  get: function () {
    var entry = this.head;
    if (entry) {
      var next = this.head = entry.next;
      if (next === null) this.tail = null;
      return entry.item;
    }
  }
};

module.exports = Queue;

},{}],106:[function(require,module,exports){
'use strict';
var isNullOrUndefined = require('../internals/is-null-or-undefined');

var $TypeError = TypeError;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (isNullOrUndefined(it)) throw new $TypeError("Can't call method on " + it);
  return it;
};

},{"../internals/is-null-or-undefined":67}],107:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var DESCRIPTORS = require('../internals/descriptors');

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Avoid NodeJS experimental warning
module.exports = function (name) {
  if (!DESCRIPTORS) return global[name];
  var descriptor = getOwnPropertyDescriptor(global, name);
  return descriptor && descriptor.value;
};

},{"../internals/descriptors":24,"../internals/global":52}],108:[function(require,module,exports){
'use strict';
var getBuiltIn = require('../internals/get-built-in');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var wellKnownSymbol = require('../internals/well-known-symbol');
var DESCRIPTORS = require('../internals/descriptors');

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineBuiltInAccessor(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

},{"../internals/define-built-in-accessor":21,"../internals/descriptors":24,"../internals/get-built-in":47,"../internals/well-known-symbol":138}],109:[function(require,module,exports){
'use strict';
var defineProperty = require('../internals/object-define-property').f;
var hasOwn = require('../internals/has-own-property');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (target, TAG, STATIC) {
  if (target && !STATIC) target = target.prototype;
  if (target && !hasOwn(target, TO_STRING_TAG)) {
    defineProperty(target, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

},{"../internals/has-own-property":53,"../internals/object-define-property":85,"../internals/well-known-symbol":138}],110:[function(require,module,exports){
'use strict';
var shared = require('../internals/shared');
var uid = require('../internals/uid');

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

},{"../internals/shared":112,"../internals/uid":131}],111:[function(require,module,exports){
'use strict';
var IS_PURE = require('../internals/is-pure');
var globalThis = require('../internals/global');
var defineGlobalProperty = require('../internals/define-global-property');

var SHARED = '__core-js_shared__';
var store = module.exports = globalThis[SHARED] || defineGlobalProperty(SHARED, {});

(store.versions || (store.versions = [])).push({
  version: '3.37.1',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: 'Â© 2014-2024 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.37.1/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});

},{"../internals/define-global-property":23,"../internals/global":52,"../internals/is-pure":70}],112:[function(require,module,exports){
'use strict';
var store = require('../internals/shared-store');

module.exports = function (key, value) {
  return store[key] || (store[key] = value || {});
};

},{"../internals/shared-store":111}],113:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');
var aConstructor = require('../internals/a-constructor');
var isNullOrUndefined = require('../internals/is-null-or-undefined');
var wellKnownSymbol = require('../internals/well-known-symbol');

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || isNullOrUndefined(S = anObject(C)[SPECIES]) ? defaultConstructor : aConstructor(S);
};

},{"../internals/a-constructor":2,"../internals/an-object":6,"../internals/is-null-or-undefined":67,"../internals/well-known-symbol":138}],114:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var toIntegerOrInfinity = require('../internals/to-integer-or-infinity');
var toString = require('../internals/to-string');
var requireObjectCoercible = require('../internals/require-object-coercible');

var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var stringSlice = uncurryThis(''.slice);

var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString(requireObjectCoercible($this));
    var position = toIntegerOrInfinity(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = charCodeAt(S, position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING
          ? charAt(S, position)
          : first
        : CONVERT_TO_STRING
          ? stringSlice(S, position, position + 2)
          : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

},{"../internals/function-uncurry-this":46,"../internals/require-object-coercible":106,"../internals/to-integer-or-infinity":123,"../internals/to-string":129}],115:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var requireObjectCoercible = require('../internals/require-object-coercible');
var toString = require('../internals/to-string');
var whitespaces = require('../internals/whitespaces');

var replace = uncurryThis(''.replace);
var ltrim = RegExp('^[' + whitespaces + ']+');
var rtrim = RegExp('(^|[^' + whitespaces + '])[' + whitespaces + ']+$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod = function (TYPE) {
  return function ($this) {
    var string = toString(requireObjectCoercible($this));
    if (TYPE & 1) string = replace(string, ltrim, '');
    if (TYPE & 2) string = replace(string, rtrim, '$1');
    return string;
  };
};

module.exports = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimstart
  start: createMethod(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimend
  end: createMethod(2),
  // `String.prototype.trim` method
  // https://tc39.es/ecma262/#sec-string.prototype.trim
  trim: createMethod(3)
};

},{"../internals/function-uncurry-this":46,"../internals/require-object-coercible":106,"../internals/to-string":129,"../internals/whitespaces":139}],116:[function(require,module,exports){
'use strict';
/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = require('../internals/engine-v8-version');
var fails = require('../internals/fails');
var global = require('../internals/global');

var $String = global.String;

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol('symbol detection');
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  // nb: Do not call `String` directly to avoid this being optimized out to `symbol+''` which will,
  // of course, fail.
  return !$String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});

},{"../internals/engine-v8-version":35,"../internals/fails":38,"../internals/global":52}],117:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var getBuiltIn = require('../internals/get-built-in');
var wellKnownSymbol = require('../internals/well-known-symbol');
var defineBuiltIn = require('../internals/define-built-in');

module.exports = function () {
  var Symbol = getBuiltIn('Symbol');
  var SymbolPrototype = Symbol && Symbol.prototype;
  var valueOf = SymbolPrototype && SymbolPrototype.valueOf;
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

  if (SymbolPrototype && !SymbolPrototype[TO_PRIMITIVE]) {
    // `Symbol.prototype[@@toPrimitive]` method
    // https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
    // eslint-disable-next-line no-unused-vars -- required for .length
    defineBuiltIn(SymbolPrototype, TO_PRIMITIVE, function (hint) {
      return call(valueOf, this);
    }, { arity: 1 });
  }
};

},{"../internals/define-built-in":22,"../internals/function-call":42,"../internals/get-built-in":47,"../internals/well-known-symbol":138}],118:[function(require,module,exports){
'use strict';
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');

/* eslint-disable es/no-symbol -- safe */
module.exports = NATIVE_SYMBOL && !!Symbol['for'] && !!Symbol.keyFor;

},{"../internals/symbol-constructor-detection":116}],119:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var apply = require('../internals/function-apply');
var bind = require('../internals/function-bind-context');
var isCallable = require('../internals/is-callable');
var hasOwn = require('../internals/has-own-property');
var fails = require('../internals/fails');
var html = require('../internals/html');
var arraySlice = require('../internals/array-slice');
var createElement = require('../internals/document-create-element');
var validateArgumentsLength = require('../internals/validate-arguments-length');
var IS_IOS = require('../internals/engine-is-ios');
var IS_NODE = require('../internals/engine-is-node');

var set = global.setImmediate;
var clear = global.clearImmediate;
var process = global.process;
var Dispatch = global.Dispatch;
var Function = global.Function;
var MessageChannel = global.MessageChannel;
var String = global.String;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var $location, defer, channel, port;

fails(function () {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  $location = global.location;
});

var run = function (id) {
  if (hasOwn(queue, id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var eventListener = function (event) {
  run(event.data);
};

var globalPostMessageDefer = function (id) {
  // old engines have not location.origin
  global.postMessage(String(id), $location.protocol + '//' + $location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(handler) {
    validateArgumentsLength(arguments.length, 1);
    var fn = isCallable(handler) ? handler : Function(handler);
    var args = arraySlice(arguments, 1);
    queue[++counter] = function () {
      apply(fn, undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = eventListener;
    defer = bind(port.postMessage, port);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    global.addEventListener &&
    isCallable(global.postMessage) &&
    !global.importScripts &&
    $location && $location.protocol !== 'file:' &&
    !fails(globalPostMessageDefer)
  ) {
    defer = globalPostMessageDefer;
    global.addEventListener('message', eventListener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};

},{"../internals/array-slice":9,"../internals/document-create-element":25,"../internals/engine-is-ios":31,"../internals/engine-is-node":32,"../internals/fails":38,"../internals/function-apply":39,"../internals/function-bind-context":40,"../internals/global":52,"../internals/has-own-property":53,"../internals/html":56,"../internals/is-callable":64,"../internals/validate-arguments-length":134}],120:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

// `thisNumberValue` abstract operation
// https://tc39.es/ecma262/#sec-thisnumbervalue
module.exports = uncurryThis(1.0.valueOf);

},{"../internals/function-uncurry-this":46}],121:[function(require,module,exports){
'use strict';
var toIntegerOrInfinity = require('../internals/to-integer-or-infinity');

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toIntegerOrInfinity(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

},{"../internals/to-integer-or-infinity":123}],122:[function(require,module,exports){
'use strict';
// toObject with fallback for non-array-like ES3 strings
var IndexedObject = require('../internals/indexed-object');
var requireObjectCoercible = require('../internals/require-object-coercible');

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

},{"../internals/indexed-object":58,"../internals/require-object-coercible":106}],123:[function(require,module,exports){
'use strict';
var trunc = require('../internals/math-trunc');

// `ToIntegerOrInfinity` abstract operation
// https://tc39.es/ecma262/#sec-tointegerorinfinity
module.exports = function (argument) {
  var number = +argument;
  // eslint-disable-next-line no-self-compare -- NaN check
  return number !== number || number === 0 ? 0 : trunc(number);
};

},{"../internals/math-trunc":80}],124:[function(require,module,exports){
'use strict';
var toIntegerOrInfinity = require('../internals/to-integer-or-infinity');

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  var len = toIntegerOrInfinity(argument);
  return len > 0 ? min(len, 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

},{"../internals/to-integer-or-infinity":123}],125:[function(require,module,exports){
'use strict';
var requireObjectCoercible = require('../internals/require-object-coercible');

var $Object = Object;

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return $Object(requireObjectCoercible(argument));
};

},{"../internals/require-object-coercible":106}],126:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var isObject = require('../internals/is-object');
var isSymbol = require('../internals/is-symbol');
var getMethod = require('../internals/get-method');
var ordinaryToPrimitive = require('../internals/ordinary-to-primitive');
var wellKnownSymbol = require('../internals/well-known-symbol');

var $TypeError = TypeError;
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = getMethod(input, TO_PRIMITIVE);
  var result;
  if (exoticToPrim) {
    if (pref === undefined) pref = 'default';
    result = call(exoticToPrim, input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw new $TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};

},{"../internals/function-call":42,"../internals/get-method":51,"../internals/is-object":68,"../internals/is-symbol":71,"../internals/ordinary-to-primitive":97,"../internals/well-known-symbol":138}],127:[function(require,module,exports){
'use strict';
var toPrimitive = require('../internals/to-primitive');
var isSymbol = require('../internals/is-symbol');

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : key + '';
};

},{"../internals/is-symbol":71,"../internals/to-primitive":126}],128:[function(require,module,exports){
'use strict';
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';

},{"../internals/well-known-symbol":138}],129:[function(require,module,exports){
'use strict';
var classof = require('../internals/classof');

var $String = String;

module.exports = function (argument) {
  if (classof(argument) === 'Symbol') throw new TypeError('Cannot convert a Symbol value to a string');
  return $String(argument);
};

},{"../internals/classof":14}],130:[function(require,module,exports){
'use strict';
var $String = String;

module.exports = function (argument) {
  try {
    return $String(argument);
  } catch (error) {
    return 'Object';
  }
};

},{}],131:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

var id = 0;
var postfix = Math.random();
var toString = uncurryThis(1.0.toString);

module.exports = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
};

},{"../internals/function-uncurry-this":46}],132:[function(require,module,exports){
'use strict';
/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';

},{"../internals/symbol-constructor-detection":116}],133:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var fails = require('../internals/fails');

// V8 ~ Chrome 36-
// https://bugs.chromium.org/p/v8/issues/detail?id=3334
module.exports = DESCRIPTORS && fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
    value: 42,
    writable: false
  }).prototype !== 42;
});

},{"../internals/descriptors":24,"../internals/fails":38}],134:[function(require,module,exports){
'use strict';
var $TypeError = TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw new $TypeError('Not enough arguments');
  return passed;
};

},{}],135:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var isCallable = require('../internals/is-callable');

var WeakMap = global.WeakMap;

module.exports = isCallable(WeakMap) && /native code/.test(String(WeakMap));

},{"../internals/global":52,"../internals/is-callable":64}],136:[function(require,module,exports){
'use strict';
var path = require('../internals/path');
var hasOwn = require('../internals/has-own-property');
var wrappedWellKnownSymbolModule = require('../internals/well-known-symbol-wrapped');
var defineProperty = require('../internals/object-define-property').f;

module.exports = function (NAME) {
  var Symbol = path.Symbol || (path.Symbol = {});
  if (!hasOwn(Symbol, NAME)) defineProperty(Symbol, NAME, {
    value: wrappedWellKnownSymbolModule.f(NAME)
  });
};

},{"../internals/has-own-property":53,"../internals/object-define-property":85,"../internals/path":99,"../internals/well-known-symbol-wrapped":137}],137:[function(require,module,exports){
'use strict';
var wellKnownSymbol = require('../internals/well-known-symbol');

exports.f = wellKnownSymbol;

},{"../internals/well-known-symbol":138}],138:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var shared = require('../internals/shared');
var hasOwn = require('../internals/has-own-property');
var uid = require('../internals/uid');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');
var USE_SYMBOL_AS_UID = require('../internals/use-symbol-as-uid');

var Symbol = global.Symbol;
var WellKnownSymbolsStore = shared('wks');
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol['for'] || Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!hasOwn(WellKnownSymbolsStore, name)) {
    WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol, name)
      ? Symbol[name]
      : createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};

},{"../internals/global":52,"../internals/has-own-property":53,"../internals/shared":112,"../internals/symbol-constructor-detection":116,"../internals/uid":131,"../internals/use-symbol-as-uid":132}],139:[function(require,module,exports){
'use strict';
// a string of all valid unicode whitespaces
module.exports = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002' +
  '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

},{}],140:[function(require,module,exports){
'use strict';
var toIndexedObject = require('../internals/to-indexed-object');
var addToUnscopables = require('../internals/add-to-unscopables');
var Iterators = require('../internals/iterators');
var InternalStateModule = require('../internals/internal-state');
var defineProperty = require('../internals/object-define-property').f;
var defineIterator = require('../internals/iterator-define');
var createIterResultObject = require('../internals/create-iter-result-object');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return createIterResultObject(undefined, true);
  }
  switch (state.kind) {
    case 'keys': return createIterResultObject(index, false);
    case 'values': return createIterResultObject(target[index], false);
  } return createIterResultObject([index, target[index]], false);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
var values = Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

// V8 ~ Chrome 45- bug
if (!IS_PURE && DESCRIPTORS && values.name !== 'values') try {
  defineProperty(values, 'name', { value: 'values' });
} catch (error) { /* empty */ }

},{"../internals/add-to-unscopables":4,"../internals/create-iter-result-object":17,"../internals/descriptors":24,"../internals/internal-state":61,"../internals/is-pure":70,"../internals/iterator-define":75,"../internals/iterators":77,"../internals/object-define-property":85,"../internals/to-indexed-object":122}],141:[function(require,module,exports){
'use strict';
var hasOwn = require('../internals/has-own-property');
var defineBuiltIn = require('../internals/define-built-in');
var dateToPrimitive = require('../internals/date-to-primitive');
var wellKnownSymbol = require('../internals/well-known-symbol');

var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
var DatePrototype = Date.prototype;

// `Date.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-date.prototype-@@toprimitive
if (!hasOwn(DatePrototype, TO_PRIMITIVE)) {
  defineBuiltIn(DatePrototype, TO_PRIMITIVE, dateToPrimitive);
}

},{"../internals/date-to-primitive":20,"../internals/define-built-in":22,"../internals/has-own-property":53,"../internals/well-known-symbol":138}],142:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getBuiltIn = require('../internals/get-built-in');
var apply = require('../internals/function-apply');
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');
var isSymbol = require('../internals/is-symbol');
var arraySlice = require('../internals/array-slice');
var getReplacerFunction = require('../internals/get-json-replacer-function');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');

var $String = String;
var $stringify = getBuiltIn('JSON', 'stringify');
var exec = uncurryThis(/./.exec);
var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var replace = uncurryThis(''.replace);
var numberToString = uncurryThis(1.0.toString);

var tester = /[\uD800-\uDFFF]/g;
var low = /^[\uD800-\uDBFF]$/;
var hi = /^[\uDC00-\uDFFF]$/;

var WRONG_SYMBOLS_CONVERSION = !NATIVE_SYMBOL || fails(function () {
  var symbol = getBuiltIn('Symbol')('stringify detection');
  // MS Edge converts symbol values to JSON as {}
  return $stringify([symbol]) !== '[null]'
    // WebKit converts symbol values to JSON as null
    || $stringify({ a: symbol }) !== '{}'
    // V8 throws on boxed symbols
    || $stringify(Object(symbol)) !== '{}';
});

// https://github.com/tc39/proposal-well-formed-stringify
var ILL_FORMED_UNICODE = fails(function () {
  return $stringify('\uDF06\uD834') !== '"\\udf06\\ud834"'
    || $stringify('\uDEAD') !== '"\\udead"';
});

var stringifyWithSymbolsFix = function (it, replacer) {
  var args = arraySlice(arguments);
  var $replacer = getReplacerFunction(replacer);
  if (!isCallable($replacer) && (it === undefined || isSymbol(it))) return; // IE8 returns string on undefined
  args[1] = function (key, value) {
    // some old implementations (like WebKit) could pass numbers as keys
    if (isCallable($replacer)) value = call($replacer, this, $String(key), value);
    if (!isSymbol(value)) return value;
  };
  return apply($stringify, null, args);
};

var fixIllFormed = function (match, offset, string) {
  var prev = charAt(string, offset - 1);
  var next = charAt(string, offset + 1);
  if ((exec(low, match) && !exec(hi, next)) || (exec(hi, match) && !exec(low, prev))) {
    return '\\u' + numberToString(charCodeAt(match, 0), 16);
  } return match;
};

if ($stringify) {
  // `JSON.stringify` method
  // https://tc39.es/ecma262/#sec-json.stringify
  $({ target: 'JSON', stat: true, arity: 3, forced: WRONG_SYMBOLS_CONVERSION || ILL_FORMED_UNICODE }, {
    // eslint-disable-next-line no-unused-vars -- required for `.length`
    stringify: function stringify(it, replacer, space) {
      var args = arraySlice(arguments);
      var result = apply(WRONG_SYMBOLS_CONVERSION ? stringifyWithSymbolsFix : $stringify, null, args);
      return ILL_FORMED_UNICODE && typeof result == 'string' ? replace(result, tester, fixIllFormed) : result;
    }
  });
}

},{"../internals/array-slice":9,"../internals/export":37,"../internals/fails":38,"../internals/function-apply":39,"../internals/function-call":42,"../internals/function-uncurry-this":46,"../internals/get-built-in":47,"../internals/get-json-replacer-function":50,"../internals/is-callable":64,"../internals/is-symbol":71,"../internals/symbol-constructor-detection":116}],143:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');
var global = require('../internals/global');
var path = require('../internals/path');
var uncurryThis = require('../internals/function-uncurry-this');
var isForced = require('../internals/is-forced');
var hasOwn = require('../internals/has-own-property');
var inheritIfRequired = require('../internals/inherit-if-required');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var isSymbol = require('../internals/is-symbol');
var toPrimitive = require('../internals/to-primitive');
var fails = require('../internals/fails');
var getOwnPropertyNames = require('../internals/object-get-own-property-names').f;
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var defineProperty = require('../internals/object-define-property').f;
var thisNumberValue = require('../internals/this-number-value');
var trim = require('../internals/string-trim').trim;

var NUMBER = 'Number';
var NativeNumber = global[NUMBER];
var PureNumberNamespace = path[NUMBER];
var NumberPrototype = NativeNumber.prototype;
var TypeError = global.TypeError;
var stringSlice = uncurryThis(''.slice);
var charCodeAt = uncurryThis(''.charCodeAt);

// `ToNumeric` abstract operation
// https://tc39.es/ecma262/#sec-tonumeric
var toNumeric = function (value) {
  var primValue = toPrimitive(value, 'number');
  return typeof primValue == 'bigint' ? primValue : toNumber(primValue);
};

// `ToNumber` abstract operation
// https://tc39.es/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive(argument, 'number');
  var first, third, radix, maxCode, digits, length, index, code;
  if (isSymbol(it)) throw new TypeError('Cannot convert a Symbol value to a number');
  if (typeof it == 'string' && it.length > 2) {
    it = trim(it);
    first = charCodeAt(it, 0);
    if (first === 43 || first === 45) {
      third = charCodeAt(it, 2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (charCodeAt(it, 1)) {
        // fast equal of /^0b[01]+$/i
        case 66:
        case 98:
          radix = 2;
          maxCode = 49;
          break;
        // fast equal of /^0o[0-7]+$/i
        case 79:
        case 111:
          radix = 8;
          maxCode = 55;
          break;
        default:
          return +it;
      }
      digits = stringSlice(it, 2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = charCodeAt(digits, index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

var FORCED = isForced(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'));

var calledWithNew = function (dummy) {
  // includes check on 1..constructor(foo) case
  return isPrototypeOf(NumberPrototype, dummy) && fails(function () { thisNumberValue(dummy); });
};

// `Number` constructor
// https://tc39.es/ecma262/#sec-number-constructor
var NumberWrapper = function Number(value) {
  var n = arguments.length < 1 ? 0 : NativeNumber(toNumeric(value));
  return calledWithNew(this) ? inheritIfRequired(Object(n), this, NumberWrapper) : n;
};

NumberWrapper.prototype = NumberPrototype;
if (FORCED && !IS_PURE) NumberPrototype.constructor = NumberWrapper;

$({ global: true, constructor: true, wrap: true, forced: FORCED }, {
  Number: NumberWrapper
});

// Use `internal/copy-constructor-properties` helper in `core-js@4`
var copyConstructorProperties = function (target, source) {
  for (var keys = DESCRIPTORS ? getOwnPropertyNames(source) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,isFinite,isInteger,isNaN,isSafeInteger,parseFloat,parseInt,' +
    // ESNext
    'fromString,range'
  ).split(','), j = 0, key; keys.length > j; j++) {
    if (hasOwn(source, key = keys[j]) && !hasOwn(target, key)) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};

if (IS_PURE && PureNumberNamespace) copyConstructorProperties(path[NUMBER], PureNumberNamespace);
if (FORCED || IS_PURE) copyConstructorProperties(path[NUMBER], NativeNumber);

},{"../internals/descriptors":24,"../internals/export":37,"../internals/fails":38,"../internals/function-uncurry-this":46,"../internals/global":52,"../internals/has-own-property":53,"../internals/inherit-if-required":59,"../internals/is-forced":66,"../internals/is-pure":70,"../internals/is-symbol":71,"../internals/object-define-property":85,"../internals/object-get-own-property-descriptor":86,"../internals/object-get-own-property-names":88,"../internals/object-is-prototype-of":91,"../internals/path":99,"../internals/string-trim":115,"../internals/this-number-value":120,"../internals/to-primitive":126}],144:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');
var fails = require('../internals/fails');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var toObject = require('../internals/to-object');

// V8 ~ Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
var FORCED = !NATIVE_SYMBOL || fails(function () { getOwnPropertySymbolsModule.f(1); });

// `Object.getOwnPropertySymbols` method
// https://tc39.es/ecma262/#sec-object.getownpropertysymbols
$({ target: 'Object', stat: true, forced: FORCED }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    var $getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
    return $getOwnPropertySymbols ? $getOwnPropertySymbols(toObject(it)) : [];
  }
});

},{"../internals/export":37,"../internals/fails":38,"../internals/object-get-own-property-symbols":89,"../internals/symbol-constructor-detection":116,"../internals/to-object":125}],145:[function(require,module,exports){
'use strict';
var TO_STRING_TAG_SUPPORT = require('../internals/to-string-tag-support');
var defineBuiltIn = require('../internals/define-built-in');
var toString = require('../internals/object-to-string');

// `Object.prototype.toString` method
// https://tc39.es/ecma262/#sec-object.prototype.tostring
if (!TO_STRING_TAG_SUPPORT) {
  defineBuiltIn(Object.prototype, 'toString', toString, { unsafe: true });
}

},{"../internals/define-built-in":22,"../internals/object-to-string":96,"../internals/to-string-tag-support":128}],146:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var call = require('../internals/function-call');
var aCallable = require('../internals/a-callable');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');
var iterate = require('../internals/iterate');
var PROMISE_STATICS_INCORRECT_ITERATION = require('../internals/promise-statics-incorrect-iteration');

// `Promise.all` method
// https://tc39.es/ecma262/#sec-promise.all
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        remaining++;
        call($promiseResolve, C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

},{"../internals/a-callable":1,"../internals/export":37,"../internals/function-call":42,"../internals/iterate":72,"../internals/new-promise-capability":82,"../internals/perform":100,"../internals/promise-statics-incorrect-iteration":104}],147:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var FORCED_PROMISE_CONSTRUCTOR = require('../internals/promise-constructor-detection').CONSTRUCTOR;
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var getBuiltIn = require('../internals/get-built-in');
var isCallable = require('../internals/is-callable');
var defineBuiltIn = require('../internals/define-built-in');

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;

// `Promise.prototype.catch` method
// https://tc39.es/ecma262/#sec-promise.prototype.catch
$({ target: 'Promise', proto: true, forced: FORCED_PROMISE_CONSTRUCTOR, real: true }, {
  'catch': function (onRejected) {
    return this.then(undefined, onRejected);
  }
});

// makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
if (!IS_PURE && isCallable(NativePromiseConstructor)) {
  var method = getBuiltIn('Promise').prototype['catch'];
  if (NativePromisePrototype['catch'] !== method) {
    defineBuiltIn(NativePromisePrototype, 'catch', method, { unsafe: true });
  }
}

},{"../internals/define-built-in":22,"../internals/export":37,"../internals/get-built-in":47,"../internals/is-callable":64,"../internals/is-pure":70,"../internals/promise-constructor-detection":101,"../internals/promise-native-constructor":102}],148:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var IS_NODE = require('../internals/engine-is-node');
var global = require('../internals/global');
var call = require('../internals/function-call');
var defineBuiltIn = require('../internals/define-built-in');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var setToStringTag = require('../internals/set-to-string-tag');
var setSpecies = require('../internals/set-species');
var aCallable = require('../internals/a-callable');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var anInstance = require('../internals/an-instance');
var speciesConstructor = require('../internals/species-constructor');
var task = require('../internals/task').set;
var microtask = require('../internals/microtask');
var hostReportErrors = require('../internals/host-report-errors');
var perform = require('../internals/perform');
var Queue = require('../internals/queue');
var InternalStateModule = require('../internals/internal-state');
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var PromiseConstructorDetection = require('../internals/promise-constructor-detection');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');

var PROMISE = 'Promise';
var FORCED_PROMISE_CONSTRUCTOR = PromiseConstructorDetection.CONSTRUCTOR;
var NATIVE_PROMISE_REJECTION_EVENT = PromiseConstructorDetection.REJECTION_EVENT;
var NATIVE_PROMISE_SUBCLASSING = PromiseConstructorDetection.SUBCLASSING;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var setInternalState = InternalStateModule.set;
var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var PromiseConstructor = NativePromiseConstructor;
var PromisePrototype = NativePromisePrototype;
var TypeError = global.TypeError;
var document = global.document;
var process = global.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;

var DISPATCH_EVENT = !!(document && document.createEvent && global.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;

var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && isCallable(then = it.then) ? then : false;
};

var callReaction = function (reaction, state) {
  var value = state.value;
  var ok = state.state === FULFILLED;
  var handler = ok ? reaction.ok : reaction.fail;
  var resolve = reaction.resolve;
  var reject = reaction.reject;
  var domain = reaction.domain;
  var result, then, exited;
  try {
    if (handler) {
      if (!ok) {
        if (state.rejection === UNHANDLED) onHandleUnhandled(state);
        state.rejection = HANDLED;
      }
      if (handler === true) result = value;
      else {
        if (domain) domain.enter();
        result = handler(value); // can throw
        if (domain) {
          domain.exit();
          exited = true;
        }
      }
      if (result === reaction.promise) {
        reject(new TypeError('Promise-chain cycle'));
      } else if (then = isThenable(result)) {
        call(then, result, resolve, reject);
      } else resolve(result);
    } else reject(value);
  } catch (error) {
    if (domain && !exited) domain.exit();
    reject(error);
  }
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  microtask(function () {
    var reactions = state.reactions;
    var reaction;
    while (reaction = reactions.get()) {
      callReaction(reaction, state);
    }
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_PROMISE_REJECTION_EVENT && (handler = global['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  call(task, global, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  call(task, global, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw new TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          call(then, value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED_PROMISE_CONSTRUCTOR) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromisePrototype);
    aCallable(executor);
    call(Internal, this);
    var state = getInternalPromiseState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };

  PromisePrototype = PromiseConstructor.prototype;

  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: new Queue(),
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };

  // `Promise.prototype.then` method
  // https://tc39.es/ecma262/#sec-promise.prototype.then
  Internal.prototype = defineBuiltIn(PromisePrototype, 'then', function then(onFulfilled, onRejected) {
    var state = getInternalPromiseState(this);
    var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
    state.parent = true;
    reaction.ok = isCallable(onFulfilled) ? onFulfilled : true;
    reaction.fail = isCallable(onRejected) && onRejected;
    reaction.domain = IS_NODE ? process.domain : undefined;
    if (state.state === PENDING) state.reactions.add(reaction);
    else microtask(function () {
      callReaction(reaction, state);
    });
    return reaction.promise;
  });

  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalPromiseState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };

  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && isCallable(NativePromiseConstructor) && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!NATIVE_PROMISE_SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      defineBuiltIn(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          call(nativeThen, that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromisePrototype);
    }
  }
}

$({ global: true, constructor: true, wrap: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);

},{"../internals/a-callable":1,"../internals/an-instance":5,"../internals/define-built-in":22,"../internals/engine-is-node":32,"../internals/export":37,"../internals/function-call":42,"../internals/global":52,"../internals/host-report-errors":55,"../internals/internal-state":61,"../internals/is-callable":64,"../internals/is-object":68,"../internals/is-pure":70,"../internals/microtask":81,"../internals/new-promise-capability":82,"../internals/object-set-prototype-of":95,"../internals/perform":100,"../internals/promise-constructor-detection":101,"../internals/promise-native-constructor":102,"../internals/queue":105,"../internals/set-species":108,"../internals/set-to-string-tag":109,"../internals/species-constructor":113,"../internals/task":119}],149:[function(require,module,exports){
'use strict';
// TODO: Remove this module from `core-js@4` since it's split to modules listed below
require('../modules/es.promise.constructor');
require('../modules/es.promise.all');
require('../modules/es.promise.catch');
require('../modules/es.promise.race');
require('../modules/es.promise.reject');
require('../modules/es.promise.resolve');

},{"../modules/es.promise.all":146,"../modules/es.promise.catch":147,"../modules/es.promise.constructor":148,"../modules/es.promise.race":150,"../modules/es.promise.reject":151,"../modules/es.promise.resolve":152}],150:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var call = require('../internals/function-call');
var aCallable = require('../internals/a-callable');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var perform = require('../internals/perform');
var iterate = require('../internals/iterate');
var PROMISE_STATICS_INCORRECT_ITERATION = require('../internals/promise-statics-incorrect-iteration');

// `Promise.race` method
// https://tc39.es/ecma262/#sec-promise.race
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      iterate(iterable, function (promise) {
        call($promiseResolve, C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

},{"../internals/a-callable":1,"../internals/export":37,"../internals/function-call":42,"../internals/iterate":72,"../internals/new-promise-capability":82,"../internals/perform":100,"../internals/promise-statics-incorrect-iteration":104}],151:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');
var FORCED_PROMISE_CONSTRUCTOR = require('../internals/promise-constructor-detection').CONSTRUCTOR;

// `Promise.reject` method
// https://tc39.es/ecma262/#sec-promise.reject
$({ target: 'Promise', stat: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  reject: function reject(r) {
    var capability = newPromiseCapabilityModule.f(this);
    var capabilityReject = capability.reject;
    capabilityReject(r);
    return capability.promise;
  }
});

},{"../internals/export":37,"../internals/new-promise-capability":82,"../internals/promise-constructor-detection":101}],152:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getBuiltIn = require('../internals/get-built-in');
var IS_PURE = require('../internals/is-pure');
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var FORCED_PROMISE_CONSTRUCTOR = require('../internals/promise-constructor-detection').CONSTRUCTOR;
var promiseResolve = require('../internals/promise-resolve');

var PromiseConstructorWrapper = getBuiltIn('Promise');
var CHECK_WRAPPER = IS_PURE && !FORCED_PROMISE_CONSTRUCTOR;

// `Promise.resolve` method
// https://tc39.es/ecma262/#sec-promise.resolve
$({ target: 'Promise', stat: true, forced: IS_PURE || FORCED_PROMISE_CONSTRUCTOR }, {
  resolve: function resolve(x) {
    return promiseResolve(CHECK_WRAPPER && this === PromiseConstructorWrapper ? NativePromiseConstructor : this, x);
  }
});

},{"../internals/export":37,"../internals/get-built-in":47,"../internals/is-pure":70,"../internals/promise-constructor-detection":101,"../internals/promise-native-constructor":102,"../internals/promise-resolve":103}],153:[function(require,module,exports){
'use strict';
var charAt = require('../internals/string-multibyte').charAt;
var toString = require('../internals/to-string');
var InternalStateModule = require('../internals/internal-state');
var defineIterator = require('../internals/iterator-define');
var createIterResultObject = require('../internals/create-iter-result-object');

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return createIterResultObject(undefined, true);
  point = charAt(string, index);
  state.index += point.length;
  return createIterResultObject(point, false);
});

},{"../internals/create-iter-result-object":17,"../internals/internal-state":61,"../internals/iterator-define":75,"../internals/string-multibyte":114,"../internals/to-string":129}],154:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var global = require('../internals/global');
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');
var fails = require('../internals/fails');
var hasOwn = require('../internals/has-own-property');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var anObject = require('../internals/an-object');
var toIndexedObject = require('../internals/to-indexed-object');
var toPropertyKey = require('../internals/to-property-key');
var $toString = require('../internals/to-string');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var nativeObjectCreate = require('../internals/object-create');
var objectKeys = require('../internals/object-keys');
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertyNamesExternal = require('../internals/object-get-own-property-names-external');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');
var definePropertyModule = require('../internals/object-define-property');
var definePropertiesModule = require('../internals/object-define-properties');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var defineBuiltIn = require('../internals/define-built-in');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var shared = require('../internals/shared');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');
var uid = require('../internals/uid');
var wellKnownSymbol = require('../internals/well-known-symbol');
var wrappedWellKnownSymbolModule = require('../internals/well-known-symbol-wrapped');
var defineWellKnownSymbol = require('../internals/well-known-symbol-define');
var defineSymbolToPrimitive = require('../internals/symbol-define-to-primitive');
var setToStringTag = require('../internals/set-to-string-tag');
var InternalStateModule = require('../internals/internal-state');
var $forEach = require('../internals/array-iteration').forEach;

var HIDDEN = sharedKey('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE = 'prototype';

var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(SYMBOL);

var ObjectPrototype = Object[PROTOTYPE];
var $Symbol = global.Symbol;
var SymbolPrototype = $Symbol && $Symbol[PROTOTYPE];
var RangeError = global.RangeError;
var TypeError = global.TypeError;
var QObject = global.QObject;
var nativeGetOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
var nativeDefineProperty = definePropertyModule.f;
var nativeGetOwnPropertyNames = getOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable = propertyIsEnumerableModule.f;
var push = uncurryThis([].push);

var AllSymbols = shared('symbols');
var ObjectPrototypeSymbols = shared('op-symbols');
var WellKnownSymbolsStore = shared('wks');

// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var fallbackDefineProperty = function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor(ObjectPrototype, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
  nativeDefineProperty(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    nativeDefineProperty(ObjectPrototype, P, ObjectPrototypeDescriptor);
  }
};

var setSymbolDescriptor = DESCRIPTORS && fails(function () {
  return nativeObjectCreate(nativeDefineProperty({}, 'a', {
    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
  })).a !== 7;
}) ? fallbackDefineProperty : nativeDefineProperty;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = nativeObjectCreate(SymbolPrototype);
  setInternalState(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!DESCRIPTORS) symbol.description = description;
  return symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject(O);
  var key = toPropertyKey(P);
  anObject(Attributes);
  if (hasOwn(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!hasOwn(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor(1, nativeObjectCreate(null)));
      O[HIDDEN][key] = true;
    } else {
      if (hasOwn(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = nativeObjectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach(keys, function (key) {
    if (!DESCRIPTORS || call($propertyIsEnumerable, properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? nativeObjectCreate(O) : $defineProperties(nativeObjectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPropertyKey(V);
  var enumerable = call(nativePropertyIsEnumerable, this, P);
  if (this === ObjectPrototype && hasOwn(AllSymbols, P) && !hasOwn(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !hasOwn(this, P) || !hasOwn(AllSymbols, P) || hasOwn(this, HIDDEN) && this[HIDDEN][P]
    ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPropertyKey(P);
  if (it === ObjectPrototype && hasOwn(AllSymbols, key) && !hasOwn(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor(it, key);
  if (descriptor && hasOwn(AllSymbols, key) && !(hasOwn(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames(toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (!hasOwn(AllSymbols, key) && !hasOwn(hiddenKeys, key)) push(result, key);
  });
  return result;
};

var $getOwnPropertySymbols = function (O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (hasOwn(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || hasOwn(ObjectPrototype, key))) {
      push(result, AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.es/ecma262/#sec-symbol-constructor
if (!NATIVE_SYMBOL) {
  $Symbol = function Symbol() {
    if (isPrototypeOf(SymbolPrototype, this)) throw new TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : $toString(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      var $this = this === undefined ? global : this;
      if ($this === ObjectPrototype) call(setter, ObjectPrototypeSymbols, value);
      if (hasOwn($this, HIDDEN) && hasOwn($this[HIDDEN], tag)) $this[HIDDEN][tag] = false;
      var descriptor = createPropertyDescriptor(1, value);
      try {
        setSymbolDescriptor($this, tag, descriptor);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        fallbackDefineProperty($this, tag, descriptor);
      }
    };
    if (DESCRIPTORS && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  SymbolPrototype = $Symbol[PROTOTYPE];

  defineBuiltIn(SymbolPrototype, 'toString', function toString() {
    return getInternalState(this).tag;
  });

  defineBuiltIn($Symbol, 'withoutSetter', function (description) {
    return wrap(uid(description), description);
  });

  propertyIsEnumerableModule.f = $propertyIsEnumerable;
  definePropertyModule.f = $defineProperty;
  definePropertiesModule.f = $defineProperties;
  getOwnPropertyDescriptorModule.f = $getOwnPropertyDescriptor;
  getOwnPropertyNamesModule.f = getOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  getOwnPropertySymbolsModule.f = $getOwnPropertySymbols;

  wrappedWellKnownSymbolModule.f = function (name) {
    return wrap(wellKnownSymbol(name), name);
  };

  if (DESCRIPTORS) {
    // https://github.com/tc39/proposal-Symbol-description
    defineBuiltInAccessor(SymbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        return getInternalState(this).description;
      }
    });
    if (!IS_PURE) {
      defineBuiltIn(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }
}

$({ global: true, constructor: true, wrap: true, forced: !NATIVE_SYMBOL, sham: !NATIVE_SYMBOL }, {
  Symbol: $Symbol
});

$forEach(objectKeys(WellKnownSymbolsStore), function (name) {
  defineWellKnownSymbol(name);
});

$({ target: SYMBOL, stat: true, forced: !NATIVE_SYMBOL }, {
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL, sham: !DESCRIPTORS }, {
  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames
});

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
defineSymbolToPrimitive();

// `Symbol.prototype[@@toStringTag]` property
// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys[HIDDEN] = true;

},{"../internals/an-object":6,"../internals/array-iteration":8,"../internals/create-property-descriptor":19,"../internals/define-built-in":22,"../internals/define-built-in-accessor":21,"../internals/descriptors":24,"../internals/export":37,"../internals/fails":38,"../internals/function-call":42,"../internals/function-uncurry-this":46,"../internals/global":52,"../internals/has-own-property":53,"../internals/hidden-keys":54,"../internals/internal-state":61,"../internals/is-pure":70,"../internals/object-create":83,"../internals/object-define-properties":84,"../internals/object-define-property":85,"../internals/object-get-own-property-descriptor":86,"../internals/object-get-own-property-names":88,"../internals/object-get-own-property-names-external":87,"../internals/object-get-own-property-symbols":89,"../internals/object-is-prototype-of":91,"../internals/object-keys":93,"../internals/object-property-is-enumerable":94,"../internals/set-to-string-tag":109,"../internals/shared":112,"../internals/shared-key":110,"../internals/symbol-constructor-detection":116,"../internals/symbol-define-to-primitive":117,"../internals/to-indexed-object":122,"../internals/to-property-key":127,"../internals/to-string":129,"../internals/uid":131,"../internals/well-known-symbol":138,"../internals/well-known-symbol-define":136,"../internals/well-known-symbol-wrapped":137}],155:[function(require,module,exports){
// `Symbol.prototype.description` getter
// https://tc39.es/ecma262/#sec-symbol.prototype.description
'use strict';
var $ = require('../internals/export');
var DESCRIPTORS = require('../internals/descriptors');
var global = require('../internals/global');
var uncurryThis = require('../internals/function-uncurry-this');
var hasOwn = require('../internals/has-own-property');
var isCallable = require('../internals/is-callable');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var toString = require('../internals/to-string');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var copyConstructorProperties = require('../internals/copy-constructor-properties');

var NativeSymbol = global.Symbol;
var SymbolPrototype = NativeSymbol && NativeSymbol.prototype;

if (DESCRIPTORS && isCallable(NativeSymbol) && (!('description' in SymbolPrototype) ||
  // Safari 12 bug
  NativeSymbol().description !== undefined
)) {
  var EmptyStringDescriptionStore = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : toString(arguments[0]);
    var result = isPrototypeOf(SymbolPrototype, this)
      ? new NativeSymbol(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };

  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  SymbolWrapper.prototype = SymbolPrototype;
  SymbolPrototype.constructor = SymbolWrapper;

  var NATIVE_SYMBOL = String(NativeSymbol('description detection')) === 'Symbol(description detection)';
  var thisSymbolValue = uncurryThis(SymbolPrototype.valueOf);
  var symbolDescriptiveString = uncurryThis(SymbolPrototype.toString);
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  var replace = uncurryThis(''.replace);
  var stringSlice = uncurryThis(''.slice);

  defineBuiltInAccessor(SymbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = thisSymbolValue(this);
      if (hasOwn(EmptyStringDescriptionStore, symbol)) return '';
      var string = symbolDescriptiveString(symbol);
      var desc = NATIVE_SYMBOL ? stringSlice(string, 7, -1) : replace(string, regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  $({ global: true, constructor: true, forced: true }, {
    Symbol: SymbolWrapper
  });
}

},{"../internals/copy-constructor-properties":15,"../internals/define-built-in-accessor":21,"../internals/descriptors":24,"../internals/export":37,"../internals/function-uncurry-this":46,"../internals/global":52,"../internals/has-own-property":53,"../internals/is-callable":64,"../internals/object-is-prototype-of":91,"../internals/to-string":129}],156:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getBuiltIn = require('../internals/get-built-in');
var hasOwn = require('../internals/has-own-property');
var toString = require('../internals/to-string');
var shared = require('../internals/shared');
var NATIVE_SYMBOL_REGISTRY = require('../internals/symbol-registry-detection');

var StringToSymbolRegistry = shared('string-to-symbol-registry');
var SymbolToStringRegistry = shared('symbol-to-string-registry');

// `Symbol.for` method
// https://tc39.es/ecma262/#sec-symbol.for
$({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY }, {
  'for': function (key) {
    var string = toString(key);
    if (hasOwn(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = getBuiltIn('Symbol')(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry[symbol] = string;
    return symbol;
  }
});

},{"../internals/export":37,"../internals/get-built-in":47,"../internals/has-own-property":53,"../internals/shared":112,"../internals/symbol-registry-detection":118,"../internals/to-string":129}],157:[function(require,module,exports){
'use strict';
var defineWellKnownSymbol = require('../internals/well-known-symbol-define');

// `Symbol.iterator` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.iterator
defineWellKnownSymbol('iterator');

},{"../internals/well-known-symbol-define":136}],158:[function(require,module,exports){
'use strict';
// TODO: Remove this module from `core-js@4` since it's split to modules listed below
require('../modules/es.symbol.constructor');
require('../modules/es.symbol.for');
require('../modules/es.symbol.key-for');
require('../modules/es.json.stringify');
require('../modules/es.object.get-own-property-symbols');

},{"../modules/es.json.stringify":142,"../modules/es.object.get-own-property-symbols":144,"../modules/es.symbol.constructor":154,"../modules/es.symbol.for":156,"../modules/es.symbol.key-for":159}],159:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var hasOwn = require('../internals/has-own-property');
var isSymbol = require('../internals/is-symbol');
var tryToString = require('../internals/try-to-string');
var shared = require('../internals/shared');
var NATIVE_SYMBOL_REGISTRY = require('../internals/symbol-registry-detection');

var SymbolToStringRegistry = shared('symbol-to-string-registry');

// `Symbol.keyFor` method
// https://tc39.es/ecma262/#sec-symbol.keyfor
$({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY }, {
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw new TypeError(tryToString(sym) + ' is not a symbol');
    if (hasOwn(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  }
});

},{"../internals/export":37,"../internals/has-own-property":53,"../internals/is-symbol":71,"../internals/shared":112,"../internals/symbol-registry-detection":118,"../internals/try-to-string":130}],160:[function(require,module,exports){
'use strict';
var defineWellKnownSymbol = require('../internals/well-known-symbol-define');
var defineSymbolToPrimitive = require('../internals/symbol-define-to-primitive');

// `Symbol.toPrimitive` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.toprimitive
defineWellKnownSymbol('toPrimitive');

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
defineSymbolToPrimitive();

},{"../internals/symbol-define-to-primitive":117,"../internals/well-known-symbol-define":136}],161:[function(require,module,exports){
'use strict';
var global = require('../internals/global');
var DOMIterables = require('../internals/dom-iterables');
var DOMTokenListPrototype = require('../internals/dom-token-list-prototype');
var ArrayIteratorMethods = require('../modules/es.array.iterator');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var setToStringTag = require('../internals/set-to-string-tag');
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');
var ArrayValues = ArrayIteratorMethods.values;

var handlePrototype = function (CollectionPrototype, COLLECTION_NAME) {
  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (error) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    setToStringTag(CollectionPrototype, COLLECTION_NAME, true);
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  handlePrototype(global[COLLECTION_NAME] && global[COLLECTION_NAME].prototype, COLLECTION_NAME);
}

handlePrototype(DOMTokenListPrototype, 'DOMTokenList');

},{"../internals/create-non-enumerable-property":18,"../internals/dom-iterables":26,"../internals/dom-token-list-prototype":27,"../internals/global":52,"../internals/set-to-string-tag":109,"../internals/well-known-symbol":138,"../modules/es.array.iterator":140}],162:[function(require,module,exports){
'use strict';

// å€‹åˆ¥ã®ã‚¹ã‚¯ãƒ¬ã‚¤ãƒ‘ãƒ¼ã‚’ã‚¤ãƒ³ãƒãƒ¼ãƒˆ
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
var _parser = _interopRequireDefault(require("../../../src/scrapers/pc/vendors/www.onitsukatiger.com/parser"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Scraper = exports.default = /*#__PURE__*/function () {
  function Scraper() {
    _classCallCheck(this, Scraper);
  }

  /*
   * è¡¨ç¤ºä¸­ã®å•†å“è©³ç´°ãƒšãƒ¼ã‚¸ã‹ã‚‰å•†å“æƒ…å ±ã‚’æŠ½å‡ºã™ã‚‹
   */
  return _createClass(Scraper, [{
    key: "parse",
    value: function parse() {
      var lang = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      return new Promise(function (resolve, reject) {
        var scraperInstance = new _parser.default(document, lang);
        scraperInstance.parse().then(function (scrapedItem) {
          resolve(scrapedItem);
        }).catch(function (e) {
          reject(e);
        });
      });
    }
  }]);
}();

},{"../../../src/scrapers/pc/vendors/www.onitsukatiger.com/parser":403,"core-js/modules/es.array.iterator.js":140,"core-js/modules/es.date.to-primitive.js":141,"core-js/modules/es.number.constructor.js":143,"core-js/modules/es.object.to-string.js":145,"core-js/modules/es.promise.js":149,"core-js/modules/es.string.iterator.js":153,"core-js/modules/es.symbol.description.js":155,"core-js/modules/es.symbol.iterator.js":157,"core-js/modules/es.symbol.js":158,"core-js/modules/es.symbol.to-primitive.js":160,"core-js/modules/web.dom-collections.iterator.js":161}],163:[function(require,module,exports){
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],164:[function(require,module,exports){
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],165:[function(require,module,exports){
function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
module.exports = _assertThisInitialized, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],166:[function(require,module,exports){
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],167:[function(require,module,exports){
var toPropertyKey = require("./toPropertyKey.js");
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./toPropertyKey.js":177}],168:[function(require,module,exports){
var toPropertyKey = require("./toPropertyKey.js");
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./toPropertyKey.js":177}],169:[function(require,module,exports){
function _getPrototypeOf(t) {
  return module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _getPrototypeOf(t);
}
module.exports = _getPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],170:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf.js");
function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: !0,
      configurable: !0
    }
  }), Object.defineProperty(t, "prototype", {
    writable: !1
  }), e && setPrototypeOf(t, e);
}
module.exports = _inherits, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./setPrototypeOf.js":174}],171:[function(require,module,exports){
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],172:[function(require,module,exports){
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],173:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
var assertThisInitialized = require("./assertThisInitialized.js");
function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return assertThisInitialized(t);
}
module.exports = _possibleConstructorReturn, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./assertThisInitialized.js":165,"./typeof.js":178}],174:[function(require,module,exports){
function _setPrototypeOf(t, e) {
  return module.exports = _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _setPrototypeOf(t, e);
}
module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],175:[function(require,module,exports){
var arrayWithHoles = require("./arrayWithHoles.js");
var iterableToArray = require("./iterableToArray.js");
var unsupportedIterableToArray = require("./unsupportedIterableToArray.js");
var nonIterableRest = require("./nonIterableRest.js");
function _toArray(r) {
  return arrayWithHoles(r) || iterableToArray(r) || unsupportedIterableToArray(r) || nonIterableRest();
}
module.exports = _toArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./arrayWithHoles.js":164,"./iterableToArray.js":171,"./nonIterableRest.js":172,"./unsupportedIterableToArray.js":179}],176:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./typeof.js":178}],177:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
var toPrimitive = require("./toPrimitive.js");
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./toPrimitive.js":176,"./typeof.js":178}],178:[function(require,module,exports){
function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],179:[function(require,module,exports){
var arrayLikeToArray = require("./arrayLikeToArray.js");
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
  }
}
module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./arrayLikeToArray.js":163}],180:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"../internals/is-callable":259,"../internals/try-to-string":335,"dup":1}],181:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"../internals/is-constructor":260,"../internals/try-to-string":335,"dup":2}],182:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"../internals/is-possible-prototype":264,"dup":3}],183:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"../internals/object-create":278,"../internals/object-define-property":280,"../internals/well-known-symbol":343,"dup":4}],184:[function(require,module,exports){
'use strict';
var charAt = require('../internals/string-multibyte').charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.es/ecma262/#sec-advancestringindex
module.exports = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};

},{"../internals/string-multibyte":318}],185:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"../internals/object-is-prototype-of":287,"dup":5}],186:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"../internals/is-object":263,"dup":6}],187:[function(require,module,exports){
'use strict';
// FF26- bug: ArrayBuffers are non-extensible, but Object.isExtensible does not report it
var fails = require('../internals/fails');

module.exports = fails(function () {
  if (typeof ArrayBuffer == 'function') {
    var buffer = new ArrayBuffer(8);
    // eslint-disable-next-line es/no-object-isextensible, es/no-object-defineproperty -- safe
    if (Object.isExtensible(buffer)) Object.defineProperty(buffer, 'a', { value: 8 });
  }
});

},{"../internals/fails":228}],188:[function(require,module,exports){
'use strict';
var $forEach = require('../internals/array-iteration').forEach;
var arrayMethodIsStrict = require('../internals/array-method-is-strict');

var STRICT_METHOD = arrayMethodIsStrict('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.foreach
module.exports = !STRICT_METHOD ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
// eslint-disable-next-line es/no-array-prototype-foreach -- safe
} : [].forEach;

},{"../internals/array-iteration":191,"../internals/array-method-is-strict":193}],189:[function(require,module,exports){
'use strict';
var bind = require('../internals/function-bind-context');
var call = require('../internals/function-call');
var toObject = require('../internals/to-object');
var callWithSafeIterationClosing = require('../internals/call-with-safe-iteration-closing');
var isArrayIteratorMethod = require('../internals/is-array-iterator-method');
var isConstructor = require('../internals/is-constructor');
var lengthOfArrayLike = require('../internals/length-of-array-like');
var createProperty = require('../internals/create-property');
var getIterator = require('../internals/get-iterator');
var getIteratorMethod = require('../internals/get-iterator-method');

var $Array = Array;

// `Array.from` method implementation
// https://tc39.es/ecma262/#sec-array.from
module.exports = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
  var O = toObject(arrayLike);
  var IS_CONSTRUCTOR = isConstructor(this);
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  if (mapping) mapfn = bind(mapfn, argumentsLength > 2 ? arguments[2] : undefined);
  var iteratorMethod = getIteratorMethod(O);
  var index = 0;
  var length, result, step, iterator, next, value;
  // if the target is not iterable or it's an array with the default iterator - use a simple case
  if (iteratorMethod && !(this === $Array && isArrayIteratorMethod(iteratorMethod))) {
    result = IS_CONSTRUCTOR ? new this() : [];
    iterator = getIterator(O, iteratorMethod);
    next = iterator.next;
    for (;!(step = call(next, iterator)).done; index++) {
      value = mapping ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true) : step.value;
      createProperty(result, index, value);
    }
  } else {
    length = lengthOfArrayLike(O);
    result = IS_CONSTRUCTOR ? new this(length) : $Array(length);
    for (;length > index; index++) {
      value = mapping ? mapfn(O[index], index) : O[index];
      createProperty(result, index, value);
    }
  }
  result.length = index;
  return result;
};

},{"../internals/call-with-safe-iteration-closing":197,"../internals/create-property":209,"../internals/function-bind-context":232,"../internals/function-call":235,"../internals/get-iterator":242,"../internals/get-iterator-method":241,"../internals/is-array-iterator-method":257,"../internals/is-constructor":260,"../internals/length-of-array-like":273,"../internals/to-object":330}],190:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"../internals/length-of-array-like":273,"../internals/to-absolute-index":326,"../internals/to-indexed-object":327,"dup":7}],191:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"../internals/array-species-create":196,"../internals/function-bind-context":232,"../internals/function-uncurry-this":239,"../internals/indexed-object":252,"../internals/length-of-array-like":273,"../internals/to-object":330,"dup":8}],192:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var wellKnownSymbol = require('../internals/well-known-symbol');
var V8_VERSION = require('../internals/environment-v8-version');

var SPECIES = wellKnownSymbol('species');

module.exports = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return V8_VERSION >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

},{"../internals/environment-v8-version":225,"../internals/fails":228,"../internals/well-known-symbol":343}],193:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');

module.exports = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call -- required for testing
    method.call(null, argument || function () { return 1; }, 1);
  });
};

},{"../internals/fails":228}],194:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"dup":9}],195:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"../internals/is-array":258,"../internals/is-constructor":260,"../internals/is-object":263,"../internals/well-known-symbol":343,"dup":10}],196:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"../internals/array-species-constructor":195,"dup":11}],197:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');
var iteratorClose = require('../internals/iterator-close');

// call something on iterator step with safe closing on error
module.exports = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  } catch (error) {
    iteratorClose(iterator, 'throw', error);
  }
};

},{"../internals/an-object":186,"../internals/iterator-close":268}],198:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"../internals/well-known-symbol":343,"dup":12}],199:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"dup":13}],200:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../internals/classof-raw":199,"../internals/is-callable":259,"../internals/to-string-tag-support":333,"../internals/well-known-symbol":343,"dup":14}],201:[function(require,module,exports){
'use strict';
var create = require('../internals/object-create');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var defineBuiltIns = require('../internals/define-built-ins');
var bind = require('../internals/function-bind-context');
var anInstance = require('../internals/an-instance');
var isNullOrUndefined = require('../internals/is-null-or-undefined');
var iterate = require('../internals/iterate');
var defineIterator = require('../internals/iterator-define');
var createIterResultObject = require('../internals/create-iter-result-object');
var setSpecies = require('../internals/set-species');
var DESCRIPTORS = require('../internals/descriptors');
var fastKey = require('../internals/internal-metadata').fastKey;
var InternalStateModule = require('../internals/internal-state');

var setInternalState = InternalStateModule.set;
var internalStateGetterFor = InternalStateModule.getterFor;

module.exports = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var Constructor = wrapper(function (that, iterable) {
      anInstance(that, Prototype);
      setInternalState(that, {
        type: CONSTRUCTOR_NAME,
        index: create(null),
        first: null,
        last: null,
        size: 0
      });
      if (!DESCRIPTORS) that.size = 0;
      if (!isNullOrUndefined(iterable)) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
    });

    var Prototype = Constructor.prototype;

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var entry = getEntry(that, key);
      var previous, index;
      // change existing entry
      if (entry) {
        entry.value = value;
      // create new entry
      } else {
        state.last = entry = {
          index: index = fastKey(key, true),
          key: key,
          value: value,
          previous: previous = state.last,
          next: null,
          removed: false
        };
        if (!state.first) state.first = entry;
        if (previous) previous.next = entry;
        if (DESCRIPTORS) state.size++;
        else that.size++;
        // add to index
        if (index !== 'F') state.index[index] = entry;
      } return that;
    };

    var getEntry = function (that, key) {
      var state = getInternalState(that);
      // fast case
      var index = fastKey(key);
      var entry;
      if (index !== 'F') return state.index[index];
      // frozen object case
      for (entry = state.first; entry; entry = entry.next) {
        if (entry.key === key) return entry;
      }
    };

    defineBuiltIns(Prototype, {
      // `{ Map, Set }.prototype.clear()` methods
      // https://tc39.es/ecma262/#sec-map.prototype.clear
      // https://tc39.es/ecma262/#sec-set.prototype.clear
      clear: function clear() {
        var that = this;
        var state = getInternalState(that);
        var entry = state.first;
        while (entry) {
          entry.removed = true;
          if (entry.previous) entry.previous = entry.previous.next = null;
          entry = entry.next;
        }
        state.first = state.last = null;
        state.index = create(null);
        if (DESCRIPTORS) state.size = 0;
        else that.size = 0;
      },
      // `{ Map, Set }.prototype.delete(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.delete
      // https://tc39.es/ecma262/#sec-set.prototype.delete
      'delete': function (key) {
        var that = this;
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.next;
          var prev = entry.previous;
          delete state.index[entry.index];
          entry.removed = true;
          if (prev) prev.next = next;
          if (next) next.previous = prev;
          if (state.first === entry) state.first = next;
          if (state.last === entry) state.last = prev;
          if (DESCRIPTORS) state.size--;
          else that.size--;
        } return !!entry;
      },
      // `{ Map, Set }.prototype.forEach(callbackfn, thisArg = undefined)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.foreach
      // https://tc39.es/ecma262/#sec-set.prototype.foreach
      forEach: function forEach(callbackfn /* , that = undefined */) {
        var state = getInternalState(this);
        var boundFunction = bind(callbackfn, arguments.length > 1 ? arguments[1] : undefined);
        var entry;
        while (entry = entry ? entry.next : state.first) {
          boundFunction(entry.value, entry.key, this);
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous;
        }
      },
      // `{ Map, Set}.prototype.has(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.has
      // https://tc39.es/ecma262/#sec-set.prototype.has
      has: function has(key) {
        return !!getEntry(this, key);
      }
    });

    defineBuiltIns(Prototype, IS_MAP ? {
      // `Map.prototype.get(key)` method
      // https://tc39.es/ecma262/#sec-map.prototype.get
      get: function get(key) {
        var entry = getEntry(this, key);
        return entry && entry.value;
      },
      // `Map.prototype.set(key, value)` method
      // https://tc39.es/ecma262/#sec-map.prototype.set
      set: function set(key, value) {
        return define(this, key === 0 ? 0 : key, value);
      }
    } : {
      // `Set.prototype.add(value)` method
      // https://tc39.es/ecma262/#sec-set.prototype.add
      add: function add(value) {
        return define(this, value = value === 0 ? 0 : value, value);
      }
    });
    if (DESCRIPTORS) defineBuiltInAccessor(Prototype, 'size', {
      configurable: true,
      get: function () {
        return getInternalState(this).size;
      }
    });
    return Constructor;
  },
  setStrong: function (Constructor, CONSTRUCTOR_NAME, IS_MAP) {
    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    var getInternalCollectionState = internalStateGetterFor(CONSTRUCTOR_NAME);
    var getInternalIteratorState = internalStateGetterFor(ITERATOR_NAME);
    // `{ Map, Set }.prototype.{ keys, values, entries, @@iterator }()` methods
    // https://tc39.es/ecma262/#sec-map.prototype.entries
    // https://tc39.es/ecma262/#sec-map.prototype.keys
    // https://tc39.es/ecma262/#sec-map.prototype.values
    // https://tc39.es/ecma262/#sec-map.prototype-@@iterator
    // https://tc39.es/ecma262/#sec-set.prototype.entries
    // https://tc39.es/ecma262/#sec-set.prototype.keys
    // https://tc39.es/ecma262/#sec-set.prototype.values
    // https://tc39.es/ecma262/#sec-set.prototype-@@iterator
    defineIterator(Constructor, CONSTRUCTOR_NAME, function (iterated, kind) {
      setInternalState(this, {
        type: ITERATOR_NAME,
        target: iterated,
        state: getInternalCollectionState(iterated),
        kind: kind,
        last: null
      });
    }, function () {
      var state = getInternalIteratorState(this);
      var kind = state.kind;
      var entry = state.last;
      // revert to the last existing entry
      while (entry && entry.removed) entry = entry.previous;
      // get next entry
      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
        // or finish the iteration
        state.target = null;
        return createIterResultObject(undefined, true);
      }
      // return step by kind
      if (kind === 'keys') return createIterResultObject(entry.key, false);
      if (kind === 'values') return createIterResultObject(entry.value, false);
      return createIterResultObject([entry.key, entry.value], false);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // `{ Map, Set }.prototype[@@species]` accessors
    // https://tc39.es/ecma262/#sec-get-map-@@species
    // https://tc39.es/ecma262/#sec-get-set-@@species
    setSpecies(CONSTRUCTOR_NAME);
  }
};

},{"../internals/an-instance":185,"../internals/create-iter-result-object":206,"../internals/define-built-in-accessor":211,"../internals/define-built-ins":213,"../internals/descriptors":215,"../internals/function-bind-context":232,"../internals/internal-metadata":255,"../internals/internal-state":256,"../internals/is-null-or-undefined":262,"../internals/iterate":267,"../internals/iterator-define":270,"../internals/object-create":278,"../internals/set-species":312}],202:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var defineBuiltIns = require('../internals/define-built-ins');
var getWeakData = require('../internals/internal-metadata').getWeakData;
var anInstance = require('../internals/an-instance');
var anObject = require('../internals/an-object');
var isNullOrUndefined = require('../internals/is-null-or-undefined');
var isObject = require('../internals/is-object');
var iterate = require('../internals/iterate');
var ArrayIterationModule = require('../internals/array-iteration');
var hasOwn = require('../internals/has-own-property');
var InternalStateModule = require('../internals/internal-state');

var setInternalState = InternalStateModule.set;
var internalStateGetterFor = InternalStateModule.getterFor;
var find = ArrayIterationModule.find;
var findIndex = ArrayIterationModule.findIndex;
var splice = uncurryThis([].splice);
var id = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function (state) {
  return state.frozen || (state.frozen = new UncaughtFrozenStore());
};

var UncaughtFrozenStore = function () {
  this.entries = [];
};

var findUncaughtFrozen = function (store, key) {
  return find(store.entries, function (it) {
    return it[0] === key;
  });
};

UncaughtFrozenStore.prototype = {
  get: function (key) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) return entry[1];
  },
  has: function (key) {
    return !!findUncaughtFrozen(this, key);
  },
  set: function (key, value) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) entry[1] = value;
    else this.entries.push([key, value]);
  },
  'delete': function (key) {
    var index = findIndex(this.entries, function (it) {
      return it[0] === key;
    });
    if (~index) splice(this.entries, index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var Constructor = wrapper(function (that, iterable) {
      anInstance(that, Prototype);
      setInternalState(that, {
        type: CONSTRUCTOR_NAME,
        id: id++,
        frozen: null
      });
      if (!isNullOrUndefined(iterable)) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
    });

    var Prototype = Constructor.prototype;

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var data = getWeakData(anObject(key), true);
      if (data === true) uncaughtFrozenStore(state).set(key, value);
      else data[state.id] = value;
      return that;
    };

    defineBuiltIns(Prototype, {
      // `{ WeakMap, WeakSet }.prototype.delete(key)` methods
      // https://tc39.es/ecma262/#sec-weakmap.prototype.delete
      // https://tc39.es/ecma262/#sec-weakset.prototype.delete
      'delete': function (key) {
        var state = getInternalState(this);
        if (!isObject(key)) return false;
        var data = getWeakData(key);
        if (data === true) return uncaughtFrozenStore(state)['delete'](key);
        return data && hasOwn(data, state.id) && delete data[state.id];
      },
      // `{ WeakMap, WeakSet }.prototype.has(key)` methods
      // https://tc39.es/ecma262/#sec-weakmap.prototype.has
      // https://tc39.es/ecma262/#sec-weakset.prototype.has
      has: function has(key) {
        var state = getInternalState(this);
        if (!isObject(key)) return false;
        var data = getWeakData(key);
        if (data === true) return uncaughtFrozenStore(state).has(key);
        return data && hasOwn(data, state.id);
      }
    });

    defineBuiltIns(Prototype, IS_MAP ? {
      // `WeakMap.prototype.get(key)` method
      // https://tc39.es/ecma262/#sec-weakmap.prototype.get
      get: function get(key) {
        var state = getInternalState(this);
        if (isObject(key)) {
          var data = getWeakData(key);
          if (data === true) return uncaughtFrozenStore(state).get(key);
          if (data) return data[state.id];
        }
      },
      // `WeakMap.prototype.set(key, value)` method
      // https://tc39.es/ecma262/#sec-weakmap.prototype.set
      set: function set(key, value) {
        return define(this, key, value);
      }
    } : {
      // `WeakSet.prototype.add(value)` method
      // https://tc39.es/ecma262/#sec-weakset.prototype.add
      add: function add(value) {
        return define(this, value, true);
      }
    });

    return Constructor;
  }
};

},{"../internals/an-instance":185,"../internals/an-object":186,"../internals/array-iteration":191,"../internals/define-built-ins":213,"../internals/function-uncurry-this":239,"../internals/has-own-property":247,"../internals/internal-metadata":255,"../internals/internal-state":256,"../internals/is-null-or-undefined":262,"../internals/is-object":263,"../internals/iterate":267}],203:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var globalThis = require('../internals/global-this');
var uncurryThis = require('../internals/function-uncurry-this');
var isForced = require('../internals/is-forced');
var defineBuiltIn = require('../internals/define-built-in');
var InternalMetadataModule = require('../internals/internal-metadata');
var iterate = require('../internals/iterate');
var anInstance = require('../internals/an-instance');
var isCallable = require('../internals/is-callable');
var isNullOrUndefined = require('../internals/is-null-or-undefined');
var isObject = require('../internals/is-object');
var fails = require('../internals/fails');
var checkCorrectnessOfIteration = require('../internals/check-correctness-of-iteration');
var setToStringTag = require('../internals/set-to-string-tag');
var inheritIfRequired = require('../internals/inherit-if-required');

module.exports = function (CONSTRUCTOR_NAME, wrapper, common) {
  var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
  var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
  var ADDER = IS_MAP ? 'set' : 'add';
  var NativeConstructor = globalThis[CONSTRUCTOR_NAME];
  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
  var Constructor = NativeConstructor;
  var exported = {};

  var fixMethod = function (KEY) {
    var uncurriedNativeMethod = uncurryThis(NativePrototype[KEY]);
    defineBuiltIn(NativePrototype, KEY,
      KEY === 'add' ? function add(value) {
        uncurriedNativeMethod(this, value === 0 ? 0 : value);
        return this;
      } : KEY === 'delete' ? function (key) {
        return IS_WEAK && !isObject(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : KEY === 'get' ? function get(key) {
        return IS_WEAK && !isObject(key) ? undefined : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : KEY === 'has' ? function has(key) {
        return IS_WEAK && !isObject(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : function set(key, value) {
        uncurriedNativeMethod(this, key === 0 ? 0 : key, value);
        return this;
      }
    );
  };

  var REPLACE = isForced(
    CONSTRUCTOR_NAME,
    !isCallable(NativeConstructor) || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
      new NativeConstructor().entries().next();
    }))
  );

  if (REPLACE) {
    // create collection constructor
    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    InternalMetadataModule.enable();
  } else if (isForced(CONSTRUCTOR_NAME, true)) {
    var instance = new Constructor();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) !== instance;
    // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    // eslint-disable-next-line no-new -- required for testing
    var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new NativeConstructor();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });

    if (!ACCEPT_ITERABLES) {
      Constructor = wrapper(function (dummy, iterable) {
        anInstance(dummy, NativePrototype);
        var that = inheritIfRequired(new NativeConstructor(), dummy, Constructor);
        if (!isNullOrUndefined(iterable)) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
        return that;
      });
      Constructor.prototype = NativePrototype;
      NativePrototype.constructor = Constructor;
    }

    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }

    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

    // weak collections should not contains .clear method
    if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
  }

  exported[CONSTRUCTOR_NAME] = Constructor;
  $({ global: true, constructor: true, forced: Constructor !== NativeConstructor }, exported);

  setToStringTag(Constructor, CONSTRUCTOR_NAME);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};

},{"../internals/an-instance":185,"../internals/check-correctness-of-iteration":198,"../internals/define-built-in":212,"../internals/export":227,"../internals/fails":228,"../internals/function-uncurry-this":239,"../internals/global-this":246,"../internals/inherit-if-required":253,"../internals/internal-metadata":255,"../internals/is-callable":259,"../internals/is-forced":261,"../internals/is-null-or-undefined":262,"../internals/is-object":263,"../internals/iterate":267,"../internals/set-to-string-tag":313}],204:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"../internals/has-own-property":247,"../internals/object-define-property":280,"../internals/object-get-own-property-descriptor":281,"../internals/own-keys":294,"dup":15}],205:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"../internals/fails":228,"dup":16}],206:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],207:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"../internals/create-property-descriptor":208,"../internals/descriptors":215,"../internals/object-define-property":280,"dup":18}],208:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],209:[function(require,module,exports){
'use strict';
var DESCRIPTORS = require('../internals/descriptors');
var definePropertyModule = require('../internals/object-define-property');
var createPropertyDescriptor = require('../internals/create-property-descriptor');

module.exports = function (object, key, value) {
  if (DESCRIPTORS) definePropertyModule.f(object, key, createPropertyDescriptor(0, value));
  else object[key] = value;
};

},{"../internals/create-property-descriptor":208,"../internals/descriptors":215,"../internals/object-define-property":280}],210:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/ordinary-to-primitive":293,"dup":20}],211:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"../internals/make-built-in":274,"../internals/object-define-property":280,"dup":21}],212:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"../internals/define-global-property":214,"../internals/is-callable":259,"../internals/make-built-in":274,"../internals/object-define-property":280,"dup":22}],213:[function(require,module,exports){
'use strict';
var defineBuiltIn = require('../internals/define-built-in');

module.exports = function (target, src, options) {
  for (var key in src) defineBuiltIn(target, key, src[key], options);
  return target;
};

},{"../internals/define-built-in":212}],214:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');

// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(globalThis, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    globalThis[key] = value;
  } return value;
};

},{"../internals/global-this":246}],215:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"../internals/fails":228,"dup":24}],216:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var isObject = require('../internals/is-object');

var document = globalThis.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

},{"../internals/global-this":246,"../internals/is-object":263}],217:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],218:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"../internals/document-create-element":216,"dup":27}],219:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36}],220:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/environment-user-agent');

module.exports = /ipad|iphone|ipod/i.test(userAgent) && typeof Pebble != 'undefined';

},{"../internals/environment-user-agent":224}],221:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/environment-user-agent');

// eslint-disable-next-line redos/no-vulnerable -- safe
module.exports = /(?:ipad|iphone|ipod).*applewebkit/i.test(userAgent);

},{"../internals/environment-user-agent":224}],222:[function(require,module,exports){
'use strict';
var ENVIRONMENT = require('../internals/environment');

module.exports = ENVIRONMENT === 'NODE';

},{"../internals/environment":226}],223:[function(require,module,exports){
'use strict';
var userAgent = require('../internals/environment-user-agent');

module.exports = /web0s(?!.*chrome)/i.test(userAgent);

},{"../internals/environment-user-agent":224}],224:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');

var navigator = globalThis.navigator;
var userAgent = navigator && navigator.userAgent;

module.exports = userAgent ? String(userAgent) : '';

},{"../internals/global-this":246}],225:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var userAgent = require('../internals/environment-user-agent');

var process = globalThis.process;
var Deno = globalThis.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;

},{"../internals/environment-user-agent":224,"../internals/global-this":246}],226:[function(require,module,exports){
'use strict';
/* global Bun, Deno -- detection */
var globalThis = require('../internals/global-this');
var userAgent = require('../internals/environment-user-agent');
var classof = require('../internals/classof-raw');

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();

},{"../internals/classof-raw":199,"../internals/environment-user-agent":224,"../internals/global-this":246}],227:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var defineBuiltIn = require('../internals/define-built-in');
var defineGlobalProperty = require('../internals/define-global-property');
var copyConstructorProperties = require('../internals/copy-constructor-properties');
var isForced = require('../internals/is-forced');

/*
  options.target         - name of the target object
  options.global         - target is the global object
  options.stat           - export as static methods of target
  options.proto          - export as prototype methods of target
  options.real           - real prototype method for the `pure` version
  options.forced         - export even if the native feature is available
  options.bind           - bind methods to the target, required for the `pure` version
  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
  options.sham           - add a flag to not completely full polyfills
  options.enumerable     - export as enumerable property
  options.dontCallGetSet - prevent calling a getter on target
  options.name           - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = globalThis;
  } else if (STATIC) {
    target = globalThis[TARGET] || defineGlobalProperty(TARGET, {});
  } else {
    target = globalThis[TARGET] && globalThis[TARGET].prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.dontCallGetSet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};

},{"../internals/copy-constructor-properties":204,"../internals/create-non-enumerable-property":207,"../internals/define-built-in":212,"../internals/define-global-property":214,"../internals/global-this":246,"../internals/is-forced":261,"../internals/object-get-own-property-descriptor":281}],228:[function(require,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"dup":38}],229:[function(require,module,exports){
'use strict';
// TODO: Remove from `core-js@4` since it's moved to entry points
require('../modules/es.regexp.exec');
var call = require('../internals/function-call');
var defineBuiltIn = require('../internals/define-built-in');
var regexpExec = require('../internals/regexp-exec');
var fails = require('../internals/fails');
var wellKnownSymbol = require('../internals/well-known-symbol');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');

var SPECIES = wellKnownSymbol('species');
var RegExpPrototype = RegExp.prototype;

module.exports = function (KEY, exec, FORCED, SHAM) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegExp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) !== 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () {
      execCalled = true;
      return null;
    };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    FORCED
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      var $exec = regexp.exec;
      if ($exec === regexpExec || $exec === RegExpPrototype.exec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: call(nativeRegExpMethod, regexp, str, arg2) };
        }
        return { done: true, value: call(nativeMethod, str, regexp, arg2) };
      }
      return { done: false };
    });

    defineBuiltIn(String.prototype, KEY, methods[0]);
    defineBuiltIn(RegExpPrototype, SYMBOL, methods[1]);
  }

  if (SHAM) createNonEnumerableProperty(RegExpPrototype[SYMBOL], 'sham', true);
};

},{"../internals/create-non-enumerable-property":207,"../internals/define-built-in":212,"../internals/fails":228,"../internals/function-call":235,"../internals/regexp-exec":303,"../internals/well-known-symbol":343,"../modules/es.regexp.exec":364}],230:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-isextensible, es/no-object-preventextensions -- required for testing
  return Object.isExtensible(Object.preventExtensions({}));
});

},{"../internals/fails":228}],231:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es/no-function-prototype-bind, es/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});

},{"../internals/function-bind-native":233}],232:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/function-bind-native":233,"../internals/function-uncurry-this-clause":238,"dup":40}],233:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"../internals/fails":228,"dup":41}],234:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var aCallable = require('../internals/a-callable');
var isObject = require('../internals/is-object');
var hasOwn = require('../internals/has-own-property');
var arraySlice = require('../internals/array-slice');
var NATIVE_BIND = require('../internals/function-bind-native');

var $Function = Function;
var concat = uncurryThis([].concat);
var join = uncurryThis([].join);
var factories = {};

var construct = function (C, argsLength, args) {
  if (!hasOwn(factories, argsLength)) {
    var list = [];
    var i = 0;
    for (; i < argsLength; i++) list[i] = 'a[' + i + ']';
    factories[argsLength] = $Function('C,a', 'return new C(' + join(list, ',') + ')');
  } return factories[argsLength](C, args);
};

// `Function.prototype.bind` method implementation
// https://tc39.es/ecma262/#sec-function.prototype.bind
// eslint-disable-next-line es/no-function-prototype-bind -- detection
module.exports = NATIVE_BIND ? $Function.bind : function bind(that /* , ...args */) {
  var F = aCallable(this);
  var Prototype = F.prototype;
  var partArgs = arraySlice(arguments, 1);
  var boundFunction = function bound(/* args... */) {
    var args = concat(partArgs, arraySlice(arguments));
    return this instanceof boundFunction ? construct(F, args.length, args) : F.apply(that, args);
  };
  if (isObject(Prototype)) boundFunction.prototype = Prototype;
  return boundFunction;
};

},{"../internals/a-callable":180,"../internals/array-slice":194,"../internals/function-bind-native":233,"../internals/function-uncurry-this":239,"../internals/has-own-property":247,"../internals/is-object":263}],235:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var call = Function.prototype.call;
// eslint-disable-next-line es/no-function-prototype-bind -- safe
module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};

},{"../internals/function-bind-native":233}],236:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"../internals/descriptors":215,"../internals/has-own-property":247,"dup":43}],237:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/function-uncurry-this":239,"dup":44}],238:[function(require,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"../internals/classof-raw":199,"../internals/function-uncurry-this":239,"dup":45}],239:[function(require,module,exports){
'use strict';
var NATIVE_BIND = require('../internals/function-bind-native');

var FunctionPrototype = Function.prototype;
var call = FunctionPrototype.call;
// eslint-disable-next-line es/no-function-prototype-bind -- safe
var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
  return function () {
    return call.apply(fn, arguments);
  };
};

},{"../internals/function-bind-native":233}],240:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var isCallable = require('../internals/is-callable');

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(globalThis[namespace]) : globalThis[namespace] && globalThis[namespace][method];
};

},{"../internals/global-this":246,"../internals/is-callable":259}],241:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"../internals/classof":200,"../internals/get-method":244,"../internals/is-null-or-undefined":262,"../internals/iterators":272,"../internals/well-known-symbol":343,"dup":48}],242:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/an-object":186,"../internals/function-call":235,"../internals/get-iterator-method":241,"../internals/try-to-string":335,"dup":49}],243:[function(require,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"../internals/classof-raw":199,"../internals/function-uncurry-this":239,"../internals/is-array":258,"../internals/is-callable":259,"../internals/to-string":334,"dup":50}],244:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/is-null-or-undefined":262,"dup":51}],245:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');
var toObject = require('../internals/to-object');

var floor = Math.floor;
var charAt = uncurryThis(''.charAt);
var replace = uncurryThis(''.replace);
var stringSlice = uncurryThis(''.slice);
// eslint-disable-next-line redos/no-vulnerable -- safe
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

// `GetSubstitution` abstract operation
// https://tc39.es/ecma262/#sec-getsubstitution
module.exports = function (matched, str, position, captures, namedCaptures, replacement) {
  var tailPos = position + matched.length;
  var m = captures.length;
  var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
  if (namedCaptures !== undefined) {
    namedCaptures = toObject(namedCaptures);
    symbols = SUBSTITUTION_SYMBOLS;
  }
  return replace(replacement, symbols, function (match, ch) {
    var capture;
    switch (charAt(ch, 0)) {
      case '$': return '$';
      case '&': return matched;
      case '`': return stringSlice(str, 0, position);
      case "'": return stringSlice(str, tailPos);
      case '<':
        capture = namedCaptures[stringSlice(ch, 1, -1)];
        break;
      default: // \d\d?
        var n = +ch;
        if (n === 0) return match;
        if (n > m) {
          var f = floor(n / 10);
          if (f === 0) return match;
          if (f <= m) return captures[f - 1] === undefined ? charAt(ch, 1) : captures[f - 1] + charAt(ch, 1);
          return match;
        }
        capture = captures[n - 1];
    }
    return capture === undefined ? '' : capture;
  });
};

},{"../internals/function-uncurry-this":239,"../internals/to-object":330}],246:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"dup":52}],247:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"../internals/to-object":330,"dup":53}],248:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],249:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"dup":55}],250:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"../internals/get-built-in":240,"dup":56}],251:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"../internals/descriptors":215,"../internals/document-create-element":216,"../internals/fails":228,"dup":57}],252:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"../internals/classof-raw":199,"../internals/fails":228,"../internals/function-uncurry-this":239,"dup":58}],253:[function(require,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"../internals/is-callable":259,"../internals/is-object":263,"../internals/object-set-prototype-of":291,"dup":59}],254:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"../internals/is-callable":259,"../internals/shared-store":315,"dup":60}],255:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var uncurryThis = require('../internals/function-uncurry-this');
var hiddenKeys = require('../internals/hidden-keys');
var isObject = require('../internals/is-object');
var hasOwn = require('../internals/has-own-property');
var defineProperty = require('../internals/object-define-property').f;
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertyNamesExternalModule = require('../internals/object-get-own-property-names-external');
var isExtensible = require('../internals/object-is-extensible');
var uid = require('../internals/uid');
var FREEZING = require('../internals/freezing');

var REQUIRED = false;
var METADATA = uid('meta');
var id = 0;

var setMetadata = function (it) {
  defineProperty(it, METADATA, { value: {
    objectID: 'O' + id++, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!hasOwn(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!hasOwn(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZING && REQUIRED && isExtensible(it) && !hasOwn(it, METADATA)) setMetadata(it);
  return it;
};

var enable = function () {
  meta.enable = function () { /* empty */ };
  REQUIRED = true;
  var getOwnPropertyNames = getOwnPropertyNamesModule.f;
  var splice = uncurryThis([].splice);
  var test = {};
  test[METADATA] = 1;

  // prevent exposing of metadata key
  if (getOwnPropertyNames(test).length) {
    getOwnPropertyNamesModule.f = function (it) {
      var result = getOwnPropertyNames(it);
      for (var i = 0, length = result.length; i < length; i++) {
        if (result[i] === METADATA) {
          splice(result, i, 1);
          break;
        }
      } return result;
    };

    $({ target: 'Object', stat: true, forced: true }, {
      getOwnPropertyNames: getOwnPropertyNamesExternalModule.f
    });
  }
};

var meta = module.exports = {
  enable: enable,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze
};

hiddenKeys[METADATA] = true;

},{"../internals/export":227,"../internals/freezing":230,"../internals/function-uncurry-this":239,"../internals/has-own-property":247,"../internals/hidden-keys":248,"../internals/is-object":263,"../internals/object-define-property":280,"../internals/object-get-own-property-names":283,"../internals/object-get-own-property-names-external":282,"../internals/object-is-extensible":286,"../internals/uid":336}],256:[function(require,module,exports){
'use strict';
var NATIVE_WEAK_MAP = require('../internals/weak-map-basic-detection');
var globalThis = require('../internals/global-this');
var isObject = require('../internals/is-object');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var hasOwn = require('../internals/has-own-property');
var shared = require('../internals/shared-store');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = globalThis.TypeError;
var WeakMap = globalThis.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  /* eslint-disable no-self-assign -- prototype methods protection */
  store.get = store.get;
  store.has = store.has;
  store.set = store.set;
  /* eslint-enable no-self-assign -- prototype methods protection */
  set = function (it, metadata) {
    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    store.set(it, metadata);
    return metadata;
  };
  get = function (it) {
    return store.get(it) || {};
  };
  has = function (it) {
    return store.has(it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

},{"../internals/create-non-enumerable-property":207,"../internals/global-this":246,"../internals/has-own-property":247,"../internals/hidden-keys":248,"../internals/is-object":263,"../internals/shared-key":314,"../internals/shared-store":315,"../internals/weak-map-basic-detection":340}],257:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"../internals/iterators":272,"../internals/well-known-symbol":343,"dup":62}],258:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"../internals/classof-raw":199,"dup":63}],259:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],260:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"../internals/classof":200,"../internals/fails":228,"../internals/function-uncurry-this":239,"../internals/get-built-in":240,"../internals/inspect-source":254,"../internals/is-callable":259,"dup":65}],261:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"../internals/fails":228,"../internals/is-callable":259,"dup":66}],262:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],263:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"../internals/is-callable":259,"dup":68}],264:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"../internals/is-object":263,"dup":69}],265:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70}],266:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"../internals/get-built-in":240,"../internals/is-callable":259,"../internals/object-is-prototype-of":287,"../internals/use-symbol-as-uid":337,"dup":71}],267:[function(require,module,exports){
'use strict';
var bind = require('../internals/function-bind-context');
var call = require('../internals/function-call');
var anObject = require('../internals/an-object');
var tryToString = require('../internals/try-to-string');
var isArrayIteratorMethod = require('../internals/is-array-iterator-method');
var lengthOfArrayLike = require('../internals/length-of-array-like');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var getIterator = require('../internals/get-iterator');
var getIteratorMethod = require('../internals/get-iterator-method');
var iteratorClose = require('../internals/iterator-close');

var $TypeError = TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_RECORD = !!(options && options.IS_RECORD);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal');
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_RECORD) {
    iterator = iterable.iterator;
  } else if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = IS_RECORD ? iterable.next : iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};

},{"../internals/an-object":186,"../internals/function-bind-context":232,"../internals/function-call":235,"../internals/get-iterator":242,"../internals/get-iterator-method":241,"../internals/is-array-iterator-method":257,"../internals/iterator-close":268,"../internals/length-of-array-like":273,"../internals/object-is-prototype-of":287,"../internals/try-to-string":335}],268:[function(require,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/function-call":235,"../internals/get-method":244,"dup":73}],269:[function(require,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"../internals/create-property-descriptor":208,"../internals/iterators":272,"../internals/iterators-core":271,"../internals/object-create":278,"../internals/set-to-string-tag":313,"dup":74}],270:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"../internals/create-non-enumerable-property":207,"../internals/define-built-in":212,"../internals/export":227,"../internals/function-call":235,"../internals/function-name":236,"../internals/is-callable":259,"../internals/is-pure":265,"../internals/iterator-create-constructor":269,"../internals/iterators":272,"../internals/iterators-core":271,"../internals/object-get-prototype-of":285,"../internals/object-set-prototype-of":291,"../internals/set-to-string-tag":313,"../internals/well-known-symbol":343,"dup":75}],271:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"../internals/define-built-in":212,"../internals/fails":228,"../internals/is-callable":259,"../internals/is-object":263,"../internals/is-pure":265,"../internals/object-create":278,"../internals/object-get-prototype-of":285,"../internals/well-known-symbol":343,"dup":76}],272:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],273:[function(require,module,exports){
arguments[4][78][0].apply(exports,arguments)
},{"../internals/to-length":329,"dup":78}],274:[function(require,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"../internals/descriptors":215,"../internals/fails":228,"../internals/function-name":236,"../internals/function-uncurry-this":239,"../internals/has-own-property":247,"../internals/inspect-source":254,"../internals/internal-state":256,"../internals/is-callable":259,"dup":79}],275:[function(require,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"dup":80}],276:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var safeGetBuiltIn = require('../internals/safe-get-built-in');
var bind = require('../internals/function-bind-context');
var macrotask = require('../internals/task').set;
var Queue = require('../internals/queue');
var IS_IOS = require('../internals/environment-is-ios');
var IS_IOS_PEBBLE = require('../internals/environment-is-ios-pebble');
var IS_WEBOS_WEBKIT = require('../internals/environment-is-webos-webkit');
var IS_NODE = require('../internals/environment-is-node');

var MutationObserver = globalThis.MutationObserver || globalThis.WebKitMutationObserver;
var document = globalThis.document;
var process = globalThis.process;
var Promise = globalThis.Promise;
var microtask = safeGetBuiltIn('queueMicrotask');
var notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!microtask) {
  var queue = new Queue();

  var flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (fn = queue.get()) try {
      fn();
    } catch (error) {
      if (queue.head) notify();
      throw error;
    }
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (!IS_IOS_PEBBLE && Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = bind(promise.then, promise);
    notify = function () {
      then(flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessage
  // - onreadystatechange
  // - setTimeout
  } else {
    // `webpack` dev server bug on IE global methods - use bind(fn, global)
    macrotask = bind(macrotask, globalThis);
    notify = function () {
      macrotask(flush);
    };
  }

  microtask = function (fn) {
    if (!queue.head) notify();
    queue.add(fn);
  };
}

module.exports = microtask;

},{"../internals/environment-is-ios":221,"../internals/environment-is-ios-pebble":220,"../internals/environment-is-node":222,"../internals/environment-is-webos-webkit":223,"../internals/function-bind-context":232,"../internals/global-this":246,"../internals/queue":301,"../internals/safe-get-built-in":311,"../internals/task":324}],277:[function(require,module,exports){
arguments[4][82][0].apply(exports,arguments)
},{"../internals/a-callable":180,"dup":82}],278:[function(require,module,exports){
'use strict';
/* global ActiveXObject -- old IE, WSH */
var anObject = require('../internals/an-object');
var definePropertiesModule = require('../internals/object-define-properties');
var enumBugKeys = require('../internals/enum-bug-keys');
var hiddenKeys = require('../internals/hidden-keys');
var html = require('../internals/html');
var documentCreateElement = require('../internals/document-create-element');
var sharedKey = require('../internals/shared-key');

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  // eslint-disable-next-line no-useless-assignment -- avoid memory leak
  activeXDocument = null;
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es/no-object-create -- safe
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
};

},{"../internals/an-object":186,"../internals/document-create-element":216,"../internals/enum-bug-keys":219,"../internals/hidden-keys":248,"../internals/html":250,"../internals/object-define-properties":279,"../internals/shared-key":314}],279:[function(require,module,exports){
arguments[4][84][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/descriptors":215,"../internals/object-define-property":280,"../internals/object-keys":289,"../internals/to-indexed-object":327,"../internals/v8-prototype-define-bug":338,"dup":84}],280:[function(require,module,exports){
arguments[4][85][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/descriptors":215,"../internals/ie8-dom-define":251,"../internals/to-property-key":332,"../internals/v8-prototype-define-bug":338,"dup":85}],281:[function(require,module,exports){
arguments[4][86][0].apply(exports,arguments)
},{"../internals/create-property-descriptor":208,"../internals/descriptors":215,"../internals/function-call":235,"../internals/has-own-property":247,"../internals/ie8-dom-define":251,"../internals/object-property-is-enumerable":290,"../internals/to-indexed-object":327,"../internals/to-property-key":332,"dup":86}],282:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"../internals/array-slice":194,"../internals/classof-raw":199,"../internals/object-get-own-property-names":283,"../internals/to-indexed-object":327,"dup":87}],283:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"../internals/enum-bug-keys":219,"../internals/object-keys-internal":288,"dup":88}],284:[function(require,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"dup":89}],285:[function(require,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"../internals/correct-prototype-getter":205,"../internals/has-own-property":247,"../internals/is-callable":259,"../internals/shared-key":314,"../internals/to-object":330,"dup":90}],286:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var isObject = require('../internals/is-object');
var classof = require('../internals/classof-raw');
var ARRAY_BUFFER_NON_EXTENSIBLE = require('../internals/array-buffer-non-extensible');

// eslint-disable-next-line es/no-object-isextensible -- safe
var $isExtensible = Object.isExtensible;
var FAILS_ON_PRIMITIVES = fails(function () { $isExtensible(1); });

// `Object.isExtensible` method
// https://tc39.es/ecma262/#sec-object.isextensible
module.exports = (FAILS_ON_PRIMITIVES || ARRAY_BUFFER_NON_EXTENSIBLE) ? function isExtensible(it) {
  if (!isObject(it)) return false;
  if (ARRAY_BUFFER_NON_EXTENSIBLE && classof(it) === 'ArrayBuffer') return false;
  return $isExtensible ? $isExtensible(it) : true;
} : $isExtensible;

},{"../internals/array-buffer-non-extensible":187,"../internals/classof-raw":199,"../internals/fails":228,"../internals/is-object":263}],287:[function(require,module,exports){
arguments[4][91][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"dup":91}],288:[function(require,module,exports){
arguments[4][92][0].apply(exports,arguments)
},{"../internals/array-includes":190,"../internals/function-uncurry-this":239,"../internals/has-own-property":247,"../internals/hidden-keys":248,"../internals/to-indexed-object":327,"dup":92}],289:[function(require,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"../internals/enum-bug-keys":219,"../internals/object-keys-internal":288,"dup":93}],290:[function(require,module,exports){
arguments[4][94][0].apply(exports,arguments)
},{"dup":94}],291:[function(require,module,exports){
arguments[4][95][0].apply(exports,arguments)
},{"../internals/a-possible-prototype":182,"../internals/function-uncurry-this-accessor":237,"../internals/is-object":263,"../internals/require-object-coercible":310,"dup":95}],292:[function(require,module,exports){
arguments[4][96][0].apply(exports,arguments)
},{"../internals/classof":200,"../internals/to-string-tag-support":333,"dup":96}],293:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"../internals/function-call":235,"../internals/is-callable":259,"../internals/is-object":263,"dup":97}],294:[function(require,module,exports){
arguments[4][98][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/function-uncurry-this":239,"../internals/get-built-in":240,"../internals/object-get-own-property-names":283,"../internals/object-get-own-property-symbols":284,"dup":98}],295:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');

module.exports = globalThis;

},{"../internals/global-this":246}],296:[function(require,module,exports){
arguments[4][100][0].apply(exports,arguments)
},{"dup":100}],297:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var isCallable = require('../internals/is-callable');
var isForced = require('../internals/is-forced');
var inspectSource = require('../internals/inspect-source');
var wellKnownSymbol = require('../internals/well-known-symbol');
var ENVIRONMENT = require('../internals/environment');
var IS_PURE = require('../internals/is-pure');
var V8_VERSION = require('../internals/environment-v8-version');

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var SPECIES = wellKnownSymbol('species');
var SUBCLASSING = false;
var NATIVE_PROMISE_REJECTION_EVENT = isCallable(globalThis.PromiseRejectionEvent);

var FORCED_PROMISE_CONSTRUCTOR = isForced('Promise', function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(NativePromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(NativePromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#{ catch, finally } in the pure version for preventing prototype pollution
  if (IS_PURE && !(NativePromisePrototype['catch'] && NativePromisePrototype['finally'])) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (!V8_VERSION || V8_VERSION < 51 || !/native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) {
    // Detect correctness of subclassing with @@species support
    var promise = new NativePromiseConstructor(function (resolve) { resolve(1); });
    var FakePromise = function (exec) {
      exec(function () { /* empty */ }, function () { /* empty */ });
    };
    var constructor = promise.constructor = {};
    constructor[SPECIES] = FakePromise;
    SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
    if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  } return !GLOBAL_CORE_JS_PROMISE && (ENVIRONMENT === 'BROWSER' || ENVIRONMENT === 'DENO') && !NATIVE_PROMISE_REJECTION_EVENT;
});

module.exports = {
  CONSTRUCTOR: FORCED_PROMISE_CONSTRUCTOR,
  REJECTION_EVENT: NATIVE_PROMISE_REJECTION_EVENT,
  SUBCLASSING: SUBCLASSING
};

},{"../internals/environment":226,"../internals/environment-v8-version":225,"../internals/global-this":246,"../internals/inspect-source":254,"../internals/is-callable":259,"../internals/is-forced":261,"../internals/is-pure":265,"../internals/promise-native-constructor":298,"../internals/well-known-symbol":343}],298:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');

module.exports = globalThis.Promise;

},{"../internals/global-this":246}],299:[function(require,module,exports){
arguments[4][103][0].apply(exports,arguments)
},{"../internals/an-object":186,"../internals/is-object":263,"../internals/new-promise-capability":277,"dup":103}],300:[function(require,module,exports){
arguments[4][104][0].apply(exports,arguments)
},{"../internals/check-correctness-of-iteration":198,"../internals/promise-constructor-detection":297,"../internals/promise-native-constructor":298,"dup":104}],301:[function(require,module,exports){
arguments[4][105][0].apply(exports,arguments)
},{"dup":105}],302:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var anObject = require('../internals/an-object');
var isCallable = require('../internals/is-callable');
var classof = require('../internals/classof-raw');
var regexpExec = require('../internals/regexp-exec');

var $TypeError = TypeError;

// `RegExpExec` abstract operation
// https://tc39.es/ecma262/#sec-regexpexec
module.exports = function (R, S) {
  var exec = R.exec;
  if (isCallable(exec)) {
    var result = call(exec, R, S);
    if (result !== null) anObject(result);
    return result;
  }
  if (classof(R) === 'RegExp') return call(regexpExec, R, S);
  throw new $TypeError('RegExp#exec called on incompatible receiver');
};

},{"../internals/an-object":186,"../internals/classof-raw":199,"../internals/function-call":235,"../internals/is-callable":259,"../internals/regexp-exec":303}],303:[function(require,module,exports){
'use strict';
/* eslint-disable regexp/no-empty-capturing-group, regexp/no-empty-group, regexp/no-lazy-ends -- testing */
/* eslint-disable regexp/no-useless-quantifier -- testing */
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var toString = require('../internals/to-string');
var regexpFlags = require('../internals/regexp-flags');
var stickyHelpers = require('../internals/regexp-sticky-helpers');
var shared = require('../internals/shared');
var create = require('../internals/object-create');
var getInternalState = require('../internals/internal-state').get;
var UNSUPPORTED_DOT_ALL = require('../internals/regexp-unsupported-dot-all');
var UNSUPPORTED_NCG = require('../internals/regexp-unsupported-ncg');

var nativeReplace = shared('native-string-replace', String.prototype.replace);
var nativeExec = RegExp.prototype.exec;
var patchedExec = nativeExec;
var charAt = uncurryThis(''.charAt);
var indexOf = uncurryThis(''.indexOf);
var replace = uncurryThis(''.replace);
var stringSlice = uncurryThis(''.slice);

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  call(nativeExec, re1, 'a');
  call(nativeExec, re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

var UNSUPPORTED_Y = stickyHelpers.BROKEN_CARET;

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG;

if (PATCH) {
  patchedExec = function exec(string) {
    var re = this;
    var state = getInternalState(re);
    var str = toString(string);
    var raw = state.raw;
    var result, reCopy, lastIndex, match, i, object, group;

    if (raw) {
      raw.lastIndex = re.lastIndex;
      result = call(patchedExec, raw, str);
      re.lastIndex = raw.lastIndex;
      return result;
    }

    var groups = state.groups;
    var sticky = UNSUPPORTED_Y && re.sticky;
    var flags = call(regexpFlags, re);
    var source = re.source;
    var charsAdded = 0;
    var strCopy = str;

    if (sticky) {
      flags = replace(flags, 'y', '');
      if (indexOf(flags, 'g') === -1) {
        flags += 'g';
      }

      strCopy = stringSlice(str, re.lastIndex);
      // Support anchored sticky behavior.
      if (re.lastIndex > 0 && (!re.multiline || re.multiline && charAt(str, re.lastIndex - 1) !== '\n')) {
        source = '(?: ' + source + ')';
        strCopy = ' ' + strCopy;
        charsAdded++;
      }
      // ^(? + rx + ) is needed, in combination with some str slicing, to
      // simulate the 'y' flag.
      reCopy = new RegExp('^(?:' + source + ')', flags);
    }

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = call(nativeExec, sticky ? reCopy : re, strCopy);

    if (sticky) {
      if (match) {
        match.input = stringSlice(match.input, charsAdded);
        match[0] = stringSlice(match[0], charsAdded);
        match.index = re.lastIndex;
        re.lastIndex += match[0].length;
      } else re.lastIndex = 0;
    } else if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn't work for /(.?)?/
      call(nativeReplace, match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    if (match && groups) {
      match.groups = object = create(null);
      for (i = 0; i < groups.length; i++) {
        group = groups[i];
        object[group[0]] = match[group[1]];
      }
    }

    return match;
  };
}

module.exports = patchedExec;

},{"../internals/function-call":235,"../internals/function-uncurry-this":239,"../internals/internal-state":256,"../internals/object-create":278,"../internals/regexp-flags":305,"../internals/regexp-sticky-helpers":307,"../internals/regexp-unsupported-dot-all":308,"../internals/regexp-unsupported-ncg":309,"../internals/shared":316,"../internals/to-string":334}],304:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var fails = require('../internals/fails');

// babel-minify and Closure Compiler transpiles RegExp('.', 'd') -> /./d and it causes SyntaxError
var RegExp = globalThis.RegExp;

var FLAGS_GETTER_IS_CORRECT = !fails(function () {
  var INDICES_SUPPORT = true;
  try {
    RegExp('.', 'd');
  } catch (error) {
    INDICES_SUPPORT = false;
  }

  var O = {};
  // modern V8 bug
  var calls = '';
  var expected = INDICES_SUPPORT ? 'dgimsy' : 'gimsy';

  var addGetter = function (key, chr) {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty(O, key, { get: function () {
      calls += chr;
      return true;
    } });
  };

  var pairs = {
    dotAll: 's',
    global: 'g',
    ignoreCase: 'i',
    multiline: 'm',
    sticky: 'y'
  };

  if (INDICES_SUPPORT) pairs.hasIndices = 'd';

  for (var key in pairs) addGetter(key, pairs[key]);

  // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
  var result = Object.getOwnPropertyDescriptor(RegExp.prototype, 'flags').get.call(O);

  return result !== expected || calls !== expected;
});

module.exports = { correct: FLAGS_GETTER_IS_CORRECT };

},{"../internals/fails":228,"../internals/global-this":246}],305:[function(require,module,exports){
'use strict';
var anObject = require('../internals/an-object');

// `RegExp.prototype.flags` getter implementation
// https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.hasIndices) result += 'd';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.unicodeSets) result += 'v';
  if (that.sticky) result += 'y';
  return result;
};

},{"../internals/an-object":186}],306:[function(require,module,exports){
'use strict';
var call = require('../internals/function-call');
var hasOwn = require('../internals/has-own-property');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var regExpFlagsDetection = require('../internals/regexp-flags-detection');
var regExpFlagsGetterImplementation = require('../internals/regexp-flags');

var RegExpPrototype = RegExp.prototype;

module.exports = regExpFlagsDetection.correct ? function (it) {
  return it.flags;
} : function (it) {
  return (!regExpFlagsDetection.correct && isPrototypeOf(RegExpPrototype, it) && !hasOwn(it, 'flags'))
    ? call(regExpFlagsGetterImplementation, it)
    : it.flags;
};

},{"../internals/function-call":235,"../internals/has-own-property":247,"../internals/object-is-prototype-of":287,"../internals/regexp-flags":305,"../internals/regexp-flags-detection":304}],307:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var globalThis = require('../internals/global-this');

// babel-minify and Closure Compiler transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
var $RegExp = globalThis.RegExp;

var UNSUPPORTED_Y = fails(function () {
  var re = $RegExp('a', 'y');
  re.lastIndex = 2;
  return re.exec('abcd') !== null;
});

// UC Browser bug
// https://github.com/zloirock/core-js/issues/1008
var MISSED_STICKY = UNSUPPORTED_Y || fails(function () {
  return !$RegExp('a', 'y').sticky;
});

var BROKEN_CARET = UNSUPPORTED_Y || fails(function () {
  // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
  var re = $RegExp('^r', 'gy');
  re.lastIndex = 2;
  return re.exec('str') !== null;
});

module.exports = {
  BROKEN_CARET: BROKEN_CARET,
  MISSED_STICKY: MISSED_STICKY,
  UNSUPPORTED_Y: UNSUPPORTED_Y
};

},{"../internals/fails":228,"../internals/global-this":246}],308:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var globalThis = require('../internals/global-this');

// babel-minify and Closure Compiler transpiles RegExp('.', 's') -> /./s and it causes SyntaxError
var $RegExp = globalThis.RegExp;

module.exports = fails(function () {
  var re = $RegExp('.', 's');
  return !(re.dotAll && re.test('\n') && re.flags === 's');
});

},{"../internals/fails":228,"../internals/global-this":246}],309:[function(require,module,exports){
'use strict';
var fails = require('../internals/fails');
var globalThis = require('../internals/global-this');

// babel-minify and Closure Compiler transpiles RegExp('(?<a>b)', 'g') -> /(?<a>b)/g and it causes SyntaxError
var $RegExp = globalThis.RegExp;

module.exports = fails(function () {
  var re = $RegExp('(?<a>b)', 'g');
  return re.exec('b').groups.a !== 'b' ||
    'b'.replace(re, '$<a>c') !== 'bc';
});

},{"../internals/fails":228,"../internals/global-this":246}],310:[function(require,module,exports){
arguments[4][106][0].apply(exports,arguments)
},{"../internals/is-null-or-undefined":262,"dup":106}],311:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var DESCRIPTORS = require('../internals/descriptors');

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Avoid NodeJS experimental warning
module.exports = function (name) {
  if (!DESCRIPTORS) return globalThis[name];
  var descriptor = getOwnPropertyDescriptor(globalThis, name);
  return descriptor && descriptor.value;
};

},{"../internals/descriptors":215,"../internals/global-this":246}],312:[function(require,module,exports){
arguments[4][108][0].apply(exports,arguments)
},{"../internals/define-built-in-accessor":211,"../internals/descriptors":215,"../internals/get-built-in":240,"../internals/well-known-symbol":343,"dup":108}],313:[function(require,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"../internals/has-own-property":247,"../internals/object-define-property":280,"../internals/well-known-symbol":343,"dup":109}],314:[function(require,module,exports){
arguments[4][110][0].apply(exports,arguments)
},{"../internals/shared":316,"../internals/uid":336,"dup":110}],315:[function(require,module,exports){
'use strict';
var IS_PURE = require('../internals/is-pure');
var globalThis = require('../internals/global-this');
var defineGlobalProperty = require('../internals/define-global-property');

var SHARED = '__core-js_shared__';
var store = module.exports = globalThis[SHARED] || defineGlobalProperty(SHARED, {});

(store.versions || (store.versions = [])).push({
  version: '3.43.0',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: 'Â© 2014-2025 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.43.0/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});

},{"../internals/define-global-property":214,"../internals/global-this":246,"../internals/is-pure":265}],316:[function(require,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"../internals/shared-store":315,"dup":112}],317:[function(require,module,exports){
arguments[4][113][0].apply(exports,arguments)
},{"../internals/a-constructor":181,"../internals/an-object":186,"../internals/is-null-or-undefined":262,"../internals/well-known-symbol":343,"dup":113}],318:[function(require,module,exports){
arguments[4][114][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"../internals/require-object-coercible":310,"../internals/to-integer-or-infinity":328,"../internals/to-string":334,"dup":114}],319:[function(require,module,exports){
'use strict';
var PROPER_FUNCTION_NAME = require('../internals/function-name').PROPER;
var fails = require('../internals/fails');
var whitespaces = require('../internals/whitespaces');

var non = '\u200B\u0085\u180E';

// check that a method works with the correct list
// of whitespaces and has a correct name
module.exports = function (METHOD_NAME) {
  return fails(function () {
    return !!whitespaces[METHOD_NAME]()
      || non[METHOD_NAME]() !== non
      || (PROPER_FUNCTION_NAME && whitespaces[METHOD_NAME].name !== METHOD_NAME);
  });
};

},{"../internals/fails":228,"../internals/function-name":236,"../internals/whitespaces":344}],320:[function(require,module,exports){
arguments[4][115][0].apply(exports,arguments)
},{"../internals/function-uncurry-this":239,"../internals/require-object-coercible":310,"../internals/to-string":334,"../internals/whitespaces":344,"dup":115}],321:[function(require,module,exports){
'use strict';
/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = require('../internals/environment-v8-version');
var fails = require('../internals/fails');
var globalThis = require('../internals/global-this');

var $String = globalThis.String;

// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol('symbol detection');
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  // nb: Do not call `String` directly to avoid this being optimized out to `symbol+''` which will,
  // of course, fail.
  return !$String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});

},{"../internals/environment-v8-version":225,"../internals/fails":228,"../internals/global-this":246}],322:[function(require,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"../internals/define-built-in":212,"../internals/function-call":235,"../internals/get-built-in":240,"../internals/well-known-symbol":343,"dup":117}],323:[function(require,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"../internals/symbol-constructor-detection":321,"dup":118}],324:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var apply = require('../internals/function-apply');
var bind = require('../internals/function-bind-context');
var isCallable = require('../internals/is-callable');
var hasOwn = require('../internals/has-own-property');
var fails = require('../internals/fails');
var html = require('../internals/html');
var arraySlice = require('../internals/array-slice');
var createElement = require('../internals/document-create-element');
var validateArgumentsLength = require('../internals/validate-arguments-length');
var IS_IOS = require('../internals/environment-is-ios');
var IS_NODE = require('../internals/environment-is-node');

var set = globalThis.setImmediate;
var clear = globalThis.clearImmediate;
var process = globalThis.process;
var Dispatch = globalThis.Dispatch;
var Function = globalThis.Function;
var MessageChannel = globalThis.MessageChannel;
var String = globalThis.String;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var $location, defer, channel, port;

fails(function () {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  $location = globalThis.location;
});

var run = function (id) {
  if (hasOwn(queue, id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var eventListener = function (event) {
  run(event.data);
};

var globalPostMessageDefer = function (id) {
  // old engines have not location.origin
  globalThis.postMessage(String(id), $location.protocol + '//' + $location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(handler) {
    validateArgumentsLength(arguments.length, 1);
    var fn = isCallable(handler) ? handler : Function(handler);
    var args = arraySlice(arguments, 1);
    queue[++counter] = function () {
      apply(fn, undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = eventListener;
    defer = bind(port.postMessage, port);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    globalThis.addEventListener &&
    isCallable(globalThis.postMessage) &&
    !globalThis.importScripts &&
    $location && $location.protocol !== 'file:' &&
    !fails(globalPostMessageDefer)
  ) {
    defer = globalPostMessageDefer;
    globalThis.addEventListener('message', eventListener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
};

},{"../internals/array-slice":194,"../internals/document-create-element":216,"../internals/environment-is-ios":221,"../internals/environment-is-node":222,"../internals/fails":228,"../internals/function-apply":231,"../internals/function-bind-context":232,"../internals/global-this":246,"../internals/has-own-property":247,"../internals/html":250,"../internals/is-callable":259,"../internals/validate-arguments-length":339}],325:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

// `thisNumberValue` abstract operation
// https://tc39.es/ecma262/#sec-thisnumbervalue
module.exports = uncurryThis(1.1.valueOf);

},{"../internals/function-uncurry-this":239}],326:[function(require,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"../internals/to-integer-or-infinity":328,"dup":121}],327:[function(require,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"../internals/indexed-object":252,"../internals/require-object-coercible":310,"dup":122}],328:[function(require,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"../internals/math-trunc":275,"dup":123}],329:[function(require,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"../internals/to-integer-or-infinity":328,"dup":124}],330:[function(require,module,exports){
arguments[4][125][0].apply(exports,arguments)
},{"../internals/require-object-coercible":310,"dup":125}],331:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"../internals/function-call":235,"../internals/get-method":244,"../internals/is-object":263,"../internals/is-symbol":266,"../internals/ordinary-to-primitive":293,"../internals/well-known-symbol":343,"dup":126}],332:[function(require,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"../internals/is-symbol":266,"../internals/to-primitive":331,"dup":127}],333:[function(require,module,exports){
arguments[4][128][0].apply(exports,arguments)
},{"../internals/well-known-symbol":343,"dup":128}],334:[function(require,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"../internals/classof":200,"dup":129}],335:[function(require,module,exports){
arguments[4][130][0].apply(exports,arguments)
},{"dup":130}],336:[function(require,module,exports){
'use strict';
var uncurryThis = require('../internals/function-uncurry-this');

var id = 0;
var postfix = Math.random();
var toString = uncurryThis(1.1.toString);

module.exports = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
};

},{"../internals/function-uncurry-this":239}],337:[function(require,module,exports){
'use strict';
/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');

module.exports = NATIVE_SYMBOL &&
  !Symbol.sham &&
  typeof Symbol.iterator == 'symbol';

},{"../internals/symbol-constructor-detection":321}],338:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"../internals/descriptors":215,"../internals/fails":228,"dup":133}],339:[function(require,module,exports){
arguments[4][134][0].apply(exports,arguments)
},{"dup":134}],340:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var isCallable = require('../internals/is-callable');

var WeakMap = globalThis.WeakMap;

module.exports = isCallable(WeakMap) && /native code/.test(String(WeakMap));

},{"../internals/global-this":246,"../internals/is-callable":259}],341:[function(require,module,exports){
arguments[4][136][0].apply(exports,arguments)
},{"../internals/has-own-property":247,"../internals/object-define-property":280,"../internals/path":295,"../internals/well-known-symbol-wrapped":342,"dup":136}],342:[function(require,module,exports){
arguments[4][137][0].apply(exports,arguments)
},{"../internals/well-known-symbol":343,"dup":137}],343:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var shared = require('../internals/shared');
var hasOwn = require('../internals/has-own-property');
var uid = require('../internals/uid');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');
var USE_SYMBOL_AS_UID = require('../internals/use-symbol-as-uid');

var Symbol = globalThis.Symbol;
var WellKnownSymbolsStore = shared('wks');
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol['for'] || Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!hasOwn(WellKnownSymbolsStore, name)) {
    WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol, name)
      ? Symbol[name]
      : createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};

},{"../internals/global-this":246,"../internals/has-own-property":247,"../internals/shared":316,"../internals/symbol-constructor-detection":321,"../internals/uid":336,"../internals/use-symbol-as-uid":337}],344:[function(require,module,exports){
arguments[4][139][0].apply(exports,arguments)
},{"dup":139}],345:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var from = require('../internals/array-from');
var checkCorrectnessOfIteration = require('../internals/check-correctness-of-iteration');

var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function (iterable) {
  // eslint-disable-next-line es/no-array-from -- required for testing
  Array.from(iterable);
});

// `Array.from` method
// https://tc39.es/ecma262/#sec-array.from
$({ target: 'Array', stat: true, forced: INCORRECT_ITERATION }, {
  from: from
});

},{"../internals/array-from":189,"../internals/check-correctness-of-iteration":198,"../internals/export":227}],346:[function(require,module,exports){
'use strict';
var toIndexedObject = require('../internals/to-indexed-object');
var addToUnscopables = require('../internals/add-to-unscopables');
var Iterators = require('../internals/iterators');
var InternalStateModule = require('../internals/internal-state');
var defineProperty = require('../internals/object-define-property').f;
var defineIterator = require('../internals/iterator-define');
var createIterResultObject = require('../internals/create-iter-result-object');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = null;
    return createIterResultObject(undefined, true);
  }
  switch (state.kind) {
    case 'keys': return createIterResultObject(index, false);
    case 'values': return createIterResultObject(target[index], false);
  } return createIterResultObject([index, target[index]], false);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
var values = Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

// V8 ~ Chrome 45- bug
if (!IS_PURE && DESCRIPTORS && values.name !== 'values') try {
  defineProperty(values, 'name', { value: 'values' });
} catch (error) { /* empty */ }

},{"../internals/add-to-unscopables":183,"../internals/create-iter-result-object":206,"../internals/descriptors":215,"../internals/internal-state":256,"../internals/is-pure":265,"../internals/iterator-define":270,"../internals/iterators":272,"../internals/object-define-property":280,"../internals/to-indexed-object":327}],347:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var $map = require('../internals/array-iteration').map;
var arrayMethodHasSpeciesSupport = require('../internals/array-method-has-species-support');

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');

// `Array.prototype.map` method
// https://tc39.es/ecma262/#sec-array.prototype.map
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

},{"../internals/array-iteration":191,"../internals/array-method-has-species-support":192,"../internals/export":227}],348:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var isArray = require('../internals/is-array');
var isConstructor = require('../internals/is-constructor');
var isObject = require('../internals/is-object');
var toAbsoluteIndex = require('../internals/to-absolute-index');
var lengthOfArrayLike = require('../internals/length-of-array-like');
var toIndexedObject = require('../internals/to-indexed-object');
var createProperty = require('../internals/create-property');
var wellKnownSymbol = require('../internals/well-known-symbol');
var arrayMethodHasSpeciesSupport = require('../internals/array-method-has-species-support');
var nativeSlice = require('../internals/array-slice');

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('slice');

var SPECIES = wellKnownSymbol('species');
var $Array = Array;
var max = Math.max;

// `Array.prototype.slice` method
// https://tc39.es/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = lengthOfArrayLike(O);
    var k = toAbsoluteIndex(start, length);
    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (isConstructor(Constructor) && (Constructor === $Array || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === $Array || Constructor === undefined) {
        return nativeSlice(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? $Array : Constructor)(max(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
    result.length = n;
    return result;
  }
});

},{"../internals/array-method-has-species-support":192,"../internals/array-slice":194,"../internals/create-property":209,"../internals/export":227,"../internals/is-array":258,"../internals/is-constructor":260,"../internals/is-object":263,"../internals/length-of-array-like":273,"../internals/to-absolute-index":326,"../internals/to-indexed-object":327,"../internals/well-known-symbol":343}],349:[function(require,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"../internals/date-to-primitive":210,"../internals/define-built-in":212,"../internals/has-own-property":247,"../internals/well-known-symbol":343,"dup":141}],350:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getBuiltIn = require('../internals/get-built-in');
var apply = require('../internals/function-apply');
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var fails = require('../internals/fails');
var isCallable = require('../internals/is-callable');
var isSymbol = require('../internals/is-symbol');
var arraySlice = require('../internals/array-slice');
var getReplacerFunction = require('../internals/get-json-replacer-function');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');

var $String = String;
var $stringify = getBuiltIn('JSON', 'stringify');
var exec = uncurryThis(/./.exec);
var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var replace = uncurryThis(''.replace);
var numberToString = uncurryThis(1.1.toString);

var tester = /[\uD800-\uDFFF]/g;
var low = /^[\uD800-\uDBFF]$/;
var hi = /^[\uDC00-\uDFFF]$/;

var WRONG_SYMBOLS_CONVERSION = !NATIVE_SYMBOL || fails(function () {
  var symbol = getBuiltIn('Symbol')('stringify detection');
  // MS Edge converts symbol values to JSON as {}
  return $stringify([symbol]) !== '[null]'
    // WebKit converts symbol values to JSON as null
    || $stringify({ a: symbol }) !== '{}'
    // V8 throws on boxed symbols
    || $stringify(Object(symbol)) !== '{}';
});

// https://github.com/tc39/proposal-well-formed-stringify
var ILL_FORMED_UNICODE = fails(function () {
  return $stringify('\uDF06\uD834') !== '"\\udf06\\ud834"'
    || $stringify('\uDEAD') !== '"\\udead"';
});

var stringifyWithSymbolsFix = function (it, replacer) {
  var args = arraySlice(arguments);
  var $replacer = getReplacerFunction(replacer);
  if (!isCallable($replacer) && (it === undefined || isSymbol(it))) return; // IE8 returns string on undefined
  args[1] = function (key, value) {
    // some old implementations (like WebKit) could pass numbers as keys
    if (isCallable($replacer)) value = call($replacer, this, $String(key), value);
    if (!isSymbol(value)) return value;
  };
  return apply($stringify, null, args);
};

var fixIllFormed = function (match, offset, string) {
  var prev = charAt(string, offset - 1);
  var next = charAt(string, offset + 1);
  if ((exec(low, match) && !exec(hi, next)) || (exec(hi, match) && !exec(low, prev))) {
    return '\\u' + numberToString(charCodeAt(match, 0), 16);
  } return match;
};

if ($stringify) {
  // `JSON.stringify` method
  // https://tc39.es/ecma262/#sec-json.stringify
  $({ target: 'JSON', stat: true, arity: 3, forced: WRONG_SYMBOLS_CONVERSION || ILL_FORMED_UNICODE }, {
    // eslint-disable-next-line no-unused-vars -- required for `.length`
    stringify: function stringify(it, replacer, space) {
      var args = arraySlice(arguments);
      var result = apply(WRONG_SYMBOLS_CONVERSION ? stringifyWithSymbolsFix : $stringify, null, args);
      return ILL_FORMED_UNICODE && typeof result == 'string' ? replace(result, tester, fixIllFormed) : result;
    }
  });
}

},{"../internals/array-slice":194,"../internals/export":227,"../internals/fails":228,"../internals/function-apply":231,"../internals/function-call":235,"../internals/function-uncurry-this":239,"../internals/get-built-in":240,"../internals/get-json-replacer-function":243,"../internals/is-callable":259,"../internals/is-symbol":266,"../internals/symbol-constructor-detection":321}],351:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');
var globalThis = require('../internals/global-this');
var path = require('../internals/path');
var uncurryThis = require('../internals/function-uncurry-this');
var isForced = require('../internals/is-forced');
var hasOwn = require('../internals/has-own-property');
var inheritIfRequired = require('../internals/inherit-if-required');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var isSymbol = require('../internals/is-symbol');
var toPrimitive = require('../internals/to-primitive');
var fails = require('../internals/fails');
var getOwnPropertyNames = require('../internals/object-get-own-property-names').f;
var getOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var defineProperty = require('../internals/object-define-property').f;
var thisNumberValue = require('../internals/this-number-value');
var trim = require('../internals/string-trim').trim;

var NUMBER = 'Number';
var NativeNumber = globalThis[NUMBER];
var PureNumberNamespace = path[NUMBER];
var NumberPrototype = NativeNumber.prototype;
var TypeError = globalThis.TypeError;
var stringSlice = uncurryThis(''.slice);
var charCodeAt = uncurryThis(''.charCodeAt);

// `ToNumeric` abstract operation
// https://tc39.es/ecma262/#sec-tonumeric
var toNumeric = function (value) {
  var primValue = toPrimitive(value, 'number');
  return typeof primValue == 'bigint' ? primValue : toNumber(primValue);
};

// `ToNumber` abstract operation
// https://tc39.es/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive(argument, 'number');
  var first, third, radix, maxCode, digits, length, index, code;
  if (isSymbol(it)) throw new TypeError('Cannot convert a Symbol value to a number');
  if (typeof it == 'string' && it.length > 2) {
    it = trim(it);
    first = charCodeAt(it, 0);
    if (first === 43 || first === 45) {
      third = charCodeAt(it, 2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (charCodeAt(it, 1)) {
        // fast equal of /^0b[01]+$/i
        case 66:
        case 98:
          radix = 2;
          maxCode = 49;
          break;
        // fast equal of /^0o[0-7]+$/i
        case 79:
        case 111:
          radix = 8;
          maxCode = 55;
          break;
        default:
          return +it;
      }
      digits = stringSlice(it, 2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = charCodeAt(digits, index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

var FORCED = isForced(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'));

var calledWithNew = function (dummy) {
  // includes check on 1..constructor(foo) case
  return isPrototypeOf(NumberPrototype, dummy) && fails(function () { thisNumberValue(dummy); });
};

// `Number` constructor
// https://tc39.es/ecma262/#sec-number-constructor
var NumberWrapper = function Number(value) {
  var n = arguments.length < 1 ? 0 : NativeNumber(toNumeric(value));
  return calledWithNew(this) ? inheritIfRequired(Object(n), this, NumberWrapper) : n;
};

NumberWrapper.prototype = NumberPrototype;
if (FORCED && !IS_PURE) NumberPrototype.constructor = NumberWrapper;

$({ global: true, constructor: true, wrap: true, forced: FORCED }, {
  Number: NumberWrapper
});

// Use `internal/copy-constructor-properties` helper in `core-js@4`
var copyConstructorProperties = function (target, source) {
  for (var keys = DESCRIPTORS ? getOwnPropertyNames(source) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,isFinite,isInteger,isNaN,isSafeInteger,parseFloat,parseInt,' +
    // ESNext
    'fromString,range'
  ).split(','), j = 0, key; keys.length > j; j++) {
    if (hasOwn(source, key = keys[j]) && !hasOwn(target, key)) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};

if (IS_PURE && PureNumberNamespace) copyConstructorProperties(path[NUMBER], PureNumberNamespace);
if (FORCED || IS_PURE) copyConstructorProperties(path[NUMBER], NativeNumber);

},{"../internals/descriptors":215,"../internals/export":227,"../internals/fails":228,"../internals/function-uncurry-this":239,"../internals/global-this":246,"../internals/has-own-property":247,"../internals/inherit-if-required":253,"../internals/is-forced":261,"../internals/is-pure":265,"../internals/is-symbol":266,"../internals/object-define-property":280,"../internals/object-get-own-property-descriptor":281,"../internals/object-get-own-property-names":283,"../internals/object-is-prototype-of":287,"../internals/path":295,"../internals/string-trim":320,"../internals/this-number-value":325,"../internals/to-primitive":331}],352:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var fails = require('../internals/fails');
var toIndexedObject = require('../internals/to-indexed-object');
var nativeGetOwnPropertyDescriptor = require('../internals/object-get-own-property-descriptor').f;
var DESCRIPTORS = require('../internals/descriptors');

var FORCED = !DESCRIPTORS || fails(function () { nativeGetOwnPropertyDescriptor(1); });

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
$({ target: 'Object', stat: true, forced: FORCED, sham: !DESCRIPTORS }, {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    return nativeGetOwnPropertyDescriptor(toIndexedObject(it), key);
  }
});

},{"../internals/descriptors":215,"../internals/export":227,"../internals/fails":228,"../internals/object-get-own-property-descriptor":281,"../internals/to-indexed-object":327}],353:[function(require,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"../internals/export":227,"../internals/fails":228,"../internals/object-get-own-property-symbols":284,"../internals/symbol-constructor-detection":321,"../internals/to-object":330,"dup":144}],354:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var fails = require('../internals/fails');
var toObject = require('../internals/to-object');
var nativeGetPrototypeOf = require('../internals/object-get-prototype-of');
var CORRECT_PROTOTYPE_GETTER = require('../internals/correct-prototype-getter');

var FAILS_ON_PRIMITIVES = fails(function () { nativeGetPrototypeOf(1); });

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
$({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES, sham: !CORRECT_PROTOTYPE_GETTER }, {
  getPrototypeOf: function getPrototypeOf(it) {
    return nativeGetPrototypeOf(toObject(it));
  }
});


},{"../internals/correct-prototype-getter":205,"../internals/export":227,"../internals/fails":228,"../internals/object-get-prototype-of":285,"../internals/to-object":330}],355:[function(require,module,exports){
arguments[4][145][0].apply(exports,arguments)
},{"../internals/define-built-in":212,"../internals/object-to-string":292,"../internals/to-string-tag-support":333,"dup":145}],356:[function(require,module,exports){
arguments[4][146][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/export":227,"../internals/function-call":235,"../internals/iterate":267,"../internals/new-promise-capability":277,"../internals/perform":296,"../internals/promise-statics-incorrect-iteration":300,"dup":146}],357:[function(require,module,exports){
arguments[4][147][0].apply(exports,arguments)
},{"../internals/define-built-in":212,"../internals/export":227,"../internals/get-built-in":240,"../internals/is-callable":259,"../internals/is-pure":265,"../internals/promise-constructor-detection":297,"../internals/promise-native-constructor":298,"dup":147}],358:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var IS_PURE = require('../internals/is-pure');
var IS_NODE = require('../internals/environment-is-node');
var globalThis = require('../internals/global-this');
var path = require('../internals/path');
var call = require('../internals/function-call');
var defineBuiltIn = require('../internals/define-built-in');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var setToStringTag = require('../internals/set-to-string-tag');
var setSpecies = require('../internals/set-species');
var aCallable = require('../internals/a-callable');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var anInstance = require('../internals/an-instance');
var speciesConstructor = require('../internals/species-constructor');
var task = require('../internals/task').set;
var microtask = require('../internals/microtask');
var hostReportErrors = require('../internals/host-report-errors');
var perform = require('../internals/perform');
var Queue = require('../internals/queue');
var InternalStateModule = require('../internals/internal-state');
var NativePromiseConstructor = require('../internals/promise-native-constructor');
var PromiseConstructorDetection = require('../internals/promise-constructor-detection');
var newPromiseCapabilityModule = require('../internals/new-promise-capability');

var PROMISE = 'Promise';
var FORCED_PROMISE_CONSTRUCTOR = PromiseConstructorDetection.CONSTRUCTOR;
var NATIVE_PROMISE_REJECTION_EVENT = PromiseConstructorDetection.REJECTION_EVENT;
var NATIVE_PROMISE_SUBCLASSING = PromiseConstructorDetection.SUBCLASSING;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var setInternalState = InternalStateModule.set;
var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var PromiseConstructor = NativePromiseConstructor;
var PromisePrototype = NativePromisePrototype;
var TypeError = globalThis.TypeError;
var document = globalThis.document;
var process = globalThis.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;

var DISPATCH_EVENT = !!(document && document.createEvent && globalThis.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;

var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && isCallable(then = it.then) ? then : false;
};

var callReaction = function (reaction, state) {
  var value = state.value;
  var ok = state.state === FULFILLED;
  var handler = ok ? reaction.ok : reaction.fail;
  var resolve = reaction.resolve;
  var reject = reaction.reject;
  var domain = reaction.domain;
  var result, then, exited;
  try {
    if (handler) {
      if (!ok) {
        if (state.rejection === UNHANDLED) onHandleUnhandled(state);
        state.rejection = HANDLED;
      }
      if (handler === true) result = value;
      else {
        if (domain) domain.enter();
        result = handler(value); // can throw
        if (domain) {
          domain.exit();
          exited = true;
        }
      }
      if (result === reaction.promise) {
        reject(new TypeError('Promise-chain cycle'));
      } else if (then = isThenable(result)) {
        call(then, result, resolve, reject);
      } else resolve(result);
    } else reject(value);
  } catch (error) {
    if (domain && !exited) domain.exit();
    reject(error);
  }
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  microtask(function () {
    var reactions = state.reactions;
    var reaction;
    while (reaction = reactions.get()) {
      callReaction(reaction, state);
    }
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    globalThis.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_PROMISE_REJECTION_EVENT && (handler = globalThis['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw new TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          call(then, value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED_PROMISE_CONSTRUCTOR) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromisePrototype);
    aCallable(executor);
    call(Internal, this);
    var state = getInternalPromiseState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };

  PromisePrototype = PromiseConstructor.prototype;

  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: new Queue(),
      rejection: false,
      state: PENDING,
      value: null
    });
  };

  // `Promise.prototype.then` method
  // https://tc39.es/ecma262/#sec-promise.prototype.then
  Internal.prototype = defineBuiltIn(PromisePrototype, 'then', function then(onFulfilled, onRejected) {
    var state = getInternalPromiseState(this);
    var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
    state.parent = true;
    reaction.ok = isCallable(onFulfilled) ? onFulfilled : true;
    reaction.fail = isCallable(onRejected) && onRejected;
    reaction.domain = IS_NODE ? process.domain : undefined;
    if (state.state === PENDING) state.reactions.add(reaction);
    else microtask(function () {
      callReaction(reaction, state);
    });
    return reaction.promise;
  });

  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalPromiseState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };

  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && isCallable(NativePromiseConstructor) && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!NATIVE_PROMISE_SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      defineBuiltIn(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          call(nativeThen, that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromisePrototype);
    }
  }
}

// `Promise` constructor
// https://tc39.es/ecma262/#sec-promise-executor
$({ global: true, constructor: true, wrap: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  Promise: PromiseConstructor
});

PromiseWrapper = path.Promise;

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);

},{"../internals/a-callable":180,"../internals/an-instance":185,"../internals/define-built-in":212,"../internals/environment-is-node":222,"../internals/export":227,"../internals/function-call":235,"../internals/global-this":246,"../internals/host-report-errors":249,"../internals/internal-state":256,"../internals/is-callable":259,"../internals/is-object":263,"../internals/is-pure":265,"../internals/microtask":276,"../internals/new-promise-capability":277,"../internals/object-set-prototype-of":291,"../internals/path":295,"../internals/perform":296,"../internals/promise-constructor-detection":297,"../internals/promise-native-constructor":298,"../internals/queue":301,"../internals/set-species":312,"../internals/set-to-string-tag":313,"../internals/species-constructor":317,"../internals/task":324}],359:[function(require,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"../modules/es.promise.all":356,"../modules/es.promise.catch":357,"../modules/es.promise.constructor":358,"../modules/es.promise.race":360,"../modules/es.promise.reject":361,"../modules/es.promise.resolve":362,"dup":149}],360:[function(require,module,exports){
arguments[4][150][0].apply(exports,arguments)
},{"../internals/a-callable":180,"../internals/export":227,"../internals/function-call":235,"../internals/iterate":267,"../internals/new-promise-capability":277,"../internals/perform":296,"../internals/promise-statics-incorrect-iteration":300,"dup":150}],361:[function(require,module,exports){
arguments[4][151][0].apply(exports,arguments)
},{"../internals/export":227,"../internals/new-promise-capability":277,"../internals/promise-constructor-detection":297,"dup":151}],362:[function(require,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"../internals/export":227,"../internals/get-built-in":240,"../internals/is-pure":265,"../internals/promise-constructor-detection":297,"../internals/promise-native-constructor":298,"../internals/promise-resolve":299,"dup":152}],363:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var getBuiltIn = require('../internals/get-built-in');
var apply = require('../internals/function-apply');
var bind = require('../internals/function-bind');
var aConstructor = require('../internals/a-constructor');
var anObject = require('../internals/an-object');
var isObject = require('../internals/is-object');
var create = require('../internals/object-create');
var fails = require('../internals/fails');

var nativeConstruct = getBuiltIn('Reflect', 'construct');
var ObjectPrototype = Object.prototype;
var push = [].push;

// `Reflect.construct` method
// https://tc39.es/ecma262/#sec-reflect.construct
// MS Edge supports only 2 arguments and argumentsList argument is optional
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
var NEW_TARGET_BUG = fails(function () {
  function F() { /* empty */ }
  return !(nativeConstruct(function () { /* empty */ }, [], F) instanceof F);
});

var ARGS_BUG = !fails(function () {
  nativeConstruct(function () { /* empty */ });
});

var FORCED = NEW_TARGET_BUG || ARGS_BUG;

$({ target: 'Reflect', stat: true, forced: FORCED, sham: FORCED }, {
  construct: function construct(Target, args /* , newTarget */) {
    aConstructor(Target);
    anObject(args);
    var newTarget = arguments.length < 3 ? Target : aConstructor(arguments[2]);
    if (ARGS_BUG && !NEW_TARGET_BUG) return nativeConstruct(Target, args, newTarget);
    if (Target === newTarget) {
      // w/o altered newTarget, optimization for 0-4 arguments
      switch (args.length) {
        case 0: return new Target();
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      apply(push, $args, args);
      return new (apply(bind, Target, $args))();
    }
    // with altered newTarget, not support built-in constructors
    var proto = newTarget.prototype;
    var instance = create(isObject(proto) ? proto : ObjectPrototype);
    var result = apply(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});

},{"../internals/a-constructor":181,"../internals/an-object":186,"../internals/export":227,"../internals/fails":228,"../internals/function-apply":231,"../internals/function-bind":234,"../internals/get-built-in":240,"../internals/is-object":263,"../internals/object-create":278}],364:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var exec = require('../internals/regexp-exec');

// `RegExp.prototype.exec` method
// https://tc39.es/ecma262/#sec-regexp.prototype.exec
$({ target: 'RegExp', proto: true, forced: /./.exec !== exec }, {
  exec: exec
});

},{"../internals/export":227,"../internals/regexp-exec":303}],365:[function(require,module,exports){
'use strict';
var PROPER_FUNCTION_NAME = require('../internals/function-name').PROPER;
var defineBuiltIn = require('../internals/define-built-in');
var anObject = require('../internals/an-object');
var $toString = require('../internals/to-string');
var fails = require('../internals/fails');
var getRegExpFlags = require('../internals/regexp-get-flags');

var TO_STRING = 'toString';
var RegExpPrototype = RegExp.prototype;
var nativeToString = RegExpPrototype[TO_STRING];

var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) !== '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME = PROPER_FUNCTION_NAME && nativeToString.name !== TO_STRING;

// `RegExp.prototype.toString` method
// https://tc39.es/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC || INCORRECT_NAME) {
  defineBuiltIn(RegExpPrototype, TO_STRING, function toString() {
    var R = anObject(this);
    var pattern = $toString(R.source);
    var flags = $toString(getRegExpFlags(R));
    return '/' + pattern + '/' + flags;
  }, { unsafe: true });
}

},{"../internals/an-object":186,"../internals/define-built-in":212,"../internals/fails":228,"../internals/function-name":236,"../internals/regexp-get-flags":306,"../internals/to-string":334}],366:[function(require,module,exports){
'use strict';
var collection = require('../internals/collection');
var collectionStrong = require('../internals/collection-strong');

// `Set` constructor
// https://tc39.es/ecma262/#sec-set-objects
collection('Set', function (init) {
  return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);

},{"../internals/collection":203,"../internals/collection-strong":201}],367:[function(require,module,exports){
'use strict';
// TODO: Remove this module from `core-js@4` since it's replaced to module below
require('../modules/es.set.constructor');

},{"../modules/es.set.constructor":366}],368:[function(require,module,exports){
arguments[4][153][0].apply(exports,arguments)
},{"../internals/create-iter-result-object":206,"../internals/internal-state":256,"../internals/iterator-define":270,"../internals/string-multibyte":318,"../internals/to-string":334,"dup":153}],369:[function(require,module,exports){
'use strict';
var apply = require('../internals/function-apply');
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var fixRegExpWellKnownSymbolLogic = require('../internals/fix-regexp-well-known-symbol-logic');
var fails = require('../internals/fails');
var anObject = require('../internals/an-object');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var toIntegerOrInfinity = require('../internals/to-integer-or-infinity');
var toLength = require('../internals/to-length');
var toString = require('../internals/to-string');
var requireObjectCoercible = require('../internals/require-object-coercible');
var advanceStringIndex = require('../internals/advance-string-index');
var getMethod = require('../internals/get-method');
var getSubstitution = require('../internals/get-substitution');
var getRegExpFlags = require('../internals/regexp-get-flags');
var regExpExec = require('../internals/regexp-exec-abstract');
var wellKnownSymbol = require('../internals/well-known-symbol');

var REPLACE = wellKnownSymbol('replace');
var max = Math.max;
var min = Math.min;
var concat = uncurryThis([].concat);
var push = uncurryThis([].push);
var stringIndexOf = uncurryThis(''.indexOf);
var stringSlice = uncurryThis(''.slice);

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
  return 'a'.replace(/./, '$0') === '$0';
})();

// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  // eslint-disable-next-line regexp/no-useless-dollar-replacements -- false positive
  return ''.replace(re, '$<a>') !== '7';
});

// @@replace logic
fixRegExpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
  var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

  return [
    // `String.prototype.replace` method
    // https://tc39.es/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = isObject(searchValue) ? getMethod(searchValue, REPLACE) : undefined;
      return replacer
        ? call(replacer, searchValue, O, replaceValue)
        : call(nativeReplace, toString(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
    function (string, replaceValue) {
      var rx = anObject(this);
      var S = toString(string);

      if (
        typeof replaceValue == 'string' &&
        stringIndexOf(replaceValue, UNSAFE_SUBSTITUTE) === -1 &&
        stringIndexOf(replaceValue, '$<') === -1
      ) {
        var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
        if (res.done) return res.value;
      }

      var functionalReplace = isCallable(replaceValue);
      if (!functionalReplace) replaceValue = toString(replaceValue);

      var flags = toString(getRegExpFlags(rx));
      var global = stringIndexOf(flags, 'g') !== -1;
      var fullUnicode;
      if (global) {
        fullUnicode = stringIndexOf(flags, 'u') !== -1;
        rx.lastIndex = 0;
      }

      var results = [];
      var result;
      while (true) {
        result = regExpExec(rx, S);
        if (result === null) break;

        push(results, result);
        if (!global) break;

        var matchStr = toString(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = toString(result[0]);
        var position = max(min(toIntegerOrInfinity(result.index), S.length), 0);
        var captures = [];
        var replacement;
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) push(captures, maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = concat([matched], captures, position, S);
          if (namedCaptures !== undefined) push(replacerArgs, namedCaptures);
          replacement = toString(apply(replaceValue, undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += stringSlice(S, nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }

      return accumulatedResult + stringSlice(S, nextSourcePosition);
    }
  ];
}, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);

},{"../internals/advance-string-index":184,"../internals/an-object":186,"../internals/fails":228,"../internals/fix-regexp-well-known-symbol-logic":229,"../internals/function-apply":231,"../internals/function-call":235,"../internals/function-uncurry-this":239,"../internals/get-method":244,"../internals/get-substitution":245,"../internals/is-callable":259,"../internals/is-object":263,"../internals/regexp-exec-abstract":302,"../internals/regexp-get-flags":306,"../internals/require-object-coercible":310,"../internals/to-integer-or-infinity":328,"../internals/to-length":329,"../internals/to-string":334,"../internals/well-known-symbol":343}],370:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var $trim = require('../internals/string-trim').trim;
var forcedStringTrimMethod = require('../internals/string-trim-forced');

// `String.prototype.trim` method
// https://tc39.es/ecma262/#sec-string.prototype.trim
$({ target: 'String', proto: true, forced: forcedStringTrimMethod('trim') }, {
  trim: function trim() {
    return $trim(this);
  }
});

},{"../internals/export":227,"../internals/string-trim":320,"../internals/string-trim-forced":319}],371:[function(require,module,exports){
'use strict';
var $ = require('../internals/export');
var globalThis = require('../internals/global-this');
var call = require('../internals/function-call');
var uncurryThis = require('../internals/function-uncurry-this');
var IS_PURE = require('../internals/is-pure');
var DESCRIPTORS = require('../internals/descriptors');
var NATIVE_SYMBOL = require('../internals/symbol-constructor-detection');
var fails = require('../internals/fails');
var hasOwn = require('../internals/has-own-property');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var anObject = require('../internals/an-object');
var toIndexedObject = require('../internals/to-indexed-object');
var toPropertyKey = require('../internals/to-property-key');
var $toString = require('../internals/to-string');
var createPropertyDescriptor = require('../internals/create-property-descriptor');
var nativeObjectCreate = require('../internals/object-create');
var objectKeys = require('../internals/object-keys');
var getOwnPropertyNamesModule = require('../internals/object-get-own-property-names');
var getOwnPropertyNamesExternal = require('../internals/object-get-own-property-names-external');
var getOwnPropertySymbolsModule = require('../internals/object-get-own-property-symbols');
var getOwnPropertyDescriptorModule = require('../internals/object-get-own-property-descriptor');
var definePropertyModule = require('../internals/object-define-property');
var definePropertiesModule = require('../internals/object-define-properties');
var propertyIsEnumerableModule = require('../internals/object-property-is-enumerable');
var defineBuiltIn = require('../internals/define-built-in');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var shared = require('../internals/shared');
var sharedKey = require('../internals/shared-key');
var hiddenKeys = require('../internals/hidden-keys');
var uid = require('../internals/uid');
var wellKnownSymbol = require('../internals/well-known-symbol');
var wrappedWellKnownSymbolModule = require('../internals/well-known-symbol-wrapped');
var defineWellKnownSymbol = require('../internals/well-known-symbol-define');
var defineSymbolToPrimitive = require('../internals/symbol-define-to-primitive');
var setToStringTag = require('../internals/set-to-string-tag');
var InternalStateModule = require('../internals/internal-state');
var $forEach = require('../internals/array-iteration').forEach;

var HIDDEN = sharedKey('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE = 'prototype';

var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(SYMBOL);

var ObjectPrototype = Object[PROTOTYPE];
var $Symbol = globalThis.Symbol;
var SymbolPrototype = $Symbol && $Symbol[PROTOTYPE];
var RangeError = globalThis.RangeError;
var TypeError = globalThis.TypeError;
var QObject = globalThis.QObject;
var nativeGetOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
var nativeDefineProperty = definePropertyModule.f;
var nativeGetOwnPropertyNames = getOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable = propertyIsEnumerableModule.f;
var push = uncurryThis([].push);

var AllSymbols = shared('symbols');
var ObjectPrototypeSymbols = shared('op-symbols');
var WellKnownSymbolsStore = shared('wks');

// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var fallbackDefineProperty = function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor(ObjectPrototype, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
  nativeDefineProperty(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    nativeDefineProperty(ObjectPrototype, P, ObjectPrototypeDescriptor);
  }
};

var setSymbolDescriptor = DESCRIPTORS && fails(function () {
  return nativeObjectCreate(nativeDefineProperty({}, 'a', {
    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
  })).a !== 7;
}) ? fallbackDefineProperty : nativeDefineProperty;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = nativeObjectCreate(SymbolPrototype);
  setInternalState(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!DESCRIPTORS) symbol.description = description;
  return symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject(O);
  var key = toPropertyKey(P);
  anObject(Attributes);
  if (hasOwn(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!hasOwn(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor(1, nativeObjectCreate(null)));
      O[HIDDEN][key] = true;
    } else {
      if (hasOwn(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = nativeObjectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach(keys, function (key) {
    if (!DESCRIPTORS || call($propertyIsEnumerable, properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? nativeObjectCreate(O) : $defineProperties(nativeObjectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPropertyKey(V);
  var enumerable = call(nativePropertyIsEnumerable, this, P);
  if (this === ObjectPrototype && hasOwn(AllSymbols, P) && !hasOwn(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !hasOwn(this, P) || !hasOwn(AllSymbols, P) || hasOwn(this, HIDDEN) && this[HIDDEN][P]
    ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPropertyKey(P);
  if (it === ObjectPrototype && hasOwn(AllSymbols, key) && !hasOwn(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor(it, key);
  if (descriptor && hasOwn(AllSymbols, key) && !(hasOwn(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames(toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (!hasOwn(AllSymbols, key) && !hasOwn(hiddenKeys, key)) push(result, key);
  });
  return result;
};

var $getOwnPropertySymbols = function (O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (hasOwn(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || hasOwn(ObjectPrototype, key))) {
      push(result, AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.es/ecma262/#sec-symbol-constructor
if (!NATIVE_SYMBOL) {
  $Symbol = function Symbol() {
    if (isPrototypeOf(SymbolPrototype, this)) throw new TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : $toString(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      var $this = this === undefined ? globalThis : this;
      if ($this === ObjectPrototype) call(setter, ObjectPrototypeSymbols, value);
      if (hasOwn($this, HIDDEN) && hasOwn($this[HIDDEN], tag)) $this[HIDDEN][tag] = false;
      var descriptor = createPropertyDescriptor(1, value);
      try {
        setSymbolDescriptor($this, tag, descriptor);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        fallbackDefineProperty($this, tag, descriptor);
      }
    };
    if (DESCRIPTORS && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  SymbolPrototype = $Symbol[PROTOTYPE];

  defineBuiltIn(SymbolPrototype, 'toString', function toString() {
    return getInternalState(this).tag;
  });

  defineBuiltIn($Symbol, 'withoutSetter', function (description) {
    return wrap(uid(description), description);
  });

  propertyIsEnumerableModule.f = $propertyIsEnumerable;
  definePropertyModule.f = $defineProperty;
  definePropertiesModule.f = $defineProperties;
  getOwnPropertyDescriptorModule.f = $getOwnPropertyDescriptor;
  getOwnPropertyNamesModule.f = getOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  getOwnPropertySymbolsModule.f = $getOwnPropertySymbols;

  wrappedWellKnownSymbolModule.f = function (name) {
    return wrap(wellKnownSymbol(name), name);
  };

  if (DESCRIPTORS) {
    // https://github.com/tc39/proposal-Symbol-description
    defineBuiltInAccessor(SymbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        return getInternalState(this).description;
      }
    });
    if (!IS_PURE) {
      defineBuiltIn(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }
}

$({ global: true, constructor: true, wrap: true, forced: !NATIVE_SYMBOL, sham: !NATIVE_SYMBOL }, {
  Symbol: $Symbol
});

$forEach(objectKeys(WellKnownSymbolsStore), function (name) {
  defineWellKnownSymbol(name);
});

$({ target: SYMBOL, stat: true, forced: !NATIVE_SYMBOL }, {
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL, sham: !DESCRIPTORS }, {
  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames
});

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
defineSymbolToPrimitive();

// `Symbol.prototype[@@toStringTag]` property
// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys[HIDDEN] = true;

},{"../internals/an-object":186,"../internals/array-iteration":191,"../internals/create-property-descriptor":208,"../internals/define-built-in":212,"../internals/define-built-in-accessor":211,"../internals/descriptors":215,"../internals/export":227,"../internals/fails":228,"../internals/function-call":235,"../internals/function-uncurry-this":239,"../internals/global-this":246,"../internals/has-own-property":247,"../internals/hidden-keys":248,"../internals/internal-state":256,"../internals/is-pure":265,"../internals/object-create":278,"../internals/object-define-properties":279,"../internals/object-define-property":280,"../internals/object-get-own-property-descriptor":281,"../internals/object-get-own-property-names":283,"../internals/object-get-own-property-names-external":282,"../internals/object-get-own-property-symbols":284,"../internals/object-is-prototype-of":287,"../internals/object-keys":289,"../internals/object-property-is-enumerable":290,"../internals/set-to-string-tag":313,"../internals/shared":316,"../internals/shared-key":314,"../internals/symbol-constructor-detection":321,"../internals/symbol-define-to-primitive":322,"../internals/to-indexed-object":327,"../internals/to-property-key":332,"../internals/to-string":334,"../internals/uid":336,"../internals/well-known-symbol":343,"../internals/well-known-symbol-define":341,"../internals/well-known-symbol-wrapped":342}],372:[function(require,module,exports){
// `Symbol.prototype.description` getter
// https://tc39.es/ecma262/#sec-symbol.prototype.description
'use strict';
var $ = require('../internals/export');
var DESCRIPTORS = require('../internals/descriptors');
var globalThis = require('../internals/global-this');
var uncurryThis = require('../internals/function-uncurry-this');
var hasOwn = require('../internals/has-own-property');
var isCallable = require('../internals/is-callable');
var isPrototypeOf = require('../internals/object-is-prototype-of');
var toString = require('../internals/to-string');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var copyConstructorProperties = require('../internals/copy-constructor-properties');

var NativeSymbol = globalThis.Symbol;
var SymbolPrototype = NativeSymbol && NativeSymbol.prototype;

if (DESCRIPTORS && isCallable(NativeSymbol) && (!('description' in SymbolPrototype) ||
  // Safari 12 bug
  NativeSymbol().description !== undefined
)) {
  var EmptyStringDescriptionStore = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : toString(arguments[0]);
    var result = isPrototypeOf(SymbolPrototype, this)
      // eslint-disable-next-line sonarjs/inconsistent-function-call -- ok
      ? new NativeSymbol(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };

  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  SymbolWrapper.prototype = SymbolPrototype;
  SymbolPrototype.constructor = SymbolWrapper;

  var NATIVE_SYMBOL = String(NativeSymbol('description detection')) === 'Symbol(description detection)';
  var thisSymbolValue = uncurryThis(SymbolPrototype.valueOf);
  var symbolDescriptiveString = uncurryThis(SymbolPrototype.toString);
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  var replace = uncurryThis(''.replace);
  var stringSlice = uncurryThis(''.slice);

  defineBuiltInAccessor(SymbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = thisSymbolValue(this);
      if (hasOwn(EmptyStringDescriptionStore, symbol)) return '';
      var string = symbolDescriptiveString(symbol);
      var desc = NATIVE_SYMBOL ? stringSlice(string, 7, -1) : replace(string, regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  $({ global: true, constructor: true, forced: true }, {
    Symbol: SymbolWrapper
  });
}

},{"../internals/copy-constructor-properties":204,"../internals/define-built-in-accessor":211,"../internals/descriptors":215,"../internals/export":227,"../internals/function-uncurry-this":239,"../internals/global-this":246,"../internals/has-own-property":247,"../internals/is-callable":259,"../internals/object-is-prototype-of":287,"../internals/to-string":334}],373:[function(require,module,exports){
arguments[4][156][0].apply(exports,arguments)
},{"../internals/export":227,"../internals/get-built-in":240,"../internals/has-own-property":247,"../internals/shared":316,"../internals/symbol-registry-detection":323,"../internals/to-string":334,"dup":156}],374:[function(require,module,exports){
arguments[4][157][0].apply(exports,arguments)
},{"../internals/well-known-symbol-define":341,"dup":157}],375:[function(require,module,exports){
arguments[4][158][0].apply(exports,arguments)
},{"../modules/es.json.stringify":350,"../modules/es.object.get-own-property-symbols":353,"../modules/es.symbol.constructor":371,"../modules/es.symbol.for":373,"../modules/es.symbol.key-for":376,"dup":158}],376:[function(require,module,exports){
arguments[4][159][0].apply(exports,arguments)
},{"../internals/export":227,"../internals/has-own-property":247,"../internals/is-symbol":266,"../internals/shared":316,"../internals/symbol-registry-detection":323,"../internals/try-to-string":335,"dup":159}],377:[function(require,module,exports){
arguments[4][160][0].apply(exports,arguments)
},{"../internals/symbol-define-to-primitive":322,"../internals/well-known-symbol-define":341,"dup":160}],378:[function(require,module,exports){
'use strict';
var FREEZING = require('../internals/freezing');
var globalThis = require('../internals/global-this');
var uncurryThis = require('../internals/function-uncurry-this');
var defineBuiltIns = require('../internals/define-built-ins');
var InternalMetadataModule = require('../internals/internal-metadata');
var collection = require('../internals/collection');
var collectionWeak = require('../internals/collection-weak');
var isObject = require('../internals/is-object');
var enforceInternalState = require('../internals/internal-state').enforce;
var fails = require('../internals/fails');
var NATIVE_WEAK_MAP = require('../internals/weak-map-basic-detection');

var $Object = Object;
// eslint-disable-next-line es/no-array-isarray -- safe
var isArray = Array.isArray;
// eslint-disable-next-line es/no-object-isextensible -- safe
var isExtensible = $Object.isExtensible;
// eslint-disable-next-line es/no-object-isfrozen -- safe
var isFrozen = $Object.isFrozen;
// eslint-disable-next-line es/no-object-issealed -- safe
var isSealed = $Object.isSealed;
// eslint-disable-next-line es/no-object-freeze -- safe
var freeze = $Object.freeze;
// eslint-disable-next-line es/no-object-seal -- safe
var seal = $Object.seal;

var IS_IE11 = !globalThis.ActiveXObject && 'ActiveXObject' in globalThis;
var InternalWeakMap;

var wrapper = function (init) {
  return function WeakMap() {
    return init(this, arguments.length ? arguments[0] : undefined);
  };
};

// `WeakMap` constructor
// https://tc39.es/ecma262/#sec-weakmap-constructor
var $WeakMap = collection('WeakMap', wrapper, collectionWeak);
var WeakMapPrototype = $WeakMap.prototype;
var nativeSet = uncurryThis(WeakMapPrototype.set);

// Chakra Edge bug: adding frozen arrays to WeakMap unfreeze them
var hasMSEdgeFreezingBug = function () {
  return FREEZING && fails(function () {
    var frozenArray = freeze([]);
    nativeSet(new $WeakMap(), frozenArray, 1);
    return !isFrozen(frozenArray);
  });
};

// IE11 WeakMap frozen keys fix
// We can't use feature detection because it crash some old IE builds
// https://github.com/zloirock/core-js/issues/485
if (NATIVE_WEAK_MAP) if (IS_IE11) {
  InternalWeakMap = collectionWeak.getConstructor(wrapper, 'WeakMap', true);
  InternalMetadataModule.enable();
  var nativeDelete = uncurryThis(WeakMapPrototype['delete']);
  var nativeHas = uncurryThis(WeakMapPrototype.has);
  var nativeGet = uncurryThis(WeakMapPrototype.get);
  defineBuiltIns(WeakMapPrototype, {
    'delete': function (key) {
      if (isObject(key) && !isExtensible(key)) {
        var state = enforceInternalState(this);
        if (!state.frozen) state.frozen = new InternalWeakMap();
        return nativeDelete(this, key) || state.frozen['delete'](key);
      } return nativeDelete(this, key);
    },
    has: function has(key) {
      if (isObject(key) && !isExtensible(key)) {
        var state = enforceInternalState(this);
        if (!state.frozen) state.frozen = new InternalWeakMap();
        return nativeHas(this, key) || state.frozen.has(key);
      } return nativeHas(this, key);
    },
    get: function get(key) {
      if (isObject(key) && !isExtensible(key)) {
        var state = enforceInternalState(this);
        if (!state.frozen) state.frozen = new InternalWeakMap();
        return nativeHas(this, key) ? nativeGet(this, key) : state.frozen.get(key);
      } return nativeGet(this, key);
    },
    set: function set(key, value) {
      if (isObject(key) && !isExtensible(key)) {
        var state = enforceInternalState(this);
        if (!state.frozen) state.frozen = new InternalWeakMap();
        nativeHas(this, key) ? nativeSet(this, key, value) : state.frozen.set(key, value);
      } else nativeSet(this, key, value);
      return this;
    }
  });
// Chakra Edge frozen keys fix
} else if (hasMSEdgeFreezingBug()) {
  defineBuiltIns(WeakMapPrototype, {
    set: function set(key, value) {
      var arrayIntegrityLevel;
      if (isArray(key)) {
        if (isFrozen(key)) arrayIntegrityLevel = freeze;
        else if (isSealed(key)) arrayIntegrityLevel = seal;
      }
      nativeSet(this, key, value);
      if (arrayIntegrityLevel) arrayIntegrityLevel(key);
      return this;
    }
  });
}

},{"../internals/collection":203,"../internals/collection-weak":202,"../internals/define-built-ins":213,"../internals/fails":228,"../internals/freezing":230,"../internals/function-uncurry-this":239,"../internals/global-this":246,"../internals/internal-metadata":255,"../internals/internal-state":256,"../internals/is-object":263,"../internals/weak-map-basic-detection":340}],379:[function(require,module,exports){
'use strict';
// TODO: Remove this module from `core-js@4` since it's replaced to module below
require('../modules/es.weak-map.constructor');

},{"../modules/es.weak-map.constructor":378}],380:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var DOMIterables = require('../internals/dom-iterables');
var DOMTokenListPrototype = require('../internals/dom-token-list-prototype');
var forEach = require('../internals/array-for-each');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');

var handlePrototype = function (CollectionPrototype) {
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype && CollectionPrototype.forEach !== forEach) try {
    createNonEnumerableProperty(CollectionPrototype, 'forEach', forEach);
  } catch (error) {
    CollectionPrototype.forEach = forEach;
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  if (DOMIterables[COLLECTION_NAME]) {
    handlePrototype(globalThis[COLLECTION_NAME] && globalThis[COLLECTION_NAME].prototype);
  }
}

handlePrototype(DOMTokenListPrototype);

},{"../internals/array-for-each":188,"../internals/create-non-enumerable-property":207,"../internals/dom-iterables":217,"../internals/dom-token-list-prototype":218,"../internals/global-this":246}],381:[function(require,module,exports){
'use strict';
var globalThis = require('../internals/global-this');
var DOMIterables = require('../internals/dom-iterables');
var DOMTokenListPrototype = require('../internals/dom-token-list-prototype');
var ArrayIteratorMethods = require('../modules/es.array.iterator');
var createNonEnumerableProperty = require('../internals/create-non-enumerable-property');
var setToStringTag = require('../internals/set-to-string-tag');
var wellKnownSymbol = require('../internals/well-known-symbol');

var ITERATOR = wellKnownSymbol('iterator');
var ArrayValues = ArrayIteratorMethods.values;

var handlePrototype = function (CollectionPrototype, COLLECTION_NAME) {
  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (error) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    setToStringTag(CollectionPrototype, COLLECTION_NAME, true);
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  handlePrototype(globalThis[COLLECTION_NAME] && globalThis[COLLECTION_NAME].prototype, COLLECTION_NAME);
}

handlePrototype(DOMTokenListPrototype, 'DOMTokenList');

},{"../internals/create-non-enumerable-property":207,"../internals/dom-iterables":217,"../internals/dom-token-list-prototype":218,"../internals/global-this":246,"../internals/set-to-string-tag":313,"../internals/well-known-symbol":343,"../modules/es.array.iterator":346}],382:[function(require,module,exports){
'use strict';

var _typeof = require('@babel/runtime/helpers/typeof');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _assertThisInitialized = require('@babel/runtime/helpers/assertThisInitialized');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _toArray = require('@babel/runtime/helpers/toArray');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
var _assertThisInitialized__default = /*#__PURE__*/_interopDefaultLegacy(_assertThisInitialized);
var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _toArray__default = /*#__PURE__*/_interopDefaultLegacy(_toArray);

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$6(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var consoleLogger = {
  type: 'logger',
  log: function log(args) {
    this.output('log', args);
  },
  warn: function warn(args) {
    this.output('warn', args);
  },
  error: function error(args) {
    this.output('error', args);
  },
  output: function output(type, args) {
    if (console && console[type]) console[type].apply(console, args);
  }
};
var Logger = function () {
  function Logger(concreteLogger) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck__default["default"](this, Logger);
    this.init(concreteLogger, options);
  }
  _createClass__default["default"](Logger, [{
    key: "init",
    value: function init(concreteLogger) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.prefix = options.prefix || 'i18next:';
      this.logger = concreteLogger || consoleLogger;
      this.options = options;
      this.debug = options.debug;
    }
  }, {
    key: "setDebug",
    value: function setDebug(bool) {
      this.debug = bool;
    }
  }, {
    key: "log",
    value: function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return this.forward(args, 'log', '', true);
    }
  }, {
    key: "warn",
    value: function warn() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      return this.forward(args, 'warn', '', true);
    }
  }, {
    key: "error",
    value: function error() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      return this.forward(args, 'error', '');
    }
  }, {
    key: "deprecate",
    value: function deprecate() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return this.forward(args, 'warn', 'WARNING DEPRECATED: ', true);
    }
  }, {
    key: "forward",
    value: function forward(args, lvl, prefix, debugOnly) {
      if (debugOnly && !this.debug) return null;
      if (typeof args[0] === 'string') args[0] = "".concat(prefix).concat(this.prefix, " ").concat(args[0]);
      return this.logger[lvl](args);
    }
  }, {
    key: "create",
    value: function create(moduleName) {
      return new Logger(this.logger, _objectSpread$6(_objectSpread$6({}, {
        prefix: "".concat(this.prefix, ":").concat(moduleName, ":")
      }), this.options));
    }
  }, {
    key: "clone",
    value: function clone(options) {
      options = options || this.options;
      options.prefix = options.prefix || this.prefix;
      return new Logger(this.logger, options);
    }
  }]);
  return Logger;
}();
var baseLogger = new Logger();

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck__default["default"](this, EventEmitter);
    this.observers = {};
  }
  _createClass__default["default"](EventEmitter, [{
    key: "on",
    value: function on(events, listener) {
      var _this = this;
      events.split(' ').forEach(function (event) {
        _this.observers[event] = _this.observers[event] || [];
        _this.observers[event].push(listener);
      });
      return this;
    }
  }, {
    key: "off",
    value: function off(event, listener) {
      if (!this.observers[event]) return;
      if (!listener) {
        delete this.observers[event];
        return;
      }
      this.observers[event] = this.observers[event].filter(function (l) {
        return l !== listener;
      });
    }
  }, {
    key: "emit",
    value: function emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (this.observers[event]) {
        var cloned = [].concat(this.observers[event]);
        cloned.forEach(function (observer) {
          observer.apply(void 0, args);
        });
      }
      if (this.observers['*']) {
        var _cloned = [].concat(this.observers['*']);
        _cloned.forEach(function (observer) {
          observer.apply(observer, [event].concat(args));
        });
      }
    }
  }]);
  return EventEmitter;
}();

function defer() {
  var res;
  var rej;
  var promise = new Promise(function (resolve, reject) {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
}
function makeString(object) {
  if (object == null) return '';
  return '' + object;
}
function copy(a, s, t) {
  a.forEach(function (m) {
    if (s[m]) t[m] = s[m];
  });
}
function getLastOfPath(object, path, Empty) {
  function cleanKey(key) {
    return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key;
  }
  function canNotTraverseDeeper() {
    return !object || typeof object === 'string';
  }
  var stack = typeof path !== 'string' ? [].concat(path) : path.split('.');
  while (stack.length > 1) {
    if (canNotTraverseDeeper()) return {};
    var key = cleanKey(stack.shift());
    if (!object[key] && Empty) object[key] = new Empty();
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
  }
  if (canNotTraverseDeeper()) return {};
  return {
    obj: object,
    k: cleanKey(stack.shift())
  };
}
function setPath(object, path, newValue) {
  var _getLastOfPath = getLastOfPath(object, path, Object),
    obj = _getLastOfPath.obj,
    k = _getLastOfPath.k;
  obj[k] = newValue;
}
function pushPath(object, path, newValue, concat) {
  var _getLastOfPath2 = getLastOfPath(object, path, Object),
    obj = _getLastOfPath2.obj,
    k = _getLastOfPath2.k;
  obj[k] = obj[k] || [];
  if (concat) obj[k] = obj[k].concat(newValue);
  if (!concat) obj[k].push(newValue);
}
function getPath(object, path) {
  var _getLastOfPath3 = getLastOfPath(object, path),
    obj = _getLastOfPath3.obj,
    k = _getLastOfPath3.k;
  if (!obj) return undefined;
  return obj[k];
}
function getPathWithDefaults(data, defaultData, key) {
  var value = getPath(data, key);
  if (value !== undefined) {
    return value;
  }
  return getPath(defaultData, key);
}
function deepExtend(target, source, overwrite) {
  for (var prop in source) {
    if (prop !== '__proto__' && prop !== 'constructor') {
      if (prop in target) {
        if (typeof target[prop] === 'string' || target[prop] instanceof String || typeof source[prop] === 'string' || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }
  return target;
}
function regexEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
var _entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
};
function escape(data) {
  if (typeof data === 'string') {
    return data.replace(/[&<>"'\/]/g, function (s) {
      return _entityMap[s];
    });
  }
  return data;
}
var isIE10 = typeof window !== 'undefined' && window.navigator && typeof window.navigator.userAgentData === 'undefined' && window.navigator.userAgent && window.navigator.userAgent.indexOf('MSIE') > -1;
var chars = [' ', ',', '?', '!', ';'];
function looksLikeObjectPath(key, nsSeparator, keySeparator) {
  nsSeparator = nsSeparator || '';
  keySeparator = keySeparator || '';
  var possibleChars = chars.filter(function (c) {
    return nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0;
  });
  if (possibleChars.length === 0) return true;
  var r = new RegExp("(".concat(possibleChars.map(function (c) {
    return c === '?' ? '\\?' : c;
  }).join('|'), ")"));
  var matched = !r.test(key);
  if (!matched) {
    var ki = key.indexOf(keySeparator);
    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true;
    }
  }
  return matched;
}
function deepFind(obj, path) {
  var keySeparator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '.';
  if (!obj) return undefined;
  if (obj[path]) return obj[path];
  var paths = path.split(keySeparator);
  var current = obj;
  for (var i = 0; i < paths.length; ++i) {
    if (!current) return undefined;
    if (typeof current[paths[i]] === 'string' && i + 1 < paths.length) {
      return undefined;
    }
    if (current[paths[i]] === undefined) {
      var j = 2;
      var p = paths.slice(i, i + j).join(keySeparator);
      var mix = current[p];
      while (mix === undefined && paths.length > i + j) {
        j++;
        p = paths.slice(i, i + j).join(keySeparator);
        mix = current[p];
      }
      if (mix === undefined) return undefined;
      if (mix === null) return null;
      if (path.endsWith(p)) {
        if (typeof mix === 'string') return mix;
        if (p && typeof mix[p] === 'string') return mix[p];
      }
      var joinedPath = paths.slice(i + j).join(keySeparator);
      if (joinedPath) return deepFind(mix, joinedPath, keySeparator);
      return undefined;
    }
    current = current[paths[i]];
  }
  return current;
}

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$5(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper$3(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$3(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }
function _isNativeReflectConstruct$3() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ResourceStore = function (_EventEmitter) {
  _inherits__default["default"](ResourceStore, _EventEmitter);
  var _super = _createSuper$3(ResourceStore);
  function ResourceStore(data) {
    var _this;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      ns: ['translation'],
      defaultNS: 'translation'
    };
    _classCallCheck__default["default"](this, ResourceStore);
    _this = _super.call(this);
    if (isIE10) {
      EventEmitter.call(_assertThisInitialized__default["default"](_this));
    }
    _this.data = data || {};
    _this.options = options;
    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }
    if (_this.options.ignoreJSONStructure === undefined) {
      _this.options.ignoreJSONStructure = true;
    }
    return _this;
  }
  _createClass__default["default"](ResourceStore, [{
    key: "addNamespaces",
    value: function addNamespaces(ns) {
      if (this.options.ns.indexOf(ns) < 0) {
        this.options.ns.push(ns);
      }
    }
  }, {
    key: "removeNamespaces",
    value: function removeNamespaces(ns) {
      var index = this.options.ns.indexOf(ns);
      if (index > -1) {
        this.options.ns.splice(index, 1);
      }
    }
  }, {
    key: "getResource",
    value: function getResource(lng, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var ignoreJSONStructure = options.ignoreJSONStructure !== undefined ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
      var path = [lng, ns];
      if (key && typeof key !== 'string') path = path.concat(key);
      if (key && typeof key === 'string') path = path.concat(keySeparator ? key.split(keySeparator) : key);
      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
      }
      var result = getPath(this.data, path);
      if (result || !ignoreJSONStructure || typeof key !== 'string') return result;
      return deepFind(this.data && this.data[lng] && this.data[lng][ns], key, keySeparator);
    }
  }, {
    key: "addResource",
    value: function addResource(lng, ns, key, value) {
      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
        silent: false
      };
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var path = [lng, ns];
      if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);
      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        value = ns;
        ns = path[1];
      }
      this.addNamespaces(ns);
      setPath(this.data, path, value);
      if (!options.silent) this.emit('added', lng, ns, key, value);
    }
  }, {
    key: "addResources",
    value: function addResources(lng, ns, resources) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
        silent: false
      };
      for (var m in resources) {
        if (typeof resources[m] === 'string' || Object.prototype.toString.apply(resources[m]) === '[object Array]') this.addResource(lng, ns, m, resources[m], {
          silent: true
        });
      }
      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "addResourceBundle",
    value: function addResourceBundle(lng, ns, resources, deep, overwrite) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
        silent: false
      };
      var path = [lng, ns];
      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        deep = resources;
        resources = ns;
        ns = path[1];
      }
      this.addNamespaces(ns);
      var pack = getPath(this.data, path) || {};
      if (deep) {
        deepExtend(pack, resources, overwrite);
      } else {
        pack = _objectSpread$5(_objectSpread$5({}, pack), resources);
      }
      setPath(this.data, path, pack);
      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "removeResourceBundle",
    value: function removeResourceBundle(lng, ns) {
      if (this.hasResourceBundle(lng, ns)) {
        delete this.data[lng][ns];
      }
      this.removeNamespaces(ns);
      this.emit('removed', lng, ns);
    }
  }, {
    key: "hasResourceBundle",
    value: function hasResourceBundle(lng, ns) {
      return this.getResource(lng, ns) !== undefined;
    }
  }, {
    key: "getResourceBundle",
    value: function getResourceBundle(lng, ns) {
      if (!ns) ns = this.options.defaultNS;
      if (this.options.compatibilityAPI === 'v1') return _objectSpread$5(_objectSpread$5({}, {}), this.getResource(lng, ns));
      return this.getResource(lng, ns);
    }
  }, {
    key: "getDataByLanguage",
    value: function getDataByLanguage(lng) {
      return this.data[lng];
    }
  }, {
    key: "hasLanguageSomeTranslations",
    value: function hasLanguageSomeTranslations(lng) {
      var data = this.getDataByLanguage(lng);
      var n = data && Object.keys(data) || [];
      return !!n.find(function (v) {
        return data[v] && Object.keys(data[v]).length > 0;
      });
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.data;
    }
  }]);
  return ResourceStore;
}(EventEmitter);

var postProcessor = {
  processors: {},
  addPostProcessor: function addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle: function handle(processors, value, key, options, translator) {
    var _this = this;
    processors.forEach(function (processor) {
      if (_this.processors[processor]) value = _this.processors[processor].process(value, key, options, translator);
    });
    return value;
  }
};

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper$2(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$2(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }
function _isNativeReflectConstruct$2() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var checkedLoadedFor = {};
var Translator = function (_EventEmitter) {
  _inherits__default["default"](Translator, _EventEmitter);
  var _super = _createSuper$2(Translator);
  function Translator(services) {
    var _this;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck__default["default"](this, Translator);
    _this = _super.call(this);
    if (isIE10) {
      EventEmitter.call(_assertThisInitialized__default["default"](_this));
    }
    copy(['resourceStore', 'languageUtils', 'pluralResolver', 'interpolator', 'backendConnector', 'i18nFormat', 'utils'], services, _assertThisInitialized__default["default"](_this));
    _this.options = options;
    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }
    _this.logger = baseLogger.create('translator');
    return _this;
  }
  _createClass__default["default"](Translator, [{
    key: "changeLanguage",
    value: function changeLanguage(lng) {
      if (lng) this.language = lng;
    }
  }, {
    key: "exists",
    value: function exists(key) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        interpolation: {}
      };
      if (key === undefined || key === null) {
        return false;
      }
      var resolved = this.resolve(key, options);
      return resolved && resolved.res !== undefined;
    }
  }, {
    key: "extractFromKey",
    value: function extractFromKey(key, options) {
      var nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator;
      if (nsSeparator === undefined) nsSeparator = ':';
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var namespaces = options.ns || this.options.defaultNS || [];
      var wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
      var seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !options.keySeparator && !this.options.userDefinedNsSeparator && !options.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
      if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
        var m = key.match(this.interpolator.nestingRegexp);
        if (m && m.length > 0) {
          return {
            key: key,
            namespaces: namespaces
          };
        }
        var parts = key.split(nsSeparator);
        if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
        key = parts.join(keySeparator);
      }
      if (typeof namespaces === 'string') namespaces = [namespaces];
      return {
        key: key,
        namespaces: namespaces
      };
    }
  }, {
    key: "translate",
    value: function translate(keys, options, lastKey) {
      var _this2 = this;
      if (_typeof__default["default"](options) !== 'object' && this.options.overloadTranslationOptionHandler) {
        options = this.options.overloadTranslationOptionHandler(arguments);
      }
      if (_typeof__default["default"](options) === 'object') options = _objectSpread$4({}, options);
      if (!options) options = {};
      if (keys === undefined || keys === null) return '';
      if (!Array.isArray(keys)) keys = [String(keys)];
      var returnDetails = options.returnDetails !== undefined ? options.returnDetails : this.options.returnDetails;
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var _this$extractFromKey = this.extractFromKey(keys[keys.length - 1], options),
        key = _this$extractFromKey.key,
        namespaces = _this$extractFromKey.namespaces;
      var namespace = namespaces[namespaces.length - 1];
      var lng = options.lng || this.language;
      var appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
      if (lng && lng.toLowerCase() === 'cimode') {
        if (appendNamespaceToCIMode) {
          var nsSeparator = options.nsSeparator || this.options.nsSeparator;
          if (returnDetails) {
            return {
              res: "".concat(namespace).concat(nsSeparator).concat(key),
              usedKey: key,
              exactUsedKey: key,
              usedLng: lng,
              usedNS: namespace
            };
          }
          return "".concat(namespace).concat(nsSeparator).concat(key);
        }
        if (returnDetails) {
          return {
            res: key,
            usedKey: key,
            exactUsedKey: key,
            usedLng: lng,
            usedNS: namespace
          };
        }
        return key;
      }
      var resolved = this.resolve(keys, options);
      var res = resolved && resolved.res;
      var resUsedKey = resolved && resolved.usedKey || key;
      var resExactUsedKey = resolved && resolved.exactUsedKey || key;
      var resType = Object.prototype.toString.apply(res);
      var noObject = ['[object Number]', '[object Function]', '[object RegExp]'];
      var joinArrays = options.joinArrays !== undefined ? options.joinArrays : this.options.joinArrays;
      var handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
      var handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number';
      if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(typeof joinArrays === 'string' && resType === '[object Array]')) {
        if (!options.returnObjects && !this.options.returnObjects) {
          if (!this.options.returnedObjectHandler) {
            this.logger.warn('accessing an object - but returnObjects options is not enabled!');
          }
          var r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, res, _objectSpread$4(_objectSpread$4({}, options), {}, {
            ns: namespaces
          })) : "key '".concat(key, " (").concat(this.language, ")' returned an object instead of string.");
          if (returnDetails) {
            resolved.res = r;
            return resolved;
          }
          return r;
        }
        if (keySeparator) {
          var resTypeIsArray = resType === '[object Array]';
          var copy = resTypeIsArray ? [] : {};
          var newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
          for (var m in res) {
            if (Object.prototype.hasOwnProperty.call(res, m)) {
              var deepKey = "".concat(newKeyToUse).concat(keySeparator).concat(m);
              copy[m] = this.translate(deepKey, _objectSpread$4(_objectSpread$4({}, options), {
                joinArrays: false,
                ns: namespaces
              }));
              if (copy[m] === deepKey) copy[m] = res[m];
            }
          }
          res = copy;
        }
      } else if (handleAsObjectInI18nFormat && typeof joinArrays === 'string' && resType === '[object Array]') {
        res = res.join(joinArrays);
        if (res) res = this.extendTranslation(res, keys, options, lastKey);
      } else {
        var usedDefault = false;
        var usedKey = false;
        var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';
        var hasDefaultValue = Translator.hasDefaultValue(options);
        var defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : '';
        var defaultValue = options["defaultValue".concat(defaultValueSuffix)] || options.defaultValue;
        if (!this.isValidLookup(res) && hasDefaultValue) {
          usedDefault = true;
          res = defaultValue;
        }
        if (!this.isValidLookup(res)) {
          usedKey = true;
          res = key;
        }
        var missingKeyNoValueFallbackToKey = options.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
        var resForMissing = missingKeyNoValueFallbackToKey && usedKey ? undefined : res;
        var updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
        if (usedKey || usedDefault || updateMissing) {
          this.logger.log(updateMissing ? 'updateKey' : 'missingKey', lng, namespace, key, updateMissing ? defaultValue : res);
          if (keySeparator) {
            var fk = this.resolve(key, _objectSpread$4(_objectSpread$4({}, options), {}, {
              keySeparator: false
            }));
            if (fk && fk.res) this.logger.warn('Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.');
          }
          var lngs = [];
          var fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);
          if (this.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
            for (var i = 0; i < fallbackLngs.length; i++) {
              lngs.push(fallbackLngs[i]);
            }
          } else if (this.options.saveMissingTo === 'all') {
            lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
          } else {
            lngs.push(options.lng || this.language);
          }
          var send = function send(l, k, specificDefaultValue) {
            var defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
            if (_this2.options.missingKeyHandler) {
              _this2.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, options);
            } else if (_this2.backendConnector && _this2.backendConnector.saveMissing) {
              _this2.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, options);
            }
            _this2.emit('missingKey', l, namespace, k, res);
          };
          if (this.options.saveMissing) {
            if (this.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach(function (language) {
                _this2.pluralResolver.getSuffixes(language, options).forEach(function (suffix) {
                  send([language], key + suffix, options["defaultValue".concat(suffix)] || defaultValue);
                });
              });
            } else {
              send(lngs, key, defaultValue);
            }
          }
        }
        res = this.extendTranslation(res, keys, options, resolved, lastKey);
        if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = "".concat(namespace, ":").concat(key);
        if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
          if (this.options.compatibilityAPI !== 'v1') {
            res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? "".concat(namespace, ":").concat(key) : key, usedDefault ? res : undefined);
          } else {
            res = this.options.parseMissingKeyHandler(res);
          }
        }
      }
      if (returnDetails) {
        resolved.res = res;
        return resolved;
      }
      return res;
    }
  }, {
    key: "extendTranslation",
    value: function extendTranslation(res, key, options, resolved, lastKey) {
      var _this3 = this;
      if (this.i18nFormat && this.i18nFormat.parse) {
        res = this.i18nFormat.parse(res, _objectSpread$4(_objectSpread$4({}, this.options.interpolation.defaultVariables), options), resolved.usedLng, resolved.usedNS, resolved.usedKey, {
          resolved: resolved
        });
      } else if (!options.skipInterpolation) {
        if (options.interpolation) this.interpolator.init(_objectSpread$4(_objectSpread$4({}, options), {
          interpolation: _objectSpread$4(_objectSpread$4({}, this.options.interpolation), options.interpolation)
        }));
        var skipOnVariables = typeof res === 'string' && (options && options.interpolation && options.interpolation.skipOnVariables !== undefined ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
        var nestBef;
        if (skipOnVariables) {
          var nb = res.match(this.interpolator.nestingRegexp);
          nestBef = nb && nb.length;
        }
        var data = options.replace && typeof options.replace !== 'string' ? options.replace : options;
        if (this.options.interpolation.defaultVariables) data = _objectSpread$4(_objectSpread$4({}, this.options.interpolation.defaultVariables), data);
        res = this.interpolator.interpolate(res, data, options.lng || this.language, options);
        if (skipOnVariables) {
          var na = res.match(this.interpolator.nestingRegexp);
          var nestAft = na && na.length;
          if (nestBef < nestAft) options.nest = false;
        }
        if (!options.lng && this.options.compatibilityAPI !== 'v1' && resolved && resolved.res) options.lng = resolved.usedLng;
        if (options.nest !== false) res = this.interpolator.nest(res, function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          if (lastKey && lastKey[0] === args[0] && !options.context) {
            _this3.logger.warn("It seems you are nesting recursively key: ".concat(args[0], " in key: ").concat(key[0]));
            return null;
          }
          return _this3.translate.apply(_this3, args.concat([key]));
        }, options);
        if (options.interpolation) this.interpolator.reset();
      }
      var postProcess = options.postProcess || this.options.postProcess;
      var postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess;
      if (res !== undefined && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? _objectSpread$4({
          i18nResolved: resolved
        }, options) : options, this);
      }
      return res;
    }
  }, {
    key: "resolve",
    value: function resolve(keys) {
      var _this4 = this;
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var found;
      var usedKey;
      var exactUsedKey;
      var usedLng;
      var usedNS;
      if (typeof keys === 'string') keys = [keys];
      keys.forEach(function (k) {
        if (_this4.isValidLookup(found)) return;
        var extracted = _this4.extractFromKey(k, options);
        var key = extracted.key;
        usedKey = key;
        var namespaces = extracted.namespaces;
        if (_this4.options.fallbackNS) namespaces = namespaces.concat(_this4.options.fallbackNS);
        var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';
        var needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && _this4.pluralResolver.shouldUseIntlApi();
        var needsContextHandling = options.context !== undefined && (typeof options.context === 'string' || typeof options.context === 'number') && options.context !== '';
        var codes = options.lngs ? options.lngs : _this4.languageUtils.toResolveHierarchy(options.lng || _this4.language, options.fallbackLng);
        namespaces.forEach(function (ns) {
          if (_this4.isValidLookup(found)) return;
          usedNS = ns;
          if (!checkedLoadedFor["".concat(codes[0], "-").concat(ns)] && _this4.utils && _this4.utils.hasLoadedNamespace && !_this4.utils.hasLoadedNamespace(usedNS)) {
            checkedLoadedFor["".concat(codes[0], "-").concat(ns)] = true;
            _this4.logger.warn("key \"".concat(usedKey, "\" for languages \"").concat(codes.join(', '), "\" won't get resolved as namespace \"").concat(usedNS, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
          }
          codes.forEach(function (code) {
            if (_this4.isValidLookup(found)) return;
            usedLng = code;
            var finalKeys = [key];
            if (_this4.i18nFormat && _this4.i18nFormat.addLookupKeys) {
              _this4.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
            } else {
              var pluralSuffix;
              if (needsPluralHandling) pluralSuffix = _this4.pluralResolver.getSuffix(code, options.count, options);
              var zeroSuffix = "".concat(_this4.options.pluralSeparator, "zero");
              if (needsPluralHandling) {
                finalKeys.push(key + pluralSuffix);
                if (needsZeroSuffixLookup) {
                  finalKeys.push(key + zeroSuffix);
                }
              }
              if (needsContextHandling) {
                var contextKey = "".concat(key).concat(_this4.options.contextSeparator).concat(options.context);
                finalKeys.push(contextKey);
                if (needsPluralHandling) {
                  finalKeys.push(contextKey + pluralSuffix);
                  if (needsZeroSuffixLookup) {
                    finalKeys.push(contextKey + zeroSuffix);
                  }
                }
              }
            }
            var possibleKey;
            while (possibleKey = finalKeys.pop()) {
              if (!_this4.isValidLookup(found)) {
                exactUsedKey = possibleKey;
                found = _this4.getResource(code, ns, possibleKey, options);
              }
            }
          });
        });
      });
      return {
        res: found,
        usedKey: usedKey,
        exactUsedKey: exactUsedKey,
        usedLng: usedLng,
        usedNS: usedNS
      };
    }
  }, {
    key: "isValidLookup",
    value: function isValidLookup(res) {
      return res !== undefined && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === '');
    }
  }, {
    key: "getResource",
    value: function getResource(code, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      if (this.i18nFormat && this.i18nFormat.getResource) return this.i18nFormat.getResource(code, ns, key, options);
      return this.resourceStore.getResource(code, ns, key, options);
    }
  }], [{
    key: "hasDefaultValue",
    value: function hasDefaultValue(options) {
      var prefix = 'defaultValue';
      for (var option in options) {
        if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && undefined !== options[option]) {
          return true;
        }
      }
      return false;
    }
  }]);
  return Translator;
}(EventEmitter);

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
var LanguageUtil = function () {
  function LanguageUtil(options) {
    _classCallCheck__default["default"](this, LanguageUtil);
    this.options = options;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create('languageUtils');
  }
  _createClass__default["default"](LanguageUtil, [{
    key: "getScriptPartFromCode",
    value: function getScriptPartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return null;
      var p = code.split('-');
      if (p.length === 2) return null;
      p.pop();
      if (p[p.length - 1].toLowerCase() === 'x') return null;
      return this.formatLanguageCode(p.join('-'));
    }
  }, {
    key: "getLanguagePartFromCode",
    value: function getLanguagePartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return code;
      var p = code.split('-');
      return this.formatLanguageCode(p[0]);
    }
  }, {
    key: "formatLanguageCode",
    value: function formatLanguageCode(code) {
      if (typeof code === 'string' && code.indexOf('-') > -1) {
        var specialCases = ['hans', 'hant', 'latn', 'cyrl', 'cans', 'mong', 'arab'];
        var p = code.split('-');
        if (this.options.lowerCaseLng) {
          p = p.map(function (part) {
            return part.toLowerCase();
          });
        } else if (p.length === 2) {
          p[0] = p[0].toLowerCase();
          p[1] = p[1].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
        } else if (p.length === 3) {
          p[0] = p[0].toLowerCase();
          if (p[1].length === 2) p[1] = p[1].toUpperCase();
          if (p[0] !== 'sgn' && p[2].length === 2) p[2] = p[2].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
          if (specialCases.indexOf(p[2].toLowerCase()) > -1) p[2] = capitalize(p[2].toLowerCase());
        }
        return p.join('-');
      }
      return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
    }
  }, {
    key: "isSupportedCode",
    value: function isSupportedCode(code) {
      if (this.options.load === 'languageOnly' || this.options.nonExplicitSupportedLngs) {
        code = this.getLanguagePartFromCode(code);
      }
      return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
    }
  }, {
    key: "getBestMatchFromCodes",
    value: function getBestMatchFromCodes(codes) {
      var _this = this;
      if (!codes) return null;
      var found;
      codes.forEach(function (code) {
        if (found) return;
        var cleanedLng = _this.formatLanguageCode(code);
        if (!_this.options.supportedLngs || _this.isSupportedCode(cleanedLng)) found = cleanedLng;
      });
      if (!found && this.options.supportedLngs) {
        codes.forEach(function (code) {
          if (found) return;
          var lngOnly = _this.getLanguagePartFromCode(code);
          if (_this.isSupportedCode(lngOnly)) return found = lngOnly;
          found = _this.options.supportedLngs.find(function (supportedLng) {
            if (supportedLng === lngOnly) return supportedLng;
            if (supportedLng.indexOf('-') < 0 && lngOnly.indexOf('-') < 0) return;
            if (supportedLng.indexOf(lngOnly) === 0) return supportedLng;
          });
        });
      }
      if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
      return found;
    }
  }, {
    key: "getFallbackCodes",
    value: function getFallbackCodes(fallbacks, code) {
      if (!fallbacks) return [];
      if (typeof fallbacks === 'function') fallbacks = fallbacks(code);
      if (typeof fallbacks === 'string') fallbacks = [fallbacks];
      if (Object.prototype.toString.apply(fallbacks) === '[object Array]') return fallbacks;
      if (!code) return fallbacks["default"] || [];
      var found = fallbacks[code];
      if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
      if (!found) found = fallbacks[this.formatLanguageCode(code)];
      if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
      if (!found) found = fallbacks["default"];
      return found || [];
    }
  }, {
    key: "toResolveHierarchy",
    value: function toResolveHierarchy(code, fallbackCode) {
      var _this2 = this;
      var fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
      var codes = [];
      var addCode = function addCode(c) {
        if (!c) return;
        if (_this2.isSupportedCode(c)) {
          codes.push(c);
        } else {
          _this2.logger.warn("rejecting language code not found in supportedLngs: ".concat(c));
        }
      };
      if (typeof code === 'string' && code.indexOf('-') > -1) {
        if (this.options.load !== 'languageOnly') addCode(this.formatLanguageCode(code));
        if (this.options.load !== 'languageOnly' && this.options.load !== 'currentOnly') addCode(this.getScriptPartFromCode(code));
        if (this.options.load !== 'currentOnly') addCode(this.getLanguagePartFromCode(code));
      } else if (typeof code === 'string') {
        addCode(this.formatLanguageCode(code));
      }
      fallbackCodes.forEach(function (fc) {
        if (codes.indexOf(fc) < 0) addCode(_this2.formatLanguageCode(fc));
      });
      return codes;
    }
  }]);
  return LanguageUtil;
}();

var sets = [{
  lngs: ['ach', 'ak', 'am', 'arn', 'br', 'fil', 'gun', 'ln', 'mfe', 'mg', 'mi', 'oc', 'pt', 'pt-BR', 'tg', 'tl', 'ti', 'tr', 'uz', 'wa'],
  nr: [1, 2],
  fc: 1
}, {
  lngs: ['af', 'an', 'ast', 'az', 'bg', 'bn', 'ca', 'da', 'de', 'dev', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fi', 'fo', 'fur', 'fy', 'gl', 'gu', 'ha', 'hi', 'hu', 'hy', 'ia', 'it', 'kk', 'kn', 'ku', 'lb', 'mai', 'ml', 'mn', 'mr', 'nah', 'nap', 'nb', 'ne', 'nl', 'nn', 'no', 'nso', 'pa', 'pap', 'pms', 'ps', 'pt-PT', 'rm', 'sco', 'se', 'si', 'so', 'son', 'sq', 'sv', 'sw', 'ta', 'te', 'tk', 'ur', 'yo'],
  nr: [1, 2],
  fc: 2
}, {
  lngs: ['ay', 'bo', 'cgg', 'fa', 'ht', 'id', 'ja', 'jbo', 'ka', 'km', 'ko', 'ky', 'lo', 'ms', 'sah', 'su', 'th', 'tt', 'ug', 'vi', 'wo', 'zh'],
  nr: [1],
  fc: 3
}, {
  lngs: ['be', 'bs', 'cnr', 'dz', 'hr', 'ru', 'sr', 'uk'],
  nr: [1, 2, 5],
  fc: 4
}, {
  lngs: ['ar'],
  nr: [0, 1, 2, 3, 11, 100],
  fc: 5
}, {
  lngs: ['cs', 'sk'],
  nr: [1, 2, 5],
  fc: 6
}, {
  lngs: ['csb', 'pl'],
  nr: [1, 2, 5],
  fc: 7
}, {
  lngs: ['cy'],
  nr: [1, 2, 3, 8],
  fc: 8
}, {
  lngs: ['fr'],
  nr: [1, 2],
  fc: 9
}, {
  lngs: ['ga'],
  nr: [1, 2, 3, 7, 11],
  fc: 10
}, {
  lngs: ['gd'],
  nr: [1, 2, 3, 20],
  fc: 11
}, {
  lngs: ['is'],
  nr: [1, 2],
  fc: 12
}, {
  lngs: ['jv'],
  nr: [0, 1],
  fc: 13
}, {
  lngs: ['kw'],
  nr: [1, 2, 3, 4],
  fc: 14
}, {
  lngs: ['lt'],
  nr: [1, 2, 10],
  fc: 15
}, {
  lngs: ['lv'],
  nr: [1, 2, 0],
  fc: 16
}, {
  lngs: ['mk'],
  nr: [1, 2],
  fc: 17
}, {
  lngs: ['mnk'],
  nr: [0, 1, 2],
  fc: 18
}, {
  lngs: ['mt'],
  nr: [1, 2, 11, 20],
  fc: 19
}, {
  lngs: ['or'],
  nr: [2, 1],
  fc: 2
}, {
  lngs: ['ro'],
  nr: [1, 2, 20],
  fc: 20
}, {
  lngs: ['sl'],
  nr: [5, 1, 2, 3],
  fc: 21
}, {
  lngs: ['he', 'iw'],
  nr: [1, 2, 20, 21],
  fc: 22
}];
var _rulesPluralsTypes = {
  1: function _(n) {
    return Number(n > 1);
  },
  2: function _(n) {
    return Number(n != 1);
  },
  3: function _(n) {
    return 0;
  },
  4: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  5: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5);
  },
  6: function _(n) {
    return Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2);
  },
  7: function _(n) {
    return Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  8: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3);
  },
  9: function _(n) {
    return Number(n >= 2);
  },
  10: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4);
  },
  11: function _(n) {
    return Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3);
  },
  12: function _(n) {
    return Number(n % 10 != 1 || n % 100 == 11);
  },
  13: function _(n) {
    return Number(n !== 0);
  },
  14: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3);
  },
  15: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  16: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2);
  },
  17: function _(n) {
    return Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1);
  },
  18: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : 2);
  },
  19: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3);
  },
  20: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2);
  },
  21: function _(n) {
    return Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0);
  },
  22: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3);
  }
};
var deprecatedJsonVersions = ['v1', 'v2', 'v3'];
var suffixesOrder = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5
};
function createRules() {
  var rules = {};
  sets.forEach(function (set) {
    set.lngs.forEach(function (l) {
      rules[l] = {
        numbers: set.nr,
        plurals: _rulesPluralsTypes[set.fc]
      };
    });
  });
  return rules;
}
var PluralResolver = function () {
  function PluralResolver(languageUtils) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck__default["default"](this, PluralResolver);
    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create('pluralResolver');
    if ((!this.options.compatibilityJSON || this.options.compatibilityJSON === 'v4') && (typeof Intl === 'undefined' || !Intl.PluralRules)) {
      this.options.compatibilityJSON = 'v3';
      this.logger.error('Your environment seems not to be Intl API compatible, use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.');
    }
    this.rules = createRules();
  }
  _createClass__default["default"](PluralResolver, [{
    key: "addRule",
    value: function addRule(lng, obj) {
      this.rules[lng] = obj;
    }
  }, {
    key: "getRule",
    value: function getRule(code) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (this.shouldUseIntlApi()) {
        try {
          return new Intl.PluralRules(code, {
            type: options.ordinal ? 'ordinal' : 'cardinal'
          });
        } catch (_unused) {
          return;
        }
      }
      return this.rules[code] || this.rules[this.languageUtils.getLanguagePartFromCode(code)];
    }
  }, {
    key: "needsPlural",
    value: function needsPlural(code) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var rule = this.getRule(code, options);
      if (this.shouldUseIntlApi()) {
        return rule && rule.resolvedOptions().pluralCategories.length > 1;
      }
      return rule && rule.numbers.length > 1;
    }
  }, {
    key: "getPluralFormsOfKey",
    value: function getPluralFormsOfKey(code, key) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return this.getSuffixes(code, options).map(function (suffix) {
        return "".concat(key).concat(suffix);
      });
    }
  }, {
    key: "getSuffixes",
    value: function getSuffixes(code) {
      var _this = this;
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var rule = this.getRule(code, options);
      if (!rule) {
        return [];
      }
      if (this.shouldUseIntlApi()) {
        return rule.resolvedOptions().pluralCategories.sort(function (pluralCategory1, pluralCategory2) {
          return suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2];
        }).map(function (pluralCategory) {
          return "".concat(_this.options.prepend).concat(pluralCategory);
        });
      }
      return rule.numbers.map(function (number) {
        return _this.getSuffix(code, number, options);
      });
    }
  }, {
    key: "getSuffix",
    value: function getSuffix(code, count) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var rule = this.getRule(code, options);
      if (rule) {
        if (this.shouldUseIntlApi()) {
          return "".concat(this.options.prepend).concat(rule.select(count));
        }
        return this.getSuffixRetroCompatible(rule, count);
      }
      this.logger.warn("no plural rule found for: ".concat(code));
      return '';
    }
  }, {
    key: "getSuffixRetroCompatible",
    value: function getSuffixRetroCompatible(rule, count) {
      var _this2 = this;
      var idx = rule.noAbs ? rule.plurals(count) : rule.plurals(Math.abs(count));
      var suffix = rule.numbers[idx];
      if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        if (suffix === 2) {
          suffix = 'plural';
        } else if (suffix === 1) {
          suffix = '';
        }
      }
      var returnSuffix = function returnSuffix() {
        return _this2.options.prepend && suffix.toString() ? _this2.options.prepend + suffix.toString() : suffix.toString();
      };
      if (this.options.compatibilityJSON === 'v1') {
        if (suffix === 1) return '';
        if (typeof suffix === 'number') return "_plural_".concat(suffix.toString());
        return returnSuffix();
      } else if (this.options.compatibilityJSON === 'v2') {
        return returnSuffix();
      } else if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
        return returnSuffix();
      }
      return this.options.prepend && idx.toString() ? this.options.prepend + idx.toString() : idx.toString();
    }
  }, {
    key: "shouldUseIntlApi",
    value: function shouldUseIntlApi() {
      return !deprecatedJsonVersions.includes(this.options.compatibilityJSON);
    }
  }]);
  return PluralResolver;
}();

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function deepFindWithDefaults(data, defaultData, key) {
  var keySeparator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '.';
  var ignoreJSONStructure = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
  var path = getPathWithDefaults(data, defaultData, key);
  if (!path && ignoreJSONStructure && typeof key === 'string') {
    path = deepFind(data, key, keySeparator);
    if (path === undefined) path = deepFind(defaultData, key, keySeparator);
  }
  return path;
}
var Interpolator = function () {
  function Interpolator() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck__default["default"](this, Interpolator);
    this.logger = baseLogger.create('interpolator');
    this.options = options;
    this.format = options.interpolation && options.interpolation.format || function (value) {
      return value;
    };
    this.init(options);
  }
  _createClass__default["default"](Interpolator, [{
    key: "init",
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (!options.interpolation) options.interpolation = {
        escapeValue: true
      };
      var iOpts = options.interpolation;
      this.escape = iOpts.escape !== undefined ? iOpts.escape : escape;
      this.escapeValue = iOpts.escapeValue !== undefined ? iOpts.escapeValue : true;
      this.useRawValueToEscape = iOpts.useRawValueToEscape !== undefined ? iOpts.useRawValueToEscape : false;
      this.prefix = iOpts.prefix ? regexEscape(iOpts.prefix) : iOpts.prefixEscaped || '{{';
      this.suffix = iOpts.suffix ? regexEscape(iOpts.suffix) : iOpts.suffixEscaped || '}}';
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ',';
      this.unescapePrefix = iOpts.unescapeSuffix ? '' : iOpts.unescapePrefix || '-';
      this.unescapeSuffix = this.unescapePrefix ? '' : iOpts.unescapeSuffix || '';
      this.nestingPrefix = iOpts.nestingPrefix ? regexEscape(iOpts.nestingPrefix) : iOpts.nestingPrefixEscaped || regexEscape('$t(');
      this.nestingSuffix = iOpts.nestingSuffix ? regexEscape(iOpts.nestingSuffix) : iOpts.nestingSuffixEscaped || regexEscape(')');
      this.nestingOptionsSeparator = iOpts.nestingOptionsSeparator ? iOpts.nestingOptionsSeparator : iOpts.nestingOptionsSeparator || ',';
      this.maxReplaces = iOpts.maxReplaces ? iOpts.maxReplaces : 1000;
      this.alwaysFormat = iOpts.alwaysFormat !== undefined ? iOpts.alwaysFormat : false;
      this.resetRegExp();
    }
  }, {
    key: "reset",
    value: function reset() {
      if (this.options) this.init(this.options);
    }
  }, {
    key: "resetRegExp",
    value: function resetRegExp() {
      var regexpStr = "".concat(this.prefix, "(.+?)").concat(this.suffix);
      this.regexp = new RegExp(regexpStr, 'g');
      var regexpUnescapeStr = "".concat(this.prefix).concat(this.unescapePrefix, "(.+?)").concat(this.unescapeSuffix).concat(this.suffix);
      this.regexpUnescape = new RegExp(regexpUnescapeStr, 'g');
      var nestingRegexpStr = "".concat(this.nestingPrefix, "(.+?)").concat(this.nestingSuffix);
      this.nestingRegexp = new RegExp(nestingRegexpStr, 'g');
    }
  }, {
    key: "interpolate",
    value: function interpolate(str, data, lng, options) {
      var _this = this;
      var match;
      var value;
      var replaces;
      var defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
      function regexSafe(val) {
        return val.replace(/\$/g, '$$$$');
      }
      var handleFormat = function handleFormat(key) {
        if (key.indexOf(_this.formatSeparator) < 0) {
          var path = deepFindWithDefaults(data, defaultData, key, _this.options.keySeparator, _this.options.ignoreJSONStructure);
          return _this.alwaysFormat ? _this.format(path, undefined, lng, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, options), data), {}, {
            interpolationkey: key
          })) : path;
        }
        var p = key.split(_this.formatSeparator);
        var k = p.shift().trim();
        var f = p.join(_this.formatSeparator).trim();
        return _this.format(deepFindWithDefaults(data, defaultData, k, _this.options.keySeparator, _this.options.ignoreJSONStructure), f, lng, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, options), data), {}, {
          interpolationkey: k
        }));
      };
      this.resetRegExp();
      var missingInterpolationHandler = options && options.missingInterpolationHandler || this.options.missingInterpolationHandler;
      var skipOnVariables = options && options.interpolation && options.interpolation.skipOnVariables !== undefined ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
      var todos = [{
        regex: this.regexpUnescape,
        safeValue: function safeValue(val) {
          return regexSafe(val);
        }
      }, {
        regex: this.regexp,
        safeValue: function safeValue(val) {
          return _this.escapeValue ? regexSafe(_this.escape(val)) : regexSafe(val);
        }
      }];
      todos.forEach(function (todo) {
        replaces = 0;
        while (match = todo.regex.exec(str)) {
          var matchedVar = match[1].trim();
          value = handleFormat(matchedVar);
          if (value === undefined) {
            if (typeof missingInterpolationHandler === 'function') {
              var temp = missingInterpolationHandler(str, match, options);
              value = typeof temp === 'string' ? temp : '';
            } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
              value = '';
            } else if (skipOnVariables) {
              value = match[0];
              continue;
            } else {
              _this.logger.warn("missed to pass in variable ".concat(matchedVar, " for interpolating ").concat(str));
              value = '';
            }
          } else if (typeof value !== 'string' && !_this.useRawValueToEscape) {
            value = makeString(value);
          }
          var safeValue = todo.safeValue(value);
          str = str.replace(match[0], safeValue);
          if (skipOnVariables) {
            todo.regex.lastIndex += value.length;
            todo.regex.lastIndex -= match[0].length;
          } else {
            todo.regex.lastIndex = 0;
          }
          replaces++;
          if (replaces >= _this.maxReplaces) {
            break;
          }
        }
      });
      return str;
    }
  }, {
    key: "nest",
    value: function nest(str, fc) {
      var _this2 = this;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var match;
      var value;
      var clonedOptions;
      function handleHasOptions(key, inheritedOptions) {
        var sep = this.nestingOptionsSeparator;
        if (key.indexOf(sep) < 0) return key;
        var c = key.split(new RegExp("".concat(sep, "[ ]*{")));
        var optionsString = "{".concat(c[1]);
        key = c[0];
        optionsString = this.interpolate(optionsString, clonedOptions);
        var matchedSingleQuotes = optionsString.match(/'/g);
        var matchedDoubleQuotes = optionsString.match(/"/g);
        if (matchedSingleQuotes && matchedSingleQuotes.length % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) {
          optionsString = optionsString.replace(/'/g, '"');
        }
        try {
          clonedOptions = JSON.parse(optionsString);
          if (inheritedOptions) clonedOptions = _objectSpread$3(_objectSpread$3({}, inheritedOptions), clonedOptions);
        } catch (e) {
          this.logger.warn("failed parsing options string in nesting for key ".concat(key), e);
          return "".concat(key).concat(sep).concat(optionsString);
        }
        delete clonedOptions.defaultValue;
        return key;
      }
      while (match = this.nestingRegexp.exec(str)) {
        var formatters = [];
        clonedOptions = _objectSpread$3({}, options);
        clonedOptions = clonedOptions.replace && typeof clonedOptions.replace !== 'string' ? clonedOptions.replace : clonedOptions;
        clonedOptions.applyPostProcessor = false;
        delete clonedOptions.defaultValue;
        var doReduce = false;
        if (match[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(match[1])) {
          var r = match[1].split(this.formatSeparator).map(function (elem) {
            return elem.trim();
          });
          match[1] = r.shift();
          formatters = r;
          doReduce = true;
        }
        value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
        if (value && match[0] === str && typeof value !== 'string') return value;
        if (typeof value !== 'string') value = makeString(value);
        if (!value) {
          this.logger.warn("missed to resolve ".concat(match[1], " for nesting ").concat(str));
          value = '';
        }
        if (doReduce) {
          value = formatters.reduce(function (v, f) {
            return _this2.format(v, f, options.lng, _objectSpread$3(_objectSpread$3({}, options), {}, {
              interpolationkey: match[1].trim()
            }));
          }, value.trim());
        }
        str = str.replace(match[0], value);
        this.regexp.lastIndex = 0;
      }
      return str;
    }
  }]);
  return Interpolator;
}();

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function parseFormatStr(formatStr) {
  var formatName = formatStr.toLowerCase().trim();
  var formatOptions = {};
  if (formatStr.indexOf('(') > -1) {
    var p = formatStr.split('(');
    formatName = p[0].toLowerCase().trim();
    var optStr = p[1].substring(0, p[1].length - 1);
    if (formatName === 'currency' && optStr.indexOf(':') < 0) {
      if (!formatOptions.currency) formatOptions.currency = optStr.trim();
    } else if (formatName === 'relativetime' && optStr.indexOf(':') < 0) {
      if (!formatOptions.range) formatOptions.range = optStr.trim();
    } else {
      var opts = optStr.split(';');
      opts.forEach(function (opt) {
        if (!opt) return;
        var _opt$split = opt.split(':'),
          _opt$split2 = _toArray__default["default"](_opt$split),
          key = _opt$split2[0],
          rest = _opt$split2.slice(1);
        var val = rest.join(':').trim().replace(/^'+|'+$/g, '');
        if (!formatOptions[key.trim()]) formatOptions[key.trim()] = val;
        if (val === 'false') formatOptions[key.trim()] = false;
        if (val === 'true') formatOptions[key.trim()] = true;
        if (!isNaN(val)) formatOptions[key.trim()] = parseInt(val, 10);
      });
    }
  }
  return {
    formatName: formatName,
    formatOptions: formatOptions
  };
}
function createCachedFormatter(fn) {
  var cache = {};
  return function invokeFormatter(val, lng, options) {
    var key = lng + JSON.stringify(options);
    var formatter = cache[key];
    if (!formatter) {
      formatter = fn(lng, options);
      cache[key] = formatter;
    }
    return formatter(val);
  };
}
var Formatter = function () {
  function Formatter() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck__default["default"](this, Formatter);
    this.logger = baseLogger.create('formatter');
    this.options = options;
    this.formats = {
      number: createCachedFormatter(function (lng, opt) {
        var formatter = new Intl.NumberFormat(lng, _objectSpread$2({}, opt));
        return function (val) {
          return formatter.format(val);
        };
      }),
      currency: createCachedFormatter(function (lng, opt) {
        var formatter = new Intl.NumberFormat(lng, _objectSpread$2(_objectSpread$2({}, opt), {}, {
          style: 'currency'
        }));
        return function (val) {
          return formatter.format(val);
        };
      }),
      datetime: createCachedFormatter(function (lng, opt) {
        var formatter = new Intl.DateTimeFormat(lng, _objectSpread$2({}, opt));
        return function (val) {
          return formatter.format(val);
        };
      }),
      relativetime: createCachedFormatter(function (lng, opt) {
        var formatter = new Intl.RelativeTimeFormat(lng, _objectSpread$2({}, opt));
        return function (val) {
          return formatter.format(val, opt.range || 'day');
        };
      }),
      list: createCachedFormatter(function (lng, opt) {
        var formatter = new Intl.ListFormat(lng, _objectSpread$2({}, opt));
        return function (val) {
          return formatter.format(val);
        };
      })
    };
    this.init(options);
  }
  _createClass__default["default"](Formatter, [{
    key: "init",
    value: function init(services) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        interpolation: {}
      };
      var iOpts = options.interpolation;
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ',';
    }
  }, {
    key: "add",
    value: function add(name, fc) {
      this.formats[name.toLowerCase().trim()] = fc;
    }
  }, {
    key: "addCached",
    value: function addCached(name, fc) {
      this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
    }
  }, {
    key: "format",
    value: function format(value, _format, lng) {
      var _this = this;
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var formats = _format.split(this.formatSeparator);
      var result = formats.reduce(function (mem, f) {
        var _parseFormatStr = parseFormatStr(f),
          formatName = _parseFormatStr.formatName,
          formatOptions = _parseFormatStr.formatOptions;
        if (_this.formats[formatName]) {
          var formatted = mem;
          try {
            var valOptions = options && options.formatParams && options.formatParams[options.interpolationkey] || {};
            var l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
            formatted = _this.formats[formatName](mem, l, _objectSpread$2(_objectSpread$2(_objectSpread$2({}, formatOptions), options), valOptions));
          } catch (error) {
            _this.logger.warn(error);
          }
          return formatted;
        } else {
          _this.logger.warn("there was no format function for ".concat(formatName));
        }
        return mem;
      }, value);
      return result;
    }
  }]);
  return Formatter;
}();

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }
function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function removePending(q, name) {
  if (q.pending[name] !== undefined) {
    delete q.pending[name];
    q.pendingCount--;
  }
}
var Connector = function (_EventEmitter) {
  _inherits__default["default"](Connector, _EventEmitter);
  var _super = _createSuper$1(Connector);
  function Connector(backend, store, services) {
    var _this;
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    _classCallCheck__default["default"](this, Connector);
    _this = _super.call(this);
    if (isIE10) {
      EventEmitter.call(_assertThisInitialized__default["default"](_this));
    }
    _this.backend = backend;
    _this.store = store;
    _this.services = services;
    _this.languageUtils = services.languageUtils;
    _this.options = options;
    _this.logger = baseLogger.create('backendConnector');
    _this.waitingReads = [];
    _this.maxParallelReads = options.maxParallelReads || 10;
    _this.readingCalls = 0;
    _this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
    _this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
    _this.state = {};
    _this.queue = [];
    if (_this.backend && _this.backend.init) {
      _this.backend.init(services, options.backend, options);
    }
    return _this;
  }
  _createClass__default["default"](Connector, [{
    key: "queueLoad",
    value: function queueLoad(languages, namespaces, options, callback) {
      var _this2 = this;
      var toLoad = {};
      var pending = {};
      var toLoadLanguages = {};
      var toLoadNamespaces = {};
      languages.forEach(function (lng) {
        var hasAllNamespaces = true;
        namespaces.forEach(function (ns) {
          var name = "".concat(lng, "|").concat(ns);
          if (!options.reload && _this2.store.hasResourceBundle(lng, ns)) {
            _this2.state[name] = 2;
          } else if (_this2.state[name] < 0) ; else if (_this2.state[name] === 1) {
            if (pending[name] === undefined) pending[name] = true;
          } else {
            _this2.state[name] = 1;
            hasAllNamespaces = false;
            if (pending[name] === undefined) pending[name] = true;
            if (toLoad[name] === undefined) toLoad[name] = true;
            if (toLoadNamespaces[ns] === undefined) toLoadNamespaces[ns] = true;
          }
        });
        if (!hasAllNamespaces) toLoadLanguages[lng] = true;
      });
      if (Object.keys(toLoad).length || Object.keys(pending).length) {
        this.queue.push({
          pending: pending,
          pendingCount: Object.keys(pending).length,
          loaded: {},
          errors: [],
          callback: callback
        });
      }
      return {
        toLoad: Object.keys(toLoad),
        pending: Object.keys(pending),
        toLoadLanguages: Object.keys(toLoadLanguages),
        toLoadNamespaces: Object.keys(toLoadNamespaces)
      };
    }
  }, {
    key: "loaded",
    value: function loaded(name, err, data) {
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      if (err) this.emit('failedLoading', lng, ns, err);
      if (data) {
        this.store.addResourceBundle(lng, ns, data);
      }
      this.state[name] = err ? -1 : 2;
      var loaded = {};
      this.queue.forEach(function (q) {
        pushPath(q.loaded, [lng], ns);
        removePending(q, name);
        if (err) q.errors.push(err);
        if (q.pendingCount === 0 && !q.done) {
          Object.keys(q.loaded).forEach(function (l) {
            if (!loaded[l]) loaded[l] = {};
            var loadedKeys = q.loaded[l];
            if (loadedKeys.length) {
              loadedKeys.forEach(function (n) {
                if (loaded[l][n] === undefined) loaded[l][n] = true;
              });
            }
          });
          q.done = true;
          if (q.errors.length) {
            q.callback(q.errors);
          } else {
            q.callback();
          }
        }
      });
      this.emit('loaded', loaded);
      this.queue = this.queue.filter(function (q) {
        return !q.done;
      });
    }
  }, {
    key: "read",
    value: function read(lng, ns, fcName) {
      var _this3 = this;
      var tried = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var wait = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.retryTimeout;
      var callback = arguments.length > 5 ? arguments[5] : undefined;
      if (!lng.length) return callback(null, {});
      if (this.readingCalls >= this.maxParallelReads) {
        this.waitingReads.push({
          lng: lng,
          ns: ns,
          fcName: fcName,
          tried: tried,
          wait: wait,
          callback: callback
        });
        return;
      }
      this.readingCalls++;
      var resolver = function resolver(err, data) {
        _this3.readingCalls--;
        if (_this3.waitingReads.length > 0) {
          var next = _this3.waitingReads.shift();
          _this3.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
        }
        if (err && data && tried < _this3.maxRetries) {
          setTimeout(function () {
            _this3.read.call(_this3, lng, ns, fcName, tried + 1, wait * 2, callback);
          }, wait);
          return;
        }
        callback(err, data);
      };
      var fc = this.backend[fcName].bind(this.backend);
      if (fc.length === 2) {
        try {
          var r = fc(lng, ns);
          if (r && typeof r.then === 'function') {
            r.then(function (data) {
              return resolver(null, data);
            })["catch"](resolver);
          } else {
            resolver(null, r);
          }
        } catch (err) {
          resolver(err);
        }
        return;
      }
      return fc(lng, ns, resolver);
    }
  }, {
    key: "prepareLoading",
    value: function prepareLoading(languages, namespaces) {
      var _this4 = this;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var callback = arguments.length > 3 ? arguments[3] : undefined;
      if (!this.backend) {
        this.logger.warn('No backend was added via i18next.use. Will not load resources.');
        return callback && callback();
      }
      if (typeof languages === 'string') languages = this.languageUtils.toResolveHierarchy(languages);
      if (typeof namespaces === 'string') namespaces = [namespaces];
      var toLoad = this.queueLoad(languages, namespaces, options, callback);
      if (!toLoad.toLoad.length) {
        if (!toLoad.pending.length) callback();
        return null;
      }
      toLoad.toLoad.forEach(function (name) {
        _this4.loadOne(name);
      });
    }
  }, {
    key: "load",
    value: function load(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {}, callback);
    }
  }, {
    key: "reload",
    value: function reload(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {
        reload: true
      }, callback);
    }
  }, {
    key: "loadOne",
    value: function loadOne(name) {
      var _this5 = this;
      var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      this.read(lng, ns, 'read', undefined, undefined, function (err, data) {
        if (err) _this5.logger.warn("".concat(prefix, "loading namespace ").concat(ns, " for language ").concat(lng, " failed"), err);
        if (!err && data) _this5.logger.log("".concat(prefix, "loaded namespace ").concat(ns, " for language ").concat(lng), data);
        _this5.loaded(name, err, data);
      });
    }
  }, {
    key: "saveMissing",
    value: function saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
      var clb = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : function () {};
      if (this.services.utils && this.services.utils.hasLoadedNamespace && !this.services.utils.hasLoadedNamespace(namespace)) {
        this.logger.warn("did not save key \"".concat(key, "\" as the namespace \"").concat(namespace, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
        return;
      }
      if (key === undefined || key === null || key === '') return;
      if (this.backend && this.backend.create) {
        var opts = _objectSpread$1(_objectSpread$1({}, options), {}, {
          isUpdate: isUpdate
        });
        var fc = this.backend.create.bind(this.backend);
        if (fc.length < 6) {
          try {
            var r;
            if (fc.length === 5) {
              r = fc(languages, namespace, key, fallbackValue, opts);
            } else {
              r = fc(languages, namespace, key, fallbackValue);
            }
            if (r && typeof r.then === 'function') {
              r.then(function (data) {
                return clb(null, data);
              })["catch"](clb);
            } else {
              clb(null, r);
            }
          } catch (err) {
            clb(err);
          }
        } else {
          fc(languages, namespace, key, fallbackValue, clb, opts);
        }
      }
      if (!languages || !languages[0]) return;
      this.store.addResource(languages[0], namespace, key, fallbackValue);
    }
  }]);
  return Connector;
}(EventEmitter);

function get() {
  return {
    debug: false,
    initImmediate: true,
    ns: ['translation'],
    defaultNS: ['translation'],
    fallbackLng: ['dev'],
    fallbackNS: false,
    supportedLngs: false,
    nonExplicitSupportedLngs: false,
    load: 'all',
    preload: false,
    simplifyPluralSuffix: true,
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    partialBundledLanguages: false,
    saveMissing: false,
    updateMissing: false,
    saveMissingTo: 'fallback',
    saveMissingPlurals: true,
    missingKeyHandler: false,
    missingInterpolationHandler: false,
    postProcess: false,
    postProcessPassResolved: false,
    returnNull: true,
    returnEmptyString: true,
    returnObjects: false,
    joinArrays: false,
    returnedObjectHandler: false,
    parseMissingKeyHandler: false,
    appendNamespaceToMissingKey: false,
    appendNamespaceToCIMode: false,
    overloadTranslationOptionHandler: function handle(args) {
      var ret = {};
      if (_typeof__default["default"](args[1]) === 'object') ret = args[1];
      if (typeof args[1] === 'string') ret.defaultValue = args[1];
      if (typeof args[2] === 'string') ret.tDescription = args[2];
      if (_typeof__default["default"](args[2]) === 'object' || _typeof__default["default"](args[3]) === 'object') {
        var options = args[3] || args[2];
        Object.keys(options).forEach(function (key) {
          ret[key] = options[key];
        });
      }
      return ret;
    },
    interpolation: {
      escapeValue: true,
      format: function format(value, _format, lng, options) {
        return value;
      },
      prefix: '{{',
      suffix: '}}',
      formatSeparator: ',',
      unescapePrefix: '-',
      nestingPrefix: '$t(',
      nestingSuffix: ')',
      nestingOptionsSeparator: ',',
      maxReplaces: 1000,
      skipOnVariables: true
    }
  };
}
function transformOptions(options) {
  if (typeof options.ns === 'string') options.ns = [options.ns];
  if (typeof options.fallbackLng === 'string') options.fallbackLng = [options.fallbackLng];
  if (typeof options.fallbackNS === 'string') options.fallbackNS = [options.fallbackNS];
  if (options.supportedLngs && options.supportedLngs.indexOf('cimode') < 0) {
    options.supportedLngs = options.supportedLngs.concat(['cimode']);
  }
  return options;
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function noop() {}
function bindMemberFunctions(inst) {
  var mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
  mems.forEach(function (mem) {
    if (typeof inst[mem] === 'function') {
      inst[mem] = inst[mem].bind(inst);
    }
  });
}
var I18n = function (_EventEmitter) {
  _inherits__default["default"](I18n, _EventEmitter);
  var _super = _createSuper(I18n);
  function I18n() {
    var _this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var callback = arguments.length > 1 ? arguments[1] : undefined;
    _classCallCheck__default["default"](this, I18n);
    _this = _super.call(this);
    if (isIE10) {
      EventEmitter.call(_assertThisInitialized__default["default"](_this));
    }
    _this.options = transformOptions(options);
    _this.services = {};
    _this.logger = baseLogger;
    _this.modules = {
      external: []
    };
    bindMemberFunctions(_assertThisInitialized__default["default"](_this));
    if (callback && !_this.isInitialized && !options.isClone) {
      if (!_this.options.initImmediate) {
        _this.init(options, callback);
        return _possibleConstructorReturn__default["default"](_this, _assertThisInitialized__default["default"](_this));
      }
      setTimeout(function () {
        _this.init(options, callback);
      }, 0);
    }
    return _this;
  }
  _createClass__default["default"](I18n, [{
    key: "init",
    value: function init() {
      var _this2 = this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 ? arguments[1] : undefined;
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (!options.defaultNS && options.defaultNS !== false && options.ns) {
        if (typeof options.ns === 'string') {
          options.defaultNS = options.ns;
        } else if (options.ns.indexOf('translation') < 0) {
          options.defaultNS = options.ns[0];
        }
      }
      var defOpts = get();
      this.options = _objectSpread(_objectSpread(_objectSpread({}, defOpts), this.options), transformOptions(options));
      if (this.options.compatibilityAPI !== 'v1') {
        this.options.interpolation = _objectSpread(_objectSpread({}, defOpts.interpolation), this.options.interpolation);
      }
      if (options.keySeparator !== undefined) {
        this.options.userDefinedKeySeparator = options.keySeparator;
      }
      if (options.nsSeparator !== undefined) {
        this.options.userDefinedNsSeparator = options.nsSeparator;
      }
      function createClassOnDemand(ClassOrObject) {
        if (!ClassOrObject) return null;
        if (typeof ClassOrObject === 'function') return new ClassOrObject();
        return ClassOrObject;
      }
      if (!this.options.isClone) {
        if (this.modules.logger) {
          baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
        } else {
          baseLogger.init(null, this.options);
        }
        var formatter;
        if (this.modules.formatter) {
          formatter = this.modules.formatter;
        } else if (typeof Intl !== 'undefined') {
          formatter = Formatter;
        }
        var lu = new LanguageUtil(this.options);
        this.store = new ResourceStore(this.options.resources, this.options);
        var s = this.services;
        s.logger = baseLogger;
        s.resourceStore = this.store;
        s.languageUtils = lu;
        s.pluralResolver = new PluralResolver(lu, {
          prepend: this.options.pluralSeparator,
          compatibilityJSON: this.options.compatibilityJSON,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix
        });
        if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
          s.formatter = createClassOnDemand(formatter);
          s.formatter.init(s, this.options);
          this.options.interpolation.format = s.formatter.format.bind(s.formatter);
        }
        s.interpolator = new Interpolator(this.options);
        s.utils = {
          hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
        };
        s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
        s.backendConnector.on('*', function (event) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          _this2.emit.apply(_this2, [event].concat(args));
        });
        if (this.modules.languageDetector) {
          s.languageDetector = createClassOnDemand(this.modules.languageDetector);
          if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
        }
        if (this.modules.i18nFormat) {
          s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
          if (s.i18nFormat.init) s.i18nFormat.init(this);
        }
        this.translator = new Translator(this.services, this.options);
        this.translator.on('*', function (event) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }
          _this2.emit.apply(_this2, [event].concat(args));
        });
        this.modules.external.forEach(function (m) {
          if (m.init) m.init(_this2);
        });
      }
      this.format = this.options.interpolation.format;
      if (!callback) callback = noop;
      if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
        var codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        if (codes.length > 0 && codes[0] !== 'dev') this.options.lng = codes[0];
      }
      if (!this.services.languageDetector && !this.options.lng) {
        this.logger.warn('init: no languageDetector is used and no lng is defined');
      }
      var storeApi = ['getResource', 'hasResourceBundle', 'getResourceBundle', 'getDataByLanguage'];
      storeApi.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store;
          return (_this2$store = _this2.store)[fcName].apply(_this2$store, arguments);
        };
      });
      var storeApiChained = ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'];
      storeApiChained.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store2;
          (_this2$store2 = _this2.store)[fcName].apply(_this2$store2, arguments);
          return _this2;
        };
      });
      var deferred = defer();
      var load = function load() {
        var finish = function finish(err, t) {
          if (_this2.isInitialized && !_this2.initializedStoreOnce) _this2.logger.warn('init: i18next is already initialized. You should call init just once!');
          _this2.isInitialized = true;
          if (!_this2.options.isClone) _this2.logger.log('initialized', _this2.options);
          _this2.emit('initialized', _this2.options);
          deferred.resolve(t);
          callback(err, t);
        };
        if (_this2.languages && _this2.options.compatibilityAPI !== 'v1' && !_this2.isInitialized) return finish(null, _this2.t.bind(_this2));
        _this2.changeLanguage(_this2.options.lng, finish);
      };
      if (this.options.resources || !this.options.initImmediate) {
        load();
      } else {
        setTimeout(load, 0);
      }
      return deferred;
    }
  }, {
    key: "loadResources",
    value: function loadResources(language) {
      var _this3 = this;
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
      var usedCallback = callback;
      var usedLng = typeof language === 'string' ? language : this.language;
      if (typeof language === 'function') usedCallback = language;
      if (!this.options.resources || this.options.partialBundledLanguages) {
        if (usedLng && usedLng.toLowerCase() === 'cimode') return usedCallback();
        var toLoad = [];
        var append = function append(lng) {
          if (!lng) return;
          var lngs = _this3.services.languageUtils.toResolveHierarchy(lng);
          lngs.forEach(function (l) {
            if (toLoad.indexOf(l) < 0) toLoad.push(l);
          });
        };
        if (!usedLng) {
          var fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
          fallbacks.forEach(function (l) {
            return append(l);
          });
        } else {
          append(usedLng);
        }
        if (this.options.preload) {
          this.options.preload.forEach(function (l) {
            return append(l);
          });
        }
        this.services.backendConnector.load(toLoad, this.options.ns, function (e) {
          if (!e && !_this3.resolvedLanguage && _this3.language) _this3.setResolvedLanguage(_this3.language);
          usedCallback(e);
        });
      } else {
        usedCallback(null);
      }
    }
  }, {
    key: "reloadResources",
    value: function reloadResources(lngs, ns, callback) {
      var deferred = defer();
      if (!lngs) lngs = this.languages;
      if (!ns) ns = this.options.ns;
      if (!callback) callback = noop;
      this.services.backendConnector.reload(lngs, ns, function (err) {
        deferred.resolve();
        callback(err);
      });
      return deferred;
    }
  }, {
    key: "use",
    value: function use(module) {
      if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()');
      if (!module.type) throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()');
      if (module.type === 'backend') {
        this.modules.backend = module;
      }
      if (module.type === 'logger' || module.log && module.warn && module.error) {
        this.modules.logger = module;
      }
      if (module.type === 'languageDetector') {
        this.modules.languageDetector = module;
      }
      if (module.type === 'i18nFormat') {
        this.modules.i18nFormat = module;
      }
      if (module.type === 'postProcessor') {
        postProcessor.addPostProcessor(module);
      }
      if (module.type === 'formatter') {
        this.modules.formatter = module;
      }
      if (module.type === '3rdParty') {
        this.modules.external.push(module);
      }
      return this;
    }
  }, {
    key: "setResolvedLanguage",
    value: function setResolvedLanguage(l) {
      if (!l || !this.languages) return;
      if (['cimode', 'dev'].indexOf(l) > -1) return;
      for (var li = 0; li < this.languages.length; li++) {
        var lngInLngs = this.languages[li];
        if (['cimode', 'dev'].indexOf(lngInLngs) > -1) continue;
        if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
          this.resolvedLanguage = lngInLngs;
          break;
        }
      }
    }
  }, {
    key: "changeLanguage",
    value: function changeLanguage(lng, callback) {
      var _this4 = this;
      this.isLanguageChangingTo = lng;
      var deferred = defer();
      this.emit('languageChanging', lng);
      var setLngProps = function setLngProps(l) {
        _this4.language = l;
        _this4.languages = _this4.services.languageUtils.toResolveHierarchy(l);
        _this4.resolvedLanguage = undefined;
        _this4.setResolvedLanguage(l);
      };
      var done = function done(err, l) {
        if (l) {
          setLngProps(l);
          _this4.translator.changeLanguage(l);
          _this4.isLanguageChangingTo = undefined;
          _this4.emit('languageChanged', l);
          _this4.logger.log('languageChanged', l);
        } else {
          _this4.isLanguageChangingTo = undefined;
        }
        deferred.resolve(function () {
          return _this4.t.apply(_this4, arguments);
        });
        if (callback) callback(err, function () {
          return _this4.t.apply(_this4, arguments);
        });
      };
      var setLng = function setLng(lngs) {
        if (!lng && !lngs && _this4.services.languageDetector) lngs = [];
        var l = typeof lngs === 'string' ? lngs : _this4.services.languageUtils.getBestMatchFromCodes(lngs);
        if (l) {
          if (!_this4.language) {
            setLngProps(l);
          }
          if (!_this4.translator.language) _this4.translator.changeLanguage(l);
          if (_this4.services.languageDetector && _this4.services.languageDetector.cacheUserLanguage) _this4.services.languageDetector.cacheUserLanguage(l);
        }
        _this4.loadResources(l, function (err) {
          done(err, l);
        });
      };
      if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
        setLng(this.services.languageDetector.detect());
      } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
        if (this.services.languageDetector.detect.length === 0) {
          this.services.languageDetector.detect().then(setLng);
        } else {
          this.services.languageDetector.detect(setLng);
        }
      } else {
        setLng(lng);
      }
      return deferred;
    }
  }, {
    key: "getFixedT",
    value: function getFixedT(lng, ns, keyPrefix) {
      var _this5 = this;
      var fixedT = function fixedT(key, opts) {
        var options;
        if (_typeof__default["default"](opts) !== 'object') {
          for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
            rest[_key3 - 2] = arguments[_key3];
          }
          options = _this5.options.overloadTranslationOptionHandler([key, opts].concat(rest));
        } else {
          options = _objectSpread({}, opts);
        }
        options.lng = options.lng || fixedT.lng;
        options.lngs = options.lngs || fixedT.lngs;
        options.ns = options.ns || fixedT.ns;
        options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
        var keySeparator = _this5.options.keySeparator || '.';
        var resultKey;
        if (options.keyPrefix && Array.isArray(key)) {
          resultKey = key.map(function (k) {
            return "".concat(options.keyPrefix).concat(keySeparator).concat(k);
          });
        } else {
          resultKey = options.keyPrefix ? "".concat(options.keyPrefix).concat(keySeparator).concat(key) : key;
        }
        return _this5.t(resultKey, options);
      };
      if (typeof lng === 'string') {
        fixedT.lng = lng;
      } else {
        fixedT.lngs = lng;
      }
      fixedT.ns = ns;
      fixedT.keyPrefix = keyPrefix;
      return fixedT;
    }
  }, {
    key: "t",
    value: function t() {
      var _this$translator;
      return this.translator && (_this$translator = this.translator).translate.apply(_this$translator, arguments);
    }
  }, {
    key: "exists",
    value: function exists() {
      var _this$translator2;
      return this.translator && (_this$translator2 = this.translator).exists.apply(_this$translator2, arguments);
    }
  }, {
    key: "setDefaultNamespace",
    value: function setDefaultNamespace(ns) {
      this.options.defaultNS = ns;
    }
  }, {
    key: "hasLoadedNamespace",
    value: function hasLoadedNamespace(ns) {
      var _this6 = this;
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!this.isInitialized) {
        this.logger.warn('hasLoadedNamespace: i18next was not initialized', this.languages);
        return false;
      }
      if (!this.languages || !this.languages.length) {
        this.logger.warn('hasLoadedNamespace: i18n.languages were undefined or empty', this.languages);
        return false;
      }
      var lng = options.lng || this.resolvedLanguage || this.languages[0];
      var fallbackLng = this.options ? this.options.fallbackLng : false;
      var lastLng = this.languages[this.languages.length - 1];
      if (lng.toLowerCase() === 'cimode') return true;
      var loadNotPending = function loadNotPending(l, n) {
        var loadState = _this6.services.backendConnector.state["".concat(l, "|").concat(n)];
        return loadState === -1 || loadState === 2;
      };
      if (options.precheck) {
        var preResult = options.precheck(this, loadNotPending);
        if (preResult !== undefined) return preResult;
      }
      if (this.hasResourceBundle(lng, ns)) return true;
      if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
      if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
      return false;
    }
  }, {
    key: "loadNamespaces",
    value: function loadNamespaces(ns, callback) {
      var _this7 = this;
      var deferred = defer();
      if (!this.options.ns) {
        if (callback) callback();
        return Promise.resolve();
      }
      if (typeof ns === 'string') ns = [ns];
      ns.forEach(function (n) {
        if (_this7.options.ns.indexOf(n) < 0) _this7.options.ns.push(n);
      });
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "loadLanguages",
    value: function loadLanguages(lngs, callback) {
      var deferred = defer();
      if (typeof lngs === 'string') lngs = [lngs];
      var preloaded = this.options.preload || [];
      var newLngs = lngs.filter(function (lng) {
        return preloaded.indexOf(lng) < 0;
      });
      if (!newLngs.length) {
        if (callback) callback();
        return Promise.resolve();
      }
      this.options.preload = preloaded.concat(newLngs);
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "dir",
    value: function dir(lng) {
      if (!lng) lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language);
      if (!lng) return 'rtl';
      var rtlLngs = ['ar', 'shu', 'sqr', 'ssh', 'xaa', 'yhd', 'yud', 'aao', 'abh', 'abv', 'acm', 'acq', 'acw', 'acx', 'acy', 'adf', 'ads', 'aeb', 'aec', 'afb', 'ajp', 'apc', 'apd', 'arb', 'arq', 'ars', 'ary', 'arz', 'auz', 'avl', 'ayh', 'ayl', 'ayn', 'ayp', 'bbz', 'pga', 'he', 'iw', 'ps', 'pbt', 'pbu', 'pst', 'prp', 'prd', 'ug', 'ur', 'ydd', 'yds', 'yih', 'ji', 'yi', 'hbo', 'men', 'xmn', 'fa', 'jpr', 'peo', 'pes', 'prs', 'dv', 'sam', 'ckb'];
      var languageUtils = this.services && this.services.languageUtils || new LanguageUtil(get());
      return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf('-arab') > 1 ? 'rtl' : 'ltr';
    }
  }, {
    key: "cloneInstance",
    value: function cloneInstance() {
      var _this8 = this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
      var mergedOptions = _objectSpread(_objectSpread(_objectSpread({}, this.options), options), {
        isClone: true
      });
      var clone = new I18n(mergedOptions);
      if (options.debug !== undefined || options.prefix !== undefined) {
        clone.logger = clone.logger.clone(options);
      }
      var membersToCopy = ['store', 'services', 'language'];
      membersToCopy.forEach(function (m) {
        clone[m] = _this8[m];
      });
      clone.services = _objectSpread({}, this.services);
      clone.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      clone.translator = new Translator(clone.services, clone.options);
      clone.translator.on('*', function (event) {
        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }
        clone.emit.apply(clone, [event].concat(args));
      });
      clone.init(mergedOptions, callback);
      clone.translator.options = clone.options;
      clone.translator.backendConnector.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      return clone;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        options: this.options,
        store: this.store,
        language: this.language,
        languages: this.languages,
        resolvedLanguage: this.resolvedLanguage
      };
    }
  }]);
  return I18n;
}(EventEmitter);
_defineProperty__default["default"](I18n, "createInstance", function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var callback = arguments.length > 1 ? arguments[1] : undefined;
  return new I18n(options, callback);
});
var instance = I18n.createInstance();
instance.createInstance = I18n.createInstance;

module.exports = instance;

},{"@babel/runtime/helpers/assertThisInitialized":165,"@babel/runtime/helpers/classCallCheck":166,"@babel/runtime/helpers/createClass":167,"@babel/runtime/helpers/defineProperty":168,"@babel/runtime/helpers/getPrototypeOf":169,"@babel/runtime/helpers/inherits":170,"@babel/runtime/helpers/possibleConstructorReturn":173,"@babel/runtime/helpers/toArray":175,"@babel/runtime/helpers/typeof":178}],383:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.X_VAL_BUYEE_A2B = exports.X_KEY_BUYEE_A2B = exports.URL_YSHOPPING_API = exports.URL_RAKUTEN_API = exports.URL_RAKUMA_API = exports.URL_MERCARI_API = exports.SALES_TAX_RATE = exports.PARAM_ITEM_URL = exports.PARAM_ITEM_CODE = exports.BASE_BUYEE_URL = void 0;
var BASE_BUYEE_URL = exports.BASE_BUYEE_URL = 'https://buyee.jp';
var URL_RAKUTEN_API = exports.URL_RAKUTEN_API = "".concat(BASE_BUYEE_URL, "/externalapi/rakuten/items");
var URL_YSHOPPING_API = exports.URL_YSHOPPING_API = "".concat(BASE_BUYEE_URL, "/externalapi/jdirectitems_shopping/items");
var URL_MERCARI_API = exports.URL_MERCARI_API = "".concat(BASE_BUYEE_URL, "/externalapi/mercari/items");
var URL_RAKUMA_API = exports.URL_RAKUMA_API = "".concat(BASE_BUYEE_URL, "/externalapi/rakuma/items");
var PARAM_ITEM_URL = exports.PARAM_ITEM_URL = 'item_url';
var PARAM_ITEM_CODE = exports.PARAM_ITEM_CODE = 'item_code';
var X_KEY_BUYEE_A2B = exports.X_KEY_BUYEE_A2B = 'X-BUYEE-A2B';
var X_VAL_BUYEE_A2B = exports.X_VAL_BUYEE_A2B = 'buyee_a2b';
var SALES_TAX_RATE = exports.SALES_TAX_RATE = 0.1;

},{}],384:[function(require,module,exports){
"use strict";

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.weak-map.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
var StatusCode = _interopRequireWildcard(require("../util/status_code"));
var _translation, _translation2, _translation3, _translation4, _translation5, _translation6, _translation7, _translation8, _translation9, _translation10, _translation11, _translation12, _translation13, _translation14, _translation15, _translation16, _translation17, _translation18, _translation19;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var _default = exports.default = {
  en: {
    translation: (_translation = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'The store is currently not available.'), StatusCode.ERR_UNAVAILABLE, 'We are not able to process your order for this item.'), StatusCode.ERR_EXCLUDED_ITEM, 'The item is not available for the service.'), StatusCode.ERR_SELECTION_OPTIONS, 'Please select the options(size, color, etc) on the page to proceed.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Please choose Japanese Yen (JPY) as currency on the page.'), StatusCode.ERR_MULTIPLE_ITEMS, 'To add each desired item to Buyee cart, please visit the page of the item and click "Add to Buyee" icon.'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Please select Japan as the the delivery destination country.'), StatusCode.ERR_SELECTION_QTY, 'Please choose desired quantity.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Insufficient stock. Please change the quantity.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'The variation could not be loaded! Please refresh the page, display product variations, and then try using the extension/add-on again to add items to the Buyee cart.'), _defineProperty(_defineProperty(_translation, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, '"Add to Buyee" cannot be used for this e-commerce. Please use "Purchase Request Forms" on Buyee site.'), StatusCode.ERR_DIGITAL_CONTENT, 'Digital content cannot be purchased from overseas.'))
  },
  ja: {
    translation: (_translation2 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation2, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'ç¾åœ¨ã€ã“ã¡ã‚‰ã®ã‚µã‚¤ãƒˆã¯ã”åˆ©ç”¨ã„ãŸã ã‘ã¾ã›ã‚“ã€‚'), StatusCode.ERR_UNAVAILABLE, 'ã“ã¡ã‚‰ã®å•†å“ã®ä»£ç†è³¼å…¥ã¯ã§ãã¾ã›ã‚“ã€‚'), StatusCode.ERR_EXCLUDED_ITEM, 'ã“ã¡ã‚‰ã®å•†å“ã¯ãŠå–æ‰±å¯¾è±¡å¤–ã¨ãªã‚Šã¾ã™ã€‚'), StatusCode.ERR_SELECTION_OPTIONS, 'ãƒšãƒ¼ã‚¸å†…ã®ã‚ªãƒ—ã‚·ãƒ§ãƒ³ï¼ˆã‚µã‚¤ã‚ºã€ã‚«ãƒ©ãƒ¼ç­‰ï¼‰ã‚’ã”é¸æŠžãã ã•ã„ã€‚'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'ã“ã¡ã‚‰ã®ã‚µã‚¤ãƒˆã®è¡¨ç¤ºé€šè²¨ã¯æ—¥æœ¬å†† (JPY) ã‚’ã”é¸æŠžãã ã•ã„ã€‚'), StatusCode.ERR_MULTIPLE_ITEMS, 'ã”å¸Œæœ›ã®å•†å“ã‚’Buyeeã‚«ãƒ¼ãƒˆã¸è¿½åŠ ã™ã‚‹ã«ã¯ã€å„å•†å“ã®è©³ç´°ãƒšãƒ¼ã‚¸ã‚’è¡¨ç¤ºã—ã€Add to Buyeeã‚’ã”åˆ©ç”¨ãã ã•ã„ã€‚'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'ã“ã¡ã‚‰ã®ã‚µã‚¤ãƒˆã®é…é€å…ˆã¯æ—¥æœ¬(JAPAN)ã‚’ã”é¸æŠžãã ã•ã„ã€‚'), StatusCode.ERR_SELECTION_QTY, 'æ•°é‡ã‚’é¸æŠžã—ã¦ãã ã•ã„ã€‚'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'åœ¨åº«ä¸è¶³ã®ãŸã‚ã€æ•°é‡ã‚’å¤‰æ›´ã—ã¦ãã ã•ã„ã€‚'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ã‚ªãƒ—ã‚·ãƒ§ãƒ³ã®èª­ã¿è¾¼ã¿ã«å¤±æ•—ã—ã¾ã—ãŸã€‚ãƒšãƒ¼ã‚¸ã‚’å†èª­ã¿è¾¼ã¿ã—ã¦ã€å•†å“ã®é¸æŠžè‚¢ã‚’è¡¨ç¤ºã•ã›ã¦ã‹ã‚‰ã€æ‹¡å¼µæ©Ÿèƒ½/ã‚¢ãƒ‰ã‚ªãƒ³ã‚’å†åº¦ä½¿ç”¨ã—ã¦Buyeeã‚«ãƒ¼ãƒˆã«æŠ•å…¥ã—ã¦ãã ã•ã„ã€‚'), _defineProperty(_defineProperty(_translation2, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'ã“ã¡ã‚‰ã®å•†å“ãƒšãƒ¼ã‚¸ã¯"Add to Buyee"ã‚’ã”åˆ©ç”¨ã§ãã¾ã›ã‚“ã€‚Buyeeãƒˆãƒƒãƒ—ãƒšãƒ¼ã‚¸ã‹ã‚‰ã€Œæ¬²ã—ã„å•†å“ã®URLã§è²·ã†ã€ã‚’ã”åˆ©ç”¨ãã ã•ã„ã€‚'), StatusCode.ERR_DIGITAL_CONTENT, 'ãƒ‡ã‚¸ã‚¿ãƒ«ã‚³ãƒ³ãƒ†ãƒ³ãƒ„ã®ãŸã‚æµ·å¤–ã‹ã‚‰è³¼å…¥ã§ãã¾ã›ã‚“ã€‚'))
  },
  cht: {
    translation: (_translation3 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation3, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'æœ¬å•†åº—ç›®å‰ç„¡æ³•è³¼è²·ã€‚'), StatusCode.ERR_UNAVAILABLE, 'æˆ‘å€‘ç„¡æ³•çˆ²æ‚¨è³¼è²·è©²å•†å“ã€‚'), StatusCode.ERR_EXCLUDED_ITEM, 'æ­¤å•†å“ç„¡æ³•é€²è¡Œä»£ç†è³¼è²·ã€‚'), StatusCode.ERR_SELECTION_OPTIONS, 'è«‹åœ¨é é¢ä¸­é¸æ“‡å•†å“è¦æ ¼(å°ºå¯¸ã€é¡è‰²ç­‰)ã€‚'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'ç¶²é ä¸­çš„è²¨å¹£è«‹é¸æ“‡æ—¥åœ“(JPY)ã€‚'), StatusCode.ERR_MULTIPLE_ITEMS, 'é æƒ³å°‡å•†å“åŠ åˆ°è³¼ç‰©è»Šè£¡æ™‚ï¼Œè«‹å…ˆé€²å…¥è©²å•†å“ç¶²é å¾Œï¼Œå†é»žæ“Š"Add to Buyee"çš„åœ–ç¤ºã€‚'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'è«‹å°‡å¯„é€åœ°å€è®Šæ›´ç‚ºæ—¥æœ¬(JAPAN)ã€‚'), StatusCode.ERR_SELECTION_QTY, 'è«‹é¸æ“‡å¸Œæœ›çš„æ•¸é‡ã€‚'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'åº«å­˜ä¸è¶³ï¼Œè«‹è®Šæ›´å¸Œæœ›è³¼è²·æ•¸é‡'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'é¸é …è®€å–å¤±æ•—ã€‚è«‹é‡æ–°è¼‰å…¥é é¢ï¼Œé¡¯ç¤ºå•†å“é¸æ“‡ï¼Œç„¶å¾Œå†æ¬¡ä½¿ç”¨æ“´å……åŠŸèƒ½/é™„åŠ å…ƒä»¶å°‡å•†å“åŠ å…¥Buyeeè³¼ç‰©è»Šã€‚'), _defineProperty(_defineProperty(_translation3, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'ç„¡æ³•ä½¿ç”¨"Add to Buyee"çš„å•†å“é é¢ã€‚æ•¬è«‹é€šéŽBuyeeé¦–é ã€åˆ©ç”¨ç¶²å€ç”³è«‹è³¼è²·ã€‘é€²è¡Œè³¼è²·ã€‚'), StatusCode.ERR_DIGITAL_CONTENT, 'æ•¸ä½å•†å“ä¸æä¾›æµ·å¤–è³¼è²·ã€‚'))
  },
  chs: {
    translation: (_translation4 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation4, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'çŽ°åœ¨æ­¤åº—é“ºæ— æ³•åˆ©ç”¨ã€‚'), StatusCode.ERR_UNAVAILABLE, 'æˆ‘ä»¬æ— æ³•ä¸ºæ‚¨è´­ä¹°è¯¥å•†å“ã€‚'), StatusCode.ERR_EXCLUDED_ITEM, 'æ­¤å•†å“æ— æ³•è¿›è¡Œä»£ç†è´­ä¹°ã€‚'), StatusCode.ERR_SELECTION_OPTIONS, 'è¯·åœ¨é¡µé¢ä¸­é€‰æ‹©å•†å“è§„æ ¼(å°ºå¯¸ï¼Œé¢œè‰²ç­‰)ã€‚'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'ç½‘é¡µä¸Šçš„è´§å¸è¯·é€‰æ‹©æ—¥å…ƒ(JPY)ã€‚'), StatusCode.ERR_MULTIPLE_ITEMS, 'å¦‚æžœæ‚¨æƒ³å°†å•†å“æ·»åŠ åˆ°Buyeeè´­ç‰©è½¦é‡Œï¼Œè¯·å…ˆè¿›å…¥å„å•†å“çš„è¯¦ç»†é¡µé¢ï¼Œå†ç‚¹å‡»"Add to Buyee"å›¾æ ‡ã€‚'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'é‚®å¯„åœ°å€çš„å›½å®¶è¯·é€‰æ‹©æ—¥æœ¬(JAPAN)ã€‚'), StatusCode.ERR_SELECTION_QTY, 'è¯·é€‰æ‹©å¸Œæœ›çš„æ•°é‡ã€‚'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'åº“å­˜ä¸è¶³ã€è¯·å˜æ›´å¸Œæœ›è´­ä¹°æ•°é‡'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'é€‰é¡¹è½½å…¥å¤±è´¥ã€‚è¯·é‡æ–°è½½å…¥é¡µé¢ï¼Œæ˜¾ç¤ºå•†å“é€‰æ‹©ï¼Œç„¶åŽå†æ¬¡ä½¿ç”¨æ‰©å±•ç¨‹åº/é™„åŠ å…ƒä»¶å°†å•†å“åŠ å…¥Buyeeè´­ç‰©è½¦ã€‚'), _defineProperty(_defineProperty(_translation4, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'æ— æ³•ä½¿ç”¨"Add to Buyee"çš„å•†å“é¡µé¢ã€‚æ•¬è¯·é€šè¿‡Buyeeé¦–é¡µã€åˆ©ç”¨ç½‘å€ç”³è¯·è´­ä¹°ã€‘è¿›è¡Œè´­ä¹°ã€‚'), StatusCode.ERR_DIGITAL_CONTENT, 'è™šæ‹Ÿå•†å“ä¸æä¾›æµ·å¤–è´­ä¹°ã€‚'))
  },
  ko: {
    translation: (_translation5 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation5, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'ìƒì ì„ í˜„ìž¬ ì´ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.'), StatusCode.ERR_UNAVAILABLE, 'ìƒí’ˆì„ ì£¼ë¬¸ ì²˜ë¦¬í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.'), StatusCode.ERR_EXCLUDED_ITEM, 'ìƒí’ˆì€ ì„œë¹„ìŠ¤ë¥¼ ì´ìš©í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.'), StatusCode.ERR_SELECTION_OPTIONS, 'ê³„ì†í•˜ë ¤ë©´ íŽ˜ì´ì§€ì—ì„œ ì˜µì…˜(í¬ê¸°, ìƒ‰ìƒ ë“±)ì„ ì„ íƒí•´ì£¼ì„¸ìš”.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'íŽ˜ì´ì§€ì—ì„œ í†µí™”ë¥¼ JPY(ì¼ë³¸ ì—”)ë¡œ ì„ íƒí•´ì£¼ì„¸ìš”.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Buyee ìž¥ë°”êµ¬ë‹ˆì— ê°ê° ì›í•˜ëŠ” ìƒí’ˆì„ ì¶”ê°€í•˜ë ¤ë©´ ìƒí’ˆ íŽ˜ì´ì§€ë¥¼ ë°©ë¬¸í•˜ì—¬ "Buyeeì— ì¶”ê°€" ì•„ì´ì½˜ì„ í´ë¦­í•©ë‹ˆë‹¤.'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'ë°°ì†¡ ëª©ì ì§€ êµ­ê°€ë¡œ ì¼ë³¸ì„ ì„ íƒí•´ì£¼ì„¸ìš”.'), StatusCode.ERR_SELECTION_QTY, 'ì›í•˜ëŠ” ìˆ˜ëŸ‰ì„ ì„ íƒí•´ì£¼ì„¸ìš”.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'ìž¬ê³  ë¶€ì¡±ìœ¼ë¡œ ìˆ˜ëŸ‰ì„ ë³€ê²½í•´ì£¼ì„¸ìš”.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ì˜µì…˜ ë¶ˆëŸ¬ì˜¤ê¸°ì— ì‹¤íŒ¨í–ˆìŠµë‹ˆë‹¤. íŽ˜ì´ì§€ë¥¼ ë‹¤ì‹œ ë¡œë“œí•˜ì—¬ ìƒí’ˆ ì˜µì…˜ì„ í‘œì‹œí•œ í›„, í™•ìž¥ í”„ë¡œê·¸ëž¨/ì• ë“œì˜¨ì„ ë‹¤ì‹œ ì‚¬ìš©í•˜ì—¬ Buyee ì¹´íŠ¸ì— ë„£ìœ¼ì„¸ìš”.'), _defineProperty(_defineProperty(_translation5, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'ì´ ìƒí’ˆ íŽ˜ì´ì§€ëŠ” "Add to Buyee"ë¥¼ ì‚¬ìš©í•  ìˆ˜ ì—†ìœ¼ë©°, Buyee í™ˆíŽ˜ì´ì§€ì—ì„œ "ì›í•˜ëŠ” ìƒí’ˆ URLë¡œ êµ¬ìž…" ë¥¼ ì´ìš©í•˜ì‹œê¸° ë°”ëžë‹ˆë‹¤.'), StatusCode.ERR_DIGITAL_CONTENT, 'ë””ì§€í„¸ ì»¨í…ì¸ ì´ê¸°ë•Œë¬¸ì— í•´ì™¸ì—ì„œ êµ¬ìž…í•  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.'))
  },
  id: {
    translation: (_translation6 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation6, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Situs ini saat ini tidak tersedia.'), StatusCode.ERR_UNAVAILABLE, 'Kami tidak bisa memproses permintaan anda untuk barang ini.'), StatusCode.ERR_EXCLUDED_ITEM, 'Barang ini tidak dapat kami tangani.'), StatusCode.ERR_SELECTION_OPTIONS, 'Harap pilih opsi (ukuran, warna, dll) pada laman untuk melanjutkan proses.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Harap pilih yen (JPY) sebagai mata uang.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Untuk menambah barang ke dalam keranjang belanja Buyee, kunjungi laman barang kemudian klik "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Harap pilih JEPANG sebagai tujuan pengiriman.'), StatusCode.ERR_SELECTION_QTY, 'Pilih jumlah yang anda inginkan'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Karena stock kurang, mohon ubah jumlah barang.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Variasi tidak dapat dibaca! Refresh ulang halaman untuk melihat variasi produk, lalu gunakan kembali ekstensi/add-on untuk menambahkan item ke keranjang Buyee.'), _defineProperty(_defineProperty(_translation6, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, '"Add to Buyee" tidak dapat digunakan pada halaman produk ini. Silakan gunakan "Beli item yang Anda inginkan dengan URL" dari halaman atas Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Pembelian konten digital tidak dapat dilakukan dari luar negeri.'))
  },
  ms: {
    translation: (_translation7 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation7, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Gedung tidak tersedia pada masa ini.'), StatusCode.ERR_UNAVAILABLE, 'Kami tidak dapat memproses pesanan anda untuk item ini.'), StatusCode.ERR_EXCLUDED_ITEM, 'Item tidak tersedia untuk perkhidmatan.'), StatusCode.ERR_SELECTION_OPTIONS, 'Sila buat pilihan (saiz, warna, dll) pada halaman untuk meneruskan.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Sila pilih Yen Jepun (JPY) sebagai mata wang pada halaman.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Untuk menambah setiap item yang diingini pada troli Buyee, sila lawati halaman item tersebut dan klik ikon "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Sila pilih Jepun sebagai negara destinasi penghantaran.'), StatusCode.ERR_SELECTION_QTY, 'Sila pilih kuantiti yang diingini.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Insufficient stock. Please change the quantity.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, '"Variasi tersebut tidak dapat dimuatkan. Silakan memuat semula halaman, paparkan variasi produk dan tambahkan item ke dalam troli Buyee menggunakan fungsi extension/add on."'), _defineProperty(_defineProperty(_translation7, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, '"Add to Buyee" tidak tersedia untuk halaman item ini. Sila gunakanã€Beli item yang dikehendaki dengan URLã€‘yang terdapat pada halaman utama Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Item digital tidak dapat dibeli dari luar negara.'))
  },
  vi: {
    translation: (_translation8 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation8, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Hiá»‡n táº¡i, khÃ´ng thá»ƒ truy cáº­p trang web nÃ y.'), StatusCode.ERR_UNAVAILABLE, 'Sáº£n pháº©m nÃ y khÃ´ng thá»ƒ mua há»™.'), StatusCode.ERR_EXCLUDED_ITEM, 'Sáº£n pháº©m nÃ y khÃ´ng thá»ƒ sá»­ dá»¥ng dá»‹ch vá»¥.'), StatusCode.ERR_SELECTION_OPTIONS, 'HÃ£y Ä‘iá»n thÃ´ng tin KÃ­ch cá»¡, mÃ u sáº¯c... trÃªn trang cá»§a sáº£n pháº©m.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'HÃ£y chá»n Ä‘Æ¡n vá»‹ tiá»n tá»‡ hiá»ƒn thá»‹ lÃ  Ä‘á»“ng YÃªn (JPY) cho trang web nÃ y.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Khi báº¡n muá»‘n thÃªm vÃ o giá» hÃ ng cá»§a Buyee, hÃ£y truy cáº­p trang cá»§a sáº£n pháº©m Ä‘Ã³ vÃ  sá»­ dá»¥ng cÃ´ng cá»¥ "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'á»ž trang nÃ y, hÃ£y chá»n nÆ¡i giao hÃ ng lÃ  Nháº­t Báº£n (JAPAN).'), StatusCode.ERR_SELECTION_QTY, 'HÃ£y chá»n sá»‘ lÆ°á»£ng.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'VÃ¬ thiáº¿u hÃ ng nÃªn báº¡n hÃ£y thay Ä‘á»•i sá»‘ lÆ°á»£ng.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ÄÃ£ xáº£y ra lá»—i. Báº¡n hÃ£y thá»­ táº£i láº¡i trang. Sau khi cÃ¡c lá»±a chá»n sáº£n pháº©m Ä‘Æ°á»£c hiá»ƒn thá»‹, báº¡n hÃ£y sá»­ dá»¥ng láº¡i extension hoáº·c add-on Ä‘á»ƒ thÃªm vÃ o giá» hÃ ng Buyee.'), _defineProperty(_defineProperty(_translation8, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Trang nÃ y khÃ´ng thá»ƒ sá»­ dá»¥ng cÃ´ng cá»¥ Add to Buyee. Báº¡n hÃ£y thá»±c hiá»‡n yÃªu cáº§u mua hÃ ng táº¡i pháº§n "Mua qua link sáº£n pháº©m" á»Ÿ trang chá»§ Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'KhÃ´ng thá»ƒ mua ná»™i dung ká»¹ thuáº­t sá»‘ tá»« nÆ°á»›c ngoÃ i.'))
  },
  th: {
    translation: (_translation9 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation9, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'à¸£à¹‰à¸²à¸™à¸„à¹‰à¸²à¸™à¸µà¹‰à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¹ƒà¸™à¸‚à¸“à¸°à¸™à¸µà¹‰'), StatusCode.ERR_UNAVAILABLE, 'à¹€à¸£à¸²à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸›à¸£à¸°à¸¡à¸§à¸¥à¸œà¸¥à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­à¸‚à¸­à¸‡à¸„à¸¸à¸“à¸ªà¸³à¸«à¸£à¸±à¸šà¸ªà¸´à¸™à¸„à¹‰à¸²à¸™à¸µà¹‰à¹„à¸”à¹‰'), StatusCode.ERR_EXCLUDED_ITEM, 'à¸ªà¸´à¸™à¸„à¹‰à¸²à¹„à¸¡à¹ˆà¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸«à¹‰à¸šà¸£à¸´à¸à¸²à¸£'), StatusCode.ERR_SELECTION_OPTIONS, 'à¹‚à¸›à¸£à¸”à¹€à¸¥à¸·à¸­à¸à¸•à¸±à¸§à¹€à¸¥à¸·à¸­à¸à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£(à¸‚à¸™à¸²à¸”, à¸ªà¸µ, à¸­à¸·à¹ˆà¸™ à¹† ) à¹ƒà¸™à¸«à¸™à¹‰à¸²à¹€à¸§à¹‡à¸šà¹€à¸žà¸·à¹ˆà¸­à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¸•à¹ˆà¸­'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'à¹‚à¸›à¸£à¸”à¹€à¸¥à¸·à¸­à¸à¸ªà¸à¸¸à¸¥à¹€à¸‡à¸´à¸™à¹€à¸¢à¸™ (JPY) à¹€à¸›à¹‡à¸™à¸ªà¸à¸¸à¸¥à¹€à¸‡à¸´à¸™à¹ƒà¸™à¸«à¸™à¹‰à¸²à¹€à¸§à¹‡à¸š'), StatusCode.ERR_MULTIPLE_ITEMS, 'à¸«à¸²à¸à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¥à¸‡à¹ƒà¸™à¸£à¸–à¹€à¸‚à¹‡à¸™ Buyee à¹‚à¸›à¸£à¸”à¹„à¸›à¸—à¸µà¹ˆà¸«à¸™à¹‰à¸²à¸‚à¸­à¸‡à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¹‰à¸§à¸„à¸¥à¸´à¸à¸—à¸µà¹ˆà¹„à¸­à¸„à¸­à¸™ "à¹€à¸žà¸´à¹ˆà¸¡à¹„à¸›à¸¢à¸±à¸‡ Buyeeâ€'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'à¹‚à¸›à¸£à¸”à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸—à¸¨à¸à¸µà¹ˆà¸›à¸¸à¹ˆà¸™à¹€à¸›à¹‡à¸™à¸›à¸£à¸°à¹€à¸—à¸¨à¸›à¸¥à¸²à¸¢à¸—à¸²à¸‡à¸ªà¸³à¸«à¸£à¸±à¸šà¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡'), StatusCode.ERR_SELECTION_QTY, 'à¹‚à¸›à¸£à¸”à¹€à¸¥à¸·à¸­à¸à¸ˆà¸³à¸™à¸§à¸™à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'à¹€à¸™à¸·à¹ˆà¸­à¸‡à¸ˆà¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸‚à¸²à¸”à¸ªà¸•à¹‡à¸­à¸ à¸à¸£à¸¸à¸“à¸²à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ˆà¸³à¸™à¸§à¸™à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¸•à¹‰à¸­à¸‡à¸à¸²à¸£'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹‚à¸«à¸¥à¸”à¸•à¸±à¸§à¹€à¸¥à¸·à¸­à¸ªà¸´à¸™à¸„à¹‰à¸²à¹„à¸”à¹‰ ! à¸à¸£à¸¸à¸“à¸²à¸£à¸µà¹‚à¸«à¸¥à¸”à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡à¹€à¸žà¸·à¹ˆà¸­à¸”à¸¹à¸•à¸±à¸§à¹€à¸¥à¸·à¸­à¸à¸ªà¸´à¸™à¸„à¹‰à¸² à¸ˆà¸²à¸à¸™à¸±à¹‰à¸™à¸¥à¸­à¸‡à¹ƒà¸Šà¹‰ extension/add-on à¹€à¸žà¸·à¹ˆà¸­à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²à¸¥à¸‡à¹ƒà¸™à¸£à¸–à¹€à¸‚à¹‡à¸™ Buyee à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡'), _defineProperty(_defineProperty(_translation9, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹ƒà¸Šà¹‰ "Add to Buyee" à¸šà¸™à¸«à¸™à¹‰à¸²à¸ªà¸´à¸™à¸„à¹‰à¸²à¸™à¸µà¹‰à¹„à¸”à¹‰ à¸à¸£à¸¸à¸“à¸²à¹ƒà¸Šà¹‰ã€Œà¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸‚à¸­à¸‹à¸·à¹‰à¸­ã€à¸ˆà¸²à¸à¸«à¸™à¹‰à¸²à¸šà¸™à¸ªà¸¸à¸”à¸‚à¸­à¸‡ Buyee'), StatusCode.ERR_DIGITAL_CONTENT, 'à¹€à¸™à¸·à¹ˆà¸­à¸‡à¸ˆà¸²à¸à¹€à¸›à¹‡à¸™à¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¸”à¸´à¸ˆà¸´à¸—à¸±à¸¥à¸ˆà¸¶à¸‡à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸‹à¸·à¹‰à¸­à¸ˆà¸²à¸à¸•à¹ˆà¸²à¸‡à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸”à¹‰'))
  },
  my: {
    translation: (_translation10 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation10, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'á€¤á€†á€­á€¯á€€á€ºá€žá€Šá€º á€œá€±á€¬á€œá€±á€¬á€†á€šá€º á€™á€›á€›á€¾á€­á€”á€­á€¯á€„á€ºá€•á€«á‹'), StatusCode.ERR_UNAVAILABLE, 'á€¤á€•á€…á€¹á€…á€Šá€ºá€¸á€¡á€á€½á€€á€º á€žá€„á€·á€ºá€™á€¾á€¬á€šá€°á€™á€¾á€¯á€€á€­á€¯ á€€á€»á€½á€”á€ºá€¯á€•á€ºá€á€­á€¯á€· á€™á€œá€¯á€•á€ºá€†á€±á€¬á€„á€ºá€”á€­á€¯á€„á€ºá€•á€«á‹'), StatusCode.ERR_EXCLUDED_ITEM, 'á€¤á€•á€…á€¹á€…á€Šá€ºá€¸á€€á€­á€¯ á€€á€»á€½á€”á€ºá€¯á€•á€ºá€á€­á€¯á€·áá€á€”á€ºá€†á€±á€¬á€„á€ºá€™á€¾á€¯á€™á€¾ á€™á€•á€¶á€·á€•á€­á€¯á€¸á€”á€­á€¯á€„á€ºá€•á€«á‹'), StatusCode.ERR_SELECTION_OPTIONS, 'á€€á€»á€±á€¸á€‡á€°á€¸á€•á€¼á€¯á á€…á€¬á€™á€»á€€á€ºá€”á€¾á€¬á€›á€¾á€­ á€›á€½á€±á€¸á€á€»á€šá€ºá€…á€›á€¬á€™á€»á€¬á€¸ (á€¡á€›á€½á€šá€ºá€¡á€…á€¬á€¸áŠ á€¡á€›á€±á€¬á€„á€ºáŠ á€…á€žá€Šá€º) á€€á€­á€¯ á€›á€½á€±á€¸á€•á€«á‹'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'á€¤á€†á€­á€¯á€€á€ºá€á€½á€„á€ºá€•á€¼á€žá€‘á€¬á€¸á€žá€±á€¬á€„á€½á€±á€€á€¼á€±á€¸á€¡á€–á€¼á€…á€º á€‚á€»á€•á€”á€ºá€šá€”á€ºá€¸ (JPY) á€€á€­á€¯á€›á€½á€±á€¸á€á€»á€šá€ºá€•á€«á‹'), StatusCode.ERR_MULTIPLE_ITEMS, 'á€œá€­á€¯á€á€»á€„á€ºá€žá€±á€¬á€€á€¯á€”á€ºá€•á€…á€¹á€…á€Šá€ºá€¸á€€á€­á€¯ Buyeeá€ˆá€±á€¸á€á€šá€ºá€á€¼á€„á€ºá€¸á€žá€­á€¯á€·á€‘á€Šá€·á€ºá€›á€”á€ºáŠ á€•á€…á€¹á€…á€Šá€ºá€¸á€á€…á€ºá€á€¯á€…á€®áá€¡á€žá€±á€¸á€…á€­á€á€ºá€…á€¬á€™á€»á€€á€ºá€”á€¾á€¬á€€á€­á€¯á€•á€¼á€žá€•á€¼á€®á€¸ Add to Buyee á€€á€­á€¯á€¡á€žá€¯á€¶á€¸á€•á€¼á€¯á€•á€«á‹'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'á€¤á€†á€­á€¯á€€á€ºá€›á€¾á€­ á€•á€­á€¯á€·á€†á€±á€¬á€„á€ºá€›á€±á€¸á€œá€­á€•á€ºá€…á€¬á€¡á€–á€¼á€…á€º á€‚á€»á€•á€”á€ºá€”á€­á€¯á€„á€ºá€„á€¶á€€á€­á€¯ á€›á€½á€±á€¸á€á€»á€šá€ºá€•á€«á‹'), StatusCode.ERR_SELECTION_QTY, 'á€€á€»á€±á€¸á€‡á€°á€¸á€•á€¼á€¯á á€¡á€›á€±á€¡á€á€½á€€á€ºá€€á€­á€¯ á€›á€½á€±á€¸á€á€»á€šá€ºá€•á€«á‹'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Stock á€™á€›á€¾á€­á€á€¬á€€á€¼á€±á€¬á€„á€·á€º á€¡á€›á€±á€¡á€á€½á€€á€ºá€€á€­á€¯ á€•á€¼á€±á€¬á€„á€ºá€¸á€•á€±á€¸á€•á€«á‹'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'á€—á€¬á€¸á€›á€¾á€„á€ºá€¸á€€á€­á€¯ á€á€„á€ºáá€™á€›á€•á€«á‹ á€€á€¯á€”á€ºá€•á€…á€¹á€…á€Šá€ºá€¸á€¡á€™á€»á€­á€¯á€¸á€€á€½á€²á€™á€»á€¬á€¸á€€á€­á€¯á€€á€¼á€Šá€·á€ºá€›á€”á€º á€…á€¬á€™á€»á€€á€ºá€”á€¾á€¬á€€á€­á€¯ á€•á€¼á€”á€ºá€œá€Šá€ºá€…á€á€„á€ºá€•á€«áŠ á€‘á€­á€¯á€·á€”á€±á€¬á€€á€º á€žá€„á€ºá Buyee á€á€½á€”á€ºá€¸á€œá€¾á€Šá€ºá€¸á€žá€­á€¯á€· á€‘á€Šá€·á€ºá€›á€”á€º á€á€­á€¯á€¸á€á€»á€²á€·/á€¡á€•á€­á€¯á€•á€›á€­á€¯á€‚á€›á€™á€ºá€€á€­á€¯ á€‘á€•á€ºá€™á€¶á€¡á€žá€¯á€¶á€¸á€•á€¼á€¯á€•á€«á‹'), _defineProperty(_defineProperty(_translation10, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, '"á€á€šá€ºá€žá€°á€žá€­á€¯á€· á€‘á€Šá€·á€ºá€›á€”á€º" á€¤á€‘á€¯á€á€ºá€€á€¯á€”á€ºá€…á€¬á€™á€»á€€á€ºá€”á€¾á€¬á€á€½á€„á€º á€¡á€žá€¯á€¶á€¸á€™á€•á€¼á€¯á€”á€­á€¯á€„á€ºá€•á€«á‹ á€€á€»á€±á€¸á€‡á€°á€¸á€•á€¼á€¯á Buyee á€¡á€•á€±á€«á€ºá€†á€¯á€¶á€¸á€…á€¬á€™á€»á€€á€ºá€”á€¾á€¬á€™á€¾ ã€Œá€œá€­á€¯á€á€»á€„á€ºá€žá€±á€¬ á€€á€¯á€”á€ºá€•á€…á€¹á€…á€Šá€ºá€¸á URL á€–á€¼á€„á€·á€º á€á€šá€ºá€šá€°á€™á€Šá€ºá‹ã€á€€á€­á€¯á€žá€¯á€¶á€¸á€•á€«á‹'), StatusCode.ERR_DIGITAL_CONTENT, 'áŽá€„á€ºá€¸á€žá€Šá€º á€’á€…á€ºá€‚á€»á€…á€ºá€á€šá€ºá€¡á€€á€¼á€±á€¬á€„á€ºá€¸á€¡á€›á€¬á€–á€¼á€…á€ºá€žá€±á€¬á€€á€¼á€±á€¬á€„á€·á€º á€”á€­á€¯á€„á€ºá€„á€¶á€á€¼á€¬á€¸á€™á€¾ á€á€šá€ºá€šá€°áá€™á€›á€•á€«á‹'))
  },
  es: {
    translation: (_translation11 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation11, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'La tienda no estÃ¡ disponible en este momento.'), StatusCode.ERR_UNAVAILABLE, 'No podemos procesar tu pedido de este artÃ­culo.'), StatusCode.ERR_EXCLUDED_ITEM, 'El artÃ­culo no estÃ¡ disponible para el servicio.'), StatusCode.ERR_SELECTION_OPTIONS, 'Por favor, selecciona las opciones (tamaÃ±o, color, etc.) en la pÃ¡gina para continuar.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Por favor, elige  yen japonÃ©s (JPY) como moneda en la pÃ¡gina.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Para aÃ±adir cada artÃ­culo deseado al carrito de compras de Buyee, visita la pÃ¡gina del artÃ­culo y haz clic en el icono "AÃ±adir a Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Por favor, selecciona JapÃ³n como paÃ­s de destino de la entrega.'), StatusCode.ERR_SELECTION_QTY, 'Por favor, elige la cantidad deseada.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Existencias insuficientes. Por favor, cambie la cantidad.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'No se han podido cargar las opciones. Vuelva a cargar la pÃ¡gina para ver las opciones del artÃ­culo, y luego vuelva a utilizar la extensiÃ³n/add-on para agregar el artÃ­culo al carrito de Buyee.'), _defineProperty(_defineProperty(_translation11, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'La extensiÃ³n [Add to Buyee] no estÃ¡ disponible en esta pÃ¡gina web. Por favor, utilice nuestro servicio de [Comprar a travÃ©s de un URL] en la pÃ¡gina principal de Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Los contenidos digitales no pueden comprarse desde el extranjero.'))
  },
  fr: {
    translation: (_translation12 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation12, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'La boutique n\'est pas disponible actuellement.'), StatusCode.ERR_UNAVAILABLE, 'Nous ne pouvons pas traiter votre commande pour cet article.'), StatusCode.ERR_EXCLUDED_ITEM, 'L\'article n\'est pas pris en charge par notre service.'), StatusCode.ERR_SELECTION_OPTIONS, 'Veuillez sÃ©lectionner les options (taille, couleur, etc.) sur la page pour continuer.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Veuillez choisir le yen japonais (JPY) comme devise affichÃ©e sur ce site.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Pour ajouter les articles souhaitÃ©s au panier Buyee, veuillez consulter la page de l\'article et cliquer sur lâ€™icÃ´ne Â« Add to Buyee Â».'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Veuillez sÃ©lectionner Japon comme pays de livraison.'), StatusCode.ERR_SELECTION_QTY, 'Veuillez choisir la quantitÃ© voulue.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Stock insuffisant. Veuillez modifier la quantitÃ©.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Erreur de chargement des variantes du produit. Veuillez actualiser la page, patienter jusqu\'Ã  ce que les variantes du produit s\'affichent correctement, puis ajouter Ã  nouveau le produit de votre choix au panier Buyee en utilisant l\'extension/l\'add-on.'), _defineProperty(_defineProperty(_translation12, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'L\'extension Â« Add to Buyee Â» n\'est pas compatible avec ce site. Utilisez plutÃ´t le service de Â« Formulaire de demande d\'achat Â» disponible sur Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Les produits numÃ©riques ne peuvent pas Ãªtre achetÃ©s depuis l\'Ã©tranger.'))
  },
  pt: {
    translation: (_translation13 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation13, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'A loja nÃ£o estÃ¡ disponÃ­vel no momento.'), StatusCode.ERR_UNAVAILABLE, 'NÃ£o podemos processar seu pedido para este item.'), StatusCode.ERR_EXCLUDED_ITEM, 'O item nÃ£o estÃ¡ disponÃ­vel para o serviÃ§o.'), StatusCode.ERR_SELECTION_OPTIONS, 'Por favor, selecione as opÃ§Ãµes (tamanho, cor, etc) na pÃ¡gina para prosseguir.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Por favor, escolha o iene japonÃªs (JPY) como moeda na pÃ¡gina.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Para adicionar cada item desejado ao carrinho da Buyee, visite a pÃ¡gina do item e clique no Ã­cone "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Selecione o JapÃ£o como o paÃ­s de destino da entrega.'), StatusCode.ERR_SELECTION_QTY, 'Escolha a quantidade desejada.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Fora de estoque. Por favor altere a quantidade.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Falha ao carregar as opÃ§Ãµes. Recarregue a pÃ¡gina para apresentar as opÃ§Ãµes do produto, em seguida, use novamente a extensÃ£o/add-on para adicionar itens ao carrinho da Buyee.'), _defineProperty(_defineProperty(_translation13, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'A ferramenta [Add to Buyee] nÃ£o estÃ¡ disponÃ­vel para este site. Por favor, utilize nosso outro mÃ©todo de compras [FormulÃ¡rio de solicitaÃ§Ã£o de compra] pelo nosso site oficial.'), StatusCode.ERR_DIGITAL_CONTENT, 'NÃ£o Ã© possÃ­vel comprar conteÃºdos digitais do exterior.'))
  },
  de: {
    translation: (_translation14 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation14, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Der Store ist zurzeit nicht verfÃ¼gbar.'), StatusCode.ERR_UNAVAILABLE, 'Wir kÃ¶nnen Ihre Bestellung fÃ¼r diesen Artikel nicht bearbeiten.'), StatusCode.ERR_EXCLUDED_ITEM, 'Der Artikel ist fÃ¼r den Service nicht verfÃ¼gbar.'), StatusCode.ERR_SELECTION_OPTIONS, 'Bitte wÃ¤hlen Sie die Optionen (GrÃ¶ÃŸe, Farbe usw.) auf der Seite aus, um fortzufahren.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Bitte wÃ¤hlen Sie auf der Seite den Japanischen Yen (JPY) als WÃ¤hrung aus.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Um den gewÃ¼nschten Artikel zum Buyee-Warenkorb hinzuzufÃ¼gen, besuchen Sie bitte die Seite des Artikels und klicken Sie auf das "Zu Buyee hinzufÃ¼gen"-Symbol.'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Bitte wÃ¤hlen Sie Japan als Lieferzielland aus.'), StatusCode.ERR_SELECTION_QTY, 'Bitte wÃ¤hlen Sie die gewÃ¼nschte Anzahl.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Unzureichender Lagerbestand. Bitte Ã¤ndern Sie die gewÃ¼nschte Anzahl.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Die Optionen konnten nicht geladen werden. Bitte aktualisieren Sie die Seite und warten Sie, bis die Optionen fÃ¼r diesen Artikel angezeigt werden. AnschlieÃŸend verwenden Sie die Erweiterung/Add-On erneut, um den gewÃ¼nschten Artikel in den Buyee-Warenkorb zu legen.'), _defineProperty(_defineProperty(_translation14, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Diese Produktseite unterstÃ¼tzt die Verwendung von "Add to Buyee" nicht. Bitte verwenden Sie "Einkaufen mit der URL des gewÃ¼nschten Artikels" auf der Buyee-Startseite.'), StatusCode.ERR_DIGITAL_CONTENT, 'Der Kauf von digitalen Inhalten aus dem Ausland ist nicht mÃ¶glich.'))
  },
  it: {
    translation: (_translation15 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation15, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Attualmente non il sito non Ã¨ utilizzabile'), StatusCode.ERR_UNAVAILABLE, 'Non possiamo processare il suo ordine per questi articoli.'), StatusCode.ERR_EXCLUDED_ITEM, 'Il prodotto non Ã¨ disponibile per il servizio.'), StatusCode.ERR_SELECTION_OPTIONS, 'Per favore, seleziona le opzioni (taglia, colore, etc) sulla pagina per proseguire.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Per favore, seleziona yen giapponese (JPY) come valuta su questa pagina.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Per aggiungere gli articoli desiderati sul carrello di Buyee, per favore visita la pagina dell\'articolo e clicca sull\'icona "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Seleziona il Giappone come paese di destinazione della consegna.'), StatusCode.ERR_SELECTION_QTY, 'Si prega di scegliere la quantitÃ  desiderata.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Si prega di modificare la quantitÃ  a causa di scorte insufficienti.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Impossibile caricare le opzioni. Ricaricare la pagina per visualizzare le opzioni del prodotto, quindi utilizzare nuovamente l\'estensione/il componente aggiuntivo per aggiungere gli articoli al carrello di Buyee.'), _defineProperty(_defineProperty(_translation15, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Lo strumento [Add to Buyee] non Ã¨ disponibile per questo sito. Utilizzare "Acquista tramite il link del prodotto che desideri" dalla pagina principale di Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'I contenuti digitali non possono essere acquistati all\'estero.'))
  },
  pl: {
    translation: (_translation16 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation16, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Sklep jest w tej chwili nie dostÄ™pny.'), StatusCode.ERR_UNAVAILABLE, 'Nie jesteÅ›my w stanie przetworzyÄ‡ zamÃ³wienia na ten przedmiot.'), StatusCode.ERR_EXCLUDED_ITEM, 'Przedmiot nie jest dostÄ™pny dla usÅ‚ugi.'), StatusCode.ERR_SELECTION_OPTIONS, 'Wybierz opcje (rozmiar, kolor etc.), na stronie aby kontynuowÄ‡.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Wybierz JPY (japoÅ„skÄ… walutÄ™) na stronie jako walutÄ™.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Aby dodaÄ‡ poÅ¼Ä…dany przedmiot do koszyka Buyee, przejdÅº na stronÄ™ przedmiotu i kliknij ikonkÄ™ "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Wybierz JaponiÄ™ jako kraj dostawy.'), StatusCode.ERR_SELECTION_QTY, 'Wybierz poÅ¼Ä…danÄ… iloÅ›Ä‡.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'NiewystarczajÄ…cy zapas. ProszÄ™ zmieniÄ‡ iloÅ›Ä‡.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'Nie udaÅ‚o siÄ™ wczytaÄ‡ wariantÃ³w! OdÅ›wieÅ¼ stronÄ™, wyÅ›wietl warianty produktÃ³w, a nastÄ™pnie sprÃ³buj ponownie uÅ¼yÄ‡ rozszerzenia/dodatku, aby dodaÄ‡ pozycje do koszyka Buyee.'), _defineProperty(_defineProperty(_translation16, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Na stronie tego produktu nie moÅ¼na uÅ¼yÄ‡ rozszerzenia [Add to Buyee]. Skorzystaj z opcji â€žFormularz zamÃ³wienia dla innych stronâ€ na stronie gÅ‚Ã³wnej Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Zakup treÅ›ci cyfrowych nie jest dostÄ™pny w sprzedaÅ¼y zagranicznej.'))
  },
  tr: {
    translation: (_translation17 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation17, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Bu maÄŸaza ÅŸu an uygun deÄŸildir. '), StatusCode.ERR_UNAVAILABLE, 'Bu sipariÅŸiniz iÃ§in iÅŸleme devam edemiyoruz.'), StatusCode.ERR_EXCLUDED_ITEM, 'Bu Ã¼rÃ¼n kapsam dÄ±ÅŸÄ±dÄ±r.'), StatusCode.ERR_SELECTION_OPTIONS, 'Devam edebilmek iÃ§in lÃ¼tfen opsiyonlarÄ± (Ã¼rÃ¼n adedi, renk, vs...) seÃ§in. '), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'LÃ¼tfen para birimi olarak Japon Yeni (JPY) seÃ§in. '), StatusCode.ERR_MULTIPLE_ITEMS, 'Buyee kartÄ±nÄ±za Ã¼rÃ¼n ekleyebilmek iÃ§in lÃ¼tfen Ã¼rÃ¼n sayfasÄ±ndan "Add to Buyee" simgesine tÄ±klayÄ±n. '), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'LÃ¼tfen varÄ±ÅŸ Ã¼lkesi olarak Japonya\'yÄ± seÃ§in.'), StatusCode.ERR_SELECTION_QTY, 'LÃ¼tfen arzu ettiÄŸiniz Ã¼rÃ¼n adedini girin. '), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Yetersiz stok! LÃ¼tfen girdiÄŸiniz miktarÄ± gÃ¼ncelleyin.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ÃœrÃ¼n varyasyonlarÄ± yÃ¼klenemedi! LÃ¼tfen sayfayÄ± yeniden yÃ¼kleyin, Ã¼rÃ¼n Ã§eÅŸitlerini gÃ¶rÃ¼ntÃ¼leyin ve ardÄ±ndan eklentiyi kullanarak Ã¼rÃ¼nÃ¼ Buyee sepetine ekleyin.'), _defineProperty(_defineProperty(_translation17, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Bu Ã¼rÃ¼n sayfasÄ±nda "Add to Buyee" kullanÄ±lamÄ±yor. LÃ¼tfen Buyee ana sayfasÄ±ndan "DiÄŸer Sitelerden SatÄ±n Alma Formu" seÃ§eneÄŸini kullanÄ±n.'), StatusCode.ERR_DIGITAL_CONTENT, 'Dijital iÃ§erikler denizaÅŸÄ±rÄ± Ã¼lkelerden satÄ±n alÄ±namaz.'))
  },
  ru: {
    translation: (_translation18 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation18, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Ð’ Ð½Ð°ÑÑ‚Ð¾ÑÑ‰ÐµÐµ Ð²Ñ€ÐµÐ¼Ñ Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½.'), StatusCode.ERR_UNAVAILABLE, 'ÐÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ð±Ñ€Ð°Ð±Ð¾Ñ‚Ð°Ñ‚ÑŒ Ð²Ð°Ñˆ Ð·Ð°ÐºÐ°Ð· Ð½Ð° ÑÑ‚Ð¾Ñ‚ Ñ‚Ð¾Ð²Ð°Ñ€.'), StatusCode.ERR_EXCLUDED_ITEM, 'Ð¢Ð¾Ð²Ð°Ñ€ Ð½Ðµ Ð´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½ Ð´Ð»Ñ ÑƒÑÐ»ÑƒÐ³Ð¸.'), StatusCode.ERR_SELECTION_OPTIONS, 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð´Ð¾Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ñ‹ (Ñ€Ð°Ð·Ð¼ÐµÑ€, Ñ†Ð²ÐµÑ‚ Ð¸ Ñ‚. Ð´.) Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ðµ, Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¿Ñ€Ð¾Ð´Ð¾Ð»Ð¶Ð¸Ñ‚ÑŒ.'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ðµ ÑÐ¿Ð¾Ð½ÑÐºÑƒÑŽ Ð¸ÐµÐ½Ñƒ (JPY) Ð² ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ðµ Ð²Ð°Ð»ÑŽÑ‚Ñ‹.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Ð§Ñ‚Ð¾Ð±Ñ‹ Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð½ÑƒÐ¶Ð½Ñ‹Ð¹ Ñ‚Ð¾Ð²Ð°Ñ€ Ð² ÐºÐ¾Ñ€Ð·Ð¸Ð½Ñƒ Buyee, Ð¿ÐµÑ€ÐµÐ¹Ð´Ð¸Ñ‚Ðµ Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñƒ Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð¸ Ñ‰ÐµÐ»ÐºÐ½Ð¸Ñ‚Ðµ Ð·Ð½Ð°Ñ‡Ð¾Ðº Â«Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð² BuyeeÂ».'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð¯Ð¿Ð¾Ð½Ð¸ÑŽ Ð² ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ðµ ÑÑ‚Ñ€Ð°Ð½Ñ‹ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸.'), StatusCode.ERR_SELECTION_QTY, 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð½ÑƒÐ¶Ð½Ð¾Ðµ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'ÐÐµÐ´Ð¾ÑÑ‚Ð°Ñ‚Ð¾Ñ‡Ð½Ð¾ Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð½Ð° ÑÐºÐ»Ð°Ð´Ðµ. ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð¸Ð·Ð¼ÐµÐ½Ð¸Ñ‚Ðµ Ð·Ð°Ð¿Ñ€Ð°ÑˆÐ¸Ð²Ð°ÐµÐ¼Ð¾Ðµ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð·Ð°Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑŒ Ð½ÑƒÐ¶Ð½ÑƒÑŽ Ð¾Ð¿Ñ†Ð¸ÑŽ. Ð”Ð»Ñ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð° Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ñ… Ð²Ð°Ñ€Ð¸Ð°Ð½Ñ‚Ð¾Ð², Ð¿Ð¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð¿ÐµÑ€ÐµÐ·Ð°Ð³Ñ€ÑƒÐ·Ð¸Ñ‚Ðµ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñƒ, Ð° Ð·Ð°Ñ‚ÐµÐ¼ ÑÐ½Ð¾Ð²Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹Ñ‚Ðµ Ñ€Ð°ÑÑˆÐ¸Ñ€ÐµÐ½Ð¸Ðµ/add-on, Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ñ‚Ð¾Ð²Ð°Ñ€ Ð² ÐºÐ¾Ñ€Ð·Ð¸Ð½Ñƒ Ð´Ð»Ñ Ð¿Ð¾ÐºÑƒÐ¿Ð¾Ðº.'), _defineProperty(_defineProperty(_translation18, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Ð­Ñ‚Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° Ð½Ðµ Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑŽ "Add to Buyee". ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ð¾ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹Ñ‚ÐµÑÑŒ "ÐŸÐ¾ÐºÑƒÐ¿ÐºÐ° Ð¿Ð¾ URL Ñ‚Ð¾Ð²Ð°Ñ€Ð°" Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð¾Ð¹ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ðµ Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Ð¦Ð¸Ñ„Ñ€Ð¾Ð²Ð¾Ð¹ ÐºÐ¾Ð½Ñ‚ÐµÐ½Ñ‚ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½ Ð´Ð»Ñ Ð¿Ð¾ÐºÑƒÐ¿ÐºÐ¸ Ð¸Ð·-Ð·Ð° Ñ€ÑƒÐ±ÐµÐ¶Ð°.'))
  },
  ar: {
    translation: (_translation19 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_translation19, StatusCode.ERR_TEMPORARY_UNAVAILABLE, 'Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§.'), StatusCode.ERR_UNAVAILABLE, 'Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§.'), StatusCode.ERR_EXCLUDED_ITEM, 'Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ØªÙˆÙØ± Ù„Ù„Ø®Ø¯Ù…Ø©.'), StatusCode.ERR_SELECTION_OPTIONS, 'ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª (Ø§Ù„Ø­Ø¬Ù… ÙˆØ§Ù„Ù„ÙˆÙ† ÙˆØºÙŠØ±Ù‡) ÙÙŠ Ø§Ù„ØµÙØ­Ø© .'), StatusCode.ERR_CURRENCY_UNAVAILABLE, 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ÙŠÙ† Ø§Ù„ÙŠØ§Ø¨Ø§Ù†ÙŠ (JPY) ÙƒØ¹Ù…Ù„Ø© Ø§Ù„Ø¹Ø±Ø¶ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹.'), StatusCode.ERR_MULTIPLE_ITEMS, 'Ù„Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ ØªØ±ØºØ¨ ÙÙŠÙ‡ Ø¥Ù„Ù‰ Ø¹Ø±Ø¨Ø© ØªØ³ÙˆÙ‚ BuyeeØŒ Ø§ÙØªØ­ ØµÙØ­Ø© ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬ ÙˆØ§Ø³ØªØ®Ø¯Ù… "Add to Buyee".'), StatusCode.ERR_DELIVERY_UNAVAILABLE, 'Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ÙŠØ§Ø¨Ø§Ù† (JAPAN) ÙƒØ¨Ù„Ø¯ Ø§Ù„Ø´Ø­Ù† Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹'), StatusCode.ERR_SELECTION_QTY, 'ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©.'), StatusCode.ERR_UNAVAILABLE_OVER_STOCK, 'Ù†Ø¸Ø±Ù‹Ø§ Ù„Ù†Ù‚Øµ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†ØŒ ÙŠØ±Ø¬Ù‰ ØªØºÙŠÙŠØ± Ø§Ù„ÙƒÙ…ÙŠØ©.'), StatusCode.ERR_UNAVAILABLE_READ_DELAY, 'ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø®ÙŠØ§Ø±. ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ« Ø§Ù„ØµÙØ­Ø©ØŒ ÙˆØ¹Ø±Ø¶ Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬ØŒ Ø«Ù… Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¥Ø¶Ø§ÙØ©/Ø§Ù„Ù…Ù„Ø­Ù‚ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ù„Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø¥Ù„Ù‰ Ø³Ù„Ø© Buyee.'), _defineProperty(_defineProperty(_translation19, StatusCode.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE, 'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ø³ØªØ®Ø¯Ø§Ù… "Add to Buyee" Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆÙ‚Ø¹. ÙŠØ±Ø¬Ù‰ Ø§Ø³ØªØ®Ø¯Ø§Ù… "Ø§Ù„Ø´Ø±Ø§Ø¡ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¹Ù†ÙˆØ§Ù† URL Ù„Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø°ÙŠ ØªØ±ÙŠØ¯Ù‡" Ø¹Ù„Ù‰ Ù…ÙˆÙ‚Ø¹ Buyee.'), StatusCode.ERR_DIGITAL_CONTENT, 'Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø´Ø±Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø±Ù‚Ù…ÙŠ Ù…Ù† Ø®Ø§Ø±Ø¬ Ø§Ù„ÙŠØ§Ø¨Ø§Ù†.'))
  }
};

},{"../util/status_code":408,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-own-property-descriptor.js":352,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/es.weak-map.js":379,"core-js/modules/web.dom-collections.iterator.js":381}],385:[function(require,module,exports){
'use strict';

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var BaseElement = exports.default = /*#__PURE__*/function () {
  function BaseElement() {
    var $ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
    _classCallCheck(this, BaseElement);
    this.$ = $;
    this.SELECTORS = [];
  }
  return _createClass(BaseElement, [{
    key: "setDocument",
    value: function setDocument($) {
      this.$ = $;
    }
  }, {
    key: "selectors",
    value: function selectors() {
      return this.SELECTORS.join(',');
    }
  }, {
    key: "parse",
    value: function parse() {}
  }]);
}();

},{"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],386:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.string.trim.js");
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
var _uniq = require("../../../../../util/uniq");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var CategoryIds = exports.default = /*#__PURE__*/function (_BaseElement) {
  function CategoryIds($) {
    var _this;
    _classCallCheck(this, CategoryIds);
    _this = _callSuper(this, CategoryIds, [$]);
    _this.SELECTORS = [''];
    return _this;
  }
  _inherits(CategoryIds, _BaseElement);
  return _createClass(CategoryIds, [{
    key: "parse",
    value: function parse() {
      try {
        var elements = this.$.querySelectorAll(this.selectors());
        var categoryIds = _toConsumableArray(elements).map(function (element) {
          return element.textContent.trim();
        });
        return (0, _uniq.uniq)(categoryIds);
      } catch (e) {
        return [];
      }
    }
  }]);
}(_baseElement.default);

},{"../../../../../util/uniq":410,"../../../../base-element":385,"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.map.js":347,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.string.trim.js":370,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],387:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Code = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Code($) {
    var _this;
    _classCallCheck(this, Code);
    _this = _callSuper(this, Code, [$]);
    _this.SELECTORS = ['meta[property="og:url"]'];
    return _this;
  }
  _inherits(Code, _BaseElement);
  return _createClass(Code, [{
    key: "parse",
    value: function parse() {
      var element = this.$.querySelector(this.selectors());
      return element ? element.content.split('/').pop().split('.')[0] : '';
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],388:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Description = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Description($) {
    var _this;
    _classCallCheck(this, Description);
    _this = _callSuper(this, Description, [$]);
    _this.SELECTORS = ['meta[name="description"]'];
    return _this;
  }
  _inherits(Description, _BaseElement);
  return _createClass(Description, [{
    key: "parse",
    value: function parse() {
      var element = this.$.querySelector(this.selectors());
      return element ? element.content : '';
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],389:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.object.to-string.js");
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var HasStock = exports.default = /*#__PURE__*/function (_BaseElement) {
  function HasStock($) {
    var _this;
    _classCallCheck(this, HasStock);
    _this = _callSuper(this, HasStock, [$]);
    _this.SELECTORS = ['.stock-alert-custom button'];
    return _this;
  }
  _inherits(HasStock, _BaseElement);
  return _createClass(HasStock, [{
    key: "parse",
    value: function parse() {
      var elements = this.$.querySelectorAll(this.selectors());
      return _toConsumableArray(elements).every(function (btn) {
        return getComputedStyle(btn).display === 'none';
      });
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],390:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Image = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Image($) {
    var _this;
    _classCallCheck(this, Image);
    _this = _callSuper(this, Image, [$]);
    _this.SELECTORS = ['meta[property="og:image"]'];
    return _this;
  }
  _inherits(Image, _BaseElement);
  return _createClass(Image, [{
    key: "parse",
    value: function parse() {
      var element = this.$.querySelector(this.selectors());
      return element ? element.content : '';
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],391:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var IsLimited = exports.default = /*#__PURE__*/function (_BaseElement) {
  function IsLimited() {
    _classCallCheck(this, IsLimited);
    return _callSuper(this, IsLimited, arguments);
  }
  _inherits(IsLimited, _BaseElement);
  return _createClass(IsLimited, [{
    key: "parse",
    value: function parse() {
      return false;
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],392:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var IsProduct = exports.default = /*#__PURE__*/function (_BaseElement) {
  function IsProduct($) {
    var _this;
    _classCallCheck(this, IsProduct);
    _this = _callSuper(this, IsProduct, [$]);
    _this.SELECTORS = ['.product-info-main'];
    return _this;
  }
  _inherits(IsProduct, _BaseElement);
  return _createClass(IsProduct, [{
    key: "parse",
    value: function parse() {
      return !!this.$.querySelector(this.selectors());
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],393:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
var _convert = require("../../../../../util/convert");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Price = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Price($) {
    var _this;
    _classCallCheck(this, Price);
    _this = _callSuper(this, Price, [$]);
    _this.SELECTORS = ['.product-info-price .price'];
    return _this;
  }
  _inherits(Price, _BaseElement);
  return _createClass(Price, [{
    key: "parse",
    value: function parse() {
      try {
        var element = this.$.querySelector(this.selectors());
        return (0, _convert.toNumber)(element.textContent);
      } catch (e) {
        return '0';
      }
    }
  }]);
}(_baseElement.default);

},{"../../../../../util/convert":405,"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],394:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Quantity = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Quantity($) {
    var _this;
    _classCallCheck(this, Quantity);
    _this = _callSuper(this, Quantity, [$]);
    _this.SELECTORS = [''];
    return _this;
  }
  _inherits(Quantity, _BaseElement);
  return _createClass(Quantity, [{
    key: "parse",
    value: function parse() {
      try {
        var element = this.$.querySelector(this.selectors());
        return element.value;
      } catch (e) {
        return '1';
      }
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],395:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var SellerId = exports.default = /*#__PURE__*/function (_BaseElement) {
  function SellerId() {
    _classCallCheck(this, SellerId);
    return _callSuper(this, SellerId, arguments);
  }
  _inherits(SellerId, _BaseElement);
  return _createClass(SellerId, [{
    key: "parse",
    value: function parse() {
      return '0';
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],396:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Seller = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Seller() {
    _classCallCheck(this, Seller);
    return _callSuper(this, Seller, arguments);
  }
  _inherits(Seller, _BaseElement);
  return _createClass(Seller, [{
    key: "parse",
    value: function parse() {
      return 'www.onitsukatiger.com';
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],397:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.string.trim.js");
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Title = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Title($) {
    var _this;
    _classCallCheck(this, Title);
    _this = _callSuper(this, Title, [$]);
    _this.SELECTORS = ['h1.page-title span'];
    return _this;
  }
  _inherits(Title, _BaseElement);
  return _createClass(Title, [{
    key: "parse",
    value: function parse() {
      try {
        var element = this.$.querySelector(this.selectors());
        return element.textContent.trim();
      } catch (e) {
        return '';
      }
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.string.trim.js":370,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],398:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.trim.js");
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
var _status_code = require("../../../../../util/status_code");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Unavailable = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Unavailable($) {
    var _this;
    _classCallCheck(this, Unavailable);
    _this = _callSuper(this, Unavailable, [$]);
    _this.SELECTORS = ['.swatch-attribute-selected-option'];
    return _this;
  }
  _inherits(Unavailable, _BaseElement);
  return _createClass(Unavailable, [{
    key: "parse",
    value: function parse() {
      if (this.isVariationUnselected()) {
        return _status_code.ERR_SELECTION_OPTIONS;
      }
      return _status_code.AVAILABLE;
    }
  }, {
    key: "isVariationUnselected",
    value: function isVariationUnselected() {
      var elements = this.$.querySelectorAll(this.selectors());
      return _toConsumableArray(elements).some(function (element) {
        return !element.textContent || element.textContent.trim() === '';
      });
    }
  }]);
}(_baseElement.default);

},{"../../../../../util/status_code":408,"../../../../base-element":385,"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.string.trim.js":370,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],399:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Url = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Url() {
    _classCallCheck(this, Url);
    return _callSuper(this, Url, arguments);
  }
  _inherits(Url, _BaseElement);
  return _createClass(Url, [{
    key: "parse",
    value: function parse() {
      return this.$.location.href;
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],400:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var VariationKeys = exports.default = /*#__PURE__*/function (_BaseElement) {
  function VariationKeys() {
    _classCallCheck(this, VariationKeys);
    return _callSuper(this, VariationKeys, arguments);
  }
  _inherits(VariationKeys, _BaseElement);
  return _createClass(VariationKeys, [{
    key: "parse",
    value: function parse() {
      return [];
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],401:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var VariationOptions = exports.default = /*#__PURE__*/function (_BaseElement) {
  function VariationOptions() {
    _classCallCheck(this, VariationOptions);
    return _callSuper(this, VariationOptions, arguments);
  }
  _inherits(VariationOptions, _BaseElement);
  return _createClass(VariationOptions, [{
    key: "parse",
    value: function parse() {
      return [];
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],402:[function(require,module,exports){
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.get-prototype-of.js");
require("core-js/modules/es.reflect.construct.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/web.dom-collections.for-each.js");
var _baseElement = _interopRequireDefault(require("../../../../base-element"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
var Variations = exports.default = /*#__PURE__*/function (_BaseElement) {
  function Variations($) {
    var _this;
    _classCallCheck(this, Variations);
    _this = _callSuper(this, Variations, [$]);
    _this.SELECTORS = ['.swatch-attribute'];
    _this.SELECTOR_KEY = ['.swatch-attribute-label'];
    _this.SELECTOR_VALUE = ['.swatch-option.selected'];
    return _this;
  }
  _inherits(Variations, _BaseElement);
  return _createClass(Variations, [{
    key: "parse",
    value: function parse() {
      var _this2 = this;
      try {
        var variations = [];
        var elements = this.$.querySelectorAll(this.selectors());
        _toConsumableArray(elements).forEach(function (element) {
          var _element$querySelecto, _element$querySelecto2;
          var keyElement = (_element$querySelecto = element.querySelector(_this2.SELECTOR_KEY.join(','))) === null || _element$querySelecto === void 0 || (_element$querySelecto = _element$querySelecto.textContent) === null || _element$querySelecto === void 0 ? void 0 : _element$querySelecto.trim();
          var valueElement = (_element$querySelecto2 = element.querySelector(_this2.SELECTOR_VALUE.join(','))) === null || _element$querySelecto2 === void 0 || (_element$querySelecto2 = _element$querySelecto2.getAttribute('data-option-label')) === null || _element$querySelecto2 === void 0 ? void 0 : _element$querySelecto2.trim();
          if (keyElement && valueElement) {
            variations.push({
              key: keyElement,
              value: valueElement
            });
          }
        });
        return variations;
      } catch (e) {
        return [];
      }
    }
  }]);
}(_baseElement.default);

},{"../../../../base-element":385,"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.get-prototype-of.js":354,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.reflect.construct.js":363,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.string.trim.js":370,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.for-each.js":380,"core-js/modules/web.dom-collections.iterator.js":381}],403:[function(require,module,exports){
'use strict';

require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
var _serviceTypes = require("../../../service-types");
var _messages = require("../../../../util/messages");
var _status_code = require("../../../../util/status_code.js");
var _categoryIds = _interopRequireDefault(require("./elements/category-ids.js"));
var _code = _interopRequireDefault(require("./elements/code.js"));
var _description = _interopRequireDefault(require("./elements/description.js"));
var _hasStock = _interopRequireDefault(require("./elements/has-stock.js"));
var _image = _interopRequireDefault(require("./elements/image.js"));
var _isLimited = _interopRequireDefault(require("./elements/is-limited.js"));
var _isProduct = _interopRequireDefault(require("./elements/is-product.js"));
var _price = _interopRequireDefault(require("./elements/price.js"));
var _quantity = _interopRequireDefault(require("./elements/quantity.js"));
var _sellerId = _interopRequireDefault(require("./elements/seller-id.js"));
var _seller = _interopRequireDefault(require("./elements/seller.js"));
var _title = _interopRequireDefault(require("./elements/title.js"));
var _unavailable = _interopRequireDefault(require("./elements/unavailable.js"));
var _url = _interopRequireDefault(require("./elements/url.js"));
var _variationKeys = _interopRequireDefault(require("./elements/variation-keys.js"));
var _variationOptions = _interopRequireDefault(require("./elements/variation-options.js"));
var _variations = _interopRequireDefault(require("./elements/variations.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Parser = exports.default = /*#__PURE__*/function () {
  function Parser($) {
    var lang = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    _classCallCheck(this, Parser);
    this.serviceType = _serviceTypes.WWW_ONITSUKATIGER_COM;
    this.categoryIds = new _categoryIds.default($);
    this.code = new _code.default($);
    this.description = new _description.default($);
    this.hasStock = new _hasStock.default($);
    this.image = new _image.default($);
    this.isLimited = new _isLimited.default($);
    this.isProduct = new _isProduct.default($);
    this.price = new _price.default($);
    this.quantity = new _quantity.default($);
    this.sellerId = new _sellerId.default($);
    this.seller = new _seller.default($);
    this.title = new _title.default($);
    this.unavailable = new _unavailable.default($);
    this.url = new _url.default($);
    this.variationKeys = new _variationKeys.default($);
    this.variationOptions = new _variationOptions.default($);
    this.variations = new _variations.default($);
    this.messages = new _messages.Messages(lang);
  }
  return _createClass(Parser, [{
    key: "parse",
    value: function parse() {
      var status = this.unavailable.parse();
      var isProduct = this.isProduct.parse();
      if (!isProduct) {
        return Promise.reject(null);
      }
      if (status !== _status_code.AVAILABLE) {
        return Promise.reject({
          'message': this.messages.get(status)
        });
      }
      var item = {
        'service_type': this.serviceType,
        'category_ids': this.categoryIds.parse(),
        'code': this.code.parse(),
        'description': this.description.parse(),
        'has_stock': this.hasStock.parse(),
        'image': this.image.parse(),
        'is_limited': this.isLimited.parse(),
        'price': this.price.parse(),
        'quantity': this.quantity.parse(),
        'seller_id': this.sellerId.parse(),
        'seller': this.seller.parse(),
        'title': this.title.parse(),
        'url': this.url.parse(),
        'variation_keys': this.variationKeys.parse(),
        'variation_options': this.variationOptions.parse(),
        'variations': this.variations.parse(),
        'is_quantity_selectable': true
      };
      return Promise.resolve(item);
    }
  }]);
}();

},{"../../../../util/messages":407,"../../../../util/status_code.js":408,"../../../service-types":404,"./elements/category-ids.js":386,"./elements/code.js":387,"./elements/description.js":388,"./elements/has-stock.js":389,"./elements/image.js":390,"./elements/is-limited.js":391,"./elements/is-product.js":392,"./elements/price.js":393,"./elements/quantity.js":394,"./elements/seller-id.js":395,"./elements/seller.js":396,"./elements/title.js":397,"./elements/unavailable.js":398,"./elements/url.js":399,"./elements/variation-keys.js":400,"./elements/variation-options.js":401,"./elements/variations.js":402,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.promise.js":359,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],404:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WWW_COSME_COM = exports.WWW_COEN_CO_JP = exports.WWW_CLOSETCHILDONLINESHOP_COM = exports.WWW_CHARA_ANI_COM = exports.WWW_CA4LA_COM = exports.WWW_BELLEMAISON_JP = exports.WWW_ASMART_JP = exports.WWW_ANIMATE_ONLINESHOP_JP = exports.WWW_AMAZON_CO_JP = exports.WWW_ADIDAS_JP = exports.WWW_ABC_MART_NET = exports.WWW_2NDSTREET_JP = exports.WWW_1999_CO_JP = exports.WORKMAN_JP = exports.WEGO_JP = exports.VOI_0101_CO_JP = exports.USAGI_ONLINE_COM = exports.UNITED_TOKYO_COM = exports.TOWER_JP = exports.TOHOANIMATIONSTORE_COM = exports.TKJ_JP = exports.TITIVATE_JP = exports.TAMIYASHOP_JP = exports.SUZURI_JP = exports.STUDIOUS_CO_JP = exports.STORE_WORLD_CO_JP = exports.STORE_UNIVERSAL_MUSIC_CO_JP = exports.STORE_UNITED_ARROWS_CO_JP = exports.STORE_TOMORROWLAND_CO_JP = exports.STORE_TOEI_ANIM_CO_JP = exports.STORE_PLUSMEMBER_JP = exports.STORE_KADOKAWA_CO_JP = exports.STORE_JP_SQUARE_ENIX_COM = exports.STORE_HYSTERICGLAMOUR_JP = exports.STORE_DISNEY_CO_JP = exports.SHOP_YOSTAR_CO_JP = exports.SHOP_VISVIM_TV = exports.SHOP_TSUTAYA_CO_JP = exports.SHOP_SMTOWN_JP = exports.SHOP_SHIRTS_CO_JP = exports.SHOP_SAN_X_CO_JP = exports.SHOP_SANRIO_CO_JP = exports.SHOP_NJPW_CO_JP = exports.SHOP_NISHIKAWA1566_COM = exports.SHOP_MU_MO_NET = exports.SHOP_LASHINBANG_COM = exports.SHOP_KIND_CO_JP = exports.SHOP_HOLOLIVEPRO_COM = exports.SHOP_AXESFEMME_COM = exports.SHOP_ASOBISTORE_JP = exports.SHOP_AKACHAN_JP = exports.SHOP_AFTERNOON_TEA_NET = exports.SHOPPING_YAHOO_CO_JP = exports.SHOPPING_BOOKOFF_CO_JP = exports.SANRIO_ANIMESTORE_A3_JP = exports.RUNWAY_WEBSTORE_COM = exports.ROOMYS_WEBSTORE_JP = exports.RONHERMAN_JP = exports.RINKAN_ONLINE_COM = exports.RAKUTEN_CO_JP = exports.PUNYUS_JP = exports.PUBLIC_TOKYO_COM = exports.ORDER_MANDARAKE_CO_JP = exports.ONLINE_ANIPLEX_CO_JP = exports.NETMALL_HARDOFF_CO_JP = exports.MYCOLOR_JP = exports.MINNE_COM = exports.MAGI_CAMP = exports.LOCONDO_JP = exports.KOMEHYO_JP = exports.KIRBYCAFE_POPUP_COM = exports.JUMPCS_SHUEISHA_CO_JP = exports.JP_MERCARI_COM = exports.I_LUMINE_JP = exports.HOBBYJAPAN_SHOP_COM = exports.HANDS_NET = exports.FRIL_JP = exports.FASHIONWALKER_COM = exports.ESHOP_FUJITV_CO_JP = exports.ELLESHOP_JP = exports.EEO_TODAY = exports.EDEPART_SOGO_SEIBU_JP = exports.ECS_TORANOANA_JP = exports.EBTEN_JP = exports.DISKUNION_NET = exports.CROSSET_ONWARD_CO_JP = exports.COSPA_COM = exports.CHIIKAWAMOGUMOGU_SHOP = exports.CHIIKAWAMARKET_JP = exports.CARDSHOP_SERRA_COM = exports.CANSHOP_JP = exports.BUSHIROAD_STORE_COM = exports.BRUNO_ONLINESHOP_COM = exports.BROCCOLIONLINE_JP = exports.BOOTH_PM = exports.BAYCREWS_JP = exports.AMNIBUS_COM = exports.ALICE_BOOKS_COM = exports.AILAND_STORE_JP = exports.AGETE_COM = void 0;
exports.YUYU_TEI_JP = exports.WWW_WUNDERWELT_JP = exports.WWW_WEBIKE_NET = exports.WWW_WAIPER_CO_JP = exports.WWW_URBAN_RESEARCH_JP = exports.WWW_TREFAC_JP = exports.WWW_TOYSRUS_CO_JP = exports.WWW_TOKYOKAWAIILIFE_JP = exports.WWW_TMSSHOP_JP = exports.WWW_TAKASHIMAYA_CO_JP = exports.WWW_S_DARTS_COM = exports.WWW_SUPER_RC_CO_JP = exports.WWW_SUPER_GROUPIES_COM = exports.WWW_STELLAWORTH_CO_JP = exports.WWW_SOPH_NET = exports.WWW_SONY_JP = exports.WWW_SOFMAP_COM = exports.WWW_SHIPSLTD_CO_JP = exports.WWW_RAGTAG_JP = exports.WWW_PONYCANYON_CO_JP = exports.WWW_POKEMONCENTER_ONLINE_COM = exports.WWW_PLAZASTYLE_COM = exports.WWW_PALCLOSET_JP = exports.WWW_ONITSUKATIGER_COM = exports.WWW_NEWERACAP_JP = exports.WWW_NEUVE_A_NET = exports.WWW_NETOFF_CO_JP = exports.WWW_NEOWING_CO_JP = exports.WWW_NARUMIYA_ONLINE_JP = exports.WWW_MUJI_COM = exports.WWW_MOVIC_JP = exports.WWW_MELONBOOKS_CO_JP = exports.WWW_MATSUKIYOCOCOKARA_ONLINE_COM = exports.WWW_MAPCAMERA_COM = exports.WWW_MANGAZENKAN_COM = exports.WWW_MAGASEEK_COM = exports.WWW_LOFT_CO_JP = exports.WWW_KOSHO_OR_JP = exports.WWW_KONAMISTYLE_JP = exports.WWW_KINOKUNIYA_CO_JP = exports.WWW_KAPITAL_WEBSHOP_JP = exports.WWW_JELLY_BEANSSHOP_COM = exports.WWW_JANPARA_CO_JP = exports.WWW_HRM_ESHOP_COM = exports.WWW_HONEYS_ONLINESHOP_COM = exports.WWW_HOBBYSTOCK_JP = exports.WWW_HMV_CO_JP = exports.WWW_HMR_JP = exports.WWW_GRAIL_BZ = exports.WWW_GOLDWIN_CO_JP = exports.WWW_GAMERS_CO_JP = exports.WWW_FUJIYA_AVIC_CO_JP = exports.WWW_E_HON_NE_JP = exports.WWW_E_EARPHONE_JP = exports.WWW_E_CAPCOM_COM = exports.WWW_EVASTORE_JP = exports.WWW_ESTNATION_CO_JP = exports.WWW_ESP_SHOE_COM = exports.WWW_ELINEUPMALL_COM = exports.WWW_EC_STORE_NET = exports.WWW_DONGURI_SORA_COM = exports.WWW_DOCLASSE_COM = exports.WWW_DAYTONA_PARK_COM = exports.WWW_CREEMA_JP = exports.WWW_COTTA_JP = void 0;
var SHOPPING_YAHOO_CO_JP = exports.SHOPPING_YAHOO_CO_JP = '10';
var WWW_AMAZON_CO_JP = exports.WWW_AMAZON_CO_JP = '12';
var RAKUTEN_CO_JP = exports.RAKUTEN_CO_JP = '15';
var JP_MERCARI_COM = exports.JP_MERCARI_COM = '18';
var FRIL_JP = exports.FRIL_JP = '21';
var FASHIONWALKER_COM = exports.FASHIONWALKER_COM = '1001';
var USAGI_ONLINE_COM = exports.USAGI_ONLINE_COM = '1002';
var RUNWAY_WEBSTORE_COM = exports.RUNWAY_WEBSTORE_COM = '1003';
var WWW_MAGASEEK_COM = exports.WWW_MAGASEEK_COM = '1004';
var WWW_ANIMATE_ONLINESHOP_JP = exports.WWW_ANIMATE_ONLINESHOP_JP = '1005';
var WWW_MATSUKIYOCOCOKARA_ONLINE_COM = exports.WWW_MATSUKIYOCOCOKARA_ONLINE_COM = '1007';
var WWW_TOKYOKAWAIILIFE_JP = exports.WWW_TOKYOKAWAIILIFE_JP = '1008';
var WWW_EC_STORE_NET = exports.WWW_EC_STORE_NET = '1010';
var WWW_COSME_COM = exports.WWW_COSME_COM = '1012';
var STORE_DISNEY_CO_JP = exports.STORE_DISNEY_CO_JP = '1014';
var WWW_MUJI_COM = exports.WWW_MUJI_COM = '1016';
var WEGO_JP = exports.WEGO_JP = '1017';
var WWW_ELINEUPMALL_COM = exports.WWW_ELINEUPMALL_COM = '1018';
var SHOP_AXESFEMME_COM = exports.SHOP_AXESFEMME_COM = '1020';
var WWW_POKEMONCENTER_ONLINE_COM = exports.WWW_POKEMONCENTER_ONLINE_COM = '1022';
var WWW_HMR_JP = exports.WWW_HMR_JP = '1023';
var SHOP_MU_MO_NET = exports.SHOP_MU_MO_NET = '1027';
var WWW_SUPER_GROUPIES_COM = exports.WWW_SUPER_GROUPIES_COM = '1028';
var YUYU_TEI_JP = exports.YUYU_TEI_JP = '1030';
var WWW_TOYSRUS_CO_JP = exports.WWW_TOYSRUS_CO_JP = '1031';
var WWW_MOVIC_JP = exports.WWW_MOVIC_JP = '1033';
var BOOTH_PM = exports.BOOTH_PM = '1034';
var ONLINE_ANIPLEX_CO_JP = exports.ONLINE_ANIPLEX_CO_JP = '1035';
var SHOP_KIND_CO_JP = exports.SHOP_KIND_CO_JP = '1036';
var ORDER_MANDARAKE_CO_JP = exports.ORDER_MANDARAKE_CO_JP = '1038';
var WWW_URBAN_RESEARCH_JP = exports.WWW_URBAN_RESEARCH_JP = '1040';
var WWW_JELLY_BEANSSHOP_COM = exports.WWW_JELLY_BEANSSHOP_COM = '1041';
var WWW_HMV_CO_JP = exports.WWW_HMV_CO_JP = '1045';
var WWW_CHARA_ANI_COM = exports.WWW_CHARA_ANI_COM = '1046';
var WWW_STELLAWORTH_CO_JP = exports.WWW_STELLAWORTH_CO_JP = '1047';
var BAYCREWS_JP = exports.BAYCREWS_JP = '1048';
var STORE_WORLD_CO_JP = exports.STORE_WORLD_CO_JP = '1049';
var WWW_ABC_MART_NET = exports.WWW_ABC_MART_NET = '1051';
var LOCONDO_JP = exports.LOCONDO_JP = '1054';
var WWW_2NDSTREET_JP = exports.WWW_2NDSTREET_JP = '1055';
var WWW_GAMERS_CO_JP = exports.WWW_GAMERS_CO_JP = '1059';
var SHOP_SANRIO_CO_JP = exports.SHOP_SANRIO_CO_JP = '1060';
var ELLESHOP_JP = exports.ELLESHOP_JP = '1063';
var ECS_TORANOANA_JP = exports.ECS_TORANOANA_JP = '1064';
var WWW_EVASTORE_JP = exports.WWW_EVASTORE_JP = '1065';
var WWW_JANPARA_CO_JP = exports.WWW_JANPARA_CO_JP = '1066';
var WWW_DONGURI_SORA_COM = exports.WWW_DONGURI_SORA_COM = '1067';
var JUMPCS_SHUEISHA_CO_JP = exports.JUMPCS_SHUEISHA_CO_JP = '1069';
var WWW_SOFMAP_COM = exports.WWW_SOFMAP_COM = '1070';
var COSPA_COM = exports.COSPA_COM = '1072';
var WWW_CLOSETCHILDONLINESHOP_COM = exports.WWW_CLOSETCHILDONLINESHOP_COM = '1073';
var I_LUMINE_JP = exports.I_LUMINE_JP = '1076';
var WWW_ASMART_JP = exports.WWW_ASMART_JP = '1079';
var TITIVATE_JP = exports.TITIVATE_JP = '1080';
var STORE_JP_SQUARE_ENIX_COM = exports.STORE_JP_SQUARE_ENIX_COM = '1081';
var WWW_S_DARTS_COM = exports.WWW_S_DARTS_COM = '1082';
var WWW_CA4LA_COM = exports.WWW_CA4LA_COM = '1083';
var SHOP_SHIRTS_CO_JP = exports.SHOP_SHIRTS_CO_JP = '1085';
var WWW_E_HON_NE_JP = exports.WWW_E_HON_NE_JP = '1087';
var WWW_WUNDERWELT_JP = exports.WWW_WUNDERWELT_JP = '1088';
var TOWER_JP = exports.TOWER_JP = '1093';
var WWW_KINOKUNIYA_CO_JP = exports.WWW_KINOKUNIYA_CO_JP = '1096';
var SHOP_VISVIM_TV = exports.SHOP_VISVIM_TV = '1097';
var BROCCOLIONLINE_JP = exports.BROCCOLIONLINE_JP = '1099';
var AILAND_STORE_JP = exports.AILAND_STORE_JP = '1100';
var WWW_ADIDAS_JP = exports.WWW_ADIDAS_JP = '1104';
var WWW_E_EARPHONE_JP = exports.WWW_E_EARPHONE_JP = '1107';
var WWW_PLAZASTYLE_COM = exports.WWW_PLAZASTYLE_COM = '1108';
var PUNYUS_JP = exports.PUNYUS_JP = '1111';
var WWW_TAKASHIMAYA_CO_JP = exports.WWW_TAKASHIMAYA_CO_JP = '1112';
var STORE_UNIVERSAL_MUSIC_CO_JP = exports.STORE_UNIVERSAL_MUSIC_CO_JP = '1115';
var SHOPPING_BOOKOFF_CO_JP = exports.SHOPPING_BOOKOFF_CO_JP = '1117';
var SHOP_TSUTAYA_CO_JP = exports.SHOP_TSUTAYA_CO_JP = '1118';
var WWW_PALCLOSET_JP = exports.WWW_PALCLOSET_JP = '1119';
var HOBBYJAPAN_SHOP_COM = exports.HOBBYJAPAN_SHOP_COM = '1120';
var CROSSET_ONWARD_CO_JP = exports.CROSSET_ONWARD_CO_JP = '1122';
var WWW_WEBIKE_NET = exports.WWW_WEBIKE_NET = '1124';
var WWW_NEOWING_CO_JP = exports.WWW_NEOWING_CO_JP = '1129';
var SHOP_AFTERNOON_TEA_NET = exports.SHOP_AFTERNOON_TEA_NET = '1130';
var WWW_MAPCAMERA_COM = exports.WWW_MAPCAMERA_COM = '1131';
var EBTEN_JP = exports.EBTEN_JP = '1133';
var WWW_MELONBOOKS_CO_JP = exports.WWW_MELONBOOKS_CO_JP = '1138';
var WWW_1999_CO_JP = exports.WWW_1999_CO_JP = '1140';
var WWW_E_CAPCOM_COM = exports.WWW_E_CAPCOM_COM = '1144';
var HANDS_NET = exports.HANDS_NET = '1147';
var EDEPART_SOGO_SEIBU_JP = exports.EDEPART_SOGO_SEIBU_JP = '1149';
var SHOP_AKACHAN_JP = exports.SHOP_AKACHAN_JP = '1150';
var WWW_LOFT_CO_JP = exports.WWW_LOFT_CO_JP = '1151';
var SHOP_ASOBISTORE_JP = exports.SHOP_ASOBISTORE_JP = '1155';
var WWW_HONEYS_ONLINESHOP_COM = exports.WWW_HONEYS_ONLINESHOP_COM = '1156';
var WWW_ESP_SHOE_COM = exports.WWW_ESP_SHOE_COM = '1157';
var WWW_BELLEMAISON_JP = exports.WWW_BELLEMAISON_JP = '1161';
var WWW_CREEMA_JP = exports.WWW_CREEMA_JP = '1164';
var STORE_KADOKAWA_CO_JP = exports.STORE_KADOKAWA_CO_JP = '1165';
var KOMEHYO_JP = exports.KOMEHYO_JP = '1167';
var ROOMYS_WEBSTORE_JP = exports.ROOMYS_WEBSTORE_JP = '1169';
var ALICE_BOOKS_COM = exports.ALICE_BOOKS_COM = '1170';
var CANSHOP_JP = exports.CANSHOP_JP = '1174';
var SHOP_NISHIKAWA1566_COM = exports.SHOP_NISHIKAWA1566_COM = '1175';
var WWW_GRAIL_BZ = exports.WWW_GRAIL_BZ = '1178';
var STORE_PLUSMEMBER_JP = exports.STORE_PLUSMEMBER_JP = '1181';
var WWW_NARUMIYA_ONLINE_JP = exports.WWW_NARUMIYA_ONLINE_JP = '1182';
var WWW_COTTA_JP = exports.WWW_COTTA_JP = '1183';
var SHOP_LASHINBANG_COM = exports.SHOP_LASHINBANG_COM = '1185';
var SHOP_NJPW_CO_JP = exports.SHOP_NJPW_CO_JP = '1191';
var BRUNO_ONLINESHOP_COM = exports.BRUNO_ONLINESHOP_COM = '1196';
var TAMIYASHOP_JP = exports.TAMIYASHOP_JP = '1253';
var SHOP_HOLOLIVEPRO_COM = exports.SHOP_HOLOLIVEPRO_COM = '1306';
var STORE_HYSTERICGLAMOUR_JP = exports.STORE_HYSTERICGLAMOUR_JP = '1359';
var AMNIBUS_COM = exports.AMNIBUS_COM = '1425';
var NETMALL_HARDOFF_CO_JP = exports.NETMALL_HARDOFF_CO_JP = '2320';
var STORE_TOEI_ANIM_CO_JP = exports.STORE_TOEI_ANIM_CO_JP = '2337';
var WWW_DAYTONA_PARK_COM = exports.WWW_DAYTONA_PARK_COM = '2346';
var SUZURI_JP = exports.SUZURI_JP = '2347';
var WWW_TMSSHOP_JP = exports.WWW_TMSSHOP_JP = '2362';
var BUSHIROAD_STORE_COM = exports.BUSHIROAD_STORE_COM = '2360';
var SANRIO_ANIMESTORE_A3_JP = exports.SANRIO_ANIMESTORE_A3_JP = '2366';
var WWW_RAGTAG_JP = exports.WWW_RAGTAG_JP = '2367';
var RINKAN_ONLINE_COM = exports.RINKAN_ONLINE_COM = '2410';
var EEO_TODAY = exports.EEO_TODAY = '2427';
var VOI_0101_CO_JP = exports.VOI_0101_CO_JP = '2435';
var WWW_GOLDWIN_CO_JP = exports.WWW_GOLDWIN_CO_JP = '2431';
var WWW_TREFAC_JP = exports.WWW_TREFAC_JP = '2468';
var WWW_SHIPSLTD_CO_JP = exports.WWW_SHIPSLTD_CO_JP = '2483';
var ESHOP_FUJITV_CO_JP = exports.ESHOP_FUJITV_CO_JP = '2491';
var DISKUNION_NET = exports.DISKUNION_NET = '2473';
var STORE_TOMORROWLAND_CO_JP = exports.STORE_TOMORROWLAND_CO_JP = '2497';
var MINNE_COM = exports.MINNE_COM = '2525';
var MAGI_CAMP = exports.MAGI_CAMP = '2564';
var WWW_KAPITAL_WEBSHOP_JP = exports.WWW_KAPITAL_WEBSHOP_JP = '2565';
var WWW_PONYCANYON_CO_JP = exports.WWW_PONYCANYON_CO_JP = '2603';
var WWW_SONY_JP = exports.WWW_SONY_JP = '2607';
var WWW_MANGAZENKAN_COM = exports.WWW_MANGAZENKAN_COM = '2608';
var WORKMAN_JP = exports.WORKMAN_JP = '2631';
var WWW_COEN_CO_JP = exports.WWW_COEN_CO_JP = '2649';
var WWW_NEUVE_A_NET = exports.WWW_NEUVE_A_NET = '2691';
var CARDSHOP_SERRA_COM = exports.CARDSHOP_SERRA_COM = '2693';
var KIRBYCAFE_POPUP_COM = exports.KIRBYCAFE_POPUP_COM = '2694';
var SHOP_SMTOWN_JP = exports.SHOP_SMTOWN_JP = '2716';
var STUDIOUS_CO_JP = exports.STUDIOUS_CO_JP = '1074';
var WWW_SUPER_RC_CO_JP = exports.WWW_SUPER_RC_CO_JP = '2749';
var STORE_UNITED_ARROWS_CO_JP = exports.STORE_UNITED_ARROWS_CO_JP = '2785';
var RONHERMAN_JP = exports.RONHERMAN_JP = '2799';
var SHOP_SAN_X_CO_JP = exports.SHOP_SAN_X_CO_JP = '2802';
var TOHOANIMATIONSTORE_COM = exports.TOHOANIMATIONSTORE_COM = '2806';
var WWW_FUJIYA_AVIC_CO_JP = exports.WWW_FUJIYA_AVIC_CO_JP = '2844';
var WWW_WAIPER_CO_JP = exports.WWW_WAIPER_CO_JP = '3065';
var AGETE_COM = exports.AGETE_COM = '3080';
var WWW_NETOFF_CO_JP = exports.WWW_NETOFF_CO_JP = '3082';
var CHIIKAWAMARKET_JP = exports.CHIIKAWAMARKET_JP = '3083';
var WWW_HOBBYSTOCK_JP = exports.WWW_HOBBYSTOCK_JP = '3084';
var WWW_DOCLASSE_COM = exports.WWW_DOCLASSE_COM = '3113';
var UNITED_TOKYO_COM = exports.UNITED_TOKYO_COM = '3129';
var MYCOLOR_JP = exports.MYCOLOR_JP = '3136';
var WWW_KONAMISTYLE_JP = exports.WWW_KONAMISTYLE_JP = '3139';
var PUBLIC_TOKYO_COM = exports.PUBLIC_TOKYO_COM = '3148';
var WWW_SOPH_NET = exports.WWW_SOPH_NET = '3186';
var WWW_ESTNATION_CO_JP = exports.WWW_ESTNATION_CO_JP = '3184';
var WWW_HRM_ESHOP_COM = exports.WWW_HRM_ESHOP_COM = '3231';
var WWW_KOSHO_OR_JP = exports.WWW_KOSHO_OR_JP = '3311';
var CHIIKAWAMOGUMOGU_SHOP = exports.CHIIKAWAMOGUMOGU_SHOP = '3434';
var TKJ_JP = exports.TKJ_JP = '3462';
var SHOP_YOSTAR_CO_JP = exports.SHOP_YOSTAR_CO_JP = '3469';
var WWW_NEWERACAP_JP = exports.WWW_NEWERACAP_JP = '3486';
var WWW_ONITSUKATIGER_COM = exports.WWW_ONITSUKATIGER_COM = '3521';

},{}],405:[function(require,module,exports){
'use strict';

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toNumber = toNumber;
exports.toTaxIncluded = toTaxIncluded;
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.number.constructor.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.replace.js");
var _constants = require("../constants");
var _is_price_looped = require("./is_price_looped");
var _sub_message_helper = _interopRequireDefault(require("./sub_message_helper"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * price å‘ã‘ã«æ–‡å­—åˆ—ã‹ã‚‰æ•°å­—ã®ã¿ã‚’å–å¾—ã™ã‚‹.
 * ä¸€éƒ¨ã®æ¼¢æ•°å­—ã‚’ã‚¢ãƒ©ãƒ“ã‚¢æ•°å­—ã¸å¤‰æ›ã—ã€æ•°å­—ãŒå–å¾—ã§ããªã„å ´åˆã¯ '0' ã‚’è¿”ã™.
 * @param {string} object - å–å¾—å¯¾è±¡ã®æ–‡å­—åˆ—
 * @param {boolean} shouldValid - ã‚µã‚¤ãƒˆå´ã®é€šè²¨ç­‰ãŒæ­£å¼ã«æ—¥æœ¬å††ä»¥å¤–ã‚’ã‚µãƒãƒ¼ãƒˆã—ã¦ã„ã‚‹å ´åˆãªã© true ã‚’æŒ‡å®š
 * @return {string} æ–‡å­—åˆ—ã‹ã‚‰å–å¾—ã—ãŸæ•°å­—ã‚’è¿”ã™
 *
 * @example
 * import {toNumber} from 'path/to/libs/convert';
 *
 * const price1 = 'Â¥10,800';
 * toNumber(price1); // => 10800
 *
 * const price2 = 'ä¸€è¬å…­åƒé›¶ä¹åäºŒ';
 * toNumber(price2); // => 16092
 *
 * const price3 = '100.00 $';
 * toNumber(price3, true); // => 100.00
 *
 * const price4 = '100.000 VND';
 * toNumber(price4, true); // => 100000
 *
 * const price5 = '15 000,99 â‚¬';
 * toNumber(price5, true); // => 15000.99
 */
function toNumber(object) {
  var shouldValid = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var numList = {
    'é›¶': 0,
    'ã€‡': 0,
    'ä¸€': 1,
    'äºŒ': 2,
    'ä¸‰': 3,
    'å››': 4,
    'äº”': 5,
    'å…­': 6,
    'ä¸ƒ': 7,
    'å…«': 8,
    'ä¹': 9
  };
  var string = _toConsumableArray(object).map(function (char) {
    return typeof numList[char] !== 'undefined' ? numList[char] : char;
  }).join('');
  var message = new _sub_message_helper.default();

  /**
   * [å¯¾è±¡ã‚µã‚¤ãƒˆã®ä¾¡æ ¼è¡¨ç¤ºãŒæ­£å¼ã«æ—¥æœ¬å††ä»¥å¤–ã‚’ã‚µãƒãƒ¼ãƒˆã—ã¦ã„ã‚‹å ´åˆ] shouldValid=trueã‚’æŒ‡å®š
   * Buyeeã‚«ãƒ¼ãƒˆæŠ•å…¥ã¯å¿…ãšæ—¥æœ¬å††ã®ä¾¡æ ¼ã§æŠ•å…¥ã™ã‚‹å¿…è¦ãŒã‚ã‚‹ç‚ºã€
   * ã‚µã‚¤ãƒˆå´ã®ä¾¡æ ¼è¡¨ç¤ºãŒæ­£å¼ã«æ—¥æœ¬å††ä»¥å¤–ã‚’å¯¾å¿œã—ã¦ã„ã‚‹å ´åˆ(å…¬ç¤ºç›¸å ´ç­‰ã‚’å…ƒã«ä¾¡æ ¼å¤‰æ›ã—ã¦ã„ã‚‹ã‚µã‚¤ãƒˆ)ãªã‚‰ã°ã€
   * æ—¥æœ¬å††ä»¥å¤–ã®è¡¨ç¤ºã®å ´åˆã¯ã€æ—¥æœ¬å††æƒ³å®šã¨ã—ã¦å®Ÿè£…ã•ã‚Œã¦ã‚‹a2b/dejimaã®ã‚«ãƒ¼ãƒˆæŠ•å…¥æ©Ÿèƒ½ãŒæ­£å¸¸ã«å‡¦ç†ã•ã‚Œãªã„ã€‚
   * ãã®å ´åˆã«ã¯ã€ã‚µã‚¤ãƒˆå´ã«é€šè²¨ã®ãƒ‡ãƒªãƒŸã‚¿ã€Œ.ã€ã€Œ'ã€ç­‰ãŒå…¥ã£ã¦ã„ã‚‹ã®ã§ã€ãã®ã‚±ãƒ¼ã‚¹ã‚’æ¤œçŸ¥ã—ã¦ãƒãƒªãƒ‡ãƒ¼ã‚·ãƒ§ãƒ³ã§å¼¾ãã€‚
   * 202404 FIX:
   *   - é€šè²¨åˆ¶å¾¡ã¯å¿…è¦ã«å¿œã˜ã¦ unavailable.js ã«ã‚ˆã£ã¦å‡¦ç†ã•ã‚Œã¾ã™
   *   - é€šè²¨ãŒæ—¥æœ¬å††ã§ãªãã¦ã‚‚è³¼å…¥è¨±å¯ã™ã‚‹å ´åˆã¯ç‚ºæ›¿ãƒ¬ãƒ¼ãƒˆã§æ—¥æœ¬å††ã®ä¾¡æ ¼ã‚’è¨ˆç®—ã™ã‚‹ã€‚ã“ã®å ´åˆremoveDelimiter()é–¢æ•°ã§é€šè²¨ã®ãƒ‡ãƒªãƒŸã‚¿ã‚’æ•´ç†ã—ã¦æ­£ã—ã„ä¾¡æ ¼ã‚’å–å¾—ã™ã‚‹ã€‚
   * [ãã‚Œä»¥å¤–ã®å ´åˆ] shouldValid=false(ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã§false)
   * Googleç¿»è¨³ãªã©ã§é€šè²¨ã®ãƒ‡ãƒªãƒŸã‚¿ãŒã€Œ,ã€ã‹ã‚‰ã€Œ'ã€ã€Œ.ã€ã«å¤‰ã‚ã‚‹ã®ã¿ã®å ´åˆã¯ã€æ•°å€¤ã¯æ—¥æœ¬å††ã®ä¾¡æ ¼ã®ã¾ã¾ãªã®ã§ã€
   * ãƒ‡ãƒªãƒŸã‚¿ã‚’é™¤ãå‡¦ç†ã®ã¿è¡Œã†ã ã‘ã§ã‚ˆã„ã€‚
   * å¤šãã®å ´åˆã€ã“ã¡ã‚‰ã§ã‚ˆã„
   */
  var returnPrice = '0';
  if (!shouldValid) {
    returnPrice = string.replace(/[^0-9]/g, '');
  } else {
    if (isValidNumber(string)) {
      returnPrice = string.replace(/[^0-9]/g, '');
    } else {
      returnPrice = removeDelimiter(string);
    }
  }
  if (message.isSendMessageAvailable() && (0, _is_price_looped.isPriceLooped)(returnPrice)) {
    message.sendMessage('handle_error', {
      'is_price_looped': true
    });
  }
  return returnPrice;
}

/**
 * price å‘ã‘ã« Object ã‹ã‚‰æ•°å­—ã®ã¿ã‚’å–å¾—ã—ã€æ¶ˆè²»ç¨Žã‚’è¿½åŠ ã™ã‚‹.
 * @param {string} price - å–å¾—å¯¾è±¡ã®æ–‡å­—åˆ—
 * @return {string} æ¶ˆè²»ç¨Žã‚’è¿½åŠ ã—ãŸé‡‘é¡ã‚’è¿”ã™
 */
function toTaxIncluded(price) {
  var convertedPrice = Number(toNumber(price));
  var taxAmount = Math.floor(convertedPrice * _constants.SALES_TAX_RATE);
  return String(convertedPrice + taxAmount);
}

/**
 * æœ‰åŠ¹ãªå€¤ã‹ç¢ºèªã™ã‚‹.
 * @param {string} string - ç¢ºèªå¯¾è±¡ã®æ–‡å­—åˆ—
 * @return {boolean} ç¢ºèªçµæžœ true/false ã‚’è¿”ã™
 */
function isValidNumber(string) {
  return /[\.,']/.test(string) === false;
}

/**
 * æ•°å€¤ã®æ–‡å­—åˆ—ã‚’æ•´å½¢ã™ã‚‹.
 * @param {string} string - æ•´å½¢å¯¾è±¡ã®æ–‡å­—åˆ—
 * @return {string} æ•´å½¢å¾Œã®æ–‡å­—åˆ—ã‚’è¿”ã™
 */
function removeDelimiter(string) {
  return string.replace(/,/g, '.') // convert all commas to periods
  .replace(/(\D\.)|(\.\D)|(^\.+)|(\.+$)/g, '') // remove all non-separator periods
  .replace(/[^0-9\.]/g, '') // remove all non-digits and non-periods
  .replace(/\.(?=.*\.)/g, '') // remove all but the last period
  .replace(/\.(?=\d{3}(?!\d))/g, ''); // if the last period is a separator, remove it
}

},{"../constants":383,"./is_price_looped":406,"./sub_message_helper":409,"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.map.js":347,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.string.replace.js":369,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/web.dom-collections.iterator.js":381}],406:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPriceLooped = void 0;
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.number.constructor.js");
/**
 * The function first validates the conditions for length, parity, and value.
 * If these conditions are satisfied, it splits the string into two equal parts
 * and compares them to check if the price is "looped."
 *
 * @param {string} price - The price string to validate and check.
 * @return {boolean} - Returns true if the price is looped, otherwise false.
 */

var isPriceLooped = exports.isPriceLooped = function isPriceLooped(price) {
  var MIN_LOOPED_LEN = 6;
  var MIN_LOOPED_PRICE = 300300;
  var priceLen = price.length;
  var priceNum = Number(price);

  // Early return if any condition is not met:
  // - Length must be at least 6 digits
  // - Length must be even number
  // - Price must be greater than 300300
  if (priceLen < MIN_LOOPED_LEN || priceLen % 2 !== 0 || priceNum < MIN_LOOPED_PRICE) {
    return false;
  }

  // Split string into two equal parts and compare
  var halfLength = priceLen / 2;
  var firstHalf = price.slice(0, halfLength);
  var secondHalf = price.slice(halfLength);
  return firstHalf === secondHalf;
};

},{"core-js/modules/es.array.slice.js":348,"core-js/modules/es.number.constructor.js":351}],407:[function(require,module,exports){
'use strict';

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Messages = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
var _i18next = _interopRequireDefault(require("i18next"));
var _i18n_message_resources = _interopRequireDefault(require("../resources/i18n_message_resources"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Messages ã‚¯ãƒ©ã‚¹
 */
var Messages = exports.Messages = /*#__PURE__*/function () {
  /**
   * create instance
   * @param {string} lang - è¨€èªž.
   *
   */
  function Messages() {
    var lang = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    _classCallCheck(this, Messages);
    /*
        å¤–éƒ¨ãƒ•ã‚¡ã‚¤ãƒ«ã«åãå‡ºã—ãŸå ´åˆi18nextã¯XMLã§ãƒ•ã‚¡ã‚¤ãƒ«ã‚’å–å¾—ã™ã‚‹ã€‚
        ã“ã®ãŸã‚Extensionä¸Šï¼ˆSafariï¼‰ã§ã¯Cross Originåˆ¶ç´„ã«ã²ã£ã‹ã‹ã‚‹ãŸã‚
        å†…éƒ¨ãƒªã‚½ãƒ¼ã‚¹ã¨ã—ã¦ä»–è¨€èªžåŒ–ã‚’è¡Œã†
       dev, en: English
      ja:  æ—¥æœ¬èªž
      chs: ç°¡ä½“å­—
      cht: ç¹ä½“å­—
      ...
    */
    _i18next.default.init({
      resources: _i18n_message_resources.default
    });
    _i18next.default.changeLanguage(lang ? lang : 'en');
  }

  /**
   * ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã‚’å–å¾—ã™ã‚‹.
   * @param {string} key - ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹
   * @return {string} ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹ã€è¨€èªžè¨­å®šãŒä¸€è‡´ã—ãŸãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã‚’è¿”ã™
   *
   * @example
   * import {Message} from 'path/to/libs/message';
   * const message = new Message();
   * message.get(key);
   */
  return _createClass(Messages, [{
    key: "get",
    value: function get(key) {
      return _i18next.default.t(key);
    }
  }]);
}();

},{"../resources/i18n_message_resources":384,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381,"i18next":382}],408:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE = exports.ERR_UNAVAILABLE_READ_DELAY = exports.ERR_UNAVAILABLE_PREORDER_PRODUCTS = exports.ERR_UNAVAILABLE_OVER_STOCK = exports.ERR_UNAVAILABLE = exports.ERR_TEMPORARY_UNAVAILABLE = exports.ERR_SELECTION_QTY = exports.ERR_SELECTION_OPTIONS = exports.ERR_MULTIPLE_ITEMS = exports.ERR_EXCLUDED_ITEM = exports.ERR_DIGITAL_CONTENT = exports.ERR_DELIVERY_UNAVAILABLE = exports.ERR_CURRENCY_UNAVAILABLE = exports.CODE_A2B_NO_STOCK = exports.CODE_A2B_FAIL_REQUEST_PARAMETER_ERROR = exports.AVAILABLE = void 0;
/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: æ­£å¸¸ */
var AVAILABLE = exports.AVAILABLE = '0';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: è³¼å…¥ä¸å¯å•†å“ */
var ERR_UNAVAILABLE = exports.ERR_UNAVAILABLE = '0001';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: è³¼å…¥åˆ¶å¾¡å•†å“(äºˆç´„å•†å“ã‚’ä»–ã®å•†å“ã¨åŒæ™‚æ³¨æ–‡ã§ããªã„æ§˜ã«åˆ¶å¾¡ã™ã‚‹) */
var ERR_UNAVAILABLE_PREORDER_PRODUCTS = exports.ERR_UNAVAILABLE_PREORDER_PRODUCTS = 'ERR_UNAVAILABLE_PREORDER_PRODUCTS';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: è³¼å…¥åˆ¶å¾¡å•†å“(ãƒãƒªã‚¨ãƒ¼ã‚·ãƒ§ãƒ³ã§ä¾¡æ ¼ãŒå¤‰ã‚ã‚‹å•†å“) */
var ERR_EXCLUDED_ITEM = exports.ERR_EXCLUDED_ITEM = '0002';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ã‚ªãƒ—ã‚·ãƒ§ãƒ³é¸æŠž */
var ERR_SELECTION_OPTIONS = exports.ERR_SELECTION_OPTIONS = '0003';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: é€šè²¨é¸æŠž */
var ERR_CURRENCY_UNAVAILABLE = exports.ERR_CURRENCY_UNAVAILABLE = '0004';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ä¸€ãƒšãƒ¼ã‚¸ã«è¤‡æ•°å•†å“ãŒã‚ã‚‹å ´åˆ(ä¾‹ã€ã‚³ãƒ¼ãƒ‡ã‚£ãƒãƒ¼ãƒˆãƒšãƒ¼ã‚¸) */
var ERR_MULTIPLE_ITEMS = exports.ERR_MULTIPLE_ITEMS = '0005';

/** é…é€å…ˆãŒæ—¥æœ¬ä»¥å¤–ã«ãªã£ã¦ã„ã‚‹ */
var ERR_DELIVERY_UNAVAILABLE = exports.ERR_DELIVERY_UNAVAILABLE = '0006';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: è³¼å…¥æ•°é‡é¸æŠž */
var ERR_SELECTION_QTY = exports.ERR_SELECTION_QTY = '0007';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ä¸€æ™‚ã‚µãƒ¼ãƒ“ã‚¹åœæ­¢ */
var ERR_TEMPORARY_UNAVAILABLE = exports.ERR_TEMPORARY_UNAVAILABLE = '9000';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: è³¼å…¥åˆ¶å¾¡å•†å“(é¸æŠžã—ãŸå€‹æ•°ãŒåœ¨åº«è¶…ãˆã®å€‹æ•°ã‚’é¸æŠžã§ããªã„æ§˜ã«åˆ¶å¾¡ã™ã‚‹) */
var ERR_UNAVAILABLE_OVER_STOCK = exports.ERR_UNAVAILABLE_OVER_STOCK = 'ERR_UNAVAILABLE_OVER_STOCK';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: èª­ã¿è¾¼ã¿ä¸­é…å»¶ã«ã‚ˆã£ã¦ãƒ‡ãƒ¼ã‚¿ãŒå–ã‚Œãªã„å ´åˆè³¼å…¥åˆ¶å¾¡ã™ã‚‹ */
var ERR_UNAVAILABLE_READ_DELAY = exports.ERR_UNAVAILABLE_READ_DELAY = 'ERR_UNAVAILABLE_READ_DELAY';

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ç‰¹å®šå•†å“è³¼å…¥ä¸å¯æ™‚ã€URLè³¼å…¥ã«èª˜å°Žã™ã‚‹æ–‡è¨€ */
var UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE = exports.UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE = 'UNAVAILABLE_PRODUCT_URL_PURCHASE_GUIDANCE';

/** APIãƒ¬ã‚¹ãƒãƒ³ã‚¹ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ç‰¹æ®Šãªè²©è·¯(mercariãªã©)ã§APIã«ã‚ˆã‚‹å•†å“å–å¾—ãŒã†ã¾ãã„ã‹ãªã‹ã£ãŸå ´åˆ */
var CODE_A2B_FAIL_REQUEST_PARAMETER_ERROR = exports.CODE_A2B_FAIL_REQUEST_PARAMETER_ERROR = 4402;

/** APIãƒ¬ã‚¹ãƒãƒ³ã‚¹ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: ç‰¹æ®Šãªè²©è·¯(mercariãªã©)ã§APIã«ã‚ˆã‚Šå–å¾—ã—ãŸå•†å“ãŒåœ¨åº«åˆ‡ã‚Œã®å ´åˆ */
var CODE_A2B_NO_STOCK = exports.CODE_A2B_NO_STOCK = 4431;

/** ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹: é›»å­æ›¸ç±ãªã©ã®æµ·å¤–ã‹ã‚‰ã®è³¼å…¥ä¸å¯ãªé›»å­ã‚³ãƒ³ãƒ†ãƒ³ãƒ„å•†å“åˆ¶å¾¡ */
var ERR_DIGITAL_CONTENT = exports.ERR_DIGITAL_CONTENT = 'ERR_DIGITAL_CONTENT';

},{}],409:[function(require,module,exports){
'use strict';

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/es.symbol.to-primitive.js");
require("core-js/modules/es.date.to-primitive.js");
require("core-js/modules/es.number.constructor.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var MessageHelper = exports.default = /*#__PURE__*/function () {
  function MessageHelper() {
    _classCallCheck(this, MessageHelper);
  }

  /**
   * Chromeæ‹¡å¼µæ©Ÿèƒ½ã®runtime APIã‚’ä½¿ç”¨ã—ã¦ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã‚’é€ä¿¡ã—ã¾ã™ã€‚
   * æ³¨æ„: ã“ã®ãƒ¡ã‚½ãƒƒãƒ‰ã¯ChromeãŠã‚ˆã³Firefoxã®æ‹¡å¼µæ©Ÿèƒ½ã§å‹•ä½œã—ã¾ã™ãŒã€ã‚¹ãƒžãƒ›ã‚¢ãƒ—ãƒªã‚„ä»–ã®ç’°å¢ƒã§ã¯ä½¿ç”¨ã§ãã¾ã›ã‚“ã€‚
   * @param {string} command - é€ä¿¡ã™ã‚‹ã‚³ãƒžãƒ³ãƒ‰ã€‚
   * @param {Object} param - ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã«å«ã‚ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã€‚
   * @param {Function} cb - å¿œç­”ã‚’å‡¦ç†ã™ã‚‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°ã€‚
   */
  return _createClass(MessageHelper, [{
    key: "sendMessage",
    value: function sendMessage(command) {
      var param = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
      chrome.runtime.sendMessage({
        command: command,
        param: param
      }, cb);
    }

    /**
     * Chromeæ‹¡å¼µæ©Ÿèƒ½ã®runtime APIãŒåˆ©ç”¨å¯èƒ½ã‹ã©ã†ã‹ã‚’ç¢ºèªã—ã¾ã™ã€‚
     * æ³¨æ„: ã“ã®ãƒ¡ã‚½ãƒƒãƒ‰ã¯ChromeãŠã‚ˆã³Firefoxã®æ‹¡å¼µæ©Ÿèƒ½ã§å‹•ä½œã—ã¾ã™ãŒã€ã‚¹ãƒžãƒ›ã‚¢ãƒ—ãƒªã‚„ä»–ã®ç’°å¢ƒã§ã¯ä½¿ç”¨ã§ãã¾ã›ã‚“ã€‚
     * @returns {boolean} - åˆ©ç”¨å¯èƒ½ãªå ´åˆã¯trueã€ãã‚Œä»¥å¤–ã¯falseã€‚
     */
  }, {
    key: "isSendMessageAvailable",
    value: function isSendMessageAvailable() {
      return typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function';
    }
  }]);
}();

},{"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.date.to-primitive.js":349,"core-js/modules/es.number.constructor.js":351,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/es.symbol.to-primitive.js":377,"core-js/modules/web.dom-collections.iterator.js":381}],410:[function(require,module,exports){
'use strict';

/**
 * é…åˆ—ã®é‡è¤‡ã‚’çœã.
 * @param {array} arr - ä»»æ„ã®é…åˆ—
 * @return {array} é‡è¤‡ã—ãŸå†…å®¹ã‚’çœã„ãŸé…åˆ—ã‚’è¿”ã™
 *
 * @example
 * import {uniq} from 'path/to/libs/uniq';
 * const arr = [1, 2, 3, 4, 1, 2];
 * uniq(arr); // => [1, 2, 3, 4]
 */
require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.to-string.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uniq = uniq;
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.set.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function uniq(arr) {
  return _toConsumableArray(new Set(arr));
}

},{"core-js/modules/es.array.from.js":345,"core-js/modules/es.array.iterator.js":346,"core-js/modules/es.array.slice.js":348,"core-js/modules/es.object.to-string.js":355,"core-js/modules/es.regexp.exec.js":364,"core-js/modules/es.regexp.to-string.js":365,"core-js/modules/es.set.js":367,"core-js/modules/es.string.iterator.js":368,"core-js/modules/es.symbol.description.js":372,"core-js/modules/es.symbol.iterator.js":374,"core-js/modules/es.symbol.js":375,"core-js/modules/web.dom-collections.iterator.js":381}]},{},[162])(162)
});
