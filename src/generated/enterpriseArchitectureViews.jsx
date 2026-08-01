import { jsx } from "react/jsx-runtime";
import { LikeC4Model } from "@likec4/core/model";
import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { LikeC4ModelProvider as LikeC4ModelProvider$1, LikeC4View as LikeC4View$1, ReactLikeC4 as ReactLikeC4$1 } from "likec4/react";
//#region likec4:plugin/xingbuild-enterprise-operating-system/icons.jsx
var Icons = {};
function IconRenderer({ node, ...props }) {
	const IconComponent = Icons[node.icon ?? ""];
	if (!IconComponent) return null;
	return jsx(IconComponent, props);
}
//#endregion
//#region node_modules/likec4/dist/vite-plugin/internal/index.mjs
var listenerQueue = [];
var lqIndex = 0;
var QUEUE_ITEMS_PER_LISTENER = 4;
var nanostoresGlobal = globalThis.nanostoresGlobal ||= { epoch: 0 };
var atom = /* @__NO_SIDE_EFFECTS__ */ (initialValue) => {
	let listeners = [];
	let $atom = {
		get() {
			if (!$atom.lc) $atom.listen(() => {})();
			return $atom.value;
		},
		init: initialValue,
		lc: 0,
		listen(listener) {
			$atom.lc = listeners.push(listener);
			return () => {
				for (let i = lqIndex + QUEUE_ITEMS_PER_LISTENER; i < listenerQueue.length;) if (listenerQueue[i] === listener) listenerQueue.splice(i, QUEUE_ITEMS_PER_LISTENER);
				else i += QUEUE_ITEMS_PER_LISTENER;
				let index = listeners.indexOf(listener);
				if (~index) {
					listeners.splice(index, 1);
					if (!--$atom.lc) $atom.off();
				}
			};
		},
		notify(oldValue, changedKey) {
			nanostoresGlobal.epoch++;
			let runListenerQueue = !listenerQueue.length;
			for (let listener of listeners) listenerQueue.push(listener, $atom.value, oldValue, changedKey);
			if (runListenerQueue) {
				for (lqIndex = 0; lqIndex < listenerQueue.length; lqIndex += QUEUE_ITEMS_PER_LISTENER) listenerQueue[lqIndex](listenerQueue[lqIndex + 1], listenerQueue[lqIndex + 2], listenerQueue[lqIndex + 3]);
				listenerQueue.length = 0;
			}
		},
		off() {},
		set(newValue) {
			let oldValue = $atom.value;
			if (oldValue !== newValue) {
				$atom.value = newValue;
				$atom.notify(oldValue);
			}
		},
		subscribe(listener) {
			let unbind = $atom.listen(listener);
			listener($atom.value);
			return unbind;
		},
		value: initialValue
	};
	return $atom;
};
var MOUNT = 5;
var UNMOUNT = 6;
var REVERT_MUTATION = 10;
var on = (object, listener, eventKey, mutateStore) => {
	object.events = object.events || {};
	if (!object.events[eventKey + REVERT_MUTATION]) object.events[eventKey + REVERT_MUTATION] = mutateStore((eventProps) => {
		object.events[eventKey].reduceRight((event, l) => (l(event), event), {
			shared: {},
			...eventProps
		});
	});
	object.events[eventKey] = object.events[eventKey] || [];
	object.events[eventKey].push(listener);
	return () => {
		let currentListeners = object.events[eventKey];
		let index = currentListeners.indexOf(listener);
		currentListeners.splice(index, 1);
		if (!currentListeners.length) {
			delete object.events[eventKey];
			object.events[eventKey + REVERT_MUTATION]();
			delete object.events[eventKey + REVERT_MUTATION];
		}
	};
};
var STORE_UNMOUNT_DELAY = 1e3;
var onMount = ($store, initialize) => {
	let listener = (payload) => {
		let destroy = initialize(payload);
		if (destroy) $store.events[UNMOUNT].push(destroy);
	};
	return on($store, listener, MOUNT, (runListeners) => {
		let originListen = $store.listen;
		$store.listen = (...args) => {
			if (!$store.lc && !$store.active) {
				$store.active = true;
				runListeners();
			}
			return originListen(...args);
		};
		let originOff = $store.off;
		$store.events[UNMOUNT] = [];
		$store.off = () => {
			originOff();
			setTimeout(() => {
				if ($store.active && !$store.lc) {
					$store.active = false;
					for (let destroy of $store.events[UNMOUNT]) destroy();
					$store.events[UNMOUNT] = [];
				}
			}, STORE_UNMOUNT_DELAY);
		};
		return () => {
			$store.listen = originListen;
			$store.off = originOff;
		};
	});
};
var computedStore = (stores, cb, batched) => {
	if (!Array.isArray(stores)) stores = [stores];
	let previousArgs;
	let currentEpoch;
	let set = () => {
		if (currentEpoch === nanostoresGlobal.epoch) return;
		currentEpoch = nanostoresGlobal.epoch;
		let args = stores.map(($store) => $store.get());
		if (!previousArgs || args.some((arg, i) => arg !== previousArgs[i])) {
			previousArgs = args;
			let value = cb(...args);
			if (value && value.then && value.t) value.then((asyncValue) => {
				if (previousArgs === args) $computed.set(asyncValue);
			});
			else {
				$computed.set(value);
				currentEpoch = nanostoresGlobal.epoch;
			}
		}
	};
	let $computed = /* @__PURE__ */ atom(void 0);
	let get = $computed.get;
	$computed.get = () => {
		set();
		return get();
	};
	let timer;
	let run = batched ? () => {
		clearTimeout(timer);
		timer = setTimeout(set);
	} : set;
	onMount($computed, () => {
		let unbinds = stores.map(($store) => $store.listen(run));
		set();
		return () => {
			for (let unbind of unbinds) unbind();
		};
	});
	return $computed;
};
var computed = /* @__NO_SIDE_EFFECTS__ */ (stores, fn) => computedStore(stores, fn);
function listenKeys($store, keys, listener) {
	let keysSet = new Set(keys).add(void 0);
	return $store.listen((value, oldValue, changed) => {
		if (keysSet.has(changed)) listener(value, oldValue, changed);
	});
}
var emit = (snapshotRef, onChange) => (value) => {
	if (snapshotRef.current === value) return;
	snapshotRef.current = value;
	onChange();
};
function useStore(store, { keys, deps = [store, keys], ssr } = {}) {
	let snapshotRef = useRef();
	snapshotRef.current = store.get();
	let subscribe = useCallback((onChange) => {
		emit(snapshotRef, onChange)(store.value);
		return keys?.length > 0 ? listenKeys(store, keys, emit(snapshotRef, onChange)) : store.listen(emit(snapshotRef, onChange));
	}, deps);
	let get = () => snapshotRef.current;
	let server = get;
	if (ssr && "init" in store) server = ssr === "initial" ? () => store.init : ssr;
	return useSyncExternalStore(subscribe, get, server);
}
Math.random.bind(Math);
var { clearTimeout: clearTimeout$1, setTimeout: setTimeout$1 } = globalThis;
var { getOwnPropertyNames, getOwnPropertySymbols } = Object;
var { hasOwnProperty } = Object.prototype;
/**
* Combine two comparators into a single comparators.
*/
function combineComparators(comparatorA, comparatorB) {
	return function isEqual(a, b, state) {
		return comparatorA(a, b, state) && comparatorB(a, b, state);
	};
}
/**
* Wrap the provided `areItemsEqual` method to manage the circular state, allowing
* for circular references to be safely included in the comparison without creating
* stack overflows.
*/
function createIsCircular(areItemsEqual) {
	return function isCircular(a, b, state) {
		if (!a || !b || typeof a !== "object" || typeof b !== "object") return areItemsEqual(a, b, state);
		const { cache } = state;
		const cachedA = cache.get(a);
		const cachedB = cache.get(b);
		if (cachedA && cachedB) return cachedA === b && cachedB === a;
		cache.set(a, b);
		cache.set(b, a);
		const result = areItemsEqual(a, b, state);
		cache.delete(a);
		cache.delete(b);
		return result;
	};
}
/**
* Get the properties to strictly examine, which include both own properties that are
* not enumerable and symbol properties.
*/
function getStrictProperties(object) {
	const symbols = getOwnPropertySymbols(object);
	return symbols.length ? getOwnPropertyNames(object).concat(symbols) : getOwnPropertyNames(object);
}
/**
* Whether the object contains the property passed as an own property.
*/
var hasOwn = Object.hasOwn || ((object, property) => hasOwnProperty.call(object, property));
var PREACT_VNODE = "__v";
var PREACT_OWNER = "__o";
var REACT_OWNER = "_owner";
var { getOwnPropertyDescriptor, keys } = Object;
/**
* Whether the values passed are equal based on a [SameValue](https://262.ecma-international.org/7.0/#sec-samevalue) basis.
* Simplified, this maps to if the two values are referentially equal to one another (`a === b`) or both are `NaN`.
*
* @note
* When available in the environment, this is just a re-export of the global
* [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) method.
*/
var sameValueEqual = Object.is || function sameValueEqual(a, b) {
	return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
};
/**
* Whether the values passed are equal based on a
* [Strict Equality Comparison](https://262.ecma-international.org/7.0/#sec-strict-equality-comparison) basis.
* Simplified, this maps to if the two values are referentially equal to one another (`a === b`).
*
* @note
* This is mainly available as a convenience function, such as being a default when a function to determine equality between
* two objects is used.
*/
function strictEqual(a, b) {
	return a === b;
}
/**
* Whether the array buffers are equal in value.
*/
function areArrayBuffersEqual(a, b) {
	return a.byteLength === b.byteLength && areTypedArraysEqual(new Uint8Array(a), new Uint8Array(b));
}
/**
* Whether the arrays are equal in value.
*/
function areArraysEqual(a, b, state) {
	let index = a.length;
	if (b.length !== index) return false;
	while (index-- > 0) if (!state.equals(a[index], b[index], index, index, a, b, state)) return false;
	return true;
}
/**
* Whether the dataviews are equal in value.
*/
function areDataViewsEqual(a, b) {
	return a.byteLength === b.byteLength && areTypedArraysEqual(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
}
/**
* Whether the dates passed are equal in value.
*/
function areDatesEqual(a, b) {
	return sameValueEqual(a.getTime(), b.getTime());
}
/**
* Whether the errors passed are equal in value.
*/
function areErrorsEqual(a, b) {
	return a.name === b.name && a.message === b.message && a.cause === b.cause && a.stack === b.stack;
}
/**
* Whether the `Map`s are equal in value.
*/
function areMapsEqual(a, b, state) {
	const size = a.size;
	if (size !== b.size) return false;
	if (!size) return true;
	const matchedIndices = new Uint8Array(size);
	const aIterable = a.entries();
	let aResult;
	let bResult;
	let index = 0;
	while (aResult = aIterable.next()) {
		if (aResult.done) break;
		const bIterable = b.entries();
		let hasMatch = 0;
		let matchIndex = 0;
		while (bResult = bIterable.next()) {
			if (bResult.done) break;
			if (matchedIndices[matchIndex]) {
				matchIndex++;
				continue;
			}
			const aEntry = aResult.value;
			const bEntry = bResult.value;
			if (state.equals(aEntry[0], bEntry[0], index, matchIndex, a, b, state) && state.equals(aEntry[1], bEntry[1], aEntry[0], bEntry[0], a, b, state)) {
				hasMatch = matchedIndices[matchIndex] = 1;
				break;
			}
			matchIndex++;
		}
		if (!hasMatch) return false;
		index++;
	}
	return true;
}
/**
* Whether the objects are equal in value.
*/
function areObjectsEqual(a, b, state) {
	const properties = keys(a);
	let index = properties.length;
	if (keys(b).length !== index) return false;
	while (index-- > 0) if (!isPropertyEqual(a, b, state, properties[index])) return false;
	return true;
}
/**
* Whether the objects are equal in value with strict property checking.
*/
function areObjectsEqualStrict(a, b, state) {
	const properties = getStrictProperties(a);
	let index = properties.length;
	if (getStrictProperties(b).length !== index) return false;
	let property;
	let descriptorA;
	let descriptorB;
	while (index-- > 0) {
		property = properties[index];
		if (!isPropertyEqual(a, b, state, property)) return false;
		descriptorA = getOwnPropertyDescriptor(a, property);
		descriptorB = getOwnPropertyDescriptor(b, property);
		if ((descriptorA || descriptorB) && (!descriptorA || !descriptorB || descriptorA.configurable !== descriptorB.configurable || descriptorA.enumerable !== descriptorB.enumerable || descriptorA.writable !== descriptorB.writable)) return false;
	}
	return true;
}
/**
* Whether the primitive wrappers passed are equal in value.
*/
function arePrimitiveWrappersEqual(a, b) {
	return sameValueEqual(a.valueOf(), b.valueOf());
}
/**
* Whether the regexps passed are equal in value.
*/
function areRegExpsEqual(a, b) {
	return a.source === b.source && a.flags === b.flags;
}
/**
* Whether the `Set`s are equal in value.
*/
function areSetsEqual(a, b, state) {
	const size = a.size;
	if (size !== b.size) return false;
	if (!size) return true;
	const matchedIndices = new Uint8Array(size);
	const aIterable = a.values();
	let aResult;
	let bResult;
	while (aResult = aIterable.next()) {
		if (aResult.done) break;
		const bIterable = b.values();
		let hasMatch = 0;
		let matchIndex = 0;
		while (bResult = bIterable.next()) {
			if (bResult.done) break;
			if (!matchedIndices[matchIndex] && state.equals(aResult.value, bResult.value, aResult.value, bResult.value, a, b, state)) {
				hasMatch = matchedIndices[matchIndex] = 1;
				break;
			}
			matchIndex++;
		}
		if (!hasMatch) return false;
	}
	return true;
}
/**
* Whether the TypedArray instances are equal in value.
*/
function areTypedArraysEqual(a, b) {
	let index = a.length;
	if (b.length !== index || a.byteOffset !== b.byteOffset) return false;
	while (index-- > 0) if (a[index] !== b[index]) return false;
	return true;
}
/**
* Whether the URL instances are equal in value.
*/
function areUrlsEqual(a, b) {
	return a.hostname === b.hostname && a.pathname === b.pathname && a.protocol === b.protocol && a.port === b.port && a.hash === b.hash && a.username === b.username && a.password === b.password;
}
function isPropertyEqual(a, b, state, property) {
	if ((property === REACT_OWNER || property === PREACT_OWNER || property === PREACT_VNODE) && (a.$$typeof || b.$$typeof)) return true;
	return hasOwn(b, property) && state.equals(a[property], b[property], property, property, a, b, state);
}
var toString = Object.prototype.toString;
/**
* Create a comparator method based on the type-specific equality comparators passed.
*/
function createEqualityComparator(config) {
	const supportedComparatorMap = createSupportedComparatorMap(config);
	const { areArraysEqual, areDatesEqual, areFunctionsEqual, areMapsEqual, areNumbersEqual, areObjectsEqual, areRegExpsEqual, areSetsEqual, getUnsupportedCustomComparator } = config;
	/**
	* compare the value of the two objects and return true if they are equivalent in values
	*/
	return function comparator(a, b, state) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		const type = typeof a;
		if (type !== typeof b) return false;
		if (type !== "object") {
			if (type === "number" || type === "bigint") return areNumbersEqual(a, b, state);
			if (type === "function") return areFunctionsEqual(a, b, state);
			return false;
		}
		const constructor = a.constructor;
		if (constructor !== b.constructor) return false;
		if (constructor === Object) return areObjectsEqual(a, b, state);
		if (constructor === Array) return areArraysEqual(a, b, state);
		if (constructor === Date) return areDatesEqual(a, b, state);
		if (constructor === RegExp) return areRegExpsEqual(a, b, state);
		if (constructor === Map) return areMapsEqual(a, b, state);
		if (constructor === Set) return areSetsEqual(a, b, state);
		if (constructor === Promise) return false;
		if (Array.isArray(a)) return areArraysEqual(a, b, state);
		const tag = toString.call(a);
		const supportedComparator = supportedComparatorMap[tag];
		if (supportedComparator) return supportedComparator(a, b, state);
		const unsupportedCustomComparator = getUnsupportedCustomComparator && getUnsupportedCustomComparator(a, b, state, tag);
		if (unsupportedCustomComparator) return unsupportedCustomComparator(a, b, state);
		return false;
	};
}
/**
* Create the configuration object used for building comparators.
*/
function createEqualityComparatorConfig({ circular, createCustomConfig, strict }) {
	let config = {
		areArrayBuffersEqual,
		areArraysEqual: strict ? areObjectsEqualStrict : areArraysEqual,
		areDataViewsEqual,
		areDatesEqual,
		areErrorsEqual,
		areFunctionsEqual: strictEqual,
		areMapsEqual: strict ? combineComparators(areMapsEqual, areObjectsEqualStrict) : areMapsEqual,
		areNumbersEqual: sameValueEqual,
		areObjectsEqual: strict ? areObjectsEqualStrict : areObjectsEqual,
		arePrimitiveWrappersEqual,
		areRegExpsEqual,
		areSetsEqual: strict ? combineComparators(areSetsEqual, areObjectsEqualStrict) : areSetsEqual,
		areTypedArraysEqual: strict ? combineComparators(areTypedArraysEqual, areObjectsEqualStrict) : areTypedArraysEqual,
		areUrlsEqual,
		getUnsupportedCustomComparator: void 0
	};
	if (createCustomConfig) config = Object.assign({}, config, createCustomConfig(config));
	if (circular) {
		const areArraysEqual = createIsCircular(config.areArraysEqual);
		const areMapsEqual = createIsCircular(config.areMapsEqual);
		const areObjectsEqual = createIsCircular(config.areObjectsEqual);
		const areSetsEqual = createIsCircular(config.areSetsEqual);
		config = Object.assign({}, config, {
			areArraysEqual,
			areMapsEqual,
			areObjectsEqual,
			areSetsEqual
		});
	}
	return config;
}
/**
* Default equality comparator pass-through, used as the standard `isEqual` creator for
* use inside the built comparator.
*/
function createInternalEqualityComparator(compare) {
	return function(a, b, _indexOrKeyA, _indexOrKeyB, _parentA, _parentB, state) {
		return compare(a, b, state);
	};
}
/**
* Create the `isEqual` function used by the consuming application.
*/
function createIsEqual({ circular, comparator, createState, equals, strict }) {
	if (createState) return function isEqual(a, b) {
		const { cache = circular ? /* @__PURE__ */ new WeakMap() : void 0, meta } = createState();
		return comparator(a, b, {
			cache,
			equals,
			meta,
			strict
		});
	};
	if (circular) return function isEqual(a, b) {
		return comparator(a, b, {
			cache: /* @__PURE__ */ new WeakMap(),
			equals,
			meta: void 0,
			strict
		});
	};
	const state = {
		cache: void 0,
		equals,
		meta: void 0,
		strict
	};
	return function isEqual(a, b) {
		return comparator(a, b, state);
	};
}
/**
* Create a map of `toString()` values to their respective handlers for `tag`-based lookups.
*/
function createSupportedComparatorMap({ areArrayBuffersEqual, areArraysEqual, areDataViewsEqual, areDatesEqual, areErrorsEqual, areFunctionsEqual, areMapsEqual, areNumbersEqual, areObjectsEqual, arePrimitiveWrappersEqual, areRegExpsEqual, areSetsEqual, areTypedArraysEqual, areUrlsEqual }) {
	return {
		"[object Arguments]": areObjectsEqual,
		"[object Array]": areArraysEqual,
		"[object ArrayBuffer]": areArrayBuffersEqual,
		"[object AsyncGeneratorFunction]": areFunctionsEqual,
		"[object BigInt]": areNumbersEqual,
		"[object BigInt64Array]": areTypedArraysEqual,
		"[object BigUint64Array]": areTypedArraysEqual,
		"[object Boolean]": arePrimitiveWrappersEqual,
		"[object DataView]": areDataViewsEqual,
		"[object Date]": areDatesEqual,
		"[object Error]": areErrorsEqual,
		"[object Float16Array]": areTypedArraysEqual,
		"[object Float32Array]": areTypedArraysEqual,
		"[object Float64Array]": areTypedArraysEqual,
		"[object Function]": areFunctionsEqual,
		"[object GeneratorFunction]": areFunctionsEqual,
		"[object Int8Array]": areTypedArraysEqual,
		"[object Int16Array]": areTypedArraysEqual,
		"[object Int32Array]": areTypedArraysEqual,
		"[object Map]": areMapsEqual,
		"[object Number]": arePrimitiveWrappersEqual,
		"[object Object]": (a, b, state) => typeof a.then !== "function" && typeof b.then !== "function" && areObjectsEqual(a, b, state),
		"[object RegExp]": areRegExpsEqual,
		"[object Set]": areSetsEqual,
		"[object String]": arePrimitiveWrappersEqual,
		"[object URL]": areUrlsEqual,
		"[object Uint8Array]": areTypedArraysEqual,
		"[object Uint8ClampedArray]": areTypedArraysEqual,
		"[object Uint16Array]": areTypedArraysEqual,
		"[object Uint32Array]": areTypedArraysEqual
	};
}
/**
* Whether the items passed are deeply-equal in value.
*/
var deepEqual = createCustomEqual();
createCustomEqual({ strict: true });
createCustomEqual({ circular: true });
createCustomEqual({
	circular: true,
	strict: true
});
/**
* Whether the items passed are shallowly-equal in value.
*/
var shallowEqual = createCustomEqual({ createInternalComparator: () => sameValueEqual });
createCustomEqual({
	strict: true,
	createInternalComparator: () => sameValueEqual
});
createCustomEqual({
	circular: true,
	createInternalComparator: () => sameValueEqual
});
createCustomEqual({
	circular: true,
	createInternalComparator: () => sameValueEqual,
	strict: true
});
/**
* Create a custom equality comparison method.
*
* This can be done to create very targeted comparisons in extreme hot-path scenarios
* where the standard methods are not performant enough, but can also be used to provide
* support for legacy environments that do not support expected features like
* `RegExp.prototype.flags` out of the box.
*/
function createCustomEqual(options = {}) {
	const { circular = false, createInternalComparator: createCustomInternalComparator, createState, strict = false } = options;
	const comparator = createEqualityComparator(createEqualityComparatorConfig(options));
	return createIsEqual({
		circular,
		comparator,
		createState,
		equals: createCustomInternalComparator ? createCustomInternalComparator(comparator) : createInternalEqualityComparator(comparator),
		strict
	});
}
function e(e, t, n) {
	let r = (n) => e(n, ...t);
	return n === void 0 ? r : Object.assign(r, {
		lazy: n,
		lazyArgs: t
	});
}
function t$1(t, n, r) {
	let i = t.length - n.length;
	if (i === 0) return t(...n);
	if (i === 1) return e(t, n, r);
	throw Error(`Wrong number of arguments`);
}
function t(...t) {
	return t$1(n, t);
}
function n(e, t) {
	let n = {};
	for (let [r, i] of Object.entries(e)) n[r] = t(i, r, e);
	return n;
}
function createHooksForModel($atom) {
	const $likec4model = /* @__PURE__ */ computed($atom, (data) => LikeC4Model.create(data));
	function updateModel(data) {
		const current = $atom.get();
		const next = {
			...data,
			views: t(data.views, (next) => {
				const currentView = current.views[next.id];
				return deepEqual(currentView, next) ? currentView : next;
			})
		};
		if (shallowEqual(next.views, current.views) && deepEqual(next, current)) return;
		$atom.set(next);
	}
	const $likec4views = /* @__PURE__ */ computed($likec4model, (model) => [...model.views()].map((v) => v.$layouted));
	function useLikeC4Model() {
		return useStore($likec4model);
	}
	function useLikeC4Views() {
		return useStore($likec4views);
	}
	function useLikeC4View(viewId) {
		return useStore(useMemo(() => /* @__PURE__ */ computed($likec4model, (model) => model.findView(viewId)?.$layouted ?? null), [viewId]));
	}
	return {
		updateModel,
		$likec4model,
		useLikeC4Model,
		useLikeC4Views,
		useLikeC4View
	};
}
var { updateModel, $likec4model, useLikeC4Model, useLikeC4Views, useLikeC4View } = createHooksForModel(/* @__PURE__ */ atom({
	_stage: "layouted",
	projectId: "xingbuild-enterprise-operating-system",
	project: {
		id: "xingbuild-enterprise-operating-system",
		title: "xingbuild-enterprise-operating-system",
		styles: {
			defaults: {
				color: "primary",
				border: "solid",
				size: "xs",
				relationship: {
					color: "primary",
					line: "solid",
					arrow: "normal"
				}
			},
			theme: {
				colors: {
					primary: {
						elements: {
							fill: "#f1e7d8",
							stroke: "#6f513c",
							hiContrast: "#2c211b",
							loContrast: "#6f6257"
						},
						relationships: {
							line: "#7c624e",
							label: "#4c392b",
							labelBg: "#f7f0e6"
						}
					},
					secondary: {
						elements: {
							fill: "#e9dfd2",
							stroke: "#856c57",
							hiContrast: "#382a20",
							loContrast: "#74675a"
						},
						relationships: {
							line: "#93755d",
							label: "#584434",
							labelBg: "#faf4eb"
						}
					}
				},
				sizes: { xs: {
					width: 180,
					height: 80
				} }
			}
		},
		inferTechnologyFromIcon: false
	},
	specification: {
		tags: {},
		elements: {
			landscape: { style: {} },
			business: { style: {} },
			digital: { style: {} },
			product: { style: {} }
		},
		relationships: {},
		deployments: {},
		metadataKeys: ["id"],
		customColors: {}
	},
	elements: {
		"external-context": {
			style: {},
			title: "外部环境、利益相关者与需求",
			kind: "landscape",
			id: "external-context"
		},
		"operation-design": {
			style: {},
			title: "经营与架构设计",
			kind: "landscape",
			id: "operation-design"
		},
		"digital-implementation": {
			style: {},
			title: "数字化实现",
			kind: "landscape",
			id: "digital-implementation"
		},
		"enterprise-reality": {
			style: {},
			title: "企业现实",
			kind: "landscape",
			id: "enterprise-reality"
		},
		"enterprise-operation": {
			style: {},
			title: "企业运作",
			kind: "landscape",
			id: "enterprise-operation"
		},
		"operating-facts-results": {
			style: {},
			title: "事实与经营结果",
			kind: "landscape",
			id: "operating-facts-results"
		},
		"operating-decision": {
			style: {},
			title: "经营分析与决策",
			kind: "landscape",
			id: "operating-decision"
		},
		"business-trigger": {
			style: {},
			title: "利益相关者需求 / 业务事件",
			kind: "business",
			id: "business-trigger"
		},
		"value-stream": {
			style: {},
			title: "价值流",
			kind: "business",
			id: "value-stream"
		},
		"capability-resource": {
			style: {},
			title: "企业能力与资源",
			kind: "business",
			id: "capability-resource"
		},
		responsibility: {
			style: {},
			title: "企业职能归类 / 组织承担",
			kind: "business",
			id: "responsibility"
		},
		"business-process": {
			style: {},
			title: "业务流程",
			kind: "business",
			id: "business-process"
		},
		"business-rule": {
			style: {},
			title: "业务规则",
			kind: "business",
			id: "business-rule"
		},
		"business-object-state": {
			style: {},
			title: "业务对象的状态与关系",
			kind: "business",
			id: "business-object-state"
		},
		"business-facts-results": {
			style: {},
			title: "事实与结果",
			kind: "business",
			id: "business-facts-results"
		},
		"business-metric": {
			style: {},
			title: "指标",
			kind: "business",
			id: "business-metric"
		},
		"target-gap": {
			style: {},
			title: "价值流结果与经营目标差距",
			kind: "business",
			id: "target-gap"
		},
		"enterprise-business-architecture": {
			style: {},
			title: "企业业务架构",
			kind: "digital",
			id: "enterprise-business-architecture"
		},
		"b2b-product-architecture": {
			style: {},
			title: "B 端产品架构",
			kind: "product",
			id: "b2b-product-architecture"
		},
		"data-architecture": {
			style: {},
			title: "数据架构",
			kind: "digital",
			id: "data-architecture"
		},
		"technical-architecture": {
			style: {},
			title: "技术架构",
			kind: "digital",
			id: "technical-architecture"
		},
		engineering: {
			style: {},
			title: "工程实现",
			kind: "digital",
			id: "engineering"
		},
		"enterprise-digital-system": {
			style: {},
			title: "企业数字化系统",
			kind: "digital",
			id: "enterprise-digital-system"
		},
		"enterprise-reality-operation": {
			style: {},
			title: "企业现实中的企业运作",
			kind: "digital",
			id: "enterprise-reality-operation"
		},
		"digital-facts-results": {
			style: {},
			title: "事实与经营结果",
			kind: "digital",
			id: "digital-facts-results"
		},
		"digital-decision": {
			style: {},
			title: "经营分析与决策",
			kind: "digital",
			id: "digital-decision"
		}
	},
	relations: {
		wmduy9: {
			metadata: { id: "op-external-design" },
			title: "影响",
			source: { model: "external-context" },
			target: { model: "operation-design" },
			id: "wmduy9"
		},
		"1fqm14s": {
			metadata: { id: "op-external-reality" },
			title: "构成现实条件",
			source: { model: "external-context" },
			target: { model: "enterprise-reality" },
			id: "1fqm14s"
		},
		pq9efq: {
			metadata: { id: "op-design-reality" },
			title: "建设和调整",
			source: { model: "operation-design" },
			target: { model: "enterprise-reality" },
			id: "pq9efq"
		},
		"1j2zr1w": {
			metadata: { id: "op-design-digital" },
			title: "提出数字化需求",
			source: { model: "operation-design" },
			target: { model: "digital-implementation" },
			id: "1j2zr1w"
		},
		"1raid68": {
			metadata: { id: "op-digital-reality" },
			title: "形成系统并进入",
			source: { model: "digital-implementation" },
			target: { model: "enterprise-reality" },
			id: "1raid68"
		},
		"1tkza61": {
			metadata: { id: "op-reality-operation" },
			title: "进行",
			source: { model: "enterprise-reality" },
			target: { model: "enterprise-operation" },
			id: "1tkza61"
		},
		c54b4o: {
			metadata: { id: "op-operation-facts" },
			title: "产生",
			source: { model: "enterprise-operation" },
			target: { model: "operating-facts-results" },
			id: "c54b4o"
		},
		"7bjino": {
			metadata: { id: "op-facts-decision" },
			title: "支持",
			source: { model: "operating-facts-results" },
			target: { model: "operating-decision" },
			id: "7bjino"
		},
		"1dtowjh": {
			metadata: { id: "op-decision-design" },
			title: "调整选择与设计",
			source: { model: "operating-decision" },
			target: { model: "operation-design" },
			id: "1dtowjh"
		},
		"12scpff": {
			metadata: { id: "op-decision-operation" },
			title: "影响后续运作",
			source: { model: "operating-decision" },
			target: { model: "enterprise-operation" },
			id: "12scpff"
		},
		"4859i4": {
			metadata: { id: "bd-trigger-value" },
			title: "触发",
			source: { model: "business-trigger" },
			target: { model: "value-stream" },
			id: "4859i4"
		},
		"16dq989": {
			metadata: { id: "bd-value-capability" },
			title: "需要",
			source: { model: "value-stream" },
			target: { model: "capability-resource" },
			id: "16dq989"
		},
		"1vf6zqk": {
			metadata: { id: "bd-capability-process" },
			title: "通过流程落实",
			source: { model: "capability-resource" },
			target: { model: "business-process" },
			id: "1vf6zqk"
		},
		"15uuaam": {
			metadata: { id: "bd-process-object" },
			title: "改变",
			source: { model: "business-process" },
			target: { model: "business-object-state" },
			id: "15uuaam"
		},
		"1b1o3qn": {
			metadata: { id: "bd-object-facts" },
			title: "产生",
			source: { model: "business-object-state" },
			target: { model: "business-facts-results" },
			id: "1b1o3qn"
		},
		doeuni: {
			metadata: { id: "bd-responsibility-capability" },
			title: "归类并承担",
			source: { model: "responsibility" },
			target: { model: "capability-resource" },
			id: "doeuni"
		},
		"1a1zzn7": {
			metadata: { id: "bd-rule-process" },
			title: "约束行为与判断",
			source: { model: "business-rule" },
			target: { model: "business-process" },
			id: "1a1zzn7"
		},
		"1w6xvjq": {
			metadata: { id: "bd-rule-object" },
			title: "约束关系与状态变化",
			source: { model: "business-rule" },
			target: { model: "business-object-state" },
			id: "1w6xvjq"
		},
		"10mjo5c": {
			metadata: { id: "bd-facts-metric" },
			title: "提供计算依据",
			source: { model: "business-facts-results" },
			target: { model: "business-metric" },
			id: "10mjo5c"
		},
		zwyt5g: {
			metadata: { id: "bd-metric-gap" },
			title: "衡量并比较",
			source: { model: "business-metric" },
			target: { model: "target-gap" },
			id: "zwyt5g"
		},
		"19z7dov": {
			metadata: { id: "bd-gap-capability" },
			title: "调整能力与资源",
			source: { model: "target-gap" },
			target: { model: "capability-resource" },
			id: "19z7dov"
		},
		"1wib195": {
			metadata: { id: "bd-gap-process" },
			title: "调整流程",
			source: { model: "target-gap" },
			target: { model: "business-process" },
			id: "1wib195"
		},
		"1y0r6oj": {
			metadata: { id: "bd-gap-rule" },
			title: "调整规则",
			source: { model: "target-gap" },
			target: { model: "business-rule" },
			id: "1y0r6oj"
		},
		"1pkzn3r": {
			metadata: { id: "di-business-product" },
			title: "提出数字化需求",
			source: { model: "enterprise-business-architecture" },
			target: { model: "b2b-product-architecture" },
			id: "1pkzn3r"
		},
		"1ejqd7f": {
			metadata: { id: "di-business-data" },
			title: "提出数字化需求",
			source: { model: "enterprise-business-architecture" },
			target: { model: "data-architecture" },
			id: "1ejqd7f"
		},
		"2mf6a8": {
			metadata: { id: "di-product-data" },
			title: "协同设计",
			source: { model: "b2b-product-architecture" },
			target: { model: "data-architecture" },
			id: "2mf6a8"
		},
		"1n55ss3": {
			metadata: { id: "di-data-product" },
			title: "相互约束",
			source: { model: "data-architecture" },
			target: { model: "b2b-product-architecture" },
			id: "1n55ss3"
		},
		rl47w1: {
			metadata: { id: "di-product-tech" },
			title: "共同驱动",
			source: { model: "b2b-product-architecture" },
			target: { model: "technical-architecture" },
			id: "rl47w1"
		},
		r0bieq: {
			metadata: { id: "di-data-tech" },
			title: "共同驱动",
			source: { model: "data-architecture" },
			target: { model: "technical-architecture" },
			id: "r0bieq"
		},
		"1l8cybm": {
			metadata: { id: "di-tech-engineering" },
			title: "指导实现",
			source: { model: "technical-architecture" },
			target: { model: "engineering" },
			id: "1l8cybm"
		},
		"1vfldj4": {
			metadata: { id: "di-engineering-system" },
			title: "形成",
			source: { model: "engineering" },
			target: { model: "enterprise-digital-system" },
			id: "1vfldj4"
		},
		"153q752": {
			metadata: { id: "di-system-reality" },
			title: "进入并支持或执行",
			source: { model: "enterprise-digital-system" },
			target: { model: "enterprise-reality-operation" },
			id: "153q752"
		},
		tfn940: {
			metadata: { id: "di-reality-facts" },
			title: "产生",
			source: { model: "enterprise-reality-operation" },
			target: { model: "digital-facts-results" },
			id: "tfn940"
		},
		xez5sl: {
			metadata: { id: "di-system-facts" },
			title: "记录",
			source: { model: "enterprise-digital-system" },
			target: { model: "digital-facts-results" },
			id: "xez5sl"
		},
		pc4lci: {
			metadata: { id: "di-facts-decision" },
			title: "支持",
			source: { model: "digital-facts-results" },
			target: { model: "digital-decision" },
			id: "pc4lci"
		},
		"1ud9c0m": {
			metadata: { id: "di-decision-business" },
			title: "调整业务架构",
			source: { model: "digital-decision" },
			target: { model: "enterprise-business-architecture" },
			id: "1ud9c0m"
		}
	},
	globals: {
		predicates: {},
		dynamicPredicates: {},
		styles: {}
	},
	views: {
		index: {
			_stage: "layouted",
			_type: "element",
			id: "index",
			title: "Landscape view",
			description: null,
			autoLayout: { direction: "TB" },
			hash: "x49Hy8UFg2ymcgS06_x3YZXrsvAp_wK10xDqKsKyin8",
			bounds: {
				x: 0,
				y: 0,
				width: 2941,
				height: 1863
			},
			nodes: [
				{
					id: "external-context",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["1jh2lnz", "61aa3n"],
					title: "外部环境、利益相关者与需求",
					modelRef: "external-context",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 620,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 12,
						y: 30,
						width: 156,
						height: 18
					}
				},
				{
					id: "operating-decision",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["167iqvi"],
					outEdges: ["1ansidc", "1lnrev"],
					title: "经营分析与决策",
					modelRef: "operating-decision",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 166,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "business-trigger",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["1kvsztv"],
					title: "利益相关者需求 / 业务事件",
					modelRef: "business-trigger",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1722,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 18,
						y: 30,
						width: 144,
						height: 18
					}
				},
				{
					id: "responsibility",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["yvscpd"],
					title: "企业职能归类 / 组织承担",
					modelRef: "responsibility",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 2032,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 24,
						y: 30,
						width: 132,
						height: 18
					}
				},
				{
					id: "target-gap",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["stsohb"],
					outEdges: [
						"1ci4q3b",
						"whslxc",
						"ej7j5x"
					],
					title: "价值流结果与经营目标差距",
					modelRef: "target-gap",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1465,
					y: 1560,
					width: 180,
					height: 80,
					labelBBox: {
						x: 18,
						y: 30,
						width: 144,
						height: 18
					}
				},
				{
					id: "digital-decision",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1ts4q4u"],
					outEdges: ["pgm2z"],
					title: "经营分析与决策",
					modelRef: "digital-decision",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2724,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "operation-design",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1jh2lnz", "1ansidc"],
					outEdges: ["adenxh", "1hu81ae"],
					title: "经营与架构设计",
					modelRef: "operation-design",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 318,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "value-stream",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1kvsztv"],
					outEdges: ["aeh7rb"],
					title: "价值流",
					modelRef: "value-stream",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1722,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 71,
						y: 30,
						width: 39,
						height: 18
					}
				},
				{
					id: "business-rule",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["ej7j5x"],
					outEdges: ["10g66gf", "1jv1ru3"],
					title: "业务规则",
					modelRef: "business-rule",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 994,
					y: 1783,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "enterprise-business-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["pgm2z"],
					outEdges: ["pwdkkg", "1qczhac"],
					title: "企业业务架构",
					modelRef: "enterprise-business-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2566,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 53,
						y: 30,
						width: 74,
						height: 18
					}
				},
				{
					id: "digital-implementation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["adenxh"],
					outEdges: ["hh9ocp"],
					title: "数字化实现",
					modelRef: "digital-implementation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 59,
						y: 29,
						width: 62,
						height: 18
					}
				},
				{
					id: "capability-resource",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"aeh7rb",
						"yvscpd",
						"1ci4q3b"
					],
					outEdges: ["1v05s59"],
					title: "企业能力与资源",
					modelRef: "capability-resource",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1763,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 29,
						width: 86,
						height: 18
					}
				},
				{
					id: "b2b-product-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["pwdkkg", "ipbhm6"],
					outEdges: ["1ufcqlq", "2bj8ul"],
					title: "B 端产品架构",
					modelRef: "b2b-product-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "product",
					x: 2257,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 52,
						y: 29,
						width: 76,
						height: 18
					}
				},
				{
					id: "enterprise-reality",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"61aa3n",
						"1hu81ae",
						"hh9ocp"
					],
					outEdges: ["2g5edd"],
					title: "企业现实",
					modelRef: "enterprise-reality",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "business-process",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"1v05s59",
						"10g66gf",
						"whslxc"
					],
					outEdges: ["madb8u"],
					title: "业务流程",
					modelRef: "business-process",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1389,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "data-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1qczhac", "1ufcqlq"],
					outEdges: ["ipbhm6", "lwxxux"],
					title: "数据架构",
					modelRef: "data-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2396,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "enterprise-operation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["2g5edd", "1lnrev"],
					outEdges: ["17pptv"],
					title: "企业运作",
					modelRef: "enterprise-operation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "business-object-state",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["madb8u", "1jv1ru3"],
					outEdges: ["uulp69"],
					title: "业务对象的状态与关系",
					modelRef: "business-object-state",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1251,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 30,
						y: 30,
						width: 121,
						height: 18
					}
				},
				{
					id: "technical-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["2bj8ul", "lwxxux"],
					outEdges: ["fwg1a0"],
					title: "技术架构",
					modelRef: "technical-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2366,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "operating-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["17pptv"],
					outEdges: ["167iqvi"],
					title: "事实与经营结果",
					modelRef: "operating-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 166,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "business-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["uulp69"],
					outEdges: ["s1jbkq"],
					title: "事实与结果",
					modelRef: "business-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1251,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 59,
						y: 30,
						width: 62,
						height: 18
					}
				},
				{
					id: "engineering",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["fwg1a0"],
					outEdges: ["264svt"],
					title: "工程实现",
					modelRef: "engineering",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2366,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "business-metric",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["s1jbkq"],
					outEdges: ["stsohb"],
					title: "指标",
					modelRef: "business-metric",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 1305,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 76,
						y: 30,
						width: 27,
						height: 18
					}
				},
				{
					id: "enterprise-digital-system",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["264svt"],
					outEdges: ["qdsexq", "up919f"],
					title: "企业数字化系统",
					modelRef: "enterprise-digital-system",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2366,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "enterprise-reality-operation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["qdsexq"],
					outEdges: ["a5fy2f"],
					title: "企业现实中的企业运作",
					modelRef: "enterprise-reality-operation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2566,
					y: 1560,
					width: 180,
					height: 80,
					labelBBox: {
						x: 30,
						y: 30,
						width: 121,
						height: 18
					}
				},
				{
					id: "digital-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["up919f", "a5fy2f"],
					outEdges: ["1ts4q4u"],
					title: "事实与经营结果",
					modelRef: "digital-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 2566,
					y: 1783,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				}
			],
			edges: [
				{
					id: "1jh2lnz",
					parent: null,
					source: "external-context",
					target: "operation-design",
					label: "影响",
					relations: ["wmduy9"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[657, 80],
						[604, 118],
						[525, 177],
						[470, 217]
					],
					labelBBox: {
						x: 569,
						y: 141,
						width: 27,
						height: 18
					}
				},
				{
					id: "61aa3n",
					parent: null,
					source: "external-context",
					target: "enterprise-reality",
					label: "构成现实条件",
					relations: ["1fqm14s"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[712, 80],
						[715, 163],
						[718, 363],
						[685, 526],
						[677, 564],
						[677, 576],
						[655, 609],
						[641, 629],
						[623, 647],
						[604, 662]
					],
					labelBBox: {
						x: 708,
						y: 364,
						width: 74,
						height: 18
					}
				},
				{
					id: "adenxh",
					parent: null,
					source: "operation-design",
					target: "digital-implementation",
					label: "提出数字化需求",
					relations: ["1j2zr1w"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[431, 303],
						[454, 340],
						[487, 397],
						[511, 437]
					],
					labelBBox: {
						x: 479,
						y: 364,
						width: 86,
						height: 18
					}
				},
				{
					id: "1hu81ae",
					parent: null,
					source: "operation-design",
					target: "enterprise-reality",
					label: "建设和调整",
					relations: ["pq9efq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[380, 303],
						[345, 355],
						[296, 450],
						[331, 526],
						[357, 584],
						[413, 631],
						[461, 663]
					],
					labelBBox: {
						x: 332,
						y: 475,
						width: 62,
						height: 18
					}
				},
				{
					id: "1ansidc",
					parent: null,
					source: "operating-decision",
					target: "operation-design",
					label: "调整选择与设计",
					relations: ["1dtowjh"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[166, 1342],
						[92, 1307],
						[0, 1246],
						[0, 1155],
						[0, 485],
						[0, 485],
						[0, 485],
						[0, 345],
						[187, 293],
						[308, 274]
					],
					labelBBox: {
						x: 1,
						y: 810,
						width: 86,
						height: 18
					}
				},
				{
					id: "hh9ocp",
					parent: null,
					source: "digital-implementation",
					target: "enterprise-reality",
					label: "形成系统并进入",
					relations: ["1raid68"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[540, 526],
						[540, 563],
						[540, 618],
						[540, 658]
					],
					labelBBox: {
						x: 541,
						y: 587,
						width: 86,
						height: 18
					}
				},
				{
					id: "2g5edd",
					parent: null,
					source: "enterprise-reality",
					target: "enterprise-operation",
					label: "进行",
					relations: ["1tkza61"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[540, 749],
						[540, 786],
						[540, 841],
						[540, 881]
					],
					labelBBox: {
						x: 541,
						y: 810,
						width: 27,
						height: 18
					}
				},
				{
					id: "17pptv",
					parent: null,
					source: "enterprise-operation",
					target: "operating-facts-results",
					label: "产生",
					relations: ["c54b4o"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[490, 971],
						[441, 1010],
						[366, 1068],
						[314, 1108]
					],
					labelBBox: {
						x: 408,
						y: 1033,
						width: 27,
						height: 18
					}
				},
				{
					id: "1lnrev",
					parent: null,
					source: "operating-decision",
					target: "enterprise-operation",
					label: "影响后续运作",
					relations: ["12scpff"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[290, 1337],
						[321, 1302],
						[367, 1246],
						[401, 1194],
						[448, 1123],
						[492, 1035],
						[518, 981]
					],
					labelBBox: {
						x: 449,
						y: 1144,
						width: 74,
						height: 18
					}
				},
				{
					id: "167iqvi",
					parent: null,
					source: "operating-facts-results",
					target: "operating-decision",
					label: "支持",
					relations: ["7bjino"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[256, 1194],
						[256, 1231],
						[256, 1287],
						[256, 1327]
					],
					labelBBox: {
						x: 257,
						y: 1255,
						width: 27,
						height: 18
					}
				},
				{
					id: "1kvsztv",
					parent: null,
					source: "business-trigger",
					target: "value-stream",
					label: "触发",
					relations: ["4859i4"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1812, 80],
						[1812, 117],
						[1812, 173],
						[1812, 213]
					],
					labelBBox: {
						x: 1813,
						y: 141,
						width: 27,
						height: 18
					}
				},
				{
					id: "aeh7rb",
					parent: null,
					source: "value-stream",
					target: "capability-resource",
					label: "需要",
					relations: ["16dq989"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1819, 303],
						[1826, 340],
						[1836, 395],
						[1844, 435]
					],
					labelBBox: {
						x: 1835,
						y: 364,
						width: 27,
						height: 18
					}
				},
				{
					id: "1v05s59",
					parent: null,
					source: "capability-resource",
					target: "business-process",
					label: "通过流程落实",
					relations: ["1vf6zqk"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1787, 526],
						[1722, 564],
						[1622, 623],
						[1554, 663]
					],
					labelBBox: {
						x: 1678,
						y: 587,
						width: 74,
						height: 18
					}
				},
				{
					id: "yvscpd",
					parent: null,
					source: "responsibility",
					target: "capability-resource",
					label: "归类并承担",
					relations: ["doeuni"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2098, 80],
						[2049, 161],
						[1936, 349],
						[1882, 437]
					],
					labelBBox: {
						x: 2011,
						y: 253,
						width: 62,
						height: 18
					}
				},
				{
					id: "1ci4q3b",
					parent: null,
					source: "target-gap",
					target: "capability-resource",
					label: "调整能力与资源",
					relations: ["19z7dov"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1645, 1578],
						[1739, 1550],
						[1873, 1490],
						[1873, 1378],
						[1873, 708],
						[1873, 708],
						[1873, 708],
						[1873, 648],
						[1866, 581],
						[1860, 536]
					],
					labelBBox: {
						x: 1874,
						y: 1033,
						width: 86,
						height: 18
					}
				},
				{
					id: "madb8u",
					parent: null,
					source: "business-process",
					target: "business-object-state",
					label: "改变",
					relations: ["15uuaam"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1455, 749],
						[1431, 786],
						[1396, 843],
						[1371, 883]
					],
					labelBBox: {
						x: 1415,
						y: 810,
						width: 27,
						height: 18
					}
				},
				{
					id: "10g66gf",
					parent: null,
					source: "business-rule",
					target: "business-process",
					label: "约束行为与判断",
					relations: ["1a1zzn7"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[994, 1792],
						[913, 1760],
						[808, 1698],
						[808, 1601],
						[808, 930],
						[808, 930],
						[808, 930],
						[808, 812],
						[1192, 746],
						[1379, 721]
					],
					labelBBox: {
						x: 809,
						y: 1255,
						width: 86,
						height: 18
					}
				},
				{
					id: "whslxc",
					parent: null,
					source: "target-gap",
					target: "business-process",
					label: "调整流程",
					relations: ["1wib195"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1584, 1560],
						[1612, 1518],
						[1651, 1447],
						[1651, 1378],
						[1651, 930],
						[1651, 930],
						[1651, 930],
						[1651, 858],
						[1593, 795],
						[1544, 755]
					],
					labelBBox: {
						x: 1652,
						y: 1144,
						width: 51,
						height: 18
					}
				},
				{
					id: "1jv1ru3",
					parent: null,
					source: "business-rule",
					target: "business-object-state",
					label: "约束关系与状态变化",
					relations: ["1w6xvjq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1084, 1783],
						[1084, 1739],
						[1084, 1665],
						[1084, 1601],
						[1084, 1153],
						[1084, 1153],
						[1084, 1153],
						[1084, 1066],
						[1170, 1006],
						[1242, 971]
					],
					labelBBox: {
						x: 1085,
						y: 1367,
						width: 109,
						height: 18
					}
				},
				{
					id: "ej7j5x",
					parent: null,
					source: "target-gap",
					target: "business-rule",
					label: "调整规则",
					relations: ["1y0r6oj"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1472, 1640],
						[1389, 1679],
						[1262, 1738],
						[1177, 1779]
					],
					labelBBox: {
						x: 1335,
						y: 1701,
						width: 51,
						height: 18
					}
				},
				{
					id: "uulp69",
					parent: null,
					source: "business-object-state",
					target: "business-facts-results",
					label: "产生",
					relations: ["1b1o3qn"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1341, 971],
						[1341, 1008],
						[1341, 1064],
						[1341, 1104]
					],
					labelBBox: {
						x: 1342,
						y: 1033,
						width: 27,
						height: 18
					}
				},
				{
					id: "s1jbkq",
					parent: null,
					source: "business-facts-results",
					target: "business-metric",
					label: "提供计算依据",
					relations: ["10mjo5c"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1351, 1194],
						[1360, 1231],
						[1373, 1287],
						[1383, 1327]
					],
					labelBBox: {
						x: 1371,
						y: 1255,
						width: 74,
						height: 18
					}
				},
				{
					id: "stsohb",
					parent: null,
					source: "business-metric",
					target: "target-gap",
					label: "衡量并比较",
					relations: ["zwyt5g"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[1423, 1417],
						[1450, 1455],
						[1492, 1512],
						[1521, 1552]
					],
					labelBBox: {
						x: 1481,
						y: 1478,
						width: 62,
						height: 18
					}
				},
				{
					id: "pwdkkg",
					parent: null,
					source: "enterprise-business-architecture",
					target: "b2b-product-architecture",
					label: "提出数字化需求",
					relations: ["1pkzn3r"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2582, 303],
						[2552, 320],
						[2517, 341],
						[2486, 363],
						[2454, 386],
						[2421, 415],
						[2395, 439]
					],
					labelBBox: {
						x: 2487,
						y: 364,
						width: 86,
						height: 18
					}
				},
				{
					id: "1qczhac",
					parent: null,
					source: "enterprise-business-architecture",
					target: "data-architecture",
					label: "提出数字化需求",
					relations: ["1ejqd7f"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2641, 303],
						[2610, 384],
						[2539, 570],
						[2505, 659]
					],
					labelBBox: {
						x: 2586,
						y: 475,
						width: 86,
						height: 18
					}
				},
				{
					id: "pgm2z",
					parent: null,
					source: "digital-decision",
					target: "enterprise-business-architecture",
					label: "调整业务架构",
					relations: ["1ud9c0m"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2786, 80],
						[2759, 118],
						[2719, 174],
						[2690, 214]
					],
					labelBBox: {
						x: 2741,
						y: 141,
						width: 74,
						height: 18
					}
				},
				{
					id: "1ufcqlq",
					parent: null,
					source: "b2b-product-architecture",
					target: "data-architecture",
					label: "协同设计",
					relations: ["2mf6a8"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2334, 526],
						[2329, 551],
						[2326, 583],
						[2339, 609],
						[2351, 631],
						[2370, 649],
						[2391, 663]
					],
					labelBBox: {
						x: 2340,
						y: 587,
						width: 51,
						height: 18
					}
				},
				{
					id: "2bj8ul",
					parent: null,
					source: "b2b-product-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["rl47w1"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2324, 526],
						[2297, 578],
						[2259, 672],
						[2288, 749],
						[2310, 804],
						[2357, 852],
						[2396, 885]
					],
					labelBBox: {
						x: 2289,
						y: 698,
						width: 51,
						height: 18
					}
				},
				{
					id: "ipbhm6",
					parent: null,
					source: "data-architecture",
					target: "b2b-product-architecture",
					label: "相互约束",
					relations: ["1n55ss3"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2464, 669],
						[2451, 645],
						[2432, 613],
						[2415, 586],
						[2404, 569],
						[2392, 550],
						[2380, 534]
					],
					labelBBox: {
						x: 2428,
						y: 587,
						width: 51,
						height: 18
					}
				},
				{
					id: "lwxxux",
					parent: null,
					source: "data-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["r0bieq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2481, 749],
						[2476, 786],
						[2468, 841],
						[2463, 881]
					],
					labelBBox: {
						x: 2473,
						y: 810,
						width: 51,
						height: 18
					}
				},
				{
					id: "fwg1a0",
					parent: null,
					source: "technical-architecture",
					target: "engineering",
					label: "指导实现",
					relations: ["1l8cybm"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2456, 971],
						[2456, 1008],
						[2456, 1064],
						[2456, 1104]
					],
					labelBBox: {
						x: 2457,
						y: 1033,
						width: 51,
						height: 18
					}
				},
				{
					id: "264svt",
					parent: null,
					source: "engineering",
					target: "enterprise-digital-system",
					label: "形成",
					relations: ["1vfldj4"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2456, 1194],
						[2456, 1231],
						[2456, 1287],
						[2456, 1327]
					],
					labelBBox: {
						x: 2457,
						y: 1255,
						width: 27,
						height: 18
					}
				},
				{
					id: "qdsexq",
					parent: null,
					source: "enterprise-digital-system",
					target: "enterprise-reality-operation",
					label: "进入并支持或执行",
					relations: ["153q752"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2491, 1417],
						[2525, 1455],
						[2577, 1512],
						[2614, 1552]
					],
					labelBBox: {
						x: 2563,
						y: 1478,
						width: 97,
						height: 18
					}
				},
				{
					id: "up919f",
					parent: null,
					source: "enterprise-digital-system",
					target: "digital-facts-results",
					label: "记录",
					relations: ["xez5sl"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2452, 1417],
						[2449, 1470],
						[2448, 1567],
						[2482, 1640],
						[2507, 1695],
						[2556, 1744],
						[2595, 1777]
					],
					labelBBox: {
						x: 2483,
						y: 1590,
						width: 27,
						height: 18
					}
				},
				{
					id: "a5fy2f",
					parent: null,
					source: "enterprise-reality-operation",
					target: "digital-facts-results",
					label: "产生",
					relations: ["tfn940"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2656, 1640],
						[2656, 1677],
						[2656, 1733],
						[2656, 1773]
					],
					labelBBox: {
						x: 2657,
						y: 1701,
						width: 27,
						height: 18
					}
				},
				{
					id: "1ts4q4u",
					parent: null,
					source: "digital-facts-results",
					target: "digital-decision",
					label: "支持",
					relations: ["pc4lci"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[2746, 1788],
						[2820, 1753],
						[2912, 1691],
						[2912, 1601],
						[2912, 262],
						[2912, 262],
						[2912, 262],
						[2912, 198],
						[2877, 131],
						[2849, 88]
					],
					labelBBox: {
						x: 2913,
						y: 921,
						width: 27,
						height: 18
					}
				}
			]
		},
		landscape: {
			_type: "element",
			tags: null,
			links: null,
			_stage: "layouted",
			sourcePath: "model.c4",
			description: null,
			title: null,
			id: "landscape",
			autoLayout: { direction: "TB" },
			hash: "D03XEhGa4_26u6Fh7Y-gnCjbio20OPTsPm8ADVBDN2E",
			bounds: {
				x: 0,
				y: 0,
				width: 774,
				height: 1417
			},
			nodes: [
				{
					id: "external-context",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["1jh2lnz", "61aa3n"],
					title: "外部环境、利益相关者与需求",
					modelRef: "external-context",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 578,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 12,
						y: 30,
						width: 156,
						height: 18
					}
				},
				{
					id: "operation-design",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1jh2lnz", "1ansidc"],
					outEdges: ["adenxh", "1hu81ae"],
					title: "经营与架构设计",
					modelRef: "operation-design",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 295,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "digital-implementation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["adenxh"],
					outEdges: ["hh9ocp"],
					title: "数字化实现",
					modelRef: "digital-implementation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 59,
						y: 29,
						width: 62,
						height: 18
					}
				},
				{
					id: "enterprise-reality",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"61aa3n",
						"1hu81ae",
						"hh9ocp"
					],
					outEdges: ["2g5edd"],
					title: "企业现实",
					modelRef: "enterprise-reality",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "enterprise-operation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["2g5edd", "1lnrev"],
					outEdges: ["17pptv"],
					title: "企业运作",
					modelRef: "enterprise-operation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 450,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "operating-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["17pptv"],
					outEdges: ["167iqvi"],
					title: "事实与经营结果",
					modelRef: "operating-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 462,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "operating-decision",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["167iqvi"],
					outEdges: ["1ansidc", "1lnrev"],
					title: "经营分析与决策",
					modelRef: "operating-decision",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "landscape",
					x: 186,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				}
			],
			edges: [
				{
					id: "1jh2lnz",
					parent: null,
					source: "external-context",
					target: "operation-design",
					label: "影响",
					relations: ["wmduy9"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[618, 80],
						[569, 118],
						[495, 176],
						[443, 217]
					],
					labelBBox: {
						x: 536,
						y: 141,
						width: 27,
						height: 18
					}
				},
				{
					id: "adenxh",
					parent: null,
					source: "operation-design",
					target: "digital-implementation",
					label: "提出数字化需求",
					relations: ["1j2zr1w"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[412, 303],
						[439, 340],
						[479, 397],
						[507, 437]
					],
					labelBBox: {
						x: 468,
						y: 364,
						width: 86,
						height: 18
					}
				},
				{
					id: "61aa3n",
					parent: null,
					source: "external-context",
					target: "enterprise-reality",
					label: "构成现实条件",
					relations: ["1fqm14s"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[675, 80],
						[688, 163],
						[714, 362],
						[685, 526],
						[678, 564],
						[677, 576],
						[655, 609],
						[641, 629],
						[623, 647],
						[604, 662]
					],
					labelBBox: {
						x: 699,
						y: 364,
						width: 74,
						height: 18
					}
				},
				{
					id: "1hu81ae",
					parent: null,
					source: "operation-design",
					target: "enterprise-reality",
					label: "建设和调整",
					relations: ["pq9efq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[362, 303],
						[335, 356],
						[297, 451],
						[331, 526],
						[357, 584],
						[413, 631],
						[461, 663]
					],
					labelBBox: {
						x: 332,
						y: 475,
						width: 62,
						height: 18
					}
				},
				{
					id: "hh9ocp",
					parent: null,
					source: "digital-implementation",
					target: "enterprise-reality",
					label: "形成系统并进入",
					relations: ["1raid68"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[540, 526],
						[540, 563],
						[540, 618],
						[540, 658]
					],
					labelBBox: {
						x: 541,
						y: 587,
						width: 86,
						height: 18
					}
				},
				{
					id: "2g5edd",
					parent: null,
					source: "enterprise-reality",
					target: "enterprise-operation",
					label: "进行",
					relations: ["1tkza61"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[540, 749],
						[540, 786],
						[540, 841],
						[540, 881]
					],
					labelBBox: {
						x: 541,
						y: 810,
						width: 27,
						height: 18
					}
				},
				{
					id: "17pptv",
					parent: null,
					source: "enterprise-operation",
					target: "operating-facts-results",
					label: "产生",
					relations: ["c54b4o"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[542, 971],
						[544, 1008],
						[547, 1064],
						[549, 1104]
					],
					labelBBox: {
						x: 547,
						y: 1033,
						width: 27,
						height: 18
					}
				},
				{
					id: "167iqvi",
					parent: null,
					source: "operating-facts-results",
					target: "operating-decision",
					label: "支持",
					relations: ["7bjino"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[503, 1194],
						[456, 1232],
						[383, 1290],
						[333, 1331]
					],
					labelBBox: {
						x: 423,
						y: 1255,
						width: 27,
						height: 18
					}
				},
				{
					id: "1ansidc",
					parent: null,
					source: "operating-decision",
					target: "operation-design",
					label: "调整选择与设计",
					relations: ["1dtowjh"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[186, 1347],
						[105, 1314],
						[0, 1252],
						[0, 1155],
						[0, 485],
						[0, 485],
						[0, 485],
						[0, 353],
						[171, 299],
						[285, 277]
					],
					labelBBox: {
						x: 1,
						y: 810,
						width: 86,
						height: 18
					}
				},
				{
					id: "1lnrev",
					parent: null,
					source: "operating-decision",
					target: "enterprise-operation",
					label: "影响后续运作",
					relations: ["12scpff"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[277, 1338],
						[279, 1284],
						[289, 1185],
						[331, 1114],
						[364, 1058],
						[421, 1010],
						[468, 977]
					],
					labelBBox: {
						x: 332,
						y: 1144,
						width: 74,
						height: 18
					}
				}
			]
		},
		business: {
			_type: "element",
			tags: null,
			links: null,
			_stage: "layouted",
			sourcePath: "model.c4",
			description: null,
			title: null,
			id: "business",
			autoLayout: { direction: "TB" },
			hash: "B83vXNEbqhUC3Mbn7Ws-XXcsHeEvEM7GyrY4r9Htrts",
			bounds: {
				x: 0,
				y: 0,
				width: 1153,
				height: 1863
			},
			nodes: [
				{
					id: "business-trigger",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["1kvsztv"],
					title: "利益相关者需求 / 业务事件",
					modelRef: "business-trigger",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 613,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 18,
						y: 30,
						width: 144,
						height: 18
					}
				},
				{
					id: "responsibility",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["yvscpd"],
					title: "企业职能归类 / 组织承担",
					modelRef: "responsibility",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 923,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 24,
						y: 30,
						width: 132,
						height: 18
					}
				},
				{
					id: "business-rule",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["ej7j5x"],
					outEdges: ["10g66gf", "1jv1ru3"],
					title: "业务规则",
					modelRef: "business-rule",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 186,
					y: 1783,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "value-stream",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1kvsztv"],
					outEdges: ["aeh7rb"],
					title: "价值流",
					modelRef: "value-stream",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 613,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 71,
						y: 30,
						width: 39,
						height: 18
					}
				},
				{
					id: "capability-resource",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"aeh7rb",
						"yvscpd",
						"1ci4q3b"
					],
					outEdges: ["1v05s59"],
					title: "企业能力与资源",
					modelRef: "capability-resource",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 768,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 29,
						width: 86,
						height: 18
					}
				},
				{
					id: "business-process",
					parent: null,
					level: 0,
					children: [],
					inEdges: [
						"1v05s59",
						"10g66gf",
						"whslxc"
					],
					outEdges: ["madb8u"],
					title: "业务流程",
					modelRef: "business-process",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 581,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "business-object-state",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["madb8u", "1jv1ru3"],
					outEdges: ["uulp69"],
					title: "业务对象的状态与关系",
					modelRef: "business-object-state",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 443,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 30,
						y: 30,
						width: 121,
						height: 18
					}
				},
				{
					id: "business-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["uulp69"],
					outEdges: ["s1jbkq"],
					title: "事实与结果",
					modelRef: "business-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 443,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 59,
						y: 30,
						width: 62,
						height: 18
					}
				},
				{
					id: "business-metric",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["s1jbkq"],
					outEdges: ["stsohb"],
					title: "指标",
					modelRef: "business-metric",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 497,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 76,
						y: 30,
						width: 27,
						height: 18
					}
				},
				{
					id: "target-gap",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["stsohb"],
					outEdges: [
						"1ci4q3b",
						"whslxc",
						"ej7j5x"
					],
					title: "价值流结果与经营目标差距",
					modelRef: "target-gap",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "business",
					x: 658,
					y: 1560,
					width: 180,
					height: 80,
					labelBBox: {
						x: 18,
						y: 30,
						width: 144,
						height: 18
					}
				}
			],
			edges: [
				{
					id: "1kvsztv",
					parent: null,
					source: "business-trigger",
					target: "value-stream",
					label: "触发",
					relations: ["4859i4"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[703, 80],
						[703, 117],
						[703, 173],
						[703, 213]
					],
					labelBBox: {
						x: 704,
						y: 141,
						width: 27,
						height: 18
					}
				},
				{
					id: "aeh7rb",
					parent: null,
					source: "value-stream",
					target: "capability-resource",
					label: "需要",
					relations: ["16dq989"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[730, 303],
						[757, 340],
						[797, 397],
						[825, 437]
					],
					labelBBox: {
						x: 786,
						y: 364,
						width: 27,
						height: 18
					}
				},
				{
					id: "yvscpd",
					parent: null,
					source: "responsibility",
					target: "capability-resource",
					label: "归类并承担",
					relations: ["doeuni"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[999, 80],
						[971, 161],
						[906, 348],
						[875, 436]
					],
					labelBBox: {
						x: 949,
						y: 253,
						width: 62,
						height: 18
					}
				},
				{
					id: "1v05s59",
					parent: null,
					source: "capability-resource",
					target: "business-process",
					label: "通过流程落实",
					relations: ["1vf6zqk"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[825, 526],
						[793, 563],
						[745, 621],
						[711, 661]
					],
					labelBBox: {
						x: 771,
						y: 587,
						width: 74,
						height: 18
					}
				},
				{
					id: "10g66gf",
					parent: null,
					source: "business-rule",
					target: "business-process",
					label: "约束行为与判断",
					relations: ["1a1zzn7"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[186, 1792],
						[105, 1760],
						[0, 1698],
						[0, 1601],
						[0, 930],
						[0, 930],
						[0, 930],
						[0, 812],
						[384, 746],
						[571, 721]
					],
					labelBBox: {
						x: 1,
						y: 1255,
						width: 86,
						height: 18
					}
				},
				{
					id: "madb8u",
					parent: null,
					source: "business-process",
					target: "business-object-state",
					label: "改变",
					relations: ["15uuaam"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[647, 749],
						[623, 786],
						[588, 843],
						[563, 883]
					],
					labelBBox: {
						x: 607,
						y: 810,
						width: 27,
						height: 18
					}
				},
				{
					id: "1jv1ru3",
					parent: null,
					source: "business-rule",
					target: "business-object-state",
					label: "约束关系与状态变化",
					relations: ["1w6xvjq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[276, 1783],
						[276, 1739],
						[276, 1665],
						[276, 1601],
						[276, 1153],
						[276, 1153],
						[276, 1153],
						[276, 1066],
						[362, 1006],
						[434, 971]
					],
					labelBBox: {
						x: 277,
						y: 1367,
						width: 109,
						height: 18
					}
				},
				{
					id: "uulp69",
					parent: null,
					source: "business-object-state",
					target: "business-facts-results",
					label: "产生",
					relations: ["1b1o3qn"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[533, 971],
						[533, 1008],
						[533, 1064],
						[533, 1104]
					],
					labelBBox: {
						x: 534,
						y: 1033,
						width: 27,
						height: 18
					}
				},
				{
					id: "s1jbkq",
					parent: null,
					source: "business-facts-results",
					target: "business-metric",
					label: "提供计算依据",
					relations: ["10mjo5c"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[543, 1194],
						[552, 1231],
						[565, 1287],
						[575, 1327]
					],
					labelBBox: {
						x: 563,
						y: 1255,
						width: 74,
						height: 18
					}
				},
				{
					id: "stsohb",
					parent: null,
					source: "business-metric",
					target: "target-gap",
					label: "衡量并比较",
					relations: ["zwyt5g"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[615, 1417],
						[643, 1455],
						[684, 1512],
						[714, 1552]
					],
					labelBBox: {
						x: 673,
						y: 1478,
						width: 62,
						height: 18
					}
				},
				{
					id: "1ci4q3b",
					parent: null,
					source: "target-gap",
					target: "capability-resource",
					label: "调整能力与资源",
					relations: ["19z7dov"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[838, 1578],
						[932, 1549],
						[1065, 1490],
						[1065, 1378],
						[1065, 708],
						[1065, 708],
						[1065, 708],
						[1065, 631],
						[997, 570],
						[940, 531]
					],
					labelBBox: {
						x: 1066,
						y: 1033,
						width: 86,
						height: 18
					}
				},
				{
					id: "whslxc",
					parent: null,
					source: "target-gap",
					target: "business-process",
					label: "调整流程",
					relations: ["1wib195"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[776, 1560],
						[804, 1518],
						[843, 1446],
						[843, 1378],
						[843, 930],
						[843, 930],
						[843, 930],
						[843, 858],
						[785, 795],
						[736, 755]
					],
					labelBBox: {
						x: 844,
						y: 1144,
						width: 51,
						height: 18
					}
				},
				{
					id: "ej7j5x",
					parent: null,
					source: "target-gap",
					target: "business-rule",
					label: "调整规则",
					relations: ["1y0r6oj"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[665, 1640],
						[582, 1679],
						[455, 1738],
						[369, 1779]
					],
					labelBBox: {
						x: 527,
						y: 1701,
						width: 51,
						height: 18
					}
				}
			]
		},
		digital: {
			_type: "element",
			tags: null,
			links: null,
			_stage: "layouted",
			sourcePath: "model.c4",
			description: null,
			title: null,
			id: "digital",
			autoLayout: { direction: "TB" },
			hash: "KnyToCwmNVvvYs_iIlpC6SG_ANmuHAEbChLo256fUok",
			bounds: {
				x: 0,
				y: 0,
				width: 730,
				height: 1863
			},
			nodes: [
				{
					id: "enterprise-business-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["pgm2z"],
					outEdges: ["pwdkkg", "1qczhac"],
					title: "企业业务架构",
					modelRef: "enterprise-business-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 310,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 53,
						y: 30,
						width: 74,
						height: 18
					}
				},
				{
					id: "b2b-product-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["pwdkkg", "ipbhm6"],
					outEdges: ["1ufcqlq", "2bj8ul"],
					title: "B 端产品架构",
					modelRef: "b2b-product-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "product",
					x: 0,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 52,
						y: 30,
						width: 76,
						height: 18
					}
				},
				{
					id: "data-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1qczhac", "1ufcqlq"],
					outEdges: ["ipbhm6", "lwxxux"],
					title: "数据架构",
					modelRef: "data-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 139,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "technical-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["2bj8ul", "lwxxux"],
					outEdges: ["fwg1a0"],
					title: "技术架构",
					modelRef: "technical-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 109,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "engineering",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["fwg1a0"],
					outEdges: ["264svt"],
					title: "工程实现",
					modelRef: "engineering",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 109,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "enterprise-digital-system",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["264svt"],
					outEdges: ["qdsexq", "up919f"],
					title: "企业数字化系统",
					modelRef: "enterprise-digital-system",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 109,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "enterprise-reality-operation",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["qdsexq"],
					outEdges: ["a5fy2f"],
					title: "企业现实中的企业运作",
					modelRef: "enterprise-reality-operation",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 308,
					y: 1337,
					width: 180,
					height: 80,
					labelBBox: {
						x: 30,
						y: 30,
						width: 121,
						height: 18
					}
				},
				{
					id: "digital-facts-results",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["up919f", "a5fy2f"],
					outEdges: ["1ts4q4u"],
					title: "事实与经营结果",
					modelRef: "digital-facts-results",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 308,
					y: 1560,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				},
				{
					id: "digital-decision",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1ts4q4u"],
					outEdges: ["pgm2z"],
					title: "经营分析与决策",
					modelRef: "digital-decision",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 436,
					y: 1783,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				}
			],
			edges: [
				{
					id: "pwdkkg",
					parent: null,
					source: "enterprise-business-architecture",
					target: "b2b-product-architecture",
					label: "提出数字化需求",
					relations: ["1pkzn3r"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[326, 80],
						[295, 97],
						[260, 118],
						[229, 140],
						[197, 163],
						[164, 192],
						[138, 216]
					],
					labelBBox: {
						x: 230,
						y: 141,
						width: 86,
						height: 18
					}
				},
				{
					id: "1qczhac",
					parent: null,
					source: "enterprise-business-architecture",
					target: "data-architecture",
					label: "提出数字化需求",
					relations: ["1ejqd7f"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[385, 80],
						[354, 161],
						[282, 348],
						[248, 436]
					],
					labelBBox: {
						x: 330,
						y: 253,
						width: 86,
						height: 18
					}
				},
				{
					id: "1ufcqlq",
					parent: null,
					source: "b2b-product-architecture",
					target: "data-architecture",
					label: "协同设计",
					relations: ["2mf6a8"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[77, 303],
						[72, 328],
						[69, 360],
						[82, 386],
						[94, 408],
						[113, 426],
						[134, 440]
					],
					labelBBox: {
						x: 83,
						y: 364,
						width: 51,
						height: 18
					}
				},
				{
					id: "ipbhm6",
					parent: null,
					source: "data-architecture",
					target: "b2b-product-architecture",
					label: "相互约束",
					relations: ["1n55ss3"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[207, 446],
						[194, 422],
						[175, 390],
						[158, 363],
						[147, 346],
						[135, 327],
						[123, 311]
					],
					labelBBox: {
						x: 171,
						y: 364,
						width: 51,
						height: 18
					}
				},
				{
					id: "2bj8ul",
					parent: null,
					source: "b2b-product-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["rl47w1"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[67, 303],
						[40, 355],
						[2, 450],
						[31, 526],
						[53, 581],
						[100, 629],
						[139, 662]
					],
					labelBBox: {
						x: 32,
						y: 475,
						width: 51,
						height: 18
					}
				},
				{
					id: "lwxxux",
					parent: null,
					source: "data-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["r0bieq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[224, 526],
						[219, 563],
						[211, 618],
						[206, 658]
					],
					labelBBox: {
						x: 216,
						y: 587,
						width: 51,
						height: 18
					}
				},
				{
					id: "fwg1a0",
					parent: null,
					source: "technical-architecture",
					target: "engineering",
					label: "指导实现",
					relations: ["1l8cybm"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[199, 749],
						[199, 786],
						[199, 841],
						[199, 881]
					],
					labelBBox: {
						x: 200,
						y: 810,
						width: 51,
						height: 18
					}
				},
				{
					id: "264svt",
					parent: null,
					source: "engineering",
					target: "enterprise-digital-system",
					label: "形成",
					relations: ["1vfldj4"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[199, 971],
						[199, 1008],
						[199, 1064],
						[199, 1104]
					],
					labelBBox: {
						x: 200,
						y: 1033,
						width: 27,
						height: 18
					}
				},
				{
					id: "qdsexq",
					parent: null,
					source: "enterprise-digital-system",
					target: "enterprise-reality-operation",
					label: "进入并支持或执行",
					relations: ["153q752"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[234, 1194],
						[268, 1232],
						[320, 1289],
						[356, 1329]
					],
					labelBBox: {
						x: 305,
						y: 1255,
						width: 97,
						height: 18
					}
				},
				{
					id: "up919f",
					parent: null,
					source: "enterprise-digital-system",
					target: "digital-facts-results",
					label: "记录",
					relations: ["xez5sl"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[195, 1194],
						[191, 1247],
						[190, 1344],
						[224, 1417],
						[249, 1472],
						[297, 1521],
						[337, 1554]
					],
					labelBBox: {
						x: 225,
						y: 1367,
						width: 27,
						height: 18
					}
				},
				{
					id: "a5fy2f",
					parent: null,
					source: "enterprise-reality-operation",
					target: "digital-facts-results",
					label: "产生",
					relations: ["tfn940"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[398, 1417],
						[398, 1454],
						[398, 1510],
						[398, 1550]
					],
					labelBBox: {
						x: 399,
						y: 1478,
						width: 27,
						height: 18
					}
				},
				{
					id: "1ts4q4u",
					parent: null,
					source: "digital-facts-results",
					target: "digital-decision",
					label: "支持",
					relations: ["pc4lci"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[421, 1640],
						[442, 1677],
						[475, 1734],
						[498, 1774]
					],
					labelBBox: {
						x: 467,
						y: 1701,
						width: 27,
						height: 18
					}
				},
				{
					id: "pgm2z",
					parent: null,
					source: "digital-decision",
					target: "enterprise-business-architecture",
					label: "调整业务架构",
					relations: ["1ud9c0m"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[565, 1783],
						[603, 1742],
						[654, 1673],
						[654, 1601],
						[654, 262],
						[654, 262],
						[654, 262],
						[654, 176],
						[570, 116],
						[499, 80]
					],
					labelBBox: {
						x: 655,
						y: 921,
						width: 74,
						height: 18
					}
				}
			]
		},
		product: {
			_type: "element",
			tags: null,
			links: null,
			_stage: "layouted",
			sourcePath: "model.c4",
			description: null,
			title: null,
			id: "product",
			autoLayout: { direction: "TB" },
			hash: "_5Kss23lf6SrK4y1Mf3MQBIrWqE5SsHqrOUMZxUV9tc",
			bounds: {
				x: 0,
				y: 0,
				width: 453,
				height: 1194
			},
			nodes: [
				{
					id: "enterprise-business-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: [],
					outEdges: ["pwdkkg", "1qczhac"],
					title: "企业业务架构",
					modelRef: "enterprise-business-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 227,
					y: 0,
					width: 180,
					height: 80,
					labelBBox: {
						x: 53,
						y: 30,
						width: 74,
						height: 18
					}
				},
				{
					id: "b2b-product-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["pwdkkg", "ipbhm6"],
					outEdges: ["1ufcqlq", "2bj8ul"],
					title: "B 端产品架构",
					modelRef: "b2b-product-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "product",
					x: 72,
					y: 223,
					width: 180,
					height: 80,
					labelBBox: {
						x: 52,
						y: 30,
						width: 76,
						height: 18
					}
				},
				{
					id: "data-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["1qczhac", "1ufcqlq"],
					outEdges: ["ipbhm6", "lwxxux"],
					title: "数据架构",
					modelRef: "data-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 211,
					y: 446,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "technical-architecture",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["2bj8ul", "lwxxux"],
					outEdges: ["fwg1a0"],
					title: "技术架构",
					modelRef: "technical-architecture",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 0,
					y: 669,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 29,
						width: 51,
						height: 18
					}
				},
				{
					id: "engineering",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["fwg1a0"],
					outEdges: ["264svt"],
					title: "工程实现",
					modelRef: "engineering",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 0,
					y: 891,
					width: 180,
					height: 80,
					labelBBox: {
						x: 65,
						y: 30,
						width: 51,
						height: 18
					}
				},
				{
					id: "enterprise-digital-system",
					parent: null,
					level: 0,
					children: [],
					inEdges: ["264svt"],
					outEdges: [],
					title: "企业数字化系统",
					modelRef: "enterprise-digital-system",
					shape: "rectangle",
					color: "primary",
					style: {
						border: "solid",
						opacity: 15,
						size: "xs"
					},
					tags: [],
					kind: "digital",
					x: 0,
					y: 1114,
					width: 180,
					height: 80,
					labelBBox: {
						x: 47,
						y: 30,
						width: 86,
						height: 18
					}
				}
			],
			edges: [
				{
					id: "pwdkkg",
					parent: null,
					source: "enterprise-business-architecture",
					target: "b2b-product-architecture",
					label: "提出数字化需求",
					relations: ["1pkzn3r"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[290, 80],
						[263, 118],
						[224, 174],
						[195, 214]
					],
					labelBBox: {
						x: 245,
						y: 141,
						width: 86,
						height: 18
					}
				},
				{
					id: "1qczhac",
					parent: null,
					source: "enterprise-business-architecture",
					target: "data-architecture",
					label: "提出数字化需求",
					relations: ["1ejqd7f"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[338, 80],
						[346, 98],
						[355, 119],
						[359, 140],
						[380, 245],
						[345, 369],
						[321, 436]
					],
					labelBBox: {
						x: 366,
						y: 253,
						width: 86,
						height: 18
					}
				},
				{
					id: "1ufcqlq",
					parent: null,
					source: "b2b-product-architecture",
					target: "data-architecture",
					label: "协同设计",
					relations: ["2mf6a8"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[189, 302],
						[202, 321],
						[217, 343],
						[230, 363],
						[245, 387],
						[261, 414],
						[274, 437]
					],
					labelBBox: {
						x: 243,
						y: 364,
						width: 51,
						height: 18
					}
				},
				{
					id: "ipbhm6",
					parent: null,
					source: "data-architecture",
					target: "b2b-product-architecture",
					label: "相互约束",
					relations: ["1n55ss3"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[211, 446],
						[187, 431],
						[164, 411],
						[150, 386],
						[138, 364],
						[140, 336],
						[145, 313]
					],
					labelBBox: {
						x: 151,
						y: 364,
						width: 51,
						height: 18
					}
				},
				{
					id: "2bj8ul",
					parent: null,
					source: "b2b-product-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["rl47w1"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[141, 303],
						[132, 321],
						[122, 342],
						[116, 363],
						[85, 464],
						[85, 590],
						[87, 658]
					],
					labelBBox: {
						x: 98,
						y: 475,
						width: 51,
						height: 18
					}
				},
				{
					id: "lwxxux",
					parent: null,
					source: "data-architecture",
					target: "technical-architecture",
					label: "共同驱动",
					relations: ["r0bieq"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[264, 526],
						[228, 564],
						[173, 621],
						[134, 661]
					],
					labelBBox: {
						x: 203,
						y: 587,
						width: 51,
						height: 18
					}
				},
				{
					id: "fwg1a0",
					parent: null,
					source: "technical-architecture",
					target: "engineering",
					label: "指导实现",
					relations: ["1l8cybm"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[90, 749],
						[90, 786],
						[90, 841],
						[90, 881]
					],
					labelBBox: {
						x: 91,
						y: 810,
						width: 51,
						height: 18
					}
				},
				{
					id: "264svt",
					parent: null,
					source: "engineering",
					target: "enterprise-digital-system",
					label: "形成",
					relations: ["1vfldj4"],
					color: "primary",
					line: "solid",
					head: "normal",
					points: [
						[90, 971],
						[90, 1008],
						[90, 1064],
						[90, 1104]
					],
					labelBBox: {
						x: 91,
						y: 1033,
						width: 27,
						height: 18
					}
				}
			]
		}
	},
	deployments: {
		elements: {},
		relations: {}
	},
	imports: {},
	manualLayouts: {}
}));
//#endregion
//#region likec4:plugin/xingbuild-enterprise-operating-system/react.js
function LikeC4ModelProvider({ children }) {
	const likeC4Model = useLikeC4Model();
	return jsx(LikeC4ModelProvider$1, {
		likec4model: likeC4Model,
		children
	});
}
function LikeC4View(props) {
	return jsx(LikeC4ModelProvider, { children: jsx(LikeC4View$1, {
		renderIcon: IconRenderer,
		...props
	}) });
}
function ReactLikeC4(props) {
	return jsx(LikeC4ModelProvider, { children: jsx(ReactLikeC4$1, {
		renderIcon: IconRenderer,
		...props
	}) });
}
//#endregion
//#region node_modules/likec4/__app__/codegen/react.mjs
var s = $likec4model.get();
function isLikeC4ViewId(e) {
	return e != null && typeof e == "string" && !!s.findView(e);
}
//#endregion
export { LikeC4ModelProvider, LikeC4View, ReactLikeC4, IconRenderer as RenderIcon, isLikeC4ViewId, s as likec4model, useLikeC4Model, useLikeC4View };
