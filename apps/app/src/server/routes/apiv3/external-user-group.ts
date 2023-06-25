import { ErrorV3 } from '@growi/core';
import { Router, Request } from 'express';
import {
  body, param, query, validationResult,
} from 'express-validator';

import { SupportedAction } from '~/interfaces/activity';
import Crowi from '~/server/crowi';
import { generateAddActivityMiddleware } from '~/server/middlewares/add-activity';
import { apiV3FormValidator } from '~/server/middlewares/apiv3-form-validator';
import ExternalUserGroup from '~/server/models/external-user-group';
import { ApiV3Response } from '~/server/routes/apiv3/interfaces/apiv3-response';
import { configManager } from '~/server/service/config-manager';
import LdapUserGroupSyncService from '~/server/service/external-group/ldap-user-group-sync-service';
import loggerFactory from '~/utils/logger';

const logger = loggerFactory('growi:routes:apiv3:external-user-group');

const router = Router();

interface AuthorizedRequest extends Request {
  user?: any
}

module.exports = (crowi: Crowi): Router => {
  const loginRequiredStrictly = require('~/server/middlewares/login-required')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);
  const addActivity = generateAddActivityMiddleware(crowi);

  const activityEvent = crowi.event('activity');

  const validators = {
    ldapSyncSettings: [
      body('ldapGroupSearchBase').optional({ nullable: true }).isString(),
      body('ldapGroupMembershipAttribute').exists({ checkFalsy: true }).isString(),
      body('ldapGroupMembershipAttributeType').exists({ checkFalsy: true }).isString(),
      body('ldapGroupChildGroupAttribute').exists({ checkFalsy: true }).isString(),
      body('autoGenerateUserOnLdapGroupSync').exists().isBoolean(),
      body('preserveDeletedLdapGroups').exists().isBoolean(),
      body('ldapGroupNameAttribute').optional({ nullable: true }).isString(),
      body('ldapGroupDescriptionAttribute').optional({ nullable: true }).isString(),
    ],
    listChildren: [
      query('parentIds').optional().isArray(),
      query('includeGrandChildren').optional().isBoolean(),
    ],
    update: [
      body('description').optional().isString(),
    ],
    delete: [
      param('id').trim().exists({ checkFalsy: true }),
      query('actionName').trim().exists({ checkFalsy: true }),
      query('transferToUserGroupId').trim(),
    ],
  };

  router.get('/', loginRequiredStrictly, adminRequired, async(req: AuthorizedRequest, res: ApiV3Response) => {
    const { query } = req;

    try {
      const page = query.page != null ? parseInt(query.page as string) : undefined;
      const limit = query.limit != null ? parseInt(query.limit as string) : undefined;
      const offset = query.offset != null ? parseInt(query.offset as string) : undefined;
      const pagination = query.pagination != null ? query.pagination !== 'false' : undefined;

      const result = await ExternalUserGroup.findWithPagination({
        page, limit, offset, pagination,
      });
      const { docs: userGroups, totalDocs: totalUserGroups, limit: pagingLimit } = result;
      return res.apiv3({ userGroups, totalUserGroups, pagingLimit });
    }
    catch (err) {
      const msg = 'Error occurred in fetching external user group list';
      logger.error('Error', err);
      return res.apiv3Err(new ErrorV3(msg));
    }
  });

  router.get('/children', loginRequiredStrictly, adminRequired, validators.listChildren, async(req, res) => {
    try {
      const { parentIds, includeGrandChildren = false } = req.query;

      const externalUserGroupsResult = await ExternalUserGroup.findChildrenByParentIds(parentIds, includeGrandChildren);
      return res.apiv3({
        childUserGroups: externalUserGroupsResult.childUserGroups,
        grandChildUserGroups: externalUserGroupsResult.grandChildUserGroups,
      });
    }
    catch (err) {
      const msg = 'Error occurred in fetching child user group list';
      logger.error(msg, err);
      return res.apiv3Err(new ErrorV3(msg));
    }
  });

  router.delete('/:id', loginRequiredStrictly, adminRequired, validators.delete, apiV3FormValidator, addActivity,
    async(req: AuthorizedRequest, res: ApiV3Response) => {
      const { id: deleteGroupId } = req.params;
      const { actionName, transferToUserGroupId } = req.query;

      try {
        const userGroups = await crowi.userGroupService.removeCompletelyByRootGroupId(deleteGroupId, actionName, transferToUserGroupId, req.user, true);

        const parameters = { action: SupportedAction.ACTION_ADMIN_USER_GROUP_DELETE };
        activityEvent.emit('update', res.locals.activity._id, parameters);

        return res.apiv3({ userGroups });
      }
      catch (err) {
        const msg = 'Error occurred while deleting user groups';
        logger.error(msg, err);
        return res.apiv3Err(new ErrorV3(msg));
      }
    });

  router.put('/:id', loginRequiredStrictly, adminRequired, validators.update, apiV3FormValidator, addActivity, async(req, res: ApiV3Response) => {
    const { id } = req.params;
    const {
      description,
    } = req.body;

    try {
      const externalUserGroup = await ExternalUserGroup.findOneAndUpdate({ _id: id }, { description });

      const parameters = { action: SupportedAction.ACTION_ADMIN_USER_GROUP_UPDATE };
      activityEvent.emit('update', res.locals.activity._id, parameters);

      return res.apiv3({ externalUserGroup });
    }
    catch (err) {
      const msg = 'Error occurred in updating an external user group';
      logger.error(msg, err);
      return res.apiv3Err(new ErrorV3(msg));
    }
  });

  router.get('/ldap/sync-settings', loginRequiredStrictly, adminRequired, validators.ldapSyncSettings, (req: AuthorizedRequest, res: ApiV3Response) => {
    const settings = {
      ldapGroupSearchBase: configManager?.getConfig('crowi', 'external-user-group:ldap:groupSearchBase'),
      ldapGroupMembershipAttribute: configManager?.getConfig('crowi', 'external-user-group:ldap:groupMembershipAttribute'),
      ldapGroupMembershipAttributeType: configManager?.getConfig('crowi', 'external-user-group:ldap:groupMembershipAttributeType'),
      ldapGroupChildGroupAttribute: configManager?.getConfig('crowi', 'external-user-group:ldap:groupChildGroupAttribute'),
      autoGenerateUserOnLdapGroupSync: configManager?.getConfig('crowi', 'external-user-group:ldap:autoGenerateUserOnGroupSync'),
      preserveDeletedLdapGroups: configManager?.getConfig('crowi', 'external-user-group:ldap:preserveDeletedGroups'),
      ldapGroupNameAttribute: configManager?.getConfig('crowi', 'external-user-group:ldap:groupNameAttribute'),
      ldapGroupDescriptionAttribute: configManager?.getConfig('crowi', 'external-user-group:ldap:groupDescriptionAttribute'),
    };

    return res.apiv3(settings);
  });

  router.put('/ldap/sync-settings', loginRequiredStrictly, adminRequired, validators.ldapSyncSettings, async(req: AuthorizedRequest, res: ApiV3Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.apiv3Err('external_user_group.invalid_sync_settings', 400);
    }

    const params = {
      'external-user-group:ldap:groupSearchBase': req.body.ldapGroupSearchBase,
      'external-user-group:ldap:groupMembershipAttribute': req.body.ldapGroupMembershipAttribute,
      'external-user-group:ldap:groupMembershipAttributeType': req.body.ldapGroupMembershipAttributeType,
      'external-user-group:ldap:groupChildGroupAttribute': req.body.ldapGroupChildGroupAttribute,
      'external-user-group:ldap:autoGenerateUserOnGroupSync': req.body.autoGenerateUserOnLdapGroupSync,
      'external-user-group:ldap:preserveDeletedGroups': req.body.preserveDeletedLdapGroups,
      'external-user-group:ldap:groupNameAttribute': req.body.ldapGroupNameAttribute,
      'external-user-group:ldap:groupDescriptionAttribute': req.body.ldapGroupDescriptionAttribute,
    };

    if (params['external-user-group:ldap:groupNameAttribute'] == null || params['external-user-group:ldap:groupNameAttribute'] === '') {
      // default is cn
      params['external-user-group:ldap:groupNameAttribute'] = 'cn';
    }

    try {
      await configManager.updateConfigsInTheSameNamespace('crowi', params, true);
      return res.apiv3({}, 204);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(err, 500);
    }
  });

  router.put('/ldap/sync', loginRequiredStrictly, adminRequired, async(req: AuthorizedRequest, res: ApiV3Response) => {
    try {
      const ldapUserGroupSyncService = new LdapUserGroupSyncService(crowi, req.user.name, req.body.password);
      await ldapUserGroupSyncService.syncExternalUserGroups();
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(err.message, 500);
    }

    return res.apiv3({}, 204);
  });

  return router;

};
