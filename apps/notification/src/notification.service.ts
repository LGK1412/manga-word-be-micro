import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as firebase from "firebase-admin"

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>
  ) { }

  async sendPush(notification: any) {
    try {
      const tokens = Array.isArray(notification.deviceId)
        ? notification.deviceId
        : [notification.deviceId];

      const response = await firebase.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {}, // custom payload nếu cần
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "default",
          },
        },
        apns: {
          headers: { "apns-priority": "10" },
          payload: {
            aps: {
              contentAvailable: true,
              sound: "default",
            },
          },
        },
      });

      const successTokens: string[] = [];
      const failedTokens: string[] = [];

      response.responses.forEach((res, i) => {
        const token = tokens[i];
        if (res.success) {
          // console.log(`✅ Token ${token}, msgId: ${res.messageId}`);
          successTokens.push(token);
        } else {
          // console.error(`❌ Token ${token} failed:`, res.error);
          failedTokens.push(token);
          // 👉 Có thể xóa token lỗi khỏi DB ở đây
        }
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        successTokens,
        failedTokens,
      };
    } catch (error) {
      return { success: false, message: error };
    }
  }

  async createNotificatonForComment(notification: any) {
    const newNoti = new this.notificationModel({
      title: notification.title,
      body: notification.body,
      sender_id: notification.sender_id,
      receiver_id: notification.receiver_id,
    })
    // console.log(notification);
    const result = await newNoti.save()
    if (result._id) {
      return this.sendPush(notification)
    } else {
      return { success: false, message: 'Create notification failed' }
    }
  }

  async getAllNotiForUser(id: string) {
    return this.notificationModel.find({ receiver_id: id })
  }

  async markAsRead(id: string, user_id: string) {
    const existingNoti = await this.notificationModel.findOne({ _id: id, receiver_id: user_id });

    if (!existingNoti) {
      return { success: false, message: 'Notification not exists' }
    }

    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated = await this.notificationModel.findByIdAndUpdate(
      id,
      { is_read: true, expireAt },
      { new: true } // trả về bản cập nhật mới
    );

    if (!updated) {
      return { success: false, message: 'Can not mark notification as read' }
    }

    return updated;
  }

  async deleteNoti(id: string, user_id: string) {
    const existingNoti = await this.notificationModel.findOne({ _id: id, receiver_id: user_id });

    if (!existingNoti) {
      return { success: false, message: 'Notification not exists' }
    }

    return this.notificationModel.findByIdAndDelete(id)
  }

  async markAllAsRead(user_id: string) {
    // Tạo expireAt = 7 ngày từ bây giờ
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Cập nhật tất cả notifications của user
    const result = await this.notificationModel.updateMany(
      { receiver_id: user_id }, // filter
      { $set: { is_read: true, expireAt } } // update
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Do not have any notification to update' }
    }

    return {
      message: `Udpated ${result.modifiedCount} notification`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async saveNoti(id: string, user_id: string) {

    // Tìm notification theo id và receiver
    const existingNoti = await this.notificationModel.findOne({ _id: id, receiver_id: user_id });

    if (!existingNoti) {
      return { success: false, message: 'Notification not exists' }
    }

    let updatedFields: any = {};

    if ((existingNoti as any).is_save) {
      // Nếu đang saved, bỏ save và set expire 7 ngày sau
      updatedFields.is_save = false;
      updatedFields.expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Nếu chưa saved, set saved và expireAt = null
      updatedFields.is_save = true;
      updatedFields.expireAt = null;
    }

    // Luôn đánh dấu đã đọc
    updatedFields.is_read = true;

    const updated = await this.notificationModel.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true } // trả về document đã update
    );

    if (!updated) {
      return { success: false, message: 'Can not update notification' }
    }

    return updated;
  }
}
