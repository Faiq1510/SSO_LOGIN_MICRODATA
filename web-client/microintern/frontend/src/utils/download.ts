import { resolveFileUrl } from "./fileUrl";

export const downloadTextFile = (filename: string, content: string, mimeType = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  if (mimeType.includes("pdf") || mimeType.includes("image")) {
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.focus();
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  }
};

export const viewDocument = (_title: string, url: string | null) => {
  if (!url) return;
  const fullUrl = resolveFileUrl(url);
  if (fullUrl) {
    const newWindow = window.open(fullUrl, "_blank");
    if (newWindow) newWindow.focus();
  }
};
