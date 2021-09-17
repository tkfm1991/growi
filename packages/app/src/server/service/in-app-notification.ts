import Crowi from '../crowi';
import { InAppNotification } from '~/server/models/in-app-notification';

class InAppNotificationService {

  crowi!: any;

  socketIoService!: any;

  commentEvent!: any;


  constructor(crowi: Crowi) {
    this.crowi = crowi;
    this.socketIoService = crowi.socketIoService;
    this.commentEvent = crowi.event('comment');

    // init
    this.initCommentEvent();
  }

  initCommentEvent(): void {
    this.commentEvent.on('create', (user) => {
      this.commentEvent.onCreate();
    });

    this.commentEvent.on('update', (user) => {
      this.commentEvent.onUpdate();

      if (this.socketIoService.isInitialized) {
        this.socketIoService.getDefaultSocket().emit('comment updated', { user });
      }
    });

  }

  removeActivity = async function(activity) {
    const { _id, target, action } = activity;
    const query = { target, action };
    const parameters = { $pull: { activities: _id } };

    const result = await InAppNotification.updateMany(query, parameters);

    await InAppNotification.removeEmpty();

    return result;
  };

}

module.exports = InAppNotificationService;
