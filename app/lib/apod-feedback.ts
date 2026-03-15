import type { ApiError } from './api';

export const showApodLoadErrorToast = (toast: ReturnType<typeof useToast>, error: ApiError): void => {
  if (error.error.code === 'OVER_RATE_LIMIT') {
    toast.add({
      title: 'Error',
      description: 'API rate limit exceeded. Open settings and configure your own API key.',
      color: 'error',
      actions: [
        {
          trailingIcon: 'i-lucide-arrow-right',
          label: 'Open Settings',
          color: 'neutral',
          variant: 'outline',
          onClick: () => {
            void navigateTo('/settings');
          }
        }
      ]
    });
    return;
  }

  toast.add({
    title: 'Error',
    description: `Unknown error occurred: ${error.error.message}`,
    color: 'error'
  });
};

export const showImageRemovedToast = (toast: ReturnType<typeof useToast>): void => {
  toast.add({
    title: 'Deleted',
    description: 'Removed the browser-saved image.',
    color: 'warning'
  });
};
