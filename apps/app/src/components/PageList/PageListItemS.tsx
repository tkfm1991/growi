import React from 'react';

import { PageListMeta } from '@growi/ui/dist/components/PagePath/PageListMeta';
import { PagePathLabel } from '@growi/ui/dist/components/PagePath/PagePathLabel';
import { UserPicture } from '@growi/ui/dist/components/User/UserPicture';
import Clamp from 'react-multiline-clamp';

import { IPageHasId } from '~/interfaces/page';

import styles from './PageListItemS.module.scss';

type PageListItemSProps = {
  page: IPageHasId,
  noLink?: boolean,
  pageTitle?: string
  isNarrowView?: boolean,
}

export const PageListItemS = (props: PageListItemSProps): JSX.Element => {

  const {
    page,
    noLink = false,
    pageTitle,
    isNarrowView = false,
  } = props;

  const path = pageTitle != null ? pageTitle : page.path;

  let pagePathElement = <PagePathLabel path={path} additionalClassNames={['mx-1']} />;
  if (!noLink) {
    pagePathElement = <a className="text-break" href={page.path}>{pagePathElement}</a>;
  }

  return (
    <>
      {isNarrowView ? (
        <div className={`d-flex ${styles['page-list']}`}>
          <UserPicture user={page.lastUpdateUser} noLink={noLink} />
          <div className="mx-2 page-title">
            <Clamp lines={2}>{pagePathElement}</Clamp>
          </div>
          <span className="ml-2 page-list-ul">
            <PageListMeta page={page} />
          </span>
        </div>
      ) : (
        <>
          <UserPicture user={page.lastUpdateUser} noLink={noLink} />
          {pagePathElement}
          <span className="ml-2">
            <PageListMeta page={page} />
          </span>
        </>
      )}
    </>
  );

};
