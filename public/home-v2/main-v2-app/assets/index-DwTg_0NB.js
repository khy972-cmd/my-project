var sd = e => {
  throw TypeError(e)
}
var Gl = (e, t, n) => t.has(e) || sd('Cannot ' + n)
var O = (e, t, n) => (Gl(e, t, 'read from private field'), n ? n.call(e) : t.get(e)),
  ae = (e, t, n) =>
    t.has(e)
      ? sd('Cannot add the same private member more than once')
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, n),
  ee = (e, t, n, r) => (Gl(e, t, 'write to private field'), r ? r.call(e, n) : t.set(e, n), n),
  Ue = (e, t, n) => (Gl(e, t, 'access private method'), n)
var Xs = (e, t, n, r) => ({
  set _(o) {
    ee(e, t, o, n)
  },
  get _() {
    return O(e, t, r)
  },
})
function ky(e, t) {
  for (var n = 0; n < t.length; n++) {
    const r = t[n]
    if (typeof r != 'string' && !Array.isArray(r)) {
      for (const o in r)
        if (o !== 'default' && !(o in e)) {
          const s = Object.getOwnPropertyDescriptor(r, o)
          s && Object.defineProperty(e, o, s.get ? s : { enumerable: !0, get: () => r[o] })
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }))
}
;(function () {
  const t = document.createElement('link').relList
  if (t && t.supports && t.supports('modulepreload')) return
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) r(o)
  new MutationObserver(o => {
    for (const s of o)
      if (s.type === 'childList')
        for (const i of s.addedNodes) i.tagName === 'LINK' && i.rel === 'modulepreload' && r(i)
  }).observe(document, { childList: !0, subtree: !0 })
  function n(o) {
    const s = {}
    return (
      o.integrity && (s.integrity = o.integrity),
      o.referrerPolicy && (s.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === 'use-credentials'
        ? (s.credentials = 'include')
        : o.crossOrigin === 'anonymous'
          ? (s.credentials = 'omit')
          : (s.credentials = 'same-origin'),
      s
    )
  }
  function r(o) {
    if (o.ep) return
    o.ep = !0
    const s = n(o)
    fetch(o.href, s)
  }
})()
function mp(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e
}
var gp = { exports: {} },
  ml = {},
  yp = { exports: {} },
  oe = {}
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var As = Symbol.for('react.element'),
  Cy = Symbol.for('react.portal'),
  Ey = Symbol.for('react.fragment'),
  Ny = Symbol.for('react.strict_mode'),
  Py = Symbol.for('react.profiler'),
  jy = Symbol.for('react.provider'),
  Ty = Symbol.for('react.context'),
  Ry = Symbol.for('react.forward_ref'),
  My = Symbol.for('react.suspense'),
  _y = Symbol.for('react.memo'),
  Oy = Symbol.for('react.lazy'),
  id = Symbol.iterator
function Ay(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (id && e[id]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var vp = {
    isMounted: function () {
      return !1
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  xp = Object.assign,
  wp = {}
function To(e, t, n) {
  ;((this.props = e), (this.context = t), (this.refs = wp), (this.updater = n || vp))
}
To.prototype.isReactComponent = {}
To.prototype.setState = function (e, t) {
  if (typeof e != 'object' && typeof e != 'function' && e != null)
    throw Error(
      'setState(...): takes an object of state variables to update or a function which returns an object of state variables.'
    )
  this.updater.enqueueSetState(this, e, t, 'setState')
}
To.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, 'forceUpdate')
}
function bp() {}
bp.prototype = To.prototype
function Hu(e, t, n) {
  ;((this.props = e), (this.context = t), (this.refs = wp), (this.updater = n || vp))
}
var Wu = (Hu.prototype = new bp())
Wu.constructor = Hu
xp(Wu, To.prototype)
Wu.isPureReactComponent = !0
var ld = Array.isArray,
  Sp = Object.prototype.hasOwnProperty,
  Vu = { current: null },
  kp = { key: !0, ref: !0, __self: !0, __source: !0 }
function Cp(e, t, n) {
  var r,
    o = {},
    s = null,
    i = null
  if (t != null)
    for (r in (t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (s = '' + t.key), t))
      Sp.call(t, r) && !kp.hasOwnProperty(r) && (o[r] = t[r])
  var l = arguments.length - 2
  if (l === 1) o.children = n
  else if (1 < l) {
    for (var a = Array(l), u = 0; u < l; u++) a[u] = arguments[u + 2]
    o.children = a
  }
  if (e && e.defaultProps) for (r in ((l = e.defaultProps), l)) o[r] === void 0 && (o[r] = l[r])
  return { $$typeof: As, type: e, key: s, ref: i, props: o, _owner: Vu.current }
}
function Ly(e, t) {
  return { $$typeof: As, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner }
}
function Qu(e) {
  return typeof e == 'object' && e !== null && e.$$typeof === As
}
function Iy(e) {
  var t = { '=': '=0', ':': '=2' }
  return (
    '$' +
    e.replace(/[=:]/g, function (n) {
      return t[n]
    })
  )
}
var ad = /\/+/g
function ql(e, t) {
  return typeof e == 'object' && e !== null && e.key != null ? Iy('' + e.key) : t.toString(36)
}
function bi(e, t, n, r, o) {
  var s = typeof e
  ;(s === 'undefined' || s === 'boolean') && (e = null)
  var i = !1
  if (e === null) i = !0
  else
    switch (s) {
      case 'string':
      case 'number':
        i = !0
        break
      case 'object':
        switch (e.$$typeof) {
          case As:
          case Cy:
            i = !0
        }
    }
  if (i)
    return (
      (i = e),
      (o = o(i)),
      (e = r === '' ? '.' + ql(i, 0) : r),
      ld(o)
        ? ((n = ''),
          e != null && (n = e.replace(ad, '$&/') + '/'),
          bi(o, t, n, '', function (u) {
            return u
          }))
        : o != null &&
          (Qu(o) &&
            (o = Ly(
              o,
              n +
                (!o.key || (i && i.key === o.key) ? '' : ('' + o.key).replace(ad, '$&/') + '/') +
                e
            )),
          t.push(o)),
      1
    )
  if (((i = 0), (r = r === '' ? '.' : r + ':'), ld(e)))
    for (var l = 0; l < e.length; l++) {
      s = e[l]
      var a = r + ql(s, l)
      i += bi(s, t, n, a, o)
    }
  else if (((a = Ay(e)), typeof a == 'function'))
    for (e = a.call(e), l = 0; !(s = e.next()).done; )
      ((s = s.value), (a = r + ql(s, l++)), (i += bi(s, t, n, a, o)))
  else if (s === 'object')
    throw (
      (t = String(e)),
      Error(
        'Objects are not valid as a React child (found: ' +
          (t === '[object Object]' ? 'object with keys {' + Object.keys(e).join(', ') + '}' : t) +
          '). If you meant to render a collection of children, use an array instead.'
      )
    )
  return i
}
function Zs(e, t, n) {
  if (e == null) return e
  var r = [],
    o = 0
  return (
    bi(e, r, '', '', function (s) {
      return t.call(n, s, o++)
    }),
    r
  )
}
function Dy(e) {
  if (e._status === -1) {
    var t = e._result
    ;((t = t()),
      t.then(
        function (n) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n))
        },
        function (n) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n))
        }
      ),
      e._status === -1 && ((e._status = 0), (e._result = t)))
  }
  if (e._status === 1) return e._result.default
  throw e._result
}
var Xe = { current: null },
  Si = { transition: null },
  zy = { ReactCurrentDispatcher: Xe, ReactCurrentBatchConfig: Si, ReactCurrentOwner: Vu }
function Ep() {
  throw Error('act(...) is not supported in production builds of React.')
}
oe.Children = {
  map: Zs,
  forEach: function (e, t, n) {
    Zs(
      e,
      function () {
        t.apply(this, arguments)
      },
      n
    )
  },
  count: function (e) {
    var t = 0
    return (
      Zs(e, function () {
        t++
      }),
      t
    )
  },
  toArray: function (e) {
    return (
      Zs(e, function (t) {
        return t
      }) || []
    )
  },
  only: function (e) {
    if (!Qu(e)) throw Error('React.Children.only expected to receive a single React element child.')
    return e
  },
}
oe.Component = To
oe.Fragment = Ey
oe.Profiler = Py
oe.PureComponent = Hu
oe.StrictMode = Ny
oe.Suspense = My
oe.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = zy
oe.act = Ep
oe.cloneElement = function (e, t, n) {
  if (e == null)
    throw Error(
      'React.cloneElement(...): The argument must be a React element, but you passed ' + e + '.'
    )
  var r = xp({}, e.props),
    o = e.key,
    s = e.ref,
    i = e._owner
  if (t != null) {
    if (
      (t.ref !== void 0 && ((s = t.ref), (i = Vu.current)),
      t.key !== void 0 && (o = '' + t.key),
      e.type && e.type.defaultProps)
    )
      var l = e.type.defaultProps
    for (a in t)
      Sp.call(t, a) &&
        !kp.hasOwnProperty(a) &&
        (r[a] = t[a] === void 0 && l !== void 0 ? l[a] : t[a])
  }
  var a = arguments.length - 2
  if (a === 1) r.children = n
  else if (1 < a) {
    l = Array(a)
    for (var u = 0; u < a; u++) l[u] = arguments[u + 2]
    r.children = l
  }
  return { $$typeof: As, type: e.type, key: o, ref: s, props: r, _owner: i }
}
oe.createContext = function (e) {
  return (
    (e = {
      $$typeof: Ty,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: jy, _context: e }),
    (e.Consumer = e)
  )
}
oe.createElement = Cp
oe.createFactory = function (e) {
  var t = Cp.bind(null, e)
  return ((t.type = e), t)
}
oe.createRef = function () {
  return { current: null }
}
oe.forwardRef = function (e) {
  return { $$typeof: Ry, render: e }
}
oe.isValidElement = Qu
oe.lazy = function (e) {
  return { $$typeof: Oy, _payload: { _status: -1, _result: e }, _init: Dy }
}
oe.memo = function (e, t) {
  return { $$typeof: _y, type: e, compare: t === void 0 ? null : t }
}
oe.startTransition = function (e) {
  var t = Si.transition
  Si.transition = {}
  try {
    e()
  } finally {
    Si.transition = t
  }
}
oe.unstable_act = Ep
oe.useCallback = function (e, t) {
  return Xe.current.useCallback(e, t)
}
oe.useContext = function (e) {
  return Xe.current.useContext(e)
}
oe.useDebugValue = function () {}
oe.useDeferredValue = function (e) {
  return Xe.current.useDeferredValue(e)
}
oe.useEffect = function (e, t) {
  return Xe.current.useEffect(e, t)
}
oe.useId = function () {
  return Xe.current.useId()
}
oe.useImperativeHandle = function (e, t, n) {
  return Xe.current.useImperativeHandle(e, t, n)
}
oe.useInsertionEffect = function (e, t) {
  return Xe.current.useInsertionEffect(e, t)
}
oe.useLayoutEffect = function (e, t) {
  return Xe.current.useLayoutEffect(e, t)
}
oe.useMemo = function (e, t) {
  return Xe.current.useMemo(e, t)
}
oe.useReducer = function (e, t, n) {
  return Xe.current.useReducer(e, t, n)
}
oe.useRef = function (e) {
  return Xe.current.useRef(e)
}
oe.useState = function (e) {
  return Xe.current.useState(e)
}
oe.useSyncExternalStore = function (e, t, n) {
  return Xe.current.useSyncExternalStore(e, t, n)
}
oe.useTransition = function () {
  return Xe.current.useTransition()
}
oe.version = '18.3.1'
yp.exports = oe
var y = yp.exports
const F = mp(y),
  Np = ky({ __proto__: null, default: F }, [y])
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Fy = y,
  $y = Symbol.for('react.element'),
  Uy = Symbol.for('react.fragment'),
  By = Object.prototype.hasOwnProperty,
  Hy = Fy.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  Wy = { key: !0, ref: !0, __self: !0, __source: !0 }
function Pp(e, t, n) {
  var r,
    o = {},
    s = null,
    i = null
  ;(n !== void 0 && (s = '' + n),
    t.key !== void 0 && (s = '' + t.key),
    t.ref !== void 0 && (i = t.ref))
  for (r in t) By.call(t, r) && !Wy.hasOwnProperty(r) && (o[r] = t[r])
  if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) o[r] === void 0 && (o[r] = t[r])
  return { $$typeof: $y, type: e, key: s, ref: i, props: o, _owner: Hy.current }
}
ml.Fragment = Uy
ml.jsx = Pp
ml.jsxs = Pp
gp.exports = ml
var c = gp.exports,
  jp = { exports: {} },
  gt = {},
  Tp = { exports: {} },
  Rp = {}
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ ;(function (e) {
  function t(R, C) {
    var _ = R.length
    R.push(C)
    e: for (; 0 < _; ) {
      var B = (_ - 1) >>> 1,
        H = R[B]
      if (0 < o(H, C)) ((R[B] = C), (R[_] = H), (_ = B))
      else break e
    }
  }
  function n(R) {
    return R.length === 0 ? null : R[0]
  }
  function r(R) {
    if (R.length === 0) return null
    var C = R[0],
      _ = R.pop()
    if (_ !== C) {
      R[0] = _
      e: for (var B = 0, H = R.length, Z = H >>> 1; B < Z; ) {
        var te = 2 * (B + 1) - 1,
          fe = R[te],
          ue = te + 1,
          J = R[ue]
        if (0 > o(fe, _))
          ue < H && 0 > o(J, fe)
            ? ((R[B] = J), (R[ue] = _), (B = ue))
            : ((R[B] = fe), (R[te] = _), (B = te))
        else if (ue < H && 0 > o(J, _)) ((R[B] = J), (R[ue] = _), (B = ue))
        else break e
      }
    }
    return C
  }
  function o(R, C) {
    var _ = R.sortIndex - C.sortIndex
    return _ !== 0 ? _ : R.id - C.id
  }
  if (typeof performance == 'object' && typeof performance.now == 'function') {
    var s = performance
    e.unstable_now = function () {
      return s.now()
    }
  } else {
    var i = Date,
      l = i.now()
    e.unstable_now = function () {
      return i.now() - l
    }
  }
  var a = [],
    u = [],
    d = 1,
    f = null,
    g = 3,
    p = !1,
    b = !1,
    x = !1,
    w = typeof setTimeout == 'function' ? setTimeout : null,
    m = typeof clearTimeout == 'function' ? clearTimeout : null,
    h = typeof setImmediate < 'u' ? setImmediate : null
  typeof navigator < 'u' &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling)
  function v(R) {
    for (var C = n(u); C !== null; ) {
      if (C.callback === null) r(u)
      else if (C.startTime <= R) (r(u), (C.sortIndex = C.expirationTime), t(a, C))
      else break
      C = n(u)
    }
  }
  function k(R) {
    if (((x = !1), v(R), !b))
      if (n(a) !== null) ((b = !0), K(N))
      else {
        var C = n(u)
        C !== null && W(k, C.startTime - R)
      }
  }
  function N(R, C) {
    ;((b = !1), x && ((x = !1), m(T), (T = -1)), (p = !0))
    var _ = g
    try {
      for (v(C), f = n(a); f !== null && (!(f.expirationTime > C) || (R && !Q())); ) {
        var B = f.callback
        if (typeof B == 'function') {
          ;((f.callback = null), (g = f.priorityLevel))
          var H = B(f.expirationTime <= C)
          ;((C = e.unstable_now()),
            typeof H == 'function' ? (f.callback = H) : f === n(a) && r(a),
            v(C))
        } else r(a)
        f = n(a)
      }
      if (f !== null) var Z = !0
      else {
        var te = n(u)
        ;(te !== null && W(k, te.startTime - C), (Z = !1))
      }
      return Z
    } finally {
      ;((f = null), (g = _), (p = !1))
    }
  }
  var j = !1,
    P = null,
    T = -1,
    I = 5,
    D = -1
  function Q() {
    return !(e.unstable_now() - D < I)
  }
  function U() {
    if (P !== null) {
      var R = e.unstable_now()
      D = R
      var C = !0
      try {
        C = P(!0, R)
      } finally {
        C ? G() : ((j = !1), (P = null))
      }
    } else j = !1
  }
  var G
  if (typeof h == 'function')
    G = function () {
      h(U)
    }
  else if (typeof MessageChannel < 'u') {
    var $ = new MessageChannel(),
      re = $.port2
    ;(($.port1.onmessage = U),
      (G = function () {
        re.postMessage(null)
      }))
  } else
    G = function () {
      w(U, 0)
    }
  function K(R) {
    ;((P = R), j || ((j = !0), G()))
  }
  function W(R, C) {
    T = w(function () {
      R(e.unstable_now())
    }, C)
  }
  ;((e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (R) {
      R.callback = null
    }),
    (e.unstable_continueExecution = function () {
      b || p || ((b = !0), K(N))
    }),
    (e.unstable_forceFrameRate = function (R) {
      0 > R || 125 < R
        ? console.error(
            'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported'
          )
        : (I = 0 < R ? Math.floor(1e3 / R) : 5)
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return g
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(a)
    }),
    (e.unstable_next = function (R) {
      switch (g) {
        case 1:
        case 2:
        case 3:
          var C = 3
          break
        default:
          C = g
      }
      var _ = g
      g = C
      try {
        return R()
      } finally {
        g = _
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (R, C) {
      switch (R) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break
        default:
          R = 3
      }
      var _ = g
      g = R
      try {
        return C()
      } finally {
        g = _
      }
    }),
    (e.unstable_scheduleCallback = function (R, C, _) {
      var B = e.unstable_now()
      switch (
        (typeof _ == 'object' && _ !== null
          ? ((_ = _.delay), (_ = typeof _ == 'number' && 0 < _ ? B + _ : B))
          : (_ = B),
        R)
      ) {
        case 1:
          var H = -1
          break
        case 2:
          H = 250
          break
        case 5:
          H = 1073741823
          break
        case 4:
          H = 1e4
          break
        default:
          H = 5e3
      }
      return (
        (H = _ + H),
        (R = {
          id: d++,
          callback: C,
          priorityLevel: R,
          startTime: _,
          expirationTime: H,
          sortIndex: -1,
        }),
        _ > B
          ? ((R.sortIndex = _),
            t(u, R),
            n(a) === null && R === n(u) && (x ? (m(T), (T = -1)) : (x = !0), W(k, _ - B)))
          : ((R.sortIndex = H), t(a, R), b || p || ((b = !0), K(N))),
        R
      )
    }),
    (e.unstable_shouldYield = Q),
    (e.unstable_wrapCallback = function (R) {
      var C = g
      return function () {
        var _ = g
        g = C
        try {
          return R.apply(this, arguments)
        } finally {
          g = _
        }
      }
    }))
})(Rp)
Tp.exports = Rp
var Vy = Tp.exports
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Qy = y,
  mt = Vy
function L(e) {
  for (
    var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, n = 1;
    n < arguments.length;
    n++
  )
    t += '&args[]=' + encodeURIComponent(arguments[n])
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  )
}
var Mp = new Set(),
  ls = {}
function Or(e, t) {
  ;(xo(e, t), xo(e + 'Capture', t))
}
function xo(e, t) {
  for (ls[e] = t, e = 0; e < t.length; e++) Mp.add(t[e])
}
var yn = !(
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
  ),
  Ia = Object.prototype.hasOwnProperty,
  Ky =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  ud = {},
  cd = {}
function Yy(e) {
  return Ia.call(cd, e) ? !0 : Ia.call(ud, e) ? !1 : Ky.test(e) ? (cd[e] = !0) : ((ud[e] = !0), !1)
}
function Gy(e, t, n, r) {
  if (n !== null && n.type === 0) return !1
  switch (typeof t) {
    case 'function':
    case 'symbol':
      return !0
    case 'boolean':
      return r
        ? !1
        : n !== null
          ? !n.acceptsBooleans
          : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-')
    default:
      return !1
  }
}
function qy(e, t, n, r) {
  if (t === null || typeof t > 'u' || Gy(e, t, n, r)) return !0
  if (r) return !1
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t
      case 4:
        return t === !1
      case 5:
        return isNaN(t)
      case 6:
        return isNaN(t) || 1 > t
    }
  return !1
}
function Ze(e, t, n, r, o, s, i) {
  ;((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = o),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = s),
    (this.removeEmptyString = i))
}
var $e = {}
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
  .split(' ')
  .forEach(function (e) {
    $e[e] = new Ze(e, 0, !1, e, null, !1, !1)
  })
;[
  ['acceptCharset', 'accept-charset'],
  ['className', 'class'],
  ['htmlFor', 'for'],
  ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
  var t = e[0]
  $e[t] = new Ze(t, 1, !1, e[1], null, !1, !1)
})
;['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
  $e[e] = new Ze(e, 2, !1, e.toLowerCase(), null, !1, !1)
})
;['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
  $e[e] = new Ze(e, 2, !1, e, null, !1, !1)
})
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
  .split(' ')
  .forEach(function (e) {
    $e[e] = new Ze(e, 3, !1, e.toLowerCase(), null, !1, !1)
  })
;['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
  $e[e] = new Ze(e, 3, !0, e, null, !1, !1)
})
;['capture', 'download'].forEach(function (e) {
  $e[e] = new Ze(e, 4, !1, e, null, !1, !1)
})
;['cols', 'rows', 'size', 'span'].forEach(function (e) {
  $e[e] = new Ze(e, 6, !1, e, null, !1, !1)
})
;['rowSpan', 'start'].forEach(function (e) {
  $e[e] = new Ze(e, 5, !1, e.toLowerCase(), null, !1, !1)
})
var Ku = /[\-:]([a-z])/g
function Yu(e) {
  return e[1].toUpperCase()
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
  .split(' ')
  .forEach(function (e) {
    var t = e.replace(Ku, Yu)
    $e[t] = new Ze(t, 1, !1, e, null, !1, !1)
  })
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
  .split(' ')
  .forEach(function (e) {
    var t = e.replace(Ku, Yu)
    $e[t] = new Ze(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1)
  })
;['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
  var t = e.replace(Ku, Yu)
  $e[t] = new Ze(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1)
})
;['tabIndex', 'crossOrigin'].forEach(function (e) {
  $e[e] = new Ze(e, 1, !1, e.toLowerCase(), null, !1, !1)
})
$e.xlinkHref = new Ze('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1)
;['src', 'href', 'action', 'formAction'].forEach(function (e) {
  $e[e] = new Ze(e, 1, !1, e.toLowerCase(), null, !0, !0)
})
function Gu(e, t, n, r) {
  var o = $e.hasOwnProperty(t) ? $e[t] : null
  ;(o !== null
    ? o.type !== 0
    : r || !(2 < t.length) || (t[0] !== 'o' && t[0] !== 'O') || (t[1] !== 'n' && t[1] !== 'N')) &&
    (qy(t, n, o, r) && (n = null),
    r || o === null
      ? Yy(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
      : o.mustUseProperty
        ? (e[o.propertyName] = n === null ? (o.type === 3 ? !1 : '') : n)
        : ((t = o.attributeName),
          (r = o.attributeNamespace),
          n === null
            ? e.removeAttribute(t)
            : ((o = o.type),
              (n = o === 3 || (o === 4 && n === !0) ? '' : '' + n),
              r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))))
}
var kn = Qy.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  Js = Symbol.for('react.element'),
  Hr = Symbol.for('react.portal'),
  Wr = Symbol.for('react.fragment'),
  qu = Symbol.for('react.strict_mode'),
  Da = Symbol.for('react.profiler'),
  _p = Symbol.for('react.provider'),
  Op = Symbol.for('react.context'),
  Xu = Symbol.for('react.forward_ref'),
  za = Symbol.for('react.suspense'),
  Fa = Symbol.for('react.suspense_list'),
  Zu = Symbol.for('react.memo'),
  On = Symbol.for('react.lazy'),
  Ap = Symbol.for('react.offscreen'),
  dd = Symbol.iterator
function Do(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (dd && e[dd]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var ke = Object.assign,
  Xl
function Ko(e) {
  if (Xl === void 0)
    try {
      throw Error()
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/)
      Xl = (t && t[1]) || ''
    }
  return (
    `
` +
    Xl +
    e
  )
}
var Zl = !1
function Jl(e, t) {
  if (!e || Zl) return ''
  Zl = !0
  var n = Error.prepareStackTrace
  Error.prepareStackTrace = void 0
  try {
    if (t)
      if (
        ((t = function () {
          throw Error()
        }),
        Object.defineProperty(t.prototype, 'props', {
          set: function () {
            throw Error()
          },
        }),
        typeof Reflect == 'object' && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, [])
        } catch (u) {
          var r = u
        }
        Reflect.construct(e, [], t)
      } else {
        try {
          t.call()
        } catch (u) {
          r = u
        }
        e.call(t.prototype)
      }
    else {
      try {
        throw Error()
      } catch (u) {
        r = u
      }
      e()
    }
  } catch (u) {
    if (u && r && typeof u.stack == 'string') {
      for (
        var o = u.stack.split(`
`),
          s = r.stack.split(`
`),
          i = o.length - 1,
          l = s.length - 1;
        1 <= i && 0 <= l && o[i] !== s[l];

      )
        l--
      for (; 1 <= i && 0 <= l; i--, l--)
        if (o[i] !== s[l]) {
          if (i !== 1 || l !== 1)
            do
              if ((i--, l--, 0 > l || o[i] !== s[l])) {
                var a =
                  `
` + o[i].replace(' at new ', ' at ')
                return (
                  e.displayName &&
                    a.includes('<anonymous>') &&
                    (a = a.replace('<anonymous>', e.displayName)),
                  a
                )
              }
            while (1 <= i && 0 <= l)
          break
        }
    }
  } finally {
    ;((Zl = !1), (Error.prepareStackTrace = n))
  }
  return (e = e ? e.displayName || e.name : '') ? Ko(e) : ''
}
function Xy(e) {
  switch (e.tag) {
    case 5:
      return Ko(e.type)
    case 16:
      return Ko('Lazy')
    case 13:
      return Ko('Suspense')
    case 19:
      return Ko('SuspenseList')
    case 0:
    case 2:
    case 15:
      return ((e = Jl(e.type, !1)), e)
    case 11:
      return ((e = Jl(e.type.render, !1)), e)
    case 1:
      return ((e = Jl(e.type, !0)), e)
    default:
      return ''
  }
}
function $a(e) {
  if (e == null) return null
  if (typeof e == 'function') return e.displayName || e.name || null
  if (typeof e == 'string') return e
  switch (e) {
    case Wr:
      return 'Fragment'
    case Hr:
      return 'Portal'
    case Da:
      return 'Profiler'
    case qu:
      return 'StrictMode'
    case za:
      return 'Suspense'
    case Fa:
      return 'SuspenseList'
  }
  if (typeof e == 'object')
    switch (e.$$typeof) {
      case Op:
        return (e.displayName || 'Context') + '.Consumer'
      case _p:
        return (e._context.displayName || 'Context') + '.Provider'
      case Xu:
        var t = e.render
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ''),
            (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
          e
        )
      case Zu:
        return ((t = e.displayName || null), t !== null ? t : $a(e.type) || 'Memo')
      case On:
        ;((t = e._payload), (e = e._init))
        try {
          return $a(e(t))
        } catch {}
    }
  return null
}
function Zy(e) {
  var t = e.type
  switch (e.tag) {
    case 24:
      return 'Cache'
    case 9:
      return (t.displayName || 'Context') + '.Consumer'
    case 10:
      return (t._context.displayName || 'Context') + '.Provider'
    case 18:
      return 'DehydratedFragment'
    case 11:
      return (
        (e = t.render),
        (e = e.displayName || e.name || ''),
        t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
      )
    case 7:
      return 'Fragment'
    case 5:
      return t
    case 4:
      return 'Portal'
    case 3:
      return 'Root'
    case 6:
      return 'Text'
    case 16:
      return $a(t)
    case 8:
      return t === qu ? 'StrictMode' : 'Mode'
    case 22:
      return 'Offscreen'
    case 12:
      return 'Profiler'
    case 21:
      return 'Scope'
    case 13:
      return 'Suspense'
    case 19:
      return 'SuspenseList'
    case 25:
      return 'TracingMarker'
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == 'function') return t.displayName || t.name || null
      if (typeof t == 'string') return t
  }
  return null
}
function er(e) {
  switch (typeof e) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return e
    case 'object':
      return e
    default:
      return ''
  }
}
function Lp(e) {
  var t = e.type
  return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio')
}
function Jy(e) {
  var t = Lp(e) ? 'checked' : 'value',
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = '' + e[t]
  if (
    !e.hasOwnProperty(t) &&
    typeof n < 'u' &&
    typeof n.get == 'function' &&
    typeof n.set == 'function'
  ) {
    var o = n.get,
      s = n.set
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return o.call(this)
        },
        set: function (i) {
          ;((r = '' + i), s.call(this, i))
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r
        },
        setValue: function (i) {
          r = '' + i
        },
        stopTracking: function () {
          ;((e._valueTracker = null), delete e[t])
        },
      }
    )
  }
}
function ei(e) {
  e._valueTracker || (e._valueTracker = Jy(e))
}
function Ip(e) {
  if (!e) return !1
  var t = e._valueTracker
  if (!t) return !0
  var n = t.getValue(),
    r = ''
  return (
    e && (r = Lp(e) ? (e.checked ? 'true' : 'false') : e.value),
    (e = r),
    e !== n ? (t.setValue(e), !0) : !1
  )
}
function Di(e) {
  if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null
  try {
    return e.activeElement || e.body
  } catch {
    return e.body
  }
}
function Ua(e, t) {
  var n = t.checked
  return ke({}, t, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: n ?? e._wrapperState.initialChecked,
  })
}
function fd(e, t) {
  var n = t.defaultValue == null ? '' : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked
  ;((n = er(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled: t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
    }))
}
function Dp(e, t) {
  ;((t = t.checked), t != null && Gu(e, 'checked', t, !1))
}
function Ba(e, t) {
  Dp(e, t)
  var n = er(t.value),
    r = t.type
  if (n != null)
    r === 'number'
      ? ((n === 0 && e.value === '') || e.value != n) && (e.value = '' + n)
      : e.value !== '' + n && (e.value = '' + n)
  else if (r === 'submit' || r === 'reset') {
    e.removeAttribute('value')
    return
  }
  ;(t.hasOwnProperty('value')
    ? Ha(e, t.type, n)
    : t.hasOwnProperty('defaultValue') && Ha(e, t.type, er(t.defaultValue)),
    t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked))
}
function pd(e, t, n) {
  if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
    var r = t.type
    if (!((r !== 'submit' && r !== 'reset') || (t.value !== void 0 && t.value !== null))) return
    ;((t = '' + e._wrapperState.initialValue),
      n || t === e.value || (e.value = t),
      (e.defaultValue = t))
  }
  ;((n = e.name),
    n !== '' && (e.name = ''),
    (e.defaultChecked = !!e._wrapperState.initialChecked),
    n !== '' && (e.name = n))
}
function Ha(e, t, n) {
  ;(t !== 'number' || Di(e.ownerDocument) !== e) &&
    (n == null
      ? (e.defaultValue = '' + e._wrapperState.initialValue)
      : e.defaultValue !== '' + n && (e.defaultValue = '' + n))
}
var Yo = Array.isArray
function no(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {}
    for (var o = 0; o < n.length; o++) t['$' + n[o]] = !0
    for (n = 0; n < e.length; n++)
      ((o = t.hasOwnProperty('$' + e[n].value)),
        e[n].selected !== o && (e[n].selected = o),
        o && r && (e[n].defaultSelected = !0))
  } else {
    for (n = '' + er(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        ;((e[o].selected = !0), r && (e[o].defaultSelected = !0))
        return
      }
      t !== null || e[o].disabled || (t = e[o])
    }
    t !== null && (t.selected = !0)
  }
}
function Wa(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(L(91))
  return ke({}, t, {
    value: void 0,
    defaultValue: void 0,
    children: '' + e._wrapperState.initialValue,
  })
}
function hd(e, t) {
  var n = t.value
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(L(92))
      if (Yo(n)) {
        if (1 < n.length) throw Error(L(93))
        n = n[0]
      }
      t = n
    }
    ;(t == null && (t = ''), (n = t))
  }
  e._wrapperState = { initialValue: er(n) }
}
function zp(e, t) {
  var n = er(t.value),
    r = er(t.defaultValue)
  ;(n != null &&
    ((n = '' + n),
    n !== e.value && (e.value = n),
    t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = '' + r))
}
function md(e) {
  var t = e.textContent
  t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t)
}
function Fp(e) {
  switch (e) {
    case 'svg':
      return 'http://www.w3.org/2000/svg'
    case 'math':
      return 'http://www.w3.org/1998/Math/MathML'
    default:
      return 'http://www.w3.org/1999/xhtml'
  }
}
function Va(e, t) {
  return e == null || e === 'http://www.w3.org/1999/xhtml'
    ? Fp(t)
    : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
      ? 'http://www.w3.org/1999/xhtml'
      : e
}
var ti,
  $p = (function (e) {
    return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, o) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, o)
          })
        }
      : e
  })(function (e, t) {
    if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t
    else {
      for (
        ti = ti || document.createElement('div'),
          ti.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
          t = ti.firstChild;
        e.firstChild;

      )
        e.removeChild(e.firstChild)
      for (; t.firstChild; ) e.appendChild(t.firstChild)
    }
  })
function as(e, t) {
  if (t) {
    var n = e.firstChild
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t
      return
    }
  }
  e.textContent = t
}
var Xo = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  ev = ['Webkit', 'ms', 'Moz', 'O']
Object.keys(Xo).forEach(function (e) {
  ev.forEach(function (t) {
    ;((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Xo[t] = Xo[e]))
  })
})
function Up(e, t, n) {
  return t == null || typeof t == 'boolean' || t === ''
    ? ''
    : n || typeof t != 'number' || t === 0 || (Xo.hasOwnProperty(e) && Xo[e])
      ? ('' + t).trim()
      : t + 'px'
}
function Bp(e, t) {
  e = e.style
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf('--') === 0,
        o = Up(n, t[n], r)
      ;(n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, o) : (e[n] = o))
    }
}
var tv = ke(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  }
)
function Qa(e, t) {
  if (t) {
    if (tv[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(L(137, e))
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(L(60))
      if (typeof t.dangerouslySetInnerHTML != 'object' || !('__html' in t.dangerouslySetInnerHTML))
        throw Error(L(61))
    }
    if (t.style != null && typeof t.style != 'object') throw Error(L(62))
  }
}
function Ka(e, t) {
  if (e.indexOf('-') === -1) return typeof t.is == 'string'
  switch (e) {
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return !1
    default:
      return !0
  }
}
var Ya = null
function Ju(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  )
}
var Ga = null,
  ro = null,
  oo = null
function gd(e) {
  if ((e = Ds(e))) {
    if (typeof Ga != 'function') throw Error(L(280))
    var t = e.stateNode
    t && ((t = wl(t)), Ga(e.stateNode, e.type, t))
  }
}
function Hp(e) {
  ro ? (oo ? oo.push(e) : (oo = [e])) : (ro = e)
}
function Wp() {
  if (ro) {
    var e = ro,
      t = oo
    if (((oo = ro = null), gd(e), t)) for (e = 0; e < t.length; e++) gd(t[e])
  }
}
function Vp(e, t) {
  return e(t)
}
function Qp() {}
var ea = !1
function Kp(e, t, n) {
  if (ea) return e(t, n)
  ea = !0
  try {
    return Vp(e, t, n)
  } finally {
    ;((ea = !1), (ro !== null || oo !== null) && (Qp(), Wp()))
  }
}
function us(e, t) {
  var n = e.stateNode
  if (n === null) return null
  var r = wl(n)
  if (r === null) return null
  n = r[t]
  e: switch (t) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      ;((r = !r.disabled) ||
        ((e = e.type),
        (r = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
        (e = !r))
      break e
    default:
      e = !1
  }
  if (e) return null
  if (n && typeof n != 'function') throw Error(L(231, t, typeof n))
  return n
}
var qa = !1
if (yn)
  try {
    var zo = {}
    ;(Object.defineProperty(zo, 'passive', {
      get: function () {
        qa = !0
      },
    }),
      window.addEventListener('test', zo, zo),
      window.removeEventListener('test', zo, zo))
  } catch {
    qa = !1
  }
function nv(e, t, n, r, o, s, i, l, a) {
  var u = Array.prototype.slice.call(arguments, 3)
  try {
    t.apply(n, u)
  } catch (d) {
    this.onError(d)
  }
}
var Zo = !1,
  zi = null,
  Fi = !1,
  Xa = null,
  rv = {
    onError: function (e) {
      ;((Zo = !0), (zi = e))
    },
  }
function ov(e, t, n, r, o, s, i, l, a) {
  ;((Zo = !1), (zi = null), nv.apply(rv, arguments))
}
function sv(e, t, n, r, o, s, i, l, a) {
  if ((ov.apply(this, arguments), Zo)) {
    if (Zo) {
      var u = zi
      ;((Zo = !1), (zi = null))
    } else throw Error(L(198))
    Fi || ((Fi = !0), (Xa = u))
  }
}
function Ar(e) {
  var t = e,
    n = e
  if (e.alternate) for (; t.return; ) t = t.return
  else {
    e = t
    do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return))
    while (e)
  }
  return t.tag === 3 ? n : null
}
function Yp(e) {
  if (e.tag === 13) {
    var t = e.memoizedState
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
      return t.dehydrated
  }
  return null
}
function yd(e) {
  if (Ar(e) !== e) throw Error(L(188))
}
function iv(e) {
  var t = e.alternate
  if (!t) {
    if (((t = Ar(e)), t === null)) throw Error(L(188))
    return t !== e ? null : e
  }
  for (var n = e, r = t; ; ) {
    var o = n.return
    if (o === null) break
    var s = o.alternate
    if (s === null) {
      if (((r = o.return), r !== null)) {
        n = r
        continue
      }
      break
    }
    if (o.child === s.child) {
      for (s = o.child; s; ) {
        if (s === n) return (yd(o), e)
        if (s === r) return (yd(o), t)
        s = s.sibling
      }
      throw Error(L(188))
    }
    if (n.return !== r.return) ((n = o), (r = s))
    else {
      for (var i = !1, l = o.child; l; ) {
        if (l === n) {
          ;((i = !0), (n = o), (r = s))
          break
        }
        if (l === r) {
          ;((i = !0), (r = o), (n = s))
          break
        }
        l = l.sibling
      }
      if (!i) {
        for (l = s.child; l; ) {
          if (l === n) {
            ;((i = !0), (n = s), (r = o))
            break
          }
          if (l === r) {
            ;((i = !0), (r = s), (n = o))
            break
          }
          l = l.sibling
        }
        if (!i) throw Error(L(189))
      }
    }
    if (n.alternate !== r) throw Error(L(190))
  }
  if (n.tag !== 3) throw Error(L(188))
  return n.stateNode.current === n ? e : t
}
function Gp(e) {
  return ((e = iv(e)), e !== null ? qp(e) : null)
}
function qp(e) {
  if (e.tag === 5 || e.tag === 6) return e
  for (e = e.child; e !== null; ) {
    var t = qp(e)
    if (t !== null) return t
    e = e.sibling
  }
  return null
}
var Xp = mt.unstable_scheduleCallback,
  vd = mt.unstable_cancelCallback,
  lv = mt.unstable_shouldYield,
  av = mt.unstable_requestPaint,
  Pe = mt.unstable_now,
  uv = mt.unstable_getCurrentPriorityLevel,
  ec = mt.unstable_ImmediatePriority,
  Zp = mt.unstable_UserBlockingPriority,
  $i = mt.unstable_NormalPriority,
  cv = mt.unstable_LowPriority,
  Jp = mt.unstable_IdlePriority,
  gl = null,
  en = null
function dv(e) {
  if (en && typeof en.onCommitFiberRoot == 'function')
    try {
      en.onCommitFiberRoot(gl, e, void 0, (e.current.flags & 128) === 128)
    } catch {}
}
var zt = Math.clz32 ? Math.clz32 : hv,
  fv = Math.log,
  pv = Math.LN2
function hv(e) {
  return ((e >>>= 0), e === 0 ? 32 : (31 - ((fv(e) / pv) | 0)) | 0)
}
var ni = 64,
  ri = 4194304
function Go(e) {
  switch (e & -e) {
    case 1:
      return 1
    case 2:
      return 2
    case 4:
      return 4
    case 8:
      return 8
    case 16:
      return 16
    case 32:
      return 32
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424
    case 134217728:
      return 134217728
    case 268435456:
      return 268435456
    case 536870912:
      return 536870912
    case 1073741824:
      return 1073741824
    default:
      return e
  }
}
function Ui(e, t) {
  var n = e.pendingLanes
  if (n === 0) return 0
  var r = 0,
    o = e.suspendedLanes,
    s = e.pingedLanes,
    i = n & 268435455
  if (i !== 0) {
    var l = i & ~o
    l !== 0 ? (r = Go(l)) : ((s &= i), s !== 0 && (r = Go(s)))
  } else ((i = n & ~o), i !== 0 ? (r = Go(i)) : s !== 0 && (r = Go(s)))
  if (r === 0) return 0
  if (
    t !== 0 &&
    t !== r &&
    !(t & o) &&
    ((o = r & -r), (s = t & -t), o >= s || (o === 16 && (s & 4194240) !== 0))
  )
    return t
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; )
      ((n = 31 - zt(t)), (o = 1 << n), (r |= e[n]), (t &= ~o))
  return r
}
function mv(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1
    default:
      return -1
  }
}
function gv(e, t) {
  for (
    var n = e.suspendedLanes, r = e.pingedLanes, o = e.expirationTimes, s = e.pendingLanes;
    0 < s;

  ) {
    var i = 31 - zt(s),
      l = 1 << i,
      a = o[i]
    ;(a === -1 ? (!(l & n) || l & r) && (o[i] = mv(l, t)) : a <= t && (e.expiredLanes |= l),
      (s &= ~l))
  }
}
function Za(e) {
  return ((e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0)
}
function eh() {
  var e = ni
  return ((ni <<= 1), !(ni & 4194240) && (ni = 64), e)
}
function ta(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e)
  return t
}
function Ls(e, t, n) {
  ;((e.pendingLanes |= t),
    t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
    (e = e.eventTimes),
    (t = 31 - zt(t)),
    (e[t] = n))
}
function yv(e, t) {
  var n = e.pendingLanes & ~t
  ;((e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements))
  var r = e.eventTimes
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - zt(n),
      s = 1 << o
    ;((t[o] = 0), (r[o] = -1), (e[o] = -1), (n &= ~s))
  }
}
function tc(e, t) {
  var n = (e.entangledLanes |= t)
  for (e = e.entanglements; n; ) {
    var r = 31 - zt(n),
      o = 1 << r
    ;((o & t) | (e[r] & t) && (e[r] |= t), (n &= ~o))
  }
}
var de = 0
function th(e) {
  return ((e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1)
}
var nh,
  nc,
  rh,
  oh,
  sh,
  Ja = !1,
  oi = [],
  Vn = null,
  Qn = null,
  Kn = null,
  cs = new Map(),
  ds = new Map(),
  Ln = [],
  vv =
    'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
      ' '
    )
function xd(e, t) {
  switch (e) {
    case 'focusin':
    case 'focusout':
      Vn = null
      break
    case 'dragenter':
    case 'dragleave':
      Qn = null
      break
    case 'mouseover':
    case 'mouseout':
      Kn = null
      break
    case 'pointerover':
    case 'pointerout':
      cs.delete(t.pointerId)
      break
    case 'gotpointercapture':
    case 'lostpointercapture':
      ds.delete(t.pointerId)
  }
}
function Fo(e, t, n, r, o, s) {
  return e === null || e.nativeEvent !== s
    ? ((e = {
        blockedOn: t,
        domEventName: n,
        eventSystemFlags: r,
        nativeEvent: s,
        targetContainers: [o],
      }),
      t !== null && ((t = Ds(t)), t !== null && nc(t)),
      e)
    : ((e.eventSystemFlags |= r),
      (t = e.targetContainers),
      o !== null && t.indexOf(o) === -1 && t.push(o),
      e)
}
function xv(e, t, n, r, o) {
  switch (t) {
    case 'focusin':
      return ((Vn = Fo(Vn, e, t, n, r, o)), !0)
    case 'dragenter':
      return ((Qn = Fo(Qn, e, t, n, r, o)), !0)
    case 'mouseover':
      return ((Kn = Fo(Kn, e, t, n, r, o)), !0)
    case 'pointerover':
      var s = o.pointerId
      return (cs.set(s, Fo(cs.get(s) || null, e, t, n, r, o)), !0)
    case 'gotpointercapture':
      return ((s = o.pointerId), ds.set(s, Fo(ds.get(s) || null, e, t, n, r, o)), !0)
  }
  return !1
}
function ih(e) {
  var t = mr(e.target)
  if (t !== null) {
    var n = Ar(t)
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = Yp(n)), t !== null)) {
          ;((e.blockedOn = t),
            sh(e.priority, function () {
              rh(n)
            }))
          return
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null
        return
      }
    }
  }
  e.blockedOn = null
}
function ki(e) {
  if (e.blockedOn !== null) return !1
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = eu(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent)
    if (n === null) {
      n = e.nativeEvent
      var r = new n.constructor(n.type, n)
      ;((Ya = r), n.target.dispatchEvent(r), (Ya = null))
    } else return ((t = Ds(n)), t !== null && nc(t), (e.blockedOn = n), !1)
    t.shift()
  }
  return !0
}
function wd(e, t, n) {
  ki(e) && n.delete(t)
}
function wv() {
  ;((Ja = !1),
    Vn !== null && ki(Vn) && (Vn = null),
    Qn !== null && ki(Qn) && (Qn = null),
    Kn !== null && ki(Kn) && (Kn = null),
    cs.forEach(wd),
    ds.forEach(wd))
}
function $o(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    Ja || ((Ja = !0), mt.unstable_scheduleCallback(mt.unstable_NormalPriority, wv)))
}
function fs(e) {
  function t(o) {
    return $o(o, e)
  }
  if (0 < oi.length) {
    $o(oi[0], e)
    for (var n = 1; n < oi.length; n++) {
      var r = oi[n]
      r.blockedOn === e && (r.blockedOn = null)
    }
  }
  for (
    Vn !== null && $o(Vn, e),
      Qn !== null && $o(Qn, e),
      Kn !== null && $o(Kn, e),
      cs.forEach(t),
      ds.forEach(t),
      n = 0;
    n < Ln.length;
    n++
  )
    ((r = Ln[n]), r.blockedOn === e && (r.blockedOn = null))
  for (; 0 < Ln.length && ((n = Ln[0]), n.blockedOn === null); )
    (ih(n), n.blockedOn === null && Ln.shift())
}
var so = kn.ReactCurrentBatchConfig,
  Bi = !0
function bv(e, t, n, r) {
  var o = de,
    s = so.transition
  so.transition = null
  try {
    ;((de = 1), rc(e, t, n, r))
  } finally {
    ;((de = o), (so.transition = s))
  }
}
function Sv(e, t, n, r) {
  var o = de,
    s = so.transition
  so.transition = null
  try {
    ;((de = 4), rc(e, t, n, r))
  } finally {
    ;((de = o), (so.transition = s))
  }
}
function rc(e, t, n, r) {
  if (Bi) {
    var o = eu(e, t, n, r)
    if (o === null) (da(e, t, r, Hi, n), xd(e, r))
    else if (xv(o, e, t, n, r)) r.stopPropagation()
    else if ((xd(e, r), t & 4 && -1 < vv.indexOf(e))) {
      for (; o !== null; ) {
        var s = Ds(o)
        if ((s !== null && nh(s), (s = eu(e, t, n, r)), s === null && da(e, t, r, Hi, n), s === o))
          break
        o = s
      }
      o !== null && r.stopPropagation()
    } else da(e, t, r, null, n)
  }
}
var Hi = null
function eu(e, t, n, r) {
  if (((Hi = null), (e = Ju(r)), (e = mr(e)), e !== null))
    if (((t = Ar(e)), t === null)) e = null
    else if (((n = t.tag), n === 13)) {
      if (((e = Yp(t)), e !== null)) return e
      e = null
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null
      e = null
    } else t !== e && (e = null)
  return ((Hi = e), null)
}
function lh(e) {
  switch (e) {
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    case 'beforeblur':
    case 'afterblur':
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return 1
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return 4
    case 'message':
      switch (uv()) {
        case ec:
          return 1
        case Zp:
          return 4
        case $i:
        case cv:
          return 16
        case Jp:
          return 536870912
        default:
          return 16
      }
    default:
      return 16
  }
}
var Bn = null,
  oc = null,
  Ci = null
function ah() {
  if (Ci) return Ci
  var e,
    t = oc,
    n = t.length,
    r,
    o = 'value' in Bn ? Bn.value : Bn.textContent,
    s = o.length
  for (e = 0; e < n && t[e] === o[e]; e++);
  var i = n - e
  for (r = 1; r <= i && t[n - r] === o[s - r]; r++);
  return (Ci = o.slice(e, 1 < r ? 1 - r : void 0))
}
function Ei(e) {
  var t = e.keyCode
  return (
    'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  )
}
function si() {
  return !0
}
function bd() {
  return !1
}
function yt(e) {
  function t(n, r, o, s, i) {
    ;((this._reactName = n),
      (this._targetInst = o),
      (this.type = r),
      (this.nativeEvent = s),
      (this.target = i),
      (this.currentTarget = null))
    for (var l in e) e.hasOwnProperty(l) && ((n = e[l]), (this[l] = n ? n(s) : s[l]))
    return (
      (this.isDefaultPrevented = (
        s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1
      )
        ? si
        : bd),
      (this.isPropagationStopped = bd),
      this
    )
  }
  return (
    ke(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0
        var n = this.nativeEvent
        n &&
          (n.preventDefault
            ? n.preventDefault()
            : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
          (this.isDefaultPrevented = si))
      },
      stopPropagation: function () {
        var n = this.nativeEvent
        n &&
          (n.stopPropagation
            ? n.stopPropagation()
            : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
          (this.isPropagationStopped = si))
      },
      persist: function () {},
      isPersistent: si,
    }),
    t
  )
}
var Ro = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now()
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  sc = yt(Ro),
  Is = ke({}, Ro, { view: 0, detail: 0 }),
  kv = yt(Is),
  na,
  ra,
  Uo,
  yl = ke({}, Is, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: ic,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget
    },
    movementX: function (e) {
      return 'movementX' in e
        ? e.movementX
        : (e !== Uo &&
            (Uo && e.type === 'mousemove'
              ? ((na = e.screenX - Uo.screenX), (ra = e.screenY - Uo.screenY))
              : (ra = na = 0),
            (Uo = e)),
          na)
    },
    movementY: function (e) {
      return 'movementY' in e ? e.movementY : ra
    },
  }),
  Sd = yt(yl),
  Cv = ke({}, yl, { dataTransfer: 0 }),
  Ev = yt(Cv),
  Nv = ke({}, Is, { relatedTarget: 0 }),
  oa = yt(Nv),
  Pv = ke({}, Ro, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  jv = yt(Pv),
  Tv = ke({}, Ro, {
    clipboardData: function (e) {
      return 'clipboardData' in e ? e.clipboardData : window.clipboardData
    },
  }),
  Rv = yt(Tv),
  Mv = ke({}, Ro, { data: 0 }),
  kd = yt(Mv),
  _v = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified',
  },
  Ov = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta',
  },
  Av = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' }
function Lv(e) {
  var t = this.nativeEvent
  return t.getModifierState ? t.getModifierState(e) : (e = Av[e]) ? !!t[e] : !1
}
function ic() {
  return Lv
}
var Iv = ke({}, Is, {
    key: function (e) {
      if (e.key) {
        var t = _v[e.key] || e.key
        if (t !== 'Unidentified') return t
      }
      return e.type === 'keypress'
        ? ((e = Ei(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
        : e.type === 'keydown' || e.type === 'keyup'
          ? Ov[e.keyCode] || 'Unidentified'
          : ''
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: ic,
    charCode: function (e) {
      return e.type === 'keypress' ? Ei(e) : 0
    },
    keyCode: function (e) {
      return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0
    },
    which: function (e) {
      return e.type === 'keypress'
        ? Ei(e)
        : e.type === 'keydown' || e.type === 'keyup'
          ? e.keyCode
          : 0
    },
  }),
  Dv = yt(Iv),
  zv = ke({}, yl, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  Cd = yt(zv),
  Fv = ke({}, Is, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: ic,
  }),
  $v = yt(Fv),
  Uv = ke({}, Ro, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Bv = yt(Uv),
  Hv = ke({}, yl, {
    deltaX: function (e) {
      return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0
    },
    deltaY: function (e) {
      return 'deltaY' in e
        ? e.deltaY
        : 'wheelDeltaY' in e
          ? -e.wheelDeltaY
          : 'wheelDelta' in e
            ? -e.wheelDelta
            : 0
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  Wv = yt(Hv),
  Vv = [9, 13, 27, 32],
  lc = yn && 'CompositionEvent' in window,
  Jo = null
yn && 'documentMode' in document && (Jo = document.documentMode)
var Qv = yn && 'TextEvent' in window && !Jo,
  uh = yn && (!lc || (Jo && 8 < Jo && 11 >= Jo)),
  Ed = ' ',
  Nd = !1
function ch(e, t) {
  switch (e) {
    case 'keyup':
      return Vv.indexOf(t.keyCode) !== -1
    case 'keydown':
      return t.keyCode !== 229
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      return !0
    default:
      return !1
  }
}
function dh(e) {
  return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null)
}
var Vr = !1
function Kv(e, t) {
  switch (e) {
    case 'compositionend':
      return dh(t)
    case 'keypress':
      return t.which !== 32 ? null : ((Nd = !0), Ed)
    case 'textInput':
      return ((e = t.data), e === Ed && Nd ? null : e)
    default:
      return null
  }
}
function Yv(e, t) {
  if (Vr)
    return e === 'compositionend' || (!lc && ch(e, t))
      ? ((e = ah()), (Ci = oc = Bn = null), (Vr = !1), e)
      : null
  switch (e) {
    case 'paste':
      return null
    case 'keypress':
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char
        if (t.which) return String.fromCharCode(t.which)
      }
      return null
    case 'compositionend':
      return uh && t.locale !== 'ko' ? null : t.data
    default:
      return null
  }
}
var Gv = {
  color: !0,
  date: !0,
  datetime: !0,
  'datetime-local': !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
}
function Pd(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return t === 'input' ? !!Gv[e.type] : t === 'textarea'
}
function fh(e, t, n, r) {
  ;(Hp(r),
    (t = Wi(t, 'onChange')),
    0 < t.length &&
      ((n = new sc('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t })))
}
var es = null,
  ps = null
function qv(e) {
  kh(e, 0)
}
function vl(e) {
  var t = Yr(e)
  if (Ip(t)) return e
}
function Xv(e, t) {
  if (e === 'change') return t
}
var ph = !1
if (yn) {
  var sa
  if (yn) {
    var ia = 'oninput' in document
    if (!ia) {
      var jd = document.createElement('div')
      ;(jd.setAttribute('oninput', 'return;'), (ia = typeof jd.oninput == 'function'))
    }
    sa = ia
  } else sa = !1
  ph = sa && (!document.documentMode || 9 < document.documentMode)
}
function Td() {
  es && (es.detachEvent('onpropertychange', hh), (ps = es = null))
}
function hh(e) {
  if (e.propertyName === 'value' && vl(ps)) {
    var t = []
    ;(fh(t, ps, e, Ju(e)), Kp(qv, t))
  }
}
function Zv(e, t, n) {
  e === 'focusin'
    ? (Td(), (es = t), (ps = n), es.attachEvent('onpropertychange', hh))
    : e === 'focusout' && Td()
}
function Jv(e) {
  if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return vl(ps)
}
function e0(e, t) {
  if (e === 'click') return vl(t)
}
function t0(e, t) {
  if (e === 'input' || e === 'change') return vl(t)
}
function n0(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t)
}
var $t = typeof Object.is == 'function' ? Object.is : n0
function hs(e, t) {
  if ($t(e, t)) return !0
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1
  var n = Object.keys(e),
    r = Object.keys(t)
  if (n.length !== r.length) return !1
  for (r = 0; r < n.length; r++) {
    var o = n[r]
    if (!Ia.call(t, o) || !$t(e[o], t[o])) return !1
  }
  return !0
}
function Rd(e) {
  for (; e && e.firstChild; ) e = e.firstChild
  return e
}
function Md(e, t) {
  var n = Rd(e)
  e = 0
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e }
      e = r
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling
          break e
        }
        n = n.parentNode
      }
      n = void 0
    }
    n = Rd(n)
  }
}
function mh(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
          ? mh(e, t.parentNode)
          : 'contains' in e
            ? e.contains(t)
            : e.compareDocumentPosition
              ? !!(e.compareDocumentPosition(t) & 16)
              : !1
    : !1
}
function gh() {
  for (var e = window, t = Di(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == 'string'
    } catch {
      n = !1
    }
    if (n) e = t.contentWindow
    else break
    t = Di(e.document)
  }
  return t
}
function ac(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return (
    t &&
    ((t === 'input' &&
      (e.type === 'text' ||
        e.type === 'search' ||
        e.type === 'tel' ||
        e.type === 'url' ||
        e.type === 'password')) ||
      t === 'textarea' ||
      e.contentEditable === 'true')
  )
}
function r0(e) {
  var t = gh(),
    n = e.focusedElem,
    r = e.selectionRange
  if (t !== n && n && n.ownerDocument && mh(n.ownerDocument.documentElement, n)) {
    if (r !== null && ac(n)) {
      if (((t = r.start), (e = r.end), e === void 0 && (e = t), 'selectionStart' in n))
        ((n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length)))
      else if (
        ((e = ((t = n.ownerDocument || document) && t.defaultView) || window), e.getSelection)
      ) {
        e = e.getSelection()
        var o = n.textContent.length,
          s = Math.min(r.start, o)
        ;((r = r.end === void 0 ? s : Math.min(r.end, o)),
          !e.extend && s > r && ((o = r), (r = s), (s = o)),
          (o = Md(n, s)))
        var i = Md(n, r)
        o &&
          i &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== o.node ||
            e.anchorOffset !== o.offset ||
            e.focusNode !== i.node ||
            e.focusOffset !== i.offset) &&
          ((t = t.createRange()),
          t.setStart(o.node, o.offset),
          e.removeAllRanges(),
          s > r
            ? (e.addRange(t), e.extend(i.node, i.offset))
            : (t.setEnd(i.node, i.offset), e.addRange(t)))
      }
    }
    for (t = [], e = n; (e = e.parentNode); )
      e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop })
    for (typeof n.focus == 'function' && n.focus(), n = 0; n < t.length; n++)
      ((e = t[n]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top))
  }
}
var o0 = yn && 'documentMode' in document && 11 >= document.documentMode,
  Qr = null,
  tu = null,
  ts = null,
  nu = !1
function _d(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument
  nu ||
    Qr == null ||
    Qr !== Di(r) ||
    ((r = Qr),
    'selectionStart' in r && ac(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
        (r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        })),
    (ts && hs(ts, r)) ||
      ((ts = r),
      (r = Wi(tu, 'onSelect')),
      0 < r.length &&
        ((t = new sc('onSelect', 'select', null, t, n)),
        e.push({ event: t, listeners: r }),
        (t.target = Qr))))
}
function ii(e, t) {
  var n = {}
  return (
    (n[e.toLowerCase()] = t.toLowerCase()),
    (n['Webkit' + e] = 'webkit' + t),
    (n['Moz' + e] = 'moz' + t),
    n
  )
}
var Kr = {
    animationend: ii('Animation', 'AnimationEnd'),
    animationiteration: ii('Animation', 'AnimationIteration'),
    animationstart: ii('Animation', 'AnimationStart'),
    transitionend: ii('Transition', 'TransitionEnd'),
  },
  la = {},
  yh = {}
yn &&
  ((yh = document.createElement('div').style),
  'AnimationEvent' in window ||
    (delete Kr.animationend.animation,
    delete Kr.animationiteration.animation,
    delete Kr.animationstart.animation),
  'TransitionEvent' in window || delete Kr.transitionend.transition)
function xl(e) {
  if (la[e]) return la[e]
  if (!Kr[e]) return e
  var t = Kr[e],
    n
  for (n in t) if (t.hasOwnProperty(n) && n in yh) return (la[e] = t[n])
  return e
}
var vh = xl('animationend'),
  xh = xl('animationiteration'),
  wh = xl('animationstart'),
  bh = xl('transitionend'),
  Sh = new Map(),
  Od =
    'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
      ' '
    )
function ir(e, t) {
  ;(Sh.set(e, t), Or(t, [e]))
}
for (var aa = 0; aa < Od.length; aa++) {
  var ua = Od[aa],
    s0 = ua.toLowerCase(),
    i0 = ua[0].toUpperCase() + ua.slice(1)
  ir(s0, 'on' + i0)
}
ir(vh, 'onAnimationEnd')
ir(xh, 'onAnimationIteration')
ir(wh, 'onAnimationStart')
ir('dblclick', 'onDoubleClick')
ir('focusin', 'onFocus')
ir('focusout', 'onBlur')
ir(bh, 'onTransitionEnd')
xo('onMouseEnter', ['mouseout', 'mouseover'])
xo('onMouseLeave', ['mouseout', 'mouseover'])
xo('onPointerEnter', ['pointerout', 'pointerover'])
xo('onPointerLeave', ['pointerout', 'pointerover'])
Or('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '))
Or(
  'onSelect',
  'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' ')
)
Or('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste'])
Or('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '))
Or('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '))
Or('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '))
var qo =
    'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
      ' '
    ),
  l0 = new Set('cancel close invalid load scroll toggle'.split(' ').concat(qo))
function Ad(e, t, n) {
  var r = e.type || 'unknown-event'
  ;((e.currentTarget = n), sv(r, t, void 0, e), (e.currentTarget = null))
}
function kh(e, t) {
  t = (t & 4) !== 0
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      o = r.event
    r = r.listeners
    e: {
      var s = void 0
      if (t)
        for (var i = r.length - 1; 0 <= i; i--) {
          var l = r[i],
            a = l.instance,
            u = l.currentTarget
          if (((l = l.listener), a !== s && o.isPropagationStopped())) break e
          ;(Ad(o, l, u), (s = a))
        }
      else
        for (i = 0; i < r.length; i++) {
          if (
            ((l = r[i]),
            (a = l.instance),
            (u = l.currentTarget),
            (l = l.listener),
            a !== s && o.isPropagationStopped())
          )
            break e
          ;(Ad(o, l, u), (s = a))
        }
    }
  }
  if (Fi) throw ((e = Xa), (Fi = !1), (Xa = null), e)
}
function ge(e, t) {
  var n = t[lu]
  n === void 0 && (n = t[lu] = new Set())
  var r = e + '__bubble'
  n.has(r) || (Ch(t, e, 2, !1), n.add(r))
}
function ca(e, t, n) {
  var r = 0
  ;(t && (r |= 4), Ch(n, e, r, t))
}
var li = '_reactListening' + Math.random().toString(36).slice(2)
function ms(e) {
  if (!e[li]) {
    ;((e[li] = !0),
      Mp.forEach(function (n) {
        n !== 'selectionchange' && (l0.has(n) || ca(n, !1, e), ca(n, !0, e))
      }))
    var t = e.nodeType === 9 ? e : e.ownerDocument
    t === null || t[li] || ((t[li] = !0), ca('selectionchange', !1, t))
  }
}
function Ch(e, t, n, r) {
  switch (lh(t)) {
    case 1:
      var o = bv
      break
    case 4:
      o = Sv
      break
    default:
      o = rc
  }
  ;((n = o.bind(null, t, n, e)),
    (o = void 0),
    !qa || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (o = !0),
    r
      ? o !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: o })
        : e.addEventListener(t, n, !0)
      : o !== void 0
        ? e.addEventListener(t, n, { passive: o })
        : e.addEventListener(t, n, !1))
}
function da(e, t, n, r, o) {
  var s = r
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return
      var i = r.tag
      if (i === 3 || i === 4) {
        var l = r.stateNode.containerInfo
        if (l === o || (l.nodeType === 8 && l.parentNode === o)) break
        if (i === 4)
          for (i = r.return; i !== null; ) {
            var a = i.tag
            if (
              (a === 3 || a === 4) &&
              ((a = i.stateNode.containerInfo), a === o || (a.nodeType === 8 && a.parentNode === o))
            )
              return
            i = i.return
          }
        for (; l !== null; ) {
          if (((i = mr(l)), i === null)) return
          if (((a = i.tag), a === 5 || a === 6)) {
            r = s = i
            continue e
          }
          l = l.parentNode
        }
      }
      r = r.return
    }
  Kp(function () {
    var u = s,
      d = Ju(n),
      f = []
    e: {
      var g = Sh.get(e)
      if (g !== void 0) {
        var p = sc,
          b = e
        switch (e) {
          case 'keypress':
            if (Ei(n) === 0) break e
          case 'keydown':
          case 'keyup':
            p = Dv
            break
          case 'focusin':
            ;((b = 'focus'), (p = oa))
            break
          case 'focusout':
            ;((b = 'blur'), (p = oa))
            break
          case 'beforeblur':
          case 'afterblur':
            p = oa
            break
          case 'click':
            if (n.button === 2) break e
          case 'auxclick':
          case 'dblclick':
          case 'mousedown':
          case 'mousemove':
          case 'mouseup':
          case 'mouseout':
          case 'mouseover':
          case 'contextmenu':
            p = Sd
            break
          case 'drag':
          case 'dragend':
          case 'dragenter':
          case 'dragexit':
          case 'dragleave':
          case 'dragover':
          case 'dragstart':
          case 'drop':
            p = Ev
            break
          case 'touchcancel':
          case 'touchend':
          case 'touchmove':
          case 'touchstart':
            p = $v
            break
          case vh:
          case xh:
          case wh:
            p = jv
            break
          case bh:
            p = Bv
            break
          case 'scroll':
            p = kv
            break
          case 'wheel':
            p = Wv
            break
          case 'copy':
          case 'cut':
          case 'paste':
            p = Rv
            break
          case 'gotpointercapture':
          case 'lostpointercapture':
          case 'pointercancel':
          case 'pointerdown':
          case 'pointermove':
          case 'pointerout':
          case 'pointerover':
          case 'pointerup':
            p = Cd
        }
        var x = (t & 4) !== 0,
          w = !x && e === 'scroll',
          m = x ? (g !== null ? g + 'Capture' : null) : g
        x = []
        for (var h = u, v; h !== null; ) {
          v = h
          var k = v.stateNode
          if (
            (v.tag === 5 &&
              k !== null &&
              ((v = k), m !== null && ((k = us(h, m)), k != null && x.push(gs(h, k, v)))),
            w)
          )
            break
          h = h.return
        }
        0 < x.length && ((g = new p(g, b, null, n, d)), f.push({ event: g, listeners: x }))
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((g = e === 'mouseover' || e === 'pointerover'),
          (p = e === 'mouseout' || e === 'pointerout'),
          g && n !== Ya && (b = n.relatedTarget || n.fromElement) && (mr(b) || b[vn]))
        )
          break e
        if (
          (p || g) &&
          ((g =
            d.window === d ? d : (g = d.ownerDocument) ? g.defaultView || g.parentWindow : window),
          p
            ? ((b = n.relatedTarget || n.toElement),
              (p = u),
              (b = b ? mr(b) : null),
              b !== null && ((w = Ar(b)), b !== w || (b.tag !== 5 && b.tag !== 6)) && (b = null))
            : ((p = null), (b = u)),
          p !== b)
        ) {
          if (
            ((x = Sd),
            (k = 'onMouseLeave'),
            (m = 'onMouseEnter'),
            (h = 'mouse'),
            (e === 'pointerout' || e === 'pointerover') &&
              ((x = Cd), (k = 'onPointerLeave'), (m = 'onPointerEnter'), (h = 'pointer')),
            (w = p == null ? g : Yr(p)),
            (v = b == null ? g : Yr(b)),
            (g = new x(k, h + 'leave', p, n, d)),
            (g.target = w),
            (g.relatedTarget = v),
            (k = null),
            mr(d) === u &&
              ((x = new x(m, h + 'enter', b, n, d)),
              (x.target = v),
              (x.relatedTarget = w),
              (k = x)),
            (w = k),
            p && b)
          )
            t: {
              for (x = p, m = b, h = 0, v = x; v; v = Br(v)) h++
              for (v = 0, k = m; k; k = Br(k)) v++
              for (; 0 < h - v; ) ((x = Br(x)), h--)
              for (; 0 < v - h; ) ((m = Br(m)), v--)
              for (; h--; ) {
                if (x === m || (m !== null && x === m.alternate)) break t
                ;((x = Br(x)), (m = Br(m)))
              }
              x = null
            }
          else x = null
          ;(p !== null && Ld(f, g, p, x, !1), b !== null && w !== null && Ld(f, w, b, x, !0))
        }
      }
      e: {
        if (
          ((g = u ? Yr(u) : window),
          (p = g.nodeName && g.nodeName.toLowerCase()),
          p === 'select' || (p === 'input' && g.type === 'file'))
        )
          var N = Xv
        else if (Pd(g))
          if (ph) N = t0
          else {
            N = Jv
            var j = Zv
          }
        else
          (p = g.nodeName) &&
            p.toLowerCase() === 'input' &&
            (g.type === 'checkbox' || g.type === 'radio') &&
            (N = e0)
        if (N && (N = N(e, u))) {
          fh(f, N, n, d)
          break e
        }
        ;(j && j(e, g, u),
          e === 'focusout' &&
            (j = g._wrapperState) &&
            j.controlled &&
            g.type === 'number' &&
            Ha(g, 'number', g.value))
      }
      switch (((j = u ? Yr(u) : window), e)) {
        case 'focusin':
          ;(Pd(j) || j.contentEditable === 'true') && ((Qr = j), (tu = u), (ts = null))
          break
        case 'focusout':
          ts = tu = Qr = null
          break
        case 'mousedown':
          nu = !0
          break
        case 'contextmenu':
        case 'mouseup':
        case 'dragend':
          ;((nu = !1), _d(f, n, d))
          break
        case 'selectionchange':
          if (o0) break
        case 'keydown':
        case 'keyup':
          _d(f, n, d)
      }
      var P
      if (lc)
        e: {
          switch (e) {
            case 'compositionstart':
              var T = 'onCompositionStart'
              break e
            case 'compositionend':
              T = 'onCompositionEnd'
              break e
            case 'compositionupdate':
              T = 'onCompositionUpdate'
              break e
          }
          T = void 0
        }
      else
        Vr
          ? ch(e, n) && (T = 'onCompositionEnd')
          : e === 'keydown' && n.keyCode === 229 && (T = 'onCompositionStart')
      ;(T &&
        (uh &&
          n.locale !== 'ko' &&
          (Vr || T !== 'onCompositionStart'
            ? T === 'onCompositionEnd' && Vr && (P = ah())
            : ((Bn = d), (oc = 'value' in Bn ? Bn.value : Bn.textContent), (Vr = !0))),
        (j = Wi(u, T)),
        0 < j.length &&
          ((T = new kd(T, e, null, n, d)),
          f.push({ event: T, listeners: j }),
          P ? (T.data = P) : ((P = dh(n)), P !== null && (T.data = P)))),
        (P = Qv ? Kv(e, n) : Yv(e, n)) &&
          ((u = Wi(u, 'onBeforeInput')),
          0 < u.length &&
            ((d = new kd('onBeforeInput', 'beforeinput', null, n, d)),
            f.push({ event: d, listeners: u }),
            (d.data = P))))
    }
    kh(f, t)
  })
}
function gs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n }
}
function Wi(e, t) {
  for (var n = t + 'Capture', r = []; e !== null; ) {
    var o = e,
      s = o.stateNode
    ;(o.tag === 5 &&
      s !== null &&
      ((o = s),
      (s = us(e, n)),
      s != null && r.unshift(gs(e, s, o)),
      (s = us(e, t)),
      s != null && r.push(gs(e, s, o))),
      (e = e.return))
  }
  return r
}
function Br(e) {
  if (e === null) return null
  do e = e.return
  while (e && e.tag !== 5)
  return e || null
}
function Ld(e, t, n, r, o) {
  for (var s = t._reactName, i = []; n !== null && n !== r; ) {
    var l = n,
      a = l.alternate,
      u = l.stateNode
    if (a !== null && a === r) break
    ;(l.tag === 5 &&
      u !== null &&
      ((l = u),
      o
        ? ((a = us(n, s)), a != null && i.unshift(gs(n, a, l)))
        : o || ((a = us(n, s)), a != null && i.push(gs(n, a, l)))),
      (n = n.return))
  }
  i.length !== 0 && e.push({ event: t, listeners: i })
}
var a0 = /\r\n?/g,
  u0 = /\u0000|\uFFFD/g
function Id(e) {
  return (typeof e == 'string' ? e : '' + e)
    .replace(
      a0,
      `
`
    )
    .replace(u0, '')
}
function ai(e, t, n) {
  if (((t = Id(t)), Id(e) !== t && n)) throw Error(L(425))
}
function Vi() {}
var ru = null,
  ou = null
function su(e, t) {
  return (
    e === 'textarea' ||
    e === 'noscript' ||
    typeof t.children == 'string' ||
    typeof t.children == 'number' ||
    (typeof t.dangerouslySetInnerHTML == 'object' &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  )
}
var iu = typeof setTimeout == 'function' ? setTimeout : void 0,
  c0 = typeof clearTimeout == 'function' ? clearTimeout : void 0,
  Dd = typeof Promise == 'function' ? Promise : void 0,
  d0 =
    typeof queueMicrotask == 'function'
      ? queueMicrotask
      : typeof Dd < 'u'
        ? function (e) {
            return Dd.resolve(null).then(e).catch(f0)
          }
        : iu
function f0(e) {
  setTimeout(function () {
    throw e
  })
}
function fa(e, t) {
  var n = t,
    r = 0
  do {
    var o = n.nextSibling
    if ((e.removeChild(n), o && o.nodeType === 8))
      if (((n = o.data), n === '/$')) {
        if (r === 0) {
          ;(e.removeChild(o), fs(t))
          return
        }
        r--
      } else (n !== '$' && n !== '$?' && n !== '$!') || r++
    n = o
  } while (n)
  fs(t)
}
function Yn(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType
    if (t === 1 || t === 3) break
    if (t === 8) {
      if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break
      if (t === '/$') return null
    }
  }
  return e
}
function zd(e) {
  e = e.previousSibling
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data
      if (n === '$' || n === '$!' || n === '$?') {
        if (t === 0) return e
        t--
      } else n === '/$' && t++
    }
    e = e.previousSibling
  }
  return null
}
var Mo = Math.random().toString(36).slice(2),
  Zt = '__reactFiber$' + Mo,
  ys = '__reactProps$' + Mo,
  vn = '__reactContainer$' + Mo,
  lu = '__reactEvents$' + Mo,
  p0 = '__reactListeners$' + Mo,
  h0 = '__reactHandles$' + Mo
function mr(e) {
  var t = e[Zt]
  if (t) return t
  for (var n = e.parentNode; n; ) {
    if ((t = n[vn] || n[Zt])) {
      if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
        for (e = zd(e); e !== null; ) {
          if ((n = e[Zt])) return n
          e = zd(e)
        }
      return t
    }
    ;((e = n), (n = e.parentNode))
  }
  return null
}
function Ds(e) {
  return (
    (e = e[Zt] || e[vn]),
    !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
  )
}
function Yr(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode
  throw Error(L(33))
}
function wl(e) {
  return e[ys] || null
}
var au = [],
  Gr = -1
function lr(e) {
  return { current: e }
}
function ye(e) {
  0 > Gr || ((e.current = au[Gr]), (au[Gr] = null), Gr--)
}
function he(e, t) {
  ;(Gr++, (au[Gr] = e.current), (e.current = t))
}
var tr = {},
  Qe = lr(tr),
  ot = lr(!1),
  Pr = tr
function wo(e, t) {
  var n = e.type.contextTypes
  if (!n) return tr
  var r = e.stateNode
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext
  var o = {},
    s
  for (s in n) o[s] = t[s]
  return (
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = t),
      (e.__reactInternalMemoizedMaskedChildContext = o)),
    o
  )
}
function st(e) {
  return ((e = e.childContextTypes), e != null)
}
function Qi() {
  ;(ye(ot), ye(Qe))
}
function Fd(e, t, n) {
  if (Qe.current !== tr) throw Error(L(168))
  ;(he(Qe, t), he(ot, n))
}
function Eh(e, t, n) {
  var r = e.stateNode
  if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n
  r = r.getChildContext()
  for (var o in r) if (!(o in t)) throw Error(L(108, Zy(e) || 'Unknown', o))
  return ke({}, n, r)
}
function Ki(e) {
  return (
    (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || tr),
    (Pr = Qe.current),
    he(Qe, e),
    he(ot, ot.current),
    !0
  )
}
function $d(e, t, n) {
  var r = e.stateNode
  if (!r) throw Error(L(169))
  ;(n
    ? ((e = Eh(e, t, Pr)),
      (r.__reactInternalMemoizedMergedChildContext = e),
      ye(ot),
      ye(Qe),
      he(Qe, e))
    : ye(ot),
    he(ot, n))
}
var fn = null,
  bl = !1,
  pa = !1
function Nh(e) {
  fn === null ? (fn = [e]) : fn.push(e)
}
function m0(e) {
  ;((bl = !0), Nh(e))
}
function ar() {
  if (!pa && fn !== null) {
    pa = !0
    var e = 0,
      t = de
    try {
      var n = fn
      for (de = 1; e < n.length; e++) {
        var r = n[e]
        do r = r(!0)
        while (r !== null)
      }
      ;((fn = null), (bl = !1))
    } catch (o) {
      throw (fn !== null && (fn = fn.slice(e + 1)), Xp(ec, ar), o)
    } finally {
      ;((de = t), (pa = !1))
    }
  }
  return null
}
var qr = [],
  Xr = 0,
  Yi = null,
  Gi = 0,
  xt = [],
  wt = 0,
  jr = null,
  hn = 1,
  mn = ''
function pr(e, t) {
  ;((qr[Xr++] = Gi), (qr[Xr++] = Yi), (Yi = e), (Gi = t))
}
function Ph(e, t, n) {
  ;((xt[wt++] = hn), (xt[wt++] = mn), (xt[wt++] = jr), (jr = e))
  var r = hn
  e = mn
  var o = 32 - zt(r) - 1
  ;((r &= ~(1 << o)), (n += 1))
  var s = 32 - zt(t) + o
  if (30 < s) {
    var i = o - (o % 5)
    ;((s = (r & ((1 << i) - 1)).toString(32)),
      (r >>= i),
      (o -= i),
      (hn = (1 << (32 - zt(t) + o)) | (n << o) | r),
      (mn = s + e))
  } else ((hn = (1 << s) | (n << o) | r), (mn = e))
}
function uc(e) {
  e.return !== null && (pr(e, 1), Ph(e, 1, 0))
}
function cc(e) {
  for (; e === Yi; ) ((Yi = qr[--Xr]), (qr[Xr] = null), (Gi = qr[--Xr]), (qr[Xr] = null))
  for (; e === jr; )
    ((jr = xt[--wt]),
      (xt[wt] = null),
      (mn = xt[--wt]),
      (xt[wt] = null),
      (hn = xt[--wt]),
      (xt[wt] = null))
}
var pt = null,
  ft = null,
  xe = !1,
  It = null
function jh(e, t) {
  var n = bt(5, null, null, 0)
  ;((n.elementType = 'DELETED'),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n))
}
function Ud(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type
      return (
        (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
        t !== null ? ((e.stateNode = t), (pt = e), (ft = Yn(t.firstChild)), !0) : !1
      )
    case 6:
      return (
        (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
        t !== null ? ((e.stateNode = t), (pt = e), (ft = null), !0) : !1
      )
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = jr !== null ? { id: hn, overflow: mn } : null),
            (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
            (n = bt(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (pt = e),
            (ft = null),
            !0)
          : !1
      )
    default:
      return !1
  }
}
function uu(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0
}
function cu(e) {
  if (xe) {
    var t = ft
    if (t) {
      var n = t
      if (!Ud(e, t)) {
        if (uu(e)) throw Error(L(418))
        t = Yn(n.nextSibling)
        var r = pt
        t && Ud(e, t) ? jh(r, n) : ((e.flags = (e.flags & -4097) | 2), (xe = !1), (pt = e))
      }
    } else {
      if (uu(e)) throw Error(L(418))
      ;((e.flags = (e.flags & -4097) | 2), (xe = !1), (pt = e))
    }
  }
}
function Bd(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return
  pt = e
}
function ui(e) {
  if (e !== pt) return !1
  if (!xe) return (Bd(e), (xe = !0), !1)
  var t
  if (
    ((t = e.tag !== 3) &&
      !(t = e.tag !== 5) &&
      ((t = e.type), (t = t !== 'head' && t !== 'body' && !su(e.type, e.memoizedProps))),
    t && (t = ft))
  ) {
    if (uu(e)) throw (Th(), Error(L(418)))
    for (; t; ) (jh(e, t), (t = Yn(t.nextSibling)))
  }
  if ((Bd(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(L(317))
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data
          if (n === '/$') {
            if (t === 0) {
              ft = Yn(e.nextSibling)
              break e
            }
            t--
          } else (n !== '$' && n !== '$!' && n !== '$?') || t++
        }
        e = e.nextSibling
      }
      ft = null
    }
  } else ft = pt ? Yn(e.stateNode.nextSibling) : null
  return !0
}
function Th() {
  for (var e = ft; e; ) e = Yn(e.nextSibling)
}
function bo() {
  ;((ft = pt = null), (xe = !1))
}
function dc(e) {
  It === null ? (It = [e]) : It.push(e)
}
var g0 = kn.ReactCurrentBatchConfig
function Bo(e, t, n) {
  if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(L(309))
        var r = n.stateNode
      }
      if (!r) throw Error(L(147, e))
      var o = r,
        s = '' + e
      return t !== null && t.ref !== null && typeof t.ref == 'function' && t.ref._stringRef === s
        ? t.ref
        : ((t = function (i) {
            var l = o.refs
            i === null ? delete l[s] : (l[s] = i)
          }),
          (t._stringRef = s),
          t)
    }
    if (typeof e != 'string') throw Error(L(284))
    if (!n._owner) throw Error(L(290, e))
  }
  return e
}
function ci(e, t) {
  throw (
    (e = Object.prototype.toString.call(t)),
    Error(
      L(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e)
    )
  )
}
function Hd(e) {
  var t = e._init
  return t(e._payload)
}
function Rh(e) {
  function t(m, h) {
    if (e) {
      var v = m.deletions
      v === null ? ((m.deletions = [h]), (m.flags |= 16)) : v.push(h)
    }
  }
  function n(m, h) {
    if (!e) return null
    for (; h !== null; ) (t(m, h), (h = h.sibling))
    return null
  }
  function r(m, h) {
    for (m = new Map(); h !== null; )
      (h.key !== null ? m.set(h.key, h) : m.set(h.index, h), (h = h.sibling))
    return m
  }
  function o(m, h) {
    return ((m = Zn(m, h)), (m.index = 0), (m.sibling = null), m)
  }
  function s(m, h, v) {
    return (
      (m.index = v),
      e
        ? ((v = m.alternate),
          v !== null ? ((v = v.index), v < h ? ((m.flags |= 2), h) : v) : ((m.flags |= 2), h))
        : ((m.flags |= 1048576), h)
    )
  }
  function i(m) {
    return (e && m.alternate === null && (m.flags |= 2), m)
  }
  function l(m, h, v, k) {
    return h === null || h.tag !== 6
      ? ((h = wa(v, m.mode, k)), (h.return = m), h)
      : ((h = o(h, v)), (h.return = m), h)
  }
  function a(m, h, v, k) {
    var N = v.type
    return N === Wr
      ? d(m, h, v.props.children, k, v.key)
      : h !== null &&
          (h.elementType === N ||
            (typeof N == 'object' && N !== null && N.$$typeof === On && Hd(N) === h.type))
        ? ((k = o(h, v.props)), (k.ref = Bo(m, h, v)), (k.return = m), k)
        : ((k = _i(v.type, v.key, v.props, null, m.mode, k)),
          (k.ref = Bo(m, h, v)),
          (k.return = m),
          k)
  }
  function u(m, h, v, k) {
    return h === null ||
      h.tag !== 4 ||
      h.stateNode.containerInfo !== v.containerInfo ||
      h.stateNode.implementation !== v.implementation
      ? ((h = ba(v, m.mode, k)), (h.return = m), h)
      : ((h = o(h, v.children || [])), (h.return = m), h)
  }
  function d(m, h, v, k, N) {
    return h === null || h.tag !== 7
      ? ((h = Nr(v, m.mode, k, N)), (h.return = m), h)
      : ((h = o(h, v)), (h.return = m), h)
  }
  function f(m, h, v) {
    if ((typeof h == 'string' && h !== '') || typeof h == 'number')
      return ((h = wa('' + h, m.mode, v)), (h.return = m), h)
    if (typeof h == 'object' && h !== null) {
      switch (h.$$typeof) {
        case Js:
          return (
            (v = _i(h.type, h.key, h.props, null, m.mode, v)),
            (v.ref = Bo(m, null, h)),
            (v.return = m),
            v
          )
        case Hr:
          return ((h = ba(h, m.mode, v)), (h.return = m), h)
        case On:
          var k = h._init
          return f(m, k(h._payload), v)
      }
      if (Yo(h) || Do(h)) return ((h = Nr(h, m.mode, v, null)), (h.return = m), h)
      ci(m, h)
    }
    return null
  }
  function g(m, h, v, k) {
    var N = h !== null ? h.key : null
    if ((typeof v == 'string' && v !== '') || typeof v == 'number')
      return N !== null ? null : l(m, h, '' + v, k)
    if (typeof v == 'object' && v !== null) {
      switch (v.$$typeof) {
        case Js:
          return v.key === N ? a(m, h, v, k) : null
        case Hr:
          return v.key === N ? u(m, h, v, k) : null
        case On:
          return ((N = v._init), g(m, h, N(v._payload), k))
      }
      if (Yo(v) || Do(v)) return N !== null ? null : d(m, h, v, k, null)
      ci(m, v)
    }
    return null
  }
  function p(m, h, v, k, N) {
    if ((typeof k == 'string' && k !== '') || typeof k == 'number')
      return ((m = m.get(v) || null), l(h, m, '' + k, N))
    if (typeof k == 'object' && k !== null) {
      switch (k.$$typeof) {
        case Js:
          return ((m = m.get(k.key === null ? v : k.key) || null), a(h, m, k, N))
        case Hr:
          return ((m = m.get(k.key === null ? v : k.key) || null), u(h, m, k, N))
        case On:
          var j = k._init
          return p(m, h, v, j(k._payload), N)
      }
      if (Yo(k) || Do(k)) return ((m = m.get(v) || null), d(h, m, k, N, null))
      ci(h, k)
    }
    return null
  }
  function b(m, h, v, k) {
    for (var N = null, j = null, P = h, T = (h = 0), I = null; P !== null && T < v.length; T++) {
      P.index > T ? ((I = P), (P = null)) : (I = P.sibling)
      var D = g(m, P, v[T], k)
      if (D === null) {
        P === null && (P = I)
        break
      }
      ;(e && P && D.alternate === null && t(m, P),
        (h = s(D, h, T)),
        j === null ? (N = D) : (j.sibling = D),
        (j = D),
        (P = I))
    }
    if (T === v.length) return (n(m, P), xe && pr(m, T), N)
    if (P === null) {
      for (; T < v.length; T++)
        ((P = f(m, v[T], k)),
          P !== null && ((h = s(P, h, T)), j === null ? (N = P) : (j.sibling = P), (j = P)))
      return (xe && pr(m, T), N)
    }
    for (P = r(m, P); T < v.length; T++)
      ((I = p(P, m, T, v[T], k)),
        I !== null &&
          (e && I.alternate !== null && P.delete(I.key === null ? T : I.key),
          (h = s(I, h, T)),
          j === null ? (N = I) : (j.sibling = I),
          (j = I)))
    return (
      e &&
        P.forEach(function (Q) {
          return t(m, Q)
        }),
      xe && pr(m, T),
      N
    )
  }
  function x(m, h, v, k) {
    var N = Do(v)
    if (typeof N != 'function') throw Error(L(150))
    if (((v = N.call(v)), v == null)) throw Error(L(151))
    for (
      var j = (N = null), P = h, T = (h = 0), I = null, D = v.next();
      P !== null && !D.done;
      T++, D = v.next()
    ) {
      P.index > T ? ((I = P), (P = null)) : (I = P.sibling)
      var Q = g(m, P, D.value, k)
      if (Q === null) {
        P === null && (P = I)
        break
      }
      ;(e && P && Q.alternate === null && t(m, P),
        (h = s(Q, h, T)),
        j === null ? (N = Q) : (j.sibling = Q),
        (j = Q),
        (P = I))
    }
    if (D.done) return (n(m, P), xe && pr(m, T), N)
    if (P === null) {
      for (; !D.done; T++, D = v.next())
        ((D = f(m, D.value, k)),
          D !== null && ((h = s(D, h, T)), j === null ? (N = D) : (j.sibling = D), (j = D)))
      return (xe && pr(m, T), N)
    }
    for (P = r(m, P); !D.done; T++, D = v.next())
      ((D = p(P, m, T, D.value, k)),
        D !== null &&
          (e && D.alternate !== null && P.delete(D.key === null ? T : D.key),
          (h = s(D, h, T)),
          j === null ? (N = D) : (j.sibling = D),
          (j = D)))
    return (
      e &&
        P.forEach(function (U) {
          return t(m, U)
        }),
      xe && pr(m, T),
      N
    )
  }
  function w(m, h, v, k) {
    if (
      (typeof v == 'object' &&
        v !== null &&
        v.type === Wr &&
        v.key === null &&
        (v = v.props.children),
      typeof v == 'object' && v !== null)
    ) {
      switch (v.$$typeof) {
        case Js:
          e: {
            for (var N = v.key, j = h; j !== null; ) {
              if (j.key === N) {
                if (((N = v.type), N === Wr)) {
                  if (j.tag === 7) {
                    ;(n(m, j.sibling), (h = o(j, v.props.children)), (h.return = m), (m = h))
                    break e
                  }
                } else if (
                  j.elementType === N ||
                  (typeof N == 'object' && N !== null && N.$$typeof === On && Hd(N) === j.type)
                ) {
                  ;(n(m, j.sibling),
                    (h = o(j, v.props)),
                    (h.ref = Bo(m, j, v)),
                    (h.return = m),
                    (m = h))
                  break e
                }
                n(m, j)
                break
              } else t(m, j)
              j = j.sibling
            }
            v.type === Wr
              ? ((h = Nr(v.props.children, m.mode, k, v.key)), (h.return = m), (m = h))
              : ((k = _i(v.type, v.key, v.props, null, m.mode, k)),
                (k.ref = Bo(m, h, v)),
                (k.return = m),
                (m = k))
          }
          return i(m)
        case Hr:
          e: {
            for (j = v.key; h !== null; ) {
              if (h.key === j)
                if (
                  h.tag === 4 &&
                  h.stateNode.containerInfo === v.containerInfo &&
                  h.stateNode.implementation === v.implementation
                ) {
                  ;(n(m, h.sibling), (h = o(h, v.children || [])), (h.return = m), (m = h))
                  break e
                } else {
                  n(m, h)
                  break
                }
              else t(m, h)
              h = h.sibling
            }
            ;((h = ba(v, m.mode, k)), (h.return = m), (m = h))
          }
          return i(m)
        case On:
          return ((j = v._init), w(m, h, j(v._payload), k))
      }
      if (Yo(v)) return b(m, h, v, k)
      if (Do(v)) return x(m, h, v, k)
      ci(m, v)
    }
    return (typeof v == 'string' && v !== '') || typeof v == 'number'
      ? ((v = '' + v),
        h !== null && h.tag === 6
          ? (n(m, h.sibling), (h = o(h, v)), (h.return = m), (m = h))
          : (n(m, h), (h = wa(v, m.mode, k)), (h.return = m), (m = h)),
        i(m))
      : n(m, h)
  }
  return w
}
var So = Rh(!0),
  Mh = Rh(!1),
  qi = lr(null),
  Xi = null,
  Zr = null,
  fc = null
function pc() {
  fc = Zr = Xi = null
}
function hc(e) {
  var t = qi.current
  ;(ye(qi), (e._currentValue = t))
}
function du(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break
    e = e.return
  }
}
function io(e, t) {
  ;((Xi = e),
    (fc = Zr = null),
    (e = e.dependencies),
    e !== null && e.firstContext !== null && (e.lanes & t && (rt = !0), (e.firstContext = null)))
}
function kt(e) {
  var t = e._currentValue
  if (fc !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), Zr === null)) {
      if (Xi === null) throw Error(L(308))
      ;((Zr = e), (Xi.dependencies = { lanes: 0, firstContext: e }))
    } else Zr = Zr.next = e
  return t
}
var gr = null
function mc(e) {
  gr === null ? (gr = [e]) : gr.push(e)
}
function _h(e, t, n, r) {
  var o = t.interleaved
  return (
    o === null ? ((n.next = n), mc(t)) : ((n.next = o.next), (o.next = n)),
    (t.interleaved = n),
    xn(e, r)
  )
}
function xn(e, t) {
  e.lanes |= t
  var n = e.alternate
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    ((e.childLanes |= t),
      (n = e.alternate),
      n !== null && (n.childLanes |= t),
      (n = e),
      (e = e.return))
  return n.tag === 3 ? n.stateNode : null
}
var An = !1
function gc(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  }
}
function Oh(e, t) {
  ;((e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      }))
}
function gn(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null }
}
function Gn(e, t, n) {
  var r = e.updateQueue
  if (r === null) return null
  if (((r = r.shared), le & 2)) {
    var o = r.pending
    return (
      o === null ? (t.next = t) : ((t.next = o.next), (o.next = t)),
      (r.pending = t),
      xn(e, n)
    )
  }
  return (
    (o = r.interleaved),
    o === null ? ((t.next = t), mc(r)) : ((t.next = o.next), (o.next = t)),
    (r.interleaved = t),
    xn(e, n)
  )
}
function Ni(e, t, n) {
  if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
    var r = t.lanes
    ;((r &= e.pendingLanes), (n |= r), (t.lanes = n), tc(e, n))
  }
}
function Wd(e, t) {
  var n = e.updateQueue,
    r = e.alternate
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var o = null,
      s = null
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var i = {
          eventTime: n.eventTime,
          lane: n.lane,
          tag: n.tag,
          payload: n.payload,
          callback: n.callback,
          next: null,
        }
        ;(s === null ? (o = s = i) : (s = s.next = i), (n = n.next))
      } while (n !== null)
      s === null ? (o = s = t) : (s = s.next = t)
    } else o = s = t
    ;((n = {
      baseState: r.baseState,
      firstBaseUpdate: o,
      lastBaseUpdate: s,
      shared: r.shared,
      effects: r.effects,
    }),
      (e.updateQueue = n))
    return
  }
  ;((e = n.lastBaseUpdate),
    e === null ? (n.firstBaseUpdate = t) : (e.next = t),
    (n.lastBaseUpdate = t))
}
function Zi(e, t, n, r) {
  var o = e.updateQueue
  An = !1
  var s = o.firstBaseUpdate,
    i = o.lastBaseUpdate,
    l = o.shared.pending
  if (l !== null) {
    o.shared.pending = null
    var a = l,
      u = a.next
    ;((a.next = null), i === null ? (s = u) : (i.next = u), (i = a))
    var d = e.alternate
    d !== null &&
      ((d = d.updateQueue),
      (l = d.lastBaseUpdate),
      l !== i && (l === null ? (d.firstBaseUpdate = u) : (l.next = u), (d.lastBaseUpdate = a)))
  }
  if (s !== null) {
    var f = o.baseState
    ;((i = 0), (d = u = a = null), (l = s))
    do {
      var g = l.lane,
        p = l.eventTime
      if ((r & g) === g) {
        d !== null &&
          (d = d.next =
            {
              eventTime: p,
              lane: 0,
              tag: l.tag,
              payload: l.payload,
              callback: l.callback,
              next: null,
            })
        e: {
          var b = e,
            x = l
          switch (((g = t), (p = n), x.tag)) {
            case 1:
              if (((b = x.payload), typeof b == 'function')) {
                f = b.call(p, f, g)
                break e
              }
              f = b
              break e
            case 3:
              b.flags = (b.flags & -65537) | 128
            case 0:
              if (((b = x.payload), (g = typeof b == 'function' ? b.call(p, f, g) : b), g == null))
                break e
              f = ke({}, f, g)
              break e
            case 2:
              An = !0
          }
        }
        l.callback !== null &&
          l.lane !== 0 &&
          ((e.flags |= 64), (g = o.effects), g === null ? (o.effects = [l]) : g.push(l))
      } else
        ((p = {
          eventTime: p,
          lane: g,
          tag: l.tag,
          payload: l.payload,
          callback: l.callback,
          next: null,
        }),
          d === null ? ((u = d = p), (a = f)) : (d = d.next = p),
          (i |= g))
      if (((l = l.next), l === null)) {
        if (((l = o.shared.pending), l === null)) break
        ;((g = l), (l = g.next), (g.next = null), (o.lastBaseUpdate = g), (o.shared.pending = null))
      }
    } while (!0)
    if (
      (d === null && (a = f),
      (o.baseState = a),
      (o.firstBaseUpdate = u),
      (o.lastBaseUpdate = d),
      (t = o.shared.interleaved),
      t !== null)
    ) {
      o = t
      do ((i |= o.lane), (o = o.next))
      while (o !== t)
    } else s === null && (o.shared.lanes = 0)
    ;((Rr |= i), (e.lanes = i), (e.memoizedState = f))
  }
}
function Vd(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        o = r.callback
      if (o !== null) {
        if (((r.callback = null), (r = n), typeof o != 'function')) throw Error(L(191, o))
        o.call(r)
      }
    }
}
var zs = {},
  tn = lr(zs),
  vs = lr(zs),
  xs = lr(zs)
function yr(e) {
  if (e === zs) throw Error(L(174))
  return e
}
function yc(e, t) {
  switch ((he(xs, t), he(vs, e), he(tn, zs), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Va(null, '')
      break
    default:
      ;((e = e === 8 ? t.parentNode : t),
        (t = e.namespaceURI || null),
        (e = e.tagName),
        (t = Va(t, e)))
  }
  ;(ye(tn), he(tn, t))
}
function ko() {
  ;(ye(tn), ye(vs), ye(xs))
}
function Ah(e) {
  yr(xs.current)
  var t = yr(tn.current),
    n = Va(t, e.type)
  t !== n && (he(vs, e), he(tn, n))
}
function vc(e) {
  vs.current === e && (ye(tn), ye(vs))
}
var be = lr(0)
function Ji(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState
      if (n !== null && ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!'))
        return t
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t
    } else if (t.child !== null) {
      ;((t.child.return = t), (t = t.child))
      continue
    }
    if (t === e) break
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null
      t = t.return
    }
    ;((t.sibling.return = t.return), (t = t.sibling))
  }
  return null
}
var ha = []
function xc() {
  for (var e = 0; e < ha.length; e++) ha[e]._workInProgressVersionPrimary = null
  ha.length = 0
}
var Pi = kn.ReactCurrentDispatcher,
  ma = kn.ReactCurrentBatchConfig,
  Tr = 0,
  Se = null,
  _e = null,
  Le = null,
  el = !1,
  ns = !1,
  ws = 0,
  y0 = 0
function Be() {
  throw Error(L(321))
}
function wc(e, t) {
  if (t === null) return !1
  for (var n = 0; n < t.length && n < e.length; n++) if (!$t(e[n], t[n])) return !1
  return !0
}
function bc(e, t, n, r, o, s) {
  if (
    ((Tr = s),
    (Se = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (Pi.current = e === null || e.memoizedState === null ? b0 : S0),
    (e = n(r, o)),
    ns)
  ) {
    s = 0
    do {
      if (((ns = !1), (ws = 0), 25 <= s)) throw Error(L(301))
      ;((s += 1), (Le = _e = null), (t.updateQueue = null), (Pi.current = k0), (e = n(r, o)))
    } while (ns)
  }
  if (
    ((Pi.current = tl),
    (t = _e !== null && _e.next !== null),
    (Tr = 0),
    (Le = _e = Se = null),
    (el = !1),
    t)
  )
    throw Error(L(300))
  return e
}
function Sc() {
  var e = ws !== 0
  return ((ws = 0), e)
}
function Yt() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
  return (Le === null ? (Se.memoizedState = Le = e) : (Le = Le.next = e), Le)
}
function Ct() {
  if (_e === null) {
    var e = Se.alternate
    e = e !== null ? e.memoizedState : null
  } else e = _e.next
  var t = Le === null ? Se.memoizedState : Le.next
  if (t !== null) ((Le = t), (_e = e))
  else {
    if (e === null) throw Error(L(310))
    ;((_e = e),
      (e = {
        memoizedState: _e.memoizedState,
        baseState: _e.baseState,
        baseQueue: _e.baseQueue,
        queue: _e.queue,
        next: null,
      }),
      Le === null ? (Se.memoizedState = Le = e) : (Le = Le.next = e))
  }
  return Le
}
function bs(e, t) {
  return typeof t == 'function' ? t(e) : t
}
function ga(e) {
  var t = Ct(),
    n = t.queue
  if (n === null) throw Error(L(311))
  n.lastRenderedReducer = e
  var r = _e,
    o = r.baseQueue,
    s = n.pending
  if (s !== null) {
    if (o !== null) {
      var i = o.next
      ;((o.next = s.next), (s.next = i))
    }
    ;((r.baseQueue = o = s), (n.pending = null))
  }
  if (o !== null) {
    ;((s = o.next), (r = r.baseState))
    var l = (i = null),
      a = null,
      u = s
    do {
      var d = u.lane
      if ((Tr & d) === d)
        (a !== null &&
          (a = a.next =
            {
              lane: 0,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
          (r = u.hasEagerState ? u.eagerState : e(r, u.action)))
      else {
        var f = {
          lane: d,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null,
        }
        ;(a === null ? ((l = a = f), (i = r)) : (a = a.next = f), (Se.lanes |= d), (Rr |= d))
      }
      u = u.next
    } while (u !== null && u !== s)
    ;(a === null ? (i = r) : (a.next = l),
      $t(r, t.memoizedState) || (rt = !0),
      (t.memoizedState = r),
      (t.baseState = i),
      (t.baseQueue = a),
      (n.lastRenderedState = r))
  }
  if (((e = n.interleaved), e !== null)) {
    o = e
    do ((s = o.lane), (Se.lanes |= s), (Rr |= s), (o = o.next))
    while (o !== e)
  } else o === null && (n.lanes = 0)
  return [t.memoizedState, n.dispatch]
}
function ya(e) {
  var t = Ct(),
    n = t.queue
  if (n === null) throw Error(L(311))
  n.lastRenderedReducer = e
  var r = n.dispatch,
    o = n.pending,
    s = t.memoizedState
  if (o !== null) {
    n.pending = null
    var i = (o = o.next)
    do ((s = e(s, i.action)), (i = i.next))
    while (i !== o)
    ;($t(s, t.memoizedState) || (rt = !0),
      (t.memoizedState = s),
      t.baseQueue === null && (t.baseState = s),
      (n.lastRenderedState = s))
  }
  return [s, r]
}
function Lh() {}
function Ih(e, t) {
  var n = Se,
    r = Ct(),
    o = t(),
    s = !$t(r.memoizedState, o)
  if (
    (s && ((r.memoizedState = o), (rt = !0)),
    (r = r.queue),
    kc(Fh.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || s || (Le !== null && Le.memoizedState.tag & 1))
  ) {
    if (((n.flags |= 2048), Ss(9, zh.bind(null, n, r, o, t), void 0, null), Ie === null))
      throw Error(L(349))
    Tr & 30 || Dh(n, t, o)
  }
  return o
}
function Dh(e, t, n) {
  ;((e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = Se.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }), (Se.updateQueue = t), (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)))
}
function zh(e, t, n, r) {
  ;((t.value = n), (t.getSnapshot = r), $h(t) && Uh(e))
}
function Fh(e, t, n) {
  return n(function () {
    $h(t) && Uh(e)
  })
}
function $h(e) {
  var t = e.getSnapshot
  e = e.value
  try {
    var n = t()
    return !$t(e, n)
  } catch {
    return !0
  }
}
function Uh(e) {
  var t = xn(e, 1)
  t !== null && Ft(t, e, 1, -1)
}
function Qd(e) {
  var t = Yt()
  return (
    typeof e == 'function' && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = {
      pending: null,
      interleaved: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: bs,
      lastRenderedState: e,
    }),
    (t.queue = e),
    (e = e.dispatch = w0.bind(null, Se, e)),
    [t.memoizedState, e]
  )
}
function Ss(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = Se.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (Se.updateQueue = t),
        (t.lastEffect = e.next = e))
      : ((n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  )
}
function Bh() {
  return Ct().memoizedState
}
function ji(e, t, n, r) {
  var o = Yt()
  ;((Se.flags |= e), (o.memoizedState = Ss(1 | t, n, void 0, r === void 0 ? null : r)))
}
function Sl(e, t, n, r) {
  var o = Ct()
  r = r === void 0 ? null : r
  var s = void 0
  if (_e !== null) {
    var i = _e.memoizedState
    if (((s = i.destroy), r !== null && wc(r, i.deps))) {
      o.memoizedState = Ss(t, n, s, r)
      return
    }
  }
  ;((Se.flags |= e), (o.memoizedState = Ss(1 | t, n, s, r)))
}
function Kd(e, t) {
  return ji(8390656, 8, e, t)
}
function kc(e, t) {
  return Sl(2048, 8, e, t)
}
function Hh(e, t) {
  return Sl(4, 2, e, t)
}
function Wh(e, t) {
  return Sl(4, 4, e, t)
}
function Vh(e, t) {
  if (typeof t == 'function')
    return (
      (e = e()),
      t(e),
      function () {
        t(null)
      }
    )
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null
      }
    )
}
function Qh(e, t, n) {
  return ((n = n != null ? n.concat([e]) : null), Sl(4, 4, Vh.bind(null, t, e), n))
}
function Cc() {}
function Kh(e, t) {
  var n = Ct()
  t = t === void 0 ? null : t
  var r = n.memoizedState
  return r !== null && t !== null && wc(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e)
}
function Yh(e, t) {
  var n = Ct()
  t = t === void 0 ? null : t
  var r = n.memoizedState
  return r !== null && t !== null && wc(t, r[1]) ? r[0] : ((e = e()), (n.memoizedState = [e, t]), e)
}
function Gh(e, t, n) {
  return Tr & 21
    ? ($t(n, t) || ((n = eh()), (Se.lanes |= n), (Rr |= n), (e.baseState = !0)), t)
    : (e.baseState && ((e.baseState = !1), (rt = !0)), (e.memoizedState = n))
}
function v0(e, t) {
  var n = de
  ;((de = n !== 0 && 4 > n ? n : 4), e(!0))
  var r = ma.transition
  ma.transition = {}
  try {
    ;(e(!1), t())
  } finally {
    ;((de = n), (ma.transition = r))
  }
}
function qh() {
  return Ct().memoizedState
}
function x0(e, t, n) {
  var r = Xn(e)
  if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), Xh(e)))
    Zh(t, n)
  else if (((n = _h(e, t, n, r)), n !== null)) {
    var o = qe()
    ;(Ft(n, e, r, o), Jh(n, t, r))
  }
}
function w0(e, t, n) {
  var r = Xn(e),
    o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }
  if (Xh(e)) Zh(t, o)
  else {
    var s = e.alternate
    if (e.lanes === 0 && (s === null || s.lanes === 0) && ((s = t.lastRenderedReducer), s !== null))
      try {
        var i = t.lastRenderedState,
          l = s(i, n)
        if (((o.hasEagerState = !0), (o.eagerState = l), $t(l, i))) {
          var a = t.interleaved
          ;(a === null ? ((o.next = o), mc(t)) : ((o.next = a.next), (a.next = o)),
            (t.interleaved = o))
          return
        }
      } catch {
      } finally {
      }
    ;((n = _h(e, t, o, r)), n !== null && ((o = qe()), Ft(n, e, r, o), Jh(n, t, r)))
  }
}
function Xh(e) {
  var t = e.alternate
  return e === Se || (t !== null && t === Se)
}
function Zh(e, t) {
  ns = el = !0
  var n = e.pending
  ;(n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t))
}
function Jh(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes
    ;((r &= e.pendingLanes), (n |= r), (t.lanes = n), tc(e, n))
  }
}
var tl = {
    readContext: kt,
    useCallback: Be,
    useContext: Be,
    useEffect: Be,
    useImperativeHandle: Be,
    useInsertionEffect: Be,
    useLayoutEffect: Be,
    useMemo: Be,
    useReducer: Be,
    useRef: Be,
    useState: Be,
    useDebugValue: Be,
    useDeferredValue: Be,
    useTransition: Be,
    useMutableSource: Be,
    useSyncExternalStore: Be,
    useId: Be,
    unstable_isNewReconciler: !1,
  },
  b0 = {
    readContext: kt,
    useCallback: function (e, t) {
      return ((Yt().memoizedState = [e, t === void 0 ? null : t]), e)
    },
    useContext: kt,
    useEffect: Kd,
    useImperativeHandle: function (e, t, n) {
      return ((n = n != null ? n.concat([e]) : null), ji(4194308, 4, Vh.bind(null, t, e), n))
    },
    useLayoutEffect: function (e, t) {
      return ji(4194308, 4, e, t)
    },
    useInsertionEffect: function (e, t) {
      return ji(4, 2, e, t)
    },
    useMemo: function (e, t) {
      var n = Yt()
      return ((t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e)
    },
    useReducer: function (e, t, n) {
      var r = Yt()
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t,
        }),
        (r.queue = e),
        (e = e.dispatch = x0.bind(null, Se, e)),
        [r.memoizedState, e]
      )
    },
    useRef: function (e) {
      var t = Yt()
      return ((e = { current: e }), (t.memoizedState = e))
    },
    useState: Qd,
    useDebugValue: Cc,
    useDeferredValue: function (e) {
      return (Yt().memoizedState = e)
    },
    useTransition: function () {
      var e = Qd(!1),
        t = e[0]
      return ((e = v0.bind(null, e[1])), (Yt().memoizedState = e), [t, e])
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = Se,
        o = Yt()
      if (xe) {
        if (n === void 0) throw Error(L(407))
        n = n()
      } else {
        if (((n = t()), Ie === null)) throw Error(L(349))
        Tr & 30 || Dh(r, t, n)
      }
      o.memoizedState = n
      var s = { value: n, getSnapshot: t }
      return (
        (o.queue = s),
        Kd(Fh.bind(null, r, s, e), [e]),
        (r.flags |= 2048),
        Ss(9, zh.bind(null, r, s, n, t), void 0, null),
        n
      )
    },
    useId: function () {
      var e = Yt(),
        t = Ie.identifierPrefix
      if (xe) {
        var n = mn,
          r = hn
        ;((n = (r & ~(1 << (32 - zt(r) - 1))).toString(32) + n),
          (t = ':' + t + 'R' + n),
          (n = ws++),
          0 < n && (t += 'H' + n.toString(32)),
          (t += ':'))
      } else ((n = y0++), (t = ':' + t + 'r' + n.toString(32) + ':'))
      return (e.memoizedState = t)
    },
    unstable_isNewReconciler: !1,
  },
  S0 = {
    readContext: kt,
    useCallback: Kh,
    useContext: kt,
    useEffect: kc,
    useImperativeHandle: Qh,
    useInsertionEffect: Hh,
    useLayoutEffect: Wh,
    useMemo: Yh,
    useReducer: ga,
    useRef: Bh,
    useState: function () {
      return ga(bs)
    },
    useDebugValue: Cc,
    useDeferredValue: function (e) {
      var t = Ct()
      return Gh(t, _e.memoizedState, e)
    },
    useTransition: function () {
      var e = ga(bs)[0],
        t = Ct().memoizedState
      return [e, t]
    },
    useMutableSource: Lh,
    useSyncExternalStore: Ih,
    useId: qh,
    unstable_isNewReconciler: !1,
  },
  k0 = {
    readContext: kt,
    useCallback: Kh,
    useContext: kt,
    useEffect: kc,
    useImperativeHandle: Qh,
    useInsertionEffect: Hh,
    useLayoutEffect: Wh,
    useMemo: Yh,
    useReducer: ya,
    useRef: Bh,
    useState: function () {
      return ya(bs)
    },
    useDebugValue: Cc,
    useDeferredValue: function (e) {
      var t = Ct()
      return _e === null ? (t.memoizedState = e) : Gh(t, _e.memoizedState, e)
    },
    useTransition: function () {
      var e = ya(bs)[0],
        t = Ct().memoizedState
      return [e, t]
    },
    useMutableSource: Lh,
    useSyncExternalStore: Ih,
    useId: qh,
    unstable_isNewReconciler: !1,
  }
function Mt(e, t) {
  if (e && e.defaultProps) {
    ;((t = ke({}, t)), (e = e.defaultProps))
    for (var n in e) t[n] === void 0 && (t[n] = e[n])
    return t
  }
  return t
}
function fu(e, t, n, r) {
  ;((t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : ke({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n))
}
var kl = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? Ar(e) === e : !1
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals
    var r = qe(),
      o = Xn(e),
      s = gn(r, o)
    ;((s.payload = t),
      n != null && (s.callback = n),
      (t = Gn(e, s, o)),
      t !== null && (Ft(t, e, o, r), Ni(t, e, o)))
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals
    var r = qe(),
      o = Xn(e),
      s = gn(r, o)
    ;((s.tag = 1),
      (s.payload = t),
      n != null && (s.callback = n),
      (t = Gn(e, s, o)),
      t !== null && (Ft(t, e, o, r), Ni(t, e, o)))
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals
    var n = qe(),
      r = Xn(e),
      o = gn(n, r)
    ;((o.tag = 2),
      t != null && (o.callback = t),
      (t = Gn(e, o, r)),
      t !== null && (Ft(t, e, r, n), Ni(t, e, r)))
  },
}
function Yd(e, t, n, r, o, s, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == 'function'
      ? e.shouldComponentUpdate(r, s, i)
      : t.prototype && t.prototype.isPureReactComponent
        ? !hs(n, r) || !hs(o, s)
        : !0
  )
}
function em(e, t, n) {
  var r = !1,
    o = tr,
    s = t.contextType
  return (
    typeof s == 'object' && s !== null
      ? (s = kt(s))
      : ((o = st(t) ? Pr : Qe.current),
        (r = t.contextTypes),
        (s = (r = r != null) ? wo(e, o) : tr)),
    (t = new t(n, s)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = kl),
    (e.stateNode = t),
    (t._reactInternals = e),
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = o),
      (e.__reactInternalMemoizedMaskedChildContext = s)),
    t
  )
}
function Gd(e, t, n, r) {
  ;((e = t.state),
    typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
      t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && kl.enqueueReplaceState(t, t.state, null))
}
function pu(e, t, n, r) {
  var o = e.stateNode
  ;((o.props = n), (o.state = e.memoizedState), (o.refs = {}), gc(e))
  var s = t.contextType
  ;(typeof s == 'object' && s !== null
    ? (o.context = kt(s))
    : ((s = st(t) ? Pr : Qe.current), (o.context = wo(e, s))),
    (o.state = e.memoizedState),
    (s = t.getDerivedStateFromProps),
    typeof s == 'function' && (fu(e, t, s, n), (o.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == 'function' ||
      typeof o.getSnapshotBeforeUpdate == 'function' ||
      (typeof o.UNSAFE_componentWillMount != 'function' &&
        typeof o.componentWillMount != 'function') ||
      ((t = o.state),
      typeof o.componentWillMount == 'function' && o.componentWillMount(),
      typeof o.UNSAFE_componentWillMount == 'function' && o.UNSAFE_componentWillMount(),
      t !== o.state && kl.enqueueReplaceState(o, o.state, null),
      Zi(e, n, o, r),
      (o.state = e.memoizedState)),
    typeof o.componentDidMount == 'function' && (e.flags |= 4194308))
}
function Co(e, t) {
  try {
    var n = '',
      r = t
    do ((n += Xy(r)), (r = r.return))
    while (r)
    var o = n
  } catch (s) {
    o =
      `
Error generating stack: ` +
      s.message +
      `
` +
      s.stack
  }
  return { value: e, source: t, stack: o, digest: null }
}
function va(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null }
}
function hu(e, t) {
  try {
    console.error(t.value)
  } catch (n) {
    setTimeout(function () {
      throw n
    })
  }
}
var C0 = typeof WeakMap == 'function' ? WeakMap : Map
function tm(e, t, n) {
  ;((n = gn(-1, n)), (n.tag = 3), (n.payload = { element: null }))
  var r = t.value
  return (
    (n.callback = function () {
      ;(rl || ((rl = !0), (Cu = r)), hu(e, t))
    }),
    n
  )
}
function nm(e, t, n) {
  ;((n = gn(-1, n)), (n.tag = 3))
  var r = e.type.getDerivedStateFromError
  if (typeof r == 'function') {
    var o = t.value
    ;((n.payload = function () {
      return r(o)
    }),
      (n.callback = function () {
        hu(e, t)
      }))
  }
  var s = e.stateNode
  return (
    s !== null &&
      typeof s.componentDidCatch == 'function' &&
      (n.callback = function () {
        ;(hu(e, t), typeof r != 'function' && (qn === null ? (qn = new Set([this])) : qn.add(this)))
        var i = t.stack
        this.componentDidCatch(t.value, { componentStack: i !== null ? i : '' })
      }),
    n
  )
}
function qd(e, t, n) {
  var r = e.pingCache
  if (r === null) {
    r = e.pingCache = new C0()
    var o = new Set()
    r.set(t, o)
  } else ((o = r.get(t)), o === void 0 && ((o = new Set()), r.set(t, o)))
  o.has(n) || (o.add(n), (e = z0.bind(null, e, t, n)), t.then(e, e))
}
function Xd(e) {
  do {
    var t
    if (
      ((t = e.tag === 13) && ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
      t)
    )
      return e
    e = e.return
  } while (e !== null)
  return null
}
function Zd(e, t, n, r, o) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = o), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 &&
            (n.alternate === null ? (n.tag = 17) : ((t = gn(-1, 1)), (t.tag = 2), Gn(n, t, 1))),
          (n.lanes |= 1)),
      e)
}
var E0 = kn.ReactCurrentOwner,
  rt = !1
function Ye(e, t, n, r) {
  t.child = e === null ? Mh(t, null, n, r) : So(t, e.child, n, r)
}
function Jd(e, t, n, r, o) {
  n = n.render
  var s = t.ref
  return (
    io(t, o),
    (r = bc(e, t, n, r, s, o)),
    (n = Sc()),
    e !== null && !rt
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~o), wn(e, t, o))
      : (xe && n && uc(t), (t.flags |= 1), Ye(e, t, r, o), t.child)
  )
}
function ef(e, t, n, r, o) {
  if (e === null) {
    var s = n.type
    return typeof s == 'function' &&
      !_c(s) &&
      s.defaultProps === void 0 &&
      n.compare === null &&
      n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = s), rm(e, t, s, r, o))
      : ((e = _i(n.type, null, r, t, t.mode, o)), (e.ref = t.ref), (e.return = t), (t.child = e))
  }
  if (((s = e.child), !(e.lanes & o))) {
    var i = s.memoizedProps
    if (((n = n.compare), (n = n !== null ? n : hs), n(i, r) && e.ref === t.ref)) return wn(e, t, o)
  }
  return ((t.flags |= 1), (e = Zn(s, r)), (e.ref = t.ref), (e.return = t), (t.child = e))
}
function rm(e, t, n, r, o) {
  if (e !== null) {
    var s = e.memoizedProps
    if (hs(s, r) && e.ref === t.ref)
      if (((rt = !1), (t.pendingProps = r = s), (e.lanes & o) !== 0)) e.flags & 131072 && (rt = !0)
      else return ((t.lanes = e.lanes), wn(e, t, o))
  }
  return mu(e, t, n, r, o)
}
function om(e, t, n) {
  var r = t.pendingProps,
    o = r.children,
    s = e !== null ? e.memoizedState : null
  if (r.mode === 'hidden')
    if (!(t.mode & 1))
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        he(eo, ct),
        (ct |= n))
    else {
      if (!(n & 1073741824))
        return (
          (e = s !== null ? s.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
          (t.updateQueue = null),
          he(eo, ct),
          (ct |= e),
          null
        )
      ;((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        (r = s !== null ? s.baseLanes : n),
        he(eo, ct),
        (ct |= r))
    }
  else
    (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
      he(eo, ct),
      (ct |= r))
  return (Ye(e, t, o, n), t.child)
}
function sm(e, t) {
  var n = t.ref
  ;((e === null && n !== null) || (e !== null && e.ref !== n)) &&
    ((t.flags |= 512), (t.flags |= 2097152))
}
function mu(e, t, n, r, o) {
  var s = st(n) ? Pr : Qe.current
  return (
    (s = wo(t, s)),
    io(t, o),
    (n = bc(e, t, n, r, s, o)),
    (r = Sc()),
    e !== null && !rt
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~o), wn(e, t, o))
      : (xe && r && uc(t), (t.flags |= 1), Ye(e, t, n, o), t.child)
  )
}
function tf(e, t, n, r, o) {
  if (st(n)) {
    var s = !0
    Ki(t)
  } else s = !1
  if ((io(t, o), t.stateNode === null)) (Ti(e, t), em(t, n, r), pu(t, n, r, o), (r = !0))
  else if (e === null) {
    var i = t.stateNode,
      l = t.memoizedProps
    i.props = l
    var a = i.context,
      u = n.contextType
    typeof u == 'object' && u !== null
      ? (u = kt(u))
      : ((u = st(n) ? Pr : Qe.current), (u = wo(t, u)))
    var d = n.getDerivedStateFromProps,
      f = typeof d == 'function' || typeof i.getSnapshotBeforeUpdate == 'function'
    ;(f ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' &&
        typeof i.componentWillReceiveProps != 'function') ||
      ((l !== r || a !== u) && Gd(t, i, r, u)),
      (An = !1))
    var g = t.memoizedState
    ;((i.state = g),
      Zi(t, r, i, o),
      (a = t.memoizedState),
      l !== r || g !== a || ot.current || An
        ? (typeof d == 'function' && (fu(t, n, d, r), (a = t.memoizedState)),
          (l = An || Yd(t, n, l, r, g, a, u))
            ? (f ||
                (typeof i.UNSAFE_componentWillMount != 'function' &&
                  typeof i.componentWillMount != 'function') ||
                (typeof i.componentWillMount == 'function' && i.componentWillMount(),
                typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount()),
              typeof i.componentDidMount == 'function' && (t.flags |= 4194308))
            : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308),
              (t.memoizedProps = r),
              (t.memoizedState = a)),
          (i.props = r),
          (i.state = a),
          (i.context = u),
          (r = l))
        : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1)))
  } else {
    ;((i = t.stateNode),
      Oh(e, t),
      (l = t.memoizedProps),
      (u = t.type === t.elementType ? l : Mt(t.type, l)),
      (i.props = u),
      (f = t.pendingProps),
      (g = i.context),
      (a = n.contextType),
      typeof a == 'object' && a !== null
        ? (a = kt(a))
        : ((a = st(n) ? Pr : Qe.current), (a = wo(t, a))))
    var p = n.getDerivedStateFromProps
    ;((d = typeof p == 'function' || typeof i.getSnapshotBeforeUpdate == 'function') ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' &&
        typeof i.componentWillReceiveProps != 'function') ||
      ((l !== f || g !== a) && Gd(t, i, r, a)),
      (An = !1),
      (g = t.memoizedState),
      (i.state = g),
      Zi(t, r, i, o))
    var b = t.memoizedState
    l !== f || g !== b || ot.current || An
      ? (typeof p == 'function' && (fu(t, n, p, r), (b = t.memoizedState)),
        (u = An || Yd(t, n, u, r, g, b, a) || !1)
          ? (d ||
              (typeof i.UNSAFE_componentWillUpdate != 'function' &&
                typeof i.componentWillUpdate != 'function') ||
              (typeof i.componentWillUpdate == 'function' && i.componentWillUpdate(r, b, a),
              typeof i.UNSAFE_componentWillUpdate == 'function' &&
                i.UNSAFE_componentWillUpdate(r, b, a)),
            typeof i.componentDidUpdate == 'function' && (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
          : (typeof i.componentDidUpdate != 'function' ||
              (l === e.memoizedProps && g === e.memoizedState) ||
              (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != 'function' ||
              (l === e.memoizedProps && g === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = b)),
        (i.props = r),
        (i.state = b),
        (i.context = a),
        (r = u))
      : (typeof i.componentDidUpdate != 'function' ||
          (l === e.memoizedProps && g === e.memoizedState) ||
          (t.flags |= 4),
        typeof i.getSnapshotBeforeUpdate != 'function' ||
          (l === e.memoizedProps && g === e.memoizedState) ||
          (t.flags |= 1024),
        (r = !1))
  }
  return gu(e, t, n, r, s, o)
}
function gu(e, t, n, r, o, s) {
  sm(e, t)
  var i = (t.flags & 128) !== 0
  if (!r && !i) return (o && $d(t, n, !1), wn(e, t, s))
  ;((r = t.stateNode), (E0.current = t))
  var l = i && typeof n.getDerivedStateFromError != 'function' ? null : r.render()
  return (
    (t.flags |= 1),
    e !== null && i
      ? ((t.child = So(t, e.child, null, s)), (t.child = So(t, null, l, s)))
      : Ye(e, t, l, s),
    (t.memoizedState = r.state),
    o && $d(t, n, !0),
    t.child
  )
}
function im(e) {
  var t = e.stateNode
  ;(t.pendingContext
    ? Fd(e, t.pendingContext, t.pendingContext !== t.context)
    : t.context && Fd(e, t.context, !1),
    yc(e, t.containerInfo))
}
function nf(e, t, n, r, o) {
  return (bo(), dc(o), (t.flags |= 256), Ye(e, t, n, r), t.child)
}
var yu = { dehydrated: null, treeContext: null, retryLane: 0 }
function vu(e) {
  return { baseLanes: e, cachePool: null, transitions: null }
}
function lm(e, t, n) {
  var r = t.pendingProps,
    o = be.current,
    s = !1,
    i = (t.flags & 128) !== 0,
    l
  if (
    ((l = i) || (l = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0),
    l ? ((s = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (o |= 1),
    he(be, o & 1),
    e === null)
  )
    return (
      cu(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1 ? (e.data === '$!' ? (t.lanes = 8) : (t.lanes = 1073741824)) : (t.lanes = 1),
          null)
        : ((i = r.children),
          (e = r.fallback),
          s
            ? ((r = t.mode),
              (s = t.child),
              (i = { mode: 'hidden', children: i }),
              !(r & 1) && s !== null
                ? ((s.childLanes = 0), (s.pendingProps = i))
                : (s = Nl(i, r, 0, null)),
              (e = Nr(e, r, n, null)),
              (s.return = t),
              (e.return = t),
              (s.sibling = e),
              (t.child = s),
              (t.child.memoizedState = vu(n)),
              (t.memoizedState = yu),
              e)
            : Ec(t, i))
    )
  if (((o = e.memoizedState), o !== null && ((l = o.dehydrated), l !== null)))
    return N0(e, t, i, r, l, o, n)
  if (s) {
    ;((s = r.fallback), (i = t.mode), (o = e.child), (l = o.sibling))
    var a = { mode: 'hidden', children: r.children }
    return (
      !(i & 1) && t.child !== o
        ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = a), (t.deletions = null))
        : ((r = Zn(o, a)), (r.subtreeFlags = o.subtreeFlags & 14680064)),
      l !== null ? (s = Zn(l, s)) : ((s = Nr(s, i, n, null)), (s.flags |= 2)),
      (s.return = t),
      (r.return = t),
      (r.sibling = s),
      (t.child = r),
      (r = s),
      (s = t.child),
      (i = e.child.memoizedState),
      (i =
        i === null
          ? vu(n)
          : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }),
      (s.memoizedState = i),
      (s.childLanes = e.childLanes & ~n),
      (t.memoizedState = yu),
      r
    )
  }
  return (
    (s = e.child),
    (e = s.sibling),
    (r = Zn(s, { mode: 'visible', children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null &&
      ((n = t.deletions), n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  )
}
function Ec(e, t) {
  return (
    (t = Nl({ mode: 'visible', children: t }, e.mode, 0, null)),
    (t.return = e),
    (e.child = t)
  )
}
function di(e, t, n, r) {
  return (
    r !== null && dc(r),
    So(t, e.child, null, n),
    (e = Ec(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  )
}
function N0(e, t, n, r, o, s, i) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = va(Error(L(422)))), di(e, t, i, r))
      : t.memoizedState !== null
        ? ((t.child = e.child), (t.flags |= 128), null)
        : ((s = r.fallback),
          (o = t.mode),
          (r = Nl({ mode: 'visible', children: r.children }, o, 0, null)),
          (s = Nr(s, o, i, null)),
          (s.flags |= 2),
          (r.return = t),
          (s.return = t),
          (r.sibling = s),
          (t.child = r),
          t.mode & 1 && So(t, e.child, null, i),
          (t.child.memoizedState = vu(i)),
          (t.memoizedState = yu),
          s)
  if (!(t.mode & 1)) return di(e, t, i, null)
  if (o.data === '$!') {
    if (((r = o.nextSibling && o.nextSibling.dataset), r)) var l = r.dgst
    return ((r = l), (s = Error(L(419))), (r = va(s, r, void 0)), di(e, t, i, r))
  }
  if (((l = (i & e.childLanes) !== 0), rt || l)) {
    if (((r = Ie), r !== null)) {
      switch (i & -i) {
        case 4:
          o = 2
          break
        case 16:
          o = 8
          break
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32
          break
        case 536870912:
          o = 268435456
          break
        default:
          o = 0
      }
      ;((o = o & (r.suspendedLanes | i) ? 0 : o),
        o !== 0 && o !== s.retryLane && ((s.retryLane = o), xn(e, o), Ft(r, e, o, -1)))
    }
    return (Mc(), (r = va(Error(L(421)))), di(e, t, i, r))
  }
  return o.data === '$?'
    ? ((t.flags |= 128), (t.child = e.child), (t = F0.bind(null, e)), (o._reactRetry = t), null)
    : ((e = s.treeContext),
      (ft = Yn(o.nextSibling)),
      (pt = t),
      (xe = !0),
      (It = null),
      e !== null &&
        ((xt[wt++] = hn),
        (xt[wt++] = mn),
        (xt[wt++] = jr),
        (hn = e.id),
        (mn = e.overflow),
        (jr = t)),
      (t = Ec(t, r.children)),
      (t.flags |= 4096),
      t)
}
function rf(e, t, n) {
  e.lanes |= t
  var r = e.alternate
  ;(r !== null && (r.lanes |= t), du(e.return, t, n))
}
function xa(e, t, n, r, o) {
  var s = e.memoizedState
  s === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: r,
        tail: n,
        tailMode: o,
      })
    : ((s.isBackwards = t),
      (s.rendering = null),
      (s.renderingStartTime = 0),
      (s.last = r),
      (s.tail = n),
      (s.tailMode = o))
}
function am(e, t, n) {
  var r = t.pendingProps,
    o = r.revealOrder,
    s = r.tail
  if ((Ye(e, t, r.children, n), (r = be.current), r & 2)) ((r = (r & 1) | 2), (t.flags |= 128))
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && rf(e, n, t)
        else if (e.tag === 19) rf(e, n, t)
        else if (e.child !== null) {
          ;((e.child.return = e), (e = e.child))
          continue
        }
        if (e === t) break e
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e
          e = e.return
        }
        ;((e.sibling.return = e.return), (e = e.sibling))
      }
    r &= 1
  }
  if ((he(be, r), !(t.mode & 1))) t.memoizedState = null
  else
    switch (o) {
      case 'forwards':
        for (n = t.child, o = null; n !== null; )
          ((e = n.alternate), e !== null && Ji(e) === null && (o = n), (n = n.sibling))
        ;((n = o),
          n === null ? ((o = t.child), (t.child = null)) : ((o = n.sibling), (n.sibling = null)),
          xa(t, !1, o, n, s))
        break
      case 'backwards':
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (((e = o.alternate), e !== null && Ji(e) === null)) {
            t.child = o
            break
          }
          ;((e = o.sibling), (o.sibling = n), (n = o), (o = e))
        }
        xa(t, !0, n, null, s)
        break
      case 'together':
        xa(t, !1, null, null, void 0)
        break
      default:
        t.memoizedState = null
    }
  return t.child
}
function Ti(e, t) {
  !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2))
}
function wn(e, t, n) {
  if ((e !== null && (t.dependencies = e.dependencies), (Rr |= t.lanes), !(n & t.childLanes)))
    return null
  if (e !== null && t.child !== e.child) throw Error(L(153))
  if (t.child !== null) {
    for (e = t.child, n = Zn(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      ((e = e.sibling), (n = n.sibling = Zn(e, e.pendingProps)), (n.return = t))
    n.sibling = null
  }
  return t.child
}
function P0(e, t, n) {
  switch (t.tag) {
    case 3:
      ;(im(t), bo())
      break
    case 5:
      Ah(t)
      break
    case 1:
      st(t.type) && Ki(t)
      break
    case 4:
      yc(t, t.stateNode.containerInfo)
      break
    case 10:
      var r = t.type._context,
        o = t.memoizedProps.value
      ;(he(qi, r._currentValue), (r._currentValue = o))
      break
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (he(be, be.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
            ? lm(e, t, n)
            : (he(be, be.current & 1), (e = wn(e, t, n)), e !== null ? e.sibling : null)
      he(be, be.current & 1)
      break
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return am(e, t, n)
        t.flags |= 128
      }
      if (
        ((o = t.memoizedState),
        o !== null && ((o.rendering = null), (o.tail = null), (o.lastEffect = null)),
        he(be, be.current),
        r)
      )
        break
      return null
    case 22:
    case 23:
      return ((t.lanes = 0), om(e, t, n))
  }
  return wn(e, t, n)
}
var um, xu, cm, dm
um = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode)
    else if (n.tag !== 4 && n.child !== null) {
      ;((n.child.return = n), (n = n.child))
      continue
    }
    if (n === t) break
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return
      n = n.return
    }
    ;((n.sibling.return = n.return), (n = n.sibling))
  }
}
xu = function () {}
cm = function (e, t, n, r) {
  var o = e.memoizedProps
  if (o !== r) {
    ;((e = t.stateNode), yr(tn.current))
    var s = null
    switch (n) {
      case 'input':
        ;((o = Ua(e, o)), (r = Ua(e, r)), (s = []))
        break
      case 'select':
        ;((o = ke({}, o, { value: void 0 })), (r = ke({}, r, { value: void 0 })), (s = []))
        break
      case 'textarea':
        ;((o = Wa(e, o)), (r = Wa(e, r)), (s = []))
        break
      default:
        typeof o.onClick != 'function' && typeof r.onClick == 'function' && (e.onclick = Vi)
    }
    Qa(n, r)
    var i
    n = null
    for (u in o)
      if (!r.hasOwnProperty(u) && o.hasOwnProperty(u) && o[u] != null)
        if (u === 'style') {
          var l = o[u]
          for (i in l) l.hasOwnProperty(i) && (n || (n = {}), (n[i] = ''))
        } else
          u !== 'dangerouslySetInnerHTML' &&
            u !== 'children' &&
            u !== 'suppressContentEditableWarning' &&
            u !== 'suppressHydrationWarning' &&
            u !== 'autoFocus' &&
            (ls.hasOwnProperty(u) ? s || (s = []) : (s = s || []).push(u, null))
    for (u in r) {
      var a = r[u]
      if (
        ((l = o != null ? o[u] : void 0),
        r.hasOwnProperty(u) && a !== l && (a != null || l != null))
      )
        if (u === 'style')
          if (l) {
            for (i in l)
              !l.hasOwnProperty(i) || (a && a.hasOwnProperty(i)) || (n || (n = {}), (n[i] = ''))
            for (i in a) a.hasOwnProperty(i) && l[i] !== a[i] && (n || (n = {}), (n[i] = a[i]))
          } else (n || (s || (s = []), s.push(u, n)), (n = a))
        else
          u === 'dangerouslySetInnerHTML'
            ? ((a = a ? a.__html : void 0),
              (l = l ? l.__html : void 0),
              a != null && l !== a && (s = s || []).push(u, a))
            : u === 'children'
              ? (typeof a != 'string' && typeof a != 'number') || (s = s || []).push(u, '' + a)
              : u !== 'suppressContentEditableWarning' &&
                u !== 'suppressHydrationWarning' &&
                (ls.hasOwnProperty(u)
                  ? (a != null && u === 'onScroll' && ge('scroll', e), s || l === a || (s = []))
                  : (s = s || []).push(u, a))
    }
    n && (s = s || []).push('style', n)
    var u = s
    ;(t.updateQueue = u) && (t.flags |= 4)
  }
}
dm = function (e, t, n, r) {
  n !== r && (t.flags |= 4)
}
function Ho(e, t) {
  if (!xe)
    switch (e.tailMode) {
      case 'hidden':
        t = e.tail
        for (var n = null; t !== null; ) (t.alternate !== null && (n = t), (t = t.sibling))
        n === null ? (e.tail = null) : (n.sibling = null)
        break
      case 'collapsed':
        n = e.tail
        for (var r = null; n !== null; ) (n.alternate !== null && (r = n), (n = n.sibling))
        r === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (r.sibling = null)
    }
}
function He(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0
  if (t)
    for (var o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags & 14680064),
        (r |= o.flags & 14680064),
        (o.return = e),
        (o = o.sibling))
  else
    for (o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags),
        (r |= o.flags),
        (o.return = e),
        (o = o.sibling))
  return ((e.subtreeFlags |= r), (e.childLanes = n), t)
}
function j0(e, t, n) {
  var r = t.pendingProps
  switch ((cc(t), t.tag)) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return (He(t), null)
    case 1:
      return (st(t.type) && Qi(), He(t), null)
    case 3:
      return (
        (r = t.stateNode),
        ko(),
        ye(ot),
        ye(Qe),
        xc(),
        r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (ui(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), It !== null && (Pu(It), (It = null)))),
        xu(e, t),
        He(t),
        null
      )
    case 5:
      vc(t)
      var o = yr(xs.current)
      if (((n = t.type), e !== null && t.stateNode != null))
        (cm(e, t, n, r, o), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)))
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(L(166))
          return (He(t), null)
        }
        if (((e = yr(tn.current)), ui(t))) {
          ;((r = t.stateNode), (n = t.type))
          var s = t.memoizedProps
          switch (((r[Zt] = t), (r[ys] = s), (e = (t.mode & 1) !== 0), n)) {
            case 'dialog':
              ;(ge('cancel', r), ge('close', r))
              break
            case 'iframe':
            case 'object':
            case 'embed':
              ge('load', r)
              break
            case 'video':
            case 'audio':
              for (o = 0; o < qo.length; o++) ge(qo[o], r)
              break
            case 'source':
              ge('error', r)
              break
            case 'img':
            case 'image':
            case 'link':
              ;(ge('error', r), ge('load', r))
              break
            case 'details':
              ge('toggle', r)
              break
            case 'input':
              ;(fd(r, s), ge('invalid', r))
              break
            case 'select':
              ;((r._wrapperState = { wasMultiple: !!s.multiple }), ge('invalid', r))
              break
            case 'textarea':
              ;(hd(r, s), ge('invalid', r))
          }
          ;(Qa(n, s), (o = null))
          for (var i in s)
            if (s.hasOwnProperty(i)) {
              var l = s[i]
              i === 'children'
                ? typeof l == 'string'
                  ? r.textContent !== l &&
                    (s.suppressHydrationWarning !== !0 && ai(r.textContent, l, e),
                    (o = ['children', l]))
                  : typeof l == 'number' &&
                    r.textContent !== '' + l &&
                    (s.suppressHydrationWarning !== !0 && ai(r.textContent, l, e),
                    (o = ['children', '' + l]))
                : ls.hasOwnProperty(i) && l != null && i === 'onScroll' && ge('scroll', r)
            }
          switch (n) {
            case 'input':
              ;(ei(r), pd(r, s, !0))
              break
            case 'textarea':
              ;(ei(r), md(r))
              break
            case 'select':
            case 'option':
              break
            default:
              typeof s.onClick == 'function' && (r.onclick = Vi)
          }
          ;((r = o), (t.updateQueue = r), r !== null && (t.flags |= 4))
        } else {
          ;((i = o.nodeType === 9 ? o : o.ownerDocument),
            e === 'http://www.w3.org/1999/xhtml' && (e = Fp(n)),
            e === 'http://www.w3.org/1999/xhtml'
              ? n === 'script'
                ? ((e = i.createElement('div')),
                  (e.innerHTML = '<script><\/script>'),
                  (e = e.removeChild(e.firstChild)))
                : typeof r.is == 'string'
                  ? (e = i.createElement(n, { is: r.is }))
                  : ((e = i.createElement(n)),
                    n === 'select' &&
                      ((i = e), r.multiple ? (i.multiple = !0) : r.size && (i.size = r.size)))
              : (e = i.createElementNS(e, n)),
            (e[Zt] = t),
            (e[ys] = r),
            um(e, t, !1, !1),
            (t.stateNode = e))
          e: {
            switch (((i = Ka(n, r)), n)) {
              case 'dialog':
                ;(ge('cancel', e), ge('close', e), (o = r))
                break
              case 'iframe':
              case 'object':
              case 'embed':
                ;(ge('load', e), (o = r))
                break
              case 'video':
              case 'audio':
                for (o = 0; o < qo.length; o++) ge(qo[o], e)
                o = r
                break
              case 'source':
                ;(ge('error', e), (o = r))
                break
              case 'img':
              case 'image':
              case 'link':
                ;(ge('error', e), ge('load', e), (o = r))
                break
              case 'details':
                ;(ge('toggle', e), (o = r))
                break
              case 'input':
                ;(fd(e, r), (o = Ua(e, r)), ge('invalid', e))
                break
              case 'option':
                o = r
                break
              case 'select':
                ;((e._wrapperState = { wasMultiple: !!r.multiple }),
                  (o = ke({}, r, { value: void 0 })),
                  ge('invalid', e))
                break
              case 'textarea':
                ;(hd(e, r), (o = Wa(e, r)), ge('invalid', e))
                break
              default:
                o = r
            }
            ;(Qa(n, o), (l = o))
            for (s in l)
              if (l.hasOwnProperty(s)) {
                var a = l[s]
                s === 'style'
                  ? Bp(e, a)
                  : s === 'dangerouslySetInnerHTML'
                    ? ((a = a ? a.__html : void 0), a != null && $p(e, a))
                    : s === 'children'
                      ? typeof a == 'string'
                        ? (n !== 'textarea' || a !== '') && as(e, a)
                        : typeof a == 'number' && as(e, '' + a)
                      : s !== 'suppressContentEditableWarning' &&
                        s !== 'suppressHydrationWarning' &&
                        s !== 'autoFocus' &&
                        (ls.hasOwnProperty(s)
                          ? a != null && s === 'onScroll' && ge('scroll', e)
                          : a != null && Gu(e, s, a, i))
              }
            switch (n) {
              case 'input':
                ;(ei(e), pd(e, r, !1))
                break
              case 'textarea':
                ;(ei(e), md(e))
                break
              case 'option':
                r.value != null && e.setAttribute('value', '' + er(r.value))
                break
              case 'select':
                ;((e.multiple = !!r.multiple),
                  (s = r.value),
                  s != null
                    ? no(e, !!r.multiple, s, !1)
                    : r.defaultValue != null && no(e, !!r.multiple, r.defaultValue, !0))
                break
              default:
                typeof o.onClick == 'function' && (e.onclick = Vi)
            }
            switch (n) {
              case 'button':
              case 'input':
              case 'select':
              case 'textarea':
                r = !!r.autoFocus
                break e
              case 'img':
                r = !0
                break e
              default:
                r = !1
            }
          }
          r && (t.flags |= 4)
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152))
      }
      return (He(t), null)
    case 6:
      if (e && t.stateNode != null) dm(e, t, e.memoizedProps, r)
      else {
        if (typeof r != 'string' && t.stateNode === null) throw Error(L(166))
        if (((n = yr(xs.current)), yr(tn.current), ui(t))) {
          if (
            ((r = t.stateNode),
            (n = t.memoizedProps),
            (r[Zt] = t),
            (s = r.nodeValue !== n) && ((e = pt), e !== null))
          )
            switch (e.tag) {
              case 3:
                ai(r.nodeValue, n, (e.mode & 1) !== 0)
                break
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 &&
                  ai(r.nodeValue, n, (e.mode & 1) !== 0)
            }
          s && (t.flags |= 4)
        } else
          ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
            (r[Zt] = t),
            (t.stateNode = r))
      }
      return (He(t), null)
    case 13:
      if (
        (ye(be),
        (r = t.memoizedState),
        e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (xe && ft !== null && t.mode & 1 && !(t.flags & 128))
          (Th(), bo(), (t.flags |= 98560), (s = !1))
        else if (((s = ui(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!s) throw Error(L(318))
            if (((s = t.memoizedState), (s = s !== null ? s.dehydrated : null), !s))
              throw Error(L(317))
            s[Zt] = t
          } else (bo(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4))
          ;(He(t), (s = !1))
        } else (It !== null && (Pu(It), (It = null)), (s = !0))
        if (!s) return t.flags & 65536 ? t : null
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192),
            t.mode & 1 && (e === null || be.current & 1 ? Ae === 0 && (Ae = 3) : Mc())),
          t.updateQueue !== null && (t.flags |= 4),
          He(t),
          null)
    case 4:
      return (ko(), xu(e, t), e === null && ms(t.stateNode.containerInfo), He(t), null)
    case 10:
      return (hc(t.type._context), He(t), null)
    case 17:
      return (st(t.type) && Qi(), He(t), null)
    case 19:
      if ((ye(be), (s = t.memoizedState), s === null)) return (He(t), null)
      if (((r = (t.flags & 128) !== 0), (i = s.rendering), i === null))
        if (r) Ho(s, !1)
        else {
          if (Ae !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((i = Ji(e)), i !== null)) {
                for (
                  t.flags |= 128,
                    Ho(s, !1),
                    r = i.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;

                )
                  ((s = n),
                    (e = r),
                    (s.flags &= 14680066),
                    (i = s.alternate),
                    i === null
                      ? ((s.childLanes = 0),
                        (s.lanes = e),
                        (s.child = null),
                        (s.subtreeFlags = 0),
                        (s.memoizedProps = null),
                        (s.memoizedState = null),
                        (s.updateQueue = null),
                        (s.dependencies = null),
                        (s.stateNode = null))
                      : ((s.childLanes = i.childLanes),
                        (s.lanes = i.lanes),
                        (s.child = i.child),
                        (s.subtreeFlags = 0),
                        (s.deletions = null),
                        (s.memoizedProps = i.memoizedProps),
                        (s.memoizedState = i.memoizedState),
                        (s.updateQueue = i.updateQueue),
                        (s.type = i.type),
                        (e = i.dependencies),
                        (s.dependencies =
                          e === null ? null : { lanes: e.lanes, firstContext: e.firstContext })),
                    (n = n.sibling))
                return (he(be, (be.current & 1) | 2), t.child)
              }
              e = e.sibling
            }
          s.tail !== null &&
            Pe() > Eo &&
            ((t.flags |= 128), (r = !0), Ho(s, !1), (t.lanes = 4194304))
        }
      else {
        if (!r)
          if (((e = Ji(i)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              Ho(s, !0),
              s.tail === null && s.tailMode === 'hidden' && !i.alternate && !xe)
            )
              return (He(t), null)
          } else
            2 * Pe() - s.renderingStartTime > Eo &&
              n !== 1073741824 &&
              ((t.flags |= 128), (r = !0), Ho(s, !1), (t.lanes = 4194304))
        s.isBackwards
          ? ((i.sibling = t.child), (t.child = i))
          : ((n = s.last), n !== null ? (n.sibling = i) : (t.child = i), (s.last = i))
      }
      return s.tail !== null
        ? ((t = s.tail),
          (s.rendering = t),
          (s.tail = t.sibling),
          (s.renderingStartTime = Pe()),
          (t.sibling = null),
          (n = be.current),
          he(be, r ? (n & 1) | 2 : n & 1),
          t)
        : (He(t), null)
    case 22:
    case 23:
      return (
        Rc(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1
          ? ct & 1073741824 && (He(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : He(t),
        null
      )
    case 24:
      return null
    case 25:
      return null
  }
  throw Error(L(156, t.tag))
}
function T0(e, t) {
  switch ((cc(t), t.tag)) {
    case 1:
      return (
        st(t.type) && Qi(),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 3:
      return (
        ko(),
        ye(ot),
        ye(Qe),
        xc(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 5:
      return (vc(t), null)
    case 13:
      if ((ye(be), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(L(340))
        bo()
      }
      return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null)
    case 19:
      return (ye(be), null)
    case 4:
      return (ko(), null)
    case 10:
      return (hc(t.type._context), null)
    case 22:
    case 23:
      return (Rc(), null)
    case 24:
      return null
    default:
      return null
  }
}
var fi = !1,
  Ve = !1,
  R0 = typeof WeakSet == 'function' ? WeakSet : Set,
  V = null
function Jr(e, t) {
  var n = e.ref
  if (n !== null)
    if (typeof n == 'function')
      try {
        n(null)
      } catch (r) {
        Ee(e, t, r)
      }
    else n.current = null
}
function wu(e, t, n) {
  try {
    n()
  } catch (r) {
    Ee(e, t, r)
  }
}
var of = !1
function M0(e, t) {
  if (((ru = Bi), (e = gh()), ac(e))) {
    if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd }
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window
        var r = n.getSelection && n.getSelection()
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode
          var o = r.anchorOffset,
            s = r.focusNode
          r = r.focusOffset
          try {
            ;(n.nodeType, s.nodeType)
          } catch {
            n = null
            break e
          }
          var i = 0,
            l = -1,
            a = -1,
            u = 0,
            d = 0,
            f = e,
            g = null
          t: for (;;) {
            for (
              var p;
              f !== n || (o !== 0 && f.nodeType !== 3) || (l = i + o),
                f !== s || (r !== 0 && f.nodeType !== 3) || (a = i + r),
                f.nodeType === 3 && (i += f.nodeValue.length),
                (p = f.firstChild) !== null;

            )
              ((g = f), (f = p))
            for (;;) {
              if (f === e) break t
              if (
                (g === n && ++u === o && (l = i),
                g === s && ++d === r && (a = i),
                (p = f.nextSibling) !== null)
              )
                break
              ;((f = g), (g = f.parentNode))
            }
            f = p
          }
          n = l === -1 || a === -1 ? null : { start: l, end: a }
        } else n = null
      }
    n = n || { start: 0, end: 0 }
  } else n = null
  for (ou = { focusedElem: e, selectionRange: n }, Bi = !1, V = t; V !== null; )
    if (((t = V), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      ((e.return = t), (V = e))
    else
      for (; V !== null; ) {
        t = V
        try {
          var b = t.alternate
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break
              case 1:
                if (b !== null) {
                  var x = b.memoizedProps,
                    w = b.memoizedState,
                    m = t.stateNode,
                    h = m.getSnapshotBeforeUpdate(t.elementType === t.type ? x : Mt(t.type, x), w)
                  m.__reactInternalSnapshotBeforeUpdate = h
                }
                break
              case 3:
                var v = t.stateNode.containerInfo
                v.nodeType === 1
                  ? (v.textContent = '')
                  : v.nodeType === 9 && v.documentElement && v.removeChild(v.documentElement)
                break
              case 5:
              case 6:
              case 4:
              case 17:
                break
              default:
                throw Error(L(163))
            }
        } catch (k) {
          Ee(t, t.return, k)
        }
        if (((e = t.sibling), e !== null)) {
          ;((e.return = t.return), (V = e))
          break
        }
        V = t.return
      }
  return ((b = of), (of = !1), b)
}
function rs(e, t, n) {
  var r = t.updateQueue
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var o = (r = r.next)
    do {
      if ((o.tag & e) === e) {
        var s = o.destroy
        ;((o.destroy = void 0), s !== void 0 && wu(t, n, s))
      }
      o = o.next
    } while (o !== r)
  }
}
function Cl(e, t) {
  if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
    var n = (t = t.next)
    do {
      if ((n.tag & e) === e) {
        var r = n.create
        n.destroy = r()
      }
      n = n.next
    } while (n !== t)
  }
}
function bu(e) {
  var t = e.ref
  if (t !== null) {
    var n = e.stateNode
    switch (e.tag) {
      case 5:
        e = n
        break
      default:
        e = n
    }
    typeof t == 'function' ? t(e) : (t.current = e)
  }
}
function fm(e) {
  var t = e.alternate
  ;(t !== null && ((e.alternate = null), fm(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 &&
      ((t = e.stateNode),
      t !== null && (delete t[Zt], delete t[ys], delete t[lu], delete t[p0], delete t[h0])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null))
}
function pm(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4
}
function sf(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || pm(e.return)) return null
      e = e.return
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e
      ;((e.child.return = e), (e = e.child))
    }
    if (!(e.flags & 2)) return e.stateNode
  }
}
function Su(e, t, n) {
  var r = e.tag
  if (r === 5 || r === 6)
    ((e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8
            ? ((t = n.parentNode), t.insertBefore(e, n))
            : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = Vi)))
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Su(e, t, n), e = e.sibling; e !== null; ) (Su(e, t, n), (e = e.sibling))
}
function ku(e, t, n) {
  var r = e.tag
  if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e))
  else if (r !== 4 && ((e = e.child), e !== null))
    for (ku(e, t, n), e = e.sibling; e !== null; ) (ku(e, t, n), (e = e.sibling))
}
var ze = null,
  Lt = !1
function Tn(e, t, n) {
  for (n = n.child; n !== null; ) (hm(e, t, n), (n = n.sibling))
}
function hm(e, t, n) {
  if (en && typeof en.onCommitFiberUnmount == 'function')
    try {
      en.onCommitFiberUnmount(gl, n)
    } catch {}
  switch (n.tag) {
    case 5:
      Ve || Jr(n, t)
    case 6:
      var r = ze,
        o = Lt
      ;((ze = null),
        Tn(e, t, n),
        (ze = r),
        (Lt = o),
        ze !== null &&
          (Lt
            ? ((e = ze),
              (n = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : ze.removeChild(n.stateNode)))
      break
    case 18:
      ze !== null &&
        (Lt
          ? ((e = ze),
            (n = n.stateNode),
            e.nodeType === 8 ? fa(e.parentNode, n) : e.nodeType === 1 && fa(e, n),
            fs(e))
          : fa(ze, n.stateNode))
      break
    case 4:
      ;((r = ze),
        (o = Lt),
        (ze = n.stateNode.containerInfo),
        (Lt = !0),
        Tn(e, t, n),
        (ze = r),
        (Lt = o))
      break
    case 0:
    case 11:
    case 14:
    case 15:
      if (!Ve && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
        o = r = r.next
        do {
          var s = o,
            i = s.destroy
          ;((s = s.tag), i !== void 0 && (s & 2 || s & 4) && wu(n, t, i), (o = o.next))
        } while (o !== r)
      }
      Tn(e, t, n)
      break
    case 1:
      if (!Ve && (Jr(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
        try {
          ;((r.props = n.memoizedProps), (r.state = n.memoizedState), r.componentWillUnmount())
        } catch (l) {
          Ee(n, t, l)
        }
      Tn(e, t, n)
      break
    case 21:
      Tn(e, t, n)
      break
    case 22:
      n.mode & 1
        ? ((Ve = (r = Ve) || n.memoizedState !== null), Tn(e, t, n), (Ve = r))
        : Tn(e, t, n)
      break
    default:
      Tn(e, t, n)
  }
}
function lf(e) {
  var t = e.updateQueue
  if (t !== null) {
    e.updateQueue = null
    var n = e.stateNode
    ;(n === null && (n = e.stateNode = new R0()),
      t.forEach(function (r) {
        var o = $0.bind(null, e, r)
        n.has(r) || (n.add(r), r.then(o, o))
      }))
  }
}
function Tt(e, t) {
  var n = t.deletions
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r]
      try {
        var s = e,
          i = t,
          l = i
        e: for (; l !== null; ) {
          switch (l.tag) {
            case 5:
              ;((ze = l.stateNode), (Lt = !1))
              break e
            case 3:
              ;((ze = l.stateNode.containerInfo), (Lt = !0))
              break e
            case 4:
              ;((ze = l.stateNode.containerInfo), (Lt = !0))
              break e
          }
          l = l.return
        }
        if (ze === null) throw Error(L(160))
        ;(hm(s, i, o), (ze = null), (Lt = !1))
        var a = o.alternate
        ;(a !== null && (a.return = null), (o.return = null))
      } catch (u) {
        Ee(o, t, u)
      }
    }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) (mm(t, e), (t = t.sibling))
}
function mm(e, t) {
  var n = e.alternate,
    r = e.flags
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((Tt(t, e), Qt(e), r & 4)) {
        try {
          ;(rs(3, e, e.return), Cl(3, e))
        } catch (x) {
          Ee(e, e.return, x)
        }
        try {
          rs(5, e, e.return)
        } catch (x) {
          Ee(e, e.return, x)
        }
      }
      break
    case 1:
      ;(Tt(t, e), Qt(e), r & 512 && n !== null && Jr(n, n.return))
      break
    case 5:
      if ((Tt(t, e), Qt(e), r & 512 && n !== null && Jr(n, n.return), e.flags & 32)) {
        var o = e.stateNode
        try {
          as(o, '')
        } catch (x) {
          Ee(e, e.return, x)
        }
      }
      if (r & 4 && ((o = e.stateNode), o != null)) {
        var s = e.memoizedProps,
          i = n !== null ? n.memoizedProps : s,
          l = e.type,
          a = e.updateQueue
        if (((e.updateQueue = null), a !== null))
          try {
            ;(l === 'input' && s.type === 'radio' && s.name != null && Dp(o, s), Ka(l, i))
            var u = Ka(l, s)
            for (i = 0; i < a.length; i += 2) {
              var d = a[i],
                f = a[i + 1]
              d === 'style'
                ? Bp(o, f)
                : d === 'dangerouslySetInnerHTML'
                  ? $p(o, f)
                  : d === 'children'
                    ? as(o, f)
                    : Gu(o, d, f, u)
            }
            switch (l) {
              case 'input':
                Ba(o, s)
                break
              case 'textarea':
                zp(o, s)
                break
              case 'select':
                var g = o._wrapperState.wasMultiple
                o._wrapperState.wasMultiple = !!s.multiple
                var p = s.value
                p != null
                  ? no(o, !!s.multiple, p, !1)
                  : g !== !!s.multiple &&
                    (s.defaultValue != null
                      ? no(o, !!s.multiple, s.defaultValue, !0)
                      : no(o, !!s.multiple, s.multiple ? [] : '', !1))
            }
            o[ys] = s
          } catch (x) {
            Ee(e, e.return, x)
          }
      }
      break
    case 6:
      if ((Tt(t, e), Qt(e), r & 4)) {
        if (e.stateNode === null) throw Error(L(162))
        ;((o = e.stateNode), (s = e.memoizedProps))
        try {
          o.nodeValue = s
        } catch (x) {
          Ee(e, e.return, x)
        }
      }
      break
    case 3:
      if ((Tt(t, e), Qt(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
        try {
          fs(t.containerInfo)
        } catch (x) {
          Ee(e, e.return, x)
        }
      break
    case 4:
      ;(Tt(t, e), Qt(e))
      break
    case 13:
      ;(Tt(t, e),
        Qt(e),
        (o = e.child),
        o.flags & 8192 &&
          ((s = o.memoizedState !== null),
          (o.stateNode.isHidden = s),
          !s || (o.alternate !== null && o.alternate.memoizedState !== null) || (jc = Pe())),
        r & 4 && lf(e))
      break
    case 22:
      if (
        ((d = n !== null && n.memoizedState !== null),
        e.mode & 1 ? ((Ve = (u = Ve) || d), Tt(t, e), (Ve = u)) : Tt(t, e),
        Qt(e),
        r & 8192)
      ) {
        if (((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !d && e.mode & 1))
          for (V = e, d = e.child; d !== null; ) {
            for (f = V = d; V !== null; ) {
              switch (((g = V), (p = g.child), g.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  rs(4, g, g.return)
                  break
                case 1:
                  Jr(g, g.return)
                  var b = g.stateNode
                  if (typeof b.componentWillUnmount == 'function') {
                    ;((r = g), (n = g.return))
                    try {
                      ;((t = r),
                        (b.props = t.memoizedProps),
                        (b.state = t.memoizedState),
                        b.componentWillUnmount())
                    } catch (x) {
                      Ee(r, n, x)
                    }
                  }
                  break
                case 5:
                  Jr(g, g.return)
                  break
                case 22:
                  if (g.memoizedState !== null) {
                    uf(f)
                    continue
                  }
              }
              p !== null ? ((p.return = g), (V = p)) : uf(f)
            }
            d = d.sibling
          }
        e: for (d = null, f = e; ; ) {
          if (f.tag === 5) {
            if (d === null) {
              d = f
              try {
                ;((o = f.stateNode),
                  u
                    ? ((s = o.style),
                      typeof s.setProperty == 'function'
                        ? s.setProperty('display', 'none', 'important')
                        : (s.display = 'none'))
                    : ((l = f.stateNode),
                      (a = f.memoizedProps.style),
                      (i = a != null && a.hasOwnProperty('display') ? a.display : null),
                      (l.style.display = Up('display', i))))
              } catch (x) {
                Ee(e, e.return, x)
              }
            }
          } else if (f.tag === 6) {
            if (d === null)
              try {
                f.stateNode.nodeValue = u ? '' : f.memoizedProps
              } catch (x) {
                Ee(e, e.return, x)
              }
          } else if (
            ((f.tag !== 22 && f.tag !== 23) || f.memoizedState === null || f === e) &&
            f.child !== null
          ) {
            ;((f.child.return = f), (f = f.child))
            continue
          }
          if (f === e) break e
          for (; f.sibling === null; ) {
            if (f.return === null || f.return === e) break e
            ;(d === f && (d = null), (f = f.return))
          }
          ;(d === f && (d = null), (f.sibling.return = f.return), (f = f.sibling))
        }
      }
      break
    case 19:
      ;(Tt(t, e), Qt(e), r & 4 && lf(e))
      break
    case 21:
      break
    default:
      ;(Tt(t, e), Qt(e))
  }
}
function Qt(e) {
  var t = e.flags
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (pm(n)) {
            var r = n
            break e
          }
          n = n.return
        }
        throw Error(L(160))
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode
          r.flags & 32 && (as(o, ''), (r.flags &= -33))
          var s = sf(e)
          ku(e, s, o)
          break
        case 3:
        case 4:
          var i = r.stateNode.containerInfo,
            l = sf(e)
          Su(e, l, i)
          break
        default:
          throw Error(L(161))
      }
    } catch (a) {
      Ee(e, e.return, a)
    }
    e.flags &= -3
  }
  t & 4096 && (e.flags &= -4097)
}
function _0(e, t, n) {
  ;((V = e), gm(e))
}
function gm(e, t, n) {
  for (var r = (e.mode & 1) !== 0; V !== null; ) {
    var o = V,
      s = o.child
    if (o.tag === 22 && r) {
      var i = o.memoizedState !== null || fi
      if (!i) {
        var l = o.alternate,
          a = (l !== null && l.memoizedState !== null) || Ve
        l = fi
        var u = Ve
        if (((fi = i), (Ve = a) && !u))
          for (V = o; V !== null; )
            ((i = V),
              (a = i.child),
              i.tag === 22 && i.memoizedState !== null
                ? cf(o)
                : a !== null
                  ? ((a.return = i), (V = a))
                  : cf(o))
        for (; s !== null; ) ((V = s), gm(s), (s = s.sibling))
        ;((V = o), (fi = l), (Ve = u))
      }
      af(e)
    } else o.subtreeFlags & 8772 && s !== null ? ((s.return = o), (V = s)) : af(e)
  }
}
function af(e) {
  for (; V !== null; ) {
    var t = V
    if (t.flags & 8772) {
      var n = t.alternate
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              Ve || Cl(5, t)
              break
            case 1:
              var r = t.stateNode
              if (t.flags & 4 && !Ve)
                if (n === null) r.componentDidMount()
                else {
                  var o = t.elementType === t.type ? n.memoizedProps : Mt(t.type, n.memoizedProps)
                  r.componentDidUpdate(o, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate)
                }
              var s = t.updateQueue
              s !== null && Vd(t, s, r)
              break
            case 3:
              var i = t.updateQueue
              if (i !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode
                      break
                    case 1:
                      n = t.child.stateNode
                  }
                Vd(t, i, n)
              }
              break
            case 5:
              var l = t.stateNode
              if (n === null && t.flags & 4) {
                n = l
                var a = t.memoizedProps
                switch (t.type) {
                  case 'button':
                  case 'input':
                  case 'select':
                  case 'textarea':
                    a.autoFocus && n.focus()
                    break
                  case 'img':
                    a.src && (n.src = a.src)
                }
              }
              break
            case 6:
              break
            case 4:
              break
            case 12:
              break
            case 13:
              if (t.memoizedState === null) {
                var u = t.alternate
                if (u !== null) {
                  var d = u.memoizedState
                  if (d !== null) {
                    var f = d.dehydrated
                    f !== null && fs(f)
                  }
                }
              }
              break
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break
            default:
              throw Error(L(163))
          }
        Ve || (t.flags & 512 && bu(t))
      } catch (g) {
        Ee(t, t.return, g)
      }
    }
    if (t === e) {
      V = null
      break
    }
    if (((n = t.sibling), n !== null)) {
      ;((n.return = t.return), (V = n))
      break
    }
    V = t.return
  }
}
function uf(e) {
  for (; V !== null; ) {
    var t = V
    if (t === e) {
      V = null
      break
    }
    var n = t.sibling
    if (n !== null) {
      ;((n.return = t.return), (V = n))
      break
    }
    V = t.return
  }
}
function cf(e) {
  for (; V !== null; ) {
    var t = V
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return
          try {
            Cl(4, t)
          } catch (a) {
            Ee(t, n, a)
          }
          break
        case 1:
          var r = t.stateNode
          if (typeof r.componentDidMount == 'function') {
            var o = t.return
            try {
              r.componentDidMount()
            } catch (a) {
              Ee(t, o, a)
            }
          }
          var s = t.return
          try {
            bu(t)
          } catch (a) {
            Ee(t, s, a)
          }
          break
        case 5:
          var i = t.return
          try {
            bu(t)
          } catch (a) {
            Ee(t, i, a)
          }
      }
    } catch (a) {
      Ee(t, t.return, a)
    }
    if (t === e) {
      V = null
      break
    }
    var l = t.sibling
    if (l !== null) {
      ;((l.return = t.return), (V = l))
      break
    }
    V = t.return
  }
}
var O0 = Math.ceil,
  nl = kn.ReactCurrentDispatcher,
  Nc = kn.ReactCurrentOwner,
  St = kn.ReactCurrentBatchConfig,
  le = 0,
  Ie = null,
  Te = null,
  Fe = 0,
  ct = 0,
  eo = lr(0),
  Ae = 0,
  ks = null,
  Rr = 0,
  El = 0,
  Pc = 0,
  os = null,
  nt = null,
  jc = 0,
  Eo = 1 / 0,
  dn = null,
  rl = !1,
  Cu = null,
  qn = null,
  pi = !1,
  Hn = null,
  ol = 0,
  ss = 0,
  Eu = null,
  Ri = -1,
  Mi = 0
function qe() {
  return le & 6 ? Pe() : Ri !== -1 ? Ri : (Ri = Pe())
}
function Xn(e) {
  return e.mode & 1
    ? le & 2 && Fe !== 0
      ? Fe & -Fe
      : g0.transition !== null
        ? (Mi === 0 && (Mi = eh()), Mi)
        : ((e = de), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : lh(e.type))), e)
    : 1
}
function Ft(e, t, n, r) {
  if (50 < ss) throw ((ss = 0), (Eu = null), Error(L(185)))
  ;(Ls(e, n, r),
    (!(le & 2) || e !== Ie) &&
      (e === Ie && (!(le & 2) && (El |= n), Ae === 4 && In(e, Fe)),
      it(e, r),
      n === 1 && le === 0 && !(t.mode & 1) && ((Eo = Pe() + 500), bl && ar())))
}
function it(e, t) {
  var n = e.callbackNode
  gv(e, t)
  var r = Ui(e, e === Ie ? Fe : 0)
  if (r === 0) (n !== null && vd(n), (e.callbackNode = null), (e.callbackPriority = 0))
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && vd(n), t === 1))
      (e.tag === 0 ? m0(df.bind(null, e)) : Nh(df.bind(null, e)),
        d0(function () {
          !(le & 6) && ar()
        }),
        (n = null))
    else {
      switch (th(r)) {
        case 1:
          n = ec
          break
        case 4:
          n = Zp
          break
        case 16:
          n = $i
          break
        case 536870912:
          n = Jp
          break
        default:
          n = $i
      }
      n = Cm(n, ym.bind(null, e))
    }
    ;((e.callbackPriority = t), (e.callbackNode = n))
  }
}
function ym(e, t) {
  if (((Ri = -1), (Mi = 0), le & 6)) throw Error(L(327))
  var n = e.callbackNode
  if (lo() && e.callbackNode !== n) return null
  var r = Ui(e, e === Ie ? Fe : 0)
  if (r === 0) return null
  if (r & 30 || r & e.expiredLanes || t) t = sl(e, r)
  else {
    t = r
    var o = le
    le |= 2
    var s = xm()
    ;(Ie !== e || Fe !== t) && ((dn = null), (Eo = Pe() + 500), Er(e, t))
    do
      try {
        I0()
        break
      } catch (l) {
        vm(e, l)
      }
    while (!0)
    ;(pc(), (nl.current = s), (le = o), Te !== null ? (t = 0) : ((Ie = null), (Fe = 0), (t = Ae)))
  }
  if (t !== 0) {
    if ((t === 2 && ((o = Za(e)), o !== 0 && ((r = o), (t = Nu(e, o)))), t === 1))
      throw ((n = ks), Er(e, 0), In(e, r), it(e, Pe()), n)
    if (t === 6) In(e, r)
    else {
      if (
        ((o = e.current.alternate),
        !(r & 30) &&
          !A0(o) &&
          ((t = sl(e, r)), t === 2 && ((s = Za(e)), s !== 0 && ((r = s), (t = Nu(e, s)))), t === 1))
      )
        throw ((n = ks), Er(e, 0), In(e, r), it(e, Pe()), n)
      switch (((e.finishedWork = o), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(L(345))
        case 2:
          hr(e, nt, dn)
          break
        case 3:
          if ((In(e, r), (r & 130023424) === r && ((t = jc + 500 - Pe()), 10 < t))) {
            if (Ui(e, 0) !== 0) break
            if (((o = e.suspendedLanes), (o & r) !== r)) {
              ;(qe(), (e.pingedLanes |= e.suspendedLanes & o))
              break
            }
            e.timeoutHandle = iu(hr.bind(null, e, nt, dn), t)
            break
          }
          hr(e, nt, dn)
          break
        case 4:
          if ((In(e, r), (r & 4194240) === r)) break
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var i = 31 - zt(r)
            ;((s = 1 << i), (i = t[i]), i > o && (o = i), (r &= ~s))
          }
          if (
            ((r = o),
            (r = Pe() - r),
            (r =
              (120 > r
                ? 120
                : 480 > r
                  ? 480
                  : 1080 > r
                    ? 1080
                    : 1920 > r
                      ? 1920
                      : 3e3 > r
                        ? 3e3
                        : 4320 > r
                          ? 4320
                          : 1960 * O0(r / 1960)) - r),
            10 < r)
          ) {
            e.timeoutHandle = iu(hr.bind(null, e, nt, dn), r)
            break
          }
          hr(e, nt, dn)
          break
        case 5:
          hr(e, nt, dn)
          break
        default:
          throw Error(L(329))
      }
    }
  }
  return (it(e, Pe()), e.callbackNode === n ? ym.bind(null, e) : null)
}
function Nu(e, t) {
  var n = os
  return (
    e.current.memoizedState.isDehydrated && (Er(e, t).flags |= 256),
    (e = sl(e, t)),
    e !== 2 && ((t = nt), (nt = n), t !== null && Pu(t)),
    e
  )
}
function Pu(e) {
  nt === null ? (nt = e) : nt.push.apply(nt, e)
}
function A0(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r],
            s = o.getSnapshot
          o = o.value
          try {
            if (!$t(s(), o)) return !1
          } catch {
            return !1
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n))
    else {
      if (t === e) break
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0
        t = t.return
      }
      ;((t.sibling.return = t.return), (t = t.sibling))
    }
  }
  return !0
}
function In(e, t) {
  for (
    t &= ~Pc, t &= ~El, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes;
    0 < t;

  ) {
    var n = 31 - zt(t),
      r = 1 << n
    ;((e[n] = -1), (t &= ~r))
  }
}
function df(e) {
  if (le & 6) throw Error(L(327))
  lo()
  var t = Ui(e, 0)
  if (!(t & 1)) return (it(e, Pe()), null)
  var n = sl(e, t)
  if (e.tag !== 0 && n === 2) {
    var r = Za(e)
    r !== 0 && ((t = r), (n = Nu(e, r)))
  }
  if (n === 1) throw ((n = ks), Er(e, 0), In(e, t), it(e, Pe()), n)
  if (n === 6) throw Error(L(345))
  return (
    (e.finishedWork = e.current.alternate),
    (e.finishedLanes = t),
    hr(e, nt, dn),
    it(e, Pe()),
    null
  )
}
function Tc(e, t) {
  var n = le
  le |= 1
  try {
    return e(t)
  } finally {
    ;((le = n), le === 0 && ((Eo = Pe() + 500), bl && ar()))
  }
}
function Mr(e) {
  Hn !== null && Hn.tag === 0 && !(le & 6) && lo()
  var t = le
  le |= 1
  var n = St.transition,
    r = de
  try {
    if (((St.transition = null), (de = 1), e)) return e()
  } finally {
    ;((de = r), (St.transition = n), (le = t), !(le & 6) && ar())
  }
}
function Rc() {
  ;((ct = eo.current), ye(eo))
}
function Er(e, t) {
  ;((e.finishedWork = null), (e.finishedLanes = 0))
  var n = e.timeoutHandle
  if ((n !== -1 && ((e.timeoutHandle = -1), c0(n)), Te !== null))
    for (n = Te.return; n !== null; ) {
      var r = n
      switch ((cc(r), r.tag)) {
        case 1:
          ;((r = r.type.childContextTypes), r != null && Qi())
          break
        case 3:
          ;(ko(), ye(ot), ye(Qe), xc())
          break
        case 5:
          vc(r)
          break
        case 4:
          ko()
          break
        case 13:
          ye(be)
          break
        case 19:
          ye(be)
          break
        case 10:
          hc(r.type._context)
          break
        case 22:
        case 23:
          Rc()
      }
      n = n.return
    }
  if (
    ((Ie = e),
    (Te = e = Zn(e.current, null)),
    (Fe = ct = t),
    (Ae = 0),
    (ks = null),
    (Pc = El = Rr = 0),
    (nt = os = null),
    gr !== null)
  ) {
    for (t = 0; t < gr.length; t++)
      if (((n = gr[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null
        var o = r.next,
          s = n.pending
        if (s !== null) {
          var i = s.next
          ;((s.next = o), (r.next = i))
        }
        n.pending = r
      }
    gr = null
  }
  return e
}
function vm(e, t) {
  do {
    var n = Te
    try {
      if ((pc(), (Pi.current = tl), el)) {
        for (var r = Se.memoizedState; r !== null; ) {
          var o = r.queue
          ;(o !== null && (o.pending = null), (r = r.next))
        }
        el = !1
      }
      if (
        ((Tr = 0),
        (Le = _e = Se = null),
        (ns = !1),
        (ws = 0),
        (Nc.current = null),
        n === null || n.return === null)
      ) {
        ;((Ae = 1), (ks = t), (Te = null))
        break
      }
      e: {
        var s = e,
          i = n.return,
          l = n,
          a = t
        if (
          ((t = Fe),
          (l.flags |= 32768),
          a !== null && typeof a == 'object' && typeof a.then == 'function')
        ) {
          var u = a,
            d = l,
            f = d.tag
          if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
            var g = d.alternate
            g
              ? ((d.updateQueue = g.updateQueue),
                (d.memoizedState = g.memoizedState),
                (d.lanes = g.lanes))
              : ((d.updateQueue = null), (d.memoizedState = null))
          }
          var p = Xd(i)
          if (p !== null) {
            ;((p.flags &= -257), Zd(p, i, l, s, t), p.mode & 1 && qd(s, u, t), (t = p), (a = u))
            var b = t.updateQueue
            if (b === null) {
              var x = new Set()
              ;(x.add(a), (t.updateQueue = x))
            } else b.add(a)
            break e
          } else {
            if (!(t & 1)) {
              ;(qd(s, u, t), Mc())
              break e
            }
            a = Error(L(426))
          }
        } else if (xe && l.mode & 1) {
          var w = Xd(i)
          if (w !== null) {
            ;(!(w.flags & 65536) && (w.flags |= 256), Zd(w, i, l, s, t), dc(Co(a, l)))
            break e
          }
        }
        ;((s = a = Co(a, l)), Ae !== 4 && (Ae = 2), os === null ? (os = [s]) : os.push(s), (s = i))
        do {
          switch (s.tag) {
            case 3:
              ;((s.flags |= 65536), (t &= -t), (s.lanes |= t))
              var m = tm(s, a, t)
              Wd(s, m)
              break e
            case 1:
              l = a
              var h = s.type,
                v = s.stateNode
              if (
                !(s.flags & 128) &&
                (typeof h.getDerivedStateFromError == 'function' ||
                  (v !== null &&
                    typeof v.componentDidCatch == 'function' &&
                    (qn === null || !qn.has(v))))
              ) {
                ;((s.flags |= 65536), (t &= -t), (s.lanes |= t))
                var k = nm(s, l, t)
                Wd(s, k)
                break e
              }
          }
          s = s.return
        } while (s !== null)
      }
      bm(n)
    } catch (N) {
      ;((t = N), Te === n && n !== null && (Te = n = n.return))
      continue
    }
    break
  } while (!0)
}
function xm() {
  var e = nl.current
  return ((nl.current = tl), e === null ? tl : e)
}
function Mc() {
  ;((Ae === 0 || Ae === 3 || Ae === 2) && (Ae = 4),
    Ie === null || (!(Rr & 268435455) && !(El & 268435455)) || In(Ie, Fe))
}
function sl(e, t) {
  var n = le
  le |= 2
  var r = xm()
  ;(Ie !== e || Fe !== t) && ((dn = null), Er(e, t))
  do
    try {
      L0()
      break
    } catch (o) {
      vm(e, o)
    }
  while (!0)
  if ((pc(), (le = n), (nl.current = r), Te !== null)) throw Error(L(261))
  return ((Ie = null), (Fe = 0), Ae)
}
function L0() {
  for (; Te !== null; ) wm(Te)
}
function I0() {
  for (; Te !== null && !lv(); ) wm(Te)
}
function wm(e) {
  var t = km(e.alternate, e, ct)
  ;((e.memoizedProps = e.pendingProps), t === null ? bm(e) : (Te = t), (Nc.current = null))
}
function bm(e) {
  var t = e
  do {
    var n = t.alternate
    if (((e = t.return), t.flags & 32768)) {
      if (((n = T0(n, t)), n !== null)) {
        ;((n.flags &= 32767), (Te = n))
        return
      }
      if (e !== null) ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null))
      else {
        ;((Ae = 6), (Te = null))
        return
      }
    } else if (((n = j0(n, t, ct)), n !== null)) {
      Te = n
      return
    }
    if (((t = t.sibling), t !== null)) {
      Te = t
      return
    }
    Te = t = e
  } while (t !== null)
  Ae === 0 && (Ae = 5)
}
function hr(e, t, n) {
  var r = de,
    o = St.transition
  try {
    ;((St.transition = null), (de = 1), D0(e, t, n, r))
  } finally {
    ;((St.transition = o), (de = r))
  }
  return null
}
function D0(e, t, n, r) {
  do lo()
  while (Hn !== null)
  if (le & 6) throw Error(L(327))
  n = e.finishedWork
  var o = e.finishedLanes
  if (n === null) return null
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(L(177))
  ;((e.callbackNode = null), (e.callbackPriority = 0))
  var s = n.lanes | n.childLanes
  if (
    (yv(e, s),
    e === Ie && ((Te = Ie = null), (Fe = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      pi ||
      ((pi = !0),
      Cm($i, function () {
        return (lo(), null)
      })),
    (s = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || s)
  ) {
    ;((s = St.transition), (St.transition = null))
    var i = de
    de = 1
    var l = le
    ;((le |= 4),
      (Nc.current = null),
      M0(e, n),
      mm(n, e),
      r0(ou),
      (Bi = !!ru),
      (ou = ru = null),
      (e.current = n),
      _0(n),
      av(),
      (le = l),
      (de = i),
      (St.transition = s))
  } else e.current = n
  if (
    (pi && ((pi = !1), (Hn = e), (ol = o)),
    (s = e.pendingLanes),
    s === 0 && (qn = null),
    dv(n.stateNode),
    it(e, Pe()),
    t !== null)
  )
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      ((o = t[n]), r(o.value, { componentStack: o.stack, digest: o.digest }))
  if (rl) throw ((rl = !1), (e = Cu), (Cu = null), e)
  return (
    ol & 1 && e.tag !== 0 && lo(),
    (s = e.pendingLanes),
    s & 1 ? (e === Eu ? ss++ : ((ss = 0), (Eu = e))) : (ss = 0),
    ar(),
    null
  )
}
function lo() {
  if (Hn !== null) {
    var e = th(ol),
      t = St.transition,
      n = de
    try {
      if (((St.transition = null), (de = 16 > e ? 16 : e), Hn === null)) var r = !1
      else {
        if (((e = Hn), (Hn = null), (ol = 0), le & 6)) throw Error(L(331))
        var o = le
        for (le |= 4, V = e.current; V !== null; ) {
          var s = V,
            i = s.child
          if (V.flags & 16) {
            var l = s.deletions
            if (l !== null) {
              for (var a = 0; a < l.length; a++) {
                var u = l[a]
                for (V = u; V !== null; ) {
                  var d = V
                  switch (d.tag) {
                    case 0:
                    case 11:
                    case 15:
                      rs(8, d, s)
                  }
                  var f = d.child
                  if (f !== null) ((f.return = d), (V = f))
                  else
                    for (; V !== null; ) {
                      d = V
                      var g = d.sibling,
                        p = d.return
                      if ((fm(d), d === u)) {
                        V = null
                        break
                      }
                      if (g !== null) {
                        ;((g.return = p), (V = g))
                        break
                      }
                      V = p
                    }
                }
              }
              var b = s.alternate
              if (b !== null) {
                var x = b.child
                if (x !== null) {
                  b.child = null
                  do {
                    var w = x.sibling
                    ;((x.sibling = null), (x = w))
                  } while (x !== null)
                }
              }
              V = s
            }
          }
          if (s.subtreeFlags & 2064 && i !== null) ((i.return = s), (V = i))
          else
            e: for (; V !== null; ) {
              if (((s = V), s.flags & 2048))
                switch (s.tag) {
                  case 0:
                  case 11:
                  case 15:
                    rs(9, s, s.return)
                }
              var m = s.sibling
              if (m !== null) {
                ;((m.return = s.return), (V = m))
                break e
              }
              V = s.return
            }
        }
        var h = e.current
        for (V = h; V !== null; ) {
          i = V
          var v = i.child
          if (i.subtreeFlags & 2064 && v !== null) ((v.return = i), (V = v))
          else
            e: for (i = h; V !== null; ) {
              if (((l = V), l.flags & 2048))
                try {
                  switch (l.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Cl(9, l)
                  }
                } catch (N) {
                  Ee(l, l.return, N)
                }
              if (l === i) {
                V = null
                break e
              }
              var k = l.sibling
              if (k !== null) {
                ;((k.return = l.return), (V = k))
                break e
              }
              V = l.return
            }
        }
        if (((le = o), ar(), en && typeof en.onPostCommitFiberRoot == 'function'))
          try {
            en.onPostCommitFiberRoot(gl, e)
          } catch {}
        r = !0
      }
      return r
    } finally {
      ;((de = n), (St.transition = t))
    }
  }
  return !1
}
function ff(e, t, n) {
  ;((t = Co(n, t)),
    (t = tm(e, t, 1)),
    (e = Gn(e, t, 1)),
    (t = qe()),
    e !== null && (Ls(e, 1, t), it(e, t)))
}
function Ee(e, t, n) {
  if (e.tag === 3) ff(e, e, n)
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        ff(t, e, n)
        break
      } else if (t.tag === 1) {
        var r = t.stateNode
        if (
          typeof t.type.getDerivedStateFromError == 'function' ||
          (typeof r.componentDidCatch == 'function' && (qn === null || !qn.has(r)))
        ) {
          ;((e = Co(n, e)),
            (e = nm(t, e, 1)),
            (t = Gn(t, e, 1)),
            (e = qe()),
            t !== null && (Ls(t, 1, e), it(t, e)))
          break
        }
      }
      t = t.return
    }
}
function z0(e, t, n) {
  var r = e.pingCache
  ;(r !== null && r.delete(t),
    (t = qe()),
    (e.pingedLanes |= e.suspendedLanes & n),
    Ie === e &&
      (Fe & n) === n &&
      (Ae === 4 || (Ae === 3 && (Fe & 130023424) === Fe && 500 > Pe() - jc) ? Er(e, 0) : (Pc |= n)),
    it(e, t))
}
function Sm(e, t) {
  t === 0 && (e.mode & 1 ? ((t = ri), (ri <<= 1), !(ri & 130023424) && (ri = 4194304)) : (t = 1))
  var n = qe()
  ;((e = xn(e, t)), e !== null && (Ls(e, t, n), it(e, n)))
}
function F0(e) {
  var t = e.memoizedState,
    n = 0
  ;(t !== null && (n = t.retryLane), Sm(e, n))
}
function $0(e, t) {
  var n = 0
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        o = e.memoizedState
      o !== null && (n = o.retryLane)
      break
    case 19:
      r = e.stateNode
      break
    default:
      throw Error(L(314))
  }
  ;(r !== null && r.delete(t), Sm(e, n))
}
var km
km = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || ot.current) rt = !0
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return ((rt = !1), P0(e, t, n))
      rt = !!(e.flags & 131072)
    }
  else ((rt = !1), xe && t.flags & 1048576 && Ph(t, Gi, t.index))
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type
      ;(Ti(e, t), (e = t.pendingProps))
      var o = wo(t, Qe.current)
      ;(io(t, n), (o = bc(null, t, r, e, o, n)))
      var s = Sc()
      return (
        (t.flags |= 1),
        typeof o == 'object' && o !== null && typeof o.render == 'function' && o.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            st(r) ? ((s = !0), Ki(t)) : (s = !1),
            (t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null),
            gc(t),
            (o.updater = kl),
            (t.stateNode = o),
            (o._reactInternals = t),
            pu(t, r, e, n),
            (t = gu(null, t, r, !0, s, n)))
          : ((t.tag = 0), xe && s && uc(t), Ye(null, t, o, n), (t = t.child)),
        t
      )
    case 16:
      r = t.elementType
      e: {
        switch (
          (Ti(e, t),
          (e = t.pendingProps),
          (o = r._init),
          (r = o(r._payload)),
          (t.type = r),
          (o = t.tag = B0(r)),
          (e = Mt(r, e)),
          o)
        ) {
          case 0:
            t = mu(null, t, r, e, n)
            break e
          case 1:
            t = tf(null, t, r, e, n)
            break e
          case 11:
            t = Jd(null, t, r, e, n)
            break e
          case 14:
            t = ef(null, t, r, Mt(r.type, e), n)
            break e
        }
        throw Error(L(306, r, ''))
      }
      return t
    case 0:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Mt(r, o)),
        mu(e, t, r, o, n)
      )
    case 1:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Mt(r, o)),
        tf(e, t, r, o, n)
      )
    case 3:
      e: {
        if ((im(t), e === null)) throw Error(L(387))
        ;((r = t.pendingProps), (s = t.memoizedState), (o = s.element), Oh(e, t), Zi(t, r, null, n))
        var i = t.memoizedState
        if (((r = i.element), s.isDehydrated))
          if (
            ((s = {
              element: r,
              isDehydrated: !1,
              cache: i.cache,
              pendingSuspenseBoundaries: i.pendingSuspenseBoundaries,
              transitions: i.transitions,
            }),
            (t.updateQueue.baseState = s),
            (t.memoizedState = s),
            t.flags & 256)
          ) {
            ;((o = Co(Error(L(423)), t)), (t = nf(e, t, r, n, o)))
            break e
          } else if (r !== o) {
            ;((o = Co(Error(L(424)), t)), (t = nf(e, t, r, n, o)))
            break e
          } else
            for (
              ft = Yn(t.stateNode.containerInfo.firstChild),
                pt = t,
                xe = !0,
                It = null,
                n = Mh(t, null, r, n),
                t.child = n;
              n;

            )
              ((n.flags = (n.flags & -3) | 4096), (n = n.sibling))
        else {
          if ((bo(), r === o)) {
            t = wn(e, t, n)
            break e
          }
          Ye(e, t, r, n)
        }
        t = t.child
      }
      return t
    case 5:
      return (
        Ah(t),
        e === null && cu(t),
        (r = t.type),
        (o = t.pendingProps),
        (s = e !== null ? e.memoizedProps : null),
        (i = o.children),
        su(r, o) ? (i = null) : s !== null && su(r, s) && (t.flags |= 32),
        sm(e, t),
        Ye(e, t, i, n),
        t.child
      )
    case 6:
      return (e === null && cu(t), null)
    case 13:
      return lm(e, t, n)
    case 4:
      return (
        yc(t, t.stateNode.containerInfo),
        (r = t.pendingProps),
        e === null ? (t.child = So(t, null, r, n)) : Ye(e, t, r, n),
        t.child
      )
    case 11:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Mt(r, o)),
        Jd(e, t, r, o, n)
      )
    case 7:
      return (Ye(e, t, t.pendingProps, n), t.child)
    case 8:
      return (Ye(e, t, t.pendingProps.children, n), t.child)
    case 12:
      return (Ye(e, t, t.pendingProps.children, n), t.child)
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (o = t.pendingProps),
          (s = t.memoizedProps),
          (i = o.value),
          he(qi, r._currentValue),
          (r._currentValue = i),
          s !== null)
        )
          if ($t(s.value, i)) {
            if (s.children === o.children && !ot.current) {
              t = wn(e, t, n)
              break e
            }
          } else
            for (s = t.child, s !== null && (s.return = t); s !== null; ) {
              var l = s.dependencies
              if (l !== null) {
                i = s.child
                for (var a = l.firstContext; a !== null; ) {
                  if (a.context === r) {
                    if (s.tag === 1) {
                      ;((a = gn(-1, n & -n)), (a.tag = 2))
                      var u = s.updateQueue
                      if (u !== null) {
                        u = u.shared
                        var d = u.pending
                        ;(d === null ? (a.next = a) : ((a.next = d.next), (d.next = a)),
                          (u.pending = a))
                      }
                    }
                    ;((s.lanes |= n),
                      (a = s.alternate),
                      a !== null && (a.lanes |= n),
                      du(s.return, n, t),
                      (l.lanes |= n))
                    break
                  }
                  a = a.next
                }
              } else if (s.tag === 10) i = s.type === t.type ? null : s.child
              else if (s.tag === 18) {
                if (((i = s.return), i === null)) throw Error(L(341))
                ;((i.lanes |= n),
                  (l = i.alternate),
                  l !== null && (l.lanes |= n),
                  du(i, n, t),
                  (i = s.sibling))
              } else i = s.child
              if (i !== null) i.return = s
              else
                for (i = s; i !== null; ) {
                  if (i === t) {
                    i = null
                    break
                  }
                  if (((s = i.sibling), s !== null)) {
                    ;((s.return = i.return), (i = s))
                    break
                  }
                  i = i.return
                }
              s = i
            }
        ;(Ye(e, t, o.children, n), (t = t.child))
      }
      return t
    case 9:
      return (
        (o = t.type),
        (r = t.pendingProps.children),
        io(t, n),
        (o = kt(o)),
        (r = r(o)),
        (t.flags |= 1),
        Ye(e, t, r, n),
        t.child
      )
    case 14:
      return ((r = t.type), (o = Mt(r, t.pendingProps)), (o = Mt(r.type, o)), ef(e, t, r, o, n))
    case 15:
      return rm(e, t, t.type, t.pendingProps, n)
    case 17:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Mt(r, o)),
        Ti(e, t),
        (t.tag = 1),
        st(r) ? ((e = !0), Ki(t)) : (e = !1),
        io(t, n),
        em(t, r, o),
        pu(t, r, o, n),
        gu(null, t, r, !0, e, n)
      )
    case 19:
      return am(e, t, n)
    case 22:
      return om(e, t, n)
  }
  throw Error(L(156, t.tag))
}
function Cm(e, t) {
  return Xp(e, t)
}
function U0(e, t, n, r) {
  ;((this.tag = e),
    (this.key = n),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null))
}
function bt(e, t, n, r) {
  return new U0(e, t, n, r)
}
function _c(e) {
  return ((e = e.prototype), !(!e || !e.isReactComponent))
}
function B0(e) {
  if (typeof e == 'function') return _c(e) ? 1 : 0
  if (e != null) {
    if (((e = e.$$typeof), e === Xu)) return 11
    if (e === Zu) return 14
  }
  return 2
}
function Zn(e, t) {
  var n = e.alternate
  return (
    n === null
      ? ((n = bt(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t),
        (n.type = e.type),
        (n.flags = 0),
        (n.subtreeFlags = 0),
        (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  )
}
function _i(e, t, n, r, o, s) {
  var i = 2
  if (((r = e), typeof e == 'function')) _c(e) && (i = 1)
  else if (typeof e == 'string') i = 5
  else
    e: switch (e) {
      case Wr:
        return Nr(n.children, o, s, t)
      case qu:
        ;((i = 8), (o |= 8))
        break
      case Da:
        return ((e = bt(12, n, t, o | 2)), (e.elementType = Da), (e.lanes = s), e)
      case za:
        return ((e = bt(13, n, t, o)), (e.elementType = za), (e.lanes = s), e)
      case Fa:
        return ((e = bt(19, n, t, o)), (e.elementType = Fa), (e.lanes = s), e)
      case Ap:
        return Nl(n, o, s, t)
      default:
        if (typeof e == 'object' && e !== null)
          switch (e.$$typeof) {
            case _p:
              i = 10
              break e
            case Op:
              i = 9
              break e
            case Xu:
              i = 11
              break e
            case Zu:
              i = 14
              break e
            case On:
              ;((i = 16), (r = null))
              break e
          }
        throw Error(L(130, e == null ? e : typeof e, ''))
    }
  return ((t = bt(i, n, t, o)), (t.elementType = e), (t.type = r), (t.lanes = s), t)
}
function Nr(e, t, n, r) {
  return ((e = bt(7, e, r, t)), (e.lanes = n), e)
}
function Nl(e, t, n, r) {
  return (
    (e = bt(22, e, r, t)),
    (e.elementType = Ap),
    (e.lanes = n),
    (e.stateNode = { isHidden: !1 }),
    e
  )
}
function wa(e, t, n) {
  return ((e = bt(6, e, null, t)), (e.lanes = n), e)
}
function ba(e, t, n) {
  return (
    (t = bt(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    }),
    t
  )
}
function H0(e, t, n, r, o) {
  ;((this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = ta(0)),
    (this.expirationTimes = ta(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = ta(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = o),
    (this.mutableSourceEagerHydrationData = null))
}
function Oc(e, t, n, r, o, s, i, l, a) {
  return (
    (e = new H0(e, t, n, l, a)),
    t === 1 ? ((t = 1), s === !0 && (t |= 8)) : (t = 0),
    (s = bt(3, null, null, t)),
    (e.current = s),
    (s.stateNode = e),
    (s.memoizedState = {
      element: r,
      isDehydrated: n,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    }),
    gc(s),
    e
  )
}
function W0(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null
  return {
    $$typeof: Hr,
    key: r == null ? null : '' + r,
    children: e,
    containerInfo: t,
    implementation: n,
  }
}
function Em(e) {
  if (!e) return tr
  e = e._reactInternals
  e: {
    if (Ar(e) !== e || e.tag !== 1) throw Error(L(170))
    var t = e
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context
          break e
        case 1:
          if (st(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext
            break e
          }
      }
      t = t.return
    } while (t !== null)
    throw Error(L(171))
  }
  if (e.tag === 1) {
    var n = e.type
    if (st(n)) return Eh(e, n, t)
  }
  return t
}
function Nm(e, t, n, r, o, s, i, l, a) {
  return (
    (e = Oc(n, r, !0, e, o, s, i, l, a)),
    (e.context = Em(null)),
    (n = e.current),
    (r = qe()),
    (o = Xn(n)),
    (s = gn(r, o)),
    (s.callback = t ?? null),
    Gn(n, s, o),
    (e.current.lanes = o),
    Ls(e, o, r),
    it(e, r),
    e
  )
}
function Pl(e, t, n, r) {
  var o = t.current,
    s = qe(),
    i = Xn(o)
  return (
    (n = Em(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = gn(s, i)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = Gn(o, t, i)),
    e !== null && (Ft(e, o, i, s), Ni(e, o, i)),
    i
  )
}
function il(e) {
  if (((e = e.current), !e.child)) return null
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode
    default:
      return e.child.stateNode
  }
}
function pf(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane
    e.retryLane = n !== 0 && n < t ? n : t
  }
}
function Ac(e, t) {
  ;(pf(e, t), (e = e.alternate) && pf(e, t))
}
function V0() {
  return null
}
var Pm =
  typeof reportError == 'function'
    ? reportError
    : function (e) {
        console.error(e)
      }
function Lc(e) {
  this._internalRoot = e
}
jl.prototype.render = Lc.prototype.render = function (e) {
  var t = this._internalRoot
  if (t === null) throw Error(L(409))
  Pl(e, t, null, null)
}
jl.prototype.unmount = Lc.prototype.unmount = function () {
  var e = this._internalRoot
  if (e !== null) {
    this._internalRoot = null
    var t = e.containerInfo
    ;(Mr(function () {
      Pl(null, e, null, null)
    }),
      (t[vn] = null))
  }
}
function jl(e) {
  this._internalRoot = e
}
jl.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = oh()
    e = { blockedOn: null, target: e, priority: t }
    for (var n = 0; n < Ln.length && t !== 0 && t < Ln[n].priority; n++);
    ;(Ln.splice(n, 0, e), n === 0 && ih(e))
  }
}
function Ic(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11))
}
function Tl(e) {
  return !(
    !e ||
    (e.nodeType !== 1 &&
      e.nodeType !== 9 &&
      e.nodeType !== 11 &&
      (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
  )
}
function hf() {}
function Q0(e, t, n, r, o) {
  if (o) {
    if (typeof r == 'function') {
      var s = r
      r = function () {
        var u = il(i)
        s.call(u)
      }
    }
    var i = Nm(t, r, e, 0, null, !1, !1, '', hf)
    return (
      (e._reactRootContainer = i),
      (e[vn] = i.current),
      ms(e.nodeType === 8 ? e.parentNode : e),
      Mr(),
      i
    )
  }
  for (; (o = e.lastChild); ) e.removeChild(o)
  if (typeof r == 'function') {
    var l = r
    r = function () {
      var u = il(a)
      l.call(u)
    }
  }
  var a = Oc(e, 0, !1, null, null, !1, !1, '', hf)
  return (
    (e._reactRootContainer = a),
    (e[vn] = a.current),
    ms(e.nodeType === 8 ? e.parentNode : e),
    Mr(function () {
      Pl(t, a, n, r)
    }),
    a
  )
}
function Rl(e, t, n, r, o) {
  var s = n._reactRootContainer
  if (s) {
    var i = s
    if (typeof o == 'function') {
      var l = o
      o = function () {
        var a = il(i)
        l.call(a)
      }
    }
    Pl(t, i, e, o)
  } else i = Q0(n, t, e, o, r)
  return il(i)
}
nh = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode
      if (t.current.memoizedState.isDehydrated) {
        var n = Go(t.pendingLanes)
        n !== 0 && (tc(t, n | 1), it(t, Pe()), !(le & 6) && ((Eo = Pe() + 500), ar()))
      }
      break
    case 13:
      ;(Mr(function () {
        var r = xn(e, 1)
        if (r !== null) {
          var o = qe()
          Ft(r, e, 1, o)
        }
      }),
        Ac(e, 1))
  }
}
nc = function (e) {
  if (e.tag === 13) {
    var t = xn(e, 134217728)
    if (t !== null) {
      var n = qe()
      Ft(t, e, 134217728, n)
    }
    Ac(e, 134217728)
  }
}
rh = function (e) {
  if (e.tag === 13) {
    var t = Xn(e),
      n = xn(e, t)
    if (n !== null) {
      var r = qe()
      Ft(n, e, t, r)
    }
    Ac(e, t)
  }
}
oh = function () {
  return de
}
sh = function (e, t) {
  var n = de
  try {
    return ((de = e), t())
  } finally {
    de = n
  }
}
Ga = function (e, t, n) {
  switch (t) {
    case 'input':
      if ((Ba(e, n), (t = n.name), n.type === 'radio' && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode
        for (
          n = n.querySelectorAll('input[name=' + JSON.stringify('' + t) + '][type="radio"]'), t = 0;
          t < n.length;
          t++
        ) {
          var r = n[t]
          if (r !== e && r.form === e.form) {
            var o = wl(r)
            if (!o) throw Error(L(90))
            ;(Ip(r), Ba(r, o))
          }
        }
      }
      break
    case 'textarea':
      zp(e, n)
      break
    case 'select':
      ;((t = n.value), t != null && no(e, !!n.multiple, t, !1))
  }
}
Vp = Tc
Qp = Mr
var K0 = { usingClientEntryPoint: !1, Events: [Ds, Yr, wl, Hp, Wp, Tc] },
  Wo = {
    findFiberByHostInstance: mr,
    bundleType: 0,
    version: '18.3.1',
    rendererPackageName: 'react-dom',
  },
  Y0 = {
    bundleType: Wo.bundleType,
    version: Wo.version,
    rendererPackageName: Wo.rendererPackageName,
    rendererConfig: Wo.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: kn.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return ((e = Gp(e)), e === null ? null : e.stateNode)
    },
    findFiberByHostInstance: Wo.findFiberByHostInstance || V0,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
  }
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
  var hi = __REACT_DEVTOOLS_GLOBAL_HOOK__
  if (!hi.isDisabled && hi.supportsFiber)
    try {
      ;((gl = hi.inject(Y0)), (en = hi))
    } catch {}
}
gt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = K0
gt.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null
  if (!Ic(t)) throw Error(L(200))
  return W0(e, t, null, n)
}
gt.createRoot = function (e, t) {
  if (!Ic(e)) throw Error(L(299))
  var n = !1,
    r = '',
    o = Pm
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
    (t = Oc(e, 1, !1, null, null, n, !1, r, o)),
    (e[vn] = t.current),
    ms(e.nodeType === 8 ? e.parentNode : e),
    new Lc(t)
  )
}
gt.findDOMNode = function (e) {
  if (e == null) return null
  if (e.nodeType === 1) return e
  var t = e._reactInternals
  if (t === void 0)
    throw typeof e.render == 'function'
      ? Error(L(188))
      : ((e = Object.keys(e).join(',')), Error(L(268, e)))
  return ((e = Gp(t)), (e = e === null ? null : e.stateNode), e)
}
gt.flushSync = function (e) {
  return Mr(e)
}
gt.hydrate = function (e, t, n) {
  if (!Tl(t)) throw Error(L(200))
  return Rl(null, e, t, !0, n)
}
gt.hydrateRoot = function (e, t, n) {
  if (!Ic(e)) throw Error(L(405))
  var r = (n != null && n.hydratedSources) || null,
    o = !1,
    s = '',
    i = Pm
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (o = !0),
      n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (i = n.onRecoverableError)),
    (t = Nm(t, null, e, 1, n ?? null, o, !1, s, i)),
    (e[vn] = t.current),
    ms(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      ((n = r[e]),
        (o = n._getVersion),
        (o = o(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, o])
          : t.mutableSourceEagerHydrationData.push(n, o))
  return new jl(t)
}
gt.render = function (e, t, n) {
  if (!Tl(t)) throw Error(L(200))
  return Rl(null, e, t, !1, n)
}
gt.unmountComponentAtNode = function (e) {
  if (!Tl(e)) throw Error(L(40))
  return e._reactRootContainer
    ? (Mr(function () {
        Rl(null, null, e, !1, function () {
          ;((e._reactRootContainer = null), (e[vn] = null))
        })
      }),
      !0)
    : !1
}
gt.unstable_batchedUpdates = Tc
gt.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!Tl(n)) throw Error(L(200))
  if (e == null || e._reactInternals === void 0) throw Error(L(38))
  return Rl(e, t, n, !1, r)
}
gt.version = '18.3.1-next-f1338f8080-20240426'
function jm() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(jm)
    } catch (e) {
      console.error(e)
    }
}
;(jm(), (jp.exports = gt))
var Fs = jp.exports
const Tm = mp(Fs)
var Rm,
  mf = Fs
;((Rm = mf.createRoot), mf.hydrateRoot)
const G0 = 1,
  q0 = 1e6
let Sa = 0
function X0() {
  return ((Sa = (Sa + 1) % Number.MAX_SAFE_INTEGER), Sa.toString())
}
const ka = new Map(),
  gf = e => {
    if (ka.has(e)) return
    const t = setTimeout(() => {
      ;(ka.delete(e), is({ type: 'REMOVE_TOAST', toastId: e }))
    }, q0)
    ka.set(e, t)
  },
  Z0 = (e, t) => {
    switch (t.type) {
      case 'ADD_TOAST':
        return { ...e, toasts: [t.toast, ...e.toasts].slice(0, G0) }
      case 'UPDATE_TOAST':
        return { ...e, toasts: e.toasts.map(n => (n.id === t.toast.id ? { ...n, ...t.toast } : n)) }
      case 'DISMISS_TOAST': {
        const { toastId: n } = t
        return (
          n
            ? gf(n)
            : e.toasts.forEach(r => {
                gf(r.id)
              }),
          { ...e, toasts: e.toasts.map(r => (r.id === n || n === void 0 ? { ...r, open: !1 } : r)) }
        )
      }
      case 'REMOVE_TOAST':
        return t.toastId === void 0
          ? { ...e, toasts: [] }
          : { ...e, toasts: e.toasts.filter(n => n.id !== t.toastId) }
    }
  },
  Oi = []
let Ai = { toasts: [] }
function is(e) {
  ;((Ai = Z0(Ai, e)),
    Oi.forEach(t => {
      t(Ai)
    }))
}
function J0({ ...e }) {
  const t = X0(),
    n = o => is({ type: 'UPDATE_TOAST', toast: { ...o, id: t } }),
    r = () => is({ type: 'DISMISS_TOAST', toastId: t })
  return (
    is({
      type: 'ADD_TOAST',
      toast: {
        ...e,
        id: t,
        open: !0,
        onOpenChange: o => {
          o || r()
        },
      },
    }),
    { id: t, dismiss: r, update: n }
  )
}
function ex() {
  const [e, t] = y.useState(Ai)
  return (
    y.useEffect(
      () => (
        Oi.push(t),
        () => {
          const n = Oi.indexOf(t)
          n > -1 && Oi.splice(n, 1)
        }
      ),
      [e]
    ),
    { ...e, toast: J0, dismiss: n => is({ type: 'DISMISS_TOAST', toastId: n }) }
  )
}
function Oe(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function (o) {
    if ((e == null || e(o), n === !1 || !o.defaultPrevented)) return t == null ? void 0 : t(o)
  }
}
function yf(e, t) {
  if (typeof e == 'function') return e(t)
  e != null && (e.current = t)
}
function Mm(...e) {
  return t => {
    let n = !1
    const r = e.map(o => {
      const s = yf(o, t)
      return (!n && typeof s == 'function' && (n = !0), s)
    })
    if (n)
      return () => {
        for (let o = 0; o < r.length; o++) {
          const s = r[o]
          typeof s == 'function' ? s() : yf(e[o], null)
        }
      }
  }
}
function Ut(...e) {
  return y.useCallback(Mm(...e), e)
}
function Ml(e, t = []) {
  let n = []
  function r(s, i) {
    const l = y.createContext(i),
      a = n.length
    n = [...n, i]
    const u = f => {
      var m
      const { scope: g, children: p, ...b } = f,
        x = ((m = g == null ? void 0 : g[e]) == null ? void 0 : m[a]) || l,
        w = y.useMemo(() => b, Object.values(b))
      return c.jsx(x.Provider, { value: w, children: p })
    }
    u.displayName = s + 'Provider'
    function d(f, g) {
      var x
      const p = ((x = g == null ? void 0 : g[e]) == null ? void 0 : x[a]) || l,
        b = y.useContext(p)
      if (b) return b
      if (i !== void 0) return i
      throw new Error(`\`${f}\` must be used within \`${s}\``)
    }
    return [u, d]
  }
  const o = () => {
    const s = n.map(i => y.createContext(i))
    return function (l) {
      const a = (l == null ? void 0 : l[e]) || s
      return y.useMemo(() => ({ [`__scope${e}`]: { ...l, [e]: a } }), [l, a])
    }
  }
  return ((o.scopeName = e), [r, tx(o, ...t)])
}
function tx(...e) {
  const t = e[0]
  if (e.length === 1) return t
  const n = () => {
    const r = e.map(o => ({ useScope: o(), scopeName: o.scopeName }))
    return function (s) {
      const i = r.reduce((l, { useScope: a, scopeName: u }) => {
        const f = a(s)[`__scope${u}`]
        return { ...l, ...f }
      }, {})
      return y.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i])
    }
  }
  return ((n.scopeName = t.scopeName), n)
}
function ju(e) {
  const t = nx(e),
    n = y.forwardRef((r, o) => {
      const { children: s, ...i } = r,
        l = y.Children.toArray(s),
        a = l.find(ox)
      if (a) {
        const u = a.props.children,
          d = l.map(f =>
            f === a
              ? y.Children.count(u) > 1
                ? y.Children.only(null)
                : y.isValidElement(u)
                  ? u.props.children
                  : null
              : f
          )
        return c.jsx(t, {
          ...i,
          ref: o,
          children: y.isValidElement(u) ? y.cloneElement(u, void 0, d) : null,
        })
      }
      return c.jsx(t, { ...i, ref: o, children: s })
    })
  return ((n.displayName = `${e}.Slot`), n)
}
function nx(e) {
  const t = y.forwardRef((n, r) => {
    const { children: o, ...s } = n
    if (y.isValidElement(o)) {
      const i = ix(o),
        l = sx(s, o.props)
      return (o.type !== y.Fragment && (l.ref = r ? Mm(r, i) : i), y.cloneElement(o, l))
    }
    return y.Children.count(o) > 1 ? y.Children.only(null) : null
  })
  return ((t.displayName = `${e}.SlotClone`), t)
}
var _m = Symbol('radix.slottable')
function rx(e) {
  const t = ({ children: n }) => c.jsx(c.Fragment, { children: n })
  return ((t.displayName = `${e}.Slottable`), (t.__radixId = _m), t)
}
function ox(e) {
  return (
    y.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === _m
  )
}
function sx(e, t) {
  const n = { ...t }
  for (const r in t) {
    const o = e[r],
      s = t[r]
    ;/^on[A-Z]/.test(r)
      ? o && s
        ? (n[r] = (...l) => {
            const a = s(...l)
            return (o(...l), a)
          })
        : o && (n[r] = o)
      : r === 'style'
        ? (n[r] = { ...o, ...s })
        : r === 'className' && (n[r] = [o, s].filter(Boolean).join(' '))
  }
  return { ...e, ...n }
}
function ix(e) {
  var r, o
  let t = (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning
  return n
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref)
}
function lx(e) {
  const t = e + 'CollectionProvider',
    [n, r] = Ml(t),
    [o, s] = n(t, { collectionRef: { current: null }, itemMap: new Map() }),
    i = x => {
      const { scope: w, children: m } = x,
        h = F.useRef(null),
        v = F.useRef(new Map()).current
      return c.jsx(o, { scope: w, itemMap: v, collectionRef: h, children: m })
    }
  i.displayName = t
  const l = e + 'CollectionSlot',
    a = ju(l),
    u = F.forwardRef((x, w) => {
      const { scope: m, children: h } = x,
        v = s(l, m),
        k = Ut(w, v.collectionRef)
      return c.jsx(a, { ref: k, children: h })
    })
  u.displayName = l
  const d = e + 'CollectionItemSlot',
    f = 'data-radix-collection-item',
    g = ju(d),
    p = F.forwardRef((x, w) => {
      const { scope: m, children: h, ...v } = x,
        k = F.useRef(null),
        N = Ut(w, k),
        j = s(d, m)
      return (
        F.useEffect(() => (j.itemMap.set(k, { ref: k, ...v }), () => void j.itemMap.delete(k))),
        c.jsx(g, { [f]: '', ref: N, children: h })
      )
    })
  p.displayName = d
  function b(x) {
    const w = s(e + 'CollectionConsumer', x)
    return F.useCallback(() => {
      const h = w.collectionRef.current
      if (!h) return []
      const v = Array.from(h.querySelectorAll(`[${f}]`))
      return Array.from(w.itemMap.values()).sort(
        (j, P) => v.indexOf(j.ref.current) - v.indexOf(P.ref.current)
      )
    }, [w.collectionRef, w.itemMap])
  }
  return [{ Provider: i, Slot: u, ItemSlot: p }, b, r]
}
var ax = [
    'a',
    'button',
    'div',
    'form',
    'h2',
    'h3',
    'img',
    'input',
    'label',
    'li',
    'nav',
    'ol',
    'p',
    'select',
    'span',
    'svg',
    'ul',
  ],
  lt = ax.reduce((e, t) => {
    const n = ju(`Primitive.${t}`),
      r = y.forwardRef((o, s) => {
        const { asChild: i, ...l } = o,
          a = i ? n : t
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0),
          c.jsx(a, { ...l, ref: s })
        )
      })
    return ((r.displayName = `Primitive.${t}`), { ...e, [t]: r })
  }, {})
function Om(e, t) {
  e && Fs.flushSync(() => e.dispatchEvent(t))
}
function nr(e) {
  const t = y.useRef(e)
  return (
    y.useEffect(() => {
      t.current = e
    }),
    y.useMemo(
      () =>
        (...n) => {
          var r
          return (r = t.current) == null ? void 0 : r.call(t, ...n)
        },
      []
    )
  )
}
function ux(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = nr(e)
  y.useEffect(() => {
    const r = o => {
      o.key === 'Escape' && n(o)
    }
    return (
      t.addEventListener('keydown', r, { capture: !0 }),
      () => t.removeEventListener('keydown', r, { capture: !0 })
    )
  }, [n, t])
}
var cx = 'DismissableLayer',
  Tu = 'dismissableLayer.update',
  dx = 'dismissableLayer.pointerDownOutside',
  fx = 'dismissableLayer.focusOutside',
  vf,
  Am = y.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set(),
  }),
  Dc = y.forwardRef((e, t) => {
    const {
        disableOutsidePointerEvents: n = !1,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: s,
        onInteractOutside: i,
        onDismiss: l,
        ...a
      } = e,
      u = y.useContext(Am),
      [d, f] = y.useState(null),
      g =
        (d == null ? void 0 : d.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      [, p] = y.useState({}),
      b = Ut(t, P => f(P)),
      x = Array.from(u.layers),
      [w] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1),
      m = x.indexOf(w),
      h = d ? x.indexOf(d) : -1,
      v = u.layersWithOutsidePointerEventsDisabled.size > 0,
      k = h >= m,
      N = hx(P => {
        const T = P.target,
          I = [...u.branches].some(D => D.contains(T))
        !k || I || (o == null || o(P), i == null || i(P), P.defaultPrevented || l == null || l())
      }, g),
      j = mx(P => {
        const T = P.target
        ;[...u.branches].some(D => D.contains(T)) ||
          (s == null || s(P), i == null || i(P), P.defaultPrevented || l == null || l())
      }, g)
    return (
      ux(P => {
        h === u.layers.size - 1 &&
          (r == null || r(P), !P.defaultPrevented && l && (P.preventDefault(), l()))
      }, g),
      y.useEffect(() => {
        if (d)
          return (
            n &&
              (u.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((vf = g.body.style.pointerEvents), (g.body.style.pointerEvents = 'none')),
              u.layersWithOutsidePointerEventsDisabled.add(d)),
            u.layers.add(d),
            xf(),
            () => {
              n &&
                u.layersWithOutsidePointerEventsDisabled.size === 1 &&
                (g.body.style.pointerEvents = vf)
            }
          )
      }, [d, g, n, u]),
      y.useEffect(
        () => () => {
          d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), xf())
        },
        [d, u]
      ),
      y.useEffect(() => {
        const P = () => p({})
        return (document.addEventListener(Tu, P), () => document.removeEventListener(Tu, P))
      }, []),
      c.jsx(lt.div, {
        ...a,
        ref: b,
        style: { pointerEvents: v ? (k ? 'auto' : 'none') : void 0, ...e.style },
        onFocusCapture: Oe(e.onFocusCapture, j.onFocusCapture),
        onBlurCapture: Oe(e.onBlurCapture, j.onBlurCapture),
        onPointerDownCapture: Oe(e.onPointerDownCapture, N.onPointerDownCapture),
      })
    )
  })
Dc.displayName = cx
var px = 'DismissableLayerBranch',
  Lm = y.forwardRef((e, t) => {
    const n = y.useContext(Am),
      r = y.useRef(null),
      o = Ut(t, r)
    return (
      y.useEffect(() => {
        const s = r.current
        if (s)
          return (
            n.branches.add(s),
            () => {
              n.branches.delete(s)
            }
          )
      }, [n.branches]),
      c.jsx(lt.div, { ...e, ref: o })
    )
  })
Lm.displayName = px
function hx(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = nr(e),
    r = y.useRef(!1),
    o = y.useRef(() => {})
  return (
    y.useEffect(() => {
      const s = l => {
          if (l.target && !r.current) {
            let a = function () {
              Im(dx, n, u, { discrete: !0 })
            }
            const u = { originalEvent: l }
            l.pointerType === 'touch'
              ? (t.removeEventListener('click', o.current),
                (o.current = a),
                t.addEventListener('click', o.current, { once: !0 }))
              : a()
          } else t.removeEventListener('click', o.current)
          r.current = !1
        },
        i = window.setTimeout(() => {
          t.addEventListener('pointerdown', s)
        }, 0)
      return () => {
        ;(window.clearTimeout(i),
          t.removeEventListener('pointerdown', s),
          t.removeEventListener('click', o.current))
      }
    }, [t, n]),
    { onPointerDownCapture: () => (r.current = !0) }
  )
}
function mx(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = nr(e),
    r = y.useRef(!1)
  return (
    y.useEffect(() => {
      const o = s => {
        s.target && !r.current && Im(fx, n, { originalEvent: s }, { discrete: !1 })
      }
      return (t.addEventListener('focusin', o), () => t.removeEventListener('focusin', o))
    }, [t, n]),
    { onFocusCapture: () => (r.current = !0), onBlurCapture: () => (r.current = !1) }
  )
}
function xf() {
  const e = new CustomEvent(Tu)
  document.dispatchEvent(e)
}
function Im(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target,
    s = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n })
  ;(t && o.addEventListener(e, t, { once: !0 }), r ? Om(o, s) : o.dispatchEvent(s))
}
var gx = Dc,
  yx = Lm,
  rr = globalThis != null && globalThis.document ? y.useLayoutEffect : () => {},
  vx = 'Portal',
  Dm = y.forwardRef((e, t) => {
    var l
    const { container: n, ...r } = e,
      [o, s] = y.useState(!1)
    rr(() => s(!0), [])
    const i =
      n ||
      (o && ((l = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : l.body))
    return i ? Tm.createPortal(c.jsx(lt.div, { ...r, ref: t }), i) : null
  })
Dm.displayName = vx
function xx(e, t) {
  return y.useReducer((n, r) => t[n][r] ?? n, e)
}
var zc = e => {
  const { present: t, children: n } = e,
    r = wx(t),
    o = typeof n == 'function' ? n({ present: r.isPresent }) : y.Children.only(n),
    s = Ut(r.ref, bx(o))
  return typeof n == 'function' || r.isPresent ? y.cloneElement(o, { ref: s }) : null
}
zc.displayName = 'Presence'
function wx(e) {
  const [t, n] = y.useState(),
    r = y.useRef(null),
    o = y.useRef(e),
    s = y.useRef('none'),
    i = e ? 'mounted' : 'unmounted',
    [l, a] = xx(i, {
      mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
      unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
      unmounted: { MOUNT: 'mounted' },
    })
  return (
    y.useEffect(() => {
      const u = mi(r.current)
      s.current = l === 'mounted' ? u : 'none'
    }, [l]),
    rr(() => {
      const u = r.current,
        d = o.current
      if (d !== e) {
        const g = s.current,
          p = mi(u)
        ;(e
          ? a('MOUNT')
          : p === 'none' || (u == null ? void 0 : u.display) === 'none'
            ? a('UNMOUNT')
            : a(d && g !== p ? 'ANIMATION_OUT' : 'UNMOUNT'),
          (o.current = e))
      }
    }, [e, a]),
    rr(() => {
      if (t) {
        let u
        const d = t.ownerDocument.defaultView ?? window,
          f = p => {
            const x = mi(r.current).includes(p.animationName)
            if (p.target === t && x && (a('ANIMATION_END'), !o.current)) {
              const w = t.style.animationFillMode
              ;((t.style.animationFillMode = 'forwards'),
                (u = d.setTimeout(() => {
                  t.style.animationFillMode === 'forwards' && (t.style.animationFillMode = w)
                })))
            }
          },
          g = p => {
            p.target === t && (s.current = mi(r.current))
          }
        return (
          t.addEventListener('animationstart', g),
          t.addEventListener('animationcancel', f),
          t.addEventListener('animationend', f),
          () => {
            ;(d.clearTimeout(u),
              t.removeEventListener('animationstart', g),
              t.removeEventListener('animationcancel', f),
              t.removeEventListener('animationend', f))
          }
        )
      } else a('ANIMATION_END')
    }, [t, a]),
    {
      isPresent: ['mounted', 'unmountSuspended'].includes(l),
      ref: y.useCallback(u => {
        ;((r.current = u ? getComputedStyle(u) : null), n(u))
      }, []),
    }
  )
}
function mi(e) {
  return (e == null ? void 0 : e.animationName) || 'none'
}
function bx(e) {
  var r, o
  let t = (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning
  return n
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref)
}
var Sx = Np[' useInsertionEffect '.trim().toString()] || rr
function kx({ prop: e, defaultProp: t, onChange: n = () => {}, caller: r }) {
  const [o, s, i] = Cx({ defaultProp: t, onChange: n }),
    l = e !== void 0,
    a = l ? e : o
  {
    const d = y.useRef(e !== void 0)
    y.useEffect(() => {
      const f = d.current
      ;(f !== l &&
        console.warn(
          `${r} is changing from ${f ? 'controlled' : 'uncontrolled'} to ${l ? 'controlled' : 'uncontrolled'}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        ),
        (d.current = l))
    }, [l, r])
  }
  const u = y.useCallback(
    d => {
      var f
      if (l) {
        const g = Ex(d) ? d(e) : d
        g !== e && ((f = i.current) == null || f.call(i, g))
      } else s(d)
    },
    [l, e, s, i]
  )
  return [a, u]
}
function Cx({ defaultProp: e, onChange: t }) {
  const [n, r] = y.useState(e),
    o = y.useRef(n),
    s = y.useRef(t)
  return (
    Sx(() => {
      s.current = t
    }, [t]),
    y.useEffect(() => {
      var i
      o.current !== n && ((i = s.current) == null || i.call(s, n), (o.current = n))
    }, [n, o]),
    [n, r, s]
  )
}
function Ex(e) {
  return typeof e == 'function'
}
var Nx = Object.freeze({
    position: 'absolute',
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  }),
  Px = 'VisuallyHidden',
  _l = y.forwardRef((e, t) => c.jsx(lt.span, { ...e, ref: t, style: { ...Nx, ...e.style } }))
_l.displayName = Px
var jx = _l,
  Fc = 'ToastProvider',
  [$c, Tx, Rx] = lx('Toast'),
  [zm, Qk] = Ml('Toast', [Rx]),
  [Mx, Ol] = zm(Fc),
  Fm = e => {
    const {
        __scopeToast: t,
        label: n = 'Notification',
        duration: r = 5e3,
        swipeDirection: o = 'right',
        swipeThreshold: s = 50,
        children: i,
      } = e,
      [l, a] = y.useState(null),
      [u, d] = y.useState(0),
      f = y.useRef(!1),
      g = y.useRef(!1)
    return (
      n.trim() ||
        console.error(
          `Invalid prop \`label\` supplied to \`${Fc}\`. Expected non-empty \`string\`.`
        ),
      c.jsx($c.Provider, {
        scope: t,
        children: c.jsx(Mx, {
          scope: t,
          label: n,
          duration: r,
          swipeDirection: o,
          swipeThreshold: s,
          toastCount: u,
          viewport: l,
          onViewportChange: a,
          onToastAdd: y.useCallback(() => d(p => p + 1), []),
          onToastRemove: y.useCallback(() => d(p => p - 1), []),
          isFocusedToastEscapeKeyDownRef: f,
          isClosePausedRef: g,
          children: i,
        }),
      })
    )
  }
Fm.displayName = Fc
var $m = 'ToastViewport',
  _x = ['F8'],
  Ru = 'toast.viewportPause',
  Mu = 'toast.viewportResume',
  Um = y.forwardRef((e, t) => {
    const { __scopeToast: n, hotkey: r = _x, label: o = 'Notifications ({hotkey})', ...s } = e,
      i = Ol($m, n),
      l = Tx(n),
      a = y.useRef(null),
      u = y.useRef(null),
      d = y.useRef(null),
      f = y.useRef(null),
      g = Ut(t, f, i.onViewportChange),
      p = r.join('+').replace(/Key/g, '').replace(/Digit/g, ''),
      b = i.toastCount > 0
    ;(y.useEffect(() => {
      const w = m => {
        var v
        r.length !== 0 &&
          r.every(k => m[k] || m.code === k) &&
          ((v = f.current) == null || v.focus())
      }
      return (
        document.addEventListener('keydown', w),
        () => document.removeEventListener('keydown', w)
      )
    }, [r]),
      y.useEffect(() => {
        const w = a.current,
          m = f.current
        if (b && w && m) {
          const h = () => {
              if (!i.isClosePausedRef.current) {
                const j = new CustomEvent(Ru)
                ;(m.dispatchEvent(j), (i.isClosePausedRef.current = !0))
              }
            },
            v = () => {
              if (i.isClosePausedRef.current) {
                const j = new CustomEvent(Mu)
                ;(m.dispatchEvent(j), (i.isClosePausedRef.current = !1))
              }
            },
            k = j => {
              !w.contains(j.relatedTarget) && v()
            },
            N = () => {
              w.contains(document.activeElement) || v()
            }
          return (
            w.addEventListener('focusin', h),
            w.addEventListener('focusout', k),
            w.addEventListener('pointermove', h),
            w.addEventListener('pointerleave', N),
            window.addEventListener('blur', h),
            window.addEventListener('focus', v),
            () => {
              ;(w.removeEventListener('focusin', h),
                w.removeEventListener('focusout', k),
                w.removeEventListener('pointermove', h),
                w.removeEventListener('pointerleave', N),
                window.removeEventListener('blur', h),
                window.removeEventListener('focus', v))
            }
          )
        }
      }, [b, i.isClosePausedRef]))
    const x = y.useCallback(
      ({ tabbingDirection: w }) => {
        const h = l().map(v => {
          const k = v.ref.current,
            N = [k, ...Vx(k)]
          return w === 'forwards' ? N : N.reverse()
        })
        return (w === 'forwards' ? h.reverse() : h).flat()
      },
      [l]
    )
    return (
      y.useEffect(() => {
        const w = f.current
        if (w) {
          const m = h => {
            var N, j, P
            const v = h.altKey || h.ctrlKey || h.metaKey
            if (h.key === 'Tab' && !v) {
              const T = document.activeElement,
                I = h.shiftKey
              if (h.target === w && I) {
                ;(N = u.current) == null || N.focus()
                return
              }
              const U = x({ tabbingDirection: I ? 'backwards' : 'forwards' }),
                G = U.findIndex($ => $ === T)
              Ca(U.slice(G + 1))
                ? h.preventDefault()
                : I
                  ? (j = u.current) == null || j.focus()
                  : (P = d.current) == null || P.focus()
            }
          }
          return (w.addEventListener('keydown', m), () => w.removeEventListener('keydown', m))
        }
      }, [l, x]),
      c.jsxs(yx, {
        ref: a,
        role: 'region',
        'aria-label': o.replace('{hotkey}', p),
        tabIndex: -1,
        style: { pointerEvents: b ? void 0 : 'none' },
        children: [
          b &&
            c.jsx(_u, {
              ref: u,
              onFocusFromOutsideViewport: () => {
                const w = x({ tabbingDirection: 'forwards' })
                Ca(w)
              },
            }),
          c.jsx($c.Slot, { scope: n, children: c.jsx(lt.ol, { tabIndex: -1, ...s, ref: g }) }),
          b &&
            c.jsx(_u, {
              ref: d,
              onFocusFromOutsideViewport: () => {
                const w = x({ tabbingDirection: 'backwards' })
                Ca(w)
              },
            }),
        ],
      })
    )
  })
Um.displayName = $m
var Bm = 'ToastFocusProxy',
  _u = y.forwardRef((e, t) => {
    const { __scopeToast: n, onFocusFromOutsideViewport: r, ...o } = e,
      s = Ol(Bm, n)
    return c.jsx(_l, {
      'aria-hidden': !0,
      tabIndex: 0,
      ...o,
      ref: t,
      style: { position: 'fixed' },
      onFocus: i => {
        var u
        const l = i.relatedTarget
        !((u = s.viewport) != null && u.contains(l)) && r()
      },
    })
  })
_u.displayName = Bm
var $s = 'Toast',
  Ox = 'toast.swipeStart',
  Ax = 'toast.swipeMove',
  Lx = 'toast.swipeCancel',
  Ix = 'toast.swipeEnd',
  Hm = y.forwardRef((e, t) => {
    const { forceMount: n, open: r, defaultOpen: o, onOpenChange: s, ...i } = e,
      [l, a] = kx({ prop: r, defaultProp: o ?? !0, onChange: s, caller: $s })
    return c.jsx(zc, {
      present: n || l,
      children: c.jsx(Fx, {
        open: l,
        ...i,
        ref: t,
        onClose: () => a(!1),
        onPause: nr(e.onPause),
        onResume: nr(e.onResume),
        onSwipeStart: Oe(e.onSwipeStart, u => {
          u.currentTarget.setAttribute('data-swipe', 'start')
        }),
        onSwipeMove: Oe(e.onSwipeMove, u => {
          const { x: d, y: f } = u.detail.delta
          ;(u.currentTarget.setAttribute('data-swipe', 'move'),
            u.currentTarget.style.setProperty('--radix-toast-swipe-move-x', `${d}px`),
            u.currentTarget.style.setProperty('--radix-toast-swipe-move-y', `${f}px`))
        }),
        onSwipeCancel: Oe(e.onSwipeCancel, u => {
          ;(u.currentTarget.setAttribute('data-swipe', 'cancel'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-y'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-end-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-end-y'))
        }),
        onSwipeEnd: Oe(e.onSwipeEnd, u => {
          const { x: d, y: f } = u.detail.delta
          ;(u.currentTarget.setAttribute('data-swipe', 'end'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-y'),
            u.currentTarget.style.setProperty('--radix-toast-swipe-end-x', `${d}px`),
            u.currentTarget.style.setProperty('--radix-toast-swipe-end-y', `${f}px`),
            a(!1))
        }),
      }),
    })
  })
Hm.displayName = $s
var [Dx, zx] = zm($s, { onClose() {} }),
  Fx = y.forwardRef((e, t) => {
    const {
        __scopeToast: n,
        type: r = 'foreground',
        duration: o,
        open: s,
        onClose: i,
        onEscapeKeyDown: l,
        onPause: a,
        onResume: u,
        onSwipeStart: d,
        onSwipeMove: f,
        onSwipeCancel: g,
        onSwipeEnd: p,
        ...b
      } = e,
      x = Ol($s, n),
      [w, m] = y.useState(null),
      h = Ut(t, $ => m($)),
      v = y.useRef(null),
      k = y.useRef(null),
      N = o || x.duration,
      j = y.useRef(0),
      P = y.useRef(N),
      T = y.useRef(0),
      { onToastAdd: I, onToastRemove: D } = x,
      Q = nr(() => {
        var re
        ;((w == null ? void 0 : w.contains(document.activeElement)) &&
          ((re = x.viewport) == null || re.focus()),
          i())
      }),
      U = y.useCallback(
        $ => {
          !$ ||
            $ === 1 / 0 ||
            (window.clearTimeout(T.current),
            (j.current = new Date().getTime()),
            (T.current = window.setTimeout(Q, $)))
        },
        [Q]
      )
    ;(y.useEffect(() => {
      const $ = x.viewport
      if ($) {
        const re = () => {
            ;(U(P.current), u == null || u())
          },
          K = () => {
            const W = new Date().getTime() - j.current
            ;((P.current = P.current - W), window.clearTimeout(T.current), a == null || a())
          }
        return (
          $.addEventListener(Ru, K),
          $.addEventListener(Mu, re),
          () => {
            ;($.removeEventListener(Ru, K), $.removeEventListener(Mu, re))
          }
        )
      }
    }, [x.viewport, N, a, u, U]),
      y.useEffect(() => {
        s && !x.isClosePausedRef.current && U(N)
      }, [s, N, x.isClosePausedRef, U]),
      y.useEffect(() => (I(), () => D()), [I, D]))
    const G = y.useMemo(() => (w ? qm(w) : null), [w])
    return x.viewport
      ? c.jsxs(c.Fragment, {
          children: [
            G &&
              c.jsx($x, {
                __scopeToast: n,
                role: 'status',
                'aria-live': r === 'foreground' ? 'assertive' : 'polite',
                'aria-atomic': !0,
                children: G,
              }),
            c.jsx(Dx, {
              scope: n,
              onClose: Q,
              children: Fs.createPortal(
                c.jsx($c.ItemSlot, {
                  scope: n,
                  children: c.jsx(gx, {
                    asChild: !0,
                    onEscapeKeyDown: Oe(l, () => {
                      ;(x.isFocusedToastEscapeKeyDownRef.current || Q(),
                        (x.isFocusedToastEscapeKeyDownRef.current = !1))
                    }),
                    children: c.jsx(lt.li, {
                      role: 'status',
                      'aria-live': 'off',
                      'aria-atomic': !0,
                      tabIndex: 0,
                      'data-state': s ? 'open' : 'closed',
                      'data-swipe-direction': x.swipeDirection,
                      ...b,
                      ref: h,
                      style: { userSelect: 'none', touchAction: 'none', ...e.style },
                      onKeyDown: Oe(e.onKeyDown, $ => {
                        $.key === 'Escape' &&
                          (l == null || l($.nativeEvent),
                          $.nativeEvent.defaultPrevented ||
                            ((x.isFocusedToastEscapeKeyDownRef.current = !0), Q()))
                      }),
                      onPointerDown: Oe(e.onPointerDown, $ => {
                        $.button === 0 && (v.current = { x: $.clientX, y: $.clientY })
                      }),
                      onPointerMove: Oe(e.onPointerMove, $ => {
                        if (!v.current) return
                        const re = $.clientX - v.current.x,
                          K = $.clientY - v.current.y,
                          W = !!k.current,
                          R = ['left', 'right'].includes(x.swipeDirection),
                          C = ['left', 'up'].includes(x.swipeDirection) ? Math.min : Math.max,
                          _ = R ? C(0, re) : 0,
                          B = R ? 0 : C(0, K),
                          H = $.pointerType === 'touch' ? 10 : 2,
                          Z = { x: _, y: B },
                          te = { originalEvent: $, delta: Z }
                        W
                          ? ((k.current = Z), gi(Ax, f, te, { discrete: !1 }))
                          : wf(Z, x.swipeDirection, H)
                            ? ((k.current = Z),
                              gi(Ox, d, te, { discrete: !1 }),
                              $.target.setPointerCapture($.pointerId))
                            : (Math.abs(re) > H || Math.abs(K) > H) && (v.current = null)
                      }),
                      onPointerUp: Oe(e.onPointerUp, $ => {
                        const re = k.current,
                          K = $.target
                        if (
                          (K.hasPointerCapture($.pointerId) && K.releasePointerCapture($.pointerId),
                          (k.current = null),
                          (v.current = null),
                          re)
                        ) {
                          const W = $.currentTarget,
                            R = { originalEvent: $, delta: re }
                          ;(wf(re, x.swipeDirection, x.swipeThreshold)
                            ? gi(Ix, p, R, { discrete: !0 })
                            : gi(Lx, g, R, { discrete: !0 }),
                            W.addEventListener('click', C => C.preventDefault(), { once: !0 }))
                        }
                      }),
                    }),
                  }),
                }),
                x.viewport
              ),
            }),
          ],
        })
      : null
  }),
  $x = e => {
    const { __scopeToast: t, children: n, ...r } = e,
      o = Ol($s, t),
      [s, i] = y.useState(!1),
      [l, a] = y.useState(!1)
    return (
      Hx(() => i(!0)),
      y.useEffect(() => {
        const u = window.setTimeout(() => a(!0), 1e3)
        return () => window.clearTimeout(u)
      }, []),
      l
        ? null
        : c.jsx(Dm, {
            asChild: !0,
            children: c.jsx(_l, {
              ...r,
              children: s && c.jsxs(c.Fragment, { children: [o.label, ' ', n] }),
            }),
          })
    )
  },
  Ux = 'ToastTitle',
  Wm = y.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e
    return c.jsx(lt.div, { ...r, ref: t })
  })
Wm.displayName = Ux
var Bx = 'ToastDescription',
  Vm = y.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e
    return c.jsx(lt.div, { ...r, ref: t })
  })
Vm.displayName = Bx
var Qm = 'ToastAction',
  Km = y.forwardRef((e, t) => {
    const { altText: n, ...r } = e
    return n.trim()
      ? c.jsx(Gm, { altText: n, asChild: !0, children: c.jsx(Uc, { ...r, ref: t }) })
      : (console.error(
          `Invalid prop \`altText\` supplied to \`${Qm}\`. Expected non-empty \`string\`.`
        ),
        null)
  })
Km.displayName = Qm
var Ym = 'ToastClose',
  Uc = y.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e,
      o = zx(Ym, n)
    return c.jsx(Gm, {
      asChild: !0,
      children: c.jsx(lt.button, {
        type: 'button',
        ...r,
        ref: t,
        onClick: Oe(e.onClick, o.onClose),
      }),
    })
  })
Uc.displayName = Ym
var Gm = y.forwardRef((e, t) => {
  const { __scopeToast: n, altText: r, ...o } = e
  return c.jsx(lt.div, {
    'data-radix-toast-announce-exclude': '',
    'data-radix-toast-announce-alt': r || void 0,
    ...o,
    ref: t,
  })
})
function qm(e) {
  const t = []
  return (
    Array.from(e.childNodes).forEach(r => {
      if ((r.nodeType === r.TEXT_NODE && r.textContent && t.push(r.textContent), Wx(r))) {
        const o = r.ariaHidden || r.hidden || r.style.display === 'none',
          s = r.dataset.radixToastAnnounceExclude === ''
        if (!o)
          if (s) {
            const i = r.dataset.radixToastAnnounceAlt
            i && t.push(i)
          } else t.push(...qm(r))
      }
    }),
    t
  )
}
function gi(e, t, n, { discrete: r }) {
  const o = n.originalEvent.currentTarget,
    s = new CustomEvent(e, { bubbles: !0, cancelable: !0, detail: n })
  ;(t && o.addEventListener(e, t, { once: !0 }), r ? Om(o, s) : o.dispatchEvent(s))
}
var wf = (e, t, n = 0) => {
  const r = Math.abs(e.x),
    o = Math.abs(e.y),
    s = r > o
  return t === 'left' || t === 'right' ? s && r > n : !s && o > n
}
function Hx(e = () => {}) {
  const t = nr(e)
  rr(() => {
    let n = 0,
      r = 0
    return (
      (n = window.requestAnimationFrame(() => (r = window.requestAnimationFrame(t)))),
      () => {
        ;(window.cancelAnimationFrame(n), window.cancelAnimationFrame(r))
      }
    )
  }, [t])
}
function Wx(e) {
  return e.nodeType === e.ELEMENT_NODE
}
function Vx(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: r => {
        const o = r.tagName === 'INPUT' && r.type === 'hidden'
        return r.disabled || r.hidden || o
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
      },
    })
  for (; n.nextNode(); ) t.push(n.currentNode)
  return t
}
function Ca(e) {
  const t = document.activeElement
  return e.some(n => (n === t ? !0 : (n.focus(), document.activeElement !== t)))
}
var Qx = Fm,
  Xm = Um,
  Zm = Hm,
  Jm = Wm,
  eg = Vm,
  tg = Km,
  ng = Uc
function rg(e) {
  var t,
    n,
    r = ''
  if (typeof e == 'string' || typeof e == 'number') r += e
  else if (typeof e == 'object')
    if (Array.isArray(e)) {
      var o = e.length
      for (t = 0; t < o; t++) e[t] && (n = rg(e[t])) && (r && (r += ' '), (r += n))
    } else for (n in e) e[n] && (r && (r += ' '), (r += n))
  return r
}
function og() {
  for (var e, t, n = 0, r = '', o = arguments.length; n < o; n++)
    (e = arguments[n]) && (t = rg(e)) && (r && (r += ' '), (r += t))
  return r
}
const bf = e => (typeof e == 'boolean' ? `${e}` : e === 0 ? '0' : e),
  Sf = og,
  Kx = (e, t) => n => {
    var r
    if ((t == null ? void 0 : t.variants) == null)
      return Sf(e, n == null ? void 0 : n.class, n == null ? void 0 : n.className)
    const { variants: o, defaultVariants: s } = t,
      i = Object.keys(o).map(u => {
        const d = n == null ? void 0 : n[u],
          f = s == null ? void 0 : s[u]
        if (d === null) return null
        const g = bf(d) || bf(f)
        return o[u][g]
      }),
      l =
        n &&
        Object.entries(n).reduce((u, d) => {
          let [f, g] = d
          return (g === void 0 || (u[f] = g), u)
        }, {}),
      a =
        t == null || (r = t.compoundVariants) === null || r === void 0
          ? void 0
          : r.reduce((u, d) => {
              let { class: f, className: g, ...p } = d
              return Object.entries(p).every(b => {
                let [x, w] = b
                return Array.isArray(w) ? w.includes({ ...s, ...l }[x]) : { ...s, ...l }[x] === w
              })
                ? [...u, f, g]
                : u
            }, [])
    return Sf(e, i, a, n == null ? void 0 : n.class, n == null ? void 0 : n.className)
  }
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Yx = e => e.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
  sg = (...e) =>
    e
      .filter((t, n, r) => !!t && t.trim() !== '' && r.indexOf(t) === n)
      .join(' ')
      .trim()
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var Gx = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const qx = y.forwardRef(
  (
    {
      color: e = 'currentColor',
      size: t = 24,
      strokeWidth: n = 2,
      absoluteStrokeWidth: r,
      className: o = '',
      children: s,
      iconNode: i,
      ...l
    },
    a
  ) =>
    y.createElement(
      'svg',
      {
        ref: a,
        ...Gx,
        width: t,
        height: t,
        stroke: e,
        strokeWidth: r ? (Number(n) * 24) / Number(t) : n,
        className: sg('lucide', o),
        ...l,
      },
      [...i.map(([u, d]) => y.createElement(u, d)), ...(Array.isArray(s) ? s : [s])]
    )
)
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ie = (e, t) => {
  const n = y.forwardRef(({ className: r, ...o }, s) =>
    y.createElement(qx, { ref: s, iconNode: t, className: sg(`lucide-${Yx(e)}`, r), ...o })
  )
  return ((n.displayName = `${e}`), n)
}
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Xx = ie('Brush', [
  ['path', { d: 'm9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08', key: '1styjt' }],
  [
    'path',
    {
      d: 'M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
      key: 'z0l1mu',
    },
  ],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Zx = ie('Camera', [
  [
    'path',
    {
      d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
      key: '1tc9qg',
    },
  ],
  ['circle', { cx: '12', cy: '13', r: '3', key: '1vg3eu' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Bc = ie('ChevronDown', [['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }]])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Jx = ie('ChevronUp', [['path', { d: 'm18 15-6-6-6 6', key: '153udz' }]])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const e1 = ie('CircleHelp', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', key: '1u773s' }],
  ['path', { d: 'M12 17h.01', key: 'p32p05' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const t1 = ie('Circle', [['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }]])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const n1 = ie('Eraser', [
  [
    'path',
    {
      d: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21',
      key: '182aya',
    },
  ],
  ['path', { d: 'M22 21H7', key: 't4ddhn' }],
  ['path', { d: 'm5 11 9 9', key: '1mo9qw' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const r1 = ie('FileText', [
  ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', key: '1rqfz7' }],
  ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
  ['path', { d: 'M10 9H8', key: 'b1mrlr' }],
  ['path', { d: 'M16 13H8', key: 't4e002' }],
  ['path', { d: 'M16 17H8', key: 'z1uh3a' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const o1 = ie('FileUp', [
  ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', key: '1rqfz7' }],
  ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
  ['path', { d: 'M12 12v6', key: '3ahymv' }],
  ['path', { d: 'm15 15-3-3-3 3', key: '15xj92' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const s1 = ie('GripHorizontal', [['path', { d: 'M5 12h14', key: '1b2k89' }]])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const i1 = ie('HardHat', [
  ['path', { d: 'M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5', key: '1p9q5i' }],
  ['path', { d: 'M14 6a6 6 0 0 1 6 6v3', key: '1hnv84' }],
  ['path', { d: 'M4 15v-3a6 6 0 0 1 6-6', key: '9ciidu' }],
  ['rect', { x: '2', y: '15', width: '20', height: '4', rx: '1', key: 'g3x8cw' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const l1 = ie('Image', [
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2', key: '1m3agn' }],
  ['circle', { cx: '9', cy: '9', r: '2', key: 'af1f0g' }],
  ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21', key: '1xmnt7' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const a1 = ie('Lasso', [
  ['path', { d: 'M7 22a5 5 0 0 1-2-4', key: 'umushi' }],
  [
    'path',
    {
      d: 'M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1',
      key: '146dds',
    },
  ],
  ['path', { d: 'M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', key: 'bq3ynw' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const u1 = ie('Lock', [
  ['rect', { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2', key: '1w4ew1' }],
  ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4', key: 'fwvmzm' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const c1 = ie('MapPin', [
  [
    'path',
    {
      d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
      key: '1r0f0z',
    },
  ],
  ['circle', { cx: '12', cy: '10', r: '3', key: 'ilqhr7' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const d1 = ie('Map', [
  [
    'path',
    {
      d: 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z',
      key: '169xi5',
    },
  ],
  ['path', { d: 'M15 5.764v15', key: '1pn4in' }],
  ['path', { d: 'M9 3.236v15', key: '1uimfh' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const f1 = ie('Maximize2', [
  ['polyline', { points: '15 3 21 3 21 9', key: 'mznyad' }],
  ['polyline', { points: '9 21 3 21 3 15', key: '1avn1i' }],
  ['line', { x1: '21', x2: '14', y1: '3', y2: '10', key: 'ota7mn' }],
  ['line', { x1: '3', x2: '10', y1: '21', y2: '14', key: '1atl0r' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const p1 = ie('Move', [
  ['path', { d: 'M12 2v20', key: 't6zp3m' }],
  ['path', { d: 'm15 19-3 3-3-3', key: '11eu04' }],
  ['path', { d: 'm19 9 3 3-3 3', key: '1mg7y2' }],
  ['path', { d: 'M2 12h20', key: '9i4pu4' }],
  ['path', { d: 'm5 9-3 3 3 3', key: 'j64kie' }],
  ['path', { d: 'm9 5 3-3 3 3', key: 'l8vdw6' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const h1 = ie('Package', [
  [
    'path',
    {
      d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
      key: '1a0edw',
    },
  ],
  ['path', { d: 'M12 22V12', key: 'd0xqtd' }],
  ['path', { d: 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7', key: 'yx3hmr' }],
  ['path', { d: 'm7.5 4.27 9 5.15', key: '1c824w' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const m1 = ie('Save', [
  [
    'path',
    {
      d: 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
      key: '1c8476',
    },
  ],
  ['path', { d: 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7', key: '1ydtos' }],
  ['path', { d: 'M7 3v4a1 1 0 0 0 1 1h7', key: 't51u73' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const g1 = ie('ScanLine', [
  ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2', key: 'aa7l1z' }],
  ['path', { d: 'M17 3h2a2 2 0 0 1 2 2v2', key: '4qcy5o' }],
  ['path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2', key: '6vwrx8' }],
  ['path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2', key: 'ioqczr' }],
  ['path', { d: 'M7 12h10', key: 'b7w52i' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const y1 = ie('Scan', [
  ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2', key: 'aa7l1z' }],
  ['path', { d: 'M17 3h2a2 2 0 0 1 2 2v2', key: '4qcy5o' }],
  ['path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2', key: '6vwrx8' }],
  ['path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2', key: 'ioqczr' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const v1 = ie('Slash', [['path', { d: 'M22 2 2 22', key: 'y4kqgn' }]])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const x1 = ie('Square', [
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', key: 'afitv7' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const w1 = ie('Stamp', [
  ['path', { d: 'M5 22h14', key: 'ehvnwv' }],
  [
    'path',
    {
      d: 'M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z',
      key: '1sy9ra',
    },
  ],
  [
    'path',
    { d: 'M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13', key: 'cnxgux' },
  ],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const b1 = ie('Star', [
  [
    'path',
    {
      d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
      key: 'r04s7s',
    },
  ],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const S1 = ie('Trash2', [
  ['path', { d: 'M3 6h18', key: 'd0wm0j' }],
  ['path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', key: '4alrt4' }],
  ['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', key: 'v07s0e' }],
  ['line', { x1: '10', x2: '10', y1: '11', y2: '17', key: '1uufr5' }],
  ['line', { x1: '14', x2: '14', y1: '11', y2: '17', key: 'xtxkd' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const k1 = ie('Triangle', [
  [
    'path',
    { d: 'M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z', key: '14u9p9' },
  ],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const C1 = ie('Type', [
  ['polyline', { points: '4 7 4 4 20 4 20 7', key: '1nosan' }],
  ['line', { x1: '9', x2: '15', y1: '20', y2: '20', key: 'swin9y' }],
  ['line', { x1: '12', x2: '12', y1: '4', y2: '20', key: '1tx1rr' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const E1 = ie('Undo2', [
  ['path', { d: 'M9 14 4 9l5-5', key: '102s5s' }],
  ['path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11', key: 'f3b9sd' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const N1 = ie('Upload', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h' }],
  ['polyline', { points: '17 8 12 3 7 8', key: 't8dd8p' }],
  ['line', { x1: '12', x2: '12', y1: '3', y2: '15', key: 'widbto' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const P1 = ie('Users', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: '1yyitq' }],
  ['circle', { cx: '9', cy: '7', r: '4', key: 'nufk8' }],
  ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87', key: 'kshegd' }],
  ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75', key: '1da9ce' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Dt = ie('X', [
  ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
  ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const j1 = ie('ZoomIn', [
  ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
  ['line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65', key: '13gj7c' }],
  ['line', { x1: '11', x2: '11', y1: '8', y2: '14', key: '1vmskp' }],
  ['line', { x1: '8', x2: '14', y1: '11', y2: '11', key: 'durymu' }],
])
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const T1 = ie('ZoomOut', [
    ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
    ['line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65', key: '13gj7c' }],
    ['line', { x1: '8', x2: '14', y1: '11', y2: '11', key: 'durymu' }],
  ]),
  Hc = '-',
  R1 = e => {
    const t = _1(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e
    return {
      getClassGroupId: i => {
        const l = i.split(Hc)
        return (l[0] === '' && l.length !== 1 && l.shift(), ig(l, t) || M1(i))
      },
      getConflictingClassGroupIds: (i, l) => {
        const a = n[i] || []
        return l && r[i] ? [...a, ...r[i]] : a
      },
    }
  },
  ig = (e, t) => {
    var i
    if (e.length === 0) return t.classGroupId
    const n = e[0],
      r = t.nextPart.get(n),
      o = r ? ig(e.slice(1), r) : void 0
    if (o) return o
    if (t.validators.length === 0) return
    const s = e.join(Hc)
    return (i = t.validators.find(({ validator: l }) => l(s))) == null ? void 0 : i.classGroupId
  },
  kf = /^\[(.+)\]$/,
  M1 = e => {
    if (kf.test(e)) {
      const t = kf.exec(e)[1],
        n = t == null ? void 0 : t.substring(0, t.indexOf(':'))
      if (n) return 'arbitrary..' + n
    }
  },
  _1 = e => {
    const { theme: t, prefix: n } = e,
      r = { nextPart: new Map(), validators: [] }
    return (
      A1(Object.entries(e.classGroups), n).forEach(([s, i]) => {
        Ou(i, r, s, t)
      }),
      r
    )
  },
  Ou = (e, t, n, r) => {
    e.forEach(o => {
      if (typeof o == 'string') {
        const s = o === '' ? t : Cf(t, o)
        s.classGroupId = n
        return
      }
      if (typeof o == 'function') {
        if (O1(o)) {
          Ou(o(r), t, n, r)
          return
        }
        t.validators.push({ validator: o, classGroupId: n })
        return
      }
      Object.entries(o).forEach(([s, i]) => {
        Ou(i, Cf(t, s), n, r)
      })
    })
  },
  Cf = (e, t) => {
    let n = e
    return (
      t.split(Hc).forEach(r => {
        ;(n.nextPart.has(r) || n.nextPart.set(r, { nextPart: new Map(), validators: [] }),
          (n = n.nextPart.get(r)))
      }),
      n
    )
  },
  O1 = e => e.isThemeGetter,
  A1 = (e, t) =>
    t
      ? e.map(([n, r]) => {
          const o = r.map(s =>
            typeof s == 'string'
              ? t + s
              : typeof s == 'object'
                ? Object.fromEntries(Object.entries(s).map(([i, l]) => [t + i, l]))
                : s
          )
          return [n, o]
        })
      : e,
  L1 = e => {
    if (e < 1) return { get: () => {}, set: () => {} }
    let t = 0,
      n = new Map(),
      r = new Map()
    const o = (s, i) => {
      ;(n.set(s, i), t++, t > e && ((t = 0), (r = n), (n = new Map())))
    }
    return {
      get(s) {
        let i = n.get(s)
        if (i !== void 0) return i
        if ((i = r.get(s)) !== void 0) return (o(s, i), i)
      },
      set(s, i) {
        n.has(s) ? n.set(s, i) : o(s, i)
      },
    }
  },
  lg = '!',
  I1 = e => {
    const { separator: t, experimentalParseClassName: n } = e,
      r = t.length === 1,
      o = t[0],
      s = t.length,
      i = l => {
        const a = []
        let u = 0,
          d = 0,
          f
        for (let w = 0; w < l.length; w++) {
          let m = l[w]
          if (u === 0) {
            if (m === o && (r || l.slice(w, w + s) === t)) {
              ;(a.push(l.slice(d, w)), (d = w + s))
              continue
            }
            if (m === '/') {
              f = w
              continue
            }
          }
          m === '[' ? u++ : m === ']' && u--
        }
        const g = a.length === 0 ? l : l.substring(d),
          p = g.startsWith(lg),
          b = p ? g.substring(1) : g,
          x = f && f > d ? f - d : void 0
        return {
          modifiers: a,
          hasImportantModifier: p,
          baseClassName: b,
          maybePostfixModifierPosition: x,
        }
      }
    return n ? l => n({ className: l, parseClassName: i }) : i
  },
  D1 = e => {
    if (e.length <= 1) return e
    const t = []
    let n = []
    return (
      e.forEach(r => {
        r[0] === '[' ? (t.push(...n.sort(), r), (n = [])) : n.push(r)
      }),
      t.push(...n.sort()),
      t
    )
  },
  z1 = e => ({ cache: L1(e.cacheSize), parseClassName: I1(e), ...R1(e) }),
  F1 = /\s+/,
  $1 = (e, t) => {
    const { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: o } = t,
      s = [],
      i = e.trim().split(F1)
    let l = ''
    for (let a = i.length - 1; a >= 0; a -= 1) {
      const u = i[a],
        {
          modifiers: d,
          hasImportantModifier: f,
          baseClassName: g,
          maybePostfixModifierPosition: p,
        } = n(u)
      let b = !!p,
        x = r(b ? g.substring(0, p) : g)
      if (!x) {
        if (!b) {
          l = u + (l.length > 0 ? ' ' + l : l)
          continue
        }
        if (((x = r(g)), !x)) {
          l = u + (l.length > 0 ? ' ' + l : l)
          continue
        }
        b = !1
      }
      const w = D1(d).join(':'),
        m = f ? w + lg : w,
        h = m + x
      if (s.includes(h)) continue
      s.push(h)
      const v = o(x, b)
      for (let k = 0; k < v.length; ++k) {
        const N = v[k]
        s.push(m + N)
      }
      l = u + (l.length > 0 ? ' ' + l : l)
    }
    return l
  }
function U1() {
  let e = 0,
    t,
    n,
    r = ''
  for (; e < arguments.length; ) (t = arguments[e++]) && (n = ag(t)) && (r && (r += ' '), (r += n))
  return r
}
const ag = e => {
  if (typeof e == 'string') return e
  let t,
    n = ''
  for (let r = 0; r < e.length; r++) e[r] && (t = ag(e[r])) && (n && (n += ' '), (n += t))
  return n
}
function B1(e, ...t) {
  let n,
    r,
    o,
    s = i
  function i(a) {
    const u = t.reduce((d, f) => f(d), e())
    return ((n = z1(u)), (r = n.cache.get), (o = n.cache.set), (s = l), l(a))
  }
  function l(a) {
    const u = r(a)
    if (u) return u
    const d = $1(a, n)
    return (o(a, d), d)
  }
  return function () {
    return s(U1.apply(null, arguments))
  }
}
const me = e => {
    const t = n => n[e] || []
    return ((t.isThemeGetter = !0), t)
  },
  ug = /^\[(?:([a-z-]+):)?(.+)\]$/i,
  H1 = /^\d+\/\d+$/,
  W1 = new Set(['px', 'full', 'screen']),
  V1 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  Q1 =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  K1 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
  Y1 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  G1 =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  un = e => ao(e) || W1.has(e) || H1.test(e),
  Rn = e => _o(e, 'length', rw),
  ao = e => !!e && !Number.isNaN(Number(e)),
  Ea = e => _o(e, 'number', ao),
  Vo = e => !!e && Number.isInteger(Number(e)),
  q1 = e => e.endsWith('%') && ao(e.slice(0, -1)),
  ne = e => ug.test(e),
  Mn = e => V1.test(e),
  X1 = new Set(['length', 'size', 'percentage']),
  Z1 = e => _o(e, X1, cg),
  J1 = e => _o(e, 'position', cg),
  ew = new Set(['image', 'url']),
  tw = e => _o(e, ew, sw),
  nw = e => _o(e, '', ow),
  Qo = () => !0,
  _o = (e, t, n) => {
    const r = ug.exec(e)
    return r ? (r[1] ? (typeof t == 'string' ? r[1] === t : t.has(r[1])) : n(r[2])) : !1
  },
  rw = e => Q1.test(e) && !K1.test(e),
  cg = () => !1,
  ow = e => Y1.test(e),
  sw = e => G1.test(e),
  iw = () => {
    const e = me('colors'),
      t = me('spacing'),
      n = me('blur'),
      r = me('brightness'),
      o = me('borderColor'),
      s = me('borderRadius'),
      i = me('borderSpacing'),
      l = me('borderWidth'),
      a = me('contrast'),
      u = me('grayscale'),
      d = me('hueRotate'),
      f = me('invert'),
      g = me('gap'),
      p = me('gradientColorStops'),
      b = me('gradientColorStopPositions'),
      x = me('inset'),
      w = me('margin'),
      m = me('opacity'),
      h = me('padding'),
      v = me('saturate'),
      k = me('scale'),
      N = me('sepia'),
      j = me('skew'),
      P = me('space'),
      T = me('translate'),
      I = () => ['auto', 'contain', 'none'],
      D = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
      Q = () => ['auto', ne, t],
      U = () => [ne, t],
      G = () => ['', un, Rn],
      $ = () => ['auto', ao, ne],
      re = () => [
        'bottom',
        'center',
        'left',
        'left-bottom',
        'left-top',
        'right',
        'right-bottom',
        'right-top',
        'top',
      ],
      K = () => ['solid', 'dashed', 'dotted', 'double', 'none'],
      W = () => [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
      ],
      R = () => ['start', 'end', 'center', 'between', 'around', 'evenly', 'stretch'],
      C = () => ['', '0', ne],
      _ = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'],
      B = () => [ao, ne]
    return {
      cacheSize: 500,
      separator: ':',
      theme: {
        colors: [Qo],
        spacing: [un, Rn],
        blur: ['none', '', Mn, ne],
        brightness: B(),
        borderColor: [e],
        borderRadius: ['none', '', 'full', Mn, ne],
        borderSpacing: U(),
        borderWidth: G(),
        contrast: B(),
        grayscale: C(),
        hueRotate: B(),
        invert: C(),
        gap: U(),
        gradientColorStops: [e],
        gradientColorStopPositions: [q1, Rn],
        inset: Q(),
        margin: Q(),
        opacity: B(),
        padding: U(),
        saturate: B(),
        scale: B(),
        sepia: C(),
        skew: B(),
        space: U(),
        translate: U(),
      },
      classGroups: {
        aspect: [{ aspect: ['auto', 'square', 'video', ne] }],
        container: ['container'],
        columns: [{ columns: [Mn] }],
        'break-after': [{ 'break-after': _() }],
        'break-before': [{ 'break-before': _() }],
        'break-inside': [{ 'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'] }],
        'box-decoration': [{ 'box-decoration': ['slice', 'clone'] }],
        box: [{ box: ['border', 'content'] }],
        display: [
          'block',
          'inline-block',
          'inline',
          'flex',
          'inline-flex',
          'table',
          'inline-table',
          'table-caption',
          'table-cell',
          'table-column',
          'table-column-group',
          'table-footer-group',
          'table-header-group',
          'table-row-group',
          'table-row',
          'flow-root',
          'grid',
          'inline-grid',
          'contents',
          'list-item',
          'hidden',
        ],
        float: [{ float: ['right', 'left', 'none', 'start', 'end'] }],
        clear: [{ clear: ['left', 'right', 'both', 'none', 'start', 'end'] }],
        isolation: ['isolate', 'isolation-auto'],
        'object-fit': [{ object: ['contain', 'cover', 'fill', 'none', 'scale-down'] }],
        'object-position': [{ object: [...re(), ne] }],
        overflow: [{ overflow: D() }],
        'overflow-x': [{ 'overflow-x': D() }],
        'overflow-y': [{ 'overflow-y': D() }],
        overscroll: [{ overscroll: I() }],
        'overscroll-x': [{ 'overscroll-x': I() }],
        'overscroll-y': [{ 'overscroll-y': I() }],
        position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
        inset: [{ inset: [x] }],
        'inset-x': [{ 'inset-x': [x] }],
        'inset-y': [{ 'inset-y': [x] }],
        start: [{ start: [x] }],
        end: [{ end: [x] }],
        top: [{ top: [x] }],
        right: [{ right: [x] }],
        bottom: [{ bottom: [x] }],
        left: [{ left: [x] }],
        visibility: ['visible', 'invisible', 'collapse'],
        z: [{ z: ['auto', Vo, ne] }],
        basis: [{ basis: Q() }],
        'flex-direction': [{ flex: ['row', 'row-reverse', 'col', 'col-reverse'] }],
        'flex-wrap': [{ flex: ['wrap', 'wrap-reverse', 'nowrap'] }],
        flex: [{ flex: ['1', 'auto', 'initial', 'none', ne] }],
        grow: [{ grow: C() }],
        shrink: [{ shrink: C() }],
        order: [{ order: ['first', 'last', 'none', Vo, ne] }],
        'grid-cols': [{ 'grid-cols': [Qo] }],
        'col-start-end': [{ col: ['auto', { span: ['full', Vo, ne] }, ne] }],
        'col-start': [{ 'col-start': $() }],
        'col-end': [{ 'col-end': $() }],
        'grid-rows': [{ 'grid-rows': [Qo] }],
        'row-start-end': [{ row: ['auto', { span: [Vo, ne] }, ne] }],
        'row-start': [{ 'row-start': $() }],
        'row-end': [{ 'row-end': $() }],
        'grid-flow': [{ 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] }],
        'auto-cols': [{ 'auto-cols': ['auto', 'min', 'max', 'fr', ne] }],
        'auto-rows': [{ 'auto-rows': ['auto', 'min', 'max', 'fr', ne] }],
        gap: [{ gap: [g] }],
        'gap-x': [{ 'gap-x': [g] }],
        'gap-y': [{ 'gap-y': [g] }],
        'justify-content': [{ justify: ['normal', ...R()] }],
        'justify-items': [{ 'justify-items': ['start', 'end', 'center', 'stretch'] }],
        'justify-self': [{ 'justify-self': ['auto', 'start', 'end', 'center', 'stretch'] }],
        'align-content': [{ content: ['normal', ...R(), 'baseline'] }],
        'align-items': [{ items: ['start', 'end', 'center', 'baseline', 'stretch'] }],
        'align-self': [{ self: ['auto', 'start', 'end', 'center', 'stretch', 'baseline'] }],
        'place-content': [{ 'place-content': [...R(), 'baseline'] }],
        'place-items': [{ 'place-items': ['start', 'end', 'center', 'baseline', 'stretch'] }],
        'place-self': [{ 'place-self': ['auto', 'start', 'end', 'center', 'stretch'] }],
        p: [{ p: [h] }],
        px: [{ px: [h] }],
        py: [{ py: [h] }],
        ps: [{ ps: [h] }],
        pe: [{ pe: [h] }],
        pt: [{ pt: [h] }],
        pr: [{ pr: [h] }],
        pb: [{ pb: [h] }],
        pl: [{ pl: [h] }],
        m: [{ m: [w] }],
        mx: [{ mx: [w] }],
        my: [{ my: [w] }],
        ms: [{ ms: [w] }],
        me: [{ me: [w] }],
        mt: [{ mt: [w] }],
        mr: [{ mr: [w] }],
        mb: [{ mb: [w] }],
        ml: [{ ml: [w] }],
        'space-x': [{ 'space-x': [P] }],
        'space-x-reverse': ['space-x-reverse'],
        'space-y': [{ 'space-y': [P] }],
        'space-y-reverse': ['space-y-reverse'],
        w: [{ w: ['auto', 'min', 'max', 'fit', 'svw', 'lvw', 'dvw', ne, t] }],
        'min-w': [{ 'min-w': [ne, t, 'min', 'max', 'fit'] }],
        'max-w': [
          { 'max-w': [ne, t, 'none', 'full', 'min', 'max', 'fit', 'prose', { screen: [Mn] }, Mn] },
        ],
        h: [{ h: [ne, t, 'auto', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] }],
        'min-h': [{ 'min-h': [ne, t, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] }],
        'max-h': [{ 'max-h': [ne, t, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] }],
        size: [{ size: [ne, t, 'auto', 'min', 'max', 'fit'] }],
        'font-size': [{ text: ['base', Mn, Rn] }],
        'font-smoothing': ['antialiased', 'subpixel-antialiased'],
        'font-style': ['italic', 'not-italic'],
        'font-weight': [
          {
            font: [
              'thin',
              'extralight',
              'light',
              'normal',
              'medium',
              'semibold',
              'bold',
              'extrabold',
              'black',
              Ea,
            ],
          },
        ],
        'font-family': [{ font: [Qo] }],
        'fvn-normal': ['normal-nums'],
        'fvn-ordinal': ['ordinal'],
        'fvn-slashed-zero': ['slashed-zero'],
        'fvn-figure': ['lining-nums', 'oldstyle-nums'],
        'fvn-spacing': ['proportional-nums', 'tabular-nums'],
        'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
        tracking: [{ tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest', ne] }],
        'line-clamp': [{ 'line-clamp': ['none', ao, Ea] }],
        leading: [{ leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose', un, ne] }],
        'list-image': [{ 'list-image': ['none', ne] }],
        'list-style-type': [{ list: ['none', 'disc', 'decimal', ne] }],
        'list-style-position': [{ list: ['inside', 'outside'] }],
        'placeholder-color': [{ placeholder: [e] }],
        'placeholder-opacity': [{ 'placeholder-opacity': [m] }],
        'text-alignment': [{ text: ['left', 'center', 'right', 'justify', 'start', 'end'] }],
        'text-color': [{ text: [e] }],
        'text-opacity': [{ 'text-opacity': [m] }],
        'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
        'text-decoration-style': [{ decoration: [...K(), 'wavy'] }],
        'text-decoration-thickness': [{ decoration: ['auto', 'from-font', un, Rn] }],
        'underline-offset': [{ 'underline-offset': ['auto', un, ne] }],
        'text-decoration-color': [{ decoration: [e] }],
        'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
        'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
        'text-wrap': [{ text: ['wrap', 'nowrap', 'balance', 'pretty'] }],
        indent: [{ indent: U() }],
        'vertical-align': [
          {
            align: [
              'baseline',
              'top',
              'middle',
              'bottom',
              'text-top',
              'text-bottom',
              'sub',
              'super',
              ne,
            ],
          },
        ],
        whitespace: [
          { whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] },
        ],
        break: [{ break: ['normal', 'words', 'all', 'keep'] }],
        hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
        content: [{ content: ['none', ne] }],
        'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
        'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
        'bg-opacity': [{ 'bg-opacity': [m] }],
        'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
        'bg-position': [{ bg: [...re(), J1] }],
        'bg-repeat': [{ bg: ['no-repeat', { repeat: ['', 'x', 'y', 'round', 'space'] }] }],
        'bg-size': [{ bg: ['auto', 'cover', 'contain', Z1] }],
        'bg-image': [
          { bg: ['none', { 'gradient-to': ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] }, tw] },
        ],
        'bg-color': [{ bg: [e] }],
        'gradient-from-pos': [{ from: [b] }],
        'gradient-via-pos': [{ via: [b] }],
        'gradient-to-pos': [{ to: [b] }],
        'gradient-from': [{ from: [p] }],
        'gradient-via': [{ via: [p] }],
        'gradient-to': [{ to: [p] }],
        rounded: [{ rounded: [s] }],
        'rounded-s': [{ 'rounded-s': [s] }],
        'rounded-e': [{ 'rounded-e': [s] }],
        'rounded-t': [{ 'rounded-t': [s] }],
        'rounded-r': [{ 'rounded-r': [s] }],
        'rounded-b': [{ 'rounded-b': [s] }],
        'rounded-l': [{ 'rounded-l': [s] }],
        'rounded-ss': [{ 'rounded-ss': [s] }],
        'rounded-se': [{ 'rounded-se': [s] }],
        'rounded-ee': [{ 'rounded-ee': [s] }],
        'rounded-es': [{ 'rounded-es': [s] }],
        'rounded-tl': [{ 'rounded-tl': [s] }],
        'rounded-tr': [{ 'rounded-tr': [s] }],
        'rounded-br': [{ 'rounded-br': [s] }],
        'rounded-bl': [{ 'rounded-bl': [s] }],
        'border-w': [{ border: [l] }],
        'border-w-x': [{ 'border-x': [l] }],
        'border-w-y': [{ 'border-y': [l] }],
        'border-w-s': [{ 'border-s': [l] }],
        'border-w-e': [{ 'border-e': [l] }],
        'border-w-t': [{ 'border-t': [l] }],
        'border-w-r': [{ 'border-r': [l] }],
        'border-w-b': [{ 'border-b': [l] }],
        'border-w-l': [{ 'border-l': [l] }],
        'border-opacity': [{ 'border-opacity': [m] }],
        'border-style': [{ border: [...K(), 'hidden'] }],
        'divide-x': [{ 'divide-x': [l] }],
        'divide-x-reverse': ['divide-x-reverse'],
        'divide-y': [{ 'divide-y': [l] }],
        'divide-y-reverse': ['divide-y-reverse'],
        'divide-opacity': [{ 'divide-opacity': [m] }],
        'divide-style': [{ divide: K() }],
        'border-color': [{ border: [o] }],
        'border-color-x': [{ 'border-x': [o] }],
        'border-color-y': [{ 'border-y': [o] }],
        'border-color-s': [{ 'border-s': [o] }],
        'border-color-e': [{ 'border-e': [o] }],
        'border-color-t': [{ 'border-t': [o] }],
        'border-color-r': [{ 'border-r': [o] }],
        'border-color-b': [{ 'border-b': [o] }],
        'border-color-l': [{ 'border-l': [o] }],
        'divide-color': [{ divide: [o] }],
        'outline-style': [{ outline: ['', ...K()] }],
        'outline-offset': [{ 'outline-offset': [un, ne] }],
        'outline-w': [{ outline: [un, Rn] }],
        'outline-color': [{ outline: [e] }],
        'ring-w': [{ ring: G() }],
        'ring-w-inset': ['ring-inset'],
        'ring-color': [{ ring: [e] }],
        'ring-opacity': [{ 'ring-opacity': [m] }],
        'ring-offset-w': [{ 'ring-offset': [un, Rn] }],
        'ring-offset-color': [{ 'ring-offset': [e] }],
        shadow: [{ shadow: ['', 'inner', 'none', Mn, nw] }],
        'shadow-color': [{ shadow: [Qo] }],
        opacity: [{ opacity: [m] }],
        'mix-blend': [{ 'mix-blend': [...W(), 'plus-lighter', 'plus-darker'] }],
        'bg-blend': [{ 'bg-blend': W() }],
        filter: [{ filter: ['', 'none'] }],
        blur: [{ blur: [n] }],
        brightness: [{ brightness: [r] }],
        contrast: [{ contrast: [a] }],
        'drop-shadow': [{ 'drop-shadow': ['', 'none', Mn, ne] }],
        grayscale: [{ grayscale: [u] }],
        'hue-rotate': [{ 'hue-rotate': [d] }],
        invert: [{ invert: [f] }],
        saturate: [{ saturate: [v] }],
        sepia: [{ sepia: [N] }],
        'backdrop-filter': [{ 'backdrop-filter': ['', 'none'] }],
        'backdrop-blur': [{ 'backdrop-blur': [n] }],
        'backdrop-brightness': [{ 'backdrop-brightness': [r] }],
        'backdrop-contrast': [{ 'backdrop-contrast': [a] }],
        'backdrop-grayscale': [{ 'backdrop-grayscale': [u] }],
        'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [d] }],
        'backdrop-invert': [{ 'backdrop-invert': [f] }],
        'backdrop-opacity': [{ 'backdrop-opacity': [m] }],
        'backdrop-saturate': [{ 'backdrop-saturate': [v] }],
        'backdrop-sepia': [{ 'backdrop-sepia': [N] }],
        'border-collapse': [{ border: ['collapse', 'separate'] }],
        'border-spacing': [{ 'border-spacing': [i] }],
        'border-spacing-x': [{ 'border-spacing-x': [i] }],
        'border-spacing-y': [{ 'border-spacing-y': [i] }],
        'table-layout': [{ table: ['auto', 'fixed'] }],
        caption: [{ caption: ['top', 'bottom'] }],
        transition: [
          { transition: ['none', 'all', '', 'colors', 'opacity', 'shadow', 'transform', ne] },
        ],
        duration: [{ duration: B() }],
        ease: [{ ease: ['linear', 'in', 'out', 'in-out', ne] }],
        delay: [{ delay: B() }],
        animate: [{ animate: ['none', 'spin', 'ping', 'pulse', 'bounce', ne] }],
        transform: [{ transform: ['', 'gpu', 'none'] }],
        scale: [{ scale: [k] }],
        'scale-x': [{ 'scale-x': [k] }],
        'scale-y': [{ 'scale-y': [k] }],
        rotate: [{ rotate: [Vo, ne] }],
        'translate-x': [{ 'translate-x': [T] }],
        'translate-y': [{ 'translate-y': [T] }],
        'skew-x': [{ 'skew-x': [j] }],
        'skew-y': [{ 'skew-y': [j] }],
        'transform-origin': [
          {
            origin: [
              'center',
              'top',
              'top-right',
              'right',
              'bottom-right',
              'bottom',
              'bottom-left',
              'left',
              'top-left',
              ne,
            ],
          },
        ],
        accent: [{ accent: ['auto', e] }],
        appearance: [{ appearance: ['none', 'auto'] }],
        cursor: [
          {
            cursor: [
              'auto',
              'default',
              'pointer',
              'wait',
              'text',
              'move',
              'help',
              'not-allowed',
              'none',
              'context-menu',
              'progress',
              'cell',
              'crosshair',
              'vertical-text',
              'alias',
              'copy',
              'no-drop',
              'grab',
              'grabbing',
              'all-scroll',
              'col-resize',
              'row-resize',
              'n-resize',
              'e-resize',
              's-resize',
              'w-resize',
              'ne-resize',
              'nw-resize',
              'se-resize',
              'sw-resize',
              'ew-resize',
              'ns-resize',
              'nesw-resize',
              'nwse-resize',
              'zoom-in',
              'zoom-out',
              ne,
            ],
          },
        ],
        'caret-color': [{ caret: [e] }],
        'pointer-events': [{ 'pointer-events': ['none', 'auto'] }],
        resize: [{ resize: ['none', 'y', 'x', ''] }],
        'scroll-behavior': [{ scroll: ['auto', 'smooth'] }],
        'scroll-m': [{ 'scroll-m': U() }],
        'scroll-mx': [{ 'scroll-mx': U() }],
        'scroll-my': [{ 'scroll-my': U() }],
        'scroll-ms': [{ 'scroll-ms': U() }],
        'scroll-me': [{ 'scroll-me': U() }],
        'scroll-mt': [{ 'scroll-mt': U() }],
        'scroll-mr': [{ 'scroll-mr': U() }],
        'scroll-mb': [{ 'scroll-mb': U() }],
        'scroll-ml': [{ 'scroll-ml': U() }],
        'scroll-p': [{ 'scroll-p': U() }],
        'scroll-px': [{ 'scroll-px': U() }],
        'scroll-py': [{ 'scroll-py': U() }],
        'scroll-ps': [{ 'scroll-ps': U() }],
        'scroll-pe': [{ 'scroll-pe': U() }],
        'scroll-pt': [{ 'scroll-pt': U() }],
        'scroll-pr': [{ 'scroll-pr': U() }],
        'scroll-pb': [{ 'scroll-pb': U() }],
        'scroll-pl': [{ 'scroll-pl': U() }],
        'snap-align': [{ snap: ['start', 'end', 'center', 'align-none'] }],
        'snap-stop': [{ snap: ['normal', 'always'] }],
        'snap-type': [{ snap: ['none', 'x', 'y', 'both'] }],
        'snap-strictness': [{ snap: ['mandatory', 'proximity'] }],
        touch: [{ touch: ['auto', 'none', 'manipulation'] }],
        'touch-x': [{ 'touch-pan': ['x', 'left', 'right'] }],
        'touch-y': [{ 'touch-pan': ['y', 'up', 'down'] }],
        'touch-pz': ['touch-pinch-zoom'],
        select: [{ select: ['none', 'text', 'all', 'auto'] }],
        'will-change': [{ 'will-change': ['auto', 'scroll', 'contents', 'transform', ne] }],
        fill: [{ fill: [e, 'none'] }],
        'stroke-w': [{ stroke: [un, Rn, Ea] }],
        stroke: [{ stroke: [e, 'none'] }],
        sr: ['sr-only', 'not-sr-only'],
        'forced-color-adjust': [{ 'forced-color-adjust': ['auto', 'none'] }],
      },
      conflictingClassGroups: {
        overflow: ['overflow-x', 'overflow-y'],
        overscroll: ['overscroll-x', 'overscroll-y'],
        inset: ['inset-x', 'inset-y', 'start', 'end', 'top', 'right', 'bottom', 'left'],
        'inset-x': ['right', 'left'],
        'inset-y': ['top', 'bottom'],
        flex: ['basis', 'grow', 'shrink'],
        gap: ['gap-x', 'gap-y'],
        p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
        px: ['pr', 'pl'],
        py: ['pt', 'pb'],
        m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
        mx: ['mr', 'ml'],
        my: ['mt', 'mb'],
        size: ['w', 'h'],
        'font-size': ['leading'],
        'fvn-normal': [
          'fvn-ordinal',
          'fvn-slashed-zero',
          'fvn-figure',
          'fvn-spacing',
          'fvn-fraction',
        ],
        'fvn-ordinal': ['fvn-normal'],
        'fvn-slashed-zero': ['fvn-normal'],
        'fvn-figure': ['fvn-normal'],
        'fvn-spacing': ['fvn-normal'],
        'fvn-fraction': ['fvn-normal'],
        'line-clamp': ['display', 'overflow'],
        rounded: [
          'rounded-s',
          'rounded-e',
          'rounded-t',
          'rounded-r',
          'rounded-b',
          'rounded-l',
          'rounded-ss',
          'rounded-se',
          'rounded-ee',
          'rounded-es',
          'rounded-tl',
          'rounded-tr',
          'rounded-br',
          'rounded-bl',
        ],
        'rounded-s': ['rounded-ss', 'rounded-es'],
        'rounded-e': ['rounded-se', 'rounded-ee'],
        'rounded-t': ['rounded-tl', 'rounded-tr'],
        'rounded-r': ['rounded-tr', 'rounded-br'],
        'rounded-b': ['rounded-br', 'rounded-bl'],
        'rounded-l': ['rounded-tl', 'rounded-bl'],
        'border-spacing': ['border-spacing-x', 'border-spacing-y'],
        'border-w': [
          'border-w-s',
          'border-w-e',
          'border-w-t',
          'border-w-r',
          'border-w-b',
          'border-w-l',
        ],
        'border-w-x': ['border-w-r', 'border-w-l'],
        'border-w-y': ['border-w-t', 'border-w-b'],
        'border-color': [
          'border-color-s',
          'border-color-e',
          'border-color-t',
          'border-color-r',
          'border-color-b',
          'border-color-l',
        ],
        'border-color-x': ['border-color-r', 'border-color-l'],
        'border-color-y': ['border-color-t', 'border-color-b'],
        'scroll-m': [
          'scroll-mx',
          'scroll-my',
          'scroll-ms',
          'scroll-me',
          'scroll-mt',
          'scroll-mr',
          'scroll-mb',
          'scroll-ml',
        ],
        'scroll-mx': ['scroll-mr', 'scroll-ml'],
        'scroll-my': ['scroll-mt', 'scroll-mb'],
        'scroll-p': [
          'scroll-px',
          'scroll-py',
          'scroll-ps',
          'scroll-pe',
          'scroll-pt',
          'scroll-pr',
          'scroll-pb',
          'scroll-pl',
        ],
        'scroll-px': ['scroll-pr', 'scroll-pl'],
        'scroll-py': ['scroll-pt', 'scroll-pb'],
        touch: ['touch-x', 'touch-y', 'touch-pz'],
        'touch-x': ['touch'],
        'touch-y': ['touch'],
        'touch-pz': ['touch'],
      },
      conflictingClassGroupModifiers: { 'font-size': ['leading'] },
    }
  },
  lw = B1(iw)
function Lr(...e) {
  return lw(og(e))
}
const aw = Qx,
  dg = y.forwardRef(({ className: e, ...t }, n) =>
    c.jsx(Xm, {
      ref: n,
      className: Lr(
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        e
      ),
      ...t,
    })
  )
dg.displayName = Xm.displayName
const uw = Kx(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
      variants: {
        variant: {
          default: 'border bg-background text-foreground',
          destructive:
            'destructive group border-destructive bg-destructive text-destructive-foreground',
        },
      },
      defaultVariants: { variant: 'default' },
    }
  ),
  fg = y.forwardRef(({ className: e, variant: t, ...n }, r) =>
    c.jsx(Zm, { ref: r, className: Lr(uw({ variant: t }), e), ...n })
  )
fg.displayName = Zm.displayName
const cw = y.forwardRef(({ className: e, ...t }, n) =>
  c.jsx(tg, {
    ref: n,
    className: Lr(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50',
      e
    ),
    ...t,
  })
)
cw.displayName = tg.displayName
const pg = y.forwardRef(({ className: e, ...t }, n) =>
  c.jsx(ng, {
    ref: n,
    className: Lr(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      e
    ),
    'toast-close': '',
    ...t,
    children: c.jsx(Dt, { className: 'h-4 w-4' }),
  })
)
pg.displayName = ng.displayName
const hg = y.forwardRef(({ className: e, ...t }, n) =>
  c.jsx(Jm, { ref: n, className: Lr('text-sm font-semibold', e), ...t })
)
hg.displayName = Jm.displayName
const mg = y.forwardRef(({ className: e, ...t }, n) =>
  c.jsx(eg, { ref: n, className: Lr('text-sm opacity-90', e), ...t })
)
mg.displayName = eg.displayName
function dw() {
  const { toasts: e } = ex()
  return c.jsxs(aw, {
    children: [
      e.map(function ({ id: t, title: n, description: r, action: o, ...s }) {
        return c.jsxs(
          fg,
          {
            ...s,
            children: [
              c.jsxs('div', {
                className: 'grid gap-1',
                children: [n && c.jsx(hg, { children: n }), r && c.jsx(mg, { children: r })],
              }),
              o,
              c.jsx(pg, {}),
            ],
          },
          t
        )
      }),
      c.jsx(dg, {}),
    ],
  })
}
var Ef = ['light', 'dark'],
  fw = '(prefers-color-scheme: dark)',
  pw = y.createContext(void 0),
  hw = { setTheme: e => {}, themes: [] },
  mw = () => {
    var e
    return (e = y.useContext(pw)) != null ? e : hw
  }
y.memo(
  ({
    forcedTheme: e,
    storageKey: t,
    attribute: n,
    enableSystem: r,
    enableColorScheme: o,
    defaultTheme: s,
    value: i,
    attrs: l,
    nonce: a,
  }) => {
    let u = s === 'system',
      d =
        n === 'class'
          ? `var d=document.documentElement,c=d.classList;${`c.remove(${l.map(b => `'${b}'`).join(',')})`};`
          : `var d=document.documentElement,n='${n}',s='setAttribute';`,
      f = o
        ? Ef.includes(s) && s
          ? `if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${s}'`
          : "if(e==='light'||e==='dark')d.style.colorScheme=e"
        : '',
      g = (b, x = !1, w = !0) => {
        let m = i ? i[b] : b,
          h = x ? b + "|| ''" : `'${m}'`,
          v = ''
        return (
          o && w && !x && Ef.includes(b) && (v += `d.style.colorScheme = '${b}';`),
          n === 'class'
            ? x || m
              ? (v += `c.add(${h})`)
              : (v += 'null')
            : m && (v += `d[s](n,${h})`),
          v
        )
      },
      p = e
        ? `!function(){${d}${g(e)}}()`
        : r
          ? `!function(){try{${d}var e=localStorage.getItem('${t}');if('system'===e||(!e&&${u})){var t='${fw}',m=window.matchMedia(t);if(m.media!==t||m.matches){${g('dark')}}else{${g('light')}}}else if(e){${i ? `var x=${JSON.stringify(i)};` : ''}${g(i ? 'x[e]' : 'e', !0)}}${u ? '' : 'else{' + g(s, !1, !1) + '}'}${f}}catch(e){}}()`
          : `!function(){try{${d}var e=localStorage.getItem('${t}');if(e){${i ? `var x=${JSON.stringify(i)};` : ''}${g(i ? 'x[e]' : 'e', !0)}}else{${g(s, !1, !1)};}${f}}catch(t){}}();`
    return y.createElement('script', { nonce: a, dangerouslySetInnerHTML: { __html: p } })
  }
)
var gw = e => {
    switch (e) {
      case 'success':
        return xw
      case 'info':
        return bw
      case 'warning':
        return ww
      case 'error':
        return Sw
      default:
        return null
    }
  },
  yw = Array(12).fill(0),
  vw = ({ visible: e, className: t }) =>
    F.createElement(
      'div',
      { className: ['sonner-loading-wrapper', t].filter(Boolean).join(' '), 'data-visible': e },
      F.createElement(
        'div',
        { className: 'sonner-spinner' },
        yw.map((n, r) =>
          F.createElement('div', { className: 'sonner-loading-bar', key: `spinner-bar-${r}` })
        )
      )
    ),
  xw = F.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    F.createElement('path', {
      fillRule: 'evenodd',
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z',
      clipRule: 'evenodd',
    })
  ),
  ww = F.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    F.createElement('path', {
      fillRule: 'evenodd',
      d: 'M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z',
      clipRule: 'evenodd',
    })
  ),
  bw = F.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    F.createElement('path', {
      fillRule: 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z',
      clipRule: 'evenodd',
    })
  ),
  Sw = F.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    F.createElement('path', {
      fillRule: 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z',
      clipRule: 'evenodd',
    })
  ),
  kw = F.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '12',
      height: '12',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    F.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    F.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  ),
  Cw = () => {
    let [e, t] = F.useState(document.hidden)
    return (
      F.useEffect(() => {
        let n = () => {
          t(document.hidden)
        }
        return (
          document.addEventListener('visibilitychange', n),
          () => window.removeEventListener('visibilitychange', n)
        )
      }, []),
      e
    )
  },
  Au = 1,
  Ew = class {
    constructor() {
      ;((this.subscribe = e => (
        this.subscribers.push(e),
        () => {
          let t = this.subscribers.indexOf(e)
          this.subscribers.splice(t, 1)
        }
      )),
        (this.publish = e => {
          this.subscribers.forEach(t => t(e))
        }),
        (this.addToast = e => {
          ;(this.publish(e), (this.toasts = [...this.toasts, e]))
        }),
        (this.create = e => {
          var t
          let { message: n, ...r } = e,
            o =
              typeof (e == null ? void 0 : e.id) == 'number' ||
              ((t = e.id) == null ? void 0 : t.length) > 0
                ? e.id
                : Au++,
            s = this.toasts.find(l => l.id === o),
            i = e.dismissible === void 0 ? !0 : e.dismissible
          return (
            this.dismissedToasts.has(o) && this.dismissedToasts.delete(o),
            s
              ? (this.toasts = this.toasts.map(l =>
                  l.id === o
                    ? (this.publish({ ...l, ...e, id: o, title: n }),
                      { ...l, ...e, id: o, dismissible: i, title: n })
                    : l
                ))
              : this.addToast({ title: n, ...r, dismissible: i, id: o }),
            o
          )
        }),
        (this.dismiss = e => (
          this.dismissedToasts.add(e),
          e ||
            this.toasts.forEach(t => {
              this.subscribers.forEach(n => n({ id: t.id, dismiss: !0 }))
            }),
          this.subscribers.forEach(t => t({ id: e, dismiss: !0 })),
          e
        )),
        (this.message = (e, t) => this.create({ ...t, message: e })),
        (this.error = (e, t) => this.create({ ...t, message: e, type: 'error' })),
        (this.success = (e, t) => this.create({ ...t, type: 'success', message: e })),
        (this.info = (e, t) => this.create({ ...t, type: 'info', message: e })),
        (this.warning = (e, t) => this.create({ ...t, type: 'warning', message: e })),
        (this.loading = (e, t) => this.create({ ...t, type: 'loading', message: e })),
        (this.promise = (e, t) => {
          if (!t) return
          let n
          t.loading !== void 0 &&
            (n = this.create({
              ...t,
              promise: e,
              type: 'loading',
              message: t.loading,
              description: typeof t.description != 'function' ? t.description : void 0,
            }))
          let r = e instanceof Promise ? e : e(),
            o = n !== void 0,
            s,
            i = r
              .then(async a => {
                if (((s = ['resolve', a]), F.isValidElement(a)))
                  ((o = !1), this.create({ id: n, type: 'default', message: a }))
                else if (Pw(a) && !a.ok) {
                  o = !1
                  let u =
                      typeof t.error == 'function'
                        ? await t.error(`HTTP error! status: ${a.status}`)
                        : t.error,
                    d =
                      typeof t.description == 'function'
                        ? await t.description(`HTTP error! status: ${a.status}`)
                        : t.description
                  this.create({ id: n, type: 'error', message: u, description: d })
                } else if (t.success !== void 0) {
                  o = !1
                  let u = typeof t.success == 'function' ? await t.success(a) : t.success,
                    d = typeof t.description == 'function' ? await t.description(a) : t.description
                  this.create({ id: n, type: 'success', message: u, description: d })
                }
              })
              .catch(async a => {
                if (((s = ['reject', a]), t.error !== void 0)) {
                  o = !1
                  let u = typeof t.error == 'function' ? await t.error(a) : t.error,
                    d = typeof t.description == 'function' ? await t.description(a) : t.description
                  this.create({ id: n, type: 'error', message: u, description: d })
                }
              })
              .finally(() => {
                var a
                ;(o && (this.dismiss(n), (n = void 0)), (a = t.finally) == null || a.call(t))
              }),
            l = () =>
              new Promise((a, u) => i.then(() => (s[0] === 'reject' ? u(s[1]) : a(s[1]))).catch(u))
          return typeof n != 'string' && typeof n != 'number'
            ? { unwrap: l }
            : Object.assign(n, { unwrap: l })
        }),
        (this.custom = (e, t) => {
          let n = (t == null ? void 0 : t.id) || Au++
          return (this.create({ jsx: e(n), id: n, ...t }), n)
        }),
        (this.getActiveToasts = () => this.toasts.filter(e => !this.dismissedToasts.has(e.id))),
        (this.subscribers = []),
        (this.toasts = []),
        (this.dismissedToasts = new Set()))
    }
  },
  tt = new Ew(),
  Nw = (e, t) => {
    let n = (t == null ? void 0 : t.id) || Au++
    return (tt.addToast({ title: e, ...t, id: n }), n)
  },
  Pw = e =>
    e &&
    typeof e == 'object' &&
    'ok' in e &&
    typeof e.ok == 'boolean' &&
    'status' in e &&
    typeof e.status == 'number',
  jw = Nw,
  Tw = () => tt.toasts,
  Rw = () => tt.getActiveToasts(),
  we = Object.assign(
    jw,
    {
      success: tt.success,
      info: tt.info,
      warning: tt.warning,
      error: tt.error,
      custom: tt.custom,
      message: tt.message,
      promise: tt.promise,
      dismiss: tt.dismiss,
      loading: tt.loading,
    },
    { getHistory: Tw, getToasts: Rw }
  )
function Mw(e, { insertAt: t } = {}) {
  if (typeof document > 'u') return
  let n = document.head || document.getElementsByTagName('head')[0],
    r = document.createElement('style')
  ;((r.type = 'text/css'),
    t === 'top' && n.firstChild ? n.insertBefore(r, n.firstChild) : n.appendChild(r),
    r.styleSheet ? (r.styleSheet.cssText = e) : r.appendChild(document.createTextNode(e)))
}
Mw(`:where(html[dir="ltr"]),:where([data-sonner-toaster][dir="ltr"]){--toast-icon-margin-start: -3px;--toast-icon-margin-end: 4px;--toast-svg-margin-start: -1px;--toast-svg-margin-end: 0px;--toast-button-margin-start: auto;--toast-button-margin-end: 0;--toast-close-button-start: 0;--toast-close-button-end: unset;--toast-close-button-transform: translate(-35%, -35%)}:where(html[dir="rtl"]),:where([data-sonner-toaster][dir="rtl"]){--toast-icon-margin-start: 4px;--toast-icon-margin-end: -3px;--toast-svg-margin-start: 0px;--toast-svg-margin-end: -1px;--toast-button-margin-start: 0;--toast-button-margin-end: auto;--toast-close-button-start: unset;--toast-close-button-end: 0;--toast-close-button-transform: translate(35%, -35%)}:where([data-sonner-toaster]){position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: 8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999;transition:transform .4s ease}:where([data-sonner-toaster][data-lifted="true"]){transform:translateY(-10px)}@media (hover: none) and (pointer: coarse){:where([data-sonner-toaster][data-lifted="true"]){transform:none}}:where([data-sonner-toaster][data-x-position="right"]){right:var(--offset-right)}:where([data-sonner-toaster][data-x-position="left"]){left:var(--offset-left)}:where([data-sonner-toaster][data-x-position="center"]){left:50%;transform:translate(-50%)}:where([data-sonner-toaster][data-y-position="top"]){top:var(--offset-top)}:where([data-sonner-toaster][data-y-position="bottom"]){bottom:var(--offset-bottom)}:where([data-sonner-toast]){--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}:where([data-sonner-toast][data-styled="true"]){padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}:where([data-sonner-toast]:focus-visible){box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast][data-y-position="top"]){top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}:where([data-sonner-toast][data-y-position="bottom"]){bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}:where([data-sonner-toast]) :where([data-description]){font-weight:400;line-height:1.4;color:inherit}:where([data-sonner-toast]) :where([data-title]){font-weight:500;line-height:1.5;color:inherit}:where([data-sonner-toast]) :where([data-icon]){display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}:where([data-sonner-toast][data-promise="true"]) :where([data-icon])>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}:where([data-sonner-toast]) :where([data-icon])>*{flex-shrink:0}:where([data-sonner-toast]) :where([data-icon]) svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}:where([data-sonner-toast]) :where([data-content]){display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}:where([data-sonner-toast]) :where([data-button]):focus-visible{box-shadow:0 0 0 2px #0006}:where([data-sonner-toast]) :where([data-button]):first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}:where([data-sonner-toast]) :where([data-cancel]){color:var(--normal-text);background:rgba(0,0,0,.08)}:where([data-sonner-toast][data-theme="dark"]) :where([data-cancel]){background:rgba(255,255,255,.3)}:where([data-sonner-toast]) :where([data-close-button]){position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]{background:var(--gray1)}:where([data-sonner-toast]) :where([data-close-button]):focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast]) :where([data-disabled="true"]){cursor:not-allowed}:where([data-sonner-toast]):hover :where([data-close-button]):hover{background:var(--gray2);border-color:var(--gray5)}:where([data-sonner-toast][data-swiping="true"]):before{content:"";position:absolute;left:-50%;right:-50%;height:100%;z-index:-1}:where([data-sonner-toast][data-y-position="top"][data-swiping="true"]):before{bottom:50%;transform:scaleY(3) translateY(50%)}:where([data-sonner-toast][data-y-position="bottom"][data-swiping="true"]):before{top:50%;transform:scaleY(3) translateY(-50%)}:where([data-sonner-toast][data-swiping="false"][data-removed="true"]):before{content:"";position:absolute;inset:0;transform:scaleY(2)}:where([data-sonner-toast]):after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}:where([data-sonner-toast][data-mounted="true"]){--y: translateY(0);opacity:1}:where([data-sonner-toast][data-expanded="false"][data-front="false"]){--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}:where([data-sonner-toast])>*{transition:opacity .4s}:where([data-sonner-toast][data-expanded="false"][data-front="false"][data-styled="true"])>*{opacity:0}:where([data-sonner-toast][data-visible="false"]){opacity:0;pointer-events:none}:where([data-sonner-toast][data-mounted="true"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}:where([data-sonner-toast][data-removed="true"][data-front="true"][data-swipe-out="false"]){--y: translateY(calc(var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="false"]){--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}:where([data-sonner-toast][data-removed="true"][data-front="false"]):before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y, 0px)) translate(var(--swipe-amount-x, 0px));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width: 600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: #fff;--normal-border: var(--gray4);--normal-text: var(--gray12);--success-bg: hsl(143, 85%, 96%);--success-border: hsl(145, 92%, 91%);--success-text: hsl(140, 100%, 27%);--info-bg: hsl(208, 100%, 97%);--info-border: hsl(221, 91%, 91%);--info-text: hsl(210, 92%, 45%);--warning-bg: hsl(49, 100%, 97%);--warning-border: hsl(49, 91%, 91%);--warning-text: hsl(31, 92%, 45%);--error-bg: hsl(359, 100%, 97%);--error-border: hsl(359, 100%, 94%);--error-text: hsl(360, 100%, 45%)}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: #000;--normal-border: hsl(0, 0%, 20%);--normal-text: var(--gray1)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: #fff;--normal-border: var(--gray3);--normal-text: var(--gray12)}[data-sonner-toaster][data-theme=dark]{--normal-bg: #000;--normal-bg-hover: hsl(0, 0%, 12%);--normal-border: hsl(0, 0%, 20%);--normal-border-hover: hsl(0, 0%, 25%);--normal-text: var(--gray1);--success-bg: hsl(150, 100%, 6%);--success-border: hsl(147, 100%, 12%);--success-text: hsl(150, 86%, 65%);--info-bg: hsl(215, 100%, 6%);--info-border: hsl(223, 100%, 12%);--info-text: hsl(216, 87%, 65%);--warning-bg: hsl(64, 100%, 6%);--warning-border: hsl(60, 100%, 12%);--warning-text: hsl(46, 87%, 65%);--error-bg: hsl(358, 76%, 10%);--error-border: hsl(357, 89%, 16%);--error-text: hsl(358, 100%, 81%)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success],[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info],[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning],[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error],[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media (prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}
`)
function yi(e) {
  return e.label !== void 0
}
var _w = 3,
  Ow = '32px',
  Aw = '16px',
  Nf = 4e3,
  Lw = 356,
  Iw = 14,
  Dw = 20,
  zw = 200
function Rt(...e) {
  return e.filter(Boolean).join(' ')
}
function Fw(e) {
  let [t, n] = e.split('-'),
    r = []
  return (t && r.push(t), n && r.push(n), r)
}
var $w = e => {
  var t, n, r, o, s, i, l, a, u, d, f
  let {
      invert: g,
      toast: p,
      unstyled: b,
      interacting: x,
      setHeights: w,
      visibleToasts: m,
      heights: h,
      index: v,
      toasts: k,
      expanded: N,
      removeToast: j,
      defaultRichColors: P,
      closeButton: T,
      style: I,
      cancelButtonStyle: D,
      actionButtonStyle: Q,
      className: U = '',
      descriptionClassName: G = '',
      duration: $,
      position: re,
      gap: K,
      loadingIcon: W,
      expandByDefault: R,
      classNames: C,
      icons: _,
      closeButtonAriaLabel: B = 'Close toast',
      pauseWhenPageIsHidden: H,
    } = e,
    [Z, te] = F.useState(null),
    [fe, ue] = F.useState(null),
    [J, De] = F.useState(!1),
    [Et, je] = F.useState(!1),
    [Ne, ln] = F.useState(!1),
    [Nt, ur] = F.useState(!1),
    [Fr, Wt] = F.useState(!1),
    [cr, dr] = F.useState(0),
    [se, Ws] = F.useState(0),
    Cn = F.useRef(p.duration || $ || Nf),
    $r = F.useRef(null),
    Pt = F.useRef(null),
    Bl = v === 0,
    Hl = v + 1 <= m,
    Je = p.type,
    En = p.dismissible !== !1,
    Wl = p.className || '',
    Vl = p.descriptionClassName || '',
    Ur = F.useMemo(() => h.findIndex(X => X.toastId === p.id) || 0, [h, p.id]),
    Ql = F.useMemo(() => {
      var X
      return (X = p.closeButton) != null ? X : T
    }, [p.closeButton, T]),
    Vs = F.useMemo(() => p.duration || $ || Nf, [p.duration, $]),
    Lo = F.useRef(0),
    Nn = F.useRef(0),
    Qs = F.useRef(0),
    Pn = F.useRef(null),
    [Ks, Kl] = re.split('-'),
    Ys = F.useMemo(() => h.reduce((X, ce, pe) => (pe >= Ur ? X : X + ce.height), 0), [h, Ur]),
    Gs = Cw(),
    Yl = p.invert || g,
    Io = Je === 'loading'
  ;((Nn.current = F.useMemo(() => Ur * K + Ys, [Ur, Ys])),
    F.useEffect(() => {
      Cn.current = Vs
    }, [Vs]),
    F.useEffect(() => {
      De(!0)
    }, []),
    F.useEffect(() => {
      let X = Pt.current
      if (X) {
        let ce = X.getBoundingClientRect().height
        return (
          Ws(ce),
          w(pe => [{ toastId: p.id, height: ce, position: p.position }, ...pe]),
          () => w(pe => pe.filter(at => at.toastId !== p.id))
        )
      }
    }, [w, p.id]),
    F.useLayoutEffect(() => {
      if (!J) return
      let X = Pt.current,
        ce = X.style.height
      X.style.height = 'auto'
      let pe = X.getBoundingClientRect().height
      ;((X.style.height = ce),
        Ws(pe),
        w(at =>
          at.find(ut => ut.toastId === p.id)
            ? at.map(ut => (ut.toastId === p.id ? { ...ut, height: pe } : ut))
            : [{ toastId: p.id, height: pe, position: p.position }, ...at]
        ))
    }, [J, p.title, p.description, w, p.id]))
  let jt = F.useCallback(() => {
    ;(je(!0),
      dr(Nn.current),
      w(X => X.filter(ce => ce.toastId !== p.id)),
      setTimeout(() => {
        j(p)
      }, zw))
  }, [p, j, w, Nn])
  ;(F.useEffect(() => {
    if ((p.promise && Je === 'loading') || p.duration === 1 / 0 || p.type === 'loading') return
    let X
    return (
      N || x || (H && Gs)
        ? (() => {
            if (Qs.current < Lo.current) {
              let ce = new Date().getTime() - Lo.current
              Cn.current = Cn.current - ce
            }
            Qs.current = new Date().getTime()
          })()
        : Cn.current !== 1 / 0 &&
          ((Lo.current = new Date().getTime()),
          (X = setTimeout(() => {
            var ce
            ;((ce = p.onAutoClose) == null || ce.call(p, p), jt())
          }, Cn.current))),
      () => clearTimeout(X)
    )
  }, [N, x, p, Je, H, Gs, jt]),
    F.useEffect(() => {
      p.delete && jt()
    }, [jt, p.delete]))
  function qs() {
    var X, ce, pe
    return _ != null && _.loading
      ? F.createElement(
          'div',
          {
            className: Rt(
              C == null ? void 0 : C.loader,
              (X = p == null ? void 0 : p.classNames) == null ? void 0 : X.loader,
              'sonner-loader'
            ),
            'data-visible': Je === 'loading',
          },
          _.loading
        )
      : W
        ? F.createElement(
            'div',
            {
              className: Rt(
                C == null ? void 0 : C.loader,
                (ce = p == null ? void 0 : p.classNames) == null ? void 0 : ce.loader,
                'sonner-loader'
              ),
              'data-visible': Je === 'loading',
            },
            W
          )
        : F.createElement(vw, {
            className: Rt(
              C == null ? void 0 : C.loader,
              (pe = p == null ? void 0 : p.classNames) == null ? void 0 : pe.loader
            ),
            visible: Je === 'loading',
          })
  }
  return F.createElement(
    'li',
    {
      tabIndex: 0,
      ref: Pt,
      className: Rt(
        U,
        Wl,
        C == null ? void 0 : C.toast,
        (t = p == null ? void 0 : p.classNames) == null ? void 0 : t.toast,
        C == null ? void 0 : C.default,
        C == null ? void 0 : C[Je],
        (n = p == null ? void 0 : p.classNames) == null ? void 0 : n[Je]
      ),
      'data-sonner-toast': '',
      'data-rich-colors': (r = p.richColors) != null ? r : P,
      'data-styled': !(p.jsx || p.unstyled || b),
      'data-mounted': J,
      'data-promise': !!p.promise,
      'data-swiped': Fr,
      'data-removed': Et,
      'data-visible': Hl,
      'data-y-position': Ks,
      'data-x-position': Kl,
      'data-index': v,
      'data-front': Bl,
      'data-swiping': Ne,
      'data-dismissible': En,
      'data-type': Je,
      'data-invert': Yl,
      'data-swipe-out': Nt,
      'data-swipe-direction': fe,
      'data-expanded': !!(N || (R && J)),
      style: {
        '--index': v,
        '--toasts-before': v,
        '--z-index': k.length - v,
        '--offset': `${Et ? cr : Nn.current}px`,
        '--initial-height': R ? 'auto' : `${se}px`,
        ...I,
        ...p.style,
      },
      onDragEnd: () => {
        ;(ln(!1), te(null), (Pn.current = null))
      },
      onPointerDown: X => {
        Io ||
          !En ||
          (($r.current = new Date()),
          dr(Nn.current),
          X.target.setPointerCapture(X.pointerId),
          X.target.tagName !== 'BUTTON' && (ln(!0), (Pn.current = { x: X.clientX, y: X.clientY })))
      },
      onPointerUp: () => {
        var X, ce, pe, at
        if (Nt || !En) return
        Pn.current = null
        let ut = Number(
            ((X = Pt.current) == null
              ? void 0
              : X.style.getPropertyValue('--swipe-amount-x').replace('px', '')) || 0
          ),
          Vt = Number(
            ((ce = Pt.current) == null
              ? void 0
              : ce.style.getPropertyValue('--swipe-amount-y').replace('px', '')) || 0
          ),
          an = new Date().getTime() - ((pe = $r.current) == null ? void 0 : pe.getTime()),
          S = Z === 'x' ? ut : Vt,
          M = Math.abs(S) / an
        if (Math.abs(S) >= Dw || M > 0.11) {
          ;(dr(Nn.current),
            (at = p.onDismiss) == null || at.call(p, p),
            ue(Z === 'x' ? (ut > 0 ? 'right' : 'left') : Vt > 0 ? 'down' : 'up'),
            jt(),
            ur(!0),
            Wt(!1))
          return
        }
        ;(ln(!1), te(null))
      },
      onPointerMove: X => {
        var ce, pe, at, ut
        if (
          !Pn.current ||
          !En ||
          ((ce = window.getSelection()) == null ? void 0 : ce.toString().length) > 0
        )
          return
        let Vt = X.clientY - Pn.current.y,
          an = X.clientX - Pn.current.x,
          S = (pe = e.swipeDirections) != null ? pe : Fw(re)
        !Z && (Math.abs(an) > 1 || Math.abs(Vt) > 1) && te(Math.abs(an) > Math.abs(Vt) ? 'x' : 'y')
        let M = { x: 0, y: 0 }
        ;(Z === 'y'
          ? (S.includes('top') || S.includes('bottom')) &&
            ((S.includes('top') && Vt < 0) || (S.includes('bottom') && Vt > 0)) &&
            (M.y = Vt)
          : Z === 'x' &&
            (S.includes('left') || S.includes('right')) &&
            ((S.includes('left') && an < 0) || (S.includes('right') && an > 0)) &&
            (M.x = an),
          (Math.abs(M.x) > 0 || Math.abs(M.y) > 0) && Wt(!0),
          (at = Pt.current) == null || at.style.setProperty('--swipe-amount-x', `${M.x}px`),
          (ut = Pt.current) == null || ut.style.setProperty('--swipe-amount-y', `${M.y}px`))
      },
    },
    Ql && !p.jsx
      ? F.createElement(
          'button',
          {
            'aria-label': B,
            'data-disabled': Io,
            'data-close-button': !0,
            onClick:
              Io || !En
                ? () => {}
                : () => {
                    var X
                    ;(jt(), (X = p.onDismiss) == null || X.call(p, p))
                  },
            className: Rt(
              C == null ? void 0 : C.closeButton,
              (o = p == null ? void 0 : p.classNames) == null ? void 0 : o.closeButton
            ),
          },
          (s = _ == null ? void 0 : _.close) != null ? s : kw
        )
      : null,
    p.jsx || y.isValidElement(p.title)
      ? p.jsx
        ? p.jsx
        : typeof p.title == 'function'
          ? p.title()
          : p.title
      : F.createElement(
          F.Fragment,
          null,
          Je || p.icon || p.promise
            ? F.createElement(
                'div',
                {
                  'data-icon': '',
                  className: Rt(
                    C == null ? void 0 : C.icon,
                    (i = p == null ? void 0 : p.classNames) == null ? void 0 : i.icon
                  ),
                },
                p.promise || (p.type === 'loading' && !p.icon) ? p.icon || qs() : null,
                p.type !== 'loading' ? p.icon || (_ == null ? void 0 : _[Je]) || gw(Je) : null
              )
            : null,
          F.createElement(
            'div',
            {
              'data-content': '',
              className: Rt(
                C == null ? void 0 : C.content,
                (l = p == null ? void 0 : p.classNames) == null ? void 0 : l.content
              ),
            },
            F.createElement(
              'div',
              {
                'data-title': '',
                className: Rt(
                  C == null ? void 0 : C.title,
                  (a = p == null ? void 0 : p.classNames) == null ? void 0 : a.title
                ),
              },
              typeof p.title == 'function' ? p.title() : p.title
            ),
            p.description
              ? F.createElement(
                  'div',
                  {
                    'data-description': '',
                    className: Rt(
                      G,
                      Vl,
                      C == null ? void 0 : C.description,
                      (u = p == null ? void 0 : p.classNames) == null ? void 0 : u.description
                    ),
                  },
                  typeof p.description == 'function' ? p.description() : p.description
                )
              : null
          ),
          y.isValidElement(p.cancel)
            ? p.cancel
            : p.cancel && yi(p.cancel)
              ? F.createElement(
                  'button',
                  {
                    'data-button': !0,
                    'data-cancel': !0,
                    style: p.cancelButtonStyle || D,
                    onClick: X => {
                      var ce, pe
                      yi(p.cancel) &&
                        En &&
                        ((pe = (ce = p.cancel).onClick) == null || pe.call(ce, X), jt())
                    },
                    className: Rt(
                      C == null ? void 0 : C.cancelButton,
                      (d = p == null ? void 0 : p.classNames) == null ? void 0 : d.cancelButton
                    ),
                  },
                  p.cancel.label
                )
              : null,
          y.isValidElement(p.action)
            ? p.action
            : p.action && yi(p.action)
              ? F.createElement(
                  'button',
                  {
                    'data-button': !0,
                    'data-action': !0,
                    style: p.actionButtonStyle || Q,
                    onClick: X => {
                      var ce, pe
                      yi(p.action) &&
                        ((pe = (ce = p.action).onClick) == null || pe.call(ce, X),
                        !X.defaultPrevented && jt())
                    },
                    className: Rt(
                      C == null ? void 0 : C.actionButton,
                      (f = p == null ? void 0 : p.classNames) == null ? void 0 : f.actionButton
                    ),
                  },
                  p.action.label
                )
              : null
        )
  )
}
function Pf() {
  if (typeof window > 'u' || typeof document > 'u') return 'ltr'
  let e = document.documentElement.getAttribute('dir')
  return e === 'auto' || !e ? window.getComputedStyle(document.documentElement).direction : e
}
function Uw(e, t) {
  let n = {}
  return (
    [e, t].forEach((r, o) => {
      let s = o === 1,
        i = s ? '--mobile-offset' : '--offset',
        l = s ? Aw : Ow
      function a(u) {
        ;['top', 'right', 'bottom', 'left'].forEach(d => {
          n[`${i}-${d}`] = typeof u == 'number' ? `${u}px` : u
        })
      }
      typeof r == 'number' || typeof r == 'string'
        ? a(r)
        : typeof r == 'object'
          ? ['top', 'right', 'bottom', 'left'].forEach(u => {
              r[u] === void 0
                ? (n[`${i}-${u}`] = l)
                : (n[`${i}-${u}`] = typeof r[u] == 'number' ? `${r[u]}px` : r[u])
            })
          : a(l)
    }),
    n
  )
}
var Bw = y.forwardRef(function (e, t) {
  let {
      invert: n,
      position: r = 'bottom-right',
      hotkey: o = ['altKey', 'KeyT'],
      expand: s,
      closeButton: i,
      className: l,
      offset: a,
      mobileOffset: u,
      theme: d = 'light',
      richColors: f,
      duration: g,
      style: p,
      visibleToasts: b = _w,
      toastOptions: x,
      dir: w = Pf(),
      gap: m = Iw,
      loadingIcon: h,
      icons: v,
      containerAriaLabel: k = 'Notifications',
      pauseWhenPageIsHidden: N,
    } = e,
    [j, P] = F.useState([]),
    T = F.useMemo(
      () => Array.from(new Set([r].concat(j.filter(H => H.position).map(H => H.position)))),
      [j, r]
    ),
    [I, D] = F.useState([]),
    [Q, U] = F.useState(!1),
    [G, $] = F.useState(!1),
    [re, K] = F.useState(
      d !== 'system'
        ? d
        : typeof window < 'u' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    ),
    W = F.useRef(null),
    R = o.join('+').replace(/Key/g, '').replace(/Digit/g, ''),
    C = F.useRef(null),
    _ = F.useRef(!1),
    B = F.useCallback(H => {
      P(Z => {
        var te
        return (
          ((te = Z.find(fe => fe.id === H.id)) != null && te.delete) || tt.dismiss(H.id),
          Z.filter(({ id: fe }) => fe !== H.id)
        )
      })
    }, [])
  return (
    F.useEffect(
      () =>
        tt.subscribe(H => {
          if (H.dismiss) {
            P(Z => Z.map(te => (te.id === H.id ? { ...te, delete: !0 } : te)))
            return
          }
          setTimeout(() => {
            Tm.flushSync(() => {
              P(Z => {
                let te = Z.findIndex(fe => fe.id === H.id)
                return te !== -1
                  ? [...Z.slice(0, te), { ...Z[te], ...H }, ...Z.slice(te + 1)]
                  : [H, ...Z]
              })
            })
          })
        }),
      []
    ),
    F.useEffect(() => {
      if (d !== 'system') {
        K(d)
        return
      }
      if (
        (d === 'system' &&
          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? K('dark')
            : K('light')),
        typeof window > 'u')
      )
        return
      let H = window.matchMedia('(prefers-color-scheme: dark)')
      try {
        H.addEventListener('change', ({ matches: Z }) => {
          K(Z ? 'dark' : 'light')
        })
      } catch {
        H.addListener(({ matches: te }) => {
          try {
            K(te ? 'dark' : 'light')
          } catch (fe) {
            console.error(fe)
          }
        })
      }
    }, [d]),
    F.useEffect(() => {
      j.length <= 1 && U(!1)
    }, [j]),
    F.useEffect(() => {
      let H = Z => {
        var te, fe
        ;(o.every(ue => Z[ue] || Z.code === ue) && (U(!0), (te = W.current) == null || te.focus()),
          Z.code === 'Escape' &&
            (document.activeElement === W.current ||
              ((fe = W.current) != null && fe.contains(document.activeElement))) &&
            U(!1))
      }
      return (
        document.addEventListener('keydown', H),
        () => document.removeEventListener('keydown', H)
      )
    }, [o]),
    F.useEffect(() => {
      if (W.current)
        return () => {
          C.current &&
            (C.current.focus({ preventScroll: !0 }), (C.current = null), (_.current = !1))
        }
    }, [W.current]),
    F.createElement(
      'section',
      {
        ref: t,
        'aria-label': `${k} ${R}`,
        tabIndex: -1,
        'aria-live': 'polite',
        'aria-relevant': 'additions text',
        'aria-atomic': 'false',
        suppressHydrationWarning: !0,
      },
      T.map((H, Z) => {
        var te
        let [fe, ue] = H.split('-')
        return j.length
          ? F.createElement(
              'ol',
              {
                key: H,
                dir: w === 'auto' ? Pf() : w,
                tabIndex: -1,
                ref: W,
                className: l,
                'data-sonner-toaster': !0,
                'data-theme': re,
                'data-y-position': fe,
                'data-lifted': Q && j.length > 1 && !s,
                'data-x-position': ue,
                style: {
                  '--front-toast-height': `${((te = I[0]) == null ? void 0 : te.height) || 0}px`,
                  '--width': `${Lw}px`,
                  '--gap': `${m}px`,
                  ...p,
                  ...Uw(a, u),
                },
                onBlur: J => {
                  _.current &&
                    !J.currentTarget.contains(J.relatedTarget) &&
                    ((_.current = !1),
                    C.current && (C.current.focus({ preventScroll: !0 }), (C.current = null)))
                },
                onFocus: J => {
                  ;(J.target instanceof HTMLElement && J.target.dataset.dismissible === 'false') ||
                    _.current ||
                    ((_.current = !0), (C.current = J.relatedTarget))
                },
                onMouseEnter: () => U(!0),
                onMouseMove: () => U(!0),
                onMouseLeave: () => {
                  G || U(!1)
                },
                onDragEnd: () => U(!1),
                onPointerDown: J => {
                  ;(J.target instanceof HTMLElement && J.target.dataset.dismissible === 'false') ||
                    $(!0)
                },
                onPointerUp: () => $(!1),
              },
              j
                .filter(J => (!J.position && Z === 0) || J.position === H)
                .map((J, De) => {
                  var Et, je
                  return F.createElement($w, {
                    key: J.id,
                    icons: v,
                    index: De,
                    toast: J,
                    defaultRichColors: f,
                    duration: (Et = x == null ? void 0 : x.duration) != null ? Et : g,
                    className: x == null ? void 0 : x.className,
                    descriptionClassName: x == null ? void 0 : x.descriptionClassName,
                    invert: n,
                    visibleToasts: b,
                    closeButton: (je = x == null ? void 0 : x.closeButton) != null ? je : i,
                    interacting: G,
                    position: H,
                    style: x == null ? void 0 : x.style,
                    unstyled: x == null ? void 0 : x.unstyled,
                    classNames: x == null ? void 0 : x.classNames,
                    cancelButtonStyle: x == null ? void 0 : x.cancelButtonStyle,
                    actionButtonStyle: x == null ? void 0 : x.actionButtonStyle,
                    removeToast: B,
                    toasts: j.filter(Ne => Ne.position == J.position),
                    heights: I.filter(Ne => Ne.position == J.position),
                    setHeights: D,
                    expandByDefault: s,
                    gap: m,
                    loadingIcon: h,
                    expanded: Q,
                    pauseWhenPageIsHidden: N,
                    swipeDirections: e.swipeDirections,
                  })
                })
            )
          : null
      })
    )
  )
})
const Hw = ({ ...e }) => {
    const { theme: t = 'system' } = mw()
    return c.jsx(Bw, {
      theme: t,
      className: 'toaster group',
      toastOptions: {
        classNames: {
          toast:
            'group toast whitespace-nowrap group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      },
      ...e,
    })
  },
  Ww = ['top', 'right', 'bottom', 'left'],
  or = Math.min,
  dt = Math.max,
  ll = Math.round,
  vi = Math.floor,
  nn = e => ({ x: e, y: e }),
  Vw = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
  Qw = { start: 'end', end: 'start' }
function Lu(e, t, n) {
  return dt(e, or(t, n))
}
function bn(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function Sn(e) {
  return e.split('-')[0]
}
function Oo(e) {
  return e.split('-')[1]
}
function Wc(e) {
  return e === 'x' ? 'y' : 'x'
}
function Vc(e) {
  return e === 'y' ? 'height' : 'width'
}
const Kw = new Set(['top', 'bottom'])
function Jt(e) {
  return Kw.has(Sn(e)) ? 'y' : 'x'
}
function Qc(e) {
  return Wc(Jt(e))
}
function Yw(e, t, n) {
  n === void 0 && (n = !1)
  const r = Oo(e),
    o = Qc(e),
    s = Vc(o)
  let i =
    o === 'x' ? (r === (n ? 'end' : 'start') ? 'right' : 'left') : r === 'start' ? 'bottom' : 'top'
  return (t.reference[s] > t.floating[s] && (i = al(i)), [i, al(i)])
}
function Gw(e) {
  const t = al(e)
  return [Iu(e), t, Iu(t)]
}
function Iu(e) {
  return e.replace(/start|end/g, t => Qw[t])
}
const jf = ['left', 'right'],
  Tf = ['right', 'left'],
  qw = ['top', 'bottom'],
  Xw = ['bottom', 'top']
function Zw(e, t, n) {
  switch (e) {
    case 'top':
    case 'bottom':
      return n ? (t ? Tf : jf) : t ? jf : Tf
    case 'left':
    case 'right':
      return t ? qw : Xw
    default:
      return []
  }
}
function Jw(e, t, n, r) {
  const o = Oo(e)
  let s = Zw(Sn(e), n === 'start', r)
  return (o && ((s = s.map(i => i + '-' + o)), t && (s = s.concat(s.map(Iu)))), s)
}
function al(e) {
  return e.replace(/left|right|bottom|top/g, t => Vw[t])
}
function eb(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e }
}
function gg(e) {
  return typeof e != 'number' ? eb(e) : { top: e, right: e, bottom: e, left: e }
}
function ul(e) {
  const { x: t, y: n, width: r, height: o } = e
  return { width: r, height: o, top: n, left: t, right: t + r, bottom: n + o, x: t, y: n }
}
function Rf(e, t, n) {
  let { reference: r, floating: o } = e
  const s = Jt(t),
    i = Qc(t),
    l = Vc(i),
    a = Sn(t),
    u = s === 'y',
    d = r.x + r.width / 2 - o.width / 2,
    f = r.y + r.height / 2 - o.height / 2,
    g = r[l] / 2 - o[l] / 2
  let p
  switch (a) {
    case 'top':
      p = { x: d, y: r.y - o.height }
      break
    case 'bottom':
      p = { x: d, y: r.y + r.height }
      break
    case 'right':
      p = { x: r.x + r.width, y: f }
      break
    case 'left':
      p = { x: r.x - o.width, y: f }
      break
    default:
      p = { x: r.x, y: r.y }
  }
  switch (Oo(t)) {
    case 'start':
      p[i] -= g * (n && u ? -1 : 1)
      break
    case 'end':
      p[i] += g * (n && u ? -1 : 1)
      break
  }
  return p
}
const tb = async (e, t, n) => {
  const { placement: r = 'bottom', strategy: o = 'absolute', middleware: s = [], platform: i } = n,
    l = s.filter(Boolean),
    a = await (i.isRTL == null ? void 0 : i.isRTL(t))
  let u = await i.getElementRects({ reference: e, floating: t, strategy: o }),
    { x: d, y: f } = Rf(u, r, a),
    g = r,
    p = {},
    b = 0
  for (let x = 0; x < l.length; x++) {
    const { name: w, fn: m } = l[x],
      {
        x: h,
        y: v,
        data: k,
        reset: N,
      } = await m({
        x: d,
        y: f,
        initialPlacement: r,
        placement: g,
        strategy: o,
        middlewareData: p,
        rects: u,
        platform: i,
        elements: { reference: e, floating: t },
      })
    ;((d = h ?? d),
      (f = v ?? f),
      (p = { ...p, [w]: { ...p[w], ...k } }),
      N &&
        b <= 50 &&
        (b++,
        typeof N == 'object' &&
          (N.placement && (g = N.placement),
          N.rects &&
            (u =
              N.rects === !0
                ? await i.getElementRects({ reference: e, floating: t, strategy: o })
                : N.rects),
          ({ x: d, y: f } = Rf(u, g, a))),
        (x = -1)))
  }
  return { x: d, y: f, placement: g, strategy: o, middlewareData: p }
}
async function Cs(e, t) {
  var n
  t === void 0 && (t = {})
  const { x: r, y: o, platform: s, rects: i, elements: l, strategy: a } = e,
    {
      boundary: u = 'clippingAncestors',
      rootBoundary: d = 'viewport',
      elementContext: f = 'floating',
      altBoundary: g = !1,
      padding: p = 0,
    } = bn(t, e),
    b = gg(p),
    w = l[g ? (f === 'floating' ? 'reference' : 'floating') : f],
    m = ul(
      await s.getClippingRect({
        element:
          (n = await (s.isElement == null ? void 0 : s.isElement(w))) == null || n
            ? w
            : w.contextElement ||
              (await (s.getDocumentElement == null ? void 0 : s.getDocumentElement(l.floating))),
        boundary: u,
        rootBoundary: d,
        strategy: a,
      })
    ),
    h =
      f === 'floating'
        ? { x: r, y: o, width: i.floating.width, height: i.floating.height }
        : i.reference,
    v = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(l.floating)),
    k = (await (s.isElement == null ? void 0 : s.isElement(v)))
      ? (await (s.getScale == null ? void 0 : s.getScale(v))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    N = ul(
      s.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: l,
            rect: h,
            offsetParent: v,
            strategy: a,
          })
        : h
    )
  return {
    top: (m.top - N.top + b.top) / k.y,
    bottom: (N.bottom - m.bottom + b.bottom) / k.y,
    left: (m.left - N.left + b.left) / k.x,
    right: (N.right - m.right + b.right) / k.x,
  }
}
const nb = e => ({
    name: 'arrow',
    options: e,
    async fn(t) {
      const { x: n, y: r, placement: o, rects: s, platform: i, elements: l, middlewareData: a } = t,
        { element: u, padding: d = 0 } = bn(e, t) || {}
      if (u == null) return {}
      const f = gg(d),
        g = { x: n, y: r },
        p = Qc(o),
        b = Vc(p),
        x = await i.getDimensions(u),
        w = p === 'y',
        m = w ? 'top' : 'left',
        h = w ? 'bottom' : 'right',
        v = w ? 'clientHeight' : 'clientWidth',
        k = s.reference[b] + s.reference[p] - g[p] - s.floating[b],
        N = g[p] - s.reference[p],
        j = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(u))
      let P = j ? j[v] : 0
      ;(!P || !(await (i.isElement == null ? void 0 : i.isElement(j)))) &&
        (P = l.floating[v] || s.floating[b])
      const T = k / 2 - N / 2,
        I = P / 2 - x[b] / 2 - 1,
        D = or(f[m], I),
        Q = or(f[h], I),
        U = D,
        G = P - x[b] - Q,
        $ = P / 2 - x[b] / 2 + T,
        re = Lu(U, $, G),
        K =
          !a.arrow &&
          Oo(o) != null &&
          $ !== re &&
          s.reference[b] / 2 - ($ < U ? D : Q) - x[b] / 2 < 0,
        W = K ? ($ < U ? $ - U : $ - G) : 0
      return {
        [p]: g[p] + W,
        data: { [p]: re, centerOffset: $ - re - W, ...(K && { alignmentOffset: W }) },
        reset: K,
      }
    },
  }),
  rb = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'flip',
        options: e,
        async fn(t) {
          var n, r
          const {
              placement: o,
              middlewareData: s,
              rects: i,
              initialPlacement: l,
              platform: a,
              elements: u,
            } = t,
            {
              mainAxis: d = !0,
              crossAxis: f = !0,
              fallbackPlacements: g,
              fallbackStrategy: p = 'bestFit',
              fallbackAxisSideDirection: b = 'none',
              flipAlignment: x = !0,
              ...w
            } = bn(e, t)
          if ((n = s.arrow) != null && n.alignmentOffset) return {}
          const m = Sn(o),
            h = Jt(l),
            v = Sn(l) === l,
            k = await (a.isRTL == null ? void 0 : a.isRTL(u.floating)),
            N = g || (v || !x ? [al(l)] : Gw(l)),
            j = b !== 'none'
          !g && j && N.push(...Jw(l, x, b, k))
          const P = [l, ...N],
            T = await Cs(t, w),
            I = []
          let D = ((r = s.flip) == null ? void 0 : r.overflows) || []
          if ((d && I.push(T[m]), f)) {
            const $ = Yw(o, i, k)
            I.push(T[$[0]], T[$[1]])
          }
          if (((D = [...D, { placement: o, overflows: I }]), !I.every($ => $ <= 0))) {
            var Q, U
            const $ = (((Q = s.flip) == null ? void 0 : Q.index) || 0) + 1,
              re = P[$]
            if (
              re &&
              (!(f === 'alignment' ? h !== Jt(re) : !1) ||
                D.every(R => R.overflows[0] > 0 && Jt(R.placement) === h))
            )
              return { data: { index: $, overflows: D }, reset: { placement: re } }
            let K =
              (U = D.filter(W => W.overflows[0] <= 0).sort(
                (W, R) => W.overflows[1] - R.overflows[1]
              )[0]) == null
                ? void 0
                : U.placement
            if (!K)
              switch (p) {
                case 'bestFit': {
                  var G
                  const W =
                    (G = D.filter(R => {
                      if (j) {
                        const C = Jt(R.placement)
                        return C === h || C === 'y'
                      }
                      return !0
                    })
                      .map(R => [
                        R.placement,
                        R.overflows.filter(C => C > 0).reduce((C, _) => C + _, 0),
                      ])
                      .sort((R, C) => R[1] - C[1])[0]) == null
                      ? void 0
                      : G[0]
                  W && (K = W)
                  break
                }
                case 'initialPlacement':
                  K = l
                  break
              }
            if (o !== K) return { reset: { placement: K } }
          }
          return {}
        },
      }
    )
  }
function Mf(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  }
}
function _f(e) {
  return Ww.some(t => e[t] >= 0)
}
const ob = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'hide',
        options: e,
        async fn(t) {
          const { rects: n } = t,
            { strategy: r = 'referenceHidden', ...o } = bn(e, t)
          switch (r) {
            case 'referenceHidden': {
              const s = await Cs(t, { ...o, elementContext: 'reference' }),
                i = Mf(s, n.reference)
              return { data: { referenceHiddenOffsets: i, referenceHidden: _f(i) } }
            }
            case 'escaped': {
              const s = await Cs(t, { ...o, altBoundary: !0 }),
                i = Mf(s, n.floating)
              return { data: { escapedOffsets: i, escaped: _f(i) } }
            }
            default:
              return {}
          }
        },
      }
    )
  },
  yg = new Set(['left', 'top'])
async function sb(e, t) {
  const { placement: n, platform: r, elements: o } = e,
    s = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)),
    i = Sn(n),
    l = Oo(n),
    a = Jt(n) === 'y',
    u = yg.has(i) ? -1 : 1,
    d = s && a ? -1 : 1,
    f = bn(t, e)
  let {
    mainAxis: g,
    crossAxis: p,
    alignmentAxis: b,
  } = typeof f == 'number'
    ? { mainAxis: f, crossAxis: 0, alignmentAxis: null }
    : { mainAxis: f.mainAxis || 0, crossAxis: f.crossAxis || 0, alignmentAxis: f.alignmentAxis }
  return (
    l && typeof b == 'number' && (p = l === 'end' ? b * -1 : b),
    a ? { x: p * d, y: g * u } : { x: g * u, y: p * d }
  )
}
const ib = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: 'offset',
        options: e,
        async fn(t) {
          var n, r
          const { x: o, y: s, placement: i, middlewareData: l } = t,
            a = await sb(t, e)
          return i === ((n = l.offset) == null ? void 0 : n.placement) &&
            (r = l.arrow) != null &&
            r.alignmentOffset
            ? {}
            : { x: o + a.x, y: s + a.y, data: { ...a, placement: i } }
        },
      }
    )
  },
  lb = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'shift',
        options: e,
        async fn(t) {
          const { x: n, y: r, placement: o } = t,
            {
              mainAxis: s = !0,
              crossAxis: i = !1,
              limiter: l = {
                fn: w => {
                  let { x: m, y: h } = w
                  return { x: m, y: h }
                },
              },
              ...a
            } = bn(e, t),
            u = { x: n, y: r },
            d = await Cs(t, a),
            f = Jt(Sn(o)),
            g = Wc(f)
          let p = u[g],
            b = u[f]
          if (s) {
            const w = g === 'y' ? 'top' : 'left',
              m = g === 'y' ? 'bottom' : 'right',
              h = p + d[w],
              v = p - d[m]
            p = Lu(h, p, v)
          }
          if (i) {
            const w = f === 'y' ? 'top' : 'left',
              m = f === 'y' ? 'bottom' : 'right',
              h = b + d[w],
              v = b - d[m]
            b = Lu(h, b, v)
          }
          const x = l.fn({ ...t, [g]: p, [f]: b })
          return { ...x, data: { x: x.x - n, y: x.y - r, enabled: { [g]: s, [f]: i } } }
        },
      }
    )
  },
  ab = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        options: e,
        fn(t) {
          const { x: n, y: r, placement: o, rects: s, middlewareData: i } = t,
            { offset: l = 0, mainAxis: a = !0, crossAxis: u = !0 } = bn(e, t),
            d = { x: n, y: r },
            f = Jt(o),
            g = Wc(f)
          let p = d[g],
            b = d[f]
          const x = bn(l, t),
            w =
              typeof x == 'number'
                ? { mainAxis: x, crossAxis: 0 }
                : { mainAxis: 0, crossAxis: 0, ...x }
          if (a) {
            const v = g === 'y' ? 'height' : 'width',
              k = s.reference[g] - s.floating[v] + w.mainAxis,
              N = s.reference[g] + s.reference[v] - w.mainAxis
            p < k ? (p = k) : p > N && (p = N)
          }
          if (u) {
            var m, h
            const v = g === 'y' ? 'width' : 'height',
              k = yg.has(Sn(o)),
              N =
                s.reference[f] -
                s.floating[v] +
                ((k && ((m = i.offset) == null ? void 0 : m[f])) || 0) +
                (k ? 0 : w.crossAxis),
              j =
                s.reference[f] +
                s.reference[v] +
                (k ? 0 : ((h = i.offset) == null ? void 0 : h[f]) || 0) -
                (k ? w.crossAxis : 0)
            b < N ? (b = N) : b > j && (b = j)
          }
          return { [g]: p, [f]: b }
        },
      }
    )
  },
  ub = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'size',
        options: e,
        async fn(t) {
          var n, r
          const { placement: o, rects: s, platform: i, elements: l } = t,
            { apply: a = () => {}, ...u } = bn(e, t),
            d = await Cs(t, u),
            f = Sn(o),
            g = Oo(o),
            p = Jt(o) === 'y',
            { width: b, height: x } = s.floating
          let w, m
          f === 'top' || f === 'bottom'
            ? ((w = f),
              (m =
                g === ((await (i.isRTL == null ? void 0 : i.isRTL(l.floating))) ? 'start' : 'end')
                  ? 'left'
                  : 'right'))
            : ((m = f), (w = g === 'end' ? 'top' : 'bottom'))
          const h = x - d.top - d.bottom,
            v = b - d.left - d.right,
            k = or(x - d[w], h),
            N = or(b - d[m], v),
            j = !t.middlewareData.shift
          let P = k,
            T = N
          if (
            ((n = t.middlewareData.shift) != null && n.enabled.x && (T = v),
            (r = t.middlewareData.shift) != null && r.enabled.y && (P = h),
            j && !g)
          ) {
            const D = dt(d.left, 0),
              Q = dt(d.right, 0),
              U = dt(d.top, 0),
              G = dt(d.bottom, 0)
            p
              ? (T = b - 2 * (D !== 0 || Q !== 0 ? D + Q : dt(d.left, d.right)))
              : (P = x - 2 * (U !== 0 || G !== 0 ? U + G : dt(d.top, d.bottom)))
          }
          await a({ ...t, availableWidth: T, availableHeight: P })
          const I = await i.getDimensions(l.floating)
          return b !== I.width || x !== I.height ? { reset: { rects: !0 } } : {}
        },
      }
    )
  }
function Al() {
  return typeof window < 'u'
}
function Ao(e) {
  return vg(e) ? (e.nodeName || '').toLowerCase() : '#document'
}
function ht(e) {
  var t
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window
}
function on(e) {
  var t
  return (t = (vg(e) ? e.ownerDocument : e.document) || window.document) == null
    ? void 0
    : t.documentElement
}
function vg(e) {
  return Al() ? e instanceof Node || e instanceof ht(e).Node : !1
}
function Bt(e) {
  return Al() ? e instanceof Element || e instanceof ht(e).Element : !1
}
function rn(e) {
  return Al() ? e instanceof HTMLElement || e instanceof ht(e).HTMLElement : !1
}
function Of(e) {
  return !Al() || typeof ShadowRoot > 'u'
    ? !1
    : e instanceof ShadowRoot || e instanceof ht(e).ShadowRoot
}
const cb = new Set(['inline', 'contents'])
function Us(e) {
  const { overflow: t, overflowX: n, overflowY: r, display: o } = Ht(e)
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !cb.has(o)
}
const db = new Set(['table', 'td', 'th'])
function fb(e) {
  return db.has(Ao(e))
}
const pb = [':popover-open', ':modal']
function Ll(e) {
  return pb.some(t => {
    try {
      return e.matches(t)
    } catch {
      return !1
    }
  })
}
const hb = ['transform', 'translate', 'scale', 'rotate', 'perspective'],
  mb = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'],
  gb = ['paint', 'layout', 'strict', 'content']
function Kc(e) {
  const t = Yc(),
    n = Bt(e) ? Ht(e) : e
  return (
    hb.some(r => (n[r] ? n[r] !== 'none' : !1)) ||
    (n.containerType ? n.containerType !== 'normal' : !1) ||
    (!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
    (!t && (n.filter ? n.filter !== 'none' : !1)) ||
    mb.some(r => (n.willChange || '').includes(r)) ||
    gb.some(r => (n.contain || '').includes(r))
  )
}
function yb(e) {
  let t = sr(e)
  for (; rn(t) && !No(t); ) {
    if (Kc(t)) return t
    if (Ll(t)) return null
    t = sr(t)
  }
  return null
}
function Yc() {
  return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none')
}
const vb = new Set(['html', 'body', '#document'])
function No(e) {
  return vb.has(Ao(e))
}
function Ht(e) {
  return ht(e).getComputedStyle(e)
}
function Il(e) {
  return Bt(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY }
}
function sr(e) {
  if (Ao(e) === 'html') return e
  const t = e.assignedSlot || e.parentNode || (Of(e) && e.host) || on(e)
  return Of(t) ? t.host : t
}
function xg(e) {
  const t = sr(e)
  return No(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : rn(t) && Us(t) ? t : xg(t)
}
function Es(e, t, n) {
  var r
  ;(t === void 0 && (t = []), n === void 0 && (n = !0))
  const o = xg(e),
    s = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
    i = ht(o)
  if (s) {
    const l = Du(i)
    return t.concat(i, i.visualViewport || [], Us(o) ? o : [], l && n ? Es(l) : [])
  }
  return t.concat(o, Es(o, [], n))
}
function Du(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null
}
function wg(e) {
  const t = Ht(e)
  let n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0
  const o = rn(e),
    s = o ? e.offsetWidth : n,
    i = o ? e.offsetHeight : r,
    l = ll(n) !== s || ll(r) !== i
  return (l && ((n = s), (r = i)), { width: n, height: r, $: l })
}
function Gc(e) {
  return Bt(e) ? e : e.contextElement
}
function uo(e) {
  const t = Gc(e)
  if (!rn(t)) return nn(1)
  const n = t.getBoundingClientRect(),
    { width: r, height: o, $: s } = wg(t)
  let i = (s ? ll(n.width) : n.width) / r,
    l = (s ? ll(n.height) : n.height) / o
  return (
    (!i || !Number.isFinite(i)) && (i = 1),
    (!l || !Number.isFinite(l)) && (l = 1),
    { x: i, y: l }
  )
}
const xb = nn(0)
function bg(e) {
  const t = ht(e)
  return !Yc() || !t.visualViewport
    ? xb
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop }
}
function wb(e, t, n) {
  return (t === void 0 && (t = !1), !n || (t && n !== ht(e)) ? !1 : t)
}
function _r(e, t, n, r) {
  ;(t === void 0 && (t = !1), n === void 0 && (n = !1))
  const o = e.getBoundingClientRect(),
    s = Gc(e)
  let i = nn(1)
  t && (r ? Bt(r) && (i = uo(r)) : (i = uo(e)))
  const l = wb(s, n, r) ? bg(s) : nn(0)
  let a = (o.left + l.x) / i.x,
    u = (o.top + l.y) / i.y,
    d = o.width / i.x,
    f = o.height / i.y
  if (s) {
    const g = ht(s),
      p = r && Bt(r) ? ht(r) : r
    let b = g,
      x = Du(b)
    for (; x && r && p !== b; ) {
      const w = uo(x),
        m = x.getBoundingClientRect(),
        h = Ht(x),
        v = m.left + (x.clientLeft + parseFloat(h.paddingLeft)) * w.x,
        k = m.top + (x.clientTop + parseFloat(h.paddingTop)) * w.y
      ;((a *= w.x),
        (u *= w.y),
        (d *= w.x),
        (f *= w.y),
        (a += v),
        (u += k),
        (b = ht(x)),
        (x = Du(b)))
    }
  }
  return ul({ width: d, height: f, x: a, y: u })
}
function qc(e, t) {
  const n = Il(e).scrollLeft
  return t ? t.left + n : _r(on(e)).left + n
}
function Sg(e, t, n) {
  n === void 0 && (n = !1)
  const r = e.getBoundingClientRect(),
    o = r.left + t.scrollLeft - (n ? 0 : qc(e, r)),
    s = r.top + t.scrollTop
  return { x: o, y: s }
}
function bb(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: o } = e
  const s = o === 'fixed',
    i = on(r),
    l = t ? Ll(t.floating) : !1
  if (r === i || (l && s)) return n
  let a = { scrollLeft: 0, scrollTop: 0 },
    u = nn(1)
  const d = nn(0),
    f = rn(r)
  if ((f || (!f && !s)) && ((Ao(r) !== 'body' || Us(i)) && (a = Il(r)), rn(r))) {
    const p = _r(r)
    ;((u = uo(r)), (d.x = p.x + r.clientLeft), (d.y = p.y + r.clientTop))
  }
  const g = i && !f && !s ? Sg(i, a, !0) : nn(0)
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - a.scrollLeft * u.x + d.x + g.x,
    y: n.y * u.y - a.scrollTop * u.y + d.y + g.y,
  }
}
function Sb(e) {
  return Array.from(e.getClientRects())
}
function kb(e) {
  const t = on(e),
    n = Il(e),
    r = e.ownerDocument.body,
    o = dt(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
    s = dt(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight)
  let i = -n.scrollLeft + qc(e)
  const l = -n.scrollTop
  return (
    Ht(r).direction === 'rtl' && (i += dt(t.clientWidth, r.clientWidth) - o),
    { width: o, height: s, x: i, y: l }
  )
}
function Cb(e, t) {
  const n = ht(e),
    r = on(e),
    o = n.visualViewport
  let s = r.clientWidth,
    i = r.clientHeight,
    l = 0,
    a = 0
  if (o) {
    ;((s = o.width), (i = o.height))
    const u = Yc()
    ;(!u || (u && t === 'fixed')) && ((l = o.offsetLeft), (a = o.offsetTop))
  }
  return { width: s, height: i, x: l, y: a }
}
const Eb = new Set(['absolute', 'fixed'])
function Nb(e, t) {
  const n = _r(e, !0, t === 'fixed'),
    r = n.top + e.clientTop,
    o = n.left + e.clientLeft,
    s = rn(e) ? uo(e) : nn(1),
    i = e.clientWidth * s.x,
    l = e.clientHeight * s.y,
    a = o * s.x,
    u = r * s.y
  return { width: i, height: l, x: a, y: u }
}
function Af(e, t, n) {
  let r
  if (t === 'viewport') r = Cb(e, n)
  else if (t === 'document') r = kb(on(e))
  else if (Bt(t)) r = Nb(t, n)
  else {
    const o = bg(e)
    r = { x: t.x - o.x, y: t.y - o.y, width: t.width, height: t.height }
  }
  return ul(r)
}
function kg(e, t) {
  const n = sr(e)
  return n === t || !Bt(n) || No(n) ? !1 : Ht(n).position === 'fixed' || kg(n, t)
}
function Pb(e, t) {
  const n = t.get(e)
  if (n) return n
  let r = Es(e, [], !1).filter(l => Bt(l) && Ao(l) !== 'body'),
    o = null
  const s = Ht(e).position === 'fixed'
  let i = s ? sr(e) : e
  for (; Bt(i) && !No(i); ) {
    const l = Ht(i),
      a = Kc(i)
    ;(!a && l.position === 'fixed' && (o = null),
      (
        s
          ? !a && !o
          : (!a && l.position === 'static' && !!o && Eb.has(o.position)) ||
            (Us(i) && !a && kg(e, i))
      )
        ? (r = r.filter(d => d !== i))
        : (o = l),
      (i = sr(i)))
  }
  return (t.set(e, r), r)
}
function jb(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: o } = e
  const i = [...(n === 'clippingAncestors' ? (Ll(t) ? [] : Pb(t, this._c)) : [].concat(n)), r],
    l = i[0],
    a = i.reduce(
      (u, d) => {
        const f = Af(t, d, o)
        return (
          (u.top = dt(f.top, u.top)),
          (u.right = or(f.right, u.right)),
          (u.bottom = or(f.bottom, u.bottom)),
          (u.left = dt(f.left, u.left)),
          u
        )
      },
      Af(t, l, o)
    )
  return { width: a.right - a.left, height: a.bottom - a.top, x: a.left, y: a.top }
}
function Tb(e) {
  const { width: t, height: n } = wg(e)
  return { width: t, height: n }
}
function Rb(e, t, n) {
  const r = rn(t),
    o = on(t),
    s = n === 'fixed',
    i = _r(e, !0, s, t)
  let l = { scrollLeft: 0, scrollTop: 0 }
  const a = nn(0)
  function u() {
    a.x = qc(o)
  }
  if (r || (!r && !s))
    if (((Ao(t) !== 'body' || Us(o)) && (l = Il(t)), r)) {
      const p = _r(t, !0, s, t)
      ;((a.x = p.x + t.clientLeft), (a.y = p.y + t.clientTop))
    } else o && u()
  s && !r && o && u()
  const d = o && !r && !s ? Sg(o, l) : nn(0),
    f = i.left + l.scrollLeft - a.x - d.x,
    g = i.top + l.scrollTop - a.y - d.y
  return { x: f, y: g, width: i.width, height: i.height }
}
function Na(e) {
  return Ht(e).position === 'static'
}
function Lf(e, t) {
  if (!rn(e) || Ht(e).position === 'fixed') return null
  if (t) return t(e)
  let n = e.offsetParent
  return (on(e) === n && (n = n.ownerDocument.body), n)
}
function Cg(e, t) {
  const n = ht(e)
  if (Ll(e)) return n
  if (!rn(e)) {
    let o = sr(e)
    for (; o && !No(o); ) {
      if (Bt(o) && !Na(o)) return o
      o = sr(o)
    }
    return n
  }
  let r = Lf(e, t)
  for (; r && fb(r) && Na(r); ) r = Lf(r, t)
  return r && No(r) && Na(r) && !Kc(r) ? n : r || yb(e) || n
}
const Mb = async function (e) {
  const t = this.getOffsetParent || Cg,
    n = this.getDimensions,
    r = await n(e.floating)
  return {
    reference: Rb(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: r.width, height: r.height },
  }
}
function _b(e) {
  return Ht(e).direction === 'rtl'
}
const Ob = {
  convertOffsetParentRelativeRectToViewportRelativeRect: bb,
  getDocumentElement: on,
  getClippingRect: jb,
  getOffsetParent: Cg,
  getElementRects: Mb,
  getClientRects: Sb,
  getDimensions: Tb,
  getScale: uo,
  isElement: Bt,
  isRTL: _b,
}
function Eg(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
}
function Ab(e, t) {
  let n = null,
    r
  const o = on(e)
  function s() {
    var l
    ;(clearTimeout(r), (l = n) == null || l.disconnect(), (n = null))
  }
  function i(l, a) {
    ;(l === void 0 && (l = !1), a === void 0 && (a = 1), s())
    const u = e.getBoundingClientRect(),
      { left: d, top: f, width: g, height: p } = u
    if ((l || t(), !g || !p)) return
    const b = vi(f),
      x = vi(o.clientWidth - (d + g)),
      w = vi(o.clientHeight - (f + p)),
      m = vi(d),
      v = {
        rootMargin: -b + 'px ' + -x + 'px ' + -w + 'px ' + -m + 'px',
        threshold: dt(0, or(1, a)) || 1,
      }
    let k = !0
    function N(j) {
      const P = j[0].intersectionRatio
      if (P !== a) {
        if (!k) return i()
        P
          ? i(!1, P)
          : (r = setTimeout(() => {
              i(!1, 1e-7)
            }, 1e3))
      }
      ;(P === 1 && !Eg(u, e.getBoundingClientRect()) && i(), (k = !1))
    }
    try {
      n = new IntersectionObserver(N, { ...v, root: o.ownerDocument })
    } catch {
      n = new IntersectionObserver(N, v)
    }
    n.observe(e)
  }
  return (i(!0), s)
}
function Lb(e, t, n, r) {
  r === void 0 && (r = {})
  const {
      ancestorScroll: o = !0,
      ancestorResize: s = !0,
      elementResize: i = typeof ResizeObserver == 'function',
      layoutShift: l = typeof IntersectionObserver == 'function',
      animationFrame: a = !1,
    } = r,
    u = Gc(e),
    d = o || s ? [...(u ? Es(u) : []), ...Es(t)] : []
  d.forEach(m => {
    ;(o && m.addEventListener('scroll', n, { passive: !0 }), s && m.addEventListener('resize', n))
  })
  const f = u && l ? Ab(u, n) : null
  let g = -1,
    p = null
  i &&
    ((p = new ResizeObserver(m => {
      let [h] = m
      ;(h &&
        h.target === u &&
        p &&
        (p.unobserve(t),
        cancelAnimationFrame(g),
        (g = requestAnimationFrame(() => {
          var v
          ;(v = p) == null || v.observe(t)
        }))),
        n())
    })),
    u && !a && p.observe(u),
    p.observe(t))
  let b,
    x = a ? _r(e) : null
  a && w()
  function w() {
    const m = _r(e)
    ;(x && !Eg(x, m) && n(), (x = m), (b = requestAnimationFrame(w)))
  }
  return (
    n(),
    () => {
      var m
      ;(d.forEach(h => {
        ;(o && h.removeEventListener('scroll', n), s && h.removeEventListener('resize', n))
      }),
        f == null || f(),
        (m = p) == null || m.disconnect(),
        (p = null),
        a && cancelAnimationFrame(b))
    }
  )
}
const Ib = ib,
  Db = lb,
  zb = rb,
  Fb = ub,
  $b = ob,
  If = nb,
  Ub = ab,
  Bb = (e, t, n) => {
    const r = new Map(),
      o = { platform: Ob, ...n },
      s = { ...o.platform, _c: r }
    return tb(e, t, { ...o, platform: s })
  }
var Hb = typeof document < 'u',
  Wb = function () {},
  Li = Hb ? y.useLayoutEffect : Wb
function cl(e, t) {
  if (e === t) return !0
  if (typeof e != typeof t) return !1
  if (typeof e == 'function' && e.toString() === t.toString()) return !0
  let n, r, o
  if (e && t && typeof e == 'object') {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1
      for (r = n; r-- !== 0; ) if (!cl(e[r], t[r])) return !1
      return !0
    }
    if (((o = Object.keys(e)), (n = o.length), n !== Object.keys(t).length)) return !1
    for (r = n; r-- !== 0; ) if (!{}.hasOwnProperty.call(t, o[r])) return !1
    for (r = n; r-- !== 0; ) {
      const s = o[r]
      if (!(s === '_owner' && e.$$typeof) && !cl(e[s], t[s])) return !1
    }
    return !0
  }
  return e !== e && t !== t
}
function Ng(e) {
  return typeof window > 'u' ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1
}
function Df(e, t) {
  const n = Ng(e)
  return Math.round(t * n) / n
}
function Pa(e) {
  const t = y.useRef(e)
  return (
    Li(() => {
      t.current = e
    }),
    t
  )
}
function Vb(e) {
  e === void 0 && (e = {})
  const {
      placement: t = 'bottom',
      strategy: n = 'absolute',
      middleware: r = [],
      platform: o,
      elements: { reference: s, floating: i } = {},
      transform: l = !0,
      whileElementsMounted: a,
      open: u,
    } = e,
    [d, f] = y.useState({
      x: 0,
      y: 0,
      strategy: n,
      placement: t,
      middlewareData: {},
      isPositioned: !1,
    }),
    [g, p] = y.useState(r)
  cl(g, r) || p(r)
  const [b, x] = y.useState(null),
    [w, m] = y.useState(null),
    h = y.useCallback(R => {
      R !== j.current && ((j.current = R), x(R))
    }, []),
    v = y.useCallback(R => {
      R !== P.current && ((P.current = R), m(R))
    }, []),
    k = s || b,
    N = i || w,
    j = y.useRef(null),
    P = y.useRef(null),
    T = y.useRef(d),
    I = a != null,
    D = Pa(a),
    Q = Pa(o),
    U = Pa(u),
    G = y.useCallback(() => {
      if (!j.current || !P.current) return
      const R = { placement: t, strategy: n, middleware: g }
      ;(Q.current && (R.platform = Q.current),
        Bb(j.current, P.current, R).then(C => {
          const _ = { ...C, isPositioned: U.current !== !1 }
          $.current &&
            !cl(T.current, _) &&
            ((T.current = _),
            Fs.flushSync(() => {
              f(_)
            }))
        }))
    }, [g, t, n, Q, U])
  Li(() => {
    u === !1 &&
      T.current.isPositioned &&
      ((T.current.isPositioned = !1), f(R => ({ ...R, isPositioned: !1 })))
  }, [u])
  const $ = y.useRef(!1)
  ;(Li(
    () => (
      ($.current = !0),
      () => {
        $.current = !1
      }
    ),
    []
  ),
    Li(() => {
      if ((k && (j.current = k), N && (P.current = N), k && N)) {
        if (D.current) return D.current(k, N, G)
        G()
      }
    }, [k, N, G, D, I]))
  const re = y.useMemo(
      () => ({ reference: j, floating: P, setReference: h, setFloating: v }),
      [h, v]
    ),
    K = y.useMemo(() => ({ reference: k, floating: N }), [k, N]),
    W = y.useMemo(() => {
      const R = { position: n, left: 0, top: 0 }
      if (!K.floating) return R
      const C = Df(K.floating, d.x),
        _ = Df(K.floating, d.y)
      return l
        ? {
            ...R,
            transform: 'translate(' + C + 'px, ' + _ + 'px)',
            ...(Ng(K.floating) >= 1.5 && { willChange: 'transform' }),
          }
        : { position: n, left: C, top: _ }
    }, [n, l, K.floating, d.x, d.y])
  return y.useMemo(
    () => ({ ...d, update: G, refs: re, elements: K, floatingStyles: W }),
    [d, G, re, K, W]
  )
}
const Qb = e => {
    function t(n) {
      return {}.hasOwnProperty.call(n, 'current')
    }
    return {
      name: 'arrow',
      options: e,
      fn(n) {
        const { element: r, padding: o } = typeof e == 'function' ? e(n) : e
        return r && t(r)
          ? r.current != null
            ? If({ element: r.current, padding: o }).fn(n)
            : {}
          : r
            ? If({ element: r, padding: o }).fn(n)
            : {}
      },
    }
  },
  Kb = (e, t) => ({ ...Ib(e), options: [e, t] }),
  Yb = (e, t) => ({ ...Db(e), options: [e, t] }),
  Gb = (e, t) => ({ ...Ub(e), options: [e, t] }),
  qb = (e, t) => ({ ...zb(e), options: [e, t] }),
  Xb = (e, t) => ({ ...Fb(e), options: [e, t] }),
  Zb = (e, t) => ({ ...$b(e), options: [e, t] }),
  Jb = (e, t) => ({ ...Qb(e), options: [e, t] })
var e2 = 'Arrow',
  Pg = y.forwardRef((e, t) => {
    const { children: n, width: r = 10, height: o = 5, ...s } = e
    return c.jsx(lt.svg, {
      ...s,
      ref: t,
      width: r,
      height: o,
      viewBox: '0 0 30 10',
      preserveAspectRatio: 'none',
      children: e.asChild ? n : c.jsx('polygon', { points: '0,0 30,0 15,10' }),
    })
  })
Pg.displayName = e2
var t2 = Pg
function n2(e) {
  const [t, n] = y.useState(void 0)
  return (
    rr(() => {
      if (e) {
        n({ width: e.offsetWidth, height: e.offsetHeight })
        const r = new ResizeObserver(o => {
          if (!Array.isArray(o) || !o.length) return
          const s = o[0]
          let i, l
          if ('borderBoxSize' in s) {
            const a = s.borderBoxSize,
              u = Array.isArray(a) ? a[0] : a
            ;((i = u.inlineSize), (l = u.blockSize))
          } else ((i = e.offsetWidth), (l = e.offsetHeight))
          n({ width: i, height: l })
        })
        return (r.observe(e, { box: 'border-box' }), () => r.unobserve(e))
      } else n(void 0)
    }, [e]),
    t
  )
}
var jg = 'Popper',
  [Tg, Rg] = Ml(jg),
  [Kk, Mg] = Tg(jg),
  _g = 'PopperAnchor',
  Og = y.forwardRef((e, t) => {
    const { __scopePopper: n, virtualRef: r, ...o } = e,
      s = Mg(_g, n),
      i = y.useRef(null),
      l = Ut(t, i)
    return (
      y.useEffect(() => {
        s.onAnchorChange((r == null ? void 0 : r.current) || i.current)
      }),
      r ? null : c.jsx(lt.div, { ...o, ref: l })
    )
  })
Og.displayName = _g
var Xc = 'PopperContent',
  [r2, o2] = Tg(Xc),
  Ag = y.forwardRef((e, t) => {
    var J, De, Et, je, Ne, ln
    const {
        __scopePopper: n,
        side: r = 'bottom',
        sideOffset: o = 0,
        align: s = 'center',
        alignOffset: i = 0,
        arrowPadding: l = 0,
        avoidCollisions: a = !0,
        collisionBoundary: u = [],
        collisionPadding: d = 0,
        sticky: f = 'partial',
        hideWhenDetached: g = !1,
        updatePositionStrategy: p = 'optimized',
        onPlaced: b,
        ...x
      } = e,
      w = Mg(Xc, n),
      [m, h] = y.useState(null),
      v = Ut(t, Nt => h(Nt)),
      [k, N] = y.useState(null),
      j = n2(k),
      P = (j == null ? void 0 : j.width) ?? 0,
      T = (j == null ? void 0 : j.height) ?? 0,
      I = r + (s !== 'center' ? '-' + s : ''),
      D = typeof d == 'number' ? d : { top: 0, right: 0, bottom: 0, left: 0, ...d },
      Q = Array.isArray(u) ? u : [u],
      U = Q.length > 0,
      G = { padding: D, boundary: Q.filter(i2), altBoundary: U },
      {
        refs: $,
        floatingStyles: re,
        placement: K,
        isPositioned: W,
        middlewareData: R,
      } = Vb({
        strategy: 'fixed',
        placement: I,
        whileElementsMounted: (...Nt) => Lb(...Nt, { animationFrame: p === 'always' }),
        elements: { reference: w.anchor },
        middleware: [
          Kb({ mainAxis: o + T, alignmentAxis: i }),
          a && Yb({ mainAxis: !0, crossAxis: !1, limiter: f === 'partial' ? Gb() : void 0, ...G }),
          a && qb({ ...G }),
          Xb({
            ...G,
            apply: ({ elements: Nt, rects: ur, availableWidth: Fr, availableHeight: Wt }) => {
              const { width: cr, height: dr } = ur.reference,
                se = Nt.floating.style
              ;(se.setProperty('--radix-popper-available-width', `${Fr}px`),
                se.setProperty('--radix-popper-available-height', `${Wt}px`),
                se.setProperty('--radix-popper-anchor-width', `${cr}px`),
                se.setProperty('--radix-popper-anchor-height', `${dr}px`))
            },
          }),
          k && Jb({ element: k, padding: l }),
          l2({ arrowWidth: P, arrowHeight: T }),
          g && Zb({ strategy: 'referenceHidden', ...G }),
        ],
      }),
      [C, _] = Dg(K),
      B = nr(b)
    rr(() => {
      W && (B == null || B())
    }, [W, B])
    const H = (J = R.arrow) == null ? void 0 : J.x,
      Z = (De = R.arrow) == null ? void 0 : De.y,
      te = ((Et = R.arrow) == null ? void 0 : Et.centerOffset) !== 0,
      [fe, ue] = y.useState()
    return (
      rr(() => {
        m && ue(window.getComputedStyle(m).zIndex)
      }, [m]),
      c.jsx('div', {
        ref: $.setFloating,
        'data-radix-popper-content-wrapper': '',
        style: {
          ...re,
          transform: W ? re.transform : 'translate(0, -200%)',
          minWidth: 'max-content',
          zIndex: fe,
          '--radix-popper-transform-origin': [
            (je = R.transformOrigin) == null ? void 0 : je.x,
            (Ne = R.transformOrigin) == null ? void 0 : Ne.y,
          ].join(' '),
          ...(((ln = R.hide) == null ? void 0 : ln.referenceHidden) && {
            visibility: 'hidden',
            pointerEvents: 'none',
          }),
        },
        dir: e.dir,
        children: c.jsx(r2, {
          scope: n,
          placedSide: C,
          onArrowChange: N,
          arrowX: H,
          arrowY: Z,
          shouldHideArrow: te,
          children: c.jsx(lt.div, {
            'data-side': C,
            'data-align': _,
            ...x,
            ref: v,
            style: { ...x.style, animation: W ? void 0 : 'none' },
          }),
        }),
      })
    )
  })
Ag.displayName = Xc
var Lg = 'PopperArrow',
  s2 = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
  Ig = y.forwardRef(function (t, n) {
    const { __scopePopper: r, ...o } = t,
      s = o2(Lg, r),
      i = s2[s.placedSide]
    return c.jsx('span', {
      ref: s.onArrowChange,
      style: {
        position: 'absolute',
        left: s.arrowX,
        top: s.arrowY,
        [i]: 0,
        transformOrigin: { top: '', right: '0 0', bottom: 'center 0', left: '100% 0' }[
          s.placedSide
        ],
        transform: {
          top: 'translateY(100%)',
          right: 'translateY(50%) rotate(90deg) translateX(-50%)',
          bottom: 'rotate(180deg)',
          left: 'translateY(50%) rotate(-90deg) translateX(50%)',
        }[s.placedSide],
        visibility: s.shouldHideArrow ? 'hidden' : void 0,
      },
      children: c.jsx(t2, { ...o, ref: n, style: { ...o.style, display: 'block' } }),
    })
  })
Ig.displayName = Lg
function i2(e) {
  return e !== null
}
var l2 = e => ({
  name: 'transformOrigin',
  options: e,
  fn(t) {
    var w, m, h
    const { placement: n, rects: r, middlewareData: o } = t,
      i = ((w = o.arrow) == null ? void 0 : w.centerOffset) !== 0,
      l = i ? 0 : e.arrowWidth,
      a = i ? 0 : e.arrowHeight,
      [u, d] = Dg(n),
      f = { start: '0%', center: '50%', end: '100%' }[d],
      g = (((m = o.arrow) == null ? void 0 : m.x) ?? 0) + l / 2,
      p = (((h = o.arrow) == null ? void 0 : h.y) ?? 0) + a / 2
    let b = '',
      x = ''
    return (
      u === 'bottom'
        ? ((b = i ? f : `${g}px`), (x = `${-a}px`))
        : u === 'top'
          ? ((b = i ? f : `${g}px`), (x = `${r.floating.height + a}px`))
          : u === 'right'
            ? ((b = `${-a}px`), (x = i ? f : `${p}px`))
            : u === 'left' && ((b = `${r.floating.width + a}px`), (x = i ? f : `${p}px`)),
      { data: { x: b, y: x } }
    )
  },
})
function Dg(e) {
  const [t, n = 'center'] = e.split('-')
  return [t, n]
}
var a2 = Og,
  u2 = Ag,
  c2 = Ig,
  [Dl, Yk] = Ml('Tooltip', [Rg]),
  Zc = Rg(),
  zg = 'TooltipProvider',
  d2 = 700,
  zf = 'tooltip.open',
  [f2, Fg] = Dl(zg),
  $g = e => {
    const {
        __scopeTooltip: t,
        delayDuration: n = d2,
        skipDelayDuration: r = 300,
        disableHoverableContent: o = !1,
        children: s,
      } = e,
      i = y.useRef(!0),
      l = y.useRef(!1),
      a = y.useRef(0)
    return (
      y.useEffect(() => {
        const u = a.current
        return () => window.clearTimeout(u)
      }, []),
      c.jsx(f2, {
        scope: t,
        isOpenDelayedRef: i,
        delayDuration: n,
        onOpen: y.useCallback(() => {
          ;(window.clearTimeout(a.current), (i.current = !1))
        }, []),
        onClose: y.useCallback(() => {
          ;(window.clearTimeout(a.current),
            (a.current = window.setTimeout(() => (i.current = !0), r)))
        }, [r]),
        isPointerInTransitRef: l,
        onPointerInTransitChange: y.useCallback(u => {
          l.current = u
        }, []),
        disableHoverableContent: o,
        children: s,
      })
    )
  }
$g.displayName = zg
var Ug = 'Tooltip',
  [Gk, zl] = Dl(Ug),
  zu = 'TooltipTrigger',
  p2 = y.forwardRef((e, t) => {
    const { __scopeTooltip: n, ...r } = e,
      o = zl(zu, n),
      s = Fg(zu, n),
      i = Zc(n),
      l = y.useRef(null),
      a = Ut(t, l, o.onTriggerChange),
      u = y.useRef(!1),
      d = y.useRef(!1),
      f = y.useCallback(() => (u.current = !1), [])
    return (
      y.useEffect(() => () => document.removeEventListener('pointerup', f), [f]),
      c.jsx(a2, {
        asChild: !0,
        ...i,
        children: c.jsx(lt.button, {
          'aria-describedby': o.open ? o.contentId : void 0,
          'data-state': o.stateAttribute,
          ...r,
          ref: a,
          onPointerMove: Oe(e.onPointerMove, g => {
            g.pointerType !== 'touch' &&
              !d.current &&
              !s.isPointerInTransitRef.current &&
              (o.onTriggerEnter(), (d.current = !0))
          }),
          onPointerLeave: Oe(e.onPointerLeave, () => {
            ;(o.onTriggerLeave(), (d.current = !1))
          }),
          onPointerDown: Oe(e.onPointerDown, () => {
            ;(o.open && o.onClose(),
              (u.current = !0),
              document.addEventListener('pointerup', f, { once: !0 }))
          }),
          onFocus: Oe(e.onFocus, () => {
            u.current || o.onOpen()
          }),
          onBlur: Oe(e.onBlur, o.onClose),
          onClick: Oe(e.onClick, o.onClose),
        }),
      })
    )
  })
p2.displayName = zu
var h2 = 'TooltipPortal',
  [qk, m2] = Dl(h2, { forceMount: void 0 }),
  Po = 'TooltipContent',
  Bg = y.forwardRef((e, t) => {
    const n = m2(Po, e.__scopeTooltip),
      { forceMount: r = n.forceMount, side: o = 'top', ...s } = e,
      i = zl(Po, e.__scopeTooltip)
    return c.jsx(zc, {
      present: r || i.open,
      children: i.disableHoverableContent
        ? c.jsx(Hg, { side: o, ...s, ref: t })
        : c.jsx(g2, { side: o, ...s, ref: t }),
    })
  }),
  g2 = y.forwardRef((e, t) => {
    const n = zl(Po, e.__scopeTooltip),
      r = Fg(Po, e.__scopeTooltip),
      o = y.useRef(null),
      s = Ut(t, o),
      [i, l] = y.useState(null),
      { trigger: a, onClose: u } = n,
      d = o.current,
      { onPointerInTransitChange: f } = r,
      g = y.useCallback(() => {
        ;(l(null), f(!1))
      }, [f]),
      p = y.useCallback(
        (b, x) => {
          const w = b.currentTarget,
            m = { x: b.clientX, y: b.clientY },
            h = b2(m, w.getBoundingClientRect()),
            v = S2(m, h),
            k = k2(x.getBoundingClientRect()),
            N = E2([...v, ...k])
          ;(l(N), f(!0))
        },
        [f]
      )
    return (
      y.useEffect(() => () => g(), [g]),
      y.useEffect(() => {
        if (a && d) {
          const b = w => p(w, d),
            x = w => p(w, a)
          return (
            a.addEventListener('pointerleave', b),
            d.addEventListener('pointerleave', x),
            () => {
              ;(a.removeEventListener('pointerleave', b), d.removeEventListener('pointerleave', x))
            }
          )
        }
      }, [a, d, p, g]),
      y.useEffect(() => {
        if (i) {
          const b = x => {
            const w = x.target,
              m = { x: x.clientX, y: x.clientY },
              h = (a == null ? void 0 : a.contains(w)) || (d == null ? void 0 : d.contains(w)),
              v = !C2(m, i)
            h ? g() : v && (g(), u())
          }
          return (
            document.addEventListener('pointermove', b),
            () => document.removeEventListener('pointermove', b)
          )
        }
      }, [a, d, i, u, g]),
      c.jsx(Hg, { ...e, ref: s })
    )
  }),
  [y2, v2] = Dl(Ug, { isInside: !1 }),
  x2 = rx('TooltipContent'),
  Hg = y.forwardRef((e, t) => {
    const {
        __scopeTooltip: n,
        children: r,
        'aria-label': o,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        ...l
      } = e,
      a = zl(Po, n),
      u = Zc(n),
      { onClose: d } = a
    return (
      y.useEffect(
        () => (document.addEventListener(zf, d), () => document.removeEventListener(zf, d)),
        [d]
      ),
      y.useEffect(() => {
        if (a.trigger) {
          const f = g => {
            const p = g.target
            p != null && p.contains(a.trigger) && d()
          }
          return (
            window.addEventListener('scroll', f, { capture: !0 }),
            () => window.removeEventListener('scroll', f, { capture: !0 })
          )
        }
      }, [a.trigger, d]),
      c.jsx(Dc, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        onFocusOutside: f => f.preventDefault(),
        onDismiss: d,
        children: c.jsxs(u2, {
          'data-state': a.stateAttribute,
          ...u,
          ...l,
          ref: t,
          style: {
            ...l.style,
            '--radix-tooltip-content-transform-origin': 'var(--radix-popper-transform-origin)',
            '--radix-tooltip-content-available-width': 'var(--radix-popper-available-width)',
            '--radix-tooltip-content-available-height': 'var(--radix-popper-available-height)',
            '--radix-tooltip-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-tooltip-trigger-height': 'var(--radix-popper-anchor-height)',
          },
          children: [
            c.jsx(x2, { children: r }),
            c.jsx(y2, {
              scope: n,
              isInside: !0,
              children: c.jsx(jx, { id: a.contentId, role: 'tooltip', children: o || r }),
            }),
          ],
        }),
      })
    )
  })
Bg.displayName = Po
var Wg = 'TooltipArrow',
  w2 = y.forwardRef((e, t) => {
    const { __scopeTooltip: n, ...r } = e,
      o = Zc(n)
    return v2(Wg, n).isInside ? null : c.jsx(c2, { ...o, ...r, ref: t })
  })
w2.displayName = Wg
function b2(e, t) {
  const n = Math.abs(t.top - e.y),
    r = Math.abs(t.bottom - e.y),
    o = Math.abs(t.right - e.x),
    s = Math.abs(t.left - e.x)
  switch (Math.min(n, r, o, s)) {
    case s:
      return 'left'
    case o:
      return 'right'
    case n:
      return 'top'
    case r:
      return 'bottom'
    default:
      throw new Error('unreachable')
  }
}
function S2(e, t, n = 5) {
  const r = []
  switch (t) {
    case 'top':
      r.push({ x: e.x - n, y: e.y + n }, { x: e.x + n, y: e.y + n })
      break
    case 'bottom':
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x + n, y: e.y - n })
      break
    case 'left':
      r.push({ x: e.x + n, y: e.y - n }, { x: e.x + n, y: e.y + n })
      break
    case 'right':
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x - n, y: e.y + n })
      break
  }
  return r
}
function k2(e) {
  const { top: t, right: n, bottom: r, left: o } = e
  return [
    { x: o, y: t },
    { x: n, y: t },
    { x: n, y: r },
    { x: o, y: r },
  ]
}
function C2(e, t) {
  const { x: n, y: r } = e
  let o = !1
  for (let s = 0, i = t.length - 1; s < t.length; i = s++) {
    const l = t[s],
      a = t[i],
      u = l.x,
      d = l.y,
      f = a.x,
      g = a.y
    d > r != g > r && n < ((f - u) * (r - d)) / (g - d) + u && (o = !o)
  }
  return o
}
function E2(e) {
  const t = e.slice()
  return (
    t.sort((n, r) => (n.x < r.x ? -1 : n.x > r.x ? 1 : n.y < r.y ? -1 : n.y > r.y ? 1 : 0)),
    N2(t)
  )
}
function N2(e) {
  if (e.length <= 1) return e.slice()
  const t = []
  for (let r = 0; r < e.length; r++) {
    const o = e[r]
    for (; t.length >= 2; ) {
      const s = t[t.length - 1],
        i = t[t.length - 2]
      if ((s.x - i.x) * (o.y - i.y) >= (s.y - i.y) * (o.x - i.x)) t.pop()
      else break
    }
    t.push(o)
  }
  t.pop()
  const n = []
  for (let r = e.length - 1; r >= 0; r--) {
    const o = e[r]
    for (; n.length >= 2; ) {
      const s = n[n.length - 1],
        i = n[n.length - 2]
      if ((s.x - i.x) * (o.y - i.y) >= (s.y - i.y) * (o.x - i.x)) n.pop()
      else break
    }
    n.push(o)
  }
  return (
    n.pop(),
    t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n)
  )
}
var P2 = $g,
  Vg = Bg
const j2 = P2,
  T2 = y.forwardRef(({ className: e, sideOffset: t = 4, ...n }, r) =>
    c.jsx(Vg, {
      ref: r,
      sideOffset: t,
      className: Lr(
        'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        e
      ),
      ...n,
    })
  )
T2.displayName = Vg.displayName
var Fl = class {
    constructor() {
      ;((this.listeners = new Set()), (this.subscribe = this.subscribe.bind(this)))
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        this.onSubscribe(),
        () => {
          ;(this.listeners.delete(e), this.onUnsubscribe())
        }
      )
    }
    hasListeners() {
      return this.listeners.size > 0
    }
    onSubscribe() {}
    onUnsubscribe() {}
  },
  $l = typeof window > 'u' || 'Deno' in globalThis
function _t() {}
function R2(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function M2(e) {
  return typeof e == 'number' && e >= 0 && e !== 1 / 0
}
function _2(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0)
}
function Fu(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function O2(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function Ff(e, t) {
  const { type: n = 'all', exact: r, fetchStatus: o, predicate: s, queryKey: i, stale: l } = e
  if (i) {
    if (r) {
      if (t.queryHash !== Jc(i, t.options)) return !1
    } else if (!Ps(t.queryKey, i)) return !1
  }
  if (n !== 'all') {
    const a = t.isActive()
    if ((n === 'active' && !a) || (n === 'inactive' && a)) return !1
  }
  return !(
    (typeof l == 'boolean' && t.isStale() !== l) ||
    (o && o !== t.state.fetchStatus) ||
    (s && !s(t))
  )
}
function $f(e, t) {
  const { exact: n, status: r, predicate: o, mutationKey: s } = e
  if (s) {
    if (!t.options.mutationKey) return !1
    if (n) {
      if (Ns(t.options.mutationKey) !== Ns(s)) return !1
    } else if (!Ps(t.options.mutationKey, s)) return !1
  }
  return !((r && t.state.status !== r) || (o && !o(t)))
}
function Jc(e, t) {
  return ((t == null ? void 0 : t.queryKeyHashFn) || Ns)(e)
}
function Ns(e) {
  return JSON.stringify(e, (t, n) =>
    $u(n)
      ? Object.keys(n)
          .sort()
          .reduce((r, o) => ((r[o] = n[o]), r), {})
      : n
  )
}
function Ps(e, t) {
  return e === t
    ? !0
    : typeof e != typeof t
      ? !1
      : e && t && typeof e == 'object' && typeof t == 'object'
        ? Object.keys(t).every(n => Ps(e[n], t[n]))
        : !1
}
function Qg(e, t) {
  if (e === t) return e
  const n = Uf(e) && Uf(t)
  if (n || ($u(e) && $u(t))) {
    const r = n ? e : Object.keys(e),
      o = r.length,
      s = n ? t : Object.keys(t),
      i = s.length,
      l = n ? [] : {},
      a = new Set(r)
    let u = 0
    for (let d = 0; d < i; d++) {
      const f = n ? d : s[d]
      ;((!n && a.has(f)) || n) && e[f] === void 0 && t[f] === void 0
        ? ((l[f] = void 0), u++)
        : ((l[f] = Qg(e[f], t[f])), l[f] === e[f] && e[f] !== void 0 && u++)
    }
    return o === i && u === o ? e : l
  }
  return t
}
function Uf(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length
}
function $u(e) {
  if (!Bf(e)) return !1
  const t = e.constructor
  if (t === void 0) return !0
  const n = t.prototype
  return !(
    !Bf(n) ||
    !n.hasOwnProperty('isPrototypeOf') ||
    Object.getPrototypeOf(e) !== Object.prototype
  )
}
function Bf(e) {
  return Object.prototype.toString.call(e) === '[object Object]'
}
function A2(e) {
  return new Promise(t => {
    setTimeout(t, e)
  })
}
function L2(e, t, n) {
  return typeof n.structuralSharing == 'function'
    ? n.structuralSharing(e, t)
    : n.structuralSharing !== !1
      ? Qg(e, t)
      : t
}
function I2(e, t, n = 0) {
  const r = [...e, t]
  return n && r.length > n ? r.slice(1) : r
}
function D2(e, t, n = 0) {
  const r = [t, ...e]
  return n && r.length > n ? r.slice(0, -1) : r
}
var ed = Symbol()
function Kg(e, t) {
  return !e.queryFn && t != null && t.initialPromise
    ? () => t.initialPromise
    : !e.queryFn || e.queryFn === ed
      ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`))
      : e.queryFn
}
var xr,
  Dn,
  co,
  lp,
  z2 =
    ((lp = class extends Fl {
      constructor() {
        super()
        ae(this, xr)
        ae(this, Dn)
        ae(this, co)
        ee(this, co, t => {
          if (!$l && window.addEventListener) {
            const n = () => t()
            return (
              window.addEventListener('visibilitychange', n, !1),
              () => {
                window.removeEventListener('visibilitychange', n)
              }
            )
          }
        })
      }
      onSubscribe() {
        O(this, Dn) || this.setEventListener(O(this, co))
      }
      onUnsubscribe() {
        var t
        this.hasListeners() || ((t = O(this, Dn)) == null || t.call(this), ee(this, Dn, void 0))
      }
      setEventListener(t) {
        var n
        ;(ee(this, co, t),
          (n = O(this, Dn)) == null || n.call(this),
          ee(
            this,
            Dn,
            t(r => {
              typeof r == 'boolean' ? this.setFocused(r) : this.onFocus()
            })
          ))
      }
      setFocused(t) {
        O(this, xr) !== t && (ee(this, xr, t), this.onFocus())
      }
      onFocus() {
        const t = this.isFocused()
        this.listeners.forEach(n => {
          n(t)
        })
      }
      isFocused() {
        var t
        return typeof O(this, xr) == 'boolean'
          ? O(this, xr)
          : ((t = globalThis.document) == null ? void 0 : t.visibilityState) !== 'hidden'
      }
    }),
    (xr = new WeakMap()),
    (Dn = new WeakMap()),
    (co = new WeakMap()),
    lp),
  Yg = new z2(),
  fo,
  zn,
  po,
  ap,
  F2 =
    ((ap = class extends Fl {
      constructor() {
        super()
        ae(this, fo, !0)
        ae(this, zn)
        ae(this, po)
        ee(this, po, t => {
          if (!$l && window.addEventListener) {
            const n = () => t(!0),
              r = () => t(!1)
            return (
              window.addEventListener('online', n, !1),
              window.addEventListener('offline', r, !1),
              () => {
                ;(window.removeEventListener('online', n), window.removeEventListener('offline', r))
              }
            )
          }
        })
      }
      onSubscribe() {
        O(this, zn) || this.setEventListener(O(this, po))
      }
      onUnsubscribe() {
        var t
        this.hasListeners() || ((t = O(this, zn)) == null || t.call(this), ee(this, zn, void 0))
      }
      setEventListener(t) {
        var n
        ;(ee(this, po, t),
          (n = O(this, zn)) == null || n.call(this),
          ee(this, zn, t(this.setOnline.bind(this))))
      }
      setOnline(t) {
        O(this, fo) !== t &&
          (ee(this, fo, t),
          this.listeners.forEach(r => {
            r(t)
          }))
      }
      isOnline() {
        return O(this, fo)
      }
    }),
    (fo = new WeakMap()),
    (zn = new WeakMap()),
    (po = new WeakMap()),
    ap),
  dl = new F2()
function $2() {
  let e, t
  const n = new Promise((o, s) => {
    ;((e = o), (t = s))
  })
  ;((n.status = 'pending'), n.catch(() => {}))
  function r(o) {
    ;(Object.assign(n, o), delete n.resolve, delete n.reject)
  }
  return (
    (n.resolve = o => {
      ;(r({ status: 'fulfilled', value: o }), e(o))
    }),
    (n.reject = o => {
      ;(r({ status: 'rejected', reason: o }), t(o))
    }),
    n
  )
}
function U2(e) {
  return Math.min(1e3 * 2 ** e, 3e4)
}
function Gg(e) {
  return (e ?? 'online') === 'online' ? dl.isOnline() : !0
}
var qg = class extends Error {
  constructor(e) {
    ;(super('CancelledError'),
      (this.revert = e == null ? void 0 : e.revert),
      (this.silent = e == null ? void 0 : e.silent))
  }
}
function ja(e) {
  return e instanceof qg
}
function Xg(e) {
  let t = !1,
    n = 0,
    r = !1,
    o
  const s = $2(),
    i = x => {
      var w
      r || (g(new qg(x)), (w = e.abort) == null || w.call(e))
    },
    l = () => {
      t = !0
    },
    a = () => {
      t = !1
    },
    u = () => Yg.isFocused() && (e.networkMode === 'always' || dl.isOnline()) && e.canRun(),
    d = () => Gg(e.networkMode) && e.canRun(),
    f = x => {
      var w
      r || ((r = !0), (w = e.onSuccess) == null || w.call(e, x), o == null || o(), s.resolve(x))
    },
    g = x => {
      var w
      r || ((r = !0), (w = e.onError) == null || w.call(e, x), o == null || o(), s.reject(x))
    },
    p = () =>
      new Promise(x => {
        var w
        ;((o = m => {
          ;(r || u()) && x(m)
        }),
          (w = e.onPause) == null || w.call(e))
      }).then(() => {
        var x
        ;((o = void 0), r || (x = e.onContinue) == null || x.call(e))
      }),
    b = () => {
      if (r) return
      let x
      const w = n === 0 ? e.initialPromise : void 0
      try {
        x = w ?? e.fn()
      } catch (m) {
        x = Promise.reject(m)
      }
      Promise.resolve(x)
        .then(f)
        .catch(m => {
          var j
          if (r) return
          const h = e.retry ?? ($l ? 0 : 3),
            v = e.retryDelay ?? U2,
            k = typeof v == 'function' ? v(n, m) : v,
            N = h === !0 || (typeof h == 'number' && n < h) || (typeof h == 'function' && h(n, m))
          if (t || !N) {
            g(m)
            return
          }
          ;(n++,
            (j = e.onFail) == null || j.call(e, n, m),
            A2(k)
              .then(() => (u() ? void 0 : p()))
              .then(() => {
                t ? g(m) : b()
              }))
        })
    }
  return {
    promise: s,
    cancel: i,
    continue: () => (o == null || o(), s),
    cancelRetry: l,
    continueRetry: a,
    canStart: d,
    start: () => (d() ? b() : p().then(b), s),
  }
}
var B2 = e => setTimeout(e, 0)
function H2() {
  let e = [],
    t = 0,
    n = l => {
      l()
    },
    r = l => {
      l()
    },
    o = B2
  const s = l => {
      t
        ? e.push(l)
        : o(() => {
            n(l)
          })
    },
    i = () => {
      const l = e
      ;((e = []),
        l.length &&
          o(() => {
            r(() => {
              l.forEach(a => {
                n(a)
              })
            })
          }))
    }
  return {
    batch: l => {
      let a
      t++
      try {
        a = l()
      } finally {
        ;(t--, t || i())
      }
      return a
    },
    batchCalls:
      l =>
      (...a) => {
        s(() => {
          l(...a)
        })
      },
    schedule: s,
    setNotifyFunction: l => {
      n = l
    },
    setBatchNotifyFunction: l => {
      r = l
    },
    setScheduler: l => {
      o = l
    },
  }
}
var Ge = H2(),
  wr,
  up,
  Zg =
    ((up = class {
      constructor() {
        ae(this, wr)
      }
      destroy() {
        this.clearGcTimeout()
      }
      scheduleGc() {
        ;(this.clearGcTimeout(),
          M2(this.gcTime) &&
            ee(
              this,
              wr,
              setTimeout(() => {
                this.optionalRemove()
              }, this.gcTime)
            ))
      }
      updateGcTime(e) {
        this.gcTime = Math.max(this.gcTime || 0, e ?? ($l ? 1 / 0 : 5 * 60 * 1e3))
      }
      clearGcTimeout() {
        O(this, wr) && (clearTimeout(O(this, wr)), ee(this, wr, void 0))
      }
    }),
    (wr = new WeakMap()),
    up),
  ho,
  br,
  vt,
  Sr,
  We,
  _s,
  kr,
  Ot,
  cn,
  cp,
  W2 =
    ((cp = class extends Zg {
      constructor(t) {
        super()
        ae(this, Ot)
        ae(this, ho)
        ae(this, br)
        ae(this, vt)
        ae(this, Sr)
        ae(this, We)
        ae(this, _s)
        ae(this, kr)
        ;(ee(this, kr, !1),
          ee(this, _s, t.defaultOptions),
          this.setOptions(t.options),
          (this.observers = []),
          ee(this, Sr, t.client),
          ee(this, vt, O(this, Sr).getQueryCache()),
          (this.queryKey = t.queryKey),
          (this.queryHash = t.queryHash),
          ee(this, ho, Q2(this.options)),
          (this.state = t.state ?? O(this, ho)),
          this.scheduleGc())
      }
      get meta() {
        return this.options.meta
      }
      get promise() {
        var t
        return (t = O(this, We)) == null ? void 0 : t.promise
      }
      setOptions(t) {
        ;((this.options = { ...O(this, _s), ...t }), this.updateGcTime(this.options.gcTime))
      }
      optionalRemove() {
        !this.observers.length && this.state.fetchStatus === 'idle' && O(this, vt).remove(this)
      }
      setData(t, n) {
        const r = L2(this.state.data, t, this.options)
        return (
          Ue(this, Ot, cn).call(this, {
            data: r,
            type: 'success',
            dataUpdatedAt: n == null ? void 0 : n.updatedAt,
            manual: n == null ? void 0 : n.manual,
          }),
          r
        )
      }
      setState(t, n) {
        Ue(this, Ot, cn).call(this, { type: 'setState', state: t, setStateOptions: n })
      }
      cancel(t) {
        var r, o
        const n = (r = O(this, We)) == null ? void 0 : r.promise
        return (
          (o = O(this, We)) == null || o.cancel(t),
          n ? n.then(_t).catch(_t) : Promise.resolve()
        )
      }
      destroy() {
        ;(super.destroy(), this.cancel({ silent: !0 }))
      }
      reset() {
        ;(this.destroy(), this.setState(O(this, ho)))
      }
      isActive() {
        return this.observers.some(t => O2(t.options.enabled, this) !== !1)
      }
      isDisabled() {
        return this.getObserversCount() > 0
          ? !this.isActive()
          : this.options.queryFn === ed ||
              this.state.dataUpdateCount + this.state.errorUpdateCount === 0
      }
      isStatic() {
        return this.getObserversCount() > 0
          ? this.observers.some(t => Fu(t.options.staleTime, this) === 'static')
          : !1
      }
      isStale() {
        return this.getObserversCount() > 0
          ? this.observers.some(t => t.getCurrentResult().isStale)
          : this.state.data === void 0 || this.state.isInvalidated
      }
      isStaleByTime(t = 0) {
        return this.state.data === void 0
          ? !0
          : t === 'static'
            ? !1
            : this.state.isInvalidated
              ? !0
              : !_2(this.state.dataUpdatedAt, t)
      }
      onFocus() {
        var n
        const t = this.observers.find(r => r.shouldFetchOnWindowFocus())
        ;(t == null || t.refetch({ cancelRefetch: !1 }), (n = O(this, We)) == null || n.continue())
      }
      onOnline() {
        var n
        const t = this.observers.find(r => r.shouldFetchOnReconnect())
        ;(t == null || t.refetch({ cancelRefetch: !1 }), (n = O(this, We)) == null || n.continue())
      }
      addObserver(t) {
        this.observers.includes(t) ||
          (this.observers.push(t),
          this.clearGcTimeout(),
          O(this, vt).notify({ type: 'observerAdded', query: this, observer: t }))
      }
      removeObserver(t) {
        this.observers.includes(t) &&
          ((this.observers = this.observers.filter(n => n !== t)),
          this.observers.length ||
            (O(this, We) &&
              (O(this, kr) ? O(this, We).cancel({ revert: !0 }) : O(this, We).cancelRetry()),
            this.scheduleGc()),
          O(this, vt).notify({ type: 'observerRemoved', query: this, observer: t }))
      }
      getObserversCount() {
        return this.observers.length
      }
      invalidate() {
        this.state.isInvalidated || Ue(this, Ot, cn).call(this, { type: 'invalidate' })
      }
      fetch(t, n) {
        var u, d, f
        if (this.state.fetchStatus !== 'idle') {
          if (this.state.data !== void 0 && n != null && n.cancelRefetch)
            this.cancel({ silent: !0 })
          else if (O(this, We)) return (O(this, We).continueRetry(), O(this, We).promise)
        }
        if ((t && this.setOptions(t), !this.options.queryFn)) {
          const g = this.observers.find(p => p.options.queryFn)
          g && this.setOptions(g.options)
        }
        const r = new AbortController(),
          o = g => {
            Object.defineProperty(g, 'signal', {
              enumerable: !0,
              get: () => (ee(this, kr, !0), r.signal),
            })
          },
          s = () => {
            const g = Kg(this.options, n),
              b = (() => {
                const x = { client: O(this, Sr), queryKey: this.queryKey, meta: this.meta }
                return (o(x), x)
              })()
            return (
              ee(this, kr, !1),
              this.options.persister ? this.options.persister(g, b, this) : g(b)
            )
          },
          l = (() => {
            const g = {
              fetchOptions: n,
              options: this.options,
              queryKey: this.queryKey,
              client: O(this, Sr),
              state: this.state,
              fetchFn: s,
            }
            return (o(g), g)
          })()
        ;((u = this.options.behavior) == null || u.onFetch(l, this),
          ee(this, br, this.state),
          (this.state.fetchStatus === 'idle' ||
            this.state.fetchMeta !== ((d = l.fetchOptions) == null ? void 0 : d.meta)) &&
            Ue(this, Ot, cn).call(this, {
              type: 'fetch',
              meta: (f = l.fetchOptions) == null ? void 0 : f.meta,
            }))
        const a = g => {
          var p, b, x, w
          ;((ja(g) && g.silent) || Ue(this, Ot, cn).call(this, { type: 'error', error: g }),
            ja(g) ||
              ((b = (p = O(this, vt).config).onError) == null || b.call(p, g, this),
              (w = (x = O(this, vt).config).onSettled) == null ||
                w.call(x, this.state.data, g, this)),
            this.scheduleGc())
        }
        return (
          ee(
            this,
            We,
            Xg({
              initialPromise: n == null ? void 0 : n.initialPromise,
              fn: l.fetchFn,
              abort: r.abort.bind(r),
              onSuccess: g => {
                var p, b, x, w
                if (g === void 0) {
                  a(new Error(`${this.queryHash} data is undefined`))
                  return
                }
                try {
                  this.setData(g)
                } catch (m) {
                  a(m)
                  return
                }
                ;((b = (p = O(this, vt).config).onSuccess) == null || b.call(p, g, this),
                  (w = (x = O(this, vt).config).onSettled) == null ||
                    w.call(x, g, this.state.error, this),
                  this.scheduleGc())
              },
              onError: a,
              onFail: (g, p) => {
                Ue(this, Ot, cn).call(this, { type: 'failed', failureCount: g, error: p })
              },
              onPause: () => {
                Ue(this, Ot, cn).call(this, { type: 'pause' })
              },
              onContinue: () => {
                Ue(this, Ot, cn).call(this, { type: 'continue' })
              },
              retry: l.options.retry,
              retryDelay: l.options.retryDelay,
              networkMode: l.options.networkMode,
              canRun: () => !0,
            })
          ),
          O(this, We).start()
        )
      }
    }),
    (ho = new WeakMap()),
    (br = new WeakMap()),
    (vt = new WeakMap()),
    (Sr = new WeakMap()),
    (We = new WeakMap()),
    (_s = new WeakMap()),
    (kr = new WeakMap()),
    (Ot = new WeakSet()),
    (cn = function (t) {
      const n = r => {
        switch (t.type) {
          case 'failed':
            return { ...r, fetchFailureCount: t.failureCount, fetchFailureReason: t.error }
          case 'pause':
            return { ...r, fetchStatus: 'paused' }
          case 'continue':
            return { ...r, fetchStatus: 'fetching' }
          case 'fetch':
            return { ...r, ...V2(r.data, this.options), fetchMeta: t.meta ?? null }
          case 'success':
            return (
              ee(this, br, void 0),
              {
                ...r,
                data: t.data,
                dataUpdateCount: r.dataUpdateCount + 1,
                dataUpdatedAt: t.dataUpdatedAt ?? Date.now(),
                error: null,
                isInvalidated: !1,
                status: 'success',
                ...(!t.manual && {
                  fetchStatus: 'idle',
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                }),
              }
            )
          case 'error':
            const o = t.error
            return ja(o) && o.revert && O(this, br)
              ? { ...O(this, br), fetchStatus: 'idle' }
              : {
                  ...r,
                  error: o,
                  errorUpdateCount: r.errorUpdateCount + 1,
                  errorUpdatedAt: Date.now(),
                  fetchFailureCount: r.fetchFailureCount + 1,
                  fetchFailureReason: o,
                  fetchStatus: 'idle',
                  status: 'error',
                }
          case 'invalidate':
            return { ...r, isInvalidated: !0 }
          case 'setState':
            return { ...r, ...t.state }
        }
      }
      ;((this.state = n(this.state)),
        Ge.batch(() => {
          ;(this.observers.forEach(r => {
            r.onQueryUpdate()
          }),
            O(this, vt).notify({ query: this, type: 'updated', action: t }))
        }))
    }),
    cp)
function V2(e, t) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: Gg(t.networkMode) ? 'fetching' : 'paused',
    ...(e === void 0 && { error: null, status: 'pending' }),
  }
}
function Q2(e) {
  const t = typeof e.initialData == 'function' ? e.initialData() : e.initialData,
    n = t !== void 0,
    r = n
      ? typeof e.initialDataUpdatedAt == 'function'
        ? e.initialDataUpdatedAt()
        : e.initialDataUpdatedAt
      : 0
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: n ? (r ?? Date.now()) : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: n ? 'success' : 'pending',
    fetchStatus: 'idle',
  }
}
var Gt,
  dp,
  K2 =
    ((dp = class extends Fl {
      constructor(t = {}) {
        super()
        ae(this, Gt)
        ;((this.config = t), ee(this, Gt, new Map()))
      }
      build(t, n, r) {
        const o = n.queryKey,
          s = n.queryHash ?? Jc(o, n)
        let i = this.get(s)
        return (
          i ||
            ((i = new W2({
              client: t,
              queryKey: o,
              queryHash: s,
              options: t.defaultQueryOptions(n),
              state: r,
              defaultOptions: t.getQueryDefaults(o),
            })),
            this.add(i)),
          i
        )
      }
      add(t) {
        O(this, Gt).has(t.queryHash) ||
          (O(this, Gt).set(t.queryHash, t), this.notify({ type: 'added', query: t }))
      }
      remove(t) {
        const n = O(this, Gt).get(t.queryHash)
        n &&
          (t.destroy(),
          n === t && O(this, Gt).delete(t.queryHash),
          this.notify({ type: 'removed', query: t }))
      }
      clear() {
        Ge.batch(() => {
          this.getAll().forEach(t => {
            this.remove(t)
          })
        })
      }
      get(t) {
        return O(this, Gt).get(t)
      }
      getAll() {
        return [...O(this, Gt).values()]
      }
      find(t) {
        const n = { exact: !0, ...t }
        return this.getAll().find(r => Ff(n, r))
      }
      findAll(t = {}) {
        const n = this.getAll()
        return Object.keys(t).length > 0 ? n.filter(r => Ff(t, r)) : n
      }
      notify(t) {
        Ge.batch(() => {
          this.listeners.forEach(n => {
            n(t)
          })
        })
      }
      onFocus() {
        Ge.batch(() => {
          this.getAll().forEach(t => {
            t.onFocus()
          })
        })
      }
      onOnline() {
        Ge.batch(() => {
          this.getAll().forEach(t => {
            t.onOnline()
          })
        })
      }
    }),
    (Gt = new WeakMap()),
    dp),
  qt,
  Ke,
  Cr,
  Xt,
  _n,
  fp,
  Y2 =
    ((fp = class extends Zg {
      constructor(t) {
        super()
        ae(this, Xt)
        ae(this, qt)
        ae(this, Ke)
        ae(this, Cr)
        ;((this.mutationId = t.mutationId),
          ee(this, Ke, t.mutationCache),
          ee(this, qt, []),
          (this.state = t.state || G2()),
          this.setOptions(t.options),
          this.scheduleGc())
      }
      setOptions(t) {
        ;((this.options = t), this.updateGcTime(this.options.gcTime))
      }
      get meta() {
        return this.options.meta
      }
      addObserver(t) {
        O(this, qt).includes(t) ||
          (O(this, qt).push(t),
          this.clearGcTimeout(),
          O(this, Ke).notify({ type: 'observerAdded', mutation: this, observer: t }))
      }
      removeObserver(t) {
        ;(ee(
          this,
          qt,
          O(this, qt).filter(n => n !== t)
        ),
          this.scheduleGc(),
          O(this, Ke).notify({ type: 'observerRemoved', mutation: this, observer: t }))
      }
      optionalRemove() {
        O(this, qt).length ||
          (this.state.status === 'pending' ? this.scheduleGc() : O(this, Ke).remove(this))
      }
      continue() {
        var t
        return (
          ((t = O(this, Cr)) == null ? void 0 : t.continue()) ?? this.execute(this.state.variables)
        )
      }
      async execute(t) {
        var s, i, l, a, u, d, f, g, p, b, x, w, m, h, v, k, N, j, P, T
        const n = () => {
          Ue(this, Xt, _n).call(this, { type: 'continue' })
        }
        ee(
          this,
          Cr,
          Xg({
            fn: () =>
              this.options.mutationFn
                ? this.options.mutationFn(t)
                : Promise.reject(new Error('No mutationFn found')),
            onFail: (I, D) => {
              Ue(this, Xt, _n).call(this, { type: 'failed', failureCount: I, error: D })
            },
            onPause: () => {
              Ue(this, Xt, _n).call(this, { type: 'pause' })
            },
            onContinue: n,
            retry: this.options.retry ?? 0,
            retryDelay: this.options.retryDelay,
            networkMode: this.options.networkMode,
            canRun: () => O(this, Ke).canRun(this),
          })
        )
        const r = this.state.status === 'pending',
          o = !O(this, Cr).canStart()
        try {
          if (r) n()
          else {
            ;(Ue(this, Xt, _n).call(this, { type: 'pending', variables: t, isPaused: o }),
              await ((i = (s = O(this, Ke).config).onMutate) == null ? void 0 : i.call(s, t, this)))
            const D = await ((a = (l = this.options).onMutate) == null ? void 0 : a.call(l, t))
            D !== this.state.context &&
              Ue(this, Xt, _n).call(this, {
                type: 'pending',
                context: D,
                variables: t,
                isPaused: o,
              })
          }
          const I = await O(this, Cr).start()
          return (
            await ((d = (u = O(this, Ke).config).onSuccess) == null
              ? void 0
              : d.call(u, I, t, this.state.context, this)),
            await ((g = (f = this.options).onSuccess) == null
              ? void 0
              : g.call(f, I, t, this.state.context)),
            await ((b = (p = O(this, Ke).config).onSettled) == null
              ? void 0
              : b.call(p, I, null, this.state.variables, this.state.context, this)),
            await ((w = (x = this.options).onSettled) == null
              ? void 0
              : w.call(x, I, null, t, this.state.context)),
            Ue(this, Xt, _n).call(this, { type: 'success', data: I }),
            I
          )
        } catch (I) {
          try {
            throw (
              await ((h = (m = O(this, Ke).config).onError) == null
                ? void 0
                : h.call(m, I, t, this.state.context, this)),
              await ((k = (v = this.options).onError) == null
                ? void 0
                : k.call(v, I, t, this.state.context)),
              await ((j = (N = O(this, Ke).config).onSettled) == null
                ? void 0
                : j.call(N, void 0, I, this.state.variables, this.state.context, this)),
              await ((T = (P = this.options).onSettled) == null
                ? void 0
                : T.call(P, void 0, I, t, this.state.context)),
              I
            )
          } finally {
            Ue(this, Xt, _n).call(this, { type: 'error', error: I })
          }
        } finally {
          O(this, Ke).runNext(this)
        }
      }
    }),
    (qt = new WeakMap()),
    (Ke = new WeakMap()),
    (Cr = new WeakMap()),
    (Xt = new WeakSet()),
    (_n = function (t) {
      const n = r => {
        switch (t.type) {
          case 'failed':
            return { ...r, failureCount: t.failureCount, failureReason: t.error }
          case 'pause':
            return { ...r, isPaused: !0 }
          case 'continue':
            return { ...r, isPaused: !1 }
          case 'pending':
            return {
              ...r,
              context: t.context,
              data: void 0,
              failureCount: 0,
              failureReason: null,
              error: null,
              isPaused: t.isPaused,
              status: 'pending',
              variables: t.variables,
              submittedAt: Date.now(),
            }
          case 'success':
            return {
              ...r,
              data: t.data,
              failureCount: 0,
              failureReason: null,
              error: null,
              status: 'success',
              isPaused: !1,
            }
          case 'error':
            return {
              ...r,
              data: void 0,
              error: t.error,
              failureCount: r.failureCount + 1,
              failureReason: t.error,
              isPaused: !1,
              status: 'error',
            }
        }
      }
      ;((this.state = n(this.state)),
        Ge.batch(() => {
          ;(O(this, qt).forEach(r => {
            r.onMutationUpdate(t)
          }),
            O(this, Ke).notify({ mutation: this, type: 'updated', action: t }))
        }))
    }),
    fp)
function G2() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: 'idle',
    variables: void 0,
    submittedAt: 0,
  }
}
var pn,
  At,
  Os,
  pp,
  q2 =
    ((pp = class extends Fl {
      constructor(t = {}) {
        super()
        ae(this, pn)
        ae(this, At)
        ae(this, Os)
        ;((this.config = t), ee(this, pn, new Set()), ee(this, At, new Map()), ee(this, Os, 0))
      }
      build(t, n, r) {
        const o = new Y2({
          mutationCache: this,
          mutationId: ++Xs(this, Os)._,
          options: t.defaultMutationOptions(n),
          state: r,
        })
        return (this.add(o), o)
      }
      add(t) {
        O(this, pn).add(t)
        const n = xi(t)
        if (typeof n == 'string') {
          const r = O(this, At).get(n)
          r ? r.push(t) : O(this, At).set(n, [t])
        }
        this.notify({ type: 'added', mutation: t })
      }
      remove(t) {
        if (O(this, pn).delete(t)) {
          const n = xi(t)
          if (typeof n == 'string') {
            const r = O(this, At).get(n)
            if (r)
              if (r.length > 1) {
                const o = r.indexOf(t)
                o !== -1 && r.splice(o, 1)
              } else r[0] === t && O(this, At).delete(n)
          }
        }
        this.notify({ type: 'removed', mutation: t })
      }
      canRun(t) {
        const n = xi(t)
        if (typeof n == 'string') {
          const r = O(this, At).get(n),
            o = r == null ? void 0 : r.find(s => s.state.status === 'pending')
          return !o || o === t
        } else return !0
      }
      runNext(t) {
        var r
        const n = xi(t)
        if (typeof n == 'string') {
          const o =
            (r = O(this, At).get(n)) == null ? void 0 : r.find(s => s !== t && s.state.isPaused)
          return (o == null ? void 0 : o.continue()) ?? Promise.resolve()
        } else return Promise.resolve()
      }
      clear() {
        Ge.batch(() => {
          ;(O(this, pn).forEach(t => {
            this.notify({ type: 'removed', mutation: t })
          }),
            O(this, pn).clear(),
            O(this, At).clear())
        })
      }
      getAll() {
        return Array.from(O(this, pn))
      }
      find(t) {
        const n = { exact: !0, ...t }
        return this.getAll().find(r => $f(n, r))
      }
      findAll(t = {}) {
        return this.getAll().filter(n => $f(t, n))
      }
      notify(t) {
        Ge.batch(() => {
          this.listeners.forEach(n => {
            n(t)
          })
        })
      }
      resumePausedMutations() {
        const t = this.getAll().filter(n => n.state.isPaused)
        return Ge.batch(() => Promise.all(t.map(n => n.continue().catch(_t))))
      }
    }),
    (pn = new WeakMap()),
    (At = new WeakMap()),
    (Os = new WeakMap()),
    pp)
function xi(e) {
  var t
  return (t = e.options.scope) == null ? void 0 : t.id
}
function Hf(e) {
  return {
    onFetch: (t, n) => {
      var d, f, g, p, b
      const r = t.options,
        o =
          (g =
            (f = (d = t.fetchOptions) == null ? void 0 : d.meta) == null ? void 0 : f.fetchMore) ==
          null
            ? void 0
            : g.direction,
        s = ((p = t.state.data) == null ? void 0 : p.pages) || [],
        i = ((b = t.state.data) == null ? void 0 : b.pageParams) || []
      let l = { pages: [], pageParams: [] },
        a = 0
      const u = async () => {
        let x = !1
        const w = v => {
            Object.defineProperty(v, 'signal', {
              enumerable: !0,
              get: () => (
                t.signal.aborted
                  ? (x = !0)
                  : t.signal.addEventListener('abort', () => {
                      x = !0
                    }),
                t.signal
              ),
            })
          },
          m = Kg(t.options, t.fetchOptions),
          h = async (v, k, N) => {
            if (x) return Promise.reject()
            if (k == null && v.pages.length) return Promise.resolve(v)
            const P = (() => {
                const Q = {
                  client: t.client,
                  queryKey: t.queryKey,
                  pageParam: k,
                  direction: N ? 'backward' : 'forward',
                  meta: t.options.meta,
                }
                return (w(Q), Q)
              })(),
              T = await m(P),
              { maxPages: I } = t.options,
              D = N ? D2 : I2
            return { pages: D(v.pages, T, I), pageParams: D(v.pageParams, k, I) }
          }
        if (o && s.length) {
          const v = o === 'backward',
            k = v ? X2 : Wf,
            N = { pages: s, pageParams: i },
            j = k(r, N)
          l = await h(N, j, v)
        } else {
          const v = e ?? s.length
          do {
            const k = a === 0 ? (i[0] ?? r.initialPageParam) : Wf(r, l)
            if (a > 0 && k == null) break
            ;((l = await h(l, k)), a++)
          } while (a < v)
        }
        return l
      }
      t.options.persister
        ? (t.fetchFn = () => {
            var x, w
            return (w = (x = t.options).persister) == null
              ? void 0
              : w.call(
                  x,
                  u,
                  {
                    client: t.client,
                    queryKey: t.queryKey,
                    meta: t.options.meta,
                    signal: t.signal,
                  },
                  n
                )
          })
        : (t.fetchFn = u)
    },
  }
}
function Wf(e, { pages: t, pageParams: n }) {
  const r = t.length - 1
  return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0
}
function X2(e, { pages: t, pageParams: n }) {
  var r
  return t.length > 0
    ? (r = e.getPreviousPageParam) == null
      ? void 0
      : r.call(e, t[0], t, n[0], n)
    : void 0
}
var Ce,
  Fn,
  $n,
  mo,
  go,
  Un,
  yo,
  vo,
  hp,
  Z2 =
    ((hp = class {
      constructor(e = {}) {
        ae(this, Ce)
        ae(this, Fn)
        ae(this, $n)
        ae(this, mo)
        ae(this, go)
        ae(this, Un)
        ae(this, yo)
        ae(this, vo)
        ;(ee(this, Ce, e.queryCache || new K2()),
          ee(this, Fn, e.mutationCache || new q2()),
          ee(this, $n, e.defaultOptions || {}),
          ee(this, mo, new Map()),
          ee(this, go, new Map()),
          ee(this, Un, 0))
      }
      mount() {
        ;(Xs(this, Un)._++,
          O(this, Un) === 1 &&
            (ee(
              this,
              yo,
              Yg.subscribe(async e => {
                e && (await this.resumePausedMutations(), O(this, Ce).onFocus())
              })
            ),
            ee(
              this,
              vo,
              dl.subscribe(async e => {
                e && (await this.resumePausedMutations(), O(this, Ce).onOnline())
              })
            )))
      }
      unmount() {
        var e, t
        ;(Xs(this, Un)._--,
          O(this, Un) === 0 &&
            ((e = O(this, yo)) == null || e.call(this),
            ee(this, yo, void 0),
            (t = O(this, vo)) == null || t.call(this),
            ee(this, vo, void 0)))
      }
      isFetching(e) {
        return O(this, Ce).findAll({ ...e, fetchStatus: 'fetching' }).length
      }
      isMutating(e) {
        return O(this, Fn).findAll({ ...e, status: 'pending' }).length
      }
      getQueryData(e) {
        var n
        const t = this.defaultQueryOptions({ queryKey: e })
        return (n = O(this, Ce).get(t.queryHash)) == null ? void 0 : n.state.data
      }
      ensureQueryData(e) {
        const t = this.defaultQueryOptions(e),
          n = O(this, Ce).build(this, t),
          r = n.state.data
        return r === void 0
          ? this.fetchQuery(e)
          : (e.revalidateIfStale && n.isStaleByTime(Fu(t.staleTime, n)) && this.prefetchQuery(t),
            Promise.resolve(r))
      }
      getQueriesData(e) {
        return O(this, Ce)
          .findAll(e)
          .map(({ queryKey: t, state: n }) => {
            const r = n.data
            return [t, r]
          })
      }
      setQueryData(e, t, n) {
        const r = this.defaultQueryOptions({ queryKey: e }),
          o = O(this, Ce).get(r.queryHash),
          s = o == null ? void 0 : o.state.data,
          i = R2(t, s)
        if (i !== void 0)
          return O(this, Ce)
            .build(this, r)
            .setData(i, { ...n, manual: !0 })
      }
      setQueriesData(e, t, n) {
        return Ge.batch(() =>
          O(this, Ce)
            .findAll(e)
            .map(({ queryKey: r }) => [r, this.setQueryData(r, t, n)])
        )
      }
      getQueryState(e) {
        var n
        const t = this.defaultQueryOptions({ queryKey: e })
        return (n = O(this, Ce).get(t.queryHash)) == null ? void 0 : n.state
      }
      removeQueries(e) {
        const t = O(this, Ce)
        Ge.batch(() => {
          t.findAll(e).forEach(n => {
            t.remove(n)
          })
        })
      }
      resetQueries(e, t) {
        const n = O(this, Ce)
        return Ge.batch(
          () => (
            n.findAll(e).forEach(r => {
              r.reset()
            }),
            this.refetchQueries({ type: 'active', ...e }, t)
          )
        )
      }
      cancelQueries(e, t = {}) {
        const n = { revert: !0, ...t },
          r = Ge.batch(() =>
            O(this, Ce)
              .findAll(e)
              .map(o => o.cancel(n))
          )
        return Promise.all(r).then(_t).catch(_t)
      }
      invalidateQueries(e, t = {}) {
        return Ge.batch(
          () => (
            O(this, Ce)
              .findAll(e)
              .forEach(n => {
                n.invalidate()
              }),
            (e == null ? void 0 : e.refetchType) === 'none'
              ? Promise.resolve()
              : this.refetchQueries(
                  {
                    ...e,
                    type:
                      (e == null ? void 0 : e.refetchType) ??
                      (e == null ? void 0 : e.type) ??
                      'active',
                  },
                  t
                )
          )
        )
      }
      refetchQueries(e, t = {}) {
        const n = { ...t, cancelRefetch: t.cancelRefetch ?? !0 },
          r = Ge.batch(() =>
            O(this, Ce)
              .findAll(e)
              .filter(o => !o.isDisabled() && !o.isStatic())
              .map(o => {
                let s = o.fetch(void 0, n)
                return (
                  n.throwOnError || (s = s.catch(_t)),
                  o.state.fetchStatus === 'paused' ? Promise.resolve() : s
                )
              })
          )
        return Promise.all(r).then(_t)
      }
      fetchQuery(e) {
        const t = this.defaultQueryOptions(e)
        t.retry === void 0 && (t.retry = !1)
        const n = O(this, Ce).build(this, t)
        return n.isStaleByTime(Fu(t.staleTime, n)) ? n.fetch(t) : Promise.resolve(n.state.data)
      }
      prefetchQuery(e) {
        return this.fetchQuery(e).then(_t).catch(_t)
      }
      fetchInfiniteQuery(e) {
        return ((e.behavior = Hf(e.pages)), this.fetchQuery(e))
      }
      prefetchInfiniteQuery(e) {
        return this.fetchInfiniteQuery(e).then(_t).catch(_t)
      }
      ensureInfiniteQueryData(e) {
        return ((e.behavior = Hf(e.pages)), this.ensureQueryData(e))
      }
      resumePausedMutations() {
        return dl.isOnline() ? O(this, Fn).resumePausedMutations() : Promise.resolve()
      }
      getQueryCache() {
        return O(this, Ce)
      }
      getMutationCache() {
        return O(this, Fn)
      }
      getDefaultOptions() {
        return O(this, $n)
      }
      setDefaultOptions(e) {
        ee(this, $n, e)
      }
      setQueryDefaults(e, t) {
        O(this, mo).set(Ns(e), { queryKey: e, defaultOptions: t })
      }
      getQueryDefaults(e) {
        const t = [...O(this, mo).values()],
          n = {}
        return (
          t.forEach(r => {
            Ps(e, r.queryKey) && Object.assign(n, r.defaultOptions)
          }),
          n
        )
      }
      setMutationDefaults(e, t) {
        O(this, go).set(Ns(e), { mutationKey: e, defaultOptions: t })
      }
      getMutationDefaults(e) {
        const t = [...O(this, go).values()],
          n = {}
        return (
          t.forEach(r => {
            Ps(e, r.mutationKey) && Object.assign(n, r.defaultOptions)
          }),
          n
        )
      }
      defaultQueryOptions(e) {
        if (e._defaulted) return e
        const t = {
          ...O(this, $n).queries,
          ...this.getQueryDefaults(e.queryKey),
          ...e,
          _defaulted: !0,
        }
        return (
          t.queryHash || (t.queryHash = Jc(t.queryKey, t)),
          t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== 'always'),
          t.throwOnError === void 0 && (t.throwOnError = !!t.suspense),
          !t.networkMode && t.persister && (t.networkMode = 'offlineFirst'),
          t.queryFn === ed && (t.enabled = !1),
          t
        )
      }
      defaultMutationOptions(e) {
        return e != null && e._defaulted
          ? e
          : {
              ...O(this, $n).mutations,
              ...((e == null ? void 0 : e.mutationKey) && this.getMutationDefaults(e.mutationKey)),
              ...e,
              _defaulted: !0,
            }
      }
      clear() {
        ;(O(this, Ce).clear(), O(this, Fn).clear())
      }
    }),
    (Ce = new WeakMap()),
    (Fn = new WeakMap()),
    ($n = new WeakMap()),
    (mo = new WeakMap()),
    (go = new WeakMap()),
    (Un = new WeakMap()),
    (yo = new WeakMap()),
    (vo = new WeakMap()),
    hp),
  J2 = y.createContext(void 0),
  eS = ({ client: e, children: t }) => (
    y.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount()
        }
      ),
      [e]
    ),
    c.jsx(J2.Provider, { value: e, children: t })
  )
/**
 * @remix-run/router v1.23.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function js() {
  return (
    (js = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t]
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
          }
          return e
        }),
    js.apply(this, arguments)
  )
}
var Wn
;(function (e) {
  ;((e.Pop = 'POP'), (e.Push = 'PUSH'), (e.Replace = 'REPLACE'))
})(Wn || (Wn = {}))
const Vf = 'popstate'
function tS(e) {
  e === void 0 && (e = {})
  function t(r, o) {
    let { pathname: s, search: i, hash: l } = r.location
    return fl(
      '',
      { pathname: s, search: i, hash: l },
      (o.state && o.state.usr) || null,
      (o.state && o.state.key) || 'default'
    )
  }
  function n(r, o) {
    return typeof o == 'string' ? o : Ts(o)
  }
  return Jg(t, n, null, e)
}
function nS(e) {
  e === void 0 && (e = {})
  function t(o, s) {
    let { pathname: i = '/', search: l = '', hash: a = '' } = Ir(o.location.hash.substr(1))
    return (
      !i.startsWith('/') && !i.startsWith('.') && (i = '/' + i),
      fl(
        '',
        { pathname: i, search: l, hash: a },
        (s.state && s.state.usr) || null,
        (s.state && s.state.key) || 'default'
      )
    )
  }
  function n(o, s) {
    let i = o.document.querySelector('base'),
      l = ''
    if (i && i.getAttribute('href')) {
      let a = o.location.href,
        u = a.indexOf('#')
      l = u === -1 ? a : a.slice(0, u)
    }
    return l + '#' + (typeof s == 'string' ? s : Ts(s))
  }
  function r(o, s) {
    td(
      o.pathname.charAt(0) === '/',
      'relative pathnames are not supported in hash history.push(' + JSON.stringify(s) + ')'
    )
  }
  return Jg(t, n, r, e)
}
function Re(e, t) {
  if (e === !1 || e === null || typeof e > 'u') throw new Error(t)
}
function td(e, t) {
  if (!e) {
    typeof console < 'u' && console.warn(t)
    try {
      throw new Error(t)
    } catch {}
  }
}
function rS() {
  return Math.random().toString(36).substr(2, 8)
}
function Qf(e, t) {
  return { usr: e.state, key: e.key, idx: t }
}
function fl(e, t, n, r) {
  return (
    n === void 0 && (n = null),
    js(
      { pathname: typeof e == 'string' ? e : e.pathname, search: '', hash: '' },
      typeof t == 'string' ? Ir(t) : t,
      { state: n, key: (t && t.key) || r || rS() }
    )
  )
}
function Ts(e) {
  let { pathname: t = '/', search: n = '', hash: r = '' } = e
  return (
    n && n !== '?' && (t += n.charAt(0) === '?' ? n : '?' + n),
    r && r !== '#' && (t += r.charAt(0) === '#' ? r : '#' + r),
    t
  )
}
function Ir(e) {
  let t = {}
  if (e) {
    let n = e.indexOf('#')
    n >= 0 && ((t.hash = e.substr(n)), (e = e.substr(0, n)))
    let r = e.indexOf('?')
    ;(r >= 0 && ((t.search = e.substr(r)), (e = e.substr(0, r))), e && (t.pathname = e))
  }
  return t
}
function Jg(e, t, n, r) {
  r === void 0 && (r = {})
  let { window: o = document.defaultView, v5Compat: s = !1 } = r,
    i = o.history,
    l = Wn.Pop,
    a = null,
    u = d()
  u == null && ((u = 0), i.replaceState(js({}, i.state, { idx: u }), ''))
  function d() {
    return (i.state || { idx: null }).idx
  }
  function f() {
    l = Wn.Pop
    let w = d(),
      m = w == null ? null : w - u
    ;((u = w), a && a({ action: l, location: x.location, delta: m }))
  }
  function g(w, m) {
    l = Wn.Push
    let h = fl(x.location, w, m)
    ;(n && n(h, w), (u = d() + 1))
    let v = Qf(h, u),
      k = x.createHref(h)
    try {
      i.pushState(v, '', k)
    } catch (N) {
      if (N instanceof DOMException && N.name === 'DataCloneError') throw N
      o.location.assign(k)
    }
    s && a && a({ action: l, location: x.location, delta: 1 })
  }
  function p(w, m) {
    l = Wn.Replace
    let h = fl(x.location, w, m)
    ;(n && n(h, w), (u = d()))
    let v = Qf(h, u),
      k = x.createHref(h)
    ;(i.replaceState(v, '', k), s && a && a({ action: l, location: x.location, delta: 0 }))
  }
  function b(w) {
    let m = o.location.origin !== 'null' ? o.location.origin : o.location.href,
      h = typeof w == 'string' ? w : Ts(w)
    return (
      (h = h.replace(/ $/, '%20')),
      Re(m, 'No window.location.(origin|href) available to create URL for href: ' + h),
      new URL(h, m)
    )
  }
  let x = {
    get action() {
      return l
    },
    get location() {
      return e(o, i)
    },
    listen(w) {
      if (a) throw new Error('A history only accepts one active listener')
      return (
        o.addEventListener(Vf, f),
        (a = w),
        () => {
          ;(o.removeEventListener(Vf, f), (a = null))
        }
      )
    },
    createHref(w) {
      return t(o, w)
    },
    createURL: b,
    encodeLocation(w) {
      let m = b(w)
      return { pathname: m.pathname, search: m.search, hash: m.hash }
    },
    push: g,
    replace: p,
    go(w) {
      return i.go(w)
    },
  }
  return x
}
var Kf
;(function (e) {
  ;((e.data = 'data'), (e.deferred = 'deferred'), (e.redirect = 'redirect'), (e.error = 'error'))
})(Kf || (Kf = {}))
function oS(e, t, n) {
  return (n === void 0 && (n = '/'), sS(e, t, n, !1))
}
function sS(e, t, n, r) {
  let o = typeof t == 'string' ? Ir(t) : t,
    s = nd(o.pathname || '/', n)
  if (s == null) return null
  let i = ey(e)
  iS(i)
  let l = null
  for (let a = 0; l == null && a < i.length; ++a) {
    let u = yS(s)
    l = mS(i[a], u, r)
  }
  return l
}
function ey(e, t, n, r) {
  ;(t === void 0 && (t = []), n === void 0 && (n = []), r === void 0 && (r = ''))
  let o = (s, i, l) => {
    let a = {
      relativePath: l === void 0 ? s.path || '' : l,
      caseSensitive: s.caseSensitive === !0,
      childrenIndex: i,
      route: s,
    }
    a.relativePath.startsWith('/') &&
      (Re(
        a.relativePath.startsWith(r),
        'Absolute route path "' +
          a.relativePath +
          '" nested under path ' +
          ('"' + r + '" is not valid. An absolute child route path ') +
          'must start with the combined path of all its parent routes.'
      ),
      (a.relativePath = a.relativePath.slice(r.length)))
    let u = Jn([r, a.relativePath]),
      d = n.concat(a)
    ;(s.children &&
      s.children.length > 0 &&
      (Re(
        s.index !== !0,
        'Index routes must not have child routes. Please remove ' +
          ('all child routes from route path "' + u + '".')
      ),
      ey(s.children, t, d, u)),
      !(s.path == null && !s.index) && t.push({ path: u, score: pS(u, s.index), routesMeta: d }))
  }
  return (
    e.forEach((s, i) => {
      var l
      if (s.path === '' || !((l = s.path) != null && l.includes('?'))) o(s, i)
      else for (let a of ty(s.path)) o(s, i, a)
    }),
    t
  )
}
function ty(e) {
  let t = e.split('/')
  if (t.length === 0) return []
  let [n, ...r] = t,
    o = n.endsWith('?'),
    s = n.replace(/\?$/, '')
  if (r.length === 0) return o ? [s, ''] : [s]
  let i = ty(r.join('/')),
    l = []
  return (
    l.push(...i.map(a => (a === '' ? s : [s, a].join('/')))),
    o && l.push(...i),
    l.map(a => (e.startsWith('/') && a === '' ? '/' : a))
  )
}
function iS(e) {
  e.sort((t, n) =>
    t.score !== n.score
      ? n.score - t.score
      : hS(
          t.routesMeta.map(r => r.childrenIndex),
          n.routesMeta.map(r => r.childrenIndex)
        )
  )
}
const lS = /^:[\w-]+$/,
  aS = 3,
  uS = 2,
  cS = 1,
  dS = 10,
  fS = -2,
  Yf = e => e === '*'
function pS(e, t) {
  let n = e.split('/'),
    r = n.length
  return (
    n.some(Yf) && (r += fS),
    t && (r += uS),
    n.filter(o => !Yf(o)).reduce((o, s) => o + (lS.test(s) ? aS : s === '' ? cS : dS), r)
  )
}
function hS(e, t) {
  return e.length === t.length && e.slice(0, -1).every((r, o) => r === t[o])
    ? e[e.length - 1] - t[t.length - 1]
    : 0
}
function mS(e, t, n) {
  let { routesMeta: r } = e,
    o = {},
    s = '/',
    i = []
  for (let l = 0; l < r.length; ++l) {
    let a = r[l],
      u = l === r.length - 1,
      d = s === '/' ? t : t.slice(s.length) || '/',
      f = Gf({ path: a.relativePath, caseSensitive: a.caseSensitive, end: u }, d),
      g = a.route
    if (
      (!f &&
        u &&
        n &&
        !r[r.length - 1].route.index &&
        (f = Gf({ path: a.relativePath, caseSensitive: a.caseSensitive, end: !1 }, d)),
      !f)
    )
      return null
    ;(Object.assign(o, f.params),
      i.push({
        params: o,
        pathname: Jn([s, f.pathname]),
        pathnameBase: bS(Jn([s, f.pathnameBase])),
        route: g,
      }),
      f.pathnameBase !== '/' && (s = Jn([s, f.pathnameBase])))
  }
  return i
}
function Gf(e, t) {
  typeof e == 'string' && (e = { path: e, caseSensitive: !1, end: !0 })
  let [n, r] = gS(e.path, e.caseSensitive, e.end),
    o = t.match(n)
  if (!o) return null
  let s = o[0],
    i = s.replace(/(.)\/+$/, '$1'),
    l = o.slice(1)
  return {
    params: r.reduce((u, d, f) => {
      let { paramName: g, isOptional: p } = d
      if (g === '*') {
        let x = l[f] || ''
        i = s.slice(0, s.length - x.length).replace(/(.)\/+$/, '$1')
      }
      const b = l[f]
      return (p && !b ? (u[g] = void 0) : (u[g] = (b || '').replace(/%2F/g, '/')), u)
    }, {}),
    pathname: s,
    pathnameBase: i,
    pattern: e,
  }
}
function gS(e, t, n) {
  ;(t === void 0 && (t = !1),
    n === void 0 && (n = !0),
    td(
      e === '*' || !e.endsWith('*') || e.endsWith('/*'),
      'Route path "' +
        e +
        '" will be treated as if it were ' +
        ('"' + e.replace(/\*$/, '/*') + '" because the `*` character must ') +
        'always follow a `/` in the pattern. To get rid of this warning, ' +
        ('please change the route path to "' + e.replace(/\*$/, '/*') + '".')
    ))
  let r = [],
    o =
      '^' +
      e
        .replace(/\/*\*?$/, '')
        .replace(/^\/*/, '/')
        .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (i, l, a) => (
            r.push({ paramName: l, isOptional: a != null }),
            a ? '/?([^\\/]+)?' : '/([^\\/]+)'
          )
        )
  return (
    e.endsWith('*')
      ? (r.push({ paramName: '*' }), (o += e === '*' || e === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'))
      : n
        ? (o += '\\/*$')
        : e !== '' && e !== '/' && (o += '(?:(?=\\/|$))'),
    [new RegExp(o, t ? void 0 : 'i'), r]
  )
}
function yS(e) {
  try {
    return e
      .split('/')
      .map(t => decodeURIComponent(t).replace(/\//g, '%2F'))
      .join('/')
  } catch (t) {
    return (
      td(
        !1,
        'The URL path "' +
          e +
          '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' +
          ('encoding (' + t + ').')
      ),
      e
    )
  }
}
function nd(e, t) {
  if (t === '/') return e
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null
  let n = t.endsWith('/') ? t.length - 1 : t.length,
    r = e.charAt(n)
  return r && r !== '/' ? null : e.slice(n) || '/'
}
function vS(e, t) {
  t === void 0 && (t = '/')
  let { pathname: n, search: r = '', hash: o = '' } = typeof e == 'string' ? Ir(e) : e
  return { pathname: n ? (n.startsWith('/') ? n : xS(n, t)) : t, search: SS(r), hash: kS(o) }
}
function xS(e, t) {
  let n = t.replace(/\/+$/, '').split('/')
  return (
    e.split('/').forEach(o => {
      o === '..' ? n.length > 1 && n.pop() : o !== '.' && n.push(o)
    }),
    n.length > 1 ? n.join('/') : '/'
  )
}
function Ta(e, t, n, r) {
  return (
    "Cannot include a '" +
    e +
    "' character in a manually specified " +
    ('`to.' + t + '` field [' + JSON.stringify(r) + '].  Please separate it out to the ') +
    ('`to.' + n + '` field. Alternatively you may provide the full path as ') +
    'a string in <Link to="..."> and the router will parse it for you.'
  )
}
function wS(e) {
  return e.filter((t, n) => n === 0 || (t.route.path && t.route.path.length > 0))
}
function ny(e, t) {
  let n = wS(e)
  return t
    ? n.map((r, o) => (o === n.length - 1 ? r.pathname : r.pathnameBase))
    : n.map(r => r.pathnameBase)
}
function ry(e, t, n, r) {
  r === void 0 && (r = !1)
  let o
  typeof e == 'string'
    ? (o = Ir(e))
    : ((o = js({}, e)),
      Re(!o.pathname || !o.pathname.includes('?'), Ta('?', 'pathname', 'search', o)),
      Re(!o.pathname || !o.pathname.includes('#'), Ta('#', 'pathname', 'hash', o)),
      Re(!o.search || !o.search.includes('#'), Ta('#', 'search', 'hash', o)))
  let s = e === '' || o.pathname === '',
    i = s ? '/' : o.pathname,
    l
  if (i == null) l = n
  else {
    let f = t.length - 1
    if (!r && i.startsWith('..')) {
      let g = i.split('/')
      for (; g[0] === '..'; ) (g.shift(), (f -= 1))
      o.pathname = g.join('/')
    }
    l = f >= 0 ? t[f] : '/'
  }
  let a = vS(o, l),
    u = i && i !== '/' && i.endsWith('/'),
    d = (s || i === '.') && n.endsWith('/')
  return (!a.pathname.endsWith('/') && (u || d) && (a.pathname += '/'), a)
}
const Jn = e => e.join('/').replace(/\/\/+/g, '/'),
  bS = e => e.replace(/\/+$/, '').replace(/^\/*/, '/'),
  SS = e => (!e || e === '?' ? '' : e.startsWith('?') ? e : '?' + e),
  kS = e => (!e || e === '#' ? '' : e.startsWith('#') ? e : '#' + e)
function CS(e) {
  return (
    e != null &&
    typeof e.status == 'number' &&
    typeof e.statusText == 'string' &&
    typeof e.internal == 'boolean' &&
    'data' in e
  )
}
const oy = ['post', 'put', 'patch', 'delete']
new Set(oy)
const ES = ['get', ...oy]
new Set(ES)
/**
 * React Router v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function Rs() {
  return (
    (Rs = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t]
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
          }
          return e
        }),
    Rs.apply(this, arguments)
  )
}
const rd = y.createContext(null),
  NS = y.createContext(null),
  Dr = y.createContext(null),
  Ul = y.createContext(null),
  zr = y.createContext({ outlet: null, matches: [], isDataRoute: !1 }),
  sy = y.createContext(null)
function PS(e, t) {
  let { relative: n } = t === void 0 ? {} : t
  Bs() || Re(!1)
  let { basename: r, navigator: o } = y.useContext(Dr),
    { hash: s, pathname: i, search: l } = ly(e, { relative: n }),
    a = i
  return (
    r !== '/' && (a = i === '/' ? r : Jn([r, i])),
    o.createHref({ pathname: a, search: l, hash: s })
  )
}
function Bs() {
  return y.useContext(Ul) != null
}
function Hs() {
  return (Bs() || Re(!1), y.useContext(Ul).location)
}
function iy(e) {
  y.useContext(Dr).static || y.useLayoutEffect(e)
}
function jS() {
  let { isDataRoute: e } = y.useContext(zr)
  return e ? US() : TS()
}
function TS() {
  Bs() || Re(!1)
  let e = y.useContext(rd),
    { basename: t, future: n, navigator: r } = y.useContext(Dr),
    { matches: o } = y.useContext(zr),
    { pathname: s } = Hs(),
    i = JSON.stringify(ny(o, n.v7_relativeSplatPath)),
    l = y.useRef(!1)
  return (
    iy(() => {
      l.current = !0
    }),
    y.useCallback(
      function (u, d) {
        if ((d === void 0 && (d = {}), !l.current)) return
        if (typeof u == 'number') {
          r.go(u)
          return
        }
        let f = ry(u, JSON.parse(i), s, d.relative === 'path')
        ;(e == null && t !== '/' && (f.pathname = f.pathname === '/' ? t : Jn([t, f.pathname])),
          (d.replace ? r.replace : r.push)(f, d.state, d))
      },
      [t, r, i, s, e]
    )
  )
}
function ly(e, t) {
  let { relative: n } = t === void 0 ? {} : t,
    { future: r } = y.useContext(Dr),
    { matches: o } = y.useContext(zr),
    { pathname: s } = Hs(),
    i = JSON.stringify(ny(o, r.v7_relativeSplatPath))
  return y.useMemo(() => ry(e, JSON.parse(i), s, n === 'path'), [e, i, s, n])
}
function RS(e, t) {
  return MS(e, t)
}
function MS(e, t, n, r) {
  Bs() || Re(!1)
  let { navigator: o } = y.useContext(Dr),
    { matches: s } = y.useContext(zr),
    i = s[s.length - 1],
    l = i ? i.params : {}
  i && i.pathname
  let a = i ? i.pathnameBase : '/'
  i && i.route
  let u = Hs(),
    d
  if (t) {
    var f
    let w = typeof t == 'string' ? Ir(t) : t
    ;(a === '/' || ((f = w.pathname) != null && f.startsWith(a)) || Re(!1), (d = w))
  } else d = u
  let g = d.pathname || '/',
    p = g
  if (a !== '/') {
    let w = a.replace(/^\//, '').split('/')
    p = '/' + g.replace(/^\//, '').split('/').slice(w.length).join('/')
  }
  let b = oS(e, { pathname: p }),
    x = IS(
      b &&
        b.map(w =>
          Object.assign({}, w, {
            params: Object.assign({}, l, w.params),
            pathname: Jn([
              a,
              o.encodeLocation ? o.encodeLocation(w.pathname).pathname : w.pathname,
            ]),
            pathnameBase:
              w.pathnameBase === '/'
                ? a
                : Jn([
                    a,
                    o.encodeLocation ? o.encodeLocation(w.pathnameBase).pathname : w.pathnameBase,
                  ]),
          })
        ),
      s,
      n,
      r
    )
  return t && x
    ? y.createElement(
        Ul.Provider,
        {
          value: {
            location: Rs({ pathname: '/', search: '', hash: '', state: null, key: 'default' }, d),
            navigationType: Wn.Pop,
          },
        },
        x
      )
    : x
}
function _S() {
  let e = $S(),
    t = CS(e) ? e.status + ' ' + e.statusText : e instanceof Error ? e.message : JSON.stringify(e),
    n = e instanceof Error ? e.stack : null,
    o = { padding: '0.5rem', backgroundColor: 'rgba(200,200,200, 0.5)' }
  return y.createElement(
    y.Fragment,
    null,
    y.createElement('h2', null, 'Unexpected Application Error!'),
    y.createElement('h3', { style: { fontStyle: 'italic' } }, t),
    n ? y.createElement('pre', { style: o }, n) : null,
    null
  )
}
const OS = y.createElement(_S, null)
class AS extends y.Component {
  constructor(t) {
    ;(super(t),
      (this.state = { location: t.location, revalidation: t.revalidation, error: t.error }))
  }
  static getDerivedStateFromError(t) {
    return { error: t }
  }
  static getDerivedStateFromProps(t, n) {
    return n.location !== t.location || (n.revalidation !== 'idle' && t.revalidation === 'idle')
      ? { error: t.error, location: t.location, revalidation: t.revalidation }
      : {
          error: t.error !== void 0 ? t.error : n.error,
          location: n.location,
          revalidation: t.revalidation || n.revalidation,
        }
  }
  componentDidCatch(t, n) {
    console.error('React Router caught the following error during render', t, n)
  }
  render() {
    return this.state.error !== void 0
      ? y.createElement(
          zr.Provider,
          { value: this.props.routeContext },
          y.createElement(sy.Provider, { value: this.state.error, children: this.props.component })
        )
      : this.props.children
  }
}
function LS(e) {
  let { routeContext: t, match: n, children: r } = e,
    o = y.useContext(rd)
  return (
    o &&
      o.static &&
      o.staticContext &&
      (n.route.errorElement || n.route.ErrorBoundary) &&
      (o.staticContext._deepestRenderedBoundaryId = n.route.id),
    y.createElement(zr.Provider, { value: t }, r)
  )
}
function IS(e, t, n, r) {
  var o
  if (
    (t === void 0 && (t = []), n === void 0 && (n = null), r === void 0 && (r = null), e == null)
  ) {
    var s
    if (!n) return null
    if (n.errors) e = n.matches
    else if (
      (s = r) != null &&
      s.v7_partialHydration &&
      t.length === 0 &&
      !n.initialized &&
      n.matches.length > 0
    )
      e = n.matches
    else return null
  }
  let i = e,
    l = (o = n) == null ? void 0 : o.errors
  if (l != null) {
    let d = i.findIndex(f => f.route.id && (l == null ? void 0 : l[f.route.id]) !== void 0)
    ;(d >= 0 || Re(!1), (i = i.slice(0, Math.min(i.length, d + 1))))
  }
  let a = !1,
    u = -1
  if (n && r && r.v7_partialHydration)
    for (let d = 0; d < i.length; d++) {
      let f = i[d]
      if (((f.route.HydrateFallback || f.route.hydrateFallbackElement) && (u = d), f.route.id)) {
        let { loaderData: g, errors: p } = n,
          b = f.route.loader && g[f.route.id] === void 0 && (!p || p[f.route.id] === void 0)
        if (f.route.lazy || b) {
          ;((a = !0), u >= 0 ? (i = i.slice(0, u + 1)) : (i = [i[0]]))
          break
        }
      }
    }
  return i.reduceRight((d, f, g) => {
    let p,
      b = !1,
      x = null,
      w = null
    n &&
      ((p = l && f.route.id ? l[f.route.id] : void 0),
      (x = f.route.errorElement || OS),
      a &&
        (u < 0 && g === 0
          ? ((b = !0), (w = null))
          : u === g && ((b = !0), (w = f.route.hydrateFallbackElement || null))))
    let m = t.concat(i.slice(0, g + 1)),
      h = () => {
        let v
        return (
          p
            ? (v = x)
            : b
              ? (v = w)
              : f.route.Component
                ? (v = y.createElement(f.route.Component, null))
                : f.route.element
                  ? (v = f.route.element)
                  : (v = d),
          y.createElement(LS, {
            match: f,
            routeContext: { outlet: d, matches: m, isDataRoute: n != null },
            children: v,
          })
        )
      }
    return n && (f.route.ErrorBoundary || f.route.errorElement || g === 0)
      ? y.createElement(AS, {
          location: n.location,
          revalidation: n.revalidation,
          component: x,
          error: p,
          children: h(),
          routeContext: { outlet: null, matches: m, isDataRoute: !0 },
        })
      : h()
  }, null)
}
var ay = (function (e) {
    return (
      (e.UseBlocker = 'useBlocker'),
      (e.UseRevalidator = 'useRevalidator'),
      (e.UseNavigateStable = 'useNavigate'),
      e
    )
  })(ay || {}),
  pl = (function (e) {
    return (
      (e.UseBlocker = 'useBlocker'),
      (e.UseLoaderData = 'useLoaderData'),
      (e.UseActionData = 'useActionData'),
      (e.UseRouteError = 'useRouteError'),
      (e.UseNavigation = 'useNavigation'),
      (e.UseRouteLoaderData = 'useRouteLoaderData'),
      (e.UseMatches = 'useMatches'),
      (e.UseRevalidator = 'useRevalidator'),
      (e.UseNavigateStable = 'useNavigate'),
      (e.UseRouteId = 'useRouteId'),
      e
    )
  })(pl || {})
function DS(e) {
  let t = y.useContext(rd)
  return (t || Re(!1), t)
}
function zS(e) {
  let t = y.useContext(NS)
  return (t || Re(!1), t)
}
function FS(e) {
  let t = y.useContext(zr)
  return (t || Re(!1), t)
}
function uy(e) {
  let t = FS(),
    n = t.matches[t.matches.length - 1]
  return (n.route.id || Re(!1), n.route.id)
}
function $S() {
  var e
  let t = y.useContext(sy),
    n = zS(pl.UseRouteError),
    r = uy(pl.UseRouteError)
  return t !== void 0 ? t : (e = n.errors) == null ? void 0 : e[r]
}
function US() {
  let { router: e } = DS(ay.UseNavigateStable),
    t = uy(pl.UseNavigateStable),
    n = y.useRef(!1)
  return (
    iy(() => {
      n.current = !0
    }),
    y.useCallback(
      function (o, s) {
        ;(s === void 0 && (s = {}),
          n.current &&
            (typeof o == 'number' ? e.navigate(o) : e.navigate(o, Rs({ fromRouteId: t }, s))))
      },
      [e, t]
    )
  )
}
function cy(e, t) {
  ;(e == null || e.v7_startTransition, e == null || e.v7_relativeSplatPath)
}
function Ii(e) {
  Re(!1)
}
function dy(e) {
  let {
    basename: t = '/',
    children: n = null,
    location: r,
    navigationType: o = Wn.Pop,
    navigator: s,
    static: i = !1,
    future: l,
  } = e
  Bs() && Re(!1)
  let a = t.replace(/^\/*/, '/'),
    u = y.useMemo(
      () => ({ basename: a, navigator: s, static: i, future: Rs({ v7_relativeSplatPath: !1 }, l) }),
      [a, l, s, i]
    )
  typeof r == 'string' && (r = Ir(r))
  let { pathname: d = '/', search: f = '', hash: g = '', state: p = null, key: b = 'default' } = r,
    x = y.useMemo(() => {
      let w = nd(d, a)
      return w == null
        ? null
        : { location: { pathname: w, search: f, hash: g, state: p, key: b }, navigationType: o }
    }, [a, d, f, g, p, b, o])
  return x == null
    ? null
    : y.createElement(
        Dr.Provider,
        { value: u },
        y.createElement(Ul.Provider, { children: n, value: x })
      )
}
function BS(e) {
  let { children: t, location: n } = e
  return RS(Uu(t), n)
}
new Promise(() => {})
function Uu(e, t) {
  t === void 0 && (t = [])
  let n = []
  return (
    y.Children.forEach(e, (r, o) => {
      if (!y.isValidElement(r)) return
      let s = [...t, o]
      if (r.type === y.Fragment) {
        n.push.apply(n, Uu(r.props.children, s))
        return
      }
      ;(r.type !== Ii && Re(!1), !r.props.index || !r.props.children || Re(!1))
      let i = {
        id: r.props.id || s.join('-'),
        caseSensitive: r.props.caseSensitive,
        element: r.props.element,
        Component: r.props.Component,
        index: r.props.index,
        path: r.props.path,
        loader: r.props.loader,
        action: r.props.action,
        errorElement: r.props.errorElement,
        ErrorBoundary: r.props.ErrorBoundary,
        hasErrorBoundary: r.props.ErrorBoundary != null || r.props.errorElement != null,
        shouldRevalidate: r.props.shouldRevalidate,
        handle: r.props.handle,
        lazy: r.props.lazy,
      }
      ;(r.props.children && (i.children = Uu(r.props.children, s)), n.push(i))
    }),
    n
  )
}
/**
 * React Router DOM v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function Bu() {
  return (
    (Bu = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t]
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
          }
          return e
        }),
    Bu.apply(this, arguments)
  )
}
function HS(e, t) {
  if (e == null) return {}
  var n = {},
    r = Object.keys(e),
    o,
    s
  for (s = 0; s < r.length; s++) ((o = r[s]), !(t.indexOf(o) >= 0) && (n[o] = e[o]))
  return n
}
function WS(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}
function VS(e, t) {
  return e.button === 0 && (!t || t === '_self') && !WS(e)
}
const QS = [
    'onClick',
    'relative',
    'reloadDocument',
    'replace',
    'state',
    'target',
    'to',
    'preventScrollReset',
    'viewTransition',
  ],
  KS = '6'
try {
  window.__reactRouterVersion = KS
} catch {}
const YS = 'startTransition',
  hl = Np[YS]
function GS(e) {
  let { basename: t, children: n, future: r, window: o } = e,
    s = y.useRef()
  s.current == null && (s.current = tS({ window: o, v5Compat: !0 }))
  let i = s.current,
    [l, a] = y.useState({ action: i.action, location: i.location }),
    { v7_startTransition: u } = r || {},
    d = y.useCallback(
      f => {
        u && hl ? hl(() => a(f)) : a(f)
      },
      [a, u]
    )
  return (
    y.useLayoutEffect(() => i.listen(d), [i, d]),
    y.useEffect(() => cy(r), [r]),
    y.createElement(dy, {
      basename: t,
      children: n,
      location: l.location,
      navigationType: l.action,
      navigator: i,
      future: r,
    })
  )
}
function qS(e) {
  let { basename: t, children: n, future: r, window: o } = e,
    s = y.useRef()
  s.current == null && (s.current = nS({ window: o, v5Compat: !0 }))
  let i = s.current,
    [l, a] = y.useState({ action: i.action, location: i.location }),
    { v7_startTransition: u } = r || {},
    d = y.useCallback(
      f => {
        u && hl ? hl(() => a(f)) : a(f)
      },
      [a, u]
    )
  return (
    y.useLayoutEffect(() => i.listen(d), [i, d]),
    y.useEffect(() => cy(r), [r]),
    y.createElement(dy, {
      basename: t,
      children: n,
      location: l.location,
      navigationType: l.action,
      navigator: i,
      future: r,
    })
  )
}
const XS =
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u',
  ZS = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  JS = y.forwardRef(function (t, n) {
    let {
        onClick: r,
        relative: o,
        reloadDocument: s,
        replace: i,
        state: l,
        target: a,
        to: u,
        preventScrollReset: d,
        viewTransition: f,
      } = t,
      g = HS(t, QS),
      { basename: p } = y.useContext(Dr),
      b,
      x = !1
    if (typeof u == 'string' && ZS.test(u) && ((b = u), XS))
      try {
        let v = new URL(window.location.href),
          k = u.startsWith('//') ? new URL(v.protocol + u) : new URL(u),
          N = nd(k.pathname, p)
        k.origin === v.origin && N != null ? (u = N + k.search + k.hash) : (x = !0)
      } catch {}
    let w = PS(u, { relative: o }),
      m = ek(u, {
        replace: i,
        state: l,
        target: a,
        preventScrollReset: d,
        relative: o,
        viewTransition: f,
      })
    function h(v) {
      ;(r && r(v), v.defaultPrevented || m(v))
    }
    return y.createElement(
      'a',
      Bu({}, g, { href: b || w, onClick: x || s ? r : h, ref: n, target: a })
    )
  })
var qf
;(function (e) {
  ;((e.UseScrollRestoration = 'useScrollRestoration'),
    (e.UseSubmit = 'useSubmit'),
    (e.UseSubmitFetcher = 'useSubmitFetcher'),
    (e.UseFetcher = 'useFetcher'),
    (e.useViewTransitionState = 'useViewTransitionState'))
})(qf || (qf = {}))
var Xf
;(function (e) {
  ;((e.UseFetcher = 'useFetcher'),
    (e.UseFetchers = 'useFetchers'),
    (e.UseScrollRestoration = 'useScrollRestoration'))
})(Xf || (Xf = {}))
function ek(e, t) {
  let {
      target: n,
      replace: r,
      state: o,
      preventScrollReset: s,
      relative: i,
      viewTransition: l,
    } = t === void 0 ? {} : t,
    a = jS(),
    u = Hs(),
    d = ly(e, { relative: i })
  return y.useCallback(
    f => {
      if (VS(f, n)) {
        f.preventDefault()
        let g = r !== void 0 ? r : Ts(u) === Ts(d)
        a(e, { replace: g, state: o, preventScrollReset: s, relative: i, viewTransition: l })
      }
    },
    [u, a, d, r, o, n, e, s, i, l]
  )
}
const tk = {
  전체: [],
  수도권: [
    { value: 'site1', text: '자이 아파트 101동', dept: 'HQ' },
    { value: 'site2', text: '삼성 반도체 P3', dept: 'HQ' },
    { value: 'site3', text: '힐스테이트 센트럴', dept: 'HQ' },
    { value: 'site13', text: '서울 롯데타워 보수', dept: 'HQ' },
    { value: 'site14', text: '인천 공항 제2터미널', dept: 'HQ' },
    { value: 'site15', text: '광명 무역센터', dept: 'HQ' },
  ],
  충청권: [
    { value: 'site4', text: '대전 테크노밸리', dept: 'HQ' },
    { value: 'site5', text: '청주 산업단지', dept: 'HQ' },
    { value: 'site16', text: '천안 아산 배방지구', dept: 'HQ' },
    { value: 'site17', text: '세종 정부청사 별관', dept: 'HQ' },
  ],
  전라권: [
    { value: 'site6', text: '광주 첨단단지', dept: 'HQ' },
    { value: 'site7', text: '전주 혁신도시', dept: 'HQ' },
    { value: 'site18', text: '여수 국가산업단지', dept: 'HQ' },
  ],
  경상권: [
    { value: 'site8', text: '부산 해운대 엘시티', dept: 'HQ' },
    { value: 'site9', text: '울산 현대자동차 공장', dept: 'HQ' },
    { value: 'site10', text: '대구 수성구 범어동', dept: 'HQ' },
    { value: 'site19', text: '포항 제철소 2고로', dept: 'HQ' },
    { value: 'site20', text: '창원 국가산단', dept: 'HQ' },
  ],
  강원권: [
    { value: 'site11', text: '강릉 관광단지', dept: 'HQ' },
    { value: 'site12', text: '원주 혁신도시', dept: 'HQ' },
    { value: 'site21', text: '춘천 레고랜드', dept: 'HQ' },
  ],
}
const inopncHomeSiteStorageKey = 'inopnc_live_site_options',
  inopncHomeWorkerStorageKey = 'inopnc_live_worker_options'
function inopncReadLiveSites() {
  if (typeof window == 'undefined') return []
  try {
    const e = JSON.parse(window.localStorage.getItem(inopncHomeSiteStorageKey) || '[]')
    if (!Array.isArray(e)) return []
    const t = new Map()
    e.forEach(n => {
      if (!n || typeof n != 'object') return
      const r = typeof n.value == 'string' ? n.value.trim() : ''
      const o = typeof n.text == 'string' ? n.text.trim() : ''
      if (!r || !o || t.has(r)) return
      const s = typeof n.dept == 'string' ? n.dept.trim() : ''
      const i = typeof n.contractor == 'string' ? n.contractor.trim() : ''
      t.set(r, { value: r, text: o, dept: s, contractor: i || void 0 })
    })
    return Array.from(t.values())
  } catch {
    return []
  }
}
function inopncReadLiveWorkers() {
  if (typeof window == 'undefined') return []
  try {
    const e = JSON.parse(window.localStorage.getItem(inopncHomeWorkerStorageKey) || '[]')
    if (!Array.isArray(e)) return []
    const t = new Set()
    return e
      .map(n => (typeof n == 'string' ? n.trim() : ''))
      .filter(n => n && !t.has(n) && (t.add(n), !0))
  } catch {
    return []
  }
}
function fy() {
  return inopncReadLiveSites()
}
const py = inopncReadLiveWorkers(),
  hy = ['슬라브', '거더', '기둥', '기타'],
  my = ['균열', '면', '마감', '기타'],
  gy = ['지하', '지상', '지붕', '기타'],
  /* TODO: TEMP PATCH - edit source and rebuild home-v2 assets; direct hash edit is temporary */
  inopncRouteMap = {
    home: '/',
    output: '/output',
    worklog: '/worklog',
    site: '/site',
    doc: '/doc',
    request: '/request',
  },
  inopncAllowed = new Set(Object.values(inopncRouteMap)),
  inopncIconMap = {
    flash: './icons/quick-menu/flash.png',
    pay: './icons/quick-menu/pay.png',
    photo: './icons/quick-menu/photo.png',
    report: './icons/quick-menu/report.png',
    map: './icons/quick-menu/map.png',
    doc: './icons/quick-menu/doc.png',
    request: './icons/quick-menu/request.png',
  },
  inopncIconDefault = inopncIconMap.doc,
  inopncInlineFallback =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46"><rect width="46" height="46" rx="10" fill="%23E2E8F0"/><path d="M14 14h18v18H14z" fill="%2394A3B8"/></svg>',
  nk = [
    {
      id: 1,
      label: '출력현황',
      path: inopncRouteMap.output,
      icon: inopncIconMap.pay,
    },
    {
      id: 2,
      label: '작업일지',
      path: inopncRouteMap.worklog,
      badge: 3,
      badgeColor: 'green',
      icon: inopncIconMap.report,
    },
    {
      id: 3,
      label: '현장정보',
      path: inopncRouteMap.site,
      icon: inopncIconMap.map,
    },
    {
      id: 4,
      label: '문서함',
      path: inopncRouteMap.doc,
      icon: inopncIconMap.doc,
    },
    {
      id: 5,
      label: '본사요청',
      path: inopncRouteMap.request,
      icon: inopncIconMap.request,
    },
    {
      id: 6,
      label: '조치사항',
      path: inopncRouteMap.doc,
      badge: 0,
      badgeColor: 'red',
      icon: inopncIconMap.photo,
    },
  ]
var inopncIsAllowedPath = function (e) {
  return inopncAllowed.has(e)
}
var inopncNavigate = function (e) {
  if (!inopncIsAllowedPath(e)) {
    console.warn('[inopnc] blocked path', e)
    return
  }
  let t = !1
  try {
    window.parent &&
      window.parent !== window &&
      (window.parent.postMessage({ type: 'inopnc:navigate', path: e }, window.location.origin), (t = !0))
  } catch {}
  if (!t)
    try {
      window.top && window.top !== window
        ? window.top.location.assign(e)
        : window.location.assign(e)
    } catch {
      window.location.assign(e)
    }
}
var inopncValidateQuickMenuItem = function (e) {
  inopncIsAllowedPath(e.path) || console.warn('[inopnc] invalid path', e.path)
  e.icon || console.warn('[inopnc] missing icon', e.label)
  typeof e.icon == 'string' && /^https?:\/\//.test(e.icon) && console.warn('[inopnc] external icon blocked', e.icon)
}
nk.forEach(inopncValidateQuickMenuItem)
function yy() {
  const e = (py[0] || '').trim()
  return {
    selectedSite: '',
    siteSearch: '',
    dept: '',
    workDate: new Date().toISOString().slice(0, 10),
    manpowerList: [{ id: 1, worker: e, workHours: 1, isCustom: !e, locked: !1 }],
    workSets: [
      {
        id: Date.now(),
        member: '',
        process: '',
        type: '',
        location: { block: '', dong: '', floor: '' },
        isCustomMember: !1,
        isCustomProcess: !1,
        customMemberValue: '',
        customProcessValue: '',
        customTypeValue: '',
      },
    ],
    materials: [],
    photos: [],
    drawings: [],
    isSummaryCollapsed: !0,
  }
}
const toDur = 1200
;['success', 'error', 'info', 'warning', 'message'].forEach(e => {
  const t = we == null ? void 0 : we[e]
  typeof t == 'function' &&
    (we[e] = (...n) => {
      const r = n[n.length - 1]
      return r && typeof r == 'object' && !Array.isArray(r)
        ? ((n[n.length - 1] = { ...r, duration: Math.min(Number(r.duration) || toDur, toDur) }),
          t(...n))
        : t(...n, { duration: toDur })
    })
})
function vr(e) {
  we.error(`미입력: ${e}`, { className: 'inopnc-toast-required', duration: 2200 })
}
const vy = y.createContext(null),
  rk = 'inopnc_work_log',
  worklogBadgeKey = 'inopnc_worklog_badge_count',
  ok = 0,
  sk = 3.5,
  Ra = 'required-focus-flash'
function loadWorklogBadgeCount() {
  if (typeof window > 'u') return 0
  try {
    const e = window.localStorage.getItem(worklogBadgeKey)
    if (!e) return 0
    const t = Number(e)
    return Number.isFinite(t) && t >= 0 ? Math.min(99, Math.floor(t)) : 0
  } catch {
    return 0
  }
}
function saveWorklogBadgeCount(e) {
  if (typeof window > 'u') return
  try {
    window.localStorage.setItem(
      worklogBadgeKey,
      String(Math.max(0, Math.min(99, Math.floor(Number(e) || 0))))
    )
  } catch {}
}
function xy(e) {
  return Math.min(sk, Math.max(ok, e))
}
function ik(e) {
  e &&
    (e.classList.remove(Ra),
    e.offsetWidth,
    e.classList.add(Ra),
    window.setTimeout(() => {
      e.classList.remove(Ra)
    }, 1400))
}
function wi(e) {
  if (typeof window > 'u') return
  const t = document.getElementById(e)
  if (!t) return
  const r = t.closest('[data-required-card="true"]') ?? t
  r.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const o =
    (t.matches('input, select, textarea, button') ? t : null) ??
    t.querySelector('input, select, textarea, button')
  ;(o && 'focus' in o && window.setTimeout(() => o.focus({ preventScroll: !0 }), 180), ik(r))
}
function jo(e) {
  return !e || typeof e != 'object' || Array.isArray(e) ? null : e
}
function Me(e, t = '') {
  return typeof e == 'string' ? e : t
}
function Ms(e, t = 0) {
  const n = Number(e)
  return Number.isFinite(n) ? n : t
}
function lk(e, t) {
  if (!Array.isArray(e)) return t
  const n = e
    .map((r, o) => {
      const s = jo(r)
      return s
        ? {
            id: Ms(s.id, Date.now() + o),
            worker: Me(s.worker),
            workHours: xy(Ms(s.workHours, 0)),
            isCustom: !!s.isCustom,
            locked: !!s.locked,
          }
        : null
    })
    .filter(Boolean)
  return n.length > 0 ? n : t
}
function ak(e, t) {
  if (!Array.isArray(e)) return t
  const n = e
    .map((r, o) => {
      const s = jo(r)
      if (!s) return null
      const i = jo(s.location) || {}
      return {
        id: Ms(s.id, Date.now() + o),
        member: Me(s.member),
        process: Me(s.process),
        type: Me(s.type),
        location: { block: Me(i.block), dong: Me(i.dong), floor: Me(i.floor) },
        isCustomMember: !!s.isCustomMember,
        isCustomProcess: !!s.isCustomProcess,
        customMemberValue: Me(s.customMemberValue),
        customProcessValue: Me(s.customProcessValue),
        customTypeValue: Me(s.customTypeValue),
      }
    })
    .filter(Boolean)
  return n.length > 0 ? n : t
}
function uk(e, t) {
  return Array.isArray(e)
    ? e
        .map((n, r) => {
          const o = jo(n)
          return o
            ? {
                id: Ms(o.id, Date.now() + r),
                name: Me(o.name),
                qty: Math.max(0, Ms(o.qty, 0)),
                receiptFile: Me(o.receiptFile),
              }
            : null
        })
        .filter(Boolean)
    : t
}
function ck(e, t) {
  return Array.isArray(e)
    ? e
        .map(n => {
          const r = jo(n)
          if (!r) return null
          const o = Me(r.img)
          return o ? { img: o, desc: Me(r.desc), fileName: Me(r.fileName) } : null
        })
        .filter(Boolean)
    : t
}
function dk(e, t) {
  return Array.isArray(e) ? e.filter(n => typeof n == 'string' && n.length > 0) : t
}
function fk() {
  const e = yy()
  if (typeof window > 'u') return e
  try {
    const t = window.localStorage.getItem(rk)
    if (!t) return e
    const n = JSON.parse(t),
      r = jo(n)
    return r
      ? {
          ...e,
          selectedSite: Me(r.selectedSite, e.selectedSite),
          siteSearch: Me(r.siteSearch, e.siteSearch),
          dept: Me(r.dept, e.dept),
          workDate: Me(r.workDate, e.workDate),
          manpowerList: lk(r.manpowerList, e.manpowerList),
          workSets: ak(r.workSets, e.workSets),
          materials: uk(r.materials, e.materials),
          photos: ck(r.photos, e.photos),
          drawings: dk(r.drawings, e.drawings),
          isSummaryCollapsed:
            typeof r.isSummaryCollapsed == 'boolean' ? r.isSummaryCollapsed : e.isSummaryCollapsed,
        }
      : e
  } catch {
    return e
  }
}
function pk({ children: e }) {
  const [t, n] = y.useState(fk),
    [r, o] = y.useState(!1),
    [Je, setJe] = y.useState(loadWorklogBadgeCount),
    A0 = y.useCallback(() => {
      setJe(m => {
        const h = Math.min(99, m + 1)
        return (saveWorklogBadgeCount(h), h)
      })
    }, []),
    s = y.useCallback((m, h, v) => {
      n(k => ({ ...k, selectedSite: m, siteSearch: h, dept: `${h}팀` }))
    }, []),
    i = y.useCallback(() => {
      n(m => ({
        ...m,
        manpowerList: [
          ...m.manpowerList,
          { id: Date.now(), worker: '', workHours: 1, isCustom: !1, locked: !1 },
        ],
      }))
    }, []),
    l = y.useCallback(m => {
      n(h => ({ ...h, manpowerList: h.manpowerList.filter(v => v.id !== m) }))
    }, []),
    a = y.useCallback((m, h) => {
      n(v => ({
        ...v,
        manpowerList: v.manpowerList.map(k =>
          k.id === m ? { ...k, worker: h, isCustom: h === 'CUSTOM' } : k
        ),
      }))
    }, []),
    u = y.useCallback((m, h) => {
      n(v => ({
        ...v,
        manpowerList: v.manpowerList.map(k =>
          k.id === m ? { ...k, workHours: xy(k.workHours + h) } : k
        ),
      }))
    }, []),
    d = y.useCallback(() => {
      n(m => ({
        ...m,
        workSets: [
          ...m.workSets,
          {
            id: Date.now(),
            member: '',
            process: '',
            type: '',
            location: { block: '', dong: '', floor: '' },
            isCustomMember: !1,
            isCustomProcess: !1,
            customMemberValue: '',
            customProcessValue: '',
            customTypeValue: '',
          },
        ],
      }))
    }, []),
    f = y.useCallback(m => {
      n(h => ({ ...h, workSets: h.workSets.filter(v => v.id !== m) }))
    }, []),
    g = y.useCallback((m, h, v) => {
      n(k => ({ ...k, workSets: k.workSets.map(N => (N.id === m ? { ...N, [h]: v } : N)) }))
    }, []),
    p = y.useCallback((m, h, v) => {
      !m ||
        h <= 0 ||
        (n(k => ({
          ...k,
          materials: [...k.materials, { id: Date.now(), name: m, qty: h, receiptFile: v }],
        })),
        we.success('자재 추가'))
    }, []),
    b = y.useCallback(m => {
      n(h => ({ ...h, materials: h.materials.filter(v => v.id !== m) }))
    }, []),
    x = y.useCallback(() => {
      const { selectedSite: m, workDate: h, manpowerList: v, workSets: k } = t
      if (!m) {
        ;(vr('현장'), wi('required-site-input'))
        return
      }
      if (!h) {
        ;(vr('작업일자'), wi('required-work-date'))
        return
      }
      const N = v.find(P => !P.worker)
      if (N) {
        ;(vr('작업자'), wi(`manpower-worker-${N.id}`))
        return
      }
      const j = k.find(P => {
        const S = P.member === '기타' ? (P.customMemberValue || '').trim() : (P.member || '').trim(),
          M = P.process === '기타' ? (P.customProcessValue || '').trim() : (P.process || '').trim()
        return !(S && M)
      })
      if (j) {
        const S = j.member === '기타' ? (j.customMemberValue || '').trim() : (j.member || '').trim(),
          M = j.process === '기타' ? (j.customProcessValue || '').trim() : (j.process || '').trim(),
          E = []
        ;(!S && !M && E.push('작업내용'), !S && E.push('부재명'), !M && E.push('작업공정'), vr(E.join(', ')), wi(`workset-${j.id}`))
        return
      }
      try {
        ;(localStorage.setItem('inopnc_work_log', JSON.stringify(t)), we.success('저장 완료'), A0())
      } catch {
        we.error('저장 실패')
      }
    }, [t, A0]),
    w = y.useCallback(() => {
      ;(n(yy()), localStorage.removeItem('inopnc_work_log'), we.success('초기화 완료'))
    }, [])
  return c.jsx(vy.Provider, {
    value: {
      state: t,
      setState: n,
      selectSite: s,
      addManpower: i,
      removeManpower: l,
      updateManpowerWorker: a,
      updateManpowerHours: u,
      addWorkSet: d,
      removeWorkSet: f,
      updateWorkSet: g,
      addMaterial: p,
      removeMaterial: b,
      handleSave: x,
      handleReset: w,
      chatMode: r,
      setChatMode: o,
      worklogBadge: Je,
      incrementWorklogBadge: A0,
    },
    children: e,
  })
}
function sn() {
  const e = y.useContext(vy)
  if (!e) throw new Error('useAppContext must be used within AppProvider')
  return e
}
function hk() {
  const { setChatMode: e } = sn()
  return c.jsxs('button', {
    onClick: () => e(!0),
    className:
      'flex w-full items-center justify-between rounded-2xl bg-header-navy px-5 py-4 text-header-navy-foreground transition-transform active:scale-[0.98]',
    children: [
      c.jsxs('span', {
        className: 'text-[1rem] font-bold tracking-tight',
        children: [
          c.jsx('span', { className: 'font-extrabold text-primary', children: '작업일지 작성' }),
          '을 도와드릴까요?',
        ],
      }),
      c.jsx('span', {
        className: 'flex h-8 w-8 items-center justify-center rounded-full bg-white/20',
        children: c.jsx(e1, { className: 'h-5 w-5' }),
      }),
    ],
  })
}
function mk() {
  const { worklogBadge: t0 } = sn()
  return c.jsx('section', {
    className: 'pt-1 pb-3',
    children: c.jsx('div', {
      className: 'grid grid-cols-6 gap-0.5',
      children: nk.map(e =>
        c.jsxs(
          'button',
          {
            onClick: () => {
              const n = e.path || '/'
              inopncNavigate(n)
            },
            className:
              'flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-transform hover:-translate-y-0.5 active:scale-95',
            children: [
              c.jsxs('div', {
                className: 'relative inline-block',
                style: { marginTop: '-2px' },
                children: [
                  (e.id === 2 ? t0 : e.badge) !== void 0 &&
                    (e.id === 2 ? t0 : e.badge) > 0 &&
                    c.jsx('span', {
                      className: `absolute right-0 top-0 z-10 flex h-[18px] min-w-[18px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background px-1 text-[10px] font-black text-white shadow-md ${e.badgeColor === 'green' ? 'bg-badge-green' : e.badgeColor === 'red' ? 'bg-badge-red' : 'bg-badge-purple'}`,
                      style: {
                        animation:
                          e.badgeColor === 'green'
                            ? 'badge-pulse-green 2s ease-in-out infinite'
                            : e.badgeColor === 'red'
                              ? 'badge-pulse-red 2s ease-in-out infinite'
                              : 'badge-pulse-purple 2s ease-in-out infinite',
                      },
                      children: e.id === 2 ? t0 : e.badge,
                    }),
                  c.jsx('img', {
                    src: e.icon || inopncIconDefault,
                    onError: t => {
                      const n = t.currentTarget
                      n.onerror = null
                      if (n.src !== inopncIconDefault) {
                        n.src = inopncIconDefault
                        return
                      }
                      n.src = inopncInlineFallback
                    },
                    alt: e.label,
                    className: 'h-[46px] w-[46px] object-contain drop-shadow-sm',
                  }),
                ],
              }),
              c.jsx('span', {
                className:
                  'whitespace-nowrap text-[13px] font-bold leading-tight tracking-tight text-foreground',
                children: e.label,
              }),
            ],
          },
          e.id
        )
      ),
    }),
  })
}
const gk = {
  site1: 'GS건설',
  site2: '삼성물산',
  site3: '현대건설',
  site4: '대우건설',
  site8: '한화건설',
  site9: '현대건설',
  site13: '롯데건설',
  site19: '포스코이앤씨',
  site20: 'SK에코플랜트',
}
function yk(e, t) {
  const n = `${e} ${t}`.toLowerCase()
  return n.includes('힐스테이트') || n.includes('현대')
    ? '현대건설'
    : n.includes('자이') || n.includes('gs')
      ? 'GS건설'
      : n.includes('삼성')
        ? '삼성물산'
        : n.includes('롯데')
          ? '롯데건설'
          : n.includes('포스코') || n.includes('포항')
            ? '포스코이앤씨'
            : n.includes('대우') || n.includes('푸르지오')
              ? '대우건설'
              : n.includes('dl') || n.includes('e편한')
                ? 'DL이앤씨'
                : n.includes('sk')
                  ? 'SK에코플랜트'
                  : n.includes('한화')
                    ? '한화건설'
                    : '원청사'
}
function vk(e) {
  const t = e.toLowerCase()
  return t.includes('현대')
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : t.includes('gs')
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : t.includes('삼성')
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : t.includes('롯데')
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : t.includes('포스코')
            ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
            : t.includes('대우')
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : t.includes('dl')
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : t.includes('sk')
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : t.includes('한화')
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
}
function xk() {
  const { state: e, setState: t, selectSite: n } = sn(),
    [r, o] = y.useState(!1),
    [s, i] = y.useState(e.siteSearch),
    l = y.useRef(null),
    a = fy(),
    u = s.trim() ? a.filter(x => x.text.toLowerCase().includes(s.toLowerCase())) : a,
    d = a.find(x => x.value === e.selectedSite),
    f =
      (d == null ? void 0 : d.contractor) ||
      (d ? gk[d.value] : void 0) ||
      yk((d == null ? void 0 : d.text) || e.siteSearch, (d == null ? void 0 : d.dept) || e.dept),
    g = vk(f),
    p = x => {
      ;(n(x.value, x.text, x.dept), i(x.text), o(!1))
    },
    b = () => {
      ;(i(''), t(x => ({ ...x, selectedSite: '', siteSearch: '' })))
    }
  return c.jsxs('div', {
    'data-required-card': 'true',
    className: 'rounded-2xl bg-card p-6 shadow-sm',
    children: [
      c.jsxs('div', {
        className: 'mb-3 flex items-center justify-between',
        children: [
          c.jsxs('div', {
            className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
            children: [
              c.jsx(c1, { className: 'h-5 w-5' }),
              '작업현장 ',
              c.jsx('span', { className: 'text-destructive', children: '*' }),
            ],
          }),
          c.jsx('span', {
            className:
              'flex h-8 items-center rounded-xl bg-destructive/10 px-3.5 text-[13px] font-bold text-destructive',
            children: '* 필수 입력',
          }),
        ],
      }),
      c.jsxs('div', {
        className: 'relative mb-3',
        children: [
          c.jsx('input', {
            id: 'required-site-input',
            ref: l,
            type: 'text',
            value: s,
            placeholder: '현장 선택 또는 검색',
            onChange: x => {
              ;(i(x.target.value), o(!0))
            },
            onFocus: () => o(!0),
            className:
              'h-[54px] w-full rounded-xl border border-border bg-bg-input px-4 text-[17px] font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-sky-focus focus:ring-2 focus:ring-sky-focus/20',
          }),
          s &&
            c.jsx('button', {
              type: 'button',
              onClick: b,
              className:
                'absolute right-10 top-1/2 -translate-y-1/2 rounded-full bg-muted p-0.5 text-muted-foreground transition hover:bg-accent',
              children: c.jsx(Dt, { className: 'h-4 w-4' }),
            }),
          c.jsx('button', {
            type: 'button',
            onClick: () => o(!r),
            className: 'absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground',
            children: c.jsx(Bc, { className: 'h-5 w-5' }),
          }),
          r &&
            c.jsx('ul', {
              className:
                'absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-xl',
              style: { animation: 'dropdownSlide 0.2s ease' },
              children:
                u.length > 0
                  ? u.map(x =>
                      c.jsx(
                        'li',
                        {
                          onMouseDown: () => p(x),
                          className: `cursor-pointer border-b border-border/50 px-4 py-3.5 text-[15px] font-medium last:border-0 hover:bg-accent ${e.selectedSite === x.value ? 'bg-primary/10 text-primary' : 'text-foreground'}`,
                          children: c.jsxs('div', {
                            className: 'flex items-center justify-between gap-2',
                            children: [
                              c.jsx('span', { className: 'truncate', children: x.text }),
                              c.jsx('span', {
                                className:
                                  'shrink-0 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground',
                                children: x.dept,
                              }),
                            ],
                          }),
                        },
                        x.value
                      )
                    )
                  : c.jsx('li', {
                      className: 'px-4 py-3 text-center text-muted-foreground',
                      children: '검색 결과가 없습니다',
                    }),
            }),
        ],
      }),
      c.jsxs('div', {
        className: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
        children: [
          c.jsxs('div', {
            children: [
              c.jsxs('label', {
                className:
                  'mb-2 flex items-center justify-between gap-2 text-[15px] font-bold text-text-sub',
                children: [
                  c.jsx('span', { className: 'min-w-0 truncate', children: '소속' }),
                  c.jsx('span', {
                    className: `inline-flex h-8 max-w-[132px] shrink-0 items-center truncate whitespace-nowrap rounded-xl border px-3.5 text-[13px] font-bold ${g}`,
                    children: f,
                  }),
                ],
              }),
              c.jsx('input', {
                type: 'text',
                readOnly: !0,
                value: e.dept || '자동연동',
                className:
                  'h-[54px] w-full cursor-not-allowed truncate rounded-xl border border-border bg-muted px-4 text-[17px] font-medium text-muted-foreground',
              }),
            ],
          }),
          c.jsxs('div', {
            children: [
              c.jsx('label', {
                className: 'mb-2 block text-[15px] font-bold text-text-sub',
                children: '작업일자',
              }),
              c.jsx('input', {
                id: 'required-work-date',
                type: 'date',
                value: e.workDate,
                onChange: x => t(w => ({ ...w, workDate: x.target.value })),
                className:
                  'h-[54px] w-full cursor-pointer rounded-xl border border-border bg-bg-input px-3 text-[15px] font-medium outline-none transition-all focus:border-sky-focus focus:ring-2 focus:ring-sky-focus/20 sm:px-4 sm:text-[17px]',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
const Zf = 0,
  wk = 3.5
function bk() {
  const {
    state: e,
    addManpower: t,
    removeManpower: n,
    updateManpowerWorker: r,
    updateManpowerHours: o,
  } = sn()
  return c.jsxs('div', {
    id: 'required-worker-card',
    'data-required-card': 'true',
    className: 'rounded-2xl bg-card p-6 shadow-sm',
    children: [
      c.jsxs('div', {
        className: 'mb-3 flex items-center justify-between',
        children: [
          c.jsxs('div', {
            className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
            children: [
              c.jsx(P1, { className: 'h-5 w-5' }),
              '투입 인원(공수) ',
              c.jsx('span', { className: 'text-destructive', children: '*' }),
            ],
          }),
          c.jsxs('button', {
            onClick: t,
            className:
              'flex h-8 items-center gap-1 rounded-xl bg-primary-bg px-3.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors',
            children: [c.jsx('span', { className: 'text-lg font-black', children: '+' }), ' 추가'],
          }),
        ],
      }),
      c.jsx('div', {
        className: 'flex flex-col gap-2.5',
        children: e.manpowerList.map(s => {
          const i = s.workHours > Zf,
            l = s.workHours < wk,
            a = s.workHours <= Zf
          return c.jsxs(
            'div',
            {
              className:
                'grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_auto] items-center gap-2 rounded-2xl bg-bg-input p-3 sm:grid-cols-[1.2fr_1fr_auto] sm:gap-2.5 sm:p-3.5',
              children: [
                s.locked
                  ? c.jsx('div', {
                      className: 'truncate px-1 text-[17px] font-bold text-foreground',
                      children: s.worker,
                    })
                  : c.jsxs('select', {
                      id: `manpower-worker-${s.id}`,
                      value: s.worker,
                      onChange: u => r(s.id, u.target.value),
                      className:
                        'h-[50px] w-full cursor-pointer appearance-none rounded-xl border border-border bg-card px-4 text-[15px] font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20',
                      style: {
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 14px center',
                        backgroundSize: '16px',
                      },
                      children: [
                        c.jsx('option', { value: '', children: '작업자' }),
                        py.map(u => c.jsx('option', { value: u, children: u }, u)),
                        c.jsx('option', { value: '__custom__', children: '직접입력' }),
                      ],
                    }),
                c.jsxs('div', {
                  className:
                    'flex h-[48px] overflow-hidden rounded-xl border border-border bg-card',
                  children: [
                    c.jsx('button', {
                      onClick: () => o(s.id, -0.5),
                      disabled: !i,
                      className:
                        'flex flex-1 items-center justify-center text-xl text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
                      children: '-',
                    }),
                    c.jsx('span', {
                      className: `flex flex-1 items-center justify-center border-x border-border text-base font-bold ${a ? 'text-destructive' : ''}`,
                      children: a ? '휴무' : s.workHours.toFixed(1),
                    }),
                    c.jsx('button', {
                      onClick: () => o(s.id, 0.5),
                      disabled: !l,
                      className:
                        'flex flex-1 items-center justify-center text-xl text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
                      children: '+',
                    }),
                  ],
                }),
                !s.locked &&
                  c.jsx('button', {
                    onClick: () => n(s.id),
                    className:
                      'flex h-[48px] w-10 items-center justify-center rounded-xl text-destructive hover:bg-destructive/10',
                    children: c.jsx(Dt, { className: 'h-5 w-5' }),
                  }),
              ],
            },
            s.id
          )
        }),
      }),
    ],
  })
}
function Ma({ chips: e, selected: t, onSelect: n, customValue: r, onCustomChange: o, customPlaceholder: s }) {
  return c.jsxs('div', {
    children: [
      c.jsx('div', {
        className: 'grid grid-cols-4 gap-2',
        children: e.map(i =>
          c.jsx(
            'button',
            {
              onClick: () => n(i),
              className: `flex h-12 items-center justify-center rounded-xl border text-[15px] font-bold transition-all ${t === i ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary-bg'}`,
              children: i,
            },
            i
          )
        ),
      }),
      t === '기타' &&
        o &&
        c.jsx('input', {
          className:
            'mt-2 h-[54px] w-full rounded-xl border border-border bg-bg-input px-4 text-[15px] font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
          placeholder: s || '직접 입력',
          value: r || '',
          onChange: i => o(i.target.value),
        }),
    ],
  })
}
function Sk() {
  const { state: e, addWorkSet: t, removeWorkSet: n, updateWorkSet: r } = sn()
  return c.jsxs('div', {
    id: 'required-work-content-card',
    'data-required-card': 'true',
    className: 'rounded-2xl bg-card p-6 shadow-sm',
    children: [
      c.jsxs('div', {
        className: 'mb-3 flex items-center justify-between',
        children: [
          c.jsxs('div', {
            className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
            children: [
              c.jsx(i1, { className: 'h-5 w-5' }),
              '작업내용 ',
              c.jsx('span', { className: 'text-destructive', children: '*' }),
            ],
          }),
          c.jsxs('button', {
            onClick: t,
            className:
              'flex h-8 items-center gap-1 rounded-xl bg-primary-bg px-3.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors',
            children: [c.jsx('span', { className: 'text-lg font-black', children: '+' }), ' 추가'],
          }),
        ],
      }),
      c.jsx('div', {
        className: 'flex flex-col gap-4',
        children: e.workSets.map((o, s) =>
          c.jsxs(
            'div',
            {
              id: `workset-${o.id}`,
              className: 'rounded-xl border border-border p-4',
              children: [
                e.workSets.length > 1 &&
                  c.jsxs('div', {
                    className: 'mb-3 flex items-center justify-between',
                    children: [
                      c.jsxs('span', {
                        className: 'text-sm font-bold text-muted-foreground',
                        children: ['작업 ', s + 1],
                      }),
                      c.jsx('button', {
                        onClick: () => n(o.id),
                        className: 'text-destructive hover:text-destructive/80',
                        children: c.jsx(Dt, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsxs('label', {
                      className: 'mb-2 block text-[15px] font-bold text-text-sub',
                      children: [
                        '부재명 ',
                        c.jsx('span', { className: 'text-destructive', children: '*' }),
                      ],
                    }),
                    c.jsx(Ma, {
                      chips: hy,
                      selected: o.member,
                      onSelect: i => r(o.id, 'member', i),
                      customValue: o.customMemberValue,
                      onCustomChange: i => r(o.id, 'customMemberValue', i),
                      customPlaceholder: '부재명을 직접 입력하세요',
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsxs('label', {
                      className: 'mb-2 block text-[15px] font-bold text-text-sub',
                      children: [
                        '작업공정 ',
                        c.jsx('span', { className: 'text-destructive', children: '*' }),
                      ],
                    }),
                    c.jsx(Ma, {
                      chips: my,
                      selected: o.process,
                      onSelect: i => r(o.id, 'process', i),
                      customValue: o.customProcessValue,
                      onCustomChange: i => r(o.id, 'customProcessValue', i),
                      customPlaceholder: '작업공정을 직접 입력하세요',
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsx('label', {
                      className: 'mb-2 block text-[15px] font-bold text-text-sub',
                      children: '작업유형',
                    }),
                    c.jsx(Ma, {
                      chips: gy,
                      selected: o.type,
                      onSelect: i => r(o.id, 'type', o.type === i ? '' : i),
                      customValue: o.customTypeValue,
                      onCustomChange: i => r(o.id, 'customTypeValue', i),
                      customPlaceholder: '작업유형을 직접 입력하세요',
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'grid grid-cols-3 gap-2',
                  children: [
                    c.jsxs('div', {
                      children: [
                        c.jsx('label', {
                          className: 'mb-1 block text-xs font-bold text-muted-foreground',
                          children: '블록',
                        }),
                        c.jsx('input', {
                          type: 'text',
                          placeholder: '블록',
                          value: o.location.block,
                          onChange: i => {
                            const l = { ...o.location, block: i.target.value }
                            r(o.id, 'location', l)
                          },
                          className:
                            'h-10 w-full rounded-lg border border-border bg-bg-input px-3 text-sm outline-none focus:border-sky-focus focus:ring-1 focus:ring-sky-focus/20',
                        }),
                      ],
                    }),
                    c.jsxs('div', {
                      children: [
                        c.jsx('label', {
                          className: 'mb-1 block text-xs font-bold text-muted-foreground',
                          children: '동',
                        }),
                        c.jsx('input', {
                          type: 'text',
                          placeholder: '동',
                          value: o.location.dong,
                          onChange: i => {
                            const l = { ...o.location, dong: i.target.value }
                            r(o.id, 'location', l)
                          },
                          className:
                            'h-10 w-full rounded-lg border border-border bg-bg-input px-3 text-sm outline-none focus:border-sky-focus focus:ring-1 focus:ring-sky-focus/20',
                        }),
                      ],
                    }),
                    c.jsxs('div', {
                      children: [
                        c.jsx('label', {
                          className: 'mb-1 block text-xs font-bold text-muted-foreground',
                          children: '층',
                        }),
                        c.jsx('input', {
                          type: 'text',
                          placeholder: '층',
                          value: o.location.floor,
                          onChange: i => {
                            const l = { ...o.location, floor: i.target.value }
                            r(o.id, 'location', l)
                          },
                          className:
                            'h-10 w-full rounded-lg border border-border bg-bg-input px-3 text-sm outline-none focus:border-sky-focus focus:ring-1 focus:ring-sky-focus/20',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            },
            o.id
          )
        ),
      }),
    ],
  })
}
const _a = ['NPC-1000', 'NPC-3000Q']
function kk() {
  const { state: e, setState: t, addMaterial: n, removeMaterial: r } = sn(),
    [o, s] = y.useState(_a[0]),
    [i, l] = y.useState(''),
    [a, u] = y.useState(!1),
    [d, f] = y.useState(''),
    [g, p] = y.useState([]),
    [b, x] = y.useState(''),
    w = y.useRef(null),
    m = y.useMemo(() => [..._a, ...g], [g]),
    h = T => {
      _a.includes(T) || p(I => (I.includes(T) ? I : [...I, T]))
    },
    v = () => {
      const T = d.trim()
      if (!T) {
        vr('자재명')
        return
      }
      ;(h(T), s(T), u(!1), f(''))
    },
    k = () => {
      const T = (a ? d : o).trim(),
        I = parseFloat(i)
      if (!T) {
        vr('자재명')
        return
      }
      if (!(I > 0)) {
        vr('수량')
        return
      }
      ;(a && (h(T), s(T), u(!1), f('')), n(T, I, b || void 0), l(''), x(''))
    },
    N = T => {
      var D
      const I = (D = T.target.files) == null ? void 0 : D[0]
      I &&
        (e.materials.length > 0
          ? (t(Q => {
              if (Q.materials.length === 0) return Q
              const U = [...Q.materials],
                G = U.length - 1
              return ((U[G] = { ...U[G], receiptFile: I.name }), { ...Q, materials: U })
            }),
            x(''),
            we.success('최근 자재에 영수증 연결'))
          : (x(I.name), we.success('영수증 준비됨')),
        (T.target.value = ''))
    },
    j = () => {
      b && (x(''), we.success('영수증 선택 취소'))
    },
    P = T => {
      ;(t(I => ({
        ...I,
        materials: I.materials.map(D => (D.id === T ? { ...D, receiptFile: void 0 } : D)),
      })),
        we.success('영수증 삭제'))
    }
  return c.jsxs('div', {
    id: 'material-card',
    className: 'scroll-mt-24 rounded-2xl bg-card p-6 shadow-sm',
    children: [
      c.jsx('div', {
        className: 'mb-3 flex items-center justify-between',
        children: c.jsxs('div', {
          className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
          children: [
            c.jsx(h1, { className: 'h-5 w-5' }),
            '자재 사용 내역',
            c.jsx('span', {
              className: 'ml-2 text-sm font-medium text-muted-foreground',
              children: '| 자재 있을 시 입력',
            }),
          ],
        }),
      }),
      c.jsxs('div', {
        className: 'mb-3 grid grid-cols-[1.8fr_1fr_auto] items-center gap-2.5',
        children: [
          c.jsxs('select', {
            value: a ? 'custom' : o,
            onChange: T => {
              T.target.value === 'custom' ? u(!0) : (u(!1), s(T.target.value))
            },
            className:
              'h-12 w-full cursor-pointer appearance-none rounded-xl border border-border bg-bg-input px-4 text-[17px] font-medium outline-none transition-all focus:border-sky-focus focus:ring-2 focus:ring-sky-focus/20',
            style: {
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              backgroundSize: '16px',
            },
            children: [
              m.map(T => c.jsx('option', { value: T, children: T }, T)),
              c.jsx('option', { value: 'custom', children: '직접입력' }),
            ],
          }),
          c.jsxs('div', {
            className: 'flex h-12 items-center rounded-xl border border-border bg-bg-input px-3',
            children: [
              c.jsx('input', {
                type: 'number',
                min: '0',
                value: i,
                onChange: T => l(T.target.value),
                placeholder: '0',
                className: 'w-full flex-1 bg-transparent text-right font-medium outline-none',
              }),
              c.jsx('span', {
                className: 'ml-1 text-[15px] font-medium text-muted-foreground',
                children: '말',
              }),
            ],
          }),
          c.jsx('button', {
            onClick: k,
            className:
              'flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-[15px] font-black text-primary hover:bg-primary/20',
            children: '저장',
          }),
        ],
      }),
      a &&
        c.jsxs('div', {
          className: 'mb-3 flex items-center gap-2',
          children: [
            c.jsx('input', {
              type: 'text',
              value: d,
              onChange: T => f(T.target.value),
              placeholder: '자재명 직접 입력',
              className:
                'h-12 flex-1 rounded-xl border border-border bg-bg-input px-4 outline-none focus:border-sky-focus focus:ring-2 focus:ring-sky-focus/20',
            }),
            c.jsx('button', {
              onClick: v,
              className:
                'h-12 min-w-[68px] shrink-0 whitespace-nowrap rounded-xl bg-header-navy px-4 text-sm font-bold text-header-navy-foreground',
              children: '확인',
            }),
          ],
        }),
      c.jsxs('div', {
        className: 'mb-3',
        children: [
          c.jsx('input', {
            ref: w,
            type: 'file',
            accept: 'image/*,.pdf',
            className: 'hidden',
            onChange: N,
          }),
          c.jsxs('button', {
            onClick: () => {
              var T
              return (T = w.current) == null ? void 0 : T.click()
            },
            className:
              'flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 text-[15px] font-extrabold text-sky-700 transition-colors hover:bg-sky-100 active:scale-[0.98]',
            children: [c.jsx(o1, { className: 'h-5 w-5' }), '영수증 업로드'],
          }),
          b &&
            c.jsxs('div', {
              className: 'mt-1 flex items-center gap-2 px-1 text-xs font-medium text-sky-700',
              children: [
                c.jsxs('span', { className: 'min-w-0 flex-1 truncate', children: ['선택됨: ', b] }),
                c.jsx('button', {
                  type: 'button',
                  onClick: j,
                  className:
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-destructive hover:bg-destructive/10',
                  children: '삭제',
                }),
              ],
            }),
        ],
      }),
      e.materials.length > 0 &&
        c.jsx('div', {
          className: 'flex flex-col gap-2',
          children: e.materials.map(T =>
            c.jsxs(
              'div',
              {
                className: 'flex items-center justify-between rounded-xl bg-bg-input px-4 py-3',
                children: [
                  c.jsxs('div', {
                    className: 'min-w-0',
                    children: [
                      c.jsx('span', { className: 'font-bold', children: T.name }),
                      c.jsxs('span', {
                        className: 'ml-2 text-muted-foreground',
                        children: [T.qty, '말'],
                      }),
                      T.receiptFile &&
                        c.jsxs('div', {
                          className: 'mt-0.5 flex items-center gap-2',
                          children: [
                            c.jsxs('span', {
                              className: 'max-w-[180px] truncate text-xs font-medium text-sky-700',
                              children: ['영수증: ', T.receiptFile],
                            }),
                            c.jsx('button', {
                              type: 'button',
                              onClick: () => P(T.id),
                              className:
                                'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-destructive hover:bg-destructive/10',
                              children: '삭제',
                            }),
                          ],
                        }),
                    ],
                  }),
                  c.jsx('button', {
                    onClick: () => r(T.id),
                    className: 'text-destructive',
                    children: c.jsx(Dt, { className: 'h-4 w-4' }),
                  }),
                ],
              },
              T.id
            )
          ),
        }),
    ],
  })
}
const Kt = {
    blue: 'rgb(49, 163, 250)',
    red: 'rgb(239, 68, 68)',
    gray: 'rgb(100, 116, 139)',
    green: 'rgb(34, 197, 94)',
    orange: 'rgb(249, 115, 22)',
    purple: 'rgb(168, 85, 247)',
    yellow: 'rgb(234, 179, 8)',
    pink: 'rgb(236, 72, 153)',
    cyan: 'rgb(6, 182, 212)',
    lime: 'rgb(132, 204, 22)',
    indigo: 'rgb(99, 102, 241)',
    teal: 'rgb(20, 184, 166)',
  },
  Oa = {
    blue: 'rgba(49, 163, 250, 0.3)',
    red: 'rgba(239, 68, 68, 0.3)',
    gray: 'rgba(100, 116, 139, 0.3)',
    green: 'rgba(34, 197, 94, 0.3)',
    orange: 'rgba(249, 115, 22, 0.3)',
    purple: 'rgba(168, 85, 247, 0.3)',
    yellow: 'rgba(234, 179, 8, 0.3)',
    pink: 'rgba(236, 72, 153, 0.3)',
    cyan: 'rgba(6, 182, 212, 0.3)',
    lime: 'rgba(132, 204, 22, 0.3)',
    indigo: 'rgba(99, 102, 241, 0.3)',
    teal: 'rgba(20, 184, 166, 0.3)',
  },
  Ck = Object.keys(Kt),
  Ek = ['circle', 'square', 'triangle', 'star', 'horizontal', 'diagonal'],
  fr = { hand: 20, rect: 25, polygon: 25, lasso: 15, brush: 3, stamp: 20, text: 25, eraser: 20 },
  wy = 'inopnc_site_drawings_v2',
  Aa = (e, t, n) => Math.max(t, Math.min(n, e)),
  to = (e, t) => Math.hypot(e.x - t.x, e.y - t.y)
function Jf(e) {
  return new Promise((t, n) => {
    const r = new FileReader()
    ;((r.onload = () => t(r.result)), (r.onerror = () => n(r.error)), r.readAsDataURL(e))
  })
}
function ep(e) {
  return new Promise((t, n) => {
    const r = new Image()
    ;((r.onload = () => t(r)), (r.onerror = () => n(new Error('image load failed'))), (r.src = e))
  })
}
function od(e) {
  if (e.type === 'rect') return { x: e.x, y: e.y, w: e.w, h: e.h }
  if (e.type === 'brush' || e.type === 'polygon') {
    const r = e.points.map(u => u.x),
      o = e.points.map(u => u.y),
      s = Math.min(...r),
      i = Math.min(...o),
      l = Math.max(...r) - s,
      a = Math.max(...o) - i
    return { x: s, y: i, w: l, h: a }
  }
  if (e.type === 'stamp') return { x: e.x - e.size, y: e.y - e.size, w: e.size * 2, h: e.size * 2 }
  const t = Math.max(24, e.text.length * (e.size * 0.65)),
    n = Math.max(16, e.size + 6)
  return { x: e.x, y: e.y - n * 0.7, w: t, h: n }
}
const Nk = e => {
  const t = od(e)
  return { x: t.x + t.w / 2, y: t.y + t.h / 2 }
}
function Pk(e, t) {
  let n = !1
  for (let r = 0, o = t.length - 1; r < t.length; o = r++) {
    const s = t[r].x,
      i = t[r].y,
      l = t[o].x,
      a = t[o].y
    i > e.y != a > e.y && e.x < ((l - s) * (e.y - i)) / (a - i || 1e-6) + s && (n = !n)
  }
  return n
}
function polygonSegmentDistance(e, t, n) {
  const r = n.x - t.x,
    o = n.y - t.y
  if (r === 0 && o === 0) return to(e, t)
  const s = ((e.x - t.x) * r + (e.y - t.y) * o) / (r * r + o * o),
    i = { x: t.x + r * Aa(s, 0, 1), y: t.y + o * Aa(s, 0, 1) }
  return to(e, i)
}
function polygonHitTest(e, t, n) {
  if (!e.points.length) return !1
  if (Pk(t, e.points)) return !0
  for (let r = 0; r < e.points.length; r += 1) {
    const o = e.points[r],
      s = e.points[(r + 1) % e.points.length]
    if (to(o, t) <= n || polygonSegmentDistance(t, o, s) <= n) return !0
  }
  return !1
}
function tp(e, t, n) {
  if (e.type === 'rect')
    return t.x >= e.x - n && t.x <= e.x + e.w + n && t.y >= e.y - n && t.y <= e.y + e.h + n
  if (e.type === 'brush') return e.points.some(o => to(o, t) <= n)
  if (e.type === 'polygon') return polygonHitTest(e, t, n)
  if (e.type === 'stamp') return to({ x: e.x, y: e.y }, t) <= e.size + n
  const r = od(e)
  return t.x >= r.x - n && t.x <= r.x + r.w + n && t.y >= r.y - n && t.y <= r.y + r.h + n
}
function jk(e, t, n) {
  return e.type === 'rect' || e.type === 'stamp' || e.type === 'text'
    ? { ...e, x: e.x + t, y: e.y + n }
    : { ...e, points: e.points.map(r => ({ x: r.x + t, y: r.y + n })) }
}
function np(e, t) {
  if (t.type === 'rect') {
    ;((e.lineWidth = Math.max(1, t.size / 5)),
      (e.strokeStyle = t.stroke),
      (e.fillStyle = t.fill),
      e.beginPath(),
      e.rect(t.x, t.y, t.w, t.h),
      e.fill(),
      e.stroke())
    return
  }
  if (t.type === 'polygon') {
    if (!t.points.length) return
    const r = Math.max(1, t.size / 5)
    ;((e.lineWidth = r),
      (e.strokeStyle = t.stroke),
      (e.fillStyle = t.fill),
      (e.lineJoin = 'round'),
      (e.lineCap = 'round'),
      e.beginPath(),
      e.moveTo(t.points[0].x, t.points[0].y),
      t.points.slice(1).forEach(o => e.lineTo(o.x, o.y)),
      e.closePath(),
      e.fill(),
      e.stroke(),
      (e.fillStyle = t.stroke),
      t.points.forEach(o => {
        ;(e.beginPath(), e.arc(o.x, o.y, Math.max(2.5, r * 1.2), 0, Math.PI * 2), e.fill())
      }))
    return
  }
  if (t.type === 'brush') {
    if (!t.points.length) return
    ;((e.lineWidth = Math.max(1, t.size)),
      (e.strokeStyle = t.stroke),
      (e.lineCap = 'round'),
      (e.lineJoin = 'round'),
      e.beginPath(),
      e.moveTo(t.points[0].x, t.points[0].y),
      t.points.slice(1).forEach(r => e.lineTo(r.x, r.y)),
      e.stroke())
    return
  }
  if (t.type === 'stamp') {
    const r = Math.max(4, t.size)
    if (((e.fillStyle = t.stroke), e.beginPath(), t.shape === 'circle')) {
      ;(e.arc(t.x, t.y, r, 0, Math.PI * 2), e.fill())
      return
    }
    if (t.shape === 'square') {
      ;(e.rect(t.x - r, t.y - r, r * 2, r * 2), e.fill())
      return
    }
    if (t.shape === 'triangle') {
      ;(e.moveTo(t.x, t.y - r),
        e.lineTo(t.x + r, t.y + r),
        e.lineTo(t.x - r, t.y + r),
        e.closePath(),
        e.fill())
      return
    }
    if (t.shape === 'star') {
      let o = (Math.PI / 2) * 3
      const s = Math.PI / 5,
        i = r / 2
      e.moveTo(t.x, t.y - r)
      for (let l = 0; l < 5; l++)
        (e.lineTo(t.x + Math.cos(o) * r, t.y + Math.sin(o) * r),
          (o += s),
          e.lineTo(t.x + Math.cos(o) * i, t.y + Math.sin(o) * i),
          (o += s))
      ;(e.closePath(), e.fill())
      return
    }
    if (t.shape === 'horizontal') {
      ;(e.rect(t.x - r, t.y - 2, r * 2, 4), e.fill())
      return
    }
    ;((e.font = `bold ${r * 2}px Arial`),
      (e.textAlign = 'center'),
      (e.textBaseline = 'middle'),
      e.fillText('/', t.x, t.y))
    return
  }
  const n = Math.max(14, t.size)
  ;((e.font = `bold ${n}px Pretendard, Arial`),
    (e.fillStyle = t.stroke),
    (e.textBaseline = 'middle'),
    e.fillText(t.text, t.x, t.y))
}
function rp() {
  if (typeof window > 'u') return {}
  try {
    const e = window.localStorage.getItem(wy)
    if (!e) return {}
    const t = JSON.parse(e)
    if (!t || typeof t != 'object' || Array.isArray(t)) return {}
    const n = {}
    return (
      Object.entries(t).forEach(([r, o]) => {
        Array.isArray(o) && (n[r] = o.filter(s => typeof s == 'string' && s.length > 0))
      }),
      n
    )
  } catch {
    return {}
  }
}
function Tk(e) {
  if (!(typeof window > 'u'))
    try {
      window.localStorage.setItem(wy, JSON.stringify(e))
    } catch {}
}
function Rk(e, t = 3) {
  return typeof document > 'u'
    ? []
    : Array.from({ length: t })
        .map((n, r) => {
          const o = r + 1,
            s = document.createElement('canvas')
          ;((s.width = 1e3), (s.height = 1414))
          const i = s.getContext('2d')
          if (!i) return ''
          ;((i.fillStyle = '#ffffff'),
            i.fillRect(0, 0, s.width, s.height),
            (i.strokeStyle = '#334155'),
            (i.lineWidth = 5),
            i.strokeRect(50, 50, 900, 1314),
            (i.font = 'bold 40px Pretendard, Arial'),
            (i.fillStyle = '#334155'),
            (i.textAlign = 'center'),
            i.fillText(`${e} - Page ${o}`, 500, 180),
            (i.lineWidth = 2))
          for (let l = 0; l < 5; l += 1)
            (i.beginPath(), i.moveTo(100, 300 + l * 200), i.lineTo(900, 300 + l * 200), i.stroke())
          return s.toDataURL('image/jpeg', 0.92)
        })
        .filter(Boolean)
}
const polygonToolIcon = e =>
  c.jsxs('svg', {
    ...e,
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    children: [
      c.jsx('path', { d: 'M7 5L17 7L19 15L13 19L5 16L4 9Z' }),
      c.jsx('circle', { cx: '7', cy: '5', r: '1.1', fill: 'currentColor', stroke: 'none' }),
      c.jsx('circle', { cx: '17', cy: '7', r: '1.1', fill: 'currentColor', stroke: 'none' }),
      c.jsx('circle', { cx: '19', cy: '15', r: '1.1', fill: 'currentColor', stroke: 'none' }),
      c.jsx('circle', { cx: '13', cy: '19', r: '1.1', fill: 'currentColor', stroke: 'none' }),
      c.jsx('circle', { cx: '5', cy: '16', r: '1.1', fill: 'currentColor', stroke: 'none' }),
      c.jsx('circle', { cx: '4', cy: '9', r: '1.1', fill: 'currentColor', stroke: 'none' }),
    ],
  })
function Mk() {
  const { state: e, setState: t } = sn(),
    n = y.useRef(null),
    r = y.useRef(null),
    o = y.useRef(null),
    [s, i] = y.useState(!1),
    [l, a] = y.useState(!1),
    [u, d] = y.useState([]),
    [f, g] = y.useState(null),
    [p, b] = y.useState('rect'),
    [x, w] = y.useState('blue'),
    [m, h] = y.useState(fr.rect),
    [v, k] = y.useState('circle'),
    [N, j] = y.useState(!1),
    [P, T] = y.useState(null),
    [I, D] = y.useState([]),
    [Q, U] = y.useState([]),
    [G, $] = y.useState({ x: 0, y: 0, scale: 1 }),
    [re, K] = y.useState(null),
    [polygonDraftCount, setPolygonDraftCount] = y.useState(0),
    W = y.useRef([]),
    R = y.useRef([]),
    C = y.useRef({ x: 0, y: 0, scale: 1 }),
    _ = y.useRef('rect'),
    B = y.useRef('blue'),
    H = y.useRef(fr.rect),
    Z = y.useRef('circle'),
    te = y.useRef(!1),
    fe = y.useRef(null),
    ue = y.useRef(null),
    polygonDraftRef = y.useRef(null),
    J = y.useRef(new Map()),
    De = y.useRef(null)
  ;(y.useEffect(() => {
    _.current = p
  }, [p]),
    y.useEffect(() => {
      B.current = x
    }, [x]),
    y.useEffect(() => {
      H.current = m
    }, [m]),
    y.useEffect(() => {
      Z.current = v
    }, [v]),
    y.useEffect(() => {
      te.current = N
    }, [N]),
    y.useEffect(() => {
      R.current = Q
    }, [Q]),
    y.useEffect(() => {
      C.current = G
    }, [G]))
  function Et(S) {
    return (S == null ? void 0 : S.type) === 'brush'
      ? { ...S, points: S.points.map(M => ({ ...M })) }
      : { ...S }
  }
  function je(S) {
    ;((W.current = S), D(S))
  }
  function Ne(S) {
    ;((R.current = S), U(S))
  }
  function ln(S) {
    d(M => {
      const E = new Map()
      return (
        [...M, ...S].forEach(A => {
          E.has(A.src) || E.set(A.src, A)
        }),
        Array.from(E.values())
      )
    })
  }
  function Nt() {
    const S = o.current,
      M = S == null ? void 0 : S.parentElement
    if (!S || !M) return
    const E = M.getBoundingClientRect()
    E.width < 2 ||
      E.height < 2 ||
      ((S.width = E.width),
      (S.height = E.height),
      (S.style.width = `${E.width}px`),
      (S.style.height = `${E.height}px`))
  }
  function ur(S) {
    const M = o.current
    if (!M) return
    const E = M.clientWidth || M.width,
      A = M.clientHeight || M.height
    if (!E || !A) return
    const z = S.width / S.height,
      Y = E / A,
      q = z > Y ? (E / S.width) * 0.9 : (A / S.height) * 0.9,
      ve = { scale: q, x: (E - S.width * q) / 2, y: (A - S.height * q) / 2 }
    ;((C.current = ve), $(ve))
  }
  function Fr() {
    const S = o.current
    if (!S) return null
    const M = S.getBoundingClientRect()
    if (!M.width || !M.height) return null
    const E = S.width / M.width,
      A = S.height / M.height
    return { canvas: S, rect: M, scaleX: E, scaleY: A }
  }
  function Wt(S, M) {
    const E = Fr()
    return E ? { x: (S - E.rect.left) * E.scaleX, y: (M - E.rect.top) * E.scaleY } : null
  }
  function cr(S, M) {
    const E = Wt(S, M)
    if (!E) return null
    const A = C.current
    return { x: (E.x - A.x) / A.scale, y: (E.y - A.y) / A.scale }
  }
  function dr(S, M) {
    const E = od(M),
      A = C.current.scale
    ;(S.save(),
      (S.shadowColor = 'rgba(14, 165, 233, 0.4)'),
      (S.shadowBlur = 10 / A),
      (S.strokeStyle = '#0ea5e9'),
      (S.lineWidth = 2 / A),
      S.strokeRect(E.x - 2 / A, E.y - 2 / A, E.w + 4 / A, E.h + 4 / A),
      (S.shadowBlur = 0),
      (S.fillStyle = '#ffffff'))
    const z = 6 / A
    ;([
      { x: E.x, y: E.y },
      { x: E.x + E.w, y: E.y },
      { x: E.x, y: E.y + E.h },
      { x: E.x + E.w, y: E.y + E.h },
    ].forEach(q => {
      ;(S.beginPath(), S.arc(q.x, q.y, z / 2, 0, Math.PI * 2), S.fill(), S.stroke())
    }),
      S.restore())
  }
  function ap(S) {
    const M = polygonDraftRef.current
    if (!(M != null && M.points.length)) return
    const E = M.current ? [...M.points, M.current] : [...M.points],
      A = Math.max(1, H.current / 5)
    ;((S.lineWidth = A),
      (S.strokeStyle = Kt[B.current]),
      (S.fillStyle = Oa[B.current]),
      (S.lineJoin = 'round'),
      (S.lineCap = 'round'),
      S.beginPath(),
      S.moveTo(E[0].x, E[0].y),
      E.slice(1).forEach(z => S.lineTo(z.x, z.y)),
      E.length >= 3 && (S.lineTo(E[0].x, E[0].y), S.fill()),
      S.stroke(),
      (S.fillStyle = Kt[B.current]),
      M.points.forEach(z => {
        ;(S.beginPath(), S.arc(z.x, z.y, Math.max(2.5, A * 1.2), 0, Math.PI * 2), S.fill())
      }))
  }
  function se(S) {
    const M = o.current
    if (!M || !P) return
    const E = M.getContext('2d')
    if (!E) return
    const A = C.current,
      z = ue.current
    if (
      (E.setTransform(1, 0, 0, 1, 0, 0),
      E.clearRect(0, 0, M.width, M.height),
      E.setTransform(A.scale, 0, 0, A.scale, A.x, A.y),
      E.drawImage(P, 0, 0),
      W.current.forEach((q, ve) => {
        ;(np(E, q), R.current.includes(ve) && dr(E, q))
      }),
      (z == null ? void 0 : z.kind) === 'rect')
    ) {
      const q = Math.min(z.start.x, z.current.x),
        ve = Math.min(z.start.y, z.current.y),
        et = Math.abs(z.current.x - z.start.x),
        jn = Math.abs(z.current.y - z.start.y)
      ;((E.lineWidth = Math.max(1, H.current / 5)),
        (E.strokeStyle = Kt[B.current]),
        (E.fillStyle = Oa[B.current]),
        E.beginPath(),
        E.rect(q, ve, et, jn),
        E.fill(),
        E.stroke())
    }
    ;(_.current === 'polygon' && polygonDraftRef.current && ap(E),
      (z == null ? void 0 : z.kind) === 'brush' &&
      z.points.length > 1 &&
      ((E.lineWidth = Math.max(1, H.current)),
      (E.strokeStyle = Kt[B.current]),
      (E.lineCap = 'round'),
      (E.lineJoin = 'round'),
      E.beginPath(),
      E.moveTo(z.points[0].x, z.points[0].y),
      z.points.slice(1).forEach(q => E.lineTo(q.x, q.y)),
      E.stroke()),
      (z == null ? void 0 : z.kind) === 'lasso' &&
        z.points.length > 1 &&
        ((E.lineWidth = Math.max(1, H.current / 10)),
        (E.strokeStyle = '#0ea5e9'),
        E.setLineDash([5, 5]),
        (E.fillStyle = 'rgba(14, 165, 233, 0.1)'),
        E.beginPath(),
        E.moveTo(z.points[0].x, z.points[0].y),
        z.points.slice(1).forEach(q => E.lineTo(q.x, q.y)),
        E.closePath(),
        E.fill(),
        E.stroke(),
        E.setLineDash([])))
    const Y = S ?? fe.current
    _.current === 'eraser' &&
      Y &&
      (E.setTransform(1, 0, 0, 1, 0, 0),
      E.beginPath(),
      E.arc(Y.x, Y.y, H.current * A.scale, 0, Math.PI * 2),
      (E.fillStyle = 'rgba(255, 255, 255, 0.45)'),
      (E.strokeStyle = '#111827'),
      (E.lineWidth = 1),
      E.fill(),
      E.stroke())
  }
  function lp(S = !0) {
    ;((polygonDraftRef.current = null), setPolygonDraftCount(0), S && se())
  }
  function up(S) {
    const M = polygonDraftRef.current,
      E = M == null ? void 0 : M.points[M.points.length - 1],
      A = Math.max(4, H.current * 0.35)
    if (E && to(E, S) <= A) return
    polygonDraftRef.current = M ? { points: [...M.points, S], current: null } : { points: [S], current: null }
    ;(setPolygonDraftCount(polygonDraftRef.current.points.length), se())
  }
  function cp(S) {
    polygonDraftRef.current && ((polygonDraftRef.current.current = S ?? null), se())
  }
  function fp(S = !0) {
    const M = polygonDraftRef.current
    if (!(M != null && M.points.length)) return S && we.info('다각형 꼭짓점을 먼저 추가하세요'), !1
    const E = M.points.reduce((A, z) => {
      const Y = A[A.length - 1]
      return Y && to(Y, z) <= Math.max(4, H.current * 0.35) ? A : [...A, { ...z }]
    }, [])
    if (E.length < 3) return S && we.info('최소 3개 꼭짓점이 필요합니다'), !1
    const A = [
      ...W.current,
      {
        type: 'polygon',
        points: E,
        stroke: Kt[B.current],
        fill: Oa[B.current],
        size: H.current,
      },
    ]
    return je(A), lp(!1), se(), !0
  }
  function Ws(S) {
    for (let M = W.current.length - 1; M >= 0; M -= 1) if (tp(W.current[M], S, 25)) return M
    return -1
  }
  function Cn(S) {
    const M = H.current,
      E = W.current.filter(A => !tp(A, S, M))
    return E.length === W.current.length ? !1 : ((W.current = E), !0)
  }
  function $r(S, M = !1) {
    ;((C.current = S), M && $(S))
  }
  function Pt(S, M, E, A = !0) {
    const z = Fr()
    if (!z) return
    const Y = C.current
    let q = Wt(M ?? z.rect.left + z.rect.width / 2, E ?? z.rect.top + z.rect.height / 2)
    q || (q = { x: z.canvas.width / 2, y: z.canvas.height / 2 })
    const ve = { x: (q.x - Y.x) / Y.scale, y: (q.y - Y.y) / Y.scale },
      et = Aa(Y.scale + S, 0.3, 5),
      jn = { scale: et, x: q.x - ve.x * et, y: q.y - ve.y * et }
    ;($r(jn, A), se())
  }
  function Bl() {
    P && (ur(P), se())
  }
  function Hl() {
    const S = Array.from(J.current.values())
    if (S.length < 2) return
    const M = { x: (S[0].x + S[1].x) / 2, y: (S[0].y + S[1].y) / 2 },
      E = cr(M.x, M.y)
    E &&
      ((De.current = {
        baseDistance: to(S[0], S[1]),
        baseCamera: { ...C.current },
        centerWorld: E,
      }),
      (ue.current = null))
  }
  function Je() {
    if (!De.current) return
    const S = Array.from(J.current.values())
    if (S.length < 2) return
    const M = { x: (S[0].x + S[1].x) / 2, y: (S[0].y + S[1].y) / 2 },
      E = Wt(M.x, M.y)
    if (!E) return
    const z = Math.max(1, to(S[0], S[1])) / Math.max(1, De.current.baseDistance),
      Y = Aa(De.current.baseCamera.scale * z, 0.3, 5),
      q = { scale: Y, x: E.x - De.current.centerWorld.x * Y, y: E.y - De.current.centerWorld.y * Y }
    ;($r(q, !1), se())
  }
  function En(S) {
    _.current === 'polygon' && S !== 'polygon' && lp(!1)
    ;(b(S), (_.current = S))
    const M = fr[S]
    ;(h(M), (H.current = M), se())
  }
  function Wl(S) {
    if ((w(S), (B.current = S), R.current.length > 0)) {
      const M = [...W.current]
      ;(R.current.forEach(E => {
        const A = M[E]
        A && ((A.stroke = Kt[S]), (A.type === 'rect' || A.type === 'polygon') && (A.fill = Oa[S]))
      }),
        je(M))
    }
    se()
  }
  function Vl(S) {
    const M = Aa(S, 1, 50)
    if ((h(M), (H.current = M), R.current.length > 0)) {
      const E = [...W.current]
      ;(R.current.forEach(A => {
        E[A] && (E[A].size = M)
      }),
        je(E))
    }
    se()
  }
  function Ur(S) {
    ;(k(S), (Z.current = S))
  }
  function Ql() {
    if (!R.current.length) {
      we.info('선택된 객체가 없습니다')
      return
    }
    const S = new Set(R.current),
      M = W.current.filter((E, A) => !S.has(A))
    ;(je(M), Ne([]), se(), we.success('선택 객체 삭제'))
  }
  function Vs() {
    if (polygonDraftRef.current) {
      lp()
      return
    }
    if (!W.current.length) return
    const S = W.current.slice(0, -1)
    ;(je(S), Ne([]), se())
  }
  function Lo() {
    window.confirm('모든 마킹을 삭제할까요?') && (je([]), Ne([]), lp(!1), se())
  }
  function Nn(S) {
    S.preventDefault()
    const M = S.deltaY < 0 ? 0.14 : -0.14
    Pt(M, S.clientX, S.clientY, !0)
  }
  function Qs(S) {
    if (!P || (S.pointerType === 'mouse' && S.button !== 0)) return
    const M = o.current
    if (!M) return
    S.preventDefault()
    try {
      M.setPointerCapture(S.pointerId)
    } catch {}
    if ((J.current.set(S.pointerId, { x: S.clientX, y: S.clientY }), J.current.size === 2)) {
      Hl()
      return
    }
    if (J.current.size > 1) return
    const E = cr(S.clientX, S.clientY),
      A = Wt(S.clientX, S.clientY)
    if (!(!E || !A)) {
      if (_.current === 'polygon') {
        up(E)
        return
      }
      if (((fe.current = A), _.current === 'eraser' && K(A), _.current === 'text')) {
        const z = window.prompt('도면에 표시할 문자를 입력하세요', '')
        if (z && z.trim()) {
          const Y = [
            ...W.current,
            {
              type: 'text',
              x: E.x,
              y: E.y,
              text: z.trim(),
              stroke: Kt[B.current],
              size: H.current,
            },
          ]
          ;(je(Y), se())
        }
        return
      }
      if (_.current === 'stamp') {
        const z = [
          ...W.current,
          {
            type: 'stamp',
            x: E.x,
            y: E.y,
            shape: Z.current,
            stroke: Kt[B.current],
            size: H.current,
          },
        ]
        ;(je(z), se(), typeof navigator < 'u' && 'vibrate' in navigator && navigator.vibrate(10))
        return
      }
      if (_.current === 'hand') {
        const z = Ws(E)
        if (z >= 0) {
          const Y = R.current.includes(z) && R.current.length > 0 ? R.current : [z]
          ;(Ne(Y),
            (ue.current = {
              kind: 'move',
              startWorld: E,
              indices: Y,
              originals: Y.map(q => Et(W.current[q])),
            }))
        } else
          te.current
            ? R.current.length > 0 && Ne([])
            : ((ue.current = {
                kind: 'pan',
                startScreen: { x: S.clientX, y: S.clientY },
                startCam: { ...C.current },
              }),
              R.current.length > 0 && Ne([]))
        se()
        return
      }
      if (_.current === 'rect') {
        ;((ue.current = { kind: 'rect', start: E, current: E }), se())
        return
      }
      if (_.current === 'brush') {
        ;((ue.current = { kind: 'brush', points: [E] }), se())
        return
      }
      if (_.current === 'lasso') {
        ;((ue.current = { kind: 'lasso', points: [E] }), Ne([]), se())
        return
      }
      _.current === 'eraser' && ((ue.current = { kind: 'erase' }), Cn(E), se(A))
    }
  }
  function Pn(S) {
    if (!P) return
    const M = J.current.has(S.pointerId)
    M && J.current.set(S.pointerId, { x: S.clientX, y: S.clientY })
    const E = cr(S.clientX, S.clientY),
      A = Wt(S.clientX, S.clientY)
    if (!E || !A) return
    if ((_.current === 'eraser' && ((fe.current = A), K(A)), J.current.size === 2)) {
      Je()
      return
    }
    if (!M) {
      _.current === 'polygon' && polygonDraftRef.current && cp(E)
      _.current === 'eraser' && se(A)
      return
    }
    const z = ue.current
    if (!z) {
      _.current === 'eraser' && se(A)
      return
    }
    if ((S.preventDefault(), z.kind === 'pan')) {
      const Y = S.clientX - z.startScreen.x,
        q = S.clientY - z.startScreen.y
      ;($r({ ...z.startCam, x: z.startCam.x + Y, y: z.startCam.y + q }, !1), se())
      return
    }
    if (z.kind === 'move') {
      const Y = E.x - z.startWorld.x,
        q = E.y - z.startWorld.y,
        ve = [...W.current]
      ;(z.indices.forEach((et, jn) => {
        ve[et] = jk(Et(z.originals[jn]), Y, q)
      }),
        (W.current = ve),
        se())
      return
    }
    if (z.kind === 'rect') {
      ;((z.current = E), se())
      return
    }
    if (z.kind === 'brush') {
      const Y = z.points
      ;((!Y.length || to(Y[Y.length - 1], E) > 0.6) && Y.push(E), se())
      return
    }
    if (z.kind === 'lasso') {
      const Y = z.points
      ;((!Y.length || to(Y[Y.length - 1], E) > 0.8) && Y.push(E), se())
      return
    }
    z.kind === 'erase' && (Cn(E), se(A))
  }
  function dp(S) {
    _.current === 'polygon' && polygonDraftRef.current && (S.preventDefault(), fp())
  }
  function Ks(S) {
    const M = o.current
    if (M)
      try {
        M.hasPointerCapture(S.pointerId) && M.releasePointerCapture(S.pointerId)
      } catch {}
    if (
      (J.current.delete(S.pointerId),
      De.current && J.current.size < 2 && ((De.current = null), $({ ...C.current })),
      J.current.size > 0)
    )
      return
    const E = ue.current
    if ((E == null ? void 0 : E.kind) === 'rect') {
      const A = Math.min(E.start.x, E.current.x),
        z = Math.min(E.start.y, E.current.y),
        Y = Math.abs(E.current.x - E.start.x),
        q = Math.abs(E.current.y - E.start.y)
      if (Y > 4 || q > 4) {
        const ve = [
          ...W.current,
          {
            type: 'rect',
            x: A,
            y: z,
            w: Y,
            h: q,
            stroke: Kt[B.current],
            fill: Oa[B.current],
            size: H.current,
          },
        ]
        je(ve)
      }
    } else if ((E == null ? void 0 : E.kind) === 'brush' && E.points.length > 1) {
      const A = [
        ...W.current,
        { type: 'brush', points: [...E.points], stroke: Kt[B.current], size: H.current },
      ]
      je(A)
    } else if ((E == null ? void 0 : E.kind) === 'lasso' && E.points.length > 2) {
      const A = [...E.points],
        z = []
      W.current.forEach((ve, et) => {
        Pk(Nk(ve), A) && z.push(et)
      })
      const Y = {
          type: 'brush',
          points: [...A, A[0]],
          stroke: Kt[B.current],
          size: Math.max(2, H.current / 2),
        },
        q = [...W.current, Y]
      ;(je(q),
        Ne(z),
        z.length > 0
          ? (we.success(`${z.length}개 객체 선택`),
            b('hand'),
            (_.current = 'hand'),
            h(fr.hand),
            (H.current = fr.hand))
          : we.success('올가미 영역 저장'))
    } else
      ((E == null ? void 0 : E.kind) === 'move' || (E == null ? void 0 : E.kind) === 'erase') &&
        (D([...W.current]), R.current.some(A => A >= W.current.length) && Ne([]))
    ;((E == null ? void 0 : E.kind) === 'pan' && $({ ...C.current }),
      (ue.current = null),
      _.current !== 'eraser' && ((fe.current = null), K(null)),
      se())
  }
  async function Kl(S) {
    const M = await Jf(S),
      E = await ep(M)
    if (typeof document > 'u') return M
    const A = 2048,
      z = 2048
    let Y = E.width,
      q = E.height
    if (Y > A || q > z) {
      const jn = Math.min(A / Y, z / q)
      ;((Y = Math.round(Y * jn)), (q = Math.round(q * jn)))
    }
    const ve = document.createElement('canvas')
    ;((ve.width = Y), (ve.height = q))
    const et = ve.getContext('2d')
    return et
      ? ((et.imageSmoothingEnabled = !0),
        (et.imageSmoothingQuality = 'high'),
        et.drawImage(E, 0, 0, Y, q),
        ve.toDataURL('image/jpeg', 0.9))
      : M
  }
  async function Ys(S) {
    const M = Array.from(S.target.files ?? [])
    if (!M.length) return
    const E = []
    for (const A of M) {
      if (!A.type.startsWith('image/')) continue
      const z = await Jf(A)
      E.push({ img: z, desc: '보수후', fileName: A.name })
    }
    ;(E.length > 0 &&
      (t(A => ({ ...A, photos: [...A.photos, ...E] })), we.success(`사진 ${E.length}장 등록`)),
      (S.target.value = ''))
  }
  async function Gs(S) {
    const M = Array.from(S.target.files ?? [])
    if (!M.length) return
    const E = []
    for (const A of M)
      if (A.type.startsWith('image/'))
        try {
          const z = await Kl(A)
          E.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            src: z,
            label: A.name,
            source: 'upload',
          })
        } catch {}
    ;(E.length && (ln(E), we.success(`도면 ${E.length}페이지 불러옴`)), (S.target.value = ''))
  }
  function Yl() {
    const S = e.drawings
      .slice()
      .reverse()
      .slice(0, 8)
      .map((M, E) => ({
        id: `existing-${E}-${Date.now()}`,
        src: M,
        label: `기존 도면 ${E + 1}`,
        source: 'existing',
      }))
    ;(d(S), i(!0))
  }
  function Io() {
    const S = e.selectedSite || '__unselected__',
      M = e.siteSearch || '현장 도면',
      A = rp()[S] ?? [],
      Y = (A.length > 0 ? A : Rk(M, 3)).map((q, ve) => ({
        id: `site-${ve}-${Date.now()}`,
        src: q,
        label: `${M} ${ve + 1}P`,
        source: 'site',
      }))
    ;(ln(Y),
      A.length > 0
        ? we.success(`연동 현장 도면 ${A.length}페이지 로드`)
        : we.info('연동 도면이 없어 샘플 페이지를 표시했습니다'))
  }
  function jt(S) {
    ;(i(!1),
      a(!0),
      g(S),
      b('rect'),
      (_.current = 'rect'),
      w('blue'),
      (B.current = 'blue'),
      h(fr.rect),
      (H.current = fr.rect),
      k('circle'),
      (Z.current = 'circle'),
      j(!1),
      (te.current = !1),
      Ne([]),
      lp(!1),
      K(null),
      (fe.current = null),
      (ue.current = null),
      J.current.clear(),
      (De.current = null))
  }
  function qs() {
    ;(a(!1),
      g(null),
      T(null),
      je([]),
      Ne([]),
      lp(!1),
      K(null),
      (fe.current = null),
      (ue.current = null),
      J.current.clear(),
      (De.current = null))
    const S = { x: 0, y: 0, scale: 1 }
    ;((C.current = S), $(S))
  }
  function X() {
    if (!P || typeof document > 'u') return null
    const S = document.createElement('canvas')
    ;((S.width = P.width), (S.height = P.height))
    const M = S.getContext('2d')
    return M
      ? ((M.fillStyle = '#ffffff'),
        M.fillRect(0, 0, S.width, S.height),
        M.drawImage(P, 0, 0),
        W.current.forEach(E => np(M, E)),
        S.toDataURL('image/jpeg', 0.95))
      : null
  }
  function ce() {
    if (!P) {
      we.error('도면을 먼저 선택하세요')
      return
    }
    if (_.current === 'polygon' && polygonDraftRef.current) {
      if (!fp()) return
    }
    if (!W.current.length) {
      we.error('마킹된 내용이 없습니다')
      return
    }
    const S = X()
    if (!S) {
      we.error('도면 생성 실패')
      return
    }
    t(A => ({ ...A, drawings: [...A.drawings, S] }))
    const M = e.selectedSite || '__unselected__',
      E = rp()
    ;((E[M] = [S, ...(E[M] ?? [])].slice(0, 20)), Tk(E), we.success('도면 마킹 저장 완료'), qs())
  }
  function pe(S) {
    t(M => ({ ...M, photos: M.photos.filter((E, A) => A !== S) }))
  }
  const [drawStatuses, setDrawStatuses] = y.useState({})
  function at(S) {
    t(M => ({
      ...M,
      photos: M.photos.map((E, A) => {
        if (A !== S) return E
        const z = E.desc === '보수후' ? '보수전' : '보수후'
        return { ...E, desc: z }
      }),
    }))
  }
  function ct(S) {
    setDrawStatuses(M => ({ ...M, [S]: M[S] === 'done' ? 'progress' : 'done' }))
  }
  function ut(S) {
    ;(t(M => ({ ...M, drawings: M.drawings.filter((E, A) => A !== S) })),
      setDrawStatuses(M => {
        const E = {}
        return (
          Object.entries(M).forEach(([A, z]) => {
            const Y = Number(A)
            Number.isFinite(Y) && Y !== S && (E[Y > S ? Y - 1 : Y] = z)
          }),
          E
        )
      }))
  }
  ;(y.useEffect(() => {
    setDrawStatuses(S => {
      const M = {}
      return (
        Object.entries(S).forEach(([E, A]) => {
          const z = Number(E)
          Number.isFinite(z) && z < e.drawings.length && (M[z] = A)
        }),
        M
      )
    })
  }, [e.drawings.length]),
    y.useEffect(() => {
      if (!l || !f) return
      let S = !1
      return (
        (async () => {
          try {
            const M = await ep(f)
            if (S) return
            ;(T(M),
              je([]),
              Ne([]),
              requestAnimationFrame(() => {
                ;(Nt(), ur(M), se())
              }))
          } catch {
            we.error('도면 로드 실패')
          }
        })(),
        () => {
          S = !0
        }
      )
    }, [l, f]),
    y.useEffect(() => {
      if (!l) return
      const S = () => {
        ;(Nt(), se())
      }
      window.addEventListener('resize', S)
      const M = window.setTimeout(S, 30)
      return () => {
        ;(window.removeEventListener('resize', S), window.clearTimeout(M))
      }
    }, [l, P]),
    y.useEffect(() => {
      if (!l) return
      const S = M => {
        M.key === 'Escape' && polygonDraftRef.current && (M.preventDefault(), lp())
      }
      return (
        window.addEventListener('keydown', S),
        () => {
          window.removeEventListener('keydown', S)
        }
      )
    }, [l]),
    y.useEffect(() => {
      if (typeof window > 'u') return
      try {
        const S = { type: 'inopnc-drawing', source: 'home-v2-drawing', open: !!l }
        window.top && window.top !== window && window.top.postMessage(S, window.location.origin)
      } catch {}
      return () => {
        if (typeof window > 'u') return
        try {
          const S = { type: 'inopnc-drawing', source: 'home-v2-drawing', open: !1 }
          window.top && window.top !== window && window.top.postMessage(S, window.location.origin)
        } catch {}
      }
    }, [l]))
  const Vt = y.useMemo(
      () => [
        { key: 'hand', label: '이동', icon: p1 },
        { key: 'rect', label: '구역', icon: y1 },
        { key: 'polygon', label: '다각형', icon: polygonToolIcon },
        { key: 'lasso', label: '올가미', icon: a1 },
        { key: 'brush', label: '펜', icon: Xx },
        { key: 'stamp', label: '도장', icon: w1 },
        { key: 'text', label: '문자', icon: C1 },
        { key: 'eraser', label: '삭제', icon: n1 },
      ],
      []
    ),
    an = Math.round(G.scale * 100)
  return c.jsxs(c.Fragment, {
    children: [
      c.jsxs('div', {
        id: 'photo-drawing-card',
        className: 'rounded-2xl bg-card p-6 shadow-sm',
        children: [
          c.jsx('div', {
            className: 'mb-3 flex items-center justify-between',
            children: c.jsxs('div', {
              className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
              children: [c.jsx(l1, { className: 'h-5 w-5' }), '사진/도면'],
            }),
          }),
          (e.photos.length > 0 || e.drawings.length > 0) &&
            c.jsxs('div', {
              className: 'mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar',
              children: [
                e.photos.map((S, M) => {
                  const E = S.desc !== '보수전'
                  return c.jsxs(
                    'div',
                    {
                      className:
                        'relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5',
                      children: [
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => at(M),
                          className: `absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${E ? 'bg-blue-500/90' : 'bg-rose-500/90'}`,
                          children: S.desc || (E ? '보수후' : '보수전'),
                        }),
                        c.jsx('img', {
                          src: S.img,
                          alt: `photo-${M}`,
                          className: 'h-[104px] w-full rounded-lg object-cover',
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => pe(M),
                          className:
                            'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white',
                          title: '삭제',
                          children: c.jsx(Dt, { className: 'h-4 w-4' }),
                        }),
                      ],
                    },
                    `photo-${S.fileName}-${M}`
                  )
                }),
                e.drawings.map((S, M) =>
                  c.jsxs(
                    'div',
                    {
                      className:
                        'relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5',
                      children: [
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => ct(M),
                          className: `absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${drawStatuses[M] === 'done' ? 'bg-blue-500/90' : 'bg-teal-500/90'}`,
                          children: drawStatuses[M] === 'done' ? '완료도면' : '진행도면',
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => jt(S),
                          className: 'block w-full',
                          title: '다시 마킹',
                          children: c.jsx('img', {
                            src: S,
                            alt: `drawing-${M}`,
                            className: 'h-[104px] w-full rounded-lg object-cover',
                          }),
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => ut(M),
                          className:
                            'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white',
                          title: '삭제',
                          children: c.jsx(Dt, { className: 'h-4 w-4' }),
                        }),
                      ],
                    },
                    `drawing-${M}`
                  )
                ),
              ],
            }),
          c.jsx('input', {
            ref: n,
            type: 'file',
            accept: 'image/*',
            multiple: !0,
            className: 'hidden',
            onChange: Ys,
          }),
          c.jsxs('div', {
            className: 'grid grid-cols-2 gap-3',
            children: [
              c.jsxs('div', {
                children: [
                  c.jsx('div', {
                    className: 'mb-2 block text-[15px] font-bold text-text-sub',
                    children: '사진등록',
                  }),
                  c.jsxs('button', {
                    type: 'button',
                    onClick: () => {
                      var S
                      return (S = n.current) == null ? void 0 : S.click()
                    },
                    className:
                      'flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 text-[15px] font-bold text-sky-700 transition-colors hover:bg-sky-100 sm:text-base',
                    children: [c.jsx(Zx, { className: 'h-5 w-5' }), '사진 등록'],
                  }),
                ],
              }),
              c.jsxs('div', {
                children: [
                  c.jsx('div', {
                    className: 'mb-2 block text-[15px] font-bold text-text-sub',
                    children: '도면마킹',
                  }),
                  c.jsxs('button', {
                    type: 'button',
                    onClick: Yl,
                    className:
                      'flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-[15px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100 sm:text-base',
                    children: [c.jsx(g1, { className: 'h-5 w-5' }), '도면마킹'],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      s &&
        c.jsx('div', {
          className: 'fixed inset-0 z-[110] bg-black/50',
          onMouseDown: S => S.target === S.currentTarget && i(!1),
          children: c.jsxs('div', {
            className:
              'absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[600px] rounded-t-2xl bg-card p-4 shadow-2xl',
            children: [
              c.jsxs('div', {
                className: 'mb-3 flex items-center justify-between',
                children: [
                  c.jsx('div', {
                    className: 'text-lg font-bold text-header-navy',
                    children: '도면 선택',
                  }),
                  c.jsx('button', {
                    type: 'button',
                    onClick: () => i(!1),
                    className: 'rounded-lg p-1 text-muted-foreground hover:bg-accent',
                    children: c.jsx(Dt, { className: 'h-5 w-5' }),
                  }),
                ],
              }),
              c.jsx('input', {
                ref: r,
                type: 'file',
                multiple: !0,
                accept: 'image/*',
                className: 'hidden',
                onChange: Gs,
              }),
              c.jsxs('button', {
                type: 'button',
                onClick: () => {
                  var S
                  return (S = r.current) == null ? void 0 : S.click()
                },
                className:
                  'mb-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/10 text-[14px] font-bold text-primary hover:bg-primary/15',
                children: [c.jsx(N1, { className: 'h-4 w-4' }), '도면 업로드 (여러 페이지)'],
              }),
              c.jsxs('button', {
                type: 'button',
                onClick: Io,
                className:
                  'mb-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-input text-[14px] font-bold text-foreground hover:bg-accent',
                children: [c.jsx(d1, { className: 'h-4 w-4' }), '연동 현장 도면 불러오기'],
              }),
              c.jsx('div', {
                className: 'max-h-[54vh] overflow-y-auto',
                children:
                  u.length > 0
                    ? c.jsx('div', {
                        className: 'grid grid-cols-2 gap-2',
                        children: u.map(S =>
                          c.jsxs(
                            'div',
                            {
                              className: 'rounded-xl border border-border bg-bg-input p-2',
                              children: [
                                c.jsx('img', {
                                  src: S.src,
                                  alt: S.label,
                                  className: 'h-24 w-full rounded-lg object-cover',
                                }),
                                c.jsx('div', {
                                  className:
                                    'mt-1 truncate text-[12px] font-medium text-muted-foreground',
                                  children: S.label,
                                }),
                                c.jsx('button', {
                                  type: 'button',
                                  onClick: () => jt(S.src),
                                  className:
                                    'mt-2 h-8 w-full rounded-lg bg-primary text-xs font-bold text-primary-foreground hover:opacity-90',
                                  children: '마킹 실행',
                                }),
                              ],
                            },
                            S.id
                          )
                        ),
                      })
                    : c.jsx('div', {
                        className:
                          'rounded-xl border border-border bg-bg-input px-4 py-10 text-center text-sm text-muted-foreground',
                        children: '도면을 업로드하거나 연동 현장 도면을 불러오세요',
                      }),
              }),
            ],
          }),
        }),
      l &&
        c.jsxs('div', {
          className: 'fixed inset-0 z-[120] flex flex-col bg-slate-950 text-white',
          children: [
            c.jsxs('div', {
              className:
                'flex flex-col gap-2 border-b border-white/10 px-2 pt-2.5 pb-2 sm:flex-row sm:items-center sm:justify-between sm:px-3',
              children: [
                c.jsxs('div', {
                  className: 'flex min-w-0 items-center gap-2',
                  children: [
                    c.jsx('button', {
                      type: 'button',
                      onClick: qs,
                      className: 'rounded-lg p-1 hover:bg-white/10',
                      children: c.jsx(Dt, { className: 'h-5 w-5' }),
                    }),
                    c.jsx('span', {
                      className: 'text-sm font-bold sm:text-lg',
                      children: '도면마킹',
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'flex w-full items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar sm:w-auto sm:justify-end sm:gap-2 sm:pb-0',
                  children: [
                    c.jsxs('button', {
                      type: 'button',
                      onClick: Vs,
                      className:
                        'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs',
                      children: [c.jsx(E1, { className: 'h-3.5 w-3.5' }), '이전'],
                    }),
                    c.jsxs('button', {
                      type: 'button',
                      onClick: Ql,
                      className:
                        'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs',
                      children: [c.jsx(S1, { className: 'h-3.5 w-3.5' }), '선택삭제'],
                    }),
                    c.jsxs('button', {
                      type: 'button',
                      onClick: Lo,
                      className:
                        'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs',
                      children: [c.jsx(Dt, { className: 'h-3.5 w-3.5' }), '모두삭제'],
                    }),
                    polygonDraftCount > 0 &&
                      c.jsxs('button', {
                        type: 'button',
                        onClick: () => lp(),
                        className:
                          'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs',
                        children: [c.jsx(Dt, { className: 'h-3.5 w-3.5' }), '취소'],
                      }),
                    polygonDraftCount > 0 &&
                      c.jsxs('button', {
                        type: 'button',
                        onClick: () => fp(),
                        disabled: polygonDraftCount < 3,
                        className: `flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold sm:text-xs ${
                          polygonDraftCount >= 3
                            ? 'bg-emerald-500 text-white'
                            : 'cursor-not-allowed bg-white/10 text-white/50'
                        }`,
                        children: [c.jsx(m1, { className: 'h-3.5 w-3.5' }), '완료'],
                      }),
                    c.jsxs('button', {
                      type: 'button',
                      onClick: ce,
                      className:
                        'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-primary-foreground sm:text-xs',
                      children: [c.jsx(m1, { className: 'h-3.5 w-3.5' }), '저장'],
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs('div', {
              className: 'relative flex-1 overflow-hidden bg-slate-950',
              style: { touchAction: 'none' },
              children: [
                p === 'polygon' &&
                  c.jsx('div', {
                    className:
                      'pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-black/55 px-3 py-2 text-[11px] font-semibold text-white/90',
                    children: '꼭짓점을 찍고 더블클릭 또는 완료로 다각형 영역을 확정합니다.',
                  }),
                c.jsx('canvas', {
                  ref: o,
                  className: 'h-full w-full touch-none',
                  style: { touchAction: 'none' },
                  onPointerDown: Qs,
                  onPointerMove: Pn,
                  onPointerUp: Ks,
                  onPointerCancel: Ks,
                  onPointerLeave: () => {
                    _.current === 'polygon' && polygonDraftRef.current && cp(null)
                    _.current === 'eraser' && ((fe.current = null), K(null), se(null))
                  },
                  onDoubleClick: dp,
                  onWheel: Nn,
                }),
                c.jsx('div', {
                  className: 'hidden',
                  children: '',
                }),
              ],
            }),
            c.jsxs('div', {
              className: 'border-t border-white/10 bg-card text-foreground',
              children: [
                c.jsx('div', {
                  className: 'grid gap-1 px-2 py-2',
                  style: { gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' },
                  children: Vt.map(S => {
                    const M = S.icon,
                      E = p === S.key
                    return c.jsxs(
                      'button',
                      {
                        type: 'button',
                        onClick: () => En(S.key),
                        className: `flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-bold transition-all ${E ? 'bg-primary/10 text-primary scale-105' : 'text-muted-foreground hover:bg-accent'}`,
                        children: [c.jsx(M, { className: 'h-4 w-4' }), S.label],
                      },
                      S.key
                    )
                  }),
                }),
                c.jsxs('div', {
                  className: 'flex flex-wrap items-center gap-2 border-t border-border px-3 py-2',
                  children: [
                    c.jsx('div', {
                      className: 'flex flex-wrap items-center gap-1',
                      children: Ck.map(S =>
                        c.jsx(
                          'button',
                          {
                            type: 'button',
                            onClick: () => Wl(S),
                            className: `h-6 w-6 rounded-full border-2 transition ${x === S ? 'scale-110 border-white ring-2 ring-slate-700' : 'border-slate-300'}`,
                            style: { backgroundColor: Kt[S] },
                            title: S,
                          },
                          S
                        )
                      ),
                    }),
                    c.jsx('div', { className: 'mx-1 h-6 w-px bg-border' }),
                    c.jsxs('div', {
                      className: 'flex min-w-[160px] flex-1 items-center gap-2',
                      children: [
                        c.jsx('span', {
                          className: 'whitespace-nowrap text-xs font-medium text-muted-foreground',
                          children: '크기',
                        }),
                        c.jsx('input', {
                          type: 'range',
                          min: 1,
                          max: 50,
                          value: m,
                          onChange: S => Vl(Number(S.target.value)),
                          className: 'h-2 flex-1 cursor-pointer accent-primary',
                        }),
                        c.jsx('span', {
                          className: 'min-w-[30px] text-right text-xs font-bold text-foreground',
                          children: m,
                        }),
                      ],
                    }),
                    c.jsx('div', { className: 'mx-1 h-6 w-px bg-border' }),
                    c.jsxs('div', {
                      className: 'flex items-center gap-1',
                      children: [
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => Pt(-0.2),
                          className: 'rounded p-1.5 hover:bg-accent',
                          title: '축소',
                          children: c.jsx(T1, { className: 'h-4 w-4' }),
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => Pt(0.2),
                          className: 'rounded p-1.5 hover:bg-accent',
                          title: '확대',
                          children: c.jsx(j1, { className: 'h-4 w-4' }),
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: Bl,
                          className: 'rounded p-1.5 hover:bg-accent',
                          title: '맞춤',
                          children: c.jsx(f1, { className: 'h-4 w-4' }),
                        }),
                        c.jsx('button', {
                          type: 'button',
                          onClick: () => {
                            ;(j(S => !S), (te.current = !te.current))
                          },
                          className: `rounded p-1.5 ${N ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`,
                          title: N ? '화면 잠금 해제' : '화면 잠금',
                          children: c.jsx(u1, { className: 'h-4 w-4' }),
                        }),
                      ],
                    }),
                    c.jsxs('div', {
                      className:
                        'ml-auto rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground',
                      children: [an, '%'],
                    }),
                  ],
                }),
                p === 'stamp' &&
                  c.jsx('div', {
                    className: 'grid grid-cols-6 gap-2 border-t border-border bg-muted/40 p-2',
                    children: Ek.map(S => {
                      const M = v === S
                      return c.jsxs(
                        'button',
                        {
                          type: 'button',
                          onClick: () => Ur(S),
                          className: `flex h-9 items-center justify-center rounded-lg border transition-all ${M ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-accent'}`,
                          children: [
                            S === 'circle' && c.jsx(t1, { className: 'h-4 w-4' }),
                            S === 'square' && c.jsx(x1, { className: 'h-4 w-4' }),
                            S === 'triangle' && c.jsx(k1, { className: 'h-4 w-4' }),
                            S === 'star' && c.jsx(b1, { className: 'h-4 w-4' }),
                            S === 'horizontal' && c.jsx(s1, { className: 'h-4 w-4' }),
                            S === 'diagonal' && c.jsx(v1, { className: 'h-4 w-4' }),
                          ],
                        },
                        S
                      )
                    }),
                  }),
                c.jsxs('div', {
                  className: 'border-t border-border px-3 py-1 text-[11px] text-muted-foreground',
                  children: [
                    '객체 ',
                    I.length,
                    '개 · 선택 ',
                    Q.length,
                    '개 · 지우개 반경 ',
                    p === 'eraser' ? `${Math.round(m * G.scale)}px` : '-',
                  ],
                }),
              ],
            }),
          ],
        }),
    ],
  })
}
function _k() {
  const { state: e } = sn(),
    [t, n] = y.useState(!0),
    r = e.siteSearch || '미선택',
    o =
      e.manpowerList
        .filter(l => l.worker)
        .map(l => `${l.worker}(${l.workHours})`)
        .join(', ') || '없음',
    s =
      e.workSets
        .filter(l => l.member)
        .map(l => `${l.member}/${l.process}/${l.type}`)
        .join(', ') || '없음',
    i = e.materials.map(l => `${l.name} ${l.qty}말`).join(', ') || '없음'
  return c.jsxs('div', {
    className: 'rounded-2xl bg-card p-6 shadow-sm',
    children: [
      c.jsxs('button', {
        onClick: () => n(!t),
        className: 'flex w-full items-center justify-between border-b border-border pb-3',
        children: [
          c.jsxs('div', {
            className: 'flex items-center gap-2 text-xl font-bold text-header-navy',
            children: [c.jsx(r1, { className: 'h-5 w-5' }), '작성 내용 요약'],
          }),
          t
            ? c.jsx(Bc, { className: 'h-5 w-5 text-muted-foreground' })
            : c.jsx(Jx, { className: 'h-5 w-5 text-muted-foreground' }),
        ],
      }),
      !t &&
        c.jsxs('div', {
          className: 'mt-4 space-y-3 text-[15px]',
          children: [
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '현장:' }),
                ' ',
                c.jsx('span', { children: r }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '작업일자:' }),
                ' ',
                c.jsx('span', { children: e.workDate }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '작업자:' }),
                ' ',
                c.jsx('span', { children: o }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '작업내용:' }),
                ' ',
                c.jsx('span', { children: s }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '자재:' }),
                ' ',
                c.jsx('span', { children: i }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '사진:' }),
                ' ',
                c.jsxs('span', { children: [e.photos.length, '장'] }),
              ],
            }),
            c.jsxs('div', {
              children: [
                c.jsx('span', { className: 'font-bold text-text-sub', children: '도면:' }),
                ' ',
                c.jsxs('span', { children: [e.drawings.length, '건'] }),
              ],
            }),
          ],
        }),
    ],
  })
}
function Ok() {
  const { handleSave: e, handleReset: t, state: n } = sn(),
    r = !!(
      n.selectedSite &&
      n.workDate &&
      n.manpowerList.some(o => o.worker) &&
      n.workSets.some(o => o.member && o.process)
    )
  return c.jsxs('div', {
    className:
      'sticky bottom-20 z-40 rounded-2xl border border-border bg-card p-2.5 shadow-xl transition-all',
    children: [
      r &&
        c.jsx('div', {
          className:
            'absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-sky-focus px-4 py-1 text-xs font-bold text-white shadow-lg',
          style: { animation: 'saveReadyPulse 2s ease-in-out infinite' },
          children: '저장 가능',
        }),
      c.jsxs('div', {
        className: 'flex gap-2.5',
        children: [
          c.jsx('button', {
            onClick: () => {
              confirm('모든 입력 내용을 초기화하시겠습니까?') && t()
            },
            className:
              'flex-1 h-[50px] rounded-xl border border-border bg-muted text-[15px] font-bold text-muted-foreground sm:text-base',
            children: '초기화',
          }),
          c.jsx('button', {
            onClick: e,
            className:
              'flex-1 h-[50px] rounded-xl bg-header-navy text-[15px] font-bold text-header-navy-foreground transition-all sm:text-base',
            children: '일지저장',
          }),
        ],
      }),
    ],
  })
}
const Ak = [
    { id: 1, title: '작업일지 양식이 업데이트되었습니다', date: '2026-02-18', read: !1, path: '/worklog' },
    { id: 2, title: '본사 안전점검 결과 등록 요청', date: '2026-02-17', read: !1, path: '/request' },
    { id: 3, title: '자재 단가표 변경 안내', date: '2026-02-15', read: !1, path: '/doc' },
  ],
  updateReadKeyLegacy = 'inopnc_updates_read_ids_v1',
  updateReadKey = 'inopnc_updates_read_keys_v2',
  updateBadgeWindowDays = 7
function getUpdateReadEntryKey(e) {
  return [e.id, e.date || '', e.path || '', e.title || ''].join('::')
}
function isRecentUpdateDate(e, t = updateBadgeWindowDays) {
  if (!e) return !1
  const n = new Date(e)
  if (Number.isNaN(n.getTime())) return !1
  const r = new Date()
  return (
    r.setHours(0, 0, 0, 0),
    n.setHours(0, 0, 0, 0),
    Math.floor((r.getTime() - n.getTime()) / 864e5) >= 0 &&
      Math.floor((r.getTime() - n.getTime()) / 864e5) < t
  )
}
function loadUpdateReadIds() {
  if (typeof window > 'u') return new Set()
  try {
    const e = window.localStorage.getItem(updateReadKey)
    if (e) {
      const t = JSON.parse(e)
      if (Array.isArray(t)) return new Set(t.filter(n => typeof n == 'string'))
    }
  } catch {
  }
  try {
    const e = window.localStorage.getItem(updateReadKeyLegacy)
    if (!e) return new Set()
    const t = JSON.parse(e)
    if (!Array.isArray(t)) return new Set()
    return new Set(
      Ak.filter(n => t.some(r => Number(r) === n.id)).map(n => getUpdateReadEntryKey(n))
    )
  } catch {
    return new Set()
  }
}
function saveUpdateReadIds(e) {
  if (typeof window > 'u') return
  try {
    window.localStorage.setItem(updateReadKey, JSON.stringify(Array.from(e)))
  } catch {}
}
function Lk() {
  const [e, t] = y.useState(() => {
      const n = loadUpdateReadIds()
      return Ak.map(r => ({ ...r, read: n.has(getUpdateReadEntryKey(r)) }))
    }),
    [n, r] = y.useState(!1),
    o = e.filter(i => !i.read && isRecentUpdateDate(i.date)).length,
    s = (i, l) => {
      t(l => {
        const a = l.map(u => (u.id === i ? { ...u, read: !0 } : u)),
          d = new Set(a.filter(u => u.read).map(u => getUpdateReadEntryKey(u)))
        return (saveUpdateReadIds(d), a)
      })
      ;(r(!1), l && inopncNavigate(l))
    }
  return c.jsxs('div', {
    className: 'fixed bottom-4 left-1/2 z-50 -translate-x-1/2',
    children: [
      n &&
        c.jsxs('div', {
          className:
            'absolute bottom-14 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[360px] rounded-2xl border border-border bg-card p-4 shadow-2xl',
          style: { animation: 'dropdownSlide 0.2s ease' },
          children: [
            c.jsx('div', {
              className: 'mb-3 text-base font-bold text-header-navy',
              children: '업데이트 내역',
            }),
            c.jsx('div', {
              className: 'flex flex-col gap-2',
              children: e.map(i =>
                c.jsxs(
                  'button',
                  {
                    onClick: () => s(i.id, i.path),
                    className: `w-full rounded-xl p-3 text-left transition-colors ${i.read ? 'bg-muted text-muted-foreground' : 'bg-primary-bg text-foreground'}`,
                    children: [
                      c.jsx('div', { className: 'text-sm font-bold', children: i.title }),
                      c.jsx('div', {
                        className: 'mt-1 text-xs text-muted-foreground',
                        children: i.date,
                      }),
                    ],
                  },
                  i.id
                )
              ),
            }),
          ],
        }),
      c.jsxs('button', {
        onClick: () => r(!n),
        className:
          'relative flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-lg transition-all hover:shadow-xl active:scale-95',
        'aria-label': o > 0 ? `업데이트 ${o}건 미확인` : '업데이트',
        children: [
          '업데이트',
          c.jsx(Bc, { className: `h-4 w-4 transition-transform ${n ? 'rotate-180' : ''}` }),
          o > 0 &&
            c.jsx('span', {
              className:
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-black text-white shadow-sm ring-2 ring-card animate-pulse',
              children: o > 99 ? '99+' : o,
            }),
        ],
      }),
    ],
  })
}
const by = 'inopnc_recent_sites',
  Ik = 5,
  op = 2,
  La = 'required-focus-flash'
function Dk() {
  if (typeof window > 'u') return []
  try {
    const e = window.localStorage.getItem(by)
    if (!e) return []
    const t = JSON.parse(e)
    return Array.isArray(t) ? t.filter(n => typeof n == 'string') : []
  } catch {
    return []
  }
}
function zk(e) {
  if (!(typeof window > 'u'))
    try {
      window.localStorage.setItem(by, JSON.stringify(e))
    } catch {}
}
function Fk() {
  const { state: e, setChatMode: t, setState: n, selectSite: r, incrementWorklogBadge: A0 } = sn(),
    [o, s] = y.useState(1),
    [i, l] = y.useState([{ text: '현장을 선택해주세요.', isUser: !1 }]),
    [a, u] = y.useState({}),
    [d, f] = y.useState(!1),
    [g, p] = y.useState({ member: '', process: '', type: '' }),
    [b, x] = y.useState(() => Dk()),
    [w, m] = y.useState(''),
    [h, v] = y.useState(!1),
    k = y.useMemo(() => fy(), []),
    N = y.useMemo(() => b.map(C => k.find(_ => _.value === C)).filter(C => !!C), [b, k]),
    j = y.useMemo(() => (N.length > 0 ? N.slice(0, op) : k.slice(0, op)), [N, k]),
    P = y.useMemo(() => new Set(j.map(C => C.value)), [j]),
    T = y.useMemo(() => {
      const C = w.trim().toLowerCase()
      return (
        C ? k.filter(B => B.text.toLowerCase().includes(C)) : k.filter(B => !P.has(B.value))
      ).slice(0, 10)
    }, [k, w, P]),
    I = y.useMemo(() => {
      const C = Array.from(
        new Set(
          e.manpowerList
            .map(_ => _.worker.trim())
            .filter(_ => _ && _ !== '__custom__' && _ !== 'CUSTOM')
        )
      )
      return C.length > 0 ? C : py
    }, [e.manpowerList]),
    D = o === 1 && h && w.trim().length > 0,
    Q = y.useCallback((C, _) => {
      l(B => [...B, { text: C, isUser: _ }])
    }, []),
    U = y.useCallback(
      (C, _ = 800) => {
        ;(f(!0),
          setTimeout(() => {
            ;(f(!1), Q(C, !1))
          }, _))
      },
      [Q]
    ),
    G = C => {
      ;(u(_ => ({ ..._, site: C.text, siteValue: C.value, dept: C.dept })),
        m(''),
        v(!1),
        Q(C.text, !0),
        r(C.value, C.text, C.dept),
        x(_ => {
          const B = [C.value, ..._.filter(H => H !== C.value)].slice(0, Ik)
          return (zk(B), B)
        }),
        U('작업 날짜는 언제인가요?'),
        s(2))
    },
    $ = () => {
      const C = a.date || new Date().toISOString().slice(0, 10),
        _ = new Date(C).toLocaleDateString('ko-KR')
      ;(Q(_, !0), U('작업자는 누구인가요?'), s(3))
    },
    re = C => {
      ;(u(_ => ({ ..._, worker: C })), Q(C, !0), U('부재명과 작업공정을 선택해주세요.'), s(4))
    },
    K = (C, _) => {
      const B = { ...g, [C]: _ }
      if ((p(B), B.member && B.process)) {
        const H = B.type ? ` / 유형:${B.type}` : ''
        ;(Q(`부재:${B.member} / 공정:${B.process}${H}`, !0),
          u(Z => ({ ...Z, ...B })),
          U('작업일지를 저장할까요?'),
          s(5))
      }
    },
    ee = y.useCallback(() => {
      n(C => {
        const _ = { ...C }
        a.date && (_.workDate = a.date)
        const B = (a.worker || '').trim()
        if (B) {
          const H = _.manpowerList.some(ge => (ge.worker || '').trim() === B)
          if (!H) {
            const ge = _.manpowerList.findIndex(he => !(he.worker || '').trim())
            ge >= 0
              ? (_.manpowerList = _.manpowerList.map((he, ve) =>
                  ve === ge ? { ...he, worker: B, isCustom: !1 } : he
                ))
              : (_.manpowerList = [
                  ..._.manpowerList,
                  { id: Date.now(), worker: B, workHours: 1, isCustom: !1, locked: !1 },
                ])
          }
        }
        const Z = (a.member || '').trim(),
          $e = (a.process || '').trim(),
          re = (a.type || '').trim()
        if (Z && $e) {
          const ge = _.workSets.some(
            he =>
              (he.member || '').trim() === Z &&
              (he.process || '').trim() === $e &&
              (re ? (he.type || '').trim() === re : !0)
          )
          if (!ge) {
            const he = _.workSets.findIndex(
              ve =>
                !(ve.member || '').trim() || !(ve.process || '').trim() || !(ve.type || '').trim()
            )
            he >= 0
              ? (_.workSets = _.workSets.map((ve, et) =>
                  et === he
                    ? {
                        ...ve,
                        member: (ve.member || '').trim() || Z,
                        process: (ve.process || '').trim() || $e,
                        type: (ve.type || '').trim() || re,
                      }
                    : ve
                ))
              : (_.workSets = [
                  ..._.workSets,
                  {
                    id: Date.now(),
                    member: Z,
                    process: $e,
                    type: re,
                    location: { block: '', dong: '', floor: '' },
                    isCustomMember: !1,
                    isCustomProcess: !1,
                    customMemberValue: '',
                    customProcessValue: '',
                    customTypeValue: '',
                  },
                ])
          }
        }
        return _
      })
    }, [a, n]),
    W = () => {
      ;(Q('저장 완료!', !0),
        U('작업일지가 저장되었습니다.', 1e3),
        ee(),
        A0(),
        setTimeout(() => t(!1), 3e3))
    },
    R = y.useCallback(
      C => {
        ;(ee(),
          t(!1),
          window.setTimeout(() => {
            const _ = document.getElementById(C)
            _ &&
              (_.scrollIntoView({ behavior: 'smooth', block: 'center' }),
              _.classList.remove(La),
              _.offsetWidth,
              _.classList.add(La),
              window.setTimeout(() => {
                _.classList.remove(La)
              }, 1500))
          }, 220))
      },
      [ee, t]
    )
  return c.jsxs('div', {
    className: 'fixed inset-0 z-[100] flex flex-col bg-background',
    children: [
      c.jsxs('div', {
        className: 'flex items-center justify-between border-b border-border bg-card px-4 py-3',
        children: [
          c.jsx('span', {
            className: 'text-lg font-bold text-header-navy',
            children: '작업일지 작성',
          }),
          c.jsx('button', {
            onClick: () => t(!1),
            className: 'rounded-lg p-1 hover:bg-accent',
            children: c.jsx(Dt, { className: 'h-5 w-5' }),
          }),
        ],
      }),
      c.jsx('div', {
        className: 'flex items-center justify-center gap-2 py-4',
        children: [1, 2, 3, 4, 5].map(C =>
          c.jsx(
            'div',
            {
              className: `h-3 w-3 rounded-full transition-all ${C < o ? 'bg-primary' : C === o ? 'scale-125 bg-primary' : 'bg-border'}`,
            },
            C
          )
        ),
      }),
      c.jsxs('div', {
        className: 'flex-1 overflow-y-auto px-4 pb-4',
        children: [
          i.map((C, _) =>
            c.jsx(
              'div',
              {
                className: `mb-6 ${C.isUser ? 'text-right' : 'text-left'}`,
                style: { animation: 'slideIn 0.3s ease-out' },
                children: c.jsx('div', {
                  className: `inline-block max-w-[85%] rounded-[20px] px-5 py-4 text-base leading-relaxed ${C.isUser ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground shadow-sm'}`,
                  style: { whiteSpace: 'pre-line' },
                  children: C.text,
                }),
              },
              _
            )
          ),
          d &&
            c.jsx('div', {
              className:
                'mb-6 flex items-center gap-1 rounded-[20px] border border-border bg-card px-5 py-4 shadow-sm',
              style: { width: 'fit-content' },
              children: [0, 1, 2].map(C =>
                c.jsx(
                  'div',
                  {
                    className: 'h-2 w-2 rounded-full bg-muted-foreground',
                    style: { animation: `typing 1.4s infinite ${C * 0.2}s` },
                  },
                  C
                )
              ),
            }),
        ],
      }),
      c.jsxs('div', {
        className: `border-t border-border bg-card p-5 overflow-y-auto ${D ? 'max-h-[72vh]' : 'max-h-[56vh]'}`,
        style: { borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' },
        children: [
          o === 1 &&
            c.jsxs('div', {
              className: 'flex flex-col gap-3',
              children: [
                c.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    c.jsx('div', {
                      className: 'px-1 text-xs font-bold text-muted-foreground',
                      children: '최근 현장',
                    }),
                    j.map(C =>
                      c.jsx(
                        'button',
                        {
                          onClick: () => G(C),
                          className:
                            'h-[54px] w-full rounded-xl border border-border bg-card text-[17px] font-semibold text-foreground transition-all hover:border-primary hover:bg-primary-bg',
                          children: C.text,
                        },
                        C.value
                      )
                    ),
                  ],
                }),
                c.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    c.jsx('label', {
                      className: 'px-1 text-xs font-bold text-muted-foreground',
                      children: '현장 검색',
                    }),
                    c.jsx('input', {
                      type: 'text',
                      value: w,
                      onChange: C => {
                        const _ = C.target.value
                        ;(m(_), v(_.trim().length > 0))
                      },
                      onFocus: () => {
                        w.trim().length > 0 && v(!0)
                      },
                      onBlur: () => {
                        window.setTimeout(() => v(!1), 120)
                      },
                      placeholder: '최근 현장에 없으면 검색',
                      className:
                        'h-[50px] w-full rounded-xl border border-border bg-card px-4 text-[15px] font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
                    }),
                    D &&
                      c.jsx('div', {
                        className:
                          'max-h-56 overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl',
                        children:
                          T.length > 0
                            ? T.map(C =>
                                c.jsx(
                                  'button',
                                  {
                                    type: 'button',
                                    onMouseDown: _ => {
                                      ;(_.preventDefault(), G(C))
                                    },
                                    className:
                                      'mb-1 h-[46px] w-full rounded-lg px-3 text-left text-[14px] font-semibold text-foreground transition-all last:mb-0 hover:bg-primary-bg',
                                    children: C.text,
                                  },
                                  `search-${C.value}`
                                )
                              )
                            : c.jsx('div', {
                                className: 'px-3 py-2 text-sm font-medium text-muted-foreground',
                                children: '검색 결과 없음',
                              }),
                      }),
                  ],
                }),
              ],
            }),
          o === 2 &&
            c.jsxs('div', {
              children: [
                c.jsx('label', {
                  className: 'mb-2 block text-[15px] font-bold text-muted-foreground',
                  children: '작업 날짜를 선택해주세요',
                }),
                c.jsx('input', {
                  type: 'date',
                  defaultValue: new Date().toISOString().slice(0, 10),
                  onChange: C => u(_ => ({ ..._, date: C.target.value })),
                  className:
                    'mb-4 h-[54px] w-full rounded-xl border border-border bg-card px-4 text-[17px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                }),
                c.jsx('button', {
                  onClick: $,
                  className:
                    'h-[54px] w-full rounded-xl bg-primary text-[17px] font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90',
                  children: '이 날짜로 진행하기',
                }),
              ],
            }),
          o === 3 &&
            c.jsxs('div', {
              children: [
                c.jsx('label', {
                  className: 'mb-2 block text-[15px] font-bold text-muted-foreground',
                  children: '작업자를 선택해주세요',
                }),
                c.jsx('div', {
                  className: 'grid grid-cols-3 gap-2',
                  children: I.map(C =>
                    c.jsx(
                      'button',
                      {
                        onClick: () => re(C),
                        className:
                          'h-12 rounded-xl border border-border bg-card text-[15px] font-bold transition-all hover:border-primary hover:bg-primary-bg',
                        children: C,
                      },
                      C
                    )
                  ),
                }),
              ],
            }),
          o === 4 &&
            c.jsxs('div', {
              children: [
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsxs('label', {
                      className: 'mb-2 block text-[15px] font-bold text-muted-foreground',
                      children: [
                        '부재명 ',
                        c.jsx('span', { className: 'text-destructive', children: '*' }),
                      ],
                    }),
                    c.jsx('div', {
                      className: 'grid grid-cols-4 gap-2',
                      children: hy.map(C =>
                        c.jsx(
                          'button',
                          {
                            onClick: () => K('member', C),
                            className: `h-12 rounded-xl border text-[15px] font-bold transition-all ${g.member === C ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50'}`,
                            children: C,
                          },
                          C
                        )
                      ),
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsxs('label', {
                      className: 'mb-2 block text-[15px] font-bold text-muted-foreground',
                      children: [
                        '작업공정 ',
                        c.jsx('span', { className: 'text-destructive', children: '*' }),
                      ],
                    }),
                    c.jsx('div', {
                      className: 'grid grid-cols-4 gap-2',
                      children: my.map(C =>
                        c.jsx(
                          'button',
                          {
                            onClick: () => K('process', C),
                            className: `h-12 rounded-xl border text-[15px] font-bold transition-all ${g.process === C ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50'}`,
                            children: C,
                          },
                          C
                        )
                      ),
                    }),
                  ],
                }),
                c.jsxs('div', {
                  className: 'mb-3',
                  children: [
                    c.jsx('label', {
                      className: 'mb-2 block text-[15px] font-bold text-muted-foreground',
                      children: '작업유형',
                    }),
                    c.jsx('div', {
                      className: 'grid grid-cols-4 gap-2',
                      children: gy.map(C =>
                        c.jsx(
                          'button',
                          {
                            onClick: () => K('type', g.type === C ? '' : C),
                            className: `h-12 rounded-xl border text-[15px] font-bold transition-all ${g.type === C ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50'}`,
                            children: C,
                          },
                          C
                        )
                      ),
                    }),
                  ],
                }),
                c.jsx('div', {
                  className: 'mt-2 text-center text-[13px] text-muted-foreground',
                  children: '부재명/작업공정은 필수, 작업유형은 선택입니다',
                }),
              ],
            }),
          o === 5 &&
            c.jsxs('div', {
              children: [
                c.jsx('button', {
                  onClick: W,
                  className:
                    'h-[54px] w-full rounded-xl bg-primary text-[17px] font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90',
                  children: '작업일지 저장하기',
                }),
                c.jsxs('div', {
                  className: 'mt-4 text-center text-[13px] text-muted-foreground whitespace-nowrap',
                  children: [
                    '저장 후',
                    ' ',
                    c.jsx('button', {
                      type: 'button',
                      onClick: () => R('photo-drawing-card'),
                      className:
                        'font-bold text-primary underline decoration-primary/45 underline-offset-2 transition-transform active:scale-[0.98]',
                      children: '사진',
                    }),
                    ' ',
                    '·',
                    ' ',
                    c.jsx('button', {
                      type: 'button',
                      onClick: () => R('material-card'),
                      className:
                        'font-bold text-primary underline decoration-primary/45 underline-offset-2 transition-transform active:scale-[0.98]',
                      children: '자재 사용내역',
                    }),
                    '으로 바로 이동',
                  ],
                }),
              ],
            }),
        ],
      }),
      c.jsx('style', {
        children: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
      }),
    ],
  })
}
function $k() {
  const { chatMode: e } = sn()
  return e
    ? c.jsx(Fk, {})
    : c.jsxs('div', {
        className: 'min-h-screen bg-background',
        children: [
          c.jsxs('div', {
            className: 'mx-auto max-w-[600px] px-3 pb-24 sm:px-4',
            children: [
              c.jsx('div', { className: 'pt-4 pb-4 mt-2', children: c.jsx(hk, {}) }),
              c.jsx(mk, {}),
              c.jsxs('div', {
                className: 'flex flex-col gap-4',
                children: [
                  c.jsx(xk, {}),
                  c.jsx(bk, {}),
                  c.jsx(Sk, {}),
                  c.jsx(kk, {}),
                  c.jsx(Mk, {}),
                  c.jsx(Ok, {}),
                  c.jsx(_k, {}),
                ],
              }),
            ],
          }),
          c.jsx(Lk, {}),
        ],
      })
}
const sp = () => c.jsx(pk, { children: c.jsx($k, {}) }),
  Uk = () => {
    const e = Hs()
    return (
      y.useEffect(() => {
        console.error('404 Error: User attempted to access non-existent route:', e.pathname)
      }, [e.pathname]),
      c.jsx('div', {
        className: 'flex min-h-screen items-center justify-center bg-muted',
        children: c.jsxs('div', {
          className: 'text-center',
          children: [
            c.jsx('h1', { className: 'mb-4 text-4xl font-bold', children: '404' }),
            c.jsx('p', {
              className: 'mb-4 text-xl text-muted-foreground',
              children: 'Oops! Page not found',
            }),
            c.jsx(JS, {
              to: '/',
              className: 'text-primary underline hover:text-primary/90',
              children: 'Return to Home',
            }),
          ],
        }),
      })
    )
  },
  Bk = new Z2(),
  Sy = typeof window < 'u' && window.location.protocol === 'file:',
  Hk = (() => {
    if (typeof window > 'u' || Sy) return '/'
    var e = window.location.pathname || '/',
      t = '/index.html'
    return e.endsWith(t) ? e.slice(0, e.length - 10) : '/'
  })(),
  ip = () =>
    c.jsxs(BS, {
      children: [
        c.jsx(Ii, { path: '/', element: c.jsx(sp, {}) }),
        c.jsx(Ii, { path: '/index.html', element: c.jsx(sp, {}) }),
        c.jsx(Ii, { path: '*', element: c.jsx(Uk, {}) }),
      ],
    }),
  Wk = () =>
    c.jsx(eS, {
      client: Bk,
      children: c.jsxs(j2, {
        children: [
          c.jsx(dw, {}),
          c.jsx(Hw, {}),
          Sy
            ? c.jsx(qS, { children: c.jsx(ip, {}) })
            : c.jsx(GS, { basename: Hk, children: c.jsx(ip, {}) }),
        ],
      }),
    })
Rm(document.getElementById('root')).render(c.jsx(Wk, {}))
