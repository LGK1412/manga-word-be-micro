import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Chapter } from 'libs/Schema/chapter/chapter.schema';
import { ImageChapter } from 'libs/Schema/chapter/image-chapter.schema';
import { TextChapter } from 'libs/Schema/chapter/text-chapter.schema';
import { Types } from 'mongoose';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChapterService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel,
    @InjectModel(TextChapter.name) private textChapterModel,
    @InjectModel(ImageChapter.name) private imageChapterModel,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('STORY_SERVICE') private readonly storyClient: ClientProxy
  ) { }

  async createChapter(title: string, manga_id: string, price?: number, order?: number, isPublished?: boolean) {
    // 1) Tạo Chapter + khởi tạo cờ AI
    const chapter = await this.chapterModel.create({
      title,
      manga_id: new Types.ObjectId(manga_id),
      price: price ?? 0,
      order: order ?? 1,
      is_published: isPublished ?? false,

      // === AI flags (invalidate mặc định) ===
      ai_checked: false,
      ai_verdict: null,
      risk_score: null,
      policy_version: null,
      last_content_hash: null,
    });

    return chapter
  }

  async createTextChapter(author_id: string, title: string, manga_id: string, price?: number, order?: number, isPublished?: boolean, content?: string, is_completed?: boolean) {
    // Chưa có mấy cái achivement
    const existing_user = await lastValueFrom(this.userClient.send({ cmd: 'get-user-by-id' }, author_id))

    if (!existing_user) {
      return { success: false, message: 'Author not found' }
    }

    if (existing_user?.role !== 'author') {
      return { success: false, message: 'User is not an author' }
    }

    if (existing_user.status === 'ban') {
      return { success: false, message: 'User is banned' }
    }

    const story = await lastValueFrom(this.storyClient.send({ cmd: 'get-story-by-id' }, manga_id))

    if (!story) {
      return { success: false, message: 'Story not found' }
    }

    const chapter = await this.createChapter(title, manga_id, price, order, isPublished)

    try {
      // 2) Tạo TextChapter
      const text = await this.textChapterModel.create({
        chapter_id: chapter._id,
        content,
        is_completed: is_completed ?? false,
      });

      return { success: true, message: 'Text chapter created successfully' }
    } catch (error) {
      return { success: false, message: 'Text chapter created failed' }
    }
  }

  async updateTextChapter(author_id: string, chapter_id: string, title: string, price?: number, order?: number, isPublished?: boolean, content?: string, is_completed?: boolean) {
    // Chưa có mấy cái achivement
    const existing_user = await lastValueFrom(this.userClient.send({ cmd: 'get-user-by-id' }, author_id))

    if (!existing_user) {
      return { success: false, message: 'Author not found' }
    }

    if (existing_user?.role !== 'author') {
      return { success: false, message: 'User is not an author' }
    }

    if (existing_user.status === 'ban') {
      return { success: false, message: 'User is banned' }
    }

    const chapter = await this.chapterModel.findById(chapter_id)

    if (!chapter) {
      return { success: false, message: 'Chapter not found' }
    }

    // 1) Lấy chapter cũ để check publish transition
    // const wasPublished = chapter?.is_published || false;

    // 2) Check xem nội dung có thay đổi không (để invalidate AI)
    const contentChanged = (content !== undefined) || (title !== undefined);

    // 3) Update chapter trước
    const updateChapter = await this.chapterModel.findByIdAndUpdate(
      chapter_id,
      {
        ...(title !== undefined && { title }),
        ...(price !== undefined && { price }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { is_published: isPublished }),
      },
      { new: true }, // return updated doc
    );

    // 4) Update textChapter (nếu có)
    if (content !== undefined || is_completed !== undefined) {
      const text = await this.textChapterModel.findOneAndUpdate(
        { chapter_id },
        {
          ...(content !== undefined && { content }),
          ...(is_completed !== undefined && { is_completed }),
        },
        { new: true },
      );
    }

    // 5) Nếu nội dung/tiêu đề thay đổi → Invalidate AI flags + phát event
    if (contentChanged) {
      await this.chapterModel.updateOne(
        { _id: chapter_id },
        {
          $set: {
            ai_checked: false,
            ai_verdict: null,
            risk_score: null,
            policy_version: null,
            // không đụng last_content_hash vì chưa có hash mới
          },
        },
      );
    }

    return { success: true, message: 'Text chapter updated successfully' }
  }

  async createImageChapter(
    author_id: string,
    title: string,
    manga_id: string,
    price?: number,
    order?: number,
    is_published?: boolean,
    is_completed?: boolean,
    images?: string[],
  ) {
    const existing_user = await lastValueFrom(this.userClient.send({ cmd: 'get-user-by-id' }, author_id))

    if (!existing_user) {
      return { success: false, message: 'Author not found' }
    }

    if (existing_user?.role !== 'author') {
      return { success: false, message: 'User is not an author' }
    }

    if (existing_user.status === 'ban') {
      return { success: false, message: 'User is banned' }
    }

    const story = await lastValueFrom(this.storyClient.send({ cmd: 'get-story-by-id' }, manga_id))

    if (!story) {
      return { success: false, message: 'Story not found' }
    }

    // 1. TẠO CHAPTER
    const chapter = await this.createChapter(
      title,
      manga_id,
      price,
      order,
      is_published,
    )

    try {
      // 2. TẠO IMAGE-CHAPTER
      const imageChapter = await this.imageChapterModel.create({
        chapter_id: chapter._id,
        images,
        is_completed,
      })

      // // 3. Emit count
      // const manga = await this.mangaModel.findById(manga_id).select('authorId')
      // if (manga?.authorId) {
      //   this.eventEmitter.emit('chapter_create_count', {
      //     userId: manga.authorId.toString(),
      //   })
      // }

      return {
        success: true,
        chapter_id: chapter._id.toString(),
        message: 'Image chapter created successfully',
      }
    } catch (err) {
      console.error('Create image chapter failed:', err)
      return {
        success: false,
        message: 'Create image chapter failed',
      }
    }
  }

  async updateImageChapter(data: {
    chapter_id: string
    title?: string
    price?: number
    order?: number
    is_published?: boolean
    is_completed?: boolean
    images?: string[]
  }) {
    try {
      // 1. Update thông tin cơ bản của Chapter (Title, Price, Order...)
      const chapter = await this.chapterModel.findByIdAndUpdate(
        data.chapter_id,
        {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.is_published !== undefined && {
            is_published: data.is_published,
          }),
        },
        { new: true },
      )

      if (!chapter) {
        return { success: false, message: 'Chapter not found' }
      }

      // 2. Tìm ImageChapter, nếu chưa có thì tạo mới (Logic an toàn)
      let imageChapter = await this.imageChapterModel.findOne({
        chapter_id: chapter._id,
      })

      if (!imageChapter) {
        imageChapter = new this.imageChapterModel({
          chapter_id: chapter._id,
          images: [],
          is_completed: false,
        })
      }

      // 3. Chuẩn bị dữ liệu để so sánh
      const oldImages = imageChapter.images || []
      const newImages = data.images || [] // List này đã được sort từ API Gateway

      // 4. Tính toán ảnh cần xoá (Có trong DB cũ nhưng không còn trong list mới)
      const images_to_delete = oldImages.filter(
        (img) => !newImages.includes(img),
      )

      // 5. Cập nhật dữ liệu mới vào DB
      imageChapter.images = newImages

      if (data.is_completed !== undefined) {
        imageChapter.is_completed = data.is_completed
      }

      await imageChapter.save()

      // 6. Trả về kết quả kèm danh sách ảnh cần xóa (để Gateway xóa file)
      return {
        success: true,
        chapter_id: chapter._id.toString(),
        images_to_delete,
      }
    } catch (err) {
      console.error('Update image chapter failed:', err)
      return { success: false, message: 'Update image chapter failed' }
    }
  }

}