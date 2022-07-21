/* eslint-disable react/no-danger */
import React from 'react';

import PropTypes from 'prop-types';

import AdminLocalSecurityContainer from '~/client/services/AdminLocalSecurityContainer';
import { toastError } from '~/client/util/apiNotification';
import { toArrayIfNot } from '~/utils/array-utils';

import { withUnstatedContainers } from '../../UnstatedUtils';

import LocalSecuritySettingContents from './LocalSecuritySettingContents';

let retrieveErrors = null;
function LocalSecuritySetting(props) {
  const { adminLocalSecurityContainer } = props;
  if (adminLocalSecurityContainer.state.registrationMode === adminLocalSecurityContainer.dummyRegistrationMode) {
    throw (async() => {
      try {
        await adminLocalSecurityContainer.retrieveSecurityData();
      }
      catch (err) {
        const errs = toArrayIfNot(err);
        toastError(errs);
        retrieveErrors = errs;
        adminLocalSecurityContainer.setState({ registrationMode: adminLocalSecurityContainer.dummyRegistrationModeForError });
      }
    })();
  }

  if (adminLocalSecurityContainer.state.registrationMode === adminLocalSecurityContainer.dummyRegistrationModeForError) {
    throw new Error(`${retrieveErrors.length} errors occured`);
  }

  return <LocalSecuritySettingContents />;
}

LocalSecuritySetting.propTypes = {
  adminLocalSecurityContainer: PropTypes.instanceOf(AdminLocalSecurityContainer).isRequired,
};

const LocalSecuritySettingWithUnstatedContainer = withUnstatedContainers(LocalSecuritySetting, [
  AdminLocalSecurityContainer,
]);

export default LocalSecuritySettingWithUnstatedContainer;
