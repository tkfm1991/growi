import React from 'react';
import PropTypes from 'prop-types';
import { templateChecker, pagePathUtils } from '@growi/core';
import FootstampIcon from '../../../../app/src/components/FootstampIcon';

const { isTopPage } = pagePathUtils;
const { checkTemplatePath } = templateChecker;

export class PageListMeta extends React.Component {

  render() {
    const { page } = this.props;

    // top check
    let topLabel;
    if (isTopPage(page.path)) {
      topLabel = <span className="badge badge-info">TOP</span>;
    }

    // template check
    let templateLabel;
    if (checkTemplatePath(page.path)) {
      templateLabel = <span className="badge badge-info">TMPL</span>;
    }

    let commentCount;
    if (page.commentCount > 0) {
      commentCount = <span><i className="icon-bubble" />{page.commentCount}</span>;
    }

    let likerCount;
    if (page.liker.length > 0) {
      likerCount = <span><i className="icon-like" />{page.liker.length}</span>;
    }

    let locked;
    if (page.grant !== 1) {
      locked = <span><i className="icon-lock" /></span>;
    }

    let seenUserCount;
    if (page.seenUserCount > 0) {
      seenUserCount = (
        <>
          <span className="footstamp-icon"><FootstampIcon /></span>
          {page.seenUsers.length}
        </>
      );
    }

    return (
      <span className="page-list-meta">
        {topLabel}
        {templateLabel}
        {commentCount}
        {likerCount}
        {locked}
        {seenUserCount}
      </span>
    );
  }

}

PageListMeta.propTypes = {
  page: PropTypes.object.isRequired,
};

PageListMeta.defaultProps = {
};
