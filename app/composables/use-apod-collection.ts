import { getCachedImagesByApods, getManyAPODData, type ApodData } from '~/lib/api';

export const useApodCollection = (getDates: () => string[]) => {
  const loading = ref(true);
  const items = ref<ApodData[]>([]);
  const localImages = ref<Record<string, string>>({});

  const load = async () => {
    const dates = getDates();
    if (!dates.length) {
      loading.value = false;
      return;
    }

    items.value = await getManyAPODData(dates);
    localImages.value = await getCachedImagesByApods(items.value);
    loading.value = false;
  };

  const imageSource = (item: ApodData): string => {
    return localImages.value[item.date] || item.url;
  };

  const removeLocalImageByDate = (date: string): void => {
    const nextImages = { ...localImages.value };
    delete nextImages[date];
    localImages.value = nextImages;
  };

  onMounted(load);

  return {
    loading,
    items,
    localImages,
    imageSource,
    removeLocalImageByDate
  };
};
