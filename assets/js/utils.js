export const appBase = (() => {
  const path = window.location.pathname;
  if (path.endsWith("index.html")) return path.replace(/index\.html$/, "");
  if (path.endsWith("/")) return path;
  const parts = path.split("/");
  parts.pop();
  return parts.join("/") + "/";
})();

export function currency(value, symbol = "$") {
  const n = Number(value || 0);
  return `${symbol}${n.toFixed(2)}`;
}

export function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatDateTime(value) {
  if (!value) return "";
  let d = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleString("es-EC");
}

export function formatDate(value) {
  if (!value) return "";
  let d = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-EC");
}

export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function csvFromRows(rows) {
  return rows
    .map(row => row
      .map(value => {
        const text = String(value ?? "");
        if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
        return text;
      })
      .join(","))
    .join("\n");
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map(v => v.trim());
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const item = {};
    headers.forEach((h, i) => item[h] = (values[i] ?? "").trim());
    return item;
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}


export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `app-toast app-toast-${type}`;
  Object.assign(toast.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "9999",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    color: "#fff",
    background: type === "error" ? "#dc2626" : (type === "warning" ? "#d97706" : "#16a34a"),
    boxShadow: "0 10px 25px rgba(0,0,0,.22)",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "all .18s ease"
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 180);
  }, 1600);
}
