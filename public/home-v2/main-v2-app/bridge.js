(function () {
  var HOME_DRAFT_KEY = "inopnc_work_log";
  var MESSAGE_TYPE = "inopnc:home-bridge";
  var PROTOCOL_VERSION = 1;
  var SOURCE = "home-v2-bridge";
  var dirty = false;

  function nowIso() {
    return new Date().toISOString();
  }

  function post(phase, payload) {
    try {
      if (!window.parent || window.parent === window) return;
      window.parent.postMessage(
        Object.assign(
          {
            type: MESSAGE_TYPE,
            phase: phase,
            source: SOURCE,
            protocolVersion: PROTOCOL_VERSION,
            timestamp: nowIso(),
          },
          payload || {}
        ),
        window.location.origin
      );
    } catch {}
  }

  function readRaw() {
    try {
      return window.localStorage.getItem(HOME_DRAFT_KEY) || "";
    } catch {
      return "";
    }
  }

  function makeRequestId() {
    return "home-save-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function markDirty(reason) {
    if (dirty) return;
    dirty = true;
    post("draft-changed", { reason: reason || "input" });
  }

  function patchStorage() {
    if (typeof Storage === "undefined") return;

    var originalSetItem = Storage.prototype.setItem;
    var originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key, value) {
      try {
        var result = originalSetItem.apply(this, arguments);
        if (key === HOME_DRAFT_KEY) {
          dirty = false;
          post("save-requested", {
            requestId: makeRequestId(),
            raw: String(value || ""),
          });
        }
        return result;
      } catch (error) {
        if (key === HOME_DRAFT_KEY) {
          post("storage-save-failed", {
            code: "storage-save-failed",
            message: error instanceof Error ? error.message : String(error),
          });
        }
        throw error;
      }
    };

    Storage.prototype.removeItem = function (key) {
      var result = originalRemoveItem.apply(this, arguments);
      if (key === HOME_DRAFT_KEY) {
        dirty = false;
        post("draft-cleared", { raw: readRaw() });
      }
      return result;
    };
  }

  function shouldIgnoreClick(target) {
    var button = target && typeof target.closest === "function" ? target.closest("button") : null;
    if (!button) return true;
    var label = (button.textContent || "").replace(/\s+/g, "");
    return label.includes("일지저장") || label.includes("초기화");
  }

  function bindDirtyListeners() {
    document.addEventListener(
      "input",
      function () {
        markDirty("input");
      },
      true
    );
    document.addEventListener(
      "change",
      function () {
        markDirty("change");
      },
      true
    );
    document.addEventListener(
      "click",
      function (event) {
        if (shouldIgnoreClick(event.target)) return;
        markDirty("click");
      },
      true
    );
  }

  function bindParentStatus() {
    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      var data = event.data;
      if (!data || data.type !== MESSAGE_TYPE || data.source !== "home-react-parent") return;
      if (data.phase === "save-succeeded" || data.phase === "draft-cleared") {
        dirty = false;
      }
      if (data.phase === "save-failed") {
        dirty = true;
      }
      try {
        window.dispatchEvent(
          new CustomEvent("inopnc:home-bridge-status", {
            detail: data,
          })
        );
      } catch {}
    });
  }

  patchStorage();
  bindDirtyListeners();
  bindParentStatus();
})();
