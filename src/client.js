// dsh-imgcmp client half — floating two-image duplicate checker widget.
//
// Registers a floating widget in the `shell.overlay` slot: a bottom-right
// capsule button that expands into the upload + compare panel. The compare
// request goes to the host half over POST /api/dsh-imgcmp/compare.
window.__ModuleLoader__.load({
	id: "dsh-imgcmp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var react = require("react");

		const name = "dsh-imgcmp-client";
		const inject = ["slots"];

		const CSS = `
.dd-float{position:fixed;right:24px;bottom:24px;z-index:2147483000;pointer-events:auto;font-size:13px;color:var(--dsw-alias-label-primary)}
.dd-fab{display:flex;align-items:stretch;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);box-shadow:0 6px 20px rgba(0,0,0,.22);overflow:hidden}
.dd-fab-main{padding:11px 14px;border:none;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px;font-weight:600}
.dd-fab-main:hover{background:var(--dsw-alias-bg-layer-1)}
.dd-fab-x{padding:11px 14px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:15px;line-height:1;border-left:1px solid var(--dsw-alias-border-l2)}
.dd-fab-x:hover{background:var(--dsw-alias-state-error-primary);color:#fff}
.dd-reopen{width:36px;height:36px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,.18);opacity:.65}
.dd-reopen:hover{opacity:1;color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}
.dd-panel{width:min(700px,calc(100vw - 48px));max-height:calc(100vh - 140px);overflow:auto;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.28);padding:16px}
.dd-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.dd-panel-title{font-weight:700;font-size:15px;color:var(--dsw-alias-label-primary)}
.dd-close{border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary);padding:2px 10px;border-radius:6px}
.dd-close:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.ddup{padding:0;font-size:13px;color:var(--dsw-alias-label-primary)}
.ddup-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin:0 0 12px}
.ddup-row{display:flex;gap:10px;flex-wrap:wrap}
.ddup-file{flex:1;min-width:190px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:10px;background:var(--dsw-alias-bg-layer-1)}
.ddup-lbl{font-weight:600;display:block;margin-bottom:6px}
.ddup-name{font-weight:400;color:var(--dsw-alias-label-secondary)}
.ddup-thumb{max-width:100%;max-height:120px;display:block;margin:8px 0;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);object-fit:contain}
.ddup-file input{display:block;font-size:12px;max-width:100%;color:var(--dsw-alias-label-secondary)}
.ddup-ctl{display:flex;align-items:center;gap:10px;margin:12px 0}
.ddup-thr{width:64px;margin-left:6px;padding:5px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.ddup-btn{padding:7px 20px;border-radius:8px;border:none;background:var(--dsw-alias-brand-primary);color:#fff;cursor:pointer;font-size:13px;font-weight:600}
.ddup-btn:disabled{opacity:.5;cursor:not-allowed}
.ddup-err{color:var(--dsw-alias-state-error-primary);margin:8px 0;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-error-primary)}
.ddup-result{margin-top:6px}
.ddup-banner{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-left:4px solid var(--dsw-alias-state-error-primary)}
.ddup-banner.ddup-ok{border-left-color:var(--dsw-alias-state-success-primary)}
.ddup-banner-icon{font-size:24px;line-height:1}
.ddup-banner-title{font-weight:700;font-size:15px;color:var(--dsw-alias-state-error-primary)}
.ddup-banner.ddup-ok .ddup-banner-title{color:var(--dsw-alias-state-success-primary)}
.ddup-banner-sub{color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:2px}
.ddup-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-top:10px}
.ddup-metric{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 6px;text-align:center}
.ddup-metric-v{font-size:16px;font-weight:700;color:var(--dsw-alias-label-primary)}
.ddup-metric-k{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.ddup-sec{font-weight:600;font-size:11px;color:var(--dsw-alias-label-secondary);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em}
.ddup-row2{display:flex;gap:10px;flex-wrap:wrap}
.ddup-fig{flex:1;min-width:190px;margin:0}
.ddup-fig img,.ddup-fig-full img{width:100%;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);display:block;background:var(--dsw-alias-bg-layer-2)}
.ddup-figcap{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:4px;text-align:center}
.ddup-fig-full{margin:0}
`;

		function readFile(file, cb, errCb) {
			var fr = new FileReader();
			fr.onload = function () { cb(fr.result); };
			fr.onerror = function () { errCb(); };
			fr.readAsDataURL(file);
		}

		var TFM = {
			id: "原样", rot90: "顺时针 90°", rot180: "旋转 180°", rot270: "逆时针 90°",
			flip_h: "水平翻转", flip_v: "垂直翻转", transpose: "转置", transverse: "反对角翻转",
		};
		function tfName(t) { return TFM[t] || (t || "—"); }

		async function compareImages(a, b, threshold) {
			const res = await fetch("/api/dsh-imgcmp/compare", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ a, b, threshold }),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok || data === null || data.error) {
				throw new Error((data && data.error) || ("HTTP " + res.status));
			}
			return data;
		}

		function Upload(p) {
			return react.createElement("div", { className: "ddup-file" },
				react.createElement("label", { className: "ddup-lbl" }, p.label, " ",
					react.createElement("span", { className: "ddup-name" }, p.name || "未选择")),
				p.value ? react.createElement("img", { className: "ddup-thumb", src: p.value }) : null,
				react.createElement("input", { type: "file", accept: "image/*", onChange: p.onPick })
			);
		}

		function metric(k, v) {
			return react.createElement("div", { className: "ddup-metric" },
				react.createElement("div", { className: "ddup-metric-v" }, String(v)),
				react.createElement("div", { className: "ddup-metric-k" }, k)
			);
		}

		function fig(src, label) {
			return src ? react.createElement("figure", { className: "ddup-fig" },
				react.createElement("img", { src: src }),
				react.createElement("figcaption", { className: "ddup-figcap" }, "图 " + label)
			) : null;
		}

		function Result(p) {
			var r = p.r;
			var im = r.images || {};
			var ok = r.duplicate;
			var ratio = r.inlier_ratio != null ? r.inlier_ratio.toFixed(2) : "—";
			return react.createElement("div", { className: "ddup-result" },
				react.createElement("div", { className: ok ? "ddup-banner" : "ddup-banner ddup-ok" },
					react.createElement("span", { className: "ddup-banner-icon" }, ok ? "⚠" : "✓"),
					react.createElement("div", null,
						react.createElement("div", { className: "ddup-banner-title" }, ok ? "疑似重复" : "不重复"),
						react.createElement("div", { className: "ddup-banner-sub" }, "几何内点 " + r.inliers + " ≥ 阈值 " + r.threshold)
					)
				),
				react.createElement("div", { className: "ddup-metrics" },
					metric("匹配点", r.n_matches),
					metric("几何内点", r.inliers),
					metric("内点比率", ratio),
					metric("B 对齐", tfName(r.best_transform))
				),
				react.createElement("div", { className: "ddup-sec" }, "重复区域"),
				react.createElement("div", { className: "ddup-row2" },
					fig(im.regionA, "A"),
					fig(im.regionB, "B")
				),
				im.matches ? react.createElement("div", null,
					react.createElement("div", { className: "ddup-sec" }, "特征点匹配"),
					react.createElement("figure", { className: "ddup-fig-full" },
						react.createElement("img", { src: im.matches }),
						react.createElement("figcaption", { className: "ddup-figcap" }, "绿线 = 几何内点 · 红线 = 外点")
					)
				) : null
			);
		}

		function CompareBody() {
			var a = react.useState(null), b = react.useState(null);
			var an = react.useState(""), bn = react.useState("");
			var thr = react.useState("12");
			var busy = react.useState(false);
			var err = react.useState(null);
			var res = react.useState(null);

			var pick = function (setV, setN) {
				return function (ev) {
					var file = ev.target.files && ev.target.files[0];
					if (!file) return;
					if (file.size > 15 * 1024 * 1024) { err[1]("图片超过 15MB"); return; }
					readFile(file, function (url) { setV(url); setN(file.name); res[1](null); err[1](null); }, function () { err[1]("读取文件失败"); });
				};
			};

			var run = function () {
				if (!a[0] || !b[0]) { err[1]("请先选择两张图片"); return; }
				busy[1](true); err[1](null); res[1](null);
				compareImages(a[0], b[0], parseInt(thr[0], 10) || 12)
					.then(function (r) { res[1](r); busy[1](false); })
					.catch(function (e) { err[1](String(e && e.message ? e.message : e)); busy[1](false); });
			};

			return react.createElement("div", { className: "ddup" },
				react.createElement("div", { className: "ddup-sub" }, "SuperPoint 特征点 + RANSAC 几何校验 · 支持翻转 / 旋转 / 拉伸"),
				react.createElement("div", { className: "ddup-row" },
					react.createElement(Upload, { label: "图片 A", value: a[0], name: an[0], onPick: pick(a[1], an[1]) }),
					react.createElement(Upload, { label: "图片 B", value: b[0], name: bn[0], onPick: pick(b[1], bn[1]) })
				),
				react.createElement("div", { className: "ddup-ctl" },
					react.createElement("label", null, "阈值 ",
						react.createElement("input", { type: "number", min: 1, value: thr[0], onChange: function (e) { thr[1](e.target.value); }, className: "ddup-thr" })),
					react.createElement("button", { className: "ddup-btn", onClick: run, disabled: busy[0] || !a[0] || !b[0] }, busy[0] ? "比对中…" : "查重")
				),
				err[0] ? react.createElement("div", { className: "ddup-err" }, err[0]) : null,
				res[0] ? react.createElement(Result, { r: res[0] }) : null
			);
		}

		function Widget() {
			// 0 = 收起胶囊，1 = 展开面板，2 = 已关闭（隐藏）
			var mode = react.useState(0);
			if (mode[0] === 2) {
				return react.createElement("div", { className: "dd-float" },
					react.createElement("button", { className: "dd-reopen", title: "重新打开图片查重", onClick: function () { mode[1](0); } }, "◂")
				);
			}
			if (mode[0] === 1) {
				return react.createElement("div", { className: "dd-float" },
					react.createElement("div", { className: "dd-panel" },
						react.createElement("div", { className: "dd-panel-head" },
							react.createElement("span", { className: "dd-panel-title" }, "图片查重"),
							react.createElement("button", { className: "dd-close", onClick: function () { mode[1](0); }, title: "收起" }, "×")
						),
						react.createElement(CompareBody, null)
					)
				);
			}
			return react.createElement("div", { className: "dd-float" },
				react.createElement("div", { className: "dd-fab" },
					react.createElement("button", { className: "dd-fab-main", onClick: function () { mode[1](1); } }, "图片查重"),
					react.createElement("button", { className: "dd-fab-x", onClick: function () { mode[1](2); }, title: "关闭" }, "×")
				)
			);
		}

		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === undefined) return;
			const style = document.createElement("style");
			style.textContent = CSS;
			document.head.appendChild(style);
			ctx.effect(() => () => { style.remove(); }, "dsh-imgcmp: css");

			slots.inject("shell.overlay", () => slots.register(
				{ name: "shell.overlay", id: "imgcmp-widget", label: "图片查重" },
				() => react.createElement(Widget, null)
			));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
