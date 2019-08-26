import React from 'react';
import PropTypes from 'prop-types';

// eslint-disable-next-line import/no-unresolved
import axios from 'axios'; // import axios from growi dependencies

import Attachment from '@client/js/components/PageAttachment/Attachment';

import RefsContext from '../util/RefsContext';
import TagCacheManagerFactory from '../util/TagCacheManagerFactory';

// eslint-disable-next-line no-unused-vars
import styles from '../../css/index.css';


export default class AttachmentList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isLoaded: false,
      isError: false,
      errorMessage: null,

      attachments: [],
    };

    this.tagCacheManager = TagCacheManagerFactory.getInstance();
  }

  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    const { refsContext } = this.props;

    // get state object cache
    const stateCache = this.tagCacheManager.getStateCache(refsContext);

    // check cache exists
    if (stateCache != null) {
      this.setState({
        ...stateCache,
        isLoading: false,
      });
      return; // go to render()
    }

    // parse
    try {
      refsContext.parse();
    }
    catch (err) {
      this.setState({
        isError: true,
        errorMessage: err.toString(),
      });

      // store to sessionStorage
      this.tagCacheManager.cacheState(refsContext, this.state);

      return;
    }

    this.loadContents();
  }

  async loadContents() {
    const { refsContext } = this.props;

    let res;
    try {
      this.setState({ isLoading: true });

      res = await axios.get('/_api/plugin/ref', {
        params: {
          pagePath: refsContext.pagePath,
          fileName: refsContext.fileName,
          options: refsContext.options,
        },
      });

      this.setState({
        isLoaded: true,
        attachments: [res.data.attachment],
      });
    }
    catch (err) {
      this.setState({
        isError: true,
        errorMessage: err.response.data,
      });

      return;
    }
    finally {
      this.setState({ isLoading: false });

      // store to sessionStorage
      this.tagCacheManager.cacheState(refsContext, this.state);
    }

  }

  renderContents() {
    const { refsContext } = this.props;

    if (this.state.isLoading) {
      return (
        <div className="text-muted">
          <i className="fa fa-spinner fa-pulse mr-1"></i>
          <span className="attachment-refs-blink">{refsContext.tagExpression}</span>
        </div>
      );
    }
    if (this.state.errorMessage != null) {
      return (
        <div className="text-warning">
          <i className="fa fa-exclamation-triangle fa-fw"></i>
          {refsContext.tagExpression} (-&gt; <small>{this.state.errorMessage}</small>)
        </div>
      );
    }
    if (this.state.isLoaded) {
      return (
        this.state.attachments.map((attachment) => {
          return <Attachment key={attachment._id} attachment={attachment} />;
        })
      );
    }
  }

  render() {
    return <div className="attachment-refs">{this.renderContents()}</div>;
  }

}

AttachmentList.propTypes = {
  appContainer: PropTypes.object.isRequired,
  refsContext: PropTypes.instanceOf(RefsContext).isRequired,
};
