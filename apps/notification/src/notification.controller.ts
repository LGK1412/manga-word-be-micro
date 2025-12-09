import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  //Xài chung chỉ có title, body, id nhận, id gửi.
  @MessagePattern({ cmd: 'push-noti' })
  sendNotificationForCommentChapter(@Payload() pushNotification: any) {
    // console.log(pushNotification);
    return this.notificationService.createNotificatonForComment(pushNotification);
    // return true
  }

  @MessagePattern({ cmd: 'get-all-noti-for-user' })
  async getAllNotiForUser(@Payload() id: string) {
    return await this.notificationService.getAllNotiForUser(id)
  }

  @MessagePattern({ cmd: 'mark-as-read' })
  async markAsRead(@Payload() body: any) {
    const { id, user_id } = body
    return await this.notificationService.markAsRead(id, user_id)
  }

  @MessagePattern({ cmd: 'mark-all-as-read' })
  async markAllAsRead(@Payload() body: any) {
    const { user_id } = body
    return await this.notificationService.markAllAsRead(user_id)
  }

  @MessagePattern({ cmd: 'delete-noti' })
  async deleteNoti(@Payload() body: any) {
    const { id, user_id } = body
    return await this.notificationService.deleteNoti(id, user_id)
  }

  @MessagePattern({ cmd: 'save-noti' })
  async saveNoti(@Payload() body: any) {
    const { id, user_id } = body

    return await this.notificationService.saveNoti(id, user_id)
  }
}
