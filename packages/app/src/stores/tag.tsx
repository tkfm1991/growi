import useSWR, { SWRResponse } from 'swr';
import { ITagDataHasId } from '~/interfaces/tag';
import { apiGet } from '~/client/util/apiv1-client';

type ITagDataListResponse = {
  data: ITagDataHasId[],
  totalCount: number,
}

export const useSWRxTagDataList = (
    limit: number,
    offset: number,
): SWRResponse<ITagDataListResponse, Error> => {
  return useSWR(
    `/tags.list?limit=${limit}&offset=${offset}`,
    endpoint => apiGet(endpoint).then((response: ITagDataListResponse) => {
      return {
        data: response.data,
        totalCount: response.totalCount,
      };
    }),
  );
};
