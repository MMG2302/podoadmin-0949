// Safari polyfills for older versions
// Object.entries polyfill
if (!Object.entries) {
        Object.entries = function <T>(obj: { [s: string]: T } | ArrayLike<T>): [string, T][] {
                return Object.keys(obj).map((key) => [key, (obj as Record<string, T>)[key]]);
        };
}

// Object.values polyfill
if (!Object.values) {
        Object.values = function <T>(obj: { [s: string]: T } | ArrayLike<T>): T[] {
                return Object.keys(obj).map((key) => (obj as Record<string, T>)[key]);
        };
}

// Array.from polyfill for older Safari
if (!Array.from) {
        Array.from = function <T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
                return Array.prototype.slice.call(arrayLike);
        };
}

// Object.assign polyfill
if (typeof Object.assign !== "function") {
        Object.assign = function <T extends object>(target: T, ...sources: Partial<T>[]): T {
                if (target === null || target === undefined) {
                        throw new TypeError("Cannot convert undefined or null to object");
                }
                const to = Object(target);
                for (const source of sources) {
                        if (source !== null && source !== undefined) {
                                for (const key in source) {
                                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                                                to[key] = source[key];
                                        }
                                }
                        }
                }
                return to;
        };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
        String.prototype.includes = function (search: string, start?: number): boolean {
                if (typeof start !== "number") {
                        start = 0;
                }
                if (start + search.length > this.length) {
                        return false;
                }
                return this.indexOf(search, start) !== -1;
        };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
        Array.prototype.includes = function <T>(searchElement: T, fromIndex?: number): boolean {
                return this.indexOf(searchElement, fromIndex) !== -1;
        };
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import "./styles.css";
import App from "./app.tsx";

createRoot(document.getElementById("root")!).render(
        <StrictMode>
                <Router>
                        <App />
                </Router>
        </StrictMode>,
);
