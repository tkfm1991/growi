import type {
  ForwardRefRenderFunction,
} from 'react';
import React, {
  forwardRef, useCallback,
} from 'react';

import type { IFocusable } from '~/client/interfaces/focusable';
import type { TypeaheadProps } from '~/client/interfaces/react-bootstrap-typeahead';

import { useSearchModal } from '../../features/search/client/stores/search';

type Props = TypeaheadProps & {
  keywordOnInit: string,
};

const SearchModalTriggerinput: ForwardRefRenderFunction<IFocusable, Props> = (props: Props) => {
  const { keywordOnInit } = props;

  const { open: openSearchModal } = useSearchModal();

  const inputClickHandler = useCallback(() => {
    openSearchModal(keywordOnInit);
  }, [openSearchModal, keywordOnInit]);

  return (
    <div>
      <input
        className="form-control"
        type="input"
        data-testid="open-search-modal-button"
        value={keywordOnInit}
        onClick={inputClickHandler}
        readOnly
      />
    </div>
  );
};

export default SearchModalTriggerinput;
