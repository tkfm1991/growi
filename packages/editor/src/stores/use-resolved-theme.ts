import { ColorScheme } from '@growi/core';
import { useSWRStatic } from '@growi/core/dist/swr';
import type { SWRResponse } from 'swr';
import { mutate } from 'swr';

type ResolvedThemeStatus = {
  themeData: ColorScheme,
}

type ResolvedThemeUtils = {
  mutateResolvedThemeForEditor(resolvedTheme: ColorScheme): void
}

export const useResolvedThemeForEditor = (): SWRResponse<ResolvedThemeStatus, Error> & ResolvedThemeUtils => {
  const swrResponse = useSWRStatic<ResolvedThemeStatus, Error>('resolvedTheme');

  const mutateResolvedThemeForEditor = (resolvedTheme: ColorScheme) => {
    mutate({ themeData: resolvedTheme });
  };

  return {
    ...swrResponse,
    mutateResolvedThemeForEditor,
  };
};
