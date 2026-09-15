import i18n from "@/i18n";
import { getMediaBlob, resolveMediaUrl } from "@/services/file-storage";

type RequestOptions = { signal?: AbortSignal };
type ReferenceMediaErrorKey = "invalidReferenceVideo" | "invalidReferenceAudio";

const apiText = (key: ReferenceMediaErrorKey) => i18n.t(`apiErrors.${key}`);

export async function referenceMediaToFile(
    item: { name: string; type?: string; url?: string; storageKey?: string },
    fallbackName: string,
    errorKey: ReferenceMediaErrorKey,
    options?: RequestOptions,
) {
    let blob = item.storageKey ? await getMediaBlob(item.storageKey) : null;
    if (!blob) {
        const url = item.storageKey ? await resolveMediaUrl(item.storageKey, item.url || "") : item.url || "";
        if (!url) throw new Error(apiText(errorKey));
        try {
            blob = await (await fetch(url, { signal: options?.signal })).blob();
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") throw error;
            throw new Error(apiText(errorKey));
        }
    }
    if (!blob.size) throw new Error(apiText(errorKey));
    return new File([blob], item.name || fallbackName, { type: item.type || blob.type || "application/octet-stream" });
}
