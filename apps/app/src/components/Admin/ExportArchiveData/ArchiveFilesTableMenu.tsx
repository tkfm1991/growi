import React from 'react';

import { useTranslation } from 'next-i18next';

// import { toastSuccess, toastError } from '~/client/util/toastr';

type ArchiveFilesTableMenuProps = {
  fileName: string,
  onZipFileStatRemove: (fileName: string) => void,
}

const ArchiveFilesTableMenu = (props: ArchiveFilesTableMenuProps):JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="btn-group admin-user-menu dropdown">
      <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
        <span className="material-symbols-outlined">settings</span>
        <span className="caret"></span>
      </button>
      <ul className="dropdown-menu">
        <li className="dropdown-header">{t('admin:export_management.export_menu')}</li>
        <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => { window.location.href = `/admin/export/${props.fileName}` }}>
          <span className="material-symbols-outlined me-1">cloud_download</span> {t('admin:export_management.download')}
        </button>
        <button type="button" className="dropdown-item" role="button" onClick={() => props.onZipFileStatRemove(props.fileName)}>
          <span className="text-danger d-flex align-items-center">
            <span className="material-symbols-outlined me-1">delete</span> {t('admin:export_management.delete')}
          </span>
        </button>
      </ul>
    </div>
  );
};

export default ArchiveFilesTableMenu;
