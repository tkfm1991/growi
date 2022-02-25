import React, {
  forwardRef,
  ForwardRefRenderFunction, useCallback, useImperativeHandle, useRef,
} from 'react';
import { ISelectable, ISelectableAll } from '~/client/interfaces/selectable-all';
import {
  IPageInfoForListing, IPageWithMeta, isIPageInfoForListing,
} from '~/interfaces/page';
import { IPageSearchMeta } from '~/interfaces/search';
import { useIsGuestUser } from '~/stores/context';
import { useSWRxPageInfoForList } from '~/stores/page';
import { usePageTreeTermManager } from '~/stores/page-listing';
import { useFullTextSearchTermManager } from '~/stores/search';
import { ForceHideMenuItems } from '../Common/Dropdown/PageItemControl';

import { PageListItemL } from '../PageList/PageListItemL';


type Props = {
  pages: IPageWithMeta<IPageSearchMeta>[],
  selectedPageId?: string,
  forceHideMenuItems?: ForceHideMenuItems,
  onPageSelected?: (page?: IPageWithMeta<IPageSearchMeta>) => void,
  onCheckboxChanged?: (isChecked: boolean, pageId: string) => void,
}

const SearchResultListSubstance: ForwardRefRenderFunction<ISelectableAll, Props> = (props:Props, ref) => {
  const {
    pages, selectedPageId,
    forceHideMenuItems,
    onPageSelected,
  } = props;

  const pageIdsWithNoSnippet = pages
    .filter(page => (page.meta?.elasticSearchResult?.snippet.length ?? 0) === 0)
    .map(page => page.data._id);

  const { data: isGuestUser } = useIsGuestUser();
  const { data: idToPageInfo } = useSWRxPageInfoForList(pageIdsWithNoSnippet, true);

  // for mutation
  const { advance: advancePt } = usePageTreeTermManager();
  const { advance: advanceFts } = useFullTextSearchTermManager();

  const itemsRef = useRef<(ISelectable|null)[]>([]);

  // publish selectAll()
  useImperativeHandle(ref, () => ({
    selectAll: () => {
      const items = itemsRef.current;
      if (items != null) {
        items.forEach(item => item != null && item.select());
      }
    },
    deselectAll: () => {
      const items = itemsRef.current;
      if (items != null) {
        items.forEach(item => item != null && item.deselect());
      }
    },
  }));

  const clickItemHandler = useCallback((pageId: string) => {
    if (onPageSelected != null) {
      const selectedPage = pages.find(page => page.data._id === pageId);
      onPageSelected(selectedPage);
    }
  }, [onPageSelected, pages]);

  let injectedPages: (IPageWithMeta<IPageSearchMeta> | IPageWithMeta<IPageInfoForListing & IPageSearchMeta>)[] | undefined;
  // inject data to list
  if (idToPageInfo != null) {
    injectedPages = pages.map((page) => {
      const pageInfo = idToPageInfo[page.data._id];

      if (!isIPageInfoForListing(pageInfo)) {
        // return as is
        return page;
      }

      return {
        data: page.data,
        meta: {
          ...page.meta,
          ...pageInfo,
        },
      } as IPageWithMeta<IPageInfoForListing & IPageSearchMeta>;
    });
  }

  return (
    <ul data-testid="search-result-list" className="page-list-ul list-group list-group-flush">
      { (injectedPages ?? pages).map((page, i) => {
        return (
          <PageListItemL
            key={page.data._id}
            // eslint-disable-next-line no-return-assign
            ref={c => itemsRef.current[i] = c}
            page={page}
            isEnableActions={!isGuestUser}
            isSelected={page.data._id === selectedPageId}
            forceHideMenuItems={forceHideMenuItems}
            onClickItem={clickItemHandler}
            onCheckboxChanged={props.onCheckboxChanged}
            onPageDeleted={() => { advancePt(); advanceFts() }}
          />
        );
      })}
    </ul>
  );

};

export const SearchResultList = forwardRef(SearchResultListSubstance);
