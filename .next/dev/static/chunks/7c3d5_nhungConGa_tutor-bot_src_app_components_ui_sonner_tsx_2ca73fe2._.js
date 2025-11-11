(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/src/app/components/ui/sonner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const Toaster = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(9);
    if ($[0] !== "e8fc9d602b7aa12a983830aba4033222ad8eebdc5dcf682fb04e4806b7e76609") {
        for(let $i = 0; $i < 9; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "e8fc9d602b7aa12a983830aba4033222ad8eebdc5dcf682fb04e4806b7e76609";
    }
    let props;
    if ($[1] !== t0) {
        ({ ...props } = t0);
        $[1] = t0;
        $[2] = props;
    } else {
        props = $[2];
    }
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("light");
    let t1;
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ()=>{
            const isDark = document.documentElement.classList.contains("dark");
            setTheme(isDark ? "dark" : "light");
            const observer = new MutationObserver((mutations)=>{
                mutations.forEach((mutation)=>{
                    if (mutation.attributeName === "class") {
                        const isDark_0 = document.documentElement.classList.contains("dark");
                        setTheme(isDark_0 ? "dark" : "light");
                    }
                });
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            });
            return ()=>observer.disconnect();
        };
        t2 = [];
        $[3] = t1;
        $[4] = t2;
    } else {
        t1 = $[3];
        t2 = $[4];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)"
        };
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== props || $[7] !== theme) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Documents$2f$College$2f$miscellaneous$2f$VS__Code__Miscs$2f$Naver__Hackathon__2025$2f$nhungConGa$2f$tutor$2d$bot$2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
            theme: theme,
            className: "toaster group",
            style: t3,
            ...props
        }, void 0, false, {
            fileName: "[project]/OneDrive/Documents/College/miscellaneous/VS Code Miscs/Naver Hackathon 2025/nhungConGa/tutor-bot/src/app/components/ui/sonner.tsx",
            lineNumber: 66,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[6] = props;
        $[7] = theme;
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    return t4;
};
_s(Toaster, "lm84LOZxHN0YC4jzvAwAP/18Sno=");
_c = Toaster;
;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=7c3d5_nhungConGa_tutor-bot_src_app_components_ui_sonner_tsx_2ca73fe2._.js.map