type rawApodApiData = {
    "date": string,
    "explanation": string,
    "hdurl": string,
    "media_type": string,
    "service_version": string,
    "title": string,
    "url": string
}

type apodData = {
    "date": string,
    "explanation": string,
    "hdurl": string,
    "media_type": string,
    "service_version": string,
    "title": string,
    "url": string,
    "encodedImage"?: string,
    "isStarred": boolean
}

type apiError = {
    "error": errResponse
}

type errResponse = {
    "code": string,
    "message": string
}

export const getAPODData = async (date: string = ''): Promise<apodData | apiError> => {
    if (import.meta.client) {
        const stored = localStorage.getItem(`apod-${date}`);
        if (stored) {
            const localData = JSON.parse(stored);
            if (localData.date === date) {
                return localData;
            }
        }
    }
    const runtimeConfig = useRuntimeConfig();
    const apiKey = runtimeConfig.public.apodApiKey;
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
    if(response.status !== 200) {
        const errorData: apiError = await response.json();
        return errorData;
    }
    const rawData: rawApodApiData = await response.json();
    const data: apodData = { ...rawData, isStarred: false };
    setAPODData(data);
    return data;
};

export const setAPODData = (data: apodData): void => {
    if (import.meta.client) {
        const items = JSON.parse(localStorage.getItem("apod-items") || "[]");
        if (!items.includes(data.date)) {
            items.push(data.date);
            items.sort();
            localStorage.setItem("apod-items", JSON.stringify(items));
        }
        if(data.isStarred) {
            const starredItems = JSON.parse(localStorage.getItem("apod-starred-items") || "[]");
            if (!starredItems.includes(data.date)) {
                starredItems.push(data.date);
                starredItems.sort();
                localStorage.setItem("apod-starred-items", JSON.stringify(starredItems));
            }
        } else {
            if(JSON.parse(localStorage.getItem("apod-starred-items") || "[]").includes(data.date)) {
                const starredItems = JSON.parse(localStorage.getItem("apod-starred-items") || "[]").filter((item: string) => item !== data.date);
                localStorage.setItem("apod-starred-items", JSON.stringify(starredItems));
            }
        }
        if(data.encodedImage) {
            const downloadedItems = JSON.parse(localStorage.getItem("apod-downloaded-items") || "[]");
            if (!downloadedItems.includes(data.date)) {
                downloadedItems.push(data.date);
                downloadedItems.sort();
                localStorage.setItem("apod-downloaded-items", JSON.stringify(downloadedItems));
            }
        }
        localStorage.setItem(`apod-${data.date}`, JSON.stringify(data));
    }
}

export const getCurrentDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    return date;
}

export async function downloadImage(date: string) {
    const data = await getAPODData(date);
    if ('error' in data) {
        throw new Error(data.error.message);
    }
    const buffer = await $fetch<ArrayBuffer>(data.hdurl, { responseType: 'arrayBuffer' });
    const encodedImage = window.btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return encodedImage;
}
