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


export function mostrarToast(msg){
  const t=document.createElement("div");
  t.innerText=msg;
  t.style.position="fixed";
  t.style.bottom="20px";
  t.style.right="20px";
  t.style.background="#22c55e";
  t.style.color="#fff";
  t.style.padding="10px 18px";
  t.style.borderRadius="6px";
  t.style.zIndex="9999";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1500);
}

export function limpiarRapido(){
  const ids=["pNombre","pPrecio","pStock","pMinimo"];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value="";
  });
  const nombre=document.getElementById("pNombre");
  if(nombre) nombre.focus();
}
