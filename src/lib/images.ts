export function stripDataUrlPrefix(dataUrl: string): string {
  const i = dataUrl.indexOf("base64,");
  return i >= 0 ? dataUrl.slice(i + "base64,".length) : dataUrl;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlPrefix(String(reader.result)));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Zmniejsza zdjęcie w przeglądarce (dłuższa krawędź do maxEdge, JPEG) i zwraca
// base64 bez nagłówka data URL. Trzyma żądanie poniżej limitu Vercela (~4.5 MB)
// i obniża koszt rozpoznawania, zachowując dość detali do odczytu monety.
export function downscaleImage(file: File, maxEdge = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.width, img.height) || 1;
      const scale = Math.min(1, maxEdge / longest);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Brak kontekstu canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(stripDataUrlPrefix(canvas.toDataURL("image/jpeg", quality)));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się wczytać zdjęcia"));
    };
    img.src = url;
  });
}
