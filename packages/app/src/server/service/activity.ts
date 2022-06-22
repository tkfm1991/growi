import mongoose from 'mongoose';

import {
  IActivity, SupportedActionType, ActionGroupSize, AllSupportedAction,
  AllSmallGroupActions, AllMediumGroupActions, AllLargeGroupActions, AllSupportedActionToNotified,
} from '~/interfaces/activity';
import { IPage } from '~/interfaces/page';
import Activity from '~/server/models/activity';

import loggerFactory from '../../utils/logger';
import Crowi from '../crowi';


const logger = loggerFactory('growi:service:ActivityService');

const parseActionString = (actionsString: string): SupportedActionType[] => {
  if (actionsString == null) {
    return [];
  }

  const actions = (actionsString as string).split(',').map(value => value.trim()) as SupportedActionType[];
  return actions.filter(action => AllSupportedAction.includes(action));
};

class ActivityService {

  crowi!: Crowi;

  activityEvent: any;

  constructor(crowi: Crowi) {
    this.crowi = crowi;
    this.activityEvent = crowi.event('activity');

    this.getAvailableActions = this.getAvailableActions.bind(this);
    this.shoudUpdateActivity = this.shoudUpdateActivity.bind(this);

    this.initActivityEventListeners();
  }

  initActivityEventListeners(): void {
    this.activityEvent.on('update', async(activityId: string, parameters, target?: IPage) => {
      let activity: IActivity;
      const shoudUpdate = this.shoudUpdateActivity(parameters.action);

      if (shoudUpdate) {
        try {
          activity = await Activity.updateByParameters(activityId, parameters);
        }
        catch (err) {
          logger.error('Update activity failed', err);
          return;
        }

        this.activityEvent.emit('updated', activity, target);
      }
    });
  }

  getAvailableActions = function(): SupportedActionType[] {
    const auditLogActionGroupSize = this.crowi.configManager.getConfig('crowi', 'app:auditLogActionGroupSize') || ActionGroupSize.Small;
    const auditLogAdditionalActions = this.crowi.configManager.getConfig('crowi', 'app:auditLogAdditionalActions');
    const auditLogExcludeActions = this.crowi.configManager.getConfig('crowi', 'app:auditLogExcludeActions');

    // Set base action group
    const availableActions: SupportedActionType[] = [];
    switch (auditLogActionGroupSize) {
      case ActionGroupSize.Small:
        availableActions.push(...AllSmallGroupActions);
        break;
      case ActionGroupSize.Medium:
        availableActions.push(...AllMediumGroupActions);
        break;
      case ActionGroupSize.Large:
        availableActions.push(...AllLargeGroupActions);
        break;
    }

    // Push additionalActions
    const additionalActions = parseActionString(auditLogAdditionalActions);
    availableActions.push(...additionalActions);

    // Filter with excludeActions
    const excludeActions = parseActionString(auditLogExcludeActions);
    const filteredAvailableActions = availableActions.filter(action => !excludeActions.includes(action));

    // Push essentialActions
    filteredAvailableActions.push(...AllSupportedActionToNotified);

    return Array.from(new Set(filteredAvailableActions));
  }

  shoudUpdateActivity = function(action: SupportedActionType): boolean {
    console.log(this.getAvailableActions());
    return this.getAvailableActions().includes(action);
  }

  createTtlIndex = async function() {
    const configManager = this.crowi.configManager;
    const activityExpirationSeconds = configManager != null ? configManager.getConfig('crowi', 'app:activityExpirationSeconds') : 2592000;
    const collection = mongoose.connection.collection('activities');

    try {
      const targetField = 'createdAt_1';

      const indexes = await collection.indexes();
      const foundCreatedAt = indexes.find(i => i.name === targetField);

      const isNotSpec = foundCreatedAt?.expireAfterSeconds == null || foundCreatedAt?.expireAfterSeconds !== activityExpirationSeconds;
      const shoudDropIndex = foundCreatedAt != null && isNotSpec;
      const shoudCreateIndex = foundCreatedAt == null || shoudDropIndex;

      if (shoudDropIndex) {
        await collection.dropIndex(targetField);
      }

      if (shoudCreateIndex) {
        await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: activityExpirationSeconds });
      }
    }
    catch (err) {
      logger.error('Failed to create TTL Index', err);
      throw err;
    }
  };

}

module.exports = ActivityService;
