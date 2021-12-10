import React, {
  useCallback, useState, FC, useEffect, memo,
} from 'react';
import nodePath from 'path';
import { useTranslation } from 'react-i18next';

import { ItemNode } from './ItemNode';
import { IPageHasId } from '~/interfaces/page';
import { useSWRxPageChildren } from '../../../stores/page-listing';
import ClosableTextInput, { AlertInfo, AlertType } from '../../Common/ClosableTextInput';
import PageItemControl from '../../Common/Dropdown/PageItemControl';
import { IPageForPageDeleteModal } from '~/components/PageDeleteModal';


interface ItemProps {
  isGuestUser: boolean
  itemNode: ItemNode
  targetId?: string
  isOpen?: boolean
  onClickDeleteByPage?(page: IPageForPageDeleteModal): void
}

// Utility to mark target
const markTarget = (children: ItemNode[], targetId?: string): void => {
  if (targetId == null) {
    return;
  }

  children.forEach((node) => {
    if (node.page._id === targetId) {
      node.page.isTarget = true;
    }
    return node;
  });
};

type ItemControlProps = {
  page: Partial<IPageHasId>
  onClickDeleteButtonHandler?(): void
  onClickPlusButtonHandler?(): void
}

const ItemControl: FC<ItemControlProps> = memo((props: ItemControlProps) => {
  const onClickPlusButton = () => {
    if (props.onClickPlusButtonHandler == null) {
      return;
    }

    props.onClickPlusButtonHandler();
  };

  const onClickDeleteButton = () => {
    if (props.onClickDeleteButtonHandler == null) {
      return;
    }

    props.onClickDeleteButtonHandler();
  };

  if (props.page == null) {
    return <></>;
  }

  return (
    <>
      <PageItemControl page={props.page} onClickDeleteButton={onClickDeleteButton} />
      <button
        type="button"
        className="btn-link nav-link border-0 rounded grw-btn-page-management py-0"
        onClick={onClickPlusButton}
      >
        <i className="icon-plus text-muted"></i>
      </button>
    </>
  );
});

const ItemCount: FC = () => {
  return (
    <>
      <span className="grw-pagetree-count badge badge-pill badge-light">
        {/* TODO: consider to show the number of children pages */}
      </span>
    </>
  );
};

const Item: FC<ItemProps> = (props: ItemProps) => {
  const { t } = useTranslation();
  const {
    itemNode, targetId, isOpen: _isOpen = false, onClickDeleteByPage, isGuestUser,
  } = props;

  const { page, children } = itemNode;

  const [currentChildren, setCurrentChildren] = useState(children);
  const [isOpen, setIsOpen] = useState(_isOpen);

  const [isNewPageInputShown, setNewPageInputShown] = useState(false);

  const { data, error } = useSWRxPageChildren(isOpen ? page._id : null);

  const hasChildren = useCallback((): boolean => {
    return currentChildren != null && currentChildren.length > 0;
  }, [currentChildren]);

  const onClickLoadChildren = useCallback(async() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const onClickDeleteButtonHandler = useCallback(() => {
    if (onClickDeleteByPage == null) {
      return;
    }

    const { _id: pageId, revision: revisionId, path } = page;

    if (pageId == null || revisionId == null || path == null) {
      throw Error('Any of _id, revision, and path must not be null.');
    }

    const pageToDelete: IPageForPageDeleteModal = {
      pageId,
      revisionId: revisionId as string,
      path,
    };

    onClickDeleteByPage(pageToDelete);
  }, [page, onClickDeleteByPage]);

  const inputValidator = (title: string | null): AlertInfo | null => {
    if (title == null || title === '') {
      return {
        type: AlertType.ERROR,
        message: t('Page title is required'),
      };
    }

    return null;
  };

  // TODO: go to create page page
  const onPressEnterHandler = () => {
    console.log('Enter key was pressed!');
  };

  // didMount
  useEffect(() => {
    if (hasChildren()) setIsOpen(true);
  }, []);

  /*
   * Make sure itemNode.children and currentChildren are synced
   */
  useEffect(() => {
    if (children.length > currentChildren.length) {
      markTarget(children, targetId);
      setCurrentChildren(children);
    }
  }, []);

  /*
   * When swr fetch succeeded
   */
  useEffect(() => {
    if (isOpen && error == null && data != null) {
      const newChildren = ItemNode.generateNodesFromPages(data.children);
      markTarget(newChildren, targetId);
      setCurrentChildren(newChildren);
    }
  }, [data]);

  // TODO: improve style
  const opacityStyle = { opacity: 1.0 };
  if (page.isTarget) opacityStyle.opacity = 0.7;

  const buttonClass = isOpen ? 'rotate' : '';

  return (
    <div className="grw-pagetree-item-wrapper">
      <div style={opacityStyle} className="grw-pagetree-item d-flex align-items-center">
        <button
          type="button"
          className={`grw-pagetree-button btn ${buttonClass}`}
          onClick={onClickLoadChildren}
        >
          <i className="icon-control-play"></i>
        </button>
        <a href={page._id} className="grw-pagetree-title-anchor flex-grow-1">
          <p className="grw-pagetree-title m-auto">{nodePath.basename(page.path as string) || '/'}</p>
        </a>
        <div className="grw-pagetree-count-wrapper">
          <ItemCount />
        </div>
        <div className="grw-pagetree-control d-none">
          {!isGuestUser && (
            <ItemControl
              page={page}
              onClickDeleteButtonHandler={onClickDeleteButtonHandler}
              onClickPlusButtonHandler={() => { setNewPageInputShown(true) }}
            />
          )}
        </div>
      </div>

      {!isGuestUser && (
        <ClosableTextInput
          isShown={isNewPageInputShown}
          placeholder={t('Input title')}
          onClickOutside={() => { setNewPageInputShown(false) }}
          onPressEnter={onPressEnterHandler}
          inputValidator={inputValidator}
        />
      )}
      {
        isOpen && hasChildren() && currentChildren.map(node => (
          <Item
            key={node.page._id}
            isGuestUser={isGuestUser}
            itemNode={node}
            isOpen={false}
            onClickDeleteByPage={onClickDeleteByPage}
          />
        ))
      }
    </div>
  );

};

export default Item;
